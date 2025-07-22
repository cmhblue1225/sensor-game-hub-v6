/**
 * 센서 예측 시스템
 * 선형 예측 알고리즘과 네트워크 지연 보상을 통한 반응성 향상
 */
class SensorPredictionSystem {
    constructor() {
        // 예측 알고리즘 타입
        this.predictionTypes = {
            LINEAR: 'linear',
            QUADRATIC: 'quadratic',
            EXPONENTIAL: 'exponential',
            ADAPTIVE: 'adaptive'
        };
        
        // 현재 활성 예측 알고리즘
        this.activePrediction = this.predictionTypes.ADAPTIVE;
        
        // 데이터 히스토리 (예측용)
        this.dataHistory = {
            orientation: [],
            acceleration: [],
            rotationRate: []
        };
        
        // 히스토리 설정
        this.historyConfig = {
            maxSize: 10, // 최대 히스토리 크기
            minSize: 3,  // 예측에 필요한 최소 데이터 수
            timeWindow: 200 // 시간 윈도우 (ms)
        };
        
        // 지연 보상 설정
        this.latencyCompensation = {
            enabled: true,
            networkLatency: 50, // 네트워크 지연 (ms)
            processingLatency: 16, // 처리 지연 (ms, ~60fps)
            totalLatency: 66, // 총 지연
            adaptiveLatency: true, // 적응형 지연 측정
            latencyHistory: [],
            maxLatencyHistory: 20
        };
        
        // 선형 예측 설정
        this.linearPrediction = {
            enabled: true,
            lookAheadTime: 0.1, // 예측 시간 (초)
            confidenceThreshold: 0.8, // 신뢰도 임계값
            velocitySmoothing: 0.7 // 속도 스무딩 계수
        };
        
        // 적응형 예측 설정
        this.adaptivePrediction = {
            enabled: true,
            learningRate: 0.1,
            errorThreshold: 0.5,
            adaptationSpeed: 0.05,
            predictionWeights: {
                linear: 0.6,
                quadratic: 0.3,
                exponential: 0.1
            }
        };
        
        // 예측 정확도 모니터링
        this.accuracy = {
            predictions: 0,
            correctPredictions: 0,
            averageError: 0,
            errorHistory: [],
            maxErrorHistory: 50
        };
        
        // 속도 계산용 이전 값들
        this.previousValues = {
            orientation: { alpha: 0, beta: 0, gamma: 0, timestamp: 0 },
            acceleration: { x: 0, y: 0, z: 0, timestamp: 0 },
            rotationRate: { alpha: 0, beta: 0, gamma: 0, timestamp: 0 }
        };
        
        // 계산된 속도들
        this.velocities = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            rotationRate: { alpha: 0, beta: 0, gamma: 0 }
        };
        
        // 성능 모니터링
        this.performance = {
            predictionTime: 0,
            latencyMeasurements: 0,
            adaptations: 0
        };
        
        console.log('🔮 센서 예측 시스템 초기화 완료');
    }
    
    /**
     * 다음 값 예측
     * @param {Object} currentData - 현재 센서 데이터
     * @param {number} timestamp - 타임스탬프
     * @returns {Object} 예측된 센서 데이터
     */
    predictNextValue(currentData, timestamp) {
        const startTime = performance.now();
        
        if (!currentData || !timestamp) {
            return currentData;
        }
        
        // 데이터 히스토리 업데이트
        this.updateDataHistory(currentData, timestamp);
        
        // 속도 계산
        this.calculateVelocities(currentData, timestamp);
        
        // 지연 시간 계산
        const latency = this.calculateLatency(timestamp);
        
        // 예측 수행
        const predictedData = this.performPrediction(currentData, latency);
        
        // 예측 정확도 업데이트 (이전 예측과 실제 값 비교)
        this.updateAccuracy(currentData);
        
        // 적응형 학습
        if (this.adaptivePrediction.enabled) {\n            this.adaptPredictionWeights();\n        }\n        \n        // 성능 모니터링\n        this.performance.predictionTime = performance.now() - startTime;\n        \n        return predictedData;\n    }\n    \n    /**\n     * 데이터 히스토리 업데이트\n     * @param {Object} data - 센서 데이터\n     * @param {number} timestamp - 타임스탬프\n     */\n    updateDataHistory(data, timestamp) {\n        const maxSize = this.historyConfig.maxSize;\n        const timeWindow = this.historyConfig.timeWindow;\n        \n        // 각 센서 타입별 히스토리 업데이트\n        Object.keys(data).forEach(sensorType => {\n            if (data[sensorType] && this.dataHistory[sensorType]) {\n                const history = this.dataHistory[sensorType];\n                \n                // 새 데이터 추가\n                history.push({\n                    ...data[sensorType],\n                    timestamp\n                });\n                \n                // 크기 제한\n                if (history.length > maxSize) {\n                    history.shift();\n                }\n                \n                // 시간 윈도우 제한\n                const cutoffTime = timestamp - timeWindow;\n                while (history.length > 0 && history[0].timestamp < cutoffTime) {\n                    history.shift();\n                }\n            }\n        });\n    }\n    \n    /**\n     * 속도 계산\n     * @param {Object} currentData - 현재 데이터\n     * @param {number} timestamp - 타임스탬프\n     */\n    calculateVelocities(currentData, timestamp) {\n        Object.keys(currentData).forEach(sensorType => {\n            if (currentData[sensorType] && this.previousValues[sensorType]) {\n                const current = currentData[sensorType];\n                const previous = this.previousValues[sensorType];\n                const dt = (timestamp - previous.timestamp) / 1000; // 초 단위\n                \n                if (dt > 0 && dt < 1) { // 유효한 시간 간격\n                    const velocity = this.velocities[sensorType];\n                    const smoothing = this.linearPrediction.velocitySmoothing;\n                    \n                    Object.keys(current).forEach(axis => {\n                        if (typeof current[axis] === 'number' && typeof previous[axis] === 'number') {\n                            const newVelocity = (current[axis] - previous[axis]) / dt;\n                            \n                            // 속도 스무딩\n                            velocity[axis] = smoothing * (velocity[axis] || 0) + (1 - smoothing) * newVelocity;\n                        }\n                    });\n                }\n                \n                // 이전 값 업데이트\n                Object.assign(previous, current);\n                previous.timestamp = timestamp;\n            }\n        });\n    }\n    \n    /**\n     * 지연 시간 계산\n     * @param {number} timestamp - 현재 타임스탬프\n     * @returns {number} 지연 시간 (초)\n     */\n    calculateLatency(timestamp) {\n        if (!this.latencyCompensation.enabled) {\n            return 0;\n        }\n        \n        let latency = this.latencyCompensation.totalLatency;\n        \n        // 적응형 지연 측정\n        if (this.latencyCompensation.adaptiveLatency) {\n            const currentTime = Date.now();\n            const measuredLatency = currentTime - timestamp;\n            \n            // 지연 히스토리 업데이트\n            const latencyHistory = this.latencyCompensation.latencyHistory;\n            latencyHistory.push(measuredLatency);\n            \n            if (latencyHistory.length > this.latencyCompensation.maxLatencyHistory) {\n                latencyHistory.shift();\n            }\n            \n            // 평균 지연 계산\n            if (latencyHistory.length > 0) {\n                const avgLatency = latencyHistory.reduce((sum, val) => sum + val, 0) / latencyHistory.length;\n                latency = avgLatency;\n                this.latencyCompensation.totalLatency = latency;\n            }\n            \n            this.performance.latencyMeasurements++;\n        }\n        \n        return latency / 1000; // 초 단위로 변환\n    }\n    \n    /**\n     * 예측 수행\n     * @param {Object} currentData - 현재 데이터\n     * @param {number} latency - 지연 시간\n     * @returns {Object} 예측된 데이터\n     */\n    performPrediction(currentData, latency) {\n        const predictedData = {};\n        \n        Object.keys(currentData).forEach(sensorType => {\n            if (currentData[sensorType]) {\n                predictedData[sensorType] = this.predictSensorType(sensorType, latency);\n            }\n        });\n        \n        return predictedData;\n    }\n    \n    /**\n     * 센서 타입별 예측\n     * @param {string} sensorType - 센서 타입\n     * @param {number} latency - 지연 시간\n     * @returns {Object} 예측된 값\n     */\n    predictSensorType(sensorType, latency) {\n        const history = this.dataHistory[sensorType];\n        \n        if (!history || history.length < this.historyConfig.minSize) {\n            // 히스토리가 부족하면 현재 값 반환\n            return history && history.length > 0 ? \n                   { ...history[history.length - 1] } : {};\n        }\n        \n        const lookAheadTime = this.linearPrediction.lookAheadTime + latency;\n        \n        switch (this.activePrediction) {\n            case this.predictionTypes.LINEAR:\n                return this.linearPredict(history, lookAheadTime);\n                \n            case this.predictionTypes.QUADRATIC:\n                return this.quadraticPredict(history, lookAheadTime);\n                \n            case this.predictionTypes.EXPONENTIAL:\n                return this.exponentialPredict(history, lookAheadTime);\n                \n            case this.predictionTypes.ADAPTIVE:\n                return this.adaptivePredict(history, lookAheadTime);\n                \n            default:\n                return this.linearPredict(history, lookAheadTime);\n        }\n    }\n    \n    /**\n     * 선형 예측\n     * @param {Array} history - 데이터 히스토리\n     * @param {number} lookAheadTime - 예측 시간\n     * @returns {Object} 예측된 값\n     */\n    linearPredict(history, lookAheadTime) {\n        if (history.length < 2) {\n            return { ...history[history.length - 1] };\n        }\n        \n        const latest = history[history.length - 1];\n        const previous = history[history.length - 2];\n        const dt = (latest.timestamp - previous.timestamp) / 1000;\n        \n        if (dt <= 0) {\n            return { ...latest };\n        }\n        \n        const predicted = {};\n        \n        Object.keys(latest).forEach(axis => {\n            if (typeof latest[axis] === 'number' && typeof previous[axis] === 'number') {\n                const velocity = (latest[axis] - previous[axis]) / dt;\n                predicted[axis] = latest[axis] + velocity * lookAheadTime;\n            } else {\n                predicted[axis] = latest[axis];\n            }\n        });\n        \n        return predicted;\n    }\n    \n    /**\n     * 2차 예측 (가속도 고려)\n     * @param {Array} history - 데이터 히스토리\n     * @param {number} lookAheadTime - 예측 시간\n     * @returns {Object} 예측된 값\n     */\n    quadraticPredict(history, lookAheadTime) {\n        if (history.length < 3) {\n            return this.linearPredict(history, lookAheadTime);\n        }\n        \n        const latest = history[history.length - 1];\n        const middle = history[history.length - 2];\n        const earliest = history[history.length - 3];\n        \n        const dt1 = (latest.timestamp - middle.timestamp) / 1000;\n        const dt2 = (middle.timestamp - earliest.timestamp) / 1000;\n        \n        if (dt1 <= 0 || dt2 <= 0) {\n            return this.linearPredict(history, lookAheadTime);\n        }\n        \n        const predicted = {};\n        \n        Object.keys(latest).forEach(axis => {\n            if (typeof latest[axis] === 'number' && \n                typeof middle[axis] === 'number' && \n                typeof earliest[axis] === 'number') {\n                \n                // 속도 계산\n                const v1 = (latest[axis] - middle[axis]) / dt1;\n                const v2 = (middle[axis] - earliest[axis]) / dt2;\n                \n                // 가속도 계산\n                const acceleration = (v1 - v2) / ((dt1 + dt2) / 2);\n                \n                // 2차 예측: x = x0 + v*t + 0.5*a*t²\n                predicted[axis] = latest[axis] + \n                                v1 * lookAheadTime + \n                                0.5 * acceleration * lookAheadTime * lookAheadTime;\n            } else {\n                predicted[axis] = latest[axis];\n            }\n        });\n        \n        return predicted;\n    }\n    \n    /**\n     * 지수 예측 (트렌드 기반)\n     * @param {Array} history - 데이터 히스토리\n     * @param {number} lookAheadTime - 예측 시간\n     * @returns {Object} 예측된 값\n     */\n    exponentialPredict(history, lookAheadTime) {\n        if (history.length < 2) {\n            return { ...history[history.length - 1] };\n        }\n        \n        const latest = history[history.length - 1];\n        const predicted = {};\n        \n        Object.keys(latest).forEach(axis => {\n            if (typeof latest[axis] === 'number') {\n                // 지수 가중 이동 평균을 사용한 트렌드 계산\n                let trendSum = 0;\n                let weightSum = 0;\n                \n                for (let i = 1; i < history.length; i++) {\n                    const current = history[i];\n                    const previous = history[i - 1];\n                    const dt = (current.timestamp - previous.timestamp) / 1000;\n                    \n                    if (dt > 0 && typeof current[axis] === 'number' && typeof previous[axis] === 'number') {\n                        const trend = (current[axis] - previous[axis]) / dt;\n                        const weight = Math.exp(-(history.length - i)); // 최근 데이터에 더 높은 가중치\n                        \n                        trendSum += trend * weight;\n                        weightSum += weight;\n                    }\n                }\n                \n                const avgTrend = weightSum > 0 ? trendSum / weightSum : 0;\n                predicted[axis] = latest[axis] + avgTrend * lookAheadTime;\n            } else {\n                predicted[axis] = latest[axis];\n            }\n        });\n        \n        return predicted;\n    }\n    \n    /**\n     * 적응형 예측 (여러 방법의 가중 평균)\n     * @param {Array} history - 데이터 히스토리\n     * @param {number} lookAheadTime - 예측 시간\n     * @returns {Object} 예측된 값\n     */\n    adaptivePredict(history, lookAheadTime) {\n        const weights = this.adaptivePrediction.predictionWeights;\n        \n        // 각 예측 방법 실행\n        const linearPred = this.linearPredict(history, lookAheadTime);\n        const quadraticPred = this.quadraticPredict(history, lookAheadTime);\n        const exponentialPred = this.exponentialPredict(history, lookAheadTime);\n        \n        const predicted = {};\n        const latest = history[history.length - 1];\n        \n        Object.keys(latest).forEach(axis => {\n            if (typeof latest[axis] === 'number') {\n                // 가중 평균 계산\n                predicted[axis] = \n                    linearPred[axis] * weights.linear +\n                    quadraticPred[axis] * weights.quadratic +\n                    exponentialPred[axis] * weights.exponential;\n            } else {\n                predicted[axis] = latest[axis];\n            }\n        });\n        \n        return predicted;\n    }\n    \n    /**\n     * 예측 정확도 업데이트\n     * @param {Object} actualData - 실제 데이터\n     */\n    updateAccuracy(actualData) {\n        // 이전 예측과 실제 값 비교 (간단화)\n        this.accuracy.predictions++;\n        \n        // 오차 계산 및 히스토리 업데이트\n        // (실제 구현에서는 이전 예측값을 저장해두고 비교해야 함)\n        \n        if (this.accuracy.predictions % 10 === 0) {\n            console.log(`🎯 예측 정확도: ${this.accuracy.predictions}회 예측`);\n        }\n    }\n    \n    /**\n     * 적응형 예측 가중치 조정\n     */\n    adaptPredictionWeights() {\n        // 각 예측 방법의 성능에 따라 가중치 조정\n        // (실제 구현에서는 각 방법의 오차를 추적하고 가중치를 동적으로 조정)\n        \n        const learningRate = this.adaptivePrediction.learningRate;\n        const weights = this.adaptivePrediction.predictionWeights;\n        \n        // 간단한 적응 로직 (실제로는 더 복잡한 알고리즘 필요)\n        if (this.accuracy.predictions > 50) {\n            // 성능이 좋지 않으면 가중치 재조정\n            const totalWeight = weights.linear + weights.quadratic + weights.exponential;\n            if (totalWeight > 0) {\n                weights.linear /= totalWeight;\n                weights.quadratic /= totalWeight;\n                weights.exponential /= totalWeight;\n            }\n            \n            this.performance.adaptations++;\n        }\n    }\n    \n    /**\n     * 예측 알고리즘 설정\n     * @param {string} predictionType - 예측 타입\n     */\n    setPredictionType(predictionType) {\n        if (this.predictionTypes[predictionType.toUpperCase()]) {\n            this.activePrediction = this.predictionTypes[predictionType.toUpperCase()];\n            console.log(`🔮 예측 알고리즘 변경: ${predictionType}`);\n        }\n    }\n    \n    /**\n     * 지연 보상 설정\n     * @param {boolean} enabled - 활성화\n     * @param {number} networkLatency - 네트워크 지연 (ms)\n     * @param {number} processingLatency - 처리 지연 (ms)\n     */\n    setLatencyCompensation(enabled, networkLatency = 50, processingLatency = 16) {\n        this.latencyCompensation.enabled = enabled;\n        this.latencyCompensation.networkLatency = networkLatency;\n        this.latencyCompensation.processingLatency = processingLatency;\n        this.latencyCompensation.totalLatency = networkLatency + processingLatency;\n        \n        console.log(`⏱️ 지연 보상: ${enabled ? '활성화' : '비활성화'} (총 ${this.latencyCompensation.totalLatency}ms)`);\n    }\n    \n    /**\n     * 예측 시간 설정\n     * @param {number} lookAheadTime - 예측 시간 (초)\n     */\n    setLookAheadTime(lookAheadTime) {\n        this.linearPrediction.lookAheadTime = Math.max(0, Math.min(1, lookAheadTime));\n        console.log(`🔭 예측 시간 설정: ${this.linearPrediction.lookAheadTime}초`);\n    }\n    \n    /**\n     * 적응형 예측 가중치 설정\n     * @param {Object} weights - 가중치 객체\n     */\n    setAdaptiveWeights(weights) {\n        const totalWeight = weights.linear + weights.quadratic + weights.exponential;\n        \n        if (totalWeight > 0) {\n            this.adaptivePrediction.predictionWeights = {\n                linear: weights.linear / totalWeight,\n                quadratic: weights.quadratic / totalWeight,\n                exponential: weights.exponential / totalWeight\n            };\n            \n            console.log('⚖️ 적응형 예측 가중치 설정:', this.adaptivePrediction.predictionWeights);\n        }\n    }\n    \n    /**\n     * 현재 속도 반환\n     * @returns {Object}\n     */\n    getCurrentVelocities() {\n        return { ...this.velocities };\n    }\n    \n    /**\n     * 예측 성능 정보 반환\n     * @returns {Object}\n     */\n    getPerformanceInfo() {\n        return {\n            ...this.performance,\n            accuracy: {\n                ...this.accuracy,\n                successRate: this.accuracy.predictions > 0 ? \n                           this.accuracy.correctPredictions / this.accuracy.predictions : 0\n            },\n            latency: {\n                current: this.latencyCompensation.totalLatency,\n                adaptive: this.latencyCompensation.adaptiveLatency,\n                measurements: this.performance.latencyMeasurements\n            }\n        };\n    }\n    \n    /**\n     * 히스토리 크기 설정\n     * @param {number} maxSize - 최대 히스토리 크기\n     * @param {number} minSize - 최소 히스토리 크기\n     */\n    setHistorySize(maxSize, minSize = 3) {\n        this.historyConfig.maxSize = Math.max(minSize, maxSize);\n        this.historyConfig.minSize = Math.max(2, minSize);\n        \n        console.log(`📚 히스토리 크기 설정: ${this.historyConfig.minSize}-${this.historyConfig.maxSize}`);\n    }\n    \n    /**\n     * 통계 초기화\n     */\n    resetStats() {\n        this.accuracy = {\n            predictions: 0,\n            correctPredictions: 0,\n            averageError: 0,\n            errorHistory: [],\n            maxErrorHistory: 50\n        };\n        \n        this.performance = {\n            predictionTime: 0,\n            latencyMeasurements: 0,\n            adaptations: 0\n        };\n        \n        this.latencyCompensation.latencyHistory = [];\n        \n        console.log('📊 예측 시스템 통계 초기화');\n    }\n    \n    /**\n     * 정리\n     */\n    cleanup() {\n        console.log('🧹 센서 예측 시스템 정리 시작...');\n        \n        // 히스토리 정리\n        Object.keys(this.dataHistory).forEach(sensorType => {\n            this.dataHistory[sensorType] = [];\n        });\n        \n        // 값 초기화\n        this.previousValues = {\n            orientation: { alpha: 0, beta: 0, gamma: 0, timestamp: 0 },\n            acceleration: { x: 0, y: 0, z: 0, timestamp: 0 },\n            rotationRate: { alpha: 0, beta: 0, gamma: 0, timestamp: 0 }\n        };\n        \n        this.velocities = {\n            orientation: { alpha: 0, beta: 0, gamma: 0 },\n            acceleration: { x: 0, y: 0, z: 0 },\n            rotationRate: { alpha: 0, beta: 0, gamma: 0 }\n        };\n        \n        console.log('✅ 센서 예측 시스템 정리 완료');\n    }\n    \n    /**\n     * 디버그 정보 반환\n     * @returns {Object}\n     */\n    getDebugInfo() {\n        return {\n            activePrediction: this.activePrediction,\n            historySize: {\n                orientation: this.dataHistory.orientation.length,\n                acceleration: this.dataHistory.acceleration.length,\n                rotationRate: this.dataHistory.rotationRate.length\n            },\n            latencyCompensation: this.latencyCompensation,\n            velocities: this.velocities,\n            performance: this.getPerformanceInfo()\n        };\n    }\n}"