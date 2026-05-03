// OBB Baseline Survey System - Complete Survey Form with All Django Model Fields

window.CompleteSurveyForm = {
    // Initialize complete survey form
    init: function() {
        console.log('=== COMPLETE SURVEY FORM INITIALIZED ===');
        console.log('Available methods:', Object.keys(this));
        this.currentLevel = 'clan'; // Default level
        this.entityData = null;
        
        // Check for pre-filled entity data
        this.checkForPrefillData();
    },
    
    // Check for pre-filled entity data
    checkForPrefillData: function() {
        const prefillData = localStorage.getItem('prefillEntityData');
        if (prefillData) {
            try {
                const entityData = JSON.parse(prefillData);
                console.log('Found pre-filled entity data:', entityData);
                
                // Set the level and data for dynamic form
                this.setLevelAndData(entityData.type, entityData.data);
                
                // Pre-fill the form with entity data
                this.prefillFormWithEntityData(entityData);
                
                // Clear the pre-fill data after using it
                localStorage.removeItem('prefillEntityData');
            } catch (error) {
                console.error('Error parsing pre-fill data:', error);
            }
        }
    },
    
    // Set current hierarchy level and entity data
    setLevelAndData: function(level, entityData) {
        this.currentLevel = level;
        this.entityData = entityData;
        console.log('Form level set to:', level, 'with data:', entityData);
    },
    
    // Get form title based on current level
    getFormTitle: function() {
        const titles = {
            clan: 'Clan Information Survey',
            subclan: 'Sub-Clan Information Survey', 
            ridge: 'Ridge Information Survey'
        };
        return titles[this.currentLevel] || 'Clan Information Survey';
    },
    
    // Get section title based on current level
    getSectionTitle: function() {
        const titles = {
            clan: 'Clan Information',
            subclan: 'Sub-Clan Information',
            ridge: 'Ridge Information'
        };
        return titles[this.currentLevel] || 'Clan Information';
    },
    
    // Get color based on current level
    getLevelColor: function() {
        const colors = {
            clan: 'bg-red-600',
            subclan: 'bg-blue-600',
            ridge: 'bg-green-600'
        };
        return colors[this.currentLevel] || 'bg-red-600';
    },
    
    // Get field labels based on current level
    getFieldLabels: function() {
        const labels = {
            clan: {
                entityName: 'Clan Name',
                entityLeader: 'Clan Leader',
                entityContact: 'Clan Leader Contact'
            },
            subclan: {
                entityName: 'Sub-Clan Name',
                entityLeader: 'Sub-Clan Leader',
                entityContact: 'Sub-Clan Leader Contact'
            },
            ridge: {
                entityName: 'Ridge Name',
                entityLeader: 'Ridge Leader',
                entityContact: 'Ridge Leader Contact'
            }
        };
        return labels[this.currentLevel] || labels.clan;
    },
    
    // Build complete survey form with all fields
    buildForm: function() {
        const formTitle = this.getFormTitle();
        const sectionTitle = this.getSectionTitle();
        const levelColor = this.getLevelColor();
        const fieldLabels = this.getFieldLabels();
        const ringColor = this.currentLevel === 'clan' ? 'red' : this.currentLevel === 'subclan' ? 'blue' : 'green';
        
        // Build level-specific form content
        let formContent = '';
        if (this.currentLevel === 'clan') {
            formContent = this.buildClanForm(fieldLabels, ringColor);
        } else if (this.currentLevel === 'subclan') {
            formContent = this.buildSubClanForm(fieldLabels, ringColor);
        } else if (this.currentLevel === 'ridge') {
            formContent = this.buildRidgeForm(fieldLabels, ringColor);
        } else {
            formContent = this.buildClanForm(fieldLabels, ringColor); // Default to clan form
        }
        
        return `
            <div class="survey-header mb-4 sm:mb-6">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800">${formTitle}</h2>
                ${this.entityData ? `<p class="text-sm sm:text-base text-gray-600 mt-2">Filling details for: <strong>${this.entityData.name}</strong></p>` : ''}
            </div>
            
            <form class="complete-survey-form" id="surveyForm">
                ${formContent}
                
                <div class="form-actions mt-6 sm:mt-8">
                    <div class="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-4">
                        <button type="button" onclick="CompleteSurveyForm.resetForm()" class="w-full sm:w-auto bg-gray-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-md hover:bg-gray-600 text-sm sm:text-base">
                            <i class="fas fa-times mr-2"></i>Cancel
                        </button>
                        <button type="button" onclick="CompleteSurveyForm.submitForm()" class="w-full sm:w-auto bg-green-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-md hover:bg-green-700 text-sm sm:text-base">
                            <i class="fas fa-save mr-2"></i>Submit Survey
                        </button>
                    </div>
                </div>
            </form>
        `;
    },
    
    // Build clan-specific form
    buildClanForm: function(fieldLabels, ringColor) {
        return `
            <!-- ${this.getSectionTitle()} Section -->
            <div class="form-section">
                <h3 class="section-title ${this.getLevelColor()} text-white px-3 sm:px-4 py-2 rounded-t text-sm sm:text-base">${this.getSectionTitle()}</h3>
                <div class="section-content bg-white border border-gray-200 rounded-b p-3 sm:p-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">${fieldLabels.entityName} *</label>
                            <input type="text" name="clan_name" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter ${fieldLabels.entityName.toLowerCase()}">
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Number of Sub-Clans *</label>
                            <input type="number" name="number_of_sub_clans" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required min="0" placeholder="0">
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Number of Bitubhi *</label>
                            <input type="number" name="number_of_bitubhi" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required min="0" placeholder="0">
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Village *</label>
                            <input type="text" name="village" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter village">
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Parish *</label>
                            <input type="text" name="parish" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter parish">
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Sub-County *</label>
                            <input type="text" name="sub_county" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter sub-county">
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">District *</label>
                            <input type="text" name="district" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter district">
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">County *</label>
                            <input type="text" name="county" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter county">
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Clan Leader Name *</label>
                            <input type="text" name="clan_leader_name" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter clan leader name">
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Clan Leader Contact *</label>
                            <input type="text" name="clan_leader_contact" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter clan leader contact">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Clan-Specific Questions -->
            <div class="form-section mt-4 sm:mt-6">
                <h3 class="section-title ${this.getLevelColor()} text-white px-3 sm:px-4 py-2 rounded-t text-sm sm:text-base">Clan-Specific Questions</h3>
                <div class="section-content bg-white border border-gray-200 rounded-b p-3 sm:p-4">
                    <div class="space-y-3 sm:space-y-4">
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">What is the origin of this clan?</label>
                            <textarea name="clan_origin" rows="3" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" placeholder="Describe the clan's origin and history"></textarea>
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">What are the main clan traditions?</label>
                            <textarea name="clan_traditions" rows="3" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" placeholder="Describe the clan's main traditions and customs"></textarea>
                        </div>
                        <div>
                            <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Who are the clan elders?</label>
                            <textarea name="clan_elders" rows="3" class="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" placeholder="List the names and roles of clan elders"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Build sub-clan-specific form
    buildSubClanForm: function(fieldLabels, ringColor) {
        return `
            <!-- ${this.getSectionTitle()} Section -->
            <div class="form-section">
                <h3 class="section-title ${this.getLevelColor()} text-white px-4 py-2 rounded-t">${this.getSectionTitle()}</h3>
                <div class="section-content bg-white border border-gray-200 rounded-b p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">${fieldLabels.entityName} *</label>
                            <input type="text" name="subclan_name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter ${fieldLabels.entityName.toLowerCase()}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Parent Clan Name *</label>
                            <input type="text" name="parent_clan" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter parent clan name">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Number of Ridges *</label>
                            <input type="number" name="number_of_ridges" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required min="0" placeholder="0">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Village *</label>
                            <input type="text" name="village" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter village">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Parish *</label>
                            <input type="text" name="parish" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter parish">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sub-County *</label>
                            <input type="text" name="sub_county" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter sub-county">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">District *</label>
                            <input type="text" name="district" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter district">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">County *</label>
                            <input type="text" name="county" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter county">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sub-Clan Leader Name *</label>
                            <input type="text" name="subclan_leader_name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter sub-clan leader name">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sub-Clan Leader Contact *</label>
                            <input type="text" name="subclan_leader_contact" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter sub-clan leader contact">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Sub-Clan-Specific Questions -->
            <div class="form-section mt-6">
                <h3 class="section-title ${this.getLevelColor()} text-white px-4 py-2 rounded-t">Sub-Clan-Specific Questions</h3>
                <div class="section-content bg-white border border-gray-200 rounded-b p-4">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">How did this sub-clan form?</label>
                            <textarea name="subclan_formation" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" placeholder="Describe how the sub-clan was formed"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">What are the main responsibilities of this sub-clan?</label>
                            <textarea name="subclan_responsibilities" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" placeholder="Describe the main responsibilities of this sub-clan"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Who are the key leaders in this sub-clan?</label>
                            <textarea name="subclan_leaders" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" placeholder="List the key leaders and their roles"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Build ridge-specific form
    buildRidgeForm: function(fieldLabels, ringColor) {
        return `
            <!-- ${this.getSectionTitle()} Section -->
            <div class="form-section">
                <h3 class="section-title ${this.getLevelColor()} text-white px-4 py-2 rounded-t">${this.getSectionTitle()}</h3>
                <div class="section-content bg-white border border-gray-200 rounded-b p-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">${fieldLabels.entityName} *</label>
                            <input type="text" name="ridge_name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter ${fieldLabels.entityName.toLowerCase()}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Parent Sub-Clan Name *</label>
                            <input type="text" name="parent_subclan" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter parent sub-clan name">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Number of Households *</label>
                            <input type="number" name="number_of_households" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required min="0" placeholder="0">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Village *</label>
                            <input type="text" name="village" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter village">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Parish *</label>
                            <input type="text" name="parish" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter parish">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sub-County *</label>
                            <input type="text" name="sub_county" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter sub-county">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">District *</label>
                            <input type="text" name="district" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter district">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">County *</label>
                            <input type="text" name="county" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter county">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Ridge Leader Name *</label>
                            <input type="text" name="ridge_leader_name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter ridge leader name">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Ridge Leader Contact *</label>
                            <input type="text" name="ridge_leader_contact" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" required placeholder="Enter ridge leader contact">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Ridge-Specific Questions -->
            <div class="form-section mt-6">
                <h3 class="section-title ${this.getLevelColor()} text-white px-4 py-2 rounded-t">Ridge-Specific Questions</h3>
                <div class="section-content bg-white border border-gray-200 rounded-b p-4">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">What is the geographical area of this ridge?</label>
                            <textarea name="ridge_geography" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" placeholder="Describe the geographical area and boundaries"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">What are the main economic activities in this ridge?</label>
                            <textarea name="ridge_economic_activities" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" placeholder="Describe the main economic activities"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">What are the main challenges faced by this ridge?</label>
                            <textarea name="ridge_challenges" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-${ringColor}-500" placeholder="Describe the main challenges"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Pre-fill form with entity data
    prefillFormWithEntityData: function(entityData) {
        const { type, data } = entityData;
        
        // Map entity data to form fields
        const fieldMappings = {
            clan: {
                clan_name: data.name,
                clan_leader_name: data.leader_name,
                clan_leader_contact: data.leader_contact,
                village: data.village,
                parish: data.parish,
                sub_county: data.sub_county,
                district: data.district,
                county: data.county
            },
            subclan: {
                subclan_name: data.name,
                subclan_leader_name: data.leader_name,
                subclan_leader_contact: data.leader_contact,
                village: data.village,
                parish: data.parish,
                sub_county: data.sub_county,
                district: data.district,
                county: data.county
            },
            ridge: {
                ridge_name: data.name,
                ridge_leader_name: data.leader_name,
                ridge_leader_contact: data.leader_contact,
                village: data.village,
                parish: data.parish,
                sub_county: data.sub_county,
                district: data.district,
                county: data.county
            }
        };
        
        const mappings = fieldMappings[type];
        if (mappings) {
            // Apply pre-filled data to form
            setTimeout(() => {
                Object.keys(mappings).forEach(fieldName => {
                    const field = document.querySelector(`[name="${fieldName}"]`);
                    if (field && mappings[fieldName]) {
                        field.value = mappings[fieldName];
                        // Trigger change event if needed
                        field.dispatchEvent(new Event('change'));
                    }
                });
                
                // Show notification about pre-filled data
                this.showSuccess(`Form pre-filled with ${type} information`);
                
                // Add a visual indicator
                this.addPrefillIndicator(type, data.name);
            }, 500); // Wait for form to be fully loaded
        }
    },
    
    // Add pre-fill indicator
    addPrefillIndicator: function(entityType, entityName) {
        const indicator = document.createElement('div');
        indicator.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
        indicator.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                <span>Form pre-filled with ${entityType} "${entityName}" information</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-green-600 hover:text-green-800">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Insert at the top of the form
        const formContainer = document.getElementById('surveyFormContainer');
        if (formContainer) {
            const form = formContainer.querySelector('form');
            if (form) {
                form.insertBefore(indicator, form.firstChild);
            }
        }
    },
    
    // Show success message
    showSuccess: function(message) {
        // Simple success notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },
    
    // Show error message
    showError: function(message) {
        // Simple error notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },
    
    // Submit form
    submitForm: function() {
        const form = document.getElementById('surveyForm');
        if (!form) {
            this.showError('Form not found');
            return;
        }
        
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Add metadata
        data.survey_level = this.currentLevel;
        data.entity_name = this.entityData?.name || '';
        data.submitted_at = new Date().toISOString();
        data.device_info = this.getDeviceInfo();
        
        console.log('Submitting survey data:', data);
        
        // Show success message
        this.showSuccess('Survey submitted successfully!');
        
        // Reset form after submission
        setTimeout(() => {
            form.reset();
            // Go back to previous page or dashboard
            if (window.AppSimple) {
                AppSimple.showAuthenticatedPage('surveys');
            }
        }, 2000);
    },
    
    // Get device info for submission
    getDeviceInfo: function() {
        return {
            device_type: 'web',
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform
        };
    },
    
    // Reset form
    resetForm: function() {
        const form = document.getElementById('surveyForm');
        if (form) {
            form.reset();
        }
        // Go back to previous page
        if (window.AppSimple) {
            AppSimple.showAuthenticatedPage('surveys');
        }
    }
};
