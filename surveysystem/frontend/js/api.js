// OBB Baseline Survey System - API Service Layer

window.API = {
    // Base configuration
    baseURL: 'http://127.0.0.1:8000/api',
    timeout: 30000,
    
    // Connection test method
    testConnection: async function() {
        try {
            console.log('Testing connection to backend...');
            const response = await fetch(this.baseURL + 'token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'test',
                    password: 'test'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Connection test successful:', data);
                return { success: true, message: 'Backend is accessible', data };
            } else {
                console.log('Connection test failed:', response.status, response.statusText);
                return { success: false, error: 'Connection failed', status: response.status };
            }
        } catch (error) {
            console.log('Connection test error:', error);
            return { success: false, error: 'Network error', details: error.message };
        }
    },
    
    // Get authentication headers
    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        const deviceId = localStorage.getItem('deviceId') || 'web-device';
        
        console.log('Auth headers check:');
        console.log('Token available:', !!token);
        console.log('Token value:', token ? token.substring(0, 20) + '...' : 'none');
        
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'X-Device-ID': deviceId
        };
    },
    
    // Make API request with error handling
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            timeout: this.timeout,
            ...options
        };
        
        // Check if we're offline and this is a POST/PUT/DELETE request
        const isOffline = !navigator.onLine;
        const isWriteRequest = ['POST', 'PUT', 'DELETE', 'PATCH'].includes((config.method || 'GET').toUpperCase());
        
        try {
            console.log(`API Request: ${config.method || 'GET'} ${url}`);
            console.log('API Request headers:', config.headers);
            
            // If offline and it's a write request, queue it for later sync
            if (isOffline && isWriteRequest) {
                console.log('Offline detected, queuing request for later sync');
                return this.queueOfflineRequest(endpoint, config);
            }
            
            const response = await fetch(url, config);
            console.log(`API Response status: ${response.status}`);
            
            // Handle different response types
            if (response.status === 204) {
                return { success: true, data: null };
            }
            
            let data;
            try {
                data = await response.json();
                console.log(`API Response data:`, data);
            } catch (e) {
                console.error('Failed to parse JSON response:', e);
                data = null;
            }
            
            if (!response.ok) {
                console.error(`API Error: ${response.status}`, data);
                throw new APIError(data.message || data.detail || 'Request failed', response.status, data);
            }
            
            console.log(`API Success: ${response.status}`, data);
            return { success: true, data };
            
        } catch (error) {
            console.error('API Error:', error);
            
            // If it's a network error and it's a write request, queue it for offline sync
            if (isWriteRequest && this.isNetworkError(error)) {
                console.log('Network error detected, queuing request for offline sync');
                return this.queueOfflineRequest(endpoint, config);
            }
            
            if (error instanceof APIError) {
                throw error;
            }
            
            // Network or other errors - provide more specific error information
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new APIError('Failed to connect to backend - please check your network connection', 0, { originalError: error });
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new APIError('Backend server is not responding - please try again later', 0, { originalError: error });
            } else {
                throw new APIError(error.message || 'Network error', 0, { originalError: error });
            }
        }
    },
    
    // Check if error is a network error
    isNetworkError: function(error) {
        return error.name === 'TypeError' && 
               (error.message.includes('fetch') || 
                error.message.includes('Failed to fetch') || 
                error.message.includes('NetworkError'));
    },
    
    // Queue request for offline sync
    queueOfflineRequest: function(endpoint, config) {
        if (typeof OfflineManager !== 'undefined') {
            const requestData = {
                endpoint: endpoint,
                method: config.method || 'GET',
                headers: config.headers,
                body: config.body
            };
            
            // Determine request type based on endpoint
            let requestType = 'user_data';
            if (endpoint.includes('survey')) {
                requestType = 'survey_data';
            } else if (endpoint.includes('clan')) {
                requestType = 'clan_data';
            }
            
            // Add to offline sync queue
            OfflineManager.addToSyncQueue(requestType, requestData, endpoint);
            
            // Return success response for immediate feedback
            return { 
                success: true, 
                data: { 
                    message: 'Data saved locally and will sync when online',
                    offline: true
                } 
            };
        } else {
            throw new APIError('Offline functionality not available', 0, { originalError: config });
        }
    },
    
    // HTTP methods
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    // Upload file
    async upload(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add additional data
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });
        
        const token = localStorage.getItem('authToken');
        const deviceId = localStorage.getItem('deviceId') || 'web-device';
        
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'X-Device-ID': deviceId
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new APIError(data.message || data.detail || 'Upload failed', response.status, data);
            }
            
            return { success: true, data };
            
        } catch (error) {
            console.error('Upload Error:', error);
            throw new APIError(error.message || 'Upload failed', 0, { originalError: error });
        }
    }
};

// Custom API Error class
class APIError extends Error {
    constructor(message, status, data = {}) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// Authentication API
window.AuthAPI = {
    // Login method
    async login(credentials) {
        // First try backend login
        try {
            console.log('Attempting backend login...');
            const response = await API.post('/token/', credentials);
            
            if (response.success) {
                const { access_token, refresh_token, user } = response.data;
                
                // Store tokens and user data
                localStorage.setItem('authToken', access_token);
                localStorage.setItem('refreshToken', refresh_token);
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                return { success: true, user, access_token, refresh_token, source: 'backend' };
            }
            
            return response;
            
        } catch (error) {
            console.error('Backend login failed, trying fallback...', error);
            
            // If backend fails, use fallback login
            return this.fallbackLogin(credentials);
        }
    },
    
    // Fallback login method for development/testing
    fallbackLogin: function(credentials) {
        console.log('Using fallback login system');
        
        // Mock user database
        const mockUsers = {
            'wiki': { id: 1, username: 'wiki', email: 'wiki@example.com', first_name: 'Wiki', last_name: 'User', role: 'superadmin' },
            'admin': { id: 2, username: 'admin', email: 'admin@example.com', first_name: 'Admin', last_name: 'User', role: 'admin' },
            'agent001': { id: 3, username: 'agent001', email: 'agent001@example.com', first_name: 'Agent', last_name: 'One', role: 'agent' },
            'superadmin': { id: 4, username: 'superadmin', email: 'superadmin@example.com', first_name: 'Super', last_name: 'Admin', role: 'superadmin' }
        };
        
        const { username, password } = credentials;
        
        // Simple validation - accept any password for known users
        if (mockUsers[username]) {
            const user = mockUsers[username];
            const mockToken = 'fallback-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            
            // Store mock tokens and user data
            localStorage.setItem('authToken', mockToken);
            localStorage.setItem('refreshToken', mockToken + '-refresh');
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('fallbackMode', 'true');
            
            console.log('Fallback login successful for user:', username);
            
            return { 
                success: true, 
                user, 
                access_token: mockToken, 
                refresh_token: mockToken + '-refresh',
                source: 'fallback',
                message: 'Using fallback authentication (offline mode)'
            };
        } else {
            return { 
                success: false, 
                error: 'Invalid credentials',
                details: `User '${username}' not found in fallback system`,
                status: 401
            };
        }
    },
    
    // Logout user
    async logout() {
        try {
            await API.post('/auth/logout/');
        } catch (error) {
            console.error('Logout Error:', error);
        } finally {
            // Clear local storage regardless of API call success
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('deviceId');
        }
    },
    
    // Refresh token
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            
            const response = await API.post('/auth/refresh/', { refresh_token: refreshToken });
            
            if (response.success) {
                const { access_token } = response.data;
                localStorage.setItem('authToken', access_token);
                return { success: true, token: access_token };
            }
            
            return response;
            
        } catch (error) {
            console.error('Token Refresh Error:', error);
            // Clear tokens on refresh failure
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            return { success: false, error: error.message };
        }
    },
    
    // Get current user
    async getCurrentUser() {
        try {
            const response = await API.get('/auth/user/');
            return response;
        } catch (error) {
            console.error('Get Current User Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Register device
    async registerDevice(deviceInfo) {
        try {
            const response = await API.post('/auth/register-device/', deviceInfo);
            
            if (response.success) {
                const { device_id } = response.data;
                localStorage.setItem('deviceId', device_id);
            }
            
            return response;
            
        } catch (error) {
            console.error('Device Registration Error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Survey API
window.SurveyAPI = {
    // Get all surveys
    async getSurveys(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const endpoint = queryParams ? `/surveys/?${queryParams}` : '/surveys/';
            return await API.get(endpoint);
        } catch (error) {
            console.error('Get Surveys Error:', error);
            
            // Return mock data if backend unavailable
            if (error.status === 0 || error.message.includes('fetch')) {
                return this.getMockSurveys();
            }
            
            return { success: false, error: error.message };
        }
    },
    
    // Get survey by ID
    async getSurvey(id) {
        try {
            return await API.get(`/surveys/${id}/`);
        } catch (error) {
            console.error('Get Survey Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Create new survey
    async createSurvey(surveyData) {
        try {
            return await API.post('/surveys/', surveyData);
        } catch (error) {
            console.error('Create Survey Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Update survey
    async updateSurvey(id, surveyData) {
        try {
            return await API.put(`/surveys/${id}/`, surveyData);
        } catch (error) {
            console.error('Update Survey Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Delete survey
    async deleteSurvey(id) {
        try {
            return await API.delete(`/surveys/${id}/`);
        } catch (error) {
            console.error('Delete Survey Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Submit survey
    async submitSurvey(surveyData) {
        try {
            return await API.post('/surveys/submit/', surveyData);
        } catch (error) {
            console.error('Submit Survey Error:', error);
            return { success: false, error: 'Failed to connect to backend' };
        }
    },
    
    // Get survey statistics
    async getStatistics() {
        try {
            return await API.get('/surveys/statistics/');
        } catch (error) {
            console.error('Get Statistics Error:', error);
            return { success: false, error: 'Failed to connect to backend' };
        }
    },
    
    // Export surveys
    async exportSurveys(format = 'csv', filters = {}) {
        try {
            const queryParams = new URLSearchParams({ format, ...filters }).toString();
            const endpoint = `/surveys/export/?${queryParams}`;
            return await API.get(endpoint);
        } catch (error) {
            console.error('Export Surveys Error:', error);
            return { success: false, error: error.message };
        }
    }
};

// User Management API
window.UserAPI = {
    // Get all users
    async getUsers(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const endpoint = queryParams ? `/users/?${queryParams}` : '/users/';
            return await API.get(endpoint);
        } catch (error) {
            console.error('Get Users Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get user by ID
    async getUser(id) {
        try {
            return await API.get(`/users/${id}/`);
        } catch (error) {
            console.error('Get User Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Create user
    async createUser(userData) {
        try {
            return await API.post('/users/', userData);
        } catch (error) {
            console.error('Create User Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Update user
    async updateUser(id, userData) {
        try {
            return await API.put(`/users/${id}/`, userData);
        } catch (error) {
            console.error('Update User Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Delete user
    async deleteUser(id) {
        try {
            return await API.delete(`/users/${id}/`);
        } catch (error) {
            console.error('Delete User Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Reset user password
    async resetPassword(id) {
        try {
            return await API.post(`/users/${id}/reset-password/`);
        } catch (error) {
            console.error('Reset Password Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Suspend/unsuspend user
    async toggleUserStatus(id, active) {
        try {
            return await API.patch(`/users/${id}/`, { is_active: active });
        } catch (error) {
            console.error('Toggle User Status Error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Device Management API
window.DeviceAPI = {
    // Get all devices
    async getDevices(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const endpoint = queryParams ? `/devices/?${queryParams}` : '/devices/';
            return await API.get(endpoint);
        } catch (error) {
            console.error('Get Devices Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get device by ID
    async getDevice(id) {
        try {
            return await API.get(`/devices/${id}/`);
        } catch (error) {
            console.error('Get Device Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Register device
    async registerDevice(deviceData) {
        try {
            return await API.post('/devices/', deviceData);
        } catch (error) {
            console.error('Register Device Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Update device
    async updateDevice(id, deviceData) {
        try {
            return await API.put(`/devices/${id}/`, deviceData);
        } catch (error) {
            console.error('Update Device Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Delete device
    async deleteDevice(id) {
        try {
            return await API.delete(`/devices/${id}/`);
        } catch (error) {
            console.error('Delete Device Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Wipe device
    async wipeDevice(id) {
        try {
            return await API.post(`/devices/${id}/wipe/`);
        } catch (error) {
            console.error('Wipe Device Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Sync device
    async syncDevice(id) {
        try {
            return await API.post(`/devices/${id}/sync/`);
        } catch (error) {
            console.error('Sync Device Error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Activity Logs API
window.ActivityAPI = {
    // Get activity logs
    async getLogs(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const endpoint = queryParams ? `/activity-logs/?${queryParams}` : '/activity-logs/';
            return await API.get(endpoint);
        } catch (error) {
            console.error('Get Activity Logs Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Create activity log
    async createLog(logData) {
        try {
            return await API.post('/activity-logs/', logData);
        } catch (error) {
            console.error('Create Activity Log Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Clear old logs
    async clearLogs(daysOld = 90) {
        try {
            return await API.delete(`/activity-logs/clear/?days_old=${daysOld}`);
        } catch (error) {
            console.error('Clear Activity Logs Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Export logs
    async exportLogs(format = 'csv', filters = {}) {
        try {
            const queryParams = new URLSearchParams({ format, ...filters }).toString();
            const endpoint = `/activity-logs/export/?${queryParams}`;
            return await API.get(endpoint);
        } catch (error) {
            console.error('Export Activity Logs Error:', error);
            return { success: false, error: error.message };
        }
    }
};

// System Settings API
window.SettingsAPI = {
    // Get system settings
    async getSettings() {
        try {
            return await API.get('/settings/');
        } catch (error) {
            console.error('Get Settings Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Update system settings
    async updateSettings(settingsData) {
        try {
            return await API.put('/settings/', settingsData);
        } catch (error) {
            console.error('Update Settings Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Reset settings to defaults
    async resetSettings() {
        try {
            return await API.post('/settings/reset/');
        } catch (error) {
            console.error('Reset Settings Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get system status
    async getSystemStatus() {
        try {
            return await API.get('/settings/system-status/');
        } catch (error) {
            console.error('Get System Status Error:', error);
            return { success: false, error: error.message };
        }
    }
};

// File Upload API
window.FileAPI = {
    // Upload file
    async uploadFile(file, type = 'general') {
        try {
            return await API.upload('/files/upload/', file, { type });
        } catch (error) {
            console.error('Upload File Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get file info
    async getFileInfo(fileId) {
        try {
            return await API.get(`/files/${fileId}/`);
        } catch (error) {
            console.error('Get File Info Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Delete file
    async deleteFile(fileId) {
        try {
            return await API.delete(`/files/${fileId}/`);
        } catch (error) {
            console.error('Delete File Error:', error);
            return { success: false, error: error.message };
        }
    }
};
