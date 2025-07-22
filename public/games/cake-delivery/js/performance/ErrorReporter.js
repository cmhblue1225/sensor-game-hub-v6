/**
 * 오류 리포팅 시스템
 * 게임 내 발생하는 오류를 수집하고 분석합니다.
 */
class ErrorReporter {
    constructor() {
        this.errorStorage = {
            errors: [],
            analytics: {
                totalErrors: 0,
                errorsByType: {},
                errorsByTime: {}
            }
        };
        
        this.config = {
            maxErrors: 100,
            reportInterval: 60000, // 1분
            enableAutoReporting: true
        };
        
        this.eventListeners = new Map();
        
        // 자동 리포팅 시작
        if (this.config.enableAutoReporting) {
            this.startAutoReporting();
        }
        
        console.log('✅ 오류 리포팅 시스템 초기화 완료');
    }
    
    /**
     * 오류 캡처
     */
    captureError(errorData) {
        const error = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            type: errorData.type || 'unknown',
            message: errorData.message || 'Unknown error',
            severity: errorData.severity || 'error',
            source: errorData.source || 'game',
            stack: errorData.stack || null,
            context: errorData.context || {}
        };
        
        // 오류 저장
        this.errorStorage.errors.push(error);
        
        // 저장 한도 관리
        if (this.errorStorage.errors.length > this.config.maxErrors) {
            this.errorStorage.errors.shift();
        }
        
        // 통계 업데이트
        this.updateAnalytics(error);
        
        // 오류 이벤트 발생
        this.dispatchEvent('onError', error);
        
        console.warn('🚨 오류 캡처:', error.message);
    }
    
    /**
     * 통계 업데이트
     */
    updateAnalytics(error) {
        this.errorStorage.analytics.totalErrors++;
        
        // 타입별 통계
        if (!this.errorStorage.analytics.errorsByType[error.type]) {
            this.errorStorage.analytics.errorsByType[error.type] = 0;
        }
        this.errorStorage.analytics.errorsByType[error.type]++;
        
        // 시간별 통계 (시간 단위)
        const hour = new Date(error.timestamp).getHours();
        if (!this.errorStorage.analytics.errorsByTime[hour]) {
            this.errorStorage.analytics.errorsByTime[hour] = 0;
        }
        this.errorStorage.analytics.errorsByTime[hour]++;
    }
    
    /**
     * 자동 리포팅 시작
     */
    startAutoReporting() {
        this.reportInterval = setInterval(() => {
            this.generatePeriodicReport();
        }, this.config.reportInterval);
    }
    
    /**
     * 정기 리포트 생성
     */
    generatePeriodicReport() {
        const report = {
            type: 'periodic',
            timestamp: Date.now(),
            summary: {
                total: this.errorStorage.analytics.totalErrors,
                recent: this.errorStorage.errors.filter(e => 
                    Date.now() - e.timestamp < this.config.reportInterval
                ).length,
                topErrors: this.getTopErrors(5)
            },
            analytics: this.errorStorage.analytics
        };
        
        // 리포트 이벤트 발생
        this.dispatchEvent('onReport', report);
        
        console.log('📊 정기 오류 리포트 생성:', report.summary);
    }
    
    /**
     * 상위 오류 가져오기
     */
    getTopErrors(limit = 5) {
        const errorCounts = {};
        
        this.errorStorage.errors.forEach(error => {
            const key = `${error.type}: ${error.message}`;
            errorCounts[key] = (errorCounts[key] || 0) + 1;
        });
        
        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([message, count]) => ({ message, count }));
    }
    
    /**
     * 오류 분석
     */
    analyzeErrors() {
        const analysis = {
            impact: {
                performance: 'low',
                stability: 'low',
                user_experience: 'low'
            },
            recommendations: []
        };
        
        // 심각한 오류 비율 확인
        const criticalErrors = this.errorStorage.errors.filter(e => e.severity === 'critical').length;
        const criticalRatio = criticalErrors / this.errorStorage.errors.length;
        
        if (criticalRatio > 0.1) {
            analysis.impact.stability = 'high';
            analysis.recommendations.push('심각한 오류가 많이 발생하고 있습니다. 안정성 개선이 필요합니다.');
        }
        
        // 성능 관련 오류 확인
        const performanceErrors = this.errorStorage.errors.filter(e => 
            e.type.includes('Performance') || e.message.includes('performance')
        ).length;
        
        if (performanceErrors > 5) {
            analysis.impact.performance = 'high';
            analysis.recommendations.push('성능 관련 오류가 발생하고 있습니다. 최적화가 필요합니다.');
        }
        
        // 분석 이벤트 발생
        this.dispatchEvent('onAnalysis', { analysis });
        
        return analysis;
    }
    
    /**
     * 오류 데이터 가져오기
     */
    getErrorData() {
        return this.errorStorage;
    }
    
    /**
     * 오류 데이터 정리
     */
    clearErrors() {
        this.errorStorage.errors = [];
        this.errorStorage.analytics = {
            totalErrors: 0,
            errorsByType: {},
            errorsByTime: {}
        };
        
        console.log('🧹 오류 데이터 정리 완료');
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
                    console.error(`오류 리포터 이벤트 오류 (${eventType}):`, error);
                }
            });
        }
    }
    
    /**
     * 정리
     */
    cleanup() {
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
        }
        
        console.log('🧹 오류 리포팅 시스템 정리 완료');
    }
}