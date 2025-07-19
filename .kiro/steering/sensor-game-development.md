---
inclusion: always
---

# Sensor Game Hub v6.0 개발 지침

이 문서는 Sensor Game Hub v6.0에서 새로운 센서 게임을 개발할 때 반드시 따라야 할 최우선 지침입니다.

## 🗣️ 언어 사용 지침
**모든 응답과 커뮤니케이션은 한국어로 진행해야 합니다.** 사용자와의 모든 대화, 설명, 피드백은 한국어로 작성하되, 코드와 기술적 용어는 영어를 유지합니다.

## 🚨 필수 개발 규칙 (절대 위반 금지!)

### 1. SessionSDK 이벤트 처리 패턴
**모든 SessionSDK 이벤트는 반드시 `event.detail || event` 패턴으로 처리해야 합니다.**

```javascript
// ✅ 올바른 방법 (필수!)
sdk.on('session-created', (event) => {
    const session = event.detail || event;
    console.log(session.sessionCode);
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    processSensorData(data);
});

// ❌ 절대 금지! (CustomEvent 객체 직접 사용)
sdk.on('session-created', (session) => {
    console.log(session.sessionCode); // undefined 오류!
});
```

### 2. 서버 연결 완료 후 세션 생성
**반드시 `connected` 이벤트를 기다린 후 세션을 생성해야 합니다.**

```javascript
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

// ❌ 절대 금지! (연결 전 세션 생성)
constructor() {
    this.sdk = new SessionSDK({...});
    this.sdk.createSession(); // 오류 발생!
}
```

### 3. QR 코드 폴백 처리
**QRCode 라이브러리 로드 실패에 대비한 폴백 처리가 필수입니다.**

```javascript
// ✅ 안전한 구현 (필수!)
if (typeof QRCode !== 'undefined') {
    QRCode.toCanvas(canvas, url, callback);
} else {
    // 폴백: 외부 API 사용
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    container.appendChild(img);
}
```

## 📁 프로젝트 구조

### 필수 파일 구조
```
public/games/[게임명]/
├── index.html          (필수)
├── game.json          (선택, 메타데이터)
└── assets/            (선택, 게임 리소스)
```

### 기술 스택
- **서버**: Node.js + Express + Socket.IO
- **클라이언트**: HTML5 + Canvas + SessionSDK
- **센서**: DeviceOrientationEvent, DeviceMotionEvent
- **배포**: Render.com (자동 배포)

## 🎮 게임 타입별 개발 가이드

### Solo Game (1인용)
```javascript
const sdk = new SessionSDK({
    gameType: 'solo',
    serverUrl: window.location.origin
});
```

### Dual Game (2인 협력)
```javascript
const sdk = new SessionSDK({
    gameType: 'dual',
    serverUrl: window.location.origin
});

// 센서별 구분 처리
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    if (data.sensorId === 'sensor1') {
        // 플레이어 1 처리
    } else if (data.sensorId === 'sensor2') {
        // 플레이어 2 처리
    }
});
```

### Multi Game (3-8인 경쟁)
```javascript
const sdk = new SessionSDK({
    gameType: 'multi',
    serverUrl: window.location.origin
});

// 플레이어별 상태 관리
const players = {};
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    players[data.sensorId] = data.data;
});
```

## 📱 센서 데이터 구조

```javascript
{
    sensorId: "sensor" | "sensor1" | "sensor2" | "player1" | "player2" | ...,
    gameType: "solo" | "dual" | "multi",
    data: {
        orientation: { 
            alpha: number,    // 나침반 방향 (0-360)
            beta: number,     // 앞뒤 기울기 (-180~180)
            gamma: number     // 좌우 기울기 (-90~90)
        },
        acceleration: { 
            x: number,        // 좌우 가속도
            y: number,        // 상하 가속도  
            z: number         // 앞뒤 가속도
        },
        rotationRate: { 
            alpha: number,    // Z축 회전 속도
            beta: number,     // X축 회전 속도
            gamma: number     // Y축 회전 속도
        }
    }
}
```

## 🎨 UI 개발 가이드

### 필수 UI 요소
1. **세션 정보 패널**: 세션 코드, QR 코드
2. **게임 캔버스**: 메인 게임 화면
3. **컨트롤 패널**: 재시작, 일시정지, 허브로 돌아가기
4. **상태 표시**: 점수, 타이머, 연결 상태

### CSS 테마 변수 사용
```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    --background-color: #0f172a;
    --text-color: #f1f5f9;
    --border-radius: 12px;
}
```

### 허브로 돌아가기 링크
```html
<a href="/" class="hub-link">🏠 허브로 돌아가기</a>
```

## ⚡ 성능 최적화

### 센서 데이터 Throttling
```javascript
let lastSensorUpdate = 0;
const SENSOR_THROTTLE = 33; // 30fps

sdk.on('sensor-data', (event) => {
    const now = Date.now();
    if (now - lastSensorUpdate < SENSOR_THROTTLE) return;
    
    lastSensorUpdate = now;
    const data = event.detail || event;
    processSensorData(data);
});
```

### 렌더링 최적화
```javascript
let animationId;
function gameLoop() {
    update();
    render();
    animationId = requestAnimationFrame(gameLoop);
}

// 정리 함수
function cleanup() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
}
```

## 🔧 디버깅 도구

### SDK 디버그 모드
```javascript
const sdk = new SessionSDK({ 
    debug: true,
    gameType: 'solo',
    serverUrl: window.location.origin
});
```

### 센서 데이터 로깅
```javascript
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    console.table(data.data.orientation);
});
```

## 📋 개발 체크리스트

### 필수 구현 사항
- [ ] SessionSDK 통합 (`connected` 이벤트 후 세션 생성)
- [ ] 모든 SDK 이벤트에서 `event.detail || event` 패턴 사용
- [ ] QR 코드 폴백 처리 구현
- [ ] 센서 데이터 처리 및 게임 로직
- [ ] 허브로 돌아가기 링크 (`href="/"`)
- [ ] 반응형 UI 및 모바일 최적화
- [ ] 성능 최적화 (throttling, requestAnimationFrame)

### 테스트 사항
- [ ] 서버 연결 및 세션 생성 테스트
- [ ] 센서 연결 및 데이터 수신 테스트
- [ ] QR 코드 생성 및 폴백 테스트
- [ ] 게임 로직 및 UI 업데이트 테스트
- [ ] 모바일 기기에서 센서 동작 테스트

## 🚫 절대 하지 말아야 할 것들

1. **즉시 세션 생성**: 생성자에서 바로 `createSession()` 호출
2. **CustomEvent 무시**: `(session) =>` 대신 `(event) => event.detail || event` 사용
3. **QR 라이브러리 의존**: 로드 실패 시 대안 없음
4. **센서 데이터 직접 접근**: `data.orientation` 대신 `(event.detail || event).data.orientation`
5. **상대 경로 사용**: 모든 파일 경로는 절대 경로로
6. **성능 무시**: 센서 데이터 throttling 없이 처리

## 📝 중요 참고사항

### 게임 테스트
**게임 테스트는 사용자가 직접 수행합니다.** AI는 게임 개발 완료 후 별도의 테스트를 수행하지 않습니다. 코드 구현에만 집중하고, 실제 게임 동작 테스트는 사용자가 브라우저에서 직접 확인합니다.

---

**이 지침을 반드시 준수하여 안정적이고 일관된 게임을 개발하세요!**