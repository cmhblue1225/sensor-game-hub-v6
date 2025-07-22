/**
 * 물리 시뮬레이션 정확성 테스트
 * 케이크 물리, 충돌 감지, 환경 물리 시스템의 정확성을 검증합니다.
 */

// 테스트 프레임워크 인스턴스
const testFramework = new TestFramework();
const { describe, it, expect, beforeEach, afterEach } = testFramework;

describe('물리 시뮬레이션 테스트', () => {
    let physicsWorld;
    let cakePhysicsSystem;
    let collisionDetectionSystem;
    let environmentalPhysics;
    
    beforeEach(() => {
        // 테스트용 물리 월드 생성
        physicsWorld = new CANNON.World();
        physicsWorld.gravity.set(0, -9.82, 0);
        physicsWorld.broadphase = new CANNON.NaiveBroadphase();
        
        // 물리 시스템 초기화
        cakePhysicsSystem = new CakePhysicsSystem(physicsWorld);
        collisionDetectionSystem = new CollisionDetectionSystem(physicsWorld);
        environmentalPhysics = new EnvironmentalPhysics(physicsWorld);
    });
    
    afterEach(() => {
        // 물리 월드 정리
        physicsWorld.bodies.forEach(body => {
            physicsWorld.removeBody(body);
        });
        physicsWorld = null;
        cakePhysicsSystem = null;
        collisionDetectionSystem = null;
        environmentalPhysics = null;
    });
    
    describe('케이크 물리 시스템', () => {
        it('케이크 바디가 올바르게 생성되어야 함', () => {
            const cakeBody = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(0, 5, 0));
            
            expect(cakeBody).toBeDefined();
            expect(cakeBody.position.x).toBe(0);
            expect(cakeBody.position.y).toBe(5);
            expect(cakeBody.position.z).toBe(0);
            expect(cakeBody.mass).toBeCloseTo(1.0, 1);
        });
        
        it('케이크 타입별로 다른 물리 속성을 가져야 함', () => {
            const basicCake = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(0, 0, 0));
            const weddingCake = cakePhysicsSystem.createCakeBody('wedding', new CANNON.Vec3(0, 0, 0));
            
            expect(basicCake.mass).toBeLessThan(weddingCake.mass);
            expect(basicCake.material.friction).not.toBe(weddingCake.material.friction);
        });
        
        it('센서 입력에 따라 힘이 올바르게 적용되어야 함', () => {
            const cakeBody = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(0, 0, 0));
            physicsWorld.addBody(cakeBody);
            
            const sensorData = {
                orientation: { gamma: 30, beta: 0, alpha: 0 },
                acceleration: { x: 0, y: 0, z: 0 }
            };
            
            const initialVelocity = cakeBody.velocity.clone();
            cakePhysicsSystem.applySensorForces(cakeBody, sensorData);
            
            // 물리 시뮬레이션 한 스텝 실행
            physicsWorld.step(1/60);
            
            expect(cakeBody.velocity.x).not.toBe(initialVelocity.x);
        });
        
        it('케이크 안정성이 올바르게 계산되어야 함', () => {
            const cakeBody = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(0, 0, 0));
            
            // 안정된 상태
            cakeBody.angularVelocity.set(0, 0, 0);
            let stability = cakePhysicsSystem.calculateStability(cakeBody);
            expect(stability).toBeCloseTo(1.0, 1);
            
            // 불안정한 상태
            cakeBody.angularVelocity.set(5, 5, 5);
            stability = cakePhysicsSystem.calculateStability(cakeBody);
            expect(stability).toBeLessThan(0.5);
        });
    });
    
    describe('충돌 감지 시스템', () => {
        it('충돌 이벤트가 올바르게 감지되어야 함', () => {
            const cakeBody = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(0, 5, 0));
            const groundBody = new CANNON.Body({ mass: 0 });
            groundBody.addShape(new CANNON.Plane());
            groundBody.position.set(0, 0, 0);
            
            physicsWorld.addBody(cakeBody);
            physicsWorld.addBody(groundBody);
            
            let collisionDetected = false;
            collisionDetectionSystem.onCollision((event) => {
                collisionDetected = true;
            });
            
            // 물리 시뮬레이션 실행하여 충돌 발생시키기
            for (let i = 0; i < 100; i++) {
                physicsWorld.step(1/60);
                if (collisionDetected) break;
            }
            
            expect(collisionDetected).toBeTruthy();
        });
        
        it('충돌 강도가 올바르게 계산되어야 함', () => {
            const cakeBody = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(0, 10, 0));
            const groundBody = new CANNON.Body({ mass: 0 });
            groundBody.addShape(new CANNON.Plane());
            
            physicsWorld.addBody(cakeBody);
            physicsWorld.addBody(groundBody);
            
            let collisionIntensity = 0;
            collisionDetectionSystem.onCollision((event) => {
                collisionIntensity = collisionDetectionSystem.calculateCollisionIntensity(event);
            });
            
            // 물리 시뮬레이션 실행
            for (let i = 0; i < 100; i++) {
                physicsWorld.step(1/60);
                if (collisionIntensity > 0) break;
            }
            
            expect(collisionIntensity).toBeGreaterThan(0);
        });
    });
    
    describe('환경 물리 시스템', () => {
        it('바람 효과가 올바르게 적용되어야 함', () => {
            const cakeBody = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(0, 5, 0));
            physicsWorld.addBody(cakeBody);
            
            const windForce = new CANNON.Vec3(10, 0, 0);
            environmentalPhysics.setWindForce(windForce);
            
            const initialVelocity = cakeBody.velocity.clone();
            
            // 바람 효과 적용
            environmentalPhysics.applyEnvironmentalForces([cakeBody]);
            physicsWorld.step(1/60);
            
            expect(cakeBody.velocity.x).toBeGreaterThan(initialVelocity.x);
        });
        
        it('경사면 효과가 올바르게 적용되어야 함', () => {
            const cakeBody = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(0, 1, 0));
            
            // 경사면 생성 (30도 기울기)
            const slopeBody = new CANNON.Body({ mass: 0 });
            const slopeShape = new CANNON.Box(new CANNON.Vec3(5, 0.1, 5));
            slopeBody.addShape(slopeShape);
            slopeBody.position.set(0, 0, 0);
            slopeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 6);
            
            physicsWorld.addBody(cakeBody);
            physicsWorld.addBody(slopeBody);
            
            const initialPosition = cakeBody.position.clone();
            
            // 물리 시뮬레이션 실행
            for (let i = 0; i < 60; i++) {
                physicsWorld.step(1/60);
            }
            
            // 케이크가 경사면을 따라 움직였는지 확인
            expect(cakeBody.position.x).not.toBeCloseTo(initialPosition.x, 1);
        });
        
        it('중력 변경이 올바르게 적용되어야 함', () => {
            const cakeBody = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(0, 5, 0));
            physicsWorld.addBody(cakeBody);
            
            // 중력 변경
            const newGravity = new CANNON.Vec3(0, -20, 0);
            environmentalPhysics.setGravity(newGravity);
            
            expect(physicsWorld.gravity.y).toBe(-20);
            
            // 물리 시뮬레이션 실행
            const initialY = cakeBody.position.y;
            for (let i = 0; i < 30; i++) {
                physicsWorld.step(1/60);
            }
            
            // 더 강한 중력으로 인해 더 빠르게 떨어져야 함
            expect(cakeBody.position.y).toBeLessThan(initialY - 5);
        });
    });
    
    describe('물리 시뮬레이션 정확성', () => {
        it('에너지 보존 법칙이 근사적으로 유지되어야 함', () => {
            const cakeBody = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(0, 10, 0));
            physicsWorld.addBody(cakeBody);
            
            // 초기 위치 에너지 계산
            const initialHeight = cakeBody.position.y;
            const mass = cakeBody.mass;
            const gravity = Math.abs(physicsWorld.gravity.y);
            const initialPotentialEnergy = mass * gravity * initialHeight;
            
            // 물리 시뮬레이션 실행 (자유낙하)
            for (let i = 0; i < 60; i++) {
                physicsWorld.step(1/60);
            }
            
            // 현재 에너지 계산
            const currentHeight = cakeBody.position.y;
            const velocity = cakeBody.velocity.length();
            const currentPotentialEnergy = mass * gravity * currentHeight;
            const currentKineticEnergy = 0.5 * mass * velocity * velocity;
            const totalCurrentEnergy = currentPotentialEnergy + currentKineticEnergy;
            
            // 에너지 보존 확인 (약간의 오차 허용)
            const energyDifference = Math.abs(initialPotentialEnergy - totalCurrentEnergy);
            const tolerance = initialPotentialEnergy * 0.1; // 10% 허용 오차
            
            expect(energyDifference).toBeLessThan(tolerance);
        });
        
        it('시뮬레이션이 안정적으로 실행되어야 함', () => {
            const cakeBody = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(0, 5, 0));
            physicsWorld.addBody(cakeBody);
            
            let simulationStable = true;
            
            try {
                // 긴 시간 동안 시뮬레이션 실행
                for (let i = 0; i < 1000; i++) {
                    physicsWorld.step(1/60);
                    
                    // NaN 또는 무한대 값 확인
                    if (isNaN(cakeBody.position.x) || isNaN(cakeBody.position.y) || isNaN(cakeBody.position.z) ||
                        !isFinite(cakeBody.position.x) || !isFinite(cakeBody.position.y) || !isFinite(cakeBody.position.z)) {
                        simulationStable = false;
                        break;
                    }
                }
            } catch (error) {
                simulationStable = false;
            }
            
            expect(simulationStable).toBeTruthy();
        });
        
        it('물리 바디 제거가 올바르게 작동해야 함', () => {
            const cakeBody = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(0, 5, 0));
            physicsWorld.addBody(cakeBody);
            
            expect(physicsWorld.bodies).toContain(cakeBody);
            
            physicsWorld.removeBody(cakeBody);
            
            expect(physicsWorld.bodies).not.toContain(cakeBody);
        });
    });
    
    describe('성능 테스트', () => {
        it('다수의 물리 바디가 있어도 성능이 유지되어야 함', () => {
            const bodies = [];
            const bodyCount = 50;
            
            // 다수의 케이크 바디 생성
            for (let i = 0; i < bodyCount; i++) {
                const x = (Math.random() - 0.5) * 20;
                const y = Math.random() * 10 + 5;
                const z = (Math.random() - 0.5) * 20;
                
                const cakeBody = cakePhysicsSystem.createCakeBody('basic', new CANNON.Vec3(x, y, z));
                physicsWorld.addBody(cakeBody);
                bodies.push(cakeBody);
            }
            
            const startTime = performance.now();
            
            // 물리 시뮬레이션 실행
            for (let i = 0; i < 60; i++) {
                physicsWorld.step(1/60);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 성능 기준: 60프레임을 1초 이내에 처리
            expect(duration).toBeLessThan(1000);
            
            // 정리
            bodies.forEach(body => physicsWorld.removeBody(body));
        });
    });
});

// 테스트 실행 함수
async function runPhysicsTests() {
    console.log('🧪 물리 시뮬레이션 테스트 시작...');
    
    try {
        const results = await testFramework.runAll();
        return results;
    } catch (error) {
        console.error('물리 테스트 실행 중 오류:', error);
        return null;
    }
}

// 전역으로 내보내기
if (typeof window !== 'undefined') {
    window.runPhysicsTests = runPhysicsTests;
}