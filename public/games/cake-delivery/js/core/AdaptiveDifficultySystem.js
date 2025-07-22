/**
 * 적응형 난이도 시스템
 * 플레이어의 실력에 따라 게임 난이도를 자동으로 조절합니다.
 */
class AdaptiveDifficultySystem {
    constructor() {
        this.currentDifficulty = 'normal';
        this.playerPerformance = {
            totalGames: 0,
            successfulGames: 0,
            averageScore: 0,
            averageTime: 0,
            recentPerformance: []
        };
        
        this.difficultySettings = {
            easy: {
                level: 'easy',
                scoreMultiplier: 0.8,
                timeMultiplier: 1.2,
                physicsMultiplier: 0.8
            },
            normal: {
                level: 'normal',
                scoreMultiplier: 1.0,
                timeMultiplier: 1.0,
                physicsMultiplier: 1.0
            },
            hard: {
                level: 'hard',
                scoreMultiplier: 1.5,
                timeMultiplier: 0.8,
                physicsMultiplier: 1.3
            }
        };
        
        console.log('✅ 적응형 난이도 시스템 초기화 완료');
    }
    
    /**
     * 게임 완료 시 성능 업데이트
     */
    onGameComplete(gameData) {
        this.playerPerformance.totalGames++;
        
        if (gameData.success) {
            this.playerPerformance.successfulGames++;
        }
        
        // 평균 점수 업데이트
        const totalScore = this.playerPerformance.averageScore * (this.playerPerformance.totalGames - 1) + gameData.score;
        this.playerPerformance.averageScore = totalScore / this.playerPerformance.totalGames;
        
        // 최근 성능 기록 (최대 10게임)
        this.playerPerformance.recentPerformance.push({
            success: gameData.success,
            score: gameData.score,
            time: gameData.timeElapsed,
            timestamp: Date.now()
        });
        
        if (this.playerPerformance.recentPerformance.length > 10) {
            this.playerPerformance.recentPerformance.shift();
        }
        
        // 자동 난이도 조절
        this.adjustDifficulty();
    }
    
    /**
     * 자동 난이도 조절
     */
    adjustDifficulty() {
        const successRate = this.playerPerformance.successfulGames / this.playerPerformance.totalGames;
        
        if (this.playerPerformance.totalGames >= 3) {
            if (successRate > 0.8 && this.currentDifficulty !== 'hard') {
                this.changeDifficulty('hard', 'auto');
            } else if (successRate < 0.3 && this.currentDifficulty !== 'easy') {
                this.changeDifficulty('easy', 'auto');
            } else if (successRate >= 0.3 && successRate <= 0.8 && this.currentDifficulty !== 'normal') {
                this.changeDifficulty('normal', 'auto');
            }
        }
    }
    
    /**
     * 난이도 변경
     */
    changeDifficulty(difficulty, source = 'manual') {
        if (this.difficultySettings[difficulty]) {
            this.currentDifficulty = difficulty;
            console.log(`🎯 난이도 변경: ${difficulty} (${source})`);
            return true;
        }
        return false;
    }
    
    /**
     * 현재 난이도 설정 가져오기
     */
    getCurrentDifficultySettings() {
        return this.difficultySettings[this.currentDifficulty];
    }
    
    /**
     * 점수 설정 가져오기
     */
    getScoreSettings() {
        return {
            scoreMultiplier: this.difficultySettings[this.currentDifficulty].scoreMultiplier
        };
    }
    
    /**
     * 플레이어 통계 가져오기
     */
    getPlayerStats() {
        return this.playerPerformance;
    }
    
    /**
     * 난이도 설정
     */
    setDifficulty(difficulty) {
        return this.changeDifficulty(difficulty, 'manual');
    }
}