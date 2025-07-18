// ===== FEATURES/SHOOTING-SYSTEM =====
// 사격 시스템 및 충돌 검사

import { GAME_CONFIG } from '../shared/config.js';
import { GameUtils } from '../shared/utils.js';
import { BulletFactory } from '../entities/bullet.js';

export class ShootingSystem {
    constructor() {
        this.bullets = [];
        this.targets = [];
        this.effects = [];
        
        // 자동 사격 설정
        this.autoShootEnabled = true;
        this.lastAutoShootCheck = 0;
        this.autoShootInterval = 100; // 100ms마다 체크
        
        // 사격 통계
        this.totalShots = 0;
        this.totalHits = 0;
        this.totalMisses = 0;
        
        // 콜백 함수들
        this.callbacks = new Map();
    }

    // 타겟 목록 설정
    setTargets(targets) {
        this.targets = targets;
    }

    // 수동 사격 (키보드/터치)
    shoot(startX, startY, targetX, targetY, playerId = null) {
        const bullet = BulletFactory.createBullet(startX, startY, targetX, targetY, playerId);
        this.bullets.push(bullet);
        this.totalShots++;
        
        // 사격 사운드 효과 (추후 구현 가능)
        this.triggerCallback('shot-fired', { bullet, playerId });
        
        console.log(`🔫 사격: ${playerId || 'unknown'} (${startX}, ${startY}) -> (${targetX}, ${targetY})`);
    }

    // 자동 사격 체크 (조준점이 표적에 가까우면 자동 발사)
    checkAutoShoot(crosshairs, playerId = null) {
        if (!this.autoShootEnabled) return;
        
        const now = Date.now();
        if (now - this.lastAutoShootCheck < this.autoShootInterval) return;
        
        this.lastAutoShootCheck = now;
        
        // 단일 조준점 처리
        if (typeof crosshairs.x === 'number') {
            this.checkSingleCrosshairAutoShoot(crosshairs, playerId);
        } 
        // 다중 조준점 처리 (Map 객체)
        else if (crosshairs instanceof Map) {
            crosshairs.forEach((crosshair, currentPlayerId) => {
                this.checkSingleCrosshairAutoShoot(crosshair, currentPlayerId);
            });
        }
    }

    // 단일 조준점 자동 사격 체크
    checkSingleCrosshairAutoShoot(crosshair, playerId) {
        const hitRadius = GAME_CONFIG.GAMEPLAY.hitRadius;
        
        for (const target of this.targets) {
            if (!target.isAlive) continue;
            
            const distance = GameUtils.getDistance(
                crosshair.x, crosshair.y, 
                target.x, target.y
            );
            
            // 조준점이 표적 범위 내에 있으면 자동 발사
            if (distance <= target.radius + hitRadius) {
                this.shoot(crosshair.x, crosshair.y, target.x, target.y, playerId);
                break; // 한 번에 하나의 표적만 사격
            }
        }
    }

    // 총알 업데이트
    updateBullets(deltaTime) {
        this.bullets = this.bullets.filter(bullet => {
            if (!bullet.isAlive) return false;
            
            bullet.update(deltaTime);
            
            // 화면 밖으로 나간 총알 제거
            if (bullet.isOutOfBounds(window.innerWidth, window.innerHeight)) {
                bullet.destroy();
                return false;
            }
            
            return true;
        });
    }

    // 충돌 검사 및 처리
    checkCollisions() {
        const hitResults = [];
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (!bullet.isAlive) continue;
            
            for (let j = this.targets.length - 1; j >= 0; j--) {
                const target = this.targets[j];
                if (!target.isAlive) continue;
                
                // 충돌 검사
                const distance = GameUtils.getDistance(bullet.x, bullet.y, target.x, target.y);
                
                if (distance <= target.radius) {
                    // 충돌 발생!
                    const hitResult = this.processHit(bullet, target);
                    hitResults.push(hitResult);
                    
                    // 총알과 표적 제거
                    bullet.destroy();
                    target.hit();
                    
                    // 적중 효과 생성
                    this.createHitEffect(target.x, target.y, target.color);
                    
                    break; // 총알은 하나의 표적만 맞출 수 있음
                }
            }
        }
        
        // 빗나간 총알 처리 (화면 밖으로 나간 경우)
        this.bullets.forEach(bullet => {
            if (!bullet.isAlive && bullet.isOutOfBounds(window.innerWidth, window.innerHeight)) {
                this.processMiss(bullet);
            }
        });
        
        return hitResults;
    }

    // 적중 처리
    processHit(bullet, target) {
        this.totalHits++;
        
        const hitResult = {
            playerId: bullet.playerId,
            targetType: target.type,
            points: target.points,
            position: { x: target.x, y: target.y },
            bulletInfo: bullet.getInfo(),
            targetInfo: target.getInfo()
        };
        
        // 적중 콜백 실행
        this.triggerCallback('target-hit', hitResult);
        
        console.log(`🎯 적중! ${bullet.playerId || 'unknown'} -> ${target.type} (${target.points}점)`);
        
        return hitResult;
    }

    // 빗나감 처리
    processMiss(bullet) {
        this.totalMisses++;
        
        const missResult = {
            playerId: bullet.playerId,
            position: { x: bullet.x, y: bullet.y },
            bulletInfo: bullet.getInfo()
        };
        
        // 빗나감 콜백 실행
        this.triggerCallback('shot-missed', missResult);
        
        console.log(`❌ 빗나감: ${bullet.playerId || 'unknown'}`);
        
        return missResult;
    }

    // 적중 효과 생성
    createHitEffect(x, y, color) {
        const effect = {
            x,
            y,
            color,
            scale: 0.5,
            alpha: 1,
            createdAt: Date.now(),
            duration: GAME_CONFIG.UI.effectDuration
        };
        
        this.effects.push(effect);
    }

    // 효과 업데이트
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            const age = Date.now() - effect.createdAt;
            
            if (age > effect.duration) {
                return false;
            }
            
            // 효과 애니메이션
            const progress = age / effect.duration;
            effect.scale = GameUtils.lerp(0.5, 2, progress);
            effect.alpha = 1 - progress;
            
            return true;
        });
    }

    // 총알 렌더링
    renderBullets(ctx) {
        this.bullets.forEach(bullet => {
            if (bullet.isAlive) {
                bullet.render(ctx);
            }
        });
    }

    // 효과 렌더링
    renderEffects(ctx) {
        this.effects.forEach(effect => {
            ctx.save();
            ctx.globalAlpha = effect.alpha;
            
            // 적중 효과 링
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.scale * 20, 0, Math.PI * 2);
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // 내부 플래시
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.scale * 10, 0, Math.PI * 2);
            ctx.fillStyle = GameUtils.hexToRgba('#ffffff', 0.5);
            ctx.fill();
            
            ctx.restore();
        });
    }

    // 산탄 사격 (특수 모드용)
    shootSpread(startX, startY, targetX, targetY, count = 3, playerId = null) {
        const bullets = BulletFactory.createSpreadBullets(
            startX, startY, targetX, targetY, count, 0.2, playerId
        );
        
        this.bullets.push(...bullets);
        this.totalShots += bullets.length;
        
        this.triggerCallback('spread-shot-fired', { bullets, playerId });
    }

    // 자동 사격 활성화/비활성화
    setAutoShoot(enabled) {
        this.autoShootEnabled = enabled;
        console.log(`🔫 자동 사격: ${enabled ? '활성화' : '비활성화'}`);
    }

    // 사격 통계 반환
    getStats() {
        return {
            totalShots: this.totalShots,
            totalHits: this.totalHits,
            totalMisses: this.totalMisses,
            accuracy: GameUtils.calculateAccuracy(this.totalHits, this.totalMisses),
            activeBullets: this.bullets.filter(b => b.isAlive).length,
            activeEffects: this.effects.length
        };
    }

    // 콜백 등록
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    // 콜백 실행
    triggerCallback(event, data) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`콜백 실행 오류 (${event}):`, error);
                }
            });
        }
    }

    // 모든 총알 제거
    clearBullets() {
        this.bullets.forEach(bullet => bullet.destroy());
        this.bullets = [];
    }

    // 모든 효과 제거
    clearEffects() {
        this.effects = [];
    }

    // 시스템 리셋
    reset() {
        this.clearBullets();
        this.clearEffects();
        this.totalShots = 0;
        this.totalHits = 0;
        this.totalMisses = 0;
        
        console.log('🔫 사격 시스템 리셋');
    }

    // 정리 (메모리 누수 방지)
    cleanup() {
        this.reset();
        this.callbacks.clear();
        this.targets = [];
        
        console.log('🔫 사격 시스템 정리 완료');
    }
}