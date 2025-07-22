import { COLORS } from '../shared/config.js';

export class Note {
    constructor(noteData) {
        this.data = noteData;
        this.mesh = this.createNoteMesh();
        this.glow = this.createGlowMesh();
        this.isHit = false;
    }

    createNoteMesh() {
        let geometry, material;
        
        if (this.data.type === 'cooperation') {
            // 협력 노트 - 특별한 모양
            geometry = new THREE.OctahedronGeometry(0.4);
            material = new THREE.MeshBasicMaterial({ 
                color: COLORS.COOPERATION,
                transparent: true,
                opacity: 0.9
            });
        } else {
            // 일반 노트
            geometry = new THREE.SphereGeometry(0.3, 16, 16);
            const color = this.data.lane === 'sensor1' ? COLORS.SENSOR1 : COLORS.SENSOR2;
            material = new THREE.MeshBasicMaterial({ 
                color: color,
                transparent: true,
                opacity: 0.8
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        
        // 위치 설정
        const x = this.data.lane === 'sensor1' ? -2 : 
                 this.data.lane === 'sensor2' ? 2 : 0;
        mesh.position.set(x, 1.5, -15);
        
        // 노트 데이터 저장
        mesh.userData = {
            ...this.data,
            hitTimes: this.data.type === 'cooperation' ? [] : null
        };
        
        return mesh;
    }

    createGlowMesh() {
        const glowGeometry = this.mesh.geometry.clone();
        const color = this.data.type === 'cooperation' ? COLORS.COOPERATION :
                     this.data.lane === 'sensor1' ? COLORS.SENSOR1 : COLORS.SENSOR2;
        
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.scale.setScalar(1.2);
        glow.position.copy(this.mesh.position);
        
        return glow;
    }

    update(delta) {
        // 노트를 아래로 이동
        this.mesh.position.z += delta;
        this.glow.position.z += delta;
        
        // 글로우 효과 애니메이션
        const time = Date.now() * 0.003;
        const pulseFactor = 0.8 + Math.sin(time) * 0.2;
        this.glow.scale.setScalar(1.2 * pulseFactor);
        this.glow.material.opacity = 0.2 + Math.sin(time) * 0.1;
    }

    checkHit(saber) {
        if (this.isHit) return false;
        
        const hitRange = this.data.type === 'cooperation' ? 2.5 : 2;
        const distance = this.mesh.position.distanceTo(saber.position);
        
        return distance < hitRange;
    }

    markAsHit(sensorId) {
        if (this.data.type === 'cooperation') {
            if (!this.data.hitTimes) {
                this.data.hitTimes = [];
            }
            this.data.hitTimes.push(Date.now());
            
            // 두 센서 모두 히트해야 완전한 히트
            return this.data.hitTimes.length >= 2;
        } else {
            this.isHit = true;
            return true;
        }
    }

    getHitAccuracy() {
        const distanceToHitPoint = Math.abs(this.mesh.position.z - 3.5);
        
        if (distanceToHitPoint < 0.5) return 'perfect';
        if (distanceToHitPoint < 1.0) return 'great';
        if (distanceToHitPoint < 1.5) return 'good';
        return 'miss';
    }

    dispose() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.glow.geometry.dispose();
        this.glow.material.dispose();
    }
}