import { ExtensionMessage } from '../types';

// Chrome extension background service worker listener
chrome.runtime.onInstalled.addListener(() => {
  console.log('[DOMSift] Background service worker initialized.');
});

// Handle incoming messages from popup or content script
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_FILE' && message.downloadData) {
    const { content, filename, mimeType } = message.downloadData;

    try {
      const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
      chrome.downloads.download(
        {
          url: dataUrl,
          filename,
          saveAs: true
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true, downloadId });
          }
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      sendResponse({ success: false, error: msg });
    }

    return true; // Keep response channel open for async callback
  }
});
