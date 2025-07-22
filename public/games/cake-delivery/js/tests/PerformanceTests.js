/**
 * 케이크 배달 게임 성능 테스트
 * 다양한 모바일 기기에서의 성능을 측정하고 분석합니다.
 */

// 성능 테스트 스위트
describe('성능 테스트', () => {
    let gameEngine;
    let performanceMonitor;
    let testCanvas;
    
    beforeEach(() => {
        // 테스트용 캔버스 생성
        testCanvas = document.createElement('canvas');
        testCanvas.width = 800;
        testCanvas.height = 600;
        testCanvas.id = 'test-canvas';
        document.body.appendChild(testCanvas);
        
        // 게임 엔진 초기화
        gameEngine = new GameEngine();
        performanceMonitor = new PerformanceMonitor();
    });
    
    afterEach(() => {
        // 정리
        if (testCanvas && testCanvas.parentNode) {
            testCanvas.parentNode.removeChild(testCanvas);
        }
        
        if (gameEngine) {
            gameEngine.cleanup();
        }
        
        if (performanceMonitor) {
            performanceMonitor.stop();
        }
    });
    
    it('초기화 성능이 허용 범위 내에 있어야 함', async () => {
        const startTime = performance.now();
        
        await gameEngine.init(testCanvas);
        
        const initTime = performance.now() - startTime;
        
        // 초기화는 3초 이내에 완료되어야 함
        expect(initTime).toBeLessThan(3000);
        
        console.log(`게임 엔진 초기화 시간: ${initTime.toFixed(2)}ms`);
    });
    
    it('렌더링 성능이 30fps 이상을 유지해야 함', async () => {
        await gameEngine.init(testCanvas);
        
        const fpsData = [];
        let frameCount = 0;
        let lastTime = performance.now();
        
        // 5초 동안 FPS 측정
        const testDuration = 5000;
        const startTime = performance.now();
        
        return new Promise((resolve) => {
            const measureFPS = (currentTime) => {
                frameCount++;
                
                const elapsed = currentTime - lastTime;
                if (elapsed >= 1000) {
                    const fps = Math.round((frameCount * 1000) / elapsed);
                    fpsData.push(fps);
                    
                    frameCount = 0;
                    lastTime = currentTime;
                }
                
                // 렌더링 수행
                if (gameEngine.render) {
                    gameEngine.render();
                }
                
                if (currentTime - startTime < testDuration) {
                    requestAnimationFrame(measureFPS);
                } else {
                    // 평균 FPS 계산
                    const averageFPS = fpsData.reduce((sum, fps) => sum + fps, 0) / fpsData.length;
                    const minFPS = Math.min(...fpsData);
                    
                    console.log(`평균 FPS: ${averageFPS.toFixed(1)}, 최소 FPS: ${minFPS}`);\n                    \n                    // 평균 FPS가 30 이상이어야 함\n                    expect(averageFPS).toBeGreaterThan(30);\n                    \n                    // 최소 FPS가 20 이상이어야 함 (일시적 드롭 허용)\n                    expect(minFPS).toBeGreaterThan(20);\n                    \n                    resolve();\n                }\n            };\n            \n            requestAnimationFrame(measureFPS);\n        });\n    });\n    \n    it('메모리 사용량이 안정적이어야 함', async () => {\n        if (!performance.memory) {\n            console.warn('메모리 API를 지원하지 않는 브라우저입니다.');\n            return;\n        }\n        \n        await gameEngine.init(testCanvas);\n        \n        const memoryData = [];\n        const testDuration = 10000; // 10초\n        const startTime = performance.now();\n        \n        return new Promise((resolve) => {\n            const measureMemory = () => {\n                const memory = performance.memory;\n                memoryData.push({\n                    used: memory.usedJSHeapSize / (1024 * 1024), // MB\n                    total: memory.totalJSHeapSize / (1024 * 1024), // MB\n                    timestamp: performance.now() - startTime\n                });\n                \n                if (performance.now() - startTime < testDuration) {\n                    setTimeout(measureMemory, 1000);\n                } else {\n                    // 메모리 누수 검사\n                    const initialMemory = memoryData[0].used;\n                    const finalMemory = memoryData[memoryData.length - 1].used;\n                    const memoryIncrease = finalMemory - initialMemory;\n                    \n                    console.log(`초기 메모리: ${initialMemory.toFixed(2)}MB`);\n                    console.log(`최종 메모리: ${finalMemory.toFixed(2)}MB`);\n                    console.log(`메모리 증가: ${memoryIncrease.toFixed(2)}MB`);\n                    \n                    // 메모리 증가가 50MB 미만이어야 함\n                    expect(memoryIncrease).toBeLessThan(50);\n                    \n                    // 최대 메모리 사용량이 200MB 미만이어야 함\n                    const maxMemory = Math.max(...memoryData.map(d => d.used));\n                    expect(maxMemory).toBeLessThan(200);\n                    \n                    resolve();\n                }\n            };\n            \n            measureMemory();\n        });\n    });\n    \n    it('물리 시뮬레이션 성능이 적절해야 함', async () => {\n        await gameEngine.init(testCanvas);\n        \n        // 물리 월드 생성\n        const physicsWorld = new PhysicsWorldManager();\n        await physicsWorld.init();\n        \n        // 다수의 물리 객체 생성 (스트레스 테스트)\n        const bodies = [];\n        for (let i = 0; i < 50; i++) {\n            const body = physicsWorld.createBox({\n                position: [Math.random() * 10, 10 + i, Math.random() * 10],\n                size: [1, 1, 1],\n                mass: 1\n            });\n            bodies.push(body);\n        }\n        \n        // 물리 시뮬레이션 성능 측정\n        const physicsTimings = [];\n        const testDuration = 3000; // 3초\n        const startTime = performance.now();\n        \n        return new Promise((resolve) => {\n            const measurePhysics = () => {\n                const physicsStart = performance.now();\n                \n                // 물리 시뮬레이션 스텝 실행\n                physicsWorld.step(1/60);\n                \n                const physicsTime = performance.now() - physicsStart;\n                physicsTimings.push(physicsTime);\n                \n                if (performance.now() - startTime < testDuration) {\n                    setTimeout(measurePhysics, 16); // ~60fps\n                } else {\n                    // 물리 성능 분석\n                    const averagePhysicsTime = physicsTimings.reduce((sum, time) => sum + time, 0) / physicsTimings.length;\n                    const maxPhysicsTime = Math.max(...physicsTimings);\n                    \n                    console.log(`평균 물리 시뮬레이션 시간: ${averagePhysicsTime.toFixed(2)}ms`);\n                    console.log(`최대 물리 시뮬레이션 시간: ${maxPhysicsTime.toFixed(2)}ms`);\n                    \n                    // 평균 물리 시뮬레이션 시간이 5ms 미만이어야 함\n                    expect(averagePhysicsTime).toBeLessThan(5);\n                    \n                    // 최대 물리 시뮬레이션 시간이 16ms 미만이어야 함 (60fps 유지)\n                    expect(maxPhysicsTime).toBeLessThan(16);\n                    \n                    resolve();\n                }\n            };\n            \n            measurePhysics();\n        });\n    });\n    \n    it('센서 데이터 처리 성능이 적절해야 함', async () => {\n        const sensorSmoothingSystem = new SensorSmoothingSystem();\n        const sensorPredictionSystem = new SensorPredictionSystem();\n        \n        // 센서 데이터 처리 성능 측정\n        const processingTimes = [];\n        const testIterations = 1000;\n        \n        for (let i = 0; i < testIterations; i++) {\n            // 가상 센서 데이터 생성\n            const sensorData = {\n                orientation: {\n                    alpha: Math.random() * 360,\n                    beta: Math.random() * 180 - 90,\n                    gamma: Math.random() * 180 - 90\n                },\n                acceleration: {\n                    x: Math.random() * 20 - 10,\n                    y: Math.random() * 20 - 10,\n                    z: Math.random() * 20 - 10\n                },\n                timestamp: Date.now()\n            };\n            \n            const startTime = performance.now();\n            \n            // 센서 데이터 처리\n            const smoothedData = sensorSmoothingSystem.process(sensorData);\n            const predictedData = sensorPredictionSystem.predict(smoothedData);\n            \n            const processingTime = performance.now() - startTime;\n            processingTimes.push(processingTime);\n        }\n        \n        // 성능 분석\n        const averageProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;\n        const maxProcessingTime = Math.max(...processingTimes);\n        \n        console.log(`평균 센서 데이터 처리 시간: ${averageProcessingTime.toFixed(3)}ms`);\n        console.log(`최대 센서 데이터 처리 시간: ${maxProcessingTime.toFixed(3)}ms`);\n        \n        // 평균 처리 시간이 1ms 미만이어야 함\n        expect(averageProcessingTime).toBeLessThan(1);\n        \n        // 최대 처리 시간이 5ms 미만이어야 함\n        expect(maxProcessingTime).toBeLessThan(5);\n    });\n    \n    it('UI 렌더링 성능이 적절해야 함', async () => {\n        const mobileInterface = new MobileTouchInterface();\n        await mobileInterface.init(testCanvas);\n        \n        // UI 렌더링 성능 측정\n        const renderTimes = [];\n        const testIterations = 100;\n        \n        for (let i = 0; i < testIterations; i++) {\n            const startTime = performance.now();\n            \n            // UI 업데이트 및 렌더링\n            mobileInterface.update({\n                score: Math.floor(Math.random() * 1000),\n                level: Math.floor(Math.random() * 10) + 1,\n                timeRemaining: Math.floor(Math.random() * 60)\n            });\n            \n            if (mobileInterface.render) {\n                mobileInterface.render();\n            }\n            \n            const renderTime = performance.now() - startTime;\n            renderTimes.push(renderTime);\n        }\n        \n        // 성능 분석\n        const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;\n        const maxRenderTime = Math.max(...renderTimes);\n        \n        console.log(`평균 UI 렌더링 시간: ${averageRenderTime.toFixed(2)}ms`);\n        console.log(`최대 UI 렌더링 시간: ${maxRenderTime.toFixed(2)}ms`);\n        \n        // 평균 렌더링 시간이 2ms 미만이어야 함\n        expect(averageRenderTime).toBeLessThan(2);\n        \n        // 최대 렌더링 시간이 10ms 미만이어야 함\n        expect(maxRenderTime).toBeLessThan(10);\n    });\n});\n\n// 모바일 기기별 성능 테스트\ndescribe('모바일 기기 호환성 테스트', () => {\n    let gameEngine;\n    \n    beforeEach(() => {\n        gameEngine = new GameEngine();\n    });\n    \n    afterEach(() => {\n        if (gameEngine) {\n            gameEngine.cleanup();\n        }\n    });\n    \n    it('저사양 기기에서도 작동해야 함', async () => {\n        // 저사양 기기 시뮬레이션 (낮은 해상도, 제한된 메모리)\n        const lowEndCanvas = document.createElement('canvas');\n        lowEndCanvas.width = 480;\n        lowEndCanvas.height = 320;\n        document.body.appendChild(lowEndCanvas);\n        \n        try {\n            // 저사양 모드로 초기화\n            await gameEngine.init(lowEndCanvas, {\n                quality: 'low',\n                shadows: false,\n                particles: false,\n                antialiasing: false\n            });\n            \n            // 기본 기능이 작동하는지 확인\n            expect(gameEngine.isInitialized()).toBeTruthy();\n            expect(gameEngine.renderer).toBeDefined();\n            \n            // 간단한 렌더링 테스트\n            gameEngine.render();\n            \n            console.log('저사양 기기 호환성 테스트 통과');\n            \n        } finally {\n            if (lowEndCanvas.parentNode) {\n                lowEndCanvas.parentNode.removeChild(lowEndCanvas);\n            }\n        }\n    });\n    \n    it('고해상도 디스플레이에서 작동해야 함', async () => {\n        // 고해상도 디스플레이 시뮬레이션\n        const highResCanvas = document.createElement('canvas');\n        highResCanvas.width = 1920;\n        highResCanvas.height = 1080;\n        document.body.appendChild(highResCanvas);\n        \n        try {\n            // 고품질 모드로 초기화\n            await gameEngine.init(highResCanvas, {\n                quality: 'high',\n                shadows: true,\n                particles: true,\n                antialiasing: true,\n                pixelRatio: 2\n            });\n            \n            // 기본 기능이 작동하는지 확인\n            expect(gameEngine.isInitialized()).toBeTruthy();\n            expect(gameEngine.renderer).toBeDefined();\n            \n            // 렌더링 테스트\n            gameEngine.render();\n            \n            console.log('고해상도 디스플레이 호환성 테스트 통과');\n            \n        } finally {\n            if (highResCanvas.parentNode) {\n                highResCanvas.parentNode.removeChild(highResCanvas);\n            }\n        }\n    });\n    \n    it('터치 입력이 정확하게 처리되어야 함', async () => {\n        const touchInterface = new MobileTouchInterface();\n        const testCanvas = document.createElement('canvas');\n        testCanvas.width = 800;\n        testCanvas.height = 600;\n        document.body.appendChild(testCanvas);\n        \n        try {\n            await touchInterface.init(testCanvas);\n            \n            // 터치 이벤트 시뮬레이션\n            const touchEvents = [];\n            \n            touchInterface.on('touch', (event) => {\n                touchEvents.push(event);\n            });\n            \n            // 가상 터치 이벤트 생성\n            const touchEvent = new TouchEvent('touchstart', {\n                touches: [{\n                    clientX: 400,\n                    clientY: 300,\n                    identifier: 0\n                }]\n            });\n            \n            testCanvas.dispatchEvent(touchEvent);\n            \n            // 터치 이벤트가 처리되었는지 확인\n            expect(touchEvents.length).toBeGreaterThan(0);\n            \n            console.log('터치 입력 처리 테스트 통과');\n            \n        } finally {\n            if (testCanvas.parentNode) {\n                testCanvas.parentNode.removeChild(testCanvas);\n            }\n        }\n    });\n});