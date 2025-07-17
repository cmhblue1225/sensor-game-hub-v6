/**
 * Visual Effects System for 3D Racing Game
 * Handles tire smoke, skid marks, drift effects, collision effects, and victory celebrations
 */

/**
 * ParticleSystem Class - Base particle system for various visual effects
 */
class ParticleSystem {
    constructor(canvas, maxParticles = 100) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = maxParticles;
        this.isActive = false;
    }
    
    /**
     * Create a new particle
     * @param {Object} options - Particle configuration
     * @returns {Object} Particle object
     */
    createParticle(options = {}) {
        return {
            x: options.x || 0,
            y: options.y || 0,
            vx: options.vx || 0,
            vy: options.vy || 0,
            size: options.size || 2,
            color: options.color || '#ffffff',
            alpha: options.alpha || 1.0,
            life: options.life || 1.0,
            maxLife: options.maxLife || 1.0,
            gravity: options.gravity || 0,
            friction: options.friction || 0.98,
            type: options.type || 'default'
        };
    }
    
    /**
     * Add particle to system
     * @param {Object} particle - Particle to add
     */
    addParticle(particle) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift(); // Remove oldest particle
        }
        this.particles.push(particle);
    }
    
    /**
     * Update all particles
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // Apply gravity
            particle.vy += particle.gravity * deltaTime;
            
            // Apply friction
            particle.vx *= particle.friction;
            particle.vy *= particle.friction;
            
            // Update life
            particle.life -= deltaTime;
            particle.alpha = particle.life / particle.maxLife;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * Render all particles
     */
    render() {
        if (!this.isActive || this.particles.length === 0) return;
        
        this.ctx.save();
        
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }
    
    /**
     * Start particle system
     */
    start() {
        this.isActive = true;
    }
    
    /**
     * Stop particle system
     */
    stop() {
        this.isActive = false;
    }
}

/**
 * TireSmokeEffect Class - Handles tire smoke and drift effects
 */
class TireSmokeEffect extends ParticleSystem {
    constructor(canvas) {
        super(canvas, 150);
        this.smokeColors = ['#888888', '#999999', '#aaaaaa', '#bbbbbb'];
    }
    
    /**
     * Create tire smoke at car position
     * @param {Object} car - Car object with position and velocity
     * @param {number} intensity - Smoke intensity (0-1)
     * @param {string} side - 'left' or 'right' for screen side
     */
    createTireSmoke(car, intensity = 1.0, side = 'left') {
        if (!car || !car.position) return;
        
        const screenWidth = this.canvas.width;
        const screenHeight = this.canvas.height;
        
        // Calculate screen position based on car's world position
        const screenX = side === 'left' ? 
            (screenWidth / 4) + (car.position.x * 0.1) : 
            (screenWidth * 3 / 4) + (car.position.x * 0.1);
        const screenY = screenHeight * 0.8; // Near bottom of screen
        
        // Create multiple smoke particles
        const particleCount = Math.floor(intensity * 8);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticle({
                x: screenX + (Math.random() - 0.5) * 30,
                y: screenY + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 50,
                vy: -Math.random() * 30 - 20,
                size: Math.random() * 8 + 4,
                color: this.smokeColors[Math.floor(Math.random() * this.smokeColors.length)],
                alpha: 0.8,
                life: Math.random() * 2 + 1,
                maxLife: Math.random() * 2 + 1,
                gravity: -5,
                friction: 0.95,
                type: 'smoke'
            });
            
            this.addParticle(particle);
        }
    }
    
    /**
     * Create drift effect with enhanced smoke
     * @param {Object} car - Car object
     * @param {number} driftAngle - Drift angle in degrees
     * @param {string} side - Screen side
     */
    createDriftEffect(car, driftAngle, side = 'left') {
        const intensity = Math.min(Math.abs(driftAngle) / 45, 1.0);
        this.createTireSmoke(car, intensity * 1.5, side);
        
        // Add sparks for intense drifting
        if (intensity > 0.7) {
            this.createSparks(car, side);
        }
    }
    
    /**
     * Create spark effects for intense drifting
     * @param {Object} car - Car object
     * @param {string} side - Screen side
     */
    createSparks(car, side) {
        const screenWidth = this.canvas.width;
        const screenHeight = this.canvas.height;
        
        const screenX = side === 'left' ? 
            (screenWidth / 4) + (car.position.x * 0.1) : 
            (screenWidth * 3 / 4) + (car.position.x * 0.1);
        const screenY = screenHeight * 0.8;
        
        // Create spark particles
        for (let i = 0; i < 5; i++) {
            const particle = this.createParticle({
                x: screenX + (Math.random() - 0.5) * 20,
                y: screenY + (Math.random() - 0.5) * 5,
                vx: (Math.random() - 0.5) * 100,
                vy: -Math.random() * 50 - 10,
                size: Math.random() * 3 + 1,
                color: Math.random() > 0.5 ? '#ffaa00' : '#ff6600',
                alpha: 1.0,
                life: Math.random() * 0.5 + 0.3,
                maxLife: Math.random() * 0.5 + 0.3,
                gravity: 50,
                friction: 0.98,
                type: 'spark'
            });
            
            this.addParticle(particle);
        }
    }
}

/**
 * SkidMarkRenderer Class - Handles skid mark rendering on track
 */
class SkidMarkRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.skidMarks = [];
        this.maxSkidMarks = 200;
    }
    
    /**
     * Add skid mark at car position
     * @param {Object} car - Car object
     * @param {number} intensity - Skid intensity (0-1)
     * @param {string} side - Screen side
     */
    addSkidMark(car, intensity, side) {
        if (!car || !car.position || intensity < 0.3) return;
        
        const screenWidth = this.canvas.width;
        const screenHeight = this.canvas.height;
        
        const screenX = side === 'left' ? 
            (screenWidth / 4) + (car.position.x * 0.1) : 
            (screenWidth * 3 / 4) + (car.position.x * 0.1);
        const screenY = screenHeight * 0.8;
        
        const skidMark = {
            x: screenX,
            y: screenY,
            width: 4 + intensity * 6,
            alpha: intensity * 0.8,
            age: 0,
            maxAge: 5000, // 5 seconds
            side: side
        };
        
        this.skidMarks.push(skidMark);
        
        // Remove old skid marks
        if (this.skidMarks.length > this.maxSkidMarks) {
            this.skidMarks.shift();
        }
    }
    
    /**
     * Update skid marks (fade over time)
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        for (let i = this.skidMarks.length - 1; i >= 0; i--) {
            const mark = this.skidMarks[i];
            mark.age += deltaTime * 1000;
            
            // Fade out over time
            mark.alpha = Math.max(0, (1 - mark.age / mark.maxAge) * 0.8);
            
            // Remove expired marks
            if (mark.age >= mark.maxAge) {
                this.skidMarks.splice(i, 1);
            }
        }
    }
    
    /**
     * Render all skid marks
     */
    render() {
        if (this.skidMarks.length === 0) return;
        
        this.ctx.save();
        
        this.skidMarks.forEach(mark => {
            this.ctx.globalAlpha = mark.alpha;
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(mark.x - mark.width / 2, mark.y, mark.width, 8);
        });
        
        this.ctx.restore();
    }
    
    /**
     * Clear all skid marks
     */
    clear() {
        this.skidMarks = [];
    }
}

/**
 * CollisionEffect Class - Handles collision visual effects
 */
class CollisionEffect extends ParticleSystem {
    constructor(canvas) {
        super(canvas, 100);
        this.impactColors = ['#ff4444', '#ff6666', '#ff8888', '#ffaaaa'];
        this.debrisColors = ['#666666', '#888888', '#aaaaaa'];
    }
    
    /**
     * Create collision impact effect
     * @param {Object} car - Car object
     * @param {string} collisionType - Type of collision ('wall', 'barrier', 'obstacle')
     * @param {string} side - Screen side
     */
    createCollisionImpact(car, collisionType, side) {
        if (!car || !car.position) return;
        
        const screenWidth = this.canvas.width;
        const screenHeight = this.canvas.height;
        
        const screenX = side === 'left' ? 
            (screenWidth / 4) + (car.position.x * 0.1) : 
            (screenWidth * 3 / 4) + (car.position.x * 0.1);
        const screenY = screenHeight * 0.7;
        
        // Create impact particles
        const particleCount = collisionType === 'wall' ? 20 : 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticle({
                x: screenX + (Math.random() - 0.5) * 40,
                y: screenY + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 150,
                vy: -Math.random() * 100 - 50,
                size: Math.random() * 6 + 2,
                color: this.impactColors[Math.floor(Math.random() * this.impactColors.length)],
                alpha: 1.0,
                life: Math.random() * 1.5 + 0.5,
                maxLife: Math.random() * 1.5 + 0.5,
                gravity: 80,
                friction: 0.95,
                type: 'impact'
            });
            
            this.addParticle(particle);
        }
        
        // Create debris particles
        this.createDebris(screenX, screenY, collisionType);
    }
    
    /**
     * Create debris particles
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} collisionType - Type of collision
     */
    createDebris(x, y, collisionType) {
        const debrisCount = collisionType === 'wall' ? 10 : 6;
        
        for (let i = 0; i < debrisCount; i++) {
            const particle = this.createParticle({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 15,
                vx: (Math.random() - 0.5) * 80,
                vy: -Math.random() * 60 - 20,
                size: Math.random() * 4 + 1,
                color: this.debrisColors[Math.floor(Math.random() * this.debrisColors.length)],
                alpha: 0.9,
                life: Math.random() * 2 + 1,
                maxLife: Math.random() * 2 + 1,
                gravity: 60,
                friction: 0.92,
                type: 'debris'
            });
            
            this.addParticle(particle);
        }
    }
}

/**
 * OffTrackWarning Class - Handles off-track visual warnings
 */
class OffTrackWarning {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.warnings = {
            player1: { active: false, intensity: 0, timer: 0 },
            player2: { active: false, intensity: 0, timer: 0 }
        };
    }
    
    /**
     * Activate off-track warning for player
     * @param {string} playerId - 'player1' or 'player2'
     * @param {number} intensity - Warning intensity (0-1)
     */
    activateWarning(playerId, intensity = 1.0) {
        if (!this.warnings[playerId]) return;
        
        this.warnings[playerId].active = true;
        this.warnings[playerId].intensity = intensity;
        this.warnings[playerId].timer = 0;
    }
    
    /**
     * Deactivate off-track warning for player
     * @param {string} playerId - 'player1' or 'player2'
     */
    deactivateWarning(playerId) {
        if (!this.warnings[playerId]) return;
        
        this.warnings[playerId].active = false;
        this.warnings[playerId].intensity = 0;
    }
    
    /**
     * Update warning effects
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        Object.keys(this.warnings).forEach(playerId => {
            const warning = this.warnings[playerId];
            if (warning.active) {
                warning.timer += deltaTime;
            }
        });
    }
    
    /**
     * Render warning effects
     */
    render() {
        const screenWidth = this.canvas.width;
        const screenHeight = this.canvas.height;
        
        // Player 1 warning (left side)
        if (this.warnings.player1.active) {
            this.renderWarningOverlay(0, 0, screenWidth / 2, screenHeight, 
                this.warnings.player1.intensity, this.warnings.player1.timer);
        }
        
        // Player 2 warning (right side)
        if (this.warnings.player2.active) {
            this.renderWarningOverlay(screenWidth / 2, 0, screenWidth / 2, screenHeight, 
                this.warnings.player2.intensity, this.warnings.player2.timer);
        }
    }
    
    /**
     * Render warning overlay for specific area
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {number} intensity - Warning intensity
     * @param {number} timer - Animation timer
     */
    renderWarningOverlay(x, y, width, height, intensity, timer) {
        this.ctx.save();
        
        // Pulsing red overlay
        const pulseAlpha = (Math.sin(timer * 8) + 1) * 0.5 * intensity * 0.3;
        this.ctx.fillStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
        this.ctx.fillRect(x, y, width, height);
        
        // Warning border
        this.ctx.strokeStyle = `rgba(255, 255, 0, ${intensity * 0.8})`;
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([10, 10]);
        this.ctx.lineDashOffset = timer * 20;
        this.ctx.strokeRect(x + 5, y + 5, width - 10, height - 10);
        
        this.ctx.restore();
    }
}

/**
 * VictoryEffect Class - Handles victory celebration effects
 */
class VictoryEffect extends ParticleSystem {
    constructor(canvas) {
        super(canvas, 200);
        this.celebrationColors = ['#ffd700', '#ffff00', '#ff6600', '#ff0066', '#6600ff', '#0066ff'];
        this.isVictoryActive = false;
        this.victoryTimer = 0;
    }
    
    /**
     * Start victory celebration
     * @param {string} winner - 'player1' or 'player2'
     */
    startVictoryCelebration(winner) {
        this.isVictoryActive = true;
        this.victoryTimer = 0;
        this.winner = winner;
        this.start();
        
        // Create initial burst of confetti
        this.createConfettiBurst();
    }
    
    /**
     * Stop victory celebration
     */
    stopVictoryCelebration() {
        this.isVictoryActive = false;
        this.stop();
    }
    
    /**
     * Create confetti burst effect
     */
    createConfettiBurst() {
        const screenWidth = this.canvas.width;
        const screenHeight = this.canvas.height;
        
        // Create confetti from top of screen
        for (let i = 0; i < 50; i++) {
            const particle = this.createParticle({
                x: Math.random() * screenWidth,
                y: -20,
                vx: (Math.random() - 0.5) * 100,
                vy: Math.random() * 50 + 50,
                size: Math.random() * 8 + 4,
                color: this.celebrationColors[Math.floor(Math.random() * this.celebrationColors.length)],
                alpha: 1.0,
                life: Math.random() * 4 + 3,
                maxLife: Math.random() * 4 + 3,
                gravity: 30,
                friction: 0.98,
                type: 'confetti'
            });
            
            this.addParticle(particle);
        }
    }
    
    /**
     * Create firework effect
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createFirework(x, y) {
        const particleCount = 15;
        const color = this.celebrationColors[Math.floor(Math.random() * this.celebrationColors.length)];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = Math.random() * 80 + 40;
            
            const particle = this.createParticle({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                color: color,
                alpha: 1.0,
                life: Math.random() * 2 + 1,
                maxLife: Math.random() * 2 + 1,
                gravity: 20,
                friction: 0.96,
                type: 'firework'
            });
            
            this.addParticle(particle);
        }
    }
    
    /**
     * Update victory effects
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.isVictoryActive) {
            this.victoryTimer += deltaTime;
            
            // Create periodic confetti bursts
            if (this.victoryTimer % 1.5 < deltaTime) {
                this.createConfettiBurst();
            }
            
            // Create random fireworks
            if (Math.random() < 0.02) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height * 0.5;
                this.createFirework(x, y);
            }
        }
    }
    
    /**
     * Render victory text overlay
     */
    renderVictoryText() {
        if (!this.isVictoryActive) return;
        
        this.ctx.save();
        
        const screenWidth = this.canvas.width;
        const screenHeight = this.canvas.height;
        
        // Victory text
        const winnerText = this.winner === 'player1' ? 'Player 1 승리!' : 'Player 2 승리!';
        
        // Text shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(winnerText, screenWidth / 2 + 3, screenHeight / 2 + 3);
        
        // Main text with rainbow effect
        const hue = (this.victoryTimer * 100) % 360;
        this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        this.ctx.fillText(winnerText, screenWidth / 2, screenHeight / 2);
        
        // Subtitle
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('축하합니다!', screenWidth / 2, screenHeight / 2 + 60);
        
        this.ctx.restore();
    }
}

/**
 * PersonalRecordEffect Class - Handles personal record achievement effects
 */
class PersonalRecordEffect extends ParticleSystem {
    constructor(canvas) {
        super(canvas, 100);
        this.recordColors = ['#ffd700', '#ffaa00', '#ffffff'];
        this.activeRecords = [];
    }
    
    /**
     * Show personal record achievement
     * @param {string} playerId - 'player1' or 'player2'
     * @param {string} recordType - 'best_lap', 'fastest_speed', etc.
     * @param {string} value - Record value to display
     */
    showPersonalRecord(playerId, recordType, value) {
        const screenWidth = this.canvas.width;
        const screenHeight = this.canvas.height;
        
        const side = playerId === 'player1' ? 'left' : 'right';
        const x = side === 'left' ? screenWidth / 4 : screenWidth * 3 / 4;
        const y = screenHeight / 3;
        
        // Add to active records
        this.activeRecords.push({
            playerId,
            recordType,
            value,
            x,
            y,
            timer: 0,
            duration: 3000, // 3 seconds
            side
        });
        
        // Create celebration particles
        this.createRecordCelebration(x, y);
    }
    
    /**
     * Create celebration particles for record achievement
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createRecordCelebration(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = Math.random() * 60 + 30;
            
            const particle = this.createParticle({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 6 + 3,
                color: this.recordColors[Math.floor(Math.random() * this.recordColors.length)],
                alpha: 1.0,
                life: Math.random() * 2 + 1,
                maxLife: Math.random() * 2 + 1,
                gravity: 15,
                friction: 0.97,
                type: 'record'
            });
            
            this.addParticle(particle);
        }
    }
    
    /**
     * Update personal record effects
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update active record displays
        for (let i = this.activeRecords.length - 1; i >= 0; i--) {
            const record = this.activeRecords[i];
            record.timer += deltaTime * 1000;
            
            if (record.timer >= record.duration) {
                this.activeRecords.splice(i, 1);
            }
        }
    }
    
    /**
     * Render personal record notifications
     */
    renderRecordNotifications() {
        if (this.activeRecords.length === 0) return;
        
        this.ctx.save();
        
        this.activeRecords.forEach(record => {
            const progress = record.timer / record.duration;
            const alpha = progress < 0.8 ? 1.0 : (1.0 - progress) / 0.2;
            
            // Background
            this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.8})`;
            this.ctx.fillRect(record.x - 100, record.y - 30, 200, 60);
            
            // Border
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(record.x - 100, record.y - 30, 200, 60);
            
            // Text
            this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('개인 기록!', record.x, record.y - 5);
            this.ctx.font = '14px Arial';
            this.ctx.fillText(record.value, record.x, record.y + 15);
        });
        
        this.ctx.restore();
    }
}

/**
 * VisualEffectsManager Class - Main manager for all visual effects
 */
class VisualEffectsManager {
    constructor(leftCanvas, rightCanvas) {
        this.leftCanvas = leftCanvas;
        this.rightCanvas = rightCanvas;
        
        // Initialize effect systems for both screens
        this.effects = {
            left: {
                tireSmoke: new TireSmokeEffect(leftCanvas),
                skidMarks: new SkidMarkRenderer(leftCanvas),
                collision: new CollisionEffect(leftCanvas),
                offTrack: new OffTrackWarning(leftCanvas),
                victory: new VictoryEffect(leftCanvas),
                personalRecord: new PersonalRecordEffect(leftCanvas)
            },
            right: {
                tireSmoke: new TireSmokeEffect(rightCanvas),
                skidMarks: new SkidMarkRenderer(rightCanvas),
                collision: new CollisionEffect(rightCanvas),
                offTrack: new OffTrackWarning(rightCanvas),
                victory: new VictoryEffect(rightCanvas),
                personalRecord: new PersonalRecordEffect(rightCanvas)
            }
        };
        
        this.isActive = false;
    }
    
    /**
     * Initialize visual effects system
     */
    initialize() {
        this.isActive = true;
        
        // Start all particle systems
        Object.keys(this.effects).forEach(side => {
            Object.keys(this.effects[side]).forEach(effectType => {
                const effect = this.effects[side][effectType];
                if (effect.start) {
                    effect.start();
                }
            });
        });
        
        console.log('Visual Effects Manager initialized');
    }
    
    /**
     * Update all visual effects
     * @param {number} deltaTime - Time since last update
     * @param {Object} gameState - Current game state
     */
    update(deltaTime, gameState) {
        if (!this.isActive) return;
        
        // Update effects for both sides
        Object.keys(this.effects).forEach(side => {
            Object.keys(this.effects[side]).forEach(effectType => {
                const effect = this.effects[side][effectType];
                if (effect.update) {
                    effect.update(deltaTime);
                }
            });
        });
        
        // Process game state for automatic effects
        this.processGameState(gameState, deltaTime);
    }
    
    /**
     * Render all visual effects
     */
    render() {
        if (!this.isActive) return;
        
        // Render effects for both sides
        Object.keys(this.effects).forEach(side => {
            Object.keys(this.effects[side]).forEach(effectType => {
                const effect = this.effects[side][effectType];
                if (effect.render) {
                    effect.render();
                }
                if (effect.renderVictoryText) {
                    effect.renderVictoryText();
                }
                if (effect.renderRecordNotifications) {
                    effect.renderRecordNotifications();
                }
            });
        });
    }
    
    /**
     * Process game state for automatic effect triggers
     * @param {Object} gameState - Current game state
     * @param {number} deltaTime - Time since last update
     */
    processGameState(gameState, deltaTime) {
        if (!gameState || !gameState.players) return;
        
        // Process player 1 effects
        if (gameState.players.player1) {
            this.processPlayerEffects('player1', gameState.players.player1, 'left', deltaTime);
        }
        
        // Process player 2 effects
        if (gameState.players.player2) {
            this.processPlayerEffects('player2', gameState.players.player2, 'right', deltaTime);
        }
    }
    
    /**
     * Process effects for individual player
     * @param {string} playerId - Player ID
     * @param {Object} playerData - Player data
     * @param {string} side - Screen side
     * @param {number} deltaTime - Time since last update
     */
    processPlayerEffects(playerId, playerData, side, deltaTime) {
        if (!playerData.car) return;
        
        const car = playerData.car;
        const effects = this.effects[side];
        
        // Tire smoke and drift effects
        if (car.isDrifting || Math.abs(car.lateralVelocity) > 20) {
            const driftIntensity = Math.min(Math.abs(car.lateralVelocity) / 50, 1.0);
            effects.tireSmoke.createDriftEffect(car, car.lateralVelocity, side);
            effects.skidMarks.addSkidMark(car, driftIntensity, side);
        }
        
        // Off-track warning
        if (car.isOffTrack) {
            effects.offTrack.activateWarning(playerId, 1.0);
        } else {
            effects.offTrack.deactivateWarning(playerId);
        }
    }
    
    /**
     * Trigger collision effect
     * @param {string} playerId - Player ID
     * @param {string} collisionType - Type of collision
     * @param {Object} car - Car object
     */
    triggerCollisionEffect(playerId, collisionType, car) {
        const side = playerId === 'player1' ? 'left' : 'right';
        const effects = this.effects[side];
        
        effects.collision.createCollisionImpact(car, collisionType, side);
    }
    
    /**
     * Trigger victory celebration
     * @param {string} winner - Winner player ID
     */
    triggerVictoryCelebration(winner) {
        // Show victory effect on both screens
        this.effects.left.victory.startVictoryCelebration(winner);
        this.effects.right.victory.startVictoryCelebration(winner);
    }
    
    /**
     * Trigger personal record achievement
     * @param {string} playerId - Player ID
     * @param {string} recordType - Type of record
     * @param {string} value - Record value
     */
    triggerPersonalRecord(playerId, recordType, value) {
        const side = playerId === 'player1' ? 'left' : 'right';
        const effects = this.effects[side];
        
        effects.personalRecord.showPersonalRecord(playerId, recordType, value);
    }
    
    /**
     * Clear all effects
     */
    clearAllEffects() {
        Object.keys(this.effects).forEach(side => {
            Object.keys(this.effects[side]).forEach(effectType => {
                const effect = this.effects[side][effectType];
                if (effect.clear) {
                    effect.clear();
                }
                if (effect.stop) {
                    effect.stop();
                }
            });
        });
    }
    
    /**
     * Cleanup visual effects system
     */
    cleanup() {
        this.clearAllEffects();
        this.isActive = false;
        console.log('Visual Effects Manager cleaned up');
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ParticleSystem,
        VisualEffectsManager,
        TireSmokeEffect,
        SkidMarkRenderer,
        CollisionEffect,
        OffTrackWarning,
        VictoryEffect,
        PersonalRecordEffect
    };
}

// Global exports for browser environment
if (typeof window !== 'undefined') {
    window.ParticleSystem = ParticleSystem;
    window.TireSmokeEffect = TireSmokeEffect;
    window.SkidMarkRenderer = SkidMarkRenderer;
    window.CollisionEffect = CollisionEffect;
    window.OffTrackWarning = OffTrackWarning;
    window.VictoryEffect = VictoryEffect;
    window.PersonalRecordEffect = PersonalRecordEffect;
    window.VisualEffectsManager = VisualEffectsManager;
}