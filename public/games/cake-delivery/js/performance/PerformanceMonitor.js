/**
 * 실시간 성능 모니터링 시스템
 * FPS, 메모리, 네트워크 지연 등을 모니터링하고 실시간으로 성능 지표를 수집합니다.
 */
class PerformanceMonitor {
    constructor() {
        // 모니터링 설정
        this.config = {
            enabled: true,
            updateInterval: 1000,      // 1초마다 업데이트
            historySize: 60,           // 60초간의 히스토리 유지
            alertThresholds: {
                fps: 30,               // FPS 임계값
                memory: 100,           // 메모리 사용량 임계값 (MB)
                networkLatency: 200,   // 네트워크 지연 임계값 (ms)
                cpuUsage: 80,          // CPU 사용률 임계값 (%)
                renderTime: 16.67      // 렌더링 시간 임계값 (ms, 60fps 기준)
            },
            autoOptimize: true,        // 자동 최적화 활성화
            reportingEnabled: true     // 리포팅 활성화
        };
        
        // 성능 메트릭
        this.metrics = {
            fps: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                history: []
            },
            memory: {
                used: 0,
                total: 0,
                percentage: 0,
                history: []
            },
            network: {
                latency: 0,
                bandwidth: 0,
                packetLoss: 0,
                history: []
            },
            rendering: {
                frameTime: 0,
                drawCalls: 0,
                triangles: 0,
                history: []
            },
            cpu: {
                usage: 0,
                temperature: 0,
                history: []
            },
            gpu: {
                usage: 0,
                memory: 0,
                temperature: 0,
                history: []
            }
        };
        
        // 모니터링 상태
        this.monitoringState = {
            isRunning: false,
            startTime: 0,
            lastUpdateTime: 0,
            updateCount: 0,
            alertCount: 0,
            optimizationCount: 0
        };
        
        // 성능 알림
        this.alerts = [];
        this.maxAlerts = 10;
        
        // FPS 측정용
        this.fpsCounter = {
            frameCount: 0,
            lastTime: 0,
            currentFPS: 0
        };
        
        // 네트워크 측정용
        this.networkTester = {
            testStartTime: 0,
            testEndTime: 0,
            testData: null,
            isTestingLatency: false
        };
        
        // 렌더링 측정용
        this.renderingProfiler = {
            frameStartTime: 0,
            frameEndTime: 0,
            drawCallCount: 0,
            triangleCount: 0
        };
        
        // 이벤트 리스너
        this.eventListeners = {
            onMetricsUpdate: [],
            onAlert: [],
            onOptimization: [],
            onReport: []
        };
        
        // 모니터링 타이머
        this.monitoringTimer = null;
        
        this.init();
    }
    
    /**
     * 성능 모니터 초기화
     */
    init() {
        this.setupPerformanceAPI();
        this.setupNetworkMonitoring();
        this.setupMemoryMonitoring();
        
        console.log('✅ 성능 모니터링 시스템 초기화 완료');
    }
    
    /**
     * Performance API 설정
     */
    setupPerformanceAPI() {
        // Performance Observer 설정 (지원하는 경우)
        if ('PerformanceObserver' in window) {
            try {
                // 렌더링 성능 관찰
                const renderObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.entryType === 'measure') {
                            this.recordRenderingMetric(entry);
                        }
                    });
                });
                
                renderObserver.observe({ entryTypes: ['measure'] });
                
                // 네트워크 성능 관찰
                const networkObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
                            this.recordNetworkMetric(entry);
                        }
                    });
                });
                
                networkObserver.observe({ entryTypes: ['navigation', 'resource'] });
                
            } catch (error) {
                console.warn('Performance Observer 설정 실패:', error);
            }
        }
    }
    
    /**
     * 네트워크 모니터링 설정
     */
    setupNetworkMonitoring() {
        // 네트워크 정보 API (지원하는 경우)
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            // 연결 상태 변경 감지
            connection.addEventListener('change', () => {
                this.updateNetworkMetrics();
            });
            
            this.updateNetworkMetrics();
        }
    }
    
    /**
     * 메모리 모니터링 설정
     */
    setupMemoryMonitoring() {
        // Memory API (Chrome에서 지원)
        if ('memory' in performance) {
            this.updateMemoryMetrics();
        }
    }
    
    /**
     * 모니터링 시작
     */
    startMonitoring() {
        if (this.monitoringState.isRunning) {
            console.warn('성능 모니터링이 이미 실행 중입니다.');
            return;
        }
        
        this.monitoringState.isRunning = true;
        this.monitoringState.startTime = performance.now();
        this.monitoringState.lastUpdateTime = this.monitoringState.startTime;
        
        // FPS 측정 시작
        this.startFPSMonitoring();
        
        // 정기 업데이트 시작
        this.monitoringTimer = setInterval(() => {
            this.updateMetrics();
        }, this.config.updateInterval);
        
        console.log('📊 성능 모니터링 시작');
    }
    
    /**
     * 모니터링 중지
     */
    stopMonitoring() {
        if (!this.monitoringState.isRunning) {
            return;
        }
        
        this.monitoringState.isRunning = false;
        
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }
        
        console.log('📊 성능 모니터링 중지');
    }
    
    /**
     * FPS 모니터링 시작
     */
    startFPSMonitoring() {
        const measureFPS = (timestamp) => {
            if (!this.monitoringState.isRunning) return;
            
            // FPS 계산
            if (this.fpsCounter.lastTime === 0) {
                this.fpsCounter.lastTime = timestamp;
            }
            
            this.fpsCounter.frameCount++;
            
            const deltaTime = timestamp - this.fpsCounter.lastTime;
            if (deltaTime >= 1000) { // 1초마다 FPS 계산
                this.fpsCounter.currentFPS = Math.round((this.fpsCounter.frameCount * 1000) / deltaTime);
                this.updateFPSMetrics(this.fpsCounter.currentFPS);
                
                this.fpsCounter.frameCount = 0;
                this.fpsCounter.lastTime = timestamp;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    /**
     * 메트릭 업데이트
     */
    updateMetrics() {
        const currentTime = performance.now();
        
        // 메모리 메트릭 업데이트
        this.updateMemoryMetrics();
        
        // 네트워크 메트릭 업데이트
        this.updateNetworkMetrics();
        
        // CPU 메트릭 업데이트 (추정)
        this.updateCPUMetrics();
        
        // GPU 메트릭 업데이트 (추정)
        this.updateGPUMetrics();
        
        // 알림 확인
        this.checkAlerts();
        
        // 자동 최적화
        if (this.config.autoOptimize) {
            this.performAutoOptimization();
        }
        
        // 이벤트 발생
        this.triggerEvent('onMetricsUpdate', {
            metrics: this.getMetrics(),
            timestamp: currentTime
        });
        
        this.monitoringState.lastUpdateTime = currentTime;
        this.monitoringState.updateCount++;
    }
    
    /**
     * FPS 메트릭 업데이트
     */
    updateFPSMetrics(fps) {
        const fpsMetric = this.metrics.fps;
        
        fpsMetric.current = fps;
        fpsMetric.min = Math.min(fpsMetric.min, fps);
        fpsMetric.max = Math.max(fpsMetric.max, fps);
        
        // 히스토리 업데이트
        fpsMetric.history.push({
            value: fps,
            timestamp: performance.now()
        });
        
        // 히스토리 크기 제한
        if (fpsMetric.history.length > this.config.historySize) {
            fpsMetric.history.shift();
        }
        
        // 평균 계산
        if (fpsMetric.history.length > 0) {
            fpsMetric.average = fpsMetric.history.reduce((sum, entry) => sum + entry.value, 0) / fpsMetric.history.length;
        }
    }
    
    /**
     * 메모리 메트릭 업데이트
     */
    updateMemoryMetrics() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const memoryMetric = this.metrics.memory;
            
            memoryMetric.used = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
            memoryMetric.total = Math.round(memory.totalJSHeapSize / 1024 / 1024); // MB
            memoryMetric.percentage = memoryMetric.total > 0 ? 
                Math.round((memoryMetric.used / memoryMetric.total) * 100) : 0;
            
            // 히스토리 업데이트
            memoryMetric.history.push({
                used: memoryMetric.used,
                total: memoryMetric.total,
                percentage: memoryMetric.percentage,
                timestamp: performance.now()
            });
            
            // 히스토리 크기 제한
            if (memoryMetric.history.length > this.config.historySize) {
                memoryMetric.history.shift();
            }
        }
    }
    
    /**
     * 네트워크 메트릭 업데이트
     */
    updateNetworkMetrics() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const networkMetric = this.metrics.network;
            
            // 대역폭 정보
            if (connection.downlink !== undefined) {
                networkMetric.bandwidth = connection.downlink; // Mbps
            }
            
            // 연결 타입 정보
            networkMetric.connectionType = connection.effectiveType || connection.type;
            
            // 히스토리 업데이트
            networkMetric.history.push({
                bandwidth: networkMetric.bandwidth,
                latency: networkMetric.latency,
                connectionType: networkMetric.connectionType,
                timestamp: performance.now()
            });
            
            // 히스토리 크기 제한
            if (networkMetric.history.length > this.config.historySize) {
                networkMetric.history.shift();
            }
        }
    }
    
    /**
     * CPU 메트릭 업데이트 (추정)
     */
    updateCPUMetrics() {
        const cpuMetric = this.metrics.cpu;
        
        // CPU 사용률 추정 (FPS와 렌더링 시간 기반)
        const fpsRatio = this.metrics.fps.current / 60; // 60fps 기준
        const renderTimeRatio = this.metrics.rendering.frameTime / 16.67; // 16.67ms 기준
        
        cpuMetric.usage = Math.min(100, Math.max(0, 
            (1 - fpsRatio + renderTimeRatio) * 50
        ));
        
        // 히스토리 업데이트
        cpuMetric.history.push({
            usage: cpuMetric.usage,
            timestamp: performance.now()
        });
        
        // 히스토리 크기 제한
        if (cpuMetric.history.length > this.config.historySize) {
            cpuMetric.history.shift();
        }
    }
    
    /**
     * GPU 메트릭 업데이트 (추정)
     */
    updateGPUMetrics() {
        const gpuMetric = this.metrics.gpu;
        
        // GPU 사용률 추정 (렌더링 메트릭 기반)
        const drawCallRatio = Math.min(1, this.metrics.rendering.drawCalls / 1000);
        const triangleRatio = Math.min(1, this.metrics.rendering.triangles / 100000);
        
        gpuMetric.usage = Math.round((drawCallRatio + triangleRatio) * 50);
        
        // 히스토리 업데이트
        gpuMetric.history.push({
            usage: gpuMetric.usage,
            memory: gpuMetric.memory,
            timestamp: performance.now()
        });
        
        // 히스토리 크기 제한
        if (gpuMetric.history.length > this.config.historySize) {
            gpuMetric.history.shift();
        }
    }
    
    /**
     * 렌더링 메트릭 기록
     */
    recordRenderingMetric(entry) {
        const renderingMetric = this.metrics.rendering;
        
        if (entry.name === 'frame-render') {
            renderingMetric.frameTime = entry.duration;
            
            // 히스토리 업데이트
            renderingMetric.history.push({
                frameTime: renderingMetric.frameTime,
                drawCalls: renderingMetric.drawCalls,
                triangles: renderingMetric.triangles,
                timestamp: performance.now()
            });
            
            // 히스토리 크기 제한
            if (renderingMetric.history.length > this.config.historySize) {
                renderingMetric.history.shift();
            }
        }
    }
    
    /**
     * 네트워크 메트릭 기록
     */
    recordNetworkMetric(entry) {
        const networkMetric = this.metrics.network;
        
        if (entry.responseEnd && entry.requestStart) {
            const latency = entry.responseEnd - entry.requestStart;
            networkMetric.latency = Math.max(networkMetric.latency, latency);
        }
    }
    
    /**
     * 네트워크 지연 테스트
     */
    async testNetworkLatency(url = '/api/ping') {
        if (this.networkTester.isTestingLatency) {
            return this.metrics.network.latency;
        }
        
        this.networkTester.isTestingLatency = true;
        
        try {
            const startTime = performance.now();
            
            // 간단한 ping 테스트
            const response = await fetch(url, {
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            const endTime = performance.now();
            const latency = endTime - startTime;
            
            this.metrics.network.latency = latency;
            
            return latency;
        } catch (error) {
            console.warn('네트워크 지연 테스트 실패:', error);
            return -1;
        } finally {
            this.networkTester.isTestingLatency = false;
        }
    }
    
    /**
     * 렌더링 프로파일링 시작
     */
    startRenderProfiling() {
        this.renderingProfiler.frameStartTime = performance.now();
        performance.mark('frame-start');
    }
    
    /**
     * 렌더링 프로파일링 종료
     */
    endRenderProfiling(drawCalls = 0, triangles = 0) {
        this.renderingProfiler.frameEndTime = performance.now();
        this.renderingProfiler.drawCallCount = drawCalls;
        this.renderingProfiler.triangleCount = triangles;
        
        performance.mark('frame-end');
        performance.measure('frame-render', 'frame-start', 'frame-end');
        
        // 메트릭 업데이트
        this.metrics.rendering.drawCalls = drawCalls;
        this.metrics.rendering.triangles = triangles;
    }
    
    /**
     * 알림 확인
     */
    checkAlerts() {
        const thresholds = this.config.alertThresholds;
        const currentTime = performance.now();
        
        // FPS 알림
        if (this.metrics.fps.current < thresholds.fps) {
            this.addAlert('fps', `FPS가 ${thresholds.fps} 이하로 떨어졌습니다: ${this.metrics.fps.current}`, 'warning');
        }
        
        // 메모리 알림
        if (this.metrics.memory.used > thresholds.memory) {
            this.addAlert('memory', `메모리 사용량이 ${thresholds.memory}MB를 초과했습니다: ${this.metrics.memory.used}MB`, 'warning');
        }
        
        // 네트워크 지연 알림
        if (this.metrics.network.latency > thresholds.networkLatency) {
            this.addAlert('network', `네트워크 지연이 ${thresholds.networkLatency}ms를 초과했습니다: ${this.metrics.network.latency}ms`, 'warning');
        }
        
        // CPU 사용률 알림
        if (this.metrics.cpu.usage > thresholds.cpuUsage) {
            this.addAlert('cpu', `CPU 사용률이 ${thresholds.cpuUsage}%를 초과했습니다: ${this.metrics.cpu.usage}%`, 'warning');
        }
        
        // 렌더링 시간 알림
        if (this.metrics.rendering.frameTime > thresholds.renderTime) {
            this.addAlert('rendering', `렌더링 시간이 ${thresholds.renderTime}ms를 초과했습니다: ${this.metrics.rendering.frameTime}ms`, 'warning');
        }
    }
    
    /**
     * 알림 추가
     */
    addAlert(type, message, severity = 'info') {
        const alert = {
            id: Date.now() + Math.random(),
            type: type,
            message: message,
            severity: severity,
            timestamp: performance.now(),
            acknowledged: false
        };
        
        this.alerts.push(alert);
        
        // 최대 알림 수 제한
        if (this.alerts.length > this.maxAlerts) {
            this.alerts.shift();
        }
        
        this.monitoringState.alertCount++;
        
        // 이벤트 발생
        this.triggerEvent('onAlert', alert);
        
        console.warn(`⚠️ 성능 알림 [${type}]: ${message}`);
    }
    
    /**
     * 자동 최적화 수행
     */
    performAutoOptimization() {
        const optimizations = [];
        
        // FPS 최적화
        if (this.metrics.fps.current < this.config.alertThresholds.fps) {
            optimizations.push(this.optimizeFPS());
        }
        
        // 메모리 최적화
        if (this.metrics.memory.used > this.config.alertThresholds.memory) {
            optimizations.push(this.optimizeMemory());
        }
        
        // 렌더링 최적화
        if (this.metrics.rendering.frameTime > this.config.alertThresholds.renderTime) {
            optimizations.push(this.optimizeRendering());
        }
        
        // 최적화 수행
        const appliedOptimizations = optimizations.filter(opt => opt);
        if (appliedOptimizations.length > 0) {
            this.monitoringState.optimizationCount++;
            
            this.triggerEvent('onOptimization', {
                optimizations: appliedOptimizations,
                timestamp: performance.now()
            });
            
            console.log(`🔧 자동 최적화 수행: ${appliedOptimizations.length}개 항목`);
        }
    }
    
    /**
     * FPS 최적화
     */
    optimizeFPS() {
        // 렌더링 품질 낮추기
        if (window.gameEngine && window.gameEngine.renderer) {
            const renderer = window.gameEngine.renderer;
            
            // 픽셀 비율 낮추기
            if (renderer.getPixelRatio() > 1) {
                renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() * 0.8));
                return 'pixel_ratio_reduced';
            }
            
            // 그림자 품질 낮추기
            if (renderer.shadowMap && renderer.shadowMap.enabled) {
                renderer.shadowMap.type = THREE.BasicShadowMap;
                return 'shadow_quality_reduced';
            }
        }
        
        return null;
    }
    
    /**
     * 메모리 최적화
     */
    optimizeMemory() {
        // 가비지 컬렉션 유도
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
            return 'garbage_collection';
        }
        
        // 텍스처 캐시 정리
        if (THREE && THREE.Cache) {
            THREE.Cache.clear();
            return 'texture_cache_cleared';
        }
        
        return null;
    }
    
    /**
     * 렌더링 최적화
     */
    optimizeRendering() {
        // LOD 시스템 활성화
        if (window.gameEngine && window.gameEngine.lodSystem) {
            window.gameEngine.lodSystem.setAggressiveMode(true);
            return 'lod_aggressive_mode';
        }
        
        // 파티클 시스템 최적화
        if (window.gameEngine && window.gameEngine.particleSystem) {
            window.gameEngine.particleSystem.reduceParticleCount(0.5);
            return 'particle_count_reduced';
        }
        
        return null;
    }
    
    /**
     * 메트릭 가져오기
     */
    getMetrics() {
        return {
            fps: { ...this.metrics.fps },
            memory: { ...this.metrics.memory },
            network: { ...this.metrics.network },
            rendering: { ...this.metrics.rendering },
            cpu: { ...this.metrics.cpu },
            gpu: { ...this.metrics.gpu }
        };
    }
    
    /**
     * 성능 요약 가져오기
     */
    getPerformanceSummary() {
        const currentTime = performance.now();
        const runTime = currentTime - this.monitoringState.startTime;
        
        return {
            runTime: runTime,
            updateCount: this.monitoringState.updateCount,
            alertCount: this.monitoringState.alertCount,
            optimizationCount: this.monitoringState.optimizationCount,
            averageFPS: this.metrics.fps.average,
            minFPS: this.metrics.fps.min,
            maxFPS: this.metrics.fps.max,
            currentMemoryUsage: this.metrics.memory.used,
            peakMemoryUsage: Math.max(...this.metrics.memory.history.map(h => h.used)),
            averageLatency: this.metrics.network.history.length > 0 ?
                this.metrics.network.history.reduce((sum, h) => sum + h.latency, 0) / this.metrics.network.history.length : 0,
            isPerformanceGood: this.isPerformanceGood()
        };
    }
    
    /**
     * 성능 상태 확인
     */
    isPerformanceGood() {
        const thresholds = this.config.alertThresholds;
        
        return this.metrics.fps.current >= thresholds.fps &&
               this.metrics.memory.used <= thresholds.memory &&
               this.metrics.network.latency <= thresholds.networkLatency &&
               this.metrics.cpu.usage <= thresholds.cpuUsage &&
               this.metrics.rendering.frameTime <= thresholds.renderTime;
    }
    
    /**
     * 알림 목록 가져오기
     */
    getAlerts(unacknowledgedOnly = false) {
        if (unacknowledgedOnly) {
            return this.alerts.filter(alert => !alert.acknowledged);
        }
        return [...this.alerts];
    }
    
    /**
     * 알림 확인 처리
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            return true;
        }
        return false;
    }
    
    /**
     * 모든 알림 확인 처리
     */
    acknowledgeAllAlerts() {
        this.alerts.forEach(alert => {
            alert.acknowledged = true;
        });
    }
    
    /**
     * 설정 업데이트
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // 모니터링 간격 변경 시 재시작
        if (newConfig.updateInterval && this.monitoringState.isRunning) {
            this.stopMonitoring();
            this.startMonitoring();
        }
        
        console.log('⚙️ 성능 모니터 설정 업데이트');
    }
    
    /**
     * 성능 리포트 생성
     */
    generateReport() {
        const summary = this.getPerformanceSummary();
        const metrics = this.getMetrics();
        const alerts = this.getAlerts();
        
        const report = {
            timestamp: Date.now(),
            summary: summary,
            metrics: metrics,
            alerts: alerts,
            recommendations: this.generateRecommendations()
        };
        
        // 이벤트 발생
        this.triggerEvent('onReport', report);
        
        return report;
    }
    
    /**
     * 성능 개선 권장사항 생성
     */
    generateRecommendations() {
        const recommendations = [];
        const thresholds = this.config.alertThresholds;
        
        // FPS 권장사항
        if (this.metrics.fps.average < thresholds.fps) {
            recommendations.push({
                type: 'fps',
                priority: 'high',
                message: '렌더링 품질을 낮추거나 LOD 시스템을 활용하여 FPS를 개선하세요.',
                actions: ['reduce_pixel_ratio', 'enable_lod', 'reduce_shadow_quality']
            });
        }
        
        // 메모리 권장사항
        if (this.metrics.memory.used > thresholds.memory) {
            recommendations.push({
                type: 'memory',
                priority: 'medium',
                message: '메모리 사용량을 줄이기 위해 텍스처 압축이나 오브젝트 풀링을 사용하세요.',
                actions: ['compress_textures', 'enable_object_pooling', 'clear_unused_resources']
            });
        }
        
        // 네트워크 권장사항
        if (this.metrics.network.latency > thresholds.networkLatency) {
            recommendations.push({
                type: 'network',
                priority: 'medium',
                message: '네트워크 지연을 줄이기 위해 데이터 압축이나 캐싱을 사용하세요.',
                actions: ['enable_compression', 'implement_caching', 'reduce_update_frequency']
            });
        }
        
        return recommendations;
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
     * 시스템 정리
     */
    dispose() {
        this.stopMonitoring();
        
        this.alerts = [];
        this.eventListeners = {
            onMetricsUpdate: [],
            onAlert: [],
            onOptimization: [],
            onReport: []
        };
        
        console.log('🧹 성능 모니터링 시스템 정리 완료');
    }
}