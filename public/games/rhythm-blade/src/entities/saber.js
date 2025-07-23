
import * as THREE from 'three';
import { SENSOR1_COLOR, SENSOR2_COLOR } from '../shared/constants.js';

export function createSaber(color, xPosition) {
    const saberGroup = new THREE.Group();

    const hiltGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.6, 8);
    const hiltMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2
    });
    const hilt = new THREE.Mesh(hiltGeometry, hiltMaterial);
    hilt.position.y = -0.3;

    const bladeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
    const bladeMaterial = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.8
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = 1;

    const glowGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 1;

    saberGroup.add(hilt);
    saberGroup.add(blade);
    saberGroup.add(glow);

    saberGroup.position.set(xPosition, 1.5, 3);
    saberGroup.rotation.x = THREE.MathUtils.degToRad(-15);

    saberGroup.userData = { 
        swinging: false, 
        swingTime: 0,
        sensorId: xPosition < 0 ? 'sensor1' : 'sensor2'
    };

    return saberGroup;
}
