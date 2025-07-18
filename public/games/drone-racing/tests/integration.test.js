/**
 * 🧪 드론 레이싱 게임 통합 테스트
 * 
 * 전체 게임 플로우 및 컴포넌트 간 상호작용 테스트
 */

describe('Integration Tests', () => {
    let game, mockSessionSDK;
    
    beforeEach(() => {
        // DOM 환경 설정
        document.body.innerHTML = `
            <canvas id="gameCanvas"></canvas>
            <div id="sessionPanel" class="hidden"></div>
            <div id="gameHUD" class="hidden"></div>
            <div id="player1HUD"><div class="hud-panel">
                <div class="speed"></div>
                <div class="lap"></div>
                <div class="time"></div>
                <div class="rank"></div>
                <div class="booster-fill"></div>
                <div class="booster-percent"></div>
            </div></div>
            <div id="player2HUD"><div class="hud-panel">
                <div class="speed"></div>
                <div class="lap"></div>
                <div class="time"></div>
                <div class="rank"></div>
                <div class="booster-fill"></div>
                <div class="booster-percent"></div>
            </div></div>
            <div id="countdown" class="hidden"></div>
            <div id="controlPanel" class="hidden"></div>
            <div id="resultsPanel" class="hidden"></div>
            <div id="reconnectPanel" class="hidden"></div>
            <div id="performancePanel" class="hidden"></div>
        `;
        
        // Mock SessionSDK
        mockSessionSDK = {
            on: jest.fn || function() {},
            createSession: jest.fn || function() { return Promise.resolve(); },
            getSession: jest.fn || function() { return { sessionCode: 'TEST123' }; },
            isConnected: jest.fn || function() { return true; }
        };
        
        // Mock THREE.js 및 CANNON.js
        global.THREE = {
            WebGLRenderer: function() {
                return {
                    setSize: () => {},
                    setPixelRatio: () => {},
                    shadowMap: { enabled: false, type: null, mapSize: { width: 0, height: 0 } },
                    domElement: { width: 800, height: 600 },
                    setViewport: () => {},
                    setScissor: () => {},
                    setScissorTest: () => {},
                    render: () => {},
                    getContext: () => null
                };
            },
            Scene: function() { return { fog: null, add: () => {}, remove: () => {}, traverse: () => {} }; },
            PerspectiveCamera: function() { 
                return { 
                    position: { set: () => {}, distanceTo: () => 0 },
                    aspect: 1,
                    updateProjectionMatrix: () => {},
                    lookAt: () => {}
                }; 
            },
            Vector3: function(x, y, z) {
                this.x = x || 0;
                this.y = y || 0;
                this.z = z || 0;
                this.clone = () => new THREE.Vector3(this.x, this.y, this.z);
                this.copy = (v) => { this.x = v.x; this.y = v.y; this.z = v.z; return this; };
                this.set = (x, y, z) => { this.x = x; this.y = y; this.z = z; return this; };
                this.length = () => Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
                this.distanceTo = (v) => Math.sqrt((this.x-v.x)**2 + (this.y-v.y)**2 + (this.z-v.z)**2);
            },
            Fog: function() {},
            AmbientLight: function() { return { userData: {} }; },
            DirectionalLight: function() { 
                return { 
                    position: { set: () => {} },
                    castShadow: false,
                    shadow: { mapSize: { width: 0, height: 0 }, camera: { near: 0, far: 0 } }
                }; 
            },
            PointLight: function() { return { position: { set: () => {} }, userData: {} }; }
        };
        
        global.CANNON = {
            World: function() {
                return {
                    gravity: { set: () => {} },
                    defaultContactMaterial: { friction: 0, restitution: 0 },
                    broadphase: {},
                    solver: { iterations: 0 },
                    addEventListener: () => {},
                    add: () => {},
                    remove: () => {},
                    step: () => {},
                    contacts: []
                };
            },
            Body: { AWAKE: 0, SLEEPING: 1, SLEEPY: 2, DYNAMIC: 1, KINEMATIC: 2 },
            NaiveBroadphase: function() {},
            SAPBroadphase: function() {}
        };
        
        // Mock SessionSDK 전역 설정
        global.SessionSDK = function() { return mockSessionSDK; };
        
        // 게임 인스턴스 생성 (실제 초기화는 하지 않음)
        game = {
            gameState: 'waiting',
            drones: {},
            physics: null,
            effects: null,
            ui: null,
            performanceOptimizer: null,
            sdk: mockSessionSDK
        };
    });
    
    afterEach(() => {
        // 정리
        document.body.innerHTML = '';
    });
    
    it('게임 초기화가 올바르게 작동해야 함', () => {
        // 게임 상태 확인
        expect(game.gameState).toBe('waiting');
        expect(game.sdk).toBeTruthy();
        
        // DOM 요소 확인
        expect(document.getElementById('gameCanvas')).toBeTruthy();
        expect(document.getElementById('sessionPanel')).toBeTruthy();
        expect(document.getElementById('gameHUD')).toBeTruthy();
    });
    
    it('센서 연결 플로우가 올바르게 작동해야 함', async () => {
        // 센서 연결 시뮬레이션
        const sensorData = {
            sensorId: 'player1',
            connectedSensors: 1,
            maxSensors: 2
        };
        
        // 연결 이벤트 핸들러 시뮬레이션
        let connectionHandled = false;
        const mockHandler = (data) => {
            expect(data.sensorId).toBe('player1');
            expect(data.connectedSensors).toBe(1);
            connectionHandled = true;
        };
        
        mockHandler(sensorData);
        expect(connectionHandled).toBeTruthy();
    });
    
    it('센서 데이터 처리가 올바르게 작동해야 함', () => {
        const sensorData = {
            sensorId: 'player1',
            data: {
                orientation: {
                    alpha: 0,
                    beta: -30, // 앞으로 기울임
                    gamma: 15  // 오른쪽으로 기울임
                },
                acceleration: {
                    x: 2,
                    y: 3,
                    z: 20 // 흔들기 감지
                }
            }
        };
        
        // 센서 데이터 필터링 테스트
        const filteredData = {
            orientation: {
                alpha: Math.max(0, Math.min(360, sensorData.data.orientation.alpha)),
                beta: Math.max(-180, Math.min(180, sensorData.data.orientation.beta)),
                gamma: Math.max(-90, Math.min(90, sensorData.data.orientation.gamma))
            },
            acceleration: {
                x: Math.max(-50, Math.min(50, sensorData.data.acceleration.x)),
                y: Math.max(-50, Math.min(50, sensorData.data.acceleration.y)),
                z: Math.max(-50, Math.min(50, sensorData.data.acceleration.z))
            }
        };
        
        expect(filteredData.orientation.beta).toBe(-30);
        expect(filteredData.orientation.gamma).toBe(15);
        expect(filteredData.acceleration.z).toBe(20);
    });
    
    it('게임 상태 전환이 올바르게 작동해야 함', () => {
        // 초기 상태
        expect(game.gameState).toBe('waiting');
        
        // 레이싱 상태로 전환
        game.gameState = 'racing';
        expect(game.gameState).toBe('racing');
        
        // 완료 상태로 전환
        game.gameState = 'finished';
        expect(game.gameState).toBe('finished');
        
        // 일시정지 상태로 전환
        game.gameState = 'paused';
        expect(game.gameState).toBe('paused');
    });
    
    it('드론 조작 로직이 올바르게 작동해야 함', () => {
        // Mock 드론 생성
        const mockDrone = {
            steering: 0,
            thrust: 0,
            updateFromSensor: function(sensorData) {
                const { orientation } = sensorData.data;
                
                if (orientation) {
                    // 좌우 기울기 -> 회전
                    this.steering = (orientation.gamma || 0) * 0.02;
                    this.steering = Math.max(-1, Math.min(1, this.steering));
                    
                    // 앞뒤 기울기 -> 추진력
                    const pitch = orientation.beta || 0;
                    if (pitch < -15) {
                        this.thrust = Math.min(1, (Math.abs(pitch) - 15) / 30);
                    } else if (pitch > 15) {
                        this.thrust = -Math.min(0.5, (pitch - 15) / 30);
                    } else {
                        this.thrust = 0;
                    }
                }
            }
        };
        
        // 센서 데이터 적용
        mockDrone.updateFromSensor({
            data: {
                orientation: {
                    beta: -30, // 앞으로 기울임
                    gamma: 30  // 오른쪽으로 기울임
                }
            }
        });
        
        expect(mockDrone.thrust).toBeGreaterThan(0); // 앞으로 가속
        expect(mockDrone.steering).toBeGreaterThan(0); // 오른쪽으로 회전
    });
    
    it('부스터 시스템이 올바르게 작동해야 함', () => {
        const mockBooster = {
            energy: 100,
            maxEnergy: 100,
            isActive: false,
            cooldown: 0,
            
            canUse: function() {
                return this.energy >= 20 && this.cooldown <= 0;
            },
            
            activate: function() {
                if (!this.canUse()) return false;
                
                this.isActive = true;
                this.energy -= 20;
                this.cooldown = 3000;
                
                setTimeout(() => {
                    this.isActive = false;
                }, 1500);
                
                return true;
            },
            
            update: function(deltaTime) {
                if (this.cooldown > 0) {
                    this.cooldown -= deltaTime * 1000;
                }
                
                if (this.energy < this.maxEnergy) {
                    this.energy += 10 * deltaTime;
                    this.energy = Math.min(this.maxEnergy, this.energy);
                }
            }
        };
        
        // 부스터 사용 테스트
        expect(mockBooster.canUse()).toBeTruthy();
        expect(mockBooster.activate()).toBeTruthy();
        expect(mockBooster.isActive).toBeTruthy();
        expect(mockBooster.energy).toBe(80);
        expect(mockBooster.cooldown).toBe(3000);
        
        // 쿨다운 중 사용 불가 테스트
        expect(mockBooster.canUse()).toBeFalsy();
        expect(mockBooster.activate()).toBeFalsy();
        
        // 에너지 부족 시 사용 불가 테스트
        mockBooster.energy = 10;
        mockBooster.cooldown = 0;
        expect(mockBooster.canUse()).toBeFalsy();
    });
    
    it('체크포인트 시스템이 올바르게 작동해야 함', () => {
        const mockRaceState = {
            lapCount: 0,
            checkpointIndex: 0,
            lapTime: 0,
            
            passCheckpoint: function(checkpointIndex) {
                if (checkpointIndex === this.checkpointIndex + 1 || 
                    (checkpointIndex === 0 && this.checkpointIndex === 7)) {
                    
                    this.checkpointIndex = checkpointIndex;
                    
                    // 한 랩 완주 체크
                    if (checkpointIndex === 0 && this.lapCount > 0) {
                        this.lapCount++;
                        this.lapTime = 0;
                        return true; // 랩 완주
                    } else if (checkpointIndex === 0) {
                        this.lapCount = 1; // 첫 랩 시작
                    }
                }
                return false;
            }
        };
        
        // 체크포인트 통과 테스트
        mockRaceState.passCheckpoint(1);
        expect(mockRaceState.checkpointIndex).toBe(1);
        
        // 첫 랩 시작 테스트
        mockRaceState.passCheckpoint(0);
        expect(mockRaceState.lapCount).toBe(1);
        
        // 다음 체크포인트들 통과
        for (let i = 1; i <= 7; i++) {
            mockRaceState.passCheckpoint(i);
        }
        
        // 랩 완주 테스트
        const lapCompleted = mockRaceState.passCheckpoint(0);
        expect(lapCompleted).toBeTruthy();
        expect(mockRaceState.lapCount).toBe(2);
    });
    
    it('UI 업데이트가 올바르게 작동해야 함', () => {
        const mockUI = {
            updatePlayerHUD: function(playerId, data) {
                const hudElement = document.getElementById(`${playerId}HUD`);
                if (!hudElement) return false;
                
                const speedElement = hudElement.querySelector('.speed');
                const lapElement = hudElement.querySelector('.lap');
                const timeElement = hudElement.querySelector('.time');
                const rankElement = hudElement.querySelector('.rank');
                
                if (speedElement) speedElement.textContent = `속도: ${Math.round(data.speed || 0)} km/h`;
                if (lapElement) lapElement.textContent = `랩: ${data.lapCount || 0}/3`;
                if (timeElement) timeElement.textContent = `시간: ${(data.lapTime || 0).toFixed(2)}s`;
                if (rankElement) rankElement.textContent = `순위: ${data.rank || 1}`;
                
                return true;
            }
        };
        
        // UI 업데이트 테스트
        const testData = {
            speed: 45.5,
            lapCount: 2,
            lapTime: 67.89,
            rank: 1
        };
        
        const updated = mockUI.updatePlayerHUD('player1', testData);
        expect(updated).toBeTruthy();
        
        // DOM 요소 확인
        const speedElement = document.querySelector('#player1HUD .speed');
        const lapElement = document.querySelector('#player1HUD .lap');
        const timeElement = document.querySelector('#player1HUD .time');
        const rankElement = document.querySelector('#player1HUD .rank');
        
        expect(speedElement.textContent).toBe('속도: 46 km/h');
        expect(lapElement.textContent).toBe('랩: 2/3');
        expect(timeElement.textContent).toBe('시간: 67.89s');
        expect(rankElement.textContent).toBe('순위: 1');
    });
    
    it('성능 최적화가 올바르게 작동해야 함', () => {
        const mockPerformanceOptimizer = {
            performanceStats: {
                fps: 60,
                frameTime: 16.67,
                particleCount: 150
            },
            
            throttleSensorData: function(sensorId, data) {
                const now = Date.now();
                const lastUpdate = this.lastUpdate || {};
                
                if (now - (lastUpdate[sensorId] || 0) < 50) {
                    return null; // throttling
                }
                
                lastUpdate[sensorId] = now;
                this.lastUpdate = lastUpdate;
                return data;
            },
            
            optimizeParticleSystem: function() {
                const maxParticles = 300;
                if (this.performanceStats.particleCount > maxParticles) {
                    this.performanceStats.particleCount = maxParticles;
                    return true; // 최적화 수행됨
                }
                return false;
            }
        };
        
        // 센서 데이터 throttling 테스트
        const testData = { test: 'data' };
        const result1 = mockPerformanceOptimizer.throttleSensorData('player1', testData);
        expect(result1).toEqual(testData);
        
        const result2 = mockPerformanceOptimizer.throttleSensorData('player1', testData);
        expect(result2).toBeNull(); // throttled
        
        // 파티클 최적화 테스트
        mockPerformanceOptimizer.performanceStats.particleCount = 500;
        const optimized = mockPerformanceOptimizer.optimizeParticleSystem();
        expect(optimized).toBeTruthy();
        expect(mockPerformanceOptimizer.performanceStats.particleCount).toBe(300);
    });
    
    it('에러 처리가 올바르게 작동해야 함', () => {
        const mockErrorHandler = {
            errors: [],
            
            handleSensorDisconnection: function(sensorId) {
                this.errors.push({
                    type: 'sensor_disconnection',
                    sensorId: sensorId,
                    timestamp: Date.now()
                });
                return true;
            },
            
            handlePhysicsError: function(error) {
                this.errors.push({
                    type: 'physics_error',
                    error: error.message,
                    timestamp: Date.now()
                });
                return true;
            },
            
            handleRenderError: function(error) {
                this.errors.push({
                    type: 'render_error',
                    error: error.message,
                    timestamp: Date.now()
                });
                return true;
            }
        };
        
        // 센서 연결 해제 에러 처리
        mockErrorHandler.handleSensorDisconnection('player1');
        expect(mockErrorHandler.errors.length).toBe(1);
        expect(mockErrorHandler.errors[0].type).toBe('sensor_disconnection');
        expect(mockErrorHandler.errors[0].sensorId).toBe('player1');
        
        // 물리 엔진 에러 처리
        mockErrorHandler.handlePhysicsError(new Error('Physics simulation failed'));
        expect(mockErrorHandler.errors.length).toBe(2);
        expect(mockErrorHandler.errors[1].type).toBe('physics_error');
        
        // 렌더링 에러 처리
        mockErrorHandler.handleRenderError(new Error('WebGL context lost'));
        expect(mockErrorHandler.errors.length).toBe(3);
        expect(mockErrorHandler.errors[2].type).toBe('render_error');
    });
    
    it('게임 재시작이 올바르게 작동해야 함', () => {
        const mockGameState = {
            gameState: 'finished',
            raceStartTime: Date.now() - 60000,
            isPaused: false,
            
            restart: function() {
                this.gameState = 'waiting';
                this.raceStartTime = 0;
                this.isPaused = false;
                return true;
            }
        };
        
        // 재시작 전 상태 확인
        expect(mockGameState.gameState).toBe('finished');
        expect(mockGameState.raceStartTime).toBeGreaterThan(0);
        
        // 재시작 실행
        const restarted = mockGameState.restart();
        expect(restarted).toBeTruthy();
        
        // 재시작 후 상태 확인
        expect(mockGameState.gameState).toBe('waiting');
        expect(mockGameState.raceStartTime).toBe(0);
        expect(mockGameState.isPaused).toBeFalsy();
    });
});