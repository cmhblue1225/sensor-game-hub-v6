// Widgets Layer - 리더보드 위젯
import { formatScore } from '../../shared/lib/utils.js';

export class Leaderboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.players = [];
        this.myPlayerId = null;
    }

    // 플레이어 데이터 업데이트
    updatePlayers(players, myPlayerId = null) {
        this.players = players.sort((a, b) => b.score - a.score);
        this.myPlayerId = myPlayerId;
        this.render();
    }

    // 리더보드 렌더링
    render() {
        if (!this.container) return;

        this.container.innerHTML = '';

        this.players.forEach((player, index) => {
            const rank = index + 1;
            const isMe = player.id === this.myPlayerId;
            const isWinner = rank === 1 && this.players.length > 1;

            const playerElement = document.createElement('div');
            playerElement.className = 'mass-player-item';
            
            if (isMe) {
                playerElement.classList.add('me');
            }
            if (isWinner) {
                playerElement.classList.add('winner');
            }

            playerElement.innerHTML = `
                <div class="mass-player-info">
                    <div class="mass-player-rank">${this._getRankDisplay(rank)}</div>
                    <div class="mass-player-color player-color-${(player.colorIndex || 0) + 1}" 
                         style="background-color: ${player.color}"></div>
                    <div class="mass-player-name">${player.name}${isMe ? ' (나)' : ''}</div>
                </div>
                <div class="mass-player-score">${formatScore(player.score)}</div>
            `;

            this.container.appendChild(playerElement);
        });
    }

    // 순위 표시 형식
    _getRankDisplay(rank) {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `${rank}위`;
        }
    }

    // 특정 플레이어 강조
    highlightPlayer(playerId) {
        const playerElements = this.container.querySelectorAll('.mass-player-item');
        playerElements.forEach((element, index) => {
            if (this.players[index]?.id === playerId) {
                element.classList.add('highlighted');
                setTimeout(() => {
                    element.classList.remove('highlighted');
                }, 2000);
            }
        });
    }

    // 순위 변동 애니메이션
    animateRankChange(playerId, oldRank, newRank) {
        // 순위 변동 애니메이션 로직
        console.log(`🏆 ${playerId} 순위 변동: ${oldRank}위 → ${newRank}위`);
        this.highlightPlayer(playerId);
    }

    // 리더보드 클리어
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.players = [];
        this.myPlayerId = null;
    }
}