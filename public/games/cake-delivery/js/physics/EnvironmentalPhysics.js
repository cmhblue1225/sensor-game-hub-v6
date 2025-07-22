/**
 * 환경 물리 시스템
 * 바람, 중력 변화 등 환경적 물리 효과를 관리합니다.
 */
class EnvironmentalPhysics {
    constructor(physicsManager) {
        this.physicsManager = physicsManager;
        this.environmentalForces = new Map();
        this.activeEffects = new Map();
        
        console.log('✅ 환경 물리 시스템 초기화 완료');
    }
    
    /**
     * 바람 효과 추가
     */
    addWindEffect(name, direction, strength) {
        this.environmentalForces.set(name, {
            type: 'wind',
            direction: direction,
            strength: strength,
            active: true
        });
    }
    
    /**
     * 중력 변화 효과 추가
     */
    addGravityEffect(name, gravityVector) {
        this.environmentalForces.set(name, {
            type: 'gravity',
            gravity: gravityVector,
            active: true
        });
    }
    
    /**
     * 업데이트
     */
    update(deltaTime) {
        this.environmentalForces.forEach((effect, name) => {
            if (!effect.active) return;
            
            switch (effect.type) {
                case 'wind':
                    this.applyWindEffect(effect, deltaTime);
                    break;
                case 'gravity':
                    this.applyGravityEffect(effect);
                    break;
            }
        });
    }
    
    /**
     * 바람 효과 적용
     */
    applyWindEffect(windEffect, deltaTime) {
        const cakeBody = this.physicsManager.getBody('cake_basic');
        if (cakeBody) {
            const windForce = new CANNON.Vec3(
                windEffect.direction.x * windEffect.strength,
                windEffect.direction.y * windEffect.strength,
                windEffect.direction.z * windEffect.strength
            );
            
            cakeBody.applyForce(windForce, cakeBody.position);
        }
    }
    
    /**
     * 중력 효과 적용
     */
    applyGravityEffect(gravityEffect) {
        this.physicsManager.world.gravity.set(
            gravityEffect.gravity.x,
            gravityEffect.gravity.y,
            gravityEffect.gravity.z
        );
    }
    
    /**
     * 효과 제거
     */
    removeEffect(name) {
        this.environmentalForces.delete(name);
    }
    
    /**
     * 효과 활성화/비활성화
     */
    toggleEffect(name, active) {
        const effect = this.environmentalForces.get(name);
        if (effect) {
            effect.active = active;
        }
    }
}