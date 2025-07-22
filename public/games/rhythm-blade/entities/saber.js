import { COLORS, GAME_CONFIG } from '../shared/config.js';

export class Saber {
    constructor(color, xPosition, sensorId) {
        this.sensorId = sensorId;
        this.color = color;
        this.xPosition = xPosition;
        this.mesh = this.createSaber();
        this.isSwinging = false;
        this.swingTime = 0;
    }

    createSaber() {
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
            color: this.color,
            transparent: true,
            opacity: 0.8
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 1;
        
        // 세이버 광선 효과
        const glowGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: this.color,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 1;
        
        saberGroup.add(hilt);
        saberGroup.add(blade);
        saberGroup.add(glow);
        
        saberGroup.position.set(this.xPosition, 1.5, 3);
        saberGroup.rotation.x = THREE.MathUtils.degToRad(-15);
        
        saberGroup.userData = { 
            swinging: false, 
            swingTime: 0,
            sensorId: this.sensorId
        };
        
        return saberGroup;
    }

    triggerSwing() {
        if (!this.isSwinging) {
            this.isSwinging = true;
            this.swingTime = Date.now();
            this.mesh.userData.swinging = true;
            this.mesh.userData.swingTime = this.swingTime;
        }
    }

    update() {
        if (this.isSwinging) {
            const now = Date.now();
            const timeSinceSwing = now - this.swingTime;
            
            if (timeSinceSwing < GAME_CONFIG.SWING_DURATION) {
                const progress = timeSinceSwing / GAME_CONFIG.SWING_DURATION;
                const baseAngle = Math.sin(progress * Math.PI) * 45;
                
                let angle;
                if (this.sensorId === 'sensor1') {
                    angle = -baseAngle;  // 왼쪽 세이버는 오른쪽으로 스윙
                } else {
                    angle = baseAngle;   // 오른쪽 세이버는 왼쪽으로 스윙
                }
                
                this.mesh.rotation.z = THREE.MathUtils.degToRad(angle);
            } else {
                this.isSwinging = false;
                this.mesh.userData.swinging = false;
                this.mesh.rotation.z = 0;
            }
        }
    }
}