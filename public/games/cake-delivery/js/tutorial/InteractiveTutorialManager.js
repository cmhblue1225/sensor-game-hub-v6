/**
 * 인터랙티브 튜토리얼 관리자
 * 단계별 튜토리얼 시나리오와 실시간 피드백을 제공합니다.
 */
class InteractiveTutorialManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentStep = 0;
        this.tutorialSteps = [];
        this.isActive = false;
        this.overlay = null;
        this.highlightSystem = new HighlightSystem();
        this.speechBubble = null;
        this.skipButton = null;
        this.nextButton = null;
        this.prevButton = null;
        this.progressBar = null;
        
        // 튜토리얼 설정
        this.settings = {
            autoAdvance: false,
            showSkipOption: true,
            highlightTargets: true,
            playSound: true,
            vibrateFeedback: true
        };
        
        // 사용자 진행 상태
        this.userProgress = this.loadUserProgress();
        
        this.init();
    }
    
    /**
     * 튜토리얼 시스템 초기화
     */
    init() {
        this.createTutorialSteps();
        this.createTutorialUI();
        this.setupEventListeners();
        
        console.log('✅ 인터랙티브 튜토리얼 관리자 초기화 완료');
    }
    
    /**
     * 튜토리얼 단계 생성
     */
    createTutorialSteps() {
        this.tutorialSteps = [
            // 1단계: 게임 소개
            {
                id: 'intro',
                title: '케이크 배달 게임에 오신 것을 환영합니다!',
                description: '이 게임에서는 모바일 기기를 기울여서 케이크를 안전하게 목적지까지 운반해야 합니다.',
                target: '#gameCanvas',
                position: 'center',
                action: 'none',
                validation: () => true,
                onComplete: () => {
                    this.highlightSystem.highlight('#gameCanvas', 'pulse');
                }
            },
            
            // 2단계: 센서 연결
            {
                id: 'sensor-connection',
                title: '센서 연결하기',
                description: 'QR 코드를 스캔하여 모바일 기기를 연결하세요. 연결되면 기기를 기울여서 케이크를 조작할 수 있습니다.',
                target: '#qrContainer',
                position: 'left',
                action: 'wait-sensor',
                validation: () => this.gameEngine.sensorConnected,
                onComplete: () => {
                    this.provideFeedback('success', '센서가 성공적으로 연결되었습니다!');
                }
            },
            
            // 3단계: 기본 조작 연습
            {
                id: 'basic-controls',
                title: '기본 조작 배우기',
                description: '기기를 좌우로 기울여서 케이크를 움직여보세요. 너무 급하게 움직이면 케이크가 떨어질 수 있습니다.',
                target: '#gameCanvas',
                position: 'bottom',
                action: 'tilt-practice',
                validation: () => this.checkTiltPractice(),
                onComplete: () => {
                    this.provideFeedback('success', '훌륭합니다! 기본 조작을 익혔습니다.');
                }
            },
            
            // 4단계: 케이크 안정성
            {
                id: 'cake-stability',
                title: '케이크 안정성 이해하기',
                description: '케이크는 기울기에 따라 불안정해집니다. 화면의 안정성 표시기를 주시하세요.',
                target: '.stability-indicator',
                position: 'right',
                action: 'stability-demo',
                validation: () => this.checkStabilityUnderstanding(),
                onComplete: () => {
                    this.provideFeedback('info', '안정성 관리가 성공의 핵심입니다!');
                }
            },
            
            // 5단계: 장애물 피하기
            {
                id: 'avoid-obstacles',
                title: '장애물 피하기',
                description: '경로에 있는 장애물을 피해서 케이크를 운반하세요. 충돌하면 점수가 감소합니다.',
                target: '#gameCanvas',
                position: 'top',
                action: 'obstacle-course',
                validation: () => this.checkObstacleAvoidance(),
                onComplete: () => {
                    this.provideFeedback('success', '장애물 회피를 성공적으로 완료했습니다!');
                }
            },
            
            // 6단계: 목표 지점 도달
            {
                id: 'reach-goal',
                title: '목표 지점 도달하기',
                description: '케이크를 목표 지점까지 안전하게 운반하세요. 성공하면 다음 레벨로 진행됩니다.',
                target: '.goal-area',
                position: 'top',
                action: 'reach-goal',
                validation: () => this.checkGoalReached(),
                onComplete: () => {
                    this.provideFeedback('celebration', '축하합니다! 첫 번째 배달을 완료했습니다!');
                }
            },
            
            // 7단계: 고급 기능 소개
            {
                id: 'advanced-features',
                title: '고급 기능들',
                description: '게임에는 다양한 케이크 타입, 특수 효과, 파워업 등이 있습니다. 계속 플레이하면서 발견해보세요!',
                target: '.game-info',
                position: 'right',
                action: 'none',
                validation: () => true,
                onComplete: () => {
                    this.completeTutorial();
                }
            }
        ];
    }
    
    /**
     * 튜토리얼 UI 생성
     */
    createTutorialUI() {
        // 메인 오버레이
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.className = 'tutorial-overlay';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-labelledby', 'tutorial-title');
        this.overlay.setAttribute('aria-describedby', 'tutorial-description');
        this.overlay.style.display = 'none';
        
        // 말풍선 컨테이너
        this.speechBubble = document.createElement('div');
        this.speechBubble.className = 'tutorial-speech-bubble';
        this.speechBubble.innerHTML = `
            <div class="tutorial-header">
                <h3 id="tutorial-title" class="tutorial-title"></h3>
                <button class="tutorial-close-btn" aria-label="튜토리얼 닫기">×</button>
            </div>
            <div id="tutorial-description" class="tutorial-description"></div>
            <div class="tutorial-progress">
                <div class="tutorial-progress-bar">
                    <div class="tutorial-progress-fill"></div>
                </div>
                <span class="tutorial-step-counter"></span>
            </div>
            <div class="tutorial-controls">
                <button class="tutorial-btn tutorial-prev-btn" disabled>이전</button>
                <button class="tutorial-btn tutorial-skip-btn">건너뛰기</button>
                <button class="tutorial-btn tutorial-next-btn">다음</button>
            </div>
        `;
        
        this.overlay.appendChild(this.speechBubble);
        document.body.appendChild(this.overlay);
        
        // UI 요소 참조 저장
        this.titleElement = this.overlay.querySelector('.tutorial-title');
        this.descriptionElement = this.overlay.querySelector('.tutorial-description');
        this.progressFill = this.overlay.querySelector('.tutorial-progress-fill');
        this.stepCounter = this.overlay.querySelector('.tutorial-step-counter');
        this.prevButton = this.overlay.querySelector('.tutorial-prev-btn');
        this.nextButton = this.overlay.querySelector('.tutorial-next-btn');
        this.skipButton = this.overlay.querySelector('.tutorial-skip-btn');
        this.closeButton = this.overlay.querySelector('.tutorial-close-btn');
        
        // 스타일 추가
        this.addTutorialStyles();
    }
    
    /**
     * 튜토리얼 스타일 추가
     */
    addTutorialStyles() {
        const style = document.createElement('style');
        style.id = 'tutorial-styles';
        style.textContent = `
            .tutorial-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(3px);
            }
            
            .tutorial-speech-bubble {
                background: var(--surface);
                color: var(--text-primary);
                border-radius: 15px;
                padding: 25px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                border: 2px solid var(--primary);
                position: relative;
                animation: tutorialSlideIn 0.3s ease-out;
            }
            
            .tutorial-speech-bubble::before {
                content: '';
                position: absolute;
                width: 0;
                height: 0;
                border-style: solid;
            }
            
            .tutorial-speech-bubble.position-top::before {
                bottom: -15px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 15px 15px 0 15px;
                border-color: var(--surface) transparent transparent transparent;
            }
            
            .tutorial-speech-bubble.position-bottom::before {
                top: -15px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 0 15px 15px 15px;
                border-color: transparent transparent var(--surface) transparent;
            }
            
            .tutorial-speech-bubble.position-left::before {
                right: -15px;
                top: 50%;
                transform: translateY(-50%);
                border-width: 15px 0 15px 15px;
                border-color: transparent transparent transparent var(--surface);
            }
            
            .tutorial-speech-bubble.position-right::before {
                left: -15px;
                top: 50%;
                transform: translateY(-50%);
                border-width: 15px 15px 15px 0;
                border-color: transparent var(--surface) transparent transparent;
            }
            
            .tutorial-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .tutorial-title {
                margin: 0;
                color: var(--primary);
                font-size: 1.2rem;
                font-weight: bold;
            }
            
            .tutorial-close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .tutorial-close-btn:hover {
                background: var(--error);
                color: white;
            }
            
            .tutorial-description {
                margin-bottom: 20px;
                line-height: 1.5;
                font-size: 1rem;
            }
            
            .tutorial-progress {
                margin-bottom: 20px;
            }
            
            .tutorial-progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(59, 130, 246, 0.2);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .tutorial-progress-fill {
                height: 100%;
                background: var(--primary);
                transition: width 0.3s ease;
                border-radius: 4px;
            }
            
            .tutorial-step-counter {
                font-size: 0.9rem;
                color: var(--text-secondary);
                text-align: center;
                display: block;
            }
            
            .tutorial-controls {
                display: flex;
                gap: 10px;
                justify-content: space-between;
            }
            
            .tutorial-btn {
                padding: 10px 15px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s ease;
                flex: 1;
            }
            
            .tutorial-prev-btn {
                background: var(--text-secondary);
                color: white;
            }
            
            .tutorial-prev-btn:disabled {
                background: rgba(100, 116, 139, 0.3);
                cursor: not-allowed;
            }
            
            .tutorial-skip-btn {
                background: var(--warning);
                color: white;
            }
            
            .tutorial-next-btn {
                background: var(--primary);
                color: white;
            }
            
            .tutorial-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .tutorial-btn:active:not(:disabled) {
                transform: translateY(0);
            }
            
            /* 하이라이트 효과 */
            .tutorial-highlight {
                position: relative;
                z-index: 9999;
            }
            
            .tutorial-highlight::before {
                content: '';
                position: absolute;
                top: -5px;
                left: -5px;
                right: -5px;
                bottom: -5px;
                border: 3px solid var(--primary);
                border-radius: 10px;
                animation: tutorialPulse 2s infinite;
                pointer-events: none;
            }
            
            .tutorial-highlight-overlay {
                position: fixed;
                background: rgba(59, 130, 246, 0.2);
                border: 3px solid var(--primary);
                border-radius: 10px;
                pointer-events: none;
                z-index: 9998;
                animation: tutorialPulse 2s infinite;
            }
            
            /* 애니메이션 */
            @keyframes tutorialSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.8) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
            
            @keyframes tutorialPulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.05); }
            }
            
            /* 모바일 최적화 */
            @media (max-width: 480px) {
                .tutorial-speech-bubble {
                    padding: 20px;
                    max-width: 95%;
                }
                
                .tutorial-title {
                    font-size: 1.1rem;
                }
                
                .tutorial-description {
                    font-size: 0.9rem;
                }
                
                .tutorial-btn {
                    padding: 8px 12px;
                    font-size: 0.9rem;
                }
            }
            
            /* 고대비 모드 */
            .high-contrast .tutorial-speech-bubble {
                border: 4px solid #ffffff;
                background: #000000;
            }
            
            .high-contrast .tutorial-highlight::before {
                border-color: #ffff00;
                border-width: 4px;
            }
            
            /* 애니메이션 감소 모드 */
            .reduced-motion .tutorial-speech-bubble {
                animation: none;
            }
            
            .reduced-motion .tutorial-highlight::before,
            .reduced-motion .tutorial-highlight-overlay {
                animation: none;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 버튼 이벤트
        this.nextButton.addEventListener('click', () => this.nextStep());
        this.prevButton.addEventListener('click', () => this.previousStep());
        this.skipButton.addEventListener('click', () => this.skipTutorial());
        this.closeButton.addEventListener('click', () => this.closeTutorial());
        
        // 키보드 이벤트
        document.addEventListener('keydown', this.handleKeyboardInput.bind(this));
        
        // 오버레이 클릭 시 닫기 (선택사항)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeTutorial();
            }
        });
    }
    
    /**
     * 키보드 입력 처리
     */
    handleKeyboardInput(event) {
        if (!this.isActive) return;
        
        switch (event.key) {
            case 'ArrowRight':
            case 'Enter':
                event.preventDefault();
                this.nextStep();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.previousStep();
                break;
            case 'Escape':
                event.preventDefault();
                this.closeTutorial();
                break;
            case 's':
            case 'S':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.skipTutorial();
                }
                break;
        }
    }
    
    /**
     * 튜토리얼 시작
     */
    startTutorial() {
        if (this.userProgress.completed) {
            const restart = confirm('튜토리얼을 이미 완료했습니다. 다시 시작하시겠습니까?');
            if (!restart) return;
        }
        
        this.isActive = true;
        this.currentStep = 0;
        this.overlay.style.display = 'flex';
        
        // 게임 일시정지
        if (this.gameEngine) {
            this.gameEngine.pauseGame();
        }
        
        this.executeCurrentStep();
        
        // 접근성 알림
        this.announceToScreenReader('튜토리얼이 시작되었습니다');
        
        console.log('🎓 튜토리얼 시작');
    }
    
    /**
     * 현재 단계 실행
     */
    executeCurrentStep() {
        const step = this.tutorialSteps[this.currentStep];
        if (!step) return;
        
        // UI 업데이트
        this.updateTutorialUI(step);
        
        // 대상 요소 하이라이트
        if (this.settings.highlightTargets && step.target) {
            this.highlightSystem.highlight(step.target, 'pulse');
        }
        
        // 말풍선 위치 조정
        this.positionSpeechBubble(step);
        
        // 단계별 액션 실행
        this.executeStepAction(step);
        
        // 완료 콜백 실행
        if (step.onComplete) {
            step.onComplete();
        }
        
        // 진행 상황 저장
        this.saveUserProgress();
        
        console.log(`🎓 튜토리얼 단계 ${this.currentStep + 1}: ${step.id}`);
    }
    
    /**
     * 튜토리얼 UI 업데이트
     */
    updateTutorialUI(step) {
        this.titleElement.textContent = step.title;
        this.descriptionElement.textContent = step.description;
        
        // 진행률 업데이트
        const progress = ((this.currentStep + 1) / this.tutorialSteps.length) * 100;
        this.progressFill.style.width = `${progress}%`;
        this.stepCounter.textContent = `${this.currentStep + 1} / ${this.tutorialSteps.length}`;
        
        // 버튼 상태 업데이트
        this.prevButton.disabled = this.currentStep === 0;
        this.nextButton.textContent = this.currentStep === this.tutorialSteps.length - 1 ? '완료' : '다음';
        
        // 건너뛰기 버튼 표시/숨김
        this.skipButton.style.display = this.settings.showSkipOption ? 'block' : 'none';
    }
    
    /**
     * 말풍선 위치 조정
     */
    positionSpeechBubble(step) {
        const bubble = this.speechBubble;
        const target = step.target ? document.querySelector(step.target) : null;
        
        // 이전 위치 클래스 제거
        bubble.classList.remove('position-top', 'position-bottom', 'position-left', 'position-right', 'position-center');
        
        if (!target || step.position === 'center') {
            bubble.classList.add('position-center');
            return;
        }
        
        const targetRect = target.getBoundingClientRect();
        const bubbleRect = bubble.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let position = step.position;
        
        // 자동 위치 조정
        if (position === 'auto') {
            if (targetRect.top > viewportHeight / 2) {
                position = 'top';
            } else {
                position = 'bottom';
            }
            
            if (targetRect.left < viewportWidth / 3) {
                position = 'right';
            } else if (targetRect.right > (viewportWidth * 2) / 3) {
                position = 'left';
            }
        }
        
        bubble.classList.add(`position-${position}`);
        
        // 위치에 따른 스타일 조정
        this.adjustBubblePosition(bubble, target, position);
    }
    
    /**
     * 말풍선 위치 세부 조정
     */
    adjustBubblePosition(bubble, target, position) {
        const targetRect = target.getBoundingClientRect();
        const bubbleRect = bubble.getBoundingClientRect();
        
        bubble.style.position = 'fixed';
        bubble.style.transform = 'none';
        
        switch (position) {
            case 'top':
                bubble.style.top = `${targetRect.top - bubbleRect.height - 20}px`;
                bubble.style.left = `${targetRect.left + (targetRect.width - bubbleRect.width) / 2}px`;
                break;
            case 'bottom':
                bubble.style.top = `${targetRect.bottom + 20}px`;
                bubble.style.left = `${targetRect.left + (targetRect.width - bubbleRect.width) / 2}px`;
                break;
            case 'left':
                bubble.style.top = `${targetRect.top + (targetRect.height - bubbleRect.height) / 2}px`;
                bubble.style.left = `${targetRect.left - bubbleRect.width - 20}px`;
                break;
            case 'right':
                bubble.style.top = `${targetRect.top + (targetRect.height - bubbleRect.height) / 2}px`;
                bubble.style.left = `${targetRect.right + 20}px`;
                break;
            default:
                bubble.style.top = '50%';
                bubble.style.left = '50%';
                bubble.style.transform = 'translate(-50%, -50%)';
        }
        
        // 화면 경계 확인 및 조정
        this.ensureBubbleInViewport(bubble);
    }
    
    /**
     * 말풍선이 화면 내에 있도록 보장
     */
    ensureBubbleInViewport(bubble) {
        const rect = bubble.getBoundingClientRect();
        const margin = 10;
        
        if (rect.left < margin) {
            bubble.style.left = `${margin}px`;
        } else if (rect.right > window.innerWidth - margin) {
            bubble.style.left = `${window.innerWidth - rect.width - margin}px`;
        }
        
        if (rect.top < margin) {
            bubble.style.top = `${margin}px`;
        } else if (rect.bottom > window.innerHeight - margin) {
            bubble.style.top = `${window.innerHeight - rect.height - margin}px`;
        }
    }
    
    /**
     * 단계별 액션 실행
     */
    executeStepAction(step) {
        switch (step.action) {
            case 'wait-sensor':
                this.waitForSensorConnection();
                break;
            case 'tilt-practice':
                this.startTiltPractice();
                break;
            case 'stability-demo':
                this.demonstrateStability();
                break;
            case 'obstacle-course':
                this.startObstacleCourse();
                break;
            case 'reach-goal':
                this.startGoalReaching();
                break;
            default:
                // 액션이 없는 경우 자동으로 다음 단계로 진행 가능
                if (this.settings.autoAdvance) {
                    setTimeout(() => this.nextStep(), 3000);
                }
        }
    }
    
    /**
     * 센서 연결 대기
     */
    waitForSensorConnection() {
        const checkConnection = () => {
            if (this.gameEngine && this.gameEngine.sensorConnected) {
                this.nextStep();
            } else {
                setTimeout(checkConnection, 1000);
            }
        };
        
        checkConnection();
    }
    
    /**
     * 기울기 연습 시작
     */
    startTiltPractice() {
        this.tiltPracticeData = {
            leftTilts: 0,
            rightTilts: 0,
            requiredTilts: 3
        };
        
        // 센서 데이터 모니터링
        if (this.gameEngine) {
            this.gameEngine.on('sensor-data', this.handleTiltPracticeData.bind(this));
        }
    }
    
    /**
     * 기울기 연습 데이터 처리
     */
    handleTiltPracticeData(sensorData) {
        if (!this.tiltPracticeData) return;
        
        const tilt = sensorData.data.orientation?.gamma || 0;
        
        if (tilt < -15 && this.tiltPracticeData.leftTilts < this.tiltPracticeData.requiredTilts) {
            this.tiltPracticeData.leftTilts++;
            this.provideFeedback('info', `좌측 기울기 ${this.tiltPracticeData.leftTilts}/${this.tiltPracticeData.requiredTilts}`);
        } else if (tilt > 15 && this.tiltPracticeData.rightTilts < this.tiltPracticeData.requiredTilts) {
            this.tiltPracticeData.rightTilts++;
            this.provideFeedback('info', `우측 기울기 ${this.tiltPracticeData.rightTilts}/${this.tiltPracticeData.requiredTilts}`);
        }
    }
    
    /**
     * 기울기 연습 확인
     */
    checkTiltPractice() {
        return this.tiltPracticeData && 
               this.tiltPracticeData.leftTilts >= this.tiltPracticeData.requiredTilts &&
               this.tiltPracticeData.rightTilts >= this.tiltPracticeData.requiredTilts;
    }
    
    /**
     * 안정성 데모
     */
    demonstrateStability() {
        // 안정성 표시기 생성 (실제 게임에서 구현)
        this.createStabilityIndicator();
        
        // 안정성 변화 시뮬레이션
        this.simulateStabilityChanges();
    }
    
    /**
     * 안정성 표시기 생성
     */
    createStabilityIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'stability-indicator';
        indicator.innerHTML = `
            <div class="stability-label">케이크 안정성</div>
            <div class="stability-bar">
                <div class="stability-fill"></div>
            </div>
        `;
        
        document.querySelector('.game-info').appendChild(indicator);
    }
    
    /**
     * 안정성 변화 시뮬레이션
     */
    simulateStabilityChanges() {
        let stability = 100;
        const interval = setInterval(() => {
            stability = Math.max(0, stability - Math.random() * 10);
            
            const fill = document.querySelector('.stability-fill');
            if (fill) {
                fill.style.width = `${stability}%`;
                fill.style.backgroundColor = stability > 60 ? '#10b981' : stability > 30 ? '#f59e0b' : '#ef4444';
            }
            
            if (stability <= 0) {
                clearInterval(interval);
                this.provideFeedback('warning', '케이크가 불안정해졌습니다!');
            }
        }, 500);
        
        // 5초 후 정리
        setTimeout(() => {
            clearInterval(interval);
            this.stabilityUnderstanding = true;
        }, 5000);
    }
    
    /**
     * 안정성 이해도 확인
     */
    checkStabilityUnderstanding() {
        return this.stabilityUnderstanding || false;
    }
    
    /**
     * 장애물 코스 시작
     */
    startObstacleCourse() {
        // 간단한 장애물 생성 (실제 게임에서 구현)
        this.createObstacles();
        this.obstaclesPassed = 0;
        this.requiredObstacles = 3;
    }
    
    /**
     * 장애물 생성
     */
    createObstacles() {
        // 실제 게임 엔진에서 장애물 생성
        if (this.gameEngine && this.gameEngine.createTutorialObstacles) {
            this.gameEngine.createTutorialObstacles(3);
        }
    }
    
    /**
     * 장애물 회피 확인
     */
    checkObstacleAvoidance() {
        return this.obstaclesPassed >= this.requiredObstacles;
    }
    
    /**
     * 목표 도달 시작
     */
    startGoalReaching() {
        // 목표 지점 생성 및 표시
        this.createGoalArea();
        this.goalReached = false;
    }
    
    /**
     * 목표 영역 생성
     */
    createGoalArea() {
        // 실제 게임 엔진에서 목표 영역 생성
        if (this.gameEngine && this.gameEngine.createTutorialGoal) {
            this.gameEngine.createTutorialGoal();
        }
    }
    
    /**
     * 목표 도달 확인
     */
    checkGoalReached() {
        return this.goalReached;
    }
    
    /**
     * 다음 단계
     */
    nextStep() {
        const currentStep = this.tutorialSteps[this.currentStep];
        
        // 현재 단계 검증
        if (currentStep && currentStep.validation && !currentStep.validation()) {
            this.provideFeedback('warning', '현재 단계를 완료해주세요.');
            return;
        }
        
        // 하이라이트 제거
        this.highlightSystem.clearHighlights();
        
        if (this.currentStep < this.tutorialSteps.length - 1) {
            this.currentStep++;
            this.executeCurrentStep();
        } else {
            this.completeTutorial();
        }
    }
    
    /**
     * 이전 단계
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.highlightSystem.clearHighlights();
            this.currentStep--;
            this.executeCurrentStep();
        }
    }
    
    /**
     * 튜토리얼 건너뛰기
     */
    skipTutorial() {
        const confirm = window.confirm('튜토리얼을 건너뛰시겠습니까?');
        if (confirm) {
            this.closeTutorial();
        }
    }
    
    /**
     * 튜토리얼 닫기
     */
    closeTutorial() {
        this.isActive = false;
        this.overlay.style.display = 'none';
        this.highlightSystem.clearHighlights();
        
        // 게임 재개
        if (this.gameEngine) {
            this.gameEngine.resumeGame();
        }
        
        this.announceToScreenReader('튜토리얼이 종료되었습니다');
        console.log('🎓 튜토리얼 종료');
    }
    
    /**
     * 튜토리얼 완료
     */
    completeTutorial() {
        this.userProgress.completed = true;
        this.userProgress.completedAt = new Date().toISOString();
        this.saveUserProgress();
        
        this.provideFeedback('celebration', '튜토리얼을 완료했습니다! 이제 게임을 즐겨보세요.');
        
        setTimeout(() => {
            this.closeTutorial();
        }, 3000);
        
        console.log('🎉 튜토리얼 완료!');
    }
    
    /**
     * 피드백 제공
     */
    provideFeedback(type, message) {
        // 시각적 피드백
        this.showFeedbackMessage(type, message);
        
        // 햅틱 피드백
        if (this.settings.vibrateFeedback && 'vibrate' in navigator) {
            const patterns = {
                success: [100, 50, 100],
                warning: [200],
                error: [100, 50, 100, 50, 100],
                info: [50],
                celebration: [100, 50, 100, 50, 200]
            };
            
            navigator.vibrate(patterns[type] || patterns.info);
        }
        
        // 사운드 피드백 (선택사항)
        if (this.settings.playSound) {
            this.playFeedbackSound(type);
        }
        
        // 접근성 알림
        this.announceToScreenReader(message);
    }
    
    /**
     * 피드백 메시지 표시
     */
    showFeedbackMessage(type, message) {
        const feedback = document.createElement('div');
        feedback.className = `tutorial-feedback tutorial-feedback-${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10001;
            animation: tutorialFeedbackSlide 0.3s ease-out;
            max-width: 300px;
        `;
        
        // 타입별 색상
        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
            celebration: '#8b5cf6'
        };
        
        feedback.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(feedback);
        
        // 3초 후 제거
        setTimeout(() => {
            feedback.style.animation = 'tutorialFeedbackSlideOut 0.3s ease-in';
            setTimeout(() => feedback.remove(), 300);
        }, 3000);
    }
    
    /**
     * 피드백 사운드 재생
     */
    playFeedbackSound(type) {
        // Web Audio API를 사용한 간단한 사운드 생성
        if (!window.AudioContext && !window.webkitAudioContext) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 타입별 주파수
        const frequencies = {
            success: 800,
            warning: 400,
            error: 200,
            info: 600,
            celebration: 1000
        };
        
        oscillator.frequency.setValueAtTime(frequencies[type] || frequencies.info, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
    
    /**
     * 스크린 리더 알림
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => announcement.remove(), 3000);
    }
    
    /**
     * 사용자 진행 상태 로드
     */
    loadUserProgress() {
        try {
            const saved = localStorage.getItem('cakeDeliveryTutorialProgress');
            return saved ? JSON.parse(saved) : {
                completed: false,
                currentStep: 0,
                completedAt: null
            };
        } catch (error) {
            console.warn('튜토리얼 진행 상태 로드 실패:', error);
            return {
                completed: false,
                currentStep: 0,
                completedAt: null
            };
        }
    }
    
    /**
     * 사용자 진행 상태 저장
     */
    saveUserProgress() {
        try {
            const progress = {
                completed: this.userProgress.completed,
                currentStep: this.currentStep,
                completedAt: this.userProgress.completedAt
            };
            
            localStorage.setItem('cakeDeliveryTutorialProgress', JSON.stringify(progress));
        } catch (error) {
            console.warn('튜토리얼 진행 상태 저장 실패:', error);
        }
    }
    
    /**
     * 튜토리얼 재시작
     */
    restartTutorial() {
        this.userProgress = {
            completed: false,
            currentStep: 0,
            completedAt: null
        };
        this.saveUserProgress();
        this.startTutorial();
    }
    
    /**
     * 정리
     */
    dispose() {
        // 이벤트 리스너 제거
        document.removeEventListener('keydown', this.handleKeyboardInput);
        
        // UI 요소 제거
        if (this.overlay) {
            this.overlay.remove();
        }
        
        // 하이라이트 시스템 정리
        if (this.highlightSystem) {
            this.highlightSystem.dispose();
        }
        
        // 스타일 제거
        const style = document.getElementById('tutorial-styles');
        if (style) style.remove();
        
        console.log('✅ 인터랙티브 튜토리얼 관리자 정리 완료');
    }
}

/**
 * 하이라이트 시스템
 * 튜토리얼 대상 요소를 강조 표시합니다.
 */
class HighlightSystem {
    constructor() {
        this.activeHighlights = new Map();
        this.overlayElements = new Set();
    }
    
    /**
     * 요소 하이라이트
     */
    highlight(selector, effect = 'outline') {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`하이라이트 대상을 찾을 수 없습니다: ${selector}`);
            return;
        }
        
        // 기존 하이라이트 제거
        this.clearHighlight(selector);
        
        switch (effect) {
            case 'outline':
                this.applyOutlineHighlight(element, selector);
                break;
            case 'pulse':
                this.applyPulseHighlight(element, selector);
                break;
            case 'overlay':
                this.applyOverlayHighlight(element, selector);
                break;
            case 'glow':
                this.applyGlowHighlight(element, selector);
                break;
        }
    }
    
    /**
     * 외곽선 하이라이트 적용
     */
    applyOutlineHighlight(element, selector) {
        element.classList.add('tutorial-highlight');
        this.activeHighlights.set(selector, {
            element,
            effect: 'outline',
            originalStyle: element.style.cssText
        });
    }
    
    /**
     * 펄스 하이라이트 적용
     */
    applyPulseHighlight(element, selector) {
        element.classList.add('tutorial-highlight');
        this.activeHighlights.set(selector, {
            element,
            effect: 'pulse',
            originalStyle: element.style.cssText
        });
    }
    
    /**
     * 오버레이 하이라이트 적용
     */
    applyOverlayHighlight(element, selector) {
        const rect = element.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-highlight-overlay';
        overlay.style.cssText = `
            top: ${rect.top + window.scrollY}px;
            left: ${rect.left + window.scrollX}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
        `;
        
        document.body.appendChild(overlay);
        this.overlayElements.add(overlay);
        
        this.activeHighlights.set(selector, {
            element,
            effect: 'overlay',
            overlay,
            originalStyle: element.style.cssText
        });
    }
    
    /**
     * 글로우 하이라이트 적용
     */
    applyGlowHighlight(element, selector) {
        const originalBoxShadow = element.style.boxShadow;
        element.style.boxShadow = '0 0 20px 5px rgba(59, 130, 246, 0.6)';
        element.style.transition = 'box-shadow 0.3s ease';
        
        this.activeHighlights.set(selector, {
            element,
            effect: 'glow',
            originalStyle: element.style.cssText,
            originalBoxShadow
        });
    }
    
    /**
     * 특정 하이라이트 제거
     */
    clearHighlight(selector) {
        const highlight = this.activeHighlights.get(selector);
        if (!highlight) return;
        
        const { element, effect, overlay, originalStyle } = highlight;
        
        switch (effect) {
            case 'outline':
            case 'pulse':
                element.classList.remove('tutorial-highlight');
                break;
            case 'overlay':
                if (overlay) {
                    overlay.remove();
                    this.overlayElements.delete(overlay);
                }
                break;
            case 'glow':
                element.style.cssText = originalStyle;
                break;
        }
        
        this.activeHighlights.delete(selector);
    }
    
    /**
     * 모든 하이라이트 제거
     */
    clearHighlights() {
        for (const selector of this.activeHighlights.keys()) {
            this.clearHighlight(selector);
        }
        
        // 남은 오버레이 요소들 정리
        for (const overlay of this.overlayElements) {
            overlay.remove();
        }
        this.overlayElements.clear();
    }
    
    /**
     * 정리
     */
    dispose() {
        this.clearHighlights();
        this.activeHighlights.clear();
        this.overlayElements.clear();
    }
}