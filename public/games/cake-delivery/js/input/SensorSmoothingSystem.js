/**
 * 센서 데이터 스무딩 시스템
 * 칼만 필터, 지수 평활법 등을 사용하여 센서 노이즈 제거 및 데이터 안정화
 */
class SensorSmoothingSystem {
    constructor() {
        // 필터 타입
        this.filterTypes = {
            EXPONENTIAL: 'exponential',
            KALMAN: 'kalman',
            MOVING_AVERAGE: 'moving_average',
            LOW_PASS: 'low_pass',
            COMPLEMENTARY: 'complementary'
        };
        
        // 현재 활성 필터
        this.activeFilters = {
            orientation: this.filterTypes.KALMAN,
            acceleration: this.filterTypes.EXPONENTIAL,
            rotationRate: this.filterTypes.LOW_PASS
        };
        
        // 지수 평활법 설정
        this.exponentialConfig = {
            orientation: {
                alpha: 0.8, // 스무딩 계수 (0-1, 높을수록 반응성 높음)
                threshold: 0.1 // 변화 임계값
            },
            acceleration: {
                alpha: 0.6,
                threshold: 0.2
            },
            rotationRate: {
                alpha: 0.7,
                threshold: 0.15
            }
        };
        
        // 칼만 필터 설정
        this.kalmanFilters = {
            orientation: {
                x: new KalmanFilter(),
                y: new KalmanFilter(),
                z: new KalmanFilter()
            },
            acceleration: {
                x: new KalmanFilter(),
                y: new KalmanFilter(),
                z: new KalmanFilter()
            },
            rotationRate: {
                x: new KalmanFilter(),
                y: new KalmanFilter(),
                z: new KalmanFilter()
            }
        };
        
        // 이동 평균 필터 설정
        this.movingAverageConfig = {
            windowSize: 5,
            buffers: {
                orientation: { x: [], y: [], z: [] },
                acceleration: { x: [], y: [], z: [] },
                rotationRate: { x: [], y: [], z: [] }
            }
        };
        
        // 저역 통과 필터 설정
        this.lowPassConfig = {
            cutoffFrequency: 5.0, // Hz
            sampleRate: 60.0, // Hz
            alpha: 0.0, // 계산됨
            previousValues: {
                orientation: { x: 0, y: 0, z: 0 },
                acceleration: { x: 0, y: 0, z: 0 },
                rotationRate: { x: 0, y: 0, z: 0 }
            }
        };
        
        // 상보 필터 설정 (자이로스코프 + 가속도계)
        this.complementaryConfig = {
            alpha: 0.98, // 자이로스코프 가중치
            beta: 0.02,  // 가속도계 가중치
            previousOrientation: { x: 0, y: 0, z: 0 },
            dt: 1/60 // 샘플링 주기
        };
        
        // 이전 값들 (스무딩용)
        this.previousValues = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            rotationRate: { alpha: 0, beta: 0, gamma: 0 }
        };
        
        // 스무딩된 값들
        this.smoothedValues = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            rotationRate: { alpha: 0, beta: 0, gamma: 0 }
        };
        
        // 노이즈 감지 설정
        this.noiseDetection = {
            enabled: true,
            thresholds: {
                orientation: 5.0, // 도
                acceleration: 2.0, // m/s²
                rotationRate: 10.0 // 도/초
            },
            consecutiveNoiseLimit: 3,
            noiseCounters: {
                orientation: 0,
                acceleration: 0,
                rotationRate: 0
            }
        };
        
        // 성능 모니터링
        this.performance = {
            processingTime: 0,
            filterSwitches: 0,
            noiseDetections: 0
        };
        
        // 초기화
        this.init();
        
        console.log('📱 센서 데이터 스무딩 시스템 초기화 완료');
    }
    
    /**
     * 초기화
     */
    init() {
        // 저역 통과 필터 알파 값 계산
        const rc = 1.0 / (2.0 * Math.PI * this.lowPassConfig.cutoffFrequency);
        const dt = 1.0 / this.lowPassConfig.sampleRate;
        this.lowPassConfig.alpha = dt / (rc + dt);
        
        // 칼만 필터 초기화
        this.initKalmanFilters();
        
        console.log('✅ 센서 스무딩 시스템 초기화 완료');
    }
    
    /**
     * 칼만 필터 초기화
     */
    initKalmanFilters() {
        Object.keys(this.kalmanFilters).forEach(sensorType => {
            Object.keys(this.kalmanFilters[sensorType]).forEach(axis => {
                const filter = this.kalmanFilters[sensorType][axis];
                
                // 센서 타입별 노이즈 설정
                let processNoise, measurementNoise;
                
                switch (sensorType) {
                    case 'orientation':
                        processNoise = 0.01;
                        measurementNoise = 0.1;
                        break;
                    case 'acceleration':
                        processNoise = 0.05;
                        measurementNoise = 0.2;
                        break;
                    case 'rotationRate':
                        processNoise = 0.02;
                        measurementNoise = 0.15;
                        break;
                    default:
                        processNoise = 0.01;
                        measurementNoise = 0.1;
                }
                
                filter.init(processNoise, measurementNoise);
            });
        });
    }
    
    /**
     * 센서 데이터 스무딩
     * @param {Object} rawSensorData - 원시 센서 데이터
     * @returns {Object} 스무딩된 센서 데이터
     */
    smoothSensorData(rawSensorData) {
        const startTime = performance.now();
        
        if (!rawSensorData) {
            return this.smoothedValues;
        }
        
        // 노이즈 감지
        if (this.noiseDetection.enabled) {
            this.detectNoise(rawSensorData);
        }
        
        // 각 센서 데이터 타입별 스무딩
        const smoothedData = {
            orientation: this.smoothOrientation(rawSensorData.orientation),
            acceleration: this.smoothAcceleration(rawSensorData.acceleration),
            rotationRate: this.smoothRotationRate(rawSensorData.rotationRate)
        };
        
        // 이전 값 업데이트
        this.updatePreviousValues(rawSensorData);
        
        // 스무딩된 값 저장
        this.smoothedValues = smoothedData;
        
        // 성능 모니터링
        this.performance.processingTime = performance.now() - startTime;
        
        return smoothedData;
    }
    
    /**
     * 방향 데이터 스무딩
     * @param {Object} orientation - 방향 데이터
     * @returns {Object} 스무딩된 방향 데이터
     */
    smoothOrientation(orientation) {
        if (!orientation) return this.smoothedValues.orientation;
        
        const filterType = this.activeFilters.orientation;
        
        switch (filterType) {
            case this.filterTypes.EXPONENTIAL:
                return this.applyExponentialSmoothing('orientation', orientation);
                
            case this.filterTypes.KALMAN:
                return this.applyKalmanFilter('orientation', orientation);
                
            case this.filterTypes.MOVING_AVERAGE:
                return this.applyMovingAverage('orientation', orientation);
                
            case this.filterTypes.LOW_PASS:
                return this.applyLowPassFilter('orientation', orientation);
                
            case this.filterTypes.COMPLEMENTARY:
                return this.applyComplementaryFilter(orientation);
                
            default:
                return orientation;
        }
    }
    
    /**
     * 가속도 데이터 스무딩
     * @param {Object} acceleration - 가속도 데이터
     * @returns {Object} 스무딩된 가속도 데이터
     */
    smoothAcceleration(acceleration) {
        if (!acceleration) return this.smoothedValues.acceleration;
        
        const filterType = this.activeFilters.acceleration;
        
        switch (filterType) {
            case this.filterTypes.EXPONENTIAL:
                return this.applyExponentialSmoothing('acceleration', acceleration);
                
            case this.filterTypes.KALMAN:
                return this.applyKalmanFilter('acceleration', acceleration);
                
            case this.filterTypes.MOVING_AVERAGE:
                return this.applyMovingAverage('acceleration', acceleration);
                
            case this.filterTypes.LOW_PASS:
                return this.applyLowPassFilter('acceleration', acceleration);
                
            default:
                return acceleration;
        }
    }
    
    /**
     * 회전율 데이터 스무딩
     * @param {Object} rotationRate - 회전율 데이터
     * @returns {Object} 스무딩된 회전율 데이터
     */
    smoothRotationRate(rotationRate) {
        if (!rotationRate) return this.smoothedValues.rotationRate;
        
        const filterType = this.activeFilters.rotationRate;
        
        switch (filterType) {
            case this.filterTypes.EXPONENTIAL:
                return this.applyExponentialSmoothing('rotationRate', rotationRate);
                
            case this.filterTypes.KALMAN:
                return this.applyKalmanFilter('rotationRate', rotationRate);
                
            case this.filterTypes.MOVING_AVERAGE:
                return this.applyMovingAverage('rotationRate', rotationRate);
                
            case this.filterTypes.LOW_PASS:
                return this.applyLowPassFilter('rotationRate', rotationRate);
                
            default:
                return rotationRate;
        }
    }
    
    /**
     * 지수 평활법 적용
     * @param {string} sensorType - 센서 타입
     * @param {Object} currentData - 현재 데이터
     * @returns {Object} 스무딩된 데이터
     */
    applyExponentialSmoothing(sensorType, currentData) {
        const config = this.exponentialConfig[sensorType];
        const previous = this.previousValues[sensorType];
        const smoothed = {};
        
        Object.keys(currentData).forEach(key => {
            const current = currentData[key] || 0;
            const prev = previous[key] || 0;
            
            // 변화량이 임계값보다 작으면 더 강한 스무딩 적용
            const change = Math.abs(current - prev);
            const alpha = change < config.threshold ? config.alpha * 0.5 : config.alpha;
            
            smoothed[key] = alpha * current + (1 - alpha) * prev;
        });
        
        return smoothed;
    }
    
    /**
     * 칼만 필터 적용
     * @param {string} sensorType - 센서 타입
     * @param {Object} currentData - 현재 데이터
     * @returns {Object} 필터링된 데이터
     */
    applyKalmanFilter(sensorType, currentData) {
        const filters = this.kalmanFilters[sensorType];
        const filtered = {};
        
        Object.keys(currentData).forEach(key => {
            if (filters[key]) {
                filtered[key] = filters[key].filter(currentData[key] || 0);
            } else {
                filtered[key] = currentData[key] || 0;
            }
        });
        
        return filtered;
    }
    
    /**
     * 이동 평균 필터 적용
     * @param {string} sensorType - 센서 타입
     * @param {Object} currentData - 현재 데이터
     * @returns {Object} 필터링된 데이터
     */
    applyMovingAverage(sensorType, currentData) {
        const buffers = this.movingAverageConfig.buffers[sensorType];
        const windowSize = this.movingAverageConfig.windowSize;
        const averaged = {};
        
        Object.keys(currentData).forEach(key => {
            const buffer = buffers[key];
            const value = currentData[key] || 0;
            
            // 버퍼에 새 값 추가
            buffer.push(value);
            
            // 윈도우 크기 초과 시 오래된 값 제거
            if (buffer.length > windowSize) {
                buffer.shift();
            }
            
            // 평균 계산
            const sum = buffer.reduce((acc, val) => acc + val, 0);
            averaged[key] = sum / buffer.length;
        });
        
        return averaged;
    }
    
    /**
     * 저역 통과 필터 적용
     * @param {string} sensorType - 센서 타입
     * @param {Object} currentData - 현재 데이터
     * @returns {Object} 필터링된 데이터
     */
    applyLowPassFilter(sensorType, currentData) {
        const alpha = this.lowPassConfig.alpha;
        const previous = this.lowPassConfig.previousValues[sensorType];
        const filtered = {};
        
        Object.keys(currentData).forEach(key => {
            const current = currentData[key] || 0;
            const prev = previous[key] || 0;
            
            // 저역 통과 필터 공식: y[n] = α * x[n] + (1-α) * y[n-1]
            filtered[key] = alpha * current + (1 - alpha) * prev;
            
            // 이전 값 업데이트
            previous[key] = filtered[key];
        });
        
        return filtered;
    }
    
    /**
     * 상보 필터 적용 (자이로스코프 + 가속도계)
     * @param {Object} orientation - 방향 데이터
     * @returns {Object} 필터링된 방향 데이터
     */
    applyComplementaryFilter(orientation) {
        const config = this.complementaryConfig;
        const dt = config.dt;
        const alpha = config.alpha;
        const beta = config.beta;
        
        // 자이로스코프 데이터로 각도 적분
        const gyroAngle = {
            x: config.previousOrientation.x + (this.smoothedValues.rotationRate.alpha || 0) * dt,
            y: config.previousOrientation.y + (this.smoothedValues.rotationRate.beta || 0) * dt,
            z: config.previousOrientation.z + (this.smoothedValues.rotationRate.gamma || 0) * dt
        };
        
        // 가속도계에서 각도 계산 (간단화)
        const accelAngle = {
            x: Math.atan2(this.smoothedValues.acceleration.y, this.smoothedValues.acceleration.z) * 180 / Math.PI,
            y: Math.atan2(-this.smoothedValues.acceleration.x, Math.sqrt(this.smoothedValues.acceleration.y ** 2 + this.smoothedValues.acceleration.z ** 2)) * 180 / Math.PI,
            z: 0 // 가속도계로는 z축 회전 측정 불가
        };
        
        // 상보 필터 적용
        const filtered = {
            alpha: alpha * gyroAngle.x + beta * accelAngle.x,
            beta: alpha * gyroAngle.y + beta * accelAngle.y,
            gamma: orientation.gamma || 0 // z축은 원본 사용
        };
        
        // 이전 값 업데이트
        config.previousOrientation = {
            x: filtered.alpha,
            y: filtered.beta,
            z: filtered.gamma
        };
        
        return filtered;
    }
    
    /**
     * 노이즈 감지
     * @param {Object} rawData - 원시 데이터
     */
    detectNoise(rawData) {
        const thresholds = this.noiseDetection.thresholds;
        const counters = this.noiseDetection.noiseCounters;
        
        // 방향 데이터 노이즈 감지
        if (rawData.orientation) {
            const orientationNoise = this.calculateNoise('orientation', rawData.orientation);
            if (orientationNoise > thresholds.orientation) {
                counters.orientation++;
                if (counters.orientation >= this.noiseDetection.consecutiveNoiseLimit) {
                    this.handleNoiseDetection('orientation');
                }
            } else {
                counters.orientation = 0;
            }
        }
        
        // 가속도 데이터 노이즈 감지
        if (rawData.acceleration) {
            const accelerationNoise = this.calculateNoise('acceleration', rawData.acceleration);
            if (accelerationNoise > thresholds.acceleration) {
                counters.acceleration++;
                if (counters.acceleration >= this.noiseDetection.consecutiveNoiseLimit) {
                    this.handleNoiseDetection('acceleration');
                }
            } else {
                counters.acceleration = 0;
            }
        }
        
        // 회전율 데이터 노이즈 감지
        if (rawData.rotationRate) {
            const rotationNoise = this.calculateNoise('rotationRate', rawData.rotationRate);
            if (rotationNoise > thresholds.rotationRate) {
                counters.rotationRate++;
                if (counters.rotationRate >= this.noiseDetection.consecutiveNoiseLimit) {
                    this.handleNoiseDetection('rotationRate');
                }
            } else {
                counters.rotationRate = 0;
            }
        }
    }
    
    /**
     * 노이즈 계산
     * @param {string} sensorType - 센서 타입
     * @param {Object} currentData - 현재 데이터
     * @returns {number} 노이즈 레벨
     */
    calculateNoise(sensorType, currentData) {
        const previous = this.previousValues[sensorType];
        let totalNoise = 0;
        let count = 0;
        
        Object.keys(currentData).forEach(key => {
            const current = currentData[key] || 0;
            const prev = previous[key] || 0;
            const diff = Math.abs(current - prev);
            
            totalNoise += diff;
            count++;
        });
        
        return count > 0 ? totalNoise / count : 0;
    }
    
    /**
     * 노이즈 감지 처리
     * @param {string} sensorType - 센서 타입
     */
    handleNoiseDetection(sensorType) {
        console.log(`🔊 노이즈 감지: ${sensorType}`);
        
        // 더 강한 스무딩 필터로 전환
        this.switchToStrongerFilter(sensorType);
        
        // 성능 카운터 업데이트
        this.performance.noiseDetections++;
        
        // 노이즈 카운터 리셋
        this.noiseDetection.noiseCounters[sensorType] = 0;
    }
    
    /**
     * 더 강한 필터로 전환
     * @param {string} sensorType - 센서 타입
     */
    switchToStrongerFilter(sensorType) {
        const currentFilter = this.activeFilters[sensorType];
        let newFilter;
        
        // 필터 강도 순서: EXPONENTIAL < LOW_PASS < MOVING_AVERAGE < KALMAN
        switch (currentFilter) {
            case this.filterTypes.EXPONENTIAL:
                newFilter = this.filterTypes.LOW_PASS;
                break;
            case this.filterTypes.LOW_PASS:
                newFilter = this.filterTypes.MOVING_AVERAGE;
                break;
            case this.filterTypes.MOVING_AVERAGE:
                newFilter = this.filterTypes.KALMAN;
                break;
            case this.filterTypes.KALMAN:
                // 이미 가장 강한 필터
                return;
            default:
                newFilter = this.filterTypes.KALMAN;
        }
        
        this.activeFilters[sensorType] = newFilter;
        this.performance.filterSwitches++;
        
        console.log(`🔄 필터 전환: ${sensorType} (${currentFilter} → ${newFilter})`);\n        \n        // 일정 시간 후 원래 필터로 복원\n        setTimeout(() => {\n            this.activeFilters[sensorType] = this.filterTypes.EXPONENTIAL;\n            console.log(`↩️ 필터 복원: ${sensorType}`);\n        }, 5000);\n    }\n    \n    /**\n     * 이전 값 업데이트\n     * @param {Object} rawData - 원시 데이터\n     */\n    updatePreviousValues(rawData) {\n        if (rawData.orientation) {\n            Object.assign(this.previousValues.orientation, rawData.orientation);\n        }\n        if (rawData.acceleration) {\n            Object.assign(this.previousValues.acceleration, rawData.acceleration);\n        }\n        if (rawData.rotationRate) {\n            Object.assign(this.previousValues.rotationRate, rawData.rotationRate);\n        }\n    }\n    \n    /**\n     * 필터 설정\n     * @param {string} sensorType - 센서 타입\n     * @param {string} filterType - 필터 타입\n     */\n    setFilter(sensorType, filterType) {\n        if (this.filterTypes[filterType.toUpperCase()]) {\n            this.activeFilters[sensorType] = this.filterTypes[filterType.toUpperCase()];\n            console.log(`🔧 필터 설정: ${sensorType} → ${filterType}`);\n        }\n    }\n    \n    /**\n     * 스무딩 강도 설정\n     * @param {string} sensorType - 센서 타입\n     * @param {number} strength - 강도 (0-1)\n     */\n    setSmoothingStrength(sensorType, strength) {\n        const clampedStrength = Math.max(0, Math.min(1, strength));\n        \n        if (this.exponentialConfig[sensorType]) {\n            // 강도가 높을수록 더 부드럽게 (알파 값 감소)\n            this.exponentialConfig[sensorType].alpha = 1 - clampedStrength * 0.8;\n        }\n        \n        console.log(`💪 스무딩 강도 설정: ${sensorType} = ${clampedStrength}`);\n    }\n    \n    /**\n     * 노이즈 감지 임계값 설정\n     * @param {Object} thresholds - 새로운 임계값\n     */\n    setNoiseThresholds(thresholds) {\n        Object.assign(this.noiseDetection.thresholds, thresholds);\n        console.log('🎯 노이즈 임계값 업데이트:', thresholds);\n    }\n    \n    /**\n     * 칼만 필터 파라미터 조정\n     * @param {string} sensorType - 센서 타입\n     * @param {number} processNoise - 프로세스 노이즈\n     * @param {number} measurementNoise - 측정 노이즈\n     */\n    tuneKalmanFilter(sensorType, processNoise, measurementNoise) {\n        const filters = this.kalmanFilters[sensorType];\n        \n        Object.keys(filters).forEach(axis => {\n            filters[axis].setNoise(processNoise, measurementNoise);\n        });\n        \n        console.log(`🎛️ 칼만 필터 조정: ${sensorType} (P:${processNoise}, M:${measurementNoise})`);\n    }\n    \n    /**\n     * 현재 스무딩된 값 반환\n     * @returns {Object}\n     */\n    getSmoothedValues() {\n        return { ...this.smoothedValues };\n    }\n    \n    /**\n     * 필터 상태 반환\n     * @returns {Object}\n     */\n    getFilterStatus() {\n        return {\n            activeFilters: { ...this.activeFilters },\n            noiseCounters: { ...this.noiseDetection.noiseCounters },\n            performance: { ...this.performance }\n        };\n    }\n    \n    /**\n     * 통계 초기화\n     */\n    resetStats() {\n        this.performance = {\n            processingTime: 0,\n            filterSwitches: 0,\n            noiseDetections: 0\n        };\n        \n        this.noiseDetection.noiseCounters = {\n            orientation: 0,\n            acceleration: 0,\n            rotationRate: 0\n        };\n        \n        console.log('📊 스무딩 시스템 통계 초기화');\n    }\n    \n    /**\n     * 정리\n     */\n    cleanup() {\n        console.log('🧹 센서 스무딩 시스템 정리 시작...');\n        \n        // 버퍼 정리\n        Object.keys(this.movingAverageConfig.buffers).forEach(sensorType => {\n            Object.keys(this.movingAverageConfig.buffers[sensorType]).forEach(axis => {\n                this.movingAverageConfig.buffers[sensorType][axis] = [];\n            });\n        });\n        \n        // 값 초기화\n        this.previousValues = {\n            orientation: { alpha: 0, beta: 0, gamma: 0 },\n            acceleration: { x: 0, y: 0, z: 0 },\n            rotationRate: { alpha: 0, beta: 0, gamma: 0 }\n        };\n        \n        this.smoothedValues = {\n            orientation: { alpha: 0, beta: 0, gamma: 0 },\n            acceleration: { x: 0, y: 0, z: 0 },\n            rotationRate: { alpha: 0, beta: 0, gamma: 0 }\n        };\n        \n        console.log('✅ 센서 스무딩 시스템 정리 완료');\n    }\n    \n    /**\n     * 디버그 정보 반환\n     * @returns {Object}\n     */\n    getDebugInfo() {\n        return {\n            activeFilters: this.activeFilters,\n            smoothedValues: this.smoothedValues,\n            noiseDetection: this.noiseDetection,\n            performance: this.performance,\n            filterTypes: this.filterTypes\n        };\n    }\n}\n\n/**\n * 간단한 칼만 필터 구현\n */\nclass KalmanFilter {\n    constructor() {\n        this.x = 0; // 상태 추정값\n        this.P = 1; // 오차 공분산\n        this.Q = 0.01; // 프로세스 노이즈\n        this.R = 0.1; // 측정 노이즈\n        this.K = 0; // 칼만 게인\n    }\n    \n    /**\n     * 초기화\n     * @param {number} processNoise - 프로세스 노이즈\n     * @param {number} measurementNoise - 측정 노이즈\n     */\n    init(processNoise, measurementNoise) {\n        this.Q = processNoise;\n        this.R = measurementNoise;\n    }\n    \n    /**\n     * 노이즈 설정\n     * @param {number} processNoise - 프로세스 노이즈\n     * @param {number} measurementNoise - 측정 노이즈\n     */\n    setNoise(processNoise, measurementNoise) {\n        this.Q = processNoise;\n        this.R = measurementNoise;\n    }\n    \n    /**\n     * 필터링\n     * @param {number} measurement - 측정값\n     * @returns {number} 필터링된 값\n     */\n    filter(measurement) {\n        // 예측 단계\n        // x = x (상태 예측은 이전 상태와 동일)\n        this.P = this.P + this.Q; // 오차 공분산 예측\n        \n        // 업데이트 단계\n        this.K = this.P / (this.P + this.R); // 칼만 게인 계산\n        this.x = this.x + this.K * (measurement - this.x); // 상태 업데이트\n        this.P = (1 - this.K) * this.P; // 오차 공분산 업데이트\n        \n        return this.x;\n    }\n    \n    /**\n     * 필터 리셋\n     */\n    reset() {\n        this.x = 0;\n        this.P = 1;\n        this.K = 0;\n    }\n}"