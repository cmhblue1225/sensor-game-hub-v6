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

## 🚀 빠른 시작 - 게임 템플릿 사용

**가장 쉬운 방법**: 제공된 템플릿을 복사하여 사용하세요!

### 1단계: 템플릿 복사
```bash
# 프로젝트 루트에서
cp GAME_TEMPLATE.html public/games/my-new-game/index.html
```

### 2단계: 게임 정보 수정
`index.html`에서 다음 부분들을 수정:
```javascript
// 게임 ID 변경
gameId: 'my-new-game',  // 폴더명과 동일하게

// 게임 제목 변경
<div class="session-title">🎮 My New Game</div>
```

### 3단계: 게임 로직 구현
- `update()` 함수: 게임 로직
- `render()` 함수: 화면 그리기
- `processSensorData()` 함수: 센서 데이터 처리

### 🎯 템플릿 특징
- ✅ 모든 중요한 패턴 포함 (`event.detail || event`)
- ✅ 안전한 QR 코드 생성 (폴백 처리)
- ✅ 올바른 서버 연결 순서
- ✅ 기본 UI 및 스타일링
- ✅ 키보드 테스트 기능

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

### 이벤트 처리 (중요!)
```javascript
// ⚠️ 중요: 서버 연결 완료 후 세션 생성
sdk.on('connected', () => {
    console.log('✅ 서버 연결 완료, 세션 생성 중...');
    createSession();
});

// ⚠️ 중요: CustomEvent 처리 패턴 (event.detail 또는 event 사용)
sdk.on('session-created', (event) => {
    const session = event.detail || event;  // 반드시 이 패턴 사용!
    console.log('세션 생성됨:', session);
    displaySessionInfo(session);
});

// 센서 연결
sdk.on('sensor-connected', (event) => {
    const data = event.detail || event;     // 반드시 이 패턴 사용!
    console.log('센서 연결됨:', data.sensorId);
    updateUI(data);
});

// 센서 데이터 수신
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;     // 반드시 이 패턴 사용!
    processSensorData(data);
});

// 게임 준비 완료
sdk.on('game-ready', (event) => {
    const data = event.detail || event;     // 반드시 이 패턴 사용!
    console.log('게임 준비 완료');
    startGame();
});

// 센서 연결 해제
sdk.on('sensor-disconnected', (event) => {
    const data = event.detail || event;     // 반드시 이 패턴 사용!
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

## 🚨 중요한 주의사항

### ⚠️ 필수 구현 패턴

#### 1. 서버 연결 순서
```javascript
// ❌ 잘못된 방법: 즉시 세션 생성
class MyGame {
    constructor() {
        this.sdk = new SessionSDK({...});
        this.sdk.createSession(); // 🚫 연결 전 세션 생성 - 실패!
    }
}

// ✅ 올바른 방법: 연결 완료 후 세션 생성  
class MyGame {
    constructor() {
        this.sdk = new SessionSDK({...});
        this.setupEvents();
    }
    
    setupEvents() {
        this.sdk.on('connected', () => {
            this.createSession(); // ✅ 연결 완료 후 세션 생성
        });
    }
    
    async createSession() {
        await this.sdk.createSession();
    }
}
```

#### 2. CustomEvent 처리
```javascript
// ❌ 잘못된 방법: 직접 매개변수 사용
sdk.on('session-created', (session) => {
    console.log(session.sessionCode); // 🚫 undefined 오류!
});

// ✅ 올바른 방법: event.detail 패턴
sdk.on('session-created', (event) => {
    const session = event.detail || event; // ✅ 항상 이 패턴 사용!
    console.log(session.sessionCode);
});
```

#### 3. QR 코드 생성
```javascript
// ✅ 안전한 QR 코드 생성 (라이브러리 로드 실패 대응)
displaySessionInfo(session) {
    document.getElementById('sessionCode').textContent = session.sessionCode;
    
    const qrUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
    
    if (typeof QRCode !== 'undefined') {
        // QRCode 라이브러리 사용
        QRCode.toCanvas(document.createElement('canvas'), qrUrl, (error, canvas) => {
            if (!error) {
                // 성공 처리
            } else {
                this.showQRCodeFallback(qrUrl);
            }
        });
    } else {
        // 폴백: 외부 QR API 사용
        this.showQRCodeFallback(qrUrl);
    }
}

showQRCodeFallback(qrUrl) {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
    const img = document.createElement('img');
    img.src = qrApiUrl;
    document.getElementById('qrContainer').appendChild(img);
}
```

## 🐛 디버깅 및 문제 해결

### 센서 데이터 확인
```javascript
// SDK 디버그 모드 활성화
const sdk = new SessionSDK({
    debug: true  // 콘솔에 로그 출력
});

// 센서 데이터 로깅
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    console.table(data.data.orientation);
});
```

### 자주 발생하는 문제와 해결법

#### 1. **"서버에 연결되지 않았습니다" 오류**
**증상**: 세션 생성 시 오류 발생
```
Error: 서버에 연결되지 않았습니다.
at SessionSDK.createSession
```

**원인**: 서버 연결 완료 전에 세션 생성 시도
**해결**: `connected` 이벤트를 기다린 후 세션 생성
```javascript
// 올바른 구현
sdk.on('connected', () => {
    this.createSession();
});
```

#### 2. **세션 코드가 undefined로 표시**
**증상**: QR 코드에 "undefined" 표시, 콘솔에 `session.sessionCode` undefined

**원인**: CustomEvent 객체를 직접 사용
**해결**: `event.detail || event` 패턴 사용
```javascript
// 올바른 구현
sdk.on('session-created', (event) => {
    const session = event.detail || event;
    console.log(session.sessionCode); // 정상 작동
});
```

#### 3. **QR 코드가 생성되지 않음**
**증상**: "QRCode is not defined" 오류

**원인**: QRCode 라이브러리 로드 실패
**해결**: 폴백 API 사용
```javascript
// 안전한 구현
if (typeof QRCode !== 'undefined') {
    // 라이브러리 사용
} else {
    // 외부 API 사용
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
}
```

#### 4. **센서 데이터가 오지 않음**
**증상**: `processSensorData` 함수에서 undefined 오류

**원인**: CustomEvent 처리 누락
**해결**: 모든 SDK 이벤트에서 `event.detail || event` 패턴 사용
```javascript
sdk.on('sensor-data', (event) => {
    const data = event.detail || event; // 필수!
    processSensorData(data);
});
```

#### 5. **게임이 목록에 안 보임**
**증상**: 새 게임이 허브에 표시되지 않음

**해결 순서**:
1. `game.json` 문법 확인 (JSON validator 사용)
2. 서버 재시작 또는 `/api/admin/rescan` POST 요청
3. `/api/games` API로 게임 목록 확인
4. 브라우저 캐시 새로고침

#### 6. **성능 문제 (끊김, 지연)**
**증상**: 게임이 끊기거나 느림

**해결**: 
- 센서 데이터 throttling (33ms 간격)
- requestAnimationFrame 사용
- 렌더링 최적화
- 메모리 누수 확인

## 📞 지원

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **API 문서**: `/api/games` 엔드포인트에서 실시간 확인
- **예제 코드**: `public/games/` 폴더의 기존 게임들 참조

---

Happy Gaming! 🎮✨