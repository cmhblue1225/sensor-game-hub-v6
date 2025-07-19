---
inclusion: always
---

# 한국어 응답 규칙

이 문서는 모든 AI 응답에서 한국어 사용에 대한 필수 지침을 제공합니다.

## 언어 설정

### 기본 원칙
- **모든 응답은 한국어로 작성해야 합니다**
- 사용자와의 모든 대화, 설명, 피드백은 한국어로 작성
- 코드 주석도 가능한 한 한국어로 작성합니다
- 기술 용어는 필요시 영어와 한국어를 병행 표기합니다 (예: "컨테이너(container)", "센서 데이터(sensor data)")
- 에러 메시지나 로그는 원본 언어를 유지하되, 설명은 한국어로 제공합니다

### 코드 작성 규칙
```javascript
// ✅ 올바른 예시 - 한국어 주석
function handleSensorData(data) {
    // 센서 데이터 유효성 검사
    if (!data || !data.orientation) {
        console.log('유효하지 않은 센서 데이터');
        return;
    }
    
    // 플레이어 이동 처리
    updatePlayerMovement(data);
}

// ❌ 잘못된 예시 - 영어 주석
function handleSensorData(data) {
    // Validate sensor data
    if (!data || !data.orientation) {
        console.log('Invalid sensor data');
        return;
    }
    
    // Process player movement
    updatePlayerMovement(data);
}
```

## 예외 상황

다음의 경우에만 영어 사용이 허용됩니다:

### 1. 코드 자체
- 변수명, 함수명, 클래스명 등은 영어로 작성
- API 엔드포인트, 라이브러리 함수명 등

### 2. 공식 문서나 명령어
- 터미널 명령어: `npm install`, `git commit` 등
- 공식 API 문서 인용
- 라이브러리 공식 문서 참조

### 3. 에러 메시지
- 원본 에러 메시지는 그대로 유지
- 단, 에러에 대한 설명은 한국어로 제공

```javascript
// ✅ 올바른 예시
try {
    // 센서 연결 시도
    connectToSensor();
} catch (error) {
    // 원본 에러 메시지 유지, 설명은 한국어
    console.error('Connection failed:', error.message);
    showMessage('센서 연결에 실패했습니다. 다시 시도해주세요.');
}
```

### 4. 명시적 요청
- 사용자가 명시적으로 다른 언어를 요청하는 경우에만 예외 적용

## 실제 적용 예시

### 게임 개발 시
```javascript
class AcornBattleGame {
    constructor() {
        // 게임 상태 초기화
        this.gameState = {
            phase: 'waiting',  // 대기, 준비, 진행, 일시정지, 종료
            players: {},       // 플레이어 정보
            acorns: []        // 도토리 배열
        };
    }
    
    // 센서 데이터 처리 함수
    handleSensorData(data) {
        // 게임이 진행 중이 아니면 무시
        if (this.gameState.phase !== 'playing') return;
        
        // 플레이어 이동 업데이트
        this.updatePlayerMovement(data);
    }
}
```

### 사용자 응답 시
```markdown
현재 센서 데이터 처리 최적화 작업을 진행하고 있습니다. 

다음 기능들을 구현하겠습니다:
- 센서 데이터 throttling (33ms 간격)
- 데이터 유효성 검사 및 필터링
- 플레이어별 센서 데이터 분리 처리
- 연결 상태 모니터링 및 UI 반영

이 작업을 통해 게임의 성능과 안정성을 향상시킬 수 있습니다.
```

## 중요 사항

1. **일관성 유지**: 모든 응답에서 한국어 사용 규칙을 일관되게 적용
2. **자연스러운 표현**: 번역체가 아닌 자연스러운 한국어 사용
3. **기술 용어 병행**: 필요시 영어 원문과 한국어를 함께 표기
4. **사용자 친화적**: 기술적 내용도 이해하기 쉬운 한국어로 설명

이 규칙을 통해 한국어 사용자에게 더 나은 개발 경험을 제공할 수 있습니다.