// Entities Layer - 표적 모델
import { GAME_CONFIG } from '../../shared/config/game-config.js';
import { randomRange } from '../../shared/lib/utils.js';

export class Target {
    constructor(type, canvasWidth, canvasHeight) {
        const typeConfig = GAME_CONFIG.targetTypes[type];
        
        this.type = type;
        this.radius = typeConfig.radius;
        this.points = typeConfig.points;
        this.color = typeConfig.color;
        this.spawnTime = Date.now();
        this.alpha = 1;
        
        // 랜덤 위치 생성 (화면 가장자리 제외)
        const margin = this.radius + 50;
        this.x = randomRange(margin, canvasWidth - margin);
        this.y = randomRange(margin, canvasHeight - margin);
    }

    // 표적이 만료되었는지 확인
    isExpired() {
        return Date.now() - this.spawnTime > GAME_CONFIG.targetLifetime;
    }

    // 표적 업데이트 (페이드 아웃 효과)
    update() {
        const age = Date.now() - this.spawnTime;
        const lifetime = GAME_CONFIG.targetLifetime;
        
        // 마지막 1초 동안 페이드 아웃
        if (age > lifetime - 1000) {
            this.alpha = Math.max(0, (lifetime - age) / 1000);
        }
    }

    // 표적 렌더링
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // 표적 원 그리기
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 테두리
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 중심점
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        ctx.restore();
    }
}

export class TargetManager {
    constructor() {
        this.targets = [];
        this.lastSpawnTime = 0;
    }

    // 표적 생성
    spawnTarget(gameMode, canvasWidth, canvasHeight, maxTargets) {
        if (this.targets.length >= maxTargets) return null;

        // 표적 타입 랜덤 선택
        const rand = Math.random();
        let targetType = 'large';
        
        const { small, medium } = GAME_CONFIG.targetTypes;
        if (rand < small.spawnChance) {
            targetType = 'small';
        } else if (rand < small.spawnChance + medium.spawnChance) {
            targetType = 'medium';
        }

        const target = new Target(targetType, canvasWidth, canvasHeight);
        this.targets.push(target);
        
        return target;
    }

    // 모든 표적 업데이트
    update() {
        // 만료된 표적 제거
        this.targets = this.targets.filter(target => {
            target.update();
            return !target.isExpired();
        });
    }

    // 모든 표적 렌더링
    render(ctx) {
        this.targets.forEach(target => target.render(ctx));
    }

    // 표적 제거
    removeTarget(target) {
        const index = this.targets.indexOf(target);
        if (index > -1) {
            this.targets.splice(index, 1);
        }
    }

    // 모든 표적 제거
    clear() {
        this.targets = [];
    }

    // 표적 개수
    get count() {
        return this.targets.length;
    }
}