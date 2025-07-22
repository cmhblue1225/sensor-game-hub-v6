/**
 * 오류 처리 시스템
 * 게임 내 발생하는 오류를 처리하고 복구를 시도합니다.
 */
class ErrorHandlingSystem {
    constructor() {
        this.errorLog = [];
        this.recoveryStrategies = new Map();
        this.notificationCallbacks = [];
        this.debugMode = false;
        
        console.log('✅ 오류 처리 시스템 초기화 완료');
    }
    
    /**
     * 오류 처리
     */
    handleError(error, context = {}) {
        const errorInfo = {
            message: error.message || error,
            type: error.name || 'UnknownError',
            severity: context.severity || 'error',
            timestamp: Date.now(),
            context: context,
            recovered: false
        };
        
        this.errorLog.push(errorInfo);
        
        // 복구 시도
        const strategy = this.recoveryStrategies.get(errorInfo.type);
        if (strategy) {
            try {
                errorInfo.recovered = strategy(error, context);
            } catch (recoveryError) {
                console.error('복구 전략 실행 실패:', recoveryError);
            }
        }
        
        // 알림 콜백 실행
        this.notificationCallbacks.forEach(callback => {
            try {
                callback(errorInfo);
            } catch (callbackError) {
                console.error('알림 콜백 실행 실패:', callbackError);
            }
        });
        
        if (this.debugMode) {
            console.error('오류 처리:', errorInfo);
        }
        
        return errorInfo.recovered;
    }
    
    /**
     * 복구 전략 등록
     */
    registerRecoveryStrategy(errorType, strategy) {
        this.recoveryStrategies.set(errorType, strategy);
    }
    
    /**
     * 알림 콜백 등록
     */
    registerNotificationCallback(callback) {
        this.notificationCallbacks.push(callback);
    }
    
    /**
     * 디버그 모드 설정
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    
    /**
     * 오류 로그 가져오기
     */
    getErrorLog() {
        return this.errorLog;
    }
    
    /**
     * 오류 로그 정리
     */
    clearErrorLog() {
        this.errorLog = [];
    }
}