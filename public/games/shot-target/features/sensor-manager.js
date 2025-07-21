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
            adaptiveSmoothing: false,
            lastSmoothingValue: 0.18,
            smoothingTransition: 0.05
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
            const smoothingValue = this.massCompetitiveCrosshair.smoothing;
            this.crosshair.x += (this.crosshair.targetX - this.crosshair.x) * smoothingValue;
            this.crosshair.y += (this.crosshair.targetY - this.crosshair.y) * smoothingValue;
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