/**
 * 🔬 물리 엔진 단위 테스트
 * 
 * 물리 엔진의 충돌 감지, 힘 적용, 바디 관리 등을 테스트
 */

describe('Physics Tests', () => {
    let mockScene, physics;
    
    beforeEach(() => {
        mockScene = {
            add: () => {},
            remove: () => {},
            getObjectByName: () => null
        };
        
        // CANNON.js가 로드되어 있는지 확인
        if (typeof CANNON === 'undefined') {
            console.warn('CANNON.js가 로드되지 않았습니다. 물리 테스트를 건너뜁니다.');
            return;
        }
        
        physics = new PhysicsEngine(mockScene);
    });
    
    afterEach(() => {
        if (physics && physics.dispose) {
            physics.dispose();
        }
    });
    
    it('물리 엔진이 올바르게 초기화되어야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        expect(physics.world).toBeTruthy();
        expect(physics.bodies).toBeTruthy();
        expect(physics.bodies.size).toBeGreaterThan(0); // 바닥과 벽들
    });
    
    it('드론 물리 바디가 올바르게 생성되어야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const droneBody = physics.createDroneBody('testDrone', { x: 10, y: 15, z: 5 });
        
        expect(droneBody).toBeTruthy();
        expect(droneBody.mass).toBe(2);
        expect(droneBody.position.x).toBe(10);
        expect(droneBody.position.y).toBe(15);
        expect(droneBody.position.z).toBe(5);
        expect(physics.bodies.has('testDrone')).toBeTruthy();
    });
    
    it('드론에 힘이 올바르게 적용되어야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const droneBody = physics.createDroneBody('testDrone');
        const initialVelocity = droneBody.velocity.clone();
        
        physics.applyDroneForces('testDrone', {
            thrust: 10,
            steering: 5,
            lift: 8
        });
        
        // 물리 시뮬레이션 한 스텝 실행
        physics.world.step(1/60);
        
        // 속도가 변했는지 확인 (정확한 값보다는 변화 여부)
        const hasChanged = !droneBody.velocity.almostEquals(initialVelocity, 0.001);
        expect(hasChanged).toBeTruthy();
    });
    
    it('부스터 효과가 올바르게 적용되어야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const droneBody = physics.createDroneBody('testDrone');
        const initialSpeed = droneBody.velocity.length();
        
        physics.applyBoosterEffect('testDrone', 2.0);
        
        // 부스터 효과로 속도가 증가해야 함
        const newSpeed = droneBody.velocity.length();
        expect(newSpeed).toBeGreaterThan(initialSpeed);
        
        // 부스터 활성화 플래그 확인
        expect(droneBody.userData.boosterActive).toBeTruthy();
    });
    
    it('체크포인트 바디가 올바르게 생성되어야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const checkpointBody = physics.addCheckpoint({ x: 0, y: 10, z: 0 }, 1);
        
        expect(checkpointBody).toBeTruthy();
        expect(checkpointBody.mass).toBe(0); // 정적 바디
        expect(checkpointBody.isTrigger).toBeTruthy();
        expect(physics.checkpoints.length).toBe(1);
    });
    
    it('트랙 경계 확인이 올바르게 작동해야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const droneBody = physics.createDroneBody('testDrone');
        
        // 트랙 경계 밖으로 이동
        droneBody.position.set(100, 5, 100);
        
        let resetCalled = false;
        const originalReset = physics.resetDronePosition;
        physics.resetDronePosition = (droneId, body) => {
            resetCalled = true;
            expect(droneId).toBe('testDrone');
        };
        
        physics.checkTrackBounds();
        
        expect(resetCalled).toBeTruthy();
        
        // 원래 함수 복원
        physics.resetDronePosition = originalReset;
    });
    
    it('드론 위치 리셋이 올바르게 작동해야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const droneBody = physics.createDroneBody('player1');
        
        // 드론을 멀리 이동시키고 속도 부여
        droneBody.position.set(100, -20, 100);
        droneBody.velocity.set(10, -5, 15);
        droneBody.angularVelocity.set(1, 2, 3);
        
        physics.resetDronePosition('player1', droneBody);
        
        // 안전한 위치로 리셋되었는지 확인
        expect(droneBody.position.x).toBe(-10);
        expect(droneBody.position.y).toBe(8);
        expect(droneBody.position.z).toBe(0);
        
        // 속도가 0으로 리셋되었는지 확인
        expect(droneBody.velocity.length()).toBe(0);
        expect(droneBody.angularVelocity.length()).toBe(0);
    });
    
    it('충돌 조정이 올바르게 작동해야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const droneBody = physics.createDroneBody('testDrone');
        droneBody.velocity.set(10, 0, 10);
        
        const initialSpeed = droneBody.velocity.length();
        
        physics.adjustDroneAfterCollision('testDrone', 'wall', 1.0);
        
        const newSpeed = droneBody.velocity.length();
        expect(newSpeed).toBeLessThan(initialSpeed);
    });
    
    it('페널티 시스템이 올바르게 작동해야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const droneBody = physics.createDroneBody('testDrone');
        
        physics.applyCollisionPenalty('testDrone', 'speed_reduction');
        
        expect(droneBody.userData.speedPenalty).toBe(0.7);
        
        // 시간이 지나면 페널티가 해제되는지 테스트 (실제로는 setTimeout 사용)
        setTimeout(() => {
            expect(droneBody.userData.speedPenalty).toBe(1.0);
        }, 100); // 테스트용으로 짧은 시간
    });
    
    it('바디 제거가 올바르게 작동해야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const droneBody = physics.createDroneBody('testDrone');
        expect(physics.bodies.has('testDrone')).toBeTruthy();
        
        physics.removeBody('testDrone');
        expect(physics.bodies.has('testDrone')).toBeFalsy();
    });
    
    it('물리 시뮬레이션 업데이트가 올바르게 작동해야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const droneBody = physics.createDroneBody('testDrone');
        const initialTime = physics.world.time;
        
        physics.update(1/60);
        
        expect(physics.world.time).toBeGreaterThan(initialTime);
    });
    
    it('디버그 정보가 올바르게 반환되어야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const debugInfo = physics.getDebugInfo();
        
        expect(debugInfo.bodies).toBeGreaterThan(0);
        expect(debugInfo.gravity).toBeTruthy();
        expect(typeof debugInfo.contacts).toBe('number');
    });
});

describe('Physics Collision Tests', () => {
    let physics, mockScene;
    
    beforeEach(() => {
        if (typeof CANNON === 'undefined') return;
        
        mockScene = {
            add: () => {},
            remove: () => {},
            getObjectByName: () => null
        };
        
        physics = new PhysicsEngine(mockScene);
    });
    
    it('바디 타입 확인이 올바르게 작동해야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const droneBody = physics.createDroneBody('player1');
        const wallBody = physics.bodies.get('wall_0');
        
        expect(physics.isDroneBody(droneBody)).toBeTruthy();
        expect(physics.isWallBody(wallBody)).toBeTruthy();
        expect(physics.isDroneBody(wallBody)).toBeFalsy();
        expect(physics.isWallBody(droneBody)).toBeFalsy();
    });
    
    it('바디 ID 찾기가 올바르게 작동해야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const droneBody = physics.createDroneBody('testDrone');
        const foundId = physics.getBodyId(droneBody);
        
        expect(foundId).toBe('testDrone');
    });
    
    it('존재하지 않는 바디의 ID는 null을 반환해야 함', () => {
        if (typeof CANNON === 'undefined') return;
        
        const fakeBody = new CANNON.Body();
        const foundId = physics.getBodyId(fakeBody);
        
        expect(foundId).toBeNull();
    });
});