/**
 * 고급 조명 시스템
 * 다중 조명, 동적 그림자, 환경 조명을 관리
 */
class AdvancedLightingSystem {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        
        // 조명 저장소
        this.lights = new Map();
        
        // 조명 그룹
        this.lightGroups = new Map();
        
        // 그림자 설정
        this.shadowConfig = {
            enabled: true,
            mapSize: 2048,
            near: 0.5,
            far: 50,
            bias: -0.0001,
            normalBias: 0.02,
            radius: 4
        };
        
        // 환경 조명
        this.ambientLight = null;
        this.hemisphereLight = null;
        
        // 시간 기반 조명
        this.timeOfDay = 0.5; // 0: 밤, 0.5: 낮, 1: 밤
        this.timeSpeed = 0.01;
        this.enableTimeProgression = false;
        
        // 조명 애니메이션
        this.lightAnimations = new Map();
        
        // 성능 설정
        this.performanceMode = 'high'; // low, medium, high
        
        console.log('💡 고급 조명 시스템 초기화 완료');
    }
    
    /**
     * 조명 시스템 초기화
     */
    init() {
        // 렌더러 그림자 설정
        this.setupShadows();
        
        // 기본 조명 생성
        this.createBasicLighting();
        
        // 환경 조명 생성
        this.createEnvironmentLighting();
        
        console.log('✅ 조명 시스템 초기화 완료');
    }
    
    /**
     * 그림자 설정
     */
    setupShadows() {
        if (!this.shadowConfig.enabled) return;
        
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        
        console.log('🌑 그림자 시스템 활성화');
    }
    
    /**
     * 기본 조명 생성
     */
    createBasicLighting() {
        // 주 방향광 (태양)
        this.createDirectionalLight('sun', {
            color: 0xffffff,
            intensity: 1.0,
            position: [10, 15, 5],
            target: [0, 0, 0],
            castShadow: true,
            shadowMapSize: this.shadowConfig.mapSize,
            shadowCameraNear: this.shadowConfig.near,
            shadowCameraFar: this.shadowConfig.far,
            shadowCameraLeft: -15,
            shadowCameraRight: 15,
            shadowCameraTop: 15,
            shadowCameraBottom: -15,
            shadowBias: this.shadowConfig.bias,
            shadowNormalBias: this.shadowConfig.normalBias,
            shadowRadius: this.shadowConfig.radius
        });
        
        // 보조 방향광 (채움광)
        this.createDirectionalLight('fill', {
            color: 0x87CEEB,
            intensity: 0.3,
            position: [-5, 8, -7],
            target: [0, 0, 0],
            castShadow: false
        });
        
        // 림 라이트 (윤곽광)
        this.createDirectionalLight('rim', {
            color: 0xFFE4B5,
            intensity: 0.2,
            position: [0, 5, -10],
            target: [0, 0, 0],
            castShadow: false
        });
    }
    
    /**
     * 환경 조명 생성
     */
    createEnvironmentLighting() {
        // 환경광
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(this.ambientLight);
        this.lights.set('ambient', this.ambientLight);
        
        // 반구광 (하늘과 땅의 색상)
        this.hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.6);
        this.hemisphereLight.position.set(0, 50, 0);
        this.scene.add(this.hemisphereLight);
        this.lights.set('hemisphere', this.hemisphereLight);
        
        console.log('🌍 환경 조명 생성 완료');
    }
    
    /**
     * 방향광 생성
     * @param {string} name - 조명 이름
     * @param {Object} options - 조명 옵션
     */
    createDirectionalLight(name, options = {}) {
        const {
            color = 0xffffff,
            intensity = 1.0,
            position = [0, 10, 0],
            target = [0, 0, 0],
            castShadow = false,
            shadowMapSize = 1024,
            shadowCameraNear = 0.5,
            shadowCameraFar = 50,
            shadowCameraLeft = -10,
            shadowCameraRight = 10,
            shadowCameraTop = 10,
            shadowCameraBottom = -10,
            shadowBias = -0.0001,
            shadowNormalBias = 0.02,
            shadowRadius = 4
        } = options;
        
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(position[0], position[1], position[2]);
        light.target.position.set(target[0], target[1], target[2]);
        
        // 그림자 설정
        if (castShadow && this.shadowConfig.enabled) {
            light.castShadow = true;
            light.shadow.mapSize.width = shadowMapSize;
            light.shadow.mapSize.height = shadowMapSize;
            light.shadow.camera.near = shadowCameraNear;
            light.shadow.camera.far = shadowCameraFar;
            light.shadow.camera.left = shadowCameraLeft;
            light.shadow.camera.right = shadowCameraRight;
            light.shadow.camera.top = shadowCameraTop;
            light.shadow.camera.bottom = shadowCameraBottom;
            light.shadow.bias = shadowBias;
            light.shadow.normalBias = shadowNormalBias;
            light.shadow.radius = shadowRadius;
        }
        
        this.scene.add(light);
        this.scene.add(light.target);
        this.lights.set(name, light);
        
        console.log(`☀️ 방향광 생성: ${name}`);
        return light;
    }
    
    /**
     * 점광 생성
     * @param {string} name - 조명 이름
     * @param {Object} options - 조명 옵션
     */
    createPointLight(name, options = {}) {
        const {
            color = 0xffffff,
            intensity = 1.0,
            distance = 0,
            decay = 2,
            position = [0, 5, 0],
            castShadow = false,
            shadowMapSize = 512,
            shadowCameraNear = 0.1,
            shadowCameraFar = 25,
            shadowBias = -0.0001,
            shadowNormalBias = 0.02,
            shadowRadius = 4
        } = options;
        
        const light = new THREE.PointLight(color, intensity, distance, decay);
        light.position.set(position[0], position[1], position[2]);
        
        // 그림자 설정
        if (castShadow && this.shadowConfig.enabled) {
            light.castShadow = true;
            light.shadow.mapSize.width = shadowMapSize;
            light.shadow.mapSize.height = shadowMapSize;
            light.shadow.camera.near = shadowCameraNear;
            light.shadow.camera.far = shadowCameraFar;
            light.shadow.bias = shadowBias;
            light.shadow.normalBias = shadowNormalBias;
            light.shadow.radius = shadowRadius;
        }
        
        this.scene.add(light);
        this.lights.set(name, light);
        
        console.log(`💡 점광 생성: ${name}`);
        return light;
    }
    
    /**
     * 스포트라이트 생성
     * @param {string} name - 조명 이름
     * @param {Object} options - 조명 옵션
     */
    createSpotLight(name, options = {}) {
        const {
            color = 0xffffff,
            intensity = 1.0,
            distance = 0,
            angle = Math.PI / 3,
            penumbra = 0.1,
            decay = 2,
            position = [0, 10, 0],
            target = [0, 0, 0],
            castShadow = false,
            shadowMapSize = 1024,
            shadowCameraNear = 0.5,
            shadowCameraFar = 50,
            shadowBias = -0.0001,
            shadowNormalBias = 0.02,
            shadowRadius = 4
        } = options;
        
        const light = new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
        light.position.set(position[0], position[1], position[2]);
        light.target.position.set(target[0], target[1], target[2]);
        
        // 그림자 설정
        if (castShadow && this.shadowConfig.enabled) {
            light.castShadow = true;
            light.shadow.mapSize.width = shadowMapSize;
            light.shadow.mapSize.height = shadowMapSize;
            light.shadow.camera.near = shadowCameraNear;
            light.shadow.camera.far = shadowCameraFar;
            light.shadow.bias = shadowBias;
            light.shadow.normalBias = shadowNormalBias;
            light.shadow.radius = shadowRadius;
        }
        
        this.scene.add(light);
        this.scene.add(light.target);
        this.lights.set(name, light);
        
        console.log(`🔦 스포트라이트 생성: ${name}`);
        return light;
    }
    
    /**
     * 조명 그룹 생성
     * @param {string} groupName - 그룹 이름
     * @param {Array<string>} lightNames - 조명 이름들
     */
    createLightGroup(groupName, lightNames) {
        const group = lightNames.map(name => this.lights.get(name)).filter(light => light);
        this.lightGroups.set(groupName, group);
        
        console.log(`👥 조명 그룹 생성: ${groupName} (${group.length}개 조명)`);
    }
    
    /**
     * 조명 애니메이션 추가
     * @param {string} lightName - 조명 이름
     * @param {string} animationType - 애니메이션 타입
     * @param {Object} params - 애니메이션 파라미터
     */
    addLightAnimation(lightName, animationType, params = {}) {
        const light = this.lights.get(lightName);
        if (!light) {
            console.warn(`⚠️ 조명을 찾을 수 없음: ${lightName}`);
            return;
        }
        
        const animation = {
            type: animationType,
            params,
            time: 0,
            originalIntensity: light.intensity,
            originalColor: light.color.clone(),
            originalPosition: light.position.clone()
        };
        
        this.lightAnimations.set(lightName, animation);
        
        console.log(`🎬 조명 애니메이션 추가: ${lightName} (${animationType})`);
    }
    
    /**
     * 조명 애니메이션 제거
     * @param {string} lightName - 조명 이름
     */
    removeLightAnimation(lightName) {
        if (this.lightAnimations.has(lightName)) {
            this.lightAnimations.delete(lightName);
            console.log(`🗑️ 조명 애니메이션 제거: ${lightName}`);
        }
    }
    
    /**
     * 시간대별 조명 설정
     * @param {number} timeOfDay - 시간 (0: 밤, 0.5: 낮, 1: 밤)
     */
    setTimeOfDay(timeOfDay) {
        this.timeOfDay = Math.max(0, Math.min(1, timeOfDay));
        
        // 태양 조명 조정
        const sunLight = this.lights.get('sun');
        if (sunLight) {
            // 태양 위치 계산
            const angle = (this.timeOfDay - 0.5) * Math.PI;
            const height = Math.sin(angle * 0.5 + Math.PI * 0.5) * 15;
            const distance = Math.cos(angle) * 10;
            
            sunLight.position.set(distance, Math.max(height, 1), 5);
            
            // 태양 강도 조정
            const intensity = Math.max(0.1, Math.sin(angle * 0.5 + Math.PI * 0.5));
            sunLight.intensity = intensity;
            
            // 태양 색상 조정
            if (this.timeOfDay < 0.2 || this.timeOfDay > 0.8) {
                // 밤 - 달빛
                sunLight.color.setHex(0x4169E1);
                sunLight.intensity *= 0.3;
            } else if (this.timeOfDay < 0.3 || this.timeOfDay > 0.7) {
                // 황혼/새벽
                sunLight.color.setHex(0xFF6347);
            } else {
                // 낮
                sunLight.color.setHex(0xFFFFFF);
            }
        }
        
        // 환경광 조정
        if (this.ambientLight) {
            const ambientIntensity = 0.2 + (Math.sin((this.timeOfDay - 0.5) * Math.PI) * 0.3);
            this.ambientLight.intensity = Math.max(0.1, ambientIntensity);
        }
        
        // 반구광 조정
        if (this.hemisphereLight) {
            const hemiIntensity = 0.3 + (Math.sin((this.timeOfDay - 0.5) * Math.PI) * 0.4);
            this.hemisphereLight.intensity = Math.max(0.1, hemiIntensity);
        }
        
        console.log(`🕐 시간대 설정: ${(this.timeOfDay * 24).toFixed(1)}시`);
    }
    
    /**
     * 조명 강도 설정
     * @param {string} name - 조명 이름 또는 그룹 이름
     * @param {number} intensity - 강도
     */
    setLightIntensity(name, intensity) {
        // 개별 조명
        const light = this.lights.get(name);
        if (light) {
            light.intensity = intensity;
            return;
        }
        
        // 조명 그룹
        const group = this.lightGroups.get(name);
        if (group) {
            group.forEach(light => {
                light.intensity = intensity;
            });
            return;
        }
        
        console.warn(`⚠️ 조명 또는 그룹을 찾을 수 없음: ${name}`);
    }
    
    /**
     * 조명 색상 설정
     * @param {string} name - 조명 이름 또는 그룹 이름
     * @param {number} color - 색상 (hex)
     */
    setLightColor(name, color) {
        // 개별 조명
        const light = this.lights.get(name);
        if (light) {
            light.color.setHex(color);
            return;
        }
        
        // 조명 그룹
        const group = this.lightGroups.get(name);
        if (group) {
            group.forEach(light => {
                light.color.setHex(color);
            });
            return;
        }
        
        console.warn(`⚠️ 조명 또는 그룹을 찾을 수 없음: ${name}`);
    }
    
    /**
     * 조명 위치 설정
     * @param {string} name - 조명 이름
     * @param {Array<number>} position - 위치 [x, y, z]
     */
    setLightPosition(name, position) {
        const light = this.lights.get(name);
        if (light) {
            light.position.set(position[0], position[1], position[2]);
        } else {
            console.warn(`⚠️ 조명을 찾을 수 없음: ${name}`);
        }
    }
    
    /**
     * 성능 모드 설정
     * @param {string} mode - 성능 모드 (low, medium, high)
     */
    setPerformanceMode(mode) {
        this.performanceMode = mode;
        
        switch (mode) {
            case 'low':
                // 그림자 비활성화
                this.lights.forEach(light => {
                    if (light.castShadow) {
                        light.castShadow = false;
                    }
                });
                // 그림자 맵 크기 감소
                this.shadowConfig.mapSize = 512;
                break;
                
            case 'medium':
                // 일부 조명만 그림자 활성화
                const sunLight = this.lights.get('sun');
                if (sunLight) sunLight.castShadow = true;
                this.shadowConfig.mapSize = 1024;
                break;
                
            case 'high':
                // 모든 그림자 활성화
                this.shadowConfig.mapSize = 2048;
                break;
        }
        
        console.log(`⚡ 성능 모드 설정: ${mode}`);
    }
    
    /**
     * 업데이트
     * @param {number} deltaTime - 델타 시간
     */
    update(deltaTime) {
        // 시간 진행
        if (this.enableTimeProgression) {
            this.timeOfDay += this.timeSpeed * deltaTime;
            if (this.timeOfDay > 1) this.timeOfDay -= 1;
            this.setTimeOfDay(this.timeOfDay);
        }
        
        // 조명 애니메이션 업데이트
        this.lightAnimations.forEach((animation, lightName) => {
            this.updateLightAnimation(lightName, animation, deltaTime);
        });
    }
    
    /**
     * 조명 애니메이션 업데이트
     * @param {string} lightName - 조명 이름
     * @param {Object} animation - 애니메이션 데이터
     * @param {number} deltaTime - 델타 시간
     */
    updateLightAnimation(lightName, animation, deltaTime) {
        const light = this.lights.get(lightName);
        if (!light) return;
        
        animation.time += deltaTime;
        
        switch (animation.type) {
            case 'flicker':
                const flickerIntensity = animation.originalIntensity * 
                    (0.8 + Math.random() * 0.4);
                light.intensity = flickerIntensity;
                break;
                
            case 'pulse':
                const pulseSpeed = animation.params.speed || 2.0;
                const pulseAmount = animation.params.amount || 0.5;
                const pulse = Math.sin(animation.time * pulseSpeed) * pulseAmount + 1.0;
                light.intensity = animation.originalIntensity * pulse;
                break;
                
            case 'rotate':
                const rotateSpeed = animation.params.speed || 1.0;
                const radius = animation.params.radius || 5.0;
                const height = animation.originalPosition.y;
                light.position.x = Math.cos(animation.time * rotateSpeed) * radius;
                light.position.z = Math.sin(animation.time * rotateSpeed) * radius;
                light.position.y = height;
                break;
                
            case 'colorCycle':
                const cycleSpeed = animation.params.speed || 1.0;
                const hue = (animation.time * cycleSpeed) % 1.0;
                light.color.setHSL(hue, 1.0, 0.5);
                break;
        }
    }
    
    /**
     * 조명 제거
     * @param {string} name - 조명 이름
     */
    removeLight(name) {
        const light = this.lights.get(name);
        if (light) {
            this.scene.remove(light);
            if (light.target) {
                this.scene.remove(light.target);
            }
            light.dispose();
            this.lights.delete(name);
            
            // 애니메이션도 제거
            this.removeLightAnimation(name);
            
            console.log(`🗑️ 조명 제거: ${name}`);
        }
    }
    
    /**
     * 조명 가져오기
     * @param {string} name - 조명 이름
     * @returns {THREE.Light|null}
     */
    getLight(name) {
        return this.lights.get(name) || null;
    }
    
    /**
     * 모든 조명 이름 반환
     * @returns {Array<string>}
     */
    getLightNames() {
        return Array.from(this.lights.keys());
    }
    
    /**
     * 정리
     */
    cleanup() {
        console.log('🧹 조명 시스템 정리 시작...');
        
        // 모든 조명 제거
        this.lights.forEach((light, name) => {
            this.scene.remove(light);
            if (light.target) {
                this.scene.remove(light.target);
            }
            light.dispose();
        });
        
        this.lights.clear();
        this.lightGroups.clear();
        this.lightAnimations.clear();
        
        console.log('✅ 조명 시스템 정리 완료');
    }
    
    /**
     * 디버그 정보 반환
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            lightCount: this.lights.size,
            lights: Array.from(this.lights.keys()),
            lightGroups: Array.from(this.lightGroups.keys()),
            animations: Array.from(this.lightAnimations.keys()),
            timeOfDay: this.timeOfDay,
            performanceMode: this.performanceMode,
            shadowsEnabled: this.shadowConfig.enabled
        };
    }
}