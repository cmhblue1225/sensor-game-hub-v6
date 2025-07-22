/**
 * GLB 모델 관리자
 * GLB 모델 로드, 캐싱, 애니메이션 관리
 */
class GLBModelManager {
    constructor() {
        this.loader = new THREE.GLTFLoader();
        this.models = new Map();
        this.animations = new Map();
        this.mixers = new Map();
        this.loadingPromises = new Map();
    }
    
    /**
     * GLB 모델 로드
     * @param {string} path - 모델 파일 경로
     * @param {string} name - 모델 이름
     * @returns {Promise<THREE.Group>}
     */
    async loadModel(path, name) {
        // 이미 로딩 중인 경우 기존 Promise 반환
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }
        
        // 이미 로드된 경우 캐시된 모델 반환
        if (this.models.has(name)) {
            return this.models.get(name);
        }
        
        const loadingPromise = new Promise((resolve, reject) => {
            console.log(`📦 GLB 모델 로드 시작: ${name} (${path})`);
            
            this.loader.load(
                path,
                (gltf) => {
                    try {
                        const model = gltf.scene;
                        
                        // 모델 최적화
                        this.optimizeModel(model);
                        
                        // 모델 캐싱
                        this.models.set(name, model);
                        
                        // 애니메이션 처리
                        if (gltf.animations && gltf.animations.length > 0) {
                            this.processAnimations(name, model, gltf.animations);
                        }
                        
                        console.log(`✅ GLB 모델 로드 완료: ${name}`);
                        resolve(model);
                        
                    } catch (error) {
                        console.error(`❌ GLB 모델 처리 실패: ${name}`, error);
                        reject(error);
                    }
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    console.log(`📊 ${name} 로딩 진행률: ${percent.toFixed(1)}%`);
                },
                (error) => {
                    console.error(`❌ GLB 모델 로드 실패: ${name}`, error);
                    reject(error);
                }
            );
        });
        
        this.loadingPromises.set(name, loadingPromise);
        
        try {
            const result = await loadingPromise;
            this.loadingPromises.delete(name);
            return result;
        } catch (error) {
            this.loadingPromises.delete(name);
            throw error;
        }
    }
    
    /**
     * 모델 최적화
     * @param {THREE.Group} model - 최적화할 모델
     */
    optimizeModel(model) {
        model.traverse((child) => {
            if (child.isMesh) {
                // 그림자 설정
                child.castShadow = true;
                child.receiveShadow = true;
                
                // 재질 최적화
                if (child.material) {
                    // 텍스처 압축 설정
                    if (child.material.map) {
                        child.material.map.generateMipmaps = true;
                        child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                        child.material.map.magFilter = THREE.LinearFilter;
                    }
                    
                    // 재질 설정 최적화
                    child.material.needsUpdate = true;
                }
                
                // 지오메트리 최적화
                if (child.geometry) {
                    child.geometry.computeBoundingBox();
                    child.geometry.computeBoundingSphere();
                }
            }
        });
    }
    
    /**
     * 애니메이션 처리
     * @param {string} modelName - 모델 이름
     * @param {THREE.Group} model - 모델 오브젝트
     * @param {Array} animations - 애니메이션 배열
     */
    processAnimations(modelName, model, animations) {
        const mixer = new THREE.AnimationMixer(model);
        const animationActions = new Map();
        
        animations.forEach((clip, index) => {
            const action = mixer.clipAction(clip);
            const animationName = clip.name || `animation_${index}`;
            animationActions.set(animationName, action);
            
            console.log(`🎬 애니메이션 등록: ${modelName}.${animationName}`);
        });
        
        this.mixers.set(modelName, mixer);
        this.animations.set(modelName, animationActions);
    }
    
    /**
     * 캐시된 모델 반환
     * @param {string} name - 모델 이름
     * @returns {THREE.Group|null}
     */
    getModel(name) {
        const model = this.models.get(name);
        if (model) {
            // 복사본 반환 (원본 보호)
            return model.clone();
        }
        
        console.warn(`⚠️ 모델을 찾을 수 없음: ${name}`);
        return null;
    }
    
    /**
     * 애니메이션 믹서 반환
     * @param {string} modelName - 모델 이름
     * @returns {THREE.AnimationMixer|null}
     */
    getMixer(modelName) {
        return this.mixers.get(modelName) || null;
    }
    
    /**
     * 애니메이션 액션 반환
     * @param {string} modelName - 모델 이름
     * @param {string} animationName - 애니메이션 이름
     * @returns {THREE.AnimationAction|null}
     */
    getAnimation(modelName, animationName) {
        const animations = this.animations.get(modelName);
        if (animations) {
            return animations.get(animationName) || null;
        }
        return null;
    }
    
    /**
     * 애니메이션 재생
     * @param {string} modelName - 모델 이름
     * @param {string} animationName - 애니메이션 이름
     * @param {number} fadeTime - 페이드 시간 (초)
     * @returns {boolean} 성공 여부
     */
    playAnimation(modelName, animationName, fadeTime = 0.5) {
        const animation = this.getAnimation(modelName, animationName);
        if (animation) {
            // 기존 애니메이션 페이드아웃
            const animations = this.animations.get(modelName);
            if (animations) {
                animations.forEach((action, name) => {
                    if (name !== animationName && action.isRunning()) {
                        action.fadeOut(fadeTime);
                    }
                });
            }
            
            // 새 애니메이션 페이드인
            animation.reset();
            animation.fadeIn(fadeTime);
            animation.play();
            
            console.log(`▶️ 애니메이션 재생: ${modelName}.${animationName}`);
            return true;
        }
        
        console.warn(`⚠️ 애니메이션을 찾을 수 없음: ${modelName}.${animationName}`);
        return false;
    }
    
    /**
     * 애니메이션 정지
     * @param {string} modelName - 모델 이름
     * @param {string} animationName - 애니메이션 이름 (생략 시 모든 애니메이션 정지)
     */
    stopAnimation(modelName, animationName = null) {
        if (animationName) {
            const animation = this.getAnimation(modelName, animationName);
            if (animation) {
                animation.stop();
                console.log(`⏹️ 애니메이션 정지: ${modelName}.${animationName}`);
            }
        } else {
            const animations = this.animations.get(modelName);
            if (animations) {
                animations.forEach((action, name) => {
                    action.stop();
                });
                console.log(`⏹️ 모든 애니메이션 정지: ${modelName}`);
            }
        }
    }
    
    /**
     * 애니메이션 믹서 업데이트
     * @param {number} deltaTime - 델타 시간
     */
    updateAnimations(deltaTime) {
        this.mixers.forEach((mixer, modelName) => {
            mixer.update(deltaTime);
        });
    }
    
    /**
     * 모델 제거
     * @param {string} name - 모델 이름
     */
    removeModel(name) {
        // 애니메이션 정리
        this.stopAnimation(name);
        this.mixers.delete(name);
        this.animations.delete(name);
        
        // 모델 정리
        const model = this.models.get(name);
        if (model) {
            model.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            
            this.models.delete(name);
            console.log(`🗑️ 모델 제거: ${name}`);
        }
    }
    
    /**
     * 모든 모델 정리
     */
    cleanup() {
        console.log('🧹 GLB 모델 관리자 정리 시작...');
        
        // 모든 모델 제거
        const modelNames = Array.from(this.models.keys());
        modelNames.forEach(name => this.removeModel(name));
        
        // 로딩 Promise 정리
        this.loadingPromises.clear();
        
        console.log('✅ GLB 모델 관리자 정리 완료');
    }
    
    /**
     * 로드된 모델 목록 반환
     * @returns {Array<string>}
     */
    getLoadedModels() {
        return Array.from(this.models.keys());
    }
    
    /**
     * 모델 로딩 상태 확인
     * @param {string} name - 모델 이름
     * @returns {string} 'loaded', 'loading', 'not_found'
     */
    getModelStatus(name) {
        if (this.models.has(name)) {
            return 'loaded';
        } else if (this.loadingPromises.has(name)) {
            return 'loading';
        } else {
            return 'not_found';
        }
    }
    
    /**
     * 메모리 사용량 정보 반환
     * @returns {Object}
     */
    getMemoryInfo() {
        let totalVertices = 0;
        let totalTriangles = 0;
        let totalTextures = 0;
        
        this.models.forEach((model, name) => {
            model.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    const positions = child.geometry.attributes.position;
                    if (positions) {
                        totalVertices += positions.count;
                        totalTriangles += positions.count / 3;
                    }
                }
                
                if (child.material && child.material.map) {
                    totalTextures++;
                }
            });
        });
        
        return {
            modelCount: this.models.size,
            totalVertices,
            totalTriangles,
            totalTextures,
            animationCount: this.animations.size
        };
    }
}