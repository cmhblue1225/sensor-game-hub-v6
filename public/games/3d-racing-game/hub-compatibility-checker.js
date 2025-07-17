/**
 * Hub Compatibility Checker for 3D Racing Game
 * Ensures compatibility with the sensor game hub system
 */
class HubCompatibilityChecker {
    constructor() {
        this.isCompatible = false;
        this.hubVersion = null;
        this.gameVersion = '1.0.0';
        this.requiredFeatures = [
            'SessionSDK',
            'WebSocket',
            'Canvas2D',
            'DeviceOrientationEvent'
        ];
        this.compatibilityReport = {};
    }

    /**
     * Check compatibility with hub system
     */
    async checkCompatibility() {
        console.log('Checking hub compatibility...');
        
        try {
            // Check for required features
            await this.checkRequiredFeatures();
            
            // Check hub version
            this.checkHubVersion();
            
            // Check browser capabilities
            this.checkBrowserCapabilities();
            
            // Generate compatibility report
            this.generateCompatibilityReport();
            
            console.log('Compatibility check complete:', this.compatibilityReport);
            return this.isCompatible;
            
        } catch (error) {
            console.error('Compatibility check failed:', error);
            this.isCompatible = false;
            return false;
        }
    }

    /**
     * Check required features
     */
    async checkRequiredFeatures() {
        const features = {};
        
        // Check SessionSDK
        features.SessionSDK = typeof window.SessionSDK !== 'undefined';
        
        // Check WebSocket
        features.WebSocket = typeof WebSocket !== 'undefined';
        
        // Check Canvas2D
        features.Canvas2D = (() => {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext && canvas.getContext('2d'));
        })();
        
        // Check DeviceOrientationEvent
        features.DeviceOrientationEvent = typeof DeviceOrientationEvent !== 'undefined';
        
        // Check for sensor permissions (if on mobile)
        if (this.isMobile()) {
            features.SensorPermissions = await this.checkSensorPermissions();
        } else {
            features.SensorPermissions = true; // Not needed on desktop
        }
        
        this.compatibilityReport.features = features;
        
        // All required features must be available
        this.isCompatible = this.requiredFeatures.every(feature => features[feature]);
    }

    /**
     * Check hub version
     */
    checkHubVersion() {
        if (typeof window.HUB_VERSION !== 'undefined') {
            this.hubVersion = window.HUB_VERSION;
        } else if (typeof window.sessionStateManager !== 'undefined') {
            this.hubVersion = '6.0.0'; // Assume current version
        } else {
            this.hubVersion = 'unknown';
        }
        
        this.compatibilityReport.hubVersion = this.hubVersion;
    }

    /**
     * Check browser capabilities
     */
    checkBrowserCapabilities() {
        const capabilities = {
            webgl: this.checkWebGL(),
            touchEvents: 'ontouchstart' in window,
            deviceOrientation: typeof DeviceOrientationEvent !== 'undefined',
            deviceMotion: typeof DeviceMotionEvent !== 'undefined',
            fullscreen: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled),
            audioContext: !!(window.AudioContext || window.webkitAudioContext),
            gamepad: 'getGamepads' in navigator,
            performance: typeof performance !== 'undefined'
        };
        
        this.compatibilityReport.capabilities = capabilities;
    }

    /**
     * Check WebGL support
     */
    checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    /**
     * Check sensor permissions
     */
    async checkSensorPermissions() {
        try {
            // Check if we can request device orientation permission
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                return permission === 'granted';
            }
            
            // If no permission API, assume it's available
            return true;
        } catch (error) {
            console.warn('Sensor permission check failed:', error);
            return false;
        }
    }

    /**
     * Generate compatibility report
     */
    generateCompatibilityReport() {
        const report = {
            compatible: this.isCompatible,
            gameVersion: this.gameVersion,
            hubVersion: this.hubVersion,
            platform: this.getPlatformInfo(),
            timestamp: new Date().toISOString(),
            ...this.compatibilityReport
        };
        
        this.compatibilityReport = report;
    }

    /**
     * Get platform information
     */
    getPlatformInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            online: navigator.onLine,
            mobile: this.isMobile(),
            touch: 'ontouchstart' in window,
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                pixelRatio: window.devicePixelRatio || 1
            }
        };
    }

    /**
     * Check if running on mobile device
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Get compatibility warnings
     */
    getWarnings() {
        const warnings = [];
        
        if (!this.compatibilityReport.features?.SessionSDK) {
            warnings.push('SessionSDK not available - game may not connect to sensors');
        }
        
        if (!this.compatibilityReport.capabilities?.audioContext) {
            warnings.push('Audio context not available - no sound effects');
        }
        
        if (!this.compatibilityReport.capabilities?.deviceOrientation && this.isMobile()) {
            warnings.push('Device orientation not available - sensor input may not work');
        }
        
        if (!this.compatibilityReport.capabilities?.performance) {
            warnings.push('Performance API not available - frame rate monitoring disabled');
        }
        
        return warnings;
    }

    /**
     * Get recommended actions
     */
    getRecommendations() {
        const recommendations = [];
        
        if (!this.isCompatible) {
            recommendations.push('Try updating your browser to the latest version');
            recommendations.push('Enable hardware acceleration in browser settings');
            
            if (this.isMobile()) {
                recommendations.push('Grant sensor permissions when prompted');
                recommendations.push('Use a modern mobile browser (Chrome, Safari, Firefox)');
            }
        }
        
        if (!this.compatibilityReport.capabilities?.webgl) {
            recommendations.push('Enable WebGL support for better performance');
        }
        
        return recommendations;
    }

    /**
     * Display compatibility status
     */
    displayStatus() {
        const statusEl = document.getElementById('compatibility-status');
        if (!statusEl) return;
        
        const warnings = this.getWarnings();
        const recommendations = this.getRecommendations();
        
        let statusHTML = `
            <div class="compatibility-status ${this.isCompatible ? 'compatible' : 'incompatible'}">
                <h3>Compatibility Status: ${this.isCompatible ? '✅ Compatible' : '❌ Incompatible'}</h3>
                <p>Game Version: ${this.gameVersion}</p>
                <p>Hub Version: ${this.hubVersion}</p>
        `;
        
        if (warnings.length > 0) {
            statusHTML += '<h4>Warnings:</h4><ul>';
            warnings.forEach(warning => {
                statusHTML += `<li>${warning}</li>`;
            });
            statusHTML += '</ul>';
        }
        
        if (recommendations.length > 0) {
            statusHTML += '<h4>Recommendations:</h4><ul>';
            recommendations.forEach(rec => {
                statusHTML += `<li>${rec}</li>`;
            });
            statusHTML += '</ul>';
        }
        
        statusHTML += '</div>';
        statusEl.innerHTML = statusHTML;
    }
}

// Global compatibility checker
window.hubCompatibilityChecker = new HubCompatibilityChecker();