/**
 * SessionStateManager Class - 세션 상태 관리 및 재시작 시 연결 유지
 * 게임 재시작 시 기존 센서 연결을 유지하고 게임 상태만 초기화하는 시스템
 */
class SessionStateManager {
    constructor() {
        this.sessionData = {
            sessionCode: null,
            isActive: false,
            connectedSensors: new Map(), // sensorId -> sensor info
            playerAssignments: new Map(), // sensorId -> playerId
            connectionHistory: [], // 연결 기록
            gameState: 'waiting' // waiting, ready, racing, paused, finished
        };
        
        this.preservedState = {
            sdk: null,
            qrCodeData: null,
            sessionCreatedAt: null,
            totalGamesPlayed: 0,
            continuousPlaySession: false
        };
        
        this.eventCallbacks = new Map();
        this.reconnectionAttempts = new Map(); // sensorId -> attempt count
        this.maxReconnectionAttempts = 5;
        
        console.log('SessionStateManager initialized');
    }
    
    /**
     * 세션 초기화 (최초 게임 시작 시)
     * @param {Object} sdk - SessionSDK 인스턴스
     * @param {string} sessionCode - 세션 코드
     */
    initializeSession(sdk, sessionCode) {
        console.log('🔄 세션 초기화 시작:', sessionCode);
        
        this.preservedState.sdk = sdk;
        this.sessionData.sessionCode = sessionCode;
        this.sessionData.isActive = true;
        this.preservedState.sessionCreatedAt = Date.now();
        
        // 세션 이벤트 리스너 설정
        this.setupSessionEventListeners(sdk);
        
        console.log('✅ 세션 초기화 완료');
        this.emitEvent('session-initialized', {
            sessionCode: sessionCode,
            timestamp: Date.now()
        });
    }
    
    /**
     * 센서 연결 등록
     * @param {string} sensorId - 센서 ID (sensor1, sensor2)
     * @param {Object} sensorInfo - 센서 정보
     */
    registerSensorConnection(sensorId, sensorInfo = {}) {
        console.log(`🔗 센서 연결 등록: ${sensorId}`);
        
        const connectionInfo = {
            sensorId: sensorId,
            connectedAt: Date.now(),
            deviceInfo: sensorInfo.deviceInfo || {},
            connectionCount: (this.connectedSensors.get(sensorId)?.connectionCount || 0) + 1,
            isReconnection: this.connectedSensors.has(sensorId)
        };
        
        this.sessionData.connectedSensors.set(sensorId, connectionInfo);
        
        // 플레이어 할당
        const playerId = this.assignPlayerToSensor(sensorId);
        this.sessionData.playerAssignments.set(sensorId, playerId);
        
        // 연결 기록 저장
        this.sessionData.connectionHistory.push({
            action: 'connected',
            sensorId: sensorId,
            playerId: playerId,
            timestamp: Date.now(),
            isReconnection: connectionInfo.isReconnection
        });
        
        // 재연결 시도 횟수 초기화
        this.reconnectionAttempts.delete(sensorId);
        
        console.log(`✅ 센서 ${sensorId} -> ${playerId} 할당 완료`);
        this.emitEvent('sensor-connected', {
            sensorId: sensorId,
            playerId: playerId,
            connectionInfo: connectionInfo
        });
        
        // 모든 센서가 연결되었는지 확인
        this.checkAllSensorsConnected();
    }
    
    /**
     * 센서 연결 해제 처리
     * @param {string} sensorId - 센서 ID
     */
    handleSensorDisconnection(sensorId) {
        console.log(`🔌 센서 연결 해제: ${sensorId}`);
        
        const sensorInfo = this.sessionData.connectedSensors.get(sensorId);
        if (!sensorInfo) {
            console.warn(`⚠️ 알 수 없는 센서 연결 해제: ${sensorId}`);
            return;
        }
        
        // 연결 기록 저장
        this.sessionData.connectionHistory.push({
            action: 'disconnected',
            sensorId: sensorId,
            playerId: this.sessionData.playerAssignments.get(sensorId),
            timestamp: Date.now(),
            connectionDuration: Date.now() - sensorInfo.connectedAt
        });
        
        // 센서 정보는 유지하되 연결 상태만 업데이트
        sensorInfo.disconnectedAt = Date.now();
        sensorInfo.isConnected = false;
        
        console.log(`❌ 센서 ${sensorId} 연결 해제됨`);
        this.emitEvent('sensor-disconnected', {
            sensorId: sensorId,
            playerId: this.sessionData.playerAssignments.get(sensorId)
        });
        
        // 게임 중이라면 일시정지
        if (this.sessionData.gameState === 'racing') {
            this.pauseGameForReconnection(sensorId);
        }
        
        // 자동 재연결 시도
        this.attemptReconnection(sensorId);
    }
    
    /**
     * 센서에 플레이어 할당
     * @param {string} sensorId - 센서 ID
     * @returns {string} 할당된 플레이어 ID
     */
    assignPlayerToSensor(sensorId) {
        // 기존 할당이 있다면 유지
        if (this.sessionData.playerAssignments.has(sensorId)) {
            return this.sessionData.playerAssignments.get(sensorId);
        }
        
        // 새로운 할당
        const assignedPlayers = new Set(this.sessionData.playerAssignments.values());
        
        if (!assignedPlayers.has('player1')) {
            return 'player1';
        } else if (!assignedPlayers.has('player2')) {
            return 'player2';
        } else {
            // 모든 플레이어가 할당된 경우 (예외 상황)
            console.warn('⚠️ 모든 플레이어 슬롯이 이미 할당됨');
            return 'player1'; // 기본값
        }
    }
    
    /**
     * 게임 재시작 (세션 유지)
     * @param {Object} gameManager - 게임 매니저 인스턴스
     */
    async restartGameWithSessionPreservation(gameManager) {
        console.log('🔄 세션 유지 게임 재시작 시작...');
        
        // 현재 연결된 센서 정보 보존
        const connectedSensors = Array.from(this.sessionData.connectedSensors.entries())
            .filter(([sensorId, info]) => info.isConnected !== false);
        
        console.log(`📊 보존할 센서 연결: ${connectedSensors.length}개`);
        
        // 게임 상태만 초기화 (세션은 유지)
        this.resetGameState();
        
        // 게임 매니저 상태 초기화
        if (gameManager && typeof gameManager.resetGameState === 'function') {
            await gameManager.resetGameState(false); // false = 세션 유지
        }
        
        // 연결된 센서들 재할당
        for (const [sensorId, sensorInfo] of connectedSensors) {
            const playerId = this.sessionData.playerAssignments.get(sensorId);
            console.log(`🔗 센서 재할당: ${sensorId} -> ${playerId}`);
            
            // 센서 데이터 처리 재개
            this.emitEvent('sensor-reassigned', {
                sensorId: sensorId,
                playerId: playerId,
                preservedConnection: true
            });
        }
        
        // 연속 플레이 세션 표시
        this.preservedState.continuousPlaySession = true;
        this.preservedState.totalGamesPlayed++;
        
        console.log(`✅ 세션 유지 재시작 완료 (게임 ${this.preservedState.totalGamesPlayed}회차)`);
        
        this.emitEvent('game-restarted-with-session', {
            sessionCode: this.sessionData.sessionCode,
            gameCount: this.preservedState.totalGamesPlayed,
            connectedSensors: connectedSensors.length
        });
        
        return {
            success: true,
            sessionCode: this.sessionData.sessionCode,
            connectedSensors: connectedSensors.length,
            gameCount: this.preservedState.totalGamesPlayed
        };
    }
    
    /**
     * 게임 상태만 초기화 (세션 정보는 유지)
     */
    resetGameState() {
        console.log('🔄 게임 상태 초기화 (세션 유지)');
        
        // 게임 상태만 리셋
        this.sessionData.gameState = 'ready';
        
        // 연결 상태는 유지하되 게임 관련 상태만 초기화
        for (const [sensorId, sensorInfo] of this.sessionData.connectedSensors) {
            if (sensorInfo.isConnected !== false) {
                sensorInfo.gameResetAt = Date.now();
                sensorInfo.gameResetCount = (sensorInfo.gameResetCount || 0) + 1;
            }
        }
        
        console.log('✅ 게임 상태 초기화 완료');
    }
    
    /**
     * 재연결을 위한 게임 일시정지
     * @param {string} sensorId - 연결이 끊어진 센서 ID
     */
    pauseGameForReconnection(sensorId) {
        console.log(`⏸️ 재연결을 위한 게임 일시정지: ${sensorId}`);
        
        this.sessionData.gameState = 'paused';
        
        this.emitEvent('game-paused-for-reconnection', {
            sensorId: sensorId,
            playerId: this.sessionData.playerAssignments.get(sensorId),
            timestamp: Date.now()
        });
    }
    
    /**
     * 자동 재연결 시도
     * @param {string} sensorId - 재연결할 센서 ID
     */
    attemptReconnection(sensorId) {
        const attempts = this.reconnectionAttempts.get(sensorId) || 0;
        
        if (attempts >= this.maxReconnectionAttempts) {
            console.log(`❌ 센서 ${sensorId} 최대 재연결 시도 횟수 초과`);
            this.emitEvent('reconnection-failed', {
                sensorId: sensorId,
                attempts: attempts
            });
            return;
        }
        
        console.log(`🔄 센서 ${sensorId} 재연결 시도 ${attempts + 1}/${this.maxReconnectionAttempts}`);
        
        this.reconnectionAttempts.set(sensorId, attempts + 1);
        
        // 재연결 시도 이벤트 발생
        this.emitEvent('reconnection-attempt', {
            sensorId: sensorId,
            attempt: attempts + 1,
            maxAttempts: this.maxReconnectionAttempts
        });
        
        // 3초 후 다시 시도
        setTimeout(() => {
            if (this.sessionData.connectedSensors.get(sensorId)?.isConnected === false) {
                this.attemptReconnection(sensorId);
            }
        }, 3000);
    }
    
    /**
     * 모든 센서 연결 상태 확인
     */
    checkAllSensorsConnected() {
        const connectedCount = Array.from(this.sessionData.connectedSensors.values())
            .filter(info => info.isConnected !== false).length;
        
        console.log(`📊 연결된 센서: ${connectedCount}/2`);
        
        if (connectedCount === 2) {
            this.sessionData.gameState = 'ready';
            console.log('✅ 모든 센서 연결 완료 - 게임 준비됨');
            
            this.emitEvent('all-sensors-connected', {
                connectedSensors: connectedCount,
                sessionCode: this.sessionData.sessionCode
            });
        } else {
            this.sessionData.gameState = 'waiting';
        }
    }
    
    /**
     * 세션 이벤트 리스너 설정
     * @param {Object} sdk - SessionSDK 인스턴스
     */
    setupSessionEventListeners(sdk) {
        // 센서 연결 이벤트
        sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            this.registerSensorConnection(data.sensorId, data);
        });
        
        // 센서 연결 해제 이벤트
        sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;
            this.handleSensorDisconnection(data.sensorId);
        });
        
        // 센서 데이터 수신 이벤트
        sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.handleSensorData(data);
        });
    }
    
    /**
     * 센서 데이터 처리
     * @param {Object} sensorData - 센서 데이터
     */
    handleSensorData(sensorData) {
        const sensorInfo = this.sessionData.connectedSensors.get(sensorData.sensorId);
        
        if (!sensorInfo) {
            console.warn(`⚠️ 알 수 없는 센서에서 데이터 수신: ${sensorData.sensorId}`);
            return;
        }
        
        // 연결 상태 업데이트 (데이터 수신 = 연결됨)
        if (sensorInfo.isConnected === false) {
            console.log(`🔗 센서 ${sensorData.sensorId} 재연결됨 (데이터 수신)`);
            sensorInfo.isConnected = true;
            sensorInfo.reconnectedAt = Date.now();
            
            this.emitEvent('sensor-reconnected', {
                sensorId: sensorData.sensorId,
                playerId: this.sessionData.playerAssignments.get(sensorData.sensorId)
            });
            
            this.checkAllSensorsConnected();
        }
        
        // 센서 데이터를 게임 매니저로 전달
        this.emitEvent('sensor-data-processed', {
            sensorData: sensorData,
            playerId: this.sessionData.playerAssignments.get(sensorData.sensorId)
        });
    }
    
    /**
     * 이벤트 리스너 등록
     * @param {string} eventName - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     */
    on(eventName, callback) {
        if (!this.eventCallbacks.has(eventName)) {
            this.eventCallbacks.set(eventName, []);
        }
        this.eventCallbacks.get(eventName).push(callback);
    }
    
    /**
     * 이벤트 발생
     * @param {string} eventName - 이벤트 이름
     * @param {Object} data - 이벤트 데이터
     */
    emitEvent(eventName, data) {
        const callbacks = this.eventCallbacks.get(eventName);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`이벤트 콜백 오류 (${eventName}):`, error);
                }
            });
        }
    }
    
    /**
     * 세션 상태 정보 반환
     * @returns {Object} 세션 상태 정보
     */
    getSessionState() {
        return {
            sessionCode: this.sessionData.sessionCode,
            isActive: this.sessionData.isActive,
            gameState: this.sessionData.gameState,
            connectedSensors: Array.from(this.sessionData.connectedSensors.entries()),
            playerAssignments: Array.from(this.sessionData.playerAssignments.entries()),
            totalGamesPlayed: this.preservedState.totalGamesPlayed,
            continuousPlaySession: this.preservedState.continuousPlaySession,
            sessionDuration: Date.now() - (this.preservedState.sessionCreatedAt || Date.now())
        };
    }
    
    /**
     * 세션 통계 정보 반환
     * @returns {Object} 세션 통계
     */
    getSessionStats() {
        const connectionHistory = this.sessionData.connectionHistory;
        const connections = connectionHistory.filter(h => h.action === 'connected');
        const disconnections = connectionHistory.filter(h => h.action === 'disconnected');
        
        return {
            totalConnections: connections.length,
            totalDisconnections: disconnections.length,
            reconnections: connections.filter(c => c.isReconnection).length,
            averageConnectionDuration: this.calculateAverageConnectionDuration(),
            gamesPlayed: this.preservedState.totalGamesPlayed,
            sessionUptime: Date.now() - (this.preservedState.sessionCreatedAt || Date.now())
        };
    }
    
    /**
     * 평균 연결 지속 시간 계산
     * @returns {number} 평균 연결 시간 (밀리초)
     */
    calculateAverageConnectionDuration() {
        const disconnections = this.sessionData.connectionHistory
            .filter(h => h.action === 'disconnected' && h.connectionDuration);
        
        if (disconnections.length === 0) return 0;
        
        const totalDuration = disconnections.reduce((sum, d) => sum + d.connectionDuration, 0);
        return totalDuration / disconnections.length;
    }
    
    /**
     * 세션 정리
     */
    cleanup() {
        console.log('🧹 SessionStateManager 정리 시작...');
        
        // 이벤트 콜백 정리
        this.eventCallbacks.clear();
        
        // 재연결 시도 정리
        this.reconnectionAttempts.clear();
        
        // 세션 데이터 정리
        this.sessionData.connectedSensors.clear();
        this.sessionData.playerAssignments.clear();
        this.sessionData.isActive = false;
        
        console.log('✅ SessionStateManager 정리 완료');
    }
}

// 전역 인스턴스 생성
window.sessionStateManager = new SessionStateManager();

console.log('SessionStateManager 모듈 로드 완료');