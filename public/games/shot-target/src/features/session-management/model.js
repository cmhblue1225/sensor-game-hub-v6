// Features Layer - 세션 관리
export class SessionManager {
    constructor() {
        this.sdk = null;
        this.sessionCode = null;
        this.isConnected = false;
        this.eventHandlers = new Map();
    }

    // SDK 초기화
    async initializeSDK(gameType, gameId = 'shot-target') {
        try {
            this.sdk = new SessionSDK({
                gameId: gameId,
                gameType: gameType,
                debug: true
            });

            this._setupSDKEvents();
            return true;
        } catch (error) {
            console.error('SDK 초기화 실패:', error);
            return false;
        }
    }

    // SDK 이벤트 설정
    _setupSDKEvents() {
        if (!this.sdk) return;

        // 연결 이벤트
        this.sdk.on('connected', () => {
            this.isConnected = true;
            this._emit('connected');
        });

        this.sdk.on('disconnected', () => {
            this.isConnected = false;
            this._emit('disconnected');
        });

        // 세션 이벤트
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            this.sessionCode = session.sessionCode;
            this._emit('session-created', session);
        });

        // 센서 이벤트
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            this._emit('sensor-connected', data);
        });

        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;
            this._emit('sensor-disconnected', data);
        });

        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this._emit('sensor-data', data);
        });

        // 오류 이벤트
        this.sdk.on('connection-error', (error) => {
            this._emit('connection-error', error);
        });
    }

    // 세션 생성
    async createSession() {
        if (!this.sdk) {
            throw new Error('SDK가 초기화되지 않았습니다');
        }

        try {
            await this.sdk.createSession();
            return true;
        } catch (error) {
            console.error('세션 생성 실패:', error);
            throw error;
        }
    }

    // QR 코드 생성
    async generateQRCode(container, sessionCode) {
        const sensorUrl = `${window.location.origin}/sensor.html?session=${sessionCode}`;
        
        try {
            if (typeof QRCode !== 'undefined') {
                // QRCode 라이브러리 사용
                const canvas = document.createElement('canvas');
                await new Promise((resolve, reject) => {
                    QRCode.toCanvas(canvas, sensorUrl, { width: 200 }, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
                container.innerHTML = '';
                container.appendChild(canvas);
            } else {
                // 폴백: 외부 API 사용
                const img = document.createElement('img');
                img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sensorUrl)}`;
                img.alt = 'QR Code';
                img.style.width = '200px';
                img.style.height = '200px';
                container.innerHTML = '';
                container.appendChild(img);
            }
            return true;
        } catch (error) {
            console.error('QR 코드 생성 실패:', error);
            container.innerHTML = `<p>QR 코드: ${sensorUrl}</p>`;
            return false;
        }
    }

    // 이벤트 리스너 등록
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    // 이벤트 리스너 제거
    off(event, handler) {
        if (!this.eventHandlers.has(event)) return;
        
        const handlers = this.eventHandlers.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    // 이벤트 발생
    _emit(event, data = null) {
        if (!this.eventHandlers.has(event)) return;
        
        const handlers = this.eventHandlers.get(event);
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`이벤트 핸들러 오류 (${event}):`, error);
            }
        });
    }

    // 연결 상태 확인
    isSDKConnected() {
        return this.isConnected;
    }

    // 세션 코드 가져오기
    getSessionCode() {
        return this.sessionCode;
    }

    // 정리
    cleanup() {
        if (this.sdk) {
            // SDK 정리 로직이 있다면 여기에 추가
            this.sdk = null;
        }
        
        this.sessionCode = null;
        this.isConnected = false;
        this.eventHandlers.clear();
    }
}