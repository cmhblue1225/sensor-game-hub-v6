/**
 * 충돌 감지 시스템
 * 게임 내 충돌을 감지하고 처리합니다.
 */
class CollisionDetectionSystem {
    constructor(physicsManager) {
        this.physicsManager = physicsManager;
        this.collisionCallbacks = new Map();
        
        console.log('✅ 충돌 감지 시스템 초기화 완료');
    }
    
    /**
     * 충돌 콜백 등록
     */
    registerCollisionCallback(bodyName, callback) {
        if (!this.collisionCallbacks.has(bodyName)) {
            this.collisionCallbacks.set(bodyName, []);
        }
        this.collisionCallbacks.get(bodyName).push(callback);
    }
    
    /**
     * 충돌 처리
     */
    handleCollision(bodyA, bodyB, contact) {
        const nameA = bodyA.userData?.name || 'unknown';
        const nameB = bodyB.userData?.name || 'unknown';
        
        // 콜백 실행
        this.executeCallbacks(nameA, bodyB, contact);
        this.executeCallbacks(nameB, bodyA, contact);
    }
    
    /**
     * 콜백 실행
     */
    executeCallbacks(bodyName, otherBody, contact) {
        const callbacks = this.collisionCallbacks.get(bodyName);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(otherBody, contact);
                } catch (error) {
                    console.error(`충돌 콜백 오류 (${bodyName}):`, error);
                }
            });
        }
    }
}