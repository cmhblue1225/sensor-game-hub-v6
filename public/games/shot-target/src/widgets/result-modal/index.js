// Widgets Layer - 결과 모달 위젯
import { formatScore, calculateAccuracy } from '../../shared/lib/utils.js';

export class ResultModal {
    constructor() {
        this.modal = null;
    }

    // 대규모 경쟁 모드 결과 표시
    showMassCompetitiveResults(players, gameStats, myPlayerId) {
        const resultMessage = this._generateMassCompetitiveResults(players, gameStats, myPlayerId);
        this._createModal(resultMessage, '🏆 최종 순위');
    }

    // 경쟁 모드 결과 표시
    showCompetitiveResults(player1Score, player2Score) {
        let winner;
        if (player1Score > player2Score) {
            winner = '플레이어 1 승리!';
        } else if (player2Score > player1Score) {
            winner = '플레이어 2 승리!';
        } else {
            winner = '무승부!';
        }

        const resultMessage = `⚔️ 경쟁 게임 종료!\n${winner}\n\n` +
                             `플레이어 1: ${formatScore(player1Score)}점\n` +
                             `플레이어 2: ${formatScore(player2Score)}점`;

        this._showAlert(resultMessage);
    }

    // 일반 모드 결과 표시
    showNormalResults(gameState) {
        const resultMessage = `🎯 게임 종료!\n최종 점수: ${formatScore(gameState.score)}점\n` +
                             `적중: ${gameState.hits}발, 빗나감: ${gameState.misses}발\n` +
                             `정확도: ${calculateAccuracy(gameState.hits, gameState.misses)}%\n` +
                             `최대 콤보: ${gameState.maxCombo}`;

        this._showAlert(resultMessage);
    }

    // 대규모 경쟁 모드 결과 생성
    _generateMassCompetitiveResults(players, gameStats, myPlayerId) {
        const sortedPlayers = players
            .filter(player => player.isActive)
            .sort((a, b) => b.score - a.score);

        let resultMessage = `🏆 대규모 경쟁 게임 종료! (2분)\n`;
        resultMessage += `참가자: ${sortedPlayers.length}명\n\n`;

        // 상위 3명 특별 표시
        const medals = ['🥇', '🥈', '🥉'];
        
        sortedPlayers.forEach((player, index) => {
            const rank = index + 1;
            const medal = index < 3 ? medals[index] : `${rank}위`;
            const isMe = player.id === myPlayerId ? ' (나)' : '';
            
            resultMessage += `${medal} ${player.name}${isMe}\n`;
            resultMessage += `   점수: ${formatScore(player.score)}점\n`;
            resultMessage += `   적중: ${player.hits}발 (${player.accuracy}%)\n`;
            resultMessage += `   최대 콤보: ${player.maxCombo}\n\n`;
        });

        // 게임 통계
        const totalHits = sortedPlayers.reduce((sum, p) => sum + p.hits, 0);
        const avgAccuracy = sortedPlayers.reduce((sum, p) => sum + p.accuracy, 0) / sortedPlayers.length;

        resultMessage += `📊 게임 통계\n`;
        resultMessage += `생성된 표적: ${gameStats.totalTargetsCreated}개\n`;
        resultMessage += `총 명중: ${totalHits}발\n`;
        resultMessage += `평균 정확도: ${avgAccuracy.toFixed(1)}%`;

        return resultMessage;
    }

    // 모달 생성
    _createModal(resultMessage, title) {
        // 기존 모달 제거
        this.close();

        this.modal = document.createElement('div');
        this.modal.id = 'massCompetitiveResultModal';
        this.modal.className = 'mass-competitive-result-modal';
        this.modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                </div>
                <div class="modal-body">
                    <pre class="result-text">${resultMessage}</pre>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="window.game?.resetGame()">
                        🔄 다시 플레이
                    </button>
                    <a href="/" class="btn btn-secondary">🏠 허브로</a>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // 모달 표시 애니메이션
        setTimeout(() => {
            this.modal.classList.add('show');
        }, 100);

        // 모달 외부 클릭시 닫기
        this.modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.close();
        });
    }

    // 간단한 알림 표시
    _showAlert(message) {
        setTimeout(() => {
            alert(message);
        }, 1000);
    }

    // 모달 닫기
    close() {
        if (this.modal) {
            this.modal.classList.remove('show');
            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                }
                this.modal = null;
            }, 300);
        }
    }

    // 모달이 열려있는지 확인
    isOpen() {
        return this.modal !== null;
    }
}