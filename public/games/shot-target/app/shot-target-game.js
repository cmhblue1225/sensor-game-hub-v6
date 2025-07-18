// ===== APP/SHOT-TARGET-GAME =====
// 메인 게임 애플리케이션 클래스

import { GAME_CONFIG, SDK_CONFIG } from '../shared/config.js';
import { GameUtils } from '../shared/utils.js';

// Entities
import { Target, TargetFactory } from '../entities/target.js';
import { Player } from '../entities/player.js';

// Features
import { SensorManager } from '../features/sensor-manager.js';
import { ShootingSystem } from '../features/shooting-system.js';
import { ScoringSystem } from '../features/scoring-system.js';

// Widgets
import { WaitingRoomWidget } from '../widgets/waiting-room-widget.js';
import { ScorePanelWidget } from '../widgets/score-panel-widget.js';

// Pages
import { GamePage } from '../pages/game-page.js';

export class ShotTargetGame {
    constructor() {
        // 게임 상태
        this.gameMode = null;
        this.gameState = {
            connected: false,
            playing: false,
            paused: false,
            timeLeft: 0,
            gameStartTime: null
        };

        // 게임 요소
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.targets = [];
        
        // SDK
        this.sdk = null;
        
        // 시스템 컴포넌트들
        this.sensorManager = null;
        this.shootingSystem = null;
        this.scoringSystem = null;
        
        // UI 컴포넌트들
        this.waitingRoomWidget = null;
        this.scorePanelWidget = null;
        this.gamePage = null;
        
        // 게임 루프
        this.gameLoop = null;
        this.lastTargetSpawn = 0;
        this.timerInterval = null;
        
        // DOM 요소들
        this.elements = this.getElements();
        
        // 초기화
        this.initializeGame();
    }

    // DOM 요소 가져오기
    getElements() {
        return {
            // 상태 표시 요소들
            serverStatus: document.getElementById('serverStatus'),
            sensorStatus: document.getElementById('sensorStatus'),
            sensor1Status: document.getElementById('sensor1Status'),
            sensor2Status: document.getElementById('sensor2Status'),
            gameStatusText: document.getElementById('gameStatusText'),
            
            // 컨트롤 요소들
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            
            // 센서 상태 패널들
            soloSensorStatus: document.getElementById('soloSensorStatus'),
            dualSensorStatus: document.getElementById('dualSensorStatus'),
            dualSensorStatus2: document.getElementById('dualSensorStatus2'),
            
            // 컨트롤 패널
            controlPanel: document.querySelector('.control-panel')
        };
    }

    // 게임 초기화
    async initializeGame() {
        console.log('🎯 Shot Target Game 초기화 시작');

        try {
            // 캔버스 설정
            this.setupCanvas();
            
            // UI 컴포넌트 초기화
            this.gamePage = new GamePage();
            this.setupPageCallbacks();
            
            // 키보드 컨트롤 설정 (테스트용)
            this.setupKeyboardControls();
            
            // 게임 루프 시작
            this.startGameLoop();
            
            // 초기 상태 설정
            this.updateGameStatus('게임 모드를 선택하세요');
            this.gamePage.showModeSelection();
            
            console.log('✅ Shot Target Game 초기화 완료');
            
        } catch (error) {
            console.error('❌ 게임 초기화 실패:', error);
            this.updateGameStatus(`초기화 실패: ${error.message}`);
        }
    }

    // 캔버스 설정
    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();
    }

    // 페이지 콜백 설정
    setupPageCallbacks() {
        // 모드 선택 콜백
        this.gamePage.onPageTransition('session-shown', (data) => {
            this.selectGameMode(data.mode);
        });
        
        this.gamePage.onPageTransition('mass-waiting-shown', () => {
            this.selectGameMode('mass-competitive');
        });
    }

    // 게임 모드 선택
    async selectGameMode(mode) {
        console.log(`🎯 게임 모드 선택: ${mode}`);
        this.gameMode = mode;

        try {
            // 시스템 컴포넌트 초기화
            this.initializeGameSystems(mode);
            
            // SDK 초기화
            await this.initializeSDK(mode);
            
            // UI 설정
            this.setupModeUI(mode);
            
            this.updateGameStatus('서버 연결 중...');
            
        } catch (error) {
            console.error('❌ 게임 모드 선택 실패:', error);
            this.updateGameStatus(`모드 선택 실패: ${error.message}`);
        }
    }

    // 게임 시스템 초기화
    initializeGameSystems(mode) {
        // 기존 시스템 정리
        this.cleanupGameSystems();
        
        // 센서 매니저 초기화
        this.sensorManager = new SensorManager(mode);
        this.setupSensorCallbacks();
        
        // 사격 시스템 초기화
        this.shootingSystem = new ShootingSystem();
        this.setupShootingCallbacks();
        
        // 점수 시스템 초기화
        this.scoringSystem = new ScoringSystem(mode);
        this.setupScoringCallbacks();
        
        // UI 위젯 초기화
        this.scorePanelWidget = new ScorePanelWidget(mode);
        
        if (mode === GAME_CONFIG.MODES.MASS_COMPETITIVE) {
            this.waitingRoomWidget = new WaitingRoomWidget();
        }
        
        console.log('✅ 게임 시스템 초기화 완료');
    }

    // SDK 초기화
    async initializeSDK(mode) {
        const gameType = SDK_CONFIG.getGameType(mode);
        
        this.sdk = new SessionSDK({
            gameId: SDK_CONFIG.gameId,
            gameType: gameType,
            debug: SDK_CONFIG.debug
        });

        this.setupSDKEvents();
        console.log(`✅ SDK 초기화 완료: ${gameType}`);
    }

    // SDK 이벤트 설정
    setupSDKEvents() {
        // 연결 완료 후 세션 생성
        this.sdk.on('connected', async () => {
            this.gameState.connected = true;
            this.updateServerStatus(true);
            this.updateGameStatus('서버 연결됨 - 세션 생성 중...');

            await this.createGameSession();
        });

        this.sdk.on('disconnected', () => {
            this.gameState.connected = false;
            this.updateServerStatus(false);
            this.updateGameStatus('서버 연결 끊김');
        });

        // 세션 생성 완료
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            this.handleSessionCreated(session);
        });

        // 센서 연결/해제
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            this.handleSensorConnected(data);
        });

        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;
            this.handleSensorDisconnected(data);
        });

        // 센서 데이터 처리
        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.handleSensorData(data);
        });

        // 오류 처리
        this.sdk.on('connection-error', (error) => {
            console.error('연결 오류:', error);
            this.updateGameStatus(`연결 오류: ${error.error}`);
        });
    }

    // 세션 생성
    async createGameSession() {
        try {
            await this.sdk.createSession();
            console.log('✅ 게임 세션 생성 완료');
        } catch (error) {
            console.error('❌ 세션 생성 실패:', error);
            this.updateGameStatus(`세션 생성 실패: ${error.message}`);
        }
    }

    // 세션 생성 완료 처리
    handleSessionCreated(session) {
        const sensorUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;

        if (this.gameMode === GAME_CONFIG.MODES.MASS_COMPETITIVE) {
            this.gamePage.displayMassSessionInfo(session.sessionCode, sensorUrl);
            this.updateGameStatus('플레이어 연결 대기 중...');
        } else {
            this.gamePage.displaySessionInfo(session.sessionCode, sensorUrl);
            this.updateGameStatus('센서 연결 대기 중...');
        }
    }

    // 센서 연결 처리
    handleSensorConnected(data) {
        console.log('🔍 센서 연결됨:', data);
        
        // 센서 매니저에 전달
        this.sensorManager.handleSensorConnected(data.sensorId, data.connectedSensors);
        
        // 모드별 처리
        if (this.gameMode === GAME_CONFIG.MODES.MASS_COMPETITIVE) {
            this.handleMassCompetitiveSensorConnected(data);
        } else {
            this.handleNormalSensorConnected(data);
        }
    }

    // 일반 모드 센서 연결 처리
    handleNormalSensorConnected(data) {
        const sensorId = data.sensorId || 'sensor1';
        
        if (this.gameMode === GAME_CONFIG.MODES.SOLO) {
            this.updateSensorStatus(true);
            this.updateGameStatus('센서 연결됨 - 게임 준비 완료');
            this.startGameAfterDelay();
            
        } else if (this.gameMode === GAME_CONFIG.MODES.COOP || this.gameMode === GAME_CONFIG.MODES.COMPETITIVE) {
            // 듀얼 모드 센서 상태 업데이트
            if (sensorId === 'sensor1') {
                this.updateSensor1Status(true);
            } else if (sensorId === 'sensor2') {
                this.updateSensor2Status(true);
            }
            
            // 모든 센서 연결 확인
            if (this.sensorManager.areAllSensorsConnected()) {
                this.updateGameStatus('모든 센서 연결됨 - 게임 준비 완료');
                this.startGameAfterDelay();
            } else {
                const connectedCount = this.sensorManager.getConnectedCount();
                this.updateGameStatus(`센서 연결됨 (${connectedCount}/2) - 추가 연결 대기 중...`);
            }
        }
    }

    // 대규모 경쟁 모드 센서 연결 처리
    handleMassCompetitiveSensorConnected(data) {
        const playerId = data.sensorId;
        const totalConnected = data.connectedSensors || 1;
        
        // 플레이어 생성 및 추가
        const player = new Player(playerId, null, totalConnected - 1);
        this.sensorManager.addPlayer(playerId, player);
        this.scoringSystem.initializePlayer(playerId, player.name);
        
        // 대기실 위젯에 플레이어 추가
        if (this.waitingRoomWidget) {
            this.waitingRoomWidget.addPlayer(playerId, player.name, player.colorIndex);
            this.waitingRoomWidget.show();
        }
        
        // 게임 시작 버튼 상태 업데이트
        this.gamePage.updateMassStartButton(
            totalConnected >= GAME_CONFIG.MASS_COMPETITIVE.minPlayers,
            totalConnected
        );
        
        // 상태 메시지 업데이트
        if (totalConnected >= GAME_CONFIG.MASS_COMPETITIVE.minPlayers) {
            this.updateGameStatus(`플레이어 대기 중 (${totalConnected}/8) - 시작 가능`);
        } else {
            this.updateGameStatus(`플레이어 대기 중 (${totalConnected}/8) - 최소 3명 필요`);
        }
    }

    // 센서 연결 해제 처리
    handleSensorDisconnected(data) {
        console.log('🔍 센서 연결 해제:', data);
        
        this.sensorManager.handleSensorDisconnected(data.sensorId);
        
        if (this.gameMode === GAME_CONFIG.MODES.MASS_COMPETITIVE) {
            // 대기실에서 플레이어 제거
            if (this.waitingRoomWidget) {
                this.waitingRoomWidget.removePlayer(data.sensorId);
            }
            
            // 점수 시스템에서 비활성화
            this.scoringSystem.deactivatePlayer(data.sensorId);
        }
        
        // 게임 중이면 일시정지
        if (this.gameState.playing) {
            this.pauseGame();
        }
        
        this.updateGameStatus('센서 연결 끊김');
    }

    // 센서 데이터 처리
    handleSensorData(data) {
        if (!this.sensorManager) return;
        
        // 센서 매니저에 데이터 전달
        this.sensorManager.processSensorData(data.sensorId, data.data);
    }

    // 게임 시작 (지연 후)
    startGameAfterDelay(delay = 1000) {
        setTimeout(() => {
            this.gamePage.transitionToGameplay();
            this.startGame();
        }, delay);
    }

    // 게임 시작
    startGame() {
        this.gameState.playing = true;
        this.gameState.paused = false;
        this.gameState.timeLeft = this.getGameDuration();
        this.gameState.gameStartTime = Date.now();
        
        // 점수 시스템 게임 시작 시간 설정
        this.scoringSystem.setGameStartTime();
        
        // 사격 시스템에 표적 목록 설정
        this.shootingSystem.setTargets(this.targets);
        
        // 타이머 시작
        this.startTimer();
        
        // UI 업데이트
        this.scorePanelWidget.show();
        this.updateGameStatus('게임 진행 중...');
        
        // 대기실 위젯 숨기기
        if (this.waitingRoomWidget) {
            this.waitingRoomWidget.hide();
        }
        
        console.log('🎯 Shot Target 게임 시작!');
    }

    // 게임 지속 시간 반환
    getGameDuration() {
        return this.gameMode === GAME_CONFIG.MODES.MASS_COMPETITIVE 
            ? GAME_CONFIG.GAMEPLAY.gameTimeMassCompetitive 
            : GAME_CONFIG.GAMEPLAY.gameTimeDefault;
    }

    // 타이머 시작
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (this.gameState.playing && !this.gameState.paused) {
                this.gameState.timeLeft--;
                this.scorePanelWidget.updateTimer(this.gameState.timeLeft);

                if (this.gameState.timeLeft <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }

    // 게임 루프 시작
    startGameLoop() {
        let lastTime = 0;
        
        const loop = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            this.gameLoop = requestAnimationFrame(loop);
        };
        
        this.gameLoop = requestAnimationFrame(loop);
    }

    // 게임 업데이트
    update(deltaTime) {
        if (!this.gameState.playing || this.gameState.paused) return;
        
        // 센서 데이터로 조준점 업데이트
        if (this.sensorManager) {
            this.sensorManager.updateAllCrosshairs(this.canvas.width, this.canvas.height);
        }
        
        // 표적 업데이트
        this.updateTargets(deltaTime);
        
        // 사격 시스템 업데이트
        if (this.shootingSystem) {
            this.shootingSystem.updateBullets(deltaTime);
            this.shootingSystem.updateEffects(deltaTime);
            
            // 자동 사격 체크
            const crosshairs = this.sensorManager.getAllCrosshairs();
            this.shootingSystem.checkAutoShoot(crosshairs);
            
            // 충돌 검사
            this.shootingSystem.checkCollisions();
        }
        
        // 표적 생성
        this.spawnTargets();
    }

    // 표적 업데이트
    updateTargets(deltaTime) {
        this.targets = this.targets.filter(target => {
            target.update(deltaTime);
            return target.isAlive;
        });
    }

    // 표적 생성
    spawnTargets() {
        const now = Date.now();
        const spawnInterval = this.getTargetSpawnInterval();
        
        if (now - this.lastTargetSpawn > spawnInterval) {
            const maxTargets = this.getMaxTargets();
            
            if (this.targets.length < maxTargets) {
                const newTarget = TargetFactory.createRandomTarget(
                    this.canvas.width, 
                    this.canvas.height, 
                    this.targets
                );
                
                this.targets.push(newTarget);
                this.scoringSystem.incrementTargetsCreated();
                this.lastTargetSpawn = now;
            }
        }
    }

    // 표적 생성 간격 반환
    getTargetSpawnInterval() {
        if (this.gameMode === GAME_CONFIG.MODES.MASS_COMPETITIVE) {
            const playerCount = this.sensorManager.getActivePlayerCount();
            const config = GAME_CONFIG.MASS_COMPETITIVE;
            
            const interval = config.baseSpawnInterval - 
                           (playerCount * config.spawnIntervalReduction);
            
            return Math.max(config.minSpawnInterval, interval);
        }
        
        return GAME_CONFIG.GAMEPLAY.targetSpawnInterval;
    }

    // 최대 표적 수 반환
    getMaxTargets() {
        if (this.gameMode === GAME_CONFIG.MODES.MASS_COMPETITIVE) {
            const playerCount = this.sensorManager.getActivePlayerCount();
            const config = GAME_CONFIG.MASS_COMPETITIVE;
            
            const maxTargets = config.baseTargets + 
                              (playerCount * config.targetsPerPlayer);
            
            return Math.min(config.maxTargetsLimit, maxTargets);
        }
        
        return GAME_CONFIG.GAMEPLAY.maxTargets;
    }

    // 렌더링
    render() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.gameState.playing) return;
        
        // 배경 그라디언트
        this.renderBackground();
        
        // 협동 모드 중앙선
        if (this.gameMode === GAME_CONFIG.MODES.COOP) {
            this.renderCenterDivider();
        }
        
        // 표적 렌더링
        this.targets.forEach(target => target.render(this.ctx));
        
        // 사격 시스템 렌더링
        if (this.shootingSystem) {
            this.shootingSystem.renderBullets(this.ctx);
            this.shootingSystem.renderEffects(this.ctx);
        }
        
        // 플레이어 조준점 렌더링 (개선된 플레이어 번호 표시)
        this.renderCrosshairs();
    }

    // 배경 렌더링
    renderBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#1e293b');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 중앙 분할선 렌더링 (협동 모드)
    renderCenterDivider() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }

    // 조준점 렌더링 (개선된 플레이어 번호 표시)
    renderCrosshairs() {
        if (!this.sensorManager) return;
        
        const showPlayerNumbers = this.gameMode === GAME_CONFIG.MODES.MASS_COMPETITIVE;
        
        this.sensorManager.players.forEach((player) => {
            player.renderCrosshair(this.ctx, showPlayerNumbers);
            player.renderEffects(this.ctx);
        });
    }

    // 시스템 콜백 설정들
    setupSensorCallbacks() {
        // 센서 매니저 콜백 설정
    }

    setupShootingCallbacks() {
        // 적중 처리
        this.shootingSystem.on('target-hit', (hitResult) => {
            this.handleTargetHit(hitResult);
        });
        
        // 빗나감 처리
        this.shootingSystem.on('shot-missed', (missResult) => {
            this.handleShotMissed(missResult);
        });
    }

    setupScoringCallbacks() {
        // 리더보드 업데이트
        this.scoringSystem.onLeaderboardUpdate((leaderboard) => {
            if (this.gameMode === GAME_CONFIG.MODES.MASS_COMPETITIVE) {
                this.scorePanelWidget.updateMassCompetitiveLeaderboard(leaderboard);
            }
        });
    }

    // 적중 처리
    handleTargetHit(hitResult) {
        const scoreResult = this.scoringSystem.addScore(
            hitResult.playerId, 
            hitResult.points, 
            hitResult.targetType
        );
        
        // 플레이어에게 적중 효과 추가
        const player = this.sensorManager.players.get(hitResult.playerId);
        if (player) {
            player.addHitEffect(hitResult.position.x, hitResult.position.y);
            
            if (scoreResult.isCombo) {
                this.scorePanelWidget.showComboEffect(scoreResult.combo);
            }
        }
        
        // UI 업데이트
        this.updateScoreDisplay();
    }

    // 빗나감 처리
    handleShotMissed(missResult) {
        this.scoringSystem.addMiss(missResult.playerId);
        this.updateScoreDisplay();
    }

    // 점수 표시 업데이트
    updateScoreDisplay() {
        if (this.gameMode === GAME_CONFIG.MODES.COMPETITIVE) {
            const player1 = this.scoringSystem.getPlayerScore('sensor1');
            const player2 = this.scoringSystem.getPlayerScore('sensor2');
            
            if (player1 && player2) {
                this.scorePanelWidget.updateCompetitiveScore(player1, player2);
            }
        } else if (this.gameMode === GAME_CONFIG.MODES.MASS_COMPETITIVE) {
            const gameStats = this.scoringSystem.getGameStats();
            this.scorePanelWidget.updateGameStats(gameStats);
        } else {
            // 솔로/협동 모드
            const totalScore = this.scoringSystem.getAllScores().reduce((sum, p) => ({
                score: sum.score + p.score,
                hits: sum.hits + p.hits,
                misses: sum.misses + p.misses,
                combo: Math.max(sum.combo, p.combo),
                accuracy: this.scoringSystem.getGameStats().overallAccuracy
            }), { score: 0, hits: 0, misses: 0, combo: 0, accuracy: 100 });
            
            this.scorePanelWidget.updateNormalScore(totalScore);
        }
    }

    // 모드별 UI 설정
    setupModeUI(mode) {
        // 센서 상태 패널 표시/숨김
        this.elements.soloSensorStatus?.classList.toggle('hidden', mode !== GAME_CONFIG.MODES.SOLO);
        this.elements.dualSensorStatus?.classList.toggle('hidden', 
            mode !== GAME_CONFIG.MODES.COOP && mode !== GAME_CONFIG.MODES.COMPETITIVE);
        this.elements.dualSensorStatus2?.classList.toggle('hidden', 
            mode !== GAME_CONFIG.MODES.COOP && mode !== GAME_CONFIG.MODES.COMPETITIVE);
        
        // 컨트롤 패널 위치 조정
        if (mode === GAME_CONFIG.MODES.MASS_COMPETITIVE) {
            this.elements.controlPanel?.classList.add('mass-competitive-mode');
        } else {
            this.elements.controlPanel?.classList.remove('mass-competitive-mode');
        }
    }

    // 키보드 컨트롤 설정 (테스트용)
    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            if (!this.gameState.playing || this.gameState.paused) return;

            const moveSpeed = 20;
            const mainPlayer = this.sensorManager?.players.get('sensor1') || 
                              Array.from(this.sensorManager?.players.values() || [])[0];
            
            if (!mainPlayer) return;

            switch (e.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    mainPlayer.crosshair.targetX = Math.max(0, mainPlayer.crosshair.targetX - moveSpeed);
                    break;
                case 'd':
                case 'arrowright':
                    mainPlayer.crosshair.targetX = Math.min(this.canvas.width, mainPlayer.crosshair.targetX + moveSpeed);
                    break;
                case 'w':
                case 'arrowup':
                    mainPlayer.crosshair.targetY = Math.max(0, mainPlayer.crosshair.targetY - moveSpeed);
                    break;
                case 's':
                case 'arrowdown':
                    mainPlayer.crosshair.targetY = Math.min(this.canvas.height, mainPlayer.crosshair.targetY + moveSpeed);
                    break;
                case ' ':
                    e.preventDefault();
                    this.manualShoot();
                    break;
            }
        });
    }

    // 수동 사격 (키보드/테스트용)
    manualShoot() {
        const mainPlayer = Array.from(this.sensorManager?.players.values() || [])[0];
        if (!mainPlayer || !this.shootingSystem) return;
        
        // 가장 가까운 표적 찾기
        let closestTarget = null;
        let closestDistance = Infinity;
        
        this.targets.forEach(target => {
            if (!target.isAlive) return;
            
            const distance = GameUtils.getDistance(
                mainPlayer.crosshair.x, mainPlayer.crosshair.y,
                target.x, target.y
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTarget = target;
            }
        });
        
        if (closestTarget) {
            this.shootingSystem.shoot(
                mainPlayer.crosshair.x, 
                mainPlayer.crosshair.y,
                closestTarget.x, 
                closestTarget.y,
                mainPlayer.id
            );
        }
    }

    // 게임 종료
    endGame() {
        this.gameState.playing = false;
        this.scoringSystem.setGameEndTime();
        
        // 타이머 정리
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // 결과 표시
        this.showGameResults();
        
        console.log('🎯 게임 종료');
    }

    // 게임 결과 표시
    showGameResults() {
        let resultMessage = '';
        
        if (this.gameMode === GAME_CONFIG.MODES.COMPETITIVE) {
            const results = this.scoringSystem.generateCompetitiveResults();
            if (results) {
                resultMessage = `🏆 ${results.winner.playerName} 승리!\n점수: ${results.winner.score}점`;
            }
        } else if (this.gameMode === GAME_CONFIG.MODES.MASS_COMPETITIVE) {
            const results = this.scoringSystem.generateMassCompetitiveResults();
            if (results) {
                this.showMassCompetitiveResults(results);
                return;
            }
        } else {
            const stats = this.scoringSystem.getGameStats();
            resultMessage = `🎯 게임 완료!\n총 점수: ${stats.totalScore}점\n정확도: ${stats.overallAccuracy}%`;
        }
        
        this.updateGameStatus('게임 종료');
        alert(resultMessage);
    }

    // 대규모 경쟁 결과 모달 표시
    showMassCompetitiveResults(results) {
        // 기존 모달 제거
        const existingModal = document.getElementById('massCompetitiveResultModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 모달 생성
        const modal = GameUtils.createElement('div', 'mass-competitive-result-modal');
        modal.id = 'massCompetitiveResultModal';
        
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🏆 게임 결과</h2>
                </div>
                <div class="modal-body">
                    <div class="result-text">${results.resultText}</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="game.closeMassCompetitiveResultModal()">확인</button>
                    <button class="btn btn-secondary" onclick="game.resetGame()">다시 하기</button>
                    <a href="/" class="btn btn-secondary">허브로</a>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 모달 표시 애니메이션
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    // 대규모 경쟁 결과 모달 닫기
    closeMassCompetitiveResultModal() {
        const modal = document.getElementById('massCompetitiveResultModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    // 대규모 경쟁 게임 시작 (버튼 클릭)
    startMassCompetitive() {
        if (this.waitingRoomWidget && this.waitingRoomWidget.canStartGame()) {
            this.startGame();
        }
    }

    // 게임 일시정지/재개
    togglePause() {
        if (this.gameState.paused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    pauseGame() {
        this.gameState.paused = true;
        this.elements.pauseBtn.textContent = '▶️ 계속';
        this.updateGameStatus('게임 일시정지');
    }

    resumeGame() {
        this.gameState.paused = false;
        this.elements.pauseBtn.textContent = '⏸️ 일시정지';
        this.updateGameStatus('게임 진행 중...');
    }

    // 게임 리셋
    resetGame() {
        // 모달 닫기
        this.closeMassCompetitiveResultModal();
        
        // 게임 상태 리셋
        this.gameState.playing = false;
        this.gameState.paused = false;
        this.gameState.timeLeft = 0;
        
        // 타이머 정리
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // 게임 요소 리셋
        this.targets = [];
        
        // 시스템 리셋
        this.scoringSystem?.reset();
        this.shootingSystem?.reset();
        
        // UI 리셋
        this.scorePanelWidget?.hide();
        this.waitingRoomWidget?.reset();
        this.gamePage?.reset();
        
        // SDK 정리
        if (this.sdk) {
            // SDK 연결 해제는 하지 않고 상태만 리셋
        }
        
        this.updateGameStatus('게임 리셋 완료');
        console.log('🔄 게임 리셋 완료');
    }

    // 상태 업데이트 메서드들
    updateGameStatus(status) {
        if (this.elements.gameStatusText) {
            this.elements.gameStatusText.textContent = status;
        }
    }

    updateServerStatus(connected) {
        if (this.elements.serverStatus) {
            this.elements.serverStatus.classList.toggle('connected', connected);
        }
    }

    updateSensorStatus(connected) {
        if (this.elements.sensorStatus) {
            this.elements.sensorStatus.classList.toggle('connected', connected);
        }
    }

    updateSensor1Status(connected) {
        if (this.elements.sensor1Status) {
            this.elements.sensor1Status.classList.toggle('connected', connected);
        }
    }

    updateSensor2Status(connected) {
        if (this.elements.sensor2Status) {
            this.elements.sensor2Status.classList.toggle('connected', connected);
        }
    }

    // 시스템 정리
    cleanupGameSystems() {
        this.sensorManager?.cleanup();
        this.shootingSystem?.cleanup();
        this.scoringSystem?.cleanup();
        this.waitingRoomWidget?.destroy();
        this.scorePanelWidget?.cleanup();
        
        this.sensorManager = null;
        this.shootingSystem = null;
        this.scoringSystem = null;
        this.waitingRoomWidget = null;
        this.scorePanelWidget = null;
    }

    // 전체 정리
    cleanup() {
        // 게임 루프 정지
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        
        // 타이머 정리
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // 시스템 정리
        this.cleanupGameSystems();
        
        // 페이지 정리
        this.gamePage?.cleanup();
        
        console.log('🎯 Shot Target Game 정리 완료');
    }
}