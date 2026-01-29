// Content script for EasyKeyNav
// This script runs on web pages and handles accessible keyboard navigation
//
// Cross-platform support: Works on Windows, macOS, and Linux
// - Windows/Linux: Alt+Shift shortcuts
// - macOS: Option+Shift shortcuts (Alt key = Option key)
// - All platforms: h/Shift+H for heading navigation, l/Shift+L for landmark navigation

let isEnabled = true;
let skipLinksContainer = null;
let currentHeadingIndex = -1;
let lastHeadingsList = [];
let currentLandmarkIndex = -1;
let lastLandmarksList = [];
let helpDialogOpen = false;
let helpDialogElement = null;
let lastFocusedElement = null;

// Detect platform for cross-platform keyboard shortcut support
// Use userAgentData when available, fallback to userAgent
const isMac = (navigator.userAgentData?.platform || navigator.userAgent).toUpperCase().includes('MAC');

// Debug mode: Set to true to log focus changes (for development)
let DEBUG_FOCUS = false; // Will be loaded from storage

/**
 * Debug logger for focus changes (development only)
 * @param {string} action - Description of the action that caused the focus change
 */
function logFocusChange(action) {
  if (!DEBUG_FOCUS) return;

  const activeEl = document.activeElement;
  const tagName = activeEl.tagName.toLowerCase();
  const id = activeEl.id ? `#${activeEl.id}` : '';
  const classes = activeEl.className ? `.${activeEl.className.split(' ').join('.')}` : '';
  const role = activeEl.getAttribute('role') ? `[role="${activeEl.getAttribute('role')}"]` : '';
  const text = activeEl.textContent ? activeEl.textContent.trim().substring(0, 30) : '';
  const textPreview = text ? ` "${text}${text.length > 30 ? '...' : ''}"` : '';

  console.log(`[EasyKeyNav Focus] ${action} -> <${tagName}${id}${classes}${role}>${textPreview}`);

  // Apply visual scale effect in debug mode
  applyDebugScale(activeEl);
}

// Keep track of the currently scaled element
let currentlyScaledElement = null;

/**
 * Apply a visual scale effect to the focused element (debug mode only)
 * @param {Element} element - The element to scale
 */
function applyDebugScale(element) {
  if (!DEBUG_FOCUS) return;

  // Don't scale body or html elements
  if (element === document.body || element === document.documentElement) {
    return;
  }

  // Remove scale from previously scaled element
  if (currentlyScaledElement && currentlyScaledElement !== element) {
    currentlyScaledElement.style.transform = '';
    currentlyScaledElement.style.transition = '';
  }

  // Apply scale to the new element
  element.style.transition = 'transform 0.2s ease-out';
  element.style.transform = 'scale(1.05)';
  currentlyScaledElement = element;

  // Remove scale when element loses focus
  const removeScale = () => {
    if (element.style.transform === 'scale(1.05)') {
      element.style.transform = '';
      element.style.transition = '';
    }
    if (currentlyScaledElement === element) {
      currentlyScaledElement = null;
    }
  };

  element.addEventListener('blur', removeScale, { once: true });
}

// Initialize extension state
chrome.storage.sync.get(['enabled', 'debugMode'], (result) => {
  isEnabled = result.enabled !== false;
  DEBUG_FOCUS = result.debugMode === true;

  if (isEnabled) {
    initKeyboardNavigation();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'toggle') {
    isEnabled = request.enabled;
    if (isEnabled) {
      initKeyboardNavigation();
    } else {
      disableKeyboardNavigation();
    }
  }
});

function initKeyboardNavigation() {
  const platform = isMac ? 'macOS' : 'Windows/Linux';
  const modifierKey = isMac ? 'Option' : 'Alt';
  console.log(`EasyKeyNav: Keyboard navigation enabled on ${platform}`);
  console.log(`EasyKeyNav: Use ${modifierKey}+Shift+M/H/N for quick navigation`);
  console.log(`EasyKeyNav: Use h/Shift+H for heading navigation, l/Shift+L for landmark navigation`);
  console.log(`EasyKeyNav: Use ${modifierKey}+Shift+5/0 to tab 5/10 times`);
  console.log(`EasyKeyNav: Debug mode is ${DEBUG_FOCUS ? 'ON' : 'OFF'}`);
  document.addEventListener('keydown', handleKeyPress, { capture: true });
  addSkipLinks();
}

function disableKeyboardNavigation() {
  console.log('EasyKeyNav: Keyboard navigation disabled');
  document.removeEventListener('keydown', handleKeyPress, { capture: true });
  removeSkipLinks();
}

/**
 * Check if keyboard event should be ignored to preserve accessibility
 * @param {KeyboardEvent} event - The keyboard event
 * @returns {boolean} - True if event should be ignored
 */
function shouldIgnoreKeyEvent(event) {
  const target = event.target;

  // Ignore if user is typing in an input field
  const editableElements = ['INPUT', 'TEXTAREA', 'SELECT'];
  if (editableElements.includes(target.tagName)) {
    return true;
  }

  // Ignore if in contenteditable
  if (target.isContentEditable) {
    return true;
  }

  // Ignore if inside ARIA widgets (to not break their keyboard navigation)
  const ariaRoles = ['textbox', 'searchbox', 'combobox', 'listbox', 'tree', 'grid'];
  const role = target.getAttribute('role');
  if (role && ariaRoles.includes(role)) {
    return true;
  }

  // Don't interfere with screen reader shortcuts (common modifiers)
  // Screen readers typically use: Insert, Caps Lock, or specific modifier combos
  if (event.getModifierState('CapsLock')) {
    return true;
  }

  return false;
}

/**
 * Handle keyboard events with accessibility in mind
 * Cross-platform support: Works on Windows, Mac, and Linux
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyPress(event) {
  // Ctrl+/ (Windows/Linux) or Cmd+/ (Mac): Toggle help dialog
  // This should work even when typing in form fields for accessibility
  if (event.key === '/' && ((event.ctrlKey && !isMac) || (event.metaKey && isMac)) && !event.altKey && !event.shiftKey) {
    event.preventDefault();
    toggleHelpDialog();
    return;
  }

  // Escape: Close help dialog if open
  if (event.key === 'Escape' && helpDialogOpen) {
    event.preventDefault();
    closeHelpDialog();
    return;
  }

  // Skip if event should be ignored for accessibility
  if (shouldIgnoreKeyEvent(event)) {
    return;
  }

  // Keyboard shortcuts - Cross-platform compatible
  // Note: On Mac, Alt key = Option key, Ctrl key = Control key, Meta key = Command key
  // We use Alt+Shift to avoid conflicts with browser/OS/screen reader shortcuts

  // Alt+Shift+H (Option+Shift+H on Mac): Go to main heading
  if (event.key === 'H' && event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    focusMainHeading();
    return;
  }

  // Alt+Shift+M (Option+Shift+M on Mac): Go to main content
  if (event.key === 'M' && event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    focusMainContent();
    return;
  }

  // Alt+Shift+N (Option+Shift+N on Mac): Go to navigation
  if (event.key === 'N' && event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    focusNavigation();
    return;
  }

  // Alt+Shift+5 (Option+Shift+5 on Mac): Tab forward 5 times
  // Note: event.key is '%' because that's what Shift+5 produces on US keyboards
  if (event.key === '%' && event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    tabMultipleTimes(5);
    return;
  }

  // Alt+Shift+0 (Option+Shift+0 on Mac): Tab forward 10 times
  // Note: event.key is ')' because that's what Shift+0 produces on US keyboards
  if (event.key === ')' && event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    tabMultipleTimes(10);
    return;
  }

  // H key: Navigate to next heading (cycles through all headings)
  // Works identically on all platforms
  if (event.key === 'h' && !event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    navigateToNextHeading();
    return;
  }

  // Shift+H: Navigate to previous heading
  // Works identically on all platforms
  if (event.key === 'H' && event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    navigateToPreviousHeading();
    return;
  }

  // L key: Navigate to next landmark (cycles through all ARIA landmarks)
  // Works identically on all platforms
  if (event.key === 'l' && !event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    navigateToNextLandmark();
    return;
  }

  // Shift+L: Navigate to previous landmark
  // Works identically on all platforms
  if (event.key === 'L' && event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    navigateToPreviousLandmark();
    return;
  }

  // Add your custom keyboard shortcuts here
  // Always use non-conflicting key combinations (e.g., Alt+Shift+Key)
  // Avoid using: Tab, Enter, Space, Arrow keys, Escape without good reason
  // These are essential for native keyboard navigation and screen readers
}

/**
 * Tab forward multiple times
 * @param {number} count - Number of times to tab
 */
function tabMultipleTimes(count) {
  // Get all focusable elements
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusableElements = Array.from(document.querySelectorAll(focusableSelector));

  if (focusableElements.length === 0) {
    return;
  }

  // Filter out hidden elements
  const visibleFocusable = focusableElements.filter(el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           el.offsetParent !== null;
  });

  if (visibleFocusable.length === 0) {
    return;
  }

  // Find current focused element index
  const currentIndex = visibleFocusable.indexOf(document.activeElement);

  // Calculate new index (wrap around if needed)
  let newIndex;
  if (currentIndex === -1) {
    // No element currently focused, start from beginning
    newIndex = Math.min(count - 1, visibleFocusable.length - 1);
  } else {
    newIndex = (currentIndex + count) % visibleFocusable.length;
  }

  // Focus the target element
  visibleFocusable[newIndex].focus();
  logFocusChange(`Tab ${count} times`);
}

/**
 * Focus the main heading (h1) on the page
 */
function focusMainHeading() {
  const heading = document.querySelector('h1');
  if (heading) {
    // Make heading focusable temporarily
    const originalTabIndex = heading.getAttribute('tabindex');
    heading.setAttribute('tabindex', '-1');
    heading.focus();
    logFocusChange('Focus main heading (Alt+Shift+H)');

    // Restore original tabindex after focus
    heading.addEventListener('blur', () => {
      if (originalTabIndex === null) {
        heading.removeAttribute('tabindex');
      } else {
        heading.setAttribute('tabindex', originalTabIndex);
      }
    }, { once: true });
  }
}

/**
 * Focus the main content area
 */
function focusMainContent() {
  // Look for main landmark or main element
  const main = document.querySelector('main, [role="main"]');
  if (main) {
    const originalTabIndex = main.getAttribute('tabindex');
    main.setAttribute('tabindex', '-1');
    main.focus();
    logFocusChange('Focus main content (Alt+Shift+M)');

    main.addEventListener('blur', () => {
      if (originalTabIndex === null) {
        main.removeAttribute('tabindex');
      } else {
        main.setAttribute('tabindex', originalTabIndex);
      }
    }, { once: true });
  }
}

/**
 * Focus the navigation area
 */
function focusNavigation() {
  const nav = document.querySelector('nav, [role="navigation"]');
  if (nav) {
    const originalTabIndex = nav.getAttribute('tabindex');
    nav.setAttribute('tabindex', '-1');
    nav.focus();
    logFocusChange('Focus navigation (Alt+Shift+N)');

    nav.addEventListener('blur', () => {
      if (originalTabIndex === null) {
        nav.removeAttribute('tabindex');
      } else {
        nav.setAttribute('tabindex', originalTabIndex);
      }
    }, { once: true });
  }
}

/**
 * Get all headings on the page (both HTML headings and ARIA role="heading")
 * @returns {Array<Element>} - Array of heading elements
 */
function getAllHeadings() {
  // Get HTML heading elements (h1-h6)
  const htmlHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

  // Get elements with role="heading"
  const ariaHeadings = Array.from(document.querySelectorAll('[role="heading"]'));

  // Combine both lists
  const allHeadings = [...htmlHeadings, ...ariaHeadings];

  // Remove duplicates (in case an element has both)
  const uniqueHeadings = allHeadings.filter((heading, index) =>
    allHeadings.indexOf(heading) === index
  );

  // Filter out hidden headings (display:none, visibility:hidden, or aria-hidden)
  const visibleHeadings = uniqueHeadings.filter(heading => {
    const style = window.getComputedStyle(heading);
    const isVisible = style.display !== 'none' &&
                     style.visibility !== 'hidden' &&
                     heading.getAttribute('aria-hidden') !== 'true';
    return isVisible;
  });

  // Sort by document order
  visibleHeadings.sort((a, b) => {
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1;
    } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    }
    return 0;
  });

  return visibleHeadings;
}

/**
 * Get the heading level for a heading element
 * @param {Element} heading - The heading element
 * @returns {number} - The heading level (1-6)
 */
function getHeadingLevel(heading) {
  // Check if it's an HTML heading tag
  const match = heading.tagName.match(/^H([1-6])$/);
  if (match) {
    return parseInt(match[1]);
  }

  // Check for aria-level attribute
  const ariaLevel = heading.getAttribute('aria-level');
  if (ariaLevel) {
    const level = parseInt(ariaLevel);
    return isNaN(level) ? 1 : Math.min(Math.max(level, 1), 6);
  }

  // Default to level 2 for role="heading" without aria-level
  return 2;
}

/**
 * Make an element focusable and focus it, preserving original tabindex
 * @param {Element} element - The element to focus
 * @param {string} action - Description of the action for debug logging
 */
function makeElementFocusableAndFocus(element, action) {
  const originalTabIndex = element.getAttribute('tabindex');

  // Make element focusable if it's not already
  if (originalTabIndex === null || originalTabIndex === undefined) {
    element.setAttribute('tabindex', '-1');
  }

  // Focus the element
  element.focus();
  if (action) {
    logFocusChange(action);
  }

  // Restore original tabindex after blur (if it wasn't already focusable)
  if (originalTabIndex === null) {
    element.addEventListener('blur', () => {
      element.removeAttribute('tabindex');
    }, { once: true });
  }
}

/**
 * Navigate to the next heading on the page
 */
function navigateToNextHeading() {
  const headings = getAllHeadings();

  if (headings.length === 0) {
    return;
  }

  // Update the list if it changed
  lastHeadingsList = headings;

  // Move to next heading
  currentHeadingIndex = (currentHeadingIndex + 1) % headings.length;

  const heading = headings[currentHeadingIndex];

  // Focus the heading
  const headingLevel = getHeadingLevel(heading);
  makeElementFocusableAndFocus(heading, `Navigate to next heading (h) - H${headingLevel}`);
}

/**
 * Navigate to the previous heading on the page
 */
function navigateToPreviousHeading() {
  const headings = getAllHeadings();

  if (headings.length === 0) {
    return;
  }

  // Update the list if it changed
  lastHeadingsList = headings;

  // Move to previous heading (wrap around if at the beginning)
  if (currentHeadingIndex <= 0) {
    currentHeadingIndex = headings.length - 1;
  } else {
    currentHeadingIndex = currentHeadingIndex - 1;
  }

  const heading = headings[currentHeadingIndex];

  // Focus the heading
  const headingLevel = getHeadingLevel(heading);
  makeElementFocusableAndFocus(heading, `Navigate to previous heading (Shift+H) - H${headingLevel}`);
}

/**
 * Get all landmarks on the page (both explicit ARIA roles and implicit HTML landmarks)
 * @returns {Array<Element>} - Array of landmark elements
 */
function getAllLandmarks() {
  const landmarks = [];

  // Explicit ARIA landmark roles
  const ariaLandmarkRoles = [
    'banner',
    'navigation',
    'main',
    'complementary',
    'contentinfo',
    'search',
    'form',
    'region'
  ];

  // Find elements with explicit ARIA landmark roles
  ariaLandmarkRoles.forEach(role => {
    const elements = document.querySelectorAll(`[role="${role}"]`);
    landmarks.push(...Array.from(elements));
  });

  // Find implicit HTML landmarks
  // <header> creates banner (unless nested in article/section)
  const headers = document.querySelectorAll('header');
  headers.forEach(header => {
    // Only if not nested in article or section
    if (!header.closest('article, section')) {
      landmarks.push(header);
    }
  });

  // <nav> creates navigation
  const navs = document.querySelectorAll('nav');
  landmarks.push(...Array.from(navs));

  // <main> creates main
  const mains = document.querySelectorAll('main');
  landmarks.push(...Array.from(mains));

  // <footer> creates contentinfo (unless nested in article/section)
  const footers = document.querySelectorAll('footer');
  footers.forEach(footer => {
    // Only if not nested in article or section
    if (!footer.closest('article, section')) {
      landmarks.push(footer);
    }
  });

  // <aside> creates complementary
  const asides = document.querySelectorAll('aside');
  landmarks.push(...Array.from(asides));

  // <section> with aria-label or aria-labelledby creates region
  const sections = document.querySelectorAll('section[aria-label], section[aria-labelledby]');
  landmarks.push(...Array.from(sections));

  // <form> with aria-label or aria-labelledby creates form landmark
  const forms = document.querySelectorAll('form[aria-label], form[aria-labelledby]');
  landmarks.push(...Array.from(forms));

  // Remove duplicates (in case an element has both explicit role and implicit)
  const uniqueLandmarks = landmarks.filter((landmark, index) =>
    landmarks.indexOf(landmark) === index
  );

  // Filter out hidden landmarks
  const visibleLandmarks = uniqueLandmarks.filter(landmark => {
    const style = window.getComputedStyle(landmark);
    const isVisible = style.display !== 'none' &&
                     style.visibility !== 'hidden' &&
                     landmark.getAttribute('aria-hidden') !== 'true';
    return isVisible;
  });

  // Sort by document order
  visibleLandmarks.sort((a, b) => {
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1;
    } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    }
    return 0;
  });

  return visibleLandmarks;
}

/**
 * Get the landmark role name for a landmark element
 * @param {Element} landmark - The landmark element
 * @returns {string} - The landmark role name
 */
function getLandmarkRole(landmark) {
  // Check for explicit role attribute
  const explicitRole = landmark.getAttribute('role');
  if (explicitRole) {
    return explicitRole;
  }

  // Determine implicit role from tag name
  const tagName = landmark.tagName.toLowerCase();

  switch (tagName) {
    case 'header':
      // Only banner if not nested in article/section
      return !landmark.closest('article, section') ? 'banner' : 'header';
    case 'nav':
      return 'navigation';
    case 'main':
      return 'main';
    case 'footer':
      // Only contentinfo if not nested in article/section
      return !landmark.closest('article, section') ? 'contentinfo' : 'footer';
    case 'aside':
      return 'complementary';
    case 'section':
      // Only region if has aria-label or aria-labelledby
      if (landmark.hasAttribute('aria-label') || landmark.hasAttribute('aria-labelledby')) {
        return 'region';
      }
      return 'section';
    case 'form':
      // Only form landmark if has aria-label or aria-labelledby
      if (landmark.hasAttribute('aria-label') || landmark.hasAttribute('aria-labelledby')) {
        return 'form';
      }
      return 'form (unlabeled)';
    default:
      return 'landmark';
  }
}

/**
 * Get a descriptive label for a landmark
 * @param {Element} landmark - The landmark element
 * @returns {string} - The landmark label
 */
function getLandmarkLabel(landmark) {
  // Check for aria-label
  const ariaLabel = landmark.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel;
  }

  // Check for aria-labelledby
  const labelledBy = landmark.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) {
      return labelElement.textContent.trim();
    }
  }

  // For nav elements, try to find a heading inside
  if (landmark.tagName.toLowerCase() === 'nav' || landmark.getAttribute('role') === 'navigation') {
    const heading = landmark.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      return heading.textContent.trim();
    }
  }

  // No label found
  return '';
}

/**
 * Navigate to the next landmark on the page
 */
function navigateToNextLandmark() {
  const landmarks = getAllLandmarks();

  if (landmarks.length === 0) {
    return;
  }

  // Update the list if it changed
  lastLandmarksList = landmarks;

  // Move to next landmark
  currentLandmarkIndex = (currentLandmarkIndex + 1) % landmarks.length;

  const landmark = landmarks[currentLandmarkIndex];

  // Focus the landmark
  const role = getLandmarkRole(landmark);
  const label = getLandmarkLabel(landmark);
  const landmarkDesc = label ? `${role} "${label}"` : role;
  makeElementFocusableAndFocus(landmark, `Navigate to next landmark (l) - ${landmarkDesc}`);
}

/**
 * Navigate to the previous landmark on the page
 */
function navigateToPreviousLandmark() {
  const landmarks = getAllLandmarks();

  if (landmarks.length === 0) {
    return;
  }

  // Update the list if it changed
  lastLandmarksList = landmarks;

  // Move to previous landmark (wrap around if at the beginning)
  if (currentLandmarkIndex <= 0) {
    currentLandmarkIndex = landmarks.length - 1;
  } else {
    currentLandmarkIndex = currentLandmarkIndex - 1;
  }

  const landmark = landmarks[currentLandmarkIndex];

  // Focus the landmark
  const role = getLandmarkRole(landmark);
  const label = getLandmarkLabel(landmark);
  const landmarkDesc = label ? `${role} "${label}"` : role;
  makeElementFocusableAndFocus(landmark, `Navigate to previous landmark (Shift+L) - ${landmarkDesc}`);
}

/**
 * Add skip links for better keyboard navigation (WCAG 2.4.1)
 */
function addSkipLinks() {
  // Don't add if already exists
  if (document.getElementById('easynav-skip-links')) {
    return;
  }

  skipLinksContainer = document.createElement('div');
  skipLinksContainer.id = 'easynav-skip-links';
  skipLinksContainer.setAttribute('role', 'navigation');
  skipLinksContainer.setAttribute('aria-label', 'EasyKeyNav shortcuts');

  // Styles for skip links (visible on focus)
  const style = document.createElement('style');
  style.textContent = `
    #easynav-skip-links {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 999999;
    }
    #easynav-skip-links a {
      position: absolute;
      left: -10000px;
      top: 0;
      width: 1px;
      height: 1px;
      overflow: hidden;
      background: #1a73e8;
      color: #fff;
      padding: 8px 16px;
      text-decoration: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      border-radius: 0 0 4px 0;
    }
    #easynav-skip-links a:focus {
      position: fixed;
      left: 0;
      width: auto;
      height: auto;
      overflow: visible;
      outline: 3px solid #fff;
      outline-offset: 2px;
    }
  `;

  skipLinksContainer.appendChild(style);

  // Add skip link to main content with platform-specific key labels
  const skipToMain = document.createElement('a');
  skipToMain.href = '#';
  const modifierKey = isMac ? 'Option' : 'Alt';
  skipToMain.textContent = `Skip to main content (${modifierKey}+Shift+M)`;
  skipToMain.addEventListener('click', (e) => {
    e.preventDefault();
    focusMainContent();
  });
  skipLinksContainer.appendChild(skipToMain);

  // Insert at the beginning of body
  if (document.body) {
    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }
}

/**
 * Remove skip links when extension is disabled
 */
function removeSkipLinks() {
  if (skipLinksContainer && skipLinksContainer.parentNode) {
    skipLinksContainer.parentNode.removeChild(skipLinksContainer);
    skipLinksContainer = null;
  }
}

/**
 * Toggle the keyboard shortcuts help dialog
 */
function toggleHelpDialog() {
  if (helpDialogOpen) {
    closeHelpDialog();
  } else {
    openHelpDialog();
  }
}

/**
 * Open the keyboard shortcuts help dialog
 */
function openHelpDialog() {
  if (helpDialogOpen) {
    return;
  }

  // Store the currently focused element to restore later
  lastFocusedElement = document.activeElement;

  // Create the dialog element
  helpDialogElement = document.createElement('div');
  helpDialogElement.id = 'easynav-help-dialog';
  helpDialogElement.setAttribute('role', 'dialog');
  helpDialogElement.setAttribute('aria-modal', 'true');
  helpDialogElement.setAttribute('aria-labelledby', 'easynav-help-title');
  helpDialogElement.setAttribute('aria-describedby', 'easynav-help-title easynav-help-intro');

  const modifierKey = isMac ? 'Option' : 'Alt';
  const helpKey = isMac ? 'Cmd' : 'Ctrl';

  // Build the dialog content
  helpDialogElement.innerHTML = `
    <style>
      #easynav-help-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2147483647;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }

      #easynav-help-content {
        background: #ffffff;
        color: #1a1a1a;
        border-radius: 8px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        padding: 2rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }

      #easynav-help-title {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #1a1a1a;
      }

      .easynav-visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      #easynav-help-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: transparent;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        color: #4a4a4a;
        line-height: 1;
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      #easynav-help-close:hover {
        background: #f0f0f0;
        color: #1a1a1a;
      }

      #easynav-help-close:focus-visible {
        outline: 3px solid #1a73e8;
        outline-offset: 2px;
      }

      .easynav-help-section {
        margin-bottom: 1.5rem;
      }

      .easynav-help-section:last-child {
        margin-bottom: 0;
      }

      .easynav-help-section h2 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.75rem 0;
        color: #1a1a1a;
      }

      .easynav-help-shortcut {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 0.5rem 0;
        border-bottom: 1px solid #e0e0e0;
      }

      .easynav-help-shortcut:last-child {
        border-bottom: none;
      }

      .easynav-help-description {
        color: #1a1a1a;
      }

      .easynav-help-keys {
        font-family: 'Courier New', Courier, monospace;
        background: #f5f5f5;
        color: #1a1a1a;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        font-weight: 600;
        white-space: nowrap;
        margin-left: 1rem;
      }

      .easynav-debug-toggle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-top: 2px solid #e0e0e0;
        margin-top: 1rem;
      }

      .easynav-debug-label {
        font-weight: 500;
        color: #1a1a1a;
      }

      .easynav-toggle-button {
        position: relative;
        width: 48px;
        height: 28px;
        background: #ccc;
        border: none;
        border-radius: 14px;
        cursor: pointer;
        transition: background-color 0.3s ease;
        padding: 0;
      }

      .easynav-toggle-button:focus-visible {
        outline: 3px solid #1a73e8;
        outline-offset: 2px;
      }

      .easynav-toggle-button[aria-pressed="true"] {
        background: #1a73e8;
      }

      .easynav-toggle-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 24px;
        height: 24px;
        background: #fff;
        border-radius: 12px;
        transition: transform 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .easynav-toggle-button[aria-pressed="true"] .easynav-toggle-slider {
        transform: translateX(20px);
      }

      @media (prefers-color-scheme: dark) {
        #easynav-help-content {
          background: #202124;
          color: #e8eaed;
        }

        #easynav-help-title,
        .easynav-help-section h2,
        .easynav-help-description {
          color: #e8eaed;
        }

        #easynav-help-close {
          color: #bdc1c6;
        }

        #easynav-help-close:hover {
          background: #3c4043;
          color: #e8eaed;
        }

        .easynav-help-shortcut {
          border-bottom-color: #3c4043;
        }

        .easynav-help-keys {
          background: #3c4043;
          color: #e8eaed;
        }

        .easynav-debug-toggle {
          border-top-color: #3c4043;
        }

        .easynav-debug-label {
          color: #e8eaed;
        }

        .easynav-toggle-button {
          background: #5f6368;
        }

        .easynav-toggle-button[aria-pressed="true"] {
          background: #8ab4f8;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #easynav-help-dialog {
          animation: none;
        }
      }
    </style>
    <div id="easynav-help-content">
      <button id="easynav-help-close" type="button" aria-label="Close help dialog">×</button>
      <h1 id="easynav-help-title">Keyboard Shortcuts</h1>
      <p id="easynav-help-intro" class="easynav-visually-hidden">
        Available keyboard shortcuts for navigating the page. Press Escape to close this dialog.
      </p>

      <div class="easynav-help-section">
        <h2>Heading Navigation</h2>
        <div class="easynav-help-shortcut">
          <span class="easynav-help-description">Navigate to next heading</span>
          <span class="easynav-help-keys">h</span>
        </div>
        <div class="easynav-help-shortcut">
          <span class="easynav-help-description">Navigate to previous heading</span>
          <span class="easynav-help-keys">Shift+H</span>
        </div>
        <div class="easynav-help-shortcut">
          <span class="easynav-help-description">Go to main heading (h1)</span>
          <span class="easynav-help-keys">${modifierKey}+Shift+H</span>
        </div>
      </div>

      <div class="easynav-help-section">
        <h2>Landmark Navigation</h2>
        <div class="easynav-help-shortcut">
          <span class="easynav-help-description">Navigate to next landmark</span>
          <span class="easynav-help-keys">l</span>
        </div>
        <div class="easynav-help-shortcut">
          <span class="easynav-help-description">Navigate to previous landmark</span>
          <span class="easynav-help-keys">Shift+L</span>
        </div>
        <div class="easynav-help-shortcut">
          <span class="easynav-help-description">Skip to main content</span>
          <span class="easynav-help-keys">${modifierKey}+Shift+M</span>
        </div>
        <div class="easynav-help-shortcut">
          <span class="easynav-help-description">Go to navigation</span>
          <span class="easynav-help-keys">${modifierKey}+Shift+N</span>
        </div>
      </div>

      <div class="easynav-help-section">
        <h2>Quick Tab Navigation</h2>
        <div class="easynav-help-shortcut">
          <span class="easynav-help-description">Tab forward 5 times</span>
          <span class="easynav-help-keys">${modifierKey}+Shift+5</span>
        </div>
        <div class="easynav-help-shortcut">
          <span class="easynav-help-description">Tab forward 10 times</span>
          <span class="easynav-help-keys">${modifierKey}+Shift+0</span>
        </div>
      </div>

      <div class="easynav-help-section">
        <h2>Help</h2>
        <div class="easynav-help-shortcut">
          <span class="easynav-help-description">Toggle this help dialog</span>
          <span class="easynav-help-keys">${helpKey}+/</span>
        </div>
        <div class="easynav-help-shortcut">
          <span class="easynav-help-description">Close this dialog</span>
          <span class="easynav-help-keys">Escape</span>
        </div>
        <div class="easynav-debug-toggle">
          <span class="easynav-debug-label">Debug mode on</span>
          <button
            id="easynav-debug-toggle-btn"
            class="easynav-toggle-button"
            type="button"
            role="switch"
            aria-pressed="${DEBUG_FOCUS ? 'true' : 'false'}"
            aria-label="Toggle debug mode">
            <span class="easynav-toggle-slider"></span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Append to body
  document.body.appendChild(helpDialogElement);

  // Set up close button
  const closeButton = helpDialogElement.querySelector('#easynav-help-close');
  closeButton.addEventListener('click', closeHelpDialog);

  // Set up debug toggle button
  const debugToggleBtn = helpDialogElement.querySelector('#easynav-debug-toggle-btn');
  debugToggleBtn.addEventListener('click', function() {
    DEBUG_FOCUS = !DEBUG_FOCUS;
    const isPressed = DEBUG_FOCUS;
    this.setAttribute('aria-pressed', isPressed.toString());
    console.log(`[EasyKeyNav] Debug mode ${isPressed ? 'enabled' : 'disabled'}`);

    // Persist debug mode to storage
    chrome.storage.sync.set({ debugMode: DEBUG_FOCUS });

    // If debug mode is turned off, remove scale from currently scaled element
    if (!DEBUG_FOCUS && currentlyScaledElement) {
      currentlyScaledElement.style.transform = '';
      currentlyScaledElement.style.transition = '';
      currentlyScaledElement = null;
    }
  });

  // Set up focus trap
  setupFocusTrap();

  // Close dialog when focus leaves it
  setupFocusOutHandler();

  // Focus the close button
  closeButton.focus();
  logFocusChange('Open help dialog (Ctrl+/ or Cmd+/)');

  helpDialogOpen = true;
}

/**
 * Close the keyboard shortcuts help dialog
 */
function closeHelpDialog() {
  if (!helpDialogOpen || !helpDialogElement) {
    return;
  }

  // Remove the dialog from the DOM
  if (helpDialogElement.parentNode) {
    helpDialogElement.parentNode.removeChild(helpDialogElement);
  }

  helpDialogElement = null;
  helpDialogOpen = false;

  // Restore focus to the previously focused element
  if (lastFocusedElement && document.contains(lastFocusedElement)) {
    lastFocusedElement.focus();
    logFocusChange('Close help dialog - restore previous focus');
  } else {
    // Fallback to skip links or body
    const skipLinks = document.getElementById('easynav-skip-links');
    if (skipLinks) {
      const skipLink = skipLinks.querySelector('a');
      if (skipLink) {
        skipLink.focus();
        logFocusChange('Close help dialog - focus fallback to skip link');
      }
    } else {
      document.body.focus();
      logFocusChange('Close help dialog - focus fallback to body');
    }
  }

  lastFocusedElement = null;
}

/**
 * Set up focus trap for the help dialog
 */
function setupFocusTrap() {
  if (!helpDialogElement) {
    return;
  }

  const focusableElements = helpDialogElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) {
    return;
  }

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  // Handle Tab key to trap focus
  helpDialogElement.addEventListener('keydown', function(event) {
    if (event.key !== 'Tab') {
      return;
    }

    // Shift+Tab on first element: go to last
    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
      return;
    }

    // Tab on last element: go to first
    if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
      return;
    }
  });
}

/**
 * Set up focus out handler to close dialog when focus leaves
 */
function setupFocusOutHandler() {
  if (!helpDialogElement) {
    return;
  }

  // Use a small delay to check if focus has moved outside the dialog
  // This prevents the dialog from closing during internal focus changes
  let focusCheckTimeout;

  helpDialogElement.addEventListener('focusout', function() {
    // Clear any pending timeout
    clearTimeout(focusCheckTimeout);

    // Wait a bit to see where focus goes
    focusCheckTimeout = setTimeout(() => {
      // Check if the newly focused element is outside the dialog
      const isInsideDialog = helpDialogElement && helpDialogElement.contains(document.activeElement);

      if (!isInsideDialog && helpDialogOpen) {
        closeHelpDialog();
      }
    }, 10);
  });
}
