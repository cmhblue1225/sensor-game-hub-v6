/**
 * 3D Racing Game - Main Game Controller
 * Sensor Game Hub v6.0 Platform Integration
 * 
 * 통합 검증 시스템 포함
 */

// 통합 검증 시스템 로드
if (typeof window.comprehensiveVerification === 'undefined') {
    const script = document.createElement('script');
    script.src = 'comprehensive-verification.js';
    script.onload = () => {
        console.log('🔍 통합 검증 시스템 로드 완료');
        
        // 개발 모드에서 자동 검증 실행 (선택사항)
        if (window.location.search.includes('debug=true')) {
            setTimeout(() => {
                console.log('🚀 디버그 모드: 자동 검증 시작');
                window.comprehensiveVerification.runComprehensiveVerification();
            }, 2000);
        }
    };
    document.head.appendChild(script);
}

/**
 * UIManager Class - Manages all UI elements and HUD updates
 * Handles player HUDs, session info, control panel, and notifications
 */
class UIManager {
    constructor() {
        this.elements = this.initializeElements();
        this.notifications = {
            player1: [],
            player2: []
        };
        this.isInitialized = false;
        
        // UI update intervals
        this.hudUpdateInterval = null;
        this.sessionUpdateInterval = null;
        
        // Initialize UI components
        this.initializeUI();
    }
    
    /**
     * Initialize all UI elements references
     * @returns {Object} Object containing all UI element references
     */
    initializeElements() {
        return {
            // Session Info Elements
            sessionCode: document.getElementById('session-code'),
            qrCanvas: document.getElementById('qr-canvas'),
            qrFallback: document.getElementById('qr-fallback'),
            connectionIndicator: document.getElementById('connection-indicator'),
            player1Status: document.getElementById('player1-status'),
            player2Status: document.getElementById('player2-status'),
            
            // Player 1 HUD Elements
            p1Lap: document.getElementById('p1-lap'),
            p1Time: document.getElementById('p1-time'),
            p1Speed: document.getElementById('p1-speed'),
            p1Rank: document.getElementById('p1-rank'),
            p1Best: document.getElementById('p1-best'),
            p1Gap: document.getElementById('p1-gap'),
            p1ConnectionStatus: document.getElementById('p1-connection-status'),
            p1TrackPos: document.getElementById('p1-track-pos'),
            p1SpeedBar: document.getElementById('p1-speed-bar'),
            p1Notifications: document.getElementById('p1-notifications'),
            
            // Player 2 HUD Elements
            p2Lap: document.getElementById('p2-lap'),
            p2Time: document.getElementById('p2-time'),
            p2Speed: document.getElementById('p2-speed'),
            p2Rank: document.getElementById('p2-rank'),
            p2Best: document.getElementById('p2-best'),
            p2Gap: document.getElementById('p2-gap'),
            p2ConnectionStatus: document.getElementById('p2-connection-status'),
            p2TrackPos: document.getElementById('p2-track-pos'),
            p2SpeedBar: document.getElementById('p2-speed-bar'),
            p2Notifications: document.getElementById('p2-notifications'),
            
            // Control Panel Elements
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            hubBtn: document.getElementById('hub-btn'),
            
            // Game Mode Elements
            currentModeDisplay: document.getElementById('current-mode-display'),
            tournamentProgress: document.getElementById('tournament-progress'),
            raceProgress: document.getElementById('race-progress'),
            seriesScore: document.getElementById('series-score'),
            
            // Modal Elements
            modeSelection: document.getElementById('mode-selection'),
            loadingScreen: document.getElementById('loading-screen'),
            resultsModal: document.getElementById('results-modal'),
            resultsContent: document.getElementById('results-content')
        };
    }
    
    /**
     * Initialize UI components and event listeners
     */
    initializeUI() {
        this.setupControlPanelEvents();
        this.setupModeSelection();
        this.startUIUpdates();
        this.isInitialized = true;
        console.log('UIManager initialized');
    }
    
    /**
     * Setup control panel button event listeners
     */
    setupControlPanelEvents() {
        // Start button
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => {
                this.onStartRace();
            });
        }
        
        // Restart button
        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', () => {
                this.onRestartRace();
            });
        }
        
        // Pause button
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => {
                this.onPauseRace();
            });
        }
        
        // Hub button
        if (this.elements.hubBtn) {
            this.elements.hubBtn.addEventListener('click', () => {
                this.onReturnToHub();
            });
        }
    }
    
    /**
     * Setup game mode selection
     */
    setupModeSelection() {
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.getAttribute('data-mode');
                this.onModeSelected(mode);
            });
        });
    }
    
    /**
     * Start UI update intervals
     */
    startUIUpdates() {
        // Update HUD every 100ms for smooth updates
        this.hudUpdateInterval = setInterval(() => {
            this.updateHUD();
        }, 100);
        
        // Update session info every 1000ms
        this.sessionUpdateInterval = setInterval(() => {
            this.updateSessionInfo();
        }, 1000);
    }
    
    /**
     * Stop UI update intervals
     */
    stopUIUpdates() {
        if (this.hudUpdateInterval) {
            clearInterval(this.hudUpdateInterval);
            this.hudUpdateInterval = null;
        }
        
        if (this.sessionUpdateInterval) {
            clearInterval(this.sessionUpdateInterval);
            this.sessionUpdateInterval = null;
        }
    }
    
    /**
     * Update session information display
     * @param {Object} sessionData - Session information
     */
    updateSessionInfo(sessionData = {}) {
        // Update session code
        if (this.elements.sessionCode && sessionData.sessionCode) {
            this.elements.sessionCode.textContent = `Session: ${sessionData.sessionCode}`;
        }
        
        // Update connection status
        if (this.elements.connectionIndicator) {
            const connectedCount = sessionData.connectedSensors || 0;
            const statusText = connectedCount === 2 ? '준비됨' : `${connectedCount}/2 연결됨`;
            this.elements.connectionIndicator.innerHTML = 
                `연결 상태: <span class="status-text">${statusText}</span>`;
        }
        
        // Update player status indicators
        this.updatePlayerStatus('player1', sessionData.player1Connected || false);
        this.updatePlayerStatus('player2', sessionData.player2Connected || false);
        
        // Update QR code if needed
        if (sessionData.qrCodeData && this.elements.qrCanvas) {
            this.updateQRCode(sessionData.qrCodeData);
        }
    }
    
    /**
     * Update individual player status
     * @param {string} playerId - 'player1' or 'player2'
     * @param {boolean} connected - Connection status
     */
    updatePlayerStatus(playerId, connected) {
        const statusElement = this.elements[`${playerId}Status`];
        if (!statusElement) return;
        
        const statusIcon = connected ? '✓' : '⏳';
        const statusText = connected ? '연결됨' : '대기중';
        const playerNum = playerId === 'player1' ? '1' : '2';
        
        statusElement.innerHTML = `
            Player ${playerNum}: <span class="status-icon">${statusIcon}</span>
            <span class="player-name">${statusText}</span>
        `;
        
        // Update connection indicator in player screen
        const connectionElement = this.elements[`${playerId.charAt(0)}${playerId.slice(-1)}ConnectionStatus`];
        if (connectionElement) {
            const dot = connectionElement.querySelector('.indicator-dot');
            const text = connectionElement.querySelector('.indicator-text');
            
            if (dot) {
                dot.className = `indicator-dot ${connected ? '' : 'disconnected'}`;
            }
            if (text) {
                text.textContent = connected ? '연결됨' : '연결 끊김';
            }
        }
    }
    
    /**
     * Update QR code display
     * @param {string} qrData - QR code data or URL
     */
    updateQRCode(qrData) {
        // For now, show fallback text
        // In a real implementation, you would generate the actual QR code
        if (this.elements.qrFallback) {
            this.elements.qrFallback.style.display = 'block';
            this.elements.qrFallback.textContent = 'QR';
        }
        
        if (this.elements.qrCanvas) {
            this.elements.qrCanvas.style.display = 'none';
        }
    }
    
    /**
     * Update HUD for both players
     */
    updateHUD() {
        if (window.gameManager && window.gameManager.players) {
            this.updatePlayerHUD('player1', window.gameManager.players.player1);
            this.updatePlayerHUD('player2', window.gameManager.players.player2);
        }
    }
    
    /**
     * Update HUD for a specific player
     * @param {string} playerId - 'player1' or 'player2'
     * @param {Object} playerData - Player data object
     */
    updatePlayerHUD(playerId, playerData) {
        if (!playerData) return;
        
        const prefix = playerId === 'player1' ? 'p1' : 'p2';
        
        // Update lap information
        if (this.elements[`${prefix}Lap`]) {
            const currentLap = playerData.stats?.currentLap || 1;
            const totalLaps = playerData.stats?.totalLaps || 3;
            this.elements[`${prefix}Lap`].textContent = `${currentLap}/${totalLaps}`;
        }
        
        // Update lap time
        if (this.elements[`${prefix}Time`]) {
            const lapTime = playerData.stats?.lapTime || 0;
            this.elements[`${prefix}Time`].textContent = this.formatTime(lapTime);
        }
        
        // Update speed
        if (this.elements[`${prefix}Speed`]) {
            const speed = Math.round(playerData.car?.speed || 0);
            this.elements[`${prefix}Speed`].textContent = speed;
            
            // Update speed bar
            this.updateSpeedBar(prefix, speed, playerData.car?.maxSpeed || 200);
        }
        
        // Update rank
        if (this.elements[`${prefix}Rank`]) {
            const rank = playerData.stats?.position || (playerId === 'player1' ? 1 : 2);
            this.elements[`${prefix}Rank`].textContent = rank;
        }
        
        // Update best lap time
        if (this.elements[`${prefix}Best`]) {
            const bestLap = playerData.stats?.bestLap;
            this.elements[`${prefix}Best`].textContent = bestLap ? this.formatTime(bestLap) : '--:--';
        }
        
        // Update gap to other player
        if (this.elements[`${prefix}Gap`]) {
            const gap = this.calculateGap(playerId, playerData);
            this.elements[`${prefix}Gap`].textContent = gap;
        }
        
        // Update track position
        if (this.elements[`${prefix}TrackPos`]) {
            const trackPos = this.calculateTrackPosition(playerData);
            this.elements[`${prefix}TrackPos`].textContent = `${trackPos}%`;
        }
    }
    
    /**
     * Update speed bar visualization
     * @param {string} prefix - Player prefix ('p1' or 'p2')
     * @param {number} currentSpeed - Current speed
     * @param {number} maxSpeed - Maximum speed
     */
    updateSpeedBar(prefix, currentSpeed, maxSpeed) {
        const speedBar = this.elements[`${prefix}SpeedBar`];
        if (!speedBar) return;
        
        const speedFill = speedBar.querySelector('.speed-fill');
        if (speedFill) {
            const percentage = Math.min((currentSpeed / maxSpeed) * 100, 100);
            speedFill.style.width = `${percentage}%`;
        }
    }
    
    /**
     * Calculate gap between players
     * @param {string} playerId - Current player ID
     * @param {Object} playerData - Current player data
     * @returns {string} Formatted gap string
     */
    calculateGap(playerId, playerData) {
        if (!window.gameManager || !window.gameManager.players) return '+0.000';
        
        const otherPlayerId = playerId === 'player1' ? 'player2' : 'player1';
        const otherPlayer = window.gameManager.players[otherPlayerId];
        
        if (!otherPlayer || !otherPlayer.stats) return '+0.000';
        
        const currentTime = playerData.stats?.lapTime || 0;
        const otherTime = otherPlayer.stats?.lapTime || 0;
        const gap = currentTime - otherTime;
        
        const sign = gap >= 0 ? '+' : '';
        return `${sign}${gap.toFixed(3)}`;
    }
    
    /**
     * Calculate track position percentage
     * @param {Object} playerData - Player data
     * @returns {number} Track position percentage (0-100)
     */
    calculateTrackPosition(playerData) {
        if (!playerData.car || !window.gameManager.currentTrack) return 0;
        
        const playerZ = playerData.car.position?.z || 0;
        const trackLength = window.gameManager.currentTrack.totalLength || 20000;
        const lapLength = trackLength / (window.gameManager.currentTrack.laps || 3);
        
        const positionInLap = (playerZ % lapLength) / lapLength;
        return Math.round(positionInLap * 100);
    }
    
    /**
     * Format time in MM:SS.mmm format
     * @param {number} timeInSeconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
    
    /**
     * Show notification to a specific player
     * @param {string} playerId - 'player1' or 'player2'
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('info', 'warning', 'error', 'success')
     * @param {number} duration - Duration in milliseconds (default 3000)
     */
    showNotification(playerId, message, type = 'info', duration = 3000) {
        const prefix = playerId === 'player1' ? 'p1' : 'p2';
        const container = this.elements[`${prefix}Notifications`];
        
        if (!container) return;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to container
        container.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
        
        // Store in notifications array
        this.notifications[playerId].push({
            message,
            type,
            timestamp: Date.now()
        });
        
        // Keep only last 10 notifications
        if (this.notifications[playerId].length > 10) {
            this.notifications[playerId] = this.notifications[playerId].slice(-10);
        }
    }
    
    /**
     * Update game mode display
     * @param {string} mode - Current game mode
     * @param {Object} modeData - Additional mode data
     */
    updateGameMode(mode, modeData = {}) {
        const modeNames = {
            'quick': '빠른 경주',
            'best-of-3': '베스트 오브 3',
            'time-attack': '타임 어택'
        };
        
        if (this.elements.currentModeDisplay) {
            this.elements.currentModeDisplay.textContent = modeNames[mode] || mode;
        }
        
        // Update tournament progress for best-of-3 mode
        if (mode === 'best-of-3' && this.elements.tournamentProgress) {
            this.elements.tournamentProgress.style.display = 'block';
            
            if (this.elements.raceProgress) {
                const currentRace = modeData.currentRace || 1;
                const totalRaces = modeData.totalRaces || 3;
                this.elements.raceProgress.textContent = `경주 ${currentRace}/${totalRaces}`;
            }
            
            if (this.elements.seriesScore) {
                const p1Wins = modeData.player1Wins || 0;
                const p2Wins = modeData.player2Wins || 0;
                this.elements.seriesScore.textContent = `P1: ${p1Wins}승 | P2: ${p2Wins}승`;
            }
        } else if (this.elements.tournamentProgress) {
            this.elements.tournamentProgress.style.display = 'none';
        }
    }
    
    /**
     * Update control panel button states
     * @param {Object} buttonStates - Button state configuration
     */
    updateControlPanel(buttonStates = {}) {
        if (this.elements.startBtn) {
            this.elements.startBtn.disabled = buttonStates.startDisabled !== false;
            this.elements.startBtn.textContent = buttonStates.startText || 'Start Race';
        }
        
        if (this.elements.restartBtn) {
            this.elements.restartBtn.disabled = buttonStates.restartDisabled === true;
        }
        
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.disabled = buttonStates.pauseDisabled === true;
            this.elements.pauseBtn.textContent = buttonStates.pauseText || 'Pause';
        }
    }
    
    /**
     * Show loading screen
     * @param {string} message - Loading message
     */
    showLoadingScreen(message = '센서 연결을 기다리는 중...') {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.style.display = 'flex';
            const loadingText = this.elements.loadingScreen.querySelector('p');
            if (loadingText) {
                loadingText.textContent = message;
            }
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.style.display = 'none';
        }
    }
    
    /**
     * Show mode selection modal
     */
    showModeSelection() {
        if (this.elements.modeSelection) {
            this.elements.modeSelection.classList.add('show');
        }
    }
    
    /**
     * Hide mode selection modal
     */
    hideModeSelection() {
        if (this.elements.modeSelection) {
            this.elements.modeSelection.classList.remove('show');
        }
    }
    
    /**
     * Show results modal with race results
     * @param {Object} results - Race results data
     */
    showResults(results) {
        if (!this.elements.resultsModal || !this.elements.resultsContent) return;
        
        // Generate results HTML
        const resultsHTML = this.generateResultsHTML(results);
        this.elements.resultsContent.innerHTML = resultsHTML;
        
        // Show modal
        this.elements.resultsModal.classList.add('show');
    }
    
    /**
     * Hide results modal
     */
    hideResults() {
        if (this.elements.resultsModal) {
            this.elements.resultsModal.classList.remove('show');
        }
    }
    
    /**
     * Generate HTML for race results
     * @param {Object} results - Race results data
     * @returns {string} HTML string
     */
    generateResultsHTML(results) {
        let html = '';
        
        // Winner announcement
        if (results.winner) {
            html += `
                <div class="winner-announcement">
                    <h3>🏆 ${results.winner} 승리!</h3>
                </div>
            `;
        }
        
        // Mode information
        html += `
            <div class="mode-info">
                <h4>게임 모드</h4>
                <p>${results.mode || '빠른 경주'}</p>
            </div>
        `;
        
        // Race statistics
        if (results.players) {
            html += `
                <div class="race-stats">
                    <h4>경주 결과</h4>
            `;
            
            results.players.forEach((player, index) => {
                html += `
                    <div class="player-stats">
                        <h5>${index + 1}위 - ${player.name}</h5>
                        <p>최종 시간: ${this.formatTime(player.finalTime || 0)}</p>
                        <p>최고 랩: ${this.formatTime(player.bestLap || 0)}</p>
                        <p>평균 속도: ${Math.round(player.avgSpeed || 0)} km/h</p>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        // Achievements
        if (results.achievements && results.achievements.length > 0) {
            html += `
                <div class="achievements">
                    <h4>달성 기록</h4>
            `;
            
            results.achievements.forEach(achievement => {
                html += `
                    <div class="achievement">
                        <strong>${achievement.title}</strong>
                        <p>${achievement.description}</p>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        return html;
    }
    
    /**
     * Apply visual effect to player screen
     * @param {string} playerId - 'player1' or 'player2'
     * @param {string} effect - Effect name ('victory', 'collision', 'off-track')
     * @param {number} duration - Effect duration in milliseconds
     */
    applyVisualEffect(playerId, effect, duration = 1000) {
        const screenId = playerId === 'player1' ? 'left-screen' : 'right-screen';
        const screen = document.getElementById(screenId);
        
        if (!screen) return;
        
        // Add effect class
        screen.classList.add(`${effect}-effect`);
        
        // Remove effect after duration
        setTimeout(() => {
            screen.classList.remove(`${effect}-effect`);
        }, duration);
    }
    
    /**
     * Event handlers for control panel buttons
     */
    onStartRace() {
        if (window.gameManager && typeof window.gameManager.startRace === 'function') {
            window.gameManager.startRace();
        }
        console.log('Start race button clicked');
    }
    
    onRestartRace() {
        if (window.gameManager && typeof window.gameManager.restartRace === 'function') {
            window.gameManager.restartRace();
        }
        console.log('Restart race button clicked');
    }
    
    onPauseRace() {
        if (window.gameManager && typeof window.gameManager.pauseRace === 'function') {
            window.gameManager.pauseRace();
        }
        console.log('Pause race button clicked');
    }
    
    onReturnToHub() {
        // Check if running in hub environment
        if (window.parent && window.parent.returnToHub) {
            window.parent.returnToHub();
        } else {
            // Fallback to home page
            window.location.href = '/';
        }
        console.log('Return to hub button clicked');
    }
    
    onModeSelected(mode) {
        if (window.gameManager && typeof window.gameManager.setGameMode === 'function') {
            window.gameManager.setGameMode(mode);
        }
        this.hideModeSelection();
        console.log(`Game mode selected: ${mode}`);
    }
    
    /**
     * Cleanup UI manager resources
     */
    cleanup() {
        this.stopUIUpdates();
        
        // Clear notifications
        this.notifications.player1 = [];
        this.notifications.player2 = [];
        
        console.log('UIManager cleaned up');
    }
}

/**
 * TrackSegment Class - Represents a single segment of the racing track
 * Contains curve, hill, width, surface type, and obstacle information
 */
class TrackSegment {
    constructor(options = {}) {
        this.index = options.index || 0;
        this.curve = options.curve || 0;        // Curve amount (-1 to 1, negative = left, positive = right)
        this.hill = options.hill || 0;          // Hill height (negative = downhill, positive = uphill)
        this.width = options.width || 2000;     // Track width in world units
        this.surface = options.surface || 'road'; // Surface type: 'road', 'dirt', 'grass'
        this.obstacles = options.obstacles || []; // Array of obstacles on this segment
        this.checkpoints = options.checkpoints || []; // Array of checkpoints
        this.barriers = options.barriers || { left: false, right: false }; // Track barriers
        this.scenery = options.scenery || []; // Scenery objects (trees, buildings, etc.)
        
        // Visual properties
        this.roadColor = this.getSurfaceColor();
        this.markings = options.markings !== false; // Show road markings by default
    }
    
    /**
     * Get color based on surface type
     * @returns {string} Color hex code
     */
    getSurfaceColor() {
        switch (this.surface) {
            case 'road': return '#444444';
            case 'dirt': return '#8B4513';
            case 'grass': return '#228B22';
            default: return '#444444';
        }
    }
    
    /**
     * Check if this segment has a significant curve
     * @returns {boolean} True if curve is significant
     */
    hasCurve() {
        return Math.abs(this.curve) > 0.1;
    }
    
    /**
     * Check if this segment has a significant hill
     * @returns {boolean} True if hill is significant
     */
    hasHill() {
        return Math.abs(this.hill) > 50;
    }
    
    /**
     * Get curve direction as string
     * @returns {string} 'left', 'right', or 'straight'
     */
    getCurveDirection() {
        if (this.curve < -0.1) return 'left';
        if (this.curve > 0.1) return 'right';
        return 'straight';
    }
    
    /**
     * Get hill direction as string
     * @returns {string} 'uphill', 'downhill', or 'flat'
     */
    getHillDirection() {
        if (this.hill > 50) return 'uphill';
        if (this.hill < -50) return 'downhill';
        return 'flat';
    }
}

/**
 * Track Class - Represents a complete racing track with metadata
 * Contains track segments, difficulty settings, and track information
 */
class Track {
    constructor(options = {}) {
        this.name = options.name || 'Unnamed Track';
        this.difficulty = options.difficulty || 'medium'; // 'easy', 'medium', 'hard'
        this.segments = options.segments || [];
        this.laps = options.laps || 3;
        this.startPosition = options.startPosition || { x: 0, y: 0, z: 0 };
        this.finishLine = options.finishLine || { x: 0, y: 0, z: 0 };
        this.totalLength = this.calculateTotalLength();
        
        // Track metadata
        this.author = options.author || 'Track Generator';
        this.description = options.description || '';
        this.estimatedLapTime = options.estimatedLapTime || 60; // seconds
        this.maxSpeed = options.maxSpeed || 200; // km/h
        
        // Track statistics
        this.stats = this.calculateTrackStats();
    }
    
    /**
     * Calculate total track length
     * @returns {number} Total length in world units
     */
    calculateTotalLength() {
        return this.segments.length * 200; // Assuming 200 units per segment
    }
    
    /**
     * Calculate track statistics
     * @returns {Object} Track statistics
     */
    calculateTrackStats() {
        let totalCurves = 0;
        let totalHills = 0;
        let maxCurve = 0;
        let maxHill = 0;
        let straightSections = 0;
        
        this.segments.forEach(segment => {
            if (segment.hasCurve()) {
                totalCurves++;
                maxCurve = Math.max(maxCurve, Math.abs(segment.curve));
            } else {
                straightSections++;
            }
            
            if (segment.hasHill()) {
                totalHills++;
                maxHill = Math.max(maxHill, Math.abs(segment.hill));
            }
        });
        
        return {
            totalSegments: this.segments.length,
            totalCurves,
            totalHills,
            straightSections,
            maxCurve,
            maxHill,
            curvePercentage: (totalCurves / this.segments.length) * 100,
            hillPercentage: (totalHills / this.segments.length) * 100
        };
    }
    
    /**
     * Get segment at specific index
     * @param {number} index - Segment index
     * @returns {TrackSegment|null} Track segment or null
     */
    getSegment(index) {
        return this.segments[index] || null;
    }
    
    /**
     * Get segment at specific Z position
     * @param {number} z - Z position
     * @param {number} segmentLength - Length of each segment (default 200)
     * @returns {TrackSegment|null} Track segment or null
     */
    getSegmentAtPosition(z, segmentLength = 200) {
        const index = Math.floor(z / segmentLength);
        return this.getSegment(index);
    }
    
    /**
     * Get track difficulty settings
     * @returns {Object} Difficulty configuration
     */
    getDifficultyConfig() {
        const configs = {
            easy: {
                maxCurve: 0.3,
                maxHill: 100,
                curveFrequency: 0.2,
                hillFrequency: 0.15,
                obstacles: false,
                barriers: true
            },
            medium: {
                maxCurve: 0.6,
                maxHill: 200,
                curveFrequency: 0.35,
                hillFrequency: 0.25,
                obstacles: true,
                barriers: true
            },
            hard: {
                maxCurve: 1.0,
                maxHill: 300,
                curveFrequency: 0.5,
                hillFrequency: 0.4,
                obstacles: true,
                barriers: false
            }
        };
        
        return configs[this.difficulty] || configs.medium;
    }
}

/**
 * TrackGenerator Class - Generates racing tracks with different difficulty levels
 * Creates procedural tracks with curves, hills, and various track elements
 */
class TrackGenerator {
    constructor() {
        this.segmentLength = 200; // Length of each track segment
        this.defaultTrackWidth = 2000; // Default track width
        
        // Predefined track templates for consistent generation
        this.trackTemplates = {
            easy: {
                name: 'Beginner Circuit',
                description: 'A gentle track perfect for learning the basics',
                segments: 80,
                maxCurve: 0.3,
                maxHill: 100,
                curveFrequency: 0.2,
                hillFrequency: 0.15
            },
            medium: {
                name: 'Championship Track',
                description: 'A balanced track with moderate challenges',
                segments: 120,
                maxCurve: 0.6,
                maxHill: 200,
                curveFrequency: 0.35,
                hillFrequency: 0.25
            },
            hard: {
                name: 'Expert Challenge',
                description: 'A demanding track for experienced racers',
                segments: 150,
                maxCurve: 1.0,
                maxHill: 300,
                curveFrequency: 0.5,
                hillFrequency: 0.4
            }
        };
    }
    
    /**
     * Generate a complete track based on difficulty level
     * @param {string} difficulty - Track difficulty ('easy', 'medium', 'hard')
     * @param {Object} options - Additional options for track generation
     * @returns {Track} Generated track
     */
    generateTrack(difficulty = 'medium', options = {}) {
        const template = this.trackTemplates[difficulty] || this.trackTemplates.medium;
        const config = { ...template, ...options };
        
        console.log(`Generating ${difficulty} track: ${config.name}`);
        
        // Generate track segments
        const segments = this.generateSegments(config);
        
        // Create track object
        const track = new Track({
            name: config.name,
            difficulty: difficulty,
            description: config.description,
            segments: segments,
            laps: 3,
            startPosition: { x: 0, y: 0, z: 0 },
            finishLine: { x: 0, y: 0, z: segments.length * this.segmentLength }
        });
        
        console.log(`Track generated: ${segments.length} segments, ${track.stats.totalCurves} curves, ${track.stats.totalHills} hills`);
        
        return track;
    }
    
    /**
     * Generate track segments based on configuration
     * @param {Object} config - Track configuration
     * @returns {Array<TrackSegment>} Array of track segments
     */
    generateSegments(config) {
        const segments = [];
        let cumulativeCurve = 0;
        let cumulativeHill = 0;
        
        for (let i = 0; i < config.segments; i++) {
            const segment = this.generateSegment(i, config, cumulativeCurve, cumulativeHill);
            segments.push(segment);
            
            cumulativeCurve += segment.curve;
            cumulativeHill += segment.hill;
        }
        
        // Ensure track loops back to start (close the circuit)
        this.closeTrackLoop(segments);
        
        return segments;
    }
    
    /**
     * Generate a single track segment
     * @param {number} index - Segment index
     * @param {Object} config - Track configuration
     * @param {number} cumulativeCurve - Accumulated curve amount
     * @param {number} cumulativeHill - Accumulated hill amount
     * @returns {TrackSegment} Generated track segment
     */
    generateSegment(index, config, cumulativeCurve, cumulativeHill) {
        // Determine if this segment should have a curve
        const shouldHaveCurve = Math.random() < config.curveFrequency;
        const shouldHaveHill = Math.random() < config.hillFrequency;
        
        // Generate curve
        let curve = 0;
        if (shouldHaveCurve) {
            curve = (Math.random() - 0.5) * 2 * config.maxCurve;
            
            // Add some curve patterns for more interesting tracks
            if (index > 10 && index < config.segments - 10) {
                // Create S-curves occasionally
                if (Math.random() < 0.3 && Math.abs(cumulativeCurve) < 2) {
                    curve = this.generateSCurve(index, config.maxCurve);
                }
                
                // Create hairpin turns occasionally
                if (Math.random() < 0.1) {
                    curve = this.generateHairpin(config.maxCurve);
                }
            }
        }
        
        // Generate hill
        let hill = 0;
        if (shouldHaveHill) {
            hill = (Math.random() - 0.5) * 2 * config.maxHill;
            
            // Create hill patterns
            if (Math.random() < 0.4) {
                hill = this.generateHillPattern(index, config.maxHill);
            }
        }
        
        // Create segment
        const segment = new TrackSegment({
            index: index,
            curve: curve,
            hill: hill,
            width: this.defaultTrackWidth,
            surface: this.generateSurface(config),
            barriers: this.generateBarriers(config),
            obstacles: this.generateObstacles(index, config),
            scenery: this.generateScenery(index, config)
        });
        
        return segment;
    }
    
    /**
     * Generate S-curve pattern
     * @param {number} index - Segment index
     * @param {number} maxCurve - Maximum curve amount
     * @returns {number} Curve value
     */
    generateSCurve(index, maxCurve) {
        const phase = (index % 20) / 20 * Math.PI * 2;
        return Math.sin(phase) * maxCurve * 0.8;
    }
    
    /**
     * Generate hairpin turn
     * @param {number} maxCurve - Maximum curve amount
     * @returns {number} Curve value
     */
    generateHairpin(maxCurve) {
        return (Math.random() > 0.5 ? 1 : -1) * maxCurve * 0.9;
    }
    
    /**
     * Generate hill pattern
     * @param {number} index - Segment index
     * @param {number} maxHill - Maximum hill height
     * @returns {number} Hill value
     */
    generateHillPattern(index, maxHill) {
        const patterns = [
            // Gentle rolling hills
            () => Math.sin(index * 0.1) * maxHill * 0.5,
            // Sharp hills
            () => (Math.random() > 0.5 ? 1 : -1) * maxHill * 0.8,
            // Gradual incline/decline
            () => Math.sin(index * 0.05) * maxHill * 0.6
        ];
        
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        return pattern();
    }
    
    /**
     * Generate surface type for segment
     * @param {Object} config - Track configuration
     * @returns {string} Surface type
     */
    generateSurface(config) {
        // Most segments are road, with occasional dirt sections on harder tracks
        if (config.maxCurve > 0.8 && Math.random() < 0.1) {
            return 'dirt';
        }
        return 'road';
    }
    
    /**
     * Generate barriers for segment
     * @param {Object} config - Track configuration
     * @returns {Object} Barrier configuration
     */
    generateBarriers(config) {
        // Easy tracks have more barriers, hard tracks have fewer
        const barrierChance = config.maxCurve < 0.5 ? 0.8 : 0.3;
        
        return {
            left: Math.random() < barrierChance,
            right: Math.random() < barrierChance
        };
    }
    
    /**
     * Generate obstacles for segment
     * @param {number} index - Segment index
     * @param {Object} config - Track configuration
     * @returns {Array} Array of obstacles
     */
    generateObstacles(index, config) {
        const obstacles = [];
        
        // Only add obstacles on medium and hard tracks
        if (config.maxCurve > 0.4 && Math.random() < 0.05) {
            obstacles.push({
                type: 'cone',
                position: { x: (Math.random() - 0.5) * 1000, y: 0 },
                size: 50
            });
        }
        
        return obstacles;
    }
    
    /**
     * Generate scenery for segment
     * @param {number} index - Segment index
     * @param {Object} config - Track configuration
     * @returns {Array} Array of scenery objects
     */
    generateScenery(index, config) {
        const scenery = [];
        
        // Add trees occasionally
        if (Math.random() < 0.1) {
            scenery.push({
                type: 'tree',
                position: { x: (Math.random() > 0.5 ? 1 : -1) * (2000 + Math.random() * 1000), y: 0 },
                size: 100 + Math.random() * 100
            });
        }
        
        return scenery;
    }
    
    /**
     * Ensure the track forms a closed loop
     * @param {Array<TrackSegment>} segments - Track segments to modify
     */
    closeTrackLoop(segments) {
        if (segments.length === 0) return;
        
        // Calculate total curve to determine how much correction is needed
        let totalCurve = 0;
        segments.forEach(segment => {
            totalCurve += segment.curve;
        });
        
        // Distribute correction across the last 20% of segments
        const correctionSegments = Math.floor(segments.length * 0.2);
        const correctionPerSegment = -totalCurve / correctionSegments;
        
        for (let i = segments.length - correctionSegments; i < segments.length; i++) {
            segments[i].curve += correctionPerSegment;
        }
        
        console.log(`Track loop closed: total curve correction = ${totalCurve.toFixed(3)}`);
    }
    
    /**
     * Generate a specific track layout by name
     * @param {string} trackName - Name of the track layout
     * @returns {Track} Generated track
     */
    generateNamedTrack(trackName) {
        const namedTracks = {
            'speedway': this.generateSpeedway(),
            'mountain': this.generateMountainTrack(),
            'city': this.generateCityTrack(),
            'desert': this.generateDesertTrack()
        };
        
        return namedTracks[trackName] || this.generateTrack('medium');
    }
    
    /**
     * Generate a speedway-style track (mostly straight with banked turns)
     * @returns {Track} Speedway track
     */
    generateSpeedway() {
        const segments = [];
        const totalSegments = 100;
        
        for (let i = 0; i < totalSegments; i++) {
            let curve = 0;
            let hill = 0;
            
            // Create 4 banked turns
            const turnSections = [20, 45, 70, 95];
            const isInTurn = turnSections.some(turn => Math.abs(i - turn) < 5);
            
            if (isInTurn) {
                curve = 0.4 * (i % 2 === 0 ? 1 : -1);
                hill = -50; // Banking
            }
            
            segments.push(new TrackSegment({
                index: i,
                curve: curve,
                hill: hill,
                width: this.defaultTrackWidth * 1.5, // Wider track
                surface: 'road'
            }));
        }
        
        return new Track({
            name: 'High Speed Speedway',
            difficulty: 'easy',
            description: 'A high-speed oval track with banked turns',
            segments: segments
        });
    }
    
    /**
     * Generate a mountain-style track with elevation changes
     * @returns {Track} Mountain track
     */
    generateMountainTrack() {
        const config = {
            segments: 140,
            maxCurve: 0.8,
            maxHill: 400,
            curveFrequency: 0.6,
            hillFrequency: 0.7
        };
        
        const segments = this.generateSegments(config);
        
        return new Track({
            name: 'Mountain Pass',
            difficulty: 'hard',
            description: 'A challenging mountain track with steep hills and tight curves',
            segments: segments
        });
    }
    
    /**
     * Generate a city-style track with tight corners
     * @returns {Track} City track
     */
    generateCityTrack() {
        const config = {
            segments: 90,
            maxCurve: 0.9,
            maxHill: 100,
            curveFrequency: 0.7,
            hillFrequency: 0.2
        };
        
        const segments = this.generateSegments(config);
        
        return new Track({
            name: 'City Circuit',
            difficulty: 'medium',
            description: 'A street circuit with tight corners and urban obstacles',
            segments: segments
        });
    }
    
    /**
     * Generate a desert-style track with wide open sections
     * @returns {Track} Desert track
     */
    generateDesertTrack() {
        const config = {
            segments: 110,
            maxCurve: 0.5,
            maxHill: 150,
            curveFrequency: 0.3,
            hillFrequency: 0.3
        };
        
        const segments = this.generateSegments(config);
        
        return new Track({
            name: 'Desert Dunes',
            difficulty: 'medium',
            description: 'A desert track with rolling dunes and long straights',
            segments: segments
        });
    }
}

/**
 * PerspectiveCalculator Class - Handles 3D to 2D projection calculations
 * Implements perspective projection for 3D racing track rendering
 */
class PerspectiveCalculator {
    constructor() {
        // Camera and projection settings
        this.cameraHeight = 1000;
        this.cameraDistance = 500;
        this.fieldOfView = 100;
        this.projectionDistance = 200;
    }
    
    /**
     * Project 3D world coordinates to 2D screen coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate (height)
     * @param {number} worldZ - World Z coordinate (depth)
     * @param {number} cameraZ - Camera Z position
     * @param {number} screenWidth - Screen width
     * @param {number} screenHeight - Screen height
     * @returns {Object|null} Screen coordinates {x, y, scale} or null if behind camera
     */
    static project3DTo2D(worldX, worldY, worldZ, cameraZ, screenWidth, screenHeight) {
        const distance = worldZ - cameraZ;
        
        // Don't render objects behind the camera
        if (distance <= 0) return null;
        
        // Calculate perspective scale based on distance
        const scale = PerspectiveCalculator.prototype.projectionDistance / distance;
        
        // Project X coordinate with perspective
        const screenX = (worldX * scale) + (screenWidth / 2);
        
        // Project Y coordinate with perspective and camera height
        const screenY = (screenHeight / 2) - (worldY * scale);
        
        return {
            x: screenX,
            y: screenY,
            scale: scale,
            distance: distance
        };
    }
    
    /**
     * Calculate horizon line position based on camera height and angle
     * @param {number} cameraY - Camera Y position (height)
     * @param {number} screenHeight - Screen height
     * @param {number} cameraAngle - Camera pitch angle (optional)
     * @returns {number} Horizon Y position on screen
     */
    static calculateHorizon(cameraY, screenHeight, cameraAngle = 0) {
        const baseHorizon = screenHeight * 0.4;
        const heightOffset = (cameraY * 0.1);
        const angleOffset = Math.sin(cameraAngle) * 50;
        
        return baseHorizon - heightOffset + angleOffset;
    }
    
    /**
     * Calculate road width at a given distance with perspective
     * @param {number} baseWidth - Base road width
     * @param {number} distance - Distance from camera
     * @param {number} scale - Perspective scale
     * @returns {number} Scaled road width
     */
    static calculateRoadWidth(baseWidth, distance, scale) {
        return baseWidth * scale;
    }
    
    /**
     * Calculate curve offset for road segments
     * @param {number} curve - Curve amount (-1 to 1)
     * @param {number} distance - Distance from camera
     * @param {number} scale - Perspective scale
     * @returns {number} Curve offset in screen coordinates
     */
    static calculateCurveOffset(curve, distance, scale) {
        return curve * distance * scale * 0.001;
    }
    
    /**
     * Check if a 3D point is visible on screen
     * @param {Object} screenPoint - Screen coordinates from project3DTo2D
     * @param {number} screenWidth - Screen width
     * @param {number} screenHeight - Screen height
     * @returns {boolean} True if point is visible
     */
    static isPointVisible(screenPoint, screenWidth, screenHeight) {
        if (!screenPoint) return false;
        
        return screenPoint.x >= -100 && 
               screenPoint.x <= screenWidth + 100 &&
               screenPoint.y >= -100 && 
               screenPoint.y <= screenHeight + 100;
    }
}

/**
 * Track3DRenderer Class - Renders 3D track segments with perspective
 * Handles track geometry, road surface, and environmental elements
 */
class Track3DRenderer {
    constructor(viewport) {
        this.viewport = viewport;
        this.ctx = viewport.ctx;
        
        // Track configuration
        this.roadWidth = 2000;
        this.segmentLength = 200;
        this.drawDistance = 300;
        this.trackSegments = [];
        
        // Visual settings
        this.roadColor = '#444444';
        this.lineColor = '#ffffff';
        this.grassColor = '#228b22';
        this.skyColor = '#87ceeb';
        
        // Initialize track segments
        this.generateBasicTrack();
    }
    
    /**
     * Generate basic track layout for testing (deprecated - use TrackGenerator)
     */
    generateBasicTrack() {
        // Use TrackGenerator for proper track generation
        const trackGenerator = new TrackGenerator();
        const track = trackGenerator.generateTrack('medium');
        this.trackSegments = track.segments;
        this.currentTrack = track;
        console.log(`Track3DRenderer loaded track: ${track.name} (${track.difficulty})`);
    }
    
    /**
     * Load a specific track into the renderer
     * @param {Track} track - Track to load
     */
    loadTrack(track) {
        this.trackSegments = track.segments;
        this.currentTrack = track;
        console.log(`Track3DRenderer loaded track: ${track.name} (${track.difficulty})`);
    }
    
    /**
     * Generate and load a track by difficulty
     * @param {string} difficulty - Track difficulty ('easy', 'medium', 'hard')
     */
    generateTrackByDifficulty(difficulty) {
        const trackGenerator = new TrackGenerator();
        const track = trackGenerator.generateTrack(difficulty);
        this.loadTrack(track);
    }
    
    /**
     * Generate and load a named track
     * @param {string} trackName - Name of the track layout
     */
    generateNamedTrack(trackName) {
        const trackGenerator = new TrackGenerator();
        const track = trackGenerator.generateNamedTrack(trackName);
        this.loadTrack(track);
    }
    
    /**
     * Render the 3D track from player's perspective
     * @param {Object} playerData - Player position and camera data
     */
    render(playerData) {
        if (!this.ctx) return;
        
        // Clear and set up background
        this.renderBackground();
        
        // Get player position
        const playerZ = playerData.position?.z || 0;
        const playerX = playerData.position?.x || 0;
        const playerY = playerData.position?.y || 0;
        const playerAngle = playerData.angle || 0;
        
        // Render track segments from far to near (painter's algorithm)
        this.renderTrackSegments(playerX, playerY, playerZ, playerAngle);
        
        // Render track details
        this.renderTrackDetails(playerX, playerY, playerZ, playerAngle);
    }
    
    /**
     * Render background (sky and ground)
     */
    renderBackground() {
        const ctx = this.ctx;
        const width = this.viewport.width;
        const height = this.viewport.height;
        
        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
        skyGradient.addColorStop(0, '#87ceeb'); // Light blue
        skyGradient.addColorStop(1, '#98fb98'); // Light green
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height * 0.6);
        
        // Ground
        ctx.fillStyle = this.grassColor;
        ctx.fillRect(0, height * 0.6, width, height * 0.4);
        
        // Horizon line
        const horizonY = PerspectiveCalculator.calculateHorizon(0, height);
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(width, horizonY);
        ctx.stroke();
    }
    
    /**
     * Render track segments with 3D perspective
     * @param {number} playerX - Player X position
     * @param {number} playerY - Player Y position
     * @param {number} playerZ - Player Z position
     * @param {number} playerAngle - Player viewing angle
     */
    renderTrackSegments(playerX, playerY, playerZ, playerAngle) {
        const ctx = this.ctx;
        const width = this.viewport.width;
        const height = this.viewport.height;
        
        // Calculate which segments to render
        const startSegment = Math.floor(playerZ / this.segmentLength);
        const endSegment = startSegment + this.drawDistance;
        
        // Track cumulative curve for road positioning
        let cumulativeCurve = 0;
        
        // Render segments from far to near
        for (let i = endSegment; i >= startSegment; i--) {
            if (i < 0 || i >= this.trackSegments.length) continue;
            
            const segment = this.trackSegments[i];
            const segmentZ = i * this.segmentLength;
            
            // Calculate segment positions
            const segmentStart = this.calculateSegmentPosition(segmentZ, playerZ, cumulativeCurve, segment);
            const segmentEnd = this.calculateSegmentPosition(segmentZ + this.segmentLength, playerZ, cumulativeCurve + segment.curve, segment);
            
            // Project to screen coordinates
            const startScreen = PerspectiveCalculator.project3DTo2D(
                segmentStart.x - playerX, 
                segmentStart.y - playerY, 
                segmentStart.z, 
                playerZ, 
                width, 
                height
            );
            
            const endScreen = PerspectiveCalculator.project3DTo2D(
                segmentEnd.x - playerX, 
                segmentEnd.y - playerY, 
                segmentEnd.z, 
                playerZ, 
                width, 
                height
            );
            
            // Only render visible segments
            if (startScreen && endScreen) {
                this.renderTrackSegment(ctx, startScreen, endScreen, segment, width, height);
            }
            
            cumulativeCurve += segment.curve;
        }
    }
    
    /**
     * Calculate 3D position of a track segment
     * @param {number} segmentZ - Segment Z position
     * @param {number} playerZ - Player Z position
     * @param {number} cumulativeCurve - Accumulated curve amount
     * @param {Object} segment - Segment data
     * @returns {Object} 3D position {x, y, z}
     */
    calculateSegmentPosition(segmentZ, playerZ, cumulativeCurve, segment) {
        return {
            x: cumulativeCurve * 1000, // Convert curve to world X position
            y: segment.hill || 0,      // Hill height
            z: segmentZ                // Z position along track
        };
    }
    
    /**
     * Render a single track segment
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} startScreen - Start screen coordinates
     * @param {Object} endScreen - End screen coordinates
     * @param {Object} segment - Segment data
     * @param {number} width - Screen width
     * @param {number} height - Screen height
     */
    renderTrackSegment(ctx, startScreen, endScreen, segment, width, height) {
        // Calculate road width at this distance
        const roadWidth = PerspectiveCalculator.calculateRoadWidth(
            this.roadWidth, 
            startScreen.distance, 
            startScreen.scale
        );
        
        // Draw road surface
        ctx.fillStyle = segment.getSurfaceColor();
        ctx.beginPath();
        ctx.moveTo(startScreen.x - roadWidth/2, startScreen.y);
        ctx.lineTo(startScreen.x + roadWidth/2, startScreen.y);
        ctx.lineTo(endScreen.x + roadWidth/2, endScreen.y);
        ctx.lineTo(endScreen.x - roadWidth/2, endScreen.y);
        ctx.closePath();
        ctx.fill();
        
        // Draw road markings if enabled
        if (segment.markings) {
            this.renderRoadMarkings(ctx, startScreen, endScreen, roadWidth);
        }
        
        // Draw barriers if present
        if (segment.barriers.left || segment.barriers.right) {
            this.renderBarriers(ctx, startScreen, endScreen, roadWidth, segment.barriers);
        }
    }
    
    /**
     * Render road markings (center line, lane dividers)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} startScreen - Start screen coordinates
     * @param {Object} endScreen - End screen coordinates
     * @param {number} roadWidth - Road width in screen coordinates
     */
    renderRoadMarkings(ctx, startScreen, endScreen, roadWidth) {
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = Math.max(1, roadWidth * 0.01);
        
        // Center line
        ctx.beginPath();
        ctx.moveTo(startScreen.x, startScreen.y);
        ctx.lineTo(endScreen.x, endScreen.y);
        ctx.stroke();
        
        // Lane dividers (dashed lines)
        const quarterWidth = roadWidth / 4;
        ctx.setLineDash([5, 5]);
        
        // Left lane divider
        ctx.beginPath();
        ctx.moveTo(startScreen.x - quarterWidth, startScreen.y);
        ctx.lineTo(endScreen.x - quarterWidth, endScreen.y);
        ctx.stroke();
        
        // Right lane divider
        ctx.beginPath();
        ctx.moveTo(startScreen.x + quarterWidth, startScreen.y);
        ctx.lineTo(endScreen.x + quarterWidth, endScreen.y);
        ctx.stroke();
        
        ctx.setLineDash([]); // Reset line dash
    }
    
    /**
     * Render track barriers
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} startScreen - Start screen coordinates
     * @param {Object} endScreen - End screen coordinates
     * @param {number} roadWidth - Road width in screen coordinates
     * @param {Object} barriers - Barrier configuration
     */
    renderBarriers(ctx, startScreen, endScreen, roadWidth, barriers) {
        ctx.fillStyle = '#ff0000';
        const barrierWidth = roadWidth * 0.05;
        
        if (barriers.left) {
            ctx.fillRect(
                startScreen.x - roadWidth/2 - barrierWidth, 
                startScreen.y, 
                barrierWidth, 
                endScreen.y - startScreen.y
            );
        }
        
        if (barriers.right) {
            ctx.fillRect(
                startScreen.x + roadWidth/2, 
                startScreen.y, 
                barrierWidth, 
                endScreen.y - startScreen.y
            );
        }
    }
    
    /**
     * Render additional track details (scenery, obstacles)
     * @param {number} playerX - Player X position
     * @param {number} playerY - Player Y position
     * @param {number} playerZ - Player Z position
     * @param {number} playerAngle - Player viewing angle
     */
    renderTrackDetails(playerX, playerY, playerZ, playerAngle) {
        // This method can be extended to render scenery, obstacles, etc.
        // For now, we'll keep it simple
    }
}

/**
 * SensorInputHandler Class - Handles cross-platform sensor input processing
 * Normalizes sensor data from iOS/Android devices for consistent car control
 */
class SensorInputHandler {
    constructor() {
        // Platform detection
        this.platform = this.detectPlatform();
        
        // Sensor calibration settings
        this.calibration = {
            beta: { min: -45, max: 45, deadZone: 3 },
            gamma: { min: -30, max: 30, deadZone: 2 }
        };
        
        // Platform-specific adjustments
        this.platformAdjustments = {
            ios: {
                betaMultiplier: 1.0,
                gammaMultiplier: 1.0,
                betaOffset: 0,
                gammaOffset: 0
            },
            android: {
                betaMultiplier: 1.0,
                gammaMultiplier: 1.0,
                betaOffset: 0,
                gammaOffset: 0
            },
            unknown: {
                betaMultiplier: 1.0,
                gammaMultiplier: 1.0,
                betaOffset: 0,
                gammaOffset: 0
            }
        };
        
        // Input smoothing
        this.smoothingBuffer = {
            beta: [],
            gamma: [],
            bufferSize: 3
        };
        
        console.log(`SensorInputHandler initialized for platform: ${this.platform}`);
    }
    
    /**
     * Detect the current platform (iOS, Android, or unknown)
     * @returns {string} Platform identifier
     */
    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (/iphone|ipad|ipod/.test(userAgent)) {
            return 'ios';
        } else if (/android/.test(userAgent)) {
            return 'android';
        } else {
            return 'unknown';
        }
    }
    
    /**
     * Process and normalize sensor data for car control
     * @param {Object} sensorData - Raw sensor data from SessionSDK
     * @returns {Object} Normalized control input {throttle, steering}
     */
    processSensorData(sensorData) {
        if (!this.validateSensorData(sensorData)) {
            return { throttle: 0, steering: 0, valid: false };
        }
        
        const orientation = sensorData.data?.orientation || sensorData.orientation || {};
        let beta = orientation.beta || 0;
        let gamma = orientation.gamma || 0;
        
        // Apply platform-specific adjustments
        const adjustments = this.platformAdjustments[this.platform];
        beta = (beta + adjustments.betaOffset) * adjustments.betaMultiplier;
        gamma = (gamma + adjustments.gammaOffset) * adjustments.gammaMultiplier;
        
        // Apply smoothing
        beta = this.applySmoothingFilter('beta', beta);
        gamma = this.applySmoothingFilter('gamma', gamma);
        
        // Normalize to control values
        const throttle = this.normalizeThrottle(beta);
        const steering = this.normalizeSteering(gamma);
        
        return {
            throttle: throttle,
            steering: steering,
            valid: true,
            rawBeta: orientation.beta,
            rawGamma: orientation.gamma,
            processedBeta: beta,
            processedGamma: gamma
        };
    }
    
    /**
     * Validate sensor data structure and values
     * @param {Object} sensorData - Sensor data to validate
     * @returns {boolean} True if valid
     */
    validateSensorData(sensorData) {
        if (!sensorData) return false;
        
        const orientation = sensorData.data?.orientation || sensorData.orientation;
        if (!orientation) return false;
        
        const beta = orientation.beta;
        const gamma = orientation.gamma;
        
        // Check if values are numbers
        if (typeof beta !== 'number' || typeof gamma !== 'number') return false;
        
        // Check for reasonable ranges
        if (Math.abs(beta) > 180 || Math.abs(gamma) > 90) return false;
        
        // Check for NaN or infinite values
        if (!isFinite(beta) || !isFinite(gamma)) return false;
        
        return true;
    }
    
    /**
     * Normalize beta (forward/backward tilt) to throttle value
     * @param {number} beta - Beta angle in degrees
     * @returns {number} Throttle value (-1 to 1)
     */
    normalizeThrottle(beta) {
        const { min, max, deadZone } = this.calibration.beta;
        
        // Apply dead zone
        if (Math.abs(beta) < deadZone) {
            return 0;
        }
        
        // Forward tilt (negative beta) = positive throttle (accelerate)
        // Backward tilt (positive beta) = negative throttle (brake/reverse)
        let throttle = -beta / max;
        
        // Clamp to -1 to 1 range
        throttle = Math.max(-1, Math.min(1, throttle));
        
        // Apply curve for more natural feel
        throttle = Math.sign(throttle) * Math.pow(Math.abs(throttle), 0.8);
        
        return throttle;
    }
    
    /**
     * Normalize gamma (left/right tilt) to steering value
     * @param {number} gamma - Gamma angle in degrees
     * @returns {number} Steering value (-1 to 1)
     */
    normalizeSteering(gamma) {
        const { min, max, deadZone } = this.calibration.gamma;
        
        // Apply dead zone
        if (Math.abs(gamma) < deadZone) {
            return 0;
        }
        
        // Left tilt (negative gamma) = negative steering (left turn)
        // Right tilt (positive gamma) = positive steering (right turn)
        let steering = gamma / max;
        
        // Clamp to -1 to 1 range
        steering = Math.max(-1, Math.min(1, steering));
        
        // Apply curve for more natural feel
        steering = Math.sign(steering) * Math.pow(Math.abs(steering), 0.7);
        
        return steering;
    }
    
    /**
     * Apply smoothing filter to reduce sensor noise
     * @param {string} axis - 'beta' or 'gamma'
     * @param {number} value - Raw sensor value
     * @returns {number} Smoothed value
     */
    applySmoothingFilter(axis, value) {
        const buffer = this.smoothingBuffer[axis];
        
        // Add new value to buffer
        buffer.push(value);
        
        // Keep buffer size limited
        if (buffer.length > this.smoothingBuffer.bufferSize) {
            buffer.shift();
        }
        
        // Calculate weighted average (more weight to recent values)
        let weightedSum = 0;
        let totalWeight = 0;
        
        for (let i = 0; i < buffer.length; i++) {
            const weight = i + 1; // More recent values have higher weight
            weightedSum += buffer[i] * weight;
            totalWeight += weight;
        }
        
        return weightedSum / totalWeight;
    }
    
    /**
     * Calibrate sensor for specific device/user
     * @param {Object} calibrationData - Calibration settings
     */
    calibrate(calibrationData) {
        if (calibrationData.beta) {
            Object.assign(this.calibration.beta, calibrationData.beta);
        }
        
        if (calibrationData.gamma) {
            Object.assign(this.calibration.gamma, calibrationData.gamma);
        }
        
        console.log('Sensor calibration updated:', this.calibration);
    }
    
    /**
     * Auto-calibrate based on platform detection
     */
    autoCalibrate() {
        switch (this.platform) {
            case 'ios':
                // iOS devices typically have consistent sensor behavior
                this.calibration.beta = { min: -45, max: 45, deadZone: 3 };
                this.calibration.gamma = { min: -30, max: 30, deadZone: 2 };
                break;
                
            case 'android':
                // Android devices may vary more, use slightly larger ranges
                this.calibration.beta = { min: -50, max: 50, deadZone: 4 };
                this.calibration.gamma = { min: -35, max: 35, deadZone: 3 };
                break;
                
            default:
                // Conservative settings for unknown platforms
                this.calibration.beta = { min: -40, max: 40, deadZone: 5 };
                this.calibration.gamma = { min: -25, max: 25, deadZone: 3 };
                break;
        }
        
        console.log(`Auto-calibrated for ${this.platform}:`, this.calibration);
    }
    
    /**
     * Get current calibration settings
     * @returns {Object} Current calibration
     */
    getCalibration() {
        return {
            platform: this.platform,
            calibration: { ...this.calibration },
            platformAdjustments: { ...this.platformAdjustments[this.platform] }
        };
    }
    
    /**
     * Reset smoothing buffers
     */
    resetSmoothing() {
        this.smoothingBuffer.beta = [];
        this.smoothingBuffer.gamma = [];
    }
}

/**
 * CollisionDetectionSystem Class - Comprehensive collision detection and track boundary system
 * Handles track boundaries, barrier collisions, and independent collision processing for each player
 */
class CollisionDetectionSystem {
    constructor(options = {}) {
        this.trackWidth = options.trackWidth || 2000;
        this.trackCenter = options.trackCenter || 0;
        this.segmentLength = options.segmentLength || 200;
        
        // Collision detection settings
        this.carRadius = options.carRadius || 100;
        this.barrierCollisionDamage = options.barrierCollisionDamage || 15;
        this.wallCollisionDamage = options.wallCollisionDamage || 20;
        this.obstacleCollisionDamage = options.obstacleCollisionDamage || 10;
        
        // Off-track penalty settings
        this.offTrackSpeedPenalty = options.offTrackSpeedPenalty || 0.7;
        this.offTrackFrictionPenalty = options.offTrackFrictionPenalty || 0.8;
        
        // Collision response settings
        this.wallBounceReduction = options.wallBounceReduction || 0.5;
        this.collisionSpeedReduction = options.collisionSpeedReduction || 0.7;
        this.pushbackForce = options.pushbackForce || 200;
        
        console.log('CollisionDetectionSystem initialized');
    }
    
    /**
     * Check track boundaries for a car position
     * @param {Object} carPosition - Car position {x, y, z}
     * @param {Object} trackData - Current track segment data
     * @returns {Object} Track boundary check result
     */
    checkTrackBoundaries(carPosition, trackData = null) {
        let effectiveTrackWidth = this.trackWidth;
        let effectiveTrackCenter = this.trackCenter;
        
        // Use track segment data if available
        if (trackData && trackData.segments) {
            const segmentIndex = Math.floor(carPosition.z / this.segmentLength);
            const segment = trackData.segments[segmentIndex];
            
            if (segment) {
                effectiveTrackWidth = segment.width || this.trackWidth;
                // Apply curve offset to track center
                effectiveTrackCenter = this.calculateCurveOffset(carPosition.z, trackData);
            }
        }
        
        const distanceFromCenter = Math.abs(carPosition.x - effectiveTrackCenter);
        const trackHalfWidth = effectiveTrackWidth / 2;
        const isOnTrack = distanceFromCenter <= trackHalfWidth;
        const offTrackDistance = isOnTrack ? 0 : distanceFromCenter - trackHalfWidth;
        
        return {
            onTrack: isOnTrack,
            distanceFromCenter: distanceFromCenter,
            trackCenter: effectiveTrackCenter,
            trackWidth: effectiveTrackWidth,
            offTrackDistance: offTrackDistance,
            speedPenalty: isOnTrack ? 1.0 : this.offTrackSpeedPenalty,
            frictionPenalty: isOnTrack ? 1.0 : this.offTrackFrictionPenalty,
            side: carPosition.x > effectiveTrackCenter ? 'right' : 'left'
        };
    }
    
    /**
     * Calculate track center offset due to curves
     * @param {number} zPosition - Current Z position
     * @param {Object} trackData - Track data
     * @returns {number} Track center X offset
     */
    calculateCurveOffset(zPosition, trackData) {
        if (!trackData || !trackData.segments) return this.trackCenter;
        
        let cumulativeCurve = 0;
        const segmentIndex = Math.floor(zPosition / this.segmentLength);
        
        // Calculate cumulative curve up to current position
        for (let i = 0; i <= segmentIndex && i < trackData.segments.length; i++) {
            const segment = trackData.segments[i];
            if (segment && segment.curve) {
                cumulativeCurve += segment.curve;
            }
        }
        
        // Convert curve to world offset
        return this.trackCenter + (cumulativeCurve * 1000);
    }
    
    /**
     * Check for barrier and wall collisions
     * @param {Object} carPosition - Car position {x, y, z}
     * @param {Object} trackData - Current track segment data
     * @param {number} carRadius - Car collision radius
     * @returns {Object} Collision detection result
     */
    checkBarrierCollisions(carPosition, trackData = null, carRadius = null) {
        const radius = carRadius || this.carRadius;
        const collisions = [];
        
        // Check track walls (hard boundaries)
        const trackBoundary = this.checkTrackBoundaries(carPosition, trackData);
        const trackHalfWidth = trackBoundary.trackWidth / 2;
        const wallThreshold = trackHalfWidth + 100; // Wall is 100 units beyond track edge
        
        // Left wall collision
        if (carPosition.x < trackBoundary.trackCenter - wallThreshold) {
            collisions.push({
                type: 'wall',
                side: 'left',
                penetration: Math.abs(carPosition.x - (trackBoundary.trackCenter - wallThreshold)),
                damage: this.wallCollisionDamage,
                pushback: this.calculateWallPushback(carPosition, trackBoundary.trackCenter - wallThreshold, 'left')
            });
        }
        
        // Right wall collision
        if (carPosition.x > trackBoundary.trackCenter + wallThreshold) {
            collisions.push({
                type: 'wall',
                side: 'right',
                penetration: Math.abs(carPosition.x - (trackBoundary.trackCenter + wallThreshold)),
                damage: this.wallCollisionDamage,
                pushback: this.calculateWallPushback(carPosition, trackBoundary.trackCenter + wallThreshold, 'right')
            });
        }
        
        // Check track segment barriers and obstacles
        if (trackData && trackData.segments) {
            const segmentIndex = Math.floor(carPosition.z / this.segmentLength);
            const segment = trackData.segments[segmentIndex];
            
            if (segment) {
                // Check segment barriers
                if (segment.barriers) {
                    if (segment.barriers.left && carPosition.x < trackBoundary.trackCenter - trackHalfWidth + 50) {
                        collisions.push({
                            type: 'barrier',
                            side: 'left',
                            damage: this.barrierCollisionDamage,
                            pushback: this.calculateBarrierPushback(carPosition, trackBoundary.trackCenter - trackHalfWidth, 'left')
                        });
                    }
                    
                    if (segment.barriers.right && carPosition.x > trackBoundary.trackCenter + trackHalfWidth - 50) {
                        collisions.push({
                            type: 'barrier',
                            side: 'right',
                            damage: this.barrierCollisionDamage,
                            pushback: this.calculateBarrierPushback(carPosition, trackBoundary.trackCenter + trackHalfWidth, 'right')
                        });
                    }
                }
                
                // Check segment obstacles
                if (segment.obstacles && segment.obstacles.length > 0) {
                    segment.obstacles.forEach((obstacle, index) => {
                        const obstacleWorldX = trackBoundary.trackCenter + obstacle.position.x;
                        const obstacleWorldZ = segmentIndex * this.segmentLength + (obstacle.position.y || 0);
                        
                        const distance = Math.sqrt(
                            Math.pow(carPosition.x - obstacleWorldX, 2) +
                            Math.pow(carPosition.z - obstacleWorldZ, 2)
                        );
                        
                        const obstacleRadius = obstacle.size || 50;
                        if (distance < radius + obstacleRadius) {
                            collisions.push({
                                type: 'obstacle',
                                obstacle: obstacle,
                                obstacleIndex: index,
                                distance: distance,
                                damage: this.obstacleCollisionDamage,
                                pushback: this.calculateObstaclePushback(carPosition, obstacleWorldX, obstacleWorldZ)
                            });
                        }
                    });
                }
            }
        }
        
        return {
            hasCollision: collisions.length > 0,
            collisions: collisions,
            totalDamage: collisions.reduce((sum, collision) => sum + collision.damage, 0),
            primaryCollision: collisions.length > 0 ? collisions[0] : null
        };
    }
    
    /**
     * Calculate wall pushback force
     * @param {Object} carPosition - Car position
     * @param {number} wallPosition - Wall X position
     * @param {string} side - Wall side ('left' or 'right')
     * @returns {Object} Pushback vector
     */
    calculateWallPushback(carPosition, wallPosition, side) {
        const pushDirection = side === 'left' ? 1 : -1;
        return {
            x: pushDirection * this.pushbackForce,
            y: 0,
            z: 0
        };
    }
    
    /**
     * Calculate barrier pushback force
     * @param {Object} carPosition - Car position
     * @param {number} barrierPosition - Barrier X position
     * @param {string} side - Barrier side ('left' or 'right')
     * @returns {Object} Pushback vector
     */
    calculateBarrierPushback(carPosition, barrierPosition, side) {
        const pushDirection = side === 'left' ? 1 : -1;
        return {
            x: pushDirection * this.pushbackForce * 0.7, // Softer than wall
            y: 0,
            z: -this.pushbackForce * 0.3 // Slight backward push
        };
    }
    
    /**
     * Calculate obstacle pushback force
     * @param {Object} carPosition - Car position
     * @param {number} obstacleX - Obstacle X position
     * @param {number} obstacleZ - Obstacle Z position
     * @returns {Object} Pushback vector
     */
    calculateObstaclePushback(carPosition, obstacleX, obstacleZ) {
        const dx = carPosition.x - obstacleX;
        const dz = carPosition.z - obstacleZ;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance === 0) {
            return { x: this.pushbackForce, y: 0, z: 0 };
        }
        
        const normalizedX = dx / distance;
        const normalizedZ = dz / distance;
        
        return {
            x: normalizedX * this.pushbackForce,
            y: 0,
            z: normalizedZ * this.pushbackForce
        };
    }
    
    /**
     * Process comprehensive collision detection for a car
     * @param {Object} carPosition - Car position {x, y, z}
     * @param {Object} trackData - Track data
     * @param {number} carRadius - Car collision radius
     * @returns {Object} Complete collision analysis
     */
    processCollisions(carPosition, trackData = null, carRadius = null) {
        const trackResult = this.checkTrackBoundaries(carPosition, trackData);
        const barrierResult = this.checkBarrierCollisions(carPosition, trackData, carRadius);
        
        return {
            track: trackResult,
            barriers: barrierResult,
            hasAnyCollision: !trackResult.onTrack || barrierResult.hasCollision,
            overallSpeedPenalty: trackResult.speedPenalty * (barrierResult.hasCollision ? this.collisionSpeedReduction : 1.0),
            overallFrictionPenalty: trackResult.frictionPenalty,
            totalDamage: barrierResult.totalDamage,
            recommendedAction: this.getRecommendedAction(trackResult, barrierResult)
        };
    }
    
    /**
     * Get recommended action based on collision state
     * @param {Object} trackResult - Track boundary result
     * @param {Object} barrierResult - Barrier collision result
     * @returns {string} Recommended action
     */
    getRecommendedAction(trackResult, barrierResult) {
        if (barrierResult.hasCollision) {
            const collision = barrierResult.primaryCollision;
            if (collision.type === 'wall') {
                return `wall_collision_${collision.side}`;
            } else if (collision.type === 'barrier') {
                return `barrier_collision_${collision.side}`;
            } else if (collision.type === 'obstacle') {
                return 'obstacle_collision';
            }
        }
        
        if (!trackResult.onTrack) {
            return `off_track_${trackResult.side}`;
        }
        
        return 'safe';
    }
}

/**
 * CarPhysicsEngine Class - Enhanced with comprehensive collision detection
 * Implements acceleration, steering, friction, and collision detection
 */
class CarPhysicsEngine {
    constructor(options = {}) {
        // Position and orientation
        this.position = { 
            x: options.startX || 0, 
            y: options.startY || 0, 
            z: options.startZ || 0 
        };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.acceleration = { x: 0, y: 0, z: 0 };
        this.angle = options.startAngle || 0; // Car heading angle in radians
        this.angularVelocity = 0;
        
        // Speed and movement
        this.speed = 0; // Current speed in units/second
        this.maxSpeed = options.maxSpeed || 300;
        this.minSpeed = options.minSpeed || -100; // Reverse speed limit
        
        // Physics constants
        this.accelerationRate = options.accelerationRate || 150; // units/s²
        this.brakeRate = options.brakeRate || 200; // units/s²
        this.friction = options.friction || 0.95; // Friction coefficient
        this.airResistance = options.airResistance || 0.98; // Air resistance
        this.turnRate = options.turnRate || 2.0; // Turning sensitivity
        this.maxTurnAngle = options.maxTurnAngle || Math.PI / 3; // Max steering angle
        
        // Track interaction
        this.trackPosition = 0; // Position along track centerline
        this.trackOffset = 0; // Offset from track center (left/right)
        this.onTrack = true;
        this.offTrackPenalty = 0.7; // Speed multiplier when off track
        
        // Collision and damage
        this.collisionRadius = options.collisionRadius || 100;
        this.health = 100;
        this.crashed = false;
        
        // Enhanced collision detection system
        this.collisionSystem = new CollisionDetectionSystem({
            trackWidth: options.trackWidth || 2000,
            carRadius: this.collisionRadius,
            offTrackSpeedPenalty: this.offTrackPenalty
        });
        
        // Collision state tracking
        this.collisionState = {
            isColliding: false,
            collisionType: null,
            collisionCooldown: 0,
            lastCollisionTime: 0,
            collisionHistory: []
        };
        
        // Input state
        this.inputState = {
            throttle: 0,    // -1 to 1 (brake to accelerate)
            steering: 0,    // -1 to 1 (left to right)
            handbrake: false
        };
        
        // Performance tracking
        this.stats = {
            topSpeed: 0,
            totalDistance: 0,
            airTime: 0,
            collisions: 0,
            offTrackTime: 0,
            totalDamage: 0
        };
        
        console.log('CarPhysicsEngine initialized with enhanced collision detection');
    }
    
    /**
     * Process sensor input and convert to car controls
     * @param {Object} sensorData - Raw sensor data from mobile device
     */
    processSensorInput(sensorData) {
        // Initialize sensor input handler if not exists
        if (!this.sensorInputHandler) {
            this.sensorInputHandler = new SensorInputHandler();
            this.sensorInputHandler.autoCalibrate();
        }
        
        // Process sensor data through the handler
        const processedInput = this.sensorInputHandler.processSensorData(sensorData);
        
        if (!processedInput.valid) {
            // Invalid sensor data - maintain current input state or apply decay
            this.inputState.throttle *= 0.9;
            this.inputState.steering *= 0.9;
            return;
        }
        
        // Update input state with processed values
        this.inputState.throttle = processedInput.throttle;
        this.inputState.steering = processedInput.steering;
        
        // Store raw and processed values for debugging
        this.sensorDebugInfo = {
            rawBeta: processedInput.rawBeta,
            rawGamma: processedInput.rawGamma,
            processedBeta: processedInput.processedBeta,
            processedGamma: processedInput.processedGamma,
            throttle: processedInput.throttle,
            steering: processedInput.steering,
            platform: this.sensorInputHandler.platform
        };
        
        // Debug logging (reduced frequency to avoid spam)
        if (Math.random() < 0.005) { // Log occasionally
            console.log(`Sensor input [${this.sensorInputHandler.platform}] - Raw: β=${processedInput.rawBeta?.toFixed(1)}° γ=${processedInput.rawGamma?.toFixed(1)}° | Processed: β=${processedInput.processedBeta?.toFixed(1)}° γ=${processedInput.processedGamma?.toFixed(1)}° | Controls: T=${processedInput.throttle.toFixed(2)} S=${processedInput.steering.toFixed(2)}`);
        }
    }
    
    /**
     * Enhanced update method with comprehensive collision detection
     * @param {number} deltaTime - Time elapsed since last update (in seconds)
     * @param {Object} trackData - Current track information
     */
    update(deltaTime, trackData = null) {
        if (this.crashed) {
            this.handleCrashedState(deltaTime);
            return;
        }
        
        // Update collision cooldown
        if (this.collisionState.collisionCooldown > 0) {
            this.collisionState.collisionCooldown -= deltaTime;
        }
        
        // Update movement physics
        this.updateAcceleration(deltaTime);
        this.updateSteering(deltaTime);
        this.updateVelocity(deltaTime);
        this.updatePosition(deltaTime);
        
        // Enhanced collision detection and response
        if (trackData) {
            this.processEnhancedCollisions(trackData, deltaTime);
        }
        
        // Update statistics
        this.updateStats(deltaTime);
        
        // Apply constraints
        this.applyConstraints();
    }
    
    /**
     * Process enhanced collision detection and response
     * @param {Object} trackData - Track data
     * @param {number} deltaTime - Time delta
     */
    processEnhancedCollisions(trackData, deltaTime) {
        // Get comprehensive collision analysis
        const collisionResult = this.collisionSystem.processCollisions(
            this.position, 
            trackData, 
            this.collisionRadius
        );
        
        // Store collision state
        const wasColliding = this.collisionState.isColliding;
        this.collisionState.isColliding = collisionResult.hasAnyCollision;
        
        // Handle track boundary violations
        this.handleTrackBoundaryViolations(collisionResult.track, deltaTime);
        
        // Handle barrier and wall collisions
        if (collisionResult.barriers.hasCollision && this.collisionState.collisionCooldown <= 0) {
            this.handleBarrierCollisions(collisionResult.barriers, deltaTime);
        }
        
        // Apply overall penalties
        this.applyCollisionPenalties(collisionResult);
        
        // Update collision history
        this.updateCollisionHistory(collisionResult, wasColliding);
        
        // Update track interaction state
        this.onTrack = collisionResult.track.onTrack;
        this.trackOffset = collisionResult.track.distanceFromCenter;
    }
    
    /**
     * Handle track boundary violations (off-track penalties)
     * @param {Object} trackResult - Track boundary check result
     * @param {number} deltaTime - Time delta
     */
    handleTrackBoundaryViolations(trackResult, deltaTime) {
        if (!trackResult.onTrack) {
            // Apply off-track penalties
            this.speed *= trackResult.speedPenalty;
            this.friction *= trackResult.frictionPenalty;
            
            // Track off-track time
            this.stats.offTrackTime += deltaTime;
            
            // Visual/audio feedback could be triggered here
            this.triggerOffTrackFeedback(trackResult);
        }
    }
    
    /**
     * Handle barrier and wall collisions
     * @param {Object} barrierResult - Barrier collision result
     * @param {number} deltaTime - Time delta
     */
    handleBarrierCollisions(barrierResult, deltaTime) {
        barrierResult.collisions.forEach(collision => {
            // Apply damage
            this.health -= collision.damage;
            this.stats.totalDamage += collision.damage;
            this.stats.collisions++;
            
            // Apply pushback force
            if (collision.pushback) {
                this.position.x += collision.pushback.x * deltaTime;
                this.position.y += collision.pushback.y * deltaTime;
                this.position.z += collision.pushback.z * deltaTime;
            }
            
            // Reduce speed based on collision type
            if (collision.type === 'wall') {
                this.speed *= this.collisionSystem.wallBounceReduction;
                this.velocity.x *= -this.collisionSystem.wallBounceReduction;
            } else if (collision.type === 'barrier') {
                this.speed *= this.collisionSystem.collisionSpeedReduction;
            } else if (collision.type === 'obstacle') {
                this.speed *= this.collisionSystem.collisionSpeedReduction * 0.8; // More severe for obstacles
            }
            
            // Set collision cooldown to prevent multiple rapid collisions
            this.collisionState.collisionCooldown = 0.5; // 500ms cooldown
            this.collisionState.lastCollisionTime = Date.now();
            
            // Trigger collision feedback
            this.triggerCollisionFeedback(collision);
            
            console.log(`Collision: ${collision.type} - Damage: ${collision.damage}, Health: ${this.health}`);
        });
    }
    
    /**
     * Apply overall collision penalties
     * @param {Object} collisionResult - Complete collision result
     */
    applyCollisionPenalties(collisionResult) {
        // Apply overall speed penalty
        if (collisionResult.overallSpeedPenalty < 1.0) {
            this.speed *= collisionResult.overallSpeedPenalty;
        }
        
        // Apply overall friction penalty
        if (collisionResult.overallFrictionPenalty < 1.0) {
            this.friction *= collisionResult.overallFrictionPenalty;
        }
    }
    
    /**
     * Update collision history for analysis
     * @param {Object} collisionResult - Collision result
     * @param {boolean} wasColliding - Previous collision state
     */
    updateCollisionHistory(collisionResult, wasColliding) {
        // Record new collisions
        if (collisionResult.hasAnyCollision && !wasColliding) {
            this.collisionState.collisionHistory.push({
                timestamp: Date.now(),
                position: { ...this.position },
                type: collisionResult.recommendedAction,
                damage: collisionResult.totalDamage,
                speed: this.speed
            });
            
            // Keep history limited to last 10 collisions
            if (this.collisionState.collisionHistory.length > 10) {
                this.collisionState.collisionHistory.shift();
            }
        }
        
        // Update collision type
        this.collisionState.collisionType = collisionResult.hasAnyCollision ? 
            collisionResult.recommendedAction : null;
    }
    
    /**
     * Trigger off-track feedback (visual/audio cues)
     * @param {Object} trackResult - Track boundary result
     */
    triggerOffTrackFeedback(trackResult) {
        // This method can be extended to trigger visual/audio feedback
        // For now, we'll just log the off-track state
        if (Math.random() < 0.01) { // Occasional logging to avoid spam
            console.log(`Off-track: ${trackResult.side} side, distance: ${trackResult.offTrackDistance.toFixed(1)}`);
        }
    }
    
    /**
     * Trigger collision feedback (visual/audio cues)
     * @param {Object} collision - Collision data
     */
    triggerCollisionFeedback(collision) {
        // This method can be extended to trigger visual/audio feedback
        // For now, we'll just log the collision
        console.log(`Collision feedback: ${collision.type} collision`);
    }
    
    /**
     * Enhanced collision checking method (backward compatibility)
     * @param {Object} trackBounds - Track boundary information
     * @returns {boolean} True if collision occurred
     */
    checkCollisions(trackBounds) {
        // Use the enhanced collision system
        const collisionResult = this.collisionSystem.processCollisions(
            this.position, 
            trackBounds, 
            this.collisionRadius
        );
        
        return collisionResult.hasAnyCollision;
    }
    
    /**
     * Enhanced off-track checking (backward compatibility)
     * @param {number} trackCenter - Center X position of track
     * @param {number} trackWidth - Width of track
     * @returns {boolean} True if off track
     */
    checkOffTrack(trackCenter, trackWidth) {
        const trackResult = this.collisionSystem.checkTrackBoundaries(this.position, {
            segments: [{ width: trackWidth }]
        });
        
        this.onTrack = trackResult.onTrack;
        return !trackResult.onTrack;
    }
    
    /**
     * Get enhanced collision state information
     * @returns {Object} Collision state data
     */
    getCollisionState() {
        return {
            isColliding: this.collisionState.isColliding,
            collisionType: this.collisionState.collisionType,
            collisionCooldown: this.collisionState.collisionCooldown,
            lastCollisionTime: this.collisionState.lastCollisionTime,
            collisionHistory: [...this.collisionState.collisionHistory],
            onTrack: this.onTrack,
            trackOffset: this.trackOffset,
            health: this.health,
            totalDamage: this.stats.totalDamage,
            collisionCount: this.stats.collisions,
            offTrackTime: this.stats.offTrackTime
        };
    }
    
    /**
     * Reset collision state
     */
    resetCollisionState() {
        this.collisionState = {
            isColliding: false,
            collisionType: null,
            collisionCooldown: 0,
            lastCollisionTime: 0,
            collisionHistory: []
        };
        
        this.health = 100;
        this.crashed = false;
        this.onTrack = true;
        this.trackOffset = 0;
        
        // Reset collision-related stats
        this.stats.collisions = 0;
        this.stats.totalDamage = 0;
        this.stats.offTrackTime = 0;
    }
    
    /**
     * Update physics simulation
     * @param {number} deltaTime - Time elapsed since last update (in seconds)
     * @param {Object} trackData - Current track information
     */
    update(deltaTime, trackData = null) {
        if (this.crashed) {
            this.handleCrashedState(deltaTime);
            return;
        }
        
        // Update movement physics
        this.updateAcceleration(deltaTime);
        this.updateSteering(deltaTime);
        this.updateVelocity(deltaTime);
        this.updatePosition(deltaTime);
        
        // Track interaction
        if (trackData) {
            this.updateTrackInteraction(trackData);
        }
        
        // Update statistics
        this.updateStats(deltaTime);
        
        // Apply constraints
        this.applyConstraints();
    }
    
    /**
     * Update acceleration based on input
     * @param {number} deltaTime - Time delta
     */
    updateAcceleration(deltaTime) {
        const throttle = this.inputState.throttle;
        
        if (throttle > 0) {
            // Accelerating forward
            const accel = this.accelerationRate * throttle;
            this.speed += accel * deltaTime;
        } else if (throttle < 0) {
            // Braking or reversing
            if (this.speed > 0) {
                // Braking while moving forward
                const brakeForce = this.brakeRate * Math.abs(throttle);
                this.speed -= brakeForce * deltaTime;
                this.speed = Math.max(0, this.speed); // Don't go negative while braking
            } else {
                // Reversing
                const reverseAccel = this.accelerationRate * 0.5 * throttle; // Reverse is slower
                this.speed += reverseAccel * deltaTime;
            }
        } else {
            // No input - apply friction and air resistance
            if (this.speed > 0) {
                this.speed *= Math.pow(this.friction * this.airResistance, deltaTime * 60);
                if (this.speed < 1) this.speed = 0; // Stop very slow movement
            } else if (this.speed < 0) {
                this.speed *= Math.pow(this.friction, deltaTime * 60);
                if (this.speed > -1) this.speed = 0; // Stop very slow reverse movement
            }
        }
        
        // Apply speed limits
        this.speed = Math.max(this.minSpeed, Math.min(this.maxSpeed, this.speed));
        
        // Apply off-track penalty
        if (!this.onTrack) {
            this.speed *= this.offTrackPenalty;
        }
    }
    
    /**
     * Update steering and angular velocity
     * @param {number} deltaTime - Time delta
     */
    updateSteering(deltaTime) {
        const steering = this.inputState.steering;
        
        if (Math.abs(steering) > 0 && Math.abs(this.speed) > 10) {
            // Steering is more effective at higher speeds, but has limits
            const speedFactor = Math.min(1, Math.abs(this.speed) / 100);
            const steeringForce = steering * this.turnRate * speedFactor;
            
            // Apply steering
            this.angularVelocity = steeringForce;
            this.angle += this.angularVelocity * deltaTime;
            
            // Normalize angle to 0-2π range
            while (this.angle < 0) this.angle += Math.PI * 2;
            while (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;
        } else {
            // No steering input - angular velocity decays
            this.angularVelocity *= Math.pow(0.9, deltaTime * 60);
        }
    }
    
    /**
     * Update velocity based on speed and angle
     * @param {number} deltaTime - Time delta
     */
    updateVelocity(deltaTime) {
        // Convert speed and angle to velocity components
        this.velocity.x = Math.sin(this.angle) * this.speed;
        this.velocity.z = Math.cos(this.angle) * this.speed;
        this.velocity.y = 0; // No jumping in this version
    }
    
    /**
     * Update position based on velocity
     * @param {number} deltaTime - Time delta
     */
    updatePosition(deltaTime) {
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        
        // Update track position (distance along track)
        this.trackPosition = this.position.z;
    }
    
    /**
     * Update interaction with track (bounds checking, surface effects)
     * @param {Object} trackData - Track information
     */
    updateTrackInteraction(trackData) {
        if (!trackData || !trackData.segments) return;
        
        // Get current track segment
        const segmentIndex = Math.floor(this.trackPosition / 200); // Assuming 200 units per segment
        const segment = trackData.segments[segmentIndex];
        
        if (!segment) return;
        
        // Check track bounds
        const trackCenter = 0; // Simplified - track center is at X=0
        const trackWidth = segment.width || 2000;
        const distanceFromCenter = Math.abs(this.position.x - trackCenter);
        
        this.onTrack = distanceFromCenter <= trackWidth / 2;
        
        // Apply surface effects
        if (segment.surface === 'dirt') {
            this.friction *= 0.8; // Reduced grip on dirt
        } else if (segment.surface === 'grass') {
            this.friction *= 0.6; // Even less grip on grass
            this.speed *= 0.9; // Grass slows you down
        }
    }
    
    /**
     * Check for collisions with track boundaries and obstacles
     * @param {Object} trackBounds - Track boundary information
     * @returns {boolean} True if collision occurred
     */
    checkCollisions(trackBounds) {
        if (!trackBounds) return false;
        
        let collisionOccurred = false;
        
        // Check track boundary collisions
        if (trackBounds.leftWall && this.position.x < trackBounds.leftWall) {
            this.handleWallCollision('left');
            collisionOccurred = true;
        }
        
        if (trackBounds.rightWall && this.position.x > trackBounds.rightWall) {
            this.handleWallCollision('right');
            collisionOccurred = true;
        }
        
        // Check obstacle collisions (simplified)
        if (trackBounds.obstacles) {
            trackBounds.obstacles.forEach(obstacle => {
                const distance = Math.sqrt(
                    Math.pow(this.position.x - obstacle.x, 2) + 
                    Math.pow(this.position.z - obstacle.z, 2)
                );
                
                if (distance < this.collisionRadius + obstacle.radius) {
                    this.handleObstacleCollision(obstacle);
                    collisionOccurred = true;
                }
            });
        }
        
        return collisionOccurred;
    }
    
    /**
     * Handle collision with track wall
     * @param {string} side - Which side of track ('left' or 'right')
     */
    handleWallCollision(side) {
        // Bounce off wall
        this.velocity.x *= -0.5; // Reverse and reduce X velocity
        this.speed *= 0.7; // Reduce overall speed
        
        // Move car away from wall
        if (side === 'left') {
            this.position.x = Math.max(this.position.x, -1000);
        } else {
            this.position.x = Math.min(this.position.x, 1000);
        }
        
        // Apply damage
        this.health -= 5;
        this.stats.collisions++;
        
        console.log(`Wall collision on ${side} side! Health: ${this.health}`);
    }
    
    /**
     * Handle collision with obstacle
     * @param {Object} obstacle - Obstacle that was hit
     */
    handleObstacleCollision(obstacle) {
        // Reduce speed significantly
        this.speed *= 0.3;
        
        // Apply damage
        this.health -= 10;
        this.stats.collisions++;
        
        // Push car away from obstacle
        const dx = this.position.x - obstacle.x;
        const dz = this.position.z - obstacle.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance > 0) {
            const pushForce = 200;
            this.position.x += (dx / distance) * pushForce;
            this.position.z += (dz / distance) * pushForce;
        }
        
        console.log(`Obstacle collision! Health: ${this.health}`);
    }
    
    /**
     * Check if car is off track
     * @param {number} trackCenter - Center X position of track
     * @param {number} trackWidth - Width of track
     * @returns {boolean} True if off track
     */
    checkOffTrack(trackCenter, trackWidth) {
        const distanceFromCenter = Math.abs(this.position.x - trackCenter);
        const isOffTrack = distanceFromCenter > trackWidth / 2;
        
        this.onTrack = !isOffTrack;
        return isOffTrack;
    }
    
    /**
     * Handle crashed state (when health reaches 0)
     * @param {number} deltaTime - Time delta
     */
    handleCrashedState(deltaTime) {
        // Gradually reduce speed to zero
        this.speed *= Math.pow(0.9, deltaTime * 60);
        
        // Stop all input processing
        this.inputState.throttle = 0;
        this.inputState.steering = 0;
        
        // Recovery after some time
        if (this.speed < 1) {
            this.crashed = false;
            this.health = 50; // Partial recovery
            console.log('Car recovered from crash');
        }
    }
    
    /**
     * Update performance statistics
     * @param {number} deltaTime - Time delta
     */
    updateStats(deltaTime) {
        // Track top speed
        this.stats.topSpeed = Math.max(this.stats.topSpeed, Math.abs(this.speed));
        
        // Track total distance
        this.stats.totalDistance += Math.abs(this.speed) * deltaTime;
        
        // Track air time (if car is above ground)
        if (this.position.y > 0) {
            this.stats.airTime += deltaTime;
        }
    }
    
    /**
     * Apply various constraints to keep physics stable
     */
    applyConstraints() {
        // Prevent extreme positions
        this.position.x = Math.max(-5000, Math.min(5000, this.position.x));
        this.position.y = Math.max(0, this.position.y); // Don't go underground
        
        // Prevent extreme speeds
        if (Math.abs(this.speed) > this.maxSpeed * 1.5) {
            this.speed = Math.sign(this.speed) * this.maxSpeed;
        }
        
        // Check for crash conditions
        if (this.health <= 0 && !this.crashed) {
            this.crashed = true;
            console.log('Car crashed!');
        }
    }
    
    /**
     * Reset car to starting position and state
     * @param {Object} startPosition - Starting position {x, y, z}
     * @param {number} startAngle - Starting angle in radians
     */
    reset(startPosition = null, startAngle = 0) {
        this.position = startPosition || { x: 0, y: 0, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.acceleration = { x: 0, y: 0, z: 0 };
        this.angle = startAngle;
        this.angularVelocity = 0;
        this.speed = 0;
        this.health = 100;
        this.crashed = false;
        this.onTrack = true;
        this.trackPosition = 0;
        
        // Reset input state
        this.inputState = {
            throttle: 0,
            steering: 0,
            handbrake: false
        };
        
        // Reset stats
        this.stats = {
            topSpeed: 0,
            totalDistance: 0,
            airTime: 0,
            collisions: 0
        };
        
        console.log('Car physics reset');
    }
    
    /**
     * Get current car state for rendering and UI
     * @returns {Object} Current car state
     */
    getState() {
        return {
            position: { ...this.position },
            velocity: { ...this.velocity },
            angle: this.angle,
            speed: this.speed,
            health: this.health,
            crashed: this.crashed,
            onTrack: this.onTrack,
            trackPosition: this.trackPosition,
            inputState: { ...this.inputState },
            stats: { ...this.stats }
        };
    }
    
    /**
     * Apply external force to the car (for special effects)
     * @param {Object} force - Force vector {x, y, z}
     */
    applyForce(force) {
        this.velocity.x += force.x;
        this.velocity.y += force.y;
        this.velocity.z += force.z;
    }
    
    /**
     * Set car position directly (for teleporting, respawning)
     * @param {Object} position - New position {x, y, z}
     * @param {number} angle - New angle (optional)
     */
    setPosition(position, angle = null) {
        this.position = { ...position };
        if (angle !== null) {
            this.angle = angle;
        }
        
        // Reset velocity when teleporting
        this.velocity = { x: 0, y: 0, z: 0 };
        this.speed = 0;
    }
    
    /**
     * Get world position for track segment
     */
    getWorldPosition(segment, segmentZ) {
        return {
            x: segment.curve * 1000, // Convert curve to world units
            y: segment.hill,
            z: segmentZ
        };
    }
    
    /**
     * Render a single track segment
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     * @param {Object} startScreen - Start screen coordinates
     * @param {Object} endScreen - End screen coordinates
     * @param {Object} segment - Segment data
     * @param {number} screenWidth - Screen width
     * @param {number} screenHeight - Screen height
     */
    renderTrackSegment(ctx, startScreen, endScreen, segment, screenWidth, screenHeight) {
        // Calculate road width at this distance
        const startWidth = PerspectiveCalculator.calculateRoadWidth(this.roadWidth, startScreen.distance, startScreen.scale);
        const endWidth = PerspectiveCalculator.calculateRoadWidth(this.roadWidth, endScreen.distance, endScreen.scale);
        
        // Draw road surface
        ctx.fillStyle = this.roadColor;
        ctx.beginPath();
        
        // Road trapezoid (perspective effect)
        ctx.moveTo(startScreen.x - startWidth / 2, startScreen.y);
        ctx.lineTo(startScreen.x + startWidth / 2, startScreen.y);
        ctx.lineTo(endScreen.x + endWidth / 2, endScreen.y);
        ctx.lineTo(endScreen.x - endWidth / 2, endScreen.y);
        ctx.closePath();
        ctx.fill();
        
        // Draw road markings if segment is close enough
        if (startScreen.scale > 0.1) {
            this.renderRoadMarkings(ctx, startScreen, endScreen, startWidth, endWidth);
        }
        
        // Draw road edges
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = Math.max(1, startScreen.scale * 2);
        ctx.beginPath();
        ctx.moveTo(startScreen.x - startWidth / 2, startScreen.y);
        ctx.lineTo(endScreen.x - endWidth / 2, endScreen.y);
        ctx.moveTo(startScreen.x + startWidth / 2, startScreen.y);
        ctx.lineTo(endScreen.x + endWidth / 2, endScreen.y);
        ctx.stroke();
    }
    
    /**
     * Render road markings (center line, lane dividers)
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     * @param {Object} startScreen - Start screen coordinates
     * @param {Object} endScreen - End screen coordinates
     * @param {number} startWidth - Start road width
     * @param {number} endWidth - End road width
     */
    renderRoadMarkings(ctx, startScreen, endScreen, startWidth, endWidth) {
        // Center line (dashed)
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = Math.max(1, startScreen.scale * 3);
        ctx.setLineDash([startScreen.scale * 10, startScreen.scale * 10]);
        
        ctx.beginPath();
        ctx.moveTo(startScreen.x, startScreen.y);
        ctx.lineTo(endScreen.x, endScreen.y);
        ctx.stroke();
        
        ctx.setLineDash([]); // Reset line dash
    }
    
    /**
     * Render additional track details (barriers, scenery)
     * @param {number} playerX - Player X position
     * @param {number} playerY - Player Y position
     * @param {number} playerZ - Player Z position
     * @param {number} playerAngle - Player viewing angle
     */
    renderTrackDetails(playerX, playerY, playerZ, playerAngle) {
        // This method can be extended to render:
        // - Track barriers
        // - Scenery objects (trees, buildings)
        // - Track-side details
        // - Environmental effects
    }
    
    /**
     * Update track configuration
     * @param {Object} config - Track configuration
     */
    updateTrackConfig(config) {
        if (config.roadWidth) this.roadWidth = config.roadWidth;
        if (config.segmentLength) this.segmentLength = config.segmentLength;
        if (config.drawDistance) this.drawDistance = config.drawDistance;
        
        // Regenerate track if needed
        if (config.regenerate) {
            this.generateBasicTrack();
        }
    }
    
    /**
     * Get track segment at specific position
     * @param {number} z - Z position
     * @returns {Object|null} Track segment or null
     */
    getSegmentAt(z) {
        const segmentIndex = Math.floor(z / this.segmentLength);
        return this.trackSegments[segmentIndex] || null;
    }
}

/**
 * ScreenSplitter Class - Manages split screen rendering for dual player racing
 * Handles 50:50 screen division, independent viewports, and divider rendering
 */
class ScreenSplitter {
    constructor() {
        this.leftCanvas = document.getElementById('left-canvas');
        this.rightCanvas = document.getElementById('right-canvas');
        this.leftCtx = null;
        this.rightCtx = null;
        
        // Viewport configurations
        this.leftViewport = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            canvas: this.leftCanvas,
            ctx: null
        };
        
        this.rightViewport = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            canvas: this.rightCanvas,
            ctx: null
        };
        
        this.dividerElement = document.getElementById('screen-divider');
        this.initialized = false;
        
        this.initialize();
    }
    
    /**
     * Initialize the screen splitter system
     */
    initialize() {
        try {
            // Get 2D rendering contexts
            this.leftCtx = this.leftCanvas.getContext('2d');
            this.rightCtx = this.rightCanvas.getContext('2d');
            
            if (!this.leftCtx || !this.rightCtx) {
                throw new Error('Failed to get canvas rendering contexts');
            }
            
            // Set up viewport contexts
            this.leftViewport.ctx = this.leftCtx;
            this.rightViewport.ctx = this.rightCtx;
            
            // Set up resize handling
            this.setupResizeHandling();
            
            // Initial resize to set up viewports
            this.handleResize();
            
            // Set up rendering optimization
            this.setupRenderingOptimization();
            
            this.initialized = true;
            console.log('ScreenSplitter initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize ScreenSplitter:', error);
            throw error;
        }
    }
    
    /**
     * Set up window resize handling to maintain 50:50 split
     */
    setupResizeHandling() {
        const resizeHandler = () => {
            this.handleResize();
        };
        
        window.addEventListener('resize', resizeHandler);
        
        // Also handle orientation changes on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeHandler, 100); // Delay to allow orientation change to complete
        });
    }
    
    /**
     * Handle window resize and update viewport dimensions
     */
    handleResize() {
        const screenContainer = document.getElementById('screen-container');
        const containerRect = screenContainer.getBoundingClientRect();
        
        // Calculate 50:50 split dimensions
        const totalWidth = containerRect.width;
        const totalHeight = containerRect.height;
        const halfWidth = Math.floor(totalWidth / 2);
        
        // Update canvas dimensions for high DPI displays
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        // Left viewport (Player 1)
        this.updateCanvasDimensions(
            this.leftCanvas,
            this.leftCtx,
            halfWidth,
            totalHeight,
            devicePixelRatio
        );
        
        this.leftViewport.width = halfWidth;
        this.leftViewport.height = totalHeight;
        
        // Right viewport (Player 2)
        this.updateCanvasDimensions(
            this.rightCanvas,
            this.rightCtx,
            halfWidth,
            totalHeight,
            devicePixelRatio
        );
        
        this.rightViewport.width = halfWidth;
        this.rightViewport.height = totalHeight;
        
        // Update divider position
        this.updateDividerPosition();
        
        console.log('Screen split updated:', {
            totalWidth,
            totalHeight,
            halfWidth,
            devicePixelRatio
        });
    }
    
    /**
     * Update canvas dimensions with proper scaling for high DPI displays
     */
    updateCanvasDimensions(canvas, ctx, width, height, devicePixelRatio) {
        // Set display size (CSS pixels)
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        // Set actual canvas size (device pixels)
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
        
        // Scale the context to match device pixel ratio
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        // Set rendering properties for better performance
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
    }
    
    /**
     * Update the visual divider position
     */
    updateDividerPosition() {
        if (this.dividerElement) {
            // The divider is already positioned with CSS, but we can adjust if needed
            this.dividerElement.style.display = 'block';
        }
    }
    
    /**
     * Set up rendering optimization settings
     */
    setupRenderingOptimization() {
        // Configure both contexts for optimal performance
        [this.leftCtx, this.rightCtx].forEach(ctx => {
            if (ctx) {
                // Enable hardware acceleration hints
                ctx.globalCompositeOperation = 'source-over';
                
                // Set text rendering properties
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial, sans-serif';
            }
        });
    }
    
    /**
     * Render the left screen for Player 1
     * @param {Object} player1Data - Player 1 game data
     */
    renderLeftScreen(player1Data) {
        if (!this.initialized || !this.leftCtx) {
            console.warn('ScreenSplitter not initialized for left screen rendering');
            return;
        }
        
        try {
            // Clear the left viewport
            this.clearViewport(this.leftViewport);
            
            // Render Player 1's 3D track view
            this.render3DTrackView(this.leftViewport, player1Data, 'player1');
            
            // Render Player 1 specific UI elements
            this.renderPlayerUI(this.leftViewport, player1Data, 'player1');
            
        } catch (error) {
            console.error('Error rendering left screen:', error);
            this.renderErrorFallback(this.leftViewport, 'Player 1');
        }
    }
    
    /**
     * Render the right screen for Player 2
     * @param {Object} player2Data - Player 2 game data
     */
    renderRightScreen(player2Data) {
        if (!this.initialized || !this.rightCtx) {
            console.warn('ScreenSplitter not initialized for right screen rendering');
            return;
        }
        
        try {
            // Clear the right viewport
            this.clearViewport(this.rightViewport);
            
            // Render Player 2's 3D track view
            this.render3DTrackView(this.rightViewport, player2Data, 'player2');
            
            // Render Player 2 specific UI elements
            this.renderPlayerUI(this.rightViewport, player2Data, 'player2');
            
        } catch (error) {
            console.error('Error rendering right screen:', error);
            this.renderErrorFallback(this.rightViewport, 'Player 2');
        }
    }
    
    /**
     * Clear a viewport
     * @param {Object} viewport - Viewport to clear
     */
    clearViewport(viewport) {
        const ctx = viewport.ctx;
        if (ctx) {
            ctx.clearRect(0, 0, viewport.width, viewport.height);
            
            // Set background gradient (sky to ground)
            const gradient = ctx.createLinearGradient(0, 0, 0, viewport.height);
            gradient.addColorStop(0, '#87ceeb'); // Sky blue
            gradient.addColorStop(0.6, '#98fb98'); // Light green
            gradient.addColorStop(1, '#228b22'); // Forest green
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, viewport.width, viewport.height);
        }
    }
    
    /**
     * Render 3D track view for a player using the 3D rendering engine
     * @param {Object} viewport - Viewport to render in
     * @param {Object} playerData - Player's game data
     * @param {string} playerId - Player identifier
     */
    render3DTrackView(viewport, playerData, playerId) {
        const ctx = viewport.ctx;
        if (!ctx) return;
        
        // Initialize 3D renderer for this viewport if not already done
        if (!viewport.track3DRenderer) {
            viewport.track3DRenderer = new Track3DRenderer(viewport);
        }
        
        // Prepare player data with default values for 3D rendering
        const player3DData = {
            position: {
                x: playerData.position?.x || 0,
                y: playerData.position?.y || 0,
                z: playerData.position?.z || 0
            },
            angle: playerData.angle || 0,
            speed: playerData.stats?.speed || 0
        };
        
        // Render the 3D track
        viewport.track3DRenderer.render(player3DData);
        
        // Draw car (simple representation) on top of the 3D track
        this.drawPlayerCar(ctx, viewport, playerData, playerId);
    }
    
    /**
     * Draw road with perspective effect (placeholder)
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     * @param {Object} viewport - Viewport dimensions
     * @param {Object} playerData - Player data
     */
    drawRoadPerspective(ctx, viewport, playerData) {
        const centerX = viewport.width / 2;
        const horizonY = viewport.height * 0.4;
        const bottomY = viewport.height;
        
        // Draw road surface
        ctx.fillStyle = '#444444';
        ctx.beginPath();
        
        // Road gets wider as it approaches the bottom (perspective)
        const roadTopWidth = 20;
        const roadBottomWidth = viewport.width * 0.8;
        
        ctx.moveTo(centerX - roadTopWidth / 2, horizonY);
        ctx.lineTo(centerX + roadTopWidth / 2, horizonY);
        ctx.lineTo(centerX + roadBottomWidth / 2, bottomY);
        ctx.lineTo(centerX - roadBottomWidth / 2, bottomY);
        ctx.closePath();
        ctx.fill();
        
        // Draw road markings
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        
        // Center line
        ctx.beginPath();
        ctx.moveTo(centerX, horizonY);
        ctx.lineTo(centerX, bottomY);
        ctx.stroke();
        
        ctx.setLineDash([]); // Reset line dash
    }
    
    /**
     * Draw player's car (simple representation)
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     * @param {Object} viewport - Viewport dimensions
     * @param {Object} playerData - Player data
     * @param {string} playerId - Player identifier
     */
    drawPlayerCar(ctx, viewport, playerData, playerId) {
        const centerX = viewport.width / 2;
        const carY = viewport.height * 0.8;
        const carWidth = 30;
        const carHeight = 50;
        
        // Car color based on player
        const carColor = playerId === 'player1' ? '#3b82f6' : '#ef4444';
        
        // Draw car body
        ctx.fillStyle = carColor;
        ctx.fillRect(
            centerX - carWidth / 2,
            carY - carHeight / 2,
            carWidth,
            carHeight
        );
        
        // Draw car outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            centerX - carWidth / 2,
            carY - carHeight / 2,
            carWidth,
            carHeight
        );
        
        // Draw windshield
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(
            centerX - carWidth / 3,
            carY - carHeight / 3,
            (carWidth * 2) / 3,
            carHeight / 3
        );
    }
    
    /**
     * Render player-specific UI elements
     * @param {Object} viewport - Viewport to render in
     * @param {Object} playerData - Player's game data
     * @param {string} playerId - Player identifier
     */
    renderPlayerUI(viewport, playerData, playerId) {
        const ctx = viewport.ctx;
        if (!ctx) return;
        
        // Render speed indicator
        this.renderSpeedometer(ctx, viewport, playerData, playerId);
        
        // Render position indicator
        this.renderPositionIndicator(ctx, viewport, playerData);
        
        // Render any visual effects
        this.renderVisualEffects(ctx, viewport, playerData);
    }
    
    /**
     * Render speedometer (placeholder)
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     * @param {Object} viewport - Viewport dimensions
     * @param {Object} playerData - Player data
     * @param {string} playerId - Player identifier
     */
    renderSpeedometer(ctx, viewport, playerData, playerId) {
        const speed = playerData?.stats?.speed || 0;
        const x = viewport.width - 80;
        const y = viewport.height - 80;
        const radius = 30;
        
        // Draw speedometer background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw speed arc
        const playerColor = playerId === 'player1' ? '#3b82f6' : '#ef4444';
        ctx.strokeStyle = playerColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        const speedAngle = (speed / 200) * Math.PI * 1.5; // Max speed 200
        ctx.arc(x, y, radius - 5, -Math.PI / 2, -Math.PI / 2 + speedAngle);
        ctx.stroke();
        
        // Draw speed text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(speed).toString(), x, y + 4);
    }
    
    /**
     * Render position indicator on track
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     * @param {Object} viewport - Viewport dimensions
     * @param {Object} playerData - Player data
     */
    renderPositionIndicator(ctx, viewport, playerData) {
        // Placeholder for track position indicator
        // This would show the player's position on a mini-map or progress bar
    }
    
    /**
     * Render visual effects (smoke, sparks, etc.)
     * @param {CanvasRenderingContext2D} ctx - Rendering context
     * @param {Object} viewport - Viewport dimensions
     * @param {Object} playerData - Player data
     */
    renderVisualEffects(ctx, viewport, playerData) {
        // Placeholder for visual effects
        // This would render tire smoke, collision sparks, etc.
    }
    
    /**
     * Render error fallback when rendering fails
     * @param {Object} viewport - Viewport to render in
     * @param {string} playerName - Player name for error message
     */
    renderErrorFallback(viewport, playerName) {
        const ctx = viewport.ctx;
        if (!ctx) return;
        
        // Clear viewport
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, viewport.width, viewport.height);
        
        // Draw error message
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${playerName} Rendering Error`,
            viewport.width / 2,
            viewport.height / 2 - 10
        );
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(
            'Please restart the game',
            viewport.width / 2,
            viewport.height / 2 + 10
        );
    }
    
    /**
     * Draw the screen divider
     */
    drawDivider() {
        // The divider is handled by CSS, but this method can be used
        // for additional divider effects if needed
        if (this.dividerElement) {
            this.dividerElement.style.opacity = '1';
        }
    }
    
    /**
     * Hide the screen divider
     */
    hideDivider() {
        if (this.dividerElement) {
            this.dividerElement.style.opacity = '0';
        }
    }
    
    /**
     * Get viewport information for external use
     * @param {string} side - 'left' or 'right'
     * @returns {Object} Viewport information
     */
    getViewport(side) {
        return side === 'left' ? this.leftViewport : this.rightViewport;
    }
    
    /**
     * Check if screen splitter is properly initialized
     * @returns {boolean} Initialization status
     */
    isInitialized() {
        return this.initialized;
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleResize);
        
        // Clear contexts
        if (this.leftCtx) {
            this.leftCtx.clearRect(0, 0, this.leftViewport.width, this.leftViewport.height);
        }
        if (this.rightCtx) {
            this.rightCtx.clearRect(0, 0, this.rightViewport.width, this.rightViewport.height);
        }
        
        this.initialized = false;
        console.log('ScreenSplitter cleaned up');
    }
}

/**
 * RaceManager Class - Handles race progress, lap timing, and ranking system
 * Manages lap completion detection, timing, and personal best records
 */
class RaceManager {
    constructor() {
        this.raceStartTime = 0;
        this.raceEndTime = 0;
        this.isRaceActive = false;
        this.lapStartTimes = new Map(); // Track lap start times for each player
        this.checkpointData = new Map(); // Track checkpoint progress for each player
        this.personalBests = this.loadPersonalBests();
        this.raceHistory = [];
        
        // Race configuration
        this.totalLaps = 3;
        this.trackLength = 24000; // Default track length
        this.finishLinePosition = 0; // Z position of finish line
        this.checkpointInterval = 6000; // Distance between checkpoints for lap validation
    }
    
    /**
     * Start a new race
     * @param {Array} players - Array of player objects
     * @param {Object} trackData - Track information
     */
    startRace(players, trackData = null) {
        this.raceStartTime = Date.now();
        this.raceEndTime = 0;
        this.isRaceActive = true;
        
        if (trackData) {
            this.trackLength = trackData.totalLength || 24000;
            this.finishLinePosition = trackData.finishLine?.z || this.trackLength;
        }
        
        // Initialize lap timing for each player
        players.forEach(player => {
            this.lapStartTimes.set(player.sensorId, this.raceStartTime);
            this.checkpointData.set(player.sensorId, {
                lastCheckpoint: 0,
                checkpointsPassed: 0,
                lapStartPosition: 0,
                validLap: true
            });
            
            // Reset player race stats
            player.stats.lapTime = 0;
            player.stats.currentLap = 1;
            player.stats.bestLap = this.personalBests[player.sensorId]?.bestLap || Infinity;
            player.stats.rank = 1;
            player.stats.totalRaceTime = 0;
            player.stats.lapTimes = [];
            player.stats.finished = false;
            player.stats.finishTime = 0;
        });
        
        console.log('Race started with', players.length, 'players');
    }
    
    /**
     * Update race progress and lap detection
     * @param {Array} players - Array of player objects with car physics
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateRaceProgress(players, deltaTime) {
        if (!this.isRaceActive) return;
        
        const currentTime = Date.now();
        
        players.forEach(player => {
            if (!player.carPhysics || player.stats.finished) return;
            
            const carState = player.carPhysics.getState();
            const currentPosition = carState.trackPosition;
            
            // Update current lap time
            const lapStartTime = this.lapStartTimes.get(player.sensorId) || currentTime;
            player.stats.lapTime = (currentTime - lapStartTime) / 1000; // Convert to seconds
            player.stats.totalRaceTime = (currentTime - this.raceStartTime) / 1000;
            
            // Check for lap completion
            this.checkLapCompletion(player, currentPosition, currentTime);
            
            // Update checkpoint progress for lap validation
            this.updateCheckpointProgress(player, currentPosition);
        });
        
        // Update rankings
        this.updateRankings(players);
        
        // Check for race completion
        this.checkRaceCompletion(players);
    }
    
    /**
     * Check if player has completed a lap
     * @param {Object} player - Player object
     * @param {number} currentPosition - Current Z position on track
     * @param {number} currentTime - Current timestamp
     */
    checkLapCompletion(player, currentPosition, currentTime) {
        const checkpointData = this.checkpointData.get(player.sensorId);
        if (!checkpointData) return;
        
        // Check if player crossed finish line
        const previousPosition = checkpointData.lapStartPosition;
        const finishLineCrossed = previousPosition < this.finishLinePosition && 
                                 currentPosition >= this.finishLinePosition;
        
        if (finishLineCrossed && checkpointData.validLap) {
            this.completeLap(player, currentTime);
        }
        
        // Update position for next frame
        checkpointData.lapStartPosition = currentPosition;
    }
    
    /**
     * Complete a lap for a player
     * @param {Object} player - Player object
     * @param {number} currentTime - Current timestamp
     */
    completeLap(player, currentTime) {
        const lapStartTime = this.lapStartTimes.get(player.sensorId);
        const lapTime = (currentTime - lapStartTime) / 1000; // Convert to seconds
        
        // Record lap time
        player.stats.lapTimes.push(lapTime);
        
        // Check for personal best
        if (lapTime < player.stats.bestLap) {
            player.stats.bestLap = lapTime;
            this.updatePersonalBest(player.sensorId, lapTime);
            console.log(`${player.sensorId} set new personal best: ${lapTime.toFixed(3)}s`);
        }
        
        // Move to next lap
        player.stats.currentLap++;
        
        // Check if race is finished
        if (player.stats.currentLap > this.totalLaps) {
            this.finishPlayerRace(player, currentTime);
        } else {
            // Start new lap
            this.lapStartTimes.set(player.sensorId, currentTime);
            this.resetCheckpointProgress(player.sensorId);
            console.log(`${player.sensorId} completed lap ${player.stats.currentLap - 1} in ${lapTime.toFixed(3)}s`);
        }
    }
    
    /**
     * Finish race for a player
     * @param {Object} player - Player object
     * @param {number} currentTime - Current timestamp
     */
    finishPlayerRace(player, currentTime) {
        player.stats.finished = true;
        player.stats.finishTime = (currentTime - this.raceStartTime) / 1000;
        
        // Calculate average lap time
        const validLaps = player.stats.lapTimes.filter(time => time > 0);
        player.stats.averageLapTime = validLaps.length > 0 ? 
            validLaps.reduce((sum, time) => sum + time, 0) / validLaps.length : 0;
        
        console.log(`${player.sensorId} finished race! Total time: ${player.stats.finishTime.toFixed(3)}s`);
    }
    
    /**
     * Update checkpoint progress for lap validation
     * @param {Object} player - Player object
     * @param {number} currentPosition - Current Z position on track
     */
    updateCheckpointProgress(player, currentPosition) {
        const checkpointData = this.checkpointData.get(player.sensorId);
        if (!checkpointData) return;
        
        // Calculate which checkpoint the player should be at
        const expectedCheckpoint = Math.floor(currentPosition / this.checkpointInterval);
        
        // Check if player is progressing through checkpoints in order
        if (expectedCheckpoint > checkpointData.lastCheckpoint) {
            checkpointData.lastCheckpoint = expectedCheckpoint;
            checkpointData.checkpointsPassed++;
        }
        
        // Validate lap (player must pass through checkpoints in order)
        const minCheckpointsForValidLap = Math.floor(this.trackLength / this.checkpointInterval) * 0.8;
        checkpointData.validLap = checkpointData.checkpointsPassed >= minCheckpointsForValidLap;
    }
    
    /**
     * Reset checkpoint progress for new lap
     * @param {string} playerId - Player ID
     */
    resetCheckpointProgress(playerId) {
        const checkpointData = this.checkpointData.get(playerId);
        if (checkpointData) {
            checkpointData.lastCheckpoint = 0;
            checkpointData.checkpointsPassed = 0;
            checkpointData.validLap = true;
        }
    }
    
    /**
     * Update player rankings based on race progress
     * @param {Array} players - Array of player objects
     */
    updateRankings(players) {
        // Sort players by race progress (lap + position within lap)
        const sortedPlayers = [...players].sort((a, b) => {
            if (a.stats.finished && !b.stats.finished) return -1;
            if (!a.stats.finished && b.stats.finished) return 1;
            if (a.stats.finished && b.stats.finished) {
                return a.stats.finishTime - b.stats.finishTime;
            }
            
            // Compare by current lap
            if (a.stats.currentLap !== b.stats.currentLap) {
                return b.stats.currentLap - a.stats.currentLap;
            }
            
            // Same lap, compare by position
            const aPosition = a.carPhysics?.getState().trackPosition || 0;
            const bPosition = b.carPhysics?.getState().trackPosition || 0;
            return bPosition - aPosition;
        });
        
        // Assign rankings
        sortedPlayers.forEach((player, index) => {
            player.stats.rank = index + 1;
        });
    }
    
    /**
     * Check if race is completed
     * @param {Array} players - Array of player objects
     * @returns {boolean} True if race is completed
     */
    checkRaceCompletion(players) {
        const finishedPlayers = players.filter(p => p.stats.finished);
        
        if (finishedPlayers.length === players.length) {
            this.endRace(players);
            return true;
        }
        
        return false;
    }
    
    /**
     * End the race and record results
     * @param {Array} players - Array of player objects
     */
    endRace(players) {
        if (!this.isRaceActive) return;
        
        this.isRaceActive = false;
        this.raceEndTime = Date.now();
        
        // Record race in history
        const raceResult = {
            timestamp: this.raceStartTime,
            duration: (this.raceEndTime - this.raceStartTime) / 1000,
            players: players.map(p => ({
                sensorId: p.sensorId,
                rank: p.stats.rank,
                finishTime: p.stats.finishTime,
                bestLap: Math.min(...p.stats.lapTimes),
                averageLap: p.stats.averageLapTime,
                lapTimes: [...p.stats.lapTimes]
            }))
        };
        
        this.raceHistory.push(raceResult);
        this.saveRaceHistory();
        
        console.log('Race completed:', raceResult);
    }
    
    /**
     * Get time difference between players
     * @param {Object} player1 - First player
     * @param {Object} player2 - Second player
     * @returns {number} Time difference in seconds (positive if player1 is ahead)
     */
    getTimeDifference(player1, player2) {
        if (player1.stats.finished && player2.stats.finished) {
            return player2.stats.finishTime - player1.stats.finishTime;
        }
        
        if (player1.stats.currentLap !== player2.stats.currentLap) {
            // Different laps - calculate based on lap progress
            const lapDifference = player1.stats.currentLap - player2.stats.currentLap;
            return lapDifference * -30; // Approximate 30 seconds per lap difference
        }
        
        // Same lap - compare current lap times
        return player2.stats.lapTime - player1.stats.lapTime;
    }
    
    /**
     * Update personal best record
     * @param {string} playerId - Player ID
     * @param {number} lapTime - Lap time in seconds
     */
    updatePersonalBest(playerId, lapTime) {
        if (!this.personalBests[playerId]) {
            this.personalBests[playerId] = {};
        }
        
        this.personalBests[playerId].bestLap = lapTime;
        this.personalBests[playerId].timestamp = Date.now();
        this.savePersonalBests();
    }
    
    /**
     * Load personal best records from localStorage
     * @returns {Object} Personal best records
     */
    loadPersonalBests() {
        try {
            const saved = localStorage.getItem('3d-racing-personal-bests');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn('Failed to load personal bests:', error);
            return {};
        }
    }
    
    /**
     * Save personal best records to localStorage
     */
    savePersonalBests() {
        try {
            localStorage.setItem('3d-racing-personal-bests', JSON.stringify(this.personalBests));
        } catch (error) {
            console.warn('Failed to save personal bests:', error);
        }
    }
    
    /**
     * Save race history to localStorage
     */
    saveRaceHistory() {
        try {
            // Keep only last 50 races to prevent storage bloat
            const recentHistory = this.raceHistory.slice(-50);
            localStorage.setItem('3d-racing-history', JSON.stringify(recentHistory));
        } catch (error) {
            console.warn('Failed to save race history:', error);
        }
    }
    
    /**
     * Get race statistics for a player
     * @param {string} playerId - Player ID
     * @returns {Object} Race statistics
     */
    getPlayerStats(playerId) {
        const personalBest = this.personalBests[playerId];
        const playerRaces = this.raceHistory.filter(race => 
            race.players.some(p => p.sensorId === playerId)
        );
        
        const wins = playerRaces.filter(race => 
            race.players.find(p => p.sensorId === playerId)?.rank === 1
        ).length;
        
        return {
            totalRaces: playerRaces.length,
            wins: wins,
            winRate: playerRaces.length > 0 ? (wins / playerRaces.length) * 100 : 0,
            bestLap: personalBest?.bestLap || null,
            bestLapDate: personalBest?.timestamp || null
        };
    }
    
    /**
     * Reset race manager state
     */
    reset() {
        this.raceStartTime = 0;
        this.raceEndTime = 0;
        this.isRaceActive = false;
        this.lapStartTimes.clear();
        this.checkpointData.clear();
    }
}

class RacingGame {
    constructor() {
        this.sdk = null;
        this.gameState = 'waiting'; // waiting, ready, racing, finished
        this.players = {
            player1: {
                sensorId: 'sensor1',
                connected: false,
                screenSide: 'left',
                stats: {
                    lapTime: 0,
                    bestLap: Infinity,
                    currentLap: 1,
                    speed: 0,
                    rank: 1,
                    wins: 0,
                    totalRaceTime: 0,
                    lapTimes: [],
                    finished: false,
                    finishTime: 0,
                    averageLapTime: 0
                }
            },
            player2: {
                sensorId: 'sensor2',
                connected: false,
                screenSide: 'right',
                stats: {
                    lapTime: 0,
                    bestLap: Infinity,
                    currentLap: 1,
                    speed: 0,
                    rank: 2,
                    wins: 0,
                    totalRaceTime: 0,
                    lapTimes: [],
                    finished: false,
                    finishTime: 0,
                    averageLapTime: 0
                }
            }
        };
        
        this.gameMode = 'quick'; // quick, best-of-3, time-attack
        this.sessionInfo = {
            sessionCode: '',
            connectedSensors: 0
        };
        
        this.raceStartTime = 0;
        this.isPaused = false;
        
        // Initialize ScreenSplitter for dual screen rendering
        this.screenSplitter = null;
        
        // Initialize RaceManager for lap timing and progress tracking
        this.raceManager = new RaceManager();
        
        // Initialize GameModeManager for game modes and victory system
        this.gameModeManager = new GameModeManager();
        this.victorySystem = new VictorySystem();
        
        this.init();
    }

    async init() {
        console.log('Initializing 3D Racing Game...');
        
        try {
            // Initialize ScreenSplitter first
            this.initializeScreenSplitter();
            
            // Initialize SessionSDK with dual game type
            this.sdk = new SessionSDK({
                gameId: '3d-racing-game',
                gameType: 'dual',
                debug: true
            });

            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize session
            await this.initializeSession();
            
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('게임 초기화에 실패했습니다.');
        }
    }

    /**
     * Initialize the ScreenSplitter system
     */
    initializeScreenSplitter() {
        try {
            this.screenSplitter = new ScreenSplitter();
            console.log('ScreenSplitter initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ScreenSplitter:', error);
            throw new Error('Screen splitting system initialization failed');
        }
    }

    async initializeSession() {
        try {
            console.log('🔄 세션 초기화 시작...');
            
            // Create session for dual game type with enhanced configuration
            const sessionConfig = {
                gameType: 'dual',
                maxSensors: 2,
                sensorTypes: ['orientation'],
                timeout: 30000, // 30 second timeout
                retryAttempts: 3
            };
            
            const sessionData = await this.sdk.createSession(sessionConfig);
            
            this.sessionInfo.sessionCode = sessionData.sessionCode;
            this.sessionInfo.sessionUrl = sessionData.sessionUrl || this.buildSessionUrl(sessionData.sessionCode);
            
            // SessionStateManager 초기화
            if (window.sessionStateManager) {
                window.sessionStateManager.initializeSession(this.sdk, sessionData.sessionCode);
                this.setupSessionStateManagerEvents();
                console.log('✅ SessionStateManager 통합 완료');
            } else {
                console.warn('⚠️ SessionStateManager를 찾을 수 없음');
            }
            
            this.updateSessionUI();
            
            // Set up comprehensive sensor event listeners
            this.setupSensorEventListeners();
            
            // Generate QR code with fallback handling
            await this.generateQRCodeWithFallback(sessionData);
            
            // Set up session monitoring
            this.setupSessionMonitoring();
            
            console.log('✅ 세션 생성 완료:', {
                sessionCode: sessionData.sessionCode,
                gameType: sessionData.gameType,
                maxSensors: sessionData.maxSensors
            });
            
        } catch (error) {
            console.error('❌ 세션 생성 실패:', error);
            await this.handleSessionCreationError(error);
            throw error;
        }
    }
    
    /**
     * SessionStateManager 이벤트 설정
     */
    setupSessionStateManagerEvents() {
        const sessionManager = window.sessionStateManager;
        
        // 세션 초기화 완료 이벤트
        sessionManager.on('session-initialized', (data) => {
            console.log('📡 세션 초기화 완료:', data.sessionCode);
        });
        
        // 센서 연결 이벤트
        sessionManager.on('sensor-connected', (data) => {
            console.log(`🔗 센서 연결: ${data.sensorId} -> ${data.playerId}`);
            this.handleSensorConnectionWithAssignment(data.sensorId, data.playerId, data.connectionInfo);
        });
        
        // 센서 연결 해제 이벤트
        sessionManager.on('sensor-disconnected', (data) => {
            console.log(`🔌 센서 연결 해제: ${data.sensorId} (${data.playerId})`);
            this.handleSensorDisconnectionWithPreservation(data.sensorId, data.playerId);
        });
        
        // 센서 재연결 이벤트
        sessionManager.on('sensor-reconnected', (data) => {
            console.log(`🔄 센서 재연결: ${data.sensorId} -> ${data.playerId}`);
            this.handleSensorReconnection(data.sensorId, data.playerId);
        });
        
        // 모든 센서 연결 완료 이벤트
        sessionManager.on('all-sensors-connected', (data) => {
            console.log('✅ 모든 센서 연결 완료');
            this.sessionInfo.connectedSensors = data.connectedSensors;
            this.checkReadyState();
        });
        
        // 재연결을 위한 게임 일시정지 이벤트
        sessionManager.on('game-paused-for-reconnection', (data) => {
            console.log(`⏸️ 재연결을 위한 게임 일시정지: ${data.sensorId}`);
            this.pauseGameForReconnection(data.sensorId, data.playerId);
        });
        
        // 재연결 시도 이벤트
        sessionManager.on('reconnection-attempt', (data) => {
            console.log(`🔄 재연결 시도: ${data.sensorId} (${data.attempt}/${data.maxAttempts})`);
            this.showReconnectionAttemptUI(data);
        });
        
        // 재연결 실패 이벤트
        sessionManager.on('reconnection-failed', (data) => {
            console.log(`❌ 재연결 실패: ${data.sensorId}`);
            this.handleReconnectionFailure(data.sensorId);
        });
        
        // 세션 유지 게임 재시작 이벤트
        sessionManager.on('game-restarted-with-session', (data) => {
            console.log(`🎮 세션 유지 게임 재시작: ${data.gameCount}회차`);
            this.handleSessionPreservedRestart(data);
        });
        
        // 센서 데이터 처리 이벤트
        sessionManager.on('sensor-data-processed', (data) => {
            this.processSensorDataWithPlayerAssignment(data.sensorData, data.playerId);
        });
    }
    
    /**
     * 플레이어 할당과 함께 센서 연결 처리
     * @param {string} sensorId - 센서 ID
     * @param {string} playerId - 할당된 플레이어 ID
     * @param {Object} connectionInfo - 연결 정보
     */
    handleSensorConnectionWithAssignment(sensorId, playerId, connectionInfo) {
        // 플레이어 객체에 센서 ID 할당
        if (this.players[playerId]) {
            this.players[playerId].sensorId = sensorId;
            this.players[playerId].connectionInfo = connectionInfo;
            
            console.log(`✅ 플레이어 할당 완료: ${playerId} <- ${sensorId}`);
            
            // UI 업데이트
            this.updatePlayerConnectionStatus(playerId, true, connectionInfo.isReconnection);
        }
        
        // 연결 카운트 업데이트
        this.sessionInfo.connectedSensors = window.sessionStateManager.sessionData.connectedSensors.size;
    }
    
    /**
     * 연결 보존과 함께 센서 연결 해제 처리
     * @param {string} sensorId - 센서 ID
     * @param {string} playerId - 플레이어 ID
     */
    handleSensorDisconnectionWithPreservation(sensorId, playerId) {
        // 플레이어 연결 상태 업데이트 (할당은 유지)
        if (this.players[playerId]) {
            this.players[playerId].isConnected = false;
            this.players[playerId].disconnectedAt = Date.now();
            
            console.log(`⚠️ 플레이어 ${playerId} 연결 해제 (할당 유지)`);
            
            // UI 업데이트
            this.updatePlayerConnectionStatus(playerId, false);
        }
        
        // 연결 카운트 업데이트
        const connectedCount = Array.from(window.sessionStateManager.sessionData.connectedSensors.values())
            .filter(info => info.isConnected !== false).length;
        this.sessionInfo.connectedSensors = connectedCount;
    }
    
    /**
     * 센서 재연결 처리
     * @param {string} sensorId - 센서 ID
     * @param {string} playerId - 플레이어 ID
     */
    handleSensorReconnection(sensorId, playerId) {
        if (this.players[playerId]) {
            this.players[playerId].isConnected = true;
            this.players[playerId].reconnectedAt = Date.now();
            
            console.log(`🔄 플레이어 ${playerId} 재연결 완료`);
            
            // UI 업데이트
            this.updatePlayerConnectionStatus(playerId, true, true);
            
            // 게임이 일시정지되어 있다면 재개 가능 상태로 변경
            if (this.gameState === 'paused' && this.sessionInfo.connectedSensors === 2) {
                this.gameState = 'racing';
                this.isPaused = false;
                
                // 재개 알림
                if (this.uiManager) {
                    this.uiManager.showNotification(playerId, '재연결 완료! 게임이 재개됩니다.', 'success', 3000);
                }
            }
        }
    }
    
    /**
     * 플레이어 연결 상태 UI 업데이트
     * @param {string} playerId - 플레이어 ID
     * @param {boolean} connected - 연결 상태
     * @param {boolean} isReconnection - 재연결 여부
     */
    updatePlayerConnectionStatus(playerId, connected, isReconnection = false) {
        const statusElement = document.getElementById(`${playerId}-status`);
        if (statusElement) {
            const playerNum = playerId === 'player1' ? '1' : '2';
            const statusIcon = connected ? '✓' : '⏳';
            const statusText = connected ? 
                (isReconnection ? '재연결됨' : '연결됨') : '연결 끊김';
            
            statusElement.innerHTML = `
                Player ${playerNum}: <span class="status-icon">${statusIcon}</span>
                <span class="player-name ${connected ? 'connected' : 'disconnected'}">${statusText}</span>
            `;
        }
        
        // HUD 연결 상태 업데이트
        const connectionElement = document.getElementById(`${playerId.charAt(0)}${playerId.slice(-1)}-connection-status`);
        if (connectionElement) {
            const dot = connectionElement.querySelector('.indicator-dot');
            const text = connectionElement.querySelector('.indicator-text');
            
            if (dot) {
                dot.className = `indicator-dot ${connected ? '' : 'disconnected'}`;
            }
            if (text) {
                text.textContent = connected ? '연결됨' : '연결 끊김';
            }
        }
    }
    
    /**
     * 재연결을 위한 게임 일시정지
     * @param {string} sensorId - 센서 ID
     * @param {string} playerId - 플레이어 ID
     */
    pauseGameForReconnection(sensorId, playerId) {
        if (this.gameState === 'racing') {
            this.gameState = 'paused';
            this.isPaused = true;
            
            // 일시정지 UI 업데이트
            const pauseBtn = document.getElementById('pause-btn');
            if (pauseBtn) {
                pauseBtn.textContent = 'Resume';
                pauseBtn.disabled = true; // 재연결 완료까지 비활성화
            }
            
            // 재연결 대기 알림
            if (this.uiManager) {
                this.uiManager.showNotification('player1', `${playerId} 재연결 대기 중...`, 'warning', 5000);
                this.uiManager.showNotification('player2', `${playerId} 재연결 대기 중...`, 'warning', 5000);
            }
            
            console.log(`⏸️ 게임 일시정지: ${playerId} 재연결 대기`);
        }
    }
    
    /**
     * 재연결 시도 UI 표시
     * @param {Object} data - 재연결 시도 데이터
     */
    showReconnectionAttemptUI(data) {
        const playerId = window.sessionStateManager.sessionData.playerAssignments.get(data.sensorId);
        
        if (this.uiManager && playerId) {
            const message = `재연결 시도 중... (${data.attempt}/${data.maxAttempts})`;
            this.uiManager.showNotification(playerId, message, 'info', 2000);
        }
    }
    
    /**
     * 재연결 실패 처리
     * @param {string} sensorId - 센서 ID
     */
    handleReconnectionFailure(sensorId) {
        const playerId = window.sessionStateManager.sessionData.playerAssignments.get(sensorId);
        
        if (this.uiManager && playerId) {
            this.uiManager.showNotification(playerId, '재연결에 실패했습니다. 센서를 다시 연결해주세요.', 'error', 10000);
        }
        
        // 게임 상태를 대기로 변경
        this.gameState = 'waiting';
        this.isPaused = false;
        
        console.log(`❌ 센서 ${sensorId} 재연결 실패`);
    }
    
    /**
     * 세션 보존 재시작 처리
     * @param {Object} data - 재시작 데이터
     */
    handleSessionPreservedRestart(data) {
        // 게임 모드 UI 업데이트
        this.updateGameModeUI();
        
        // 연속 플레이 통계 업데이트
        this.updateContinuousPlayStats(data);
        
        console.log(`🎮 세션 보존 재시작 처리 완료: ${data.gameCount}회차`);
    }
    
    /**
     * 연속 플레이 통계 업데이트
     * @param {Object} data - 재시작 데이터
     */
    updateContinuousPlayStats(data) {
        // 통계 정보 표시
        const statsElement = document.getElementById('session-stats');
        if (statsElement) {
            const sessionStats = window.sessionStateManager.getSessionStats();
            statsElement.innerHTML = `
                <div class="session-stats">
                    <span>연속 플레이: ${data.gameCount}회</span>
                    <span>세션 시간: ${this.formatDuration(sessionStats.sessionUptime)}</span>
                </div>
            `;
        }
    }
    
    /**
     * 플레이어 할당과 함께 센서 데이터 처리
     * @param {Object} sensorData - 센서 데이터
     * @param {string} playerId - 할당된 플레이어 ID
     */
    processSensorDataWithPlayerAssignment(sensorData, playerId) {
        if (this.players[playerId] && this.gameState === 'racing' && !this.isPaused) {
            // 기존 센서 데이터 처리 로직 사용
            this.processSensorData(sensorData, playerId);
        }
    }
    
    /**
     * 시간 포맷팅 유틸리티
     * @param {number} milliseconds - 밀리초
     * @returns {string} 포맷된 시간 문자열
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}시간 ${minutes % 60}분`;
        } else if (minutes > 0) {
            return `${minutes}분 ${seconds % 60}초`;
        } else {
            return `${seconds}초`;
        }
    }

    setupEventListeners() {
        // Control buttons
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startRace();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartRace();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('hub-btn').addEventListener('click', () => {
            this.returnToHub();
        });

        // Game mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectGameMode(e.target.dataset.mode);
            });
        });

        // Results modal buttons
        document.getElementById('next-race-btn').addEventListener('click', () => {
            this.startNextRace();
        });
        
        document.getElementById('finish-btn').addEventListener('click', () => {
            this.finishGame();
        });
    }

    setupSensorEventListeners() {
        // Enhanced sensor event listeners with comprehensive error handling
        this.sdk.on('sensorConnected', (event) => {
            try {
                this.handleSensorConnected(event);
            } catch (error) {
                console.error('Error handling sensor connection:', error);
                this.handleSensorError('connection', error);
            }
        });
        
        this.sdk.on('sensorDisconnected', (event) => {
            try {
                this.handleSensorDisconnected(event);
            } catch (error) {
                console.error('Error handling sensor disconnection:', error);
                this.handleSensorError('disconnection', error);
            }
        });
        
        this.sdk.on('sensorData', (event) => {
            try {
                this.handleSensorData(event);
            } catch (error) {
                console.error('Error handling sensor data:', error);
                this.handleSensorError('data', error);
            }
        });

        // Session-level event listeners
        this.sdk.on('sessionError', (event) => {
            const eventData = event.detail || event;
            console.error('Session error:', eventData);
            this.handleSessionError(eventData);
        });

        this.sdk.on('sessionTimeout', (event) => {
            const eventData = event.detail || event;
            console.warn('Session timeout:', eventData);
            this.handleSessionTimeout(eventData);
        });

        // Network and connection monitoring
        this.sdk.on('connectionLost', (event) => {
            const eventData = event.detail || event;
            console.warn('Connection lost:', eventData);
            this.handleConnectionLost(eventData);
        });

        this.sdk.on('connectionRestored', (event) => {
            const eventData = event.detail || event;
            console.log('Connection restored:', eventData);
            this.handleConnectionRestored(eventData);
        });
    }

    buildSessionUrl(sessionCode) {
        // Build session URL for QR code generation
        const baseUrl = window.location.origin;
        const hubPath = '/sensor-game-hub'; // Adjust based on actual hub path
        return `${baseUrl}${hubPath}/join?session=${sessionCode}&game=3d-racing-game`;
    }

    async generateQRCodeWithFallback(sessionData) {
        const qrContainer = document.getElementById('qr-container');
        const sessionUrl = sessionData.sessionUrl || this.sessionInfo.sessionUrl;
        
        try {
            // Primary QR code generation method
            await this.generateQRCodePrimary(sessionUrl, qrContainer);
        } catch (primaryError) {
            console.warn('Primary QR generation failed, trying fallback:', primaryError);
            
            try {
                // Fallback QR code generation method
                await this.generateQRCodeFallback(sessionUrl, qrContainer);
            } catch (fallbackError) {
                console.error('All QR generation methods failed:', fallbackError);
                
                // Final fallback - display session code and URL
                this.displaySessionInfoFallback(sessionData.sessionCode, sessionUrl, qrContainer);
            }
        }
    }

    async generateQRCodePrimary(sessionUrl, container) {
        // Try using QRCode.js library if available
        if (typeof window.QRCode !== 'undefined') {
            container.innerHTML = '';
            new window.QRCode(container, {
                text: sessionUrl,
                width: 128,
                height: 128,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: window.QRCode.CorrectLevel.M
            });
            console.log('QR code generated successfully with QRCode.js');
            return;
        }
        
        // Try using online QR code API
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(sessionUrl)}`;
        
        const img = document.createElement('img');
        img.src = qrApiUrl;
        img.alt = 'Session QR Code';
        img.style.width = '128px';
        img.style.height = '128px';
        
        return new Promise((resolve, reject) => {
            img.onload = () => {
                container.innerHTML = '';
                container.appendChild(img);
                console.log('QR code generated successfully with API');
                resolve();
            };
            
            img.onerror = () => {
                reject(new Error('QR API failed to load'));
            };
            
            // Timeout after 5 seconds
            setTimeout(() => {
                reject(new Error('QR API timeout'));
            }, 5000);
        });
    }

    async generateQRCodeFallback(sessionUrl, container) {
        // Fallback using a different QR API
        const fallbackApiUrl = `https://chart.googleapis.com/chart?chs=128x128&cht=qr&chl=${encodeURIComponent(sessionUrl)}`;
        
        const img = document.createElement('img');
        img.src = fallbackApiUrl;
        img.alt = 'Session QR Code';
        img.style.width = '128px';
        img.style.height = '128px';
        
        return new Promise((resolve, reject) => {
            img.onload = () => {
                container.innerHTML = '';
                container.appendChild(img);
                console.log('QR code generated successfully with fallback API');
                resolve();
            };
            
            img.onerror = () => {
                reject(new Error('Fallback QR API failed'));
            };
            
            setTimeout(() => {
                reject(new Error('Fallback QR API timeout'));
            }, 5000);
        });
    }

    displaySessionInfoFallback(sessionCode, sessionUrl, container) {
        // Final fallback - display session info as text
        container.innerHTML = `
            <div class="session-fallback">
                <div class="session-code-display">
                    <strong>세션 코드:</strong><br>
                    <span class="code">${sessionCode}</span>
                </div>
                <div class="session-url-display">
                    <small>또는 링크 사용:</small><br>
                    <a href="${sessionUrl}" target="_blank" class="session-link">
                        게임 참가하기
                    </a>
                </div>
            </div>
        `;
        
        console.log('Using fallback session info display');
    }

    setupSessionMonitoring() {
        // Monitor session health and connectivity
        this.sessionMonitorInterval = setInterval(() => {
            this.checkSessionHealth();
        }, 10000); // Check every 10 seconds

        // Monitor sensor data flow
        this.sensorDataMonitor = {
            sensor1: { lastReceived: 0, dataCount: 0 },
            sensor2: { lastReceived: 0, dataCount: 0 }
        };
    }

    checkSessionHealth() {
        const now = Date.now();
        const timeout = 15000; // 15 seconds timeout
        
        // Check if sensors are sending data regularly during racing
        if (this.gameState === 'racing' && !this.isPaused) {
            Object.entries(this.sensorDataMonitor).forEach(([sensorId, monitor]) => {
                if (monitor.lastReceived > 0 && (now - monitor.lastReceived) > timeout) {
                    console.warn(`${sensorId} data timeout detected`);
                    this.handleSensorTimeout(sensorId);
                }
            });
        }
        
        // Check session connectivity
        if (this.sdk && typeof this.sdk.isConnected === 'function') {
            if (!this.sdk.isConnected()) {
                console.warn('Session connectivity lost');
                this.handleSessionConnectivityLoss();
            }
        }
    }

    async handleSessionCreationError(error) {
        console.error('Session creation failed:', error);
        
        // Try to recover based on error type
        if (error.code === 'NETWORK_ERROR') {
            // Network issue - show retry option
            this.showNetworkErrorDialog();
        } else if (error.code === 'SERVER_ERROR') {
            // Server issue - try alternative approach
            await this.tryAlternativeSessionCreation();
        } else {
            // Unknown error - show generic error
            this.showError('세션 생성에 실패했습니다. 페이지를 새로고침해 주세요.');
        }
    }

    async tryAlternativeSessionCreation() {
        try {
            console.log('Attempting alternative session creation...');
            
            // Simplified session creation without advanced features
            const basicSessionData = await this.sdk.createSession({
                gameType: 'dual',
                maxSensors: 2
            });
            
            this.sessionInfo.sessionCode = basicSessionData.sessionCode;
            this.sessionInfo.sessionUrl = this.buildSessionUrl(basicSessionData.sessionCode);
            
            this.updateSessionUI();
            this.setupSensorEventListeners();
            
            // Use basic QR code fallback
            this.displaySessionInfoFallback(
                basicSessionData.sessionCode, 
                this.sessionInfo.sessionUrl, 
                document.getElementById('qr-container')
            );
            
            console.log('Alternative session creation successful');
            
        } catch (alternativeError) {
            console.error('Alternative session creation also failed:', alternativeError);
            throw alternativeError;
        }
    }

    handleSensorError(type, error) {
        console.error(`Sensor ${type} error:`, error);
        
        // Don't interrupt gameplay for minor sensor errors
        if (this.gameState === 'racing') {
            // Log error but continue
            console.warn(`Continuing race despite sensor ${type} error`);
        } else {
            // Show error in waiting state
            this.showSensorErrorNotification(type, error);
        }
    }

    handleSessionError(eventData) {
        console.error('Session error occurred:', eventData);
        
        if (this.gameState === 'racing') {
            this.pauseGame();
        }
        
        this.showError(`세션 오류가 발생했습니다: ${eventData.message || '알 수 없는 오류'}`);
    }

    handleSessionTimeout(eventData) {
        console.warn('Session timeout occurred:', eventData);
        
        // Try to reconnect
        this.attemptSessionReconnection();
    }

    handleConnectionLost(eventData) {
        console.warn('Connection lost:', eventData);
        
        if (this.gameState === 'racing') {
            this.pauseGame();
        }
        
        this.showConnectionLostDialog();
    }

    handleConnectionRestored(eventData) {
        console.log('Connection restored:', eventData);
        
        this.hideConnectionLostDialog();
        
        // Resume game if it was paused due to connection loss
        if (this.gameState === 'racing' && this.isPaused) {
            this.togglePause();
        }
    }

    handleSensorTimeout(sensorId) {
        console.warn(`${sensorId} timeout - attempting recovery`);
        
        // Mark sensor as potentially disconnected
        const player = sensorId === 'sensor1' ? this.players.player1 : this.players.player2;
        if (player) {
            this.updatePlayerStatus(player.sensorId.replace('sensor', 'player'), false);
        }
        
        // Try to recover connection
        this.attemptSensorReconnection(sensorId);
    }

    handleSessionConnectivityLoss() {
        console.warn('Session connectivity lost - attempting recovery');
        
        if (this.gameState === 'racing') {
            this.pauseGame();
        }
        
        this.attemptSessionReconnection();
    }

    async attemptSessionReconnection() {
        try {
            console.log('Attempting session reconnection...');
            
            if (this.sdk && typeof this.sdk.reconnect === 'function') {
                await this.sdk.reconnect();
                console.log('Session reconnection successful');
            } else {
                // Fallback - reinitialize session
                await this.initializeSession();
            }
            
        } catch (error) {
            console.error('Session reconnection failed:', error);
            this.showError('연결 복구에 실패했습니다. 페이지를 새로고침해 주세요.');
        }
    }

    async attemptSensorReconnection(sensorId) {
        try {
            console.log(`Attempting ${sensorId} reconnection...`);
            
            if (this.sdk && typeof this.sdk.reconnectSensor === 'function') {
                await this.sdk.reconnectSensor(sensorId);
                console.log(`${sensorId} reconnection successful`);
            }
            
        } catch (error) {
            console.error(`${sensorId} reconnection failed:`, error);
        }
    }

    showNetworkErrorDialog() {
        // Placeholder for network error dialog
        const retry = confirm('네트워크 연결에 문제가 있습니다. 다시 시도하시겠습니까?');
        if (retry) {
            window.location.reload();
        }
    }

    showSensorErrorNotification(type, error) {
        console.warn(`Sensor ${type} error notification:`, error.message);
        // In a real implementation, this would show a non-intrusive notification
    }

    showConnectionLostDialog() {
        // Placeholder for connection lost dialog
        console.log('Showing connection lost dialog');
        // In a real implementation, this would show a modal dialog
    }

    hideConnectionLostDialog() {
        // Placeholder for hiding connection lost dialog
        console.log('Hiding connection lost dialog');
    }

    handleSensorConnected(event) {
        console.log('Sensor connected:', event);
        
        // Use event.detail || event pattern for safe event handling
        const eventData = event.detail || event;
        const sensorId = eventData.sensorId;
        
        if (sensorId === 'sensor1') {
            this.players.player1.connected = true;
            this.updatePlayerStatus('player1', true);
        } else if (sensorId === 'sensor2') {
            this.players.player2.connected = true;
            this.updatePlayerStatus('player2', true);
        }
        
        this.sessionInfo.connectedSensors++;
        this.checkReadyState();
    }

    handleSensorDisconnected(event) {
        console.log('Sensor disconnected:', event);
        
        const eventData = event.detail || event;
        const sensorId = eventData.sensorId;
        
        if (sensorId === 'sensor1') {
            this.players.player1.connected = false;
            this.updatePlayerStatus('player1', false);
        } else if (sensorId === 'sensor2') {
            this.players.player2.connected = false;
            this.updatePlayerStatus('player2', false);
        }
        
        this.sessionInfo.connectedSensors--;
        
        // Pause game if racing
        if (this.gameState === 'racing') {
            this.pauseGame();
            this.showReconnectionDialog(sensorId);
        }
        
        this.checkReadyState();
    }

    handleSensorData(event) {
        // Use event.detail || event pattern for safe event handling
        const eventData = event.detail || event;
        const sensorId = eventData.sensorId;
        const sensorData = eventData.data;
        
        // Update sensor data monitoring
        if (this.sensorDataMonitor && this.sensorDataMonitor[sensorId]) {
            this.sensorDataMonitor[sensorId].lastReceived = Date.now();
            this.sensorDataMonitor[sensorId].dataCount++;
        }
        
        // Validate sensor data structure
        if (!this.validateSensorData(sensorData)) {
            console.warn(`Invalid sensor data received from ${sensorId}:`, sensorData);
            return;
        }
        
        if (!sensorData || this.gameState !== 'racing' || this.isPaused) {
            return;
        }
        
        // Process sensor input for the correct player
        if (sensorId === 'sensor1') {
            this.processSensorInput(this.players.player1, sensorData);
        } else if (sensorId === 'sensor2') {
            this.processSensorInput(this.players.player2, sensorData);
        }
    }

    validateSensorData(sensorData) {
        // Validate sensor data structure and content
        if (!sensorData || typeof sensorData !== 'object') {
            return false;
        }
        
        // Check for required orientation data
        if (!sensorData.orientation) {
            return false;
        }
        
        const { beta, gamma } = sensorData.orientation;
        
        // Validate orientation values are numbers and within expected ranges
        if (typeof beta !== 'number' || typeof gamma !== 'number') {
            return false;
        }
        
        // Check for reasonable ranges (beta: -180 to 180, gamma: -90 to 90)
        if (beta < -180 || beta > 180 || gamma < -90 || gamma > 90) {
            console.warn('Sensor data out of expected range:', { beta, gamma });
            // Don't reject, but log warning
        }
        
        return true;
    }

    processSensorInput(player, sensorData) {
        // Initialize car physics engine if not exists
        if (!player.carPhysics) {
            player.carPhysics = new CarPhysicsEngine({
                startX: 0,
                startY: 0,
                startZ: 0,
                startAngle: 0
            });
            console.log(`Initialized CarPhysicsEngine for ${player.sensorId}`);
        }
        
        // Process sensor input through the car physics engine
        player.carPhysics.processSensorInput(sensorData);
        
        // Update player stats from physics engine
        const carState = player.carPhysics.getState();
        player.stats.speed = Math.abs(carState.speed);
        player.stats.position = carState.position;
        player.stats.angle = carState.angle;
        player.stats.onTrack = carState.onTrack;
        player.stats.health = carState.health;
        
        // Store sensor debug info for UI display
        if (player.carPhysics.sensorDebugInfo) {
            player.sensorDebugInfo = player.carPhysics.sensorDebugInfo;
        }
        
        // Update UI
        this.updatePlayerHUD(player);
        
        // Debug logging (reduced frequency)
        if (Math.random() < 0.01) {
            const debugInfo = player.sensorDebugInfo || {};
            console.log(`${player.sensorId} [${debugInfo.platform || 'unknown'}] - Speed: ${player.stats.speed.toFixed(1)} | Controls: T=${debugInfo.throttle?.toFixed(2) || '0.00'} S=${debugInfo.steering?.toFixed(2) || '0.00'} | OnTrack: ${player.stats.onTrack}`);
        }
    }

    updatePlayerStatus(playerId, connected) {
        const statusElement = document.getElementById(`${playerId}-status`);
        const iconElement = statusElement.querySelector('.status-icon');
        
        if (connected) {
            iconElement.textContent = '✓';
            iconElement.style.color = 'var(--success-green)';
        } else {
            iconElement.textContent = '⏳';
            iconElement.style.color = 'var(--warning-yellow)';
        }
    }

    updatePlayerHUD(player) {
        const prefix = player.screenSide === 'left' ? 'p1' : 'p2';
        
        // Update basic race info
        document.getElementById(`${prefix}-lap`).textContent = `${player.stats.currentLap}/${this.raceManager.totalLaps}`;
        document.getElementById(`${prefix}-speed`).textContent = Math.round(player.stats.speed);
        document.getElementById(`${prefix}-rank`).textContent = player.stats.rank;
        
        // Update lap time display
        if (this.gameState === 'racing' && !this.isPaused) {
            const lapTime = player.stats.lapTime || 0;
            const minutes = Math.floor(lapTime / 60);
            const seconds = (lapTime % 60).toFixed(1);
            document.getElementById(`${prefix}-time`).textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(4, '0')}`;
        }
        
        // Update best lap time
        if (player.stats.bestLap && player.stats.bestLap !== Infinity) {
            const bestMinutes = Math.floor(player.stats.bestLap / 60);
            const bestSeconds = (player.stats.bestLap % 60).toFixed(3);
            const bestLapElement = document.getElementById(`${prefix}-best-lap`);
            if (bestLapElement) {
                bestLapElement.textContent = `Best: ${bestMinutes}:${bestSeconds.padStart(6, '0')}`;
            }
        }
        
        // Update time difference between players
        if (this.gameState === 'racing') {
            this.updateTimeDifference();
        }
        
        // Update total race time
        if (player.stats.totalRaceTime > 0) {
            const totalMinutes = Math.floor(player.stats.totalRaceTime / 60);
            const totalSeconds = (player.stats.totalRaceTime % 60).toFixed(1);
            const totalTimeElement = document.getElementById(`${prefix}-total-time`);
            if (totalTimeElement) {
                totalTimeElement.textContent = `Total: ${totalMinutes}:${totalSeconds.padStart(4, '0')}`;
            }
        }
    }
    
    /**
     * Update time difference display between players
     */
    updateTimeDifference() {
        const timeDiff = this.raceManager.getTimeDifference(this.players.player1, this.players.player2);
        const timeDiffElement = document.getElementById('time-difference');
        
        if (timeDiffElement && Math.abs(timeDiff) > 0.1) {
            const absTimeDiff = Math.abs(timeDiff);
            const leader = timeDiff > 0 ? 'P1' : 'P2';
            const minutes = Math.floor(absTimeDiff / 60);
            const seconds = (absTimeDiff % 60).toFixed(1);
            
            if (minutes > 0) {
                timeDiffElement.textContent = `${leader} leads by ${minutes}:${seconds.padStart(4, '0')}`;
            } else {
                timeDiffElement.textContent = `${leader} leads by ${seconds}s`;
            }
            timeDiffElement.style.display = 'block';
        } else if (timeDiffElement) {
            timeDiffElement.style.display = 'none';
        }
    }

    updateSessionUI() {
        document.getElementById('session-code').textContent = `Session: ${this.sessionInfo.sessionCode}`;
    }

    generateQRCode(sessionCode) {
        // Placeholder for QR code generation
        const qrContainer = document.getElementById('qr-container');
        qrContainer.textContent = 'QR';
        qrContainer.title = `Session Code: ${sessionCode}`;
        
        // In a real implementation, you would generate an actual QR code here
        console.log('QR Code should be generated for session:', sessionCode);
    }

    checkReadyState() {
        const bothConnected = this.players.player1.connected && this.players.player2.connected;
        const startBtn = document.getElementById('start-btn');
        
        if (bothConnected && this.gameState === 'waiting') {
            startBtn.disabled = false;
            this.gameState = 'ready';
            this.hideLoadingScreen();
        } else {
            startBtn.disabled = true;
            if (this.gameState === 'ready') {
                this.gameState = 'waiting';
            }
        }
    }

    selectGameMode(mode) {
        // 게임 모드 관리자를 통해 모드 선택
        if (this.gameModeManager.selectGameMode(mode)) {
            this.gameMode = mode;
            document.getElementById('mode-selection').classList.remove('show');
            
            // UI 업데이트
            this.updateGameModeUI();
            
            console.log('Game mode selected:', mode);
        } else {
            console.error('Failed to select game mode:', mode);
            this.showError('게임 모드 선택에 실패했습니다.');
        }
    }
    
    /**
     * 게임 모드 UI 업데이트
     */
    updateGameModeUI() {
        const modeInfo = this.gameModeManager.getCurrentModeInfo();
        if (!modeInfo) return;
        
        // 모드 정보 표시
        const modeDisplay = document.getElementById('current-mode-display');
        if (modeDisplay) {
            modeDisplay.textContent = modeInfo.config.name;
        }
        
        // 토너먼트 진행 상황 표시
        const tournamentProgress = document.getElementById('tournament-progress');
        const raceProgress = document.getElementById('race-progress');
        const seriesScore = document.getElementById('series-score');
        
        if (modeInfo.tournament && tournamentProgress && raceProgress && seriesScore) {
            const tournament = modeInfo.tournament;
            
            // 베스트 오브 3 모드에서만 토너먼트 진행 상황 표시
            if (modeInfo.mode === 'best-of-3') {
                tournamentProgress.style.display = 'block';
                raceProgress.textContent = `경주 ${tournament.currentRace}/${tournament.totalRaces}`;
                seriesScore.textContent = `P1: ${tournament.player1Wins}승 | P2: ${tournament.player2Wins}승`;
            } else {
                tournamentProgress.style.display = 'none';
            }
        }
        
        // 타임 어택 모드에서 시간 제한 표시
        if (modeInfo.mode === 'time-attack' && modeInfo.config.timeLimit) {
            this.updateTimeAttackTimer(modeInfo.config.timeLimit);
        }
    }
    
    /**
     * 타임 어택 타이머 업데이트
     * @param {number} timeLimit - 제한 시간 (초)
     */
    updateTimeAttackTimer(timeLimit) {
        if (this.gameState !== 'racing') return;
        
        const elapsed = (Date.now() - this.raceStartTime) / 1000;
        const remaining = Math.max(0, timeLimit - elapsed);
        
        // 타이머 표시 요소가 없으면 생성
        let timerElement = document.getElementById('time-attack-timer');
        if (!timerElement && remaining > 0) {
            timerElement = document.createElement('div');
            timerElement.id = 'time-attack-timer';
            timerElement.className = 'time-attack-timer';
            document.getElementById('screen-container').appendChild(timerElement);
        }
        
        if (timerElement) {
            if (remaining > 0) {
                const minutes = Math.floor(remaining / 60);
                const seconds = Math.floor(remaining % 60);
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                // 마지막 30초에 경고 효과
                if (remaining <= 30) {
                    timerElement.classList.add('time-attack-warning');
                } else {
                    timerElement.classList.remove('time-attack-warning');
                }
            } else {
                // 시간 종료
                timerElement.textContent = '시간 종료!';
                setTimeout(() => {
                    if (timerElement) {
                        timerElement.remove();
                    }
                }, 3000);
                
                // 타임 어택 종료 처리
                this.handleTimeAttackEnd();
            }
        }
    }
    
    /**
     * 타임 어택 종료 처리
     */
    handleTimeAttackEnd() {
        if (this.gameState === 'racing') {
            console.log('Time attack ended');
            this.handleRaceCompletion();
        }
    }

    startRace() {
        if (this.gameState !== 'ready') return;
        
        this.gameState = 'racing';
        this.raceStartTime = Date.now();
        this.isPaused = false;
        
        // Start race with GameModeManager
        const players = Object.values(this.players);
        const raceConfig = this.gameModeManager.startRace(players);
        
        // Configure RaceManager with game mode settings
        if (raceConfig.laps !== 999) { // 타임 어택이 아닌 경우
            this.raceManager.totalLaps = raceConfig.laps;
        }
        
        // Start race with RaceManager
        const trackData = this.screenSplitter?.currentTrack;
        this.raceManager.startRace(players, trackData);
        
        // Update UI
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        this.updateGameModeUI();
        
        console.log('Race started with mode:', this.gameMode);
        this.gameLoop();
    }

    async restartRace() {
        console.log('🔄 게임 재시작 시작 (세션 유지)...');
        
        try {
            // 세션 상태 관리자를 통한 재시작
            if (window.sessionStateManager) {
                const result = await window.sessionStateManager.restartGameWithSessionPreservation(this);
                
                if (result.success) {
                    console.log(`✅ 세션 유지 재시작 성공 (${result.gameCount}회차)`);
                    
                    // UI 업데이트
                    this.updateSessionPreservationUI(result);
                } else {
                    console.warn('⚠️ 세션 유지 재시작 실패, 일반 재시작 진행');
                    this.performStandardRestart();
                }
            } else {
                console.warn('⚠️ SessionStateManager 없음, 일반 재시작 진행');
                this.performStandardRestart();
            }
            
        } catch (error) {
            console.error('❌ 재시작 중 오류 발생:', error);
            this.performStandardRestart();
        }
    }
    
    /**
     * 세션 유지를 위한 게임 상태 리셋 (SessionStateManager에서 호출)
     * @param {boolean} preserveSession - 세션 보존 여부
     */
    async resetGameState(preserveSession = true) {
        console.log(`🔄 게임 상태 리셋 (세션 보존: ${preserveSession})`);
        
        // 게임 상태 초기화
        this.gameState = 'ready';
        this.isPaused = false;
        
        // 레이스 매니저 리셋
        if (this.raceManager) {
            this.raceManager.reset();
        }
        
        // 플레이어 상태 초기화 (연결 정보는 유지)
        Object.values(this.players).forEach(player => {
            this.resetPlayerGameState(player, preserveSession);
        });
        
        // 트랙 상태 초기화
        if (this.currentTrack) {
            this.resetTrackState();
        }
        
        // 오디오 시스템 리셋
        if (this.audioManager) {
            this.audioManager.stopAllSounds();
        }
        
        // UI 상태 업데이트
        this.updateUIAfterReset(preserveSession);
        
        console.log('✅ 게임 상태 리셋 완료');
    }
    
    /**
     * 플레이어 게임 상태 초기화
     * @param {Object} player - 플레이어 객체
     * @param {boolean} preserveSession - 세션 보존 여부
     */
    resetPlayerGameState(player, preserveSession) {
        // 게임 통계 초기화
        player.stats = {
            lapTime: 0,
            currentLap: 1,
            speed: 0,
            rank: 1,
            totalRaceTime: 0,
            lapTimes: [],
            finished: false,
            finishTime: 0,
            averageLapTime: 0,
            bestLap: player.stats?.bestLap || null, // 베스트 랩은 세션 중 유지
            position: { x: 0, y: 0, z: 0 }
        };
        
        // 자동차 물리 상태 리셋
        if (player.carPhysics) {
            player.carPhysics.reset();
        }
        
        // 자동차 위치 초기화
        if (player.car) {
            player.car.position = { x: 0, y: 0, z: 0 };
            player.car.velocity = 0;
            player.car.rotation = 0;
        }
        
        // 센서 연결 정보는 보존
        if (preserveSession && player.sensorId) {
            console.log(`🔗 플레이어 센서 연결 유지: ${player.sensorId}`);
        }
    }
    
    /**
     * 트랙 상태 초기화
     */
    resetTrackState() {
        // 트랙 생성기 리셋
        if (this.trackGenerator) {
            // 동일한 트랙 재사용 또는 새 트랙 생성
            this.currentTrack = this.trackGenerator.generateTrack();
        }
        
        // 체크포인트 상태 초기화
        if (this.checkpointSystem) {
            this.checkpointSystem.reset();
        }
    }
    
    /**
     * 리셋 후 UI 업데이트
     * @param {boolean} preserveSession - 세션 보존 여부
     */
    updateUIAfterReset(preserveSession) {
        // 버튼 상태 업데이트
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const restartBtn = document.getElementById('restart-btn');
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) {
            pauseBtn.disabled = true;
            pauseBtn.textContent = 'Pause';
        }
        if (restartBtn) restartBtn.disabled = false;
        
        // 세션 보존 알림 표시
        if (preserveSession && this.uiManager) {
            this.uiManager.showNotification('player1', '게임이 재시작되었습니다 (센서 연결 유지)', 'info', 3000);
            this.uiManager.showNotification('player2', '게임이 재시작되었습니다 (센서 연결 유지)', 'info', 3000);
        }
        
        // 준비 상태 확인
        this.checkReadyState();
    }
    
    /**
     * 세션 보존 UI 업데이트
     * @param {Object} result - 세션 보존 결과
     */
    updateSessionPreservationUI(result) {
        // 세션 정보 표시 업데이트
        const sessionInfo = document.getElementById('session-code');
        if (sessionInfo) {
            sessionInfo.textContent = `Session: ${result.sessionCode} (게임 ${result.gameCount}회차)`;
        }
        
        // 연속 플레이 표시
        const continuousPlayIndicator = document.getElementById('continuous-play-indicator');
        if (continuousPlayIndicator) {
            continuousPlayIndicator.style.display = 'block';
            continuousPlayIndicator.textContent = `연속 플레이 ${result.gameCount}회차`;
        } else {
            // 연속 플레이 표시기 생성
            this.createContinuousPlayIndicator(result.gameCount);
        }
        
        // 연결된 센서 수 표시
        const connectionStatus = document.getElementById('connection-indicator');
        if (connectionStatus) {
            connectionStatus.innerHTML = `연결 상태: <span class="status-text">준비됨 (${result.connectedSensors}/2 센서 유지)</span>`;
        }
    }
    
    /**
     * 연속 플레이 표시기 생성
     * @param {number} gameCount - 게임 횟수
     */
    createContinuousPlayIndicator(gameCount) {
        const indicator = document.createElement('div');
        indicator.id = 'continuous-play-indicator';
        indicator.className = 'continuous-play-indicator';
        indicator.textContent = `연속 플레이 ${gameCount}회차`;
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(34, 197, 94, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
        `;
        
        document.body.appendChild(indicator);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 3000);
    }
    
    /**
     * 표준 재시작 (세션 유지 실패 시 폴백)
     */
    performStandardRestart() {
        console.log('🔄 표준 재시작 진행...');
        
        // 기존 로직 유지
        this.gameState = this.sessionInfo.connectedSensors === 2 ? 'ready' : 'waiting';
        this.isPaused = false;
        
        // Reset RaceManager
        if (this.raceManager) {
            this.raceManager.reset();
        }
        
        // Reset game state but keep connections
        Object.values(this.players).forEach(player => {
            this.resetPlayerGameState(player, false);
        });
        
        // Update UI
        this.checkReadyState();
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) pauseBtn.disabled = true;
        
        console.log('✅ 표준 재시작 완료 - 센서 연결 유지');
    }

    togglePause() {
        if (this.gameState !== 'racing') return;
        
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        
        console.log('Game paused:', this.isPaused);
    }

    pauseGame() {
        this.isPaused = true;
        document.getElementById('pause-btn').textContent = 'Resume';
    }

    gameLoop() {
        if (this.gameState !== 'racing') return;
        
        // Calculate delta time
        const currentTime = performance.now();
        if (!this.lastFrameTime) {
            this.lastFrameTime = currentTime;
        }
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = currentTime;
        
        // Cap delta time to prevent large jumps
        const cappedDeltaTime = Math.min(deltaTime, 1/30); // Max 30 FPS minimum
        
        if (!this.isPaused) {
            // Update physics for both players
            Object.values(this.players).forEach(player => {
                if (player.carPhysics) {
                    // Update car physics with current track data
                    const trackData = this.screenSplitter?.currentTrack || null;
                    player.carPhysics.update(cappedDeltaTime, trackData);
                    
                    // Update player stats from physics
                    const carState = player.carPhysics.getState();
                    player.stats.speed = Math.abs(carState.speed);
                    player.stats.position = carState.position;
                    player.stats.angle = carState.angle;
                    player.stats.onTrack = carState.onTrack;
                    player.stats.health = carState.health;
                }
            });
            
            // Update player HUDs
            Object.values(this.players).forEach(player => {
                this.updatePlayerHUD(player);
            });
            
            // Render split screens using ScreenSplitter
            if (this.screenSplitter && this.screenSplitter.isInitialized()) {
                this.screenSplitter.renderLeftScreen(this.players.player1);
                this.screenSplitter.renderRightScreen(this.players.player2);
            }
            
            // Check for race completion and collisions
            this.updateRaceLogic(cappedDeltaTime);
            
            // Update game mode specific UI (타임 어택 타이머 등)
            const modeInfo = this.gameModeManager.getCurrentModeInfo();
            if (modeInfo && modeInfo.mode === 'time-attack' && modeInfo.config.timeLimit) {
                this.updateTimeAttackTimer(modeInfo.config.timeLimit);
            }
        }
        
        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Update race logic including collisions, lap detection, and race completion
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateRaceLogic(deltaTime) {
        // Update race progress through RaceManager
        if (this.raceManager.isRaceActive) {
            const playersArray = Object.values(this.players);
            this.raceManager.updateRaceProgress(playersArray, deltaTime);
        }
        
        Object.values(this.players).forEach(player => {
            if (!player.carPhysics) return;
            
            const carState = player.carPhysics.getState();
            
            // Check for collisions with track boundaries
            if (this.screenSplitter?.currentTrack) {
                const trackBounds = this.calculateTrackBounds(carState.position, this.screenSplitter.currentTrack);
                const collisionOccurred = player.carPhysics.checkCollisions(trackBounds);
                
                if (collisionOccurred) {
                    console.log(`${player.sensorId} collision detected`);
                }
            }
        });
        
        // Check if race was completed by RaceManager
        if (!this.raceManager.isRaceActive && this.gameState === 'racing') {
            this.handleRaceCompletion();
        }
    }

    /**
     * Calculate track boundaries for collision detection
     * @param {Object} position - Car position
     * @param {Object} track - Current track
     * @returns {Object} Track boundary information
     */
    calculateTrackBounds(position, track) {
        if (!track || !track.segments) return null;
        
        const segmentIndex = Math.floor(position.z / 200);
        const segment = track.segments[segmentIndex];
        
        if (!segment) return null;
        
        const trackWidth = segment.width || 2000;
        
        return {
            leftWall: -trackWidth / 2,
            rightWall: trackWidth / 2,
            obstacles: segment.obstacles || []
        };
    }

    /**
     * Handle race completion when RaceManager indicates race is finished
     */
    handleRaceCompletion() {
        console.log('Race completed!');
        
        this.gameState = 'finished';
        
        try {
            // Get race results from players (sorted by rank)
            const playersArray = Object.values(this.players).sort((a, b) => a.stats.rank - b.stats.rank);
            
            // Process race completion through GameModeManager
            const raceResult = this.gameModeManager.completeRace(playersArray);
            
            // Analyze results with VictorySystem
            const analysis = this.victorySystem.analyzeRaceResults(playersArray, raceResult);
            
            // Update player wins
            if (raceResult.winner) {
                raceResult.winner.stats.wins++;
                console.log(`Winner: ${raceResult.winner.sensorId}`);
            }
            
            // Show results with complete information
            this.showRaceResults(raceResult, analysis);
            
        } catch (error) {
            console.error('Error handling race completion:', error);
            this.showError('경주 결과 처리 중 오류가 발생했습니다.');
        }
    }

    /**
     * Show race results with game mode and victory system integration
     * @param {Object} raceResult - Race result from GameModeManager
     * @param {Object} analysis - Analysis from VictorySystem
     */
    showRaceResults(raceResult, analysis) {
        console.log('Race finished!', raceResult);
        
        // Update results modal content
        const resultsContent = document.getElementById('results-content');
        if (resultsContent) {
            resultsContent.innerHTML = this.generateResultsHTML(raceResult, analysis);
        }
        
        // Show/hide next race button based on tournament status
        const nextRaceBtn = document.getElementById('next-race-btn');
        const finishBtn = document.getElementById('finish-btn');
        
        if (nextRaceBtn && finishBtn) {
            if (raceResult.nextRace) {
                nextRaceBtn.style.display = 'block';
                nextRaceBtn.textContent = `다음 경주 (${raceResult.seriesScore ? 
                    `${raceResult.seriesScore.player1}-${raceResult.seriesScore.player2}` : 
                    '경주 진행'})`;
                finishBtn.textContent = '시리즈 종료';
            } else {
                nextRaceBtn.style.display = 'none';
                finishBtn.textContent = '게임 종료';
            }
        }
        
        // Show results modal
        document.getElementById('results-modal').classList.add('show');
        
        // Update game mode UI
        this.updateGameModeUI();
    }
    
    /**
     * Generate HTML for race results display
     * @param {Object} raceResult - Race result data
     * @param {Object} analysis - Race analysis data
     * @returns {string} HTML content
     */
    generateResultsHTML(raceResult, analysis) {
        let html = '<div class="race-results">';
        
        // Winner announcement
        if (raceResult.winner) {
            const winnerName = raceResult.winner.sensorId === 'sensor1' ? 'Player 1' : 'Player 2';
            html += `<div class="winner-announcement">
                <h3>🏆 ${winnerName} 승리!</h3>
            </div>`;
        }
        
        // Game mode specific information
        const modeInfo = this.gameModeManager.getCurrentModeInfo();
        if (modeInfo) {
            html += `<div class="mode-info">
                <h4>${modeInfo.config.name}</h4>
                <p>${modeInfo.config.description}</p>
            </div>`;
            
            // Series progress for best-of-3
            if (raceResult.seriesScore) {
                html += `<div class="series-score">
                    <h4>시리즈 현황</h4>
                    <p>Player 1: ${raceResult.seriesScore.player1}승</p>
                    <p>Player 2: ${raceResult.seriesScore.player2}승</p>
                    <p>필요 승수: ${raceResult.seriesScore.winsNeeded}승</p>
                </div>`;
            }
        }
        
        // Race statistics
        html += '<div class="race-stats"><h4>경주 통계</h4>';
        raceResult.results.forEach((result, index) => {
            const playerName = result.player.sensorId === 'sensor1' ? 'Player 1' : 'Player 2';
            const stats = analysis.statistics[result.player.sensorId];
            
            html += `<div class="player-stats">
                <h5>${index + 1}위: ${playerName}</h5>
                <p>총 시간: ${result.time.toFixed(2)}초</p>
                <p>최고 랩: ${result.player.stats.bestLap !== Infinity ? result.player.stats.bestLap.toFixed(3) + '초' : 'N/A'}</p>
                ${stats ? `<p>평균 속도: ${stats.averageSpeed.toFixed(1)}km/h</p>` : ''}
                ${stats ? `<p>일관성: ${stats.consistency.toFixed(1)}%</p>` : ''}
            </div>`;
        });
        html += '</div>';
        
        // Achievements
        if (analysis.achievements && analysis.achievements.length > 0) {
            html += '<div class="achievements"><h4>🏅 새로운 업적!</h4>';
            analysis.achievements.forEach(achievement => {
                html += `<div class="achievement">
                    <strong>${achievement.name}</strong>
                    <p>${achievement.description}</p>
                </div>`;
            });
            html += '</div>';
        }
        
        // Highlights
        if (analysis.highlights && analysis.highlights.length > 0) {
            html += '<div class="highlights"><h4>⭐ 하이라이트</h4>';
            analysis.highlights.forEach(highlight => {
                html += `<p>${highlight.description}</p>`;
            });
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }

    showReconnectionDialog(sensorId) {
        // Placeholder for reconnection dialog
        console.log(`Showing reconnection dialog for ${sensorId}`);
        alert(`${sensorId} 연결이 끊어졌습니다. 재연결을 기다리는 중...`);
    }

    startNextRace() {
        document.getElementById('results-modal').classList.remove('show');
        
        // Check if there are more races in the tournament
        const tournamentProgress = this.gameModeManager.getTournamentProgress();
        if (tournamentProgress && !tournamentProgress.isComplete) {
            console.log(`Starting race ${tournamentProgress.currentRace}/${tournamentProgress.totalRaces}`);
            this.restartRace();
        } else {
            console.log('Tournament completed');
            this.finishGame();
        }
    }

    finishGame() {
        document.getElementById('results-modal').classList.remove('show');
        this.returnToHub();
    }

    returnToHub() {
        // Clean up and return to hub
        if (this.sdk) {
            this.sdk.cleanup();
        }
        
        // Clean up ScreenSplitter
        if (this.screenSplitter) {
            this.screenSplitter.cleanup();
        }
        
        // In actual implementation, this would navigate back to the hub
        console.log('Returning to Sensor Game Hub...');
        window.location.href = '../index.html'; // Placeholder navigation
    }

    hideLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'none';
        
        // Start demo rendering to show split screen functionality
        this.startDemoRendering();
    }

    /**
     * Start demo rendering to showcase split screen functionality
     */
    startDemoRendering() {
        if (this.screenSplitter && this.screenSplitter.isInitialized()) {
            // Create demo player data with some movement
            const demoLoop = () => {
                if (this.gameState === 'racing') {
                    return; // Stop demo when racing starts
                }
                
                // Update demo speeds to show dynamic rendering
                const time = Date.now() / 1000;
                this.players.player1.stats.speed = 50 + Math.sin(time) * 30;
                this.players.player2.stats.speed = 60 + Math.cos(time * 1.2) * 25;
                
                // Render both screens
                this.screenSplitter.renderLeftScreen(this.players.player1);
                this.screenSplitter.renderRightScreen(this.players.player2);
                
                requestAnimationFrame(demoLoop);
            };
            
            demoLoop();
            console.log('Demo rendering started to showcase split screen functionality');
        }
    }

    /**
     * Test method to verify screen splitting functionality
     */
    testScreenSplitting() {
        if (!this.screenSplitter || !this.screenSplitter.isInitialized()) {
            console.error('ScreenSplitter not initialized');
            return false;
        }
        
        console.log('Testing screen splitting functionality...');
        
        // Test viewport dimensions
        const leftViewport = this.screenSplitter.getViewport('left');
        const rightViewport = this.screenSplitter.getViewport('right');
        
        console.log('Left viewport:', {
            width: leftViewport.width,
            height: leftViewport.height,
            hasContext: !!leftViewport.ctx
        });
        
        console.log('Right viewport:', {
            width: rightViewport.width,
            height: rightViewport.height,
            hasContext: !!rightViewport.ctx
        });
        
        // Test rendering with sample data
        const testPlayer1 = {
            ...this.players.player1,
            stats: { ...this.players.player1.stats, speed: 100 }
        };
        
        const testPlayer2 = {
            ...this.players.player2,
            stats: { ...this.players.player2.stats, speed: 120 }
        };
        
        try {
            this.screenSplitter.renderLeftScreen(testPlayer1);
            this.screenSplitter.renderRightScreen(testPlayer2);
            console.log('Screen splitting test completed successfully');
            return true;
        } catch (error) {
            console.error('Screen splitting test failed:', error);
            return false;
        }
    }

    showError(message) {
        console.error('Game Error:', message);
        alert(message); // Placeholder for proper error UI
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.racingGame = new RacingGame();
});

/**
 * CarPhysicsEngine Class - Handles car physics simulation
 * Implements realistic car physics including acceleration, steering, friction, and collision detection
 */
class CarPhysicsEngine {
    constructor(options = {}) {
        // Position and orientation
        this.position = {
            x: options.startX || 0,
            y: options.startY || 0,
            z: options.startZ || 0
        };
        
        // Velocity and acceleration
        this.velocity = { x: 0, y: 0, z: 0 };
        this.acceleration = { x: 0, y: 0, z: 0 };
        
        // Car orientation and movement
        this.angle = options.startAngle || 0; // Car heading angle in radians
        this.speed = 0; // Current speed in units/second
        this.targetSpeed = 0; // Target speed from input
        
        // Physics constants
        this.maxSpeed = options.maxSpeed || 300;
        this.maxReverseSpeed = options.maxReverseSpeed || 100;
        this.acceleration_rate = options.accelerationRate || 200; // units/second²
        this.deceleration_rate = options.decelerationRate || 300; // units/second²
        this.friction = options.friction || 0.95; // Friction coefficient
        this.turnRate = options.turnRate || 2.0; // Radians per second at full speed
        
        // Track interaction
        this.trackWidth = options.trackWidth || 2000;
        this.offTrackPenalty = options.offTrackPenalty || 0.3; // Speed multiplier when off track
        this.isOffTrack = false;
        
        // Collision state
        this.isColliding = false;
        this.collisionCooldown = 0;
        
        // Sensor input state
        this.sensorInput = {
            beta: 0,  // Forward/backward tilt
            gamma: 0  // Left/right tilt
        };
        
        // Physics state
        this.lastUpdateTime = performance.now();
        
        console.log('CarPhysicsEngine initialized with max speed:', this.maxSpeed);
    }
    
    /**
     * Process sensor input data and convert to car controls
     * @param {Object} sensorData - Raw sensor data from mobile device
     */
    processSensorInput(sensorData) {
        if (!sensorData || !sensorData.data || !sensorData.data.orientation) {
            return;
        }
        
        const orientation = sensorData.data.orientation;
        
        // Store raw sensor input
        this.sensorInput.beta = orientation.beta || 0;   // Forward/backward tilt (-180 to 180)
        this.sensorInput.gamma = orientation.gamma || 0; // Left/right tilt (-90 to 90)
        
        // Normalize sensor input for cross-platform compatibility
        this.normalizeInput();
        
        // Convert sensor input to car controls
        this.updateTargetSpeed();
        this.updateSteering();
    }
    
    /**
     * Normalize sensor input for consistent behavior across devices
     */
    normalizeInput() {
        // Clamp beta (forward/backward) to reasonable range
        this.sensorInput.beta = Math.max(-45, Math.min(45, this.sensorInput.beta));
        
        // Clamp gamma (left/right) to reasonable range
        this.sensorInput.gamma = Math.max(-45, Math.min(45, this.sensorInput.gamma));
        
        // Apply dead zone to prevent jitter
        const deadZone = 2;
        if (Math.abs(this.sensorInput.beta) < deadZone) {
            this.sensorInput.beta = 0;
        }
        if (Math.abs(this.sensorInput.gamma) < deadZone) {
            this.sensorInput.gamma = 0;
        }
    }
    
    /**
     * Update target speed based on forward/backward tilt
     */
    updateTargetSpeed() {
        // Convert beta tilt to speed (-45° to +45° maps to reverse to forward)
        const tiltFactor = this.sensorInput.beta / 45; // -1 to 1
        
        if (tiltFactor > 0) {
            // Forward tilt = acceleration
            this.targetSpeed = tiltFactor * this.maxSpeed;
        } else {
            // Backward tilt = braking/reverse
            this.targetSpeed = tiltFactor * this.maxReverseSpeed;
        }
    }
    
    /**
     * Update steering based on left/right tilt
     */
    updateSteering() {
        // Convert gamma tilt to steering rate
        const steerFactor = this.sensorInput.gamma / 45; // -1 to 1
        
        // Steering effectiveness depends on speed (can't turn much when stopped)
        const speedFactor = Math.min(1, Math.abs(this.speed) / 50);
        
        this.steeringRate = steerFactor * this.turnRate * speedFactor;
    }
    
    /**
     * Update physics simulation
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    update(deltaTime) {
        // Update collision cooldown
        if (this.collisionCooldown > 0) {
            this.collisionCooldown -= deltaTime;
            if (this.collisionCooldown <= 0) {
                this.isColliding = false;
            }
        }
        
        // Update speed towards target
        this.updateSpeed(deltaTime);
        
        // Update steering
        this.updateAngle(deltaTime);
        
        // Update position based on velocity
        this.updatePosition(deltaTime);
        
        // Apply friction and other forces
        this.applyForces(deltaTime);
        
        // Check track boundaries
        this.checkTrackBounds();
        
        this.lastUpdateTime = performance.now();
    }
    
    /**
     * Update car speed towards target speed
     * @param {number} deltaTime - Time elapsed in seconds
     */
    updateSpeed(deltaTime) {
        const speedDifference = this.targetSpeed - this.speed;
        
        if (Math.abs(speedDifference) < 1) {
            this.speed = this.targetSpeed;
            return;
        }
        
        // Determine acceleration or deceleration
        let rate;
        if (Math.sign(speedDifference) === Math.sign(this.speed) || this.speed === 0) {
            // Accelerating in same direction or from stop
            rate = this.acceleration_rate;
        } else {
            // Braking or changing direction
            rate = this.deceleration_rate;
        }
        
        // Apply off-track penalty
        if (this.isOffTrack) {
            rate *= this.offTrackPenalty;
        }
        
        // Apply collision penalty
        if (this.isColliding) {
            rate *= 0.1; // Severe penalty during collision
        }
        
        // Update speed
        const maxChange = rate * deltaTime;
        const change = Math.sign(speedDifference) * Math.min(Math.abs(speedDifference), maxChange);
        this.speed += change;
        
        // Clamp to maximum speeds
        this.speed = Math.max(-this.maxReverseSpeed, Math.min(this.maxSpeed, this.speed));
    }
    
    /**
     * Update car angle based on steering input
     * @param {number} deltaTime - Time elapsed in seconds
     */
    updateAngle(deltaTime) {
        if (this.steeringRate && Math.abs(this.speed) > 5) {
            this.angle += this.steeringRate * deltaTime;
            
            // Normalize angle to 0-2π range
            while (this.angle < 0) this.angle += Math.PI * 2;
            while (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;
        }
    }
    
    /**
     * Update car position based on current speed and angle
     * @param {number} deltaTime - Time elapsed in seconds
     */
    updatePosition(deltaTime) {
        // Calculate velocity components based on angle and speed
        this.velocity.x = Math.sin(this.angle) * this.speed;
        this.velocity.z = Math.cos(this.angle) * this.speed;
        this.velocity.y = 0; // No vertical movement for now
        
        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
    }
    
    /**
     * Apply friction and other environmental forces
     * @param {number} deltaTime - Time elapsed in seconds
     */
    applyForces(deltaTime) {
        // Apply friction when no input
        if (this.targetSpeed === 0) {
            this.speed *= Math.pow(this.friction, deltaTime * 60); // 60fps reference
            
            // Stop completely when very slow
            if (Math.abs(this.speed) < 1) {
                this.speed = 0;
            }
        }
        
        // Additional off-track friction
        if (this.isOffTrack) {
            this.speed *= Math.pow(0.9, deltaTime * 60);
        }
    }
    
    /**
     * Check if car is within track boundaries
     * @param {number} trackCenter - Center X position of track at current Z
     * @param {number} trackWidth - Width of track at current position
     * @returns {boolean} True if on track, false if off track
     */
    checkOffTrack(trackCenter = 0, trackWidth = this.trackWidth) {
        const distanceFromCenter = Math.abs(this.position.x - trackCenter);
        const wasOffTrack = this.isOffTrack;
        
        this.isOffTrack = distanceFromCenter > (trackWidth / 2);
        
        // Log track boundary events
        if (this.isOffTrack && !wasOffTrack) {
            console.log('Car went off track at position:', this.position.x, 'track center:', trackCenter);
        } else if (!this.isOffTrack && wasOffTrack) {
            console.log('Car returned to track');
        }
        
        return !this.isOffTrack;
    }
    
    /**
     * Check track boundaries using current track data
     */
    checkTrackBounds() {
        // This will be called by the game manager with proper track data
        // For now, use default track width
        this.checkOffTrack(0, this.trackWidth);
    }
    
    /**
     * Check for collisions with track barriers or obstacles
     * @param {Array} barriers - Array of barrier objects
     * @param {Array} obstacles - Array of obstacle objects
     * @returns {boolean} True if collision detected
     */
    checkCollisions(barriers = [], obstacles = []) {
        let hasCollision = false;
        
        // Check barrier collisions
        for (const barrier of barriers) {
            if (this.checkBarrierCollision(barrier)) {
                this.handleBarrierCollision(barrier);
                hasCollision = true;
            }
        }
        
        // Check obstacle collisions
        for (const obstacle of obstacles) {
            if (this.checkObstacleCollision(obstacle)) {
                this.handleObstacleCollision(obstacle);
                hasCollision = true;
            }
        }
        
        return hasCollision;
    }
    
    /**
     * Check collision with a track barrier
     * @param {Object} barrier - Barrier object with position and dimensions
     * @returns {boolean} True if collision detected
     */
    checkBarrierCollision(barrier) {
        // Simple rectangular collision detection
        const carSize = 50; // Car collision radius
        
        return Math.abs(this.position.x - barrier.x) < (barrier.width / 2 + carSize) &&
               Math.abs(this.position.z - barrier.z) < (barrier.length / 2 + carSize);
    }
    
    /**
     * Check collision with an obstacle
     * @param {Object} obstacle - Obstacle object with position and size
     * @returns {boolean} True if collision detected
     */
    checkObstacleCollision(obstacle) {
        // Circular collision detection
        const carRadius = 50;
        const obstacleRadius = obstacle.size || 25;
        
        const dx = this.position.x - obstacle.position.x;
        const dz = this.position.z - obstacle.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        return distance < (carRadius + obstacleRadius);
    }
    
    /**
     * Handle collision with track barrier
     * @param {Object} barrier - Barrier that was hit
     */
    handleBarrierCollision(barrier) {
        if (this.collisionCooldown > 0) return;
        
        console.log('Barrier collision detected');
        
        // Bounce off barrier
        this.speed *= -0.3; // Reverse and reduce speed
        
        // Push car away from barrier
        const pushDistance = 100;
        if (this.position.x > barrier.x) {
            this.position.x = barrier.x + barrier.width / 2 + pushDistance;
        } else {
            this.position.x = barrier.x - barrier.width / 2 - pushDistance;
        }
        
        this.isColliding = true;
        this.collisionCooldown = 1.0; // 1 second cooldown
    }
    
    /**
     * Handle collision with obstacle
     * @param {Object} obstacle - Obstacle that was hit
     */
    handleObstacleCollision(obstacle) {
        if (this.collisionCooldown > 0) return;
        
        console.log('Obstacle collision detected');
        
        // Reduce speed significantly
        this.speed *= 0.2;
        
        // Slight angle change
        this.angle += (Math.random() - 0.5) * 0.5;
        
        this.isColliding = true;
        this.collisionCooldown = 0.5; // 0.5 second cooldown
    }
    
    /**
     * Reset car to starting position and state
     * @param {Object} startPosition - Starting position {x, y, z}
     * @param {number} startAngle - Starting angle in radians
     */
    reset(startPosition = { x: 0, y: 0, z: 0 }, startAngle = 0) {
        this.position = { ...startPosition };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.acceleration = { x: 0, y: 0, z: 0 };
        this.angle = startAngle;
        this.speed = 0;
        this.targetSpeed = 0;
        this.steeringRate = 0;
        this.isOffTrack = false;
        this.isColliding = false;
        this.collisionCooldown = 0;
        this.sensorInput = { beta: 0, gamma: 0 };
        
        console.log('Car physics reset to position:', startPosition);
    }
    
    /**
     * Get current car state for rendering and game logic
     * @returns {Object} Current car state
     */
    getState() {
        return {
            position: { ...this.position },
            velocity: { ...this.velocity },
            angle: this.angle,
            speed: this.speed,
            isOffTrack: this.isOffTrack,
            isColliding: this.isColliding,
            sensorInput: { ...this.sensorInput }
        };
    }
    
    /**
     * Set car position (for external control)
     * @param {Object} position - New position {x, y, z}
     */
    setPosition(position) {
        this.position = { ...position };
    }
    
    /**
     * Set car angle (for external control)
     * @param {number} angle - New angle in radians
     */
    setAngle(angle) {
        this.angle = angle;
    }
    
    /**
     * Get speed in km/h for display
     * @returns {number} Speed in km/h
     */
    getSpeedKmh() {
        // Convert from units/second to km/h (approximate conversion)
        return Math.abs(this.speed * 3.6 * 0.1); // Adjust multiplier as needed
    }
    
    /**
     * Check if car is moving
     * @returns {boolean} True if car has significant movement
     */
    isMoving() {
        return Math.abs(this.speed) > 5;
    }
    
    /**
     * Apply external force (for special effects or collisions)
     * @param {Object} force - Force vector {x, y, z}
     */
    applyForce(force) {
        this.velocity.x += force.x;
        this.velocity.y += force.y;
        this.velocity.z += force.z;
    }
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.racingGame) {
        if (window.racingGame.sdk) {
            window.racingGame.sdk.cleanup();
        }
        if (window.racingGame.screenSplitter) {
            window.racingGame.screenSplitter.cleanup();
        }
    }
});
/
**
 * GameModeManager Class - 게임 모드 관리 및 승부 시스템
 * 다양한 게임 모드와 승부 조건을 관리합니다
 */
class GameModeManager {
    constructor() {
        this.currentMode = null;
        this.modeConfig = null;
        this.tournamentState = null;
        
        // 게임 모드 정의
        this.gameModes = {
            quick: {
                name: '빠른 경주',
                description: '3랩 단일 경주',
                laps: 3,
                races: 1,
                winCondition: 'first_to_finish',
                timeLimit: null,
                pointSystem: null
            },
            'best-of-3': {
                name: '베스트 오브 3',
                description: '3경주 중 2승 먼저 달성',
                laps: 3,
                races: 3,
                winCondition: 'best_of_series',
                timeLimit: null,
                pointSystem: { win: 1, lose: 0 }
            },
            'time-attack': {
                name: '타임 어택',
                description: '제한 시간 내 최고 기록 도전',
                laps: 999,
                races: 1,
                winCondition: 'best_time',
                timeLimit: 300, // 5분
                pointSystem: null
            }
        };
        
        console.log('GameModeManager initialized');
    }
    
    /**
     * 게임 모드 선택
     * @param {string} modeId - 게임 모드 ID
     * @returns {boolean} 성공 여부
     */
    selectGameMode(modeId) {
        if (!this.gameModes[modeId]) {
            console.error('Unknown game mode:', modeId);
            return false;
        }
        
        this.currentMode = modeId;
        this.modeConfig = { ...this.gameModes[modeId] };
        this.initializeTournamentState();
        
        console.log('Game mode selected:', this.modeConfig.name);
        return true;
    }
    
    /**
     * 토너먼트 상태 초기화
     */
    initializeTournamentState() {
        this.tournamentState = {
            currentRace: 1,
            totalRaces: this.modeConfig.races,
            player1Wins: 0,
            player2Wins: 0,
            raceResults: [],
            startTime: null,
            endTime: null,
            isComplete: false,
            winner: null
        };
    }
    
    /**
     * 경주 시작
     * @param {Array} players - 플레이어 배열
     * @returns {Object} 경주 설정
     */
    startRace(players) {
        if (!this.currentMode) {
            throw new Error('No game mode selected');
        }
        
        if (!this.tournamentState.startTime) {
            this.tournamentState.startTime = Date.now();
        }
        
        // 플레이어 초기화
        players.forEach(player => {
            player.stats.gameMode = this.currentMode;
            player.stats.raceNumber = this.tournamentState.currentRace;
            player.stats.totalRaces = this.tournamentState.totalRaces;
        });
        
        console.log(`Starting race ${this.tournamentState.currentRace}/${this.tournamentState.totalRaces} in ${this.modeConfig.name} mode`);
        
        return {
            laps: this.modeConfig.laps,
            timeLimit: this.modeConfig.timeLimit,
            winCondition: this.modeConfig.winCondition
        };
    }
    
    /**
     * 경주 완료 처리
     * @param {Array} players - 플레이어 배열 (순위별 정렬)
     * @returns {Object} 경주 결과
     */
    completeRace(players) {
        if (!this.currentMode || !this.tournamentState) {
            throw new Error('No active game mode or tournament');
        }
        
        const raceResult = this.calculateRaceResult(players);
        this.tournamentState.raceResults.push(raceResult);
        
        // 승부 시스템에 따른 처리
        this.updateTournamentScore(raceResult);
        
        // 토너먼트 완료 확인
        const tournamentComplete = this.checkTournamentComplete();
        
        if (tournamentComplete) {
            this.completeTournament();
        } else {
            this.prepareNextRace();
        }
        
        return {
            raceResult,
            tournamentState: { ...this.tournamentState },
            isComplete: tournamentComplete
        };
    }
    
    /**
     * 경주 결과 계산
     * @param {Array} players - 플레이어 배열
     * @returns {Object} 경주 결과
     */
    calculateRaceResult(players) {
        const result = {
            raceNumber: this.tournamentState.currentRace,
            timestamp: Date.now(),
            players: [],
            winner: null,
            winCondition: this.modeConfig.winCondition
        };
        
        // 승부 조건에 따른 결과 계산
        switch (this.modeConfig.winCondition) {
            case 'first_to_finish':
                result.players = this.calculatePositionFinish(players);
                break;
            case 'best_of_series':
                result.players = this.calculatePositionFinish(players);
                break;
            case 'best_time':
                result.players = this.calculateTimeAttack(players);
                break;
            default:
                result.players = this.calculatePositionFinish(players);
        }
        
        result.winner = result.players[0];
        return result;
    }
    
    /**
     * 순위 기반 결과 계산
     * @param {Array} players - 플레이어 배열
     * @returns {Array} 순위별 플레이어 결과
     */
    calculatePositionFinish(players) {
        return players
            .filter(player => player.stats.finished)
            .sort((a, b) => {
                // 완주한 플레이어 우선, 그 다음 완주 시간 순
                if (a.stats.finished && !b.stats.finished) return -1;
                if (!a.stats.finished && b.stats.finished) return 1;
                return (a.stats.finishTime || Infinity) - (b.stats.finishTime || Infinity);
            })
            .map((player, index) => ({
                sensorId: player.sensorId,
                rank: index + 1,
                finishTime: player.stats.finishTime,
                bestLap: player.stats.bestLap,
                averageLapTime: player.stats.averageLapTime,
                lapTimes: [...player.stats.lapTimes],
                points: this.calculatePoints(index + 1)
            }));
    }
    
    /**
     * 타임 어택 결과 계산
     * @param {Array} players - 플레이어 배열
     * @returns {Array} 최고 기록 순 플레이어 결과
     */
    calculateTimeAttack(players) {
        return players
            .map(player => ({
                sensorId: player.sensorId,
                bestLap: player.stats.bestLap === Infinity ? null : player.stats.bestLap,
                totalLaps: player.stats.lapTimes.length,
                lapTimes: [...player.stats.lapTimes],
                averageLapTime: player.stats.averageLapTime,
                points: 0
            }))
            .sort((a, b) => {
                // 베스트 랩 타임으로 정렬 (null은 맨 뒤로)
                if (a.bestLap === null && b.bestLap === null) return 0;
                if (a.bestLap === null) return 1;
                if (b.bestLap === null) return -1;
                return a.bestLap - b.bestLap;
            })
            .map((player, index) => ({
                ...player,
                rank: index + 1
            }));
    }
    
    /**
     * 순위에 따른 포인트 계산
     * @param {number} rank - 순위
     * @returns {number} 포인트
     */
    calculatePoints(rank) {
        if (!this.modeConfig.pointSystem) return 0;
        
        switch (rank) {
            case 1: return this.modeConfig.pointSystem.win || 1;
            case 2: return this.modeConfig.pointSystem.lose || 0;
            default: return 0;
        }
    }
    
    /**
     * 토너먼트 점수 업데이트
     * @param {Object} raceResult - 경주 결과
     */
    updateTournamentScore(raceResult) {
        if (raceResult.players.length < 2) return;
        
        const winner = raceResult.players[0];
        
        if (winner.sensorId === 'sensor1') {
            this.tournamentState.player1Wins++;
        } else if (winner.sensorId === 'sensor2') {
            this.tournamentState.player2Wins++;
        }
        
        console.log(`Tournament score - P1: ${this.tournamentState.player1Wins}, P2: ${this.tournamentState.player2Wins}`);
    }
    
    /**
     * 토너먼트 완료 확인
     * @returns {boolean} 완료 여부
     */
    checkTournamentComplete() {
        switch (this.modeConfig.winCondition) {
            case 'first_to_finish':
            case 'best_time':
                return this.tournamentState.currentRace >= this.tournamentState.totalRaces;
                
            case 'best_of_series':
                const winsNeeded = Math.ceil(this.tournamentState.totalRaces / 2);
                return this.tournamentState.player1Wins >= winsNeeded || 
                       this.tournamentState.player2Wins >= winsNeeded;
                       
            default:
                return this.tournamentState.currentRace >= this.tournamentState.totalRaces;
        }
    }
    
    /**
     * 다음 경주 준비
     */
    prepareNextRace() {
        this.tournamentState.currentRace++;
        console.log(`Preparing race ${this.tournamentState.currentRace}/${this.tournamentState.totalRaces}`);
    }
    
    /**
     * 토너먼트 완료
     */
    completeTournament() {
        this.tournamentState.isComplete = true;
        this.tournamentState.endTime = Date.now();
        
        // 최종 승자 결정
        if (this.modeConfig.winCondition === 'best_of_series') {
            if (this.tournamentState.player1Wins > this.tournamentState.player2Wins) {
                this.tournamentState.winner = 'sensor1';
            } else {
                this.tournamentState.winner = 'sensor2';
            }
        } else {
            // 단일 경주나 타임 어택의 경우 마지막 경주 결과 사용
            const lastResult = this.tournamentState.raceResults[this.tournamentState.raceResults.length - 1];
            this.tournamentState.winner = lastResult?.winner?.sensorId || null;
        }
        
        console.log('Tournament completed! Winner:', this.tournamentState.winner);
    }
    
    /**
     * 현재 게임 모드 정보 반환
     * @returns {Object} 게임 모드 정보
     */
    getCurrentModeInfo() {
        return {
            mode: this.currentMode,
            config: this.modeConfig,
            tournament: this.tournamentState
        };
    }
    
    /**
     * 토너먼트 리셋
     */
    reset() {
        if (this.currentMode) {
            this.initializeTournamentState();
        }
        console.log('GameModeManager reset');
    }
    
    /**
     * 게임 모드 목록 반환
     * @returns {Object} 사용 가능한 게임 모드들
     */
    getAvailableModes() {
        return Object.keys(this.gameModes).map(key => ({
            id: key,
            name: this.gameModes[key].name,
            description: this.gameModes[key].description
        }));
    }
                points: 0
            }))
            .sort((a, b) => {
                // 베스트 랩 타임으로 정렬 (null은 맨 뒤로)
                if (a.bestLap === null && b.bestLap === null) return 0;
                if (a.bestLap === null) return 1;
                if (b.bestLap === null) return -1;
                return a.bestLap - b.bestLap;
            })
            .map((player, index) => ({
                ...player,
                rank: index + 1
            }));
    }
    
    /**
     * 순위에 따른 포인트 계산
     * @param {number} rank - 순위
     * @returns {number} 포인트
     */
    calculatePoints(rank) {
        if (!this.modeConfig.pointSystem) return 0;
        
        switch (rank) {
            case 1: return this.modeConfig.pointSystem.win || 1;
            case 2: return this.modeConfig.pointSystem.lose || 0;
            default: return 0;
        }
    }
    
    /**
     * 토너먼트 점수 업데이트
     * @param {Object} raceResult - 경주 결과
     */
    updateTournamentScore(raceResult) {
        if (raceResult.players.length < 2) return;
        
        const winner = raceResult.players[0];
        
        if (winner.sensorId === 'sensor1') {
            this.tournamentState.player1Wins++;
        } else if (winner.sensorId === 'sensor2') {
            this.tournamentState.player2Wins++;
        }
        
        console.log(`Tournament score: P1=${this.tournamentState.player1Wins}, P2=${this.tournamentState.player2Wins}`);
    }
    
    /**
     * 토너먼트 완료 확인
     * @returns {boolean} 완료 여부
     */
    checkTournamentComplete() {
        switch (this.modeConfig.winCondition) {
            case 'first_to_finish':
            case 'best_time':
                return this.tournamentState.currentRace >= this.tournamentState.totalRaces;
                
            case 'best_of_series':
                const winsNeeded = Math.ceil(this.tournamentState.totalRaces / 2);
                return this.tournamentState.player1Wins >= winsNeeded || 
                       this.tournamentState.player2Wins >= winsNeeded;
                       
            default:
                return this.tournamentState.currentRace >= this.tournamentState.totalRaces;
        }
    }
    
    /**
     * 다음 경주 준비
     */
    prepareNextRace() {
        this.tournamentState.currentRace++;
        console.log(`Preparing race ${this.tournamentState.currentRace}/${this.tournamentState.totalRaces}`);
    }
    
    /**
     * 토너먼트 완료
     */
    completeTournament() {
        this.tournamentState.isComplete = true;
        this.tournamentState.endTime = Date.now();
        
        // 최종 승자 결정
        if (this.modeConfig.winCondition === 'best_of_series') {
            if (this.tournamentState.player1Wins > this.tournamentState.player2Wins) {
                this.tournamentState.winner = 'sensor1';
            } else {
                this.tournamentState.winner = 'sensor2';
            }
        } else {
            // 단일 경주나 타임어택의 경우 마지막 경주 결과 사용
            const lastResult = this.tournamentState.raceResults[this.tournamentState.raceResults.length - 1];
            this.tournamentState.winner = lastResult?.winner?.sensorId || null;
        }
        
        console.log('Tournament completed! Winner:', this.tournamentState.winner);
    }
    
    /**
     * 현재 게임 모드 정보 반환
     * @returns {Object} 게임 모드 정보
     */
    getCurrentModeInfo() {
        if (!this.currentMode) return null;
        
        return {
            mode: this.currentMode,
            config: { ...this.modeConfig },
            state: { ...this.tournamentState }
        };
    }
    
    /**
     * 토너먼트 리셋
     */
    reset() {
        if (this.currentMode) {
            this.initializeTournamentState();
        }
        console.log('GameModeManager reset');
    }
}
                points: 0
            }))
            .sort((a, b) => {
                // 최고 기록 순으로 정렬 (null은 맨 뒤)
                if (a.bestLap === null && b.bestLap === null) return 0;
                if (a.bestLap === null) return 1;
                if (b.bestLap === null) return -1;
                return a.bestLap - b.bestLap;
            })
            .map((player, index) => ({
                ...player,
                rank: index + 1
            }));
    }
    
    /**
     * 순위에 따른 포인트 계산
     * @param {number} rank - 순위
     * @returns {number} 포인트
     */
    calculatePoints(rank) {
        if (!this.modeConfig.pointSystem) return 0;
        
        switch (rank) {
            case 1: return this.modeConfig.pointSystem.win || 1;
            case 2: return this.modeConfig.pointSystem.lose || 0;
            default: return 0;
        }
    }
    
    /**
     * 토너먼트 점수 업데이트
     * @param {Object} raceResult - 경주 결과
     */
    updateTournamentScore(raceResult) {
        if (raceResult.winner) {
            if (raceResult.winner.sensorId === 'sensor1') {
                this.tournamentState.player1Wins++;
            } else if (raceResult.winner.sensorId === 'sensor2') {
                this.tournamentState.player2Wins++;
            }
        }
        
        console.log(`Tournament score: P1=${this.tournamentState.player1Wins}, P2=${this.tournamentState.player2Wins}`);
    }
    
    /**
     * 토너먼트 완료 확인
     * @returns {boolean} 완료 여부
     */
    checkTournamentComplete() {
        switch (this.modeConfig.winCondition) {
            case 'first_to_finish':
            case 'best_time':
                return this.tournamentState.currentRace >= this.tournamentState.totalRaces;
            
            case 'best_of_series':
                const winsNeeded = Math.ceil(this.tournamentState.totalRaces / 2);
                return this.tournamentState.player1Wins >= winsNeeded || 
                       this.tournamentState.player2Wins >= winsNeeded;
            
            default:
                return this.tournamentState.currentRace >= this.tournamentState.totalRaces;
        }
    }
    
    /**
     * 다음 경주 준비
     */
    prepareNextRace() {
        this.tournamentState.currentRace++;
        console.log(`Preparing race ${this.tournamentState.currentRace}/${this.tournamentState.totalRaces}`);
    }
    
    /**
     * 토너먼트 완료
     */
    completeTournament() {
        this.tournamentState.isComplete = true;
        this.tournamentState.endTime = Date.now();
        
        // 최종 승자 결정
        if (this.modeConfig.winCondition === 'best_of_series') {
            if (this.tournamentState.player1Wins > this.tournamentState.player2Wins) {
                this.tournamentState.winner = 'sensor1';
            } else if (this.tournamentState.player2Wins > this.tournamentState.player1Wins) {
                this.tournamentState.winner = 'sensor2';
            } else {
                this.tournamentState.winner = 'tie';
            }
        } else {
            // 단일 경주나 타임 어택의 경우 마지막 경주 결과 사용
            const lastResult = this.tournamentState.raceResults[this.tournamentState.raceResults.length - 1];
            this.tournamentState.winner = lastResult?.winner?.sensorId || null;
        }
        
        console.log('Tournament completed. Winner:', this.tournamentState.winner);
    }
    
    /**
     * 현재 게임 모드 정보 반환
     * @returns {Object} 게임 모드 정보
     */
    getCurrentModeInfo() {
        return {
            mode: this.currentMode,
            config: this.modeConfig,
            tournament: this.tournamentState
        };
    }
    
    /**
     * 토너먼트 리셋
     */
    reset() {
        if (this.currentMode) {
            this.initializeTournamentState();
        }
        console.log('GameModeManager reset');
    }
}
            }))
            .sort((a, b) => {
                // 기록이 있는 플레이어 우선, 그 다음 최고 기록 순
                if (a.bestLap === null && b.bestLap !== null) return 1;
                if (a.bestLap !== null && b.bestLap === null) return -1;
                if (a.bestLap === null && b.bestLap === null) return 0;
                return a.bestLap - b.bestLap;
            })
            .map((player, index) => ({
                ...player,
                rank: index + 1,
                points: this.calculatePoints(index + 1)
            }));
    }
    
    /**
     * 순위에 따른 점수 계산
     * @param {number} rank - 순위
     * @returns {number} 점수
     */
    calculatePoints(rank) {
        if (!this.modeConfig.pointSystem) return 0;
        
        switch (rank) {
            case 1: return this.modeConfig.pointSystem.win || 3;
            case 2: return this.modeConfig.pointSystem.lose || 1;
            default: return 0;
        }
    }
    
    /**
     * 토너먼트 점수 업데이트
     * @param {Object} raceResult - 경주 결과
     */
    updateTournamentScore(raceResult) {
        if (raceResult.winner) {
            if (raceResult.winner.sensorId === 'sensor1') {
                this.tournamentState.player1Wins++;
            } else if (raceResult.winner.sensorId === 'sensor2') {
                this.tournamentState.player2Wins++;
            }
        }
        
        console.log(`Tournament score: P1=${this.tournamentState.player1Wins}, P2=${this.tournamentState.player2Wins}`);
    }
    
    /**
     * 토너먼트 완료 확인
     * @returns {boolean} 완료 여부
     */
    checkTournamentComplete() {
        switch (this.modeConfig.winCondition) {
            case 'first_to_finish':
            case 'best_time':
                return this.tournamentState.currentRace >= this.tournamentState.totalRaces;
            
            case 'best_of_series':
                const winsNeeded = Math.ceil(this.tournamentState.totalRaces / 2);
                return this.tournamentState.player1Wins >= winsNeeded || 
                       this.tournamentState.player2Wins >= winsNeeded;
            
            default:
                return this.tournamentState.currentRace >= this.tournamentState.totalRaces;
        }
    }
    
    /**
     * 토너먼트 완료 처리
     */
    completeTournament() {
        this.tournamentState.isComplete = true;
        this.tournamentState.endTime = Date.now();
        
        // 최종 승자 결정
        if (this.tournamentState.player1Wins > this.tournamentState.player2Wins) {
            this.tournamentState.winner = 'sensor1';
        } else if (this.tournamentState.player2Wins > this.tournamentState.player1Wins) {
            this.tournamentState.winner = 'sensor2';
        } else {
            this.tournamentState.winner = 'tie';
        }
        
        console.log('Tournament completed! Winner:', this.tournamentState.winner);
    }
    
    /**
     * 다음 경주 준비
     */
    prepareNextRace() {
        this.tournamentState.currentRace++;
        console.log(`Preparing race ${this.tournamentState.currentRace}/${this.tournamentState.totalRaces}`);
    }
    
    /**
     * 현재 게임 모드 정보 반환
     * @returns {Object} 게임 모드 정보
     */
    getCurrentModeInfo() {
        if (!this.currentMode) return null;
        
        return {
            mode: this.currentMode,
            config: { ...this.modeConfig },
            tournament: { ...this.tournamentState }
        };
    }
    
    /**
     * 토너먼트 리셋
     */
    reset() {
        if (this.currentMode) {
            this.initializeTournamentState();
            console.log('Tournament reset');
        }
    }
    
    /**
     * 게임 모드 목록 반환
     * @returns {Object} 사용 가능한 게임 모드들
     */
    getAvailableModes() {
        return Object.keys(this.gameModes).map(key => ({
            id: key,
            name: this.gameModes[key].name,
            description: this.gameModes[key].description
        }));
    }
}

/**
 * VictorySystem Class - 승리 조건 및 결과 처리
 * 다양한 승리 조건을 확인하고 결과를 처리합니다
 */
class VictorySystem {
    constructor() {
        this.victoryConditions = new Map();
        this.achievementSystem = new AchievementSystem();
        
        // 기본 승리 조건들 등록
        this.registerVictoryConditions();
        
        console.log('VictorySystem initialized');
    }
    
    /**
     * 승리 조건들 등록
     */
    registerVictoryConditions() {
        // 첫 번째 완주
        this.victoryConditions.set('first_to_finish', {
            name: '첫 번째 완주',
            check: (players) => {
                const finishedPlayers = players.filter(p => p.stats.finished);
                return finishedPlayers.length > 0 ? finishedPlayers[0] : null;
            }
        });
        
        // 최고 기록
        this.victoryConditions.set('best_time', {
            name: '최고 기록',
            check: (players) => {
                let bestPlayer = null;
                let bestTime = Infinity;
                
                players.forEach(player => {
                    if (player.stats.bestLap < bestTime) {
                        bestTime = player.stats.bestLap;
                        bestPlayer = player;
                    }
                });
                
                return bestPlayer;
            }
        });
        
        // 시리즈 승부
        this.victoryConditions.set('best_of_series', {
            name: '시리즈 승부',
            check: (players, tournamentState) => {
                if (!tournamentState) return null;
                
                const winsNeeded = Math.ceil(tournamentState.totalRaces / 2);
                
                if (tournamentState.player1Wins >= winsNeeded) {
                    return players.find(p => p.sensorId === 'sensor1');
                } else if (tournamentState.player2Wins >= winsNeeded) {
                    return players.find(p => p.sensorId === 'sensor2');
                }
                
                return null;
            }
        });
    }
    
    /**
     * 승리 조건 확인
     * @param {string} conditionType - 승리 조건 타입
     * @param {Array} players - 플레이어 배열
     * @param {Object} additionalData - 추가 데이터
     * @returns {Object|null} 승자 정보
     */
    checkVictoryCondition(conditionType, players, additionalData = {}) {
        const condition = this.victoryConditions.get(conditionType);
        if (!condition) {
            console.warn('Unknown victory condition:', conditionType);
            return null;
        }
        
        const winner = condition.check(players, additionalData.tournamentState);
        
        if (winner) {
            console.log(`Victory condition '${condition.name}' met by ${winner.sensorId}`);
            
            // 업적 확인
            this.achievementSystem.checkAchievements(winner, players, additionalData);
        }
        
        return winner;
    }
    
    /**
     * 경주 결과 생성
     * @param {Array} players - 플레이어 배열
     * @param {string} victoryCondition - 승리 조건
     * @param {Object} additionalData - 추가 데이터
     * @returns {Object} 경주 결과
     */
    generateRaceResult(players, victoryCondition, additionalData = {}) {
        const winner = this.checkVictoryCondition(victoryCondition, players, additionalData);
        
        // 플레이어들을 순위별로 정렬
        const sortedPlayers = this.sortPlayersByRank(players, victoryCondition);
        
        return {
            winner,
            players: sortedPlayers,
            victoryCondition,
            timestamp: Date.now(),
            raceData: additionalData
        };
    }
    
    /**
     * 플레이어들을 순위별로 정렬
     * @param {Array} players - 플레이어 배열
     * @param {string} victoryCondition - 승리 조건
     * @returns {Array} 정렬된 플레이어 배열
     */
    sortPlayersByRank(players, victoryCondition) {
        switch (victoryCondition) {
            case 'first_to_finish':
            case 'best_of_series':
                return players.sort((a, b) => {
                    if (a.stats.finished && !b.stats.finished) return -1;
                    if (!a.stats.finished && b.stats.finished) return 1;
                    return (a.stats.finishTime || Infinity) - (b.stats.finishTime || Infinity);
                });
                
            case 'best_time':
                return players.sort((a, b) => {
                    const aTime = a.stats.bestLap === Infinity ? Number.MAX_VALUE : a.stats.bestLap;
                    const bTime = b.stats.bestLap === Infinity ? Number.MAX_VALUE : b.stats.bestLap;
                    return aTime - bTime;
                });
                
            default:
                return players.sort((a, b) => a.stats.rank - b.stats.rank);
        }
    }
    
    /**
     * 승리 메시지 생성
     * @param {Object} winner - 승자 정보
     * @param {string} victoryCondition - 승리 조건
     * @returns {string} 승리 메시지
     */
    generateVictoryMessage(winner, victoryCondition) {
        if (!winner) return '무승부!';
        
        const playerName = winner.sensorId === 'sensor1' ? 'Player 1' : 'Player 2';
        
        switch (victoryCondition) {
            case 'first_to_finish':
                return `${playerName} 승리! 먼저 완주했습니다!`;
            case 'best_time':
                const bestTime = winner.stats.bestLap;
                return `${playerName} 승리! 최고 기록: ${bestTime.toFixed(3)}초`;
            case 'best_of_series':
                return `${playerName} 승리! 시리즈를 제패했습니다!`;
            default:
                return `${playerName} 승리!`;
        }
    }
}

/**
 * AchievementSystem Class - 업적 시스템
 * 다양한 업적과 기록을 관리합니다
 */
class AchievementSystem {
    constructor() {
        this.achievements = new Map();
        this.playerAchievements = new Map();
        
        this.registerAchievements();
        console.log('AchievementSystem initialized');
    }
    
    /**
     * 업적들 등록
     */
    registerAchievements() {
        this.achievements.set('speed_demon', {
            name: '스피드 데몬',
            description: '랩 타임 30초 이하 달성',
            check: (player) => player.stats.bestLap <= 30
        });
        
        this.achievements.set('perfect_race', {
            name: '완벽한 경주',
            description: '트랙을 벗어나지 않고 완주',
            check: (player) => player.stats.offTrackTime === 0
        });
        
        this.achievements.set('comeback_king', {
            name: '역전의 제왕',
            description: '마지막 랩에서 역전승',
            check: (player, allPlayers, data) => {
                // 구현 로직 추가 필요
                return false;
            }
        });
    }
    
    /**
     * 업적 확인
     * @param {Object} player - 플레이어
     * @param {Array} allPlayers - 모든 플레이어
     * @param {Object} additionalData - 추가 데이터
     */
    checkAchievements(player, allPlayers, additionalData) {
        const playerId = player.sensorId;
        
        if (!this.playerAchievements.has(playerId)) {
            this.playerAchievements.set(playerId, new Set());
        }
        
        const playerAchievements = this.playerAchievements.get(playerId);
        
        this.achievements.forEach((achievement, key) => {
            if (!playerAchievements.has(key) && achievement.check(player, allPlayers, additionalData)) {
                playerAchievements.add(key);
                console.log(`Achievement unlocked for ${playerId}: ${achievement.name}`);
            }
        });
    }
    
    /**
     * 플레이어 업적 목록 반환
     * @param {string} playerId - 플레이어 ID
     * @returns {Array} 업적 목록
     */
    getPlayerAchievements(playerId) {
        const playerAchievements = this.playerAchievements.get(playerId) || new Set();
        return Array.from(playerAchievements).map(key => ({
            id: key,
            ...this.achievements.get(key)
        }));
    }
     * @param {Object} raceData - 경주 데이터
     * @returns {Object} 상세 결과
     */
    generateRaceResults(players, raceData = {}) {
        const results = {
            timestamp: Date.now(),
            duration: raceData.duration || 0,
            players: [],
            statistics: {},
            achievements: []
        };
        
        // 플레이어 결과 정리
        results.players = players.map((player, index) => ({
            sensorId: player.sensorId,
            rank: player.stats.rank || (index + 1),
            finished: player.stats.finished || false,
            finishTime: player.stats.finishTime || null,
            bestLap: player.stats.bestLap === Infinity ? null : player.stats.bestLap,
            averageLapTime: player.stats.averageLapTime || 0,
            totalLaps: player.stats.lapTimes ? player.stats.lapTimes.length : 0,
            lapTimes: player.stats.lapTimes || [],
            speed: {
                max: player.stats.maxSpeed || 0,
                average: player.stats.averageSpeed || 0
            },
            penalties: player.stats.penalties || 0,
            offTrackTime: player.stats.offTrackTime || 0
        }));
        
        // 통계 계산
        results.statistics = this.calculateRaceStatistics(results.players);
        
        // 업적 확인
        results.achievements = this.achievementSystem.checkRaceAchievements(players, raceData);
        
        return results;
    }
    
    /**
     * 경주 통계 계산
     * @param {Array} playerResults - 플레이어 결과 배열
     * @returns {Object} 통계 정보
     */
    calculateRaceStatistics(playerResults) {
        const finishedPlayers = playerResults.filter(p => p.finished);
        
        if (finishedPlayers.length === 0) {
            return {
                averageFinishTime: 0,
                fastestLap: null,
                closestFinish: 0,
                completionRate: 0
            };
        }
        
        const finishTimes = finishedPlayers.map(p => p.finishTime).filter(t => t !== null);
        const allLapTimes = playerResults.flatMap(p => p.lapTimes).filter(t => t > 0);
        
        return {
            averageFinishTime: finishTimes.length > 0 ? 
                finishTimes.reduce((sum, time) => sum + time, 0) / finishTimes.length : 0,
            fastestLap: allLapTimes.length > 0 ? Math.min(...allLapTimes) : null,
            closestFinish: finishTimes.length >= 2 ? 
                Math.abs(finishTimes[0] - finishTimes[1]) : 0,
            completionRate: (finishedPlayers.length / playerResults.length) * 100
        };
    }
}

/**
 * AchievementSystem Class - 업적 시스템
 * 다양한 업적을 추적하고 관리합니다
 */
class AchievementSystem {
    constructor() {
        this.achievements = new Map();
        this.playerAchievements = new Map();
        
        // 기본 업적들 등록
        this.registerAchievements();
        
        console.log('AchievementSystem initialized');
    }
    
    /**
     * 업적들 등록
     */
    registerAchievements() {
        // 속도 관련 업적
        this.achievements.set('speed_demon', {
            name: '스피드 데몬',
            description: '최고 속도 200km/h 달성',
            check: (player) => (player.stats.maxSpeed || 0) >= 200,
            category: 'speed'
        });
        
        // 랩타임 관련 업적
        this.achievements.set('perfect_lap', {
            name: '퍼펙트 랩',
            description: '60초 이하 랩타임 달성',
            check: (player) => (player.stats.bestLap || Infinity) <= 60,
            category: 'time'
        });
        
        // 완주 관련 업적
        this.achievements.set('first_victory', {
            name: '첫 승리',
            description: '첫 번째 경주 승리',
            check: (player) => player.stats.rank === 1,
            category: 'victory'
        });
        
        // 일관성 관련 업적
        this.achievements.set('consistent_racer', {
            name: '일관된 레이서',
            description: '모든 랩타임이 5초 이내 차이',
            check: (player) => {
                const lapTimes = player.stats.lapTimes || [];
                if (lapTimes.length < 2) return false;
                
                const min = Math.min(...lapTimes);
                const max = Math.max(...lapTimes);
                return (max - min) <= 5;
            },
            category: 'consistency'
        });
        
        // 도전 관련 업적
        this.achievements.set('comeback_king', {
            name: '컴백 킹',
            description: '마지막에서 1등으로 역전승',
            check: (player, allPlayers, raceData) => {
                // 이 업적은 특별한 조건 확인이 필요하므로 별도 처리
                return false; // 임시로 false
            },
            category: 'special'
        });
    }
    
    /**
     * 플레이어 업적 확인
     * @param {Object} player - 플레이어 객체
     * @param {Array} allPlayers - 모든 플레이어 배열
     * @param {Object} raceData - 경주 데이터
     * @returns {Array} 달성한 업적 목록
     */
    checkAchievements(player, allPlayers = [], raceData = {}) {
        const playerId = player.sensorId;
        const newAchievements = [];
        
        // 플레이어 업적 기록 초기화
        if (!this.playerAchievements.has(playerId)) {
            this.playerAchievements.set(playerId, new Set());
        }
        
        const playerAchievements = this.playerAchievements.get(playerId);
        
        // 각 업적 확인
        for (const [achievementId, achievement] of this.achievements) {
            // 이미 달성한 업적은 건너뛰기
            if (playerAchievements.has(achievementId)) continue;
            
            // 업적 조건 확인
            if (achievement.check(player, allPlayers, raceData)) {
                playerAchievements.add(achievementId);
                newAchievements.push({
                    id: achievementId,
                    name: achievement.name,
                    description: achievement.description,
                    category: achievement.category,
                    timestamp: Date.now()
                });
                
                console.log(`Achievement unlocked for ${playerId}: ${achievement.name}`);
            }
        }
        
        return newAchievements;
    }
    
    /**
     * 경주 업적 확인 (모든 플레이어)
     * @param {Array} players - 플레이어 배열
     * @param {Object} raceData - 경주 데이터
     * @returns {Array} 모든 달성 업적
     */
    checkRaceAchievements(players, raceData = {}) {
        const allAchievements = [];
        
        players.forEach(player => {
            const achievements = this.checkAchievements(player, players, raceData);
            allAchievements.push(...achievements.map(achievement => ({
                ...achievement,
                playerId: player.sensorId
            })));
        });
        
        return allAchievements;
    }
    
    /**
     * 플레이어 업적 목록 반환
     * @param {string} playerId - 플레이어 ID
     * @returns {Array} 달성한 업적 목록
     */
    getPlayerAchievements(playerId) {
        const playerAchievements = this.playerAchievements.get(playerId);
        if (!playerAchievements) return [];
        
        return Array.from(playerAchievements).map(achievementId => {
            const achievement = this.achievements.get(achievementId);
            return {
                id: achievementId,
                name: achievement.name,
                description: achievement.description,
                category: achievement.category
            };
        });
    }
    
    /**
     * 모든 업적 목록 반환
     * @returns {Array} 전체 업적 목록
     */
    getAllAchievements() {
        return Array.from(this.achievements.entries()).map(([id, achievement]) => ({
            id,
            name: achievement.name,
            description: achievement.description,
            category: achievement.category
        }));
    }
    
    /**
     * 업적 진행률 계산
     * @param {string} playerId - 플레이어 ID
     * @returns {Object} 진행률 정보
     */
    getProgress(playerId) {
        const playerAchievements = this.playerAchievements.get(playerId) || new Set();
        const totalAchievements = this.achievements.size;
        const unlockedCount = playerAchievements.size;
        
        return {
            unlocked: unlockedCount,
            total: totalAchievements,
            percentage: totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0
        };
    }
}
/**
 * Au
dioIntegration Class - 게임과 AudioManager 통합
 * 게임 이벤트에 따른 오디오 재생 관리
 */
class AudioIntegration {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.audioManager = null;
        this.isEnabled = true;
        this.lastEngineUpdate = { player1: 0, player2: 0 };
        
        this.initializeAudio();
        this.setupGameEventListeners();
    }
    
    async initializeAudio() {
        try {
            // AudioManager 초기화
            if (typeof AudioManager !== 'undefined') {
                this.audioManager = new AudioManager();
                console.log('✅ AudioIntegration 초기화 완료');
            } else {
                console.warn('⚠️ AudioManager 클래스를 찾을 수 없습니다');
                this.isEnabled = false;
            }
        } catch (error) {
            console.error('❌ AudioIntegration 초기화 실패:', error);
            this.isEnabled = false;
        }
    }
    
    setupGameEventListeners() {
        if (!this.gameManager) return;
        
        // 게임 상태 변화 감지
        this.gameManager.on('raceStart', () => this.onRaceStart());
        this.gameManager.on('raceEnd', (data) => this.onRaceEnd(data));
        this.gameManager.on('lapComplete', (data) => this.onLapComplete(data));
        this.gameManager.on('collision', (data) => this.onCollision(data));
        this.gameManager.on('offTrack', (data) => this.onOffTrack(data));
        this.gameManager.on('countdown', (data) => this.onCountdown(data));
    }
    
    // 게임 업데이트마다 호출되는 오디오 업데이트
    updateAudio() {
        if (!this.isEnabled || !this.audioManager || !this.gameManager.players) return;
        
        // 각 플레이어의 엔진 사운드 업데이트
        Object.keys(this.gameManager.players).forEach(playerId => {
            this.updatePlayerAudio(playerId);
        });
    }
    
    updatePlayerAudio(playerId) {
        const player = this.gameManager.players[playerId];
        if (!player || !player.car) return;
        
        const car = player.car;
        const currentTime = Date.now();
        
        // 엔진 사운드 업데이트 (60fps에서 너무 자주 호출되지 않도록 제한)
        if (currentTime - this.lastEngineUpdate[playerId] > 50) { // 20Hz 업데이트
            this.updateEngineSound(playerId, car);
            this.lastEngineUpdate[playerId] = currentTime;
        }
        
        // 스키드 사운드 체크
        this.checkSkidSound(playerId, car);
    }
    
    updateEngineSound(playerId, car) {
        if (!car.velocity === undefined) return;
        
        // 속도를 RPM으로 변환 (대략적인 계산)
        const speed = Math.abs(car.velocity || 0);
        const baseRPM = 800; // 아이들 RPM
        const maxRPM = 3000;
        const maxSpeed = 200; // 최대 속도 (km/h)
        
        // 속도에 따른 RPM 계산
        const speedRatio = Math.min(speed / maxSpeed, 1.0);
        const rpm = baseRPM + (maxRPM - baseRPM) * speedRatio;
        
        // 스로틀 입력에 따른 볼륨 조정
        const throttleInput = this.getPlayerThrottleInput(playerId);
        const volume = Math.max(0.3, Math.min(1.0, 0.5 + throttleInput * 0.5));
        
        // 엔진 사운드 업데이트
        this.audioManager.updateEngineRPM(playerId, rpm, volume);
    }
    
    checkSkidSound(playerId, car) {
        if (!car.isSkidding) {
            // 스키드 중이 아니면 스키드 사운드 중지
            this.audioManager.stopSound(playerId, 'skid');
            return;
        }
        
        // 스키드 강도에 따른 볼륨 계산
        const skidIntensity = Math.min(car.skidIntensity || 0.5, 1.0);
        
        // 스키드 사운드 재생 (이미 재생 중이면 볼륨만 조정)
        this.audioManager.playSkidSound(playerId, skidIntensity);
    }
    
    getPlayerThrottleInput(playerId) {
        // 센서 입력에서 스로틀 값 가져오기
        const sensorData = this.gameManager.getLastSensorData(playerId);
        if (!sensorData || !sensorData.data || !sensorData.data.orientation) return 0;
        
        const beta = sensorData.data.orientation.beta || 0;
        const throttle = Math.max(-1, Math.min(1, -beta / 30)); // -30도에서 30도 범위
        
        return Math.max(0, throttle); // 양수 스로틀만 반환
    }
    
    // 게임 이벤트 핸들러들
    onRaceStart() {
        if (!this.isEnabled || !this.audioManager) return;
        
        console.log('🏁 레이스 시작 - 엔진 사운드 시작');
        
        // 각 플레이어의 엔진 사운드 시작
        Object.keys(this.gameManager.players).forEach(playerId => {
            this.audioManager.playEngineSound(playerId, 1000, 0.8);
        });
    }
    
    onRaceEnd(data) {
        if (!this.isEnabled || !this.audioManager) return;
        
        console.log('🏆 레이스 종료 - 승리 사운드 재생');
        
        // 승리 사운드 재생
        if (data.winner) {
            this.audioManager.playVictorySound(data.winner);
        }
        
        // 모든 엔진 사운드 서서히 중지
        setTimeout(() => {
            Object.keys(this.gameManager.players).forEach(playerId => {
                this.audioManager.stopSound(playerId, 'engine');
                this.audioManager.stopSound(playerId, 'skid');
            });
        }, 2000); // 승리 사운드 재생 후 2초 뒤
    }
    
    onLapComplete(data) {
        if (!this.isEnabled || !this.audioManager) return;
        
        console.log(`🏁 ${data.playerId} 랩 완주`);
        
        // 랩 완주 시 짧은 효과음 (카운트다운 사운드 재사용)
        this.audioManager.playCountdownSound();
    }
    
    onCollision(data) {
        if (!this.isEnabled || !this.audioManager) return;
        
        console.log(`💥 ${data.playerId} 충돌 발생`);
        
        // 충돌 강도에 따른 사운드 재생
        const intensity = Math.min(data.intensity || 1.0, 1.0);
        this.audioManager.playCrashSound(data.playerId, intensity);
    }
    
    onOffTrack(data) {
        if (!this.isEnabled || !this.audioManager) return;
        
        console.log(`🌿 ${data.playerId} 트랙 이탈`);
        
        // 트랙 이탈 시 스키드 사운드 재생
        this.audioManager.playSkidSound(data.playerId, 0.6);
    }
    
    onCountdown(data) {
        if (!this.isEnabled || !this.audioManager) return;
        
        console.log(`⏰ 카운트다운: ${data.count}`);
        
        // 카운트다운 사운드 재생
        this.audioManager.playCountdownSound();
    }
    
    // 오디오 설정 메서드들
    setMasterVolume(volume) {
        if (this.audioManager) {
            this.audioManager.setMasterVolume(volume);
        }
    }
    
    setEngineVolume(volume) {
        if (this.audioManager) {
            this.audioManager.setEngineVolume(volume);
        }
    }
    
    setEffectVolume(volume) {
        if (this.audioManager) {
            this.audioManager.setEffectVolume(volume);
        }
    }
    
    // 오디오 시스템 활성화/비활성화
    enable() {
        this.isEnabled = true;
        console.log('🔊 오디오 시스템 활성화');
    }
    
    disable() {
        this.isEnabled = false;
        if (this.audioManager) {
            // 모든 사운드 중지
            Object.keys(this.gameManager.players).forEach(playerId => {
                this.audioManager.stopAllSounds(playerId);
            });
        }
        console.log('🔇 오디오 시스템 비활성화');
    }
    
    // 리소스 정리
    cleanup() {
        if (this.audioManager) {
            this.audioManager.cleanup();
        }
        console.log('🧹 AudioIntegration 정리 완료');
    }
    
    // 디버그 정보
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            audioManagerInitialized: !!this.audioManager,
            audioManagerDebug: this.audioManager ? this.audioManager.getDebugInfo() : null
        };
    }
}

// 기존 RacingGameController에 오디오 통합 추가
if (typeof RacingGameController !== 'undefined') {
    // RacingGameController 프로토타입에 오디오 관련 메서드 추가
    RacingGameController.prototype.initializeAudio = function() {
        this.audioIntegration = new AudioIntegration(this);
    };
    
    RacingGameController.prototype.updateAudio = function() {
        if (this.audioIntegration) {
            this.audioIntegration.updateAudio();
        }
    };
    
    RacingGameController.prototype.setAudioVolume = function(type, volume) {
        if (!this.audioIntegration) return;
        
        switch (type) {
            case 'master':
                this.audioIntegration.setMasterVolume(volume);
                break;
            case 'engine':
                this.audioIntegration.setEngineVolume(volume);
                break;
            case 'effect':
                this.audioIntegration.setEffectVolume(volume);
                break;
        }
    };
    
    RacingGameController.prototype.enableAudio = function() {
        if (this.audioIntegration) {
            this.audioIntegration.enable();
        }
    };
    
    RacingGameController.prototype.disableAudio = function() {
        if (this.audioIntegration) {
            this.audioIntegration.disable();
        }
    };
    
    // 기존 cleanup 메서드에 오디오 정리 추가
    const originalCleanup = RacingGameController.prototype.cleanup;
    RacingGameController.prototype.cleanup = function() {
        if (this.audioIntegration) {
            this.audioIntegration.cleanup();
        }
        if (originalCleanup) {
            originalCleanup.call(this);
        }
    };
    
    // 기존 update 메서드에 오디오 업데이트 추가
    const originalUpdate = RacingGameController.prototype.update;
    RacingGameController.prototype.update = function(deltaTime) {
        if (originalUpdate) {
            originalUpdate.call(this, deltaTime);
        }
        this.updateAudio();
    };
}

// 전역 AudioIntegration 클래스 노출
window.AudioIntegration = AudioIntegration;

/**
 * VisualEffectsIntegration Class - Integrates visual effects system with the main game
 * 시각적 효과 시스템을 메인 게임과 통합합니다
 */
class VisualEffectsIntegration {
    constructor(gameController) {
        this.gameController = gameController;
        this.visualEffectsManager = null;
        this.isEnabled = true;
        this.lastUpdateTime = 0;
        
        // 효과 트리거 상태 추적
        this.effectStates = {
            player1: {
                lastDriftTime: 0,
                lastCollisionTime: 0,
                isOffTrackWarningActive: false,
                lastRecordTime: 0
            },
            player2: {
                lastDriftTime: 0,
                lastCollisionTime: 0,
                isOffTrackWarningActive: false,
                lastRecordTime: 0
            }
        };
        
        this.initialize();
    }
    
    /**
     * 시각적 효과 시스템 초기화
     */
    initialize() {
        try {
            // 캔버스 요소 찾기
            const leftCanvas = document.getElementById('left-screen');
            const rightCanvas = document.getElementById('right-screen');
            
            if (!leftCanvas || !rightCanvas) {
                console.warn('⚠️ 시각적 효과용 캔버스를 찾을 수 없습니다');
                return;
            }
            
            // VisualEffectsManager 초기화
            if (typeof VisualEffectsManager !== 'undefined') {
                this.visualEffectsManager = new VisualEffectsManager(leftCanvas, rightCanvas);
                this.visualEffectsManager.initialize();
                console.log('✨ 시각적 효과 시스템 초기화 완료');
            } else {
                console.warn('⚠️ VisualEffectsManager를 찾을 수 없습니다');
            }
            
        } catch (error) {
            console.error('❌ 시각적 효과 시스템 초기화 실패:', error);
        }
    }
    
    /**
     * 시각적 효과 업데이트
     * @param {number} deltaTime - 프레임 간 시간 차이
     */
    update(deltaTime) {
        if (!this.isEnabled || !this.visualEffectsManager) return;
        
        try {
            // 게임 상태 가져오기
            const gameState = this.getGameState();
            
            // 시각적 효과 시스템 업데이트
            this.visualEffectsManager.update(deltaTime, gameState);
            
            // 자동 효과 처리
            this.processAutomaticEffects(deltaTime, gameState);
            
            // 렌더링
            this.visualEffectsManager.render();
            
            this.lastUpdateTime = performance.now();
            
        } catch (error) {
            console.error('❌ 시각적 효과 업데이트 오류:', error);
        }
    }
    
    /**
     * 현재 게임 상태 가져오기
     * @returns {Object} 게임 상태 객체
     */
    getGameState() {
        const gameState = {
            players: {}
        };
        
        // 플레이어 데이터 수집
        if (this.gameController.players) {
            ['player1', 'player2'].forEach(playerId => {
                const player = this.gameController.players[playerId];
                if (player && player.car) {
                    gameState.players[playerId] = {
                        car: {
                            position: player.car.position || { x: 0, y: 0, z: 0 },
                            velocity: player.car.velocity || 0,
                            speed: Math.abs(player.car.velocity || 0),
                            rotation: player.car.rotation || 0,
                            lateralVelocity: this.calculateLateralVelocity(player.car),
                            isDrifting: this.isDrifting(player.car),
                            isOffTrack: this.isOffTrack(player.car)
                        },
                        stats: player.stats || {}
                    };
                }
            });
        }
        
        return gameState;
    }
    
    /**
     * 자동 효과 처리 (드리프트, 트랙 이탈 등)
     * @param {number} deltaTime - 프레임 간 시간 차이
     * @param {Object} gameState - 게임 상태
     */
    processAutomaticEffects(deltaTime, gameState) {
        if (!gameState.players) return;
        
        const currentTime = performance.now();
        
        ['player1', 'player2'].forEach(playerId => {
            const playerData = gameState.players[playerId];
            if (!playerData || !playerData.car) return;
            
            const car = playerData.car;
            const effectState = this.effectStates[playerId];
            
            // 드리프트 효과 자동 생성
            if (car.isDrifting && currentTime - effectState.lastDriftTime > 100) {
                this.triggerDriftEffect(playerId, car);
                effectState.lastDriftTime = currentTime;
            }
            
            // 트랙 이탈 경고
            if (car.isOffTrack !== effectState.isOffTrackWarningActive) {
                if (car.isOffTrack) {
                    this.triggerOffTrackWarning(playerId, true);
                } else {
                    this.triggerOffTrackWarning(playerId, false);
                }
                effectState.isOffTrackWarningActive = car.isOffTrack;
            }
        });
    }
    
    /**
     * 측면 속도 계산
     * @param {Object} car - 자동차 객체
     * @returns {number} 측면 속도
     */
    calculateLateralVelocity(car) {
        if (!car.velocity || !car.rotation) return 0;
        
        // 간단한 측면 속도 계산 (실제 구현에서는 더 정확한 물리 계산 필요)
        const speed = Math.abs(car.velocity);
        const rotationRate = Math.abs(car.rotationRate || 0);
        
        return speed * rotationRate * 0.1; // 근사치
    }
    
    /**
     * 드리프트 상태 확인
     * @param {Object} car - 자동차 객체
     * @returns {boolean} 드리프트 중인지 여부
     */
    isDrifting(car) {
        const lateralVelocity = this.calculateLateralVelocity(car);
        const speed = Math.abs(car.velocity || 0);
        
        // 속도가 일정 이상이고 측면 속도가 클 때 드리프트로 판단
        return speed > 50 && lateralVelocity > 15;
    }
    
    /**
     * 트랙 이탈 상태 확인
     * @param {Object} car - 자동차 객체
     * @returns {boolean} 트랙 이탈 여부
     */
    isOffTrack(car) {
        if (!car.position) return false;
        
        // 간단한 트랙 경계 확인 (실제 구현에서는 트랙 데이터 기반)
        const trackWidth = 200;
        const distanceFromCenter = Math.abs(car.position.x);
        
        return distanceFromCenter > trackWidth;
    }
    
    /**
     * 드리프트 효과 트리거
     * @param {string} playerId - 플레이어 ID
     * @param {Object} car - 자동차 객체
     */
    triggerDriftEffect(playerId, car) {
        if (!this.visualEffectsManager) return;
        
        const side = playerId === 'player1' ? 'left' : 'right';
        const driftAngle = this.calculateLateralVelocity(car);
        
        this.visualEffectsManager.effects[side].tireSmoke.createDriftEffect(car, driftAngle, side);
        
        // 스키드 마크 추가
        const intensity = Math.min(driftAngle / 30, 1.0);
        this.visualEffectsManager.effects[side].skidMarks.addSkidMark(car, intensity, side);
    }
    
    /**
     * 충돌 효과 트리거
     * @param {string} playerId - 플레이어 ID
     * @param {string} collisionType - 충돌 타입
     * @param {Object} car - 자동차 객체
     */
    triggerCollisionEffect(playerId, collisionType, car) {
        if (!this.visualEffectsManager) return;
        
        this.visualEffectsManager.triggerCollisionEffect(playerId, collisionType, car);
        
        // 충돌 시간 기록
        this.effectStates[playerId].lastCollisionTime = performance.now();
        
        console.log(`💥 ${playerId} ${collisionType} 충돌 효과 생성`);
    }
    
    /**
     * 트랙 이탈 경고 트리거
     * @param {string} playerId - 플레이어 ID
     * @param {boolean} activate - 활성화 여부
     */
    triggerOffTrackWarning(playerId, activate) {
        if (!this.visualEffectsManager) return;
        
        const side = playerId === 'player1' ? 'left' : 'right';
        
        if (activate) {
            this.visualEffectsManager.effects[side].offTrack.activateWarning(playerId, 1.0);
        } else {
            this.visualEffectsManager.effects[side].offTrack.deactivateWarning(playerId);
        }
    }
    
    /**
     * 승리 축하 효과 트리거
     * @param {string} winner - 승리자 ID
     */
    triggerVictoryEffect(winner) {
        if (!this.visualEffectsManager) return;
        
        this.visualEffectsManager.triggerVictoryCelebration(winner);
        
        console.log(`🏆 ${winner} 승리 축하 효과 시작`);
    }
    
    /**
     * 개인 기록 달성 효과 트리거
     * @param {string} playerId - 플레이어 ID
     * @param {string} recordType - 기록 타입
     * @param {string} value - 기록 값
     */
    triggerPersonalRecord(playerId, recordType, value) {
        if (!this.visualEffectsManager) return;
        
        this.visualEffectsManager.triggerPersonalRecord(playerId, recordType, value);
        
        // 기록 시간 업데이트
        this.effectStates[playerId].lastRecordTime = performance.now();
        
        console.log(`📈 ${playerId} 개인 기록 달성: ${recordType} - ${value}`);
    }
    
    /**
     * 모든 시각적 효과 제거
     */
    clearAllEffects() {
        if (!this.visualEffectsManager) return;
        
        this.visualEffectsManager.clearAllEffects();
        
        // 효과 상태 리셋
        ['player1', 'player2'].forEach(playerId => {
            this.effectStates[playerId] = {
                lastDriftTime: 0,
                lastCollisionTime: 0,
                isOffTrackWarningActive: false,
                lastRecordTime: 0
            };
        });
        
        console.log('🧹 모든 시각적 효과 제거');
    }
    
    /**
     * 시각적 효과 시스템 활성화
     */
    enable() {
        this.isEnabled = true;
        console.log('✨ 시각적 효과 시스템 활성화');
    }
    
    /**
     * 시각적 효과 시스템 비활성화
     */
    disable() {
        this.isEnabled = false;
        if (this.visualEffectsManager) {
            this.visualEffectsManager.clearAllEffects();
        }
        console.log('🔇 시각적 효과 시스템 비활성화');
    }
    
    /**
     * 리소스 정리
     */
    cleanup() {
        if (this.visualEffectsManager) {
            this.visualEffectsManager.cleanup();
        }
        console.log('🧹 VisualEffectsIntegration 정리 완료');
    }
    
    /**
     * 디버그 정보
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            visualEffectsManagerInitialized: !!this.visualEffectsManager,
            effectStates: this.effectStates,
            lastUpdateTime: this.lastUpdateTime
        };
    }
}

// 기존 RacingGameController에 시각적 효과 통합 추가
if (typeof RacingGameController !== 'undefined') {
    // RacingGameController 프로토타입에 시각적 효과 관련 메서드 추가
    RacingGameController.prototype.initializeVisualEffects = function() {
        this.visualEffectsIntegration = new VisualEffectsIntegration(this);
    };
    
    RacingGameController.prototype.updateVisualEffects = function(deltaTime) {
        if (this.visualEffectsIntegration) {
            this.visualEffectsIntegration.update(deltaTime);
        }
    };
    
    RacingGameController.prototype.triggerCollisionEffect = function(playerId, collisionType, car) {
        if (this.visualEffectsIntegration) {
            this.visualEffectsIntegration.triggerCollisionEffect(playerId, collisionType, car);
        }
    };
    
    RacingGameController.prototype.triggerVictoryEffect = function(winner) {
        if (this.visualEffectsIntegration) {
            this.visualEffectsIntegration.triggerVictoryEffect(winner);
        }
    };
    
    RacingGameController.prototype.triggerPersonalRecord = function(playerId, recordType, value) {
        if (this.visualEffectsIntegration) {
            this.visualEffectsIntegration.triggerPersonalRecord(playerId, recordType, value);
        }
    };
    
    RacingGameController.prototype.clearAllVisualEffects = function() {
        if (this.visualEffectsIntegration) {
            this.visualEffectsIntegration.clearAllEffects();
        }
    };
    
    RacingGameController.prototype.enableVisualEffects = function() {
        if (this.visualEffectsIntegration) {
            this.visualEffectsIntegration.enable();
        }
    };
    
    RacingGameController.prototype.disableVisualEffects = function() {
        if (this.visualEffectsIntegration) {
            this.visualEffectsIntegration.disable();
        }
    };
    
    // 기존 cleanup 메서드에 시각적 효과 정리 추가
    const originalCleanup = RacingGameController.prototype.cleanup;
    RacingGameController.prototype.cleanup = function() {
        if (this.visualEffectsIntegration) {
            this.visualEffectsIntegration.cleanup();
        }
        if (originalCleanup) {
            originalCleanup.call(this);
        }
    };
    
    // 기존 update 메서드에 시각적 효과 업데이트 추가
    const originalUpdate = RacingGameController.prototype.update;
    RacingGameController.prototype.update = function(deltaTime) {
        if (originalUpdate) {
            originalUpdate.call(this, deltaTime);
        }
        this.updateVisualEffects(deltaTime);
    };
}

// 전역 VisualEffectsIntegration 클래스 노출
window.VisualEffectsIntegration = VisualEffectsIntegration;
/**

 * Hub Integration System
 * 허브 시스템 통합 및 초기화
 */

// 허브 통합 시스템 초기화
document.addEventListener('DOMContentLoaded', () => {
    initializeHubIntegration();
});

/**
 * 허브 통합 시스템 초기화
 */
async function initializeHubIntegration() {
    console.log('🏠 허브 통합 시스템 초기화 시작...');
    
    try {
        // 1. 허브 호환성 검사
        if (typeof window.hubCompatibilityChecker === 'undefined') {
            console.warn('⚠️ HubCompatibilityChecker가 로드되지 않음');
            return;
        }
        
        // 호환성 검사 결과 확인
        const compatibilityReport = window.hubCompatibilityChecker.generateCompatibilityReport();
        
        if (!compatibilityReport.isCompatible) {
            console.error('❌ 허브 호환성 검사 실패');
            window.hubCompatibilityChecker.displayCompatibilityIssues();
            return;
        }
        
        console.log('✅ 허브 호환성 검사 통과');
        
        // 2. 게임 컨트롤러 생성 (모의)
        const gameController = createGameController();
        
        // 3. 허브 통신 인터페이스 초기화
        if (typeof HubCommunicationInterface !== 'undefined') {
            window.hubCommunicationInterface = new HubCommunicationInterface(gameController);
            console.log('✅ 허브 통신 인터페이스 초기화 완료');
        } else {
            console.warn('⚠️ HubCommunicationInterface 클래스가 로드되지 않음');
        }
        
        // 4. 허브 세션 통합 초기화
        if (typeof HubSessionIntegration !== 'undefined') {
            window.hubSessionIntegration = new HubSessionIntegration(gameController);
            console.log('✅ 허브 세션 통합 초기화 완료');
        } else {
            console.warn('⚠️ HubSessionIntegration 클래스가 로드되지 않음');
        }
        
        // 5. 허브 환경별 추가 설정
        if (window.hubCompatibilityChecker.isRunningInHub()) {
            await setupHubEnvironment();
        } else {
            await setupStandaloneEnvironment();
        }
        
        console.log('🎉 허브 통합 시스템 초기화 완료');
        
        // 6. 게임 준비 상태 보고
        if (window.hubCommunicationInterface) {
            window.hubCommunicationInterface.reportGameState({
                phase: 'initialized',
                status: 'ready',
                timestamp: Date.now()
            });
        }
        
    } catch (error) {
        console.error('❌ 허브 통합 시스템 초기화 실패:', error);
        
        // 오류 발생 시 독립 실행 모드로 폴백
        console.log('🔄 독립 실행 모드로 폴백...');
        await setupStandaloneEnvironment();
    }
}

/**
 * 게임 컨트롤러 생성 (모의)
 */
function createGameController() {
    return {
        gameState: 'idle',
        currentGameMode: null,
        players: {
            player1: { connected: false, sensorId: 'sensor1' },
            player2: { connected: false, sensorId: 'sensor2' }
        },
        sessionSDK: null,
        
        // 이벤트 핸들러
        onServerConnected: (data) => {
            console.log('🔌 서버 연결됨:', data);
            if (window.uiManager) {
                window.uiManager.updateSessionInfo({ connected: true });
            }
        },
        
        onSessionCreated: (session) => {
            console.log('🎮 세션 생성됨:', session.sessionCode);
            if (window.uiManager) {
                window.uiManager.updateSessionInfo({
                    sessionCode: session.sessionCode,
                    qrCodeData: `${window.location.origin}/sensor.html?session=${session.sessionCode}`
                });
            }
        },
        
        onSensorConnected: (data) => {
            console.log('📱 센서 연결됨:', data.sensorId);
            const playerId = data.sensorId === 'sensor1' ? 'player1' : 'player2';
            this.players[playerId].connected = true;
            
            if (window.uiManager) {
                window.uiManager.updatePlayerStatus(playerId, true);
            }
            
            // 허브에 상태 보고
            if (window.hubCommunicationInterface) {
                window.hubCommunicationInterface.reportGameState({
                    phase: 'sensor-connected',
                    playerId: playerId,
                    connectedSensors: Object.values(this.players).filter(p => p.connected).length
                });
            }
        },
        
        onSensorDisconnected: (data) => {
            console.log('📱 센서 연결 해제됨:', data.sensorId);
            const playerId = data.sensorId === 'sensor1' ? 'player1' : 'player2';
            this.players[playerId].connected = false;
            
            if (window.uiManager) {
                window.uiManager.updatePlayerStatus(playerId, false);
                window.uiManager.showNotification(playerId, '센서 연결이 끊어졌습니다', 'warning');
            }
            
            // 게임 일시정지
            if (this.gameState === 'racing') {
                this.pauseGame();
            }
        },
        
        onAllSensorsConnected: () => {
            console.log('✅ 모든 센서 연결 완료');
            if (window.uiManager) {
                window.uiManager.hideLoadingScreen();
                window.uiManager.updateControlPanel({ startDisabled: false });
            }
        },
        
        processSensorData: (data) => {
            // 센서 데이터 처리 로직
            // 실제 게임에서는 물리 엔진에 전달
            console.log('📊 센서 데이터 처리:', data.sensorId);
        },
        
        startRace: () => {
            console.log('🏁 경주 시작');
            this.gameState = 'racing';
            
            if (window.hubCommunicationInterface) {
                window.hubCommunicationInterface.reportGameState({
                    phase: 'race-started',
                    mode: this.currentGameMode
                });
            }
        },
        
        pauseGame: () => {
            console.log('⏸️ 게임 일시정지');
            this.gameState = 'paused';
            
            if (window.hubCommunicationInterface) {
                window.hubCommunicationInterface.reportGameState({
                    phase: 'game-paused'
                });
            }
        },
        
        resumeGame: () => {
            console.log('▶️ 게임 재개');
            this.gameState = 'racing';
            
            if (window.hubCommunicationInterface) {
                window.hubCommunicationInterface.reportGameState({
                    phase: 'game-resumed'
                });
            }
        },
        
        restartRace: () => {
            console.log('🔄 경주 재시작');
            this.gameState = 'idle';
            
            // 플레이어 상태 초기화
            Object.keys(this.players).forEach(playerId => {
                if (this.players[playerId].connected) {
                    // 연결 상태는 유지하고 게임 상태만 초기화
                    console.log(`🔄 ${playerId} 상태 초기화`);
                }
            });
            
            if (window.hubCommunicationInterface) {
                window.hubCommunicationInterface.reportGameState({
                    phase: 'race-restarted'
                });
            }
        },
        
        setGameMode: (mode) => {
            console.log('🎮 게임 모드 설정:', mode);
            this.currentGameMode = mode;
            
            if (window.uiManager) {
                window.uiManager.updateGameMode(mode);
            }
        },
        
        resetGameState: () => {
            console.log('🔄 게임 상태 초기화');
            this.gameState = 'idle';
            this.currentGameMode = null;
        },
        
        updateSession: (sessionData) => {
            console.log('🔄 세션 업데이트:', sessionData);
            if (window.uiManager) {
                window.uiManager.updateSessionInfo(sessionData);
            }
        },
        
        handleGameControl: (controlData) => {
            console.log('🎮 게임 제어:', controlData);
            switch (controlData.action) {
                case 'start':
                    this.startRace();
                    break;
                case 'pause':
                    this.pauseGame();
                    break;
                case 'resume':
                    this.resumeGame();
                    break;
                case 'restart':
                    this.restartRace();
                    break;
            }
        },
        
        handleHubServiceResponse: (data) => {
            console.log('🔧 허브 서비스 응답:', data);
            // 허브 서비스 응답 처리 로직
        },
        
        saveGameState: () => {
            const gameState = {
                gameState: this.gameState,
                currentGameMode: this.currentGameMode,
                players: this.players,
                timestamp: Date.now()
            };
            
            localStorage.setItem('3d-racing-game-state', JSON.stringify(gameState));
            console.log('💾 게임 상태 저장 완료');
        },
        
        loadGameState: () => {
            try {
                const savedState = localStorage.getItem('3d-racing-game-state');
                if (savedState) {
                    const gameState = JSON.parse(savedState);
                    this.gameState = gameState.gameState || 'idle';
                    this.currentGameMode = gameState.currentGameMode;
                    console.log('📂 게임 상태 로드 완료');
                    return gameState;
                }
            } catch (error) {
                console.warn('⚠️ 게임 상태 로드 실패:', error);
            }
            return null;
        }
    };
}

/**
 * 허브 환경 설정
 */
async function setupHubEnvironment() {
    console.log('🏠 허브 환경 설정 중...');
    
    // 허브 환경 CSS 클래스 추가
    document.body.classList.add('hub-environment');
    
    // 허브 네비게이션 바 생성
    createHubNavigationBar();
    
    // 허브 특정 이벤트 리스너 설정
    setupHubEventListeners();
    
    // 허브 리소스 관리자 초기화
    if (typeof HubResourceManager !== 'undefined') {
        window.hubResourceManager = new HubResourceManager();
    }
    
    console.log('✅ 허브 환경 설정 완료');
}

/**
 * 독립 실행 환경 설정
 */
async function setupStandaloneEnvironment() {
    console.log('📱 독립 실행 환경 설정 중...');
    
    // 독립 실행 환경 CSS 클래스 추가
    document.body.classList.add('standalone-environment');
    
    // 독립 실행 모드 알림 표시
    showStandaloneNotification();
    
    console.log('✅ 독립 실행 환경 설정 완료');
}

/**
 * 허브 네비게이션 바 생성
 */
function createHubNavigationBar() {
    // 이미 존재하는 경우 제거
    const existingNav = document.getElementById('hub-navigation');
    if (existingNav) {
        existingNav.remove();
    }
    
    const navBar = document.createElement('div');
    navBar.id = 'hub-navigation';
    navBar.innerHTML = `
        <div class="hub-nav-content">
            <button id="hub-back-btn" class="hub-nav-btn">
                🏠 허브로 돌아가기
            </button>
            <div class="hub-game-title">
                3D Racing Game
            </div>
            <div class="hub-nav-actions">
                <button id="hub-help-btn" class="hub-nav-btn">❓ 도움말</button>
                <button id="hub-settings-btn" class="hub-nav-btn">⚙️ 설정</button>
            </div>
        </div>
    `;
    
    navBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid #334155;
        z-index: 10000;
        display: flex;
        align-items: center;
        padding: 0 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    // 네비게이션 바 스타일
    const style = document.createElement('style');
    style.textContent = `
        .hub-nav-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
        
        .hub-nav-btn {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.3s ease;
        }
        
        .hub-nav-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .hub-game-title {
            color: white;
            font-size: 18px;
            font-weight: bold;
        }
        
        .hub-nav-actions {
            display: flex;
            gap: 10px;
        }
        
        /* 게임 컨테이너 상단 여백 추가 */
        body.hub-environment #game-container,
        body.hub-environment .game-content {
            margin-top: 60px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.insertBefore(navBar, document.body.firstChild);
    
    // 이벤트 리스너 등록
    document.getElementById('hub-back-btn').addEventListener('click', () => {
        if (window.hubCommunicationInterface) {
            window.hubCommunicationInterface.requestHubNavigation();
        }
    });
    
    document.getElementById('hub-help-btn').addEventListener('click', () => {
        showHelpModal();
    });
    
    document.getElementById('hub-settings-btn').addEventListener('click', () => {
        showSettingsModal();
    });
}

/**
 * 허브 이벤트 리스너 설정
 */
function setupHubEventListeners() {
    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
        // Escape + Ctrl: 허브로 돌아가기
        if (e.key === 'Escape' && e.ctrlKey) {
            e.preventDefault();
            if (window.hubCommunicationInterface) {
                window.hubCommunicationInterface.requestHubNavigation();
            }
        }
        
        // F1: 도움말
        if (e.key === 'F1') {
            e.preventDefault();
            showHelpModal();
        }
    });
    
    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', () => {
        if (window.hubCommunicationInterface) {
            window.hubCommunicationInterface.cleanup();
        }
        
        if (window.hubSessionIntegration) {
            window.hubSessionIntegration.cleanup();
        }
    });
    
    // 포커스 이벤트
    window.addEventListener('focus', () => {
        if (window.hubCommunicationInterface) {
            window.hubCommunicationInterface.sendGameEvent({
                type: 'game-focus',
                timestamp: Date.now()
            });
        }
    });
    
    window.addEventListener('blur', () => {
        if (window.hubCommunicationInterface) {
            window.hubCommunicationInterface.sendGameEvent({
                type: 'game-blur',
                timestamp: Date.now()
            });
        }
    });
}

/**
 * 독립 실행 모드 알림 표시
 */
function showStandaloneNotification() {
    const notification = document.createElement('div');
    notification.id = 'standalone-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">📱</span>
            <span class="notification-text">독립 실행 모드</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(33, 150, 243, 0.9);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-content button {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        if (notification.parentElement) {
            notification.parentElement.removeChild(notification);
        }
    }, 5000);
}

/**
 * 도움말 모달 표시
 */
function showHelpModal() {
    const modal = document.createElement('div');
    modal.className = 'help-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <h2>🎮 게임 도움말</h2>
                <div class="help-content">
                    <h3>📱 센서 연결</h3>
                    <p>QR 코드를 스캔하여 모바일 기기를 센서로 연결하세요.</p>
                    
                    <h3>🎯 조작 방법</h3>
                    <ul>
                        <li><strong>좌우 기울기:</strong> 자동차 조향</li>
                        <li><strong>앞으로 기울기:</strong> 가속</li>
                        <li><strong>뒤로 기울기:</strong> 브레이크</li>
                    </ul>
                    
                    <h3>🏁 게임 모드</h3>
                    <ul>
                        <li><strong>빠른 경주:</strong> 3랩 경주</li>
                        <li><strong>베스트 오브 3:</strong> 3경주 토너먼트</li>
                        <li><strong>타임 어택:</strong> 최고 기록 도전</li>
                    </ul>
                    
                    <h3>⌨️ 키보드 단축키</h3>
                    <ul>
                        <li><strong>Ctrl + Esc:</strong> 허브로 돌아가기</li>
                        <li><strong>F1:</strong> 도움말</li>
                    </ul>
                </div>
                <div class="modal-actions">
                    <button onclick="this.closest('.help-modal').remove()">닫기</button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10001;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .modal-content {
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            color: #333;
        }
        
        .modal-content h2 {
            margin-top: 0;
            color: #2196f3;
        }
        
        .help-content h3 {
            color: #666;
            margin-top: 20px;
        }
        
        .help-content ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .modal-actions {
            text-align: center;
            margin-top: 20px;
        }
        
        .modal-actions button {
            background: #2196f3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
}

/**
 * 설정 모달 표시
 */
function showSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'settings-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <h2>⚙️ 게임 설정</h2>
                <div class="settings-content">
                    <div class="setting-group">
                        <h3>🔊 오디오</h3>
                        <label>
                            <input type="range" id="volume-slider" min="0" max="100" value="50">
                            음량: <span id="volume-value">50</span>%
                        </label>
                    </div>
                    
                    <div class="setting-group">
                        <h3>📱 센서 감도</h3>
                        <label>
                            <input type="range" id="sensitivity-slider" min="1" max="10" value="5">
                            감도: <span id="sensitivity-value">5</span>
                        </label>
                    </div>
                    
                    <div class="setting-group">
                        <h3>🎮 게임 옵션</h3>
                        <label>
                            <input type="checkbox" id="debug-mode"> 디버그 모드
                        </label>
                        <label>
                            <input type="checkbox" id="performance-mode"> 성능 모드
                        </label>
                    </div>
                </div>
                <div class="modal-actions">
                    <button onclick="saveSettings()">저장</button>
                    <button onclick="this.closest('.settings-modal').remove()">취소</button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10001;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .settings-content {
            margin: 20px 0;
        }
        
        .setting-group {
            margin-bottom: 20px;
        }
        
        .setting-group h3 {
            color: #666;
            margin-bottom: 10px;
        }
        
        .setting-group label {
            display: block;
            margin-bottom: 8px;
        }
        
        .setting-group input[type="range"] {
            width: 200px;
            margin-right: 10px;
        }
        
        .modal-actions button {
            margin: 0 5px;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // 슬라이더 이벤트 리스너
    document.getElementById('volume-slider').addEventListener('input', (e) => {
        document.getElementById('volume-value').textContent = e.target.value;
    });
    
    document.getElementById('sensitivity-slider').addEventListener('input', (e) => {
        document.getElementById('sensitivity-value').textContent = e.target.value;
    });
}

/**
 * 설정 저장
 */
function saveSettings() {
    const settings = {
        volume: document.getElementById('volume-slider').value,
        sensitivity: document.getElementById('sensitivity-slider').value,
        debugMode: document.getElementById('debug-mode').checked,
        performanceMode: document.getElementById('performance-mode').checked
    };
    
    localStorage.setItem('3d-racing-game-settings', JSON.stringify(settings));
    console.log('⚙️ 설정 저장 완료:', settings);
    
    // 모달 닫기
    document.querySelector('.settings-modal').remove();
    
    // 설정 적용
    applySettings(settings);
}

/**
 * 설정 적용
 */
function applySettings(settings) {
    // 볼륨 설정
    if (window.audioManager) {
        window.audioManager.setVolume(settings.volume / 100);
    }
    
    // 센서 감도 설정
    if (window.sensorProcessor) {
        window.sensorProcessor.setSensitivity(settings.sensitivity);
    }
    
    // 디버그 모드
    if (settings.debugMode) {
        document.body.classList.add('debug-mode');
    } else {
        document.body.classList.remove('debug-mode');
    }
    
    // 성능 모드
    if (settings.performanceMode) {
        document.body.classList.add('performance-mode');
    } else {
        document.body.classList.remove('performance-mode');
    }
}

// 전역 게임 매니저 설정 (기존 코드와의 호환성을 위해)
window.gameManager = null;

// 허브 통합 시스템이 초기화된 후 게임 매니저 설정
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.gameManager && window.hubSessionIntegration) {
            window.gameManager = window.hubSessionIntegration.gameController;
            console.log('🎮 전역 게임 매니저 설정 완료');
        }
    }, 1000);
});

console.log('🏠 허브 통합 시스템 스크립트 로드 완료');