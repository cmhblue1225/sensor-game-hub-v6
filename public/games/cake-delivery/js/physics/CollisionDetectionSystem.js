/**
 * 충돌 감지 시스템
 * 게임 내 충돌을 감지하고 처리합니다.
 */
class CollisionDetectionSystem {
    constructor(physicsManager) {
        this.physicsManager = physicsManager;
        this.collisionCallbacks = new Map();
        this.eventListeners = new Map(); // 이벤트 리스너 맵 추가
        
        console.log('✅ 충돌 감지 시스템 초기화 완료');
    }
    
    /**
     * 이벤트 리스너 추가 (DOM EventTarget과 유사한 인터페이스)
     */
    addEventListener(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(callback);
    }
    
    /**
     * 이벤트 리스너 제거
     */
    removeEventListener(eventType, callback) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * 이벤트 발생
     */
    dispatchEvent(eventType, eventData) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(eventData);
                } catch (error) {
                    console.error(`이벤트 콜백 오류 (${eventType}):`, error);
                }
            });
        }
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
        
        // 케이크와 관련된 충돌 처리
        this.handleCakeCollision(bodyA, bodyB, contact);
        
        // 콜백 실행
        this.executeCallbacks(nameA, bodyB, contact);
        this.executeCallbacks(nameB, bodyA, contact);
    }
    
    /**
     * 케이크 충돌 처리
     */
    handleCakeCollision(bodyA, bodyB, contact) {
        let cakeBody = null;
        let otherBody = null;
        
        // 케이크 바디 식별
        if (bodyA.userData?.name && bodyA.userData.name.includes('cake')) {
            cakeBody = bodyA;
            otherBody = bodyB;
        } else if (bodyB.userData?.name && bodyB.userData.name.includes('cake')) {
            cakeBody = bodyB;
            otherBody = bodyA;
        }
        
        if (cakeBody) {
            // 충돌 강도 계산
            const impact = contact.getImpactVelocityAlongNormal();
            const damage = Math.max(0, impact - 5); // 5 이하는 무시
            
            if (damage > 0) {
                // 케이크 손상 이벤트 발생
                this.dispatchEvent('cakeDamage', {
                    body: cakeBody,
                    otherBody: otherBody,
                    damage: damage,
                    totalDamage: (cakeBody.userData?.totalDamage || 0) + damage,
                    position: contact.bi === cakeBody ? contact.ri : contact.rj
                });
                
                // 총 손상 업데이트
                if (!cakeBody.userData) cakeBody.userData = {};
                cakeBody.userData.totalDamage = (cakeBody.userData.totalDamage || 0) + damage;
            }
        }
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