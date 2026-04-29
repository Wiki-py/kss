// OBB Baseline Survey System - Sync Module

window.Sync = {
    isOnline: navigator.onLine,
    syncInProgress: false,
    retryTimers: new Map(),
    
    // Initialize sync module
    init: function() {
        AppUtils.log('Initializing sync module...');
        
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Update online status
        this.updateOnlineStatus();
        
        // Setup periodic sync
        this.setupPeriodicSync();
        
        AppUtils.log('Sync module initialized');
    },
    
    // Handle online event
    handleOnline: function() {
        this.isOnline = true;
        this.updateOnlineStatus();
        
        AppUtils.log('Network connection restored');
        Toast.info('Network connection restored');
        
        // Trigger sync when coming back online
        setTimeout(() => {
            this.syncAll();
        }, 1000);
    },
    
    // Handle offline event
    handleOffline: function() {
        this.isOnline = false;
        this.updateOnlineStatus();
        
        AppUtils.log('Network connection lost');
        Toast.warning('Network connection lost. Working in offline mode.');
    },
    
    // Update online status indicator
    updateOnlineStatus: function() {
        const offlineIndicator = document.getElementById('offlineIndicator');
        const syncStatus = document.getElementById('syncStatus');
        
        if (this.isOnline) {
            if (offlineIndicator) {
                offlineIndicator.classList.add('hidden');
            }
            if (syncStatus && !this.syncInProgress) {
                syncStatus.classList.add('hidden');
            }
        } else {
            if (offlineIndicator) {
                offlineIndicator.classList.remove('hidden');
            }
        }
    },
    
    // Setup periodic sync
    setupPeriodicSync: function() {
        // Sync every 5 minutes when online
        setInterval(() => {
            if (this.isOnline && !this.syncInProgress) {
                this.syncAll();
            }
        }, 5 * 60 * 1000);
    },
    
    // Sync all pending items
    syncAll: async function() {
        if (!this.isOnline) {
            AppUtils.log('Cannot sync while offline');
            return;
        }
        
        if (this.syncInProgress) {
            AppUtils.log('Sync already in progress');
            return;
        }
        
        try {
            this.syncInProgress = true;
            this.updateSyncStatus();
            
            AppUtils.log('Starting sync process...');
            
            // Get all pending items from outbox
            const pendingItems = await Database.getOutbox();
            
            if (pendingItems.length === 0) {
                AppUtils.log('No pending items to sync');
                return;
            }
            
            AppUtils.log(`Syncing ${pendingItems.length} pending items`);
            
            // Process items in batches
            const batches = this.createBatches(pendingItems, AppConfig.SYNC_BATCH_SIZE);
            let successCount = 0;
            let failureCount = 0;
            
            for (const batch of batches) {
                const batchResults = await this.syncBatch(batch);
                
                batchResults.forEach(result => {
                    if (result.success) {
                        successCount++;
                    } else {
                        failureCount++;
                    }
                });
                
                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Log sync results
            await Database.logSync('sync_all', 'completed', 
                `Sync completed: ${successCount} success, ${failureCount} failures`);
            
            // Show notification
            if (successCount > 0) {
                Toast.success(`${successCount} items synced successfully`);
            }
            
            if (failureCount > 0) {
                Toast.warning(`${failureCount} items failed to sync`);
            }
            
            AppUtils.log(`Sync completed: ${successCount} success, ${failureCount} failures`);
            
        } catch (error) {
            AppUtils.error('Sync failed:', error);
            await Database.logSync('sync_all', 'failed', error.message);
            Toast.error('Sync failed. Please try again.');
        } finally {
            this.syncInProgress = false;
            this.updateSyncStatus();
        }
    },
    
    // Sync a batch of items
    syncBatch: async function(batch) {
        const results = [];
        
        for (const item of batch) {
            try {
                const result = await this.syncItem(item);
                results.push(result);
                
                if (result.success) {
                    // Remove from outbox
                    await Database.removeFromOutbox(item.id);
                } else {
                    // Update retry count
                    await this.updateRetryCount(item);
                }
                
            } catch (error) {
                AppUtils.error(`Failed to sync item ${item.id}:`, error);
                results.push({
                    id: item.id,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    },
    
    // Sync individual item
    syncItem: async function(item) {
        try {
            AppUtils.log(`Syncing item ${item.id} of type ${item.type}`);
            
            let response;
            
            if (AppConfig.MOCK_MODE) {
                // Mock sync
                await new Promise(resolve => setTimeout(resolve, 1000));
                response = { success: true };
            } else {
                // Real API sync
                const endpoint = this.getSyncEndpoint(item.type);
                response = await fetch(AppUtils.getApiUrl(endpoint), {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${Auth.getAuthToken()}`,
                        'X-Device-ID': DeviceManager.getId(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(item.data)
                });
                
                if (!response.ok) {
                    throw new Error(`Sync failed: ${response.statusText}`);
                }
                
                response = await response.json();
            }
            
            // Log successful sync
            await Database.logSync('sync_item', 'success', 
                `Item ${item.id} synced successfully`);
            
            return {
                id: item.id,
                success: true,
                response: response
            };
            
        } catch (error) {
            // Log failed sync
            await Database.logSync('sync_item', 'failed', 
                `Item ${item.id} sync failed: ${error.message}`);
            
            return {
                id: item.id,
                success: false,
                error: error.message
            };
        }
    },
    
    // Get sync endpoint for item type
    getSyncEndpoint: function(type) {
        const endpoints = {
            'survey': '/surveys/sync-offline/',
            'user': '/users/sync-offline/',
            'device': '/devices/sync-offline/',
            'setting': '/settings/sync-offline/'
        };
        
        return endpoints[type] || '/sync-offline/';
    },
    
    // Create batches from items
    createBatches: function(items, batchSize) {
        const batches = [];
        
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        
        return batches;
    },
    
    // Update retry count for failed item
    updateRetryCount: async function(item) {
        const retryCount = (item.retry_count || 0) + 1;
        
        if (retryCount >= AppConfig.SYNC_RETRY_ATTEMPTS) {
            // Max retries reached, mark as failed
            await Database.updateOutbox(item.id, {
                retry_count: retryCount,
                status: SyncStatus.FAILED,
                last_retry: new Date().toISOString()
            });
            
            AppUtils.log(`Item ${item.id} marked as failed after ${retryCount} retries`);
        } else {
            // Update retry count and schedule retry
            await Database.updateOutbox(item.id, {
                retry_count: retryCount,
                status: SyncStatus.PENDING,
                last_retry: new Date().toISOString()
            });
            
            // Schedule retry
            this.scheduleRetry(item, retryCount);
        }
    },
    
    // Schedule retry for failed item
    scheduleRetry: function(item, retryCount) {
        const delay = AppConfig.SYNC_RETRY_DELAY * Math.pow(2, retryCount - 1); // Exponential backoff
        
        const timerId = setTimeout(async () => {
            if (this.isOnline && !this.syncInProgress) {
                AppUtils.log(`Retrying item ${item.id} (attempt ${retryCount + 1})`);
                
                const result = await this.syncItem(item);
                if (result.success) {
                    await Database.removeFromOutbox(item.id);
                    this.retryTimers.delete(item.id);
                } else {
                    await this.updateRetryCount(item);
                }
            }
        }, delay);
        
        this.retryTimers.set(item.id, timerId);
    },
    
    // Add item to outbox
    addToOutbox: async function(type, data) {
        try {
            const outboxItem = {
                type: type,
                data: data,
                created_at: new Date().toISOString(),
                retry_count: 0,
                status: SyncStatus.PENDING
            };
            
            const id = await Database.outbox.add(outboxItem);
            
            AppUtils.log(`Item added to outbox: ${id} (${type})`);
            
            // Try to sync immediately if online
            if (this.isOnline && !this.syncInProgress) {
                setTimeout(() => this.syncAll(), 1000);
            }
            
            return id;
            
        } catch (error) {
            AppUtils.error('Failed to add item to outbox:', error);
            throw error;
        }
    },
    
    // Force sync specific item
    syncItemById: async function(id) {
        try {
            const item = await Database.outbox.get(id);
            if (!item) {
                throw new Error('Item not found in outbox');
            }
            
            const result = await this.syncItem(item);
            
            if (result.success) {
                await Database.removeFromOutbox(id);
                Toast.success('Item synced successfully');
            } else {
                await this.updateRetryCount(item);
                Toast.error('Sync failed. Will retry automatically.');
            }
            
            return result;
            
        } catch (error) {
            AppUtils.error('Failed to sync item:', error);
            Toast.error('Sync failed. Please try again.');
            throw error;
        }
    },
    
    // Get sync status
    getSyncStatus: async function() {
        try {
            const outboxItems = await Database.getOutbox();
            const pendingItems = outboxItems.filter(item => item.status === SyncStatus.PENDING);
            const failedItems = outboxItems.filter(item => item.status === SyncStatus.FAILED);
            
            return {
                online: this.isOnline,
                inProgress: this.syncInProgress,
                pendingCount: pendingItems.length,
                failedCount: failedItems.length,
                totalCount: outboxItems.length,
                lastSync: await this.getLastSyncTime()
            };
            
        } catch (error) {
            AppUtils.error('Failed to get sync status:', error);
            return {
                online: this.isOnline,
                inProgress: this.syncInProgress,
                pendingCount: 0,
                failedCount: 0,
                totalCount: 0,
                lastSync: null
            };
        }
    },
    
    // Get last sync time
    getLastSyncTime: async function() {
        try {
            const logs = await Database.getSyncLogs('sync_all', 1);
            return logs.length > 0 ? logs[0].created_at : null;
        } catch (error) {
            return null;
        }
    },
    
    // Update sync status indicator
    updateSyncStatus: function() {
        const syncStatus = document.getElementById('syncStatus');
        
        if (this.syncInProgress) {
            if (syncStatus) {
                syncStatus.classList.remove('hidden');
                syncStatus.innerHTML = `
                    <i class="fas fa-sync fa-spin mr-2"></i>
                    <span>Syncing data...</span>
                `;
            }
        } else {
            if (syncStatus) {
                syncStatus.classList.add('hidden');
            }
        }
    },
    
    // Cancel all retries
    cancelAllRetries: function() {
        for (const [id, timerId] of this.retryTimers) {
            clearTimeout(timerId);
        }
        this.retryTimers.clear();
        
        AppUtils.log('All sync retries cancelled');
    },
    
    // Reset sync state
    reset: function() {
        this.cancelAllRetries();
        this.syncInProgress = false;
        this.updateSyncStatus();
    },
    
    // Get sync statistics
    getStats: async function() {
        try {
            const status = await this.getSyncStatus();
            const logs = await Database.getSyncLogs(null, 100);
            
            const recentLogs = logs.filter(log => {
                const logTime = new Date(log.created_at);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return logTime > dayAgo;
            });
            
            const successCount = recentLogs.filter(log => log.status === 'completed').length;
            const failureCount = recentLogs.filter(log => log.status === 'failed').length;
            
            return {
                ...status,
                recentSuccesses: successCount,
                recentFailures: failureCount,
                successRate: recentLogs.length > 0 ? (successCount / recentLogs.length) * 100 : 0
            };
            
        } catch (error) {
            AppUtils.error('Failed to get sync stats:', error);
            return null;
        }
    },
    
    // Manual sync trigger
    manualSync: async function() {
        if (!this.isOnline) {
            Toast.warning('Cannot sync while offline. Please check your internet connection.');
            return;
        }
        
        if (this.syncInProgress) {
            Toast.warning('Sync already in progress. Please wait...');
            return;
        }
        
        await this.syncAll();
    },
    
    // Clear failed items
    clearFailedItems: async function() {
        try {
            const failedItems = await Database.outbox.where('status').equals(SyncStatus.FAILED).toArray();
            
            for (const item of failedItems) {
                await Database.removeFromOutbox(item.id);
            }
            
            AppUtils.log(`Cleared ${failedItems.length} failed sync items`);
            Toast.info(`Cleared ${failedItems.length} failed items`);
            
            return failedItems.length;
            
        } catch (error) {
            AppUtils.error('Failed to clear failed items:', error);
            Toast.error('Failed to clear failed items');
            throw error;
        }
    },
    
    // Retry failed items
    retryFailedItems: async function() {
        try {
            const failedItems = await Database.outbox.where('status').equals(SyncStatus.FAILED).toArray();
            
            for (const item of failedItems) {
                await Database.updateOutbox(item.id, {
                    status: SyncStatus.PENDING,
                    retry_count: 0,
                    last_retry: new Date().toISOString()
                });
            }
            
            AppUtils.log(`Reset ${failedItems.length} failed items to pending`);
            Toast.info(`Reset ${failedItems.length} failed items to pending`);
            
            // Trigger sync
            setTimeout(() => this.syncAll(), 1000);
            
            return failedItems.length;
            
        } catch (error) {
            AppUtils.error('Failed to retry failed items:', error);
            Toast.error('Failed to retry failed items');
            throw error;
        }
    }
};
