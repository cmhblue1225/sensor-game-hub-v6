# 3D Racing Game - 배포용 패키지

## 🎮 게임 소개
모바일 센서를 사용한 2인 경쟁 3D 레이싱 게임입니다. 기기를 기울여서 자동차를 조작하고 친구와 함께 경주를 즐기세요!

## 📁 파일 구조
```
3d-racing-game/
├── index.html          # 메인 게임 파일
├── game.json          # 게임 메타데이터
├── styles.css         # 스타일시트
├── game-modes.js      # 게임 모드 관리
├── js/
│   └── game.js       # 메인 게임 로직
├── assets/
│   ├── thumbnail.png # 게임 썸네일
│   └── screenshot1.png # 스크린샷
└── README.md         # 이 파일
```

## 🚀 설치 방법

### 1. Sensor Game Hub에 설치
1. 이 폴더 전체를 허브의 `public/games/` 디렉터리에 복사
2. 폴더명을 `3d-racing-game`으로 변경 (필요시)
3. 허브 서버 재시작
4. 게임이 자동으로 등록됨

### 2. 독립 실행
1. 웹 서버에서 이 폴더를 호스팅
2. `index.html`을 브라우저에서 열기
3. SessionSDK가 자동으로 로드됨

## ⚙️ 시스템 요구사항

### 서버 환경
- Node.js 16.0.0 이상
- Express.js 서버
- Socket.IO 지원
- SessionSDK 통합

### 클라이언트 환경
- **데스크톱**: Chrome, Firefox, Safari, Edge
- **모바일**: iOS Safari, Android Chrome
- **센서**: DeviceOrientationEvent, DeviceMotionEvent 지원

## 🎯 게임 특징

### 게임 모드
- **빠른 경주**: 3랩 경주로 빠른 승부
- **베스트 오브 3**: 3경주 중 2승 먼저 달성
- **타임 어택**: 제한 시간 내 최고 기록 도전

### 주요 기능
- 분할 화면 2인 플레이
- 실시간 센서 입력 처리
- 3D 렌더링 엔진
- 물리 기반 자동차 시뮬레이션
- 충돌 감지 시스템
- 오디오 효과
- 랩 타이밍 시스템

## 🔧 설정 및 커스터마이징

### game.json 설정
```json
{
  "id": "3d-racing-game",
  "gameType": "dual",
  "minPlayers": 2,
  "maxPlayers": 2,
  "difficulty": "medium"
}
```

### 성능 최적화
- 목표 FPS: 60fps
- 최소 FPS: 30fps
- 메모리 사용량: < 100MB
- 로딩 시간: < 5초

## 🐛 문제 해결

### 자주 발생하는 문제

1. **센서가 연결되지 않음**
   - 모바일 기기에서 센서 권한 확인
   - HTTPS 환경에서 실행 필요
   - 브라우저 호환성 확인

2. **게임이 허브에 등록되지 않음**
   - `game.json` 파일 문법 확인
   - 서버 재시작
   - `/api/games` 엔드포인트 확인

3. **성능 문제**
   - 브라우저 개발자 도구에서 성능 확인
   - 메모리 사용량 모니터링
   - 네트워크 연결 상태 확인

### 디버그 모드
URL에 `?debug=true` 추가하면 디버그 정보가 콘솔에 출력됩니다.

## 📞 지원

### 기술 지원
- 이슈 리포트: GitHub Issues
- 이메일: support@sensorgamehub.com
- 문서: DEVELOPER_GUIDE.md

### 라이선스
MIT License - 자유롭게 사용, 수정, 배포 가능

## 🔄 업데이트 히스토리

### v1.0.0 (2025-01-17)
- 초기 릴리스
- 3D 레이싱 게임 완성
- Sensor Game Hub v6.0 호환
- 다중 게임 모드 지원
- 크로스 플랫폼 호환성

---

**즐거운 게임 되세요!** 🏁🎮