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
     */\n    startMonitoring() {\n        if (this.monitoringState.isRunning) {\n            console.warn('성능 모니터링이 이미 실행 중입니다.');\n            return;\n        }\n        \n        this.monitoringState.isRunning = true;\n        this.monitoringState.startTime = performance.now();\n        this.monitoringState.lastUpdateTime = this.monitoringState.startTime;\n        \n        // FPS 측정 시작\n        this.startFPSMonitoring();\n        \n        // 정기 업데이트 시작\n        this.monitoringTimer = setInterval(() => {\n            this.updateMetrics();\n        }, this.config.updateInterval);\n        \n        console.log('📊 성능 모니터링 시작');\n    }\n    \n    /**\n     * 모니터링 중지\n     */\n    stopMonitoring() {\n        if (!this.monitoringState.isRunning) {\n            return;\n        }\n        \n        this.monitoringState.isRunning = false;\n        \n        if (this.monitoringTimer) {\n            clearInterval(this.monitoringTimer);\n            this.monitoringTimer = null;\n        }\n        \n        console.log('📊 성능 모니터링 중지');\n    }\n    \n    /**\n     * FPS 모니터링 시작\n     */\n    startFPSMonitoring() {\n        const measureFPS = (timestamp) => {\n            if (!this.monitoringState.isRunning) return;\n            \n            // FPS 계산\n            if (this.fpsCounter.lastTime === 0) {\n                this.fpsCounter.lastTime = timestamp;\n            }\n            \n            this.fpsCounter.frameCount++;\n            \n            const deltaTime = timestamp - this.fpsCounter.lastTime;\n            if (deltaTime >= 1000) { // 1초마다 FPS 계산\n                this.fpsCounter.currentFPS = Math.round((this.fpsCounter.frameCount * 1000) / deltaTime);\n                this.updateFPSMetrics(this.fpsCounter.currentFPS);\n                \n                this.fpsCounter.frameCount = 0;\n                this.fpsCounter.lastTime = timestamp;\n            }\n            \n            requestAnimationFrame(measureFPS);\n        };\n        \n        requestAnimationFrame(measureFPS);\n    }\n    \n    /**\n     * 메트릭 업데이트\n     */\n    updateMetrics() {\n        const currentTime = performance.now();\n        \n        // 메모리 메트릭 업데이트\n        this.updateMemoryMetrics();\n        \n        // 네트워크 메트릭 업데이트\n        this.updateNetworkMetrics();\n        \n        // CPU 메트릭 업데이트 (추정)\n        this.updateCPUMetrics();\n        \n        // GPU 메트릭 업데이트 (추정)\n        this.updateGPUMetrics();\n        \n        // 알림 확인\n        this.checkAlerts();\n        \n        // 자동 최적화\n        if (this.config.autoOptimize) {\n            this.performAutoOptimization();\n        }\n        \n        // 이벤트 발생\n        this.triggerEvent('onMetricsUpdate', {\n            metrics: this.getMetrics(),\n            timestamp: currentTime\n        });\n        \n        this.monitoringState.lastUpdateTime = currentTime;\n        this.monitoringState.updateCount++;\n    }\n    \n    /**\n     * FPS 메트릭 업데이트\n     */\n    updateFPSMetrics(fps) {\n        const fpsMetric = this.metrics.fps;\n        \n        fpsMetric.current = fps;\n        fpsMetric.min = Math.min(fpsMetric.min, fps);\n        fpsMetric.max = Math.max(fpsMetric.max, fps);\n        \n        // 히스토리 업데이트\n        fpsMetric.history.push({\n            value: fps,\n            timestamp: performance.now()\n        });\n        \n        // 히스토리 크기 제한\n        if (fpsMetric.history.length > this.config.historySize) {\n            fpsMetric.history.shift();\n        }\n        \n        // 평균 계산\n        if (fpsMetric.history.length > 0) {\n            fpsMetric.average = fpsMetric.history.reduce((sum, entry) => sum + entry.value, 0) / fpsMetric.history.length;\n        }\n    }\n    \n    /**\n     * 메모리 메트릭 업데이트\n     */\n    updateMemoryMetrics() {\n        if ('memory' in performance) {\n            const memory = performance.memory;\n            const memoryMetric = this.metrics.memory;\n            \n            memoryMetric.used = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB\n            memoryMetric.total = Math.round(memory.totalJSHeapSize / 1024 / 1024); // MB\n            memoryMetric.percentage = memoryMetric.total > 0 ? \n                Math.round((memoryMetric.used / memoryMetric.total) * 100) : 0;\n            \n            // 히스토리 업데이트\n            memoryMetric.history.push({\n                used: memoryMetric.used,\n                total: memoryMetric.total,\n                percentage: memoryMetric.percentage,\n                timestamp: performance.now()\n            });\n            \n            // 히스토리 크기 제한\n            if (memoryMetric.history.length > this.config.historySize) {\n                memoryMetric.history.shift();\n            }\n        }\n    }\n    \n    /**\n     * 네트워크 메트릭 업데이트\n     */\n    updateNetworkMetrics() {\n        if ('connection' in navigator) {\n            const connection = navigator.connection;\n            const networkMetric = this.metrics.network;\n            \n            // 대역폭 정보\n            if (connection.downlink !== undefined) {\n                networkMetric.bandwidth = connection.downlink; // Mbps\n            }\n            \n            // 연결 타입 정보\n            networkMetric.connectionType = connection.effectiveType || connection.type;\n            \n            // 히스토리 업데이트\n            networkMetric.history.push({\n                bandwidth: networkMetric.bandwidth,\n                latency: networkMetric.latency,\n                connectionType: networkMetric.connectionType,\n                timestamp: performance.now()\n            });\n            \n            // 히스토리 크기 제한\n            if (networkMetric.history.length > this.config.historySize) {\n                networkMetric.history.shift();\n            }\n        }\n    }\n    \n    /**\n     * CPU 메트릭 업데이트 (추정)\n     */\n    updateCPUMetrics() {\n        const cpuMetric = this.metrics.cpu;\n        \n        // CPU 사용률 추정 (FPS와 렌더링 시간 기반)\n        const fpsRatio = this.metrics.fps.current / 60; // 60fps 기준\n        const renderTimeRatio = this.metrics.rendering.frameTime / 16.67; // 16.67ms 기준\n        \n        cpuMetric.usage = Math.min(100, Math.max(0, \n            (1 - fpsRatio + renderTimeRatio) * 50\n        ));\n        \n        // 히스토리 업데이트\n        cpuMetric.history.push({\n            usage: cpuMetric.usage,\n            timestamp: performance.now()\n        });\n        \n        // 히스토리 크기 제한\n        if (cpuMetric.history.length > this.config.historySize) {\n            cpuMetric.history.shift();\n        }\n    }\n    \n    /**\n     * GPU 메트릭 업데이트 (추정)\n     */\n    updateGPUMetrics() {\n        const gpuMetric = this.metrics.gpu;\n        \n        // GPU 사용률 추정 (렌더링 메트릭 기반)\n        const drawCallRatio = Math.min(1, this.metrics.rendering.drawCalls / 1000);\n        const triangleRatio = Math.min(1, this.metrics.rendering.triangles / 100000);\n        \n        gpuMetric.usage = Math.round((drawCallRatio + triangleRatio) * 50);\n        \n        // 히스토리 업데이트\n        gpuMetric.history.push({\n            usage: gpuMetric.usage,\n            memory: gpuMetric.memory,\n            timestamp: performance.now()\n        });\n        \n        // 히스토리 크기 제한\n        if (gpuMetric.history.length > this.config.historySize) {\n            gpuMetric.history.shift();\n        }\n    }\n    \n    /**\n     * 렌더링 메트릭 기록\n     */\n    recordRenderingMetric(entry) {\n        const renderingMetric = this.metrics.rendering;\n        \n        if (entry.name === 'frame-render') {\n            renderingMetric.frameTime = entry.duration;\n            \n            // 히스토리 업데이트\n            renderingMetric.history.push({\n                frameTime: renderingMetric.frameTime,\n                drawCalls: renderingMetric.drawCalls,\n                triangles: renderingMetric.triangles,\n                timestamp: performance.now()\n            });\n            \n            // 히스토리 크기 제한\n            if (renderingMetric.history.length > this.config.historySize) {\n                renderingMetric.history.shift();\n            }\n        }\n    }\n    \n    /**\n     * 네트워크 메트릭 기록\n     */\n    recordNetworkMetric(entry) {\n        const networkMetric = this.metrics.network;\n        \n        if (entry.responseEnd && entry.requestStart) {\n            const latency = entry.responseEnd - entry.requestStart;\n            networkMetric.latency = Math.max(networkMetric.latency, latency);\n        }\n    }\n    \n    /**\n     * 네트워크 지연 테스트\n     */\n    async testNetworkLatency(url = '/api/ping') {\n        if (this.networkTester.isTestingLatency) {\n            return this.metrics.network.latency;\n        }\n        \n        this.networkTester.isTestingLatency = true;\n        \n        try {\n            const startTime = performance.now();\n            \n            // 간단한 ping 테스트\n            const response = await fetch(url, {\n                method: 'HEAD',\n                cache: 'no-cache'\n            });\n            \n            const endTime = performance.now();\n            const latency = endTime - startTime;\n            \n            this.metrics.network.latency = latency;\n            \n            return latency;\n        } catch (error) {\n            console.warn('네트워크 지연 테스트 실패:', error);\n            return -1;\n        } finally {\n            this.networkTester.isTestingLatency = false;\n        }\n    }\n    \n    /**\n     * 렌더링 프로파일링 시작\n     */\n    startRenderProfiling() {\n        this.renderingProfiler.frameStartTime = performance.now();\n        performance.mark('frame-start');\n    }\n    \n    /**\n     * 렌더링 프로파일링 종료\n     */\n    endRenderProfiling(drawCalls = 0, triangles = 0) {\n        this.renderingProfiler.frameEndTime = performance.now();\n        this.renderingProfiler.drawCallCount = drawCalls;\n        this.renderingProfiler.triangleCount = triangles;\n        \n        performance.mark('frame-end');\n        performance.measure('frame-render', 'frame-start', 'frame-end');\n        \n        // 메트릭 업데이트\n        this.metrics.rendering.drawCalls = drawCalls;\n        this.metrics.rendering.triangles = triangles;\n    }\n    \n    /**\n     * 알림 확인\n     */\n    checkAlerts() {\n        const thresholds = this.config.alertThresholds;\n        const currentTime = performance.now();\n        \n        // FPS 알림\n        if (this.metrics.fps.current < thresholds.fps) {\n            this.addAlert('fps', `FPS가 ${thresholds.fps} 이하로 떨어졌습니다: ${this.metrics.fps.current}`, 'warning');\n        }\n        \n        // 메모리 알림\n        if (this.metrics.memory.used > thresholds.memory) {\n            this.addAlert('memory', `메모리 사용량이 ${thresholds.memory}MB를 초과했습니다: ${this.metrics.memory.used}MB`, 'warning');\n        }\n        \n        // 네트워크 지연 알림\n        if (this.metrics.network.latency > thresholds.networkLatency) {\n            this.addAlert('network', `네트워크 지연이 ${thresholds.networkLatency}ms를 초과했습니다: ${this.metrics.network.latency}ms`, 'warning');\n        }\n        \n        // CPU 사용률 알림\n        if (this.metrics.cpu.usage > thresholds.cpuUsage) {\n            this.addAlert('cpu', `CPU 사용률이 ${thresholds.cpuUsage}%를 초과했습니다: ${this.metrics.cpu.usage}%`, 'warning');\n        }\n        \n        // 렌더링 시간 알림\n        if (this.metrics.rendering.frameTime > thresholds.renderTime) {\n            this.addAlert('rendering', `렌더링 시간이 ${thresholds.renderTime}ms를 초과했습니다: ${this.metrics.rendering.frameTime}ms`, 'warning');\n        }\n    }\n    \n    /**\n     * 알림 추가\n     */\n    addAlert(type, message, severity = 'info') {\n        const alert = {\n            id: Date.now() + Math.random(),\n            type: type,\n            message: message,\n            severity: severity,\n            timestamp: performance.now(),\n            acknowledged: false\n        };\n        \n        this.alerts.push(alert);\n        \n        // 최대 알림 수 제한\n        if (this.alerts.length > this.maxAlerts) {\n            this.alerts.shift();\n        }\n        \n        this.monitoringState.alertCount++;\n        \n        // 이벤트 발생\n        this.triggerEvent('onAlert', alert);\n        \n        console.warn(`⚠️ 성능 알림 [${type}]: ${message}`);\n    }\n    \n    /**\n     * 자동 최적화 수행\n     */\n    performAutoOptimization() {\n        const optimizations = [];\n        \n        // FPS 최적화\n        if (this.metrics.fps.current < this.config.alertThresholds.fps) {\n            optimizations.push(this.optimizeFPS());\n        }\n        \n        // 메모리 최적화\n        if (this.metrics.memory.used > this.config.alertThresholds.memory) {\n            optimizations.push(this.optimizeMemory());\n        }\n        \n        // 렌더링 최적화\n        if (this.metrics.rendering.frameTime > this.config.alertThresholds.renderTime) {\n            optimizations.push(this.optimizeRendering());\n        }\n        \n        // 최적화 수행\n        const appliedOptimizations = optimizations.filter(opt => opt);\n        if (appliedOptimizations.length > 0) {\n            this.monitoringState.optimizationCount++;\n            \n            this.triggerEvent('onOptimization', {\n                optimizations: appliedOptimizations,\n                timestamp: performance.now()\n            });\n            \n            console.log(`🔧 자동 최적화 수행: ${appliedOptimizations.length}개 항목`);\n        }\n    }\n    \n    /**\n     * FPS 최적화\n     */\n    optimizeFPS() {\n        // 렌더링 품질 낮추기\n        if (window.gameEngine && window.gameEngine.renderer) {\n            const renderer = window.gameEngine.renderer;\n            \n            // 픽셀 비율 낮추기\n            if (renderer.getPixelRatio() > 1) {\n                renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() * 0.8));\n                return 'pixel_ratio_reduced';\n            }\n            \n            // 그림자 품질 낮추기\n            if (renderer.shadowMap && renderer.shadowMap.enabled) {\n                renderer.shadowMap.type = THREE.BasicShadowMap;\n                return 'shadow_quality_reduced';\n            }\n        }\n        \n        return null;\n    }\n    \n    /**\n     * 메모리 최적화\n     */\n    optimizeMemory() {\n        // 가비지 컬렉션 유도\n        if (window.gc && typeof window.gc === 'function') {\n            window.gc();\n            return 'garbage_collection';\n        }\n        \n        // 텍스처 캐시 정리\n        if (THREE && THREE.Cache) {\n            THREE.Cache.clear();\n            return 'texture_cache_cleared';\n        }\n        \n        return null;\n    }\n    \n    /**\n     * 렌더링 최적화\n     */\n    optimizeRendering() {\n        // LOD 시스템 활성화\n        if (window.gameEngine && window.gameEngine.lodSystem) {\n            window.gameEngine.lodSystem.setAggressiveMode(true);\n            return 'lod_aggressive_mode';\n        }\n        \n        // 파티클 시스템 최적화\n        if (window.gameEngine && window.gameEngine.particleSystem) {\n            window.gameEngine.particleSystem.reduceParticleCount(0.5);\n            return 'particle_count_reduced';\n        }\n        \n        return null;\n    }\n    \n    /**\n     * 메트릭 가져오기\n     */\n    getMetrics() {\n        return {\n            fps: { ...this.metrics.fps },\n            memory: { ...this.metrics.memory },\n            network: { ...this.metrics.network },\n            rendering: { ...this.metrics.rendering },\n            cpu: { ...this.metrics.cpu },\n            gpu: { ...this.metrics.gpu }\n        };\n    }\n    \n    /**\n     * 성능 요약 가져오기\n     */\n    getPerformanceSummary() {\n        const currentTime = performance.now();\n        const runTime = currentTime - this.monitoringState.startTime;\n        \n        return {\n            runTime: runTime,\n            updateCount: this.monitoringState.updateCount,\n            alertCount: this.monitoringState.alertCount,\n            optimizationCount: this.monitoringState.optimizationCount,\n            averageFPS: this.metrics.fps.average,\n            minFPS: this.metrics.fps.min,\n            maxFPS: this.metrics.fps.max,\n            currentMemoryUsage: this.metrics.memory.used,\n            peakMemoryUsage: Math.max(...this.metrics.memory.history.map(h => h.used)),\n            averageLatency: this.metrics.network.history.length > 0 ?\n                this.metrics.network.history.reduce((sum, h) => sum + h.latency, 0) / this.metrics.network.history.length : 0,\n            isPerformanceGood: this.isPerformanceGood()\n        };\n    }\n    \n    /**\n     * 성능 상태 확인\n     */\n    isPerformanceGood() {\n        const thresholds = this.config.alertThresholds;\n        \n        return this.metrics.fps.current >= thresholds.fps &&\n               this.metrics.memory.used <= thresholds.memory &&\n               this.metrics.network.latency <= thresholds.networkLatency &&\n               this.metrics.cpu.usage <= thresholds.cpuUsage &&\n               this.metrics.rendering.frameTime <= thresholds.renderTime;\n    }\n    \n    /**\n     * 알림 목록 가져오기\n     */\n    getAlerts(unacknowledgedOnly = false) {\n        if (unacknowledgedOnly) {\n            return this.alerts.filter(alert => !alert.acknowledged);\n        }\n        return [...this.alerts];\n    }\n    \n    /**\n     * 알림 확인 처리\n     */\n    acknowledgeAlert(alertId) {\n        const alert = this.alerts.find(a => a.id === alertId);\n        if (alert) {\n            alert.acknowledged = true;\n            return true;\n        }\n        return false;\n    }\n    \n    /**\n     * 모든 알림 확인 처리\n     */\n    acknowledgeAllAlerts() {\n        this.alerts.forEach(alert => {\n            alert.acknowledged = true;\n        });\n    }\n    \n    /**\n     * 설정 업데이트\n     */\n    updateConfig(newConfig) {\n        this.config = { ...this.config, ...newConfig };\n        \n        // 모니터링 간격 변경 시 재시작\n        if (newConfig.updateInterval && this.monitoringState.isRunning) {\n            this.stopMonitoring();\n            this.startMonitoring();\n        }\n        \n        console.log('⚙️ 성능 모니터 설정 업데이트');\n    }\n    \n    /**\n     * 성능 리포트 생성\n     */\n    generateReport() {\n        const summary = this.getPerformanceSummary();\n        const metrics = this.getMetrics();\n        const alerts = this.getAlerts();\n        \n        const report = {\n            timestamp: Date.now(),\n            summary: summary,\n            metrics: metrics,\n            alerts: alerts,\n            recommendations: this.generateRecommendations()\n        };\n        \n        // 이벤트 발생\n        this.triggerEvent('onReport', report);\n        \n        return report;\n    }\n    \n    /**\n     * 성능 개선 권장사항 생성\n     */\n    generateRecommendations() {\n        const recommendations = [];\n        const thresholds = this.config.alertThresholds;\n        \n        // FPS 권장사항\n        if (this.metrics.fps.average < thresholds.fps) {\n            recommendations.push({\n                type: 'fps',\n                priority: 'high',\n                message: '렌더링 품질을 낮추거나 LOD 시스템을 활용하여 FPS를 개선하세요.',\n                actions: ['reduce_pixel_ratio', 'enable_lod', 'reduce_shadow_quality']\n            });\n        }\n        \n        // 메모리 권장사항\n        if (this.metrics.memory.used > thresholds.memory) {\n            recommendations.push({\n                type: 'memory',\n                priority: 'medium',\n                message: '메모리 사용량을 줄이기 위해 텍스처 압축이나 오브젝트 풀링을 사용하세요.',\n                actions: ['compress_textures', 'enable_object_pooling', 'clear_unused_resources']\n            });\n        }\n        \n        // 네트워크 권장사항\n        if (this.metrics.network.latency > thresholds.networkLatency) {\n            recommendations.push({\n                type: 'network',\n                priority: 'medium',\n                message: '네트워크 지연을 줄이기 위해 데이터 압축이나 캐싱을 사용하세요.',\n                actions: ['enable_compression', 'implement_caching', 'reduce_update_frequency']\n            });\n        }\n        \n        return recommendations;\n    }\n    \n    /**\n     * 이벤트 리스너 등록\n     */\n    addEventListener(eventType, callback) {\n        if (this.eventListeners[eventType] && typeof callback === 'function') {\n            this.eventListeners[eventType].push(callback);\n        }\n    }\n    \n    /**\n     * 이벤트 리스너 제거\n     */\n    removeEventListener(eventType, callback) {\n        if (this.eventListeners[eventType]) {\n            this.eventListeners[eventType] = this.eventListeners[eventType]\n                .filter(listener => listener !== callback);\n        }\n    }\n    \n    /**\n     * 이벤트 발생\n     */\n    triggerEvent(eventType, data) {\n        if (this.eventListeners[eventType]) {\n            this.eventListeners[eventType].forEach(callback => {\n                try {\n                    callback(data);\n                } catch (error) {\n                    console.error(`이벤트 리스너 실행 오류 (${eventType}):`, error);\n                }\n            });\n        }\n    }\n    \n    /**\n     * 시스템 정리\n     */\n    dispose() {\n        this.stopMonitoring();\n        \n        this.alerts = [];\n        this.eventListeners = {\n            onMetricsUpdate: [],\n            onAlert: [],\n            onOptimization: [],\n            onReport: []\n        };\n        \n        console.log('🧹 성능 모니터링 시스템 정리 완료');\n    }\n}