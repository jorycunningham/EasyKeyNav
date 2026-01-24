// Background service worker for EasyKeyNav

chrome.runtime.onInstalled.addListener(() => {
  console.log('EasyKeyNav extension installed');
  // Set default state
  chrome.storage.sync.set({ enabled: true });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getState') {
    chrome.storage.sync.get(['enabled'], (result) => {
      sendResponse({ enabled: result.enabled !== false });
    });
    return true; // Keep the message channel open for async response
  }
});
