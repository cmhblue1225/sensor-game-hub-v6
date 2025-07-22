export class ScoringSystem {
    constructor() {
        this.state = {
            score: 0,
            hits: 0,
            misses: 0,
            comboCount: 0,
            maxCombo: 0,
            // 경쟁 모드용 개별 점수
            player1Score: 0,
            player2Score: 0,
            player1Hits: 0,
            player2Hits: 0,
            player1Combo: 0,
            player2Combo: 0,
            player1LastHitTime: 0,
            player2LastHitTime: 0
        };
    }

    calculateScore(target, gameMode, playerId, comboMultiplier) {
        let points = target.points;

        if (gameMode === 'competitive') {
            if (playerId === 1) {
                this.state.player1Hits++;
                this.state.player1Combo++;

                if (this.state.player1Combo > 1) {
                    const comboBonus = Math.min(this.state.player1Combo - 1, 2);
                    points *= Math.pow(comboMultiplier, comboBonus);
                }
                this.state.player1Score += Math.floor(points);
                this.state.player1LastHitTime = Date.now();

            } else if (playerId === 2) {
                this.state.player2Hits++;
                this.state.player2Combo++;

                if (this.state.player2Combo > 1) {
                    const comboBonus = Math.min(this.state.player2Combo - 1, 2);
                    points *= Math.pow(comboMultiplier, comboBonus);
                }
                this.state.player2Score += Math.floor(points);
                this.state.player2LastHitTime = Date.now();
            }
        } else {
            // 싱글/협동 모드: 공통 점수
            this.state.hits++;
            this.state.comboCount++;

            if (this.state.comboCount > 1) {
                points *= Math.pow(comboMultiplier, this.state.comboCount - 1);
            }

            this.state.score += Math.floor(points);
            this.state.maxCombo = Math.max(this.state.maxCombo, this.state.comboCount);
        }

        return Math.floor(points);
    }

    miss() {
        this.state.misses++;
        this.state.comboCount = 0;
    }

    checkComboTimeout(gameMode) {
        const now = Date.now();
        const comboTimeout = 3500;

        if (gameMode === 'competitive') {
            if (this.state.player1Combo > 0 && now - this.state.player1LastHitTime > comboTimeout) {
                this.state.player1Combo = 0;
                return { player: 1, reset: true };
            }
            if (this.state.player2Combo > 0 && now - this.state.player2LastHitTime > comboTimeout) {
                this.state.player2Combo = 0;
                return { player: 2, reset: true };
            }
        }

        return null;
    }

    reset(gameMode) {
        this.state.score = 0;
        this.state.hits = 0;
        this.state.misses = 0;
        this.state.comboCount = 0;
        this.state.maxCombo = 0;

        if (gameMode === 'competitive') {
            this.state.player1Score = 0;
            this.state.player2Score = 0;
            this.state.player1Hits = 0;
            this.state.player2Hits = 0;
            this.state.player1Combo = 0;
            this.state.player2Combo = 0;
            this.state.player1LastHitTime = 0;
            this.state.player2LastHitTime = 0;
        }
    }

    getAccuracy() {
        const total = this.state.hits + this.state.misses;
        return total > 0 ? ((this.state.hits / total) * 100).toFixed(1) : 100;
    }
}