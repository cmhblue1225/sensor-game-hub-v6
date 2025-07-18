/**
 * 🚁 드론 클래스
 * 
 * 3D 드론 모델과 물리, 센서 데이터 처리를 담당
 */

class Drone {
    constructor(playerId, scene, physics, position = { x: 0, y: 5, z: 0 }) {
        this.playerId = playerId;
        this.scene = scene;
        this.physics = physics;
        
        // 드론 상태
        this.position = new THREE.Vector3(position.x, position.y, position.z);
        this.rotation = new THREE.Euler();
        this.velocity = new THREE.Vector3();
        
        // 드론 물리 속성
        this.speed = 0;
        this.maxSpeed = 50;
        this.acceleration = 0;
        this.steering = 0;
        this.thrust = 0;
        this.lift = 0;
        
        // 부스터 시스템
        this.booster = {
            energy: 100,
            maxEnergy: 100,
            isActive: false,
            cooldown: 0,
            multiplier: 2.0,
            duration: 1500, // 1.5초
            rechargeRate: 10 // 초당 10% 충전
        };
        
        // 레이스 상태
        this.lapCount = 0;
        this.lapTime = 0;
        this.bestLapTime = Infinity;
        this.checkpointIndex = 0;
        this.rank = 1;
        this.maxSpeed = 0;
        
        // 3D 모델 및 물리 바디
        this.mesh = null;
        this.body = null;
        this.trail = null;
        this.particles = null;
        
        this.create3DModel();
        this.createPhysicsBody();
        
        console.log(`🚁 드론 생성: ${playerId}`);
    }
    
    /**
     * 3D 드론 모델 생성
     */
    create3DModel() {
        // 드론 본체 (메인 바디)
        const bodyGeometry = new THREE.BoxGeometry(2, 0.4, 2);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: this.playerId === 'player1' ? 0x00ff88 : 0xff0088,
            transparent: true,
            opacity: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        
        // 드론 그룹 생성
        this.mesh = new THREE.Group();
        this.mesh.add(body);
        
        // 프로펠러들 생성
        this.createPropellers();
        
        // 네온 효과 추가
        this.addNeonEffects();
        
        // 위치 설정
        this.mesh.position.copy(this.position);
        this.mesh.name = this.playerId;
        
        this.scene.add(this.mesh);
    }
    
    /**
     * 프로펠러 생성
     */
    createPropellers() {
        const propellerPositions = [
            { x: -0.8, y: 0.3, z: -0.8 },
            { x: 0.8, y: 0.3, z: -0.8 },
            { x: -0.8, y: 0.3, z: 0.8 },
            { x: 0.8, y: 0.3, z: 0.8 }
        ];
        
        this.propellers = [];
        
        propellerPositions.forEach((pos, index) => {
            // 프로펠러 암
            const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6);
            const armMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const arm = new THREE.Mesh(armGeometry, armMaterial);
            arm.position.set(pos.x, pos.y - 0.3, pos.z);
            this.mesh.add(arm);
            
            // 프로펠러 블레이드
            const bladeGeometry = new THREE.BoxGeometry(0.6, 0.02, 0.1);
            const bladeMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x666666,
                transparent: true,
                opacity: 0.7
            });
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.position.set(pos.x, pos.y, pos.z);
            
            this.mesh.add(blade);
            this.propellers.push(blade);
        });
    }
    
    /**
     * 네온 효과 추가
     */
    addNeonEffects() {
        // LED 라이트들
        const lightPositions = [
            { x: -1, y: 0, z: -1 },
            { x: 1, y: 0, z: -1 },
            { x: -1, y: 0, z: 1 },
            { x: 1, y: 0, z: 1 }
        ];
        
        const lightColor = this.playerId === 'player1' ? 0x00ff88 : 0xff0088;
        
        lightPositions.forEach(pos => {
            const lightGeometry = new THREE.SphereGeometry(0.1);
            const lightMaterial = new THREE.MeshBasicMaterial({ 
                color: lightColor,
                transparent: true,
                opacity: 0.8
            });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(pos.x, pos.y, pos.z);
            this.mesh.add(light);
        });
        
        // 포인트 라이트 추가
        this.pointLight = new THREE.PointLight(lightColor, 1, 20);
        this.pointLight.position.set(0, 1, 0);
        this.mesh.add(this.pointLight);
    }
    
    /**
     * 물리 바디 생성
     */
    createPhysicsBody() {
        this.body = this.physics.createDroneBody(this.playerId, this.position);
    }
    
    /**
     * 센서 데이터로 드론 업데이트
     */
    updateFromSensor(sensorData) {
        const { orientation, acceleration } = sensorData.data;
        
        if (orientation) {
            // 좌우 기울기 -> 회전 (gamma: -90 ~ 90)
            this.steering = (orientation.gamma || 0) * 0.02;
            this.steering = Math.max(-1, Math.min(1, this.steering));
            
            // 앞뒤 기울기 -> 추진력 (beta: -180 ~ 180)
            const pitch = orientation.beta || 0;
            if (pitch < -15) {
                this.thrust = Math.min(1, (Math.abs(pitch) - 15) / 30);
            } else if (pitch > 15) {
                this.thrust = -Math.min(0.5, (pitch - 15) / 30);
            } else {
                this.thrust = 0;
            }
        }
        
        // 흔들기 감지 -> 부스터 활성화
        if (acceleration) {
            const totalAccel = Math.sqrt(
                (acceleration.x || 0) ** 2 + 
                (acceleration.y || 0) ** 2 + 
                (acceleration.z || 0) ** 2
            );
            
            if (totalAccel > 15 && this.canUseBooster()) {
                this.activateBooster();
            }
        }
    }
    
    /**
     * 키보드 입력으로 드론 업데이트 (테스트용)
     */
    updateFromKeyboard(controls) {
        // 추진력
        if (controls.forward) {
            this.thrust = 1;
        } else if (controls.backward) {
            this.thrust = -0.5;
        } else {
            this.thrust = 0;
        }
        
        // 조향
        if (controls.left) {
            this.steering = -0.5;
        } else if (controls.right) {
            this.steering = 0.5;
        } else {
            this.steering = 0;
        }
        
        // 상하 움직임
        if (controls.up) {
            this.lift = 1;
        } else if (controls.down) {
            this.lift = -1;
        } else {
            this.lift = 0;
        }
        
        // 부스터
        if (controls.boost && this.canUseBooster()) {
            this.activateBooster();
        }
    }
    
    /**
     * 부스터 시스템
     */
    canUseBooster() {
        return this.booster.energy >= 20 && this.booster.cooldown <= 0;
    }
    
    activateBooster() {
        if (!this.canUseBooster()) return;
        
        this.booster.isActive = true;
        this.booster.energy -= 20;
        this.booster.cooldown = 3000; // 3초 쿨다운
        
        // 물리 엔진에 부스터 효과 적용
        this.physics.applyBoosterEffect(this.playerId, this.booster.multiplier);
        
        // 부스터 효과 지속 시간
        setTimeout(() => {
            this.booster.isActive = false;
        }, this.booster.duration);
        
        // 부스터 파티클 효과 (나중에 구현)
        this.createBoosterParticles();
    }
    
    /**
     * 부스터 파티클 효과 생성
     */
    createBoosterParticles() {
        if (!this.mesh) return;
        
        // 기존 파티클 제거
        if (this.boosterParticles) {
            this.scene.remove(this.boosterParticles);
        }
        
        // 파티클 시스템 생성
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        // 파티클 초기화
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 드론 뒤쪽에서 파티클 생성
            positions[i3] = (Math.random() - 0.5) * 2;     // x
            positions[i3 + 1] = (Math.random() - 0.5) * 1; // y
            positions[i3 + 2] = -2 + Math.random() * -2;   // z (뒤쪽)
            
            // 파티클 속도
            velocities[i3] = (Math.random() - 0.5) * 0.1;     // x
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.1; // y
            velocities[i3 + 2] = -0.5 - Math.random() * 0.5;  // z (뒤로)
            
            // 파티클 색상 (부스터 색상)
            const color = new THREE.Color(0x00aaff);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // 파티클 머티리얼
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        // 파티클 시스템 생성
        this.boosterParticles = new THREE.Points(particles, particleMaterial);
        this.boosterParticles.position.copy(this.mesh.position);
        this.boosterParticles.rotation.copy(this.mesh.rotation);
        
        this.scene.add(this.boosterParticles);
        
        // 파티클 애니메이션 시작
        this.animateBoosterParticles();
        
        console.log(`${this.playerId} 부스터 파티클 효과 생성!`);
    }
    
    /**
     * 부스터 파티클 애니메이션
     */
    animateBoosterParticles() {
        if (!this.boosterParticles || !this.booster.isActive) {
            // 부스터가 비활성화되면 파티클 제거
            if (this.boosterParticles) {
                this.scene.remove(this.boosterParticles);
                this.boosterParticles = null;
            }
            return;
        }
        
        const positions = this.boosterParticles.geometry.attributes.position.array;
        const velocities = this.boosterParticles.geometry.attributes.velocity.array;
        const colors = this.boosterParticles.geometry.attributes.color.array;
        
        // 파티클 업데이트
        for (let i = 0; i < positions.length; i += 3) {
            // 위치 업데이트
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // 파티클이 너무 멀어지면 리셋
            if (positions[i + 2] < -10) {
                positions[i] = (Math.random() - 0.5) * 2;
                positions[i + 1] = (Math.random() - 0.5) * 1;
                positions[i + 2] = -2;
                
                // 색상 변화 (파란색에서 흰색으로)
                const intensity = Math.random();
                colors[i] = intensity;     // R
                colors[i + 1] = intensity; // G
                colors[i + 2] = 1;         // B
            }
        }
        
        // 파티클 위치를 드론에 맞춤
        if (this.mesh) {
            this.boosterParticles.position.copy(this.mesh.position);
            this.boosterParticles.rotation.copy(this.mesh.rotation);
        }
        
        // 버퍼 업데이트
        this.boosterParticles.geometry.attributes.position.needsUpdate = true;
        this.boosterParticles.geometry.attributes.color.needsUpdate = true;
        
        // 다음 프레임에서 계속 애니메이션
        if (this.booster.isActive) {
            requestAnimationFrame(() => this.animateBoosterParticles());
        }
    }
    
    /**
     * 드론 업데이트 (매 프레임)
     */
    update(deltaTime) {
        if (!this.body) return;
        
        // 물리 힘 적용
        this.physics.applyDroneForces(this.playerId, {
            thrust: this.thrust * 20,
            steering: this.steering * 5,
            lift: this.lift * 15 // 상하 움직임 추가
        });
        
        // 메시 위치 동기화
        if (this.mesh) {
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
        }
        
        // 속도 계산
        this.velocity.copy(this.body.velocity);
        this.speed = this.velocity.length() * 3.6; // m/s to km/h
        this.maxSpeed = Math.max(this.maxSpeed, this.speed);
        
        // 프로펠러 회전
        this.updatePropellers();
        
        // 부스터 시스템 업데이트
        this.updateBooster(deltaTime);
        
        // 랩 타임 업데이트
        this.updateLapTime(deltaTime);
    }
    
    /**
     * 프로펠러 회전 업데이트
     */
    updatePropellers() {
        if (!this.propellers) return;
        
        const rotationSpeed = Math.max(0.1, this.speed * 0.1);
        
        this.propellers.forEach((propeller, index) => {
            const direction = index % 2 === 0 ? 1 : -1;
            propeller.rotation.y += rotationSpeed * direction;
        });
    }
    
    /**
     * 부스터 시스템 업데이트
     */
    updateBooster(deltaTime) {
        // 쿨다운 감소
        if (this.booster.cooldown > 0) {
            this.booster.cooldown -= deltaTime * 1000;
        }
        
        // 에너지 자동 충전 (기본 충전률)
        if (this.booster.energy < this.booster.maxEnergy) {
            this.booster.energy += this.booster.rechargeRate * deltaTime;
            this.booster.energy = Math.min(this.booster.maxEnergy, this.booster.energy);
        }
        
        // 부스터 활성화 시 네온 효과
        if (this.booster.isActive && this.pointLight) {
            this.pointLight.intensity = 2 + Math.sin(Date.now() * 0.01) * 0.5;
        } else if (this.pointLight) {
            this.pointLight.intensity = 1;
        }
    }
    
    /**
     * 부스터 존에서 에너지 충전
     */
    chargeBoosterInZone(deltaTime) {
        // 부스터 존에서는 3배 빠른 충전
        const fastChargeRate = this.booster.rechargeRate * 3;
        
        if (this.booster.energy < this.booster.maxEnergy) {
            this.booster.energy += fastChargeRate * deltaTime;
            this.booster.energy = Math.min(this.booster.maxEnergy, this.booster.energy);
            
            // 충전 효과 표시
            if (this.pointLight) {
                this.pointLight.intensity = 1.5 + Math.sin(Date.now() * 0.02) * 0.5;
                this.pointLight.color.setHex(0xffaa00); // 노란색으로 변경
            }
            
            return true; // 충전 중임을 반환
        }
        
        return false;
    }
    
    /**
     * 부스터 존 충전 효과 종료
     */
    exitBoosterZone() {
        if (this.pointLight) {
            // 원래 색상으로 복원
            const originalColor = this.playerId === 'player1' ? 0x00ff88 : 0xff0088;
            this.pointLight.color.setHex(originalColor);
            this.pointLight.intensity = 1;
        }
    }
    
    /**
     * 랩 타임 업데이트
     */
    updateLapTime(deltaTime) {
        if (this.lapCount < 3) { // 3랩 완주 전까지
            this.lapTime += deltaTime;
        }
    }
    
    /**
     * 체크포인트 통과 처리
     */
    passCheckpoint(checkpointIndex) {
        if (checkpointIndex === this.checkpointIndex + 1 || 
            (checkpointIndex === 0 && this.checkpointIndex === 7)) {
            
            this.checkpointIndex = checkpointIndex;
            
            // 한 랩 완주 체크
            if (checkpointIndex === 0 && this.lapCount > 0) {
                this.completeLap();
            } else if (checkpointIndex === 0) {
                this.lapCount = 1; // 첫 랩 시작
            }
        }
    }
    
    /**
     * 랩 완주 처리
     */
    completeLap() {
        this.lapCount++;
        
        if (this.lapTime < this.bestLapTime) {
            this.bestLapTime = this.lapTime;
        }
        
        console.log(`${this.playerId} 랩 ${this.lapCount} 완주! 시간: ${this.lapTime.toFixed(2)}s`);
        
        // 3랩 완주 체크
        if (this.lapCount >= 3) {
            this.finishRace();
        } else {
            this.lapTime = 0; // 다음 랩을 위해 시간 리셋
        }
    }
    
    /**
     * 경주 완주 처리
     */
    finishRace() {
        console.log(`${this.playerId} 경주 완주!`);
        
        // 완주 이벤트 발생
        const event = new CustomEvent('race-finished', {
            detail: {
                playerId: this.playerId,
                totalTime: this.lapTime,
                bestLap: this.bestLapTime,
                maxSpeed: this.maxSpeed
            }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * 드론 리셋
     */
    reset(position = { x: 0, y: 5, z: 0 }) {
        // 위치 리셋
        this.position.set(position.x, position.y, position.z);
        if (this.body) {
            this.body.position.set(position.x, position.y, position.z);
            this.body.velocity.set(0, 0, 0);
            this.body.angularVelocity.set(0, 0, 0);
        }
        
        // 상태 리셋
        this.speed = 0;
        this.acceleration = 0;
        this.steering = 0;
        this.thrust = 0;
        
        // 레이스 상태 리셋
        this.lapCount = 0;
        this.lapTime = 0;
        this.checkpointIndex = 0;
        this.rank = 1;
        this.maxSpeed = 0;
        
        // 부스터 리셋
        this.booster.energy = this.booster.maxEnergy;
        this.booster.isActive = false;
        this.booster.cooldown = 0;
        
        console.log(`${this.playerId} 드론 리셋 완료`);
    }
    
    /**
     * 드론 데이터 반환 (UI용)
     */
    getData() {
        return {
            playerId: this.playerId,
            speed: this.speed,
            lapCount: this.lapCount,
            lapTime: this.lapTime,
            bestLapTime: this.bestLapTime,
            rank: this.rank,
            maxSpeed: this.maxSpeed,
            booster: {
                energy: this.booster.energy,
                isActive: this.booster.isActive,
                cooldown: this.booster.cooldown
            },
            position: this.position.clone(),
            velocity: this.velocity.clone()
        };
    }
    
    /**
     * 정리
     */
    dispose() {
        // 3D 모델 제거
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        
        // 물리 바디 제거
        if (this.physics && this.playerId) {
            this.physics.removeBody(this.playerId);
        }
        
        console.log(`${this.playerId} 드론 정리 완료`);
    }
}