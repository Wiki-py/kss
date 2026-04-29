// OBB Baseline Survey System - Database Module (IndexedDB)

window.Database = {
    db: null,
    
    // Initialize database
    init: async function() {
        try {
            AppUtils.log('Initializing IndexedDB...');
            
            // Check if Dexie is available
            if (typeof Dexie === 'undefined') {
                throw new Error('Dexie library not loaded');
            }
            
            // Create database instance
            this.db = new Dexie(AppConfig.DB_NAME);
            
            // Define schema
            this.db.version(AppConfig.DB_VERSION).stores({
                // Survey drafts
                drafts: '++id, title, description, location, gps_coordinates, submitted_at, synced, agent_id, created_at, updated_at',
                
                // Outbox for pending sync
                outbox: '++id, type, data, created_at, retry_count, last_retry, status',
                
                // Users (cached)
                users: '++id, username, email, role, is_active, cached_at',
                
                // Devices (cached)
                devices: '++id, device_id, device_name, device_type, agent_id, is_active, cached_at',
                
                // Surveys (cached)
                surveys: '++id, title, description, location, gps_coordinates, submitted_at, synced, agent_id, status, cached_at',
                
                // Settings
                settings: 'key, value, updated_at',
                
                // Sync logs
                syncLogs: '++id, type, status, message, created_at'
            });
            
            // Open database
            await this.db.open();
            
            AppUtils.log('IndexedDB initialized successfully');
            return this.db;
            
        } catch (error) {
            AppUtils.error('Failed to initialize IndexedDB:', error);
            throw error;
        }
    },
    
    // Save draft
    saveDraft: async function(surveyData) {
        try {
            if (!this.db) await this.init();
            
            const draft = {
                ...surveyData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                synced: false
            };
            
            const id = await this.db.drafts.put(draft);
            
            AppUtils.log('Draft saved:', { id, title: draft.title });
            return id;
            
        } catch (error) {
            AppUtils.error('Failed to save draft:', error);
            throw error;
        }
    },
    
    // Get draft by ID
    getDraft: async function(id) {
        try {
            if (!this.db) await this.init();
            
            const draft = await this.db.drafts.get(id);
            return draft;
            
        } catch (error) {
            AppUtils.error('Failed to get draft:', error);
            throw error;
        }
    },
    
    // Get all drafts
    getDrafts: async function(agentId = null) {
        try {
            if (!this.db) await this.init();
            
            let drafts;
            if (agentId) {
                drafts = await this.db.drafts.where('agent_id').equals(agentId).toArray();
            } else {
                drafts = await this.db.drafts.toArray();
            }
            
            return drafts.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            
        } catch (error) {
            AppUtils.error('Failed to get drafts:', error);
            throw error;
        }
    },
    
    // Update draft
    updateDraft: async function(id, updates) {
        try {
            if (!this.db) await this.init();
            
            const draft = await this.db.drafts.get(id);
            if (!draft) {
                throw new Error('Draft not found');
            }
            
            const updatedDraft = {
                ...draft,
                ...updates,
                updated_at: new Date().toISOString()
            };
            
            await this.db.drafts.put(updatedDraft);
            
            AppUtils.log('Draft updated:', { id, title: updatedDraft.title });
            return updatedDraft;
            
        } catch (error) {
            AppUtils.error('Failed to update draft:', error);
            throw error;
        }
    },
    
    // Delete draft
    deleteDraft: async function(id) {
        try {
            if (!this.db) await this.init();
            
            await this.db.drafts.delete(id);
            
            AppUtils.log('Draft deleted:', { id });
            return true;
            
        } catch (error) {
            AppUtils.error('Failed to delete draft:', error);
            throw error;
        }
    },
    
    // Move draft to outbox for sync
    moveToOutbox: async function(draftId, type = 'survey') {
        try {
            const draft = await this.getDraft(draftId);
            if (!draft) {
                throw new Error('Draft not found');
            }
            
            const outboxItem = {
                type: type,
                data: draft,
                created_at: new Date().toISOString(),
                retry_count: 0,
                status: SyncStatus.PENDING
            };
            
            const outboxId = await this.db.outbox.add(outboxItem);
            
            // Remove from drafts
            await this.deleteDraft(draftId);
            
            AppUtils.log('Draft moved to outbox:', { draftId, outboxId });
            return outboxId;
            
        } catch (error) {
            AppUtils.error('Failed to move draft to outbox:', error);
            throw error;
        }
    },
    
    // Get outbox items
    getOutbox: async function(type = null) {
        try {
            if (!this.db) await this.init();
            
            let items;
            if (type) {
                items = await this.db.outbox.where('type').equals(type).toArray();
            } else {
                items = await this.db.outbox.toArray();
            }
            
            return items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            
        } catch (error) {
            AppUtils.error('Failed to get outbox items:', error);
            throw error;
        }
    },
    
    // Update outbox item
    updateOutbox: async function(id, updates) {
        try {
            if (!this.db) await this.init();
            
            const item = await this.db.outbox.get(id);
            if (!item) {
                throw new Error('Outbox item not found');
            }
            
            const updatedItem = {
                ...item,
                ...updates
            };
            
            await this.db.outbox.put(updatedItem);
            
            AppUtils.log('Outbox item updated:', { id, status: updatedItem.status });
            return updatedItem;
            
        } catch (error) {
            AppUtils.error('Failed to update outbox item:', error);
            throw error;
        }
    },
    
    // Remove from outbox after successful sync
    removeFromOutbox: async function(id) {
        try {
            if (!this.db) await this.init();
            
            await this.db.outbox.delete(id);
            
            AppUtils.log('Item removed from outbox:', { id });
            return true;
            
        } catch (error) {
            AppUtils.error('Failed to remove from outbox:', error);
            throw error;
        }
    },
    
    // Cache user data
    cacheUser: async function(user) {
        try {
            if (!this.db) await this.init();
            
            const userToCache = {
                ...user,
                cached_at: new Date().toISOString()
            };
            
            await this.db.users.put(userToCache);
            
            AppUtils.log('User cached:', { id: user.id, username: user.username });
            return userToCache;
            
        } catch (error) {
            AppUtils.error('Failed to cache user:', error);
            throw error;
        }
    },
    
    // Get cached user
    getCachedUser: async function(userId) {
        try {
            if (!this.db) await this.init();
            
            const user = await this.db.users.get(userId);
            
            // Check if cache is stale (older than 1 hour)
            if (user) {
                const cacheAge = Date.now() - new Date(user.cached_at).getTime();
                if (cacheAge > 3600000) { // 1 hour
                    await this.db.users.delete(userId);
                    return null;
                }
            }
            
            return user;
            
        } catch (error) {
            AppUtils.error('Failed to get cached user:', error);
            return null;
        }
    },
    
    // Cache survey data
    cacheSurvey: async function(survey) {
        try {
            if (!this.db) await this.init();
            
            const surveyToCache = {
                ...survey,
                cached_at: new Date().toISOString()
            };
            
            await this.db.surveys.put(surveyToCache);
            
            AppUtils.log('Survey cached:', { id: survey.id, title: survey.title });
            return surveyToCache;
            
        } catch (error) {
            AppUtils.error('Failed to cache survey:', error);
            throw error;
        }
    },
    
    // Get cached surveys
    getCachedSurveys: async function(agentId = null, limit = 50) {
        try {
            if (!this.db) await this.init();
            
            let surveys;
            if (agentId) {
                surveys = await this.db.surveys.where('agent_id').equals(agentId).limit(limit).toArray();
            } else {
                surveys = await this.db.surveys.limit(limit).toArray();
            }
            
            return surveys.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
            
        } catch (error) {
            AppUtils.error('Failed to get cached surveys:', error);
            return [];
        }
    },
    
    // Save setting
    saveSetting: async function(key, value) {
        try {
            if (!this.db) await this.init();
            
            const setting = {
                key: key,
                value: value,
                updated_at: new Date().toISOString()
            };
            
            await this.db.settings.put(setting);
            
            AppUtils.log('Setting saved:', { key });
            return setting;
            
        } catch (error) {
            AppUtils.error('Failed to save setting:', error);
            throw error;
        }
    },
    
    // Get setting
    getSetting: async function(key) {
        try {
            if (!this.db) await this.init();
            
            const setting = await this.db.settings.get(key);
            return setting ? setting.value : null;
            
        } catch (error) {
            AppUtils.error('Failed to get setting:', error);
            return null;
        }
    },
    
    // Log sync activity
    logSync: async function(type, status, message = '') {
        try {
            if (!this.db) await this.init();
            
            const log = {
                type: type,
                status: status,
                message: message,
                created_at: new Date().toISOString()
            };
            
            await this.db.syncLogs.add(log);
            
            // Keep only last 1000 logs
            const allLogs = await this.db.syncLogs.orderBy('id').reverse().toArray();
            if (allLogs.length > 1000) {
                const logsToDelete = allLogs.slice(1000);
                for (const logToDelete of logsToDelete) {
                    await this.db.syncLogs.delete(logToDelete.id);
                }
            }
            
            return log;
            
        } catch (error) {
            AppUtils.error('Failed to log sync activity:', error);
        }
    },
    
    // Get sync logs
    getSyncLogs: async function(type = null, limit = 100) {
        try {
            if (!this.db) await this.init();
            
            let logs;
            if (type) {
                logs = await this.db.syncLogs.where('type').equals(type).reverse().limit(limit).toArray();
            } else {
                logs = await this.db.syncLogs.reverse().limit(limit).toArray();
            }
            
            return logs;
            
        } catch (error) {
            AppUtils.error('Failed to get sync logs:', error);
            return [];
        }
    },
    
    // Clear all data (for logout/reset)
    clear: async function() {
        try {
            if (!this.db) await this.init();
            
            await this.db.delete();
            this.db = null;
            
            AppUtils.log('Database cleared');
            return true;
            
        } catch (error) {
            AppUtils.error('Failed to clear database:', error);
            throw error;
        }
    },
    
    // Get database statistics
    getStats: async function() {
        try {
            if (!this.db) await this.init();
            
            const stats = {
                drafts: await this.db.drafts.count(),
                outbox: await this.db.outbox.count(),
                users: await this.db.users.count(),
                devices: await this.db.devices.count(),
                surveys: await this.db.surveys.count(),
                settings: await this.db.settings.count(),
                syncLogs: await this.db.syncLogs.count()
            };
            
            return stats;
            
        } catch (error) {
            AppUtils.error('Failed to get database stats:', error);
            return null;
        }
    },
    
    // Export data (for backup)
    export: async function() {
        try {
            if (!this.db) await this.init();
            
            const data = {
                drafts: await this.db.drafts.toArray(),
                outbox: await this.db.outbox.toArray(),
                users: await this.db.users.toArray(),
                devices: await this.db.devices.toArray(),
                surveys: await this.db.surveys.toArray(),
                settings: await this.db.settings.toArray(),
                exported_at: new Date().toISOString()
            };
            
            return data;
            
        } catch (error) {
            AppUtils.error('Failed to export database:', error);
            throw error;
        }
    },
    
    // Import data (for restore)
    import: async function(data) {
        try {
            if (!this.db) await this.init();
            
            // Clear existing data
            await this.clear();
            await this.init();
            
            // Import data
            if (data.drafts) {
                await this.db.drafts.bulkAdd(data.drafts);
            }
            
            if (data.outbox) {
                await this.db.outbox.bulkAdd(data.outbox);
            }
            
            if (data.users) {
                await this.db.users.bulkAdd(data.users);
            }
            
            if (data.devices) {
                await this.db.devices.bulkAdd(data.devices);
            }
            
            if (data.surveys) {
                await this.db.surveys.bulkAdd(data.surveys);
            }
            
            if (data.settings) {
                await this.db.settings.bulkAdd(data.settings);
            }
            
            AppUtils.log('Database imported successfully');
            return true;
            
        } catch (error) {
            AppUtils.error('Failed to import database:', error);
            throw error;
        }
    }
};
