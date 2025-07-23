
export const tracks = {
    'electric-storm': {
        name: 'Electric Storm',
        icon: '⚡',
        description: 'Electronic',
        bpm: 128,
        style: 'energetic',
        duration: 150,
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
        duration: 150,
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
        duration: 150,
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
        duration: 150,
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
        duration: 150,
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
        duration: 150,
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
        duration: 150,
        sources: [
            'https://www.bensound.com/bensound-music/bensound-epic.mp3',
            'https://www.bensound.com/bensound-music/bensound-adventure.mp3',
            'https://www.bensound.com/bensound-music/bensound-energy.mp3'
        ]
    },
    'thunder-storm': {
        name: 'Thunder Storm',
        icon: '⛈️',
        description: 'Hardcore',
        bpm: 160,
        style: 'hardcore',
        duration: 150,
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
        duration: 150,
        sources: [
            'https://www.bensound.com/bensound-music/bensound-happiness.mp3',
            'https://www.bensound.com/bensound-music/bensound-memories.mp3',
            'https://www.bensound.com/bensound-music/bensound-tenderness.mp3'
        ]
    }
};

export const SENSOR_DELAY = 0.15;
export const SWING_TIME = 0.25;
export const REACTION_BUFFER = 0.1;
export const TOTAL_SENSOR_OFFSET = SENSOR_DELAY + SWING_TIME + REACTION_BUFFER;
export const STANDARD_4_4_BPM = 120;
