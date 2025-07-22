# Game Development Workflow

## 🎮 Complete Game Development Process

This document outlines the step-by-step process for developing games in Sensor Game Hub v6.0.

## Quick Start Template Method (RECOMMENDED)

### Step 1: Use Game Template
```bash
# Copy the provided template (fastest method)
cp GAME_TEMPLATE.html public/games/my-new-game/index.html
```

### Step 2: Customize Game Information
Edit the template to change:
```javascript
// Game ID (must match folder name)
gameId: 'my-new-game',

// Game title in UI
<div class="session-title">🎮 My New Game</div>

// Game metadata
const gameMetadata = {
    title: "My New Game",
    description: "Game description here",
    category: "solo" // or "dual", "multi"
};
```

### Step 3: Implement Game Logic
Focus on these key functions:
- `update()` - Game logic updates
- `render()` - Canvas drawing
- `processSensorData()` - Handle sensor input

## Manual Development Process

### Step 1: Create Game Directory
```bash
mkdir public/games/[game-name]
cd public/games/[game-name]
```

### Step 2: Create Required Files

#### index.html (Required)
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Title</title>
    <style>
        /* Use existing CSS theme variables */
        :root {
            --primary: #3b82f6;
            --secondary: #8b5cf6;
            --success: #10b981;
            --background: #0f172a;
            --surface: #1e293b;
            --text-primary: #f8fafc;
        }
        
        body {
            margin: 0;
            padding: 0;
            background: var(--background);
            color: var(--text-primary);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .game-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
        }
        
        #gameCanvas {
            display: block;
            background: #000;
        }
        
        .game-ui {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
        }
        
        .session-panel {
            position: absolute;
            top: 20px;
            right: 20px;
            background: var(--surface);
            padding: 15px;
            border-radius: 10px;
            pointer-events: auto;
        }
        
        .control-panel {
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
            pointer-events: auto;
        }
        
        button, a {
            padding: 10px 20px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 5px;
            text-decoration: none;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <canvas id="gameCanvas"></canvas>
        
        <div class="game-ui">
            <div class="session-panel">
                <div class="session-title">🎮 Game Title</div>
                <div class="session-code" id="sessionCode">-</div>
                <div class="qr-container" id="qrContainer"></div>
                <div class="connection-status" id="connectionStatus">연결 대기중...</div>
            </div>
            
            <div class="control-panel">
                <button onclick="resetGame()">🔄 재시작</button>
                <button onclick="togglePause()">⏸️ 일시정지</button>
                <a href="/">🏠 허브로</a>
            </div>
        </div>
    </div>
    
    <!-- Required SDK imports -->
    <script src="/socket.io/socket.io.js"></script>
    <script src="/js/SessionSDK.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
    
    <script>
        class MyGame {
            constructor() {
                this.canvas = document.getElementById('gameCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.gameState = 'waiting'; // waiting, playing, paused, ended
                
                this.setupCanvas();
                this.setupSDK();
                this.setupKeyboardControls(); // For testing
                this.startGameLoop();
            }
            
            setupCanvas() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                
                window.addEventListener('resize', () => {
                    this.canvas.width = window.innerWidth;
                    this.canvas.height = window.innerHeight;
                });
            }
            
            setupSDK() {
                this.sdk = new SessionSDK({
                    gameId: 'my-game', // Change this to match folder name
                    gameType: 'solo',  // 'solo', 'dual', 'multi'
                    debug: true
                });
                
                this.setupEvents();
            }
            
            setupEvents() {
                // CRITICAL: Wait for connection before creating session
                this.sdk.on('connected', () => {
                    console.log('✅ Connected to server');
                    this.createSession();
                });
                
                // CRITICAL: Use event.detail || event pattern
                this.sdk.on('session-created', (event) => {
                    const session = event.detail || event;
                    console.log('Session created:', session);
                    this.displaySessionInfo(session);
                });
                
                this.sdk.on('sensor-connected', (event) => {
                    const data = event.detail || event;
                    console.log('Sensor connected:', data.sensorId);
                    this.updateConnectionStatus('센서 연결됨');
                });
                
                this.sdk.on('sensor-data', (event) => {
                    const data = event.detail || event;
                    this.processSensorData(data);
                });
                
                this.sdk.on('game-ready', (event) => {
                    const data = event.detail || event;
                    console.log('Game ready');
                    this.startGame();
                });
                
                this.sdk.on('sensor-disconnected', (event) => {
                    const data = event.detail || event;
                    console.log('Sensor disconnected:', data.sensorId);
                    this.updateConnectionStatus('센서 연결 해제됨');
                });
            }
            
            async createSession() {
                try {
                    const session = await this.sdk.createSession();
                    console.log('Session created successfully');
                } catch (error) {
                    console.error('Failed to create session:', error);
                }
            }
            
            displaySessionInfo(session) {
                document.getElementById('sessionCode').textContent = session.sessionCode;
                
                const qrUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
                
                // CRITICAL: Safe QR code generation with fallback
                if (typeof QRCode !== 'undefined') {
                    const canvas = document.createElement('canvas');
                    QRCode.toCanvas(canvas, qrUrl, { width: 150 }, (error) => {
                        if (!error) {
                            document.getElementById('qrContainer').appendChild(canvas);
                        } else {
                            this.showQRCodeFallback(qrUrl);
                        }
                    });
                } else {
                    this.showQRCodeFallback(qrUrl);
                }
            }
            
            showQRCodeFallback(qrUrl) {
                const img = document.createElement('img');
                img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`;
                img.alt = 'QR Code';
                document.getElementById('qrContainer').appendChild(img);
            }
            
            processSensorData(sensorData) {
                if (!sensorData || !sensorData.data) return;
                
                const { orientation, acceleration } = sensorData.data;
                
                if (orientation) {
                    // Handle device tilt
                    const tiltX = Math.max(-90, Math.min(90, orientation.gamma || 0));
                    const tiltY = Math.max(-180, Math.min(180, orientation.beta || 0));
                    
                    // Implement your game logic here
                    this.handleTilt(tiltX, tiltY);
                }
                
                if (acceleration) {
                    // Handle shake detection
                    const totalAccel = Math.sqrt(
                        (acceleration.x || 0) ** 2 + 
                        (acceleration.y || 0) ** 2 + 
                        (acceleration.z || 0) ** 2
                    );
                    
                    if (totalAccel > 15) {
                        this.handleShake();
                    }
                }
            }
            
            handleTilt(tiltX, tiltY) {
                // Implement tilt-based game mechanics
                console.log('Tilt:', tiltX, tiltY);
            }
            
            handleShake() {
                // Implement shake-based game mechanics
                console.log('Shake detected!');
            }
            
            setupKeyboardControls() {
                // For testing without mobile device
                document.addEventListener('keydown', (e) => {
                    switch(e.key) {
                        case 'ArrowLeft':
                            this.handleTilt(-30, 0);
                            break;
                        case 'ArrowRight':
                            this.handleTilt(30, 0);
                            break;
                        case 'ArrowUp':
                            this.handleTilt(0, -30);
                            break;
                        case 'ArrowDown':
                            this.handleTilt(0, 30);
                            break;
                        case ' ':
                            this.handleShake();
                            break;
                    }
                });
            }
            
            startGame() {
                this.gameState = 'playing';
                console.log('Game started!');
            }
            
            update() {
                if (this.gameState !== 'playing') return;
                
                // Implement game logic updates here
            }
            
            render() {
                // Clear canvas
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Implement game rendering here
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Game Running', this.canvas.width/2, this.canvas.height/2);
            }
            
            startGameLoop() {
                const gameLoop = () => {
                    this.update();
                    this.render();
                    requestAnimationFrame(gameLoop);
                };
                gameLoop();
            }
            
            updateConnectionStatus(status) {
                document.getElementById('connectionStatus').textContent = status;
            }
        }
        
        // Global functions for UI controls
        let game;
        
        function resetGame() {
            if (game) {
                game.gameState = 'waiting';
                // Reset game state
            }
        }
        
        function togglePause() {
            if (game) {
                game.gameState = game.gameState === 'playing' ? 'paused' : 'playing';
            }
        }
        
        // Initialize game when page loads
        window.addEventListener('load', () => {
            game = new MyGame();
        });
    </script>
</body>
</html>
```

#### game.json (Optional but Recommended)
```json
{
  "id": "my-game",
  "title": "My Awesome Game",
  "description": "Description of your game<br>Use HTML for formatting",
  "category": "solo",
  "icon": "🎮",
  "version": "1.0.0",
  "author": "Your Name",
  "sensors": ["orientation", "motion"],
  "maxPlayers": 1,
  "difficulty": "medium",
  "status": "active",
  "featured": false,
  "tags": ["sensor", "tilt", "fun"],
  "instructions": [
    "Tilt your device to control the game",
    "Shake to perform special actions"
  ],
  "controls": {
    "tilt": "Move character",
    "shake": "Special action"
  }
}
```

### Step 3: Register Game
```bash
# Method 1: Restart server (automatic scan)
npm restart

# Method 2: API rescan (while server running)
curl -X POST http://localhost:3000/api/admin/rescan
```

### Step 4: Test and Deploy
1. Test locally at `http://localhost:3000`
2. Test with mobile device using QR code
3. Push to GitHub for automatic Render.com deployment

## Game Categories and Requirements

### Solo Games (`category: "solo"`)
- 1 player, 1 mobile device
- Simple, intuitive controls
- Focus on individual skill/achievement
- Examples: maze navigation, balance games

### Dual Games (`category: "dual"`)
- 2 players, 2 mobile devices
- Cooperative gameplay
- Shared objectives
- Examples: cooperative puzzles, balance challenges

### Multi Games (`category: "multi"`)
- 3-8 players, multiple devices
- Competitive gameplay
- Real-time synchronization
- Examples: racing, battle royale, collection games

## Performance Guidelines

### Sensor Data Throttling
```javascript
let lastSensorUpdate = 0;
const SENSOR_THROTTLE = 33; // 30fps

sdk.on('sensor-data', (event) => {
    const now = Date.now();
    if (now - lastSensorUpdate < SENSOR_THROTTLE) return;
    
    lastSensorUpdate = now;
    processSensorData(event.detail || event);
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

## Testing Checklist

### Local Testing
- [ ] Game loads without errors
- [ ] Session creation works
- [ ] QR code generates (test both library and fallback)
- [ ] Keyboard controls work for development
- [ ] UI elements display correctly
- [ ] Navigation back to hub works

### Mobile Testing
- [ ] QR code scanning works
- [ ] Sensor data is received
- [ ] Game responds to device tilt
- [ ] Game responds to device shake
- [ ] Performance is smooth (30+ FPS)
- [ ] Connection/disconnection handled gracefully

### Deployment Testing
- [ ] Game appears in hub after deployment
- [ ] All functionality works on live server
- [ ] Multiple players can connect (for multi games)
- [ ] No console errors in production