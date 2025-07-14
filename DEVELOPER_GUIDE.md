# 🚀 Sensor Game Hub v6.0 - 개발자 가이드

## 📋 목차
- [시작하기](#시작하기)
- [게임 추가 방법](#게임-추가-방법)
- [게임 메타데이터](#게임-메타데이터)
- [SessionSDK 사용법](#sessionsdk-사용법)
- [센서 데이터 처리](#센서-데이터-처리)
- [API 레퍼런스](#api-레퍼런스)
- [배포 가이드](#배포-가이드)

## 🏁 시작하기

### 개발 환경 설정
```bash
# 저장소 클론
git clone https://github.com/cmhblue1225/sensor-game-hub-v6.git
cd sensor-game-hub-v6

# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

### 프로젝트 구조
```
sensor-game-hub-v6/
├── server/                 # 서버 코드
│   ├── index.js            # 메인 서버
│   ├── SessionManager.js   # 세션 관리
│   └── GameScanner.js      # 게임 자동 스캔
├── public/                 # 클라이언트 파일
│   ├── js/SessionSDK.js    # 게임 개발 SDK
│   ├── sensor.html         # 모바일 센서 클라이언트
│   └── games/              # 게임 폴더 📁
│       ├── solo/           # 솔로 게임 예제
│       ├── dual/           # 듀얼 게임 예제
│       └── multi/          # 멀티플레이어 게임 예제
└── DEVELOPER_GUIDE.md      # 이 문서
```

## 🎮 게임 추가 방법

### 1단계: 게임 폴더 생성
```bash
# games 폴더에 새 게임 폴더 생성
mkdir public/games/my-awesome-game
cd public/games/my-awesome-game
```

### 2단계: 필수 파일 생성

#### `index.html` (필수)
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Awesome Game</title>
</head>
<body>
    <div id="gameContainer">
        <!-- 게임 UI -->
    </div>
    
    <!-- SessionSDK 로드 -->
    <script src="/socket.io/socket.io.js"></script>
    <script src="/js/SessionSDK.js"></script>
    
    <script>
        // 게임 코드
        const game = new MyAwesomeGame();
    </script>
</body>
</html>
```

#### `game.json` (선택사항 - 없으면 자동 생성)
```json
{
  "id": "my-awesome-game",
  "title": "My Awesome Game",
  "description": "놀라운 센서 게임입니다!<br>모바일을 기울여서 플레이하세요",
  "category": "solo",
  "icon": "🎯",
  "version": "1.0.0",
  "author": "Your Name",
  "sensors": ["orientation", "motion"],
  "maxPlayers": 1,
  "difficulty": "medium",
  "status": "active",
  "featured": false,
  "tags": ["fun", "sensor", "tilt"],
  "instructions": [
    "모바일을 기울여서 캐릭터를 조작하세요",
    "목표물을 수집하여 점수를 획득하세요"
  ],
  "controls": {
    "tilt": "캐릭터 이동",
    "motion": "특수 동작"
  }
}
```

### 3단계: 서버 재시작 또는 재스캔
```bash
# 방법 1: 서버 재시작 (자동 스캔)
npm restart

# 방법 2: API로 재스캔 (서버 실행 중)
curl -X POST http://localhost:3000/api/admin/rescan
```

### 4단계: 확인
- `http://localhost:3000` 접속
- 새 게임이 목록에 표시되는지 확인
- 게임 클릭하여 정상 작동 확인

## 📝 게임 메타데이터

### 필수 필드
| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 게임 고유 ID (폴더명과 동일) |
| `title` | string | 게임 제목 |
| `description` | string | 게임 설명 (HTML 허용) |
| `category` | string | 게임 카테고리 (`solo`, `dual`, `multi`, `experimental`) |
| `icon` | string | 게임 아이콘 (이모지) |

### 선택 필드
| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `version` | string | "1.0.0" | 게임 버전 |
| `author` | string | "Unknown" | 개발자명 |
| `sensors` | array | ["orientation"] | 사용하는 센서 타입 |
| `maxPlayers` | number | 1 | 최대 플레이어 수 |
| `difficulty` | string | "medium" | 난이도 (`easy`, `medium`, `hard`) |
| `status` | string | "active" | 상태 (`active`, `inactive`, `maintenance`) |
| `featured` | boolean | false | 추천 게임 여부 |
| `experimental` | boolean | false | 실험적 게임 여부 |
| `tags` | array | [] | 태그 목록 |
| `instructions` | array | [] | 게임 설명서 |
| `controls` | object | {} | 조작법 설명 |

### 카테고리별 특징
- **solo**: 1명, 혼자 플레이
- **dual**: 2명, 협력 플레이
- **multi**: 3-8명, 경쟁 플레이  
- **experimental**: 실험적 기능

## 🛠️ SessionSDK 사용법

### 기본 설정
```javascript
// SDK 초기화
const sdk = new SessionSDK({
    gameId: 'my-awesome-game',
    gameType: 'solo',  // 'solo', 'dual', 'multi'
    debug: true
});

// 세션 생성 (게임에서 호출)
const session = await sdk.createSession();
console.log('세션 코드:', session.sessionCode);
```

### 이벤트 처리
```javascript
// 센서 연결
sdk.on('sensor-connected', (data) => {
    console.log('센서 연결됨:', data.sensorId);
    updateUI(data);
});

// 센서 데이터 수신
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    processSensorData(data);
});

// 게임 준비 완료
sdk.on('game-ready', (data) => {
    console.log('게임 준비 완료');
    startGame();
});

// 센서 연결 해제
sdk.on('sensor-disconnected', (data) => {
    console.log('센서 연결 해제:', data.sensorId);
});
```

### 게임 시작/종료
```javascript
// 게임 시작 (모든 센서 연결 후)
async function startGame() {
    try {
        const result = await sdk.startGame();
        console.log('게임 시작됨:', result);
    } catch (error) {
        console.error('게임 시작 실패:', error);
    }
}

// 연결 종료
sdk.disconnect();
```

## 📱 센서 데이터 처리

### 센서 데이터 구조
```javascript
{
    sensorId: "sensor",           // 센서 ID
    gameType: "solo",             // 게임 타입
    data: {
        orientation: {            // 기기 방향
            alpha: 45.0,         // 회전 (0-360°)
            beta: 15.0,          // 앞뒤 기울기 (-180~180°)
            gamma: -30.0         // 좌우 기울기 (-90~90°)
        },
        acceleration: {           // 가속도
            x: 0.1,              // 좌우 가속도
            y: -9.8,             // 상하 가속도
            z: 0.2               // 앞뒤 가속도
        },
        rotationRate: {           // 회전 속도
            alpha: 0.0,          // Z축 회전 속도
            beta: 0.5,           // X축 회전 속도  
            gamma: -0.3          // Y축 회전 속도
        }
    },
    timestamp: 1641234567890      // 타임스탬프
}
```

### 센서 데이터 활용 예제
```javascript
function processSensorData(sensorData) {
    const { orientation, acceleration } = sensorData.data;
    
    // 기울기로 캐릭터 이동
    if (orientation) {
        const moveX = orientation.gamma * 0.1;  // 좌우 기울기
        const moveY = orientation.beta * 0.1;   // 앞뒤 기울기
        
        player.position.x += moveX;
        player.position.y += moveY;
    }
    
    // 흔들기 감지
    if (acceleration) {
        const totalAccel = Math.sqrt(
            acceleration.x ** 2 + 
            acceleration.y ** 2 + 
            acceleration.z ** 2
        );
        
        if (totalAccel > 15) {
            triggerShakeAction();
        }
    }
}
```

## 🔌 API 레퍼런스

### 게임 목록 조회
```javascript
GET /api/games
// 응답: { success: true, data: [...], stats: {...} }
```

### 특정 게임 정보
```javascript
GET /api/games/:gameId
// 응답: { success: true, data: {...} }
```

### 게임 재스캔 (개발용)
```javascript
POST /api/admin/rescan
// 응답: { success: true, message: "게임 재스캔 완료", stats: {...} }
```

### 세션 통계
```javascript
GET /api/stats
// 응답: { success: true, data: {...}, timestamp: 1641234567890 }
```

## 🎨 UI/UX 가이드라인

### 게임 화면 구성
```html
<!-- 기본 레이아웃 -->
<div class="game-container">
    <!-- 게임 캔버스 -->
    <canvas id="gameCanvas"></canvas>
    
    <!-- UI 오버레이 -->
    <div class="game-ui">
        <!-- 세션 정보 패널 -->
        <div class="session-panel">
            <div class="session-code">1234</div>
            <div class="qr-container"></div>
        </div>
        
        <!-- 게임 정보 -->
        <div class="game-info">
            <div class="score">점수: 0</div>
            <div class="timer">시간: 60s</div>
        </div>
        
        <!-- 컨트롤 패널 -->
        <div class="control-panel">
            <button onclick="resetGame()">🔄 재시작</button>
            <button onclick="togglePause()">⏸️ 일시정지</button>
            <a href="/">🏠 허브로</a>
        </div>
    </div>
</div>
```

### CSS 테마 변수
```css
:root {
    --primary: #3b82f6;
    --secondary: #8b5cf6;
    --success: #10b981;
    --warning: #f59e0b;
    --error: #ef4444;
    --background: #0f172a;
    --surface: #1e293b;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
}
```

## 🚀 배포 가이드

### Render.com 자동 배포
1. GitHub에 푸시
2. Render.com에서 자동 배포
3. 새 게임이 자동으로 감지됨

### 로컬 배포
```bash
npm start
# 또는
node server/index.js
```

### 환경 변수
```bash
PORT=3000                    # 서버 포트
NODE_ENV=production          # 운영 환경
```

## 🧪 예제 게임들

### 1. 솔로 게임 (`/games/solo`)
- 1개 센서 사용
- 공 조작 게임
- 목표 수집 시스템

### 2. 듀얼 게임 (`/games/dual`)  
- 2개 센서 사용
- 협력 플레이
- 공동 목표 달성

### 3. 멀티플레이어 (`/games/multi`)
- 최대 8명 동시 플레이
- 실시간 경쟁
- 리더보드 시스템

## 🐛 디버깅 팁

### 센서 데이터 확인
```javascript
// SDK 디버그 모드 활성화
const sdk = new SessionSDK({
    debug: true  // 콘솔에 로그 출력
});

// 센서 데이터 로깅
sdk.on('sensor-data', (data) => {
    console.table(data.data.orientation);
});
```

### 자주 발생하는 문제

1. **센서 데이터가 오지 않음**
   - CustomEvent 처리 확인: `event.detail || event`
   - HTTPS 환경인지 확인 (센서 권한)

2. **게임이 목록에 안 보임**
   - `game.json` 파일 문법 확인
   - `/api/admin/rescan` 호출

3. **세션 코드가 undefined**
   - SessionSDK 이벤트 핸들러 확인
   - 서버 로그 확인

## 📞 지원

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **API 문서**: `/api/games` 엔드포인트에서 실시간 확인
- **예제 코드**: `public/games/` 폴더의 기존 게임들 참조

---

Happy Gaming! 🎮✨