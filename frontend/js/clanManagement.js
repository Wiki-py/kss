// OBB Baseline Survey System - Clan Management for Agents

window.ClanManagement = {
    // Initialize clan management
    init: function() {
        console.log('Clan management initialized');
        this.allClans = [];
        this.currentClan = null;
        this.subClans = [];
        this.ridges = {};
        this.formLevel = 'clan'; // clan, subclan, ridge
        this.viewMode = 'selection'; // selection, management
    },
    
    // Build main clan management interface
    buildInterface: function() {
        return `
            <div class="clan-management">
                <!-- Header -->
                <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">Clan Management System</h2>
                            <p class="text-gray-600">Select a clan to manage or create a new one</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="ClanManagement.refreshData()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                <i class="fas fa-sync mr-2"></i>Refresh
                            </button>
                            <button onclick="AppSimple.showAuthenticatedPage('dashboard')" class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                                <i class="fas fa-arrow-left mr-2"></i>Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content Area -->
                <div id="clanManagementContent" class="p-6 space-y-6">
                    <!-- Content will be loaded here based on view mode -->
                </div>
            </div>
        `;
    },
    
    // Load clan data
    loadClanData: async function() {
        try {
            console.log('Loading clan data...');
            // Get all clans
            const response = await ClanAPI.getAllClans();
            console.log('Clan API response:', response);
            
            if (response.success) {
                console.log('Successfully loaded clans:', response.data);
                this.allClans = response.data;
                this.showClanSelection();
            } else {
                console.error('API returned error:', response);
                this.showError(`Failed to load clan data: ${response.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to load clan data:', error);
            this.showError(`Failed to connect to backend: ${error.message}`);
        }
    },
    
    // Show error state
    showErrorState: function(errorMessage) {
        const container = document.getElementById('clanManagementContent');
        if (!container) return;
        
        container.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
                <i class="fas fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-800 mb-2">Unable to Load Clans</h3>
                <p class="text-gray-600 mb-6">${errorMessage}</p>
                <div class="space-x-4">
                    <button onclick="ClanManagement.loadClanData()" class="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
                        <i class="fas fa-sync mr-2"></i>Retry
                    </button>
                    <button onclick="ClanManagement.showCreateClanForm()" class="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700">
                        <i class="fas fa-plus mr-2"></i>Create New Clan
                    </button>
                </div>
            </div>
        `;
    },
    
    // Show clan selection interface
    showClanSelection: function() {
        this.viewMode = 'selection';
        const container = document.getElementById('clanManagementContent');
        if (!container) return;
        
        if (this.allClans.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 text-center">
                    <i class="fas fa-users text-4xl sm:text-5xl lg:text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Clans Found</h3>
                    <p class="text-sm sm:text-base text-gray-600 mb-6">There are no clans created yet. Create the first clan to get started.</p>
                    <button onclick="ClanManagement.showCreateClanForm()" class="bg-green-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded hover:bg-green-700 text-sm sm:text-base">
                        <i class="fas fa-plus mr-2"></i>Create First Clan
                    </button>
                </div>
            `;
            return;
        }
        
        const htmlContent = `
            <div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <h3 class="text-base sm:text-lg font-semibold text-gray-800">Select a Clan to Manage</h3>
                    <button onclick="ClanManagement.showCreateClanForm()" class="bg-green-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-green-700 text-sm sm:text-base whitespace-nowrap">
                        <i class="fas fa-plus mr-1 sm:mr-2"></i>Create New Clan
                    </button>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    ${this.allClans.map(clan => `
                        <div class="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-shadow cursor-pointer" 
                             onclick="ClanManagement.selectClan(${clan.id})">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center min-w-0 flex-1">
                                    <div class="bg-blue-100 rounded-full p-1.5 sm:p-2 mr-2 sm:mr-3 flex-shrink-0">
                                        <i class="fas fa-shield-alt text-blue-600 text-sm sm:text-base"></i>
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <h4 class="font-semibold text-gray-800 text-sm sm:text-base truncate">${clan.name}</h4>
                                        <p class="text-xs sm:text-sm text-gray-600 truncate">Created by ${clan.created_by || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="space-y-2 text-xs sm:text-sm">
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600 flex-shrink-0">Leader:</span>
                                    <span class="font-medium text-right truncate ml-2">${clan.leader_name}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600 flex-shrink-0">Population:</span>
                                    <span class="font-medium text-right">${clan.total_population?.toLocaleString() || 0}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600 flex-shrink-0">Households:</span>
                                    <span class="font-medium text-right">${clan.total_households?.toLocaleString() || 0}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600 flex-shrink-0">District:</span>
                                    <span class="font-medium text-right truncate ml-2">${clan.district}</span>
                                </div>
                                ${clan.assigned_users && clan.assigned_users.length > 0 ? `
                                <div class="mt-3 pt-3 border-t border-gray-100">
                                    <span class="text-gray-600 text-xs">Assigned Users:</span>
                                    <div class="mt-1 space-y-1">
                                        ${clan.assigned_users.map(user => `
                                            <div class="flex justify-between items-center">
                                                <span class="text-xs text-gray-700 truncate mr-2">${user.name}</span>
                                                <span class="text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                                                    user.level === 'clan' ? 'bg-red-100 text-red-700' :
                                                    user.level === 'subclan' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'
                                                }">${user.level}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                            
                            <div class="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                <button class="w-full bg-blue-600 text-white px-3 py-2 rounded text-xs sm:text-sm hover:bg-blue-700 flex items-center justify-center" onclick="ClanManagement.selectClan(${clan.id})">
                                    <i class="fas fa-arrow-right mr-1 sm:mr-2 text-xs sm:text-sm"></i>
                                    <span class="text-xs sm:text-sm">Manage Clan</span>
                                </button>
                                <button class="w-full bg-green-600 text-white px-3 py-2 rounded text-xs sm:text-sm hover:bg-green-700 flex items-center justify-center" onclick="ClanManagement.fillSurveyDetails('clan', ${clan.id})">
                                    <i class="fas fa-edit mr-1 sm:mr-2 text-xs sm:text-sm"></i>
                                    <span class="text-xs sm:text-sm">Fill Details</span>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = htmlContent;
    },
    
    // Select a clan for management
    selectClan: function(clanId) {
        const clan = this.allClans.find(c => c.id === clanId);
        if (!clan) return;
        
        this.currentClan = clan;
        this.viewMode = 'management';
        this.showClanManagement();
    },
    
    // Show clan management interface
    showClanManagement: function() {
        const container = document.getElementById('clanManagementContent');
        if (!container) return;
        
        container.innerHTML = `
            <!-- Clan Info Card -->
            <div id="clanInfoCard" class="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <!-- Clan details will be loaded here -->
            </div>
            
            <!-- Sub-Clans Section -->
            <div class="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <h3 class="text-base sm:text-lg font-semibold text-gray-800">Sub-Clans</h3>
                    <button onclick="ClanManagement.showSubClanForm()" class="w-full sm:w-auto bg-green-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-green-700 text-sm sm:text-base whitespace-nowrap">
                        <i class="fas fa-plus mr-1 sm:mr-2"></i>Add Sub-Clan
                    </button>
                </div>
                <div id="subClansContainer" class="space-y-3 sm:space-y-4">
                    <!-- Sub-clans will be loaded here -->
                </div>
            </div>
            
            <!-- Add Sub-Clan Form (Initially Hidden) -->
            <div id="subClanFormContainer" class="bg-white rounded-lg shadow-md p-4 sm:p-6 hidden">
                <!-- Sub-clan form will be loaded here -->
            </div>
            
            <!-- Back to Selection -->
            <div class="text-center">
                <button onclick="ClanManagement.showClanSelection()" class="w-full sm:w-auto bg-gray-500 text-white px-4 py-2 sm:px-6 sm:py-2 rounded hover:bg-gray-700 text-sm sm:text-base">
                    <i class="fas fa-arrow-left mr-1 sm:mr-2"></i>Back to Clan Selection
                </button>
            </div>
        `;
        
        this.displayClanInfo();
        this.loadSubClans();
    },
    
    // Show create clan form
    showCreateClanForm: function() {
        const container = document.getElementById('clanManagementContent');
        if (!container) return;
        
        container.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-semibold text-gray-800">Create New Clan</h3>
                    <button onclick="ClanManagement.showClanSelection()" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700">
                        <i class="fas fa-arrow-left mr-2"></i>Cancel
                    </button>
                </div>
                
                ${this.buildReusableForm('clan', 'Create Clan')}
            </div>
        `;
    },
    
        
    // Load sub-clans for current clan
    loadSubClans: async function() {
        try {
            if (!this.currentClan) return;
            
            const response = await ClanAPI.getSubClans(this.currentClan.id);
            if (response.success) {
                this.subClans = response.data;
                this.displaySubClans();
            } else {
                // Show empty sub-clans state with error message
                this.subClans = [];
                this.displaySubClans(response.error);
            }
        } catch (error) {
            console.error('Failed to load sub-clans:', error);
            this.subClans = [];
            this.displaySubClans('Network error');
        }
    },
    
        
    // Display clan information
    displayClanInfo: function() {
        const container = document.getElementById('clanInfoCard');
        if (!container || !this.currentClan) return;
        
        container.innerHTML = `
            <div class="border-b border-gray-200 pb-3 sm:pb-4 mb-3 sm:mb-4">
                <h3 class="text-base sm:text-lg font-semibold text-gray-800 mb-2">Clan Information</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Clan Name</label>
                        <p class="text-sm sm:text-base text-gray-900 font-medium truncate">${this.currentClan.name}</p>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Clan Leader</label>
                        <p class="text-sm sm:text-base text-gray-900 font-medium truncate">${this.currentClan.leader_name}</p>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact</label>
                        <p class="text-sm sm:text-base text-gray-900 font-medium truncate">${this.currentClan.leader_contact}</p>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Village</label>
                        <p class="text-sm sm:text-base text-gray-900 font-medium truncate">${this.currentClan.village}</p>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Parish</label>
                        <p class="text-sm sm:text-base text-gray-900 font-medium truncate">${this.currentClan.parish}</p>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">District</label>
                        <p class="text-sm sm:text-base text-gray-900 font-medium truncate">${this.currentClan.district}</p>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Total Population</label>
                        <p class="text-sm sm:text-base text-gray-900 font-medium">${this.currentClan.total_population?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Households</label>
                        <p class="text-sm sm:text-base text-gray-900 font-medium">${this.currentClan.total_households?.toLocaleString() || 0}</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Display sub-clans
    displaySubClans: function(errorMessage = null) {
        const container = document.getElementById('subClansContainer');
        if (!container) return;
        
        if (this.subClans.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 sm:py-8 text-gray-500">
                    <i class="fas fa-users text-3xl sm:text-4xl mb-4"></i>
                    <p class="text-sm sm:text-base">No sub-clans found. Click "Add Sub-Clan" to create one.</p>
                    ${errorMessage ? `<p class="text-xs sm:text-sm text-red-500 mt-2">Error: ${errorMessage}</p>` : ''}
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.subClans.map(subClan => `
            <div class="sub-clan-card bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6 border border-gray-200">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <div class="min-w-0 flex-1">
                        <h4 class="text-base sm:text-lg font-semibold text-gray-800 truncate">${subClan.name}</h4>
                        <p class="text-xs sm:text-sm text-gray-600 truncate">
                            <i class="fas fa-user mr-1"></i>Leader: ${subClan.leader_name}
                        </p>
                        <p class="text-xs sm:text-sm text-gray-600 truncate">
                            <i class="fas fa-phone mr-1"></i>Contact: ${subClan.leader_contact}
                        </p>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button onclick="ClanManagement.fillSurveyDetails('subclan', ${subClan.id})" class="w-full sm:w-auto bg-green-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-green-700 text-xs sm:text-sm">
                            <i class="fas fa-edit mr-1 sm:mr-2"></i>Fill Details
                        </button>
                        <button onclick="ClanManagement.showRidgeForm(${subClan.id})" class="w-full sm:w-auto bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-blue-700 text-xs sm:text-sm">
                            <i class="fas fa-plus mr-1 sm:mr-2"></i>Add Ridge
                        </button>
                    </div>
                </div>
                
                <!-- Ridges List -->
                <div class="mt-3 sm:mt-4">
                    <h5 class="text-sm sm:text-base font-semibold text-gray-700 mb-2">Ridges</h5>
                    <div class="space-y-2" id="ridges-${subClan.id}">
                        ${subClan.ridges && subClan.ridges.length > 0 ? subClan.ridges.map(ridge => `
                            <div class="ridge-card bg-white rounded p-3 sm:p-4 border border-gray-200">
                                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                    <div class="min-w-0 flex-1">
                                        <p class="text-sm sm:text-base font-medium text-gray-800 truncate">${ridge.name}</p>
                                        <p class="text-xs sm:text-sm text-gray-600 truncate">
                                            <i class="fas fa-user mr-1"></i>Leader: ${ridge.leader_name}
                                        </p>
                                        <p class="text-xs sm:text-sm text-gray-600 truncate">
                                            <i class="fas fa-phone mr-1"></i>Contact: ${ridge.leader_contact}
                                        </p>
                                    </div>
                                    <button onclick="ClanManagement.fillSurveyDetails('ridge', ${ridge.id})" class="w-full sm:w-auto bg-green-600 text-white px-2 py-1.5 sm:px-3 sm:py-1 rounded text-xs sm:text-sm hover:bg-green-700 mt-2 sm:mt-0">
                                        <i class="fas fa-edit mr-1"></i>Fill Details
                                    </button>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="text-center py-3 sm:py-4 text-gray-400 text-xs sm:text-sm">
                                <p>No ridges found. Click "Add Ridge" to create one.</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    // Show sub-clan form
    showSubClanForm: function() {
        const container = document.getElementById('subClanFormContainer');
        if (!container) return;
        
        container.classList.remove('hidden');
        container.innerHTML = this.buildReusableForm('subclan', 'Create Sub-Clan');
        
        // Scroll to form
        container.scrollIntoView({ behavior: 'smooth' });
    },
    
    // Show ridge form
    showRidgeForm: function(subClanId) {
        const subClan = this.subClans.find(sc => sc.id === subClanId);
        if (!subClan) return;
        
        // Create ridge form container if it doesn't exist
        let container = document.getElementById(`ridgeFormContainer-${subClanId}`);
        if (!container) {
            const subClanElement = document.querySelector(`#ridges-${subClanId}`);
            if (subClanElement) {
                const ridgeFormDiv = document.createElement('div');
                ridgeFormDiv.id = `ridgeFormContainer-${subClanId}`;
                ridgeFormDiv.className = 'bg-white rounded-lg shadow-md p-6 mt-4';
                subClanElement.parentNode.insertBefore(ridgeFormDiv, subClanElement.nextSibling);
                container = ridgeFormDiv;
            }
        }
        
        if (container) {
            container.classList.remove('hidden');
            container.innerHTML = this.buildReusableForm('ridge', 'Add Ridge', subClanId);
            container.scrollIntoView({ behavior: 'smooth' });
        }
    },
    
    // Build reusable form component
    buildReusableForm: function(level, actionText, subClanId = null) {
        const labels = this.getLabelsForLevel(level);
        
        return `
            <div class="border-t border-gray-200 pt-4">
                <h4 class="text-lg font-semibold text-gray-800 mb-4">${actionText}</h4>
                <form id="${level}Form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">${labels.nameLabel} *</label>
                            <input type="text" name="name" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Enter ${labels.nameLabel.toLowerCase()}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">${labels.leaderLabel} *</label>
                            <input type="text" name="leader_name" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Enter ${labels.leaderLabel.toLowerCase()}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Contact *</label>
                            <input type="tel" name="leader_contact" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Enter contact number">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Village *</label>
                            <input type="text" name="village" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Enter village">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Parish *</label>
                            <input type="text" name="parish" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="Enter parish">
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-4 pt-4">
                        <button type="button" onclick="ClanManagement.cancelForm('${level}', ${subClanId})" 
                                class="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600">
                            Cancel
                        </button>
                        <button type="button" onclick="ClanManagement.submitForm('${level}', ${subClanId})" 
                                class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                            <i class="fas fa-save mr-2"></i>${actionText}
                        </button>
                    </div>
                </form>
            </div>
        `;
    },
    
    // Get dynamic labels based on level
    getLabelsForLevel: function(level) {
        const labels = {
            clan: {
                nameLabel: 'Clan Name',
                leaderLabel: 'Clan Leader'
            },
            subclan: {
                nameLabel: 'Sub-Clan Name',
                leaderLabel: 'Sub-Clan Leader'
            },
            ridge: {
                nameLabel: 'Ridge Name',
                leaderLabel: 'Ridge Leader'
            }
        };
        return labels[level] || labels.clan;
    },
    
    // Submit form
    submitForm: async function(level, subClanId = null) {
        const form = document.getElementById(`${level}Form`);
        if (!form) return;
        
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Map form field names to backend field names
        if (level === 'clan') {
            data.clan_leader_name = data.leader_name;
            data.clan_leader_contact = data.leader_contact;
            delete data.leader_name;
            delete data.leader_contact;
        } else if (level === 'subclan') {
            data.subclan_leader_name = data.leader_name;
            data.subclan_leader_contact = data.leader_contact;
            delete data.leader_name;
            delete data.leader_contact;
        } else if (level === 'ridge') {
            data.ridge_leader_name = data.leader_name;
            data.ridge_leader_contact = data.leader_contact;
            delete data.leader_name;
            delete data.leader_contact;
        }
        
        // Validate required fields
        if (!data.name || !data[`${level}_leader_name`] || !data[`${level}_leader_contact`]) {
            this.showError('Please fill in all required fields');
            return;
        }
        
        // Show loading
        this.showLoading('Creating...');
        
        try {
            let response;
            
            if (level === 'clan') {
                response = await ClanAPI.createClan(data);
            } else if (level === 'subclan') {
                data.clan_id = this.currentClan.id;
                response = await ClanAPI.createSubClan(data);
            } else if (level === 'ridge') {
                data.subclan_id = subClanId;
                response = await ClanAPI.createRidge(data);
            }
            
            if (response.success) {
                this.showSuccess(`${level === 'clan' ? 'Clan' : level === 'subclan' ? 'Sub-Clan' : 'Ridge'} created successfully!`);
                
                // Add to local data
                if (level === 'clan') {
                    // Add to all clans and select it
                    this.allClans.push({
                        id: response.data.id,
                        ...data,
                        created_by: 'Current Agent',
                        created_at: response.data.created_at
                    });
                    this.selectClan(response.data.id);
                } else if (level === 'subclan') {
                    this.subClans.push({
                        id: response.data.id,
                        ...data,
                        ridges: []
                    });
                    this.displaySubClans();
                } else if (level === 'ridge' && subClanId) {
                    if (!this.ridges[subClanId]) {
                        this.ridges[subClanId] = [];
                    }
                    this.ridges[subClanId].push({
                        id: response.data.id,
                        ...data
                    });
                    this.displaySubClans();
                }
                
                // Cancel form for non-clan creation
                if (level !== 'clan') {
                    this.cancelForm(level, subClanId);
                }
            } else {
                this.showError(response.error || `Failed to create ${level}`);
            }
        } catch (error) {
            console.error('Submit error:', error);
            this.showError(`Network error. Please try again.`);
        } finally {
            this.hideLoading();
        }
    },
    
    // Fill survey details for entity
    fillSurveyDetails: async function(entityType, entityId) {
        try {
            this.showLoading('Loading survey form...');
            
            // Get entity data based on type
            let entityData;
            if (entityType === 'clan') {
                entityData = this.allClans.find(c => c.id === entityId);
            } else if (entityType === 'subclan') {
                entityData = this.subClans.find(sc => sc.id === entityId);
            } else if (entityType === 'ridge') {
                // Find ridge across all sub-clans
                for (let subClan of this.subClans) {
                    if (subClan.ridges) {
                        const ridge = subClan.ridges.find(r => r.id === entityId);
                        if (ridge) {
                            entityData = ridge;
                            break;
                        }
                    }
                }
            }
            
            if (!entityData) {
                this.showError('Entity not found');
                return;
            }
            
            // Navigate to survey form with pre-filled data
            this.navigateToSurveyForm(entityType, entityData);
            
        } catch (error) {
            console.error('Error filling survey details:', error);
            this.showError('Failed to load survey form');
        } finally {
            this.hideLoading();
        }
    },
    
    // Navigate to survey form with pre-filled data
    navigateToSurveyForm: function(entityType, entityData) {
        // Store the entity data for the survey form to use
        localStorage.setItem('prefillEntityData', JSON.stringify({
            type: entityType,
            data: entityData
        }));
        
        // Set the form level and data in CompleteSurveyForm
        if (window.CompleteSurveyForm) {
            CompleteSurveyForm.setLevelAndData(entityType, entityData);
        }
        
        // Navigate to the new survey page
        AppSimple.showAuthenticatedPage('new-survey');
        
        // Show a toast notification
        this.showToast(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} survey form opened with pre-filled data`, 'success');
    },
    
    // Cancel form
    cancelForm: function(level, subClanId = null) {
        if (level === 'subclan') {
            const container = document.getElementById('subClanFormContainer');
            if (container) {
                container.classList.add('hidden');
            }
        } else if (level === 'ridge' && subClanId) {
            const container = document.getElementById(`ridgeFormContainer-${subClanId}`);
            if (container) {
                container.classList.add('hidden');
            }
        }
    },
    
    // Refresh data
    refreshData: function() {
        this.showLoading('Refreshing data...');
        setTimeout(() => {
            this.loadClanData();
            this.hideLoading();
        }, 1000);
    },
    
    // Show loading state
    showLoading: function(message) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingOverlay';
        loadingDiv.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        loadingDiv.innerHTML = `
            <div class="bg-white rounded-lg p-6 shadow-lg">
                <div class="flex items-center">
                    <i class="fas fa-spinner fa-spin text-blue-600 text-xl mr-3"></i>
                    <span class="text-gray-700">${message}</span>
                </div>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    },
    
    // Hide loading state
    hideLoading: function() {
        const loadingDiv = document.getElementById('loadingOverlay');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    },
    
    // Show success message
    showSuccess: function(message) {
        this.showToast(message, 'success');
    },
    
    // Show error message
    showError: function(message) {
        this.showToast(message, 'error');
    },
    
    // Show toast notification
    showToast: function(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`;
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
                } mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};
