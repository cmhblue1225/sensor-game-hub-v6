# 🤖 AI 코딩 어시스턴트용 프롬프트

이 문서는 Gemini CLI와 Claude Code 같은 AI 코딩 어시스턴트가 Sensor Game Hub v6.0에서 새로운 게임을 개발할 때 사용할 수 있는 프롬프트를 제공합니다.

## 📋 목차
- [프로젝트 초기화 프롬프트](#프로젝트-초기화-프롬프트)
- [새 게임 개발 프롬프트](#새-게임-개발-프롬프트)
- [게임 유형별 프롬프트](#게임-유형별-프롬프트)
- [디버깅 및 최적화 프롬프트](#디버깅-및-최적화-프롬프트)

---

## 🚀 프로젝트 초기화 프롬프트

### Gemini CLI / Claude Code용
```
# Sensor Game Hub v6.0에서 새 게임 개발

나는 Sensor Game Hub v6.0 플랫폼에서 새로운 센서 게임을 개발하고 싶습니다.

## 프로젝트 정보
- **프로젝트 경로**: `/Users/minhyuk/Desktop/sensor-game-hub-v5/sensor-game-hub-v6/`
- **플랫폼**: Sensor Game Hub v6.0 (모바일 센서 기반 게임 플랫폼)
- **기술 스택**: HTML5, CSS3, JavaScript, Canvas API, SessionSDK
- **센서**: DeviceOrientationEvent, DeviceMotionEvent (iOS/Android)

## 개발 환경
- 서버: Node.js + Express + Socket.IO
- 클라이언트: HTML5 + Canvas + SessionSDK
- 센서 클라이언트: 모바일 웹 (iOS/Android 센서 지원)
- 배포: Render.com (자동 배포)

## 자동 게임 등록 시스템
- 새 게임을 `public/games/[게임명]/` 폴더에 추가
- `index.html` (필수)와 `game.json` (선택) 파일 생성
- 서버 재시작 시 자동으로 메인 허브에 등록됨

## 사용 가능한 SDK
**SessionSDK** (`/js/SessionSDK.js`):
- 세션 생성: `sdk.createSession()`
- 센서 연결 감지: `sdk.on('sensor-connected', callback)`
- 센서 데이터 수신: `sdk.on('sensor-data', callback)`
- 게임 시작: `sdk.startGame()`

**센서 데이터 구조**:
```javascript
{
    sensorId: "sensor",
    gameType: "solo",
    data: {
        orientation: { alpha, beta, gamma },    // 기기 방향
        acceleration: { x, y, z },              // 가속도
        rotationRate: { alpha, beta, gamma }    // 회전 속도
    }
}
```

## 기존 예제 게임들
1. **Solo Game** (`/games/solo/`): 1인용 공 조작 게임
2. **Dual Game** (`/games/dual/`): 2인 협력 게임  
3. **Multi Game** (`/games/multi/`): 8인 멀티플레이어 경쟁 게임

## 개발 규칙 (필수!)
- 반드시 `DEVELOPER_GUIDE.md`를 참조하여 개발
- **SessionSDK 이벤트는 `event.detail || event` 패턴으로 처리** (매우 중요!)
- **서버 연결 완료 후 세션 생성**: `connected` 이벤트 기다리기
- **QR 코드 생성 시 폴백 처리** 추가 (라이브러리 로드 실패 대응)
- 허브로 돌아가는 링크는 `href="/"`로 설정
- 모든 파일 경로는 절대 경로 사용
- 게임 내 UI는 기존 테마 CSS 변수 사용

## ⚠️ 자주 발생하는 실수들
1. **즉시 세션 생성**: 생성자에서 바로 `createSession()` 호출 → 연결 오류
2. **CustomEvent 무시**: `(session) =>` 대신 `(event) => event.detail || event` 사용
3. **QR 라이브러리 의존**: 로드 실패 시 대안 없음 → 폴백 API 사용
4. **센서 데이터 직접 접근**: `data.orientation` 대신 `(event.detail || event).data.orientation`

다음에 어떤 게임을 개발하고 싶은지 알려주시면, 구체적인 개발 계획과 코드를 제공하겠습니다.
```

---

## 🎮 새 게임 개발 프롬프트

### 기본 게임 개발 프롬프트
```
# [게임명] 개발 요청

다음 센서 게임을 Sensor Game Hub v6.0에서 개발해주세요:

## 게임 사양
- **게임명**: [게임명]
- **게임 타입**: [solo/dual/multi] (플레이어 수에 따라)
- **게임 장르**: [arcade/puzzle/racing/adventure 등]
- **주요 메커니즘**: [기울기 조작/흔들기/회전 등]
- **목표**: [점수 달성/목적지 도달/생존 등]

## 요구사항
1. **파일 구조**:
   - `public/games/[게임폴더명]/index.html`
   - `public/games/[게임폴더명]/game.json`

2. **필수 구현 요소**:
   - SessionSDK 통합 (`connected` 이벤트 후 세션 생성!)
   - 센서 데이터 처리 (`event.detail || event` 패턴 필수!)
   - 게임 UI (세션 코드, QR 코드, 점수 등)
   - QR 코드 폴백 처리 (라이브러리 로드 실패 대응)
   - 허브로 돌아가기 버튼

3. **센서 활용**:
   - 기기 기울기 (orientation.beta, gamma)
   - 기기 회전 (orientation.alpha)  
   - 흔들기 감지 (acceleration)
   - 회전 속도 (rotationRate)

4. **UI 요소**:
   - 게임 캔버스
   - 세션 정보 패널 (코드, QR)
   - 점수/타이머 표시
   - 컨트롤 패널 (재시작, 일시정지, 허브로)

5. **스타일링**:
   - 기존 CSS 테마 변수 사용
   - 반응형 디자인
   - 모바일 친화적 UI

## 개발 단계
1. 게임 폴더 및 기본 파일 생성
2. HTML 구조 및 CSS 스타일링
3. SessionSDK 통합 및 센서 이벤트 처리
4. 게임 로직 구현
5. UI 업데이트 및 상태 관리
6. 테스트 및 최적화

기존 예제 게임들(`/games/solo/`, `/games/dual/`, `/games/multi/`)을 참조하여 일관된 구조로 개발해주세요.
```

---

## 🎯 게임 유형별 프롬프트

### 솔로 게임 개발
```
# 솔로 센서 게임 개발

1인용 센서 게임을 개발해주세요.

## 솔로 게임 특징
- **플레이어**: 1명
- **센서**: 1개 모바일 기기
- **게임 타입**: `solo`
- **세션 관리**: 단일 센서 연결

## 추천 게임 아이디어
- **미로 탈출**: 기울기로 공을 굴려 미로 탈출
- **밸런스 게임**: 기기를 수평으로 유지하며 장애물 피하기
- **타겟 슈팅**: 기기 방향으로 발사체 조준
- **드라이빙**: 기울기로 자동차 조작
- **플랫포머**: 기울기로 캐릭터 좌우 이동, 흔들기로 점프

## 개발 가이드
1. `gameType: 'solo'`로 SessionSDK 초기화
2. 단일 센서 이벤트 처리: `sensor-connected`, `sensor-data`
3. 직관적이고 간단한 조작법
4. 점수/레벨 시스템 구현
5. 일시정지/재시작 기능

`/games/solo/index.html`을 참조하여 개발해주세요.
```

### 듀얼 게임 개발  
```
# 듀얼 센서 게임 개발

2인 협력 센서 게임을 개발해주세요.

## 듀얼 게임 특징
- **플레이어**: 2명 (협력)
- **센서**: 2개 모바일 기기 (sensor1, sensor2)
- **게임 타입**: `dual`
- **세션 관리**: 2개 센서 연결 대기

## 추천 게임 아이디어
- **협력 퍼즐**: 두 플레이어가 각각 다른 요소 조작
- **밸런스 시소**: 두 기기로 시소 균형 맞추기
- **협력 운반**: 함께 물체를 목적지까지 운반
- **동기화 게임**: 두 플레이어의 동작을 맞춰야 하는 게임
- **릴레이 게임**: 순서대로 미션 수행

## 개발 가이드
1. `gameType: 'dual'`로 SessionSDK 초기화
2. 센서별 이벤트 처리: `data.sensorId`로 구분
3. 두 플레이어 간 협력 요소 강조
4. 연결 상태 UI 표시 (sensor1, sensor2)
5. 공동 목표 및 성과 시스템

`/games/dual/index.html`을 참조하여 개발해주세요.
```

### 멀티플레이어 게임 개발
```
# 멀티플레이어 센서 게임 개발

3-8명 경쟁 센서 게임을 개발해주세요.

## 멀티 게임 특징
- **플레이어**: 3-8명 (경쟁)
- **센서**: 여러 모바일 기기 (player1, player2, ...)
- **게임 타입**: `multi`
- **세션 관리**: 다중 센서 연결, 실시간 동기화

## 추천 게임 아이디어
- **레이싱**: 여러 플레이어가 동시에 경주
- **배틀 로얄**: 생존 게임
- **수집 경쟁**: 가장 많은 아이템 수집
- **영역 점령**: 맵에서 영역 차지하기
- **리듬 게임**: 동시에 리듬 맞추기

## 개발 가이드
1. `gameType: 'multi'`로 SessionSDK 초기화
2. 플레이어별 상태 관리 및 UI 업데이트
3. 실시간 리더보드 및 순위 시스템
4. 게임 시작 대기실 (플레이어 연결 상태)
5. 성능 최적화 (60fps, 센서 데이터 throttling)
6. 수동 게임 시작 버튼

## 성능 고려사항
- 센서 데이터 throttling (33ms 간격)
- 렌더링 최적화 (requestAnimationFrame)
- 메모리 누수 방지
- 네트워크 지연 처리

`/games/multi/index.html`을 참조하여 개발해주세요.
```

---

## 🔧 디버깅 및 최적화 프롬프트

### 디버깅 프롬프트
```
# Sensor Game Hub 게임 디버깅

다음 문제를 해결해주세요:

## 실제 발생하는 문제들과 해결법

### 1. "서버에 연결되지 않았습니다" 오류
**문제**: 게임 시작 시 세션 생성 실패
```
Error: 서버에 연결되지 않았습니다.
at SessionSDK.createSession (SessionSDK.js:142:19)
```
**원인**: 서버 연결 완료 전 세션 생성 시도
**해결**: `connected` 이벤트 기다리기
```javascript
// ❌ 잘못된 방법
constructor() {
    this.sdk = new SessionSDK({...});
    this.sdk.createSession(); // 연결 전 생성 시도
}

// ✅ 올바른 방법
constructor() {
    this.sdk = new SessionSDK({...});
    this.setupEvents();
}

setupEvents() {
    this.sdk.on('connected', () => {
        this.createSession(); // 연결 완료 후 생성
    });
}
```

### 2. 세션 코드가 undefined인 경우
**문제**: QR 코드에 "undefined" 표시, 콘솔에 CustomEvent 객체
**원인**: CustomEvent 객체를 직접 사용
**해결**: `event.detail || event` 패턴 사용
```javascript
// ❌ 잘못된 방법
sdk.on('session-created', (session) => {
    console.log(session.sessionCode); // undefined
});

// ✅ 올바른 방법
sdk.on('session-created', (event) => {
    const session = event.detail || event; // CustomEvent 처리
    console.log(session.sessionCode); // 정상 작동
});
```

### 3. "QRCode is not defined" 오류
**문제**: QR 코드 생성 시 라이브러리 오류
**원인**: CDN에서 QRCode 라이브러리 로드 실패
**해결**: 폴백 API 사용
```javascript
// ✅ 안전한 구현
if (typeof QRCode !== 'undefined') {
    // QRCode 라이브러리 사용
    QRCode.toCanvas(canvas, url, callback);
} else {
    // 폴백: 외부 API 사용
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    container.appendChild(img);
}
```

### 4. 센서 데이터가 오지 않는 경우
**문제**: `processSensorData` 함수에서 undefined 오류
**해결**: 모든 SDK 이벤트에서 `event.detail || event` 패턴 사용
```javascript
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;  // 필수 패턴!
    processSensorData(data);
});
```

### 3. 게임이 허브에 등록되지 않는 경우
**문제**: 새 게임이 메인 페이지에 표시되지 않음
**해결 순서**:
1. `game.json` 문법 확인
2. `/api/admin/rescan` POST 요청
3. 서버 재시작
4. `/api/games` API로 확인

### 4. 성능 문제
**문제**: 게임이 끊기거나 느림
**해결**:
- 센서 데이터 throttling (33ms)
- requestAnimationFrame 사용
- 렌더링 최적화
- 메모리 누수 확인

## 디버깅 도구
```javascript
// SDK 디버그 모드
const sdk = new SessionSDK({ debug: true });

// 센서 데이터 로깅
sdk.on('sensor-data', (data) => {
    console.table(data.data.orientation);
});

// 성능 모니터링
performance.mark('game-start');
// ... 게임 로직
performance.mark('game-end');
performance.measure('game-duration', 'game-start', 'game-end');
```

현재 어떤 문제가 발생하고 있는지 구체적으로 알려주시면 해결 방법을 제시하겠습니다.
```

### 최적화 프롬프트
```
# Sensor Game 성능 최적화

게임 성능을 최적화해주세요.

## 최적화 영역

### 1. 센서 데이터 처리
```javascript
// 센서 데이터 throttling
let lastSensorUpdate = 0;
const SENSOR_THROTTLE = 33; // 30fps

sdk.on('sensor-data', (event) => {
    const now = Date.now();
    if (now - lastSensorUpdate < SENSOR_THROTTLE) return;
    
    lastSensorUpdate = now;
    processSensorData(event.detail || event);
});
```

### 2. 렌더링 최적화
```javascript
// 렌더링 프레임 제한
let lastRenderTime = 0;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

function gameLoop(currentTime) {
    if (currentTime - lastRenderTime >= FRAME_TIME) {
        update();
        render();
        lastRenderTime = currentTime;
    }
    requestAnimationFrame(gameLoop);
}
```

### 3. 메모리 관리
```javascript
// 이벤트 리스너 정리
function cleanup() {
    sdk.off('sensor-data', sensorHandler);
    cancelAnimationFrame(animationId);
    
    // 캔버스 정리
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
```

### 4. 네트워크 최적화
- 센서 데이터 전송 빈도 조절
- 불필요한 데이터 필터링
- 연결 상태 모니터링

## 성능 측정
```javascript
// FPS 측정
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
        console.log(`FPS: ${frameCount}`);
        frameCount = 0;
        lastTime = currentTime;
    }
}
```

현재 게임의 성능 이슈를 구체적으로 알려주시면 맞춤형 최적화 방안을 제시하겠습니다.
```

---

## 📝 사용 방법

1. **초기 프롬프트**: 새 프로젝트 시작 시 "프로젝트 초기화 프롬프트" 사용
2. **게임 개발**: 게임 유형에 따라 해당 프롬프트 선택
3. **문제 해결**: 이슈 발생 시 "디버깅 프롬프트" 활용
4. **최적화**: 성능 개선이 필요할 때 "최적화 프롬프트" 사용

## 🎯 주의사항

- 항상 `DEVELOPER_GUIDE.md` 문서를 먼저 참조
- 기존 예제 게임들의 구조를 따라 일관성 유지
- SessionSDK 이벤트 처리 시 CustomEvent 패턴 준수
- 모든 파일 경로는 절대 경로로 작성
- 게임 완성 후 반드시 테스트 진행

---

Happy Coding with AI! 🤖✨