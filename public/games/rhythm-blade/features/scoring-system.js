import { GAME_CONFIG } from '../shared/config.js';

export class ScoringSystem {
    constructor() {
        this.gameState = {
            score: 0,
            combo: 0,
            maxCombo: 0,
            totalNotes: 0,
            hitNotes: 0,
            startTime: 0,
            endingStartTime: 0
        };
    }

    reset() {
        this.gameState = {
            score: 0,
            combo: 0,
            maxCombo: 0,
            totalNotes: 0,
            hitNotes: 0,
            startTime: 0,
            endingStartTime: 0
        };
    }

    calculateScore(accuracy, isCooperation = false, cooperationBonus = 1.0) {
        let baseScore = GAME_CONFIG.BASE_SCORE;
        
        // 정확도에 따른 점수 조정
        switch (accuracy) {
            case 'perfect':
                baseScore *= 1.2;
                break;
            case 'great':
                baseScore *= 1.0;
                break;
            case 'good':
                baseScore *= 0.8;
                break;
            case 'miss':
                return 0;
        }
        
        // 콤보 보너스
        const comboBonus = Math.floor(this.gameState.combo / 10) * GAME_CONFIG.COMBO_BONUS_RATE;
        
        // 협력 보너스
        const finalScore = Math.round((baseScore + comboBonus) * 
                          (isCooperation ? GAME_CONFIG.COOPERATION_SCORE_MULTIPLIER * cooperationBonus : 1));
        
        return finalScore;
    }

    addScore(accuracy, isCooperation = false, cooperationBonus = 1.0) {
        const score = this.calculateScore(accuracy, isCooperation, cooperationBonus);
        
        if (score > 0) {
            this.gameState.score += score;
            this.gameState.combo++;
            this.gameState.hitNotes++;
            
            // 최대 콤보 업데이트
            if (this.gameState.combo > this.gameState.maxCombo) {
                this.gameState.maxCombo = this.gameState.combo;
            }
        } else {
            // 미스 시 콤보 리셋
            this.gameState.combo = 0;
        }
        
        return score;
    }

    breakCombo() {
        this.gameState.combo = 0;
    }

    getAccuracy() {
        if (this.gameState.totalNotes === 0) return 100;
        return Math.round((this.gameState.hitNotes / this.gameState.totalNotes) * 100);
    }

    getGameState() {
        return { ...this.gameState };
    }

    setTotalNotes(count) {
        this.gameState.totalNotes = count;
    }

    startGame() {
        this.gameState.startTime = Date.now();
    }

    startEnding() {
        this.gameState.endingStartTime = Date.now();
    }

    isGameEnding() {
        return this.gameState.endingStartTime > 0;
    }

    getEndingTimeRemaining() {
        if (this.gameState.endingStartTime === 0) return 0;
        return Math.max(0, GAME_CONFIG.ENDING_DURATION - (Date.now() - this.gameState.endingStartTime));
    }

    calculateFinalStats() {
        const accuracy = this.getAccuracy();
        const playTime = this.gameState.endingStartTime > 0 ? 
                        (this.gameState.endingStartTime - this.gameState.startTime) / 1000 : 0;
        
        return {
            score: this.gameState.score,
            accuracy: accuracy,
            maxCombo: this.gameState.maxCombo,
            hitNotes: this.gameState.hitNotes,
            totalNotes: this.gameState.totalNotes,
            playTime: playTime
        };
    }
}