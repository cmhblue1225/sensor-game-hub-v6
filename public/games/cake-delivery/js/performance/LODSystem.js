/**
 * LOD (Level of Detail) 시스템
 * 거리 기반 모델 품질 조절 및 렌더링 최적화를 제공합니다.
 */
class LODSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.lodObjects = new Map();
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
        
        // LOD 설정
        this.lodLevels = {
            high: { distance: 50, quality: 1.0 },
            medium: { distance: 100, quality: 0.6 },
            low: { distance: 200, quality: 0.3 },
            culled: { distance: 300, quality: 0.0 }
        };
        
        // 성능 모니터링
        this.performanceMetrics = {
            visibleObjects: 0,
            culledObjects: 0,
            lodSwitches: 0,
            renderTime: 0
        };
        
        // 업데이트 주기 제어
        this.updateInterval = 100; // ms
        this.lastUpdate = 0;
        
        this.init();
    }
    
    /**
     * LOD 시스템 초기화
     */
    init() {
        this.setupLODLevels();
        this.createPerformanceMonitor();
        
        console.log('✅ LOD 시스템 초기화 완료');
    }
    
    /**
     * LOD 레벨 설정
     */
    setupLODLevels() {
        // 디바이스 성능에 따른 LOD 레벨 조정
        const devicePerformance = this.detectDevicePerformance();
        
        switch (devicePerformance) {
            case 'high':
                this.lodLevels.high.distance = 80;
                this.lodLevels.medium.distance = 150;
                this.lodLevels.low.distance = 250;
                break;
            case 'medium':
                this.lodLevels.high.distance = 60;
                this.lodLevels.medium.distance = 120;
                this.lodLevels.low.distance = 200;
                break;
            case 'low':
                this.lodLevels.high.distance = 40;
                this.lodLevels.medium.distance = 80;
                this.lodLevels.low.distance = 150;
                break;
        }
        
        console.log('📊 LOD 레벨 설정:', this.lodLevels);
    }
    
    /**
     * 디바이스 성능 감지
     */
    detectDevicePerformance() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return 'low';
        
        const renderer = gl.getParameter(gl.RENDERER);
        const vendor = gl.getParameter(gl.VENDOR);
        
        // GPU 성능 추정
        const highPerformanceGPUs = [
            'nvidia', 'geforce', 'quadro', 'tesla',
            'radeon', 'rx ', 'vega', 'navi',
            'apple', 'm1', 'm2', 'a14', 'a15', 'a16'
        ];
        
        const gpuInfo = (renderer + ' ' + vendor).toLowerCase();
        const isHighPerformance = highPerformanceGPUs.some(gpu => gpuInfo.includes(gpu));
        
        // 메모리 확인
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        
        if (isHighPerformance && memory >= 8 && cores >= 8) {
            return 'high';
        } else if (memory >= 4 && cores >= 4) {
            return 'medium';
        } else {
            return 'low';
        }
    }
    
    /**
     * LOD 오브젝트 등록
     */
    registerLODObject(object, lodMeshes = null) {
        if (!object) return;
        
        const lodData = {
            object: object,
            originalMesh: object.clone(),
            lodMeshes: lodMeshes || this.generateLODMeshes(object),
            currentLOD: 'high',
            distance: 0,
            visible: true,
            boundingBox: new THREE.Box3().setFromObject(object),
            boundingSphere: new THREE.Sphere()
        };
        
        // 바운딩 스피어 계산
        lodData.boundingBox.getBoundingSphere(lodData.boundingSphere);
        
        this.lodObjects.set(object.uuid, lodData);
        
        console.log(`📦 LOD 오브젝트 등록: ${object.name || object.uuid}`);
    }
    
    /**
     * LOD 메시 생성
     */
    generateLODMeshes(originalObject) {
        const lodMeshes = {
            high: originalObject.clone(),
            medium: this.createReducedMesh(originalObject, 0.6),
            low: this.createReducedMesh(originalObject, 0.3),
            culled: null
        };
        
        return lodMeshes;
    }
    
    /**
     * 감소된 메시 생성
     */
    createReducedMesh(originalObject, quality) {
        const reducedObject = originalObject.clone();
        
        // 지오메트리 단순화
        if (reducedObject.geometry) {
            const geometry = reducedObject.geometry.clone();
            
            // 버텍스 수 감소 (간단한 구현)
            if (geometry.attributes.position) {
                const positions = geometry.attributes.position.array;
                const reducedPositions = new Float32Array(Math.floor(positions.length * quality));
                
                const step = Math.floor(1 / quality);
                let reducedIndex = 0;
                
                for (let i = 0; i < positions.length; i += step * 3) {
                    if (reducedIndex < reducedPositions.length - 2) {
                        reducedPositions[reducedIndex] = positions[i];
                        reducedPositions[reducedIndex + 1] = positions[i + 1];
                        reducedPositions[reducedIndex + 2] = positions[i + 2];
                        reducedIndex += 3;
                    }
                }
                
                geometry.setAttribute('position', new THREE.BufferAttribute(reducedPositions, 3));
            }
            
            reducedObject.geometry = geometry;
        }
        
        // 텍스처 품질 조정
        if (reducedObject.material) {
            const material = reducedObject.material.clone();
            
            if (material.map) {
                // 텍스처 해상도 감소
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = material.map.image;
                
                if (img) {
                    const newWidth = Math.floor(img.width * quality);
                    const newHeight = Math.floor(img.height * quality);
                    
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    
                    const reducedTexture = new THREE.CanvasTexture(canvas);
                    reducedTexture.wrapS = material.map.wrapS;
                    reducedTexture.wrapT = material.map.wrapT;
                    reducedTexture.minFilter = THREE.LinearFilter;
                    reducedTexture.magFilter = THREE.LinearFilter;
                    
                    material.map = reducedTexture;
                }
            }
            
            reducedObject.material = material;
        }
        
        return reducedObject;
    }
    
    /**
     * LOD 시스템 업데이트
     */
    update() {
        const now = performance.now();
        if (now - this.lastUpdate < this.updateInterval) return;
        
        this.lastUpdate = now;
        const startTime = performance.now();
        
        // 카메라 프러스텀 업데이트
        this.cameraMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.cameraMatrix);
        
        // 성능 메트릭 초기화
        this.performanceMetrics.visibleObjects = 0;
        this.performanceMetrics.culledObjects = 0;
        this.performanceMetrics.lodSwitches = 0;
        
        // 각 LOD 오브젝트 처리
        for (const [uuid, lodData] of this.lodObjects) {
            this.updateLODObject(lodData);
        }
        
        this.performanceMetrics.renderTime = performance.now() - startTime;
    }
    
    /**
     * 개별 LOD 오브젝트 업데이트
     */
    updateLODObject(lodData) {
        const { object, boundingSphere } = lodData;
        
        // 프러스텀 컬링
        const isInFrustum = this.frustum.intersectsSphere(boundingSphere);
        
        if (!isInFrustum) {
            this.cullObject(lodData);
            this.performanceMetrics.culledObjects++;
            return;
        }
        
        // 거리 계산
        const distance = this.camera.position.distanceTo(object.position);
        lodData.distance = distance;
        
        // LOD 레벨 결정
        const newLOD = this.determineLODLevel(distance);
        
        // LOD 변경 필요 시 적용
        if (newLOD !== lodData.currentLOD) {
            this.switchLOD(lodData, newLOD);
            this.performanceMetrics.lodSwitches++;
        }
        
        // 오브젝트 표시
        this.showObject(lodData);
        this.performanceMetrics.visibleObjects++;
    }
    
    /**
     * LOD 레벨 결정
     */
    determineLODLevel(distance) {
        if (distance <= this.lodLevels.high.distance) {
            return 'high';
        } else if (distance <= this.lodLevels.medium.distance) {
            return 'medium';
        } else if (distance <= this.lodLevels.low.distance) {
            return 'low';
        } else {
            return 'culled';
        }
    }
    
    /**
     * LOD 전환
     */
    switchLOD(lodData, newLOD) {
        const { object, lodMeshes } = lodData;
        
        // 현재 메시 숨기기
        object.visible = false;
        
        // 새 LOD 메시 적용
        if (newLOD === 'culled') {
            lodData.visible = false;
        } else {
            const newMesh = lodMeshes[newLOD];
            if (newMesh) {
                // 위치, 회전, 스케일 복사
                newMesh.position.copy(object.position);
                newMesh.rotation.copy(object.rotation);
                newMesh.scale.copy(object.scale);
                
                // 씬에서 교체
                this.scene.remove(object);
                this.scene.add(newMesh);
                
                // 참조 업데이트
                lodData.object = newMesh;
                lodData.visible = true;
            }
        }
        
        lodData.currentLOD = newLOD;
        
        console.log(`🔄 LOD 전환: ${object.name || object.uuid} -> ${newLOD}`);
    }
    
    /**
     * 오브젝트 컬링
     */
    cullObject(lodData) {
        if (lodData.visible) {
            lodData.object.visible = false;
            lodData.visible = false;
        }
    }
    
    /**
     * 오브젝트 표시
     */
    showObject(lodData) {
        if (!lodData.visible && lodData.currentLOD !== 'culled') {
            lodData.object.visible = true;
            lodData.visible = true;
        }
    }
    
    /**
     * 성능 모니터 생성
     */
    createPerformanceMonitor() {
        if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
            this.createDebugUI();
        }
    }
    
    /**
     * 디버그 UI 생성
     */
    createDebugUI() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'lod-debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            min-width: 200px;
        `;
        
        document.body.appendChild(debugPanel);
        
        // 주기적으로 업데이트
        setInterval(() => {
            this.updateDebugUI(debugPanel);
        }, 500);
    }
    
    /**
     * 디버그 UI 업데이트
     */
    updateDebugUI(panel) {
        const metrics = this.performanceMetrics;
        const totalObjects = this.lodObjects.size;
        
        panel.innerHTML = `
            <div><strong>LOD System Debug</strong></div>
            <div>Total Objects: ${totalObjects}</div>
            <div>Visible: ${metrics.visibleObjects}</div>
            <div>Culled: ${metrics.culledObjects}</div>
            <div>LOD Switches: ${metrics.lodSwitches}</div>
            <div>Render Time: ${metrics.renderTime.toFixed(2)}ms</div>
            <div>Update Rate: ${(1000 / this.updateInterval).toFixed(1)}Hz</div>
        `;
    }
    
    /**
     * LOD 설정 조정
     */
    adjustLODSettings(settings) {
        if (settings.distances) {
            Object.assign(this.lodLevels, settings.distances);
        }
        
        if (settings.updateInterval) {
            this.updateInterval = settings.updateInterval;
        }
        
        console.log('⚙️ LOD 설정 조정:', settings);
    }
    
    /**
     * 성능 통계 가져오기
     */
    getPerformanceStats() {
        return {
            ...this.performanceMetrics,
            totalObjects: this.lodObjects.size,
            lodLevels: { ...this.lodLevels },
            updateInterval: this.updateInterval
        };
    }
    
    /**
     * LOD 오브젝트 제거
     */
    unregisterLODObject(object) {
        const uuid = object.uuid;
        const lodData = this.lodObjects.get(uuid);
        
        if (lodData) {
            // 씬에서 제거
            this.scene.remove(lodData.object);
            
            // LOD 메시들 정리
            if (lodData.lodMeshes) {
                Object.values(lodData.lodMeshes).forEach(mesh => {
                    if (mesh && mesh.geometry) {
                        mesh.geometry.dispose();
                    }
                    if (mesh && mesh.material) {
                        if (Array.isArray(mesh.material)) {
                            mesh.material.forEach(mat => mat.dispose());
                        } else {
                            mesh.material.dispose();
                        }
                    }
                });
            }
            
            this.lodObjects.delete(uuid);
            console.log(`🗑️ LOD 오브젝트 제거: ${object.name || uuid}`);
        }
    }
    
    /**
     * 정리
     */
    dispose() {
        console.log('🧹 LOD 시스템 정리 시작...');
        
        // 모든 LOD 오브젝트 제거
        for (const [uuid, lodData] of this.lodObjects) {
            this.unregisterLODObject(lodData.object);
        }
        
        this.lodObjects.clear();
        
        // 디버그 UI 제거
        const debugPanel = document.getElementById('lod-debug-panel');
        if (debugPanel) {
            debugPanel.remove();
        }
        
        console.log('✅ LOD 시스템 정리 완료');
    }
}