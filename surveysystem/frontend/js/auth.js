// OBB Baseline Survey System - Authentication Module

window.Auth = {
    currentUser: null,
    authToken: null,
    refreshToken: null,
    tokenRefreshTimer: null,
    
    // Initialize authentication
    init: async function() {
        AppUtils.log('Initializing authentication...');
        
        try {
            // Check for existing session
            const token = Storage.get('authToken');
            const user = Storage.get('currentUser');
            const refreshToken = Storage.get('refreshToken');
            
            if (token && user) {
                this.authToken = token;
                this.currentUser = user;
                this.refreshToken = refreshToken;
                
                // Validate token
                const isValid = await this.validateToken();
                if (!isValid) {
                    await this.logout();
                    return false;
                }
                
                // Setup token refresh
                this.setupTokenRefresh();
                
                AppUtils.log('Session restored:', { user: user.username, role: user.role });
                return true;
            }
            
            AppUtils.log('No existing session found');
            return false;
            
        } catch (error) {
            AppUtils.error('Authentication initialization failed:', error);
            await this.logout();
            return false;
        }
    },
    
    // Login with username and password
    login: async function(username, password) {
        try {
            AppUtils.log('Attempting login:', { username });
            
            // Get device ID
            const deviceId = await DeviceManager.getId();
            if (!deviceId) {
                throw new Error('Device ID not available');
            }
            
            // Prepare login data
            const loginData = {
                username: username,
                password: password,
                device_id: deviceId,
                device_info: DeviceManager.getInfo()
            };
            
            let response;
            
            if (AppConfig.MOCK_MODE) {
                // Mock login
                response = await this.mockLogin(loginData);
            } else {
                // Real API login
                response = await fetch(AppUtils.getApiUrl('/token/'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Device-ID': deviceId
                    },
                    body: JSON.stringify(loginData)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Login failed');
                }
                
                response = await response.json();
            }
            
            // Store authentication data
            await this.setAuthData(response);
            
            // Register device if not already registered
            if (!DeviceManager.isRegistered()) {
                await DeviceManager.register(response.user.id);
                DeviceManager.setRegistered(true);
            }
            
            AppUtils.log('Login successful:', { user: response.user.username, role: response.user.role });
            Toast.success(SuccessMessages.LOGIN_SUCCESS);
            
            return response;
            
        } catch (error) {
            AppUtils.error('Login failed:', error);
            Toast.error(error.message || ErrorMessages.AUTHENTICATION_ERROR);
            throw error;
        }
    },
    
    // Mock login for development
    mockLogin: async function(loginData) {
        const { username, password } = loginData;
        
        // Find user in mock data
        const user = MockUsers.find(u => u.username === username);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        if (!user.is_active) {
            throw new Error('Account is disabled');
        }
        
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        
        // Mock successful login
        return {
            access: 'mock-access-token-' + Date.now(),
            refresh: 'mock-refresh-token-' + Date.now(),
            user: {
                ...user,
                last_login: new Date().toISOString()
            },
            expires_in: 3600 // 1 hour
        };
    },
    
    // Set authentication data
    setAuthData: async function(authData) {
        this.authToken = authData.access;
        this.refreshToken = authData.refresh;
        this.currentUser = authData.user;
        
        // Store in localStorage
        Storage.set('authToken', this.authToken);
        Storage.set('refreshToken', this.refreshToken);
        Storage.set('currentUser', this.currentUser);
        
        // Cache user in database
        await Database.cacheUser(this.currentUser);
        
        // Setup token refresh
        this.setupTokenRefresh();
        
        // Setup API interceptors
        this.setupApiInterceptors();
    },
    
    // Logout
    logout: async function() {
        try {
            AppUtils.log('Logging out...');
            
            // Call logout API if not in mock mode
            if (!AppConfig.MOCK_MODE && this.authToken) {
                try {
                    await fetch(AppUtils.getApiUrl('/logout/'), {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.authToken}`,
                            'X-Device-ID': DeviceManager.getId()
                        }
                    });
                } catch (error) {
                    AppUtils.warn('Logout API call failed:', error);
                }
            }
            
            // Clear authentication data
            this.authToken = null;
            this.refreshToken = null;
            this.currentUser = null;
            
            // Clear localStorage
            Storage.remove('authToken');
            Storage.remove('refreshToken');
            Storage.remove('currentUser');
            
            // Clear token refresh timer
            if (this.tokenRefreshTimer) {
                clearTimeout(this.tokenRefreshTimer);
                this.tokenRefreshTimer = null;
            }
            
            AppUtils.log('Logged out successfully');
            Toast.success(SuccessMessages.LOGOUT_SUCCESS);
            
            return true;
            
        } catch (error) {
            AppUtils.error('Logout failed:', error);
            // Force logout even if API call fails
            return this.forceLogout();
        }
    },
    
    // Force logout (clear all data)
    forceLogout: function() {
        this.authToken = null;
        this.refreshToken = null;
        this.currentUser = null;
        
        Storage.remove('authToken');
        Storage.remove('refreshToken');
        Storage.remove('currentUser');
        
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
            this.tokenRefreshTimer = null;
        }
        
        return true;
    },
    
    // Validate current token
    validateToken: async function() {
        if (!this.authToken) return false;
        
        try {
            if (AppConfig.MOCK_MODE) {
                return true; // Mock tokens are always valid
            }
            
            // Check token expiration
            const tokenData = this.decodeToken(this.authToken);
            if (!tokenData || !tokenData.exp) {
                return false;
            }
            
            const now = Math.floor(Date.now() / 1000);
            if (tokenData.exp < now) {
                AppUtils.log('Token expired, attempting refresh...');
                return await this.refreshToken();
            }
            
            return true;
            
        } catch (error) {
            AppUtils.error('Token validation failed:', error);
            return false;
        }
    },
    
    // Decode JWT token
    decodeToken: function(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }
            
            const payload = JSON.parse(atob(parts[1]));
            return payload;
            
        } catch (error) {
            AppUtils.error('Failed to decode token:', error);
            return null;
        }
    },
    
    // Refresh token
    refreshToken: async function() {
        try {
            if (!this.refreshToken) {
                throw new Error('No refresh token available');
            }
            
            AppUtils.log('Refreshing token...');
            
            let response;
            
            if (AppConfig.MOCK_MODE) {
                // Mock token refresh
                response = {
                    access: 'mock-access-token-' + Date.now(),
                    refresh: 'mock-refresh-token-' + Date.now(),
                    expires_in: 3600
                };
            } else {
                // Real API token refresh
                const apiResponse = await fetch(AppUtils.getApiUrl('/token/refresh/'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.refreshToken}`,
                        'X-Device-ID': DeviceManager.getId()
                    },
                    body: JSON.stringify({
                        refresh: this.refreshToken
                    })
                });
                
                if (!apiResponse.ok) {
                    throw new Error('Token refresh failed');
                }
                
                response = await apiResponse.json();
            }
            
            // Update tokens
            this.authToken = response.access;
            this.refreshToken = response.refresh;
            
            Storage.set('authToken', this.authToken);
            Storage.set('refreshToken', this.refreshToken);
            
            // Setup new refresh timer
            this.setupTokenRefresh();
            
            AppUtils.log('Token refreshed successfully');
            return true;
            
        } catch (error) {
            AppUtils.error('Token refresh failed:', error);
            await this.logout();
            return false;
        }
    },
    
    // Setup automatic token refresh
    setupTokenRefresh: function() {
        if (!this.authToken) return;
        
        // Clear existing timer
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
        }
        
        try {
            const tokenData = this.decodeToken(this.authToken);
            if (!tokenData || !tokenData.exp) return;
            
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = tokenData.exp;
            const refreshTime = expiresAt - (AppConfig.TOKEN_REFRESH_THRESHOLD / 1000);
            const delay = Math.max(0, (refreshTime - now) * 1000);
            
            this.tokenRefreshTimer = setTimeout(async () => {
                await this.refreshToken();
            }, delay);
            
            AppUtils.log('Token refresh scheduled for:', new Date(Date.now() + delay));
            
        } catch (error) {
            AppUtils.error('Failed to setup token refresh:', error);
        }
    },
    
    // Setup API interceptors
    setupApiInterceptors: function() {
        // Store original fetch
        const originalFetch = window.fetch;
        
        // Override fetch
        window.fetch = async (url, options = {}) => {
            // Add auth headers
            options.headers = {
                ...options.headers,
                'Content-Type': 'application/json'
            };
            
            // Add auth token if available
            if (this.authToken) {
                options.headers['Authorization'] = `Bearer ${this.authToken}`;
            }
            
            // Add device ID
            const deviceId = DeviceManager.getId();
            if (deviceId) {
                options.headers['X-Device-ID'] = deviceId;
            }
            
            // Make request
            let response = await originalFetch(url, options);
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                AppUtils.log('Received 401, attempting token refresh...');
                
                // Try to refresh token
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry request with new token
                    options.headers['Authorization'] = `Bearer ${this.authToken}`;
                    response = await originalFetch(url, options);
                }
            }
            
            return response;
        };
    },
    
    // Get current user
    getCurrentUser: function() {
        return this.currentUser;
    },
    
    // Get auth token
    getAuthToken: function() {
        return this.authToken;
    },
    
    // Check if authenticated
    isAuthenticated: function() {
        return !!this.authToken && !!this.currentUser;
    },
    
    // Check user role
    hasRole: function(role) {
        return this.currentUser && this.currentUser.role === role;
    },
    
    // Check if user has permission
    hasPermission: function(permission) {
        if (!this.currentUser) return false;
        
        const permissions = {
            [UserRoles.AGENT]: ['create_survey', 'view_own_surveys', 'edit_own_surveys'],
            [UserRoles.ADMIN]: ['create_survey', 'view_all_surveys', 'edit_all_surveys', 'manage_agents', 'view_reports', 'generate_reports'],
            [UserRoles.SUPER_ADMIN]: ['create_survey', 'view_all_surveys', 'edit_all_surveys', 'manage_agents', 'manage_users', 'manage_devices', 'view_reports', 'generate_reports', 'system_settings']
        };
        
        const userPermissions = permissions[this.currentUser.role];
        return userPermissions && userPermissions.includes(permission);
    },
    
    // Update user profile
    updateProfile: async function(profileData) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }
            
            let response;
            
            if (AppConfig.MOCK_MODE) {
                // Mock profile update
                response = {
                    ...this.currentUser,
                    ...profileData,
                    updated_at: new Date().toISOString()
                };
            } else {
                // Real API call
                const apiResponse = await fetch(AppUtils.getApiUrl('/users/profile/'), {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'X-Device-ID': DeviceManager.getId()
                    },
                    body: JSON.stringify(profileData)
                });
                
                if (!apiResponse.ok) {
                    throw new Error('Profile update failed');
                }
                
                response = await apiResponse.json();
            }
            
            // Update current user
            this.currentUser = response;
            Storage.set('currentUser', this.currentUser);
            
            // Cache updated user
            await Database.cacheUser(this.currentUser);
            
            AppUtils.log('Profile updated successfully');
            Toast.success(SuccessMessages.PROFILE_UPDATED);
            
            return response;
            
        } catch (error) {
            AppUtils.error('Profile update failed:', error);
            Toast.error(error.message || ErrorMessages.SERVER_ERROR);
            throw error;
        }
    },
    
    // Change password
    changePassword: async function(currentPassword, newPassword) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }
            
            let response;
            
            if (AppConfig.MOCK_MODE) {
                // Mock password change
                response = { success: true };
            } else {
                // Real API call
                const apiResponse = await fetch(AppUtils.getApiUrl('/users/change-password/'), {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'X-Device-ID': DeviceManager.getId()
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword
                    })
                });
                
                if (!apiResponse.ok) {
                    throw new Error('Password change failed');
                }
                
                response = await apiResponse.json();
            }
            
            AppUtils.log('Password changed successfully');
            Toast.success('Password changed successfully');
            
            return response;
            
        } catch (error) {
            AppUtils.error('Password change failed:', error);
            Toast.error(error.message || ErrorMessages.SERVER_ERROR);
            throw error;
        }
    },
    
    // Get session info
    getSessionInfo: function() {
        if (!this.isAuthenticated()) {
            return null;
        }
        
        const tokenData = this.decodeToken(this.authToken);
        
        return {
            user: this.currentUser,
            token: {
                issued_at: tokenData.iat ? new Date(tokenData.iat * 1000) : null,
                expires_at: tokenData.exp ? new Date(tokenData.exp * 1000) : null,
                refresh_scheduled: !!this.tokenRefreshTimer
            },
            device: DeviceManager.getInfo(),
            permissions: this.getUserPermissions()
        };
    },
    
    // Get user permissions
    getUserPermissions: function() {
        if (!this.currentUser) return [];
        
        const permissions = {
            [UserRoles.AGENT]: ['create_survey', 'view_own_surveys', 'edit_own_surveys'],
            [UserRoles.ADMIN]: ['create_survey', 'view_all_surveys', 'edit_all_surveys', 'manage_agents', 'view_reports', 'generate_reports'],
            [UserRoles.SUPER_ADMIN]: ['create_survey', 'view_all_surveys', 'edit_all_surveys', 'manage_agents', 'manage_users', 'manage_devices', 'view_reports', 'generate_reports', 'system_settings']
        };
        
        return permissions[this.currentUser.role] || [];
    }
};
