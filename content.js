// Content script for Limo Anywhere Assistant

// Initialize when the page is fully loaded
document.addEventListener('DOMContentLoaded', initializeContentScript);

// This will also catch cases where the script is injected after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}

// Main initialization function
function initializeContentScript() {
  console.log('Limo Anywhere Assistant content script initialized');
  
  // Listen for messages from the extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    if (message.action === 'fillForm') {
      fillAccountForm(message.data, sendResponse);
      return true; // Keep the message channel open for async response
    }
  });
  
  // Add a small indicator that the extension is active
  addExtensionIndicator();
}

// Fill the account creation form with extracted data
function fillAccountForm(data, sendResponse) {
  console.log('Filling account form with data:', data);
  
  try {
    // Start tracking which fields were successfully filled
    const filledFields = [];
    const failedFields = [];
    
    // Try to fill each field
    // First Name
    if (fillField('contN1T1', data.firstName?.text)) {
      filledFields.push('First Name');
    } else {
      failedFields.push('First Name');
    }
    
    // Last Name
    if (fillField('contN2T1', data.lastName?.text)) {
      filledFields.push('Last Name');
    } else {
      failedFields.push('Last Name');
    }
    
    // Contact Type checkboxes
    if (selectCheckbox('contType1')) {
      filledFields.push('Contact Type (Bill To)');
    } else {
      failedFields.push('Contact Type (Bill To)');
    }
    
    if (selectCheckbox('contType2')) {
      filledFields.push('Contact Type (Passenger)');
    } else {
      failedFields.push('Contact Type (Passenger)');
    }
    
    // Address
    if (fillField('contAddr1', data.address?.text)) {
      filledFields.push('Address');
    } else {
      failedFields.push('Address');
    }
    
    // City
    if (fillField('contCity', data.city?.text)) {
      filledFields.push('City');
    } else {
      failedFields.push('City');
    }
    
    // State - this is a dropdown
    if (data.state?.text && selectOption('contState', data.state.text)) {
      filledFields.push('State');
    } else {
      failedFields.push('State');
    }
    
    // ZIP Code
    if (fillField('contZip', data.zipCode?.text)) {
      filledFields.push('ZIP Code');
    } else {
      failedFields.push('ZIP Code');
    }
    
    // Phone Number
    const phoneField = document.querySelector('#AutoNumber6 tbody tr:nth-child(3) td div input.ipp-number');
    if (phoneField && data.phone?.text) {
      phoneField.focus();
      phoneField.value = data.phone.text;
      phoneField.dispatchEvent(new Event('input', { bubbles: true }));
      phoneField.dispatchEvent(new Event('change', { bubbles: true }));
      filledFields.push('Phone');
    } else {
      failedFields.push('Phone');
    }
    
    // Email
    if (fillField('emailValue1', data.email?.text)) {
      filledFields.push('Email');
    } else {
      failedFields.push('Email');
    }
    
    // Email Properties checkboxes
    const emailPropAllCheckbox = document.querySelector('#divWithEmailProp div label input');
    if (emailPropAllCheckbox) {
      emailPropAllCheckbox.click();
      filledFields.push('Email Properties (All)');
    } else {
      failedFields.push('Email Properties (All)');
    }
    
    const emailProp1Checkbox = document.querySelector('input[name="emailProp1"]');
    if (emailProp1Checkbox) {
      emailProp1Checkbox.click();
      filledFields.push('Email Property 1');
    } else {
      failedFields.push('Email Property 1');
    }
    
    // Financial Data Tab
    const financialTab = document.querySelector('a[onclick*="expandcontent(\'sc2\'"]');
    if (financialTab) {
      // Click the Financial Data tab
      financialTab.click();
      
      // Wait a bit for the tab to show
      setTimeout(() => {
        // Set payment method dropdown
        if (selectOption('contPaymentMethod', 'Credit Card - Offline')) {
          filledFields.push('Payment Method');
        } else {
          failedFields.push('Payment Method');
        }
        
        // Go back to Account Info tab
        setTimeout(() => {
          const accountTab = document.querySelector('a[onclick*="expandcontent(\'sc1\'"]');
          if (accountTab) {
            accountTab.click();
          }
          
          // Send response with results
          sendResponse({
            success: true,
            message: `Form filled successfully. Filled ${filledFields.length} fields.`,
            filledFields: filledFields,
            failedFields: failedFields
          });
        }, 300);
      }, 300);
    } else {
      // We're not on the account creation page or can't find the financial tab
      sendResponse({
        success: true,
        message: `Form filled successfully. Filled ${filledFields.length} fields.`,
        filledFields: filledFields,
        failedFields: failedFields
      });
    }
  } catch (error) {
    console.error('Error filling form:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Helper function to fill a field by ID
function fillField(fieldId, value) {
  if (!value) return false;
  
  const element = document.getElementById(fieldId);
  if (!element) {
    // Try by name if ID doesn't work
    const elementsByName = document.getElementsByName(fieldId);
    if (elementsByName.length === 0) return false;
    return fillElementWithValue(elementsByName[0], value);
  }
  
  return fillElementWithValue(element, value);
}

// Helper function to fill an element with a value
function fillElementWithValue(element, value) {
  try {
    // Focus the element first
    element.focus();
    
    // Clear existing value
    element.value = '';
    
    // Set new value
    element.value = value;
    
    // Dispatch events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Add a highlight effect
    addHighlightEffect(element);
    
    return true;
  } catch (error) {
    console.error('Error filling element:', error);
    return false;
  }
}

// Helper function to select a checkbox
function selectCheckbox(checkboxName) {
  const checkbox = document.getElementsByName(checkboxName)[0];
  if (!checkbox) return false;
  
  try {
    // Only click if not already checked
    if (!checkbox.checked) {
      checkbox.click();
    }
    
    // Add highlight effect
    addHighlightEffect(checkbox);
    
    return true;
  } catch (error) {
    console.error('Error selecting checkbox:', error);
    return false;
  }
}

// Helper function to select an option from a dropdown
function selectOption(selectName, value) {
  const select = document.getElementsByName(selectName)[0];
  if (!select) return false;
  
  try {
    // First try exact match
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].text === value || 
          select.options[i].value === value) {
        select.selectedIndex = i;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Add highlight effect
        addHighlightEffect(select);
        
        return true;
      }
    }
    
    // Try case-insensitive partial match
    const lowerValue = value.toLowerCase();
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].text.toLowerCase().includes(lowerValue) || 
          select.options[i].value.toLowerCase().includes(lowerValue)) {
        select.selectedIndex = i;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Add highlight effect
        addHighlightEffect(select);
        
        return true;
      }
    }
    
    // If it's a two-letter state code, try to match state names
    if (value.length === 2) {
      const stateMap = {
        'AL': 'Alabama',
        'AK': 'Alaska',
        'AZ': 'Arizona',
        'AR': 'Arkansas',
        'CA': 'California',
        'CO': 'Colorado',
        'CT': 'Connecticut',
        'DE': 'Delaware',
        'FL': 'Florida',
        'GA': 'Georgia',
        'HI': 'Hawaii',
        'ID': 'Idaho',
        'IL': 'Illinois',
        'IN': 'Indiana',
        'IA': 'Iowa',
        'KS': 'Kansas',
        'KY': 'Kentucky',
        'LA': 'Louisiana',
        'ME': 'Maine',
        'MD': 'Maryland',
        'MA': 'Massachusetts',
        'MI': 'Michigan',
        'MN': 'Minnesota',
        'MS': 'Mississippi',
        'MO': 'Missouri',
        'MT': 'Montana',
        'NE': 'Nebraska',
        'NV': 'Nevada',
        'NH': 'New Hampshire',
        'NJ': 'New Jersey',
        'NM': 'New Mexico',
        'NY': 'New York',
        'NC': 'North Carolina',
        'ND': 'North Dakota',
        'OH': 'Ohio',
        'OK': 'Oklahoma',
        'OR': 'Oregon',
        'PA': 'Pennsylvania',
        'RI': 'Rhode Island',
        'SC': 'South Carolina',
        'SD': 'South Dakota',
        'TN': 'Tennessee',
        'TX': 'Texas',
        'UT': 'Utah',
        'VT': 'Vermont',
        'VA': 'Virginia',
        'WA': 'Washington',
        'WV': 'West Virginia',
        'WI': 'Wisconsin',
        'WY': 'Wyoming'
      };
      
      const stateName = stateMap[value.toUpperCase()];
      if (stateName) {
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].text.toLowerCase() === stateName.toLowerCase()) {
            select.selectedIndex = i;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Add highlight effect
            addHighlightEffect(select);
            
            return true;
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error selecting option:', error);
    return false;
  }
}

// Add a highlight effect to filled fields
function addHighlightEffect(element) {
  // Save original styles
  const originalBackground = element.style.backgroundColor;
  const originalTransition = element.style.transition;
  
  // Add highlight effect
  element.style.transition = 'background-color 1.5s ease';
  element.style.backgroundColor = '#c8e6c9'; // Light green
  
  // Restore original background after animation
  setTimeout(() => {
    element.style.backgroundColor = originalBackground;
    setTimeout(() => {
      element.style.transition = originalTransition;
    }, 1500);
  }, 1500);
}

// Add a small indicator that the extension is active on the page
function addExtensionIndicator() {
  const indicator = document.createElement('div');
  indicator.style.position = 'fixed';
  indicator.style.bottom = '10px';
  indicator.style.right = '10px';
  indicator.style.width = '20px';
  indicator.style.height = '20px';
  indicator.style.borderRadius = '50%';
  indicator.style.backgroundColor = '#3498db';
  indicator.style.zIndex = '9999';
  indicator.style.opacity = '0.7';
  indicator.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
  indicator.title = 'Limo Anywhere Assistant Active';
  
  // Pulse animation
  indicator.style.animation = 'pulse 2s infinite';
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(52, 152, 219, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); }
    }
  `;
  document.head.appendChild(styleElement);
  document.body.appendChild(indicator);
  
  // Add click handler to show status
  indicator.addEventListener('click', () => {
    alert('Limo Anywhere Assistant is ready to fill forms. Use the extension popup to process client data.');
  });
}