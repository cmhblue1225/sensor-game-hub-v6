/**
 * 접근성 시스템
 * 게임의 접근성 기능을 제공합니다.
 */
class AccessibilitySystem {
    constructor() {
        this.settings = {
            highContrast: false,
            colorBlindMode: 'none',
            fontSize: 'normal',
            keyboardNavigation: false,
            screenReader: false,
            hapticFeedback: true
        };
        
        this.container = null;
        
        console.log('✅ 접근성 시스템 초기화 완료');
    }
    
    /**
     * 초기화
     */
    async init(container) {
        this.container = container || document.body;
        this.setupAccessibilityFeatures();
        this.loadSettings();
        
        console.log('♿ 접근성 시스템 설정 완료');
    }
    
    /**
     * 접근성 기능 설정
     */
    setupAccessibilityFeatures() {
        // ARIA 레이블 설정
        this.setupAriaLabels();
        
        // 키보드 내비게이션 설정
        this.setupKeyboardNavigation();
        
        // 스크린 리더 지원 설정
        this.setupScreenReaderSupport();
    }
    
    /**
     * ARIA 레이블 설정
     */
    setupAriaLabels() {
        const gameArea = document.getElementById('gameCanvas');
        if (gameArea) {
            gameArea.setAttribute('role', 'application');
            gameArea.setAttribute('aria-label', '케이크 배달 게임');
        }
    }
    
    /**
     * 키보드 내비게이션 설정
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.settings.keyboardNavigation) return;
            
            switch (e.key) {
                case 'Tab':
                    this.handleTabNavigation(e);
                    break;
                case 'Enter':
                case ' ':
                    this.handleActivation(e);
                    break;
                case 'Escape':
                    this.handleEscape(e);
                    break;
            }
        });
    }
    
    /**
     * 스크린 리더 지원 설정
     */
    setupScreenReaderSupport() {
        // 라이브 리전 생성
        const liveRegion = document.createElement('div');
        liveRegion.id = 'accessibility-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        liveRegion.style.width = '1px';
        liveRegion.style.height = '1px';
        liveRegion.style.overflow = 'hidden';
        
        document.body.appendChild(liveRegion);
    }
    
    /**
     * 고대비 모드 활성화
     */
    enableHighContrast() {
        this.settings.highContrast = true;
        this.container.classList.add('high-contrast');
        this.saveSettings();
        
        console.log('🔆 고대비 모드 활성화');
    }
    
    /**
     * 고대비 모드 비활성화
     */
    disableHighContrast() {
        this.settings.highContrast = false;
        this.container.classList.remove('high-contrast');
        this.saveSettings();
        
        console.log('🔅 고대비 모드 비활성화');
    }
    
    /**
     * 색맹 필터 적용
     */
    applyColorBlindFilter(type) {
        // 기존 필터 제거
        this.removeColorBlindFilter();
        
        this.settings.colorBlindMode = type;
        this.container.classList.add(`colorblind-${type}`);
        this.saveSettings();
        
        console.log(`🎨 색맹 필터 적용: ${type}`);
    }
    
    /**
     * 색맹 필터 제거
     */
    removeColorBlindFilter() {
        const filterClasses = ['colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia'];
        filterClasses.forEach(className => {
            this.container.classList.remove(className);
        });
        
        this.settings.colorBlindMode = 'none';
        this.saveSettings();
    }
    
    /**
     * 키보드 내비게이션 활성화
     */
    enableKeyboardNavigation() {
        this.settings.keyboardNavigation = true;
        this.saveSettings();
        
        console.log('⌨️ 키보드 내비게이션 활성화');
    }
    
    /**
     * 키보드 내비게이션 상태 확인
     */
    isKeyboardNavigationEnabled() {
        return this.settings.keyboardNavigation;
    }
    
    /**
     * 스크린 리더에 알림
     */
    announceToScreenReader(message) {
        const liveRegion = document.getElementById('accessibility-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            
            // 메시지 지우기 (다음 알림을 위해)
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }
    
    /**
     * 게임 상태 알림
     */
    announceGameState(state, data) {
        let message = '';
        
        switch (state) {
            case 'started':
                message = '게임이 시작되었습니다.';
                break;
            case 'paused':
                message = '게임이 일시정지되었습니다.';
                break;
            case 'resumed':
                message = '게임이 재개되었습니다.';
                break;
            case 'gameOver':
                message = `게임이 종료되었습니다. ${data || ''}`;
                break;
            case 'levelUp':
                message = `레벨 ${data}로 올라갔습니다.`;
                break;
            case 'scoreChange':
                message = `현재 점수: ${data}점`;
                break;
        }
        
        if (message) {
            this.announceToScreenReader(message);
        }
    }
    
    /**
     * 폰트 크기 증가
     */
    increaseFontSize() {
        const currentSize = this.settings.fontSize;
        const sizes = ['small', 'normal', 'large', 'extra-large'];
        const currentIndex = sizes.indexOf(currentSize);
        
        if (currentIndex < sizes.length - 1) {
            this.settings.fontSize = sizes[currentIndex + 1];
            this.applyFontSize();
            this.saveSettings();
        }
    }
    
    /**
     * 폰트 크기 감소
     */
    decreaseFontSize() {
        const currentSize = this.settings.fontSize;
        const sizes = ['small', 'normal', 'large', 'extra-large'];
        const currentIndex = sizes.indexOf(currentSize);
        
        if (currentIndex > 0) {
            this.settings.fontSize = sizes[currentIndex - 1];
            this.applyFontSize();
            this.saveSettings();
        }
    }
    
    /**
     * 폰트 크기 적용
     */
    applyFontSize() {
        const sizeClasses = ['font-small', 'font-normal', 'font-large', 'font-extra-large'];
        sizeClasses.forEach(className => {
            this.container.classList.remove(className);
        });
        
        this.container.classList.add(`font-${this.settings.fontSize}`);
    }
    
    /**
     * 햅틱 피드백 테스트
     */
    testHapticFeedback() {
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
            return true;
        }
        return false;
    }
    
    /**
     * 햅틱 피드백 트리거
     */
    triggerHapticFeedback(type, pattern) {
        if (!this.settings.hapticFeedback || !('vibrate' in navigator)) {
            return false;
        }
        
        navigator.vibrate(pattern);
        return true;
    }
    
    /**
     * 접근성 메뉴 표시
     */
    showAccessibilityMenu() {
        // 접근성 메뉴 UI 생성 및 표시
        console.log('♿ 접근성 메뉴 표시');
    }
    
    /**
     * 접근성 메뉴 닫기
     */
    closeAccessibilityMenu() {
        // 접근성 메뉴 닫기
        console.log('♿ 접근성 메뉴 닫기');
    }
    
    /**
     * 접근성 도움말 표시
     */
    showAccessibilityHelp() {
        this.announceToScreenReader('접근성 도움말: F1키로 도움말, 스페이스바로 일시정지, 화살표키로 조작');
    }
    
    /**
     * 현재 모드 가져오기
     */
    getCurrentMode() {
        return this.settings.highContrast ? 'high-contrast' : 'normal';
    }
    
    /**
     * 설정 저장
     */
    saveSettings() {
        try {
            localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('접근성 설정 저장 실패:', error);
        }
    }
    
    /**
     * 설정 로드
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('accessibility-settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
                this.applySettings();
            }
        } catch (error) {
            console.warn('접근성 설정 로드 실패:', error);
        }
    }
    
    /**
     * 설정 적용
     */
    applySettings() {
        if (this.settings.highContrast) {
            this.enableHighContrast();
        }
        
        if (this.settings.colorBlindMode !== 'none') {
            this.applyColorBlindFilter(this.settings.colorBlindMode);
        }
        
        this.applyFontSize();
    }
    
    /**
     * 정리
     */
    cleanup() {
        const liveRegion = document.getElementById('accessibility-live-region');
        if (liveRegion) {
            liveRegion.remove();
        }
        
        console.log('🧹 접근성 시스템 정리 완료');
    }
}