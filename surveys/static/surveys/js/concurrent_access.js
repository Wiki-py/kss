/**
 * Concurrent Access Control JavaScript
 * Handles real-time collaboration, form locking, and user presence
 */
class ConcurrentAccessManager {
    constructor(options = {}) {
        this.lockType = options.lockType || '';
        this.objectId = options.objectId || 0;
        this.sessionType = options.sessionType || '';
        this.refreshInterval = options.refreshInterval || 30000; // 30 seconds
        this.lockRefreshInterval = null;
        this.activeUsersInterval = null;
        this.collaborationInterval = null;
        this.currentUsers = new Map();
        this.lockInfo = null;
        this.isLocked = false;
        this.currentUser = null;
        
        this.init();
    }
    
    init() {
        if (!this.lockType || !this.objectId) {
            console.error('Lock type and object ID are required');
            return;
        }
        
        this.startLockRefresh();
        this.startActiveUsersPolling();
        this.startCollaborationPolling();
        this.setupEventListeners();
        this.showLockStatus();
    }
    
    startLockRefresh() {
        // Refresh lock every 30 seconds
        this.lockRefreshInterval = setInterval(() => {
            this.refreshLock();
        }, this.refreshInterval);
        
        // Initial refresh
        this.refreshLock();
    }
    
    refreshLock() {
        fetch('/surveys/api/refresh-lock/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: `lock_type=${this.lockType}&object_id=${this.objectId}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.lockInfo = data;
                this.updateLockStatus(true);
            } else {
                this.handleLockError(data.error);
            }
        })
        .catch(error => {
            console.error('Error refreshing lock:', error);
            this.handleLockError('Failed to refresh lock');
        });
    }
    
    startActiveUsersPolling() {
        // Poll for active users every 10 seconds
        this.activeUsersInterval = setInterval(() => {
            this.getActiveUsers();
        }, 10000);
        
        // Initial fetch
        this.getActiveUsers();
    }
    
    getActiveUsers() {
        fetch(`/surveys/api/active-users/?session_type=${this.sessionType}&object_id=${this.objectId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.updateActiveUsers(data.users);
            }
        })
        .catch(error => {
            console.error('Error fetching active users:', error);
        });
    }
    
    startCollaborationPolling() {
        // Poll for collaboration events every 15 seconds
        this.collaborationInterval = setInterval(() => {
            this.getCollaborationEvents();
        }, 15000);
    }
    
    getCollaborationEvents() {
        const since = localStorage.getItem('last_event_time') || '';
        fetch(`/surveys/api/collaboration-events/?session_type=${this.sessionType}&object_id=${this.objectId}&since=${since}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.events.length > 0) {
                this.processCollaborationEvents(data.events);
                // Update last event time
                const latestEvent = data.events[0];
                localStorage.setItem('last_event_time', latestEvent.created_at);
            }
        })
        .catch(error => {
            console.error('Error fetching collaboration events:', error);
        });
    }
    
    processCollaborationEvents(events) {
        events.forEach(event => {
            this.showCollaborationNotification(event);
        });
    }
    
    showCollaborationNotification(event) {
        const message = this.getEventMessage(event);
        if (message) {
            this.showNotification(message, event.event_type);
        }
    }
    
    getEventMessage(event) {
        const userName = event.user.full_name || event.user.username;
        
        switch (event.event_type) {
            case 'user_joined':
                return `${userName} joined the form`;
            case 'user_left':
                return `${userName} left the form`;
            case 'page_changed':
                return `${userName} is on page ${event.data.current_page}`;
            case 'form_locked':
                return `${userName} locked the form`;
            case 'form_unlocked':
                return `${userName} unlocked the form`;
            case 'form_submitted':
                return `${userName} submitted the form`;
            default:
                return '';
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `collaboration-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-text">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        const container = document.getElementById('collaboration-notifications') || this.createNotificationContainer();
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'collaboration-notifications';
        container.className = 'collaboration-notifications';
        document.body.appendChild(container);
        return container;
    }
    
    getNotificationIcon(type) {
        const icons = {
            'user_joined': '👤',
            'user_left': '👋',
            'page_changed': '📄',
            'form_locked': '🔒',
            'form_unlocked': '🔓',
            'form_submitted': '✅',
            'info': 'ℹ️',
            'warning': '⚠️',
            'error': '❌'
        };
        return icons[type] || 'ℹ️';
    }
    
    updateActiveUsers(users) {
        const previousUsers = new Set(this.currentUsers.keys());
        const currentUsers = new Set();
        
        users.forEach(user => {
            currentUsers.add(user.id);
            if (!this.currentUsers.has(user.id)) {
                // New user joined
                this.currentUsers.set(user.id, user);
                if (!user.is_current_user) {
                    this.showUserJoined(user);
                }
            } else {
                // Update existing user
                this.currentUsers.set(user.id, user);
            }
        });
        
        // Check for users who left
        previousUsers.forEach(userId => {
            if (!currentUsers.has(userId)) {
                const user = this.currentUsers.get(userId);
                if (user && !user.is_current_user) {
                    this.showUserLeft(user);
                }
                this.currentUsers.delete(userId);
            }
        });
        
        this.renderActiveUsers();
    }
    
    showUserJoined(user) {
        const userName = user.full_name || user.username;
        this.showNotification(`${userName} is now working on this form`, 'user_joined');
    }
    
    showUserLeft(user) {
        const userName = user.full_name || user.username;
        this.showNotification(`${userName} stopped working on this form`, 'user_left');
    }
    
    renderActiveUsers() {
        const container = document.getElementById('active-users');
        if (!container) return;
        
        const users = Array.from(this.currentUsers.values());
        const currentUser = users.find(u => u.is_current_user);
        const otherUsers = users.filter(u => !u.is_current_user);
        
        container.innerHTML = `
            <div class="active-users-header">
                <span class="active-users-count">${users.length} user${users.length !== 1 ? 's' : ''} active</span>
                ${currentUser ? `<span class="current-user-indicator">You are active</span>` : ''}
            </div>
            <div class="active-users-list">
                ${otherUsers.map(user => `
                    <div class="active-user-item">
                        <div class="user-avatar">${this.getUserInitials(user)}</div>
                        <div class="user-info">
                            <div class="user-name">${user.full_name || user.username}</div>
                            <div class="user-status">On page ${user.current_page}</div>
                        </div>
                        <div class="user-indicator online"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    getUserInitials(user) {
        const name = user.full_name || user.username;
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
    updateLockStatus(isActive) {
        this.isLocked = isActive;
        const statusElement = document.getElementById('lock-status');
        if (statusElement) {
            if (isActive) {
                statusElement.className = 'lock-status active';
                statusElement.innerHTML = `
                    <div class="lock-indicator locked">🔒</div>
                    <div class="lock-info">
                        <div class="lock-text">Form is locked by you</div>
                        <div class="lock-time">Expires in ${this.getTimeUntilExpiry()}</div>
                    </div>
                `;
            } else {
                statusElement.className = 'lock-status inactive';
                statusElement.innerHTML = `
                    <div class="lock-indicator unlocked">🔓</div>
                    <div class="lock-info">
                        <div class="lock-text">Form is not locked</div>
                    </div>
                `;
            }
        }
    }
    
    getTimeUntilExpiry() {
        if (!this.lockInfo || !this.lockInfo.expires_at) return 'unknown';
        
        const expiry = new Date(this.lockInfo.expires_at);
        const now = new Date();
        const diff = expiry - now;
        
        if (diff <= 0) return 'expired';
        
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        return `${minutes}m ${seconds}s`;
    }
    
    showLockStatus() {
        // Create lock status element if it doesn't exist
        let statusElement = document.getElementById('lock-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'lock-status';
            statusElement.className = 'lock-status';
            
            // Insert at the top of the form
            const form = document.querySelector('form') || document.querySelector('.container');
            if (form) {
                form.insertBefore(statusElement, form.firstChild);
            }
        }
    }
    
    handleLockError(error) {
        console.error('Lock error:', error);
        this.updateLockStatus(false);
        this.showNotification(`Lock error: ${error}`, 'error');
        
        // Redirect if lock is lost
        if (error.includes('not found') || error.includes('expired')) {
            setTimeout(() => {
                window.location.href = '/surveys/';
            }, 3000);
        }
    }
    
    setupEventListeners() {
        // Update progress on page change
        const pageIndicators = document.querySelectorAll('.page-indicator, .step-indicator');
        pageIndicators.forEach(indicator => {
            indicator.addEventListener('click', (e) => {
                const page = e.target.dataset.page || e.target.closest('[data-page]').dataset.page;
                if (page) {
                    this.updateProgress(page);
                }
            });
        });
        
        // Release lock on page unload
        window.addEventListener('beforeunload', () => {
            this.releaseLock();
        });
        
        // Release lock on form submission
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', () => {
                this.releaseLock();
            });
        }
    }
    
    updateProgress(currentPage) {
        const progressData = this.getProgressData();
        
        fetch('/surveys/api/update-progress/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: `session_type=${this.sessionType}&object_id=${this.objectId}&current_page=${currentPage}&progress_data=${JSON.stringify(progressData)}`
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Error updating progress:', data.error);
            }
        })
        .catch(error => {
            console.error('Error updating progress:', error);
        });
    }
    
    getProgressData() {
        // Collect form data for progress tracking
        const formData = new FormData(document.querySelector('form') || document);
        const progress = {};
        
        for (let [key, value] of formData.entries()) {
            progress[key] = value;
        }
        
        return progress;
    }
    
    releaseLock() {
        if (this.lockRefreshInterval) {
            clearInterval(this.lockRefreshInterval);
        }
        if (this.activeUsersInterval) {
            clearInterval(this.activeUsersInterval);
        }
        if (this.collaborationInterval) {
            clearInterval(this.collaborationInterval);
        }
        
        fetch('/surveys/api/release-lock/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: `lock_type=${this.lockType}&object_id=${this.objectId}`
        })
        .catch(error => {
            console.error('Error releasing lock:', error);
        });
    }
    
    getCSRFToken() {
        const cookie = document.cookie.match(/csrftoken=([^;]+)/);
        return cookie ? cookie[1] : '';
    }
    
    destroy() {
        this.releaseLock();
    }
}

// Initialize concurrent access manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Look for concurrent access configuration
    const configElement = document.getElementById('concurrent-access-config');
    if (configElement) {
        const config = JSON.parse(configElement.textContent);
        window.concurrentManager = new ConcurrentAccessManager(config);
    }
});

// Export for use in other scripts
window.ConcurrentAccessManager = ConcurrentAccessManager;
