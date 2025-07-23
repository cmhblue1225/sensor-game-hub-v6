
import * as THREE from 'three';

export function createEnvironment(scene) {
    const floorGeometry = new THREE.PlaneGeometry(20, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e293b,
        transparent: true,
        opacity: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    for (let i = 0; i < 2; i++) {
        const wallGeometry = new THREE.PlaneGeometry(50, 10);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x334155,
            transparent: true,
            opacity: 0.5
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(i === 0 ? -10 : 10, 4, 0);
        wall.rotation.y = i === 0 ? Math.PI / 2 : -Math.PI / 2;
        scene.add(wall);
    }
}
