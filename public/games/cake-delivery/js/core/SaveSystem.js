/**
 * 저장 시스템
 * 게임 상태를 저장하고 불러오는 기능을 제공합니다.
 */
class SaveSystem {
    constructor() {
        this.saveState = {
            autoSaveEnabled: true,
            saveCount: 0,
            lastSaveTime: null
        };
        
        this.eventListeners = new Map();
        
        console.log('✅ 저장 시스템 초기화 완료');
    }
    
    /**
     * 게임 저장
     */
    async saveGame(saveData, slotName = 'auto') {
        try {
            const saveKey = `cakeDelivery_save_${slotName}`;
            const saveInfo = {
                saveData: saveData,
                timestamp: Date.now(),
                version: '2.0.0'
            };
            
            localStorage.setItem(saveKey, JSON.stringify(saveInfo));
            
            this.saveState.saveCount++;
            this.saveState.lastSaveTime = Date.now();
            
            // 저장 이벤트 발생
            this.dispatchEvent('onSave', { saveData, slotName });
            
            console.log(`💾 게임 저장 완료: ${slotName}`);
            return true;
            
        } catch (error) {
            console.error('게임 저장 실패:', error);
            this.dispatchEvent('onError', { type: 'save', error });
            return false;
        }
    }
    
    /**
     * 게임 불러오기
     */
    async loadGame(slotName = 'auto') {
        try {
            const saveKey = `cakeDelivery_save_${slotName}`;
            const saveInfo = localStorage.getItem(saveKey);
            
            if (!saveInfo) {
                console.warn(`저장 데이터를 찾을 수 없습니다: ${slotName}`);
                return null;
            }
            
            const parsedSave = JSON.parse(saveInfo);
            
            // 로드 이벤트 발생
            this.dispatchEvent('onLoad', parsedSave);
            
            console.log(`📂 게임 불러오기 완료: ${slotName}`);
            return parsedSave.saveData;
            
        } catch (error) {
            console.error('게임 불러오기 실패:', error);
            this.dispatchEvent('onError', { type: 'load', error });
            return null;
        }
    }
    
    /**
     * 저장 데이터 수집
     */
    collectSaveData() {
        return {
            timestamp: Date.now(),
            gameState: {},
            playerState: {},
            levelState: {},
            settings: {}
        };
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
     * 이벤트 발생
     */
    dispatchEvent(eventType, data) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`이벤트 리스너 오류 (${eventType}):`, error);
                }
            });
        }
    }
}