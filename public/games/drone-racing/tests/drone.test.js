/**
 * 🚁 드론 클래스 단위 테스트
 * 
 * 드론의 센서 데이터 처리, 부스터 시스템, 키보드 입력 등을 테스트
 */

describe('Drone Tests', () => {
    let mockScene, mockPhysics, drone;
    
    beforeEach(() => {
        // Mock 객체들 생성
        mockScene = {
            add: jest.fn || (() => {}),
            remove: jest.fn || (() => {})
        };
        
        mockPhysics = {
            createDroneBody: jest.fn || (() => ({
                position: { x: 0, y: 5, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                quaternion: { x: 0, y: 0, z: 0, w: 1 }
            })),
            applyDroneForces: jest.fn || (() => {}),
            applyBoosterEffect: jest.fn || (() => {}),
            removeBody: jest.fn || (() => {})
        };
        
        // 드론 인스턴스 생성
        drone = new Drone('player1', mockScene, mockPhysics, { x: 0, y: 5, z: 0 });
    });
    
    afterEach(() => {
        if (drone && drone.dispose) {
            drone.dispose();
        }
    });
    
    it('드론이 올바르게 초기화되어야 함', () => {
        expect(drone.playerId).toBe('player1');
        expect(drone.speed).toBe(0);
        expect(drone.booster.energy).toBe(100);
        expect(drone.lapCount).toBe(0);
    });
    
    it('센서 데이터로 드론 조작이 올바르게 처리되어야 함', () => {
        const sensorData = {
            data: {
                orientation: {
                    alpha: 0,
                    beta: -30, // 앞으로 기울임
                    gamma: 15  // 오른쪽으로 기울임
                },
                acceleration: {
                    x: 0,
                    y: 0,
                    z: 0
                }
            }
        };
        
        drone.updateFromSensor(sensorData);
        
        // 추진력이 설정되어야 함 (앞으로 기울임)
        expect(drone.thrust).toBeGreaterThan(0);
        
        // 조향이 설정되어야 함 (오른쪽으로 기울임)
        expect(drone.steering).toBeGreaterThan(0);
    });
    
    it('키보드 입력으로 드론 조작이 올바르게 처리되어야 함', () => {
        const keyboardControls = {
            forward: true,
            backward: false,
            left: true,
            right: false,
            up: false,
            down: false,
            boost: false
        };
        
        drone.updateFromKeyboard(keyboardControls);
        
        expect(drone.thrust).toBe(1);
        expect(drone.steering).toBe(-0.5);
        expect(drone.lift).toBe(0);
    });
    
    it('부스터 시스템이 올바르게 작동해야 함', () => {
        // 초기 상태 확인
        expect(drone.canUseBooster()).toBeTruthy();
        expect(drone.booster.isActive).toBeFalsy();
        
        // 부스터 활성화
        drone.activateBooster();
        
        expect(drone.booster.isActive).toBeTruthy();
        expect(drone.booster.energy).toBeLessThan(100);
        expect(drone.booster.cooldown).toBeGreaterThan(0);
    });
    
    it('부스터 에너지가 부족할 때 사용할 수 없어야 함', () => {
        // 에너지를 부족하게 설정
        drone.booster.energy = 10;
        
        expect(drone.canUseBooster()).toBeFalsy();
        
        const initialEnergy = drone.booster.energy;
        drone.activateBooster();
        
        // 에너지가 변하지 않아야 함
        expect(drone.booster.energy).toBe(initialEnergy);
        expect(drone.booster.isActive).toBeFalsy();
    });
    
    it('부스터 쿨다운 중에는 사용할 수 없어야 함', () => {
        // 쿨다운 설정
        drone.booster.cooldown = 1000;
        
        expect(drone.canUseBooster()).toBeFalsy();
    });
    
    it('부스터 에너지가 시간에 따라 충전되어야 함', () => {
        // 에너지를 50으로 설정
        drone.booster.energy = 50;
        
        const initialEnergy = drone.booster.energy;
        
        // 1초 시뮬레이션
        drone.updateBooster(1.0);
        
        expect(drone.booster.energy).toBeGreaterThan(initialEnergy);
        expect(drone.booster.energy).toBeLessThan(100);
    });
    
    it('부스터 존에서 빠르게 충전되어야 함', () => {
        drone.booster.energy = 50;
        const initialEnergy = drone.booster.energy;
        
        // 부스터 존에서 충전
        const wasCharging = drone.chargeBoosterInZone(1.0);
        
        expect(wasCharging).toBeTruthy();
        expect(drone.booster.energy).toBeGreaterThan(initialEnergy);
    });
    
    it('드론 데이터가 올바르게 반환되어야 함', () => {
        drone.speed = 25;
        drone.lapCount = 1;
        drone.rank = 2;
        
        const data = drone.getData();
        
        expect(data.playerId).toBe('player1');
        expect(data.speed).toBe(25);
        expect(data.lapCount).toBe(1);
        expect(data.rank).toBe(2);
        expect(data.booster).toBeTruthy();
        expect(data.position).toBeTruthy();
        expect(data.velocity).toBeTruthy();
    });
    
    it('드론 리셋이 올바르게 작동해야 함', () => {
        // 드론 상태 변경
        drone.speed = 50;
        drone.lapCount = 2;
        drone.booster.energy = 30;
        
        // 리셋
        drone.reset({ x: 10, y: 8, z: 5 });
        
        expect(drone.speed).toBe(0);
        expect(drone.lapCount).toBe(0);
        expect(drone.booster.energy).toBe(100);
        expect(drone.booster.isActive).toBeFalsy();
        expect(drone.booster.cooldown).toBe(0);
    });
    
    it('센서 데이터 필터링이 올바르게 작동해야 함', () => {
        const extremeSensorData = {
            data: {
                orientation: {
                    alpha: 0,
                    beta: -200, // 극단적인 값
                    gamma: 100  // 극단적인 값
                }
            }
        };
        
        drone.updateFromSensor(extremeSensorData);
        
        // 값이 적절히 제한되어야 함
        expect(drone.thrust).toBeGreaterThan(-1);
        expect(drone.thrust).toBeLessThan(2);
        expect(drone.steering).toBeGreaterThan(-2);
        expect(drone.steering).toBeLessThan(2);
    });
    
    it('흔들기 감지로 부스터가 활성화되어야 함', () => {
        const shakeData = {
            data: {
                orientation: { alpha: 0, beta: 0, gamma: 0 },
                acceleration: {
                    x: 20, // 강한 가속도
                    y: 15,
                    z: 10
                }
            }
        };
        
        const initialEnergy = drone.booster.energy;
        drone.updateFromSensor(shakeData);
        
        expect(drone.booster.isActive).toBeTruthy();
        expect(drone.booster.energy).toBeLessThan(initialEnergy);
    });
});

describe('Drone Physics Integration Tests', () => {
    let mockScene, mockPhysics, drone;
    
    beforeEach(() => {
        mockScene = {
            add: () => {},
            remove: () => {}
        };
        
        mockPhysics = {
            createDroneBody: () => ({
                position: { x: 0, y: 5, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                quaternion: { x: 0, y: 0, z: 0, w: 1 }
            }),
            applyDroneForces: () => {},
            applyBoosterEffect: () => {},
            removeBody: () => {}
        };
        
        drone = new Drone('player2', mockScene, mockPhysics);
    });
    
    it('물리 힘이 올바르게 적용되어야 함', () => {
        let appliedForces = null;
        
        mockPhysics.applyDroneForces = (droneId, forces) => {
            appliedForces = forces;
        };
        
        drone.thrust = 0.5;
        drone.steering = -0.3;
        drone.lift = 0.2;
        
        drone.update(1/60); // 60fps 시뮬레이션
        
        expect(appliedForces).toBeTruthy();
        expect(appliedForces.thrust).toBe(0.5 * 20);
        expect(appliedForces.steering).toBe(-0.3 * 5);
        expect(appliedForces.lift).toBe(0.2 * 15);
    });
    
    it('부스터 효과가 물리 엔진에 전달되어야 함', () => {
        let boosterCalled = false;
        
        mockPhysics.applyBoosterEffect = (droneId, multiplier) => {
            boosterCalled = true;
            expect(droneId).toBe('player2');
            expect(multiplier).toBe(2.0);
        };
        
        drone.activateBooster();
        
        expect(boosterCalled).toBeTruthy();
    });
});