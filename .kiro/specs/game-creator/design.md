# 디자인 문서

## 개요

센서 기반 게임 허브에 추가할 자동차 경주 3D 게임의 설계 문서입니다. 이 게임은 듀얼 플레이어 방식으로, 두 명의 플레이어가 각각 모바일 센서를 사용하여 분할된 화면에서 3D 자동차 경주를 진행합니다.

## 아키텍처

### 게임 플로우

```
Game Flow Sequence
1. 게임 진입 (/games/racing-3d)
   ├── 게임 로딩 및 초기화
   ├── SessionSDK 연결 대기
   └── 세션 생성

2. 센서 연결 대기
   ├── 세션 코드 표시 (4자리)
   ├── QR 코드 생성 및 표시
   ├── 첫 번째 센서 연결 (Player 1)
   └── 두 번째 센서 연결 (Player 2)

3. 게임 준비
   ├── 화면 분할 활성화
   ├── 3D 환경 초기화
   ├── 자동차 배치
   └── "게임 시작" 버튼 활성화

4. 게임 진행
   ├── 카운트다운 (3, 2, 1, GO!)
   ├── 실시간 센서 데이터 처리
   ├── 물리 시뮬레이션
   └── 화면 렌더링

5. 게임 종료
   ├── 결과 표시
   ├── 재시작 옵션
   └── 허브로 돌아가기
```

### 전체 시스템 구조

```
Racing Game Architecture
├── Frontend (Browser)
│   ├── Game Canvas (Split Screen)
│   │   ├── Player 1 Viewport (Left)
│   │   └── Player 2 Viewport (Right)
│   ├── 3D Rendering Engine (Three.js)
│   ├── Physics Engine (Cannon.js)
│   ├── SessionSDK Integration
│   └── UI Components
├── Backend (Node.js + Socket.IO)
│   ├── Session Management
│   ├── Sensor Data Processing
│   └── Game State Synchronization
└── Mobile Sensors (2 devices)
    ├── Device Orientation API
    └── Real-time Data Transmission
```

### 게임 폴더 구조

```
public/games/racing-3d/
├── index.html              # 메인 게임 파일
├── game.json              # 게임 메타데이터
├── js/
│   ├── game.js            # 게임 로직
│   ├── car.js             # 자동차 클래스
│   ├── track.js           # 트랙 생성
│   └── physics.js         # 물리 엔진 설정
├── assets/
│   ├── models/            # 3D 모델 파일
│   ├── textures/          # 텍스처 이미지
│   └── sounds/            # 효과음 파일
└── css/
    └── style.css          # 게임 스타일
```

## 컴포넌트 및 인터페이스

### 1. 게임 메인 클래스 (RacingGame)

```javascript
class RacingGame {
    constructor() {
        // 3D 렌더링 설정
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.cameras = {
            player1: new THREE.PerspectiveCamera(),
            player2: new THREE.PerspectiveCamera()
        };
        
        // 물리 엔진 설정
        this.world = new CANNON.World();
        
        // 게임 상태
        this.gameState = 'waiting'; // waiting, racing, finished
        this.players = {
            player1: new Car('player1'),
            player2: new Car('player2')
        };
        
        // SessionSDK 통합
        this.sdk = new SessionSDK({
            gameId: 'racing-3d',
            gameType: 'dual',
            debug: true
        });
    }
}
```

### 2. 자동차 클래스 (Car)

```javascript
class Car {
    constructor(playerId) {
        this.playerId = playerId;
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.velocity = new THREE.Vector3();
        this.speed = 0;
        this.steering = 0;
        
        // 물리 바디
        this.body = new CANNON.Body();
        
        // 3D 모델
        this.mesh = null;
        
        // 게임 상태
        this.lapCount = 0;
        this.lapTime = 0;
        this.bestLapTime = Infinity;
    }
    
    // 센서 데이터로 자동차 조작
    updateFromSensor(sensorData) {
        const { orientation } = sensorData.data;
        
        // 좌우 기울기 -> 핸들 조작
        this.steering = orientation.gamma * 0.02;
        
        // 앞뒤 기울기 -> 가속/브레이크
        const tilt = orientation.beta;
        if (tilt < -10) {
            this.accelerate();
        } else if (tilt > 10) {
            this.brake();
        }
    }
}
```

### 3. 트랙 생성 클래스 (Track)

```javascript
class Track {
    constructor() {
        this.geometry = null;
        this.mesh = null;
        this.checkpoints = [];
        this.startLine = null;
        this.finishLine = null;
    }
    
    // 3D 트랙 생성
    createTrack() {
        // 트랙 지오메트리 생성
        const trackGeometry = new THREE.PlaneGeometry(100, 20);
        const trackMaterial = new THREE.MeshLambertMaterial({
            color: 0x333333
        });
        
        // 트랙 경계 생성
        this.createBoundaries();
        
        // 체크포인트 설정
        this.setupCheckpoints();
    }
}
```

### 4. UI 컴포넌트

```javascript
class GameUI {
    constructor() {
        this.elements = {
            sessionPanel: document.getElementById('sessionPanel'),
            gameHUD: document.getElementById('gameHUD'),
            player1Stats: document.getElementById('player1Stats'),
            player2Stats: document.getElementById('player2Stats'),
            raceResults: document.getElementById('raceResults')
        };
    }
    
    // 플레이어 통계 업데이트
    updatePlayerStats(playerId, stats) {
        const element = this.elements[`${playerId}Stats`];
        element.innerHTML = `
            <div class="speed">속도: ${stats.speed.toFixed(1)} km/h</div>
            <div class="lap">랩: ${stats.lapCount}/3</div>
            <div class="time">시간: ${stats.lapTime.toFixed(2)}s</div>
        `;
    }
}
```

## 데이터 모델

### 센서 데이터 구조

```javascript
{
    sensorId: "player1" | "player2",
    gameType: "dual",
    data: {
        orientation: {
            alpha: number,  // 회전 (0-360°)
            beta: number,   // 앞뒤 기울기 (-180~180°)
            gamma: number   // 좌우 기울기 (-90~90°)
        },
        acceleration: {
            x: number,      // 좌우 가속도
            y: number,      // 상하 가속도
            z: number       // 앞뒤 가속도
        }
    },
    timestamp: number
}
```

### 게임 상태 데이터

```javascript
{
    gameState: "waiting" | "racing" | "finished",
    raceTime: number,
    players: {
        player1: {
            position: { x, y, z },
            rotation: { x, y, z },
            speed: number,
            lapCount: number,
            lapTime: number,
            bestLapTime: number,
            rank: number
        },
        player2: { /* 동일 구조 */ }
    },
    raceResults: {
        winner: "player1" | "player2",
        finalTimes: [number, number],
        bestLaps: [number, number]
    }
}
```

### game.json 메타데이터

```json
{
    "id": "racing-3d",
    "title": "🏎️ 3D 자동차 경주",
    "description": "두 명이 센서로 조작하는 3D 자동차 경주 게임<br>화면 분할로 각자의 시점에서 경주하세요!",
    "category": "dual",
    "icon": "🏎️",
    "version": "1.0.0",
    "author": "Racing Game Team",
    "sensors": ["orientation", "motion"],
    "maxPlayers": 2,
    "difficulty": "medium",
    "status": "active",
    "featured": true,
    "tags": ["3D", "racing", "competition", "physics"],
    "instructions": [
        "두 명의 플레이어가 각각 모바일 기기를 연결합니다",
        "휴대폰을 좌우로 기울여 핸들을 조작하세요",
        "앞으로 기울이면 가속, 뒤로 기울이면 브레이크입니다",
        "3랩을 먼저 완주하는 플레이어가 승리합니다!"
    ],
    "controls": {
        "tilt-left-right": "핸들 조작",
        "tilt-forward": "가속",
        "tilt-backward": "브레이크"
    }
}
```

## 오류 처리

### 센서 연결 오류 처리

```javascript
// 센서 연결 끊김 감지
sdk.on('sensor-disconnected', (event) => {
    const data = event.detail || event;
    const playerId = data.sensorId;
    
    // 게임 일시정지
    this.pauseGame();
    
    // UI에 재연결 메시지 표시
    this.showReconnectionMessage(playerId);
});

// 센서 재연결
sdk.on('sensor-connected', (event) => {
    const data = event.detail || event;
    const playerId = data.sensorId;
    
    // 재연결 메시지 숨김
    this.hideReconnectionMessage(playerId);
    
    // 모든 센서가 연결되면 게임 재개
    if (this.allSensorsConnected()) {
        this.resumeGame();
    }
});
```

### 물리 엔진 오류 처리

```javascript
// 자동차가 트랙 밖으로 나갔을 때
checkBoundaries() {
    Object.values(this.players).forEach(car => {
        if (this.isOutOfBounds(car.position)) {
            // 자동차를 트랙 위로 리셋
            this.resetCarPosition(car);
            
            // 속도 감소 페널티
            car.speed *= 0.5;
        }
    });
}

// 충돌 감지 및 처리
handleCollisions() {
    this.world.addEventListener('collide', (event) => {
        const { bodyA, bodyB } = event;
        
        // 자동차 간 충돌
        if (this.isCarCollision(bodyA, bodyB)) {
            this.handleCarCollision(bodyA, bodyB);
        }
        
        // 벽과의 충돌
        if (this.isWallCollision(bodyA, bodyB)) {
            this.handleWallCollision(bodyA, bodyB);
        }
    });
}
```

## 테스트 전략

### 단위 테스트

1. **센서 데이터 처리 테스트**
   - 기울기 값을 자동차 조작으로 변환하는 로직 검증
   - 센서 데이터 범위 제한 테스트

2. **물리 엔진 테스트**
   - 자동차 움직임 물리 법칙 검증
   - 충돌 감지 및 처리 테스트

3. **게임 로직 테스트**
   - 랩 카운트 및 순위 계산 검증
   - 게임 상태 전환 테스트

### 통합 테스트

1. **SessionSDK 통합 테스트**
   - 세션 생성 및 센서 연결 테스트
   - 실시간 데이터 전송 검증

2. **화면 분할 렌더링 테스트**
   - 두 개의 뷰포트 동시 렌더링 검증
   - 성능 최적화 테스트

### 성능 테스트

1. **프레임레이트 테스트**
   - 60fps 유지 검증
   - 메모리 사용량 모니터링

2. **네트워크 지연 테스트**
   - 센서 데이터 전송 지연 측정
   - 동기화 정확도 검증

이 디자인 문서는 자동차 경주 3D 게임의 전체적인 구조와 구현 방향을 제시합니다. 기존 센서 게임 허브의 아키텍처와 완벽히 호환되도록 설계되었으며, SessionSDK를 활용한 표준 패턴을 따릅니다.