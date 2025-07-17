/**
 * Session State Manager for 3D Racing Game
 * Manages game session state and communication with the hub
 */
class SessionStateManager {
    constructor() {
        this.sessionCode = null;
        this.gameState = 'waiting';
        this.players = {
            player1: { connected: false, ready: false, name: 'Player 1' },
            player2: { connected: false, ready: false, name: 'Player 2' }
        };
        this.gameMode = 'quick';
        this.raceResults = null;
        this.callbacks = {};
    }

    /**
     * Initialize session
     */
    init() {
        this.updateSessionDisplay();
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Game mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setGameMode(e.target.dataset.mode);
            });
        });

        // Control buttons
        document.getElementById('start-btn')?.addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('pause-btn')?.addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('hub-btn')?.addEventListener('click', () => {
            this.returnToHub();
        });
    }

    /**
     * Set game mode
     */
    setGameMode(mode) {
        this.gameMode = mode;
        document.getElementById('current-mode-display').textContent = this.getModeDisplayName(mode);
        
        // Hide mode selection modal
        document.getElementById('mode-selection').style.display = 'none';
        
        // Show tournament progress for best-of-3
        const tournamentProgress = document.getElementById('tournament-progress');
        if (mode === 'best-of-3') {
            tournamentProgress.style.display = 'block';
        } else {
            tournamentProgress.style.display = 'none';
        }
    }

    /**
     * Get display name for game mode
     */
    getModeDisplayName(mode) {
        const names = {
            'quick': '빠른 경주',
            'best-of-3': '베스트 오브 3',
            'time-attack': '타임 어택'
        };
        return names[mode] || mode;
    }

    /**
     * Update session display
     */
    updateSessionDisplay() {
        const sessionCodeEl = document.getElementById('session-code');
        if (sessionCodeEl) {
            sessionCodeEl.textContent = this.sessionCode ? 
                `Session: ${this.sessionCode}` : 'Session: Loading...';
        }

        // Update player status
        this.updatePlayerStatus();
    }

    /**
     * Update player status display
     */
    updatePlayerStatus() {
        ['player1', 'player2'].forEach((playerId, index) => {
            const player = this.players[playerId];
            const statusEl = document.getElementById(`${playerId}-status`);
            const connectionEl = document.getElementById(`p${index + 1}-connection-status`);
            
            if (statusEl) {
                const statusIcon = statusEl.querySelector('.status-icon');
                const playerName = statusEl.querySelector('.player-name');
                
                if (player.connected) {
                    statusIcon.textContent = '🟢';
                    playerName.textContent = player.ready ? '준비완료' : '연결됨';
                } else {
                    statusIcon.textContent = '⏳';
                    playerName.textContent = '대기중';
                }
            }

            if (connectionEl) {
                const dot = connectionEl.querySelector('.indicator-dot');
                const text = connectionEl.querySelector('.indicator-text');
                
                if (player.connected) {
                    dot.style.backgroundColor = '#4CAF50';
                    text.textContent = '연결됨';
                } else {
                    dot.style.backgroundColor = '#f44336';
                    text.textContent = '연결 대기';
                }
            }
        });

        // Update start button state
        this.updateStartButton();
    }

    /**
     * Update start button state
     */
    updateStartButton() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            const allConnected = Object.values(this.players).every(p => p.connected);
            startBtn.disabled = !allConnected || this.gameState !== 'waiting';
        }
    }

    /**
     * Set session code
     */
    setSessionCode(code) {
        this.sessionCode = code;
        this.updateSessionDisplay();
    }

    /**
     * Set player connection status
     */
    setPlayerConnection(playerId, connected) {
        if (this.players[playerId]) {
            this.players[playerId].connected = connected;
            this.updatePlayerStatus();
        }
    }

    /**
     * Set player ready status
     */
    setPlayerReady(playerId, ready) {
        if (this.players[playerId]) {
            this.players[playerId].ready = ready;
            this.updatePlayerStatus();
        }
    }

    /**
     * Start game
     */
    startGame() {
        if (this.gameState === 'waiting') {
            this.gameState = 'playing';
            this.trigger('gameStart', { mode: this.gameMode });
            
            // Hide loading screen
            document.getElementById('loading-screen').style.display = 'none';
        }
    }

    /**
     * Restart game
     */
    restartGame() {
        this.gameState = 'waiting';
        this.raceResults = null;
        this.trigger('gameRestart');
    }

    /**
     * Toggle pause
     */
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.trigger('gamePause');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.trigger('gameResume');
        }
    }

    /**
     * Return to hub
     */
    returnToHub() {
        if (typeof window.hubInterface !== 'undefined') {
            window.hubInterface.returnToHub();
        } else {
            window.location.href = '/';
        }
    }

    /**
     * Set game state
     */
    setGameState(state) {
        this.gameState = state;
        this.trigger('stateChange', { state });
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
     * Trigger event
     */
    trigger(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }
}

// Global session state manager
window.sessionStateManager = new SessionStateManager();