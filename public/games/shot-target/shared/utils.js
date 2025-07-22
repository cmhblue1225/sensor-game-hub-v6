export class Utils {
    static getAccuracy(hits, misses) {
        const total = hits + misses;
        return total > 0 ? ((hits / total) * 100).toFixed(1) : 100;
    }

    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    static getRandomPosition(canvasWidth, canvasHeight, margin) {
        const x = margin + Math.random() * (canvasWidth - margin * 2);
        const y = margin + Math.random() * (canvasHeight - margin * 2);
        return { x, y };
    }

    static calculateDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static normalizeMovement(tiltValue, maxTilt) {
        return Math.max(-1, Math.min(1, tiltValue / maxTilt));
    }
}