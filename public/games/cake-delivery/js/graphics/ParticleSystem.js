/**
 * 고급 파티클 시스템
 * 다양한 시각 효과를 위한 파티클 생성 및 관리
 */
class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particleSystems = new Map();
        this.activeEffects = [];
        this.textureLoader = new THREE.TextureLoader();
        this.particleTextures = new Map();
        
        // 파티클 풀링을 위한 오브젝트 풀
        this.particlePool = {
            celebration: [],
            explosion: [],
            sparkle: [],
            smoke: [],
            weather: []
        };
        
        this.maxPoolSize = 50;
        this.initializeParticleTextures();
    }
    
    /**
     * 파티클 텍스처 초기화
     */
    initializeParticleTextures() {
        // 기본 파티클 텍스처 생성 (프로그래매틱)
        this.createBasicTextures();
    }
    
    /**
     * 기본 텍스처 생성
     */
    createBasicTextures() {
        // 원형 파티클 텍스처
        const circleTexture = this.createCircleTexture(64);
        this.particleTextures.set('circle', circleTexture);
        
        // 별 모양 텍스처
        const starTexture = this.createStarTexture(64);
        this.particleTextures.set('star', starTexture);
        
        // 연기 텍스처
        const smokeTexture = this.createSmokeTexture(64);
        this.particleTextures.set('smoke', smokeTexture);
        
        // 스파크 텍스처
        const sparkTexture = this.createSparkTexture(32);
        this.particleTextures.set('spark', sparkTexture);
    }
    
    /**
     * 원형 텍스처 생성
     */
    createCircleTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    /**
     * 별 모양 텍스처 생성
     */
    createStarTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(255,255,255,0)';
        ctx.fillRect(0, 0, size, size);
        
        // 별 그리기
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.beginPath();
        const centerX = size / 2;
        const centerY = size / 2;
        const outerRadius = size * 0.4;
        const innerRadius = size * 0.2;
        const spikes = 5;
        
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    /**
     * 연기 텍스처 생성
     */
    createSmokeTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, 'rgba(128,128,128,0.8)');
        gradient.addColorStop(0.3, 'rgba(128,128,128,0.4)');
        gradient.addColorStop(1, 'rgba(128,128,128,0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    /**
     * 스파크 텍스처 생성
     */
    createSparkTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(255,255,255,0)';
        ctx.fillRect(0, 0, size, size);
        
        // 십자 모양 스파크
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.fillRect(size/2 - 1, 0, 2, size);
        ctx.fillRect(0, size/2 - 1, size, 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    /**
     * 축하 파티클 효과 생성
     * @param {THREE.Vector3} position - 생성 위치
     * @param {Object} options - 옵션
     */
    createCelebrationEffect(position, options = {}) {
        const config = {
            particleCount: options.particleCount || 100,
            duration: options.duration || 3.0,
            spread: options.spread || 5.0,
            colors: options.colors || [0xFFD700, 0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFFA07A],
            size: options.size || 0.2,
            ...options
        };
        
        const particles = this.createParticleSystem('celebration', config.particleCount);
        const geometry = particles.geometry;
        const material = particles.material;
        
        // 파티클 속성 설정
        const positions = geometry.attributes.position.array;
        const velocities = new Float32Array(config.particleCount * 3);
        const colors = new Float32Array(config.particleCount * 3);
        const lifetimes = new Float32Array(config.particleCount);
        const sizes = new Float32Array(config.particleCount);
        
        for (let i = 0; i < config.particleCount; i++) {
            const i3 = i * 3;
            
            // 초기 위치 (약간의 랜덤 분산)
            positions[i3] = position.x + (Math.random() - 0.5) * 2;
            positions[i3 + 1] = position.y + Math.random() * 2;
            positions[i3 + 2] = position.z + (Math.random() - 0.5) * 2;
            
            // 초기 속도 (폭발 패턴)
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI * 0.5;
            const speed = 5 + Math.random() * 10;
            
            velocities[i3] = Math.cos(angle) * Math.cos(elevation) * speed;
            velocities[i3 + 1] = Math.sin(elevation) * speed + 5;
            velocities[i3 + 2] = Math.sin(angle) * Math.cos(elevation) * speed;
            
            // 색상 (랜덤 선택)
            const colorIndex = Math.floor(Math.random() * config.colors.length);
            const color = new THREE.Color(config.colors[colorIndex]);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // 수명과 크기
            lifetimes[i] = config.duration * (0.5 + Math.random() * 0.5);
            sizes[i] = config.size * (0.5 + Math.random() * 1.5);
        }
        
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // 재질 설정
        material.map = this.particleTextures.get('star');
        material.vertexColors = true;
        material.transparent = true;
        material.opacity = 0.8;
        material.size = config.size;
        material.sizeAttenuation = true;
        material.blending = THREE.AdditiveBlending;
        
        particles.position.copy(position);
        this.scene.add(particles);
        
        // 효과 등록
        this.activeEffects.push({
            particles,
            type: 'celebration',
            startTime: Date.now(),
            duration: config.duration * 1000,
            config
        });
        
        console.log(`🎉 축하 파티클 효과 생성: ${config.particleCount}개 파티클`);
        return particles;
    }
    
    /**
     * 폭발 파티클 효과 생성
     * @param {THREE.Vector3} position - 폭발 위치
     * @param {Object} options - 옵션
     */
    createExplosionEffect(position, options = {}) {
        const config = {
            particleCount: options.particleCount || 50,
            duration: options.duration || 2.0,
            force: options.force || 15.0,
            color: options.color || 0xFF4500,
            size: options.size || 0.3,
            ...options
        };
        
        const particles = this.createParticleSystem('explosion', config.particleCount);
        const geometry = particles.geometry;
        const material = particles.material;
        
        // 파티클 속성 설정
        const positions = geometry.attributes.position.array;
        const velocities = new Float32Array(config.particleCount * 3);
        const colors = new Float32Array(config.particleCount * 3);
        
        for (let i = 0; i < config.particleCount; i++) {
            const i3 = i * 3;
            
            // 초기 위치
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
            
            // 폭발 방향 (구형 분포)
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const force = config.force * (0.5 + Math.random() * 0.5);
            
            velocities[i3] = Math.sin(theta) * Math.cos(phi) * force;
            velocities[i3 + 1] = Math.cos(theta) * force;
            velocities[i3 + 2] = Math.sin(theta) * Math.sin(phi) * force;
            
            // 색상 (주황색에서 빨간색으로 그라데이션)
            const colorVariation = Math.random();
            const color = new THREE.Color(config.color).lerp(new THREE.Color(0xFF0000), colorVariation);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // 재질 설정
        material.map = this.particleTextures.get('circle');
        material.vertexColors = true;
        material.transparent = true;
        material.size = config.size;
        material.blending = THREE.AdditiveBlending;
        
        particles.position.copy(position);
        this.scene.add(particles);
        
        // 효과 등록
        this.activeEffects.push({
            particles,
            type: 'explosion',
            startTime: Date.now(),
            duration: config.duration * 1000,
            config
        });
        
        console.log(`💥 폭발 파티클 효과 생성`);
        return particles;
    }
    
    /**
     * 날씨 파티클 효과 생성 (비, 눈 등)
     * @param {string} weatherType - 날씨 타입 ('rain', 'snow', 'wind')
     * @param {Object} options - 옵션
     */
    createWeatherEffect(weatherType, options = {}) {
        const config = {
            particleCount: options.particleCount || 200,
            area: options.area || { width: 50, height: 20, depth: 50 },
            intensity: options.intensity || 1.0,
            ...options
        };
        
        const particles = this.createParticleSystem('weather', config.particleCount);
        const geometry = particles.geometry;
        const material = particles.material;
        
        const positions = geometry.attributes.position.array;
        const velocities = new Float32Array(config.particleCount * 3);
        
        for (let i = 0; i < config.particleCount; i++) {
            const i3 = i * 3;
            
            // 영역 내 랜덤 위치
            positions[i3] = (Math.random() - 0.5) * config.area.width;
            positions[i3 + 1] = Math.random() * config.area.height + 10;
            positions[i3 + 2] = (Math.random() - 0.5) * config.area.depth;
            
            // 날씨별 속도 설정
            switch (weatherType) {
                case 'rain':
                    velocities[i3] = (Math.random() - 0.5) * 2;
                    velocities[i3 + 1] = -10 - Math.random() * 5;
                    velocities[i3 + 2] = (Math.random() - 0.5) * 2;
                    break;
                case 'snow':
                    velocities[i3] = (Math.random() - 0.5) * 1;
                    velocities[i3 + 1] = -2 - Math.random() * 2;
                    velocities[i3 + 2] = (Math.random() - 0.5) * 1;
                    break;
                case 'wind':
                    velocities[i3] = 5 + Math.random() * 5;
                    velocities[i3 + 1] = (Math.random() - 0.5) * 2;
                    velocities[i3 + 2] = (Math.random() - 0.5) * 3;
                    break;
            }
        }
        
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        // 날씨별 재질 설정
        switch (weatherType) {
            case 'rain':
                material.color.setHex(0x4A90E2);
                material.size = 0.05;
                material.opacity = 0.6;
                break;
            case 'snow':
                material.color.setHex(0xFFFFFF);
                material.size = 0.1;
                material.opacity = 0.8;
                material.map = this.particleTextures.get('circle');
                break;
            case 'wind':
                material.color.setHex(0xE0E0E0);
                material.size = 0.03;
                material.opacity = 0.3;
                break;
        }
        
        material.transparent = true;
        material.blending = THREE.NormalBlending;
        
        this.scene.add(particles);
        
        // 지속적인 효과로 등록
        this.activeEffects.push({
            particles,
            type: 'weather',
            weatherType,
            startTime: Date.now(),
            duration: -1, // 무한
            config
        });
        
        console.log(`🌦️ 날씨 파티클 효과 생성: ${weatherType}`);
        return particles;
    }
    
    /**
     * 파티클 시스템 생성
     * @param {string} type - 파티클 타입
     * @param {number} count - 파티클 개수
     * @returns {THREE.Points}
     */
    createParticleSystem(type, count) {
        // 풀에서 재사용 가능한 파티클 시스템 찾기
        const pool = this.particlePool[type];
        if (pool && pool.length > 0) {
            const particles = pool.pop();
            // 파티클 개수 조정
            this.resizeParticleSystem(particles, count);
            return particles;
        }
        
        // 새 파티클 시스템 생성
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 1.0,
            vertexColors: false
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.userData.type = type;
        particles.userData.maxCount = count;
        
        return particles;
    }
    
    /**
     * 파티클 시스템 크기 조정
     * @param {THREE.Points} particles - 파티클 시스템
     * @param {number} newCount - 새로운 파티클 개수
     */
    resizeParticleSystem(particles, newCount) {
        const geometry = particles.geometry;
        const currentCount = particles.userData.maxCount;
        
        if (newCount !== currentCount) {
            const positions = new Float32Array(newCount * 3);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particles.userData.maxCount = newCount;
        }
    }
    
    /**
     * 파티클 시스템 업데이트
     * @param {number} deltaTime - 델타 시간
     */
    update(deltaTime) {
        const currentTime = Date.now();
        
        // 활성 효과들 업데이트
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            const elapsed = currentTime - effect.startTime;
            
            // 수명이 다한 효과 제거
            if (effect.duration > 0 && elapsed > effect.duration) {
                this.removeEffect(i);
                continue;
            }
            
            // 효과별 업데이트
            this.updateEffect(effect, deltaTime, elapsed);
        }
    }
    
    /**
     * 개별 효과 업데이트
     * @param {Object} effect - 효과 객체
     * @param {number} deltaTime - 델타 시간
     * @param {number} elapsed - 경과 시간
     */
    updateEffect(effect, deltaTime, elapsed) {
        const particles = effect.particles;
        const geometry = particles.geometry;
        const positions = geometry.attributes.position.array;
        
        switch (effect.type) {
            case 'celebration':
            case 'explosion':
                this.updateExplosiveEffect(effect, deltaTime, elapsed);
                break;
            case 'weather':
                this.updateWeatherEffect(effect, deltaTime);
                break;
        }
        
        geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * 폭발형 효과 업데이트
     * @param {Object} effect - 효과 객체
     * @param {number} deltaTime - 델타 시간
     * @param {number} elapsed - 경과 시간
     */
    updateExplosiveEffect(effect, deltaTime, elapsed) {
        const particles = effect.particles;
        const geometry = particles.geometry;
        const positions = geometry.attributes.position.array;
        const velocities = geometry.attributes.velocity.array;
        
        const gravity = -9.81;
        const damping = 0.98;
        const progress = elapsed / effect.duration;
        
        for (let i = 0; i < positions.length; i += 3) {
            // 위치 업데이트
            positions[i] += velocities[i] * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += velocities[i + 2] * deltaTime;
            
            // 중력 적용
            velocities[i + 1] += gravity * deltaTime;
            
            // 감쇠 적용
            velocities[i] *= damping;
            velocities[i + 1] *= damping;
            velocities[i + 2] *= damping;
        }
        
        // 투명도 페이드아웃
        particles.material.opacity = Math.max(0, 1 - progress);
    }
    
    /**
     * 날씨 효과 업데이트
     * @param {Object} effect - 효과 객체
     * @param {number} deltaTime - 델타 시간
     */
    updateWeatherEffect(effect, deltaTime) {
        const particles = effect.particles;
        const geometry = particles.geometry;
        const positions = geometry.attributes.position.array;
        const velocities = geometry.attributes.velocity.array;
        const config = effect.config;
        
        for (let i = 0; i < positions.length; i += 3) {
            // 위치 업데이트
            positions[i] += velocities[i] * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += velocities[i + 2] * deltaTime;
            
            // 영역을 벗어나면 재배치
            if (positions[i + 1] < -5) {
                positions[i] = (Math.random() - 0.5) * config.area.width;
                positions[i + 1] = config.area.height + 10;
                positions[i + 2] = (Math.random() - 0.5) * config.area.depth;
            }
        }
    }
    
    /**
     * 효과 제거
     * @param {number} index - 효과 인덱스
     */
    removeEffect(index) {
        const effect = this.activeEffects[index];
        
        // 씬에서 제거
        this.scene.remove(effect.particles);
        
        // 풀로 반환 (재사용을 위해)
        this.returnToPool(effect.particles);
        
        // 배열에서 제거
        this.activeEffects.splice(index, 1);
        
        console.log(`🗑️ 파티클 효과 제거: ${effect.type}`);
    }
    
    /**
     * 파티클 시스템을 풀로 반환
     * @param {THREE.Points} particles - 파티클 시스템
     */
    returnToPool(particles) {
        const type = particles.userData.type;
        const pool = this.particlePool[type];
        
        if (pool && pool.length < this.maxPoolSize) {
            // 초기화
            particles.position.set(0, 0, 0);
            particles.rotation.set(0, 0, 0);
            particles.material.opacity = 1.0;
            
            pool.push(particles);
        } else {
            // 풀이 가득 찬 경우 메모리 해제
            particles.geometry.dispose();
            particles.material.dispose();
        }
    }
    
    /**
     * 모든 효과 정지
     */
    stopAllEffects() {
        while (this.activeEffects.length > 0) {
            this.removeEffect(0);
        }
        console.log('⏹️ 모든 파티클 효과 정지');
    }
    
    /**
     * 특정 타입의 효과 정지
     * @param {string} type - 효과 타입
     */
    stopEffectsByType(type) {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            if (this.activeEffects[i].type === type) {
                this.removeEffect(i);
            }
        }
        console.log(`⏹️ ${type} 파티클 효과 정지`);
    }
    
    /**
     * 정리
     */
    cleanup() {
        console.log('🧹 파티클 시스템 정리 시작...');
        
        // 모든 효과 정지
        this.stopAllEffects();
        
        // 텍스처 정리
        this.particleTextures.forEach((texture, key) => {
            texture.dispose();
        });
        this.particleTextures.clear();
        
        // 풀 정리
        Object.values(this.particlePool).forEach(pool => {
            pool.forEach(particles => {
                particles.geometry.dispose();
                particles.material.dispose();
            });
            pool.length = 0;
        });
        
        console.log('✅ 파티클 시스템 정리 완료');
    }
    
    /**
     * 메모리 사용량 정보
     * @returns {Object}
     */
    getMemoryInfo() {
        let totalParticles = 0;
        this.activeEffects.forEach(effect => {
            totalParticles += effect.particles.userData.maxCount;
        });
        
        return {
            activeEffects: this.activeEffects.length,
            totalParticles,
            pooledSystems: Object.values(this.particlePool).reduce((sum, pool) => sum + pool.length, 0),
            textureCount: this.particleTextures.size
        };
    }
}