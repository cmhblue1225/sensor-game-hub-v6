/**
 * AudioIntegration Class - 게임과 AudioManager 통합
 * 게임 이벤트에 따른 오디오 재생 관리
 */
class AudioIntegration {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.audioManager = null;
        this.isEnabled = true;
        this.lastEngineUpdate = { player1: 0, player2: 0 };
        
        this.initializeAudio();
        this.setupGameEventListeners();
    }
    
    async initializeAudio() {
        try {
            // AudioManager 초기화
            if (typeof AudioManager !== 'undefined') {
                this.audioManager = new AudioManager();
                console.log('✅ AudioIntegration 초기화 완료');
            } else {
                console.warn('⚠️ AudioManager 클래스를 찾을 수 없습니다');
                this.isEnabled = false;
            }
        } catch (error) {
            console.error('❌ AudioIntegration 초기화 실패:', error);
            this.isEnabled = false;
        }
    }
    
    setupGameEventListeners() {
        if (!this.gameManager) return;
        
        // 게임 상태 변화 감지
        if (typeof this.gameManager.on === 'function') {
            this.gameManager.on('raceStart', () => this.onRaceStart());
            this.gameManager.on('raceEnd', (data) => this.onRaceEnd(data));
            this.gameManager.on('lapComplete', (data) => this.onLapComplete(data));
            this.gameManager.on('collision', (data) => this.onCollision(data));
            this.gameManager.on('offTrack', (data) => this.onOffTrack(data));
            this.gameManager.on('countdown', (data) => this.onCountdown(data));
        }
    }
    
    // 게임 업데이트마다 호출되는 오디오 업데이트
    updateAudio() {
        if (!this.isEnabled || !this.audioManager || !this.gameManager.players) return;
        
        // 각 플레이어의 엔진 사운드 업데이트
        Object.keys(this.gameManager.players).forEach(playerId => {
            this.updatePlayerAudio(playerId);
        });
    }
    
    updatePlayerAudio(playerId) {
        const player = this.gameManager.players[playerId];
        if (!player || !player.car) return;
        
        const car = player.car;
        const currentTime = Date.now();
        
        // 엔진 사운드 업데이트 (60fps에서 너무 자주 호출되지 않도록 제한)
        if (currentTime - this.lastEngineUpdate[playerId] > 50) { // 20Hz 업데이트
            this.updateEngineSound(playerId, car);
            this.lastEngineUpdate[playerId] = currentTime;
        }
        
        // 스키드 사운드 체크
        this.checkSkidSound(playerId, car);
    }
    
    updateEngineSound(playerId, car) {
        if (car.velocity === undefined) return;
        
        // 속도를 RPM으로 변환 (대략적인 계산)
        const speed = Math.abs(car.velocity || 0);
        const baseRPM = 800; // 아이들 RPM
        const maxRPM = 3000;
        const maxSpeed = 200; // 최대 속도 (km/h)
        
        // 속도에 따른 RPM 계산
        const speedRatio = Math.min(speed / maxSpeed, 1.0);
        const rpm = baseRPM + (maxRPM - baseRPM) * speedRatio;
        
        // 스로틀 입력에 따른 볼륨 조정
        const throttleInput = this.getPlayerThrottleInput(playerId);
        const volume = Math.max(0.3, Math.min(1.0, 0.5 + throttleInput * 0.5));
        
        // 엔진 사운드 업데이트
        this.audioManager.updateEngineRPM(playerId, rpm, volume);
    }
    
    checkSkidSound(playerId, car) {
        if (!car.isSkidding) {
            // 스키드 중이 아니면 스키드 사운드 중지
            this.audioManager.stopSound(playerId, 'skid');
            return;
        }
        
        // 스키드 강도에 따른 볼륨 계산
        const skidIntensity = Math.min(car.skidIntensity || 0.5, 1.0);
        
        // 스키드 사운드 재생 (이미 재생 중이면 볼륨만 조정)
        this.audioManager.playSkidSound(playerId, skidIntensity);
    }
    
    getPlayerThrottleInput(playerId) {
        // 센서 입력에서 스로틀 값 가져오기
        if (typeof this.gameManager.getLastSensorData === 'function') {
            const sensorData = this.gameManager.getLastSensorData(playerId);
            if (!sensorData || !sensorData.data || !sensorData.data.orientation) return 0;
            
            const beta = sensorData.data.orientation.beta || 0;
            const throttle = Math.max(-1, Math.min(1, -beta / 30)); // -30도에서 30도 범위
            
            return Math.max(0, throttle); // 양수 스로틀만 반환
        }
        
        return 0;
    }
    
    // 게임 이벤트 핸들러들
    onRaceStart() {
        if (!this.isEnabled || !this.audioManager) return;
        
        console.log('🏁 레이스 시작 - 엔진 사운드 시작');
        
        // 각 플레이어의 엔진 사운드 시작
        Object.keys(this.gameManager.players).forEach(playerId => {
            this.audioManager.playEngineSound(playerId, 1000, 0.8);
        });
    }
    
    onRaceEnd(data) {
        if (!this.isEnabled || !this.audioManager) return;
        
        console.log('🏆 레이스 종료 - 승리 사운드 재생');
        
        // 승리 사운드 재생
        if (data && data.winner) {
            this.audioManager.playVictorySound(data.winner);
        }
        
        // 모든 엔진 사운드 서서히 중지
        setTimeout(() => {
            Object.keys(this.gameManager.players).forEach(playerId => {
                this.audioManager.stopSound(playerId, 'engine');
                this.audioManager.stopSound(playerId, 'skid');
            });
        }, 2000); // 승리 사운드 재생 후 2초 뒤
    }
    
    onLapComplete(data) {
        if (!this.isEnabled || !this.audioManager) return;
        
        console.log(`🏁 ${data.playerId} 랩 완주`);
        
        // 랩 완주 시 짧은 효과음 (카운트다운 사운드 재사용)
        this.audioManager.playCountdownSound();
    }
    
    onCollision(data) {
        if (!this.isEnabled || !this.audioManager) return;
        
        console.log(`💥 ${data.playerId} 충돌 발생`);
        
        // 충돌 강도에 따른 사운드 재생
        const intensity = Math.min(data.intensity || 1.0, 1.0);
        this.audioManager.playCrashSound(data.playerId, intensity);
    }
    
    onOffTrack(data) {
        if (!this.isEnabled || !this.audioManager) return;
        
        console.log(`🌿 ${data.playerId} 트랙 이탈`);
        
        // 트랙 이탈 시 스키드 사운드 재생
        this.audioManager.playSkidSound(data.playerId, 0.6);
    }
    
    onCountdown(data) {
        if (!this.isEnabled || !this.audioManager) return;
        
        console.log(`⏰ 카운트다운: ${data.count}`);
        
        // 카운트다운 사운드 재생
        this.audioManager.playCountdownSound();
    }
    
    // 오디오 설정 메서드들
    setMasterVolume(volume) {
        if (this.audioManager) {
            this.audioManager.setMasterVolume(volume);
        }
    }
    
    setEngineVolume(volume) {
        if (this.audioManager) {
            this.audioManager.setEngineVolume(volume);
        }
    }
    
    setEffectVolume(volume) {
        if (this.audioManager) {
            this.audioManager.setEffectVolume(volume);
        }
    }
    
    // 오디오 시스템 활성화/비활성화
    enable() {
        this.isEnabled = true;
        console.log('🔊 오디오 시스템 활성화');
    }
    
    disable() {
        this.isEnabled = false;
        if (this.audioManager) {
            // 모든 사운드 중지
            Object.keys(this.gameManager.players).forEach(playerId => {
                this.audioManager.stopAllSounds(playerId);
            });
        }
        console.log('🔇 오디오 시스템 비활성화');
    }
    
    // 리소스 정리
    cleanup() {
        if (this.audioManager) {
            this.audioManager.cleanup();
        }
        console.log('🧹 AudioIntegration 정리 완료');
    }
    
    // 디버그 정보
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            audioManagerInitialized: !!this.audioManager,
            audioManagerDebug: this.audioManager ? this.audioManager.getDebugInfo() : null
        };
    }
}

// 전역 AudioIntegration 클래스 노출
window.AudioIntegration = AudioIntegration;

console.log('🎵 AudioIntegration 클래스 로드됨');