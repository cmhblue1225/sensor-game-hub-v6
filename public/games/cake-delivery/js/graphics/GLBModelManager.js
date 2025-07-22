/**
 * GLB 모델 관리자
 * 3D 모델 로딩 및 관리를 담당합니다.
 */
class GLBModelManager {
    constructor() {
        this.models = new Map();
        this.loader = new THREE.GLTFLoader();
        this.loadingPromises = new Map();
        
        console.log('✅ GLB 모델 관리자 초기화 완료');
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
                    reject(error);
                }
            );
        });
        
        this.loadingPromises.set(name, loadPromise);
        return loadPromise;
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