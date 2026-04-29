// OBB Baseline Survey System - Service Worker

const CACHE_NAME = 'obb-survey-v1';
const API_CACHE_NAME = 'obb-api-v1';

// Files to cache for offline access
const STATIC_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/css/offline.css',
    '/js/config.js',
    '/js/utils.js',
    '/js/device.js',
    '/js/db.js',
    '/js/auth.js',
    '/js/sync.js',
    '/js/installPrompt.js',
    '/js/app.js',
    '/js/api.js',
    '/js/offlineManager.js',
    '/js/app-simple.js',
    '/js/completeSurveyForm.js',
    '/js/dataAnalysis.js',
    '/js/clanAPI.js',
    '/js/clanManagement.js',
    '/js/adminDashboard.js',
    '/js/superAdminDashboard.js',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js',
    'https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_CACHE);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('Service Worker: Activation failed:', error);
            })
    );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // Handle static file requests
    event.respondWith(handleStaticRequest(request));
});

// Handle API requests (network-first with cache fallback)
async function handleApiRequest(request) {
    try {
        // Try network first
        const response = await fetch(request);
        
        // Cache successful responses
        if (response.ok) {
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
        
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache');
        
        // Try cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline fallback
        return new Response(
            JSON.stringify({
                error: 'Network unavailable',
                message: 'Please check your internet connection and try again',
                offline: true
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}

// Handle static file requests (cache-first with network fallback)
async function handleStaticRequest(request) {
    // Try cache first
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Try network
    try {
        const response = await fetch(request);
        
        // Cache successful responses
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
        
    } catch (error) {
        console.log('Service Worker: Network failed for static request');
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
        
        // Return error for other requests
        return new Response('Resource not available offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Background sync
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered');
    
    if (event.tag === 'sync-surveys') {
        event.waitUntil(syncPendingSurveys());
    }
    
    if (event.tag === 'sync-all') {
        event.waitUntil(syncAllData());
    }
});

// Sync pending surveys
async function syncPendingSurveys() {
    try {
        // Get pending surveys from IndexedDB
        const pendingSurveys = await getPendingSurveys();
        
        if (pendingSurveys.length === 0) {
            console.log('Service Worker: No pending surveys to sync');
            return;
        }
        
        console.log(`Service Worker: Syncing ${pendingSurveys.length} surveys`);
        
        // Sync each survey
        const syncPromises = pendingSurveys.map(async (survey) => {
            try {
                const response = await fetch('/api/surveys/sync-offline/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${survey.token}`,
                        'X-Device-ID': survey.deviceId
                    },
                    body: JSON.stringify(survey.data)
                });
                
                if (response.ok) {
                    // Remove from pending list
                    await removePendingSurvey(survey.id);
                    console.log('Service Worker: Survey synced successfully');
                    return { success: true, survey };
                } else {
                    throw new Error('Sync failed');
                }
                
            } catch (error) {
                console.error('Service Worker: Survey sync failed:', error);
                return { success: false, survey, error };
            }
        });
        
        const results = await Promise.allSettled(syncPromises);
        
        // Notify client about sync results
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                results: results.map(r => r.value)
            });
        });
        
    } catch (error) {
        console.error('Service Worker: Background sync failed:', error);
    }
}

// Sync all data
async function syncAllData() {
    try {
        // Get all pending data from IndexedDB
        const pendingData = await getPendingData();
        
        if (pendingData.length === 0) {
            console.log('Service Worker: No pending data to sync');
            return;
        }
        
        console.log(`Service Worker: Syncing ${pendingData.length} items`);
        
        // Group by type
        const groupedData = pendingData.reduce((groups, item) => {
            if (!groups[item.type]) {
                groups[item.type] = [];
            }
            groups[item.type].push(item);
            return groups;
        }, {});
        
        // Sync each type
        const syncPromises = Object.entries(groupedData).map(async ([type, items]) => {
            try {
                const response = await fetch(`/api/${type}/sync-offline/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(items)
                });
                
                if (response.ok) {
                    // Remove synced items
                    await removePendingData(items.map(item => item.id));
                    console.log(`Service Worker: ${type} data synced successfully`);
                    return { success: true, type, count: items.length };
                } else {
                    throw new Error(`Sync failed for ${type}`);
                }
                
            } catch (error) {
                console.error(`Service Worker: ${type} sync failed:`, error);
                return { success: false, type, error };
            }
        });
        
        const results = await Promise.allSettled(syncPromises);
        
        // Notify client about sync results
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                results: results.map(r => r.value)
            });
        });
        
    } catch (error) {
        console.error('Service Worker: Background sync failed:', error);
    }
}

// Helper functions for IndexedDB access
async function getPendingSurveys() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('OBB_Survey_DB');
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['outbox'], 'readonly');
            const store = transaction.objectStore('outbox');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                const surveys = getAllRequest.result.filter(item => item.type === 'survey');
                resolve(surveys);
            };
            
            getAllRequest.onerror = () => {
                reject(getAllRequest.error);
            };
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

async function getPendingData() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('OBB_Survey_DB');
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['outbox'], 'readonly');
            const store = transaction.objectStore('outbox');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                resolve(getAllRequest.result);
            };
            
            getAllRequest.onerror = () => {
                reject(getAllRequest.error);
            };
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

async function removePendingSurvey(id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('OBB_Survey_DB');
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['outbox'], 'readwrite');
            const store = transaction.objectStore('outbox');
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => {
                resolve();
            };
            
            deleteRequest.onerror = () => {
                reject(deleteRequest.error);
            };
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

async function removePendingData(ids) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('OBB_Survey_DB');
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['outbox'], 'readwrite');
            const store = transaction.objectStore('outbox');
            
            const deletePromises = ids.map(id => {
                return new Promise((resolveDelete, rejectDelete) => {
                    const deleteRequest = store.delete(id);
                    deleteRequest.onsuccess = resolveDelete;
                    deleteRequest.onerror = () => rejectDelete(deleteRequest.error);
                });
            });
            
            Promise.all(deletePromises)
                .then(() => resolve())
                .catch(reject);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Push notification
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push received');
    
    const options = {
        body: 'You have a new notification',
        icon: '/manifest.json',
        badge: '/manifest.json',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Explore',
                icon: '/manifest.json'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/manifest.json'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('OBB Survey System', options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification click received');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received:', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
        case 'SYNC_NOW':
            event.waitUntil(syncAllData());
            break;
        case 'CLEAR_CACHE':
            event.waitUntil(clearCache());
            break;
        default:
            console.log('Service Worker: Unknown message type:', type);
    }
});

// Clear cache
async function clearCache() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Service Worker: Cache cleared');
    } catch (error) {
        console.error('Service Worker: Failed to clear cache:', error);
    }
}

// Periodic sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync triggered');
    
    if (event.tag === 'periodic-sync') {
        event.waitUntil(syncAllData());
    }
});

// Network status change
self.addEventListener('online', () => {
    console.log('Service Worker: Network is online');
    
    // Notify clients
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: 'ONLINE_MODE' });
        });
    });
});

self.addEventListener('offline', () => {
    console.log('Service Worker: Network is offline');
    
    // Notify clients
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: 'OFFLINE_MODE' });
        });
    });
});
