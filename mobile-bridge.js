// Mobile Bridge Module for Limo Anywhere Assistant

class MobileBridge {
  constructor() {
    this.sessionId = null;
    this.sessionExpiry = null;
    this.sessionStatus = 'inactive';
    this.uploadUrl = null;
    this.qrCodeUrl = null;
    this.checkInterval = null;
    this.callbacks = {
      onSessionCreated: null,
      onImageReceived: null,
      onSessionExpired: null,
      onSessionError: null
    };
  }

  // Initialize mobile bridge with callbacks
  initialize(callbacks = {}) {
    console.log('Mobile Bridge: Initializing...');
    
    // Store callbacks
    this.callbacks = {
      ...this.callbacks,
      ...callbacks
    };
    
    return true;
  }

  // Create a new upload session
  async createSession() {
    console.log('Mobile Bridge: Creating new session...');
    
    // Clear any existing session
    this.clearSession();
    
    try {
      // In a real implementation, we would create a server endpoint
      // For now, we'll simulate this with a mock session
      
      // Send message to background script to create session
      const response = await this.sendMessage({
        action: 'createMobileSession'
      });
      
      if (response && response.success) {
        this.sessionId = response.sessionId;
        this.sessionStatus = 'active';
        this.sessionExpiry = Date.now() + (10 * 60 * 1000); // 10 minutes
        this.qrCodeUrl = response.qrCodeUrl;
        
        // Start checking for uploads
        this.startSessionChecks();
        
        // Call the callback if provided
        if (this.callbacks.onSessionCreated) {
          this.callbacks.onSessionCreated({
            sessionId: this.sessionId,
            qrCodeUrl: this.qrCodeUrl,
            expiresIn: '10 minutes'
          });
        }
        
        return {
          success: true,
          sessionId: this.sessionId,
          qrCodeUrl: this.qrCodeUrl
        };
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Mobile Bridge: Error creating session', error);
      
      // Call the error callback if provided
      if (this.callbacks.onSessionError) {
        this.callbacks.onSessionError(error);
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Start periodic checks for uploaded images
  startSessionChecks() {
    // Clear any existing check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Check every 3 seconds for new uploads
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, 3000);
  }

  // Check session status and look for uploads
  async checkSession() {
    // Skip if session is inactive
    if (this.sessionStatus !== 'active' || !this.sessionId) {
      return;
    }
    
    try {
      // Check if session expired
      if (this.sessionExpiry && Date.now() > this.sessionExpiry) {
        this.handleSessionExpiry();
        return;
      }
      
      // Send message to background script to check session
      const response = await this.sendMessage({
        action: 'checkMobileSession',
        sessionId: this.sessionId
      });
      
      // If session has a new image, process it
      if (response && response.success && 
          response.status === 'upload_complete' && 
          response.data) {
        this.handleImageReceived(response.data);
      }
      
      // If session expired or was closed
      if (response && (!response.success || response.status === 'expired')) {
        this.handleSessionExpiry();
      }
    } catch (error) {
      console.error('Mobile Bridge: Error checking session', error);
    }
  }

  // Handle image upload
  handleImageReceived(imageData) {
    console.log('Mobile Bridge: Image received!');
    
    // Call the callback if provided
    if (this.callbacks.onImageReceived) {
      this.callbacks.onImageReceived(imageData);
    }
    
    // Close the session
    this.closeSession();
  }

  // Handle session expiry
  handleSessionExpiry() {
    console.log('Mobile Bridge: Session expired');
    
    // Clear the check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Update session status
    this.sessionStatus = 'expired';
    
    // Call the callback if provided
    if (this.callbacks.onSessionExpired) {
      this.callbacks.onSessionExpired();
    }
  }

  // Close the session
  async closeSession() {
    console.log('Mobile Bridge: Closing session...');
    
    // Skip if no active session
    if (!this.sessionId) {
      return {
        success: true,
        message: 'No active session to close'
      };
    }
    
    try {
      // Send message to background script to close session
      await this.sendMessage({
        action: 'closeMobileSession',
        sessionId: this.sessionId
      });
      
      // Clear the session locally
      this.clearSession();
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Mobile Bridge: Error closing session', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clear session data
  clearSession() {
    // Clear the check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Reset session properties
    this.sessionId = null;
    this.sessionExpiry = null;
    this.sessionStatus = 'inactive';
    this.uploadUrl = null;
    this.qrCodeUrl = null;
  }

  // Generate mobile upload page HTML
  generateUploadPageHTML() {
    const sessionId = this.sessionId || '';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Limo Anywhere Mobile Upload</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f6fa;
            color: #333;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
          }
          header {
            background-color: #2c3e50;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          h1 {
            font-size: 20px;
            margin: 0;
          }
          .content {
            background-color: white;
            padding: 20px;
            border-radius: 0 0 5px 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .upload-btn {
            display: block;
            width: 100%;
            padding: 12px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin: 20px 0;
            text-align: center;
          }
          .gallery-btn {
            display: block;
            width: 100%;
            padding: 12px;
            background-color: #2ecc71;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin-bottom: 20px;
            text-align: center;
          }
          .preview {
            margin-top: 20px;
            display: none;
          }
          .preview img {
            max-width: 100%;
            border-radius: 5px;
            display: block;
          }
          .status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
          }
          .success {
            background-color: rgba(46, 204, 113, 0.2);
            color: #27ae60;
          }
          .error {
            background-color: rgba(231, 76, 60, 0.2);
            color: #e74c3c;
          }
          .loading {
            background-color: rgba(52, 152, 219, 0.2);
            color: #3498db;
          }
          .hidden {
            display: none;
          }
          #fileInput {
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>Limo Anywhere Mobile Upload</h1>
          </header>
          <div class="content">
            <p>Upload an image of your client information:</p>
            
            <button id="cameraBtn" class="upload-btn">
              📷 Take Photo
            </button>
            
            <button id="galleryBtn" class="gallery-btn">
              🖼️ Choose from Gallery
            </button>
            
            <input type="file" id="fileInput" accept="image/*">
            
            <div id="preview" class="preview">
              <img id="previewImage" src="" alt="Preview">
            </div>
            
            <div id="status" class="status hidden"></div>
          </div>
        </div>
        
        <script>
          // Session ID from the QR code URL
          const sessionId = "${sessionId}";
          
          // Elements
          const cameraBtn = document.getElementById('cameraBtn');
          const galleryBtn = document.getElementById('galleryBtn');
          const fileInput = document.getElementById('fileInput');
          const preview = document.getElementById('preview');
          const previewImage = document.getElementById('previewImage');
          const status = document.getElementById('status');
          
          // Initialize
          document.addEventListener('DOMContentLoaded', function() {
            // Check if session ID is valid
            if (!sessionId) {
              showStatus('Invalid or expired session', 'error');
              disableButtons();
              return;
            }
            
            // Set up event listeners
            cameraBtn.addEventListener('click', () => {
              fileInput.setAttribute('capture', 'environment');
              fileInput.click();
            });
            
            galleryBtn.addEventListener('click', () => {
              fileInput.removeAttribute('capture');
              fileInput.click();
            });
            
            fileInput.addEventListener('change', handleFileSelect);
          });
          
          // Handle file selection
          function handleFileSelect(e) {
            if (e.target.files && e.target.files[0]) {
              const file = e.target.files[0];
              
              // Show preview
              const reader = new FileReader();
              reader.onload = function(e) {
                previewImage.src = e.target.result;
                preview.style.display = 'block';
                
                // Upload the file
                uploadFile(file);
              };
              reader.readAsDataURL(file);
            }
          }
          
          // Upload file to the server
          function uploadFile(file) {
            showStatus('Uploading image...', 'loading');
            
            // Create form data
            const formData = new FormData();
            formData.append('image', file);
            formData.append('sessionId', sessionId);
            
            // In a real implementation, this would post to a server endpoint
            // For demonstration, we'll simulate success
            setTimeout(() => {
              showStatus('Upload successful! You can return to your desktop now.', 'success');
              disableButtons();
            }, 1500);
          }
          
          // Show status message
          function showStatus(message, type) {
            status.textContent = message;
            status.className = 'status ' + type;
            status.classList.remove('hidden');
          }
          
          // Disable buttons after upload
          function disableButtons() {
            cameraBtn.disabled = true;
            galleryBtn.disabled = true;
            cameraBtn.style.opacity = 0.5;
            galleryBtn.style.opacity = 0.5;
          }
        </script>
      </body>
      </html>
    `;
  }

  // Helper method to send messages to background script
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Export the bridge
window.MobileBridge = MobileBridge;