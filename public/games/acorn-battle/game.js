/**
 * Acorn Battle Game - 도토리 배틀
 * 2인용 실시간 센서 게임
 */

// AcornBattleGame 클래스 - 메인 게임 클래스
class AcornBattleGame {
    constructor() {
        // 캔버스 설정
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // SessionSDK 초기화
        this.sdk = new SessionSDK({
            gameType: 'dual',
            serverUrl: window.location.origin,
            debug: false
        });

        // 게임 상태 관리
        this.gameState = {
            phase: 'waiting', // waiting, ready, playing, paused, ended
            players: {
                sensor1: {
                    connected: false,
                    score: 0,
                    position: { x: 100, y: 300 },
                    velocity: { x: 0, y: 0 },
                    radius: 20,
                    stunned: false,
                    invulnerable: false
                },
                sensor2: {
                    connected: false,
                    score: 0,
                    position: { x: 700, y: 300 },
                    velocity: { x: 0, y: 0 },
                    radius: 20,
                    stunned: false,
                    invulnerable: false
                }
            },
            connectedSensors: new Set(),
            startTime: null,
            timeRemaining: 60,
            acorns: [],
            obstacles: []
        };

        // UI 요소 참조
        this.elements = {
            sessionPanel: document.getElementById('session-panel'),
            sessionCode: document.getElementById('session-code-display'),
            qrCanvas: document.getElementById('qr-canvas'),
            qrFallback: document.getElementById('qr-fallback'),
            sensor1Status: document.getElementById('sensor1-status'),
            sensor2Status: document.getElementById('sensor2-status'),
            startBtn: document.getElementById('start-game-btn'),
            gameOverlay: document.getElementById('game-overlay'),
            overlayTitle: document.getElementById('overlay-title'),
            overlayMessage: document.getElementById('overlay-message'),
            timer: document.getElementById('timer'),
            player1Score: document.getElementById('player1-score'),
            player2Score: document.getElementById('player2-score'),
            pauseBtn: document.getElementById('pause-btn'),
            restartGameBtn: document.getElementById('restart-game-btn'),
            resultModal: document.getElementById('result-modal'),
            resultTitle: document.getElementById('result-title'),
            finalScoreP1: document.getElementById('final-score-p1'),
            finalScoreP2: document.getElementById('final-score-p2'),
            restartBtn: document.getElementById('restart-btn'),
            hubBtn: document.getElementById('hub-btn')
        };

        // 게임 루프 관련
        this.animationId = null;
        this.lastSensorUpdate = 0;
        this.sensorThrottle = 33; // 30fps

        this.setupEvents();
        this.initializeGame();
    }

    setupEvents() {
        // SessionSDK 이벤트 핸들러 (필수: event.detail || event 패턴)
        this.sdk.on('connected', () => {
            console.log('서버에 연결됨');
            this.createSession();
        });

        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            console.log('세션 생성됨:', session);
            this.handleSessionCreated(session);
        });

        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            console.log('센서 연결됨:', data);
            this.handleSensorConnected(data);
        });

        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;
            console.log('센서 연결 해제됨:', data);
            this.handleSensorDisconnected(data);
        });

        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.handleSensorData(data);
        });

        this.sdk.on('error', (event) => {
            const error = event.detail || event;
            console.error('SDK 오류:', error);
            this.showError('연결 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        });

        // UI 이벤트 핸들러
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => this.startGame());
        }
        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', () => this.restartGame());
        }
        if (this.elements.hubBtn) {
            this.elements.hubBtn.addEventListener('click', () => window.location.href = '/');
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        }
        if (this.elements.restartGameBtn) {
            this.elements.restartGameBtn.addEventListener('click', () => this.restartGame());
        }

        // 윈도우 이벤트
        window.addEventListener('beforeunload', () => this.cleanup());
        window.addEventListener('error', (event) => {
            console.error('게임 오류:', event.error);
            this.showError('게임 오류가 발생했습니다.');
        });
    }

    createSession() {
        try {
            this.sdk.createSession();
        } catch (error) {
            console.error('세션 생성 실패:', error);
            this.showError('세션 생성에 실패했습니다.');
        }
    }

    handleSessionCreated(session) {
        if (this.elements.sessionCode) {
            this.elements.sessionCode.textContent = session.sessionCode;
        }
        this.generateQRCode(session.sensorUrl);
        this.updateOverlay('플레이어를 기다리는 중...', '모바일 기기로 QR 코드를 스캔하거나 세션 코드를 입력하세요');
    }

    generateQRCode(url) {
        // QR 코드 폴백 처리 (필수)
        if (typeof QRCode !== 'undefined') {
            try {
                QRCode.toCanvas(this.elements.qrCanvas, url, {
                    width: 150,
                    height: 150,
                    margin: 2
                }, (error) => {
                    if (error) {
                        console.error('QR 코드 생성 실패:', error);
                        this.showQRFallback(url);
                    }
                });
            } catch (error) {
                console.error('QR 코드 라이브러리 오류:', error);
                this.showQRFallback(url);
            }
        } else {
            console.warn('QRCode 라이브러리가 로드되지 않음, 폴백 사용');
            this.showQRFallback(url);
        }
    }

    showQRFallback(url) {
        if (this.elements.qrCanvas) {
            this.elements.qrCanvas.style.display = 'none';
        }
        if (this.elements.qrFallback) {
            this.elements.qrFallback.style.display = 'block';

            const img = document.createElement('img');
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
            img.alt = 'QR Code';
            img.style.borderRadius = '8px';

            this.elements.qrFallback.innerHTML = '';
            this.elements.qrFallback.appendChild(img);
        }
    }

    handleSensorConnected(data) {
        this.gameState.connectedSensors.add(data.sensorId);
        this.updateSensorStatus(data.sensorId, 'connected');

        if (this.gameState.connectedSensors.size === 2) {
            if (this.elements.startBtn) {
                this.elements.startBtn.disabled = false;
            }
            this.updateOverlay('게임 준비 완료!', '게임 시작 버튼을 클릭하세요');
            this.gameState.phase = 'ready';
        }
    }

    handleSensorDisconnected(data) {
        this.gameState.connectedSensors.delete(data.sensorId);
        this.updateSensorStatus(data.sensorId, 'disconnected');

        if (this.gameState.phase === 'playing') {
            this.pauseGame();
            this.updateOverlay('플레이어 연결 끊김', `${data.sensorId}가 재연결될 때까지 기다립니다`);
        } else {
            if (this.elements.startBtn) {
                this.elements.startBtn.disabled = true;
            }
            this.gameState.phase = 'waiting';
        }
    }

    handleSensorData(data) {
        // 센서 데이터 throttling
        const now = Date.now();
        if (now - this.lastSensorUpdate < this.sensorThrottle) return;
        this.lastSensorUpdate = now;

        if (this.gameState.phase !== 'playing') return;

        // 센서 데이터 검증
        if (!this.validateSensorData(data)) {
            console.warn('잘못된 센서 데이터:', data);
            return;
        }

        this.updatePlayerFromSensor(data);
    }

    validateSensorData(data) {
        return data &&
            data.data &&
            data.data.orientation &&
            typeof data.data.orientation.beta === 'number' &&
            typeof data.data.orientation.gamma === 'number' &&
            data.data.orientation.beta >= -180 &&
            data.data.orientation.beta <= 180 &&
            data.data.orientation.gamma >= -90 &&
            data.data.orientation.gamma <= 90;
    }

    updatePlayerFromSensor(data) {
        const player = this.gameState.players[data.sensorId];
        if (!player) return;

        // 기절 상태 체크
        if (player.stunned && Date.now() < player.stunnedUntil) {
            return; // 기절 상태에서는 움직일 수 없음
        }

        // 기절 상태 해제 및 무적 상태 설정
        if (player.stunned && Date.now() >= player.stunnedUntil) {
            player.stunned = false;
            player.invulnerable = true;
            player.invulnerableUntil = Date.now() + 1000; // 1초간 무적
            console.log(`${data.sensorId} 기절 해제, 1초간 무적 상태`);
        }

        // 무적 상태 해제
        if (player.invulnerable && Date.now() >= player.invulnerableUntil) {
            player.invulnerable = false;
            console.log(`${data.sensorId} 무적 상태 해제`);
        }

        // 센서 데이터로 이동 계산
        const moveSpeed = 3;
        const { beta, gamma } = data.data.orientation;

        player.velocity.x = (gamma || 0) * moveSpeed / 45;
        player.velocity.y = (beta || 0) * moveSpeed / 45;

        // 위치 업데이트
        player.position.x += player.velocity.x;
        player.position.y += player.velocity.y;

        // 맵 경계 제한
        this.constrainPlayerToMap(player);
    }

    constrainPlayerToMap(player) {
        const margin = player.radius || 20;
        player.position.x = Math.max(margin, Math.min(this.canvas.width - margin, player.position.x));
        player.position.y = Math.max(margin, Math.min(this.canvas.height - margin, player.position.y));
    }

    updateSensorStatus(sensorId, status) {
        const statusElement = this.elements[`${sensorId}Status`];
        if (statusElement) {
            statusElement.textContent = status === 'connected' ? '연결됨' :
                status === 'disconnected' ? '연결 끊김' : '대기중';
            statusElement.className = `status-indicator ${status === 'connected' ? 'connected' :
                status === 'disconnected' ? 'disconnected' : 'waiting'}`;
        }
    }

    updateOverlay(title, message) {
        if (this.elements.overlayTitle) {
            this.elements.overlayTitle.textContent = title;
        }
        if (this.elements.overlayMessage) {
            this.elements.overlayMessage.textContent = message;
        }
    }

    startGame() {
        if (this.gameState.connectedSensors.size < 2) {
            this.showError('두 명의 플레이어가 필요합니다.');
            return;
        }

        this.gameState.phase = 'playing';
        this.gameState.startTime = Date.now();
        this.gameState.timeRemaining = 60;

        // UI 업데이트
        if (this.elements.gameOverlay) {
            this.elements.gameOverlay.style.display = 'none';
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.disabled = false;
        }
        if (this.elements.restartGameBtn) {
            this.elements.restartGameBtn.disabled = false;
        }

        // 게임 초기화
        this.initializeGameEntities();

        // 게임 루프 시작
        this.startGameLoop();

        console.log('게임 시작!');
    }

    initializeGameEntities() {
        // 플레이어 위치 초기화
        this.gameState.players.sensor1.position = { x: 100, y: 300 };
        this.gameState.players.sensor2.position = { x: 700, y: 300 };

        // 플레이어 상태 초기화
        this.gameState.players.sensor1.score = 0;
        this.gameState.players.sensor1.stunned = false;
        this.gameState.players.sensor1.invulnerable = false;

        this.gameState.players.sensor2.score = 0;
        this.gameState.players.sensor2.stunned = false;
        this.gameState.players.sensor2.invulnerable = false;

        // 간단한 도토리 생성 (8개)
        this.gameState.acorns = [];
        for (let i = 0; i < 8; i++) {
            this.gameState.acorns.push({
                position: {
                    x: Math.random() * (this.canvas.width - 100) + 50,
                    y: Math.random() * (this.canvas.height - 100) + 50
                },
                radius: 10
            });
        }

        // 간단한 장애물 생성 (3개)
        this.gameState.obstacles = [];
        for (let i = 0; i < 3; i++) {
            this.gameState.obstacles.push({
                position: {
                    x: Math.random() * (this.canvas.width - 100) + 50,
                    y: Math.random() * (this.canvas.height - 100) + 50
                },
                size: { width: 40, height: 40 },
                velocity: {
                    x: (Math.random() - 0.5) * 4,
                    y: (Math.random() - 0.5) * 4
                }
            });
        }

        this.updateScoreUI();
    }

    startGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.gameLoop();
    }

    gameLoop() {
        if (this.gameState.phase === 'playing') {
            this.update();
            this.render();
            this.updateTimer();
        }

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // 장애물 업데이트
        this.gameState.obstacles.forEach(obstacle => {
            obstacle.position.x += obstacle.velocity.x;
            obstacle.position.y += obstacle.velocity.y;

            // 경계 반사
            if (obstacle.position.x <= 0 || obstacle.position.x >= this.canvas.width - obstacle.size.width) {
                obstacle.velocity.x *= -1;
            }
            if (obstacle.position.y <= 0 || obstacle.position.y >= this.canvas.height - obstacle.size.height) {
                obstacle.velocity.y *= -1;
            }
        });

        this.updateUI();
    }

    render() {
        if (!this.ctx || !this.canvas) return;

        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 배경 렌더링
        this.renderBackground();

        // 도토리 렌더링
        this.renderAcorns();

        // 장애물 렌더링
        this.renderObstacles();

        // 플레이어 렌더링
        this.renderPlayers();
    }

    renderBackground() {
        // 그라데이션 배경
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a202c');
        gradient.addColorStop(1, '#2d3748');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderAcorns() {
        this.ctx.fillStyle = '#8B4513';
        this.gameState.acorns.forEach(acorn => {
            this.ctx.beginPath();
            this.ctx.arc(acorn.position.x, acorn.position.y, acorn.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    renderObstacles() {
        this.ctx.fillStyle = '#FF4444';
        this.gameState.obstacles.forEach(obstacle => {
            this.ctx.fillRect(
                obstacle.position.x,
                obstacle.position.y,
                obstacle.size.width,
                obstacle.size.height
            );
        });
    }

    renderPlayers() {
        // 플레이어 1 (파란색)
        const player1 = this.gameState.players.sensor1;
        this.ctx.fillStyle = player1.invulnerable ? '#87CEEB' : '#3B82F6';
        this.ctx.beginPath();
        this.ctx.arc(player1.position.x, player1.position.y, player1.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 플레이어 2 (빨간색)
        const player2 = this.gameState.players.sensor2;
        this.ctx.fillStyle = player2.invulnerable ? '#FFB6C1' : '#EF4444';
        this.ctx.beginPath();
        this.ctx.arc(player2.position.x, player2.position.y, player2.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    updateTimer() {
        if (this.gameState.phase !== 'playing' || !this.gameState.startTime) return;

        const elapsed = (Date.now() - this.gameState.startTime) / 1000;
        this.gameState.timeRemaining = Math.max(0, 60 - elapsed);

        // 타이머 UI 업데이트
        this.updateTimerUI();

        // 게임 종료 체크
        if (this.gameState.timeRemaining <= 0) {
            this.endGame();
        }
    }

    updateTimerUI() {
        const minutes = Math.floor(this.gameState.timeRemaining / 60);
        const seconds = Math.floor(this.gameState.timeRemaining % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (this.elements.timer) {
            this.elements.timer.textContent = timeString;

            // 시간이 10초 이하일 때 경고 스타일
            if (this.gameState.timeRemaining <= 10) {
                this.elements.timer.style.color = '#ff4444';
                this.elements.timer.style.fontWeight = 'bold';
            } else {
                this.elements.timer.style.color = '';
                this.elements.timer.style.fontWeight = '';
            }
        }
    }

    updateScoreUI() {
        if (this.elements.player1Score) {
            this.elements.player1Score.textContent = this.gameState.players.sensor1.score;
        }
        if (this.elements.player2Score) {
            this.elements.player2Score.textContent = this.gameState.players.sensor2.score;
        }
    }

    updateUI() {
        this.updateScoreUI();
        this.updateTimerUI();
    }

    endGame() {
        this.gameState.phase = 'ended';

        // 게임 루프 정지
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // 결과 표시
        this.showGameResult();

        console.log('게임 종료됨');
    }

    showGameResult() {
        const scores = {
            sensor1: this.gameState.players.sensor1.score,
            sensor2: this.gameState.players.sensor2.score
        };

        let winner = 'tie';
        if (scores.sensor1 > scores.sensor2) {
            winner = 'sensor1';
        } else if (scores.sensor2 > scores.sensor1) {
            winner = 'sensor2';
        }

        // 결과 모달 업데이트
        if (this.elements.finalScoreP1) {
            this.elements.finalScoreP1.textContent = scores.sensor1;
        }
        if (this.elements.finalScoreP2) {
            this.elements.finalScoreP2.textContent = scores.sensor2;
        }

        if (this.elements.resultTitle) {
            if (winner === 'tie') {
                this.elements.resultTitle.textContent = '무승부!';
            } else {
                const winnerName = winner === 'sensor1' ? '플레이어 1' : '플레이어 2';
                this.elements.resultTitle.textContent = `${winnerName} 승리!`;
            }
        }

        // 결과 모달 표시
        if (this.elements.resultModal) {
            this.elements.resultModal.style.display = 'block';
        }
        if (this.elements.gameOverlay) {
            this.elements.gameOverlay.style.display = 'none';
        }
    }

    restartGame() {
        // 게임 상태 초기화
        this.gameState.phase = 'waiting';
        this.gameState.startTime = null;
        this.gameState.timeRemaining = 60;

        // 플레이어 상태 초기화
        Object.values(this.gameState.players).forEach(player => {
            player.score = 0;
            player.stunned = false;
            player.invulnerable = false;
            player.position = {
                x: player === this.gameState.players.sensor1 ? 100 : 700,
                y: 300
            };
            player.velocity = { x: 0, y: 0 };
        });

        // 게임 엔티티 초기화
        this.gameState.acorns = [];
        this.gameState.obstacles = [];

        // UI 업데이트
        this.updateScoreUI();
        if (this.elements.gameOverlay) {
            this.elements.gameOverlay.style.display = 'block';
        }
        if (this.elements.resultModal) {
            this.elements.resultModal.style.display = 'none';
        }

        if (this.gameState.connectedSensors.size === 2) {
            if (this.elements.startBtn) {
                this.elements.startBtn.disabled = false;
            }
            this.updateOverlay('게임 준비 완료!', '게임 시작 버튼을 클릭하세요');
            this.gameState.phase = 'ready';
        } else {
            if (this.elements.startBtn) {
                this.elements.startBtn.disabled = true;
            }
            this.updateOverlay('플레이어를 기다리는 중...', '모바일 기기로 QR 코드를 스캔하거나 세션 코드를 입력하세요');
        }

        console.log('게임 재시작됨');
    }

    togglePause() {
        if (this.gameState.phase === 'playing') {
            this.pauseGame();
        } else if (this.gameState.phase === 'paused') {
            this.resumeGame();
        }
    }

    pauseGame() {
        if (this.gameState.phase !== 'playing') return;

        this.gameState.phase = 'paused';

        // 게임 루프 정지
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // UI 업데이트
        if (this.elements.gameOverlay) {
            this.elements.gameOverlay.style.display = 'block';
        }
        this.updateOverlay('게임 일시정지', '게임이 일시정지되었습니다');
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.textContent = '▶️ 재개';
        }

        console.log('게임 일시정지됨');
    }

    resumeGame() {
        if (this.gameState.phase !== 'paused') return;

        this.gameState.phase = 'playing';

        // UI 업데이트
        if (this.elements.gameOverlay) {
            this.elements.gameOverlay.style.display = 'none';
        }
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.textContent = '⏸️ 일시정지';
        }

        // 게임 루프 재시작
        this.startGameLoop();

        console.log('게임 재개됨');
    }

    initializeGame() {
        // 기본 초기화
        console.log('게임 초기화 완료');
    }

    showError(message) {
        // 간단한 오류 알림 표시
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4444;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            font-weight: bold;
        `;

        document.body.appendChild(errorDiv);

        // 3초 후 제거
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }

    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.sdk) {
            this.sdk.disconnect();
        }

        console.log('게임 정리 완료');
    }
}

// 게임 초기화 및 정리
document.addEventListener('DOMContentLoaded', () => {
    console.log('도토리 배틀 게임 로딩 시작');

    // 전역 게임 인스턴스 생성
    window.acornBattleGame = new AcornBattleGame();

    console.log('도토리 배틀 게임 로딩 완료');
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (window.acornBattleGame) {
        window.acornBattleGame.cleanup();
    }
});