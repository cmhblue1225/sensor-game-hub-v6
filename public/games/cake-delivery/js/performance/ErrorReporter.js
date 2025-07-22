/**
 * 오류 리포팅 및 분석 시스템
 * 자동 오류 수집 및 분석, 성능 지표 기반 최적화 제안 시스템을 제공합니다.
 */
class ErrorReporter {
    constructor() {
        // 리포팅 설정
        this.config = {
            enabled: true,
            autoReport: true,
            maxErrors: 100,
            reportInterval: 30000, // 30초마다 리포트
            severityLevels: ['debug', 'info', 'warning', 'error', 'critical'],
            enableStackTrace: true,
            enableScreenshot: false,
            enableUserAgent: true,
            enablePerformanceData: true
        };
        
        // 오류 저장소
        this.errorStorage = {
            errors: [],
            reports: [],
            analytics: {
                totalErrors: 0,
                errorsByType: {},
                errorsBySource: {},
                errorTrends: [],
                performanceImpact: {}
            }
        };
        
        // 성능 임계값
        this.performanceThresholds = {
            fps: 30,
            memory: 100, // MB
            loadTime: 3000, // ms
            renderTime: 16.67 // ms
        };
        
        // 리포팅 상태
        this.reportingState = {
            isActive: false,
            lastReportTime: 0,
            reportCount: 0,
            suppressedErrors: 0
        };
        
        // 이벤트 리스너
        this.eventListeners = {
            onError: [],
            onReport: [],
            onAnalysis: [],
            onRecommendation: []
        };
        
        this.init();
    }
    
    /**
     * 시스템 초기화
     */
    init() {
        if (!this.config.enabled) {
            return;
        }
        
        this.setupErrorHandlers();
        this.startReporting();
        this.loadStoredData();
        
        console.log('✅ 오류 리포팅 시스템 초기화 완료');
    }    

    /**
     * 오류 핸들러 설정
     */
    setupErrorHandlers() {
        // 전역 오류 핸들러
        window.addEventListener('error', (event) => {
            this.captureError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                severity: 'error',
                source: 'window.error'
            });
        });
        
        // Promise 거부 핸들러
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled Promise Rejection',
                error: event.reason,
                severity: 'error',
                source: 'unhandledrejection'
            });
        });
        
        // 리소스 로드 오류 핸들러
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.captureError({
                    type: 'resource',
                    message: `Failed to load resource: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    severity: 'warning',
                    source: 'resource.error'
                });
            }
        }, true);
        
        // 네트워크 오류 감지
        this.setupNetworkErrorDetection();
    }
    
    /**
     * 네트워크 오류 감지 설정
     */
    setupNetworkErrorDetection() {
        // Fetch API 래핑
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                if (!response.ok) {
                    this.captureError({
                        type: 'network',
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        url: args[0],
                        status: response.status,
                        severity: response.status >= 500 ? 'error' : 'warning',
                        source: 'fetch.api'
                    });
                }
                
                return response;
            } catch (error) {
                this.captureError({
                    type: 'network',
                    message: `Network error: ${error.message}`,
                    url: args[0],
                    error: error,
                    severity: 'error',
                    source: 'fetch.api'
                });
                throw error;
            }
        };
        
        // XMLHttpRequest 래핑
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._errorReporter_url = url;
            this._errorReporter_method = method;
            return originalXHROpen.call(this, method, url, ...args);
        };
        
        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('error', () => {
                this.captureError({
                    type: 'network',
                    message: `XMLHttpRequest error: ${this._errorReporter_method} ${this._errorReporter_url}`,
                    url: this._errorReporter_url,
                    method: this._errorReporter_method,
                    severity: 'error',
                    source: 'xhr.api'
                });
            }.bind(this));
            
            this.addEventListener('timeout', () => {
                this.captureError({
                    type: 'network',
                    message: `XMLHttpRequest timeout: ${this._errorReporter_method} ${this._errorReporter_url}`,
                    url: this._errorReporter_url,
                    method: this._errorReporter_method,
                    severity: 'warning',
                    source: 'xhr.api'
                });
            }.bind(this));
            
            return originalXHRSend.call(this, ...args);
        };
    }
    
    /**
     * 오류 캡처
     */
    captureError(errorData) {
        if (!this.config.enabled) {
            return;
        }
        
        // 오류 데이터 보강
        const enrichedError = this.enrichErrorData(errorData);
        
        // 중복 오류 필터링
        if (this.isDuplicateError(enrichedError)) {
            this.reportingState.suppressedErrors++;
            return;
        }
        
        // 오류 저장
        this.storeError(enrichedError);
        
        // 즉시 분석
        this.analyzeError(enrichedError);
        
        // 이벤트 발생
        this.triggerEvent('onError', enrichedError);
        
        // 심각한 오류의 경우 즉시 리포트
        if (enrichedError.severity === 'critical' || enrichedError.severity === 'error') {
            this.generateImmediateReport(enrichedError);
        }
    }
    
    /**
     * 오류 데이터 보강
     */
    enrichErrorData(errorData) {
        const enriched = {
            ...errorData,
            id: this.generateErrorId(),
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: this.config.enableUserAgent ? navigator.userAgent : null,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            stackTrace: null,
            performanceData: null,
            context: this.getErrorContext()
        };
        
        // 스택 트레이스 추가
        if (this.config.enableStackTrace && errorData.error && errorData.error.stack) {
            enriched.stackTrace = this.parseStackTrace(errorData.error.stack);
        }
        
        // 성능 데이터 추가
        if (this.config.enablePerformanceData) {
            enriched.performanceData = this.getPerformanceSnapshot();
        }
        
        return enriched;
    }
    
    /**
     * 오류 ID 생성
     */
    generateErrorId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * 스택 트레이스 파싱
     */
    parseStackTrace(stack) {
        try {
            return stack.split('\n').map(line => {
                const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
                if (match) {
                    return {
                        function: match[1],
                        file: match[2],
                        line: parseInt(match[3]),
                        column: parseInt(match[4])
                    };
                }
                return { raw: line.trim() };
            }).filter(item => item.raw || item.function);
        } catch (e) {
            return [{ raw: stack }];
        }
    }
    
    /**
     * 오류 컨텍스트 수집
     */
    getErrorContext() {
        return {
            gameState: window.game ? window.game.gameState : null,
            currentLevel: window.game ? window.game.level : null,
            playerScore: window.game ? window.game.score : null,
            sessionDuration: window.game ? Date.now() - (window.game.sessionStartTime || Date.now()) : 0,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null
        };
    }
    
    /**
     * 성능 스냅샷 수집
     */
    getPerformanceSnapshot() {
        const snapshot = {
            timestamp: Date.now(),
            memory: null,
            timing: null,
            fps: null
        };
        
        // 메모리 정보
        if (performance.memory) {
            snapshot.memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        
        // 타이밍 정보
        if (performance.timing) {
            const timing = performance.timing;
            snapshot.timing = {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstPaint: timing.responseEnd - timing.requestStart
            };
        }
        
        // FPS 정보 (성능 모니터에서 가져오기)
        if (window.performanceMonitor) {
            snapshot.fps = window.performanceMonitor.metrics.fps.current;
        }
        
        return snapshot;
    }
    
    /**
     * 중복 오류 확인
     */
    isDuplicateError(errorData) {
        const recentErrors = this.errorStorage.errors.slice(-10);
        
        return recentErrors.some(existing => 
            existing.type === errorData.type &&
            existing.message === errorData.message &&
            existing.filename === errorData.filename &&
            existing.lineno === errorData.lineno &&
            Date.now() - existing.timestamp < 5000 // 5초 내 중복
        );
    }
    
    /**
     * 오류 저장
     */
    storeError(errorData) {
        this.errorStorage.errors.push(errorData);
        
        // 저장 크기 제한
        if (this.errorStorage.errors.length > this.config.maxErrors) {
            this.errorStorage.errors.shift();
        }
        
        // 통계 업데이트
        this.updateErrorStatistics(errorData);
        
        // 로컬 스토리지에 저장
        this.saveToLocalStorage();
    }
    
    /**
     * 오류 통계 업데이트
     */
    updateErrorStatistics(errorData) {
        const analytics = this.errorStorage.analytics;
        
        analytics.totalErrors++;
        
        // 타입별 통계
        if (!analytics.errorsByType[errorData.type]) {
            analytics.errorsByType[errorData.type] = 0;
        }
        analytics.errorsByType[errorData.type]++;
        
        // 소스별 통계
        if (!analytics.errorsBySource[errorData.source]) {
            analytics.errorsBySource[errorData.source] = 0;
        }
        analytics.errorsBySource[errorData.source]++;
        
        // 트렌드 데이터
        const hourKey = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
        const existingTrend = analytics.errorTrends.find(t => t.hour === hourKey);
        
        if (existingTrend) {
            existingTrend.count++;
        } else {
            analytics.errorTrends.push({
                hour: hourKey,
                count: 1
            });
        }
        
        // 트렌드 데이터 정리 (24시간만 유지)
        if (analytics.errorTrends.length > 24) {
            analytics.errorTrends.shift();
        }
    }
    
    /**
     * 오류 분석
     */
    analyzeError(errorData) {
        const analysis = {
            severity: this.calculateSeverity(errorData),
            impact: this.assessImpact(errorData),
            category: this.categorizeError(errorData),
            recommendations: this.generateRecommendations(errorData)
        };
        
        // 분석 결과 저장
        errorData.analysis = analysis;
        
        // 분석 이벤트 발생
        this.triggerEvent('onAnalysis', {
            error: errorData,
            analysis: analysis
        });
        
        return analysis;
    }
    
    /**
     * 심각도 계산
     */
    calculateSeverity(errorData) {
        let severityScore = 0;
        
        // 기본 심각도
        switch (errorData.severity) {
            case 'critical': severityScore = 100; break;
            case 'error': severityScore = 80; break;
            case 'warning': severityScore = 60; break;
            case 'info': severityScore = 40; break;
            case 'debug': severityScore = 20; break;
            default: severityScore = 50;
        }
        
        // 성능 영향 고려
        if (errorData.performanceData) {
            const perf = errorData.performanceData;
            
            if (perf.fps && perf.fps < this.performanceThresholds.fps) {
                severityScore += 20;
            }
            
            if (perf.memory && perf.memory.used > this.performanceThresholds.memory * 1024 * 1024) {
                severityScore += 15;
            }
        }
        
        // 빈도 고려
        const recentSimilarErrors = this.errorStorage.errors.filter(e => 
            e.type === errorData.type && 
            e.message === errorData.message &&
            Date.now() - e.timestamp < 300000 // 5분 내
        ).length;
        
        if (recentSimilarErrors > 5) {
            severityScore += 25;
        }
        
        return Math.min(100, severityScore);
    }
    
    /**
     * 영향도 평가
     */
    assessImpact(errorData) {
        const impact = {
            performance: 'low',
            user_experience: 'low',
            functionality: 'low',
            overall: 'low'
        };
        
        // 성능 영향
        if (errorData.performanceData) {
            const perf = errorData.performanceData;
            
            if (perf.fps && perf.fps < 20) {
                impact.performance = 'high';
            } else if (perf.fps && perf.fps < 40) {
                impact.performance = 'medium';
            }
        }
        
        // 사용자 경험 영향
        if (errorData.type === 'javascript' && errorData.severity === 'error') {
            impact.user_experience = 'high';
        } else if (errorData.type === 'network') {
            impact.user_experience = 'medium';
        }
        
        // 기능 영향
        if (errorData.source && errorData.source.includes('game')) {
            impact.functionality = 'high';
        } else if (errorData.type === 'resource') {
            impact.functionality = 'medium';
        }
        
        // 전체 영향도
        const impacts = [impact.performance, impact.user_experience, impact.functionality];
        if (impacts.includes('high')) {
            impact.overall = 'high';
        } else if (impacts.includes('medium')) {
            impact.overall = 'medium';
        }
        
        return impact;
    }
    
    /**
     * 오류 분류
     */
    categorizeError(errorData) {
        const categories = [];
        
        // 타입별 분류
        switch (errorData.type) {
            case 'javascript':
                categories.push('runtime');
                break;
            case 'network':
                categories.push('connectivity');
                break;
            case 'resource':
                categories.push('loading');
                break;
            case 'promise':
                categories.push('async');
                break;
        }
        
        // 소스별 분류
        if (errorData.source) {
            if (errorData.source.includes('game')) {
                categories.push('game-logic');
            } else if (errorData.source.includes('render')) {
                categories.push('graphics');
            } else if (errorData.source.includes('audio')) {
                categories.push('audio');
            }
        }
        
        // 메시지 기반 분류
        if (errorData.message) {
            const message = errorData.message.toLowerCase();
            
            if (message.includes('memory') || message.includes('heap')) {
                categories.push('memory');
            } else if (message.includes('network') || message.includes('fetch')) {
                categories.push('network');
            } else if (message.includes('undefined') || message.includes('null')) {
                categories.push('null-reference');
            }
        }
        
        return categories.length > 0 ? categories : ['uncategorized'];
    }
    
    /**
     * 권장사항 생성
     */
    generateRecommendations(errorData) {
        const recommendations = [];
        
        // 타입별 권장사항
        switch (errorData.type) {
            case 'javascript':
                recommendations.push('코드 검토 및 예외 처리 강화');
                if (errorData.message && errorData.message.includes('undefined')) {
                    recommendations.push('변수 초기화 및 null 체크 추가');
                }
                break;
                
            case 'network':
                recommendations.push('네트워크 연결 상태 확인');
                recommendations.push('재시도 로직 구현');
                break;
                
            case 'resource':
                recommendations.push('리소스 경로 확인');
                recommendations.push('대체 리소스 준비');
                break;
                
            case 'promise':
                recommendations.push('Promise 오류 처리 개선');
                recommendations.push('async/await 패턴 사용 고려');
                break;
        }
        
        // 성능 기반 권장사항
        if (errorData.performanceData) {
            const perf = errorData.performanceData;
            
            if (perf.fps && perf.fps < 30) {
                recommendations.push('렌더링 최적화 필요');
                recommendations.push('프레임 드롭 원인 분석');
            }
            
            if (perf.memory && perf.memory.used > 100 * 1024 * 1024) {
                recommendations.push('메모리 사용량 최적화');
                recommendations.push('메모리 누수 점검');
            }
        }
        
        // 빈도 기반 권장사항
        const similarErrors = this.errorStorage.errors.filter(e => 
            e.type === errorData.type && 
            e.message === errorData.message
        ).length;
        
        if (similarErrors > 3) {
            recommendations.push('반복되는 오류 - 근본 원인 해결 필요');
        }
        
        return recommendations;
    }
    
    /**
     * 즉시 리포트 생성
     */
    generateImmediateReport(errorData) {
        const report = {
            type: 'immediate',
            timestamp: Date.now(),
            error: errorData,
            context: this.getSystemContext(),
            recommendations: errorData.analysis ? errorData.analysis.recommendations : []
        };
        
        this.errorStorage.reports.push(report);
        
        // 이벤트 발생
        this.triggerEvent('onReport', report);
        
        console.error('🚨 즉시 오류 리포트:', report);
        
        return report;
    }
    
    /**
     * 시스템 컨텍스트 수집
     */
    getSystemContext() {
        return {
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            performance: this.getPerformanceSnapshot(),
            gameState: window.game ? {
                state: window.game.gameState,
                level: window.game.level,
                score: window.game.score
            } : null
        };
    }
    
    /**
     * 리포팅 시작
     */
    startReporting() {
        if (this.reportingState.isActive) {
            return;
        }
        
        this.reportingState.isActive = true;
        
        // 정기 리포트 생성
        setInterval(() => {
            this.generatePeriodicReport();
        }, this.config.reportInterval);
        
        console.log(`📊 오류 리포팅 시작 (${this.config.reportInterval / 1000}초 간격)`);
    }
    
    /**
     * 정기 리포트 생성
     */
    generatePeriodicReport() {
        if (this.errorStorage.errors.length === 0) {
            return;
        }
        
        const report = {
            type: 'periodic',
            timestamp: Date.now(),
            period: {
                start: this.reportingState.lastReportTime || Date.now() - this.config.reportInterval,
                end: Date.now()
            },
            summary: this.generateErrorSummary(),
            analytics: { ...this.errorStorage.analytics },
            recommendations: this.generateSystemRecommendations()
        };
        
        this.errorStorage.reports.push(report);
        this.reportingState.lastReportTime = Date.now();
        this.reportingState.reportCount++;
        
        // 이벤트 발생
        this.triggerEvent('onReport', report);
        
        // 리포트 크기 제한
        if (this.errorStorage.reports.length > 50) {
            this.errorStorage.reports.shift();
        }
        
        console.log('📊 정기 오류 리포트 생성:', report.summary);
    }
    
    /**
     * 오류 요약 생성
     */
    generateErrorSummary() {
        const recentErrors = this.errorStorage.errors.filter(e => 
            Date.now() - e.timestamp < this.config.reportInterval
        );
        
        const summary = {
            total: recentErrors.length,
            byType: {},
            bySeverity: {},
            topErrors: []
        };
        
        // 타입별 집계
        recentErrors.forEach(error => {
            summary.byType[error.type] = (summary.byType[error.type] || 0) + 1;
            summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1;
        });
        
        // 상위 오류 추출
        const errorGroups = {};
        recentErrors.forEach(error => {
            const key = `${error.type}:${error.message}`;
            if (!errorGroups[key]) {
                errorGroups[key] = { count: 0, example: error };
            }
            errorGroups[key].count++;
        });
        
        summary.topErrors = Object.values(errorGroups)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(group => ({
                message: group.example.message,
                type: group.example.type,
                count: group.count,
                severity: group.example.severity
            }));
        
        return summary;
    }
    
    /**
     * 시스템 권장사항 생성
     */
    generateSystemRecommendations() {
        const recommendations = [];
        const analytics = this.errorStorage.analytics;
        
        // 오류 빈도 분석
        if (analytics.totalErrors > 50) {
            recommendations.push({
                type: 'high_error_rate',
                priority: 'high',
                message: '오류 발생률이 높습니다. 전반적인 코드 품질 검토가 필요합니다.',
                action: 'code_review'
            });
        }
        
        // 타입별 분석
        Object.entries(analytics.errorsByType).forEach(([type, count]) => {
            if (count > 10) {
                switch (type) {
                    case 'network':
                        recommendations.push({
                            type: 'network_issues',
                            priority: 'medium',
                            message: '네트워크 오류가 빈번합니다. 연결 안정성을 확인하세요.',
                            action: 'network_optimization'
                        });
                        break;
                    case 'javascript':
                        recommendations.push({
                            type: 'runtime_errors',
                            priority: 'high',
                            message: 'JavaScript 런타임 오류가 많습니다. 코드 검토가 필요합니다.',
                            action: 'code_debugging'
                        });
                        break;
                    case 'resource':
                        recommendations.push({
                            type: 'resource_loading',
                            priority: 'medium',
                            message: '리소스 로딩 오류가 발생하고 있습니다. 파일 경로를 확인하세요.',
                            action: 'resource_audit'
                        });
                        break;
                }
            }
        });
        
        return recommendations;
    }
    
    /**
     * 로컬 스토리지에 저장
     */
    saveToLocalStorage() {
        try {
            const dataToSave = {
                errors: this.errorStorage.errors.slice(-20), // 최근 20개만 저장
                analytics: this.errorStorage.analytics,
                lastSaved: Date.now()
            };
            
            localStorage.setItem('cakeDelivery_errorReports', JSON.stringify(dataToSave));
        } catch (error) {
            console.warn('오류 데이터 저장 실패:', error);
        }
    }
    
    /**
     * 저장된 데이터 로드
     */
    loadStoredData() {
        try {
            const savedData = localStorage.getItem('cakeDelivery_errorReports');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                if (data.errors) {
                    this.errorStorage.errors = data.errors;
                }
                
                if (data.analytics) {
                    this.errorStorage.analytics = { ...this.errorStorage.analytics, ...data.analytics };
                }
            }
        } catch (error) {
            console.warn('저장된 오류 데이터 로드 실패:', error);
        }
    }
    
    /**
     * 수동 오류 리포트
     */
    reportError(message, details = {}) {
        this.captureError({
            type: 'manual',
            message: message,
            severity: details.severity || 'info',
            source: 'manual.report',
            ...details
        });
    }
    
    /**
     * 오류 통계 가져오기
     */
    getErrorStatistics() {
        return {
            ...this.errorStorage.analytics,
            recentErrors: this.errorStorage.errors.slice(-10),
            reportingState: { ...this.reportingState }
        };
    }
    
    /**
     * 리포트 목록 가져오기
     */
    getReports(limit = 10) {
        return this.errorStorage.reports.slice(-limit);
    }
    
    /**
     * 설정 업데이트
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (!this.config.enabled) {
            this.reportingState.isActive = false;
        }
        
        console.log('⚙️ 오류 리포터 설정 업데이트');
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
                    // 이벤트 리스너에서 오류가 발생해도 무한 루프 방지
                    console.error(`이벤트 리스너 실행 오류 (${eventType}):`, error);
                }
            });
        }
    }
    
    /**
     * 시스템 정리
     */
    dispose() {
        this.reportingState.isActive = false;
        
        // 마지막 데이터 저장
        this.saveToLocalStorage();
        
        // 이벤트 리스너 정리
        this.eventListeners = {
            onError: [],
            onReport: [],
            onAnalysis: [],
            onRecommendation: []
        };
        
        console.log('🧹 오류 리포팅 시스템 정리 완료');
    }
}