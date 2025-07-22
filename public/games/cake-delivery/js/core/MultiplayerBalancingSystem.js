/**
 * 멀티플레이어 밸런싱 시스템
 * 다중 플레이어 게임의 균형을 조절합니다.
 */
class MultiplayerBalancingSystem {
    constructor() {
        this.gameState = {
            isMultiplayer: false,
            playerCount: 1,
            gameMode: 'solo'
        };
        
        this.players = new Map();
        
        this.balanceSettings = {
            solo: { difficultyMultiplier: 1.0, scoreMultiplier: 1.0 },
            coop: { difficultyMultiplier: 1.2, scoreMultiplier: 1.1 },
            competitive: { difficultyMultiplier: 1.1, scoreMultiplier: 1.0 }
        };
        
        // 이벤트 리스너 시스템
        this.eventListeners = new Map();
        
        console.log('✅ 멀티플레이어 밸런싱 시스템 초기화 완료');
    }
    
    /**
     * 플레이어 추가
     */
    addPlayer(playerId, playerData) {
        this.players.set(playerId, playerData);
        this.updateGameState();
        console.log(`👤 플레이어 추가: ${playerId}`);
    }
    
    /**
     * 플레이어 제거
     */
    removePlayer(playerId) {
        this.players.delete(playerId);
        this.updateGameState();
        console.log(`👤 플레이어 제거: ${playerId}`);
    }
    
    /**
     * 게임 상태 업데이트
     */
    updateGameState() {
        const previousMode = this.gameState.gameMode;
        
        this.gameState.playerCount = this.players.size;
        this.gameState.isMultiplayer = this.players.size > 1;
        
        if (this.players.size === 1) {
            this.gameState.gameMode = 'solo';
        } else if (this.players.size <= 4) {
            this.gameState.gameMode = 'coop';
        } else {
            this.gameState.gameMode = 'competitive';
        }
        
        // 게임 모드가 변경된 경우 이벤트 발생
        if (previousMode !== this.gameState.gameMode) {
            this.dispatchEvent('gameModeChanged', {
                previousMode,
                currentMode: this.gameState.gameMode,
                playerCount: this.gameState.playerCount
            });
        }
        
        // 게임 상태 변경 이벤트 발생
        this.dispatchEvent('gameStateUpdated', {
            gameState: { ...this.gameState }
        });
    }
    
    /**
     * 현재 밸런스 가져오기
     */
    getCurrentBalance() {
        return this.balanceSettings[this.gameState.gameMode];
    }
    
    /**
     * 이벤트 리스너 등록
     */
    addEventListener(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(callback);
    }
    
    /**
     * 이벤트 리스너 제거
     */
    removeEventListener(eventType, callback) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * 이벤트 발생
     */
    dispatchEvent(eventType, data) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`멀티플레이어 밸런싱 시스템 이벤트 오류 (${eventType}):`, error);
                }
            });
        }
    }
}