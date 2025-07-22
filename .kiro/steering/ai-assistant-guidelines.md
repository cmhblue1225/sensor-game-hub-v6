# AI Assistant Development Guidelines

## 🤖 AI-Specific Development Instructions

This document provides specific guidelines for AI assistants (Claude, Gemini, etc.) working on Sensor Game Hub v6.0 projects.

## 📋 Priority Reference Documents

When working on this project, AI assistants MUST prioritize these documents in order:

1. **AI_ASSISTANT_PROMPTS.md** - Contains specific prompts and patterns for AI development
2. **DEVELOPER_GUIDE.md** - Comprehensive development guide with examples
3. **Steering Documents** - Critical implementation patterns and workflows
4. **Existing Game Examples** - Reference implementations in `/public/games/`

## 🚨 Critical Implementation Patterns (MANDATORY)

### 1. SessionSDK Event Handling
**ALWAYS use the `event.detail || event` pattern for ALL SessionSDK events:**

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
```

### 2. Server Connection Sequence
**Never create sessions before server connection is established:**

```javascript
// ❌ WRONG - Will fail with connection error
constructor() {
    this.sdk = new SessionSDK({...});
    this.sdk.createSession(); // Fails - not connected yet
}

// ✅ CORRECT - Wait for connection
constructor() {
    this.sdk = new SessionSDK({...});
    this.setupEvents();
}

setupEvents() {
    this.sdk.on('connected', () => {
        this.createSession(); // Only after connection
    });
}
```

### 3. QR Code Generation with Fallback
**Always provide fallback for QR code library failures:**

```javascript
// ✅ Safe QR code implementation
if (typeof QRCode !== 'undefined') {
    QRCode.toCanvas(canvas, url, callback);
} else {
    // Fallback to external API
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    container.appendChild(img);
}
```

## 🎮 Game Development Approach

### Recommended Development Method
1. **Use GAME_TEMPLATE.html** as starting point (fastest and most reliable)
2. **Customize game-specific logic** in the template
3. **Test thoroughly** with both keyboard and mobile controls
4. **Deploy and verify** on Render.com

### Game Template Usage
```bash
# Copy template for new game
cp GAME_TEMPLATE.html public/games/[game-name]/index.html

# Customize these key areas:
# - gameId (must match folder name)
# - Game title and description
# - Game logic in update() function
# - Rendering in render() function
# - Sensor handling in processSensorData() function
```

### File Structure Requirements
```
public/games/[game-name]/
├── index.html          # Required - Main game file
├── game.json          # Optional - Game metadata
├── style.css          # Optional - Additional styles
└── script.js          # Optional - Separate JS file
```

## 🔧 Development Workflow for AI Assistants

### Step 1: Project Analysis
Before starting development:
- Read project structure and understand the platform
- Review existing games for patterns and conventions
- Identify game type (solo/dual/multi) and requirements

### Step 2: Game Planning
- Define game mechanics and sensor usage
- Plan UI layout and user experience
- Consider performance requirements

### Step 3: Implementation
- Start with GAME_TEMPLATE.html
- Implement core game logic
- Add sensor data processing
- Implement UI and controls

### Step 4: Testing and Debugging
- Test with keyboard controls first
- Verify SessionSDK integration
- Test QR code generation and fallback
- Test with actual mobile devices

### Step 5: Deployment
- Commit to GitHub for automatic Render.com deployment
- Verify game appears in hub
- Test live functionality

## 🚨 Common Mistakes to Avoid

### 1. Immediate Session Creation
```javascript
// ❌ WRONG - Don't do this
constructor() {
    this.sdk = new SessionSDK({...});
    this.sdk.createSession(); // Will fail - not connected
}
```

### 2. Direct Event Parameter Usage
```javascript
// ❌ WRONG - Will cause undefined errors
sdk.on('session-created', (session) => {
    displayQR(session.sessionCode); // undefined!
});
```

### 3. No QR Code Fallback
```javascript
// ❌ WRONG - Will break if library fails
QRCode.toCanvas(canvas, url, callback); // May fail
```

### 4. Unsafe Sensor Data Access
```javascript
// ❌ WRONG - Will throw errors
const tilt = sensorData.data.orientation.gamma; // TypeError if undefined
```

### 5. Missing Game Registration
- Forgetting to restart server or call rescan API
- Invalid game.json syntax
- Incorrect folder structure

## 📱 Sensor Data Handling Guidelines

### Data Structure
```javascript
{
    sensorId: "sensor",
    gameType: "solo",
    data: {
        orientation: { alpha, beta, gamma },    // Device orientation
        acceleration: { x, y, z },              // Acceleration
        rotationRate: { alpha, beta, gamma }    // Rotation rate
    },
    timestamp: 1641234567890
}
```

### Safe Data Processing
```javascript
function processSensorData(sensorData) {
    // Always validate data structure
    if (!sensorData || !sensorData.data) {
        console.warn('Invalid sensor data received');
        return;
    }
    
    const { orientation, acceleration } = sensorData.data;
    
    // Safe orientation access with bounds checking
    if (orientation) {
        const tiltX = Math.max(-90, Math.min(90, orientation.gamma || 0));
        const tiltY = Math.max(-180, Math.min(180, orientation.beta || 0));
        // Use validated values
    }
    
    // Safe acceleration access
    if (acceleration) {
        const totalAccel = Math.sqrt(
            (acceleration.x || 0) ** 2 + 
            (acceleration.y || 0) ** 2 + 
            (acceleration.z || 0) ** 2
        );
        // Use calculated value
    }
}
```

## 🎯 Game Type Specific Guidelines

### Solo Games
- Single player, single device
- Simple, intuitive controls
- Focus on individual achievement
- Examples: maze navigation, balance games

### Dual Games
- Two players, cooperative gameplay
- Shared objectives and challenges
- Synchronization between devices
- Examples: cooperative puzzles, balance challenges

### Multi Games
- 3-8 players, competitive gameplay
- Real-time synchronization required
- Performance optimization critical
- Examples: racing, battle royale, collection games

## 🔍 Debugging Guidelines for AI Assistants

### Enable Debug Mode
```javascript
const sdk = new SessionSDK({
    gameId: 'your-game',
    gameType: 'solo',
    debug: true  // Enable detailed logging
});
```

### Add Comprehensive Logging
```javascript
// Log all SDK events for debugging
sdk.on('connected', () => console.log('✅ Connected'));
sdk.on('session-created', (event) => {
    const session = event.detail || event;
    console.log('✅ Session created:', session.sessionCode);
});
sdk.on('sensor-connected', (event) => {
    const data = event.detail || event;
    console.log('✅ Sensor connected:', data.sensorId);
});
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    console.log('📱 Sensor data:', data.data);
});
```

### Test Connection Sequence
```javascript
// Verify proper connection sequence
let connectionSteps = [];

sdk.on('connected', () => {
    connectionSteps.push('connected');
    console.log('Connection steps:', connectionSteps);
});

sdk.on('session-created', (event) => {
    connectionSteps.push('session-created');
    console.log('Connection steps:', connectionSteps);
});
```

## 📚 Reference Implementation Patterns

### Complete Game Class Structure
```javascript
class MyGame {
    constructor() {
        this.setupCanvas();
        this.setupSDK();
        this.setupKeyboardControls();
        this.startGameLoop();
    }
    
    setupSDK() {
        this.sdk = new SessionSDK({
            gameId: 'my-game',
            gameType: 'solo',
            debug: true
        });
        this.setupEvents();
    }
    
    setupEvents() {
        this.sdk.on('connected', () => this.createSession());
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            this.displaySessionInfo(session);
        });
        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.processSensorData(data);
        });
    }
    
    // ... rest of implementation
}
```

## 🚀 Performance Optimization

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

### Rendering Optimization
```javascript
let lastRenderTime = 0;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

function gameLoop(currentTime) {
    if (currentTime - lastRenderTime >= FRAME_TIME) {
        update();
        render();
        lastRenderTime = currentTime;
    }
    requestAnimationFrame(gameLoop);
}
```

## 📝 Code Quality Standards

### Error Handling
- Always wrap SessionSDK calls in try-catch blocks
- Provide user-friendly error messages
- Log errors for debugging

### Performance
- Use requestAnimationFrame for game loops
- Throttle sensor data processing
- Clean up event listeners on game end

### UI/UX
- Use existing CSS theme variables
- Implement responsive design
- Provide clear navigation back to hub
- Show connection status for multiplayer games

## 🎯 Success Criteria

A successfully implemented game should:
- [ ] Load without console errors
- [ ] Create sessions properly after connection
- [ ] Generate QR codes with fallback
- [ ] Process sensor data safely
- [ ] Respond to mobile device input
- [ ] Maintain stable performance (30+ FPS)
- [ ] Handle connection/disconnection gracefully
- [ ] Provide intuitive user interface
- [ ] Navigate properly within the hub ecosystem