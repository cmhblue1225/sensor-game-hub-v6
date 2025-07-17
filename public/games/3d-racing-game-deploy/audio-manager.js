/**
 * 스테레오 오디오 시스템 - 각 플레이어별 독립적인 오디오 처리
 * 요구사항 5.1, 5.2, 5.6 구현
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.leftChannelGain = null;
        this.rightChannelGain = null;
        this.leftPanner = null;
        this.rightPanner = null;
        
        // 오디오 버퍼 저장소
        this.audioBuffers = new Map();
        
        // 현재 재생 중인 사운드 추적
        this.activeSounds = {
            player1: new Map(),
            player2: new Map()
        };
        
        // 오디오 설정
        this.settings = {
            masterVolume: 0.7,
            engineVolume: 0.5,
            effectVolume: 0.8,
            musicVolume: 0.3
        };
        
        this.isInitialized = false;
        this.initializeAudio();
    }
    
    async initializeAudio() {
        try {
            // Web Audio API 초기화
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 마스터 게인 노드 생성
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.settings.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // 좌우 채널 분리를 위한 게인 노드
            this.leftChannelGain = this.audioContext.createGain();
            this.rightChannelGain = this.audioContext.createGain();
            
            // 스테레오 패너 생성 (좌우 채널 분리)
            this.leftPanner = this.audioContext.createStereoPanner();
            this.rightPanner = this.audioContext.createStereoPanner();
            
            // 완전히 왼쪽(-1)과 오른쪽(1)으로 패닝
            this.leftPanner.pan.value = -1.0;
            this.rightPanner.pan.value = 1.0;
            
            // 오디오 그래프 연결
            this.leftChannelGain.connect(this.leftPanner);
            this.rightChannelGain.connect(this.rightPanner);
            this.leftPanner.connect(this.masterGain);
            this.rightPanner.connect(this.masterGain);
            
            // 기본 오디오 생성 (합성 사운드)
            await this.generateSyntheticAudio();
            
            this.isInitialized = true;
            console.log('✅ AudioManager 초기화 완료');
            
        } catch (error) {
            console.error('❌ AudioManager 초기화 실패:', error);
            this.isInitialized = false;
        }
    }
    
    async generateSyntheticAudio() {
        // 엔진 사운드 생성 (합성)
        this.audioBuffers.set('engine', this.createEngineSound());
        
        // 충돌 사운드 생성
        this.audioBuffers.set('crash', this.createCrashSound());
        
        // 승리 사운드 생성
        this.audioBuffers.set('victory', this.createVictorySound());
        
        // 타이어 스키드 사운드 생성
        this.audioBuffers.set('skid', this.createSkidSound());
        
        // 카운트다운 사운드 생성
        this.audioBuffers.set('countdown', this.createCountdownSound());
        
        console.log('🎵 합성 오디오 생성 완료');
    }
    
    createEngineSound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 1.0; // 1초 루프
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 엔진 사운드 합성 (노이즈 + 저주파 진동)
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            
            // 기본 엔진 주파수 (낮은 럼블)
            const baseFreq = 80 + Math.sin(t * 10) * 20;
            const engineTone = Math.sin(2 * Math.PI * baseFreq * t) * 0.3;
            
            // 노이즈 추가 (배기음 시뮬레이션)
            const noise = (Math.random() - 0.5) * 0.1;
            
            // 하모닉 추가
            const harmonic = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.1;
            
            data[i] = engineTone + noise + harmonic;
        }
        
        return buffer;
    }
    
    createCrashSound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.5;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 충돌 사운드 (노이즈 버스트 + 감쇠)
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const decay = Math.exp(-t * 8); // 빠른 감쇠
            
            // 높은 주파수 노이즈
            const noise = (Math.random() - 0.5) * 2;
            
            // 금속성 사운드 시뮬레이션
            const metallic = Math.sin(2 * Math.PI * 800 * t) * Math.sin(2 * Math.PI * 1200 * t);
            
            data[i] = (noise * 0.7 + metallic * 0.3) * decay;
        }
        
        return buffer;
    }
    
    createVictorySound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 2.0;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 승리 팡파레 (상승하는 멜로디)
        const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C (한 옥타브 위)
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t * 2) % notes.length;
            const freq = notes[noteIndex];
            
            const envelope = Math.max(0, 1 - (t % 0.5) * 2); // 각 음표마다 감쇠
            const tone = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
            
            data[i] = tone;
        }
        
        return buffer;
    }
    
    createSkidSound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.8;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 타이어 스키드 사운드 (고주파 노이즈)
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            
            // 필터링된 노이즈
            const noise = (Math.random() - 0.5);
            const filtered = Math.sin(2 * Math.PI * 2000 * t) * noise * 0.3;
            
            // 감쇠 엔벨로프
            const envelope = Math.exp(-t * 2);
            
            data[i] = filtered * envelope;
        }
        
        return buffer;
    }
    
    createCountdownSound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.3;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 카운트다운 비프음
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 800;
            const envelope = Math.max(0, 1 - t * 3);
            
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.6;
        }
        
        return buffer;
    }
    
    // 플레이어별 엔진 사운드 재생
    playEngineSound(playerId, rpm = 1000, volume = 1.0) {
        if (!this.isInitialized) return null;
        
        const buffer = this.audioBuffers.get('engine');
        if (!buffer) return null;
        
        // 기존 엔진 사운드 중지
        this.stopSound(playerId, 'engine');
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.loop = true;
        
        // RPM에 따른 피치 조정
        const pitchRatio = Math.max(0.5, Math.min(2.0, rpm / 1000));
        source.playbackRate.value = pitchRatio;
        
        // 볼륨 설정
        gainNode.gain.value = volume * this.settings.engineVolume;
        
        // 플레이어별 채널 연결
        source.connect(gainNode);
        if (playerId === 'player1') {
            gainNode.connect(this.leftChannelGain);
        } else {
            gainNode.connect(this.rightChannelGain);
        }
        
        source.start();
        
        // 활성 사운드 추적
        this.activeSounds[playerId].set('engine', { source, gainNode });
        
        return { source, gainNode };
    }
    
    // 충돌 사운드 재생
    playCrashSound(playerId, intensity = 1.0) {
        if (!this.isInitialized) return null;
        
        const buffer = this.audioBuffers.get('crash');
        if (!buffer) return null;
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        gainNode.gain.value = intensity * this.settings.effectVolume;
        
        source.connect(gainNode);
        if (playerId === 'player1') {
            gainNode.connect(this.leftChannelGain);
        } else {
            gainNode.connect(this.rightChannelGain);
        }
        
        source.start();
        
        // 자동 정리
        source.onended = () => {
            this.activeSounds[playerId].delete('crash');
        };
        
        this.activeSounds[playerId].set('crash', { source, gainNode });
        
        return { source, gainNode };
    }
    
    // 승리 사운드 재생 (전체 스피커)
    playVictorySound(winnerId) {
        if (!this.isInitialized) return null;
        
        const buffer = this.audioBuffers.get('victory');
        if (!buffer) return null;
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        gainNode.gain.value = this.settings.effectVolume;
        
        // 승리 사운드는 양쪽 채널에서 재생
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        source.start();
        
        console.log(`🏆 ${winnerId} 승리 사운드 재생`);
        
        return { source, gainNode };
    }
    
    // 스키드 사운드 재생
    playSkidSound(playerId, intensity = 1.0) {
        if (!this.isInitialized) return null;
        
        const buffer = this.audioBuffers.get('skid');
        if (!buffer) return null;
        
        // 기존 스키드 사운드가 재생 중이면 중지
        this.stopSound(playerId, 'skid');
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.loop = true;
        gainNode.gain.value = intensity * this.settings.effectVolume * 0.7;
        
        source.connect(gainNode);
        if (playerId === 'player1') {
            gainNode.connect(this.leftChannelGain);
        } else {
            gainNode.connect(this.rightChannelGain);
        }
        
        source.start();
        
        this.activeSounds[playerId].set('skid', { source, gainNode });
        
        return { source, gainNode };
    }
    
    // 카운트다운 사운드 재생
    playCountdownSound() {
        if (!this.isInitialized) return null;
        
        const buffer = this.audioBuffers.get('countdown');
        if (!buffer) return null;
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        gainNode.gain.value = this.settings.effectVolume;
        
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        source.start();
        
        return { source, gainNode };
    }
    
    // 특정 사운드 중지
    stopSound(playerId, soundType) {
        const sound = this.activeSounds[playerId].get(soundType);
        if (sound && sound.source) {
            try {
                sound.source.stop();
            } catch (error) {
                // 이미 중지된 경우 무시
            }
            this.activeSounds[playerId].delete(soundType);
        }
    }
    
    // 플레이어의 모든 사운드 중지
    stopAllSounds(playerId) {
        const playerSounds = this.activeSounds[playerId];
        playerSounds.forEach((sound, soundType) => {
            this.stopSound(playerId, soundType);
        });
    }
    
    // 엔진 사운드 RPM 업데이트
    updateEngineRPM(playerId, rpm, volume = 1.0) {
        const engineSound = this.activeSounds[playerId].get('engine');
        if (engineSound && engineSound.source) {
            const pitchRatio = Math.max(0.5, Math.min(2.0, rpm / 1000));
            engineSound.source.playbackRate.value = pitchRatio;
            engineSound.gainNode.gain.value = volume * this.settings.engineVolume;
        }
    }
    
    // 볼륨 설정
    setMasterVolume(volume) {
        this.settings.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.settings.masterVolume;
        }
    }
    
    setEngineVolume(volume) {
        this.settings.engineVolume = Math.max(0, Math.min(1, volume));
    }
    
    setEffectVolume(volume) {
        this.settings.effectVolume = Math.max(0, Math.min(1, volume));
    }
    
    // 오디오 컨텍스트 재개 (사용자 상호작용 후)
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('🔊 오디오 컨텍스트 재개됨');
            } catch (error) {
                console.error('❌ 오디오 컨텍스트 재개 실패:', error);
            }
        }
    }
    
    // 리소스 정리
    cleanup() {
        // 모든 활성 사운드 중지
        Object.keys(this.activeSounds).forEach(playerId => {
            this.stopAllSounds(playerId);
        });
        
        // 오디오 컨텍스트 정리
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        // 버퍼 정리
        this.audioBuffers.clear();
        
        console.log('🧹 AudioManager 리소스 정리 완료');
    }
    
    // 디버그 정보
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            audioContextState: this.audioContext?.state,
            activePlayer1Sounds: Array.from(this.activeSounds.player1.keys()),
            activePlayer2Sounds: Array.from(this.activeSounds.player2.keys()),
            settings: this.settings
        };
    }
}

// 전역 오디오 매니저 인스턴스
window.AudioManager = AudioManager;