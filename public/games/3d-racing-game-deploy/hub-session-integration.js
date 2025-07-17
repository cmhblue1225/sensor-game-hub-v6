/**
 * 🔗 Hub Session Integration
 * 
 * Sensor Game Hub v6.0의 세션 시스템과 통합
 * - 허브 세션 상태 동기화
 * - 센서 연결 관리
 * - 세션 복구 및 재연결
 * - 허브 세션 이벤트 처리
 */

class HubSessionIntegration {
    constructor(gameController, hubCommunication) {
        this.gameController = gameController;
        this.hubCommunication = hubCommunication;
        this.sessionSDK = null;
        this.hubSession = null;
        this.sessionState = 'disconnected';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        
        this.initializeSessionIntegration();
    }
    
    /**
     * 세션 통합 초기화
     */
    async initializeSessionIntegration() {
        console.log('🔄 허브 세션 통합 초기화...');
        
        try {
            // 기존 허브 세션 확인
            await this.checkExistingHubSession();
            
            // SessionSDK 초기화
            await this.initializeSessionSDK();
            
            // 허브 세션 이벤트 리스너 설정
            this.setupHubSessionEvents();
            
            // 세션 상태 동기화 시작
            this.startSessionSync();
            
            console.log('✅ 허브 세션 통합 완료');
            
        } catch (error) {
            console.error('❌ 허브 세션 통합 실패:', error);
            this.handleSessionIntegrationError(error);
        }
    }
    
    /**
     * 기존 허브 세션 확인
     */
    async checkExistingHubSession() {
        // URL 파라미터에서 세션 정보 확인
        const urlParams = new URLSearchParams(window.location.search);
        const hubSessionId = urlParams.get('hubSession');
        const gameSessionId = urlParams.get('session');
        
        if (hubSessionId) {
            console.log('🔍 기존 허브 세션 발견:', hubSessionId);
            this.hubSession = await this.loadHubSession(hubSessionId);
        }
        
        if (gameSessionId) {
            console.log('🔍 기존 게임 세션 발견:', gameSessionId);
            this.gameSession = gameSessionId;
        }
        
        // 로컬 스토리지에서 세션 정보 확인
        const savedSession = this.loadSavedSession();
        if (savedSession && !this.hubSession) {
            this.hubSession = savedSession;
        }
    }
    
    /**
     * 허브 세션 로드
     */
    async loadHubSession(sessionId) {
        try {
            const response = await fetch(`/api/sessions/${sessionId}`);
            if (response.ok) {
                const sessionData = await response.json();
                console.log('📥 허브 세션 로드됨:', sessionData);
                return sessionData;
            }
        } catch (error) {
            console.warn('⚠️ 허브 세션 로드 실패:', error.message);
        }
        
        return null;
    }
    
    /**
     * 저장된 세션 로드
     */
    loadSavedSession() {
        try {
            const saved = localStorage.getItem('hubSession');
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.warn('⚠️ 저장된 세션 로드 실패:', error.message);
            return null;
        }
    }
    
    /**
     * SessionSDK 초기화
     */
    async initializeSessionSDK() {
        const hubConfig = this.hubCommunication.getHubConfig();
        
        this.sessionSDK = new SessionSDK({
            gameId: this.hubCommunication.getGameId(),
            gameType: 'dual',
            debug: true,
            // 허브 환경 설정 적용
            ...(hubConfig && {
                socketPath: hubConfig.socketPath,
                apiBase: hubConfig.apiBase
            })
        });
        
        // SessionSDK 이벤트 설정
        this.setupSessionSDKEvents();
        
        // 허브 세션이 있으면 복구 시도
        if (this.hubSession) {
            await this.restoreHubSession();
        }
    }
    
    /**
     * SessionSDK 이벤트 설정
     */
    setupSessionSDKEvents() {
        // 연결 이벤트
        this.sessionSDK.on('connected', (event) => {
            const data = event.detail || event;
            console.log('🔗 SessionSDK 연결됨');
            this.sessionState = 'connected';
            this.onSessionConnected(data);
        });
        
        // 세션 생성 이벤트
        this.sessionSDK.on('session-created', (event) => {
            const session = event.detail || event;
            console.log('🎮 게임 세션 생성됨:', session.sessionCode);
            this.onGameSessionCreated(session);
        });
        
        // 센서 연결 이벤트
        this.sessionSDK.on('sensor-connected', (event) => {
            const data = event.detail || event;
            console.log('📱 센서 연결됨:', data.sensorId);
            this.onSensorConnected(data);
        });
        
        // 센서 연결 해제 이벤트
        this.sessionSDK.on('sensor-disconnected', (event) => {
            const data = event.detail || event;
            console.log('📱 센서 연결 해제됨:', data.sensorId);
            this.onSensorDisconnected(data);
        });
        
        // 센서 데이터 이벤트
        this.sessionSDK.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.onSensorData(data);
        });
        
        // 연결 오류 이벤트
        this.sessionSDK.on('error', (event) => {
            const error = event.detail || event;
            console.error('❌ SessionSDK 오류:', error);
            this.onSessionError(error);
        });
        
        // 연결 해제 이벤트
        this.sessionSDK.on('disconnected', (event) => {
            const data = event.detail || event;
            console.warn('⚠️ SessionSDK 연결 해제됨');
            this.sessionState = 'disconnected';
            this.onSessionDisconnected(data);
        });
    }
    
    /**
     * 허브 세션 이벤트 설정
     */
    setupHubSessionEvents() {
        // 허브 세션 상태 변경
        window.addEventListener('hub-session-change', (event) => {
            this.handleHubSessionChange(event.detail);
        });
        
        // 허브 센서 이벤트
        window.addEventListener('hub-sensor-event', (event) => {
            this.handleHubSensorEvent(event.detail);
        });
        
        // 허브 세션 복구 요청
        window.addEventListener('hub-session-restore', (event) => {
            this.restoreHubSession(event.detail);
        });
    }
    
    /**
     * 세션 상태 동기화 시작
     */
    startSessionSync() {
        // 주기적으로 허브와 세션 상태 동기화
        this.syncInterval = setInterval(() => {
            this.syncSessionState();
        }, 10000); // 10초마다
        
        console.log('🔄 세션 상태 동기화 시작');
    }
    
    /**
     * 세션 상태 동기화
     */
    async syncSessionState() {
        if (!this.hubCommunication.isRunningInHub()) return;
        
        try {
            const currentState = {
                sessionState: this.sessionState,
                gameSession: this.gameSession,
                hubSession: this.hubSession?.id,
                connectedSensors: this.getConnectedSensors(),
                timestamp: Date.now()
            };
            
            await this.hubCommunication.reportToHubAPI('session-sync', currentState);
            
        } catch (error) {
            console.warn('⚠️ 세션 상태 동기화 실패:', error.message);
        }
    }
    
    /**
     * SessionSDK 연결 이벤트 처리
     */
    onSessionConnected(data) {
        this.reconnectAttempts = 0;
        
        // 허브에 연결 상태 보고
        this.hubCommunication.reportGameEvent('session-connected', {
            sessionState: this.sessionState,
            timestamp: Date.now()
        });
        
        // 게임 컨트롤러에 알림
        if (this.gameController.onSessionConnected) {
            this.gameController.onSessionConnected(data);
        }
    }
    
    /**
     * 게임 세션 생성 이벤트 처리
     */
    onGameSessionCreated(session) {
        this.gameSession = session.sessionCode;
        
        // 허브 세션과 연결
        if (this.hubSession) {
            this.linkGameSessionToHub(session);
        }
        
        // 세션 정보 저장
        this.saveSessionInfo(session);
        
        // 허브에 세션 생성 보고
        this.hubCommunication.reportGameEvent('game-session-created', {
            sessionCode: session.sessionCode,
            hubSessionId: this.hubSession?.id,
            timestamp: Date.now()
        });
        
        // 게임 컨트롤러에 알림
        if (this.gameController.onGameSessionCreated) {
            this.gameController.onGameSessionCreated(session);
        }
    }
    
    /**
     * 센서 연결 이벤트 처리
     */
    onSensorConnected(data) {
        // 허브에 센서 연결 보고
        this.hubCommunication.reportGameEvent('sensor-connected', {
            sensorId: data.sensorId,
            sessionCode: this.gameSession,
            hubSessionId: this.hubSession?.id,
            timestamp: Date.now()
        });
        
        // 게임 컨트롤러에 알림
        if (this.gameController.onSensorConnected) {
            this.gameController.onSensorConnected(data);
        }
    }
    
    /**
     * 센서 연결 해제 이벤트 처리
     */
    onSensorDisconnected(data) {
        // 허브에 센서 연결 해제 보고
        this.hubCommunication.reportGameEvent('sensor-disconnected', {
            sensorId: data.sensorId,
            sessionCode: this.gameSession,
            hubSessionId: this.hubSession?.id,
            timestamp: Date.now()
        });
        
        // 재연결 시도
        this.attemptSensorReconnection(data.sensorId);
        
        // 게임 컨트롤러에 알림
        if (this.gameController.onSensorDisconnected) {
            this.gameController.onSensorDisconnected(data);
        }
    }
    
    /**
     * 센서 데이터 이벤트 처리
     */
    onSensorData(data) {
        // 허브 환경에서는 데이터 필터링 및 검증
        if (this.hubCommunication.isRunningInHub()) {
            data = this.validateSensorData(data);
        }
        
        // 게임 컨트롤러에 센서 데이터 전달
        if (this.gameController.onSensorData) {
            this.gameController.onSensorData(data);
        }
    }
    
    /**
     * 세션 오류 이벤트 처리
     */
    onSessionError(error) {
        console.error('🚨 세션 오류:', error);
        
        // 허브에 오류 보고
        this.hubCommunication.reportGameEvent('session-error', {
            error: error.message || error,
            sessionState: this.sessionState,
            timestamp: Date.now()
        });
        
        // 재연결 시도
        this.attemptReconnection();
    }
    
    /**
     * 세션 연결 해제 이벤트 처리
     */
    onSessionDisconnected(data) {
        // 허브에 연결 해제 보고
        this.hubCommunication.reportGameEvent('session-disconnected', {
            reason: data?.reason || 'unknown',
            timestamp: Date.now()
        });
        
        // 재연결 시도
        this.attemptReconnection();
    }
    
    /**
     * 허브 세션 변경 처리
     */
    handleHubSessionChange(sessionData) {
        console.log('🔄 허브 세션 변경:', sessionData);
        
        this.hubSession = sessionData;
        this.saveHubSession(sessionData);
        
        // 게임 세션과 동기화
        if (this.gameSession) {
            this.linkGameSessionToHub(sessionData);
        }
    }
    
    /**
     * 허브 센서 이벤트 처리
     */
    handleHubSensorEvent(eventData) {
        console.log('📱 허브 센서 이벤트:', eventData);
        
        switch (eventData.type) {
            case 'sensor-request':
                this.handleSensorRequest(eventData);
                break;
            case 'sensor-calibration':
                this.handleSensorCalibration(eventData);
                break;
            case 'sensor-reset':
                this.handleSensorReset(eventData);
                break;
        }
    }
    
    /**
     * 허브 세션 복구
     */
    async restoreHubSession(sessionData = null) {
        const targetSession = sessionData || this.hubSession;
        if (!targetSession) return;
        
        console.log('🔄 허브 세션 복구 시도:', targetSession.id);
        
        try {
            // 허브 세션 상태 확인
            const sessionStatus = await this.checkHubSessionStatus(targetSession.id);
            
            if (sessionStatus.active) {
                // 활성 세션이면 복구
                this.hubSession = sessionStatus.session;
                
                // 게임 세션 재생성 또는 복구
                if (sessionStatus.gameSession) {
                    this.gameSession = sessionStatus.gameSession;
                } else {
                    await this.createGameSession();
                }
                
                console.log('✅ 허브 세션 복구 완료');
                
            } else {
                console.warn('⚠️ 허브 세션이 비활성 상태');
                await this.createNewHubSession();
            }
            
        } catch (error) {
            console.error('❌ 허브 세션 복구 실패:', error);
            await this.createNewHubSession();
        }
    }
    
    /**
     * 게임 세션을 허브와 연결
     */
    async linkGameSessionToHub(gameSession) {
        if (!this.hubSession) return;
        
        try {
            await this.hubCommunication.reportToHubAPI('link-sessions', {
                hubSessionId: this.hubSession.id,
                gameSessionCode: gameSession.sessionCode || gameSession,
                gameId: this.hubCommunication.getGameId(),
                timestamp: Date.now()
            });
            
            console.log('🔗 게임 세션이 허브와 연결됨');
            
        } catch (error) {
            console.warn('⚠️ 세션 연결 실패:', error.message);
        }
    }
    
    /**
     * 센서 데이터 검증
     */
    validateSensorData(data) {
        // 허브 환경에서의 센서 데이터 검증 로직
        if (!data || !data.sensorId || !data.data) {
            console.warn('⚠️ 유효하지 않은 센서 데이터:', data);
            return null;
        }
        
        // 데이터 범위 검증
        if (data.data.orientation) {
            const { alpha, beta, gamma } = data.data.orientation;
            if (isNaN(alpha) || isNaN(beta) || isNaN(gamma)) {
                console.warn('⚠️ 센서 데이터에 NaN 값 포함');
                return null;
            }
        }
        
        return data;
    }
    
    /**
     * 재연결 시도
     */
    async attemptReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ 최대 재연결 시도 횟수 초과');
            this.handleMaxReconnectAttemptsReached();
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`🔄 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        setTimeout(async () => {
            try {
                await this.sessionSDK.connect();
            } catch (error) {
                console.warn('⚠️ 재연결 실패:', error.message);
                this.attemptReconnection();
            }
        }, this.reconnectDelay * this.reconnectAttempts);
    }
    
    /**
     * 센서 재연결 시도
     */
    async attemptSensorReconnection(sensorId) {
        console.log(`🔄 센서 재연결 시도: ${sensorId}`);
        
        // 허브에 센서 재연결 요청
        if (this.hubCommunication.isRunningInHub()) {
            await this.hubCommunication.reportToHubAPI('sensor-reconnect-request', {
                sensorId: sensorId,
                sessionCode: this.gameSession,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * 세션 정보 저장
     */
    saveSessionInfo(session) {
        try {
            const sessionInfo = {
                gameSession: session.sessionCode,
                hubSession: this.hubSession?.id,
                timestamp: Date.now()
            };
            
            localStorage.setItem('gameSessionInfo', JSON.stringify(sessionInfo));
            
        } catch (error) {
            console.warn('⚠️ 세션 정보 저장 실패:', error.message);
        }
    }
    
    /**
     * 허브 세션 저장
     */
    saveHubSession(session) {
        try {
            localStorage.setItem('hubSession', JSON.stringify(session));
        } catch (error) {
            console.warn('⚠️ 허브 세션 저장 실패:', error.message);
        }
    }
    
    /**
     * 연결된 센서 목록 반환
     */
    getConnectedSensors() {
        if (this.gameController.getConnectedSensors) {
            return this.gameController.getConnectedSensors();
        }
        
        return [];
    }
    
    /**
     * 게임 세션 생성
     */
    async createGameSession() {
        if (this.sessionSDK && this.sessionState === 'connected') {
            try {
                const session = await this.sessionSDK.createSession();
                return session;
            } catch (error) {
                console.error('❌ 게임 세션 생성 실패:', error);
                throw error;
            }
        }
        
        throw new Error('SessionSDK가 연결되지 않음');
    }
    
    /**
     * 정리
     */
    cleanup() {
        console.log('🧹 허브 세션 통합 정리 중...');
        
        // 동기화 인터벌 정리
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        // SessionSDK 정리
        if (this.sessionSDK && this.sessionSDK.disconnect) {
            this.sessionSDK.disconnect();
        }
        
        // 세션 정보 정리
        this.sessionState = 'disconnected';
        
        console.log('✅ 허브 세션 통합 정리 완료');
    }
    
    /**
     * 현재 세션 상태 반환
     */
    getSessionState() {
        return {
            sessionState: this.sessionState,
            gameSession: this.gameSession,
            hubSession: this.hubSession?.id,
            connectedSensors: this.getConnectedSensors(),
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// 전역에서 사용할 수 있도록 export
if (typeof window !== 'undefined') {
    window.HubSessionIntegration = HubSessionIntegration;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HubSessionIntegration;
}