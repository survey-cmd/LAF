// QR Code Generator Module for Limo Anywhere Assistant

class QRGenerator {
  constructor() {
    this.qrLibLoaded = false;
    this.qrengine = null;
  }

  // Initialize the QR code generator
  async initialize() {
    if (this.qrLibLoaded) {
      return true;
    }
    
    try {
      // Load QR code library dynamically
      await this.loadQRLibrary();
      this.qrLibLoaded = true;
      return true;
    } catch (error) {
      console.error('QR Generator: Failed to initialize', error);
      return false;
    }
  }

  // Load the QR code library
  async loadQRLibrary() {
    return new Promise((resolve, reject) => {
      // First check if library is already loaded
      if (window.QRCode) {
        resolve();
        return;
      }
      
      // Load QRCode.js library
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load QR code library'));
      document.head.appendChild(script);
    });
  }

  // Generate QR code as data URL
  async generateQRCodeDataURL(data, options = {}) {
    if (!this.qrLibLoaded) {
      await this.initialize();
    }
    
    if (!data) {
      throw new Error('QR Generator: No data provided');
    }
    
    // Default options
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    };
    
    // Merge with provided options
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      // Generate QR code as data URL
      return await QRCode.toDataURL(data, mergedOptions);
    } catch (error) {
      console.error('QR Generator: Error generating QR code', error);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  // Generate QR code directly to a canvas element
  async generateQRCodeToCanvas(data, canvas, options = {}) {
    if (!this.qrLibLoaded) {
      await this.initialize();
    }
    
    if (!data) {
      throw new Error('QR Generator: No data provided');
    }
    
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('QR Generator: Invalid canvas element');
    }
    
    // Default options
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    };
    
    // Merge with provided options
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      // Generate QR code to canvas
      await QRCode.toCanvas(canvas, data, mergedOptions);
      return true;
    } catch (error) {
      console.error('QR Generator: Error generating QR code', error);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  // Generate QR code as SVG string
  async generateQRCodeSVG(data, options = {}) {
    if (!this.qrLibLoaded) {
      await this.initialize();
    }
    
    if (!data) {
      throw new Error('QR Generator: No data provided');
    }
    
    // Default options
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    };
    
    // Merge with provided options
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      // Generate QR code as SVG string
      return await QRCode.toString(data, {
        ...mergedOptions,
        type: 'svg'
      });
    } catch (error) {
      console.error('QR Generator: Error generating QR code', error);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  // Generate a complete HTML page with QR code
  generateQRCodeHTML(data, sessionId, title = 'Mobile Upload') {
    if (!data) {
      return '<div>Error: No data provided for QR code</div>';
    }
    
    // Encode the data for HTML
    const encodedData = encodeURIComponent(data);
    
    // Generate HTML with inline QR code image
    const html = `
    <div class="qr-container">
      <h3>${title}</h3>
      <p>Scan this QR code with your phone</p>
      <div class="qr-image">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}" alt="QR Code" width="200" height="200">
      </div>
      <p class="session-info">Session ID: ${sessionId}</p>
      <p class="expiry-info">This code will expire in 10 minutes</p>
    </div>
    `;
    
    return html;
  }

  // Generate a complete mobile upload page with embedded QR code
  generateMobileUploadPage(uploadUrl, sessionId) {
    if (!uploadUrl) {
      throw new Error('QR Generator: No upload URL provided');
    }
    
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
          text-align: center;
        }
        .container {
          max-width: 500px;
          margin: 20px auto;
          padding: 20px;
          background-color: white;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #2c3e50;
          font-size: 24px;
        }
        .instructions {
          margin: 20px 0;
          text-align: left;
          padding: 0 20px;
        }
        .upload-section {
          margin-top: 20px;
        }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          margin: 10px;
        }
        .btn.secondary {
          background-color: #7f8c8d;
        }
        #fileInput {
          display: none;
        }
        .status {
          margin-top: 20px;
          padding: 10px;
          border-radius: 4px;
        }
        .success {
          background-color: rgba(46, 204, 113, 0.2);
          color: #27ae60;
        }
        .error {
          background-color: rgba(231, 76, 60, 0.2);
          color: #e74c3c;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #7f8c8d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Limo Anywhere Mobile Upload</h1>
        
        <div class="instructions">
          <p>Upload an image containing client information:</p>
          <ol>
            <li>Take a photo or select an image</li>
            <li>Review the image quality</li>
            <li>Tap Upload</li>
          </ol>
        </div>
        
        <div class="upload-section">
          <button id="cameraBtn" class="btn">📷 Take Photo</button>
          <button id="galleryBtn" class="btn">🖼️ Choose Image</button>
          <input type="file" id="fileInput" accept="image/*">
        </div>
        
        <div id="preview" style="margin-top: 20px; display: none;">
          <img id="previewImage" style="max-width: 100%; border-radius: 4px;" src="" alt="Preview">
          <div style="margin-top: 10px;">
            <button id="uploadBtn" class="btn">Upload Image</button>
            <button id="cancelBtn" class="btn secondary">Cancel</button>
          </div>
        </div>
        
        <div id="status" class="status" style="display: none;"></div>
        
        <div class="footer">
          <p>Session ID: ${sessionId}</p>
          <p>This upload page will expire in 10 minutes</p>
        </div>
      </div>

      <script>
        // Elements
        const cameraBtn = document.getElementById('cameraBtn');
        const galleryBtn = document.getElementById('galleryBtn');
        const fileInput = document.getElementById('fileInput');
        const preview = document.getElementById('preview');
        const previewImage = document.getElementById('previewImage');
        const uploadBtn = document.getElementById('uploadBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const status = document.getElementById('status');
        
        // Variables
        const uploadUrl = "${uploadUrl}";
        const sessionId = "${sessionId}";
        let selectedFile = null;
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
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
          
          uploadBtn.addEventListener('click', uploadImage);
          
          cancelBtn.addEventListener('click', () => {
            preview.style.display = 'none';
            selectedFile = null;
          });
        });
        
        // Handle file selection
        function handleFileSelect(e) {
          if (e.target.files && e.target.files[0]) {
            selectedFile = e.target.files[0];
            
            // Show preview
            const reader = new FileReader();
            reader.onload = function(e) {
              previewImage.src = e.target.result;
              preview.style.display = 'block';
            };
            reader.readAsDataURL(selectedFile);
          }
        }
        
        // Upload image
        function uploadImage() {
          if (!selectedFile) {
            showStatus('No image selected', 'error');
            return;
          }
          
          showStatus('Uploading image...', 'loading');
          
          // Create form data
          const formData = new FormData();
          formData.append('image', selectedFile);
          formData.append('sessionId', sessionId);
          
          // Send the file to the server
          fetch(uploadUrl, {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              showStatus('Upload successful! You can return to your desktop now.', 'success');
              disableButtons();
            } else {
              showStatus('Upload failed: ' + (data.error || 'Unknown error'), 'error');
            }
          })
          .catch(error => {
            showStatus('Upload failed: ' + error.message, 'error');
          });
        }
        
        // Show status message
        function showStatus(message, type) {
          status.textContent = message;
          status.className = 'status ' + type;
          status.style.display = 'block';
        }
        
        // Disable buttons after successful upload
        function disableButtons() {
          cameraBtn.disabled = true;
          galleryBtn.disabled = true;
          uploadBtn.disabled = true;
          cameraBtn.style.opacity = 0.5;
          galleryBtn.style.opacity = 0.5;
          uploadBtn.style.opacity = 0.5;
        }
      </script>
    </body>
    </html>
    `;
  }
}

// Export the QR generator
window.QRGenerator = QRGenerator;