/**
 * 🎮 드론 레이싱 게임 UI 관리 클래스
 * 
 * 플레이어 HUD, 게임 상태 표시, 결과 화면 등을 관리
 */

class GameUI {
    constructor(game) {
        this.game = game;
        
        // UI 요소들
        this.elements = {
            sessionPanel: document.getElementById('sessionPanel'),
            gameHUD: document.getElementById('gameHUD'),
            player1HUD: document.getElementById('player1HUD'),
            player2HUD: document.getElementById('player2HUD'),
            countdown: document.getElementById('countdown'),
            controlPanel: document.getElementById('controlPanel'),
            resultsPanel: document.getElementById('resultsPanel'),
            resultsContent: document.getElementById('resultsContent'),
            reconnectPanel: document.getElementById('reconnectPanel'),
            reconnectMessage: document.getElementById('reconnectMessage')
        };
        
        // 화면 분할 표시기 추가
        this.addSplitIndicator();
        
        console.log('🎮 UI 시스템 초기화 완료');
    }
    
    /**
     * 화면 분할 표시기 추가
     */
    addSplitIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'split-indicator';
        document.body.appendChild(indicator);
    }
    
    /**
     * 플레이어 HUD 업데이트
     */
    updatePlayerHUD(playerId, droneData) {
        const hudElement = this.elements[`${playerId}HUD`];
        if (!hudElement) return;
        
        const hud = hudElement.querySelector('.hud-panel');
        if (!hud) return;
        
        // 드론의 레이스 진행 상황 가져오기
        const raceProgress = droneData.raceProgress || {
            lapCount: 0,
            currentLapTime: 0,
            rank: 1
        };
        
        // 속도 업데이트
        const speedElement = hud.querySelector('.speed');
        if (speedElement) {
            speedElement.textContent = `속도: ${Math.round(droneData.speed || 0)} km/h`;
        }
        
        // 랩 수 업데이트
        const lapElement = hud.querySelector('.lap');
        if (lapElement) {
            lapElement.textContent = `랩: ${raceProgress.lapCount}/3`;
            
            // 마지막 랩에서는 강조 표시
            if (raceProgress.lapCount >= 2) {
                lapElement.style.color = '#ffff00';
                lapElement.style.fontWeight = 'bold';
                lapElement.style.textShadow = '0 0 10px #ffff00';
            } else {
                lapElement.style.color = '';
                lapElement.style.fontWeight = '';
                lapElement.style.textShadow = '';
            }
        }
        
        // 시간 업데이트 (현재 랩 시간)
        const timeElement = hud.querySelector('.time');
        if (timeElement) {
            const currentTime = raceProgress.currentLapTime || 0;
            timeElement.textContent = `시간: ${currentTime.toFixed(2)}s`;
        }
        
        // 순위 업데이트
        const rankElement = hud.querySelector('.rank');
        if (rankElement) {
            const rank = raceProgress.rank || 1;
            rankElement.textContent = `순위: ${rank}`;
            
            // 순위에 따른 색상 변경
            if (rank === 1) {
                rankElement.style.color = '#ffff00';
                rankElement.style.fontWeight = 'bold';
            } else {
                rankElement.style.color = '';
                rankElement.style.fontWeight = '';
            }
        }
        
        // 부스터 에너지 업데이트
        this.updateBoosterBar(playerId, droneData.booster || { energy: 100 });
    }
    
    /**
     * 부스터 바 업데이트
     */
    updateBoosterBar(playerId, boosterData) {
        const hudElement = this.elements[`${playerId}HUD`];
        if (!hudElement) return;
        
        const boosterFill = hudElement.querySelector('.booster-fill');
        const boosterPercent = hudElement.querySelector('.booster-percent');
        const boosterBar = hudElement.querySelector('.booster-bar');
        const boosterStatus = hudElement.querySelector('.booster-status');
        
        if (boosterFill) {
            const energy = Math.max(0, Math.min(100, boosterData.energy || 0));
            boosterFill.style.width = `${energy}%`;
            
            // 부스터 활성화 시 효과
            if (boosterData.isActive) {
                boosterFill.style.boxShadow = '0 0 20px var(--neon-yellow), inset 0 0 15px rgba(255, 255, 255, 0.5)';
                boosterFill.style.animation = 'boosterPulse 0.3s ease-in-out infinite alternate';
                boosterFill.style.background = 'linear-gradient(90deg, #ffff00, #ffffff, #ffff00)';
                boosterBar.style.transform = 'scale(1.05)';
                
                // 부스터 활성화 상태 표시
                if (boosterStatus) {
                    boosterStatus.textContent = '🚀 BOOST!';
                    boosterStatus.style.color = 'var(--neon-yellow)';
                    boosterStatus.style.textShadow = '0 0 10px var(--neon-yellow)';
                }
            } else {
                boosterFill.style.boxShadow = '0 0 8px var(--neon-blue)';
                boosterFill.style.animation = 'none';
                boosterFill.style.background = 'linear-gradient(90deg, var(--neon-blue), var(--neon-cyan))';
                boosterBar.style.transform = 'scale(1)';
                
                // 일반 상태 표시
                if (boosterStatus) {
                    boosterStatus.textContent = '';
                }
            }
            
            // 쿨다운 중일 때 효과
            if (boosterData.cooldown > 0) {
                boosterBar.style.opacity = '0.6';
                boosterFill.style.filter = 'grayscale(70%) brightness(0.7)';
                
                // 쿨다운 상태 표시
                if (boosterStatus) {
                    const cooldownSeconds = Math.ceil(boosterData.cooldown / 1000);
                    boosterStatus.textContent = `⏳ ${cooldownSeconds}s`;
                    boosterStatus.style.color = 'var(--warning)';
                    boosterStatus.style.textShadow = 'none';
                }
            } else {
                boosterBar.style.opacity = '1';
                boosterFill.style.filter = 'none';
            }
            
            // 에너지 부족 시 경고 효과
            if (energy < 20 && !boosterData.isActive && boosterData.cooldown <= 0) {
                boosterFill.style.background = 'linear-gradient(90deg, var(--error), #ff6666)';
                boosterFill.style.boxShadow = '0 0 10px var(--error)';
                
                if (energy < 10) {
                    boosterBar.style.animation = 'shake 0.5s ease-in-out infinite';
                    
                    // 에너지 부족 경고
                    if (boosterStatus) {
                        boosterStatus.textContent = '⚠️ LOW';
                        boosterStatus.style.color = 'var(--error)';
                        boosterStatus.style.textShadow = '0 0 5px var(--error)';
                    }
                }
            } else if (energy >= 20 && !boosterData.isActive && boosterData.cooldown <= 0) {
                boosterBar.style.animation = 'none';
                
                // 부스터 준비 완료
                if (boosterStatus && energy >= 80) {
                    boosterStatus.textContent = '✨ READY';
                    boosterStatus.style.color = 'var(--success)';
                    boosterStatus.style.textShadow = '0 0 5px var(--success)';
                }
            }
        }
        
        if (boosterPercent) {
            const energy = Math.round(boosterData.energy || 0);
            boosterPercent.textContent = `${energy}%`;
            
            // 상태에 따른 색상 변경
            if (boosterData.isActive) {
                boosterPercent.style.color = 'var(--neon-yellow)';
                boosterPercent.style.fontWeight = 'bold';
            } else if (boosterData.cooldown > 0) {
                boosterPercent.style.color = 'var(--warning)';
                boosterPercent.style.fontWeight = 'normal';
            } else if (energy < 20) {
                boosterPercent.style.color = 'var(--error)';
                boosterPercent.style.fontWeight = 'normal';
            } else {
                boosterPercent.style.color = 'var(--text-secondary)';
                boosterPercent.style.fontWeight = 'normal';
            }
        }
    }
    
    /**
     * 카운트다운 표시
     */
    showCountdown(count) {
        const countdownElement = this.elements.countdown;
        if (!countdownElement) return;
        
        countdownElement.textContent = count > 0 ? count : 'GO!';
        countdownElement.classList.remove('hidden');
        
        // GO! 표시 후 숨김
        if (count === 0) {
            setTimeout(() => {
                countdownElement.classList.add('hidden');
            }, 1000);
        }
    }
    
    /**
     * 게임 결과 표시
     */
    showResults(resultsData) {
        const { 
            winner, 
            winnerName, 
            player1Data, 
            player2Data, 
            raceTime, 
            raceDate,
            raceStatistics 
        } = resultsData;
        
        let resultsHTML = `
            <div class="winner-announcement">
                🏆 ${winnerName || (winner === 'player1' ? '플레이어 1' : '플레이어 2')} 승리!
            </div>
            
            <div class="race-overview">
                <div class="race-info">
                    <div class="race-stat">
                        <span class="stat-label">총 경주 시간</span>
                        <span class="stat-value">${this.formatTime(raceTime)}</span>
                    </div>
                    <div class="race-stat">
                        <span class="stat-label">경주 일시</span>
                        <span class="stat-value">${raceDate || new Date().toLocaleString('ko-KR')}</span>
                    </div>
                    ${raceStatistics ? `
                        <div class="race-stat">
                            <span class="stat-label">최고 랩 타임</span>
                            <span class="stat-value">${raceStatistics.fastestLap !== Infinity ? raceStatistics.fastestLap.toFixed(2) + 's' : 'N/A'}</span>
                        </div>
                        <div class="race-stat">
                            <span class="stat-label">경쟁 치열함</span>
                            <span class="stat-value">${Math.round(raceStatistics.competitiveness || 0)}%</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="player-results">
                <div class="player-result ${winner === 'player1' ? 'winner' : ''}">
                    <div class="player-header">
                        <h3>🏎️ 플레이어 1</h3>
                        ${winner === 'player1' ? '<div class="winner-badge">🏆 승자</div>' : ''}
                    </div>
                    <div class="player-stats">
                        <div class="stat-row">
                            <span>완주 시간:</span>
                            <span>${player1Data.finishTime ? this.formatTime(player1Data.finishTime) : 'DNF'}</span>
                        </div>
                        <div class="stat-row">
                            <span>완주 랩:</span>
                            <span>${player1Data.lapCount}/3</span>
                        </div>
                        <div class="stat-row">
                            <span>최고 속도:</span>
                            <span>${Math.round(player1Data.maxSpeed || 0)} km/h</span>
                        </div>
                        <div class="stat-row">
                            <span>최고 랩:</span>
                            <span>${player1Data.bestLap ? player1Data.bestLap.toFixed(2) + 's' : 'N/A'}</span>
                        </div>
                        ${player1Data.statistics ? `
                            <div class="stat-row">
                                <span>평균 속도:</span>
                                <span>${Math.round(player1Data.statistics.averageSpeed || 0)} km/h</span>
                            </div>
                            <div class="stat-row">
                                <span>일관성:</span>
                                <span>${player1Data.statistics.consistency || 0}%</span>
                            </div>
                            <div class="stat-row">
                                <span>충돌 횟수:</span>
                                <span>${player1Data.statistics.collisions || 0}회</span>
                            </div>
                            <div class="stat-row">
                                <span>부스터 사용:</span>
                                <span>${player1Data.statistics.boosterUsage || 0}회</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="player-result ${winner === 'player2' ? 'winner' : ''}">
                    <div class="player-header">
                        <h3>🏎️ 플레이어 2</h3>
                        ${winner === 'player2' ? '<div class="winner-badge">🏆 승자</div>' : ''}
                    </div>
                    <div class="player-stats">
                        <div class="stat-row">
                            <span>완주 시간:</span>
                            <span>${player2Data.finishTime ? this.formatTime(player2Data.finishTime) : 'DNF'}</span>
                        </div>
                        <div class="stat-row">
                            <span>완주 랩:</span>
                            <span>${player2Data.lapCount}/3</span>
                        </div>
                        <div class="stat-row">
                            <span>최고 속도:</span>
                            <span>${Math.round(player2Data.maxSpeed || 0)} km/h</span>
                        </div>
                        <div class="stat-row">
                            <span>최고 랩:</span>
                            <span>${player2Data.bestLap ? player2Data.bestLap.toFixed(2) + 's' : 'N/A'}</span>
                        </div>
                        ${player2Data.statistics ? `
                            <div class="stat-row">
                                <span>평균 속도:</span>
                                <span>${Math.round(player2Data.statistics.averageSpeed || 0)} km/h</span>
                            </div>
                            <div class="stat-row">
                                <span>일관성:</span>
                                <span>${player2Data.statistics.consistency || 0}%</span>
                            </div>
                            <div class="stat-row">
                                <span>충돌 횟수:</span>
                                <span>${player2Data.statistics.collisions || 0}회</span>
                            </div>
                            <div class="stat-row">
                                <span>부스터 사용:</span>
                                <span>${player2Data.statistics.boosterUsage || 0}회</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="results-actions">
                <button class="btn btn-primary" onclick="window.droneRacingGame.restartGame()">
                    🔄 다시 경주
                </button>
                <button class="btn btn-secondary" onclick="window.location.href='/'">
                    🏠 허브로 돌아가기
                </button>
            </div>
        `;
        
        this.elements.resultsContent.innerHTML = resultsHTML;
        this.elements.resultsPanel.classList.remove('hidden');
        
        // 게임 HUD 숨김
        this.elements.gameHUD.classList.add('hidden');
        
        // 결과 화면 애니메이션
        this.animateResultsScreen();
    }
    
    /**
     * 결과 화면 애니메이션
     */
    animateResultsScreen() {
        const resultsPanel = this.elements.resultsPanel;
        if (!resultsPanel) return;
        
        // 페이드인 애니메이션
        resultsPanel.style.opacity = '0';
        resultsPanel.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            resultsPanel.style.transition = 'all 0.5s ease-out';
            resultsPanel.style.opacity = '1';
            resultsPanel.style.transform = 'scale(1)';
        }, 100);
        
        // 승자 발표 애니메이션
        const winnerAnnouncement = resultsPanel.querySelector('.winner-announcement');
        if (winnerAnnouncement) {
            setTimeout(() => {
                winnerAnnouncement.style.animation = 'winnerPulse 2s ease-in-out infinite';
            }, 500);
        }
        
        // 통계 항목들 순차 애니메이션
        const statRows = resultsPanel.querySelectorAll('.stat-row');
        statRows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                row.style.transition = 'all 0.3s ease-out';
                row.style.opacity = '1';
                row.style.transform = 'translateX(0)';
            }, 800 + index * 100);
        });
    }
    
    /**
     * 시간 포맷팅 개선 (밀리초를 시:분:초.밀리초 형식으로)
     */
    formatTime(milliseconds) {
        if (!milliseconds || milliseconds <= 0) return '0:00.00';
        
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10);
        
        if (minutes > 0) {
            return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
        } else {
            return `${seconds}.${ms.toString().padStart(2, '0')}s`;
        }
    }
    
    /**
     * 랩 카운터 업데이트
     */
    updateLapCounter(playerId, lapCount) {
        const hudElement = this.elements[`${playerId}HUD`];
        if (!hudElement) return;
        
        const lapElement = hudElement.querySelector('.lap');
        if (lapElement) {
            lapElement.textContent = `랩: ${lapCount}/3`;
            
            // 마지막 랩에서는 강조 표시
            if (lapCount >= 2) {
                lapElement.style.color = '#ffff00';
                lapElement.style.fontWeight = 'bold';
                lapElement.style.textShadow = '0 0 10px #ffff00';
            }
        }
    }
    
    /**
     * 재연결 메시지 표시
     */
    showReconnectionMessage(sensorId) {
        const playerName = sensorId === 'player1' ? '플레이어 1' : '플레이어 2';
        this.elements.reconnectMessage.textContent = 
            `${playerName} 센서 연결이 끊어졌습니다. 재연결을 기다리는 중...`;
        this.elements.reconnectPanel.classList.remove('hidden');
    }
    
    /**
     * 재연결 메시지 숨김
     */
    hideReconnectionMessage() {
        this.elements.reconnectPanel.classList.add('hidden');
    }
    
    /**
     * 토스트 메시지 표시
     */
    showToast(message, type = 'info', duration = 3000) {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 새 토스트 생성
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // 스타일 적용
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: type === 'error' ? 'var(--error)' : 
                       type === 'success' ? 'var(--success)' : 
                       type === 'warning' ? 'var(--warning)' : 'var(--primary)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: '1000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            animation: 'slideInDown 0.3s ease-out'
        });
        
        document.body.appendChild(toast);
        
        // 자동 제거
        setTimeout(() => {
            toast.style.animation = 'slideOutUp 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    }
    
    /**
     * 로딩 스피너 표시
     */
    showLoading(message = '로딩 중...') {
        const loading = document.createElement('div');
        loading.id = 'loadingSpinner';
        loading.innerHTML = `
            <div class="loading-backdrop">
                <div class="loading-content">
                    <div class="spinner"></div>
                    <div class="loading-text">${message}</div>
                </div>
            </div>
        `;
        
        // 스타일 적용
        const style = document.createElement('style');
        style.textContent = `
            .loading-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
            .loading-content {
                text-align: center;
                color: var(--text-primary);
            }
            .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(59, 130, 246, 0.3);
                border-top: 3px solid var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
            }
            .loading-text {
                font-size: 16px;
                font-weight: 500;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(loading);
    }
    
    /**
     * 로딩 스피너 숨김
     */
    hideLoading() {
        const loading = document.getElementById('loadingSpinner');
        if (loading) {
            loading.remove();
        }
    }
    
    /**
     * 게임 상태에 따른 UI 전환
     */
    updateGameState(state) {
        // 모든 패널 숨김
        Object.values(this.elements).forEach(element => {
            if (element && element.classList) {
                element.classList.add('hidden');
            }
        });
        
        // 상태에 따른 UI 표시
        switch (state) {
            case 'waiting':
                this.elements.sessionPanel?.classList.remove('hidden');
                break;
                
            case 'racing':
                this.elements.gameHUD?.classList.remove('hidden');
                this.elements.controlPanel?.classList.remove('hidden');
                break;
                
            case 'finished':
                this.elements.resultsPanel?.classList.remove('hidden');
                break;
                
            case 'paused':
                this.elements.gameHUD?.classList.remove('hidden');
                this.elements.controlPanel?.classList.remove('hidden');
                this.showToast('게임이 일시정지되었습니다', 'warning');
                break;
        }
    }
    
    /**
     * 디버그 정보 표시
     */
    showDebugInfo(debugData) {
        let debugElement = document.getElementById('debugInfo');
        
        if (!debugElement) {
            debugElement = document.createElement('div');
            debugElement.id = 'debugInfo';
            debugElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: #00ff00;
                font-family: monospace;
                font-size: 12px;
                padding: 10px;
                border-radius: 4px;
                z-index: 1000;
                max-width: 300px;
            `;
            document.body.appendChild(debugElement);
        }
        
        debugElement.innerHTML = `
            <div>FPS: ${debugData.fps || 0}</div>
            <div>Game State: ${debugData.gameState || 'unknown'}</div>
            <div>Connected Sensors: ${debugData.connectedSensors || 0}</div>
            <div>Test Mode: ${debugData.testMode ? 'ON' : 'OFF'}</div>
            ${debugData.player1 ? `<div>P1 Speed: ${Math.round(debugData.player1.speed || 0)}</div>` : ''}
            ${debugData.player2 ? `<div>P2 Speed: ${Math.round(debugData.player2.speed || 0)}</div>` : ''}
        `;
    }
    
    /**
     * 디버그 정보 숨김
     */
    hideDebugInfo() {
        const debugElement = document.getElementById('debugInfo');
        if (debugElement) {
            debugElement.remove();
        }
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
    
    .winner-announcement {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
        color: var(--neon-yellow);
        text-shadow: 0 0 10px var(--neon-yellow);
    }
    
    .race-stats {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 0.5rem;
    }
    
    .player-results {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    
    .player-result {
        padding: 1rem;
        background: rgba(30, 41, 59, 0.5);
        border-radius: 0.5rem;
        border: 1px solid var(--border);
    }
    
    .player-result h3 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .player-result div {
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }
    
    /* 부스터 시스템 애니메이션 */
    @keyframes boosterPulse {
        0% { 
            opacity: 0.8; 
            transform: scaleY(1);
        }
        100% { 
            opacity: 1; 
            transform: scaleY(1.1);
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
    }
    
    .booster-bar {
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    
    .booster-fill {
        transition: width 0.2s ease, background 0.3s ease, box-shadow 0.3s ease;
        height: 100%;
        border-radius: inherit;
        position: relative;
    }
    
    .booster-status {
        font-size: 0.8rem;
        font-weight: bold;
        text-align: center;
        margin-top: 0.25rem;
        min-height: 1rem;
        transition: all 0.3s ease;
    }
    
    /* 부스터 충전 구역 애니메이션 */
    @keyframes boosterZonePulse {
        0% { 
            opacity: 0.3;
            transform: scale(1);
        }
        50% { 
            opacity: 0.8;
            transform: scale(1.05);
        }
        100% { 
            opacity: 0.3;
            transform: scale(1);
        }
    }
    
    /* 화면 분할 표시기 */
    .split-indicator {
        position: fixed;
        top: 0;
        left: 50%;
        width: 2px;
        height: 100%;
        background: linear-gradient(
            to bottom,
            transparent 0%,
            var(--neon-blue) 20%,
            var(--neon-cyan) 50%,
            var(--neon-blue) 80%,
            transparent 100%
        );
        z-index: 10;
        pointer-events: none;
        opacity: 0.6;
        animation: splitGlow 2s ease-in-out infinite alternate;
    }
    
    @keyframes splitGlow {
        0% { 
            opacity: 0.4;
            box-shadow: 0 0 5px var(--neon-blue);
        }
        100% { 
            opacity: 0.8;
            box-shadow: 0 0 15px var(--neon-cyan);
        }
    }
`;

document.head.appendChild(style);

// 결과 화면 추가 CSS 스타일
const resultsStyle = document.createElement('style');
resultsStyle.textContent = `
    /* 결과 화면 스타일 */
    .race-overview {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
        border-radius: 1rem;
        border: 1px solid rgba(59, 130, 246, 0.3);
    }
    
    .race-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }
    
    .race-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    
    .stat-label {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
    }
    
    .stat-value {
        font-size: 1.2rem;
        font-weight: bold;
        color: var(--neon-cyan);
        text-shadow: 0 0 5px var(--neon-cyan);
    }
    
    .player-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .winner-badge {
        background: linear-gradient(45deg, #ffff00, #ffa500);
        color: #000;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.8rem;
        font-weight: bold;
        animation: winnerGlow 2s ease-in-out infinite alternate;
    }
    
    .player-result.winner {
        border: 2px solid #ffff00;
        box-shadow: 0 0 20px rgba(255, 255, 0, 0.3);
        background: linear-gradient(135deg, rgba(255, 255, 0, 0.1), rgba(30, 41, 59, 0.5));
    }
    
    .player-stats {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 0.5rem;
        transition: all 0.3s ease;
    }
    
    .stat-row:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateX(5px);
    }
    
    .stat-row span:first-child {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    
    .stat-row span:last-child {
        color: var(--text-primary);
        font-weight: bold;
    }
    
    .results-actions {
        margin-top: 2rem;
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .results-actions .btn {
        padding: 1rem 2rem;
        font-size: 1.1rem;
        border-radius: 0.75rem;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .results-actions .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }
    
    .btn-primary {
        background: linear-gradient(45deg, var(--neon-cyan), var(--neon-blue));
        color: #000;
        border: none;
        font-weight: bold;
    }
    
    .btn-primary:hover {
        background: linear-gradient(45deg, #00ffff, #0088ff);
        box-shadow: 0 8px 25px rgba(0, 255, 255, 0.4);
    }
    
    .btn-secondary {
        background: linear-gradient(45deg, #666, #888);
        color: #fff;
        border: none;
    }
    
    .btn-secondary:hover {
        background: linear-gradient(45deg, #777, #999);
        box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
    }
    
    /* 승자 애니메이션 */
    @keyframes winnerPulse {
        0% { 
            transform: scale(1);
            text-shadow: 0 0 10px var(--neon-yellow);
        }
        50% { 
            transform: scale(1.05);
            text-shadow: 0 0 20px var(--neon-yellow), 0 0 30px var(--neon-yellow);
        }
        100% { 
            transform: scale(1);
            text-shadow: 0 0 10px var(--neon-yellow);
        }
    }
    
    @keyframes winnerGlow {
        0% { 
            box-shadow: 0 0 5px rgba(255, 255, 0, 0.5);
        }
        100% { 
            box-shadow: 0 0 15px rgba(255, 255, 0, 0.8), 0 0 25px rgba(255, 165, 0, 0.6);
        }
    }
    
    /* 반응형 디자인 */
    @media (max-width: 768px) {
        .race-info {
            grid-template-columns: 1fr;
        }
        
        .player-results {
            grid-template-columns: 1fr;
        }
        
        .results-actions {
            flex-direction: column;
            align-items: center;
        }
        
        .results-actions .btn {
            width: 100%;
            max-width: 300px;
        }
        
        .stat-row {
            flex-direction: column;
            text-align: center;
            gap: 0.25rem;
        }
        
        .player-header {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
        }
    }
`;

document.head.appendChild(resultsStyle);