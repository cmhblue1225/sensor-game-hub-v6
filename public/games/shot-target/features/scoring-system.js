// ===== FEATURES/SCORING-SYSTEM =====
// 점수 시스템 및 통계 관리

import { GAME_CONFIG } from '../shared/config.js';
import { GameUtils } from '../shared/utils.js';

export class ScoringSystem {
    constructor(gameMode) {
        this.gameMode = gameMode;
        
        // 게임 모드별 점수 관리
        this.scores = new Map(); // playerId -> 점수 정보
        this.globalStats = {
            totalTargetsHit: 0,
            totalTargetsCreated: 0,
            totalShots: 0,
            gameStartTime: null,
            gameEndTime: null
        };
        
        // 콤보 시스템
        this.comboTimeLimit = 3000; // 3초 내에 연속 적중해야 콤보 유지
        
        // 리더보드 (대규모 경쟁 모드용)
        this.leaderboard = [];
        this.leaderboardUpdateCallbacks = [];
    }

    // 플레이어 점수 초기화
    initializePlayer(playerId, playerName = null) {
        this.scores.set(playerId, {
            playerId,
            playerName: playerName || GameUtils.generatePlayerName(this.scores.size),
            score: 0,
            hits: 0,
            misses: 0,
            combo: 0,
            maxCombo: 0,
            lastHitTime: 0,
            accuracy: 100,
            rank: 0,
            isActive: true
        });
        
        this.updateLeaderboard();
        console.log(`📊 [점수 시스템] 플레이어 초기화: ${playerId}`);
    }

    // 점수 추가 (적중 시)
    addScore(playerId, points, targetType = 'medium') {
        if (!this.scores.has(playerId)) {
            this.initializePlayer(playerId);
        }
        
        const playerScore = this.scores.get(playerId);
        const now = Date.now();
        
        // 콤보 체크
        const isCombo = this.checkCombo(playerScore, now);
        let finalPoints = points;
        
        if (isCombo && playerScore.combo > 0) {
            // 콤보 보너스 적용
            finalPoints = Math.floor(points * GAME_CONFIG.GAMEPLAY.comboMultiplier);
            playerScore.combo++;
        } else {
            // 새로운 콤보 시작
            playerScore.combo = 1;
        }
        
        // 점수 업데이트
        playerScore.score += finalPoints;
        playerScore.hits++;
        playerScore.lastHitTime = now;
        playerScore.maxCombo = Math.max(playerScore.maxCombo, playerScore.combo);
        
        // 정확도 계산
        playerScore.accuracy = GameUtils.calculateAccuracy(playerScore.hits, playerScore.misses);
        
        // 전역 통계 업데이트
        this.globalStats.totalTargetsHit++;
        
        // 리더보드 업데이트
        this.updateLeaderboard();
        
        console.log(`🎯 [점수] ${playerId}: +${finalPoints}점 (콤보: ${playerScore.combo})`);
        
        return {
            points: finalPoints,
            isCombo: isCombo && playerScore.combo > 1,
            combo: playerScore.combo,
            totalScore: playerScore.score
        };
    }

    // 빗나감 처리
    addMiss(playerId) {
        if (!this.scores.has(playerId)) {
            this.initializePlayer(playerId);
        }
        
        const playerScore = this.scores.get(playerId);
        playerScore.misses++;
        playerScore.combo = 0; // 콤보 리셋
        
        // 정확도 재계산
        playerScore.accuracy = GameUtils.calculateAccuracy(playerScore.hits, playerScore.misses);
        
        // 전역 통계 업데이트
        this.globalStats.totalShots++;
        
        // 리더보드 업데이트
        this.updateLeaderboard();
        
        console.log(`❌ [점수] ${playerId}: 빗나감 (정확도: ${playerScore.accuracy}%)`);
    }

    // 콤보 체크
    checkCombo(playerScore, currentTime) {
        if (playerScore.lastHitTime === 0) return false;
        
        const timeSinceLastHit = currentTime - playerScore.lastHitTime;
        return timeSinceLastHit <= this.comboTimeLimit;
    }

    // 리더보드 업데이트
    updateLeaderboard() {
        // 점수 순으로 정렬
        this.leaderboard = Array.from(this.scores.values())
            .filter(player => player.isActive)
            .sort((a, b) => {
                // 1차: 점수
                if (b.score !== a.score) return b.score - a.score;
                // 2차: 정확도
                if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
                // 3차: 최대 콤보
                return b.maxCombo - a.maxCombo;
            });
        
        // 순위 할당
        this.leaderboard.forEach((player, index) => {
            player.rank = index + 1;
        });
        
        // 리더보드 업데이트 콜백 실행
        this.leaderboardUpdateCallbacks.forEach(callback => {
            try {
                callback(this.leaderboard);
            } catch (error) {
                console.error('리더보드 콜백 오류:', error);
            }
        });
    }

    // 특정 플레이어 점수 정보 반환
    getPlayerScore(playerId) {
        return this.scores.get(playerId) || null;
    }

    // 모든 플레이어 점수 반환
    getAllScores() {
        return Array.from(this.scores.values());
    }

    // 리더보드 반환
    getLeaderboard() {
        return [...this.leaderboard];
    }

    // 상위 N명 반환
    getTopPlayers(count = 3) {
        return this.leaderboard.slice(0, count);
    }

    // 게임 통계 반환
    getGameStats() {
        const totalPlayers = this.scores.size;
        const activePlayers = Array.from(this.scores.values()).filter(p => p.isActive).length;
        const totalScore = Array.from(this.scores.values()).reduce((sum, p) => sum + p.score, 0);
        const totalHits = Array.from(this.scores.values()).reduce((sum, p) => sum + p.hits, 0);
        const totalMisses = Array.from(this.scores.values()).reduce((sum, p) => sum + p.misses, 0);
        
        return {
            ...this.globalStats,
            totalPlayers,
            activePlayers,
            totalScore,
            totalHits,
            totalMisses,
            overallAccuracy: GameUtils.calculateAccuracy(totalHits, totalMisses),
            averageScore: totalPlayers > 0 ? Math.round(totalScore / totalPlayers) : 0
        };
    }

    // 경쟁 모드 결과 생성
    generateCompetitiveResults() {
        if (this.gameMode !== GAME_CONFIG.MODES.COMPETITIVE) return null;
        
        const players = this.getLeaderboard();
        if (players.length < 2) return null;
        
        const winner = players[0];
        const loser = players[1];
        
        return {
            winner: winner,
            loser: loser,
            scoreDifference: winner.score - loser.score,
            gameStats: this.getGameStats()
        };
    }

    // 대규모 경쟁 모드 결과 생성
    generateMassCompetitiveResults() {
        if (this.gameMode !== GAME_CONFIG.MODES.MASS_COMPETITIVE) return null;
        
        const leaderboard = this.getLeaderboard();
        const gameStats = this.getGameStats();
        
        let resultText = '🏆 최종 결과 🏆\n\n';
        
        leaderboard.forEach((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
            resultText += `${medal} ${index + 1}위: ${player.playerName}\n`;
            resultText += `    점수: ${GameUtils.formatScore(player.score)}점\n`;
            resultText += `    적중: ${player.hits}회 (정확도: ${player.accuracy}%)\n`;
            resultText += `    최대 콤보: ${player.maxCombo}회\n\n`;
        });
        
        resultText += '📊 게임 통계\n';
        resultText += `총 참가자: ${gameStats.activePlayers}명\n`;
        resultText += `총 표적 생성: ${gameStats.totalTargetsCreated}개\n`;
        resultText += `총 표적 적중: ${gameStats.totalTargetsHit}개\n`;
        resultText += `전체 정확도: ${gameStats.overallAccuracy}%\n`;
        
        if (gameStats.gameStartTime && gameStats.gameEndTime) {
            const gameTime = Math.round((gameStats.gameEndTime - gameStats.gameStartTime) / 1000);
            resultText += `게임 시간: ${GameUtils.formatTime(gameTime)}\n`;
        }
        
        return {
            leaderboard,
            resultText,
            gameStats,
            winner: leaderboard[0] || null
        };
    }

    // 플레이어 비활성화
    deactivatePlayer(playerId) {
        if (this.scores.has(playerId)) {
            this.scores.get(playerId).isActive = false;
            this.updateLeaderboard();
            console.log(`📊 [점수 시스템] 플레이어 비활성화: ${playerId}`);
        }
    }

    // 플레이어 재활성화
    reactivatePlayer(playerId) {
        if (this.scores.has(playerId)) {
            this.scores.get(playerId).isActive = true;
            this.updateLeaderboard();
            console.log(`📊 [점수 시스템] 플레이어 재활성화: ${playerId}`);
        }
    }

    // 게임 시작 시간 설정
    setGameStartTime() {
        this.globalStats.gameStartTime = Date.now();
    }

    // 게임 종료 시간 설정
    setGameEndTime() {
        this.globalStats.gameEndTime = Date.now();
    }

    // 표적 생성 카운트 증가
    incrementTargetsCreated(count = 1) {
        this.globalStats.totalTargetsCreated += count;
    }

    // 리더보드 업데이트 콜백 등록
    onLeaderboardUpdate(callback) {
        this.leaderboardUpdateCallbacks.push(callback);
    }

    // 점수 시스템 리셋
    reset() {
        this.scores.clear();
        this.leaderboard = [];
        this.globalStats = {
            totalTargetsHit: 0,
            totalTargetsCreated: 0,
            totalShots: 0,
            gameStartTime: null,
            gameEndTime: null
        };
        
        console.log('📊 [점수 시스템] 리셋 완료');
    }

    // 특정 플레이어 점수 리셋
    resetPlayer(playerId) {
        if (this.scores.has(playerId)) {
            const player = this.scores.get(playerId);
            player.score = 0;
            player.hits = 0;
            player.misses = 0;
            player.combo = 0;
            player.maxCombo = 0;
            player.lastHitTime = 0;
            player.accuracy = 100;
            
            this.updateLeaderboard();
            console.log(`📊 [점수 시스템] ${playerId} 점수 리셋`);
        }
    }

    // 정리 (메모리 누수 방지)
    cleanup() {
        this.reset();
        this.leaderboardUpdateCallbacks = [];
        console.log('📊 [점수 시스템] 정리 완료');
    }
}