/**
 * 🚀 Sensor Game Hub v6.0 Server
 * 
 * 완벽한 게임별 독립 세션 시스템
 * - Express + Socket.IO 기반
 * - 실시간 센서 데이터 처리
 * - 자동 세션 관리 및 정리
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const SessionManager = require('./SessionManager');

class GameServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });
        
        this.sessionManager = new SessionManager();
        this.port = process.env.PORT || 3000;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        
        console.log('🚀 GameServer v6.0 초기화 완료');
    }
    
    /**
     * 미들웨어 설정
     */
    setupMiddleware() {
        // 보안 및 성능 미들웨어
        this.app.use(helmet({
            contentSecurityPolicy: false, // 개발 편의상 비활성화
            crossOriginEmbedderPolicy: false
        }));
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json());
        
        // 정적 파일 서빙
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // 요청 로깅
        this.app.use((req, res, next) => {
            console.log(`📝 ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }
    
    /**
     * HTTP 라우트 설정
     */
    setupRoutes() {
        // 기본 루트
        this.app.get('/', (req, res) => {
            res.redirect('/hub.html');
        });
        
        // 게임 라우트
        this.app.get('/games/:gameType', (req, res) => {
            const { gameType } = req.params;
            const validTypes = ['solo', 'dual', 'multi'];
            
            if (!validTypes.includes(gameType)) {
                return res.status(404).send('게임 타입을 찾을 수 없습니다.');
            }
            
            res.sendFile(path.join(__dirname, `../public/games/${gameType}/index.html`));
        });
        
        // API 라우트
        this.app.get('/api/stats', (req, res) => {
            try {
                const stats = this.sessionManager.getStats();
                res.json({
                    success: true,
                    data: stats,
                    timestamp: Date.now()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // 세션 정보 조회
        this.app.get('/api/session/:code', (req, res) => {
            try {
                const { code } = req.params;
                const session = this.sessionManager.findSessionByCode(code);
                
                if (!session) {
                    return res.status(404).json({
                        success: false,
                        error: '세션을 찾을 수 없습니다.'
                    });
                }
                
                res.json({
                    success: true,
                    data: {
                        sessionId: session.id,
                        gameType: session.gameType,
                        state: session.state,
                        connectedSensors: session.sensors.size,
                        maxSensors: session.maxSensors
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // 404 핸들러
        this.app.use((req, res) => {
            res.status(404).send(`
                <h1>404 - 페이지를 찾을 수 없습니다</h1>
                <p><a href="/">홈으로 돌아가기</a></p>
            `);
        });
    }
    
    /**
     * Socket.IO 이벤트 핸들러 설정
     */
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 클라이언트 연결: ${socket.id} (${socket.handshake.address})`);
            
            // 게임 세션 생성 (게임에서 호출)
            socket.on('create-session', (data, callback) => {
                try {
                    const { gameId, gameType } = data;
                    
                    if (!gameId || !gameType) {
                        throw new Error('gameId와 gameType이 필요합니다.');
                    }
                    
                    const session = this.sessionManager.createSession(
                        gameId,
                        gameType,
                        socket.id,
                        socket.handshake.address
                    );
                    
                    // 게임 클라이언트에 세션 정보 전송
                    callback({
                        success: true,
                        session: session
                    });
                    
                    console.log(`🎮 세션 생성됨: ${session.sessionCode} for ${gameId}`);
                    
                } catch (error) {
                    console.error(`❌ 세션 생성 실패:`, error.message);
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            });
            
            // 센서 클라이언트 연결 (모바일에서 호출)
            socket.on('connect-sensor', (data, callback) => {
                try {
                    const { sessionCode, deviceInfo } = data;
                    
                    if (!sessionCode) {
                        throw new Error('세션 코드가 필요합니다.');
                    }
                    
                    const result = this.sessionManager.connectSensor(
                        sessionCode,
                        socket.id,
                        socket.handshake.address,
                        deviceInfo
                    );
                    
                    // 센서 클라이언트에 연결 확인
                    callback({
                        success: true,
                        connection: result
                    });
                    
                    // 게임 호스트에 센서 연결 알림
                    const session = this.sessionManager.getSession(result.sessionId);
                    socket.to(session.host.socketId).emit('sensor-connected', {
                        sensorId: result.sensorId,
                        gameType: session.gameType,
                        connectedSensors: result.connectedSensors,
                        maxSensors: result.maxSensors,
                        isReady: result.isReady
                    });
                    
                    // 모든 센서가 연결되면 게임 준비 완료 알림
                    if (result.isReady) {
                        socket.to(session.host.socketId).emit('game-ready', {
                            sessionId: result.sessionId,
                            gameType: session.gameType,
                            connectedSensors: Array.from(session.sensors.keys())
                        });
                    }
                    
                    console.log(`📱 센서 연결됨: ${result.sensorId} → ${sessionCode}`);
                    
                } catch (error) {
                    console.error(`❌ 센서 연결 실패:`, error.message);
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            });
            
            // 센서 데이터 수신 (모바일에서 호출)
            socket.on('sensor-data', (data) => {
                try {
                    const { sessionCode, sensorId, sensorData } = data;
                    
                    const result = this.sessionManager.updateSensorData(
                        sessionCode,
                        sensorId,
                        sensorData
                    );
                    
                    // 게임 호스트에 센서 데이터 전달
                    socket.to(result.hostSocketId).emit('sensor-update', result.sensorData);
                    
                } catch (error) {
                    console.error(`❌ 센서 데이터 처리 실패:`, error.message);
                    socket.emit('sensor-error', { error: error.message });
                }
            });
            
            // 게임 시작 (게임에서 호출)
            socket.on('start-game', (data, callback) => {
                try {
                    const { sessionId } = data;
                    
                    const gameInfo = this.sessionManager.startGame(sessionId);
                    
                    callback({
                        success: true,
                        game: gameInfo
                    });
                    
                    // 모든 센서 클라이언트에 게임 시작 알림
                    const session = this.sessionManager.getSession(sessionId);
                    for (const sensor of session.sensors.values()) {
                        socket.to(sensor.socketId).emit('game-started', {
                            gameType: session.gameType,
                            sensorId: sensor.id
                        });
                    }
                    
                    console.log(`🎮 게임 시작: ${session.code}`);
                    
                } catch (error) {
                    console.error(`❌ 게임 시작 실패:`, error.message);
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            });
            
            // 연결 해제 처리
            socket.on('disconnect', () => {
                console.log(`🔌 클라이언트 연결 해제: ${socket.id}`);
                
                const disconnections = this.sessionManager.disconnect(socket.id);
                
                // 연결 해제 알림 전송
                disconnections.forEach(disconnection => {
                    if (disconnection.type === 'host_disconnected') {
                        // 모든 센서에 호스트 연결 해제 알림
                        disconnection.affectedSensors.forEach(sensorId => {
                            this.io.emit('host-disconnected', { sessionId: disconnection.sessionId });
                        });
                    } else if (disconnection.type === 'sensor_disconnected') {
                        // 호스트에 센서 연결 해제 알림
                        socket.to(disconnection.hostSocketId).emit('sensor-disconnected', {
                            sensorId: disconnection.sensorId,
                            remainingSensors: disconnection.remainingSensors
                        });
                    }
                });
            });
            
            // 핑 응답
            socket.on('ping', (callback) => {
                if (callback) callback({ pong: Date.now() });
            });
        });
    }
    
    /**
     * 서버 시작
     */
    start() {
        this.server.listen(this.port, () => {
            console.log(`🚀 Sensor Game Hub v6.0 서버 시작`);
            console.log(`📍 포트: ${this.port}`);
            console.log(`🌐 URL: http://localhost:${this.port}`);
            console.log(`📱 센서: http://localhost:${this.port}/sensor.html`);
            console.log(`🎮 게임: http://localhost:${this.port}/games/[solo|dual|multi]`);
        });
    }
    
    /**
     * 서버 종료
     */
    stop() {
        this.server.close(() => {
            console.log('🛑 서버가 종료되었습니다.');
        });
    }
}

// 서버 시작
const server = new GameServer();
server.start();

// 우아한 종료 처리
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM 신호 수신, 서버 종료 중...');
    server.stop();
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT 신호 수신, 서버 종료 중...');
    server.stop();
    process.exit(0);
});

module.exports = GameServer;