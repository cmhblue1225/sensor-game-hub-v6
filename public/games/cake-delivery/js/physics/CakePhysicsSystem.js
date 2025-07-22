/**
 * 케이크 물리 시스템
 * 케이크의 특별한 물리 특성과 센서 입력에 따른 물리 반응을 관리
 */
class CakePhysicsSystem {
    constructor() {
        // 케이크 타입별 물리 속성
        this.cakeProperties = {
            basic: {
                mass: 1.0,
                friction: 0.5,
                restitution: 0.2,
                wobbleStrength: 1.0,
                stabilityFactor: 0.8,
                tiltSensitivity: 1.0,
                maxTiltForce: 5.0
            },
            strawberry: {
                mass: 0.8,
                friction: 0.7,
                restitution: 0.1,
                wobbleStrength: 0.8,
                stabilityFactor: 0.9,
                tiltSensitivity: 1.2,
                maxTiltForce: 4.0
            },
            chocolate: {
                mass: 1.2,
                friction: 0.4,
                restitution: 0.1,
                wobbleStrength: 0.7,
                stabilityFactor: 0.7,
                tiltSensitivity: 0.8,
                maxTiltForce: 6.0
            },
            wedding: {
                mass: 1.5,
                friction: 0.3,
                restitution: 0.05,
                wobbleStrength: 0.5,
                stabilityFactor: 0.6,
                tiltSensitivity: 0.6,
                maxTiltForce: 3.0
            },
            ice: {
                mass: 0.7,
                friction: 0.1,
                restitution: 0.8,
                wobbleStrength: 1.5,
                stabilityFactor: 0.4,
                tiltSensitivity: 1.5,
                maxTiltForce: 8.0
            },
            bomb: {
                mass: 2.0,
                friction: 0.6,
                restitution: 0.4,
                wobbleStrength: 2.0,
                stabilityFactor: 0.5,
                tiltSensitivity: 1.3,
                maxTiltForce: 10.0
            }
        };
        
        // 물리 상태
        this.physicsState = {
            currentTilt: { x: 0, y: 0 },
            previousTilt: { x: 0, y: 0 },
            tiltVelocity: { x: 0, y: 0 },
            wobblePhase: 0,
            stabilityTimer: 0,
            isStable: true
        };
        
        // 센서 입력 필터링
        this.sensorFilter = {
            deadZone: 2.0, // 데드존 (도)
            maxTilt: 45.0, // 최대 기울기 (도)
            smoothingFactor: 0.8, // 스무딩 계수
            velocityThreshold: 30.0 // 속도 임계값 (도/초)
        };
        
        // 물리 효과
        this.effects = {
            wobble: {
                enabled: true,
                frequency: 2.0,
                amplitude: 0.1,
                decay: 0.95
            },
            stability: {
                enabled: true,
                restoreForce: 2.0,
                dampingFactor: 0.9,
                stabilityThreshold: 5.0
            },
            wind: {
                enabled: false,
                strength: 0.0,
                direction: { x: 1, y: 0, z: 0 },
                turbulence: 0.1
            }
        };
        
        // 성능 설정
        this.performance = {
            updateFrequency: 60, // Hz
            lastUpdateTime: 0,
            skipFrames: 0
        };
        
        console.log('🎂 케이크 물리 시스템 초기화 완료');
    }
    
    /**
     * 케이크 물리 적용
     * @param {CANNON.Body} cakeBody - 케이크 물리 바디\n     * @param {string} cakeType - 케이크 타입\n     * @param {Object} sensorInput - 센서 입력 데이터\n     */\n    applyCakePhysics(cakeBody, cakeType, sensorInput) {\n        if (!cakeBody || !sensorInput) return;\n        \n        const properties = this.cakeProperties[cakeType] || this.cakeProperties.basic;\n        \n        // 센서 입력 처리\n        const processedTilt = this.processSensorInput(sensorInput, properties);\n        \n        // 기울기 힘 적용\n        this.applyTiltForces(cakeBody, processedTilt, properties);\n        \n        // 흔들림 효과 적용\n        if (this.effects.wobble.enabled) {\n            this.applyWobbleEffect(cakeBody, properties);\n        }\n        \n        // 안정성 복원 힘 적용\n        if (this.effects.stability.enabled) {\n            this.applyStabilityForces(cakeBody, properties);\n        }\n        \n        // 환경 효과 적용\n        this.applyEnvironmentalEffects(cakeBody, properties);\n        \n        // 물리 상태 업데이트\n        this.updatePhysicsState(processedTilt);\n    }\n    \n    /**\n     * 센서 입력 처리\n     * @param {Object} sensorInput - 센서 입력\n     * @param {Object} properties - 케이크 속성\n     * @returns {Object} 처리된 기울기 데이터\n     */\n    processSensorInput(sensorInput, properties) {\n        let { tiltX, tiltY } = sensorInput;\n        \n        // 데드존 적용\n        if (Math.abs(tiltX) < this.sensorFilter.deadZone) tiltX = 0;\n        if (Math.abs(tiltY) < this.sensorFilter.deadZone) tiltY = 0;\n        \n        // 최대 기울기 제한\n        tiltX = Math.max(-this.sensorFilter.maxTilt, Math.min(this.sensorFilter.maxTilt, tiltX));\n        tiltY = Math.max(-this.sensorFilter.maxTilt, Math.min(this.sensorFilter.maxTilt, tiltY));\n        \n        // 스무딩 적용\n        const smoothingFactor = this.sensorFilter.smoothingFactor;\n        tiltX = this.physicsState.currentTilt.x * smoothingFactor + tiltX * (1 - smoothingFactor);\n        tiltY = this.physicsState.currentTilt.y * smoothingFactor + tiltY * (1 - smoothingFactor);\n        \n        // 속도 계산\n        const deltaTime = 1/60; // 60fps 가정\n        const velocityX = (tiltX - this.physicsState.currentTilt.x) / deltaTime;\n        const velocityY = (tiltY - this.physicsState.currentTilt.y) / deltaTime;\n        \n        // 속도 제한\n        const clampedVelX = Math.max(-this.sensorFilter.velocityThreshold, \n                                   Math.min(this.sensorFilter.velocityThreshold, velocityX));\n        const clampedVelY = Math.max(-this.sensorFilter.velocityThreshold, \n                                   Math.min(this.sensorFilter.velocityThreshold, velocityY));\n        \n        return {\n            tiltX: tiltX * properties.tiltSensitivity,\n            tiltY: tiltY * properties.tiltSensitivity,\n            velocityX: clampedVelX,\n            velocityY: clampedVelY\n        };\n    }\n    \n    /**\n     * 기울기 힘 적용\n     * @param {CANNON.Body} cakeBody - 케이크 바디\n     * @param {Object} tiltData - 기울기 데이터\n     * @param {Object} properties - 케이크 속성\n     */\n    applyTiltForces(cakeBody, tiltData, properties) {\n        const { tiltX, tiltY } = tiltData;\n        \n        // 기울기를 힘으로 변환\n        const forceX = (tiltX / this.sensorFilter.maxTilt) * properties.maxTiltForce;\n        const forceZ = (tiltY / this.sensorFilter.maxTilt) * properties.maxTiltForce;\n        \n        // 힘 적용 (케이크 중심에서 약간 위쪽)\n        const forcePosition = new CANNON.Vec3(0, 0.5, 0);\n        const force = new CANNON.Vec3(forceX, 0, forceZ);\n        \n        cakeBody.applyForce(force, cakeBody.position.vadd(forcePosition));\n        \n        // 회전 토크도 적용 (더 현실적인 움직임)\n        const torque = new CANNON.Vec3(-forceZ * 0.1, 0, forceX * 0.1);\n        cakeBody.torque.vadd(torque, cakeBody.torque);\n    }\n    \n    /**\n     * 흔들림 효과 적용\n     * @param {CANNON.Body} cakeBody - 케이크 바디\n     * @param {Object} properties - 케이크 속성\n     */\n    applyWobbleEffect(cakeBody, properties) {\n        // 흔들림 위상 업데이트\n        this.physicsState.wobblePhase += this.effects.wobble.frequency * (1/60);\n        \n        // 케이크의 속도에 따른 흔들림 강도\n        const velocity = cakeBody.velocity.length();\n        const wobbleIntensity = Math.min(velocity * 0.1, 1.0) * properties.wobbleStrength;\n        \n        if (wobbleIntensity > 0.01) {\n            // 사인파 기반 흔들림\n            const wobbleX = Math.sin(this.physicsState.wobblePhase) * \n                           this.effects.wobble.amplitude * wobbleIntensity;\n            const wobbleZ = Math.cos(this.physicsState.wobblePhase * 1.3) * \n                           this.effects.wobble.amplitude * wobbleIntensity;\n            \n            // 흔들림 힘 적용\n            const wobbleForce = new CANNON.Vec3(wobbleX, 0, wobbleZ);\n            cakeBody.applyForce(wobbleForce, cakeBody.position);\n            \n            // 흔들림 감쇠\n            this.effects.wobble.amplitude *= this.effects.wobble.decay;\n        }\n    }\n    \n    /**\n     * 안정성 복원 힘 적용\n     * @param {CANNON.Body} cakeBody - 케이크 바디\n     * @param {Object} properties - 케이크 속성\n     */\n    applyStabilityForces(cakeBody, properties) {\n        // 케이크의 기울기 계산\n        const rotation = cakeBody.quaternion;\n        const euler = new CANNON.Vec3();\n        rotation.toEuler(euler);\n        \n        const tiltAngle = Math.sqrt(euler.x * euler.x + euler.z * euler.z);\n        \n        // 안정성 임계값 확인\n        if (tiltAngle > this.effects.stability.stabilityThreshold * Math.PI / 180) {\n            this.physicsState.isStable = false;\n            this.physicsState.stabilityTimer = 0;\n            \n            // 복원 토크 적용\n            const restoreStrength = this.effects.stability.restoreForce * properties.stabilityFactor;\n            const restoreTorque = new CANNON.Vec3(\n                -euler.x * restoreStrength,\n                0,\n                -euler.z * restoreStrength\n            );\n            \n            cakeBody.torque.vadd(restoreTorque, cakeBody.torque);\n            \n            // 각속도 감쇠\n            cakeBody.angularVelocity.scale(this.effects.stability.dampingFactor, cakeBody.angularVelocity);\n        } else {\n            // 안정 상태\n            this.physicsState.stabilityTimer += 1/60;\n            if (this.physicsState.stabilityTimer > 1.0) {\n                this.physicsState.isStable = true;\n            }\n        }\n    }\n    \n    /**\n     * 환경 효과 적용\n     * @param {CANNON.Body} cakeBody - 케이크 바디\n     * @param {Object} properties - 케이크 속성\n     */\n    applyEnvironmentalEffects(cakeBody, properties) {\n        // 바람 효과\n        if (this.effects.wind.enabled && this.effects.wind.strength > 0) {\n            const windForce = new CANNON.Vec3(\n                this.effects.wind.direction.x * this.effects.wind.strength,\n                0,\n                this.effects.wind.direction.z * this.effects.wind.strength\n            );\n            \n            // 난기류 추가\n            if (this.effects.wind.turbulence > 0) {\n                windForce.x += (Math.random() - 0.5) * this.effects.wind.turbulence;\n                windForce.z += (Math.random() - 0.5) * this.effects.wind.turbulence;\n            }\n            \n            // 케이크 질량에 반비례하는 바람 효과\n            windForce.scale(1 / properties.mass, windForce);\n            cakeBody.applyForce(windForce, cakeBody.position);\n        }\n        \n        // 공기 저항\n        const airResistance = 0.02;\n        const resistanceForce = cakeBody.velocity.clone();\n        resistanceForce.scale(-airResistance, resistanceForce);\n        cakeBody.applyForce(resistanceForce, cakeBody.position);\n    }\n    \n    /**\n     * 물리 상태 업데이트\n     * @param {Object} tiltData - 기울기 데이터\n     */\n    updatePhysicsState(tiltData) {\n        // 이전 기울기 저장\n        this.physicsState.previousTilt.x = this.physicsState.currentTilt.x;\n        this.physicsState.previousTilt.y = this.physicsState.currentTilt.y;\n        \n        // 현재 기울기 업데이트\n        this.physicsState.currentTilt.x = tiltData.tiltX;\n        this.physicsState.currentTilt.y = tiltData.tiltY;\n        \n        // 기울기 속도 업데이트\n        this.physicsState.tiltVelocity.x = tiltData.velocityX;\n        this.physicsState.tiltVelocity.y = tiltData.velocityY;\n    }\n    \n    /**\n     * 케이크 손상 처리\n     * @param {CANNON.Body} cakeBody - 케이크 바디\n     * @param {number} impactForce - 충격 힘\n     * @returns {Object} 손상 정보\n     */\n    processCakeDamage(cakeBody, impactForce) {\n        if (!cakeBody.userData) return null;\n        \n        const cakeType = cakeBody.userData.cakeType || 'basic';\n        const properties = this.cakeProperties[cakeType];\n        \n        // 손상 임계값 계산\n        const damageThreshold = 3.0 / properties.stabilityFactor;\n        \n        if (impactForce > damageThreshold) {\n            const damage = Math.floor((impactForce - damageThreshold) / 2.0) + 1;\n            cakeBody.userData.damage = (cakeBody.userData.damage || 0) + damage;\n            \n            // 손상에 따른 물리 속성 변화\n            const damageRatio = cakeBody.userData.damage / (cakeBody.userData.maxDamage || 5);\n            \n            // 안정성 감소\n            properties.stabilityFactor *= (1 - damageRatio * 0.3);\n            \n            // 흔들림 증가\n            properties.wobbleStrength *= (1 + damageRatio * 0.5);\n            \n            console.log(`🎂💥 케이크 손상: ${damage} (총 ${cakeBody.userData.damage})`);\n            \n            return {\n                damage,\n                totalDamage: cakeBody.userData.damage,\n                damageRatio,\n                isDestroyed: cakeBody.userData.damage >= (cakeBody.userData.maxDamage || 5)\n            };\n        }\n        \n        return null;\n    }\n    \n    /**\n     * 바람 효과 설정\n     * @param {boolean} enabled - 바람 활성화\n     * @param {number} strength - 바람 강도\n     * @param {Object} direction - 바람 방향\n     * @param {number} turbulence - 난기류 강도\n     */\n    setWindEffect(enabled, strength = 0, direction = { x: 1, y: 0, z: 0 }, turbulence = 0.1) {\n        this.effects.wind.enabled = enabled;\n        this.effects.wind.strength = strength;\n        this.effects.wind.direction = direction;\n        this.effects.wind.turbulence = turbulence;\n        \n        console.log(`💨 바람 효과 ${enabled ? '활성화' : '비활성화'}: 강도 ${strength}`);\n    }\n    \n    /**\n     * 흔들림 효과 설정\n     * @param {boolean} enabled - 흔들림 활성화\n     * @param {number} frequency - 흔들림 주파수\n     * @param {number} amplitude - 흔들림 진폭\n     */\n    setWobbleEffect(enabled, frequency = 2.0, amplitude = 0.1) {\n        this.effects.wobble.enabled = enabled;\n        this.effects.wobble.frequency = frequency;\n        this.effects.wobble.amplitude = amplitude;\n        \n        console.log(`🌊 흔들림 효과 ${enabled ? '활성화' : '비활성화'}`);\n    }\n    \n    /**\n     * 센서 필터 설정\n     * @param {Object} filterConfig - 필터 설정\n     */\n    setSensorFilter(filterConfig) {\n        Object.assign(this.sensorFilter, filterConfig);\n        console.log('📱 센서 필터 설정 업데이트:', filterConfig);\n    }\n    \n    /**\n     * 케이크 속성 커스터마이징\n     * @param {string} cakeType - 케이크 타입\n     * @param {Object} properties - 새로운 속성\n     */\n    customizeCakeProperties(cakeType, properties) {\n        if (this.cakeProperties[cakeType]) {\n            Object.assign(this.cakeProperties[cakeType], properties);\n            console.log(`🎂 케이크 속성 커스터마이징: ${cakeType}`, properties);\n        }\n    }\n    \n    /**\n     * 물리 상태 초기화\n     */\n    resetPhysicsState() {\n        this.physicsState = {\n            currentTilt: { x: 0, y: 0 },\n            previousTilt: { x: 0, y: 0 },\n            tiltVelocity: { x: 0, y: 0 },\n            wobblePhase: 0,\n            stabilityTimer: 0,\n            isStable: true\n        };\n        \n        // 흔들림 진폭 초기화\n        this.effects.wobble.amplitude = 0.1;\n        \n        console.log('🔄 물리 상태 초기화');\n    }\n    \n    /**\n     * 현재 물리 상태 반환\n     * @returns {Object}\n     */\n    getPhysicsState() {\n        return {\n            ...this.physicsState,\n            effects: { ...this.effects },\n            sensorFilter: { ...this.sensorFilter }\n        };\n    }\n    \n    /**\n     * 케이크 속성 반환\n     * @param {string} cakeType - 케이크 타입\n     * @returns {Object}\n     */\n    getCakeProperties(cakeType) {\n        return this.cakeProperties[cakeType] || this.cakeProperties.basic;\n    }\n    \n    /**\n     * 디버그 정보 반환\n     * @returns {Object}\n     */\n    getDebugInfo() {\n        return {\n            physicsState: this.physicsState,\n            effects: this.effects,\n            sensorFilter: this.sensorFilter,\n            cakeTypes: Object.keys(this.cakeProperties),\n            performance: this.performance\n        };\n    }\n}"