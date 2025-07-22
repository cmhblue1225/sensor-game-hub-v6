/**
 * 🚁 3D 드론 레이싱 게임 메인 클래스
 * 
 * 미래적인 네온 도시에서 펼쳐지는 듀얼 플레이어 드론 경주 게임
 * - SessionSDK 통합 및 세션 유지 재시작
 * - Three.js 3D 렌더링 및 Cannon.js 물리 엔진
 * - 화면 분할 듀얼 카메라 시스템
 */

class DroneRacingGame {
    constructor() {
        console.log('🚁 3D 드론 레이싱 게임 초기화 시작');
        
        // Three.js deprecated 경고 필터링
        this.filterThreeJSWarnings();
        
        // 캔버스 및 렌더링 설정
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('❌ 게임 캔버스를 찾을 수 없습니다');
            return;
        }
        
        this.setupRenderer();
        
        // 게임 상태
        this.gameState = 'waiting'; // waiting, racing, finished, paused
        this.sessionPersistent = true; // 재시작 시 세션 유지
        this.raceStartTime = 0;
        this.startTime = 0; // 경주 시작 시간
        this.raceFinished = false; // 경주 완료 플래그
        this.isPaused = false;
        this.isInitialized = false; // 초기화 완료 플래그
        
        // SessionSDK 통합
        this.sdk = new SessionSDK({
            gameId: 'drone-racing',
            gameType: 'dual',
            debug: true
        });
        
        // 게임 컴포넌트들 (나중에 초기화)
        this.drones = {};
        this.track = null;
        this.effects = null;
        this.ui = null;
        this.physics = null;
        this.gameStateManager = null;
        this.performanceOptimizer = null;
        
        // 센서 연결 상태 모니터링
        this.sensorConnectionMonitor = {
            lastHeartbeat: new Map(),
            connectionTimeout: 5000, // 5초
            reconnectAttempts: new Map(),
            maxReconnectAttempts: 3,
            isMonitoring: false
        };
        
        // 테스트 모드
        this.testMode = true; // 기본적으로 테스트 모드 활성화
        this.keyboardControls = {
            player1: { forward: false, backward: false, left: false, right: false, boost: false, up: false, down: false },
            player2: { forward: false, backward: false, left: false, right: false, boost: false, up: false, down: false }
        };
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 기본 환경 미리 생성 (렌더링 문제 해결을 위해)
        this.initializeBasicScene();
        
        // 게임 루프 시작
        this.gameLoop();
        
        console.log('✅ 드론 레이싱 게임 초기화 완료');
        this.isInitialized = true;
    }
    
    /**
     * Three.js deprecated 경고 필터링
     */
    filterThreeJSWarnings() {
        // 기존 console.warn과 console.error를 백업
        const originalWarn = console.warn;
        const originalError = console.error;
        
        // console.warn을 오버라이드하여 Three.js deprecated 경고 필터링
        console.warn = function(...args) {
            const message = args.join(' ');
            
            // Three.js deprecated 경고 메시지 필터링 (더 포괄적)
            if (message.includes('Scripts "build/three.js"') ||
                message.includes('Scripts "build/three.min.js"') ||
                message.includes('are deprecated') ||
                message.includes('Please use ES Modules') ||
                message.includes('r150+') ||
                message.includes('r160') ||
                message.includes('threejs.org/docs')) {
                return; // 경고 무시
            }
            
            // 다른 경고는 정상적으로 출력
            originalWarn.apply(console, args);
        };
        
        // console.error도 필터링 (일부 Three.js 경고가 error로 출력될 수 있음)
        console.error = function(...args) {
            const message = args.join(' ');
            
            // Three.js deprecated 에러 메시지 필터링
            if (message.includes('Scripts "build/three.js"') ||
                message.includes('Scripts "build/three.min.js"') ||
                message.includes('are deprecated') ||
                message.includes('Please use ES Modules') ||
                message.includes('threejs.org/docs')) {
                return; // 에러 무시
            }
            
            // 다른 에러는 정상적으로 출력
            originalError.apply(console, args);
        };
    }

    /**
     * 3D 렌더러 설정
     */
    setupRenderer() {
        // Three.js 렌더러 설정
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 씬 생성
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0f172a, 50, 200);
        
        // 듀얼 카메라 시스템 (화면 분할)
        this.cameras = {
            player1: new THREE.PerspectiveCamera(75, 0.5, 0.1, 1000),
            player2: new THREE.PerspectiveCamera(75, 0.5, 0.1, 1000)
        };
        
        // 카메라 초기 위치 설정
        this.cameras.player1.position.set(-15, 10, 0);
        this.cameras.player2.position.set(15, 10, 0);
        
        // 윈도우 리사이즈 처리
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    /**
     * 기본 씬 초기화 (렌더링 문제 해결을 위해)
     */
    initializeBasicScene() {
        console.log('🎬 기본 씬 초기화 시작');
        
        // 기본 조명 설정
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        this.scene.add(directionalLight);
        
        // 기본 바닥 생성 (즉시 보이도록)
        const floorGeometry = new THREE.PlaneGeometry(200, 200);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        this.scene.add(floor);
        
        // 기본 트랙 링 생성 (즉시 보이도록)
        const ringGeometry = new THREE.TorusGeometry(25, 2, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00aaff,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 1;
        this.scene.add(ring);
        
        // 기본 드론 생성 (즉시 보이도록)
        this.createBasicDrones();
        
        // 카메라 위치 조정
        this.cameras.player1.position.set(-15, 10, 15);
        this.cameras.player1.lookAt(0, 0, 0);
        
        this.cameras.player2.position.set(15, 10, 15);
        this.cameras.player2.lookAt(0, 0, 0);
        
        console.log('🎬 기본 씬 초기화 완료, 오브젝트 수:', this.scene.children.length);
        
        // 즉시 한 번 렌더링
        this.render();
    }
    
    /**
     * 기본 드론 생성 (렌더링 문제 해결을 위해)
     */
    createBasicDrones() {
        // 플레이어 1 드론 (초록색)
        const drone1Geometry = new THREE.BoxGeometry(2, 0.5, 2);
        const drone1Material = new THREE.MeshLambertMaterial({ color: 0x00ff88 });
        const drone1 = new THREE.Mesh(drone1Geometry, drone1Material);
        drone1.position.set(-10, 3, 0);
        drone1.name = 'basicDrone1';
        this.scene.add(drone1);
        
        // 플레이어 2 드론 (분홍색)
        const drone2Geometry = new THREE.BoxGeometry(2, 0.5, 2);
        const drone2Material = new THREE.MeshLambertMaterial({ color: 0xff0088 });
        const drone2 = new THREE.Mesh(drone2Geometry, drone2Material);
        drone2.position.set(10, 3, 0);
        drone2.name = 'basicDrone2';
        this.scene.add(drone2);
        
        console.log('🚁 기본 드론 생성 완료');
    }
    
    /**
     * 윈도우 리사이즈 처리
     */
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // 렌더러 크기 업데이트
        this.renderer.setSize(width, height);
        
        // 카메라 aspect ratio 업데이트
        const halfWidth = width / 2;
        this.cameras.player1.aspect = halfWidth / height;
        this.cameras.player1.updateProjectionMatrix();
        
        this.cameras.player2.aspect = halfWidth / height;
        this.cameras.player2.updateProjectionMatrix();
        
        console.log(`🖥️ 윈도우 리사이즈: ${width}x${height}`);
        
        // 강제 렌더링
        this.render();
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // ✅ 중요: 서버 연결 완료 후 세션 생성
        this.sdk.on('connected', () => {
            console.log('✅ 서버 연결 완료, 세션 생성 중...');
            this.createSession();
        });
        
        // ✅ 중요: CustomEvent 처리 패턴
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;  // 필수 패턴!
            console.log('세션 생성됨:', session);
            this.displaySessionInfo(session);
        });
        
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;     // 필수 패턴!
            console.log('센서 연결됨:', data);
            this.onSensorConnected(data);
        });
        
        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;     // 필수 패턴!
            this.processSensorData(data);
        });
        
        this.sdk.on('game-ready', (event) => {
            const data = event.detail || event;     // 필수 패턴!
            console.log('게임 준비 완료');
            this.startRace();
        });
        
        // 센서 연결 해제 처리
        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;     // 필수 패턴!
            console.log('센서 연결 해제:', data.sensorId);
            this.onSensorDisconnected(data);
        });
        
        // 키보드 테스트 컨트롤
        this.setupKeyboardControls();
        
        // 성능 모니터링 UI 설정
        this.setupPerformanceMonitoring();
    }
    
    /**
     * 세션 생성
     */
    async createSession() {
        try {
            await this.sdk.createSession();
        } catch (error) {
            console.error('세션 생성 실패:', error);
        }
    }
    
    /**
     * 세션 정보 표시 (QR 코드 포함)
     */
    displaySessionInfo(session) {
        document.getElementById('sessionCode').textContent = session.sessionCode;
        
        const qrUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
        
        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(document.createElement('canvas'), qrUrl, (error, canvas) => {
                if (!error) {
                    canvas.style.width = '200px';
                    canvas.style.height = '200px';
                    document.getElementById('qrContainer').innerHTML = '';
                    document.getElementById('qrContainer').appendChild(canvas);
                } else {
                    console.error('QR 코드 생성 실패:', error);
                    this.showQRCodeFallback(qrUrl);
                }
            });
        } else {
            console.warn('QRCode 라이브러리가 로드되지 않았습니다. 폴백 사용.');
            this.showQRCodeFallback(qrUrl);
        }
    }
    
    /**
     * QR 코드 폴백 처리
     */
    showQRCodeFallback(qrUrl) {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
        const img = document.createElement('img');
        img.src = qrApiUrl;
        img.style.width = '200px';
        img.style.height = '200px';
        img.alt = 'QR Code';
        
        document.getElementById('qrContainer').innerHTML = '';
        document.getElementById('qrContainer').appendChild(img);
    }
    
    /**
     * 센서 연결 처리
     */
    onSensorConnected(data) {
        console.log(`센서 연결됨: ${data.sensorId} (${data.connectedSensors}/${data.maxSensors})`);
        
        // 게임 상태 관리자에 센서 연결 상태 업데이트
        if (this.gameStateManager) {
            this.gameStateManager.updateSensorConnection(data.sensorId, true);
        }
        
        // UI 업데이트
        if (data.connectedSensors === 1) {
            // 첫 번째 센서 연결
            console.log('첫 번째 플레이어 연결됨! 두 번째 플레이어를 기다리는 중...');
        } else if (data.connectedSensors === 2) {
            // 모든 센서 연결 완료 - 자동으로 게임 시작
            console.log('모든 플레이어 연결 완료! 게임을 시작합니다.');
            
            // 1초 후 자동으로 경주 시작
            setTimeout(() => {
                this.startRace();
            }, 1000);
        }
    }
    
    /**
     * 센서 연결 해제 처리
     */
    onSensorDisconnected(data) {
        console.log(`센서 연결 해제: ${data.sensorId}`);
        
        // 재연결 시도 횟수 초기화
        this.sensorConnectionMonitor.reconnectAttempts.set(data.sensorId, 0);
        
        // 게임 상태 관리자에 센서 연결 해제 상태 업데이트
        if (this.gameStateManager) {
            this.gameStateManager.updateSensorConnection(data.sensorId, false);
        }
        
        // 게임 일시정지 (세션 유지)
        if (this.gameState === 'racing') {
            this.pauseGame();
        }
        
        // 재연결 메시지 표시
        this.showReconnectionMessage(data.sensorId);
        
        // 자동 재연결 시도 시작
        this.startReconnectionAttempts(data.sensorId);
    }
    
    /**
     * 센서 연결 끊김 감지 및 게임 일시정지
     */
    detectSensorDisconnection() {
        if (!this.sensorConnectionMonitor.isMonitoring) return;
        
        const currentTime = Date.now();
        
        this.sensorConnectionMonitor.lastHeartbeat.forEach((lastTime, sensorId) => {
            const timeSinceLastHeartbeat = currentTime - lastTime;
            
            if (timeSinceLastHeartbeat > this.sensorConnectionMonitor.connectionTimeout) {
                console.log(`센서 ${sensorId} 연결 타임아웃 감지`);
                
                // 연결 해제 이벤트 시뮬레이션
                this.onSensorDisconnected({ sensorId });
                
                // 해당 센서의 하트비트 제거
                this.sensorConnectionMonitor.lastHeartbeat.delete(sensorId);
            }
        });
    }
    
    /**
     * 자동 재연결 시도 시작
     */
    startReconnectionAttempts(sensorId) {
        const attempts = this.sensorConnectionMonitor.reconnectAttempts.get(sensorId) || 0;
        
        if (attempts >= this.sensorConnectionMonitor.maxReconnectAttempts) {
            console.log(`센서 ${sensorId} 최대 재연결 시도 횟수 초과`);
            this.showReconnectionFailure(sensorId);
            return;
        }
        
        console.log(`센서 ${sensorId} 재연결 시도 ${attempts + 1}/${this.sensorConnectionMonitor.maxReconnectAttempts}`);
        
        // 재연결 시도 횟수 증가
        this.sensorConnectionMonitor.reconnectAttempts.set(sensorId, attempts + 1);
        
        // UI 업데이트
        this.updateReconnectionMessage(sensorId, attempts + 1);
        
        // 3초 후 다시 시도
        setTimeout(() => {
            // 아직 연결되지 않았으면 다시 시도
            if (!this.isSensorConnected(sensorId)) {
                this.startReconnectionAttempts(sensorId);
            }
        }, 3000);
    }
    
    /**
     * 센서 연결 상태 확인
     */
    isSensorConnected(sensorId) {
        if (this.gameStateManager) {
            const playerState = this.gameStateManager.getPlayerState(sensorId);
            return playerState?.isConnected || false;
        }
        return false;
    }
    
    /**
     * 센서 재연결 시 게임 재개
     */
    onSensorReconnected(sensorId) {
        console.log(`센서 ${sensorId} 재연결됨`);
        
        // 재연결 시도 횟수 초기화
        this.sensorConnectionMonitor.reconnectAttempts.delete(sensorId);
        
        // 하트비트 갱신
        this.sensorConnectionMonitor.lastHeartbeat.set(sensorId, Date.now());
        
        // 게임 상태 관리자에 연결 상태 업데이트
        if (this.gameStateManager) {
            this.gameStateManager.updateSensorConnection(sensorId, true);
        }
        
        // 재연결 메시지 숨김
        this.hideReconnectionMessage();
        
        // 모든 센서가 연결되었으면 게임 재개
        if (this.areAllSensorsConnected()) {
            this.resumeGame();
            this.ui?.showToast('모든 센서가 재연결되었습니다. 게임을 재개합니다.', 'success', 3000);
        }
    }
    
    /**
     * 모든 센서 연결 상태 확인
     */
    areAllSensorsConnected() {
        if (this.gameStateManager) {
            const sessionInfo = this.gameStateManager.getGameState().sessionInfo;
            return sessionInfo.connectedSensors >= sessionInfo.maxSensors;
        }
        return false;
    }
    
    /**
     * 재연결 실패 처리
     */
    showReconnectionFailure(sensorId) {
        const playerName = sensorId === 'player1' ? '플레이어 1' : '플레이어 2';
        
        this.ui?.showToast(
            `${playerName} 센서 재연결에 실패했습니다. 수동으로 재연결해주세요.`,
            'error',
            10000
        );
        
        // 드론 자동 조종 모드 활성화 (선택사항)
        this.enableAutoPilot(sensorId);
    }
    
    /**
     * 드론 자동 조종 모드 구현 (선택사항)
     */
    enableAutoPilot(sensorId) {
        const drone = this.drones[sensorId];
        if (!drone) return;
        
        console.log(`${sensorId} 자동 조종 모드 활성화`);
        
        // 간단한 AI 조종 로직
        drone.autoPilot = {
            enabled: true,
            targetCheckpoint: 0,
            lastUpdate: Date.now()
        };
        
        this.ui?.showToast(
            `${sensorId === 'player1' ? '플레이어 1' : '플레이어 2'} 자동 조종 모드 활성화`,
            'info',
            5000
        );
    }
    
    /**
     * 자동 조종 모드 해제
     */
    disableAutoPilot(sensorId) {
        const drone = this.drones[sensorId];
        if (!drone || !drone.autoPilot) return;
        
        console.log(`${sensorId} 자동 조종 모드 해제`);
        
        drone.autoPilot.enabled = false;
        delete drone.autoPilot;
        
        this.ui?.showToast(
            `${sensorId === 'player1' ? '플레이어 1' : '플레이어 2'} 수동 조종 모드 복원`,
            'success',
            3000
        );
    }
    
    /**
     * 연결 상태 UI 업데이트
     */
    updateConnectionStatus() {
        if (!this.ui) return;
        
        const connectionStatus = {
            player1: this.isSensorConnected('player1'),
            player2: this.isSensorConnected('player2')
        };
        
        // HUD에 연결 상태 표시
        Object.entries(connectionStatus).forEach(([playerId, isConnected]) => {
            const hudElement = document.getElementById(`${playerId}HUD`);
            if (hudElement) {
                const connectionIndicator = hudElement.querySelector('.connection-indicator') || 
                    this.createConnectionIndicator(hudElement);
                
                connectionIndicator.className = `connection-indicator ${isConnected ? 'connected' : 'disconnected'}`;
                connectionIndicator.textContent = isConnected ? '🟢' : '🔴';
                connectionIndicator.title = isConnected ? '연결됨' : '연결 끊김';
            }
        });
    }
    
    /**
     * 연결 상태 표시기 생성
     */
    createConnectionIndicator(hudElement) {
        const indicator = document.createElement('div');
        indicator.className = 'connection-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 12px;
            z-index: 10;
        `;
        
        hudElement.appendChild(indicator);
        return indicator;
    }
    
    /**
     * 재연결 메시지 업데이트
     */
    updateReconnectionMessage(sensorId, attemptCount) {
        const panel = document.getElementById('reconnectPanel');
        const message = document.getElementById('reconnectMessage');
        
        if (panel && message) {
            const playerName = sensorId === 'player1' ? '플레이어 1' : '플레이어 2';
            message.textContent = 
                `${playerName} 센서 재연결 시도 중... (${attemptCount}/${this.sensorConnectionMonitor.maxReconnectAttempts})`;
        }
    }
    
    /**
     * 재연결 메시지 숨김
     */
    hideReconnectionMessage() {
        const panel = document.getElementById('reconnectPanel');
        if (panel) {
            panel.classList.add('hidden');
        }
        
        if (this.ui) {
            this.ui.hideReconnectionMessage();
        }
    }
    
    /**
     * 센서 데이터 처리 (성능 최적화 적용)
     */
    processSensorData(data) {
        if (this.gameState !== 'racing' || this.isPaused) return;
        
        const { sensorId, data: sensorData } = data;
        
        // 센서 하트비트 업데이트
        this.sensorConnectionMonitor.lastHeartbeat.set(sensorId, Date.now());
        
        // 드론이 초기화되지 않았으면 무시
        if (!this.drones[sensorId]) return;
        
        // 성능 최적화: 센서 데이터 throttling (50ms 간격)
        let processedData = sensorData;
        if (this.performanceOptimizer) {
            const throttledData = this.performanceOptimizer.throttleSensorData(sensorId, sensorData);
            if (!throttledData) return; // throttling으로 인해 처리하지 않음
            processedData = throttledData;
        }
        
        // 센서 데이터 필터링 및 검증
        const filteredData = this.filterSensorData(processedData);
        
        // 드론에 센서 데이터 전달
        this.drones[sensorId].updateFromSensor({ data: filteredData });
        
        // 디버그 정보 업데이트
        if (this.testMode) {
            this.updateDebugInfo();
        }
    }
    
    /**
     * 센서 데이터 필터링 및 검증
     */
    filterSensorData(sensorData) {
        const filtered = {
            orientation: {
                alpha: this.clampValue(sensorData.orientation?.alpha || 0, 0, 360),
                beta: this.clampValue(sensorData.orientation?.beta || 0, -180, 180),
                gamma: this.clampValue(sensorData.orientation?.gamma || 0, -90, 90)
            },
            acceleration: {
                x: this.clampValue(sensorData.acceleration?.x || 0, -50, 50),
                y: this.clampValue(sensorData.acceleration?.y || 0, -50, 50),
                z: this.clampValue(sensorData.acceleration?.z || 0, -50, 50)
            },
            rotationRate: {
                alpha: this.clampValue(sensorData.rotationRate?.alpha || 0, -360, 360),
                beta: this.clampValue(sensorData.rotationRate?.beta || 0, -360, 360),
                gamma: this.clampValue(sensorData.rotationRate?.gamma || 0, -360, 360)
            }
        };
        
        return filtered;
    }
    
    /**
     * 값 범위 제한
     */
    clampValue(value, min, max) {
        if (isNaN(value)) return 0;
        return Math.max(min, Math.min(max, value));
    }
    
    /**
     * 경주 시작 (중복 초기화 방지)
     */
    async startRace() {
        // 이미 게임이 시작되었으면 중복 실행 방지
        if (this.gameState === 'countdown' || this.gameState === 'racing') {
            console.warn('⚠️ 게임이 이미 시작되었습니다. 중복 실행을 방지합니다.');
            return;
        }
        
        console.log('🏁 경주 시작 준비');
        
        // UI 전환
        document.getElementById('sessionPanel').classList.add('hidden');
        document.getElementById('gameHUD').classList.remove('hidden');
        document.getElementById('controlPanel').classList.remove('hidden');
        
        // 게임 컴포넌트가 이미 초기화되었는지 확인
        if (!this.ui || !this.physics || !this.effects) {
            console.log('🔧 게임 컴포넌트 초기화 중...');
            await this.initializeGameComponents();
        } else {
            console.log('✅ 게임 컴포넌트가 이미 초기화되어 있습니다.');
        }
        
        // 센서 연결 모니터링 활성화
        this.sensorConnectionMonitor.isMonitoring = true;
        
        // 게임 상태 설정
        this.gameState = 'countdown';
        
        // 강제로 렌더링 한 번 실행하여 드론이 보이도록 함
        this.render();
        
        // 게임 상태 관리자를 통한 카운트다운 시작
        if (this.gameStateManager) {
            console.log('🎮 게임 상태 관리자를 통한 카운트다운 시작');
            this.gameStateManager.setState(this.gameStateManager.states.COUNTDOWN);
        } else {
            console.log('🎮 직접 카운트다운 시작');
            this.startCountdown();
        }
    }
    
    /**
     * 카운트다운 시작 (UI 클래스를 통해 개선)
     */
    startCountdown() {
        console.log('⏰ 카운트다운 시작');
        
        // UI가 초기화되지 않았으면 직접 처리
        if (!this.ui) {
            console.warn('⚠️ UI 시스템이 초기화되지 않았습니다. 직접 카운트다운 처리');
            this.directCountdown();
            return;
        }
        
        let count = 3;
        
        const countdown = () => {
            if (count > 0) {
                console.log(`⏰ 카운트다운: ${count}`);
                this.ui.showCountdown(count);
                count--;
                setTimeout(countdown, 1000);
            } else {
                console.log('🚀 GO! 경주 시작!');
                this.ui.showCountdown(0); // GO! 표시
                
                // 1.5초 후 게임 시작
                setTimeout(() => {
                    this.gameState = 'racing';
                    this.raceStartTime = Date.now();
                    console.log('🚁 경주 시작!');
                }, 1500);
            }
        };
        
        countdown();
    }
    
    /**
     * 직접 카운트다운 처리 (UI 시스템 없이)
     */
    directCountdown() {
        const countdownElement = document.getElementById('countdown');
        if (!countdownElement) {
            console.error('❌ 카운트다운 요소를 찾을 수 없습니다');
            return;
        }
        
        console.log('⏰ 직접 카운트다운 시작');
        countdownElement.classList.remove('hidden');
        countdownElement.style.display = 'block';
        countdownElement.style.visibility = 'visible';
        countdownElement.style.opacity = '1';
        countdownElement.style.zIndex = '2000';
        
        let count = 3;
        
        const countdown = () => {
            if (count > 0) {
                console.log(`⏰ 카운트다운: ${count}`);
                countdownElement.textContent = count;
                countdownElement.style.color = '#ffaa00';
                countdownElement.style.textShadow = '0 0 30px #ffaa00, 0 0 60px #ffaa00';
                count--;
                setTimeout(countdown, 1000);
            } else {
                console.log('🚀 GO! 경주 시작!');
                countdownElement.textContent = 'GO!';
                countdownElement.style.color = '#00ff88';
                countdownElement.style.textShadow = '0 0 30px #00ff88, 0 0 60px #00ff88';
                
                setTimeout(() => {
                    countdownElement.classList.add('hidden');
                    countdownElement.style.display = 'none';
                    this.gameState = 'racing';
                    this.raceStartTime = Date.now();
                    console.log('🚁 경주 시작!');
                }, 1500);
            }
        };
        
        countdown();
    }
    
    /**
     * 게임 컴포넌트 초기화
     */
    async initializeGameComponents() {
        console.log('게임 컴포넌트 초기화 중...');
        
        // UI 시스템 초기화
        this.ui = new GameUI(this);
        
        // 물리 엔진 초기화
        this.physics = new PhysicsEngine(this.scene);
        
        // 효과 시스템 초기화
        this.effects = new EffectsSystem(this.scene);
        
        // 게임 상태 관리자 초기화
        this.gameStateManager = new GameStateManager(this);
        
        // 성능 최적화 시스템 초기화
        this.performanceOptimizer = new PerformanceOptimizer(this);
        
        // 버그 수정 시스템 초기화 및 적용
        this.bugFixes = new GameBugFixes(this);
        this.bugFixes.applyAllFixes();
        
        // 기본 조명 설정
        this.setupLighting();
        
        // 기본 환경 생성
        this.createBasicEnvironment();
        
        // 물리 이벤트 리스너 설정
        this.setupPhysicsEvents();
        
        console.log('게임 컴포넌트 초기화 완료');
    }
    
    /**
     * 물리 이벤트 리스너 설정
     */
    setupPhysicsEvents() {
        // 드론 간 충돌
        window.addEventListener('drone-collision', (event) => {
            const { droneA, droneB } = event.detail;
            console.log(`드론 충돌: ${droneA} vs ${droneB}`);
            this.ui?.showToast('드론 충돌!', 'warning', 2000);
            
            // 충돌 폭발 효과
            if (this.effects && this.drones[droneA] && this.drones[droneB]) {
                const posA = this.drones[droneA].mesh.position;
                const posB = this.drones[droneB].mesh.position;
                const collisionPos = posA.clone().add(posB).multiplyScalar(0.5);
                this.effects.createExplosionEffect(collisionPos, 0.8);
            }
        });
        
        // 벽 충돌
        window.addEventListener('wall-collision', (event) => {
            const { drone } = event.detail;
            console.log(`벽 충돌: ${drone}`);
            this.ui?.showToast(`${drone} 벽 충돌!`, 'error', 2000);
            
            // 벽 충돌 효과
            if (this.effects && this.drones[drone]) {
                const dronePos = this.drones[drone].mesh.position;
                this.effects.createExplosionEffect(dronePos, 0.5);
            }
        });
        
        // 체크포인트 통과
        window.addEventListener('checkpoint-passed', (event) => {
            const { drone, checkpoint } = event.detail;
            console.log(`체크포인트 통과: ${drone} -> ${checkpoint}`);
            this.handleCheckpointPassed(drone, checkpoint);
            
            // 체크포인트 통과 효과
            if (this.effects && this.trackCheckpoints && this.trackCheckpoints[checkpoint]) {
                const checkpointPos = this.trackCheckpoints[checkpoint].position;
                const color = checkpoint === 0 ? 0xffff00 : 0x00ffaa;
                this.effects.createCheckpointPassEffect(checkpointPos, color);
            }
        });
        
        // 부스터 존 진입
        window.addEventListener('booster-zone-entered', (event) => {
            const { drone, zone } = event.detail;
            console.log(`부스터 존 진입: ${drone} -> ${zone}`);
            this.handleBoosterZoneEntry(drone, zone);
        });
        
        // 트랙 이탈 처리
        window.addEventListener('track-out-of-bounds', (event) => {
            const { drone, resetPosition } = event.detail;
            console.log(`트랙 이탈: ${drone}`);
            this.handleTrackOutOfBounds(drone, resetPosition);
        });
    }
    
    /**
     * 부스터 존 진입 처리
     */
    handleBoosterZoneEntry(droneId, zoneId) {
        const drone = this.drones[droneId];
        if (!drone) return;
        
        // 부스터 존에 있는 드론 추적
        if (!this.dronesInBoosterZones) {
            this.dronesInBoosterZones = new Set();
        }
        
        this.dronesInBoosterZones.add(droneId);
        
        // UI 메시지 표시
        this.ui?.showToast(`${droneId === 'player1' ? '플레이어 1' : '플레이어 2'} 부스터 충전!`, 'info', 1500);
        
        console.log(`${droneId} 부스터 존 진입`);
    }
    
    /**
     * 조명 설정
     */
    setupLighting() {
        // 환경광 (전체적인 밝기)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // 주 방향광 (태양광)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        this.scene.add(directionalLight);
        
        // 네온 효과를 위한 포인트 라이트들
        const colors = [0x00aaff, 0x00ff88, 0xff0088, 0xffaa00];
        for (let i = 0; i < 4; i++) {
            const light = new THREE.PointLight(colors[i], 1, 100);
            const angle = (i / 4) * Math.PI * 2;
            light.position.set(
                Math.cos(angle) * 30,
                10,
                Math.sin(angle) * 30
            );
            
            // 네온 애니메이션을 위한 기본 강도 저장
            light.userData = { baseIntensity: 1 };
            
            this.scene.add(light);
        }
    }
    
    /**
     * 기본 환경 생성
     */
    createBasicEnvironment() {
        // 바닥 생성
        const floorGeometry = new THREE.PlaneGeometry(200, 200);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a2e,
            transparent: true,
            opacity: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // 기본 트랙 링 (임시)
        const ringGeometry = new THREE.TorusGeometry(25, 2, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00aaff,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 1;
        this.scene.add(ring);
        
        // 실제 드론들 생성
        this.createDrones();
        
        // 부스터 존 생성
        this.createBoosterZones();
        
        // 장애물 생성
        this.createObstacles();
    }
    
    /**
     * 부스터 충전 구역 생성
     */
    createBoosterZones() {
        this.boosterZones = [];
        
        // 4개의 부스터 충전 구역을 트랙 주변에 배치
        const positions = [
            { x: 0, z: 30 },    // 북쪽
            { x: 30, z: 0 },    // 동쪽
            { x: 0, z: -30 },   // 남쪽
            { x: -30, z: 0 }    // 서쪽
        ];
        
        positions.forEach((pos, index) => {
            // 부스터 존 시각적 표시
            const zoneGeometry = new THREE.CylinderGeometry(3, 3, 0.5, 16);
            const zoneMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.6
            });
            const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
            zoneMesh.position.set(pos.x, 0.25, pos.z);
            zoneMesh.name = `boosterZone${index}`;
            this.scene.add(zoneMesh);
            
            // 부스터 존 물리 바디 생성
            const zoneBody = new CANNON.Body({
                mass: 0, // 정적 바디
                shape: new CANNON.Cylinder(3, 3, 0.5, 8),
                isTrigger: true // 트리거로 설정
            });
            zoneBody.position.set(pos.x, 0.25, pos.z);
            zoneBody.userData = { type: 'boosterZone', index: index };
            
            if (this.physics && this.physics.world) {
                this.physics.world.add(zoneBody);
            }
            
            // 네온 효과 추가
            const glowGeometry = new THREE.RingGeometry(2.5, 3.5, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.rotation.x = -Math.PI / 2;
            glow.position.set(pos.x, 0.1, pos.z);
            this.scene.add(glow);
            
            // 부스터 존 데이터 저장
            this.boosterZones.push({
                mesh: zoneMesh,
                body: zoneBody,
                glow: glow,
                position: pos,
                isActive: true
            });
            
            console.log(`부스터 존 ${index} 생성: (${pos.x}, ${pos.z})`);
        });
        
        // 부스터 존 애니메이션 시작
        this.animateBoosterZones();
    }
    
    /**
     * 부스터 존 애니메이션
     */
    animateBoosterZones() {
        if (!this.boosterZones) return;
        
        const time = Date.now() * 0.001;
        
        this.boosterZones.forEach((zone, index) => {
            if (!zone.mesh || !zone.glow) return;
            
            // 회전 애니메이션
            zone.mesh.rotation.y = time + index * Math.PI / 2;
            
            // 글로우 효과 펄스
            const pulse = Math.sin(time * 2 + index) * 0.3 + 0.7;
            zone.glow.material.opacity = pulse * 0.3;
            zone.mesh.material.opacity = pulse * 0.6;
            
            // 상하 움직임
            zone.mesh.position.y = 0.25 + Math.sin(time * 3 + index) * 0.1;
        });
        
        // 다음 프레임에서 계속 애니메이션
        requestAnimationFrame(() => this.animateBoosterZones());
    }
    
    /**
     * 장애물 생성
     */
    createObstacles() {
        this.obstacles = [];
        
        // 트랙을 따라 장애물 배치
        const obstacleCount = 8;
        const trackRadius = 40;
        
        for (let i = 0; i < obstacleCount; i++) {
            const angle = (i / obstacleCount) * Math.PI * 2;
            const x = Math.cos(angle) * trackRadius;
            const z = Math.sin(angle) * trackRadius;
            
            // 장애물 지오메트리 (기둥 형태)
            const obstacleGeometry = new THREE.CylinderGeometry(1, 1, 8, 8);
            const obstacleMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xff4444,
                transparent: true,
                opacity: 0.8
            });
            
            const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
            obstacle.position.set(x, 4, z);
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            
            // 경고 표시 추가
            const warningGeometry = new THREE.RingGeometry(2, 3, 8);
            const warningMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffff00,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            
            const warning = new THREE.Mesh(warningGeometry, warningMaterial);
            warning.position.set(x, 0.1, z);
            warning.rotation.x = -Math.PI / 2;
            
            this.scene.add(obstacle);
            this.scene.add(warning);
            
            this.obstacles.push({
                mesh: obstacle,
                warning: warning,
                position: { x, y: 4, z }
            });
            
            console.log(`장애물 ${i} 생성: (${x.toFixed(1)}, ${z.toFixed(1)})`);
        }
        
        console.log(`✅ ${obstacleCount}개의 장애물 생성 완료`);
    }

    /**
     * 드론들 생성
     */
    createDrones() {
        console.log('🚁 드론 생성 시작...');
        
        // 기존 드론이 있으면 제거
        if (this.drones.player1) {
            if (this.drones.player1.mesh) {
                this.scene.remove(this.drones.player1.mesh);
            }
            this.drones.player1 = null;
        }
        
        if (this.drones.player2) {
            if (this.drones.player2.mesh) {
                this.scene.remove(this.drones.player2.mesh);
            }
            this.drones.player2 = null;
        }
        
        // 플레이어 1 드론 (왼쪽 시작) - 위치를 더 가깝게
        this.drones.player1 = new Drone('player1', this.scene, this.physics, { x: -10, y: 3, z: 0 });
        
        // 플레이어 2 드론 (오른쪽 시작) - 위치를 더 가깝게
        this.drones.player2 = new Drone('player2', this.scene, this.physics, { x: 10, y: 3, z: 0 });
        
        // 드론이 제대로 생성되었는지 확인하고 강제로 씬에 추가
        if (this.drones.player1) {
            if (this.drones.player1.mesh) {
                // 드론이 씬에 없으면 추가
                if (!this.scene.getObjectByName('player1')) {
                    this.scene.add(this.drones.player1.mesh);
                }
                console.log('✅ Player1 드론 메시 생성 완료:', this.drones.player1.mesh.position);
                console.log('✅ Player1 드론 메시 씬 포함 여부:', this.scene.getObjectByName('player1') !== undefined);
            } else {
                console.error('❌ Player1 드론 메시 생성 실패');
            }
        }
        
        if (this.drones.player2) {
            if (this.drones.player2.mesh) {
                // 드론이 씬에 없으면 추가
                if (!this.scene.getObjectByName('player2')) {
                    this.scene.add(this.drones.player2.mesh);
                }
                console.log('✅ Player2 드론 메시 생성 완료:', this.drones.player2.mesh.position);
                console.log('✅ Player2 드론 메시 씬 포함 여부:', this.scene.getObjectByName('player2') !== undefined);
            } else {
                console.error('❌ Player2 드론 메시 생성 실패');
            }
        }
        
        // 카메라가 드론을 따라가도록 설정
        this.setupCameraFollow();
        
        // 드론 이벤트 리스너 설정
        this.setupDroneEvents();
        
        // 강제로 한 번 렌더링하여 드론이 즉시 보이도록
        setTimeout(() => {
            this.render();
            console.log('🚁 드론 생성 후 강제 렌더링 완료');
        }, 100);
        
        console.log('🚁 드론 생성 완료. 씬 오브젝트 수:', this.scene.children.length);
        console.log('🚁 씬 오브젝트 목록:', this.scene.children.map(child => child.name || child.type));
    }
    
    /**
     * 카메라 추적 설정
     */
    setupCameraFollow() {
        // 플레이어 1 카메라 (드론을 더 잘 볼 수 있도록 위치 조정)
        this.cameras.player1.position.set(-10, 8, 10);
        this.cameras.player1.lookAt(-10, 3, 0);
        
        // 플레이어 2 카메라 (드론을 더 잘 볼 수 있도록 위치 조정)
        this.cameras.player2.position.set(10, 8, 10);
        this.cameras.player2.lookAt(10, 3, 0);
        
        console.log('📷 카메라 추적 설정 완료');
        console.log(`플레이어 1 카메라 위치: (${this.cameras.player1.position.x}, ${this.cameras.player1.position.y}, ${this.cameras.player1.position.z})`);
        console.log(`플레이어 2 카메라 위치: (${this.cameras.player2.position.x}, ${this.cameras.player2.position.y}, ${this.cameras.player2.position.z})`);
        
        // 카메라가 드론을 실제로 추적하도록 업데이트 함수 설정
        this.updateCameraTracking();
    }
    
    /**
     * 카메라 추적 업데이트
     */
    updateCameraTracking() {
        // 플레이어 1 카메라가 드론을 따라가도록
        if (this.drones.player1?.mesh) {
            const drone1Pos = this.drones.player1.mesh.position;
            this.cameras.player1.position.set(
                drone1Pos.x - 8,
                drone1Pos.y + 5,
                drone1Pos.z + 8
            );
            this.cameras.player1.lookAt(drone1Pos);
        } else {
            // 드론이 없으면 기본 위치로 설정
            this.cameras.player1.position.set(-10, 8, 10);
            this.cameras.player1.lookAt(-10, 3, 0);
        }
        
        // 플레이어 2 카메라가 드론을 따라가도록
        if (this.drones.player2?.mesh) {
            const drone2Pos = this.drones.player2.mesh.position;
            this.cameras.player2.position.set(
                drone2Pos.x + 8,
                drone2Pos.y + 5,
                drone2Pos.z + 8
            );
            this.cameras.player2.lookAt(drone2Pos);
        } else {
            // 드론이 없으면 기본 위치로 설정
            this.cameras.player2.position.set(10, 8, 10);
            this.cameras.player2.lookAt(10, 3, 0);
        }
    }
    
    /**
     * 드론 이벤트 리스너 설정
     */
    setupDroneEvents() {
        // 경주 완주 이벤트
        window.addEventListener('race-finished', (event) => {
            const { playerId, totalTime, bestLap, maxSpeed } = event.detail;
            this.handleRaceFinished(playerId, { totalTime, bestLap, maxSpeed });
        });
    }
    
    /**
     * 게임 재시작 (세션 유지)
     */
    restartGame() {
        console.log('🔄 게임 재시작 (세션 유지)');
        
        // 중복 재시작 방지
        if (this.isRestarting) {
            console.log('⚠️ 이미 재시작 중입니다.');
            return;
        }
        
        this.isRestarting = true;
        
        try {
            // 게임 상태 관리자를 통한 재시작
            if (this.gameStateManager) {
                this.gameStateManager.restart();
            } else {
                // 폴백: 직접 상태 초기화
                this.gameState = 'waiting';
                this.raceStartTime = 0;
                this.isPaused = false;
            }
            
            // UI 초기화
            document.getElementById('resultsPanel')?.classList.add('hidden');
            document.getElementById('reconnectPanel')?.classList.add('hidden');
            document.getElementById('gameHUD')?.classList.add('hidden');
            document.getElementById('controlPanel')?.classList.add('hidden');
            
            // 드론 상태 리셋
            this.resetDrones();
            
            // 센서가 연결되어 있으면 바로 게임 시작 (단, 무한 루프 방지)
            const session = this.sdk.getSession();
            if (session && this.sdk.isConnected()) {
                // 연결된 센서 수 확인 후 게임 시작
                setTimeout(() => {
                    if (this.gameStateManager && 
                        this.gameStateManager.currentState === this.gameStateManager.states.WAITING) {
                        this.startRace();
                    }
                    this.isRestarting = false;
                }, 1000); // 1초로 증가하여 안정성 확보
            } else {
                this.isRestarting = false;
            }
        } catch (error) {
            console.error('게임 재시작 중 오류:', error);
            this.isRestarting = false;
        }
    }
    
    /**
     * 게임 일시정지/재개
     */
    togglePause() {
        if (this.gameStateManager) {
            this.gameStateManager.togglePause();
        } else {
            // 폴백: 직접 일시정지 처리
            if (this.gameState !== 'racing') return;
            
            this.isPaused = !this.isPaused;
            
            const button = document.querySelector('.control-panel button:nth-child(2)');
            if (this.isPaused) {
                button.textContent = '▶️ 재개';
                this.showMessage('게임이 일시정지되었습니다');
            } else {
                button.textContent = '⏸️ 일시정지';
                this.showMessage('게임이 재개되었습니다');
            }
        }
    }
    
    /**
     * 게임 일시정지
     */
    pauseGame() {
        if (this.gameState === 'racing') {
            this.isPaused = true;
            const button = document.querySelector('.control-panel button:nth-child(2)');
            if (button) {
                button.textContent = '▶️ 재개';
            }
        }
    }
    
    /**
     * 게임 재개
     */
    resumeGame() {
        if (this.gameState === 'racing') {
            this.isPaused = false;
            const button = document.querySelector('.control-panel button:nth-child(2)');
            if (button) {
                button.textContent = '⏸️ 일시정지';
            }
            
            // 재연결 메시지 숨김
            document.getElementById('reconnectPanel').classList.add('hidden');
        }
    }
    
    /**
     * 드론 리셋
     */
    resetDrones() {
        console.log('드론 상태 리셋');
        
        // 플레이어 1 드론 리셋
        if (this.drones.player1) {
            this.drones.player1.reset({ x: -15, y: 5, z: 0 });
        }
        
        // 플레이어 2 드론 리셋
        if (this.drones.player2) {
            this.drones.player2.reset({ x: 15, y: 5, z: 0 });
        }
        
        // 카메라 위치 리셋
        this.setupCameraFollow();
        
        console.log('✅ 모든 드론 리셋 완료');
    }
    
    /**
     * 재연결 메시지 표시
     */
    showReconnectionMessage(sensorId) {
        const panel = document.getElementById('reconnectPanel');
        const message = document.getElementById('reconnectMessage');
        
        message.textContent = `${sensorId} 센서 연결이 끊어졌습니다. 재연결을 기다리는 중...`;
        panel.classList.remove('hidden');
    }
    
    /**
     * 메시지 표시
     */
    showMessage(text, duration = 3000) {
        // 간단한 토스트 메시지 (나중에 개선)
        console.log(`📢 ${text}`);
    }
    
    /**
     * 키보드 테스트 컨트롤 설정 (개선된 버전)
     */
    setupKeyboardControls() {
        // 키보드 상태 추적
        this.keyboardState = new Set();
        
        console.log('⌨️ 키보드 테스트 컨트롤 활성화');
        console.log('⌨️ 컨트롤: WASD/화살표키(드론조작), Q/U(부스터), Enter(게임시작), Ctrl+R(재시작), T(테스트모드), H(도움말)');
        
        window.addEventListener('keydown', (e) => {
            // 중복 키 입력 방지
            if (this.keyboardState.has(e.code)) return;
            this.keyboardState.add(e.code);
            
            // 전역 키보드 단축키 (게임 상태와 무관)
            this.handleGlobalKeyboard(e);
            
            // 게임 중 키보드 컨트롤
            if (this.gameState === 'racing' && !this.isPaused && this.testMode) {
                this.handleGameplayKeyboard(e, true);
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keyboardState.delete(e.code);
            
            // 게임 중 키보드 컨트롤 해제
            if (this.testMode) {
                this.handleGameplayKeyboard(e, false);
            }
        });
        
        // 키보드 도움말 표시
        this.showKeyboardHelp();
    }
    
    /**
     * 전역 키보드 단축키 처리
     */
    handleGlobalKeyboard(e) {
        switch(e.key.toLowerCase()) {
            case 't':
                // 테스트 모드 토글
                this.toggleTestMode();
                break;
                
            case 'h':
                // 도움말 토글
                this.toggleKeyboardHelp();
                break;
                
            case 'd':
                // 디버그 모드 토글 (Ctrl+D)
                if (e.ctrlKey) {
                    this.toggleDebugMode();
                    e.preventDefault();
                }
                break;
                
            case 'enter':
                // 게임 시작 (테스트용)
                if (this.gameState === 'waiting') {
                    console.log('⌨️ 키보드로 게임 시작');
                    this.startRace();
                }
                break;
                
            case 'r':
                // 게임 재시작
                if (e.ctrlKey) {
                    console.log('⌨️ 키보드로 게임 재시작');
                    this.restartGame();
                    e.preventDefault();
                }
                break;
                
            case 'r':
                // 게임 재시작 (Ctrl+R 방지하고 게임 재시작)
                if (e.ctrlKey) {
                    this.restartGame();
                    e.preventDefault();
                }
                break;
                
            case 'p':
                // 일시정지/재개
                if (this.gameState === 'racing') {
                    this.togglePause();
                }
                break;
                
            case 'escape':
                // ESC로 메뉴 토글
                this.toggleGameMenu();
                break;
                
            case 'f11':
                // 전체화면 토글
                this.toggleFullscreen();
                e.preventDefault();
                break;
        }
    }
    
    /**
     * 게임플레이 키보드 처리
     */
    handleGameplayKeyboard(e, isPressed) {
        // 플레이어 1 컨트롤 (WASD + Shift + Q/E)
        switch(e.key.toLowerCase()) {
            case 'w': this.keyboardControls.player1.forward = isPressed; break;
            case 's': this.keyboardControls.player1.backward = isPressed; break;
            case 'a': this.keyboardControls.player1.left = isPressed; break;
            case 'd': this.keyboardControls.player1.right = isPressed; break;
            case 'q': this.keyboardControls.player1.up = isPressed; break;
            case 'e': this.keyboardControls.player1.down = isPressed; break;
        }
        
        // Shift 키 처리 (특별 처리 필요)
        if (e.key === 'Shift') {
            this.keyboardControls.player1.boost = isPressed;
        }
        
        // 플레이어 2 컨트롤 (화살표 키 + Space + Numpad)
        switch(e.key) {
            case 'ArrowUp': this.keyboardControls.player2.forward = isPressed; break;
            case 'ArrowDown': this.keyboardControls.player2.backward = isPressed; break;
            case 'ArrowLeft': this.keyboardControls.player2.left = isPressed; break;
            case 'ArrowRight': this.keyboardControls.player2.right = isPressed; break;
            case ' ': 
                this.keyboardControls.player2.boost = isPressed;
                e.preventDefault(); // 스페이스바 스크롤 방지
                break;
            case 'PageUp': this.keyboardControls.player2.up = isPressed; break;
            case 'PageDown': this.keyboardControls.player2.down = isPressed; break;
        }
    }
    
    /**
     * 테스트 모드 토글
     */
    toggleTestMode() {
        this.testMode = !this.testMode;
        
        const message = this.testMode ? 
            '🎮 키보드 테스트 모드 활성화! (H키로 도움말)' : 
            '📱 센서 모드로 전환됨';
            
        console.log(`테스트 모드: ${this.testMode ? '활성화' : '비활성화'}`);
        
        if (this.ui) {
            this.ui.showToast(message, 'info', 3000);
        }
        
        // 테스트 모드 UI 업데이트
        this.updateTestModeUI();
    }
    
    /**
     * 디버그 모드 토글
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        
        const message = this.debugMode ? 
            '🔧 디버그 모드 활성화' : 
            '🔧 디버그 모드 비활성화';
            
        console.log(`디버그 모드: ${this.debugMode ? '활성화' : '비활성화'}`);
        
        if (this.ui) {
            this.ui.showToast(message, 'info', 2000);
            
            if (this.debugMode) {
                this.ui.showDebugInfo(this.getDebugData());
            } else {
                this.ui.hideDebugInfo();
            }
        }
    }
    
    /**
     * 키보드 도움말 토글
     */
    toggleKeyboardHelp() {
        const helpElement = document.getElementById('keyboardHelp');
        
        if (helpElement) {
            const isVisible = !helpElement.classList.contains('hidden');
            helpElement.classList.toggle('hidden', isVisible);
            
            if (this.ui) {
                this.ui.showToast(
                    isVisible ? '키보드 도움말 숨김' : '키보드 도움말 표시', 
                    'info', 
                    1500
                );
            }
        }
    }
    
    /**
     * 게임 메뉴 토글
     */
    toggleGameMenu() {
        // 간단한 게임 메뉴 구현
        const menuExists = document.getElementById('gameMenu');
        
        if (menuExists) {
            menuExists.remove();
        } else {
            this.showGameMenu();
        }
    }
    
    /**
     * 전체화면 토글
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('전체화면 모드 실패:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    /**
     * 키보드 도움말 표시
     */
    showKeyboardHelp() {
        const helpHTML = `
            <div id="keyboardHelp" class="keyboard-help hidden">
                <div class="help-header">
                    <h3>🎮 키보드 컨트롤</h3>
                    <button onclick="document.getElementById('keyboardHelp').classList.add('hidden')">×</button>
                </div>
                <div class="help-content">
                    <div class="help-section">
                        <h4>전역 단축키</h4>
                        <div class="key-binding"><kbd>T</kbd> 테스트 모드 토글</div>
                        <div class="key-binding"><kbd>H</kbd> 도움말 표시/숨김</div>
                        <div class="key-binding"><kbd>Ctrl+D</kbd> 디버그 모드</div>
                        <div class="key-binding"><kbd>P</kbd> 일시정지/재개</div>
                        <div class="key-binding"><kbd>Ctrl+R</kbd> 게임 재시작</div>
                        <div class="key-binding"><kbd>ESC</kbd> 게임 메뉴</div>
                        <div class="key-binding"><kbd>F11</kbd> 전체화면</div>
                    </div>
                    <div class="help-section">
                        <h4>플레이어 1 (테스트 모드)</h4>
                        <div class="key-binding"><kbd>W/S</kbd> 전진/후진</div>
                        <div class="key-binding"><kbd>A/D</kbd> 좌회전/우회전</div>
                        <div class="key-binding"><kbd>Q/E</kbd> 상승/하강</div>
                        <div class="key-binding"><kbd>Shift</kbd> 부스터</div>
                    </div>
                    <div class="help-section">
                        <h4>플레이어 2 (테스트 모드)</h4>
                        <div class="key-binding"><kbd>↑/↓</kbd> 전진/후진</div>
                        <div class="key-binding"><kbd>←/→</kbd> 좌회전/우회전</div>
                        <div class="key-binding"><kbd>PgUp/PgDn</kbd> 상승/하강</div>
                        <div class="key-binding"><kbd>Space</kbd> 부스터</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', helpHTML);
        this.addKeyboardHelpStyles();
    }
    
    /**
     * 키보드 도움말 스타일 추가
     */
    addKeyboardHelpStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .keyboard-help {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(15, 23, 42, 0.95);
                border: 2px solid var(--neon-cyan);
                border-radius: 10px;
                padding: 20px;
                z-index: 10000;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                backdrop-filter: blur(10px);
            }
            
            .help-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid var(--neon-cyan);
                padding-bottom: 10px;
            }
            
            .help-header h3 {
                color: var(--neon-cyan);
                margin: 0;
            }
            
            .help-header button {
                background: none;
                border: none;
                color: var(--text-primary);
                font-size: 24px;
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 5px;
                transition: background 0.3s;
            }
            
            .help-header button:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .help-content {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .help-section h4 {
                color: var(--neon-yellow);
                margin-bottom: 10px;
                font-size: 1.1em;
            }
            
            .key-binding {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                color: var(--text-secondary);
            }
            
            .key-binding kbd {
                background: var(--neon-blue);
                color: #000;
                padding: 4px 8px;
                border-radius: 4px;
                font-family: monospace;
                font-weight: bold;
                margin-right: 10px;
                min-width: 60px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            @media (max-width: 768px) {
                .keyboard-help {
                    width: 90%;
                    max-width: none;
                }
                
                .help-content {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 테스트 모드 UI 업데이트
     */
    updateTestModeUI() {
        // 테스트 모드 표시기 추가/제거
        let indicator = document.getElementById('testModeIndicator');
        
        if (this.testMode) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'testModeIndicator';
                indicator.innerHTML = '🎮 키보드 테스트 모드';
                indicator.style.cssText = `
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    background: rgba(255, 255, 0, 0.9);
                    color: #000;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    z-index: 1000;
                    animation: testModePulse 2s ease-in-out infinite;
                `;
                document.body.appendChild(indicator);
                
                // 애니메이션 스타일 추가
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes testModePulse {
                        0%, 100% { opacity: 0.8; transform: scale(1); }
                        50% { opacity: 1; transform: scale(1.05); }
                    }
                `;
                document.head.appendChild(style);
            }
        } else {
            if (indicator) {
                indicator.remove();
            }
        }
    }
    
    /**
     * 게임 메뉴 표시
     */
    showGameMenu() {
        const menuHTML = `
            <div id="gameMenu" class="game-menu">
                <div class="menu-content">
                    <h3>게임 메뉴</h3>
                    <button onclick="window.droneRacingGame.togglePause()">
                        ${this.isPaused ? '▶️ 재개' : '⏸️ 일시정지'}
                    </button>
                    <button onclick="window.droneRacingGame.restartGame(); document.getElementById('gameMenu').remove();">
                        🔄 재시작
                    </button>
                    <button onclick="window.droneRacingGame.toggleTestMode()">
                        ${this.testMode ? '📱 센서 모드' : '🎮 테스트 모드'}
                    </button>
                    <button onclick="window.droneRacingGame.toggleDebugMode()">
                        ${this.debugMode ? '🔧 디버그 끄기' : '🔧 디버그 켜기'}
                    </button>
                    <button onclick="window.location.href='/'">🏠 허브로</button>
                    <button onclick="document.getElementById('gameMenu').remove()">❌ 닫기</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', menuHTML);
        this.addGameMenuStyles();
    }
    
    /**
     * 게임 메뉴 스타일 추가
     */
    addGameMenuStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .game-menu {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            
            .menu-content {
                background: var(--bg-primary);
                border: 2px solid var(--neon-cyan);
                border-radius: 15px;
                padding: 30px;
                display: flex;
                flex-direction: column;
                gap: 15px;
                min-width: 250px;
            }
            
            .menu-content h3 {
                color: var(--neon-cyan);
                text-align: center;
                margin: 0 0 20px 0;
            }
            
            .menu-content button {
                padding: 12px 20px;
                background: var(--bg-secondary);
                border: 1px solid var(--border);
                border-radius: 8px;
                color: var(--text-primary);
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 16px;
            }
            
            .menu-content button:hover {
                background: var(--neon-blue);
                color: #000;
                transform: translateY(-2px);
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 디버그 데이터 가져오기
     */
    getDebugData() {
        return {
            fps: Math.round(1000 / 16.67), // 추정 FPS
            gameState: this.gameState,
            connectedSensors: this.gameStateManager?.getGameState().sessionInfo.connectedSensors || 0,
            testMode: this.testMode,
            player1: this.drones.player1?.getData?.() || null,
            player2: this.drones.player2?.getData?.() || null,
            physicsInfo: this.physics?.getDebugInfo?.() || null
        };
    }
    
    /**
     * 윈도우 리사이즈 처리
     */
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        
        // 듀얼 카메라 aspect ratio 업데이트
        this.cameras.player1.aspect = 0.5;
        this.cameras.player1.updateProjectionMatrix();
        
        this.cameras.player2.aspect = 0.5;
        this.cameras.player2.updateProjectionMatrix();
    }
    
    /**
     * 게임 루프 (렌더링 문제 해결을 위해 개선)
     */
    gameLoop() {
        const now = performance.now();
        const deltaTime = this.lastFrameTime ? (now - this.lastFrameTime) / 1000 : 1/60;
        this.lastFrameTime = now;
        
        // 물리 시뮬레이션 업데이트
        if (this.physics && this.gameState === 'racing' && !this.isPaused) {
            this.physics.update(Math.min(deltaTime, 1/30)); // 최대 deltaTime 제한
        }
        
        // 드론 업데이트
        if (this.gameState === 'racing' && !this.isPaused) {
            this.updateDrones(deltaTime);
            this.updateCollisionEffects();
        }
        
        // 카메라 추적 업데이트 (항상 실행하여 드론이 항상 보이도록)
        this.updateCameraTracking();
        
        // 효과 시스템 업데이트
        if (this.effects) {
            this.effects.update(deltaTime);
        }
        
        // 센서 연결 상태 모니터링 (매 10프레임마다)
        if (this.gameState === 'racing' && this.frameCount % 10 === 0) {
            this.detectSensorDisconnection();
            this.updateConnectionStatus();
        }
        
        // UI 업데이트 (매 5프레임마다)
        if (this.ui && (this.gameState === 'racing' || this.gameState === 'countdown') && this.frameCount % 5 === 0) {
            this.updateUI();
            if (this.gameState === 'racing') {
                this.updateRealTimeRankings();
            }
        }
        
        // 카운트다운 상태일 때 카운트다운 요소 표시 확인 (매 30프레임마다)
        if (this.gameState === 'countdown' && this.frameCount % 30 === 0) {
            const countdownElement = document.getElementById('countdown');
            if (countdownElement) {
                // 카운트다운 요소가 숨겨져 있거나 표시되지 않으면 다시 표시
                if (countdownElement.classList.contains('hidden') || 
                    countdownElement.style.display === 'none' ||
                    countdownElement.style.visibility === 'hidden' ||
                    countdownElement.style.opacity === '0') {
                    
                    console.log('⚠️ 카운트다운 요소가 숨겨져 있습니다. 다시 표시합니다.');
                    countdownElement.classList.remove('hidden');
                    countdownElement.style.display = 'block';
                    countdownElement.style.visibility = 'visible';
                    countdownElement.style.opacity = '1';
                    countdownElement.style.zIndex = '9999';
                    countdownElement.style.position = 'fixed';
                    countdownElement.style.top = '50%';
                    countdownElement.style.left = '50%';
                    countdownElement.style.transform = 'translate(-50%, -50%)';
                    countdownElement.style.fontSize = '15vw';
                    countdownElement.style.fontWeight = 'bold';
                    countdownElement.style.color = '#ffaa00';
                    countdownElement.style.textShadow = '0 0 30px #ffaa00, 0 0 60px #ffaa00';
                }
            }
        }
        
        // 성능 최적화 (매 30프레임마다)
        if (this.performanceOptimizer && this.frameCount % 30 === 0) {
            this.performanceOptimizer.optimizeParticleSystem();
        }
        
        // 렌더링 (항상 실행하여 모든 오브젝트가 표시되도록)
        this.render();
        
        // 프레임 카운터 증가
        this.frameCount = (this.frameCount || 0) + 1;
        
        // 다음 프레임 요청
        requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * 드론 업데이트
     */
    updateDrones(deltaTime) {
        // 키보드 테스트 모드에서 드론 조작
        if (this.testMode) {
            if (this.drones.player1) {
                this.drones.player1.updateFromKeyboard(this.keyboardControls.player1);
            }
            if (this.drones.player2) {
                this.drones.player2.updateFromKeyboard(this.keyboardControls.player2);
            }
        }
        
        // 부스터 존 충전 처리
        this.updateBoosterZoneCharging(deltaTime);
        
        // 모든 드론 업데이트 및 트레일 효과
        Object.entries(this.drones).forEach(([droneId, drone]) => {
            if (drone && drone.update) {
                drone.update(deltaTime);
                
                // 드론 트레일 효과 생성
                if (this.effects && drone.mesh && drone.body) {
                    const position = drone.mesh.position;
                    const velocity = drone.body.velocity;
                    const color = droneId === 'player1' ? 0x00ff88 : 0xff0088;
                    
                    // 드론이 움직이고 있을 때만 트레일 생성
                    if (velocity.length() > 1) {
                        this.effects.createDroneTrail(droneId, position, velocity, color);
                    }
                    
                    // 부스터 활성화 시 파티클 효과
                    const droneData = drone.getData ? drone.getData() : {};
                    if (droneData.booster && droneData.booster.isActive) {
                        const direction = new THREE.Vector3(velocity.x, velocity.y, velocity.z).normalize();
                        this.effects.createBoosterParticles(position, direction, 1.5);
                    }
                }
            }
        });
    }
    
    /**
     * 부스터 존 충전 처리
     */
    updateBoosterZoneCharging(deltaTime) {
        if (!this.boosterZones) return;
        
        // 모든 드론에 대해 부스터 존 확인
        Object.entries(this.drones).forEach(([droneId, drone]) => {
            if (!drone || !drone.body) return;
            
            let isInAnyZone = false;
            let currentZone = null;
            
            // 각 부스터 존과의 거리 확인
            this.boosterZones.forEach((zone, zoneIndex) => {
                if (!zone.body) return;
                
                const distance = drone.body.position.distanceTo(zone.body.position);
                
                if (distance < 4) { // 부스터 존 반경 내
                    isInAnyZone = true;
                    currentZone = zone;
                    
                    // 부스터 충전
                    const wasCharging = drone.chargeBoosterInZone(deltaTime);
                    
                    // 충전 중일 때 시각 효과 강화
                    if (wasCharging) {
                        zone.mesh.material.opacity = 0.9;
                        zone.glow.material.opacity = 0.8;
                        zone.glow.scale.setScalar(1.2);
                        
                        // 충전 파티클 효과 (간단한 구현)
                        this.createChargingEffect(drone.mesh.position, zoneIndex);
                        
                        // UI에 충전 상태 표시
                        if (this.ui) {
                            this.ui.showToast(`${droneId === 'player1' ? '플레이어 1' : '플레이어 2'} 부스터 충전 중...`, 'info', 500);
                        }
                    }
                } else {
                    // 부스터 존에서 벗어났을 때 원래 상태로 복원
                    zone.mesh.material.opacity = 0.6;
                    zone.glow.material.opacity = 0.3;
                    zone.glow.scale.setScalar(1.0);
                }
            });
            
            // 드론이 부스터 존을 벗어났으면 효과 해제
            if (!isInAnyZone) {
                drone.exitBoosterZone();
            }
        });
    }
    
    /**
     * 부스터 충전 효과 생성
     */
    createChargingEffect(dronePosition, zoneIndex) {
        // 간단한 충전 효과 (매 프레임마다 호출되므로 가벼워야 함)
        if (Math.random() < 0.1) { // 10% 확률로만 파티클 생성
            const particleGeometry = new THREE.SphereGeometry(0.1);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                dronePosition.x + (Math.random() - 0.5) * 4,
                dronePosition.y + Math.random() * 2,
                dronePosition.z + (Math.random() - 0.5) * 4
            );
            
            this.scene.add(particle);
            
            // 파티클 애니메이션
            const startTime = Date.now();
            const animateParticle = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / 1000; // 1초 지속
                
                if (progress < 1 && particle.parent) {
                    particle.position.y += 0.05;
                    particle.material.opacity = 0.8 * (1 - progress);
                    particle.scale.setScalar(1 + progress);
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            
            animateParticle();
        }
    }
    
    /**
     * UI 업데이트
     */
    updateUI() {
        if (!this.ui) return;
        
        // 각 플레이어의 HUD 업데이트
        Object.entries(this.drones).forEach(([playerId, drone]) => {
            if (drone && drone.getData) {
                this.ui.updatePlayerHUD(playerId, drone.getData());
            }
        });
    }
    
    /**
     * 카메라 추적 업데이트
     */
    updateCameraFollow() {
        // 플레이어 1 카메라가 드론을 따라가도록
        if (this.drones.player1 && this.drones.player1.mesh) {
            const drone1Pos = this.drones.player1.mesh.position;
            this.cameras.player1.position.set(
                drone1Pos.x - 10,
                drone1Pos.y + 8,
                drone1Pos.z + 15
            );
            this.cameras.player1.lookAt(drone1Pos);
        }
        
        // 플레이어 2 카메라가 드론을 따라가도록
        if (this.drones.player2 && this.drones.player2.mesh) {
            const drone2Pos = this.drones.player2.mesh.position;
            this.cameras.player2.position.set(
                drone2Pos.x + 10,
                drone2Pos.y + 8,
                drone2Pos.z + 15
            );
            this.cameras.player2.lookAt(drone2Pos);
        }
    }
    
    /**
     * 디버그 정보 업데이트
     */
    updateDebugInfo() {
        if (!this.testMode || !this.ui) return;
        
        const debugData = {
            fps: Math.round(1000 / 16.67), // 대략적인 FPS
            gameState: this.gameState,
            connectedSensors: Object.keys(this.drones).length,
            testMode: this.testMode,
            player1: this.drones.player1?.getData(),
            player2: this.drones.player2?.getData()
        };
        
        this.ui.showDebugInfo(debugData);
    }
    
    /**
     * 경주 완주 처리
     */
    handleRaceFinished(playerId, raceData) {
        console.log(`🏁 ${playerId} 경주 완주!`, raceData);
        
        // 게임 상태 변경
        this.gameState = 'finished';
        
        // 결과 데이터 준비
        const resultsData = {
            winner: playerId,
            raceTime: Date.now() - this.raceStartTime,
            player1Data: this.drones.player1?.getData() || {},
            player2Data: this.drones.player2?.getData() || {}
        };
        
        // 결과 화면 표시
        if (this.ui) {
            this.ui.showResults(resultsData);
        }
    }
    
    /**
     * 렌더링 (모든 오브젝트가 항상 표시되도록 개선)
     */
    render() {
        if (!this.renderer || !this.scene) {
            console.warn('⚠️ 렌더러 또는 씬이 초기화되지 않았습니다');
            return;
        }
        
        const renderStart = performance.now();
        
        // 씬 오브젝트 수 확인 (디버깅용) - 로그 빈도 줄임
        if (this.frameCount % 300 === 0) { // 5초마다 한 번
            console.log(`🎬 렌더링 - 씬 오브젝트 수: ${this.scene.children.length}`);
            console.log(`🎬 드론 메시 존재 여부: player1=${!!this.drones.player1?.mesh}, player2=${!!this.drones.player2?.mesh}`);
            
            // 드론 위치 확인
            if (this.drones.player1?.mesh) {
                console.log(`🎬 Player1 드론 위치:`, this.drones.player1.mesh.position);
            }
            if (this.drones.player2?.mesh) {
                console.log(`🎬 Player2 드론 위치:`, this.drones.player2.mesh.position);
            }
        }
        
        // 드론 메시가 씬에 있는지 확인하고 없으면 다시 추가
        if (this.drones.player1?.mesh && !this.scene.children.includes(this.drones.player1.mesh)) {
            console.warn('⚠️ Player1 드론 메시가 씬에서 사라졌습니다. 다시 추가합니다.');
            this.scene.add(this.drones.player1.mesh);
        }
        if (this.drones.player2?.mesh && !this.scene.children.includes(this.drones.player2.mesh)) {
            console.warn('⚠️ Player2 드론 메시가 씬에서 사라졌습니다. 다시 추가합니다.');
            this.scene.add(this.drones.player2.mesh);
        }
        
        // 화면 분할 렌더링
        const width = window.innerWidth;
        const height = window.innerHeight;
        const halfWidth = width / 2;
        
        // 렌더러 설정
        this.renderer.setScissorTest(true);
        this.renderer.setClearColor(0x0f172a, 1); // 어두운 파란색 배경 (fog와 일치)
        
        // 캔버스 크기 확인 및 조정
        if (this.renderer.domElement.width !== width || this.renderer.domElement.height !== height) {
            this.renderer.setSize(width, height);
            console.log(`🎬 캔버스 크기 조정: ${width}x${height}`);
        }
        
        // 왼쪽 화면 (플레이어 1) 렌더링
        this.cameras.player1.aspect = halfWidth / height;
        this.cameras.player1.updateProjectionMatrix();
        
        this.renderer.setViewport(0, 0, halfWidth, height);
        this.renderer.setScissor(0, 0, halfWidth, height);
        this.renderer.clear(true, true, true); // color, depth, stencil 모두 클리어
        this.renderer.render(this.scene, this.cameras.player1);
        
        // 오른쪽 화면 (플레이어 2) 렌더링
        this.cameras.player2.aspect = halfWidth / height;
        this.cameras.player2.updateProjectionMatrix();
        
        this.renderer.setViewport(halfWidth, 0, halfWidth, height);
        this.renderer.setScissor(halfWidth, 0, halfWidth, height);
        this.renderer.clear(true, true, true); // color, depth, stencil 모두 클리어
        this.renderer.render(this.scene, this.cameras.player2);
        
        // 스크린 분할 해제
        this.renderer.setScissorTest(false);
        
        // 성능 통계 업데이트
        if (this.performanceOptimizer) {
            this.performanceOptimizer.performanceStats.renderTime = performance.now() - renderStart;
        }
        
        // 강제로 WebGL 컨텍스트 플러시 (브라우저 호환성 개선)
        const gl = this.renderer.getContext();
        if (gl) {
            gl.flush();
        }
    }
    
    /**
     * 성능 모니터링 UI 설정
     */
    setupPerformanceMonitoring() {
        // 개발자 모드 토글 (F12 키)
        document.addEventListener('keydown', (event) => {
            if (event.key === 'F12') {
                event.preventDefault();
                this.togglePerformancePanel();
            }
            
            // 성능 통계 출력 (Ctrl + P)
            if (event.ctrlKey && event.key === 'p') {
                event.preventDefault();
                this.showPerformanceStats();
            }
        });
        
        // 성능 모니터링 UI 업데이트 (1초마다)
        setInterval(() => {
            this.updatePerformanceUI();
        }, 1000);
    }
    
    /**
     * 성능 패널 토글
     */
    togglePerformancePanel() {
        const panel = document.getElementById('performancePanel');
        if (panel) {
            panel.classList.toggle('hidden');
            
            if (!panel.classList.contains('hidden')) {
                console.log('🚀 성능 모니터링 패널 활성화');
                if (this.ui) {
                    this.ui.showToast('성능 모니터링 활성화 (F12로 토글)', 'info', 3000);
                }
            }
        }
    }
    
    /**
     * 성능 UI 업데이트
     */
    updatePerformanceUI() {
        if (!this.performanceOptimizer) return;
        
        const stats = this.performanceOptimizer.getPerformanceStats();
        
        // FPS 업데이트
        const fpsElement = document.getElementById('fpsValue');
        if (fpsElement) {
            fpsElement.textContent = stats.fps;
            fpsElement.style.color = stats.fps >= 50 ? '#00ff88' : stats.fps >= 30 ? '#ffaa00' : '#ff4444';
        }
        
        // 프레임 시간 업데이트
        const frameTimeElement = document.getElementById('frameTimeValue');
        if (frameTimeElement) {
            frameTimeElement.textContent = `${stats.frameTime.toFixed(2)}ms`;
        }
        
        // 메모리 사용량 업데이트
        const memoryElement = document.getElementById('memoryValue');
        if (memoryElement) {
            memoryElement.textContent = `${stats.memoryMB}MB`;
        }
        
        // 파티클 수 업데이트
        const particleElement = document.getElementById('particleValue');
        if (particleElement) {
            particleElement.textContent = stats.particleCount;
        }
        
        // 품질 설정 업데이트
        const qualityElement = document.getElementById('qualityValue');
        if (qualityElement) {
            qualityElement.textContent = stats.quality.toUpperCase();
            qualityElement.style.color = 
                stats.quality === 'high' ? '#00ff88' : 
                stats.quality === 'medium' ? '#ffaa00' : '#ff4444';
        }
    }
    
    /**
     * 성능 통계 콘솔 출력
     */
    showPerformanceStats() {
        if (!this.performanceOptimizer) {
            console.log('성능 최적화 시스템이 초기화되지 않았습니다.');
            return;
        }
        
        const stats = this.performanceOptimizer.showDebugInfo();
        
        // 추가 게임 관련 통계
        const gameStats = {
            '게임 상태': this.gameState,
            '드론 수': Object.keys(this.drones).length,
            '물리 바디 수': this.physics ? this.physics.bodies.size : 0,
            '효과 통계': this.effects ? this.effects.getPerformanceStats() : null,
            '물리 통계': this.physics ? this.physics.getPerformanceStats() : null
        };
        
        console.log('🎮 게임 통계:', gameStats);
        
        return { performance: stats, game: gameStats };
    }
}

// 게임 시작 (단일 인스턴스 보장)
let game = null;
let isInitializing = false;

// 게임 초기화 함수
function initializeGame() {
    // 이미 게임이 초기화되었거나 초기화 중이면 중복 초기화 방지
    if (game || isInitializing) {
        console.log('⚠️ 게임이 이미 초기화되었거나 초기화 중입니다');
        return;
    }
    
    isInitializing = true;
    
    try {
        console.log('🎮 게임 초기화 시작');
        game = new DroneRacingGame();
        
        // 전역 함수로 노출 (HTML에서 호출용)
        window.game = game;
        window.droneRacingGame = game; // 추가 참조
        
        console.log('✅ 게임 초기화 완료, 전역 변수 설정됨');
    } catch (error) {
        console.error('❌ 게임 초기화 실패:', error);
        game = null; // 실패 시 초기화
    } finally {
        isInitializing = false;
    }
}

// DOM이 완전히 로드된 후 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM 로드 완료');
    // 약간의 지연을 두어 모든 스크립트가 로드되도록
    setTimeout(initializeGame, 100);
});

// 윈도우 로드 이벤트는 백업으로만 사용
window.addEventListener('load', () => {
    if (!game && !isInitializing) {
        console.log('🔄 윈도우 로드 이벤트에서 게임 초기화 재시도');
        setTimeout(initializeGame, 100);
    }
});