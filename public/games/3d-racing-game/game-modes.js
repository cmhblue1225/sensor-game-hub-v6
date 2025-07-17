/**
 * Game Modes for 3D Racing Game
 * Defines different game modes and their configurations
 */
class GameModes {
    constructor() {
        this.modes = {
            quick: {
                name: '빠른 경주',
                description: '3랩 빠른 경주',
                laps: 3,
                timeLimit: null,
                bestOf: 1,
                scoring: 'position',
                features: ['lap_times', 'position_tracking'],
                config: {
                    enableCollisions: true,
                    enableBoosts: false,
                    enablePowerups: false,
                    trackDifficulty: 'normal'
                }
            },
            
            'best-of-3': {
                name: '베스트 오브 3',
                description: '3경주 중 2승 먼저 달성',
                laps: 3,
                timeLimit: null,
                bestOf: 3,
                scoring: 'series',
                features: ['series_tracking', 'tournament_display'],
                config: {
                    enableCollisions: true,
                    enableBoosts: true,
                    enablePowerups: false,
                    trackDifficulty: 'normal'
                }
            },
            
            'time-attack': {
                name: '타임 어택',
                description: '제한 시간 내 최고 기록 달성',
                laps: 999, // Unlimited laps
                timeLimit: 120, // 2 minutes
                bestOf: 1,
                scoring: 'time',
                features: ['time_limit', 'best_lap_tracking'],
                config: {
                    enableCollisions: false,
                    enableBoosts: true,
                    enablePowerups: true,
                    trackDifficulty: 'easy'
                }
            }
        };
        
        this.currentMode = 'quick';
        this.gameState = {
            mode: null,
            race: 1,
            totalRaces: 1,
            scores: { player1: 0, player2: 0 },
            currentRaceResult: null,
            seriesComplete: false
        };
    }

    /**
     * Get available game modes
     */
    getAvailableModes() {
        return Object.keys(this.modes).map(key => ({
            id: key,
            ...this.modes[key]
        }));
    }

    /**
     * Get mode configuration
     */
    getModeConfig(modeId) {
        return this.modes[modeId] || this.modes.quick;
    }

    /**
     * Set current game mode
     */
    setMode(modeId) {
        if (!this.modes[modeId]) {
            console.error('Invalid game mode:', modeId);
            return false;
        }
        
        this.currentMode = modeId;
        const mode = this.modes[modeId];
        
        // Reset game state
        this.gameState = {
            mode: modeId,
            race: 1,
            totalRaces: mode.bestOf,
            scores: { player1: 0, player2: 0 },
            currentRaceResult: null,
            seriesComplete: false
        };
        
        // Update UI
        this.updateModeDisplay(mode);
        
        return true;
    }

    /**
     * Update mode display
     */
    updateModeDisplay(mode) {
        const modeDisplay = document.getElementById('current-mode-display');
        if (modeDisplay) {
            modeDisplay.textContent = mode.name;
        }
        
        // Update tournament progress for best-of-3
        const tournamentProgress = document.getElementById('tournament-progress');
        if (tournamentProgress) {
            if (mode.bestOf > 1) {
                tournamentProgress.style.display = 'block';
                this.updateTournamentDisplay();
            } else {
                tournamentProgress.style.display = 'none';
            }
        }
    }

    /**
     * Update tournament display
     */
    updateTournamentDisplay() {
        const raceProgress = document.getElementById('race-progress');
        const seriesScore = document.getElementById('series-score');
        
        if (raceProgress) {
            raceProgress.textContent = `경주 ${this.gameState.race}/${this.gameState.totalRaces}`;
        }
        
        if (seriesScore) {
            seriesScore.textContent = `P1: ${this.gameState.scores.player1}승 | P2: ${this.gameState.scores.player2}승`;
        }
    }

    /**
     * Start race
     */
    startRace() {
        const mode = this.modes[this.currentMode];
        
        return {
            mode: this.currentMode,
            laps: mode.laps,
            timeLimit: mode.timeLimit,
            config: mode.config,
            raceNumber: this.gameState.race,
            totalRaces: this.gameState.totalRaces
        };
    }

    /**
     * Finish race
     */
    finishRace(results) {
        const mode = this.modes[this.currentMode];
        this.gameState.currentRaceResult = results;
        
        // Update scores based on mode
        switch (mode.scoring) {
            case 'position':
                this.handlePositionScoring(results);
                break;
            case 'series':
                this.handleSeriesScoring(results);
                break;
            case 'time':
                this.handleTimeScoring(results);
                break;
        }
        
        // Check if series is complete
        if (mode.bestOf > 1) {
            this.checkSeriesComplete();
        }
        
        return this.getSeriesStatus();
    }

    /**
     * Handle position scoring
     */
    handlePositionScoring(results) {
        // Simple position-based scoring
        const winner = results.winner;
        if (winner === 'player1') {
            this.gameState.scores.player1++;
        } else if (winner === 'player2') {
            this.gameState.scores.player2++;
        }
    }

    /**
     * Handle series scoring
     */
    handleSeriesScoring(results) {
        const winner = results.winner;
        if (winner === 'player1') {
            this.gameState.scores.player1++;
        } else if (winner === 'player2') {
            this.gameState.scores.player2++;
        }
        
        // Update tournament display
        this.updateTournamentDisplay();
    }

    /**
     * Handle time scoring
     */
    handleTimeScoring(results) {
        // In time attack, track best times
        if (!this.gameState.bestTimes) {
            this.gameState.bestTimes = { player1: null, player2: null };
        }
        
        ['player1', 'player2'].forEach(playerId => {
            const playerResult = results.players[playerId];
            if (playerResult && playerResult.bestLap) {
                if (!this.gameState.bestTimes[playerId] || 
                    playerResult.bestLap < this.gameState.bestTimes[playerId]) {
                    this.gameState.bestTimes[playerId] = playerResult.bestLap;
                }
            }
        });
    }

    /**
     * Check if series is complete
     */
    checkSeriesComplete() {
        const mode = this.modes[this.currentMode];
        const winCondition = Math.ceil(mode.bestOf / 2); // Majority wins
        
        if (this.gameState.scores.player1 >= winCondition || 
            this.gameState.scores.player2 >= winCondition) {
            this.gameState.seriesComplete = true;
        } else if (this.gameState.race >= mode.bestOf) {
            this.gameState.seriesComplete = true;
        }
    }

    /**
     * Get series status
     */
    getSeriesStatus() {
        return {
            complete: this.gameState.seriesComplete,
            winner: this.getSeriesWinner(),
            race: this.gameState.race,
            totalRaces: this.gameState.totalRaces,
            scores: { ...this.gameState.scores },
            canContinue: !this.gameState.seriesComplete && this.gameState.race < this.gameState.totalRaces
        };
    }

    /**
     * Get series winner
     */
    getSeriesWinner() {
        if (!this.gameState.seriesComplete) return null;
        
        const mode = this.modes[this.currentMode];
        
        switch (mode.scoring) {
            case 'series':
                return this.gameState.scores.player1 > this.gameState.scores.player2 ? 'player1' : 'player2';
            case 'time':
                // Winner has best time
                if (this.gameState.bestTimes?.player1 && this.gameState.bestTimes?.player2) {
                    return this.gameState.bestTimes.player1 < this.gameState.bestTimes.player2 ? 'player1' : 'player2';
                }
                return null;
            default:
                return this.gameState.scores.player1 > this.gameState.scores.player2 ? 'player1' : 'player2';
        }
    }

    /**
     * Advance to next race
     */
    nextRace() {
        if (this.gameState.seriesComplete) {
            console.warn('Series is already complete');
            return false;
        }
        
        this.gameState.race++;
        this.gameState.currentRaceResult = null;
        
        // Update display
        this.updateTournamentDisplay();
        
        return true;
    }

    /**
     * Reset series
     */
    resetSeries() {
        const mode = this.modes[this.currentMode];
        
        this.gameState = {
            mode: this.currentMode,
            race: 1,
            totalRaces: mode.bestOf,
            scores: { player1: 0, player2: 0 },
            currentRaceResult: null,
            seriesComplete: false
        };
        
        // Reset best times for time attack
        if (mode.scoring === 'time') {
            this.gameState.bestTimes = { player1: null, player2: null };
        }
        
        // Update display
        this.updateTournamentDisplay();
    }

    /**
     * Get current mode info
     */
    getCurrentModeInfo() {
        const mode = this.modes[this.currentMode];
        return {
            id: this.currentMode,
            ...mode,
            gameState: { ...this.gameState }
        };
    }

    /**
     * Get race configuration
     */
    getRaceConfig() {
        const mode = this.modes[this.currentMode];
        return {
            laps: mode.laps,
            timeLimit: mode.timeLimit,
            config: { ...mode.config }
        };
    }

    /**
     * Is time attack mode
     */
    isTimeAttack() {
        return this.currentMode === 'time-attack';
    }

    /**
     * Is best of series
     */
    isBestOfSeries() {
        return this.modes[this.currentMode].bestOf > 1;
    }

    /**
     * Get time remaining (for time attack)
     */
    getTimeRemaining(startTime) {
        const mode = this.modes[this.currentMode];
        if (!mode.timeLimit) return null;
        
        const elapsed = (Date.now() - startTime) / 1000;
        return Math.max(0, mode.timeLimit - elapsed);
    }
}

// Global game modes instance
window.gameModes = new GameModes();