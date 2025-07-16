class RhythmBladeDual {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        
        // 캔버스 크기 설정
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // ✅ 올바른 SDK 초기화 (dual 타입)
        this.sdk = new SessionSDK({
            gameId: 'rhythm-blade',
            gameType: 'dual',         // dual 타입으로 설정
            debug: true
        });
        
        // 게임 상태
        this.gameState = {
            phase: 'waiting',         // waiting, playing, paused, ended
            score: 0,
            combo: 0,
            maxCombo: 0,             // 최대 콤보 추적
            totalNotes: 0,
            hitNotes: 0,
            startTime: 0,
            endingStartTime: 0        // 게임 종료 시작 시간
        };
        
        // 센서 연결 상태
        this.sensorStatus = {
            sensor1: { connected: false, lastSwing: 0 },
            sensor2: { connected: false, lastSwing: 0 }
        };
        
        // 협력 시스템
        this.cooperation = {
            sync: 100,               // 협력 동기화 수치
            recentHits: [],          // 최근 히트 기록
            cooperationBonus: 1.0    // 협력 보너스 배수
        };
        
        // 🎵 다중 음악 시스템 - 선택 가능한 트랙들
        this.bgMusic = document.getElementById('bgMusic');
        this.musicLoaded = false;
        this.currentTrack = 'electric-storm'; // 기본 선택 트랙
        
        // 🎼 음악 트랙 정보 (10개의 다양한 스타일, 긴 버전)
        this.tracks = {
            'electric-storm': {
                name: 'Electric Storm',
                icon: '⚡',
                description: 'Electronic',
                bpm: 128,
                style: 'energetic',
                duration: 120, // 2분
                sources: [
                    'https://www.bensound.com/bensound-music/bensound-energy.mp3',
                    'https://www.bensound.com/bensound-music/bensound-electroman.mp3',
                    'https://www.bensound.com/bensound-music/bensound-dance.mp3'
                ]
            },
            'neon-nights': {
                name: 'Neon Nights',
                icon: '🌙',
                description: 'Synthwave',
                bpm: 120,
                style: 'atmospheric',
                duration: 105, // 1분 45초
                sources: [
                    'https://www.bensound.com/bensound-music/bensound-retrosoul.mp3',
                    'https://www.bensound.com/bensound-music/bensound-badass.mp3',
                    'https://www.bensound.com/bensound-music/bensound-nightlife.mp3'
                ]
            },
            'cyber-beat': {
                name: 'Cyber Beat',
                icon: '🤖',
                description: 'Techno',
                bpm: 140,
                style: 'intense',
                duration: 110, // 1분 50초
                sources: [
                    'https://www.bensound.com/bensound-music/bensound-dubstep.mp3',
                    'https://www.bensound.com/bensound-music/bensound-house.mp3',
                    'https://www.bensound.com/bensound-music/bensound-electroman.mp3'
                ]
            },
            'space-rhythm': {
                name: 'Space Rhythm',
                icon: '🚀',
                description: 'Ambient',
                bpm: 100,
                style: 'flowing',
                duration: 100, // 1분 40초
                sources: [
                    'https://www.bensound.com/bensound-music/bensound-dreams.mp3',
                    'https://www.bensound.com/bensound-music/bensound-deepblue.mp3',
                    'https://www.bensound.com/bensound-music/bensound-relaxing.mp3'
                ]
            },
            'fire-dance': {
                name: 'Fire Dance',
                icon: '🔥',
                description: 'Drum&Bass',
                bpm: 150,
                style: 'aggressive',
                duration: 95, // 1분 35초
                sources: [
                    'https://www.bensound.com/bensound-music/bensound-punky.mp3',
                    'https://www.bensound.com/bensound-music/bensound-extremeaction.mp3',
                    'https://www.bensound.com/bensound-music/bensound-actionable.mp3'
                ]
            },
            'ocean-waves': {
                name: 'Ocean Waves',
                icon: '🌊',
                description: 'Chill',
                bpm: 90,
                style: 'relaxed',
                duration: 115, // 1분 55초
                sources: [
                    'https://www.bensound.com/bensound-music/bensound-relaxing.mp3',
                    'https://www.bensound.com/bensound-music/bensound-tenderness.mp3',
                    'https://www.bensound.com/bensound-music/bensound-dreams.mp3'
                ]
            },
            'crystal-cave': {
                name: 'Crystal Cave',
                icon: '💎',
                description: 'Progressive',
                bpm: 130,
                style: 'progressive',
                duration: 108, // 1분 48초
                sources: [
                    'https://www.bensound.com/bensound-music/bensound-epic.mp3',
                    'https://www.bensound.com/bensound-music/bensound-adventure.mp3',
                    'https://www.bensound.com/bensound-music/bensound-energy.mp3'
                ]
            },
            'neon-city': {
                name: 'Neon City',
                icon: '🏙️',
                description: 'Retrowave',
                bpm: 110,
                style: 'retro',
                duration: 102, // 1분 42초
                sources: [
                    'https://www.bensound.com/bensound-music/bensound-retrosoul.mp3',
                    'https://www.bensound.com/bensound-music/bensound-nightlife.mp3',
                    'https://www.bensound.com/bensound-music/bensound-badass.mp3'
                ]
            },
            'thunder-storm': {
                name: 'Thunder Storm',
                icon: '⛈️',
                description: 'Hardcore',
                bpm: 160,
                style: 'hardcore',
                duration: 90, // 1분 30초
                sources: [
                    'https://www.bensound.com/bensound-music/bensound-extremeaction.mp3',
                    'https://www.bensound.com/bensound-music/bensound-actionable.mp3',
                    'https://www.bensound.com/bensound-music/bensound-punky.mp3'
                ]
            },
            'starlight': {
                name: 'Starlight',
                icon: '✨',
                description: 'Melodic',
                bpm: 115,
                style: 'melodic',
                duration: 118, // 1분 58초
                sources: [
                    'https://www.bensound.com/bensound-music/bensound-happiness.mp3',
                    'https://www.bensound.com/bensound-music/bensound-memories.mp3',
                    'https://www.bensound.com/bensound-music/bensound-tenderness.mp3'
                ]
            }
        };
        
        this.bpm = this.tracks[this.currentTrack].bpm;
        this.beatInterval = 60 / this.bpm; // 비트 간격 계산
        
        this.initializeMusic();
        
        // Three.js 초기화
        this.initThreeJS();
        
        // 게임 데이터
        this.notes = [];
        this.noteSpawnIndex = 0;
        this.particleEffects = [];
        
        // 🎵 리듬에 맞는 비트맵 (선택된 트랙 기준)
        this.beatmap = this.generateRhythmBeatmap();
        
        this.gameState.totalNotes = this.beatmap.length;
        
        // 🎵 음악 선택 시스템 초기화
        this.setupMusicSelection();
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    initializeMusic() {
        // 🎵 선택된 트랙에 따른 음악 로드
        this.loadTrack(this.currentTrack);
    }
    
    loadTrack(trackId) {
        // 🎵 트랙 정보 가져오기
        const track = this.tracks[trackId];
        if (!track) {
            console.error(`트랙을 찾을 수 없습니다: ${trackId}`);
            return;
        }
        
        // BPM 업데이트
        this.bpm = track.bpm;
        this.beatInterval = 60 / this.bpm;
        
        // 🎵 audio 엘리먼트 소스 업데이트
        this.bgMusic.innerHTML = '';
        track.sources.forEach(src => {
            const source = document.createElement('source');
            source.src = src;
            source.type = 'audio/mpeg';
            this.bgMusic.appendChild(source);
        });
        
        // 최종 폴백 추가
        const fallbackSource = document.createElement('source');
        fallbackSource.src = 'data:audio/wav;base64,UklGRiQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAAA=';
        fallbackSource.type = 'audio/wav';
        this.bgMusic.appendChild(fallbackSource);
        
        // 🎵 음악 설정
        this.bgMusic.volume = 0.6;
        this.bgMusic.currentTime = 0;
        this.musicLoaded = false;
        
        // 음악 로드 완료 이벤트
        this.bgMusic.addEventListener('canplaythrough', () => {
            this.musicLoaded = true;
            console.log(`🎵 ${track.name} 로드 완료`);
        });
        
        // 음악 재생 오류 처리
        this.bgMusic.addEventListener('error', (e) => {
            console.warn(`🎵 ${track.name} 로드 실패, 무음 모드로 진행`);
            this.musicLoaded = false;
        });
        
        // 음악 로드 시도
        this.bgMusic.load();
        
        console.log(`🎵 ${track.name} 트랙 로딩 중...`);
    }
    
    // 🎵 음악 선택 시스템 설정
    setupMusicSelection() {
        // 트랙 옵션 클릭 이벤트 설정
        document.querySelectorAll('.track-option').forEach(option => {
            option.addEventListener('click', () => {
                const trackId = option.getAttribute('data-track');
                this.selectTrack(trackId);
            });
        });
        
        // 초기 선택 상태 설정
        this.updateTrackSelection();
    }
    
    selectTrack(trackId) {
        if (this.gameState.phase === 'playing') {
            console.warn('게임 진행 중에는 트랙을 변경할 수 없습니다.');
            return;
        }
        
        this.currentTrack = trackId;
        
        // 🎵 새 트랙 로드
        this.loadTrack(trackId);
        
        // 🎼 새 비트맵 생성
        this.beatmap = this.generateRhythmBeatmap();
        this.gameState.totalNotes = this.beatmap.length;
        
        // UI 업데이트
        this.updateTrackSelection();
        
        console.log(`🎵 트랙 변경: ${this.tracks[trackId].name}`);
    }
    
    updateTrackSelection() {
        // 모든 트랙 옵션 선택 해제
        document.querySelectorAll('.track-option').forEach(option => {
            option.classList.remove('selected');
            option.querySelector('.track-status').textContent = '';
        });
        
        // 현재 선택된 트랙 강조
        const selectedOption = document.getElementById(`track-${this.currentTrack}`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
            selectedOption.querySelector('.track-status').textContent = '✓';
        }
        
        // 선택된 트랙 정보 업데이트
        const track = this.tracks[this.currentTrack];
        document.getElementById('selectedTrackName').textContent = track.name;
    }
    
    generateRhythmBeatmap() {
        // 🎵 선택된 트랙에 따른 맞춤형 비트맵 생성
        const track = this.tracks[this.currentTrack];
        console.log(`🎼 ${track.name} 비트맵 생성 중...`);
        
        // 🎯 센서 기반 타이밍 최적화 계산
        const SENSOR_DELAY = 0.15; // 150ms 센서 쿨다운
        const SWING_TIME = 0.25; // 250ms 평균 스윙 동작 시간
        const REACTION_BUFFER = 0.1; // 100ms 반응 여유 시간
        const TOTAL_SENSOR_OFFSET = SENSOR_DELAY + SWING_TIME + REACTION_BUFFER; // 500ms 총 오프셋
        
        // BPM에 따른 비트 간격 계산 (센서 최적화)
        const beat = this.beatInterval; // 현재 트랙의 BPM 기준
        const sensorMinInterval = Math.max(beat / 2, TOTAL_SENSOR_OFFSET); // 센서 안전 최소 간격
        const halfBeat = Math.max(beat / 2, sensorMinInterval); // 센서 친화적 하프비트
        const quarterBeat = Math.max(beat / 4, TOTAL_SENSOR_OFFSET * 0.8); // 센서 친화적 쿼터비트
        const doubleBeat = beat * 2; // 여유로운 간격
        
        console.log(`🎯 센서 최적화: 총 오프셋 ${TOTAL_SENSOR_OFFSET * 1000}ms, 최소 간격 ${sensorMinInterval * 1000}ms`);
        
        // 🎼 트랙별 맞춤형 비트맵 생성
        switch (this.currentTrack) {
            case 'electric-storm':
                return this.generateElectricStormBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval);
            case 'neon-nights':
                return this.generateNeonNightsBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval);
            case 'cyber-beat':
                return this.generateCyberBeatBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval);
            case 'space-rhythm':
                return this.generateSpaceRhythmBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval);
            case 'fire-dance':
                return this.generateFireDanceBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval);
            case 'ocean-waves':
                return this.generateOceanWavesBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval);
            case 'crystal-cave':
                return this.generateCrystalCaveBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval);
            case 'neon-city':
                return this.generateNeonCityBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval);
            case 'thunder-storm':
                return this.generateThunderStormBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval);
            case 'starlight':
                return this.generateStarlightBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval);
            default:
                return this.generateDefaultBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval);
        }
    }
    
    generateElectricStormBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval) {
        // ⚡ Electric Storm - 센서 최적화된 전기적 패턴 (2분, 강렬하지만 플레이 가능한)
        const beatmap = [];
        const track = this.tracks[this.currentTrack];
        const targetDuration = track.duration; // 120초
        
        // 🎯 센서 최적화된 간격 계산
        const safeBeat = Math.max(beat, sensorMinInterval); // 센서 안전 간격
        const sensorFriendlyInterval = Math.max(halfBeat, sensorMinInterval * 1.2); // 연속 타격 안전 간격
        
        // ⚡ Phase 1: 전기적 시작 - 센서 친화적 번개 패턴 (0-25초)
        let currentTime = 0;
        for (let i = 0; i < 28; i++) { // 32->28로 줄여서 여유 확보
            currentTime += (i % 3 === 2) ? sensorFriendlyInterval : safeBeat; // 매 3번째마다 여유 간격
            
            if (i % 7 === 6) { // 6->7로 늘려서 협력 빈도 줄임
                beatmap.push({ time: currentTime, lane: "both", type: "cooperation" });
            } else {
                beatmap.push({ time: currentTime, lane: i % 2 === 0 ? "sensor1" : "sensor2", type: "normal" });
            }
        }
        
        // ⚡ Phase 2: 전기 방전 구간 - 센서 친화적 지그재그 패턴
        const phase2Start = currentTime + doubleBeat; // 충분한 쉼 제공
        currentTime = phase2Start;
        for (let i = 0; i < 24; i++) { // 32->24로 줄여서 난이도 조절
            currentTime += (i % 4 === 3) ? sensorFriendlyInterval : safeBeat; // 매 4번째마다 여유
            
            const pattern = i % 6; // 5->6으로 늘려서 협력 빈도 줄임
            if (pattern === 5) {
                beatmap.push({ time: currentTime, lane: "both", type: "cooperation" });
            } else if (pattern < 3) {
                beatmap.push({ time: currentTime, lane: "sensor1", type: "normal" });
            } else {
                beatmap.push({ time: currentTime, lane: "sensor2", type: "normal" });
            }
        }
        
        // ⚡ Phase 3: 전기 폭풍 중반 - 센서 친화적 협력 강화
        currentTime += doubleBeat; // 페이즈 간 쉼
        for (let i = 0; i < 28; i++) { // 38->28로 줄임
            currentTime += (i % 5 === 4) ? doubleBeat : sensorFriendlyInterval; // 더 넉넉한 간격
            
            if (i % 5 === 4) { // 협력 빈도 증가하지만 안전한 간격
                beatmap.push({ time: currentTime, lane: "both", type: "cooperation" });
            } else if (i % 3 === 0) {
                beatmap.push({ time: currentTime, lane: "sensor1", type: "normal" });
            } else {
                beatmap.push({ time: currentTime, lane: "sensor2", type: "normal" });
            }
        }
        
        // ⚡ Phase 4: 번개 연쇄 반응 - 센서 친화적 클라이맥스
        currentTime += doubleBeat * 1.5; // 충분한 쉼
        for (let i = 0; i < 20; i++) { // 32->20으로 줄임
            currentTime += (i % 6 === 5) ? doubleBeat : sensorFriendlyInterval;
            
            const pattern = i % 8; // 7->8로 늘려서 협력 빈도 조절
            if (pattern === 7) {
                beatmap.push({ time: currentTime, lane: "both", type: "cooperation" });
            } else if (pattern < 4) {
                beatmap.push({ time: currentTime, lane: "sensor1", type: "normal" });
            } else {
                beatmap.push({ time: currentTime, lane: "sensor2", type: "normal" });
            }
        }
        
        // ⚡ Phase 5: 최종 전기 폭발 - 센서 친화적 마무리
        currentTime += doubleBeat * 2; // 최종 준비 시간
        for (let i = 0; i < 12; i++) { // 18->12로 줄임
            currentTime += (i < 4) ? doubleBeat : sensorFriendlyInterval; // 처음 몇 개는 여유롭게
            
            if (i < 4) { // 처음 4개는 협력으로 시작
                beatmap.push({ time: currentTime, lane: "both", type: "cooperation" });
            } else if (i < 8) {
                beatmap.push({ time: currentTime, lane: i % 2 === 0 ? "sensor1" : "sensor2", type: "normal" });
            } else {
                beatmap.push({ time: currentTime, lane: "both", type: "cooperation" }); // 마지막은 협력으로
            }
        }
        
        const totalDuration = (currentTime / 60).toFixed(1);
        console.log(`⚡ Electric Storm 센서 최적화 비트맵: ${beatmap.length}개 노트, ${totalDuration}분, 최종 시간: ${currentTime.toFixed(1)}초`);
        return beatmap;
    }
    
    generateNeonNightsBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval) {
        // 🌙 Neon Nights - 몽환적이고 신스웨이브한 패턴 (1분 45초)
        const beatmap = [];
        const track = this.tracks[this.currentTrack];
        const targetDuration = track.duration; // 105초
        
        // 🌙 Phase 1: 네온 시작 - 부드럽고 몽환적 (0-26초)
        for (let i = 0; i < 35; i++) {
            const time = beat * (i + 1);
            const pattern = i % 7; // 7박자 신스웨이브 패턴
            if (pattern === 6) {
                beatmap.push({ time: time, lane: "both", type: "cooperation" });
            } else if (pattern < 3) {
                beatmap.push({ time: time, lane: "sensor1", type: "normal" });
            } else {
                beatmap.push({ time: time, lane: "sensor2", type: "normal" });
            }
        }
        
        // 🌙 Phase 2: 신스웨이브 드롭 - 웨이브 패턴 (26-52초)
        const phase2Start = beat * 36;
        for (let i = 0; i < 35; i++) {
            const time = phase2Start + beat * i;
            const pattern = i % 8;
            if (pattern === 7) {
                beatmap.push({ time: time, lane: "both", type: "cooperation" });
            } else if (pattern % 2 === 0) {
                beatmap.push({ time: time, lane: "sensor1", type: "normal" });
            } else {
                beatmap.push({ time: time, lane: "sensor2", type: "normal" });
            }
        }
        
        // 🌙 Phase 3: 네온 클라이맥스 - 색깔 폭발 (52-78초)
        const phase3Start = beat * 72;
        for (let i = 0; i < 35; i++) {
            const time = phase3Start + beat * i;
            const pattern = i % 6;
            if (pattern === 5) {
                beatmap.push({ time: time, lane: "both", type: "cooperation" });
            } else if (pattern < 3) {
                beatmap.push({ time: time, lane: "sensor1", type: "normal" });
            } else {
                beatmap.push({ time: time, lane: "sensor2", type: "normal" });
            }
        }
        
        // 🌙 Phase 4: 네온 페이드아웃 - 몽환적 마무리 (78-105초)
        const phase4Start = beat * 108;
        for (let i = 0; i < 30; i++) {
            const time = phase4Start + beat * i;
            const pattern = i % 9;
            if (pattern === 8) {
                beatmap.push({ time: time, lane: "both", type: "cooperation" });
            } else if (pattern < 4) {
                beatmap.push({ time: time, lane: "sensor1", type: "normal" });
            } else {
                beatmap.push({ time: time, lane: "sensor2", type: "normal" });
            }
        }
        
        const totalDuration = (phase4Start + beat * 29).toFixed(1);
        console.log(`🌙 Neon Nights 비트맵: ${beatmap.length}개 노트, ${totalDuration}초, 목표: ${targetDuration}초`);
        return beatmap;
    }
    
    generateCyberBeatBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval) {
        // 🤖 Cyber Beat - 센서 최적화된 테크노 패턴 (1분 50초, BPM 140, 빠른 곡이므로 센서 안전성 강화)
        const beatmap = [];
        const track = this.tracks[this.currentTrack];
        const targetDuration = track.duration; // 110초
        
        // 🎯 빠른 BPM에 대한 센서 안전 간격 (140 BPM = 0.43초/비트이므로 더 보수적으로)
        const fastBpmSafeBeat = Math.max(beat * 1.2, sensorMinInterval); // 20% 더 여유롭게
        const fastBpmInterval = Math.max(halfBeat * 1.5, sensorMinInterval * 1.4); // 연속 타격은 더욱 안전하게
        
        // 🤖 Phase 1: 사이버 시작 - 센서 친화적 기계 패턴
        let currentTime = 0;
        for (let i = 0; i < 24; i++) { // 30->24로 줄임 (빠른 BPM 대응)
            currentTime += (i % 4 === 3) ? fastBpmInterval * 1.5 : fastBpmSafeBeat; // 더 넉넉한 간격
            
            if (i % 10 === 9) { // 8->10으로 늘려서 협력 빈도 줄임
                beatmap.push({ time: currentTime, lane: "both", type: "cooperation" });
            } else {
                beatmap.push({ time: currentTime, lane: i % 2 === 0 ? "sensor1" : "sensor2", type: "normal" });
            }
        }
        
        // 🤖 Phase 2: 테크노 드롭 - 센서 안전 협력 패턴
        currentTime += doubleBeat; // 페이즈 간 충분한 쉼
        for (let i = 0; i < 20; i++) { // 30->20으로 줄임
            currentTime += (i % 5 === 4) ? fastBpmInterval * 2 : fastBpmSafeBeat; // 더 넉넉한 간격
            
            if (i % 8 === 7) { // 6->8로 늘려서 협력 빈도 줄임
                beatmap.push({ time: currentTime, lane: "both", type: "cooperation" });
            } else if (i % 4 === 0) { // 3->4로 늘려서 패턴 단순화
                beatmap.push({ time: currentTime, lane: "sensor1", type: "normal" });
            } else {
                beatmap.push({ time: currentTime, lane: "sensor2", type: "normal" });
            }
        }
        
        // 🤖 Phase 3: 기계 리듬 - 센서 친화적 단순 패턴
        currentTime += doubleBeat * 1.5; // 더 긴 쉼
        for (let i = 0; i < 30; i++) { // 45->30으로 줄임
            currentTime += (i % 6 === 5) ? fastBpmInterval * 2 : fastBpmSafeBeat;
            
            const pattern = i % 12; // 9->12로 늘려서 협력 빈도 더 줄임
            if (pattern === 11) {
                beatmap.push({ time: currentTime, lane: "both", type: "cooperation" });
            } else if (pattern < 6) {
                beatmap.push({ time: currentTime, lane: "sensor1", type: "normal" });
            } else {
                beatmap.push({ time: currentTime, lane: "sensor2", type: "normal" });
            }
        }
        
        // 🤖 Phase 4: 기계적 마무리 - 센서 친화적 교대
        currentTime += doubleBeat * 2; // 최종 준비 시간
        for (let i = 0; i < 15; i++) { // 45->15로 대폭 줄임
            currentTime += (i % 3 === 2) ? fastBpmInterval * 2 : fastBpmSafeBeat;
            
            if (i % 7 === 6) { // 5->7로 늘려서 협력 빈도 줄임
                beatmap.push({ time: currentTime, lane: "both", type: "cooperation" });
            } else {
                beatmap.push({ time: currentTime, lane: i % 2 === 0 ? "sensor1" : "sensor2", type: "normal" });
            }
        }
        
        console.log(`🤖 Cyber Beat 센서 최적화 비트맵: ${beatmap.length}개 노트, 최종 시간: ${currentTime.toFixed(1)}초 (빠른 BPM 대응)`);
        return beatmap;
    }
    
    generateSpaceRhythmBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval) {
        // 🚀 Space Rhythm - 궤도와 중력장 패턴 (1분 40초, BPM 100)
        const beatmap = [];
        const track = this.tracks[this.currentTrack];
        const targetDuration = track.duration; // 100초
        
        // 🚀 Orbital Mechanics 시스템 - 태양계 궤도 시뮬레이션
        let currentTime = 0;
        let planetCount = 0;
        
        while (currentTime < targetDuration) {
            planetCount++;
            const orbitRadius = 2 + (planetCount % 4); // 2-5비트 궤도 반지름
            const orbitSpeed = 1.0 + (planetCount % 3) * 0.3; // 1.0-1.9 궤도 속도
            
            // 🚀 Planetary Orbit (행성 궤도) - 원형 운동
            const pointsInOrbit = Math.floor(orbitRadius * 4); // 궤도당 포인트 수
            for (let i = 0; i < pointsInOrbit; i++) {
                const angle = (i / pointsInOrbit) * 2 * Math.PI; // 0 to 2π
                const orbitalTime = currentTime + (i * orbitSpeed * beat);
                
                // 사인/코사인으로 좌우 선택 (원형 궤도)
                const x = Math.cos(angle);
                const lane = x > 0 ? "sensor1" : "sensor2";
                
                // 특별한 위치에서는 협력 (태양 접근시)
                if (Math.abs(angle - Math.PI) < 0.5 || Math.abs(angle) < 0.5) {
                    beatmap.push({ time: orbitalTime, lane: "both", type: "cooperation" });
                } else {
                    beatmap.push({ time: orbitalTime, lane: lane, type: "normal" });
                }
            }
            
            currentTime += orbitSpeed * beat * pointsInOrbit;
            
            // 🚀 Gravitational Pull (중력 끌림) - 가끔 중심으로 끌려들어감
            if (planetCount % 3 === 0 && currentTime < targetDuration) {
                // 중력장 효과 - 양쪽에서 중심으로 수렴
                for (let g = 0; g < 4; g++) {
                    const gravTime = currentTime + beat * g * 0.7;
                    if (g === 3) {
                        // 마지막은 중심에서 만남
                        beatmap.push({ time: gravTime, lane: "both", type: "cooperation" });
                    } else {
                        // 점점 중심으로 수렴
                        const lane = g % 2 === 0 ? "sensor1" : "sensor2";
                        beatmap.push({ time: gravTime, lane: lane, type: "normal" });
                    }
                }
                currentTime += beat * 3;
            }
            
            // 🚀 Asteroid Belt (소행성대) - 불규칙한 작은 충돌
            if (Math.random() > 0.6 && currentTime < targetDuration - beat * 2) {
                const asteroidCount = 2 + Math.floor(Math.random() * 3); // 2-4개
                for (let a = 0; a < asteroidCount; a++) {
                    const asteroidTime = currentTime + beat * a * 0.5;
                    const lane = Math.random() > 0.5 ? "sensor1" : "sensor2";
                    beatmap.push({ time: asteroidTime, lane: lane, type: "normal" });
                }
                currentTime += beat * 2;
            }
        }
        
        console.log(`🚀 Space Rhythm 비트맵: ${beatmap.length}개 노트 (궤도 역학), ${(currentTime / beat).toFixed(1)}비트`);
        return beatmap;
    }
    
    generateFireDanceBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval) {
        // 🔥 Fire Dance - 불꽃처럼 폭발적이고 예측불가한 패턴 (1분 35초, BPM 150)
        const beatmap = [];
        const track = this.tracks[this.currentTrack];
        const targetDuration = track.duration; // 95초
        
        // 🔥 Fire Burst 시스템 - 강렬한 폭발 + 잠깐의 정적
        let currentTime = 0;
        const burstInterval = beat * 8; // 8비트마다 폭발
        
        while (currentTime < targetDuration) {
            // 🔥 화염 폭발 구간 (3-5개 빠른 연타)
            const burstSize = 3 + Math.floor(Math.random() * 3); // 3-5개 랜덤
            for (let i = 0; i < burstSize; i++) {
                const burstTime = currentTime + (beat * 0.6 * i); // 빠른 연타
                
                if (i === burstSize - 1) {
                    // 마지막은 협력으로 폭발 피날레
                    beatmap.push({ time: burstTime, lane: "both", type: "cooperation" });
                } else if (Math.random() > 0.7) {
                    // 30% 확률로 예상치 못한 협력
                    beatmap.push({ time: burstTime, lane: "both", type: "cooperation" });
                } else {
                    // 좌우 교대하는 기본 화염
                    const lane = i % 2 === 0 ? "sensor1" : "sensor2";
                    beatmap.push({ time: burstTime, lane: lane, type: "normal" });
                }
            }
            
            // 🔥 불꽃 여운 - 잠깐의 정적 후 작은 불씨
            currentTime += burstInterval;
            if (currentTime < targetDuration - beat * 2) {
                // 작은 불씨 (랜덤 위치)
                const emberTime = currentTime - beat * 2;
                const emberLane = Math.random() > 0.5 ? "sensor1" : "sensor2";
                beatmap.push({ time: emberTime, lane: emberLane, type: "normal" });
            }
        }
        
        console.log(`🔥 Fire Dance 비트맵: ${beatmap.length}개 노트 (폭발적 패턴), ${(currentTime / beat).toFixed(1)}비트`);
        return beatmap;
    }
    
    generateOceanWavesBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval) {
        // 🌊 Ocean Waves - 파도처럼 밀려오고 잦아드는 자연스러운 패턴 (1분 55초, BPM 90)
        const beatmap = [];
        const track = this.tracks[this.currentTrack];
        const targetDuration = track.duration; // 115초
        
        // 🌊 Wave Cycle 시스템 - 밀려오기 + 피크 + 잦아들기
        let currentTime = 0;
        const waveLength = beat * 16; // 16비트 = 한 파도 사이클
        
        while (currentTime < targetDuration) {
            // 🌊 Wave Build-up (밀려오기) - 점점 빨라짐
            for (let i = 0; i < 6; i++) {
                const buildTime = currentTime + (beat * (2 - i * 0.2)); // 점점 빨라짐
                const lane = i % 2 === 0 ? "sensor1" : "sensor2";
                beatmap.push({ time: currentTime + beat * (i + 1) * 1.5, lane: lane, type: "normal" });
            }
            
            // 🌊 Wave Peak (파도 정점) - 협력 타격
            beatmap.push({ time: currentTime + beat * 10, lane: "both", type: "cooperation" });
            
            // 🌊 Wave Crash (파도 충돌) - 빠른 교대
            for (let i = 0; i < 4; i++) {
                const crashTime = currentTime + beat * (11 + i * 0.7);
                const lane = i % 2 === 0 ? "sensor2" : "sensor1"; // 역순으로
                beatmap.push({ time: crashTime, lane: lane, type: "normal" });
            }
            
            // 🌊 Wave Retreat (파도 퇴조) - 점점 느려짐
            beatmap.push({ time: currentTime + beat * 15, lane: "sensor1", type: "normal" });
            beatmap.push({ time: currentTime + beat * 16.5, lane: "sensor2", type: "normal" });
            
            currentTime += waveLength;
            
            // 🌊 Calm Period (잔잔한 구간) - 가끔 작은 물결
            if (currentTime < targetDuration && Math.random() > 0.6) {
                const rippleTime = currentTime - beat * 2;
                const rippleLane = Math.random() > 0.5 ? "sensor1" : "sensor2";
                beatmap.push({ time: rippleTime, lane: rippleLane, type: "normal" });
            }
        }
        
        console.log(`🌊 Ocean Waves 비트맵: ${beatmap.length}개 노트 (파도 사이클), ${(currentTime / beat).toFixed(1)}비트`);
        return beatmap;
    }
    
    generateCrystalCaveBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval) {
        // 💎 Crystal Cave - 기하학적 크리스탈 성장 패턴 (1분 48초, BPM 130)
        const beatmap = [];
        const track = this.tracks[this.currentTrack];
        const targetDuration = track.duration; // 108초
        
        // 💎 Crystal Formation 시스템 - 피보나치 수열 기반 성장
        let currentTime = 0;
        let fibA = 1, fibB = 1; // 피보나치 시작
        
        while (currentTime < targetDuration) {
            // 💎 Crystal Nucleus (핵 생성) - 작은 시작
            beatmap.push({ time: currentTime, lane: "sensor1", type: "normal" });
            beatmap.push({ time: currentTime + beat * 0.5, lane: "sensor2", type: "normal" });
            
            // 💎 Crystal Growth (성장) - 피보나치 패턴
            const nextFib = fibA + fibB;
            const growthPhases = Math.min(nextFib, 8); // 최대 8단계
            
            for (let i = 0; i < growthPhases; i++) {
                const growthTime = currentTime + beat * (1 + i * 0.7);
                
                // 대칭적 크리스탈 성장
                if (i % 3 === 2) {
                    // 3의 배수마다 중심축 (협력)
                    beatmap.push({ time: growthTime, lane: "both", type: "cooperation" });
                } else {
                    // 대칭적 성장
                    const isLeftSide = (i + currentTime / beat) % 2 === 0;
                    const lane = isLeftSide ? "sensor1" : "sensor2";
                    beatmap.push({ time: growthTime, lane: lane, type: "normal" });
                }
            }
            
            // 💎 Crystal Resonance (공명) - 하모닉 패턴
            const resonanceTime = currentTime + beat * (growthPhases + 1);
            beatmap.push({ time: resonanceTime, lane: "both", type: "cooperation" });
            
            // 💎 Crystal Stabilization (안정화) - 점점 느려지는 마무리
            beatmap.push({ time: resonanceTime + beat * 1.5, lane: "sensor2", type: "normal" });
            beatmap.push({ time: resonanceTime + beat * 2.2, lane: "sensor1", type: "normal" });
            
            // 다음 크리스탈 사이클로
            currentTime += beat * (growthPhases + 4);
            fibA = fibB;
            fibB = nextFib;
            
            // 피보나치가 너무 커지면 리셋
            if (fibB > 13) {
                fibA = 1;
                fibB = 1;
            }
        }
        
        console.log(`💎 Crystal Cave 비트맵: ${beatmap.length}개 노트 (기하학적 성장), ${(currentTime / beat).toFixed(1)}비트`);
        return beatmap;
    }
    
    generateNeonCityBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval) {
        // 🏙️ Neon City - 도시의 네온사인 점멸 패턴 (1분 42초, BPM 110)
        const beatmap = [];
        const track = this.tracks[this.currentTrack];
        const targetDuration = track.duration; // 102초
        
        // 🏙️ Urban Grid 시스템 - 도시 블록별 네온 점멸
        let currentTime = 0;
        const blockSize = beat * 12; // 12비트 = 한 도시 블록
        
        while (currentTime < targetDuration) {
            // 🏙️ Neon Sign Sequence (네온사인 순차 점등)
            // 왼쪽 건물들
            beatmap.push({ time: currentTime + beat * 1, lane: "sensor1", type: "normal" });
            beatmap.push({ time: currentTime + beat * 2.5, lane: "sensor1", type: "normal" });
            beatmap.push({ time: currentTime + beat * 4, lane: "sensor1", type: "normal" });
            
            // 🏙️ Traffic Light (신호등) - 중앙 협력
            beatmap.push({ time: currentTime + beat * 6, lane: "both", type: "cooperation" });
            
            // 🏙️ Right Side Buildings (오른쪽 건물들)
            beatmap.push({ time: currentTime + beat * 7.5, lane: "sensor2", type: "normal" });
            beatmap.push({ time: currentTime + beat * 9, lane: "sensor2", type: "normal" });
            beatmap.push({ time: currentTime + beat * 10.5, lane: "sensor2", type: "normal" });
            
            // 🏙️ City Pulse (도시 맥박) - 전체 동기화
            if (Math.random() > 0.3) { // 70% 확률
                beatmap.push({ time: currentTime + beat * 11.5, lane: "both", type: "cooperation" });
            }
            
            currentTime += blockSize;
            
            // 🏙️ Advertising Flicker (광고 깜빡임) - 랜덤 간섭
            if (currentTime < targetDuration && Math.random() > 0.5) {
                const flickerTime = currentTime - beat * 1;
                const flickerLane = Math.random() > 0.6 ? "both" : (Math.random() > 0.5 ? "sensor1" : "sensor2");
                const flickerType = flickerLane === "both" ? "cooperation" : "normal";
                beatmap.push({ time: flickerTime, lane: flickerLane, type: flickerType });
            }
        }
        
        console.log(`🏙️ Neon City 비트맵: ${beatmap.length}개 노트 (도시 그리드), ${(currentTime / beat).toFixed(1)}비트`);
        return beatmap;
    }
    
    generateThunderStormBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval) {
        // ⛈️ Thunder Storm - 예측불가한 번개와 천둥 패턴 (1분 30초, BPM 160)
        const beatmap = [];
        const track = this.tracks[this.currentTrack];
        const targetDuration = track.duration; // 90초
        
        // ⛈️ Lightning Storm 시스템 - 랜덤 번개 + 천둥 굉음
        let currentTime = 0;
        
        while (currentTime < targetDuration) {
            // ⛈️ Lightning Strike (번개 공격) - 완전 랜덤
            const strikeDuration = beat * (3 + Math.random() * 4); // 3-7비트 구간
            const strikeEnd = currentTime + strikeDuration;
            
            // 번개는 예측불가능하게 등장
            const strikeCount = 2 + Math.floor(Math.random() * 5); // 2-6번
            for (let i = 0; i < strikeCount; i++) {
                const strikeTime = currentTime + (Math.random() * strikeDuration);
                const intensity = Math.random();
                
                if (intensity > 0.8) {
                    // 20% - 강력한 번개 (협력 필요)
                    beatmap.push({ time: strikeTime, lane: "both", type: "cooperation" });
                } else if (intensity > 0.4) {
                    // 40% - 일반 번개
                    const lane = Math.random() > 0.5 ? "sensor1" : "sensor2";
                    beatmap.push({ time: strikeTime, lane: lane, type: "normal" });
                }
                // 40% - 번개 없음 (정적)
            }
            
            currentTime = strikeEnd;
            
            // ⛈️ Thunder Rumble (천둥 굉음) - 느린 진동
            if (currentTime < targetDuration) {
                const rumbleDuration = beat * (2 + Math.random() * 3); // 2-5비트
                const rumbleEnd = currentTime + rumbleDuration;
                
                // 천둥은 규칙적인 진동
                let rumbleTime = currentTime;
                let rumbleIndex = 0;
                while (rumbleTime < rumbleEnd && rumbleTime < targetDuration) {
                    const lane = rumbleIndex % 3 === 2 ? "both" : (rumbleIndex % 2 === 0 ? "sensor1" : "sensor2");
                    const type = lane === "both" ? "cooperation" : "normal";
                    
                    beatmap.push({ time: rumbleTime, lane: lane, type: type });
                    rumbleTime += beat * (0.8 + Math.random() * 0.4); // 0.8-1.2비트 간격
                    rumbleIndex++;
                }
                
                currentTime = rumbleEnd;
            }
            
            // ⛈️ Eye of Storm (폭풍의 눈) - 잠깐의 정적
            if (Math.random() > 0.7 && currentTime < targetDuration - beat * 2) {
                currentTime += beat * (1 + Math.random() * 2); // 1-3비트 정적
            }
        }
        
        console.log(`⛈️ Thunder Storm 비트맵: ${beatmap.length}개 노트 (번개 폭풍), ${(currentTime / beat).toFixed(1)}비트`);
        return beatmap;
    }
    
    generateStarlightBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval) {
        // ✨ Starlight - 별자리와 별 깜빡임 패턴 (1분 58초, BPM 115)
        const beatmap = [];
        const track = this.tracks[this.currentTrack];
        const targetDuration = track.duration; // 118초
        
        // ✨ Constellation 시스템 - 별자리 모양 + 별 깜빡임
        let currentTime = 0;
        const constellations = [
            // 북두칠성 패턴
            [0, 1.5, 3, 4.2, 5.8, 7.5, 9],
            // 오리온자리 패턴  
            [0, 1, 2.5, 4, 5, 6.5, 8, 9.5],
            // 카시오페아 패턴
            [0, 2, 3.5, 5.5, 7],
            // 백조자리 패턴
            [0, 1.8, 3.2, 5, 6.8, 8.5]
        ];
        
        let constellationIndex = 0;
        
        while (currentTime < targetDuration) {
            const constellation = constellations[constellationIndex % constellations.length];
            
            // ✨ Constellation Drawing (별자리 그리기)
            for (let i = 0; i < constellation.length; i++) {
                const starTime = currentTime + beat * constellation[i];
                
                // 첫 번째와 마지막 별은 협력으로 특별하게
                if (i === 0 || i === constellation.length - 1) {
                    beatmap.push({ time: starTime, lane: "both", type: "cooperation" });
                } else {
                    // 별자리 좌우 균형
                    const lane = i % 2 === 0 ? "sensor1" : "sensor2";
                    beatmap.push({ time: starTime, lane: lane, type: "normal" });
                }
            }
            
            currentTime += beat * (constellation[constellation.length - 1] + 2);
            
            // ✨ Twinkling Stars (별 깜빡임) - 별자리 사이의 작은 별들
            const twinkleEnd = currentTime + beat * 6;
            while (currentTime < twinkleEnd && currentTime < targetDuration) {
                // 별 깜빡임은 랜덤하고 희소
                if (Math.random() > 0.6) { // 40% 확률
                    const twinkleLane = Math.random() > 0.7 ? "both" : (Math.random() > 0.5 ? "sensor1" : "sensor2");
                    const twinkleType = twinkleLane === "both" ? "cooperation" : "normal";
                    beatmap.push({ time: currentTime, lane: twinkleLane, type: twinkleType });
                }
                currentTime += beat * (1.2 + Math.random() * 0.8); // 1.2-2.0비트 간격
            }
            
            // ✨ Shooting Star (유성) - 가끔 빠른 연속 타격
            if (Math.random() > 0.7 && currentTime < targetDuration - beat * 3) {
                for (let j = 0; j < 3; j++) {
                    const shootTime = currentTime + beat * j * 0.4; // 빠른 연속
                    const lane = j === 2 ? "both" : (j % 2 === 0 ? "sensor1" : "sensor2");
                    const type = lane === "both" ? "cooperation" : "normal";
                    beatmap.push({ time: shootTime, lane: lane, type: type });
                }
                currentTime += beat * 2;
            }
            
            constellationIndex++;
        }
        
        console.log(`✨ Starlight 비트맵: ${beatmap.length}개 노트 (별자리 패턴), ${(currentTime / beat).toFixed(1)}비트`);
        return beatmap;
    }
    
    generateDefaultBeatmap(beat, halfBeat, doubleBeat, sensorMinInterval) {
        // 🎵 기본 패턴 (fallback)
        const beatmap = [];
        
        // 간단한 기본 패턴
        for (let i = 0; i < 20; i++) {
            const time = beat * (i + 1);
            const pattern = i % 4;
            
            if (pattern === 0) {
                beatmap.push({ time: time, lane: "sensor1", type: "normal" });
            } else if (pattern === 1) {
                beatmap.push({ time: time, lane: "sensor2", type: "normal" });
            } else if (pattern === 2) {
                beatmap.push({ time: time, lane: "sensor1", type: "normal" });
            } else {
                beatmap.push({ time: time, lane: "both", type: "cooperation" });
            }
        }
        
        console.log(`🎵 기본 비트맵: ${beatmap.length}개 노트`);
        return beatmap;
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
        if (this.camera) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
    }
    
    initThreeJS() {
        // Scene 설정
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0f172a, 10, 50);
        
        // Camera 설정
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer 설정
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x0f172a);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 조명 설정
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // 세이버 생성 (dual용)
        this.sabers = {
            sensor1: this.createSaber(0xff0000, -2),    // 빨간색, 왼쪽
            sensor2: this.createSaber(0x0000ff, 2)      // 파란색, 오른쪽
        };
        
        this.scene.add(this.sabers.sensor1);
        this.scene.add(this.sabers.sensor2);
        
        // 배경 환경 생성
        this.createEnvironment();
        
        // ✅ 탭소닉 스타일 가이드라인 시스템 추가
        this.createTimingGuidelines();
    }
    
    createSaber(color, xPosition) {
        const saberGroup = new THREE.Group();
        
        // 세이버 손잡이
        const hiltGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.6, 8);
        const hiltMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2
        });
        const hilt = new THREE.Mesh(hiltGeometry, hiltMaterial);
        hilt.position.y = -0.3;
        
        // 세이버 날
        const bladeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
        const bladeMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 1;
        
        // 세이버 광선 효과
        const glowGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 1;
        
        saberGroup.add(hilt);
        saberGroup.add(blade);
        saberGroup.add(glow);
        
        saberGroup.position.set(xPosition, 1.5, 3);
        saberGroup.rotation.x = THREE.MathUtils.degToRad(-15);
        
        saberGroup.userData = { 
            swinging: false, 
            swingTime: 0,
            sensorId: xPosition < 0 ? 'sensor1' : 'sensor2'
        };
        
        return saberGroup;
    }
    
    createEnvironment() {
        // 바닥
        const floorGeometry = new THREE.PlaneGeometry(20, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1e293b,
            transparent: true,
            opacity: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // 사이드 벽
        for (let i = 0; i < 2; i++) {
            const wallGeometry = new THREE.PlaneGeometry(50, 10);
            const wallMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x334155,
                transparent: true,
                opacity: 0.5
            });
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(i === 0 ? -10 : 10, 4, 0);
            wall.rotation.y = i === 0 ? Math.PI / 2 : -Math.PI / 2;
            this.scene.add(wall);
        }
    }
    
    // ✅ 탭소닉 스타일 바닥 가이드라인 시스템 (노트 가시성 개선)
    createTimingGuidelines() {
        this.timingGuidelines = {
            sensor1: null,    // 왼쪽 빨간 가이드라인
            sensor2: null,    // 오른쪽 파란 가이드라인
            cooperation: null // 중앙 보라색 가이드라인
        };
        
        // 왼쪽 세이버용 빨간 가이드라인 (바닥)
        this.timingGuidelines.sensor1 = this.createFloorGuideline(-2, 0xff0000, 'sensor1');
        this.scene.add(this.timingGuidelines.sensor1);
        
        // 오른쪽 세이버용 파란 가이드라인 (바닥)
        this.timingGuidelines.sensor2 = this.createFloorGuideline(2, 0x0000ff, 'sensor2');
        this.scene.add(this.timingGuidelines.sensor2);
        
        // 협력 노트용 보라색 가이드라인 (중앙 바닥)
        this.timingGuidelines.cooperation = this.createFloorGuideline(0, 0x8b5cf6, 'cooperation');
        this.scene.add(this.timingGuidelines.cooperation);
        
        console.log('🎯 탭소닉 스타일 바닥 가이드라인 생성 완료 - 노트 가시성 향상');
    }
    
    // ✅ 바닥 가이드라인 생성 (탭소닉 스타일로 노트 가시성 향상)
    createFloorGuideline(xPosition, color, type) {
        const guidelineGroup = new THREE.Group();
        
        // 바닥 타격 지점 (직사각형 패드)
        const hitZoneGeometry = new THREE.PlaneGeometry(1.5, 3);
        const hitZoneMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const hitZone = new THREE.Mesh(hitZoneGeometry, hitZoneMaterial);
        hitZone.rotation.x = -Math.PI / 2; // 바닥에 평행하게
        hitZone.position.set(0, -0.8, 3.5); // 바닥 위치
        hitZone.userData = { originalOpacity: 0.4 };
        
        // 타격 지점 중앙 원형 인디케이터
        const centerCircleGeometry = new THREE.CircleGeometry(0.6, 16);
        const centerCircleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const centerCircle = new THREE.Mesh(centerCircleGeometry, centerCircleMaterial);
        centerCircle.rotation.x = -Math.PI / 2;
        centerCircle.position.set(0, -0.75, 3.5); // 바닥보다 살짝 위
        centerCircle.userData = { originalOpacity: 0.8, pulsePhase: 0 };
        
        // 가이드라인 경계선 (앞뒤)
        for (let i = 0; i < 2; i++) {
            const borderGeometry = new THREE.PlaneGeometry(1.5, 0.1);
            const borderMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            const border = new THREE.Mesh(borderGeometry, borderMaterial);
            border.rotation.x = -Math.PI / 2;
            border.position.set(0, -0.7, 3.5 + (i === 0 ? -1.5 : 1.5));
            border.userData = { originalOpacity: 0.9 };
            
            guidelineGroup.add(border);
        }
        
        // 노트 트랙 라인 (길게 뻗은 가이드)
        const trackGeometry = new THREE.PlaneGeometry(0.8, 40);
        const trackMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const track = new THREE.Mesh(trackGeometry, trackMaterial);
        track.rotation.x = -Math.PI / 2;
        track.position.set(0, -0.9, -16); // 멀리서부터 시작
        track.userData = { originalOpacity: 0.2 };
        
        // 박자 인디케이터들 (바닥 원형들)
        for (let i = 1; i <= 3; i++) {
            const beatGeometry = new THREE.CircleGeometry(0.2, 8);
            const beatMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            const beatIndicator = new THREE.Mesh(beatGeometry, beatMaterial);
            beatIndicator.rotation.x = -Math.PI / 2;
            beatIndicator.position.set(0, -0.7, 3.5 - (i * 2));
            beatIndicator.userData = { originalOpacity: 0.5 };
            
            guidelineGroup.add(beatIndicator);
        }
        
        guidelineGroup.add(track);
        guidelineGroup.add(hitZone);
        guidelineGroup.add(centerCircle);
        
        guidelineGroup.position.x = xPosition;
        guidelineGroup.userData = { 
            type: type,
            color: color,
            isActive: false,
            lastPulse: 0
        };
        
        return guidelineGroup;
    }
    
    setupEventListeners() {
        // ✅ 중요: 서버 연결 완료 후 세션 생성
        this.sdk.on('connected', () => {
            console.log('✅ 서버 연결 완료, 세션 생성 중...');
            this.createSession();
        });
        
        // ✅ 중요: CustomEvent 처리 패턴
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;  // 필수 패턴!
            console.log('세션 생성됨:', session);
            this.displaySessionInfo(session);
        });
        
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;     // 필수 패턴!
            console.log('센서 연결됨:', data);
            this.onSensorConnected(data);
        });
        
        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;     // 필수 패턴!
            this.processSensorData(data);
        });
        
        this.sdk.on('game-ready', (event) => {
            const data = event.detail || event;     // 필수 패턴!
            console.log('게임 준비 완료 - 사용자 시작 버튼 활성화');
            this.showStartButton();
        });
        
        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;     // 필수 패턴!
            console.log('센서 연결 해제:', data.sensorId);
            this.onSensorDisconnected(data);
        });
        
        // ✅ 개선된 키보드 컨트롤 (테스트용)
        window.addEventListener('keydown', (e) => {
            if (this.gameState.phase !== 'playing') return;
            
            switch(e.key.toLowerCase()) {
                case 'q': 
                    this.triggerSwing('sensor1'); 
                    console.log('🔴 왼쪽 세이버(sensor1) 스윙 - 오른쪽으로');
                    break;
                case 'e': 
                    this.triggerSwing('sensor2'); 
                    console.log('🔵 오른쪽 세이버(sensor2) 스윙 - 왼쪽으로');
                    break;
                case ' ': 
                    this.triggerCooperationSwing(); 
                    console.log('🤝 협력 스윙 - 두 세이버 동시 스윙');
                    break;
                case 'a':
                    // 약간의 딜레이를 두고 협력 테스트
                    this.triggerSwing('sensor1');
                    setTimeout(() => this.triggerSwing('sensor2'), 100);
                    console.log('⏱️ 순차 협력 테스트 (100ms 딜레이)');
                    break;
                case 's':
                    // 더 긴 딜레이로 실패 테스트
                    this.triggerSwing('sensor1');
                    setTimeout(() => this.triggerSwing('sensor2'), 600);
                    console.log('❌ 협력 실패 테스트 (600ms 딜레이)');
                    break;
            }
        });
    }
    
    async createSession() {
        try {
            await this.sdk.createSession();
        } catch (error) {
            console.error('세션 생성 실패:', error);
        }
    }
    
    // ✅ QR 코드 안전한 생성 (폴백 처리 포함)
    displaySessionInfo(session) {
        document.getElementById('sessionCode').textContent = session.sessionCode;
        
        const qrUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
        
        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(document.createElement('canvas'), qrUrl, (error, canvas) => {
                if (!error) {
                    canvas.style.width = '200px';
                    canvas.style.height = '200px';
                    document.getElementById('qrContainer').innerHTML = '';
                    document.getElementById('qrContainer').appendChild(canvas);
                } else {
                    console.error('QR 코드 생성 실패:', error);
                    this.showQRCodeFallback(qrUrl);
                }
            });
        } else {
            console.warn('QRCode 라이브러리가 로드되지 않았습니다. 폴백 사용.');
            this.showQRCodeFallback(qrUrl);
        }
    }
    
    showQRCodeFallback(qrUrl) {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
        const img = document.createElement('img');
        img.src = qrApiUrl;
        img.style.width = '200px';
        img.style.height = '200px';
        img.alt = 'QR Code';
        
        document.getElementById('qrContainer').innerHTML = '';
        document.getElementById('qrContainer').appendChild(img);
    }
    
    onSensorConnected(data) {
        const sensorId = data.sensorId;
        this.sensorStatus[sensorId].connected = true;
        
        // UI 업데이트
        const statusElement = document.getElementById(`${sensorId}Status`);
        statusElement.textContent = '연결됨 ✅';
        statusElement.style.color = '#10b981';
        
        console.log(`${sensorId} 연결됨`);
        
        // 연결 상태 확인
        this.updateConnectionStatus();
    }
    
    onSensorDisconnected(data) {
        const sensorId = data.sensorId;
        this.sensorStatus[sensorId].connected = false;
        
        // UI 업데이트
        const statusElement = document.getElementById(`${sensorId}Status`);
        statusElement.textContent = '연결 해제됨 ❌';
        statusElement.style.color = '#ef4444';
        
        console.log(`${sensorId} 연결 해제됨`);
    }
    
    updateConnectionStatus() {
        const connectedCount = Object.values(this.sensorStatus).filter(s => s.connected).length;
        console.log(`연결된 센서: ${connectedCount}/2`);
    }
    
    processSensorData(data) {
        if (this.gameState.phase !== 'playing') return;
        
        const sensorId = data.sensorId;
        const sensorData = data.data;
        
        if (sensorData.orientation) {
            // 스윙 감지 로직
            const rotationSpeed = Math.abs(sensorData.rotationRate?.alpha || 0) + 
                                 Math.abs(sensorData.rotationRate?.beta || 0) + 
                                 Math.abs(sensorData.rotationRate?.gamma || 0);
            
            const swingThreshold = 300;  // 스윙 인식 기준
            
            if (rotationSpeed > swingThreshold) {
                const now = Date.now();
                if (now - this.sensorStatus[sensorId].lastSwing > 150) {  // 150ms 쿨다운
                    this.triggerSwing(sensorId);
                    this.sensorStatus[sensorId].lastSwing = now;
                }
            }
        }
    }
    
    showStartButton() {
        const startButton = document.createElement('button');
        startButton.className = 'btn btn-primary';
        startButton.style.cssText = 'font-size: 1.2rem; padding: 1rem 2rem; margin-top: 1rem;';
        startButton.innerHTML = '🎵 게임 시작!';
        startButton.onclick = () => {
            startButton.remove();
            this.startGame();
        };
        
        const sessionPanel = document.getElementById('sessionPanel');
        sessionPanel.appendChild(startButton);
        
        console.log('🎮 센서 연결 완료 - 게임 시작 버튼 표시');
    }
    
    startGame() {
        this.gameState.phase = 'playing';
        this.gameState.startTime = Date.now();
        
        // 🎵 음악 재생 시작
        if (this.musicLoaded) {
            this.bgMusic.currentTime = 0;
            this.bgMusic.play().then(() => {
                console.log('🎵 음악 재생 시작');
            }).catch(e => {
                console.warn('🎵 음악 재생 실패:', e);
            });
        }
        
        // UI 전환
        document.getElementById('sessionPanel').classList.add('hidden');
        document.getElementById('gameStats').classList.remove('hidden');
        document.getElementById('cooperationMeter').classList.remove('hidden');
        document.getElementById('controlPanel').classList.remove('hidden');
        document.getElementById('gameInstructions').classList.remove('hidden');
        
        console.log('🎮 Rhythm Blade Dual 게임 시작!');
    }
    
    triggerSwing(sensorId) {
        const saber = this.sabers[sensorId];
        if (!saber.userData.swinging) {
            saber.userData.swinging = true;
            saber.userData.swingTime = Date.now();
            this.checkHit(sensorId);
            
            // 시각적 효과
            this.createSwingEffect(saber);
        }
    }
    
    triggerCooperationSwing() {
        // 두 센서 모두 스윙 (테스트용)
        this.triggerSwing('sensor1');
        this.triggerSwing('sensor2');
    }
    
    checkHit(sensorId) {
        const saber = this.sabers[sensorId];
        let hit = false;
        let partialCoopHit = false; // 콤보 리셋 방지를 위한 플래그

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            const noteData = note.userData;
            
            const hitRange = noteData.type === 'cooperation' ? 2.5 : 2;
            const distance = note.position.distanceTo(saber.position);
            
            if (distance < hitRange) {  
                if (noteData.type === 'cooperation') {
                    noteData.hitBy = noteData.hitBy || [];
                    noteData.hitTimes = noteData.hitTimes || [];
                    
                    if (!noteData.hitBy.includes(sensorId)) {
                        const now = Date.now();
                        noteData.hitBy.push(sensorId);
                        noteData.hitTimes.push(now);
                        
                        console.log(`🤝 협력 노트 히트: ${sensorId} (${noteData.hitBy.length}/2)`);
                        
                        if (noteData.hitBy.length < 2) {
                            partialCoopHit = true; // 첫 번째 협력 노트 히트
                        }
                        
                        if (noteData.hitBy.length >= 2) {
                            const timeDiff = Math.abs(noteData.hitTimes[1] - noteData.hitTimes[0]);
                            const maxSyncTime = 500;
                            
                            if (timeDiff <= maxSyncTime) {
                                this.processHit(note, 'cooperation', true);
                                hit = true;
                                partialCoopHit = false; // 최종 히트 성공
                                
                                const syncBonus = Math.max(1, (maxSyncTime - timeDiff) / maxSyncTime);
                                this.cooperation.sync = Math.min(100, this.cooperation.sync + (10 * syncBonus));
                                
                                console.log(`🌟 완벽한 협력! 동기화: ${timeDiff}ms, 보너스: ${syncBonus.toFixed(2)}`);
                            } else {
                                console.log(`⏰ 협력 타이밍 실패: ${timeDiff}ms (최대 ${maxSyncTime}ms)`);
                                this.updateCooperation(false);
                            }
                        }
                    }
                } else if (noteData.lane === sensorId) {
                    this.processHit(note, 'normal', false);
                    hit = true;
                }
            }
        }
        
        if (hit) {
            this.gameState.combo++;
            this.gameState.maxCombo = Math.max(this.gameState.maxCombo, this.gameState.combo);
            this.updateCooperation(true);
        } else if (partialCoopHit) {
            // 첫 번째 협력 노트만 맞춘 경우, 콤보를 초기화하지 않고 대기
            console.log('🤝 협력 노트 부분 히트. 콤보 유지.');
        } else {
            const isGameEnding = this.noteSpawnIndex >= this.beatmap.length && this.notes.length <= 2;
            
            if (!isGameEnding) {
                this.gameState.combo = 0;
                this.updateCooperation(false);
            } else {
                console.log('🎯 게임 종료 직전 - 콤보 유지');
                this.cooperation.sync = Math.max(0, this.cooperation.sync - 5);
            }
        }
        
        this.updateUI();
    }
    
    // ✅ 탭소닉 스타일 가이드라인 애니메이션 시스템
    updateGuidelineForNote(note) {
        const noteData = note.userData;
        const distanceToHitPoint = Math.abs(note.position.z - 3.5); // 바닥 가이드라인 위치: z=3.5
        
        // 노트가 바닥 가이드라인에 접근할 때 활성화 (더 넓은 범위)
        if (distanceToHitPoint <= 30 && distanceToHitPoint >= 0) {
            let guidelineType;
            
            if (noteData.type === 'cooperation') {
                guidelineType = 'cooperation';
            } else if (noteData.lane === 'sensor1') {
                guidelineType = 'sensor1';
            } else if (noteData.lane === 'sensor2') {
                guidelineType = 'sensor2';
            }
            
            if (guidelineType && this.timingGuidelines[guidelineType]) {
                this.activateGuideline(guidelineType, note);
                
                // 노트가 완벽한 타이밍 지점에 가까워질 때 강조 효과
                if (distanceToHitPoint <= 3) {
                    this.highlightGuideline(guidelineType, distanceToHitPoint);
                }
            }
        }
    }
    
    activateGuideline(guidelineType, note) {
        const guideline = this.timingGuidelines[guidelineType];
        if (!guideline) return;
        
        guideline.userData.isActive = true;
        guideline.userData.activeNote = note;
        
        // 가이드라인을 더 밝게 만들기
        guideline.children.forEach(child => {
            if (child.material && child.userData.originalOpacity) {
                child.material.opacity = Math.min(1.0, child.userData.originalOpacity * 1.5);
            }
        });
    }
    
    highlightGuideline(guidelineType, distance) {
        const guideline = this.timingGuidelines[guidelineType];
        if (!guideline) return;
        
        // 거리에 따른 강조 강도 계산 (가까울수록 강하게)
        const intensity = Math.max(0, 1 - (distance / 3));
        
        // 바닥 가이드라인의 중앙 원형 인디케이터 찾기
        const hitPoint = guideline.children.find(child => 
            child.geometry && child.geometry.type === 'CircleGeometry' && 
            child.userData.pulsePhase !== undefined &&
            child.geometry.parameters && child.geometry.parameters.radius === 0.6
        );
        
        if (hitPoint) {
            // 펄스 효과 적용
            hitPoint.userData.pulsePhase += 0.3;
            const pulse = 0.6 + (Math.sin(hitPoint.userData.pulsePhase) * 0.4 * intensity);
            hitPoint.material.opacity = pulse;
            hitPoint.scale.setScalar(1 + (intensity * 0.5));
            
            // 매우 가까울 때 (완벽한 타이밍) 특별한 효과
            if (distance <= 1) {
                hitPoint.material.opacity = 1.0;
                hitPoint.scale.setScalar(1.5);
                
                // 가이드라인 전체를 깜빡이게 하기
                guideline.children.forEach(child => {
                    if (child !== hitPoint && child.material) {
                        const flash = 0.8 + (Math.sin(Date.now() * 0.01) * 0.2);
                        child.material.opacity = child.userData.originalOpacity * flash;
                    }
                });
            }
        }
    }
    
    deactivateGuideline(noteData) {
        let guidelineType;
        
        if (noteData.type === 'cooperation') {
            guidelineType = 'cooperation';
        } else if (noteData.lane === 'sensor1') {
            guidelineType = 'sensor1';
        } else if (noteData.lane === 'sensor2') {
            guidelineType = 'sensor2';
        }
        
        if (guidelineType && this.timingGuidelines[guidelineType]) {
            const guideline = this.timingGuidelines[guidelineType];
            guideline.userData.isActive = false;
            guideline.userData.activeNote = null;
            
            // 가이드라인을 원래 밝기로 복원
            guideline.children.forEach(child => {
                if (child.material && child.userData.originalOpacity) {
                    child.material.opacity = child.userData.originalOpacity;
                }
                if (child.scale) {
                    child.scale.setScalar(1);
                }
            });
        }
    }
    
    updateTimingGuidelines() {
        // 각 가이드라인의 기본 애니메이션 업데이트
        Object.values(this.timingGuidelines).forEach(guideline => {
            if (!guideline) return;
            
            // 기본 펄스 효과 (활성화되지 않은 가이드라인)
            if (!guideline.userData.isActive) {
                const time = Date.now() * 0.002;
                const pulse = 0.7 + (Math.sin(time) * 0.3);
                
                // 바닥 가이드라인 트랙에 펄스 적용
                guideline.children.forEach(child => {
                    if (child.geometry && child.geometry.type === 'PlaneGeometry' && 
                        child.userData.originalOpacity === 0.2) { // 트랙 라인
                        child.material.opacity = child.userData.originalOpacity * pulse;
                    }
                });
            }
            
            // 박자에 맞는 깜빡임 효과
            if (this.gameState.phase === 'playing') {
                const elapsedTime = (Date.now() - this.gameState.startTime) / 1000;
                const beatTime = elapsedTime % this.beatInterval;
                const beatPulse = beatTime < 0.1 ? 1.5 : 1.0;
                
                // 바닥 박자 인디케이터들에 박자 맞춤 효과
                guideline.children.forEach(child => {
                    if (child.geometry && child.geometry.type === 'CircleGeometry' && 
                        child.userData.originalOpacity === 0.5) { // 바닥 박자 인디케이터
                        child.material.opacity = child.userData.originalOpacity * beatPulse;
                    }
                });
            }
            
            // 히트 효과 페이드아웃 처리
            if (guideline.userData.hitEffectTime) {
                const timeSinceHit = Date.now() - guideline.userData.hitEffectTime;
                if (timeSinceHit > 500) { // 0.5초 후 효과 제거
                    guideline.userData.hitEffectTime = null;
                    // 원래 상태로 복원
                    this.deactivateGuideline({ 
                        type: guideline.userData.type === 'cooperation' ? 'cooperation' : 'normal',
                        lane: guideline.userData.type
                    });
                }
            }
        });
    }
    
    triggerGuidelineHitEffect(noteData) {
        let guidelineType;
        
        if (noteData.type === 'cooperation') {
            guidelineType = 'cooperation';
        } else if (noteData.lane === 'sensor1') {
            guidelineType = 'sensor1';
        } else if (noteData.lane === 'sensor2') {
            guidelineType = 'sensor2';
        }
        
        if (guidelineType && this.timingGuidelines[guidelineType]) {
            const guideline = this.timingGuidelines[guidelineType];
            guideline.userData.hitEffectTime = Date.now();
            
            // 강렬한 히트 효과
            guideline.children.forEach(child => {
                if (child.material) {
                    // 밝은 플래시 효과
                    child.material.opacity = 1.0;
                    
                    // 바닥 가이드라인 중앙 원형 확대 효과
                    if (child.geometry && child.geometry.type === 'CircleGeometry' && 
                        child.userData.pulsePhase !== undefined &&
                        child.geometry.parameters && child.geometry.parameters.radius === 0.6) {
                        child.scale.setScalar(2.0);
                        
                        // 바닥 링 확산 효과 생성
                        this.createFloorRingEffect(child.position, guideline.userData.color);
                    }
                }
            });
            
            console.log(`🎯 가이드라인 히트 효과: ${guidelineType}`);
        }
    }
    
    createGuidelineRingEffect(position, color) {
        // 확산되는 링 효과 생성
        const ringGeometry = new THREE.RingGeometry(0.5, 0.7, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.userData = { 
            startTime: Date.now(),
            duration: 300 // 0.3초 동안 확산
        };
        
        this.scene.add(ring);
        
        // 애니메이션 함수
        const animateRing = () => {
            const elapsed = Date.now() - ring.userData.startTime;
            const progress = elapsed / ring.userData.duration;
            
            if (progress >= 1) {
                this.scene.remove(ring);
                return;
            }
            
            // 크기 확대 및 페이드아웃
            const scale = 1 + (progress * 3); // 4배까지 확대
            ring.scale.setScalar(scale);
            ring.material.opacity = 0.8 * (1 - progress);
            
            requestAnimationFrame(animateRing);
        };
        
        animateRing();
    }
    
    createFloorRingEffect(position, color) {
        // 바닥에 확산되는 링 효과 생성 (탭소닉 스타일)
        const ringGeometry = new THREE.RingGeometry(0.7, 1.0, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.rotation.x = -Math.PI / 2; // 바닥에 평행하게
        ring.userData = { 
            startTime: Date.now(),
            duration: 400 // 0.4초 동안 확산
        };
        
        this.scene.add(ring);
        
        // 바닥 링 애니메이션 함수
        const animateFloorRing = () => {
            const elapsed = Date.now() - ring.userData.startTime;
            const progress = elapsed / ring.userData.duration;
            
            if (progress >= 1) {
                this.scene.remove(ring);
                return;
            }
            
            // 크기 확대 및 페이드아웃
            const scale = 1 + (progress * 4); // 5배까지 확대
            ring.scale.setScalar(scale);
            ring.material.opacity = 0.9 * (1 - progress);
            
            requestAnimationFrame(animateFloorRing);
        };
        
        animateFloorRing();
    }
    
    processHit(note, type, isCooperation) {
        // 점수 계산
        let score = 100;
        if (isCooperation) {
            score *= 2;  // 협력 보너스
            score *= this.cooperation.cooperationBonus;
        }
        
        this.gameState.score += Math.floor(score);
        this.gameState.hitNotes++;
        
        // 이펙트 생성
        this.createHitEffect(note.position, isCooperation);
        
        // ✅ 가이드라인 히트 효과
        this.triggerGuidelineHitEffect(note.userData);
        
        // 노트 제거
        this.scene.remove(note);
        this.notes.splice(this.notes.indexOf(note), 1);
        
        console.log(`Hit! Score: +${Math.floor(score)}, Type: ${type}`);
    }
    
    createSwingEffect(saber) {
        // 세이버 스윙 이펙트
        const trailGeometry = new THREE.PlaneGeometry(0.1, 2);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: saber.children[1].material.color,
            transparent: true,
            opacity: 0.6
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.copy(saber.position);
        trail.rotation.copy(saber.rotation);
        
        this.scene.add(trail);
        
        // 페이드 아웃 애니메이션
        const fadeOut = () => {
            trail.material.opacity -= 0.05;
            if (trail.material.opacity <= 0) {
                this.scene.remove(trail);
            } else {
                requestAnimationFrame(fadeOut);
            }
        };
        fadeOut();
    }
    
    createHitEffect(position, isCooperation) {
        const particleCount = isCooperation ? 30 : 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: isCooperation ? 0x8b5cf6 : Math.random() > 0.5 ? 0xff0000 : 0x0000ff,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
            );
            particle.userData.life = 1;
            
            particles.add(particle);
        }
        
        this.particleEffects.push(particles);
        this.scene.add(particles);
    }
    
    updateCooperation(success) {
        if (success) {
            this.cooperation.sync = Math.min(100, this.cooperation.sync + 5);
            this.cooperation.cooperationBonus = 1.0 + (this.cooperation.sync / 200);
        } else {
            this.cooperation.sync = Math.max(0, this.cooperation.sync - 10);
            this.cooperation.cooperationBonus = 1.0 + (this.cooperation.sync / 200);
        }
        
        // 협력 미터 업데이트
        const fillElement = document.getElementById('cooperationFill');
        fillElement.style.width = `${this.cooperation.sync}%`;
    }
    
    spawnNote() {
        if (this.noteSpawnIndex >= this.beatmap.length) return;
        
        const now = Date.now();
        const elapsedTime = (now - this.gameState.startTime) / 1000;
        const noteData = this.beatmap[this.noteSpawnIndex];
        
        // 🎯 센서 반응 시간을 고려한 예측 스포닝 (음악보다 약간 앞서 노트 생성)
        const PREDICTIVE_SPAWN_OFFSET = 0.1; // 100ms 미리 스포닝
        const adjustedNoteTime = Math.max(0, noteData.time - PREDICTIVE_SPAWN_OFFSET);
        
        // 🎵 음악 재생 상태와 동기화 체크
        const musicCurrentTime = this.musicLoaded && !this.bgMusic.paused ? this.bgMusic.currentTime : elapsedTime;
        const syncedTime = this.musicLoaded ? musicCurrentTime : elapsedTime; // 음악이 로드되면 음악 시간 우선
        
        if (syncedTime >= adjustedNoteTime) {
            this.createNote(noteData);
            this.noteSpawnIndex++;
            
            // 🎯 센서 최적화 로깅 (디버그용)
            if (this.sdk.options.debug) {
                console.log(`🎼 노트 생성: 타입=${noteData.type}, 레인=${noteData.lane}, 시간=${noteData.time.toFixed(2)}s, 실제=${syncedTime.toFixed(2)}s`);
            }
        }
    }
    
    createNote(noteData) {
        let geometry, material, position;
        
        if (noteData.type === 'cooperation') {
            // 협력 노트 (보라색, 큰 크기)
            geometry = new THREE.SphereGeometry(0.8, 8, 8);
            material = new THREE.MeshBasicMaterial({ 
                color: 0x8b5cf6,
                transparent: true,
                opacity: 0.8
            });
            position = new THREE.Vector3(0, 1.5, -20);
        } else {
            // 일반 노트
            geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
            const color = noteData.lane === 'sensor1' ? 0xff0000 : 0x0000ff;
            material = new THREE.MeshBasicMaterial({ 
                color: color,
                transparent: true,
                opacity: 0.9
            });
            const x = noteData.lane === 'sensor1' ? -2 : 2;
            position = new THREE.Vector3(x, 1.5, -20);
        }
        
        const note = new THREE.Mesh(geometry, material);
        note.position.copy(position);
        note.userData = { ...noteData };
        
        // 글로우 효과
        const glowGeometry = geometry.clone();
        glowGeometry.scale(1.2, 1.2, 1.2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: material.color,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        note.add(glow);
        
        this.notes.push(note);
        this.scene.add(note);
    }
    
    update() {
        if (this.gameState.phase !== 'playing') return;
        
        const delta = 0.3;  // 노트 이동 속도
        
        // 노트 업데이트
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            note.position.z += delta;
            note.rotation.y += 0.02;  // 회전 효과
            
            // ✅ 가이드라인과 노트 매칭 체크
            this.updateGuidelineForNote(note);
            
            // 놓친 노트 처리
            if (note.position.z > 6) {
                this.scene.remove(note);
                this.notes.splice(i, 1);
                this.gameState.combo = 0;
                this.updateCooperation(false);
                
                // 놓친 노트에 해당하는 가이드라인 비활성화
                this.deactivateGuideline(note.userData);
                this.updateUI(); // UI 업데이트 추가
            }
        }
        
        // 새 노트 생성
        this.spawnNote();
        
        // 세이버 애니메이션 업데이트
        this.updateSaber(this.sabers.sensor1);
        this.updateSaber(this.sabers.sensor2);
        
        // 파티클 효과 업데이트
        this.updateParticles();
        
        // ✅ 가이드라인 애니메이션 업데이트
        this.updateTimingGuidelines();
        
        // 게임 종료 체크
        this.checkGameEnd();
    }
    
    updateSaber(saber) {
        if (saber.userData.swinging) {
            const now = Date.now();
            const swingDuration = 300;
            const timeSinceSwing = now - saber.userData.swingTime;
            
            if (timeSinceSwing < swingDuration) {
                const progress = timeSinceSwing / swingDuration;
                const baseAngle = Math.sin(progress * Math.PI) * 45;
                
                // ✅ 센서별 스윙 방향 설정
                // sensor1(왼쪽): 오른쪽으로 스윙 (음의 각도)
                // sensor2(오른쪽): 왼쪽으로 스윙 (양의 각도)
                let angle;
                if (saber.userData.sensorId === 'sensor1') {
                    angle = -baseAngle;  // 왼쪽 세이버는 오른쪽으로 스윙
                } else {
                    angle = baseAngle;   // 오른쪽 세이버는 왼쪽으로 스윙
                }
                
                saber.rotation.z = THREE.MathUtils.degToRad(angle);
            } else {
                saber.userData.swinging = false;
                saber.rotation.z = 0;
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particleEffects.length - 1; i >= 0; i--) {
            const particleGroup = this.particleEffects[i];
            let allDead = true;
            
            particleGroup.children.forEach(particle => {
                if (particle.userData.life > 0) {
                    allDead = false;
                    particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.02));
                    particle.userData.life -= 0.02;
                    particle.material.opacity = particle.userData.life;
                    particle.scale.setScalar(particle.userData.life);
                }
            });
            
            if (allDead) {
                this.scene.remove(particleGroup);
                this.particleEffects.splice(i, 1);
            }
        }
    }
    
    updateUI() {
        document.getElementById('scoreValue').textContent = this.gameState.score;
        document.getElementById('comboValue').textContent = this.gameState.combo;
        
        const accuracy = this.gameState.totalNotes > 0 ? 
            Math.round((this.gameState.hitNotes / this.noteSpawnIndex) * 100) : 100;
        document.getElementById('accuracyValue').textContent = `${accuracy}%`;
        
        // ✅ 게임 종료 카운트다운 표시
        if (this.gameState.endingStartTime > 0) {
            const remainingTime = Math.max(0, 2000 - (Date.now() - this.gameState.endingStartTime));
            const seconds = Math.ceil(remainingTime / 1000);
            
            if (seconds > 0) {
                document.getElementById('scoreValue').textContent = `종료 ${seconds}초 전...`;
            }
        }
    }
    
    checkGameEnd() {
        // 모든 노트가 생성되고 화면에서 사라졌을 때
        if (this.noteSpawnIndex >= this.beatmap.length && this.notes.length === 0) {
            // 아직 종료 대기가 시작되지 않았다면 시작
            if (this.gameState.endingStartTime === 0) {
                this.gameState.endingStartTime = Date.now();
                console.log('🎯 마지막 블록 처리 완료 - 2초 후 게임 종료');
            }
            
            // 2초 지연 후 게임 종료
            const elapsedEndingTime = Date.now() - this.gameState.endingStartTime;
            if (elapsedEndingTime >= 2000) { // 2초 (2000ms) 지연
                this.endGame();
            }
        }
    }
    
    endGame() {
        this.gameState.phase = 'ended';
        
        // 🎵 음악 정지
        if (this.bgMusic && !this.bgMusic.paused) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
        }
        
        const accuracy = Math.round((this.gameState.hitNotes / this.gameState.totalNotes) * 100);
        const cooperationScore = Math.round(this.cooperation.sync);
        
        // ✅ 성과에 따른 메시지
        let message = "🎮 Rhythm Blade Dual 완료!\n\n";
        message += `📊 최종 결과:\n`;
        message += `점수: ${this.gameState.score.toLocaleString()}\n`;
        message += `정확도: ${accuracy}%\n`;
        message += `협력도: ${cooperationScore}%\n`;
        message += `최대 콤보: ${this.gameState.maxCombo}\n`;
        message += `현재 콤보: ${this.gameState.combo}\n\n`;
        
        // 성과 평가
        if (accuracy >= 95 && cooperationScore >= 90) {
            message += "🌟 PERFECT COOPERATION! 🌟\n완벽한 협력입니다!";
        } else if (accuracy >= 85 && cooperationScore >= 80) {
            message += "🎖️ EXCELLENT TEAMWORK! 🎖️\n훌륭한 팀워크입니다!";
        } else if (accuracy >= 70 && cooperationScore >= 70) {
            message += "👍 GOOD COOPERATION! 👍\n좋은 협력이었습니다!";
        } else if (accuracy >= 50) {
            message += "💪 KEEP PRACTICING! 💪\n연습하면 더 좋아질 거예요!";
        } else {
            message += "🎯 TRY AGAIN! 🎯\n다시 도전해보세요!";
        }
        
        alert(message);
        
        console.log('🎮 게임 종료 - 마지막 블록 처리 완료 2초 후 종료!');
    }
    
    resetGame() {
        this.gameState = {
            phase: 'playing',
            score: 0,
            combo: 0,
            maxCombo: 0,
            totalNotes: this.beatmap.length,
            hitNotes: 0,
            startTime: Date.now(),
            endingStartTime: 0        // 2초 지연 종료를 위한 초기화
        };
        
        this.noteSpawnIndex = 0;
        this.cooperation.sync = 100;
        this.cooperation.cooperationBonus = 1.0;
        
        // 기존 노트들 제거
        this.notes.forEach(note => this.scene.remove(note));
        this.notes = [];
        
        // 🎵 음악 재시작
        if (this.musicLoaded) {
            this.bgMusic.currentTime = 0;
            this.bgMusic.play().catch(e => {
                console.warn('🎵 음악 재시작 실패:', e);
            });
        }
        
        console.log('🔄 게임 재시작');
    }
    
    togglePause() {
        if (this.gameState.phase === 'playing') {
            this.gameState.phase = 'paused';
            // 🎵 음악 일시정지
            if (this.bgMusic && !this.bgMusic.paused) {
                this.bgMusic.pause();
            }
            console.log('⏸️ 게임 일시정지');
        } else if (this.gameState.phase === 'paused') {
            this.gameState.phase = 'playing';
            // 🎵 음악 재개
            if (this.bgMusic && this.bgMusic.paused) {
                this.bgMusic.play().catch(e => {
                    console.warn('🎵 음악 재개 실패:', e);
                });
            }
            console.log('▶️ 게임 재개');
        }
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        this.update();
        this.render();
    }
}

// 게임 시작
const game = new RhythmBladeDual();
window.game = game;  // 디버깅용