# Accessibility Guidelines - WCAG 2.2 AA Compliance

This Chrome extension follows **WCAG 2.2 Level AA** accessibility standards. This document outlines the accessibility features implemented and guidelines for maintaining compliance.

## Table of Contents
- [Overview](#overview)
- [Implemented Features](#implemented-features)
- [Testing Checklist](#testing-checklist)
- [Maintenance Guidelines](#maintenance-guidelines)
- [Resources](#resources)

## Overview

EasyKeyNav is built with accessibility as a core principle. All features are designed to:
- Work with screen readers (NVDA, JAWS, VoiceOver)
- Support keyboard-only navigation
- Respect user preferences (reduced motion, color schemes)
- Maintain proper color contrast ratios
- Not interfere with existing assistive technologies

## Implemented Features

### 1. Semantic HTML (WCAG 1.3.1, 4.1.2)
- ✅ Proper use of landmarks (`<main>`, `<nav>`)
- ✅ Correct heading hierarchy
- ✅ Meaningful HTML elements over generic divs

**Files:** [popup.html](popup.html)

### 2. Keyboard Accessibility (WCAG 2.1.1, 2.1.2, 2.4.7)
- ✅ All interactive elements are keyboard accessible
- ✅ Visible focus indicators on all interactive elements
- ✅ No keyboard traps
- ✅ Logical tab order
- ✅ Skip links for efficient navigation

**Files:** [popup.css](popup.css), [content.js](content.js)

**Keyboard Shortcuts (Cross-platform compatible):**
- `Tab` / `Shift+Tab`: Navigate between interactive elements
- `h`: Navigate to next heading (cycles through all h1-h6 and role="heading" elements)
- `Shift+H`: Navigate to previous heading
- `l`: Navigate to next landmark (banner, navigation, main, complementary, etc.)
- `Shift+L`: Navigate to previous landmark
- `Alt+Shift+M` (Option+Shift+M on Mac): Skip to main content
- `Alt+Shift+H` (Option+Shift+H on Mac): Go to main heading (h1)
- `Alt+Shift+N` (Option+Shift+N on Mac): Go to navigation
- `Ctrl+/` (Cmd+/ on Mac): Toggle keyboard shortcuts help dialog
- `Escape`: Close help dialog

All shortcuts work identically on Windows, Mac, and Linux. On Mac, the Alt key is the Option (⌥) key and Ctrl is Command (⌘).

### 3. Heading Navigation (WCAG 2.4.6, 2.4.10)
- ✅ Navigate through all headings using `h` and `Shift+H` keys
- ✅ Supports both HTML heading tags (h1-h6) and ARIA `role="heading"` elements
- ✅ Automatically makes headings focusable with `tabindex="-1"` when needed
- ✅ Screen readers automatically announce focused headings (no additional ARIA needed)
- ✅ Ignores hidden headings (display:none, visibility:hidden, aria-hidden)
- ✅ Maintains document order for consistent navigation
- ✅ Only active when NOT typing in form fields or editable content

This feature mirrors the heading navigation found in screen readers like NVDA and JAWS, making it familiar to assistive technology users while being available to all keyboard users. Screen readers will naturally announce the heading level and text when each heading receives focus.

**Files:** [content.js](content.js:189-280)

### 4. Landmark Navigation (WCAG 2.4.1, 1.3.1)
- ✅ Navigate through all ARIA landmarks using `l` and `Shift+L` keys
- ✅ Supports explicit ARIA landmark roles: banner, navigation, main, complementary, contentinfo, search, form, region
- ✅ Supports implicit HTML landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`, `<section>`, `<form>`
- ✅ Correctly interprets contextual landmarks (e.g., `<header>` only creates banner when not nested in `<article>`/`<section>`)
- ✅ Automatically makes landmarks focusable with `tabindex="-1"` when needed
- ✅ Screen readers automatically announce focused landmarks with their roles and labels
- ✅ Ignores hidden landmarks (display:none, visibility:hidden, aria-hidden)
- ✅ Maintains document order for consistent navigation
- ✅ Only active when NOT typing in form fields or editable content

This feature mirrors the landmark navigation found in screen readers (NVDA uses 'd' for landmarks, JAWS uses ';'), providing all keyboard users with efficient page structure navigation. Screen readers will naturally announce the landmark role and label when each landmark receives focus.

**Supported landmarks:**
- **banner**: `<header>` (top-level only) or `role="banner"`
- **navigation**: `<nav>` or `role="navigation"`
- **main**: `<main>` or `role="main"`
- **complementary**: `<aside>` or `role="complementary"`
- **contentinfo**: `<footer>` (top-level only) or `role="contentinfo"`
- **search**: `role="search"`
- **form**: `<form>` with aria-label/aria-labelledby or `role="form"`
- **region**: `<section>` with aria-label/aria-labelledby or `role="region"`

**Files:** [content.js](content.js:389-622)

### 5. ARIA Implementation (WCAG 4.1.2, 4.1.3)
- ✅ `aria-pressed` on toggle button for state indication
- ✅ `aria-describedby` linking button to description
- ✅ `aria-live` regions for dynamic content announcements
- ✅ `role="status"` for status messages
- ✅ Proper ARIA labels on landmarks

**Files:** [popup.html](popup.html), [popup.js](popup.js), [content.js](content.js)

### 6. Color Contrast (WCAG 1.4.3)
All text meets **WCAG AA** contrast ratios:
- ✅ Normal text: minimum 4.5:1
- ✅ Large text (18pt+): minimum 3:1
- ✅ UI components: minimum 3:1

**Color Palette:**
```css
/* Light mode */
Background: #ffffff
Text: #1a1a1a (contrast ratio 16.1:1)
Secondary text: #4a4a4a (contrast ratio 7:1)
Button: #1a73e8 on white text (contrast ratio 4.6:1)

/* Dark mode */
Background: #202124
Text: #e8eaed (contrast ratio 13.8:1)
Secondary text: #bdc1c6 (contrast ratio 9.7:1)
Button: #8ab4f8 on dark text (contrast ratio 9.2:1)
```

**Files:** [popup.css](popup.css)

### 7. Focus Visible (WCAG 2.4.7, 2.4.11)
- ✅ 3px solid outline with 2px offset
- ✅ Uses `:focus-visible` to show focus only on keyboard navigation
- ✅ High contrast focus indicators (meets 3:1 ratio)

**Files:** [popup.css](popup.css)

### 8. User Preferences (WCAG 1.4.12, 2.3.3)
- ✅ `prefers-reduced-motion`: Disables animations
- ✅ `prefers-color-scheme`: Automatic dark mode
- ✅ `forced-colors`: High contrast mode support (Windows)

**Files:** [popup.css](popup.css)

### 9. Text Scaling (WCAG 1.4.4, 1.4.10)
- ✅ All text uses `rem` units (relative to user's base font size)
- ✅ Layout works at 200% zoom
- ✅ No horizontal scrolling at standard viewport sizes

**Files:** [popup.css](popup.css)

### 10. Screen Reader Support
- ✅ Status announcements in popup via ARIA live regions (for extension state changes)
- ✅ Proper element labeling (headings, landmarks automatically announced by screen readers)
- ✅ Visually hidden but screen reader accessible text
- ✅ Skip links (WCAG 2.4.1)
- ✅ Focus management leverages native screen reader announcements

**Note:** When navigating headings or landmarks, screen readers will automatically announce the focused element's role, level, and text. No additional ARIA live region announcements are needed, as this would be redundant.

**Files:** [popup.html](popup.html), [popup.js](popup.js), [content.js](content.js)

### 11. Keyboard Event Handling (WCAG 2.1.1)
The content script carefully avoids interfering with:
- ✅ Form inputs (INPUT, TEXTAREA, SELECT)
- ✅ Content editable areas
- ✅ ARIA widgets (combobox, listbox, tree, grid)
- ✅ Screen reader shortcuts (Caps Lock, Insert key)
- ✅ Browser keyboard shortcuts

**Files:** [content.js](content.js:54-82)

### 12. Non-Conflicting Shortcuts
The extension uses two types of keyboard shortcuts:

**Single-key shortcuts** (`h`, `Shift+H`, `l`, `Shift+L`) for frequent actions:
- Only active when NOT typing in form fields or editable content
- Mirrors common screen reader navigation patterns (h for headings, l for landmarks)
- Automatically disabled in INPUT, TEXTAREA, SELECT, and contenteditable elements

**Modified shortcuts** (`Alt+Shift+Key` / `Option+Shift+Key` on Mac) for landmark navigation:
- Avoid conflicts with browser shortcuts
- Avoid conflicts with screen reader shortcuts (NVDA, JAWS, VoiceOver)
- Avoid conflicts with operating system shortcuts
- Avoid conflicts with web application shortcuts

**Cross-platform compatibility:**
- All shortcuts explicitly check for Ctrl and Meta (Command) keys to prevent conflicts
- Uses `event.altKey` which works with both Alt (Windows/Linux) and Option (Mac)
- Platform detection ensures consistent behavior across operating systems
- No platform-specific code paths - same shortcuts work everywhere

**Files:** [content.js](content.js:96-163)

### 13. Cross-Platform Support (Windows, Mac, Linux)
- ✅ Automatic platform detection using navigator.userAgentData
- ✅ Keyboard shortcuts work identically on all platforms
- ✅ Documentation clarifies key names for each platform (Alt vs Option)
- ✅ No platform-specific functionality or restrictions
- ✅ Tested on Windows, macOS, and Linux

**Platform-specific key mappings:**
- Windows/Linux: `Alt` key = `event.altKey`
- macOS: `Option` (⌥) key = `event.altKey`
- All platforms: Shortcuts explicitly avoid Ctrl/Command conflicts

**Files:** [content.js](content.js:8-10)

### 14. Keyboard Shortcuts Help Dialog (WCAG 2.1.1, 2.4.7, 4.1.2)
- ✅ Accessible modal dialog triggered by Ctrl+/ (Windows/Linux) or Cmd+/ (Mac)
- ✅ Proper ARIA attributes (role="dialog", aria-modal="true", aria-labelledby)
- ✅ Focus trap keeps keyboard focus within the dialog
- ✅ Escape key closes the dialog
- ✅ Focus returns to previously focused element when closed
- ✅ All shortcuts listed with platform-specific key names
- ✅ High color contrast ratios (4.5:1 minimum)
- ✅ Dark mode support
- ✅ Respects prefers-reduced-motion preference
- ✅ Close button with accessible label

The help dialog provides users with a quick reference to all available keyboard shortcuts. It can be opened at any time (even when typing in form fields) to ensure users always have access to help.

**Files:** [content.js](content.js:668-838)

## Testing Checklist

### Manual Testing
- [ ] Test with keyboard only (unplug mouse)
- [ ] Tab through all interactive elements
- [ ] Verify visible focus indicators
- [ ] Test all keyboard shortcuts on your platform
- [ ] Zoom to 200% and verify layout

### Cross-Platform Testing
- [ ] **Windows**: Test with Alt+Shift shortcuts
- [ ] **macOS**: Test with Option+Shift shortcuts (verify key labels in docs)
- [ ] **Linux**: Test with Alt+Shift shortcuts
- [ ] Verify `h` and `Shift+H` work on all platforms
- [ ] Test in Chrome, Edge, and other Chromium browsers on each platform

### Screen Reader Testing
- [ ] **NVDA** (Windows): Test all features
- [ ] **JAWS** (Windows): Test all features
- [ ] **VoiceOver** (macOS): Test all features
- [ ] Verify all announcements are spoken
- [ ] Check that dynamic content changes are announced

### Automated Testing Tools
- [ ] [axe DevTools](https://www.deque.com/axe/devtools/): Run audit
- [ ] [WAVE](https://wave.webaim.org/): Scan for issues
- [ ] [Lighthouse](https://developer.chrome.com/docs/lighthouse/): Accessibility score 100
- [ ] Chrome DevTools: Check contrast ratios

### User Preference Testing
- [ ] Test with reduced motion enabled
- [ ] Test in dark mode
- [ ] Test with Windows High Contrast Mode
- [ ] Test with browser zoom at 200%

### Color Blindness Testing
- [ ] Test with [Color Oracle](https://colororacle.org/)
- [ ] Verify information is not conveyed by color alone

## Maintenance Guidelines

### When Adding New Features

1. **HTML Changes**
   - Use semantic HTML elements
   - Add appropriate ARIA attributes
   - Maintain heading hierarchy
   - Ensure all interactive elements are keyboard accessible

2. **CSS Changes**
   - Check color contrast ratios (use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/))
   - Use relative units (`rem`, `em`) instead of `px` for font sizes
   - Add focus styles for new interactive elements
   - Support `prefers-reduced-motion`, `prefers-color-scheme`, and `forced-colors`

3. **JavaScript Changes**
   - Update ARIA states when content changes (e.g., popup toggle state)
   - For navigation features, rely on native screen reader announcements of focused elements
   - Use ARIA live regions only for true dynamic content updates (not for navigation)
   - Don't trap keyboard focus
   - Avoid interfering with existing keyboard shortcuts
   - Test with keyboard only

4. **New Keyboard Shortcuts**
   - Use `Alt+Shift` modifier to avoid conflicts
   - Never override: Tab, Enter, Space, Escape, Arrow keys (unless in custom widget)
   - Document all shortcuts in UI and documentation
   - Check against common screen reader shortcuts

### Code Review Checklist

Before merging any code, verify:
- [ ] No accessibility regressions
- [ ] New features are keyboard accessible
- [ ] ARIA attributes are correct and necessary
- [ ] Color contrast meets WCAG AA standards
- [ ] Works with screen readers
- [ ] Respects user preferences
- [ ] No console errors about ARIA usage

## WCAG 2.2 Principles

All development follows the four POUR principles:

1. **Perceivable**: Information must be presentable to users in ways they can perceive
   - Provide text alternatives
   - Use sufficient color contrast
   - Support different sensory modalities

2. **Operable**: Interface components must be operable by all users
   - Keyboard accessible
   - Adequate time to interact
   - No content that causes seizures

3. **Understandable**: Information and UI must be understandable
   - Readable text
   - Predictable behavior
   - Input assistance

4. **Robust**: Content must work with current and future technologies
   - Valid HTML/ARIA
   - Compatible with assistive technologies
   - Works across browsers

## Resources

### Standards & Guidelines
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Chrome Extension Accessibility](https://developer.chrome.com/docs/extensions/mv3/a11y/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension for accessibility testing
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/) - Automated auditing
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/) - Desktop app for contrast testing

### Screen Readers
- [NVDA](https://www.nvaccess.org/) - Free screen reader for Windows
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) - Popular screen reader for Windows
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) - Built-in macOS screen reader

### Learning Resources
- [WebAIM](https://webaim.org/) - Web accessibility in mind
- [A11y Project](https://www.a11yproject.com/) - Community-driven accessibility resource
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) - Mozilla's accessibility documentation

## Questions or Issues?

If you find any accessibility issues or have questions about implementing accessible features, please:
1. Check the WCAG 2.2 guidelines
2. Test with assistive technologies
3. Consult the resources above
4. File an issue with detailed reproduction steps

Remember: **Accessibility is not a feature, it's a requirement.**
