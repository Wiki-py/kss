// OBB Baseline Survey System - Admin Dashboard

window.AdminDashboard = {
    // Initialize admin dashboard
    init: function() {
        console.log('Admin dashboard initialized');
    },
    
    // Get user full name
    getUserFullName: function() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user && user.first_name && user.last_name) {
            return `${user.first_name} ${user.last_name}`;
        }
        return user ? user.username || 'Admin' : 'Admin';
    },
    
    // Build comprehensive admin dashboard
    buildDashboard: function() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const userName = user ? user.first_name + ' ' + user.last_name : 'Admin';
        
        return `
            <div class="admin-dashboard">
                <!-- Header with user info and logout -->
                <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-user text-white"></i>
                                </div>
                                <div>
                                    <p class="text-sm font-medium text-gray-900">${this.getUserFullName()}</p>
                                    <div class="flex items-center space-x-2">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            <i class="fas fa-user-shield mr-1"></i>
                                            Admin
                                        </span>
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <i class="fas fa-circle text-green-400 mr-1" style="font-size: 6px;"></i>
                                            Online
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onclick="AppSimple.logout()" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
                            <i class="fas fa-sign-out-alt mr-2"></i>
                            Logout
                        </button>
                    </div>
                </div>
                
                <!-- Navigation -->
                <div class="bg-white shadow-sm border-b border-gray-200">
                    <div class="px-6">
                        <nav class="flex space-x-8">
                            <button onclick="AdminDashboard.showOverview()" class="nav-btn py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
                                Overview
                            </button>
                            <button onclick="AdminDashboard.showDataAnalysis()" class="nav-btn py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm">
                                <i class="fas fa-chart-bar mr-2"></i>Data Analysis
                            </button>
                            <button onclick="AdminDashboard.showSurveys()" class="nav-btn py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm">
                                Surveys
                            </button>
                            <button onclick="AdminDashboard.showUsers()" class="nav-btn py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm">
                                Users
                            </button>
                            <button onclick="AdminDashboard.showSettings()" class="nav-btn py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm">
                                Settings
                            </button>
                        </nav>
                    </div>
                </div>
                
                <!-- Comprehensive Statistics Dashboard -->
                <div class="p-6 space-y-6">
                    <!-- Key Metrics Overview -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        ${this.buildMetricCard('total-clans', 'Total Clans', 'fas fa-shield-alt', 'bg-purple-600', '0')}
                        ${this.buildMetricCard('total-subclans', 'Total Sub-Clans', 'fas fa-users', 'bg-indigo-600', '0')}
                        ${this.buildMetricCard('total-population', 'Total Population', 'fas fa-users', 'bg-blue-600', '0')}
                        ${this.buildMetricCard('total-households', 'Total Households', 'fas fa-home', 'bg-green-600', '0')}
                    </div>
                    
                    <!-- Survey and Agent Metrics -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        ${this.buildMetricCard('submitted-surveys', 'Submitted Surveys', 'fas fa-clipboard-check', 'bg-emerald-600', '0')}
                        ${this.buildMetricCard('draft-surveys', 'Draft Surveys', 'fas fa-edit', 'bg-yellow-600', '0')}
                        ${this.buildMetricCard('active-agents', 'Active Agents', 'fas fa-user-tie', 'bg-teal-600', '0')}
                        ${this.buildMetricCard('saving-groups', 'Saving Groups', 'fas fa-piggy-bank', 'bg-pink-600', '0')}
                    </div>
                    
                    <!-- Demographics Breakdown -->
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Population Demographics</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            ${this.buildMetricCard('male-population', 'Male Population', 'fas fa-male', 'bg-blue-500', '0')}
                            ${this.buildMetricCard('female-population', 'Female Population', 'fas fa-female', 'bg-pink-500', '0')}
                            ${this.buildMetricCard('youth-population', 'Youth Population', 'fas fa-child', 'bg-orange-500', '0')}
                            ${this.buildMetricCard('educated-persons', 'Educated Persons', 'fas fa-graduation-cap', 'bg-purple-500', '0')}
                        </div>
                    </div>
                    
                    <!-- Clan Structure Metrics -->
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Clan Structure Analysis</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            ${this.buildMetricCard('avg-clan-size', 'Avg Clan Size', 'fas fa-chart-bar', 'bg-cyan-600', '0')}
                            ${this.buildMetricCard('avg-subclans-per-clan', 'Avg Sub-Clans/Clan', 'fas fa-sitemap', 'bg-indigo-500', '0')}
                            ${this.buildMetricCard('total-committee-members', 'Committee Members', 'fas fa-users-cog', 'bg-green-500', '0')}
                            ${this.buildMetricCard('total-office-structures', 'Office Structures', 'fas fa-building', 'bg-gray-600', '0')}
                        </div>
                    </div>
                    
                    <!-- Saving Groups Financial Metrics -->
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Saving Groups Financial Overview</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            ${this.buildMetricCard('total-savings', 'Total Savings (UGX)', 'fas fa-money-bill-wave', 'bg-green-600', '0')}
                            ${this.buildMetricCard('active-savings-groups', 'Active Groups', 'fas fa-check-circle', 'bg-emerald-500', '0')}
                            ${this.buildMetricCard('total-members', 'Total Members', 'fas fa-users', 'bg-blue-500', '0')}
                            ${this.buildMetricCard('avg-members-per-group', 'Avg Members/Group', 'fas fa-chart-pie', 'bg-purple-500', '0')}
                        </div>
                    </div>
                    
                    <!-- Charts Section -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        ${this.buildSubmissionsChart()}
                        ${this.buildDistrictChart()}
                    </div>
                    
                    <!-- Recent Activity -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        ${this.buildRecentActivity()}
                        ${this.buildSystemStatus()}
                    </div>
                </div>
            </div>
        `;
    },
    
    // Build individual metric card
    buildMetricCard: function(id, title, icon, bgColor, defaultValue) {
        return `
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-${bgColor.replace('bg-', '')}">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="${bgColor} rounded-md p-3">
                            <i class="${icon} text-white text-lg"></i>
                        </div>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                        <dl>
                            <dt class="text-sm font-medium text-gray-500 truncate">${title}</dt>
                            <dd class="text-lg font-semibold text-gray-900" id="${id}">
                                <span class="loading-placeholder">${defaultValue}</span>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Build submissions chart section
    buildSubmissionsChart: function() {
        return `
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Survey Submission Trends</h3>
                <canvas id="submissionsChart" width="400" height="200"></canvas>
            </div>
        `;
    },
    
    // Build district chart section
    buildDistrictChart: function() {
        return `
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Surveys by District</h3>
                <canvas id="districtChart" width="400" height="200"></canvas>
            </div>
        `;
    },
    
    // Build statistics cards
    buildStatsCards: function() {
        return `
            <div class="bg-white rounded-lg shadow border-t-4 border-red-600">
                <div class="p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-red-100 rounded-full p-3">
                            <i class="fas fa-users text-red-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-semibold text-gray-900">Total Agents</h3>
                            <p class="text-2xl font-bold text-red-600">12</p>
                            <p class="text-sm text-gray-500">Active field agents</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow border-t-4 border-green-600">
                <div class="p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-green-100 rounded-full p-3">
                            <i class="fas fa-file-alt text-green-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-semibold text-gray-900">Total Surveys</h3>
                            <p class="text-2xl font-bold text-green-600">47</p>
                            <p class="text-sm text-gray-500">Completed surveys</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow border-t-4 border-yellow-600">
                <div class="p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-yellow-100 rounded-full p-3">
                            <i class="fas fa-clock text-yellow-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-semibold text-gray-900">Pending</h3>
                            <p class="text-2xl font-bold text-yellow-600">8</p>
                            <p class="text-sm text-gray-500">Awaiting review</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow border-t-4 border-blue-600">
                <div class="p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-blue-100 rounded-full p-3">
                            <i class="fas fa-mobile-alt text-blue-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-semibold text-gray-900">Devices</h3>
                            <p class="text-2xl font-bold text-blue-600">15</p>
                            <p class="text-sm text-gray-500">Registered devices</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Build charts section
    buildChartsSection: function() {
        return `
            <div class="bg-white rounded-lg shadow-lg border-t-4 border-red-600">
                <div class="bg-gray-50 px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold text-gray-900">Survey Submissions by Month</h3>
                </div>
                <div class="p-6">
                    <canvas id="submissionsChart" width="400" height="200"></canvas>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg border-t-4 border-green-600">
                <div class="bg-gray-50 px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold text-gray-900">Surveys by District</h3>
                </div>
                <div class="p-6">
                    <canvas id="districtChart" width="400" height="200"></canvas>
                </div>
            </div>
        `;
    },
    
    // Build recent activity
    buildRecentActivity: function() {
        return `
            <div class="bg-white rounded-lg shadow-lg border-t-4 border-red-600">
                <div class="bg-gray-50 px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div class="flex items-center p-3 bg-gray-50 rounded">
                            <div class="flex-shrink-0">
                                <i class="fas fa-file-alt text-green-600 text-xl"></i>
                            </div>
                            <div class="ml-4 flex-1">
                                <p class="text-sm font-medium text-gray-900">New survey submitted</p>
                                <p class="text-xs text-gray-500">Bweyogerere Clan - 2 hours ago</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center p-3 bg-gray-50 rounded">
                            <div class="flex-shrink-0">
                                <i class="fas fa-user-plus text-blue-600 text-xl"></i>
                            </div>
                            <div class="ml-4 flex-1">
                                <p class="text-sm font-medium text-gray-900">New agent registered</p>
                                <p class="text-xs text-gray-500">John Doe - 5 hours ago</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center p-3 bg-gray-50 rounded">
                            <div class="flex-shrink-0">
                                <i class="fas fa-sync text-yellow-600 text-xl"></i>
                            </div>
                            <div class="ml-4 flex-1">
                                <p class="text-sm font-medium text-gray-900">Data synchronized</p>
                                <p class="text-xs text-gray-500">8 surveys synced - 1 day ago</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center p-3 bg-gray-50 rounded">
                            <div class="flex-shrink-0">
                                <i class="fas fa-mobile-alt text-purple-600 text-xl"></i>
                            </div>
                            <div class="ml-4 flex-1">
                                <p class="text-sm font-medium text-gray-900">Device registered</p>
                                <p class="text-xs text-gray-500">Samsung Galaxy Tab - 2 days ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Build system status
    buildSystemStatus: function() {
        return `
            <div class="bg-white rounded-lg shadow-lg border-t-4 border-green-600">
                <div class="bg-gray-50 px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold text-gray-900">System Status</h3>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">Database</span>
                            <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Healthy</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">API Server</span>
                            <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Online</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">Storage</span>
                            <span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">78% Used</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-700">Last Backup</span>
                            <span class="text-xs text-gray-500">2 hours ago</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Show agents management
    showAgents: function() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-red-600">
                    <div class="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-red-600">Manage Agents</h2>
                        <button onclick="AdminDashboard.addAgent()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                            <i class="fas fa-plus mr-2"></i>Add Agent
                        </button>
                    </div>
                    <div class="p-6">
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">John Doe</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">agent001</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">john.doe@obb.com</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Central</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="AdminDashboard.editAgent(1)" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                            <button onclick="AdminDashboard.deactivateAgent(1)" class="text-red-600 hover:text-red-900">Deactivate</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Jane Smith</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">agent002</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">jane.smith@obb.com</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Eastern</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="AdminDashboard.editAgent(2)" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                            <button onclick="AdminDashboard.deactivateAgent(2)" class="text-red-600 hover:text-red-900">Deactivate</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Robert Johnson</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">agent003</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">robert.johnson@obb.com</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Northern</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Inactive</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="AdminDashboard.editAgent(3)" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                            <button onclick="AdminDashboard.activateAgent(3)" class="text-green-600 hover:text-green-900">Activate</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Show surveys list
    showSurveys: function() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-red-600">
                    <div class="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-red-600">Survey Results</h2>
                        <div class="flex space-x-2">
                            <button onclick="AdminDashboard.exportCSV()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                <i class="fas fa-download mr-2"></i>Export CSV
                            </button>
                            <button onclick="AdminDashboard.generateReport()" class="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600">
                                <i class="fas fa-chart-bar mr-2"></i>Generate Report
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="mb-4 flex space-x-4">
                            <input type="text" placeholder="Search surveys..." class="flex-1 px-3 py-2 border border-gray-300 rounded-md">
                            <select class="px-3 py-2 border border-gray-300 rounded-md">
                                <option>All Districts</option>
                                <option>Central</option>
                                <option>Eastern</option>
                                <option>Northern</option>
                                <option>Western</option>
                            </select>
                            <select class="px-3 py-2 border border-gray-300 rounded-md">
                                <option>All Status</option>
                                <option>Submitted</option>
                                <option>Under Review</option>
                                <option>Approved</option>
                            </select>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clan Name</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Bweyogerere Clan</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">John Doe</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Central</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 hours ago</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Approved</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="AdminDashboard.viewSurvey(1)" class="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                                            <button onclick="AdminDashboard.downloadSurvey(1)" class="text-green-600 hover:text-green-900">Download</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Kawempe Clan</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jane Smith</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Eastern</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5 hours ago</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Under Review</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="AdminDashboard.viewSurvey(2)" class="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                                            <button onclick="AdminDashboard.approveSurvey(2)" class="text-green-600 hover:text-green-900">Approve</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mukono Clan</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Robert Johnson</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Northern</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 day ago</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Submitted</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="AdminDashboard.viewSurvey(3)" class="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                                            <button onclick="AdminDashboard.reviewSurvey(3)" class="text-yellow-600 hover:text-yellow-900">Review</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Initialize charts and fetch data
    initializeCharts: async function() {
        try {
            // Fetch real data from backend
            const statsResponse = await SurveyAPI.getStatistics();
            const usersResponse = await UserAPI.getUsers();
            const devicesResponse = await DeviceAPI.getDevices();
            
            if (statsResponse.success) {
                this.renderChartsWithRealData(statsResponse.data);
            } else {
                // Fallback to mock data
                this.renderChartsWithMockData();
            }
            
            // Update dashboard stats
            this.updateDashboardStats(usersResponse.data, devicesResponse.data);
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            // Fallback to mock data
            this.renderChartsWithMockData();
            this.updateDashboardStatsWithMockData();
        }
    },
    
    // Show data analysis view
    showDataAnalysis: function() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-blue-600">
                    <div class="bg-gray-50 px-6 py-4 border-b">
                        <h2 class="text-2xl font-bold text-blue-600">Data Analysis</h2>
                        <p class="text-gray-600">Comprehensive analysis of survey data collected by agents</p>
                    </div>
                    
                    <div class="p-6">
                        <div id="dataAnalysisContainer">
                            <!-- Data analysis dashboard will be built here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize and build the data analysis dashboard
        setTimeout(() => {
            DataAnalysis.init();
            const container = document.getElementById('dataAnalysisContainer');
            if (container) {
                container.innerHTML = DataAnalysis.buildDashboard();
                // Show overview by default
                setTimeout(() => {
                    DataAnalysis.showView('overview');
                }, 100);
            }
        }, 100);
    },
    
    // Render charts with real data
    renderChartsWithRealData: function(data) {
        // Submissions Chart
        const submissionsCtx = document.getElementById('submissionsChart');
        if (submissionsCtx && data.monthly_submissions) {
            new Chart(submissionsCtx, {
                type: 'line',
                data: {
                    labels: data.monthly_submissions.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Survey Submissions',
                        data: data.monthly_submissions.data || [12, 19, 15, 25, 22, 30],
                        borderColor: '#dc2626',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
        // District Chart
        const districtCtx = document.getElementById('districtChart');
        if (districtCtx && data.district_data) {
            new Chart(districtCtx, {
                type: 'bar',
                data: {
                    labels: data.district_data.labels || ['Central', 'Eastern', 'Northern', 'Western'],
                    datasets: [{
                        label: 'Surveys by District',
                        data: data.district_data.data || [15, 12, 8, 12],
                        backgroundColor: ['#dc2626', '#fbbf24', '#22c55e', '#3b82f6']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
        // Update detailed metrics with real data
        this.updateDetailedMetrics(data);
    },
    
    // Update detailed metrics from backend data
    updateDetailedMetrics: function(data) {
        // Update statistics cards with real backend data
        this.updateStatsCard('total-clans', data.total_clans || 0);
        this.updateStatsCard('total-subclans', data.total_sub_clans || 0);
        this.updateStatsCard('total-population', data.total_population || 0);
        this.updateStatsCard('total-households', data.total_households || 0);
        this.updateStatsCard('saving-groups', data.total_saving_groups || 0);
        this.updateStatsCard('active-agents', data.active_agents || 0);
        this.updateStatsCard('submitted-surveys', data.submitted_surveys || 0);
        this.updateStatsCard('draft-surveys', data.draft_surveys || 0);
        
        // Update demographic breakdowns
        this.updateStatsCard('male-population', data.male_population || 0);
        this.updateStatsCard('female-population', data.female_population || 0);
        this.updateStatsCard('youth-population', data.youth_population || 0);
        this.updateStatsCard('educated-persons', data.educated_persons || 0);
        
        // Update clan-specific metrics
        this.updateStatsCard('avg-clan-size', data.avg_clan_size || 0);
        this.updateStatsCard('avg-subclans-per-clan', data.avg_subclans_per_clan || 0);
        this.updateStatsCard('total-committee-members', data.total_committee_members || 0);
        this.updateStatsCard('total-office-structures', data.total_office_structures || 0);
        
        // Update saving group metrics
        this.updateStatsCard('total-savings', data.total_savings || 0);
        this.updateStatsCard('active-savings-groups', data.active_saving_groups || 0);
        this.updateStatsCard('total-members', data.total_members || 0);
    },
    
    // Render charts with mock data (fallback)
    renderChartsWithMockData: function() {
        // Submissions Chart
        const submissionsCtx = document.getElementById('submissionsChart');
        if (submissionsCtx) {
            new Chart(submissionsCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Survey Submissions',
                        data: [12, 19, 15, 25, 22, 30],
                        borderColor: '#dc2626',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
        // District Chart
        const districtCtx = document.getElementById('districtChart');
        if (districtCtx) {
            new Chart(districtCtx, {
                type: 'bar',
                data: {
                    labels: ['Central', 'Eastern', 'Northern', 'Western'],
                    datasets: [{
                        label: 'Surveys by District',
                        data: [15, 12, 8, 12],
                        backgroundColor: ['#dc2626', '#fbbf24', '#22c55e', '#3b82f6']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    },
    
    // Update dashboard stats with real data
    updateDashboardStats: function(users, devices) {
        // Update stats cards with real data
        const totalAgents = users ? users.filter(u => u.role === 'agent').length : 12;
        const activeDevices = devices ? devices.filter(d => d.is_active).length : 15;
        
        // Update DOM elements if they exist
        this.updateStatsCard('total-agents', totalAgents);
        this.updateStatsCard('active-devices', activeDevices);
    },
    
    // Update dashboard stats with mock data (fallback)
    updateDashboardStatsWithMockData: function() {
        // Generate comprehensive mock statistics
        const mockStats = {
            total_clans: 45,
            total_sub_clans: 127,
            total_population: 8756,
            total_households: 2156,
            male_population: 4234,
            female_population: 4522,
            youth_population: 2156,
            educated_persons: 892,
            submitted_surveys: 156,
            draft_surveys: 23,
            active_agents: 12,
            saving_groups: 38,
            avg_clan_size: 195,
            avg_subclans_per_clan: 2.8,
            total_committee_members: 384,
            total_office_structures: 45,
            total_savings: 4500000,
            active_saving_groups: 32,
            total_members: 1256,
            avg_members_per_group: 33
        };
        
        // Update all metric cards with mock data
        this.updateDetailedMetrics(mockStats);
        
        // Also update the original stats cards
        this.updateStatsCard('total-agents', 12);
        this.updateStatsCard('active-devices', 15);
    },
    
    // Update individual stats card
    updateStatsCard: function(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    },
    
    // Action methods
    addAgent: function() {
        alert('Add Agent functionality would open a form to create a new agent');
    },
    
    editAgent: function(id) {
        alert(`Edit Agent ${id} - Would open agent edit form`);
    },
    
    deactivateAgent: function(id) {
        if (confirm('Are you sure you want to deactivate this agent?')) {
            alert(`Agent ${id} deactivated successfully`);
        }
    },
    
    activateAgent: function(id) {
        if (confirm('Are you sure you want to activate this agent?')) {
            alert(`Agent ${id} activated successfully`);
        }
    },
    
    viewSurvey: function(id) {
        alert(`View Survey ${id} - Would show detailed survey information`);
    },
    
    downloadSurvey: function(id) {
        alert(`Download Survey ${id} - Would download survey as PDF`);
    },
    
    approveSurvey: function(id) {
        if (confirm('Are you sure you want to approve this survey?')) {
            alert(`Survey ${id} approved successfully`);
        }
    },
    
    reviewSurvey: function(id) {
        alert(`Review Survey ${id} - Would open review interface`);
    },
    
    exportCSV: function() {
        alert('Export CSV - Would generate and download CSV file');
    },
    
    generateReport: function() {
        alert('Generate Report - Would create comprehensive report');
    }
};
