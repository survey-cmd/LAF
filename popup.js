document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Limo Anywhere Assistant initialized');

    // DOM Elements
    const textTabBtn = document.getElementById('textTabBtn');
    const imageTabBtn = document.getElementById('imageTabBtn');
    const textTab = document.getElementById('textTab');
    const imageTab = document.getElementById('imageTab');
    const textInput = document.getElementById('textInput');
    const processTextBtn = document.getElementById('processTextBtn');
    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const processImageBtn = document.getElementById('processImageBtn');
    const mobileUploadBtn = document.getElementById('mobileUploadBtn');
    const qrContainer = document.getElementById('qrContainer');
    const resultsSection = document.getElementById('resultsSection');
    const resultsBody = document.getElementById('resultsBody');
    const clearBtn = document.getElementById('clearBtn');
    const fillFormBtn = document.getElementById('fillFormBtn');
    const statusContainer = document.getElementById('statusContainer');
    const statusMessage = document.getElementById('statusMessage');

    // Log key elements to verify they exist
    console.log('Text input element:', textInput);
    console.log('Process button element:', processTextBtn);
    console.log('Results section element:', resultsSection);

    // Initialize processor
    const aiProcessor = new AIProcessor();
    console.log('AI Processor initialized:', aiProcessor);

    // Current state
    let currentTab = 'text';
    let extractedData = null;
    let uploadedImage = null;
    let mobileSessionActive = false;
    let mobileSessionId = null;

    // Initialize UI and processors
    initTabs();
    initDropZone();
    initButtons();
    console.log('UI initialized');

    // Tab switching
    function initTabs() {
        if (textTabBtn && imageTabBtn) {
            textTabBtn.addEventListener('click', () => switchTab('text'));
            imageTabBtn.addEventListener('click', () => switchTab('image'));
            console.log('Tab event listeners added');
        } else {
            console.error('Tab buttons not found');
        }
    }

    function switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        currentTab = tabName;
        
        // Update tab buttons
        if (textTabBtn && imageTabBtn) {
            textTabBtn.classList.toggle('active', tabName === 'text');
            imageTabBtn.classList.toggle('active', tabName === 'image');
        }
        
        // Update tab content
        if (textTab && imageTab) {
            textTab.classList.toggle('active', tabName === 'text');
            imageTab.classList.toggle('active', tabName === 'image');
        }
    }

    // Drag and drop for images
    function initDropZone() {
        if (!dropZone || !imageInput) {
            console.error('Drop zone or image input not found');
            return;
        }

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                hhandleImageFile(e.dataTransfer.files[0]);
            }
        });

        dropZone.addEventListener('click', () => {
            imageInput.click();
        });

        imageInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleImageFile(e.target.files[0]);
            }
        });

        console.log('Drop zone initialized');
    }

    function handleImageFile(file) {
        console.log('Handling image file:', file);
        
        // Store the image
        uploadedImage = file;
        
        // Simple preview without processing
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Uploaded image">`;
            imagePreview.style.display = 'block';
            processImageBtn.disabled = false;
            console.log('Image preview created');
        };
        reader.readAsDataURL(file);
    }

    // Button handlers
    function initButtons() {
        if (processTextBtn) {
            processTextBtn.addEventListener('click', processTextInput);
            console.log('Process text button event listener added');
        } else {
            console.error('Process text button not found');
        }
        
        if (processImageBtn) {
            processImageBtn.addEventListener('click', processImageInput);
            console.log('Process image button event listener added');
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', clearResults);
            console.log('Clear button event listener added');
        }
        
        if (fillFormBtn) {
            fillFormBtn.addEventListener('click', fillForm);
            console.log('Fill form button event listener added');
        }
        
        if (mobileUploadBtn) {
            mobileUploadBtn.addEventListener('click', toggleMobileUpload);
            console.log('Mobile upload button event listener added');
        }
    }

    async function processTextInput() {
        console.log('Process text button clicked');
        
        if (!textInput) {
            console.error('Text input element not found');
            return;
        }
        
        const text = textInput.value.trim();
        console.log('Input text:', text ? text.substring(0, 50) + '...' : '(empty)');
        
        if (!text) {
            console.log('No text entered');
            showStatus('Please enter client information.', 'error');
            return;
        }

        showStatus('Processing text...', 'loading');
        
        try {
            console.log('Calling AI processor...');
            extractedData = await aiProcessor.processText(text);
            console.log('Extracted data:', extractedData);
            
            displayResults(extractedData);
            showStatus('Text processed successfully!', 'success');
        } catch (error) {
            console.error('Error processing text:', error);
            showStatus(`Error: ${error.message}`, 'error');
        }
    }

    function processImageInput() {
        console.log('Process image button clicked');
        
        if (!uploadedImage) {
            showStatus('Please upload an image.', 'error');
            return;
        }

        showStatus('Image processing is currently disabled. Please use text input instead.', 'error');
    }
    
    function toggleMobileUpload() {
        showStatus('Mobile upload is currently disabled. Please use text input instead.', 'error');
    }

    function clearResults() {
        console.log('Clear button clicked');
        
        // Clear input fields
        if (textInput) textInput.value = '';
        if (imagePreview) {
            imagePreview.innerHTML = '';
            imagePreview.style.display = 'none';
        }
        uploadedImage = null;
        if (processImageBtn) processImageBtn.disabled = true;
        
        // Clear results
        if (resultsSection) resultsSection.classList.add('hidden');
        if (resultsBody) resultsBody.innerHTML = '';
        extractedData = null;
        
        // Clear status
        if (statusContainer) statusContainer.classList.add('hidden');
        
        // Reset popup size
        document.body.style.width = '';
        document.body.style.height = '';
        
        console.log('Results cleared');
    }

    async function fillForm() {
        console.log('Fill form button clicked');
        
        if (!extractedData) {
            console.log('No data to fill');
            showStatus('No data to fill the form with.', 'error');
            return;
        }

        showStatus('Filling form...', 'loading');
        
        try {
            // Check if we're on the Limo Anywhere website
            const onLimoAnywhere = await checkIfOnLimoAnywhere();
            console.log('On Limo Anywhere website:', onLimoAnywhere);
            
            if (!onLimoAnywhere) {
                throw new Error('Please navigate to Limo Anywhere website first.');
            }
            
            // Send data to content script for direct form filling
            console.log('Sending data to content script:', extractedData);
            
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'fillForm',
                    data: extractedData
                }, function(response) {
                    console.log('Form filling response:', response);
                    
                    if (response && response.success) {
                        showStatus(`Form filled successfully! ${response.message || ''}`, 'success');
                    } else {
                        showStatus(`Error filling form: ${response?.error || 'Unknown error'}`, 'error');
                    }
                });
            });
        } catch (error) {
            console.error('Error filling form:', error);
            showStatus(`Error: ${error.message}`, 'error');
        }
    }

    // Check if current tab is on Limo Anywhere website
    async function checkIfOnLimoAnywhere() {
        return new Promise((resolve) => {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs.length === 0) {
                    resolve(false);
                    return;
                }
                
                const activeTab = tabs[0];
                resolve(activeTab.url && activeTab.url.includes('mylimobiz.com'));
            });
        });
    }

    // Helper functions
    function displayResults(data) {
        console.log('Displaying results');
        
        if (!resultsBody) {
            console.error('Results body element not found');
            return;
        }
        
        // Clear previous results
        resultsBody.innerHTML = '';
        
        // Define sections and field order for better organization
        const sections = [
            {
                title: "Contact Information",
                fields: ["firstName", "lastName", "phone", "email"]
            },
            {
                title: "Pickup Information",
                fields: ["pickupLocation", "pickupDate", "pickupTime"]
            },
            {
                title: "Destination & Service",
                fields: ["destination", "serviceType", "vehicleType", "passengers", "hours"]
            },
            {
                title: "Address Details",
                fields: ["address", "city", "state", "zipCode"]
            }
        ];
        
        // Process fields by section
        let fieldCount = 0;
        
        sections.forEach(section => {
            let sectionHasData = false;
            
            // Check if this section has any data
            section.fields.forEach(field => {
                if (data[field]?.text) {
                    sectionHasData = true;
                }
            });
            
            if (sectionHasData) {
                // Add section header
                const headerRow = document.createElement('tr');
                headerRow.className = 'section-header';
                headerRow.innerHTML = `<td colspan="3">${section.title}</td>`;
                resultsBody.appendChild(headerRow);
                
                // Add fields in this section
                section.fields.forEach(field => {
                    if (!data[field] || !data[field].text) {
                        return;
                    }
                    
                    fieldCount++;
                    
                    const confidenceClass = data[field].confidence >= 0.8 ? 'high' : 
                                          data[field].confidence >= 0.5 ? 'medium' : 'low';
                    
                    // Format field name for display
                    const formattedField = formatFieldName(field);
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <span class="confidence-indicator confidence-${confidenceClass}"></span>
                            ${formattedField}
                        </td>
                        <td class="field-value">${data[field].text}</td>
                        <td>
                            <button class="edit-btn" data-field="${field}">Edit</button>
                        </td>
                    `;
                    
                    resultsBody.appendChild(row);
                });
            }
        });
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const field = btn.dataset.field;
                editField(field, extractedData[field].text);
            });
        });
        
        // Show results section only if we have at least one field
        if (fieldCount > 0) {
            if (resultsSection) {
                resultsSection.classList.remove('hidden');
                console.log('Results section displayed with', fieldCount, 'fields');
                expandPopupSize();
            }
        } else {
            showStatus('No information could be extracted. Please try again with more detailed text.', 'error');
        }
    }
    
    // Expand popup size when showing results
    function expandPopupSize() {
        document.body.style.width = '500px';  // Wider
        document.body.style.height = '650px'; // Taller
        
        // Force the popup to resize
        setTimeout(() => {
            chrome.runtime.sendMessage({ action: 'resizePopup' });
        }, 100);
    }

    // Format field names for display
    function formatFieldName(field) {
        switch (field) {
            case 'firstName': return 'First Name';
            case 'lastName': return 'Last Name';
            case 'address': return 'Address';
            case 'city': return 'City';
            case 'state': return 'State';
            case 'zipCode': return 'ZIP Code';
            case 'phone': return 'Phone';
            case 'email': return 'Email';
            case 'pickupLocation': return 'Pickup Location';
            case 'destination': return 'Destination';
            case 'pickupTime': return 'Pickup Time';
            case 'pickupDate': return 'Pickup Date';
            case 'passengers': return 'Passengers';
            case 'serviceType': return 'Service Type';
            case 'vehicleType': return 'Vehicle Type';
            case 'hours': return 'Hours';
            default: return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        }
    }

    function editField(field, currentValue) {
        console.log('Editing field:', field);
        const newValue = prompt(`Edit ${formatFieldName(field)}:`, currentValue);
        if (newValue !== null) {
            extractedData[field].text = newValue;
            extractedData[field].confidence = 1; // User-edited fields have 100% confidence
            
            // Update the display
            displayResults(extractedData);
        }
    }

    function showStatus(message, type) {
        console.log('Status:', type, message);
        
        if (!statusMessage || !statusContainer) {
            console.error('Status elements not found');
            return;
        }
        
        statusMessage.textContent = message;
        statusMessage.className = 'status-message';
        statusMessage.classList.add(`status-${type}`);
        statusContainer.classList.remove('hidden');
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusContainer.classList.add('hidden');
            }, 3000);
        }
    }
});