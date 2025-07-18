/**
 * 🚀 드론 레이싱 게임 성능 최적화 시스템
 * 
 * 60fps 유지, 메모리 최적화, 렌더링 성능 개선
 */

class PerformanceOptimizer {
    constructor(game) {
        this.game = game;
        
        // 성능 모니터링
        this.performanceStats = {
            fps: 60,
            frameTime: 16.67, // ms
            renderTime: 0,
            updateTime: 0,
            memoryUsage: 0,
            particleCount: 0,
            drawCalls: 0
        };
        
        // 프레임 레이트 제어
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fpsUpdateInterval = 1000; // 1초마다 FPS 업데이트
        this.lastFpsUpdate = 0;
        
        // 적응형 품질 설정
        this.qualitySettings = {
            current: 'high',
            levels: {
                low: {
                    particleLimit: 100,
                    trailLength: 20,
                    shadowMapSize: 512,
                    antialias: false,
                    pixelRatio: 1
                },
                medium: {
                    particleLimit: 300,
                    trailLength: 35,
                    shadowMapSize: 1024,
                    antialias: true,
                    pixelRatio: 1.5
                },
                high: {
                    particleLimit: 500,
                    trailLength: 50,
                    shadowMapSize: 2048,
                    antialias: true,
                    pixelRatio: 2
                }
            }
        };
        
        // 센서 데이터 throttling
        this.sensorThrottle = {
            interval: 50, // 50ms (20Hz)
            lastUpdate: new Map(),
            dataBuffer: new Map()
        };
        
        // 렌더링 최적화
        this.renderOptimization = {
            frustumCulling: true,
            lodEnabled: true,
            occlusionCulling: false,
            instancedRendering: true
        };
        
        // 메모리 관리
        this.memoryManager = {
            garbageCollectionInterval: 30000, // 30초
            lastGC: Date.now(),
            textureCache: new Map(),
            geometryCache: new Map(),
            materialCache: new Map()
        };
        
        this.initializeOptimizations();
        
        console.log('🚀 성능 최적화 시스템 초기화 완료');
    }
    
    /**
     * 최적화 시스템 초기화
     */
    initializeOptimizations() {
        // 렌더러 최적화 설정
        this.optimizeRenderer();
        
        // 적응형 품질 모니터링 시작
        this.startAdaptiveQuality();
        
        // 메모리 관리 시작
        this.startMemoryManagement();
        
        // 성능 모니터링 시작
        this.startPerformanceMonitoring();
    }
    
    /**
     * 렌더러 최적화
     */
    optimizeRenderer() {
        const renderer = this.game.renderer;
        if (!renderer) return;
        
        // 픽셀 비율 최적화
        const quality = this.qualitySettings.levels[this.qualitySettings.current];
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
        
        // 그림자 맵 크기 최적화
        renderer.shadowMap.mapSize.width = quality.shadowMapSize;
        renderer.shadowMap.mapSize.height = quality.shadowMapSize;
        
        // 렌더링 최적화 플래그
        renderer.sortObjects = true;
        renderer.autoClear = true;
        renderer.autoClearColor = true;
        renderer.autoClearDepth = true;
        renderer.autoClearStencil = false;
        
        // WebGL 컨텍스트 최적화
        const gl = renderer.getContext();
        if (gl) {
            // 깊이 테스트 최적화
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            
            // 컬링 최적화
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
        }
        
        console.log(`렌더러 최적화 완료: ${this.qualitySettings.current} 품질`);
    }
    
    /**
     * 센서 데이터 throttling 처리
     */
    throttleSensorData(sensorId, data) {
        const now = Date.now();
        const lastUpdate = this.sensorThrottle.lastUpdate.get(sensorId) || 0;
        
        // 50ms 간격으로 제한
        if (now - lastUpdate < this.sensorThrottle.interval) {
            // 버퍼에 최신 데이터 저장
            this.sensorThrottle.dataBuffer.set(sensorId, data);
            return null; // 처리하지 않음
        }
        
        // 업데이트 시간 갱신
        this.sensorThrottle.lastUpdate.set(sensorId, now);
        
        // 버퍼된 데이터가 있으면 그것을 사용, 없으면 현재 데이터 사용
        const bufferedData = this.sensorThrottle.dataBuffer.get(sensorId);
        if (bufferedData) {
            this.sensorThrottle.dataBuffer.delete(sensorId);
            return bufferedData;
        }
        
        return data;
    }
    
    /**
     * 파티클 시스템 최적화
     */
    optimizeParticleSystem() {
        const effects = this.game.effects;
        if (!effects) return;
        
        const quality = this.qualitySettings.levels[this.qualitySettings.current];
        
        // 파티클 수 제한
        if (effects.particles.length > quality.particleLimit) {
            const excessParticles = effects.particles.splice(quality.particleLimit);
            excessParticles.forEach(particle => {
                this.game.scene.remove(particle);
                effects.returnParticleToPool(particle);
            });
        }
        
        // 트레일 길이 제한
        effects.trails.forEach(trail => {
            if (trail.points && trail.points.length > quality.trailLength) {
                trail.points = trail.points.slice(-quality.trailLength);
            }
        });
        
        // 파티클 LOD (Level of Detail)
        this.applyParticleLOD();
    }
    
    /**
     * 파티클 LOD 적용
     */
    applyParticleLOD() {
        const effects = this.game.effects;
        if (!effects || !this.game.cameras) return;
        
        const camera = this.game.cameras.player1; // 기준 카메라
        
        effects.particles.forEach(particle => {
            const distance = camera.position.distanceTo(particle.position);
            
            // 거리에 따른 파티클 크기 및 투명도 조정
            if (distance > 50) {
                // 멀리 있는 파티클은 작게
                particle.scale.multiplyScalar(0.5);
                particle.material.opacity *= 0.7;
            } else if (distance > 100) {
                // 매우 멀리 있는 파티클은 제거
                effects.particles.splice(effects.particles.indexOf(particle), 1);
                this.game.scene.remove(particle);
                effects.returnParticleToPool(particle);
            }
        });
    }
    
    /**
     * 화면 분할 렌더링 최적화
     */
    optimizeSplitScreenRendering() {
        const renderer = this.game.renderer;
        const cameras = this.game.cameras;
        
        if (!renderer || !cameras) return;
        
        // 뷰포트 크기 계산
        const width = renderer.domElement.width;
        const height = renderer.domElement.height;
        const halfWidth = width / 2;
        
        // 카메라 종횡비 최적화
        cameras.player1.aspect = halfWidth / height;
        cameras.player2.aspect = halfWidth / height;
        
        cameras.player1.updateProjectionMatrix();
        cameras.player2.updateProjectionMatrix();
        
        // 렌더링 영역 최적화
        renderer.setScissorTest(true);
        
        // 플레이어 1 화면 (왼쪽)
        renderer.setScissor(0, 0, halfWidth, height);
        renderer.setViewport(0, 0, halfWidth, height);
        
        // 플레이어 2 화면 (오른쪽)
        renderer.setScissor(halfWidth, 0, halfWidth, height);
        renderer.setViewport(halfWidth, 0, halfWidth, height);
        
        renderer.setScissorTest(false);
    }
    
    /**
     * 적응형 품질 관리
     */
    startAdaptiveQuality() {
        setInterval(() => {
            this.adjustQualityBasedOnPerformance();
        }, 2000); // 2초마다 품질 조정
    }
    
    /**
     * 성능 기반 품질 조정
     */
    adjustQualityBasedOnPerformance() {
        const currentFPS = this.performanceStats.fps;
        const targetFPS = this.targetFPS;
        
        // FPS가 목표의 80% 이하로 떨어지면 품질 낮춤
        if (currentFPS < targetFPS * 0.8) {
            this.lowerQuality();
        }
        // FPS가 목표의 95% 이상이면 품질 높임
        else if (currentFPS > targetFPS * 0.95 && this.qualitySettings.current !== 'high') {
            this.raiseQuality();
        }
    }
    
    /**
     * 품질 낮추기
     */
    lowerQuality() {
        const currentQuality = this.qualitySettings.current;
        
        if (currentQuality === 'high') {
            this.setQuality('medium');
        } else if (currentQuality === 'medium') {
            this.setQuality('low');
        }
    }
    
    /**
     * 품질 높이기
     */
    raiseQuality() {
        const currentQuality = this.qualitySettings.current;
        
        if (currentQuality === 'low') {
            this.setQuality('medium');
        } else if (currentQuality === 'medium') {
            this.setQuality('high');
        }
    }
    
    /**
     * 품질 설정 적용
     */
    setQuality(qualityLevel) {
        if (!this.qualitySettings.levels[qualityLevel]) return;
        
        const oldQuality = this.qualitySettings.current;
        this.qualitySettings.current = qualityLevel;
        
        // 렌더러 설정 업데이트
        this.optimizeRenderer();
        
        // 파티클 시스템 업데이트
        this.optimizeParticleSystem();
        
        console.log(`품질 변경: ${oldQuality} → ${qualityLevel}`);
        
        // UI에 품질 변경 알림
        if (this.game.ui) {
            this.game.ui.showToast(
                `그래픽 품질: ${qualityLevel.toUpperCase()}`,
                'info',
                2000
            );
        }
    }
    
    /**
     * 메모리 관리 시작
     */
    startMemoryManagement() {
        setInterval(() => {
            this.performMemoryCleanup();
        }, this.memoryManager.garbageCollectionInterval);
    }
    
    /**
     * 메모리 정리
     */
    performMemoryCleanup() {
        const now = Date.now();
        
        // 사용하지 않는 텍스처 정리
        this.cleanupUnusedTextures();
        
        // 사용하지 않는 지오메트리 정리
        this.cleanupUnusedGeometries();
        
        // 사용하지 않는 재질 정리
        this.cleanupUnusedMaterials();
        
        // 파티클 풀 크기 조정
        this.optimizeParticlePool();
        
        // 가비지 컬렉션 힌트 (브라우저가 지원하는 경우)
        if (window.gc) {
            window.gc();
        }
        
        this.memoryManager.lastGC = now;
        
        console.log('🧹 메모리 정리 완료');
    }
    
    /**
     * 사용하지 않는 텍스처 정리
     */
    cleanupUnusedTextures() {
        this.memoryManager.textureCache.forEach((texture, key) => {
            if (texture.userData && texture.userData.lastUsed) {
                const timeSinceLastUse = Date.now() - texture.userData.lastUsed;
                if (timeSinceLastUse > 60000) { // 1분 이상 사용하지 않음
                    texture.dispose();
                    this.memoryManager.textureCache.delete(key);
                }
            }
        });
    }
    
    /**
     * 사용하지 않는 지오메트리 정리
     */
    cleanupUnusedGeometries() {
        this.memoryManager.geometryCache.forEach((geometry, key) => {
            if (geometry.userData && geometry.userData.lastUsed) {
                const timeSinceLastUse = Date.now() - geometry.userData.lastUsed;
                if (timeSinceLastUse > 60000) { // 1분 이상 사용하지 않음
                    geometry.dispose();
                    this.memoryManager.geometryCache.delete(key);
                }
            }
        });
    }
    
    /**
     * 사용하지 않는 재질 정리
     */
    cleanupUnusedMaterials() {
        this.memoryManager.materialCache.forEach((material, key) => {
            if (material.userData && material.userData.lastUsed) {
                const timeSinceLastUse = Date.now() - material.userData.lastUsed;
                if (timeSinceLastUse > 60000) { // 1분 이상 사용하지 않음
                    material.dispose();
                    this.memoryManager.materialCache.delete(key);
                }
            }
        });
    }
    
    /**
     * 파티클 풀 최적화
     */
    optimizeParticlePool() {
        const effects = this.game.effects;
        if (!effects) return;
        
        const quality = this.qualitySettings.levels[this.qualitySettings.current];
        const maxPoolSize = quality.particleLimit * 2;
        
        // 파티클 풀 크기 제한
        if (effects.particlePool.length > maxPoolSize) {
            const excessParticles = effects.particlePool.splice(maxPoolSize);
            excessParticles.forEach(particle => {
                if (particle.geometry) particle.geometry.dispose();
                if (particle.material) particle.material.dispose();
            });
        }
    }
    
    /**
     * 성능 모니터링 시작
     */
    startPerformanceMonitoring() {
        this.performanceMonitoringLoop();
    }
    
    /**
     * 성능 모니터링 루프
     */
    performanceMonitoringLoop() {
        const now = performance.now();
        
        // FPS 계산
        this.frameCount++;
        if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.performanceStats.fps = Math.round(
                (this.frameCount * 1000) / (now - this.lastFpsUpdate)
            );
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
        
        // 프레임 시간 계산
        if (this.lastFrameTime > 0) {
            this.performanceStats.frameTime = now - this.lastFrameTime;
        }
        this.lastFrameTime = now;
        
        // 메모리 사용량 (추정)
        if (performance.memory) {
            this.performanceStats.memoryUsage = performance.memory.usedJSHeapSize;
        }
        
        // 파티클 수
        if (this.game.effects) {
            this.performanceStats.particleCount = this.game.effects.particles.length;
        }
        
        // 다음 프레임에서 계속 모니터링
        requestAnimationFrame(() => this.performanceMonitoringLoop());
    }
    
    /**
     * 프레임 레이트 제한
     */
    shouldSkipFrame() {
        const now = performance.now();
        const elapsed = now - this.lastFrameTime;
        
        return elapsed < this.frameInterval;
    }
    
    /**
     * 렌더링 최적화 적용
     */
    optimizeRendering(scene, camera, renderer) {
        // 프러스텀 컬링
        if (this.renderOptimization.frustumCulling) {
            this.applyFrustumCulling(scene, camera);
        }
        
        // LOD 적용
        if (this.renderOptimization.lodEnabled) {
            this.applyLevelOfDetail(scene, camera);
        }
        
        // 인스턴스 렌더링 (동일한 객체가 많은 경우)
        if (this.renderOptimization.instancedRendering) {
            this.applyInstancedRendering(scene);
        }
    }
    
    /**
     * 프러스텀 컬링 적용
     */
    applyFrustumCulling(scene, camera) {
        const frustum = new THREE.Frustum();
        const matrix = new THREE.Matrix4().multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(matrix);
        
        scene.traverse((object) => {
            if (object.isMesh) {
                object.visible = frustum.intersectsObject(object);
            }
        });
    }
    
    /**
     * LOD (Level of Detail) 적용
     */
    applyLevelOfDetail(scene, camera) {
        scene.traverse((object) => {
            if (object.isMesh && object.userData.enableLOD) {
                const distance = camera.position.distanceTo(object.position);
                
                // 거리에 따른 디테일 조정
                if (distance > 100) {
                    object.visible = false; // 매우 멀면 숨김
                } else if (distance > 50) {
                    // 멀면 낮은 디테일
                    if (object.userData.lowDetailGeometry) {
                        object.geometry = object.userData.lowDetailGeometry;
                    }
                } else {
                    // 가까우면 높은 디테일
                    if (object.userData.highDetailGeometry) {
                        object.geometry = object.userData.highDetailGeometry;
                    }
                }
            }
        });
    }
    
    /**
     * 인스턴스 렌더링 적용
     */
    applyInstancedRendering(scene) {
        // 동일한 지오메트리를 가진 객체들을 그룹화하여 인스턴스 렌더링
        const geometryGroups = new Map();
        
        scene.traverse((object) => {
            if (object.isMesh && object.userData.enableInstancing) {
                const geometryKey = object.geometry.uuid;
                if (!geometryGroups.has(geometryKey)) {
                    geometryGroups.set(geometryKey, []);
                }
                geometryGroups.get(geometryKey).push(object);
            }
        });
        
        // 각 그룹에 대해 인스턴스 렌더링 적용
        geometryGroups.forEach((objects, geometryKey) => {
            if (objects.length > 10) { // 10개 이상일 때만 인스턴싱
                this.createInstancedMesh(objects);
            }
        });
    }
    
    /**
     * 인스턴스 메시 생성
     */
    createInstancedMesh(objects) {
        if (objects.length === 0) return;
        
        const firstObject = objects[0];
        const instancedMesh = new THREE.InstancedMesh(
            firstObject.geometry,
            firstObject.material,
            objects.length
        );
        
        // 각 인스턴스의 변환 행렬 설정
        const matrix = new THREE.Matrix4();
        objects.forEach((object, index) => {
            object.updateMatrixWorld();
            instancedMesh.setMatrixAt(index, object.matrixWorld);
            
            // 원본 객체 숨김
            object.visible = false;
        });
        
        instancedMesh.instanceMatrix.needsUpdate = true;
        firstObject.parent.add(instancedMesh);
    }
    
    /**
     * 성능 통계 반환
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            quality: this.qualitySettings.current,
            memoryMB: Math.round(this.performanceStats.memoryUsage / 1024 / 1024)
        };
    }
    
    /**
     * 디버그 정보 표시
     */
    showDebugInfo() {
        const stats = this.getPerformanceStats();
        
        console.log('🚀 성능 통계:', {
            'FPS': stats.fps,
            '프레임 시간': `${stats.frameTime.toFixed(2)}ms`,
            '메모리 사용량': `${stats.memoryMB}MB`,
            '파티클 수': stats.particleCount,
            '품질 설정': stats.quality
        });
        
        return stats;
    }
    
    /**
     * 성능 최적화 시스템 정리
     */
    dispose() {
        // 캐시 정리
        this.memoryManager.textureCache.clear();
        this.memoryManager.geometryCache.clear();
        this.memoryManager.materialCache.clear();
        
        // 센서 데이터 버퍼 정리
        this.sensorThrottle.lastUpdate.clear();
        this.sensorThrottle.dataBuffer.clear();
        
        console.log('🚀 성능 최적화 시스템 정리 완료');
    }
}