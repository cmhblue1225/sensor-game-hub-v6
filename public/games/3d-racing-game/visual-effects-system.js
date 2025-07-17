/**
 * Visual Effects System for 3D Racing Game
 * Handles particle effects, screen effects, and visual feedback
 */
class VisualEffectsSystem {
    constructor() {
        this.effects = [];
        this.particles = [];
        this.initialized = false;
        this.canvases = {};
        this.contexts = {};
    }

    /**
     * Initialize visual effects system
     */
    init() {
        this.canvases.left = document.getElementById('left-canvas');
        this.canvases.right = document.getElementById('right-canvas');
        
        if (this.canvases.left) {
            this.contexts.left = this.canvases.left.getContext('2d');
        }
        if (this.canvases.right) {
            this.contexts.right = this.canvases.right.getContext('2d');
        }

        this.initialized = true;
        this.startEffectsLoop();
        console.log('Visual effects system initialized');
    }

    /**
     * Start effects animation loop
     */
    startEffectsLoop() {
        const animate = () => {
            this.updateEffects();
            this.renderEffects();
            requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * Update all effects
     */
    updateEffects() {
        const now = Date.now();
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update(now);
            return particle.isAlive();
        });

        // Update screen effects
        this.effects = this.effects.filter(effect => {
            effect.update(now);
            return effect.isAlive();
        });
    }

    /**
     * Render all effects
     */
    renderEffects() {
        if (!this.initialized) return;

        // Clear effects layer (if separate)
        // For now, particles will be rendered by the game itself
        
        // Render screen effects
        this.effects.forEach(effect => {
            effect.render(this.contexts);
        });
    }

    /**
     * Create explosion effect
     */
    createExplosion(x, y, playerId, intensity = 1) {
        const particleCount = Math.floor(20 * intensity);
        const colors = ['#ff4444', '#ff8844', '#ffaa44', '#ffffff'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new Particle({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10 * intensity,
                vy: (Math.random() - 0.5) * 10 * intensity,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 4 + 2,
                life: 1000 + Math.random() * 500,
                decay: 0.95,
                playerId: playerId
            });
            
            this.particles.push(particle);
        }
    }

    /**
     * Create smoke trail effect
     */
    createSmokeTrail(x, y, playerId, intensity = 0.5) {
        const particle = new Particle({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            color: `rgba(100, 100, 100, ${intensity})`,
            size: Math.random() * 3 + 1,
            life: 800 + Math.random() * 400,
            decay: 0.98,
            playerId: playerId
        });
        
        this.particles.push(particle);
    }

    /**
     * Create speed boost effect
     */
    createSpeedBoost(x, y, playerId) {
        const particleCount = 15;
        const colors = ['#4444ff', '#44aaff', '#44ffff', '#ffffff'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 5 + Math.random() * 3;
            
            const particle = new Particle({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 2 + 1,
                life: 600 + Math.random() * 300,
                decay: 0.96,
                playerId: playerId
            });
            
            this.particles.push(particle);
        }
    }

    /**
     * Create dust effect
     */
    createDust(x, y, playerId, velocity = { x: 0, y: 0 }) {
        const particleCount = 5;
        const colors = ['#8B4513', '#A0522D', '#D2691E', '#CD853F'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new Particle({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: velocity.x * 0.3 + (Math.random() - 0.5) * 2,
                vy: velocity.y * 0.3 + (Math.random() - 0.5) * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 2 + 0.5,
                life: 400 + Math.random() * 200,
                decay: 0.97,
                playerId: playerId
            });
            
            this.particles.push(particle);
        }
    }

    /**
     * Create screen shake effect
     */
    createScreenShake(playerId, intensity = 1, duration = 300) {
        const effect = new ScreenShake({
            playerId: playerId,
            intensity: intensity,
            duration: duration,
            startTime: Date.now()
        });
        
        this.effects.push(effect);
    }

    /**
     * Create flash effect
     */
    createFlash(playerId, color = '#ffffff', intensity = 0.5, duration = 200) {
        const effect = new FlashEffect({
            playerId: playerId,
            color: color,
            intensity: intensity,
            duration: duration,
            startTime: Date.now()
        });
        
        this.effects.push(effect);
    }

    /**
     * Get particles for rendering by game
     */
    getParticlesForPlayer(playerId) {
        return this.particles.filter(particle => particle.playerId === playerId);
    }

    /**
     * Clear all effects
     */
    clear() {
        this.particles = [];
        this.effects = [];
    }

    /**
     * Get screen shake offset for player
     */
    getScreenShakeOffset(playerId) {
        const shakeEffects = this.effects.filter(effect => 
            effect.type === 'screenShake' && effect.playerId === playerId
        );
        
        let offsetX = 0;
        let offsetY = 0;
        
        shakeEffects.forEach(effect => {
            const offset = effect.getOffset();
            offsetX += offset.x;
            offsetY += offset.y;
        });
        
        return { x: offsetX, y: offsetY };
    }
}

/**
 * Particle class
 */
class Particle {
    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.vx = options.vx;
        this.vy = options.vy;
        this.color = options.color;
        this.size = options.size;
        this.life = options.life;
        this.maxLife = options.life;
        this.decay = options.decay;
        this.playerId = options.playerId;
        this.gravity = options.gravity || 0.1;
    }

    update(now) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        
        this.vx *= this.decay;
        this.vy *= this.decay;
        
        this.life -= 16; // Approximate frame time
        
        // Update alpha based on life
        this.alpha = Math.max(0, this.life / this.maxLife);
    }

    isAlive() {
        return this.life > 0;
    }

    render(ctx) {
        if (!ctx) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

/**
 * Screen shake effect
 */
class ScreenShake {
    constructor(options) {
        this.type = 'screenShake';
        this.playerId = options.playerId;
        this.intensity = options.intensity;
        this.duration = options.duration;
        this.startTime = options.startTime;
    }

    update(now) {
        // Screen shake doesn't need updating
    }

    isAlive() {
        return (Date.now() - this.startTime) < this.duration;
    }

    getOffset() {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        const fadeOut = 1 - progress;
        
        const currentIntensity = this.intensity * fadeOut;
        
        return {
            x: (Math.random() - 0.5) * currentIntensity * 10,
            y: (Math.random() - 0.5) * currentIntensity * 10
        };
    }
}

/**
 * Flash effect
 */
class FlashEffect {
    constructor(options) {
        this.type = 'flash';
        this.playerId = options.playerId;
        this.color = options.color;
        this.intensity = options.intensity;
        this.duration = options.duration;
        this.startTime = options.startTime;
    }

    update(now) {
        // Flash effect doesn't need updating
    }

    isAlive() {
        return (Date.now() - this.startTime) < this.duration;
    }

    render(contexts) {
        const ctx = contexts[this.playerId === 'player1' ? 'left' : 'right'];
        if (!ctx) return;
        
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        const alpha = (1 - progress) * this.intensity;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }
}

// Global visual effects system
window.visualEffects = new VisualEffectsSystem();