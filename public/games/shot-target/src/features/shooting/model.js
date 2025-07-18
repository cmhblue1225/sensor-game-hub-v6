// Features Layer - 사격 시스템
import { calculateDistance } from '../../shared/lib/utils.js';
import { GAME_CONFIG } from '../../shared/config/game-config.js';

export class Bullet {
    constructor(startX, startY, targetX, targetY, color = '#3b82f6') {
        this.startX = startX;
        this.startY = startY;
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.color = color;
        this.speed = GAME_CONFIG.bulletSpeed;
        this.active = true;
        
        // 방향 계산
        const distance = calculateDistance(startX, startY, targetX, targetY);
        this.velocityX = (targetX - startX) / distance * this.speed;
        this.velocityY = (targetY - startY) / distance * this.speed;
    }

    update() {
        if (!this.active) return;
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // 목표 지점에 도달했는지 확인
        const distanceToTarget = calculateDistance(this.x, this.y, this.targetX, this.targetY);
        if (distanceToTarget < this.speed) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

export class ShootingSystem {
    constructor() {
        this.bullets = [];
    }

    // 사격 시도
    tryShoot(gameMode, crosshair, crosshair2, targetManager, gameState, playerManager = null) {
        if (gameMode === 'mass-competitive') {
            return this._tryMassCompetitiveShoot(crosshair, targetManager, gameState, playerManager);
        } else if (gameMode === 'competitive') {
            return this._tryCompetitiveShoot(crosshair, crosshair2, targetManager, gameState);
        } else if (gameMode === 'coop') {
            return this._tryCoopShoot(crosshair, crosshair2, targetManager, gameState);
        } else {
            return this._trySoloShoot(crosshair, targetManager, gameState);
        }
    }

    // 솔로 모드 사격
    _trySoloShoot(crosshair, targetManager, gameState) {
        const hitTarget = this._findHitTarget(crosshair.x, crosshair.y, targetManager.targets);
        
        if (hitTarget) {
            this._processHit(hitTarget, targetManager, gameState);
            this._createBullet(crosshair.x, crosshair.y, hitTarget.x, hitTarget.y);
            return true;
        }
        
        return false;
    }

    // 협동 모드 사격
    _tryCoopShoot(crosshair, crosshair2, targetManager, gameState) {
        let hit = false;
        
        // 첫 번째 조준점 확인
        const hitTarget1 = this._findHitTarget(crosshair.x, crosshair.y, targetManager.targets);
        if (hitTarget1) {
            this._processHit(hitTarget1, targetManager, gameState);
            this._createBullet(crosshair.x, crosshair.y, hitTarget1.x, hitTarget1.y);
            hit = true;
        }
        
        // 두 번째 조준점 확인
        const hitTarget2 = this._findHitTarget(crosshair2.x, crosshair2.y, targetManager.targets);
        if (hitTarget2) {
            this._processHit(hitTarget2, targetManager, gameState);
            this._createBullet(crosshair2.x, crosshair2.y, hitTarget2.x, hitTarget2.y);
            hit = true;
        }
        
        return hit;
    }

    // 경쟁 모드 사격
    _tryCompetitiveShoot(crosshair, crosshair2, targetManager, gameState) {
        let hit = false;
        
        // 플레이어 1 사격
        const hitTarget1 = this._findHitTarget(crosshair.x, crosshair.y, targetManager.targets);
        if (hitTarget1) {
            this._processCompetitiveHit(hitTarget1, targetManager, gameState, 1);
            this._createBullet(crosshair.x, crosshair.y, hitTarget1.x, hitTarget1.y);
            hit = true;
        }
        
        // 플레이어 2 사격
        const hitTarget2 = this._findHitTarget(crosshair2.x, crosshair2.y, targetManager.targets);
        if (hitTarget2) {
            this._processCompetitiveHit(hitTarget2, targetManager, gameState, 2);
            this._createBullet(crosshair2.x, crosshair2.y, hitTarget2.x, hitTarget2.y);
            hit = true;
        }
        
        return hit;
    }

    // 대규모 경쟁 모드 사격
    _tryMassCompetitiveShoot(crosshair, targetManager, gameState, playerManager) {
        const hitRadius = GAME_CONFIG.hitRadius;
        let anyHit = false;
        
        // 모든 활성 플레이어의 조준점 검사
        for (const player of playerManager.getActivePlayers()) {
            if (!player.tilt) continue;
            
            const hitTarget = this._findHitTarget(player.crosshairX, player.crosshairY, targetManager.targets);
            if (hitTarget) {
                this._processMassCompetitiveHit(hitTarget, targetManager, player, gameState);
                this._createBullet(player.crosshairX, player.crosshairY, hitTarget.x, hitTarget.y, player.color);
                anyHit = true;
            }
        }
        
        return anyHit;
    }

    // 표적 명중 확인
    _findHitTarget(crosshairX, crosshairY, targets) {
        const hitRadius = GAME_CONFIG.hitRadius;
        
        for (const target of targets) {
            const distance = calculateDistance(crosshairX, crosshairY, target.x, target.y);
            if (distance <= hitRadius) {
                return target;
            }
        }
        
        return null;
    }

    // 일반 명중 처리 (개선된 콤보 시스템 적용)
    _processHit(target, targetManager, gameState) {
        // ✅ 개선된 콤보 설정 사용 (최대 3콤보, 1.5배 점수)
        const comboMultiplier = GAME_CONFIG.combo ? GAME_CONFIG.combo.multiplier : GAME_CONFIG.comboMultiplier;
        const points = Math.floor(target.points * (1 + gameState.comboCount * (comboMultiplier - 1)));
        
        gameState.updateScore(points);
        gameState.updateHits();
        gameState.updateCombo();
        
        targetManager.removeTarget(target);
        
        // 명중 효과 생성
        this._createHitEffect(target.x, target.y, points);
        
        console.log(`🎯 표적 명중! +${points}pt (콤보 x${gameState.comboCount})`);
    }

    // 경쟁 모드 명중 처리 (개선된 콤보 시스템 적용)
    _processCompetitiveHit(target, targetManager, gameState, playerId) {
        const baseCombo = playerId === 1 ? gameState.player1Combo : gameState.player2Combo;
        // ✅ 개선된 콤보 설정 사용 (최대 3콤보, 1.5배 점수)
        const comboMultiplier = GAME_CONFIG.combo ? GAME_CONFIG.combo.multiplier : GAME_CONFIG.comboMultiplier;
        const points = Math.floor(target.points * (1 + baseCombo * (comboMultiplier - 1)));
        
        gameState.updateScore(points, playerId);
        gameState.updateHits(playerId);
        gameState.updateCombo(playerId);
        
        if (playerId === 1) {
            gameState.player1LastHitTime = Date.now();
        } else {
            gameState.player2LastHitTime = Date.now();
        }
        
        targetManager.removeTarget(target);
        this._createHitEffect(target.x, target.y, points);
        
        console.log(`🎯 [경쟁] 플레이어 ${playerId} 표적 명중! +${points}pt (콤보 x${baseCombo})`);
    }

    // 대규모 경쟁 모드 명중 처리 (개선된 콤보 시스템 적용)
    _processMassCompetitiveHit(target, targetManager, player, gameState) {
        // ✅ 개선된 콤보 설정 사용 (최대 3콤보, 1.5배 점수)
        const comboMultiplier = GAME_CONFIG.combo ? GAME_CONFIG.combo.multiplier : GAME_CONFIG.comboMultiplier;
        const points = Math.floor(target.points * (1 + player.combo * (comboMultiplier - 1)));
        
        player.addScore(points);
        player.hit();
        
        targetManager.removeTarget(target);
        this._createHitEffect(target.x, target.y, points);
        
        console.log(`🎯 [대규모 경쟁] ${player.name} 표적 명중! +${points}pt (콤보 x${player.combo})`);
    }

    // 총알 생성
    _createBullet(startX, startY, targetX, targetY, color = '#3b82f6') {
        const bullet = new Bullet(startX, startY, targetX, targetY, color);
        this.bullets.push(bullet);
    }

    // 명중 효과 생성
    _createHitEffect(x, y, points) {
        // 점수 팝업 생성
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${points}`;
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        document.body.appendChild(popup);
        
        // 1.5초 후 제거
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 1500);
    }

    // 총알 업데이트
    update() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return bullet.active;
        });
    }

    // 총알 렌더링
    render(ctx) {
        this.bullets.forEach(bullet => bullet.render(ctx));
    }

    // 모든 총알 제거
    clear() {
        this.bullets = [];
    }
}