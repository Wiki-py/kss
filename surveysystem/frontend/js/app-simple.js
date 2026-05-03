// OBB Baseline Survey System - Simplified Main Application

window.AppSimple = {
    currentPage: 'login',
    currentUser: null,
    navigationHistory: [],
    
    // Initialize application
    init: function() {
        console.log('Initializing OBB Survey Application (Simple)...');
        
        try {
            // Hide loading immediately
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
            
            // Initialize offline manager with error handling
            if (typeof OfflineManager !== 'undefined') {
                console.log('OfflineManager found, initializing...');
                try {
                    OfflineManager.init();
                    console.log('Offline manager initialized successfully');
                } catch (offlineError) {
                    console.warn('Offline manager initialization failed, continuing without it:', offlineError);
                }
            } else {
                console.warn('OfflineManager not found, continuing without offline features');
            }
            
            // Check for existing session
            this.checkSession();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            console.error('Stack trace:', error.stack);
            
            // Show more user-friendly error without alert
            const errorElement = document.createElement('div');
            errorElement.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; background: #dc2626; color: white; padding: 10px; text-align: center; z-index: 9999;">
                    <strong>Application Error:</strong> ${error.message}
                    <button onclick="location.reload()" style="margin-left: 10px; padding: 5px 10px; background: white; color: #dc2626; border: none; border-radius: 3px; cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            `;
            document.body.appendChild(errorElement);
        }
    },
    
    // Check for existing session
    checkSession: function() {
        const currentUser = localStorage.getItem('currentUser');
        const authToken = localStorage.getItem('authToken');
        
        if (currentUser && authToken) {
            try {
                this.currentUser = JSON.parse(currentUser);
                // Restore navigation state
                const savedPage = localStorage.getItem('currentPage') || 'dashboard';
                const savedHistory = localStorage.getItem('navigationHistory');
                
                if (savedHistory) {
                    this.navigationHistory = JSON.parse(savedHistory);
                }
                
                // Show appropriate dashboard based on role
                this.showAuthenticatedPage(savedPage);
            } catch (error) {
                console.error('Invalid session data:', error);
                this.clearSession();
                this.showLoginPage();
            }
        } else {
            this.showLoginPage();
        }
    },
    
    // Show authenticated page
    showAuthenticatedPage: function(page) {
        if (!this.currentUser) {
            this.showLoginPage();
            return;
        }
        
        // Hide login page and show navigation
        this.hideLoginPage();
        
        // Add to navigation history
        this.addToHistory(page);
        
        switch(page) {
            case 'dashboard':
                if (this.currentUser.role === 'admin') {
                    this.showAdminDashboard();
                } else if (this.currentUser.role === 'superadmin') {
                    this.showSuperAdminDashboard();
                } else {
                    this.showAgentDashboard();
                }
                break;
            case 'surveys':
                this.showAgentDashboard();
                break;
            case 'new-survey':
                this.showNewSurvey();
                break;
            case 'clan-management':
                this.showClanManagement();
                break;
            default:
                this.showAgentDashboard();
        }
    },
    
    // Add to navigation history
    addToHistory: function(page) {
        // Don't add duplicate consecutive pages
        if (this.navigationHistory[this.navigationHistory.length - 1] !== page) {
            this.navigationHistory.push(page);
            // Keep only last 10 pages
            if (this.navigationHistory.length > 10) {
                this.navigationHistory.shift();
            }
            // Save to localStorage
            localStorage.setItem('navigationHistory', JSON.stringify(this.navigationHistory));
        }
        
        // Update current page
        this.currentPage = page;
        localStorage.setItem('currentPage', page);
        
        // Update back button visibility
        this.updateBackButton();
    },
    
    // Update back button visibility
    updateBackButton: function() {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            if (this.navigationHistory.length > 1) {
                backBtn.classList.remove('hidden');
            } else {
                backBtn.classList.add('hidden');
            }
        }
    },
    
    // Go back to previous page
    goBack: function() {
        if (this.navigationHistory.length > 1) {
            // Remove current page
            this.navigationHistory.pop();
            // Get previous page
            const previousPage = this.navigationHistory[this.navigationHistory.length - 1];
            
            // Navigate to previous page
            this.showAuthenticatedPage(previousPage);
        } else {
            // If no history, go to dashboard
            this.showAuthenticatedPage('dashboard');
        }
    },
    
    // Clear session
    clearSession: function() {
        this.currentUser = null;
        this.currentPage = 'login';
        this.navigationHistory = [];
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentPage');
        localStorage.removeItem('navigationHistory');
    },
    
    // Initialize modules in background (non-blocking)
    initializeModulesBackground: function() {
        setTimeout(async () => {
            try {
                // Initialize device detection
                if (window.DeviceManager) {
                    await DeviceManager.init();
                }
                
                // Initialize database
                if (window.Database) {
                    await Database.init();
                }
                
                // Initialize sync
                if (window.Sync) {
                    Sync.init();
                }
                
                console.log('Background modules initialized');
            } catch (error) {
                console.error('Background module initialization failed:', error);
            }
        }, 1000);
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Get form values
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                console.log('Form submission - Username:', username, 'Password provided:', !!password);
                
                this.login(username, password);
            });
        }
        
        // Login button (backup)
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get form values
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                this.login(username, password);
            });
        }
        
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.handleNavigation(page);
            });
        });
        
        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        console.log('Event listeners setup complete');
    },
    
    // Show login page
    showLoginPage: function() {
        console.log('Showing login page');
        
        // Hide navigation bar
        const navbar = document.getElementById('navbar');
        if (navbar) {
            navbar.style.display = 'none';
        }
        
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-md w-full space-y-8">
                    <div>
                        <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                            <i class="fas fa-shield-check text-red-600 text-xl"></i>
                        </div>
                        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
                        <p class="mt-2 text-center text-sm text-gray-600">
                            OBB Baseline Survey System
                        </p>
                    </div>
                    <form id="loginForm" class="mt-8 space-y-6">
                        <div class="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label for="username" class="sr-only">Username</label>
                                <input id="username" name="username" type="text" required 
                                       class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm" 
                                       placeholder="Username">
                            </div>
                            <div>
                                <label for="password" class="sr-only">Password</label>
                                <input id="password" name="password" type="password" required 
                                       class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm" 
                                       placeholder="Password">
                            </div>
                        </div>

                        <div>
                            <button type="submit" id="loginBtn" 
                                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <i class="fas fa-sign-in-alt text-red-500 group-hover:text-red-400"></i>
                                </span>
                                Sign in
                            </button>
                        </div>

                        <div id="errorMessage" class="hidden">
                            <div class="bg-red-50 border-l-4 border-red-500 p-4">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <i class="fas fa-exclamation-circle text-red-400"></i>
                                    </div>
                                    <div class="ml-3">
                                        <p id="errorText" class="text-sm text-red-700"></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                    
                    <div class="mt-6 text-center">
                        <p class="text-sm text-gray-600">Demo Credentials:</p>
                        <div class="mt-2 space-y-1">
                            <p class="text-xs text-gray-500">Agent: agent001 | Admin: admin001 | Super: superadmin</p>
                            <p class="text-xs text-gray-500">Password: Any 6+ characters</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Setup event listeners after content is loaded
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
    },
    
    // Hide login page
    hideLoginPage: function() {
        console.log('Hiding login page');
        
        // Show navigation bar
        const navbar = document.getElementById('navbar');
        if (navbar) {
            navbar.style.display = 'block';
        }
        
        // Clear login page content
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = '';
        }
    },
    
    // Handle login
    login: async function(username, password) {
        console.log('Login function called with:', username, 'password provided:', !!password);
        
        const loginBtn = document.getElementById('loginBtn');
        const loginButtonText = document.getElementById('loginButtonText');
        const loginLoading = document.getElementById('loginLoading');
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        const successMessage = document.getElementById('successMessage');
        
        console.log('DOM elements found:', {
            loginBtn: !!loginBtn,
            loginButtonText: !!loginButtonText,
            loginLoading: !!loginLoading,
            errorMessage: !!errorMessage,
            errorText: !!errorText,
            successMessage: !!successMessage
        });
        
        // Validate inputs
        if (!username || !password) {
            console.log('Validation failed - username or password missing');
            this.showError('Username and password are required');
            return;
        }
        
        // Hide any existing messages
        if (errorMessage) errorMessage.classList.add('hidden');
        if (successMessage) successMessage.classList.add('hidden');
        
        try {
            // Show loading state
            if (loginBtn) loginBtn.disabled = true;
            if (loginButtonText) loginButtonText.textContent = 'Signing in...';
            if (loginLoading) loginLoading.classList.remove('hidden');
            
            // Get device info
            const deviceInfo = await this.getDeviceInfo();
            
            // Get device ID from localStorage or generate one
            const deviceId = localStorage.getItem('deviceId') || 'web-device-' + Date.now();
            
            // Prepare login data
            const loginData = {
                username: username,
                password: password,
                device_id: deviceId,
                device_info: deviceInfo
            };
            
            console.log('Prepared login data:', loginData);
            
            // Call AuthAPI (will handle backend vs mock automatically)
            const response = await AuthAPI.login(loginData);
            
            if (response.success) {
                // Show success message
                if (loginLoading) loginLoading.classList.add('hidden');
                if (successMessage) successMessage.classList.remove('hidden');
                
                // Update success message based on login source
                if (response.source === 'fallback') {
                    if (successMessage) {
                        successMessage.innerHTML = `
                            <div class="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <i class="fas fa-shield-alt text-orange-400"></i>
                                    </div>
                                    <div class="ml-3">
                                        <p class="text-sm text-orange-700">Fallback login successful! Redirecting...</p>
                                        <p class="text-xs text-orange-600 mt-1">Using offline authentication mode</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }
                
                // Wait a moment then proceed
                setTimeout(() => {
                    this.loginSuccess(response.user, response.access_token, response.source);
                }, 1500);
            } else {
                throw new Error(response.error || 'Login failed');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Hide loading and show error
            if (loginLoading) loginLoading.classList.add('hidden');
            if (errorMessage) errorMessage.classList.remove('hidden');
            if (errorText) errorText.textContent = error.message || 'Login failed';
            
            // Reset button
            if (loginBtn) loginBtn.disabled = false;
            if (loginButtonText) loginButtonText.textContent = 'Sign in';
        }
    },
    
    // Quick login function
    quickLogin: async function(username, password) {
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        
        // Fill in credentials
        usernameField.value = username;
        passwordField.value = password;
        
        // Trigger login
        await this.login(username, password);
    },
    
    // Use fallback login function
    useFallbackLogin: async function() {
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        
        // Fill in test credentials
        usernameField.value = 'wiki';
        passwordField.value = 'admin';
        
        // Show fallback mode indicator
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.innerHTML = `
                <div class="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <i class="fas fa-shield-alt text-orange-400"></i>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-orange-700">Using fallback authentication mode</p>
                        </div>
                    </div>
                </div>
            `;
            successMessage.classList.remove('hidden');
            
            // Hide after 3 seconds
            setTimeout(() => {
                successMessage.classList.add('hidden');
            }, 3000);
        }
        
        // Trigger login with fallback
        await this.login('wiki', 'admin');
    },
    
    // Get device info for API
    async getDeviceInfo() {
        const deviceInfo = {
            device_type: 'web',
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        // Try to get more device info if available
        if (window.DeviceManager) {
            try {
                const deviceData = await DeviceManager.getDeviceInfo();
                return { ...deviceInfo, ...deviceData };
            } catch (error) {
                console.log('DeviceManager not available, using basic info');
            }
        }
        
        return deviceInfo;
    },
    
    // Show error message
    showError: function(message) {
        // Try to use toast if available
        if (window.Toast && window.Toast.error) {
            Toast.error(message);
        } else {
            // Fallback to alert
            alert(message);
        }
    },
    
    // Show agent dashboard
    showAgentDashboard: function() {
        const mainContent = document.getElementById('mainContent');
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const userName = user ? user.first_name + ' ' + user.last_name : 'Agent';
        
        mainContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-green-600 mb-6">
                    <div class="bg-gray-50 px-4 py-3 border-b sm:px-6 sm:py-4">
                        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start lg:items-center gap-3">
                            <div class="min-w-0 flex-1">
                                <h2 class="text-xl sm:text-2xl font-bold text-green-600 truncate">Agent Dashboard</h2>
                                <p class="text-sm sm:text-base text-gray-600 line-clamp-2">Welcome back, <span class="font-semibold">${userName}</span> - Manage your surveys and view progress</p>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 sm:gap-3 sm:flex-nowrap">
                                <span class="px-2 py-1 bg-green-100 text-green-800 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap">
                                    <i class="fas fa-user mr-1"></i>Agent
                                </span>
                                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap">
                                    <i class="fas fa-circle mr-1"></i>Online
                                </span>
                                <button onclick="AppSimple.logout()" class="bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-red-700 whitespace-nowrap">
                                    <i class="fas fa-sign-out-alt mr-1 sm:mr-2"></i><span class="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div class="bg-white rounded-lg shadow border-t-4 border-green-600">
                        <div class="p-6">
                    
                    <div class="bg-white rounded-lg shadow border-t-4 border-blue-600">
                        <div class="p-6">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 bg-blue-100 rounded-full p-3">
                                    <i class="fas fa-mobile-alt text-blue-600 text-xl"></i>
                                </div>
                                <div class="ml-4">
                                    <h3 class="text-lg font-semibold text-gray-900">Device Status</h3>
                                    <p class="text-sm font-medium text-green-600">Online</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-blue-600 mb-6">
                    <div class="bg-gray-50 px-4 py-3 border-b sm:px-6 sm:py-4">
                        <h3 class="text-base sm:text-lg font-semibold text-gray-900">Quick Actions</h3>
                    </div>
                    <div class="p-4 sm:p-6">
                        <div class="grid grid-cols-1 gap-3 sm:gap-4">
                            <button onclick="AppSimple.showAuthenticatedPage('profile')" class="w-full bg-purple-600 text-white px-4 py-3 sm:px-6 sm:py-3 rounded-md hover:bg-purple-700 flex items-center justify-center text-sm sm:text-base">
                                <i class="fas fa-user mr-2 sm:mr-2"></i>
                                My Profile
                            </button>
                            <button onclick="AppSimple.showAuthenticatedPage('clan-management')" class="w-full bg-orange-600 text-white px-4 py-3 sm:px-6 sm:py-3 rounded-md hover:bg-orange-700 flex items-center justify-center text-sm sm:text-base">
                                <i class="fas fa-sitemap mr-2 sm:mr-2"></i>
                                Clan Management
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-red-600">
                    <div class="bg-gray-50 px-4 py-3 border-b sm:px-6 sm:py-4">
                        <h3 class="text-base sm:text-lg font-semibold text-gray-900">Recent Surveys</h3>
                    </div>
                    <div class="p-4 sm:p-6">
                        <div class="text-center py-6 sm:py-8 text-gray-500">
                            <i class="fas fa-file-alt text-3xl sm:text-4xl mb-2"></i>
                            <p class="text-sm sm:text-base">No surveys yet. Use Clan Management to create surveys for different hierarchy levels.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.updateNavigation('surveys');
    },
    
    // Show clan management page
    showClanManagement: function() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            console.error('Main content element not found');
            return;
        }
        
        // Check if ClanManagement is available
        if (!window.ClanManagement) {
            console.error('ClanManagement object not available');
            mainContent.innerHTML = `
                <div class="max-w-7xl mx-auto px-4 py-8">
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <strong>Error:</strong> Clan Management module not loaded. Please refresh the page.
                    </div>
                </div>
            `;
            return;
        }
        
        try {
            mainContent.innerHTML = ClanManagement.buildInterface();
            
            // Initialize clan management
            setTimeout(() => {
                ClanManagement.init();
                ClanManagement.loadClanData();
            }, 100);
            
            this.updateNavigation('clan-management');
        } catch (error) {
            console.error('Error in showClanManagement:', error);
            mainContent.innerHTML = `
                <div class="max-w-7xl mx-auto px-4 py-8">
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <strong>Error:</strong> Failed to load clan management. ${error.message}
                    </div>
                </div>
            `;
        }
    },
    
    // Show admin dashboard
    showAdminDashboard: function() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = AdminDashboard.buildDashboard();
        
        // Initialize charts after content is loaded
        setTimeout(() => {
            AdminDashboard.initializeCharts();
        }, 100);
        
        this.updateNavigation('dashboard');
    },
    
    // Show super admin dashboard
    showSuperAdminDashboard: function() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = SuperAdminDashboard.buildDashboard();
        
        // Initialize charts after content is loaded
        setTimeout(() => {
            SuperAdminDashboard.initializeCharts();
        }, 100);
        
        this.updateNavigation('dashboard');
    },
    
    // Show new survey form
    showNewSurvey: function() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow-lg border-t-4 border-red-600">
                    <div class="bg-gray-50 px-6 py-4 border-b">
                        <h2 class="text-2xl font-bold text-red-600">OBB Baseline Survey</h2>
                        <p class="text-gray-600">Complete the comprehensive kingdom baseline survey form</p>
                    </div>
                    
                    <div class="p-6">
                        <div id="surveyFormContainer">
                            <!-- Form will be built here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize and build the complete survey form
        setTimeout(() => {
            console.log('=== SHOW NEW SURVEY CALLED ===');
            console.log('CompleteSurveyForm available:', !!window.CompleteSurveyForm);
            
            if (window.CompleteSurveyForm) {
                CompleteSurveyForm.init();
                const formContainer = document.getElementById('surveyFormContainer');
                if (formContainer) {
                    formContainer.innerHTML = CompleteSurveyForm.buildForm();
                    console.log('Survey form built successfully');
                } else {
                    console.error('Survey form container not found');
                }
            } else {
                console.error('CompleteSurveyForm not available');
            }
        }, 100);
        
        this.updateNavigation('new-survey');
    },
    
    // Update navigation
    updateNavigation: function(page) {
        // Hide login nav items
        document.querySelectorAll('.nav-link[data-page="login"]').forEach(link => {
            link.style.display = 'none';
        });
        
        // Show other nav items
        document.querySelectorAll('.nav-link:not([data-page="login"])').forEach(link => {
            link.style.display = 'block';
        });
        
        // Update active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });
        
        // Show logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.onclick = () => this.logout();
        }
    },
    
    // Handle navigation
    handleNavigation: function(page) {
        if (page === 'login') {
            this.logout();
            return;
        }
        
        this.showAuthenticatedPage(page);
    },
    
    loginSuccess: function(userData, authToken, source = 'backend') {
        this.currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        if (authToken) {
            localStorage.setItem('authToken', authToken);
        }
        
        // Store login source for fallback mode tracking
        if (source === 'fallback') {
            localStorage.setItem('fallbackMode', 'true');
        }

        // Clear navigation history for new session
        this.navigationHistory = [];
        localStorage.removeItem('navigationHistory');

        // Hide login page and show main content
        this.hideLoginPage();

        // Show appropriate dashboard based on role
        this.showAuthenticatedPage('dashboard');
        
        // Show fallback mode notification if applicable
        if (source === 'fallback') {
            this.showToast('Using fallback authentication mode', 'warning');
        }
    },
    
    // Toggle mobile menu
    toggleMobileMenu: function() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    },
    
    // Logout
    logout: async function() {
        try {
            // Call logout API
            await AuthAPI.logout();
        } catch (error) {
            console.error('Logout API error:', error);
            // Continue with local logout even if API fails
        } finally {
            this.clearSession();
            this.showLoginPage();
        }
    },
};

// Global functions for HTML onclick handlers
window.quickLogin = function(username, password) {
    AppSimple.quickLogin(username, password);
};

window.testBackendConnection = function() {
    AppSimple.testBackendConnection();
};

window.useFallbackLogin = function() {
    AppSimple.useFallbackLogin();
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    AppSimple.init();
    
    // Update API URL display
    const apiUrlElement = document.getElementById('apiUrl');
    if (apiUrlElement) {
        apiUrlElement.textContent = API.baseURL;
    }
    
    // Auto-test connection on page load
    setTimeout(() => {
        AppSimple.testBackendConnection();
    }, 1000);
});
