// Entities Layer - 플레이어 모델
import { PLAYER_COLORS } from '../../shared/config/game-config.js';
import { calculateAccuracy } from '../../shared/lib/utils.js';

export class Player {
    constructor(id, name, colorIndex = 0) {
        this.id = id;
        this.name = name;
        this.color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
        this.colorIndex = colorIndex;
        
        // 게임 통계
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lastHitTime = 0;
        this.lastActivity = Date.now();
        
        // 센서 데이터
        this.tilt = { x: 0, y: 0 };
        this.crosshairX = 0;
        this.crosshairY = 0;
        
        // 상태
        this.isActive = true;
        this.lastSensorUpdate = 0;
    }

    // 점수 추가
    addScore(points) {
        this.score += points;
    }

    // 적중 처리 (최대 3콤보 제한 적용)
    hit() {
        this.hits++;
        this.combo = Math.min(this.combo + 1, 3); // ✅ 최대 3콤보
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.lastHitTime = Date.now();
        this.lastActivity = Date.now();
    }

    // 빗나감 처리
    miss() {
        this.misses++;
        this.combo = 0;
        this.lastActivity = Date.now();
    }

    // 콤보 리셋
    resetCombo() {
        this.combo = 0;
    }

    // 정확도 계산
    get accuracy() {
        return parseFloat(calculateAccuracy(this.hits, this.misses));
    }

    // 센서 데이터 업데이트
    updateSensorData(tiltX, tiltY) {
        this.tilt.x = tiltX;
        this.tilt.y = tiltY;
        this.lastSensorUpdate = Date.now();
        this.lastActivity = Date.now();
    }

    // 조준점 위치 업데이트
    updateCrosshair(x, y) {
        this.crosshairX = x;
        this.crosshairY = y;
    }

    // 플레이어 비활성화
    deactivate() {
        this.isActive = false;
    }

    // 플레이어 활성화
    activate() {
        this.isActive = true;
        this.lastActivity = Date.now();
    }

    // ✅ 콤보 타이머 체크 (4.5초 후 콤보 리셋)
    checkComboTimeout() {
        const now = Date.now();
        const COMBO_TIMEOUT = 4500; // 4.5초
        
        if (this.combo > 0 && now - this.lastHitTime > COMBO_TIMEOUT) {
            console.log(`🎯 [${this.name}] 콤보 타임아웃: ${this.combo} → 0`);
            this.combo = 0;
            return true; // 콤보가 리셋됨
        }
        
        return false; // 콤보 유지됨
    }

    // JSON 직렬화용
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            score: this.score,
            hits: this.hits,
            misses: this.misses,
            combo: this.combo,
            maxCombo: this.maxCombo,
            accuracy: this.accuracy,
            isActive: this.isActive
        };
    }
}

export class PlayerManager {
    constructor() {
        this.players = new Map();
        this.colorIndex = 0;
    }

    // 플레이어 추가
    addPlayer(playerId, name = null) {
        if (this.players.has(playerId)) {
            return this.players.get(playerId);
        }

        const playerName = name || `플레이어 ${this.players.size + 1}`;
        const player = new Player(playerId, playerName, this.colorIndex);
        
        this.players.set(playerId, player);
        this.colorIndex++;
        
        return player;
    }

    // 플레이어 제거
    removePlayer(playerId) {
        return this.players.delete(playerId);
    }

    // 플레이어 가져오기
    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    // 모든 플레이어 가져오기
    getAllPlayers() {
        return Array.from(this.players.values());
    }

    // 활성 플레이어만 가져오기
    getActivePlayers() {
        return this.getAllPlayers().filter(player => player.isActive);
    }

    // 점수순 정렬된 플레이어 목록
    getPlayersByScore() {
        return this.getActivePlayers().sort((a, b) => b.score - a.score);
    }

    // 플레이어 수
    get count() {
        return this.players.size;
    }

    // 활성 플레이어 수
    get activeCount() {
        return this.getActivePlayers().length;
    }

    // 모든 플레이어 초기화
    clear() {
        this.players.clear();
        this.colorIndex = 0;
    }
}