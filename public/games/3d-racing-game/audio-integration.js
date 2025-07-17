/**
 * Audio Integration for 3D Racing Game
 * Integrates audio manager with game events
 */
class AudioIntegration {
    constructor() {
        this.initialized = false;
        this.gameStarted = false;
    }

    /**
     * Initialize audio integration
     */
    async init() {
        try {
            await window.audioManager.init();
            this.setupGameEventListeners();
            this.setupUserInteractionListeners();
            this.initialized = true;
            console.log('Audio integration initialized');
        } catch (error) {
            console.warn('Audio integration failed:', error);
        }
    }

    /**
     * Setup game event listeners
     */
    setupGameEventListeners() {
        if (!window.sessionStateManager) return;

        // Game start
        window.sessionStateManager.on('gameStart', () => {
            this.onGameStart();
        });

        // Game restart
        window.sessionStateManager.on('gameRestart', () => {
            this.onGameRestart();
        });

        // Game pause
        window.sessionStateManager.on('gamePause', () => {
            this.onGamePause();
        });

        // Game resume
        window.sessionStateManager.on('gameResume', () => {
            this.onGameResume();
        });
    }

    /**
     * Setup user interaction listeners to resume audio context
     */
    setupUserInteractionListeners() {
        const resumeAudio = async () => {
            if (window.audioManager) {
                await window.audioManager.resume();
            }
        };

        // Resume audio on user interaction
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
        document.addEventListener('keydown', resumeAudio, { once: true });
    }

    /**
     * Handle game start
     */
    onGameStart() {
        if (!this.initialized) return;

        this.gameStarted = true;
        
        // Start engine sounds for both players
        window.audioManager.createEngineSound('player1');
        window.audioManager.createEngineSound('player2');

        // Play countdown
        this.playCountdown();
    }

    /**
     * Handle game restart
     */
    onGameRestart() {
        if (!this.initialized) return;

        // Stop all engine sounds
        window.audioManager.stopEngineSound('player1');
        window.audioManager.stopEngineSound('player2');

        this.gameStarted = false;
    }

    /**
     * Handle game pause
     */
    onGamePause() {
        if (!this.initialized) return;

        // Mute engine sounds
        window.audioManager.updateEngineSound('player1', 0, 0);
        window.audioManager.updateEngineSound('player2', 0, 0);
    }

    /**
     * Handle game resume
     */
    onGameResume() {
        if (!this.initialized) return;

        // Engine sounds will be updated by game loop
    }

    /**
     * Play countdown sequence
     */
    playCountdown() {
        if (!this.initialized) return;

        let count = 3;
        const countdownInterval = setInterval(() => {
            window.audioManager.playCountdown(count);
            count--;
            
            if (count < 0) {
                clearInterval(countdownInterval);
                // Play start sound
                window.audioManager.playCountdown(0);
            }
        }, 1000);
    }

    /**
     * Update player audio based on game state
     */
    updatePlayerAudio(playerId, speed, throttle = 0) {
        if (!this.initialized || !this.gameStarted) return;

        window.audioManager.updateEngineSound(playerId, speed, throttle);
    }

    /**
     * Play lap completion sound
     */
    playLapComplete() {
        if (!this.initialized) return;

        window.audioManager.playTone(600, 0.3, 0.5);
        setTimeout(() => {
            window.audioManager.playTone(800, 0.3, 0.5);
        }, 100);
    }

    /**
     * Play race finish sound
     */
    playRaceFinish(position) {
        if (!this.initialized) return;

        if (position === 1) {
            // Victory sound
            window.audioManager.playTone(800, 0.5, 0.7);
            setTimeout(() => {
                window.audioManager.playTone(1000, 0.5, 0.7);
            }, 200);
            setTimeout(() => {
                window.audioManager.playTone(1200, 0.8, 0.7);
            }, 400);
        } else {
            // Finish sound
            window.audioManager.playTone(400, 0.8, 0.5);
        }
    }

    /**
     * Play collision sound
     */
    playCollision(intensity = 0.5) {
        if (!this.initialized) return;

        const frequency = 200 + Math.random() * 100;
        window.audioManager.playTone(frequency, 0.2, intensity * 0.8);
    }

    /**
     * Play boost sound
     */
    playBoost() {
        if (!this.initialized) return;

        window.audioManager.playTone(400, 0.5, 0.4);
        setTimeout(() => {
            window.audioManager.playTone(600, 0.3, 0.4);
        }, 100);
    }

    /**
     * Set volume levels
     */
    setVolume(type, value) {
        if (!this.initialized) return;

        switch (type) {
            case 'master':
                window.audioManager.setMasterVolume(value);
                break;
            case 'music':
                window.audioManager.setMusicVolume(value);
                break;
            case 'effects':
                window.audioManager.setEffectsVolume(value);
                break;
        }
    }

    /**
     * Toggle audio on/off
     */
    toggleAudio() {
        if (!this.initialized) return;

        const currentVolume = window.audioManager.masterVolume;
        window.audioManager.setMasterVolume(currentVolume > 0 ? 0 : 0.7);
    }
}

// Global audio integration
window.audioIntegration = new AudioIntegration();