# Deployment and Testing Guidelines

## 🚀 Render.com Deployment Process

This project is configured for automatic deployment on Render.com with GitHub integration.

### Deployment Configuration
- **Platform**: Render.com
- **Auto-deployment**: Connected to GitHub repository
- **Environment**: Production-ready with automatic scaling
- **Build Command**: `npm install`
- **Start Command**: `npm start` or `node server/index.js`

### Environment Variables
```bash
PORT=3000                    # Server port (auto-set by Render)
NODE_ENV=production          # Environment mode
```

### Deployment Workflow
1. **Local Development**: Develop and test games locally
2. **Git Commit**: Commit changes to GitHub repository
3. **Automatic Deploy**: Render.com automatically deploys on push
4. **Game Registration**: New games are automatically detected and registered
5. **Live Testing**: Test deployed games at live URL

## 🧪 Testing Strategy

### Local Testing Environment

#### 1. Server Setup
```bash
# Install dependencies
npm install

# Start development server
npm start

# Server runs at http://localhost:3000
```

#### 2. Game Development Testing
```bash
# Create new game
mkdir public/games/test-game
cp GAME_TEMPLATE.html public/games/test-game/index.html

# Test game registration
curl -X POST http://localhost:3000/api/admin/rescan

# Verify game appears
curl http://localhost:3000/api/games
```

#### 3. Keyboard Testing (Development)
All games should include keyboard controls for development testing:
```javascript
// Standard keyboard testing controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowLeft':   // Simulate left tilt
            this.handleTilt(-30, 0);
            break;
        case 'ArrowRight':  // Simulate right tilt
            this.handleTilt(30, 0);
            break;
        case 'ArrowUp':     // Simulate forward tilt
            this.handleTilt(0, -30);
            break;
        case 'ArrowDown':   // Simulate backward tilt
            this.handleTilt(0, 30);
            break;
        case ' ':           // Simulate shake
            this.handleShake();
            break;
        case 'r':           // Reset game
            this.resetGame();
            break;
    }
});
```

### Mobile Device Testing

#### 1. QR Code Testing
- Verify QR code generation works
- Test both QRCode library and fallback API
- Ensure QR codes scan correctly on different devices

#### 2. Sensor Data Testing
```javascript
// Add sensor data logging for testing
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    console.log('Sensor Data:', {
        orientation: data.data.orientation,
        acceleration: data.data.acceleration,
        timestamp: data.timestamp
    });
});
```

#### 3. Connection Testing
- Test sensor connection/disconnection
- Verify reconnection handling
- Test multiple device connections (for multi games)

### Performance Testing

#### 1. Frame Rate Monitoring
```javascript
// FPS counter for performance testing
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
        console.log(`FPS: ${frameCount}`);
        frameCount = 0;
        lastTime = currentTime;
    }
    requestAnimationFrame(measureFPS);
}

// Start FPS monitoring
measureFPS();
```

#### 2. Memory Usage Monitoring
```javascript
// Memory usage tracking
function logMemoryUsage() {
    if (performance.memory) {
        console.log('Memory Usage:', {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
            total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
        });
    }
}

// Log memory usage every 10 seconds
setInterval(logMemoryUsage, 10000);
```

#### 3. Network Performance
```javascript
// Monitor sensor data frequency
let sensorDataCount = 0;
let lastSensorTime = Date.now();

sdk.on('sensor-data', (event) => {
    sensorDataCount++;
    const now = Date.now();
    
    if (now - lastSensorTime >= 1000) {
        console.log(`Sensor Data Rate: ${sensorDataCount} Hz`);
        sensorDataCount = 0;
        lastSensorTime = now;
    }
});
```

## 🔍 Debugging and Troubleshooting

### Common Issues and Solutions

#### 1. Game Not Appearing in Hub
**Symptoms**: New game doesn't show in main menu

**Debugging Steps**:
```bash
# Check if game is detected
curl http://localhost:3000/api/games | jq '.data[] | select(.id=="your-game-id")'

# Force rescan
curl -X POST http://localhost:3000/api/admin/rescan

# Check server logs
npm start # Look for game scanning messages
```

**Common Causes**:
- Invalid `game.json` syntax
- Missing `index.html` file
- Incorrect folder structure
- Server not restarted after adding game

#### 2. Session Creation Failures
**Symptoms**: "서버에 연결되지 않았습니다" error

**Debugging**:
```javascript
// Add connection debugging
sdk.on('connected', () => {
    console.log('✅ Connected - safe to create session');
});

sdk.on('disconnect', () => {
    console.log('❌ Disconnected from server');
});

// Check connection state before session creation
if (sdk.isConnected()) {
    sdk.createSession();
} else {
    console.log('Waiting for connection...');
}
```

#### 3. Sensor Data Issues
**Symptoms**: No sensor data received or undefined errors

**Debugging**:
```javascript
// Comprehensive sensor data logging
sdk.on('sensor-data', (event) => {
    console.log('Raw event:', event);
    console.log('Event type:', typeof event);
    console.log('Has detail:', !!event.detail);
    
    const data = event.detail || event;
    console.log('Processed data:', data);
    
    if (data && data.data) {
        console.log('Sensor data valid');
    } else {
        console.error('Invalid sensor data structure');
    }
});
```

#### 4. QR Code Generation Issues
**Symptoms**: QR code not displaying or "QRCode is not defined" error

**Debugging**:
```javascript
// Test QR code library availability
console.log('QRCode available:', typeof QRCode !== 'undefined');

// Test fallback API
function testQRFallback() {
    const testUrl = 'https://example.com';
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(testUrl)}`;
    
    const img = new Image();
    img.onload = () => console.log('✅ QR fallback API working');
    img.onerror = () => console.error('❌ QR fallback API failed');
    img.src = apiUrl;
}
```

### Production Debugging

#### 1. Remote Debugging
```javascript
// Enable remote debugging for production
const DEBUG_MODE = window.location.search.includes('debug=true');

if (DEBUG_MODE) {
    // Enhanced logging for production debugging
    const originalLog = console.log;
    console.log = function(...args) {
        originalLog.apply(console, ['[DEBUG]', new Date().toISOString(), ...args]);
    };
    
    // Display debug info on screen
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = `
        position: fixed; top: 0; left: 0; 
        background: rgba(0,0,0,0.8); color: white; 
        padding: 10px; font-size: 12px; 
        max-height: 200px; overflow-y: auto; 
        z-index: 9999;
    `;
    document.body.appendChild(debugDiv);
    
    const originalConsoleLog = console.log;
    console.log = function(...args) {
        originalConsoleLog.apply(console, args);
        debugDiv.innerHTML += args.join(' ') + '<br>';
        debugDiv.scrollTop = debugDiv.scrollHeight;
    };
}
```

#### 2. Error Reporting
```javascript
// Global error handler for production
window.addEventListener('error', (event) => {
    console.error('Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
    
    // Optional: Send to error reporting service
    // sendErrorReport(event);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Optional: Send to error reporting service
    // sendErrorReport(event);
});
```

## 📊 Testing Checklist

### Pre-Deployment Testing
- [ ] Game loads without console errors
- [ ] SessionSDK initializes correctly
- [ ] Session creation works
- [ ] QR code generates (both library and fallback)
- [ ] Keyboard controls work for development
- [ ] Mobile sensor data is received and processed
- [ ] Game performance is acceptable (30+ FPS)
- [ ] Memory usage is stable
- [ ] All UI elements display correctly
- [ ] Navigation works properly

### Post-Deployment Testing
- [ ] Game appears in production hub
- [ ] QR code scanning works on live server
- [ ] Sensor data transmission works
- [ ] Multiple players can connect (for multi games)
- [ ] Performance is acceptable on live server
- [ ] No console errors in production
- [ ] Error handling works correctly
- [ ] Game state synchronization works (for multi games)

### Cross-Device Testing
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Different screen sizes
- [ ] Different device orientations
- [ ] Various network conditions

## 🔧 Maintenance and Monitoring

### Server Health Monitoring
```bash
# Check server status
curl http://localhost:3000/api/stats

# Monitor active sessions
curl http://localhost:3000/api/sessions

# Check game registration
curl http://localhost:3000/api/games
```

### Performance Monitoring
- Monitor server response times
- Track active session counts
- Monitor memory usage
- Track error rates

### Regular Maintenance Tasks
1. **Weekly**: Review error logs and performance metrics
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Performance optimization review
4. **As needed**: Game content updates and new features