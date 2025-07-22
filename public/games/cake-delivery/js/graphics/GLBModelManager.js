/**
 * GLB 모델 관리자
 * 3D 모델 로딩 및 관리를 담당합니다.
 */
class GLBModelManager {
    constructor() {
        this.models = new Map();
        this.loader = null;
        this.loadingPromises = new Map();
        
        // GLTFLoader가 사용 가능한지 확인
        if (typeof THREE !== 'undefined' && THREE.GLTFLoader) {
            this.loader = new THREE.GLTFLoader();
            console.log('✅ GLB 모델 관리자 초기화 완료 (GLTFLoader 사용 가능)');
        } else {
            console.warn('⚠️ GLTFLoader를 사용할 수 없습니다. 기본 모델을 사용합니다.');
        }
    }
    
    /**
     * 모델 로드
     */
    async loadModel(path, name) {
        if (this.models.has(name)) {
            return this.models.get(name);
        }
        
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }
        
        // GLTFLoader가 없는 경우 기본 모델 생성
        if (!this.loader) {
            console.warn(`⚠️ GLTFLoader가 없어 기본 모델을 생성합니다: ${name}`);
            const defaultModel = this.createDefaultModel(name);
            this.models.set(name, defaultModel);
            return Promise.resolve(defaultModel);
        }
        
        const loadPromise = new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    this.models.set(name, gltf.scene);
                    console.log(`✅ 모델 로드 완료: ${name}`);
                    resolve(gltf.scene);
                },
                (progress) => {
                    // 로딩 진행률
                },
                (error) => {
                    console.error(`❌ 모델 로드 실패: ${name}`, error);
                    // 로드 실패 시 기본 모델 생성
                    const defaultModel = this.createDefaultModel(name);
                    this.models.set(name, defaultModel);
                    resolve(defaultModel);
                }
            );
        });
        
        this.loadingPromises.set(name, loadPromise);
        return loadPromise;
    }
    
    /**
     * 기본 모델 생성
     */
    createDefaultModel(name) {
        const group = new THREE.Group();
        group.name = name;
        
        // 기본 큐브 모델 생성
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const mesh = new THREE.Mesh(geometry, material);
        
        group.add(mesh);
        
        console.log(`📦 기본 모델 생성: ${name}`);
        return group;
    }
    
    /**
     * 모델 가져오기
     */
    getModel(name) {
        return this.models.get(name) || null;
    }
    
    /**
     * 모델 제거
     */
    removeModel(name) {
        this.models.delete(name);
        this.loadingPromises.delete(name);
    }
}