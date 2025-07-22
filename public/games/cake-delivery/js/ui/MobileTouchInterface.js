/**
 * 모바일 터치 인터페이스 시스템
 * 터치 친화적 UI 컴포넌트와 제스처 인식을 제공합니다.
 */
class MobileTouchInterface {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.touchSensitivity = 1.0;
        this.hapticFeedback = 'vibrate' in navigator;
        this.gestureRecognizer = new GestureRecognizer();
        this.touchElements = new Map();
        this.currentOrientation = 'portrait';
        
        this.init();
    }
    
    init() {
        this.setupTouchControls();
        this.setupResponsiveLayout();
        this.setupOrientationHandling();
        this.setupAccessibilityFeatures();
        this.createTouchFeedbackSystem();
    }
    
    /**
     * 터치 제스처 설정
     */
    setupTouchControls() {
        // 터치 이벤트 리스너 설정
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // 제스처 인식기 설정
        this.gestureRecognizer.on('tap', this.handleTap.bind(this));
        this.gestureRecognizer.on('doubletap', this.handleDoubleTap.bind(this));
        this.gestureRecognizer.on('swipe', this.handleSwipe.bind(this));
        this.gestureRecognizer.on('pinch', this.handlePinch.bind(this));
        this.gestureRecognizer.on('longpress', this.handleLongPress.bind(this));
        
        // 터치 영역 확장 (더 쉬운 터치를 위해)
        this.expandTouchTargets();
    }
    
    /**
     * 반응형 레이아웃 설정
     */
    setupResponsiveLayout() {
        // 뷰포트 크기 감지
        this.updateViewportInfo();
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // 동적 폰트 크기 조절
        this.adjustFontSizes();
        
        // UI 요소 위치 최적화
        this.optimizeUILayout();
    }
    
    /**
     * 화면 방향 처리
     */
    setupOrientationHandling() {
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
        screen.orientation?.addEventListener('change', this.handleOrientationChange.bind(this));
        
        // 초기 방향 설정
        this.handleOrientationChange();
    }
    
    /**
     * 접근성 기능 설정
     */
    setupAccessibilityFeatures() {
        // 고대비 모드 감지
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            this.enableHighContrastMode();
        }
        
        // 애니메이션 감소 모드 감지
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.reduceAnimations();
        }
        
        // 폰트 크기 선호도 감지
        this.detectFontSizePreference();
        
        // 스크린 리더 지원
        this.setupScreenReaderSupport();
    }
    
    /**
     * 터치 피드백 시스템 생성
     */
    createTouchFeedbackSystem() {
        // 햅틱 피드백 패턴 정의
        this.hapticPatterns = {
            light: [50],
            medium: [100],
            heavy: [200],
            success: [50, 50, 100],
            error: [100, 50, 100, 50, 100],
            warning: [150, 100, 150],
            notification: [25, 25, 25]
        };
        
        // 시각적 피드백 시스템
        this.createVisualFeedbackElements();
    }
    
    /**
     * 터치 시작 처리
     */
    handleTouchStart(event) {
        event.preventDefault(); // 기본 터치 동작 방지
        
        const touches = Array.from(event.touches);
        touches.forEach(touch => {
            this.gestureRecognizer.addTouch(touch);
        });
        
        // 터치 시작 시각적 피드백
        this.showTouchFeedback(event.touches[0]);
    }
    
    /**
     * 터치 이동 처리
     */
    handleTouchMove(event) {
        event.preventDefault();
        
        const touches = Array.from(event.touches);
        touches.forEach(touch => {
            this.gestureRecognizer.updateTouch(touch);
        });
    }
    
    /**
     * 터치 종료 처리
     */
    handleTouchEnd(event) {
        event.preventDefault();
        
        const touches = Array.from(event.changedTouches);
        touches.forEach(touch => {
            this.gestureRecognizer.removeTouch(touch);
        });
        
        // 터치 종료 피드백 제거
        this.hideTouchFeedback();
    }
    
    /**
     * 탭 제스처 처리
     */
    handleTap(gesture) {
        const element = this.getElementAtPosition(gesture.x, gesture.y);
        
        if (element) {
            this.provideTouchFeedback('light');
            this.highlightElement(element);
            
            // 버튼 클릭 시뮬레이션
            if (element.tagName === 'BUTTON' || element.onclick) {
                element.click();
            }
        }
    }
    
    /**
     * 더블탭 제스처 처리
     */
    handleDoubleTap(gesture) {
        // 게임 일시정지/재개
        if (this.gameEngine) {
            this.gameEngine.togglePause();
            this.provideTouchFeedback('medium');
        }
    }
    
    /**
     * 스와이프 제스처 처리
     */
    handleSwipe(gesture) {
        const { direction, velocity } = gesture;
        
        switch (direction) {
            case 'up':
                this.showGameMenu();
                break;
            case 'down':
                this.hideGameMenu();
                break;
            case 'left':
                this.switchToNextMode();
                break;
            case 'right':
                this.switchToPreviousMode();
                break;
        }
        
        this.provideTouchFeedback('medium');
    }
    
    /**
     * 핀치 제스처 처리
     */
    handlePinch(gesture) {
        const { scale, center } = gesture;
        
        // 줌 기능 (디버그 모드에서만)
        if (this.gameEngine && this.gameEngine.debugMode) {
            this.gameEngine.adjustCameraZoom(scale);
        }
        
        this.provideTouchFeedback('light');
    }
    
    /**
     * 롱프레스 제스처 처리
     */
    handleLongPress(gesture) {
        // 컨텍스트 메뉴 표시
        this.showContextMenu(gesture.x, gesture.y);
        this.provideTouchFeedback('heavy');
    }
    
    /**
     * 화면 크기 변경 처리
     */
    handleResize() {
        this.updateViewportInfo();
        this.adjustFontSizes();
        this.optimizeUILayout();
        
        // 캔버스 크기 조정
        if (this.gameEngine) {
            this.gameEngine.resizeCanvas();
        }
    }
    
    /**
     * 화면 방향 변경 처리
     */
    handleOrientationChange() {
        setTimeout(() => {
            const orientation = screen.orientation?.angle || window.orientation || 0;
            this.currentOrientation = Math.abs(orientation) === 90 ? 'landscape' : 'portrait';
            
            this.adjustLayoutForOrientation();
            this.provideTouchFeedback('notification');
        }, 100); // 방향 변경 완료 대기
    }
    
    /**
     * 뷰포트 정보 업데이트
     */
    updateViewportInfo() {
        this.viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            isSmallScreen: window.innerWidth < 480,
            isMediumScreen: window.innerWidth >= 480 && window.innerWidth < 768,
            isLargeScreen: window.innerWidth >= 768
        };
    }
    
    /**
     * 폰트 크기 조정
     */
    adjustFontSizes() {
        const baseSize = this.viewport.isSmallScreen ? 14 : 16;
        const scaleFactor = Math.min(this.viewport.width / 375, 1.2); // iPhone 6 기준
        
        document.documentElement.style.fontSize = `${baseSize * scaleFactor}px`;
        
        // 동적 폰트 크기 클래스 추가
        document.body.classList.toggle('small-screen', this.viewport.isSmallScreen);
        document.body.classList.toggle('medium-screen', this.viewport.isMediumScreen);
        document.body.classList.toggle('large-screen', this.viewport.isLargeScreen);
    }
    
    /**
     * UI 레이아웃 최적화
     */
    optimizeUILayout() {
        // 세션 패널 위치 조정
        const sessionPanel = document.querySelector('.session-panel');
        if (sessionPanel) {
            if (this.viewport.isSmallScreen) {
                sessionPanel.style.top = '10px';
                sessionPanel.style.right = '10px';
                sessionPanel.style.padding = '8px';
            } else {
                sessionPanel.style.top = '20px';
                sessionPanel.style.right = '20px';
                sessionPanel.style.padding = '15px';
            }
        }
        
        // 게임 정보 패널 조정
        const gameInfo = document.querySelector('.game-info');
        if (gameInfo) {
            if (this.viewport.isSmallScreen) {
                gameInfo.style.top = '10px';
                gameInfo.style.left = '10px';
                gameInfo.style.padding = '8px';
            } else {
                gameInfo.style.top = '20px';
                gameInfo.style.left = '20px';
                gameInfo.style.padding = '15px';
            }
        }
        
        // 컨트롤 패널 조정
        const controlPanel = document.querySelector('.control-panel');
        if (controlPanel) {
            if (this.viewport.isSmallScreen) {
                controlPanel.style.bottom = '10px';
                controlPanel.style.gap = '8px';
            } else {
                controlPanel.style.bottom = '20px';
                controlPanel.style.gap = '10px';
            }
        }
    }
    
    /**
     * 방향에 따른 레이아웃 조정
     */
    adjustLayoutForOrientation() {
        document.body.classList.toggle('landscape', this.currentOrientation === 'landscape');
        document.body.classList.toggle('portrait', this.currentOrientation === 'portrait');
        
        if (this.currentOrientation === 'landscape') {
            // 가로 모드에서 UI 요소 재배치
            this.optimizeForLandscape();
        } else {
            // 세로 모드에서 UI 요소 재배치
            this.optimizeForPortrait();
        }
    }
    
    /**
     * 가로 모드 최적화
     */
    optimizeForLandscape() {
        const sessionPanel = document.querySelector('.session-panel');
        const gameInfo = document.querySelector('.game-info');
        
        if (sessionPanel && gameInfo) {
            // 가로 모드에서는 상단에 나란히 배치
            sessionPanel.style.top = '10px';
            sessionPanel.style.right = '10px';
            sessionPanel.style.width = 'auto';
            
            gameInfo.style.top = '10px';
            gameInfo.style.left = '10px';
            gameInfo.style.width = 'auto';
        }
    }
    
    /**
     * 세로 모드 최적화
     */
    optimizeForPortrait() {
        const sessionPanel = document.querySelector('.session-panel');
        const gameInfo = document.querySelector('.game-info');
        
        if (sessionPanel && gameInfo) {
            // 세로 모드에서는 기본 위치
            sessionPanel.style.top = '20px';
            sessionPanel.style.right = '20px';
            
            gameInfo.style.top = '20px';
            gameInfo.style.left = '20px';
        }
    }
    
    /**
     * 터치 대상 확장
     */
    expandTouchTargets() {
        const buttons = document.querySelectorAll('button, a');
        buttons.forEach(button => {
            const currentPadding = window.getComputedStyle(button).padding;
            const minTouchSize = 44; // Apple HIG 권장 최소 터치 크기
            
            // 최소 터치 크기 보장
            button.style.minWidth = `${minTouchSize}px`;
            button.style.minHeight = `${minTouchSize}px`;
            
            // 터치 영역 확장을 위한 가상 요소 추가
            button.style.position = 'relative';
            button.style.overflow = 'visible';
        });
    }
    
    /**
     * 햅틱 피드백 제공
     */
    provideTouchFeedback(type) {
        if (this.hapticFeedback && this.hapticPatterns[type]) {
            navigator.vibrate(this.hapticPatterns[type]);
        }
        
        // 시각적 피드백도 함께 제공
        this.showVisualFeedback(type);
    }
    
    /**
     * 시각적 피드백 표시
     */
    showVisualFeedback(type) {
        const feedbackElement = document.createElement('div');
        feedbackElement.className = `touch-feedback touch-feedback-${type}`;
        feedbackElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.3);
            pointer-events: none;
            z-index: 9999;
            animation: touchFeedback 0.3s ease-out;
        `;
        
        document.body.appendChild(feedbackElement);
        
        setTimeout(() => {
            feedbackElement.remove();
        }, 300);
    }
    
    /**
     * 터치 피드백 표시
     */
    showTouchFeedback(touch) {
        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        ripple.style.cssText = `
            position: fixed;
            left: ${touch.clientX - 25}px;
            top: ${touch.clientY - 25}px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            pointer-events: none;
            z-index: 9998;
            animation: ripple 0.6s ease-out;
        `;
        
        document.body.appendChild(ripple);
        this.currentRipple = ripple;
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    /**
     * 터치 피드백 숨기기
     */
    hideTouchFeedback() {
        if (this.currentRipple) {
            this.currentRipple.style.animation = 'rippleOut 0.2s ease-out';
        }
    }
    
    /**
     * 요소 하이라이트
     */
    highlightElement(element) {
        element.style.transform = 'scale(0.95)';
        element.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
            element.style.transform = '';
        }, 100);
    }
    
    /**
     * 위치의 요소 가져오기
     */
    getElementAtPosition(x, y) {
        return document.elementFromPoint(x, y);
    }
    
    /**
     * 고대비 모드 활성화
     */
    enableHighContrastMode() {
        document.body.classList.add('high-contrast');
        
        // CSS 변수 재정의
        document.documentElement.style.setProperty('--primary', '#0066cc');
        document.documentElement.style.setProperty('--background', '#000000');
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
        document.documentElement.style.setProperty('--surface', '#333333');
    }
    
    /**
     * 애니메이션 감소
     */
    reduceAnimations() {
        document.body.classList.add('reduced-motion');
        
        // 모든 애니메이션 지속시간 단축
        const style = document.createElement('style');
        style.textContent = `
            .reduced-motion * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 폰트 크기 선호도 감지
     */
    detectFontSizePreference() {
        // 시스템 폰트 크기 설정 감지 (iOS/Android)
        const testElement = document.createElement('div');
        testElement.style.cssText = 'font-size: 1rem; position: absolute; visibility: hidden;';
        document.body.appendChild(testElement);
        
        const computedSize = window.getComputedStyle(testElement).fontSize;
        const baseSize = parseFloat(computedSize);
        
        if (baseSize > 16) {
            // 큰 폰트 선호
            document.body.classList.add('large-font-preference');
            this.adjustForLargeFonts();
        }
        
        document.body.removeChild(testElement);
    }
    
    /**
     * 큰 폰트를 위한 조정
     */
    adjustForLargeFonts() {
        const style = document.createElement('style');
        style.textContent = `
            .large-font-preference .session-panel,
            .large-font-preference .game-info {
                padding: 20px;
            }
            
            .large-font-preference button,
            .large-font-preference a {
                padding: 15px 30px;
                font-size: 1.1rem;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 스크린 리더 지원 설정
     */
    setupScreenReaderSupport() {
        // ARIA 레이블 추가
        const sessionCode = document.getElementById('sessionCode');
        if (sessionCode) {
            sessionCode.setAttribute('aria-label', '세션 코드');
            sessionCode.setAttribute('role', 'status');
        }
        
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.setAttribute('aria-label', '연결 상태');
            connectionStatus.setAttribute('role', 'status');
            connectionStatus.setAttribute('aria-live', 'polite');
        }
        
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.setAttribute('aria-label', '현재 점수');
            scoreDisplay.setAttribute('role', 'status');
            scoreDisplay.setAttribute('aria-live', 'polite');
        }
        
        // 키보드 네비게이션 지원
        this.setupKeyboardNavigation();
    }
    
    /**
     * 키보드 네비게이션 설정
     */
    setupKeyboardNavigation() {
        const focusableElements = document.querySelectorAll('button, a, [tabindex]');
        
        focusableElements.forEach((element, index) => {
            element.setAttribute('tabindex', index + 1);
            
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    element.click();
                    this.provideTouchFeedback('light');
                }
            });
        });
    }
    
    /**
     * 시각적 피드백 요소 생성
     */
    createVisualFeedbackElements() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes touchFeedback {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
            }
            
            @keyframes ripple {
                0% { transform: scale(0); opacity: 0.5; }
                100% { transform: scale(4); opacity: 0; }
            }
            
            @keyframes rippleOut {
                0% { opacity: 0.3; }
                100% { opacity: 0; }
            }
            
            .touch-feedback-success {
                background: rgba(16, 185, 129, 0.3) !important;
            }
            
            .touch-feedback-error {
                background: rgba(239, 68, 68, 0.3) !important;
            }
            
            .touch-feedback-warning {
                background: rgba(245, 158, 11, 0.3) !important;
            }
            
            /* 모바일 최적화 스타일 */
            @media (max-width: 480px) {
                .small-screen .session-panel,
                .small-screen .game-info {
                    font-size: 0.9rem;
                }
                
                .small-screen button,
                .small-screen a {
                    min-width: 44px;
                    min-height: 44px;
                    font-size: 0.85rem;
                }
            }
            
            /* 가로 모드 최적화 */
            @media (orientation: landscape) and (max-height: 500px) {
                .landscape .session-panel,
                .landscape .game-info {
                    padding: 8px;
                    font-size: 0.8rem;
                }
                
                .landscape .control-panel {
                    bottom: 5px;
                }
            }
            
            /* 고대비 모드 */
            .high-contrast {
                filter: contrast(150%);
            }
            
            .high-contrast .session-panel,
            .high-contrast .game-info {
                border: 2px solid #ffffff;
            }
            
            .high-contrast button,
            .high-contrast a {
                border: 2px solid #ffffff;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 게임 메뉴 표시
     */
    showGameMenu() {
        // 게임 메뉴 구현 (필요시)
        console.log('게임 메뉴 표시');
    }
    
    /**
     * 게임 메뉴 숨기기
     */
    hideGameMenu() {
        // 게임 메뉴 숨기기 구현 (필요시)
        console.log('게임 메뉴 숨기기');
    }
    
    /**
     * 다음 모드로 전환
     */
    switchToNextMode() {
        if (this.gameEngine) {
            this.gameEngine.switchToNextMode();
        }
    }
    
    /**
     * 이전 모드로 전환
     */
    switchToPreviousMode() {
        if (this.gameEngine) {
            this.gameEngine.switchToPreviousMode();
        }
    }
    
    /**
     * 컨텍스트 메뉴 표시
     */
    showContextMenu(x, y) {
        // 컨텍스트 메뉴 구현 (필요시)
        console.log(`컨텍스트 메뉴 표시: (${x}, ${y})`);
    }
    
    /**
     * 정리
     */
    dispose() {
        // 이벤트 리스너 제거
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        
        // 제스처 인식기 정리
        if (this.gestureRecognizer) {
            this.gestureRecognizer.dispose();
        }
        
        // 터치 요소 정리
        this.touchElements.clear();
    }
}

/**
 * 제스처 인식기 클래스
 */
class GestureRecognizer {
    constructor() {
        this.touches = new Map();
        this.gestures = new Map();
        this.eventListeners = new Map();
        
        // 제스처 임계값 설정
        this.thresholds = {
            tap: { maxDistance: 10, maxTime: 300 },
            doubletap: { maxDistance: 20, maxTime: 300, interval: 500 },
            swipe: { minDistance: 50, maxTime: 1000 },
            pinch: { minDistance: 10 },
            longpress: { minTime: 500, maxDistance: 10 }
        };
        
        this.lastTapTime = 0;
        this.lastTapPosition = { x: 0, y: 0 };
    }
    
    /**
     * 이벤트 리스너 등록
     */
    on(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(callback);
    }
    
    /**
     * 이벤트 발생
     */
    emit(eventType, data) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }
    
    /**
     * 터치 추가
     */
    addTouch(touch) {
        const touchData = {
            id: touch.identifier,
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY,
            startTime: Date.now(),
            lastTime: Date.now()
        };
        
        this.touches.set(touch.identifier, touchData);
        
        // 롱프레스 타이머 시작
        setTimeout(() => {
            this.checkLongPress(touch.identifier);
        }, this.thresholds.longpress.minTime);
    }
    
    /**
     * 터치 업데이트
     */
    updateTouch(touch) {
        const touchData = this.touches.get(touch.identifier);
        if (touchData) {
            touchData.currentX = touch.clientX;
            touchData.currentY = touch.clientY;
            touchData.lastTime = Date.now();
        }
        
        // 핀치 제스처 확인
        if (this.touches.size === 2) {
            this.checkPinch();
        }
    }
    
    /**
     * 터치 제거
     */
    removeTouch(touch) {
        const touchData = this.touches.get(touch.identifier);
        if (!touchData) return;
        
        const duration = Date.now() - touchData.startTime;
        const distance = this.calculateDistance(
            touchData.startX, touchData.startY,
            touchData.currentX, touchData.currentY
        );
        
        // 제스처 판별
        if (duration < this.thresholds.tap.maxTime && distance < this.thresholds.tap.maxDistance) {
            this.handleTapGesture(touchData);
        } else if (distance > this.thresholds.swipe.minDistance && duration < this.thresholds.swipe.maxTime) {
            this.handleSwipeGesture(touchData);
        }
        
        this.touches.delete(touch.identifier);
    }
    
    /**
     * 탭 제스처 처리
     */
    handleTapGesture(touchData) {
        const now = Date.now();
        const timeSinceLastTap = now - this.lastTapTime;
        const distanceFromLastTap = this.calculateDistance(
            touchData.currentX, touchData.currentY,
            this.lastTapPosition.x, this.lastTapPosition.y
        );
        
        if (timeSinceLastTap < this.thresholds.doubletap.interval && 
            distanceFromLastTap < this.thresholds.doubletap.maxDistance) {
            // 더블탭
            this.emit('doubletap', {
                x: touchData.currentX,
                y: touchData.currentY
            });
        } else {
            // 단일 탭
            this.emit('tap', {
                x: touchData.currentX,
                y: touchData.currentY
            });
        }
        
        this.lastTapTime = now;
        this.lastTapPosition = { x: touchData.currentX, y: touchData.currentY };
    }
    
    /**
     * 스와이프 제스처 처리
     */
    handleSwipeGesture(touchData) {
        const deltaX = touchData.currentX - touchData.startX;
        const deltaY = touchData.currentY - touchData.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = touchData.lastTime - touchData.startTime;
        
        let direction;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            direction = deltaY > 0 ? 'down' : 'up';
        }
        
        this.emit('swipe', {
            direction,
            distance,
            velocity: distance / duration,
            deltaX,
            deltaY
        });
    }
    
    /**
     * 핀치 제스처 확인
     */
    checkPinch() {
        if (this.touches.size !== 2) return;
        
        const touchArray = Array.from(this.touches.values());
        const touch1 = touchArray[0];
        const touch2 = touchArray[1];
        
        const currentDistance = this.calculateDistance(
            touch1.currentX, touch1.currentY,
            touch2.currentX, touch2.currentY
        );
        
        const startDistance = this.calculateDistance(
            touch1.startX, touch1.startY,
            touch2.startX, touch2.startY
        );
        
        if (Math.abs(currentDistance - startDistance) > this.thresholds.pinch.minDistance) {
            const scale = currentDistance / startDistance;
            const centerX = (touch1.currentX + touch2.currentX) / 2;
            const centerY = (touch1.currentY + touch2.currentY) / 2;
            
            this.emit('pinch', {
                scale,
                center: { x: centerX, y: centerY },
                distance: currentDistance,
                startDistance
            });
        }
    }
    
    /**
     * 롱프레스 확인
     */
    checkLongPress(touchId) {
        const touchData = this.touches.get(touchId);
        if (!touchData) return;
        
        const duration = Date.now() - touchData.startTime;
        const distance = this.calculateDistance(
            touchData.startX, touchData.startY,
            touchData.currentX, touchData.currentY
        );
        
        if (duration >= this.thresholds.longpress.minTime && 
            distance < this.thresholds.longpress.maxDistance) {
            this.emit('longpress', {
                x: touchData.currentX,
                y: touchData.currentY,
                duration
            });
        }
    }
    
    /**
     * 거리 계산
     */
    calculateDistance(x1, y1, x2, y2) {
        const deltaX = x2 - x1;
        const deltaY = y2 - y1;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }
    
    /**
     * 정리
     */
    dispose() {
        this.touches.clear();
        this.gestures.clear();
        this.eventListeners.clear();
    }
}