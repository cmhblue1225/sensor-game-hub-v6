/**
 * 오브젝트 풀링 시스템
 * 자주 생성/삭제되는 오브젝트들을 재사용하여 메모리 할당을 최적화합니다.
 */
class ObjectPoolingSystem {
    constructor() {
        this.pools = new Map();
        this.activeObjects = new Map();
        this.poolStats = new Map();
        
        // 풀 설정
        this.poolConfigs = {
            particles: { initialSize: 100, maxSize: 500, growthFactor: 1.5 },
            effects: { initialSize: 50, maxSize: 200, growthFactor: 1.3 },
            sounds: { initialSize: 20, maxSize: 100, growthFactor: 1.2 },
            meshes: { initialSize: 30, maxSize: 150, growthFactor: 1.4 },
            geometries: { initialSize: 20, maxSize: 80, growthFactor: 1.3 },
            materials: { initialSize: 15, maxSize: 60, growthFactor: 1.2 }
        };
        
        this.init();
    }
    
    /**
     * 오브젝트 풀링 시스템 초기화
     */
    init() {
        this.createInitialPools();
        this.setupPerformanceMonitoring();
        
        console.log('✅ 오브젝트 풀링 시스템 초기화 완료');
    }
    
    /**
     * 초기 풀 생성
     */
    createInitialPools() {
        for (const [poolName, config] of Object.entries(this.poolConfigs)) {
            this.createPool(poolName, config);
        }
    }
    
    /**
     * 풀 생성
     */
    createPool(poolName, config) {
        const pool = {
            available: [],
            inUse: new Set(),
            factory: null,
            resetFunction: null,
            config: config,
            stats: {
                created: 0,
                reused: 0,
                maxConcurrent: 0,
                totalRequests: 0
            }
        };
        
        this.pools.set(poolName, pool);
        this.poolStats.set(poolName, pool.stats);
        
        console.log(`🏊 풀 생성: ${poolName} (초기 크기: ${config.initialSize})`);
    }
    
    /**
     * 팩토리 함수 등록
     */
    registerFactory(poolName, factoryFunction, resetFunction = null) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            console.warn(`풀을 찾을 수 없습니다: ${poolName}`);
            return;
        }
        
        pool.factory = factoryFunction;
        pool.resetFunction = resetFunction;
        
        // 초기 오브젝트들 생성
        this.preAllocateObjects(poolName);
        
        console.log(`🏭 팩토리 등록: ${poolName}`);
    }
    
    /**
     * 오브젝트 사전 할당
     */
    preAllocateObjects(poolName) {
        const pool = this.pools.get(poolName);
        if (!pool || !pool.factory) return;
        
        const { initialSize } = pool.config;
        
        for (let i = 0; i < initialSize; i++) {
            const obj = pool.factory();
            if (obj) {
                pool.available.push(obj);
                pool.stats.created++;
            }
        }
        
        console.log(`📦 사전 할당 완료: ${poolName} (${initialSize}개)`);
    }
    
    /**
     * 오브젝트 가져오기
     */
    acquire(poolName, ...args) {
        const pool = this.pools.get(poolName);
        if (!pool) {
            console.warn(`풀을 찾을 수 없습니다: ${poolName}`);
            return null;
        }
        
        pool.stats.totalRequests++;
        
        let obj;
        
        // 사용 가능한 오브젝트가 있으면 재사용
        if (pool.available.length > 0) {
            obj = pool.available.pop();
            pool.stats.reused++;
        } else {
            // 새 오브젝트 생성
            if (pool.factory) {
                obj = pool.factory(...args);
                pool.stats.created++;
            } else {
                console.warn(`팩토리가 등록되지 않았습니다: ${poolName}`);
                return null;
            }
        }
        
        if (obj) {
            // 사용 중 목록에 추가
            pool.inUse.add(obj);
            
            // 통계 업데이트
            if (pool.inUse.size > pool.stats.maxConcurrent) {
                pool.stats.maxConcurrent = pool.inUse.size;
            }
            
            // 오브젝트에 풀 정보 저장
            obj._poolName = poolName;
            obj._poolId = this.generateObjectId();
            
            // 활성 오브젝트 추적
            this.activeObjects.set(obj._poolId, obj);
        }
        
        return obj;
    }
    
    /**
     * 오브젝트 반환
     */
    release(obj) {
        if (!obj || !obj._poolName) {
            console.warn('유효하지 않은 오브젝트입니다');
            return;
        }
        
        const poolName = obj._poolName;
        const pool = this.pools.get(poolName);
        
        if (!pool) {
            console.warn(`풀을 찾을 수 없습니다: ${poolName}`);
            return;
        }
        
        // 사용 중 목록에서 제거
        if (pool.inUse.has(obj)) {
            pool.inUse.delete(obj);
            
            // 오브젝트 리셋
            if (pool.resetFunction) {
                pool.resetFunction(obj);
            } else {
                this.defaultReset(obj);
            }
            
            // 풀 크기 제한 확인
            if (pool.available.length < pool.config.maxSize) {
                pool.available.push(obj);
            } else {
                // 풀이 가득 찬 경우 오브젝트 폐기
                this.disposeObject(obj);
            }
            
            // 활성 오브젝트 추적에서 제거
            this.activeObjects.delete(obj._poolId);
        }
    }
    
    /**
     * 기본 리셋 함수
     */
    defaultReset(obj) {
        // Three.js 오브젝트 리셋
        if (obj.position) {
            obj.position.set(0, 0, 0);
        }
        if (obj.rotation) {
            obj.rotation.set(0, 0, 0);
        }
        if (obj.scale) {
            obj.scale.set(1, 1, 1);
        }
        if (obj.visible !== undefined) {
            obj.visible = true;
        }
        
        // 파티클 시스템 리셋
        if (obj.reset && typeof obj.reset === 'function') {
            obj.reset();
        }
        
        // 사용자 정의 속성 리셋
        if (obj.userData) {
            obj.userData = {};
        }
    }
    
    /**
     * 오브젝트 폐기
     */
    disposeObject(obj) {
        // Three.js 리소스 정리
        if (obj.geometry) {
            obj.geometry.dispose();
        }
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(mat => mat.dispose());
            } else {
                obj.material.dispose();
            }
        }
        if (obj.texture) {
            obj.texture.dispose();
        }
        
        // 사용자 정의 정리 함수
        if (obj.dispose && typeof obj.dispose === 'function') {
            obj.dispose();
        }
    }
    
    /**
     * 풀 크기 조정
     */
    resizePool(poolName, newSize) {
        const pool = this.pools.get(poolName);
        if (!pool) return;
        
        const currentSize = pool.available.length;
        
        if (newSize > currentSize) {
            // 풀 확장
            const additionalObjects = newSize - currentSize;
            for (let i = 0; i < additionalObjects; i++) {
                if (pool.factory) {
                    const obj = pool.factory();
                    if (obj) {
                        pool.available.push(obj);
                        pool.stats.created++;
                    }
                }
            }
        } else if (newSize < currentSize) {
            // 풀 축소
            const objectsToRemove = currentSize - newSize;
            for (let i = 0; i < objectsToRemove; i++) {
                const obj = pool.available.pop();
                if (obj) {
                    this.disposeObject(obj);
                }
            }
        }
        
        console.log(`📏 풀 크기 조정: ${poolName} (${currentSize} -> ${newSize})`);
    }
    
    /**
     * 풀 통계 가져오기
     */
    getPoolStats(poolName = null) {
        if (poolName) {
            const pool = this.pools.get(poolName);
            if (pool) {
                return {
                    ...pool.stats,
                    available: pool.available.length,
                    inUse: pool.inUse.size,
                    efficiency: pool.stats.reused / pool.stats.totalRequests
                };
            }
            return null;
        }
        
        // 모든 풀 통계
        const allStats = {};
        for (const [name, pool] of this.pools) {
            allStats[name] = {
                ...pool.stats,
                available: pool.available.length,
                inUse: pool.inUse.size,
                efficiency: pool.stats.totalRequests > 0 ? pool.stats.reused / pool.stats.totalRequests : 0
            };
        }
        
        return allStats;
    }
    
    /**
     * 성능 모니터링 설정
     */
    setupPerformanceMonitoring() {
        if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
            this.createDebugUI();
            
            // 주기적 통계 로깅
            setInterval(() => {
                this.logPoolStats();
            }, 10000); // 10초마다
        }
    }
    
    /**
     * 디버그 UI 생성
     */
    createDebugUI() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'pool-debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 11px;
            z-index: 10000;
            min-width: 250px;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        document.body.appendChild(debugPanel);
        
        // 주기적으로 업데이트
        setInterval(() => {
            this.updateDebugUI(debugPanel);
        }, 1000);
    }
    
    /**
     * 디버그 UI 업데이트
     */
    updateDebugUI(panel) {
        const stats = this.getPoolStats();
        let html = '<div><strong>Object Pool Stats</strong></div>';
        
        for (const [poolName, poolStats] of Object.entries(stats)) {
            html += `
                <div style="margin: 5px 0; padding: 5px; border-left: 2px solid #4CAF50;">
                    <div><strong>${poolName}</strong></div>
                    <div>Available: ${poolStats.available}</div>
                    <div>In Use: ${poolStats.inUse}</div>
                    <div>Created: ${poolStats.created}</div>
                    <div>Reused: ${poolStats.reused}</div>
                    <div>Efficiency: ${(poolStats.efficiency * 100).toFixed(1)}%</div>
                    <div>Max Concurrent: ${poolStats.maxConcurrent}</div>
                </div>
            `;
        }
        
        panel.innerHTML = html;
    }
    
    /**
     * 풀 통계 로깅
     */
    logPoolStats() {
        const stats = this.getPoolStats();
        console.group('🏊 Object Pool Statistics');
        
        for (const [poolName, poolStats] of Object.entries(stats)) {
            console.log(`${poolName}:`, {
                available: poolStats.available,
                inUse: poolStats.inUse,
                efficiency: `${(poolStats.efficiency * 100).toFixed(1)}%`,
                maxConcurrent: poolStats.maxConcurrent
            });
        }
        
        console.groupEnd();
    }
    
    /**
     * 오브젝트 ID 생성
     */
    generateObjectId() {
        return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 풀 정리
     */
    clearPool(poolName) {
        const pool = this.pools.get(poolName);
        if (!pool) return;
        
        // 사용 가능한 오브젝트들 정리
        pool.available.forEach(obj => this.disposeObject(obj));
        pool.available.length = 0;
        
        // 사용 중인 오브젝트들 강제 반환
        for (const obj of pool.inUse) {
            this.disposeObject(obj);
        }
        pool.inUse.clear();
        
        // 통계 리셋
        pool.stats = {
            created: 0,
            reused: 0,
            maxConcurrent: 0,
            totalRequests: 0
        };
        
        console.log(`🧹 풀 정리 완료: ${poolName}`);
    }
    
    /**
     * 모든 풀 정리
     */
    clearAllPools() {
        for (const poolName of this.pools.keys()) {
            this.clearPool(poolName);
        }
        
        this.activeObjects.clear();
        
        console.log('🧹 모든 풀 정리 완료');
    }
    
    /**
     * 정리
     */
    dispose() {
        console.log('🧹 오브젝트 풀링 시스템 정리 시작...');
        
        this.clearAllPools();
        this.pools.clear();
        this.poolStats.clear();
        
        // 디버그 UI 제거
        const debugPanel = document.getElementById('pool-debug-panel');
        if (debugPanel) {
            debugPanel.remove();
        }
        
        console.log('✅ 오브젝트 풀링 시스템 정리 완료');
    }
}

// 전역 오브젝트 풀 인스턴스 (싱글톤 패턴)
let globalObjectPool = null;

/**
 * 전역 오브젝트 풀 가져오기
 */
function getObjectPool() {
    if (!globalObjectPool) {
        globalObjectPool = new ObjectPoolingSystem();
    }
    return globalObjectPool;
}

/**
 * 편의 함수들
 */
const ObjectPool = {
    acquire: (poolName, ...args) => getObjectPool().acquire(poolName, ...args),
    release: (obj) => getObjectPool().release(obj),
    registerFactory: (poolName, factory, reset) => getObjectPool().registerFactory(poolName, factory, reset),
    getStats: (poolName) => getObjectPool().getPoolStats(poolName)
};