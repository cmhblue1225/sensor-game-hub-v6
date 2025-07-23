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
            gameId: 'acorn-battle',
            gameType: 'dual',
            serverUrl: window.location.origin,
            debug: true
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
            obstacles: [],
            // 점수 구역에 저장된 도토리들
            scoreZoneAcorns: {
                sensor1: [], // 플레이어 1 구역의 도토리들
                sensor2: []  // 플레이어 2 구역의 도토리들
            }
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
        this.sensorThrottle = 16; // 60fps로 최대 향상 (25ms → 16ms)

        // 센서 데이터 스무딩을 위한 버퍼 (버퍼 크기 증가)
        this.sensorBuffer = {
            sensor1: { beta: [], gamma: [] },
            sensor2: { beta: [], gamma: [] }
        };
        this.bufferSize = 5; // 최근 5개 값의 평균 사용 (더 부드럽게)

        // 오디오 시스템 초기화
        this.audioContext = null;
        this.sounds = {};
        this.backgroundMusic = null;
        this.isMuted = false;
        this.initializeAudio();

        this.setupEvents();
        this.initializeGame();
    }

    // 오디오 시스템 초기화
    initializeAudio() {
        try {
            // Web Audio API 초기화
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 배경음악 생성 (간단한 멜로디)
            this.createBackgroundMusic();
            
            // 효과음 생성
            this.createSoundEffects();
            
            console.log('오디오 시스템 초기화 완료');
        } catch (error) {
            console.warn('오디오 시스템 초기화 실패:', error);
            this.audioContext = null;
        }
    }

    // 배경음악 생성 (MP3 파일 지원)
    async createBackgroundMusic() {
        if (!this.audioContext) return;

        // 배경음악 시스템 초기화
        this.backgroundMusic = {
            audio: null,
            isPlaying: false,
            volume: 0.3,
            loop: true
        };

        // MP3 파일 로드 시도
        try {
            await this.loadBackgroundMusicFile();
        } catch (error) {
            console.warn('MP3 파일 로드 실패, 기본 음악 사용:', error);
            this.createDefaultBackgroundMusic();
        }
    }

    // MP3 파일 로드
    async loadBackgroundMusicFile() {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.src = './assets/background-music.mp3';
            audio.loop = true;
            audio.volume = this.backgroundMusic.volume;
            
            audio.addEventListener('canplaythrough', () => {
                this.backgroundMusic.audio = audio;
                console.log('배경음악 MP3 파일 로드 완료');
                resolve();
            });
            
            audio.addEventListener('error', (e) => {
                console.warn('MP3 파일 로드 실패:', e);
                reject(e);
            });
            
            // 로드 시작
            audio.load();
        });
    }

    // 기본 배경음악 생성 (MP3 파일이 없을 때)
    createDefaultBackgroundMusic() {
        this.backgroundMusic.useDefault = true;
        this.backgroundMusic.oscillators = [];
        this.backgroundMusic.gainNode = this.audioContext.createGain();
        this.backgroundMusic.gainNode.gain.value = 0.05; // 더 낮은 볼륨
        this.backgroundMusic.gainNode.connect(this.audioContext.destination);
    }

    // 효과음 생성
    createSoundEffects() {
        if (!this.audioContext) return;

        this.sounds = {
            acornCollect: () => this.playTone(800, 0.1, 0.1), // 도토리 수집
            scorePoint: () => this.playTone(1000, 0.2, 0.15), // 점수 획득
            acornSteal: () => this.playTone(600, 0.15, 0.12), // 도토리 훔치기
            obstacleHit: () => this.playTone(200, 0.3, 0.2), // 장애물 충돌
            gameStart: () => this.playMelody([523, 659, 784], 0.3), // 게임 시작
            gameEnd: () => this.playMelody([784, 659, 523], 0.5) // 게임 종료
        };
    }

    // 단일 톤 재생
    playTone(frequency, duration, volume = 0.1) {
        if (!this.audioContext || this.isMuted) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // 멜로디 재생
    playMelody(frequencies, noteDuration) {
        if (!this.audioContext || this.isMuted) return;

        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, noteDuration, 0.08);
            }, index * noteDuration * 1000);
        });
    }

    // 배경음악 시작 (MP3 파일 우선, 없으면 기본 음악)
    startBackgroundMusic() {
        if (this.isMuted || this.backgroundMusic.isPlaying) return;

        this.backgroundMusic.isPlaying = true;

        // MP3 파일이 있으면 재생
        if (this.backgroundMusic.audio) {
            try {
                this.backgroundMusic.audio.currentTime = 0;
                this.backgroundMusic.audio.play().catch(error => {
                    console.warn('MP3 재생 실패, 기본 음악 사용:', error);
                    this.playBackgroundLoop();
                });
                console.log('MP3 배경음악 재생 시작');
            } catch (error) {
                console.warn('MP3 재생 오류, 기본 음악 사용:', error);
                this.playBackgroundLoop();
            }
        } else {
            // 기본 음악 재생
            this.playBackgroundLoop();
        }
    }

    // 배경음악 루프 (기본 음악)
    playBackgroundLoop() {
        if (!this.backgroundMusic.isPlaying || this.isMuted) return;

        // 간단한 배경 멜로디 (도토리 배틀 테마)
        const melody = [523, 587, 659, 698, 784, 698, 659, 587]; // C, D, E, F, G, F, E, D
        
        melody.forEach((freq, index) => {
            setTimeout(() => {
                if (this.backgroundMusic.isPlaying && !this.isMuted) {
                    this.playTone(freq, 0.8, 0.03); // 매우 낮은 볼륨
                }
            }, index * 1000);
        });

        // 8초 후 반복
        setTimeout(() => {
            if (this.backgroundMusic.isPlaying) {
                this.playBackgroundLoop();
            }
        }, 8000);
    }

    // 배경음악 정지
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.isPlaying = false;

            // MP3 파일 정지
            if (this.backgroundMusic.audio) {
                try {
                    this.backgroundMusic.audio.pause();
                    this.backgroundMusic.audio.currentTime = 0;
                } catch (error) {
                    console.warn('MP3 정지 오류:', error);
                }
            }

            // 기본 음악 정지
            if (this.backgroundMusic.oscillators) {
                this.backgroundMusic.oscillators.forEach(osc => {
                    try {
                        osc.stop();
                    } catch (e) {
                        // 이미 정지된 oscillator 무시
                    }
                });
                this.backgroundMusic.oscillators = [];
            }
        }
    }

    // 음소거 토글
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else if (this.gameState.phase === 'playing') {
            this.startBackgroundMusic();
        }
        console.log('음소거:', this.isMuted ? '켜짐' : '꺼짐');
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
        console.info('세션 생성 완료:', session);

        // 세션 코드 표시
        if (this.elements.sessionCode && session.sessionCode) {
            this.elements.sessionCode.textContent = session.sessionCode;
            console.info('세션 코드 표시:', session.sessionCode);
        }

        // QR 코드 생성 (tilt-maze와 동일한 방식)
        setTimeout(() => {
            // QR 코드 URL 생성 (tilt-maze와 동일한 방식)
            const qrUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
            console.info('QR URL 생성:', qrUrl);
            this.generateQRCode(qrUrl);
        }, 100);

        // UI 업데이트
        this.updateOverlay('플레이어를 기다리는 중...', '모바일 기기로 아래 방법 중 하나를 사용하여 연결하세요');
    }

    generateQRCode(url) {
        console.info('QR 코드 생성 시작:', url);

        // QR 코드 생성 (tilt-maze와 동일한 방식)
        if (typeof QRCode !== 'undefined') {
            try {
                // 새 캔버스 생성 (tilt-maze 방식)
                QRCode.toCanvas(document.createElement('canvas'), url, (error, canvas) => {
                    if (!error) {
                        canvas.style.width = '150px';
                        canvas.style.height = '150px';

                        // QR 컨테이너에 캔버스 추가
                        const qrContainer = document.querySelector('.qr-container');
                        if (qrContainer) {
                            qrContainer.innerHTML = '';
                            qrContainer.appendChild(canvas);
                        }

                        console.info('QR 코드 생성 성공');

                        // 폴백 숨기기
                        if (this.elements.qrFallback) {
                            this.elements.qrFallback.style.display = 'none';
                        }
                    } else {
                        console.error('QR 코드 생성 실패:', error);
                        this.showQRFallback(url);
                    }
                });
            } catch (error) {
                console.error('QR 코드 생성 중 오류:', error);
                this.showQRFallback(url);
            }
        } else {
            console.warn('QRCode 라이브러리가 로드되지 않았습니다. 폴백 사용.');
            this.showQRFallback(url);
        }
    }

    showQRFallback(url) {
        console.info('QR 코드 폴백 시스템 사용');

        if (this.elements.qrCanvas) {
            this.elements.qrCanvas.style.display = 'none';
        }

        // QR 컨테이너에 폴백 QR 코드 표시
        const qrContainer = document.querySelector('.qr-container');
        if (qrContainer) {
            // 세션 코드 추출 (URL에서)
            const sessionCode = this.extractSessionCode(url);

            // 외부 QR API를 사용하여 실제 QR 코드 생성 (200x200 크기)
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

            qrContainer.innerHTML = `
                <div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <div style="margin-bottom: 20px;">
                        <div style="font-size: 20px; font-weight: bold; color: #1e293b; margin-bottom: 12px;">📱 QR 코드로 연결하세요</div>
                        <div style="font-size: 14px; color: #64748b; margin-bottom: 20px;">
                            모바일 카메라로 아래 QR 코드를 스캔하면 바로 연결됩니다
                        </div>
                    </div>
                    
                    <div style="display: inline-block; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
                        <img src="${qrApiUrl}" 
                             style="width: 200px; height: 200px; border-radius: 8px;" 
                             alt="QR Code" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div style="display: none; padding: 40px; color: #64748b; font-size: 16px;">
                            QR 코드 로딩 실패
                        </div>
                    </div>
                    
                    <div style="font-size: 16px; color: #3b82f6; font-weight: 600; margin-bottom: 15px;">
                        🎯 가장 빠르고 쉬운 연결 방법입니다!
                    </div>
                </div>
                
                <details style="margin-top: 15px; cursor: pointer;">
                    <summary style="padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 14px; font-weight: 600; color: #64748b; outline: none; user-select: none;">
                        ⚙️ 다른 연결 방법 (QR 코드가 작동하지 않는 경우)
                    </summary>
                    
                    <div style="margin-top: 10px; padding: 15px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 8px;">
                        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 14px; font-weight: bold; color: #3b82f6; margin-bottom: 8px;">방법 1: 세션 코드 입력</div>
                            <div style="font-size: 20px; font-weight: bold; color: #1e293b; letter-spacing: 2px; font-family: monospace; background: #f1f5f9; padding: 8px; border-radius: 4px;">${sessionCode}</div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 5px;">센서 게임 앱에서 위 코드를 입력하세요</div>
                        </div>
                        
                        <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 14px; font-weight: bold; color: #10b981; margin-bottom: 8px;">방법 2: 직접 접속</div>
                            <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">모바일 브라우저에서 아래 주소로 접속:</div>
                            <div style="font-size: 10px; color: #6366f1; word-break: break-all; background: #f1f5f9; padding: 6px; border-radius: 4px;">${url}</div>
                        </div>
                    </div>
                </details>
            `;
        }

        if (this.elements.qrFallback) {
            this.elements.qrFallback.style.display = 'block';
        }
    }

    extractSessionCode(url) {
        // URL에서 세션 코드 추출 시도
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const sessionCode = pathParts[pathParts.length - 1] || 'UNKNOWN';
            return sessionCode.length > 3 ? sessionCode : 'LOADING...';
        } catch (error) {
            // URL 파싱 실패 시 현재 표시된 세션 코드 사용
            return this.elements.sessionCode ? this.elements.sessionCode.textContent : 'LOADING...';
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
        // 센서 데이터 throttling 적절히 적용 (튀는 현상 방지)
        const now = Date.now();
        if (now - this.lastSensorUpdate < this.sensorThrottle) return;
        this.lastSensorUpdate = now;

        if (this.gameState.phase !== 'playing') return;

        // 센서 데이터 검증 (더 관대하게)
        if (!this.validateSensorDataLoose(data)) {
            return; // 경고 로그 제거로 성능 향상
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

    // 더 관대한 센서 데이터 검증 (끊김 현상 해결)
    validateSensorDataLoose(data) {
        return data &&
            data.data &&
            data.data.orientation &&
            typeof data.data.orientation.beta === 'number' &&
            typeof data.data.orientation.gamma === 'number' &&
            !isNaN(data.data.orientation.beta) &&
            !isNaN(data.data.orientation.gamma);
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

        // 센서 데이터 스무딩 처리 (튀는 현상 방지)
        const { beta, gamma } = data.data.orientation;
        const smoothedData = this.smoothSensorData(data.sensorId, beta, gamma);
        
        // 적절한 데드존 적용 (튀는 현상 방지)
        const deadZone = 5; // 3 → 5 (안정성 향상)
        const filteredBeta = Math.abs(smoothedData.beta) > deadZone ? smoothedData.beta : 0;
        const filteredGamma = Math.abs(smoothedData.gamma) > deadZone ? smoothedData.gamma : 0;

        // 안정적인 속도 설정
        const maxTilt = 35; // 30 → 35 (안정성 향상)
        const maxSpeed = 5; // 6 → 5 (튀는 현상 방지)
        
        // 부드러운 속도 계산
        const targetVelocityX = (filteredGamma / maxTilt) * maxSpeed;
        const targetVelocityY = (filteredBeta / maxTilt) * maxSpeed;
        
        // 속도 보간으로 부드러운 움직임 (튀는 현상 방지)
        const smoothing = 0.3; // 보간 강도
        player.velocity.x = this.lerp(player.velocity.x || 0, targetVelocityX, smoothing);
        player.velocity.y = this.lerp(player.velocity.y || 0, targetVelocityY, smoothing);

        // 장애물처럼 단순한 위치 업데이트
        player.position.x += player.velocity.x;
        player.position.y += player.velocity.y;

        // 장애물처럼 단순한 경계 처리
        this.constrainPlayerToMapWithBounce(player);
    }

    // 센서 데이터 스무딩 함수
    smoothSensorData(sensorId, beta, gamma) {
        const buffer = this.sensorBuffer[sensorId];
        if (!buffer) return { beta, gamma };

        // 버퍼에 새 데이터 추가
        buffer.beta.push(beta);
        buffer.gamma.push(gamma);

        // 버퍼 크기 제한
        if (buffer.beta.length > this.bufferSize) {
            buffer.beta.shift();
            buffer.gamma.shift();
        }

        // 평균값 계산 (스무딩)
        const avgBeta = buffer.beta.reduce((sum, val) => sum + val, 0) / buffer.beta.length;
        const avgGamma = buffer.gamma.reduce((sum, val) => sum + val, 0) / buffer.gamma.length;

        return { beta: avgBeta, gamma: avgGamma };
    }

    // 선형 보간 함수
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    constrainPlayerToMap(player) {
        const margin = player.radius || 20;
        player.position.x = Math.max(margin, Math.min(this.canvas.width - margin, player.position.x));
        player.position.y = Math.max(margin, Math.min(this.canvas.height - margin, player.position.y));
    }

    // Solo 게임 방식의 벽 충돌 반사 기능
    constrainPlayerToMapWithBounce(player) {
        const margin = player.radius || 20;
        const bounceStrength = 0.7; // 반사 강도

        // 좌우 벽 충돌
        if (player.position.x - margin < 0 || player.position.x + margin > this.canvas.width) {
            player.velocity.x *= -bounceStrength;
            player.position.x = Math.max(margin, Math.min(this.canvas.width - margin, player.position.x));
        }

        // 상하 벽 충돌
        if (player.position.y - margin < 0 || player.position.y + margin > this.canvas.height) {
            player.velocity.y *= -bounceStrength;
            player.position.y = Math.max(margin, Math.min(this.canvas.height - margin, player.position.y));
        }
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

        // 게임 시작 효과음 및 배경음악 재생
        if (this.sounds.gameStart) {
            this.sounds.gameStart();
        }
        this.startBackgroundMusic();

        console.log('게임 시작!');
    }

    initializeGameEntities() {
        // 플레이어 위치 초기화 (새로운 캔버스 크기에 맞게)
        this.gameState.players.sensor1.position = { x: 150, y: 400 };
        this.gameState.players.sensor2.position = { x: 1050, y: 400 };

        // 플레이어 상태 초기화
        this.gameState.players.sensor1.score = 0;
        this.gameState.players.sensor1.carriedAcorns = 0;
        this.gameState.players.sensor1.stunned = false;
        this.gameState.players.sensor1.invulnerable = false;

        this.gameState.players.sensor2.score = 0;
        this.gameState.players.sensor2.carriedAcorns = 0;
        this.gameState.players.sensor2.stunned = false;
        this.gameState.players.sensor2.invulnerable = false;

        // 점수 구역 도토리 초기화
        this.gameState.scoreZoneAcorns.sensor1 = [];
        this.gameState.scoreZoneAcorns.sensor2 = [];

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

        // 충돌 감지 및 처리
        this.checkCollisions();

        // 도토리 추가 생성 (5초마다, 최대 15개)
        this.spawnAcorns();

        this.updateUI();
    }

    checkCollisions() {
        const players = [this.gameState.players.sensor1, this.gameState.players.sensor2];

        players.forEach((player, playerIndex) => {
            if (!player || player.stunned) return;

            // 도토리 수집 체크 (한 번에 하나만 집을 수 있음)
            if ((player.carriedAcorns || 0) === 0) {
                this.gameState.acorns = this.gameState.acorns.filter(acorn => {
                    const distance = Math.sqrt(
                        Math.pow(player.position.x - acorn.position.x, 2) +
                        Math.pow(player.position.y - acorn.position.y, 2)
                    );

                    if (distance < player.radius + acorn.radius) {
                        // 도토리 수집 (최대 1개)
                        player.carriedAcorns = 1;
                        console.log(`플레이어 ${playerIndex + 1}이 도토리 수집! 보유: ${player.carriedAcorns}`);
                        
                        // 도토리 수집 효과음 재생
                        if (this.sounds.acornCollect) {
                            this.sounds.acornCollect();
                        }
                        
                        return false; // 도토리 제거
                    }
                    return true; // 도토리 유지
                });
            }

            // 점수 구역 체크
            this.checkScoreZones(player, playerIndex);

            // 장애물 충돌 체크
            if (!player.invulnerable) {
                this.checkObstacleCollisions(player, playerIndex);
            }
        });
    }

    checkScoreZones(player, playerIndex) {
        const sensorId = playerIndex === 0 ? 'sensor1' : 'sensor2';
        const enemySensorId = playerIndex === 0 ? 'sensor2' : 'sensor1';
        const carriedAcorns = player.carriedAcorns || 0;

        // 자신의 점수 구역 (왼쪽 = sensor1, 오른쪽 = sensor2)
        const ownZone = playerIndex === 0 ?
            { x: 0, y: 0, width: 100, height: this.canvas.height } :
            { x: this.canvas.width - 100, y: 0, width: 100, height: this.canvas.height };

        // 상대방 점수 구역
        const enemyZone = playerIndex === 0 ?
            { x: this.canvas.width - 100, y: 0, width: 100, height: this.canvas.height } :
            { x: 0, y: 0, width: 100, height: this.canvas.height };

        // 자신의 점수 구역에서 도토리 저장
        if (this.isInZone(player.position, ownZone) && carriedAcorns > 0) {
            // 들고 있는 도토리를 구역에 저장
            for (let i = 0; i < carriedAcorns; i++) {
                this.gameState.scoreZoneAcorns[sensorId].push({
                    position: {
                        x: ownZone.x + 20 + (this.gameState.scoreZoneAcorns[sensorId].length % 4) * 20,
                        y: 60 + Math.floor(this.gameState.scoreZoneAcorns[sensorId].length / 4) * 20
                    },
                    radius: 8
                });
            }

            // 점수 업데이트
            player.score += carriedAcorns;
            player.carriedAcorns = 0;
            console.log(`플레이어 ${playerIndex + 1} 도토리 ${carriedAcorns}개 저장! 현재 점수: ${player.score}`);
            
            // 점수 획득 효과음 재생
            if (this.sounds.scorePoint) {
                this.sounds.scorePoint();
            }
        }

        // 상대방 점수 구역에서 도토리 훔치기
        if (this.isInZone(player.position, enemyZone) && carriedAcorns === 0) {
            const enemyAcorns = this.gameState.scoreZoneAcorns[enemySensorId];
            if (enemyAcorns.length > 0) {
                // 가장 최근에 저장된 도토리 하나를 훔침
                const stolenAcorn = enemyAcorns.pop();
                player.carriedAcorns = 1;

                // 상대방 점수 감소
                const enemyPlayer = playerIndex === 0 ? this.gameState.players.sensor2 : this.gameState.players.sensor1;
                enemyPlayer.score = Math.max(0, enemyPlayer.score - 1);

                console.log(`플레이어 ${playerIndex + 1}이 도토리 1개 훔침! 상대방 점수: ${enemyPlayer.score}`);
                
                // 도토리 훔치기 효과음 재생
                if (this.sounds.acornSteal) {
                    this.sounds.acornSteal();
                }
            }
        }
    }

    isInZone(position, zone) {
        return position.x >= zone.x &&
            position.x <= zone.x + zone.width &&
            position.y >= zone.y &&
            position.y <= zone.y + zone.height;
    }

    checkObstacleCollisions(player, playerIndex) {
        this.gameState.obstacles.forEach(obstacle => {
            // 원-사각형 충돌 감지
            const closestX = Math.max(obstacle.position.x,
                Math.min(player.position.x, obstacle.position.x + obstacle.size.width));
            const closestY = Math.max(obstacle.position.y,
                Math.min(player.position.y, obstacle.position.y + obstacle.size.height));

            const distance = Math.sqrt(
                Math.pow(player.position.x - closestX, 2) +
                Math.pow(player.position.y - closestY, 2)
            );

            if (distance < player.radius) {
                // 충돌 발생
                player.stunned = true;
                player.stunnedUntil = Date.now() + 500; // 0.5초 기절

                // 도토리 떨어뜨리기
                const droppedAcorns = player.carriedAcorns || 0;
                if (droppedAcorns > 0) {
                    for (let i = 0; i < droppedAcorns; i++) {
                        this.gameState.acorns.push({
                            position: {
                                x: player.position.x + (Math.random() - 0.5) * 60,
                                y: player.position.y + (Math.random() - 0.5) * 60
                            },
                            radius: 10
                        });
                    }
                    player.carriedAcorns = 0;
                }

                console.log(`플레이어 ${playerIndex + 1} 장애물 충돌! ${droppedAcorns}개 도토리 떨어뜨림`);
                
                // 장애물 충돌 효과음 재생
                if (this.sounds.obstacleHit) {
                    this.sounds.obstacleHit();
                }
            }
        });
    }

    spawnAcorns() {
        // 5초마다 도토리 추가 생성
        if (!this.lastAcornSpawn) this.lastAcornSpawn = Date.now();

        if (Date.now() - this.lastAcornSpawn >= 5000 && this.gameState.acorns.length < 15) {
            this.gameState.acorns.push({
                position: {
                    x: Math.random() * (this.canvas.width - 200) + 100, // 점수 구역 피하기
                    y: Math.random() * (this.canvas.height - 100) + 50
                },
                radius: 10
            });
            this.lastAcornSpawn = Date.now();
            console.log('새 도토리 생성! 총 개수:', this.gameState.acorns.length);
        }
    }

    render() {
        if (!this.ctx || !this.canvas) return;

        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 배경 렌더링
        this.renderBackground();

        // 점수 구역 렌더링
        this.renderScoreZones();

        // 도토리 렌더링
        this.renderAcorns();

        // 장애물 렌더링
        this.renderObstacles();

        // 플레이어 렌더링
        this.renderPlayers();

        // 플레이어 보유 도토리 표시
        this.renderCarriedAcorns();

        // 게임 내 UI 렌더링 (점수, 타이머)
        this.renderGameUI();
    }

    renderBackground() {
        // 그라데이션 배경
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a202c');
        gradient.addColorStop(1, '#2d3748');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderScoreZones() {
        // 플레이어 1 점수 구역 (왼쪽, 파란색)
        this.ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        this.ctx.fillRect(0, 0, 100, this.canvas.height);
        this.ctx.strokeStyle = '#3B82F6';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, 0, 100, this.canvas.height);

        // 플레이어 2 점수 구역 (오른쪽, 빨간색)
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        this.ctx.fillRect(this.canvas.width - 100, 0, 100, this.canvas.height);
        this.ctx.strokeStyle = '#EF4444';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.canvas.width - 100, 0, 100, this.canvas.height);

        // 구역 라벨
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('P1 구역', 50, 30);
        this.ctx.fillText('P2 구역', this.canvas.width - 50, 30);

        // 플레이어 1 구역에 저장된 도토리들 렌더링
        this.ctx.fillStyle = '#8B4513';
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 1;
        this.gameState.scoreZoneAcorns.sensor1.forEach(acorn => {
            this.ctx.beginPath();
            this.ctx.arc(acorn.position.x, acorn.position.y, acorn.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        });

        // 플레이어 2 구역에 저장된 도토리들 렌더링
        this.gameState.scoreZoneAcorns.sensor2.forEach(acorn => {
            this.ctx.beginPath();
            this.ctx.arc(acorn.position.x, acorn.position.y, acorn.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        });
    }

    renderAcorns() {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 2;

        this.gameState.acorns.forEach(acorn => {
            this.ctx.beginPath();
            this.ctx.arc(acorn.position.x, acorn.position.y, acorn.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        });
    }

    renderObstacles() {
        this.ctx.fillStyle = '#FF4444';
        this.ctx.strokeStyle = '#CC0000';
        this.ctx.lineWidth = 2;

        this.gameState.obstacles.forEach(obstacle => {
            this.ctx.fillRect(
                obstacle.position.x,
                obstacle.position.y,
                obstacle.size.width,
                obstacle.size.height
            );
            this.ctx.strokeRect(
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
        this.ctx.fillStyle = player1.stunned ? '#666666' :
            player1.invulnerable ? '#87CEEB' : '#3B82F6';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(player1.position.x, player1.position.y, player1.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // 플레이어 2 (빨간색)
        const player2 = this.gameState.players.sensor2;
        this.ctx.fillStyle = player2.stunned ? '#666666' :
            player2.invulnerable ? '#FFB6C1' : '#EF4444';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(player2.position.x, player2.position.y, player2.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // 플레이어 번호 표시
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('1', player1.position.x, player1.position.y + 5);
        this.ctx.fillText('2', player2.position.x, player2.position.y + 5);
    }

    renderCarriedAcorns() {
        // 플레이어 1 보유 도토리 표시
        const player1 = this.gameState.players.sensor1;
        if (player1.carriedAcorns > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`🌰${player1.carriedAcorns}`, player1.position.x, player1.position.y - 30);
        }

        // 플레이어 2 보유 도토리 표시
        const player2 = this.gameState.players.sensor2;
        if (player2.carriedAcorns > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`🌰${player2.carriedAcorns}`, player2.position.x, player2.position.y - 30);
        }
    }

    renderGameUI() {
        // 게임 내 점수 및 타이머 표시
        if (this.gameState.phase === 'playing') {
            // 반투명 배경
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.canvas.width / 2 - 200, 10, 400, 80);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.canvas.width / 2 - 200, 10, 400, 80);

            // 게임 제목
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🏆 Acorn Battle', this.canvas.width / 2, 35);

            // 타이머
            const minutes = Math.floor(this.gameState.timeRemaining / 60);
            const seconds = Math.floor(this.gameState.timeRemaining % 60);
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            this.ctx.fillStyle = this.gameState.timeRemaining <= 10 ? '#FF4444' : '#FFFFFF';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(`⏰ ${timeString}`, this.canvas.width / 2, 55);

            // 플레이어 점수
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';

            // 플레이어 1 점수 (왼쪽)
            this.ctx.fillStyle = '#3B82F6';
            this.ctx.fillText(`P1: ${this.gameState.players.sensor1.score}`, this.canvas.width / 2 - 180, 75);

            // 플레이어 2 점수 (오른쪽)
            this.ctx.fillStyle = '#EF4444';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`P2: ${this.gameState.players.sensor2.score}`, this.canvas.width / 2 + 180, 75);
        }
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

        // 배경음악 정지 및 게임 종료 효과음 재생
        this.stopBackgroundMusic();
        if (this.sounds.gameEnd) {
            this.sounds.gameEnd();
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
        // 배경음악 정지 (재시작 시)
        this.stopBackgroundMusic();
        
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

        // 배경음악 일시정지
        if (this.backgroundMusic && this.backgroundMusic.audio) {
            this.backgroundMusic.audio.pause();
        }

        // UI 업데이트
        if (this.elements.gameOverlay) {
            this.elements.gameOverlay.style.display = 'block';
        }
        this.updateOverlay('게임 일시정지', '게임이 일시정지되었습니다');
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.textContent = '▶️ 재개';
        }

        console.log('게임 일시정지됨 - 배경음악 일시정지');
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

        // 배경음악 재개
        if (this.backgroundMusic && this.backgroundMusic.audio && !this.isMuted) {
            this.backgroundMusic.audio.play().catch(error => {
                console.warn('MP3 재개 실패:', error);
            });
        }

        // 게임 루프 재시작
        this.startGameLoop();

        console.log('게임 재개됨 - 배경음악 재개');
    }

    initializeGame() {
        // 네트워크 상태 체크
        this.checkNetworkStatus();

        // 캔버스 크기 설정 (확대)
        if (this.canvas) {
            this.canvas.width = 1200;
            this.canvas.height = 800;

            // 캔버스를 전체 화면으로 표시
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
            this.canvas.style.objectFit = 'contain';
        }

        // SDK 연결 시작
        try {
            console.log('SDK 연결 시작...');
            this.sdk.connect();
        } catch (error) {
            console.error('SDK 연결 실패:', error);
            this.showError('서버 연결에 실패했습니다. 페이지를 새로고침해주세요.');
        }

        console.log('게임 초기화 완료');
    }

    checkNetworkStatus() {
        // 온라인/오프라인 상태 체크
        if (!navigator.onLine) {
            console.warn('오프라인 상태 감지됨');
            this.showError('인터넷 연결을 확인해주세요');
        }

        // 네트워크 상태 변화 감지
        window.addEventListener('online', () => {
            console.info('온라인 상태로 변경됨');
            this.hideError('network-offline');
        });

        window.addEventListener('offline', () => {
            console.warn('오프라인 상태로 변경됨');
            this.showError('인터넷 연결이 끊어졌습니다', 'network-offline');
        });
    }

    hideError(errorType) {
        const errorElements = document.querySelectorAll(`.error-message${errorType ? `[data-type="${errorType}"]` : ''}`);
        errorElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    }

    showError(message, errorType = 'general', duration = 3000) {
        // 기존 같은 타입의 에러 메시지 제거
        this.hideError(errorType);

        // 간단한 오류 알림 표시
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.setAttribute('data-type', errorType);
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
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;

        document.body.appendChild(errorDiv);

        // 지정된 시간 후 제거 (0이면 수동 제거)
        if (duration > 0) {
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, duration);
        }
    }

    hideError(errorType = 'general') {
        // 특정 타입의 에러 메시지 제거
        const existingErrors = document.querySelectorAll(`.error-message[data-type="${errorType}"]`);
        existingErrors.forEach(error => {
            if (error.parentNode) {
                error.parentNode.removeChild(error);
            }
        });
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

    initializeGame() {
        // 네트워크 상태 체크
        this.checkNetworkStatus();

        // 캔버스 크기 설정 (확대)
        if (this.canvas) {
            this.canvas.width = 1200;
            this.canvas.height = 800;

            // 캔버스를 전체 화면으로 표시
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
            this.canvas.style.objectFit = 'contain';
        }

        // SDK 연결 시작
        try {
            console.log('SDK 연결 시작...');
            this.sdk.connect();
        } catch (error) {
            console.error('SDK 연결 실패:', error);
            this.showError('서버 연결에 실패했습니다. 페이지를 새로고침해주세요.');
        }

        console.log('게임 초기화 완료');
    }

    checkNetworkStatus() {
        // 온라인/오프라인 상태 체크
        if (!navigator.onLine) {
            console.warn('오프라인 상태 감지됨');
            this.showError('인터넷 연결을 확인해주세요');
        }

        // 네트워크 상태 변화 감지
        window.addEventListener('online', () => {
            console.info('온라인 상태로 변경됨');
        });

        window.addEventListener('offline', () => {
            console.warn('오프라인 상태로 변경됨');
            this.showError('인터넷 연결이 끊어졌습니다');
        });
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


