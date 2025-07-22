export class Player {
    constructor(id, name, color, canvasWidth, canvasHeight) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.score = 0;
        this.hits = 0;
        this.combo = 0;
        this.accuracy = 100;
        this.isActive = true;
        this.position = {
            x: Math.random() * (canvasWidth - 100) + 50,
            y: Math.random() * (canvasHeight - 100) + 50
        };
        this.tilt = { x: 0, y: 0 };
        this.lastActivity = Date.now();
        this.lastSensorUpdate = 0;
        this.lastHitTime = 0;
        this.maxCombo = 0;
    }

    updateScore(points, comboMultiplier) {
        this.hits++;
        this.combo++;

        if (this.combo > 1) {
            const comboBonus = Math.min(this.combo - 1, 2);
            points *= Math.pow(comboMultiplier, comboBonus);
        }

        this.score += Math.floor(points);
        this.lastHitTime = Date.now();
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        // 정확도 계산
        const estimatedMisses = Math.max(1, Math.floor(this.hits * 0.1));
        this.accuracy = Math.round((this.hits / (this.hits + estimatedMisses)) * 100);

        return Math.floor(points);
    }

    resetCombo() {
        this.combo = 0;
    }

    updateTilt(tiltX, tiltY) {
        this.tilt.x = tiltX;
        this.tilt.y = tiltY;
        this.lastActivity = Date.now();
    }
}