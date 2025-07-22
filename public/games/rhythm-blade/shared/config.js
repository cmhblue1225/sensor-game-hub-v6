// 게임 설정 및 상수들
export const GAME_CONFIG = {
    // 센서 설정
    SENSOR_DELAY: 0.15,
    SWING_TIME: 0.25,
    REACTION_BUFFER: 0.1,
    SWING_THRESHOLD: 300,
    
    // 게임 설정
    NOTE_SPEED: 0.3,
    HIT_RANGE_NORMAL: 2,
    HIT_RANGE_COOPERATION: 2.5,
    MAX_SYNC_TIME: 500,
    
    // 애니메이션 설정
    SWING_DURATION: 300,
    ENDING_DURATION: 2000,
    EFFECT_FADE_SPEED: 0.02,
    
    // 스코어링 설정
    BASE_SCORE: 100,
    COMBO_BONUS_RATE: 10,
    COOPERATION_SCORE_MULTIPLIER: 1.5
};

// 음악 트랙 정보
export const MUSIC_TRACKS = {
    'electric-storm': {
        name: 'Electric Storm',
        icon: '⚡',
        description: 'Electronic',
        bpm: 128,
        style: 'energetic',
        duration: 120,
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
        duration: 105,
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
        duration: 110,
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
        duration: 100,
        sources: [
            'https://www.bensound.com/bensound-music/bensound-dreams.mp3',
            'https://www.bensound.com/bensound-music/bensound-deepblue.mp3',
            'https://www.bensound.com/bensound-music/bensound-relaxing.mp3'
        ]
    },
    'fire-dance': {
        name: 'Fire Dance',
        icon: '🔥',
        description: 'Energetic',
        bpm: 135,
        style: 'fiery',
        duration: 95,
        sources: [
            'https://www.bensound.com/bensound-music/bensound-energy.mp3',
            'https://www.bensound.com/bensound-music/bensound-dance.mp3',
            'https://www.bensound.com/bensound-music/bensound-house.mp3'
        ]
    },
    'ocean-waves': {
        name: 'Ocean Waves',
        icon: '🌊',
        description: 'Flowing',
        bpm: 110,
        style: 'flowing',
        duration: 115,
        sources: [
            'https://www.bensound.com/bensound-music/bensound-deepblue.mp3',
            'https://www.bensound.com/bensound-music/bensound-dreams.mp3',
            'https://www.bensound.com/bensound-music/bensound-relaxing.mp3'
        ]
    },
    'digital-forest': {
        name: 'Digital Forest',
        icon: '🌲',
        description: 'Nature-tech',
        bpm: 125,
        style: 'organic',
        duration: 108,
        sources: [
            'https://www.bensound.com/bensound-music/bensound-retrosoul.mp3',
            'https://www.bensound.com/bensound-music/bensound-dreams.mp3',
            'https://www.bensound.com/bensound-music/bensound-nightlife.mp3'
        ]
    },
    'neon-city': {
        name: 'Neon City',
        icon: '🏙️',
        description: 'Urban',
        bpm: 128,
        style: 'urban',
        duration: 102,
        sources: [
            'https://www.bensound.com/bensound-music/bensound-nightlife.mp3',
            'https://www.bensound.com/bensound-music/bensound-badass.mp3',
            'https://www.bensound.com/bensound-music/bensound-electroman.mp3'
        ]
    },
    'thunder-storm': {
        name: 'Thunder Storm',
        icon: '⛈️',
        description: 'Intense',
        bpm: 145,
        style: 'chaotic',
        duration: 90,
        sources: [
            'https://www.bensound.com/bensound-music/bensound-dubstep.mp3',
            'https://www.bensound.com/bensound-music/bensound-energy.mp3',
            'https://www.bensound.com/bensound-music/bensound-house.mp3'
        ]
    },
    'starlight-symphony': {
        name: 'Starlight Symphony',
        icon: '🌟',
        description: 'Celestial',
        bpm: 115,
        style: 'celestial',
        duration: 118,
        sources: [
            'https://www.bensound.com/bensound-music/bensound-dreams.mp3',
            'https://www.bensound.com/bensound-music/bensound-retrosoul.mp3',
            'https://www.bensound.com/bensound-music/bensound-deepblue.mp3'
        ]
    },
    'digital-forest': {
        name: 'Digital Forest',
        icon: '🌲',
        description: 'Nature-tech',
        bpm: 125,
        style: 'organic',
        duration: 108,
        sources: [
            'https://www.bensound.com/bensound-music/bensound-retrosoul.mp3',
            'https://www.bensound.com/bensound-music/bensound-dreams.mp3',
            'https://www.bensound.com/bensound-music/bensound-nightlife.mp3'
        ]
    }
};

// 색상 테마
export const COLORS = {
    SENSOR1: 0xff0000,
    SENSOR2: 0x0000ff,
    COOPERATION: 0xffff00,
    BACKGROUND: 0x0f172a,
    GUIDELINE: 0x00ffff,
    HIT_EFFECT: 0xffffff
};