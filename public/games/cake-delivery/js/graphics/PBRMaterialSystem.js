/**
 * PBR 재질 시스템
 * 물리 기반 렌더링 재질을 생성하고 관리합니다.
 */
class PBRMaterialSystem {
    constructor() {
        this.materials = new Map();
        this.textures = new Map();
        
        console.log('✅ PBR 재질 시스템 초기화 완료');
    }
    
    /**
     * 케이크 재질 생성
     */
    createCakeMaterial(cakeType, variant = 0) {
        const materialName = `cake_${cakeType}_${variant}`;
        
        if (this.materials.has(materialName)) {
            return this.materials.get(materialName);
        }
        
        const cakeColors = {
            basic: 0xFFD7A0,
            strawberry: 0xFF9AA2,
            chocolate: 0x6F4E37,
            wedding: 0xFFFFFF,
            ice: 0xA5F2F3,
            bomb: 0x333333
        };
        
        const material = new THREE.MeshStandardMaterial({
            color: cakeColors[cakeType] || cakeColors.basic,
            roughness: 0.3,
            metalness: 0.1,
            transparent: cakeType === 'ice',
            opacity: cakeType === 'ice' ? 0.8 : 1.0
        });
        
        this.materials.set(materialName, material);
        return material;
    }
    
    /**
     * 환경 재질 생성
     */
    createEnvironmentMaterial(type, options = {}) {
        const materialName = `env_${type}`;
        
        if (this.materials.has(materialName)) {
            return this.materials.get(materialName);
        }
        
        const material = new THREE.MeshStandardMaterial({
            color: options.color || 0x888888,
            roughness: options.roughness || 0.5,
            metalness: options.metalness || 0.0
        });
        
        this.materials.set(materialName, material);
        return material;
    }
    
    /**
     * 재질 가져오기
     */
    getMaterial(name) {
        return this.materials.get(name) || null;
    }
}