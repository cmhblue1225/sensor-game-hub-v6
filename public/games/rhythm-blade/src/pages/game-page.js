
export function showGamePage() {
    document.getElementById('sessionPanel').classList.add('hidden');
    document.getElementById('gameStats').classList.remove('hidden');
    document.getElementById('cooperationMeter').classList.remove('hidden');
    document.getElementById('controlPanel').classList.remove('hidden');
    document.getElementById('gameInstructions').classList.remove('hidden');
}
