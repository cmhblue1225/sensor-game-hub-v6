// ===== WIDGETS/SCORE-PANEL-WIDGET =====
// 점수 패널 UI 위젯

import { GAME_CONFIG } from '../shared/config.js';
import { GameUtils } from '../shared/utils.js';

export class ScorePanelWidget {
    constructor(gameMode) {
        this.gameMode = gameMode;
        this.elements = this.getElements();
        this.updateInterval = null;
        this.lastUpdate = 0;
        
        this.setupModeSpecificUI();
    }

    // DOM 요소 가져오기
    getElements() {
        return {
            // 일반 점수 패널 (솔로/협동)
            normalScorePanel: document.getElementById('normalScorePanel'),
            scoreValue: document.getElementById('scoreValue'),
            hitsCount: document.getElementById('hitsCount'),
            missesCount: document.getElementById('missesCount'),
            comboCount: document.getElementById('comboCount'),
            accuracyValue: document.getElementById('accuracyValue'),
            timerValue: document.getElementById('timerValue'),
            
            // 경쟁 모드 점수 패널
            competitiveScorePanel: document.getElementById('competitiveScorePanel'),
            competitiveTimerValue: document.getElementById('competitiveTimerValue'),
            player1Score: document.getElementById('player1Score'),
            player2Score: document.getElementById('player2Score'),
            
            // 대규모 경쟁 모드 패널
            massCompetitivePanel: document.getElementById('massCompetitivePanel'),
            massCompetitiveTimerValue: document.getElementById('massCompetitiveTimerValue'),
            massPlayerCount: document.getElementById('massPlayerCount'),
            totalTargetsCreated: document.getElementById('totalTargetsCreated'),
            massLeaderboard: document.getElementById('massLeaderboard'),
            
            // 내 정보 패널 (대규모 경쟁 모드용)
            myMassInfoPanel: document.getElementById('myMassInfoPanel'),
            myMassScore: document.getElementById('myMassScore'),
            myMassRank: document.getElementById('myMassRank'),
            myMassHits: document.getElementById('myMassHits'),
            myMassCombo: document.getElementById('myMassCombo'),
            myMassAccuracy: document.getElementById('myMassAccuracy')
        };
    }

    // 모드별 UI 설정
    setupModeSpecificUI() {
        // 모든 패널 숨기기
        this.hideAllPanels();
        
        switch (this.gameMode) {
            case GAME_CONFIG.MODES.SOLO:
            case GAME_CONFIG.MODES.COOP:
                this.elements.normalScorePanel?.classList.remove('hidden');
                break;
                
            case GAME_CONFIG.MODES.COMPETITIVE:
                this.elements.competitiveScorePanel?.classList.remove('hidden');
                break;
                
            case GAME_CONFIG.MODES.MASS_COMPETITIVE:
                this.elements.massCompetitivePanel?.classList.remove('hidden');
                this.elements.myMassInfoPanel?.classList.remove('hidden');
                break;
        }
    }

    // 모든 패널 숨기기
    hideAllPanels() {
        this.elements.normalScorePanel?.classList.add('hidden');
        this.elements.competitiveScorePanel?.classList.add('hidden');
        this.elements.massCompetitivePanel?.classList.add('hidden');
        this.elements.myMassInfoPanel?.classList.add('hidden');
    }

    // 솔로/협동 모드 점수 업데이트
    updateNormalScore(scoreData) {
        if (!this.elements.scoreValue) return;
        
        this.elements.scoreValue.textContent = GameUtils.formatScore(scoreData.score || 0);
        this.elements.hitsCount.textContent = scoreData.hits || 0;
        this.elements.missesCount.textContent = scoreData.misses || 0;
        this.elements.comboCount.textContent = scoreData.combo || 0;
        this.elements.accuracyValue.textContent = `${scoreData.accuracy || 100}%`;
        
        // 콤보 강조 효과
        if (scoreData.combo > 5) {
            this.elements.comboCount.style.color = 'var(--warning)';
            this.elements.comboCount.style.fontWeight = 'bold';
        } else {
            this.elements.comboCount.style.color = 'var(--text-secondary)';
            this.elements.comboCount.style.fontWeight = 'normal';
        }
    }

    // 경쟁 모드 점수 업데이트
    updateCompetitiveScore(player1Data, player2Data) {
        if (!this.elements.player1Score) return;
        
        this.elements.player1Score.textContent = GameUtils.formatScore(player1Data.score || 0);
        this.elements.player2Score.textContent = GameUtils.formatScore(player2Data.score || 0);
        
        // 승부 상황에 따른 색상 변경
        const p1Score = player1Data.score || 0;
        const p2Score = player2Data.score || 0;
        
        if (p1Score > p2Score) {
            this.elements.player1Score.style.color = 'var(--success)';
            this.elements.player2Score.style.color = 'var(--text-secondary)';
        } else if (p2Score > p1Score) {
            this.elements.player1Score.style.color = 'var(--text-secondary)';
            this.elements.player2Score.style.color = 'var(--success)';
        } else {
            this.elements.player1Score.style.color = 'var(--warning)';
            this.elements.player2Score.style.color = 'var(--warning)';
        }
    }

    // 대규모 경쟁 모드 리더보드 업데이트
    updateMassCompetitiveLeaderboard(leaderboard, myPlayerId = null) {
        if (!this.elements.massLeaderboard) return;
        
        this.elements.massLeaderboard.innerHTML = '';
        
        leaderboard.slice(0, 8).forEach((player, index) => {
            const playerItem = this.createLeaderboardItem(player, index + 1, player.playerId === myPlayerId);
            this.elements.massLeaderboard.appendChild(playerItem);
        });
    }

    // 리더보드 아이템 생성
    createLeaderboardItem(player, rank, isMe = false) {
        const item = GameUtils.createElement('div', 'mass-player-item');
        
        if (isMe) {
            item.classList.add('me');
        }
        if (rank === 1) {
            item.classList.add('winner');
        }
        
        // 플레이어 정보
        const playerInfo = GameUtils.createElement('div', 'mass-player-info');
        
        // 순위
        const rankElement = GameUtils.createElement('div', 'mass-player-rank');
        rankElement.textContent = rank.toString();
        
        // 색상 표시
        const colorElement = GameUtils.createElement('div', 'mass-player-color');
        colorElement.style.backgroundColor = player.color || GAME_CONFIG.PLAYER_COLORS[0];
        
        // 이름
        const nameElement = GameUtils.createElement('div', 'mass-player-name');
        nameElement.textContent = player.playerName || `플레이어 ${rank}`;
        
        playerInfo.appendChild(rankElement);
        playerInfo.appendChild(colorElement);
        playerInfo.appendChild(nameElement);
        
        // 점수
        const scoreElement = GameUtils.createElement('div', 'mass-player-score');
        scoreElement.textContent = GameUtils.formatScore(player.score || 0);
        
        item.appendChild(playerInfo);
        item.appendChild(scoreElement);
        
        return item;
    }

    // 내 정보 업데이트 (대규모 경쟁 모드)
    updateMyMassInfo(playerData) {
        if (!this.elements.myMassScore) return;
        
        this.elements.myMassScore.textContent = GameUtils.formatScore(playerData.score || 0);
        this.elements.myMassRank.textContent = playerData.rank ? `${playerData.rank}위` : '-';
        this.elements.myMassHits.textContent = playerData.hits || 0;
        this.elements.myMassCombo.textContent = playerData.combo || 0;
        this.elements.myMassAccuracy.textContent = `${playerData.accuracy || 100}%`;
        
        // 순위에 따른 색상 변경
        if (playerData.rank === 1) {
            this.elements.myMassRank.style.color = 'var(--warning)'; // 금색
        } else if (playerData.rank <= 3) {
            this.elements.myMassRank.style.color = 'var(--success)'; // 초록색
        } else {
            this.elements.myMassRank.style.color = 'var(--text-secondary)';
        }
    }

    // 게임 통계 업데이트 (대규모 경쟁 모드)
    updateGameStats(stats) {
        if (this.elements.massPlayerCount) {
            this.elements.massPlayerCount.textContent = `${stats.activePlayers || 0}/${GAME_CONFIG.MASS_COMPETITIVE.maxPlayers}`;
        }
        
        if (this.elements.totalTargetsCreated) {
            this.elements.totalTargetsCreated.textContent = stats.totalTargetsCreated || 0;
        }
    }

    // 타이머 업데이트
    updateTimer(timeLeft) {
        const timeString = GameUtils.formatTime(timeLeft);
        
        // 모드별 타이머 요소 업데이트
        switch (this.gameMode) {
            case GAME_CONFIG.MODES.SOLO:
            case GAME_CONFIG.MODES.COOP:
                if (this.elements.timerValue) {
                    this.elements.timerValue.textContent = timeString;
                    this.applyTimerColor(this.elements.timerValue, timeLeft);
                }
                break;
                
            case GAME_CONFIG.MODES.COMPETITIVE:
                if (this.elements.competitiveTimerValue) {
                    this.elements.competitiveTimerValue.textContent = timeString;
                    this.applyTimerColor(this.elements.competitiveTimerValue, timeLeft);
                }
                break;
                
            case GAME_CONFIG.MODES.MASS_COMPETITIVE:
                if (this.elements.massCompetitiveTimerValue) {
                    this.elements.massCompetitiveTimerValue.textContent = timeString;
                    this.applyTimerColor(this.elements.massCompetitiveTimerValue, timeLeft);
                }
                break;
        }
    }

    // 타이머 색상 적용
    applyTimerColor(element, timeLeft) {
        if (timeLeft <= 30) {
            element.style.color = 'var(--error)';
            element.style.animation = 'pulse 1s infinite';
        } else if (timeLeft <= 60) {
            element.style.color = 'var(--warning)';
            element.style.animation = 'none';
        } else {
            element.style.color = 'var(--warning)';
            element.style.animation = 'none';
        }
    }

    // 점수 애니메이션 효과
    animateScoreChange(element, newValue, oldValue = 0) {
        if (!element) return;
        
        // 점수 증가 애니메이션
        if (newValue > oldValue) {
            element.style.transform = 'scale(1.2)';
            element.style.color = 'var(--success)';
            
            setTimeout(() => {
                element.style.transform = 'scale(1)';
                element.style.color = '';
            }, 200);
        }
        
        element.textContent = GameUtils.formatScore(newValue);
    }

    // 콤보 효과 표시
    showComboEffect(combo) {
        if (combo <= 1) return;
        
        // 콤보 텍스트 요소 찾기
        const comboElement = this.elements.comboCount;
        if (!comboElement) return;
        
        // 콤보 효과 애니메이션
        comboElement.style.transform = 'scale(1.5)';
        comboElement.style.color = combo > 10 ? 'var(--error)' : 'var(--warning)';
        comboElement.style.textShadow = '0 0 10px currentColor';
        
        setTimeout(() => {
            comboElement.style.transform = 'scale(1)';
            comboElement.style.textShadow = 'none';
        }, 300);
    }

    // 자동 업데이트 시작
    startAutoUpdate(updateCallback, interval = 100) {
        this.stopAutoUpdate();
        
        this.updateInterval = setInterval(() => {
            const now = Date.now();
            if (now - this.lastUpdate >= interval) {
                updateCallback();
                this.lastUpdate = now;
            }
        }, interval);
    }

    // 자동 업데이트 중지
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // 패널 표시/숨김
    show() {
        this.setupModeSpecificUI();
    }

    hide() {
        this.hideAllPanels();
    }

    // 게임 모드 변경
    changeGameMode(newMode) {
        this.gameMode = newMode;
        this.setupModeSpecificUI();
    }

    // 정리
    cleanup() {
        this.stopAutoUpdate();
        this.hideAllPanels();
    }
}

// CSS 애니메이션 추가
if (!document.getElementById('scorePanelWidgetStyles')) {
    const style = document.createElement('style');
    style.id = 'scorePanelWidgetStyles';
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .mass-player-item {
            transition: all 0.2s ease;
        }
        
        .mass-player-item:hover {
            background: rgba(59, 130, 246, 0.15) !important;
        }
        
        .mass-player-item.me {
            animation: highlight 2s ease-in-out infinite;
        }
        
        @keyframes highlight {
            0%, 100% { box-shadow: 0 0 0 rgba(16, 185, 129, 0.5); }
            50% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.8); }
        }
    `;
    document.head.appendChild(style);
}