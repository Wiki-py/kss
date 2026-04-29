// OBB Baseline Survey System - Utility Functions

// Toast Notification System
window.Toast = {
    container: null,
    
    init: function() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toastContainer';
            this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(this.container);
        }
    },
    
    show: function(message, type = 'info', duration = null) {
        this.init();
        
        const toast = document.createElement('div');
        const toastId = 'toast-' + Date.now();
        toast.id = toastId;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const bgColors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        toast.className = `${bgColors[type]} text-white px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${icons[type]} mr-3 text-xl"></i>
                <div class="flex-1">
                    <p class="font-medium">${message}</p>
                </div>
                <button onclick="Toast.remove('${toastId}')" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        this.container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
            toast.classList.add('translate-x-0');
        }, 100);
        
        // Auto remove
        const toastDuration = duration || AppConfig.TOAST_DURATION;
        setTimeout(() => {
            this.remove(toastId);
        }, toastDuration);
        
        return toastId;
    },
    
    remove: function(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    },
    
    success: function(message, duration) {
        return this.show(message, 'success', duration);
    },
    
    error: function(message, duration) {
        return this.show(message, 'error', duration);
    },
    
    warning: function(message, duration) {
        return this.show(message, 'warning', duration);
    },
    
    info: function(message, duration) {
        return this.show(message, 'info', duration);
    }
};

// Loading Overlay
window.Loading = {
    overlay: null,
    
    show: function(message = 'Loading...') {
        if (!this.overlay) {
            this.overlay = document.getElementById('loadingOverlay');
        }
        
        if (this.overlay) {
            const messageElement = this.overlay.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
            this.overlay.classList.remove('hidden');
        }
    },
    
    hide: function() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
    },
    
    toggle: function(show) {
        if (show) {
            this.show();
        } else {
            this.hide();
        }
    }
};

// Form Validation
window.FormValidator = {
    validate: function(form, rules) {
        const errors = {};
        let isValid = true;
        
        for (const field in rules) {
            const fieldElement = form.querySelector(`[name="${field}"]`);
            if (!fieldElement) continue;
            
            const value = fieldElement.value.trim();
            const fieldRules = rules[field];
            
            for (const rule of fieldRules) {
                const validationResult = this.validateField(value, rule);
                if (!validationResult.valid) {
                    errors[field] = validationResult.message;
                    isValid = false;
                    break;
                }
            }
        }
        
        return {
            valid: isValid,
            errors: errors
        };
    },
    
    validateField: function(value, rule) {
        switch (rule.type) {
            case 'required':
                return {
                    valid: value.length > 0,
                    message: 'This field is required'
                };
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return {
                    valid: emailRegex.test(value),
                    message: 'Please enter a valid email address'
                };
                
            case 'phone':
                const phoneRegex = /^\+?[\d\s\-()]+$/;
                return {
                    valid: phoneRegex.test(value),
                    message: 'Please enter a valid phone number'
                };
                
            case 'minLength':
                return {
                    valid: value.length >= rule.value,
                    message: `Minimum length is ${rule.value} characters`
                };
                
            case 'maxLength':
                return {
                    valid: value.length <= rule.value,
                    message: `Maximum length is ${rule.value} characters`
                };
                
            case 'pattern':
                const pattern = new RegExp(rule.value);
                return {
                    valid: pattern.test(value),
                    message: rule.message || 'Invalid format'
                };
                
            default:
                return { valid: true };
        }
    },
    
    showErrors: function(form, errors) {
        // Clear previous errors
        this.clearErrors(form);
        
        for (const field in errors) {
            const fieldElement = form.querySelector(`[name="${field}"]`);
            if (fieldElement) {
                fieldElement.classList.add('border-red-500');
                
                const errorElement = document.createElement('div');
                errorElement.className = 'text-red-500 text-sm mt-1';
                errorElement.textContent = errors[field];
                
                fieldElement.parentNode.appendChild(errorElement);
            }
        }
    },
    
    clearErrors: function(form) {
        // Remove error styles
        form.querySelectorAll('.border-red-500').forEach(element => {
            element.classList.remove('border-red-500');
        });
        
        // Remove error messages
        form.querySelectorAll('.text-red-500').forEach(element => {
            element.remove();
        });
    }
};

// Image Processing
window.ImageProcessor = {
    resize: function(file, maxWidth, maxHeight, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = (maxHeight / height) * width;
                    height = maxHeight;
                }
                
                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;
                
                // Draw and resize image
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    },
    
    toBase64: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    validateFile: function(file) {
        // Check file size
        if (file.size > AppConfig.MAX_FILE_SIZE) {
            return {
                valid: false,
                error: ErrorMessages.FILE_SIZE_ERROR
            };
        }
        
        // Check file type
        if (!AppConfig.ALLOWED_FILE_TYPES.includes(file.type)) {
            return {
                valid: false,
                error: ErrorMessages.FILE_TYPE_ERROR
            };
        }
        
        return { valid: true };
    }
};

// Signature Pad Helper
window.SignatureHelper = {
    createPad: function(canvasId, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const defaultOptions = {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)',
            minWidth: 0.5,
            maxWidth: 2.5
        };
        
        const signaturePad = new SignaturePad(canvas, { ...defaultOptions, ...options });
        
        // Set canvas size
        this.resizeCanvas(canvas);
        
        return signaturePad;
    },
    
    resizeCanvas: function(canvas) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
    },
    
    clear: function(signaturePad) {
        if (signaturePad) {
            signaturePad.clear();
        }
    },
    
    isEmpty: function(signaturePad) {
        return signaturePad ? signaturePad.isEmpty() : true;
    },
    
    toDataURL: function(signaturePad) {
        return signaturePad ? signaturePad.toDataURL() : null;
    }
};

// Chart Helper
window.ChartHelper = {
    create: function(canvasId, type, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        };
        
        return new Chart(canvas, {
            type: type,
            data: data,
            options: { ...defaultOptions, ...options }
        });
    },
    
    colors: {
        primary: '#dc2626',
        success: '#22c55e',
        warning: '#fbbf24',
        info: '#3b82f6',
        danger: '#ef4444',
        gray: '#6b7280'
    },
    
    createBarChart: function(canvasId, labels, data, label) {
        return this.create(canvasId, 'bar', {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: this.colors.primary,
                borderColor: this.colors.primary,
                borderWidth: 1
            }]
        });
    },
    
    createPieChart: function(canvasId, labels, data) {
        return this.create(canvasId, 'pie', {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    this.colors.primary,
                    this.colors.success,
                    this.colors.warning,
                    this.colors.info,
                    this.colors.danger
                ]
            }]
        });
    },
    
    createLineChart: function(canvasId, labels, data, label) {
        return this.create(canvasId, 'line', {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: this.colors.primary,
                backgroundColor: this.colors.primary + '20',
                fill: true,
                tension: 0.4
            }]
        });
    }
};

// Local Storage Helper
window.Storage = {
    get: function(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            AppUtils.error('Error getting from localStorage:', error);
            return defaultValue;
        }
    },
    
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            AppUtils.error('Error setting to localStorage:', error);
            return false;
        }
    },
    
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            AppUtils.error('Error removing from localStorage:', error);
            return false;
        }
    },
    
    clear: function() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            AppUtils.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// Network Helper
window.Network = {
    isOnline: function() {
        return navigator.onLine;
    },
    
    getStatus: function() {
        return {
            online: navigator.onLine,
            effectiveType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
            downlink: navigator.connection ? navigator.connection.downlink : 'unknown',
            rtt: navigator.connection ? navigator.connection.rtt : 'unknown'
        };
    },
    
    whenOnline: function(callback) {
        if (this.isOnline()) {
            callback();
        } else {
            window.addEventListener('online', callback, { once: true });
        }
    },
    
    whenOffline: function(callback) {
        if (!this.isOnline()) {
            callback();
        } else {
            window.addEventListener('offline', callback, { once: true });
        }
    }
};

// DOM Helper
window.DOM = {
    ready: function(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    },
    
    find: function(selector, parent = document) {
        return parent.querySelector(selector);
    },
    
    findAll: function(selector, parent = document) {
        return parent.querySelectorAll(selector);
    },
    
    create: function(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        for (const attr in attributes) {
            if (attr === 'className') {
                element.className = attributes[attr];
            } else if (attr === 'innerHTML') {
                element.innerHTML = attributes[attr];
            } else {
                element.setAttribute(attr, attributes[attr]);
            }
        }
        
        if (content) {
            element.textContent = content;
        }
        
        return element;
    },
    
    show: function(element) {
        if (typeof element === 'string') {
            element = this.find(element);
        }
        if (element) {
            element.style.display = '';
            element.classList.remove('hidden');
        }
    },
    
    hide: function(element) {
        if (typeof element === 'string') {
            element = this.find(element);
        }
        if (element) {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    },
    
    toggle: function(element) {
        if (typeof element === 'string') {
            element = this.find(element);
        }
        if (element) {
            if (element.style.display === 'none') {
                this.show(element);
            } else {
                this.hide(element);
            }
        }
    },
    
    addClass: function(element, className) {
        if (typeof element === 'string') {
            element = this.find(element);
        }
        if (element) {
            element.classList.add(className);
        }
    },
    
    removeClass: function(element, className) {
        if (typeof element === 'string') {
            element = this.find(element);
        }
        if (element) {
            element.classList.remove(className);
        }
    }
};
