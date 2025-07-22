export class CooperationSystem {
    constructor() {
        this.cooperation = {
            sync: 100,               // 협력 동기화 수치
            recentHits: [],          // 최근 히트 기록
            cooperationBonus: 1.0    // 협력 보너스 배수
        };
    }

    updateCooperation(success, timeDiff = 0) {
        const now = Date.now();
        
        if (success) {
            // 성공 시 동기화 증가
            if (timeDiff && timeDiff < 300) { // 300ms 이내 동기화 시 보너스
                this.cooperation.sync = Math.min(100, this.cooperation.sync + 8);
                this.cooperation.cooperationBonus = Math.min(2.0, this.cooperation.cooperationBonus + 0.1);
            } else {
                this.cooperation.sync = Math.min(100, this.cooperation.sync + 5);
            }
            
            this.cooperation.recentHits.push({ time: now, success: true });
        } else {
            // 실패 시 동기화 감소
            this.cooperation.sync = Math.max(0, this.cooperation.sync - 10);
            this.cooperation.cooperationBonus = Math.max(0.5, this.cooperation.cooperationBonus - 0.05);
            
            this.cooperation.recentHits.push({ time: now, success: false });
        }
        
        // 최근 5초간의 기록만 유지
        this.cooperation.recentHits = this.cooperation.recentHits.filter(hit => 
            now - hit.time < 5000
        );
        
        this.updateCooperationDisplay();
    }

    updateCooperationDisplay() {
        const fillElement = document.getElementById('cooperationFill');
        if (fillElement) {
            fillElement.style.width = `${this.cooperation.sync}%`;
            
            // 색상 변화로 협력 상태 표시
            if (this.cooperation.sync >= 80) {
                fillElement.style.background = 'linear-gradient(45deg, #10b981, #34d399)';
            } else if (this.cooperation.sync >= 50) {
                fillElement.style.background = 'linear-gradient(45deg, #f59e0b, #fbbf24)';
            } else {
                fillElement.style.background = 'linear-gradient(45deg, #ef4444, #f87171)';
            }
        }
    }

    getCooperationBonus() {
        return this.cooperation.cooperationBonus;
    }

    getCooperationSync() {
        return this.cooperation.sync;
    }

    calculateSyncBonus(timeDiff) {
        const maxSyncTime = 500; // 500ms
        if (timeDiff > maxSyncTime) return 0;
        
        return Math.max(0, (maxSyncTime - timeDiff) / maxSyncTime);
    }

    isGoodSync(timeDiff) {
        return timeDiff < 300; // 300ms 이내면 좋은 동기화
    }

    reset() {
        this.cooperation = {
            sync: 100,
            recentHits: [],
            cooperationBonus: 1.0
        };
        this.updateCooperationDisplay();
    }

    getRecentPerformance() {
        if (this.cooperation.recentHits.length === 0) return 1.0;
        
        const successCount = this.cooperation.recentHits.filter(hit => hit.success).length;
        return successCount / this.cooperation.recentHits.length;
    }
}