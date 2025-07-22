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
            broadphase: 'naive', // naive, sap, grid
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
        
        // 디버그 설정
        this.debug = {
            enabled: false,
            renderer: null,
            scene: null
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
     * @param {string} type - 브로드페이즈 타입
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
        // 기본 재질
        const defaultMaterial = new CANNON.Material('default');
        this.materials.set('default', defaultMaterial);
        
        // 바닥 재질
        const groundMaterial = new CANNON.Material('ground');
        this.materials.set('ground', groundMaterial);
        
        // 케이크 재질
        const cakeMaterial = new CANNON.Material('cake');
        this.materials.set('cake', cakeMaterial);
        
        // 캐릭터 재질
        const characterMaterial = new CANNON.Material('character');
        this.materials.set('character', characterMaterial);
        
        // 벽 재질
        const wallMaterial = new CANNON.Material('wall');
        this.materials.set('wall', wallMaterial);
        
        // 금속 재질
        const metalMaterial = new CANNON.Material('metal');
        this.materials.set('metal', metalMaterial);
        
        // 나무 재질
        const woodMaterial = new CANNON.Material('wood');
        this.materials.set('wood', woodMaterial);
        
        console.log('🧪 기본 재질 생성 완료');
    }
    
    /**
     * 접촉 재질 생성
     */
    createContactMaterials() {
        const defaultConfig = this.config.defaultContactMaterial;
        
        // 케이크-바닥 접촉
        const cakeGroundContact = new CANNON.ContactMaterial(\n            this.materials.get('cake'),\n            this.materials.get('ground'),\n            {\n                friction: 0.6,\n                restitution: 0.1,\n                contactEquationStiffness: defaultConfig.contactEquationStiffness,\n                contactEquationRelaxation: defaultConfig.contactEquationRelaxation\n            }\n        );\n        this.world.addContactMaterial(cakeGroundContact);\n        this.contactMaterials.set('cake-ground', cakeGroundContact);\n        \n        // 캐릭터-바닥 접촉\n        const characterGroundContact = new CANNON.ContactMaterial(\n            this.materials.get('character'),\n            this.materials.get('ground'),\n            {\n                friction: 0.8,\n                restitution: 0.0,\n                contactEquationStiffness: defaultConfig.contactEquationStiffness,\n                contactEquationRelaxation: defaultConfig.contactEquationRelaxation\n            }\n        );\n        this.world.addContactMaterial(characterGroundContact);\n        this.contactMaterials.set('character-ground', characterGroundContact);\n        \n        // 케이크-벽 접촉\n        const cakeWallContact = new CANNON.ContactMaterial(\n            this.materials.get('cake'),\n            this.materials.get('wall'),\n            {\n                friction: 0.3,\n                restitution: 0.5,\n                contactEquationStiffness: defaultConfig.contactEquationStiffness,\n                contactEquationRelaxation: defaultConfig.contactEquationRelaxation\n            }\n        );\n        this.world.addContactMaterial(cakeWallContact);\n        this.contactMaterials.set('cake-wall', cakeWallContact);\n        \n        // 케이크-케이크 접촉\n        const cakeCakeContact = new CANNON.ContactMaterial(\n            this.materials.get('cake'),\n            this.materials.get('cake'),\n            {\n                friction: 0.4,\n                restitution: 0.2,\n                contactEquationStiffness: defaultConfig.contactEquationStiffness,\n                contactEquationRelaxation: defaultConfig.contactEquationRelaxation\n            }\n        );\n        this.world.addContactMaterial(cakeCakeContact);\n        this.contactMaterials.set('cake-cake', cakeCakeContact);\n        \n        // 금속-바닥 접촉\n        const metalGroundContact = new CANNON.ContactMaterial(\n            this.materials.get('metal'),\n            this.materials.get('ground'),\n            {\n                friction: 0.2,\n                restitution: 0.8,\n                contactEquationStiffness: defaultConfig.contactEquationStiffness,\n                contactEquationRelaxation: defaultConfig.contactEquationRelaxation\n            }\n        );\n        this.world.addContactMaterial(metalGroundContact);\n        this.contactMaterials.set('metal-ground', metalGroundContact);\n        \n        console.log('🤝 접촉 재질 생성 완료');\n    }\n    \n    /**\n     * 이벤트 리스너 설정\n     */\n    setupEventListeners() {\n        // 충돌 시작 이벤트\n        this.world.addEventListener('beginContact', (event) => {\n            this.handleCollisionBegin(event);\n        });\n        \n        // 충돌 종료 이벤트\n        this.world.addEventListener('endContact', (event) => {\n            this.handleCollisionEnd(event);\n        });\n        \n        // 사전 충돌 이벤트\n        this.world.addEventListener('preStep', () => {\n            this.handlePreStep();\n        });\n        \n        // 사후 충돌 이벤트\n        this.world.addEventListener('postStep', () => {\n            this.handlePostStep();\n        });\n    }\n    \n    /**\n     * 충돌 시작 처리\n     * @param {Object} event - 충돌 이벤트\n     */\n    handleCollisionBegin(event) {\n        const contact = event.contact;\n        const bodyA = contact.bi;\n        const bodyB = contact.bj;\n        \n        // 바디 이름 가져오기\n        const nameA = bodyA.userData?.name || 'unknown';\n        const nameB = bodyB.userData?.name || 'unknown';\n        \n        console.log(`💥 충돌 시작: ${nameA} ↔ ${nameB}`);\n        \n        // 케이크 충돌 처리\n        if (nameA.includes('cake') || nameB.includes('cake')) {\n            this.handleCakeCollision(bodyA, bodyB, contact);\n        }\n        \n        // 캐릭터 충돌 처리\n        if (nameA.includes('character') || nameB.includes('character')) {\n            this.handleCharacterCollision(bodyA, bodyB, contact);\n        }\n    }\n    \n    /**\n     * 충돌 종료 처리\n     * @param {Object} event - 충돌 이벤트\n     */\n    handleCollisionEnd(event) {\n        const contact = event.contact;\n        const bodyA = contact.bi;\n        const bodyB = contact.bj;\n        \n        const nameA = bodyA.userData?.name || 'unknown';\n        const nameB = bodyB.userData?.name || 'unknown';\n        \n        console.log(`🔚 충돌 종료: ${nameA} ↔ ${nameB}`);\n    }\n    \n    /**\n     * 케이크 충돌 처리\n     * @param {CANNON.Body} bodyA - 바디 A\n     * @param {CANNON.Body} bodyB - 바디 B\n     * @param {CANNON.ContactEquation} contact - 접촉 정보\n     */\n    handleCakeCollision(bodyA, bodyB, contact) {\n        // 충돌 강도 계산\n        const impactVelocity = contact.getImpactVelocityAlongNormal();\n        \n        if (Math.abs(impactVelocity) > 2.0) {\n            // 강한 충돌 - 케이크 손상\n            console.log('🎂💥 케이크 강한 충돌!');\n            \n            // 케이크 바디 찾기\n            const cakeBody = bodyA.userData?.name?.includes('cake') ? bodyA : bodyB;\n            \n            if (cakeBody.userData) {\n                cakeBody.userData.damage = (cakeBody.userData.damage || 0) + 1;\n                \n                // 손상 이벤트 발생\n                this.dispatchEvent('cakeDamage', {\n                    body: cakeBody,\n                    damage: cakeBody.userData.damage,\n                    impactVelocity\n                });\n            }\n        }\n    }\n    \n    /**\n     * 캐릭터 충돌 처리\n     * @param {CANNON.Body} bodyA - 바디 A\n     * @param {CANNON.Body} bodyB - 바디 B\n     * @param {CANNON.ContactEquation} contact - 접촉 정보\n     */\n    handleCharacterCollision(bodyA, bodyB, contact) {\n        // 바닥 접촉 확인\n        const characterBody = bodyA.userData?.name?.includes('character') ? bodyA : bodyB;\n        const otherBody = characterBody === bodyA ? bodyB : bodyA;\n        \n        if (otherBody.userData?.name === 'ground') {\n            // 캐릭터가 바닥에 착지\n            if (characterBody.userData) {\n                characterBody.userData.isGrounded = true;\n            }\n        }\n    }\n    \n    /**\n     * 사전 스텝 처리\n     */\n    handlePreStep() {\n        // 성능 모니터링 시작\n        this.performance.stepStartTime = performance.now();\n    }\n    \n    /**\n     * 사후 스텝 처리\n     */\n    handlePostStep() {\n        // 성능 모니터링 종료\n        if (this.performance.stepStartTime) {\n            this.performance.stepTime = performance.now() - this.performance.stepStartTime;\n        }\n        \n        this.performance.bodyCount = this.world.bodies.length;\n        this.performance.contactCount = this.world.contacts.length;\n        \n        // 메시와 바디 동기화\n        this.syncMeshesToBodies();\n    }\n    \n    /**\n     * 바닥 생성\n     * @param {Object} options - 바닥 옵션\n     */\n    createGround(options = {}) {\n        const {\n            size = [100, 1, 100],\n            position = [0, -0.5, 0],\n            material = 'ground'\n        } = options;\n        \n        // 바닥 모양 생성\n        const groundShape = new CANNON.Box(new CANNON.Vec3(size[0]/2, size[1]/2, size[2]/2));\n        \n        // 바닥 바디 생성\n        const groundBody = new CANNON.Body({\n            mass: 0, // 정적 바디\n            shape: groundShape,\n            position: new CANNON.Vec3(...position),\n            material: this.materials.get(material)\n        });\n        \n        // 사용자 데이터 설정\n        groundBody.userData = {\n            name: 'ground',\n            type: 'static'\n        };\n        \n        // 월드에 추가\n        this.world.addBody(groundBody);\n        this.bodies.set('ground', groundBody);\n        \n        console.log('🏔️ 바닥 생성 완료');\n        return groundBody;\n    }\n    \n    /**\n     * 케이크 바디 생성\n     * @param {string} cakeType - 케이크 타입\n     * @param {THREE.Vector3} position - 위치\n     * @param {Object} options - 추가 옵션\n     */\n    createCakeBody(cakeType, position, options = {}) {\n        const {\n            mass = 1.0,\n            size = [1, 1, 1],\n            material = 'cake'\n        } = options;\n        \n        // 케이크 모양 생성 (복합 모양)\n        const cakeShape = new CANNON.Cylinder(size[0], size[0], size[1], 8);\n        \n        // 케이크 바디 생성\n        const cakeBody = new CANNON.Body({\n            mass,\n            shape: cakeShape,\n            position: new CANNON.Vec3(position.x, position.y, position.z),\n            material: this.materials.get(material)\n        });\n        \n        // 사용자 데이터 설정\n        cakeBody.userData = {\n            name: `cake_${cakeType}`,\n            type: 'dynamic',\n            cakeType,\n            damage: 0,\n            maxDamage: 3\n        };\n        \n        // 월드에 추가\n        this.world.addBody(cakeBody);\n        this.bodies.set(`cake_${cakeType}`, cakeBody);\n        \n        console.log(`🎂 케이크 바디 생성: ${cakeType}`);\n        return cakeBody;\n    }\n    \n    /**\n     * 캐릭터 바디 생성\n     * @param {THREE.Vector3} position - 위치\n     * @param {Object} options - 추가 옵션\n     */\n    createCharacterBody(position, options = {}) {\n        const {\n            mass = 70,\n            radius = 0.3,\n            height = 1.8,\n            material = 'character'\n        } = options;\n        \n        // 캐릭터 모양 생성 (캡슐)\n        const characterShape = new CANNON.Cylinder(radius, radius, height, 8);\n        \n        // 캐릭터 바디 생성\n        const characterBody = new CANNON.Body({\n            mass,\n            shape: characterShape,\n            position: new CANNON.Vec3(position.x, position.y, position.z),\n            material: this.materials.get(material)\n        });\n        \n        // 회전 제한 (캐릭터가 넘어지지 않도록)\n        characterBody.fixedRotation = true;\n        characterBody.updateMassProperties();\n        \n        // 감쇠 설정\n        characterBody.linearDamping = 0.9;\n        characterBody.angularDamping = 0.9;\n        \n        // 사용자 데이터 설정\n        characterBody.userData = {\n            name: 'character',\n            type: 'dynamic',\n            isGrounded: false\n        };\n        \n        // 월드에 추가\n        this.world.addBody(characterBody);\n        this.bodies.set('character', characterBody);\n        \n        console.log('👤 캐릭터 바디 생성 완료');\n        return characterBody;\n    }\n    \n    /**\n     * 박스 바디 생성\n     * @param {THREE.Vector3} position - 위치\n     * @param {Array} size - 크기 [x, y, z]\n     * @param {Object} options - 추가 옵션\n     */\n    createBoxBody(position, size, options = {}) {\n        const {\n            mass = 1.0,\n            material = 'default',\n            name = 'box'\n        } = options;\n        \n        // 박스 모양 생성\n        const boxShape = new CANNON.Box(new CANNON.Vec3(size[0]/2, size[1]/2, size[2]/2));\n        \n        // 박스 바디 생성\n        const boxBody = new CANNON.Body({\n            mass,\n            shape: boxShape,\n            position: new CANNON.Vec3(position.x, position.y, position.z),\n            material: this.materials.get(material)\n        });\n        \n        // 사용자 데이터 설정\n        boxBody.userData = {\n            name,\n            type: mass > 0 ? 'dynamic' : 'static'\n        };\n        \n        // 월드에 추가\n        this.world.addBody(boxBody);\n        this.bodies.set(name, boxBody);\n        \n        console.log(`📦 박스 바디 생성: ${name}`);\n        return boxBody;\n    }\n    \n    /**\n     * 메시와 바디 연결\n     * @param {THREE.Mesh} mesh - Three.js 메시\n     * @param {CANNON.Body} body - Cannon.js 바디\n     */\n    linkMeshToBody(mesh, body) {\n        this.meshBodyLinks.set(mesh, body);\n        console.log(`🔗 메시-바디 연결: ${body.userData?.name || 'unknown'}`);\n    }\n    \n    /**\n     * 메시와 바디 동기화\n     */\n    syncMeshesToBodies() {\n        this.meshBodyLinks.forEach((body, mesh) => {\n            // 위치 동기화\n            mesh.position.copy(body.position);\n            \n            // 회전 동기화\n            mesh.quaternion.copy(body.quaternion);\n        });\n    }\n    \n    /**\n     * 물리 시뮬레이션 스텝\n     * @param {number} deltaTime - 델타 시간\n     */\n    step(deltaTime) {\n        // 고정 시간 스텝 사용 (안정성을 위해)\n        const fixedTimeStep = 1/60;\n        const maxSubSteps = 3;\n        \n        this.world.step(fixedTimeStep, deltaTime, maxSubSteps);\n    }\n    \n    /**\n     * 바디 제거\n     * @param {string} name - 바디 이름\n     */\n    removeBody(name) {\n        const body = this.bodies.get(name);\n        if (body) {\n            this.world.removeBody(body);\n            this.bodies.delete(name);\n            \n            // 메시 연결도 제거\n            this.meshBodyLinks.forEach((linkedBody, mesh) => {\n                if (linkedBody === body) {\n                    this.meshBodyLinks.delete(mesh);\n                }\n            });\n            \n            console.log(`🗑️ 바디 제거: ${name}`);\n        }\n    }\n    \n    /**\n     * 바디 가져오기\n     * @param {string} name - 바디 이름\n     * @returns {CANNON.Body|null}\n     */\n    getBody(name) {\n        return this.bodies.get(name) || null;\n    }\n    \n    /**\n     * 케이크 바디 초기화\n     */\n    resetCakeBody() {\n        const cakeBody = this.bodies.get('cake_basic');\n        if (cakeBody) {\n            cakeBody.position.set(0, 1, 0);\n            cakeBody.velocity.set(0, 0, 0);\n            cakeBody.angularVelocity.set(0, 0, 0);\n            cakeBody.quaternion.set(0, 0, 0, 1);\n            \n            // 손상 초기화\n            if (cakeBody.userData) {\n                cakeBody.userData.damage = 0;\n            }\n            \n            console.log('🔄 케이크 바디 초기화');\n        }\n    }\n    \n    /**\n     * 중력 설정\n     * @param {Array} gravity - 중력 벡터 [x, y, z]\n     */\n    setGravity(gravity) {\n        this.world.gravity.set(...gravity);\n        this.config.gravity = gravity;\n        console.log(`🌍 중력 설정: [${gravity.join(', ')}]`);\n    }\n    \n    /**\n     * 디버그 렌더러 설정\n     * @param {THREE.Scene} scene - Three.js 씬\n     * @param {THREE.WebGLRenderer} renderer - Three.js 렌더러\n     */\n    setupDebugRenderer(scene, renderer) {\n        if (typeof CannonDebugRenderer !== 'undefined') {\n            this.debug.renderer = new CannonDebugRenderer(scene, this.world);\n            this.debug.scene = scene;\n            this.debug.enabled = true;\n            \n            console.log('🐛 물리 디버그 렌더러 설정 완료');\n        } else {\n            console.warn('⚠️ CannonDebugRenderer를 찾을 수 없습니다');\n        }\n    }\n    \n    /**\n     * 디버그 렌더링\n     */\n    debugRender() {\n        if (this.debug.enabled && this.debug.renderer) {\n            this.debug.renderer.update();\n        }\n    }\n    \n    /**\n     * 이벤트 발생\n     * @param {string} eventType - 이벤트 타입\n     * @param {Object} data - 이벤트 데이터\n     */\n    dispatchEvent(eventType, data) {\n        // 간단한 이벤트 시스템 (필요시 확장 가능)\n        console.log(`📡 물리 이벤트: ${eventType}`, data);\n    }\n    \n    /**\n     * 성능 정보 반환\n     * @returns {Object}\n     */\n    getPerformanceInfo() {\n        return {\n            ...this.performance,\n            worldBodies: this.world.bodies.length,\n            worldContacts: this.world.contacts.length,\n            managedBodies: this.bodies.size,\n            meshLinks: this.meshBodyLinks.size\n        };\n    }\n    \n    /**\n     * 정리\n     */\n    cleanup() {\n        console.log('🧹 물리 월드 관리자 정리 시작...');\n        \n        // 모든 바디 제거\n        this.bodies.forEach((body, name) => {\n            this.world.removeBody(body);\n        });\n        this.bodies.clear();\n        \n        // 메시 연결 정리\n        this.meshBodyLinks.clear();\n        \n        // 재질 정리\n        this.materials.clear();\n        this.contactMaterials.clear();\n        \n        // 월드 정리\n        if (this.world) {\n            this.world.bodies.length = 0;\n            this.world.contacts.length = 0;\n        }\n        \n        console.log('✅ 물리 월드 관리자 정리 완료');\n    }\n    \n    /**\n     * 디버그 정보 반환\n     * @returns {Object}\n     */\n    getDebugInfo() {\n        return {\n            worldBodies: this.world.bodies.length,\n            worldContacts: this.world.contacts.length,\n            managedBodies: this.bodies.size,\n            meshLinks: this.meshBodyLinks.size,\n            materials: Array.from(this.materials.keys()),\n            contactMaterials: Array.from(this.contactMaterials.keys()),\n            gravity: this.config.gravity,\n            performance: this.performance\n        };\n    }\n}"