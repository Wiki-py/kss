// OBB Baseline Survey System - Offline Manager

window.OfflineManager = {
    // Configuration
    config: {
        storagePrefix: 'kss_offline_',
        syncQueueKey: 'kss_sync_queue',
        maxRetries: 3,
        retryDelay: 5000, // 5 seconds
        networkCheckInterval: 30000 // 30 seconds
    },

    // State
    isOnline: navigator.onLine,
    syncInProgress: false,
    syncQueue: [],
    retryCount: {},

    // Initialize offline manager
    initialize: function() {
        console.log('OfflineManager: Initializing...');
        
        // Check if service worker is supported
        if ('serviceWorker' in navigator) {
            this.setupServiceWorker();
        }
        
        // Setup network status monitoring
        this.setupNetworkMonitoring();
        
        // Load sync queue from localStorage
        this.loadSyncQueue();
        
        // Skip sync during login - only sync when explicitly requested
        // This prevents sync delays during login process
        console.log('OfflineManager: Initialized. Sync disabled during login. Online status:', this.isOnline);
    },

    // Set up network event listeners
    setupNetworkListeners: function() {
        window.addEventListener('online', () => {
            console.log('OfflineManager: Network connection restored');
            this.isOnline = true;
            this.updateConnectionStatus();
            // Skip auto-sync during login to prevent delays
            console.log('OfflineManager: Auto-sync disabled during login');
        });

        window.addEventListener('offline', () => {
            console.log('OfflineManager: Network connection lost');
            this.isOnline = false;
            this.updateConnectionStatus();
        });
    },

    // Set up periodic network check
    setupNetworkMonitoring: function() {
        // Check network status periodically
        setInterval(() => {
            const wasOnline = this.isOnline;
            this.isOnline = navigator.onLine;
            
            if (wasOnline !== this.isOnline) {
                this.updateConnectionStatus();
                
                if (this.isOnline) {
                    // Skip auto-sync during login to prevent delays
                    console.log('OfflineManager: Network status changed to online, auto-sync disabled');
                }
            }
        }, this.config.networkCheckInterval);
    },

    // Update connection status in UI
    updateConnectionStatus: function() {
        const statusElement = document.getElementById('connectionStatus');
        const offlineIndicator = document.getElementById('offlineIndicator');
        
        if (this.isOnline) {
            if (statusElement) {
                statusElement.textContent = 'Online';
                statusElement.className = 'status-online';
            }
            if (offlineIndicator) {
                offlineIndicator.style.display = 'none';
            }
            document.body.classList.remove('offline-mode');
        } else {
            if (statusElement) {
                statusElement.textContent = 'Offline';
                statusElement.className = 'status-offline';
            }
            if (offlineIndicator) {
                offlineIndicator.style.display = 'block';
            }
            document.body.classList.add('offline-mode');
        }
    },

    // Check if should show app install prompt
    checkAppInstallPrompt: function() {
        // Check if user is on mobile and hasn't dismissed the prompt
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const promptDismissed = localStorage.getItem('appInstallPromptDismissed');
        
        if (isMobile && !promptDismissed && !this.isInstalled()) {
            this.showInstallPrompt();
        }
    },

    // Check if app is installed (PWA)
    isInstalled: function() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    },

    // Show app install prompt
    showInstallPrompt: function() {
        const promptHtml = `
            <div id="appInstallPrompt" class="app-install-prompt">
                <div class="prompt-content">
                    <h3>📱 Install Our App</h3>
                    <p>Get the best experience with our offline-capable app. Work anywhere, sync when connected!</p>
                    <div class="prompt-actions">
                        <button id="installAppBtn" class="btn btn-primary">Install App</button>
                        <button id="dismissPromptBtn" class="btn btn-secondary">Not Now</button>
                    </div>
                </div>
            </div>
        `;

        // Add prompt to page
        document.body.insertAdjacentHTML('beforeend', promptHtml);

        // Add event listeners
        document.getElementById('installAppBtn').addEventListener('click', () => {
            this.handleInstallClick();
        });

        document.getElementById('dismissPromptBtn').addEventListener('click', () => {
            this.dismissInstallPrompt();
        });
    },

    // Handle install button click
    handleInstallClick: function() {
        // Check if beforeinstallprompt event is available
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('OfflineManager: User accepted install prompt');
                } else {
                    console.log('OfflineManager: User dismissed install prompt');
                }
                window.deferredPrompt = null;
                this.dismissInstallPrompt();
            });
        } else {
            // Fallback: show instructions for manual install
            this.showInstallInstructions();
        }
    },

    // Show install instructions
    showInstallInstructions: function() {
        const instructionsHtml = `
            <div id="installInstructions" class="install-instructions">
                <div class="instructions-content">
                    <h3>📱 How to Install</h3>
                    <div class="instruction-steps">
                        <p><strong>Android:</strong> Tap menu → "Add to Home screen"</p>
                        <p><strong>iPhone/iPad:</strong> Tap Share → "Add to Home screen"</p>
                    </div>
                    <button id="closeInstructionsBtn" class="btn btn-primary">Got it</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', instructionsHtml);
        document.getElementById('closeInstructionsBtn').addEventListener('click', () => {
            document.getElementById('installInstructions').remove();
            this.dismissInstallPrompt();
        });
    },

    // Dismiss install prompt
    dismissInstallPrompt: function() {
        const prompt = document.getElementById('appInstallPrompt');
        if (prompt) {
            prompt.remove();
        }
        localStorage.setItem('appInstallPromptDismissed', 'true');
    },

    // Load sync queue from localStorage
    loadSyncQueue: function() {
        const queueData = localStorage.getItem(this.config.syncQueueKey);
        this.syncQueue = queueData ? JSON.parse(queueData) : [];
        console.log('OfflineManager: Loaded sync queue with', this.syncQueue.length, 'items');
    },

    // Queue item for sync
    queueForSync: function(type, endpoint, data) {
        const queueItem = {
            id: Date.now().toString(),
            type: type,
            endpoint: endpoint,
            data: data,
            timestamp: new Date().toISOString(),
            retries: 0
        };
        
        this.syncQueue.push(queueItem);
        this.saveSyncQueue();
        
        console.log('OfflineManager: Added to sync queue:', queueItem);
        
        // Skip immediate sync during login to prevent delays
        console.log('OfflineManager: Immediate sync disabled during login');
    },

    // Sync pending data when online (disabled during login)
    syncPendingData: async function() {
        // Always return early to skip sync during login
        console.log('OfflineManager: Sync disabled during login - skipping sync process');
        return;
    },

    // Sync individual item
    syncItem: async function(item) {
        console.log('OfflineManager: Syncing item:', item.type, item.id);

        switch (item.type) {
            case 'survey_data':
                return await API.post(item.endpoint, item.data);
            case 'clan_data':
                return await API.post(item.endpoint, item.data);
            case 'user_data':
                return await API.post(item.endpoint, item.data);
            default:
                throw new Error('Unknown sync item type: ' + item.type);
        }
    },

    // Update sync status in UI
    updateSyncStatus: function(status) {
        const syncStatusElement = document.getElementById('syncStatus');
        if (syncStatusElement) {
            syncStatusElement.textContent = status;
            syncStatusElement.className = status ? 'sync-active' : '';
        }
    },

    // Get offline data
    getOfflineData: function(key) {
        const data = localStorage.getItem(this.config.storagePrefix + key);
        return data ? JSON.parse(data) : null;
    },

    // Set offline data
    setOfflineData: function(key, data) {
        localStorage.setItem(this.config.storagePrefix + key, JSON.stringify(data));
    },

    // Remove offline data
    removeOfflineData: function(key) {
        localStorage.removeItem(this.config.storagePrefix + key);
    },

    // Clear all offline data
    clearOfflineData: function() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.config.storagePrefix)) {
                localStorage.removeItem(key);
            }
        });
        this.syncQueue = [];
        this.saveSyncQueue();
        console.log('OfflineManager: Cleared all offline data');
    },

    // Helper function for delays
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Get sync queue status
    getSyncStatus: function() {
        return {
            isOnline: this.isOnline,
            queueLength: this.syncQueue.length,
            syncInProgress: this.syncInProgress,
            pendingItems: this.syncQueue
        };
    }
};
