
import { tracks, STANDARD_4_4_BPM, TOTAL_SENSOR_OFFSET } from '../shared/config.js';

function generateElectricStorm44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat) {
    // ... (기존 generateElectricStormBeatmap 코드)
}

function generateNeonNights44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat) {
    // ... (기존 generateNeonNightsBeatmap 코드)
}

// ... (다른 모든 generate...Beatmap 함수들)

function generateDefault44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat) {
    // ... (기존 generateDefaultBeatmap 코드)
}

export function generateRhythmBeatmap(currentTrack) {
    const track = tracks[currentTrack];
    console.log(`🎼 ${track.name} 비트맵 생성 중... (4/4박자 기준)`);

    const standardBeatInterval = 60 / STANDARD_4_4_BPM;
    const wholeBeat = standardBeatInterval;
    const halfBeat = standardBeatInterval / 2;
    const quarterBeat = Math.max(standardBeatInterval / 4, TOTAL_SENSOR_OFFSET * 0.8);
    const doubleBeat = standardBeatInterval * 2;
    const measureBeat = standardBeatInterval * 4;

    console.log(`🎯 4/4박자 표준화: ${STANDARD_4_4_BPM} BPM, 1박=${wholeBeat}초, 최소간격=${quarterBeat}초`);

    switch (currentTrack) {
        case 'electric-storm':
            return generateElectricStorm44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat);
        case 'neon-nights':
            return generateNeonNights44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat);
        case 'cyber-beat':
            return generateCyberBeat44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat);
        case 'space-rhythm':
            return generateSpaceRhythm44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat);
        case 'fire-dance':
            return generateFireDance44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat);
        case 'ocean-waves':
            return generateOceanWaves44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat);
        case 'crystal-cave':
            return generateCrystalCave44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat);
        case 'thunder-storm':
            return generateThunderStorm44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat);
        case 'starlight':
            return generateStarlight44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat);
        default:
            return generateDefault44Beatmap(wholeBeat, halfBeat, quarterBeat, doubleBeat, measureBeat);
    }
}
