/**
 * 🐛 드론 레이싱 게임 버그 수정 및 개선사항
 * 
 * 발견된 버그들과 개선사항들을 모아놓은 패치 파일
 */

class GameBugFixes {
    constructor(game) {
        this.game = game;
        this.appliedFixes = [];
        
        console.log('🐛 버그 수정 시스템 초기화');
    }
    
    /**
     * 모든 버그 수정 적용
     */
    applyAllFixes() {
        console.log('🔧 모든 버그 수정 적용 중...');
        
        this.fixSessionSDKEventHandling();
        this.fixDronePhysicsSync();
        this.fixBoosterSystemBugs();
        this.fixUIUpdateIssues();
        this.fixPerformanceOptimizationBugs();
        this.fixMemoryLeaks();
        this.fixCrossOriginIssues();
        this.fixMobileCompatibility();
        this.fixGameStateManagement();
        this.fixErrorHandling();
        
        console.log(`✅ ${this.appliedFixes.length}개의 버그 수정 완료`);
        return this.appliedFixes;
    }
    
    /**
     * 1. SessionSDK 이벤트 처리 버그 수정
     */
    fixSessionSDKEventHandling() {
        if (!this.game.sdk) return;
        
        // 원래 이벤트 핸들러 백업
        const originalOn = this.game.sdk.on;
        
        // 개선된 이벤트 핸들러
        this.game.sdk.on = function(eventName, handler) {
            const wrappedHandler = (event) => {
                try {
                    // CustomEvent 처리 패턴 강화
                    const data = event.detail || event.data || event;
                    
                    // 데이터 유효성 검증
                    if (data && typeof data === 'object') {
                        handler(data);
                    } else {
                        console.warn(`Invalid event data for ${eventName}:`, event);
                    }
                } catch (error) {
                    console.error(`Error handling ${eventName} event:`, error);
                    
                    // 에러 복구 시도
                    if (eventName === 'sensor-disconnected') {
                        // 센서 연결 해제 에러 시 안전한 처리
                        handler({ sensorId: 'unknown', error: error.message });
                    }
                }
            };
            
            return originalOn.call(this, eventName, wrappedHandler);
        };
        
        this.appliedFixes.push('SessionSDK 이벤트 처리 안정화');
    }
    
    /**
     * 2. 드론 물리 동기화 버그 수정
     */
    fixDronePhysicsSync() {
        if (!this.game.physics) return;
        
        // 원래 동기화 함수 백업
        const originalSync = this.game.physics.syncAllMeshes;
        
        // 개선된 동기화 함수
        this.game.physics.syncAllMeshes = function() {
            try {
                for (const [bodyId, body] of this.bodies) {
                    if (bodyId.includes('player') || bodyId.includes('drone')) {
                        const mesh = this.scene.getObjectByName(bodyId);
                        
                        if (mesh && body && body.position && body.quaternion) {
                            // NaN 값 체크 및 보정
                            if (this.isValidVector(body.position)) {
                                mesh.position.copy(body.position);
                            } else {
                                console.warn(`Invalid position for ${bodyId}, resetting`);
                                body.position.set(0, 5, 0);
                                mesh.position.set(0, 5, 0);
                            }
                            
                            if (this.isValidQuaternion(body.quaternion)) {
                                mesh.quaternion.copy(body.quaternion);
                            } else {
                                console.warn(`Invalid quaternion for ${bodyId}, resetting`);
                                body.quaternion.set(0, 0, 0, 1);
                                mesh.quaternion.set(0, 0, 0, 1);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Physics sync error:', error);
                // 원래 함수로 폴백
                if (originalSync) {
                    originalSync.call(this);
                }
            }
        };
        
        // 유효성 검증 함수 추가
        this.game.physics.isValidVector = function(vector) {
            return vector && 
                   !isNaN(vector.x) && !isNaN(vector.y) && !isNaN(vector.z) &&
                   isFinite(vector.x) && isFinite(vector.y) && isFinite(vector.z);
        };
        
        this.game.physics.isValidQuaternion = function(quaternion) {
            return quaternion && 
                   !isNaN(quaternion.x) && !isNaN(quaternion.y) && 
                   !isNaN(quaternion.z) && !isNaN(quaternion.w) &&
                   isFinite(quaternion.x) && isFinite(quaternion.y) && 
                   isFinite(quaternion.z) && isFinite(quaternion.w);
        };
        
        this.appliedFixes.push('드론 물리 동기화 안정화');
    }
    
    /**
     * 3. 부스터 시스템 버그 수정
     */
    fixBoosterSystemBugs() {
        Object.values(this.game.drones || {}).forEach(drone => {
            if (!drone.booster) return;
            
            // 원래 부스터 활성화 함수 백업
            const originalActivate = drone.activateBooster;
            
            // 개선된 부스터 활성화 함수
            drone.activateBooster = function() {
                try {
                    // 중복 활성화 방지
                    if (this.booster.isActive) {
                        console.log(`${this.playerId} 부스터가 이미 활성화됨`);
                        return false;
                    }
                    
                    // 에너지 및 쿨다운 체크 강화
                    if (this.booster.energy < 20) {
                        console.log(`${this.playerId} 부스터 에너지 부족: ${this.booster.energy}%`);
                        return false;
                    }
                    
                    if (this.booster.cooldown > 0) {
                        console.log(`${this.playerId} 부스터 쿨다운 중: ${this.booster.cooldown}ms`);
                        return false;
                    }
                    
                    // 부스터 활성화
                    this.booster.isActive = true;
                    this.booster.energy = Math.max(0, this.booster.energy - 20);
                    this.booster.cooldown = 3000;
                    
                    // 물리 효과 적용 (안전하게)
                    if (this.physics && this.physics.applyBoosterEffect) {
                        this.physics.applyBoosterEffect(this.playerId, this.booster.multiplier);
                    }
                    
                    // 시각 효과 생성 (안전하게)
                    try {
                        this.createBoosterParticles();
                    } catch (particleError) {
                        console.warn('부스터 파티클 생성 실패:', particleError);
                    }
                    
                    // 자동 비활성화 타이머
                    setTimeout(() => {
                        this.booster.isActive = false;
                    }, this.booster.duration);
                    
                    console.log(`${this.playerId} 부스터 활성화 성공`);
                    return true;
                    
                } catch (error) {
                    console.error(`${this.playerId} 부스터 활성화 오류:`, error);
                    
                    // 에러 시 상태 복구
                    this.booster.isActive = false;
                    return false;
                }
            };
            
            // 부스터 업데이트 함수 개선
            const originalUpdateBooster = drone.updateBooster;
            drone.updateBooster = function(deltaTime) {
                try {
                    // deltaTime 유효성 검증
                    if (!deltaTime || deltaTime <= 0 || deltaTime > 1) {
                        deltaTime = 1/60; // 기본값 사용
                    }
                    
                    // 쿨다운 감소 (안전하게)
                    if (this.booster.cooldown > 0) {
                        this.booster.cooldown = Math.max(0, this.booster.cooldown - deltaTime * 1000);
                    }
                    
                    // 에너지 자동 충전 (안전하게)
                    if (this.booster.energy < this.booster.maxEnergy) {
                        this.booster.energy = Math.min(
                            this.booster.maxEnergy, 
                            this.booster.energy + this.booster.rechargeRate * deltaTime
                        );
                    }
                    
                    // 네온 효과 업데이트 (안전하게)
                    if (this.pointLight) {
                        if (this.booster.isActive) {
                            this.pointLight.intensity = 2 + Math.sin(Date.now() * 0.01) * 0.5;
                        } else {
                            this.pointLight.intensity = 1;
                        }
                    }
                    
                } catch (error) {
                    console.error(`${this.playerId} 부스터 업데이트 오류:`, error);
                    
                    // 원래 함수로 폴백
                    if (originalUpdateBooster) {
                        originalUpdateBooster.call(this, deltaTime);
                    }
                }
            };
        });
        
        this.appliedFixes.push('부스터 시스템 안정화');
    }
    
    /**
     * 4. UI 업데이트 문제 수정
     */
    fixUIUpdateIssues() {
        if (!this.game.ui) return;
        
        // 원래 HUD 업데이트 함수 백업
        const originalUpdateHUD = this.game.ui.updatePlayerHUD;
        
        // 개선된 HUD 업데이트 함수
        this.game.ui.updatePlayerHUD = function(playerId, droneData) {
            try {
                // 매개변수 유효성 검증
                if (!playerId || !droneData) {
                    console.warn('Invalid HUD update parameters:', { playerId, droneData });
                    return;
                }
                
                const hudElement = this.elements[`${playerId}HUD`];
                if (!hudElement) {
                    console.warn(`HUD element not found: ${playerId}HUD`);
                    return;
                }
                
                const hud = hudElement.querySelector('.hud-panel');
                if (!hud) {
                    console.warn(`HUD panel not found for: ${playerId}`);
                    return;
                }
                
                // 안전한 데이터 추출
                const safeData = {
                    speed: Math.max(0, Math.min(999, droneData.speed || 0)),
                    lapCount: Math.max(0, Math.min(3, droneData.lapCount || 0)),
                    lapTime: Math.max(0, droneData.lapTime || 0),
                    rank: Math.max(1, Math.min(2, droneData.rank || 1)),
                    booster: droneData.booster || { energy: 100, isActive: false, cooldown: 0 }
                };
                
                // DOM 요소 안전 업데이트
                this.safeUpdateElement(hud, '.speed', `속도: ${Math.round(safeData.speed)} km/h`);
                this.safeUpdateElement(hud, '.lap', `랩: ${safeData.lapCount}/3`);
                this.safeUpdateElement(hud, '.time', `시간: ${safeData.lapTime.toFixed(2)}s`);
                this.safeUpdateElement(hud, '.rank', `순위: ${safeData.rank}`);
                
                // 부스터 바 업데이트 (안전하게)
                this.updateBoosterBar(playerId, safeData.booster);
                
            } catch (error) {
                console.error(`HUD update error for ${playerId}:`, error);
                
                // 원래 함수로 폴백
                if (originalUpdateHUD) {
                    originalUpdateHUD.call(this, playerId, droneData);
                }
            }
        };
        
        // 안전한 요소 업데이트 함수 추가
        this.game.ui.safeUpdateElement = function(parent, selector, content) {
            try {
                const element = parent.querySelector(selector);
                if (element) {
                    element.textContent = content;
                }
            } catch (error) {
                console.warn(`Failed to update element ${selector}:`, error);
            }
        };
        
        this.appliedFixes.push('UI 업데이트 안정화');
    }
    
    /**
     * 5. 성능 최적화 관련 버그 수정
     */
    fixPerformanceOptimizationBugs() {
        if (!this.game.performanceOptimizer) return;
        
        // 센서 데이터 throttling 개선
        const originalThrottle = this.game.performanceOptimizer.throttleSensorData;
        this.game.performanceOptimizer.throttleSensorData = function(sensorId, data) {
            try {
                // 매개변수 유효성 검증
                if (!sensorId || !data) {
                    return null;
                }
                
                const now = Date.now();
                const lastUpdate = this.sensorThrottle.lastUpdate.get(sensorId) || 0;
                
                // throttling 간격 체크
                if (now - lastUpdate < this.sensorThrottle.interval) {
                    // 버퍼에 최신 데이터 저장 (안전하게)
                    this.sensorThrottle.dataBuffer.set(sensorId, { ...data });
                    return null;
                }
                
                // 업데이트 시간 갱신
                this.sensorThrottle.lastUpdate.set(sensorId, now);
                
                // 버퍼된 데이터 반환
                const bufferedData = this.sensorThrottle.dataBuffer.get(sensorId);
                if (bufferedData) {
                    this.sensorThrottle.dataBuffer.delete(sensorId);
                    return bufferedData;
                }
                
                return data;
                
            } catch (error) {
                console.error('Sensor throttling error:', error);
                return data; // 에러 시 원본 데이터 반환
            }
        };
        
        this.appliedFixes.push('성능 최적화 안정화');
    }
    
    /**
     * 6. 메모리 누수 수정
     */
    fixMemoryLeaks() {
        // 이벤트 리스너 정리 함수 추가
        this.game.cleanupEventListeners = function() {
            try {
                // 윈도우 이벤트 리스너 제거
                window.removeEventListener('resize', this.onWindowResize);
                window.removeEventListener('beforeunload', this.onBeforeUnload);
                
                // 키보드 이벤트 리스너 제거
                document.removeEventListener('keydown', this.onKeyDown);
                document.removeEventListener('keyup', this.onKeyUp);
                
                console.log('이벤트 리스너 정리 완료');
            } catch (error) {
                console.error('이벤트 리스너 정리 오류:', error);
            }
        };
        
        // 리소스 정리 함수 개선
        const originalDispose = this.game.dispose;
        this.game.dispose = function() {
            try {
                // 이벤트 리스너 정리
                this.cleanupEventListeners();
                
                // 드론 정리
                Object.values(this.drones || {}).forEach(drone => {
                    if (drone.dispose) {
                        drone.dispose();
                    }
                });
                
                // 효과 시스템 정리
                if (this.effects && this.effects.cleanup) {
                    this.effects.cleanup();
                }
                
                // 물리 엔진 정리
                if (this.physics && this.physics.dispose) {
                    this.physics.dispose();
                }
                
                // 성능 최적화 시스템 정리
                if (this.performanceOptimizer && this.performanceOptimizer.dispose) {
                    this.performanceOptimizer.dispose();
                }
                
                // 원래 정리 함수 호출
                if (originalDispose) {
                    originalDispose.call(this);
                }
                
                console.log('게임 리소스 정리 완료');
                
            } catch (error) {
                console.error('리소스 정리 오류:', error);
            }
        };
        
        this.appliedFixes.push('메모리 누수 방지');
    }
    
    /**
     * 7. CORS 및 보안 문제 수정
     */
    fixCrossOriginIssues() {
        // QR 코드 생성 개선
        if (this.game.showQRCodeFallback) {
            const originalFallback = this.game.showQRCodeFallback;
            this.game.showQRCodeFallback = function(qrUrl) {
                try {
                    // 안전한 QR 코드 API 사용
                    const safeUrl = encodeURIComponent(qrUrl);
                    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${safeUrl}`;
                    
                    const img = document.createElement('img');
                    img.src = qrApiUrl;
                    img.style.width = '200px';
                    img.style.height = '200px';
                    img.alt = 'QR Code';
                    img.crossOrigin = 'anonymous'; // CORS 설정
                    
                    // 로딩 에러 처리
                    img.onerror = () => {
                        console.warn('QR 코드 로딩 실패, 텍스트로 대체');
                        const textDiv = document.createElement('div');
                        textDiv.textContent = `세션 코드: ${this.sdk.getSession()?.sessionCode || 'N/A'}`;
                        textDiv.style.cssText = `
                            width: 200px;
                            height: 200px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: #f0f0f0;
                            border: 2px solid #ccc;
                            font-size: 18px;
                            font-weight: bold;
                        `;
                        
                        const container = document.getElementById('qrContainer');
                        if (container) {
                            container.innerHTML = '';
                            container.appendChild(textDiv);
                        }
                    };
                    
                    const container = document.getElementById('qrContainer');
                    if (container) {
                        container.innerHTML = '';
                        container.appendChild(img);
                    }
                    
                } catch (error) {
                    console.error('QR 코드 폴백 오류:', error);
                    
                    // 원래 함수로 폴백
                    if (originalFallback) {
                        originalFallback.call(this, qrUrl);
                    }
                }
            };
        }
        
        this.appliedFixes.push('CORS 및 보안 문제 해결');
    }
    
    /**
     * 8. 모바일 호환성 개선
     */
    fixMobileCompatibility() {
        // 터치 이벤트 지원 추가
        this.game.setupTouchControls = function() {
            let touchStartY = 0;
            let touchStartX = 0;
            
            document.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }, { passive: true });
            
            document.addEventListener('touchmove', (e) => {
                e.preventDefault(); // 스크롤 방지
            }, { passive: false });
            
            document.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                
                // 스와이프 제스처 감지
                if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
                    console.log('스와이프 감지:', { deltaX, deltaY });
                }
            }, { passive: true });
        };
        
        // 뷰포트 메타 태그 확인 및 추가
        if (!document.querySelector('meta[name=\"viewport\"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
            document.head.appendChild(viewport);
        }
        
        // 모바일 성능 최적화
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // 모바일 디바이스에서 성능 설정 조정
            if (this.game.performanceOptimizer) {
                this.game.performanceOptimizer.setQuality('medium');
            }
            
            // 모바일 전용 UI 조정
            document.body.classList.add('mobile-device');
        }
        
        this.appliedFixes.push('모바일 호환성 개선');
    }
    
    /**
     * 9. 게임 상태 관리 버그 수정
     */
    fixGameStateManagement() {
        if (!this.game.gameStateManager) return;
        
        // 상태 전환 검증 강화
        const originalSetState = this.game.gameStateManager.setState;
        this.game.gameStateManager.setState = function(newState, data) {
            try {
                // 유효한 상태인지 확인
                const validStates = Object.values(this.states || {});
                if (!validStates.includes(newState)) {
                    console.warn(`Invalid game state: ${newState}`);
                    return false;
                }
                
                // 상태 전환 로직 검증
                const currentState = this.currentState;
                if (!this.isValidStateTransition(currentState, newState)) {
                    console.warn(`Invalid state transition: ${currentState} -> ${newState}`);
                    return false;
                }
                
                // 원래 함수 호출
                return originalSetState.call(this, newState, data);
                
            } catch (error) {
                console.error('State management error:', error);
                return false;
            }
        };
        
        // 상태 전환 유효성 검증 함수 추가
        this.game.gameStateManager.isValidStateTransition = function(from, to) {
            const validTransitions = {
                'waiting': ['countdown', 'racing'],
                'countdown': ['racing', 'waiting'],
                'racing': ['paused', 'finished', 'waiting'],
                'paused': ['racing', 'waiting'],
                'finished': ['waiting'],
                'disconnected': ['waiting', 'racing']
            };
            
            return validTransitions[from]?.includes(to) || false;
        };
        
        this.appliedFixes.push('게임 상태 관리 안정화');
    }
    
    /**
     * 10. 에러 처리 및 로깅 개선
     */
    fixErrorHandling() {
        // 전역 에러 핸들러 설정
        window.addEventListener('error', (event) => {
            console.error('전역 에러 감지:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
            
            // 게임 관련 에러인 경우 복구 시도
            if (event.filename && event.filename.includes('drone-racing')) {
                this.attemptErrorRecovery(event.error);
            }
        });
        
        // Promise rejection 핸들러
        window.addEventListener('unhandledrejection', (event) => {
            console.error('처리되지 않은 Promise rejection:', event.reason);
            
            // SessionSDK 관련 에러 처리
            if (event.reason && event.reason.message && 
                event.reason.message.includes('session')) {
                console.log('세션 관련 에러 복구 시도');
                this.recoverSessionError();
            }
        });
        
        this.appliedFixes.push('에러 처리 및 로깅 개선');
    }
    
    /**
     * 에러 복구 시도
     */
    attemptErrorRecovery(error) {
        try {
            console.log('에러 복구 시도:', error.message);
            
            // 렌더링 에러 복구
            if (error.message.includes('WebGL') || error.message.includes('render')) {
                this.recoverRenderingError();
            }
            
            // 물리 엔진 에러 복구
            else if (error.message.includes('physics') || error.message.includes('CANNON')) {
                this.recoverPhysicsError();
            }
            
            // 센서 관련 에러 복구
            else if (error.message.includes('sensor') || error.message.includes('orientation')) {
                this.recoverSensorError();
            }
            
        } catch (recoveryError) {
            console.error('에러 복구 실패:', recoveryError);
        }
    }
    
    /**
     * 렌더링 에러 복구
     */
    recoverRenderingError() {
        console.log('렌더링 에러 복구 시도');
        
        if (this.game.renderer) {
            try {
                // 렌더러 컨텍스트 복구 시도
                const gl = this.game.renderer.getContext();
                if (gl && gl.isContextLost()) {
                    console.log('WebGL 컨텍스트 손실 감지, 복구 대기');
                    
                    // 컨텍스트 복구 이벤트 리스너
                    this.game.canvas.addEventListener('webglcontextrestored', () => {
                        console.log('WebGL 컨텍스트 복구됨');
                        this.game.setupRenderer();
                    });
                }
            } catch (error) {
                console.error('렌더링 복구 실패:', error);
            }
        }
    }
    
    /**
     * 물리 엔진 에러 복구
     */
    recoverPhysicsError() {
        console.log('물리 엔진 에러 복구 시도');
        
        if (this.game.physics) {
            try {
                // 물리 시뮬레이션 일시 중단
                this.game.physics.world.step = () => {};
                
                // 1초 후 복구 시도
                setTimeout(() => {
                    this.game.physics = new PhysicsEngine(this.game.scene);
                    console.log('물리 엔진 재초기화 완료');
                }, 1000);
                
            } catch (error) {
                console.error('물리 엔진 복구 실패:', error);
            }
        }
    }
    
    /**
     * 센서 에러 복구
     */
    recoverSensorError() {
        console.log('센서 에러 복구 시도');
        
        // 센서 데이터 처리 일시 중단
        this.game.processSensorData = () => {};
        
        // 키보드 컨트롤로 전환
        this.game.testMode = true;
        
        if (this.game.ui) {
            this.game.ui.showToast('센서 오류로 키보드 모드로 전환됩니다', 'warning', 5000);
        }
    }
    
    /**
     * 세션 에러 복구
     */
    recoverSessionError() {
        console.log('세션 에러 복구 시도');
        
        if (this.game.sdk) {
            try {
                // 세션 재생성 시도
                setTimeout(() => {
                    this.game.createSession();
                }, 2000);
                
            } catch (error) {
                console.error('세션 복구 실패:', error);
            }
        }
    }
    
    /**
     * 적용된 수정사항 목록 반환
     */
    getAppliedFixes() {
        return this.appliedFixes;
    }
    
    /**
     * 버그 수정 상태 리포트
     */
    generateBugFixReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalFixes: this.appliedFixes.length,
            fixes: this.appliedFixes,
            gameVersion: '1.0.0',
            browserInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            }
        };
        
        console.log('🐛 버그 수정 리포트:', report);
        return report;
    }
}