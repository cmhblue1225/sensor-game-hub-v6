# Development Standards & Best Practices

## 🚨 Critical Implementation Patterns

### 1. SessionSDK Event Handling (MANDATORY)
**Always use the `event.detail || event` pattern for ALL SessionSDK events:**

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

### 2. Server Connection Sequence (MANDATORY)
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

### 3. QR Code Generation with Fallback (MANDATORY)
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

## File Structure Requirements

### Game Directory Structure
```
public/games/[game-name]/
├── index.html          # Required - Main game file
├── game.json          # Optional - Game metadata
├── style.css          # Optional - Game-specific styles
└── script.js          # Optional - Separate JS file
```

### Required HTML Structure
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Title</title>
</head>
<body>
    <!-- Game content -->
    
    <!-- Required SDK imports -->
    <script src="/socket.io/socket.io.js"></script>
    <script src="/js/SessionSDK.js"></script>
    
    <script>
        // Game implementation
    </script>
</body>
</html>
```

## Code Quality Standards

### 1. Error Handling
- Always wrap SessionSDK calls in try-catch blocks
- Provide user-friendly error messages
- Log errors for debugging

### 2. Performance Optimization
- Use `requestAnimationFrame` for game loops
- Throttle sensor data processing (33ms intervals)
- Clean up event listeners on game end

### 3. UI/UX Guidelines
- Use existing CSS theme variables
- Implement responsive design
- Provide clear navigation back to hub (`href="/"`)
- Show connection status for multiplayer games

## Testing Requirements

### Local Testing
1. Test with keyboard controls (for development)
2. Test with actual mobile devices
3. Test connection/disconnection scenarios
4. Test with multiple players (for multiplayer games)

### Deployment Testing
1. Test on Render.com staging
2. Verify automatic game registration
3. Test QR code generation and scanning
4. Performance testing with real devices

## Documentation Standards

### Game Documentation
- Clear game instructions in `game.json`
- Control explanations
- Difficulty level indication
- Player count specification

### Code Documentation
- Comment complex sensor data processing
- Document game state management
- Explain custom algorithms or physics