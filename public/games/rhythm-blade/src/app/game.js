
import * as THREE from 'three';
import { SessionSDK } from '/js/SessionSDK.js';
import { tracks, STANDARD_4_4_BPM } from '../shared/config.js';
import { generateRhythmBeatmap } from '../features/beatmap-generator.js';
import { initThreeJS } from '../shared/scene.js';
import { createSaber } from '../entities/saber.js';
import { createNote } from '../entities/note.js';
import { createEnvironment } from '../entities/environment.js';
import { createTimingGuidelines, updateTimingGuidelines, triggerGuidelineHitEffect } from '../widgets/guidelines.js';
import * as UIManager from '../widgets/ui-manager.js';

export class RhythmBladeDual {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.sdk = new SessionSDK({ gameId: 'rhythm-blade', gameType: 'dual', debug: true });

        this.gameState = { /* ... */ };
        this.sensorStatus = { /* ... */ };
        this.cooperation = { /* ... */ };

        this.bgMusic = document.getElementById('bgMusic');
        this.musicLoaded = false;
        this.currentTrack = 'electric-storm';
        this.tracks = tracks;

        this.originalBpm = this.tracks[this.currentTrack].bpm;
        this.bpm = STANDARD_4_4_BPM;
        this.beatInterval = 60 / this.bpm;

        this.initializeMusic();

        const { scene, camera, renderer } = initThreeJS(this.canvas);
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.sabers = {
            sensor1: createSaber(0xff0000, -2),
            sensor2: createSaber(0x0000ff, 2)
        };
        this.scene.add(this.sabers.sensor1, this.sabers.sensor2);

        createEnvironment(this.scene);
        this.timingGuidelines = createTimingGuidelines(this.scene);

        this.notes = [];
        this.noteSpawnIndex = 0;
        this.particleEffects = [];

        this.beatmap = generateRhythmBeatmap(this.currentTrack);
        this.gameState.totalNotes = this.beatmap.length;

        this.setupMusicSelection();
        this.setupEventListeners();
        this.gameLoop();
    }

    import { showGamePage } from '../pages/game-page.js';
import { showWaitingPage } from '../pages/waiting-page.js';

// ... (RhythmBladeDual 클래스 정의)

    startGame() {
        this.gameState.phase = 'playing';
        this.gameState.startTime = Date.now();
        
        if (this.musicLoaded) {
            this.bgMusic.currentTime = 0;
            this.bgMusic.play().catch(e => console.warn('🎵 음악 재생 실패:', e));
        }
        
        showGamePage();
        console.log('🎮 Rhythm Blade Dual 게임 시작!');
    }

    endGame(reason) {
        this.gameState.phase = 'ended';
        this.gameState.endingStartTime = Date.now();
        if (this.musicLoaded) {
            this.bgMusic.pause();
        }
        console.log(`🏁 게임 종료: ${reason}`);
        
        // 2초 후 대기 화면으로 전환
        setTimeout(() => {
            this.resetGameState();
            showWaitingPage();
        }, 2000);
    }

    resetGame() {
        this.resetGameState();
        showWaitingPage();
    }
}
