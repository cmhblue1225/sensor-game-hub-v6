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
const GameScanner = require('./GameScanner');

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
        this.gameScanner = new GameScanner();
        this.port = process.env.PORT || 3000;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        
        // 게임 스캔 초기화
        this.initializeGames();
        
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
        // 기본 루트 - 동적 게임 허브 페이지
        this.app.get('/', (req, res) => {
            const games = this.gameScanner.getActiveGames();
            res.send(this.generateHomePage(games));
        });
        
        // 게임 목록 API
        this.app.get('/api/games', (req, res) => {
            const games = this.gameScanner.getActiveGames();
            res.json({
                success: true,
                data: games,
                stats: this.gameScanner.getStats()
            });
        });
        
        // 특정 게임 정보 API  
        this.app.get('/api/games/:gameId', (req, res) => {
            const game = this.gameScanner.getGame(req.params.gameId);
            if (!game) {
                return res.status(404).json({
                    success: false,
                    error: '게임을 찾을 수 없습니다.'
                });
            }
            res.json({
                success: true,
                data: game
            });
        });
        
        // 게임 재스캔 API (개발용)
        this.app.post('/api/admin/rescan', async (req, res) => {
            try {
                await this.gameScanner.scanGames();
                res.json({
                    success: true,
                    message: '게임 재스캔 완료',
                    stats: this.gameScanner.getStats()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // 기존 정적 홈페이지 (백업용)
        this.app.get('/static', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>🚀 Sensor Game Hub v6.0</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background: linear-gradient(135deg, #0f172a, #1e293b);
                            color: #f8fafc;
                            margin: 0;
                            padding: 2rem;
                            min-height: 100vh;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                        }
                        .container {
                            max-width: 800px;
                            text-align: center;
                        }
                        h1 {
                            font-size: 3rem;
                            margin-bottom: 1rem;
                            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                        }
                        .subtitle {
                            font-size: 1.2rem;
                            color: #cbd5e1;
                            margin-bottom: 3rem;
                        }
                        .games-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                            gap: 2rem;
                            margin-bottom: 3rem;
                        }
                        .game-card {
                            background: rgba(30, 41, 59, 0.8);
                            border: 1px solid #475569;
                            border-radius: 1rem;
                            padding: 2rem;
                            text-decoration: none;
                            color: inherit;
                            transition: all 0.3s ease;
                            backdrop-filter: blur(12px);
                        }
                        .game-card:hover {
                            transform: translateY(-8px);
                            border-color: #3b82f6;
                            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
                        }
                        .game-icon {
                            font-size: 3rem;
                            margin-bottom: 1rem;
                        }
                        .game-title {
                            font-size: 1.5rem;
                            font-weight: 600;
                            margin-bottom: 0.5rem;
                        }
                        .game-desc {
                            color: #94a3b8;
                            font-size: 0.9rem;
                            line-height: 1.5;
                        }
                        .sensor-link {
                            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                            color: white;
                            padding: 1rem 2rem;
                            border-radius: 0.5rem;
                            text-decoration: none;
                            font-weight: 600;
                            display: inline-block;
                            margin-top: 2rem;
                            transition: transform 0.3s ease;
                        }
                        .sensor-link:hover {
                            transform: translateY(-2px);
                        }
                        .info {
                            margin-top: 3rem;
                            padding: 2rem;
                            background: rgba(59, 130, 246, 0.1);
                            border: 1px solid rgba(59, 130, 246, 0.2);
                            border-radius: 1rem;
                        }
                        .info h3 {
                            color: #3b82f6;
                            margin-bottom: 1rem;
                        }
                        .info p {
                            color: #cbd5e1;
                            margin-bottom: 0.5rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🚀 Sensor Game Hub v6.0</h1>
                        <p class="subtitle">모바일 센서로 즐기는 혁신적인 게임 경험</p>
                        
                        <div class="games-grid">
                            <a href="/games/solo" class="game-card">
                                <div class="game-icon">🎯</div>
                                <div class="game-title">Solo Game</div>
                                <div class="game-desc">1개 센서로 플레이하는 공 조작 게임<br>목표 수집 및 콤보 시스템</div>
                            </a>
                            
                            <a href="/games/dual" class="game-card">
                                <div class="game-icon">🎮</div>
                                <div class="game-title">Dual Game</div>
                                <div class="game-desc">2개 센서로 협력하는 미션 게임<br>공동 목표 달성 시스템</div>
                            </a>
                            
                            <a href="/games/multi" class="game-card">
                                <div class="game-icon">👥</div>
                                <div class="game-title">Multi Game</div>
                                <div class="game-desc">최대 8명 실시간 경쟁<br>리더보드 및 타이머 시스템</div>
                            </a>
                        </div>
                        
                        <a href="/sensor.html" class="sensor-link">📱 모바일 센서 클라이언트</a>
                        
                        <div class="info">
                            <h3>🎮 게임 방법</h3>
                            <p>1. PC에서 원하는 게임 선택</p>
                            <p>2. 화면에 표시되는 4자리 세션 코드 확인</p>
                            <p>3. 모바일에서 센서 클라이언트 접속 후 코드 입력</p>
                            <p>4. 센서 권한 허용 후 자동으로 게임 시작!</p>
                        </div>
                    </div>
                </body>
                </html>
            `);
        });
        
        // 게임 라우트 (동적)
        this.app.get('/games/:gameId', (req, res) => {
            const { gameId } = req.params;
            const game = this.gameScanner.getGame(gameId);
            
            if (!game || game.status !== 'active') {
                return res.status(404).send(`
                    <h1>🎮 게임을 찾을 수 없습니다</h1>
                    <p>요청하신 게임 "${gameId}"을(를) 찾을 수 없습니다.</p>
                    <p><a href="/">게임 허브로 돌아가기</a></p>
                `);
            }
            
            try {
                res.sendFile(path.join(__dirname, `../public/games/${gameId}/index.html`));
            } catch (error) {
                res.status(500).send(`
                    <h1>🚨 게임 로드 오류</h1>
                    <p>게임을 불러오는 중 오류가 발생했습니다.</p>
                    <p><a href="/">게임 허브로 돌아가기</a></p>
                `);
            }
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
     * 게임 스캔 초기화
     */
    async initializeGames() {
        try {
            await this.gameScanner.scanGames();
            console.log('✅ 게임 스캔 완료');
        } catch (error) {
            console.error('❌ 게임 스캔 실패:', error.message);
        }
    }
    
    /**
     * 동적 홈페이지 생성
     */
    generateHomePage(games) {
        const gameCards = games.map(game => `
            <a href="${game.path}" class="game-card">
                <div class="game-icon">${game.icon}</div>
                <div class="game-title">${game.title}</div>
                <div class="game-desc">${game.description}</div>
                ${game.featured ? '<div class="featured-badge">⭐ 추천</div>' : ''}
                ${game.experimental ? '<div class="experimental-badge">🧪 실험적</div>' : ''}
            </a>
        `).join('');
        
        const stats = this.gameScanner.getStats();
        
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>🚀 Sensor Game Hub v6.0</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #0f172a, #1e293b);
                        color: #f8fafc;
                        margin: 0;
                        padding: 2rem;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    .container {
                        max-width: 1200px;
                        text-align: center;
                    }
                    h1 {
                        font-size: 3rem;
                        margin-bottom: 1rem;
                        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    .subtitle {
                        font-size: 1.2rem;
                        color: #cbd5e1;
                        margin-bottom: 1rem;
                    }
                    .stats {
                        font-size: 0.9rem;
                        color: #94a3b8;
                        margin-bottom: 3rem;
                    }
                    .games-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 2rem;
                        margin-bottom: 3rem;
                    }
                    .game-card {
                        background: rgba(30, 41, 59, 0.8);
                        border: 1px solid #475569;
                        border-radius: 1rem;
                        padding: 2rem;
                        text-decoration: none;
                        color: inherit;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(12px);
                        position: relative;
                        overflow: hidden;
                    }
                    .game-card:hover {
                        transform: translateY(-8px);
                        border-color: #3b82f6;
                        box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
                    }
                    .game-icon {
                        font-size: 3rem;
                        margin-bottom: 1rem;
                    }
                    .game-title {
                        font-size: 1.5rem;
                        font-weight: 600;
                        margin-bottom: 0.5rem;
                    }
                    .game-desc {
                        color: #94a3b8;
                        font-size: 0.9rem;
                        line-height: 1.5;
                    }
                    .featured-badge {
                        position: absolute;
                        top: 1rem;
                        right: 1rem;
                        background: linear-gradient(135deg, #f59e0b, #d97706);
                        color: white;
                        padding: 0.25rem 0.75rem;
                        border-radius: 1rem;
                        font-size: 0.7rem;
                        font-weight: 600;
                    }
                    .experimental-badge {
                        position: absolute;
                        top: 3rem;
                        right: 1rem;
                        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                        color: white;
                        padding: 0.25rem 0.75rem;
                        border-radius: 1rem;
                        font-size: 0.7rem;
                        font-weight: 600;
                    }
                    .sensor-link {
                        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                        color: white;
                        padding: 1rem 2rem;
                        border-radius: 0.5rem;
                        text-decoration: none;
                        font-weight: 600;
                        display: inline-block;
                        margin-top: 2rem;
                        transition: transform 0.3s ease;
                    }
                    .sensor-link:hover {
                        transform: translateY(-2px);
                    }
                    .info {
                        margin-top: 3rem;
                        padding: 2rem;
                        background: rgba(59, 130, 246, 0.1);
                        border: 1px solid rgba(59, 130, 246, 0.2);
                        border-radius: 1rem;
                    }
                    .info h3 {
                        color: #3b82f6;
                        margin-bottom: 1rem;
                    }
                    .info p {
                        color: #cbd5e1;
                        margin-bottom: 0.5rem;
                    }
                    .developer-info {
                        margin-top: 2rem;
                        padding: 1.5rem;
                        background: rgba(16, 185, 129, 0.1);
                        border: 1px solid rgba(16, 185, 129, 0.2);
                        border-radius: 1rem;
                        text-align: left;
                    }
                    .developer-info h4 {
                        color: #10b981;
                        margin-bottom: 1rem;
                    }
                    .api-link {
                        color: #10b981;
                        text-decoration: none;
                        font-family: monospace;
                        background: rgba(16, 185, 129, 0.1);
                        padding: 0.25rem 0.5rem;
                        border-radius: 0.25rem;
                        margin: 0 0.25rem;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 Sensor Game Hub v6.0</h1>
                    <p class="subtitle">모바일 센서로 즐기는 혁신적인 게임 경험</p>
                    <p class="stats">
                        총 ${stats.total}개 게임 | 
                        솔로: ${stats.categories.solo || 0}개 | 
                        듀얼: ${stats.categories.dual || 0}개 | 
                        멀티: ${stats.categories.multi || 0}개
                        ${stats.experimental > 0 ? ` | 실험적: ${stats.experimental}개` : ''}
                    </p>
                    
                    <div class="games-grid">
                        ${gameCards}
                    </div>
                    
                    <a href="/sensor.html" class="sensor-link">📱 모바일 센서 클라이언트</a>
                    
                    <div class="info">
                        <h3>🎮 게임 방법</h3>
                        <p>1. PC에서 원하는 게임 선택</p>
                        <p>2. 화면에 표시되는 4자리 세션 코드 확인</p>
                        <p>3. 모바일에서 센서 클라이언트 접속 후 코드 입력</p>
                        <p>4. 센서 권한 허용 후 자동으로 게임 시작!</p>
                    </div>
                    
                    <div class="developer-info">
                        <h4>🛠️ 개발자 정보</h4>
                        <p><strong>게임 API:</strong> 
                            <a href="/api/games" class="api-link">/api/games</a>
                            <a href="/api/admin/rescan" class="api-link">/api/admin/rescan</a>
                        </p>
                        <p><strong>새 게임 추가:</strong> <code>games/</code> 폴더에 게임을 추가하고 <code>game.json</code> 파일을 생성하세요</p>
                        <p><strong>자동 스캔:</strong> 서버 재시작 시 자동으로 새 게임이 감지됩니다</p>
                    </div>
                </div>
            </body>
            </html>
        `;
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
                    console.log(`🔍 create-session 이벤트 수신:`, data);
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
                    
                    console.log(`🔍 SessionManager에서 반환받은 세션:`, session);
                    console.log(`🔍 반환받은 sessionCode: "${session.sessionCode}" (타입: ${typeof session.sessionCode})`);
                    
                    const responseData = {
                        success: true,
                        session: session
                    };
                    
                    console.log(`🔍 클라이언트에 전송할 응답:`, responseData);
                    
                    // 게임 클라이언트에 세션 정보 전송
                    callback(responseData);
                    
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