// Pages Layer - 메인 게임 페이지
import { GameState } from '../../entities/game-state/model.js';
import { TargetManager } from '../../entities/target/model.js';
import { PlayerManager } from '../../entities/player/model.js';
import { SensorController } from '../../features/sensor-control/model.js';
import { ShootingSystem } from '../../features/shooting/model.js';
import { GameModeManager } from '../../features/game-modes/model.js';
import { SessionManager } from '../../features/session-management/model.js';
import { GameUI } from '../../widgets/game-ui/index.js';
import { Leaderboard } from '../../widgets/leaderboard/index.js';
import { ResultModal } from '../../widgets/result-modal/index.js';

export class ShotTargetGame {
    constructor() {
        // 엔티티
        this.gameState = new GameState();
        this.targetManager = new TargetManager();
        this.playerManager = new PlayerManager();

        // 피처
        this.sensorController = new SensorController();
        this.shootingSystem = new ShootingSystem();
        this.gameModeManager = new GameModeManager();
        this.sessionManager = new SessionManager();

        // 위젯
        this.gameUI = new GameUI();
        this.leaderboard = new Leaderboard('massLeaderboard');
        this.resultModal = new ResultModal();

        // 게임 요소
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 게임 루프
        this.gameLoop = null;
        this.lastTargetSpawn = 0;
        this.timerInterval = null;

        this.initializeGame();
    }

    async initializeGame() {
        console.log('🎯 Shot Target Game 초기화');

        this.setupCanvas();
        this.setupModeSelection();
        this.setupKeyboardControls();
        this.startGameLoop();
        this.gameUI.updateGameStatus('게임 모드를 선택하세요');
    }

    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.sensorController.initializeCrosshair(this.canvas.width, this.canvas.height);
        };

        window.addEventListener('resize', resize);
        resize();
    }

    setupModeSelection() {
        // 모드 선택 버튼 이벤트
        this.gameUI.elements.soloModeBtn?.addEventListener('click', () => {
            this.selectGameMode('solo');
        });

        this.gameUI.elements.coopModeBtn?.addEventListener('click', () => {
            this.selectGameMode('coop');
        });

        this.gameUI.elements.competitiveModeBtn?.addEventListener('click', () => {
            this.selectGameMode('competitive');
        });

        this.gameUI.elements.massCompetitiveModeBtn?.addEventListener('click', () => {
            this.selectGameMode('mass-competitive');
        });
    }

    async selectGameMode(mode) {
        console.log(`🎯 게임 모드 선택: ${mode}`);

        const modeInfo = this.gameModeManager.setMode(mode);
        const uiConfig = this.gameModeManager.getUIConfig();

        // SDK 초기화
        const success = await this.sessionManager.initializeSDK(modeInfo.sdkType);
        if (!success) {
            this.gameUI.updateGameStatus('SDK 초기화 실패');
            return;
        }

        // UI 설정
        this.gameUI.setupModeUI(mode, uiConfig);

        // 세션 이벤트 설정
        this.setupSessionEvents();

        this.gameUI.updateGameStatus('서버 연결 중...');
    }

    setupSessionEvents() {
        // 연결 이벤트
        this.sessionManager.on('connected', async () => {
            this.gameState.connected = true;
            this.gameUI.updateServerStatus(true);
            this.gameUI.updateGameStatus('서버 연결됨 - 세션 생성 중...');

            await this.sessionManager.createSession();
        });

        this.sessionManager.on('disconnected', () => {
            this.gameState.connected = false;
            this.gameUI.updateServerStatus(false);
            this.gameUI.updateGameStatus('서버 연결 끊김');
        });

        // 세션 생성
        this.sessionManager.on('session-created', async (session) => {
            this.gameState.sessionCode = session.sessionCode;

            if (this.gameModeManager.currentMode === 'mass-competitive') {
                await this.displayMassSessionInfo(session);
                this.gameUI.updateGameStatus('플레이어 연결 대기 중...');
            } else {
                await this.displaySessionInfo(session);
                this.gameUI.updateGameStatus('센서 연결 대기 중...');
            }
        });

        // 센서 연결
        this.sessionManager.on('sensor-connected', (data) => {
            this.handleSensorConnected(data);
        });

        this.sessionManager.on('sensor-disconnected', (data) => {
            this.handleSensorDisconnected(data);
        });

        // 센서 데이터
        this.sessionManager.on('sensor-data', (data) => {
            this.sensorController.processSensorData(
                data,
                this.gameModeManager.currentMode,
                this.playerManager
            );

            // 대규모 경쟁 모드에서 내 플레이어 센서 데이터 메인으로 복사
            if (this.gameModeManager.currentMode === 'mass-competitive' && data.sensorId === this.gameState.myPlayerId) {
                const player = this.playerManager.getPlayer(data.sensorId);
                if (player) {
                    this.sensorController.sensorData.sensor1.tilt.x = player.tilt.x;
                    this.sensorController.sensorData.sensor1.tilt.y = player.tilt.y;
                }
            }

            if (this.gameState.playing && !this.gameState.paused) {
                this.sensorController.applySensorMovement(
                    this.gameModeManager.currentMode,
                    this.canvas.width,
                    this.canvas.height
                );
            }
        });

        // 오류 처리
        this.sessionManager.on('connection-error', (error) => {
            console.error('연결 오류:', error);
            this.gameUI.updateGameStatus(`연결 오류: ${error.error}`);
        });
    }

    handleSensorConnected(data) {
        const mode = this.gameModeManager.currentMode;

        if (mode === 'solo') {
            this.gameState.sensorConnected = true;
            this.gameUI.updateSensorStatus(true);
            this.gameUI.updateGameStatus('센서 연결됨 - 게임 준비 완료');
            this.gameUI.hideSessionPanel();
            this.startGame();

        } else if (mode === 'coop' || mode === 'competitive') {
            const sensorId = data.sensorId || 'sensor1';

            if (sensorId === 'sensor1') {
                this.gameState.sensor1Connected = true;
                this.gameUI.updateSensorStatus(true, 'sensor1');
            } else if (sensorId === 'sensor2') {
                this.gameState.sensor2Connected = true;
                this.gameUI.updateSensorStatus(true, 'sensor2');
            }

            if (this.gameState.sensor1Connected && this.gameState.sensor2Connected) {
                this.gameUI.updateGameStatus('모든 센서 연결됨 - 게임 준비 완료');
                this.gameUI.hideSessionPanel();
                this.startGame();
            } else {
                const connectedCount = (this.gameState.sensor1Connected ? 1 : 0) +
                    (this.gameState.sensor2Connected ? 1 : 0);
                this.gameUI.updateGameStatus(`센서 연결됨 (${connectedCount}/2) - 추가 연결 대기 중...`);
            }

        } else if (mode === 'mass-competitive') {
            this.handleMassCompetitiveSensorConnected(data);
        }
    }

    handleMassCompetitiveSensorConnected(data) {
        const playerId = data.sensorId;
        const totalConnected = data.connectedSensors || 1;

        if (!this.gameState.myPlayerId) {
            this.gameState.myPlayerId = playerId;
            this.gameState.sensorConnected = true;
            this.gameUI.updateSensorStatus(true);
        }

        // 플레이어 추가
        this.playerManager.addPlayer(playerId);
        this.updateMassWaitingList();
        this.gameUI.updateMassPlayerCount(totalConnected);

        // 표적 설정 업데이트
        this.updateMassCompetitiveTargetSettings();

        // 3명 이상이면 게임 시작 가능
        if (totalConnected >= 3) {
            this.gameUI.elements.massStartBtn.disabled = false;
            this.gameUI.updateGameStatus(`플레이어 대기 중 (${totalConnected}/8) - 시작 가능`);
        } else {
            this.gameUI.updateGameStatus(`플레이어 대기 중 (${totalConnected}/8) - 최소 3명 필요`);
        }
    }

    handleSensorDisconnected(data) {
        const mode = this.gameModeManager.currentMode;

        if (mode === 'mass-competitive') {
            const disconnectedSensorId = data.sensorId;
            const player = this.playerManager.getPlayer(disconnectedSensorId);

            if (player) {
                console.log(`🎯 [대규모 경쟁] 플레이어 연결 해제: ${player.name}`);
                player.deactivate();

                if (disconnectedSensorId === this.gameState.myPlayerId) {
                    this.gameState.sensorConnected = false;
                    this.gameUI.updateSensorStatus(false);
                    this.gameUI.updateGameStatus('센서 연결 끊김');
                    this.pauseGame();
                }

                this.updateMassWaitingList();
                this.leaderboard.updatePlayers(
                    this.playerManager.getPlayersByScore(),
                    this.gameState.myPlayerId
                );
            }
        } else {
            this.gameState.sensorConnected = false;
            this.gameUI.updateSensorStatus(false);
            this.gameUI.updateGameStatus('센서 연결 끊김');
            this.pauseGame();
        }
    }

    // 게임 시작
    startGame() {
        this.gameState.reset(this.gameModeManager.currentMode);
        this.gameState.playing = true;
        this.gameState.paused = false;
        this.gameState.gameStartTime = Date.now();

        this.gameUI.updateGameStatus('게임 진행 중...');
        this.lastTargetSpawn = Date.now();

        this.startTimer();
        console.log('🎯 Shot Target 게임 시작!');
    }

    // 타이머 시작
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (this.gameState.playing && !this.gameState.paused) {
                const timeLeft = this.gameState.decreaseTime();
                this.gameUI.updateTimer(this.gameState.timeLeft);

                if (!timeLeft) {
                    this.endGame();
                }
            }
        }, 1000);
    }

    // 게임 루프 시작
    startGameLoop() {
        const loop = () => {
            this.update();
            this.render();
            this.gameLoop = requestAnimationFrame(loop);
        };
        loop();
    }

    // 게임 업데이트
    update() {
        const now = Date.now();

        if (this.gameState.playing && !this.gameState.paused) {
            // 조준점 위치 업데이트
            this.sensorController.updateCrosshairPosition(this.gameModeManager.currentMode);
            this.gameUI.updateCrosshairPosition(
                this.sensorController.crosshair.x,
                this.sensorController.crosshair.y
            );

            // 표적 생성
            const targetSettings = this.gameModeManager.calculateTargetSettings(
                this.playerManager.activeCount
            );

            if (now - this.lastTargetSpawn > targetSettings.spawnInterval) {
                const target = this.targetManager.spawnTarget(
                    this.gameModeManager.currentMode,
                    this.canvas.width,
                    this.canvas.height,
                    targetSettings.maxTargets
                );

                if (target && this.gameModeManager.currentMode === 'mass-competitive') {
                    this.gameState.totalTargetsCreated++;
                    this.gameUI.updateTotalTargetsCreated(this.gameState.totalTargetsCreated);
                }

                this.lastTargetSpawn = now;
            }

            // 표적 업데이트
            this.targetManager.update();

            // 총알 업데이트
            this.shootingSystem.update();

            // 자동 사격 시도
            this.tryAutoShoot();

            // UI 업데이트
            this.updateUI();
        }
    }

    // 자동 사격 시도
    tryAutoShoot() {
        this.shootingSystem.tryShoot(
            this.gameModeManager.currentMode,
            this.sensorController.crosshair,
            this.sensorController.crosshair2,
            this.targetManager,
            this.gameState,
            this.playerManager
        );
    }

    // UI 업데이트
    updateUI() {
        const mode = this.gameModeManager.currentMode;

        if (mode === 'competitive') {
            this.gameUI.updateCompetitiveScore(this.gameState);
        } else if (mode === 'mass-competitive') {
            this.leaderboard.updatePlayers(
                this.playerManager.getPlayersByScore(),
                this.gameState.myPlayerId
            );
        } else {
            this.gameUI.updateScore(this.gameState);
        }
    }

    // 렌더링
    render() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 배경 그라디언트
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#1e293b');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 협동 모드 중앙 경계선
        if (this.gameModeManager.currentMode === 'coop') {
            this.renderCenterDivider();
        }

        // 표적 렌더링
        this.targetManager.render(this.ctx);

        // 총알 렌더링
        this.shootingSystem.render(this.ctx);

        // 대규모 경쟁 모드에서 다른 플레이어 조준점 렌더링
        if (this.gameModeManager.currentMode === 'mass-competitive') {
            this.renderMassCompetitiveCrosshairs();
        }
    }

    // 중앙 경계선 렌더링 (협동 모드)
    renderCenterDivider() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.restore();
    }

    // 대규모 경쟁 모드 조준점 렌더링
    renderMassCompetitiveCrosshairs() {
        this.playerManager.getAllPlayers().forEach(player => {
            if (!player.isActive || player.id === this.gameState.myPlayerId) return;

            this.ctx.save();
            this.ctx.strokeStyle = player.color;
            this.ctx.fillStyle = player.color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.7;

            // 다른 플레이어 조준점 그리기
            this.ctx.beginPath();
            this.ctx.arc(player.crosshairX, player.crosshairY, 15, 0, Math.PI * 2);
            this.ctx.stroke();

            // 플레이어 이름 표시
            this.ctx.font = '12px Arial';
            this.ctx.fillText(player.name, player.crosshairX + 20, player.crosshairY - 20);

            this.ctx.restore();
        });
    }

    // 키보드 컨트롤 설정
    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            if (!this.gameState.playing || this.gameState.paused) return;

            const moveSpeed = 20;
            switch (e.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    this.sensorController.crosshair.targetX = Math.max(0,
                        this.sensorController.crosshair.targetX - moveSpeed);
                    break;
                case 'd':
                case 'arrowright':
                    this.sensorController.crosshair.targetX = Math.min(this.canvas.width,
                        this.sensorController.crosshair.targetX + moveSpeed);
                    break;
                case 'w':
                case 'arrowup':
                    this.sensorController.crosshair.targetY = Math.max(0,
                        this.sensorController.crosshair.targetY - moveSpeed);
                    break;
                case 's':
                case 'arrowdown':
                    this.sensorController.crosshair.targetY = Math.min(this.canvas.height,
                        this.sensorController.crosshair.targetY + moveSpeed);
                    break;
                case ' ':
                    e.preventDefault();
                    this.tryAutoShoot();
                    break;
            }
        });
    }

    // 세션 정보 표시
    async displaySessionInfo(session) {
        this.gameUI.displaySessionInfo(session.sessionCode);
        await this.sessionManager.generateQRCode(
            this.gameUI.elements.qrContainer,
            session.sessionCode
        );
    }

    // 대규모 경쟁 모드 세션 정보 표시
    async displayMassSessionInfo(session) {
        if (this.gameUI.elements.massSessionCode) {
            this.gameUI.elements.massSessionCode.textContent = session.sessionCode || '----';
        }

        if (this.gameUI.elements.massQrContainer) {
            await this.sessionManager.generateQRCode(
                this.gameUI.elements.massQrContainer,
                session.sessionCode
            );
        }
    }

    // 대규모 경쟁 모드 표적 설정 업데이트
    updateMassCompetitiveTargetSettings() {
        if (this.gameModeManager.currentMode !== 'mass-competitive') return;

        const playerCount = this.playerManager.activeCount;
        const settings = this.gameModeManager.calculateTargetSettings(playerCount);

        console.log(`🎯 [대규모 경쟁] 표적 설정 업데이트: 플레이어 ${playerCount}명, 최대 표적 ${settings.maxTargets}개, 생성 간격 ${settings.spawnInterval}ms`);
    }

    // 대규모 경쟁 모드 대기 목록 업데이트
    updateMassWaitingList() {
        const waitingTitle = this.gameUI.elements.massWaitingList?.querySelector('.waiting-title');
        if (waitingTitle) {
            waitingTitle.textContent = `🎮 참가자 대기실 (${this.playerManager.count}/8)`;
        }

        const waitingPlayers = this.gameUI.elements.massWaitingPlayers;
        if (waitingPlayers) {
            waitingPlayers.innerHTML = '';

            this.playerManager.getAllPlayers().forEach(player => {
                const playerElement = document.createElement('div');
                playerElement.className = 'mass-waiting-player';
                playerElement.innerHTML = `
                    <div class="mass-player-color" style="background-color: ${player.color}"></div>
                    <div class="mass-player-name">${player.name}</div>
                `;
                waitingPlayers.appendChild(playerElement);
            });
        }
    }

    // 대규모 경쟁 모드 게임 시작
    startMassCompetitive() {
        if (this.playerManager.activeCount >= 3) {
            this.updateMassCompetitiveTargetSettings();
            this.gameUI.hideMassWaitingPanel();
            this.startGame();
        }
    }

    // 게임 종료
    endGame() {
        this.gameState.playing = false;

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.gameUI.updateGameStatus('게임 종료!');

        // 모드별 결과 표시
        const mode = this.gameModeManager.currentMode;

        if (mode === 'competitive') {
            this.resultModal.showCompetitiveResults(
                this.gameState.player1Score,
                this.gameState.player2Score
            );
        } else if (mode === 'mass-competitive') {
            this.resultModal.showMassCompetitiveResults(
                this.playerManager.getPlayersByScore(),
                { totalTargetsCreated: this.gameState.totalTargetsCreated },
                this.gameState.myPlayerId
            );
        } else {
            this.resultModal.showNormalResults(this.gameState);
        }

        console.log('🎯 게임 종료');
    }

    // 게임 일시정지/재개
    togglePause() {
        this.gameState.paused = !this.gameState.paused;
        this.gameUI.updatePauseButton(this.gameState.paused);

        if (this.gameState.paused) {
            this.gameUI.updateGameStatus('게임 일시정지');
        } else {
            this.gameUI.updateGameStatus('게임 진행 중...');
        }
    }

    // 게임 일시정지
    pauseGame() {
        this.gameState.paused = true;
        this.gameUI.updatePauseButton(true);
        this.gameUI.updateGameStatus('게임 일시정지');
    }

    // 게임 리셋
    resetGame() {
        // 게임 상태 리셋
        this.gameState.reset(this.gameModeManager.currentMode);

        // 매니저들 리셋
        this.targetManager.clear();
        this.shootingSystem.clear();

        // 대규모 경쟁 모드가 아닌 경우 플레이어 매니저도 리셋
        if (this.gameModeManager.currentMode !== 'mass-competitive') {
            this.playerManager.clear();
        }

        // UI 리셋
        this.gameUI.showModeSelection();
        this.gameUI.updateGameStatus('게임 모드를 선택하세요');

        // 세션 정리
        this.sessionManager.cleanup();

        // 게임 모드 리셋
        this.gameModeManager.currentMode = null;

        console.log('🎯 게임 리셋 완료');
    }
}

// 전역 함수들 (HTML에서 호출용)
window.startMassCompetitive = function () {
    if (window.game) {
        window.game.startMassCompetitive();
    }
};

window.togglePause = function () {
    if (window.game) {
        window.game.togglePause();
    }
};

window.resetGame = function () {
    if (window.game) {
        window.game.resetGame();
    }
};