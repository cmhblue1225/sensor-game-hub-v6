/**
 * 파티클 시스템
 * 게임 내 파티클 효과를 생성하고 관리합니다.
 */
class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particleSystems = new Map();
        this.textures = new Map();
        
        console.log('✅ 파티클 시스템 초기화 완료');
    }
    
    /**
     * 텍스처 로드
     */
    async loadTextures() {
        // 기본 파티클 텍스처 생성
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // 원형 파티클 텍스처
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        this.textures.set('default', texture);
        
        console.log('✅ 파티클 텍스처 로드 완료');
    }
    
    /**
     * 축하 효과 생성
     */
    createCelebrationEffect(position) {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 위치
            positions[i3] = position.x + (Math.random() - 0.5) * 2;
            positions[i3 + 1] = position.y + Math.random() * 2;
            positions[i3 + 2] = position.z + (Math.random() - 0.5) * 2;
            
            // 색상 (무지개색)
            const hue = Math.random();
            const color = new THREE.Color().setHSL(hue, 1.0, 0.5);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // 속도
            velocities[i3] = (Math.random() - 0.5) * 10;
            velocities[i3 + 1] = Math.random() * 15 + 5;
            velocities[i3 + 2] = (Math.random() - 0.5) * 10;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            map: this.textures.get('default')
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        // 파티클 시스템 등록
        const systemId = 'celebration_' + Date.now();
        this.particleSystems.set(systemId, {
            particles: particles,
            geometry: geometry,
            material: material,
            startTime: Date.now(),
            duration: 3000,
            type: 'celebration'
        });
        
        console.log('🎉 축하 파티클 효과 생성');
        return systemId;
    }
    
    /**
     * 실패 효과 생성
     */
    createFailureEffect(position) {
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 위치
            positions[i3] = position.x + (Math.random() - 0.5) * 1;
            positions[i3 + 1] = position.y + Math.random() * 1;
            positions[i3 + 2] = position.z + (Math.random() - 0.5) * 1;
            
            // 색상 (빨간색 계열)
            colors[i3] = 1.0;
            colors[i3 + 1] = Math.random() * 0.3;
            colors[i3 + 2] = Math.random() * 0.3;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        // 파티클 시스템 등록
        const systemId = 'failure_' + Date.now();
        this.particleSystems.set(systemId, {
            particles: particles,
            geometry: geometry,
            material: material,
            startTime: Date.now(),
            duration: 2000,
            type: 'failure'
        });
        
        console.log('💥 실패 파티클 효과 생성');
        return systemId;
    }
    
    /**
     * 업데이트
     */
    update(deltaTime) {
        const currentTime = Date.now();
        const systemsToRemove = [];
        
        this.particleSystems.forEach((system, systemId) => {
            const elapsed = currentTime - system.startTime;
            const progress = elapsed / system.duration;
            
            if (progress >= 1.0) {
                // 시스템 제거 예약
                systemsToRemove.push(systemId);
                return;
            }
            
            // 파티클 업데이트
            this.updateParticleSystem(system, progress, deltaTime);
        });
        
        // 완료된 시스템 제거
        systemsToRemove.forEach(systemId => {
            this.removeParticleSystem(systemId);
        });
    }
    
    /**
     * 파티클 시스템 업데이트
     */
    updateParticleSystem(system, progress, deltaTime) {
        const positions = system.geometry.attributes.position.array;
        const velocities = system.geometry.attributes.velocity;
        
        if (system.type === 'celebration' && velocities) {
            const velocityArray = velocities.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                // 중력 적용
                velocityArray[i + 1] -= 9.8 * deltaTime;
                
                // 위치 업데이트
                positions[i] += velocityArray[i] * deltaTime;
                positions[i + 1] += velocityArray[i + 1] * deltaTime;
                positions[i + 2] += velocityArray[i + 2] * deltaTime;
            }
            
            system.geometry.attributes.position.needsUpdate = true;
        }
        
        // 투명도 감소
        system.material.opacity = 1.0 - progress;
    }
    
    /**
     * 파티클 시스템 제거
     */
    removeParticleSystem(systemId) {
        const system = this.particleSystems.get(systemId);
        if (system) {
            this.scene.remove(system.particles);
            system.geometry.dispose();
            system.material.dispose();
            this.particleSystems.delete(systemId);
        }
    }
    
    /**
     * 모든 파티클 시스템 정리
     */
    cleanup() {
        this.particleSystems.forEach((system, systemId) => {
            this.removeParticleSystem(systemId);
        });
        
        this.textures.forEach(texture => {
            texture.dispose();
        });
        
        console.log('🧹 파티클 시스템 정리 완료');
    }
}