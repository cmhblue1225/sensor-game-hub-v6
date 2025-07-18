/**
 * 🎆 드론 레이싱 게임 시각 효과 시스템
 * 
 * 파티클 효과, 트레일, 폭발 등 다양한 시각 효과를 관리
 */

class EffectsSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.trails = new Map(); // 드론별 트레일 저장
        this.explosions = [];
        
        // 파티클 풀링을 위한 재사용 가능한 파티클들
        this.particlePool = [];
        this.maxPoolSize = 1000;
        
        console.log('🎆 시각 효과 시스템 초기화 완료');
    }
    
    /**
     * 드론 트레일 효과 생성
     */
    createDroneTrail(droneId, position, velocity, color = 0x00ffff) {
        // 기존 트레일이 있으면 업데이트, 없으면 새로 생성
        if (!this.trails.has(droneId)) {
            this.trails.set(droneId, {
                points: [],
                geometry: new THREE.BufferGeometry(),
                material: new THREE.LineBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.8,
                    linewidth: 3
                }),
                line: null,
                maxPoints: 50
            });
        }
        
        const trail = this.trails.get(droneId);
        
        // 새 포인트 추가
        trail.points.push(position.clone());
        
        // 최대 포인트 수 제한
        if (trail.points.length > trail.maxPoints) {
            trail.points.shift();
        }
        
        // 트레일 지오메트리 업데이트
        this.updateTrailGeometry(trail);
    }
    
    /**
     * 트레일 지오메트리 업데이트
     */
    updateTrailGeometry(trail) {
        if (trail.points.length < 2) return;
        
        // 기존 라인 제거
        if (trail.line) {
            this.scene.remove(trail.line);
        }
        
        // 새 지오메트리 생성
        trail.geometry = new THREE.BufferGeometry().setFromPoints(trail.points);
        
        // 트레일 페이드 효과를 위한 색상 배열
        const colors = [];
        for (let i = 0; i < trail.points.length; i++) {
            const alpha = i / (trail.points.length - 1); // 0에서 1까지
            colors.push(alpha, alpha, alpha); // RGB 각각에 알파값 적용
        }
        
        trail.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // 새 라인 생성
        trail.line = new THREE.Line(trail.geometry, trail.material);
        this.scene.add(trail.line);
    }
    
    /**
     * 부스터 파티클 효과
     */
    createBoosterParticles(position, direction, intensity = 1.0) {
        const particleCount = Math.floor(10 * intensity);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticleFromPool();
            
            // 파티클 위치 (드론 뒤쪽에서 생성)
            particle.position.copy(position);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ));
            
            // 파티클 속도 (드론 반대 방향)
            const velocity = direction.clone().multiplyScalar(-5 * intensity);
            velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3
            ));
            
            // 파티클 설정
            particle.userData = {
                velocity: velocity,
                life: 1.0,
                maxLife: 1.0 + Math.random() * 0.5,
                size: 0.2 + Math.random() * 0.3,
                color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 1, 0.5 + Math.random() * 0.5)
            };
            
            // 파티클 재질 설정
            particle.material.color.copy(particle.userData.color);
            particle.material.opacity = 1.0;
            particle.scale.setScalar(particle.userData.size);
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }
    
    /**
     * 체크포인트 통과 효과
     */
    createCheckpointPassEffect(position, color = 0x00ffaa) {
        // 링 확산 효과
        const ringGeometry = new THREE.RingGeometry(0.5, 1, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        this.scene.add(ring);
        
        // 링 확산 애니메이션
        const startTime = Date.now();
        const animateRing = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 1000; // 1초 지속
            
            if (progress < 1 && ring.parent) {
                const scale = 1 + progress * 10;
                ring.scale.set(scale, scale, 1);
                ring.material.opacity = 0.8 * (1 - progress);
                requestAnimationFrame(animateRing);
            } else {
                this.scene.remove(ring);
            }
        };
        
        animateRing();
        
        // 파티클 버스트 효과
        this.createParticleBurst(position, color, 20);
    }
    
    /**
     * 충돌 폭발 효과
     */
    createExplosionEffect(position, intensity = 1.0) {
        // 메인 폭발 플래시
        const flashGeometry = new THREE.SphereGeometry(2 * intensity, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // 플래시 애니메이션
        const startTime = Date.now();
        const animateFlash = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 300; // 0.3초 지속
            
            if (progress < 1 && flash.parent) {
                const scale = 1 + progress * 3;
                flash.scale.setScalar(scale);
                flash.material.opacity = 1 - progress;
                requestAnimationFrame(animateFlash);
            } else {
                this.scene.remove(flash);
            }
        };
        
        animateFlash();
        
        // 폭발 파티클
        this.createParticleBurst(position, 0xff4444, 30 * intensity, 2.0);
        
        // 충격파 링
        this.createShockwaveRing(position, intensity);
    }
    
    /**
     * 파티클 버스트 생성
     */
    createParticleBurst(position, color, count, speed = 1.0) {
        for (let i = 0; i < count; i++) {
            const particle = this.getParticleFromPool();
            
            // 구형으로 파티클 분산
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            
            const velocity = new THREE.Vector3(
                Math.sin(theta) * Math.cos(phi),
                Math.sin(theta) * Math.sin(phi),
                Math.cos(theta)
            ).multiplyScalar(5 * speed + Math.random() * 5);
            
            particle.position.copy(position);
            particle.userData = {
                velocity: velocity,
                life: 1.0,
                maxLife: 0.5 + Math.random() * 1.0,
                size: 0.1 + Math.random() * 0.2,
                color: new THREE.Color(color)
            };
            
            particle.material.color.copy(particle.userData.color);
            particle.scale.setScalar(particle.userData.size);
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }
    
    /**
     * 충격파 링 생성
     */
    createShockwaveRing(position, intensity = 1.0) {
        const ringGeometry = new THREE.RingGeometry(0.1, 0.3, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        this.scene.add(ring);
        
        // 충격파 확산 애니메이션
        const startTime = Date.now();
        const animateShockwave = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 800; // 0.8초 지속
            
            if (progress < 1 && ring.parent) {
                const scale = 1 + progress * 15 * intensity;
                ring.scale.set(scale, scale, 1);
                ring.material.opacity = 0.8 * (1 - progress);
                requestAnimationFrame(animateShockwave);
            } else {
                this.scene.remove(ring);
            }
        };
        
        animateShockwave();
    }
    
    /**
     * 네온 조명 애니메이션
     */
    animateNeonLights() {
        const time = Date.now() * 0.001;
        
        // 씬의 모든 포인트 라이트 찾기
        this.scene.traverse((object) => {
            if (object instanceof THREE.PointLight) {
                // 네온 라이트 깜빡임 효과
                const flickerSpeed = 2 + Math.sin(time * 3) * 0.5;
                const intensity = object.userData?.baseIntensity || object.intensity;
                object.intensity = intensity * (0.8 + Math.sin(time * flickerSpeed) * 0.2);
            }
            
            // 네온 재질 애니메이션
            if (object.material && object.material.emissive) {
                const emissiveIntensity = 0.1 + Math.sin(time * 2) * 0.05;
                object.material.emissiveIntensity = emissiveIntensity;
            }
        });
    }
    
    /**
     * 파티클 풀에서 파티클 가져오기
     */
    getParticleFromPool() {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        
        // 새 파티클 생성
        const geometry = new THREE.SphereGeometry(0.1, 6, 6);
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 1.0
        });
        
        return new THREE.Mesh(geometry, material);
    }
    
    /**
     * 파티클을 풀로 반환
     */
    returnParticleToPool(particle) {
        if (this.particlePool.length < this.maxPoolSize) {
            particle.userData = {};
            particle.position.set(0, 0, 0);
            particle.scale.setScalar(1);
            particle.material.opacity = 1;
            this.particlePool.push(particle);
        }
    }
    
    /**
     * 효과 시스템 업데이트 (매 프레임 호출) - 성능 최적화 적용
     */
    update(deltaTime) {
        // 성능 최적화: 파티클 수 제한
        this.optimizeParticleCount();
        
        // 파티클 업데이트
        this.updateParticles(deltaTime);
        
        // 네온 조명 애니메이션 (성능 최적화: 매 3프레임마다)
        if (!this.frameSkipCounter) this.frameSkipCounter = 0;
        if (this.frameSkipCounter % 3 === 0) {
            this.animateNeonLights();
        }
        this.frameSkipCounter++;
        
        // 트레일 페이드 효과
        this.updateTrails(deltaTime);
        
        // 성능 최적화: 거리 기반 LOD 적용
        this.applyDistanceBasedLOD();
    }
    
    /**
     * 파티클 업데이트
     */
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const userData = particle.userData;
            
            if (!userData) continue;
            
            // 파티클 수명 감소
            userData.life -= deltaTime;
            
            if (userData.life <= 0) {
                // 파티클 제거
                this.scene.remove(particle);
                this.particles.splice(i, 1);
                this.returnParticleToPool(particle);
                continue;
            }
            
            // 파티클 위치 업데이트
            if (userData.velocity) {
                particle.position.add(userData.velocity.clone().multiplyScalar(deltaTime));
                
                // 중력 적용
                userData.velocity.y -= 9.8 * deltaTime;
                
                // 공기 저항
                userData.velocity.multiplyScalar(0.98);
            }
            
            // 파티클 투명도 업데이트 (수명에 따라)
            const lifeRatio = userData.life / userData.maxLife;
            particle.material.opacity = lifeRatio;
            
            // 파티클 크기 변화
            const sizeMultiplier = 0.5 + lifeRatio * 0.5;
            particle.scale.setScalar(userData.size * sizeMultiplier);
        }
    }
    
    /**
     * 트레일 업데이트
     */
    updateTrails(deltaTime) {
        this.trails.forEach((trail, droneId) => {
            if (trail.line && trail.line.material) {
                // 트레일 페이드 효과
                trail.line.material.opacity = Math.max(0.3, trail.line.material.opacity - deltaTime * 0.5);
            }
        });
    }
    
    /**
     * 드론 트레일 제거
     */
    removeDroneTrail(droneId) {
        if (this.trails.has(droneId)) {
            const trail = this.trails.get(droneId);
            if (trail.line) {
                this.scene.remove(trail.line);
            }
            this.trails.delete(droneId);
        }
    }
    
    /**
     * 성능 최적화: 파티클 수 제한
     */
    optimizeParticleCount() {
        const maxParticles = 300; // 최대 파티클 수
        
        if (this.particles.length > maxParticles) {
            // 오래된 파티클부터 제거
            const excessParticles = this.particles.splice(0, this.particles.length - maxParticles);
            excessParticles.forEach(particle => {
                this.scene.remove(particle);
                this.returnParticleToPool(particle);
            });
        }
    }
    
    /**
     * 성능 최적화: 거리 기반 LOD 적용
     */
    applyDistanceBasedLOD() {
        // 카메라 위치 추정 (씬 중앙에서 거리 계산)
        const cameraPosition = new THREE.Vector3(0, 10, 20);
        
        this.particles.forEach((particle, index) => {
            const distance = particle.position.distanceTo(cameraPosition);
            
            // 거리에 따른 파티클 처리
            if (distance > 100) {
                // 매우 멀리 있는 파티클은 제거
                this.scene.remove(particle);
                this.particles.splice(index, 1);
                this.returnParticleToPool(particle);
            } else if (distance > 50) {
                // 멀리 있는 파티클은 크기 축소
                particle.scale.multiplyScalar(0.7);
                particle.material.opacity *= 0.8;
            }
        });
        
        // 트레일 LOD 적용
        this.trails.forEach((trail, droneId) => {
            if (trail.line) {
                const distance = trail.line.position.distanceTo(cameraPosition);
                if (distance > 80) {
                    // 멀리 있는 트레일은 투명도 감소
                    trail.line.material.opacity *= 0.6;
                }
            }
        });
    }
    
    /**
     * 성능 최적화: 파티클 배치 최적화
     */
    optimizeParticleBatching() {
        // 동일한 재질을 가진 파티클들을 그룹화하여 배치 렌더링
        const materialGroups = new Map();
        
        this.particles.forEach(particle => {
            const materialKey = particle.material.uuid;
            if (!materialGroups.has(materialKey)) {
                materialGroups.set(materialKey, []);
            }
            materialGroups.get(materialKey).push(particle);
        });
        
        // 각 그룹에 대해 인스턴스 렌더링 적용 (파티클이 많은 경우)
        materialGroups.forEach((particles, materialKey) => {
            if (particles.length > 20) {
                this.createInstancedParticles(particles);
            }
        });
    }
    
    /**
     * 인스턴스 파티클 생성
     */
    createInstancedParticles(particles) {
        if (particles.length === 0) return;
        
        const firstParticle = particles[0];
        const instancedMesh = new THREE.InstancedMesh(
            firstParticle.geometry,
            firstParticle.material,
            particles.length
        );
        
        // 각 인스턴스의 변환 행렬 설정
        const matrix = new THREE.Matrix4();
        particles.forEach((particle, index) => {
            particle.updateMatrixWorld();
            instancedMesh.setMatrixAt(index, particle.matrixWorld);
            
            // 원본 파티클 숨김
            particle.visible = false;
        });
        
        instancedMesh.instanceMatrix.needsUpdate = true;
        this.scene.add(instancedMesh);
        
        // 인스턴스 메시 추적을 위해 저장
        if (!this.instancedMeshes) {
            this.instancedMeshes = [];
        }
        this.instancedMeshes.push(instancedMesh);
    }
    
    /**
     * 성능 통계 반환
     */
    getPerformanceStats() {
        return {
            particleCount: this.particles.length,
            trailCount: this.trails.size,
            poolSize: this.particlePool.length,
            instancedMeshes: this.instancedMeshes ? this.instancedMeshes.length : 0
        };
    }
    
    /**
     * 모든 효과 정리
     */
    cleanup() {
        // 모든 파티클 제거
        this.particles.forEach(particle => {
            this.scene.remove(particle);
        });
        this.particles = [];
        
        // 모든 트레일 제거
        this.trails.forEach((trail, droneId) => {
            this.removeDroneTrail(droneId);
        });
        
        // 인스턴스 메시 제거
        if (this.instancedMeshes) {
            this.instancedMeshes.forEach(mesh => {
                this.scene.remove(mesh);
            });
            this.instancedMeshes = [];
        }
        
        // 파티클 풀 정리
        this.particlePool = [];
        
        console.log('🧹 시각 효과 시스템 정리 완료');
    }
}