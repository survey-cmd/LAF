// Image Processing Module for Limo Anywhere Assistant

class ImageProcessor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  // Process an image for better OCR results
  async processForOCR(imageData) {
    console.log('Image Processor: Processing image for OCR...');
    
    try {
      // Load the image
      const image = await this.loadImage(imageData);
      
      // Create canvas of the right size
      this.canvas.width = image.width;
      this.canvas.height = image.height;
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw the original image
      this.ctx.drawImage(image, 0, 0);
      
      // Apply processing steps
      this.convertToGrayscale();
      this.increaseContrast(1.5); // Adjust contrast
      this.applyThreshold(128); // Threshold for black and white
      this.applySharpening(); // Sharpen the image
      
      // Return the processed image as data URL
      return this.canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Image Processor: Error processing image', error);
      return imageData; // Return original on error
    }
  }

  // Load an image from various sources (URL, Blob, File, Data URL)
  loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image'));
      
      // Handle different source types
      if (source instanceof Blob || source instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          image.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(source);
      } else if (typeof source === 'string') {
        // Assume it's a URL or Data URL
        image.src = source;
      } else {
        reject(new Error('Unsupported image source'));
      }
    });
  }

  // Convert image to grayscale
  convertToGrayscale() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg; // Red
      data[i + 1] = avg; // Green
      data[i + 2] = avg; // Blue
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // Increase image contrast
  increaseContrast(factor) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    const factor128 = 128 * (1 - factor);
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = factor * data[i] + factor128;
      data[i + 1] = factor * data[i + 1] + factor128;
      data[i + 2] = factor * data[i + 2] + factor128;
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // Apply threshold to create black and white image
  applyThreshold(threshold) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const value = v > threshold ? 255 : 0;
      
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // Apply sharpening filter
  applySharpening() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Create a temporary copy of the image data
    const tempData = new Uint8ClampedArray(data);
    
    // Apply a simple sharpening kernel
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Apply kernel to each channel (RGB, skip Alpha)
        for (let c = 0; c < 3; c++) {
          let val = 0;
          
          // Apply convolution
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              val += tempData[kidx] * kernel[kernelIdx];
            }
          }
          
          // Clamp value between 0-255
          data[idx + c] = Math.max(0, Math.min(255, val));
        }
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  // Detect and correct skew/rotation
  detectAndCorrectSkew() {
    // This is a placeholder for more advanced image processing
    // Skew detection is complex and would likely require a specialized library
    console.log('Image Processor: Skew detection not implemented yet');
  }

  // Resize image to specified dimensions
  resizeImage(width, height) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    // Draw the current canvas content onto the temporary canvas
    tempCtx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, width, height);
    
    // Update the main canvas
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(tempCanvas, 0, 0);
  }

  // Crop image to specified rectangle
  cropImage(x, y, width, height) {
    const imageData = this.ctx.getImageData(x, y, width, height);
    
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.putImageData(imageData, 0, 0);
  }

  // Auto-detect and crop to content area
  autoCrop() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    
    // Find the bounding box of non-white pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // If pixel is not white (assuming we're working with a thresholded image)
        if (data[idx] < 200) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Add padding
    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);
    
    // Crop to the bounding box if it's a meaningful crop
    if (minX < maxX && minY < maxY && 
        (maxX - minX) > 0.1 * width && (maxY - minY) > 0.1 * height) {
      this.cropImage(minX, minY, maxX - minX, maxY - minY);
      return true;
    }
    
    return false; // No meaningful crop was performed
  }

  // Get the current image as data URL
  toDataURL(format = 'image/png', quality = 0.9) {
    return this.canvas.toDataURL(format, quality);
  }

  // Get the current image as Blob
  toBlob(format = 'image/png', quality = 0.9) {
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        resolve(blob);
      }, format, quality);
    });
  }
}

// Export the processor
window.ImageProcessor = ImageProcessor;