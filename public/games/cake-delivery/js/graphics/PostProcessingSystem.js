/**
 * 포스트 프로세싱 시스템
 * 카메라 흔들림, 블룸, 모션 블러 등 고급 시각 효과를 제공합니다.
 */
class PostProcessingSystem {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        
        // 포스트 프로세싱 컴포저
        this.composer = null;
        this.renderTarget = null;
        
        // 효과들
        this.effects = new Map();
        this.activeEffects = new Set();
        
        // 카메라 효과
        this.cameraShake = {
            intensity: 0,
            decay: 0.95,
            frequency: 10,
            offset: new THREE.Vector3()
        };
        
        // 성능 설정
        this.quality = 'medium'; // low, medium, high
        this.enabled = true;
        
        this.init();
    }
    
    /**
     * 포스트 프로세싱 시스템 초기화
     */
    init() {
        this.checkWebGLSupport();
        this.setupRenderTargets();
        this.initializeEffects();
        this.setupComposer();
        
        console.log('✅ 포스트 프로세싱 시스템 초기화 완료');
    }
    
    /**
     * WebGL 지원 확인
     */
    checkWebGLSupport() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            console.warn('⚠️ WebGL을 지원하지 않습니다. 포스트 프로세싱이 비활성화됩니다.');
            this.enabled = false;
            return;
        }
        
        // 필요한 확장 기능 확인
        const extensions = [
            'OES_texture_float',
            'OES_texture_half_float',
            'WEBGL_depth_texture'
        ];
        
        extensions.forEach(ext => {
            if (!gl.getExtension(ext)) {
                console.warn(`⚠️ ${ext} 확장을 지원하지 않습니다.`);
            }
        });
    }
    
    /**
     * 렌더 타겟 설정
     */
    setupRenderTargets() {
        if (!this.enabled) return;
        
        const size = this.renderer.getSize(new THREE.Vector2());
        
        // 메인 렌더 타겟
        this.renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            stencilBuffer: false,
            depthBuffer: true
        });
        
        // 품질에 따른 해상도 조정
        const qualityScale = {
            low: 0.5,
            medium: 0.75,
            high: 1.0
        }[this.quality] || 0.75;
        
        this.renderTarget.setSize(size.x * qualityScale, size.y * qualityScale);
    }
    
    /**
     * 효과 초기화
     */
    initializeEffects() {
        if (!this.enabled) return;
        
        // 블룸 효과
        this.effects.set('bloom', {
            name: 'bloom',
            enabled: true,
            uniforms: {
                threshold: { value: 0.8 },
                strength: { value: 0.3 },
                radius: { value: 0.5 }
            },
            fragmentShader: this.createBloomShader()
        });
        
        // 모션 블러 효과
        this.effects.set('motionBlur', {
            name: 'motionBlur',
            enabled: false,
            uniforms: {
                intensity: { value: 0.5 },
                samples: { value: 16 }
            },
            fragmentShader: this.createMotionBlurShader()
        });
        
        // 색상 보정 효과
        this.effects.set('colorCorrection', {
            name: 'colorCorrection',
            enabled: true,
            uniforms: {
                brightness: { value: 0.0 },
                contrast: { value: 1.0 },
                saturation: { value: 1.0 },
                hue: { value: 0.0 }
            },
            fragmentShader: this.createColorCorrectionShader()
        });
        
        // 비네팅 효과
        this.effects.set('vignette', {
            name: 'vignette',
            enabled: true,
            uniforms: {
                intensity: { value: 0.3 },
                smoothness: { value: 0.5 }
            },
            fragmentShader: this.createVignetteShader()
        });
        
        // FXAA (안티앨리어싱)
        this.effects.set('fxaa', {
            name: 'fxaa',
            enabled: true,
            uniforms: {
                resolution: { value: new THREE.Vector2(1/window.innerWidth, 1/window.innerHeight) }
            },
            fragmentShader: this.createFXAAShader()
        });
    }    
/**
     * 컴포저 설정
     */
    setupComposer() {
        if (!this.enabled) return;
        
        // 기본 렌더 패스
        const renderPass = {
            type: 'render',
            scene: this.scene,
            camera: this.camera,
            renderTarget: this.renderTarget
        };
        
        // 효과 패스들 생성
        this.composer = {
            passes: [renderPass],
            finalTarget: null
        };
        
        // 활성화된 효과들을 패스로 추가
        for (const [name, effect] of this.effects) {
            if (effect.enabled) {
                this.addEffectPass(effect);
            }
        }
    }
    
    /**
     * 효과 패스 추가
     */
    addEffectPass(effect) {
        const pass = {
            type: 'effect',
            name: effect.name,
            material: this.createEffectMaterial(effect),
            renderTarget: new THREE.WebGLRenderTarget(
                this.renderTarget.width,
                this.renderTarget.height,
                this.renderTarget.texture.format
            )
        };
        
        this.composer.passes.push(pass);
    }
    
    /**
     * 효과 재질 생성
     */
    createEffectMaterial(effect) {
        return new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                ...effect.uniforms
            },
            vertexShader: this.getVertexShader(),
            fragmentShader: effect.fragmentShader
        });
    }
    
    /**
     * 기본 버텍스 셰이더
     */
    getVertexShader() {
        return `
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }
    
    /**
     * 블룸 셰이더 생성
     */
    createBloomShader() {
        return `
            uniform sampler2D tDiffuse;
            uniform float threshold;
            uniform float strength;
            uniform float radius;
            
            varying vec2 vUv;
            
            void main() {
                vec4 color = texture2D(tDiffuse, vUv);
                
                // 밝기 임계값 적용
                float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                float contribution = max(0.0, brightness - threshold);
                contribution /= max(brightness, 0.001);
                
                // 블룸 효과 적용
                vec3 bloom = color.rgb * contribution * strength;
                
                // 가우시안 블러 근사
                vec2 texelSize = 1.0 / textureSize(tDiffuse, 0);
                vec3 blurred = vec3(0.0);
                float totalWeight = 0.0;
                
                for (int x = -2; x <= 2; x++) {
                    for (int y = -2; y <= 2; y++) {
                        vec2 offset = vec2(float(x), float(y)) * texelSize * radius;
                        float weight = exp(-0.5 * (float(x*x + y*y)) / (radius * radius));
                        blurred += texture2D(tDiffuse, vUv + offset).rgb * weight;
                        totalWeight += weight;
                    }
                }
                
                blurred /= totalWeight;
                
                gl_FragColor = vec4(color.rgb + bloom * blurred, color.a);
            }
        `;
    }
    
    /**
     * 모션 블러 셰이더 생성
     */
    createMotionBlurShader() {
        return `
            uniform sampler2D tDiffuse;
            uniform float intensity;
            uniform int samples;
            
            varying vec2 vUv;
            
            void main() {
                vec4 color = vec4(0.0);
                vec2 velocity = vec2(intensity * 0.01, 0.0); // 간단한 수평 모션 블러
                
                for (int i = 0; i < 16; i++) {
                    if (i >= samples) break;
                    
                    float t = float(i) / float(samples - 1);
                    vec2 offset = velocity * (t - 0.5);
                    color += texture2D(tDiffuse, vUv + offset);
                }
                
                color /= float(samples);
                gl_FragColor = color;
            }
        `;
    }
    
    /**
     * 색상 보정 셰이더 생성
     */
    createColorCorrectionShader() {
        return `
            uniform sampler2D tDiffuse;
            uniform float brightness;
            uniform float contrast;
            uniform float saturation;
            uniform float hue;
            
            varying vec2 vUv;
            
            vec3 rgb2hsv(vec3 c) {
                vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
                vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
                vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
                
                float d = q.x - min(q.w, q.y);
                float e = 1.0e-10;
                return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
            }
            
            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }
            
            void main() {
                vec4 color = texture2D(tDiffuse, vUv);
                
                // 밝기 조정
                color.rgb += brightness;
                
                // 대비 조정
                color.rgb = (color.rgb - 0.5) * contrast + 0.5;
                
                // 채도 및 색조 조정
                vec3 hsv = rgb2hsv(color.rgb);
                hsv.x += hue;
                hsv.y *= saturation;
                color.rgb = hsv2rgb(hsv);
                
                gl_FragColor = color;
            }
        `;
    }    /**

     * 비네팅 셰이더 생성
     */
    createVignetteShader() {
        return `
            uniform sampler2D tDiffuse;
            uniform float intensity;
            uniform float smoothness;
            
            varying vec2 vUv;
            
            void main() {
                vec4 color = texture2D(tDiffuse, vUv);
                
                // 중심에서의 거리 계산
                vec2 center = vec2(0.5, 0.5);
                float distance = length(vUv - center);
                
                // 비네팅 마스크 생성
                float vignette = smoothstep(intensity, intensity - smoothness, distance);
                
                color.rgb *= vignette;
                gl_FragColor = color;
            }
        `;
    }
    
    /**
     * FXAA 셰이더 생성
     */
    createFXAAShader() {
        return `
            uniform sampler2D tDiffuse;
            uniform vec2 resolution;
            
            varying vec2 vUv;
            
            void main() {
                vec2 texelSize = resolution;
                
                // 주변 픽셀 샘플링
                vec3 rgbNW = texture2D(tDiffuse, vUv + vec2(-1.0, -1.0) * texelSize).rgb;
                vec3 rgbNE = texture2D(tDiffuse, vUv + vec2(1.0, -1.0) * texelSize).rgb;
                vec3 rgbSW = texture2D(tDiffuse, vUv + vec2(-1.0, 1.0) * texelSize).rgb;
                vec3 rgbSE = texture2D(tDiffuse, vUv + vec2(1.0, 1.0) * texelSize).rgb;
                vec3 rgbM = texture2D(tDiffuse, vUv).rgb;
                
                // 루마 계산
                float lumaNW = dot(rgbNW, vec3(0.299, 0.587, 0.114));
                float lumaNE = dot(rgbNE, vec3(0.299, 0.587, 0.114));
                float lumaSW = dot(rgbSW, vec3(0.299, 0.587, 0.114));
                float lumaSE = dot(rgbSE, vec3(0.299, 0.587, 0.114));
                float lumaM = dot(rgbM, vec3(0.299, 0.587, 0.114));
                
                float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
                float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
                
                // 에지 감지
                float lumaRange = lumaMax - lumaMin;
                
                if (lumaRange < max(0.0312, lumaMax * 0.125)) {
                    gl_FragColor = vec4(rgbM, 1.0);
                    return;
                }
                
                // 방향 계산
                float lumaL = dot(texture2D(tDiffuse, vUv + vec2(-1.0, 0.0) * texelSize).rgb, vec3(0.299, 0.587, 0.114));
                float lumaR = dot(texture2D(tDiffuse, vUv + vec2(1.0, 0.0) * texelSize).rgb, vec3(0.299, 0.587, 0.114));
                float lumaU = dot(texture2D(tDiffuse, vUv + vec2(0.0, -1.0) * texelSize).rgb, vec3(0.299, 0.587, 0.114));
                float lumaD = dot(texture2D(tDiffuse, vUv + vec2(0.0, 1.0) * texelSize).rgb, vec3(0.299, 0.587, 0.114));
                
                float lumaSum = lumaL + lumaR + lumaU + lumaD;
                float edgeHorz = abs(-2.0 * lumaL + lumaSum) + abs(-2.0 * lumaM + lumaSum) * 2.0 + abs(-2.0 * lumaR + lumaSum);
                float edgeVert = abs(-2.0 * lumaU + lumaSum) + abs(-2.0 * lumaM + lumaSum) * 2.0 + abs(-2.0 * lumaD + lumaSum);
                
                bool horzSpan = edgeHorz >= edgeVert;
                
                // 안티앨리어싱 적용
                vec2 offset = horzSpan ? vec2(0.0, texelSize.y) : vec2(texelSize.x, 0.0);
                vec3 rgbA = 0.5 * (texture2D(tDiffuse, vUv - offset).rgb + texture2D(tDiffuse, vUv + offset).rgb);
                
                gl_FragColor = vec4(rgbA, 1.0);
            }
        `;
    }
    
    /**
     * 카메라 흔들림 시작
     */
    startCameraShake(intensity = 1.0, duration = 1000) {
        this.cameraShake.intensity = intensity;
        this.cameraShake.decay = Math.pow(0.01, 1.0 / (duration / 16.67)); // 60fps 기준
        
        console.log(`📹 카메라 흔들림 시작: 강도 ${intensity}, 지속시간 ${duration}ms`);
    }
    
    /**
     * 카메라 흔들림 업데이트
     */
    updateCameraShake(deltaTime) {
        if (this.cameraShake.intensity <= 0.01) {
            this.cameraShake.intensity = 0;
            return;
        }
        
        // 랜덤 오프셋 생성
        const time = Date.now() * 0.01;
        this.cameraShake.offset.x = Math.sin(time * this.cameraShake.frequency) * this.cameraShake.intensity;
        this.cameraShake.offset.y = Math.cos(time * this.cameraShake.frequency * 1.1) * this.cameraShake.intensity;
        this.cameraShake.offset.z = Math.sin(time * this.cameraShake.frequency * 0.9) * this.cameraShake.intensity * 0.5;
        
        // 카메라 위치에 오프셋 적용
        this.camera.position.add(this.cameraShake.offset);
        
        // 강도 감소
        this.cameraShake.intensity *= this.cameraShake.decay;
    }
    
    /**
     * 효과 활성화/비활성화
     */
    setEffectEnabled(effectName, enabled) {
        const effect = this.effects.get(effectName);
        if (effect) {
            effect.enabled = enabled;
            
            if (enabled) {
                this.activeEffects.add(effectName);
            } else {
                this.activeEffects.delete(effectName);
            }
            
            // 컴포저 재구성
            this.setupComposer();
            
            console.log(`🎨 효과 ${effectName}: ${enabled ? '활성화' : '비활성화'}`);
        }
    }
    
    /**
     * 효과 파라미터 설정
     */
    setEffectParameter(effectName, paramName, value) {
        const effect = this.effects.get(effectName);
        if (effect && effect.uniforms[paramName]) {
            effect.uniforms[paramName].value = value;
            console.log(`⚙️ ${effectName}.${paramName} = ${value}`);
        }
    }
    
    /**
     * 품질 설정
     */
    setQuality(quality) {
        this.quality = quality;
        this.setupRenderTargets();
        this.setupComposer();
        
        console.log(`🎨 포스트 프로세싱 품질: ${quality}`);
    }
    
    /**
     * 렌더링
     */
    render() {
        if (!this.enabled || !this.composer) {
            // 포스트 프로세싱 비활성화 시 기본 렌더링
            this.renderer.render(this.scene, this.camera);
            return;
        }
        
        let currentTarget = null;
        
        // 각 패스 실행
        for (let i = 0; i < this.composer.passes.length; i++) {
            const pass = this.composer.passes[i];
            const isLastPass = i === this.composer.passes.length - 1;
            
            if (pass.type === 'render') {
                // 렌더 패스
                this.renderer.setRenderTarget(pass.renderTarget);
                this.renderer.render(pass.scene, pass.camera);
                currentTarget = pass.renderTarget;
            } else if (pass.type === 'effect') {
                // 효과 패스
                pass.material.uniforms.tDiffuse.value = currentTarget.texture;
                
                if (isLastPass) {
                    // 마지막 패스는 화면에 직접 렌더링
                    this.renderer.setRenderTarget(null);
                } else {
                    this.renderer.setRenderTarget(pass.renderTarget);
                }
                
                this.renderFullscreenQuad(pass.material);
                currentTarget = pass.renderTarget;
            }
        }
    }
    
    /**
     * 전체화면 쿼드 렌더링
     */
    renderFullscreenQuad(material) {
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        scene.add(mesh);
        this.renderer.render(scene, camera);
        
        // 정리
        geometry.dispose();
    }    /**

     * 업데이트
     */
    update(deltaTime) {
        this.updateCameraShake(deltaTime);
        
        // 동적 효과 파라미터 업데이트
        this.updateDynamicEffects(deltaTime);
    }
    
    /**
     * 동적 효과 업데이트
     */
    updateDynamicEffects(deltaTime) {
        // 시간 기반 효과들 업데이트
        const time = Date.now() * 0.001;
        
        // 블룸 강도 변화 (게임 상황에 따라)
        const bloomEffect = this.effects.get('bloom');
        if (bloomEffect && bloomEffect.enabled) {
            // 예: 성공 시 블룸 강화
            const baseStrength = 0.3;
            const variation = Math.sin(time * 2) * 0.1;
            bloomEffect.uniforms.strength.value = baseStrength + variation;
        }
        
        // 비네팅 강도 변화
        const vignetteEffect = this.effects.get('vignette');
        if (vignetteEffect && vignetteEffect.enabled) {
            // 예: 위험 상황에서 비네팅 강화
            const baseIntensity = 0.3;
            vignetteEffect.uniforms.intensity.value = baseIntensity;
        }
    }
    
    /**
     * 화면 효과 프리셋
     */
    applyPreset(presetName) {
        switch (presetName) {
            case 'normal':
                this.setEffectEnabled('bloom', true);
                this.setEffectParameter('bloom', 'strength', 0.3);
                this.setEffectEnabled('vignette', true);
                this.setEffectParameter('vignette', 'intensity', 0.3);
                this.setEffectEnabled('colorCorrection', true);
                this.setEffectParameter('colorCorrection', 'brightness', 0.0);
                this.setEffectParameter('colorCorrection', 'contrast', 1.0);
                break;
                
            case 'dramatic':
                this.setEffectEnabled('bloom', true);
                this.setEffectParameter('bloom', 'strength', 0.6);
                this.setEffectEnabled('vignette', true);
                this.setEffectParameter('vignette', 'intensity', 0.5);
                this.setEffectEnabled('colorCorrection', true);
                this.setEffectParameter('colorCorrection', 'contrast', 1.2);
                break;
                
            case 'soft':
                this.setEffectEnabled('bloom', true);
                this.setEffectParameter('bloom', 'strength', 0.2);
                this.setEffectEnabled('vignette', false);
                this.setEffectEnabled('colorCorrection', true);
                this.setEffectParameter('colorCorrection', 'brightness', 0.1);
                this.setEffectParameter('colorCorrection', 'saturation', 0.8);
                break;
                
            case 'retro':
                this.setEffectEnabled('bloom', false);
                this.setEffectEnabled('vignette', true);
                this.setEffectParameter('vignette', 'intensity', 0.6);
                this.setEffectEnabled('colorCorrection', true);
                this.setEffectParameter('colorCorrection', 'saturation', 1.3);
                this.setEffectParameter('colorCorrection', 'hue', 0.1);
                break;
        }
        
        console.log(`🎨 프리셋 적용: ${presetName}`);
    }
    
    /**
     * 게임 이벤트에 따른 효과
     */
    onGameEvent(eventType, data = {}) {
        switch (eventType) {
            case 'success':
                this.startCameraShake(0.3, 500);
                this.setEffectParameter('bloom', 'strength', 0.8);
                this.setEffectParameter('colorCorrection', 'brightness', 0.2);
                
                // 2초 후 원래대로
                setTimeout(() => {
                    this.setEffectParameter('bloom', 'strength', 0.3);
                    this.setEffectParameter('colorCorrection', 'brightness', 0.0);
                }, 2000);
                break;
                
            case 'failure':
                this.startCameraShake(0.8, 1000);
                this.setEffectParameter('vignette', 'intensity', 0.7);
                this.setEffectParameter('colorCorrection', 'saturation', 0.3);
                
                // 3초 후 원래대로
                setTimeout(() => {
                    this.setEffectParameter('vignette', 'intensity', 0.3);
                    this.setEffectParameter('colorCorrection', 'saturation', 1.0);
                }, 3000);
                break;
                
            case 'warning':
                this.startCameraShake(0.2, 300);
                this.setEffectParameter('colorCorrection', 'hue', 0.1);
                
                setTimeout(() => {
                    this.setEffectParameter('colorCorrection', 'hue', 0.0);
                }, 1000);
                break;
                
            case 'levelComplete':
                this.startCameraShake(0.5, 800);
                this.setEffectParameter('bloom', 'strength', 1.0);
                this.setEffectParameter('colorCorrection', 'brightness', 0.3);
                this.setEffectParameter('colorCorrection', 'saturation', 1.2);
                
                setTimeout(() => {
                    this.setEffectParameter('bloom', 'strength', 0.3);
                    this.setEffectParameter('colorCorrection', 'brightness', 0.0);
                    this.setEffectParameter('colorCorrection', 'saturation', 1.0);
                }, 4000);
                break;
        }
    }
    
    /**
     * 화면 크기 변경 처리
     */
    onResize(width, height) {
        if (!this.enabled) return;
        
        // 렌더 타겟 크기 조정
        const qualityScale = {
            low: 0.5,
            medium: 0.75,
            high: 1.0
        }[this.quality] || 0.75;
        
        this.renderTarget.setSize(width * qualityScale, height * qualityScale);
        
        // FXAA 해상도 업데이트
        const fxaaEffect = this.effects.get('fxaa');
        if (fxaaEffect) {
            fxaaEffect.uniforms.resolution.value.set(1/width, 1/height);
        }
        
        // 컴포저 재구성
        this.setupComposer();
        
        console.log(`📹 포스트 프로세싱 크기 조정: ${width}x${height}`);
    }
    
    /**
     * 정리
     */
    dispose() {
        console.log('🧹 포스트 프로세싱 시스템 정리 시작...');
        
        // 렌더 타겟 정리
        if (this.renderTarget) {
            this.renderTarget.dispose();
        }
        
        // 효과 재질들 정리
        for (const effect of this.effects.values()) {
            if (effect.material) {
                effect.material.dispose();
            }
        }
        
        // 컴포저 패스들 정리
        if (this.composer) {
            this.composer.passes.forEach(pass => {
                if (pass.renderTarget) {
                    pass.renderTarget.dispose();
                }
                if (pass.material) {
                    pass.material.dispose();
                }
            });
        }
        
        this.effects.clear();
        this.activeEffects.clear();
        
        console.log('✅ 포스트 프로세싱 시스템 정리 완료');
    }
}