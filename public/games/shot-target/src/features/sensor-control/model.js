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
    processSensorData(data, gameMode, playerManager = null, canvasWidth = window.innerWidth, canvasHeight = window.innerHeight) {
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
                
                // ✅ 모든 플레이어의 조준점 위치 즉시 계산 및 업데이트
                // 센서 데이터가 들어올 때마다 해당 플레이어의 조준점 위치 계산
                this.calculatePlayerCrosshairPosition(player, canvasWidth, canvasHeight);
                
                console.log(`🎯 [${player.name}] 센서 데이터 처리 완료: 조준점 (${player.crosshairX?.toFixed(1)}, ${player.crosshairY?.toFixed(1)})`);
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

    // ✅ 개별 플레이어 조준점 위치 계산 (대규모 경쟁 모드용)
    calculatePlayerCrosshairPosition(player, canvasWidth = window.innerWidth, canvasHeight = window.innerHeight) {
        const sensitivity = 15;
        const maxTilt = 25;
        
        // 센서 데이터를 화면 좌표로 변환
        const normalizedTiltX = clamp(player.tilt.y / maxTilt, -1, 1);
        const normalizedTiltY = clamp(player.tilt.x / maxTilt, -1, 1);
        
        // 조준점 목표 위치 계산 (전체 화면 범위)
        const targetX = canvasWidth / 2 + (normalizedTiltX * canvasWidth / 2);
        const targetY = canvasHeight / 2 + (normalizedTiltY * canvasHeight / 2);
        
        // 화면 경계 제한
        const clampedX = clamp(targetX, 0, canvasWidth);
        const clampedY = clamp(targetY, 0, canvasHeight);
        
        // 플레이어 조준점 위치 업데이트 (부드러운 이동 적용)
        const smoothing = 0.18; // 대규모 경쟁 모드 전용 스무딩
        
        if (!player.crosshairX) player.crosshairX = canvasWidth / 2;
        if (!player.crosshairY) player.crosshairY = canvasHeight / 2;
        
        player.crosshairX += (clampedX - player.crosshairX) * smoothing;
        player.crosshairY += (clampedY - player.crosshairY) * smoothing;
        
        // 디버그 로그 (가끔씩만)
        if (Math.random() < 0.01) { // 1% 확률로만 로그
            console.log(`🎯 [${player.name}] 조준점 위치: (${player.crosshairX.toFixed(1)}, ${player.crosshairY.toFixed(1)})`);
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