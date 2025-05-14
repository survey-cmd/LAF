// Options Page Script for Limo Anywhere Assistant

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('saveButton');
    const statusMessage = document.getElementById('statusMessage');
    const aiProviderSelect = document.getElementById('aiProvider');
    const confidenceThresholdInput = document.getElementById('confidenceThreshold');
    const confidenceDisplay = document.getElementById('confidenceDisplay');
    const autoFillCheckbox = document.getElementById('autoFill');
    const highlightFieldsCheckbox = document.getElementById('highlightFields');
    const resetButton = document.getElementById('resetButton');
    const testConnectionButton = document.getElementById('testConnectionButton');
    
    // Load saved settings
    loadSettings();
    
    // Event listeners
    saveButton.addEventListener('click', saveSettings);
    resetButton.addEventListener('click', resetSettings);
    testConnectionButton.addEventListener('click', testConnection);
    confidenceThresholdInput.addEventListener('input', updateConfidenceDisplay);
    
    // Functions
    function loadSettings() {
        chrome.storage.local.get('settings', function(result) {
            const settings = result.settings || getDefaultSettings();
            
            // Apply settings to form
            apiKeyInput.value = settings.apiKey || '';
            aiProviderSelect.value = settings.aiProvider || 'local';
            confidenceThresholdInput.value = settings.confidenceThreshold || 0.5;
            autoFillCheckbox.checked = settings.autoFill || false;
            highlightFieldsCheckbox.checked = settings.highlightFields !== false; // Default to true
            
            updateConfidenceDisplay();
        });
    }
    
    function saveSettings() {
        const settings = {
            apiKey: apiKeyInput.value.trim(),
            aiProvider: aiProviderSelect.value,
            confidenceThreshold: parseFloat(confidenceThresholdInput.value),
            autoFill: autoFillCheckbox.checked,
            highlightFields: highlightFieldsCheckbox.checked
        };
        
        chrome.storage.local.set({ settings: settings }, function() {
            showStatus('Settings saved successfully!', 'success');
            
            // Notify background script of settings change
            chrome.runtime.sendMessage({
                action: 'settingsUpdated',
                settings: settings
            });
        });
    }
    
    function resetSettings() {
        if (confirm('Reset all settings to default values?')) {
            const defaultSettings = getDefaultSettings();
            
            // Apply default settings to form
            apiKeyInput.value = defaultSettings.apiKey || '';
            aiProviderSelect.value = defaultSettings.aiProvider;
            confidenceThresholdInput.value = defaultSettings.confidenceThreshold;
            autoFillCheckbox.checked = defaultSettings.autoFill;
            highlightFieldsCheckbox.checked = defaultSettings.highlightFields;
            
            updateConfidenceDisplay();
            
            // Save default settings
            chrome.storage.local.set({ settings: defaultSettings }, function() {
                showStatus('Settings reset to defaults', 'success');
                
                // Notify background script of settings change
                chrome.runtime.sendMessage({
                    action: 'settingsUpdated',
                    settings: defaultSettings
                });
            });
        }
    }
    
    function getDefaultSettings() {
        return {
            apiKey: '',
            aiProvider: 'local',
            confidenceThreshold: 0.5,
            autoFill: false,
            highlightFields: true
        };
    }
    
    function updateConfidenceDisplay() {
        const value = parseFloat(confidenceThresholdInput.value);
        confidenceDisplay.textContent = `${Math.round(value * 100)}%`;
        
        // Update color based on threshold level
        if (value < 0.3) {
            confidenceDisplay.className = 'confidence-low';
        } else if (value < 0.7) {
            confidenceDisplay.className = 'confidence-medium';
        } else {
            confidenceDisplay.className = 'confidence-high';
        }
    }
    
    function testConnection() {
        const settings = {
            apiKey: apiKeyInput.value.trim(),
            aiProvider: aiProviderSelect.value
        };
        
        showStatus('Testing connection...', 'loading');
        
        // Send test request to background script
        chrome.runtime.sendMessage({
            action: 'testApiConnection',
            settings: settings
        }, function(response) {
            if (response && response.success) {
                showStatus('Connection successful!', 'success');
            } else {
                showStatus(`Connection failed: ${response?.error || 'Unknown error'}`, 'error');
            }
        });
    }
    
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status ${type}`;
        statusMessage.style.display = 'block';
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 3000);
        }
    }
});