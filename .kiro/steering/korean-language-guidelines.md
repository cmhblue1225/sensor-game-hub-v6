# 한국어 응답 규칙

## 🇰🇷 언어 설정

### 기본 원칙
- **모든 응답은 한국어로 작성해야 합니다**
- 사용자와의 모든 커뮤니케이션은 한국어를 기본으로 합니다
- 기술적 설명, 가이드, 문서화 모두 한국어로 제공합니다

### 코드 주석 규칙
```javascript
// ✅ 올바른 예시 - 한국어 주석
class SensorGame {
    constructor() {
        this.gameState = 'waiting'; // 게임 상태: 대기중, 플레이중, 일시정지, 종료
        this.score = 0;             // 현재 점수
        this.setupCanvas();         // 캔버스 초기화
    }
    
    // 센서 데이터 처리 함수
    processSensorData(data) {
        // 기기 기울기 데이터 검증
        if (!data || !data.orientation) {
            console.warn('유효하지 않은 센서 데이터');
            return;
        }
        
        // 좌우 기울기 값 계산 (-90도 ~ 90도)
        const tiltX = Math.max(-90, Math.min(90, data.orientation.gamma || 0));
        
        // 게임 로직에 기울기 값 적용
        this.handleTilt(tiltX);
    }
}
```

### 기술 용어 표기법
기술 용어는 필요시 영어와 한국어를 병행 표기합니다:

```javascript
// 예시: 기술 용어 병행 표기
- "컨테이너(container)"
- "세션(session)"  
- "센서 데이터(sensor data)"
- "이벤트 리스너(event listener)"
- "콜백 함수(callback function)"
- "API 엔드포인트(API endpoint)"
```

### 문서화 스타일
```markdown
## 게임 개발 가이드

### 1. 프로젝트 설정
새로운 센서 게임을 개발하기 위해 다음 단계를 따르세요:

1. **게임 폴더 생성**: `public/games/[게임명]/` 디렉토리 생성
2. **필수 파일 추가**: `index.html` 파일 생성 (필수)
3. **게임 메타데이터**: `game.json` 파일 생성 (선택사항)

### 2. SessionSDK 통합
```javascript
// SessionSDK 초기화
const sdk = new SessionSDK({
    gameId: 'my-game',      // 게임 고유 ID
    gameType: 'solo',       // 게임 타입: solo, dual, multi
    debug: true             // 디버그 모드 활성화
});
```

## 🚫 예외 상황

### 코드 작성 규칙
코드 자체는 영어로 작성합니다 (국제 표준 준수):
```javascript
// ✅ 올바른 예시 - 영어 변수명/함수명
class GameManager {
    constructor() {
        this.playerScore = 0;
        this.gameState = 'waiting';
    }
    
    startGame() {
        // 게임 시작 로직
    }
    
    updateScore(points) {
        // 점수 업데이트 로직
    }
}

// ❌ 잘못된 예시 - 한국어 변수명 (피해야 함)
class 게임매니저 {
    constructor() {
        this.플레이어점수 = 0;
    }
}
```

### 공식 문서 및 명령어
공식 문서나 명령어는 원본 언어를 유지합니다:
```bash
# 명령어는 원본 그대로
npm install
npm start
curl -X POST http://localhost:3000/api/admin/rescan

# Git 명령어
git add .
git commit -m "새로운 센서 게임 추가"
git push origin main
```

### 에러 메시지 처리
에러 메시지나 로그는 원본 언어를 유지하되, 설명은 한국어로 제공합니다:

```javascript
// 에러 처리 예시
try {
    const session = await sdk.createSession();
} catch (error) {
    // 원본 에러 메시지 유지
    console.error('Session creation failed:', error.message);
    
    // 한국어 설명 추가
    console.log('세션 생성에 실패했습니다. 서버 연결 상태를 확인해주세요.');
    
    // 사용자에게 한국어 메시지 표시
    alert('세션을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.');
}
```

### API 응답 및 로그
```javascript
// API 응답 로깅
fetch('/api/games')
    .then(response => response.json())
    .then(data => {
        console.log('API Response:', data); // 원본 데이터 유지
        console.log('게임 목록을 성공적으로 불러왔습니다.'); // 한국어 설명
    })
    .catch(error => {
        console.error('Fetch error:', error); // 원본 에러
        console.log('게임 목록을 불러오는데 실패했습니다.'); // 한국어 설명
    });
```

## 📝 문서 작성 가이드라인

### README 및 가이드 문서
```markdown
# 센서 게임 허브 v6.0

## 프로젝트 개요
이 프로젝트는 모바일 기기의 센서를 활용한 게임 플랫폼입니다.

## 주요 기능
- **자동 게임 등록**: 새로운 게임이 자동으로 감지되고 등록됩니다
- **실시간 센서 데이터**: 기기의 방향 및 움직임 센서 활용
- **다중 플레이어 지원**: 최대 8명까지 동시 플레이 가능

## 설치 방법
```bash
npm install
npm start
```

### 주석 작성 스타일
```javascript
/**
 * 센서 게임 클래스
 * 모바일 기기의 센서 데이터를 활용하여 게임을 구현합니다.
 */
class SensorGame {
    /**
     * 생성자
     * @param {string} gameId - 게임 고유 식별자
     * @param {string} gameType - 게임 타입 (solo, dual, multi)
     */
    constructor(gameId, gameType) {
        this.gameId = gameId;           // 게임 ID
        this.gameType = gameType;       // 게임 타입
        this.isConnected = false;       // 연결 상태
        
        this.initializeGame();          // 게임 초기화
    }
    
    /**
     * 센서 데이터 처리
     * @param {Object} sensorData - 센서에서 받은 데이터
     * @param {Object} sensorData.orientation - 기기 방향 정보
     * @param {Object} sensorData.acceleration - 가속도 정보
     */
    processSensorData(sensorData) {
        // 데이터 유효성 검사
        if (!this.validateSensorData(sensorData)) {
            console.warn('센서 데이터가 유효하지 않습니다');
            return;
        }
        
        // 게임 로직 처리
        this.updateGameLogic(sensorData);
    }
}
```

## 🎯 사용자 요청별 대응

### 명시적 언어 요청
사용자가 명시적으로 다른 언어를 요청하는 경우에만 예외 적용:

```
사용자: "Please explain this in English"
→ 영어로 응답

사용자: "日本語で説明してください"  
→ 일본어로 응답

사용자: "Can you write the documentation in English?"
→ 영어 문서 작성
```

### 기본 응답 패턴
```
사용자: "게임이 작동하지 않아요"
AI: "게임 작동 문제를 해결해드리겠습니다. 다음 사항들을 확인해보세요:

1. **브라우저 콘솔 확인**: F12를 눌러 개발자 도구를 열고 에러 메시지를 확인해주세요
2. **서버 연결 상태**: 네트워크 연결이 정상인지 확인해주세요  
3. **SessionSDK 초기화**: 다음 패턴이 올바르게 구현되었는지 확인해주세요:

```javascript
// 올바른 SessionSDK 초기화 패턴
sdk.on('connected', () => {
    console.log('서버에 연결되었습니다');
    this.createSession(); // 연결 완료 후 세션 생성
});
```

어떤 에러 메시지가 나타나는지 알려주시면 더 구체적으로 도움드릴 수 있습니다."
```

## 📋 체크리스트

### 응답 작성 전 확인사항
- [ ] 모든 설명이 한국어로 작성되었는가?
- [ ] 코드 주석이 한국어로 작성되었는가?
- [ ] 기술 용어에 필요시 영어 병기가 되었는가?
- [ ] 에러 메시지는 원본을 유지하고 한국어 설명을 추가했는가?
- [ ] 명령어나 공식 문서는 원본 언어를 유지했는가?
- [ ] 사용자가 다른 언어를 명시적으로 요청했는가?

### 코드 작성 시 확인사항
- [ ] 변수명, 함수명은 영어로 작성했는가?
- [ ] 주석은 한국어로 작성했는가?
- [ ] 에러 처리에서 한국어 설명을 추가했는가?
- [ ] 사용자 메시지는 한국어로 작성했는가?

이 가이드라인을 따라 일관성 있고 이해하기 쉬운 한국어 응답을 제공해주세요.