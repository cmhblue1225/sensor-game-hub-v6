import { MUSIC_TRACKS } from '../shared/config.js';

export class MusicSystem {
    constructor() {
        this.bgMusic = document.getElementById('bgMusic');
        this.musicLoaded = false;
        this.currentTrack = 'electric-storm';
        this.tracks = MUSIC_TRACKS;
    }

    loadTrack(trackId) {
        const track = this.tracks[trackId];
        if (!track) return false;

        this.bgMusic.innerHTML = '';
        
        // 다중 소스 추가로 호환성 향상
        track.sources.forEach(src => {
            const source = document.createElement('source');
            source.src = src;
            source.type = 'audio/mpeg';
            this.bgMusic.appendChild(source);
        });
        
        // 폴백 소스 추가
        const fallbackSource = document.createElement('source');
        fallbackSource.src = track.sources[0];
        fallbackSource.type = 'audio/wav';
        this.bgMusic.appendChild(fallbackSource);
        
        this.bgMusic.load();
        this.currentTrack = trackId;
        
        return new Promise((resolve) => {
            this.bgMusic.addEventListener('canplay', () => {
                this.musicLoaded = true;
                resolve(true);
            }, { once: true });
            
            this.bgMusic.addEventListener('error', () => {
                console.warn(`음악 로드 실패: ${trackId}`);
                this.musicLoaded = false;
                resolve(false);
            }, { once: true });
        });
    }

    setupTrackSelection() {
        // 트랙 선택 옵션 이벤트 설정
        document.querySelectorAll('.track-option').forEach(option => {
            option.addEventListener('click', () => {
                const trackId = option.getAttribute('data-track');
                this.selectTrack(trackId);
            });
        });
    }

    selectTrack(trackId) {
        if (this.tracks[trackId]) {
            this.currentTrack = trackId;
            this.updateTrackDisplay();
            this.loadTrack(trackId);
        }
    }

    updateTrackDisplay() {
        // 모든 옵션에서 selected 클래스 제거
        document.querySelectorAll('.track-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // 현재 선택된 트랙에 selected 클래스 추가
        const selectedOption = document.getElementById(`track-${this.currentTrack}`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }

    getCurrentTrack() {
        const track = this.tracks[this.currentTrack];
        return track;
    }

    getBeatInterval() {
        const track = this.tracks[this.currentTrack];
        return 60 / track.bpm; // BPM을 초 단위로 변환
    }

    play() {
        if (this.musicLoaded && this.bgMusic.paused) {
            this.bgMusic.play().catch(e => {
                console.warn('음악 재생 실패:', e);
            });
        }
    }

    pause() {
        if (!this.bgMusic.paused) {
            this.bgMusic.pause();
        }
    }

    stop() {
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
    }

    getCurrentTime() {
        return this.musicLoaded && !this.bgMusic.paused ? this.bgMusic.currentTime : 0;
    }

    isLoaded() {
        return this.musicLoaded;
    }

    isPlaying() {
        return !this.bgMusic.paused;
    }
}