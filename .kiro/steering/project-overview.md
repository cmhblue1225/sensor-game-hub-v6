# Sensor Game Hub v6.0 - Project Overview

## Project Identity
This is **Sensor Game Hub v6.0**, a mobile sensor-based gaming platform that allows developers to create interactive games using device orientation and motion sensors.

## Core Technology Stack
- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: HTML5 + Canvas + SessionSDK
- **Sensors**: DeviceOrientationEvent, DeviceMotionEvent (iOS/Android)
- **Deployment**: Render.com (automatic deployment)

## Project Structure
```
sensor-game-hub-v6/
├── server/                 # Server code
│   ├── index.js            # Main server
│   ├── SessionManager.js   # Session management
│   └── GameScanner.js      # Automatic game scanning
├── public/                 # Client files
│   ├── js/SessionSDK.js    # Game development SDK
│   ├── sensor.html         # Mobile sensor client
│   └── games/              # Games directory 📁
│       ├── solo/           # Solo game example
│       ├── dual/           # Dual game example
│       └── multi/          # Multiplayer game example
└── DEVELOPER_GUIDE.md      # Development guide
```

## Key Features
- **Automatic Game Registration**: Games added to `public/games/[game-name]/` are automatically detected
- **SessionSDK**: Unified SDK for sensor data handling and session management
- **Multi-platform Support**: Works on iOS and Android mobile browsers
- **Real-time Communication**: Socket.IO for real-time sensor data transmission

## Development Workflow
1. Create game folder in `public/games/[game-name]/`
2. Add `index.html` (required) and `game.json` (optional)
3. Implement game using SessionSDK
4. Server automatically detects and registers the game
5. Deploy to Render.com for testing and production

## Deployment Environment
- **Platform**: Render.com
- **Auto-deployment**: Connected to GitHub repository
- **Environment**: Production-ready with automatic scaling
- **Testing**: Live testing available at deployed URL