// Entities Layer - 게임 상태 모델
import { TIME_CONFIG } from '../../shared/config/game-config.js';

export class GameState {
    constructor() {
        this.reset();
    }

    reset(gameMode = null) {
        this.connected = false;
        this.sensorConnected = false;
        this.sensor1Connected = false;
        this.sensor2Connected = false;
        this.playing = false;
        this.paused = false;
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.comboCount = 0;
        this.maxCombo = 0;
        this.sessionCode = null;
        this.timeLeft = gameMode ? TIME_CONFIG[gameMode] : 180;
        this.gameStartTime = null;
        
        // 경쟁 모드용 점수
        this.player1Score = 0;
        this.player2Score = 0;
        this.player1Hits = 0;
        this.player2Hits = 0;
        this.player1Combo = 0;
        this.player2Combo = 0;
        this.player1LastHitTime = 0;
        this.player2LastHitTime = 0;
        
        // 대규모 경쟁 모드용
        this.myPlayerId = null;
        this.totalTargetsCreated = 0;
    }

    // 점수 업데이트
    updateScore(points, playerId = null) {
        if (playerId === 1) {
            this.player1Score += points;
        } else if (playerId === 2) {
            this.player2Score += points;
        } else {
            this.score += points;
        }
    }

    // 적중 업데이트
    updateHits(playerId = null) {
        if (playerId === 1) {
            this.player1Hits++;
        } else if (playerId === 2) {
            this.player2Hits++;
        } else {
            this.hits++;
        }
    }

    // 빗나감 업데이트
    updateMisses() {
        this.misses++;
    }

    // 콤보 업데이트
    updateCombo(playerId = null) {
        if (playerId === 1) {
            this.player1Combo++;
        } else if (playerId === 2) {
            this.player2Combo++;
        } else {
            this.comboCount++;
            this.maxCombo = Math.max(this.maxCombo, this.comboCount);
        }
    }

    // 콤보 리셋
    resetCombo(playerId = null) {
        if (playerId === 1) {
            this.player1Combo = 0;
        } else if (playerId === 2) {
            this.player2Combo = 0;
        } else {
            this.comboCount = 0;
        }
    }

    // 시간 감소
    decreaseTime() {
        if (this.timeLeft > 0) {
            this.timeLeft--;
            return this.timeLeft > 0;
        }
        return false;
    }
}