export class Target {
    constructor(x, y, radius, points, color, type) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.points = points;
        this.color = color;
        this.type = type;
        this.spawnTime = Date.now();
        this.alpha = 1;
    }

    update(targetLifetime) {
        const now = Date.now();
        const age = now - this.spawnTime;
        
        // 페이드 아웃 효과
        const fadeStartTime = targetLifetime * 0.7;
        if (age > fadeStartTime) {
            this.alpha = 1 - (age - fadeStartTime) / (targetLifetime * 0.3);
        }

        return age <= targetLifetime;
    }

    render(ctx) {
        ctx.globalAlpha = this.alpha;

        // 표적 본체
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color + '40'; // 투명도 추가
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 중앙 점
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // 점수 표시
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.points, this.x, this.y - this.radius - 10);

        ctx.globalAlpha = 1;
    }
}