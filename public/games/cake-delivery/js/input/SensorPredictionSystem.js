/**
 * 센서 예측 시스템
 * 센서 데이터의 지연을 보상하고 예측합니다.
 */
class SensorPredictionSystem {
    constructor() {
        this.predictionHistory = [];
        this.maxHistorySize = 10;
        
        console.log('✅ 센서 예측 시스템 초기화 완료');
    }
    
    /**
     * 다음 값 예측
     */
    predictNextValue(sensorData, timestamp) {
        if (!sensorData) return sensorData;
        
        // 히스토리에 추가
        this.predictionHistory.push({
            data: sensorData,
            timestamp: timestamp || Date.now()
        });
        
        // 히스토리 크기 제한
        if (this.predictionHistory.length > this.maxHistorySize) {
            this.predictionHistory.shift();
        }
        
        // 예측 수행
        return this.performPrediction(sensorData);
    }
    
    /**
     * 예측 수행
     */
    performPrediction(currentData) {
        if (this.predictionHistory.length < 2) {
            return currentData;
        }
        
        const predicted = {
            orientation: {},
            acceleration: {},
            timestamp: Date.now()
        };
        
        // 방향 데이터 예측
        if (currentData.orientation) {
            predicted.orientation = {
                alpha: this.predictValue('orientation', 'alpha'),
                beta: this.predictValue('orientation', 'beta'),
                gamma: this.predictValue('orientation', 'gamma')
            };
        }
        
        // 가속도 데이터 예측
        if (currentData.acceleration) {
            predicted.acceleration = {
                x: this.predictValue('acceleration', 'x'),
                y: this.predictValue('acceleration', 'y'),
                z: this.predictValue('acceleration', 'z')
            };
        }
        
        return predicted;
    }
    
    /**
     * 개별 값 예측
     */
    predictValue(category, axis) {
        if (this.predictionHistory.length < 2) {
            return 0;
        }
        
        const recent = this.predictionHistory[this.predictionHistory.length - 1];
        const previous = this.predictionHistory[this.predictionHistory.length - 2];
        
        const recentValue = recent.data[category] ? recent.data[category][axis] || 0 : 0;
        const previousValue = previous.data[category] ? previous.data[category][axis] || 0 : 0;
        
        // 선형 예측
        const velocity = recentValue - previousValue;
        const timeDelta = (recent.timestamp - previous.timestamp) / 1000; // 초 단위
        
        // 예측 시간 (50ms 앞서 예측)
        const predictionTime = 0.05;
        
        return recentValue + (velocity * predictionTime / timeDelta);
    }
    
    /**
     * 예측 히스토리 정리
     */
    clearHistory() {
        this.predictionHistory = [];
    }
}