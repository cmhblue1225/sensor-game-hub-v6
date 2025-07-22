/**
 * 고급 조명 시스템
 * 동적 조명과 그림자를 관리합니다.
 */
class AdvancedLightingSystem {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.lights = new Map();
        this.lightGroups = new Map();
        
        console.log('✅ 고급 조명 시스템 초기화 완료');
    }
    
    /**
     * 시스템 초기화
     */
    init() {
        // 기본 조명 설정
        this.createBasicLights();
        
        // 그림자 설정
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    /**
     * 기본 조명 생성
     */
    createBasicLights() {
        // 환경광
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        this.lights.set('ambient', ambientLight);
        
        // 태양광
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(10, 10, 5);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
        this.lights.set('sun', sunLight);
        
        // 보조광
        const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
        this.lights.set('fill', fillLight);
    }
    
    /**
     * 스포트라이트 생성
     */
    createSpotLight(name, options) {
        const light = new THREE.SpotLight(
            options.color || 0xffffff,
            options.intensity || 1.0,
            options.distance || 0,
            options.angle || Math.PI / 3,
            options.penumbra || 0
        );
        
        if (options.position) {
            light.position.set(...options.position);
        }
        
        if (options.target) {
            light.target.position.set(...options.target);
            this.scene.add(light.target);
        }
        
        if (options.castShadow) {
            light.castShadow = true;
            light.shadow.mapSize.width = 1024;
            light.shadow.mapSize.height = 1024;
        }
        
        this.scene.add(light);
        this.lights.set(name, light);
        
        return light;
    }
    
    /**
     * 방향광 생성
     */
    createDirectionalLight(name, options) {
        const light = new THREE.DirectionalLight(
            options.color || 0xffffff,
            options.intensity || 1.0
        );
        
        if (options.position) {
            light.position.set(...options.position);
        }
        
        if (options.target) {
            light.target.position.set(...options.target);
            this.scene.add(light.target);
        }
        
        if (options.castShadow) {
            light.castShadow = true;
            light.shadow.mapSize.width = 2048;
            light.shadow.mapSize.height = 2048;
        }
        
        this.scene.add(light);
        this.lights.set(name, light);
        
        return light;
    }
    
    /**
     * 조명 그룹 생성
     */
    createLightGroup(groupName, lightNames) {
        this.lightGroups.set(groupName, lightNames);
    }
    
    /**
     * 조명 애니메이션 추가
     */
    addLightAnimation(lightName, animationType, options) {
        const light = this.lights.get(lightName);
        if (!light) return;
        
        light.userData = light.userData || {};
        light.userData.animation = {
            type: animationType,
            options: options,
            startTime: Date.now()
        };
    }
    
    /**
     * 업데이트
     */
    update(deltaTime) {
        this.lights.forEach((light, name) => {
            if (light.userData && light.userData.animation) {
                this.updateLightAnimation(light, deltaTime);
            }
        });
    }
    
    /**
     * 조명 애니메이션 업데이트
     */
    updateLightAnimation(light, deltaTime) {
        const anim = light.userData.animation;
        const elapsed = (Date.now() - anim.startTime) / 1000;
        
        switch (anim.type) {
            case 'pulse':
                const pulseIntensity = anim.options.baseIntensity || 1.0;
                const pulseAmount = anim.options.amount || 0.3;
                const pulseSpeed = anim.options.speed || 1.0;
                
                light.intensity = pulseIntensity + Math.sin(elapsed * pulseSpeed) * pulseAmount;
                break;
        }
    }
    
    /**
     * 조명 가져오기
     */
    getLight(name) {
        return this.lights.get(name) || null;
    }
}