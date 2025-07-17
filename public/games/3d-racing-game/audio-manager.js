/**
 * Audio Manager for 3D Racing Game
 * Handles all audio playback including engine sounds, music, and effects
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.effectsVolume = 0.8;
        this.sounds = {};
        this.musicTrack = null;
        this.engineSounds = {};
        this.initialized = false;
    }

    /**
     * Initialize audio system
     */
    async init() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);

            // Create separate gain nodes for music and effects
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);

            this.effectsGain = this.audioContext.createGain();
            this.effectsGain.gain.value = this.effectsVolume;
            this.effectsGain.connect(this.masterGain);

            this.initialized = true;
            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.initialized = false;
        }
    }

    /**
     * Resume audio context (required for user interaction)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Create audio buffer from URL
     */
    async createAudioBuffer(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.warn(`Failed to load audio: ${url}`, error);
            return null;
        }
    }

    /**
     * Load sound effect
     */
    async loadSound(name, url) {
        if (!this.initialized) return;
        
        const buffer = await this.createAudioBuffer(url);
        if (buffer) {
            this.sounds[name] = buffer;
        }
    }

    /**
     * Play sound effect
     */
    playSound(name, volume = 1.0, pitch = 1.0) {
        if (!this.initialized || !this.sounds[name]) {
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.playbackRate.value = pitch;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.effectsGain);
        source.start();

        return source;
    }

    /**
     * Create engine sound for a player
     */
    createEngineSound(playerId) {
        if (!this.initialized) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 80; // Base engine frequency
        
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        
        gainNode.gain.value = 0;

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.effectsGain);

        oscillator.start();

        this.engineSounds[playerId] = {
            oscillator,
            gainNode,
            filter,
            baseFrequency: 80
        };

        return this.engineSounds[playerId];
    }

    /**
     * Update engine sound based on speed
     */
    updateEngineSound(playerId, speed, throttle = 0) {
        const engine = this.engineSounds[playerId];
        if (!engine) return;

        // Calculate frequency based on speed and throttle
        const speedFactor = Math.min(speed / 100, 2); // Normalize speed
        const throttleFactor = throttle * 0.5;
        const frequency = engine.baseFrequency * (1 + speedFactor + throttleFactor);

        // Update oscillator frequency
        engine.oscillator.frequency.setValueAtTime(
            frequency, 
            this.audioContext.currentTime
        );

        // Update filter cutoff
        engine.filter.frequency.setValueAtTime(
            500 + speedFactor * 1000, 
            this.audioContext.currentTime
        );

        // Update volume based on throttle and speed
        const volume = Math.max(0.1, (speedFactor * 0.3) + (throttleFactor * 0.4));
        engine.gainNode.gain.setValueAtTime(
            volume * 0.3, // Keep engine sounds relatively quiet
            this.audioContext.currentTime
        );
    }

    /**
     * Stop engine sound
     */
    stopEngineSound(playerId) {
        const engine = this.engineSounds[playerId];
        if (engine) {
            engine.oscillator.stop();
            delete this.engineSounds[playerId];
        }
    }

    /**
     * Play background music
     */
    async playMusic(url, loop = true) {
        if (!this.initialized) return;

        if (this.musicTrack) {
            this.musicTrack.stop();
        }

        const buffer = await this.createAudioBuffer(url);
        if (buffer) {
            this.musicTrack = this.audioContext.createBufferSource();
            this.musicTrack.buffer = buffer;
            this.musicTrack.loop = loop;
            this.musicTrack.connect(this.musicGain);
            this.musicTrack.start();
        }
    }

    /**
     * Stop background music
     */
    stopMusic() {
        if (this.musicTrack) {
            this.musicTrack.stop();
            this.musicTrack = null;
        }
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }

    /**
     * Set effects volume
     */
    setEffectsVolume(volume) {
        this.effectsVolume = Math.max(0, Math.min(1, volume));
        if (this.effectsGain) {
            this.effectsGain.gain.value = this.effectsVolume;
        }
    }

    /**
     * Play countdown sound
     */
    playCountdown(count) {
        const frequency = count === 0 ? 800 : 400; // Higher pitch for start
        this.playTone(frequency, 0.5, 0.3);
    }

    /**
     * Play tone
     */
    playTone(frequency, duration, volume = 0.5) {
        if (!this.initialized) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.value = volume;
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, 
            this.audioContext.currentTime + duration
        );

        oscillator.connect(gainNode);
        gainNode.connect(this.effectsGain);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    /**
     * Clean up audio resources
     */
    dispose() {
        Object.values(this.engineSounds).forEach(engine => {
            engine.oscillator.stop();
        });
        this.engineSounds = {};

        if (this.musicTrack) {
            this.musicTrack.stop();
        }

        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Global audio manager
window.audioManager = new AudioManager();