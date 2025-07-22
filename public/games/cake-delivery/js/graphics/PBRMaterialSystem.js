/**
 * PBR 재질 시스템
 * 물리 기반 렌더링(PBR) 재질을 생성하고 관리
 */
class PBRMaterialSystem {
    constructor() {
        // 재질 캐시
        this.materials = new Map();
        
        // 텍스처 로더
        this.textureLoader = new THREE.TextureLoader();
        
        // 큐브 텍스처 로더
        this.cubeTextureLoader = new THREE.CubeTextureLoader();
        
        // 환경 맵
        this.environmentMap = null;
        
        // 기본 텍스처들
        this.defaultTextures = {
            white: null,
            normal: null,
            roughness: null,
            metalness: null
        };
        
        // 재질 프리셋
        this.materialPresets = {
            cake: {
                basic: { color: 0xFFD7A0, roughness: 0.8, metalness: 0.0, emissive: 0x000000 },
                strawberry: { color: 0xFF9AA2, roughness: 0.7, metalness: 0.0, emissive: 0x000000 },
                chocolate: { color: 0x6F4E37, roughness: 0.9, metalness: 0.0, emissive: 0x000000 },
                wedding: { color: 0xFFFFFF, roughness: 0.3, metalness: 0.0, emissive: 0x000000 },
                ice: { color: 0xA5F2F3, roughness: 0.1, metalness: 0.2, emissive: 0x001122 },
                bomb: { color: 0x333333, roughness: 0.6, metalness: 0.8, emissive: 0x220000 }
            },
            environment: {
                ground: { color: 0x88AA88, roughness: 0.8, metalness: 0.1 },
                wall: { color: 0xCCCCCC, roughness: 0.6, metalness: 0.0 },
                metal: { color: 0x888888, roughness: 0.2, metalness: 0.9 },
                wood: { color: 0x8B4513, roughness: 0.7, metalness: 0.0 },
                glass: { color: 0xFFFFFF, roughness: 0.0, metalness: 0.0, transmission: 1.0 }
            },
            character: {
                skin: { color: 0xFFDBB3, roughness: 0.6, metalness: 0.0 },
                clothing: { color: 0x4169E1, roughness: 0.8, metalness: 0.0 },
                hair: { color: 0x8B4513, roughness: 0.9, metalness: 0.0 }
            }
        };
        
        // 초기화
        this.init();
        
        console.log('🎨 PBR 재질 시스템 초기화 완료');
    }
    
    /**
     * 초기화
     */
    async init() {
        try {
            // 기본 텍스처 생성
            await this.createDefaultTextures();
            
            // 환경 맵 로드
            await this.loadEnvironmentMap();
            
            console.log('✅ PBR 재질 시스템 초기화 완료');
        } catch (error) {
            console.error('❌ PBR 재질 시스템 초기화 실패:', error);
        }
    }
    
    /**
     * 기본 텍스처 생성
     */
    async createDefaultTextures() {
        // 흰색 텍스처
        const whiteCanvas = document.createElement('canvas');
        whiteCanvas.width = whiteCanvas.height = 1;
        const whiteCtx = whiteCanvas.getContext('2d');
        whiteCtx.fillStyle = '#ffffff';
        whiteCtx.fillRect(0, 0, 1, 1);
        this.defaultTextures.white = new THREE.CanvasTexture(whiteCanvas);
        
        // 기본 노멀 맵 (평평한 표면)
        const normalCanvas = document.createElement('canvas');
        normalCanvas.width = normalCanvas.height = 1;
        const normalCtx = normalCanvas.getContext('2d');
        normalCtx.fillStyle = '#8080ff'; // 기본 노멀 벡터 (0, 0, 1)
        normalCtx.fillRect(0, 0, 1, 1);
        this.defaultTextures.normal = new THREE.CanvasTexture(normalCanvas);
        
        // 기본 러프니스 맵
        const roughnessCanvas = document.createElement('canvas');
        roughnessCanvas.width = roughnessCanvas.height = 1;
        const roughnessCtx = roughnessCanvas.getContext('2d');
        roughnessCtx.fillStyle = '#808080'; // 중간 러프니스
        roughnessCtx.fillRect(0, 0, 1, 1);
        this.defaultTextures.roughness = new THREE.CanvasTexture(roughnessCanvas);
        
        // 기본 메탈니스 맵
        const metalnessCanvas = document.createElement('canvas');
        metalnessCanvas.width = metalnessCanvas.height = 1;
        const metalnessCtx = metalnessCanvas.getContext('2d');
        metalnessCtx.fillStyle = '#000000'; // 비금속
        metalnessCtx.fillRect(0, 0, 1, 1);
        this.defaultTextures.metalness = new THREE.CanvasTexture(metalnessCanvas);
    }
    
    /**
     * 환경 맵 로드
     */
    async loadEnvironmentMap() {
        try {
            // 간단한 환경 맵 생성 (실제 프로젝트에서는 HDRI 사용)
            const urls = [
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // px
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // nx
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // py
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // ny
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // pz
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='  // nz
            ];
            
            this.environmentMap = this.cubeTextureLoader.load(urls);
            this.environmentMap.format = THREE.RGBFormat;
            
        } catch (error) {
            console.warn('⚠️ 환경 맵 로드 실패, 기본값 사용:', error);
        }
    }
    
    /**
     * PBR 재질 생성
     * @param {string} name - 재질 이름
     * @param {Object} options - 재질 옵션
     * @returns {THREE.MeshStandardMaterial}
     */
    createMaterial(name, options = {}) {
        // 이미 생성된 재질이 있으면 반환
        if (this.materials.has(name)) {
            return this.materials.get(name);
        }
        
        const {
            color = 0xffffff,
            roughness = 0.5,
            metalness = 0.0,
            emissive = 0x000000,
            emissiveIntensity = 0.0,
            normalScale = 1.0,
            envMapIntensity = 1.0,
            transmission = 0.0,
            thickness = 0.0,
            ior = 1.5,
            clearcoat = 0.0,
            clearcoatRoughness = 0.0,
            sheen = 0.0,
            sheenRoughness = 1.0,
            sheenColor = 0x000000,
            specularIntensity = 1.0,
            specularColor = 0xffffff,
            map = null,
            normalMap = null,
            roughnessMap = null,
            metalnessMap = null,
            emissiveMap = null,
            aoMap = null,
            displacementMap = null,
            alphaMap = null,
            transparent = false,
            opacity = 1.0,
            side = THREE.FrontSide,
            flatShading = false,
            wireframe = false
        } = options;
        
        // PBR 재질 생성
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness,
            metalness,
            emissive: new THREE.Color(emissive),
            emissiveIntensity,
            envMap: this.environmentMap,
            envMapIntensity,
            map: map || this.defaultTextures.white,
            normalMap: normalMap || this.defaultTextures.normal,
            normalScale: new THREE.Vector2(normalScale, normalScale),
            roughnessMap: roughnessMap || this.defaultTextures.roughness,
            metalnessMap: metalnessMap || this.defaultTextures.metalness,
            emissiveMap,
            aoMap,
            displacementMap,
            alphaMap,
            transparent,
            opacity,
            side,
            flatShading,
            wireframe
        });
        
        // 고급 PBR 속성 (MeshPhysicalMaterial 사용 시)
        if (transmission > 0 || clearcoat > 0 || sheen > 0) {
            const physicalMaterial = new THREE.MeshPhysicalMaterial({
                ...material,
                transmission,
                thickness,
                ior,
                clearcoat,
                clearcoatRoughness,
                sheen,
                sheenRoughness,
                sheenColor: new THREE.Color(sheenColor),
                specularIntensity,
                specularColor: new THREE.Color(specularColor)
            });
            
            material.dispose();
            this.materials.set(name, physicalMaterial);
            
            console.log(`🎨 고급 PBR 재질 생성: ${name}`);
            return physicalMaterial;
        }
        
        // 재질 캐싱
        this.materials.set(name, material);
        
        console.log(`🎨 PBR 재질 생성: ${name}`);
        return material;
    }
    
    /**
     * 케이크 재질 생성
     * @param {string} cakeType - 케이크 타입
     * @param {number} variant - 변형 (0.0 ~ 1.0)
     * @returns {THREE.Material}
     */
    createCakeMaterial(cakeType, variant = 0.0) {
        const materialName = `cake_${cakeType}_${variant.toFixed(1)}`;
        
        if (this.materials.has(materialName)) {
            return this.materials.get(materialName);
        }
        
        const preset = this.materialPresets.cake[cakeType];
        if (!preset) {
            console.warn(`⚠️ 알 수 없는 케이크 타입: ${cakeType}`);
            return this.createMaterial(materialName);
        }
        
        // 변형에 따른 색상 조정
        const baseColor = new THREE.Color(preset.color);
        const variantColor = baseColor.clone();
        
        // 변형에 따라 색상 조정
        if (variant > 0) {
            variantColor.lerp(new THREE.Color(0xffffff), variant * 0.3);
        }
        
        // 케이크 타입별 특별 처리
        let materialOptions = {
            color: variantColor.getHex(),
            roughness: preset.roughness,
            metalness: preset.metalness,
            emissive: preset.emissive,
            emissiveIntensity: 0.1
        };
        
        // 특별한 케이크 타입 처리
        switch (cakeType) {
            case 'ice':
                materialOptions = {
                    ...materialOptions,
                    transmission: 0.3,
                    thickness: 0.5,
                    ior: 1.33,
                    transparent: true,
                    opacity: 0.8
                };
                break;
                
            case 'wedding':
                materialOptions = {
                    ...materialOptions,
                    clearcoat: 0.5,
                    clearcoatRoughness: 0.1
                };
                break;
                
            case 'bomb':
                materialOptions = {
                    ...materialOptions,
                    emissiveIntensity: 0.3,
                    roughness: 0.4
                };
                break;
        }
        
        return this.createMaterial(materialName, materialOptions);
    }
    
    /**
     * 환경 재질 생성
     * @param {string} type - 환경 타입
     * @param {Object} options - 추가 옵션
     * @returns {THREE.Material}
     */
    createEnvironmentMaterial(type, options = {}) {
        const materialName = `env_${type}`;
        
        if (this.materials.has(materialName)) {
            return this.materials.get(materialName);
        }
        
        const preset = this.materialPresets.environment[type];
        if (!preset) {
            console.warn(`⚠️ 알 수 없는 환경 타입: ${type}`);
            return this.createMaterial(materialName);
        }
        
        const materialOptions = {
            ...preset,
            ...options
        };
        
        return this.createMaterial(materialName, materialOptions);
    }
    
    /**
     * 캐릭터 재질 생성
     * @param {string} part - 캐릭터 부위
     * @param {Object} options - 추가 옵션
     * @returns {THREE.Material}
     */
    createCharacterMaterial(part, options = {}) {
        const materialName = `character_${part}`;
        
        if (this.materials.has(materialName)) {
            return this.materials.get(materialName);
        }
        
        const preset = this.materialPresets.character[part];
        if (!preset) {
            console.warn(`⚠️ 알 수 없는 캐릭터 부위: ${part}`);
            return this.createMaterial(materialName);
        }
        
        const materialOptions = {
            ...preset,
            ...options
        };
        
        return this.createMaterial(materialName, materialOptions);
    }
    
    /**
     * 텍스처 로드
     * @param {string} url - 텍스처 URL
     * @param {Object} options - 텍스처 옵션
     * @returns {Promise<THREE.Texture>}
     */
    async loadTexture(url, options = {}) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    // 텍스처 설정 적용
                    const {
                        wrapS = THREE.RepeatWrapping,
                        wrapT = THREE.RepeatWrapping,
                        magFilter = THREE.LinearFilter,
                        minFilter = THREE.LinearMipmapLinearFilter,
                        anisotropy = 16,
                        flipY = true,
                        repeat = [1, 1],
                        offset = [0, 0]
                    } = options;
                    
                    texture.wrapS = wrapS;
                    texture.wrapT = wrapT;
                    texture.magFilter = magFilter;
                    texture.minFilter = minFilter;
                    texture.anisotropy = anisotropy;
                    texture.flipY = flipY;
                    texture.repeat.set(repeat[0], repeat[1]);
                    texture.offset.set(offset[0], offset[1]);
                    
                    resolve(texture);
                },
                undefined,
                reject
            );
        });
    }
    
    /**
     * 재질 업데이트
     * @param {string} name - 재질 이름
     * @param {Object} properties - 업데이트할 속성들
     */
    updateMaterial(name, properties) {
        const material = this.materials.get(name);
        if (!material) {
            console.warn(`⚠️ 재질을 찾을 수 없음: ${name}`);
            return;
        }
        
        Object.keys(properties).forEach(key => {
            if (key === 'color' || key === 'emissive') {
                material[key].setHex(properties[key]);
            } else {
                material[key] = properties[key];
            }
        });
        
        material.needsUpdate = true;
        console.log(`🔄 재질 업데이트: ${name}`);
    }
    
    /**
     * 재질 복제
     * @param {string} sourceName - 원본 재질 이름
     * @param {string} newName - 새 재질 이름
     * @param {Object} modifications - 수정할 속성들
     * @returns {THREE.Material}
     */
    cloneMaterial(sourceName, newName, modifications = {}) {
        const sourceMaterial = this.materials.get(sourceName);
        if (!sourceMaterial) {
            console.warn(`⚠️ 원본 재질을 찾을 수 없음: ${sourceName}`);
            return null;
        }
        
        const clonedMaterial = sourceMaterial.clone();
        
        // 수정사항 적용
        Object.keys(modifications).forEach(key => {
            if (key === 'color' || key === 'emissive') {
                clonedMaterial[key].setHex(modifications[key]);
            } else {
                clonedMaterial[key] = modifications[key];
            }
        });
        
        this.materials.set(newName, clonedMaterial);
        
        console.log(`📋 재질 복제: ${sourceName} → ${newName}`);
        return clonedMaterial;
    }
    
    /**
     * 재질 가져오기
     * @param {string} name - 재질 이름
     * @returns {THREE.Material|null}
     */
    getMaterial(name) {
        return this.materials.get(name) || null;
    }
    
    /**
     * 모든 재질 이름 반환
     * @returns {Array<string>}
     */
    getMaterialNames() {
        return Array.from(this.materials.keys());
    }
    
    /**
     * 재질 제거
     * @param {string} name - 재질 이름
     */
    removeMaterial(name) {
        const material = this.materials.get(name);
        if (material) {
            material.dispose();
            this.materials.delete(name);
            console.log(`🗑️ 재질 제거: ${name}`);
        }
    }
    
    /**
     * 환경 맵 설정
     * @param {THREE.CubeTexture} envMap - 환경 맵
     */
    setEnvironmentMap(envMap) {
        this.environmentMap = envMap;
        
        // 모든 재질에 환경 맵 적용
        this.materials.forEach((material, name) => {
            if (material.envMap !== undefined) {
                material.envMap = envMap;
                material.needsUpdate = true;
            }
        });
        
        console.log('🌍 환경 맵 업데이트 완료');
    }
    
    /**
     * 정리
     */
    cleanup() {
        console.log('🧹 PBR 재질 시스템 정리 시작...');
        
        // 모든 재질 정리
        this.materials.forEach((material, name) => {
            material.dispose();
        });
        this.materials.clear();
        
        // 기본 텍스처 정리
        Object.values(this.defaultTextures).forEach(texture => {
            if (texture) texture.dispose();
        });
        
        // 환경 맵 정리
        if (this.environmentMap) {
            this.environmentMap.dispose();
        }
        
        console.log('✅ PBR 재질 시스템 정리 완료');
    }
    
    /**
     * 디버그 정보 반환
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            materialCount: this.materials.size,
            materials: Array.from(this.materials.keys()),
            hasEnvironmentMap: !!this.environmentMap,
            defaultTexturesLoaded: Object.values(this.defaultTextures).every(t => t !== null)
        };
    }
}