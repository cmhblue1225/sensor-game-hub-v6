/**
 * 🔗 Hub Communication Interface
 * 
 * Sensor Game Hub v6.0과의 통신을 담당하는 인터페이스
 * - 허브 환경 감지 및 초기화
 * - 게임 상태 보고 시스템
 * - 허브 네비게이션 통합
 * - 리소스 관리 및 정리
 */

class HubCommunicationInterface {
    constructor(gameController) {
        this.gameController = gameController;
        this.isHubEnvironment = this.detectHubEnvironment();
        this.hubConfig = null;
        this.heartbeatInterval = null;
        this.lastHeartbeat = null;
        
        console.log(`🏠 허브 환경: ${this.isHubEnvironment ? '감지됨' : '독립 실행'}`);
        
        if (this.isHubEnvironment) {
            this.initializeHubIntegration();
        }
    }
    
    /**
     * 허브 환경 감지
     */
    detectHubEnvironment() {
        // URL 패턴으로 허브 환경 감지
        const isHubPath = window.location.pathname.includes('/games/');
        
        // 허브 특정 전역 변수 확인
        const hasHubGlobals = typeof window.SensorGameHub !== 'undefined';
        
        // 허브 API 엔드포인트 존재 확인
        const hasHubAPI = this.checkHubAPISync();
        
        // 허브 세션 정보 확인
        const hasHubSession = !!window.hubSessionInfo;
        
        return isHubPath || hasHubGlobals || hasHubAPI || hasHubSession;
    }
    
    /**
     * 허브 API 동기 확인 (빠른 체크)
     */
    checkHubAPISync() {
        try {
            // 허브 환경에서만 존재하는 DOM 요소 확인
            const hubElements = document.querySelectorAll('[data-hub-component]');
            return hubElements.length > 0;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 허브 통합 초기화
     */
    async initializeHubIntegration() {
        try {
            console.log('🔄 허브 통합 초기화 중...');
            
            // 허브 설정 로드
            this.hubConfig = await this.loadHubConfig();
            
            // 허브 API 등록
            this.registerWithHub();
            
            // 허브 네비게이션 설정
            this.setupHubNavigation();
            
            // 상태 보고 시스템 시작
            this.startStatusReporting();
            
            // 허브 이벤트 리스너 등록
            this.setupHubEventListeners();
            
            console.log('✅ 허브 통합 완료');
            
        } catch (error) {
            console.error('❌ 허브 통합 실패:', error);
            // 허브 통합 실패 시에도 게임은 계속 실행
        }
    }
    
    /**
     * 허브 설정 로드
     */
    async loadHubConfig() {
        const defaultConfig = {
            apiBase: '/api',
            socketPath: '/socket.io',
            sensorClientUrl: '/sensor.html',
            gameListUrl: '/api/games',
            heartbeatInterval: 30000, // 30초
            maxRetries: 3,
            retryDelay: 5000 // 5초
        };
        
        try {
            // 허브에서 제공하는 설정이 있는지 확인
            if (window.hubConfig) {
                return { ...defaultConfig, ...window.hubConfig };
            }
            
            // API를 통해 설정 로드 시도
            const response = await fetch('/api/config/game');
            if (response.ok) {
                const hubConfig = await response.json();
                return { ...defaultConfig, ...hubConfig };
            }
            
        } catch (error) {
            console.warn('⚠️ 허브 설정 로드 실패, 기본값 사용:', error.message);
        }
        
        return defaultConfig;
    }
    
    /**
     * 허브에 게임 등록
     */
    registerWithHub() {
        const gameInfo = {
            gameId: this.getGameId(),
            gameName: this.getGameName(),
            gameType: 'dual',
            version: this.getGameVersion(),
            status: 'initializing',
            capabilities: {
                sessionManagement: true,
                sensorIntegration: true,
                stateReporting: true,
                hubNavigation: true,
                resourceManagement: true
            },
            timestamp: Date.now()
        };
        
        // 허브 전역 객체에 등록
        if (window.SensorGameHub && window.SensorGameHub.registerGame) {
            window.SensorGameHub.registerGame(gameInfo);
            console.log('📝 허브에 게임 등록됨:', gameInfo.gameId);
        }
        
        // 허브 API에 등록
        this.reportToHubAPI('game-registered', gameInfo);
    }
    
    /**
     * 허브 네비게이션 설정
     */
    setupHubNavigation() {
        // 허브로 돌아가기 버튼 이벤트
        const hubButtons = document.querySelectorAll('[data-hub-action="return"]');
        hubButtons.forEach(button => {
            button.addEventListener('click', () => this.returnToHub());
        });
        
        // 브라우저 뒤로가기 처리
        window.addEventListener('popstate', (event) => {
            if (this.isHubEnvironment) {
                event.preventDefault();
                this.returnToHub();
            }
        });
        
        // 키보드 단축키 (Ctrl+H: 허브로 돌아가기)
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 'h') {
                event.preventDefault();
                this.returnToHub();
            }
        });
    }
    
    /**
     * 상태 보고 시스템 시작
     */
    startStatusReporting() {
        // 초기 상태 보고
        this.reportGameStatus('initialized');
        
        // 주기적 하트비트 시작
        this.startHeartbeat();
        
        // 게임 이벤트 리스너 등록
        this.setupGameEventReporting();
    }
    
    /**
     * 하트비트 시작
     */
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, this.hubConfig.heartbeatInterval);
        
        console.log(`💓 하트비트 시작 (${this.hubConfig.heartbeatInterval}ms 간격)`);
    }
    
    /**
     * 하트비트 전송
     */
    async sendHeartbeat() {
        const heartbeatData = {
            gameId: this.getGameId(),
            status: this.gameController.getGameState(),
            players: this.gameController.getConnectedPlayers(),
            performance: this.getPerformanceMetrics(),
            timestamp: Date.now()
        };
        
        try {
            await this.reportToHubAPI('heartbeat', heartbeatData);
            this.lastHeartbeat = Date.now();
        } catch (error) {
            console.warn('⚠️ 하트비트 전송 실패:', error.message);
        }
    }
    
    /**
     * 게임 이벤트 보고 설정
     */
    setupGameEventReporting() {
        // 게임 상태 변경 이벤트
        if (this.gameController.on) {
            this.gameController.on('stateChange', (state) => {
                this.reportGameStatus(state);
            });
            
            this.gameController.on('playerConnected', (playerData) => {
                this.reportGameEvent('player-connected', playerData);
            });
            
            this.gameController.on('playerDisconnected', (playerData) => {
                this.reportGameEvent('player-disconnected', playerData);
            });
            
            this.gameController.on('gameStarted', (gameData) => {
                this.reportGameEvent('game-started', gameData);
            });
            
            this.gameController.on('gameEnded', (resultData) => {
                this.reportGameEvent('game-ended', resultData);
            });
        }
    }
    
    /**
     * 허브 이벤트 리스너 설정
     */
    setupHubEventListeners() {
        // 허브에서 오는 명령 처리
        window.addEventListener('hub-command', (event) => {
            this.handleHubCommand(event.detail);
        });
        
        // 허브 연결 상태 변경
        window.addEventListener('hub-connection-change', (event) => {
            this.handleHubConnectionChange(event.detail);
        });
        
        // 페이지 언로드 시 정리
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }
    
    /**
     * 허브 명령 처리
     */
    handleHubCommand(command) {
        console.log('📨 허브 명령 수신:', command);
        
        switch (command.type) {
            case 'pause-game':
                if (this.gameController.pauseGame) {
                    this.gameController.pauseGame();
                }
                break;
                
            case 'resume-game':
                if (this.gameController.resumeGame) {
                    this.gameController.resumeGame();
                }
                break;
                
            case 'restart-game':
                if (this.gameController.restartGame) {
                    this.gameController.restartGame();
                }
                break;
                
            case 'return-to-hub':
                this.returnToHub();
                break;
                
            case 'get-status':
                this.reportGameStatus(this.gameController.getGameState());
                break;
                
            default:
                console.warn('⚠️ 알 수 없는 허브 명령:', command.type);
        }
    }
    
    /**
     * 허브 연결 상태 변경 처리
     */
    handleHubConnectionChange(connectionInfo) {
        console.log('🔗 허브 연결 상태 변경:', connectionInfo);
        
        if (connectionInfo.connected) {
            // 재연결 시 상태 동기화
            this.reportGameStatus(this.gameController.getGameState());
        } else {
            // 연결 끊김 시 로컬 모드로 전환
            console.warn('⚠️ 허브 연결 끊김, 로컬 모드로 전환');
        }
    }
    
    /**
     * 게임 상태 보고
     */
    async reportGameStatus(status) {
        const statusData = {
            gameId: this.getGameId(),
            status: status,
            players: this.gameController.getConnectedPlayers?.() || 0,
            timestamp: Date.now(),
            details: this.getGameDetails()
        };
        
        await this.reportToHubAPI('game-status', statusData);
        
        // 허브 전역 객체에도 보고
        if (window.SensorGameHub && window.SensorGameHub.onGameStatusChange) {
            window.SensorGameHub.onGameStatusChange(statusData);
        }
    }
    
    /**
     * 게임 이벤트 보고
     */
    async reportGameEvent(eventType, eventData) {
        const reportData = {
            gameId: this.getGameId(),
            eventType: eventType,
            eventData: eventData,
            timestamp: Date.now()
        };
        
        await this.reportToHubAPI('game-event', reportData);
    }
    
    /**
     * 허브 API에 데이터 전송
     */
    async reportToHubAPI(endpoint, data) {
        if (!this.hubConfig) return;
        
        try {
            const response = await fetch(`${this.hubConfig.apiBase}/games/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.warn(`⚠️ 허브 API 보고 실패 (${endpoint}):`, error.message);
            throw error;
        }
    }
    
    /**
     * 허브로 돌아가기
     */
    returnToHub() {
        console.log('🏠 허브로 돌아가는 중...');
        
        // 게임 상태 저장
        this.saveGameState();
        
        // 리소스 정리
        this.cleanup();
        
        // 허브로 이동
        if (window.SensorGameHub && window.SensorGameHub.navigateToHub) {
            window.SensorGameHub.navigateToHub();
        } else {
            // 폴백: 직접 네비게이션
            window.location.href = '/';
        }
    }
    
    /**
     * 게임 상태 저장
     */
    saveGameState() {
        try {
            const gameState = {
                gameId: this.getGameId(),
                state: this.gameController.getGameState?.() || 'unknown',
                players: this.gameController.getConnectedPlayers?.() || 0,
                timestamp: Date.now()
            };
            
            localStorage.setItem('lastGameState', JSON.stringify(gameState));
            console.log('💾 게임 상태 저장됨');
            
        } catch (error) {
            console.warn('⚠️ 게임 상태 저장 실패:', error.message);
        }
    }
    
    /**
     * 성능 메트릭 수집
     */
    getPerformanceMetrics() {
        const metrics = {
            fps: 0,
            memoryUsage: 0,
            loadTime: 0
        };
        
        try {
            // FPS 정보
            if (this.gameController.getPerformanceStats) {
                const perfStats = this.gameController.getPerformanceStats();
                metrics.fps = perfStats.fps || 0;
            }
            
            // 메모리 사용량
            if (performance.memory) {
                metrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            }
            
            // 로드 시간
            if (performance.timing) {
                metrics.loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            }
            
        } catch (error) {
            console.warn('⚠️ 성능 메트릭 수집 실패:', error.message);
        }
        
        return metrics;
    }
    
    /**
     * 게임 세부 정보 수집
     */
    getGameDetails() {
        return {
            mode: this.gameController.getCurrentGameMode?.() || 'unknown',
            level: this.gameController.getCurrentLevel?.() || 1,
            score: this.gameController.getScore?.() || 0,
            duration: this.gameController.getGameDuration?.() || 0
        };
    }
    
    /**
     * 게임 ID 반환
     */
    getGameId() {
        // 허브 환경에서는 URL에서 추출
        if (this.isHubEnvironment) {
            const pathParts = window.location.pathname.split('/');
            const gameIndex = pathParts.indexOf('games');
            return gameIndex !== -1 ? pathParts[gameIndex + 1] : '3d-racing-game';
        }
        
        return '3d-racing-game';
    }
    
    /**
     * 게임 이름 반환
     */
    getGameName() {
        return '3D Racing Game';
    }
    
    /**
     * 게임 버전 반환
     */
    getGameVersion() {
        return '1.0.0';
    }
    
    /**
     * 리소스 정리
     */
    cleanup() {
        console.log('🧹 허브 통신 인터페이스 정리 중...');
        
        // 하트비트 중지
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        // 최종 상태 보고
        try {
            this.reportGameStatus('terminated');
        } catch (error) {
            console.warn('⚠️ 최종 상태 보고 실패:', error.message);
        }
        
        // 허브에서 게임 등록 해제
        if (window.SensorGameHub && window.SensorGameHub.unregisterGame) {
            window.SensorGameHub.unregisterGame(this.getGameId());
        }
        
        console.log('✅ 허브 통신 인터페이스 정리 완료');
    }
    
    /**
     * 허브 환경 여부 반환
     */
    isRunningInHub() {
        return this.isHubEnvironment;
    }
    
    /**
     * 허브 설정 반환
     */
    getHubConfig() {
        return this.hubConfig;
    }
}

// 전역에서 사용할 수 있도록 export
if (typeof window !== 'undefined') {
    window.HubCommunicationInterface = HubCommunicationInterface;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HubCommunicationInterface;
}