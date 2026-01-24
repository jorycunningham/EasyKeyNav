document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleButton');
  const statusMessage = document.getElementById('status-message');

  // Load the current state
  chrome.storage.sync.get(['enabled'], function(result) {
    updateButtonState(result.enabled !== false);
  });

  // Handle toggle button click
  toggleButton.addEventListener('click', function() {
    chrome.storage.sync.get(['enabled'], function(result) {
      const newState = !(result.enabled !== false);
      chrome.storage.sync.set({ enabled: newState }, function() {
        updateButtonState(newState);
        announceStateChange(newState);

        // Send message to content script
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: 'toggle', enabled: newState },
              function() {
                // Handle any errors silently (content script may not be loaded on some pages)
                if (chrome.runtime.lastError) {
                  console.log('Could not send message to content script:', chrome.runtime.lastError.message);
                }
              }
            );
          }
        });
      });
    });
  });

  function updateButtonState(enabled) {
    // Update button text
    toggleButton.textContent = enabled ? 'Disable Extension' : 'Enable Extension';

    // Update ARIA pressed state
    toggleButton.setAttribute('aria-pressed', enabled.toString());
  }

  function announceStateChange(enabled) {
    // Announce state change to screen readers
    statusMessage.textContent = enabled
      ? 'Keyboard navigation enabled'
      : 'Keyboard navigation disabled';
  }
});
