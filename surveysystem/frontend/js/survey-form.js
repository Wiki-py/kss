// OBB Baseline Survey System - Working Survey Form

window.SurveyForm = {
    // Initialize survey form
    init: function() {
        console.log('Survey form initialized');
    },
    
    // Build working survey form
    buildForm: function() {
        return `
            <div class="survey-form">
                <!-- Clan Information Section -->
                <div class="form-section">
                    <h3 class="section-title bg-red-600 text-white px-4 py-2 rounded-t">Clan Information</h3>
                    <div class="section-content bg-white border border-gray-200 rounded-b p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Clan Name *</label>
                                <input type="text" name="clan_name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter clan name">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Number of Sub-Clans *</label>
                                <input type="number" name="number_of_sub_clans" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required min="0" placeholder="0">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Number of Bitubhi *</label>
                                <input type="number" name="number_of_bitubhi" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required min="0" placeholder="0">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Village *</label>
                                <input type="text" name="village" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter village">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Parish *</label>
                                <input type="text" name="parish" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter parish">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Sub-County *</label>
                                <input type="text" name="sub_county" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter sub-county">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">District *</label>
                                <input type="text" name="district" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter district">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">County *</label>
                                <input type="text" name="county" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter county">
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Headquarters Address *</label>
                                <textarea name="headquarters_address" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter headquarters address"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Population Section -->
                <div class="form-section mt-6">
                    <h3 class="section-title bg-yellow-500 text-black px-4 py-2 rounded-t">Population Statistics</h3>
                    <div class="section-content bg-white border border-gray-200 rounded-b p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Total Households *</label>
                                <input type="number" name="total_households" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required min="0" placeholder="0">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Total Population *</label>
                                <input type="number" name="total_population" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required min="0" placeholder="0">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Male Population *</label>
                                <input type="number" name="male_population" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required min="0" placeholder="0">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Female Population *</label>
                                <input type="number" name="female_population" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required min="0" placeholder="0">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Dynamic Sub-Clans Section -->
                <div class="form-section mt-6">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="section-title bg-green-600 text-white px-4 py-2 rounded">Sub-Clans</h3>
                        <button type="button" onclick="SurveyForm.addSubClan()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            <i class="fas fa-plus mr-2"></i>Add Sub-Clan
                        </button>
                    </div>
                    <div id="subClansContainer" class="section-content bg-white border border-gray-200 rounded-b p-4">
                        <!-- Sub-clans will be added here -->
                    </div>
                </div>
                
                <!-- Committee Members Section -->
                <div class="form-section mt-6">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="section-title bg-blue-600 text-white px-4 py-2 rounded">Executive Committee Members</h3>
                        <button type="button" onclick="SurveyForm.addCommitteeMember()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>Add Member
                        </button>
                    </div>
                    <div id="committeeContainer" class="section-content bg-white border border-gray-200 rounded-b p-4">
                        <!-- Committee members will be added here -->
                    </div>
                </div>
                
                <!-- Signatures Section -->
                <div class="form-section mt-6">
                    <h3 class="section-title bg-purple-600 text-white px-4 py-2 rounded-t">Signatures</h3>
                    <div class="section-content bg-white border border-gray-200 rounded-b p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Collector Name *</label>
                                <input type="text" name="collector_name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter collector name">
                                <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">Collector Contact *</label>
                                <input type="text" name="collector_contact" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter phone number">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Clan Leader Name *</label>
                                <input type="text" name="clan_leader_name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter clan leader name">
                                <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">Clan Leader Title *</label>
                                <input type="text" name="clan_leader_title" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter clan leader title">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Form Actions -->
                <div class="form-actions mt-6 flex justify-end space-x-4">
                    <button type="button" onclick="AppSimple.showAgentDashboard()" class="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Dashboard
                    </button>
                    <button type="button" onclick="SurveyForm.saveDraft()" class="bg-yellow-500 text-black px-6 py-2 rounded hover:bg-yellow-600">
                        <i class="fas fa-save mr-2"></i>Save Draft
                    </button>
                    <button type="button" onclick="SurveyForm.submitSurvey()" class="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
                        <i class="fas fa-paper-plane mr-2"></i>Submit Survey
                    </button>
                </div>
            </div>
        `;
    },
    
    // Add sub-clan
    addSubClan: function() {
        const container = document.getElementById('subClansContainer');
        const subClanCount = container.children.length + 1;
        
        const subClanHTML = `
            <div class="sub-clan-item bg-gray-50 border border-gray-200 rounded p-4 mb-4">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-semibold text-gray-800">Sub-Clan ${subClanCount}</h4>
                    <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Sub-Clan Name *</label>
                        <input type="text" name="sub_clan_name_${subClanCount}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter sub-clan name">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Leader Name</label>
                        <input type="text" name="sub_clan_leader_${subClanCount}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Enter leader name">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                        <input type="text" name="sub_clan_contact_${subClanCount}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Enter contact number">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea name="sub_clan_address_${subClanCount}" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Enter address"></textarea>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', subClanHTML);
    },
    
    // Add committee member
    addCommitteeMember: function() {
        const container = document.getElementById('committeeContainer');
        const memberCount = container.children.length + 1;
        
        const memberHTML = `
            <div class="committee-item bg-gray-50 border border-gray-200 rounded p-4 mb-4">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-semibold text-gray-800">Committee Member ${memberCount}</h4>
                    <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Member Name *</label>
                        <input type="text" name="committee_name_${memberCount}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required placeholder="Enter member name">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
                        <input type="text" name="committee_position_${memberCount}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Enter position">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                        <select name="committee_sex_${memberCount}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required>
                            <option value="">Select...</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Phone Contact</label>
                        <input type="text" name="committee_phone_${memberCount}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Enter phone number">
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', memberHTML);
    },
    
    // Save draft
    saveDraft: function() {
        console.log('Saving draft...');
        alert('Draft saved successfully! (This is a demo - actual save functionality will be implemented)');
    },
    
    // Submit survey
    submitSurvey: async function() {
        try {
            console.log('Submitting survey...');
            
            // Collect form data
            const formData = this.collectFormData();
            if (!formData) {
                this.showError('No data to submit');
                return;
            }
            
            // Show loading
            this.showLoading('Submitting survey...');
            
            // Call real API
            const response = await SurveyAPI.submitSurvey(formData);
            
            if (response.success) {
                this.showSuccess('Survey submitted successfully!');
                this.resetForm();
                
                // Redirect to dashboard after successful submission
                setTimeout(() => {
                    AppSimple.showAuthenticatedPage('surveys');
                }, 2000);
            } else {
                this.showError(response.error || 'Failed to submit survey');
            }
            
        } catch (error) {
            console.error('Submit survey error:', error);
            
            // Fallback to mock submission if backend is not available
            if (error.status === 0 || error.message.includes('fetch')) {
                console.log('Backend not available, using mock submission');
                this.mockSubmitSurvey();
            } else {
                this.showError(error.message || 'Failed to submit survey');
            }
        } finally {
            this.hideLoading();
        }
    },
    
    // Mock submit survey fallback
    mockSubmitSurvey: function() {
        console.log('Survey submitted (mock)');
        this.showSuccess('Survey submitted successfully! (Saved locally)');
        
        // Save to localStorage for demo
        const formData = this.collectFormData();
        if (formData) {
            const surveys = JSON.parse(localStorage.getItem('surveys') || '[]');
            surveys.push({
                ...formData,
                id: Date.now(),
                submitted_at: new Date().toISOString(),
                status: 'submitted'
            });
            localStorage.setItem('surveys', JSON.stringify(surveys));
        }
        
        // Reset form and redirect
        setTimeout(() => {
            this.resetForm();
            AppSimple.showAuthenticatedPage('surveys');
        }, 2000);
    },
    
    // Collect form data
    collectFormData: function() {
        const form = document.querySelector('.survey-form');
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
        
        // Add metadata
        data.submitted_at = new Date().toISOString();
        data.agent_id = JSON.parse(localStorage.getItem('currentUser')).id;
        
        return data;
    },
    
    // Show loading
    showLoading: function(message) {
        if (window.Loading) {
            Loading.show(message);
        }
    },
    
    // Hide loading
    hideLoading: function() {
        if (window.Loading) {
            Loading.hide();
        }
    },
    
    // Show success message
    showSuccess: function(message) {
        if (window.Toast && window.Toast.success) {
            Toast.success(message);
        } else {
            alert(message);
        }
    },
    
    // Show error message
    showError: function(message) {
        if (window.Toast && window.Toast.error) {
            Toast.error(message);
        } else {
            alert(message);
        }
    },
};
