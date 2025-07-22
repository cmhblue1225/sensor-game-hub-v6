/**
 * 메모리 관리 시스템
 * 메모리 사용량 모니터링, 누수 방지, 자동 정리 기능을 제공합니다.
 */
class MemoryManager {
    constructor() {
        this.memoryThresholds = {
            warning: 50 * 1024 * 1024,    // 50MB
            critical: 100 * 1024 * 1024,  // 100MB
            emergency: 150 * 1024 * 1024  // 150MB
        };
        
        this.trackedObjects = new Map();
        this.memoryStats = {
            currentUsage: 0,
            peakUsage: 0,
            gcCount: 0,
            leakWarnings: 0,
            cleanupOperations: 0
        };
        
        this.cleanupCallbacks = new Set();
        this.monitoringInterval = null;
        this.isMonitoring = false;
        
        // 메모리 정리 전략
        this.cleanupStrategies = [
            { name: 'textures', priority: 1, callback: this.cleanupTextures.bind(this) },
            { name: 'geometries', priority: 2, callback: this.cleanupGeometries.bind(this) },
            { name: 'materials', priority: 3, callback: this.cleanupMaterials.bind(this) },
            { name: 'audio', priority: 4, callback: this.cleanupAudio.bind(this) },
            { name: 'cache', priority: 5, callback: this.cleanupCache.bind(this) }
        ];
        
        this.init();
    }
    
    /**
     * 메모리 관리 시스템 초기화
     */
    init() {
        this.setupMemoryMonitoring();
        this.setupEventListeners();
        this.detectMemoryCapabilities();
        
        console.log('✅ 메모리 관리 시스템 초기화 완료');
    }
    
    /**
     * 메모리 모니터링 설정
     */
    setupMemoryMonitoring() {
        if (this.supportsMemoryAPI()) {
            this.startMemoryMonitoring();
        } else {
            console.warn('⚠️ Memory API를 지원하지 않습니다. 기본 모니터링을 사용합니다.');
            this.startBasicMonitoring();
        }
    }
    
    /**
     * Memory API 지원 확인
     */
    supportsMemoryAPI() {
        return 'memory' in performance && 'usedJSHeapSize' in performance.memory;
    }
    
    /**
     * 메모리 모니터링 시작
     */
    startMemoryMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, 5000); // 5초마다 체크
        
        console.log('📊 메모리 모니터링 시작');
    }
    
    /**
     * 기본 모니터링 시작
     */
    startBasicMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.performBasicCleanup();
        }, 10000); // 10초마다 기본 정리
        
        console.log('📊 기본 메모리 모니터링 시작');
    }
    
    /**
     * 메모리 사용량 확인
     */
    checkMemoryUsage() {
        if (!this.supportsMemoryAPI()) return;
        
        const memInfo = performance.memory;
        const currentUsage = memInfo.usedJSHeapSize;
        const totalHeap = memInfo.totalJSHeapSize;
        const heapLimit = memInfo.jsHeapSizeLimit;
        
        // 통계 업데이트
        this.memoryStats.currentUsage = currentUsage;
        if (currentUsage > this.memoryStats.peakUsage) {
            this.memoryStats.peakUsage = currentUsage;
        }
        
        // 메모리 사용률 계산
        const usageRatio = currentUsage / heapLimit;
        const heapRatio = totalHeap / heapLimit;
        
        // 임계값 확인 및 대응
        if (currentUsage > this.memoryThresholds.emergency) {
            this.handleEmergencyMemory();
        } else if (currentUsage > this.memoryThresholds.critical) {
            this.handleCriticalMemory();
        } else if (currentUsage > this.memoryThresholds.warning) {
            this.handleWarningMemory();
        }
        
        // 디버그 정보 출력
        if (window.location.search.includes('debug=true')) {
            console.log('💾 메모리 상태:', {
                used: this.formatBytes(currentUsage),
                total: this.formatBytes(totalHeap),
                limit: this.formatBytes(heapLimit),
                usageRatio: `${(usageRatio * 100).toFixed(1)}%`,
                heapRatio: `${(heapRatio * 100).toFixed(1)}%`
            });
        }
    }
    
    /**
     * 경고 수준 메모리 처리
     */
    handleWarningMemory() {
        console.warn('⚠️ 메모리 사용량 경고 수준');
        this.performLightCleanup();
    }
    
    /**
     * 위험 수준 메모리 처리
     */
    handleCriticalMemory() {
        console.warn('🚨 메모리 사용량 위험 수준');
        this.performMediumCleanup();
        this.memoryStats.leakWarnings++;
    }
    
    /**
     * 응급 수준 메모리 처리
     */
    handleEmergencyMemory() {
        console.error('🆘 메모리 사용량 응급 수준');
        this.performAggressiveCleanup();
        this.forceGarbageCollection();
        this.memoryStats.leakWarnings++;
    }
    
    /**
     * 가벼운 정리
     */
    performLightCleanup() {
        this.cleanupStrategies
            .filter(strategy => strategy.priority <= 2)
            .forEach(strategy => {
                try {
                    strategy.callback();
                } catch (error) {
                    console.warn(`정리 전략 실패: ${strategy.name}`, error);
                }
            });
        
        this.memoryStats.cleanupOperations++;
    }
    
    /**
     * 중간 정리
     */
    performMediumCleanup() {
        this.cleanupStrategies
            .filter(strategy => strategy.priority <= 4)
            .forEach(strategy => {
                try {
                    strategy.callback();
                } catch (error) {
                    console.warn(`정리 전략 실패: ${strategy.name}`, error);
                }
            });
        
        this.memoryStats.cleanupOperations++;
    }
    
    /**
     * 적극적 정리
     */
    performAggressiveCleanup() {
        this.cleanupStrategies.forEach(strategy => {
            try {
                strategy.callback();
            } catch (error) {
                console.warn(`정리 전략 실패: ${strategy.name}`, error);
            }
        });
        
        // 추가 정리 작업
        this.cleanupTrackedObjects();
        this.runCleanupCallbacks();
        
        this.memoryStats.cleanupOperations++;
    }
    
    /**
     * 기본 정리
     */
    performBasicCleanup() {
        this.cleanupTrackedObjects();
        this.runCleanupCallbacks();
        this.memoryStats.cleanupOperations++;
    }
    
    /**
     * 텍스처 정리
     */
    cleanupTextures() {
        // Three.js 텍스처 캐시 정리
        if (typeof THREE !== 'undefined' && THREE.Cache) {
            const cache = THREE.Cache;
            const files = cache.files;
            
            let cleanedCount = 0;
            for (const url in files) {
                if (files[url] && files[url].lastAccessed) {
                    const timeSinceAccess = Date.now() - files[url].lastAccessed;
                    if (timeSinceAccess > 300000) { // 5분 이상 미사용
                        delete files[url];
                        cleanedCount++;
                    }
                }
            }
            
            if (cleanedCount > 0) {
                console.log(`🧹 텍스처 캐시 정리: ${cleanedCount}개`);
            }
        }
    }
    
    /**
     * 지오메트리 정리
     */
    cleanupGeometries() {
        // 사용하지 않는 지오메트리 정리
        this.trackedObjects.forEach((data, obj) => {
            if (data.type === 'geometry' && obj.dispose) {
                const timeSinceAccess = Date.now() - data.lastAccessed;
                if (timeSinceAccess > 600000) { // 10분 이상 미사용
                    obj.dispose();
                    this.trackedObjects.delete(obj);
                }
            }
        });
    }
    
    /**
     * 재질 정리
     */
    cleanupMaterials() {
        // 사용하지 않는 재질 정리
        this.trackedObjects.forEach((data, obj) => {
            if (data.type === 'material' && obj.dispose) {
                const timeSinceAccess = Date.now() - data.lastAccessed;
                if (timeSinceAccess > 600000) { // 10분 이상 미사용
                    obj.dispose();
                    this.trackedObjects.delete(obj);
                }
            }
        });
    }
    
    /**
     * 오디오 정리
     */
    cleanupAudio() {
        // 오디오 버퍼 정리
        this.trackedObjects.forEach((data, obj) => {
            if (data.type === 'audio' && obj.disconnect) {
                const timeSinceAccess = Date.now() - data.lastAccessed;
                if (timeSinceAccess > 300000) { // 5분 이상 미사용
                    obj.disconnect();
                    this.trackedObjects.delete(obj);
                }
            }
        });
    }
    
    /**
     * 캐시 정리
     */
    cleanupCache() {
        // 브라우저 캐시 정리 (가능한 경우)
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    if (cacheName.includes('temp') || cacheName.includes('old')) {
                        caches.delete(cacheName);
                    }
                });
            });
        }
    }
    
    /**
     * 추적된 오브젝트 정리
     */
    cleanupTrackedObjects() {
        const now = Date.now();
        let cleanedCount = 0;
        
        this.trackedObjects.forEach((data, obj) => {
            const timeSinceAccess = now - data.lastAccessed;
            
            // 30분 이상 미사용 오브젝트 정리
            if (timeSinceAccess > 1800000) {
                if (obj.dispose && typeof obj.dispose === 'function') {
                    obj.dispose();
                }
                this.trackedObjects.delete(obj);
                cleanedCount++;
            }
        });
        
        if (cleanedCount > 0) {
            console.log(`🧹 추적 오브젝트 정리: ${cleanedCount}개`);
        }
    }
    
    /**
     * 정리 콜백 실행
     */
    runCleanupCallbacks() {
        this.cleanupCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.warn('정리 콜백 실행 실패:', error);
            }
        });
    }
    
    /**
     * 강제 가비지 컬렉션
     */
    forceGarbageCollection() {
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
            this.memoryStats.gcCount++;
            console.log('🗑️ 강제 가비지 컬렉션 실행');
        } else {
            // 간접적인 GC 유도
            const temp = new Array(1000000).fill(0);
            temp.length = 0;
        }
    }
    
    /**
     * 오브젝트 추적 등록
     */
    trackObject(obj, type = 'unknown', metadata = {}) {
        if (!obj) return;
        
        this.trackedObjects.set(obj, {
            type: type,
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            metadata: metadata
        });
    }
    
    /**
     * 오브젝트 접근 기록
     */
    touchObject(obj) {
        const data = this.trackedObjects.get(obj);
        if (data) {
            data.lastAccessed = Date.now();
        }
    }
    
    /**
     * 오브젝트 추적 해제
     */
    untrackObject(obj) {
        this.trackedObjects.delete(obj);
    }
    
    /**
     * 정리 콜백 등록
     */
    registerCleanupCallback(callback) {
        this.cleanupCallbacks.add(callback);
    }
    
    /**
     * 정리 콜백 해제
     */
    unregisterCleanupCallback(callback) {
        this.cleanupCallbacks.delete(callback);
    }
    
    /**
     * 메모리 능력 감지
     */
    detectMemoryCapabilities() {
        const capabilities = {
            memoryAPI: this.supportsMemoryAPI(),
            deviceMemory: navigator.deviceMemory || 'unknown',
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
        };
        
        // 디바이스 메모리에 따른 임계값 조정
        if (typeof capabilities.deviceMemory === 'number') {
            if (capabilities.deviceMemory <= 2) {
                // 저사양 디바이스
                this.memoryThresholds.warning = 20 * 1024 * 1024;   // 20MB
                this.memoryThresholds.critical = 40 * 1024 * 1024;  // 40MB
                this.memoryThresholds.emergency = 60 * 1024 * 1024; // 60MB
            } else if (capabilities.deviceMemory >= 8) {
                // 고사양 디바이스
                this.memoryThresholds.warning = 100 * 1024 * 1024;  // 100MB
                this.memoryThresholds.critical = 200 * 1024 * 1024; // 200MB
                this.memoryThresholds.emergency = 300 * 1024 * 1024; // 300MB
            }
        }
        
        console.log('💾 메모리 능력:', capabilities);
        console.log('📊 메모리 임계값:', {
            warning: this.formatBytes(this.memoryThresholds.warning),
            critical: this.formatBytes(this.memoryThresholds.critical),
            emergency: this.formatBytes(this.memoryThresholds.emergency)
        });
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 페이지 언로드 시 정리
        window.addEventListener('beforeunload', () => {
            this.dispose();
        });
        
        // 메모리 압박 이벤트 (실험적)
        if ('onmemorywarning' in window) {
            window.addEventListener('memorywarning', () => {
                console.warn('🚨 시스템 메모리 경고');
                this.handleCriticalMemory();
            });
        }
    }
    
    /**
     * 메모리 통계 가져오기
     */
    getMemoryStats() {
        const stats = { ...this.memoryStats };
        
        if (this.supportsMemoryAPI()) {
            const memInfo = performance.memory;
            stats.jsHeapSize = {
                used: memInfo.usedJSHeapSize,
                total: memInfo.totalJSHeapSize,
                limit: memInfo.jsHeapSizeLimit
            };
        }
        
        stats.trackedObjects = this.trackedObjects.size;
        stats.cleanupCallbacks = this.cleanupCallbacks.size;
        
        return stats;
    }
    
    /**
     * 바이트 포맷팅
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * 메모리 모니터링 중지
     */
    stopMemoryMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        
        console.log('📊 메모리 모니터링 중지');
    }
    
    /**
     * 정리
     */
    dispose() {
        console.log('🧹 메모리 관리 시스템 정리 시작...');
        
        this.stopMemoryMonitoring();
        this.performAggressiveCleanup();
        
        this.trackedObjects.clear();
        this.cleanupCallbacks.clear();
        
        console.log('✅ 메모리 관리 시스템 정리 완료');
    }
}