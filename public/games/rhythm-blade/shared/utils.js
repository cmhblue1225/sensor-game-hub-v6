// 유틸리티 함수들
export class Utils {
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    static easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    static randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }

    static distance2D(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static createQRCode(container, url) {
        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(container, url, (error) => {
                if (error) {
                    this.createFallbackQR(container, url);
                }
            });
        } else {
            this.createFallbackQR(container, url);
        }
    }

    static createFallbackQR(container, url) {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
        const img = document.createElement('img');
        img.src = qrApiUrl;
        img.alt = 'QR Code';
        img.style.maxWidth = '100%';
        container.appendChild(img);
    }
}