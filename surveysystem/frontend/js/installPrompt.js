// OBB Baseline Survey System - PWA Install Prompt Module

window.InstallPrompt = {
    deferredPrompt: null,
    installPrompt: null,
    installBtn: null,
    dismissed: false,
    
    // Initialize install prompt
    init: function() {
        AppUtils.log('Initializing PWA install prompt...');
        
        // Check if already installed
        if (this.isInstalled()) {
            AppUtils.log('PWA already installed');
            return;
        }
        
        // Check if user has dismissed the prompt
        if (Storage.get('pwaInstallDismissed')) {
            this.dismissed = true;
            AppUtils.log('PWA install prompt dismissed by user');
            return;
        }
        
        // Setup install prompt listeners
        this.setupEventListeners();
        
        // Show custom install prompt after delay
        setTimeout(() => {
            this.showInstallPrompt();
        }, 5000);
        
        AppUtils.log('PWA install prompt initialized');
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            AppUtils.log('Native install prompt available');
            
            // Show custom install prompt if not dismissed
            if (!this.dismissed) {
                this.showInstallPrompt();
            }
        });
        
        // Listen for app installed event
        window.addEventListener('appinstalled', (e) => {
            AppUtils.log('PWA installed successfully');
            this.handleInstallSuccess();
        });
        
        // Setup install button click handler
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.addEventListener('click', () => this.handleInstallClick());
        }
        
        // Setup iOS detection
        if (this.isIOS()) {
            this.setupIOSPrompt();
        }
    },
    
    // Show install prompt
    showInstallPrompt: function() {
        if (this.isInstalled() || this.dismissed) {
            return;
        }
        
        // Create install prompt if it doesn't exist
        if (!this.installPrompt) {
            this.installPrompt = this.createInstallPrompt();
            document.body.appendChild(this.installPrompt);
        }
        
        // Show the prompt
        this.installPrompt.classList.remove('hidden');
        
        // Animate in
        setTimeout(() => {
            this.installPrompt.classList.add('translate-y-0');
            this.installPrompt.classList.remove('-translate-y-full');
        }, 100);
        
        AppUtils.log('Install prompt shown');
    },
    
    // Create install prompt element
    createInstallPrompt: function() {
        const prompt = document.createElement('div');
        prompt.id = 'installPrompt';
        prompt.className = 'fixed top-0 left-0 right-0 bg-yellow-500 text-black p-4 z-50 transform -translate-y-full transition-transform duration-300';
        
        prompt.innerHTML = `
            <div class="max-w-md mx-auto">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fas fa-download text-2xl mr-3"></i>
                        <div>
                            <h3 class="text-lg font-bold">Install OBB Survey App</h3>
                            <p class="text-sm">Get offline access and faster performance</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button id="installBtn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                            <i class="fas fa-plus mr-2"></i>Install
                        </button>
                        <button id="dismissBtn" class="text-black hover:text-gray-700 p-2">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Setup dismiss button
        const dismissBtn = prompt.querySelector('#dismissBtn');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.dismissInstallPrompt());
        }
        
        return prompt;
    },
    
    // Handle install button click
    handleInstallClick: async function() {
        if (!this.deferredPrompt) {
            // No native prompt available, show manual instructions
            this.showManualInstallInstructions();
            return;
        }
        
        try {
            // Show native install prompt
            this.deferredPrompt.prompt();
            
            // Wait for user response
            const { outcome } = await this.deferredPrompt.userChoice;
            
            AppUtils.log(`Install prompt outcome: ${outcome}`);
            
            if (outcome === 'accepted') {
                AppUtils.log('User accepted install prompt');
            } else {
                AppUtils.log('User dismissed install prompt');
                this.dismissInstallPrompt();
            }
            
            // Clear the deferred prompt
            this.deferredPrompt = null;
            
        } catch (error) {
            AppUtils.error('Install prompt failed:', error);
            this.showManualInstallInstructions();
        }
    },
    
    // Show manual install instructions
    showManualInstallInstructions: function() {
        const instructions = this.isIOS() ? 
            this.getIOSInstallInstructions() : 
            this.getAndroidInstallInstructions();
        
        // Create modal with instructions
        const modal = this.createInstallModal(instructions);
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.classList.remove('hidden');
        }, 100);
        
        AppUtils.log('Manual install instructions shown');
    },
    
    // Create install modal
    createInstallModal: function(instructions) {
        const modal = document.createElement('div');
        modal.className = 'hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        
        modal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-gray-900">Install OBB Survey App</h3>
                        <button id="closeModalBtn" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="mt-2 px-7 py-3">
                        <div class="space-y-3">
                            ${instructions}
                        </div>
                    </div>
                    <div class="items-center px-4 py-3">
                        <button id="closeModalBtn2" class="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Setup close buttons
        const closeBtn1 = modal.querySelector('#closeModalBtn');
        const closeBtn2 = modal.querySelector('#closeModalBtn2');
        
        if (closeBtn1) {
            closeBtn1.addEventListener('click', () => this.closeInstallModal(modal));
        }
        
        if (closeBtn2) {
            closeBtn2.addEventListener('click', () => this.closeInstallModal(modal));
        }
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeInstallModal(modal);
            }
        });
        
        return modal;
    },
    
    // Get iOS install instructions
    getIOSInstallInstructions: function() {
        return `
            <div class="text-center">
                <i class="fas fa-mobile-alt text-4xl text-red-600 mb-4"></i>
                <h4 class="font-semibold mb-2">Install on iOS</h4>
                <ol class="text-left text-sm space-y-2">
                    <li>1. Tap the <i class="fas fa-share-square"></i> Share button</li>
                    <li>2. Scroll down and tap "Add to Home Screen"</li>
                    <li>3. Tap "Add" to install the app</li>
                </ol>
            </div>
        `;
    },
    
    // Get Android install instructions
    getAndroidInstallInstructions: function() {
        return `
            <div class="text-center">
                <i class="fas fa-android text-4xl text-green-600 mb-4"></i>
                <h4 class="font-semibold mb-2">Install on Android</h4>
                <ol class="text-left text-sm space-y-2">
                    <li>1. Tap the <i class="fas fa-ellipsis-v"></i> menu button</li>
                    <li>2. Tap "Add to Home screen" or "Install app"</li>
                    <li>3. Tap "Add" or "Install" to confirm</li>
                </ol>
            </div>
        `;
    },
    
    // Close install modal
    closeInstallModal: function(modal) {
        modal.classList.add('hidden');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    },
    
    // Dismiss install prompt
    dismissInstallPrompt: function() {
        if (this.installPrompt) {
            // Animate out
            this.installPrompt.classList.add('-translate-y-full');
            this.installPrompt.classList.remove('translate-y-0');
            
            setTimeout(() => {
                this.installPrompt.classList.add('hidden');
            }, 300);
        }
        
        // Mark as dismissed
        this.dismissed = true;
        Storage.set('pwaInstallDismissed', true);
        
        AppUtils.log('Install prompt dismissed');
    },
    
    // Handle successful installation
    handleInstallSuccess: function() {
        // Hide install prompt
        if (this.installPrompt) {
            this.installPrompt.classList.add('hidden');
        }
        
        // Mark as installed
        Storage.set('pwaInstalled', true);
        
        // Show success message
        Toast.success(SuccessMessages.PWA_INSTALLED);
        
        AppUtils.log('PWA installation successful');
    },
    
    // Check if PWA is installed
    isInstalled: function() {
        return Storage.get('pwaInstalled', false);
    },
    
    // Check if running on iOS
    isIOS: function() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    },
    
    // Check if running on Android
    isAndroid: function() {
        return /Android/.test(navigator.userAgent);
    },
    
    // Check if running in standalone mode
    isStandalone: function() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               ('standalone' in window.navigator && window.navigator.standalone);
    },
    
    // Setup iOS-specific prompt
    setupIOSPrompt: function() {
        // Show iOS-specific banner after delay
        setTimeout(() => {
            if (!this.isInstalled() && !this.dismissed) {
                this.showIOSBanner();
            }
        }, 10000);
    },
    
    // Show iOS banner
    showIOSBanner: function() {
        const banner = document.createElement('div');
        banner.className = 'fixed bottom-4 left-4 right-4 bg-yellow-500 text-black p-4 rounded-lg shadow-lg z-50';
        
        banner.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-mobile-alt text-xl mr-3"></i>
                    <div>
                        <h4 class="font-semibold">Install OBB Survey</h4>
                        <p class="text-sm">Add to Home Screen for offline access</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="iosInstallBtn" class="bg-red-600 text-white px-3 py-1 rounded text-sm">
                        Install
                    </button>
                    <button id="iosDismissBtn" class="text-black p-1">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Setup buttons
        const installBtn = banner.querySelector('#iosInstallBtn');
        const dismissBtn = banner.querySelector('#iosDismissBtn');
        
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                this.showManualInstallInstructions();
                banner.remove();
            });
        }
        
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                banner.remove();
                this.dismissInstallPrompt();
            });
        }
        
        // Auto-hide after 30 seconds
        setTimeout(() => {
            if (banner.parentNode) {
                banner.remove();
            }
        }, 30000);
        
        AppUtils.log('iOS install banner shown');
    },
    
    // Check if browser supports PWA installation
    supportsInstallation: function() {
        return 'beforeinstallprompt' in window || this.isIOS() || this.isAndroid();
    },
    
    // Get install status
    getInstallStatus: function() {
        return {
            installed: this.isInstalled(),
            standalone: this.isStandalone(),
            supportsInstallation: this.supportsInstallation(),
            dismissed: this.dismissed,
            platform: this.getPlatform(),
            deferredPromptAvailable: !!this.deferredPrompt
        };
    },
    
    // Get platform information
    getPlatform: function() {
        if (this.isIOS()) {
            return 'ios';
        } else if (this.isAndroid()) {
            return 'android';
        } else {
            return 'desktop';
        }
    },
    
    // Force show install prompt (for testing)
    forceShowPrompt: function() {
        this.dismissed = false;
        Storage.remove('pwaInstallDismissed');
        this.showInstallPrompt();
    },
    
    // Reset install state (for testing)
    reset: function() {
        this.dismissed = false;
        this.deferredPrompt = null;
        
        if (this.installPrompt) {
            this.installPrompt.remove();
            this.installPrompt = null;
        }
        
        Storage.remove('pwaInstallDismissed');
        Storage.remove('pwaInstalled');
        
        AppUtils.log('Install prompt state reset');
    }
};
