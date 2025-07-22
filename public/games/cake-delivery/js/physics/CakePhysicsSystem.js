/**
 * 케이크 물리 시스템
 * 케이크의 물리적 특성을 관리합니다.
 */
class CakePhysicsSystem {
    constructor() {
        this.cakeProperties = {
            basic: { mass: 1, friction: 0.5, restitution: 0.2, wobble: 1.0 },
            strawberry: { mass: 0.8, friction: 0.7, restitution: 0.1, wobble: 0.8 },
            chocolate: { mass: 1.2, friction: 0.4, restitution: 0.1, wobble: 0.7 },
            wedding: { mass: 1.5, friction: 0.3, restitution: 0.05, wobble: 0.5 },
            ice: { mass: 0.7, friction: 0.1, restitution: 0.8, wobble: 1.5 },
            bomb: { mass: 2, friction: 0.6, restitution: 0.4, wobble: 2.0 }
        };
        
        console.log('✅ 케이크 물리 시스템 초기화 완료');
    }
    
    /**
     * 케이크 물리 적용
     */
    applyCakePhysics(cakeBody, cakeType, sensorData) {
        if (!cakeBody || !sensorData) return;
        
        const properties = this.cakeProperties[cakeType] || this.cakeProperties.basic;
        const { tiltX, tiltY } = sensorData;
        
        // 기울기를 힘으로 변환
        const forceMultiplier = 5.0 * properties.wobble;
        const forceX = (tiltX / 90) * forceMultiplier;
        const forceZ = (tiltY / 90) * forceMultiplier;
        
        // 힘 적용
        cakeBody.applyForce(
            new CANNON.Vec3(forceX, 0, forceZ),
            cakeBody.position
        );
        
        // 각속도 제한 (케이크가 너무 빨리 회전하지 않도록)
        const maxAngularVelocity = 5.0;
        if (cakeBody.angularVelocity.length() > maxAngularVelocity) {
            cakeBody.angularVelocity.normalize();
            cakeBody.angularVelocity.scale(maxAngularVelocity, cakeBody.angularVelocity);
        }
    }
    
    /**
     * 케이크 속성 가져오기
     */
    getCakeProperties(cakeType) {
        return this.cakeProperties[cakeType] || this.cakeProperties.basic;
    }
}