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
        this.lastHitTime = 0;  // ✅ 콤보 타이머용 마지막 명중 시간
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

    // 콤보 업데이트 (최대 3콤보 제한 적용)
    updateCombo(playerId = null) {
        const now = Date.now();
        
        if (playerId === 1) {
            // 경쟁 모드 플레이어 1
            this.player1Combo = Math.min(this.player1Combo + 1, 3); // ✅ 최대 3콤보
            this.player1LastHitTime = now;
        } else if (playerId === 2) {
            // 경쟁 모드 플레이어 2
            this.player2Combo = Math.min(this.player2Combo + 1, 3); // ✅ 최대 3콤보
            this.player2LastHitTime = now;
        } else {
            // 솔로/협동 모드
            this.comboCount = Math.min(this.comboCount + 1, 3); // ✅ 최대 3콤보
            this.maxCombo = Math.max(this.maxCombo, this.comboCount);
            this.lastHitTime = now;
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

    // ✅ 콤보 타이머 체크 (4.5초 후 콤보 리셋)
    checkComboTimeout() {
        const now = Date.now();
        const COMBO_TIMEOUT = 4500; // 4.5초
        let comboReset = false;

        // 솔로/협동 모드 콤보 체크
        if (this.comboCount > 0 && now - this.lastHitTime > COMBO_TIMEOUT) {
            console.log(`🎯 콤보 타임아웃: ${this.comboCount} → 0`);
            this.comboCount = 0;
            comboReset = true;
        }

        // 경쟁 모드 플레이어 1 콤보 체크
        if (this.player1Combo > 0 && now - this.player1LastHitTime > COMBO_TIMEOUT) {
            console.log(`🎯 플레이어 1 콤보 타임아웃: ${this.player1Combo} → 0`);
            this.player1Combo = 0;
            comboReset = true;
        }

        // 경쟁 모드 플레이어 2 콤보 체크
        if (this.player2Combo > 0 && now - this.player2LastHitTime > COMBO_TIMEOUT) {
            console.log(`🎯 플레이어 2 콤보 타임아웃: ${this.player2Combo} → 0`);
            this.player2Combo = 0;
            comboReset = true;
        }

        return comboReset;
    }
}