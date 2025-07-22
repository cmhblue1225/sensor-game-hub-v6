/**
 * 센서 데이터 스무딩 시스템
 * 센서 데이터의 노이즈를 제거하고 안정화합니다.
 */
class SensorSmoothingSystem {
    constructor() {
        this.smoothingBuffer = {
            orientation: { alpha: [], beta: [], gamma: [] },
            acceleration: { x: [], y: [], z: [] }
        };
        
        this.bufferSize = 5;
        this.quality = {
            overallQuality: 1.0
        };
        
        console.log('✅ 센서 스무딩 시스템 초기화 완료');
    }
    
    /**
     * 센서 데이터 처리
     */
    process(sensorData) {
        if (!sensorData || !sensorData.orientation) {
            return sensorData;
        }
        
        return this.smoothSensorData(sensorData);
    }
    
    /**
     * 센서 데이터 스무딩
     */
    smoothSensorData(sensorData) {
        const smoothed = {
            orientation: {},
            acceleration: {},
            timestamp: sensorData.timestamp
        };
        
        // 방향 데이터 스무딩
        if (sensorData.orientation) {
            smoothed.orientation = {
                alpha: this.smoothValue('orientation', 'alpha', sensorData.orientation.alpha || 0),
                beta: this.smoothValue('orientation', 'beta', sensorData.orientation.beta || 0),
                gamma: this.smoothValue('orientation', 'gamma', sensorData.orientation.gamma || 0)
            };
        }
        
        // 가속도 데이터 스무딩
        if (sensorData.acceleration) {
            smoothed.acceleration = {
                x: this.smoothValue('acceleration', 'x', sensorData.acceleration.x || 0),
                y: this.smoothValue('acceleration', 'y', sensorData.acceleration.y || 0),
                z: this.smoothValue('acceleration', 'z', sensorData.acceleration.z || 0)
            };
        }
        
        return smoothed;
    }
    
    /**
     * 값 스무딩
     */
    smoothValue(category, axis, value) {
        const buffer = this.smoothingBuffer[category][axis];
        
        // 버퍼에 값 추가
        buffer.push(value);
        
        // 버퍼 크기 제한
        if (buffer.length > this.bufferSize) {
            buffer.shift();
        }
        
        // 평균 계산
        const sum = buffer.reduce((acc, val) => acc + val, 0);
        return sum / buffer.length;
    }
    
    /**
     * 디버그 정보 가져오기
     */
    getDebugInfo() {
        return {
            bufferSize: this.bufferSize,
            quality: this.quality
        };
    }
}