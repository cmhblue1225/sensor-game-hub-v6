// ===== FEATURES/SENSOR-MANAGER =====
// 센서 데이터 관리 및 처리

import { GAME_CONFIG } from '../shared/config.js';
import { GameUtils } from '../shared/utils.js';

export class SensorManager {
    constructor(gameMode) {
        this.gameMode = gameMode;
        this.players = new Map(); // playerId -> Player 객체
        this.sensorData = new Map(); // sensorId -> 센서 데이터
        
        // 센서 처리 최적화
        this.lastProcessTime = 0;
        this.processingInterval = GAME_CONFIG.SENSOR.throttleInterval;
        
        // 연결 상태 추적
        this.connectedSensors = new Set();
        this.connectionCallbacks = new Map();
        
        // 성능 모니터링
        this.performanceMonitor = GameUtils.createPerformanceMonitor();
    }

    // 플레이어 추가
    addPlayer(playerId, player) {
        this.players.set(playerId, player);
        
        // 모드별 스무딩 설정
        player.setSmoothingForMode(this.gameMode);
        
        console.log(`🎯 [센서 매니저] 플레이어 추가: ${playerId}`);
    }

    // 플레이어 제거
    removePlayer(playerId) {
        if (this.players.has(playerId)) {
            const player = this.players.get(playerId);
            player.disconnect();
            this.players.delete(playerId);
            this.connectedSensors.delete(playerId);
            
            console.log(`🎯 [센서 매니저] 플레이어 제거: ${playerId}`);
        }
    }

    // 센서 연결 처리
    handleSensorConnected(sensorId, totalConnected = 1) {
        this.connectedSensors.add(sensorId);
        
        // 연결 콜백 실행
        if (this.connectionCallbacks.has('connected')) {
            this.connectionCallbacks.get('connected')(sensorId, totalConnected);
        }
        
        console.log(`🔍 [센서 매니저] 센서 연결: ${sensorId} (총 ${totalConnected}개)`);
    }

    // 센서 연결 해제 처리
    handleSensorDisconnected(sensorId) {
        this.connectedSensors.delete(sensorId);
        
        // 플레이어 연결 해제 처리
        if (this.players.has(sensorId)) {
            this.players.get(sensorId).disconnect();
        }
        
        // 연결 해제 콜백 실행
        if (this.connectionCallbacks.has('disconnected')) {
            this.connectionCallbacks.get('disconnected')(sensorId);
        }
        
        console.log(`🔍 [센서 매니저] 센서 연결 해제: ${sensorId}`);
    }

    // 센서 데이터 처리 (개선된 부드러운 움직임)
    processSensorData(sensorId, data) {
        const now = Date.now();
        
        // 스로틀링 체크 (60fps 유지)
        if (now - this.lastProcessTime < this.processingInterval) {
            return;
        }
        
        // 센서 데이터 저장
        this.sensorData.set(sensorId, {
            ...data,
            timestamp: now
        });
        
        // 플레이어 센서 데이터 업데이트
        if (this.players.has(sensorId)) {
            const player = this.players.get(sensorId);
            
            if (data.orientation) {
                player.updateSensorData(
                    data.orientation.beta || 0,
                    data.orientation.gamma || 0
                );
            }
        }
        
        this.lastProcessTime = now;
    }

    // 모든 플레이어 조준점 업데이트
    updateAllCrosshairs(canvasWidth, canvasHeight) {
        this.players.forEach((player, playerId) => {
            if (!player.isActive || !player.isConnected) return;
            
            // 모드별 화면 영역 설정
            let screenMode = 'full';
            
            if (this.gameMode === GAME_CONFIG.MODES.COOP) {
                // 협동 모드: 화면 분할
                if (playerId === 'sensor1') {
                    screenMode = 'left-half';
                } else if (playerId === 'sensor2') {
                    screenMode = 'right-half';
                }
            }
            
            player.updateCrosshair(canvasWidth, canvasHeight, screenMode);
        });
    }

    // 특정 플레이어 조준점 위치 가져오기
    getPlayerCrosshair(playerId) {
        const player = this.players.get(playerId);
        return player ? { x: player.crosshair.x, y: player.crosshair.y } : null;
    }

    // 모든 플레이어 조준점 위치 가져오기
    getAllCrosshairs() {
        const crosshairs = new Map();
        
        this.players.forEach((player, playerId) => {
            if (player.isActive && player.isConnected) {
                crosshairs.set(playerId, {
                    x: player.crosshair.x,
                    y: player.crosshair.y,
                    color: player.color,
                    colorIndex: player.colorIndex
                });
            }
        });
        
        return crosshairs;
    }

    // 연결된 센서 수 반환
    getConnectedCount() {
        return this.connectedSensors.size;
    }

    // 활성 플레이어 수 반환
    getActivePlayerCount() {
        let count = 0;
        this.players.forEach(player => {
            if (player.isActive && player.isConnected) count++;
        });
        return count;
    }

    // 특정 센서 연결 상태 확인
    isSensorConnected(sensorId) {
        return this.connectedSensors.has(sensorId);
    }

    // 모든 필요한 센서가 연결되었는지 확인
    areAllSensorsConnected() {
        switch (this.gameMode) {
            case GAME_CONFIG.MODES.SOLO:
                return this.connectedSensors.size >= 1;
            
            case GAME_CONFIG.MODES.COOP:
            case GAME_CONFIG.MODES.COMPETITIVE:
                return this.connectedSensors.size >= 2;
            
            case GAME_CONFIG.MODES.MASS_COMPETITIVE:
                return this.connectedSensors.size >= GAME_CONFIG.MASS_COMPETITIVE.minPlayers;
            
            default:
                return false;
        }
    }

    // 이벤트 콜백 등록
    on(event, callback) {
        this.connectionCallbacks.set(event, callback);
    }

    // 센서 데이터 품질 체크
    checkDataQuality(sensorId) {
        const data = this.sensorData.get(sensorId);
        if (!data) return { quality: 'none', message: '데이터 없음' };
        
        const age = Date.now() - data.timestamp;
        
        if (age > 1000) {
            return { quality: 'poor', message: '데이터가 오래됨' };
        } else if (age > 500) {
            return { quality: 'fair', message: '데이터 지연' };
        } else {
            return { quality: 'good', message: '정상' };
        }
    }

    // 성능 통계 반환
    getPerformanceStats() {
        const fps = this.performanceMonitor.tick();
        
        return {
            fps: fps,
            connectedSensors: this.connectedSensors.size,
            activePlayers: this.getActivePlayerCount(),
            processingInterval: this.processingInterval,
            lastProcessTime: this.lastProcessTime
        };
    }

    // 센서 감도 조정
    adjustSensitivity(playerId, sensitivity) {
        const player = this.players.get(playerId);
        if (player) {
            // 감도에 따른 스무딩 값 조정
            const baseSmoothingValue = GAME_CONFIG.SENSOR.smoothing[this.gameMode];
            player.crosshair.smoothing = baseSmoothingValue * (2 - sensitivity); // 감도가 높을수록 스무딩 감소
            
            console.log(`🎯 [센서 매니저] ${playerId} 감도 조정: ${sensitivity}`);
        }
    }

    // 디버그 정보 출력
    getDebugInfo() {
        const info = {
            gameMode: this.gameMode,
            connectedSensors: Array.from(this.connectedSensors),
            players: {},
            sensorData: {}
        };
        
        // 플레이어 정보
        this.players.forEach((player, playerId) => {
            info.players[playerId] = player.getInfo();
        });
        
        // 센서 데이터 품질
        this.sensorData.forEach((data, sensorId) => {
            info.sensorData[sensorId] = this.checkDataQuality(sensorId);
        });
        
        return info;
    }

    // 정리 (메모리 누수 방지)
    cleanup() {
        this.players.clear();
        this.sensorData.clear();
        this.connectedSensors.clear();
        this.connectionCallbacks.clear();
        
        console.log('🎯 [센서 매니저] 정리 완료');
    }

    // 게임 모드 변경
    changeGameMode(newMode) {
        this.gameMode = newMode;
        
        // 모든 플레이어의 스무딩 값 재설정
        this.players.forEach(player => {
            player.setSmoothingForMode(newMode);
        });
        
        console.log(`🎯 [센서 매니저] 게임 모드 변경: ${newMode}`);
    }
}