export class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.7;
        this.bgmVolume = 0.3; // BGM 전용 볼륨 (효과음보다 낮게)
        this.bgmEnabled = true;
        this.bgmPlaying = false;
        this.bgmNodes = []; // BGM 관련 오디오 노드들
        this.bgmIntervalId = null;
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

    // 🎵 신나는 BGM 시작
    async startBGM() {
        if (!await this.ensureAudioContext() || !this.bgmEnabled || this.bgmPlaying) return;

        this.bgmPlaying = true;
        this.playBGMLoop();
    }

    // 🎵 BGM 중지
    stopBGM() {
        this.bgmPlaying = false;
        
        // 모든 BGM 노드 정리
        this.bgmNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {
                // 이미 정리된 노드 무시
            }
        });
        this.bgmNodes = [];

        if (this.bgmIntervalId) {
            clearInterval(this.bgmIntervalId);
            this.bgmIntervalId = null;
        }
    }

    // 🎵 BGM 루프 재생
    async playBGMLoop() {
        if (!this.bgmPlaying || !await this.ensureAudioContext()) return;

        // 신나는 4/4박자 멜로디 패턴
        const melodyPattern = [
            // 1번째 마디: C Major Scale 기반
            { freq: 523.25, duration: 0.25 }, // C5
            { freq: 659.25, duration: 0.25 }, // E5
            { freq: 783.99, duration: 0.25 }, // G5
            { freq: 1046.50, duration: 0.25 }, // C6
            
            // 2번째 마디: 하강
            { freq: 783.99, duration: 0.25 }, // G5
            { freq: 659.25, duration: 0.25 }, // E5
            { freq: 587.33, duration: 0.25 }, // D5
            { freq: 523.25, duration: 0.25 }, // C5
            
            // 3번째 마디: 점프
            { freq: 698.46, duration: 0.25 }, // F5
            { freq: 880.00, duration: 0.25 }, // A5
            { freq: 783.99, duration: 0.25 }, // G5
            { freq: 659.25, duration: 0.25 }, // E5
            
            // 4번째 마디: 마무리
            { freq: 587.33, duration: 0.25 }, // D5
            { freq: 523.25, duration: 0.5 },  // C5 (길게)
            { freq: 0, duration: 0.25 }       // 쉼표
        ];

        let noteIndex = 0;
        const playNextNote = () => {
            if (!this.bgmPlaying) return;

            const note = melodyPattern[noteIndex];
            
            if (note.freq > 0) {
                this.playBGMNote(note.freq, note.duration);
            }

            noteIndex = (noteIndex + 1) % melodyPattern.length;
            
            // 다음 음표 스케줄링
            setTimeout(playNextNote, note.duration * 1000);
        };

        // 베이스 라인 추가 (낮은 옥타브)
        this.playBGMBass();
        
        // 멜로디 시작
        playNextNote();
    }

    // 🎵 BGM 단일 음표 재생
    async playBGMNote(frequency, duration) {
        if (!await this.ensureAudioContext() || !this.bgmPlaying) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sawtooth'; // 신나는 톤
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.bgmVolume * 0.4, this.audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
        
        this.bgmNodes.push(oscillator);
        this.bgmNodes.push(gainNode);
    }

    // 🎵 BGM 베이스 라인 (리듬감 추가)
    async playBGMBass() {
        if (!await this.ensureAudioContext() || !this.bgmPlaying) return;

        const bassPattern = [
            130.81, // C3
            164.81, // E3
            196.00, // G3
            130.81  // C3
        ];

        let bassIndex = 0;
        const playBassNote = () => {
            if (!this.bgmPlaying) return;

            const frequency = bassPattern[bassIndex];
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.bgmVolume * 0.2, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.4);
            
            this.bgmNodes.push(oscillator);
            this.bgmNodes.push(gainNode);
            
            bassIndex = (bassIndex + 1) % bassPattern.length;
            
            // 0.5초마다 베이스 노트 반복
            setTimeout(playBassNote, 500);
        };

        playBassNote();
    }

    // BGM 볼륨 설정
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
    }

    // BGM 켜기/끄기
    setBGMEnabled(enabled) {
        this.bgmEnabled = enabled;
        if (!enabled && this.bgmPlaying) {
            this.stopBGM();
        }
    }

    // BGM 재생 상태 확인
    isBGMPlaying() {
        return this.bgmPlaying;
    }

    // 정리
    cleanup() {
        this.stopBGM();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}