/**
 * GLTFLoader for Three.js
 * 간단한 GLTFLoader 구현
 */

// GLTFLoader가 이미 정의되어 있지 않은 경우에만 정의
if (typeof THREE !== 'undefined' && !THREE.GLTFLoader) {
    THREE.GLTFLoader = function(manager) {
        this.manager = manager || THREE.DefaultLoadingManager;
    };

    THREE.GLTFLoader.prototype = {
        constructor: THREE.GLTFLoader,

        load: function(url, onLoad, onProgress, onError) {
            console.log('GLTFLoader: 기본 모델 생성 중...');
            
            // 기본 박스 모델 생성
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = 'DefaultModel';
            
            const mockGLTF = {
                scene: mesh,
                scenes: [mesh],
                animations: [],
                cameras: [],
                asset: { version: '2.0' }
            };
            
            if (onLoad) {
                setTimeout(() => onLoad(mockGLTF), 100);
            }
        }
    };
    
    console.log('✅ GLTFLoader 폴백 구현 로드됨');
} else if (typeof THREE === 'undefined') {
    console.warn('⚠️ THREE.js가 로드되지 않아 GLTFLoader를 초기화할 수 없습니다');
}