/**
 * 🔬 드론 레이싱 물리 엔진 클래스
 * 
 * Cannon.js를 사용한 3D 물리 시뮬레이션
 * - 드론 물리 바디 관리
 * - 충돌 감지 및 처리
 * - 환경 물리 설정
 */

class PhysicsEngine {
    constructor(scene) {
        this.scene = scene;
        this.world = new CANNON.World();
        this.bodies = new Map(); // 물리 바디 저장소
        this.meshes = new Map(); // 메시와 바디 매핑
        
        this.setupWorld();
        this.createEnvironmentBodies();
        
        console.log('🔬 물리 엔진 초기화 완료');
    }
    
    /**
     * 물리 세계 설정
     */
    setupWorld() {
        // 중력 설정 (드론이므로 약간 약하게)
        this.world.gravity.set(0, -5, 0);
        
        // 공기 저항 설정
        this.world.defaultContactMaterial.friction = 0.1;
        this.world.defaultContactMaterial.restitution = 0.3;
        
        // 충돌 감지 최적화
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        // 충돌 이벤트 리스너
        this.world.addEventListener('collide', (event) => {
            this.handleCollision(event);
        });
    }
    
    /**
     * 환경 물리 바디 생성
     */
    createEnvironmentBodies() {
        // 바닥 물리 바디
        const floorShape = new CANNON.Plane();
        const floorBody = new CANNON.Body({ mass: 0 }); // 정적 바디
        floorBody.addShape(floorShape);
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.add(floorBody);
        this.bodies.set('floor', floorBody);
        
        // 트랙 경계 (원형)
        this.createTrackBoundaries();
    }
    
    /**
     * 트랙 경계 생성
     */
    createTrackBoundaries() {
        const radius = 50;
        const segments = 16;
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // 경계 벽 생성
            const wallShape = new CANNON.Box(new CANNON.Vec3(2, 10, 2));
            const wallBody = new CANNON.Body({ mass: 0 });
            wallBody.addShape(wallShape);
            wallBody.position.set(x, 5, z);
            
            this.world.add(wallBody);
            this.bodies.set(`wall_${i}`, wallBody);
        }
    }
    
    /**
     * 드론 물리 바디 생성
     */
    createDroneBody(droneId, position = { x: 0, y: 5, z: 0 }) {
        // 드론 형태 (박스)
        const droneShape = new CANNON.Box(new CANNON.Vec3(1, 0.25, 1));
        const droneBody = new CANNON.Body({ 
            mass: 2,
            material: new CANNON.Material({
                friction: 0.1,
                restitution: 0.3
            })
        });
        
        droneBody.addShape(droneShape);
        droneBody.position.set(position.x, position.y, position.z);
        
        // 공기 저항 시뮬레이션
        droneBody.linearDamping = 0.1;
        droneBody.angularDamping = 0.1;
        
        this.world.add(droneBody);
        this.bodies.set(droneId, droneBody);
        
        return droneBody;
    }
    
    /**
     * 체크포인트 물리 바디 생성
     */
    createCheckpointBody(checkpointId, position, size = { x: 3, y: 5, z: 0.5 }) {
        const checkpointShape = new CANNON.Box(new CANNON.Vec3(size.x, size.y, size.z));
        const checkpointBody = new CANNON.Body({ 
            mass: 0,
            isTrigger: true // 트리거 전용 (물리적 충돌 없음)
        });
        
        checkpointBody.addShape(checkpointShape);
        checkpointBody.position.set(position.x, position.y, position.z);
        
        this.world.add(checkpointBody);
        this.bodies.set(checkpointId, checkpointBody);
        
        return checkpointBody;
    }
    
    /**
     * 부스터 존 물리 바디 생성
     */
    createBoosterZoneBody(zoneId, position, radius = 5) {
        const zoneShape = new CANNON.Sphere(radius);
        const zoneBody = new CANNON.Body({ 
            mass: 0,
            isTrigger: true
        });
        
        zoneBody.addShape(zoneShape);
        zoneBody.position.set(position.x, position.y, position.z);
        
        this.world.add(zoneBody);
        this.bodies.set(zoneId, zoneBody);
        
        return zoneBody;
    }
    
    /**
     * 드론에 힘 적용
     */
    applyDroneForces(droneId, forces) {
        const body = this.bodies.get(droneId);
        if (!body) return;
        
        const { thrust, steering, lift } = forces;
        
        // 추진력 (앞으로)
        if (thrust !== 0) {
            const forwardForce = new CANNON.Vec3(0, 0, -thrust);
            body.quaternion.vmult(forwardForce, forwardForce);
            body.applyLocalForce(forwardForce, new CANNON.Vec3(0, 0, 0));
        }
        
        // 조향력 (회전)
        if (steering !== 0) {
            body.applyLocalTorque(new CANNON.Vec3(0, steering, 0));
        }
        
        // 양력 (위아래)
        if (lift !== 0) {
            body.applyLocalForce(new CANNON.Vec3(0, lift, 0), new CANNON.Vec3(0, 0, 0));
        }
    }
    
    /**
     * 부스터 효과 적용
     */
    applyBoosterEffect(droneId, multiplier = 2.0) {
        const body = this.bodies.get(droneId);
        if (!body) return;
        
        // 드론의 현재 방향으로 강력한 추진력 적용
        const forwardDirection = new CANNON.Vec3(0, 0, -1);
        body.quaternion.vmult(forwardDirection, forwardDirection);
        
        // 부스터 힘 계산 (현재 속도 + 추가 부스터 힘)
        const boosterForce = forwardDirection.scale(50 * multiplier);
        
        // 즉시 임펄스 적용
        body.applyImpulse(boosterForce, body.position);
        
        // 부스터 활성화 표시를 위한 바디 속성 설정
        body.userData = body.userData || {};
        body.userData.boosterActive = true;
        
        // 부스터 효과 지속 시간 후 해제
        setTimeout(() => {
            if (body.userData) {
                body.userData.boosterActive = false;
            }
        }, 1500); // 1.5초
        
        console.log(`${droneId} 부스터 효과 적용: 배율 ${multiplier}`);
    }
    
    /**
     * 부스터 존에서 드론 충전 확인
     */
    checkBoosterZoneCharging(droneId, zonePositions) {
        const body = this.bodies.get(droneId);
        if (!body) return false;
        
        // 드론이 부스터 존 안에 있는지 확인
        for (const zonePos of zonePositions) {
            const distance = body.position.distanceTo(new CANNON.Vec3(zonePos.x, zonePos.y, zonePos.z));
            if (distance < 4) { // 부스터 존 반경 내
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 충돌 처리
     */
    handleCollision(event) {
        const { bodyA, bodyB } = event;
        
        // 드론 간 충돌
        if (this.isDroneBody(bodyA) && this.isDroneBody(bodyB)) {
            this.handleDroneCollision(bodyA, bodyB);
        }
        
        // 드론과 벽 충돌
        else if (this.isDroneBody(bodyA) && this.isWallBody(bodyB)) {
            this.handleWallCollision(bodyA, bodyB);
        }
        else if (this.isDroneBody(bodyB) && this.isWallBody(bodyA)) {
            this.handleWallCollision(bodyB, bodyA);
        }
        
        // 체크포인트 통과
        else if (this.isDroneBody(bodyA) && this.isCheckpointBody(bodyB)) {
            this.handleCheckpointTrigger(bodyA, bodyB);
        }
        else if (this.isDroneBody(bodyB) && this.isCheckpointBody(bodyA)) {
            this.handleCheckpointTrigger(bodyB, bodyA);
        }
        
        // 부스터 존 진입
        else if (this.isDroneBody(bodyA) && this.isBoosterZoneBody(bodyB)) {
            this.handleBoosterZoneTrigger(bodyA, bodyB);
        }
        else if (this.isDroneBody(bodyB) && this.isBoosterZoneBody(bodyA)) {
            this.handleBoosterZoneTrigger(bodyB, bodyA);
        }
    }
    
    /**
     * 드론 간 충돌 처리
     */
    handleDroneCollision(droneBodyA, droneBodyB) {
        // 충돌 시 속도 감소
        droneBodyA.velocity.scale(0.7);
        droneBodyB.velocity.scale(0.7);
        
        // 이벤트 발생
        this.dispatchEvent('drone-collision', {
            droneA: this.getBodyId(droneBodyA),
            droneB: this.getBodyId(droneBodyB)
        });
    }
    
    /**
     * 벽 충돌 처리
     */
    handleWallCollision(droneBody, wallBody) {
        // 충돌 시 큰 속도 감소
        droneBody.velocity.scale(0.3);
        
        // 이벤트 발생
        this.dispatchEvent('wall-collision', {
            drone: this.getBodyId(droneBody),
            wall: this.getBodyId(wallBody)
        });
    }
    
    /**
     * 체크포인트 통과 처리
     */
    handleCheckpointTrigger(droneBody, checkpointBody) {
        this.dispatchEvent('checkpoint-passed', {
            drone: this.getBodyId(droneBody),
            checkpoint: this.getBodyId(checkpointBody)
        });
    }
    
    /**
     * 부스터 존 진입 처리
     */
    handleBoosterZoneTrigger(droneBody, zoneBody) {
        this.dispatchEvent('booster-zone-entered', {
            drone: this.getBodyId(droneBody),
            zone: this.getBodyId(zoneBody)
        });
    }
    
    /**
     * 바디 타입 확인 함수들
     */
    isDroneBody(body) {
        const id = this.getBodyId(body);
        return id && (id.includes('player') || id.includes('drone'));
    }
    
    isWallBody(body) {
        const id = this.getBodyId(body);
        return id && id.includes('wall');
    }
    
    isCheckpointBody(body) {
        const id = this.getBodyId(body);
        return id && id.includes('checkpoint');
    }
    
    isBoosterZoneBody(body) {
        const id = this.getBodyId(body);
        return id && id.includes('booster');
    }
    
    /**
     * 바디 ID 찾기
     */
    getBodyId(body) {
        for (const [id, storedBody] of this.bodies) {
            if (storedBody === body) {
                return id;
            }
        }
        return null;
    }
    
    /**
     * 메시와 물리 바디 동기화
     */
    syncMeshWithBody(meshId, bodyId) {
        const mesh = this.scene.getObjectByName(meshId);
        const body = this.bodies.get(bodyId);
        
        if (mesh && body) {
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);
        }
    }
    
    /**
     * 모든 메시 동기화
     */
    syncAllMeshes() {
        for (const [bodyId, body] of this.bodies) {
            if (bodyId.includes('player') || bodyId.includes('drone')) {
                this.syncMeshWithBody(bodyId, bodyId);
            }
        }
    }
    
    /**
     * 물리 시뮬레이션 업데이트 (성능 최적화 적용)
     */
    update(deltaTime = 1/60) {
        // 성능 최적화: deltaTime 제한 (물리 시뮬레이션 안정성)
        const clampedDeltaTime = Math.min(deltaTime, 1/30);
        
        // 성능 최적화: 적응형 물리 업데이트
        if (!this.physicsFrameSkip) this.physicsFrameSkip = 0;
        
        // 높은 프레임레이트에서는 물리 업데이트 빈도 조절
        const shouldUpdatePhysics = this.physicsFrameSkip % this.getPhysicsUpdateInterval() === 0;
        
        if (shouldUpdatePhysics) {
            this.world.step(clampedDeltaTime);
            this.syncAllMeshes();
        }
        
        this.physicsFrameSkip++;
        
        // 성능 최적화: 트랙 경계 확인 빈도 조절 (매 10프레임마다)
        if (this.physicsFrameSkip % 10 === 0) {
            this.checkTrackBounds();
        }
        
        // 성능 최적화: 충돌 감지 최적화
        this.optimizeCollisionDetection();
    }
    
    /**
     * 트랙 경계 확인 및 드론 리셋
     */
    checkTrackBounds() {
        for (const [bodyId, body] of this.bodies) {
            if (this.isDroneBody(body)) {
                const position = body.position;
                
                // 트랙 중심에서의 거리 계산
                const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
                
                // 트랙 경계 (반경 60) 또는 높이 제한 (-10 이하) 확인
                if (distanceFromCenter > 60 || position.y < -10) {
                    this.resetDronePosition(bodyId, body);
                }
            }
        }
    }
    
    /**
     * 드론 위치 리셋
     */
    resetDronePosition(droneId, droneBody) {
        // 안전한 위치로 리셋 (트랙 중앙 근처)
        const resetPosition = this.findSafeResetPosition(droneId);
        
        droneBody.position.set(resetPosition.x, resetPosition.y, resetPosition.z);
        droneBody.velocity.set(0, 0, 0);
        droneBody.angularVelocity.set(0, 0, 0);
        droneBody.quaternion.set(0, 0, 0, 1);
        
        // 트랙 이탈 이벤트 발생
        this.dispatchEvent('track-out-of-bounds', {
            drone: droneId,
            resetPosition: resetPosition
        });
        
        console.log(`${droneId} 트랙 이탈로 인한 리셋`);
    }
    
    /**
     * 안전한 리셋 위치 찾기
     */
    findSafeResetPosition(droneId) {
        // 플레이어별 기본 리셋 위치
        const basePositions = {
            'player1': { x: -10, y: 8, z: 0 },
            'player2': { x: 10, y: 8, z: 0 }
        };
        
        return basePositions[droneId] || { x: 0, y: 8, z: 0 };
    }
    
    /**
     * 충돌 시 속도 및 방향 조정
     */
    adjustDroneAfterCollision(droneId, collisionType, intensity = 1.0) {
        const body = this.bodies.get(droneId);
        if (!body) return;
        
        switch (collisionType) {
            case 'drone':
                // 드론 간 충돌: 속도 감소 및 반발
                body.velocity.scale(0.6);
                this.addRandomBounce(body, 0.3 * intensity);
                break;
                
            case 'wall':
                // 벽 충돌: 큰 속도 감소 및 반발
                body.velocity.scale(0.3);
                this.addRandomBounce(body, 0.5 * intensity);
                break;
                
            case 'obstacle':
                // 장애물 충돌: 중간 정도 영향
                body.velocity.scale(0.5);
                this.addRandomBounce(body, 0.4 * intensity);
                break;
        }
        
        // 충돌 후 안정화를 위한 댐핑 증가 (일시적)
        const originalDamping = body.linearDamping;
        body.linearDamping = 0.3;
        
        setTimeout(() => {
            body.linearDamping = originalDamping;
        }, 1000);
    }
    
    /**
     * 랜덤 반발 효과 추가
     */
    addRandomBounce(body, intensity) {
        const bounceForce = new CANNON.Vec3(
            (Math.random() - 0.5) * intensity * 20,
            Math.random() * intensity * 10,
            (Math.random() - 0.5) * intensity * 20
        );
        
        body.applyImpulse(bounceForce, body.position);
    }
    
    /**
     * 페널티 시스템 적용
     */
    applyCollisionPenalty(droneId, penaltyType) {
        const body = this.bodies.get(droneId);
        if (!body) return;
        
        switch (penaltyType) {
            case 'speed_reduction':
                // 속도 감소 페널티 (5초간)
                body.userData = body.userData || {};
                body.userData.speedPenalty = 0.7; // 30% 속도 감소
                
                setTimeout(() => {
                    if (body.userData) {
                        body.userData.speedPenalty = 1.0;
                    }
                }, 5000);
                break;
                
            case 'control_disruption':
                // 조작 방해 페널티 (3초간)
                body.userData = body.userData || {};
                body.userData.controlDisruption = true;
                
                setTimeout(() => {
                    if (body.userData) {
                        body.userData.controlDisruption = false;
                    }
                }, 3000);
                break;
        }
    }
    
    /**
     * 바디 제거
     */
    removeBody(bodyId) {
        const body = this.bodies.get(bodyId);
        if (body) {
            this.world.remove(body);
            this.bodies.delete(bodyId);
        }
    }
    
    /**
     * 이벤트 발생
     */
    dispatchEvent(eventType, data) {
        const event = new CustomEvent(eventType, { detail: data });
        window.dispatchEvent(event);
    }
    
    /**
     * 성능 최적화: 물리 업데이트 간격 계산
     */
    getPhysicsUpdateInterval() {
        // 현재 FPS에 따라 물리 업데이트 간격 조정
        const currentFPS = this.estimatedFPS || 60;
        
        if (currentFPS > 50) {
            return 1; // 높은 FPS에서는 매 프레임 업데이트
        } else if (currentFPS > 30) {
            return 2; // 중간 FPS에서는 2프레임마다 업데이트
        } else {
            return 3; // 낮은 FPS에서는 3프레임마다 업데이트
        }
    }
    
    /**
     * 성능 최적화: 충돌 감지 최적화
     */
    optimizeCollisionDetection() {
        // 활성 바디만 충돌 감지에 포함
        this.bodies.forEach((body, bodyId) => {
            if (this.isDroneBody(body)) {
                const velocity = body.velocity.length();
                
                // 정지 상태의 드론은 충돌 감지 빈도 감소
                if (velocity < 0.1) {
                    body.sleepState = CANNON.Body.SLEEPY;
                } else {
                    body.sleepState = CANNON.Body.AWAKE;
                }
            }
        });
        
        // 브로드페이즈 최적화
        if (this.world.broadphase instanceof CANNON.NaiveBroadphase) {
            // 바디 수가 많아지면 더 효율적인 브로드페이즈로 전환
            if (this.bodies.size > 20) {
                this.world.broadphase = new CANNON.SAPBroadphase(this.world);
            }
        }
    }
    
    /**
     * 성능 최적화: 물리 바디 슬립 관리
     */
    manageSleepingBodies() {
        this.bodies.forEach((body, bodyId) => {
            if (body.sleepState === CANNON.Body.SLEEPING) {
                // 슬립 상태의 바디는 물리 계산에서 제외
                body.type = CANNON.Body.KINEMATIC;
            } else if (body.sleepState === CANNON.Body.AWAKE) {
                // 깨어있는 바디는 다이나믹으로 설정
                if (this.isDroneBody(body)) {
                    body.type = CANNON.Body.DYNAMIC;
                }
            }
        });
    }
    
    /**
     * 성능 최적화: 물리 시뮬레이션 품질 조정
     */
    adjustPhysicsQuality(qualityLevel) {
        switch (qualityLevel) {
            case 'low':
                this.world.solver.iterations = 5;
                this.world.defaultContactMaterial.contactEquationStiffness = 1e6;
                this.world.defaultContactMaterial.contactEquationRelaxation = 4;
                break;
                
            case 'medium':
                this.world.solver.iterations = 8;
                this.world.defaultContactMaterial.contactEquationStiffness = 1e7;
                this.world.defaultContactMaterial.contactEquationRelaxation = 3;
                break;
                
            case 'high':
                this.world.solver.iterations = 12;
                this.world.defaultContactMaterial.contactEquationStiffness = 1e8;
                this.world.defaultContactMaterial.contactEquationRelaxation = 2;
                break;
        }
        
        console.log(`물리 엔진 품질 설정: ${qualityLevel}`);
    }
    
    /**
     * 성능 통계 반환
     */
    getPerformanceStats() {
        return {
            activeBodies: Array.from(this.bodies.values()).filter(body => 
                body.sleepState === CANNON.Body.AWAKE
            ).length,
            totalBodies: this.bodies.size,
            contacts: this.world.contacts.length,
            broadphaseType: this.world.broadphase.constructor.name,
            solverIterations: this.world.solver.iterations
        };
    }
    
    /**
     * 디버그 정보
     */
    getDebugInfo() {
        return {
            bodies: this.bodies.size,
            gravity: this.world.gravity,
            contacts: this.world.contacts.length,
            performance: this.getPerformanceStats()
        };
    }
    
    /**
     * 정리
     */
    dispose() {
        // 모든 바디 제거
        for (const [bodyId] of this.bodies) {
            this.removeBody(bodyId);
        }
        
        this.bodies.clear();
        console.log('🔬 물리 엔진 정리 완료');
    }
}