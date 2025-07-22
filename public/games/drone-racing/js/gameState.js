/**
 * 🎮 드론 레이싱 게임 상태 관리 클래스
 * 
 * 게임의 모든 상태를 중앙에서 관리하고 추적
 */

class GameStateManager {
    constructor(game) {
        this.game = game;
        
        // 게임 상태 정의
        this.states = {
            WAITING: 'waiting',
            COUNTDOWN: 'countdown',
            RACING: 'racing',
            PAUSED: 'paused',
            FINISHED: 'finished',
            DISCONNECTED: 'disconnected'
        };
        
        // 현재 상태
        this.currentState = this.states.WAITING;
        this.previousState = null;
        
        // 상태 변경 이벤트 리스너들
        this.stateListeners = new Map();
        
        // 플레이어 상태 추적
        this.playerStates = {
            player1: this.createPlayerState('player1'),
            player2: this.createPlayerState('player2')
        };
        
        // 게임 세션 정보
        this.sessionInfo = {
            sessionCode: null,
            connectedSensors: 0,
            maxSensors: 2,
            gameStartTime: null,
            raceStartTime: null,
            raceEndTime: null
        };
        
        // 카운트다운 상태
        this.countdownState = {
            isActive: false,
            currentCount: 3,
            startTime: null
        };
        
        console.log('🎮 게임 상태 관리자 초기화 완료');
    }
    
    /**
     * 플레이어 상태 객체 생성
     */
    createPlayerState(playerId) {
        return {
            id: playerId,
            isConnected: false,
            isReady: false,
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            speed: 0,
            maxSpeed: 0,
            lapCount: 0,
            currentCheckpoint: -1,
            lapTimes: [],
            bestLapTime: null,
            totalTime: 0,
            rank: 1,
            booster: {
                energy: 100,
                isActive: false,
                cooldown: 0,
                lastUsed: 0
            },
            penalties: {
                speedReduction: 1.0,
                controlDisruption: false,
                penaltyEndTime: 0
            },
            statistics: {
                collisions: 0,
                boosterUsage: 0,
                trackExits: 0,
                checkpointsPassed: 0
            }
        };
    }
    
    /**
     * 게임 상태 변경
     */
    setState(newState, data = {}) {
        if (newState === this.currentState) return;
        
        // 무한 루프 방지 검사
        if (this.preventStateLoop) {
            console.log(`⚠️ 상태 변경 차단됨 (무한 루프 방지): ${this.currentState} → ${newState}`);
            return;
        }
        
        const oldState = this.currentState;
        this.previousState = oldState;
        this.currentState = newState;
        
        console.log(`🎮 게임 상태 변경: ${oldState} → ${newState}`);
        
        // 상태 진입 처리
        this.onStateEnter(newState, data);
        
        // 상태 종료 처리
        this.onStateExit(oldState);
        
        // 상태 변경 이벤트 발생
        this.notifyStateChange(oldState, newState, data);
        
        // UI 업데이트
        if (this.game.ui) {
            this.game.ui.updateGameState(newState);
        }
    }
    
    /**
     * 상태 진입 처리
     */
    onStateEnter(state, data) {
        switch (state) {
            case this.states.WAITING:
                this.handleWaitingState();
                break;
                
            case this.states.COUNTDOWN:
                this.handleCountdownState(data);
                break;
                
            case this.states.RACING:
                this.handleRacingState();
                break;
                
            case this.states.PAUSED:
                this.handlePausedState(data);
                break;
                
            case this.states.FINISHED:
                this.handleFinishedState(data);
                break;
                
            case this.states.DISCONNECTED:
                this.handleDisconnectedState(data);
                break;
        }
    }
    
    /**
     * 상태 종료 처리
     */
    onStateExit(state) {
        switch (state) {
            case this.states.COUNTDOWN:
                this.countdownState.isActive = false;
                break;
                
            case this.states.PAUSED:
                // 일시정지 해제 시 처리
                break;
        }
    }
    
    /**
     * 대기 상태 처리
     */
    handleWaitingState() {
        // 게임 초기화
        this.resetGameState();
        
        // 플레이어 상태 초기화
        Object.values(this.playerStates).forEach(player => {
            Object.assign(player, this.createPlayerState(player.id));
        });
    }
    
    /**
     * 카운트다운 상태 처리
     */
    handleCountdownState(data = {}) {
        console.log('⏰ 카운트다운 상태 처리 시작');
        
        // 카운트다운 상태 초기화 (isActive는 startCountdown에서 설정)
        this.countdownState = {
            isActive: false,  // startCountdown에서 true로 설정됨
            currentCount: data.startCount || 3,
            startTime: Date.now()
        };
        
        console.log('⏰ 카운트다운 상태 초기화 완료, startCountdown() 호출');
        this.startCountdown();
    }
    
    /**
     * 경주 상태 처리
     */
    handleRacingState() {
        // 이미 경주 중이면 중복 처리 방지
        if (this.sessionInfo.raceStartTime) {
            console.log('⚠️ 경주가 이미 시작되었습니다. 중복 처리 방지.');
            return;
        }
        
        this.sessionInfo.raceStartTime = Date.now();
        
        // 모든 플레이어를 준비 상태로 설정
        Object.values(this.playerStates).forEach(player => {
            player.isReady = true;
        });
        
        console.log('🏁 경주 시작! 드론 조작이 활성화됩니다.');
        
        // 게임 루프에서 경주 로직 활성화
        if (this.game) {
            this.game.raceStartTime = Date.now();
            this.game.raceFinished = false;
            this.game.isPaused = false;
        }
    }
    
    /**
     * 일시정지 상태 처리
     */
    handlePausedState(data = {}) {
        console.log('게임 일시정지:', data.reason || '사용자 요청');
    }
    
    /**
     * 완료 상태 처리
     */
    handleFinishedState(data = {}) {
        this.sessionInfo.raceEndTime = Date.now();
        
        // 최종 통계 계산
        this.calculateFinalStatistics();
        
        console.log('경주 완료:', data);
    }
    
    /**
     * 연결 해제 상태 처리
     */
    handleDisconnectedState(data = {}) {
        const { sensorId } = data;
        
        if (sensorId && this.playerStates[sensorId]) {
            this.playerStates[sensorId].isConnected = false;
        }
        
        // 경주 중이면 일시정지
        if (this.currentState === this.states.RACING) {
            this.setState(this.states.PAUSED, { reason: 'sensor_disconnected', sensorId });
        }
    }
    
    /**
     * 카운트다운 시작 (중복 실행 방지)
     */
    startCountdown() {
        // 이미 카운트다운이 진행 중이면 중복 실행 방지
        if (this.countdownState.isActive) {
            console.warn('⚠️ 카운트다운이 이미 진행 중입니다. 중복 실행을 방지합니다.');
            return;
        }
        
        // 기존 타이머가 있으면 정리
        if (this.countdownTimer) {
            clearTimeout(this.countdownTimer);
            this.countdownTimer = null;
        }
        
        this.countdownState.isActive = true;
        this.countdownState.currentCount = 3;
        
        console.log('⏰ 카운트다운 시작: 3, 2, 1, GO!');
        
        const countdown = () => {
            // 상태가 변경되었으면 카운트다운 중단
            if (!this.countdownState.isActive || this.currentState !== this.states.COUNTDOWN) {
                console.log('⚠️ 카운트다운 중단됨 (상태 변경)');
                return;
            }
            
            if (this.countdownState.currentCount > 0) {
                console.log(`⏰ 카운트다운: ${this.countdownState.currentCount}`);
                
                // UI에 카운트다운 표시
                if (this.game.ui) {
                    this.game.ui.showCountdown(this.countdownState.currentCount);
                } else {
                    // UI가 없으면 직접 표시
                    const countdownElement = document.getElementById('countdown');
                    if (countdownElement) {
                        countdownElement.textContent = this.countdownState.currentCount;
                        countdownElement.classList.remove('hidden');
                        countdownElement.style.display = 'block';
                        countdownElement.style.visibility = 'visible';
                        countdownElement.style.opacity = '1';
                    }
                }
                
                this.countdownState.currentCount--;
                this.countdownTimer = setTimeout(countdown, 1000);
            } else {
                console.log('🚀 GO! 경주 시작!');
                
                // GO! 표시
                if (this.game.ui) {
                    this.game.ui.showCountdown(0);
                } else {
                    // UI가 없으면 직접 표시
                    const countdownElement = document.getElementById('countdown');
                    if (countdownElement) {
                        countdownElement.textContent = 'GO!';
                        countdownElement.style.color = '#00ff88';
                        countdownElement.style.textShadow = '0 0 30px #00ff88, 0 0 60px #00ff88';
                    }
                }
                
                // 카운트다운 완료
                this.countdownState.isActive = false;
                
                // 1.5초 후 경주 시작 (GO! 메시지 표시 시간)
                setTimeout(() => {
                    // 상태가 여전히 countdown이고 게임이 활성 상태인 경우에만 racing으로 전환
                    if (this.currentState === this.states.COUNTDOWN && this.game) {
                        console.log('🏁 카운트다운 완료 → 경주 상태로 전환');
                        
                        // 카운트다운 요소 숨기기
                        const countdownElement = document.getElementById('countdown');
                        if (countdownElement) {
                            countdownElement.classList.add('hidden');
                            countdownElement.style.display = 'none';
                        }
                        
                        // 게임 상태를 racing으로 변경
                        this.setState(this.states.RACING);
                        
                        // 게임 시작 시간 설정
                        this.game.raceStartTime = Date.now();
                        console.log('🚁 경주 시작!');
                    }
                }, 1500);
            }
        };
        
        // 첫 번째 카운트다운 시작
        setTimeout(countdown, 500); // 0.5초 후 시작
    }
    
    /**
     * 플레이어 상태 업데이트
     */
    updatePlayerState(playerId, updates) {
        if (!this.playerStates[playerId]) return;
        
        const player = this.playerStates[playerId];
        
        // 위치 및 속도 업데이트
        if (updates.position) {
            player.position = { ...player.position, ...updates.position };
        }
        
        if (updates.velocity) {
            player.velocity = { ...player.velocity, ...updates.velocity };
            player.speed = Math.sqrt(
                updates.velocity.x ** 2 + 
                updates.velocity.y ** 2 + 
                updates.velocity.z ** 2
            ) * 3.6; // m/s to km/h
            
            // 최고 속도 업데이트
            if (player.speed > player.maxSpeed) {
                player.maxSpeed = player.speed;
            }
        }
        
        // 레이스 진행 상황 업데이트
        if (updates.raceProgress) {
            Object.assign(player, updates.raceProgress);
        }
        
        // 부스터 상태 업데이트
        if (updates.booster) {
            player.booster = { ...player.booster, ...updates.booster };
        }
        
        // 페널티 상태 업데이트
        if (updates.penalties) {
            player.penalties = { ...player.penalties, ...updates.penalties };
        }
        
        // 통계 업데이트
        if (updates.statistics) {
            Object.keys(updates.statistics).forEach(key => {
                if (typeof updates.statistics[key] === 'number') {
                    player.statistics[key] += updates.statistics[key];
                }
            });
        }
    }
    
    /**
     * 센서 연결 상태 업데이트
     */
    updateSensorConnection(sensorId, isConnected) {
        if (this.playerStates[sensorId]) {
            this.playerStates[sensorId].isConnected = isConnected;
        }
        
        // 연결된 센서 수 업데이트
        this.sessionInfo.connectedSensors = Object.values(this.playerStates)
            .filter(player => player.isConnected).length;
        
        // 모든 센서가 연결되면 카운트다운 시작
        if (this.sessionInfo.connectedSensors === this.sessionInfo.maxSensors && 
            this.currentState === this.states.WAITING) {
            this.setState(this.states.COUNTDOWN);
        }
        
        // 센서 연결 해제 시 처리
        if (!isConnected && this.currentState === this.states.RACING) {
            this.setState(this.states.DISCONNECTED, { sensorId });
        }
    }
    
    /**
     * 게임 재시작
     */
    restart() {
        console.log('🔄 게임 재시작');
        
        // 상태 초기화
        this.setState(this.states.WAITING);
        
        // 드론 리셋
        if (this.game.resetDrones) {
            this.game.resetDrones();
        }
        
        // 연결된 센서가 있으면 자동으로 카운트다운 시작
        if (this.sessionInfo.connectedSensors === this.sessionInfo.maxSensors) {
            setTimeout(() => {
                this.setState(this.states.COUNTDOWN);
            }, 1000);
        }
    }
    
    /**
     * 게임 일시정지/재개 토글
     */
    togglePause() {
        if (this.currentState === this.states.RACING) {
            this.setState(this.states.PAUSED, { reason: 'user_request' });
        } else if (this.currentState === this.states.PAUSED) {
            this.setState(this.states.RACING);
        }
    }
    
    /**
     * 경주 완료 처리
     */
    finishRace(winnerId, raceData = {}) {
        if (this.currentState !== this.states.RACING) return;
        
        this.setState(this.states.FINISHED, {
            winner: winnerId,
            ...raceData
        });
    }
    
    /**
     * 게임 상태 초기화
     */
    resetGameState() {
        this.sessionInfo.gameStartTime = Date.now();
        this.sessionInfo.raceStartTime = null;
        this.sessionInfo.raceEndTime = null;
        
        this.countdownState = {
            isActive: false,
            currentCount: 3,
            startTime: null
        };
    }
    
    /**
     * 최종 통계 계산
     */
    calculateFinalStatistics() {
        const players = Object.values(this.playerStates);
        
        // 순위 계산
        players.sort((a, b) => {
            if (a.lapCount !== b.lapCount) {
                return b.lapCount - a.lapCount;
            }
            return a.totalTime - b.totalTime;
        });
        
        players.forEach((player, index) => {
            player.rank = index + 1;
        });
        
        return {
            totalRaceTime: this.sessionInfo.raceEndTime - this.sessionInfo.raceStartTime,
            players: players
        };
    }
    
    /**
     * 상태 변경 리스너 등록
     */
    onStateChange(callback) {
        const id = Date.now() + Math.random();
        this.stateListeners.set(id, callback);
        return id;
    }
    
    /**
     * 상태 변경 리스너 제거
     */
    removeStateListener(id) {
        this.stateListeners.delete(id);
    }
    
    /**
     * 상태 변경 알림
     */
    notifyStateChange(oldState, newState, data) {
        this.stateListeners.forEach(callback => {
            try {
                callback(oldState, newState, data);
            } catch (error) {
                console.error('상태 변경 리스너 오류:', error);
            }
        });
    }
    
    /**
     * 현재 게임 상태 정보 반환
     */
    getGameState() {
        return {
            currentState: this.currentState,
            previousState: this.previousState,
            sessionInfo: { ...this.sessionInfo },
            playerStates: { ...this.playerStates },
            countdownState: { ...this.countdownState }
        };
    }
    
    /**
     * 플레이어 상태 정보 반환
     */
    getPlayerState(playerId) {
        return this.playerStates[playerId] ? { ...this.playerStates[playerId] } : null;
    }
    
    /**
     * 게임 진행 상황 반환
     */
    getGameProgress() {
        const totalTime = this.sessionInfo.raceStartTime ? 
            Date.now() - this.sessionInfo.raceStartTime : 0;
        
        return {
            state: this.currentState,
            totalTime: totalTime,
            connectedPlayers: this.sessionInfo.connectedSensors,
            players: Object.values(this.playerStates).map(player => ({
                id: player.id,
                lapCount: player.lapCount,
                rank: player.rank,
                speed: player.speed,
                isConnected: player.isConnected
            }))
        };
    }
    
    /**
     * 디버그 정보 반환
     */
    getDebugInfo() {
        return {
            currentState: this.currentState,
            connectedSensors: this.sessionInfo.connectedSensors,
            raceTime: this.sessionInfo.raceStartTime ? 
                Date.now() - this.sessionInfo.raceStartTime : 0,
            playerCount: Object.keys(this.playerStates).length,
            countdownActive: this.countdownState.isActive
        };
    }
}