// Background script for Limo Anywhere Assistant extension

// Listen for installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('Limo Anywhere Assistant installed or updated');
  
  // Initialize storage with default settings if needed
  chrome.storage.local.get('settings', (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          aiProvider: 'local',
          confidenceThreshold: 0.5,
          highlightFields: true,
          autoFill: false
        }
      });
    }
  });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);

  // Handle different message types
  switch (message.action) {
    case 'processText':
      processText(message.text, sendResponse);
      return true; // Keep the message channel open for async response
    
    case 'processImage':
      processImage(message.imageData, sendResponse);
      return true;
    
    case 'fillForm':
      forwardToActiveTab(message, sendResponse);
      return true;
    
    case 'resizePopup':
      // This doesn't actually do anything directly, 
      // but it forces Chrome to redraw the popup at its new size
      return true;
  }
});

// Process text using AI (placeholder implementation)
function processText(text, sendResponse) {
  console.log('Processing text:', text);
  
  // In a real implementation, we would call an AI service API here
  // For now, we'll just forward to the AI processor in the popup
  // The popup will handle this directly
  sendResponse({
    success: true,
    message: "Text processing request received"
  });
}

// Process image using OCR and AI (placeholder implementation)
function processImage(imageData, sendResponse) {
  console.log('Processing image...');
  
  // In a real implementation, we would:
  // 1. Send the image to an OCR service
  // 2. Process the extracted text with AI
  // For now, we'll just acknowledge the request
  sendResponse({
    success: true,
    message: "Image processing request received"
  });
}

// Forward a message to the active tab
function forwardToActiveTab(message, sendResponse) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length === 0) {
      sendResponse({
        success: false,
        error: 'No active tab found'
      });
      return;
    }
    
    const activeTab = tabs[0];
    if (!activeTab.url.includes('mylimobiz.com')) {
      sendResponse({
        success: false,
        error: 'Active tab is not on Limo Anywhere website'
      });
      return;
    }
    
    chrome.tabs.sendMessage(activeTab.id, message, (response) => {
      sendResponse(response);
    });
  });
}