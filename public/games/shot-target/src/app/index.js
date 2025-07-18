// App Layer - 애플리케이션 진입점
import { ShotTargetGame } from '../pages/game/index.js';

// 전역 게임 인스턴스
window.game = null;

// 애플리케이션 초기화
export function initializeApp() {
    console.log('🎯 Shot Target App 초기화');
    
    // DOM이 로드된 후 게임 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startGame);
    } else {
        startGame();
    }
}

function startGame() {
    window.game = new ShotTargetGame();
}

// 앱 시작
initializeApp();