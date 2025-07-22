export class SensorManager {
    constructor() {
        this.sensorData = {
            sensor1: { tilt: { x: 0, y: 0 } },
            sensor2: { tilt: { x: 0, y: 0 } }
        };

        this.crosshair = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            smoothing: 0.2
        };

        this.crosshair2 = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            smoothing: 0.1
        };

        this.massCompetitiveCrosshair = {
            smoothing: 0.35, // 더 높은 기본 스무딩
            adaptiveSmoothing: true,
            lastSmoothingValue: 0.35,
            smoothingTransition: 0.08,
            lastUpdateTime: 0,
            throttleTime: 16, // 60fps로 증가
            lastPosition: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            // 노이즈 필터링을 위한 이동 평균
            sensorHistory: [],
            historySize: 3,
            // 예측적 보간
            predictiveSmoothing: 0.15
        };
    }

    initializeCrosshair(canvasWidth, canvasHeight) {
        this.crosshair.x = canvasWidth / 2;
        this.crosshair.y = canvasHeight / 2;
        this.crosshair.targetX = this.crosshair.x;
        this.crosshair.targetY = this.crosshair.y;

        this.crosshair2.x = canvasWidth / 2;
        this.crosshair2.y = canvasHeight / 2;
        this.crosshair2.targetX = this.crosshair2.x;
        this.crosshair2.targetY = this.crosshair2.y;
    }

    processSensorData(data, gameMode, massPlayers, myPlayerId) {
        const sensorData = data.data;
        const sensorId = data.sensorId || 'sensor';

        // 대규모 경쟁 모드에서만 throttling 적용
        if (gameMode === 'mass-competitive') {
            const now = Date.now();
            if (now - this.massCompetitiveCrosshair.lastUpdateTime < this.massCompetitiveCrosshair.throttleTime) {
                return; // throttling으로 센서 데이터 무시
            }
            this.massCompetitiveCrosshair.lastUpdateTime = now;
        }

        if (sensorData.orientation) {
            if (gameMode === 'solo' || sensorId === 'sensor1') {
                this.sensorData.sensor1.tilt.x = sensorData.orientation.beta || 0;
                this.sensorData.sensor1.tilt.y = sensorData.orientation.gamma || 0;

            } else if ((gameMode === 'coop' || gameMode === 'competitive') && sensorId === 'sensor2') {
                this.sensorData.sensor2.tilt.x = sensorData.orientation.beta || 0;
                this.sensorData.sensor2.tilt.y = sensorData.orientation.gamma || 0;

            } else if (gameMode === 'mass-competitive') {
                const player = massPlayers.get(sensorId);
                if (player) {
                    const now = Date.now();
                    const rawTiltX = sensorData.orientation.beta || 0;
                    const rawTiltY = sensorData.orientation.gamma || 0;

                    if (sensorId === myPlayerId) {
                        // 대규모 경쟁 모드에서만 노이즈 필터링 적용
                        const filteredTilt = this.applySensorNoiseFilter(rawTiltX, rawTiltY);
                        player.tilt.x = filteredTilt.x;
                        player.tilt.y = filteredTilt.y;
                        
                        this.sensorData.sensor1.tilt.x = player.tilt.x;
                        this.sensorData.sensor1.tilt.y = player.tilt.y;
                    } else {
                        player.tilt.x = rawTiltX;
                        player.tilt.y = rawTiltY;
                    }

                    player.lastActivity = now;
                }
            }
        }
    }

    // 대규모 경쟁 모드 전용 센서 노이즈 필터링
    applySensorNoiseFilter(tiltX, tiltY) {
        const config = this.massCompetitiveCrosshair;
        
        // 센서 히스토리에 새 데이터 추가
        config.sensorHistory.push({ x: tiltX, y: tiltY });
        
        // 히스토리 크기 제한
        if (config.sensorHistory.length > config.historySize) {
            config.sensorHistory.shift();
        }
        
        // 이동 평균으로 노이즈 필터링
        if (config.sensorHistory.length === 1) {
            return { x: tiltX, y: tiltY };
        }
        
        let avgX = 0, avgY = 0;
        const weights = [0.5, 0.3, 0.2]; // 최신 데이터에 더 높은 가중치
        let totalWeight = 0;
        
        for (let i = 0; i < config.sensorHistory.length; i++) {
            const weight = weights[config.sensorHistory.length - 1 - i] || 0.1;
            avgX += config.sensorHistory[i].x * weight;
            avgY += config.sensorHistory[i].y * weight;
            totalWeight += weight;
        }
        
        // 가중치 정규화
        return { x: avgX / totalWeight, y: avgY / totalWeight };
    }

    applySensorMovement(gameMode, canvasWidth, canvasHeight) {
        const sensitivity = 15;
        const maxTilt = 25;

        if (gameMode === 'solo') {
            const normalizedTiltX = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.y / maxTilt));
            const normalizedTiltY = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.x / maxTilt));

            this.crosshair.targetX = canvasWidth / 2 + (normalizedTiltX * canvasWidth / 2);
            this.crosshair.targetY = canvasHeight / 2 + (normalizedTiltY * canvasHeight / 2);

            this.crosshair.targetX = Math.max(0, Math.min(canvasWidth, this.crosshair.targetX));
            this.crosshair.targetY = Math.max(0, Math.min(canvasHeight, this.crosshair.targetY));

        } else if (gameMode === 'coop') {
            // 협동 모드: 화면 좌우 분할
            const normalizedTiltX1 = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.y / maxTilt));
            const normalizedTiltY1 = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.x / maxTilt));

            this.crosshair.targetX = canvasWidth / 4 + (normalizedTiltX1 * canvasWidth / 4);
            this.crosshair.targetY = canvasHeight / 2 + (normalizedTiltY1 * canvasHeight / 2);

            this.crosshair.targetX = Math.max(0, Math.min(canvasWidth / 2, this.crosshair.targetX));
            this.crosshair.targetY = Math.max(0, Math.min(canvasHeight, this.crosshair.targetY));

            const normalizedTiltX2 = Math.max(-1, Math.min(1, this.sensorData.sensor2.tilt.y / maxTilt));
            const normalizedTiltY2 = Math.max(-1, Math.min(1, this.sensorData.sensor2.tilt.x / maxTilt));

            this.crosshair2.targetX = canvasWidth * 3 / 4 + (normalizedTiltX2 * canvasWidth / 4);
            this.crosshair2.targetY = canvasHeight / 2 + (normalizedTiltY2 * canvasHeight / 2);

            this.crosshair2.targetX = Math.max(canvasWidth / 2, Math.min(canvasWidth, this.crosshair2.targetX));
            this.crosshair2.targetY = Math.max(0, Math.min(canvasHeight, this.crosshair2.targetY));

        } else if (gameMode === 'competitive') {
            // 경쟁 모드: 두 센서 모두 전체 화면 범위
            const normalizedTiltX1 = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.y / maxTilt));
            const normalizedTiltY1 = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.x / maxTilt));

            this.crosshair.targetX = canvasWidth / 2 + (normalizedTiltX1 * canvasWidth / 2);
            this.crosshair.targetY = canvasHeight / 2 + (normalizedTiltY1 * canvasHeight / 2);

            this.crosshair.targetX = Math.max(0, Math.min(canvasWidth, this.crosshair.targetX));
            this.crosshair.targetY = Math.max(0, Math.min(canvasHeight, this.crosshair.targetY));

            const normalizedTiltX2 = Math.max(-1, Math.min(1, this.sensorData.sensor2.tilt.y / maxTilt));
            const normalizedTiltY2 = Math.max(-1, Math.min(1, this.sensorData.sensor2.tilt.x / maxTilt));

            this.crosshair2.targetX = canvasWidth / 2 + (normalizedTiltX2 * canvasWidth / 2);
            this.crosshair2.targetY = canvasHeight / 2 + (normalizedTiltY2 * canvasHeight / 2);

            this.crosshair2.targetX = Math.max(0, Math.min(canvasWidth, this.crosshair2.targetX));
            this.crosshair2.targetY = Math.max(0, Math.min(canvasHeight, this.crosshair2.targetY));

        } else if (gameMode === 'mass-competitive') {
            const normalizedTiltX = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.y / maxTilt));
            const normalizedTiltY = Math.max(-1, Math.min(1, this.sensorData.sensor1.tilt.x / maxTilt));

            this.crosshair.targetX = canvasWidth / 2 + (normalizedTiltX * canvasWidth / 2);
            this.crosshair.targetY = canvasHeight / 2 + (normalizedTiltY * canvasHeight / 2);

            this.crosshair.targetX = Math.max(0, Math.min(canvasWidth, this.crosshair.targetX));
            this.crosshair.targetY = Math.max(0, Math.min(canvasHeight, this.crosshair.targetY));
        }
    }

    updateCrosshairPosition(gameMode) {
        if (gameMode === 'mass-competitive') {
            // 대규모 경쟁 모드에서만 고급 스무딩 적용
            const massConfig = this.massCompetitiveCrosshair;
            
            // 이전 속도 계산
            const prevVelX = massConfig.velocity.x;
            const prevVelY = massConfig.velocity.y;
            
            // 목표 위치까지의 거리와 방향
            const deltaX = this.crosshair.targetX - this.crosshair.x;
            const deltaY = this.crosshair.targetY - this.crosshair.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // 예측적 보간: 이전 움직임 트렌드를 고려한 예측 위치
            const predictedX = this.crosshair.targetX + (prevVelX * massConfig.predictiveSmoothing);
            const predictedY = this.crosshair.targetY + (prevVelY * massConfig.predictiveSmoothing);
            
            // 예측 위치로의 델타 계산
            const predictedDeltaX = predictedX - this.crosshair.x;
            const predictedDeltaY = predictedY - this.crosshair.y;
            
            // 거리 기반 적응형 스무딩
            let adaptiveSmoothing = massConfig.smoothing;
            if (distance > 80) {
                // 큰 움직임: 더 빠른 반응
                adaptiveSmoothing = Math.min(0.65, massConfig.smoothing + (distance / 200));
            } else if (distance > 30) {
                // 중간 움직임: 기본 반응
                adaptiveSmoothing = massConfig.smoothing;
            } else {
                // 작은 움직임: 더 부드러운 움직임
                adaptiveSmoothing = Math.max(0.2, massConfig.smoothing - 0.1);
            }
            
            // 부드러운 스무딩 전환
            massConfig.lastSmoothingValue += (adaptiveSmoothing - massConfig.lastSmoothingValue) * massConfig.smoothingTransition;
            
            // 예측적 움직임과 일반 움직임의 가중 평균
            const finalDeltaX = (deltaX * 0.7) + (predictedDeltaX * 0.3);
            const finalDeltaY = (deltaY * 0.7) + (predictedDeltaY * 0.3);
            
            // 위치 업데이트
            this.crosshair.x += finalDeltaX * massConfig.lastSmoothingValue;
            this.crosshair.y += finalDeltaY * massConfig.lastSmoothingValue;
            
            // 속도 추적 업데이트
            const newVelX = this.crosshair.x - massConfig.lastPosition.x;
            const newVelY = this.crosshair.y - massConfig.lastPosition.y;
            
            // 속도 스무딩 (갑작스러운 변화 방지)
            massConfig.velocity.x = (massConfig.velocity.x * 0.7) + (newVelX * 0.3);
            massConfig.velocity.y = (massConfig.velocity.y * 0.7) + (newVelY * 0.3);
            
            massConfig.lastPosition.x = this.crosshair.x;
            massConfig.lastPosition.y = this.crosshair.y;
        } else {
            this.crosshair.x += (this.crosshair.targetX - this.crosshair.x) * this.crosshair.smoothing;
            this.crosshair.y += (this.crosshair.targetY - this.crosshair.y) * this.crosshair.smoothing;
        }

        if (gameMode === 'coop' || gameMode === 'competitive') {
            this.crosshair2.x += (this.crosshair2.targetX - this.crosshair2.x) * this.crosshair2.smoothing;
            this.crosshair2.y += (this.crosshair2.targetY - this.crosshair2.y) * this.crosshair2.smoothing;
        }
    }

    calculatePlayerCrosshairX(player, canvasWidth) {
        const maxTilt = 25;
        const normalizedTiltX = Math.max(-1, Math.min(1, player.tilt.y / maxTilt));
        let crosshairX = canvasWidth / 2 + (normalizedTiltX * canvasWidth / 2);
        return Math.max(0, Math.min(canvasWidth, crosshairX));
    }

    calculatePlayerCrosshairY(player, canvasHeight) {
        const maxTilt = 25;
        const normalizedTiltY = Math.max(-1, Math.min(1, player.tilt.x / maxTilt));
        let crosshairY = canvasHeight / 2 + (normalizedTiltY * canvasHeight / 2);
        return Math.max(0, Math.min(canvasHeight, crosshairY));
    }

    reset(canvasWidth, canvasHeight) {
        this.sensorData.sensor1 = { tilt: { x: 0, y: 0 } };
        this.sensorData.sensor2 = { tilt: { x: 0, y: 0 } };
        this.initializeCrosshair(canvasWidth, canvasHeight);
        
        // 대규모 경쟁 모드 관련 변수 초기화
        this.massCompetitiveCrosshair.lastUpdateTime = 0;
        this.massCompetitiveCrosshair.sensorHistory = [];
        this.massCompetitiveCrosshair.velocity = { x: 0, y: 0 };
        this.massCompetitiveCrosshair.lastPosition = { x: canvasWidth / 2, y: canvasHeight / 2 };
        this.massCompetitiveCrosshair.lastSmoothingValue = this.massCompetitiveCrosshair.smoothing;
    }
}