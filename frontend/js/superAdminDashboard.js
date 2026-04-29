// OBB Baseline Survey System - Super Admin Dashboard

window.SuperAdminDashboard = {
    // Initialize super admin dashboard
    init: function() {
        console.log('Super admin dashboard initialized');
    },
    
    // Build comprehensive super admin dashboard
    buildDashboard: function() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const userName = user ? user.first_name + ' ' + user.last_name : 'Super Admin';
        
        return `
            <div class="super-admin-dashboard">
                <!-- Super Admin Header -->
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-purple-600 mb-8">
                    <div class="bg-gray-50 px-6 py-4 border-b">
                        <div class="flex justify-between items-center">
                            <div>
                                <h2 class="text-2xl font-bold text-purple-600">Super Admin Dashboard</h2>
                                <p class="text-gray-600">Welcome back, <span class="font-semibold">${userName}</span> - Complete system administration and control</p>
                            </div>
                            <div class="flex items-center space-x-3">
                                <span class="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                                    <i class="fas fa-user-cog mr-1"></i>Super Admin
                                </span>
                                <span class="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                    <i class="fas fa-circle mr-1"></i>Online
                                </span>
                                <button onclick="AppSimple.logout()" class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">
                                    <i class="fas fa-sign-out-alt mr-2"></i>Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- System Overview Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    ${this.buildSystemOverviewCards()}
                </div>
                
                <!-- System Health Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    ${this.buildSystemHealthCharts()}
                </div>
                
                <!-- Management Actions -->
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-red-600 mb-8">
                    <div class="bg-gray-50 px-6 py-4 border-b">
                        <h3 class="text-lg font-semibold text-gray-900">System Management</h3>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button onclick="SuperAdminDashboard.showUsers()" class="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700">
                                <i class="fas fa-users-cog mr-2"></i>Manage Users
                            </button>
                            <button onclick="SuperAdminDashboard.showDevices()" class="bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700">
                                <i class="fas fa-mobile-alt mr-2"></i>Manage Devices
                            </button>
                            <button onclick="SuperAdminDashboard.showActivityLogs()" class="bg-yellow-500 text-black px-4 py-3 rounded hover:bg-yellow-600">
                                <i class="fas fa-history mr-2"></i>Activity Logs
                            </button>
                            <button onclick="SuperAdminDashboard.showSystemSettings()" class="bg-purple-600 text-white px-4 py-3 rounded hover:bg-purple-700">
                                <i class="fas fa-cog mr-2"></i>System Settings
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Critical Alerts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    ${this.buildCriticalAlerts()}
                    ${this.buildSystemMetrics()}
                </div>
            </div>
        `;
    },
    
    // Build system overview cards
    buildSystemOverviewCards: function() {
        return `
            <div class="bg-white rounded-lg shadow border-t-4 border-red-600">
                <div class="p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-red-100 rounded-full p-3">
                            <i class="fas fa-users text-red-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-semibold text-gray-900">Total Users</h3>
                            <p class="text-2xl font-bold text-red-600">28</p>
                            <p class="text-sm text-gray-500">3 Admins, 12 Agents, 13 Users</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow border-t-4 border-green-600">
                <div class="p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-green-100 rounded-full p-3">
                            <i class="fas fa-mobile-alt text-green-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-semibold text-gray-900">Active Devices</h3>
                            <p class="text-2xl font-bold text-green-600">15/18</p>
                            <p class="text-sm text-gray-500">3 devices offline</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow border-t-4 border-yellow-600">
                <div class="p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-yellow-100 rounded-full p-3">
                            <i class="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-semibold text-gray-900">System Alerts</h3>
                            <p class="text-2xl font-bold text-yellow-600">2</p>
                            <p class="text-sm text-gray-500">Requires attention</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow border-t-4 border-blue-600">
                <div class="p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-blue-100 rounded-full p-3">
                            <i class="fas fa-database text-blue-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-semibold text-gray-900">Database</h3>
                            <p class="text-2xl font-bold text-blue-600">Healthy</p>
                            <p class="text-sm text-gray-500">Last backup: 2 hours ago</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Build system health charts
    buildSystemHealthCharts: function() {
        return `
            <div class="bg-white rounded-lg shadow-lg border-t-4 border-green-600">
                <div class="bg-gray-50 px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold text-gray-900">User Activity Trends</h3>
                </div>
                <div class="p-6">
                    <canvas id="userActivityChart" width="400" height="200"></canvas>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg border-t-4 border-blue-600">
                <div class="bg-gray-50 px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold text-gray-900">System Resource Usage</h3>
                </div>
                <div class="p-6">
                    <canvas id="resourceChart" width="400" height="200"></canvas>
                </div>
            </div>
        `;
    },
    
    // Build critical alerts
    buildCriticalAlerts: function() {
        return `
            <div class="bg-white rounded-lg shadow-lg border-t-4 border-red-600">
                <div class="bg-gray-50 px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold text-gray-900">Critical Alerts</h3>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div class="flex items-start p-3 bg-red-50 border border-red-200 rounded">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-circle text-red-600 text-xl"></i>
                            </div>
                            <div class="ml-4 flex-1">
                                <p class="text-sm font-medium text-gray-900">Database Connection Timeout</p>
                                <p class="text-xs text-gray-500">Multiple connection failures detected - 30 minutes ago</p>
                                <button onclick="SuperAdminDashboard.resolveAlert(1)" class="mt-2 text-xs bg-red-600 text-white px-2 py-1 rounded">Resolve</button>
                            </div>
                        </div>
                        
                        <div class="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
                            </div>
                            <div class="ml-4 flex-1">
                                <p class="text-sm font-medium text-gray-900">Storage Capacity Warning</p>
                                <p class="text-xs text-gray-500">Disk usage at 85% - 1 hour ago</p>
                                <button onclick="SuperAdminDashboard.resolveAlert(2)" class="mt-2 text-xs bg-yellow-600 text-black px-2 py-1 rounded">Resolve</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Build system metrics
    buildSystemMetrics: function() {
        return `
            <div class="bg-white rounded-lg shadow-lg border-t-4 border-green-600">
                <div class="bg-gray-50 px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold text-gray-900">System Metrics</h3>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="font-medium text-gray-700">CPU Usage</span>
                                <span class="text-gray-500">42%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-green-600 h-2 rounded-full" style="width: 42%"></div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="font-medium text-gray-700">Memory Usage</span>
                                <span class="text-gray-500">67%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-yellow-500 h-2 rounded-full" style="width: 67%"></div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="font-medium text-gray-700">Disk Usage</span>
                                <span class="text-gray-500">78%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: 78%"></div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="font-medium text-gray-700">Network I/O</span>
                                <span class="text-gray-500">23%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-green-600 h-2 rounded-full" style="width: 23%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Show users management
    showUsers: function() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-red-600">
                    <div class="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-red-600">User Management</h2>
                        <div class="flex space-x-2">
                            <button onclick="SuperAdminDashboard.addUser()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                <i class="fas fa-plus mr-2"></i>Add User
                            </button>
                            <button onclick="SuperAdminDashboard.exportUsers()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                <i class="fas fa-download mr-2"></i>Export
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="mb-4 flex space-x-4">
                            <input type="text" placeholder="Search users..." class="flex-1 px-3 py-2 border border-gray-300 rounded-md">
                            <select class="px-3 py-2 border border-gray-300 rounded-md">
                                <option>All Roles</option>
                                <option>Super Admin</option>
                                <option>Admin</option>
                                <option>Agent</option>
                            </select>
                            <select class="px-3 py-2 border border-gray-300 rounded-md">
                                <option>All Status</option>
                                <option>Active</option>
                                <option>Inactive</option>
                                <option>Suspended</option>
                            </select>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="h-10 w-10 flex-shrink-0">
                                                    <div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                        <span class="text-purple-600 font-medium">SA</span>
                                                    </div>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">Super Admin</div>
                                                    <div class="text-sm text-gray-500">superadmin</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Super Admin</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">superadmin@obb.com</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 hours ago</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="SuperAdminDashboard.editUser(1)" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                            <button onclick="SuperAdminDashboard.resetPassword(1)" class="text-yellow-600 hover:text-yellow-900 mr-3">Reset</button>
                                            <button onclick="SuperAdminDashboard.suspendUser(1)" class="text-red-600 hover:text-red-900">Suspend</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="h-10 w-10 flex-shrink-0">
                                                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span class="text-blue-600 font-medium">AJ</span>
                                                    </div>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">Admin Jane</div>
                                                    <div class="text-sm text-gray-500">admin001</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Admin</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">admin001@obb.com</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 day ago</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="SuperAdminDashboard.editUser(2)" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                            <button onclick="SuperAdminDashboard.resetPassword(2)" class="text-yellow-600 hover:text-yellow-900 mr-3">Reset</button>
                                            <button onclick="SuperAdminDashboard.suspendUser(2)" class="text-red-600 hover:text-red-900">Suspend</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="h-10 w-10 flex-shrink-0">
                                                    <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                        <span class="text-green-600 font-medium">JD</span>
                                                    </div>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">John Doe</div>
                                                    <div class="text-sm text-gray-500">agent001</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Agent</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">agent001@obb.com</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3 hours ago</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="SuperAdminDashboard.editUser(3)" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                                            <button onclick="SuperAdminDashboard.resetPassword(3)" class="text-yellow-600 hover:text-yellow-900 mr-3">Reset</button>
                                            <button onclick="SuperAdminDashboard.suspendUser(3)" class="text-red-600 hover:text-red-900">Suspend</button>
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
    
    // Show devices management
    showDevices: function() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-red-600">
                    <div class="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-red-600">Device Management</h2>
                        <div class="flex space-x-2">
                            <button onclick="SuperAdminDashboard.registerDevice()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                <i class="fas fa-plus mr-2"></i>Register Device
                            </button>
                            <button onclick="SuperAdminDashboard.syncDevices()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                <i class="fas fa-sync mr-2"></i>Sync All
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="mb-4 flex space-x-4">
                            <input type="text" placeholder="Search devices..." class="flex-1 px-3 py-2 border border-gray-300 rounded-md">
                            <select class="px-3 py-2 border border-gray-300 rounded-md">
                                <option>All Status</option>
                                <option>Online</option>
                                <option>Offline</option>
                                <option>Suspended</option>
                            </select>
                            <select class="px-3 py-2 border border-gray-300 rounded-md">
                                <option>All Types</option>
                                <option>Android</option>
                                <option>iOS</option>
                                <option>Desktop</option>
                            </select>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device ID</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device Name</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned User</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">DEV-001</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Samsung Galaxy Tab S8</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">John Doe (agent001)</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Android</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 hours ago</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Online</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="SuperAdminDashboard.viewDevice(1)" class="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                                            <button onclick="SuperAdminDashboard.wipeDevice(1)" class="text-red-600 hover:text-red-900">Wipe</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">DEV-002</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">iPad Pro 12.9"</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jane Smith (agent002)</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">iOS</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 day ago</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Offline</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="SuperAdminDashboard.viewDevice(2)" class="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                                            <button onclick="SuperAdminDashboard.suspendDevice(2)" class="text-yellow-600 hover:text-yellow-900">Suspend</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">DEV-003</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Windows Laptop</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Admin Jane</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Desktop</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">30 minutes ago</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Online</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onclick="SuperAdminDashboard.viewDevice(3)" class="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                                            <button onclick="SuperAdminDashboard.remoteControl(3)" class="text-blue-600 hover:text-blue-900">Remote</button>
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
    
    // Show activity logs
    showActivityLogs: function() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-red-600">
                    <div class="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-red-600">Activity Logs & Audit Trail</h2>
                        <div class="flex space-x-2">
                            <button onclick="SuperAdminDashboard.exportLogs()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                <i class="fas fa-download mr-2"></i>Export Logs
                            </button>
                            <button onclick="SuperAdminDashboard.clearLogs()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                                <i class="fas fa-trash mr-2"></i>Clear Old Logs
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="mb-4 flex space-x-4">
                            <input type="text" placeholder="Search logs..." class="flex-1 px-3 py-2 border border-gray-300 rounded-md">
                            <select class="px-3 py-2 border border-gray-300 rounded-md">
                                <option>All Actions</option>
                                <option>Login</option>
                                <option>Survey Submit</option>
                                <option>User Management</option>
                                <option>Device Management</option>
                                <option>System Changes</option>
                            </select>
                            <input type="date" class="px-3 py-2 border border-gray-300 rounded-md">
                            <input type="date" class="px-3 py-2 border border-gray-300 rounded-md">
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="min-w-full bg-white">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-04-24 15:30:22</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">superadmin</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Login</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Super admin login from desktop</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.100</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Success</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-04-24 15:25:15</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">agent001</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Survey Submit</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Submitted Bweyogerere Clan survey</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.105</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Success</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-04-24 15:20:08</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">admin001</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">User Management</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Created new agent account: agent003</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.102</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Success</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-04-24 15:15:45</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">unknown</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Login</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Failed login attempt for admin001</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.200</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Failed</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-04-24 15:10:30</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">superadmin</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Device Management</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Registered new device: iPad Pro</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.100</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Success</span>
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
    
    // Show system settings
    showSystemSettings: function() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-red-600">
                    <div class="bg-gray-50 px-6 py-4 border-b">
                        <h2 class="text-2xl font-bold text-red-600">System Settings</h2>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <!-- General Settings -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-gray-900">General Settings</h3>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">System Name</label>
                                    <input type="text" value="OBB Baseline Survey System" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">System Email</label>
                                    <input type="email" value="admin@obb.com" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
                                    <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                        <option>English</option>
                                        <option>Luganda</option>
                                        <option>Swahili</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                                    <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                        <option>UTC+3 (East Africa Time)</option>
                                        <option>UTC+0 (GMT)</option>
                                        <option>UTC-5 (EST)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- Security Settings -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-gray-900">Security Settings</h3>
                                
                                <div>
                                    <label class="flex items-center">
                                        <input type="checkbox" checked class="mr-2">
                                        <span class="text-sm font-medium text-gray-700">Require Two-Factor Authentication</span>
                                    </label>
                                </div>
                                
                                <div>
                                    <label class="flex items-center">
                                        <input type="checkbox" checked class="mr-2">
                                        <span class="text-sm font-medium text-gray-700">Password Expiration (90 days)</span>
                                    </label>
                                </div>
                                
                                <div>
                                    <label class="flex items-center">
                                        <input type="checkbox" checked class="mr-2">
                                        <span class="text-sm font-medium text-gray-700">Session Timeout (30 minutes)</span>
                                    </label>
                                </div>
                                
                                <div>
                                    <label class="flex items-center">
                                        <input type="checkbox" checked class="mr-2">
                                        <span class="text-sm font-medium text-gray-700">Log Failed Login Attempts</span>
                                    </label>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Maximum Login Attempts</label>
                                    <input type="number" value="5" min="1" max="10" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                </div>
                            </div>
                            
                            <!-- Backup Settings -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-gray-900">Backup Settings</h3>
                                
                                <div>
                                    <label class="flex items-center">
                                        <input type="checkbox" checked class="mr-2">
                                        <span class="text-sm font-medium text-gray-700">Automatic Backups</span>
                                    </label>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                                    <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                        <option>Daily</option>
                                        <option>Weekly</option>
                                        <option>Monthly</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Retention Period</label>
                                    <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                        <option>30 days</option>
                                        <option>60 days</option>
                                        <option>90 days</option>
                                        <option>1 year</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Backup Location</label>
                                    <input type="text" value="/backups/obb_survey" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                </div>
                            </div>
                            
                            <!-- Notification Settings -->
                            <div class="space-y-6">
                                <h3 class="text-lg font-semibold text-gray-900">Notification Settings</h3>
                                
                                <div>
                                    <label class="flex items-center">
                                        <input type="checkbox" checked class="mr-2">
                                        <span class="text-sm font-medium text-gray-700">Email Notifications</span>
                                    </label>
                                </div>
                                
                                <div>
                                    <label class="flex items-center">
                                        <input type="checkbox" checked class="mr-2">
                                        <span class="text-sm font-medium text-gray-700">System Alerts</span>
                                    </label>
                                </div>
                                
                                <div>
                                    <label class="flex items-center">
                                        <input type="checkbox" class="mr-2">
                                        <span class="text-sm font-medium text-gray-700">Weekly Reports</span>
                                    </label>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Notification Email</label>
                                    <input type="email" value="notifications@obb.com" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-8 flex justify-end space-x-4">
                            <button onclick="SuperAdminDashboard.resetSettings()" class="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600">
                                <i class="fas fa-undo mr-2"></i>Reset to Defaults
                            </button>
                            <button onclick="SuperAdminDashboard.saveSettings()" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                                <i class="fas fa-save mr-2"></i>Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Initialize charts
    initializeCharts: function() {
        // User Activity Chart
        const userActivityCtx = document.getElementById('userActivityChart');
        if (userActivityCtx) {
            new Chart(userActivityCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Active Users',
                        data: [45, 52, 48, 58, 63, 41, 35],
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
        
        // Resource Usage Chart
        const resourceCtx = document.getElementById('resourceChart');
        if (resourceCtx) {
            new Chart(resourceCtx, {
                type: 'doughnut',
                data: {
                    labels: ['CPU', 'Memory', 'Disk', 'Network'],
                    datasets: [{
                        data: [42, 67, 78, 23],
                        backgroundColor: ['#dc2626', '#fbbf24', '#22c55e', '#3b82f6']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    },
    
    // Action methods
    addUser: function() {
        alert('Add User functionality would open a comprehensive user creation form');
    },
    
    editUser: function(id) {
        alert(`Edit User ${id} - Would open user edit form with all settings`);
    },
    
    resetPassword: function(id) {
        if (confirm('Are you sure you want to reset this user\'s password?')) {
            alert(`Password reset link sent for user ${id}`);
        }
    },
    
    suspendUser: function(id) {
        if (confirm('Are you sure you want to suspend this user?')) {
            alert(`User ${id} suspended successfully`);
        }
    },
    
    exportUsers: function() {
        alert('Export Users - Would generate CSV with all user data');
    },
    
    registerDevice: function() {
        alert('Register Device - Would open device registration form');
    },
    
    viewDevice: function(id) {
        alert(`View Device ${id} - Would show detailed device information`);
    },
    
    suspendDevice: function(id) {
        if (confirm('Are you sure you want to suspend this device?')) {
            alert(`Device ${id} suspended successfully`);
        }
    },
    
    wipeDevice: function(id) {
        if (confirm('WARNING: This will remotely wipe all data from the device. Continue?')) {
            alert(`Device ${id} wipe initiated`);
        }
    },
    
    remoteControl: function(id) {
        alert(`Remote Control for Device ${id} - Would open remote management interface`);
    },
    
    syncDevices: function() {
        alert('Sync All Devices - Would initiate synchronization across all devices');
    },
    
    exportLogs: function() {
        alert('Export Logs - Would generate comprehensive audit trail report');
    },
    
    clearLogs: function() {
        if (confirm('Are you sure you want to clear old logs (older than 90 days)?')) {
            alert('Old logs cleared successfully');
        }
    },
    
    saveSettings: function() {
        alert('System settings saved successfully');
    },
    
    resetSettings: function() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            alert('Settings reset to defaults');
        }
    },
    
    resolveAlert: function(id) {
        alert(`Alert ${id} resolved successfully`);
    }
};
