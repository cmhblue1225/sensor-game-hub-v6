/**
 * 모바일 터치 인터페이스
 * 모바일 기기에 최적화된 터치 인터페이스를 제공합니다.
 */
class MobileTouchInterface {
    constructor() {
        this.touchEnabled = 'ontouchstart' in window;
        this.hapticEnabled = 'vibrate' in navigator;
        this.touchState = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0
        };
        
        console.log('✅ 모바일 터치 인터페이스 초기화 완료');
    }
    
    /**
     * 초기화
     */
    async init(canvas) {
        if (!canvas) return;
        
        this.canvas = canvas;
        this.setupTouchEvents();
        this.setupHapticFeedback();
        
        console.log('📱 모바일 터치 인터페이스 설정 완료');
    }
    
    /**
     * 터치 이벤트 설정
     */
    setupTouchEvents() {
        if (!this.touchEnabled || !this.canvas) return;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });
    }
    
    /**
     * 터치 시작 처리
     */
    handleTouchStart(event) {
        const touch = event.touches[0];
        this.touchState.active = true;
        this.touchState.startX = touch.clientX;
        this.touchState.startY = touch.clientY;
        this.touchState.currentX = touch.clientX;
        this.touchState.currentY = touch.clientY;
        
        this.provideTouchFeedback('light');
    }
    
    /**
     * 터치 이동 처리
     */
    handleTouchMove(event) {
        if (!this.touchState.active) return;
        
        const touch = event.touches[0];
        this.touchState.currentX = touch.clientX;
        this.touchState.currentY = touch.clientY;
    }
    
    /**
     * 터치 종료 처리
     */
    handleTouchEnd(event) {
        this.touchState.active = false;
        this.provideTouchFeedback('light');
    }
    
    /**
     * 햅틱 피드백 설정
     */
    setupHapticFeedback() {
        if (!this.hapticEnabled) {
            console.warn('⚠️ 햅틱 피드백이 지원되지 않습니다.');
            return;
        }
        
        console.log('📳 햅틱 피드백 설정 완료');
    }
    
    /**
     * 터치 피드백 제공
     */
    provideTouchFeedback(type) {
        if (!this.hapticEnabled) return;
        
        const patterns = {
            light: [50],
            medium: [100],
            heavy: [200],
            success: [100, 50, 100],
            error: [200, 100, 200, 100, 200],
            warning: [150]
        };
        
        const pattern = patterns[type] || patterns.light;
        navigator.vibrate(pattern);
    }
    
    /**
     * UI 업데이트
     */
    update(gameData) {
        // UI 상태 업데이트 로직
        if (gameData.score !== undefined) {
            this.updateScore(gameData.score);
        }
        
        if (gameData.level !== undefined) {
            this.updateLevel(gameData.level);
        }
        
        if (gameData.timeRemaining !== undefined) {
            this.updateTimer(gameData.timeRemaining);
        }
    }
    
    /**
     * 점수 업데이트
     */
    updateScore(score) {
        const scoreElement = document.getElementById('scoreDisplay');
        if (scoreElement) {
            scoreElement.textContent = `점수: ${score}`;
        }
    }
    
    /**
     * 레벨 업데이트
     */
    updateLevel(level) {
        const levelElement = document.getElementById('levelDisplay');
        if (levelElement) {
            levelElement.textContent = `레벨: ${level}`;
        }
    }
    
    /**
     * 타이머 업데이트
     */
    updateTimer(timeRemaining) {
        const timerElement = document.getElementById('timerDisplay');
        if (timerElement) {
            timerElement.textContent = `시간: ${timeRemaining}초`;
        }
    }
    
    /**
     * 렌더링
     */
    render() {
        // UI 렌더링 로직 (필요시 구현)
    }
    
    /**
     * 터치 상태 가져오기
     */
    getTouchState() {
        return this.touchState;
    }
    
    /**
     * 정리
     */
    cleanup() {
        if (this.canvas) {
            this.canvas.removeEventListener('touchstart', this.handleTouchStart);
            this.canvas.removeEventListener('touchmove', this.handleTouchMove);
            this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        }
        
        console.log('🧹 모바일 터치 인터페이스 정리 완료');
    }
}