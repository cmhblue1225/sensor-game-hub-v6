export class GameUIWidget {
    constructor() {
        this.elements = {
            score: document.getElementById('scoreValue'),
            combo: document.getElementById('comboValue'),
            accuracy: document.getElementById('accuracyValue'),
            gameStats: document.getElementById('gameStats'),
            cooperationMeter: document.getElementById('cooperationMeter'),
            controlPanel: document.getElementById('controlPanel'),
            gameInstructions: document.getElementById('gameInstructions')
        };
    }

    showGameUI() {
        if (this.elements.gameStats) this.elements.gameStats.classList.remove('hidden');
        if (this.elements.cooperationMeter) this.elements.cooperationMeter.classList.remove('hidden');
        if (this.elements.controlPanel) this.elements.controlPanel.classList.remove('hidden');
        if (this.elements.gameInstructions) this.elements.gameInstructions.classList.remove('hidden');
    }

    hideGameUI() {
        if (this.elements.gameStats) this.elements.gameStats.classList.add('hidden');
        if (this.elements.cooperationMeter) this.elements.cooperationMeter.classList.add('hidden');
        if (this.elements.controlPanel) this.elements.controlPanel.classList.add('hidden');
        if (this.elements.gameInstructions) this.elements.gameInstructions.classList.add('hidden');
    }

    updateScore(score) {
        if (this.elements.score) {
            this.elements.score.textContent = score;
        }
    }

    updateCombo(combo) {
        if (this.elements.combo) {
            this.elements.combo.textContent = combo;
        }
    }

    updateAccuracy(accuracy) {
        if (this.elements.accuracy) {
            this.elements.accuracy.textContent = `${accuracy}%`;
        }
    }

    showEndingCountdown(seconds) {
        if (this.elements.score && seconds > 0) {
            this.elements.score.textContent = `종료 ${seconds}초 전...`;
        }
    }

    updateUI(gameState) {
        this.updateScore(gameState.score);
        this.updateCombo(gameState.combo);
        
        const accuracy = gameState.totalNotes > 0 ? 
            Math.round((gameState.hitNotes / gameState.totalNotes) * 100) : 100;
        this.updateAccuracy(accuracy);
    }

    showGameOver(finalStats) {
        // 게임 종료 UI 표시
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'game-over-panel';
        gameOverDiv.innerHTML = `
            <div class="game-over-content">
                <h2>🎉 게임 종료!</h2>
                <div class="final-stats">
                    <p><strong>최종 점수:</strong> ${finalStats.score}</p>
                    <p><strong>정확도:</strong> ${finalStats.accuracy}%</p>
                    <p><strong>최대 콤보:</strong> ${finalStats.maxCombo}</p>
                    <p><strong>히트율:</strong> ${finalStats.hitNotes}/${finalStats.totalNotes}</p>
                    <p><strong>플레이 시간:</strong> ${Math.floor(finalStats.playTime / 60)}:${(Math.floor(finalStats.playTime) % 60).toString().padStart(2, '0')}</p>
                </div>
                <button onclick="location.reload()" class="btn btn-primary">다시 하기</button>
            </div>
        `;
        
        gameOverDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        document.body.appendChild(gameOverDiv);
    }

    updateCooperationMeter(sync) {
        const fillElement = document.getElementById('cooperationFill');
        if (fillElement) {
            fillElement.style.width = `${sync}%`;
            
            // 색상 변화로 협력 상태 표시
            if (sync >= 80) {
                fillElement.style.background = 'linear-gradient(45deg, #10b981, #34d399)';
            } else if (sync >= 50) {
                fillElement.style.background = 'linear-gradient(45deg, #f59e0b, #fbbf24)';
            } else {
                fillElement.style.background = 'linear-gradient(45deg, #ef4444, #f87171)';
            }
        }
    }
}