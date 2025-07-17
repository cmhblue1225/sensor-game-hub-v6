/**
 * Hub Session Integration for 3D Racing Game
 * Integrates the game with the hub's session management system
 */
class HubSessionIntegration {
    constructor() {
        this.sessionSDK = null;
        this.gameConfig = null;
        this.initialized = false;
        this.qrCode = null;
    }

    /**
     * Initialize session integration
     */
    async init() {
        console.log('Initializing session integration...');
        
        try {
            // Wait for SessionSDK to load
            await this.waitForSessionSDK();
            
            // Load game configuration
            await this.loadGameConfig();
            
            // Initialize SessionSDK
            await this.initializeSessionSDK();
            
            // Setup QR code display
            this.setupQRCode();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.initialized = true;
            console.log('Session integration initialized');
            
        } catch (error) {
            console.error('Session integration initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Wait for SessionSDK to load
     */
    async waitForSessionSDK() {
        return new Promise((resolve, reject) => {
            const checkSDK = () => {
                if (typeof window.SessionSDK !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkSDK, 100);
                }
            };
            
            checkSDK();
            
            // Timeout after 10 seconds
            setTimeout(() => {
                reject(new Error('SessionSDK failed to load'));
            }, 10000);
        });
    }

    /**
     * Load game configuration
     */
    async loadGameConfig() {
        try {
            const response = await fetch('./game.json');
            this.gameConfig = await response.json();
            console.log('Game config loaded:', this.gameConfig);
        } catch (error) {
            console.warn('Failed to load game config, using defaults');
            this.gameConfig = {
                name: "3D Racing Game",
                type: "dual",
                requiredPlayers: 2,
                maxPlayers: 2,
                description: "3D racing game with dual player support"
            };
        }
    }

    /**
     * Initialize SessionSDK
     */
    async initializeSessionSDK() {
        this.sessionSDK = new window.SessionSDK({
            gameId: '3d-racing-game',
            gameType: this.gameConfig.type,
            requiredPlayers: this.gameConfig.requiredPlayers,
            maxPlayers: this.gameConfig.maxPlayers,
            onSessionCreated: (sessionCode) => {
                this.handleSessionCreated(sessionCode);
            },
            onPlayerConnected: (playerId, playerData) => {
                this.handlePlayerConnected(playerId, playerData);
            },
            onPlayerDisconnected: (playerId) => {
                this.handlePlayerDisconnected(playerId);
            },
            onSensorData: (playerId, sensorData) => {
                this.handleSensorData(playerId, sensorData);
            },
            onSessionEnded: () => {
                this.handleSessionEnded();
            },
            onError: (error) => {
                this.handleSDKError(error);
            }
        });

        await this.sessionSDK.init();
    }

    /**
     * Setup QR code display
     */
    setupQRCode() {
        const qrCanvas = document.getElementById('qr-canvas');
        const qrFallback = document.getElementById('qr-fallback');
        
        if (!qrCanvas) {
            console.warn('QR canvas not found');
            return;
        }

        // Show fallback if QR generation fails
        if (qrFallback) {
            qrFallback.style.display = 'block';
            qrCanvas.style.display = 'none';
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Game state events
        if (window.sessionStateManager) {
            window.sessionStateManager.on('gameStart', () => {
                this.sessionSDK?.sendGameState('playing');
            });
            
            window.sessionStateManager.on('gameRestart', () => {
                this.sessionSDK?.sendGameState('restarting');
            });
            
            window.sessionStateManager.on('gamePause', () => {
                this.sessionSDK?.sendGameState('paused');
            });
            
            window.sessionStateManager.on('gameResume', () => {
                this.sessionSDK?.sendGameState('playing');
            });
        }

        // Hub interface events
        if (window.hubInterface) {
            window.hubInterface.on('sessionCreated', (data) => {
                this.handleSessionCreated(data.sessionCode);
            });
        }
    }

    /**
     * Handle session created
     */
    handleSessionCreated(sessionCode) {
        console.log('Session created:', sessionCode);
        
        // Update UI
        if (window.sessionStateManager) {
            window.sessionStateManager.setSessionCode(sessionCode);
        }
        
        // Generate QR code
        this.generateQRCode(sessionCode);
        
        // Update connection status
        this.updateConnectionStatus('waiting');
    }

    /**
     * Handle player connected
     */
    handlePlayerConnected(playerId, playerData) {
        console.log('Player connected:', playerId, playerData);
        
        // Update session state
        if (window.sessionStateManager) {
            window.sessionStateManager.setPlayerConnection(playerId, true);
        }
        
        // Update UI
        this.updatePlayerUI(playerId, true);
        
        // Check if ready to start
        this.checkReadyToStart();
    }

    /**
     * Handle player disconnected
     */
    handlePlayerDisconnected(playerId) {
        console.log('Player disconnected:', playerId);
        
        // Update session state
        if (window.sessionStateManager) {
            window.sessionStateManager.setPlayerConnection(playerId, false);
        }
        
        // Update UI
        this.updatePlayerUI(playerId, false);
        
        // Pause game if playing
        if (window.sessionStateManager && window.sessionStateManager.gameState === 'playing') {
            window.sessionStateManager.togglePause();
        }
    }

    /**
     * Handle sensor data
     */
    handleSensorData(playerId, sensorData) {
        // Forward to game
        if (window.raceGame && window.raceGame.updateSensorData) {
            window.raceGame.updateSensorData({
                playerId: playerId,
                ...sensorData
            });
        }
    }

    /**
     * Handle session ended
     */
    handleSessionEnded() {
        console.log('Session ended');
        
        // Update UI
        this.updateConnectionStatus('disconnected');
        
        // Reset game state
        if (window.sessionStateManager) {
            window.sessionStateManager.restartGame();
        }
    }

    /**
     * Handle SDK error
     */
    handleSDKError(error) {
        console.error('SessionSDK error:', error);
        
        // Show error message
        this.showErrorMessage('연결 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        
        // Update connection status
        this.updateConnectionStatus('error');
    }

    /**
     * Handle initialization error
     */
    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        // Show fallback UI
        this.showFallbackUI();
        
        // Try to connect directly to hub
        if (window.hubInterface) {
            window.hubInterface.init().then(() => {
                window.hubInterface.requestSession();
            });
        }
    }

    /**
     * Generate QR code
     */
    generateQRCode(sessionCode) {
        try {
            // Use SessionSDK's QR generation if available
            if (this.sessionSDK && this.sessionSDK.generateQRCode) {
                const qrCanvas = document.getElementById('qr-canvas');
                if (qrCanvas) {
                    this.sessionSDK.generateQRCode(sessionCode, qrCanvas);
                }
            } else {
                // Fallback: show session code
                this.showSessionCodeFallback(sessionCode);
            }
        } catch (error) {
            console.error('QR code generation failed:', error);
            this.showSessionCodeFallback(sessionCode);
        }
    }

    /**
     * Show session code fallback
     */
    showSessionCodeFallback(sessionCode) {
        const qrCanvas = document.getElementById('qr-canvas');
        const qrFallback = document.getElementById('qr-fallback');
        
        if (qrCanvas) qrCanvas.style.display = 'none';
        if (qrFallback) {
            qrFallback.style.display = 'block';
            qrFallback.textContent = sessionCode;
        }
    }

    /**
     * Update connection status
     */
    updateConnectionStatus(status) {
        const statusEl = document.getElementById('connection-status');
        if (!statusEl) return;
        
        const indicator = statusEl.querySelector('.status-text');
        if (!indicator) return;
        
        switch (status) {
            case 'waiting':
                indicator.textContent = '대기중';
                indicator.className = 'status-text waiting';
                break;
            case 'connected':
                indicator.textContent = '연결됨';
                indicator.className = 'status-text connected';
                break;
            case 'disconnected':
                indicator.textContent = '연결 끊김';
                indicator.className = 'status-text disconnected';
                break;
            case 'error':
                indicator.textContent = '오류';
                indicator.className = 'status-text error';
                break;
        }
    }

    /**
     * Update player UI
     */
    updatePlayerUI(playerId, connected) {
        const statusEl = document.getElementById(`${playerId}-status`);
        if (!statusEl) return;
        
        const icon = statusEl.querySelector('.status-icon');
        const name = statusEl.querySelector('.player-name');
        
        if (connected) {
            icon.textContent = '🟢';
            name.textContent = '연결됨';
        } else {
            icon.textContent = '⏳';
            name.textContent = '대기중';
        }
    }

    /**
     * Check if ready to start
     */
    checkReadyToStart() {
        if (!this.sessionSDK) return;
        
        const connectedPlayers = this.sessionSDK.getConnectedPlayers();
        const requiredPlayers = this.gameConfig.requiredPlayers;
        
        if (connectedPlayers.length >= requiredPlayers) {
            // Enable start button
            const startBtn = document.getElementById('start-btn');
            if (startBtn) {
                startBtn.disabled = false;
            }
            
            // Hide loading screen
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        // Create error modal or update existing UI
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h3>오류</h3>
                <p>${message}</p>
                <button onclick="location.reload()">새로고침</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    /**
     * Show fallback UI
     */
    showFallbackUI() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            const content = loadingScreen.querySelector('.loading-content');
            if (content) {
                content.innerHTML = `
                    <h2>연결 중...</h2>
                    <p>허브 시스템에 연결하는 중입니다...</p>
                    <div class="loading-spinner"></div>
                `;
            }
        }
    }

    /**
     * Get session info
     */
    getSessionInfo() {
        return {
            sessionCode: this.sessionSDK?.getSessionCode(),
            connectedPlayers: this.sessionSDK?.getConnectedPlayers() || [],
            gameState: window.sessionStateManager?.gameState || 'initializing',
            initialized: this.initialized
        };
    }
}

// Global session integration
window.sessionIntegration = new HubSessionIntegration();