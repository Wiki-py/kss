// OBB Baseline Survey System - Configuration

// Application Configuration
window.AppConfig = {
    // API Configuration
    API_BASE_URL: 'http://localhost:8000/api',
    API_TIMEOUT: 30000,
    
    // PWA Configuration
    PWA_NAME: 'OBB Baseline Survey System',
    PWA_SHORT_NAME: 'OBB Survey',
    PWA_THEME_COLOR: '#dc2626',
    PWA_BACKGROUND_COLOR: '#ffffff',
    
    // Database Configuration
    DB_NAME: 'OBB_Survey_DB',
    DB_VERSION: 1,
    
    // Authentication Configuration
    TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
    AUTO_LOGOUT_TIME: 60 * 60 * 1000, // 1 hour
    
    // Sync Configuration
    SYNC_RETRY_ATTEMPTS: 3,
    SYNC_RETRY_DELAY: 5000,
    SYNC_BATCH_SIZE: 10,
    
    // File Upload Configuration
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    MAX_IMAGE_WIDTH: 1024,
    MAX_IMAGE_HEIGHT: 1024,
    
    // Survey Configuration
    MAX_SUB_CLANS: 50,
    MAX_COMMITTEE_MEMBERS: 20,
    MAX_OFFICE_STRUCTURES: 30,
    
    // UI Configuration
    TOAST_DURATION: 5000,
    LOADING_TIMEOUT: 10000,
    DEBOUNCE_DELAY: 300,
    
    // Development Configuration
    DEBUG_MODE: true,
    MOCK_MODE: true, // Use mock data when backend is not available
    
    // Feature Flags
    ENABLE_PWA_INSTALL: true,
    ENABLE_OFFLINE_MODE: true,
    ENABLE_BACKGROUND_SYNC: true,
    ENABLE_PHOTO_CAPTURE: true,
    ENABLE_SIGNATURE_PADS: true,
    ENABLE_CHARTS: true,
    ENABLE_REPORTS: true
};

// User Roles
window.UserRoles = {
    AGENT: 'agent',
    ADMIN: 'admin',
    SUPER_ADMIN: 'superadmin'
};

// Survey Status
window.SurveyStatus = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    SYNCED: 'synced',
    REJECTED: 'rejected'
};

// Sync Status
window.SyncStatus = {
    PENDING: 'pending',
    SYNCING: 'syncing',
    SYNCED: 'synced',
    FAILED: 'failed'
};

// Error Messages
window.ErrorMessages = {
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
    AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
    VALIDATION_ERROR: 'Please fill in all required fields.',
    FILE_SIZE_ERROR: 'File size exceeds the maximum limit.',
    FILE_TYPE_ERROR: 'Invalid file type. Please upload an image.',
    SYNC_ERROR: 'Failed to sync data. Please try again.',
    DEVICE_ERROR: 'Device registration failed. Please try again.',
    PERMISSION_ERROR: 'You do not have permission to perform this action.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
};

// Success Messages
window.SuccessMessages = {
    LOGIN_SUCCESS: 'Login successful!',
    LOGOUT_SUCCESS: 'Logged out successfully!',
    SURVEY_SAVED: 'Survey saved successfully!',
    SURVEY_SUBMITTED: 'Survey submitted successfully!',
    SYNC_SUCCESS: 'Data synced successfully!',
    PROFILE_UPDATED: 'Profile updated successfully!',
    SETTINGS_SAVED: 'Settings saved successfully!',
    DEVICE_REGISTERED: 'Device registered successfully!',
    PWA_INSTALLED: 'App installed successfully!'
};

// Mock Users for Development
window.MockUsers = [
    {
        id: 1,
        username: 'agent001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@obb.com',
        role: UserRoles.AGENT,
        is_active: true,
        date_joined: '2024-01-15',
        last_login: new Date().toISOString(),
        phone: '+256123456789',
        district: 'Central',
        village: 'Kampala'
    },
    {
        id: 2,
        username: 'admin001',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@obb.com',
        role: UserRoles.ADMIN,
        is_active: true,
        date_joined: '2024-01-10',
        last_login: new Date(Date.now() - 86400000).toISOString(),
        phone: '+256123456790',
        district: 'Central',
        village: 'Kampala'
    },
    {
        id: 3,
        username: 'superadmin',
        first_name: 'Robert',
        last_name: 'Johnson',
        email: 'robert.johnson@obb.com',
        role: UserRoles.SUPER_ADMIN,
        is_active: true,
        date_joined: '2024-01-01',
        last_login: new Date(Date.now() - 172800000).toISOString(),
        phone: '+256123456791',
        district: 'Central',
        village: 'Kampala'
    }
];

// Mock Survey Data for Development
window.MockSurveys = [
    {
        id: 1,
        title: 'Bweyogerere Clan Survey',
        description: 'Baseline survey for Bweyogerere clan',
        location: 'Bweyogerere, Kampala',
        gps_coordinates: '0.3476° N, 32.5825° E',
        submitted_at: new Date(Date.now() - 86400000).toISOString(),
        synced: true,
        agent_id: 1,
        agent_name: 'John Doe',
        status: SurveyStatus.SYNCED,
        clan_name: 'Bweyogerere Clan',
        number_of_sub_clans: 5,
        number_of_bitubhi: 12,
        total_households: 150,
        total_population: 750,
        male_population: 380,
        female_population: 370,
        youth_population: 200
    },
    {
        id: 2,
        title: 'Kawempe Clan Survey',
        description: 'Baseline survey for Kawempe clan',
        location: 'Kawempe, Kampala',
        gps_coordinates: '0.3476° N, 32.5825° E',
        submitted_at: new Date(Date.now() - 172800000).toISOString(),
        synced: false,
        agent_id: 1,
        agent_name: 'John Doe',
        status: SurveyStatus.PENDING,
        clan_name: 'Kawempe Clan',
        number_of_sub_clans: 3,
        number_of_bitubhi: 8,
        total_households: 100,
        total_population: 500,
        male_population: 250,
        female_population: 250,
        youth_population: 150
    }
];

// Mock Device Data for Development
window.MockDevices = [
    {
        id: 1,
        device_id: 'device_001',
        device_name: 'Samsung Galaxy Tab A',
        device_type: 'tablet',
        os_version: 'Android 11',
        app_version: '1.0.0',
        last_seen: new Date().toISOString(),
        is_active: true,
        agent_id: 1,
        agent_name: 'John Doe',
        registered_at: '2024-01-15'
    },
    {
        id: 2,
        device_id: 'device_002',
        device_name: 'iPhone 12',
        device_type: 'phone',
        os_version: 'iOS 16.0',
        app_version: '1.0.0',
        last_seen: new Date(Date.now() - 3600000).toISOString(),
        is_active: true,
        agent_id: 2,
        agent_name: 'Jane Smith',
        registered_at: '2024-01-10'
    }
];

// Utility Functions
window.AppUtils = {
    // Get API URL
    getApiUrl: function(endpoint) {
        return AppConfig.API_BASE_URL + endpoint;
    },
    
    // Get current user
    getCurrentUser: function() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },
    
    // Get auth token
    getAuthToken: function() {
        return localStorage.getItem('authToken');
    },
    
    // Check if user is authenticated
    isAuthenticated: function() {
        return !!this.getAuthToken() && !!this.getCurrentUser();
    },
    
    // Check user role
    hasRole: function(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    },
    
    // Check if user has permission
    hasPermission: function(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        const permissions = {
            [UserRoles.AGENT]: ['create_survey', 'view_own_surveys'],
            [UserRoles.ADMIN]: ['create_survey', 'view_all_surveys', 'manage_agents', 'view_reports'],
            [UserRoles.SUPER_ADMIN]: ['create_survey', 'view_all_surveys', 'manage_agents', 'manage_users', 'manage_devices', 'view_reports', 'system_settings']
        };
        
        return permissions[user.role] && permissions[user.role].includes(permission);
    },
    
    // Format date
    formatDate: function(dateString, format = 'short') {
        if (!dateString) return 'Never';
        
        const date = new Date(dateString);
        
        switch (format) {
            case 'short':
                return date.toLocaleDateString();
            case 'long':
                return date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            case 'time':
                return date.toLocaleString();
            default:
                return date.toLocaleDateString();
        }
    },
    
    // Format number
    formatNumber: function(num) {
        return new Intl.NumberFormat().format(num);
    },
    
    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Generate unique ID
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Validate email
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Validate phone
    validatePhone: function(phone) {
        const re = /^\+?[\d\s\-()]+$/;
        return re.test(phone);
    },
    
    // Get color by status
    getStatusColor: function(status) {
        const colors = {
            [SurveyStatus.DRAFT]: 'yellow',
            [SurveyStatus.SUBMITTED]: 'blue',
            [SurveyStatus.SYNCED]: 'green',
            [SurveyStatus.REJECTED]: 'red',
            [SyncStatus.PENDING]: 'yellow',
            [SyncStatus.SYNCING]: 'blue',
            [SyncStatus.SYNCED]: 'green',
            [SyncStatus.FAILED]: 'red'
        };
        return colors[status] || 'gray';
    },
    
    // Log debug messages
    log: function(message, data = null) {
        if (AppConfig.DEBUG_MODE) {
            console.log(`[OBB Survey] ${message}`, data);
        }
    },
    
    // Log error messages
    error: function(message, error = null) {
        console.error(`[OBB Survey Error] ${message}`, error);
    },
    
    // Log warning messages
    warn: function(message, data = null) {
        console.warn(`[OBB Survey Warning] ${message}`, data);
    }
};
