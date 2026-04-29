// OBB Baseline Survey System - Device Detection Module

window.DeviceManager = {
    deviceId: null,
    deviceInfo: null,
    
    // Initialize device detection
    init: async function() {
        AppUtils.log('Initializing device detection...');
        
        try {
            // Get or generate device ID
            this.deviceId = await this.getDeviceId();
            this.deviceInfo = await this.getDeviceInfo();
            
            // Store device info
            Storage.set('deviceId', this.deviceId);
            Storage.set('deviceInfo', this.deviceInfo);
            
            AppUtils.log('Device detected:', {
                deviceId: this.deviceId,
                deviceInfo: this.deviceInfo
            });
            
            return this.deviceId;
        } catch (error) {
            AppUtils.error('Device detection failed:', error);
            throw error;
        }
    },
    
    // Get device ID (Capacitor or fingerprint)
    getDeviceId: async function() {
        // Check if Capacitor is available
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Device) {
            try {
                const deviceInfo = await window.Capacitor.Plugins.Device.getInfo();
                const deviceId = await this.getCapacitorDeviceId();
                
                AppUtils.log('Using Capacitor device ID:', deviceId);
                return deviceId;
            } catch (error) {
                AppUtils.warn('Capacitor device ID failed, falling back to fingerprint:', error);
            }
        }
        
        // Fallback to fingerprint
        return this.generateFingerprint();
    },
    
    // Get Capacitor device ID
    getCapacitorDeviceId: async function() {
        try {
            // Try to get unique identifier
            const deviceId = await window.Capacitor.Plugins.Device.getId();
            return deviceId.uuid || this.generateFingerprint();
        } catch (error) {
            // If getId is not available, use device info
            const deviceInfo = await window.Capacitor.Plugins.Device.getInfo();
            return this.generateDeviceIdFromInfo(deviceInfo);
        }
    },
    
    // Generate device ID from device info
    generateDeviceIdFromInfo: function(deviceInfo) {
        const info = [
            deviceInfo.model || '',
            deviceInfo.platform || '',
            deviceInfo.operatingSystem || '',
            deviceInfo.osVersion || '',
            deviceInfo.appVersion || '',
            deviceInfo.manufacturer || ''
        ].join('|');
        
        return this.hashString(info);
    },
    
    // Generate fingerprint
    generateFingerprint: async function() {
        const fingerprint = await this.collectFingerprintData();
        const fingerprintString = JSON.stringify(fingerprint);
        return this.hashString(fingerprintString);
    },
    
    // Collect fingerprint data
    collectFingerprintData: async function() {
        const data = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages || [],
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 0,
            deviceMemory: navigator.deviceMemory || 0,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            canvas: await this.getCanvasFingerprint(),
            webgl: this.getWebGLFingerprint(),
            fonts: this.getFontFingerprint(),
            audio: await this.getAudioFingerprint(),
            plugins: this.getPluginFingerprint(),
            connection: this.getConnectionFingerprint(),
            cookies: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        };
        
        return data;
    },
    
    // Get canvas fingerprint
    getCanvasFingerprint: async function() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Draw text
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('OBB Survey 🏰🌍', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Device Fingerprint', 4, 45);
            
            return canvas.toDataURL();
        } catch (error) {
            AppUtils.warn('Canvas fingerprint failed:', error);
            return null;
        }
    },
    
    // Get WebGL fingerprint
    getWebGLFingerprint: function() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return null;
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            
            return {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
                unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null
            };
        } catch (error) {
            AppUtils.warn('WebGL fingerprint failed:', error);
            return null;
        }
    },
    
    // Get font fingerprint
    getFontFingerprint: function() {
        try {
            const baseFonts = ['monospace', 'sans-serif', 'serif'];
            const testString = 'mmmmmmmmmmlli';
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const fontSizes = {};
            
            baseFonts.forEach(baseFont => {
                ctx.font = `72px ${baseFont}`;
                canvas.width = ctx.measureText(testString).width;
                ctx.font = `72px 'Arial', ${baseFont}`;
                const different = ctx.measureText(testString).width !== canvas.width;
                fontSizes[baseFont] = different;
            });
            
            return fontSizes;
        } catch (error) {
            AppUtils.warn('Font fingerprint failed:', error);
            return null;
        }
    },
    
    // Get audio fingerprint
    getAudioFingerprint: async function() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const analyser = audioContext.createAnalyser();
            const gainNode = audioContext.createGain();
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            
            oscillator.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start(0);
            
            return new Promise((resolve) => {
                scriptProcessor.onaudioprocess = (event) => {
                    const samples = event.inputBuffer.getChannelData(0);
                    let sum = 0;
                    
                    for (let i = 0; i < samples.length; i++) {
                        sum += Math.abs(samples[i]);
                    }
                    
                    oscillator.stop();
                    audioContext.close();
                    
                    resolve(sum.toString());
                };
            });
        } catch (error) {
            AppUtils.warn('Audio fingerprint failed:', error);
            return null;
        }
    },
    
    // Get plugin fingerprint
    getPluginFingerprint: function() {
        try {
            const plugins = [];
            
            for (let i = 0; i < navigator.plugins.length; i++) {
                const plugin = navigator.plugins[i];
                plugins.push({
                    name: plugin.name,
                    description: plugin.description,
                    filename: plugin.filename,
                    length: plugin.length
                });
            }
            
            return plugins;
        } catch (error) {
            AppUtils.warn('Plugin fingerprint failed:', error);
            return null;
        }
    },
    
    // Get connection fingerprint
    getConnectionFingerprint: function() {
        try {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            if (!connection) return null;
            
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        } catch (error) {
            AppUtils.warn('Connection fingerprint failed:', error);
            return null;
        }
    },
    
    // Simple hash function
    hashString: function(str) {
        let hash = 0;
        
        if (str.length === 0) return hash.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36) + Date.now().toString(36);
    },
    
    // Get device info
    getDeviceInfo: async function() {
        const info = {
            id: this.deviceId,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelRatio: window.devicePixelRatio || 1
            },
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            online: navigator.onLine,
            connection: this.getConnectionFingerprint(),
            timestamp: new Date().toISOString(),
            appVersion: AppConfig.PWA_NAME + ' v1.0.0'
        };
        
        // Add Capacitor device info if available
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Device) {
            try {
                const capacitorInfo = await window.Capacitor.Plugins.Device.getInfo();
                info.capacitor = {
                    model: capacitorInfo.model,
                    platform: capacitorInfo.platform,
                    operatingSystem: capacitorInfo.operatingSystem,
                    osVersion: capacitorInfo.osVersion,
                    appVersion: capacitorInfo.appVersion,
                    appBuild: capacitorInfo.appBuild,
                    isVirtual: capacitorInfo.isVirtual,
                    manufacturer: capacitorInfo.manufacturer
                };
            } catch (error) {
                AppUtils.warn('Failed to get Capacitor device info:', error);
            }
        }
        
        return info;
    },
    
    // Register device with backend
    register: async function(agentId) {
        if (!this.deviceId) {
            await this.init();
        }
        
        try {
            const deviceData = {
                device_id: this.deviceId,
                device_info: this.deviceInfo,
                agent_id: agentId,
                registered_at: new Date().toISOString()
            };
            
            if (AppConfig.MOCK_MODE) {
                AppUtils.log('Device registered (mock mode):', deviceData);
                return deviceData;
            }
            
            const response = await fetch(AppUtils.getApiUrl('/devices/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AppUtils.getAuthToken()}`,
                    'X-Device-ID': this.deviceId
                },
                body: JSON.stringify(deviceData)
            });
            
            if (!response.ok) {
                throw new Error('Device registration failed');
            }
            
            const result = await response.json();
            AppUtils.log('Device registered successfully:', result);
            
            return result;
        } catch (error) {
            AppUtils.error('Device registration failed:', error);
            throw error;
        }
    },
    
    // Check if device is registered
    isRegistered: function() {
        return Storage.get('deviceRegistered', false);
    },
    
    // Set device as registered
    setRegistered: function(registered = true) {
        Storage.set('deviceRegistered', registered);
    },
    
    // Get device ID
    getId: function() {
        return this.deviceId || Storage.get('deviceId');
    },
    
    // Get device info
    getInfo: function() {
        return this.deviceInfo || Storage.get('deviceInfo');
    },
    
    // Check if device supports camera
    supportsCamera: function() {
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    },
    
    // Check if device supports geolocation
    supportsGeolocation: function() {
        return 'geolocation' in navigator;
    },
    
    // Get current position
    getCurrentPosition: function() {
        return new Promise((resolve, reject) => {
            if (!this.supportsGeolocation()) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    });
                },
                error => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    },
    
    // Watch position
    watchPosition: function(callback, errorCallback) {
        if (!this.supportsGeolocation()) {
            if (errorCallback) errorCallback(new Error('Geolocation not supported'));
            return null;
        }
        
        return navigator.geolocation.watchPosition(
            position => {
                callback({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                });
            },
            error => {
                if (errorCallback) errorCallback(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    }
};
