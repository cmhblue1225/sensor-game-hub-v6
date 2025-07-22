# SessionSDK Critical Implementation Patterns

## 🚨 MANDATORY Implementation Patterns

These patterns are CRITICAL for all Sensor Game Hub v6.0 development. Failure to follow these patterns will result in broken games.

### 1. CustomEvent Handling Pattern (CRITICAL)
**ALWAYS use `event.detail || event` for ALL SessionSDK events:**

```javascript
// ❌ WRONG - Will cause undefined errors
sdk.on('session-created', (session) => {
    console.log(session.sessionCode); // undefined!
});

// ✅ CORRECT - Always use this pattern
sdk.on('session-created', (event) => {
    const session = event.detail || event;
    console.log(session.sessionCode); // Works correctly
});

// Apply to ALL SDK events:
sdk.on('sensor-connected', (event) => {
    const data = event.detail || event;
    console.log('Sensor connected:', data.sensorId);
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    processSensorData(data);
});

sdk.on('game-ready', (event) => {
    const data = event.detail || event;
    startGame();
});
```

### 2. Server Connection Sequence (CRITICAL)
**NEVER create sessions before server connection is established:**

```javascript
// ❌ WRONG - Will fail with connection error
class MyGame {
    constructor() {
        this.sdk = new SessionSDK({...});
        this.sdk.createSession(); // 🚫 Fails - not connected yet
    }
}

// ✅ CORRECT - Wait for connection
class MyGame {
    constructor() {
        this.sdk = new SessionSDK({...});
        this.setupEvents();
    }
    
    setupEvents() {
        this.sdk.on('connected', () => {
            this.createSession(); // ✅ Only after connection
        });
    }
    
    async createSession() {
        try {
            const session = await this.sdk.createSession();
            console.log('Session created:', session);
        } catch (error) {
            console.error('Session creation failed:', error);
        }
    }
}
```

### 3. QR Code Generation with Fallback (CRITICAL)
**Always provide fallback for QR code library failures:**

```javascript
// ✅ Safe QR code implementation
displaySessionInfo(session) {
    const sessionCode = session.sessionCode;
    const qrUrl = `${window.location.origin}/sensor.html?session=${sessionCode}`;
    
    if (typeof QRCode !== 'undefined') {
        // Primary: Use QRCode library
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, qrUrl, (error) => {
            if (!error) {
                document.getElementById('qrContainer').appendChild(canvas);
            } else {
                this.showQRCodeFallback(qrUrl);
            }
        });
    } else {
        // Fallback: Use external API
        this.showQRCodeFallback(qrUrl);
    }
}

showQRCodeFallback(qrUrl) {
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
    img.alt = 'QR Code';
    document.getElementById('qrContainer').appendChild(img);
}
```

### 4. Sensor Data Processing Pattern
**Always validate and safely access sensor data:**

```javascript
function processSensorData(sensorData) {
    // Validate data structure
    if (!sensorData || !sensorData.data) {
        console.warn('Invalid sensor data received');
        return;
    }
    
    const { orientation, acceleration, rotationRate } = sensorData.data;
    
    // Safe orientation access
    if (orientation) {
        const tiltX = Math.max(-90, Math.min(90, orientation.gamma || 0));
        const tiltY = Math.max(-180, Math.min(180, orientation.beta || 0));
        const rotation = orientation.alpha || 0;
        
        // Use validated values
        updateGameState(tiltX, tiltY, rotation);
    }
    
    // Safe acceleration access
    if (acceleration) {
        const totalAccel = Math.sqrt(
            (acceleration.x || 0) ** 2 + 
            (acceleration.y || 0) ** 2 + 
            (acceleration.z || 0) ** 2
        );
        
        if (totalAccel > 15) {
            triggerShakeAction();
        }
    }
}
```

## Common Error Patterns to Avoid

### ❌ Direct Parameter Usage
```javascript
// WRONG - Will cause undefined errors
sdk.on('session-created', (session) => {
    displayQR(session.sessionCode); // undefined!
});
```

### ❌ Immediate Session Creation
```javascript
// WRONG - Connection not established
constructor() {
    this.sdk = new SessionSDK({...});
    this.sdk.createSession(); // Will fail
}
```

### ❌ No QR Fallback
```javascript
// WRONG - Will break if library fails to load
QRCode.toCanvas(canvas, url, callback); // Uncaught ReferenceError
```

### ❌ Unsafe Data Access
```javascript
// WRONG - Will throw errors with missing data
const tilt = sensorData.data.orientation.gamma; // TypeError if undefined
```

## Testing Your Implementation

### 1. Test Connection Sequence
```javascript
// Add debug logging to verify order
sdk.on('connected', () => {
    console.log('✅ Connected - safe to create session');
});

sdk.on('session-created', (event) => {
    const session = event.detail || event;
    console.log('✅ Session created:', session.sessionCode);
});
```

### 2. Test CustomEvent Handling
```javascript
// Verify event structure in console
sdk.on('session-created', (event) => {
    console.log('Raw event:', event);
    console.log('Event detail:', event.detail);
    const session = event.detail || event;
    console.log('Processed session:', session);
});
```

### 3. Test QR Fallback
```javascript
// Temporarily disable QRCode to test fallback
window.QRCode = undefined;
// Then test QR generation
```

## Performance Considerations

### Sensor Data Throttling
```javascript
let lastSensorUpdate = 0;
const SENSOR_THROTTLE = 33; // 30fps

sdk.on('sensor-data', (event) => {
    const now = Date.now();
    if (now - lastSensorUpdate < SENSOR_THROTTLE) return;
    
    lastSensorUpdate = now;
    const data = event.detail || event;
    processSensorData(data);
});
```

### Memory Management
```javascript
// Clean up event listeners
function cleanup() {
    sdk.off('sensor-data', sensorHandler);
    sdk.off('session-created', sessionHandler);
    sdk.disconnect();
}

// Call cleanup on page unload
window.addEventListener('beforeunload', cleanup);
```