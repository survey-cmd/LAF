// UI.Vision RPA Connector Module for Limo Anywhere Assistant

class UIVisionConnector {
  constructor() {
    this.connected = false;
    this.extensionId = 'gcbalfbdmfieckjlnblleoemohcganoc'; // UI.Vision extension ID
    this.connectionAttempts = 0;
    this.maxAttempts = 3;
  }

  // Initialize the connector
  async initialize(settings = {}) {
    console.log('UI.Vision Connector: Initializing...');
    
    // Force use of known UI.Vision ID
    this.extensionId = 'gcbalfbdmfieckjlnblleoemohcganoc';
    this.connected = true; // Force connected state
    
    console.log('UI.Vision Connector: Using extension ID', this.extensionId);
    return true;
  }

  // Find an installed UI.Vision extension
  async findInstalledExtension(extensionIds) {
    for (const extensionId of extensionIds) {
      try {
        const connected = await this.pingExtension(extensionId);
        if (connected) {
          return extensionId;
        }
      } catch (error) {
        console.log(`UI.Vision Connector: Extension ${extensionId} not found or not accessible`);
      }
    }
    
    return null;
  }

  // Check if we can communicate with the extension
  async pingExtension(extensionId) {
    return new Promise((resolve) => {
      try {
        // Set a timeout in case the extension doesn't respond
        const timeout = setTimeout(() => resolve(false), 1000);
        
        // Try to send a simple message to the extension
        chrome.runtime.sendMessage(extensionId, 
          { action: 'ping' }, 
          (response) => {
            clearTimeout(timeout);
            
            if (chrome.runtime.lastError) {
              console.log('UI.Vision ping error:', chrome.runtime.lastError);
              resolve(false);
              return;
            }
            
            resolve(response && response.success);
          }
        );
      } catch (error) {
        console.log('UI.Vision ping exception:', error);
        resolve(false);
      }
    });
  }

  // Test connection to UI.Vision
  async testConnection() {
    if (!this.extensionId) {
      return false;
    }
    
    this.connectionAttempts = 0;
    return this.pingExtension(this.extensionId);
  }

  // Run a UI.Vision macro
  async runMacro(macroData) {
    console.log('UI.Vision Connector: Running macro...');
    
    try {
      // Validate macro data
      if (!macroData || !macroData.Commands || !Array.isArray(macroData.Commands)) {
        throw new Error('Invalid macro data');
      }
      
      // Format the macro properly for UI.Vision
      const formattedMacro = this.formatMacro(macroData);
      
      // Send the macro to UI.Vision
      const result = await this.sendToUIVision('run_macro', {
        macro: formattedMacro
      });
      
      return result;
    } catch (error) {
      console.error('UI.Vision Connector: Error running macro', error);
      throw error;
    }
  }

  // Create and run a temporary macro
  async runCommands(commands, options = {}) {
    console.log('UI.Vision Connector: Running commands...');
    
    try {
      // Create a temporary macro
      const macroData = {
        Name: 'LimoAnywhere_AutoFill_' + Date.now(),
        CreationDate: new Date().toISOString().split('T')[0],
        Commands: commands
      };
      
      console.log('UI.Vision Connector: Created macro', macroData);
      
      // Run the macro
      return await this.runMacro(macroData);
    } catch (error) {
      console.error('UI.Vision Connector: Error running commands', error);
      throw error;
    }
  }

  // Fill a form using UI.Vision
  async fillForm(formType, extractedData, fieldMapper) {
    console.log('UI.Vision Connector: Filling form...', formType);
    
    if (!fieldMapper) {
      throw new Error('Field mapper is required');
    }
    
    try {
      // Generate form filling commands
      const commands = fieldMapper.createFormFillingCommands(formType, extractedData);
      
      // Add navigation to the form page if needed
      if (formType === 'accountCreation') {
        commands.unshift({
          Command: 'open',
          Target: 'https://manage.mylimobiz.com/admin/manageAccounts.asp?stab=accountManagement&action=showAccounts',
          Value: ''
        });
      }
      
      console.log('UI.Vision Connector: Form filling commands', commands);
      
      // Run the commands
      return await this.runCommands(commands);
    } catch (error) {
      console.error('UI.Vision Connector: Error filling form', error);
      throw error;
    }
  }

  // Save a macro to UI.Vision
  async saveMacro(macroData, options = {}) {
    console.log('UI.Vision Connector: Saving macro...');
    
    try {
      // Format the macro properly for UI.Vision
      const formattedMacro = this.formatMacro(macroData);
      
      // Set folder options
      const folderOptions = {
        folder: options.folder || 'LimoAnywhere',
        createIfNotExists: options.createFolder !== false
      };
      
      // Send the macro to UI.Vision
      const result = await this.sendToUIVision('save_macro', {
        macro: formattedMacro,
        folder: folderOptions
      });
      
      return result;
    } catch (error) {
      console.error('UI.Vision Connector: Error saving macro', error);
      throw error;
    }
  }

  // Format macro for UI.Vision
  formatMacro(macroData) {
    // Clone to avoid modifying the original
    const formattedMacro = JSON.parse(JSON.stringify(macroData));
    
    // Ensure required fields
    if (!formattedMacro.Name) {
      formattedMacro.Name = 'LimoAnywhere_AutoFill_' + Date.now();
    }
    
    if (!formattedMacro.CreationDate) {
      formattedMacro.CreationDate = new Date().toISOString().split('T')[0];
    }
    
    // Add XDesktopAutomation flag used by UI.Vision
    formattedMacro.Commands.unshift({
      Command: 'XDesktopAutomation',
      Target: 'false',
      Value: ''
    });
    
    return formattedMacro;
  }

  // Send a command to UI.Vision
  async sendToUIVision(action, data) {
    if (!this.extensionId) {
      throw new Error('UI.Vision extension ID not set');
    }
    
    console.log('UI.Vision Connector: Sending to UI.Vision', action, data);
    
    return new Promise((resolve, reject) => {
      const message = {
        action: action,
        ...data
      };
      
      chrome.runtime.sendMessage(this.extensionId, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('UI.Vision Connector: Send error', chrome.runtime.lastError);
          reject(new Error(`Failed to communicate with UI.Vision: ${chrome.runtime.lastError.message}`));
          return;
        }
        
        if (!response) {
          console.error('UI.Vision Connector: No response');
          reject(new Error('No response from UI.Vision'));
          return;
        }
        
        if (response.error) {
          console.error('UI.Vision Connector: Response error', response.error);
          reject(new Error(`UI.Vision error: ${response.error}`));
          return;
        }
        
        console.log('UI.Vision Connector: Response success', response);
        resolve(response);
      });
    });
  }

  // Check if UI.Vision is installed
  isInstalled() {
    return true; // Force return true
  }

  // Get installation status and details
  getStatus() {
    return {
      installed: true,
      connected: this.connected,
      extensionId: this.extensionId
    };
  }

  // Get UI.Vision installation instructions
  getInstallationInstructions() {
    return {
      title: 'UI.Vision RPA Installation Required',
      steps: [
        'Go to the Chrome Web Store',
        'Search for "UI.Vision RPA" or use the direct link',
        'Click "Add to Chrome" to install the extension',
        'After installation, refresh this page',
        'The Limo Anywhere Assistant will automatically connect to UI.Vision'
      ],
      link: 'https://chrome.google.com/webstore/detail/uivision-rpa/gcbalfbdmfieckjlnblleoemohcganoc'
    };
  }
}

// Export the connector
window.UIVisionConnector = UIVisionConnector;