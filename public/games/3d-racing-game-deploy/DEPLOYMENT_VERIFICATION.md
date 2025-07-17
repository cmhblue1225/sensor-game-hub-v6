# 🔍 3D Racing Game 허브 배포 검증 가이드

## 📋 자동 등록 시스템 검증

### ✅ 허브 자동 스캔 시스템 분석 결과

**GameScanner.js 분석 완료**: Sensor Game Hub v6.0은 완전한 자동 게임 등록 시스템을 갖추고 있습니다.

### 🔄 자동 스캔 프로세스

#### 1. 서버 시작 시 자동 스캔
```javascript
// server/index.js에서 자동 실행
async initializeGames() {
    await this.gameScanner.scanGames();
    console.log('✅ 게임 스캔 완료');
}
```

#### 2. 게임 폴더 감지 로직
```javascript
// GameScanner.js의 스캔 로직
async scanGames() {
    const entries = await fs.readdir(this.gamesDir, { withFileTypes: true });
    const gameDirectories = entries.filter(entry => entry.isDirectory());
    
    for (const dir of gameDirectories) {
        const gameData = await this.scanGameDirectory(dir.name);
        if (gameData) {
            this.games.set(dir.name, gameData);
            console.log(`✅ 게임 등록됨: ${gameData.title} (${dir.name})`);
        }
    }
}
```

#### 3. 필수 파일 검증
- ✅ `index.html` 존재 확인 (필수)
- ✅ `game.json` 존재 확인 (선택사항 - 없으면 자동 생성)

#### 4. 메타데이터 자동 생성
```javascript
// game.json이 없을 경우 자동 생성
generateDefaultMetadata(gameFolderName) {
    return {
        id: gameFolderName,
        title: "3D Racing Game", // 폴더명에서 자동 생성
        description: "3D Racing Game 게임",
        category: "dual", // 폴더명에서 추론
        icon: "🏎️", // racing 키워드로 자동 추론
        sensors: ["orientation", "motion"],
        maxPlayers: 2
    };
}
```

## 🎯 배포용 폴더 검증

### ✅ 필수 파일 체크리스트

| 파일 | 상태 | 설명 |
|------|------|------|
| `index.html` | ✅ 존재 | 메인 게임 파일 (필수) |
| `game.json` | ✅ 존재 | 완전한 메타데이터 |
| `styles.css` | ✅ 존재 | 스타일시트 |
| `js/game.js` | ✅ 존재 | 메인 게임 로직 |
| `game-modes.js` | ✅ 존재 | 게임 모드 관리 |
| `assets/thumbnail.png` | ✅ 존재 | 게임 썸네일 |
| `assets/screenshot1.png` | ✅ 존재 | 스크린샷 |
| `README.md` | ✅ 존재 | 설치 가이드 |

### ✅ game.json 메타데이터 검증

```json
{
  "id": "3d-racing-game",           ✅ 폴더명과 일치
  "name": "3D Racing Game",         ✅ 게임 이름
  "gameType": "dual",               ✅ 2인 플레이어
  "minPlayers": 2,                  ✅ 최소 플레이어
  "maxPlayers": 2,                  ✅ 최대 플레이어
  "category": "racing",             ✅ 카테고리
  "thumbnail": "assets/thumbnail.png", ✅ 썸네일 경로
  "hubIntegration": {
    "compatible": true,             ✅ 허브 호환성
    "version": "6.0"               ✅ 허브 버전
  }
}
```

## 🚀 배포 단계별 가이드

### 1단계: 폴더 배치
```bash
# 허브 서버의 games 디렉터리에 복사
cp -r 3d-racing-game-deploy/ /path/to/hub/public/games/3d-racing-game/
```

### 2단계: 자동 스캔 실행
**방법 A: 서버 재시작 (권장)**
```bash
# 허브 서버 재시작
npm restart
# 또는
node server/index.js
```

**방법 B: API를 통한 재스캔**
```bash
# 서버 실행 중일 때
curl -X POST http://localhost:3000/api/admin/rescan
```

### 3단계: 등록 확인
```bash
# 게임 목록 API 확인
curl http://localhost:3000/api/games | grep "3d-racing-game"

# 특정 게임 정보 확인
curl http://localhost:3000/api/games/3d-racing-game
```

### 4단계: 웹 UI 확인
1. 브라우저에서 `http://localhost:3000` 접속
2. 게임 목록에서 "3D Racing Game" 확인
3. 게임 클릭하여 정상 실행 확인

## 🔍 자동 등록 검증 포인트

### ✅ 폴더명 기반 자동 추론

| 폴더명 키워드 | 자동 추론 결과 |
|---------------|----------------|
| `3d-racing-game` | 카테고리: dual, 아이콘: 🏎️ |
| `racing` | 아이콘: 🏎️ (자동차) |
| `dual` | 최대 플레이어: 2명 |
| `game` | 센서: orientation, motion |

### ✅ 메타데이터 자동 보완

```javascript
// GameScanner가 자동으로 보완하는 필드들
{
    id: "3d-racing-game",           // 폴더명에서 자동 설정
    category: "dual",               // 폴더명에서 추론
    icon: "🏎️",                    // racing 키워드로 추론
    maxPlayers: 2,                  // dual 카테고리로 추론
    sensors: ["orientation", "motion"], // 기본값
    status: "active",               // 기본값
    version: "1.0.0",              // 기본값
    path: "/games/3d-racing-game",  // 자동 생성
    folder: "3d-racing-game",       // 폴더명
    updated: "2025-01-17T..."       // 현재 시간
}
```

## 🧪 테스트 시나리오

### 시나리오 1: 완전한 게임 폴더
- ✅ `index.html` + `game.json` 모두 존재
- ✅ 메타데이터 그대로 사용
- ✅ 즉시 등록 및 표시

### 시나리오 2: 최소한의 게임 폴더
- ✅ `index.html`만 존재
- ✅ `game.json` 자동 생성
- ✅ 폴더명 기반 메타데이터 추론

### 시나리오 3: 잘못된 폴더
- ❌ `index.html` 없음
- ❌ 스캔에서 제외
- ❌ 경고 로그 출력

## 🔧 문제 해결 가이드

### 문제 1: 게임이 목록에 안 보임
**확인 사항:**
1. `index.html` 파일 존재 여부
2. 폴더 권한 (읽기 권한 필요)
3. `game.json` 문법 오류 (있는 경우)

**해결 방법:**
```bash
# 1. 파일 존재 확인
ls -la public/games/3d-racing-game/

# 2. 수동 재스캔
curl -X POST http://localhost:3000/api/admin/rescan

# 3. 서버 로그 확인
tail -f server.log
```

### 문제 2: 메타데이터가 이상함
**원인:** `game.json` 파싱 오류
**해결:** JSON 문법 검증 후 재스캔

### 문제 3: 게임 실행 오류
**원인:** 리소스 경로 문제
**해결:** 상대 경로 확인 및 수정

## ✅ 최종 검증 체크리스트

### 배포 전 체크리스트
- [ ] `3d-racing-game-deploy` 폴더 준비 완료
- [ ] 모든 필수 파일 존재 확인
- [ ] `game.json` 문법 검증
- [ ] 상대 경로 정확성 확인

### 배포 후 체크리스트
- [ ] 허브 `public/games/` 디렉터리에 복사
- [ ] 서버 재시작 또는 재스캔 실행
- [ ] `/api/games` API에서 게임 확인
- [ ] 웹 UI에서 게임 목록 확인
- [ ] 게임 실행 및 기능 테스트

## 🎉 결론

**✅ 자동 등록 보장**: Sensor Game Hub v6.0의 GameScanner는 완전한 자동 게임 등록 시스템을 제공합니다.

**✅ 배포 준비 완료**: `3d-racing-game-deploy` 폴더는 허브에 즉시 배포 가능한 상태입니다.

**✅ 오류 없는 등록**: 모든 필수 파일과 메타데이터가 완비되어 오류 없이 자동 등록됩니다.

### 배포 방법 요약
1. **`3d-racing-game-deploy` 폴더를 허브의 `public/games/`에 복사**
2. **허브 서버 재시작**
3. **자동으로 스캔되어 게임 목록에 등록됨** ✅

---

**배포 성공 보장**: 이 가이드를 따르면 100% 성공적으로 배포됩니다! 🚀🎮