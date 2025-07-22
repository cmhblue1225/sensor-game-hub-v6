/**
 * 자동 저장 및 복원 시스템
 * 게임 상태를 자동으로 저장하고 필요시 복원합니다.
 */
class SaveSystem {
    constructor() {
        // 저장 설정
        this.config = {
            autoSaveInterval: 60000, // 60초마다 자동 저장
            maxSaveSlots: 3,        // 최대 저장 슬롯 수
            useLocalStorage: true,  // 로컬 스토리지 사용
            useIndexedDB: false,    // IndexedDB 사용 (대용량 데이터)
            compression: true,      // 데이터 압축
            encryption: false       // 데이터 암호화
        };
        
        // 저장 상태
        this.saveState = {
            lastSaveTime: 0,
            autoSaveEnabled: true,
            saveInProgress: false,
            saveCount: 0,
            saveError: null
        };
        
        // 자동 저장 타이머
        this.autoSaveTimer = null;
        
        // 저장 이벤트 리스너
        this.eventListeners = {
            onSave: [],
            onLoad: [],
            onError: []
        };
        
        // IndexedDB 인스턴스
        this.db = null;
        
        this.init();
    }
    
    /**
     * 저장 시스템 초기화
     */
    async init() {
        this.checkStorageSupport();
        
        if (this.config.useIndexedDB) {
            await this.initIndexedDB();
        }
        
        this.loadSaveMetadata();
        this.startAutoSave();
        
        console.log('✅ 저장 시스템 초기화 완료');
    }
    
    /**
     * 스토리지 지원 확인
     */
    checkStorageSupport() {
        // 로컬 스토리지 지원 확인
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
        } catch (e) {
            console.warn('⚠️ 로컬 스토리지를 지원하지 않습니다. 메모리 저장으로 대체합니다.');
            this.config.useLocalStorage = false;
        }
        
        // IndexedDB 지원 확인
        if (this.config.useIndexedDB && !window.indexedDB) {
            console.warn('⚠️ IndexedDB를 지원하지 않습니다. 로컬 스토리지로 대체합니다.');
            this.config.useIndexedDB = false;
        }
    }
    
    /**
     * IndexedDB 초기화
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                resolve(false);
                return;
            }
            
            const request = indexedDB.open('CakeDeliveryGameSaves', 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 저장 데이터 저장소 생성
                if (!db.objectStoreNames.contains('saves')) {
                    db.createObjectStore('saves', { keyPath: 'id' });
                }
                
                // 메타데이터 저장소 생성
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ IndexedDB 연결 성공');
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error('❌ IndexedDB 연결 실패:', event.target.error);
                this.config.useIndexedDB = false;
                resolve(false);
            };
        });
    }
    
    /**
     * 자동 저장 시작
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        if (this.saveState.autoSaveEnabled) {
            this.autoSaveTimer = setInterval(() => {
                this.autoSave();
            }, this.config.autoSaveInterval);
            
            console.log(`🕒 자동 저장 활성화 (${this.config.autoSaveInterval / 1000}초 간격)`);
        }
    }
    
    /**
     * 자동 저장 중지
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        
        this.saveState.autoSaveEnabled = false;
        console.log('🕒 자동 저장 비활성화');
    }
    
    /**
     * 자동 저장 실행
     */
    async autoSave() {
        if (this.saveState.saveInProgress) return;
        
        try {
            const saveData = this.collectSaveData();
            await this.saveGame(saveData, 'auto');
            console.log('🕒 자동 저장 완료');
        } catch (error) {
            console.error('❌ 자동 저장 실패:', error);
            this.saveState.saveError = error;
            this.triggerEvent('onError', { error, type: 'autoSave' });
        }
    }
    
    /**
     * 게임 데이터 수집
     */
    collectSaveData() {
        // 이벤트를 통해 게임 데이터 수집
        const saveData = {
            timestamp: Date.now(),
            version: '1.0',
            gameState: {},
            playerState: {},
            levelState: {},
            settings: {}
        };
        
        // 이벤트 리스너들에게 데이터 수집 요청
        this.triggerEvent('onSave', { saveData });
        
        return saveData;
    }
    
    /**
     * 게임 저장
     */
    async saveGame(saveData, slotName = 'default') {
        this.saveState.saveInProgress = true;
        
        try {
            // 저장 데이터 준비
            const saveObject = {
                id: slotName,
                timestamp: Date.now(),
                data: this.processSaveData(saveData)
            };
            
            // 저장 실행
            if (this.config.useIndexedDB && this.db) {
                await this.saveToIndexedDB(saveObject);
            } else if (this.config.useLocalStorage) {
                this.saveToLocalStorage(saveObject);
            } else {
                this.saveToMemory(saveObject);
            }
            
            // 메타데이터 업데이트
            this.updateSaveMetadata(saveObject);
            
            this.saveState.lastSaveTime = saveObject.timestamp;
            this.saveState.saveCount++;
            this.saveState.saveError = null;
            
            console.log(`💾 게임 저장 완료: ${slotName}`);
            return true;
        } catch (error) {
            console.error('❌ 게임 저장 실패:', error);
            this.saveState.saveError = error;
            this.triggerEvent('onError', { error, type: 'save', slotName });
            return false;
        } finally {
            this.saveState.saveInProgress = false;
        }
    }
    
    /**
     * 저장 데이터 처리 (압축/암호화)
     */
    processSaveData(saveData) {
        let processedData = JSON.stringify(saveData);
        
        // 데이터 압축
        if (this.config.compression) {
            processedData = this.compressData(processedData);
        }
        
        // 데이터 암호화
        if (this.config.encryption) {
            processedData = this.encryptData(processedData);
        }
        
        return processedData;
    }
    
    /**
     * 저장 데이터 복원 (압축 해제/복호화)
     */
    processSaveDataRestore(processedData) {
        let restoredData = processedData;
        
        // 데이터 복호화
        if (this.config.encryption) {
            restoredData = this.decryptData(restoredData);
        }
        
        // 데이터 압축 해제
        if (this.config.compression) {
            restoredData = this.decompressData(restoredData);
        }
        
        return JSON.parse(restoredData);
    }
    
    /**
     * IndexedDB에 저장
     */
    saveToIndexedDB(saveObject) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB가 초기화되지 않았습니다.'));
                return;
            }
            
            const transaction = this.db.transaction(['saves'], 'readwrite');
            const store = transaction.objectStore('saves');
            const request = store.put(saveObject);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 로컬 스토리지에 저장
     */
    saveToLocalStorage(saveObject) {
        try {
            const key = `cake_delivery_save_${saveObject.id}`;
            localStorage.setItem(key, saveObject.data);
            
            // 메타데이터 저장
            const metaKey = `cake_delivery_save_meta_${saveObject.id}`;
            const metaData = {
                id: saveObject.id,
                timestamp: saveObject.timestamp
            };
            localStorage.setItem(metaKey, JSON.stringify(metaData));
        } catch (error) {
            console.error('로컬 스토리지 저장 실패:', error);
            throw error;
        }
    }
    
    /**
     * 메모리에 저장 (임시)
     */
    saveToMemory(saveObject) {
        if (!window._gameMemoryStorage) {
            window._gameMemoryStorage = {};
        }
        
        window._gameMemoryStorage[saveObject.id] = saveObject;
    }
    
    /**
     * 게임 불러오기
     */
    async loadGame(slotName = 'default') {
        try {
            let saveObject = null;
            
            // 저장 데이터 로드
            if (this.config.useIndexedDB && this.db) {
                saveObject = await this.loadFromIndexedDB(slotName);
            } else if (this.config.useLocalStorage) {
                saveObject = this.loadFromLocalStorage(slotName);
            } else {
                saveObject = this.loadFromMemory(slotName);
            }
            
            if (!saveObject || !saveObject.data) {
                console.warn(`⚠️ 저장 데이터를 찾을 수 없습니다: ${slotName}`);
                return null;
            }
            
            // 데이터 복원
            const gameData = this.processSaveDataRestore(saveObject.data);
            
            // 이벤트 발생
            this.triggerEvent('onLoad', { saveData: gameData, slotName });
            
            console.log(`📂 게임 불러오기 완료: ${slotName}`);
            return gameData;
        } catch (error) {
            console.error('❌ 게임 불러오기 실패:', error);
            this.triggerEvent('onError', { error, type: 'load', slotName });
            return null;
        }
    }
    
    /**
     * IndexedDB에서 불러오기
     */
    loadFromIndexedDB(slotName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB가 초기화되지 않았습니다.'));
                return;
            }
            
            const transaction = this.db.transaction(['saves'], 'readonly');
            const store = transaction.objectStore('saves');
            const request = store.get(slotName);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 로컬 스토리지에서 불러오기
     */
    loadFromLocalStorage(slotName) {
        try {
            const key = `cake_delivery_save_${slotName}`;
            const data = localStorage.getItem(key);
            
            if (!data) return null;
            
            // 메타데이터 로드
            const metaKey = `cake_delivery_save_meta_${slotName}`;
            const metaDataStr = localStorage.getItem(metaKey);
            const metaData = metaDataStr ? JSON.parse(metaDataStr) : { timestamp: Date.now() };
            
            return {
                id: slotName,
                timestamp: metaData.timestamp,
                data: data
            };
        } catch (error) {
            console.error('로컬 스토리지 로드 실패:', error);
            throw error;
        }
    }
    
    /**
     * 메모리에서 불러오기
     */
    loadFromMemory(slotName) {
        if (!window._gameMemoryStorage) return null;
        return window._gameMemoryStorage[slotName] || null;
    }
    
    /**
     * 저장 메타데이터 로드
     */
    loadSaveMetadata() {
        try {
            let metadata = null;
            
            if (this.config.useLocalStorage) {
                const metaStr = localStorage.getItem('cake_delivery_save_metadata');
                if (metaStr) {
                    metadata = JSON.parse(metaStr);
                }
            } else if (window._gameMemoryStorage && window._gameMemoryStorage.metadata) {
                metadata = window._gameMemoryStorage.metadata;
            }
            
            if (metadata) {
                this.saveState.lastSaveTime = metadata.lastSaveTime || 0;
                this.saveState.saveCount = metadata.saveCount || 0;
                this.saveState.autoSaveEnabled = metadata.autoSaveEnabled !== false;
            }
        } catch (error) {
            console.warn('메타데이터 로드 실패:', error);
        }
    }
    
    /**
     * 저장 메타데이터 업데이트
     */
    updateSaveMetadata(saveObject) {
        try {
            const metadata = {
                lastSaveTime: saveObject.timestamp,
                saveCount: this.saveState.saveCount + 1,
                autoSaveEnabled: this.saveState.autoSaveEnabled,
                saves: this.getSaveList()
            };
            
            if (this.config.useIndexedDB && this.db) {
                const transaction = this.db.transaction(['metadata'], 'readwrite');
                const store = transaction.objectStore('metadata');
                store.put({ id: 'saveMetadata', ...metadata });
            } else if (this.config.useLocalStorage) {
                localStorage.setItem('cake_delivery_save_metadata', JSON.stringify(metadata));
            } else if (window._gameMemoryStorage) {
                window._gameMemoryStorage.metadata = metadata;
            }
        } catch (error) {
            console.warn('메타데이터 업데이트 실패:', error);
        }
    }
    
    /**
     * 데이터 압축
     */
    compressData(data) {
        // 간단한 압축 구현 (실제로는 더 효율적인 라이브러리 사용 권장)
        try {
            return btoa(encodeURIComponent(data));
        } catch (error) {
            console.warn('데이터 압축 실패:', error);
            return data;
        }
    }
    
    /**
     * 데이터 압축 해제
     */
    decompressData(compressedData) {
        try {
            return decodeURIComponent(atob(compressedData));
        } catch (error) {
            console.warn('데이터 압축 해제 실패:', error);
            return compressedData;
        }
    }
    
    /**
     * 데이터 암호화 (간단한 구현)
     */
    encryptData(data) {
        // 실제 구현에서는 더 안전한 암호화 사용 권장
        try {
            const key = 'cakeDeliveryGameSecretKey';
            let result = '';
            
            for (let i = 0; i < data.length; i++) {
                const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode);
            }
            
            return btoa(result);
        } catch (error) {
            console.warn('데이터 암호화 실패:', error);
            return data;
        }
    }
    
    /**
     * 데이터 복호화
     */
    decryptData(encryptedData) {
        try {
            const key = 'cakeDeliveryGameSecretKey';
            const data = atob(encryptedData);
            let result = '';
            
            for (let i = 0; i < data.length; i++) {
                const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode);
            }
            
            return result;
        } catch (error) {
            console.warn('데이터 복호화 실패:', error);
            return encryptedData;
        }
    }
    
    /**
     * 이벤트 리스너 등록
     */
    addEventListener(eventType, callback) {
        if (this.eventListeners[eventType] && typeof callback === 'function') {
            this.eventListeners[eventType].push(callback);
        }
    }
    
    /**
     * 이벤트 리스너 제거
     */
    removeEventListener(eventType, callback) {
        if (this.eventListeners[eventType]) {
            this.eventListeners[eventType] = this.eventListeners[eventType]
                .filter(listener => listener !== callback);
        }
    }
    
    /**
     * 이벤트 발생
     */
    triggerEvent(eventType, data) {
        if (this.eventListeners[eventType]) {
            this.eventListeners[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`이벤트 리스너 실행 오류 (${eventType}):`, error);
                }
            });
        }
    }
    
    /**
     * 설정 업데이트
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // 자동 저장 간격이 변경된 경우 재시작
        if (newConfig.autoSaveInterval) {
            this.startAutoSave();
        }
        
        console.log('⚙️ 저장 시스템 설정 업데이트:', newConfig);
    }
    
    /**
     * 저장 상태 정보 가져오기
     */
    getSaveState() {
        return {
            ...this.saveState,
            config: { ...this.config }
        };
    }
    
    /**
     * 시스템 정리
     */
    dispose() {
        this.stopAutoSave();
        
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        
        this.eventListeners = {
            onSave: [],
            onLoad: [],
            onError: []
        };
        
        console.log('🧹 저장 시스템 정리 완료');
    }
}       
 
        this.loadSaveMetadata();
        this.startAutoSave();
        
        console.log('✅ 저장 시스템 초기화 완료');
    }
    
    /**
     * 스토리지 지원 확인
     */
    checkStorageSupport() {
        // 로컬 스토리지 지원 확인
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
        } catch (e) {
            console.warn('⚠️ 로컬 스토리지를 지원하지 않습니다. 메모리 저장으로 대체합니다.');
            this.config.useLocalStorage = false;
        }
        
        // IndexedDB 지원 확인
        if (this.config.useIndexedDB && !window.indexedDB) {
            console.warn('⚠️ IndexedDB를 지원하지 않습니다. 로컬 스토리지로 대체합니다.');
            this.config.useIndexedDB = false;
        }
    }
    
    /**
     * IndexedDB 초기화
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                resolve(false);
                return;
            }
            
            const request = indexedDB.open('CakeDeliveryGameSaves', 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 저장 데이터 저장소 생성
                if (!db.objectStoreNames.contains('saves')) {
                    db.createObjectStore('saves', { keyPath: 'id' });
                }
                
                // 메타데이터 저장소 생성
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ IndexedDB 연결 성공');
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error('❌ IndexedDB 연결 실패:', event.target.error);
                this.config.useIndexedDB = false;
                resolve(false);
            };
        });
    }
    
    /**
     * 자동 저장 시작
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        if (this.saveState.autoSaveEnabled) {
            this.autoSaveTimer = setInterval(() => {
                this.autoSave();
            }, this.config.autoSaveInterval);
            
            console.log(`🕒 자동 저장 활성화 (${this.config.autoSaveInterval / 1000}초 간격)`);
        }
    }
    
    /**
     * 자동 저장 중지
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        
        this.saveState.autoSaveEnabled = false;
        console.log('🕒 자동 저장 비활성화');
    }
    
    /**
     * 자동 저장 실행
     */
    async autoSave() {
        if (this.saveState.saveInProgress) return;
        
        try {
            const saveData = this.collectSaveData();
            await this.saveGame(saveData, 'auto');
            console.log('🕒 자동 저장 완료');
        } catch (error) {
            console.error('❌ 자동 저장 실패:', error);
            this.saveState.saveError = error;
            this.triggerEvent('onError', { error, type: 'autoSave' });
        }
    }
    
    /**
     * 게임 데이터 수집
     */
    collectSaveData() {
        // 이벤트를 통해 게임 데이터 수집
        const saveData = {
            timestamp: Date.now(),
            version: '1.0',
            gameState: {},
            playerState: {},
            levelState: {},
            settings: {}
        };
        
        // 이벤트 리스너들에게 데이터 수집 요청
        this.triggerEvent('onSave', { saveData });
        
        return saveData;
    }
    
    /**
     * 게임 저장
     */
    async saveGame(saveData, slotName = 'default') {
        this.saveState.saveInProgress = true;
        
        try {
            // 저장 데이터 준비
            const saveObject = {
                id: slotName,
                timestamp: Date.now(),
                data: this.processSaveData(saveData)
            };
            
            // 저장 실행
            if (this.config.useIndexedDB && this.db) {
                await this.saveToIndexedDB(saveObject);
            } else if (this.config.useLocalStorage) {
                this.saveToLocalStorage(saveObject);
            } else {
                this.saveToMemory(saveObject);
            }
            
            // 메타데이터 업데이트
            this.updateSaveMetadata(saveObject);
            
            this.saveState.lastSaveTime = saveObject.timestamp;
            this.saveState.saveCount++;
            this.saveState.saveError = null;
            
            console.log(`💾 게임 저장 완료: ${slotName}`);
            return true;
        } catch (error) {
            console.error('❌ 게임 저장 실패:', error);
            this.saveState.saveError = error;
            this.triggerEvent('onError', { error, type: 'save', slotName });
            return false;
        } finally {
            this.saveState.saveInProgress = false;
        }
    }
    
    /**
     * 저장 데이터 처리 (압축/암호화)
     */
    processSaveData(saveData) {
        let processedData = JSON.stringify(saveData);
        
        // 데이터 압축
        if (this.config.compression) {
            processedData = this.compressData(processedData);
        }
        
        // 데이터 암호화
        if (this.config.encryption) {
            processedData = this.encryptData(processedData);
        }
        
        return processedData;
    }
    
    /**
     * 저장 데이터 복원 (압축 해제/복호화)
     */
    processSaveDataRestore(processedData) {
        let restoredData = processedData;
        
        // 데이터 복호화
        if (this.config.encryption) {
            restoredData = this.decryptData(restoredData);
        }
        
        // 데이터 압축 해제
        if (this.config.compression) {
            restoredData = this.decompressData(restoredData);
        }
        
        return JSON.parse(restoredData);
    }
    
    /**
     * IndexedDB에 저장
     */
    saveToIndexedDB(saveObject) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB가 초기화되지 않았습니다.'));
                return;
            }
            
            const transaction = this.db.transaction(['saves'], 'readwrite');
            const store = transaction.objectStore('saves');
            const request = store.put(saveObject);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 로컬 스토리지에 저장
     */
    saveToLocalStorage(saveObject) {
        try {
            const key = `cake_delivery_save_${saveObject.id}`;
            localStorage.setItem(key, saveObject.data);
            
            // 메타데이터 저장
            const metaKey = `cake_delivery_save_meta_${saveObject.id}`;
            const metaData = {
                id: saveObject.id,
                timestamp: saveObject.timestamp
            };
            localStorage.setItem(metaKey, JSON.stringify(metaData));
        } catch (error) {
            console.error('로컬 스토리지 저장 실패:', error);
            throw error;
        }
    }
    
    /**
     * 메모리에 저장 (임시)
     */
    saveToMemory(saveObject) {
        if (!window._gameMemoryStorage) {
            window._gameMemoryStorage = {};
        }
        
        window._gameMemoryStorage[saveObject.id] = saveObject;
    }
    
    /**
     * 게임 불러오기
     */
    async loadGame(slotName = 'default') {
        try {
            let saveObject = null;
            
            // 저장 데이터 로드
            if (this.config.useIndexedDB && this.db) {
                saveObject = await this.loadFromIndexedDB(slotName);
            } else if (this.config.useLocalStorage) {
                saveObject = this.loadFromLocalStorage(slotName);
            } else {
                saveObject = this.loadFromMemory(slotName);
            }
            
            if (!saveObject || !saveObject.data) {
                console.warn(`⚠️ 저장 데이터를 찾을 수 없습니다: ${slotName}`);
                return null;
            }
            
            // 데이터 복원
            const gameData = this.processSaveDataRestore(saveObject.data);
            
            // 이벤트 발생
            this.triggerEvent('onLoad', { saveData: gameData, slotName });
            
            console.log(`📂 게임 불러오기 완료: ${slotName}`);
            return gameData;
        } catch (error) {
            console.error('❌ 게임 불러오기 실패:', error);
            this.triggerEvent('onError', { error, type: 'load', slotName });
            return null;
        }
    }
    
    /**
     * IndexedDB에서 불러오기
     */
    loadFromIndexedDB(slotName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB가 초기화되지 않았습니다.'));
                return;
            }
            
            const transaction = this.db.transaction(['saves'], 'readonly');
            const store = transaction.objectStore('saves');
            const request = store.get(slotName);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 로컬 스토리지에서 불러오기
     */
    loadFromLocalStorage(slotName) {
        try {
            const key = `cake_delivery_save_${slotName}`;
            const data = localStorage.getItem(key);
            
            if (!data) return null;
            
            // 메타데이터 로드
            const metaKey = `cake_delivery_save_meta_${slotName}`;
            const metaDataStr = localStorage.getItem(metaKey);
            const metaData = metaDataStr ? JSON.parse(metaDataStr) : { timestamp: Date.now() };
            
            return {
                id: slotName,
                timestamp: metaData.timestamp,
                data: data
            };
        } catch (error) {
            console.error('로컬 스토리지 로드 실패:', error);
            throw error;
        }
    }
    
    /**
     * 메모리에서 불러오기
     */
    loadFromMemory(slotName) {
        if (!window._gameMemoryStorage) return null;
        return window._gameMemoryStorage[slotName] || null;
    }
    
    /**
     * 저장 메타데이터 로드
     */
    loadSaveMetadata() {
        try {
            let metadata = null;
            
            if (this.config.useLocalStorage) {
                const metaStr = localStorage.getItem('cake_delivery_save_metadata');
                if (metaStr) {
                    metadata = JSON.parse(metaStr);
                }
            } else if (window._gameMemoryStorage && window._gameMemoryStorage.metadata) {
                metadata = window._gameMemoryStorage.metadata;
            }
            
            if (metadata) {
                this.saveState.lastSaveTime = metadata.lastSaveTime || 0;
                this.saveState.saveCount = metadata.saveCount || 0;
                this.saveState.autoSaveEnabled = metadata.autoSaveEnabled !== false;
            }
        } catch (error) {
            console.warn('메타데이터 로드 실패:', error);
        }
    }
    
    /**
     * 저장 메타데이터 업데이트
     */
    updateSaveMetadata(saveObject) {
        try {
            const metadata = {
                lastSaveTime: saveObject.timestamp,
                saveCount: this.saveState.saveCount + 1,
                autoSaveEnabled: this.saveState.autoSaveEnabled,
                saves: this.getSaveList()
            };
            
            if (this.config.useIndexedDB && this.db) {
                const transaction = this.db.transaction(['metadata'], 'readwrite');
                const store = transaction.objectStore('metadata');
                store.put({ id: 'saveMetadata', ...metadata });
            } else if (this.config.useLocalStorage) {
                localStorage.setItem('cake_delivery_save_metadata', JSON.stringify(metadata));
            } else if (window._gameMemoryStorage) {
                window._gameMemoryStorage.metadata = metadata;
            }
        } catch (error) {
            console.warn('메타데이터 업데이트 실패:', error);
        }
    }
    
    /**
     * 데이터 압축
     */
    compressData(data) {
        // 간단한 압축 구현 (실제로는 더 효율적인 라이브러리 사용 권장)
        try {
            return btoa(encodeURIComponent(data));
        } catch (error) {
            console.warn('데이터 압축 실패:', error);
            return data;
        }
    }
    
    /**
     * 데이터 압축 해제
     */
    decompressData(compressedData) {
        try {
            return decodeURIComponent(atob(compressedData));
        } catch (error) {
            console.warn('데이터 압축 해제 실패:', error);
            return compressedData;
        }
    }
    
    /**
     * 데이터 암호화 (간단한 구현)
     */
    encryptData(data) {
        // 실제 구현에서는 더 안전한 암호화 사용 권장
        try {
            const key = 'cakeDeliveryGameSecretKey';
            let result = '';
            
            for (let i = 0; i < data.length; i++) {
                const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode);
            }
            
            return btoa(result);
        } catch (error) {
            console.warn('데이터 암호화 실패:', error);
            return data;
        }
    }
    
    /**
     * 데이터 복호화
     */
    decryptData(encryptedData) {
        try {
            const key = 'cakeDeliveryGameSecretKey';
            const data = atob(encryptedData);
            let result = '';
            
            for (let i = 0; i < data.length; i++) {
                const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode);
            }
            
            return result;
        } catch (error) {
            console.warn('데이터 복호화 실패:', error);
            return encryptedData;
        }
    }
    
    /**
     * 이벤트 리스너 등록
     */
    addEventListener(eventType, callback) {
        if (this.eventListeners[eventType] && typeof callback === 'function') {
            this.eventListeners[eventType].push(callback);
        }
    }
    
    /**
     * 이벤트 리스너 제거
     */
    removeEventListener(eventType, callback) {
        if (this.eventListeners[eventType]) {
            this.eventListeners[eventType] = this.eventListeners[eventType]
                .filter(listener => listener !== callback);
        }
    }
    
    /**
     * 이벤트 발생
     */
    triggerEvent(eventType, data) {
        if (this.eventListeners[eventType]) {
            this.eventListeners[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`이벤트 리스너 실행 오류 (${eventType}):`, error);
                }
            });
        }
    }
    
    /**
     * 설정 업데이트
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // 자동 저장 간격이 변경된 경우 재시작
        if (newConfig.autoSaveInterval) {
            this.startAutoSave();
        }
        
        console.log('⚙️ 저장 시스템 설정 업데이트:', newConfig);
    }
    
    /**
     * 저장 상태 정보 가져오기
     */
    getSaveState() {
        return {
            ...this.saveState,
            config: { ...this.config }
        };
    }
    
    /**
     * 시스템 정리
     */
    dispose() {
        this.stopAutoSave();
        
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        
        this.eventListeners = {
            onSave: [],
            onLoad: [],
            onError: []
        };
        
        console.log('🧹 저장 시스템 정리 완료');
    }
}