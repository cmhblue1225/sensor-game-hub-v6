import { Target } from '../entities/target.js';
import { Player } from '../entities/player.js';
import { ScoringSystem } from '../features/scoring-system.js';
import { SensorManager } from '../features/sensor-manager.js';
import { ShootingSystem } from '../features/shooting-system.js';
import { SoundSystem } from '../features/sound-system.js';
import { ScorePanelWidget } from '../widgets/score-panel-widget.js';
import { WaitingRoomWidget } from '../widgets/waiting-room-widget.js';
import { CONFIG } from '../shared/config.js';
import { Utils } from '../shared/utils.js';

export class GamePage {
    constructor() {
        this.gameMode = null;
        this.sdk = null;

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.state = {
            connected: false,
            sensorConnected: false,
            sensor1Connected: false,
            sensor2Connected: false,
            playing: false,
            paused: false,
            sessionCode: null,
            timeLeft: 180,
            gameStartTime: null,
            myPlayerId: null,
            totalTargetsCreated: 0
        };

        this.massPlayers = new Map();
        this.playerColors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
            '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
        ];

        this.targets = [];
        this.config = CONFIG;

        this.scoringSystem = new ScoringSystem();
        this.sensorManager = new SensorManager();
        this.shootingSystem = new ShootingSystem();
        this.soundSystem = new SoundSystem();

        this.elements = this.initializeElements();
        this.scorePanelWidget = new ScorePanelWidget(this.elements);
        this.waitingRoomWidget = new WaitingRoomWidget(this.elements);

        this.gameLoop = null;
        this.lastTargetSpawn = 0;
        this.timerInterval = null;

        this.initializeGame();
    }

    initializeElements() {
        return {
            scoreValue: document.getElementById('scoreValue'),
            hitsCount: document.getElementById('hitsCount'),
            missesCount: document.getElementById('missesCount'),
            comboCount: document.getElementById('comboCount'),
            accuracyValue: document.getElementById('accuracyValue'),
            serverStatus: document.getElementById('serverStatus'),
            sensorStatus: document.getElementById('sensorStatus'),
            sensor1Status: document.getElementById('sensor1Status'),
            sensor2Status: document.getElementById('sensor2Status'),
            gameStatusText: document.getElementById('gameStatusText'),
            sessionPanel: document.getElementById('sessionPanel'),
            sessionTitle: document.getElementById('sessionTitle'),
            sessionInstructions: document.getElementById('sessionInstructions'),
            sessionCode: document.getElementById('sessionCode'),
            qrContainer: document.getElementById('qrContainer'),
            gameInfoPanel: document.getElementById('gameInfoPanel'),
            crosshair: document.getElementById('crosshair'),
            pauseBtn: document.getElementById('pauseBtn'),
            timerValue: document.getElementById('timerValue'),
            modeSelectionPanel: document.getElementById('modeSelectionPanel'),
            soloModeBtn: document.getElementById('soloModeBtn'),
            coopModeBtn: document.getElementById('coopModeBtn'),
            competitiveModeBtn: document.getElementById('competitiveModeBtn'),
            massCompetitiveModeBtn: document.getElementById('massCompetitiveModeBtn'),
            soloSensorStatus: document.getElementById('soloSensorStatus'),
            dualSensorStatus: document.getElementById('dualSensorStatus'),
            dualSensorStatus2: document.getElementById('dualSensorStatus2'),
            normalScorePanel: document.getElementById('normalScorePanel'),
            competitiveScorePanel: document.getElementById('competitiveScorePanel'),
            competitiveTimerValue: document.getElementById('competitiveTimerValue'),
            player1Score: document.getElementById('player1Score'),
            player2Score: document.getElementById('player2Score'),
            scoreDetails: document.getElementById('scoreDetails'),
            massCompetitivePanel: document.getElementById('massCompetitivePanel'),
            massCompetitiveTimerValue: document.getElementById('massCompetitiveTimerValue'),
            massPlayerCount: document.getElementById('massPlayerCount'),
            totalTargetsCreated: document.getElementById('totalTargetsCreated'),
            massLeaderboard: document.getElementById('massLeaderboard'),
            massWaitingPanel: document.getElementById('massWaitingPanel'),
            massSessionCode: document.getElementById('massSessionCode'),
            massQrContainer: document.getElementById('massQrContainer'),
            massWaitingListWidget: document.getElementById('massWaitingListWidget'),
            massWaitingPlayers: document.getElementById('massWaitingPlayers'),
            massStartBtn: document.getElementById('massStartBtn'),
            controlPanel: document.querySelector('.control-panel'),
            backToHubBtn: document.getElementById('backToHubBtn')
        };
    }

    async initializeGame() {
        console.log('🎯 Shot Target Game 초기화');

        this.setupCanvas();
        this.setupModeSelection();
        this.setupKeyboardControls();
        this.setupSoundEvents();
        this.startGameLoop();
        this.waitingRoomWidget.updateGameStatus('게임 모드를 선택하세요');
        
        // 초기 모드 선택 화면에서 허브로 버튼 표시
        if (this.elements.backToHubBtn) {
            this.elements.backToHubBtn.classList.add('show');
        }
        
        // 모드 선택 화면에서는 점수 패널들 숨기기
        this.elements.normalScorePanel.classList.add('hidden');
        this.elements.competitiveScorePanel.classList.add('hidden');
        this.elements.massCompetitivePanel.classList.add('hidden');
    }
    /**
    * 게임 상태에 따라 컨트롤 패널의 버튼을 동적으로 렌더링합니다.
    * @param {'waiting' | 'playing'} state - 현재 게임 상태 ('대기 중' 또는 '플레이 중')
    **/
    renderControlPanel(state) {
        const controlPanel = this.elements.controlPanel;
        
        // 기존 허브로 버튼 보존
        const existingHubBtn = this.elements.backToHubBtn;
        
        // 다른 버튼들만 제거
        const existingButtons = controlPanel.querySelectorAll('.btn:not(#backToHubBtn)');
        existingButtons.forEach(btn => btn.remove());
        
        // 버튼 그룹이 없으면 생성
        let btnGroup = controlPanel.querySelector('.btn-group');
        if (!btnGroup) {
            btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group';
            controlPanel.appendChild(btnGroup);
        }

        let buttonsHtml = '';

        if (state === 'waiting') {
            // 대기 화면(QR코드 화면)에 표시될 버튼들
            buttonsHtml = `
                <button class="btn btn-secondary" id="backToModeBtn">🔄 모드 선택</button>
                <a href="/" class="btn btn-secondary">🏠 허브로</a>
            `;
        } else if (state === 'playing') {
            // 실제 게임 진행 중에 표시될 버튼들
            buttonsHtml = `
                <button class="btn btn-secondary" id="resetBtn">🔄 재시작</button>
                <button class="btn btn-primary" id="pauseBtn">⏸️ 일시정지</button>
                <a href="/" class="btn btn-secondary">🏠 허브로</a>
            `;
        }

        btnGroup.innerHTML = buttonsHtml;
        
        // 허브로 버튼 숨기기 (게임 진행 중이므로)
        if (existingHubBtn) {
            existingHubBtn.classList.remove('show');
        }
        
        this.setupControlPanelListeners(state);
    }

    /**
    * 동적으로 생성된 컨트롤 패널 버튼에 이벤트 리스너를 설정합니다.
    * @param {'waiting' | 'playing'} state
    */
    setupControlPanelListeners(state) {
        if (state === 'waiting') {
            const backToModeBtn = document.getElementById('backToModeBtn');
            if (backToModeBtn) {
                backToModeBtn.addEventListener('click', () => this.goBackToModeSelection());
            }
        } else if (state === 'playing') {
            const resetBtn = document.getElementById('resetBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.resetGame());
            }

            const pauseBtn = document.getElementById('pauseBtn');
            if (pauseBtn) {
                pauseBtn.addEventListener('click', () => this.togglePause());
            }
        }
    }

    /**
     * 모든 UI 패널을 숨기는 함수입니다.
     */
    resetUI() {
        // 모든 패널 숨기기
        this.elements.sessionPanel.classList.add('hidden');
        this.elements.massWaitingPanel.classList.add('hidden');
        this.elements.massWaitingListWidget.classList.add('hidden');
        this.elements.gameInfoPanel.classList.add('hidden');
        this.elements.massCompetitivePanel.classList.add('hidden');
        this.elements.normalScorePanel.classList.add('hidden');
        this.elements.competitiveScorePanel.classList.add('hidden');
        this.elements.crosshair.classList.add('hidden');
        
        // 센서 상태 패널 숨기기
        this.elements.soloSensorStatus.classList.add('hidden');
        this.elements.dualSensorStatus.classList.add('hidden');
        this.elements.dualSensorStatus2.classList.add('hidden');

        // 허브로 버튼 숨기기
        if (this.elements.backToHubBtn) {
            this.elements.backToHubBtn.classList.remove('show');
        }

        if (this.massWaitingRoomWidget) {
            this.massWaitingRoomWidget.hide();
        }
    }

    /**
   * 모드 선택 화면으로 돌아가는 로직을 처리합니다.
   */
   goBackToModeSelection() {
       // SDK 세션 정리
       if (this.sdk && typeof this.sdk.cleanup === 'function') {
           this.sdk.cleanup();
        }
   
        // 모든 UI 패널 숨기기
        this.resetUI();

        // 모드 선택 패널 표시
        this.elements.modeSelectionPanel.classList.remove('hidden');

        // 허브로 버튼 표시
        if (this.elements.backToHubBtn) {
            this.elements.backToHubBtn.classList.add('show');
        }

        // 컨트롤 패널의 다른 버튼들 제거 (허브로 버튼은 유지)
        const existingButtons = this.elements.controlPanel.querySelectorAll('.btn:not(#backToHubBtn)');
        existingButtons.forEach(btn => btn.remove());
        
        // 버튼 그룹도 제거
        const btnGroup = this.elements.controlPanel.querySelector('.btn-group');
        if (btnGroup) {
            btnGroup.remove();
        }

        // 상태 초기화
        this.waitingRoomWidget.updateGameStatus('게임 모드를 선택하세요');
        this.waitingRoomWidget.updateServerStatus(false);
        this.waitingRoomWidget.updateSensorStatus(false);
        this.waitingRoomWidget.updateSensor1Status(false);
        this.waitingRoomWidget.updateSensor2Status(false);
    }

    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.sensorManager.initializeCrosshair(this.canvas.width, this.canvas.height);
        };

        window.addEventListener('resize', resize);
        resize();
    }

    setupModeSelection() {
        this.elements.soloModeBtn.addEventListener('click', () => {
            this.selectGameMode('solo');
        });

        this.elements.coopModeBtn.addEventListener('click', () => {
            this.selectGameMode('coop');
        });

        this.elements.competitiveModeBtn.addEventListener('click', () => {
            this.selectGameMode('competitive');
        });

        this.elements.massCompetitiveModeBtn.addEventListener('click', () => {
            this.selectGameMode('mass-competitive');
        });
    }

    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            if (!this.state.playing || this.state.paused) return;

            const moveSpeed = 20;
            switch (e.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    this.sensorManager.crosshair.targetX = Math.max(0, this.sensorManager.crosshair.targetX - moveSpeed);
                    break;
                case 'd':
                case 'arrowright':
                    this.sensorManager.crosshair.targetX = Math.min(this.canvas.width, this.sensorManager.crosshair.targetX + moveSpeed);
                    break;
                case 'w':
                case 'arrowup':
                    this.sensorManager.crosshair.targetY = Math.max(0, this.sensorManager.crosshair.targetY - moveSpeed);
                    break;
                case 's':
                case 'arrowdown':
                    this.sensorManager.crosshair.targetY = Math.min(this.canvas.height, this.sensorManager.crosshair.targetY + moveSpeed);
                    break;
                case ' ':
                    e.preventDefault();
                    this.tryShoot();
                    break;
            }
        });
    }

    setupSoundEvents() {
        // 사용자 상호작용 시 오디오 컨텍스트 활성화
        const enableAudio = () => {
            this.soundSystem.enableAudio();
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('touchstart', enableAudio);
        };
        
        document.addEventListener('click', enableAudio);
        document.addEventListener('touchstart', enableAudio);

        // 🔊 모든 버튼에 클릭 사운드 추가
        document.addEventListener('click', (event) => {
            if (event.target.matches('button, .btn, .mode-btn')) {
                this.soundSystem.playButtonClickSound();
            }
        });
    }

    async selectGameMode(mode) {
        console.log(`🎯 게임 모드 선택: ${mode}`);
        this.gameMode = mode;

        // 기존 UI 패널 모두 숨기기
        this.resetUI();

        let sdkGameType;
        if (mode === 'solo') {
            sdkGameType = 'solo';
        } else if (mode === 'mass-competitive') {
            sdkGameType = 'multi';
        } else {
            sdkGameType = 'dual';
        }

        this.sdk = new SessionSDK({
            gameId: 'shot-target',
            gameType: sdkGameType,
            debug: true
        });

        this.elements.modeSelectionPanel.classList.add('hidden');
        this.setupModeUI(mode);
        this.setupSDKEvents();

        if (mode === 'mass-competitive') {
            this.elements.massWaitingPanel.classList.remove('hidden');
            this.elements.massWaitingListWidget.classList.remove('hidden');
        } else {
            this.elements.sessionPanel.classList.remove('hidden');
        }

        this.waitingRoomWidget.updateGameStatus('서버 연결 중...');
        this.renderControlPanel('waiting');
    }

    setupModeUI(mode) {
        if (mode === 'solo') {
            this.elements.sessionTitle.textContent = '🎯 Shot Target - 싱글 플레이';
            this.elements.sessionInstructions.innerHTML =
                '모바일 센서로 조준하여 표적을 맞추는 게임!<br>' +
                '조준점을 표적 중앙에 맞추면 자동으로 발사됩니다.<br>' +
                '아래 코드를 모바일에서 입력하거나 QR 코드를 스캔하세요.';

            this.elements.controlPanel.classList.remove('mass-competitive-mode');
            this.elements.soloSensorStatus.classList.remove('hidden');
            this.elements.dualSensorStatus.classList.add('hidden');
            this.elements.dualSensorStatus2.classList.add('hidden');
            this.elements.normalScorePanel.classList.remove('hidden');
            this.elements.competitiveScorePanel.classList.add('hidden');

        } else if (mode === 'coop') {
            this.elements.sessionTitle.textContent = '🤝 Shot Target - 협동 플레이';
            this.elements.sessionInstructions.innerHTML =
                '2명이 협력하는 표적 맞추기 게임!<br>' +
                '각자 화면 절반에서 조준하여 함께 점수를 얻어보세요.<br>' +
                '아래 코드를 두 개의 모바일에서 입력하거나 QR 코드를 스캔하세요.';

            this.elements.controlPanel.classList.remove('mass-competitive-mode');
            this.elements.soloSensorStatus.classList.add('hidden');
            this.elements.dualSensorStatus.classList.remove('hidden');
            this.elements.dualSensorStatus2.classList.remove('hidden');
            this.elements.normalScorePanel.classList.remove('hidden');
            this.elements.competitiveScorePanel.classList.add('hidden');

        } else if (mode === 'competitive') {
            this.elements.sessionTitle.textContent = '⚔️ Shot Target - 경쟁 플레이';
            this.elements.sessionInstructions.innerHTML =
                '2명이 경쟁하는 표적 맞추기 게임!<br>' +
                '각자 모바일로 조준하여 더 높은 점수를 얻어보세요.<br>' +
                '아래 코드를 두 개의 모바일에서 입력하거나 QR 코드를 스캔하세요.';

            this.elements.controlPanel.classList.remove('mass-competitive-mode');
            this.elements.soloSensorStatus.classList.add('hidden');
            this.elements.dualSensorStatus.classList.remove('hidden');
            this.elements.dualSensorStatus2.classList.remove('hidden');
            this.elements.normalScorePanel.classList.add('hidden');
            this.elements.competitiveScorePanel.classList.remove('hidden');

        } else if (mode === 'mass-competitive') {
            this.elements.controlPanel.classList.add('mass-competitive-mode');
            this.elements.soloSensorStatus.classList.add('hidden');
            this.elements.dualSensorStatus.classList.add('hidden');
            this.elements.dualSensorStatus2.classList.add('hidden');
            this.elements.normalScorePanel.classList.add('hidden');
            this.elements.competitiveScorePanel.classList.add('hidden');
        }
    }

    setupSDKEvents() {
        this.sdk.on('connected', async () => {
            this.state.connected = true;
            this.waitingRoomWidget.updateServerStatus(true);
            this.waitingRoomWidget.updateGameStatus('서버 연결됨 - 세션 생성 중...');
            await this.createGameSession();
        });

        this.sdk.on('disconnected', () => {
            this.state.connected = false;
            this.waitingRoomWidget.updateServerStatus(false);
            this.waitingRoomWidget.updateGameStatus('서버 연결 끊김');
        });

        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            this.state.sessionCode = session.sessionCode;

            if (this.gameMode === 'mass-competitive') {
                this.waitingRoomWidget.displayMassSessionInfo(session);
                this.waitingRoomWidget.updateGameStatus('플레이어 연결 대기 중...');
            } else {
                this.waitingRoomWidget.displaySessionInfo(session);
                this.waitingRoomWidget.updateGameStatus('센서 연결 대기 중...');
            }
        });

        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            console.log('🔍 센서 연결됨:', data);

            if (this.gameMode === 'solo') {
                this.state.sensorConnected = true;
                this.waitingRoomWidget.updateSensorStatus(true);
                this.waitingRoomWidget.updateGameStatus('센서 연결됨 - 게임 준비 완료');
                this.waitingRoomWidget.hideSessionPanel();
                this.startGame();

            } else if (this.gameMode === 'coop' || this.gameMode === 'competitive') {
                const sensorId = data.sensorId || 'sensor1';

                if (sensorId === 'sensor1') {
                    this.state.sensor1Connected = true;
                    this.waitingRoomWidget.updateSensor1Status(true);
                } else if (sensorId === 'sensor2') {
                    this.state.sensor2Connected = true;
                    this.waitingRoomWidget.updateSensor2Status(true);
                }

                if (this.state.sensor1Connected && this.state.sensor2Connected) {
                    this.waitingRoomWidget.updateGameStatus('모든 센서 연결됨 - 게임 준비 완료');
                    this.waitingRoomWidget.hideSessionPanel();
                    this.startGame();
                } else {
                    const connectedCount = (this.state.sensor1Connected ? 1 : 0) + (this.state.sensor2Connected ? 1 : 0);
                    this.waitingRoomWidget.updateGameStatus(`센서 연결됨 (${connectedCount}/2) - 추가 연결 대기 중...`);
                }

            } else if (this.gameMode === 'mass-competitive') {
                const playerId = data.sensorId;
                const totalConnected = data.connectedSensors || 1;

                // 대규모 경쟁 모드에서는 모든 플레이어를 동등하게 처리
                this.addMassPlayer(playerId, totalConnected - 1);
                this.waitingRoomWidget.updateMassWaitingList(this.massPlayers, null);
                this.waitingRoomWidget.updateMassPlayerCount(totalConnected);
                this.calculateMassCompetitiveTargetSettings();

                if (totalConnected >= 3) {
                    this.elements.massStartBtn.disabled = false;
                    this.waitingRoomWidget.updateGameStatus(`플레이어 대기 중 (${totalConnected}/8) - 시작 가능`);
                } else {
                    this.waitingRoomWidget.updateGameStatus(`플레이어 대기 중 (${totalConnected}/8) - 최소 3명 필요`);
                }
            }
        });

        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;

            if (this.gameMode === 'mass-competitive') {
                const disconnectedSensorId = data.sensorId;
                if (disconnectedSensorId && this.massPlayers.has(disconnectedSensorId)) {
                    const player = this.massPlayers.get(disconnectedSensorId);
                    console.log(`🎯 [대규모 경쟁] 플레이어 연결 해제: ${player.name}`);

                    player.isActive = false;

                    if (disconnectedSensorId === this.state.myPlayerId) {
                        this.state.sensorConnected = false;
                        this.waitingRoomWidget.updateSensorStatus(false);
                        this.waitingRoomWidget.updateGameStatus('센서 연결 끊김');
                        this.pauseGame();
                    }

                    this.waitingRoomWidget.updateMassWaitingList(this.massPlayers, null);
                    this.scorePanelWidget.updateMassLeaderboard(this.massPlayers, null);
                }
            } else {
                this.state.sensorConnected = false;
                this.waitingRoomWidget.updateSensorStatus(false);
                this.waitingRoomWidget.updateGameStatus('센서 연결 끊김');
                this.pauseGame();
            }
        });

        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.sensorManager.processSensorData(data, this.gameMode, this.massPlayers, null);
        });

        this.sdk.on('connection-error', (error) => {
            console.error('연결 오류:', error);
            this.waitingRoomWidget.updateGameStatus(`연결 오류: ${error.error}`);
        });
    }

    async createGameSession() {
        try {
            await this.sdk.createSession();
            console.log('✅ 게임 세션 생성 완료');
        } catch (error) {
            console.error('❌ 세션 생성 실패:', error);
            this.waitingRoomWidget.updateGameStatus(`세션 생성 실패: ${error.message}`);
        }
    }

    addMassPlayer(playerId, colorIndex) {
        if (this.massPlayers.has(playerId)) return;

        const player = new Player(
            playerId,
            `Player ${colorIndex + 1}`,
            this.playerColors[colorIndex % this.playerColors.length],
            this.canvas.width,
            this.canvas.height
        );

        this.massPlayers.set(playerId, player);
        console.log(`👤 대규모 경쟁 플레이어 추가: ${player.name} (${playerId})`);
        
        // 대규모 경쟁 모드에서는 모든 플레이어가 동등함
    }

    calculateMassCompetitiveTargetSettings() {
        if (this.gameMode !== 'mass-competitive') return;

        const playerCount = this.massPlayers.size;
        const massConfig = this.config.massCompetitive;

        const dynamicMaxTargets = Math.min(
            massConfig.baseTargets + (playerCount * massConfig.targetsPerPlayer),
            massConfig.maxTargetsLimit
        );

        const dynamicSpawnInterval = Math.max(
            massConfig.baseSpawnInterval - (playerCount * massConfig.spawnIntervalReduction),
            massConfig.minSpawnInterval
        );

        this.config.maxTargets = dynamicMaxTargets;
        this.config.targetSpawnInterval = dynamicSpawnInterval;

        console.log(`🎯 [대규모 경쟁] 표적 설정 업데이트: 플레이어 ${playerCount}명, 최대 표적 ${dynamicMaxTargets}개, 생성 간격 ${dynamicSpawnInterval}ms`);
    }

    startGame() {
        this.renderControlPanel('playing');
        this.state.playing = true;
        this.state.paused = false;

        if (this.gameMode === 'mass-competitive') {
            this.state.timeLeft = 120;
        } else {
            this.state.timeLeft = 180;
        }

        this.state.gameStartTime = Date.now();
        this.waitingRoomWidget.updateGameStatus('게임 진행 중...');
        this.lastTargetSpawn = Date.now();
        this.startTimer();

        // 🔊 게임 시작 사운드
        this.soundSystem.playGameStartSound();

        // 🎵 BGM 시작
        setTimeout(() => {
            this.soundSystem.startBGM();
        }, 1000); // 게임 시작 사운드가 끝난 후 BGM 시작

        console.log('🎯 Shot Target 게임 시작!');
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (this.state.playing && !this.state.paused) {
                this.state.timeLeft--;
                this.scorePanelWidget.updateTimerDisplay(this.state.timeLeft);

                if (this.state.timeLeft <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }

    endGame() {
        this.state.playing = false;

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.waitingRoomWidget.updateGameStatus('게임 종료!');

        // 🎵 BGM 중지
        this.soundSystem.stopBGM();

        // 🔊 게임 종료 사운드
        this.soundSystem.playGameEndSound();

        let resultMessage;

        if (this.gameMode === 'competitive') {
            const player1Score = this.scoringSystem.state.player1Score;
            const player2Score = this.scoringSystem.state.player2Score;

            let winner;
            if (player1Score > player2Score) {
                winner = '플레이어 1 승리!';
            } else if (player2Score > player1Score) {
                winner = '플레이어 2 승리!';
            } else {
                winner = '무승부!';
            }

            resultMessage = `⚔️ 경쟁 게임 종료!\n${winner}\n\n`;
            resultMessage += `플레이어 1: ${player1Score.toLocaleString()}점\n`;
            resultMessage += `플레이어 2: ${player2Score.toLocaleString()}점`;

        } else if (this.gameMode === 'mass-competitive') {
            resultMessage = this.scorePanelWidget.generateMassCompetitiveResults(this.massPlayers, null, this.state.totalTargetsCreated);

            setTimeout(() => {
                this.scorePanelWidget.showMassCompetitiveResultsModal(resultMessage);
            }, 1000);

            console.log('🎯 대규모 경쟁 게임 종료:', resultMessage);
            return;

        } else {
            resultMessage = `🎯 게임 종료!\n최종 점수: ${this.scoringSystem.state.score.toLocaleString()}점\n`;
            resultMessage += `적중: ${this.scoringSystem.state.hits}발, 빗나감: ${this.scoringSystem.state.misses}발\n`;
            resultMessage += `정확도: ${this.scoringSystem.getAccuracy()}%\n`;
            resultMessage += `최대 콤보: ${this.scoringSystem.state.maxCombo}`;
        }

        setTimeout(() => {
            alert(resultMessage);
        }, 1000);

        console.log('🎯 게임 종료:', resultMessage);
    }


    spawnTarget() {
        const maxTargets = this.config.maxTargets;
        if (this.targets.length >= maxTargets) return;

        const rand = Math.random();
        let targetType = 'large';
        if (rand < this.config.targetTypes.small.spawnChance) {
            targetType = 'small';
        } else if (rand < this.config.targetTypes.small.spawnChance + this.config.targetTypes.medium.spawnChance) {
            targetType = 'medium';
        }

        const typeConfig = this.config.targetTypes[targetType];
        const margin = typeConfig.radius + 50;
        const position = Utils.getRandomPosition(this.canvas.width, this.canvas.height, margin);

        const target = new Target(
            position.x,
            position.y,
            typeConfig.radius,
            typeConfig.points,
            typeConfig.color,
            targetType,
            this.gameMode
        );

        this.targets.push(target);

        if (this.gameMode === 'mass-competitive') {
            this.state.totalTargetsCreated++;
            if (this.elements.totalTargetsCreated) {
                this.elements.totalTargetsCreated.textContent = this.state.totalTargetsCreated;
            }
        }

        console.log(`🎯 새 표적 생성: ${targetType} (${typeConfig.points}pt) - 현재 ${this.targets.length}/${maxTargets}개`);
    }

    tryShoot() {
        const result = this.shootingSystem.tryShoot(
            this.targets,
            this.sensorManager.crosshair,
            this.sensorManager.crosshair2,
            this.gameMode,
            this.config.hitRadius,
            this.massPlayers,
            this.canvas.width,
            this.canvas.height,
            null
        );

        if (result) {
            this.shootTarget(result);
        }
    }

    shootTarget(result) {
        const { target, index, playerId, player, crosshair } = result;

        // 총알 생성
        const bullet = this.shootingSystem.shoot(
            target,
            index,
            playerId,
            crosshair,
            this.config.bulletSpeed,
            player ? player.color : null
        );

        // 표적 제거
        this.targets.splice(index, 1);

        // 점수 계산
        let points = target.points;

        if (this.gameMode === 'mass-competitive' && player) {
            points = player.updateScore(points, this.config.comboMultiplier);
            this.scorePanelWidget.updateMassLeaderboard(this.massPlayers, null);
        } else {
            points = this.scoringSystem.calculateScore(target, this.gameMode, playerId, this.config.comboMultiplier);
        }

        // 타격 효과
        this.shootingSystem.createHitEffect(target.x, target.y, points, target.color);
        this.scorePanelWidget.updateScore(this.scoringSystem, this.gameMode);

        // 🔊 표적 맞춤 사운드
        this.soundSystem.playHitSound(target.type);
        
        // 🔊 콤보 사운드 (콤보가 2 이상일 때)
        const comboCount = this.gameMode === 'mass-competitive' && player ? 
                          player.comboCount : this.scoringSystem.state.comboCount;
        if (comboCount >= 2) {
            this.soundSystem.playComboSound(comboCount);
        }

        console.log(`🎯 표적 명중! +${Math.floor(points)}pt`);
    }

    startGameLoop() {
        const loop = () => {
            this.update();
            this.render();
            this.gameLoop = requestAnimationFrame(loop);
        };

        loop();
    }

    update() {
        if (!this.state.playing || this.state.paused) return;

        const now = Date.now();

        // 센서 움직임 적용
        if (this.state.playing && !this.state.paused) {
            this.sensorManager.applySensorMovement(this.gameMode, this.canvas.width, this.canvas.height);
        }

        // 조준점 부드러운 이동
        this.sensorManager.updateCrosshairPosition(this.gameMode);

        // 조준점 위치를 DOM 요소에 반영
        this.elements.crosshair.style.left = this.sensorManager.crosshair.x + 'px';
        this.elements.crosshair.style.top = this.sensorManager.crosshair.y + 'px';

        // 새 표적 생성
        if (now - this.lastTargetSpawn > this.config.targetSpawnInterval) {
            this.spawnTarget();
            this.lastTargetSpawn = now;
        }

        // 표적 업데이트
        this.targets = this.targets.filter(target => {
            const isAlive = target.update(this.config.targetLifetime);
            if (!isAlive) {
                this.scoringSystem.miss();
                this.scorePanelWidget.updateScore(this.scoringSystem, this.gameMode);
                
                // 🔊 표적 놓침 사운드
                this.soundSystem.playMissSound();
                
                console.log('🎯 표적 소멸 - 콤보 리셋');
            }
            return isAlive;
        });

        // 총알 및 효과 업데이트
        this.shootingSystem.update();

        // 자동 발사 체크
        this.tryShoot();

        // 콤보 타임아웃 체크
        if (this.gameMode === 'competitive') {
            const comboReset = this.scoringSystem.checkComboTimeout(this.gameMode);
            if (comboReset) {
                this.scorePanelWidget.updateScore(this.scoringSystem, this.gameMode);
                console.log(`🎯 플레이어 ${comboReset.player} 콤보 리셋`);
            }
        } else if (this.gameMode === 'mass-competitive') {
            const comboTimeout = 3500;
            let leaderboardNeedsUpdate = false;

            for (const [playerId, player] of this.massPlayers.entries()) {
                if (player.combo > 0 && now - player.lastHitTime > comboTimeout) {
                    console.log(`🎯 [대규모 경쟁] ${player.name} 콤보 리셋 (${player.combo} -> 0)`);
                    player.resetCombo();
                    leaderboardNeedsUpdate = true;
                }
            }

            if (leaderboardNeedsUpdate) {
                this.scorePanelWidget.updateMassLeaderboard(this.massPlayers, null);
            }
        }
    }

    render() {
        // 배경 클리어
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 표적 렌더링
        this.targets.forEach(target => {
            target.render(this.ctx);
        });

        // 총알 및 효과 렌더링
        this.shootingSystem.render(this.ctx, this.gameMode);

        // 협동 모드에서 중앙 경계선 렌더링
        if (this.gameMode === 'coop') {
            this.renderCenterDivider();
        }

        // 협동/경쟁 모드에서 두 번째 조준점 렌더링
        if (this.gameMode === 'coop' || this.gameMode === 'competitive') {
            this.renderSecondCrosshair();
        }

        // 대규모 경쟁 모드에서 다른 플레이어들의 조준점 렌더링
        if (this.gameMode === 'mass-competitive') {
            this.renderMassCompetitiveCrosshairs();
        }
    }

    renderCenterDivider() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    renderSecondCrosshair() {
        this.ctx.beginPath();
        this.ctx.arc(this.sensorManager.crosshair2.x, this.sensorManager.crosshair2.y, 15, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(this.sensorManager.crosshair2.x - 10, this.sensorManager.crosshair2.y);
        this.ctx.lineTo(this.sensorManager.crosshair2.x + 10, this.sensorManager.crosshair2.y);
        this.ctx.moveTo(this.sensorManager.crosshair2.x, this.sensorManager.crosshair2.y - 10);
        this.ctx.lineTo(this.sensorManager.crosshair2.x, this.sensorManager.crosshair2.y + 10);
        this.ctx.stroke();
    }

    renderMassCompetitiveCrosshairs() {
        this.massPlayers.forEach((player, playerId) => {
            if (!player.isActive) return;

            const crosshairX = this.sensorManager.calculatePlayerCrosshairX(player, this.canvas.width);
            const crosshairY = this.sensorManager.calculatePlayerCrosshairY(player, this.canvas.height);

            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.arc(crosshairX, crosshairY, 12, 0, Math.PI * 2);
            this.ctx.strokeStyle = player.color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(crosshairX - 8, crosshairY);
            this.ctx.lineTo(crosshairX + 8, crosshairY);
            this.ctx.moveTo(crosshairX, crosshairY - 8);
            this.ctx.lineTo(crosshairX, crosshairY + 8);
            this.ctx.stroke();

            this.ctx.globalAlpha = 1;
        });
    }

    pauseGame() {
        this.state.paused = true;
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.textContent = '▶️ 계속';
        this.waitingRoomWidget.updateGameStatus('게임 일시정지');
        
        // 🎵 일시정지 시 BGM 중지
        this.soundSystem.stopBGM();
    }

    resumeGame() {
        this.state.paused = false;
        const pauseBtn = document.getElementById('pauseBtn'); // 버튼을 다시 찾습니다.
        if (pauseBtn) pauseBtn.textContent = '⏸️ 일시정지';
        this.waitingRoomWidget.updateGameStatus('게임 진행 중...');
        
        // 🎵 재개 시 BGM 다시 시작
        this.soundSystem.startBGM();
    }

    togglePause() {
        if (this.state.paused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    resetGame() {
        this.scoringSystem.reset(this.gameMode);

        this.state.timeLeft = 120;

        this.targets = [];
        this.shootingSystem.reset();

        // 🎵 BGM 중지 (게임 리셋 시)
        this.soundSystem.stopBGM();

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.sensorManager.reset(this.canvas.width, this.canvas.height);
        this.scorePanelWidget.updateScore(this.scoringSystem, this.gameMode);
        this.scorePanelWidget.updateTimerDisplay(this.state.timeLeft);

        const canRestart = this.gameMode === 'solo' ?
            this.state.sensorConnected :
            (this.state.sensor1Connected && this.state.sensor2Connected);

        if (canRestart) {
            this.startGame();
        }
    }

    startMassCompetitive() {
        if (this.massPlayers.size >= 3) {
            this.calculateMassCompetitiveTargetSettings();
            this.waitingRoomWidget.hideMassWaitingPanel();
            this.startGame();
        }
    }

    closeMassCompetitiveResultModal() {
        this.scorePanelWidget.closeMassCompetitiveResultModal();
        this.resetGame();
    }

    // 정리 함수
    cleanup() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (this.sdk && typeof this.sdk.cleanup === 'function') {
            this.sdk.cleanup();
        }

        // 🔊 사운드 시스템 정리
        this.soundSystem.cleanup();
    }
}