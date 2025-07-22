# 🎂 케이크 배달 게임 - 상용 버전

## 개요

고급 물리 엔진과 3D 그래픽 기술을 활용한 차세대 모바일 센서 게임입니다. PBR(물리 기반 렌더링), 실시간 조명, 고급 물리 시뮬레이션을 통해 몰입감 있는 케이크 배달 경험을 제공합니다.

## 🚀 주요 기능

### 그래픽 시스템
- **PBR 재질 시스템**: 물리 기반 렌더링으로 사실적인 재질 표현
- **고급 조명**: 다중 조명, 동적 그림자, 환경 조명
- **3D 캐릭터 애니메이션**: GLB 모델 기반 부드러운 애니메이션
- **파티클 시스템**: 충돌, 폭발, 환경 효과

### 물리 시스템
- **Cannon.js 통합**: 정밀한 물리 시뮬레이션
- **케이크별 물리 특성**: 6가지 케이크 타입별 고유 물리 속성
- **고급 충돌 감지**: 타입별 세분화된 충돌 처리
- **환경 물리**: 바람, 중력 변화, 온도 효과

### 센서 시스템
- **데이터 스무딩**: 칼만 필터, 지수 평활법 등 고급 필터링
- **예측 알고리즘**: 네트워크 지연 보상 및 반응성 향상
- **적응형 보정**: 사용자별 센서 특성 학습

## 🎮 게임플레이

### 케이크 타입
1. **Basic** - 기본 케이크 (균형잡힌 특성)
2. **Strawberry** - 딸기 케이크 (가벼움, 높은 마찰력)
3. **Chocolate** - 초콜릿 케이크 (무거움, 안정적)
4. **Wedding** - 웨딩 케이크 (매우 무거움, 섬세함)
5. **Ice** - 아이스크림 케이크 (미끄러움, 녹는 효과)
6. **Bomb** - 폭탄 케이크 (위험함, 특수 효과)

### 조작법
- **기울기**: 기기를 기울여 케이크 이동
- **흔들기**: 특수 물리 효과 발동
- **회전**: 3D 시점 조절 (선택사항)

## 🛠️ 기술 스택

### 핵심 기술
- **Three.js**: 3D 그래픽 렌더링
- **Cannon.js**: 물리 엔진
- **WebGL 2.0**: 하드웨어 가속 렌더링
- **SessionSDK**: 센서 데이터 통신

### 시스템 아키텍처
```
GameEngine (핵심 엔진)
├── Graphics System
│   ├── GLBModelManager
│   ├── PBRMaterialSystem
│   ├── AdvancedLightingSystem
│   ├── CharacterAnimationSystem
│   └── ParticleSystem
├── Physics System
│   ├── PhysicsWorldManager
│   ├── CakePhysicsSystem
│   ├── CollisionDetectionSystem
│   └── EnvironmentalPhysics
└── Input System
    ├── SensorSmoothingSystem
    └── SensorPredictionSystem
```

## 📱 시스템 요구사항

### 최소 요구사항
- **브라우저**: Chrome 90+, Safari 14+, Firefox 88+
- **센서**: DeviceOrientationEvent, DeviceMotionEvent
- **WebGL**: 2.0 지원 필수
- **메모리**: 512MB RAM 권장

### 권장 사양
- **최신 모바일 브라우저**
- **자이로스코프 센서 지원**
- **1GB+ RAM**
- **안정적인 네트워크 연결**

## 🚀 설치 및 실행

### 개발 환경 설정
```bash
# 프로젝트 클론
git clone [repository-url]
cd sensor-game-hub-v6

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

### 게임 접속
1. 브라우저에서 `http://localhost:3000` 접속
2. 케이크 배달 게임 선택
3. QR 코드로 모바일 기기 연결
4. 센서 권한 허용 후 게임 시작

## 🎯 성능 최적화

### 자동 품질 조절
- **적응형 렌더링**: 기기 성능에 따른 자동 품질 조절
- **LOD 시스템**: 거리 기반 모델 품질 최적화
- **메모리 관리**: 자동 가비지 컬렉션 및 메모리 풀링

### 배터리 효율성
- **센서 데이터 스로틀링**: 불필요한 센서 호출 최소화
- **렌더링 최적화**: 60fps 목표 프레임 레이트 유지
- **네트워크 최적화**: 효율적인 데이터 전송

## 🔧 개발자 가이드

### 새로운 케이크 타입 추가
```javascript
// CakePhysicsSystem.js에서 속성 정의
this.cakeProperties.newCake = {
    mass: 1.0,
    friction: 0.5,
    restitution: 0.2,
    wobbleStrength: 1.0,
    stabilityFactor: 0.8,
    tiltSensitivity: 1.0,
    maxTiltForce: 5.0
};

// PBRMaterialSystem.js에서 재질 정의
this.materialPresets.cake.newCake = {
    color: 0xFF0000,
    roughness: 0.8,
    metalness: 0.0,
    emissive: 0x000000
};
```

### 새로운 환경 효과 추가
```javascript
// EnvironmentalPhysics.js에서 효과 정의
this.addEnvironmentalZone('tornado', {
    center: { x: 0, y: 0, z: 0 },
    radius: 5,
    effects: {
        force: { x: 0, y: 2, z: 0 },
        damping: 0.5
    }
});
```

## 📊 성능 모니터링

### 디버그 모드
- **F1**: 디버그 패널 토글
- **F5**: 게임 재시작
- **Space**: 일시정지/재개

### 모니터링 지표
- **FPS**: 실시간 프레임 레이트
- **메모리 사용량**: JavaScript 힙 메모리
- **물리 바디 수**: 활성 물리 오브젝트
- **센서 품질**: 센서 데이터 신뢰도

## 🐛 문제 해결

### 일반적인 문제
1. **센서가 작동하지 않음**
   - HTTPS 연결 확인
   - 센서 권한 허용 확인
   - 브라우저 호환성 확인

2. **성능이 느림**
   - 디버그 모드에서 성능 지표 확인
   - 브라우저 하드웨어 가속 활성화
   - 백그라운드 앱 종료

3. **연결이 불안정함**
   - 네트워크 연결 상태 확인
   - 방화벽 설정 확인
   - 서버 재시작

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 발생하거나 질문이 있으시면:
- GitHub Issues 생성
- 개발자 문서 참조
- 커뮤니티 포럼 이용

---

**케이크 배달 게임 v2.0** - 차세대 모바일 센서 게임의 새로운 기준을 제시합니다.