
import * as UIManager from '../widgets/ui-manager.js';

export function initWaitingPage(game) {
    UIManager.displaySessionInfo(game.sdk.session);
    UIManager.setupMusicSelection(game);
}

export function showWaitingPage() {
    document.getElementById('sessionPanel').classList.remove('hidden');
    document.getElementById('gameStats').classList.add('hidden');
    document.getElementById('cooperationMeter').classList.add('hidden');
    document.getElementById('controlPanel').classList.add('hidden');
    document.getElementById('gameInstructions').classList.add('hidden');
}
