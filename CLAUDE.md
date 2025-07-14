# CLAUDE.md - AI Assistant Project Guide

## 📋 프로젝트 개요

**Sensor Game Hub v6.0**는 모바일 센서 기반 실시간 게임 플랫폼입니다.

### 🎯 핵심 특징
- **완전한 게임별 독립 세션 시스템**
- **실시간 센서 데이터 처리** (DeviceMotion/Orientation API)
- **자동 게임 스캔 및 등록** 시스템
- **3가지 게임 타입**: Solo(1명), Dual(2명), Multi(최대 8명)
- **WebSocket 기반** 실시간 통신

---

## 🏗️ 아키텍처

### 서버 구조 (Node.js + Express + Socket.IO)
```
server/
├── index.js           # 메인 서버 (GameServer 클래스)
├── SessionManager.js   # 세션 관리 (4자리 코드, 센서 연결)
└── GameScanner.js     # 자동 게임 스캔 및 등록
```

### 클라이언트 구조
```
public/
├── js/SessionSDK.js   # 통합 게임 개발 SDK
├── sensor.html        # 모바일 센서 클라이언트
└── games/            # 게임 폴더 (자동 등록)
    ├── solo/         # 1인용 게임
    ├── dual/         # 2인 협력 게임
    ├── multi/        # 다인 경쟁 게임
    ├── tilt-maze/    # 기울기 미로 게임
    └── rhythm-blade/ # 3D 리듬 게임 (dual)
```

---

## 🚀 개발 워크플로우

### 1. 서버 시작
```bash
npm install
npm start
```

### 2. 새 게임 개발
1. `public/games/[게임명]/` 폴더 생성
2. `index.html` (필수) 및 `game.json` (선택) 파일 작성
3. 서버 재시작 → 자동 등록

### 3. 게임 접속
- **메인 허브**: http://localhost:3000
- **특정 게임**: http://localhost:3000/games/[게임명]
- **센서 클라이언트**: http://localhost:3000/sensor.html

---

## 🛠️ 핵심 컴포넌트

### SessionSDK (클라이언트 SDK)
```javascript
const sdk = new SessionSDK({
    gameId: 'my-game',
    gameType: 'dual',    // 'solo', 'dual', 'multi'
    debug: true
});

// ✅ 필수 패턴: 연결 완료 후 세션 생성
sdk.on('connected', () => {
    sdk.createSession();
});

// ✅ 필수 패턴: CustomEvent 처리
sdk.on('session-created', (event) => {
    const session = event.detail || event;  // 중요!
    console.log('세션 코드:', session.sessionCode);
});
```

### 게임 메타데이터 (game.json)
```json
{
  "id": "my-game",
  "title": "My Game",
  "description": "게임 설명",
  "category": "dual",
  "icon": "🎮",
  "maxPlayers": 2,
  "sensors": ["orientation", "motion"]
}
```

---

## 📝 개발 지침

### ⚠️ 필수 구현 패턴

#### 1. 서버 연결 순서
```javascript
// ❌ 잘못된 방법
constructor() {
    this.sdk = new SessionSDK({...});
    this.sdk.createSession(); // 연결 전 세션 생성 - 실패!
}

// ✅ 올바른 방법
constructor() {
    this.sdk = new SessionSDK({...});
    this.setupEvents();
}

setupEvents() {
    this.sdk.on('connected', () => {
        this.createSession(); // 연결 완료 후 세션 생성
    });
}
```

#### 2. CustomEvent 처리
```javascript
// ❌ 잘못된 방법
sdk.on('session-created', (session) => {
    console.log(session.sessionCode); // undefined!
});

// ✅ 올바른 방법
sdk.on('session-created', (event) => {
    const session = event.detail || event; // 필수 패턴!
    console.log(session.sessionCode);
});
```

#### 3. QR 코드 안전 생성
```javascript
if (typeof QRCode !== 'undefined') {
    // QRCode 라이브러리 사용
    QRCode.toCanvas(canvas, url, callback);
} else {
    // 폴백: 외부 API 사용
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
}
```

### 🎮 게임 타입별 특징

#### Solo Game (1명)
- `gameType: 'solo'`
- 센서 ID: `'sensor'`
- 단일 센서 이벤트 처리

#### Dual Game (2명)
- `gameType: 'dual'`
- 센서 ID: `'sensor1'`, `'sensor2'`
- 협력 요소 구현 필수
- 연결 상태 UI 표시

#### Multi Game (3-8명)
- `gameType: 'multi'`
- 센서 ID: `'player1'`, `'player2'`, ...
- 실시간 리더보드
- 성능 최적화 필요

---

## 🔧 테스트 및 디버깅

### 개발 모드
```bash
npm start  # 개발/운영 동일
```

### API 엔드포인트
- `GET /api/games` - 게임 목록
- `GET /api/games/:gameId` - 특정 게임 정보
- `POST /api/admin/rescan` - 게임 재스캔
- `GET /api/stats` - 서버 통계

### 디버깅 도구
```javascript
// SDK 디버그 모드
const sdk = new SessionSDK({ debug: true });

// 센서 데이터 로깅
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    console.table(data.data.orientation);
});
```

### 키보드 테스트
```javascript
// 센서 미연결시 키보드 컨트롤 구현
window.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case 'q': this.triggerAction('left'); break;
        case 'e': this.triggerAction('right'); break;
        case ' ': this.triggerSpecialAction(); break;
    }
});
```

---

## 🚨 자주 발생하는 문제

### 1. "서버에 연결되지 않았습니다" 오류
**원인**: 연결 완료 전 세션 생성 시도
**해결**: `connected` 이벤트 기다리기

### 2. 세션 코드가 undefined
**원인**: CustomEvent 직접 사용
**해결**: `event.detail || event` 패턴 사용

### 3. QR 코드 생성 실패
**원인**: QRCode 라이브러리 로드 실패
**해결**: 폴백 API 구현

### 4. 게임이 허브에 등록 안됨
**해결 순서**:
1. `game.json` 문법 확인
2. `/api/admin/rescan` POST 요청
3. 서버 재시작
4. 브라우저 캐시 새로고침

---

## 📚 참고 문서

- `README.md` - 프로젝트 전체 개요
- `DEVELOPER_GUIDE.md` - 상세 개발 가이드
- `AI_ASSISTANT_PROMPTS.md` - AI 개발용 프롬프트
- `GAME_TEMPLATE.html` - 게임 개발 템플릿

---

## 🔄 버전 관리

### 현재 버전: v6.0.0
- 게임별 독립 세션 시스템
- 자동 게임 스캔 및 등록
- 통합 센서 클라이언트
- 3가지 게임 타입 지원

### 의존성
- Node.js >= 16.0.0
- Express ^4.18.2
- Socket.IO ^4.7.2
- Three.js (게임별 선택사용)

---

## 💡 AI Assistant 사용시 주의사항

1. **항상 지침 문서 먼저 참조**: `AI_ASSISTANT_PROMPTS.md`
2. **기존 예제 게임 구조 따르기**: `/games/` 폴더 참조
3. **CustomEvent 패턴 준수**: `event.detail || event`
4. **절대 경로 사용**: 모든 파일 경로는 `/`로 시작
5. **QR 코드 폴백 처리**: 라이브러리 로드 실패 대응

---

## 🎯 다음 개발 계획

- [ ] 게임 결과 저장 시스템
- [ ] 사용자 랭킹 시스템  
- [ ] PWA 지원
- [ ] 음향 효과 시스템
- [ ] 테스트 스위트 구현

---

**Happy Gaming with AI! 🤖✨**