import { GAME_CONFIG } from '../shared/config.js';

export class BeatmapGenerator {
    constructor(musicSystem) {
        this.musicSystem = musicSystem;
    }

    generateBeatmap() {
        const trackId = this.musicSystem.currentTrack;
        
        switch (trackId) {
            case 'electric-storm':
                return this.generateElectricStormBeatmap();
            case 'neon-nights':
                return this.generateNeonNightsBeatmap();
            case 'cyber-beat':
                return this.generateCyberBeatBeatmap();
            case 'space-rhythm':
                return this.generateSpaceRhythmBeatmap();
            case 'fire-dance':
                return this.generateFireDanceBeatmap();
            case 'ocean-waves':
                return this.generateOceanWavesBeatmap();
            case 'digital-forest':
                return this.generateDigitalForestBeatmap();
            case 'neon-city':
                return this.generateNeonCityBeatmap();
            case 'thunder-storm':
                return this.generateThunderStormBeatmap();
            case 'starlight-symphony':
                return this.generateStarlightSymphonyBeatmap();
            default:
                return this.generateDefaultBeatmap();
        }
    }

    generateElectricStormBeatmap() {
        const beat = this.musicSystem.getBeatInterval();
        const SENSOR_DELAY = GAME_CONFIG.SENSOR_DELAY;
        const SWING_TIME = GAME_CONFIG.SWING_TIME;
        const REACTION_BUFFER = GAME_CONFIG.REACTION_BUFFER;
        const TOTAL_SENSOR_OFFSET = SENSOR_DELAY + SWING_TIME + REACTION_BUFFER;

        const sensorMinInterval = Math.max(beat / 2, TOTAL_SENSOR_OFFSET);
        const halfBeat = Math.max(beat / 2, sensorMinInterval);
        const quarterBeat = Math.max(beat / 4, TOTAL_SENSOR_OFFSET * 0.8);
        const doubleBeat = beat * 2;

        const beatmap = [];
        const track = this.musicSystem.getCurrentTrack();
        const targetDuration = track.duration;

        const safeBeat = Math.max(beat, sensorMinInterval);
        const sensorFriendlyInterval = Math.max(halfBeat, sensorMinInterval * 1.2);

        // 페이즈 1: 워밍업 (28비트)
        let currentTime = 0;
        for (let i = 0; i < 28; i++) {
            const time = safeBeat * (i + 1);
            const pattern = i % 5;
            
            if (pattern < 2) {
                beatmap.push({ time, lane: pattern === 0 ? "sensor1" : "sensor2", type: "normal" });
            } else if (pattern === 4) {
                beatmap.push({ time, lane: "both", type: "cooperation" });
            }
            currentTime = time;
        }

        // 페이즈 2: 메인 섹션 (24비트)
        const phase2Start = currentTime + doubleBeat;
        currentTime = phase2Start;
        for (let i = 0; i < 24; i++) {
            const time = currentTime + sensorFriendlyInterval * i;
            const pattern = i % 6;
            
            switch (pattern) {
                case 0:
                case 2:
                    beatmap.push({ time, lane: "sensor1", type: "normal" });
                    break;
                case 1:
                case 3:
                    beatmap.push({ time, lane: "sensor2", type: "normal" });
                    break;
                case 5:
                    beatmap.push({ time, lane: "both", type: "cooperation" });
                    break;
            }
        }

        return beatmap.sort((a, b) => a.time - b.time);
    }

    generateNeonNightsBeatmap() {
        const beat = this.musicSystem.getBeatInterval();
        const beatmap = [];
        const track = this.musicSystem.getCurrentTrack();
        const targetDuration = track.duration;

        // 신스웨이브 스타일의 부드러운 패턴
        for (let i = 0; i < 35; i++) {
            const time = beat * (i + 1);
            const pattern = i % 7;
            
            if (pattern < 3) {
                beatmap.push({ time, lane: pattern % 2 === 0 ? "sensor1" : "sensor2", type: "normal" });
            } else if (pattern === 6) {
                beatmap.push({ time, lane: "both", type: "cooperation" });
            }
        }

        return beatmap.sort((a, b) => a.time - b.time);
    }

    generateCyberBeatBeatmap() {
        const beat = this.musicSystem.getBeatInterval();
        const TOTAL_SENSOR_OFFSET = GAME_CONFIG.SENSOR_DELAY + GAME_CONFIG.SWING_TIME + GAME_CONFIG.REACTION_BUFFER;
        
        const beatmap = [];
        const track = this.musicSystem.getCurrentTrack();
        const targetDuration = track.duration;

        const fastBpmSafeBeat = Math.max(beat * 1.2, TOTAL_SENSOR_OFFSET);
        const fastBpmInterval = Math.max(beat / 2 * 1.5, TOTAL_SENSOR_OFFSET * 1.4);

        let currentTime = 0;
        for (let i = 0; i < 24; i++) {
            const time = currentTime + fastBpmSafeBeat;
            const pattern = i % 4;
            
            switch (pattern) {
                case 0:
                    beatmap.push({ time, lane: "sensor1", type: "normal" });
                    break;
                case 1:
                    beatmap.push({ time, lane: "sensor2", type: "normal" });
                    break;
                case 3:
                    beatmap.push({ time, lane: "both", type: "cooperation" });
                    break;
            }
            currentTime = time;
        }

        return beatmap.sort((a, b) => a.time - b.time);
    }

    generateSpaceRhythmBeatmap() {
        const beat = this.musicSystem.getBeatInterval();
        const beatmap = [];
        const track = this.musicSystem.getCurrentTrack();
        const targetDuration = track.duration;

        let currentTime = 0;
        let planetCount = 0;

        // 우주적 궤도 패턴
        while (currentTime < targetDuration - 10) {
            const orbitRadius = 2 + (planetCount % 4);
            const orbitSpeed = 1.0 + (planetCount % 3) * 0.3;

            const pointsInOrbit = Math.floor(orbitRadius * 4);
            for (let i = 0; i < pointsInOrbit; i++) {
                const angle = (i / pointsInOrbit) * 2 * Math.PI;
                const orbitalTime = currentTime + (i * orbitSpeed * beat);

                const x = Math.cos(angle);
                const lane = x > 0 ? "sensor1" : "sensor2";

                beatmap.push({ time: orbitalTime, lane, type: "normal" });

                // 중력파 효과 (가끔 협력 노트)
                if (i === Math.floor(pointsInOrbit / 2)) {
                    for (let g = 0; g < 4; g++) {
                        const gravTime = currentTime + beat * g * 0.7;
                        
                        if (g === 3) {
                            beatmap.push({ time: gravTime, lane: "both", type: "cooperation" });
                        } else {
                            const lane = g % 2 === 0 ? "sensor1" : "sensor2";
                            beatmap.push({ time: gravTime, lane, type: "normal" });
                        }
                    }
                }
            }

            currentTime += beat * orbitRadius * 4;
            planetCount++;
        }

        return beatmap.sort((a, b) => a.time - b.time);
    }

    generateFireDanceBeatmap() {
        const beat = this.musicSystem.getBeatInterval();
        const beatmap = [];
        const track = this.musicSystem.getCurrentTrack();
        const targetDuration = track.duration;

        let currentTime = 0;
        const burstInterval = beat * 8;

        // 불꽃 폭발 패턴
        while (currentTime < targetDuration - 10) {
            const burstSize = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < burstSize; i++) {
                const burstTime = currentTime + (beat * 0.6 * i);
                
                if (i === burstSize - 1) {
                    beatmap.push({ time: burstTime, lane: "both", type: "cooperation" });
                } else {
                    const lane = i % 2 === 0 ? "sensor1" : "sensor2";
                    beatmap.push({ time: burstTime, lane, type: "normal" });
                }
            }

            // 잔불 효과
            if (Math.random() > 0.7) {
                const emberTime = currentTime - beat * 2;
                const emberLane = Math.random() > 0.5 ? "sensor1" : "sensor2";
                beatmap.push({ time: emberTime, lane: emberLane, type: "normal" });
            }

            currentTime += burstInterval;
        }

        return beatmap.sort((a, b) => a.time - b.time);
    }

    generateOceanWavesBeatmap() {
        const beat = this.musicSystem.getBeatInterval();
        const beatmap = [];
        const track = this.musicSystem.getCurrentTrack();
        const targetDuration = track.duration;

        let currentTime = 0;
        const waveLength = beat * 16;

        // 파도 패턴
        while (currentTime < targetDuration - 10) {
            // 파도 형성 (빌드업)
            for (let i = 0; i < 6; i++) {
                const buildTime = currentTime + (beat * (2 - i * 0.2));
                const lane = i % 2 === 0 ? "sensor1" : "sensor2";
                beatmap.push({ time: buildTime, lane, type: "normal" });
            }

            // 파도 충돌 (클라이맥스)
            for (let i = 0; i < 4; i++) {
                const crashTime = currentTime + beat * (11 + i * 0.7);
                const lane = i % 2 === 0 ? "sensor2" : "sensor1";
                
                if (i === 3) {
                    beatmap.push({ time: crashTime, lane: "both", type: "cooperation" });
                } else {
                    beatmap.push({ time: crashTime, lane, type: "normal" });
                }
            }

            // 잔물결 효과
            if (Math.random() > 0.6) {
                const rippleTime = currentTime - beat * 2;
                const rippleLane = Math.random() > 0.5 ? "sensor1" : "sensor2";
                beatmap.push({ time: rippleTime, lane: rippleLane, type: "normal" });
            }

            currentTime += waveLength;
        }

        return beatmap.sort((a, b) => a.time - b.time);
    }

    generateDigitalForestBeatmap() {
        const beat = this.musicSystem.getBeatInterval();
        const beatmap = [];
        const track = this.musicSystem.getCurrentTrack();
        const targetDuration = track.duration;

        let currentTime = 0;
        let fibA = 1, fibB = 1;

        // 피보나치 성장 패턴
        while (currentTime < targetDuration - 10) {
            const nextFib = fibA + fibB;
            const growthPhases = Math.min(nextFib, 8);

            for (let i = 0; i < growthPhases; i++) {
                const growthTime = currentTime + beat * (1 + i * 0.7);
                
                if (i === growthPhases - 1) {
                    beatmap.push({ time: growthTime, lane: "both", type: "cooperation" });
                } else {
                    const isLeftSide = (i + currentTime / beat) % 2 === 0;
                    const lane = isLeftSide ? "sensor1" : "sensor2";
                    beatmap.push({ time: growthTime, lane, type: "normal" });
                }
            }

            const resonanceTime = currentTime + beat * (growthPhases + 1);
            beatmap.push({ time: resonanceTime, lane: "both", type: "cooperation" });

            fibA = fibB;
            fibB = nextFib;
            currentTime += beat * (growthPhases + 3);
        }

        return beatmap.sort((a, b) => a.time - b.time);
    }

    generateNeonCityBeatmap() {
        const beat = this.musicSystem.getBeatInterval();
        const beatmap = [];
        const track = this.musicSystem.getCurrentTrack();
        const targetDuration = track.duration;

        let currentTime = 0;
        const blockSize = beat * 12;

        // 도시 블록 패턴
        while (currentTime < targetDuration - 10) {
            // 교통 신호 패턴
            for (let traffic = 0; traffic < 8; traffic++) {
                const trafficTime = currentTime + beat * traffic;
                const pattern = traffic % 4;
                
                switch (pattern) {
                    case 0:
                    case 2:
                        beatmap.push({ time: trafficTime, lane: "sensor1", type: "normal" });
                        break;
                    case 1:
                        beatmap.push({ time: trafficTime, lane: "sensor2", type: "normal" });
                        break;
                    case 3:
                        beatmap.push({ time: trafficTime, lane: "both", type: "cooperation" });
                        break;
                }
            }

            // 네온 깜빡임 효과
            if (Math.random() > 0.4) {
                const flickerTime = currentTime - beat * 1;
                const flickerLane = Math.random() > 0.6 ? "both" : (Math.random() > 0.5 ? "sensor1" : "sensor2");
                const flickerType = flickerLane === "both" ? "cooperation" : "normal";
                beatmap.push({ time: flickerTime, lane: flickerLane, type: flickerType });
            }

            currentTime += blockSize;
        }

        return beatmap.sort((a, b) => a.time - b.time);
    }

    generateThunderStormBeatmap() {
        const beat = this.musicSystem.getBeatInterval();
        const beatmap = [];
        const track = this.musicSystem.getCurrentTrack();
        const targetDuration = track.duration;

        let currentTime = 0;

        // 번개 패턴
        while (currentTime < targetDuration - 10) {
            const strikeDuration = beat * (3 + Math.random() * 4);
            const strikeEnd = currentTime + strikeDuration;

            const strikeCount = 2 + Math.floor(Math.random() * 5);
            for (let i = 0; i < strikeCount; i++) {
                const strikeTime = currentTime + (Math.random() * strikeDuration);
                const intensity = Math.random();
                
                if (intensity > 0.8) {
                    beatmap.push({ time: strikeTime, lane: "both", type: "cooperation" });
                } else {
                    const lane = Math.random() > 0.5 ? "sensor1" : "sensor2";
                    beatmap.push({ time: strikeTime, lane, type: "normal" });
                }
            }

            // 천둥 울림 효과
            if (Math.random() > 0.3) {
                const rumbleDuration = beat * (2 + Math.random() * 3);
                const rumbleEnd = currentTime + rumbleDuration;

                let rumbleTime = currentTime;
                let rumbleIndex = 0;
                while (rumbleTime < rumbleEnd && rumbleIndex < 10) {
                    const lane = rumbleIndex % 3 === 2 ? "both" : (rumbleIndex % 2 === 0 ? "sensor1" : "sensor2");
                    const type = lane === "both" ? "cooperation" : "normal";
                    
                    beatmap.push({ time: rumbleTime, lane, type });
                    rumbleTime += beat * 0.8;
                    rumbleIndex++;
                }
            }

            currentTime = strikeEnd + beat * (1 + Math.random() * 3);
        }

        return beatmap.sort((a, b) => a.time - b.time);
    }

    generateStarlightSymphonyBeatmap() {
        const beat = this.musicSystem.getBeatInterval();
        const beatmap = [];
        const track = this.musicSystem.getCurrentTrack();
        const targetDuration = track.duration;

        let currentTime = 0;
        const constellations = [
            [0, 1.5, 3, 4.5, 6],        // 큰곰자리
            [0, 2, 4, 5, 7, 8.5],       // 오리온자리
            [0, 1, 2.5, 4, 6, 7],       // 카시오페이아
            [0, 2.5, 5, 6.5, 8],        // 북극성 주변
            [0, 1, 3, 4, 6, 7.5, 9]     // 안드로메다
        ];

        let constellationIndex = 0;

        while (currentTime < targetDuration - 10) {
            const constellation = constellations[constellationIndex % constellations.length];

            // 별자리 패턴 생성
            for (let i = 0; i < constellation.length; i++) {
                const starTime = currentTime + beat * constellation[i];
                
                if (i === constellation.length - 1) {
                    beatmap.push({ time: starTime, lane: "both", type: "cooperation" });
                } else {
                    const lane = i % 2 === 0 ? "sensor1" : "sensor2";
                    beatmap.push({ time: starTime, lane, type: "normal" });
                }
            }

            // 반짝임 효과
            const twinkleEnd = currentTime + beat * 6;
            for (let t = 0; t < 5; t++) {
                if (Math.random() > 0.4) {
                    const twinkleTime = currentTime + beat * t * 1.2;
                    const twinkleLane = Math.random() > 0.7 ? "both" : (Math.random() > 0.5 ? "sensor1" : "sensor2");
                    const twinkleType = twinkleLane === "both" ? "cooperation" : "normal";
                    beatmap.push({ time: twinkleTime, lane: twinkleLane, type: twinkleType });
                }

                // 유성우 효과
                for (let j = 0; j < 3; j++) {
                    const shootTime = currentTime + beat * j * 0.4;
                    const lane = j === 2 ? "both" : (j % 2 === 0 ? "sensor1" : "sensor2");
                    const type = lane === "both" ? "cooperation" : "normal";
                    beatmap.push({ time: shootTime, lane, type });
                }
            }

            constellationIndex++;
            currentTime += beat * 12;
        }

        return beatmap.sort((a, b) => a.time - b.time);
    }

    generateDefaultBeatmap() {
        const beat = this.musicSystem.getBeatInterval();
        const beatmap = [];

        // 간단한 기본 패턴
        for (let i = 0; i < 20; i++) {
            const time = beat * (i + 1);
            const pattern = i % 4;
            
            switch (pattern) {
                case 0:
                    beatmap.push({ time, lane: "sensor1", type: "normal" });
                    break;
                case 1:
                    beatmap.push({ time, lane: "sensor2", type: "normal" });
                    break;
                case 3:
                    beatmap.push({ time, lane: "both", type: "cooperation" });
                    break;
            }
        }

        return beatmap.sort((a, b) => a.time - b.time);
    }
}