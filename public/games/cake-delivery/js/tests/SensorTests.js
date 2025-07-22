/**
 * 센서 데이터 처리 알고리즘 테스트
 * 센서 스무딩, 예측, 보정 시스템의 정확성을 검증합니다.
 */

// 테스트 프레임워크 인스턴스
const sensorTestFramework = new TestFramework();
const { describe, it, expect, beforeEach, afterEach } = sensorTestFramework;

describe('센서 데이터 처리 테스트', () => {
    let sensorSmoothingSystem;
    let sensorPredictionSystem;
    
    beforeEach(() => {
        sensorSmoothingSystem = new SensorSmoothingSystem();
        sensorPredictionSystem = new SensorPredictionSystem();
    });
    
    afterEach(() => {
        sensorSmoothingSystem = null;
        sensorPredictionSystem = null;
    });
    
    describe('센서 스무딩 시스템', () => {
        it('칼만 필터가 노이즈를 제거해야 함', () => {
            const noisyData = [
                { orientation: { gamma: 10.5 } },
                { orientation: { gamma: 9.8 } },
                { orientation: { gamma: 10.2 } },
                { orientation: { gamma: 9.9 } },
                { orientation: { gamma: 10.1 } }
            ];
            
            const smoothedResults = [];
            noisyData.forEach(data => {
                const smoothed = sensorSmoothingSystem.applySmoothingFilter(data);
                smoothedResults.push(smoothed.orientation.gamma);
            });
            
            // 스무딩된 데이터의 분산이 원본보다 작아야 함
            const originalVariance = calculateVariance(noisyData.map(d => d.orientation.gamma));
            const smoothedVariance = calculateVariance(smoothedResults);
            
            expect(smoothedVariance).toBeLessThan(originalVariance);
        });
        
        it('지수 평활법이 올바르게 작동해야 함', () => {
            const testData = [
                { orientation: { gamma: 0 } },
                { orientation: { gamma: 10 } },
                { orientation: { gamma: 20 } }
            ];
            
            let previousSmoothed = null;
            testData.forEach(data => {
                const smoothed = sensorSmoothingSystem.applyExponentialSmoothing(data, 0.3);
                
                if (previousSmoothed) {
                    // 스무딩된 값이 이전 값과 현재 값 사이에 있어야 함
                    const currentRaw = data.orientation.gamma;
                    const previousSmoothedValue = previousSmoothed.orientation.gamma;
                    const currentSmoothed = smoothed.orientation.gamma;
                    
                    if (currentRaw > previousSmoothedValue) {
                        expect(currentSmoothed).toBeGreaterThan(previousSmoothedValue);
                        expect(currentSmoothed).toBeLessThan(currentRaw);
                    }
                }
                
                previousSmoothed = smoothed;
            });
        });
        
        it('이상치가 올바르게 감지되고 제거되어야 함', () => {
            const dataWithOutliers = [
                { orientation: { gamma: 10 } },
                { orientation: { gamma: 11 } },
                { orientation: { gamma: 100 } }, // 이상치
                { orientation: { gamma: 9 } },
                { orientation: { gamma: 10.5 } }
            ];
            
            const processedData = [];
            dataWithOutliers.forEach(data => {
                const processed = sensorSmoothingSystem.removeOutliers(data);
                processedData.push(processed);
            });
            
            // 이상치가 제거되거나 보정되었는지 확인
            const gammaValues = processedData.map(d => d.orientation.gamma);
            const maxValue = Math.max(...gammaValues);
            
            expect(maxValue).toBeLessThan(50); // 이상치(100)가 제거되었음
        });
        
        it('센서 데이터 품질 점수가 올바르게 계산되어야 함', () => {
            const goodData = { orientation: { gamma: 10, beta: 5, alpha: 0 } };
            const badData = { orientation: { gamma: NaN, beta: undefined, alpha: 1000 } };
            
            const goodQuality = sensorSmoothingSystem.calculateDataQuality(goodData);
            const badQuality = sensorSmoothingSystem.calculateDataQuality(badData);
            
            expect(goodQuality).toBeGreaterThan(0.8);
            expect(badQuality).toBeLessThan(0.3);
        });
    });
    
    describe('센서 예측 시스템', () => {
        it('선형 예측이 올바르게 작동해야 함', () => {
            const historicalData = [
                { timestamp: 0, orientation: { gamma: 0 } },
                { timestamp: 100, orientation: { gamma: 10 } },
                { timestamp: 200, orientation: { gamma: 20 } },
                { timestamp: 300, orientation: { gamma: 30 } }
            ];
            
            const predicted = sensorPredictionSystem.predictLinear(historicalData, 400);
            
            // 선형 트렌드를 따라 40 근처의 값이 예측되어야 함
            expect(predicted.orientation.gamma).toBeCloseTo(40, 1);
        });
        
        it('네트워크 지연 보상이 올바르게 작동해야 함', () => {
            const currentTime = Date.now();
            const delayedData = {
                timestamp: currentTime - 100, // 100ms 지연
                orientation: { gamma: 10 }
            };
            
            const compensated = sensorPredictionSystem.compensateNetworkDelay(delayedData, 100);
            
            expect(compensated.timestamp).toBeCloseTo(currentTime, 10);
            expect(compensated.orientation.gamma).toBeDefined();
        });
        
        it('예측 정확도가 허용 범위 내에 있어야 함', () => {
            // 실제 데이터 시퀀스 생성 (사인파)
            const actualData = [];
            for (let i = 0; i < 10; i++) {
                actualData.push({
                    timestamp: i * 100,
                    orientation: { gamma: Math.sin(i * 0.1) * 10 }
                });
            }
            
            // 처음 7개 데이터로 예측
            const trainingData = actualData.slice(0, 7);
            const testData = actualData.slice(7);
            
            let totalError = 0;
            testData.forEach((actual, index) => {
                const predicted = sensorPredictionSystem.predictLinear(trainingData, actual.timestamp);
                const error = Math.abs(predicted.orientation.gamma - actual.orientation.gamma);
                totalError += error;
            });
            
            const averageError = totalError / testData.length;
            
            // 평균 오차가 2.0 이하여야 함
            expect(averageError).toBeLessThan(2.0);
        });
        
        it('예측 신뢰도가 올바르게 계산되어야 함', () => {
            const consistentData = [
                { timestamp: 0, orientation: { gamma: 10 } },
                { timestamp: 100, orientation: { gamma: 10.1 } },
                { timestamp: 200, orientation: { gamma: 9.9 } },
                { timestamp: 300, orientation: { gamma: 10.05 } }
            ];
            
            const inconsistentData = [
                { timestamp: 0, orientation: { gamma: 10 } },
                { timestamp: 100, orientation: { gamma: 50 } },
                { timestamp: 200, orientation: { gamma: -20 } },
                { timestamp: 300, orientation: { gamma: 100 } }
            ];
            
            const consistentConfidence = sensorPredictionSystem.calculatePredictionConfidence(consistentData);
            const inconsistentConfidence = sensorPredictionSystem.calculatePredictionConfidence(inconsistentData);
            
            expect(consistentConfidence).toBeGreaterThan(0.8);
            expect(inconsistentConfidence).toBeLessThan(0.5);
        });
    });
    
    describe('센서 보정 시스템', () => {
        it('자동 캘리브레이션이 올바르게 작동해야 함', () => {
            // 편향된 센서 데이터 시뮬레이션
            const biasedData = [
                { orientation: { gamma: 15 } }, // 실제 0도이지만 15도로 측정
                { orientation: { gamma: 25 } }, // 실제 10도이지만 25도로 측정
                { orientation: { gamma: 35 } }  // 실제 20도이지만 35도로 측정
            ];
            
            // 캘리브레이션 수행
            const calibrationOffset = sensorSmoothingSystem.calculateCalibrationOffset(biasedData);
            
            // 보정된 데이터
            const calibratedData = biasedData.map(data => 
                sensorSmoothingSystem.applyCalibratedOffset(data, calibrationOffset)
            );
            
            // 보정 후 평균값이 0에 가까워야 함
            const averageGamma = calibratedData.reduce((sum, data) => sum + data.orientation.gamma, 0) / calibratedData.length;
            expect(Math.abs(averageGamma)).toBeLessThan(5);
        });
        
        it('센서 드리프트가 감지되어야 함', () => {
            // 시간에 따른 드리프트 시뮬레이션
            const driftingData = [];
            for (let i = 0; i < 100; i++) {
                driftingData.push({
                    timestamp: i * 100,
                    orientation: { gamma: i * 0.1 } // 점진적 드리프트
                });
            }
            
            const driftDetected = sensorSmoothingSystem.detectSensorDrift(driftingData);
            
            expect(driftDetected).toBeTruthy();
        });
        
        it('센서 연결 안정성이 모니터링되어야 함', () => {
            const stableConnection = [
                { timestamp: 0, quality: 0.9 },
                { timestamp: 100, quality: 0.95 },
                { timestamp: 200, quality: 0.88 },
                { timestamp: 300, quality: 0.92 }
            ];
            
            const unstableConnection = [
                { timestamp: 0, quality: 0.9 },
                { timestamp: 100, quality: 0.2 },
                { timestamp: 200, quality: 0.8 },
                { timestamp: 300, quality: 0.1 }
            ];
            
            const stableScore = sensorSmoothingSystem.calculateConnectionStability(stableConnection);
            const unstableScore = sensorSmoothingSystem.calculateConnectionStability(unstableConnection);
            
            expect(stableScore).toBeGreaterThan(0.8);
            expect(unstableScore).toBeLessThan(0.6);
        });
    });
    
    describe('센서 데이터 통합', () => {
        it('다중 센서 데이터가 올바르게 융합되어야 함', () => {
            const accelerometerData = {
                acceleration: { x: 1, y: 0, z: 0 }
            };
            
            const gyroscopeData = {
                rotationRate: { alpha: 0, beta: 0, gamma: 10 }
            };
            
            const orientationData = {
                orientation: { alpha: 0, beta: 0, gamma: 5 }
            };
            
            const fusedData = sensorSmoothingSystem.fuseSensorData([
                accelerometerData,
                gyroscopeData,
                orientationData
            ]);
            
            expect(fusedData.acceleration).toBeDefined();
            expect(fusedData.rotationRate).toBeDefined();
            expect(fusedData.orientation).toBeDefined();
        });
        
        it('센서 데이터 타임스탬프가 동기화되어야 함', () => {
            const unsyncedData = [
                { timestamp: 1000, orientation: { gamma: 10 } },
                { timestamp: 1050, orientation: { gamma: 12 } },
                { timestamp: 1120, orientation: { gamma: 8 } }
            ];
            
            const syncedData = sensorSmoothingSystem.synchronizeTimestamps(unsyncedData);
            
            // 동기화된 데이터의 타임스탬프 간격이 일정해야 함
            const intervals = [];
            for (let i = 1; i < syncedData.length; i++) {
                intervals.push(syncedData[i].timestamp - syncedData[i-1].timestamp);
            }
            
            const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
            const maxDeviation = Math.max(...intervals.map(interval => Math.abs(interval - averageInterval)));
            
            expect(maxDeviation).toBeLessThan(averageInterval * 0.1); // 10% 이내 편차
        });
    });
    
    describe('성능 테스트', () => {
        it('실시간 처리 성능이 요구사항을 만족해야 함', () => {
            const testDataCount = 1000;
            const testData = [];
            
            // 테스트 데이터 생성
            for (let i = 0; i < testDataCount; i++) {
                testData.push({
                    timestamp: i * 16.67, // 60fps
                    orientation: {
                        gamma: Math.sin(i * 0.1) * 30,
                        beta: Math.cos(i * 0.1) * 20,
                        alpha: i * 0.5
                    }
                });
            }
            
            const startTime = performance.now();
            
            // 센서 데이터 처리
            testData.forEach(data => {
                const smoothed = sensorSmoothingSystem.applySmoothingFilter(data);
                const predicted = sensorPredictionSystem.predictLinear([data], data.timestamp + 16.67);
            });
            
            const endTime = performance.now();
            const processingTime = endTime - startTime;
            const averageProcessingTime = processingTime / testDataCount;
            
            // 평균 처리 시간이 1ms 이하여야 함 (60fps 유지를 위해)
            expect(averageProcessingTime).toBeLessThan(1.0);
        });
        
        it('메모리 사용량이 안정적이어야 함', () => {
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // 대량의 센서 데이터 처리
            for (let i = 0; i < 10000; i++) {
                const data = {
                    timestamp: i,
                    orientation: { gamma: Math.random() * 360 }
                };
                
                sensorSmoothingSystem.applySmoothingFilter(data);
            }
            
            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const memoryIncrease = finalMemory - initialMemory;
            
            // 메모리 증가량이 10MB 이하여야 함
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
        });
    });
});

// 유틸리티 함수
function calculateVariance(values) {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    return squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
}

// 테스트 실행 함수
async function runSensorTests() {
    console.log('🧪 센서 데이터 처리 테스트 시작...');
    
    try {
        const results = await sensorTestFramework.runAll();
        return results;
    } catch (error) {
        console.error('센서 테스트 실행 중 오류:', error);
        return null;
    }
}

// 전역으로 내보내기
if (typeof window !== 'undefined') {
    window.runSensorTests = runSensorTests;
}