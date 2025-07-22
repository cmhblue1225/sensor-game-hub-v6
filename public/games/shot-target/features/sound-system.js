export class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.7;
        this.bgmVolume = 0.3; // BGM 전용 볼륨
        this.bgmEnabled = true;
        this.bgmAudio = null; // HTML5 Audio 객체
        this.initializeAudioContext();
    }

    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.enabled = false;
        }
    }

    async ensureAudioContext() {
        if (!this.audioContext || !this.enabled) return false;
        
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.warn('Could not resume audio context:', error);
                return false;
            }
        }
        return true;
    }

    // 표적 맞춤 소리 - 높은 톤의 펑 소리
    async playHitSound(targetType = 'medium') {
        if (!await this.ensureAudioContext()) return;

        const frequency = targetType === 'large' ? 800 : 
                         targetType === 'medium' ? 1000 : 1200;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
        
        oscillator.type = 'square';
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    // 표적 놓침 소리 - 낮은 톤의 부웅 소리
    async playMissSound() {
        if (!await this.ensureAudioContext()) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        oscillator.type = 'sawtooth';
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    // 게임 시작 소리 - 상승하는 멜로디
    async playGameStartSound() {
        if (!await this.ensureAudioContext()) return;

        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C (한 옥타브 위)
        
        for (let i = 0; i < frequencies.length; i++) {
            setTimeout(() => {
                this.playTone(frequencies[i], 0.15, 'sine', this.volume * 0.4);
            }, i * 100);
        }
    }

    // 게임 종료 소리 - 하강하는 멜로디
    async playGameEndSound() {
        if (!await this.ensureAudioContext()) return;

        const frequencies = [523.25, 392.00, 329.63, 261.63]; // C, G, E, C (하강)
        
        for (let i = 0; i < frequencies.length; i++) {
            setTimeout(() => {
                this.playTone(frequencies[i], 0.2, 'sine', this.volume * 0.5);
            }, i * 150);
        }
    }

    // 콤보 소리 - 높아지는 톤 (최대 3콤보)
    async playComboSound(comboCount) {
        if (!await this.ensureAudioContext()) return;

        const baseFreq = 600;
        const frequency = baseFreq + (comboCount * 100);
        
        this.playTone(frequency, 0.1, 'triangle', this.volume * 0.25);
        
        // 3콤보 시 특별한 효과음
        if (comboCount >= 3) {
            setTimeout(() => {
                this.playTone(frequency * 1.5, 0.08, 'square', this.volume * 0.15);
            }, 50);
        }
    }

    // 버튼 클릭 소리 - 짧은 클릭음
    async playButtonClickSound() {
        if (!await this.ensureAudioContext()) return;

        this.playTone(800, 0.05, 'square', this.volume * 0.2);
    }

    // 기본 톤 생성 헬퍼 함수
    async playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!await this.ensureAudioContext()) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // 효과음 볼륨 설정
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    // 음향 켜기/끄기
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopBGM(); // 음향 끄면 BGM도 중지
        }
    }

    // 전체 음향 설정 (효과음 + BGM)
    setAllSoundsEnabled(enabled) {
        this.setEnabled(enabled);
        this.setBGMEnabled(enabled);
    }

    // 사용자 상호작용으로 오디오 컨텍스트 활성화
    async enableAudio() {
        if (!this.audioContext) return false;
        
        try {
            await this.audioContext.resume();
            return true;
        } catch (error) {
            console.warn('Could not enable audio:', error);
            return false;
        }
    }

    // 🎵 MP3 BGM 시작
    async startBGM() {
        if (!this.bgmEnabled) return;

        try {
            // BGM Audio 객체 생성 (아직 생성되지 않은 경우)
            if (!this.bgmAudio) {
                this.bgmAudio = new Audio('./bgm/action-trap-aggressive-sport-racing-beat-257032.mp3');
                this.bgmAudio.loop = true; // 무한 반복
                this.bgmAudio.volume = this.bgmVolume;
                
                // 로드 에러 처리
                this.bgmAudio.addEventListener('error', (e) => {
                    console.warn('BGM 로드 실패:', e);
                });
            }

            // 이미 재생 중이 아닌 경우에만 재생
            if (this.bgmAudio.paused) {
                await this.bgmAudio.play();
                console.log('🎵 BGM 재생 시작');
            }
        } catch (error) {
            console.warn('BGM 재생 실패:', error);
        }
    }

    // 🎵 BGM 중지
    stopBGM() {
        if (this.bgmAudio && !this.bgmAudio.paused) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0; // 처음부터 다시 시작하도록
            console.log('🎵 BGM 중지');
        }
    }

    // 🎵 BGM 일시정지 (위치 유지)
    pauseBGM() {
        if (this.bgmAudio && !this.bgmAudio.paused) {
            this.bgmAudio.pause();
            console.log('🎵 BGM 일시정지');
        }
    }

    // 🎵 BGM 재개
    async resumeBGM() {
        if (this.bgmAudio && this.bgmAudio.paused && this.bgmEnabled) {
            try {
                await this.bgmAudio.play();
                console.log('🎵 BGM 재개');
            } catch (error) {
                console.warn('BGM 재개 실패:', error);
            }
        }
    }

    // BGM 볼륨 설정
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.bgmVolume;
        }
    }

    // BGM 켜기/끄기
    setBGMEnabled(enabled) {
        this.bgmEnabled = enabled;
        if (!enabled) {
            this.stopBGM();
        }
    }

    // BGM 재생 상태 확인
    isBGMPlaying() {
        return this.bgmAudio && !this.bgmAudio.paused;
    }

    // 정리
    cleanup() {
        this.stopBGM();
        
        // HTML5 Audio 객체 정리
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.removeEventListener('error', () => {});
            this.bgmAudio = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}