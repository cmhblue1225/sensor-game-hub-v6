/**
 * 3D 공간 오디오 시스템
 * 3D 공간에서의 위치 기반 오디오 및 효과음 관리
 */
class SpatialAudioSystem {
    constructor() {
        // Web Audio API 컨텍스트
        this.audioContext = null;
        this.isInitialized = false;
        
        // 리스너 (플레이어 위치)
        this.listener = null;
        
        // 오디오 소스들
        this.audioSources = new Map();
        this.activeSources = new Map();
        
        // 오디오 버퍼들
        this.audioBuffers = new Map();
        
        // 효과음 설정 (실제 존재하는 파일들만 사용)
        this.soundEffects = {
            // 케이크 관련 사운드 (실제 파일 사용)
            cake: {
                success: {
                    files: ['success.mp3'],
                    volume: 1.0,
                    pitch: 1.0,
                    spatial: false
                },
                failure: {
                    files: ['fail.mp3'],
                    volume: 0.9,
                    pitch: 1.0,
                    spatial: false
                }
            },
            
            // UI 사운드 (실제 파일 사용)
            ui: {
                success: {
                    files: ['success.mp3'],
                    volume: 0.8,
                    pitch: 1.0,
                    spatial: false
                },
                fail: {
                    files: ['fail.mp3'],
                    volume: 0.7,
                    pitch: 1.0,
                    spatial: false
                },
                bgm: {
                    files: ['bgm.mp3'],
                    volume: 0.5,
                    pitch: 1.0,
                    spatial: false,
                    loop: true
                }
            }
        };
        
        // 기본 사운드 설정 (폴백용)
        this.fallbackSounds = {
            click: { frequency: 800, duration: 0.1 },
            hover: { frequency: 600, duration: 0.05 },
            success: { frequency: 1000, duration: 0.3 },
            fail: { frequency: 200, duration: 0.5 },
            wobble: { frequency: 100, duration: 0.2 }
        };
        
        // 공간 오디오 설정
        this.spatialConfig = {
            distanceModel: 'inverse',
            maxDistance: 50,
            refDistance: 1,
            rolloffFactor: 1,
            coneInnerAngle: 360,
            coneOuterAngle: 0,
            coneOuterGain: 0
        };
        
        // 마스터 게인
        this.masterGain = null;
        this.effectsGain = null;
        
        // 리버브 효과
        this.reverbNode = null;
        this.reverbGain = null;
        
        // 압축기
        this.compressor = null;
        
        console.log('🔊 3D 공간 오디오 시스템 초기화');
    }
    
    /**
     * 오디오 컨텍스트 초기화
     */
    async initAudioContext() {
        if (this.isInitialized) return;
        
        try {
            // Web Audio API 컨텍스트 생성
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 사용자 제스처 후 컨텍스트 재개
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // 리스너 설정
            this.listener = this.audioContext.listener;
            this.setupListener();
            
            // 오디오 체인 설정
            this.setupAudioChain();
            
            this.isInitialized = true;
            console.log('✅ 3D 오디오 컨텍스트 초기화 완료');
            
        } catch (error) {
            console.error('❌ 3D 오디오 컨텍스트 초기화 실패:', error);
            throw error;
        }
    }
    
    /**
     * 리스너 설정
     */
    setupListener() {
        // 리스너 위치 설정 (카메라 위치와 동기화)
        this.listener.positionX.value = 0;
        this.listener.positionY.value = 5;
        this.listener.positionZ.value = 10;
        
        // 리스너 방향 설정
        this.listener.forwardX.value = 0;
        this.listener.forwardY.value = 0;
        this.listener.forwardZ.value = -1;
        
        this.listener.upX.value = 0;
        this.listener.upY.value = 1;
        this.listener.upZ.value = 0;
        
        console.log('👂 3D 오디오 리스너 설정 완료');
    }
    
    /**
     * 오디오 체인 설정
     */
    setupAudioChain() {
        // 마스터 게인
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.8;
        
        // 효과음 게인
        this.effectsGain = this.audioContext.createGain();
        this.effectsGain.gain.value = 1.0;
        
        // 압축기 (다이나믹 레인지 제어)
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;
        
        // 리버브 설정
        this.setupReverb();
        
        // 오디오 체인 연결
        this.effectsGain.connect(this.reverbNode);
        this.reverbNode.connect(this.compressor);
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);
        
        console.log('🔗 오디오 체인 설정 완료');
    }
    
    /**
     * 리버브 설정
     */
    setupReverb() {
        // 컨볼루션 리버브 생성
        this.reverbNode = this.audioContext.createConvolver();
        this.reverbGain = this.audioContext.createGain();
        this.reverbGain.gain.value = 0.2;
        
        // 임펄스 응답 생성 (간단한 룸 리버브)
        this.createReverbImpulse();
        
        console.log('🏛️ 리버브 설정 완료');
    }
    
    /**
     * 리버브 임펄스 응답 생성
     */
    createReverbImpulse() {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 2; // 2초 리버브
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 2);
                channelData[i] = (Math.random() * 2 - 1) * decay * 0.1;
            }
        }
        
        this.reverbNode.buffer = impulse;
    }
    
    /**
     * 사운드 효과 로드 (실제 존재하는 파일들만 사용)
     */
    async loadSoundEffects() {
        if (!this.isInitialized) {
            await this.initAudioContext();
        }
        
        try {
            console.log('🎵 사운드 효과 로딩 시작...');
            
            // 실제 존재하는 사운드 파일들만 로드
            const existingSounds = {
                'ui_success': '/games/cake-delivery/assets/success.mp3',
                'ui_fail': '/games/cake-delivery/assets/fail.mp3',
                'bgm': '/games/cake-delivery/assets/bgm.mp3'
            };
            
            // 각 파일을 개별적으로 로드하고 실패 시 폴백 생성
            for (const [soundKey, filePath] of Object.entries(existingSounds)) {
                try {
                    await this.loadAudioFile(filePath, soundKey);
                    console.log(`✅ 사운드 로드 완료: ${soundKey}`);
                } catch (error) {
                    console.warn(`⚠️ 사운드 로드 실패: ${soundKey}, 폴백 사운드 생성`);
                    // 폴백: 기본 사운드 생성
                    this.createFallbackSound(soundKey, { volume: 0.5, pitch: 1.0 });
                }
            }
            
            console.log('🎵 사운드 효과 로딩 완료');
            
        } catch (error) {
            console.error('❌ 사운드 효과 로딩 실패:', error);
            // 모든 사운드를 폴백으로 생성
            this.createAllFallbackSounds();
        }
    }
    
    /**
     * 모든 폴백 사운드 생성
     */
    createAllFallbackSounds() {
        console.log('🔄 모든 폴백 사운드 생성 중...');
        
        const fallbackSounds = ['ui_success', 'ui_fail', 'bgm'];
        fallbackSounds.forEach(soundKey => {
            this.createFallbackSound(soundKey, { volume: 0.5, pitch: 1.0 });
        });
        
        console.log('✅ 모든 폴백 사운드 생성 완료');
    }
    
    /**
     * 오디오 파일 로드 (안전한 버전)
     * @param {string} filePath - 파일 경로
     * @param {string} soundKey - 사운드 키
     * @returns {Promise<AudioBuffer>}
     */
    async loadAudioFile(filePath, soundKey) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('GET', filePath, true);
            request.responseType = 'arraybuffer';
            
            request.onload = () => {
                if (request.status === 200) {
                    try {
                        this.audioContext.decodeAudioData(
                            request.response,
                            (audioBuffer) => {
                                this.audioBuffers.set(soundKey, audioBuffer);
                                console.log(`✅ 사운드 로드 완료: ${soundKey}`);
                                resolve(audioBuffer);
                            },
                            (error) => {
                                console.warn(`⚠️ 오디오 디코딩 실패: ${soundKey}`, error);
                                reject(new Error(`Audio decoding failed for ${soundKey}: ${error.message}`));
                            }
                        );
                    } catch (error) {
                        console.warn(`⚠️ 오디오 처리 실패: ${soundKey}`, error);
                        reject(new Error(`Audio processing failed for ${soundKey}: ${error.message}`));
                    }
                } else {
                    reject(new Error(`HTTP ${request.status}: Failed to load ${filePath}`));
                }
            };
            
            request.onerror = () => {
                reject(new Error(`Network error loading ${filePath}`));
            };
            
            request.ontimeout = () => {
                reject(new Error(`Timeout loading ${filePath}`));
            };
            
            request.timeout = 10000; // 10초 타임아웃
            request.send();
        });
    }
    
    /**
     * 폴백 사운드 생성
     * @param {string} soundKey - 사운드 키
     * @param {Object} config - 사운드 설정
     * @returns {AudioBuffer}
     */
    createFallbackSound(soundKey, config) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.5; // 0.5초
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 사운드 타입에 따른 기본 파형 생성
        if (soundKey.includes('wobble')) {
            // 케이크 흔들림: 저주파 사인파
            for (let i = 0; i < length; i++) {
                data[i] = Math.sin(2 * Math.PI * 100 * i / sampleRate) * 0.3 * (1 - i / length);
            }
        } else if (soundKey.includes('collision')) {
            // 충돌: 노이즈 버스트
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.5 * (1 - i / length);
            }
        } else if (soundKey.includes('footstep')) {
            // 발걸음: 짧은 노이즈
            for (let i = 0; i < length / 4; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.2 * (1 - i / (length / 4));
            }
        } else {
            // 기본: 짧은 톤
            for (let i = 0; i < length; i++) {
                data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1 * (1 - i / length);
            }
        }
        
        this.audioBuffers.set(soundKey, buffer);
        console.log(`🔄 폴백 사운드 생성: ${soundKey}`);
        return buffer;
    }
    
    /**
     * 3D 위치 기반 사운드 재생
     * @param {string} category - 사운드 카테고리
     * @param {string} soundName - 사운드 이름
     * @param {THREE.Vector3} position - 3D 위치
     * @param {Object} options - 추가 옵션
     */
    playSound3D(category, soundName, position, options = {}) {
        const soundConfig = this.soundEffects[category]?.[soundName];
        if (!soundConfig) {
            console.warn(`⚠️ 사운드를 찾을 수 없음: ${category}.${soundName}`);
            return null;
        }
        
        // 랜덤 파일 선택
        const fileIndex = Math.floor(Math.random() * soundConfig.files.length);
        const soundKey = `${category}_${soundName}_${fileIndex}`;
        const audioBuffer = this.audioBuffers.get(soundKey);
        
        if (!audioBuffer) {
            console.warn(`⚠️ 오디오 버퍼를 찾을 수 없음: ${soundKey}`);
            return null;
        }
        
        try {
            // 오디오 소스 생성
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            
            // 게인 노드
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = (options.volume || soundConfig.volume) * 0.8;
            
            // 3D 공간 오디오 설정
            let audioChain = source;
            
            if (soundConfig.spatial) {
                const panner = this.audioContext.createPanner();
                this.setupPanner(panner, position);
                
                source.connect(panner);
                panner.connect(gainNode);
                audioChain = panner;
            } else {
                source.connect(gainNode);
            }
            
            // 피치 조정
            if (options.pitch || soundConfig.pitch !== 1.0) {
                source.playbackRate.value = options.pitch || soundConfig.pitch;
            }
            
            // 최종 연결
            gainNode.connect(this.effectsGain);
            
            // 재생
            const startTime = this.audioContext.currentTime + (options.delay || 0);
            source.start(startTime);
            
            // 루프 설정
            if (soundConfig.loop || options.loop) {
                source.loop = true;
            } else {
                // 자동 정리
                source.onended = () => {
                    this.cleanupSource(source);
                };
            }
            
            // 활성 소스 추적
            const sourceId = `${category}_${soundName}_${Date.now()}`;
            this.activeSources.set(sourceId, {
                source,
                gainNode,
                panner: soundConfig.spatial ? audioChain : null,
                category,
                soundName,
                position: position.clone()
            });
            
            console.log(`🔊 3D 사운드 재생: ${category}.${soundName} at [${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}]`);
            
            return sourceId;
            
        } catch (error) {
            console.error(`❌ 3D 사운드 재생 실패: ${category}.${soundName}`, error);
            return null;
        }
    }
    
    /**
     * 2D 사운드 재생 (UI 등)
     * @param {string} category - 사운드 카테고리
     * @param {string} soundName - 사운드 이름
     * @param {Object} options - 추가 옵션
     */
    playSound2D(category, soundName, options = {}) {
        return this.playSound3D(category, soundName, new THREE.Vector3(0, 0, 0), {
            ...options,
            spatial: false
        });
    }
    
    /**
     * 패너 설정
     * @param {PannerNode} panner - 패너 노드
     * @param {THREE.Vector3} position - 위치
     */
    setupPanner(panner, position) {
        // 패닝 모델 설정
        panner.panningModel = 'HRTF';
        panner.distanceModel = this.spatialConfig.distanceModel;
        panner.maxDistance = this.spatialConfig.maxDistance;
        panner.refDistance = this.spatialConfig.refDistance;
        panner.rolloffFactor = this.spatialConfig.rolloffFactor;
        
        // 위치 설정
        panner.positionX.value = position.x;
        panner.positionY.value = position.y;
        panner.positionZ.value = position.z;
        
        // 방향 설정 (기본값)
        panner.orientationX.value = 0;
        panner.orientationY.value = 0;
        panner.orientationZ.value = -1;
        
        // 콘 설정
        panner.coneInnerAngle = this.spatialConfig.coneInnerAngle;
        panner.coneOuterAngle = this.spatialConfig.coneOuterAngle;
        panner.coneOuterGain = this.spatialConfig.coneOuterGain;
    }
    
    /**
     * 리스너 위치 업데이트 (카메라와 동기화)
     * @param {THREE.Vector3} position - 위치
     * @param {THREE.Vector3} forward - 전방 벡터
     * @param {THREE.Vector3} up - 상향 벡터
     */
    updateListenerPosition(position, forward, up) {
        if (!this.listener) return;
        
        // 위치 업데이트
        this.listener.positionX.value = position.x;
        this.listener.positionY.value = position.y;
        this.listener.positionZ.value = position.z;
        
        // 방향 업데이트
        this.listener.forwardX.value = forward.x;
        this.listener.forwardY.value = forward.y;
        this.listener.forwardZ.value = forward.z;
        
        this.listener.upX.value = up.x;
        this.listener.upY.value = up.y;
        this.listener.upZ.value = up.z;
    }
    
    /**
     * 사운드 소스 위치 업데이트
     * @param {string} sourceId - 소스 ID
     * @param {THREE.Vector3} position - 새 위치
     */
    updateSourcePosition(sourceId, position) {
        const sourceData = this.activeSources.get(sourceId);
        if (sourceData && sourceData.panner) {
            sourceData.panner.positionX.value = position.x;
            sourceData.panner.positionY.value = position.y;
            sourceData.panner.positionZ.value = position.z;
            sourceData.position.copy(position);
        }
    }
    
    /**
     * 사운드 정지
     * @param {string} sourceId - 소스 ID
     * @param {number} fadeTime - 페이드 시간 (초)
     */
    stopSound(sourceId, fadeTime = 0) {
        const sourceData = this.activeSources.get(sourceId);
        if (!sourceData) return;
        
        if (fadeTime > 0) {
            // 페이드아웃
            sourceData.gainNode.gain.linearRampToValueAtTime(
                0,
                this.audioContext.currentTime + fadeTime
            );
            
            setTimeout(() => {
                sourceData.source.stop();
                this.activeSources.delete(sourceId);
            }, fadeTime * 1000);
        } else {
            // 즉시 정지
            sourceData.source.stop();
            this.activeSources.delete(sourceId);
        }
        
        console.log(`⏹️ 사운드 정지: ${sourceId}`);
    }
    
    /**
     * 카테고리별 사운드 정지
     * @param {string} category - 카테고리
     * @param {number} fadeTime - 페이드 시간 (초)
     */
    stopSoundsByCategory(category, fadeTime = 0) {
        const sourcesToStop = [];
        
        this.activeSources.forEach((sourceData, sourceId) => {
            if (sourceData.category === category) {
                sourcesToStop.push(sourceId);
            }
        });
        
        sourcesToStop.forEach(sourceId => {
            this.stopSound(sourceId, fadeTime);
        });
        
        console.log(`⏹️ 카테고리 사운드 정지: ${category} (${sourcesToStop.length}개)`);
    }
    
    /**
     * 모든 사운드 정지
     * @param {number} fadeTime - 페이드 시간 (초)
     */
    stopAllSounds(fadeTime = 0) {
        const sourceIds = Array.from(this.activeSources.keys());
        sourceIds.forEach(sourceId => {
            this.stopSound(sourceId, fadeTime);
        });
        
        console.log(`⏹️ 모든 사운드 정지 (${sourceIds.length}개)`);
    }
    
    /**
     * 마스터 볼륨 설정
     * @param {number} volume - 볼륨 (0-1)
     */
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(
                Math.max(0, Math.min(1, volume)),
                this.audioContext.currentTime + 0.1
            );
        }
        
        console.log(`🔊 마스터 볼륨 설정: ${volume}`);
    }
    
    /**
     * 효과음 볼륨 설정
     * @param {number} volume - 볼륨 (0-1)
     */
    setEffectsVolume(volume) {
        if (this.effectsGain) {
            this.effectsGain.gain.linearRampToValueAtTime(
                Math.max(0, Math.min(1, volume)),
                this.audioContext.currentTime + 0.1
            );
        }
        
        console.log(`🔊 효과음 볼륨 설정: ${volume}`);
    }
    
    /**
     * 리버브 강도 설정
     * @param {number} amount - 리버브 강도 (0-1)
     */
    setReverbAmount(amount) {
        if (this.reverbGain) {
            this.reverbGain.gain.linearRampToValueAtTime(
                Math.max(0, Math.min(1, amount)),
                this.audioContext.currentTime + 0.1
            );
        }
        
        console.log(`🏛️ 리버브 강도 설정: ${amount}`);
    }
    
    /**
     * 소스 정리
     * @param {AudioBufferSourceNode} source - 오디오 소스
     */
    cleanupSource(source) {
        // 활성 소스에서 제거
        this.activeSources.forEach((sourceData, sourceId) => {
            if (sourceData.source === source) {
                this.activeSources.delete(sourceId);
            }
        });
    }
    
    /**
     * 케이크 타입별 사운드 재생
     * @param {string} cakeType - 케이크 타입
     * @param {string} action - 액션 (wobble, collision, etc.)
     * @param {THREE.Vector3} position - 위치
     * @param {Object} options - 추가 옵션
     */
    playCakeSound(cakeType, action, position, options = {}) {
        // 케이크 타입별 사운드 변형
        const cakeModifiers = {
            basic: { pitch: 1.0, volume: 1.0 },
            strawberry: { pitch: 1.1, volume: 0.9 },
            chocolate: { pitch: 0.9, volume: 1.1 },
            wedding: { pitch: 0.8, volume: 1.2 },
            ice: { pitch: 1.3, volume: 0.8 },
            bomb: { pitch: 0.7, volume: 1.5 }
        };
        
        const modifier = cakeModifiers[cakeType] || cakeModifiers.basic;
        const modifiedOptions = {
            ...options,
            pitch: (options.pitch || 1.0) * modifier.pitch,
            volume: (options.volume || 1.0) * modifier.volume
        };
        
        return this.playSound3D('cake', action, position, modifiedOptions);
    }
    
    /**
     * 환경 사운드 시작
     * @param {string} environmentType - 환경 타입
     */
    startEnvironmentSounds(environmentType = 'default') {
        console.log(`🌍 환경 사운드 시작: ${environmentType}`);
        
        // 환경별 사운드 설정
        const environments = {
            default: ['wind', 'birds'],
            urban: ['traffic', 'wind'],
            quiet: ['birds'],
            windy: ['wind']
        };
        
        const soundsToPlay = environments[environmentType] || environments.default;
        
        soundsToPlay.forEach(soundName => {
            this.playSound2D('environment', soundName, { loop: true });
        });
    }
    
    /**
     * 시스템 업데이트 (매 프레임 호출)
     * @param {number} deltaTime - 델타 시간
     */
    update(deltaTime) {
        // 거리 기반 볼륨 조정 등의 업데이트 로직
        // 현재는 Web Audio API가 자동으로 처리
    }
    
    /**
     * 디버그 정보 반환
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            activeSources: this.activeSources.size,
            loadedBuffers: this.audioBuffers.size,
            audioContextState: this.audioContext?.state || 'not_initialized',
            listenerPosition: this.listener ? {
                x: this.listener.positionX.value,
                y: this.listener.positionY.value,
                z: this.listener.positionZ.value
            } : null
        };
    }
    
    /**
     * 정리
     */
    cleanup() {
        console.log('🧹 3D 공간 오디오 시스템 정리 시작...');
        
        // 모든 사운드 정지
        this.stopAllSounds(0);
        
        // 오디오 컨텍스트 정리
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        // 데이터 정리
        this.audioBuffers.clear();
        this.audioSources.clear();
        this.activeSources.clear();
        
        console.log('✅ 3D 공간 오디오 시스템 정리 완료');
    }
}