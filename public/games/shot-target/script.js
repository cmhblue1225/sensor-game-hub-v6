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
            myPlayerId: null,
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
            smoothing: 0.1  // 부드러운 움직임을 위한 보간
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
            // 대규모 경쟁 모드용 요소들
            massCompetitivePanel: document.getElementById('massCompetitivePanel'),
            massCompetitiveTimerValue: document.getElementById('massCompetitiveTimerValue'),
            massPlayerCount: document.getElementById('massPlayerCount'),
            totalTargetsCreated: document.getElementById('totalTargetsCreated'),
            massLeaderboard: document.getElementById('massLeaderboard'),
            myMassInfoPanel: document.getElementById('myMassInfoPanel'),
            myMassScore: document.getElementById('myMassScore'),
            myMassRank: document.getElementById('myMassRank'),
            myMassHits: document.getElementById('myMassHits'),
            myMassCombo: document.getElementById('myMassCombo'),
            myMassAccuracy: document.getElementById('myMassAccuracy'),
            massWaitingPanel: document.getElementById('massWaitingPanel'),
            massSessionCode: document.getElementById('massSessionCode'),
            massQrContainer: document.getElementById('massQrContainer'),
            massWaitingList: document.getElementById('massWaitingList'),
            massWaitingPlayers: document.getElementById('massWaitingPlayers'),
            massStartBtn: document.getElementById('massStartBtn')
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
            
            // 조준점 초기 위치 (화면 중앙)
            this.crosshair.x = this.canvas.width / 2;
            this.crosshair.y = this.canvas.height / 2;
            this.crosshair.targetX = this.crosshair.x;
            this.crosshair.targetY = this.crosshair.y;
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
                
                if (!this.state.myPlayerId) {
                    // 첫 번째 연결이 내 플레이어
                    this.state.myPlayerId = playerId;
                    this.state.sensorConnected = true;
                    this.updateSensorStatus(true);
                }
                
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
        
        this.sdk.on('sensor-disconnected', () => {
            this.state.sensorConnected = false;
            this.updateSensorStatus(false);
            this.updateGameStatus('센서 연결 끊김');
            this.pauseGame();
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
        this.elements.crosshair.classList.remove('hidden');
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
                    // ✅ 성능 최적화: 센서 데이터 throttling (AI_ASSISTANT_PROMPTS.md 지침)
                    const now = Date.now();
                    if (!player.lastSensorUpdate) player.lastSensorUpdate = 0;
                    if (now - player.lastSensorUpdate < 33) return;  // 30fps = 33ms 간격
                    player.lastSensorUpdate = now;
                    
                    // 플레이어 조준점 위치 업데이트
                    player.tilt = {
                        x: sensorData.orientation.beta || 0,
                        y: sensorData.orientation.gamma || 0
                    };
                    
                    // 내 플레이어인 경우 메인 조준점 업데이트
                    if (sensorId === this.state.myPlayerId) {
                        this.sensorData.sensor1.tilt.x = player.tilt.x;
                        this.sensorData.sensor1.tilt.y = player.tilt.y;
                    }
                    
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
        
        // 조준점 초기화
        this.crosshair.x = this.canvas.width / 2;
        this.crosshair.y = this.canvas.height / 2;
        this.crosshair.targetX = this.crosshair.x;
        this.crosshair.targetY = this.crosshair.y;
        
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
            // ✅ 대규모 경쟁 모드: 모든 플레이어의 조준점 확인
            this.massPlayers.forEach((player, playerId) => {
                if (!player.isActive) return;
                
                // 각 플레이어의 조준점 위치 계산
                const playerCrosshairX = this.calculatePlayerCrosshairX(player);
                const playerCrosshairY = this.calculatePlayerCrosshairY(player);
                
                for (let i = 0; i < this.targets.length; i++) {
                    const target = this.targets[i];
                    const dx = playerCrosshairX - target.x;
                    const dy = playerCrosshairY - target.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 조준점이 표적의 히트존 내에 있으면 자동 발사
                    if (distance <= this.config.hitRadius) {
                        this.handleMassTargetHit(target, i, playerId);
                        return;
                    }
                }
            });
            
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
        
        // 조준점 부드러운 이동
        this.crosshair.x += (this.crosshair.targetX - this.crosshair.x) * this.crosshair.smoothing;
        this.crosshair.y += (this.crosshair.targetY - this.crosshair.y) * this.crosshair.smoothing;
        
        // 조준점 위치를 DOM 요소에 반영
        this.elements.crosshair.style.left = this.crosshair.x + 'px';
        this.elements.crosshair.style.top = this.crosshair.y + 'px';
        
        // 협동/경쟁 모드에서 두 번째 조준점 처리
        if (this.gameMode === 'coop' || this.gameMode === 'competitive') {
            this.crosshair2.x += (this.crosshair2.targetX - this.crosshair2.x) * this.crosshair2.smoothing;
            this.crosshair2.y += (this.crosshair2.targetY - this.crosshair2.y) * this.crosshair2.smoothing;
        }
        
        // 새 표적 생성
        if (now - this.lastTargetSpawn > this.config.targetSpawnInterval) {
            this.spawnTarget();
            this.lastTargetSpawn = now;
        }
        
        // 표적 업데이트 (수명 체크)
        this.targets = this.targets.filter(target => {
            const age = now - target.spawnTime;
            if (age > this.config.targetLifetime) {
                // 표적이 사라지면 콤보 리셋
                this.state.comboCount = 0;
                this.state.misses++;
                this.updateScore();
                console.log('🎯 표적 소멸 - 콤보 리셋');
                return false;
            }
            
            // 페이드 아웃 효과
            const fadeStartTime = this.config.targetLifetime * 0.7;
            if (age > fadeStartTime) {
                target.alpha = 1 - (age - fadeStartTime) / (this.config.targetLifetime * 0.3);
            }
            
            return true;
        });
        
        // 총알 업데이트
        this.bullets = this.bullets.filter(bullet => {
            const dx = bullet.targetX - bullet.x;
            const dy = bullet.targetY - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < bullet.speed) {
                bullet.x = bullet.targetX;
                bullet.y = bullet.targetY;
                return false; // 목표 도달, 제거
            } else {
                bullet.x += (dx / distance) * bullet.speed;
                bullet.y += (dy / distance) * bullet.speed;
                return true;
            }
        });
        
        // 효과 업데이트
        this.effects = this.effects.filter(effect => {
            effect.life--;
            
            if (effect.type === 'hit') {
                effect.radius = (1 - effect.life / effect.maxLife) * effect.maxRadius;
            } else if (effect.type === 'particle') {
                effect.x += effect.vx;
                effect.y += effect.vy;
                effect.vx *= 0.95;
                effect.vy *= 0.95;
            }
            
            return effect.life > 0;
        });
        
        // 자동 발사 체크
        this.tryShoot();

        // 경쟁 모드 콤보 타임아웃 체크
        if (this.gameMode === 'competitive') {
            const now = Date.now();
            if (this.state.player1Combo > 0 && now - this.state.player1LastHitTime > 3500) {
                this.state.player1Combo = 0;
                this.updateScore();
                console.log('🎯 플레이어 1 콤보 리셋');
            }
            if (this.state.player2Combo > 0 && now - this.state.player2LastHitTime > 3500) {
                this.state.player2Combo = 0;
                this.updateScore();
                console.log('🎯 플레이어 2 콤보 리셋');
            }
        }
    }
    
    render() {
        // 배경 클리어
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 표적 렌더링
        this.targets.forEach(target => {
            this.ctx.globalAlpha = target.alpha;
            
            // 표적 본체
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = target.color + '40'; // 투명도 추가
            this.ctx.fill();
            this.ctx.strokeStyle = target.color;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // 중앙 점
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = target.color;
            this.ctx.fill();
            
            // 점수 표시
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(target.points, target.x, target.y - target.radius - 10);
        });
        
        this.ctx.globalAlpha = 1;
        
        // 총알 렌더링
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();
            this.ctx.strokeStyle = '#3b82f6';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
        
        // 효과 렌더링
        this.effects.forEach(effect => {
            const alpha = effect.life / effect.maxLife;
            this.ctx.globalAlpha = alpha;
            
            if (effect.type === 'hit') {
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = effect.color;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            } else if (effect.type === 'score') {
                this.ctx.fillStyle = effect.color;
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(effect.text, effect.x, effect.y - (1 - alpha) * 40);
            } else if (effect.type === 'particle') {
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, 3, 0, Math.PI * 2);
                this.ctx.fillStyle = effect.color;
                this.ctx.fill();
            }
        });
        
        this.ctx.globalAlpha = 1;
        
        // 협동 모드에서 중앙 경계선 렌더링
        if (this.gameMode === 'coop') {
            this.renderCenterDivider();
        }
        
        // 협동/경쟁 모드에서 두 번째 조준점 렌더링
        if (this.gameMode === 'coop' || this.gameMode === 'competitive') {
            this.renderSecondCrosshair();
        }
    }
    
    renderCenterDivider() {
        // 협동 모드 중앙 경계선
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);  // 점선 효과
        this.ctx.stroke();
        this.ctx.setLineDash([]);  // 점선 해제
        
        // 경계선 글로우 효과
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    renderSecondCrosshair() {
        // 두 번째 조준점 (다른 색상으로 구분)
        this.ctx.beginPath();
        this.ctx.arc(this.crosshair2.x, this.crosshair2.y, 15, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#f59e0b';  // 주황색
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // 십자 표시
        this.ctx.beginPath();
        this.ctx.moveTo(this.crosshair2.x - 10, this.crosshair2.y);
        this.ctx.lineTo(this.crosshair2.x + 10, this.crosshair2.y);
        this.ctx.moveTo(this.crosshair2.x, this.crosshair2.y - 10);
        this.ctx.lineTo(this.crosshair2.x, this.crosshair2.y + 10);
        this.ctx.stroke();
    }
    
    updateScore() {
        if (this.gameMode === 'competitive') {
            // 경쟁 모드: 플레이어별 점수 표시
            this.elements.player1Score.textContent = this.state.player1Score.toLocaleString();
            this.elements.player2Score.textContent = this.state.player2Score.toLocaleString();
            this.elements.competitiveTimerValue.textContent = this.elements.timerValue.textContent;
            
        } else if (this.gameMode === 'mass-competitive') {
            // 대규모 경쟁 모드: 리더보드 업데이트
            this.updateMassLeaderboard();
            this.elements.massCompetitiveTimerValue.textContent = this.elements.timerValue.textContent;
            
        } else {
            // 싱글/협동 모드: 공통 점수 표시
            this.elements.scoreValue.textContent = this.state.score.toLocaleString();
            this.elements.hitsCount.textContent = this.state.hits;
            this.elements.missesCount.textContent = this.state.misses;
            this.elements.comboCount.textContent = this.state.comboCount;
            
            const total = this.state.hits + this.state.misses;
            const accuracy = total > 0 ? (this.state.hits / total * 100) : 100;
            this.elements.accuracyValue.textContent = accuracy.toFixed(1) + '%';
        }
    }
    
    updateServerStatus(connected) {
        this.elements.serverStatus.classList.toggle('connected', connected);
    }
    
    updateSensorStatus(connected) {
        this.elements.sensorStatus.classList.toggle('connected', connected);
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
    
    updateGameStatus(status) {
        this.elements.gameStatusText.textContent = status;
    }
    
    // ============================================
    // 🔥 대규모 경쟁 모드 전용 함수들
    // ============================================
    
    async displayMassSessionInfo(session) {
        this.elements.massSessionCode.textContent = session.sessionCode || '----';
        
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
                this.elements.massQrContainer.innerHTML = '';
                this.elements.massQrContainer.appendChild(canvas);
            } else {
                // 폴백: 외부 API 사용
                const img = document.createElement('img');
                img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sensorUrl)}`;
                img.alt = 'QR Code';
                img.style.width = '200px';
                img.style.height = '200px';
                this.elements.massQrContainer.innerHTML = '';
                this.elements.massQrContainer.appendChild(img);
            }
        } catch (error) {
            console.error('QR 코드 생성 실패:', error);
            this.elements.massQrContainer.innerHTML = `<p>QR 코드: ${sensorUrl}</p>`;
        }
    }
    
    addMassPlayer(playerId, colorIndex) {
        if (this.massPlayers.has(playerId)) return;
        
        const player = {
            id: playerId,
            name: `Player ${colorIndex + 1}`,
            color: this.playerColors[colorIndex % this.playerColors.length],
            score: 0,
            hits: 0,
            combo: 0,
            accuracy: 100,
            isActive: true,
            position: {
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50
            },
            tilt: { x: 0, y: 0 },
            lastActivity: Date.now(),
            lastSensorUpdate: 0,
            lastHitTime: 0
        };
        
        this.massPlayers.set(playerId, player);
        console.log(`👤 대규모 경쟁 플레이어 추가: ${player.name} (${playerId})`);
    }
    
    updateMassWaitingList() {
        const waitingTitle = this.elements.massWaitingList.querySelector('.waiting-title');
        waitingTitle.textContent = `🎮 참가자 대기실 (${this.massPlayers.size}/8)`;
        
        const waitingPlayers = this.elements.massWaitingPlayers;
        waitingPlayers.innerHTML = '';
        
        Array.from(this.massPlayers.values()).forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'mass-waiting-player';
            playerElement.innerHTML = `
                <div class="mass-player-color" style="background-color: ${player.color};"></div>
                <span>${player.name}</span>
                ${player.id === this.state.myPlayerId ? '<span style="color: var(--success); font-weight: 600;">(나)</span>' : ''}
            `;
            waitingPlayers.appendChild(playerElement);
        });
    }
    
    updateMassPlayerCount(count) {
        this.elements.massPlayerCount.textContent = `${count}/8`;
    }
    
    startMassCompetitive() {
        if (this.massPlayers.size >= 3) {
            this.hideMassWaitingPanel();
            this.startGame();
        }
    }
    
    hideMassWaitingPanel() {
        this.elements.massWaitingPanel.classList.add('hidden');
        this.elements.massCompetitivePanel.classList.remove('hidden');
        this.elements.myMassInfoPanel.classList.remove('hidden');
        this.elements.gameInfoPanel.classList.remove('hidden');
        this.elements.crosshair.classList.remove('hidden');
    }
    
    updateMassLeaderboard() {
        const sortedPlayers = Array.from(this.massPlayers.values())
            .sort((a, b) => b.score - a.score);
        
        const leaderboard = this.elements.massLeaderboard;
        leaderboard.innerHTML = '';
        
        sortedPlayers.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = `mass-player-item ${player.id === this.state.myPlayerId ? 'me' : ''}`;
            playerElement.innerHTML = `
                <div class="mass-player-info">
                    <span class="mass-player-rank">${index + 1}</span>
                    <div class="mass-player-color" style="background-color: ${player.color};"></div>
                    <span class="mass-player-name">${player.name}</span>
                </div>
                <span class="mass-player-score">${player.score.toLocaleString()}</span>
            `;
            leaderboard.appendChild(playerElement);
        });
        
        // 내 순위 업데이트
        const myPlayerIndex = sortedPlayers.findIndex(p => p.id === this.state.myPlayerId);
        if (myPlayerIndex !== -1) {
            this.updateMyMassStats(sortedPlayers[myPlayerIndex], myPlayerIndex + 1);
        }
    }
    
    updateMyMassStats(myPlayer, rank) {
        if (!myPlayer) return;
        
        this.elements.myMassScore.textContent = myPlayer.score.toLocaleString();
        this.elements.myMassRank.textContent = rank;
        this.elements.myMassHits.textContent = myPlayer.hits;
        this.elements.myMassCombo.textContent = myPlayer.combo;
        this.elements.myMassAccuracy.textContent = `${myPlayer.accuracy}%`;
    }
    
    // 대규모 경쟁 모드에서 표적 명중 처리
    handleMassTargetHit(target, targetIndex, playerId) {
        const player = this.massPlayers.get(playerId);
        if (!player) return;
        
        // 점수 계산
        let points = target.points;
        player.combo++;
        
        if (player.combo > 1) {
            const comboBonus = Math.min(player.combo - 1, 2); // 최대 3배까지
            points *= Math.pow(this.config.comboMultiplier, comboBonus);
        }
        
        player.score += Math.floor(points);
        player.hits++;
        player.lastHitTime = Date.now();
        
        // 정확도 계산 (간단히 hits 기준)
        player.accuracy = Math.round((player.hits / (player.hits + 1)) * 100); // +1은 빗나감 추정
        
        // 표적 제거
        this.targets.splice(targetIndex, 1);
        
        // 타격 효과
        this.createHitEffect(target.x, target.y, points, player.color);
        
        // 새 표적 생성
        setTimeout(() => {
            this.spawnTarget();
            this.state.totalTargetsCreated++;
            this.elements.totalTargetsCreated.textContent = this.state.totalTargetsCreated;
        }, 500);
        
        // 리더보드 업데이트
        this.updateMassLeaderboard();
        
        console.log(`🎯 ${player.name} 표적 명중! +${Math.floor(points)}pt (콤보 x${player.combo})`);
    }
}

// ✅ 게임 시작
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new ShotTargetGame();
    window.game = game; // 전역 접근을 위해
});