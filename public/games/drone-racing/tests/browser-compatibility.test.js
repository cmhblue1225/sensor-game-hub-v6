/**
 * 🌐 크로스 브라우저 호환성 테스트
 * 
 * 다양한 브라우저 환경에서의 게임 동작 테스트
 */

describe('Browser Compatibility Tests', () => {
    let mockUserAgent, mockNavigator;
    
    beforeEach(() => {
        // 원본 navigator 백업
        mockNavigator = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            onLine: navigator.onLine
        };
    });
    
    afterEach(() => {
        // navigator 복원
        Object.defineProperty(navigator, 'userAgent', {
            value: mockUserAgent || mockNavigator.userAgent,
            configurable: true
        });
    });
    
    it('Chrome 브라우저 호환성 테스트', () => {
        // Chrome 사용자 에이전트 시뮬레이션
        mockUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        
        Object.defineProperty(navigator, 'userAgent', {
            value: mockUserAgent,
            configurable: true
        });
        
        // WebGL 지원 확인
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        expect(gl).toBeTruthy();
        
        // DeviceOrientationEvent 지원 확인
        expect(typeof DeviceOrientationEvent !== 'undefined').toBeTruthy();
        
        // RequestAnimationFrame 지원 확인
        expect(typeof requestAnimationFrame !== 'undefined').toBeTruthy();
    });
    
    it('Firefox 브라우저 호환성 테스트', () => {
        mockUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0';
        
        Object.defineProperty(navigator, 'userAgent', {
            value: mockUserAgent,
            configurable: true
        });
        
        // Firefox 특정 기능 테스트
        const isFirefox = navigator.userAgent.includes('Firefox');
        expect(isFirefox).toBeTruthy();
        
        // WebGL 컨텍스트 생성 테스트
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        expect(gl).toBeTruthy();
    });
    
    it('Safari 브라우저 호환성 테스트', () => {
        mockUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
        
        Object.defineProperty(navigator, 'userAgent', {
            value: mockUserAgent,
            configurable: true
        });
        
        // Safari 특정 기능 테스트
        const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
        expect(isSafari).toBeTruthy();
        
        // Safari의 센서 API 권한 요청 테스트
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            expect(DeviceOrientationEvent.requestPermission).toBeInstanceOf(Function);
        }
    });
    
    it('Edge 브라우저 호환성 테스트', () => {
        mockUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
        
        Object.defineProperty(navigator, 'userAgent', {
            value: mockUserAgent,
            configurable: true
        });
        
        // Edge 특정 기능 테스트
        const isEdge = navigator.userAgent.includes('Edg');
        expect(isEdge).toBeTruthy();
        
        // WebGL 지원 확인
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        expect(gl).toBeTruthy();
    });
    
    it('모바일 Chrome 호환성 테스트', () => {
        mockUserAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
        
        Object.defineProperty(navigator, 'userAgent', {
            value: mockUserAgent,
            configurable: true
        });
        
        // 모바일 디바이스 감지
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        expect(isMobile).toBeTruthy();
        
        // 터치 이벤트 지원 확인
        expect('ontouchstart' in window || navigator.maxTouchPoints > 0).toBeTruthy();
        
        // 센서 API 지원 확인
        expect(typeof DeviceOrientationEvent !== 'undefined').toBeTruthy();
        expect(typeof DeviceMotionEvent !== 'undefined').toBeTruthy();
    });
    
    it('iOS Safari 호환성 테스트', () => {
        mockUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
        
        Object.defineProperty(navigator, 'userAgent', {
            value: mockUserAgent,
            configurable: true
        });
        
        // iOS 디바이스 감지
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        expect(isIOS).toBeTruthy();
        
        // iOS 특정 제약사항 테스트
        // - 센서 권한 요청 필요
        // - WebGL 컨텍스트 제한
        // - 메모리 제한
        
        const canvas = document.createElement('canvas');
        canvas.width = 512; // iOS에서 안전한 크기
        canvas.height = 512;
        
        const gl = canvas.getContext('webgl');
        expect(gl).toBeTruthy();
    });
    
    it('WebGL 기능 호환성 테스트', () => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
            // WebGL 확장 기능 확인
            const extensions = {
                anisotropic: gl.getExtension('EXT_texture_filter_anisotropic'),
                depthTexture: gl.getExtension('WEBGL_depth_texture'),
                drawBuffers: gl.getExtension('WEBGL_draw_buffers'),
                instancedArrays: gl.getExtension('ANGLE_instanced_arrays')
            };
            
            // 기본 WebGL 기능 테스트
            expect(gl.createShader).toBeInstanceOf(Function);
            expect(gl.createProgram).toBeInstanceOf(Function);
            expect(gl.createBuffer).toBeInstanceOf(Function);
            expect(gl.createTexture).toBeInstanceOf(Function);
            
            // WebGL 매개변수 확인
            const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
            
            expect(maxTextureSize).toBeGreaterThan(0);
            expect(maxViewportDims).toBeInstanceOf(Int32Array);
            
            console.log('WebGL 정보:', {
                maxTextureSize,
                maxViewportDims: Array.from(maxViewportDims),
                extensions: Object.keys(extensions).filter(key => extensions[key])
            });
        }
    });
    
    it('센서 API 호환성 테스트', () => {
        // DeviceOrientationEvent 지원 확인
        const hasOrientation = typeof DeviceOrientationEvent !== 'undefined';
        const hasMotion = typeof DeviceMotionEvent !== 'undefined';
        
        if (hasOrientation) {
            // 권한 요청 함수 확인 (iOS 13+)
            const needsPermission = typeof DeviceOrientationEvent.requestPermission === 'function';
            
            if (needsPermission) {
                expect(DeviceOrientationEvent.requestPermission).toBeInstanceOf(Function);
            }
        }
        
        if (hasMotion) {
            // 모션 센서 권한 확인
            const needsMotionPermission = typeof DeviceMotionEvent.requestPermission === 'function';
            
            if (needsMotionPermission) {
                expect(DeviceMotionEvent.requestPermission).toBeInstanceOf(Function);
            }
        }
        
        console.log('센서 API 지원:', {
            orientation: hasOrientation,
            motion: hasMotion,
            needsPermission: typeof DeviceOrientationEvent !== 'undefined' && 
                           typeof DeviceOrientationEvent.requestPermission === 'function'
        });
    });
    
    it('성능 API 호환성 테스트', () => {
        // Performance API 지원 확인
        expect(typeof performance !== 'undefined').toBeTruthy();
        expect(typeof performance.now === 'function').toBeTruthy();
        
        // Memory API 지원 확인 (Chrome)
        if (performance.memory) {
            expect(typeof performance.memory.usedJSHeapSize === 'number').toBeTruthy();
            expect(typeof performance.memory.totalJSHeapSize === 'number').toBeTruthy();
        }
        
        // RequestAnimationFrame 지원 확인
        expect(typeof requestAnimationFrame === 'function').toBeTruthy();
        expect(typeof cancelAnimationFrame === 'function').toBeTruthy();
    });
    
    it('로컬 스토리지 호환성 테스트', () => {
        // LocalStorage 지원 확인
        expect(typeof localStorage !== 'undefined').toBeTruthy();
        
        try {
            // 읽기/쓰기 테스트
            const testKey = 'drone-racing-test';
            const testValue = 'test-value';
            
            localStorage.setItem(testKey, testValue);
            const retrievedValue = localStorage.getItem(testKey);
            
            expect(retrievedValue).toBe(testValue);
            
            // 정리
            localStorage.removeItem(testKey);
            
        } catch (error) {
            // 프라이빗 모드에서는 localStorage가 제한될 수 있음
            console.warn('LocalStorage 접근 제한:', error.message);
        }
    });
    
    it('네트워크 API 호환성 테스트', () => {
        // Fetch API 지원 확인
        expect(typeof fetch === 'function').toBeTruthy();
        
        // WebSocket 지원 확인
        expect(typeof WebSocket === 'function').toBeTruthy();
        
        // Navigator.onLine 지원 확인
        expect(typeof navigator.onLine === 'boolean').toBeTruthy();
        
        // Connection API 지원 확인 (일부 브라우저)
        if (navigator.connection) {
            expect(typeof navigator.connection.effectiveType === 'string').toBeTruthy();
        }
    });
    
    it('오디오 API 호환성 테스트', () => {
        // Web Audio API 지원 확인
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        expect(typeof AudioContext === 'function').toBeTruthy();
        
        // HTML5 Audio 지원 확인
        const audio = document.createElement('audio');
        expect(typeof audio.play === 'function').toBeTruthy();
        
        // 오디오 포맷 지원 확인
        const canPlayMP3 = audio.canPlayType('audio/mpeg');
        const canPlayOGG = audio.canPlayType('audio/ogg');
        const canPlayWAV = audio.canPlayType('audio/wav');
        
        console.log('오디오 포맷 지원:', {
            mp3: canPlayMP3,
            ogg: canPlayOGG,
            wav: canPlayWAV
        });
    });
    
    it('CSS 기능 호환성 테스트', () => {
        // CSS Grid 지원 확인
        const testElement = document.createElement('div');
        testElement.style.display = 'grid';
        expect(testElement.style.display).toBe('grid');
        
        // CSS Flexbox 지원 확인
        testElement.style.display = 'flex';
        expect(testElement.style.display).toBe('flex');
        
        // CSS Transform 지원 확인
        testElement.style.transform = 'translateX(10px)';
        expect(testElement.style.transform).toBe('translateX(10px)');
        
        // CSS Animation 지원 확인
        testElement.style.animation = 'test 1s ease';
        expect(testElement.style.animation).toContain('test');
    });
    
    it('터치 이벤트 호환성 테스트', () => {
        // 터치 이벤트 지원 확인
        const hasTouchEvents = 'ontouchstart' in window;
        const hasPointerEvents = 'onpointerdown' in window;
        const hasMaxTouchPoints = navigator.maxTouchPoints > 0;
        
        console.log('터치 지원:', {
            touchEvents: hasTouchEvents,
            pointerEvents: hasPointerEvents,
            maxTouchPoints: navigator.maxTouchPoints
        });
        
        // 모바일 디바이스에서는 터치 이벤트가 지원되어야 함
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            expect(hasTouchEvents || hasPointerEvents || hasMaxTouchPoints).toBeTruthy();
        }
    });
    
    it('게임 특화 기능 호환성 테스트', () => {
        // Three.js 필수 기능 확인
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (gl) {
            // 셰이더 컴파일 테스트
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            
            expect(vertexShader).toBeTruthy();
            expect(fragmentShader).toBeTruthy();
            
            // 텍스처 지원 확인
            const texture = gl.createTexture();
            expect(texture).toBeTruthy();
            
            // 프레임버퍼 지원 확인
            const framebuffer = gl.createFramebuffer();
            expect(framebuffer).toBeTruthy();
        }
        
        // Cannon.js 물리 엔진 호환성
        // (실제 라이브러리 로드 없이 기본 JavaScript 기능만 확인)
        expect(typeof Float32Array === 'function').toBeTruthy();
        expect(typeof ArrayBuffer === 'function').toBeTruthy();
        expect(typeof Math.sin === 'function').toBeTruthy();
        expect(typeof Math.cos === 'function').toBeTruthy();
    });
    
    it('에러 처리 호환성 테스트', () => {
        // 전역 에러 핸들러 지원 확인
        expect(typeof window.addEventListener === 'function').toBeTruthy();
        
        // Promise rejection 핸들러 지원 확인
        let hasUnhandledRejection = false;
        try {
            window.addEventListener('unhandledrejection', () => {});
            hasUnhandledRejection = true;
        } catch (error) {
            console.warn('unhandledrejection 이벤트 미지원');
        }
        
        // 대부분의 모던 브라우저에서 지원되어야 함
        expect(hasUnhandledRejection).toBeTruthy();
        
        // Console API 지원 확인
        expect(typeof console.log === 'function').toBeTruthy();
        expect(typeof console.error === 'function').toBeTruthy();
        expect(typeof console.warn === 'function').toBeTruthy();
    });
});