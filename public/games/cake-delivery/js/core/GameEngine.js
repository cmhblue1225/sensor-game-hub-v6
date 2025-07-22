/**
 * 케이크 배달 게임 - 핵심 게임 엔진
 * 모든 시스템을 통합하고 관리하는 메인 엔진
 */
class GameEngine {
    constructor() {
        // 게임 상태
        this.gameState = 'loading'; // loading, menu, playing, paused, gameOver
        this.gameMode = 'normal';
        this.cakeType = 'basic';
        this.score = 0;
        this.level = 1;
        this.timer = 60;
        this.timeLeft = this.timer;
        this.lastTime = 0;
        
        // 캔버스 및 렌더링
        this.canvas = document.getElementById('gameCanvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // 시스템 매니저들
        this.modelManager = null;
        this.materialSystem = null;
        this.particleSystem = null;
        this.animationSystem = null;
        this.physicsManager = null;
        this.cakePhysics = null;
        this.sensorSmoothing = null;
        this.sensorPrediction = null;
        this.musicSystem = null;
        this.spatialAudio = null;
        this.touchInterface = null;
        this.accessibility = null;
        this.lodSystem = null;
        this.objectPooling = null;
        this.memoryManager = null;
        
        // 게임 오브젝트들
        this.cake = null;
        this.character = null;
        this.environment = [];
        this.lights = [];
        
        // 센서 데이터
        this.sensorData = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            rotationRate: { alpha: 0, beta: 0, gamma: 0 }
        };
        this.smoothedTilt = { x: 0, y: 0 };
        
        // 게임 설정
        this.cakeProperties = {
            basic: { mass: 1, friction: 0.5, restitution: 0.2, color: 0xFFD7A0, wobble: 1.0 },
            strawberry: { mass: 0.8, friction: 0.7, restitution: 0.1, color: 0xFF9AA2, wobble: 0.8 },
            chocolate: { mass: 1.2, friction: 0.4, restitution: 0.1, color: 0x6F4E37, wobble: 0.7 },
            wedding: { mass: 1.5, friction: 0.3, restitution: 0.05, color: 0xFFFFFF, wobble: 0.5 },
            ice: { mass: 0.7, friction: 0.1, restitution: 0.8, color: 0xA5F2F3, wobble: 1.5 },
            bomb: { mass: 2, friction: 0.6, restitution: 0.4, color: 0x333333, wobble: 2.0 }
        };
        
        // 로딩 진행률
        this.loadingProgress = 0;
        this.assetsLoaded = 0;
        this.totalAssets = 10;
        
        // 초기화
        this.init();
    }
    
    /**
     * 게임 엔진 초기화
     */
    async init() {
        try {
            console.log('🎮 게임 엔진 초기화 시작...');
            
            // 캔버스 설정
            this.setupCanvas();
            
            // Three.js 초기화
            this.initThreeJS();
            
            // 시스템 매니저들 초기화
            await this.initSystems();
            
            // 에셋 로드
            await this.loadAssets();
            
            // 씬 구성
            this.setupScene();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 충돌 시스템 이벤트 리스너 설정
            this.setupCollisionEventListeners();
            
            // 로딩 완료
            this.gameState = 'menu';
            this.hideLoadingScreen();
            
            console.log('✅ 게임 엔진 초기화 완료');
            
        } catch (error) {
            console.error('❌ 게임 엔진 초기화 실패:', error);
            this.showError('게임 초기화에 실패했습니다.');
        }
    }
    
    /**
     * 캔버스 설정
     */
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            
            if (this.renderer && this.camera) {
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
            }
        });
    }
    
    /**
     * Three.js 초기화
     */
    initThreeJS() {
        // 씬 생성
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.01);
        
        // 카메라 생성
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // 렌더러 생성
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Three.js r150+ 호환성을 위한 설정
        if (this.renderer.outputColorSpace !== undefined) {
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        } else if (this.renderer.outputEncoding !== undefined) {
            this.renderer.outputEncoding = THREE.sRGBEncoding;
        }
        
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        this.updateLoadingProgress(20);
    }
    
    /**
     * 시스템 매니저들 초기화
     */
    async initSystems() {
        try {
            // 그래픽 시스템
            this.modelManager = new GLBModelManager();
            this.materialSystem = new PBRMaterialSystem();
            this.lightingSystem = new AdvancedLightingSystem(this.scene, this.renderer);
            this.particleSystem = new ParticleSystem(this.scene);
            this.animationSystem = new CharacterAnimationSystem();
            
            // 물리 시스템
            this.physicsManager = new PhysicsWorldManager();
            this.cakePhysics = new CakePhysicsSystem();
            this.collisionSystem = new CollisionDetectionSystem(this.physicsManager);
            this.environmentalPhysics = new EnvironmentalPhysics(this.physicsManager);
            
            // 입력 시스템
            this.sensorSmoothing = new SensorSmoothingSystem();
            this.sensorPrediction = new SensorPredictionSystem();
            
            // 오디오 시스템
            this.musicSystem = new AdaptiveMusicSystem();
            this.spatialAudio = new SpatialAudioSystem();
            
            // UI 시스템
            this.touchInterface = new MobileTouchInterface();
            this.accessibility = new AccessibilitySystem();
            
            // 성능 시스템 (씬과 카메라가 필요하므로 나중에 초기화)
            this.lodSystem = null;
            this.objectPooling = new ObjectPoolingSystem();
            this.memoryManager = new MemoryManager();
            
            this.updateLoadingProgress(40);
            
        } catch (error) {
            console.error('시스템 초기화 실패:', error);
            throw error;
        }
    }
    
    /**
     * 에셋 로드
     */
    async loadAssets() {
        try {
            console.log('📦 에셋 로딩 시작...');
            
            // GLB 모델 로드
            await this.loadGLBModels();
            this.updateLoadingProgress(60);
            
            // 텍스처 및 재질 로드
            await this.loadMaterials();
            this.updateLoadingProgress(70);
            
            // 오디오 에셋 로드
            await this.loadAudioAssets();
            this.updateLoadingProgress(80);
            
            // 파티클 텍스처 로드
            await this.loadParticleTextures();
            this.updateLoadingProgress(90);
            
            console.log('✅ 모든 에셋 로딩 완료');
            
        } catch (error) {
            console.error('에셋 로드 실패:', error);
            // 에셋 로드 실패 시에도 게임을 계속 진행할 수 있도록 처리
            this.updateLoadingProgress(100);
        }
    }
    
    /**
     * GLB 모델 로드
     */
    async loadGLBModels() {
        try {
            console.log('🎭 GLB 모델 로딩 시작...');
            
            // 캐릭터 애니메이션 모델들 로드
            const modelPaths = [
                { path: '/games/cake-delivery/anim/glbs/idle.glb', name: 'character_idle' },
                { path: '/games/cake-delivery/anim/glbs/pushing.glb', name: 'character_pushing' },
                { path: '/games/cake-delivery/anim/glbs/pulling.glb', name: 'character_pulling' }
            ];
            
            const loadPromises = modelPaths.map(async ({ path, name }) => {
                try {
                    await this.modelManager.loadModel(path, name);
                    console.log(`✅ 모델 로드 완료: ${name}`);
                } catch (error) {
                    console.warn(`⚠️ 모델 로드 실패: ${name}`, error);
                }
            });
            
            await Promise.all(loadPromises);
            console.log('🎭 GLB 모델 로딩 완료');
            
        } catch (error) {
            console.error('❌ GLB 모델 로딩 실패:', error);
        }
    }
    
    /**
     * 재질 로드
     */
    async loadMaterials() {
        try {
            console.log('🎨 재질 로딩 시작...');
            
            // 케이크 타입별 재질 생성
            Object.keys(this.cakeProperties).forEach(cakeType => {
                this.materialSystem.createCakeMaterial(cakeType);
            });
            
            console.log('🎨 재질 로딩 완료');
            
        } catch (error) {
            console.error('❌ 재질 로딩 실패:', error);
        }
    }
    
    /**
     * 오디오 에셋 로드
     */
    async loadAudioAssets() {
        try {
            console.log('🎵 오디오 에셋 로딩 시작...');
            
            // 음악 시스템 초기화
            if (this.musicSystem) {
                await this.musicSystem.loadMusicLayers();
            }
            
            // 공간 오디오 시스템 초기화
            if (this.spatialAudio) {
                await this.spatialAudio.loadSoundEffects();
            }
            
            console.log('🎵 오디오 에셋 로딩 완료');
            
        } catch (error) {
            console.error('❌ 오디오 에셋 로딩 실패:', error);
        }
    }
    
    /**
     * 파티클 텍스처 로드
     */
    async loadParticleTextures() {
        try {
            console.log('✨ 파티클 텍스처 로딩 시작...');
            
            // 파티클 시스템 텍스처 로드
            if (this.particleSystem) {
                await this.particleSystem.loadTextures();
            }
            
            console.log('✨ 파티클 텍스처 로딩 완료');
            
        } catch (error) {
            console.error('❌ 파티클 텍스처 로딩 실패:', error);
        }
    }
    
    /**
     * 씬 구성
     */
    setupScene() {
        // 조명 설정
        this.setupLights();
        
        // 환경 오브젝트 생성
        this.createEnvironment();
        
        // 케이크 생성
        this.createCake();
        
        // 캐릭터 생성
        this.createCharacter();
        
        // LOD 시스템 초기화 (씬과 카메라가 준비된 후)
        this.initLODSystem();
    }
    
    /**
     * LOD 시스템 초기화
     */
    initLODSystem() {
        try {
            this.lodSystem = new LODSystem(this.scene, this.camera);
            
            // 환경 오브젝트들을 LOD 시스템에 등록
            this.environment.forEach(obj => {
                if (obj.geometry && obj.material) {
                    this.lodSystem.registerLODObject(obj);
                }
            });
            
            // 케이크를 LOD 시스템에 등록
            if (this.cake) {
                this.lodSystem.registerLODObject(this.cake);
            }
            
            // 캐릭터를 LOD 시스템에 등록
            if (this.character) {
                this.lodSystem.registerLODObject(this.character);
            }
            
            console.log('✅ LOD 시스템 초기화 및 오브젝트 등록 완료');
            
        } catch (error) {
            console.warn('⚠️ LOD 시스템 초기화 실패:', error);
        }
    }
    
    /**
     * 조명 설정
     */
    setupLights() {
        // 고급 조명 시스템 초기화
        if (this.lightingSystem) {
            this.lightingSystem.init();
            
            // 게임 특화 조명 추가
            this.setupGameSpecificLights();
        }
    }
    
    /**
     * 게임 특화 조명 설정
     */
    setupGameSpecificLights() {
        // 케이크 하이라이트 조명
        this.lightingSystem.createSpotLight('cake_highlight', {
            color: 0xFFE4B5,
            intensity: 0.8,
            distance: 10,
            angle: Math.PI / 6,
            penumbra: 0.3,
            position: [0, 8, 3],
            target: [0, 1, 0],
            castShadow: true
        });
        
        // 캐릭터 림 라이트
        this.lightingSystem.createDirectionalLight('character_rim', {
            color: 0x87CEEB,
            intensity: 0.4,
            position: [-3, 6, -2],
            target: [-2, 0, 0],
            castShadow: false
        });
        
        // 조명 그룹 생성
        this.lightingSystem.createLightGroup('main_lights', ['sun', 'fill', 'cake_highlight']);
        this.lightingSystem.createLightGroup('ambient_lights', ['ambient', 'hemisphere']);
        
        // 조명 애니메이션 추가
        this.lightingSystem.addLightAnimation('cake_highlight', 'pulse', {
            speed: 1.5,
            amount: 0.3
        });
        
        console.log('🎮 게임 특화 조명 설정 완료');
    }
    
    /**
     * 환경 생성
     */
    createEnvironment() {
        // 바닥 생성 (PBR 재질 사용)
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = this.materialSystem.createEnvironmentMaterial('ground', {
            color: 0x88AA88,
            roughness: 0.8,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        floor.position.y = -0.5;
        this.scene.add(floor);
        this.environment.push(floor);
        
        // 배경 벽 생성
        this.createBackgroundWalls();
        
        // 장식 요소 추가
        this.createDecorations();
        
        // 물리 바닥 생성
        this.physicsManager.createGround();
    }
    
    /**
     * 배경 벽 생성
     */
    createBackgroundWalls() {
        // 뒷벽
        const backWallGeometry = new THREE.PlaneGeometry(50, 20);
        const backWallMaterial = this.materialSystem.createEnvironmentMaterial('wall', {
            color: 0xE6E6FA,
            roughness: 0.7,
            metalness: 0.0
        });
        const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
        backWall.position.set(0, 10, -25);
        backWall.receiveShadow = true;
        this.scene.add(backWall);
        this.environment.push(backWall);
        
        // 좌측 벽
        const leftWallGeometry = new THREE.PlaneGeometry(50, 20);
        const leftWallMaterial = this.materialSystem.createEnvironmentMaterial('wall', {
            color: 0xF0F8FF,
            roughness: 0.6,
            metalness: 0.0
        });
        const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
        leftWall.position.set(-25, 10, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);
        this.environment.push(leftWall);
        
        // 우측 벽
        const rightWallGeometry = new THREE.PlaneGeometry(50, 20);
        const rightWallMaterial = this.materialSystem.createEnvironmentMaterial('wall', {
            color: 0xFFF8DC,
            roughness: 0.6,
            metalness: 0.0
        });
        const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
        rightWall.position.set(25, 10, 0);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
        this.environment.push(rightWall);
    }
    
    /**
     * 장식 요소 생성
     */
    createDecorations() {
        // 금속 기둥들
        for (let i = 0; i < 4; i++) {
            const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 16);
            const pillarMaterial = this.materialSystem.createEnvironmentMaterial('metal', {
                color: 0xC0C0C0,
                roughness: 0.3,
                metalness: 0.8
            });
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            
            const angle = (i / 4) * Math.PI * 2;
            pillar.position.set(
                Math.cos(angle) * 15,
                4,
                Math.sin(angle) * 15
            );
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.scene.add(pillar);
            this.environment.push(pillar);
        }
        
        // 나무 상자들
        for (let i = 0; i < 3; i++) {
            const boxGeometry = new THREE.BoxGeometry(2, 1.5, 2);
            const boxMaterial = this.materialSystem.createEnvironmentMaterial('wood', {
                color: 0x8B4513,
                roughness: 0.8,
                metalness: 0.0
            });
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            
            box.position.set(
                (Math.random() - 0.5) * 20,
                0.75,
                (Math.random() - 0.5) * 20
            );
            box.castShadow = true;
            box.receiveShadow = true;
            this.scene.add(box);
            this.environment.push(box);
        }
        
        console.log('🏗️ 환경 장식 요소 생성 완료');
    }
    
    /**
     * 케이크 생성
     */
    createCake() {
        const cakeProps = this.cakeProperties[this.cakeType];
        
        // 3D 케이크 모델 생성
        const cakeGroup = new THREE.Group();
        
        // 케이크 바닥 부분
        const baseGeometry = new THREE.CylinderGeometry(1, 1, 0.3, 32);
        const baseMaterial = this.materialSystem.createCakeMaterial(this.cakeType);
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.15;
        base.castShadow = true;
        base.receiveShadow = true;
        cakeGroup.add(base);
        
        // 케이크 중간 부분
        const middleGeometry = new THREE.CylinderGeometry(0.8, 1, 0.4, 32);
        const middleMaterial = this.materialSystem.createCakeMaterial(this.cakeType, 0.3);
        const middle = new THREE.Mesh(middleGeometry, middleMaterial);
        middle.position.y = 0.5;
        middle.castShadow = true;
        middle.receiveShadow = true;
        cakeGroup.add(middle);
        
        // 케이크 상단 부분
        const topGeometry = new THREE.CylinderGeometry(0.6, 0.8, 0.3, 32);
        const topMaterial = this.materialSystem.createCakeMaterial(this.cakeType, 0.5);
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 0.85;
        top.castShadow = true;
        top.receiveShadow = true;
        cakeGroup.add(top);
        
        cakeGroup.position.set(0, 1, 0);
        this.scene.add(cakeGroup);
        this.cake = cakeGroup;
        
        // 물리 바디 생성
        const cakeBody = this.physicsManager.createCakeBody(this.cakeType, new THREE.Vector3(0, 1, 0), {
            mass: cakeProps.mass,
            size: [1, 1, 1]
        });
        
        // 메시와 바디 연결
        this.physicsManager.linkMeshToBody(cakeGroup, cakeBody);
        
        console.log(`🎂 케이크 생성 완료: ${this.cakeType}`);
    }
    
    /**
     * 캐릭터 생성
     */
    async createCharacter() {
        try {
            console.log('👤 캐릭터 생성 시작...');
            
            // 기본 idle 모델 로드 및 설정
            const idleModel = this.modelManager.getModel('character_idle');
            if (idleModel) {
                this.character = idleModel.clone();
                this.character.scale.set(1, 1, 1);
                this.character.position.set(-2, 0, 0);
                this.scene.add(this.character);
                
                // 그림자 설정
                this.character.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // 애니메이션 시스템에 캐릭터 등록
                await this.setupCharacterAnimations();
                
                console.log('✅ 캐릭터 생성 완료');
            } else {
                console.warn('⚠️ 캐릭터 모델을 찾을 수 없습니다');
            }
        } catch (error) {
            console.error('❌ 캐릭터 생성 실패:', error);
        }
    }
    
    /**
     * 캐릭터 애니메이션 설정
     */
    async setupCharacterAnimations() {
        try {
            // 모든 애니메이션 모델에서 애니메이션 클립 수집
            const animationClips = [];
            
            // idle 애니메이션
            const idleGLTF = await this.loadGLTFForAnimations('/games/cake-delivery/anim/glbs/idle.glb');
            if (idleGLTF && idleGLTF.animations) {
                idleGLTF.animations.forEach(clip => {
                    clip.name = 'idle';
                    animationClips.push(clip);
                });
            }
            
            // pushing 애니메이션
            const pushingGLTF = await this.loadGLTFForAnimations('/games/cake-delivery/anim/glbs/pushing.glb');
            if (pushingGLTF && pushingGLTF.animations) {
                pushingGLTF.animations.forEach(clip => {
                    clip.name = 'pushing';
                    animationClips.push(clip);
                });
            }
            
            // pulling 애니메이션
            const pullingGLTF = await this.loadGLTFForAnimations('/games/cake-delivery/anim/glbs/pulling.glb');
            if (pullingGLTF && pullingGLTF.animations) {
                pullingGLTF.animations.forEach(clip => {
                    clip.name = 'pulling';
                    animationClips.push(clip);
                });
            }
            
            // 애니메이션 시스템에 캐릭터 등록
            if (animationClips.length > 0) {
                const characterInfo = this.animationSystem.registerCharacter('player', this.character, animationClips);
                
                // 기본 idle 애니메이션 재생
                this.animationSystem.playAnimation('player', 'idle', {
                    loop: THREE.LoopRepeat,
                    fadeIn: 0
                });
                
                // 애니메이션 이벤트 리스너 설정
                this.setupAnimationEvents();
                
                console.log(`🎬 캐릭터 애니메이션 설정 완료: ${animationClips.length}개 애니메이션`);
            }
            
        } catch (error) {
            console.error('❌ 캐릭터 애니메이션 설정 실패:', error);
        }
    }
    
    /**
     * GLTF 애니메이션 로드 (애니메이션 전용)
     */
    async loadGLTFForAnimations(path) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            loader.load(
                path,
                (gltf) => resolve(gltf),
                undefined,
                (error) => {
                    console.warn(`애니메이션 로드 실패: ${path}`, error);
                    resolve(null);
                }
            );
        });
    }
    
    /**
     * 애니메이션 이벤트 설정
     */
    setupAnimationEvents() {
        // 애니메이션 완료 이벤트
        this.animationSystem.addEventListener('player', 'animationFinished', (data) => {
            console.log(`🏁 애니메이션 완료: ${data.animationName}`);
            
            // 특정 애니메이션 완료 후 처리
            switch (data.animationName) {
                case 'pushing':
                case 'pulling':
                    // 움직임 애니메이션 완료 후 idle로 전환
                    this.animationSystem.playAnimation('player', 'idle');
                    break;
            }
        });
        
        // 애니메이션 루프 이벤트
        this.animationSystem.addEventListener('player', 'animationLoop', (data) => {
            // 필요시 루프 이벤트 처리
        });
    }
    
    /**
     * 캐릭터 애니메이션 상태 업데이트
     */
    updateCharacterAnimation() {
        if (!this.character || !this.animationSystem) return;
        
        // 게임 상태에 따른 애니메이션 전환
        let targetState = 'idle';
        
        // 센서 입력에 따른 애니메이션 결정
        if (this.smoothedTilt) {
            const tiltMagnitude = Math.sqrt(this.smoothedTilt.x ** 2 + this.smoothedTilt.y ** 2);
            
            if (tiltMagnitude > 10) {
                // 기울기가 클 때
                if (this.smoothedTilt.y > 5) {
                    targetState = 'pushing'; // 앞으로 기울임
                } else if (this.smoothedTilt.y < -5) {
                    targetState = 'pulling'; // 뒤로 기울임
                }
            }
        }
        
        // 스마트 애니메이션 전환
        this.animationSystem.smartTransition('player', targetState, {
            direction: targetState === 'pushing' ? 'forward' : targetState === 'pulling' ? 'backward' : 'idle'
        });
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 키보드 컨트롤 (테스트용)
        document.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    this.simulateTilt(-15, 0);
                    break;
                case 'ArrowRight':
                    this.simulateTilt(15, 0);
                    break;
                case 'ArrowUp':
                    this.simulateTilt(0, -15);
                    break;
                case 'ArrowDown':
                    this.simulateTilt(0, 15);
                    break;
                case ' ':
                    this.simulateShake();
                    break;
                case 'p':
                    this.togglePause();
                    break;
                case 'r':
                    this.restartGame();
                    break;
            }
        });
    }
    
    /**
     * 센서 데이터 처리
     */
    processSensorData(sensorData) {
        if (!sensorData || !sensorData.data) return;
        
        try {
            // 센서 데이터 처리 파이프라인
            // 1단계: 데이터 스무딩 (노이즈 제거)
            const smoothedData = this.sensorSmoothing.smoothSensorData(sensorData.data);
            
            // 2단계: 예측 처리 (지연 보상)
            const predictedData = this.sensorPrediction.predictNextValue(smoothedData, sensorData.timestamp);
            
            // 3단계: 게임 로직에 적용
            this.applySensorInput(predictedData);
            
        } catch (error) {
            console.error('센서 데이터 처리 오류:', error);
            // 오류 발생 시 기본 센서 데이터 사용
            this.applySensorInput(sensorData.data);
        }
    }
    
    /**
     * 센서 입력 적용
     */
    applySensorInput(sensorData) {
        if (!sensorData.orientation) return;
        
        const tiltX = Math.max(-90, Math.min(90, sensorData.orientation.gamma || 0));
        const tiltY = Math.max(-180, Math.min(180, sensorData.orientation.beta || 0));
        
        // 스무딩된 기울기 값 저장 (애니메이션용)
        this.smoothedTilt = { x: tiltX, y: tiltY };
        
        // 케이크 물리에 적용
        const cakeBody = this.physicsManager.getBody(`cake_${this.cakeType}`);
        if (cakeBody) {
            this.cakePhysics.applyCakePhysics(cakeBody, this.cakeType, { tiltX, tiltY });
        }
        
        // 진동 피드백
        if ('vibrate' in navigator && Math.abs(tiltX) > 30) {
            navigator.vibrate(50);
        }
    }
    
    /**
     * 테스트용 기울기 시뮬레이션
     */
    simulateTilt(tiltX, tiltY) {
        this.applySensorInput({
            orientation: { gamma: tiltX, beta: tiltY, alpha: 0 }
        });
    }
    
    /**
     * 테스트용 흔들기 시뮬레이션
     */
    simulateShake() {
        // 파티클 효과 생성
        this.particleSystem.createCelebrationEffect(this.cake.position);
        
        // 카메라 흔들림
        this.cameraShake = { intensity: 0.5, decay: 0.95 };
    }
    
    /**
     * 게임 업데이트
     */
    update() {
        const deltaTime = this.clock.getDelta();
        
        // 애니메이션 시스템은 게임 상태와 관계없이 항상 업데이트
        if (this.animationSystem) {
            this.animationSystem.update(deltaTime);
        }
        
        // 캐릭터 애니메이션 상태 업데이트
        this.updateCharacterAnimation();
        
        if (this.gameState !== 'playing') return;
        
        // 물리 시뮬레이션 업데이트
        this.physicsManager.step(deltaTime);
        
        // 환경 물리 업데이트
        if (this.environmentalPhysics) {
            this.environmentalPhysics.update(deltaTime);
        }
        
        // 조명 시스템 업데이트
        if (this.lightingSystem) {
            this.lightingSystem.update(deltaTime);
        }
        
        // 파티클 시스템 업데이트
        this.particleSystem.update(deltaTime);
        
        // LOD 시스템 업데이트
        if (this.lodSystem) {
            this.lodSystem.update();
        }
        
        // 카메라 흔들림 업데이트
        this.updateCameraShake();
        
        // 음악 시스템 업데이트
        this.musicSystem.updateIntensity(this.gameState);
        
        // 메모리 관리
        this.memoryManager.checkMemoryUsage();
    }
    
    /**
     * 카메라 흔들림 업데이트
     */
    updateCameraShake() {
        if (this.cameraShake.intensity > 0) {
            const shakeX = (Math.random() - 0.5) * this.cameraShake.intensity;
            const shakeY = (Math.random() - 0.5) * this.cameraShake.intensity;
            
            this.camera.position.x += shakeX;
            this.camera.position.y += shakeY;
            
            this.cameraShake.intensity *= this.cameraShake.decay;
            
            if (this.cameraShake.intensity < 0.01) {
                this.cameraShake.intensity = 0;
            }
        }
    }
    
    /**
     * 렌더링
     */
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    /**
     * 애니메이션 루프
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.update();
        this.render();
    }
    
    /**
     * 게임 시작
     */
    startGame() {
        this.gameState = 'playing';
        console.log('🎮 게임 시작!');
    }
    
    /**
     * 게임 재시작
     */
    restartGame() {
        this.gameState = 'menu';
        this.score = 0;
        this.level = 1;
        this.timeLeft = this.timer;
        
        // 케이크 위치 초기화
        if (this.cake) {
            this.cake.position.set(0, 1, 0);
            this.cake.rotation.set(0, 0, 0);
        }
        
        // 물리 바디 초기화
        this.physicsManager.resetCakeBody();
        
        console.log('🔄 게임 재시작');
    }
    
    /**
     * 게임 일시정지/재개
     */
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            console.log('⏸️ 게임 일시정지');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            console.log('▶️ 게임 재개');
        }
    }
    
    /**
     * 로딩 진행률 업데이트
     */
    updateLoadingProgress(progress) {
        this.loadingProgress = progress;
        const progressBar = document.getElementById('loadingProgressBar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }
    
    /**
     * 로딩 화면 숨기기
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
    
    /**
     * 오류 표시
     */
    showError(message) {
        console.error('게임 오류:', message);
        alert(message);
    }
    
    /**
     * 충돌 시스템 이벤트 리스너 설정
     */
    setupCollisionEventListeners() {
        if (!this.collisionSystem) return;
        
        // 케이크 손상 이벤트
        this.collisionSystem.addEventListener('cakeDamage', (data) => {
            console.log(`🎂💥 케이크 손상: ${data.damage} (총 ${data.totalDamage})`);
            
            // 파티클 효과 생성
            if (this.particleSystem) {
                this.particleSystem.createDamageEffect(data.body.position, data.damage);
            }
            
            // 카메라 흔들림
            this.cameraShake = { 
                intensity: Math.min(data.damage * 0.2, 1.0), 
                decay: 0.9 
            };
            
            // 점수 감소
            this.score = Math.max(0, this.score - data.damage * 10);
            
            // 케이크 파괴 확인
            if (data.totalDamage >= (data.body.userData?.maxDamage || 5)) {
                this.handleCakeDestroyed();
            }
        });
        
        // 캐릭터 착지 이벤트
        this.collisionSystem.addEventListener('characterLanded', (data) => {
            console.log(`👤⬇️ 캐릭터 착지: ${data.impactVelocity.toFixed(2)}`);
            
            // 착지 사운드 재생
            if (this.spatialAudio && data.impactVelocity > 1.0) {
                this.spatialAudio.playSound('footstep', data.body.position);
            }
        });
        
        // 캐릭터-케이크 상호작용 이벤트
        this.collisionSystem.addEventListener('characterCakeInteraction', (data) => {
            console.log(`👤🎂 캐릭터-케이크 상호작용: ${data.interactionType}`);
            
            if (data.interactionType === 'push') {
                // 밀기 애니메이션 트리거
                this.animationSystem.smartTransition('player', 'moving', {
                    direction: 'forward'
                });
            }
        });
        
        // 강한 충격 충돌 이벤트
        this.collisionSystem.addEventListener('highImpactCollision', (data) => {
            console.log(`💥💥 강한 충격 충돌: ${data.impactVelocity.toFixed(2)}`);
            
            // 강한 카메라 흔들림
            this.cameraShake = { 
                intensity: Math.min(data.impactVelocity * 0.3, 2.0), 
                decay: 0.85 
            };
            
            // 강한 파티클 효과
            if (this.particleSystem) {
                this.particleSystem.createExplosionEffect(data.contactPoint, data.impactVelocity);
            }
            
            // 강한 햅틱 피드백
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
        });
        
        // 충돌 사운드 재생 이벤트
        this.collisionSystem.addEventListener('playCollisionSound', (data) => {
            if (this.spatialAudio) {
                const soundType = this.getCollisionSoundType(data.collisionType);
                this.spatialAudio.playSound(soundType, data.position, {
                    volume: Math.min(data.intensity * 0.5, 1.0),
                    pitch: 1.0 + (Math.random() - 0.5) * 0.2
                });
            }
        });
        
        // 충돌 파티클 생성 이벤트
        this.collisionSystem.addEventListener('createCollisionParticles', (data) => {
            if (this.particleSystem) {
                const particleType = this.getCollisionParticleType(data.collisionType);
                this.particleSystem.createCollisionParticles(
                    data.position, 
                    particleType, 
                    data.intensity
                );
            }
        });
        
        // 카메라 흔들림 이벤트
        this.collisionSystem.addEventListener('cameraShake', (data) => {
            this.cameraShake = {
                intensity: data.intensity,
                decay: 0.9
            };
        });
        
        console.log('💥 충돌 시스템 이벤트 리스너 설정 완료');
    }
    
    /**
     * 충돌 타입에 따른 사운드 타입 반환
     * @param {string} collisionType - 충돌 타입
     * @returns {string} 사운드 타입
     */
    getCollisionSoundType(collisionType) {
        const soundMap = {
            'cake-ground': 'cake_drop',
            'cake-wall': 'cake_hit',
            'cake-cake': 'cake_squish',
            'character-ground': 'footstep',
            'character-cake': 'cake_touch',
            'environment': 'object_hit'
        };
        
        return soundMap[collisionType] || 'generic_hit';
    }
    
    /**
     * 충돌 타입에 따른 파티클 타입 반환
     * @param {string} collisionType - 충돌 타입
     * @returns {string} 파티클 타입
     */
    getCollisionParticleType(collisionType) {
        const particleMap = {
            'cake-ground': 'cake_crumbs',
            'cake-wall': 'impact_sparks',
            'cake-cake': 'cake_splash',
            'character-ground': 'dust',
            'character-cake': 'cake_bits',
            'environment': 'debris'
        };
        
        return particleMap[collisionType] || 'generic_impact';
    }
    
    /**
     * 케이크 파괴 처리
     */
    handleCakeDestroyed() {
        console.log('🎂💀 케이크 파괴됨!');
        
        // 게임 오버 상태로 전환
        this.gameState = 'gameOver';
        
        // 파괴 파티클 효과
        if (this.particleSystem && this.cake) {
            this.particleSystem.createDestructionEffect(this.cake.position);
        }
        
        // 슬픈 애니메이션
        if (this.animationSystem) {
            this.animationSystem.smartTransition('player', 'failing');
        }
        
        // 게임 오버 사운드
        if (this.spatialAudio) {
            this.spatialAudio.playSound('game_over');
        }
        
        // 강한 햅틱 피드백
        if ('vibrate' in navigator) {
            navigator.vibrate([300, 200, 300, 200, 500]);
        }
    }
    
    /**
     * 정리
     */
    cleanup() {
        // 이벤트 리스너 제거
        document.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('resize', this.handleResize);
        
        // 시스템 정리
        if (this.memoryManager) {
            this.memoryManager.performCleanup();
        }
        
        if (this.musicSystem) {
            this.musicSystem.stop();
        }
        
        if (this.physicsManager) {
            this.physicsManager.cleanup();
        }
        
        console.log('🧹 게임 엔진 정리 완료');
    }
}