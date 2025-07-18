// ===== ENTITIES/BULLET =====
// 총알 엔티티 클래스

import { GAME_CONFIG } from '../shared/config.js';
import { GameUtils } from '../shared/utils.js';

export class Bullet {
    constructor(startX, startY, targetX, targetY, playerId = null) {
        this.startX = startX;
        this.startY = startY;
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.playerId = playerId;
        
        // 방향 계산
        this.angle = GameUtils.getAngle(startX, startY, targetX, targetY);
        this.velocityX = Math.cos(this.angle) * GAME_CONFIG.GAMEPLAY.bulletSpeed;
        this.velocityY = Math.sin(this.angle) * GAME_CONFIG.GAMEPLAY.bulletSpeed;
        
        this.isAlive = true;
        this.createdAt = Date.now();
        this.maxLifetime = 2000; // 2초 후 자동 소멸
        
        // 시각적 효과
        this.trail = [];
        this.maxTrailLength = 8;
        
        // 플레이어 색상 (대규모 경쟁 모드용)
        this.color = playerId ? this.getPlayerColor(playerId) : '#ffffff';
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        // 위치 업데이트
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // 궤적 추가
        this.trail.push({ x: this.x, y: this.y, time: Date.now() });
        
        // 오래된 궤적 제거
        const now = Date.now();
        this.trail = this.trail.filter(point => now - point.time < 200);
        
        // 최대 궤적 길이 제한
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 생명 시간 체크
        if (Date.now() - this.createdAt > this.maxLifetime) {
            this.destroy();
        }
    }

    render(ctx) {
        if (!this.isAlive) return;

        ctx.save();
        
        // 궤적 렌더링
        if (this.trail.length > 1) {
            ctx.strokeStyle = GameUtils.hexToRgba(this.color, 0.3);
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            
            for (let i = 1; i < this.trail.length; i++) {
                const alpha = i / this.trail.length;
                ctx.globalAlpha = alpha * 0.5;
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            
            ctx.stroke();
        }
        
        // 총알 렌더링
        ctx.globalAlpha = 1;
        
        // 외곽 글로우 효과
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = GameUtils.hexToRgba(this.color, 0.3);
        ctx.fill();
        
        // 메인 총알
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 중앙 하이라이트
        ctx.beginPath();
        ctx.arc(this.x - 1, this.y - 1, 1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        ctx.restore();
    }

    // 화면 경계 체크
    isOutOfBounds(canvasWidth, canvasHeight) {
        return (
            this.x < -10 || 
            this.x > canvasWidth + 10 || 
            this.y < -10 || 
            this.y > canvasHeight + 10
        );
    }

    // 총알 제거
    destroy() {
        this.isAlive = false;
    }

    // 플레이어 색상 가져오기
    getPlayerColor(playerId) {
        // playerId에서 숫자 추출 (예: "player1" -> 1)
        const playerIndex = parseInt(playerId.replace(/\D/g, '')) - 1;
        return GAME_CONFIG.PLAYER_COLORS[playerIndex % GAME_CONFIG.PLAYER_COLORS.length];
    }

    // 총알 정보 반환
    getInfo() {
        return {
            x: this.x,
            y: this.y,
            startX: this.startX,
            startY: this.startY,
            targetX: this.targetX,
            targetY: this.targetY,
            playerId: this.playerId,
            color: this.color,
            isAlive: this.isAlive,
            age: Date.now() - this.createdAt
        };
    }
}

// 총알 팩토리 클래스
export class BulletFactory {
    static createBullet(startX, startY, targetX, targetY, playerId = null) {
        return new Bullet(startX, startY, targetX, targetY, playerId);
    }

    // 조준점에서 표적으로 총알 생성
    static createBulletToTarget(crosshairX, crosshairY, target, playerId = null) {
        return new Bullet(crosshairX, crosshairY, target.x, target.y, playerId);
    }

    // 산탄 효과 (여러 총알 동시 발사)
    static createSpreadBullets(startX, startY, targetX, targetY, count = 3, spread = 0.2, playerId = null) {
        const bullets = [];
        const baseAngle = GameUtils.getAngle(startX, startY, targetX, targetY);
        
        for (let i = 0; i < count; i++) {
            const angleOffset = (i - Math.floor(count / 2)) * spread;
            const angle = baseAngle + angleOffset;
            
            const distance = GameUtils.getDistance(startX, startY, targetX, targetY);
            const newTargetX = startX + Math.cos(angle) * distance;
            const newTargetY = startY + Math.sin(angle) * distance;
            
            bullets.push(new Bullet(startX, startY, newTargetX, newTargetY, playerId));
        }
        
        return bullets;
    }
}