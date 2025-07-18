// Widgets Layer - 게임 UI 관리
import { formatTime, formatScore, calculateAccuracy } from '../../shared/lib/utils.js';

export class GameUI {
    constructor() {
        this.elements = this._initializeElements();
        this.currentMode = null;
    }

    // DOM 요소 초기화
    _initializeElements() {
        return {
            // 점수 관련
            scoreValue: document.getElementById('scoreValue'),
            hitsCount: document.getElementById('hitsCount'),
            missesCount: document.getElementById('missesCount'),
            comboCount: document.getElementById('comboCount'),
            accuracyValue: document.getElementById('accuracyValue'),
            
            // 상태 관련
            serverStatus: document.getElementById('serverStatus'),
            sensorStatus: document.getElementById('sensorStatus'),
            sensor1Status: document.getElementById('sensor1Status'),
            sensor2Status: document.getElementById('sensor2Status'),
            gameStatusText: document.getElementById('gameStatusText'),
            
            // 세션 관련
            sessionPanel: document.getElementById('sessionPanel'),
            sessionTitle: document.getElementById('sessionTitle'),
            sessionInstructions: document.getElementById('sessionInstructions'),
            sessionCode: document.getElementById('sessionCode'),
            qrContainer: document.getElementById('qrContainer'),
            
            // 게임 정보
            gameInfoPanel: document.getElementById('gameInfoPanel'),
            crosshair: document.getElementById('crosshair'),
            
            // 타이머
            timerValue: document.getElementById('timerValue'),
            
            // 모드 선택
            modeSelectionPanel: document.getElementById('modeSelectionPanel'),
            soloModeBtn: document.getElementById('soloModeBtn'),
            coopModeBtn: document.getElementById('coopModeBtn'),
            competitiveModeBtn: document.getElementById('competitiveModeBtn'),
            massCompetitiveModeBtn: document.getElementById('massCompetitiveModeBtn'),
            
            // 패널들
            soloSensorStatus: document.getElementById('soloSensorStatus'),
            dualSensorStatus: document.getElementById('dualSensorStatus'),
            dualSensorStatus2: document.getElementById('dualSensorStatus2'),
            normalScorePanel: document.getElementById('normalScorePanel'),
            competitiveScorePanel: document.getElementById('competitiveScorePanel'),
            
            // 경쟁 모드
            competitiveTimerValue: document.getElementById('competitiveTimerValue'),
            player1Score: document.getElementById('player1Score'),
            player2Score: document.getElementById('player2Score'),
            scoreDetails: document.getElementById('scoreDetails'),
            
            // 대규모 경쟁 모드
            massCompetitivePanel: document.getElementById('massCompetitivePanel'),
            massCompetitiveTimerValue: document.getElementById('massCompetitiveTimerValue'),
            massPlayerCount: document.getElementById('massPlayerCount'),
            totalTargetsCreated: document.getElementById('totalTargetsCreated'),
            massLeaderboard: document.getElementById('massLeaderboard'),
            massWaitingPanel: document.getElementById('massWaitingPanel'),
            massSessionCode: document.getElementById('massSessionCode'),
            massQrContainer: document.getElementById('massQrContainer'),
            massWaitingList: document.getElementById('massWaitingList'),
            massWaitingPlayers: document.getElementById('massWaitingPlayers'),
            massStartBtn: document.getElementById('massStartBtn'),
            
            // 컨트롤
            controlPanel: document.querySelector('.control-panel'),
            pauseBtn: document.getElementById('pauseBtn')
        };
    }

    // 모드별 UI 설정
    setupModeUI(mode, config) {
        this.currentMode = mode;
        
        // 모드 선택 패널 숨기기
        this.elements.modeSelectionPanel.classList.add('hidden');
        
        // 세션 제목 및 설명 설정
        if (this.elements.sessionTitle) {
            this.elements.sessionTitle.textContent = config.sessionTitle;
        }
        if (this.elements.sessionInstructions) {
            this.elements.sessionInstructions.innerHTML = config.sessionInstructions;
        }
        
        // 컨트롤 패널 위치 조정
        if (mode === 'mass-competitive') {
            this.elements.controlPanel?.classList.add('mass-competitive-mode');
        } else {
            this.elements.controlPanel?.classList.remove('mass-competitive-mode');
        }
        
        // 센서 상태 표시 설정
        this._setupSensorStatusDisplay(config.showDualSensors);
        
        // 점수 패널 설정
        this._setupScorePanels(config);
        
        // 세션 패널 표시
        if (mode === 'mass-competitive') {
            this.elements.massWaitingPanel?.classList.remove('hidden');
        } else {
            this.elements.sessionPanel?.classList.remove('hidden');
        }
    }

    // 센서 상태 표시 설정
    _setupSensorStatusDisplay(showDual) {
        if (showDual) {
            this.elements.soloSensorStatus?.classList.add('hidden');
            this.elements.dualSensorStatus?.classList.remove('hidden');
            this.elements.dualSensorStatus2?.classList.remove('hidden');
        } else {
            this.elements.soloSensorStatus?.classList.remove('hidden');
            this.elements.dualSensorStatus?.classList.add('hidden');
            this.elements.dualSensorStatus2?.classList.add('hidden');
        }
    }

    // 점수 패널 설정
    _setupScorePanels(config) {
        // 일반 점수 패널
        if (config.showNormalScore) {
            this.elements.normalScorePanel?.classList.remove('hidden');
        } else {
            this.elements.normalScorePanel?.classList.add('hidden');
        }
        
        // 경쟁 점수 패널
        if (config.showCompetitiveScore) {
            this.elements.competitiveScorePanel?.classList.remove('hidden');
        } else {
            this.elements.competitiveScorePanel?.classList.add('hidden');
        }
    }

    // 점수 업데이트
    updateScore(gameState) {
        if (this.elements.scoreValue) {
            this.elements.scoreValue.textContent = formatScore(gameState.score);
        }
        
        if (this.elements.hitsCount) {
            this.elements.hitsCount.textContent = gameState.hits;
        }
        
        if (this.elements.missesCount) {
            this.elements.missesCount.textContent = gameState.misses;
        }
        
        if (this.elements.comboCount) {
            this.elements.comboCount.textContent = gameState.comboCount;
        }
        
        if (this.elements.accuracyValue) {
            this.elements.accuracyValue.textContent = calculateAccuracy(gameState.hits, gameState.misses) + '%';
        }
    }

    // 경쟁 모드 점수 업데이트
    updateCompetitiveScore(gameState) {
        if (this.elements.player1Score) {
            this.elements.player1Score.textContent = formatScore(gameState.player1Score);
        }
        
        if (this.elements.player2Score) {
            this.elements.player2Score.textContent = formatScore(gameState.player2Score);
        }
    }

    // 타이머 업데이트
    updateTimer(timeLeft) {
        const timeString = formatTime(timeLeft);
        
        if (this.elements.timerValue) {
            this.elements.timerValue.textContent = timeString;
            
            // 시간이 30초 이하일 때 빨간색으로 표시
            if (timeLeft <= 30) {
                this.elements.timerValue.style.color = 'var(--error)';
            } else {
                this.elements.timerValue.style.color = 'var(--warning)';
            }
        }
        
        // 경쟁 모드 타이머
        if (this.elements.competitiveTimerValue) {
            this.elements.competitiveTimerValue.textContent = timeString;
        }
        
        // 대규모 경쟁 모드 타이머
        if (this.elements.massCompetitiveTimerValue) {
            this.elements.massCompetitiveTimerValue.textContent = timeString;
        }
    }

    // 서버 상태 업데이트
    updateServerStatus(connected) {
        if (this.elements.serverStatus) {
            if (connected) {
                this.elements.serverStatus.classList.add('connected');
            } else {
                this.elements.serverStatus.classList.remove('connected');
            }
        }
    }

    // 센서 상태 업데이트
    updateSensorStatus(connected, sensorId = null) {
        let statusElement;
        
        if (sensorId === 'sensor1') {
            statusElement = this.elements.sensor1Status;
        } else if (sensorId === 'sensor2') {
            statusElement = this.elements.sensor2Status;
        } else {
            statusElement = this.elements.sensorStatus;
        }
        
        if (statusElement) {
            if (connected) {
                statusElement.classList.add('connected');
            } else {
                statusElement.classList.remove('connected');
            }
        }
    }

    // 게임 상태 텍스트 업데이트
    updateGameStatus(status) {
        if (this.elements.gameStatusText) {
            this.elements.gameStatusText.textContent = status;
        }
    }

    // 세션 정보 표시
    displaySessionInfo(sessionCode, qrContainer) {
        if (this.elements.sessionCode) {
            this.elements.sessionCode.textContent = sessionCode || '----';
        }
    }

    // 세션 패널 숨기기
    hideSessionPanel() {
        this.elements.sessionPanel?.classList.add('hidden');
        this.elements.gameInfoPanel?.classList.remove('hidden');
        this.elements.crosshair?.classList.remove('hidden');
    }

    // 조준점 위치 업데이트
    updateCrosshairPosition(x, y) {
        if (this.elements.crosshair) {
            this.elements.crosshair.style.left = x + 'px';
            this.elements.crosshair.style.top = y + 'px';
        }
    }

    // 대규모 경쟁 모드 플레이어 수 업데이트
    updateMassPlayerCount(count) {
        if (this.elements.massPlayerCount) {
            this.elements.massPlayerCount.textContent = `${count}/8`;
        }
    }

    // 대규모 경쟁 모드 표적 생성 수 업데이트
    updateTotalTargetsCreated(count) {
        if (this.elements.totalTargetsCreated) {
            this.elements.totalTargetsCreated.textContent = count;
        }
    }

    // 대규모 경쟁 모드 대기실 숨기기
    hideMassWaitingPanel() {
        this.elements.massWaitingPanel?.classList.add('hidden');
        this.elements.massCompetitivePanel?.classList.remove('hidden');
        this.elements.gameInfoPanel?.classList.add('hidden');
        this.elements.crosshair?.classList.remove('hidden');
    }

    // 일시정지 버튼 텍스트 업데이트
    updatePauseButton(paused) {
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.textContent = paused ? '▶️ 계속' : '⏸️ 일시정지';
        }
    }

    // 모든 패널 숨기기
    hideAllPanels() {
        const panels = [
            'sessionPanel', 'modeSelectionPanel', 'massWaitingPanel',
            'normalScorePanel', 'competitiveScorePanel', 'massCompetitivePanel'
        ];
        
        panels.forEach(panelName => {
            this.elements[panelName]?.classList.add('hidden');
        });
    }

    // 모드 선택 패널 표시
    showModeSelection() {
        this.hideAllPanels();
        this.elements.modeSelectionPanel?.classList.remove('hidden');
    }
}