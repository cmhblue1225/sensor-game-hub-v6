/**
 * Hub Communication Interface for 3D Racing Game
 * Handles communication between game and hub system
 */
class HubCommunicationInterface {
    constructor() {
        this.connected = false;
        this.sessionCode = null;
        this.socket = null;
        this.gameState = 'initializing';
        this.players = {};
        this.callbacks = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.heartbeatInterval = null;
    }

    /**
     * Initialize hub communication
     */
    async init() {
        console.log('Initializing hub communication...');
        
        try {
            // Connect to hub
            await this.connect();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start heartbeat
            this.startHeartbeat();
            
            console.log('Hub communication initialized');
            return true;
            
        } catch (error) {
            console.error('Hub communication initialization failed:', error);
            return false;
        }
    }

    /**
     * Connect to hub
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // Use existing hub connection if available
                if (window.hubSocket) {
                    this.socket = window.hubSocket;
                    this.connected = true;
                    resolve();
                    return;
                }
                
                // Create new connection
                const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
                const socketUrl = `${protocol}//${location.host}`;
                
                this.socket = new WebSocket(socketUrl);
                
                this.socket.onopen = () => {
                    console.log('Connected to hub');
                    this.connected = true;
                    this.reconnectAttempts = 0;
                    
                    // Register as game client
                    this.send('register', {
                        type: 'game',
                        gameId: '3d-racing-game',
                        version: '1.0.0'
                    });
                    
                    resolve();
                };
                
                this.socket.onerror = (error) => {
                    console.error('Hub connection error:', error);
                    reject(error);
                };
                
                this.socket.onclose = () => {
                    this.connected = false;
                    this.handleDisconnection();
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Game state changes
        if (window.sessionStateManager) {
            window.sessionStateManager.on('gameStart', () => {
                this.send('gameStateUpdate', { state: 'playing' });
            });
            
            window.sessionStateManager.on('gameRestart', () => {
                this.send('gameStateUpdate', { state: 'restarting' });
            });
            
            window.sessionStateManager.on('gamePause', () => {
                this.send('gameStateUpdate', { state: 'paused' });
            });
            
            window.sessionStateManager.on('gameResume', () => {
                this.send('gameStateUpdate', { state: 'playing' });
            });
        }
        
        // Window beforeunload
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
    }

    /**
     * Handle incoming messages
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'sessionCreated':
                    this.handleSessionCreated(message.data);
                    break;
                    
                case 'playerConnected':
                    this.handlePlayerConnected(message.data);
                    break;
                    
                case 'playerDisconnected':
                    this.handlePlayerDisconnected(message.data);
                    break;
                    
                case 'sensorData':
                    this.handleSensorData(message.data);
                    break;
                    
                case 'gameCommand':
                    this.handleGameCommand(message.data);
                    break;
                    
                case 'heartbeat':
                    this.handleHeartbeat(message.data);
                    break;
                    
                default:
                    console.log('Unknown message type:', message.type);
            }
            
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    /**
     * Handle session created
     */
    handleSessionCreated(data) {
        this.sessionCode = data.sessionCode;
        
        if (window.sessionStateManager) {
            window.sessionStateManager.setSessionCode(this.sessionCode);
        }
        
        this.trigger('sessionCreated', data);
    }

    /**
     * Handle player connected
     */
    handlePlayerConnected(data) {
        this.players[data.playerId] = data;
        
        if (window.sessionStateManager) {
            window.sessionStateManager.setPlayerConnection(data.playerId, true);
        }
        
        this.trigger('playerConnected', data);
    }

    /**
     * Handle player disconnected
     */
    handlePlayerDisconnected(data) {
        delete this.players[data.playerId];
        
        if (window.sessionStateManager) {
            window.sessionStateManager.setPlayerConnection(data.playerId, false);
        }
        
        this.trigger('playerDisconnected', data);
    }

    /**
     * Handle sensor data
     */
    handleSensorData(data) {
        // Forward sensor data to game
        if (window.raceGame && window.raceGame.updateSensorData) {
            window.raceGame.updateSensorData(data);
        }
        
        this.trigger('sensorData', data);
    }

    /**
     * Handle game command
     */
    handleGameCommand(data) {
        switch (data.command) {
            case 'start':
                if (window.sessionStateManager) {
                    window.sessionStateManager.startGame();
                }
                break;
                
            case 'pause':
                if (window.sessionStateManager) {
                    window.sessionStateManager.togglePause();
                }
                break;
                
            case 'restart':
                if (window.sessionStateManager) {
                    window.sessionStateManager.restartGame();
                }
                break;
                
            case 'returnToHub':
                this.returnToHub();
                break;
        }
        
        this.trigger('gameCommand', data);
    }

    /**
     * Handle heartbeat
     */
    handleHeartbeat(data) {
        // Respond to heartbeat
        this.send('heartbeat', { timestamp: Date.now() });
    }

    /**
     * Handle disconnection
     */
    handleDisconnection() {
        console.log('Disconnected from hub');
        this.connected = false;
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        // Attempt to reconnect
        this.attemptReconnect();
        
        this.trigger('disconnected');
    }

    /**
     * Attempt to reconnect
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection failed:', error);
                this.attemptReconnect();
            });
        }, 1000 * this.reconnectAttempts); // Exponential backoff
    }

    /**
     * Start heartbeat
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.connected) {
                this.send('heartbeat', { timestamp: Date.now() });
            }
        }, 30000); // 30 second heartbeat
    }

    /**
     * Send message to hub
     */
    send(type, data) {
        if (!this.connected || !this.socket) {
            console.warn('Cannot send message - not connected to hub');
            return false;
        }
        
        try {
            const message = {
                type: type,
                data: data,
                timestamp: Date.now()
            };
            
            this.socket.send(JSON.stringify(message));
            return true;
            
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }

    /**
     * Request session creation
     */
    requestSession() {
        return this.send('requestSession', {
            gameId: '3d-racing-game',
            gameType: 'dual',
            requiredPlayers: 2
        });
    }

    /**
     * Update game state
     */
    updateGameState(state, data = {}) {
        this.gameState = state;
        return this.send('gameStateUpdate', { state, ...data });
    }

    /**
     * Send game results
     */
    sendResults(results) {
        return this.send('gameResults', results);
    }

    /**
     * Return to hub
     */
    returnToHub() {
        if (this.connected) {
            this.send('returnToHub', {});
        }
        
        // Navigate to hub
        setTimeout(() => {
            window.location.href = '/';
        }, 500);
    }

    /**
     * Disconnect from hub
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.connected = false;
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Trigger event
     */
    trigger(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event callback:', error);
                }
            });
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.connected,
            sessionCode: this.sessionCode,
            players: this.players,
            gameState: this.gameState,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Global hub communication interface
window.hubInterface = new HubCommunicationInterface();