/**
 * GLB 모델 분석 도구
 * GLB 파일의 구조, 애니메이션, 재질 등을 분석
 */
class GLBAnalyzer {
    constructor() {
        this.loader = new THREE.GLTFLoader();
        this.analysisResults = new Map();
    }
    
    /**
     * GLB 파일 분석
     * @param {string} path - GLB 파일 경로
     * @param {string} name - 모델 이름
     * @returns {Promise<Object>}
     */
    async analyzeGLB(path, name) {
        console.log(`🔍 GLB 모델 분석 시작: ${name} (${path})`);
        
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    const analysis = this.performDetailedAnalysis(gltf, name);
                    this.analysisResults.set(name, analysis);
                    
                    console.log(`✅ GLB 모델 분석 완료: ${name}`);
                    console.log('분석 결과:', analysis);
                    
                    resolve(analysis);
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    console.log(`📊 ${name} 로딩 진행률: ${percent.toFixed(1)}%`);
                },
                (error) => {
                    console.error(`❌ GLB 모델 분석 실패: ${name}`, error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * 상세 분석 수행
     * @param {Object} gltf - GLTF 객체
     * @param {string} name - 모델 이름
     * @returns {Object}
     */
    performDetailedAnalysis(gltf, name) {
        const analysis = {
            name: name,
            scene: this.analyzeScene(gltf.scene),
            animations: this.analyzeAnimations(gltf.animations),
            materials: this.analyzeMaterials(gltf.scene),
            textures: this.analyzeTextures(gltf.scene),
            geometry: this.analyzeGeometry(gltf.scene),
            bones: this.analyzeBones(gltf.scene),
            boundingBox: this.calculateBoundingBox(gltf.scene),
            fileInfo: this.analyzeFileInfo(gltf),
            recommendations: []
        };
        
        // 최적화 권장사항 생성
        analysis.recommendations = this.generateRecommendations(analysis);
        
        return analysis;
    }
    
    /**
     * 씬 분석
     * @param {THREE.Group} scene - 씬 객체
     * @returns {Object}
     */
    analyzeScene(scene) {
        const sceneInfo = {
            name: scene.name || 'Unnamed Scene',
            children: scene.children.length,
            objects: [],
            hierarchy: this.buildHierarchy(scene)
        };
        
        scene.traverse((child) => {
            if (child.isMesh) {
                sceneInfo.objects.push({
                    name: child.name || 'Unnamed Mesh',
                    type: 'Mesh',
                    geometry: child.geometry.constructor.name,
                    material: child.material ? child.material.constructor.name : 'None',
                    vertices: child.geometry.attributes.position ? child.geometry.attributes.position.count : 0,
                    triangles: child.geometry.index ? child.geometry.index.count / 3 : 0,
                    castShadow: child.castShadow,
                    receiveShadow: child.receiveShadow
                });
            } else if (child.isBone) {
                sceneInfo.objects.push({
                    name: child.name || 'Unnamed Bone',
                    type: 'Bone',
                    position: child.position.toArray(),
                    rotation: child.rotation.toArray(),
                    scale: child.scale.toArray()
                });
            } else if (child.isLight) {
                sceneInfo.objects.push({
                    name: child.name || 'Unnamed Light',
                    type: child.constructor.name,
                    intensity: child.intensity,
                    color: child.color.getHex()
                });
            }
        });
        
        return sceneInfo;
    }
    
    /**
     * 계층 구조 분석
     * @param {THREE.Object3D} object - 오브젝트
     * @param {number} depth - 깊이
     * @returns {Object}
     */
    buildHierarchy(object, depth = 0) {
        const hierarchy = {
            name: object.name || object.constructor.name,
            type: object.constructor.name,
            depth: depth,
            children: []
        };
        
        object.children.forEach(child => {
            hierarchy.children.push(this.buildHierarchy(child, depth + 1));
        });
        
        return hierarchy;
    }
    
    /**
     * 애니메이션 분석
     * @param {Array} animations - 애니메이션 배열
     * @returns {Object}
     */
    analyzeAnimations(animations) {
        const animationInfo = {
            count: animations ? animations.length : 0,
            animations: []
        };
        
        if (animations) {
            animations.forEach((clip, index) => {
                const tracks = clip.tracks.map(track => ({
                    name: track.name,
                    type: track.constructor.name,
                    times: track.times.length,
                    values: track.values.length,
                    interpolation: track.getInterpolation()
                }));
                
                animationInfo.animations.push({
                    name: clip.name || `Animation_${index}`,
                    duration: clip.duration,
                    tracks: tracks,
                    trackCount: clip.tracks.length,
                    blendMode: clip.blendMode
                });
            });
        }
        
        return animationInfo;
    }
    
    /**
     * 재질 분석
     * @param {THREE.Group} scene - 씬 객체
     * @returns {Object}
     */
    analyzeMaterials(scene) {
        const materials = new Map();
        const materialInfo = {
            count: 0,
            materials: []
        };
        
        scene.traverse((child) => {
            if (child.material) {
                const material = child.material;
                const materialId = material.uuid;
                
                if (!materials.has(materialId)) {
                    materials.set(materialId, material);
                    
                    const info = {
                        name: material.name || 'Unnamed Material',
                        type: material.constructor.name,
                        color: material.color ? material.color.getHex() : null,
                        transparent: material.transparent,
                        opacity: material.opacity,
                        side: material.side,
                        maps: {}
                    };
                    
                    // 텍스처 맵 확인
                    const mapTypes = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'bumpMap', 'displacementMap'];
                    mapTypes.forEach(mapType => {
                        if (material[mapType]) {
                            info.maps[mapType] = {
                                image: material[mapType].image ? {
                                    width: material[mapType].image.width,
                                    height: material[mapType].image.height,
                                    src: material[mapType].image.src || 'Data URL'
                                } : null,
                                wrapS: material[mapType].wrapS,
                                wrapT: material[mapType].wrapT,
                                minFilter: material[mapType].minFilter,
                                magFilter: material[mapType].magFilter
                            };
                        }
                    });
                    
                    // PBR 속성 (MeshStandardMaterial인 경우)
                    if (material.isMeshStandardMaterial) {
                        info.pbr = {
                            roughness: material.roughness,
                            metalness: material.metalness,
                            emissive: material.emissive.getHex(),
                            emissiveIntensity: material.emissiveIntensity
                        };
                    }
                    
                    materialInfo.materials.push(info);
                }
            }
        });
        
        materialInfo.count = materials.size;
        return materialInfo;
    }
    
    /**
     * 텍스처 분석
     * @param {THREE.Group} scene - 씬 객체
     * @returns {Object}
     */
    analyzeTextures(scene) {
        const textures = new Set();
        const textureInfo = {
            count: 0,
            textures: [],
            totalMemoryEstimate: 0
        };
        
        scene.traverse((child) => {
            if (child.material) {
                const material = child.material;
                const mapTypes = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'];
                
                mapTypes.forEach(mapType => {
                    if (material[mapType] && !textures.has(material[mapType].uuid)) {
                        textures.add(material[mapType].uuid);
                        const texture = material[mapType];
                        
                        if (texture.image) {
                            const memoryEstimate = texture.image.width * texture.image.height * 4; // RGBA
                            textureInfo.totalMemoryEstimate += memoryEstimate;
                            
                            textureInfo.textures.push({
                                type: mapType,
                                width: texture.image.width,
                                height: texture.image.height,
                                format: texture.format,
                                type: texture.type,
                                memoryEstimate: memoryEstimate,
                                generateMipmaps: texture.generateMipmaps,
                                minFilter: texture.minFilter,
                                magFilter: texture.magFilter
                            });
                        }
                    }
                });
            }
        });
        
        textureInfo.count = textures.size;
        return textureInfo;
    }
    
    /**
     * 지오메트리 분석
     * @param {THREE.Group} scene - 씬 객체
     * @returns {Object}
     */
    analyzeGeometry(scene) {
        const geometryInfo = {
            totalVertices: 0,
            totalTriangles: 0,
            meshes: []
        };
        
        scene.traverse((child) => {
            if (child.isMesh && child.geometry) {
                const geometry = child.geometry;
                const vertices = geometry.attributes.position ? geometry.attributes.position.count : 0;
                const triangles = geometry.index ? geometry.index.count / 3 : vertices / 3;
                
                geometryInfo.totalVertices += vertices;
                geometryInfo.totalTriangles += triangles;
                
                geometryInfo.meshes.push({
                    name: child.name || 'Unnamed Mesh',
                    vertices: vertices,
                    triangles: triangles,
                    attributes: Object.keys(geometry.attributes),
                    hasIndex: !!geometry.index,
                    boundingBox: geometry.boundingBox,
                    boundingSphere: geometry.boundingSphere
                });
            }
        });
        
        return geometryInfo;
    }
    
    /**
     * 본(Bone) 분석
     * @param {THREE.Group} scene - 씬 객체
     * @returns {Object}
     */
    analyzeBones(scene) {
        const boneInfo = {
            hasSkeleton: false,
            boneCount: 0,
            bones: []
        };
        
        scene.traverse((child) => {
            if (child.isSkinnedMesh) {
                boneInfo.hasSkeleton = true;
                if (child.skeleton) {
                    boneInfo.boneCount = child.skeleton.bones.length;
                    
                    child.skeleton.bones.forEach((bone, index) => {
                        boneInfo.bones.push({
                            name: bone.name || `Bone_${index}`,
                            position: bone.position.toArray(),
                            rotation: bone.rotation.toArray(),
                            scale: bone.scale.toArray(),
                            children: bone.children.length
                        });
                    });
                }
            }
        });
        
        return boneInfo;
    }
    
    /**
     * 바운딩 박스 계산
     * @param {THREE.Group} scene - 씬 객체
     * @returns {Object}
     */
    calculateBoundingBox(scene) {
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        return {
            min: box.min.toArray(),
            max: box.max.toArray(),
            size: size.toArray(),
            center: center.toArray(),
            volume: size.x * size.y * size.z
        };
    }
    
    /**
     * 파일 정보 분석
     * @param {Object} gltf - GLTF 객체
     * @returns {Object}
     */
    analyzeFileInfo(gltf) {
        return {
            asset: gltf.asset || {},
            scenes: gltf.scenes ? gltf.scenes.length : 0,
            nodes: gltf.nodes ? gltf.nodes.length : 0,
            meshes: gltf.meshes ? gltf.meshes.length : 0,
            materials: gltf.materials ? gltf.materials.length : 0,
            textures: gltf.textures ? gltf.textures.length : 0,
            images: gltf.images ? gltf.images.length : 0,
            accessors: gltf.accessors ? gltf.accessors.length : 0,
            bufferViews: gltf.bufferViews ? gltf.bufferViews.length : 0,
            buffers: gltf.buffers ? gltf.buffers.length : 0
        };
    }
    
    /**
     * 최적화 권장사항 생성
     * @param {Object} analysis - 분석 결과
     * @returns {Array}
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        
        // 폴리곤 수 체크
        if (analysis.geometry.totalTriangles > 10000) {
            recommendations.push({
                type: 'performance',
                severity: 'warning',
                message: `높은 폴리곤 수 (${analysis.geometry.totalTriangles} 삼각형). LOD 시스템 고려 필요.`
            });
        }
        
        // 텍스처 해상도 체크
        analysis.textures.textures.forEach(texture => {
            if (texture.width > 1024 || texture.height > 1024) {
                recommendations.push({
                    type: 'memory',
                    severity: 'info',
                    message: `큰 텍스처 발견 (${texture.width}x${texture.height}). 압축 고려 필요.`
                });
            }
        });
        
        // 애니메이션 체크
        if (analysis.animations.count === 0) {
            recommendations.push({
                type: 'content',
                severity: 'info',
                message: '애니메이션이 없습니다. 정적 모델로 사용됩니다.'
            });
        }
        
        // 재질 수 체크
        if (analysis.materials.count > 5) {
            recommendations.push({
                type: 'performance',
                severity: 'info',
                message: `많은 재질 수 (${analysis.materials.count}개). 드로우 콜 최적화 고려 필요.`
            });
        }
        
        return recommendations;
    }
    
    /**
     * 분석 결과 출력
     * @param {string} name - 모델 이름
     */
    printAnalysis(name) {
        const analysis = this.analysisResults.get(name);
        if (!analysis) {
            console.log(`❌ ${name} 분석 결과를 찾을 수 없습니다.`);
            return;
        }
        
        console.log(`\n📋 GLB 모델 분석 보고서: ${name}`);
        console.log('='.repeat(50));
        
        // 기본 정보
        console.log(`📦 씬 정보:`);
        console.log(`  - 오브젝트 수: ${analysis.scene.objects.length}`);
        console.log(`  - 총 버텍스: ${analysis.geometry.totalVertices.toLocaleString()}`);
        console.log(`  - 총 삼각형: ${analysis.geometry.totalTriangles.toLocaleString()}`);
        
        // 애니메이션 정보
        console.log(`\n🎬 애니메이션 정보:`);
        console.log(`  - 애니메이션 수: ${analysis.animations.count}`);
        if (analysis.animations.count > 0) {
            analysis.animations.animations.forEach(anim => {
                console.log(`    - ${anim.name}: ${anim.duration.toFixed(2)}초, ${anim.trackCount}개 트랙`);
            });
        }
        
        // 재질 정보
        console.log(`\n🎨 재질 정보:`);
        console.log(`  - 재질 수: ${analysis.materials.count}`);
        analysis.materials.materials.forEach(mat => {
            console.log(`    - ${mat.name} (${mat.type})`);
        });
        
        // 텍스처 정보
        console.log(`\n🖼️ 텍스처 정보:`);
        console.log(`  - 텍스처 수: ${analysis.textures.count}`);
        console.log(`  - 예상 메모리: ${(analysis.textures.totalMemoryEstimate / 1024 / 1024).toFixed(2)}MB`);
        
        // 바운딩 박스
        console.log(`\n📏 크기 정보:`);
        console.log(`  - 크기: ${analysis.boundingBox.size.map(v => v.toFixed(2)).join(' x ')}`);
        console.log(`  - 중심: ${analysis.boundingBox.center.map(v => v.toFixed(2)).join(', ')}`);
        
        // 권장사항
        if (analysis.recommendations.length > 0) {
            console.log(`\n💡 권장사항:`);
            analysis.recommendations.forEach(rec => {
                const icon = rec.severity === 'warning' ? '⚠️' : 'ℹ️';
                console.log(`  ${icon} ${rec.message}`);
            });
        }
        
        console.log('='.repeat(50));
    }
    
    /**
     * 모든 분석 결과 반환
     * @returns {Map}
     */
    getAllAnalysis() {
        return this.analysisResults;
    }
    
    /**
     * 특정 모델 분석 결과 반환
     * @param {string} name - 모델 이름
     * @returns {Object|null}
     */
    getAnalysis(name) {
        return this.analysisResults.get(name) || null;
    }
}