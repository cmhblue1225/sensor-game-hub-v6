# 🎮 Sensor Game Hub v6.0 프로젝트

## 📍 프로젝트 위치 및 기본 정보
- **경로**: `/Users/minhyuk/Desktop/센서게임/minhyuk/sensor-game-hub-v6/`
- **버전**: v6.0.0
- **설명**: 완벽한 게임별 독립 세션 시스템을 갖춘 센서 게임 허브
- **주요 기술**: Node.js, Express, Socket.IO, HTML5 Canvas, WebSocket

## 🏗️ 프로젝트 아키텍처

```
sensor-game-hub-v6/
├── server/                     # 서버 코드
│   ├── index.js                # 메인 서버 (Express + Socket.IO)
│   ├── SessionManager.js       # 세션 관리 시스템
│   └── GameScanner.js          # 게임 자동 스캔 시스템
├── public/                     # 클라이언트 파일
│   ├── js/
│   │   └── SessionSDK.js       # 통합 SDK (QR코드, 센서 수집기 포함)
│   ├── games/                  # 게임 디렉토리
│   │   ├── solo/               # 솔로 게임 
│   │   ├── dual/               # 듀얼 게임
│   │   ├── multi/              # 멀티플레이어 게임
│   │   ├── quick-draw/         # 퀵드로우 게임
│   │   └── tilt-maze/          # 틸트 미로 게임
│   └── sensor.html             # 통합 센서 클라이언트
├── package.json                # 의존성 및 프로젝트 설정
├── README.md                   # 프로젝트 문서
├── DEVELOPER_GUIDE.md          # 개발자 가이드
└── GAME_TEMPLATE.html          # 게임 개발 템플릿
```

## 🎯 핵심 기능

### 1. 게임별 독립 세션 시스템
- **즉시 세션 생성**: 게임 진입 시 자동으로 4자리 세션 코드 생성
- **QR 코드 지원**: 모바일 연결을 위한 QR 코드 자동 생성
- **실시간 상태 관리**: 연결 상태 및 게임 진행 상황 실시간 표시

### 2. 통합 센서 클라이언트
- **모든 게임 지원**: 하나의 센서 클라이언트로 모든 게임 타입 지원
- **자동 센서 감지**: iOS/Android 센서 자동 감지 및 권한 처리
- **실시간 데이터 전송**: 50ms 간격 고속 센서 데이터 전송

### 3. 완전한 게임 컬렉션
- **Solo Game**: 1개 센서로 플레이하는 공 조작 게임
- **Dual Game**: 2개 센서로 협력하는 미션 게임
- **Multi Game**: 최대 10명까지 동시 플레이하는 경쟁 게임
- **Quick Draw**: 빠른 반응 게임
- **Tilt Maze**: 기울기 기반 미로 게임

## 🚀 실행 방법

### 서버 시작
```bash
cd /Users/minhyuk/Desktop/센서게임/minhyuk/sensor-game-hub-v6
npm install
npm start
```

### 접속 URL
- **게임 허브**: http://localhost:3000
- **센서 클라이언트**: http://localhost:3000/sensor.html
- **특정 게임**: http://localhost:3000/games/[게임ID]

## 🔧 주요 파일 설명

### server/index.js:755
메인 서버 파일로 Express와 Socket.IO를 이용한 웹소켓 서버를 구현합니다.
- HTTP API 엔드포인트 제공
- 실시간 웹소켓 통신 처리
- 동적 홈페이지 생성
- 게임 라우팅 시스템

### public/js/SessionSDK.js
게임 개발을 위한 통합 SDK입니다.
- 세션 생성 및 관리
- 센서 데이터 수신 처리
- WebSocket 연결 관리
- 이벤트 기반 아키텍처

### 게임 개발 패턴

#### 필수 구현 패턴
```javascript
// 1. SDK 초기화 및 연결 대기
const sdk = new SessionSDK({
    gameId: 'game-name',
    gameType: 'solo'  // 'solo', 'dual', 'multi'
});

// 2. 서버 연결 완료 후 세션 생성
sdk.on('connected', () => {
    createSession();
});

// 3. CustomEvent 처리 패턴 (중요!)
sdk.on('session-created', (event) => {
    const session = event.detail || event;  // 반드시 이 패턴 사용!
    displaySessionInfo(session);
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;     // 반드시 이 패턴 사용!
    processSensorData(data);
});
```

## 📱 센서 데이터 구조
```javascript
{
    sensorId: "sensor",
    gameType: "solo",
    data: {
        orientation: {
            alpha: 45.0,    // 회전 (0-360°)
            beta: 15.0,     // 앞뒤 기울기 (-180~180°)
            gamma: -30.0    // 좌우 기울기 (-90~90°)
        },
        acceleration: {
            x: 0.1,         // 좌우 가속도
            y: -9.8,        // 상하 가속도  
            z: 0.2          // 앞뒤 가속도
        },
        rotationRate: {
            alpha: 0.0,     // Z축 회전 속도
            beta: 0.5,      // X축 회전 속도
            gamma: -0.3     // Y축 회전 속도
        }
    },
    timestamp: 1641234567890
}
```

## 🔗 주요 API 엔드포인트

### HTTP API
- `GET /api/games` - 게임 목록 조회
- `GET /api/games/:gameId` - 특정 게임 정보
- `GET /api/stats` - 서버 통계
- `POST /api/admin/rescan` - 게임 재스캔 (개발용)

### WebSocket Events
- `create-session` - 게임 세션 생성
- `connect-sensor` - 센서 클라이언트 연결
- `sensor-data` - 센서 데이터 전송
- `start-game` - 게임 시작

## 🎮 게임 개발 가이드

### 새 게임 추가하기
1. `public/games/` 폴더에 새 게임 폴더 생성
2. `index.html` 파일 작성 (GAME_TEMPLATE.html 참고)
3. `game.json` 메타데이터 파일 생성 (선택사항)
4. 서버 재시작 또는 `/api/admin/rescan` 호출

### 필수 개발 패턴
- 서버 연결 완료 후 세션 생성
- `event.detail || event` 패턴으로 CustomEvent 처리
- QR 코드 생성 시 폴백 처리 구현

## 🚨 중요 주의사항

### 반드시 따라야 할 패턴
1. **서버 연결 순서**: `connected` 이벤트 대기 후 세션 생성
2. **CustomEvent 처리**: 모든 SDK 이벤트에서 `event.detail || event` 패턴 사용
3. **QR 코드 생성**: 라이브러리 로드 실패 시 외부 API 폴백 사용

### 자주 발생하는 문제
- "서버에 연결되지 않았습니다" 오류 → 연결 완료 전 세션 생성 시도
- 세션 코드 undefined → CustomEvent 처리 누락
- QR 코드 생성 실패 → 라이브러리 로드 실패, 폴백 처리 필요

## 📈 성능 최적화
- 센서 데이터 50ms 간격 전송
- 자동 세션 정리 및 가비지 컬렉션
- Gzip 압축으로 대역폭 최적화
- 자동 재연결 시스템

## 🔄 다음 버전 계획
- 게임 결과 저장 시스템
- 사용자 랭킹 시스템
- PWA 지원
- 더 많은 게임 타입 추가

---

## 💡 개발 팁

### 테스트 및 디버깅
```bash
# 개발 서버 시작
npm start

# 게임 목록 확인
curl http://localhost:3000/api/games

# 게임 재스캔
curl -X POST http://localhost:3000/api/admin/rescan
```

### 공통 명령어
```bash
# 서버 실행
npm start

# 의존성 설치
npm install

# 테스트 (아직 미구현)
npm test
```

### 빠른 게임 개발
1. `GAME_TEMPLATE.html`을 복사하여 새 게임 폴더에 배치
2. 게임 ID와 제목 수정
3. `update()`, `render()`, `processSensorData()` 함수 구현
4. 서버 재시작하여 확인

---

**Sensor Game Hub v6.0** - 모바일 센서로 새로운 게임 경험을 만나보세요! 🎮✨