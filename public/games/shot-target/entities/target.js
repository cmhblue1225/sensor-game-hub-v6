// ===== ENTITIES/TARGET =====
// 표적 엔티티 클래스

import { GAME_CONFIG } from '../shared/config.js';
import { GameUtils } from '../shared/utils.js';

export class Target {
    constructor(x, y, type = 'medium') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = GAME_CONFIG.TARGET_TYPES[type];
        
        this.radius = this.config.radius;
        this.points = this.config.points;
        this.color = this.config.color;
        
        this.createdAt = Date.now();
        this.lifetime = GAME_CONFIG.GAMEPLAY.targetLifetime;
        this.isAlive = true;
        this.isHit = false;
        
        // 애니메이션 효과
        this.scale = 0;
        this.targetScale = 1;
        this.pulsePhase = 0;
        this.fadeAlpha = 1;
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        // 스케일 애니메이션 (등장 효과)
        if (this.scale < this.targetScale) {
            this.scale = GameUtils.lerp(this.scale, this.targetScale, 0.15);
        }

        // 펄스 효과
        this.pulsePhase += deltaTime * 0.003;
        
        // 생명 시간 체크
        const age = Date.now() - this.createdAt;
        if (age > this.lifetime) {
            this.destroy();
        } else {
            // 마지막 1초에서 페이드 아웃
            const remainingTime = this.lifetime - age;
            if (remainingTime < 1000) {
                this.fadeAlpha = remainingTime / 1000;
            }
        }
    }

    render(ctx) {
        if (!this.isAlive || this.scale <= 0.01) return;

        ctx.save();
        
        // 투명도 적용
        ctx.globalAlpha = this.fadeAlpha;
        
        // 펄스 효과를 위한 스케일 조정
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.05;
        const currentRadius = this.radius * this.scale * pulseScale;
        
        // 외곽 링 (더 진한 색상)
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius + 3, 0, Math.PI * 2);
        ctx.fillStyle = GameUtils.hexToRgba(this.color, 0.8);
        ctx.fill();
        
        // 메인 표적
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 내부 하이라이트
        const gradient = ctx.createRadialGradient(
            this.x - currentRadius * 0.3, 
            this.y - currentRadius * 0.3, 
            0,
            this.x, 
            this.y, 
            currentRadius
        );
        gradient.addColorStop(0, GameUtils.hexToRgba('#ffffff', 0.4));
        gradient.addColorStop(1, GameUtils.hexToRgba(this.color, 0.8));
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 중앙 점수 표시
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(12, currentRadius * 0.3)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.points.toString(), this.x, this.y);
        
        ctx.restore();
    }

    // 충돌 검사
    checkHit(x, y, hitRadius = GAME_CONFIG.GAMEPLAY.hitRadius) {
        if (!this.isAlive || this.isHit) return false;
        
        const distance = GameUtils.getDistance(this.x, this.y, x, y);
        return distance <= (this.radius * this.scale + hitRadius);
    }

    // 표적 맞춤 처리
    hit() {
        if (this.isHit || !this.isAlive) return false;
        
        this.isHit = true;
        this.isAlive = false;
        return true;
    }

    // 표적 제거
    destroy() {
        this.isAlive = false;
    }

    // 표적이 화면 경계 내에 있는지 확인
    isInBounds(canvasWidth, canvasHeight) {
        return (
            this.x - this.radius >= 0 &&
            this.x + this.radius <= canvasWidth &&
            this.y - this.radius >= 0 &&
            this.y + this.radius <= canvasHeight
        );
    }

    // 다른 표적과의 겹침 확인
    isOverlapping(otherTarget, minDistance = 50) {
        const distance = GameUtils.getDistance(this.x, this.y, otherTarget.x, otherTarget.y);
        return distance < (this.radius + otherTarget.radius + minDistance);
    }

    // 표적 정보 반환
    getInfo() {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            radius: this.radius,
            points: this.points,
            color: this.color,
            isAlive: this.isAlive,
            age: Date.now() - this.createdAt,
            remainingTime: Math.max(0, this.lifetime - (Date.now() - this.createdAt))
        };
    }
}

// 표적 팩토리 클래스
export class TargetFactory {
    static createRandomTarget(canvasWidth, canvasHeight, existingTargets = []) {
        // 표적 타입 랜덤 선택
        const types = Object.keys(GAME_CONFIG.TARGET_TYPES);
        const weights = types.map(type => GAME_CONFIG.TARGET_TYPES[type].spawnChance);
        const selectedType = this.weightedRandomSelect(types, weights);
        
        // 위치 생성 (기존 표적과 겹치지 않도록)
        let attempts = 0;
        let x, y;
        const maxAttempts = 50;
        const targetRadius = GAME_CONFIG.TARGET_TYPES[selectedType].radius;
        const margin = targetRadius + 20;
        
        do {
            x = GameUtils.randomRange(margin, canvasWidth - margin);
            y = GameUtils.randomRange(margin, canvasHeight - margin);
            attempts++;
        } while (
            attempts < maxAttempts && 
            this.isPositionOccupied(x, y, targetRadius, existingTargets)
        );
        
        return new Target(x, y, selectedType);
    }

    static weightedRandomSelect(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }

    static isPositionOccupied(x, y, radius, existingTargets) {
        return existingTargets.some(target => {
            if (!target.isAlive) return false;
            const distance = GameUtils.getDistance(x, y, target.x, target.y);
            return distance < (radius + target.radius + 30);
        });
    }

    // 특정 위치에 표적 생성
    static createTargetAt(x, y, type = 'medium') {
        return new Target(x, y, type);
    }

    // 대규모 경쟁 모드용 다중 표적 생성
    static createMultipleTargets(count, canvasWidth, canvasHeight) {
        const targets = [];
        
        for (let i = 0; i < count; i++) {
            const target = this.createRandomTarget(canvasWidth, canvasHeight, targets);
            targets.push(target);
        }
        
        return targets;
    }
}