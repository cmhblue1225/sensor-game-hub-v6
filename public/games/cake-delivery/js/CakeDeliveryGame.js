/**
 * 케이크 배달 게임 - 메인 게임 클래스
 * 모든 시스템을 통합하고 게임 로직을 관리
 */
class CakeDeliveryGame {
    constructor() {
        // 기본 상태 먼저 초기화
        this.gameState = 'loading';
        this.gameMode = 'normal';
        this.cakeType = 'basic';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        // 시스템들 초기화 전에 null로 설정
        this.gameEngine = null;
        this.sdk = null;
        this.mobileInterface = null;
        this.accessibilitySystem = null;
        this.tutorialManager = null;
        this.errorHandler = null;
        this.saveSystem = null;
        this.difficultySystem = null;
        this.multiplayerBalancing = null;
        this.performanceMonitor = null;
        this.errorReporter = null;
        
        // UI 요소들
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.sessionCode = document.getElementById('sessionCode');
        this.connectionStatus = document.getElementById('connectionStatus');
        
        console.log('🎂 CakeDeliveryGame 생성자 완료, 지연된 초기화 시작...');
        
        // 안전한 지연 초기화 - DOM이 완전히 로드된 후 실행
        setTimeout(() => {
            this.initializeSystems();
        }, 100);
    }
    
    /**
     * 시스템들의 안전한 초기화
     */
    async initializeSystems() {
        try {
            console.log('🔧 시스템 초기화 시작...');
            
            // 1. 핵심 시스템들 먼저 초기화 (순서 중요)
            this.errorHandler = new ErrorHandlingSystem();
            console.log('✅ 오류 처리 시스템 초기화 완료');
            
            this.saveSystem = new SaveSystem();
            console.log('✅ 저장 시스템 초기화 완료');
            
            // 2. 성능 모니터링 시스템 초기화
            this.performanceMonitor = this.initializePerformanceMonitor();
            console.log('✅ 성능 모니터링 시스템 초기화 완료');
            
            // 3. 오류 리포팅 시스템 초기화
            this.errorReporter = typeof ErrorReporter !== 'undefined' ? new ErrorReporter() : null;
            console.log('✅ 오류 리포팅 시스템 초기화 완료');
            
            // 4. 게임 엔진 초기화
            this.gameEngine = new GameEngine();
            console.log('✅ 게임 엔진 초기화 완료');
            
            // 5. SessionSDK 초기화
            this.sdk = new SessionSDK({
                gameId: 'cake-delivery',
                gameType: 'solo',
                debug: true
            });
            console.log('✅ SessionSDK 초기화 완료');
            
            // 6. 난이도 및 밸런싱 시스템 초기화
            this.difficultySystem = new AdaptiveDifficultySystem();
            this.multiplayerBalancing = new MultiplayerBalancingSystem();
            console.log('✅ 난이도 및 밸런싱 시스템 초기화 완료');
            
            // 7. 게임 초기화 실행
            await this.init();
            
        } catch (error) {
            console.error('❌ 시스템 초기화 실패:', error);
            this.showError(`시스템 초기화에 실패했습니다: ${error.message}`);
        }
    }
    
    /**
     * 성능 모니터링 시스템 안전 초기화
     */
    initializePerformanceMonitor() {
        try {
            if (typeof PerformanceMonitor !== 'undefined') {
                return new PerformanceMonitor();
            } else {
                console.warn('⚠️ PerformanceMonitor를 사용할 수 없습니다. 기본 모니터링을 사용합니다.');
                return this.createFallbackPerformanceMonitor();
            }
        } catch (error) {
            console.error('❌ PerformanceMonitor 초기화 실패:', error);
            return this.createFallbackPerformanceMonitor();
        }
    }
    
    /**
     * 대체 성능 모니터링 시스템 생성
     */
    createFallbackPerformanceMonitor() {
        return {
            metrics: {
                fps: { current: 0, average: 0, min: Infinity, max: 0, history: [] },
                memory: { used: 0, total: 0, percentage: 0 },
                network: { latency: 0 }
            },
            config: { enabled: true, updateInterval: 1000, historySize: 60 },
            startMonitoring: () => console.log('기본 성능 모니터링 시작'),
            stopMonitoring: () => console.log('기본 성능 모니터링 중지'),
            getMetrics: function() { return this.metrics; },
            updateFPS: () => {},
            updateMemory: () => {},
            updateNetwork: () => {},
            getDebugInfo: () => ({ fps: 60, memory: '알 수 없음', network: '알 수 없음' })
        };
    }

    /**
     * 게임 초기화
     */
    async init() {
        try {
            console.log('🎮 케이크 배달 게임 초기화 시작...');
            
            // SessionSDK 이벤트 설정
            this.setupSDKEvents();
            
            // 게임 엔진이 초기화될 때까지 대기
            await this.waitForEngineReady();
            
            // UI 이벤트 설정
            this.setupUIEvents();
            
            // 모바일 터치 인터페이스 초기화
            this.setupMobileInterface();
            
            // 접근성 시스템 초기화
            this.setupAccessibilitySystem();
            
            // 튜토리얼 시스템 초기화
            this.setupTutorialSystem();
            
            // 오류 처리 시스템 설정
            this.setupErrorHandling();
            
            // 저장 시스템 설정
            this.setupSaveSystem();
            
            // 적응형 난이도 시스템 설정
            this.setupDifficultySystem();
            
            // 멀티플레이어 밸런싱 시스템 설정
            this.setupMultiplayerBalancing();
            
            // 성능 모니터링 시스템 설정
            this.setupPerformanceMonitoring();
            
            // 오류 리포팅 시스템 설정
            this.setupErrorReporting();
            
            console.log('✅ 케이크 배달 게임 초기화 완료');
            
        } catch (error) {
            console.error('❌ 게임 초기화 실패:', error);
            this.showError('게임 초기화에 실패했습니다.');
        }
    }
    
    /**
     * SessionSDK 이벤트 설정
     */
    setupSDKEvents() {
        try {
            // 안전성 검사
            if (!this.sdk) {
                console.warn('⚠️ SessionSDK가 초기화되지 않았습니다.');
                return;
            }
            
            // 서버 연결 완료 후 세션 생성
            this.sdk.on('connected', () => {
                console.log('✅ 서버 연결 완료');
                this.createSession();
            });
        
        // 세션 생성 완료
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            console.log('세션 생성됨:', session);
            this.displaySessionInfo(session);
        });
        
        // 센서 연결
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            console.log('센서 연결됨:', data.sensorId);
            this.updateConnectionStatus('센서 연결됨 ✅');
            
            // 진동 피드백
            if ('vibrate' in navigator) {
                navigator.vibrate(200);
            }
        });
        
            // 센서 데이터 수신
            this.sdk.on('sensor-data', (event) => {
                const data = event.detail || event;
                this.processSensorData(data);
            });
            
            // 게임 준비 완료
            this.sdk.on('game-ready', (event) => {
                const data = event.detail || event;
                console.log('게임 준비 완료');
                this.startGame();
            });
            
            // 센서 연결 해제
            this.sdk.on('sensor-disconnected', (event) => {
                const data = event.detail || event;
                console.log('센서 연결 해제:', data.sensorId);
                this.updateConnectionStatus('센서 연결 해제됨 ❌');
            });
            
            console.log('✅ SessionSDK 이벤트 설정 완료');
            
        } catch (error) {
            console.error('❌ SessionSDK 이벤트 설정 실패:', error);
            this.showError('SessionSDK 이벤트 설정에 실패했습니다.');
        }
    }
    
    /**
     * 게임 엔진 준비 대기
     */
    async waitForEngineReady() {
        return new Promise((resolve, reject) => {
            // 안전성 검사
            if (!this.gameEngine) {
                console.error('❌ 게임 엔진이 초기화되지 않았습니다.');
                reject(new Error('게임 엔진이 초기화되지 않았습니다.'));
                return;
            }
            
            let attempts = 0;
            const maxAttempts = 100; // 10초 제한
            
            const checkReady = () => {
                attempts++;
                
                if (attempts > maxAttempts) {
                    console.error('❌ 게임 엔진 준비 시간 초과');
                    reject(new Error('게임 엔진 준비 시간 초과'));
                    return;
                }
                
                if (this.gameEngine && this.gameEngine.gameState === 'menu') {
                    console.log('✅ 게임 엔진 준비 완료');
                    resolve();
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();
        });
    }
    
    /**
     * UI 이벤트 설정
     */
    setupUIEvents() {
        // 재시작 버튼
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', () => this.restartGame());
        }
        
        // 일시정지 버튼
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => this.togglePause());
        }
    }
    
    /**
     * 모바일 터치 인터페이스 설정
     */
    setupMobileInterface() {
        try {
            // MobileTouchInterface 초기화
            this.mobileInterface = new MobileTouchInterface(this.gameEngine);
            
            // 모바일 인터페이스 이벤트 연결
            this.connectMobileInterfaceEvents();
            
            console.log('✅ 모바일 터치 인터페이스 초기화 완료');
        } catch (error) {
            console.warn('⚠️ 모바일 터치 인터페이스 초기화 실패:', error);
            // 모바일 인터페이스 없이도 게임이 동작하도록 함
        }
    }
    
    /**
     * 모바일 인터페이스 이벤트 연결
     */
    connectMobileInterfaceEvents() {
        if (!this.mobileInterface) return;
        
        // 게임 상태 변경 시 모바일 인터페이스에 알림
        const originalStartGame = this.startGame.bind(this);
        this.startGame = () => {
            originalStartGame();
            if (this.mobileInterface) {
                this.mobileInterface.provideTouchFeedback('success');
            }
        };
        
        const originalGameOver = this.gameOver.bind(this);
        this.gameOver = (message) => {
            if (this.mobileInterface) {
                this.mobileInterface.provideTouchFeedback('error');
            }
            originalGameOver(message);
        };
        
        const originalNextLevel = this.nextLevel.bind(this);
        this.nextLevel = () => {
            if (this.mobileInterface) {
                this.mobileInterface.provideTouchFeedback('success');
            }
            originalNextLevel();
        };
    }
    
    /**
     * 다음 모드로 전환 (모바일 인터페이스에서 호출)
     */
    switchToNextMode() {
        const modes = ['normal', 'challenge', 'zen'];
        const currentIndex = modes.indexOf(this.gameMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.gameMode = modes[nextIndex];
        
        console.log(`🔄 게임 모드 변경: ${this.gameMode}`);
        this.applyGameMode();
    }
    
    /**
     * 이전 모드로 전환 (모바일 인터페이스에서 호출)
     */
    switchToPreviousMode() {
        const modes = ['normal', 'challenge', 'zen'];
        const currentIndex = modes.indexOf(this.gameMode);
        const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
        this.gameMode = modes[prevIndex];
        
        console.log(`🔄 게임 모드 변경: ${this.gameMode}`);
        this.applyGameMode();
    }
    
    /**
     * 게임 모드 적용
     */
    applyGameMode() {
        switch (this.gameMode) {
            case 'normal':
                // 일반 모드 설정
                break;
            case 'challenge':
                // 도전 모드 설정 (더 어려운 물리)
                if (this.gameEngine.physicsManager) {
                    this.gameEngine.physicsManager.world.gravity.set(0, -12, 0);
                }
                break;
            case 'zen':
                // 젠 모드 설정 (쉬운 물리)
                if (this.gameEngine.physicsManager) {
                    this.gameEngine.physicsManager.world.gravity.set(0, -8, 0);
                }
                break;
        }
    }
    
    /**
     * 접근성 시스템 설정
     */
    setupAccessibilitySystem() {
        try {
            // AccessibilitySystem 초기화
            this.accessibilitySystem = new AccessibilitySystem();
            
            // 접근성 시스템 이벤트 연결
            this.connectAccessibilityEvents();
            
            console.log('✅ 접근성 시스템 초기화 완료');
        } catch (error) {
            console.warn('⚠️ 접근성 시스템 초기화 실패:', error);
            // 접근성 시스템 없이도 게임이 동작하도록 함
        }
    }
    
    /**
     * 접근성 시스템 이벤트 연결
     */
    connectAccessibilityEvents() {
        if (!this.accessibilitySystem) return;
        
        // 게임 상태 변경 시 접근성 시스템에 알림
        const originalStartGame = this.startGame;
        this.startGame = () => {
            originalStartGame.call(this);
            if (this.accessibilitySystem) {
                this.accessibilitySystem.announceGameState('started');
            }
        };
        
        const originalTogglePause = this.togglePause;
        this.togglePause = () => {
            const wasPaused = this.gameState === 'paused';
            originalTogglePause.call(this);
            
            if (this.accessibilitySystem) {
                this.accessibilitySystem.announceGameState(
                    wasPaused ? 'resumed' : 'paused'
                );
            }
        };
        
        const originalGameOver = this.gameOver;
        this.gameOver = (message) => {
            if (this.accessibilitySystem) {
                this.accessibilitySystem.announceGameState('gameOver', message);
            }
            originalGameOver.call(this, message);
        };
        
        const originalNextLevel = this.nextLevel;
        this.nextLevel = () => {
            originalNextLevel.call(this);
            if (this.accessibilitySystem) {
                this.accessibilitySystem.announceGameState('levelUp', this.level);
            }
        };
        
        // 점수 변경 알림
        const originalUpdateUI = this.updateUI;
        this.updateUI = () => {
            const oldScore = this.score;
            originalUpdateUI.call(this);
            
            if (this.accessibilitySystem && oldScore !== this.score) {
                this.accessibilitySystem.announceGameState('scoreChange', this.score);
            }
        };
    }
    
    /**
     * 튜토리얼 시스템 설정
     */
    setupTutorialSystem() {
        try {
            // InteractiveTutorialManager 초기화
            this.tutorialManager = new InteractiveTutorialManager(this.gameEngine);
            
            // 튜토리얼 시스템 이벤트 연결
            this.connectTutorialEvents();
            
            // 첫 실행 시 튜토리얼 자동 시작
            if (this.isFirstTime()) {
                setTimeout(() => {
                    this.tutorialManager.startTutorial();
                }, 2000);
            }
            
            console.log('✅ 튜토리얼 시스템 초기화 완료');
        } catch (error) {
            console.warn('⚠️ 튜토리얼 시스템 초기화 실패:', error);
            // 튜토리얼 시스템 없이도 게임이 동작하도록 함
        }
    }
    
    /**
     * 튜토리얼 시스템 이벤트 연결
     */
    connectTutorialEvents() {
        if (!this.tutorialManager) return;
        
        // 센서 연결 시 튜토리얼 진행
        const originalSensorConnected = this.sdk.on.bind(this.sdk);
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            console.log('센서 연결됨:', data.sensorId);
            this.updateConnectionStatus('센서 연결됨 ✅');
            
            // 튜토리얼이 활성화된 경우 다음 단계로 진행
            if (this.tutorialManager.isActive) {
                this.tutorialManager.validateCurrentStep();
            }
            
            // 진동 피드백
            if ('vibrate' in navigator) {
                navigator.vibrate(200);
            }
        });
        
        // 게임 시작 시 튜토리얼 체크
        const originalStartGame = this.startGame;
        this.startGame = () => {
            // 튜토리얼이 활성화된 경우 튜토리얼 모드로 시작
            if (this.tutorialManager && this.tutorialManager.isActive) {
                this.tutorialManager.onGameStart();
            }
            
            originalStartGame.call(this);
        };
        
        // 센서 데이터 처리 시 튜토리얼 검증
        const originalProcessSensorData = this.processSensorData;
        this.processSensorData = (sensorData) => {
            // 튜토리얼 중인 경우 센서 데이터 검증
            if (this.tutorialManager && this.tutorialManager.isActive) {
                this.tutorialManager.processTutorialSensorData(sensorData);
            }
            
            originalProcessSensorData.call(this, sensorData);
        };
    }
    
    /**
     * 첫 실행 여부 확인
     */
    isFirstTime() {
        try {
            const hasPlayedBefore = localStorage.getItem('cakeDeliveryPlayed');
            return !hasPlayedBefore;
        } catch (error) {
            return true; // 로컬 스토리지 접근 실패 시 첫 실행으로 간주
        }
    }
    
    /**
     * 첫 실행 기록
     */
    markAsPlayed() {
        try {
            localStorage.setItem('cakeDeliveryPlayed', 'true');
        } catch (error) {
            console.warn('로컬 스토리지 저장 실패:', error);
        }
    }
    
    /**
     * 튜토리얼 시작 (외부에서 호출 가능)
     */
    startTutorial() {
        if (this.tutorialManager) {
            this.tutorialManager.startTutorial();
        }
    }
    
    /**
     * 튜토리얼 건너뛰기 (외부에서 호출 가능)
     */
    skipTutorial() {
        if (this.tutorialManager) {
            this.tutorialManager.skipTutorial();
            this.markAsPlayed();
        }
    }
    
    /**
     * 세션 생성
     */
    async createSession() {
        try {
            // 안전성 검사
            if (!this.sdk) {
                console.error('❌ SessionSDK가 초기화되지 않아 세션을 생성할 수 없습니다.');
                return;
            }
            
            const session = await this.sdk.createSession();
            console.log('✅ 세션 생성 성공');
        } catch (error) {
            console.error('❌ 세션 생성 실패:', error);
            // 3초 후 재시도
            setTimeout(() => this.createSession(), 3000);
        }
    }
    
    /**
     * 세션 정보 표시
     */
    displaySessionInfo(session) {
        if (this.sessionCode) {
            this.sessionCode.textContent = session.sessionCode;
        }
        
        const qrUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
        const qrContainer = document.getElementById('qrContainer');
        
        if (qrContainer) {
            qrContainer.innerHTML = '';
            
            // QR 코드 생성
            if (typeof QRCode !== 'undefined') {
                try {
                    QRCode.toCanvas(document.createElement('canvas'), qrUrl, { width: 150 }, (error, canvas) => {
                        if (!error) {
                            qrContainer.appendChild(canvas);
                        } else {
                            this.showQRCodeFallback(qrUrl, qrContainer);
                        }
                    });
                } catch (error) {
                    this.showQRCodeFallback(qrUrl, qrContainer);
                }
            } else {
                this.showQRCodeFallback(qrUrl, qrContainer);
            }
        }
    }
    
    /**
     * QR 코드 폴백 처리
     */
    showQRCodeFallback(url, container) {
        const img = document.createElement('img');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
        img.alt = 'QR Code';
        img.width = 150;
        img.height = 150;
        container.appendChild(img);
    }
    
    /**
     * 연결 상태 업데이트
     */
    updateConnectionStatus(status) {
        if (this.connectionStatus) {
            this.connectionStatus.textContent = status;
        }
    }
    
    /**
     * 센서 데이터 처리
     */
    processSensorData(sensorData) {
        if (this.gameEngine && this.gameState === 'playing') {
            this.gameEngine.processSensorData(sensorData);
        }
    }
    
    /**
     * 게임 시작
     */
    startGame() {
        this.gameState = 'playing';
        this.gameEngine.startGame();
        this.updateUI();
        console.log('🎮 게임 시작!');
    }
    
    /**
     * 게임 재시작
     */
    restartGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        this.gameEngine.restartGame();
        this.updateUI();
        
        console.log('🔄 게임 재시작');
    }
    
    /**
     * 게임 일시정지/재개
     */
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.gameEngine.togglePause();
            console.log('⏸️ 게임 일시정지');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameEngine.togglePause();
            console.log('▶️ 게임 재개');
        }
    }
    
    /**
     * UI 업데이트
     */
    updateUI() {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `점수: ${this.score}`;
        }
        
        if (this.levelDisplay) {
            this.levelDisplay.textContent = `레벨: ${this.level}`;
        }
        
        if (this.timerDisplay) {
            this.timerDisplay.textContent = `시간: ${this.gameEngine.timeLeft}초`;
        }
    }
    
    /**
     * 케이크 불안정 상태 처리
     */
    onCakeInstability() {
        console.log('⚠️ 케이크 불안정!');
        // 경고 효과 표시
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    }
    
    /**
     * 케이크 전복 처리
     */
    onCakeOverturned() {
        console.log('💥 케이크 전복!');
        this.lives--;
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.restartLevel();
        }
    }
    
    /**
     * 케이크 충돌 처리
     */
    onCakeCollision(type, object) {
        console.log(`💥 케이크 충돌: ${type}`);
        
        switch (type) {
            case 'obstacle':
                this.score = Math.max(0, this.score - 10);
                break;
            case 'ground':
                // 착지 효과
                break;
        }
        
        this.updateUI();
    }
    
    /**
     * 케이크 목표 도달 처리
     */
    onCakeGoalReached() {
        console.log('🎯 목표 도달!');
        this.score += 100;
        this.level++;
        
        // 축하 효과
        if (this.gameEngine.particleSystem) {
            this.gameEngine.particleSystem.createCelebrationEffect(
                this.gameEngine.cake.position
            );
        }
        
        this.nextLevel();
    }
    
    /**
     * 케이크 특수 이벤트 처리
     */
    onCakeSpecialEvent(eventType, cakeBody) {
        console.log(`🎂 케이크 특수 이벤트: ${eventType}`);
        
        switch (eventType) {
            case 'melted':
                this.gameOver('케이크가 녹았습니다!');
                break;
            case 'exploded':
                this.gameOver('케이크가 폭발했습니다!');
                break;
            case 'collapsed':
                this.gameOver('케이크가 붕괴되었습니다!');
                break;
        }
    }
    
    /**
     * 다음 레벨
     */
    nextLevel() {
        console.log(`🆙 레벨 ${this.level} 시작`);
        
        // 레벨별 설정 적용
        this.applyLevelSettings();
        
        // 케이크 위치 리셋
        this.gameEngine.resetCakeBody();
        
        this.updateUI();
    }
    
    /**
     * 레벨 재시작
     */
    restartLevel() {
        console.log('🔄 레벨 재시작');
        this.gameEngine.resetCakeBody();
    }
    
    /**
     * 레벨 설정 적용
     */
    applyLevelSettings() {
        // 레벨에 따른 난이도 조정
        const difficulty = 1 + (this.level - 1) * 0.2;
        
        // 물리 설정 조정
        if (this.gameEngine.physicsManager) {
            this.gameEngine.physicsManager.applyEnvironmentalForces(
                new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).multiplyScalar(difficulty),
                1.0
            );
        }
    }
    
    /**
     * 게임 오버
     */
    gameOver(message = '게임 오버!') {
        this.gameState = 'gameOver';
        console.log(`💀 ${message}`);
        
        // 게임 오버 UI 표시
        this.showGameOverScreen(message);
        
        // 최고 점수 업데이트
        const highScore = parseInt(localStorage.getItem('cakeDeliveryHighScore') || '0');
        if (this.score > highScore) {
            localStorage.setItem('cakeDeliveryHighScore', this.score.toString());
            console.log(`🏆 새로운 최고 점수: ${this.score}`);
        }
    }
    
    /**
     * 게임 오버 화면 표시
     */
    showGameOverScreen(message) {
        // 간단한 알림으로 대체 (추후 개선 가능)
        setTimeout(() => {
            alert(`${message}\n점수: ${this.score}\n레벨: ${this.level}`);
        }, 1000);
    }
    
    /**
     * 오류 표시
     */
    showError(message) {
        console.error('게임 오류:', message);
        alert(message);
    }
    
    /**
     * 오류 처리 시스템 설정
     */
    setupErrorHandling() {
        try {
            // 안전성 검사
            if (!this.errorHandler) {
                console.warn('⚠️ ErrorHandlingSystem이 초기화되지 않았습니다. 기본 오류 처리로 대체합니다.');
                return;
            }
            
            // 게임 오류 알림 콜백 등록
            this.errorHandler.registerNotificationCallback((errorInfo) => {
                // UI에 오류 알림 표시
                if (errorInfo.severity === 'critical' && !errorInfo.recovered) {
                    this.showErrorNotification('게임에 문제가 발생했습니다', '다시 시도해주세요.');
                } else if (errorInfo.severity === 'error' && !errorInfo.recovered) {
                    this.showErrorNotification('경고', '일시적인 문제가 발생했습니다.');
                }
                
                // 오류 로깅
                console.error('게임 오류:', errorInfo.message);
                
                // 센서 연결 오류 처리
                if (errorInfo.type === 'SensorConnectionError') {
                    this.handleSensorConnectionError(errorInfo);
                }
                
                // 리소스 로드 오류 처리
                if (errorInfo.type === 'ResourceError') {
                    this.handleResourceError(errorInfo);
                }
            });
            
            // 센서 오류 처리 전략 등록
            this.errorHandler.registerRecoveryStrategy('SensorConnectionError', (error, context) => {
                return this.recoverSensorConnection(context);
            });
            
            // 게임 엔진 오류 처리 전략 등록
            this.errorHandler.registerRecoveryStrategy('GameEngineError', (error, context) => {
                return this.recoverGameEngine(context);
            });
            
            // URL 파라미터로 디버그 모드 설정
            const urlParams = new URLSearchParams(window.location.search);
            const debugMode = urlParams.get('debug') === 'true';
            this.errorHandler.setDebugMode(debugMode);
            
            console.log('✅ 오류 처리 시스템 설정 완료');
            
        } catch (error) {
            console.error('❌ 오류 처리 시스템 설정 실패:', error);
            // 폴백: 기본 오류 처리만 사용
        }
    }
    
    /**
     * 오류 알림 표시
     */
    showErrorNotification(title, message) {
        // 이미 알림이 표시되어 있는지 확인
        const existingNotification = document.getElementById('game-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.id = 'game-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            text-align: center;
            font-family: Arial, sans-serif;
            max-width: 80%;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        `;
        
        const titleElement = document.createElement('h4');
        titleElement.textContent = title;
        titleElement.style.margin = '0 0 5px 0';
        titleElement.style.color = '#ff5555';
        
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messageElement.style.margin = '0';
        
        notification.appendChild(titleElement);
        notification.appendChild(messageElement);
        
        document.body.appendChild(notification);
        
        // 5초 후 자동으로 사라짐
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);
    }
    
    /**
     * 센서 연결 오류 처리
     */
    handleSensorConnectionError(errorInfo) {
        this.updateConnectionStatus('센서 연결 오류 ⚠️');
        
        // 자동 재연결 시도
        setTimeout(() => {
            this.reconnectSensor();
        }, 3000);
    }
    
    /**
     * 센서 재연결
     */
    reconnectSensor() {
        this.updateConnectionStatus('센서 재연결 시도 중...');
        
        try {
            // SDK 재연결 시도
            if (this.sdk && typeof this.sdk.reconnect === 'function') {
                this.sdk.reconnect();
                return true;
            } else {
                // 세션 재생성 시도
                this.createSession();
                return true;
            }
        } catch (error) {
            console.error('센서 재연결 실패:', error);
            return false;
        }
    }
    
    /**
     * 센서 연결 복구
     */
    recoverSensorConnection(context) {
        return this.reconnectSensor();
    }
    
    /**
     * 게임 엔진 복구
     */
    recoverGameEngine(context) {
        try {
            console.log('🔄 게임 엔진 복구 시도');
            
            // 게임 엔진 재초기화
            if (this.gameEngine && typeof this.gameEngine.reset === 'function') {
                this.gameEngine.reset();
                return true;
            }
            
            // 게임 상태 리셋
            this.gameState = 'menu';
            this.restartGame();
            
            return true;
        } catch (error) {
            console.error('게임 엔진 복구 실패:', error);
            return false;
        }
    }
    
    /**
     * 리소스 오류 처리
     */
    handleResourceError(errorInfo) {
        const resourceUrl = errorInfo.context.resourceUrl;
        if (!resourceUrl) return;
        
        console.log(`리소스 로드 실패: ${resourceUrl}`);
        
        // 대체 리소스 사용
        if (errorInfo.context.resourceType === 'texture') {
            this.useFallbackTexture(resourceUrl);
        } else if (errorInfo.context.resourceType === 'model') {
            this.useFallbackModel(resourceUrl);
        } else if (errorInfo.context.resourceType === 'audio') {
            this.useFallbackAudio(resourceUrl);
        }
    }
    
    /**
     * 대체 텍스처 사용
     */
    useFallbackTexture(originalUrl) {
        // 대체 텍스처 로직 구현
        if (this.gameEngine && this.gameEngine.resourceManager) {
            this.gameEngine.resourceManager.useFallbackTexture(originalUrl);
        }
    }
    
    /**
     * 대체 모델 사용
     */
    useFallbackModel(originalUrl) {
        // 대체 모델 로직 구현
        if (this.gameEngine && this.gameEngine.resourceManager) {
            this.gameEngine.resourceManager.useFallbackModel(originalUrl);
        }
    }
    
    /**
     * 대체 오디오 사용
     */
    useFallbackAudio(originalUrl) {
        // 대체 오디오 로직 구현
        if (this.gameEngine && this.gameEngine.audioSystem) {
            this.gameEngine.audioSystem.useFallbackSound(originalUrl);
        }
    }
    
    /**
     * 저장 시스템 설정
     */
    setupSaveSystem() {
        // 저장 이벤트 리스너 등록
        this.saveSystem.addEventListener('onSave', (data) => {
            // 게임 상태 데이터 수집
            data.saveData.gameState = {
                state: this.gameState,
                mode: this.gameMode,
                cakeType: this.cakeType,
                score: this.score,
                level: this.level,
                lives: this.lives
            };
            
            // 플레이어 상태 데이터
            data.saveData.playerState = {
                hasPlayedBefore: !this.isFirstTime(),
                tutorialCompleted: this.tutorialManager ? this.tutorialManager.isCompleted : false,
                preferences: this.getPlayerPreferences()
            };
            
            // 레벨 상태 데이터
            if (this.gameEngine) {
                data.saveData.levelState = {
                    cakePosition: this.gameEngine.cake ? {
                        x: this.gameEngine.cake.position.x,
                        y: this.gameEngine.cake.position.y,
                        z: this.gameEngine.cake.position.z
                    } : null,
                    timeLeft: this.gameEngine.timeLeft || 0,
                    environmentalForces: this.gameEngine.physicsManager ? 
                        this.gameEngine.physicsManager.getEnvironmentalForces() : null
                };
            }
            
            // 설정 데이터
            data.saveData.settings = {
                audioEnabled: this.gameEngine && this.gameEngine.audioSystem ? 
                    this.gameEngine.audioSystem.isEnabled : true,
                hapticEnabled: this.mobileInterface ? 
                    this.mobileInterface.hapticEnabled : true,
                accessibilityMode: this.accessibilitySystem ? 
                    this.accessibilitySystem.getCurrentMode() : 'normal'
            };
        });
        
        // 로드 이벤트 리스너 등록
        this.saveSystem.addEventListener('onLoad', (data) => {
            this.restoreGameState(data.saveData);
        });
        
        // 오류 이벤트 리스너 등록
        this.saveSystem.addEventListener('onError', (data) => {
            console.error('저장 시스템 오류:', data.error);
            
            if (data.type === 'save') {
                this.showErrorNotification('저장 실패', '게임 저장에 실패했습니다.');
            } else if (data.type === 'load') {
                this.showErrorNotification('불러오기 실패', '저장된 게임을 불러올 수 없습니다.');
            }
        });
        
        // 게임 종료 시 자동 저장
        window.addEventListener('beforeunload', () => {
            if (this.gameState === 'playing') {
                this.saveSystem.saveGame(this.saveSystem.collectSaveData(), 'auto');
            }
        });
        
        // 페이지 숨김 시 자동 저장 (모바일 대응)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState === 'playing') {
                this.saveSystem.saveGame(this.saveSystem.collectSaveData(), 'auto');
            }
        });
        
        console.log('✅ 저장 시스템 설정 완료');
    }
    
    /**
     * 적응형 난이도 시스템 설정
     */
    setupDifficultySystem() {
        // 난이도 변경 이벤트 리스너 등록
        this.difficultySystem.addEventListener('onDifficultyChange', (data) => {
            console.log(`🎯 난이도 변경: ${data.oldDifficulty} → ${data.newDifficulty} (${data.reason})`);
            
            // 게임 엔진에 새로운 난이도 설정 적용
            this.applyDifficultySettings(data.difficultyData);
            
            // UI에 난이도 변경 알림
            this.showErrorNotification(
                '난이도 조절', 
                `난이도가 ${data.difficultyData.name}(으)로 변경되었습니다.`
            );
        });
        
        // 성능 업데이트 이벤트 리스너 등록
        this.difficultySystem.addEventListener('onPerformanceUpdate', (data) => {
            // 성능 데이터를 UI에 반영 (선택적)
            this.updatePerformanceUI(data.performance);
        });
        
        // 실력 레벨 변경 이벤트 리스너 등록
        this.difficultySystem.addEventListener('onSkillLevelChange', (data) => {
            console.log(`📈 실력 레벨 변화: ${data.oldLevel.toFixed(2)} → ${data.newLevel.toFixed(2)}`);
        });
        
        // 게임 시작 시 난이도 시스템에 알림
        const originalStartGame = this.startGame;
        this.startGame = () => {
            this.difficultySystem.onGameStart();
            originalStartGame.call(this);
        };
        
        // 게임 완료 시 난이도 시스템에 데이터 전달
        const originalGameOver = this.gameOver;
        this.gameOver = (message) => {
            // 게임 완료 데이터 수집
            const gameData = {
                success: false,
                score: this.score,
                timeElapsed: this.getGameTime(),
                mistakes: this.getMistakeCount(),
                cakeType: this.cakeType
            };
            
            this.difficultySystem.onGameComplete(gameData);
            originalGameOver.call(this, message);
        };
        
        // 레벨 완료 시 성공 데이터 전달
        const originalNextLevel = this.nextLevel;
        this.nextLevel = () => {
            const gameData = {
                success: true,
                score: this.score,
                timeElapsed: this.getGameTime(),
                mistakes: this.getMistakeCount(),
                cakeType: this.cakeType
            };
            
            this.difficultySystem.onGameComplete(gameData);
            originalNextLevel.call(this);
        };
        
        console.log('✅ 적응형 난이도 시스템 설정 완료');
    }
    
    /**
     * 멀티플레이어 밸런싱 시스템 설정
     */
    setupMultiplayerBalancing() {
        if (!this.multiplayerBalancing) {
            console.warn('⚠️ 멀티플레이어 밸런싱 시스템이 초기화되지 않았습니다');
            return;
        }
        
        // 플레이어 성능 균형 이벤트
        this.multiplayerBalancing.addEventListener('onBalanceAdjustment', (data) => {
            console.log(`⚖️ 균형 조정: ${data.type} - ${data.adjustment}`);
            
            if (this.gameEngine) {
                // 케이크 물리 조정
                if (data.type === 'cake_stability') {
                    this.gameEngine.physicsManager.setCakeStability(data.adjustment);
                }
                
                // 환경 조정
                if (data.type === 'environment') {
                    this.gameEngine.physicsManager.setWindStrength(data.adjustment);
                }
            }
        });
        
        // 실력 차이 감지 이벤트
        this.multiplayerBalancing.addEventListener('onSkillGapDetected', (data) => {
            console.log(`📊 실력 차이 감지: ${data.gap}% - 보정 적용`);
            
            // UI에 알림 표시
            if (this.accessibilitySystem) {
                this.accessibilitySystem.announceMessage(
                    `플레이어 간 실력 차이가 감지되어 게임이 조정되었습니다.`
                );
            }
        });
        
        console.log('✅ 멀티플레이어 밸런싱 시스템 설정 완료');
    }
    
    /**
     * 난이도 설정 적용
     */
    applyDifficultySettings(difficultyData) {
        // 물리 엔진 설정 적용
        if (this.gameEngine && this.gameEngine.physicsManager) {
            // 케이크 안정성 조절
            this.gameEngine.physicsManager.setCakeStability(difficultyData.cakeStability);
            
            // 환경 설정 적용
            const environmentSettings = this.difficultySystem.getEnvironmentSettings();
            this.gameEngine.physicsManager.setWindStrength(environmentSettings.windStrength);
        }
        
        // 게임 타이머 설정
        if (this.gameEngine) {
            const environmentSettings = this.difficultySystem.getEnvironmentSettings();
            this.gameEngine.setTimeLimit(environmentSettings.timeLimit);
        }
        
        // 점수 시스템 설정
        const scoreSettings = this.difficultySystem.getScoreSettings();
        this.scoreMultiplier = scoreSettings.scoreMultiplier;
        this.timeBonus = scoreSettings.timeBonus;
    }
    
    /**
     * 성능 UI 업데이트
     */
    updatePerformanceUI(performance) {
        // 성능 정보를 UI에 표시 (선택적)
        const performanceDisplay = document.getElementById('performanceDisplay');
        if (performanceDisplay) {
            const successRate = (performance.successfulGames / performance.totalGames * 100).toFixed(1);
            const skillLevel = (performance.skillLevel * 100).toFixed(1);
            
            performanceDisplay.innerHTML = `
                <div>성공률: ${successRate}%</div>
                <div>실력 지수: ${skillLevel}%</div>
                <div>평균 점수: ${performance.averageScore.toFixed(0)}</div>
            `;
        }
    }
    
    /**
     * 게임 시간 가져오기
     */
    getGameTime() {
        if (this.gameEngine && this.gameEngine.gameStartTime) {
            return (Date.now() - this.gameEngine.gameStartTime) / 1000;
        }
        return 0;
    }
    
    /**
     * 실수 횟수 가져오기
     */
    getMistakeCount() {
        // 게임 엔진에서 실수 횟수를 추적하는 경우
        if (this.gameEngine && this.gameEngine.mistakeCount !== undefined) {
            return this.gameEngine.mistakeCount;
        }
        
        // 기본값으로 생명력 감소 횟수 사용
        return Math.max(0, 3 - this.lives);
    }
    
    /**
     * 난이도 수동 변경 (UI에서 호출)
     */
    changeDifficulty(difficulty) {
        return this.difficultySystem.setDifficulty(difficulty);
    }
    
    /**
     * 현재 난이도 정보 가져오기
     */
    getCurrentDifficulty() {
        return this.difficultySystem.getCurrentDifficultySettings();
    }
    
    /**
     * 플레이어 통계 가져오기
     */
    getPlayerStats() {
        return this.difficultySystem.getPlayerStats();
    }
    
    /**
     * 플레이어 설정 가져오기
     */
    getPlayerPreferences() {
        try {
            const preferences = localStorage.getItem('cakeDeliveryPreferences');
            return preferences ? JSON.parse(preferences) : {};
        } catch (error) {
            console.warn('플레이어 설정 로드 실패:', error);
            return {};
        }
    }
    
    /**
     * 게임 상태 복원
     */
    restoreGameState(saveData) {
        try {
            console.log('📂 게임 상태 복원 시작');
            
            // 게임 상태 복원
            if (saveData.gameState) {
                this.gameState = saveData.gameState.state || 'menu';
                this.gameMode = saveData.gameState.mode || 'normal';
                this.cakeType = saveData.gameState.cakeType || 'basic';
                this.score = saveData.gameState.score || 0;
                this.level = saveData.gameState.level || 1;
                this.lives = saveData.gameState.lives || 3;
            }
            
            // 플레이어 상태 복원
            if (saveData.playerState) {
                if (saveData.playerState.hasPlayedBefore) {
                    this.markAsPlayed();
                }
                
                if (saveData.playerState.preferences) {
                    this.applyPlayerPreferences(saveData.playerState.preferences);
                }
            }
            
            // 레벨 상태 복원
            if (saveData.levelState && this.gameEngine) {
                if (saveData.levelState.cakePosition && this.gameEngine.cake) {
                    this.gameEngine.cake.position.set(
                        saveData.levelState.cakePosition.x,
                        saveData.levelState.cakePosition.y,
                        saveData.levelState.cakePosition.z
                    );
                }
                
                if (saveData.levelState.timeLeft) {
                    this.gameEngine.timeLeft = saveData.levelState.timeLeft;
                }
                
                if (saveData.levelState.environmentalForces && this.gameEngine.physicsManager) {
                    this.gameEngine.physicsManager.setEnvironmentalForces(
                        saveData.levelState.environmentalForces
                    );
                }
            }
            
            // 설정 복원
            if (saveData.settings) {
                if (this.gameEngine && this.gameEngine.audioSystem) {
                    this.gameEngine.audioSystem.setEnabled(saveData.settings.audioEnabled);
                }
                
                if (this.mobileInterface) {
                    this.mobileInterface.setHapticEnabled(saveData.settings.hapticEnabled);
                }
                
                if (this.accessibilitySystem) {
                    this.accessibilitySystem.setMode(saveData.settings.accessibilityMode);
                }
            }
            
            // UI 업데이트
            this.updateUI();
            
            console.log('✅ 게임 상태 복원 완료');
        } catch (error) {
            console.error('❌ 게임 상태 복원 실패:', error);
            this.showErrorNotification('복원 실패', '저장된 게임 상태를 복원할 수 없습니다.');
        }
    }
    
    /**
     * 플레이어 설정 적용
     */
    applyPlayerPreferences(preferences) {
        // 설정 적용 로직 구현
        console.log('⚙️ 플레이어 설정 적용:', preferences);
    }
    
    /**
     * 수동 저장
     */
    async saveGame(slotName = 'manual') {
        try {
            const success = await this.saveSystem.saveGame(
                this.saveSystem.collectSaveData(), 
                slotName
            );
            
            if (success) {
                this.showErrorNotification('저장 완료', '게임이 저장되었습니다.');
            } else {
                this.showErrorNotification('저장 실패', '게임 저장에 실패했습니다.');
            }
            
            return success;
        } catch (error) {
            console.error('수동 저장 실패:', error);
            this.showErrorNotification('저장 실패', '게임 저장에 실패했습니다.');
            return false;
        }
    }
    
    /**
     * 수동 불러오기
     */
    async loadGame(slotName = 'manual') {
        try {
            const saveData = await this.saveSystem.loadGame(slotName);
            
            if (saveData) {
                this.restoreGameState(saveData);
                this.showErrorNotification('불러오기 완료', '저장된 게임을 불러왔습니다.');
                return true;
            } else {
                this.showErrorNotification('불러오기 실패', '저장된 게임을 찾을 수 없습니다.');
                return false;
            }
        } catch (error) {
            console.error('수동 불러오기 실패:', error);
            this.showErrorNotification('불러오기 실패', '저장된 게임을 불러올 수 없습니다.');
            return false;
        }
    }
    
    /**
     * 성능 모니터링 시스템 설정
     */
    setupPerformanceMonitoring() {
        // 성능 모니터링 시작
        this.performanceMonitor.start();
        
        // 성능 업데이트 이벤트 리스너
        this.performanceMonitor.addEventListener('onPerformanceUpdate', (data) => {
            // 성능 데이터를 UI에 반영 (선택적)
            this.updatePerformanceUI(data.metrics);
        });
        
        // 성능 알림 이벤트 리스너
        this.performanceMonitor.addEventListener('onAlert', (alert) => {
            console.warn(`⚠️ 성능 알림: ${alert.message}`);
            
            // 심각한 성능 문제의 경우 사용자에게 알림
            if (alert.severity === 'warning') {
                this.showErrorNotification('성능 경고', alert.message);
            }
        });
        
        // 자동 최적화 이벤트 리스너
        this.performanceMonitor.addEventListener('onOptimization', (data) => {
            console.log('🔧 성능 자동 최적화:', data.suggestions);
        });
        
        console.log('✅ 성능 모니터링 시스템 설정 완료');
    }
    
    /**
     * 오류 리포팅 시스템 설정
     */
    setupErrorReporting() {
        // 오류 이벤트 리스너
        this.errorReporter.addEventListener('onError', (errorData) => {
            console.error('🚨 오류 감지:', errorData.message);
            
            // 심각한 오류의 경우 게임 상태 저장
            if (errorData.severity === 'critical' || errorData.severity === 'error') {
                this.saveGame('emergency');
            }
        });
        
        // 리포트 생성 이벤트 리스너
        this.errorReporter.addEventListener('onReport', (report) => {
            console.log('📊 오류 리포트 생성:', report.type);
            
            // 정기 리포트의 경우 성능 최적화 제안 적용
            if (report.type === 'periodic' && report.recommendations) {
                this.applyOptimizationRecommendations(report.recommendations);
            }
        });
        
        // 분석 결과 이벤트 리스너
        this.errorReporter.addEventListener('onAnalysis', (data) => {
            const { error, analysis } = data;
            
            // 고빈도 오류의 경우 특별 처리
            if (analysis.impact.overall === 'high') {
                console.warn('🔥 고영향 오류 감지:', error.message);
            }
        });
        
        console.log('✅ 오류 리포팅 시스템 설정 완료');
    }
    
    /**
     * 성능 UI 업데이트
     */
    updatePerformanceUI(metrics) {
        // 성능 정보를 UI에 표시 (디버그 모드에서만)
        if (this.debugMode) {
            const performanceDisplay = document.getElementById('performanceDisplay');
            if (performanceDisplay) {
                performanceDisplay.innerHTML = `
                    <div>FPS: ${metrics.fps.current}</div>
                    <div>메모리: ${Math.round(metrics.memory.used)}MB</div>
                    <div>지연: ${Math.round(metrics.network.latency)}ms</div>
                `;
            }
        }
    }
    
    /**
     * 최적화 권장사항 적용
     */
    applyOptimizationRecommendations(recommendations) {
        recommendations.forEach(rec => {
            switch (rec.action) {
                case 'code_review':
                    console.log('📝 코드 검토 권장:', rec.message);
                    break;
                case 'network_optimization':
                    console.log('🌐 네트워크 최적화 권장:', rec.message);
                    break;
                case 'resource_audit':
                    console.log('📦 리소스 감사 권장:', rec.message);
                    break;
                default:
                    console.log('💡 최적화 권장:', rec.message);
            }
        });
    }
    
    /**
     * 정리
     */
    cleanup() {
        console.log('🧹 게임 정리 시작...');
        
        if (this.gameEngine) {
            this.gameEngine.cleanup();
        }
        
        if (this.sdk) {
            this.sdk.disconnect();
        }
        
        if (this.mobileInterface) {
            this.mobileInterface.dispose();
            this.mobileInterface = null;
        }
        
        // 오류 처리 시스템 정리
        if (this.errorHandler) {
            // 전역 오류 핸들러 복원
            window.onerror = null;
            window.removeEventListener('unhandledrejection', null);
        }
        
        // 저장 시스템 정리
        if (this.saveSystem) {
            this.saveSystem.dispose();
        }
        
        // 적응형 난이도 시스템 정리
        if (this.difficultySystem) {
            this.difficultySystem.dispose();
        }
        
        // 멀티플레이어 밸런싱 시스템 정리
        if (this.multiplayerBalancing) {
            this.multiplayerBalancing.dispose();
        }
        
        // 성능 모니터링 시스템 정리
        if (this.performanceMonitor) {
            this.performanceMonitor.dispose();
        }
        
        // 오류 리포팅 시스템 정리
        if (this.errorReporter) {
            this.errorReporter.dispose();
        }
        
        if (this.accessibilitySystem) {
            this.accessibilitySystem.dispose();
            this.accessibilitySystem = null;
        }
        
        console.log('✅ 게임 정리 완료');
    }
}

// CakeDeliveryGame 클래스는 HTML에서 초기화됩니다.