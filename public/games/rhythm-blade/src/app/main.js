
import { RhythmBladeDual } from './game.js';
import { initWaitingPage } from '../pages/waiting-page.js';

document.addEventListener('DOMContentLoaded', () => {
    const game = new RhythmBladeDual();
    initWaitingPage(game);
});
