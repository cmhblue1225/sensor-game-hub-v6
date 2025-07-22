/**
 * 오류 감지 및 복구 시스템
 * 게임 실행 중 발생하는 오류를 감지하고 가능한 경우 복구합니다.
 */
class ErrorHandlingSystem {
    constructor() {
        // 오류 로그 및 통계
        this.errorLog = [];
        this.errorStats = {
            total: 0,
            recovered: 0,
            critical: 0,
            byCategory: {}
        };
        
        // 오류 처리 전략
        this.recoveryStrategies = new Map();
        
        // 오류 알림 콜백
        this.notificationCallbacks = [];
        
        // 최대 로그 크기
        this.maxLogSize = 100;
        
        // 디버그 모드
        this.debugMode = false;
        
        this.init();
    }
    
    /**
     * 오류 처리 시스템 초기화
     */
    init() {
        this.setupGlobalErrorHandlers();
        this.registerDefaultRecoveryStrategies();
        
        console.log('✅ 오류 처리 시스템 초기화 완료');
    }
    
    /**
     * 전역 오류 핸들러 설정
     */
    setupGlobalErrorHandlers() {
        // 전역 오류 처리
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleError(error || new Error(message), {
                source: 'window.onerror',
                location: `${source}:${lineno}:${colno}`
            });
            return true; // 오류 전파 방지
        };
        
        // Promise 오류 처리
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                source: 'unhandledrejection',
                location: 'Promise'
            });
        });
        
        // 콘솔 오류 가로채기
        if (typeof console !== 'undefined') {
            const originalConsoleError = console.error;
            console.error = (...args) => {
                // 원래 콘솔 오류 출력 유지
                originalConsoleError.apply(console, args);
                
                // 오류 객체 추출
                const errorObj = args.find(arg => arg instanceof Error) || new Error(args.join(' '));
                
                this.handleError(errorObj, {
                    source: 'console.error',
                    severity: 'warning',
                    args: args
                });
            };
        }
    }
    
    /**
     * 기본 복구 전략 등록
     */
    registerDefaultRecoveryStrategies() {
        // 리소스 로드 오류
        this.registerRecoveryStrategy('ResourceError', (error, context) => {
            const resourceUrl = context.resourceUrl;
            if (!resourceUrl) return false;
            
            console.log(`🔄 리소스 로드 재시도: ${resourceUrl}`);
            
            // 리소스 유형에 따른 재시도 로직
            if (context.resourceType === 'texture') {
                this.retryLoadTexture(resourceUrl, context.onSuccess, context.onError);
                return true;
            } else if (context.resourceType === 'model') {
                this.retryLoadModel(resourceUrl, context.onSuccess, context.onError);
                return true;
            } else if (context.resourceType === 'audio') {
                this.retryLoadAudio(resourceUrl, context.onSuccess, context.onError);
                return true;
            }
            
            return false;
        });
        
        // 물리 엔진 오류
        this.registerRecoveryStrategy('PhysicsError', (error, context) => {
            console.log('🔄 물리 엔진 상태 리셋');
            
            // 물리 엔진 상태 리셋
            if (context.physicsWorld) {
                try {
                    // 문제가 있는 바디 제거
                    if (context.problematicBody) {
                        context.physicsWorld.removeBody(context.problematicBody);
                    }
                    
                    // 물리 시뮬레이션 일시 중지 후 재개
                    if (context.resetCallback && typeof context.resetCallback === 'function') {
                        context.resetCallback();
                        return true;
                    }
                } catch (resetError) {
                    console.error('물리 엔진 리셋 실패:', resetError);
                }
            }
            
            return false;
        });
        
        // 렌더링 오류
        this.registerRecoveryStrategy('RenderingError', (error, context) => {
            console.log('🔄 렌더러 재설정');
            
            // 렌더러 재설정
            if (context.renderer) {
                try {
                    context.renderer.setSize(window.innerWidth, window.innerHeight);
                    context.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                    
                    // 렌더 타겟 재생성
                    if (context.resetRenderTargets && typeof context.resetRenderTargets === 'function') {
                        context.resetRenderTargets();
                    }
                    
                    return true;
                } catch (resetError) {
                    console.error('렌더러 재설정 실패:', resetError);
                }
            }
            
            return false;
        });
        
        // 메모리 부족 오류
        this.registerRecoveryStrategy('OutOfMemoryError', (error, context) => {
            console.log('🔄 메모리 확보 시도');
            
            try {
                // 캐시 정리
                if (THREE && THREE.Cache) {
                    THREE.Cache.clear();
                }
                
                // 미사용 텍스처 정리
                if (context.disposeUnusedTextures && typeof context.disposeUnusedTextures === 'function') {
                    context.disposeUnusedTextures();
                }
                
                // 가비지 컬렉션 유도
                if (window.gc && typeof window.gc === 'function') {
                    window.gc();
                } else {
                    const arr = new Array(10000000).fill(0);
                    arr.length = 0;
                }
                
                return true;
            } catch (cleanupError) {
                console.error('메모리 정리 실패:', cleanupError);
            }
            
            return false;
        });
        
        // 센서 연결 오류
        this.registerRecoveryStrategy('SensorConnectionError', (error, context) => {
            console.log('🔄 센서 재연결 시도');
            
            if (context.reconnectCallback && typeof context.reconnectCallback === 'function') {
                try {
                    // 센서 재연결 시도
                    context.reconnectCallback();
                    return true;
                } catch (reconnectError) {
                    console.error('센서 재연결 실패:', reconnectError);
                }
            }
            
            return false;
        });
    }
    
    /**
     * 복구 전략 등록
     */
    registerRecoveryStrategy(errorType, strategyFn) {
        this.recoveryStrategies.set(errorType, strategyFn);
    }
    
    /**
     * 오류 처리
     */
    handleError(error, context = {}) {
        // 오류 정보 구성
        const errorInfo = {
            timestamp: Date.now(),
            error: error,
            message: error.message || 'Unknown error',
            stack: error.stack,
            type: error.name || context.type || 'Error',
            severity: context.severity || 'error',
            source: context.source || 'application',
            context: context,
            recovered: false
        };
        
        // 오류 로깅
        this.logError(errorInfo);
        
        // 오류 통계 업데이트
        this.updateErrorStats(errorInfo);
        
        // 복구 시도
        const recovered = this.attemptRecovery(errorInfo);
        errorInfo.recovered = recovered;
        
        // 오류 알림
        this.notifyError(errorInfo);
        
        return recovered;
    }
    
    /**
     * 오류 로깅
     */
    logError(errorInfo) {
        // 로그 크기 제한
        if (this.errorLog.length >= this.maxLogSize) {
            this.errorLog.shift(); // 가장 오래된 로그 제거
        }
        
        this.errorLog.push(errorInfo);
        
        // 디버그 모드에서 추가 정보 출력
        if (this.debugMode) {
            console.group('🐞 오류 감지');
            console.error(errorInfo.message);
            console.log('유형:', errorInfo.type);
            console.log('소스:', errorInfo.source);
            console.log('스택:', errorInfo.stack);
            console.log('컨텍스트:', errorInfo.context);
            console.groupEnd();
        }
    }
    
    /**
     * 오류 통계 업데이트
     */
    updateErrorStats(errorInfo) {
        this.errorStats.total++;
        
        // 카테고리별 통계
        const category = errorInfo.type;
        if (!this.errorStats.byCategory[category]) {
            this.errorStats.byCategory[category] = 0;
        }
        this.errorStats.byCategory[category]++;
        
        // 심각도에 따른 통계
        if (errorInfo.severity === 'critical') {
            this.errorStats.critical++;
        }
    }
    
    /**
     * 복구 시도
     */
    attemptRecovery(errorInfo) {
        const errorType = errorInfo.type;
        const context = errorInfo.context;
        
        // 복구 전략 찾기
        const recoveryStrategy = this.recoveryStrategies.get(errorType);
        
        if (recoveryStrategy && typeof recoveryStrategy === 'function') {
            try {
                const recovered = recoveryStrategy(errorInfo.error, context);
                
                if (recovered) {
                    this.errorStats.recovered++;
                    console.log(`✅ 오류 복구 성공: ${errorType}`);
                    return true;
                }
            } catch (recoveryError) {
                console.error('복구 시도 중 오류 발생:', recoveryError);
            }
        }
        
        // 일반 오류 복구 시도
        if (this.attemptGeneralRecovery(errorInfo)) {
            this.errorStats.recovered++;
            return true;
        }
        
        console.log(`❌ 오류 복구 실패: ${errorType}`);
        return false;
    }
    
    /**
     * 일반 오류 복구 시도
     */
    attemptGeneralRecovery(errorInfo) {
        const error = errorInfo.error;
        const context = errorInfo.context;
        
        // 메모리 관련 오류 감지
        if (error.message && error.message.includes('memory') || 
            error.message && error.message.includes('allocation failed')) {
            return this.recoveryStrategies.get('OutOfMemoryError')(error, context);
        }
        
        // 리소스 로드 오류 감지
        if (error.message && (error.message.includes('load') || error.message.includes('404'))) {
            if (context.resourceUrl) {
                return this.recoveryStrategies.get('ResourceError')(error, context);
            }
        }
        
        return false;
    }
    
    /**
     * 오류 알림
     */
    notifyError(errorInfo) {
        // 등록된 콜백 실행
        this.notificationCallbacks.forEach(callback => {
            try {
                callback(errorInfo);
            } catch (callbackError) {
                console.error('오류 알림 콜백 실패:', callbackError);
            }
        });
        
        // 심각한 오류인 경우 UI 알림
        if (errorInfo.severity === 'critical' && !errorInfo.recovered) {
            this.showErrorUI(errorInfo);
        }
    }
    
    /**
     * 오류 UI 표시
     */
    showErrorUI(errorInfo) {
        // 이미 오류 UI가 표시되어 있는지 확인
        if (document.getElementById('game-error-dialog')) {
            return;
        }
        
        const errorDialog = document.createElement('div');
        errorDialog.id = 'game-error-dialog';
        errorDialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            max-width: 80%;
            text-align: center;
            font-family: Arial, sans-serif;
        `;
        
        const title = document.createElement('h3');
        title.textContent = '게임에 문제가 발생했습니다';
        title.style.color = '#ff5555';
        
        const message = document.createElement('p');
        message.textContent = this.getUserFriendlyErrorMessage(errorInfo);
        
        const retryButton = document.createElement('button');
        retryButton.textContent = '다시 시도';
        retryButton.style.cssText = `
            background: #4CAF50;
            border: none;
            color: white;
            padding: 10px 20px;
            margin: 10px;
            border-radius: 5px;
            cursor: pointer;
        `;
        retryButton.onclick = () => {
            errorDialog.remove();
            window.location.reload();
        };
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '닫기';
        closeButton.style.cssText = `
            background: #f44336;
            border: none;
            color: white;
            padding: 10px 20px;
            margin: 10px;
            border-radius: 5px;
            cursor: pointer;
        `;
        closeButton.onclick = () => {
            errorDialog.remove();
        };
        
        errorDialog.appendChild(title);
        errorDialog.appendChild(message);
        errorDialog.appendChild(retryButton);
        errorDialog.appendChild(closeButton);
        
        document.body.appendChild(errorDialog);
    }
    
    /**
     * 사용자 친화적 오류 메시지 생성
     */
    getUserFriendlyErrorMessage(errorInfo) {
        const errorType = errorInfo.type;
        const message = errorInfo.message;
        
        // 오류 유형별 사용자 친화적 메시지
        const friendlyMessages = {
            'ResourceError': '게임 리소스를 불러오는 중 문제가 발생했습니다.',
            'PhysicsError': '게임 물리 시스템에 문제가 발생했습니다.',
            'RenderingError': '화면 표시에 문제가 발생했습니다.',
            'OutOfMemoryError': '메모리 부족 문제가 발생했습니다. 다른 앱을 종료하고 다시 시도해보세요.',
            'SensorConnectionError': '센서 연결에 문제가 발생했습니다. 센서를 확인해주세요.',
            'NetworkError': '네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인해주세요.',
            'Error': '게임 실행 중 문제가 발생했습니다.'
        };
        
        return friendlyMessages[errorType] || friendlyMessages['Error'];
    }
    
    /**
     * 오류 알림 콜백 등록
     */
    registerNotificationCallback(callback) {
        if (typeof callback === 'function') {
            this.notificationCallbacks.push(callback);
        }
    }
    
    /**
     * 리소스 로드 재시도
     */
    retryLoadTexture(url, onSuccess, onError) {
        const loader = new THREE.TextureLoader();
        loader.load(url, onSuccess, undefined, onError);
    }
    
    retryLoadModel(url, onSuccess, onError) {
        const loader = new THREE.GLTFLoader();
        loader.load(url, onSuccess, undefined, onError);
    }
    
    retryLoadAudio(url, onSuccess, onError) {
        const audio = new Audio();
        audio.src = url;
        audio.oncanplaythrough = onSuccess;
        audio.onerror = onError;
        audio.load();
    }
    
    /**
     * 오류 통계 가져오기
     */
    getErrorStats() {
        return {
            ...this.errorStats,
            recoveryRate: this.errorStats.total > 0 ? 
                (this.errorStats.recovered / this.errorStats.total) * 100 : 0
        };
    }
    
    /**
     * 오류 로그 가져오기
     */
    getErrorLog(limit = 10) {
        return this.errorLog.slice(-limit);
    }
    
    /**
     * 디버그 모드 설정
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🐞 디버그 모드: ${enabled ? '활성화' : '비활성화'}`);
    }
    
    /**
     * 오류 발생 시뮬레이션 (테스트용)
     */
    simulateError(errorType, message, severity = 'error') {
        const error = new Error(message || `Simulated ${errorType}`);
        error.name = errorType;
        
        this.handleError(error, {
            source: 'simulation',
            severity: severity,
            simulated: true
        });
    }
}