export class Bullet {
    constructor(x, y, targetX, targetY, speed, target, playerId, color = '#3b82f6') {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.target = target;
        this.playerId = playerId;
        this.color = color;
    }

    update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.x = this.targetX;
            this.y = this.targetY;
            return false; // 목표 도달, 제거
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
            return true;
        }
    }

    render(ctx, gameMode) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // 대규모 경쟁 모드에서는 플레이어 색상, 다른 모드에서는 기본 색상
        const strokeColor = (gameMode === 'mass-competitive' && this.color) ? this.color : '#3b82f6';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}