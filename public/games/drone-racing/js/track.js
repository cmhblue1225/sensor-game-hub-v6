/**
 * 🏁 드론 레이싱 트랙 시스템
 * 
 * 체크포인트, 부스터 존, 장애물 등 트랙 요소 관리
 */
class RacingTrack {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;

        // 트랙 요소들
        this.checkpoints = [];
        this.boosterZones = [];
        this.obstacles = [];
        this.boundaries = [];

        // 트랙 설정
        this.trackConfig = {
            checkpointCount: 8,
            boosterZoneCount: 3,
            obstacleCount: 5,
            trackWidth: 30,
            trackLength: 200
        };

        console.log('🏁 레이싱 트랙 초기화');
    }

    /**
     * 트랙 생성
     */
    createTrack() {
        this.createCheckpoints();
        this.createBoosterZones();
        this.createObstacles();
        this.createBoundaries();
        console.log('🏁 레이싱 트랙 생성 완료');
    }

    /**
     * 체크포인트 생성
     */
    createCheckpoints() {
        const radius = this.trackConfig.trackWidth * 0.8;

        // 원형 트랙을 따라 체크포인트 배치
        for (let i = 0; i < this.trackConfig.checkpointCount; i++) {
            const angle = (i / this.trackConfig.checkpointCount) * Math.PI * 2;
            const x = Math.cos(angle) * this.trackConfig.trackLength * 0.5;
            const z = Math.sin(angle) * this.trackConfig.trackLength * 0.5;

            // 체크포인트 생성
            const checkpoint = this.createCheckpoint(x, 10, z, radius, i);
            this.checkpoints.push(checkpoint);
        }

        console.log(`✅ ${this.checkpoints.length}개의 체크포인트 생성됨`);
    }

    /**
     * 개별 체크포인트 생성
     */
    createCheckpoint(x, y, z, radius, index) {
        // 체크포인트 링 생성
        const geometry = new THREE.TorusGeometry(radius, 1, 16, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00aaaa,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        const checkpoint = new THREE.Mesh(geometry, material);
        checkpoint.position.set(x, y, z);

        // 체크포인트 번호에 따라 회전 조정
        if (index === 0) {
            // 시작/종료 체크포인트는 수직으로
            checkpoint.rotation.x = Math.PI / 2;
        } else {
            // 트랙 방향을 향하도록 회전
            checkpoint.lookAt(0, y, 0);
            checkpoint.rotation.y += Math.PI / 2;
        }

        // 체크포인트 데이터
        checkpoint.userData = {
            type: 'checkpoint',
            index: index,
            radius: radius,
            isStart: index === 0,
            isActive: true
        };

        this.scene.add(checkpoint);

        // 체크포인트 표시등 추가
        this.addCheckpointLights(checkpoint, index);

        return checkpoint;
    }

    /**
     * 체크포인트 표시등 추가
     */
    addCheckpointLights(checkpoint, index) {
        const color = index === 0 ? 0xffff00 : 0x00ffff;
        const intensity = index === 0 ? 2 : 1;

        // 포인트 라이트 추가
        const light = new THREE.PointLight(color, intensity, 20);
        light.position.copy(checkpoint.position);
        this.scene.add(light);

        // 애니메이션을 위한 기본 강도 저장
        light.userData.baseIntensity = intensity;

        return light;
    }

    /**
     * 부스터 존 생성
     */
    createBoosterZones() {
        // 트랙을 따라 부스터 존 배치
        for (let i = 0; i < this.trackConfig.boosterZoneCount; i++) {
            // 체크포인트 사이에 부스터 존 배치
            const checkpointIndex = Math.floor((i + 0.5) * this.checkpoints.length / this.trackConfig.boosterZoneCount);
            const checkpoint = this.checkpoints[checkpointIndex];

            if (checkpoint) {
                const position = checkpoint.position.clone();
                position.y = 1; // 지면에 가깝게

                // 부스터 존 생성
                const boosterZone = this.createBoosterZone(position);
                this.boosterZones.push(boosterZone);
            }
        }

        console.log(`🚀 ${this.boosterZones.length}개의 부스터 존 생성됨`);
    }

    /**
     * 개별 부스터 존 생성
     */
    createBoosterZone(position) {
        // 부스터 존 생성
        const geometry = new THREE.RingGeometry(5, 10, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff5500,
            emissive: 0xff2200,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        const boosterZone = new THREE.Mesh(geometry, material);
        boosterZone.position.copy(position);
        boosterZone.rotation.x = -Math.PI / 2; // 바닥에 평행하게

        // 부스터 존 데이터
        boosterZone.userData = {
            type: 'boosterZone',
            radius: 10,
            energyValue: 30,
            isActive: true,
            lastActivated: 0
        };

        this.scene.add(boosterZone);

        // 부스터 존 표시등 추가
        const light = new THREE.PointLight(0xff5500, 1.5, 15);
        light.position.copy(position);
        light.position.y += 2;
        this.scene.add(light);

        // 애니메이션을 위한 기본 강도 저장
        light.userData.baseIntensity = 1.5;
        boosterZone.userData.light = light;

        return boosterZone;
    }

    /**
     * 장애물 생성
     */
    createObstacles() {
        // 트랙을 따라 장애물 배치
        for (let i = 0; i < this.trackConfig.obstacleCount; i++) {
            // 체크포인트 사이에 장애물 배치
            const checkpointIndex = Math.floor((i + 0.3) * this.checkpoints.length / this.trackConfig.obstacleCount);
            const nextCheckpointIndex = (checkpointIndex + 1) % this.checkpoints.length;

            const checkpoint = this.checkpoints[checkpointIndex];
            const nextCheckpoint = this.checkpoints[nextCheckpointIndex];

            if (checkpoint && nextCheckpoint) {
                // 두 체크포인트 사이의 위치 계산
                const position = new THREE.Vector3().addVectors(
                    checkpoint.position,
                    nextCheckpoint.position
                ).multiplyScalar(0.5);

                // 약간의 랜덤 오프셋 추가
                position.x += (Math.random() - 0.5) * 10;
                position.z += (Math.random() - 0.5) * 10;
                position.y = 5 + Math.random() * 10; // 높이 랜덤화

                // 장애물 생성
                const obstacle = this.createObstacle(position);
                this.obstacles.push(obstacle);
            }
        }

        console.log(`🚧 ${this.obstacles.length}개의 장애물 생성됨`);
    }

    /**
     * 개별 장애물 생성
     */
    createObstacle(position) {
        // 장애물 형태 랜덤 선택
        const types = ['box', 'sphere', 'cylinder'];
        const type = types[Math.floor(Math.random() * types.length)];

        let geometry, size;

        switch (type) {
            case 'box':
                size = 3 + Math.random() * 2;
                geometry = new THREE.BoxGeometry(size, size, size);
                break;
            case 'sphere':
                size = 2 + Math.random() * 2;
                geometry = new THREE.SphereGeometry(size, 16, 16);
                break;
            case 'cylinder':
                size = 2 + Math.random() * 2;
                geometry = new THREE.CylinderGeometry(size, size, 4 + Math.random() * 4, 16);
                break;
        }

        // 네온 스타일 재질
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0088,
            emissive: 0xaa0055,
            transparent: true,
            opacity: 0.9
        });

        const obstacle = new THREE.Mesh(geometry, material);
        obstacle.position.copy(position);

        // 랜덤 회전
        obstacle.rotation.x = Math.random() * Math.PI;
        obstacle.rotation.y = Math.random() * Math.PI;
        obstacle.rotation.z = Math.random() * Math.PI;

        // 장애물 데이터
        obstacle.userData = {
            type: 'obstacle',
            size: size,
            shape: type,
            damage: 10
        };

        this.scene.add(obstacle);

        // 물리 바디 추가
        if (this.physics) {
            this.physics.addObstacle(obstacle);
        }

        return obstacle;
    }

    /**
     * 트랙 경계 생성
     */
    createBoundaries() {
        const trackRadius = this.trackConfig.trackLength * 0.6;
        const wallHeight = 20;

        // 원형 경계 생성
        const segments = 32;
        for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2;
            const angle2 = ((i + 1) / segments) * Math.PI * 2;

            const x1 = Math.cos(angle1) * trackRadius;
            const z1 = Math.sin(angle1) * trackRadius;
            const x2 = Math.cos(angle2) * trackRadius;
            const z2 = Math.sin(angle2) * trackRadius;

            // 경계 벽 생성
            const boundary = this.createBoundaryWall(
                x1, 0, z1,
                x2, 0, z2,
                wallHeight
            );
            this.boundaries.push(boundary);
        }

        console.log(`🧱 ${this.boundaries.length}개의 경계 생성됨`);
    }

    /**
     * 경계 벽 생성
     */
    createBoundaryWall(x1, y1, z1, x2, y2, z2, height) {
        // 두 점 사이의 거리 계산
        const point1 = new THREE.Vector3(x1, y1, z1);
        const point2 = new THREE.Vector3(x2, y2, z2);
        const length = point1.distanceTo(point2);

        // 벽 생성
        const geometry = new THREE.BoxGeometry(length, height, 1);
        const material = new THREE.MeshPhongMaterial({
            color: 0x0088ff,
            emissive: 0x0044aa,
            transparent: true,
            opacity: 0.7
        });

        const wall = new THREE.Mesh(geometry, material);

        // 벽 위치 및 회전 설정
        const midpoint = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);
        wall.position.set(midpoint.x, height / 2, midpoint.z);

        // 두 점을 연결하는 방향으로 회전
        wall.lookAt(point2.x, height / 2, point2.z);
        wall.rotation.y += Math.PI / 2;

        // 벽 데이터
        wall.userData = {
            type: 'boundary',
            height: height
        };

        this.scene.add(wall);

        // 물리 바디 추가
        if (this.physics) {
            this.physics.addBoundary(wall);
        }

        return wall;
    }

    /**
     * 체크포인트 통과 확인
     */
    checkCheckpointCollision(dronePosition, droneId) {
        for (const checkpoint of this.checkpoints) {
            const distance = checkpoint.position.distanceTo(dronePosition);

            // 체크포인트 반경 내에 드론이 있는지 확인
            if (distance < checkpoint.userData.radius * 1.5) {
                return {
                    checkpointIndex: checkpoint.userData.index,
                    isStart: checkpoint.userData.isStart
                };
            }
        }
        return null;
    }

    /**
     * 부스터 존 충돌 확인
     */
    checkBoosterZoneCollision(dronePosition, droneId) {
        const now = Date.now();

        for (const boosterZone of this.boosterZones) {
            const distance = new THREE.Vector2(
                dronePosition.x - boosterZone.position.x,
                dronePosition.z - boosterZone.position.z
            ).length();

            // 부스터 존 반경 내에 드론이 있는지 확인
            if (distance < boosterZone.userData.radius) {
                // 재사용 대기 시간 확인 (3초)
                const lastActivated = boosterZone.userData.lastActivated || 0;
                if (now - lastActivated > 3000) {
                    // 부스터 존 활성화
                    boosterZone.userData.lastActivated = now;
                    return {
                        energyValue: boosterZone.userData.energyValue,
                        position: boosterZone.position.clone()
                    };
                }
            }
        }
        return null;
    }

    /**
     * 트랙 경계 확인
     */
    checkTrackBounds(dronePosition) {
        const trackRadius = this.trackConfig.trackLength * 0.6;
        const distance = new THREE.Vector2(dronePosition.x, dronePosition.z).length();

        // 트랙 경계를 벗어났는지 확인
        return distance > trackRadius;
    }

    /**
     * 체크포인트 애니메이션 업데이트
     */
    animateCheckpoints() {
        const time = Date.now() * 0.001;

        this.checkpoints.forEach((checkpoint, index) => {
            // 체크포인트 회전
            checkpoint.rotation.z = time * (index % 2 ? 0.5 : -0.5);

            // 체크포인트 크기 맥동
            const scale = 1 + Math.sin(time * 2 + index) * 0.05;
            checkpoint.scale.set(scale, scale, scale);

            // 체크포인트 빛 강도 변화
            if (checkpoint.userData.light) {
                const baseIntensity = checkpoint.userData.light.userData.baseIntensity || 1;
                checkpoint.userData.light.intensity = baseIntensity + Math.sin(time * 3 + index) * 0.2;
            }
        });
    }

    /**
     * 부스터 존 애니메이션 업데이트
     */
    animateBoosterZones() {
        const time = Date.now() * 0.001;

        this.boosterZones.forEach((boosterZone, index) => {
            // 부스터 존 회전
            boosterZone.rotation.z = time * 0.7;

            // 부스터 존 빛 강도 변화
            if (boosterZone.userData.light) {
                const baseIntensity = boosterZone.userData.light.userData.baseIntensity || 1.5;
                boosterZone.userData.light.intensity = baseIntensity + Math.sin(time * 5 + index * 2) * 0.5;
            }

            // 부스터 존 색상 변화
            if (boosterZone.material) {
                const hue = (time * 0.1 + index * 0.2) % 1;
                boosterZone.material.emissive.setHSL(hue, 1, 0.5);
            }
        });
    }

    /**
     * 장애물 애니메이션 업데이트
     */
    animateObstacles() {
        const time = Date.now() * 0.001;

        this.obstacles.forEach((obstacle, index) => {
            // 장애물 회전
            obstacle.rotation.x += 0.005;
            obstacle.rotation.y += 0.01;

            // 장애물 위아래 움직임
            const yOffset = Math.sin(time + index) * 0.5;
            obstacle.position.y += yOffset * 0.05;

            // 장애물 빛 강도 변화
            if (obstacle.material) {
                const emissiveIntensity = 0.5 + Math.sin(time * 2 + index) * 0.2;
                obstacle.material.emissiveIntensity = emissiveIntensity;
            }
        });
    }

    /**
     * 트랙 요소 업데이트
     */
    update() {
        this.animateCheckpoints();
        this.animateBoosterZones();
        this.animateObstacles();
    }

    /**
     * 트랙 정리
     */
    dispose() {
        // 체크포인트 정리
        this.checkpoints.forEach(checkpoint => {
            this.scene.remove(checkpoint);
            if (checkpoint.geometry) checkpoint.geometry.dispose();
            if (checkpoint.material) checkpoint.material.dispose();
        });

        // 부스터 존 정리
        this.boosterZones.forEach(boosterZone => {
            this.scene.remove(boosterZone);
            if (boosterZone.userData.light) this.scene.remove(boosterZone.userData.light);
            if (boosterZone.geometry) boosterZone.geometry.dispose();
            if (boosterZone.material) boosterZone.material.dispose();
        });

        // 장애물 정리
        this.obstacles.forEach(obstacle => {
            this.scene.remove(obstacle);
            if (obstacle.geometry) obstacle.geometry.dispose();
            if (obstacle.material) obstacle.material.dispose();
        });

        // 경계 정리
        this.boundaries.forEach(boundary => {
            this.scene.remove(boundary);
            if (boundary.geometry) boundary.geometry.dispose();
            if (boundary.material) boundary.material.dispose();
        });

        this.checkpoints = [];
        this.boosterZones = [];
        this.obstacles = [];
        this.boundaries = [];

        console.log('🧹 트랙 리소스 정리 완료');
    }
}