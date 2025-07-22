/**
 * 적응형 음악 시스템
 * 게임 상황에 따라 음악이 동적으로 변화하는 시스템
 */
class AdaptiveMusicSystem {
    constructor() {
        // Web Audio API 컨텍스트
        this.audioContext = null;
        this.isInitialized = false;
        
        // 음악 레이어들
        this.musicLayers = new Map();
        this.currentLayers = new Map();
        
        // 음악 상태
        this.currentIntensity = 0;
        this.targetIntensity = 0;
        this.transitionSpeed = 0.02;
        
        // 게임 상태별 음악 설정
        this.musicConfig = {
            menu: {
                intensity: 0.2,
                layers: ['ambient'],
                tempo: 1.0,
                volume: 0.6
            },
            playing: {
                intensity: 0.5,
                layers: ['ambient', 'rhythm'],
                tempo: 1.0,
                volume: 0.8
            },
            tension: {
                intensity: 0.8,
                layers: ['ambient', 'rhythm', 'tension'],
                tempo: 1.2,
                volume: 0.9
            },
            success: {
                intensity: 1.0,
                layers: ['ambient', 'rhythm', 'celebration'],
                tempo: 1.1,
                volume: 1.0
            },
            failure: {
                intensity: 0.1,
                layers: ['ambient'],
                tempo: 0.8,
                volume: 0.4
            }
        };
        
        // 오디오 버퍼들
        this.audioBuffers = new Map();
        
        // 게인 노드들
        this.masterGain = null;
        this.layerGains = new Map();
        
        // 분석기 노드
        this.analyser = null;
        this.frequencyData = null;
        
        // 상태 추적
        this.isPlaying = false;
        this.currentGameState = 'menu';
        
        console.log('🎵 적응형 음악 시스템 초기화');
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
            
            // 마스터 게인 노드 생성
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.7;
            
            // 분석기 노드 생성
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.connect(this.masterGain);
            
            this.isInitialized = true;
            console.log('✅ 오디오 컨텍스트 초기화 완료');
            
        } catch (error) {
            console.error('❌ 오디오 컨텍스트 초기화 실패:', error);
            throw error;
        }
    }
    
    /**
     * 음악 레이어 로드
     */
    async loadMusicLayers() {
        if (!this.isInitialized) {
            await this.initAudioContext();
        }
        
        try {
            console.log('🎼 음악 레이어 로딩 시작...');
            
            // 음악 파일 경로 정의
            const musicFiles = {
                ambient: '/games/cake-delivery/assets/music/ambient.mp3',
                rhythm: '/games/cake-delivery/assets/music/rhythm.mp3',
                tension: '/games/cake-delivery/assets/music/tension.mp3',
                celebration: '/games/cake-delivery/assets/music/celebration.mp3'
            };
            
            // 각 레이어 로드
            const loadPromises = Object.entries(musicFiles).map(async ([layerName, filePath]) => {
                try {
                    const audioBuffer = await this.loadAudioFile(filePath);
                    this.audioBuffers.set(layerName, audioBuffer);
                    
                    // 레이어별 게인 노드 생성
                    const layerGain = this.audioContext.createGain();
                    layerGain.connect(this.analyser);
                    layerGain.gain.value = 0;
                    this.layerGains.set(layerName, layerGain);
                    
                    console.log(`✅ 음악 레이어 로드 완료: ${layerName}`);
                    
                } catch (error) {
                    console.warn(`⚠️ 음악 레이어 로드 실패: ${layerName}`, error);
                    
                    // 폴백: 기본 BGM 사용
                    await this.loadFallbackMusic(layerName);
                }
            });
            
            await Promise.all(loadPromises);
            console.log('🎼 모든 음악 레이어 로딩 완료');
            
        } catch (error) {
            console.error('❌ 음악 레이어 로딩 실패:', error);
            // 완전 폴백: 기존 BGM 시스템 사용
            await this.setupFallbackSystem();
        }
    }
    
    /**
     * 오디오 파일 로드
     * @param {string} filePath - 파일 경로
     * @returns {Promise<AudioBuffer>}
     */
    async loadAudioFile(filePath) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('GET', filePath, true);
            request.responseType = 'arraybuffer';
            
            request.onload = () => {
                this.audioContext.decodeAudioData(
                    request.response,
                    (audioBuffer) => resolve(audioBuffer),
                    (error) => reject(error)
                );
            };
            
            request.onerror = () => reject(new Error(`Failed to load ${filePath}`));
            request.send();
        });
    }
    
    /**
     * 폴백 음악 로드
     * @param {string} layerName - 레이어 이름
     */
    async loadFallbackMusic(layerName) {
        try {
            // 기존 BGM 파일 사용
            const fallbackPath = '/games/cake-delivery/assets/bgm.mp3';
            const audioBuffer = await this.loadAudioFile(fallbackPath);
            
            // 레이어별로 다른 필터 적용
            const processedBuffer = this.processAudioForLayer(audioBuffer, layerName);
            this.audioBuffers.set(layerName, processedBuffer);
            
            // 게인 노드 생성
            const layerGain = this.audioContext.createGain();
            layerGain.connect(this.analyser);
            layerGain.gain.value = 0;
            this.layerGains.set(layerName, layerGain);
            
            console.log(`✅ 폴백 음악 로드 완료: ${layerName}`);
            
        } catch (error) {
            console.error(`❌ 폴백 음악 로드 실패: ${layerName}`, error);
        }
    }
    
    /**
     * 레이어별 오디오 처리
     * @param {AudioBuffer} audioBuffer - 원본 오디오 버퍼
     * @param {string} layerName - 레이어 이름
     * @returns {AudioBuffer}
     */
    processAudioForLayer(audioBuffer, layerName) {
        // 간단한 처리: 원본 버퍼 반환
        // 실제로는 레이어별로 다른 필터나 이펙트를 적용할 수 있음
        return audioBuffer;
    }
    
    /**
     * 완전 폴백 시스템 설정
     */
    async setupFallbackSystem() {
        console.log('🔄 폴백 음악 시스템 설정...');
        
        try {
            // HTML5 Audio 사용
            this.fallbackAudio = new Audio('/games/cake-delivery/assets/bgm.mp3');
            this.fallbackAudio.loop = true;
            this.fallbackAudio.volume = 0.5;
            
            console.log('✅ 폴백 음악 시스템 설정 완료');
            
        } catch (error) {
            console.error('❌ 폴백 음악 시스템 설정 실패:', error);
        }
    }
    
    /**
     * 음악 재생 시작
     * @param {string} gameState - 게임 상태
     */
    async startMusic(gameState = 'menu') {
        if (!this.isInitialized) {
            await this.initAudioContext();
        }
        
        try {
            // 사용자 제스처 후 컨텍스트 재개
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.currentGameState = gameState;
            this.isPlaying = true;
            
            // 음악 레이어 시작
            await this.startMusicLayers(gameState);
            
            console.log(`🎵 음악 재생 시작: ${gameState}`);
            
        } catch (error) {
            console.error('❌ 음악 재생 시작 실패:', error);
            
            // 폴백 시스템 사용
            if (this.fallbackAudio) {
                this.fallbackAudio.play().catch(console.error);
            }
        }
    }
    
    /**
     * 음악 레이어 시작
     * @param {string} gameState - 게임 상태
     */
    async startMusicLayers(gameState) {
        const config = this.musicConfig[gameState] || this.musicConfig.menu;
        
        // 활성 레이어 시작
        for (const layerName of config.layers) {
            await this.startLayer(layerName);
        }
        
        // 강도 설정
        this.targetIntensity = config.intensity;
    }
    
    /**
     * 음악 레이어 시작
     * @param {string} layerName - 레이어 이름
     */
    async startLayer(layerName) {
        const audioBuffer = this.audioBuffers.get(layerName);
        const layerGain = this.layerGains.get(layerName);
        
        if (!audioBuffer || !layerGain) {
            console.warn(`⚠️ 레이어를 찾을 수 없음: ${layerName}`);
            return;
        }
        
        // 기존 소스 정지
        if (this.currentLayers.has(layerName)) {
            const existingSource = this.currentLayers.get(layerName);
            existingSource.stop();
        }
        
        // 새 소스 생성
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;
        source.connect(layerGain);
        
        // 재생 시작
        source.start();
        this.currentLayers.set(layerName, source);
        
        console.log(`▶️ 레이어 시작: ${layerName}`);
    }
    
    /**
     * 게임 상태에 따른 음악 강도 업데이트
     * @param {string} gameState - 게임 상태
     * @param {Object} gameData - 게임 데이터
     */
    updateIntensity(gameState, gameData = {}) {
        if (!this.isPlaying) return;
        
        // 게임 상태 변경 감지
        if (gameState !== this.currentGameState) {
            this.transitionToGameState(gameState);
        }
        
        // 동적 강도 계산
        const dynamicIntensity = this.calculateDynamicIntensity(gameState, gameData);
        this.targetIntensity = dynamicIntensity;
        
        // 부드러운 전환
        this.smoothTransition();
    }
    
    /**
     * 게임 상태 전환
     * @param {string} newGameState - 새 게임 상태
     */
    async transitionToGameState(newGameState) {
        console.log(`🎵 음악 상태 전환: ${this.currentGameState} → ${newGameState}`);
        
        const oldConfig = this.musicConfig[this.currentGameState] || this.musicConfig.menu;
        const newConfig = this.musicConfig[newGameState] || this.musicConfig.menu;
        
        // 새로운 레이어 시작
        for (const layerName of newConfig.layers) {
            if (!oldConfig.layers.includes(layerName)) {
                await this.startLayer(layerName);
            }
        }
        
        // 불필요한 레이어 페이드아웃
        for (const layerName of oldConfig.layers) {
            if (!newConfig.layers.includes(layerName)) {
                this.fadeOutLayer(layerName);
            }
        }
        
        this.currentGameState = newGameState;
        this.targetIntensity = newConfig.intensity;
    }
    
    /**
     * 동적 강도 계산
     * @param {string} gameState - 게임 상태
     * @param {Object} gameData - 게임 데이터
     * @returns {number} 계산된 강도 (0-1)
     */
    calculateDynamicIntensity(gameState, gameData) {
        const baseConfig = this.musicConfig[gameState] || this.musicConfig.menu;
        let intensity = baseConfig.intensity;
        
        // 게임 상태별 동적 조정
        switch (gameState) {
            case 'playing':
                // 케이크 불안정도에 따른 긴장감 증가
                if (gameData.cakeStability !== undefined) {
                    const instabilityFactor = 1 - gameData.cakeStability;
                    intensity += instabilityFactor * 0.3;
                }
                
                // 시간 압박에 따른 긴장감 증가
                if (gameData.timeLeft !== undefined && gameData.totalTime !== undefined) {
                    const timeRatio = gameData.timeLeft / gameData.totalTime;
                    if (timeRatio < 0.3) {
                        intensity += (0.3 - timeRatio) * 0.5;
                    }
                }
                
                // 레벨에 따른 강도 증가
                if (gameData.level !== undefined) {
                    intensity += Math.min(gameData.level * 0.05, 0.2);
                }
                break;
                
            case 'tension':
                // 충돌 위험도에 따른 강도 조정
                if (gameData.collisionRisk !== undefined) {
                    intensity += gameData.collisionRisk * 0.2;
                }
                break;
                
            case 'success':
                // 성공 정도에 따른 축하 강도 조정
                if (gameData.scoreMultiplier !== undefined) {
                    intensity = Math.min(intensity + gameData.scoreMultiplier * 0.1, 1.0);
                }
                break;
        }
        
        return Math.max(0, Math.min(1, intensity));
    }
    
    /**
     * 부드러운 전환 처리
     */
    smoothTransition() {
        if (Math.abs(this.currentIntensity - this.targetIntensity) > 0.01) {
            // 부드러운 전환
            const diff = this.targetIntensity - this.currentIntensity;
            this.currentIntensity += diff * this.transitionSpeed;
            
            // 레이어별 볼륨 조정
            this.updateLayerVolumes();
        }
    }
    
    /**
     * 레이어별 볼륨 업데이트
     */
    updateLayerVolumes() {
        const config = this.musicConfig[this.currentGameState] || this.musicConfig.menu;
        
        // 각 레이어의 볼륨을 강도에 따라 조정
        config.layers.forEach((layerName, index) => {
            const layerGain = this.layerGains.get(layerName);
            if (layerGain) {
                // 레이어별 가중치 계산
                const layerWeight = this.getLayerWeight(layerName, index, config.layers.length);
                const targetVolume = this.currentIntensity * layerWeight * config.volume;
                
                // 부드러운 볼륨 전환
                layerGain.gain.linearRampToValueAtTime(
                    targetVolume,
                    this.audioContext.currentTime + 0.1
                );
            }
        });
    }
    
    /**
     * 레이어 가중치 계산
     * @param {string} layerName - 레이어 이름
     * @param {number} index - 레이어 인덱스
     * @param {number} totalLayers - 총 레이어 수
     * @returns {number} 가중치 (0-1)
     */
    getLayerWeight(layerName, index, totalLayers) {
        const layerWeights = {
            ambient: 0.8,      // 항상 기본 볼륨
            rhythm: 1.0,       // 강도에 비례
            tension: 1.2,      // 긴장감 시 더 강하게
            celebration: 1.5   // 축하 시 가장 강하게
        };
        
        return layerWeights[layerName] || 1.0;
    }
    
    /**
     * 레이어 페이드아웃
     * @param {string} layerName - 레이어 이름
     * @param {number} fadeTime - 페이드 시간 (초)
     */
    fadeOutLayer(layerName, fadeTime = 2.0) {
        const layerGain = this.layerGains.get(layerName);
        const layerSource = this.currentLayers.get(layerName);
        
        if (layerGain && layerSource) {
            // 볼륨 페이드아웃
            layerGain.gain.linearRampToValueAtTime(
                0,
                this.audioContext.currentTime + fadeTime
            );
            
            // 페이드아웃 완료 후 소스 정지
            setTimeout(() => {
                if (this.currentLayers.get(layerName) === layerSource) {
                    layerSource.stop();
                    this.currentLayers.delete(layerName);
                }
            }, fadeTime * 1000);
            
            console.log(`🔇 레이어 페이드아웃: ${layerName}`);
        }
    }
    
    /**
     * 음악 정지
     * @param {number} fadeTime - 페이드 시간 (초)
     */
    stopMusic(fadeTime = 1.0) {
        if (!this.isPlaying) return;
        
        console.log('⏹️ 음악 정지');
        
        if (this.masterGain) {
            // 마스터 볼륨 페이드아웃
            this.masterGain.gain.linearRampToValueAtTime(
                0,
                this.audioContext.currentTime + fadeTime
            );
            
            // 페이드아웃 완료 후 모든 소스 정지
            setTimeout(() => {
                this.currentLayers.forEach((source, layerName) => {
                    source.stop();
                });
                this.currentLayers.clear();
                
                // 마스터 볼륨 복원
                this.masterGain.gain.value = 0.7;
                
                this.isPlaying = false;
            }, fadeTime * 1000);
        }
        
        // 폴백 오디오 정지
        if (this.fallbackAudio) {
            this.fallbackAudio.pause();
            this.fallbackAudio.currentTime = 0;
        }
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
        
        if (this.fallbackAudio) {
            this.fallbackAudio.volume = Math.max(0, Math.min(1, volume));
        }
        
        console.log(`🔊 마스터 볼륨 설정: ${volume}`);
    }
    
    /**
     * 음악 일시정지
     */
    pauseMusic() {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
        
        if (this.fallbackAudio) {
            this.fallbackAudio.pause();
        }
        
        console.log('⏸️ 음악 일시정지');
    }
    
    /**
     * 음악 재개
     */
    resumeMusic() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if (this.fallbackAudio) {
            this.fallbackAudio.play().catch(console.error);
        }
        
        console.log('▶️ 음악 재개');
    }
    
    /**
     * 주파수 분석 데이터 반환
     * @returns {Uint8Array|null}
     */
    getFrequencyData() {
        if (this.analyser && this.frequencyData) {
            this.analyser.getByteFrequencyData(this.frequencyData);
            return this.frequencyData;
        }
        return null;
    }
    
    /**
     * 음악 시스템 업데이트 (매 프레임 호출)
     * @param {number} deltaTime - 델타 시간
     */
    update(deltaTime) {
        if (!this.isPlaying) return;
        
        // 부드러운 전환 처리
        this.smoothTransition();
        
        // 주파수 분석 (시각화용)
        if (this.analyser) {
            this.analyser.getByteFrequencyData(this.frequencyData);
        }
    }
    
    /**
     * 디버그 정보 반환
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            isPlaying: this.isPlaying,
            currentGameState: this.currentGameState,
            currentIntensity: this.currentIntensity,
            targetIntensity: this.targetIntensity,
            activeLayers: Array.from(this.currentLayers.keys()),
            loadedBuffers: Array.from(this.audioBuffers.keys()),
            audioContextState: this.audioContext?.state || 'not_initialized'
        };
    }
    
    /**
     * 정리
     */
    cleanup() {
        console.log('🧹 적응형 음악 시스템 정리 시작...');
        
        // 음악 정지
        this.stopMusic(0);
        
        // 오디오 컨텍스트 정리
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        // 폴백 오디오 정리
        if (this.fallbackAudio) {
            this.fallbackAudio.pause();
            this.fallbackAudio.src = '';
        }
        
        // 데이터 정리
        this.audioBuffers.clear();
        this.layerGains.clear();
        this.currentLayers.clear();
        
        console.log('✅ 적응형 음악 시스템 정리 완료');
    }
}