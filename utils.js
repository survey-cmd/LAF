// Utility Functions for Limo Anywhere Assistant

// Namespace for utility functions
window.LimoUtils = {
  // Date and time utilities
  dateTime: {
    // Format a date as YYYY-MM-DD
    formatDate: function(date) {
      if (!date) date = new Date();
      return date.toISOString().split('T')[0];
    },
    
    // Format a date for UI display (MM/DD/YYYY)
    formatDisplayDate: function(date) {
      if (!date) date = new Date();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    },
    
    // Format time for UI display (HH:MM AM/PM)
    formatDisplayTime: function(date) {
      if (!date) date = new Date();
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    },
    
    // Parse a date string in various formats
    parseDate: function(dateString) {
      if (!dateString) return null;
      
      // Try built-in parsing first
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Handle common formats
      // MM/DD/YYYY
      const mdyMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (mdyMatch) {
        return new Date(
          parseInt(mdyMatch[3]), // year
          parseInt(mdyMatch[1]) - 1, // month (0-based)
          parseInt(mdyMatch[2]) // day
        );
      }
      
      // YYYY-MM-DD
      const ymdMatch = dateString.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (ymdMatch) {
        return new Date(
          parseInt(ymdMatch[1]), // year
          parseInt(ymdMatch[2]) - 1, // month (0-based)
          parseInt(ymdMatch[3]) // day
        );
      }
      
      // MM-DD-YYYY
      const mdyDashMatch = dateString.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
      if (mdyDashMatch) {
        return new Date(
          parseInt(mdyDashMatch[3]), // year
          parseInt(mdyDashMatch[1]) - 1, // month (0-based)
          parseInt(mdyDashMatch[2]) // day
        );
      }
      
      // Month name formats (Jan 1, 2023 or January 1, 2023)
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                          'july', 'august', 'september', 'october', 'november', 'december'];
      const monthNamesShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                               'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                               
      const monthNameRegex = new RegExp(
        `(${monthNames.join('|')}|${monthNamesShort.join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:[,\\s]+)?(\\d{4})?`,
        'i'
      );
      
      const monthNameMatch = dateString.match(monthNameRegex);
      if (monthNameMatch) {
        const monthName = monthNameMatch[1].toLowerCase();
        let monthIndex = monthNames.indexOf(monthName);
        if (monthIndex === -1) {
          monthIndex = monthNamesShort.indexOf(monthName);
        }
        
        if (monthIndex !== -1) {
          const day = parseInt(monthNameMatch[2]);
          const year = monthNameMatch[3] ? parseInt(monthNameMatch[3]) : new Date().getFullYear();
          return new Date(year, monthIndex, day);
        }
      }
      
      return null;
    }
  },
  
  // String utilities
  string: {
    // Remove extra whitespace from a string
    normalize: function(str) {
      if (!str) return '';
      return str.replace(/\s+/g, ' ').trim();
    },
    
    // Extract only the digits from a string
    extractDigits: function(str) {
      if (!str) return '';
      return str.replace(/\D/g, '');
    },
    
    // Check if a string is empty or whitespace only
    isEmpty: function(str) {
      return !str || /^\s*$/.test(str);
    },
    
    // Truncate a string to a maximum length with ellipsis
    truncate: function(str, maxLength = 100, suffix = '...') {
      if (!str) return '';
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength - suffix.length) + suffix;
    },
    
    // Convert to title case (capitalize first letter of each word)
    toTitleCase: function(str) {
      if (!str) return '';
      return str.replace(
        /\w\S*/g,
        txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
      );
    }
  },
  
  // Phone number utilities
  phone: {
    // Format a phone number as (XXX) XXX-XXXX
    format: function(phone) {
      if (!phone) return '';
      
      // Extract digits only
      const digits = phone.replace(/\D/g, '');
      
      // Format based on number of digits
      if (digits.length === 10) {
        return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
      } else if (digits.length === 11 && digits.charAt(0) === '1') {
        return `(${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
      }
      
      // Return as is if we can't format it
      return phone;
    },
    
    // Validate a phone number (US format)
    isValid: function(phone) {
      if (!phone) return false;
      
      // Extract digits only
      const digits = phone.replace(/\D/g, '');
      
      // Check length
      return digits.length === 10 || (digits.length === 11 && digits.charAt(0) === '1');
    }
  },
  
  // Email utilities
  email: {
    // Basic email validation
    isValid: function(email) {
      if (!email) return false;
      
      // Simple but effective email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    // Extract email addresses from text
    extract: function(text) {
      if (!text) return [];
      
      const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
      return text.match(emailRegex) || [];
    },
    
    // Normalize email address (lowercase, trim)
    normalize: function(email) {
      if (!email) return '';
      return email.toLowerCase().trim();
    }
  },
  
  // Address utilities
  address: {
    // Format an address consistently
    format: function(address, city, state, zip) {
      const parts = [];
      
      if (address) parts.push(address.trim());
      
      let cityStateZip = '';
      if (city) cityStateZip += city.trim();
      if (state) cityStateZip += cityStateZip ? `, ${state.trim()}` : state.trim();
      if (zip) cityStateZip += cityStateZip ? ` ${zip.trim()}` : zip.trim();
      
      if (cityStateZip) parts.push(cityStateZip);
      
      return parts.join(', ');
    },
    
    // Extract ZIP code from text
    extractZipCode: function(text) {
      if (!text) return '';
      
      // Look for 5-digit or 5+4 ZIP code patterns
      const zipRegex = /\b\d{5}(?:-\d{4})?\b/;
      const match = text.match(zipRegex);
      
      return match ? match[0] : '';
    },
    
    // Map state name to abbreviation
    getStateAbbreviation: function(stateName) {
      if (!stateName) return '';
      
      const stateMap = {
        'alabama': 'AL',
        'alaska': 'AK',
        'arizona': 'AZ',
        'arkansas': 'AR',
        'california': 'CA',
        'colorado': 'CO',
        'connecticut': 'CT',
        'delaware': 'DE',
        'florida': 'FL',
        'georgia': 'GA',
        'hawaii': 'HI',
        'idaho': 'ID',
        'illinois': 'IL',
        'indiana': 'IN',
        'iowa': 'IA',
        'kansas': 'KS',
        'kentucky': 'KY',
        'louisiana': 'LA',
        'maine': 'ME',
        'maryland': 'MD',
        'massachusetts': 'MA',
        'michigan': 'MI',
        'minnesota': 'MN',
        'mississippi': 'MS',
        'missouri': 'MO',
        'montana': 'MT',
        'nebraska': 'NE',
        'nevada': 'NV',
        'new hampshire': 'NH',
        'new jersey': 'NJ',
        'new mexico': 'NM',
        'new york': 'NY',
        'north carolina': 'NC',
        'north dakota': 'ND',
        'ohio': 'OH',
        'oklahoma': 'OK',
        'oregon': 'OR',
        'pennsylvania': 'PA',
        'rhode island': 'RI',
        'south carolina': 'SC',
        'south dakota': 'SD',
        'tennessee': 'TN',
        'texas': 'TX',
        'utah': 'UT',
        'vermont': 'VT',
        'virginia': 'VA',
        'washington': 'WA',
        'west virginia': 'WV',
        'wisconsin': 'WI',
        'wyoming': 'WY'
      };
      
      // Check for exact match (case insensitive)
      const normalizedState = stateName.toLowerCase().trim();
      
      // If it's already a valid 2-letter code, return it uppercase
      if (/^[a-z]{2}$/i.test(normalizedState)) {
        return normalizedState.toUpperCase();
      }
      
      return stateMap[normalizedState] || stateName;
    }
  },
  
  // File and blob utilities
  file: {
    // Read a file as text
    readAsText: function(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    },
    
    // Read a file as data URL
    readAsDataURL: function(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    
    // Convert data URL to Blob
    dataURLtoBlob: function(dataURL) {
      const arr = dataURL.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new Blob([u8arr], { type: mime });
    },
    
    // Determine if a file is an image
    isImage: function(file) {
      return file && file.type && file.type.startsWith('image/');
    }
  },
  
  // API and request utilities
  api: {
    // Simple fetch with timeout
    fetchWithTimeout: async function(url, options = {}, timeout = 10000) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    },
    
    // Create form data from an object
    objectToFormData: function(obj) {
      const formData = new FormData();
      
      Object.entries(obj).forEach(([key, value]) => {
        if (value instanceof Blob) {
          formData.append(key, value, value.name || `${key}.${value.type.split('/')[1]}`);
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });
      
      return formData;
    }
  },
  
  // DOM utilities
  dom: {
    // Create an element with attributes and children
    createElement: function(tag, attributes = {}, children = []) {
      const element = document.createElement(tag);
      
      // Set attributes
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'style' && typeof value === 'object') {
          Object.assign(element.style, value);
        } else if (key === 'className') {
          element.className = value;
        } else if (key === 'innerHTML') {
          element.innerHTML = value;
        } else {
          element.setAttribute(key, value);
        }
      });
      
      // Add children
      if (Array.isArray(children)) {
        children.forEach(child => {
          if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
          } else if (child instanceof Node) {
            element.appendChild(child);
          }
        });
      } else if (typeof children === 'string') {
        element.textContent = children;
      }
      
      return element;
    },
    
    // Remove all children from an element
    clearElement: function(element) {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    },
    
    // Create a QR code element
    createQRCode: async function(data, size = 200) {
      // Load QR code library if needed
      if (!window.QRCode) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      
      // Generate QR code
      await QRCode.toCanvas(canvas, data, {
        width: size,
        margin: 1,
        errorCorrectionLevel: 'H'
      });
      
      return canvas;
    }
  },
  
  // Storage utilities
  storage: {
    // Save data to chrome.storage.local
    save: function(key, data) {
      return new Promise((resolve, reject) => {
        const item = {};
        item[key] = data;
        
        chrome.storage.local.set(item, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    },
    
    // Get data from chrome.storage.local
    get: function(key) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result[key]);
          }
        });
      });
    },
    
    // Remove data from chrome.storage.local
    remove: function(key) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.remove(key, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    },
    
    // Clear all extension storage
    clear: function() {
      return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }
  },
  
  // Extension utilities
  extension: {
    // Open options page
    openOptionsPage: function() {
      chrome.runtime.openOptionsPage();
    },
    
    // Send message to background script
    sendMessage: function(message) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    },
    
    // Get extension version
    getVersion: function() {
      return chrome.runtime.getManifest().version;
    },
    
    // Open URL in a new tab
    openTab: function(url) {
      chrome.tabs.create({ url });
    }
  },
  
  // Validation utils
  validation: {
    // Check if all required fields have values
    hasRequiredFields: function(data, requiredFields) {
      return requiredFields.every(field => {
        if (typeof field === 'string') {
          return !!data[field];
        } else if (Array.isArray(field)) {
          // If field is an array, at least one of the fields must have a value
          return field.some(f => !!data[f]);
        }
        return false;
      });
    }
  }
};