/**
 * 적응형 난이도 조절 시스템
 * 플레이어의 실력을 분석하고 자동으로 난이도를 조절합니다.
 */
class AdaptiveDifficultySystem {
    constructor() {
        // 난이도 설정
        this.difficultyLevels = {
            beginner: {
                name: '초급',
                multiplier: 0.7,
                timeBonus: 1.5,
                cakeStability: 1.3,
                windStrength: 0.5,
                obstacleCount: 0.6,
                scoreMultiplier: 0.8
            },
            easy: {
                name: '쉬움',
                multiplier: 0.85,
                timeBonus: 1.2,
                cakeStability: 1.15,
                windStrength: 0.7,
                obstacleCount: 0.8,
                scoreMultiplier: 0.9
            },
            normal: {
                name: '보통',
                multiplier: 1.0,
                timeBonus: 1.0,
                cakeStability: 1.0,
                windStrength: 1.0,
                obstacleCount: 1.0,
                scoreMultiplier: 1.0
            },
            hard: {
                name: '어려움',
                multiplier: 1.2,
                timeBonus: 0.8,
                cakeStability: 0.85,
                windStrength: 1.3,
                obstacleCount: 1.2,
                scoreMultiplier: 1.2
            },
            expert: {
                name: '전문가',
                multiplier: 1.5,
                timeBonus: 0.6,
                cakeStability: 0.7,
                windStrength: 1.6,
                obstacleCount: 1.5,
                scoreMultiplier: 1.5
            }
        };
        
        // 현재 난이도
        this.currentDifficulty = 'normal';
        
        // 플레이어 성능 데이터
        this.playerPerformance = {
            totalGames: 0,
            successfulGames: 0,
            averageScore: 0,
            averageTime: 0,
            recentPerformance: [], // 최근 10게임 성과
            skillLevel: 0.5, // 0-1 범위의 실력 지수
            adaptationRate: 0.1, // 적응 속도
            consistencyScore: 0.5, // 일관성 점수
            improvementRate: 0.0 // 향상률
        };
        
        // 게임 세션 데이터
        this.currentSession = {
            startTime: 0,
            attempts: 0,
            successes: 0,
            failures: 0,
            scores: [],
            times: [],
            mistakes: [],
            difficultyChanges: []
        };
        
        // 분석 설정
        this.analysisConfig = {
            minGamesForAnalysis: 3, // 분석을 위한 최소 게임 수
            performanceWindow: 10, // 성과 분석 윈도우 크기
            adaptationThreshold: 0.2, // 적응 임계값
            stabilityPeriod: 5, // 안정화 기간
            maxDifficultyJump: 1 // 최대 난이도 점프
        };
        
        // 이벤트 리스너
        this.eventListeners = {
            onDifficultyChange: [],
            onPerformanceUpdate: [],
            onSkillLevelChange: []
        };
        
        this.init();
    }
    
    /**
     * 시스템 초기화
     */
    init() {
        this.loadPlayerData();
        this.startNewSession();
        
        console.log('✅ 적응형 난이도 시스템 초기화 완료');
        console.log(`현재 난이도: ${this.difficultyLevels[this.currentDifficulty].name}`);
    }
    
    /**
     * 플레이어 데이터 로드
     */
    loadPlayerData() {
        try {
            const savedData = localStorage.getItem('cakeDelivery_playerPerformance');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.playerPerformance = { ...this.playerPerformance, ...data };
                
                // 저장된 난이도 적용
                if (data.lastDifficulty && this.difficultyLevels[data.lastDifficulty]) {
                    this.currentDifficulty = data.lastDifficulty;
                }
            }
        } catch (error) {
            console.warn('플레이어 데이터 로드 실패:', error);
        }
    }
    
    /**
     * 플레이어 데이터 저장
     */
    savePlayerData() {
        try {
            const dataToSave = {
                ...this.playerPerformance,
                lastDifficulty: this.currentDifficulty,
                lastUpdated: Date.now()
            };
            
            localStorage.setItem('cakeDelivery_playerPerformance', JSON.stringify(dataToSave));
        } catch (error) {
            console.warn('플레이어 데이터 저장 실패:', error);
        }
    }
    
    /**
     * 새 세션 시작
     */
    startNewSession() {
        this.currentSession = {
            startTime: Date.now(),
            attempts: 0,
            successes: 0,
            failures: 0,
            scores: [],
            times: [],
            mistakes: [],
            difficultyChanges: []
        };
        
        console.log('🎮 새 게임 세션 시작');
    }
    
    /**
     * 게임 시작 시 호출
     */
    onGameStart() {
        this.currentSession.attempts++;
        
        // 게임 시작 시 난이도 조절 검토
        if (this.shouldAdjustDifficulty()) {
            this.adjustDifficulty();
        }
        
        console.log(`🎯 게임 시작 - 시도 횟수: ${this.currentSession.attempts}`);
    }
    
    /**
     * 게임 완료 시 호출
     */
    onGameComplete(gameData) {
        const { success, score, timeElapsed, mistakes, cakeType } = gameData;
        
        // 세션 데이터 업데이트\n        this.currentSession.scores.push(score);\n        this.currentSession.times.push(timeElapsed);\n        this.currentSession.mistakes.push(mistakes || 0);\n        \n        if (success) {\n            this.currentSession.successes++;\n        } else {\n            this.currentSession.failures++;\n        }\n        \n        // 플레이어 성능 데이터 업데이트\n        this.updatePlayerPerformance(gameData);\n        \n        // 실력 지수 계산\n        this.calculateSkillLevel();\n        \n        // 난이도 조절 검토\n        this.evaluateDifficultyAdjustment();\n        \n        // 데이터 저장\n        this.savePlayerData();\n        \n        console.log(`🏁 게임 완료 - 성공: ${success}, 점수: ${score}, 시간: ${timeElapsed}초`);\n    }\n    \n    /**\n     * 플레이어 성능 데이터 업데이트\n     */\n    updatePlayerPerformance(gameData) {\n        const { success, score, timeElapsed } = gameData;\n        \n        // 총 게임 수 증가\n        this.playerPerformance.totalGames++;\n        \n        if (success) {\n            this.playerPerformance.successfulGames++;\n        }\n        \n        // 평균 점수 업데이트\n        const totalScore = this.playerPerformance.averageScore * (this.playerPerformance.totalGames - 1) + score;\n        this.playerPerformance.averageScore = totalScore / this.playerPerformance.totalGames;\n        \n        // 평균 시간 업데이트\n        const totalTime = this.playerPerformance.averageTime * (this.playerPerformance.totalGames - 1) + timeElapsed;\n        this.playerPerformance.averageTime = totalTime / this.playerPerformance.totalGames;\n        \n        // 최근 성과 업데이트\n        const performanceScore = this.calculatePerformanceScore(gameData);\n        this.playerPerformance.recentPerformance.push(performanceScore);\n        \n        // 최근 성과 윈도우 크기 유지\n        if (this.playerPerformance.recentPerformance.length > this.analysisConfig.performanceWindow) {\n            this.playerPerformance.recentPerformance.shift();\n        }\n        \n        // 일관성 점수 계산\n        this.calculateConsistencyScore();\n        \n        // 향상률 계산\n        this.calculateImprovementRate();\n        \n        // 이벤트 발생\n        this.triggerEvent('onPerformanceUpdate', {\n            gameData,\n            performance: this.playerPerformance\n        });\n    }\n    \n    /**\n     * 성과 점수 계산\n     */\n    calculatePerformanceScore(gameData) {\n        const { success, score, timeElapsed, mistakes } = gameData;\n        const difficulty = this.difficultyLevels[this.currentDifficulty];\n        \n        let performanceScore = 0;\n        \n        // 성공 여부 (40%)\n        if (success) {\n            performanceScore += 0.4;\n        }\n        \n        // 점수 기반 성과 (30%)\n        const normalizedScore = Math.min(score / 1000, 1.0); // 1000점을 기준으로 정규화\n        performanceScore += normalizedScore * 0.3;\n        \n        // 시간 기반 성과 (20%)\n        const expectedTime = 60; // 예상 완료 시간 (초)\n        const timeScore = Math.max(0, (expectedTime - timeElapsed) / expectedTime);\n        performanceScore += timeScore * 0.2;\n        \n        // 실수 기반 감점 (10%)\n        const mistakeScore = Math.max(0, 1 - (mistakes || 0) / 10);\n        performanceScore += mistakeScore * 0.1;\n        \n        // 난이도 보정\n        performanceScore *= difficulty.multiplier;\n        \n        return Math.max(0, Math.min(1, performanceScore));\n    }\n    \n    /**\n     * 실력 지수 계산\n     */\n    calculateSkillLevel() {\n        if (this.playerPerformance.recentPerformance.length === 0) {\n            return;\n        }\n        \n        // 최근 성과의 평균\n        const recentAverage = this.playerPerformance.recentPerformance.reduce((sum, score) => sum + score, 0) / \n                             this.playerPerformance.recentPerformance.length;\n        \n        // 전체 성공률\n        const successRate = this.playerPerformance.totalGames > 0 ? \n                           this.playerPerformance.successfulGames / this.playerPerformance.totalGames : 0;\n        \n        // 실력 지수 계산 (최근 성과 70%, 전체 성공률 30%)\n        const newSkillLevel = recentAverage * 0.7 + successRate * 0.3;\n        \n        // 점진적 업데이트\n        const oldSkillLevel = this.playerPerformance.skillLevel;\n        this.playerPerformance.skillLevel = oldSkillLevel + \n            (newSkillLevel - oldSkillLevel) * this.playerPerformance.adaptationRate;\n        \n        // 실력 지수 변화 이벤트\n        if (Math.abs(newSkillLevel - oldSkillLevel) > 0.05) {\n            this.triggerEvent('onSkillLevelChange', {\n                oldLevel: oldSkillLevel,\n                newLevel: this.playerPerformance.skillLevel,\n                change: this.playerPerformance.skillLevel - oldSkillLevel\n            });\n        }\n    }\n    \n    /**\n     * 일관성 점수 계산\n     */\n    calculateConsistencyScore() {\n        if (this.playerPerformance.recentPerformance.length < 3) {\n            return;\n        }\n        \n        const performances = this.playerPerformance.recentPerformance;\n        const mean = performances.reduce((sum, score) => sum + score, 0) / performances.length;\n        \n        // 표준편차 계산\n        const variance = performances.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / performances.length;\n        const standardDeviation = Math.sqrt(variance);\n        \n        // 일관성 점수 (표준편차가 낮을수록 높은 점수)\n        this.playerPerformance.consistencyScore = Math.max(0, 1 - standardDeviation * 2);\n    }\n    \n    /**\n     * 향상률 계산\n     */\n    calculateImprovementRate() {\n        if (this.playerPerformance.recentPerformance.length < 5) {\n            return;\n        }\n        \n        const performances = this.playerPerformance.recentPerformance;\n        const halfPoint = Math.floor(performances.length / 2);\n        \n        const firstHalf = performances.slice(0, halfPoint);\n        const secondHalf = performances.slice(halfPoint);\n        \n        const firstAverage = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;\n        const secondAverage = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;\n        \n        this.playerPerformance.improvementRate = secondAverage - firstAverage;\n    }\n    \n    /**\n     * 난이도 조절 필요성 검토\n     */\n    shouldAdjustDifficulty() {\n        // 최소 게임 수 확인\n        if (this.playerPerformance.totalGames < this.analysisConfig.minGamesForAnalysis) {\n            return false;\n        }\n        \n        // 최근 성과 데이터 확인\n        if (this.playerPerformance.recentPerformance.length < 3) {\n            return false;\n        }\n        \n        // 안정화 기간 확인\n        const lastDifficultyChange = this.currentSession.difficultyChanges.slice(-1)[0];\n        if (lastDifficultyChange && \n            this.currentSession.attempts - lastDifficultyChange.attempt < this.analysisConfig.stabilityPeriod) {\n            return false;\n        }\n        \n        return true;\n    }\n    \n    /**\n     * 난이도 조절 평가\n     */\n    evaluateDifficultyAdjustment() {\n        if (!this.shouldAdjustDifficulty()) {\n            return;\n        }\n        \n        const skillLevel = this.playerPerformance.skillLevel;\n        const consistencyScore = this.playerPerformance.consistencyScore;\n        const improvementRate = this.playerPerformance.improvementRate;\n        \n        // 현재 난이도 인덱스\n        const difficultyKeys = Object.keys(this.difficultyLevels);\n        const currentIndex = difficultyKeys.indexOf(this.currentDifficulty);\n        \n        let targetIndex = currentIndex;\n        \n        // 실력 지수 기반 조절\n        if (skillLevel > 0.8 && consistencyScore > 0.7) {\n            // 실력이 높고 일관성이 좋으면 난이도 상승\n            targetIndex = Math.min(difficultyKeys.length - 1, currentIndex + 1);\n        } else if (skillLevel < 0.3 && consistencyScore < 0.4) {\n            // 실력이 낮고 일관성이 나쁘면 난이도 하락\n            targetIndex = Math.max(0, currentIndex - 1);\n        } else if (improvementRate > 0.2 && skillLevel > 0.6) {\n            // 빠른 향상을 보이면 난이도 상승\n            targetIndex = Math.min(difficultyKeys.length - 1, currentIndex + 1);\n        } else if (improvementRate < -0.2 && skillLevel < 0.4) {\n            // 실력이 하락하면 난이도 하락\n            targetIndex = Math.max(0, currentIndex - 1);\n        }\n        \n        // 최대 점프 제한\n        const maxJump = this.analysisConfig.maxDifficultyJump;\n        targetIndex = Math.max(currentIndex - maxJump, Math.min(currentIndex + maxJump, targetIndex));\n        \n        // 난이도 변경\n        if (targetIndex !== currentIndex) {\n            const newDifficulty = difficultyKeys[targetIndex];\n            this.changeDifficulty(newDifficulty, 'automatic');\n        }\n    }\n    \n    /**\n     * 난이도 조절\n     */\n    adjustDifficulty() {\n        this.evaluateDifficultyAdjustment();\n    }\n    \n    /**\n     * 난이도 변경\n     */\n    changeDifficulty(newDifficulty, reason = 'manual') {\n        if (!this.difficultyLevels[newDifficulty]) {\n            console.warn(`유효하지 않은 난이도: ${newDifficulty}`);\n            return false;\n        }\n        \n        const oldDifficulty = this.currentDifficulty;\n        this.currentDifficulty = newDifficulty;\n        \n        // 변경 기록\n        this.currentSession.difficultyChanges.push({\n            from: oldDifficulty,\n            to: newDifficulty,\n            reason: reason,\n            attempt: this.currentSession.attempts,\n            timestamp: Date.now(),\n            skillLevel: this.playerPerformance.skillLevel\n        });\n        \n        // 이벤트 발생\n        this.triggerEvent('onDifficultyChange', {\n            oldDifficulty,\n            newDifficulty,\n            reason,\n            difficultyData: this.difficultyLevels[newDifficulty]\n        });\n        \n        console.log(`🎯 난이도 변경: ${this.difficultyLevels[oldDifficulty].name} → ${this.difficultyLevels[newDifficulty].name} (${reason})`);\n        \n        return true;\n    }\n    \n    /**\n     * 현재 난이도 설정 가져오기\n     */\n    getCurrentDifficultySettings() {\n        return {\n            level: this.currentDifficulty,\n            settings: { ...this.difficultyLevels[this.currentDifficulty] }\n        };\n    }\n    \n    /**\n     * 케이크 타입별 난이도 조절\n     */\n    getCakeTypeMultiplier(cakeType) {\n        const cakeMultipliers = {\n            basic: 1.0,\n            chocolate: 1.1,\n            strawberry: 1.2,\n            wedding: 1.5,\n            birthday: 1.3\n        };\n        \n        const baseMultiplier = cakeMultipliers[cakeType] || 1.0;\n        const difficultyMultiplier = this.difficultyLevels[this.currentDifficulty].multiplier;\n        \n        return baseMultiplier * difficultyMultiplier;\n    }\n    \n    /**\n     * 환경 설정 가져오기\n     */\n    getEnvironmentSettings() {\n        const difficulty = this.difficultyLevels[this.currentDifficulty];\n        \n        return {\n            windStrength: difficulty.windStrength,\n            obstacleCount: difficulty.obstacleCount,\n            timeLimit: 60 * difficulty.timeBonus, // 기본 60초에 보너스 적용\n            cakeStability: difficulty.cakeStability\n        };\n    }\n    \n    /**\n     * 점수 계산 설정 가져오기\n     */\n    getScoreSettings() {\n        const difficulty = this.difficultyLevels[this.currentDifficulty];\n        \n        return {\n            scoreMultiplier: difficulty.scoreMultiplier,\n            timeBonus: difficulty.timeBonus,\n            difficultyBonus: difficulty.multiplier\n        };\n    }\n    \n    /**\n     * 플레이어 통계 가져오기\n     */\n    getPlayerStats() {\n        return {\n            totalGames: this.playerPerformance.totalGames,\n            successRate: this.playerPerformance.totalGames > 0 ? \n                        this.playerPerformance.successfulGames / this.playerPerformance.totalGames : 0,\n            averageScore: this.playerPerformance.averageScore,\n            averageTime: this.playerPerformance.averageTime,\n            skillLevel: this.playerPerformance.skillLevel,\n            consistencyScore: this.playerPerformance.consistencyScore,\n            improvementRate: this.playerPerformance.improvementRate,\n            currentDifficulty: this.currentDifficulty,\n            difficultyName: this.difficultyLevels[this.currentDifficulty].name\n        };\n    }\n    \n    /**\n     * 세션 통계 가져오기\n     */\n    getSessionStats() {\n        const sessionTime = Date.now() - this.currentSession.startTime;\n        \n        return {\n            sessionTime: sessionTime,\n            attempts: this.currentSession.attempts,\n            successes: this.currentSession.successes,\n            failures: this.currentSession.failures,\n            successRate: this.currentSession.attempts > 0 ? \n                        this.currentSession.successes / this.currentSession.attempts : 0,\n            averageScore: this.currentSession.scores.length > 0 ? \n                         this.currentSession.scores.reduce((sum, score) => sum + score, 0) / this.currentSession.scores.length : 0,\n            difficultyChanges: this.currentSession.difficultyChanges.length\n        };\n    }\n    \n    /**\n     * 난이도 수동 설정\n     */\n    setDifficulty(difficulty) {\n        return this.changeDifficulty(difficulty, 'manual');\n    }\n    \n    /**\n     * 자동 조절 활성화/비활성화\n     */\n    setAutoAdjustment(enabled) {\n        this.autoAdjustmentEnabled = enabled;\n        console.log(`🎯 자동 난이도 조절: ${enabled ? '활성화' : '비활성화'}`);\n    }\n    \n    /**\n     * 플레이어 데이터 리셋\n     */\n    resetPlayerData() {\n        this.playerPerformance = {\n            totalGames: 0,\n            successfulGames: 0,\n            averageScore: 0,\n            averageTime: 0,\n            recentPerformance: [],\n            skillLevel: 0.5,\n            adaptationRate: 0.1,\n            consistencyScore: 0.5,\n            improvementRate: 0.0\n        };\n        \n        this.currentDifficulty = 'normal';\n        this.savePlayerData();\n        \n        console.log('🔄 플레이어 데이터 리셋 완료');\n    }\n    \n    /**\n     * 이벤트 리스너 등록\n     */\n    addEventListener(eventType, callback) {\n        if (this.eventListeners[eventType] && typeof callback === 'function') {\n            this.eventListeners[eventType].push(callback);\n        }\n    }\n    \n    /**\n     * 이벤트 리스너 제거\n     */\n    removeEventListener(eventType, callback) {\n        if (this.eventListeners[eventType]) {\n            this.eventListeners[eventType] = this.eventListeners[eventType]\n                .filter(listener => listener !== callback);\n        }\n    }\n    \n    /**\n     * 이벤트 발생\n     */\n    triggerEvent(eventType, data) {\n        if (this.eventListeners[eventType]) {\n            this.eventListeners[eventType].forEach(callback => {\n                try {\n                    callback(data);\n                } catch (error) {\n                    console.error(`이벤트 리스너 실행 오류 (${eventType}):`, error);\n                }\n            });\n        }\n    }\n    \n    /**\n     * 시스템 정리\n     */\n    dispose() {\n        this.savePlayerData();\n        \n        this.eventListeners = {\n            onDifficultyChange: [],\n            onPerformanceUpdate: [],\n            onSkillLevelChange: []\n        };\n        \n        console.log('🧹 적응형 난이도 시스템 정리 완료');\n    }\n}