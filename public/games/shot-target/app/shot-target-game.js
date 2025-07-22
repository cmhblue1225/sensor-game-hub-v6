import { GamePage } from '../pages/game-page.js';

export class ShotTargetGame {
    constructor() {
        this.gamePage = null;
        this.initialize();
    }

    initialize() {
        console.log('🎯 Shot Target Game 애플리케이션 초기화');
        this.gamePage = new GamePage();
        
        // 전역 접근을 위해 게임 인스턴스를 window에 등록
        window.game = this.gamePage;
    }

    // 전역 함수들을 게임 페이지로 위임
    resetGame() {
        return this.gamePage.resetGame();
    }

    togglePause() {
        return this.gamePage.togglePause();
    }

    startMassCompetitive() {
        return this.gamePage.startMassCompetitive();
    }

    closeMassCompetitiveResultModal() {
        return this.gamePage.closeMassCompetitiveResultModal();
    }

    resetUI() {
        return this.gamePage.resetUI();
    }
}