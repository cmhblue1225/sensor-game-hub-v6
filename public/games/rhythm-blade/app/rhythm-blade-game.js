import { GAME_CONFIG, COLORS } from '../shared/config.js';
import { Saber } from '../entities/saber.js';
import { MusicSystem } from '../features/music-system.js';
import { ScoringSystem } from '../features/scoring-system.js';
import { SensorManager } from '../features/sensor-manager.js';
import { CooperationSystem } from '../features/cooperation-system.js';
import { BeatmapGenerator } from '../features/beatmap-generator.js';
import { SessionPanelWidget } from '../widgets/session-panel-widget.js';
import { GameUIWidget } from '../widgets/game-ui-widget.js';
import { GamePage } from '../pages/game-page.js';

export class RhythmBladeDual {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        
        // 캔버스 크기 설정
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // ✅ 올바른 SDK 초기화 (dual 타입)
        this.sdk = new SessionSDK({
            gameId: 'rhythm-blade',
            gameType: 'dual',
            debug: true
        });
        
        // 게임 페이즈 상태
        this.gamePhase = 'waiting'; // waiting, playing, paused, ended
        
        // 시스템 초기화
        this.initializeSystems();
        this.initializeThreeJS();
        this.setupEventListeners();
        this.setupTrackSelection();
        this.startGameLoop();
        
        console.log('🎮 Rhythm Blade Dual 초기화 완료');
    }

    initializeSystems() {
        // 시스템들 초기화
        this.musicSystem = new MusicSystem();
        this.scoringSystem = new ScoringSystem();
        this.sensorManager = new SensorManager();
        this.cooperationSystem = new CooperationSystem();
        this.beatmapGenerator = new BeatmapGenerator(this.musicSystem);
        
        // 위젯 초기화
        this.sessionWidget = new SessionPanelWidget(document.getElementById('sessionPanel'));
        this.gameUIWidget = new GameUIWidget();
        
        // 센서 스윙 이벤트 리스너
        this.sensorManager.onSwing((sensorId) => {
            this.handleSensorSwing(sensorId);
        });
        
        // 키보드 테스트 컨트롤 설정
        this.sensorManager.setupKeyboardControls();
    }

    initializeThreeJS() {
        // Scene 설정
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Renderer 설정
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // 세이버 생성 (dual용)
        this.sabers = {
            sensor1: new Saber(COLORS.SENSOR1, -2, 'sensor1'),
            sensor2: new Saber(COLORS.SENSOR2, 2, 'sensor2')
        };
        
        this.scene.add(this.sabers.sensor1.mesh);
        this.scene.add(this.sabers.sensor2.mesh);
        
        // 게임 페이지 초기화
        this.gamePage = new GamePage(this.scene, this.camera, this.renderer);
        
        // 빈 배열 초기화 (노트들은 GamePage에서 관리)
        this.notes = [];
        this.particleEffects = [];
    }

    setupEventListeners() {
        // SDK 이벤트 리스너
        this.sdk.on('connected', () => {
            console.log('✅ 서버 연결 성공');
            this.sdk.createSession();
        });

        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            console.log('✅ 세션 생성:', session.sessionCode);
            this.sessionWidget.updateSessionCode(session.sessionCode);
            this.sessionWidget.createQRCode(session.sessionCode);
        });

        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            console.log('📱 센서 연결:', data.sensorId);
            this.sensorManager.handleSensorConnect(data);
            this.sessionWidget.updateSensorStatus(data.sensorId, true);
        });

        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;
            console.log('📱 센서 연결 해제:', data.sensorId);
            this.sensorManager.handleSensorDisconnect(data);
            this.sessionWidget.updateSensorStatus(data.sensorId, false);
        });

        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.sensorManager.handleSensorData(data);
        });
    }

    setupTrackSelection() {
        this.musicSystem.setupTrackSelection();
        
        // 기본 트랙 로드
        this.musicSystem.loadTrack('electric-storm');
    }

    resizeCanvas() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
        if (this.camera) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
    }

    handleSensorSwing(sensorId) {
        console.log(`🏹 센서 스윙: ${sensorId}`);
        
        if (this.gamePhase !== 'playing') return;
        
        // 세이버 스윙 애니메이션 실행
        const saber = this.sabers[sensorId];
        if (saber) {
            saber.triggerSwing();
            
            // 노트 히트 체크
            const hitResult = this.gamePage.checkNoteHit(saber, sensorId);
            
            if (hitResult.hit) {
                // 점수 및 콤보 처리
                const isCooperation = hitResult.note.type === 'cooperation';
                const cooperationBonus = this.cooperationSystem.getCooperationBonus();
                
                const score = this.scoringSystem.addScore(hitResult.accuracy, isCooperation, cooperationBonus);
                
                // 협력 시스템 업데이트
                if (isCooperation && hitResult.note.hitTimes && hitResult.note.hitTimes.length >= 2) {
                    const timeDiff = Math.abs(hitResult.note.hitTimes[1] - hitResult.note.hitTimes[0]);
                    const syncBonus = this.cooperationSystem.calculateSyncBonus(timeDiff);
                    this.cooperationSystem.updateCooperation(true, timeDiff);
                    
                    console.log(`🤝 협력 히트! 동기화: ${timeDiff}ms, 보너스: ${syncBonus.toFixed(2)}`);
                } else {
                    this.cooperationSystem.updateCooperation(true);
                }
                
                console.log(`✨ 히트! 정확도: ${hitResult.accuracy}, 점수: +${score}`);
            }
            
            // 게임 종료 체크
            const isGameEnding = this.gamePage.noteSpawnIndex >= this.gamePage.beatmap.length && this.gamePage.notes.length <= 2;
            
            if (isGameEnding && !this.scoringSystem.isGameEnding()) {
                this.startGameEnding();
            }
            
            // UI 업데이트
            this.updateUI();
        }
    }

    showStartButton() {
        const connectedCount = this.sensorManager.getConnectedCount();
        
        if (connectedCount >= 2) {
            this.sessionWidget.showStartButton(() => {
                this.startGame();
            });
        }
    }

    startGame() {
        console.log('🎮 게임 시작!');
        
        this.gamePhase = 'playing';
        
        // UI 전환
        this.sessionWidget.hide();
        this.gameUIWidget.showGameUI();
        
        // 시스템 리셋
        this.scoringSystem.reset();
        this.scoringSystem.startGame();
        this.cooperationSystem.reset();
        this.sensorManager.reset();
        
        // 비트맵 생성 및 설정
        const beatmap = this.beatmapGenerator.generateBeatmap();
        this.gamePage.setBeatmap(beatmap);
        this.scoringSystem.setTotalNotes(beatmap.length);
        
        console.log(`🎵 생성된 노트 수: ${beatmap.length}`);
        
        // 음악 재생
        this.musicSystem.play();
    }

    startGameEnding() {
        console.log('🏁 게임 종료 시퀀스 시작');
        this.scoringSystem.startEnding();
    }

    checkGameEnd() {
        if (this.scoringSystem.isGameEnding()) {
            const timeRemaining = this.scoringSystem.getEndingTimeRemaining();
            
            if (timeRemaining <= 0) {
                this.endGame();
            }
        }
    }

    endGame() {
        console.log('🎊 게임 종료!');
        
        this.gamePhase = 'ended';
        this.musicSystem.stop();
        
        // 최종 통계 계산
        const finalStats = this.scoringSystem.calculateFinalStats();
        console.log('📊 최종 결과:', finalStats);
        
        // 게임 종료 UI 표시
        this.gameUIWidget.showGameOver(finalStats);
    }

    updateUI() {
        const gameState = this.scoringSystem.getGameState();
        this.gameUIWidget.updateUI(gameState);
        
        // 협력 미터 업데이트
        this.gameUIWidget.updateCooperationMeter(this.cooperationSystem.getCooperationSync());
        
        // 종료 카운트다운 표시
        if (this.scoringSystem.isGameEnding()) {
            const remainingTime = this.scoringSystem.getEndingTimeRemaining();
            const seconds = Math.ceil(remainingTime / 1000);
            
            if (seconds > 0) {
                this.gameUIWidget.showEndingCountdown(seconds);
            }
        }
    }

    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        
        if (this.gamePhase === 'playing') {
            // 게임 업데이트
            const gameState = this.scoringSystem.getGameState();
            this.gamePage.update(gameState, this.musicSystem);
            
            // 세이버 업데이트
            Object.values(this.sabers).forEach(saber => saber.update());
            
            // 게임 종료 체크
            this.checkGameEnd();
        }
        
        // 연결된 센서가 2개 이상이면 시작 버튼 표시
        if (this.gamePhase === 'waiting') {
            this.showStartButton();
        }
        
        // 렌더링
        this.renderer.render(this.scene, this.camera);
    }

    startGameLoop() {
        this.gameLoop();
    }
}

// 게임 초기화
window.addEventListener('DOMContentLoaded', () => {
    new RhythmBladeDual();
});