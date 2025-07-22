/**
 * SessionSDK
 * 센서 게임 허브와의 통신을 관리하는 SDK
 */
class SessionSDK {
    constructor(options = {}) {
        this.options = {
            gameId: options.gameId || 'unknown-game',
            gameType: options.gameType || 'solo',
            debug: options.debug || false,
            autoConnect: options.autoConnect !== false,
            reconnectAttempts: options.reconnectAttempts || 5,
            reconnectDelay: options.reconnectDelay || 3000
        };
        
        this.socket = null;
        this.session = null;
        this.connected = false;
        this.reconnectCount = 0;
        this.eventListeners = {};
        
        if (this.options.autoConnect) {
            this.connect();
        }
        
        this.log('SessionSDK 초기화 완료');
    }
    
    /**
     * 이벤트 리스너 등록
     */
    on(eventType, callback) {
        if (!this.eventListeners[eventType]) {
            this.eventListeners[eventType] = [];
        }
        this.eventListeners[eventType].push(callback);
    }
    
    /**
     * 이벤트 리스너 제거
     */
    off(eventType, callback) {
        if (this.eventListeners[eventType]) {
            this.eventListeners[eventType] = this.eventListeners[eventType]
                .filter(listener => listener !== callback);
        }
    }
    
    /**
     * 이벤트 발생
     */
    emit(eventType, data) {
        if (this.eventListeners[eventType]) {
            this.eventListeners[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`SessionSDK 이벤트 콜백 오류 (${eventType}):`, error);
                }
            });
        }
    }
    
    /**
     * 서버에 연결
     */
    connect() {
        try {
            // 이미 연결된 경우 무시
            if (this.socket && this.connected) {
                this.log('이미 연결되어 있습니다.');
                return;
            }
            
            // Socket.IO 연결
            this.socket = io();
            
            // 이벤트 리스너 설정
            this.socket.on('connect', this.handleConnect.bind(this));
            this.socket.on('disconnect', this.handleDisconnect.bind(this));
            this.socket.on('error', this.handleError.bind(this));
            
            // 게임 관련 이벤트
            this.socket.on('session-created', this.handleSessionCreated.bind(this));
            this.socket.on('sensor-connected', this.handleSensorConnected.bind(this));
            this.socket.on('sensor-data', this.handleSensorData.bind(this));
            this.socket.on('sensor-disconnected', this.handleSensorDisconnected.bind(this));
            this.socket.on('game-ready', this.handleGameReady.bind(this));
            
        } catch (error) {
            this.log('연결 오류:', error);
            this.triggerEvent('error', { error });
            this.attemptReconnect();
        }
    }
    
    /**
     * 연결 해제
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.log('연결 해제됨');
        }
    }
    
    /**
     * 재연결 시도
     */
    attemptReconnect() {
        if (this.reconnectCount >= this.options.reconnectAttempts) {
            this.log('최대 재연결 시도 횟수 초과');
            this.triggerEvent('reconnect-failed');
            return;
        }
        
        this.reconnectCount++;
        const delay = this.options.reconnectDelay * this.reconnectCount;
        
        this.log(`${delay}ms 후 재연결 시도 (${this.reconnectCount}/${this.options.reconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }
    
    /**
     * 세션 생성
     */
    async createSession() {
        try {
            if (!this.connected) {
                throw new Error('서버에 연결되어 있지 않습니다.');
            }
            
            const sessionData = {
                gameId: this.options.gameId,
                gameType: this.options.gameType
            };
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('세션 생성 시간 초과'));
                }, 5000);
                
                this.socket.emit('create-session', sessionData, (response) => {
                    clearTimeout(timeout);
                    
                    if (response.success) {
                        this.session = response.session;
                        this.emit('session-created', response.session);
                        resolve(response.session);
                    } else {
                        reject(new Error(response.error || '세션 생성 실패'));
                    }
                });
            });
            
        } catch (error) {
            this.log('세션 생성 오류:', error);
            throw error;
        }
    }
    
    /**
     * 메시지 전송
     */
    sendMessage(type, data = {}) {
        if (!this.connected || !this.socket) {
            this.log('메시지 전송 실패: 연결되어 있지 않음');
            return false;
        }
        
        try {
            const message = {
                type,
                ...data,
                sessionCode: this.session ? this.session.sessionCode : null
            };
            
            this.socket.emit(type, message);
            return true;
        } catch (error) {
            this.log('메시지 전송 오류:', error);
            return false;
        }
    }
    
    /**
     * 연결 핸들러
     */
    handleConnect() {
        this.connected = true;
        this.reconnectCount = 0;
        this.log('서버에 연결됨');
        this.triggerEvent('connected');
    }
    
    /**
     * 연결 해제 핸들러
     */
    handleDisconnect(reason) {
        this.connected = false;
        this.log(`연결 해제됨: ${reason}`);
        this.triggerEvent('disconnected', { reason });
        
        // 비정상 종료인 경우 재연결 시도
        if (reason !== 'io client disconnect') {
            this.attemptReconnect();
        }
    }
    
    /**
     * 오류 핸들러
     */
    handleError(error) {
        this.log('소켓 오류:', error);
        this.triggerEvent('error', { error });
    }
    
    /**
     * 세션 생성 핸들러
     */
    handleSessionCreated(session) {
        this.log('세션 생성됨:', session);
        this.triggerEvent('session-created', session);
    }
    
    /**
     * 센서 연결 핸들러
     */
    handleSensorConnected(data) {
        this.log('센서 연결됨:', data);
        this.triggerEvent('sensor-connected', data);
    }
    
    /**
     * 센서 데이터 핸들러
     */
    handleSensorData(data) {
        if (this.options.debug) {
            this.log('센서 데이터 수신:', data);
        }
        this.triggerEvent('sensor-data', data);
    }
    
    /**
     * 센서 연결 해제 핸들러
     */
    handleSensorDisconnected(data) {
        this.log('센서 연결 해제됨:', data);
        this.triggerEvent('sensor-disconnected', data);
    }
    
    /**
     * 게임 준비 핸들러
     */
    handleGameReady(data) {
        this.log('게임 준비 완료:', data);
        this.triggerEvent('game-ready', data);
    }
    
    // 중복 메서드 제거됨 (상단에 이미 동일한 메서드가 정의되어 있음)
    
    /**
     * 이벤트 발생
     */
    triggerEvent(eventName, data = {}) {
        // emit 메서드를 사용하여 일관된 이벤트 처리
        this.emit(eventName, data);
    }
    
    /**
     * 로그 출력
     */
    log(...args) {
        if (this.options.debug) {
            console.log('📡 [SessionSDK]', ...args);
        }
    }
    
    /**
     * 재연결
     */
    reconnect() {
        this.disconnect();
        this.reconnectCount = 0;
        this.connect();
    }
    
    /**
     * 세션 코드 가져오기
     */
    getSessionCode() {
        return this.session ? this.session.sessionCode : null;
    }
    
    /**
     * 연결 상태 확인
     */
    isConnected() {
        return this.connected;
    }
}