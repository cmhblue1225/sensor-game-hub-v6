// QR Code Generator (폴백 처리)
class QRCodeGenerator {
    static async generateElement(url, size = 200) {
        if (typeof QRCode !== 'undefined') {
            // QRCode 라이브러리 사용
            const canvas = document.createElement('canvas');
            await new Promise((resolve, reject) => {
                QRCode.toCanvas(canvas, url, { width: size }, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
            return canvas;
        } else {
            // 폴백: 외부 API 사용
            const img = document.createElement('img');
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
            img.alt = 'QR Code';
            img.style.width = `${size}px`;
            img.style.height = `${size}px`;
            return img;
        }
    }
}

// Shot Target Game Class
class ShotTargetGame {
    constructor() {
        // ✅ 필수 패턴: SessionSDK 초기화
        this.sdk = new SessionSDK({
            gameId: 'shot-target',
            gameType: 'solo',  // ✅ 필수: solo 타입 설정
            debug: true
        });
        
        // 게임 요소
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 게임 상태
        this.state = {
            connected: false,
            sensorConnected: false,
            playing: false,
            paused: false,
            score: 0,
            hits: 0,
            misses: 0,
            comboCount: 0,
            maxCombo: 0,
            sessionCode: null
        };
        
        // 조준 시스템
        this.crosshair = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            smoothing: 0.1  // 부드러운 움직임을 위한 보간
        };
        
        // 표적 시스템
        this.targets = [];
        this.bullets = [];
        this.effects = [];
        
        // 센서 데이터
        this.sensorData = {
            tilt: { x: 0, y: 0 }
        };
        
        // 게임 설정
        this.config = {
            targetTypes: {
                large: { radius: 60, points: 100, color: '#ef4444', spawnChance: 0.4 },
                medium: { radius: 40, points: 200, color: '#f59e0b', spawnChance: 0.4 },
                small: { radius: 25, points: 500, color: '#10b981', spawnChance: 0.2 }
            },
            targetLifetime: 5000,  // 5초 후 자동 소멸
            targetSpawnInterval: 2000,  // 2초마다 새 표적 생성
            hitRadius: 15,  // 조준점이 표적 중심에서 이 거리 내에 있으면 발사
            comboMultiplier: 1.5,
            bulletSpeed: 8,
            maxTargets: 3  // 최대 동시 표적 수
        };
        
        // DOM 요소
        this.elements = {
            scoreValue: document.getElementById('scoreValue'),
            hitsCount: document.getElementById('hitsCount'),
            missesCount: document.getElementById('missesCount'),
            comboCount: document.getElementById('comboCount'),
            accuracyValue: document.getElementById('accuracyValue'),
            serverStatus: document.getElementById('serverStatus'),
            sensorStatus: document.getElementById('sensorStatus'),
            gameStatusText: document.getElementById('gameStatusText'),
            sessionPanel: document.getElementById('sessionPanel'),
            sessionCode: document.getElementById('sessionCode'),
            qrContainer: document.getElementById('qrContainer'),
            gameInfoPanel: document.getElementById('gameInfoPanel'),
            crosshair: document.getElementById('crosshair'),
            pauseBtn: document.getElementById('pauseBtn')
        };
        
        this.gameLoop = null;
        this.lastTargetSpawn = 0;
        
        this.initializeGame();
    }
    
    async initializeGame() {
        console.log('🎯 Shot Target Game 초기화');
        
        this.setupCanvas();
        this.setupSDKEvents();
        this.setupKeyboardControls();  // 키보드 테스트용
        this.startGameLoop();
        
        // ✅ 필수 패턴: 서버 연결을 기다린 후 세션 생성
        // SDK 이벤트 핸들러에서 처리됨
    }
    
    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            
            // 조준점 초기 위치 (화면 중앙)
            this.crosshair.x = this.canvas.width / 2;
            this.crosshair.y = this.canvas.height / 2;
            this.crosshair.targetX = this.crosshair.x;
            this.crosshair.targetY = this.crosshair.y;
        };
        
        window.addEventListener('resize', resize);
        resize();
    }
    
    setupSDKEvents() {
        // ✅ 필수 패턴: 연결 완료 후 세션 생성
        this.sdk.on('connected', async () => {
            this.state.connected = true;
            this.updateServerStatus(true);
            this.updateGameStatus('서버 연결됨 - 세션 생성 중...');
            
            // 서버 연결 완료 후 세션 생성
            await this.createGameSession();
        });
        
        this.sdk.on('disconnected', () => {
            this.state.connected = false;
            this.updateServerStatus(false);
            this.updateGameStatus('서버 연결 끊김');
        });
        
        // ✅ 필수 패턴: CustomEvent 처리
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;  // ✅ 중요!
            this.state.sessionCode = session.sessionCode;
            this.displaySessionInfo(session);
            this.updateGameStatus('센서 연결 대기 중...');
        });
        
        // 센서 연결
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;  // ✅ 중요!
            this.state.sensorConnected = true;
            this.updateSensorStatus(true);
            this.updateGameStatus('센서 연결됨 - 게임 준비 완료');
            
            // 세션 패널 숨기고 게임 시작
            this.hideSessionPanel();
            this.startGame();
        });
        
        this.sdk.on('sensor-disconnected', () => {
            this.state.sensorConnected = false;
            this.updateSensorStatus(false);
            this.updateGameStatus('센서 연결 끊김');
            this.pauseGame();
        });
        
        // ✅ 필수 패턴: 센서 데이터 처리
        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;  // ✅ 중요!
            this.processSensorData(data);
        });
        
        // 오류 처리
        this.sdk.on('connection-error', (error) => {
            console.error('연결 오류:', error);
            this.updateGameStatus(`연결 오류: ${error.error}`);
        });
    }
    
    // ✅ 키보드 테스트 지원
    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            if (!this.state.playing || this.state.paused) return;
            
            const moveSpeed = 20;
            switch(e.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    this.crosshair.targetX = Math.max(0, this.crosshair.targetX - moveSpeed);
                    break;
                case 'd':
                case 'arrowright':
                    this.crosshair.targetX = Math.min(this.canvas.width, this.crosshair.targetX + moveSpeed);
                    break;
                case 'w':
                case 'arrowup':
                    this.crosshair.targetY = Math.max(0, this.crosshair.targetY - moveSpeed);
                    break;
                case 's':
                case 'arrowdown':
                    this.crosshair.targetY = Math.min(this.canvas.height, this.crosshair.targetY + moveSpeed);
                    break;
                case ' ':
                    e.preventDefault();
                    this.tryShoot();
                    break;
            }
        });
    }
    
    async createGameSession() {
        try {
            await this.sdk.createSession();
            console.log('✅ 게임 세션 생성 완료');
        } catch (error) {
            console.error('❌ 세션 생성 실패:', error);
            this.updateGameStatus(`세션 생성 실패: ${error.message}`);
        }
    }
    
    async displaySessionInfo(session) {
        this.elements.sessionCode.textContent = session.sessionCode || '----';
        
        // ✅ QR 코드 폴백 처리
        const sensorUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
        
        try {
            const qrElement = await QRCodeGenerator.generateElement(sensorUrl, 200);
            this.elements.qrContainer.innerHTML = '';
            this.elements.qrContainer.appendChild(qrElement);
        } catch (error) {
            console.error('QR 코드 생성 실패:', error);
            this.elements.qrContainer.innerHTML = `<p>QR 코드: ${sensorUrl}</p>`;
        }
    }
    
    hideSessionPanel() {
        this.elements.sessionPanel.classList.add('hidden');
        this.elements.gameInfoPanel.classList.remove('hidden');
        this.elements.crosshair.classList.remove('hidden');
    }
    
    processSensorData(data) {
        const sensorData = data.data;
        
        // 기울기 데이터로 조준점 이동
        if (sensorData.orientation) {
            this.sensorData.tilt.x = sensorData.orientation.beta || 0;  // X축 기울기
            this.sensorData.tilt.y = sensorData.orientation.gamma || 0; // Y축 기울기
            
            // 게임 로직 적용
            if (this.state.playing && !this.state.paused) {
                this.applySensorMovement();
            }
        }
    }
    
    applySensorMovement() {
        // 기울기를 화면 좌표로 변환
        const sensitivity = 15;  // 센서 감도
        const maxTilt = 30;      // 최대 기울기 각도
        
        // 기울기 정규화 (-1 ~ 1)
        const normalizedTiltX = Math.max(-1, Math.min(1, this.sensorData.tilt.y / maxTilt));
        const normalizedTiltY = Math.max(-1, Math.min(1, this.sensorData.tilt.x / maxTilt));
        
        // 조준점 목표 위치 계산
        this.crosshair.targetX = this.canvas.width / 2 + (normalizedTiltX * this.canvas.width / 2 * 0.8);
        this.crosshair.targetY = this.canvas.height / 2 + (normalizedTiltY * this.canvas.height / 2 * 0.8);
        
        // 화면 경계 제한
        this.crosshair.targetX = Math.max(0, Math.min(this.canvas.width, this.crosshair.targetX));
        this.crosshair.targetY = Math.max(0, Math.min(this.canvas.height, this.crosshair.targetY));
    }
    
    startGame() {
        this.state.playing = true;
        this.state.paused = false;
        this.updateGameStatus('게임 진행 중...');
        this.lastTargetSpawn = Date.now();
        console.log('🎯 Shot Target 게임 시작!');
    }
    
    pauseGame() {
        this.state.paused = true;
        this.elements.pauseBtn.textContent = '▶️ 계속';
        this.updateGameStatus('게임 일시정지');
    }
    
    resumeGame() {
        this.state.paused = false;
        this.elements.pauseBtn.textContent = '⏸️ 일시정지';
        this.updateGameStatus('게임 진행 중...');
    }
    
    togglePause() {
        if (this.state.paused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }
    
    resetGame() {
        this.state.score = 0;
        this.state.hits = 0;
        this.state.misses = 0;
        this.state.comboCount = 0;
        this.state.maxCombo = 0;
        
        this.targets = [];
        this.bullets = [];
        this.effects = [];
        
        this.crosshair.x = this.canvas.width / 2;
        this.crosshair.y = this.canvas.height / 2;
        this.crosshair.targetX = this.crosshair.x;
        this.crosshair.targetY = this.crosshair.y;
        
        this.updateScore();
        
        if (this.state.sensorConnected) {
            this.startGame();
        }
    }
    
    spawnTarget() {
        if (this.targets.length >= this.config.maxTargets) return;
        
        // 표적 타입 랜덤 선택
        const rand = Math.random();
        let targetType = 'large';
        if (rand < this.config.targetTypes.small.spawnChance) {
            targetType = 'small';
        } else if (rand < this.config.targetTypes.small.spawnChance + this.config.targetTypes.medium.spawnChance) {
            targetType = 'medium';
        }
        
        const typeConfig = this.config.targetTypes[targetType];
        
        // 랜덤 위치 생성 (화면 가장자리 제외)
        const margin = typeConfig.radius + 50;
        const x = margin + Math.random() * (this.canvas.width - margin * 2);
        const y = margin + Math.random() * (this.canvas.height - margin * 2);
        
        this.targets.push({
            x: x,
            y: y,
            radius: typeConfig.radius,
            points: typeConfig.points,
            color: typeConfig.color,
            type: targetType,
            spawnTime: Date.now(),
            alpha: 1
        });
        
        console.log(`🎯 새 표적 생성: ${targetType} (${typeConfig.points}pt)`);
    }
    
    tryShoot() {
        // 조준점 근처의 표적 찾기
        for (let i = 0; i < this.targets.length; i++) {
            const target = this.targets[i];
            const dx = this.crosshair.x - target.x;
            const dy = this.crosshair.y - target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 조준점이 표적의 히트존 내에 있으면 자동 발사
            if (distance <= this.config.hitRadius) {
                this.shootTarget(target, i);
                return;
            }
        }
    }
    
    shootTarget(target, index) {
        // 총알 생성
        this.bullets.push({
            x: this.crosshair.x,
            y: this.crosshair.y,
            targetX: target.x,
            targetY: target.y,
            speed: this.config.bulletSpeed,
            target: target
        });
        
        // 표적 제거
        this.targets.splice(index, 1);
        
        // 점수 계산
        this.state.hits++;
        this.state.comboCount++;
        
        let points = target.points;
        if (this.state.comboCount > 1) {
            points *= Math.pow(this.config.comboMultiplier, this.state.comboCount - 1);
        }
        
        this.state.score += Math.floor(points);
        this.state.maxCombo = Math.max(this.state.maxCombo, this.state.comboCount);
        
        // 타격 효과
        this.createHitEffect(target.x, target.y, points, target.color);
        
        this.updateScore();
        console.log(`🎯 표적 명중! +${Math.floor(points)}pt (콤보 x${this.state.comboCount})`);
    }
    
    createHitEffect(x, y, points, color) {
        // 타격 원형 효과
        this.effects.push({
            type: 'hit',
            x: x,
            y: y,
            radius: 0,
            maxRadius: 50,
            color: color,
            life: 30,
            maxLife: 30
        });
        
        // 점수 팝업
        this.effects.push({
            type: 'score',
            x: x,
            y: y,
            text: `+${Math.floor(points)}`,
            life: 90,
            maxLife: 90,
            color: '#10b981'
        });
        
        // 파티클 효과
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.effects.push({
                type: 'particle',
                x: x,
                y: y,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                color: color,
                life: 60,
                maxLife: 60
            });
        }
    }
    
    startGameLoop() {
        const loop = () => {
            this.update();
            this.render();
            this.gameLoop = requestAnimationFrame(loop);
        };
        
        loop();
    }
    
    update() {
        if (!this.state.playing || this.state.paused) return;
        
        const now = Date.now();
        
        // 조준점 부드러운 이동
        this.crosshair.x += (this.crosshair.targetX - this.crosshair.x) * this.crosshair.smoothing;
        this.crosshair.y += (this.crosshair.targetY - this.crosshair.y) * this.crosshair.smoothing;
        
        // 조준점 위치를 DOM 요소에 반영
        this.elements.crosshair.style.left = this.crosshair.x + 'px';
        this.elements.crosshair.style.top = this.crosshair.y + 'px';
        
        // 새 표적 생성
        if (now - this.lastTargetSpawn > this.config.targetSpawnInterval) {
            this.spawnTarget();
            this.lastTargetSpawn = now;
        }
        
        // 표적 업데이트 (수명 체크)
        this.targets = this.targets.filter(target => {
            const age = now - target.spawnTime;
            if (age > this.config.targetLifetime) {
                // 표적이 사라지면 콤보 리셋
                this.state.comboCount = 0;
                this.state.misses++;
                this.updateScore();
                console.log('🎯 표적 소멸 - 콤보 리셋');
                return false;
            }
            
            // 페이드 아웃 효과
            const fadeStartTime = this.config.targetLifetime * 0.7;
            if (age > fadeStartTime) {
                target.alpha = 1 - (age - fadeStartTime) / (this.config.targetLifetime * 0.3);
            }
            
            return true;
        });
        
        // 총알 업데이트
        this.bullets = this.bullets.filter(bullet => {
            const dx = bullet.targetX - bullet.x;
            const dy = bullet.targetY - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < bullet.speed) {
                bullet.x = bullet.targetX;
                bullet.y = bullet.targetY;
                return false; // 목표 도달, 제거
            } else {
                bullet.x += (dx / distance) * bullet.speed;
                bullet.y += (dy / distance) * bullet.speed;
                return true;
            }
        });
        
        // 효과 업데이트
        this.effects = this.effects.filter(effect => {
            effect.life--;
            
            if (effect.type === 'hit') {
                effect.radius = (1 - effect.life / effect.maxLife) * effect.maxRadius;
            } else if (effect.type === 'particle') {
                effect.x += effect.vx;
                effect.y += effect.vy;
                effect.vx *= 0.95;
                effect.vy *= 0.95;
            }
            
            return effect.life > 0;
        });
        
        // 자동 발사 체크
        this.tryShoot();
    }
    
    render() {
        // 배경 클리어
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 표적 렌더링
        this.targets.forEach(target => {
            this.ctx.globalAlpha = target.alpha;
            
            // 표적 본체
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = target.color + '40'; // 투명도 추가
            this.ctx.fill();
            this.ctx.strokeStyle = target.color;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // 중앙 점
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = target.color;
            this.ctx.fill();
            
            // 점수 표시
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(target.points, target.x, target.y - target.radius - 10);
        });
        
        this.ctx.globalAlpha = 1;
        
        // 총알 렌더링
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();
            this.ctx.strokeStyle = '#3b82f6';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
        
        // 효과 렌더링
        this.effects.forEach(effect => {
            const alpha = effect.life / effect.maxLife;
            this.ctx.globalAlpha = alpha;
            
            if (effect.type === 'hit') {
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = effect.color;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            } else if (effect.type === 'score') {
                this.ctx.fillStyle = effect.color;
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(effect.text, effect.x, effect.y - (1 - alpha) * 40);
            } else if (effect.type === 'particle') {
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, 3, 0, Math.PI * 2);
                this.ctx.fillStyle = effect.color;
                this.ctx.fill();
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    updateScore() {
        this.elements.scoreValue.textContent = this.state.score.toLocaleString();
        this.elements.hitsCount.textContent = this.state.hits;
        this.elements.missesCount.textContent = this.state.misses;
        this.elements.comboCount.textContent = this.state.comboCount;
        
        const total = this.state.hits + this.state.misses;
        const accuracy = total > 0 ? (this.state.hits / total * 100) : 100;
        this.elements.accuracyValue.textContent = accuracy.toFixed(1) + '%';
    }
    
    updateServerStatus(connected) {
        this.elements.serverStatus.classList.toggle('connected', connected);
    }
    
    updateSensorStatus(connected) {
        this.elements.sensorStatus.classList.toggle('connected', connected);
    }
    
    updateGameStatus(status) {
        this.elements.gameStatusText.textContent = status;
    }
}

// ✅ 게임 시작
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new ShotTargetGame();
    window.game = game; // 전역 접근을 위해
});