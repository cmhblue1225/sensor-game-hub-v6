import { GAME_CONFIG } from '../shared/config.js';

export class SensorManager {
    constructor() {
        this.sensorStatus = {
            sensor1: { connected: false, lastSwing: 0 },
            sensor2: { connected: false, lastSwing: 0 }
        };
        
        this.swingCallbacks = [];
    }

    onSwing(callback) {
        this.swingCallbacks.push(callback);
    }

    handleSensorConnect(data) {
        const sensorId = data.sensorId;
        
        if (this.sensorStatus[sensorId]) {
            this.sensorStatus[sensorId].connected = true;
            
            const statusElement = document.getElementById(`${sensorId}Status`);
            if (statusElement) {
                statusElement.textContent = '연결됨';
                statusElement.className = 'sensor-status connected';
            }
        }
    }

    handleSensorDisconnect(data) {
        const sensorId = data.sensorId;
        
        if (this.sensorStatus[sensorId]) {
            this.sensorStatus[sensorId].connected = false;
            
            const statusElement = document.getElementById(`${sensorId}Status`);
            if (statusElement) {
                statusElement.textContent = '연결 대기중';
                statusElement.className = 'sensor-status disconnected';
            }
        }
    }

    getConnectedCount() {
        return Object.values(this.sensorStatus).filter(s => s.connected).length;
    }

    handleSensorData(data) {
        const sensorId = data.sensorId;
        const sensorData = data.data;
        
        if (this.sensorStatus[sensorId]) {
            // 회전 속도 기반 스윙 감지
            const rotationSpeed = Math.abs(sensorData.rotationRate?.alpha || 0) + 
                                  Math.abs(sensorData.rotationRate?.beta || 0) + 
                                  Math.abs(sensorData.rotationRate?.gamma || 0);
            
            if (rotationSpeed > GAME_CONFIG.SWING_THRESHOLD) {
                const now = Date.now();
                
                // 중복 스윙 방지 (쿨다운)
                if (now - this.sensorStatus[sensorId].lastSwing > 200) {
                    this.sensorStatus[sensorId].lastSwing = now;
                    this.triggerSwing(sensorId);
                }
            }
        }
    }

    triggerSwing(sensorId) {
        this.swingCallbacks.forEach(callback => {
            callback(sensorId);
        });
    }

    // 키보드 테스트용 메소드
    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'q':
                case 'a':
                    this.triggerSwing('sensor1');
                    break;
                case 'p':
                case 'l':
                    this.triggerSwing('sensor2');
                    break;
                case ' ':
                    // 스페이스바로 협력 액션 시뮬레이션
                    this.triggerSwing('sensor1');
                    setTimeout(() => this.triggerSwing('sensor2'), 50);
                    break;
            }
        });
    }

    getSensorStatus(sensorId) {
        return this.sensorStatus[sensorId];
    }

    isAllSensorsConnected() {
        return Object.values(this.sensorStatus).every(s => s.connected);
    }

    reset() {
        Object.values(this.sensorStatus).forEach(status => {
            status.lastSwing = 0;
        });
    }
}