// Features Layer - 센서 제어 기능
import { clamp } from '../../shared/lib/utils.js';

export class SensorController {
    constructor() {
        this.sensorData = {
            sensor1: { tilt: { x: 0, y: 0 } },
            sensor2: { tilt: { x: 0, y: 0 } }
        };
        
        // 조준점 설정
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
        
        // 대규모 경쟁 모드 전용 설정
        this.massCompetitiveCrosshair = {
            smoothing: 0.18,
            adaptiveSmoothing: false,
            currentSmoothing: 0.18,
            smoothingTransition: 0.05
        };
    }

    // 센서 데이터 처리
    processSensorData(data, gameMode, playerManager = null) {
        const sensorData = data.data;
        const sensorId = data.sensorId || 'sensor';

        if (!sensorData.orientation) return;

        if (gameMode === 'solo' || sensorId === 'sensor1') {
            this.sensorData.sensor1.tilt.x = sensorData.orientation.beta || 0;
            this.sensorData.sensor1.tilt.y = sensorData.orientation.gamma || 0;
            
        } else if ((gameMode === 'coop' || gameMode === 'competitive') && sensorId === 'sensor2') {
            this.sensorData.sensor2.tilt.x = sensorData.orientation.beta || 0;
            this.sensorData.sensor2.tilt.y = sensorData.orientation.gamma || 0;
            
        } else if (gameMode === 'mass-competitive' && playerManager) {
            const player = playerManager.getPlayer(sensorId);
            if (player) {
                player.updateSensorData(
                    sensorData.orientation.beta || 0,
                    sensorData.orientation.gamma || 0
                );
                
                // 내 플레이어인 경우 메인 센서 데이터 업데이트는 게임에서 처리
            }
        }
    }

    // 센서 움직임 적용
    applySensorMovement(gameMode, canvasWidth, canvasHeight) {
        const sensitivity = 15;
        const maxTilt = 25;

        if (gameMode === 'solo') {
            this._applySoloMovement(canvasWidth, canvasHeight, sensitivity, maxTilt);
        } else if (gameMode === 'coop') {
            this._applyCoopMovement(canvasWidth, canvasHeight, sensitivity, maxTilt);
        } else if (gameMode === 'competitive') {
            this._applyCompetitiveMovement(canvasWidth, canvasHeight, sensitivity, maxTilt);
        } else if (gameMode === 'mass-competitive') {
            this._applyMassCompetitiveMovement(canvasWidth, canvasHeight, sensitivity, maxTilt);
        }
    }

    // 솔로 모드 움직임
    _applySoloMovement(canvasWidth, canvasHeight, sensitivity, maxTilt) {
        const normalizedTiltX = clamp(this.sensorData.sensor1.tilt.y / maxTilt, -1, 1);
        const normalizedTiltY = clamp(this.sensorData.sensor1.tilt.x / maxTilt, -1, 1);
        
        this.crosshair.targetX = canvasWidth / 2 + (normalizedTiltX * canvasWidth / 2);
        this.crosshair.targetY = canvasHeight / 2 + (normalizedTiltY * canvasHeight / 2);
        
        this.crosshair.targetX = clamp(this.crosshair.targetX, 0, canvasWidth);
        this.crosshair.targetY = clamp(this.crosshair.targetY, 0, canvasHeight);
    }

    // 협동 모드 움직임
    _applyCoopMovement(canvasWidth, canvasHeight, sensitivity, maxTilt) {
        // 첫 번째 센서 (좌측)
        const normalizedTiltX1 = clamp(this.sensorData.sensor1.tilt.y / maxTilt, -1, 1);
        const normalizedTiltY1 = clamp(this.sensorData.sensor1.tilt.x / maxTilt, -1, 1);
        
        this.crosshair.targetX = canvasWidth / 4 + (normalizedTiltX1 * canvasWidth / 4);
        this.crosshair.targetY = canvasHeight / 2 + (normalizedTiltY1 * canvasHeight / 2);
        
        this.crosshair.targetX = clamp(this.crosshair.targetX, 0, canvasWidth / 2);
        this.crosshair.targetY = clamp(this.crosshair.targetY, 0, canvasHeight);
        
        // 두 번째 센서 (우측)
        const normalizedTiltX2 = clamp(this.sensorData.sensor2.tilt.y / maxTilt, -1, 1);
        const normalizedTiltY2 = clamp(this.sensorData.sensor2.tilt.x / maxTilt, -1, 1);
        
        this.crosshair2.targetX = canvasWidth * 3/4 + (normalizedTiltX2 * canvasWidth / 4);
        this.crosshair2.targetY = canvasHeight / 2 + (normalizedTiltY2 * canvasHeight / 2);
        
        this.crosshair2.targetX = clamp(this.crosshair2.targetX, canvasWidth / 2, canvasWidth);
        this.crosshair2.targetY = clamp(this.crosshair2.targetY, 0, canvasHeight);
    }

    // 경쟁 모드 움직임
    _applyCompetitiveMovement(canvasWidth, canvasHeight, sensitivity, maxTilt) {
        // 두 센서 모두 전체 화면 범위
        const normalizedTiltX1 = clamp(this.sensorData.sensor1.tilt.y / maxTilt, -1, 1);
        const normalizedTiltY1 = clamp(this.sensorData.sensor1.tilt.x / maxTilt, -1, 1);
        
        this.crosshair.targetX = canvasWidth / 2 + (normalizedTiltX1 * canvasWidth / 2);
        this.crosshair.targetY = canvasHeight / 2 + (normalizedTiltY1 * canvasHeight / 2);
        
        this.crosshair.targetX = clamp(this.crosshair.targetX, 0, canvasWidth);
        this.crosshair.targetY = clamp(this.crosshair.targetY, 0, canvasHeight);
        
        const normalizedTiltX2 = clamp(this.sensorData.sensor2.tilt.y / maxTilt, -1, 1);
        const normalizedTiltY2 = clamp(this.sensorData.sensor2.tilt.x / maxTilt, -1, 1);
        
        this.crosshair2.targetX = canvasWidth / 2 + (normalizedTiltX2 * canvasWidth / 2);
        this.crosshair2.targetY = canvasHeight / 2 + (normalizedTiltY2 * canvasHeight / 2);
        
        this.crosshair2.targetX = clamp(this.crosshair2.targetX, 0, canvasWidth);
        this.crosshair2.targetY = clamp(this.crosshair2.targetY, 0, canvasHeight);
    }

    // 대규모 경쟁 모드 움직임
    _applyMassCompetitiveMovement(canvasWidth, canvasHeight, sensitivity, maxTilt) {
        const normalizedTiltX = clamp(this.sensorData.sensor1.tilt.y / maxTilt, -1, 1);
        const normalizedTiltY = clamp(this.sensorData.sensor1.tilt.x / maxTilt, -1, 1);
        
        this.crosshair.targetX = canvasWidth / 2 + (normalizedTiltX * canvasWidth / 2);
        this.crosshair.targetY = canvasHeight / 2 + (normalizedTiltY * canvasHeight / 2);
        
        this.crosshair.targetX = clamp(this.crosshair.targetX, 0, canvasWidth);
        this.crosshair.targetY = clamp(this.crosshair.targetY, 0, canvasHeight);
    }

    // 조준점 부드러운 이동
    updateCrosshairPosition(gameMode) {
        if (gameMode === 'mass-competitive') {
            const smoothingValue = this.massCompetitiveCrosshair.smoothing;
            this.crosshair.x += (this.crosshair.targetX - this.crosshair.x) * smoothingValue;
            this.crosshair.y += (this.crosshair.targetY - this.crosshair.y) * smoothingValue;
        } else {
            this.crosshair.x += (this.crosshair.targetX - this.crosshair.x) * this.crosshair.smoothing;
            this.crosshair.y += (this.crosshair.targetY - this.crosshair.y) * this.crosshair.smoothing;
        }

        // 듀얼 모드에서 두 번째 조준점 처리
        if (gameMode === 'coop' || gameMode === 'competitive') {
            this.crosshair2.x += (this.crosshair2.targetX - this.crosshair2.x) * this.crosshair2.smoothing;
            this.crosshair2.y += (this.crosshair2.targetY - this.crosshair2.y) * this.crosshair2.smoothing;
        }
    }

    // 조준점 초기 위치 설정
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
}