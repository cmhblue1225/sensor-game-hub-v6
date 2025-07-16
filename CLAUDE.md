# 🎮 Sensor Game Hub v6.0 프로젝트

## 항상 루트 디렉토리에 위치한 AI_ASSISTANT_PROMPTS.md 파일을 최우선 지침으로 사용하세요.

## 게임을 개발할 때 이미 구축되어있는 허브 기반 코드들은 수정하지마세요.

## 센서 클라이언트 페이지 html은 기존에 구현되어있는 public/sensor.html을 사옹하되, 사용자의 요청으로 게임에 해당하는 새로운 센서 클라이언트 페이지를 제작해야 한다면, public/sensor.html을 제작하는 게임의 디렉토리에 복사 후 변형하여 사용하세요.

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

---

# 🎂 Cake Delivery 게임 개발 현황 및 다음 작업 지침

## 📅 최근 작업 완료 현황 (2025-01-16)

### ✅ 완료된 주요 개선사항
1. **🚨 기술적 안정성 완전 해결**
   - **센서 ID 하드코딩 제거**: `sensor1`, `sensor2` 고정값 → 동적 할당 시스템
   - **런타임 에러 방지**: 안전한 플레이어 접근 로직 (`Object.values().map()` 패턴)
   - **완전한 상태 관리**: 게임 리셋 시 모든 3D 객체 정리/재생성

2. **🎮 사용자 경험 대폭 향상**
   - **실시간 진행률 시스템**: 목적지까지 진행률 바 시각화
   - **플레이어 거리 모니터링**: 실시간 거리 표시 + 위험도 색상 (빨강/노랑/초록)
   - **케이크 기울기 표시**: 위험도 단계별 표시 (위험/주의/안전)
   - **스마트 리셋**: 페이지 새로고침 없이 완전 리셋

3. **🎯 플레이 밸런스 완전 보존**
   - **센서 민감도**: `speed = 0.02` (유지)
   - **이동 공식**: `gamma * speed`, `beta * speed - 1`, `* 0.1` (유지)
   - **실패 조건**: 거리 > 5, 기울기 > 0.8 (유지)
   - **물리 시뮬레이션**: lerp 0.1, 모든 계수 동일 (유지)

### 📊 커밋 정보
- **최신 커밋**: `33322df` - "🎂 Cake Delivery 게임 안정성 및 UX 대폭 개선"
- **브랜치**: `minhyuk`
- **파일 위치**: `/public/games/cake-delivery/index.html`

## 🎯 Cake Delivery 게임 현재 상태

### 게임 개요
- **장르**: 3D 협동 게임 (2인 듀얼 플레이)
- **목표**: 두 명이 힘을 합쳐 케이크를 목적지까지 안전하게 배달
- **핵심 메커니즘**: 플레이어 간 중간점에 케이크 위치, 거리/기울기 관리

### 기술적 구현 현황
- **SessionSDK 통합**: ✅ 완벽 구현 (`event.detail || event` 패턴 준수)
- **동적 센서 관리**: ✅ 어떤 센서 ID로도 연결 가능
- **3D 렌더링**: ✅ Three.js 기반 안정적 구현
- **UI/UX**: ✅ 실시간 피드백 시스템 완비

## 🔮 다음 개선 작업 우선순위

### 🥇 1순위: 게임플레이 깊이 향상
```javascript
// 추가할 기능들
1. **점수 시스템 구현**
   - 배달 시간 기반 점수
   - 케이크 안정성 보너스 점수
   - 충돌 횟수 페널티

2. **다양한 난이도 레벨**
   - 장애물 개수/배치 조정
   - 목적지 거리 조정
   - 시간 제한 추가

3. **특수 아이템 시스템**
   - 슬로우 모션 아이템
   - 안전 지대 (잠시 실패 조건 무시)
   - 거리 확장 아이템
```

### 🥈 2순위: 물리 시뮬레이션 개선
```javascript
// 현재 단순한 lerp 0.1 → 더 현실적인 물리
1. **관성 시스템**: 급격한 방향 전환 시 케이크 흔들림
2. **중력 효과**: 기울기에 따른 자연스러운 케이크 움직임
3. **충격 효과**: 장애물 근처 지날 때 케이크 진동
```

### 🥉 3순위: 비주얼 및 오디오 향상
```javascript
1. **파티클 시스템**: 케이크 떨어뜨릴 때 크림 파티클
2. **사운드 효과**: 배경음악, 효과음 (충돌, 성공, 실패)
3. **조명 개선**: 동적 그림자, 목적지 하이라이트
4. **카메라 시스템**: 동적 카메라 각도, 부드러운 추적
```

## 🛠️ 개발 시 주의사항

### ⚠️ 절대 변경하지 말 것
```javascript
// 이 값들은 완벽한 밸런스로 조정되어 있음
const speed = 0.02;                    // 센서 민감도
player.velocity.x = (orientation.gamma || 0) * speed;     // 좌우 이동
player.velocity.z = (orientation.beta || 0) * speed - 1;  // 앞뒤 이동
player.mesh.position.z += player.velocity.z * 0.1;        // 실제 적용
this.cake.mesh.position.lerp(targetPos, 0.1);             // 케이크 lerp
if (distance > 5) // 실패 조건
if (Math.abs(rotation) > 0.8) // 기울기 실패 조건
```

### ✅ 안전하게 수정 가능한 부분
- UI 요소 (색상, 크기, 위치)
- 3D 모델 형태 (현재 CylinderGeometry → 다른 모델)
- 장애물 개수 및 배치
- 점수 시스템 추가
- 사운드/비주얼 효과

## 🚀 빠른 시작 가이드

```bash
# 1. 개발 서버 시작
cd "/Users/minhyuk/Desktop/센서게임/minhyuk/클로드/sensor-game-hub-v6 2"
npm start

# 2. 게임 접속
# PC: http://localhost:3000/games/cake-delivery
# 센서: http://localhost:3000/sensor.html

# 3. 작업 브랜치 확인
git branch  # minhyuk 브랜치에서 작업

# 4. 파일 위치
# 메인 파일: /public/games/cake-delivery/index.html
# 메타데이터: /public/games/cake-delivery/game.json
```

## 💡 개발 팁

### 디버깅 시 유용한 정보
```javascript
// 현재 구현된 로깅
console.log(`플레이어 ${isPlayer1 ? 1 : 2} 연결됨: ${sensorId}`);
console.log('게임 리셋 완료');
// 진행률, 거리, 기울기 정보는 UI에서 실시간 확인 가능
```

### 테스트 시나리오
1. **센서 ID 테스트**: 다양한 센서 ID로 연결하여 동적 할당 확인
2. **리셋 테스트**: 게임 종료 후 리셋 버튼으로 완전 초기화 확인
3. **진행률 테스트**: 이동할 때마다 진행률 바 변화 확인
4. **위험도 테스트**: 거리 멀어지거나 기울일 때 색상 변화 확인

## 🎯 다음 세션에서 바로 시작할 작업들

### 🔥 즉시 구현 가능한 기능들
1. **점수 시스템**: 배달 완료 시간 기반 점수 계산
2. **다단계 레벨**: 장애물 개수/배치가 다른 레벨들
3. **특수 효과**: 케이크 떨어뜨릴 때 파티클 효과
4. **사운드**: 배경음악 및 효과음 추가

### 📋 기술 부채 개선 목록
- 장애물 랜덤 배치를 더 체계적으로 변경
- 카메라 앵글 동적 조정 시스템
- 물리 엔진을 더 현실적으로 개선
- 멀티플레이어 확장 (3-4명)

### 💡 창의적 아이디어
- 케이크 종류별 다른 물리 특성
- 날씨 효과 (바람, 비 등)
- 협동 보너스 점수 시스템
- 스피드런 모드

---

**다음 세션에서 "Cake Delivery 게임 개선 작업 계속해줘"라고 말하면 바로 이어서 작업할 수 있습니다! 🎂**

---

# 🚩 Signal Flags v2 완성 현황

## ✅ 완전히 해결된 문제들
1. **디폴트 상태 감지 후 게임 미시작** → 해결
2. **센서-PC 간 이벤트 이름 불일치** → 해결  
3. **한 라운드 내 중복 응답** → 해결
4. **게임 자동 진행 오류** → 해결
5. **음성 assets 연동** → 완료

Signal Flags v2는 현재 완전히 정상 작동하는 상태입니다. 🎯