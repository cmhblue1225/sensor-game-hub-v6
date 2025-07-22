import { Bullet } from '../entities/bullet.js';
import { Utils } from '../shared/utils.js';

export class ShootingSystem {
    constructor() {
        this.bullets = [];
        this.effects = [];
    }

    tryShoot(targets, crosshair, crosshair2, gameMode, hitRadius, massPlayers, canvasWidth, canvasHeight, myPlayerId) {
        if (gameMode === 'mass-competitive') {
            return this.tryShootMassCompetitive(targets, hitRadius, massPlayers, canvasWidth, canvasHeight);
        } else {
            return this.tryShootNormal(targets, crosshair, crosshair2, gameMode, hitRadius);
        }
    }

    tryShootNormal(targets, crosshair, crosshair2, gameMode, hitRadius) {
        // 첫 번째 조준점으로 표적 찾기
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const distance = Utils.calculateDistance(crosshair.x, crosshair.y, target.x, target.y);

            if (distance <= hitRadius) {
                return { target, index: i, playerId: 1, crosshair };
            }
        }

        // 협동/경쟁 모드에서 두 번째 조준점도 확인
        if ((gameMode === 'coop' || gameMode === 'competitive') && crosshair2) {
            for (let i = 0; i < targets.length; i++) {
                const target = targets[i];
                const distance = Utils.calculateDistance(crosshair2.x, crosshair2.y, target.x, target.y);

                if (distance <= hitRadius) {
                    return { target, index: i, playerId: 2, crosshair: crosshair2 };
                }
            }
        }

        return null;
    }

    tryShootMassCompetitive(targets, hitRadius, massPlayers, canvasWidth, canvasHeight) {
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];

            for (const [playerId, player] of massPlayers.entries()) {
                if (!player.isActive || !player.tilt) continue;

                const crosshairX = this.calculatePlayerCrosshairX(player, canvasWidth);
                const crosshairY = this.calculatePlayerCrosshairY(player, canvasHeight);

                const distance = Utils.calculateDistance(crosshairX, crosshairY, target.x, target.y);

                if (distance <= hitRadius) {
                    return { 
                        target, 
                        index: i, 
                        playerId, 
                        player,
                        crosshair: { x: crosshairX, y: crosshairY }
                    };
                }
            }
        }

        return null;
    }

    calculatePlayerCrosshairX(player, canvasWidth) {
        const maxTilt = 25;
        const normalizedTiltX = Math.max(-1, Math.min(1, player.tilt.y / maxTilt));
        let crosshairX = canvasWidth / 2 + (normalizedTiltX * canvasWidth / 2);
        return Math.max(0, Math.min(canvasWidth, crosshairX));
    }

    calculatePlayerCrosshairY(player, canvasHeight) {
        const maxTilt = 25;
        const normalizedTiltY = Math.max(-1, Math.min(1, player.tilt.x / maxTilt));
        let crosshairY = canvasHeight / 2 + (normalizedTiltY * canvasHeight / 2);
        return Math.max(0, Math.min(canvasHeight, crosshairY));
    }

    shoot(target, index, playerId, crosshair, bulletSpeed, playerColor = null) {
        const bullet = new Bullet(
            crosshair.x,
            crosshair.y,
            target.x,
            target.y,
            bulletSpeed,
            target,
            playerId,
            playerColor
        );

        this.bullets.push(bullet);
        return bullet;
    }

    createHitEffect(x, y, points, color) {
        // 타격 원형 효과
        this.effects.push({
            type: 'hit',
            x: x,
            y: y,
            radius: 0,
            maxRadius: 50,
            color: color,
            life: 30,
            maxLife: 30
        });

        // 점수 팝업
        this.effects.push({
            type: 'score',
            x: x,
            y: y,
            text: `+${Math.floor(points)}`,
            life: 90,
            maxLife: 90,
            color: '#10b981'
        });

        // 파티클 효과
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.effects.push({
                type: 'particle',
                x: x,
                y: y,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                color: color,
                life: 60,
                maxLife: 60
            });
        }
    }

    update() {
        // 총알 업데이트
        this.bullets = this.bullets.filter(bullet => bullet.update());

        // 효과 업데이트
        this.effects = this.effects.filter(effect => {
            effect.life--;

            if (effect.type === 'hit') {
                effect.radius = (1 - effect.life / effect.maxLife) * effect.maxRadius;
            } else if (effect.type === 'particle') {
                effect.x += effect.vx;
                effect.y += effect.vy;
                effect.vx *= 0.95;
                effect.vy *= 0.95;
            }

            return effect.life > 0;
        });
    }

    render(ctx, gameMode) {
        // 총알 렌더링
        this.bullets.forEach(bullet => {
            bullet.render(ctx, gameMode);
        });

        // 효과 렌더링
        this.effects.forEach(effect => {
            const alpha = effect.life / effect.maxLife;
            ctx.globalAlpha = alpha;

            if (effect.type === 'hit') {
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 3;
                ctx.stroke();
            } else if (effect.type === 'score') {
                ctx.fillStyle = effect.color;
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(effect.text, effect.x, effect.y - (1 - alpha) * 40);
            } else if (effect.type === 'particle') {
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = effect.color;
                ctx.fill();
            }
        });

        ctx.globalAlpha = 1;
    }

    reset() {
        this.bullets = [];
        this.effects = [];
    }
}