
import * as THREE from 'three';
import { SENSOR1_COLOR, SENSOR2_COLOR, COOPERATION_COLOR } from '../shared/constants.js';

export function createNote(noteData) {
    let geometry, material, position;

    if (noteData.type === 'cooperation') {
        geometry = new THREE.SphereGeometry(0.8, 8, 8);
        material = new THREE.MeshBasicMaterial({ 
            color: COOPERATION_COLOR,
            transparent: true,
            opacity: 0.8
        });
        position = new THREE.Vector3(0, 1.5, -20);
    } else {
        geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const color = noteData.lane === 'sensor1' ? SENSOR1_COLOR : SENSOR2_COLOR;
        material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.9
        });
        const x = noteData.lane === 'sensor1' ? -2 : 2;
        position = new THREE.Vector3(x, 1.5, -20);
    }

    const note = new THREE.Mesh(geometry, material);
    note.position.copy(position);
    note.userData = { ...noteData };

    return note;
}
