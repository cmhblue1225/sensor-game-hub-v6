/**
 * 물리 월드 관리자
 * Cannon.js 물리 엔진을 사용하여 물리 시뮬레이션을 관리
 */
class PhysicsWorldManager {
    constructor() {
        // 물리 월드
        this.world = null;
        
        // 물리 바디들
        this.bodies = new Map();
        
        // 메시와 바디 연결
        this.meshBodyLinks = new Map();
        
        // 재질들
        this.materials = new Map();
        
        // 접촉 재질들
        this.contactMaterials = new Map();
        
        // 물리 설정
        this.config = {
            gravity: [0, -9.82, 0],
            broadphase: 'naive',
            solver: {
                iterations: 10,
                tolerance: 1e-4
            },
            allowSleep: true,
            sleepSpeedLimit: 0.1,
            sleepTimeLimit: 1,
            defaultContactMaterial: {
                friction: 0.4,
                restitution: 0.3,
                contactEquationStiffness: 1e8,
                contactEquationRelaxation: 3,
                frictionEquationStiffness: 1e8,
                frictionEquationRelaxation: 3
            }
        };
        
        // 성능 모니터링
        this.performance = {
            stepTime: 0,
            bodyCount: 0,
            contactCount: 0
        };
        
        // 초기화
        this.init();
        
        console.log('🌍 물리 월드 관리자 초기화 완료');
    }
    
    /**
     * 물리 월드 초기화
     */
    init() {
        // 물리 월드 생성
        this.world = new CANNON.World();
        
        // 중력 설정
        this.world.gravity.set(...this.config.gravity);
        
        // 브로드페이즈 설정
        this.setBroadphase(this.config.broadphase);
        
        // 솔버 설정
        this.world.solver.iterations = this.config.solver.iterations;
        this.world.solver.tolerance = this.config.solver.tolerance;
        
        // 슬립 설정
        this.world.allowSleep = this.config.allowSleep;
        this.world.sleepSpeedLimit = this.config.sleepSpeedLimit;
        this.world.sleepTimeLimit = this.config.sleepTimeLimit;
        
        // 기본 재질 생성
        this.createDefaultMaterials();
        
        // 접촉 재질 생성
        this.createContactMaterials();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        console.log('✅ 물리 월드 초기화 완료');
    }
    
    /**
     * 브로드페이즈 설정
     */
    setBroadphase(type) {
        switch (type) {
            case 'naive':
                this.world.broadphase = new CANNON.NaiveBroadphase();
                break;
            case 'sap':
                this.world.broadphase = new CANNON.SAPBroadphase(this.world);
                break;
            case 'grid':
                this.world.broadphase = new CANNON.GridBroadphase();
                break;
            default:
                this.world.broadphase = new CANNON.NaiveBroadphase();
        }
        
        console.log(`🔍 브로드페이즈 설정: ${type}`);
    }
    
    /**
     * 기본 재질 생성
     */
    createDefaultMaterials() {
        const defaultMaterial = new CANNON.Material('default');
        this.materials.set('default', defaultMaterial);
        
        const groundMaterial = new CANNON.Material('ground');
        this.materials.set('ground', groundMaterial);
        
        const cakeMaterial = new CANNON.Material('cake');
        this.materials.set('cake', cakeMaterial);
        
        const characterMaterial = new CANNON.Material('character');
        this.materials.set('character', characterMaterial);
        
        const wallMaterial = new CANNON.Material('wall');
        this.materials.set('wall', wallMaterial);
        
        console.log('🧪 기본 재질 생성 완료');
    }
    
    /**
     * 접촉 재질 생성
     */
    createContactMaterials() {
        const defaultConfig = this.config.defaultContactMaterial;
        
        // 케이크-바닥 접촉
        const cakeGroundContact = new CANNON.ContactMaterial(
            this.materials.get('cake'),
            this.materials.get('ground'),
            {
                friction: 0.6,
                restitution: 0.1,
                contactEquationStiffness: defaultConfig.contactEquationStiffness,
                contactEquationRelaxation: defaultConfig.contactEquationRelaxation
            }
        );
        this.world.addContactMaterial(cakeGroundContact);
        this.contactMaterials.set('cake-ground', cakeGroundContact);
        
        console.log('🤝 접촉 재질 생성 완료');
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        this.world.addEventListener('beginContact', (event) => {
            this.handleCollisionBegin(event);
        });
        
        this.world.addEventListener('endContact', (event) => {
            this.handleCollisionEnd(event);
        });
        
        this.world.addEventListener('preStep', () => {
            this.handlePreStep();
        });
        
        this.world.addEventListener('postStep', () => {
            this.handlePostStep();
        });
    }
    
    /**
     * 충돌 시작 처리
     */
    handleCollisionBegin(event) {
        const contact = event.contact;
        const bodyA = contact.bi;
        const bodyB = contact.bj;
        
        const nameA = bodyA.userData?.name || 'unknown';
        const nameB = bodyB.userData?.name || 'unknown';
        
        console.log(`💥 충돌 시작: ${nameA} ↔ ${nameB}`);
    }
    
    /**
     * 충돌 종료 처리
     */
    handleCollisionEnd(event) {
        const contact = event.contact;
        const bodyA = contact.bi;
        const bodyB = contact.bj;
        
        const nameA = bodyA.userData?.name || 'unknown';
        const nameB = bodyB.userData?.name || 'unknown';
        
        console.log(`🔚 충돌 종료: ${nameA} ↔ ${nameB}`);
    }
    
    /**
     * 사전 스텝 처리
     */
    handlePreStep() {
        this.performance.stepStartTime = performance.now();
    }
    
    /**
     * 사후 스텝 처리
     */
    handlePostStep() {
        if (this.performance.stepStartTime) {
            this.performance.stepTime = performance.now() - this.performance.stepStartTime;
        }
        
        this.performance.bodyCount = this.world.bodies.length;
        this.performance.contactCount = this.world.contacts.length;
        
        this.syncMeshesToBodies();
    }
    
    /**
     * 바닥 생성
     */
    createGround(options = {}) {
        const {
            size = [100, 1, 100],
            position = [0, -0.5, 0],
            material = 'ground'
        } = options;
        
        const groundShape = new CANNON.Box(new CANNON.Vec3(size[0]/2, size[1]/2, size[2]/2));
        
        const groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape,
            position: new CANNON.Vec3(...position),
            material: this.materials.get(material)
        });
        
        groundBody.userData = {
            name: 'ground',
            type: 'static'
        };
        
        this.world.addBody(groundBody);
        this.bodies.set('ground', groundBody);
        
        console.log('🏔️ 바닥 생성 완료');
        return groundBody;
    }
    
    /**
     * 케이크 바디 생성
     */
    createCakeBody(cakeType, position, options = {}) {
        const {
            mass = 1.0,
            size = [1, 1, 1],
            material = 'cake'
        } = options;
        
        const cakeShape = new CANNON.Cylinder(size[0], size[0], size[1], 8);
        
        const cakeBody = new CANNON.Body({
            mass,
            shape: cakeShape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.materials.get(material)
        });
        
        cakeBody.userData = {
            name: `cake_${cakeType}`,
            type: 'dynamic',
            cakeType,
            damage: 0,
            maxDamage: 3
        };
        
        this.world.addBody(cakeBody);
        this.bodies.set(`cake_${cakeType}`, cakeBody);
        
        console.log(`🎂 케이크 바디 생성: ${cakeType}`);
        return cakeBody;
    }
    
    /**
     * 메시와 바디 연결
     */
    linkMeshToBody(mesh, body) {
        this.meshBodyLinks.set(mesh, body);
        console.log(`🔗 메시-바디 연결: ${body.userData?.name || 'unknown'}`);
    }
    
    /**
     * 메시와 바디 동기화
     */
    syncMeshesToBodies() {
        this.meshBodyLinks.forEach((body, mesh) => {
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);
        });
    }
    
    /**
     * 물리 시뮬레이션 스텝
     */
    step(deltaTime) {
        const fixedTimeStep = 1/60;
        const maxSubSteps = 3;
        
        this.world.step(fixedTimeStep, deltaTime, maxSubSteps);
    }
    
    /**
     * 바디 가져오기
     */
    getBody(name) {
        return this.bodies.get(name) || null;
    }
    
    /**
     * 케이크 바디 초기화
     */
    resetCakeBody() {
        const cakeBody = this.bodies.get('cake_basic');
        if (cakeBody) {
            cakeBody.position.set(0, 1, 0);
            cakeBody.velocity.set(0, 0, 0);
            cakeBody.angularVelocity.set(0, 0, 0);
            cakeBody.quaternion.set(0, 0, 0, 1);
            
            if (cakeBody.userData) {
                cakeBody.userData.damage = 0;
            }
            
            console.log('🔄 케이크 바디 초기화');
        }
    }
    
    /**
     * 디버그 정보 반환
     */
    getDebugInfo() {
        return {
            worldBodies: this.world.bodies.length,
            worldContacts: this.world.contacts.length,
            managedBodies: this.bodies.size,
            meshLinks: this.meshBodyLinks.size,
            gravity: this.config.gravity,
            performance: this.performance
        };
    }
    
    /**
     * 정리
     */
    cleanup() {
        console.log('🧹 물리 월드 관리자 정리 시작...');
        
        this.bodies.forEach((body, name) => {
            this.world.removeBody(body);
        });
        this.bodies.clear();
        
        this.meshBodyLinks.clear();
        this.materials.clear();
        this.contactMaterials.clear();
        
        if (this.world) {
            this.world.bodies.length = 0;
            this.world.contacts.length = 0;
        }
        
        console.log('✅ 물리 월드 관리자 정리 완료');
    }
}