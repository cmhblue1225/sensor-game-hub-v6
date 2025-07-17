/**
 * 🔐 SessionManager v6.0
 * 
 * 완벽한 게임별 독립 세션 관리 시스템
 * - 게임별 고유 세션 생성
 * - 실시간 센서 연결 관리
 * - 자동 세션 정리 및 타임아웃
 */

class SessionManager {
    constructor() {
        // 활성 세션 저장소
        this.sessions = new Map();
        
        // 설정값
        this.config = {
            sessionTimeout: 30 * 60 * 1000, // 30분
            cleanupInterval: 5 * 60 * 1000,  // 5분마다 정리
            maxSessionsPerIP: 10,            // IP당 최대 세션 수
            sessionCodeLength: 4             // 세션 코드 길이
        };
        
        // 정기 정리 작업 시작
        this.startCleanupTimer();
        
        console.log('🔐 SessionManager v6.0 초기화 완료');
    }
    
    /**
     * 새 세션 생성
     */
    createSession(gameId, gameType, hostSocketId, hostIP) {
        console.log(`🔍 createSession 호출됨:`, { gameId, gameType, hostSocketId, hostIP });
        
        const sessionCode = this.generateSessionCode();
        console.log(`🔍 generateSessionCode 결과: "${sessionCode}" (타입: ${typeof sessionCode})`);
        
        const sessionId = `${gameId}_${sessionCode}_${Date.now()}`;
        
        const session = {
            id: sessionId,
            code: sessionCode,
            gameId: gameId,
            gameType: gameType, // 'solo', 'dual', 'multi'
            host: {
                socketId: hostSocketId,
                ip: hostIP,
                connectedAt: Date.now()
            },
            sensors: new Map(), // sensorId -> sensor data
            state: 'waiting', // 'waiting', 'ready', 'playing', 'finished'
            createdAt: Date.now(),
            lastActivity: Date.now(),
            maxSensors: this.getMaxSensors(gameType)
        };
        
        this.sessions.set(sessionId, session);
        
        console.log(`🎮 새 세션 생성: ${sessionCode} (${gameType}) for ${gameId}`);
        
        const returnData = {
            sessionId,
            sessionCode: sessionCode,
            gameType,
            maxSensors: session.maxSensors
        };
        
        console.log(`🔍 반환할 세션 데이터:`, returnData);
        console.log(`🔍 sessionCode 값 재확인: "${returnData.sessionCode}" (타입: ${typeof returnData.sessionCode})`);
        
        return returnData;
    }
    
    /**
     * 센서 클라이언트 연결
     */
    connectSensor(sessionCode, sensorSocketId, sensorIP, deviceInfo = {}) {
        const session = this.findSessionByCode(sessionCode);
        
        if (!session) {
            throw new Error(`세션을 찾을 수 없습니다: ${sessionCode}`);
        }
        
        // 센서 수 제한 확인
        if (session.sensors.size >= session.maxSensors) {
            throw new Error(`최대 센서 수 초과: ${session.maxSensors}`);
        }
        
        // 센서 ID 생성 (게임 타입에 따라)
        const sensorId = this.generateSensorId(session, session.sensors.size);
        
        const sensorData = {
            id: sensorId,
            socketId: sensorSocketId,
            ip: sensorIP,
            deviceInfo: deviceInfo,
            connectedAt: Date.now(),
            lastDataReceived: Date.now(),
            isActive: true
        };
        
        session.sensors.set(sensorId, sensorData);
        session.lastActivity = Date.now();
        
        // 세션 상태 업데이트
        this.updateSessionState(session);
        
        console.log(`📱 센서 연결: ${sensorId} → ${sessionCode} (${session.sensors.size}/${session.maxSensors})`);
        
        return {
            sessionId: session.id,
            sensorId: sensorId,
            connectedSensors: session.sensors.size,
            maxSensors: session.maxSensors,
            isReady: session.state === 'ready'
        };
    }
    
    /**
     * 센서 데이터 업데이트
     */
    updateSensorData(sessionCode, sensorId, sensorData) {
        const session = this.findSessionByCode(sessionCode);
        
        if (!session) {
            throw new Error(`세션을 찾을 수 없습니다: ${sessionCode}`);
        }
        
        const sensor = session.sensors.get(sensorId);
        if (!sensor) {
            throw new Error(`센서를 찾을 수 없습니다: ${sensorId}`);
        }
        
        // 센서 데이터 업데이트
        sensor.lastDataReceived = Date.now();
        session.lastActivity = Date.now();
        
        return {
            sessionId: session.id,
            hostSocketId: session.host.socketId,
            sensorData: {
                sensorId,
                gameType: session.gameType,
                data: sensorData,
                timestamp: Date.now()
            }
        };
    }
    
    /**
     * 세션 상태 업데이트
     */
    updateSessionState(session) {
        const connectedSensors = session.sensors.size;
        const requiredSensors = session.maxSensors;
        
        if (connectedSensors >= requiredSensors && session.state === 'waiting') {
            session.state = 'ready';
            console.log(`✅ 세션 준비 완료: ${session.code} (${connectedSensors}/${requiredSensors})`);
        } else if (connectedSensors < requiredSensors && session.state === 'ready') {
            session.state = 'waiting';
            console.log(`⏳ 세션 대기 상태: ${session.code} (${connectedSensors}/${requiredSensors})`);
        }
    }
    
    /**
     * 세션 시작
     */
    startGame(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`세션을 찾을 수 없습니다: ${sessionId}`);
        }
        
        if (session.state !== 'ready') {
            throw new Error(`게임을 시작할 수 없습니다. 현재 상태: ${session.state}`);
        }
        
        session.state = 'playing';
        session.startedAt = Date.now();
        
        console.log(`🎮 게임 시작: ${session.code}`);
        
        return {
            sessionId: session.id,
            gameType: session.gameType,
            connectedSensors: Array.from(session.sensors.keys())
        };
    }
    
    /**
     * 연결 해제 처리
     */
    disconnect(socketId) {
        let removedSessions = [];
        
        for (const [sessionId, session] of this.sessions) {
            // 호스트 연결 해제
            if (session.host.socketId === socketId) {
                console.log(`🖥️ 호스트 연결 해제: ${session.code}`);
                this.sessions.delete(sessionId);
                removedSessions.push({
                    sessionId,
                    type: 'host_disconnected',
                    affectedSensors: Array.from(session.sensors.keys())
                });
                continue;
            }
            
            // 센서 연결 해제
            for (const [sensorId, sensor] of session.sensors) {
                if (sensor.socketId === socketId) {
                    console.log(`📱 센서 연결 해제: ${sensorId} from ${session.code}`);
                    session.sensors.delete(sensorId);
                    session.lastActivity = Date.now();
                    
                    // 세션 상태 업데이트
                    this.updateSessionState(session);
                    
                    removedSessions.push({
                        sessionId,
                        type: 'sensor_disconnected',
                        sensorId,
                        hostSocketId: session.host.socketId,
                        remainingSensors: session.sensors.size
                    });
                    break;
                }
            }
        }
        
        return removedSessions;
    }
    
    /**
     * 세션 정보 조회
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    
    /**
     * 세션 코드로 세션 찾기
     */
    findSessionByCode(sessionCode) {
        for (const session of this.sessions.values()) {
            if (session.code === sessionCode) {
                return session;
            }
        }
        return null;
    }
    
    /**
     * 세션 통계
     */
    getStats() {
        const totalSessions = this.sessions.size;
        const gameTypes = {};
        const states = {};
        let totalSensors = 0;
        
        for (const session of this.sessions.values()) {
            gameTypes[session.gameType] = (gameTypes[session.gameType] || 0) + 1;
            states[session.state] = (states[session.state] || 0) + 1;
            totalSensors += session.sensors.size;
        }
        
        return {
            totalSessions,
            totalSensors,
            gameTypes,
            states,
            uptimeMs: Date.now() - this.startTime
        };
    }
    
    /**
     * 세션 코드 생성
     */
    generateSessionCode() {
        const chars = '0123456789';
        let code = '';
        console.log(`🔍 세션 코드 생성 시작 - 길이: ${this.config.sessionCodeLength}`);
        
        for (let i = 0; i < this.config.sessionCodeLength; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        console.log(`🔍 생성된 세션 코드: "${code}"`);
        
        // 중복 확인
        if (this.findSessionByCode(code)) {
            console.log(`⚠️ 중복 세션 코드 발견, 재생성: ${code}`);
            return this.generateSessionCode(); // 재귀적으로 다시 생성
        }
        
        console.log(`✅ 최종 세션 코드: "${code}"`);
        return code;
    }
    
    /**
     * 센서 ID 생성
     */
    generateSensorId(session, sensorIndex) {
        switch (session.gameType) {
            case 'solo':
                return 'sensor';
            case 'dual':
                return sensorIndex === 0 ? 'sensor1' : 'sensor2';
            case 'multi':
                return `player${sensorIndex + 1}`;
            default:
                return `sensor${sensorIndex + 1}`;
        }
    }
    
    /**
     * 게임 타입별 최대 센서 수
     */
    getMaxSensors(gameType) {
        switch (gameType) {
            case 'solo': return 1;
            case 'dual': return 2;
            case 'multi': return 8;
            default: return 1;
        }
    }
    
    /**
     * 정기 세션 정리
     */
    startCleanupTimer() {
        this.startTime = Date.now();
        
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, this.config.cleanupInterval);
    }
    
    /**
     * 만료된 세션 정리
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [sessionId, session] of this.sessions) {
            const age = now - session.lastActivity;
            
            if (age > this.config.sessionTimeout) {
                console.log(`🧹 만료된 세션 정리: ${session.code} (${Math.round(age / 1000)}초 비활성)`);
                this.sessions.delete(sessionId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 세션 정리 완료: ${cleaned}개 세션 제거, ${this.sessions.size}개 세션 활성`);
        }
    }
}

module.exports = SessionManager;