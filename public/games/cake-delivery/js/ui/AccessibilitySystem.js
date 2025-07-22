/**
 * 접근성 시스템
 * 색맹 지원, 고대비 모드, 폰트 크기 조절, 스크린 리더 지원 등을 제공합니다.
 */
class AccessibilitySystem {
    constructor() {
        this.colorBlindSupport = false;
        this.highContrastMode = false;
        this.fontSize = 'normal';
        this.screenReader = this.detectScreenReader();
        this.reducedMotion = false;
        this.hapticEnabled = 'vibrate' in navigator;
        
        // 접근성 설정 로드
        this.loadAccessibilitySettings();
        
        // 시스템 설정 감지
        this.detectSystemPreferences();
        
        // 접근성 기능 초기화
        this.init();
    }
    
    /**
     * 접근성 시스템 초기화
     */
    init() {
        this.setupColorBlindSupport();
        this.setupHighContrastMode();
        this.setupFontSizeControl();
        this.setupScreenReaderSupport();
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupARIALabels();
        this.createAccessibilityMenu();
        
        console.log('✅ 접근성 시스템 초기화 완료');
    }
    
    /**
     * 접근성 설정 로드
     */
    loadAccessibilitySettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('cakeDeliveryAccessibility') || '{}');
            
            this.colorBlindSupport = settings.colorBlindSupport || false;
            this.highContrastMode = settings.highContrastMode || false;
            this.fontSize = settings.fontSize || 'normal';
            this.reducedMotion = settings.reducedMotion || false;
            this.hapticEnabled = settings.hapticEnabled !== false && 'vibrate' in navigator;
            
        } catch (error) {
            console.warn('접근성 설정 로드 실패:', error);
        }
    }
    
    /**
     * 접근성 설정 저장
     */
    saveAccessibilitySettings() {
        try {
            const settings = {
                colorBlindSupport: this.colorBlindSupport,
                highContrastMode: this.highContrastMode,
                fontSize: this.fontSize,
                reducedMotion: this.reducedMotion,
                hapticEnabled: this.hapticEnabled
            };
            
            localStorage.setItem('cakeDeliveryAccessibility', JSON.stringify(settings));
        } catch (error) {
            console.warn('접근성 설정 저장 실패:', error);
        }
    }
    
    /**
     * 시스템 설정 감지
     */
    detectSystemPreferences() {
        // 고대비 모드 감지
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            this.highContrastMode = true;
        }
        
        // 애니메이션 감소 모드 감지
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.reducedMotion = true;
        }
        
        // 다크 모드 감지
        this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 시스템 설정 변경 감지
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            this.setHighContrastMode(e.matches);
        });
        
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.setReducedMotion(e.matches);
        });
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            this.darkMode = e.matches;
            this.updateColorScheme();
        });
    }
    
    /**
     * 색맹 지원 설정
     */
    setupColorBlindSupport() {
        if (this.colorBlindSupport) {
            this.applyColorBlindSupport();
        }
    }
    
    /**
     * 색맹 지원 적용
     */
    applyColorBlindSupport() {
        // 색맹 친화적 색상 팔레트
        const colorBlindPalette = {
            // 적록 색맹을 위한 색상
            red: '#D55E00',      // 주황빛 빨강
            green: '#009E73',    // 청록빛 초록
            blue: '#0072B2',     // 파랑
            yellow: '#F0E442',   // 노랑
            orange: '#E69F00',   // 주황
            purple: '#CC79A7',   // 자주
            
            // UI 색상
            success: '#009E73',
            warning: '#F0E442',
            error: '#D55E00',
            info: '#0072B2'
        };
        
        // CSS 변수 업데이트
        const root = document.documentElement;
        root.style.setProperty('--success', colorBlindPalette.success);
        root.style.setProperty('--warning', colorBlindPalette.warning);
        root.style.setProperty('--error', colorBlindPalette.error);
        root.style.setProperty('--primary', colorBlindPalette.blue);
        
        // 색맹 지원 클래스 추가
        document.body.classList.add('colorblind-support');
        
        // 색상 외에 패턴이나 모양으로도 정보 전달
        this.addVisualPatterns();
        
        console.log('✅ 색맹 지원 모드 활성화');
    }
    
    /**
     * 시각적 패턴 추가
     */
    addVisualPatterns() {
        const style = document.createElement('style');
        style.id = 'colorblind-patterns';
        style.textContent = `
            .colorblind-support .success-indicator::before {
                content: '✓ ';
                font-weight: bold;
            }
            
            .colorblind-support .warning-indicator::before {
                content: '⚠ ';
                font-weight: bold;
            }
            
            .colorblind-support .error-indicator::before {
                content: '✗ ';
                font-weight: bold;
            }
            
            .colorblind-support .info-indicator::before {
                content: 'ℹ ';
                font-weight: bold;
            }
            
            /* 케이크 타입별 패턴 */
            .colorblind-support .cake-basic {
                border-style: solid;
            }
            
            .colorblind-support .cake-strawberry {
                border-style: dotted;
            }
            
            .colorblind-support .cake-chocolate {
                border-style: dashed;
            }
            
            .colorblind-support .cake-wedding {
                border-style: double;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 고대비 모드 설정
     */
    setupHighContrastMode() {
        if (this.highContrastMode) {
            this.enableHighContrastMode();
        }
    }
    
    /**
     * 고대비 모드 활성화
     */
    enableHighContrastMode() {
        document.body.classList.add('high-contrast');
        
        // 고대비 색상 적용
        const root = document.documentElement;
        root.style.setProperty('--primary', '#0066ff');
        root.style.setProperty('--secondary', '#6600ff');
        root.style.setProperty('--success', '#00aa00');
        root.style.setProperty('--warning', '#ffaa00');
        root.style.setProperty('--error', '#ff0000');
        root.style.setProperty('--background', '#000000');
        root.style.setProperty('--surface', '#333333');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#cccccc');
        
        // 고대비 스타일 추가
        this.addHighContrastStyles();
        
        console.log('✅ 고대비 모드 활성화');
    }
    
    /**
     * 고대비 스타일 추가
     */
    addHighContrastStyles() {
        const style = document.createElement('style');
        style.id = 'high-contrast-styles';
        style.textContent = `
            .high-contrast {
                filter: contrast(150%);
            }
            
            .high-contrast .session-panel,
            .high-contrast .game-info {
                border: 3px solid #ffffff;
                background: #000000;
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
            }
            
            .high-contrast button,
            .high-contrast a {
                border: 2px solid #ffffff;
                background: #0066ff;
                color: #ffffff;
                font-weight: bold;
            }
            
            .high-contrast button:hover,
            .high-contrast a:hover {
                background: #ffffff;
                color: #000000;
            }
            
            .high-contrast #gameCanvas {
                filter: contrast(120%) brightness(110%);
            }
            
            .high-contrast .loading-screen {
                background: #000000;
                border: 2px solid #ffffff;
            }
            
            .high-contrast .debug-panel {
                border: 2px solid #ffffff;
                background: #000000;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 폰트 크기 제어 설정
     */
    setupFontSizeControl() {
        this.updateFontSize(this.fontSize);
    }
    
    /**
     * 폰트 크기 업데이트
     */
    updateFontSize(size) {
        this.fontSize = size;
        
        const scaleFactor = {
            small: 0.8,
            normal: 1.0,
            large: 1.2,
            xlarge: 1.5,
            xxlarge: 1.8
        }[size] || 1.0;
        
        document.documentElement.style.fontSize = `${16 * scaleFactor}px`;
        document.body.classList.remove('font-small', 'font-normal', 'font-large', 'font-xlarge', 'font-xxlarge');
        document.body.classList.add(`font-${size}`);
        
        // 폰트 크기에 따른 레이아웃 조정
        this.adjustLayoutForFontSize(scaleFactor);
        
        this.saveAccessibilitySettings();
        console.log(`📝 폰트 크기 변경: ${size} (${scaleFactor}x)`);
    }
    
    /**
     * 폰트 크기에 따른 레이아웃 조정
     */
    adjustLayoutForFontSize(scaleFactor) {
        const style = document.getElementById('font-size-adjustments') || document.createElement('style');
        style.id = 'font-size-adjustments';
        
        style.textContent = `
            .font-large .session-panel,
            .font-large .game-info,
            .font-xlarge .session-panel,
            .font-xlarge .game-info,
            .font-xxlarge .session-panel,
            .font-xxlarge .game-info {
                padding: ${15 * scaleFactor}px;
                max-width: ${300 * scaleFactor}px;
            }
            
            .font-large button,
            .font-large a,
            .font-xlarge button,
            .font-xlarge a,
            .font-xxlarge button,
            .font-xxlarge a {
                padding: ${12 * scaleFactor}px ${20 * scaleFactor}px;
                min-width: ${48 * scaleFactor}px;
                min-height: ${48 * scaleFactor}px;
            }
            
            .font-large .qr-container canvas,
            .font-large .qr-container img,
            .font-xlarge .qr-container canvas,
            .font-xlarge .qr-container img,
            .font-xxlarge .qr-container canvas,
            .font-xxlarge .qr-container img {
                max-width: ${120 * Math.min(scaleFactor, 1.2)}px;
                max-height: ${120 * Math.min(scaleFactor, 1.2)}px;
            }
        `;
        
        if (!document.head.contains(style)) {
            document.head.appendChild(style);
        }
    }
    
    /**
     * 스크린 리더 지원 설정
     */
    setupScreenReaderSupport() {
        // ARIA 레이블 및 역할 설정
        this.setupARIALabels();
        
        // 라이브 리전 설정
        this.setupLiveRegions();
        
        // 스크린 리더용 텍스트 추가
        this.addScreenReaderText();
        
        // 키보드 네비게이션 개선
        this.enhanceKeyboardNavigation();
    }
    
    /**
     * ARIA 레이블 설정
     */
    setupARIALabels() {
        // 게임 캔버스
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.setAttribute('role', 'application');
            canvas.setAttribute('aria-label', '케이크 배달 게임 플레이 영역');
            canvas.setAttribute('aria-describedby', 'game-instructions');
        }
        
        // 세션 코드
        const sessionCode = document.getElementById('sessionCode');
        if (sessionCode) {
            sessionCode.setAttribute('aria-label', '세션 코드');
            sessionCode.setAttribute('role', 'status');
            sessionCode.setAttribute('aria-live', 'polite');
        }
        
        // 연결 상태
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.setAttribute('aria-label', '연결 상태');
            connectionStatus.setAttribute('role', 'status');
            connectionStatus.setAttribute('aria-live', 'assertive');
        }
        
        // 점수 표시
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.setAttribute('aria-label', '현재 점수');
            scoreDisplay.setAttribute('role', 'status');
            scoreDisplay.setAttribute('aria-live', 'polite');
        }
        
        // 타이머 표시
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.setAttribute('aria-label', '남은 시간');
            timerDisplay.setAttribute('role', 'timer');
            timerDisplay.setAttribute('aria-live', 'polite');
        }
        
        // 레벨 표시
        const levelDisplay = document.getElementById('levelDisplay');
        if (levelDisplay) {
            levelDisplay.setAttribute('aria-label', '현재 레벨');
            levelDisplay.setAttribute('role', 'status');
            levelDisplay.setAttribute('aria-live', 'polite');
        }
        
        // 버튼들
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.setAttribute('aria-label', '게임 재시작');
            restartButton.setAttribute('aria-describedby', 'restart-help');
        }
        
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
            pauseButton.setAttribute('aria-label', '게임 일시정지 또는 재개');
            pauseButton.setAttribute('aria-describedby', 'pause-help');
        }
    }
    
    /**
     * 라이브 리전 설정
     */
    setupLiveRegions() {
        // 게임 상태 알림용 라이브 리전
        const gameStatusRegion = document.createElement('div');
        gameStatusRegion.id = 'game-status-live';
        gameStatusRegion.setAttribute('aria-live', 'assertive');
        gameStatusRegion.setAttribute('aria-atomic', 'true');
        gameStatusRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(gameStatusRegion);
        
        // 점수 변화 알림용 라이브 리전
        const scoreChangeRegion = document.createElement('div');
        scoreChangeRegion.id = 'score-change-live';
        scoreChangeRegion.setAttribute('aria-live', 'polite');
        scoreChangeRegion.setAttribute('aria-atomic', 'false');
        scoreChangeRegion.style.cssText = gameStatusRegion.style.cssText;
        document.body.appendChild(scoreChangeRegion);
        
        this.gameStatusRegion = gameStatusRegion;
        this.scoreChangeRegion = scoreChangeRegion;
    }
    
    /**
     * 스크린 리더용 텍스트 추가
     */
    addScreenReaderText() {
        // 게임 설명
        const gameInstructions = document.createElement('div');
        gameInstructions.id = 'game-instructions';
        gameInstructions.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        gameInstructions.textContent = `
            케이크 배달 게임입니다. 모바일 기기를 기울여서 케이크를 목적지까지 안전하게 운반하세요. 
            케이크가 떨어지거나 뒤집어지지 않도록 조심하세요. 
            화살표 키로도 조작할 수 있습니다.
        `;
        document.body.appendChild(gameInstructions);
        
        // 버튼 도움말
        const restartHelp = document.createElement('div');
        restartHelp.id = 'restart-help';
        restartHelp.style.cssText = gameInstructions.style.cssText;
        restartHelp.textContent = '게임을 처음부터 다시 시작합니다. 단축키: F5';
        document.body.appendChild(restartHelp);
        
        const pauseHelp = document.createElement('div');
        pauseHelp.id = 'pause-help';
        pauseHelp.style.cssText = gameInstructions.style.cssText;
        pauseHelp.textContent = '게임을 일시정지하거나 재개합니다. 단축키: 스페이스바';
        document.body.appendChild(pauseHelp);
    }
    
    /**
     * 키보드 네비게이션 설정
     */
    setupKeyboardNavigation() {
        // 포커스 가능한 요소들 찾기
        this.updateFocusableElements();
        
        // 키보드 이벤트 리스너
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
        
        // 포커스 표시 개선
        this.improveFocusIndicators();
    }
    
    /**
     * 포커스 가능한 요소들 업데이트
     */
    updateFocusableElements() {
        this.focusableElements = Array.from(document.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.disabled && el.offsetParent !== null);
        
        // 탭 인덱스 설정
        this.focusableElements.forEach((element, index) => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
        });
    }
    
    /**
     * 키보드 네비게이션 처리
     */
    handleKeyboardNavigation(event) {
        const { key, ctrlKey, altKey, shiftKey } = event;
        
        // 접근성 단축키
        if (altKey) {
            switch (key) {
                case '1':
                    event.preventDefault();
                    this.toggleColorBlindSupport();
                    break;
                case '2':
                    event.preventDefault();
                    this.toggleHighContrastMode();
                    break;
                case '3':
                    event.preventDefault();
                    this.cycleFontSize();
                    break;
                case '4':
                    event.preventDefault();
                    this.toggleReducedMotion();
                    break;
                case 'h':
                    event.preventDefault();
                    this.showAccessibilityHelp();
                    break;
            }
        }
        
        // 게임 단축키
        switch (key) {
            case 'F1':
                event.preventDefault();
                this.showAccessibilityHelp();
                break;
            case 'Escape':
                event.preventDefault();
                this.closeAccessibilityMenu();
                break;
        }
        
        // 탭 네비게이션 개선
        if (key === 'Tab') {
            this.handleTabNavigation(event);
        }
    }
    
    /**
     * 탭 네비게이션 처리
     */
    handleTabNavigation(event) {
        const currentIndex = this.focusableElements.indexOf(document.activeElement);
        
        if (currentIndex === -1) return;
        
        let nextIndex;
        if (event.shiftKey) {
            // Shift+Tab (이전 요소)
            nextIndex = currentIndex === 0 ? this.focusableElements.length - 1 : currentIndex - 1;
        } else {
            // Tab (다음 요소)
            nextIndex = currentIndex === this.focusableElements.length - 1 ? 0 : currentIndex + 1;
        }
        
        event.preventDefault();
        this.focusableElements[nextIndex].focus();
    }
    
    /**
     * 포커스 표시 개선
     */
    improveFocusIndicators() {
        const style = document.createElement('style');
        style.id = 'focus-indicators';
        style.textContent = `
            *:focus {
                outline: 3px solid #0066ff;
                outline-offset: 2px;
            }
            
            button:focus,
            a:focus {
                outline: 3px solid #ffffff;
                outline-offset: 2px;
                box-shadow: 0 0 0 6px #0066ff;
            }
            
            .high-contrast *:focus {
                outline: 4px solid #ffff00;
                outline-offset: 3px;
            }
            
            /* 마우스 클릭 시에는 포커스 표시 제거 */
            .mouse-user *:focus {
                outline: none;
                box-shadow: none;
            }
        `;
        
        document.head.appendChild(style);
        
        // 마우스/키보드 사용 감지
        document.addEventListener('mousedown', () => {
            document.body.classList.add('mouse-user');
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.remove('mouse-user');
            }
        });
    }
    
    /**
     * 포커스 관리 설정
     */
    setupFocusManagement() {
        // 모달이나 오버레이가 열릴 때 포커스 트랩
        this.focusStack = [];
        
        // 페이지 로드 시 첫 번째 포커스 가능한 요소에 포커스
        window.addEventListener('load', () => {
            setTimeout(() => {
                const firstFocusable = this.focusableElements[0];
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            }, 100);
        });
    }
    
    /**
     * 접근성 메뉴 생성
     */
    createAccessibilityMenu() {
        const menu = document.createElement('div');
        menu.id = 'accessibility-menu';
        menu.className = 'accessibility-menu';
        menu.setAttribute('role', 'dialog');
        menu.setAttribute('aria-labelledby', 'accessibility-menu-title');
        menu.setAttribute('aria-hidden', 'true');
        
        menu.innerHTML = `
            <div class="accessibility-menu-content">
                <h2 id="accessibility-menu-title">접근성 설정</h2>
                
                <div class="accessibility-option">
                    <label>
                        <input type="checkbox" id="colorblind-toggle" ${this.colorBlindSupport ? 'checked' : ''}>
                        색맹 지원 모드 (Alt+1)
                    </label>
                    <p class="option-description">색맹 친화적 색상과 패턴을 사용합니다.</p>
                </div>
                
                <div class="accessibility-option">
                    <label>
                        <input type="checkbox" id="contrast-toggle" ${this.highContrastMode ? 'checked' : ''}>
                        고대비 모드 (Alt+2)
                    </label>
                    <p class="option-description">높은 대비로 텍스트와 UI를 표시합니다.</p>
                </div>
                
                <div class="accessibility-option">
                    <label for="font-size-select">폰트 크기 (Alt+3)</label>
                    <select id="font-size-select">
                        <option value="small" ${this.fontSize === 'small' ? 'selected' : ''}>작게</option>
                        <option value="normal" ${this.fontSize === 'normal' ? 'selected' : ''}>보통</option>
                        <option value="large" ${this.fontSize === 'large' ? 'selected' : ''}>크게</option>
                        <option value="xlarge" ${this.fontSize === 'xlarge' ? 'selected' : ''}>매우 크게</option>
                        <option value="xxlarge" ${this.fontSize === 'xxlarge' ? 'selected' : ''}>가장 크게</option>
                    </select>
                </div>
                
                <div class="accessibility-option">
                    <label>
                        <input type="checkbox" id="motion-toggle" ${this.reducedMotion ? 'checked' : ''}>
                        애니메이션 감소 (Alt+4)
                    </label>
                    <p class="option-description">애니메이션과 전환 효과를 줄입니다.</p>
                </div>
                
                <div class="accessibility-option">
                    <label>
                        <input type="checkbox" id="haptic-toggle" ${this.hapticEnabled ? 'checked' : ''}>
                        햅틱 피드백
                    </label>
                    <p class="option-description">진동을 통한 촉각 피드백을 제공합니다.</p>
                </div>
                
                <div class="accessibility-menu-buttons">
                    <button id="accessibility-help-btn">도움말 (F1)</button>
                    <button id="accessibility-close-btn">닫기 (Esc)</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // 메뉴 스타일 추가
        this.addAccessibilityMenuStyles();
        
        // 메뉴 이벤트 설정
        this.setupAccessibilityMenuEvents();
    }
    
    /**
     * 접근성 메뉴 스타일 추가
     */
    addAccessibilityMenuStyles() {
        const style = document.createElement('style');
        style.id = 'accessibility-menu-styles';
        style.textContent = `
            .accessibility-menu {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            
            .accessibility-menu[aria-hidden="false"] {
                display: flex;
            }
            
            .accessibility-menu-content {
                background: var(--surface);
                color: var(--text-primary);
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                border: 2px solid var(--primary);
            }
            
            .accessibility-menu h2 {
                margin: 0 0 20px 0;
                color: var(--primary);
                text-align: center;
            }
            
            .accessibility-option {
                margin-bottom: 20px;
                padding: 15px;
                border: 1px solid var(--text-secondary);
                border-radius: 5px;
            }
            
            .accessibility-option label {
                display: block;
                font-weight: bold;
                margin-bottom: 5px;
                cursor: pointer;
            }
            
            .accessibility-option input[type="checkbox"] {
                margin-right: 10px;
                transform: scale(1.2);
            }
            
            .accessibility-option select {
                width: 100%;
                padding: 8px;
                margin-top: 5px;
                background: var(--background);
                color: var(--text-primary);
                border: 1px solid var(--text-secondary);
                border-radius: 3px;
            }
            
            .option-description {
                font-size: 0.9em;
                color: var(--text-secondary);
                margin: 5px 0 0 0;
                font-style: italic;
            }
            
            .accessibility-menu-buttons {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 20px;
            }
            
            .accessibility-menu-buttons button {
                padding: 10px 20px;
                background: var(--primary);
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .accessibility-menu-buttons button:hover {
                background: var(--secondary);
            }
            
            /* 고대비 모드에서의 메뉴 스타일 */
            .high-contrast .accessibility-menu-content {
                border: 4px solid #ffffff;
                background: #000000;
            }
            
            .high-contrast .accessibility-option {
                border: 2px solid #ffffff;
            }
            
            .high-contrast .accessibility-menu-buttons button {
                border: 2px solid #ffffff;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 접근성 메뉴 이벤트 설정
     */
    setupAccessibilityMenuEvents() {
        const menu = document.getElementById('accessibility-menu');
        
        // 체크박스 이벤트
        document.getElementById('colorblind-toggle').addEventListener('change', (e) => {
            this.setColorBlindSupport(e.target.checked);
        });
        
        document.getElementById('contrast-toggle').addEventListener('change', (e) => {
            this.setHighContrastMode(e.target.checked);
        });
        
        document.getElementById('motion-toggle').addEventListener('change', (e) => {
            this.setReducedMotion(e.target.checked);
        });
        
        document.getElementById('haptic-toggle').addEventListener('change', (e) => {
            this.setHapticEnabled(e.target.checked);
        });
        
        // 폰트 크기 선택
        document.getElementById('font-size-select').addEventListener('change', (e) => {
            this.updateFontSize(e.target.value);
        });
        
        // 버튼 이벤트
        document.getElementById('accessibility-help-btn').addEventListener('click', () => {
            this.showAccessibilityHelp();
        });
        
        document.getElementById('accessibility-close-btn').addEventListener('click', () => {
            this.closeAccessibilityMenu();
        });
        
        // 메뉴 외부 클릭 시 닫기
        menu.addEventListener('click', (e) => {
            if (e.target === menu) {
                this.closeAccessibilityMenu();
            }
        });
    }
    
    /**
     * 스크린 리더 감지
     */
    detectScreenReader() {
        // 일반적인 스크린 리더 감지 방법들
        const indicators = [
            navigator.userAgent.includes('NVDA'),
            navigator.userAgent.includes('JAWS'),
            navigator.userAgent.includes('WindowEyes'),
            navigator.userAgent.includes('ZoomText'),
            window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
            'speechSynthesis' in window
        ];
        
        return indicators.some(indicator => indicator);
    }
    
    // 공개 메서드들
    
    /**
     * 색맹 지원 토글
     */
    toggleColorBlindSupport() {
        this.setColorBlindSupport(!this.colorBlindSupport);
    }
    
    /**
     * 색맹 지원 설정
     */
    setColorBlindSupport(enabled) {
        this.colorBlindSupport = enabled;
        
        if (enabled) {
            this.applyColorBlindSupport();
        } else {
            document.body.classList.remove('colorblind-support');
            const style = document.getElementById('colorblind-patterns');
            if (style) style.remove();
        }
        
        this.saveAccessibilitySettings();
        this.announceChange(`색맹 지원 모드 ${enabled ? '활성화' : '비활성화'}`);
    }
    
    /**
     * 고대비 모드 토글
     */
    toggleHighContrastMode() {
        this.setHighContrastMode(!this.highContrastMode);
    }
    
    /**
     * 고대비 모드 설정
     */
    setHighContrastMode(enabled) {
        this.highContrastMode = enabled;
        
        if (enabled) {
            this.enableHighContrastMode();
        } else {
            document.body.classList.remove('high-contrast');
            const style = document.getElementById('high-contrast-styles');
            if (style) style.remove();
            
            // 원래 색상으로 복원
            this.updateColorScheme();
        }
        
        this.saveAccessibilitySettings();
        this.announceChange(`고대비 모드 ${enabled ? '활성화' : '비활성화'}`);
    }
    
    /**
     * 폰트 크기 순환
     */
    cycleFontSize() {
        const sizes = ['small', 'normal', 'large', 'xlarge', 'xxlarge'];
        const currentIndex = sizes.indexOf(this.fontSize);
        const nextIndex = (currentIndex + 1) % sizes.length;
        this.updateFontSize(sizes[nextIndex]);
    }
    
    /**
     * 애니메이션 감소 토글
     */
    toggleReducedMotion() {
        this.setReducedMotion(!this.reducedMotion);
    }
    
    /**
     * 애니메이션 감소 설정
     */
    setReducedMotion(enabled) {
        this.reducedMotion = enabled;
        
        if (enabled) {
            document.body.classList.add('reduced-motion');
            this.addReducedMotionStyles();
        } else {
            document.body.classList.remove('reduced-motion');
            const style = document.getElementById('reduced-motion-styles');
            if (style) style.remove();
        }
        
        this.saveAccessibilitySettings();
        this.announceChange(`애니메이션 감소 모드 ${enabled ? '활성화' : '비활성화'}`);
    }
    
    /**
     * 애니메이션 감소 스타일 추가
     */
    addReducedMotionStyles() {
        const style = document.createElement('style');
        style.id = 'reduced-motion-styles';
        style.textContent = `
            .reduced-motion *,
            .reduced-motion *::before,
            .reduced-motion *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
            
            .reduced-motion .loading-spinner {
                animation: none;
                border-top-color: var(--primary);
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 햅틱 피드백 설정
     */
    setHapticEnabled(enabled) {
        this.hapticEnabled = enabled && 'vibrate' in navigator;
        this.saveAccessibilitySettings();
        this.announceChange(`햅틱 피드백 ${this.hapticEnabled ? '활성화' : '비활성화'}`);
    }
    
    /**
     * 색상 스키마 업데이트
     */
    updateColorScheme() {
        if (this.highContrastMode) return; // 고대비 모드가 우선
        
        const root = document.documentElement;
        
        if (this.darkMode) {
            root.style.setProperty('--background', '#0f172a');
            root.style.setProperty('--surface', '#1e293b');
            root.style.setProperty('--text-primary', '#f8fafc');
            root.style.setProperty('--text-secondary', '#cbd5e1');
        } else {
            root.style.setProperty('--background', '#f8fafc');
            root.style.setProperty('--surface', '#ffffff');
            root.style.setProperty('--text-primary', '#1e293b');
            root.style.setProperty('--text-secondary', '#64748b');
        }
    }
    
    /**
     * 접근성 메뉴 표시
     */
    showAccessibilityMenu() {
        const menu = document.getElementById('accessibility-menu');
        menu.setAttribute('aria-hidden', 'false');
        
        // 첫 번째 포커스 가능한 요소에 포커스
        const firstInput = menu.querySelector('input, select, button');
        if (firstInput) {
            firstInput.focus();
        }
        
        this.announceChange('접근성 설정 메뉴가 열렸습니다');
    }
    
    /**
     * 접근성 메뉴 닫기
     */
    closeAccessibilityMenu() {
        const menu = document.getElementById('accessibility-menu');
        menu.setAttribute('aria-hidden', 'true');
        
        // 이전 포커스로 복원
        if (this.previousFocus) {
            this.previousFocus.focus();
        }
    }
    
    /**
     * 접근성 도움말 표시
     */
    showAccessibilityHelp() {
        const helpText = `
케이크 배달 게임 접근성 기능:

키보드 단축키:
- Alt+1: 색맹 지원 모드 토글
- Alt+2: 고대비 모드 토글  
- Alt+3: 폰트 크기 변경
- Alt+4: 애니메이션 감소 모드 토글
- Alt+H: 이 도움말 표시
- F1: 접근성 도움말
- F5: 게임 재시작
- 스페이스바: 게임 일시정지/재개
- Esc: 메뉴 닫기
- Tab/Shift+Tab: 요소 간 이동

게임 조작:
- 화살표 키: 케이크 이동
- 모바일: 기기 기울이기

접근성 기능:
- 스크린 리더 지원
- 키보드 전용 네비게이션
- 고대비 모드
- 색맹 친화적 색상
- 폰트 크기 조절
- 애니메이션 감소
- 햅틱 피드백
        `;
        
        alert(helpText);
        this.announceChange('접근성 도움말을 표시했습니다');
    }
    
    /**
     * 변경사항 알림
     */
    announceChange(message) {
        if (this.gameStatusRegion) {
            this.gameStatusRegion.textContent = message;
            
            // 잠시 후 내용 지우기
            setTimeout(() => {
                this.gameStatusRegion.textContent = '';
            }, 3000);
        }
        
        console.log(`♿ 접근성: ${message}`);
    }
    
    /**
     * 게임 상태 알림
     */
    announceGameState(state, details = '') {
        let message = '';
        
        switch (state) {
            case 'started':
                message = '게임이 시작되었습니다';
                break;
            case 'paused':
                message = '게임이 일시정지되었습니다';
                break;
            case 'resumed':
                message = '게임이 재개되었습니다';
                break;
            case 'gameOver':
                message = `게임 오버. ${details}`;
                break;
            case 'levelUp':
                message = `레벨 업! 현재 레벨: ${details}`;
                break;
            case 'scoreChange':
                message = `점수: ${details}`;
                break;
        }
        
        this.announceChange(message);
    }
    
    /**
     * 정리
     */
    dispose() {
        // 이벤트 리스너 제거
        document.removeEventListener('keydown', this.handleKeyboardNavigation);
        
        // 생성된 요소들 제거
        const elementsToRemove = [
            'accessibility-menu',
            'game-status-live',
            'score-change-live',
            'game-instructions',
            'restart-help',
            'pause-help'
        ];
        
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
        
        // 생성된 스타일 제거
        const stylesToRemove = [
            'colorblind-patterns',
            'high-contrast-styles',
            'font-size-adjustments',
            'focus-indicators',
            'reduced-motion-styles',
            'accessibility-menu-styles'
        ];
        
        stylesToRemove.forEach(id => {
            const style = document.getElementById(id);
            if (style) style.remove();
        });
        
        console.log('✅ 접근성 시스템 정리 완료');
    }
}