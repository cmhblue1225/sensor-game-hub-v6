export class ScorePanelWidget {
    constructor(elements) {
        this.elements = elements;
    }

    updateScore(scoringSystem, gameMode) {
        if (gameMode === 'competitive') {
            // 경쟁 모드: 플레이어별 점수 표시
            this.elements.player1Score.textContent = scoringSystem.state.player1Score.toLocaleString();
            this.elements.player2Score.textContent = scoringSystem.state.player2Score.toLocaleString();
            this.elements.competitiveTimerValue.textContent = this.elements.timerValue.textContent;

        } else if (gameMode === 'mass-competitive') {
            // 대규모 경쟁 모드: 타이머만 업데이트 (리더보드는 별도 처리)
            this.elements.massCompetitiveTimerValue.textContent = this.elements.timerValue.textContent;

        } else {
            // 싱글/협동 모드: 공통 점수 표시
            this.elements.scoreValue.textContent = scoringSystem.state.score.toLocaleString();
            this.elements.hitsCount.textContent = scoringSystem.state.hits;
            this.elements.missesCount.textContent = scoringSystem.state.misses;
            this.elements.comboCount.textContent = scoringSystem.state.comboCount;
            this.elements.accuracyValue.textContent = scoringSystem.getAccuracy() + '%';
        }
    }

    updateTimerDisplay(timeLeft) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        this.elements.timerValue.textContent = timeString;

        // 시간이 30초 이하일 때 빨간색으로 표시
        if (timeLeft <= 30) {
            this.elements.timerValue.style.color = 'var(--error)';
        } else {
            this.elements.timerValue.style.color = 'var(--warning)';
        }
    }

    updateMassLeaderboard(massPlayers, myPlayerId = null) {
        const sortedPlayers = Array.from(massPlayers.values())
            .sort((a, b) => b.score - a.score);

        const leaderboard = this.elements.massLeaderboard;
        leaderboard.innerHTML = '';

        sortedPlayers.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = 'mass-player-item';
            playerElement.innerHTML = `
                <div class="mass-player-info">
                    <span class="mass-player-rank">${index + 1}</span>
                    <div class="mass-player-color" style="background-color: ${player.color};"></div>
                    <span class="mass-player-name">${player.name}</span>
                </div>
                <span class="mass-player-score">${player.score.toLocaleString()}</span>
            `;
            leaderboard.appendChild(playerElement);
        });
    }

    generateMassCompetitiveResults(massPlayers, myPlayerId = null, totalTargetsCreated) {
        const sortedPlayers = Array.from(massPlayers.values())
            .filter(player => player.isActive)
            .sort((a, b) => b.score - a.score);

        let resultMessage = `🏆 대규모 경쟁 게임 종료! (2분)\n`;
        resultMessage += `참가자: ${sortedPlayers.length}명\n\n`;

        const medals = ['🥇', '🥈', '🥉'];

        sortedPlayers.forEach((player, index) => {
            const rank = index + 1;
            const medal = index < 3 ? medals[index] : `${rank}위`;

            resultMessage += `${medal} ${player.name}\n`;
            resultMessage += `   점수: ${player.score.toLocaleString()}점\n`;
            resultMessage += `   적중: ${player.hits}발 (${player.accuracy}%)\n`;
            resultMessage += `   최대 콤보: ${player.maxCombo}\n\n`;
        });

        const totalHits = sortedPlayers.reduce((sum, p) => sum + p.hits, 0);
        const avgAccuracy = sortedPlayers.reduce((sum, p) => sum + p.accuracy, 0) / sortedPlayers.length;

        resultMessage += `📊 게임 통계\n`;
        resultMessage += `생성된 표적: ${totalTargetsCreated}개\n`;
        resultMessage += `총 명중: ${totalHits}발\n`;
        resultMessage += `평균 정확도: ${avgAccuracy.toFixed(1)}%`;

        return resultMessage;
    }

    showMassCompetitiveResultsModal(resultMessage) {
        const existingModal = document.getElementById('massCompetitiveResultModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'massCompetitiveResultModal';
        modal.className = 'mass-competitive-result-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🏆 최종 순위</h2>
                </div>
                <div class="modal-body">
                    <pre class="result-text">${resultMessage}</pre>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="game.closeMassCompetitiveResultModal()">
                        🔄 다시 플레이
                    </button>
                    <a href="/" class="btn btn-secondary">🏠 허브로</a>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
    }

    closeMassCompetitiveResultModal() {
        const modal = document.getElementById('massCompetitiveResultModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
}