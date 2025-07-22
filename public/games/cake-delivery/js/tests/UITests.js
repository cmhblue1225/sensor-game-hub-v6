/**
 * UI/UX 컴포넌트 테스트
 * 모바일 인터페이스, 접근성, 튜토리얼 시스템의 정확성을 검증합니다.
 */

// 테스트 프레임워크 인스턴스
const uiTestFramework = new TestFramework();
const { describe, it, expect, beforeEach, afterEach } = uiTestFramework;

describe('UI/UX 컴포넌트 테스트', () => {
    let testContainer;
    let mobileInterface;
    let accessibilitySystem;
    let tutorialManager;
    
    beforeEach(() => {
        // 테스트용 DOM 컨테이너 생성
        testContainer = document.createElement('div');
        testContainer.id = 'test-container';
        testContainer.style.cssText = 'width: 400px; height: 600px; position: relative;';
        document.body.appendChild(testContainer);
        
        // 테스트용 게임 엔진 모킹
        const mockGameEngine = {
            scene: { add: () => {}, remove: () => {} },
            camera: { position: { set: () => {} } },
            renderer: { domElement: testContainer }
        };
        
        // UI 시스템 초기화
        mobileInterface = new MobileTouchInterface(mockGameEngine);
        accessibilitySystem = new AccessibilitySystem();
        tutorialManager = new InteractiveTutorialManager(mockGameEngine);
    });
    
    afterEach(() => {
        // 테스트 정리
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
        
        if (mobileInterface) {
            mobileInterface.dispose();
        }
        if (accessibilitySystem) {
            accessibilitySystem.cleanup();
        }
        if (tutorialManager) {
            tutorialManager.cleanup();
        }
    });
    
    describe('모바일 터치 인터페이스', () => {
        it('터치 이벤트가 올바르게 감지되어야 함', () => {
            let touchDetected = false;
            
            mobileInterface.addEventListener('onTouch', () => {
                touchDetected = true;
            });
            
            // 터치 이벤트 시뮬레이션
            const touchEvent = new TouchEvent('touchstart', {
                touches: [{
                    clientX: 200,
                    clientY: 300,
                    identifier: 0
                }]
            });
            
            testContainer.dispatchEvent(touchEvent);
            
            expect(touchDetected).toBeTruthy();
        });
        
        it('멀티터치 제스처가 올바르게 인식되어야 함', () => {
            let gestureType = null;
            
            mobileInterface.addEventListener('onGesture', (data) => {
                gestureType = data.type;
            });
            
            // 핀치 제스처 시뮬레이션
            const pinchStart = new TouchEvent('touchstart', {
                touches: [
                    { clientX: 100, clientY: 200, identifier: 0 },
                    { clientX: 300, clientY: 200, identifier: 1 }
                ]
            });
            
            const pinchMove = new TouchEvent('touchmove', {
                touches: [
                    { clientX: 150, clientY: 200, identifier: 0 },
                    { clientX: 250, clientY: 200, identifier: 1 }
                ]
            });
            
            testContainer.dispatchEvent(pinchStart);
            testContainer.dispatchEvent(pinchMove);
            
            expect(gestureType).toBe('pinch');
        });
        
        it('햅틱 피드백이 올바르게 작동해야 함', () => {
            // 햅틱 피드백 모킹
            const originalVibrate = navigator.vibrate;
            let vibratePattern = null;
            
            navigator.vibrate = (pattern) => {
                vibratePattern = pattern;
                return true;
            };
            
            mobileInterface.provideTouchFeedback('success');
            
            expect(vibratePattern).toBeDefined();
            expect(Array.isArray(vibratePattern) || typeof vibratePattern === 'number').toBeTruthy();
            
            // 원래 함수 복원
            navigator.vibrate = originalVibrate;
        });
        
        it('화면 크기 변경에 올바르게 대응해야 함', () => {
            const initialLayout = mobileInterface.getCurrentLayout();
            
            // 화면 크기 변경 시뮬레이션
            Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 1200, configurable: true });
            
            window.dispatchEvent(new Event('resize'));
            
            const newLayout = mobileInterface.getCurrentLayout();
            
            expect(newLayout).not.toEqual(initialLayout);
        });
        
        it('터치 감도가 올바르게 조절되어야 함', () => {
            const originalSensitivity = mobileInterface.getTouchSensitivity();
            
            mobileInterface.setTouchSensitivity(0.5);
            const newSensitivity = mobileInterface.getTouchSensitivity();
            
            expect(newSensitivity).toBe(0.5);
            expect(newSensitivity).not.toBe(originalSensitivity);
        });
    });
    
    describe('접근성 시스템', () => {
        it('고대비 모드가 올바르게 적용되어야 함', () => {
            accessibilitySystem.enableHighContrastMode();
            
            const isHighContrast = accessibilitySystem.isHighContrastEnabled();
            expect(isHighContrast).toBeTruthy();
            
            // CSS 클래스가 적용되었는지 확인
            expect(document.body.classList.contains('high-contrast')).toBeTruthy();
        });
        
        it('색맹 지원 모드가 올바르게 작동해야 함', () => {
            accessibilitySystem.setColorBlindnessSupport('deuteranopia');
            
            const currentMode = accessibilitySystem.getColorBlindnessMode();
            expect(currentMode).toBe('deuteranopia');
            
            // 색상 필터가 적용되었는지 확인
            const filterElement = document.querySelector('.color-filter');
            expect(filterElement).toBeDefined();
        });
        
        it('스크린 리더 지원이 올바르게 작동해야 함', () => {
            const testElement = document.createElement('button');
            testElement.textContent = 'Test Button';
            testContainer.appendChild(testElement);
            
            accessibilitySystem.enhanceForScreenReader(testElement);
            
            expect(testElement.getAttribute('aria-label')).toBeDefined();
            expect(testElement.getAttribute('role')).toBeDefined();
        });
        
        it('키보드 네비게이션이 올바르게 작동해야 함', () => {
            const button1 = document.createElement('button');
            const button2 = document.createElement('button');
            
            button1.textContent = 'Button 1';
            button2.textContent = 'Button 2';
            
            testContainer.appendChild(button1);
            testContainer.appendChild(button2);
            
            accessibilitySystem.enableKeyboardNavigation([button1, button2]);
            
            // Tab 키 이벤트 시뮬레이션
            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
            document.dispatchEvent(tabEvent);
            
            expect(document.activeElement).toBe(button1);
        });
        
        it('폰트 크기 조절이 올바르게 작동해야 함', () => {
            const originalFontSize = accessibilitySystem.getFontSize();
            
            accessibilitySystem.setFontSize('large');
            const newFontSize = accessibilitySystem.getFontSize();
            
            expect(newFontSize).toBe('large');
            expect(newFontSize).not.toBe(originalFontSize);
            
            // CSS 변수가 업데이트되었는지 확인
            const rootStyle = getComputedStyle(document.documentElement);
            const fontSize = rootStyle.getPropertyValue('--font-size-base');
            expect(fontSize).toContain('1.2'); // large 모드에서 1.2배
        });
    });
    
    describe('튜토리얼 시스템', () => {
        it('튜토리얼이 올바르게 시작되어야 함', () => {
            tutorialManager.startTutorial();
            
            expect(tutorialManager.isActive).toBeTruthy();
            expect(tutorialManager.getCurrentStep()).toBe(0);
        });
        
        it('튜토리얼 단계가 올바르게 진행되어야 함', () => {
            tutorialManager.startTutorial();
            
            const initialStep = tutorialManager.getCurrentStep();
            tutorialManager.nextStep();
            const nextStep = tutorialManager.getCurrentStep();
            
            expect(nextStep).toBe(initialStep + 1);
        });
        
        it('튜토리얼 하이라이트가 올바르게 표시되어야 함', () => {
            const targetElement = document.createElement('div');
            targetElement.id = 'tutorial-target';
            testContainer.appendChild(targetElement);
            
            tutorialManager.highlightElement(targetElement);
            
            const highlightOverlay = document.querySelector('.tutorial-highlight');
            expect(highlightOverlay).toBeDefined();
        });
        
        it('튜토리얼 말풍선이 올바르게 표시되어야 함', () => {
            const message = '이것은 테스트 메시지입니다.';
            const position = { x: 200, y: 300 };
            
            tutorialManager.showTooltip(message, position);
            
            const tooltip = document.querySelector('.tutorial-tooltip');
            expect(tooltip).toBeDefined();
            expect(tooltip.textContent).toContain(message);
        });
        
        it('튜토리얼 건너뛰기가 올바르게 작동해야 함', () => {
            tutorialManager.startTutorial();
            expect(tutorialManager.isActive).toBeTruthy();
            
            tutorialManager.skipTutorial();
            expect(tutorialManager.isActive).toBeFalsy();
        });
        
        it('튜토리얼 진행률이 올바르게 계산되어야 함', () => {
            tutorialManager.startTutorial();
            
            const totalSteps = tutorialManager.getTotalSteps();
            const currentStep = tutorialManager.getCurrentStep();
            const progress = tutorialManager.getProgress();
            
            expect(progress).toBe(currentStep / totalSteps);
        });
    });
    
    describe('UI 반응성 테스트', () => {
        it('UI 요소가 다양한 화면 크기에서 올바르게 표시되어야 함', () => {
            const screenSizes = [
                { width: 320, height: 568 }, // iPhone SE
                { width: 375, height: 667 }, // iPhone 8
                { width: 414, height: 896 }, // iPhone 11
                { width: 768, height: 1024 } // iPad
            ];
            
            screenSizes.forEach(size => {
                Object.defineProperty(window, 'innerWidth', { value: size.width, configurable: true });
                Object.defineProperty(window, 'innerHeight', { value: size.height, configurable: true });
                
                window.dispatchEvent(new Event('resize'));
                
                // UI 요소들이 화면 밖으로 나가지 않는지 확인
                const uiElements = testContainer.querySelectorAll('.ui-element');
                uiElements.forEach(element => {
                    const rect = element.getBoundingClientRect();
                    expect(rect.right).toBeLessThanOrEqual(size.width);
                    expect(rect.bottom).toBeLessThanOrEqual(size.height);
                });
            });
        });
        
        it('UI 애니메이션이 부드럽게 실행되어야 함', (done) => {
            const testElement = document.createElement('div');
            testElement.style.cssText = 'width: 100px; height: 100px; background: red; transition: transform 0.3s;';
            testContainer.appendChild(testElement);
            
            // 애니메이션 시작
            testElement.style.transform = 'translateX(100px)';
            
            // 애니메이션 완료 후 확인
            setTimeout(() => {
                const computedStyle = getComputedStyle(testElement);
                const transform = computedStyle.transform;
                
                expect(transform).toContain('100');
                done();
            }, 350);
        });
        
        it('터치 영역이 충분한 크기를 가져야 함', () => {
            const touchElements = testContainer.querySelectorAll('.touch-target');
            
            touchElements.forEach(element => {
                const rect = element.getBoundingClientRect();
                const minTouchSize = 44; // iOS 권장 최소 터치 크기
                
                expect(rect.width).toBeGreaterThanOrEqual(minTouchSize);
                expect(rect.height).toBeGreaterThanOrEqual(minTouchSize);
            });
        });
    });
    
    describe('성능 테스트', () => {
        it('UI 업데이트가 60fps를 유지해야 함', (done) => {
            let frameCount = 0;
            const startTime = performance.now();
            
            function updateUI() {
                frameCount++;
                
                // UI 업데이트 시뮬레이션
                const testElement = document.createElement('div');
                testElement.textContent = `Frame ${frameCount}`;
                testContainer.appendChild(testElement);
                
                if (frameCount < 60) {
                    requestAnimationFrame(updateUI);
                } else {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    const fps = (frameCount / duration) * 1000;
                    
                    expect(fps).toBeGreaterThan(55); // 60fps에 가까워야 함
                    done();
                }
            }
            
            requestAnimationFrame(updateUI);
        });
        
        it('메모리 누수가 발생하지 않아야 함', () => {
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // UI 요소 대량 생성 및 제거
            for (let i = 0; i < 1000; i++) {
                const element = document.createElement('div');
                element.textContent = `Element ${i}`;
                testContainer.appendChild(element);
                testContainer.removeChild(element);
            }
            
            // 가비지 컬렉션 유도
            if (window.gc) {
                window.gc();
            }
            
            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const memoryIncrease = finalMemory - initialMemory;
            
            // 메모리 증가량이 5MB 이하여야 함
            expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
        });
    });
    
    describe('사용자 경험 테스트', () => {
        it('로딩 상태가 올바르게 표시되어야 함', () => {
            mobileInterface.showLoadingState('게임 로딩 중...');
            
            const loadingElement = document.querySelector('.loading-indicator');
            expect(loadingElement).toBeDefined();
            expect(loadingElement.textContent).toContain('게임 로딩 중');
        });
        
        it('오류 메시지가 사용자 친화적으로 표시되어야 함', () => {
            const errorMessage = '네트워크 연결을 확인해주세요.';
            mobileInterface.showErrorMessage(errorMessage);
            
            const errorElement = document.querySelector('.error-message');
            expect(errorElement).toBeDefined();
            expect(errorElement.textContent).toContain(errorMessage);
        });
        
        it('성공 피드백이 올바르게 표시되어야 함', () => {
            mobileInterface.showSuccessMessage('레벨 완료!');
            
            const successElement = document.querySelector('.success-message');
            expect(successElement).toBeDefined();
            expect(successElement.textContent).toContain('레벨 완료');
        });
    });
});

// 테스트 실행 함수
async function runUITests() {
    console.log('🧪 UI/UX 컴포넌트 테스트 시작...');
    
    try {
        const results = await uiTestFramework.runAll();
        return results;
    } catch (error) {
        console.error('UI 테스트 실행 중 오류:', error);
        return null;
    }
}

// 전역으로 내보내기
if (typeof window !== 'undefined') {
    window.runUITests = runUITests;
}