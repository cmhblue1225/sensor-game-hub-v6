/**
 * 네트워크 최적화 시스템
 * 네트워크 트래픽 최적화, 데이터 압축, 배터리 소모 최적화를 제공합니다.
 */
class NetworkOptimizer {
    constructor() {
        this.connectionInfo = {
            type: 'unknown',
            effectiveType: 'unknown',
            downlink: 0,
            rtt: 0,
            saveData: false
        };
        
        this.optimizationSettings = {
            dataCompression: true,
            adaptiveQuality: true,
            batchRequests: true,
            cacheStrategy: 'aggressive',
            throttleRate: 60, // Hz
            maxBatchSize: 10,
            compressionLevel: 6
        };
        
        this.networkStats = {
            bytesSent: 0,
            bytesReceived: 0,
            requestCount: 0,
            compressionRatio: 0,
            averageLatency: 0,
            errorCount: 0
        };
        
        this.requestQueue = [];
        this.batchTimer = null;
        this.compressionWorker = null;
        
        this.init();
    }
    
    /**
     * 네트워크 최적화 시스템 초기화
     */
    init() {
        this.detectNetworkCapabilities();
        this.setupNetworkMonitoring();
        this.initializeCompression();
        this.setupRequestBatching();
        
        console.log('✅ 네트워크 최적화 시스템 초기화 완료');
    }
    
    /**
     * 네트워크 능력 감지
     */
    detectNetworkCapabilities() {
        // Network Information API 사용
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            this.connectionInfo = {
                type: connection.type || 'unknown',
                effectiveType: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 0,
                rtt: connection.rtt || 0,
                saveData: connection.saveData || false
            };
            
            // 네트워크 변경 감지
            connection.addEventListener('change', () => {
                this.handleNetworkChange();
            });
        }
        
        // 네트워크 상태에 따른 최적화 설정 조정
        this.adjustOptimizationSettings();
        
        console.log('📡 네트워크 정보:', this.connectionInfo);
    }
    
    /**
     * 네트워크 변경 처리
     */
    handleNetworkChange() {
        const connection = navigator.connection;
        
        this.connectionInfo = {
            type: connection.type || 'unknown',
            effectiveType: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 0,
            rtt: connection.rtt || 0,
            saveData: connection.saveData || false
        };
        
        this.adjustOptimizationSettings();
        
        console.log('📡 네트워크 변경 감지:', this.connectionInfo);
    }
    
    /**
     * 최적화 설정 조정
     */
    adjustOptimizationSettings() {
        const { effectiveType, saveData, downlink } = this.connectionInfo;
        
        // 저속 연결 또는 데이터 절약 모드
        if (effectiveType === 'slow-2g' || effectiveType === '2g' || saveData) {
            this.optimizationSettings = {
                ...this.optimizationSettings,
                dataCompression: true,
                adaptiveQuality: true,
                throttleRate: 30, // 낮은 주파수
                maxBatchSize: 20, // 큰 배치 크기
                compressionLevel: 9, // 최대 압축
                cacheStrategy: 'aggressive'
            };
        }
        // 중속 연결
        else if (effectiveType === '3g') {
            this.optimizationSettings = {
                ...this.optimizationSettings,
                dataCompression: true,
                adaptiveQuality: true,
                throttleRate: 45,
                maxBatchSize: 15,
                compressionLevel: 6,
                cacheStrategy: 'normal'
            };
        }
        // 고속 연결
        else if (effectiveType === '4g' || downlink > 10) {
            this.optimizationSettings = {
                ...this.optimizationSettings,
                dataCompression: false,
                adaptiveQuality: false,
                throttleRate: 60,
                maxBatchSize: 5,
                compressionLevel: 3,
                cacheStrategy: 'minimal'
            };
        }
        
        console.log('⚙️ 최적화 설정 조정:', this.optimizationSettings);
    }
    
    /**
     * 네트워크 모니터링 설정
     */
    setupNetworkMonitoring() {
        // 주기적 네트워크 상태 체크
        setInterval(() => {
            this.checkNetworkPerformance();
        }, 30000); // 30초마다
        
        // 온라인/오프라인 이벤트
        window.addEventListener('online', () => {
            console.log('📡 네트워크 연결됨');
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            console.log('📡 네트워크 연결 끊김');
            this.handleOffline();
        });
    }
    
    /**
     * 네트워크 성능 체크
     */
    async checkNetworkPerformance() {
        try {
            const startTime = performance.now();
            
            // 작은 테스트 요청
            const response = await fetch('/api/ping', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            const endTime = performance.now();
            const latency = endTime - startTime;
            
            // 평균 지연시간 계산
            this.networkStats.averageLatency = 
                (this.networkStats.averageLatency + latency) / 2;
            
            // 네트워크 품질 평가
            this.evaluateNetworkQuality(latency);
            
        } catch (error) {
            this.networkStats.errorCount++;
            console.warn('네트워크 성능 체크 실패:', error);
        }
    }
    
    /**
     * 네트워크 품질 평가
     */
    evaluateNetworkQuality(latency) {
        let quality = 'good';
        
        if (latency > 1000) {
            quality = 'poor';
        } else if (latency > 500) {
            quality = 'fair';
        }
        
        // 품질에 따른 설정 조정
        if (quality === 'poor') {
            this.optimizationSettings.throttleRate = Math.min(this.optimizationSettings.throttleRate, 20);
            this.optimizationSettings.maxBatchSize = Math.max(this.optimizationSettings.maxBatchSize, 25);
        }
    }
    
    /**
     * 압축 시스템 초기화
     */
    initializeCompression() {
        if (typeof Worker !== 'undefined') {
            try {
                // 압축 워커 생성
                const workerCode = `
                    // LZ-string 압축 알고리즘 (간단한 구현)
                    function compress(str) {
                        if (!str) return '';
                        
                        const dict = {};
                        const data = str.split('');
                        const result = [];
                        let dictSize = 256;
                        let w = '';
                        
                        for (let i = 0; i < data.length; i++) {
                            const c = data[i];
                            const wc = w + c;
                            
                            if (dict[wc]) {
                                w = wc;
                            } else {
                                result.push(dict[w] || w.charCodeAt(0));
                                dict[wc] = dictSize++;
                                w = c;
                            }
                        }
                        
                        if (w) {
                            result.push(dict[w] || w.charCodeAt(0));
                        }
                        
                        return result;
                    }
                    
                    function decompress(data) {
                        if (!data || data.length === 0) return '';
                        
                        const dict = {};
                        let dictSize = 256;
                        let w = String.fromCharCode(data[0]);
                        let result = w;
                        
                        for (let i = 1; i < data.length; i++) {
                            const k = data[i];
                            let entry;
                            
                            if (dict[k]) {
                                entry = dict[k];
                            } else if (k === dictSize) {
                                entry = w + w.charAt(0);
                            } else {
                                throw new Error('Invalid compressed data');
                            }
                            
                            result += entry;
                            dict[dictSize++] = w + entry.charAt(0);
                            w = entry;
                        }
                        
                        return result;
                    }
                    
                    self.onmessage = function(e) {
                        const { action, data, id } = e.data;
                        
                        try {
                            let result;
                            if (action === 'compress') {
                                result = compress(data);
                            } else if (action === 'decompress') {
                                result = decompress(data);
                            }
                            
                            self.postMessage({ id, result, success: true });
                        } catch (error) {
                            self.postMessage({ id, error: error.message, success: false });
                        }
                    };
                `;
                
                const blob = new Blob([workerCode], { type: 'application/javascript' });
                this.compressionWorker = new Worker(URL.createObjectURL(blob));
                
                console.log('🗜️ 압축 워커 초기화 완료');
                
            } catch (error) {
                console.warn('압축 워커 초기화 실패:', error);
            }
        }
    }
    
    /**
     * 요청 배치 처리 설정
     */
    setupRequestBatching() {
        // 주기적으로 배치 요청 처리
        this.batchTimer = setInterval(() => {
            this.processBatchRequests();
        }, 1000 / this.optimizationSettings.throttleRate);
    }
    
    /**
     * 데이터 압축
     */
    async compressData(data) {
        if (!this.optimizationSettings.dataCompression || !this.compressionWorker) {
            return data;
        }
        
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substr(2, 9);
            
            const timeout = setTimeout(() => {
                reject(new Error('압축 타임아웃'));
            }, 5000);
            
            const handler = (e) => {
                if (e.data.id === id) {
                    clearTimeout(timeout);
                    this.compressionWorker.removeEventListener('message', handler);
                    
                    if (e.data.success) {
                        resolve(e.data.result);
                    } else {
                        reject(new Error(e.data.error));
                    }
                }
            };
            
            this.compressionWorker.addEventListener('message', handler);
            this.compressionWorker.postMessage({
                action: 'compress',
                data: JSON.stringify(data),
                id
            });
        });
    }
    
    /**
     * 데이터 압축 해제
     */
    async decompressData(compressedData) {
        if (!this.compressionWorker) {
            return compressedData;
        }
        
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substr(2, 9);
            
            const timeout = setTimeout(() => {
                reject(new Error('압축 해제 타임아웃'));
            }, 5000);
            
            const handler = (e) => {
                if (e.data.id === id) {
                    clearTimeout(timeout);
                    this.compressionWorker.removeEventListener('message', handler);
                    
                    if (e.data.success) {
                        try {
                            resolve(JSON.parse(e.data.result));
                        } catch (error) {
                            resolve(e.data.result);
                        }
                    } else {
                        reject(new Error(e.data.error));
                    }
                }
            };
            
            this.compressionWorker.addEventListener('message', handler);
            this.compressionWorker.postMessage({
                action: 'decompress',
                data: compressedData,
                id
            });
        });
    }
    
    /**
     * 최적화된 요청 전송
     */
    async sendOptimizedRequest(url, data, options = {}) {
        try {
            let processedData = data;
            
            // 데이터 압축
            if (this.optimizationSettings.dataCompression && data) {
                const originalSize = JSON.stringify(data).length;
                processedData = await this.compressData(data);
                const compressedSize = JSON.stringify(processedData).length;
                
                this.networkStats.compressionRatio = 
                    (this.networkStats.compressionRatio + (originalSize / compressedSize)) / 2;
            }
            
            // 요청 옵션 최적화
            const optimizedOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'Content-Encoding': this.optimizationSettings.dataCompression ? 'custom' : 'identity',
                    'X-Compression': this.optimizationSettings.dataCompression ? 'true' : 'false'
                }
            };
            
            // 배치 처리 여부 확인
            if (this.optimizationSettings.batchRequests && !options.immediate) {
                return this.addToBatch(url, processedData, optimizedOptions);
            }
            
            // 즉시 전송
            const startTime = performance.now();
            const response = await fetch(url, {
                ...optimizedOptions,
                body: processedData ? JSON.stringify(processedData) : undefined
            });
            
            const endTime = performance.now();
            
            // 통계 업데이트
            this.updateNetworkStats(processedData, response, endTime - startTime);
            
            return response;
            
        } catch (error) {
            this.networkStats.errorCount++;
            throw error;
        }
    }
    
    /**
     * 배치에 요청 추가
     */
    addToBatch(url, data, options) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                url,
                data,
                options,
                resolve,
                reject,
                timestamp: Date.now()
            });
            
            // 배치 크기 초과 시 즉시 처리
            if (this.requestQueue.length >= this.optimizationSettings.maxBatchSize) {
                this.processBatchRequests();
            }
        });
    }
    
    /**
     * 배치 요청 처리
     */
    async processBatchRequests() {
        if (this.requestQueue.length === 0) return;
        
        const batch = this.requestQueue.splice(0, this.optimizationSettings.maxBatchSize);
        
        try {
            // 배치 요청 생성
            const batchData = batch.map(req => ({
                url: req.url,
                data: req.data,
                options: req.options
            }));
            
            const response = await fetch('/api/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ requests: batchData })
            });
            
            const results = await response.json();
            
            // 각 요청의 Promise 해결
            batch.forEach((req, index) => {
                const result = results[index];
                if (result.success) {
                    req.resolve(result.data);
                } else {
                    req.reject(new Error(result.error));
                }
            });
            
        } catch (error) {
            // 배치 실패 시 개별 요청으로 폴백
            batch.forEach(req => {
                this.sendOptimizedRequest(req.url, req.data, { ...req.options, immediate: true })
                    .then(req.resolve)
                    .catch(req.reject);
            });
        }
    }
    
    /**
     * 네트워크 통계 업데이트
     */
    updateNetworkStats(data, response, latency) {
        this.networkStats.requestCount++;
        this.networkStats.averageLatency = 
            (this.networkStats.averageLatency + latency) / 2;
        
        if (data) {
            this.networkStats.bytesSent += JSON.stringify(data).length;
        }
        
        if (response.headers.get('content-length')) {
            this.networkStats.bytesReceived += 
                parseInt(response.headers.get('content-length'));
        }
    }
    
    /**
     * 온라인 상태 처리
     */
    handleOnline() {
        // 대기 중인 요청들 재시도
        if (this.requestQueue.length > 0) {
            console.log(`📡 ${this.requestQueue.length}개의 대기 요청 재시도`);
            this.processBatchRequests();
        }
    }
    
    /**
     * 오프라인 상태 처리
     */
    handleOffline() {
        // 오프라인 모드 설정
        this.optimizationSettings.cacheStrategy = 'aggressive';
        console.log('📡 오프라인 모드 활성화');
    }
    
    /**
     * 네트워크 통계 가져오기
     */
    getNetworkStats() {
        return {
            ...this.networkStats,
            connectionInfo: { ...this.connectionInfo },
            optimizationSettings: { ...this.optimizationSettings },
            queueLength: this.requestQueue.length
        };
    }
    
    /**
     * 최적화 설정 업데이트
     */
    updateOptimizationSettings(newSettings) {
        this.optimizationSettings = {
            ...this.optimizationSettings,
            ...newSettings
        };
        
        // 배치 타이머 재설정
        if (newSettings.throttleRate && this.batchTimer) {
            clearInterval(this.batchTimer);
            this.setupRequestBatching();
        }
        
        console.log('⚙️ 최적화 설정 업데이트:', this.optimizationSettings);
    }
    
    /**
     * 정리
     */
    dispose() {
        console.log('🧹 네트워크 최적화 시스템 정리 시작...');
        
        // 타이머 정리
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
        }
        
        // 워커 정리
        if (this.compressionWorker) {
            this.compressionWorker.terminate();
        }
        
        // 대기 중인 요청들 처리
        this.requestQueue.forEach(req => {
            req.reject(new Error('시스템 종료'));
        });
        this.requestQueue.length = 0;
        
        console.log('✅ 네트워크 최적화 시스템 정리 완료');
    }
}