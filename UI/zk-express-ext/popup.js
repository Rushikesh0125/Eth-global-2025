// This script runs in the extension's popup.

const injectBtn = document.getElementById("injectBtn");

injectBtn.addEventListener("click", async () => {
  // Get the current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Execute the content script on the active tab
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });
});
