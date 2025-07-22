export class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.7;
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

    // 볼륨 설정
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    // 음향 켜기/끄기
    setEnabled(enabled) {
        this.enabled = enabled;
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

    // 정리
    cleanup() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}