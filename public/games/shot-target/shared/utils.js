// ===== SHARED/UTILS =====
// 공통 유틸리티 함수들

export class GameUtils {
    // 거리 계산
    static getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // 각도 계산 (라디안)
    static getAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    // 랜덤 범위 값
    static randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    // 랜덤 정수
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 값 제한 (clamp)
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    // 선형 보간 (lerp) - 부드러운 움직임을 위해
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // 정확도 계산
    static calculateAccuracy(hits, misses) {
        const total = hits + misses;
        return total > 0 ? ((hits / total) * 100).toFixed(1) : 100;
    }

    // 시간 포맷팅 (MM:SS)
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // 점수 포맷팅 (천 단위 콤마)
    static formatScore(score) {
        return score.toLocaleString();
    }

    // 색상 유틸리티
    static hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // 센서 데이터 정규화 (개선된 부드러운 움직임)
    static normalizeSensorData(tiltX, tiltY, maxTilt = 25) {
        const normalizedX = this.clamp(tiltY / maxTilt, -1, 1);
        const normalizedY = this.clamp(tiltX / maxTilt, -1, 1);
        return { x: normalizedX, y: normalizedY };
    }

    // 화면 좌표 계산
    static calculateScreenPosition(normalizedX, normalizedY, canvasWidth, canvasHeight, mode = 'full') {
        let targetX, targetY;

        switch (mode) {
            case 'left-half':
                // 협동 모드 좌측 플레이어
                targetX = canvasWidth / 4 + (normalizedX * canvasWidth / 4);
                targetY = canvasHeight / 2 + (normalizedY * canvasHeight / 2);
                targetX = this.clamp(targetX, 0, canvasWidth / 2);
                break;
            
            case 'right-half':
                // 협동 모드 우측 플레이어
                targetX = canvasWidth * 3 / 4 + (normalizedX * canvasWidth / 4);
                targetY = canvasHeight / 2 + (normalizedY * canvasHeight / 2);
                targetX = this.clamp(targetX, canvasWidth / 2, canvasWidth);
                break;
            
            default:
                // 전체 화면 (솔로, 경쟁, 대규모 경쟁)
                targetX = canvasWidth / 2 + (normalizedX * canvasWidth / 2);
                targetY = canvasHeight / 2 + (normalizedY * canvasHeight / 2);
                targetX = this.clamp(targetX, 0, canvasWidth);
                break;
        }

        targetY = this.clamp(targetY, 0, canvasHeight);
        return { x: targetX, y: targetY };
    }

    // 디바운스 함수
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 스로틀 함수 (센서 데이터 처리용)
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // DOM 요소 생성 헬퍼
    static createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    // QR 코드 생성 (폴백 처리 포함)
    static async generateQRCode(container, url) {
        try {
            if (typeof QRCode !== 'undefined') {
                // QRCode 라이브러리 사용
                const canvas = document.createElement('canvas');
                await new Promise((resolve, reject) => {
                    QRCode.toCanvas(canvas, url, { width: 200 }, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
                container.innerHTML = '';
                container.appendChild(canvas);
            } else {
                // 폴백: 외부 API 사용
                const img = document.createElement('img');
                img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
                img.alt = 'QR Code';
                img.style.width = '200px';
                img.style.height = '200px';
                container.innerHTML = '';
                container.appendChild(img);
            }
        } catch (error) {
            console.error('QR 코드 생성 실패:', error);
            container.innerHTML = `<p>QR 코드: ${url}</p>`;
        }
    }

    // 플레이어 이름 생성
    static generatePlayerName(index) {
        const names = [
            '플레이어', '사수', '저격수', '명사수', '헌터', '아처', '마크스맨', '스나이퍼'
        ];
        return `${names[index % names.length]} ${index + 1}`;
    }

    // 성능 측정 유틸리티
    static createPerformanceMonitor() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        return {
            tick: () => {
                frameCount++;
                const currentTime = performance.now();
                
                if (currentTime - lastTime >= 1000) {
                    const fps = frameCount;
                    frameCount = 0;
                    lastTime = currentTime;
                    return fps;
                }
                return null;
            }
        };
    }
}