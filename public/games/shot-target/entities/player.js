// ===== ENTITIES/PLAYER =====
// 플레이어 엔티티 클래스

import { GAME_CONFIG } from '../shared/config.js';
import { GameUtils } from '../shared/utils.js';

export class Player {
    constructor(id, name = null, colorIndex = 0) {
        this.id = id;
        this.name = name || GameUtils.generatePlayerName(colorIndex);
        this.colorIndex = colorIndex;
        this.color = GAME_CONFIG.PLAYER_COLORS[colorIndex % GAME_CONFIG.PLAYER_COLORS.length];
        
        // 게임 통계
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lastHitTime = 0;
        
        // 센서 데이터
        this.tilt = { x: 0, y: 0 };
        this.lastSensorUpdate = 0;
        
        // 조준점 위치
        this.crosshair = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            smoothing: GAME_CONFIG.SENSOR.smoothing.solo
        };
        
        // 상태
        this.isActive = true;
        this.isConnected = true;
        this.lastActivity = Date.now();
        
        // 시각적 효과
        this.hitEffect = null;
        this.scorePopups = [];
    }

    // 센서 데이터 업데이트 (개선된 부드러운 움직임)
    updateSensorData(tiltX, tiltY) {
        const now = Date.now();
        
        // 스로틀링 제거 - 즉시 업데이트
        this.tilt.x = tiltX;
        this.tilt.y = tiltY;
        this.lastSensorUpdate = now;
        this.lastActivity = now;
        
        // 디버그 로그
        console.log(`🎯 [플레이어 ${this.id}] 센서 업데이트:`, {
            tiltX, tiltY,
            crosshair: { x: this.crosshair.x, y: this.crosshair.y }
        });
    }

    // 조준점 위치 업데이트 (부드러운 움직임)
    updateCrosshair(canvasWidth, canvasHeight, mode = 'full') {
        // 센서 데이터 정규화
        const normalized = GameUtils.normalizeSensorData(this.tilt.x, this.tilt.y);
        
        // 화면 좌표 계산
        const targetPos = GameUtils.calculateScreenPosition(
            normalized.x, 
            normalized.y, 
            canvasWidth, 
            canvasHeight, 
            mode
        );
        
        this.crosshair.targetX = targetPos.x;
        this.crosshair.targetY = targetPos.y;
        
        // 부드러운 움직임 적용 (lerp)
        this.crosshair.x = GameUtils.lerp(
            this.crosshair.x, 
            this.crosshair.targetX, 
            this.crosshair.smoothing
        );
        this.crosshair.y = GameUtils.lerp(
            this.crosshair.y, 
            this.crosshair.targetY, 
            this.crosshair.smoothing
        );
        
        // 디버그 로그 - 조준점 위치 업데이트 확인
        console.log(`🎯 [플레이어 ${this.id}] 조준점 업데이트:`, {
            tilt: { x: this.tilt.x, y: this.tilt.y },
            normalized: normalized,
            targetPos: targetPos,
            crosshair: { x: this.crosshair.x, y: this.crosshair.y },
            target: { x: this.crosshair.targetX, y: this.crosshair.targetY }
        });
    }

    // 점수 추가
    addScore(points, isCombo = false) {
        if (isCombo) {
            points = Math.floor(points * GAME_CONFIG.GAMEPLAY.comboMultiplier);
        }
        
        this.score += points;
        this.hits++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.lastHitTime = Date.now();
        
        // 점수 팝업 효과 추가
        this.addScorePopup(points, isCombo);
        
        return points;
    }

    // 빗나감 처리
    addMiss() {
        this.misses++;
        this.combo = 0; // 콤보 리셋
    }

    // 점수 팝업 추가
    addScorePopup(points, isCombo = false) {
        this.scorePopups.push({
            points,
            isCombo,
            x: this.crosshair.x,
            y: this.crosshair.y,
            createdAt: Date.now(),
            alpha: 1
        });
    }

    // 적중 효과 추가
    addHitEffect(x, y) {
        this.hitEffect = {
            x,
            y,
            createdAt: Date.now(),
            scale: 0.5
        };
    }

    // 업데이트 (효과 애니메이션)
    update(deltaTime) {
        // 점수 팝업 업데이트
        this.scorePopups = this.scorePopups.filter(popup => {
            const age = Date.now() - popup.createdAt;
            popup.alpha = Math.max(0, 1 - age / GAME_CONFIG.UI.popupDuration);
            popup.y -= deltaTime * 0.05; // 위로 이동
            return popup.alpha > 0;
        });

        // 적중 효과 업데이트
        if (this.hitEffect) {
            const age = Date.now() - this.hitEffect.createdAt;
            if (age > GAME_CONFIG.UI.effectDuration) {
                this.hitEffect = null;
            } else {
                this.hitEffect.scale = GameUtils.lerp(this.hitEffect.scale, 2, 0.1);
            }
        }
    }

    // 조준점 렌더링 (개선된 플레이어 번호 표시)
    renderCrosshair(ctx, showPlayerNumber = false) {
        if (!this.isActive || !this.isConnected) return;

        ctx.save();
        
        // 조준점 그림자
        ctx.beginPath();
        ctx.arc(this.crosshair.x + 2, this.crosshair.y + 2, 17, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        // 조준점 외곽 링
        ctx.beginPath();
        ctx.arc(this.crosshair.x, this.crosshair.y, 15, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 조준점 내부
        ctx.beginPath();
        ctx.arc(this.crosshair.x, this.crosshair.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = GameUtils.hexToRgba(this.color, 0.2);
        ctx.fill();
        
        // 십자선
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        // 수직선
        ctx.beginPath();
        ctx.moveTo(this.crosshair.x, this.crosshair.y - 8);
        ctx.lineTo(this.crosshair.x, this.crosshair.y + 8);
        ctx.stroke();
        
        // 수평선
        ctx.beginPath();
        ctx.moveTo(this.crosshair.x - 8, this.crosshair.y);
        ctx.lineTo(this.crosshair.x + 8, this.crosshair.y);
        ctx.stroke();
        
        // 플레이어 번호 표시 (요청사항)
        if (showPlayerNumber) {
            // 번호 배경
            ctx.beginPath();
            ctx.arc(this.crosshair.x, this.crosshair.y - 25, 10, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            
            // 번호 테두리
            ctx.beginPath();
            ctx.arc(this.crosshair.x, this.crosshair.y - 25, 10, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 번호 텍스트
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((this.colorIndex + 1).toString(), this.crosshair.x, this.crosshair.y - 25);
        }
        
        ctx.restore();
    }

    // 효과 렌더링
    renderEffects(ctx) {
        // 적중 효과
        if (this.hitEffect) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            
            ctx.beginPath();
            ctx.arc(this.hitEffect.x, this.hitEffect.y, this.hitEffect.scale * 20, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            ctx.restore();
        }

        // 점수 팝업
        this.scorePopups.forEach(popup => {
            ctx.save();
            ctx.globalAlpha = popup.alpha;
            
            ctx.fillStyle = popup.isCombo ? '#ffff00' : this.color;
            ctx.font = `bold ${popup.isCombo ? '24px' : '20px'} Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            
            const text = popup.isCombo ? `+${popup.points} COMBO!` : `+${popup.points}`;
            ctx.strokeText(text, popup.x, popup.y);
            ctx.fillText(text, popup.x, popup.y);
            
            ctx.restore();
        });
    }

    // 정확도 계산
    getAccuracy() {
        return GameUtils.calculateAccuracy(this.hits, this.misses);
    }

    // 스무딩 값 설정 (모드별)
    setSmoothingForMode(mode) {
        this.crosshair.smoothing = GAME_CONFIG.SENSOR.smoothing[mode] || GAME_CONFIG.SENSOR.smoothing.solo;
    }

    // 플레이어 상태 리셋
    reset() {
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lastHitTime = 0;
        this.hitEffect = null;
        this.scorePopups = [];
    }

    // 플레이어 정보 반환
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            colorIndex: this.colorIndex,
            score: this.score,
            hits: this.hits,
            misses: this.misses,
            combo: this.combo,
            maxCombo: this.maxCombo,
            accuracy: this.getAccuracy(),
            isActive: this.isActive,
            isConnected: this.isConnected,
            crosshair: {
                x: this.crosshair.x,
                y: this.crosshair.y
            }
        };
    }

    // 연결 해제 처리
    disconnect() {
        this.isConnected = false;
        this.isActive = false;
    }

    // 재연결 처리
    reconnect() {
        this.isConnected = true;
        this.isActive = true;
        this.lastActivity = Date.now();
    }
}