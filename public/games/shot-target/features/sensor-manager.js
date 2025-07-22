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
            smoothing: 0.18,
            adaptiveSmoothing: true,
            lastSmoothingValue: 0.18,
            smoothingTransition: 0.05,
            lastUpdateTime: 0,
            throttleTime: 33, // 30fps throttling
            lastPosition: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 }
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
                    player.tilt.x = sensorData.orientation.beta || 0;
                    player.tilt.y = sensorData.orientation.gamma || 0;

                    if (sensorId === myPlayerId) {
                        this.sensorData.sensor1.tilt.x = player.tilt.x;
                        this.sensorData.sensor1.tilt.y = player.tilt.y;
                    }

                    player.lastActivity = now;
                }
            }
        }
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
            // 대규모 경쟁 모드에서만 적응형 스무딩 적용
            const massConfig = this.massCompetitiveCrosshair;
            
            // 이동 거리 계산
            const deltaX = this.crosshair.targetX - this.crosshair.x;
            const deltaY = this.crosshair.targetY - this.crosshair.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // 속도 기반 적응형 스무딩
            let adaptiveSmoothing = massConfig.smoothing;
            if (distance > 50) {
                // 큰 움직임: 더 빠른 반응
                adaptiveSmoothing = Math.min(0.35, massConfig.smoothing + (distance / 300));
            } else if (distance < 10) {
                // 작은 움직임: 더 부드러운 움직임
                adaptiveSmoothing = Math.max(0.1, massConfig.smoothing - 0.05);
            }
            
            // 스무딩 전환 적용
            massConfig.lastSmoothingValue += (adaptiveSmoothing - massConfig.lastSmoothingValue) * massConfig.smoothingTransition;
            
            this.crosshair.x += deltaX * massConfig.lastSmoothingValue;
            this.crosshair.y += deltaY * massConfig.lastSmoothingValue;
            
            // 속도 추적 (다음 프레임용)
            massConfig.velocity.x = this.crosshair.x - massConfig.lastPosition.x;
            massConfig.velocity.y = this.crosshair.y - massConfig.lastPosition.y;
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
    }
}