/**
 * Game Mode and Victory System Implementation
 * 게임 모드 및 승부 시스템 구현
 */

/**
 * GameModeManager Class - 게임 모드 관리 및 승부 시스템
 * 다양한 게임 모드와 승부 조건을 관리합니다
 */
class GameModeManager {
    constructor() {
        this.currentMode = null;
        this.modeConfig = null;
        this.tournamentState = null;
        
        // 게임 모드 정의
        this.gameModes = {
            quick: {
                name: '빠른 경주',
                description: '3랩 단일 경주',
                laps: 3,
                races: 1,
                winCondition: 'first_to_finish',
                timeLimit: null,
                pointSystem: null
            },
            'best-of-3': {
                name: '베스트 오브 3',
                description: '3경주 중 2승 먼저 달성',
                laps: 3,
                races: 3,
                winCondition: 'best_of_series',
                timeLimit: null,
                pointSystem: { win: 1, lose: 0 }
            },
            'time-attack': {
                name: '타임 어택',
                description: '제한 시간 내 최고 기록 도전',
                laps: 999,
                races: 1,
                winCondition: 'best_time',
                timeLimit: 300, // 5분
                pointSystem: null
            }
        };
        
        console.log('GameModeManager initialized');
    }
    
    /**
     * 게임 모드 선택
     * @param {string} modeId - 게임 모드 ID
     * @returns {boolean} 성공 여부
     */
    selectGameMode(modeId) {
        if (!this.gameModes[modeId]) {
            console.error('Unknown game mode:', modeId);
            return false;
        }
        
        this.currentMode = modeId;
        this.modeConfig = { ...this.gameModes[modeId] };
        this.initializeTournamentState();
        
        console.log('Game mode selected:', this.modeConfig.name);
        return true;
    }
    
    /**
     * 토너먼트 상태 초기화
     */
    initializeTournamentState() {
        this.tournamentState = {
            currentRace: 1,
            totalRaces: this.modeConfig.races,
            player1Wins: 0,
            player2Wins: 0,
            raceResults: [],
            startTime: null,
            endTime: null,
            isComplete: false,
            winner: null
        };
    }
    
    /**
     * 경주 시작
     * @param {Array} players - 플레이어 배열
     * @returns {Object} 경주 설정
     */
    startRace(players) {
        if (!this.currentMode) {
            throw new Error('No game mode selected');
        }
        
        if (!this.tournamentState.startTime) {
            this.tournamentState.startTime = Date.now();
        }
        
        // 플레이어 초기화
        players.forEach(player => {
            player.stats.gameMode = this.currentMode;
            player.stats.raceNumber = this.tournamentState.currentRace;
            player.stats.totalRaces = this.tournamentState.totalRaces;
        });
        
        console.log(`Starting race ${this.tournamentState.currentRace}/${this.tournamentState.totalRaces} in ${this.modeConfig.name} mode`);
        
        return {
            laps: this.modeConfig.laps,
            timeLimit: this.modeConfig.timeLimit,
            winCondition: this.modeConfig.winCondition
        };
    }
    
    /**
     * 경주 완료 처리
     * @param {Array} players - 플레이어 배열 (순위별 정렬)
     * @returns {Object} 경주 결과 및 토너먼트 상태
     */
    completeRace(players) {
        if (!this.currentMode || !this.tournamentState) {
            throw new Error('No active game mode or tournament state');
        }
        
        const raceResult = {
            raceNumber: this.tournamentState.currentRace,
            winner: players[0],
            results: players.map((player, index) => ({
                player: player,
                rank: index + 1,
                time: player.stats.totalRaceTime,
                lapTimes: [...player.stats.lapTimes]
            }))
        };
        
        this.tournamentState.raceResults.push(raceResult);
        
        // 승부 조건에 따른 처리
        switch (this.modeConfig.winCondition) {
            case 'first_to_finish':
                return this.handleQuickRaceComplete(raceResult);
                
            case 'best_of_series':
                return this.handleBestOfSeriesComplete(raceResult);
                
            case 'best_time':
                return this.handleTimeAttackComplete(raceResult);
                
            default:
                throw new Error('Unknown win condition: ' + this.modeConfig.winCondition);
        }
    }
    
    /**
     * 빠른 경주 완료 처리
     */
    handleQuickRaceComplete(raceResult) {
        this.tournamentState.isComplete = true;
        this.tournamentState.winner = raceResult.winner;
        this.tournamentState.endTime = Date.now();
        
        return {
            isComplete: true,
            winner: raceResult.winner,
            nextRace: false,
            results: raceResult.results
        };
    }
    
    /**
     * 베스트 오브 시리즈 완료 처리
     */
    handleBestOfSeriesComplete(raceResult) {
        // 승수 업데이트
        if (raceResult.winner.sensorId === 'sensor1') {
            this.tournamentState.player1Wins++;
        } else {
            this.tournamentState.player2Wins++;
        }
        
        const winsNeeded = Math.ceil(this.modeConfig.races / 2);
        const isComplete = this.tournamentState.player1Wins >= winsNeeded || 
                          this.tournamentState.player2Wins >= winsNeeded;
        
        if (isComplete) {
            this.tournamentState.isComplete = true;
            this.tournamentState.winner = this.tournamentState.player1Wins > this.tournamentState.player2Wins ? 
                                         raceResult.results.find(r => r.player.sensorId === 'sensor1').player :
                                         raceResult.results.find(r => r.player.sensorId === 'sensor2').player;
            this.tournamentState.endTime = Date.now();
        } else {
            this.tournamentState.currentRace++;
        }
        
        return {
            isComplete: isComplete,
            winner: this.tournamentState.winner,
            nextRace: !isComplete,
            results: raceResult.results,
            seriesScore: {
                player1: this.tournamentState.player1Wins,
                player2: this.tournamentState.player2Wins,
                winsNeeded: winsNeeded
            }
        };
    }
    
    /**
     * 타임 어택 완료 처리
     */
    handleTimeAttackComplete(raceResult) {
        // 타임 어택은 시간 제한이나 수동 종료로 완료
        this.tournamentState.isComplete = true;
        
        // 최고 기록 플레이어를 승자로 선정
        const bestPlayer = raceResult.results.reduce((best, current) => {
            const bestTime = best.player.stats.bestLap || Infinity;
            const currentTime = current.player.stats.bestLap || Infinity;
            return currentTime < bestTime ? current : best;
        });
        
        this.tournamentState.winner = bestPlayer.player;
        this.tournamentState.endTime = Date.now();
        
        return {
            isComplete: true,
            winner: bestPlayer.player,
            nextRace: false,
            results: raceResult.results,
            bestTimes: raceResult.results.map(r => ({
                player: r.player,
                bestLap: r.player.stats.bestLap
            }))
        };
    }
    
    /**
     * 현재 모드 정보 반환
     */
    getCurrentModeInfo() {
        if (!this.currentMode) return null;
        
        return {
            mode: this.currentMode,
            config: this.modeConfig,
            tournament: this.tournamentState
        };
    }
    
    /**
     * 토너먼트 진행 상황 반환
     */
    getTournamentProgress() {
        if (!this.tournamentState) return null;
        
        return {
            currentRace: this.tournamentState.currentRace,
            totalRaces: this.tournamentState.totalRaces,
            player1Wins: this.tournamentState.player1Wins,
            player2Wins: this.tournamentState.player2Wins,
            isComplete: this.tournamentState.isComplete,
            winner: this.tournamentState.winner
        };
    }
    
    /**
     * 게임 모드 리셋
     */
    reset() {
        this.currentMode = null;
        this.modeConfig = null;
        this.tournamentState = null;
        console.log('GameModeManager reset');
    }
    
    /**
     * 사용 가능한 게임 모드 목록 반환
     */
    getAvailableModes() {
        return Object.keys(this.gameModes).map(key => ({
            id: key,
            name: this.gameModes[key].name,
            description: this.gameModes[key].description
        }));
    }
}

/**
 * VictorySystem Class - 승리 조건 확인 및 결과 처리
 * 다양한 승리 조건을 확인하고 결과를 처리합니다
 */
class VictorySystem {
    constructor() {
        this.victoryConditions = new Map();
        this.achievements = new Map();
        this.statistics = new Map();
        
        this.initializeVictoryConditions();
        this.initializeAchievements();
        
        console.log('VictorySystem initialized');
    }
    
    /**
     * 승리 조건 초기화
     */
    initializeVictoryConditions() {
        this.victoryConditions.set('first_to_finish', {
            name: '먼저 결승선 통과',
            check: (players) => this.checkFirstToFinish(players)
        });
        
        this.victoryConditions.set('best_of_series', {
            name: '베스트 오브 시리즈',
            check: (players, seriesData) => this.checkBestOfSeries(players, seriesData)
        });
        
        this.victoryConditions.set('best_time', {
            name: '최고 기록',
            check: (players) => this.checkBestTime(players)
        });
        
        this.victoryConditions.set('time_limit', {
            name: '시간 제한',
            check: (players, timeData) => this.checkTimeLimit(players, timeData)
        });
    }
    
    /**
     * 업적 시스템 초기화
     */
    initializeAchievements() {
        this.achievements.set('speed_demon', {
            name: '스피드 데몬',
            description: '평균 속도 150km/h 이상으로 경주 완주',
            condition: (player) => player.stats.averageSpeed >= 150,
            unlocked: false
        });
        
        this.achievements.set('perfect_lap', {
            name: '퍼펙트 랩',
            description: '트랙을 벗어나지 않고 랩 완주',
            condition: (player) => player.stats.perfectLaps > 0,
            unlocked: false
        });
        
        this.achievements.set('comeback_king', {
            name: '컴백 킹',
            description: '2위에서 시작해서 1위로 역전승',
            condition: (player) => player.stats.comebackWins > 0,
            unlocked: false
        });
        
        this.achievements.set('consistency_master', {
            name: '일관성 마스터',
            description: '모든 랩 타임이 3초 이내 차이',
            condition: (player) => this.checkConsistency(player),
            unlocked: false
        });
    }
    
    /**
     * 먼저 결승선 통과 확인
     */
    checkFirstToFinish(players) {
        const finishedPlayers = players.filter(p => p.stats.finished);
        if (finishedPlayers.length === 0) return null;
        
        // 완주 시간 기준으로 정렬
        finishedPlayers.sort((a, b) => a.stats.finishTime - b.stats.finishTime);
        
        return {
            winner: finishedPlayers[0],
            results: finishedPlayers,
            victoryType: 'first_to_finish'
        };
    }
    
    /**
     * 베스트 오브 시리즈 확인
     */
    checkBestOfSeries(players, seriesData) {
        const { player1Wins, player2Wins, winsNeeded } = seriesData;
        
        if (player1Wins >= winsNeeded) {
            return {
                winner: players.find(p => p.sensorId === 'sensor1'),
                results: players,
                victoryType: 'best_of_series',
                seriesScore: { player1: player1Wins, player2: player2Wins }
            };
        }
        
        if (player2Wins >= winsNeeded) {
            return {
                winner: players.find(p => p.sensorId === 'sensor2'),
                results: players,
                victoryType: 'best_of_series',
                seriesScore: { player1: player1Wins, player2: player2Wins }
            };
        }
        
        return null;
    }
    
    /**
     * 최고 기록 확인
     */
    checkBestTime(players) {
        const playersWithTimes = players.filter(p => p.stats.bestLap && p.stats.bestLap !== Infinity);
        if (playersWithTimes.length === 0) return null;
        
        playersWithTimes.sort((a, b) => a.stats.bestLap - b.stats.bestLap);
        
        return {
            winner: playersWithTimes[0],
            results: playersWithTimes,
            victoryType: 'best_time',
            bestTime: playersWithTimes[0].stats.bestLap
        };
    }
    
    /**
     * 시간 제한 확인
     */
    checkTimeLimit(players, timeData) {
        const { timeLimit, elapsedTime } = timeData;
        
        if (elapsedTime >= timeLimit) {
            // 시간 종료 시 현재 순위로 결정
            const sortedPlayers = [...players].sort((a, b) => {
                // 완주한 플레이어가 우선
                if (a.stats.finished && !b.stats.finished) return -1;
                if (!a.stats.finished && b.stats.finished) return 1;
                
                // 둘 다 완주했으면 시간 비교
                if (a.stats.finished && b.stats.finished) {
                    return a.stats.finishTime - b.stats.finishTime;
                }
                
                // 둘 다 미완주면 진행도 비교
                return b.stats.currentLap - a.stats.currentLap;
            });
            
            return {
                winner: sortedPlayers[0],
                results: sortedPlayers,
                victoryType: 'time_limit',
                timeUp: true
            };
        }
        
        return null;
    }
    
    /**
     * 일관성 확인 (모든 랩 타임이 3초 이내 차이)
     */
    checkConsistency(player) {
        const lapTimes = player.stats.lapTimes;
        if (lapTimes.length < 2) return false;
        
        const minTime = Math.min(...lapTimes);
        const maxTime = Math.max(...lapTimes);
        
        return (maxTime - minTime) <= 3.0;
    }
    
    /**
     * 업적 확인 및 해제
     */
    checkAchievements(player) {
        const unlockedAchievements = [];
        
        for (const [key, achievement] of this.achievements) {
            if (!achievement.unlocked && achievement.condition(player)) {
                achievement.unlocked = true;
                unlockedAchievements.push({
                    id: key,
                    name: achievement.name,
                    description: achievement.description
                });
                console.log(`Achievement unlocked: ${achievement.name}`);
            }
        }
        
        return unlockedAchievements;
    }
    
    /**
     * 경주 결과 분석
     */
    analyzeRaceResults(players, raceData) {
        const analysis = {
            winner: null,
            statistics: {},
            achievements: [],
            highlights: []
        };
        
        // 승자 결정
        const finishedPlayers = players.filter(p => p.stats.finished);
        if (finishedPlayers.length > 0) {
            analysis.winner = finishedPlayers.sort((a, b) => a.stats.finishTime - b.stats.finishTime)[0];
        }
        
        // 통계 수집
        players.forEach(player => {
            analysis.statistics[player.sensorId] = {
                totalTime: player.stats.totalRaceTime,
                bestLap: player.stats.bestLap,
                averageSpeed: this.calculateAverageSpeed(player),
                consistency: this.calculateConsistency(player),
                offTrackTime: player.stats.offTrackTime || 0
            };
            
            // 업적 확인
            const newAchievements = this.checkAchievements(player);
            analysis.achievements.push(...newAchievements);
        });
        
        // 하이라이트 생성
        analysis.highlights = this.generateHighlights(players);
        
        return analysis;
    }
    
    /**
     * 평균 속도 계산
     */
    calculateAverageSpeed(player) {
        if (!player.stats.totalRaceTime || player.stats.totalRaceTime === 0) return 0;
        
        const totalDistance = player.stats.currentLap * 24000; // 가정: 랩당 24km
        return (totalDistance / player.stats.totalRaceTime) * 3.6; // m/s to km/h
    }
    
    /**
     * 일관성 점수 계산
     */
    calculateConsistency(player) {
        const lapTimes = player.stats.lapTimes;
        if (lapTimes.length < 2) return 100;
        
        const avgTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
        const variance = lapTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / lapTimes.length;
        const standardDeviation = Math.sqrt(variance);
        
        // 일관성 점수 (0-100, 높을수록 일관성 좋음)
        return Math.max(0, 100 - (standardDeviation * 10));
    }
    
    /**
     * 경주 하이라이트 생성
     */
    generateHighlights(players) {
        const highlights = [];
        
        // 최고 속도
        const fastestPlayer = players.reduce((fastest, current) => {
            return (current.stats.topSpeed || 0) > (fastest.stats.topSpeed || 0) ? current : fastest;
        });
        
        if (fastestPlayer.stats.topSpeed > 0) {
            highlights.push({
                type: 'fastest_speed',
                player: fastestPlayer,
                value: fastestPlayer.stats.topSpeed,
                description: `최고 속도: ${Math.round(fastestPlayer.stats.topSpeed)}km/h`
            });
        }
        
        // 최고 랩 타임
        const bestLapPlayer = players.reduce((best, current) => {
            const bestTime = best.stats.bestLap || Infinity;
            const currentTime = current.stats.bestLap || Infinity;
            return currentTime < bestTime ? current : best;
        });
        
        if (bestLapPlayer.stats.bestLap && bestLapPlayer.stats.bestLap !== Infinity) {
            highlights.push({
                type: 'best_lap',
                player: bestLapPlayer,
                value: bestLapPlayer.stats.bestLap,
                description: `최고 랩 타임: ${bestLapPlayer.stats.bestLap.toFixed(3)}초`
            });
        }
        
        return highlights;
    }
    
    /**
     * 승리 조건 확인
     */
    checkVictoryCondition(conditionType, players, additionalData = {}) {
        const condition = this.victoryConditions.get(conditionType);
        if (!condition) {
            throw new Error(`Unknown victory condition: ${conditionType}`);
        }
        
        return condition.check(players, additionalData);
    }
    
    /**
     * 통계 업데이트
     */
    updateStatistics(playerId, statType, value) {
        if (!this.statistics.has(playerId)) {
            this.statistics.set(playerId, {});
        }
        
        const playerStats = this.statistics.get(playerId);
        playerStats[statType] = value;
    }
    
    /**
     * 시스템 리셋
     */
    reset() {
        this.statistics.clear();
        // 업적은 유지 (영구적)
        console.log('VictorySystem reset');
    }
    
    /**
     * 업적 진행 상황 반환
     */
    getAchievementProgress() {
        const total = this.achievements.size;
        const unlocked = Array.from(this.achievements.values()).filter(a => a.unlocked).length;
        
        return {
            unlocked: unlocked,
            total: total,
            percentage: total > 0 ? (unlocked / total) * 100 : 0,
            achievements: Array.from(this.achievements.entries()).map(([key, achievement]) => ({
                id: key,
                name: achievement.name,
                description: achievement.description,
                unlocked: achievement.unlocked
            }))
        };
    }
}

// Export classes for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameModeManager, VictorySystem };
}