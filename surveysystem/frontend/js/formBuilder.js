// OBB Baseline Survey System - Dynamic Form Builder

window.FormBuilder = {
    currentSection: 0,
    formData: {},
    dynamicSections: {},
    
    // Initialize form builder
    init: function() {
        this.formData = {};
        this.dynamicSections = {};
        this.currentSection = 0;
        
        console.log('Form builder initialized');
    },
    
    // Build complete survey form
    buildSurveyForm: function() {
        const formHTML = `
            <form id="surveyForm" class="survey-form">
                ${this.buildSection('clan', 'Clan Information')}
                ${this.buildSection('collector', 'Collector Information')}
                ${this.buildSection('clan_leader', 'Clan Leader Information')}
                ${this.buildSection('coordinator', 'Coordinator Information')}
                ${this.buildSection('chairperson', 'Chairperson Information')}
                ${this.buildDynamicSections()}
                ${this.buildSection('saving_group', 'Saving Group')}
                ${this.buildSection('enterprises', 'Enterprises')}
                ${this.buildSection('water_sources', 'Water Sources')}
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="FormBuilder.saveDraft()">
                        <i class="fas fa-save mr-2"></i>Save Draft
                    </button>
                    <button type="button" class="btn btn-primary" onclick="FormBuilder.submitForm()">
                        <i class="fas fa-paper-plane mr-2"></i>Submit Survey
                    </button>
                </div>
            </form>
        `;
        
        return formHTML;
    },
    
    // Build form section
    buildSection: function(sectionName, sectionTitle) {
        const sectionConfig = AgentFormFields[sectionName];
        if (!sectionConfig) return '';
        
        let html = `
            <div class="form-section" data-section="${sectionName}">
                <div class="section-header">
                    <h3 class="section-title">${sectionTitle}</h3>
                </div>
                <div class="section-content">
        `;
        
        for (const fieldName in sectionConfig) {
            const fieldConfig = sectionConfig[fieldName];
            html += getFormFieldHTML(fieldConfig, fieldName, sectionName);
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    },
    
    // Build dynamic sections
    buildDynamicSections: function() {
        const dynamicConfig = AgentFormFields.dynamic;
        let html = '';
        
        for (const sectionKey in dynamicConfig) {
            const section = dynamicConfig[sectionKey];
            html += `
                <div class="form-section dynamic-section" data-section="${sectionKey}">
                    <div class="section-header">
                        <h3 class="section-title">${section.title}</h3>
                        <div class="section-controls">
                            <button type="button" class="btn btn-sm btn-primary" onclick="FormBuilder.addDynamicItem('${sectionKey}')">
                                <i class="fas fa-plus mr-1"></i>Add Item
                            </button>
                        </div>
                    </div>
                    <div class="section-content">
                        <div class="dynamic-items" data-section="${sectionKey}">
                            <!-- Dynamic items will be added here -->
                        </div>
                    </div>
                </div>
            `;
        }
        
        return html;
    },
    
    // Add dynamic item
    addDynamicItem: function(sectionKey) {
        const sectionConfig = AgentFormFields.dynamic[sectionKey];
        if (!sectionConfig) return;
        
        const itemId = Date.now().toString();
        const itemHTML = `
            <div class="dynamic-item" data-item-id="${itemId}">
                <div class="item-header">
                    <span class="item-number">Item ${this.getItemCount(sectionKey) + 1}</span>
                    <button type="button" class="btn btn-sm btn-danger" onclick="FormBuilder.removeDynamicItem('${sectionKey}', '${itemId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="item-content">
                    ${this.buildDynamicItemFields(sectionKey, itemId)}
                </div>
            </div>
        `;
        
        const container = document.querySelector(`.dynamic-items[data-section="${sectionKey}"]`);
        if (container) {
            container.insertAdjacentHTML('beforeend', itemHTML);
            this.initializeDynamicItemFields(sectionKey, itemId);
        }
        
        // Store item reference
        if (!this.dynamicSections[sectionKey]) {
            this.dynamicSections[sectionKey] = [];
        }
        this.dynamicSections[sectionKey].push(itemId);
    },
    
    // Remove dynamic item
    removeDynamicItem: function(sectionKey, itemId) {
        const item = document.querySelector(`.dynamic-item[data-item-id="${itemId}"]`);
        if (item) {
            item.remove();
            
            // Remove from tracking
            if (this.dynamicSections[sectionKey]) {
                const index = this.dynamicSections[sectionKey].indexOf(itemId);
                if (index > -1) {
                    this.dynamicSections[sectionKey].splice(index, 1);
                }
            }
            
            // Update item numbers
            this.updateDynamicItemNumbers(sectionKey);
        }
    },
    
    // Build dynamic item fields
    buildDynamicItemFields: function(sectionKey, itemId) {
        const sectionConfig = AgentFormFields.dynamic[sectionKey];
        if (!sectionConfig) return '';
        
        let html = '';
        for (const fieldName in sectionConfig.fields) {
            const fieldConfig = sectionConfig.fields[fieldName];
            const dynamicFieldName = `${sectionKey}_${itemId}_${fieldName}`;
            html += getFormFieldHTML(fieldConfig, dynamicFieldName, 'dynamic');
        }
        
        return html;
    },
    
    // Initialize dynamic item fields
    initializeDynamicItemFields: function(sectionKey, itemId) {
        const sectionConfig = AgentFormFields.dynamic[sectionKey];
        if (!sectionConfig) return;
        
        for (const fieldName in sectionConfig.fields) {
            const fieldConfig = sectionConfig.fields[fieldName];
            const dynamicFieldName = `${sectionKey}_${itemId}_${fieldName}`;
            
            // Initialize signature pads
            if (fieldConfig.type === 'signature') {
                this.initializeSignaturePad(`${dynamicFieldName}_canvas`, dynamicFieldName);
            }
            
            // Setup conditional fields
            if (fieldConfig.conditional) {
                this.setupConditionalField(dynamicFieldName, fieldConfig.conditional);
            }
        }
    },
    
    // Get item count for section
    getItemCount: function(sectionKey) {
        return this.dynamicSections[sectionKey] ? this.dynamicSections[sectionKey].length : 0;
    },
    
    // Update dynamic item numbers
    updateDynamicItemNumbers: function(sectionKey) {
        const items = document.querySelectorAll(`.dynamic-items[data-section="${sectionKey}"] .dynamic-item`);
        items.forEach((item, index) => {
            const numberElement = item.querySelector('.item-number');
            if (numberElement) {
                numberElement.textContent = `Item ${index + 1}`;
            }
        });
    },
    
    // Initialize signature pad
    initializeSignaturePad: function(canvasId, fieldName) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)',
            minWidth: 0.5,
            maxWidth: 2.5
        });
        
        // Store signature pad reference
        if (!window.signaturePads) {
            window.signaturePads = {};
        }
        window.signaturePads[canvasId] = signaturePad;
        
        // Setup clear button
        const clearBtn = canvas.parentElement.querySelector('.signature-controls button');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                signaturePad.clear();
                // Clear hidden field
                const hiddenField = document.getElementById(`${fieldName}_data`);
                if (hiddenField) {
                    hiddenField.value = '';
                }
            });
        }
        
        // Save signature data to hidden field
        canvas.addEventListener('mouseup', () => {
            const hiddenField = document.getElementById(`${fieldName}_data`);
            if (hiddenField) {
                hiddenField.value = signaturePad.toDataURL();
            }
        });
        
        // Resize canvas to match display size
        this.resizeCanvas(canvas);
    },
    
    // Resize canvas
    resizeCanvas: function(canvas) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
    },
    
    // Setup conditional field
    setupConditionalField: function(fieldName, conditional) {
        const triggerField = document.querySelector(`[name="${conditional.field}"]`);
        const conditionalField = document.querySelector(`[name="${fieldName}"]`);
        
        if (!triggerField || !conditionalField) return;
        
        // Initial state
        const shouldShow = triggerField.value === conditional.value;
        this.toggleConditionalField(conditionalField, shouldShow);
        
        // Listen for changes
        triggerField.addEventListener('change', (e) => {
            const shouldShow = e.target.value === conditional.value;
            this.toggleConditionalField(conditionalField, shouldShow);
        });
    },
    
    // Toggle conditional field
    toggleConditionalField: function(field, show) {
        const wrapper = field.closest('.conditional-field');
        if (wrapper) {
            wrapper.style.display = show ? 'block' : 'none';
        }
    },
    
    // Collect form data
    collectFormData: function() {
        const form = document.getElementById('surveyForm');
        if (!form) return null;
        
        const formData = new FormData(form);
        const data = {};
        
        // Collect regular fields
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        // Collect dynamic sections
        for (const sectionKey in this.dynamicSections) {
            data[sectionKey] = [];
            
            this.dynamicSections[sectionKey].forEach(itemId => {
                const itemData = {};
                const sectionConfig = AgentFormFields.dynamic[sectionKey];
                
                for (const fieldName in sectionConfig.fields) {
                    const dynamicFieldName = `${sectionKey}_${itemId}_${fieldName}`;
                    const fieldValue = this.getFieldValue(dynamicFieldName);
                    
                    if (fieldValue !== null && fieldValue !== '') {
                        itemData[fieldName] = fieldValue;
                    }
                }
                
                if (Object.keys(itemData).length > 0) {
                    data[sectionKey].push(itemData);
                }
            });
        }
        
        return data;
    },
    
    // Get field value
    getFieldValue: function(fieldName) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (!field) return null;
        
        if (field.type === 'checkbox') {
            if (field.name in document.getElementsByName(fieldName)) {
                // Multiple checkboxes
                const checkboxes = document.getElementsByName(fieldName);
                const values = [];
                checkboxes.forEach(cb => {
                    if (cb.checked) values.push(cb.value);
                });
                return values;
            } else {
                // Single checkbox
                return field.checked;
            }
        } else if (field.type === 'radio') {
            const radio = document.querySelector(`[name="${fieldName}"]:checked`);
            return radio ? radio.value : null;
        } else {
            return field.value;
        }
    },
    
    // Validate form
    validateForm: function() {
        const errors = {};
        let isValid = true;
        
        // Validate regular fields
        for (const sectionName in AgentFormFields) {
            if (sectionName === 'dynamic') continue;
            
            const sectionConfig = AgentFormFields[sectionName];
            for (const fieldName in sectionConfig) {
                const fieldConfig = sectionConfig[fieldName];
                const value = this.getFieldValue(fieldName);
                
                // Skip conditional fields that shouldn't be shown
                if (fieldConfig.conditional) {
                    const triggerValue = this.getFieldValue(fieldConfig.conditional.field);
                    if (triggerValue !== fieldConfig.conditional.value) {
                        continue;
                    }
                }
                
                const validation = validateFormField(fieldName, value, fieldConfig);
                if (!validation.valid) {
                    errors[fieldName] = validation.message;
                    isValid = false;
                }
            }
        }
        
        // Validate dynamic sections
        for (const sectionKey in this.dynamicSections) {
            const sectionConfig = AgentFormFields.dynamic[sectionKey];
            
            this.dynamicSections[sectionKey].forEach(itemId => {
                for (const fieldName in sectionConfig.fields) {
                    const fieldConfig = sectionConfig.fields[fieldName];
                    const dynamicFieldName = `${sectionKey}_${itemId}_${fieldName}`;
                    const value = this.getFieldValue(dynamicFieldName);
                    
                    const validation = validateFormField(dynamicFieldName, value, fieldConfig);
                    if (!validation.valid) {
                        errors[dynamicFieldName] = validation.message;
                        isValid = false;
                    }
                }
            });
        }
        
        return {
            valid: isValid,
            errors: errors
        };
    },
    
    // Show validation errors
    showValidationErrors: function(errors) {
        // Clear previous errors
        this.clearValidationErrors();
        
        for (const fieldName in errors) {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.classList.add('is-invalid');
                
                // Create error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                errorDiv.textContent = errors[fieldName];
                
                field.parentNode.appendChild(errorDiv);
            }
        }
    },
    
    // Clear validation errors
    clearValidationErrors: function() {
        document.querySelectorAll('.is-invalid').forEach(field => {
            field.classList.remove('is-invalid');
        });
        
        document.querySelectorAll('.invalid-feedback').forEach(error => {
            error.remove();
        });
    },
    
    // Save draft
    saveDraft: async function() {
        try {
            const data = this.collectFormData();
            if (!data) {
                Toast.error('No data to save');
                return;
            }
            
            // Add draft metadata
            const draftData = {
                ...data,
                draft: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Save to database
            if (window.Database) {
                await Database.saveDraft(draftData);
            } else {
                // Fallback to localStorage
                const drafts = JSON.parse(localStorage.getItem('surveyDrafts') || '[]');
                drafts.push(draftData);
                localStorage.setItem('surveyDrafts', JSON.stringify(drafts));
            }
            
            Toast.success('Draft saved successfully');
            
        } catch (error) {
            console.error('Failed to save draft:', error);
            Toast.error('Failed to save draft');
        }
    },
    
    // Submit form
    submitForm: async function() {
        try {
            // Validate form
            const validation = this.validateForm();
            if (!validation.valid) {
                this.showValidationErrors(validation.errors);
                Toast.error('Please fix the errors before submitting');
                return;
            }
            
            const data = this.collectFormData();
            if (!data) {
                Toast.error('No data to submit');
                return;
            }
            
            // Add submission metadata
            const surveyData = {
                ...data,
                draft: false,
                submitted_at: new Date().toISOString(),
                agent_id: window.Auth?.getCurrentUser()?.id || 1
            };
            
            // Show loading
            Loading.show('Submitting survey...');
            
            // Submit to backend or save to outbox
            if (window.Network?.isOnline() && !AppConfig.MOCK_MODE) {
                // Try to submit to backend
                try {
                    const response = await fetch(AppUtils.getApiUrl('/surveys/'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${window.Auth?.getAuthToken()}`,
                            'X-Device-ID': window.DeviceManager?.getId()
                        },
                        body: JSON.stringify(surveyData)
                    });
                    
                    if (response.ok) {
                        Toast.success('Survey submitted successfully');
                        this.resetForm();
                    } else {
                        throw new Error('Submission failed');
                    }
                } catch (error) {
                    // Save to outbox for sync
                    await this.saveToOutbox(surveyData);
                    Toast.warning('Survey saved for offline sync');
                }
            } else {
                // Save to outbox for sync
                await this.saveToOutbox(surveyData);
                Toast.warning('Survey saved for offline sync');
            }
            
            Loading.hide();
            
        } catch (error) {
            console.error('Failed to submit survey:', error);
            Loading.hide();
            Toast.error('Failed to submit survey');
        }
    },
    
    // Save to outbox for sync
    saveToOutbox: async function(surveyData) {
        if (window.Sync) {
            await Sync.addToOutbox('survey', surveyData);
        } else {
            // Fallback to localStorage
            const outbox = JSON.parse(localStorage.getItem('surveyOutbox') || '[]');
            outbox.push({
                type: 'survey',
                data: surveyData,
                created_at: new Date().toISOString()
            });
            localStorage.setItem('surveyOutbox', JSON.stringify(outbox));
        }
    },
    
    // Reset form
    resetForm: function() {
        const form = document.getElementById('surveyForm');
        if (form) {
            form.reset();
        }
        
        // Clear dynamic sections
        this.dynamicSections = {};
        document.querySelectorAll('.dynamic-item').forEach(item => item.remove());
        
        // Clear validation errors
        this.clearValidationErrors();
        
        // Clear signature pads
        if (window.signaturePads) {
            for (const canvasId in window.signaturePads) {
                window.signaturePads[canvasId].clear();
            }
        }
    },
    
    // Load draft
    loadDraft: async function(draftId) {
        try {
            let draftData;
            
            if (window.Database) {
                draftData = await Database.getDraft(draftId);
            } else {
                // Fallback to localStorage
                const drafts = JSON.parse(localStorage.getItem('surveyDrafts') || '[]');
                draftData = drafts.find(d => d.id === draftId);
            }
            
            if (!draftData) {
                Toast.error('Draft not found');
                return;
            }
            
            // Populate form with draft data
            this.populateForm(draftData);
            
            Toast.success('Draft loaded successfully');
            
        } catch (error) {
            console.error('Failed to load draft:', error);
            Toast.error('Failed to load draft');
        }
    },
    
    // Populate form with data
    populateForm: function(data) {
        // Reset form first
        this.resetForm();
        
        // Populate regular fields
        for (const fieldName in data) {
            if (typeof data[fieldName] === 'object' && !Array.isArray(data[fieldName])) {
                continue; // Skip objects (they're dynamic sections)
            }
            
            this.setFieldValue(fieldName, data[fieldName]);
        }
        
        // Populate dynamic sections
        for (const sectionKey in this.dynamicSections) {
            if (data[sectionKey] && Array.isArray(data[sectionKey])) {
                data[sectionKey].forEach(itemData => {
                    this.addDynamicItem(sectionKey);
                    // Populate the newly added item
                    this.populateDynamicItem(sectionKey, itemData);
                });
            }
        }
    },
    
    // Set field value
    setFieldValue: function(fieldName, value) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (!field) return;
        
        if (field.type === 'checkbox') {
            if (Array.isArray(value)) {
                // Multiple checkboxes
                value.forEach(val => {
                    const checkbox = document.querySelector(`[name="${fieldName}"][value="${val}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            } else {
                // Single checkbox
                field.checked = Boolean(value);
            }
        } else if (field.type === 'radio') {
            const radio = document.querySelector(`[name="${fieldName}"][value="${value}"]`);
            if (radio) radio.checked = true;
        } else {
            field.value = value;
        }
        
        // Trigger change event for conditional fields
        field.dispatchEvent(new Event('change'));
    }
};
