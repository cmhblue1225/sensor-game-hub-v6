// Shot Target Game Class
class ShotTargetGame {
    constructor() {
        // 게임 모드 (초기값: null, 선택 후 설정)
        this.gameMode = null; // 'solo', 'coop', 'competitive', 'mass-competitive'
        this.sdk = null;
        
        // 게임 요소
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 게임 상태
        this.state = {
            connected: false,
            sensorConnected: false,
            sensor1Connected: false,  // dual 모드용
            sensor2Connected: false,  // dual 모드용
            playing: false,
            paused: false,
            score: 0,
            hits: 0,
            misses: 0,
            comboCount: 0,
            maxCombo: 0,
            sessionCode: null,
            timeLeft: 180,  // 3분 = 180초
            gameStartTime: null,
            // 경쟁 모드용 개별 점수
            player1Score: 0,
            player2Score: 0,
            player1Hits: 0,
            player2Hits: 0,
            player1Combo: 0,
            player2Combo: 0,
            player1LastHitTime: 0,
            player2LastHitTime: 0,
            // 대규모 경쟁 모드용
            totalTargetsCreated: 0
        };
        
        // 대규모 경쟁 모드용 플레이어 관리
        this.massPlayers = new Map(); // playerId -> player data
        this.playerColors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
            '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
        ];
        
        // 조준 시스템 (dual 모드용으로 확장)
        this.crosshair = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            smoothing: 0.2  // 기본값 (다른 모드용)
        };
        
        // 대규모 경쟁 모드 전용 조준점 설정
        this.massCompetitiveCrosshair = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            smoothing: 0.25  // ✅ 대규모 경쟁 모드 전용: 더 반응적인 움직임
        };
        
        // dual 모드용 두 번째 조준점
        this.crosshair2 = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            smoothing: 0.1
        };
        
        // 표적 시스템
        this.targets = [];
        this.bullets = [];
        this.effects = [];
        
        // 센서 데이터 (dual 모드용으로 확장)
        this.sensorData = {
            sensor1: { tilt: { x: 0, y: 0 } },  // solo 및 dual의 첫 번째 센서
            sensor2: { tilt: { x: 0, y: 0 } }   // dual의 두 번째 센서
        };
        
        // 게임 설정
        this.config = {
            targetTypes: {
                large: { radius: 60, points: 100, color: '#ef4444', spawnChance: 0.4 },
                medium: { radius: 40, points: 200, color: '#f59e0b', spawnChance: 0.4 },
                small: { radius: 25, points: 500, color: '#10b981', spawnChance: 0.2 }
            },
            targetLifetime: 5000,  // 5초 후 자동 소멸
            targetSpawnInterval: 2000,  // 2초마다 새 표적 생성
            hitRadius: 15,  // 조준점이 표적 중심에서 이 거리 내에 있으면 발사
            comboMultiplier: 1.5,
            bulletSpeed: 8,
            maxTargets: 3  // 최대 동시 표적 수
        };
        
        // DOM 요소
        this.elements = {
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
            // 대규모 경쟁 모드용 요소들
            massCompetitivePanel: document.getElementById('massCompetitivePanel'),
            massCompetitiveTimerValue: document.getElementById('massCompetitiveTimerValue'),
            massPlayerCount: document.getElementById('massPlayerCount'),
            totalTargetsCreated: document.getElementById('totalTargetsCreated'),
            massLeaderboard: document.getElementById('massLeaderboard'),
            massWaitingPanel: document.getElementById('massWaitingPanel'),
            massSessionCode: document.getElementById('massSessionCode'),
            massQrContainer: document.getElementById('massQrContainer'),
            massWaitingList: document.getElementById('massWaitingList'),
            massWaitingPlayers: document.getElementById('massWaitingPlayers'),
            massStartBtn: document.getElementById('massStartBtn'),
            // 컨트롤 패널 요소 추가
            controlPanel: document.querySelector('.control-panel')
        };
        
        this.gameLoop = null;
        this.lastTargetSpawn = 0;
        this.timerInterval = null;
        
        this.initializeGame();
    }
    
    async initializeGame() {
        console.log('🎯 Shot Target Game 초기화');
        
        this.setupCanvas();
        this.setupModeSelection();  // 게임 모드 선택 설정
        this.setupKeyboardControls();  // 키보드 테스트용
        this.startGameLoop();
        this.updateGameStatus('게임 모드를 선택하세요');
    }
    
    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        
        window.addEventListener('resize', resize);
        resize();
    }
    
    setupModeSelection() {
        // 싱글 플레이 모드 선택
        this.elements.soloModeBtn.addEventListener('click', () => {
            this.selectGameMode('solo');
        });
        
        // 협동 플레이 모드 선택  
        this.elements.coopModeBtn.addEventListener('click', () => {
            this.selectGameMode('coop');
        });
        
        // 경쟁 플레이 모드 선택
        this.elements.competitiveModeBtn.addEventListener('click', () => {
            this.selectGameMode('competitive');
        });
        
        // 대규모 경쟁 모드 선택
        this.elements.massCompetitiveModeBtn.addEventListener('click', () => {
            this.selectGameMode('mass-competitive');
        });
    }
    
    async selectGameMode(mode) {
        console.log(`🎯 게임 모드 선택: ${mode}`);
        this.gameMode = mode;
        
        // ✅ 필수 패턴: AI_ASSISTANT_PROMPTS.md 지침에 따라 SessionSDK 초기화
        // 대규모 경쟁 모드는 multi로, 나머지는 기존 방식 유지
        let sdkGameType;
        if (mode === 'solo') {
            sdkGameType = 'solo';
        } else if (mode === 'mass-competitive') {
            sdkGameType = 'multi';  // ✅ 3-8명 지원을 위해 multi 타입 사용
        } else {
            sdkGameType = 'dual';   // coop, competitive는 기존대로 dual
        }
        
        this.sdk = new SessionSDK({
            gameId: 'shot-target',
            gameType: sdkGameType,  // ✅ 선택된 모드로 설정
            debug: true
        });
        
        // 모드 선택 패널 숨기기
        this.elements.modeSelectionPanel.classList.add('hidden');
        
        // 모드에 따른 UI 설정
        this.setupModeUI(mode);
        
        // SDK 이벤트 설정
        this.setupSDKEvents();
        
        // 세션 패널 또는 대기실 패널 표시
        if (mode === 'mass-competitive') {
            this.elements.massWaitingPanel.classList.remove('hidden');
        } else {
            this.elements.sessionPanel.classList.remove('hidden');
        }
        
        this.updateGameStatus('서버 연결 중...');
    }
    
    setupModeUI(mode) {
        if (mode === 'solo') {
            // 싱글 모드 UI
            this.elements.sessionTitle.textContent = '🎯 Shot Target - 싱글 플레이';
            this.elements.sessionInstructions.innerHTML = 
                '모바일 센서로 조준하여 표적을 맞추는 게임!<br>' +
                '조준점을 표적 중앙에 맞추면 자동으로 발사됩니다.<br>' +
                '아래 코드를 모바일에서 입력하거나 QR 코드를 스캔하세요.';
            
            // ✅ 컨트롤 패널을 기본 위치로 복원
            this.elements.controlPanel.classList.remove('mass-competitive-mode');
            
            // solo 모드 센서 상태 표시
            this.elements.soloSensorStatus.classList.remove('hidden');
            this.elements.dualSensorStatus.classList.add('hidden');
            this.elements.dualSensorStatus2.classList.add('hidden');
            
            // 점수 패널 설정
            this.elements.normalScorePanel.classList.remove('hidden');
            this.elements.competitiveScorePanel.classList.add('hidden');
            
        } else if (mode === 'coop') {
            // 협동 모드 UI (기존 dual 코드 활용)
            this.elements.sessionTitle.textContent = '🤝 Shot Target - 협동 플레이';
            this.elements.sessionInstructions.innerHTML = 
                '2명이 협력하는 표적 맞추기 게임!<br>' +
                '각자 화면 절반에서 조준하여 함께 점수를 얻어보세요.<br>' +
                '아래 코드를 두 개의 모바일에서 입력하거나 QR 코드를 스캔하세요.';
            
            // ✅ 컨트롤 패널을 기본 위치로 복원
            this.elements.controlPanel.classList.remove('mass-competitive-mode');
            
            // dual 모드 센서 상태 표시
            this.elements.soloSensorStatus.classList.add('hidden');
            this.elements.dualSensorStatus.classList.remove('hidden');
            this.elements.dualSensorStatus2.classList.remove('hidden');
            
            // 점수 패널 설정
            this.elements.normalScorePanel.classList.remove('hidden');
            this.elements.competitiveScorePanel.classList.add('hidden');
            
        } else if (mode === 'competitive') {
            // 경쟁 모드 UI
            this.elements.sessionTitle.textContent = '⚔️ Shot Target - 경쟁 플레이';
            this.elements.sessionInstructions.innerHTML = 
                '2명이 경쟁하는 표적 맞추기 게임!<br>' +
                '각자 모바일로 조준하여 더 높은 점수를 얻어보세요.<br>' +
                '아래 코드를 두 개의 모바일에서 입력하거나 QR 코드를 스캔하세요.';
            
            // ✅ 컨트롤 패널을 기본 위치로 복원
            this.elements.controlPanel.classList.remove('mass-competitive-mode');
            
            // dual 모드 센서 상태 표시
            this.elements.soloSensorStatus.classList.add('hidden');
            this.elements.dualSensorStatus.classList.remove('hidden');
            this.elements.dualSensorStatus2.classList.remove('hidden');
            
            // 경쟁 모드 점수 패널 설정
            this.elements.normalScorePanel.classList.add('hidden');
            this.elements.competitiveScorePanel.classList.remove('hidden');
            
        } else if (mode === 'mass-competitive') {
            // 대규모 경쟁 모드 UI
            // 대기실 패널은 이미 표시되므로 추가 설정 없음
            
            // ✅ 컨트롤 패널을 오른쪽 아래 세로 배치로 변경
            this.elements.controlPanel.classList.add('mass-competitive-mode');
            
            // 다른 패널들 숨기기
            this.elements.soloSensorStatus.classList.add('hidden');
            this.elements.dualSensorStatus.classList.add('hidden');
            this.elements.dualSensorStatus2.classList.add('hidden');
            this.elements.normalScorePanel.classList.add('hidden');
            this.elements.competitiveScorePanel.classList.add('hidden');
        }
    }
    
    setupSDKEvents() {
        // ✅ 필수 패턴: 연결 완료 후 세션 생성
        this.sdk.on('connected', async () => {
            this.state.connected = true;
            this.updateServerStatus(true);
            this.updateGameStatus('서버 연결됨 - 세션 생성 중...');
            
            // 서버 연결 완료 후 세션 생성
            await this.createGameSession();
        });
        
        this.sdk.on('disconnected', () => {
            this.state.connected = false;
            this.updateServerStatus(false);
            this.updateGameStatus('서버 연결 끊김');
        });
        
        // ✅ 필수 패턴: CustomEvent 처리
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;  // ✅ 중요!
            this.state.sessionCode = session.sessionCode;
            
            if (this.gameMode === 'mass-competitive') {
                this.displayMassSessionInfo(session);
                this.updateGameStatus('플레이어 연결 대기 중...');
            } else {
                this.displaySessionInfo(session);
                this.updateGameStatus('센서 연결 대기 중...');
            }
        });
        
        // 센서 연결 (AI_ASSISTANT_PROMPTS.md 지침: data.sensorId로 구분)
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;  // ✅ 중요!
            console.log('🔍 센서 연결됨:', data);
            
            if (this.gameMode === 'solo') {
                this.state.sensorConnected = true;
                this.updateSensorStatus(true);
                this.updateGameStatus('센서 연결됨 - 게임 준비 완료');
                
                // 세션 패널 숨기고 게임 시작
                this.hideSessionPanel();
                this.startGame();
                
            } else if (this.gameMode === 'coop' || this.gameMode === 'competitive') {
                // dual 모드에서는 sensorId로 구분
                const sensorId = data.sensorId || 'sensor1';  // 기본값 설정
                
                if (sensorId === 'sensor1') {
                    this.state.sensor1Connected = true;
                    this.updateSensor1Status(true);
                } else if (sensorId === 'sensor2') {
                    this.state.sensor2Connected = true;
                    this.updateSensor2Status(true);
                }
                
                // 두 센서 모두 연결되면 게임 시작
                if (this.state.sensor1Connected && this.state.sensor2Connected) {
                    this.updateGameStatus('모든 센서 연결됨 - 게임 준비 완료');
                    this.hideSessionPanel();
                    this.startGame();
                } else {
                    const connectedCount = (this.state.sensor1Connected ? 1 : 0) + (this.state.sensor2Connected ? 1 : 0);
                    this.updateGameStatus(`센서 연결됨 (${connectedCount}/2) - 추가 연결 대기 중...`);
                }
                
            } else if (this.gameMode === 'mass-competitive') {
                // ✅ 대규모 경쟁 모드: 멀티플레이어 센서 연결 처리
                const playerId = data.sensorId;
                const totalConnected = data.connectedSensors || 1;

                // 플레이어 추가
                this.addMassPlayer(playerId, totalConnected - 1);
                this.updateMassWaitingList();
                this.updateMassPlayerCount(totalConnected);

                // 3명 이상이면 게임 시작 가능
                if (totalConnected >= 3) {
                    this.elements.massStartBtn.disabled = false;
                    this.updateGameStatus(`플레이어 대기 중 (${totalConnected}/8) - 시작 가능`);
                } else {
                    this.updateGameStatus(`플레이어 대기 중 (${totalConnected}/8) - 최소 3명 필요`);
                }
            }
        });
        
        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;  // ✅ CustomEvent 처리
            
            if (this.gameMode === 'mass-competitive') {
                // ✅ 대규모 경쟁 모드: 특정 플레이어 연결 해제 처리
                const disconnectedSensorId = data.sensorId;
                if (disconnectedSensorId && this.massPlayers.has(disconnectedSensorId)) {
                    const player = this.massPlayers.get(disconnectedSensorId);
                    console.log(`🎯 [대규모 경쟁] 플레이어 연결 해제: ${player.name}`);
                    
                    // 플레이어를 비활성화 (완전 제거하지 않고 점수는 유지)
                    player.isActive = false;
                    
                    // 대기실 및 리더보드 업데이트
                    this.updateMassWaitingList();
                    this.updateMassLeaderboard();
                }
            } else {
                // 기존 모드들의 연결 해제 처리
                this.state.sensorConnected = false;
                this.updateSensorStatus(false);
                this.updateGameStatus('센서 연결 끊김');
                this.pauseGame();
            }
        });
        
        // ✅ 필수 패턴: 센서 데이터 처리 (AI_ASSISTANT_PROMPTS.md 지침에 따라)
        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;  // ✅ 중요!
            this.processSensorData(data);
        });
        
        // 오류 처리
        this.sdk.on('connection-error', (error) => {
            console.error('연결 오류:', error);
            this.updateGameStatus(`연결 오류: ${error.error}`);
        });
    }
    
    // ✅ 키보드 테스트 지원
    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            if (!this.state.playing || this.state.paused) return;
            
            const moveSpeed = 20;
            switch(e.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    this.crosshair.targetX = Math.max(0, this.crosshair.targetX - moveSpeed);
                    break;
                case 'd':
                case 'arrowright':
                    this.crosshair.targetX = Math.min(this.canvas.width, this.crosshair.targetX + moveSpeed);
                    break;
                case 'w':
                case 'arrowup':
                    this.crosshair.targetY = Math.max(0, this.crosshair.targetY - moveSpeed);
                    break;
                case 's':
                case 'arrowdown':
                    this.crosshair.targetY = Math.min(this.canvas.height, this.crosshair.targetY + moveSpeed);
                    break;
                case ' ':
                    e.preventDefault();
                    this.tryShoot();
                    break;
            }
        });
    }
    
    async createGameSession() {
        try {
            await this.sdk.createSession();
            console.log('✅ 게임 세션 생성 완료');
        } catch (error) {
            console.error('❌ 세션 생성 실패:', error);
            this.updateGameStatus(`세션 생성 실패: ${error.message}`);
        }
    }
    
    async displaySessionInfo(session) {
        this.elements.sessionCode.textContent = session.sessionCode || '----';
        
        // ✅ QR 코드 폴백 처리 (AI_ASSISTANT_PROMPTS.md 지침에 따라)
        const sensorUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
        
        try {
            if (typeof QRCode !== 'undefined') {
                // QRCode 라이브러리 사용
                const canvas = document.createElement('canvas');
                await new Promise((resolve, reject) => {
                    QRCode.toCanvas(canvas, sensorUrl, { width: 200 }, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
                this.elements.qrContainer.innerHTML = '';
                this.elements.qrContainer.appendChild(canvas);
            } else {
                // 폴백: 외부 API 사용
                const img = document.createElement('img');
                img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sensorUrl)}`;
                img.alt = 'QR Code';
                img.style.width = '200px';
                img.style.height = '200px';
                this.elements.qrContainer.innerHTML = '';
                this.elements.qrContainer.appendChild(img);
            }
        } catch (error) {
            console.error('QR 코드 생성 실패:', error);
            this.elements.qrContainer.innerHTML = `<p>QR 코드: ${sensorUrl}</p>`;
        }
    }
    
    hideSessionPanel() {
        this.elements.sessionPanel.classList.add('hidden');
        this.elements.gameInfoPanel.classList.remove('hidden');
    }
    
    processSensorData(data) {
        const sensorData = data.data;
        const sensorId = data.sensorId || 'sensor';  // solo 모드 기본값
        
        // 기울기 데이터로 조준점 이동
        if (sensorData.orientation) {
            if (this.gameMode === 'solo' || sensorId === 'sensor1') {
                // solo 모드 또는 dual 모드의 첫 번째 센서
                this.sensorData.sensor1.tilt.x = sensorData.orientation.beta || 0;
                this.sensorData.sensor1.tilt.y = sensorData.orientation.gamma || 0;
                
            } else if ((this.gameMode === 'coop' || this.gameMode === 'competitive') && sensorId === 'sensor2') {
                // dual 모드(협동/경쟁)의 두 번째 센서
                this.sensorData.sensor2.tilt.x = sensorData.orientation.beta || 0;
                this.sensorData.sensor2.tilt.y = sensorData.orientation.gamma || 0;
                
            } else if (this.gameMode === 'mass-competitive') {
                // ✅ 대규모 경쟁 모드: 각 플레이어의 센서 데이터 처리
                const player = this.massPlayers.get(sensorId);
                if (player) {
                    // ✅ 대규모 경쟁 모드 전용 센서 throttling 최적화 (부드러운 움직임을 위해)
                    const now = Date.now();
                    if (!player.lastSensorUpdate) player.lastSensorUpdate = 0;
                    if (now - player.lastSensorUpdate < 16) return;  // 60fps = 16ms 간격으로 개선
                    player.lastSensorUpdate = now;
                    
                    // 플레이어 조준점 위치 업데이트
                    player.tilt = {
                        x: sensorData.orientation.beta || 0,
                        y: sensorData.orientation.gamma || 0
                    };
                                        
                    player.lastActivity = now;
                }
            }
            
            // 게임 로직 적용
            if (this.state.playing && !this.state.paused) {
                this.applySensorMovement();
            }
        }
    }
    
    applySensorMovement() {
        // 센서 이동 범위를 전체 화면으로 확장 (요청사항)
        const sensitivity = 15;  // 센서 감도
        const maxTilt = 25;      // 최대 기울기 각도 (더 민감하게 조정)
        
        if (this.gameMode === 'solo') {
            // 싱글 모드: 첫 번째 센서만 사용
            const normalizedTiltX = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.y / maxTilt));
            const normalizedTiltY = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.x / maxTilt));
            
            // 조준점 목표 위치 계산 (전체 화면 범위로 확장)
            this.crosshair.targetX = this.canvas.width / 2 + (normalizedTiltX * this.canvas.width / 2);
            this.crosshair.targetY = this.canvas.height / 2 + (normalizedTiltY * this.canvas.height / 2);
            
            // 화면 경계 제한
            this.crosshair.targetX = Math.max(0, Math.min(this.canvas.width, this.crosshair.targetX));
            this.crosshair.targetY = Math.max(0, Math.min(this.canvas.height, this.crosshair.targetY));
            
        } else if (this.gameMode === 'coop') {
            // 협동 모드: 화면 좌우 분할 (기존 dual 코드)
            
            // 첫 번째 센서 (좌측 플레이어)
            const normalizedTiltX1 = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.y / maxTilt));
            const normalizedTiltY1 = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.x / maxTilt));
            
            this.crosshair.targetX = this.canvas.width / 4 + (normalizedTiltX1 * this.canvas.width / 4);
            this.crosshair.targetY = this.canvas.height / 2 + (normalizedTiltY1 * this.canvas.height / 2);
            
            // 화면 경계 제한 (좌측 절반)
            this.crosshair.targetX = Math.max(0, Math.min(this.canvas.width / 2, this.crosshair.targetX));
            this.crosshair.targetY = Math.max(0, Math.min(this.canvas.height, this.crosshair.targetY));
            
            // 두 번째 센서 (우측 플레이어)
            const normalizedTiltX2 = Math.max(-1, Math.min(1, this.sensorData.sensor2.tilt.y / maxTilt));
            const normalizedTiltY2 = Math.max(-1, Math.min(1, this.sensorData.sensor2.tilt.x / maxTilt));
            
            this.crosshair2.targetX = this.canvas.width * 3/4 + (normalizedTiltX2 * this.canvas.width / 4);
            this.crosshair2.targetY = this.canvas.height / 2 + (normalizedTiltY2 * this.canvas.height / 2);
            
            // 화면 경계 제한 (우측 절반)
            this.crosshair2.targetX = Math.max(this.canvas.width / 2, Math.min(this.canvas.width, this.crosshair2.targetX));
            this.crosshair2.targetY = Math.max(0, Math.min(this.canvas.height, this.crosshair2.targetY));
            
        } else if (this.gameMode === 'competitive') {
            // 경쟁 모드: 두 센서 모두 전체 화면 범위
            
            // 첫 번째 센서 (전체 화면)
            const normalizedTiltX1 = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.y / maxTilt));
            const normalizedTiltY1 = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.x / maxTilt));
            
            this.crosshair.targetX = this.canvas.width / 2 + (normalizedTiltX1 * this.canvas.width / 2);
            this.crosshair.targetY = this.canvas.height / 2 + (normalizedTiltY1 * this.canvas.height / 2);
            
            // 화면 경계 제한 (전체 화면)
            this.crosshair.targetX = Math.max(0, Math.min(this.canvas.width, this.crosshair.targetX));
            this.crosshair.targetY = Math.max(0, Math.min(this.canvas.height, this.crosshair.targetY));
            
            // 두 번째 센서 (전체 화면)
            const normalizedTiltX2 = Math.max(-1, Math.min(1, this.sensorData.sensor2.tilt.y / maxTilt));
            const normalizedTiltY2 = Math.max(-1, Math.min(1, this.sensorData.sensor2.tilt.x / maxTilt));
            
            this.crosshair2.targetX = this.canvas.width / 2 + (normalizedTiltX2 * this.canvas.width / 2);
            this.crosshair2.targetY = this.canvas.height / 2 + (normalizedTiltY2 * this.canvas.height / 2);
            
            // 화면 경계 제한 (전체 화면)
            this.crosshair2.targetX = Math.max(0, Math.min(this.canvas.width, this.crosshair2.targetX));
            this.crosshair2.targetY = Math.max(0, Math.min(this.canvas.height, this.crosshair2.targetY));
            
        } else if (this.gameMode === 'mass-competitive') {
            // ✅ 대규모 경쟁 모드: 모든 플레이어의 조준점 움직임 처리
            this.massPlayers.forEach(player => {
                if (player.tilt) {
                    const normalizedTiltX = Math.max(-1, Math.min(1, player.tilt.y / maxTilt));
                    const normalizedTiltY = Math.max(-1, Math.min(1, player.tilt.x / maxTilt));

                    // 조준점 목표 위치 계산 (전체 화면 범위)
                    player.targetX = this.canvas.width / 2 + (normalizedTiltX * this.canvas.width / 2);
                    player.targetY = this.canvas.height / 2 + (normalizedTiltY * this.canvas.height / 2);

                    // 화면 경계 제한
                    player.targetX = Math.max(0, Math.min(this.canvas.width, player.targetX));
                    player.targetY = Math.max(0, Math.min(this.canvas.height, player.targetY));
                }
            });
        }
    }
    
    startGame() {
        this.state.playing = true;
        this.state.paused = false;
        this.state.timeLeft = 180;  // 3분 = 180초
        this.state.gameStartTime = Date.now();
        this.updateGameStatus('게임 진행 중...');
        this.lastTargetSpawn = Date.now();
        
        // 타이머 시작 (3분 게임 시간)
        this.startTimer();
        
        console.log('🎯 Shot Target 게임 시작!');
    }
    
    startTimer() {
        // 기존 타이머 정리
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (this.state.playing && !this.state.paused) {
                this.state.timeLeft--;
                this.updateTimerDisplay();
                
                // 시간 종료 시 게임 끝
                if (this.state.timeLeft <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.state.timeLeft / 60);
        const seconds = this.state.timeLeft % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.elements.timerValue.textContent = timeString;
        
        // 시간이 30초 이하일 때 빨간색으로 표시
        if (this.state.timeLeft <= 30) {
            this.elements.timerValue.style.color = 'var(--error)';
        } else {
            this.elements.timerValue.style.color = 'var(--warning)';
        }
    }
    
    endGame() {
        this.state.playing = false;
        
        // 타이머 정리
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.updateGameStatus('게임 종료!');
        
        // 게임 결과 표시
        let resultMessage;
        
        if (this.gameMode === 'competitive') {
            // 경쟁 모드: 승부 결과 표시
            const player1Score = this.state.player1Score;
            const player2Score = this.state.player2Score;
            
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
            
        } else {
            // 싱글/협동 모드: 기존 결과 표시
            resultMessage = `🎯 게임 종료!\n최종 점수: ${this.state.score.toLocaleString()}점\n`;
            resultMessage += `적중: ${this.state.hits}발, 빗나감: ${this.state.misses}발\n`;
            resultMessage += `정확도: ${this.getAccuracy()}%\n`;
            resultMessage += `최대 콤보: ${this.state.maxCombo}`;
        }
        
        setTimeout(() => {
            alert(resultMessage);
        }, 1000);
        
        console.log('🎯 게임 종료:', resultMessage);
    }
    
    getAccuracy() {
        const total = this.state.hits + this.state.misses;
        return total > 0 ? ((this.state.hits / total) * 100).toFixed(1) : 100;
    }
    
    pauseGame() {
        this.state.paused = true;
        this.elements.pauseBtn.textContent = '▶️ 계속';
        this.updateGameStatus('게임 일시정지');
    }
    
    resumeGame() {
        this.state.paused = false;
        this.elements.pauseBtn.textContent = '⏸️ 일시정지';
        this.updateGameStatus('게임 진행 중...');
    }
    
    togglePause() {
        if (this.state.paused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }
    
    resetGame() {
        this.state.score = 0;
        this.state.hits = 0;
        this.state.misses = 0;
        this.state.comboCount = 0;
        this.state.maxCombo = 0;
        this.state.timeLeft = 180;  // 3분으로 리셋
        
        // 경쟁 모드 점수 초기화
        this.state.player1Score = 0;
        this.state.player2Score = 0;
        this.state.player1Hits = 0;
        this.state.player2Hits = 0;
        this.state.player1Combo = 0;
        this.state.player2Combo = 0;
        this.state.player1LastHitTime = 0;
        this.state.player2LastHitTime = 0;
        
        this.targets = [];
        this.bullets = [];
        this.effects = [];
        
        // 타이머 정리
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.crosshair2.x = this.canvas.width / 2;
        this.crosshair2.y = this.canvas.height / 2;
        this.crosshair2.targetX = this.crosshair2.x;
        this.crosshair2.targetY = this.crosshair2.y;
        
        this.updateScore();
        this.updateTimerDisplay();
        
        // 게임 모드에 따른 재시작 조건 확인
        const canRestart = this.gameMode === 'solo' ? 
            this.state.sensorConnected : 
            (this.state.sensor1Connected && this.state.sensor2Connected);
            
        if (canRestart) {
            this.startGame();
        }
    }
    
    spawnTarget() {
        if (this.targets.length >= this.config.maxTargets) return;
        
        // 표적 타입 랜덤 선택
        const rand = Math.random();
        let targetType = 'large';
        if (rand < this.config.targetTypes.small.spawnChance) {
            targetType = 'small';
        } else if (rand < this.config.targetTypes.small.spawnChance + this.config.targetTypes.medium.spawnChance) {
            targetType = 'medium';
        }
        
        const typeConfig = this.config.targetTypes[targetType];
        
        // 랜덤 위치 생성 (화면 가장자리 제외)
        const margin = typeConfig.radius + 50;
        const x = margin + Math.random() * (this.canvas.width - margin * 2);
        const y = margin + Math.random() * (this.canvas.height - margin * 2);
        
        this.targets.push({
            x: x,
            y: y,
            radius: typeConfig.radius,
            points: typeConfig.points,
            color: typeConfig.color,
            type: targetType,
            spawnTime: Date.now(),
            alpha: 1
        });
        
        console.log(`🎯 새 표적 생성: ${targetType} (${typeConfig.points}pt)`);
    }
    
    tryShoot() {
        if (this.gameMode === 'mass-competitive') {
            // ✅ 대규모 경쟁 모드: 모든 플레이어의 표적 타격 처리
            const hitRadius = 15;  // 표적 명중 판정 반경
            
            // 모든 표적에 대해 검사
            for (let i = 0; i < this.targets.length; i++) {
                const target = this.targets[i];
                let targetHit = false;
                let hitPlayer = null;
                
                // 모든 활성 플레이어의 조준점 검사
                for (const [playerId, player] of this.massPlayers.entries()) {
                    if (!player.isActive || !player.tilt) continue;
                    
                    // 플레이어의 조준점 위치 계산
                    const crosshairX = this.calculatePlayerCrosshairX(player);
                    const crosshairY = this.calculatePlayerCrosshairY(player);
                    
                    // 표적과의 거리 계산
                    const dx = crosshairX - target.x;
                    const dy = crosshairY - target.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 표적 명중 체크
                    if (distance <= hitRadius) {
                        targetHit = true;
                        hitPlayer = player;
                        
                        // 디버그 로그
                        console.log(`🎯 [대규모 경쟁] ${player.name} 표적 명중! 거리: ${distance.toFixed(2)}`);
                        
                        // 표적 명중 처리
                        this.handleMassTargetHit(target, i, playerId);
                        
                        // 하나의 표적은 한 명만 맞출 수 있음
                        return;
                    }
                }
            }
            
        } else {
            // 기존 모드들 (solo, coop, competitive)
            
            // 첫 번째 조준점으로 표적 찾기
            for (let i = 0; i < this.targets.length; i++) {
                const target = this.targets[i];
                const dx = this.crosshair.x - target.x;
                const dy = this.crosshair.y - target.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 조준점이 표적의 히트존 내에 있으면 자동 발사
                if (distance <= this.config.hitRadius) {
                    this.shootTarget(target, i, 1);  // 플레이어 1
                    return;
                }
            }
            
            // 협동/경쟁 모드에서 두 번째 조준점도 확인
            if (this.gameMode === 'coop' || this.gameMode === 'competitive') {
                for (let i = 0; i < this.targets.length; i++) {
                    const target = this.targets[i];
                    const dx = this.crosshair2.x - target.x;
                    const dy = this.crosshair2.y - target.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 두 번째 조준점이 표적의 히트존 내에 있으면 자동 발사
                    if (distance <= this.config.hitRadius) {
                        this.shootTarget(target, i, 2);  // 플레이어 2
                        return;
                    }
                }
            }
        }
    }
    
    // 대규모 경쟁 모드용 플레이어별 조준점 위치 계산
    calculatePlayerCrosshairX(player) {
        const sensitivity = 15;
        const maxTilt = 25;
        const normalizedTiltX = Math.max(-1, Math.min(1, player.tilt.y / maxTilt));
        
        let crosshairX = this.canvas.width / 2 + (normalizedTiltX * this.canvas.width / 2);
        return Math.max(0, Math.min(this.canvas.width, crosshairX));
    }
    
    calculatePlayerCrosshairY(player) {
        const sensitivity = 15;
        const maxTilt = 25;
        const normalizedTiltY = Math.max(-1, Math.min(1, player.tilt.x / maxTilt));
        
        let crosshairY = this.canvas.height / 2 + (normalizedTiltY * this.canvas.height / 2);
        return Math.max(0, Math.min(this.canvas.height, crosshairY));
    }
    
    shootTarget(target, index, playerId = 1) {
        // 총알 생성 (플레이어에 따라 시작 위치 결정)
        const shooterX = playerId === 1 ? this.crosshair.x : this.crosshair2.x;
        const shooterY = playerId === 1 ? this.crosshair.y : this.crosshair2.y;
        
        this.bullets.push({
            x: shooterX,
            y: shooterY,
            targetX: target.x,
            targetY: target.y,
            speed: this.config.bulletSpeed,
            target: target,
            playerId: playerId  // 누가 발사했는지 기록
        });
        
        // 표적 제거
        this.targets.splice(index, 1);
        
        // 점수 계산 (모드별 처리)
        let points = target.points;  // 변수를 상위 스코프로 이동
        
        if (this.gameMode === 'competitive') {
            // 경쟁 모드: 플레이어별 개별 점수
            if (playerId === 1) {
                this.state.player1Hits++;
                this.state.player1Combo++;
                
                if (this.state.player1Combo > 1) {
                    const comboBonus = Math.min(this.state.player1Combo - 1, 2); // 콤보 보너스를 최대 3번(지수 2)까지 제한
                    points *= Math.pow(this.config.comboMultiplier, comboBonus);
                }
                this.state.player1Score += Math.floor(points);
                this.state.player1LastHitTime = Date.now(); // 마지막 타격 시간 기록
                
            } else if (playerId === 2) {
                this.state.player2Hits++;
                this.state.player2Combo++;
                
                if (this.state.player2Combo > 1) {
                    const comboBonus = Math.min(this.state.player2Combo - 1, 2); // 콤보 보너스를 최대 3번(지수 2)까지 제한
                    points *= Math.pow(this.config.comboMultiplier, comboBonus);
                }
                this.state.player2Score += Math.floor(points);
                this.state.player2LastHitTime = Date.now(); // 마지막 타격 시간 기록
            }
            
        } else if (this.gameMode === 'mass-competitive') {
            // ✅ 대규모 경쟁 모드: 플레이어별 점수 처리 (playerId를 통해 구분)
            // 이 함수는 handleMassTargetHit에서 직접 처리하므로 여기서는 내 플레이어만 처리
            if (this.massPlayers.has(playerId)) {
                const player = this.massPlayers.get(playerId);
                if (player) {
                    player.combo++;
                    player.hits++;
                    
                    if (player.combo > 1) {
                        const comboBonus = Math.min(player.combo - 1, 2);
                        points *= Math.pow(this.config.comboMultiplier, comboBonus);
                    }
                    
                    player.score += Math.floor(points);
                    player.lastHitTime = Date.now();
                    player.accuracy = Math.round((player.hits / (player.hits + 1)) * 100);
                    
                    // 리더보드 업데이트
                    this.updateMassLeaderboard();
                }
            }
            
        } else {
            // 싱글/협동 모드: 공통 점수
            this.state.hits++;
            this.state.comboCount++;
            
            if (this.state.comboCount > 1) {
                points *= Math.pow(this.config.comboMultiplier, this.state.comboCount - 1);
            }
            
            this.state.score += Math.floor(points);
            this.state.maxCombo = Math.max(this.state.maxCombo, this.state.comboCount);
        }
        
        // 타격 효과
        this.createHitEffect(target.x, target.y, points, target.color);
        
        this.updateScore();
        console.log(`🎯 표적 명중! +${Math.floor(points)}pt (콤보 x${this.state.comboCount})`);
    }
    
    createHitEffect(x, y, points, color) {
        // 타격 원형 효과
        this.effects.push({
            type: 'hit',
            x: x,
            y: y,
            radius: 0,
            maxRadius: 50,
            color: color,
            life: 30,
            maxLife: 30
        });
        
        // 점수 팝업
        this.effects.push({
            type: 'score',
            x: x,
            y: y,
            text: `+${Math.floor(points)}`,
            life: 90,
            maxLife: 90,
            color: '#10b981'
        });
        
        // 파티클 효과
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.effects.push({
                type: 'particle',
                x: x,
                y: y,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                color: color,
                life: 60,
                maxLife: 60
            });
        }
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
        
        // 조준점 부드러운 이동 (모드별 최적화)
        if (this.gameMode === 'mass-competitive') {
            // ✅ 대규모 경쟁 모드: 모든 플레이어의 조준점 업데이트
            this.massPlayers.forEach(player => {
                if (player.isActive && player.targetX !== undefined && player.targetY !== undefined) {
                    player.x = (player.x || player.targetX) + (player.targetX - (player.x || player.targetX)) * this.massCompetitiveCrosshair.smoothing;
                    player.y = (player.y || player.targetY) + (player.targetY - (player.y || player.targetY)) * this.massCompetitiveCrosshair.smoothing;
                }
            });

        } else {
            // 다른 모드들: 기본 smoothing
            this.crosshair.x += (this.crosshair.targetX - this.crosshair.x) * this.crosshair.smoothing;
            this.crosshair.y += (this.crosshair.targetY - this.crosshair.y) * this.crosshair.smoothing;
        }
    }
}