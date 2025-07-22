export class Target {
    constructor(x, y, radius, points, color, type, gameMode = 'solo') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.points = points;
        this.color = color;
        this.type = type;
        this.gameMode = gameMode;
        this.spawnTime = Date.now();
        this.alpha = 1;
        
        // 게임 모드에 따른 중심점 크기 설정
        if (gameMode === 'mass-competitive') {
            // 대규모 경쟁 모드: 표적 크기별 중심점 크기 차별화
            if (type === 'large') {
                this.centerRadius = 12;  // 가장 큰 표적
            } else if (type === 'medium') {
                this.centerRadius = 10;  // 중간 크기 표적
            } else {
                this.centerRadius = 8;   // 가장 작은 표적
            }
        } else {
            // 나머지 모드들: 표적 크기별 중심점 크기 차별화
            if (type === 'large') {
                this.centerRadius = 10;  // 가장 큰 표적
            } else if (type === 'medium') {
                this.centerRadius = 9;   // 중간 크기 표적
            } else {
                this.centerRadius = 8;   // 가장 작은 표적
            }
        }
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
        ctx.arc(this.x, this.y, this.centerRadius, 0, Math.PI * 2);
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