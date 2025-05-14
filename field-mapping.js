// Field Mapping Module for Limo Anywhere Assistant

class FieldMapper {
  constructor() {
    // Initialize with default mappings for account creation
    this.formMappings = {
      accountCreation: {
        firstName: {
          selectors: ['id=contN1T1', 'name=contFName'],
          type: 'text',
          required: true
        },
        lastName: {
          selectors: ['id=contN2T1', 'name=contLName'],
          type: 'text',
          required: true
        },
        contactType1: {
          selectors: ['name=contType1'],
          type: 'checkbox',
          defaultValue: true
        },
        contactType2: {
          selectors: ['name=contType2'],
          type: 'checkbox',
          defaultValue: true
        },
        address: {
          selectors: ['name=contAddr1'],
          type: 'text',
          required: false
        },
        city: {
          selectors: ['name=contCity'],
          type: 'text',
          required: false
        },
        state: {
          selectors: ['name=contState'],
          type: 'select',
          required: false
        },
        zipCode: {
          selectors: ['name=contZip'],
          type: 'text',
          required: false
        },
        phone: {
          selectors: ['xpath=//*[@id="AutoNumber6"]/tbody/tr[3]/td/div/input'],
          type: 'text',
          required: false
        },
        email: {
          selectors: ['id=emailValue1', 'name=emailValue1'],
          type: 'text',
          required: false
        },
        emailProp1: {
          selectors: ['xpath=//*[@id="divWithEmailProp"]/div/label/input'],
          type: 'checkbox',
          defaultValue: true
        },
        emailProp2: {
          selectors: ['name=emailProp1'],
          type: 'checkbox',
          defaultValue: true
        },
        paymentMethod: {
          selectors: ['name=contPaymentMethod'],
          type: 'select',
          defaultValue: 'Credit Card - Offline'
        }
      },
      reservation: {
        // Placeholder for reservation form mappings
        // These would be added later when implementing reservation page support
      }
    };
    
    // Additional standardization rules
    this.standardizationRules = {
      state: this.standardizeState,
      phone: this.standardizePhone,
      email: this.standardizeEmail,
      zipCode: this.standardizeZipCode
    };
  }

  // Get field mappings for a specific form type
  getMappingsForForm(formType) {
    return this.formMappings[formType] || {};
  }

  // Create form filling commands for UI.Vision
  createFormFillingCommands(formType, extractedData) {
    console.log('Field Mapper: Creating form filling commands for', formType);
    
    const mappings = this.getMappingsForForm(formType);
    if (!mappings) {
      throw new Error(`No mappings found for form type: ${formType}`);
    }
    
    const commands = [];
    
    // Process each field in the mapping
    Object.entries(mappings).forEach(([fieldName, fieldConfig]) => {
      // Skip if no selectors are defined
      if (!fieldConfig.selectors || fieldConfig.selectors.length === 0) {
        return;
      }
      
      // Get value from extracted data or use default
      let value = '';
      if (extractedData[fieldName]) {
        value = extractedData[fieldName].text;
      } else if (fieldConfig.defaultValue !== undefined) {
        value = fieldConfig.defaultValue;
      }
      
      // Apply standardization rules if necessary
      if (this.standardizationRules[fieldName] && typeof this.standardizationRules[fieldName] === 'function') {
        value = this.standardizationRules[fieldName](value);
      }
      
      // Skip empty required fields
      if (fieldConfig.required && !value) {
        console.warn(`Field Mapper: Required field ${fieldName} is empty`);
        return;
      }
      
      // Create commands based on field type
      const selector = fieldConfig.selectors[0]; // Use the first selector
      
      switch (fieldConfig.type) {
        case 'text':
          // Click on the field first
          commands.push({
            Command: 'click',
            Target: selector,
            Value: ''
          });
          
          // Then type the value
          commands.push({
            Command: 'type',
            Target: selector,
            Value: value
          });
          break;
          
        case 'checkbox':
          // For checkboxes, only click if the value is true
          if (value === true || value === 'true' || value === '1' || value === 'on') {
            commands.push({
              Command: 'click',
              Target: selector,
              Value: ''
            });
          }
          break;
          
        case 'select':
          // For select dropdowns
          commands.push({
            Command: 'select',
            Target: selector,
            Value: `label=${value}`
          });
          break;
      }
    });
    
    // Add tab navigation for Financial Data
    if (formType === 'accountCreation') {
      // Navigate to Financial Data tab
      commands.push({
        Command: 'click',
        Target: 'linkText=Financial Data',
        Value: ''
      });
      
      // Set payment method
      commands.push({
        Command: 'select',
        Target: 'name=contPaymentMethod',
        Value: 'label=Credit Card - Offline'
      });
      
      // Return to Account Info tab
      commands.push({
        Command: 'click',
        Target: 'linkText=Account Info',
        Value: ''
      });
    }
    
    return commands;
  }

  // Generate UI.Vision macro for a specific form and data
  generateUiVisionMacro(formType, extractedData) {
    const commands = this.createFormFillingCommands(formType, extractedData);
    
    // Create the full macro structure
    const macro = {
      Name: `LimoAnywhere_${formType}_AutoFill`,
      CreationDate: new Date().toISOString().split('T')[0],
      Commands: [
        {
          Command: 'open',
          Target: 'https://manage.mylimobiz.com/admin/manageAccounts.asp?stab=accountManagement&action=showAccounts',
          Value: ''
        },
        ...commands
      ]
    };
    
    return macro;
  }

  // Convert extracted data format to UI.Vision variables
  convertToUiVisionVariables(extractedData) {
    const variables = {};
    
    Object.entries(extractedData).forEach(([key, value]) => {
      // Only include fields with text content
      if (value && value.text) {
        variables[key] = value.text;
      }
    });
    
    return variables;
  }

  // Standardization functions
  standardizeState(state) {
    if (!state) return state;
    
    // Convert full state names to abbreviations
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
    
    const stateLower = state.toLowerCase().trim();
    
    // If it's already a valid 2-letter code, return it uppercase
    if (/^[a-z]{2}$/.test(stateLower)) {
      return stateLower.toUpperCase();
    }
    
    // Otherwise, try to match to full state name
    return stateMap[stateLower] || state;
  }

  standardizePhone(phone) {
    if (!phone) return phone;
    
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    
    // Handle country code if present
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.substring(1);
    }
    
    // Format as (XXX) XXX-XXXX if we have 10 digits
    if (digits.length === 10) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    }
    
    // Otherwise return as is
    return phone;
  }

  standardizeEmail(email) {
    if (!email) return email;
    
    // Lowercase the email
    return email.toLowerCase().trim();
  }

  standardizeZipCode(zipCode) {
    if (!zipCode) return zipCode;
    
    // Extract digits only for ZIP code
    const digits = zipCode.replace(/\D/g, '');
    
    // Format as 5-digit or 5+4 ZIP
    if (digits.length === 9) {
      return `${digits.substring(0, 5)}-${digits.substring(5)}`;
    } else if (digits.length >= 5) {
      return digits.substring(0, 5);
    }
    
    // Return as is if we can't format it
    return zipCode;
  }
}

// Export the mapper
window.FieldMapper = FieldMapper;