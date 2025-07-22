import { GAME_CONFIG, COLORS } from '../shared/config.js';

export class GamePage {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.notes = [];
        this.particleEffects = [];
        this.timingGuidelines = {};
        this.noteSpawnIndex = 0;
        this.beatmap = [];
        
        this.initializeScene();
    }

    initializeScene() {
        // Scene 설정
        this.scene.fog = new THREE.Fog(COLORS.BACKGROUND, 10, 50);
        
        // Camera 설정
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer 설정
        this.renderer.setClearColor(COLORS.BACKGROUND);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 조명 설정
        this.setupLighting();
        
        // 환경 생성
        this.createEnvironment();
        
        // 타이밍 가이드라인 생성
        this.createTimingGuidelines();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    createEnvironment() {
        // 바닥 생성
        const floorGeometry = new THREE.PlaneGeometry(20, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a2e,
            metalness: 0.3,
            roughness: 0.7
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // 벽 생성
        for (let i = 0; i < 2; i++) {
            const wallGeometry = new THREE.PlaneGeometry(50, 10);
            const wallMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x16213e,
                metalness: 0.2,
                roughness: 0.8
            });
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            
            if (i === 0) {
                wall.position.set(-10, 4, 0);
                wall.rotation.y = Math.PI / 2;
            } else {
                wall.position.set(10, 4, 0);
                wall.rotation.y = -Math.PI / 2;
            }
            
            wall.receiveShadow = true;
            this.scene.add(wall);
        }
    }

    createTimingGuidelines() {
        const guidelineTypes = ['sensor1', 'sensor2', 'cooperation'];
        
        guidelineTypes.forEach((type, index) => {
            const guidelineGroup = new THREE.Group();
            
            // 히트 존 표시
            const hitZoneGeometry = new THREE.PlaneGeometry(1.5, 3);
            const hitZoneMaterial = new THREE.MeshBasicMaterial({
                color: type === 'cooperation' ? COLORS.COOPERATION : 
                       type === 'sensor1' ? COLORS.SENSOR1 : COLORS.SENSOR2,
                transparent: true,
                opacity: 0.2
            });
            const hitZone = new THREE.Mesh(hitZoneGeometry, hitZoneMaterial);
            hitZone.position.set(type === 'sensor1' ? -2 : type === 'sensor2' ? 2 : 0, 1.5, 3.5);
            
            // 중앙 원형 가이드
            const centerCircleGeometry = new THREE.CircleGeometry(0.6, 16);
            const centerCircleMaterial = new THREE.MeshBasicMaterial({
                color: COLORS.GUIDELINE,
                transparent: true,
                opacity: 0.4
            });
            const centerCircle = new THREE.Mesh(centerCircleGeometry, centerCircleMaterial);
            centerCircle.position.copy(hitZone.position);
            centerCircle.position.z = 3.6;
            
            // 경계선 표시
            for (let i = 0; i < 2; i++) {
                const borderGeometry = new THREE.PlaneGeometry(1.5, 0.1);
                const borderMaterial = new THREE.MeshBasicMaterial({
                    color: COLORS.GUIDELINE,
                    transparent: true,
                    opacity: 0.6
                });
                const border = new THREE.Mesh(borderGeometry, borderMaterial);
                border.position.copy(hitZone.position);
                border.position.y += (i === 0 ? 1.5 : -1.5);
                border.position.z = 3.6;
                guidelineGroup.add(border);
            }
            
            // 노트 트랙 표시
            const trackGeometry = new THREE.PlaneGeometry(0.8, 40);
            const trackMaterial = new THREE.MeshBasicMaterial({
                color: type === 'cooperation' ? COLORS.COOPERATION : 
                       type === 'sensor1' ? COLORS.SENSOR1 : COLORS.SENSOR2,
                transparent: true,
                opacity: 0.1
            });
            const track = new THREE.Mesh(trackGeometry, trackMaterial);
            track.position.set(type === 'sensor1' ? -2 : type === 'sensor2' ? 2 : 0, 1.5, -15);
            
            // 비트 인디케이터 추가
            for (let i = 1; i <= 3; i++) {
                const beatGeometry = new THREE.CircleGeometry(0.2, 8);
                const beatMaterial = new THREE.MeshBasicMaterial({
                    color: COLORS.GUIDELINE,
                    transparent: true,
                    opacity: 0.3
                });
                const beatIndicator = new THREE.Mesh(beatGeometry, beatMaterial);
                beatIndicator.position.copy(track.position);
                beatIndicator.position.z = 3.5 - (i * 2);
                guidelineGroup.add(beatIndicator);
            }
            
            guidelineGroup.add(hitZone);
            guidelineGroup.add(centerCircle);
            guidelineGroup.add(track);
            
            guidelineGroup.userData = {
                type: type,
                active: false,
                hitEffect: false,
                hitEffectTime: 0,
                pulsePhase: 0
            };
            
            this.timingGuidelines[type] = guidelineGroup;
            this.scene.add(guidelineGroup);
        });
    }

    setBeatmap(beatmap) {
        this.beatmap = beatmap;
        this.noteSpawnIndex = 0;
    }

    update(gameState, musicSystem) {
        const delta = GAME_CONFIG.NOTE_SPEED;
        
        // 노트 업데이트 및 제거
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            note.update(delta);
            
            // 가이드라인과 노트 매칭 체크
            this.updateGuidelineForNote(note);
            
            // 놓친 노트 처리
            if (note.mesh.position.z > 6) {
                this.scene.remove(note.mesh);
                this.scene.remove(note.glow);
                this.notes.splice(i, 1);
                note.dispose();
                
                // 놓친 노트에 해당하는 가이드라인 비활성화
                this.deactivateGuideline(note.data);
            }
        }
        
        // 새 노트 생성
        this.spawnNote(gameState, musicSystem);
        
        // 파티클 효과 업데이트
        this.updateParticles();
        
        // 가이드라인 애니메이션 업데이트
        this.updateTimingGuidelines();
    }

    spawnNote(gameState, musicSystem) {
        if (this.noteSpawnIndex >= this.beatmap.length) return;
        
        const now = Date.now();
        const elapsedTime = (now - gameState.startTime) / 1000;
        const noteData = this.beatmap[this.noteSpawnIndex];
        
        const PREDICTIVE_SPAWN_OFFSET = 0.1;
        const adjustedNoteTime = Math.max(0, noteData.time - PREDICTIVE_SPAWN_OFFSET);
        
        const musicCurrentTime = musicSystem.isLoaded() && musicSystem.isPlaying() ? 
                                musicSystem.getCurrentTime() : elapsedTime;
        const syncedTime = musicSystem.isLoaded() ? musicCurrentTime : elapsedTime;
        
        if (syncedTime >= adjustedNoteTime) {
            const Note = (await import('../entities/note.js')).Note;
            const note = new Note(noteData);
            
            this.scene.add(note.mesh);
            this.scene.add(note.glow);
            this.notes.push(note);
            
            this.noteSpawnIndex++;
        }
    }

    updateGuidelineForNote(note) {
        const noteData = note.data;
        const distanceToHitPoint = Math.abs(note.mesh.position.z - 3.5);
        
        if (distanceToHitPoint < 4) {
            const guidelineType = noteData.type === 'cooperation' ? 'cooperation' : 
                                 noteData.lane === 'both' ? 'cooperation' : noteData.lane;
            
            this.activateGuideline(guidelineType, distanceToHitPoint);
        }
    }

    activateGuideline(guidelineType, distance) {
        const guideline = this.timingGuidelines[guidelineType];
        if (guideline) {
            guideline.userData.active = true;
            
            const intensity = Math.max(0, 1 - (distance / 3));
            
            const hitPoint = guideline.children.find(child => 
                child.geometry instanceof THREE.CircleGeometry
            );
            
            if (hitPoint) {
                hitPoint.userData.pulsePhase = Date.now() * 0.01;
                const pulse = 0.6 + (Math.sin(hitPoint.userData.pulsePhase) * 0.4 * intensity);
                hitPoint.material.opacity = pulse;
            }
        }
    }

    deactivateGuideline(noteData) {
        const guidelineType = noteData.type === 'cooperation' ? 'cooperation' : 
                             noteData.lane === 'both' ? 'cooperation' : noteData.lane;
        
        const guideline = this.timingGuidelines[guidelineType];
        if (guideline) {
            guideline.userData.active = false;
            
            guideline.children.forEach(child => {
                if (child.material && child.material.opacity !== undefined) {
                    child.material.opacity *= 0.3;
                }
            });
        }
    }

    updateTimingGuidelines() {
        Object.values(this.timingGuidelines).forEach(guideline => {
            if (guideline.userData.active) {
                const time = Date.now() * 0.002;
                const pulse = 0.7 + (Math.sin(time) * 0.3);
                
                guideline.children.forEach(child => {
                    if (child.material && child.material.opacity !== undefined) {
                        child.material.opacity = pulse * 0.6;
                    }
                });
                
                const elapsedTime = (Date.now() - gameState.startTime) / 1000;
                const beatTime = elapsedTime % this.beatInterval;
                const beatPulse = beatTime < 0.1 ? 1.5 : 1.0;
                
                guideline.children.forEach(child => {
                    if (child.geometry instanceof THREE.CircleGeometry) {
                        child.scale.setScalar(beatPulse);
                    }
                });
            }
            
            if (guideline.userData.hitEffect) {
                const timeSinceHit = Date.now() - guideline.userData.hitEffectTime;
                
                if (timeSinceHit < 500) {
                    const flash = 0.8 + (Math.sin(Date.now() * 0.01) * 0.2);
                    guideline.children.forEach(child => {
                        if (child.material && child.material.opacity !== undefined) {
                            child.material.opacity = flash;
                        }
                    });
                } else {
                    guideline.userData.hitEffect = false;
                }
            }
        });
    }

    updateParticles() {
        for (let i = this.particleEffects.length - 1; i >= 0; i--) {
            const particleGroup = this.particleEffects[i];
            let allDead = true;
            
            particleGroup.children.forEach(particle => {
                if (particle.userData.life > 0) {
                    allDead = false;
                    particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.02));
                    particle.userData.life -= GAME_CONFIG.EFFECT_FADE_SPEED;
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

    checkNoteHit(saber, sensorId) {
        let hit = false;
        
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            
            if (note.checkHit(saber.mesh)) {
                if (note.markAsHit(sensorId)) {
                    // 노트 히트 처리
                    const accuracy = note.getHitAccuracy();
                    this.scene.remove(note.mesh);
                    this.scene.remove(note.glow);
                    this.notes.splice(i, 1);
                    
                    // 이펙트 생성
                    this.createHitEffect(note.mesh.position, accuracy, note.data.type === 'cooperation');
                    this.createHitTrail(saber.mesh.position, note.mesh.position);
                    
                    note.dispose();
                    hit = true;
                    
                    return { hit: true, accuracy, note: note.data };
                }
            }
        }
        
        return { hit: false };
    }

    createHitEffect(position, accuracy, isCooperation) {
        // 히트 링 생성
        const ringGeometry = new THREE.RingGeometry(0.5, 0.7, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: isCooperation ? COLORS.COOPERATION : COLORS.HIT_EFFECT,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        
        ring.userData = { startTime: Date.now(), duration: 300 };
        this.scene.add(ring);
        
        const animateRing = () => {
            const elapsed = Date.now() - ring.userData.startTime;
            const progress = elapsed / ring.userData.duration;
            
            if (progress >= 1) {
                this.scene.remove(ring);
                return;
            }
            
            const scale = 1 + (progress * 3);
            ring.scale.setScalar(scale);
            ring.material.opacity = 0.8 * (1 - progress);
            
            requestAnimationFrame(animateRing);
        };
        
        animateRing();
    }

    createHitTrail(startPos, endPos) {
        const trailGeometry = new THREE.PlaneGeometry(0.1, 2);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.HIT_EFFECT,
            transparent: true,
            opacity: 0.8
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.copy(startPos);
        this.scene.add(trail);
        
        const fadeOut = () => {
            trail.material.opacity -= 0.05;
            if (trail.material.opacity <= 0) {
                this.scene.remove(trail);
            } else {
                requestAnimationFrame(fadeOut);
            }
        };
        
        requestAnimationFrame(fadeOut);
    }

    dispose() {
        // 정리 작업
        this.notes.forEach(note => {
            this.scene.remove(note.mesh);
            this.scene.remove(note.glow);
            note.dispose();
        });
        
        this.particleEffects.forEach(effect => {
            this.scene.remove(effect);
        });
        
        Object.values(this.timingGuidelines).forEach(guideline => {
            this.scene.remove(guideline);
        });
    }
}