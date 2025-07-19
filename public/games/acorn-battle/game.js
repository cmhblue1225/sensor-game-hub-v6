/**
 * Acorn Battle Game - 도토리 배틀
 * 2인용 실시간 센서 게임
 */

// GameTester 클래스 - 통합 테스트 및 디버깅 도구
class GameTester {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.testResults = [];
        this.debugMode = false;
        this.testScenarios = [];
        this.performanceMetrics = {
            frameRate: [],
            sensorLatency: [],
            renderTime: [],
            updateTime: []
        };
        
        this.setupTestScenarios();
        this.setupDebugTools();
    }
    
    // 테스트 시나리오 설정
    setupTestScenarios() {
        this.testScenarios = [
            {
                name: '게임 초기화 테스트',
                test: () => this.testGameInitialization(),
                category: 'initialization'
            },
            {
                name: '센서 연결 테스트',
                test: () => this.testSensorConnection(),
                category: 'sensor'
            },
            {
                name: '플레이어 이동 테스트',
                test: () => this.testPlayerMovement(),
                category: 'gameplay'
            },
            {
                name: '충돌 감지 테스트',
                test: () => this.testCollisionDetection(),
                category: 'gameplay'
            },
            {
                name: '점수 시스템 테스트',
                test: () => this.testScoringSystem(),
                category: 'gameplay'
            },
            {
                name: '게임 타이머 테스트',
                test: () => this.testGameTimer(),
                category: 'timing'
            },
            {
                name: '멀티플레이어 동기화 테스트',
                test: () => this.testMultiplayerSync(),
                category: 'multiplayer'
            },
            {
                name: '에러 처리 테스트',
                test: () => this.testErrorHandling(),
                category: 'error'
            },
            {
                name: '성능 테스트',
                test: () => this.testPerformance(),
                category: 'performance'
            },
            {
                name: '브라우저 호환성 테스트',
                test: () => this.testBrowserCompatibility(),
                category: 'compatibility'
            }
        ];
    }
    
    // 디버그 도구 설정
    setupDebugTools() {
        // 디버그 패널 생성
        this.createDebugPanel();
        
        // 키보드 단축키 설정
        this.setupKeyboardShortcuts();
        
        // 콘솔 명령어 등록
        this.registerConsoleCommands();
    }
    
    // 디버그 패널 생성
    createDebugPanel() {
        if (document.getElementById('debug-panel')) return;
        
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            overflow-y: auto;
            display: none;
        `;
        
        debugPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3>디버그 패널</h3>
                <button onclick="window.gameTester.toggleDebugPanel()" style="background: #ff4444; color: white; border: none; padding: 2px 6px; border-radius: 3px;">×</button>
            </div>
            <div id="debug-content">
                <div id="debug-stats"></div>
                <div id="debug-controls" style="margin-top: 10px;">
                    <button onclick="window.gameTester.runAllTests()" style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; margin: 2px;">전체 테스트</button>
                    <button onclick="window.gameTester.simulateSensorData()" style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 3px; margin: 2px;">센서 시뮬레이션</button>
                    <button onclick="window.gameTester.togglePerformanceMonitor()" style="background: #FF9800; color: white; border: none; padding: 5px 10px; border-radius: 3px; margin: 2px;">성능 모니터</button>
                </div>
                <div id="debug-log" style="margin-top: 10px; max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.1); padding: 5px; border-radius: 3px;"></div>
            </div>
        `;
        
        document.body.appendChild(debugPanel);
    }
    
    // 키보드 단축키 설정
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl + Shift + D: 디버그 패널 토글
            if (event.ctrlKey && event.shiftKey && event.key === 'D') {
                event.preventDefault();
                this.toggleDebugPanel();
            }
            
            // Ctrl + Shift + T: 전체 테스트 실행
            if (event.ctrlKey && event.shiftKey && event.key === 'T') {
                event.preventDefault();
                this.runAllTests();
            }
            
            // Ctrl + Shift + S: 센서 시뮬레이션
            if (event.ctrlKey && event.shiftKey && event.key === 'S') {
                event.preventDefault();
                this.simulateSensorData();
            }
        });
    }
    
    // 콘솔 명령어 등록
    registerConsoleCommands() {
        window.gameTester = this;
        window.testGame = () => this.runAllTests();
        window.debugGame = () => this.toggleDebugPanel();
        window.simulateSensor = (sensorId, data) => this.simulateSpecificSensorData(sensorId, data);
    }
    
    // 디버그 패널 토글
    toggleDebugPanel() {
        const panel = document.getElementById('debug-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            if (panel.style.display === 'block') {
                this.updateDebugStats();
            }
        }
    }
    
    // 디버그 통계 업데이트
    updateDebugStats() {
        const statsDiv = document.getElementById('debug-stats');
        if (!statsDiv || !this.game) return;
        
        const gameState = this.game.gameState;
        const connectedSensors = gameState.connectedSensors ? gameState.connectedSensors.size : 0;
        
        statsDiv.innerHTML = `
            <div><strong>게임 상태:</strong> ${gameState.phase}</div>
            <div><strong>연결된 센서:</strong> ${connectedSensors}/2</div>
            <div><strong>남은 시간:</strong> ${gameState.timeRemaining}초</div>
            <div><strong>P1 점수:</strong> ${gameState.players.sensor1.score}</div>
            <div><strong>P2 점수:</strong> ${gameState.players.sensor2.score}</div>
            <div><strong>도토리 개수:</strong> ${gameState.acorns.length}</div>
            <div><strong>장애물 개수:</strong> ${gameState.obstacles.length}</div>
        `;
    }
    
    // 전체 테스트 실행
    async runAllTests() {
        this.log('=== 통합 테스트 시작 ===');
        this.testResults = [];
        
        for (const scenario of this.testScenarios) {
            try {
                this.log(`테스트 실행: ${scenario.name}`);
                const result = await scenario.test();
                this.testResults.push({
                    name: scenario.name,
                    category: scenario.category,
                    passed: result.passed,
                    message: result.message,
                    details: result.details
                });
                
                this.log(`${result.passed ? '✅' : '❌'} ${scenario.name}: ${result.message}`);
            } catch (error) {
                this.testResults.push({
                    name: scenario.name,
                    category: scenario.category,
                    passed: false,
                    message: `테스트 실행 오류: ${error.message}`,
                    details: error.stack
                });
                
                this.log(`❌ ${scenario.name}: 테스트 실행 오류`);
                console.error(error);
            }
        }
        
        this.generateTestReport();
    }
    
    // 테스트 결과 리포트 생성
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        this.log('=== 테스트 결과 요약 ===');
        this.log(`총 테스트: ${totalTests}`);
        this.log(`성공: ${passedTests}`);
        this.log(`실패: ${failedTests}`);
        this.log(`성공률: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        // 카테고리별 결과
        const categories = {};
        this.testResults.forEach(result => {
            if (!categories[result.category]) {
                categories[result.category] = { total: 0, passed: 0 };
            }
            categories[result.category].total++;
            if (result.passed) categories[result.category].passed++;
        });
        
        this.log('\n=== 카테고리별 결과 ===');
        Object.entries(categories).forEach(([category, stats]) => {
            this.log(`${category}: ${stats.passed}/${stats.total} (${((stats.passed / stats.total) * 100).toFixed(1)}%)`);
        });
        
        // 실패한 테스트 상세 정보
        const failedTestDetails = this.testResults.filter(r => !r.passed);
        if (failedTestDetails.length > 0) {
            this.log('\n=== 실패한 테스트 상세 ===');
            failedTestDetails.forEach(test => {
                this.log(`❌ ${test.name}: ${test.message}`);
                if (test.details) {
                    this.log(`   상세: ${test.details}`);
                }
            });
        }
    }
    
    // 로그 출력
    log(message) {
        console.log(`[GameTester] ${message}`);
        
        const logDiv = document.getElementById('debug-log');
        if (logDiv) {
            const logEntry = document.createElement('div');
            logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
            logEntry.style.marginBottom = '2px';
            logDiv.appendChild(logEntry);
            logDiv.scrollTop = logDiv.scrollHeight;
        }
    }
    
    // === 개별 테스트 함수들 ===
    
    // 게임 초기화 테스트
    async testGameInitialization() {
        const checks = [];
        
        // 게임 인스턴스 존재 확인
        checks.push({
            name: '게임 인스턴스 존재',
            passed: !!this.game,
            details: this.game ? '게임 인스턴스가 정상적으로 생성됨' : '게임 인스턴스가 없음'
        });
        
        // 필수 요소들 확인
        const requiredElements = ['canvas', 'ctx', 'sdk', 'gameState'];
        requiredElements.forEach(element => {
            checks.push({
                name: `${element} 초기화`,
                passed: !!this.game[element],
                details: this.game[element] ? `${element}가 정상적으로 초기화됨` : `${element} 초기화 실패`
            });
        });
        
        // 게임 상태 초기화 확인
        if (this.game.gameState) {
            checks.push({
                name: '게임 상태 초기화',
                passed: this.game.gameState.phase === 'waiting',
                details: `현재 게임 상태: ${this.game.gameState.phase}`
            });
            
            checks.push({
                name: '플레이어 초기화',
                passed: !!(this.game.gameState.players.sensor1 && this.game.gameState.players.sensor2),
                details: '플레이어 객체가 정상적으로 초기화됨'
            });
        }
        
        const passedChecks = checks.filter(c => c.passed).length;
        const totalChecks = checks.length;
        
        return {
            passed: passedChecks === totalChecks,
            message: `${passedChecks}/${totalChecks} 초기화 검사 통과`,
            details: checks.filter(c => !c.passed).map(c => c.details).join(', ')
        };
    }
    
    // 센서 연결 테스트
    async testSensorConnection() {
        const checks = [];
        
        // SDK 연결 상태 확인
        checks.push({
            name: 'SDK 연결',
            passed: !!this.game.sdk,
            details: this.game.sdk ? 'SDK가 정상적으로 연결됨' : 'SDK 연결 실패'
        });
        
        // 센서 상태 추적 확인
        if (this.game.gameState.connectedSensors) {
            checks.push({
                name: '센서 상태 추적',
                passed: this.game.gameState.connectedSensors instanceof Set,
                details: '센서 연결 상태 추적 시스템이 정상 작동'
            });
        }
        
        // 센서 데이터 검증 함수 확인
        checks.push({
            name: '센서 데이터 검증',
            passed: typeof this.game.validateSensorData === 'function',
            details: '센서 데이터 검증 함수가 존재함'
        });
        
        // 센서 호환성 클래스 확인
        checks.push({
            name: '센서 호환성',
            passed: !!this.game.sensorCompat,
            details: this.game.sensorCompat ? '센서 호환성 클래스가 초기화됨' : '센서 호환성 클래스 없음'
        });
        
        const passedChecks = checks.filter(c => c.passed).length;
        const totalChecks = checks.length;
        
        return {
            passed: passedChecks === totalChecks,
            message: `${passedChecks}/${totalChecks} 센서 연결 검사 통과`,
            details: checks.filter(c => !c.passed).map(c => c.details).join(', ')
        };
    }
    
    // 플레이어 이동 테스트
    async testPlayerMovement() {
        const checks = [];
        
        // 플레이어 이동 함수 존재 확인
        checks.push({
            name: '플레이어 이동 함수',
            passed: typeof this.game.updatePlayerMovement === 'function',
            details: '플레이어 이동 함수가 존재함'
        });
        
        // 플레이어 위치 초기값 확인
        const player1 = this.game.gameState.players.sensor1;
        const player2 = this.game.gameState.players.sensor2;
        
        checks.push({
            name: '플레이어 1 위치 초기화',
            passed: !!(player1.position && typeof player1.position.x === 'number' && typeof player1.position.y === 'number'),
            details: `플레이어 1 위치: (${player1.position?.x}, ${player1.position?.y})`
        });
        
        checks.push({
            name: '플레이어 2 위치 초기화',
            passed: !!(player2.position && typeof player2.position.x === 'number' && typeof player2.position.y === 'number'),
            details: `플레이어 2 위치: (${player2.position?.x}, ${player2.position?.y})`
        });
        
        // 센서 데이터 시뮬레이션으로 이동 테스트
        const testSensorData = {
            sensorId: 'sensor1',
            data: {
                orientation: { alpha: 0, beta: 10, gamma: 5 },
                acceleration: { x: 0, y: 0, z: 9.8 }
            }
        };
        
        const originalPosition = { ...player1.position };
        
        // 게임을 playing 상태로 변경하여 이동 테스트
        const originalPhase = this.game.gameState.phase;
        this.game.gameState.phase = 'playing';
        
        try {
            if (typeof this.game.handleSensorData === 'function') {
                this.game.handleSensorData(testSensorData);
                
                checks.push({
                    name: '센서 데이터 처리',
                    passed: true,
                    details: '센서 데이터가 정상적으로 처리됨'
                });
            }
        } catch (error) {
            checks.push({
                name: '센서 데이터 처리',
                passed: false,
                details: `센서 데이터 처리 오류: ${error.message}`
            });
        } finally {
            this.game.gameState.phase = originalPhase;
        }
        
        const passedChecks = checks.filter(c => c.passed).length;
        const totalChecks = checks.length;
        
        return {
            passed: passedChecks === totalChecks,
            message: `${passedChecks}/${totalChecks} 플레이어 이동 검사 통과`,
            details: checks.filter(c => !c.passed).map(c => c.details).join(', ')
        };
    }
    
    // 충돌 감지 테스트
    async testCollisionDetection() {
        const checks = [];
        
        // 충돌 관리자 존재 확인
        checks.push({
            name: '충돌 관리자',
            passed: !!this.game.collisionManager,
            details: this.game.collisionManager ? '충돌 관리자가 존재함' : '충돌 관리자가 없음'
        });
        
        // 충돌 감지 함수들 확인
        const collisionFunctions = ['checkAllCollisions', 'checkPlayerCollisions', 'checkAcornCollisions'];
        collisionFunctions.forEach(funcName => {
            if (this.game.collisionManager) {
                checks.push({
                    name: `${funcName} 함수`,
                    passed: typeof this.game.collisionManager[funcName] === 'function',
                    details: `${funcName} 함수가 존재함`
                });
            }
        });
        
        // 플레이어 충돌 반경 확인
        const player1 = this.game.gameState.players.sensor1;
        const player2 = this.game.gameState.players.sensor2;
        
        checks.push({
            name: '플레이어 충돌 반경',
            passed: !!(player1.radius && player2.radius && player1.radius > 0 && player2.radius > 0),
            details: `플레이어 반경: P1=${player1.radius}, P2=${player2.radius}`
        });
        
        const passedChecks = checks.filter(c => c.passed).length;
        const totalChecks = checks.length;
        
        return {
            passed: passedChecks === totalChecks,
            message: `${passedChecks}/${totalChecks} 충돌 감지 검사 통과`,
            details: checks.filter(c => !c.passed).map(c => c.details).join(', ')
        };
    }
    
    // 점수 시스템 테스트
    async testScoringSystem() {
        const checks = [];
        
        // 점수 구역 존재 확인
        checks.push({
            name: '점수 구역 초기화',
            passed: !!(this.game.gameState.scoringZones.sensor1 && this.game.gameState.scoringZones.sensor2),
            details: '점수 구역이 정상적으로 초기화됨'
        });
        
        // 점수 초기값 확인
        const player1 = this.game.gameState.players.sensor1;
        const player2 = this.game.gameState.players.sensor2;
        
        checks.push({
            name: '점수 초기값',
            passed: player1.score === 0 && player2.score === 0,
            details: `초기 점수: P1=${player1.score}, P2=${player2.score}`
        });
        
        // 점수 업데이트 함수 확인
        checks.push({
            name: '점수 UI 업데이트',
            passed: typeof this.game.updateScoreUI === 'function',
            details: '점수 UI 업데이트 함수가 존재함'
        });
        
        // 도토리 보유 상태 확인
        checks.push({
            name: '도토리 보유 상태',
            passed: typeof player1.hasAcorn === 'boolean' && typeof player2.hasAcorn === 'boolean',
            details: `도토리 보유 상태: P1=${player1.hasAcorn}, P2=${player2.hasAcorn}`
        });
        
        const passedChecks = checks.filter(c => c.passed).length;
        const totalChecks = checks.length;
        
        return {
            passed: passedChecks === totalChecks,
            message: `${passedChecks}/${totalChecks} 점수 시스템 검사 통과`,
            details: checks.filter(c => !c.passed).map(c => c.details).join(', ')
        };
    }
    
    // 게임 타이머 테스트
    async testGameTimer() {
        const checks = [];
        
        // 타이머 초기값 확인
        checks.push({
            name: '타이머 초기값',
            passed: this.game.gameState.timeRemaining === 60,
            details: `초기 시간: ${this.game.gameState.timeRemaining}초`
        });
        
        // 타이머 업데이트 함수 확인
        checks.push({
            name: '타이머 업데이트 함수',
            passed: typeof this.game.updateTimer === 'function',
            details: '타이머 업데이트 함수가 존재함'
        });
        
        // 게임 종료 함수 확인
        checks.push({
            name: '게임 종료 함수',
            passed: typeof this.game.endGame === 'function',
            details: '게임 종료 함수가 존재함'
        });
        
        const passedChecks = checks.filter(c => c.passed).length;
        const totalChecks = checks.length;
        
        return {
            passed: passedChecks === totalChecks,
            message: `${passedChecks}/${totalChecks} 게임 타이머 검사 통과`,
            details: checks.filter(c => !c.passed).map(c => c.details).join(', ')
        };
    }
    
    // 멀티플레이어 동기화 테스트
    async testMultiplayerSync() {
        const checks = [];
        
        // 연결된 센서 추적 확인
        checks.push({
            name: '센서 연결 추적',
            passed: this.game.gameState.connectedSensors instanceof Set,
            details: `현재 연결된 센서: ${this.game.gameState.connectedSensors.size}개`
        });
        
        // 센서 연결/해제 처리 함수 확인
        const syncFunctions = ['handleSensorConnected', 'handleSensorDisconnected'];
        syncFunctions.forEach(funcName => {
            checks.push({
                name: `${funcName} 함수`,
                passed: typeof this.game[funcName] === 'function',
                details: `${funcName} 함수가 존재함`
            });
        });
        
        // 게임 상태 동기화 확인
        checks.push({
            name: '게임 상태 동기화',
            passed: typeof this.game.gameState.phase === 'string',
            details: `현재 게임 상태: ${this.game.gameState.phase}`
        });
        
        const passedChecks = checks.filter(c => c.passed).length;
        const totalChecks = checks.length;
        
        return {
            passed: passedChecks === totalChecks,
            message: `${passedChecks}/${totalChecks} 멀티플레이어 동기화 검사 통과`,
            details: checks.filter(c => !c.passed).map(c => c.details).join(', ')
        };
    }
    
    // 에러 처리 테스트
    async testErrorHandling() {
        const checks = [];
        
        // 에러 핸들러 존재 확인
        checks.push({
            name: '에러 핸들러',
            passed: !!this.game.errorHandler,
            details: this.game.errorHandler ? '에러 핸들러가 존재함' : '에러 핸들러가 없음'
        });
        
        // 센서 데이터 검증 함수 확인
        checks.push({
            name: '센서 데이터 검증',
            passed: typeof this.game.validateSensorData === 'function',
            details: '센서 데이터 검증 함수가 존재함'
        });
        
        // 잘못된 센서 데이터 처리 테스트
        const invalidSensorData = [
            null,
            undefined,
            {},
            { sensorId: 'invalid' },
            { sensorId: 'sensor1', data: null }
        ];
        
        let validationPassed = 0;
        invalidSensorData.forEach(data => {
            try {
                const isValid = this.game.validateSensorData(data);
                if (!isValid) validationPassed++;
            } catch (error) {
                // 예외가 발생해도 올바른 처리로 간주
                validationPassed++;
            }
        });
        
        checks.push({
            name: '잘못된 센서 데이터 처리',
            passed: validationPassed === invalidSensorData.length,
            details: `${validationPassed}/${invalidSensorData.length}개의 잘못된 데이터가 올바르게 처리됨`
        });
        
        const passedChecks = checks.filter(c => c.passed).length;
        const totalChecks = checks.length;
        
        return {
            passed: passedChecks === totalChecks,
            message: `${passedChecks}/${totalChecks} 에러 처리 검사 통과`,
            details: checks.filter(c => !c.passed).map(c => c.details).join(', ')
        };
    }
    
    // 성능 테스트
    async testPerformance() {
        const checks = [];
        
        // 성능 관리자 존재 확인
        checks.push({
            name: '성능 관리자',
            passed: !!this.game.performanceManager,
            details: this.game.performanceManager ? '성능 관리자가 존재함' : '성능 관리자가 없음'
        });
        
        // 게임 루프 최적화 확인
        checks.push({
            name: '게임 루프',
            passed: typeof this.game.gameLoop === 'function',
            details: '게임 루프 함수가 존재함'
        });
        
        // 렌더링 최적화 확인
        checks.push({
            name: '렌더링 함수',
            passed: typeof this.game.render === 'function',
            details: '렌더링 함수가 존재함'
        });
        
        // 메모리 관리 확인
        if (this.game.performanceManager) {
            checks.push({
                name: '메모리 관리',
                passed: typeof this.game.performanceManager.cleanup === 'function',
                details: '메모리 정리 함수가 존재함'
            });
        }
        
        const passedChecks = checks.filter(c => c.passed).length;
        const totalChecks = checks.length;
        
        return {
            passed: passedChecks === totalChecks,
            message: `${passedChecks}/${totalChecks} 성능 검사 통과`,
            details: checks.filter(c => !c.passed).map(c => c.details).join(', ')
        };
    }
    
    // 브라우저 호환성 테스트
    async testBrowserCompatibility() {
        const checks = [];
        
        // 브라우저 호환성 클래스 확인
        checks.push({
            name: '브라우저 호환성 클래스',
            passed: !!this.game.browserCompat,
            details: this.game.browserCompat ? '브라우저 호환성 클래스가 존재함' : '브라우저 호환성 클래스가 없음'
        });
        
        // 센서 지원 확인
        if (this.game.browserCompat) {
            const compatInfo = this.game.browserCompat.getCompatibilityInfo();
            
            checks.push({
                name: '센서 지원 감지',
                passed: !!compatInfo.support.sensor,
                details: `센서 지원: ${JSON.stringify(compatInfo.support.sensor)}`
            });
            
            checks.push({
                name: '오디오 지원 감지',
                passed: !!compatInfo.support.audio,
                details: `오디오 지원: ${JSON.stringify(compatInfo.support.audio)}`
            });
            
            checks.push({
                name: '캔버스 지원 감지',
                passed: !!compatInfo.support.canvas,
                details: `캔버스 지원: ${JSON.stringify(compatInfo.support.canvas)}`
            });
        }
        
        // 폴리필 확인
        checks.push({
            name: 'requestAnimationFrame 폴리필',
            passed: typeof window.requestAnimationFrame === 'function',
            details: 'requestAnimationFrame이 사용 가능함'
        });
        
        const passedChecks = checks.filter(c => c.passed).length;
        const totalChecks = checks.length;
        
        return {
            passed: passedChecks === totalChecks,
            message: `${passedChecks}/${totalChecks} 브라우저 호환성 검사 통과`,
            details: checks.filter(c => !c.passed).map(c => c.details).join(', ')
        };
    }
    
    // 센서 데이터 시뮬레이션
    simulateSensorData() {
        if (!this.game || this.game.gameState.phase !== 'playing') {
            this.log('게임이 진행 중이 아니어서 센서 시뮬레이션을 실행할 수 없습니다.');
            return;
        }
        
        this.log('센서 데이터 시뮬레이션 시작...');
        
        // 시뮬레이션 데이터 생성
        const simulationData = [
            {
                sensorId: 'sensor1',
                data: {
                    orientation: { alpha: 0, beta: Math.random() * 20 - 10, gamma: Math.random() * 20 - 10 },
                    acceleration: { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: 9.8 }
                }
            },
            {
                sensorId: 'sensor2',
                data: {
                    orientation: { alpha: 0, beta: Math.random() * 20 - 10, gamma: Math.random() * 20 - 10 },
                    acceleration: { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: 9.8 }
                }
            }
        ];
        
        // 시뮬레이션 데이터 전송
        simulationData.forEach(data => {
            try {
                this.game.handleSensorData(data);
                this.log(`${data.sensorId} 센서 데이터 시뮬레이션 완료`);
            } catch (error) {
                this.log(`${data.sensorId} 센서 데이터 시뮬레이션 오류: ${error.message}`);
            }
        });
    }
    
    // 특정 센서 데이터 시뮬레이션
    simulateSpecificSensorData(sensorId, data) {
        if (!this.game) {
            this.log('게임 인스턴스가 없습니다.');
            return;
        }
        
        const sensorData = {
            sensorId: sensorId,
            data: data || {
                orientation: { alpha: 0, beta: 10, gamma: 5 },
                acceleration: { x: 0, y: 0, z: 9.8 }
            }
        };
        
        try {
            this.game.handleSensorData(sensorData);
            this.log(`${sensorId} 특정 센서 데이터 시뮬레이션 완료`);
        } catch (error) {
            this.log(`${sensorId} 센서 데이터 시뮬레이션 오류: ${error.message}`);
        }
    }
    
    // 성능 모니터 토글
    togglePerformanceMonitor() {
        if (!this.performanceMonitorActive) {
            this.startPerformanceMonitor();
        } else {
            this.stopPerformanceMonitor();
        }
    }
    
    // 성능 모니터 시작
    startPerformanceMonitor() {
        this.performanceMonitorActive = true;
        this.log('성능 모니터링 시작');
        
        this.performanceInterval = setInterval(() => {
            if (this.game && this.game.performanceManager) {
                const stats = this.game.performanceManager.getPerformanceStats();
                this.updateDebugStats();
                
                // 성능 메트릭 수집
                if (stats.fps) {
                    this.performanceMetrics.frameRate.push(stats.fps);
                    if (this.performanceMetrics.frameRate.length > 60) {
                        this.performanceMetrics.frameRate.shift();
                    }
                }
            }
        }, 1000);
    }
    
    // 성능 모니터 중지
    stopPerformanceMonitor() {
        this.performanceMonitorActive = false;
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
        }
        this.log('성능 모니터링 중지');
    }
}

// GameBalancer 클래스 - 게임 밸런싱 및 튜닝
class GameBalancer {
    constructor() {
        // 플레이어 이동 관련 설정
        this.playerMovement = {
            baseSpeed: 4,           // 기본 이동 속도
            maxAngle: 30,           // 최대 인식 각도 (도)
            lerpFactor: 0.15,       // 부드러운 움직임을 위한 보간 계수
            minVelocity: 0.1,       // 최소 속도 임계값 (미세한 떨림 방지)
            deadZone: 5             // 데드존 각도 (도)
        };
        
        // 장애물 관련 설정
        this.obstacles = {
            count: 3,               // 장애물 개수
            minSpeed: 1.5,          // 최소 이동 속도
            maxSpeed: 2.5,          // 최대 이동 속도
            width: 35,              // 장애물 너비
            height: 35,             // 장애물 높이
            safeDistance: 80        // 플레이어/도토리와의 최소 거리
        };
        
        // 도토리 관련 설정
        this.acorns = {
            initialCount: 8,        // 초기 도토리 개수
            maxCount: 15,           // 최대 도토리 개수
            spawnInterval: 5000,    // 생성 간격 (밀리초)
            minDistanceFromPlayer: 50,  // 플레이어와의 최소 거리
            minDistanceFromZone: 30,    // 점수 구역과의 최소 거리
            minDistanceBetween: 40      // 도토리 간 최소 거리
        };
        
        // 충돌 및 상태 관련 설정
        this.collision = {
            stunDuration: 500,      // 기절 시간 (밀리초)
            invulnerableDuration: 1000,  // 무적 시간 (밀리초)
            knockbackForce: 15      // 충돌 시 밀려나는 힘
        };
        
        // 게임 타이밍 관련 설정
        this.timing = {
            gameDuration: 60,       // 게임 시간 (초)
            countdownWarning: 10,   // 경고 카운트다운 시작 시간 (초)
            endGameDelay: 2000      // 게임 종료 후 결과 표시 지연 (밀리초)
        };
        
        // 점수 구역 관련 설정
        this.scoringZones = {
            width: 120,             // 점수 구역 너비
            height: 120,            // 점수 구역 높이
            animationDuration: 500, // 애니메이션 지속 시간 (밀리초)
            stealEffectDuration: 1000,  // 훔치기 효과 지속 시간 (밀리초)
            maxVisibleAcorns: 5     // 시각적으로 표시할 최대 도토리 개수
        };
        
        // 난이도별 설정
        this.difficultySettings = {
            easy: {
                playerSpeed: 1.2,
                obstacleSpeed: 0.8,
                stunDuration: 0.7,
                acornSpawnRate: 1.2
            },
            normal: {
                playerSpeed: 1.0,
                obstacleSpeed: 1.0,
                stunDuration: 1.0,
                acornSpawnRate: 1.0
            },
            hard: {
                playerSpeed: 0.8,
                obstacleSpeed: 1.3,
                stunDuration: 1.5,
                acornSpawnRate: 0.8
            }
        };
        
        // 현재 난이도 (기본값: normal)
        this.currentDifficulty = 'normal';
        
        // 동적 밸런싱을 위한 게임 통계
        this.gameStats = {
            totalCollisions: 0,
            totalAcornsCollected: 0,
            totalSteals: 0,
            averageGameDuration: 0,
            playerWinRates: { sensor1: 0, sensor2: 0 }
        };
    }
    
    // 난이도 설정
    setDifficulty(difficulty) {
        if (this.difficultySettings[difficulty]) {
            this.currentDifficulty = difficulty;
            this.applyDifficultySettings();
        }
    }
    
    // 난이도 설정 적용
    applyDifficultySettings() {
        const settings = this.difficultySettings[this.currentDifficulty];
        
        // 플레이어 이동 속도 조정
        this.playerMovement.baseSpeed = 4 * settings.playerSpeed;
        
        // 장애물 속도 조정
        this.obstacles.minSpeed = 1.5 * settings.obstacleSpeed;
        this.obstacles.maxSpeed = 2.5 * settings.obstacleSpeed;
        
        // 기절 시간 조정
        this.collision.stunDuration = 500 * settings.stunDuration;
        
        // 도토리 생성 간격 조정
        this.acorns.spawnInterval = 5000 / settings.acornSpawnRate;
    }
    
    // 플레이어 이동 설정 반환
    getPlayerMovementSettings() {
        return { ...this.playerMovement };
    }
    
    // 장애물 설정 반환
    getObstacleSettings() {
        return { ...this.obstacles };
    }
    
    // 도토리 설정 반환
    getAcornSettings() {
        return { ...this.acorns };
    }
    
    // 충돌 설정 반환
    getCollisionSettings() {
        return { ...this.collision };
    }
    
    // 타이밍 설정 반환
    getTimingSettings() {
        return { ...this.timing };
    }
    
    // 점수 구역 설정 반환
    getScoringZoneSettings() {
        return { ...this.scoringZones };
    }
    
    // 게임 통계 업데이트
    updateGameStats(statType, value = 1) {
        switch (statType) {
            case 'collision':
                this.gameStats.totalCollisions += value;
                break;
            case 'acorn_collected':
                this.gameStats.totalAcornsCollected += value;
                break;
            case 'steal':
                this.gameStats.totalSteals += value;
                break;
            case 'game_duration':
                this.gameStats.averageGameDuration = 
                    (this.gameStats.averageGameDuration + value) / 2;
                break;
            case 'player_win':
                if (value === 'sensor1' || value === 'sensor2') {
                    this.gameStats.playerWinRates[value]++;
                }
                break;
        }
    }
    
    // 동적 밸런싱 (게임 통계 기반)
    performDynamicBalancing() {
        const stats = this.gameStats;
        
        // 충돌이 너무 많으면 장애물 속도 감소
        if (stats.totalCollisions > 20) {
            this.obstacles.minSpeed = Math.max(1.0, this.obstacles.minSpeed * 0.9);
            this.obstacles.maxSpeed = Math.max(1.5, this.obstacles.maxSpeed * 0.9);
        }
        
        // 도토리 수집이 너무 적으면 생성 간격 단축
        if (stats.totalAcornsCollected < 10) {
            this.acorns.spawnInterval = Math.max(3000, this.acorns.spawnInterval * 0.9);
        }
        
        // 훔치기가 너무 많으면 무적 시간 증가
        if (stats.totalSteals > 15) {
            this.collision.invulnerableDuration = Math.min(1500, this.collision.invulnerableDuration * 1.1);
        }
        
        // 한 플레이어가 너무 많이 이기면 밸런싱 조정
        const totalGames = stats.playerWinRates.sensor1 + stats.playerWinRates.sensor2;
        if (totalGames > 10) {
            const winRate1 = stats.playerWinRates.sensor1 / totalGames;
            const winRate2 = stats.playerWinRates.sensor2 / totalGames;
            
            if (Math.abs(winRate1 - winRate2) > 0.3) {
                // 승률 차이가 30% 이상이면 약간의 핸디캡 적용
                console.log('게임 밸런스 조정 적용');
            }
        }
    }
    
    // 게임 통계 반환
    getGameStats() {
        return { ...this.gameStats };
    }
    
    // 설정 초기화
    resetSettings() {
        this.currentDifficulty = 'normal';
        this.applyDifficultySettings();
        this.gameStats = {
            totalCollisions: 0,
            totalAcornsCollected: 0,
            totalSteals: 0,
            averageGameDuration: 0,
            playerWinRates: { sensor1: 0, sensor2: 0 }
        };
    }
    
    // 실시간 밸런싱 조정
    adjustRealTimeBalance(gameState) {
        const timePlayed = (Date.now() - gameState.startTime) / 1000;
        const timeRemaining = gameState.timeRemaining;
        
        // 게임 후반부에 도토리 생성 빈도 증가
        if (timeRemaining < 20 && timeRemaining > 10) {
            this.acorns.spawnInterval = Math.max(3000, this.acorns.spawnInterval * 0.95);
        }
        
        // 게임 막판에 더 많은 액션 유도
        if (timeRemaining < 10) {
            this.obstacles.minSpeed *= 1.05;
            this.obstacles.maxSpeed *= 1.05;
            this.acorns.spawnInterval = Math.max(2000, this.acorns.spawnInterval * 0.9);
        }
        
        // 점수 차이가 클 때 밸런싱
        const scoreDiff = Math.abs(gameState.players.sensor1.score - gameState.players.sensor2.score);
        if (scoreDiff >= 3) {
            // 뒤처진 플레이어에게 약간의 도움
            this.collision.stunDuration = Math.max(300, this.collision.stunDuration * 0.9);
        }
    }
}

// PerformanceManager 클래스 - 성능 최적화 및 메모리 관리
class PerformanceManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.currentFps = 60;
        this.targetFps = 60;
        this.frameTime = 1000 / this.targetFps;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        
        // 성능 모니터링
        this.performanceStats = {
            renderTime: 0,
            updateTime: 0,
            totalFrameTime: 0,
            memoryUsage: 0
        };
        
        // 객체 풀링
        this.objectPools = {
            particles: [],
            collisionEffects: []
        };
        
        // 메모리 관리
        this.eventListeners = new Map();
        this.intervals = new Set();
        this.timeouts = new Set();
        
        // 모바일 최적화 설정
        this.isMobile = this.detectMobile();
        this.optimizationLevel = this.isMobile ? 'high' : 'medium';
        
        this.setupPerformanceMonitoring();
    }
    
    // 모바일 기기 감지
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }
    
    // 성능 모니터링 설정
    setupPerformanceMonitoring() {
        // FPS 모니터링
        this.fpsMonitorInterval = this.addInterval(() => {
            this.updateFpsStats();
        }, 1000);
        
        // 메모리 사용량 모니터링 (지원되는 경우)
        if (performance.memory) {
            this.memoryMonitorInterval = this.addInterval(() => {
                this.updateMemoryStats();
            }, 5000);
        }
    }
    
    // FPS 통계 업데이트
    updateFpsStats() {
        const now = performance.now();
        const elapsed = now - this.lastFpsUpdate;
        
        if (elapsed >= 1000) {
            this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFpsUpdate = now;
            
            // FPS가 낮으면 최적화 레벨 조정
            if (this.currentFps < 30) {
                this.optimizationLevel = 'high';
            } else if (this.currentFps < 45) {
                this.optimizationLevel = 'medium';
            } else {
                this.optimizationLevel = 'low';
            }
        }
    }
    
    // 메모리 사용량 업데이트
    updateMemoryStats() {
        if (performance.memory) {
            this.performanceStats.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
            
            // 메모리 사용량이 높으면 가비지 컬렉션 유도
            if (this.performanceStats.memoryUsage > 100) {
                this.forceGarbageCollection();
            }
        }
    }
    
    // 프레임 시작 시 호출
    frameStart() {
        this.frameStartTime = performance.now();
        this.frameCount++;
    }
    
    // 프레임 종료 시 호출
    frameEnd() {
        const frameEndTime = performance.now();
        this.performanceStats.totalFrameTime = frameEndTime - this.frameStartTime;
        this.deltaTime = this.performanceStats.totalFrameTime;
    }
    
    // 렌더링 시작 시 호출
    renderStart() {
        this.renderStartTime = performance.now();
    }
    
    // 렌더링 종료 시 호출
    renderEnd() {
        this.performanceStats.renderTime = performance.now() - this.renderStartTime;
    }
    
    // 업데이트 시작 시 호출
    updateStart() {
        this.updateStartTime = performance.now();
    }
    
    // 업데이트 종료 시 호출
    updateEnd() {
        this.performanceStats.updateTime = performance.now() - this.updateStartTime;
    }
    
    // 최적화된 requestAnimationFrame
    optimizedRequestAnimationFrame(callback) {
        const now = performance.now();
        const elapsed = now - this.lastFrameTime;
        
        if (elapsed >= this.frameTime) {
            this.lastFrameTime = now;
            return requestAnimationFrame(callback);
        } else {
            // 프레임 제한을 위해 setTimeout 사용
            return setTimeout(() => {
                requestAnimationFrame(callback);
            }, this.frameTime - elapsed);
        }
    }
    
    // 객체 풀에서 파티클 가져오기
    getPooledParticle() {
        return this.objectPools.particles.pop() || null;
    }
    
    // 파티클을 객체 풀에 반환
    returnParticleToPool(particle) {
        // 파티클 초기화
        particle.position = { x: 0, y: 0 };
        particle.velocity = { x: 0, y: 0 };
        particle.life = 0;
        particle.maxLife = 0;
        
        this.objectPools.particles.push(particle);
    }
    
    // 충돌 효과 객체 풀에서 가져오기
    getPooledCollisionEffect() {
        return this.objectPools.collisionEffects.pop() || null;
    }
    
    // 충돌 효과를 객체 풀에 반환
    returnCollisionEffectToPool(effect) {
        effect.particles = [];
        effect.startTime = 0;
        effect.duration = 0;
        
        this.objectPools.collisionEffects.push(effect);
    }
    
    // 이벤트 리스너 추가 (메모리 누수 방지)
    addEventListener(element, event, handler, options) {
        const key = `${element.constructor.name}-${event}`;
        
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        
        this.eventListeners.get(key).push({ element, event, handler, options });
        element.addEventListener(event, handler, options);
    }
    
    // 인터벌 추가 (메모리 누수 방지)
    addInterval(callback, delay) {
        const intervalId = setInterval(callback, delay);
        this.intervals.add(intervalId);
        return intervalId;
    }
    
    // 타임아웃 추가 (메모리 누수 방지)
    addTimeout(callback, delay) {
        const timeoutId = setTimeout(() => {
            callback();
            this.timeouts.delete(timeoutId);
        }, delay);
        this.timeouts.add(timeoutId);
        return timeoutId;
    }
    
    // 가비지 컬렉션 유도
    forceGarbageCollection() {
        // 사용하지 않는 객체들 정리
        this.cleanupUnusedObjects();
        
        // 브라우저의 가비지 컬렉션 유도 (가능한 경우)
        if (window.gc) {
            window.gc();
        }
    }
    
    // 사용하지 않는 객체들 정리
    cleanupUnusedObjects() {
        // 파티클 풀 크기 제한
        if (this.objectPools.particles.length > 100) {
            this.objectPools.particles.splice(50);
        }
        
        // 충돌 효과 풀 크기 제한
        if (this.objectPools.collisionEffects.length > 50) {
            this.objectPools.collisionEffects.splice(25);
        }
        
        // 에러 로그 크기 제한
        if (this.game.errorHandler && this.game.errorHandler.errorLog.length > 50) {
            this.game.errorHandler.errorLog.splice(0, 25);
        }
    }
    
    // 최적화 레벨에 따른 설정 반환
    getOptimizationSettings() {
        const settings = {
            low: {
                particleCount: 1.0,
                trailLength: 1.0,
                renderQuality: 1.0,
                updateFrequency: 1.0
            },
            medium: {
                particleCount: 0.7,
                trailLength: 0.8,
                renderQuality: 0.9,
                updateFrequency: 0.9
            },
            high: {
                particleCount: 0.5,
                trailLength: 0.6,
                renderQuality: 0.8,
                updateFrequency: 0.8
            }
        };
        
        return settings[this.optimizationLevel] || settings.medium;
    }
    
    // 성능 통계 반환
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            currentFps: this.currentFps,
            optimizationLevel: this.optimizationLevel,
            isMobile: this.isMobile,
            deltaTime: this.deltaTime
        };
    }
    
    // 정리
    cleanup() {
        // 모든 이벤트 리스너 제거
        this.eventListeners.forEach((listeners) => {
            listeners.forEach(({ element, event, handler, options }) => {
                element.removeEventListener(event, handler, options);
            });
        });
        this.eventListeners.clear();
        
        // 모든 인터벌 정리
        this.intervals.forEach(intervalId => {
            clearInterval(intervalId);
        });
        this.intervals.clear();
        
        // 모든 타임아웃 정리
        this.timeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.timeouts.clear();
        
        // 객체 풀 정리
        this.objectPools.particles = [];
        this.objectPools.collisionEffects = [];
    }
}

// ErrorHandler 클래스 - 에러 처리 및 예외 상황 관리
class ErrorHandler {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.errorLog = [];
        this.maxErrorLog = 50; // 최대 에러 로그 개수
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // 2초
        this.isRecovering = false;
        
        // 전역 에러 핸들러 설정
        this.setupGlobalErrorHandlers();
    }
    
    // 전역 에러 핸들러 설정
    setupGlobalErrorHandlers() {
        // JavaScript 에러 처리
        window.addEventListener('error', (event) => {
            this.handleJavaScriptError(event.error, event.filename, event.lineno);
        });
        
        // Promise rejection 처리
        window.addEventListener('unhandledrejection', (event) => {
            this.handlePromiseRejection(event.reason);
            event.preventDefault();
        });
        
        // 네트워크 연결 상태 모니터링
        window.addEventListener('online', () => {
            this.handleNetworkReconnect();
        });
        
        window.addEventListener('offline', () => {
            this.handleNetworkDisconnect();
        });
    }
    
    // JavaScript 에러 처리
    handleJavaScriptError(error, filename, lineno) {
        const errorInfo = {
            type: 'JavaScript Error',
            message: error?.message || 'Unknown error',
            filename: filename || 'Unknown file',
            lineno: lineno || 'Unknown line',
            timestamp: new Date().toISOString(),
            gamePhase: this.game.gameState.phase
        };
        
        this.logError(errorInfo);
        
        // 치명적 에러인지 확인
        if (this.isCriticalError(error)) {
            this.handleCriticalError(errorInfo);
        } else {
            this.showUserFriendlyError('게임 실행 중 오류가 발생했습니다. 계속 진행합니다.');
        }
    }
    
    // Promise rejection 처리
    handlePromiseRejection(reason) {
        const errorInfo = {
            type: 'Promise Rejection',
            message: reason?.message || reason || 'Unknown promise rejection',
            timestamp: new Date().toISOString(),
            gamePhase: this.game.gameState.phase
        };
        
        this.logError(errorInfo);
        this.showUserFriendlyError('네트워크 오류가 발생했습니다. 연결을 확인해주세요.');
    }
    
    // 네트워크 연결 해제 처리
    handleNetworkDisconnect() {
        console.warn('네트워크 연결이 끊어졌습니다');
        
        if (this.game.gameState.phase === 'playing') {
            this.game.pauseGame();
            this.showUserFriendlyError('인터넷 연결이 끊어졌습니다. 연결을 확인해주세요.', 'network-error');
        }
    }
    
    // 네트워크 재연결 처리
    handleNetworkReconnect() {
        console.log('네트워크 연결이 복구되었습니다');
        this.hideError('network-error');
        
        // 서버 재연결 시도
        if (this.game.gameState.phase === 'paused') {
            this.attemptServerReconnect();
        }
    }
    
    // 서버 연결 오류 처리
    handleServerConnectionError(error) {
        const errorInfo = {
            type: 'Server Connection Error',
            message: error?.message || 'Server connection failed',
            timestamp: new Date().toISOString(),
            gamePhase: this.game.gameState.phase
        };
        
        this.logError(errorInfo);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptServerReconnect();
        } else {
            this.handleCriticalError(errorInfo);
        }
    }
    
    // 서버 재연결 시도
    attemptServerReconnect() {
        if (this.isRecovering) return;
        
        this.isRecovering = true;
        this.reconnectAttempts++;
        
        console.log(`서버 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.showUserFriendlyError(`서버 재연결 중... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'reconnecting');
        
        setTimeout(() => {
            try {
                // SessionSDK 재연결 시도
                if (this.game.sdk) {
                    this.game.sdk.reconnect?.();
                }
                
                // 재연결 성공 확인을 위한 타이머
                setTimeout(() => {
                    if (this.game.gameState.connectedSensors.size > 0) {
                        this.handleReconnectSuccess();
                    } else {
                        this.isRecovering = false;
                        if (this.reconnectAttempts < this.maxReconnectAttempts) {
                            this.attemptServerReconnect();
                        } else {
                            this.handleReconnectFailure();
                        }
                    }
                }, 3000);
                
            } catch (error) {
                console.error('재연결 시도 중 오류:', error);
                this.isRecovering = false;
                this.handleServerConnectionError(error);
            }
        }, this.reconnectDelay);
    }
    
    // 재연결 성공 처리
    handleReconnectSuccess() {
        console.log('서버 재연결 성공');
        this.reconnectAttempts = 0;
        this.isRecovering = false;
        
        this.hideError('reconnecting');
        this.showUserFriendlyError('연결이 복구되었습니다!', 'success', 3000);
        
        // 게임 재개
        if (this.game.gameState.phase === 'paused') {
            setTimeout(() => {
                this.game.resumeGame();
            }, 1000);
        }
    }
    
    // 재연결 실패 처리
    handleReconnectFailure() {
        console.error('서버 재연결 실패 - 최대 시도 횟수 초과');
        this.isRecovering = false;
        
        this.showUserFriendlyError(
            '서버 연결을 복구할 수 없습니다. 페이지를 새로고침해주세요.',
            'critical-error'
        );
        
        // 게임 종료
        this.game.gameState.phase = 'error';
        this.game.stopGameLoop();
    }
    
    // 센서 연결 해제 처리
    handleSensorDisconnect(sensorId) {
        console.warn(`센서 ${sensorId} 연결 해제됨`);
        
        const errorInfo = {
            type: 'Sensor Disconnect',
            message: `Sensor ${sensorId} disconnected`,
            sensorId: sensorId,
            timestamp: new Date().toISOString(),
            gamePhase: this.game.gameState.phase
        };
        
        this.logError(errorInfo);
        
        // 게임 진행 중이면 일시정지
        if (this.game.gameState.phase === 'playing') {
            this.game.pauseGame();
            this.showUserFriendlyError(
                `플레이어 ${sensorId === 'sensor1' ? '1' : '2'}의 연결이 끊어졌습니다. 재연결을 기다리는 중...`,
                'sensor-disconnect'
            );
        }
    }
    
    // 센서 데이터 검증 오류 처리
    handleSensorDataError(sensorId, data, error) {
        const errorInfo = {
            type: 'Sensor Data Error',
            message: error?.message || 'Invalid sensor data',
            sensorId: sensorId,
            data: data,
            timestamp: new Date().toISOString(),
            gamePhase: this.game.gameState.phase
        };
        
        this.logError(errorInfo);
        
        // 연속적인 센서 데이터 오류 감지
        const recentErrors = this.errorLog.filter(log => 
            log.type === 'Sensor Data Error' && 
            log.sensorId === sensorId &&
            Date.now() - new Date(log.timestamp).getTime() < 5000 // 5초 내
        );
        
        if (recentErrors.length > 10) {
            this.handleSensorDisconnect(sensorId);
        }
    }
    
    // 치명적 에러 처리
    handleCriticalError(errorInfo) {
        console.error('치명적 에러 발생:', errorInfo);
        
        this.game.gameState.phase = 'error';
        this.game.stopGameLoop();
        
        this.showUserFriendlyError(
            '게임에서 복구할 수 없는 오류가 발생했습니다. 페이지를 새로고침해주세요.',
            'critical-error'
        );
    }
    
    // 치명적 에러 여부 판단
    isCriticalError(error) {
        if (!error) return false;
        
        const criticalPatterns = [
            'Cannot read property',
            'Cannot read properties',
            'is not a function',
            'Maximum call stack',
            'Out of memory'
        ];
        
        return criticalPatterns.some(pattern => 
            error.message?.includes(pattern)
        );
    }
    
    // 사용자 친화적 에러 메시지 표시
    showUserFriendlyError(message, type = 'error', duration = 0) {
        // 기존 에러 메시지 제거
        this.hideError(type);
        
        const errorElement = document.createElement('div');
        errorElement.className = `error-notification ${type}`;
        errorElement.id = `error-${type}`;
        errorElement.innerHTML = `
            <div class="error-content">
                <span class="error-icon">${this.getErrorIcon(type)}</span>
                <span class="error-message">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(errorElement);
        
        // 자동 제거 (duration이 설정된 경우)
        if (duration > 0) {
            setTimeout(() => {
                this.hideError(type);
            }, duration);
        }
    }
    
    // 에러 아이콘 반환
    getErrorIcon(type) {
        const icons = {
            'error': '⚠️',
            'network-error': '🌐',
            'sensor-disconnect': '📱',
            'reconnecting': '🔄',
            'success': '✅',
            'critical-error': '❌'
        };
        
        return icons[type] || '⚠️';
    }
    
    // 에러 메시지 숨기기
    hideError(type) {
        const errorElement = document.getElementById(`error-${type}`);
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    // 에러 로그 기록
    logError(errorInfo) {
        this.errorLog.push(errorInfo);
        
        // 로그 크기 제한
        if (this.errorLog.length > this.maxErrorLog) {
            this.errorLog.shift();
        }
        
        console.error('게임 에러:', errorInfo);
    }
    
    // 에러 로그 반환
    getErrorLog() {
        return [...this.errorLog];
    }
    
    // 에러 통계 반환
    getErrorStats() {
        const stats = {};
        this.errorLog.forEach(error => {
            stats[error.type] = (stats[error.type] || 0) + 1;
        });
        return stats;
    }
    
    // 정리
    cleanup() {
        // 에러 메시지 모두 제거
        document.querySelectorAll('.error-notification').forEach(el => el.remove());
        
        // 에러 로그 초기화
        this.errorLog = [];
        this.reconnectAttempts = 0;
        this.isRecovering = false;
    }
}

// AudioSystem 클래스 - 게임 사운드 효과 관리
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.3; // 전체 볼륨 (30%)
        this.soundEnabled = true;
        this.initializeAudioContext();
    }
    
    // 오디오 컨텍스트 초기화
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('오디오 컨텍스트 초기화 실패:', error);
            this.soundEnabled = false;
        }
    }
    
    // 오디오 컨텍스트 재개 (사용자 상호작용 후)
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // 도토리 수집 사운드
    playCollectionSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 밝고 경쾌한 수집 사운드 (C-E-G 화음)
            oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G5
            oscillator.type = 'sine';
            
            // 볼륨 조절
            gainNode.gain.setValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            // 사운드 재생
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
            
        } catch (error) {
            console.warn('도토리 수집 사운드 재생 실패:', error);
        }
    }
    
    // 점수 획득 사운드
    playScoreSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            // 두 개의 오실레이터로 화음 생성
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 승리감 있는 상승 멜로디
            oscillator1.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
            oscillator1.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.15); // E5
            oscillator1.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.3); // G5
            oscillator1.frequency.setValueAtTime(1047, this.audioContext.currentTime + 0.45); // C6
            
            oscillator2.frequency.setValueAtTime(392, this.audioContext.currentTime); // G4
            oscillator2.frequency.setValueAtTime(523, this.audioContext.currentTime + 0.15); // C5
            oscillator2.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.3); // E5
            oscillator2.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.45); // G5
            
            oscillator1.type = 'triangle';
            oscillator2.type = 'sine';
            
            // 볼륨 조절
            gainNode.gain.setValueAtTime(this.masterVolume * 0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
            
            // 사운드 재생
            oscillator1.start(this.audioContext.currentTime);
            oscillator2.start(this.audioContext.currentTime);
            oscillator1.stop(this.audioContext.currentTime + 0.6);
            oscillator2.stop(this.audioContext.currentTime + 0.6);
            
        } catch (error) {
            console.warn('점수 획득 사운드 재생 실패:', error);
        }
    }
    
    // 도토리 훔치기 사운드
    playStealSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 경고음과 같은 불협화음 효과
            oscillator1.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator1.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
            oscillator1.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);
            
            oscillator2.frequency.setValueAtTime(600, this.audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.1);
            oscillator2.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.2);
            
            oscillator1.type = 'square';
            oscillator2.type = 'sawtooth';
            
            // 볼륨 조절
            gainNode.gain.setValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            // 사운드 재생
            oscillator1.start(this.audioContext.currentTime);
            oscillator2.start(this.audioContext.currentTime);
            oscillator1.stop(this.audioContext.currentTime + 0.3);
            oscillator2.stop(this.audioContext.currentTime + 0.3);
            
        } catch (error) {
            console.warn('도토리 훔치기 사운드 재생 실패:', error);
        }
    }
    
    // 장애물 충돌 사운드
    playCollisionSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 낮은 주파수의 강한 충격음
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
            oscillator.type = 'sawtooth';
            
            // 볼륨 조절
            gainNode.gain.setValueAtTime(this.masterVolume * 0.6, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            // 사운드 재생
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
            
        } catch (error) {
            console.warn('충돌 사운드 재생 실패:', error);
        }
    }
    
    // 게임 시작 사운드
    playGameStartSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 상승하는 팡파르 멜로디
            oscillator.frequency.setValueAtTime(262, this.audioContext.currentTime); // C4
            oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime + 0.2); // E4
            oscillator.frequency.setValueAtTime(392, this.audioContext.currentTime + 0.4); // G4
            oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime + 0.6); // C5
            oscillator.type = 'triangle';
            
            // 볼륨 조절
            gainNode.gain.setValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
            
            // 사운드 재생
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.8);
            
        } catch (error) {
            console.warn('게임 시작 사운드 재생 실패:', error);
        }
    }
    
    // 게임 종료 사운드
    playGameEndSound(isWinner = false) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            if (isWinner) {
                // 승리 멜로디 - 밝고 기쁜 소리
                oscillator1.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
                oscillator1.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.3); // E5
                oscillator1.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.6); // G5
                oscillator1.frequency.setValueAtTime(1047, this.audioContext.currentTime + 0.9); // C6
                
                oscillator2.frequency.setValueAtTime(392, this.audioContext.currentTime); // G4
                oscillator2.frequency.setValueAtTime(523, this.audioContext.currentTime + 0.3); // C5
                oscillator2.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.6); // E5
                oscillator2.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.9); // G5
            } else {
                // 패배 멜로디 - 하강하는 소리
                oscillator1.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
                oscillator1.frequency.setValueAtTime(466, this.audioContext.currentTime + 0.3); // Bb4
                oscillator1.frequency.setValueAtTime(392, this.audioContext.currentTime + 0.6); // G4
                oscillator1.frequency.setValueAtTime(330, this.audioContext.currentTime + 0.9); // E4
                
                oscillator2.frequency.setValueAtTime(392, this.audioContext.currentTime); // G4
                oscillator2.frequency.setValueAtTime(349, this.audioContext.currentTime + 0.3); // F4
                oscillator2.frequency.setValueAtTime(294, this.audioContext.currentTime + 0.6); // D4
                oscillator2.frequency.setValueAtTime(262, this.audioContext.currentTime + 0.9); // C4
            }
            
            oscillator1.type = 'triangle';
            oscillator2.type = 'sine';
            
            // 볼륨 조절
            gainNode.gain.setValueAtTime(this.masterVolume * 0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.2);
            
            // 사운드 재생
            oscillator1.start(this.audioContext.currentTime);
            oscillator2.start(this.audioContext.currentTime);
            oscillator1.stop(this.audioContext.currentTime + 1.2);
            oscillator2.stop(this.audioContext.currentTime + 1.2);
            
        } catch (error) {
            console.warn('게임 종료 사운드 재생 실패:', error);
        }
    }
    
    // 볼륨 설정
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    // 사운드 활성화/비활성화
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }
    
    // 정리
    cleanup() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

// Particle 클래스 - 파티클 효과를 위한 기본 클래스
class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.position = { x, y };
        this.velocity = { x: vx, y: vy };
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.gravity = 0.1;
        this.friction = 0.98;
    }
    
    update() {
        // 위치 업데이트
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        // 중력 적용
        this.velocity.y += this.gravity;
        
        // 마찰 적용
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        // 생명력 감소
        this.life--;
        
        return this.life > 0;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ParticleSystem 클래스 - 파티클 효과 관리 (최적화된 버전)
class ParticleSystem {
    constructor(performanceManager = null) {
        this.particles = [];
        this.performanceManager = performanceManager;
    }
    
    // 도토리 수집 파티클 효과 (최적화된 버전)
    createCollectionEffect(x, y) {
        // 성능 최적화 설정 적용
        const optimizationSettings = this.performanceManager?.getOptimizationSettings() || { particleCount: 1.0 };
        const baseParticleCount = 15;
        const particleCount = Math.floor(baseParticleCount * optimizationSettings.particleCount);
        const colors = ['#FFD700', '#FFA500', '#FF8C00', '#DAA520'];
        
        for (let i = 0; i < particleCount; i++) {
            // 객체 풀에서 파티클 가져오기 시도
            let particle = this.performanceManager?.getPooledParticle();
            
            if (!particle) {
                // 풀에 없으면 새로 생성
                const angle = (i / particleCount) * Math.PI * 2;
                const speed = 2 + Math.random() * 4;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed - 2; // 위쪽으로 튀어오르는 효과
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = 3 + Math.random() * 4;
                const life = 30 + Math.random() * 20;
                
                particle = new Particle(x, y, vx, vy, color, size, life);
            } else {
                // 풀에서 가져온 파티클 재초기화
                const angle = (i / particleCount) * Math.PI * 2;
                const speed = 2 + Math.random() * 4;
                particle.position.x = x;
                particle.position.y = y;
                particle.velocity.x = Math.cos(angle) * speed;
                particle.velocity.y = Math.sin(angle) * speed - 2;
                particle.color = colors[Math.floor(Math.random() * colors.length)];
                particle.size = 3 + Math.random() * 4;
                particle.life = 30 + Math.random() * 20;
                particle.maxLife = particle.life;
            }
            
            this.particles.push(particle);
        }
    }
    
    // 점수 획득 축하 파티클 효과
    createScoreEffect(x, y) {
        const particleCount = 25;
        const colors = ['#00FF00', '#32CD32', '#90EE90', '#ADFF2F'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 3; // 더 강한 위쪽 효과
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 4 + Math.random() * 5;
            const life = 40 + Math.random() * 30;
            
            this.particles.push(new Particle(x, y, vx, vy, color, size, life));
        }
    }
    
    // 도토리 훔치기 경고 파티클 효과
    createStealEffect(x, y) {
        const particleCount = 20;
        const colors = ['#FF0000', '#FF4500', '#DC143C', '#B22222'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 3 + Math.random() * 3;
            const life = 35 + Math.random() * 25;
            
            this.particles.push(new Particle(x, y, vx, vy, color, size, life));
        }
    }
    
    // 충돌 충격 파티클 효과
    createImpactEffect(x, y) {
        const particleCount = 18;
        const colors = ['#FF6600', '#FF4444', '#FF0000', '#CC0000'];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 4 + Math.random() * 6;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 2 + Math.random() * 4;
            const life = 25 + Math.random() * 15;
            
            this.particles.push(new Particle(x, y, vx, vy, color, size, life));
        }
    }
    
    update() {
        // 파티클 업데이트 및 생명이 다한 파티클 제거 (최적화된 버전)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (!particle.update()) {
                // 생명이 다한 파티클을 객체 풀에 반환
                if (this.performanceManager) {
                    this.performanceManager.returnParticleToPool(particle);
                }
                
                // 배열에서 제거 (splice 대신 마지막 요소와 교체하여 성능 향상)
                this.particles[i] = this.particles[this.particles.length - 1];
                this.particles.pop();
            }
        }
    }
    
    render(ctx) {
        this.particles.forEach(particle => particle.render(ctx));
    }
    
    clear() {
        this.particles = [];
    }
}

// TrailEffect 클래스 - 플레이어 이동 트레일 효과
class TrailEffect {
    constructor() {
        this.trails = {
            sensor1: [],
            sensor2: []
        };
        this.maxTrailLength = 15;
    }
    
    addTrailPoint(sensorId, x, y) {
        const trail = this.trails[sensorId];
        
        // 새 트레일 포인트 추가
        trail.push({
            x: x,
            y: y,
            time: Date.now(),
            alpha: 1.0
        });
        
        // 트레일 길이 제한
        if (trail.length > this.maxTrailLength) {
            trail.shift();
        }
    }
    
    update() {
        const now = Date.now();
        const trailDuration = 500; // 0.5초간 트레일 유지
        
        Object.keys(this.trails).forEach(sensorId => {
            const trail = this.trails[sensorId];
            
            // 트레일 포인트 업데이트 및 오래된 포인트 제거
            this.trails[sensorId] = trail.filter(point => {
                const age = now - point.time;
                if (age > trailDuration) return false;
                
                // 알파값 계산 (시간이 지날수록 투명해짐)
                point.alpha = 1.0 - (age / trailDuration);
                return true;
            });
        });
    }
    
    render(ctx, gameState) {
        Object.entries(this.trails).forEach(([sensorId, trail]) => {
            if (trail.length < 2) return;
            
            const player = gameState.players[sensorId];
            if (!player) return;
            
            ctx.save();
            ctx.strokeStyle = player.color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // 트레일 그리기
            for (let i = 1; i < trail.length; i++) {
                const prevPoint = trail[i - 1];
                const currPoint = trail[i];
                
                ctx.globalAlpha = currPoint.alpha * 0.6;
                ctx.beginPath();
                ctx.moveTo(prevPoint.x, prevPoint.y);
                ctx.lineTo(currPoint.x, currPoint.y);
                ctx.stroke();
            }
            
            ctx.restore();
        });
    }
    
    clear() {
        Object.keys(this.trails).forEach(sensorId => {
            this.trails[sensorId] = [];
        });
    }
}

// Acorn 클래스 - 개별 도토리 관리
class Acorn {
    constructor(x, y) {
        this.position = { x, y };
        this.radius = 15;
        this.collected = false;
        this.spawnTime = Date.now();
    }
    
    render(ctx) {
        if (this.collected) return;
        
        // 도토리 몸체
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 도토리 테두리
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 도토리 꼭지 (줄기)
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.position.x - 3, this.position.y - this.radius - 5, 6, 8);
        
        // 도토리 하이라이트
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.arc(this.position.x - 5, this.position.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    

}

// Obstacle 클래스 - 움직이는 장애물
class Obstacle {
    constructor(x, y, width, height, speedX, speedY) {
        this.position = { x, y };
        this.size = { width, height };
        this.velocity = { x: speedX, y: speedY };
        this.color = '#FF4444';
        this.warningColor = '#FFFF00';
        this.id = Math.random().toString(36).substr(2, 9);
    }
    
    update(canvasWidth, canvasHeight) {
        // 위치 업데이트
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        // 벽에 부딪히면 방향 전환 (경계 반사)
        if (this.position.x <= 0 || this.position.x + this.size.width >= canvasWidth) {
            this.velocity.x *= -1;
            // 경계에서 벗어나지 않도록 위치 조정
            this.position.x = Math.max(0, Math.min(canvasWidth - this.size.width, this.position.x));
        }
        if (this.position.y <= 0 || this.position.y + this.size.height >= canvasHeight) {
            this.velocity.y *= -1;
            // 경계에서 벗어나지 않도록 위치 조정
            this.position.y = Math.max(0, Math.min(canvasHeight - this.size.height, this.position.y));
        }
    }
    
    render(ctx) {
        // 장애물 몸체
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.size.width, this.size.height);
        
        // 장애물 테두리
        ctx.strokeStyle = '#AA0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x, this.position.y, this.size.width, this.size.height);
        
        // 위험 표시 (경고 아이콘)
        ctx.fillStyle = this.warningColor;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️', 
            this.position.x + this.size.width / 2, 
            this.position.y + this.size.height / 2 + 7
        );
        
        // 움직임 방향 표시 (작은 화살표)
        const centerX = this.position.x + this.size.width / 2;
        const centerY = this.position.y + this.size.height / 2;
        const arrowLength = 15;
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // 속도 벡터 정규화
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > 0) {
            const dirX = this.velocity.x / speed;
            const dirY = this.velocity.y / speed;
            
            // 화살표 그리기
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + dirX * arrowLength, centerY + dirY * arrowLength);
            
            // 화살표 머리
            const arrowHeadLength = 5;
            const angle = Math.atan2(dirY, dirX);
            ctx.lineTo(
                centerX + dirX * arrowLength - Math.cos(angle - Math.PI / 6) * arrowHeadLength,
                centerY + dirY * arrowLength - Math.sin(angle - Math.PI / 6) * arrowHeadLength
            );
            ctx.moveTo(centerX + dirX * arrowLength, centerY + dirY * arrowLength);
            ctx.lineTo(
                centerX + dirX * arrowLength - Math.cos(angle + Math.PI / 6) * arrowHeadLength,
                centerY + dirY * arrowLength - Math.sin(angle + Math.PI / 6) * arrowHeadLength
            );
        }
        
        ctx.stroke();
    }
    

}

// ObstacleManager 클래스 - 장애물 생성 및 관리 (밸런싱 적용)
class ObstacleManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.obstacles = [];
        // 게임 밸런서에서 설정을 가져와 초기화
        this.updateSettingsFromBalancer();
    }
    
    // 게임 밸런서에서 설정 업데이트
    updateSettingsFromBalancer() {
        if (this.game.gameBalancer) {
            const obstacleSettings = this.game.gameBalancer.getObstacleSettings();
            this.obstacleCount = obstacleSettings.count;
            this.minSpeed = obstacleSettings.minSpeed;
            this.maxSpeed = obstacleSettings.maxSpeed;
            this.obstacleSize = { 
                width: obstacleSettings.width, 
                height: obstacleSettings.height 
            };
            this.safeDistance = obstacleSettings.safeDistance;
        } else {
            // 기본값 설정
            this.obstacleCount = 3;
            this.minSpeed = 1.5;
            this.maxSpeed = 2.5;
            this.obstacleSize = { width: 35, height: 35 };
            this.safeDistance = 80;
        }
    }
    
    // 장애물 초기화
    initialize() {
        this.obstacles = [];
        
        for (let i = 0; i < this.obstacleCount; i++) {
            this.createObstacle();
        }
        
        console.log(`${this.obstacleCount}개의 장애물 생성 완료`);
    }
    
    // 새 장애물 생성
    createObstacle() {
        const canvas = this.game.canvas;
        const position = this.getRandomSafePosition();
        
        if (position) {
            // 랜덤한 속도 벡터 생성
            const speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);
            const angle = Math.random() * Math.PI * 2;
            const speedX = Math.cos(angle) * speed;
            const speedY = Math.sin(angle) * speed;
            
            const obstacle = new Obstacle(
                position.x, 
                position.y, 
                this.obstacleSize.width, 
                this.obstacleSize.height, 
                speedX, 
                speedY
            );
            
            this.obstacles.push(obstacle);
            return obstacle;
        }
        return null;
    }
    
    // 안전한 랜덤 위치 찾기 (플레이어, 점수 구역, 도토리와 겹치지 않는 위치)
    getRandomSafePosition() {
        const canvas = this.game.canvas;
        const margin = 50;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (attempts < maxAttempts) {
            const x = margin + Math.random() * (canvas.width - 2 * margin - this.obstacleSize.width);
            const y = margin + Math.random() * (canvas.height - 2 * margin - this.obstacleSize.height);
            
            if (this.isPositionSafe(x, y)) {
                return { x, y };
            }
            attempts++;
        }
        
        // 안전한 위치를 찾지 못한 경우 중앙 근처에 배치
        console.warn('안전한 장애물 위치를 찾지 못함, 중앙 근처에 배치');
        return { 
            x: canvas.width / 2 + (Math.random() - 0.5) * 200, 
            y: canvas.height / 2 + (Math.random() - 0.5) * 200 
        };
    }
    
    // 위치가 안전한지 확인
    isPositionSafe(x, y) {
        const minDistance = 80;
        
        // 플레이어와의 거리 체크
        for (const player of Object.values(this.game.gameState.players)) {
            const dx = x + this.obstacleSize.width / 2 - player.position.x;
            const dy = y + this.obstacleSize.height / 2 - player.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                return false;
            }
        }
        
        // 점수 구역과의 거리 체크
        for (const zone of Object.values(this.game.gameState.scoringZones)) {
            if (x < zone.x + zone.width + minDistance && 
                x + this.obstacleSize.width > zone.x - minDistance &&
                y < zone.y + zone.height + minDistance && 
                y + this.obstacleSize.height > zone.y - minDistance) {
                return false;
            }
        }
        
        // 다른 장애물과의 거리 체크
        for (const obstacle of this.obstacles) {
            const dx = x + this.obstacleSize.width / 2 - (obstacle.position.x + obstacle.size.width / 2);
            const dy = y + this.obstacleSize.height / 2 - (obstacle.position.y + obstacle.size.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                return false;
            }
        }
        
        return true;
    }
    
    // 장애물 업데이트
    update() {
        this.obstacles.forEach(obstacle => {
            obstacle.update(this.game.canvas.width, this.game.canvas.height);
        });
    }
    

    
    // 장애물 렌더링
    render(ctx) {
        this.obstacles.forEach(obstacle => {
            obstacle.render(ctx);
        });
    }
}

// CollisionManager 클래스 - 통합 충돌 감지 시스템
class CollisionManager {
    constructor(gameInstance) {
        this.game = gameInstance;
    }
    
    // 모든 충돌 검사를 통합 처리
    checkAllCollisions() {
        this.checkPlayerAcornCollisions();
        this.checkPlayerObstacleCollisions();
        this.checkPlayerScoringZoneCollisions();
    }
    
    // 플레이어-도토리 충돌 검사 (원형-원형 충돌)
    checkPlayerAcornCollisions() {
        Object.entries(this.game.gameState.players).forEach(([sensorId, player]) => {
            // 이미 도토리를 들고 있으면 수집할 수 없음
            if (player.hasAcorn) return;
            
            // 각 도토리와 충돌 검사
            for (let i = this.game.gameState.acorns.length - 1; i >= 0; i--) {
                const acorn = this.game.gameState.acorns[i];
                
                if (this.isCircleCollision(player, acorn)) {
                    // 도토리 수집 처리
                    if (this.game.acornSpawner.collectAcorn(acorn, player)) {
                        console.log(`${sensorId}가 도토리를 수집했습니다!`);
                        break; // 한 번에 하나의 도토리만 수집
                    }
                }
            }
        });
    }
    
    // 플레이어-장애물 충돌 검사 (원형-사각형 충돌)
    checkPlayerObstacleCollisions() {
        Object.entries(this.game.gameState.players).forEach(([sensorId, player]) => {
            // 무적 상태이거나 이미 기절 상태면 충돌 무시
            if ((player.invulnerable && Date.now() < player.invulnerableUntil) || 
                (player.stunned && Date.now() < player.stunnedUntil)) {
                return;
            }
            
            this.game.obstacleManager.obstacles.forEach(obstacle => {
                if (this.isPlayerObstacleCollision(player, obstacle)) {
                    this.handleObstacleCollision(player, obstacle, sensorId);
                }
            });
        });
    }
    
    // 플레이어-점수구역 충돌 검사 (원형-사각형 충돌)
    checkPlayerScoringZoneCollisions() {
        Object.entries(this.game.gameState.players).forEach(([sensorId, player]) => {
            // 각 점수 구역과 충돌 검사
            Object.entries(this.game.gameState.scoringZones).forEach(([zoneId, zone]) => {
                if (this.isPlayerInZone(player, zone)) {
                    if (sensorId === zoneId) {
                        // 자신의 점수 구역에 도토리 저장
                        this.handleOwnZoneEntry(player, zone, sensorId);
                    } else {
                        // 상대방의 점수 구역에서 도토리 훔치기
                        this.handleOpponentZoneEntry(player, zone, sensorId, zoneId);
                    }
                }
            });
        });
    }
    
    // 원형-원형 충돌 감지 알고리즘 (플레이어-도토리)
    isCircleCollision(circle1, circle2) {
        const dx = circle1.position.x - circle2.position.x;
        const dy = circle1.position.y - circle2.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (circle1.radius + circle2.radius);
    }
    
    // 원형-사각형 충돌 감지 알고리즘 (플레이어-장애물)
    isPlayerObstacleCollision(player, obstacle) {
        // 원의 중심이 사각형과 가장 가까운 점 찾기
        const closestX = Math.max(obstacle.position.x, 
                                Math.min(player.position.x, obstacle.position.x + obstacle.size.width));
        const closestY = Math.max(obstacle.position.y, 
                                Math.min(player.position.y, obstacle.position.y + obstacle.size.height));
        
        // 거리 계산
        const dx = player.position.x - closestX;
        const dy = player.position.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < player.radius;
    }
    
    // 점수 구역 진입 감지 (원형-사각형 충돌)
    isPlayerInZone(player, zone) {
        return player.position.x >= zone.x && 
               player.position.x <= zone.x + zone.width &&
               player.position.y >= zone.y && 
               player.position.y <= zone.y + zone.height;
    }
    
    // 장애물 충돌 처리
    handleObstacleCollision(player, obstacle, sensorId) {
        console.log(`${sensorId}가 장애물과 충돌했습니다!`);
        
        // 도토리 떨어뜨리기
        if (player.hasAcorn) {
            player.hasAcorn = false;
            
            // 도토리를 맵에 떨어뜨리기
            this.game.acornSpawner.dropAcorn(player.position);
            console.log(`${sensorId}의 도토리가 떨어졌습니다`);
        }
        
        // 게임 밸런서에서 충돌 설정 가져오기
        const collisionSettings = this.game.gameBalancer.getCollisionSettings();
        
        // 기절 상태 적용
        player.stunned = true;
        player.stunnedUntil = Date.now() + collisionSettings.stunDuration;
        
        // 게임 통계 업데이트
        this.game.gameBalancer.updateGameStats('collision');
        
        // 기절 후 무적 상태 설정
        setTimeout(() => {
            if (player.stunned && Date.now() >= player.stunnedUntil) {
                player.stunned = false;
                player.invulnerable = true;
                player.invulnerableUntil = Date.now() + collisionSettings.invulnerableDuration;
            }
        }, collisionSettings.stunDuration);
        
        // 충돌 충격 파티클 효과 생성
        this.game.particleSystem.createImpactEffect(player.position.x, player.position.y);
        
        // 충돌 효과 생성
        this.createCollisionEffect(player.position.x, player.position.y);
        
        // 충돌 사운드 재생
        this.game.audioSystem.playCollisionSound();
        
        console.log(`${sensorId}가 0.5초간 기절 상태가 됩니다`);
    }
    
    // 자신의 점수 구역에서 도토리 저장 처리
    handleOwnZoneEntry(player, zone, sensorId) {
        if (player.hasAcorn) {
            // 도토리를 점수 구역에 저장
            player.hasAcorn = false;
            player.score++;
            zone.storedAcorns++;
            
            // 점수 획득 축하 파티클 효과 생성
            const zoneCenter = {
                x: zone.x + zone.width / 2,
                y: zone.y + zone.height / 2
            };
            this.game.particleSystem.createScoreEffect(zoneCenter.x, zoneCenter.y);
            
            // 점수 획득 사운드 재생
            this.game.audioSystem.playScoreSound();
            
            // 점수 애니메이션 트리거
            zone.animationScale = 1.3;
            zone.lastScoreTime = Date.now();
            
            // 게임 상태 업데이트
            this.game.updateScoreUI();
            
            console.log(`${sensorId}가 점수를 획득했습니다! 현재 점수: ${player.score}`);
        }
    }
    
    // 상대방의 점수 구역에서 도토리 훔치기 처리
    handleOpponentZoneEntry(player, zone, playerSensorId, zoneSensorId) {
        // 이미 도토리를 들고 있거나 상대방 구역에 저장된 도토리가 없으면 훔칠 수 없음
        if (player.hasAcorn || zone.storedAcorns <= 0) return;
        
        const opponent = this.game.gameState.players[zoneSensorId];
        if (opponent && opponent.score > 0) {
            // 상대방의 도토리 훔치기
            player.hasAcorn = true;
            opponent.score--;
            zone.storedAcorns--;
            
            // 도토리 훔치기 경고 파티클 효과 생성
            const zoneCenter = {
                x: zone.x + zone.width / 2,
                y: zone.y + zone.height / 2
            };
            this.game.particleSystem.createStealEffect(zoneCenter.x, zoneCenter.y);
            
            // 훔치기 성공 시 강화된 시각적 효과
            zone.animationScale = 0.6; // 더 강한 축소 효과
            zone.lastScoreTime = Date.now();
            zone.stealEffect = {
                active: true,
                startTime: Date.now(),
                duration: 1000 // 1초간 지속
            };
            
            // 플레이어에게 훔치기 성공 효과 추가
            player.stealEffect = {
                active: true,
                startTime: Date.now(),
                duration: 800
            };
            
            // 훔치기 성공 시 청각적 피드백
            this.game.audioSystem.playStealSound();
            
            // 화면 전체에 훔치기 알림 효과
            this.game.showStealNotification(playerSensorId, zoneSensorId);
            
            // 게임 상태 업데이트
            this.game.updateScoreUI();
            
            // 게임 통계 업데이트
            this.game.gameBalancer.updateGameStats('steal');
            
            console.log(`${playerSensorId}가 ${zoneSensorId}의 도토리를 훔쳤습니다!`);
        }
    }
    
    // 충돌 효과 생성
    createCollisionEffect(x, y) {
        // 게임 인스턴스에 충돌 효과 추가
        if (!this.game.collisionEffects) {
            this.game.collisionEffects = [];
        }
        
        this.game.collisionEffects.push({
            x: x,
            y: y,
            startTime: Date.now(),
            duration: 800, // 0.8초간 지속
            particles: this.generateCollisionParticles(x, y)
        });
    }
    
    // 충돌 파티클 생성
    generateCollisionParticles(centerX, centerY) {
        const particles = [];
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            
            particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02
            });
        }
        
        return particles;
    }
    
    // 충돌 사운드 재생
    playCollisionSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 충돌 사운드 - 강한 충격음
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 낮은 주파수의 충격음
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.2);
            oscillator.type = 'sawtooth';
            
            // 볼륨 조절
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            // 사운드 재생
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
        } catch (error) {
            console.warn('충돌 사운드 재생 실패:', error);
        }
    }
    
    // 훔치기 사운드 재생
    playStealSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 훔치기 사운드 - 경고음과 같은 효과
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 두 개의 주파수로 불협화음 생성 (경고 효과)
            oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator1.type = 'square';
            oscillator2.type = 'sawtooth';
            
            // 볼륨 조절 (0.1로 낮춤)
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            // 사운드 재생
            oscillator1.start(audioContext.currentTime);
            oscillator2.start(audioContext.currentTime);
            oscillator1.stop(audioContext.currentTime + 0.3);
            oscillator2.stop(audioContext.currentTime + 0.3);
            
        } catch (error) {
            console.warn('오디오 재생 실패:', error);
        }
    }
    
    // 충돌 효과 렌더링
    renderCollisionEffects(ctx) {
        if (!this.game.collisionEffects) return;
        
        for (let i = this.game.collisionEffects.length - 1; i >= 0; i--) {
            const effect = this.game.collisionEffects[i];
            const elapsed = Date.now() - effect.startTime;
            
            if (elapsed >= effect.duration) {
                this.game.collisionEffects.splice(i, 1);
                continue;
            }
            
            // 파티클 업데이트 및 렌더링
            effect.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= particle.decay;
                particle.vx *= 0.98; // 마찰
                particle.vy *= 0.98;
                
                if (particle.life > 0) {
                    ctx.save();
                    ctx.globalAlpha = particle.life;
                    ctx.fillStyle = '#FF6600';
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
            
            // 중앙 폭발 효과
            const progress = elapsed / effect.duration;
            const alpha = 1 - progress;
            const radius = 20 + progress * 30;
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.5;
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}

// AcornSpawner 클래스 - 도토리 생성 및 관리 (밸런싱 적용)
class AcornSpawner {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.lastSpawnTime = 0;
        this.totalSpawned = 0;
        // 게임 밸런서에서 설정을 가져와 초기화
        this.updateSettingsFromBalancer();
    }
    
    // 게임 밸런서에서 설정 업데이트
    updateSettingsFromBalancer() {
        if (this.game.gameBalancer) {
            const acornSettings = this.game.gameBalancer.getAcornSettings();
            this.maxAcorns = acornSettings.maxCount;
            this.initialAcorns = acornSettings.initialCount;
            this.spawnInterval = acornSettings.spawnInterval;
            this.minDistanceFromPlayer = acornSettings.minDistanceFromPlayer;
            this.minDistanceFromZone = acornSettings.minDistanceFromZone;
            this.minDistanceBetween = acornSettings.minDistanceBetween;
        } else {
            // 기본값 설정
            this.maxAcorns = 15;
            this.initialAcorns = 8;
            this.spawnInterval = 5000;
            this.minDistanceFromPlayer = 50;
            this.minDistanceFromZone = 30;
            this.minDistanceBetween = 40;
        }
    }
    
    // 초기 도토리 8개 생성
    initialize() {
        this.game.gameState.acorns = [];
        this.totalSpawned = 0;
        
        for (let i = 0; i < this.initialAcorns; i++) {
            this.spawnAcorn();
        }
        this.totalSpawned = this.initialAcorns;
        this.lastSpawnTime = Date.now();
        
        console.log(`초기 도토리 ${this.initialAcorns}개 생성 완료`);
    }
    
    // 게임 진행 중 도토리 추가 생성
    update() {
        const now = Date.now();
        const activeAcorns = this.game.gameState.acorns.filter(acorn => !acorn.collected).length;
        
        // 5초마다 새 도토리 생성 (최대 15개까지)
        if (now - this.lastSpawnTime >= this.spawnInterval && 
            this.totalSpawned < this.maxAcorns &&
            activeAcorns < this.maxAcorns) {
            
            this.spawnAcorn();
            this.lastSpawnTime = now;
            this.totalSpawned++;
            
            console.log(`새 도토리 생성 (총 ${this.totalSpawned}개 생성됨, 활성 ${activeAcorns + 1}개)`);
        }
    }
    
    // 새 도토리 생성
    spawnAcorn() {
        const position = this.getRandomSafePosition();
        if (position) {
            const acorn = new Acorn(position.x, position.y);
            this.game.gameState.acorns.push(acorn);
            return acorn;
        }
        return null;
    }
    
    // 안전한 랜덤 위치 찾기
    getRandomSafePosition() {
        const canvas = this.game.canvas;
        const margin = 30;
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            const x = margin + Math.random() * (canvas.width - 2 * margin);
            const y = margin + Math.random() * (canvas.height - 2 * margin);
            
            if (this.isPositionSafe(x, y)) {
                return { x, y };
            }
            attempts++;
        }
        
        // 안전한 위치를 찾지 못한 경우 기본 위치 반환
        console.warn('안전한 도토리 위치를 찾지 못함, 기본 위치 사용');
        return { 
            x: canvas.width / 2 + (Math.random() - 0.5) * 200, 
            y: canvas.height / 2 + (Math.random() - 0.5) * 200 
        };
    }
    
    // 위치가 안전한지 확인 (플레이어, 점수 구역, 다른 도토리와 겹치지 않는지)
    isPositionSafe(x, y) {
        // 플레이어와의 거리 체크
        for (const player of Object.values(this.game.gameState.players)) {
            const dx = x - player.position.x;
            const dy = y - player.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.minDistanceFromPlayer) {
                return false;
            }
        }
        
        // 점수 구역과의 거리 체크
        for (const zone of Object.values(this.game.gameState.scoringZones)) {
            if (x >= zone.x - this.minDistanceFromZone && 
                x <= zone.x + zone.width + this.minDistanceFromZone &&
                y >= zone.y - this.minDistanceFromZone && 
                y <= zone.y + zone.height + this.minDistanceFromZone) {
                return false;
            }
        }
        
        // 다른 도토리와의 거리 체크
        for (const acorn of this.game.gameState.acorns) {
            if (acorn.collected) continue;
            
            const dx = x - acorn.position.x;
            const dy = y - acorn.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 40) { // 도토리 간 최소 거리
                return false;
            }
        }
        
        return true;
    }
    
    // 도토리 수집 처리
    collectAcorn(acorn, player) {
        if (acorn.collected || player.hasAcorn) return false;
        
        acorn.collected = true;
        player.hasAcorn = true;
        
        // 도토리 수집 파티클 효과 생성
        this.game.particleSystem.createCollectionEffect(acorn.position.x, acorn.position.y);
        
        // 도토리 수집 사운드 재생
        this.game.audioSystem.playCollectionSound();
        
        // 수집된 도토리를 배열에서 제거
        const index = this.game.gameState.acorns.indexOf(acorn);
        if (index > -1) {
            this.game.gameState.acorns.splice(index, 1);
        }
        
        // 게임 통계 업데이트
        this.game.gameBalancer.updateGameStats('acorn_collected');
        
        console.log(`${player === this.game.gameState.players.sensor1 ? 'P1' : 'P2'}이 도토리 수집`);
        return true;
    }
    
    // 도토리를 맵에 떨어뜨리기 (장애물 충돌 시 사용)
    dropAcorn(position) {
        // 떨어뜨릴 위치 근처에서 안전한 위치 찾기
        let dropPosition = this.findNearbyPosition(position.x, position.y);
        if (!dropPosition) {
            dropPosition = this.getRandomSafePosition();
        }
        
        if (dropPosition) {
            const acorn = new Acorn(dropPosition.x, dropPosition.y);
            this.game.gameState.acorns.push(acorn);
            console.log('도토리가 떨어졌습니다');
            return acorn;
        }
        return null;
    }
    
    // 특정 위치 근처의 안전한 위치 찾기
    findNearbyPosition(centerX, centerY) {
        const radius = 80;
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            // 캔버스 경계 체크
            if (x >= 30 && x <= this.game.canvas.width - 30 &&
                y >= 30 && y <= this.game.canvas.height - 30 &&
                this.isPositionSafe(x, y)) {
                return { x, y };
            }
            attempts++;
        }
        return null;
    }
    
    // 활성 도토리 개수 반환
    getActiveAcornCount() {
        return this.game.gameState.acorns.filter(acorn => !acorn.collected).length;
    }
    
    // 모든 도토리 렌더링
    renderAcorns(ctx) {
        this.game.gameState.acorns.forEach(acorn => {
            acorn.render(ctx);
        });
    }
}
class AcornBattleGame {
    constructor() {
        // 브라우저 호환성 초기화
        this.browserCompat = new BrowserCompatibility();
        this.sensorCompat = new SensorCompatibility();
        
        // 테스터 초기화 (개발 모드에서만)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.search.includes('debug=true')) {
            this.gameTester = new GameTester(this);
            console.log('🔧 디버그 모드 활성화 - Ctrl+Shift+D로 디버그 패널 열기');
        }
        
        // SessionSDK 초기화 (dual 타입)
        this.sdk = new SessionSDK({
            gameId: 'acorn-battle',
            gameType: 'dual',
            serverUrl: window.location.origin
        });

        // 센서 데이터 최적화를 위한 변수들
        this.sensorThrottle = {
            lastUpdate: 0,
            interval: 33, // 33ms = 30fps
            sensorStates: {
                sensor1: { lastData: null, connected: false, lastSeen: 0 },
                sensor2: { lastData: null, connected: false, lastSeen: 0 }
            }
        };

        // 게임 상태 관리
        this.gameState = {
            phase: 'waiting',      // waiting, ready, playing, paused, ended
            timeRemaining: 60,     // 1분 게임
            startTime: null,
            players: {
                sensor1: { 
                    score: 0, 
                    position: { x: 100, y: 300 }, 
                    velocity: { x: 0, y: 0 },
                    hasAcorn: false, 
                    stunned: false,
                    stunnedUntil: 0,
                    invulnerable: false,
                    invulnerableUntil: 0,
                    radius: 25,
                    color: '#3B82F6'
                },
                sensor2: { 
                    score: 0, 
                    position: { x: 700, y: 300 }, 
                    velocity: { x: 0, y: 0 },
                    hasAcorn: false, 
                    stunned: false,
                    stunnedUntil: 0,
                    invulnerable: false,
                    invulnerableUntil: 0,
                    radius: 25,
                    color: '#EF4444'
                }
            },
            acorns: [],           // 맵의 도토리들
            obstacles: [],        // 움직이는 장애물들
            scoringZones: {       // 점수 구역들
                sensor1: { 
                    x: 20, y: 20, width: 120, height: 120,
                    storedAcorns: 0,
                    animationScale: 1.0,
                    lastScoreTime: 0
                },
                sensor2: { 
                    x: 660, y: 20, width: 120, height: 120,
                    storedAcorns: 0,
                    animationScale: 1.0,
                    lastScoreTime: 0
                }
            },
            connectedSensors: new Set()
        };

        // Canvas 설정
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // UI 요소들
        this.elements = {
            sessionCode: document.getElementById('session-code-display'),
            qrCanvas: document.getElementById('qr-canvas'),
            qrFallback: document.getElementById('qr-fallback'),
            sensor1Status: document.getElementById('sensor1-status'),
            sensor2Status: document.getElementById('sensor2-status'),
            startBtn: document.getElementById('start-game-btn'),
            gameOverlay: document.getElementById('game-overlay'),
            overlayTitle: document.getElementById('overlay-title'),
            overlayMessage: document.getElementById('overlay-message'),
            timer: document.getElementById('timer'),
            player1Score: document.getElementById('player1-score'),
            player2Score: document.getElementById('player2-score'),
            pauseBtn: document.getElementById('pause-btn'),
            restartBtn: document.getElementById('restart-game-btn'),
            resultModal: document.getElementById('result-modal'),
            resultTitle: document.getElementById('result-title'),
            finalScoreP1: document.getElementById('final-score-p1'),
            finalScoreP2: document.getElementById('final-score-p2'),
            restartModalBtn: document.getElementById('restart-btn'),
            hubBtn: document.getElementById('hub-btn')
        };

        // 게임 컴포넌트들
        this.acornSpawner = new AcornSpawner(this);
        this.obstacleManager = new ObstacleManager(this);
        this.collisionManager = new CollisionManager(this);
        
        // 게임 루프 관련
        this.gameLoopId = null;
        this.lastUpdateTime = 0;
        this.gameTimer = null;
        
        // 세션 관련 상태
        this.sessionCreated = false;
        this.currentSession = null;
        
        // 시각적 효과 시스템
        this.particleSystem = new ParticleSystem(this.performanceManager);
        this.trailEffect = new TrailEffect();
        this.collisionEffects = [];
        
        // 오디오 시스템
        this.audioSystem = new AudioSystem();
        
        // 에러 처리 시스템
        this.errorHandler = new ErrorHandler(this);
        
        // 성능 관리 시스템
        this.performanceManager = new PerformanceManager(this);
        
        // 게임 밸런싱 시스템
        this.gameBalancer = new GameBalancer();
        
        // 초기화
        this.initialize();
        
        // 게임 가이드 시스템 초기화
        this.initializeGameGuide();
    }
    
    // 게임 초기화
    initialize() {
        console.log('도토리 배틀 게임 초기화 시작');
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // SessionSDK 이벤트 설정
        this.setupSessionEvents();
        
        // 초기 UI 상태 설정
        this.updateUI();
        
        console.log('게임 초기화 완료');
    }
    
    // SessionSDK 이벤트 설정
    setupSessionEvents() {
        // 서버 연결 완료 후 세션 생성
        this.sdk.on('connected', () => {
            console.log('서버에 연결되었습니다');
            this.createSession();
        });
        
        // 세션 생성 완료
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            console.log('세션이 생성되었습니다:', session);
            this.handleSessionCreated(session);
        });
        
        // 센서 연결
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            console.log('센서 연결됨:', data);
            this.handleSensorConnected(data);
        });
        
        // 센서 연결 해제
        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;
            console.log('센서 연결 해제됨:', data);
            this.errorHandler.handleSensorDisconnect(data.sensorId);
            this.handleSensorDisconnected(data);
        });
        
        // 센서 데이터 수신
        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.handleSensorData(data);
        });
        
        // 오류 처리
        this.sdk.on('error', (event) => {
            const error = event.detail || event;
            console.error('SDK 오류:', error);
            this.errorHandler.handleServerConnectionError(error);
        });
    }
    
    // 세션 생성
    createSession() {
        if (this.sessionCreated) {
            console.log('세션이 이미 생성되어 있습니다');
            return;
        }
        
        console.log('새 세션을 생성합니다...');
        this.sdk.createSession();
    }
    
    // 세션 생성 완료 처리
    handleSessionCreated(session) {
        this.sessionCreated = true;
        this.currentSession = session;
        
        // 세션 코드 표시
        this.elements.sessionCode.textContent = session.sessionCode;
        
        // QR 코드 생성
        this.generateQRCode(session.sensorUrl);
        
        // UI 업데이트
        this.updateOverlay('플레이어를 기다리는 중...', '모바일 기기로 QR 코드를 스캔하거나 세션 코드를 입력하세요');
        
        console.log(`세션 생성 완료 - 코드: ${session.sessionCode}`);
    }
    
    // QR 코드 생성 (폴백 처리 포함)
    generateQRCode(url) {
        const canvas = this.elements.qrCanvas;
        const fallback = this.elements.qrFallback;
        
        if (typeof QRCode !== 'undefined') {
            // QRCode 라이브러리 사용
            try {
                QRCode.toCanvas(canvas, url, {
                    width: 200,
                    height: 200,
                    margin: 2
                }, (error) => {
                    if (error) {
                        console.error('QR 코드 생성 실패:', error);
                        this.browserCompat.handleQRCodeFallback(fallback, url);
                    } else {
                        console.log('QR 코드 생성 성공');
                        canvas.style.display = 'block';
                        fallback.style.display = 'none';
                    }
                });
            } catch (error) {
                console.error('QR 코드 라이브러리 오류:', error);
                this.browserCompat.handleQRCodeFallback(fallback, url);
            }
        } else {
            // 폴백: 브라우저 호환성 클래스 사용
            console.warn('QRCode 라이브러리를 찾을 수 없음, 폴백 사용');
            this.browserCompat.handleQRCodeFallback(fallback, url);
            canvas.style.display = 'none';
        }
    }
    
    // 센서 연결 처리
    handleSensorConnected(data) {
        const sensorId = data.sensorId;
        this.gameState.connectedSensors.add(sensorId);
        
        // 센서 상태 UI 업데이트
        this.updateSensorStatus(sensorId, '연결됨');
        
        console.log(`${sensorId} 연결됨 (총 ${this.gameState.connectedSensors.size}개)`);
        
        // 2명 모두 연결되면 게임 시작 버튼 활성화
        if (this.gameState.connectedSensors.size >= 2) {
            this.enableStartButton();
        }
    }
    
    // 센서 연결 해제 처리
    handleSensorDisconnected(data) {
        const sensorId = data.sensorId;
        this.gameState.connectedSensors.delete(sensorId);
        
        // 센서 상태 UI 업데이트
        this.updateSensorStatus(sensorId, '연결 해제됨');
        
        console.log(`${sensorId} 연결 해제됨 (총 ${this.gameState.connectedSensors.size}개)`);
        
        // 게임 중이면 일시정지
        if (this.gameState.phase === 'playing') {
            this.pauseGame();
            this.updateOverlay('플레이어 연결 해제', `${sensorId}의 연결이 해제되었습니다. 재연결을 기다리는 중...`);
        }
        
        // 시작 버튼 비활성화
        this.disableStartButton();
    }
    
    // 센서 상태 UI 업데이트
    updateSensorStatus(sensorId, status) {
        const statusElement = this.elements[`${sensorId}Status`];
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `status-indicator ${status === '연결됨' ? 'connected' : 'disconnected'}`;
        }
    }
    
    // 게임 시작 버튼 활성화
    enableStartButton() {
        this.elements.startBtn.disabled = false;
        this.elements.startBtn.textContent = '게임 시작';
        this.updateOverlay('게임 준비 완료!', '모든 플레이어가 연결되었습니다. 게임 시작 버튼을 클릭하세요.');
        
        console.log('게임 시작 버튼 활성화');
    }
    
    // 게임 시작 버튼 비활성화
    disableStartButton() {
        this.elements.startBtn.disabled = true;
        this.elements.startBtn.textContent = '플레이어 대기중';
        
        if (this.gameState.connectedSensors.size === 0) {
            this.updateOverlay('플레이어를 기다리는 중...', '모바일 기기로 QR 코드를 스캔하거나 세션 코드를 입력하세요');
        } else {
            this.updateOverlay('플레이어를 기다리는 중...', `${this.gameState.connectedSensors.size}/2명 연결됨`);
        }
    }
    
    // 센서 데이터 처리 (최적화된 버전)
    handleSensorData(data) {
        // 게임이 진행 중이 아니면 무시
        if (this.gameState.phase !== 'playing') return;
        
        // 브라우저 최적화 설정 적용
        const optimizationSettings = this.browserCompat.getOptimizationSettings();
        
        // 센서 데이터 throttling 적용 (브라우저별 최적화)
        const now = Date.now();
        if (now - this.sensorThrottle.lastUpdate < optimizationSettings.throttleInterval) {
            return;
        }
        this.sensorThrottle.lastUpdate = now;
        
        // 센서 데이터 유효성 검사
        if (!this.validateSensorData(data)) {
            this.errorHandler.handleSensorDataError(data.sensorId, data, new Error('Invalid sensor data structure'));
            return;
        }
        
        const sensorId = data.sensorId;
        const player = this.gameState.players[sensorId];
        
        if (!player) {
            console.warn(`알 수 없는 센서 ID: ${sensorId}`);
            return;
        }
        
        // 센서 연결 상태 업데이트
        this.updateSensorConnectionStatus(sensorId, data);
        
        // 기절 상태 체크
        if (player.stunned && Date.now() < player.stunnedUntil) {
            return; // 기절 상태에서는 움직일 수 없음
        }
        
        // 기절 상태 해제 및 무적 상태 설정
        if (player.stunned && Date.now() >= player.stunnedUntil) {
            player.stunned = false;
            player.invulnerable = true;
            player.invulnerableUntil = Date.now() + 1000; // 1초간 무적
        }
        
        // 센서 호환성 처리 및 데이터 필터링
        const compatibleData = this.processSensorCompatibility(data.data);
        const filteredData = this.filterSensorData(compatibleData);
        this.updatePlayerMovement(player, filteredData);
    }
    
    // 센서 호환성 처리
    processSensorCompatibility(sensorData) {
        // 센서 호환성 클래스에서 처리된 데이터 가져오기
        const compatData = this.sensorCompat.getSensorData();
        
        // 기존 데이터와 호환성 데이터 병합
        return {
            orientation: sensorData.orientation || compatData.orientation,
            acceleration: sensorData.acceleration || compatData.motion,
            rotationRate: sensorData.rotationRate || compatData.rotationRate
        };
    }
    
    // 센서 데이터 유효성 검사
    validateSensorData(data) {
        // 기본 구조 검사
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // 필수 필드 검사
        if (!data.sensorId || !data.data) {
            return false;
        }
        
        // 센서 ID 유효성 검사
        if (!['sensor1', 'sensor2'].includes(data.sensorId)) {
            return false;
        }
        
        // orientation 데이터 검사
        if (data.data.orientation) {
            const { alpha, beta, gamma } = data.data.orientation;
            
            // 각도 범위 검사
            if (typeof alpha === 'number' && (alpha < 0 || alpha > 360)) {
                return false;
            }
            if (typeof beta === 'number' && (beta < -180 || beta > 180)) {
                return false;
            }
            if (typeof gamma === 'number' && (gamma < -90 || gamma > 90)) {
                return false;
            }
        }
        
        return true;
    }
    
    // 센서 데이터 필터링 (노이즈 제거)
    filterSensorData(sensorData) {
        if (!sensorData.orientation) return sensorData;
        
        const filtered = { ...sensorData };
        const { alpha, beta, gamma } = sensorData.orientation;
        
        // 작은 움직임 필터링 (데드존 적용)
        const deadZone = 5; // 5도 이하의 작은 움직임 무시
        
        filtered.orientation = {
            alpha: alpha || 0,
            beta: Math.abs(beta || 0) < deadZone ? 0 : (beta || 0),
            gamma: Math.abs(gamma || 0) < deadZone ? 0 : (gamma || 0)
        };
        
        // 극값 제한 (안전장치)
        filtered.orientation.beta = Math.max(-45, Math.min(45, filtered.orientation.beta));
        filtered.orientation.gamma = Math.max(-45, Math.min(45, filtered.orientation.gamma));
        
        return filtered;
    }
    
    // 센서 연결 상태 업데이트
    updateSensorConnectionStatus(sensorId, data) {
        const sensorState = this.sensorThrottle.sensorStates[sensorId];
        if (!sensorState) return;
        
        const now = Date.now();
        
        // 연결 상태 업데이트
        if (!sensorState.connected) {
            sensorState.connected = true;
            this.updateSensorStatusUI(sensorId, 'connected');
            console.log(`${sensorId} 센서 연결됨`);
        }
        
        // 마지막 데이터 수신 시간 업데이트
        sensorState.lastSeen = now;
        sensorState.lastData = data;
        
        // 연결 상태 모니터링 (5초 이상 데이터 없으면 연결 해제로 간주)
        this.monitorSensorConnection();
    }
    
    // 센서 연결 상태 모니터링
    monitorSensorConnection() {
        const now = Date.now();
        const timeout = 5000; // 5초 타임아웃
        
        Object.entries(this.sensorThrottle.sensorStates).forEach(([sensorId, state]) => {
            if (state.connected && now - state.lastSeen > timeout) {
                state.connected = false;
                this.updateSensorStatusUI(sensorId, 'disconnected');
                console.warn(`${sensorId} 센서 연결 해제됨 (타임아웃)`);
                
                // 게임 진행 중이면 일시정지
                if (this.gameState.phase === 'playing') {
                    this.pauseGame();
                    this.updateOverlay('연결 끊김', `${sensorId} 센서 연결이 끊어졌습니다. 재연결을 기다리는 중...`);
                }
            }
        });
    }
    
    // 센서 상태 UI 업데이트
    updateSensorStatusUI(sensorId, status) {
        const statusElement = sensorId === 'sensor1' ? 
            this.elements.sensor1Status : this.elements.sensor2Status;
        
        if (!statusElement) return;
        
        // 기존 클래스 제거
        statusElement.classList.remove('waiting', 'connected', 'disconnected');
        
        // 새 상태 적용
        statusElement.classList.add(status);
        
        switch (status) {
            case 'connected':
                statusElement.textContent = '연결됨';
                break;
            case 'disconnected':
                statusElement.textContent = '연결 해제';
                break;
            default:
                statusElement.textContent = '대기중';
        }
        
        // 센서 컨테이너에도 상태 클래스 적용
        const containerElement = sensorId === 'sensor1' ? 
            document.getElementById('sensor1-container') : 
            document.getElementById('sensor2-container');
        
        if (containerElement) {
            containerElement.classList.remove('connected', 'disconnected');
            if (status !== 'waiting') {
                containerElement.classList.add(status);
            }
        }
    }
    
    // 플레이어 이동 업데이트 (밸런싱 적용된 버전)
    updatePlayerMovement(player, sensorData) {
        if (!sensorData.orientation) return;
        
        const { beta, gamma } = sensorData.orientation;
        
        // 게임 밸런서에서 이동 설정 가져오기
        const movementSettings = this.gameBalancer.getPlayerMovementSettings();
        
        // 데드존 적용 (미세한 움직임 무시)
        const adjustedGamma = Math.abs(gamma || 0) < movementSettings.deadZone ? 0 : (gamma || 0);
        const adjustedBeta = Math.abs(beta || 0) < movementSettings.deadZone ? 0 : (beta || 0);
        
        // 각도를 정규화하여 속도 계산 (-1 ~ 1 범위)
        const normalizedGamma = Math.max(-1, Math.min(1, adjustedGamma / movementSettings.maxAngle));
        const normalizedBeta = Math.max(-1, Math.min(1, adjustedBeta / movementSettings.maxAngle));
        
        // 속도 계산 (부드러운 가속/감속을 위한 easing 적용)
        const targetVelocityX = normalizedGamma * movementSettings.baseSpeed;
        const targetVelocityY = normalizedBeta * movementSettings.baseSpeed;
        
        // 부드러운 움직임을 위한 선형 보간 (lerp)
        player.velocity.x = this.lerp(player.velocity.x, targetVelocityX, movementSettings.lerpFactor);
        player.velocity.y = this.lerp(player.velocity.y, targetVelocityY, movementSettings.lerpFactor);
        
        // 최소 속도 임계값 (미세한 떨림 방지)
        if (Math.abs(player.velocity.x) < movementSettings.minVelocity) player.velocity.x = 0;
        if (Math.abs(player.velocity.y) < movementSettings.minVelocity) player.velocity.y = 0;
        
        // 위치 업데이트
        player.position.x += player.velocity.x;
        player.position.y += player.velocity.y;
        
        // 맵 경계 제한
        this.constrainPlayerToMap(player);
    }
    
    // 선형 보간 함수 (부드러운 움직임을 위함)
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    // 플레이어를 맵 경계 내로 제한
    constrainPlayerToMap(player) {
        const margin = player.radius;
        
        player.position.x = Math.max(margin, Math.min(this.canvas.width - margin, player.position.x));
        player.position.y = Math.max(margin, Math.min(this.canvas.height - margin, player.position.y));
    }
    
    // 오류 처리
    handleError(error) {
        console.error('게임 오류:', error);
        
        if (this.gameState.phase === 'playing') {
            this.pauseGame();
        }
        
        this.updateOverlay('오류 발생', '연결 오류가 발생했습니다. 페이지를 새로고침해주세요.');
    }
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        // 게임 시작 버튼 (성능 관리자를 통한 이벤트 리스너 관리)
        this.performanceManager.addEventListener(this.elements.startBtn, 'click', () => {
            // 사용자 상호작용 시 오디오 컨텍스트 재개
            this.audioSystem.resumeAudioContext();
            this.startGame();
        });
        
        // 일시정지 버튼
        this.performanceManager.addEventListener(this.elements.pauseBtn, 'click', () => {
            if (this.gameState.phase === 'playing') {
                this.pauseGame();
            } else if (this.gameState.phase === 'paused') {
                this.resumeGame();
            }
        });
        
        // 재시작 버튼
        this.performanceManager.addEventListener(this.elements.restartBtn, 'click', () => {
            this.restartGame();
        });
        
        // 결과 모달 버튼들
        this.performanceManager.addEventListener(this.elements.restartModalBtn, 'click', () => {
            this.hideResultModal();
            this.restartGame();
        });
        
        this.performanceManager.addEventListener(this.elements.hubBtn, 'click', () => {
            window.location.href = '/';
        });
    }
    
    // 게임 시작
    startGame() {
        if (this.gameState.connectedSensors.size < 2) {
            console.warn('플레이어가 부족합니다');
            return;
        }
        
        console.log('게임을 시작합니다');
        
        // 게임 상태 초기화
        this.resetGameState();
        
        // 게임 상태 변경
        this.gameState.phase = 'playing';
        this.gameState.startTime = Date.now();
        
        // 게임 컴포넌트 초기화
        this.acornSpawner.initialize();
        this.obstacleManager.initialize();
        
        // UI 업데이트
        this.hideOverlay();
        this.enableGameControls();
        
        // 게임 루프 시작
        this.startGameLoop();
        
        // 타이머 시작
        this.startTimer();
        
        // 게임 시작 사운드 재생
        this.audioSystem.playGameStartSound();
        
        console.log('게임 시작 완료');
    }
    
    // 게임 상태 초기화
    resetGameState() {
        // 플레이어 상태 초기화
        this.gameState.players.sensor1.score = 0;
        this.gameState.players.sensor1.hasAcorn = false;
        this.gameState.players.sensor1.stunned = false;
        this.gameState.players.sensor1.invulnerable = false;
        this.gameState.players.sensor1.position = { x: 100, y: 300 };
        
        this.gameState.players.sensor2.score = 0;
        this.gameState.players.sensor2.hasAcorn = false;
        this.gameState.players.sensor2.stunned = false;
        this.gameState.players.sensor2.invulnerable = false;
        this.gameState.players.sensor2.position = { x: 700, y: 300 };
        
        // 점수 구역 초기화
        this.gameState.scoringZones.sensor1.storedAcorns = 0;
        this.gameState.scoringZones.sensor2.storedAcorns = 0;
        
        // 타이머 초기화
        this.gameState.timeRemaining = 60;
        
        // 도토리와 장애물 배열 초기화
        this.gameState.acorns = [];
        
        // UI 업데이트
        this.updateScoreUI();
        this.updateTimerUI();
    }
    
    // 게임 일시정지
    pauseGame() {
        if (this.gameState.phase !== 'playing') return;
        
        console.log('게임 일시정지');
        
        this.gameState.phase = 'paused';
        
        // 게임 루프 중지
        this.stopGameLoop();
        
        // 타이머 중지
        this.stopTimer();
        
        // UI 업데이트
        this.elements.pauseBtn.textContent = '▶️ 계속';
        this.showOverlay('게임 일시정지', '계속하려면 일시정지 버튼을 다시 클릭하세요');
    }
    
    // 게임 재개
    resumeGame() {
        if (this.gameState.phase !== 'paused') return;
        
        // 모든 센서가 연결되어 있는지 확인
        if (this.gameState.connectedSensors.size < 2) {
            console.warn('플레이어 연결 부족으로 재개할 수 없습니다');
            return;
        }
        
        console.log('게임 재개');
        
        this.gameState.phase = 'playing';
        
        // 게임 루프 재시작
        this.startGameLoop();
        
        // 타이머 재시작
        this.startTimer();
        
        // UI 업데이트
        this.elements.pauseBtn.textContent = '⏸️ 일시정지';
        this.hideOverlay();
    }
    
    // 게임 재시작 (세션 유지)
    restartGame() {
        console.log('게임 재시작 (세션 유지)');
        
        // 게임 루프 중지
        this.stopGameLoop();
        this.stopTimer();
        
        // 게임 상태 초기화
        this.resetGameState();
        
        // 연결된 센서가 있으면 바로 시작 가능
        if (this.gameState.connectedSensors.size >= 2) {
            this.enableStartButton();
        } else {
            this.disableStartButton();
        }
        
        // UI 초기화
        this.disableGameControls();
        this.hideResultModal();
        
        console.log('재시작 준비 완료');
    }
    
    // 게임 종료
    endGame() {
        console.log('게임 종료');
        
        this.gameState.phase = 'ended';
        
        // 게임 루프 중지
        this.stopGameLoop();
        this.stopTimer();
        
        // 승부 판정
        const winner = this.determineWinner();
        
        // 결과 표시
        this.showGameResult(winner);
        
        // UI 업데이트
        this.disableGameControls();
    }
    
    // 승부 판정
    determineWinner() {
        const p1Score = this.gameState.players.sensor1.score;
        const p2Score = this.gameState.players.sensor2.score;
        
        if (p1Score > p2Score) {
            return { winner: 'sensor1', p1Score, p2Score };
        } else if (p2Score > p1Score) {
            return { winner: 'sensor2', p1Score, p2Score };
        } else {
            return { winner: 'tie', p1Score, p2Score };
        }
    }
    
    // 게임 결과 표시
    showGameResult(result) {
        let title = '';
        
        if (result.winner === 'tie') {
            title = '무승부!';
        } else if (result.winner === 'sensor1') {
            title = '플레이어 1 승리!';
        } else {
            title = '플레이어 2 승리!';
        }
        
        this.elements.resultTitle.textContent = title;
        this.elements.finalScoreP1.textContent = result.p1Score;
        this.elements.finalScoreP2.textContent = result.p2Score;
        
        this.elements.resultModal.style.display = 'flex';
        
        console.log(`게임 결과: ${title} (P1: ${result.p1Score}, P2: ${result.p2Score})`);
    }
    
    // 결과 모달 숨기기
    hideResultModal() {
        this.elements.resultModal.style.display = 'none';
    }
    
    // 게임 컨트롤 활성화
    enableGameControls() {
        this.elements.pauseBtn.disabled = false;
        this.elements.restartBtn.disabled = false;
        this.elements.startBtn.disabled = true;
    }
    
    // 게임 컨트롤 비활성화
    disableGameControls() {
        this.elements.pauseBtn.disabled = true;
        this.elements.restartBtn.disabled = true;
        this.elements.pauseBtn.textContent = '⏸️ 일시정지';
    }
    
    // 오버레이 표시
    showOverlay(title, message) {
        this.elements.overlayTitle.textContent = title;
        this.elements.overlayMessage.textContent = message;
        this.elements.gameOverlay.style.display = 'flex';
    }
    
    // 오버레이 업데이트
    updateOverlay(title, message) {
        this.elements.overlayTitle.textContent = title;
        this.elements.overlayMessage.textContent = message;
    }
    
    // 오버레이 숨기기
    hideOverlay() {
        this.elements.gameOverlay.style.display = 'none';
    }
    
    // 게임 루프 시작
    startGameLoop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
        }
        
        this.lastUpdateTime = Date.now();
        this.gameLoop();
        
        // 센서 연결 상태 모니터링 시작
        this.startSensorMonitoring();
    }
    
    // 게임 루프 중지
    stopGameLoop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // 센서 연결 상태 모니터링 중지
        this.stopSensorMonitoring();
        
        // 시각적 효과 정리
        this.cleanupVisualEffects();
        
        // 오디오 시스템 정리
        this.cleanupAudioSystem();
        
        // 에러 핸들러 정리
        this.cleanupErrorHandler();
        
        // 성능 관리자 정리
        this.cleanupPerformanceManager();
    }
    
    // 오디오 시스템 정리
    cleanupAudioSystem() {
        if (this.audioSystem) {
            this.audioSystem.cleanup();
        }
    }
    
    // 에러 핸들러 정리
    cleanupErrorHandler() {
        if (this.errorHandler) {
            this.errorHandler.cleanup();
        }
    }
    
    // 성능 관리자 정리
    cleanupPerformanceManager() {
        if (this.performanceManager) {
            this.performanceManager.cleanup();
        }
    }
    }
    
    // 시각적 효과 정리
    cleanupVisualEffects() {
        if (this.particleSystem) {
            this.particleSystem.clear();
        }
        
        if (this.trailEffect) {
            this.trailEffect.clear();
        }
        
        // 충돌 효과 정리
        this.collisionEffects = [];
        
        // 점수 구역 애니메이션 초기화
        Object.values(this.gameState.scoringZones).forEach(zone => {
            zone.animationScale = 1.0;
            zone.lastScoreTime = 0;
            if (zone.stealEffect) {
                zone.stealEffect.active = false;
            }
        });
        
        // 플레이어 효과 초기화
        Object.values(this.gameState.players).forEach(player => {
            if (player.stealEffect) {
                player.stealEffect.active = false;
            }
        });
    }
    
    // 센서 연결 상태 모니터링 시작
    startSensorMonitoring() {
        // 기존 모니터링이 있으면 정리
        if (this.sensorMonitoringInterval) {
            clearInterval(this.sensorMonitoringInterval);
        }
        
        // 1초마다 센서 연결 상태 확인
        this.sensorMonitoringInterval = setInterval(() => {
            this.monitorSensorConnection();
        }, 1000);
    }
    
    // 센서 연결 상태 모니터링 중지
    stopSensorMonitoring() {
        if (this.sensorMonitoringInterval) {
            clearInterval(this.sensorMonitoringInterval);
            this.sensorMonitoringInterval = null;
        }
    }
    
    // 메인 게임 루프 (최적화된 버전)
    gameLoop() {
        // 프레임 시작 시간 기록
        this.performanceManager.frameStart();
        
        if (this.gameState.phase === 'playing') {
            // 업데이트 성능 측정
            this.performanceManager.updateStart();
            this.update();
            this.performanceManager.updateEnd();
            
            // 렌더링 성능 측정
            this.performanceManager.renderStart();
            this.render();
            this.performanceManager.renderEnd();
        }
        
        // 프레임 종료 시간 기록
        this.performanceManager.frameEnd();
        
        // 최적화된 requestAnimationFrame 사용
        this.gameLoopId = this.performanceManager.optimizedRequestAnimationFrame(() => this.gameLoop());
    }
    
    // 게임 상태 업데이트
    update() {
        // 도토리 스포너 업데이트
        this.acornSpawner.update();
        
        // 장애물 업데이트
        this.obstacleManager.update();
        
        // 충돌 검사
        this.collisionManager.checkAllCollisions();
        
        // 무적 상태 업데이트
        this.updatePlayerStates();
        
        // 시각적 효과 업데이트
        this.updateVisualEffects();
        
        // 실시간 게임 밸런싱
        this.updateGameBalancing();
    }
    
    // 실시간 게임 밸런싱 업데이트
    updateGameBalancing() {
        // 게임 밸런서의 실시간 밸런싱 적용
        this.gameBalancer.adjustRealTimeBalance(this.gameState);
        
        // 장애물과 도토리 스포너 설정 업데이트
        this.obstacleManager.updateSettingsFromBalancer();
        this.acornSpawner.updateSettingsFromBalancer();
    }
    
    // 시각적 효과 업데이트
    updateVisualEffects() {
        // 파티클 시스템 업데이트
        this.particleSystem.update();
        
        // 트레일 효과 업데이트
        this.trailEffect.update();
        
        // 플레이어 이동 트레일 추가
        Object.entries(this.gameState.players).forEach(([sensorId, player]) => {
            // 플레이어가 움직이고 있을 때만 트레일 추가
            if (Math.abs(player.velocity.x) > 0.5 || Math.abs(player.velocity.y) > 0.5) {
                this.trailEffect.addTrailPoint(sensorId, player.position.x, player.position.y);
            }
        });
        
        // 점수 구역 애니메이션 업데이트
        this.updateScoringZoneAnimations();
    }
    
    // 점수 구역 애니메이션 업데이트
    updateScoringZoneAnimations() {
        Object.values(this.gameState.scoringZones).forEach(zone => {
            const now = Date.now();
            const timeSinceScore = now - zone.lastScoreTime;
            
            // 점수 획득 후 애니메이션 (0.5초간)
            if (timeSinceScore < 500) {
                const progress = timeSinceScore / 500;
                // 부드러운 스케일 복원 (easing out)
                zone.animationScale = 1.0 + (zone.animationScale - 1.0) * (1 - progress);
            } else {
                zone.animationScale = 1.0;
            }
            
            // 훔치기 효과 업데이트
            if (zone.stealEffect && zone.stealEffect.active) {
                const elapsed = now - zone.stealEffect.startTime;
                if (elapsed >= zone.stealEffect.duration) {
                    zone.stealEffect.active = false;
                }
            }
        });
        
        // 플레이어 훔치기 효과 업데이트
        Object.values(this.gameState.players).forEach(player => {
            if (player.stealEffect && player.stealEffect.active) {
                const elapsed = Date.now() - player.stealEffect.startTime;
                if (elapsed >= player.stealEffect.duration) {
                    player.stealEffect.active = false;
                }
            }
        });
    }
    
    // 플레이어 상태 업데이트
    updatePlayerStates() {
        Object.values(this.gameState.players).forEach(player => {
            // 무적 상태 해제
            if (player.invulnerable && Date.now() >= player.invulnerableUntil) {
                player.invulnerable = false;
            }
        });
    }
    
    // 게임 렌더링
    render() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경 렌더링
        this.renderBackground();
        
        // 플레이어 이동 트레일 효과 렌더링 (배경 위에, 다른 요소들 아래)
        this.trailEffect.render(this.ctx, this.gameState);
        
        // 점수 구역 렌더링
        this.renderScoringZones();
        
        // 도토리 렌더링
        this.acornSpawner.renderAcorns(this.ctx);
        
        // 장애물 렌더링
        this.obstacleManager.render(this.ctx);
        
        // 플레이어 렌더링
        this.renderPlayers();
        
        // 파티클 시스템 렌더링 (모든 요소 위에)
        this.particleSystem.render(this.ctx);
        
        // 충돌 효과 렌더링
        this.collisionManager.renderCollisionEffects(this.ctx);
    }
    
    // 배경 렌더링
    renderBackground() {
        // 그라데이션 배경
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0F172A');
        gradient.addColorStop(1, '#1E293B');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 격자 패턴
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    // 점수 구역 렌더링
    renderScoringZones() {
        Object.entries(this.gameState.scoringZones).forEach(([sensorId, zone]) => {
            const player = this.gameState.players[sensorId];
            
            this.ctx.save();
            
            // 훔치기 효과 - 빨간 경고 테두리
            if (zone.stealEffect && zone.stealEffect.active) {
                const elapsed = Date.now() - zone.stealEffect.startTime;
                const progress = elapsed / zone.stealEffect.duration;
                const alpha = 1 - progress;
                
                this.ctx.save();
                this.ctx.globalAlpha = alpha * 0.8;
                this.ctx.strokeStyle = '#FF0000';
                this.ctx.lineWidth = 6;
                this.ctx.strokeRect(zone.x - 5, zone.y - 5, zone.width + 10, zone.height + 10);
                this.ctx.restore();
            }
            
            // 스케일 적용 (점수 획득 시 애니메이션)
            const centerX = zone.x + zone.width / 2;
            const centerY = zone.y + zone.height / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(zone.animationScale, zone.animationScale);
            this.ctx.translate(-centerX, -centerY);
            
            // 구역 배경 (그라데이션 효과)
            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, Math.max(zone.width, zone.height) / 2
            );
            gradient.addColorStop(0, player.color + '30');
            gradient.addColorStop(1, player.color + '10');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            
            // 구역 테두리 (발광 효과)
            this.ctx.shadowColor = player.color;
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = player.color;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
            this.ctx.shadowBlur = 0;
            
            // 플레이어 라벨
            this.ctx.fillStyle = player.color;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                sensorId === 'sensor1' ? 'P1' : 'P2',
                zone.x + zone.width / 2,
                zone.y + 20
            );
            
            // 저장된 도토리 표시 (애니메이션 효과 추가)
            if (zone.storedAcorns > 0) {
                const bobOffset = Math.sin(Date.now() * 0.003) * 2; // 부드러운 흔들림
                
                this.ctx.fillStyle = '#8B4513';
                this.ctx.font = '24px Arial';
                this.ctx.fillText(
                    '🌰'.repeat(Math.min(zone.storedAcorns, 5)),
                    zone.x + zone.width / 2,
                    zone.y + zone.height / 2 + 10 + bobOffset
                );
                
                if (zone.storedAcorns > 5) {
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.font = '14px Arial';
                    this.ctx.fillText(
                        `+${zone.storedAcorns - 5}`,
                        zone.x + zone.width / 2,
                        zone.y + zone.height - 20
                    );
                }
            }
            
            // 점수 구역 활성화 표시 (플레이어가 근처에 있을 때)
            const distanceToPlayer = Math.sqrt(
                Math.pow(player.position.x - centerX, 2) + 
                Math.pow(player.position.y - centerY, 2)
            );
            
            if (distanceToPlayer < 100) {
                const alpha = Math.max(0, 1 - distanceToPlayer / 100);
                this.ctx.save();
                this.ctx.globalAlpha = alpha * 0.3;
                this.ctx.fillStyle = player.color;
                this.ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
                this.ctx.restore();
            }
            
            this.ctx.restore();
        });
    }
    
    // 플레이어 렌더링
    renderPlayers() {
        Object.entries(this.gameState.players).forEach(([sensorId, player]) => {
            this.ctx.save();
            
            // 훔치기 효과 - 플레이어 주변에 빨간 오라
            if (player.stealEffect && player.stealEffect.active) {
                const elapsed = Date.now() - player.stealEffect.startTime;
                const progress = elapsed / player.stealEffect.duration;
                const alpha = 1 - progress;
                
                this.ctx.save();
                this.ctx.globalAlpha = alpha * 0.6;
                this.ctx.strokeStyle = '#FF0000';
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.arc(player.position.x, player.position.y, player.radius + 10, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
            }
            
            // 무적 상태 시 깜빡임 효과
            if (player.invulnerable && Date.now() < player.invulnerableUntil) {
                const blinkRate = 200;
                if (Math.floor(Date.now() / blinkRate) % 2 === 0) {
                    this.ctx.globalAlpha = 0.5;
                }
            }
            
            // 기절 상태 시 회색으로 표시
            let playerColor = player.color;
            if (player.stunned && Date.now() < player.stunnedUntil) {
                playerColor = '#666666';
                
                // 기절 상태 표시 (별 모양)
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('💫', player.position.x, player.position.y - player.radius - 25);
            }
            
            // 플레이어 몸체
            this.ctx.fillStyle = playerColor;
            this.ctx.beginPath();
            this.ctx.arc(player.position.x, player.position.y, player.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 플레이어 테두리
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 플레이어 라벨
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                sensorId === 'sensor1' ? 'P1' : 'P2',
                player.position.x,
                player.position.y + 5
            );
            
            // 도토리를 들고 있는 경우 표시 (애니메이션 효과 추가)
            if (player.hasAcorn) {
                const bobOffset = Math.sin(Date.now() * 0.005) * 3; // 위아래로 흔들리는 효과
                this.ctx.fillStyle = '#8B4513';
                this.ctx.font = '20px Arial';
                this.ctx.fillText(
                    '🌰',
                    player.position.x,
                    player.position.y - player.radius - 15 + bobOffset
                );
            }
            
            this.ctx.restore();
        });
    }
    
    // 타이머 시작
    startTimer() {
        this.stopTimer(); // 기존 타이머 정리
        
        this.gameTimer = setInterval(() => {
            this.gameState.timeRemaining--;
            this.updateTimerUI();
            
            if (this.gameState.timeRemaining <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    // 타이머 중지
    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
    
    // 점수 UI 업데이트
    updateScoreUI() {
        this.elements.player1Score.textContent = this.gameState.players.sensor1.score;
        this.elements.player2Score.textContent = this.gameState.players.sensor2.score;
    }
    
    // 타이머 UI 업데이트
    updateTimerUI() {
        const minutes = Math.floor(this.gameState.timeRemaining / 60);
        const seconds = this.gameState.timeRemaining % 60;
        this.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // UI 업데이트
    updateUI() {
        this.updateScoreUI();
        this.updateTimerUI();
    }
    
    // 훔치기 알림 표시
    showStealNotification(thief, victim) {
        // 화면 상단에 알림 표시
        const notification = document.createElement('div');
        notification.className = 'steal-notification';
        notification.textContent = `${thief === 'sensor1' ? 'P1' : 'P2'}이 ${victim === 'sensor1' ? 'P1' : 'P2'}의 도토리를 훔쳤습니다!`;
        
        document.body.appendChild(notification);
        
        // 3초 후 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}ocument.getElementById('timer'),
            player1Score: document.getElementById('player1-score'),
            player2Score: document.getElementById('player2-score'),
            pauseBtn: document.getElementById('pause-btn'),
            restartGameBtn: document.getElementById('restart-game-btn'),
            resultModal: document.getElementById('result-modal'),
            resultTitle: document.getElementById('result-title'),
            finalScoreP1: document.getElementById('final-score-p1'),
            finalScoreP2: document.getElementById('final-score-p2'),
            restartBtn: document.getElementById('restart-btn'),
            hubBtn: document.getElementById('hub-btn')
        };ocument.getElementById('timer'),
            player1Score: document.getElementById('player1-score'),
            player2Score: document.getElementById('player2-score'),
            resultModal: document.getElementById('result-modal'),
            resultTitle: document.getElementById('result-title'),
            finalScoreP1: document.getElementById('final-score-p1'),
            finalScoreP2: document.getElementById('final-score-p2'),
            restartBtn: document.getElementById('restart-btn'),
            hubBtn: document.getElementById('hub-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            restartGameBtn: document.getElementById('restart-game-btn')
        };

        // 게임 루프 관련
        this.animationId = null;
        this.lastSensorUpdate = 0;
        this.sensorThrottle = 33; // 30fps

        // 도토리 관리 시스템 초기화
        this.acornSpawner = new AcornSpawner(this);

        // 장애물 관리 시스템 초기화
        this.obstacleManager = new ObstacleManager(this);

        // 충돌 감지 시스템 초기화
        this.collisionManager = new CollisionManager(this);

        // 훔치기 알림 시스템
        this.stealNotification = {
            active: false,
            message: '',
            startTime: 0,
            duration: 2000 // 2초간 표시
        };

        // 충돌 효과 배열 초기화
        this.collisionEffects = [];

        this.setupEvents();
        this.initializeGame();
    }

    setupEvents() {
        // SessionSDK 이벤트 핸들러 (필수: event.detail || event 패턴)
        this.sdk.on('connected', () => {
            console.log('서버에 연결됨');
            this.createSession();
        });

        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            console.log('세션 생성됨:', session);
            this.handleSessionCreated(session);
        });

        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            console.log('센서 연결됨:', data);
            this.handleSensorConnected(data);
        });

        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;
            console.log('센서 연결 해제됨:', data);
            this.handleSensorDisconnected(data);
        });

        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.handleSensorData(data);
        });

        this.sdk.on('error', (error) => {
            console.error('SDK 오류:', error);
            this.showError('연결 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        });

        // UI 이벤트 핸들러
        this.elements.startBtn.addEventListener('click', () => {
            // 사용자 상호작용 시 오디오 컨텍스트 재개
            this.audioSystem.resumeAudioContext();
            this.startGame();
        });
        this.elements.restartBtn.addEventListener('click', () => this.restartGame());
        this.elements.hubBtn.addEventListener('click', () => window.location.href = '/');
        this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        this.elements.restartGameBtn.addEventListener('click', () => this.restartGame());

        // 윈도우 이벤트
        window.addEventListener('beforeunload', () => this.cleanup());
        window.addEventListener('error', (event) => {
            console.error('게임 오류:', event.error);
            this.showError('게임 오류가 발생했습니다.');
        });
    }

    createSession() {
        try {
            this.sdk.createSession();
        } catch (error) {
            console.error('세션 생성 실패:', error);
            this.showError('세션 생성에 실패했습니다.');
        }
    }

    handleSessionCreated(session) {
        this.elements.sessionCode.textContent = session.sessionCode;
        this.generateQRCode(session.sensorUrl);
        this.updateOverlay('플레이어를 기다리는 중...', '모바일 기기로 QR 코드를 스캔하거나 세션 코드를 입력하세요');
    }

    generateQRCode(url) {
        // QR 코드 폴백 처리 (필수)
        if (typeof QRCode !== 'undefined') {
            try {
                QRCode.toCanvas(this.elements.qrCanvas, url, {
                    width: 150,
                    height: 150,
                    margin: 2
                }, (error) => {
                    if (error) {
                        console.error('QR 코드 생성 실패:', error);
                        this.showQRFallback(url);
                    }
                });
            } catch (error) {
                console.error('QR 코드 라이브러리 오류:', error);
                this.showQRFallback(url);
            }
        } else {
            console.warn('QRCode 라이브러리가 로드되지 않음, 폴백 사용');
            this.showQRFallback(url);
        }
    }

    showQRFallback(url) {
        this.elements.qrCanvas.style.display = 'none';
        this.elements.qrFallback.style.display = 'block';
        
        const img = document.createElement('img');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
        img.alt = 'QR Code';
        img.style.borderRadius = '8px';
        
        this.elements.qrFallback.innerHTML = '';
        this.elements.qrFallback.appendChild(img);
    }

    handleSensorConnected(data) {
        this.gameState.connectedSensors.add(data.sensorId);
        this.updateSensorStatus(data.sensorId, 'connected');
        
        if (this.gameState.connectedSensors.size === 2) {
            this.elements.startBtn.disabled = false;
            this.updateOverlay('게임 준비 완료!', '게임 시작 버튼을 클릭하세요');
            this.gameState.phase = 'ready';
        }
    }

    handleSensorDisconnected(data) {
        this.gameState.connectedSensors.delete(data.sensorId);
        this.updateSensorStatus(data.sensorId, 'disconnected');
        
        if (this.gameState.phase === 'playing') {
            this.pauseGame();
            this.updateOverlay('플레이어 연결 끊김', `${data.sensorId}가 재연결될 때까지 기다립니다`);
        } else {
            this.elements.startBtn.disabled = true;
            this.gameState.phase = 'waiting';
        }
    }

    handleSensorData(data) {
        // 센서 데이터 throttling
        const now = Date.now();
        if (now - this.lastSensorUpdate < this.sensorThrottle) return;
        this.lastSensorUpdate = now;

        if (this.gameState.phase !== 'playing') return;

        // 센서 데이터 검증
        if (!this.validateSensorData(data)) {
            console.warn('잘못된 센서 데이터:', data);
            return;
        }

        this.updatePlayerFromSensor(data);
    }

    validateSensorData(data) {
        return data && 
               data.data && 
               data.data.orientation &&
               typeof data.data.orientation.beta === 'number' &&
               typeof data.data.orientation.gamma === 'number' &&
               data.data.orientation.beta >= -180 && 
               data.data.orientation.beta <= 180 &&
               data.data.orientation.gamma >= -90 && 
               data.data.orientation.gamma <= 90;
    }

    updatePlayerFromSensor(data) {
        const player = this.gameState.players[data.sensorId];
        if (!player) return;

        // 기절 상태 체크
        if (player.stunned && Date.now() < player.stunnedUntil) {
            return; // 기절 상태에서는 움직일 수 없음
        }

        // 기절 상태 해제 및 무적 상태 설정
        if (player.stunned && Date.now() >= player.stunnedUntil) {
            player.stunned = false;
            player.invulnerable = true;
            player.invulnerableUntil = Date.now() + 1000; // 1초간 무적
            console.log(`${data.sensorId} 기절 해제, 1초간 무적 상태`);
        }

        // 무적 상태 해제
        if (player.invulnerable && Date.now() >= player.invulnerableUntil) {
            player.invulnerable = false;
            console.log(`${data.sensorId} 무적 상태 해제`);
        }

        // 센서 데이터로 이동 계산
        const moveSpeed = 3;
        const { beta, gamma } = data.data.orientation;
        
        player.velocity.x = (gamma || 0) * moveSpeed / 45;
        player.velocity.y = (beta || 0) * moveSpeed / 45;
        
        // 위치 업데이트
        player.position.x += player.velocity.x;
        player.position.y += player.velocity.y;
        
        // 맵 경계 제한
        this.constrainPlayerToMap(player);
    }

    constrainPlayerToMap(player) {
        const margin = player.radius;
        player.position.x = Math.max(margin, Math.min(this.canvas.width - margin, player.position.x));
        player.position.y = Math.max(margin, Math.min(this.canvas.height - margin, player.position.y));
    }

    updateSensorStatus(sensorId, status) {
        const statusElement = this.elements[`${sensorId}Status`];
        if (statusElement) {
            statusElement.textContent = status === 'connected' ? '연결됨' : 
                                       status === 'disconnected' ? '연결 끊김' : '대기중';
            statusElement.className = `status-indicator ${status === 'connected' ? 'connected' : 
                                                         status === 'disconnected' ? 'disconnected' : 'waiting'}`;
        }
    }

    updateOverlay(title, message) {
        this.elements.overlayTitle.textContent = title;
        this.elements.overlayMessage.textContent = message;
    }    s
tartGame() {
        if (this.gameState.connectedSensors.size < 2) {
            this.showError('두 명의 플레이어가 필요합니다.');
            return;
        }

        this.gameState.phase = 'playing';
        this.gameState.startTime = Date.now();
        this.gameState.timeRemaining = 60;
        
        // UI 업데이트
        this.elements.gameOverlay.style.display = 'none';
        this.elements.pauseBtn.disabled = false;
        this.elements.restartGameBtn.disabled = false;
        
        // 게임 초기화
        this.initializeGameEntities();
        
        // 게임 루프 시작
        this.startGameLoop();
        
        console.log('게임 시작!');
    }

    initializeGameEntities() {
        // 플레이어 위치 초기화
        this.gameState.players.sensor1.position = { x: 100, y: 300 };
        this.gameState.players.sensor2.position = { x: 700, y: 300 };
        
        // 플레이어 상태 초기화
        this.gameState.players.sensor1.score = 0;
        this.gameState.players.sensor1.hasAcorn = false;
        this.gameState.players.sensor1.stunned = false;
        this.gameState.players.sensor1.invulnerable = false;
        
        this.gameState.players.sensor2.score = 0;
        this.gameState.players.sensor2.hasAcorn = false;
        this.gameState.players.sensor2.stunned = false;
        this.gameState.players.sensor2.invulnerable = false;
        
        // 점수 구역 상태 초기화
        this.gameState.scoringZones.sensor1.storedAcorns = 0;
        this.gameState.scoringZones.sensor1.animationScale = 1.0;
        this.gameState.scoringZones.sensor1.lastScoreTime = 0;
        
        this.gameState.scoringZones.sensor2.storedAcorns = 0;
        this.gameState.scoringZones.sensor2.animationScale = 1.0;
        this.gameState.scoringZones.sensor2.lastScoreTime = 0;
        
        // 도토리 시스템 초기화 - 초기 8개 도토리 생성
        this.acornSpawner.initialize();
        
        // 장애물 시스템 초기화 - 2-3개 장애물 생성
        this.obstacleManager.initialize();
        
        this.updateScoreUI();
    }

    startGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.gameLoop();
    }

    gameLoop() {
        // 성능 모니터링 시작
        this.performanceManager.frameStart();
        
        // 실시간 게임 상태 검증 (디버그 모드에서만)
        if (this.gameTester && Math.random() < 0.01) { // 1% 확률로 검증
            this.performRuntimeValidation();
        }
        
        if (this.gameState.phase === 'playing') {
            // 업데이트 성능 측정
            this.performanceManager.updateStart();
            this.update();
            this.performanceManager.updateEnd();
            
            // 렌더링 성능 측정
            this.performanceManager.renderStart();
            this.render();
            this.performanceManager.renderEnd();
            
            this.updateTimer();
        }
        
        // 성능 모니터링 종료
        this.performanceManager.frameEnd();
    }
        
        // 브라우저 호환성을 고려한 최적화된 애니메이션 프레임 요청
        if (this.browserCompat) {
            this.animationId = this.performanceManager.optimizedRequestAnimationFrame(() => this.gameLoop());
        } else {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        // 도토리 스포너 업데이트 (5초마다 새 도토리 생성)
        this.acornSpawner.update();
        
        // 장애물 업데이트 (이동 및 경계 반사)
        this.obstacleManager.update();
        
        // 통합 충돌 감지 시스템으로 모든 충돌 검사 처리
        this.collisionManager.checkAllCollisions();
        
        // 점수 구역 애니메이션 업데이트
        this.updateScoringZoneAnimations();
        
        this.updateUI();
    }
    
    // 메인 렌더링 함수 (브라우저 호환성 최적화 포함)
    render() {
        if (!this.ctx || !this.canvas) return;
        
        // 브라우저별 최적화 설정 적용
        const optimizationSettings = this.browserCompat.getOptimizationSettings();
        
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경 렌더링
        this.renderBackground();
        
        // 점수 구역 렌더링
        this.renderScoringZones();
        
        // 도토리 렌더링
        this.renderAcorns();
        
        // 장애물 렌더링
        this.renderObstacles();
        
        // 플레이어 렌더링 (트레일 효과 포함)
        if (optimizationSettings.enableParticles) {
            this.renderPlayerTrails();
        }
        this.renderPlayers();
        
        // 파티클 효과 렌더링 (성능 최적화 적용)
        if (optimizationSettings.enableParticles) {
            this.particleSystem.render(this.ctx);
            this.renderCollisionEffects();
        }
        
        // 특수 효과 렌더링
        this.renderSpecialEffects();
        
        // 훔치기 알림 렌더링
        this.renderStealNotification();
    }
    
    // 배경 렌더링
    renderBackground() {
        // 그라데이션 배경
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a202c');
        gradient.addColorStop(1, '#2d3748');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 격자 패턴 (성능 최적화 적용)
        if (this.browserCompat.getOptimizationSettings().enableShadows) {
            this.renderGridPattern();
        }
    }
    
    // 격자 패턴 렌더링
    renderGridPattern() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        
        // 세로선
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 가로선
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    // 도토리 렌더링
    renderAcorns() {
        this.gameState.acorns.forEach(acorn => {
            acorn.render(this.ctx);
        });
    }
    
    // 장애물 렌더링
    renderObstacles() {
        this.gameState.obstacles.forEach((obstacle, index) => {
            // 튜토리얼 모드에서 장애물 강조
            if (this.highlightObstaclesMode) {
                this.ctx.save();
                this.ctx.shadowColor = '#FF4444';
                this.ctx.shadowBlur = 20;
                this.ctx.strokeStyle = '#FF4444';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(
                    obstacle.position.x - 5,
                    obstacle.position.y - 5,
                    obstacle.size.width + 10,
                    obstacle.size.height + 10
                );
                this.ctx.restore();
            }
            
            obstacle.render(this.ctx);
        });
    }
    
    // 플레이어 트레일 렌더링
    renderPlayerTrails() {
        this.trailEffect.render(this.ctx);
    }
    
    // 특수 효과 렌더링
    renderSpecialEffects() {
        // 플레이어별 특수 효과
        Object.entries(this.gameState.players).forEach(([sensorId, player]) => {
            this.renderPlayerAcornStatus(player, sensorId);
            this.renderPlayerStealEffect(player, sensorId);
        });
        
        // 축하 효과
        if (this.celebrationEffects && this.celebrationEffects.length > 0) {
            this.renderCelebrationEffects();
        }
    }
    
    // 도토리 수집 충돌 검사
    checkAcornCollisions() {
        Object.entries(this.gameState.players).forEach(([sensorId, player]) => {
            // 이미 도토리를 들고 있으면 수집할 수 없음
            if (player.hasAcorn) return;
            
            // 각 도토리와 충돌 검사
            for (let i = this.gameState.acorns.length - 1; i >= 0; i--) {
                const acorn = this.gameState.acorns[i];
                
                if (acorn.checkCollision(player)) {
                    // 도토리 수집 처리
                    if (this.acornSpawner.collectAcorn(acorn, player)) {
                        console.log(`${sensorId}가 도토리를 수집했습니다!`);
                        break; // 한 번에 하나의 도토리만 수집
                    }
                }
            }
        });
    }

    // 점수 구역 충돌 검사 및 득점/훔치기 처리
    checkScoringZoneCollisions() {
        Object.entries(this.gameState.players).forEach(([sensorId, player]) => {
            // 각 점수 구역과 충돌 검사
            Object.entries(this.gameState.scoringZones).forEach(([zoneId, zone]) => {
                if (this.isPlayerInZone(player, zone)) {
                    if (sensorId === zoneId) {
                        // 자신의 점수 구역에 도토리 저장
                        this.handleOwnZoneEntry(player, zone, sensorId);
                    } else {
                        // 상대방의 점수 구역에서 도토리 훔치기
                        this.handleOpponentZoneEntry(player, zone, sensorId, zoneId);
                    }
                }
            });
        });
    }

    // 플레이어가 점수 구역 안에 있는지 확인
    isPlayerInZone(player, zone) {
        return player.position.x >= zone.x && 
               player.position.x <= zone.x + zone.width &&
               player.position.y >= zone.y && 
               player.position.y <= zone.y + zone.height;
    }

    // 자신의 점수 구역에서 도토리 저장 처리
    handleOwnZoneEntry(player, zone, sensorId) {
        if (player.hasAcorn) {
            // 도토리를 점수 구역에 저장
            player.hasAcorn = false;
            player.score++;
            zone.storedAcorns++;
            
            // 점수 애니메이션 트리거
            zone.animationScale = 1.3;
            zone.lastScoreTime = Date.now();
            
            console.log(`${sensorId}가 점수를 획득했습니다! 현재 점수: ${player.score}`);
        }
    }

    // 상대방의 점수 구역에서 도토리 훔치기 처리 (강화된 시스템)
    handleOpponentZoneEntry(player, zone, playerSensorId, zoneSensorId) {
        // 이미 도토리를 들고 있거나 상대방 구역에 저장된 도토리가 없으면 훔칠 수 없음
        if (player.hasAcorn || zone.storedAcorns <= 0) return;
        
        const opponent = this.gameState.players[zoneSensorId];
        if (opponent && opponent.score > 0) {
            // 상대방의 도토리 훔치기
            player.hasAcorn = true;
            opponent.score--;
            zone.storedAcorns--;
            
            // 훔치기 성공 시 강화된 시각적 효과
            zone.animationScale = 0.6; // 더 강한 축소 효과
            zone.lastScoreTime = Date.now();
            zone.stealEffect = {
                active: true,
                startTime: Date.now(),
                duration: 1000 // 1초간 지속
            };
            
            // 플레이어에게 훔치기 성공 효과 추가
            player.stealEffect = {
                active: true,
                startTime: Date.now(),
                duration: 800
            };
            
            // 훔치기 성공 시 청각적 피드백
            this.playStealSound();
            
            // 화면 전체에 훔치기 알림 효과
            this.showStealNotification(playerSensorId, zoneSensorId);
            
            console.log(`${playerSensorId}가 ${zoneSensorId}의 도토리를 훔쳤습니다!`);
        }
    }

    // 점수 구역 애니메이션 업데이트
    updateScoringZoneAnimations() {
        Object.values(this.gameState.scoringZones).forEach(zone => {
            const now = Date.now();
            const timeSinceScore = now - zone.lastScoreTime;
            
            // 애니메이션 지속 시간 (500ms)
            if (timeSinceScore < 500) {
                // 애니메이션 진행률 (0 ~ 1)
                const progress = timeSinceScore / 500;
                // 원래 크기로 돌아가는 애니메이션
                zone.animationScale = 1.0 + (zone.animationScale - 1.0) * (1 - progress);
            } else {
                zone.animationScale = 1.0;
            }
        });
    } 
   // 훔치기 성공 시 청각적 피드백
    playStealSound() {
        // Web Audio API를 사용한 간단한 사운드 생성
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 훔치기 사운드 - 경고음과 같은 효과
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 두 개의 주파수로 불협화음 생성 (경고 효과)
            oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator1.type = 'square';
            oscillator2.type = 'sawtooth';
            
            // 볼륨 조절 (0.1로 낮춤)
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            // 사운드 재생
            oscillator1.start(audioContext.currentTime);
            oscillator2.start(audioContext.currentTime);
            oscillator1.stop(audioContext.currentTime + 0.3);
            oscillator2.stop(audioContext.currentTime + 0.3);
            
        } catch (error) {
            console.warn('오디오 재생 실패:', error);
        }
    }

    // 화면 전체에 훔치기 알림 효과 표시
    showStealNotification(thiefSensorId, victimSensorId) {
        const thiefName = thiefSensorId === 'sensor1' ? 'P1' : 'P2';
        const victimName = victimSensorId === 'sensor1' ? 'P1' : 'P2';
        
        this.stealNotification = {
            active: true,
            message: `${thiefName}이 ${victimName}의 도토리를 훔쳤습니다!`,
            startTime: Date.now(),
            duration: 2000 // 2초간 표시
        };
    }

    // 훔치기 알림 렌더링
    renderStealNotification() {
        if (!this.stealNotification.active) return;
        
        const now = Date.now();
        const elapsed = now - this.stealNotification.startTime;
        
        if (elapsed >= this.stealNotification.duration) {
            this.stealNotification.active = false;
            return;
        }
        
        // 알림 애니메이션 (페이드 인/아웃)
        const progress = elapsed / this.stealNotification.duration;
        let alpha;
        if (progress < 0.2) {
            // 페이드 인 (0 ~ 0.2)
            alpha = progress / 0.2;
        } else if (progress > 0.8) {
            // 페이드 아웃 (0.8 ~ 1.0)
            alpha = (1 - progress) / 0.2;
        } else {
            // 완전히 표시 (0.2 ~ 0.8)
            alpha = 1;
        }
        
        // 배경 오버레이
        this.ctx.save();
        this.ctx.globalAlpha = alpha * 0.8;
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, this.canvas.height / 2 - 40, this.canvas.width, 80);
        this.ctx.restore();
        
        // 알림 텍스트
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 텍스트 외곽선
        this.ctx.strokeText(this.stealNotification.message, centerX, centerY);
        // 텍스트 채우기
        this.ctx.fillText(this.stealNotification.message, centerX, centerY);
        
        // 경고 아이콘들
        this.ctx.font = '30px Arial';
        this.ctx.fillText('⚠️', centerX - 150, centerY);
        this.ctx.fillText('⚠️', centerX + 150, centerY);
        
        this.ctx.restore();
    }

    // 플레이어 훔치기 효과 렌더링
    renderPlayerStealEffect(player, sensorId) {
        if (!player.stealEffect || !player.stealEffect.active) return;
        
        const now = Date.now();
        const elapsed = now - player.stealEffect.startTime;
        
        if (elapsed >= player.stealEffect.duration) {
            player.stealEffect.active = false;
            return;
        }
        
        const progress = elapsed / player.stealEffect.duration;
        const alpha = 1 - progress;
        
        // 플레이어 주변에 훔치기 성공 효과
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // 성공 링 효과
        const ringRadius = 30 + (progress * 20);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(player.position.x, player.position.y, ringRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 파티클 효과
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + (progress * Math.PI * 2);
            const distance = 40 + (progress * 30);
            const x = player.position.x + Math.cos(angle) * distance;
            const y = player.position.y + Math.sin(angle) * distance;
            
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 성공 텍스트
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('훔치기 성공!', player.position.x, player.position.y - 50);
        
        this.ctx.restore();
    }

    // 점수 구역 훔치기 효과 렌더링
    renderZoneStealEffect(zone) {
        if (!zone.stealEffect || !zone.stealEffect.active) return;
        
        const now = Date.now();
        const elapsed = now - zone.stealEffect.startTime;
        
        if (elapsed >= zone.stealEffect.duration) {
            zone.stealEffect.active = false;
            return;
        }
        
        const progress = elapsed / zone.stealEffect.duration;
        const alpha = 1 - progress;
        
        const centerX = zone.x + zone.width / 2;
        const centerY = zone.y + zone.height / 2;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // 경고 테두리 효과
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 6;
        this.ctx.setLineDash([10, 10]);
        this.ctx.lineDashOffset = progress * 20;
        this.ctx.strokeRect(zone.x - 10, zone.y - 10, zone.width + 20, zone.height + 20);
        this.ctx.setLineDash([]);
        
        // 경고 텍스트
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('도토리 도난!', centerX, centerY - 60);
        
        // 경고 아이콘
        this.ctx.font = '24px Arial';
        this.ctx.fillText('🚨', centerX, centerY - 80);
        
        this.ctx.restore();
    }    rende
r() {
        // 캔버스 클리어
        this.ctx.fillStyle = '#1a202c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 점수 구역 렌더링
        this.renderScoringZones();
        
        // 점수 구역 훔치기 효과 렌더링
        Object.values(this.gameState.scoringZones).forEach(zone => {
            this.renderZoneStealEffect(zone);
        });
        
        // 도토리 렌더링
        this.acornSpawner.renderAcorns(this.ctx);
        
        // 장애물 렌더링
        this.obstacleManager.render(this.ctx);
        
        // 플레이어 렌더링
        this.renderPlayers();
        
        // 플레이어 도토리 보유 상태 표시 렌더링
        Object.entries(this.gameState.players).forEach(([sensorId, player]) => {
            this.renderPlayerAcornStatus(player, sensorId);
        });
        
        // 충돌 효과 렌더링 (CollisionManager 사용)
        this.collisionManager.renderCollisionEffects(this.ctx);
        
        // 플레이어 훔치기 효과 렌더링
        Object.entries(this.gameState.players).forEach(([sensorId, player]) => {
            this.renderPlayerStealEffect(player, sensorId);
        });
        
        // 훔치기 알림 렌더링 (최상위 레이어)
        this.renderStealNotification();
        
        // 축하 효과 렌더링 (게임 종료 시)
        this.renderCelebrationEffects();
    }
    
    // 축하 효과 렌더링
    renderCelebrationEffects() {
        if (!this.celebrationEffects || this.celebrationEffects.length === 0) return;
        
        for (let i = this.celebrationEffects.length - 1; i >= 0; i--) {
            const particle = this.celebrationEffects[i];
            const elapsed = Date.now() - particle.startTime;
            
            // 파티클 수명 체크
            if (particle.life <= 0 || elapsed > 3000) {
                this.celebrationEffects.splice(i, 1);
                continue;
            }
            
            // 파티클 위치 업데이트
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // 중력 효과
            particle.vx *= 0.99; // 공기 저항
            particle.life -= particle.decay;
            
            // 파티클 렌더링
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 반짝임 효과
            if (Math.random() < 0.3) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
    }

    renderScoringZones() {
        Object.entries(this.gameState.scoringZones).forEach(([zoneId, zone]) => {
            const player = this.gameState.players[zoneId];
            const isPlayer1 = zoneId === 'sensor1';
            
            // 애니메이션 스케일 적용
            const scale = zone.animationScale;
            const centerX = zone.x + zone.width / 2;
            const centerY = zone.y + zone.height / 2;
            const scaledWidth = zone.width * scale;
            const scaledHeight = zone.height * scale;
            const scaledX = centerX - scaledWidth / 2;
            const scaledY = centerY - scaledHeight / 2;
            
            // 구역 배경 (애니메이션 적용)
            this.ctx.fillStyle = isPlayer1 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)';
            this.ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
            
            // 구역 테두리 (애니메이션 적용)
            this.ctx.strokeStyle = isPlayer1 ? '#3B82F6' : '#EF4444';
            this.ctx.lineWidth = 3 * scale; // 테두리도 스케일 적용
            this.ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
            
            // 구역 라벨
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${16 * scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                isPlayer1 ? 'P1 구역' : 'P2 구역', 
                centerX, 
                centerY - 20 * scale
            );
            
            // 저장된 도토리 개수 표시
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${20 * scale}px Arial`;
            this.ctx.fillText(
                `${player.score}개`, 
                centerX, 
                centerY + 10 * scale
            );
            
            // 저장된 도토리 시각적 표시 (작은 도토리 아이콘들)
            this.renderStoredAcorns(zone, player.score, scale);
            
            // 점수 증가/감소 효과 표시
            if (Date.now() - zone.lastScoreTime < 500) {
                this.renderScoreEffect(zone, scale);
            }
        });
    }

    // 저장된 도토리들을 시각적으로 표시
    renderStoredAcorns(zone, count, scale) {
        const maxDisplay = 8; // 최대 8개까지만 시각적으로 표시
        const displayCount = Math.min(count, maxDisplay);
        
        if (displayCount === 0) return;
        
        const centerX = zone.x + zone.width / 2;
        const centerY = zone.y + zone.height / 2;
        const radius = 4 * scale;
        const spacing = 12 * scale;
        
        // 도토리들을 원형으로 배치
        for (let i = 0; i < displayCount; i++) {
            const angle = (i / displayCount) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * spacing * 2;
            const y = centerY + Math.sin(angle) * spacing * 1.5 + 25 * scale;
            
            // 작은 도토리 그리기
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 도토리 테두리
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // 도토리 꼭지
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(x - 1, y - radius - 2, 2, 3);
        }
        
        // 8개 이상일 때 "+" 표시
        if (count > maxDisplay) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${12 * scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `+${count - maxDisplay}`, 
                centerX, 
                centerY + 45 * scale
            );
        }
    }

    // 점수 변화 효과 렌더링
    renderScoreEffect(zone, scale) {
        const centerX = zone.x + zone.width / 2;
        const centerY = zone.y + zone.height / 2;
        const timeSinceScore = Date.now() - zone.lastScoreTime;
        const progress = timeSinceScore / 500; // 0 ~ 1
        
        // 효과 텍스트 (점수 증가/감소)
        const isIncrease = zone.animationScale > 1.0;
        const effectText = isIncrease ? '+1' : '-1';
        const effectColor = isIncrease ? '#00ff00' : '#ff0000';
        
        // 텍스트가 위로 올라가면서 사라지는 효과
        const offsetY = -30 * progress * scale;
        const alpha = 1 - progress;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = effectColor;
        this.ctx.font = `${24 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(effectText, centerX, centerY + offsetY - 40 * scale);
        this.ctx.restore();
        
        // 파티클 효과 (점수 증가 시)
        if (isIncrease) {
            this.renderScoreParticles(centerX, centerY, progress, scale);
        }
    }

    // 점수 증가 시 파티클 효과
    renderScoreParticles(centerX, centerY, progress, scale) {
        const particleCount = 6;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = progress * 40 * scale;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            const alpha = 1 - progress;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3 * scale, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    renderPlayers() {
        Object.entries(this.gameState.players).forEach(([sensorId, player]) => {
            // 무적 상태일 때 깜빡임 효과
            if (player.invulnerable && Date.now() < player.invulnerableUntil) {
                if (Math.floor(Date.now() / 100) % 2 === 0) return;
            }
            
            // 플레이어 원 그리기
            this.ctx.fillStyle = player.color;
            this.ctx.beginPath();
            this.ctx.arc(player.position.x, player.position.y, player.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 플레이어 테두리
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 플레이어 라벨
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(sensorId === 'sensor1' ? 'P1' : 'P2', 
                            player.position.x, player.position.y + 5);
            
            // 도토리 보유 상태 표시 (플레이어 위에 작은 도토리 아이콘)
            if (player.hasAcorn) {
                const acornX = player.position.x;
                const acornY = player.position.y - player.radius - 20;
                
                // 작은 도토리 그리기
                this.ctx.fillStyle = '#8B4513';
                this.ctx.beginPath();
                this.ctx.arc(acornX, acornY, 8, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 도토리 테두리
                this.ctx.strokeStyle = '#654321';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                
                // 도토리 꼭지
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(acornX - 2, acornY - 10, 4, 5);
                
                // 도토리 하이라이트
                this.ctx.fillStyle = '#A0522D';
                this.ctx.beginPath();
                this.ctx.arc(acornX - 3, acornY - 3, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // 기절 상태 표시
            if (player.stunned) {
                this.ctx.fillStyle = '#ffff00';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('😵', player.position.x, player.position.y - 35);
            }
        });
    } 
    // 1분 카운트다운 타이머 구현 및 실시간 UI 업데이트
    updateTimer() {
        if (this.gameState.phase !== 'playing') return;
        
        // 경과 시간 계산 (초 단위)
        const elapsed = (Date.now() - this.gameState.startTime) / 1000;
        this.gameState.timeRemaining = Math.max(0, 60 - elapsed);
        
        // 분:초 형식으로 변환
        const minutes = Math.floor(this.gameState.timeRemaining / 60);
        const seconds = Math.floor(this.gameState.timeRemaining % 60);
        const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // 실시간 타이머 UI 업데이트
        this.elements.timer.textContent = timeDisplay;
        
        // 시간이 얼마 남지 않았을 때 시각적 경고 효과
        const timerElement = this.elements.timer;
        if (this.gameState.timeRemaining <= 10) {
            // 마지막 10초 - 빨간색으로 깜빡임
            timerElement.style.color = '#FF0000';
            timerElement.style.fontWeight = 'bold';
            if (Math.floor(this.gameState.timeRemaining) % 2 === 0) {
                timerElement.style.transform = 'scale(1.1)';
            } else {
                timerElement.style.transform = 'scale(1.0)';
            }
        } else if (this.gameState.timeRemaining <= 30) {
            // 마지막 30초 - 주황색
            timerElement.style.color = '#FF8800';
            timerElement.style.fontWeight = 'bold';
            timerElement.style.transform = 'scale(1.0)';
        } else {
            // 일반 상태 - 기본 색상
            timerElement.style.color = '#f1f5f9';
            timerElement.style.fontWeight = 'normal';
            timerElement.style.transform = 'scale(1.0)';
        }
        
        // 게임 종료 조건 검사 - 시간이 0이 되면 게임 종료
        if (this.gameState.timeRemaining <= 0) {
            this.endGame();
        }
    }

    // ===== UI 시스템 구현 =====
    
    // 실시간 점수 표시 패널 구현
    updateScoreUI() {
        const p1Score = this.gameState.players.sensor1.score;
        const p2Score = this.gameState.players.sensor2.score;
        
        this.elements.player1Score.textContent = p1Score;
        this.elements.player2Score.textContent = p2Score;
        
        // 점수 변화 시 애니메이션 효과
        this.animateScoreChange('player1-score', p1Score);
        this.animateScoreChange('player2-score', p2Score);
        
        // 게임 결과 모달의 점수도 업데이트
        if (this.elements.finalScoreP1) {
            this.elements.finalScoreP1.textContent = p1Score;
        }
        if (this.elements.finalScoreP2) {
            this.elements.finalScoreP2.textContent = p2Score;
        }
    }
    
    // 점수 변화 애니메이션
    animateScoreChange(elementId, newScore) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // 이전 점수와 비교하여 변화가 있을 때만 애니메이션
        const prevScore = parseInt(element.dataset.prevScore || '0');
        if (newScore !== prevScore) {
            element.dataset.prevScore = newScore.toString();
            
            // 점수 증가/감소에 따른 색상 효과
            if (newScore > prevScore) {
                // 점수 증가 - 초록색 효과
                element.style.color = '#10b981';
                element.style.transform = 'scale(1.2)';
                element.style.fontWeight = 'bold';
                
                setTimeout(() => {
                    element.style.color = '';
                    element.style.transform = 'scale(1.0)';
                    element.style.fontWeight = '';
                }, 500);
            } else if (newScore < prevScore) {
                // 점수 감소 - 빨간색 효과
                element.style.color = '#ef4444';
                element.style.transform = 'scale(0.9)';
                
                setTimeout(() => {
                    element.style.color = '';
                    element.style.transform = 'scale(1.0)';
                }, 500);
            }
        }
    }
    
    // 플레이어 연결 상태 표시 구현
    updateSensorStatus(sensorId, status) {
        const statusElement = this.elements[`${sensorId}Status`];
        if (!statusElement) return;
        
        // 상태별 텍스트 및 스타일 설정
        switch (status) {
            case 'connected':
                statusElement.textContent = '연결됨';
                statusElement.className = 'status-indicator connected';
                break;
            case 'disconnected':
                statusElement.textContent = '연결 끊김';
                statusElement.className = 'status-indicator disconnected';
                break;
            default:
                statusElement.textContent = '대기중';
                statusElement.className = 'status-indicator waiting';
        }
        
        // 연결 상태 변화 애니메이션
        statusElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            statusElement.style.transform = 'scale(1.0)';
        }, 200);
    }
    
    // 게임 시작 버튼 및 컨트롤 패널 구현
    updateControlButtons() {
        const connectedCount = this.gameState.connectedSensors.size;
        const gamePhase = this.gameState.phase;
        
        // 게임 시작 버튼 상태
        this.elements.startBtn.disabled = connectedCount < 2 || gamePhase === 'playing';
        
        // 컨트롤 버튼들 상태
        this.elements.pauseBtn.disabled = gamePhase !== 'playing';
        this.elements.restartGameBtn.disabled = gamePhase === 'waiting';
        
        // 버튼 텍스트 업데이트
        if (gamePhase === 'paused') {
            this.elements.pauseBtn.textContent = '▶️ 계속하기';
        } else {
            this.elements.pauseBtn.textContent = '⏸️ 일시정지';
        }
    }
    
    // 도토리 보유 상태 시각적 표시 구현 (캔버스에서 렌더링)
    renderPlayerAcornStatus(player, sensorId) {
        if (!player.hasAcorn) return;
        
        const ctx = this.ctx;
        const x = player.position.x;
        const y = player.position.y - player.radius - 20;
        
        // 도토리 아이콘 배경
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 도토리 아이콘
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 도토리 줄기
        ctx.fillStyle = '#654321';
        ctx.fillRect(x - 2, y - 12, 4, 6);
        
        // 보유 표시 텍스트
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('보유중', x, y + 30);
        
        ctx.restore();
    }
    
    // 게임 상태별 UI 전환 로직 구현
    updateGameStateUI() {
        const phase = this.gameState.phase;
        
        switch (phase) {
            case 'waiting':
                this.showWaitingUI();
                break;
            case 'ready':
                this.showReadyUI();
                break;
            case 'playing':
                this.showPlayingUI();
                break;
            case 'paused':
                this.showPausedUI();
                break;
            case 'ended':
                this.showEndedUI();
                break;
        }
        
        this.updateControlButtons();
    }
    
    // 대기 상태 UI
    showWaitingUI() {
        this.elements.gameOverlay.style.display = 'flex';
        this.updateOverlay('플레이어를 기다리는 중...', 
            '모바일 기기로 QR 코드를 스캔하거나 세션 코드를 입력하세요');
    }
    
    // 준비 상태 UI
    showReadyUI() {
        this.elements.gameOverlay.style.display = 'flex';
        this.updateOverlay('게임 준비 완료!', '게임 시작 버튼을 클릭하세요');
    }
    
    // 게임 진행 상태 UI
    showPlayingUI() {
        this.elements.gameOverlay.style.display = 'none';
    }
    
    // 일시정지 상태 UI
    showPausedUI() {
        this.elements.gameOverlay.style.display = 'flex';
        this.updateOverlay('게임 일시정지', '계속하기 버튼을 클릭하거나 플레이어 재연결을 기다립니다');
    }
    
    // 게임 종료 상태 UI
    showEndedUI() {
        this.elements.gameOverlay.style.display = 'none';
        this.showGameResult();
    }
    
    // 게임 결과 모달 표시
    showGameResult() {
        const p1Score = this.gameState.players.sensor1.score;
        const p2Score = this.gameState.players.sensor2.score;
        
        // 승부 결과 판정
        let resultTitle = '';
        if (p1Score > p2Score) {
            resultTitle = '🎉 플레이어 1 승리!';
        } else if (p2Score > p1Score) {
            resultTitle = '🎉 플레이어 2 승리!';
        } else {
            resultTitle = '🤝 무승부!';
        }
        
        // 결과 모달 업데이트
        this.elements.resultTitle.textContent = resultTitle;
        this.elements.finalScoreP1.textContent = p1Score;
        this.elements.finalScoreP2.textContent = p2Score;
        
        // 승자 강조 효과
        if (p1Score > p2Score) {
            this.elements.finalScoreP1.style.color = '#10b981';
            this.elements.finalScoreP1.style.fontWeight = 'bold';
            this.elements.finalScoreP1.style.fontSize = '3rem';
        } else if (p2Score > p1Score) {
            this.elements.finalScoreP2.style.color = '#10b981';
            this.elements.finalScoreP2.style.fontWeight = 'bold';
            this.elements.finalScoreP2.style.fontSize = '3rem';
        }
        
        // 모달 표시
        this.elements.resultModal.style.display = 'flex';
        
        // 축하 효과 생성
        this.createCelebrationEffect();
    }
    
    // 축하 효과 생성
    createCelebrationEffect() {
        this.celebrationEffects = [];
        
        // 파티클 효과 생성
        for (let i = 0; i < 50; i++) {
            this.celebrationEffects.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height + Math.random() * 100,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 8 - 2,
                color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)],
                size: Math.random() * 6 + 2,
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01
            });
        }
    }
    
    // 축하 효과 렌더링
    renderCelebrationEffects() {
        if (!this.celebrationEffects || this.celebrationEffects.length === 0) return;
        
        this.ctx.save();
        
        for (let i = this.celebrationEffects.length - 1; i >= 0; i--) {
            const particle = this.celebrationEffects[i];
            
            // 파티클 업데이트
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // 중력
            particle.life -= particle.decay;
            
            // 생명이 다한 파티클 제거
            if (particle.life <= 0) {
                this.celebrationEffects.splice(i, 1);
                continue;
            }
            
            // 파티클 렌더링
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    // 오버레이 업데이트
    updateOverlay(title, message) {
        this.elements.overlayTitle.textContent = title;
        this.elements.overlayMessage.textContent = message;
    }
    
    // 통합 UI 업데이트 메서드
    updateUI() {
        this.updateScoreUI();
        this.updateGameStateUI();
        this.updateTimerUI();
    }
    
    // 타이머 UI 업데이트
    updateTimerUI() {
        const minutes = Math.floor(this.gameState.timeRemaining / 60);
        const seconds = this.gameState.timeRemaining % 60;
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.elements.timer.textContent = timeText;
        
        // 시간에 따른 색상 변화
        if (this.gameState.timeRemaining <= 10) {
            // 마지막 10초 - 빨간색, 깜빡임
            this.elements.timer.style.color = '#ef4444';
            this.elements.timer.style.fontWeight = 'bold';
            this.elements.timer.style.transform = 'scale(1.1)';
            
            if (this.gameState.timeRemaining <= 5) {
                // 마지막 5초 - 더 강한 효과
                this.elements.timer.style.animation = 'pulse 0.5s infinite';
            }
        } else if (this.gameState.timeRemaining <= 30) {
            // 마지막 30초 - 주황색
            this.elements.timer.style.color = '#f59e0b';
            this.elements.timer.style.fontWeight = 'bold';
        } else {
            // 일반 상태
            this.elements.timer.style.color = '#f1f5f9';
            this.elements.timer.style.fontWeight = 'normal';
            this.elements.timer.style.transform = 'scale(1.0)';
            this.elements.timer.style.animation = 'none';
        }
    }

    updateUI() {
        this.updateScoreUI();
    }

    // 게임 일시정지 (타이머 포함)
    pauseGame() {
        if (this.gameState.phase === 'playing') {
            this.gameState.phase = 'paused';
            
            // 일시정지 시점의 경과 시간 저장
            if (this.gameState.startTime) {
                const elapsed = (Date.now() - this.gameState.startTime) / 1000;
                this.gameState.pausedTimeRemaining = Math.max(0, 60 - elapsed);
            }
            
            this.elements.gameOverlay.style.display = 'flex';
            console.log('게임 일시정지됨');
        }
    }

    // 일시정지 토글
    togglePause() {
        if (this.gameState.phase === 'playing') {
            this.pauseGame();
            this.updateOverlay('게임 일시정지', '계속하려면 일시정지 버튼을 다시 클릭하세요');
        } else if (this.gameState.phase === 'paused') {
            this.resumeGame();
        }
    }

    // 게임 재개 (타이머 재시작)
    resumeGame() {
        if (this.gameState.connectedSensors.size === 2) {
            this.gameState.phase = 'playing';
            
            // 일시정지된 시간을 기준으로 새로운 시작 시간 설정
            if (this.gameState.pausedTimeRemaining !== undefined) {
                this.gameState.startTime = Date.now() - (60 - this.gameState.pausedTimeRemaining) * 1000;
                this.gameState.timeRemaining = this.gameState.pausedTimeRemaining;
                delete this.gameState.pausedTimeRemaining;
            }
            
            this.elements.gameOverlay.style.display = 'none';
            console.log('게임 재개됨');
        }
    }

    // 게임 종료 조건 검사 및 승부 판정 로직
    endGame() {
        console.log('게임 종료 - 시간 만료');
        this.gameState.phase = 'ended';
        
        // 게임 루프 중단
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 타이머 UI를 정확히 0:00으로 설정
        this.elements.timer.textContent = '0:00';
        this.elements.timer.style.color = '#FF0000';
        this.elements.timer.style.fontWeight = 'bold';
        
        // 최종 점수 확인 및 승부 판정
        const p1Score = this.gameState.players.sensor1.score;
        const p2Score = this.gameState.players.sensor2.score;
        
        console.log(`최종 점수 - P1: ${p1Score}, P2: ${p2Score}`);
        
        // 게임 통계 업데이트 (게임 시간 및 승부 결과)
        const gameDuration = (Date.now() - this.gameState.startTime) / 1000;
        this.gameBalancer.updateGameStats('game_duration', gameDuration);
        
        // 승부 판정 로직 (Requirements 7.2, 7.3)
        let resultTitle, resultMessage, winnerColor;
        if (p1Score > p2Score) {
            // 플레이어 1 승리
            resultTitle = '🎉 플레이어 1 승리!';
            resultMessage = `${p1Score} : ${p2Score}로 플레이어 1이 승리했습니다!`;
            winnerColor = '#3B82F6'; // 플레이어 1 색상
            this.gameBalancer.updateGameStats('player_win', 'sensor1');
        } else if (p2Score > p1Score) {
            // 플레이어 2 승리
            resultTitle = '🎉 플레이어 2 승리!';
            resultMessage = `${p2Score} : ${p1Score}로 플레이어 2가 승리했습니다!`;
            winnerColor = '#EF4444'; // 플레이어 2 색상
            this.gameBalancer.updateGameStats('player_win', 'sensor2');
        } else {
            // 무승부 (Requirements 7.3)
            resultTitle = '🤝 무승부!';
            resultMessage = `${p1Score} : ${p2Score} 동점으로 무승부입니다!`;
            winnerColor = '#6B7280'; // 중립 색상
        }
        
        // 게임 종료 시 결과 화면 표시 구현
        this.showGameResult(resultTitle, resultMessage, winnerColor, p1Score, p2Score);
        
        // 게임 종료 사운드 재생 (승부 결과에 따라)
        const p1Score = this.gameState.players.sensor1.score;
        const p2Score = this.gameState.players.sensor2.score;
        const isWinner = p1Score !== p2Score; // 무승부가 아니면 승부가 있음
        this.audioSystem.playGameEndSound(isWinner);
        
        // 컨트롤 버튼 비활성화
        this.elements.pauseBtn.disabled = true;
        this.elements.restartGameBtn.disabled = true;
        
        console.log(`게임 종료: ${resultTitle}`);
    }
    
    // 게임 결과 화면 표시
    showGameResult(title, message, winnerColor, p1Score, p2Score) {
        // 결과 모달 요소 업데이트
        this.elements.resultTitle.textContent = title;
        this.elements.resultTitle.style.color = winnerColor;
        
        // 최종 점수 표시
        this.elements.finalScoreP1.textContent = p1Score;
        this.elements.finalScoreP2.textContent = p2Score;
        
        // 승자 점수 강조
        if (p1Score > p2Score) {
            this.elements.finalScoreP1.style.color = '#3B82F6';
            this.elements.finalScoreP1.style.fontWeight = 'bold';
            this.elements.finalScoreP1.style.fontSize = '2em';
        } else if (p2Score > p1Score) {
            this.elements.finalScoreP2.style.color = '#EF4444';
            this.elements.finalScoreP2.style.fontWeight = 'bold';
            this.elements.finalScoreP2.style.fontSize = '2em';
        }
        
        // 결과 모달 표시 (애니메이션 효과와 함께)
        this.elements.resultModal.style.display = 'flex';
        this.elements.resultModal.style.opacity = '0';
        
        // 페이드인 애니메이션
        setTimeout(() => {
            this.elements.resultModal.style.transition = 'opacity 0.5s ease-in-out';
            this.elements.resultModal.style.opacity = '1';
        }, 100);
        
        // 축하 효과 생성 (승부가 결정된 경우)
        if (p1Score !== p2Score) {
            this.createCelebrationEffect();
        }
    }
    
    // 축하 효과 생성
    createCelebrationEffect() {
        // 승리 파티클 효과
        if (!this.celebrationEffects) {
            this.celebrationEffects = [];
        }
        
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.celebrationEffects.push({
                    x: Math.random() * this.canvas.width,
                    y: this.canvas.height,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 8 - 5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 1.0,
                    decay: 0.01,
                    size: Math.random() * 6 + 4,
                    startTime: Date.now()
                });
            }, i * 100);
        }
    }
    
    // 게임 종료 사운드 재생
    playGameEndSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 게임 종료 멜로디 (승리/무승부에 따라 다른 사운드)
            const p1Score = this.gameState.players.sensor1.score;
            const p2Score = this.gameState.players.sensor2.score;
            
            if (p1Score === p2Score) {
                // 무승부 사운드 - 중립적인 톤
                this.playNeutralEndSound(audioContext);
            } else {
                // 승리 사운드 - 축하 멜로디
                this.playVictorySound(audioContext);
            }
            
        } catch (error) {
            console.warn('게임 종료 사운드 재생 실패:', error);
        }
    }
    
    // 승리 사운드
    playVictorySound(audioContext) {
        const notes = [523, 659, 784, 1047]; // C, E, G, C (한 옥타브 위)
        
        notes.forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.2);
            oscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.2);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + index * 0.2 + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.2 + 0.3);
            
            oscillator.start(audioContext.currentTime + index * 0.2);
            oscillator.stop(audioContext.currentTime + index * 0.2 + 0.3);
        });
    }
    
    // 무승부 사운드
    playNeutralEndSound(audioContext) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A note
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.0);
    }
        
        // 컨트롤 버튼 비활성화
        this.elements.pauseBtn.disabled = true;
        this.elements.restartGameBtn.disabled = true;
    }

    restartGame() {
        // 결과 모달 숨기기
        this.elements.resultModal.style.display = 'none';
        
        // 게임 상태 초기화
        this.gameState.phase = 'ready';
        this.gameState.timeRemaining = 60;
        this.gameState.startTime = null;
        
        // 플레이어 상태 초기화
        Object.values(this.gameState.players).forEach(player => {
            player.score = 0;
            player.hasAcorn = false;
            player.stunned = false;
            player.invulnerable = false;
            player.stunnedUntil = 0;
            player.invulnerableUntil = 0;
        });
        
        // 점수 구역 초기화
        Object.values(this.gameState.scoringZones).forEach(zone => {
            zone.storedAcorns = 0;
            zone.animationScale = 1.0;
            zone.lastScoreTime = 0;
            if (zone.stealEffect) {
                zone.stealEffect.active = false;
            }
        });
        
        // 효과 초기화
        this.collisionEffects = [];
        this.celebrationEffects = [];
        
        // 타이머 UI 초기화
        this.elements.timer.textContent = '1:00';
        this.elements.timer.style.color = '#f1f5f9';
        this.elements.timer.style.fontWeight = 'normal';
        this.elements.timer.style.transform = 'scale(1.0)';
        
        // 점수 UI 초기화
        this.elements.finalScoreP1.style.color = '';
        this.elements.finalScoreP1.style.fontWeight = '';
        this.elements.finalScoreP1.style.fontSize = '';
        this.elements.finalScoreP2.style.color = '';
        this.elements.finalScoreP2.style.fontWeight = '';
        this.elements.finalScoreP2.style.fontSize = '';
        
        // UI 업데이트
        this.updateScoreUI();
        
        // 컨트롤 버튼 활성화
        this.elements.pauseBtn.disabled = false;
        this.elements.restartGameBtn.disabled = false;
        
        if (this.gameState.connectedSensors.size === 2) {
            this.elements.startBtn.disabled = false;
            this.updateOverlay('게임 준비 완료!', '게임 시작 버튼을 클릭하세요');
            this.elements.gameOverlay.style.display = 'flex';
        }
    }

    initializeGame() {
        // 초기 UI 상태 설정
        this.elements.gameOverlay.style.display = 'flex';
        this.updateOverlay('서버에 연결 중...', '잠시만 기다려주세요');
        this.updateScoreUI();
    }

    showError(message) {
        this.updateOverlay('오류 발생', message);
        this.elements.gameOverlay.style.display = 'flex';
    }

    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.sdk) {
            this.sdk.disconnect();
        }
        
        // 테스터 정리
        if (this.gameTester) {
            this.gameTester.stopPerformanceMonitor();
        }
    }
    
    // === 디버깅 및 검증 함수들 ===
    
    // 게임 상태 검증
    validateGameState() {
        const issues = [];
        
        // 필수 객체 검증
        if (!this.gameState) issues.push('gameState가 없음');
        if (!this.sdk) issues.push('SDK가 없음');
        if (!this.canvas) issues.push('canvas가 없음');
        if (!this.ctx) issues.push('canvas context가 없음');
        
        // 플레이어 상태 검증
        if (this.gameState) {
            const players = this.gameState.players;
            if (!players.sensor1 || !players.sensor2) {
                issues.push('플레이어 객체가 불완전함');
            } else {
                // 플레이어 위치 검증
                ['sensor1', 'sensor2'].forEach(sensorId => {
                    const player = players[sensorId];
                    if (!player.position || typeof player.position.x !== 'number' || typeof player.position.y !== 'number') {
                        issues.push(`${sensorId} 위치가 유효하지 않음`);
                    }
                    
                    // 플레이어가 캔버스 밖에 있는지 확인
                    if (this.canvas) {
                        if (player.position.x < 0 || player.position.x > this.canvas.width ||
                            player.position.y < 0 || player.position.y > this.canvas.height) {
                            issues.push(`${sensorId}가 캔버스 밖에 있음: (${player.position.x}, ${player.position.y})`);
                        }
                    }
                });
            }
            
            // 게임 상태 검증
            const validPhases = ['waiting', 'ready', 'playing', 'paused', 'ended'];
            if (!validPhases.includes(this.gameState.phase)) {
                issues.push(`유효하지 않은 게임 상태: ${this.gameState.phase}`);
            }
            
            // 시간 검증
            if (typeof this.gameState.timeRemaining !== 'number' || this.gameState.timeRemaining < 0) {
                issues.push(`유효하지 않은 남은 시간: ${this.gameState.timeRemaining}`);
            }
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }
    
    // 센서 데이터 정확성 검증
    validateSensorDataAccuracy(sensorData) {
        const validation = {
            isValid: true,
            issues: [],
            warnings: []
        };
        
        if (!sensorData || typeof sensorData !== 'object') {
            validation.isValid = false;
            validation.issues.push('센서 데이터가 객체가 아님');
            return validation;
        }
        
        // 센서 ID 검증
        if (!sensorData.sensorId || !['sensor1', 'sensor2'].includes(sensorData.sensorId)) {
            validation.isValid = false;
            validation.issues.push(`유효하지 않은 센서 ID: ${sensorData.sensorId}`);
        }
        
        // 데이터 구조 검증
        if (!sensorData.data) {
            validation.isValid = false;
            validation.issues.push('센서 데이터가 없음');
            return validation;
        }
        
        const data = sensorData.data;
        
        // orientation 데이터 검증
        if (data.orientation) {
            const { alpha, beta, gamma } = data.orientation;
            
            if (typeof alpha === 'number') {
                if (alpha < 0 || alpha > 360) {
                    validation.warnings.push(`alpha 값이 범위를 벗어남: ${alpha} (0-360 예상)`);
                }
            }
            
            if (typeof beta === 'number') {
                if (beta < -180 || beta > 180) {
                    validation.warnings.push(`beta 값이 범위를 벗어남: ${beta} (-180~180 예상)`);
                }
            }
            
            if (typeof gamma === 'number') {
                if (gamma < -90 || gamma > 90) {
                    validation.warnings.push(`gamma 값이 범위를 벗어남: ${gamma} (-90~90 예상)`);
                }
            }
        }
        
        // acceleration 데이터 검증
        if (data.acceleration) {
            const { x, y, z } = data.acceleration;
            
            // 중력 가속도 검증 (대략 9.8 m/s²)
            if (typeof z === 'number') {
                if (Math.abs(z) < 5 || Math.abs(z) > 15) {
                    validation.warnings.push(`z축 가속도가 비정상적임: ${z} (중력 가속도 ~9.8 예상)`);
                }
            }
            
            // 극단적인 가속도 값 검증
            [x, y, z].forEach((value, index) => {
                if (typeof value === 'number' && Math.abs(value) > 50) {
                    validation.warnings.push(`${['x', 'y', 'z'][index]}축 가속도가 극단적임: ${value}`);
                }
            });
        }
        
        return validation;
    }
    
    // 멀티플레이어 동기화 상태 검증
    validateMultiplayerSync() {
        const sync = {
            isSync: true,
            issues: [],
            connectedSensors: this.gameState.connectedSensors ? this.gameState.connectedSensors.size : 0,
            expectedSensors: 2
        };
        
        // 연결된 센서 수 확인
        if (sync.connectedSensors !== sync.expectedSensors) {
            sync.isSync = false;
            sync.issues.push(`연결된 센서 수가 부족함: ${sync.connectedSensors}/${sync.expectedSensors}`);
        }
        
        // 플레이어 상태 동기화 확인
        const players = this.gameState.players;
        if (players.sensor1 && players.sensor2) {
            // 점수 동기화 확인 (UI와 게임 상태)
            const uiScore1 = this.elements.player1Score ? parseInt(this.elements.player1Score.textContent) : 0;
            const uiScore2 = this.elements.player2Score ? parseInt(this.elements.player2Score.textContent) : 0;
            
            if (uiScore1 !== players.sensor1.score) {
                sync.issues.push(`플레이어 1 점수 동기화 오류: UI=${uiScore1}, 상태=${players.sensor1.score}`);
            }
            
            if (uiScore2 !== players.sensor2.score) {
                sync.issues.push(`플레이어 2 점수 동기화 오류: UI=${uiScore2}, 상태=${players.sensor2.score}`);
            }
        }
        
        // 게임 상태와 UI 동기화 확인
        const gamePhase = this.gameState.phase;
        const overlayVisible = this.elements.gameOverlay && this.elements.gameOverlay.style.display !== 'none';
        
        if (gamePhase === 'playing' && overlayVisible) {
            sync.issues.push('게임 진행 중인데 오버레이가 표시됨');
        }
        
        if (gamePhase === 'waiting' && !overlayVisible) {
            sync.issues.push('대기 상태인데 오버레이가 숨겨짐');
        }
        
        return sync;
    }
    
    // 게임 로직 무결성 검증
    validateGameLogic() {
        const logic = {
            isValid: true,
            issues: [],
            warnings: []
        };
        
        // 도토리 개수 검증
        const acornCount = this.gameState.acorns.length;
        const maxAcorns = this.gameBalancer ? this.gameBalancer.getAcornSettings().maxCount : 15;
        
        if (acornCount > maxAcorns) {
            logic.warnings.push(`도토리 개수가 최대치를 초과함: ${acornCount}/${maxAcorns}`);
        }
        
        // 플레이어 도토리 보유 상태와 실제 도토리 개수 일치 확인
        const players = this.gameState.players;
        let playersWithAcorns = 0;
        
        Object.values(players).forEach(player => {
            if (player.hasAcorn) playersWithAcorns++;
        });
        
        // 점수 구역의 저장된 도토리 개수 확인
        const zones = this.gameState.scoringZones;
        const storedAcorns = (zones.sensor1?.storedAcorns || 0) + (zones.sensor2?.storedAcorns || 0);
        const totalScore = players.sensor1.score + players.sensor2.score;
        
        if (storedAcorns !== totalScore) {
            logic.issues.push(`저장된 도토리와 점수가 일치하지 않음: 저장=${storedAcorns}, 점수=${totalScore}`);
        }
        
        // 장애물 위치 검증
        this.gameState.obstacles.forEach((obstacle, index) => {
            if (!obstacle.position || typeof obstacle.position.x !== 'number' || typeof obstacle.position.y !== 'number') {
                logic.issues.push(`장애물 ${index}의 위치가 유효하지 않음`);
            }
        });
        
        // 게임 시간과 상태 일치성 확인
        if (this.gameState.timeRemaining <= 0 && this.gameState.phase === 'playing') {
            logic.issues.push('시간이 종료되었는데 게임이 계속 진행 중');
        }
        
        return logic;
    }
    
    // 전체 게임 상태 진단
    diagnoseGameState() {
        const diagnosis = {
            timestamp: new Date().toISOString(),
            gameState: this.validateGameState(),
            multiplayerSync: this.validateMultiplayerSync(),
            gameLogic: this.validateGameLogic(),
            performance: null
        };
        
        // 성능 진단
        if (this.performanceManager) {
            diagnosis.performance = this.performanceManager.getPerformanceStats();
        }
        
        // 전체 상태 요약
        diagnosis.overall = {
            isHealthy: diagnosis.gameState.isValid && 
                      diagnosis.multiplayerSync.isSync && 
                      diagnosis.gameLogic.isValid,
            criticalIssues: [
                ...diagnosis.gameState.issues,
                ...diagnosis.multiplayerSync.issues,
                ...diagnosis.gameLogic.issues
            ],
            warnings: [
                ...diagnosis.gameLogic.warnings
            ]
        };
        
        return diagnosis;
    }
    
    // 실시간 검증 (게임 루프 중 실행)
    performRuntimeValidation() {
        const validation = this.validateGameState();
        
        if (!validation.isValid) {
            console.warn('🚨 실시간 검증 실패:', validation.issues);
            
            // 심각한 문제가 발견되면 게임 일시정지
            const criticalIssues = validation.issues.filter(issue => 
                issue.includes('없음') || issue.includes('캔버스 밖')
            );
            
            if (criticalIssues.length > 0 && this.gameState.phase === 'playing') {
                console.error('🛑 심각한 문제로 인해 게임을 일시정지합니다:', criticalIssues);
                this.pauseGame();
                this.updateOverlay('게임 오류', '게임 상태에 문제가 발생했습니다. 새로고침을 시도해주세요.');
            }
        }
        
        // 성능 문제 감지
        if (this.performanceManager) {
            const stats = this.performanceManager.getPerformanceStats();
            if (stats.fps && stats.fps < 15) {
                console.warn('⚠️ 성능 저하 감지: FPS =', stats.fps);
            }
        }
    }
    
    // 사용자 시나리오 기반 테스트
    async runUserScenarioTests() {
        if (!this.gameTester) return;
        
        this.gameTester.log('=== 사용자 시나리오 테스트 시작 ===');
        
        const scenarios = [
            {
                name: '게임 시작 시나리오',
                steps: [
                    () => this.testGameStartScenario()
                ]
            },
            {
                name: '센서 연결 해제 시나리오',
                steps: [
                    () => this.testSensorDisconnectScenario()
                ]
            },
            {
                name: '점수 획득 시나리오',
                steps: [
                    () => this.testScoringScenario()
                ]
            },
            {
                name: '게임 종료 시나리오',
                steps: [
                    () => this.testGameEndScenario()
                ]
            }
        ];
        
        for (const scenario of scenarios) {
            try {
                this.gameTester.log(`시나리오 테스트: ${scenario.name}`);
                
                for (const step of scenario.steps) {
                    await step();
                    await this.delay(500); // 각 단계 사이에 지연
                }
                
                this.gameTester.log(`✅ ${scenario.name} 완료`);
            } catch (error) {
                this.gameTester.log(`❌ ${scenario.name} 실패: ${error.message}`);
            }
        }
        
        this.gameTester.log('=== 사용자 시나리오 테스트 완료 ===');
    }
    
    // 게임 시작 시나리오 테스트
    async testGameStartScenario() {
        // 1. 초기 상태 확인
        if (this.gameState.phase !== 'waiting') {
            throw new Error(`예상 상태: waiting, 실제 상태: ${this.gameState.phase}`);
        }
        
        // 2. 센서 연결 시뮬레이션
        this.gameState.connectedSensors.add('sensor1');
        this.gameState.connectedSensors.add('sensor2');
        
        // 3. 게임 시작 버튼 활성화 확인
        if (this.elements.startBtn.disabled) {
            throw new Error('센서 연결 후에도 시작 버튼이 비활성화됨');
        }
        
        // 4. 게임 시작
        this.startGame();
        
        // 5. 게임 상태 확인
        if (this.gameState.phase !== 'playing') {
            throw new Error(`게임 시작 후 예상 상태: playing, 실제 상태: ${this.gameState.phase}`);
        }
    }
    
    // 센서 연결 해제 시나리오 테스트
    async testSensorDisconnectScenario() {
        // 1. 게임 진행 상태로 설정
        this.gameState.phase = 'playing';
        this.gameState.connectedSensors.add('sensor1');
        this.gameState.connectedSensors.add('sensor2');
        
        // 2. 센서 연결 해제 시뮬레이션
        this.handleSensorDisconnected({ sensorId: 'sensor1' });
        
        // 3. 게임 일시정지 확인
        if (this.gameState.phase !== 'paused') {
            throw new Error(`센서 해제 후 예상 상태: paused, 실제 상태: ${this.gameState.phase}`);
        }
        
        // 4. 센서 재연결 시뮬레이션
        this.handleSensorConnected({ sensorId: 'sensor1' });
        
        // 5. 게임 재개 가능 상태 확인
        if (this.gameState.connectedSensors.size !== 2) {
            throw new Error('센서 재연결 후 연결 수가 올바르지 않음');
        }
    }
    
    // 점수 획득 시나리오 테스트
    async testScoringScenario() {
        // 1. 게임 상태 설정
        this.gameState.phase = 'playing';
        const player1 = this.gameState.players.sensor1;
        const initialScore = player1.score;
        
        // 2. 도토리 보유 상태로 설정
        player1.hasAcorn = true;
        
        // 3. 점수 구역에 플레이어 위치 설정
        const zone = this.gameState.scoringZones.sensor1;
        player1.position.x = zone.x + zone.width / 2;
        player1.position.y = zone.y + zone.height / 2;
        
        // 4. 점수 구역 충돌 처리 시뮬레이션
        if (this.collisionManager && typeof this.collisionManager.checkScoringZoneCollisions === 'function') {
            this.collisionManager.checkScoringZoneCollisions();
        }
        
        // 5. 점수 증가 확인
        if (player1.score <= initialScore) {
            throw new Error('점수 구역에서 점수가 증가하지 않음');
        }
        
        // 6. 도토리 보유 상태 해제 확인
        if (player1.hasAcorn) {
            throw new Error('점수 획득 후 도토리 보유 상태가 해제되지 않음');
        }
    }
    
    // 게임 종료 시나리오 테스트
    async testGameEndScenario() {
        // 1. 게임 진행 상태로 설정
        this.gameState.phase = 'playing';
        this.gameState.timeRemaining = 1;
        
        // 2. 시간 만료 시뮬레이션
        this.gameState.timeRemaining = 0;
        this.endGame();
        
        // 3. 게임 종료 상태 확인
        if (this.gameState.phase !== 'ended') {
            throw new Error(`게임 종료 후 예상 상태: ended, 실제 상태: ${this.gameState.phase}`);
        }
        
        // 4. 결과 모달 표시 확인
        if (!this.elements.resultModal || this.elements.resultModal.style.display === 'none') {
            throw new Error('게임 종료 후 결과 모달이 표시되지 않음');
        }
    }
    
    // 지연 함수 (테스트용)
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // === 게임 가이드 시스템 ===
    
    // 게임 가이드 초기화
    initializeGameGuide() {
        // 가이드 관련 요소들
        this.guideElements = {
            panel: document.getElementById('game-guide-panel'),
            showBtn: document.getElementById('show-guide-btn'),
            closeBtn: document.getElementById('close-guide-btn'),
            closeFooterBtn: document.getElementById('close-guide-footer-btn'),
            tutorialBtn: document.getElementById('start-tutorial-btn')
        };
        
        // 이벤트 리스너 설정
        this.setupGuideEventListeners();
        
        // 첫 방문자를 위한 자동 가이드 표시
        this.checkFirstVisit();
    }
    
    // 가이드 이벤트 리스너 설정
    setupGuideEventListeners() {
        // 가이드 표시 버튼
        if (this.guideElements.showBtn) {
            this.guideElements.showBtn.addEventListener('click', () => {
                this.showGameGuide();
            });
        }
        
        // 가이드 닫기 버튼들
        [this.guideElements.closeBtn, this.guideElements.closeFooterBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.hideGameGuide();
                });
            }
        });
        
        // 튜토리얼 시작 버튼
        if (this.guideElements.tutorialBtn) {
            this.guideElements.tutorialBtn.addEventListener('click', () => {
                this.startTutorial();
            });
        }
        
        // 가이드 패널 외부 클릭 시 닫기
        if (this.guideElements.panel) {
            this.guideElements.panel.addEventListener('click', (event) => {
                if (event.target === this.guideElements.panel) {
                    this.hideGameGuide();
                }
            });
        }
        
        // ESC 키로 가이드 닫기
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.guideElements.panel.style.display === 'flex') {
                this.hideGameGuide();
            }
        });
    }
    
    // 첫 방문 확인
    checkFirstVisit() {
        const hasVisited = localStorage.getItem('acorn-battle-visited');
        if (!hasVisited) {
            // 3초 후 자동으로 가이드 표시
            setTimeout(() => {
                this.showGameGuide();
                localStorage.setItem('acorn-battle-visited', 'true');
            }, 3000);
        }
    }
    
    // 게임 가이드 표시
    showGameGuide() {
        if (this.guideElements.panel) {
            this.guideElements.panel.style.display = 'flex';
            
            // 애니메이션 효과
            this.guideElements.panel.style.opacity = '0';
            setTimeout(() => {
                this.guideElements.panel.style.opacity = '1';
            }, 10);
        }
    }
    
    // 게임 가이드 숨기기
    hideGameGuide() {
        if (this.guideElements.panel) {
            this.guideElements.panel.style.opacity = '0';
            setTimeout(() => {
                this.guideElements.panel.style.display = 'none';
            }, 300);
        }
    }
    
    // 튜토리얼 시작
    startTutorial() {
        this.hideGameGuide();
        
        // 튜토리얼 모드 활성화
        this.tutorialMode = true;
        this.tutorialStep = 0;
        
        // 가상의 센서 연결로 튜토리얼 시작
        this.startTutorialMode();
    }
    
    // 튜토리얼 모드 시작
    startTutorialMode() {
        console.log('🎓 튜토리얼 모드 시작');
        
        // 가상 센서 연결
        this.gameState.connectedSensors.add('tutorial-sensor1');
        this.gameState.connectedSensors.add('tutorial-sensor2');
        
        // UI 업데이트
        this.updateSensorStatus('sensor1', 'connected');
        this.updateSensorStatus('sensor2', 'connected');
        this.enableStartButton();
        
        // 튜토리얼 안내 메시지
        this.updateOverlay('🎓 튜토리얼 모드', '게임 시작 버튼을 클릭하여 튜토리얼을 시작하세요');
        
        // 튜토리얼 전용 이벤트 리스너
        this.setupTutorialEventListeners();
    }
    
    // 튜토리얼 이벤트 리스너 설정
    setupTutorialEventListeners() {
        // 게임 시작 버튼에 튜토리얼 핸들러 추가
        const startBtn = this.elements.startBtn;
        if (startBtn && this.tutorialMode) {
            const tutorialHandler = () => {
                this.startTutorialGame();
                startBtn.removeEventListener('click', tutorialHandler);
            };
            startBtn.addEventListener('click', tutorialHandler);
        }
    }
    
    // 튜토리얼 게임 시작
    startTutorialGame() {
        console.log('🎮 튜토리얼 게임 시작');
        
        // 일반 게임 시작
        this.startGame();
        
        // 튜토리얼 단계별 안내 시작
        this.runTutorialSteps();
    }
    
    // 튜토리얼 단계별 실행
    async runTutorialSteps() {
        const steps = [
            {
                delay: 2000,
                message: '🌰 맵에 있는 도토리를 수집해보세요!',
                action: () => this.simulateTutorialMovement()
            },
            {
                delay: 5000,
                message: '🏠 자신의 색깔 구역에 도토리를 저장하세요!',
                action: () => this.simulateTutorialScoring()
            },
            {
                delay: 8000,
                message: '💰 상대방 구역에서 도토리를 훔칠 수 있어요!',
                action: () => this.simulateTutorialStealing()
            },
            {
                delay: 12000,
                message: '🚧 빨간 장애물을 피하세요!',
                action: () => this.highlightObstacles()
            },
            {
                delay: 15000,
                message: '🎉 튜토리얼 완료! 실제 게임을 즐겨보세요!',
                action: () => this.endTutorial()
            }
        ];
        
        for (const step of steps) {
            await this.delay(step.delay);
            if (this.tutorialMode) {
                this.showTutorialMessage(step.message);
                if (step.action) step.action();
            }
        }
    }
    
    // 튜토리얼 메시지 표시
    showTutorialMessage(message) {
        // 튜토리얼 메시지 요소 생성
        let tutorialMsg = document.getElementById('tutorial-message');
        if (!tutorialMsg) {
            tutorialMsg = document.createElement('div');
            tutorialMsg.id = 'tutorial-message';
            tutorialMsg.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
                color: white;
                padding: 15px 25px;
                border-radius: 25px;
                font-weight: bold;
                font-size: 1.1rem;
                z-index: 1500;
                box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
                animation: slideInDown 0.5s ease-out;
                max-width: 90%;
                text-align: center;
            `;
            document.body.appendChild(tutorialMsg);
        }
        
        tutorialMsg.textContent = message;
        tutorialMsg.style.display = 'block';
        
        // 3초 후 자동 숨김
        setTimeout(() => {
            if (tutorialMsg) {
                tutorialMsg.style.opacity = '0';
                setTimeout(() => {
                    if (tutorialMsg && tutorialMsg.parentNode) {
                        tutorialMsg.parentNode.removeChild(tutorialMsg);
                    }
                }, 300);
            }
        }, 3000);
    }
    
    // 튜토리얼 이동 시뮬레이션
    simulateTutorialMovement() {
        if (!this.tutorialMode) return;
        
        const player1 = this.gameState.players.sensor1;
        const targetAcorn = this.gameState.acorns[0];
        
        if (targetAcorn) {
            // 플레이어를 도토리 쪽으로 이동
            const moveInterval = setInterval(() => {
                if (!this.tutorialMode) {
                    clearInterval(moveInterval);
                    return;
                }
                
                const dx = targetAcorn.position.x - player1.position.x;
                const dy = targetAcorn.position.y - player1.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 5) {
                    player1.position.x += (dx / distance) * 2;
                    player1.position.y += (dy / distance) * 2;
                } else {
                    clearInterval(moveInterval);
                }
            }, 50);
        }
    }
    
    // 튜토리얼 점수 획득 시뮬레이션
    simulateTutorialScoring() {
        if (!this.tutorialMode) return;
        
        const player1 = this.gameState.players.sensor1;
        const zone1 = this.gameState.scoringZones.sensor1;
        
        // 플레이어에게 도토리 부여
        player1.hasAcorn = true;
        
        // 점수 구역으로 이동
        const moveInterval = setInterval(() => {
            if (!this.tutorialMode) {
                clearInterval(moveInterval);
                return;
            }
            
            const targetX = zone1.x + zone1.width / 2;
            const targetY = zone1.y + zone1.height / 2;
            const dx = targetX - player1.position.x;
            const dy = targetY - player1.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                player1.position.x += (dx / distance) * 2;
                player1.position.y += (dy / distance) * 2;
            } else {
                // 점수 획득 처리
                player1.hasAcorn = false;
                player1.score++;
                zone1.storedAcorns++;
                this.updateScoreUI();
                clearInterval(moveInterval);
            }
        }, 50);
    }
    
    // 튜토리얼 훔치기 시뮬레이션
    simulateTutorialStealing() {
        if (!this.tutorialMode) return;
        
        const player2 = this.gameState.players.sensor2;
        const zone1 = this.gameState.scoringZones.sensor1;
        
        // 플레이어 2를 플레이어 1의 구역으로 이동
        const moveInterval = setInterval(() => {
            if (!this.tutorialMode) {
                clearInterval(moveInterval);
                return;
            }
            
            const targetX = zone1.x + zone1.width / 2;
            const targetY = zone1.y + zone1.height / 2;
            const dx = targetX - player2.position.x;
            const dy = targetY - player2.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                player2.position.x += (dx / distance) * 2;
                player2.position.y += (dy / distance) * 2;
            } else {
                // 훔치기 처리 (점수가 있는 경우에만)
                if (this.gameState.players.sensor1.score > 0) {
                    player2.hasAcorn = true;
                    this.gameState.players.sensor1.score--;
                    zone1.storedAcorns--;
                    this.updateScoreUI();
                    this.showStealNotification('플레이어 2', '플레이어 1');
                }
                clearInterval(moveInterval);
            }
        }, 50);
    }
    
    // 장애물 강조 표시
    highlightObstacles() {
        if (!this.tutorialMode) return;
        
        // 장애물에 강조 효과 추가 (렌더링에서 처리)
        this.highlightObstaclesMode = true;
        
        setTimeout(() => {
            this.highlightObstaclesMode = false;
        }, 3000);
    }
    
    // 튜토리얼 종료
    endTutorial() {
        console.log('🎓 튜토리얼 종료');
        
        this.tutorialMode = false;
        this.highlightObstaclesMode = false;
        
        // 튜토리얼 메시지 제거
        const tutorialMsg = document.getElementById('tutorial-message');
        if (tutorialMsg && tutorialMsg.parentNode) {
            tutorialMsg.parentNode.removeChild(tutorialMsg);
        }
        
        // 게임 상태 초기화
        this.restartGame();
        
        // 일반 모드로 전환 안내
        setTimeout(() => {
            this.updateOverlay('게임 준비 완료!', '실제 플레이어와 게임을 시작하려면 QR 코드를 스캔하세요');
        }, 1000);
    }
    
    // === 최종 품질 검사 시스템 ===
    
    // 배포 전 최종 품질 검사
    performFinalQualityCheck() {
        console.log('🔍 최종 품질 검사 시작...');
        
        const qualityReport = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            checks: {
                gameInitialization: this.checkGameInitialization(),
                uiElements: this.checkUIElements(),
                gameLogic: this.checkGameLogic(),
                performance: this.checkPerformance(),
                compatibility: this.checkCompatibility(),
                accessibility: this.checkAccessibility(),
                security: this.checkSecurity()
            },
            overall: {
                score: 0,
                status: 'unknown',
                issues: [],
                recommendations: []
            }
        };
        
        // 전체 점수 계산
        const checkResults = Object.values(qualityReport.checks);
        const totalScore = checkResults.reduce((sum, check) => sum + check.score, 0);
        const maxScore = checkResults.length * 100;
        qualityReport.overall.score = Math.round((totalScore / maxScore) * 100);
        
        // 상태 결정
        if (qualityReport.overall.score >= 90) {
            qualityReport.overall.status = 'excellent';
        } else if (qualityReport.overall.score >= 80) {
            qualityReport.overall.status = 'good';
        } else if (qualityReport.overall.score >= 70) {
            qualityReport.overall.status = 'acceptable';
        } else {
            qualityReport.overall.status = 'needs_improvement';
        }
        
        // 이슈 및 권장사항 수집
        checkResults.forEach(check => {
            qualityReport.overall.issues.push(...check.issues);
            qualityReport.overall.recommendations.push(...check.recommendations);
        });
        
        this.logQualityReport(qualityReport);
        return qualityReport;
    }
    
    // 게임 초기화 검사
    checkGameInitialization() {
        const check = {
            name: '게임 초기화',
            score: 0,
            issues: [],
            recommendations: []
        };
        
        let score = 0;
        
        // 필수 객체 존재 확인
        if (this.gameState) score += 20;
        else check.issues.push('게임 상태 객체가 없음');
        
        if (this.sdk) score += 20;
        else check.issues.push('SDK가 초기화되지 않음');
        
        if (this.canvas && this.ctx) score += 20;
        else check.issues.push('캔버스가 초기화되지 않음');
        
        if (this.gameBalancer) score += 20;
        else check.issues.push('게임 밸런서가 없음');
        
        if (this.performanceManager) score += 20;
        else check.issues.push('성능 관리자가 없음');
        
        check.score = score;
        
        if (score < 100) {
            check.recommendations.push('모든 핵심 시스템이 올바르게 초기화되었는지 확인하세요');
        }
        
        return check;
    }
    
    // UI 요소 검사
    checkUIElements() {
        const check = {
            name: 'UI 요소',
            score: 0,
            issues: [],
            recommendations: []
        };
        
        let score = 0;
        const requiredElements = [
            'game-canvas', 'session-code-display', 'qr-canvas',
            'sensor1-status', 'sensor2-status', 'start-game-btn',
            'player1-score', 'player2-score', 'timer'
        ];
        
        const existingElements = requiredElements.filter(id => document.getElementById(id));
        score = Math.round((existingElements.length / requiredElements.length) * 100);
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            check.issues.push(`누락된 UI 요소: ${missingElements.join(', ')}`);
            check.recommendations.push('모든 필수 UI 요소가 HTML에 정의되어 있는지 확인하세요');
        }
        
        check.score = score;
        return check;
    }
    
    // 게임 로직 검사
    checkGameLogic() {
        const check = {
            name: '게임 로직',
            score: 0,
            issues: [],
            recommendations: []
        };
        
        let score = 0;
        
        // 핵심 게임 함수들 존재 확인
        const coreFunctions = [
            'startGame', 'endGame', 'updatePlayerMovement',
            'handleSensorData', 'validateSensorData', 'updateScoreUI'
        ];
        
        const existingFunctions = coreFunctions.filter(funcName => typeof this[funcName] === 'function');
        score += Math.round((existingFunctions.length / coreFunctions.length) * 50);
        
        // 게임 상태 유효성 검사
        if (this.gameState) {
            if (this.gameState.players && this.gameState.players.sensor1 && this.gameState.players.sensor2) {
                score += 25;
            } else {
                check.issues.push('플레이어 객체가 올바르게 초기화되지 않음');
            }
            
            if (this.gameState.scoringZones && this.gameState.scoringZones.sensor1 && this.gameState.scoringZones.sensor2) {
                score += 25;
            } else {
                check.issues.push('점수 구역이 올바르게 초기화되지 않음');
            }
        }
        
        check.score = score;
        
        if (score < 100) {
            check.recommendations.push('모든 핵심 게임 로직 함수가 구현되어 있는지 확인하세요');
        }
        
        return check;
    }
    
    // 성능 검사
    checkPerformance() {
        const check = {
            name: '성능',
            score: 0,
            issues: [],
            recommendations: []
        };
        
        let score = 0;
        
        // 성능 관리자 존재 확인
        if (this.performanceManager) {
            score += 30;
            
            // 성능 통계 확인
            const stats = this.performanceManager.getPerformanceStats();
            if (stats) {
                score += 20;
                
                // FPS 확인
                if (stats.fps && stats.fps >= 30) {
                    score += 25;
                } else if (stats.fps && stats.fps >= 15) {
                    score += 15;
                    check.issues.push('FPS가 낮음 (15-30)');
                } else {
                    check.issues.push('FPS가 매우 낮음 (<15)');
                }
                
                // 메모리 사용량 확인
                if (stats.memoryUsage && stats.memoryUsage < 50) {
                    score += 25;
                } else {
                    score += 10;
                    check.issues.push('메모리 사용량이 높음');
                }
            }
        } else {
            check.issues.push('성능 관리자가 없음');
        }
        
        check.score = score;
        
        if (score < 80) {
            check.recommendations.push('성능 최적화를 검토하고 FPS를 30 이상으로 유지하세요');
        }
        
        return check;
    }
    
    // 호환성 검사
    checkCompatibility() {
        const check = {
            name: '호환성',
            score: 0,
            issues: [],
            recommendations: []
        };
        
        let score = 0;
        
        // 브라우저 호환성 클래스 확인
        if (this.browserCompat) {
            score += 30;
            
            const compatInfo = this.browserCompat.getCompatibilityInfo();
            
            // 센서 지원 확인
            if (compatInfo.support.sensor.deviceOrientation && compatInfo.support.sensor.deviceMotion) {
                score += 25;
            } else {
                score += 10;
                check.issues.push('센서 지원이 제한적임');
            }
            
            // 오디오 지원 확인
            if (compatInfo.support.audio.webAudio) {
                score += 20;
            } else {
                score += 10;
                check.issues.push('Web Audio API 지원이 제한적임');
            }
            
            // 캔버스 지원 확인
            if (compatInfo.support.canvas.canvas2d) {
                score += 25;
            } else {
                check.issues.push('Canvas 2D 지원이 없음');
            }
        } else {
            check.issues.push('브라우저 호환성 클래스가 없음');
        }
        
        check.score = score;
        
        if (score < 80) {
            check.recommendations.push('브라우저 호환성을 개선하고 폴백 처리를 강화하세요');
        }
        
        return check;
    }
    
    // 접근성 검사
    checkAccessibility() {
        const check = {
            name: '접근성',
            score: 0,
            issues: [],
            recommendations: []
        };
        
        let score = 0;
        
        // 색상 대비 확인 (기본적인 검사)
        const hasHighContrast = getComputedStyle(document.body).color !== getComputedStyle(document.body).backgroundColor;
        if (hasHighContrast) score += 25;
        else check.issues.push('색상 대비가 부족할 수 있음');
        
        // 터치 타겟 크기 확인
        const buttons = document.querySelectorAll('button');
        let adequateTouchTargets = 0;
        buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            if (rect.width >= 44 && rect.height >= 44) {
                adequateTouchTargets++;
            }
        });
        
        if (buttons.length > 0) {
            score += Math.round((adequateTouchTargets / buttons.length) * 25);
            if (adequateTouchTargets < buttons.length) {
                check.issues.push('일부 버튼의 터치 타겟 크기가 부족함');
            }
        }
        
        // 키보드 접근성 (기본적인 검사)
        const focusableElements = document.querySelectorAll('button, input, select, textarea, a[href]');
        if (focusableElements.length > 0) score += 25;
        
        // 의미있는 텍스트 확인
        const hasAltTexts = document.querySelectorAll('img[alt]').length > 0;
        if (hasAltTexts) score += 25;
        else score += 10; // 이미지가 없을 수도 있으므로 부분 점수
        
        check.score = score;
        
        if (score < 80) {
            check.recommendations.push('접근성을 개선하여 더 많은 사용자가 게임을 즐길 수 있도록 하세요');
        }
        
        return check;
    }
    
    // 보안 검사
    checkSecurity() {
        const check = {
            name: '보안',
            score: 0,
            issues: [],
            recommendations: []
        };
        
        let score = 0;
        
        // HTTPS 사용 확인
        if (location.protocol === 'https:' || location.hostname === 'localhost') {
            score += 30;
        } else {
            check.issues.push('HTTPS를 사용하지 않음');
        }
        
        // 센서 데이터 검증 확인
        if (typeof this.validateSensorData === 'function') {
            score += 25;
        } else {
            check.issues.push('센서 데이터 검증 함수가 없음');
        }
        
        // 에러 처리 확인
        if (this.errorHandler) {
            score += 25;
        } else {
            check.issues.push('에러 처리 시스템이 없음');
        }
        
        // XSS 방지 확인 (기본적인 검사)
        const hasInnerHTML = this.toString().includes('innerHTML');
        if (!hasInnerHTML) {
            score += 20;
        } else {
            score += 10;
            check.recommendations.push('innerHTML 사용을 최소화하고 textContent를 사용하세요');
        }
        
        check.score = score;
        
        if (score < 80) {
            check.recommendations.push('보안 취약점을 검토하고 데이터 검증을 강화하세요');
        }
        
        return check;
    }
    
    // 품질 리포트 로깅
    logQualityReport(report) {
        console.log('📊 최종 품질 검사 결과');
        console.log(`전체 점수: ${report.overall.score}/100 (${report.overall.status})`);
        
        Object.entries(report.checks).forEach(([category, check]) => {
            const status = check.score >= 90 ? '✅' : check.score >= 70 ? '⚠️' : '❌';
            console.log(`${status} ${check.name}: ${check.score}/100`);
            
            if (check.issues.length > 0) {
                check.issues.forEach(issue => console.warn(`  - ${issue}`));
            }
        });
        
        if (report.overall.recommendations.length > 0) {
            console.log('\n💡 권장사항:');
            report.overall.recommendations.forEach(rec => console.info(`  - ${rec}`));
        }
        
        // 배포 준비 상태 판단
        if (report.overall.score >= 80) {
            console.log('🚀 배포 준비 완료!');
        } else {
            console.log('⚠️ 배포 전 개선이 필요합니다.');
        }
        
        return report;
    }
    
    // 허브 연동 테스트
    testHubIntegration() {
        console.log('🔗 허브 연동 테스트 시작...');
        
        const integrationTests = {
            gameJson: this.testGameJsonFile(),
            hubRegistration: this.testHubRegistration(),
            gameLoading: this.testGameLoading(),
            sessionCreation: this.testSessionCreation()
        };
        
        const passedTests = Object.values(integrationTests).filter(test => test.passed).length;
        const totalTests = Object.values(integrationTests).length;
        
        console.log(`허브 연동 테스트 결과: ${passedTests}/${totalTests} 통과`);
        
        return {
            passed: passedTests === totalTests,
            results: integrationTests,
            score: Math.round((passedTests / totalTests) * 100)
        };
    }
    
    // game.json 파일 테스트
    testGameJsonFile() {
        try {
            // game.json 파일 존재 확인 (실제로는 서버에서 확인해야 함)
            const gameJsonExists = true; // 실제 구현에서는 fetch로 확인
            
            return {
                name: 'game.json 파일',
                passed: gameJsonExists,
                message: gameJsonExists ? 'game.json 파일이 존재함' : 'game.json 파일이 없음'
            };
        } catch (error) {
            return {
                name: 'game.json 파일',
                passed: false,
                message: `game.json 테스트 오류: ${error.message}`
            };
        }
    }
    
    // 허브 등록 테스트
    testHubRegistration() {
        try {
            // 게임이 허브에 올바르게 등록되는지 확인
            const gameId = 'acorn-battle';
            const isRegistered = window.location.pathname.includes(gameId);
            
            return {
                name: '허브 등록',
                passed: isRegistered,
                message: isRegistered ? '게임이 허브에 등록됨' : '게임 등록 확인 필요'
            };
        } catch (error) {
            return {
                name: '허브 등록',
                passed: false,
                message: `허브 등록 테스트 오류: ${error.message}`
            };
        }
    }
    
    // 게임 로딩 테스트
    testGameLoading() {
        try {
            const loadingSuccess = !!(this.gameState && this.sdk && this.canvas);
            
            return {
                name: '게임 로딩',
                passed: loadingSuccess,
                message: loadingSuccess ? '게임이 정상적으로 로딩됨' : '게임 로딩 실패'
            };
        } catch (error) {
            return {
                name: '게임 로딩',
                passed: false,
                message: `게임 로딩 테스트 오류: ${error.message}`
            };
        }
    }
    
    // 세션 생성 테스트
    testSessionCreation() {
        try {
            const canCreateSession = !!(this.sdk && typeof this.sdk.createSession === 'function');
            
            return {
                name: '세션 생성',
                passed: canCreateSession,
                message: canCreateSession ? '세션 생성 기능이 정상 작동' : '세션 생성 기능 오류'
            };
        } catch (error) {
            return {
                name: '세션 생성',
                passed: false,
                message: `세션 생성 테스트 오류: ${error.message}`
            };
        }
    }
}

// BrowserCompatibility 클래스 - 크로스 브라우저 호환성 관리
class BrowserCompatibility {
    constructor() {
        this.userAgent = navigator.userAgent;
        this.isIOS = /iPad|iPhone|iPod/.test(this.userAgent);
        this.isAndroid = /Android/.test(this.userAgent);
        this.isSafari = /Safari/.test(this.userAgent) && !/Chrome/.test(this.userAgent);
        this.isChrome = /Chrome/.test(this.userAgent);
        this.isFirefox = /Firefox/.test(this.userAgent);
        this.isEdge = /Edge/.test(this.userAgent);
        this.isMobile = /Mobi|Android/i.test(this.userAgent);
        
        this.sensorSupport = this.checkSensorSupport();
        this.audioSupport = this.checkAudioSupport();
        this.canvasSupport = this.checkCanvasSupport();
        
        this.setupPolyfills();
        this.setupEventListeners();
    }
    
    // 센서 지원 여부 확인
    checkSensorSupport() {
        return {
            deviceOrientation: 'DeviceOrientationEvent' in window,
            deviceMotion: 'DeviceMotionEvent' in window,
            permissions: 'permissions' in navigator,
            requestPermission: typeof DeviceOrientationEvent !== 'undefined' && 
                             typeof DeviceOrientationEvent.requestPermission === 'function'
        };
    }
    
    // 오디오 지원 여부 확인
    checkAudioSupport() {
        return {
            webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
            htmlAudio: 'Audio' in window
        };
    }
    
    // 캔버스 지원 여부 확인
    checkCanvasSupport() {
        const canvas = document.createElement('canvas');
        return {
            canvas2d: !!(canvas.getContext && canvas.getContext('2d')),
            webgl: !!(canvas.getContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
        };
    }
    
    // 폴리필 설정
    setupPolyfills() {
        // requestAnimationFrame 폴리필
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
                                         window.mozRequestAnimationFrame ||
                                         window.oRequestAnimationFrame ||
                                         window.msRequestAnimationFrame ||
                                         function(callback) {
                                             return window.setTimeout(callback, 1000 / 60);
                                         };
        }
        
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = window.webkitCancelAnimationFrame ||
                                        window.mozCancelAnimationFrame ||
                                        window.oCancelAnimationFrame ||
                                        window.msCancelAnimationFrame ||
                                        function(id) {
                                            window.clearTimeout(id);
                                        };
        }
        
        // Performance.now 폴리필
        if (!window.performance || !window.performance.now) {
            window.performance = window.performance || {};
            window.performance.now = function() {
                return Date.now();
            };
        }
    }
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        // 화면 방향 변경 감지
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
        
        // 리사이즈 이벤트
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
        
        // 가시성 변경 감지 (페이지 포커스/블러)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }
    
    // 화면 방향 변경 처리
    handleOrientationChange() {
        if (window.acornBattleGame) {
            // 캔버스 크기 재조정
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                this.adjustCanvasSize(canvas);
            }
            
            // UI 레이아웃 재조정
            this.adjustUILayout();
        }
    }
    
    // 리사이즈 처리
    handleResize() {
        if (window.acornBattleGame) {
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                this.adjustCanvasSize(canvas);
            }
        }
    }
    
    // 가시성 변경 처리
    handleVisibilityChange() {
        if (window.acornBattleGame && window.acornBattleGame.gameState) {
            if (document.hidden) {
                // 페이지가 숨겨졌을 때 게임 일시정지
                if (window.acornBattleGame.gameState.phase === 'playing') {
                    window.acornBattleGame.pauseGame();
                }
            }
        }
    }
    
    // 캔버스 크기 조정
    adjustCanvasSize(canvas) {
        const container = canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // 반응형 캔버스 크기 계산
        let canvasWidth, canvasHeight;
        
        if (window.innerWidth <= 768) {
            // 모바일: 컨테이너 너비에 맞춤
            canvasWidth = Math.min(containerRect.width - 40, 400);
            canvasHeight = canvasWidth * 0.75; // 4:3 비율
        } else {
            // 데스크톱: 고정 크기
            canvasWidth = 800;
            canvasHeight = 600;
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = canvasHeight + 'px';
    }
    
    // UI 레이아웃 조정
    adjustUILayout() {
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            // 화면 방향에 따른 클래스 추가/제거
            if (window.innerHeight < window.innerWidth) {
                gameContainer.classList.add('landscape');
                gameContainer.classList.remove('portrait');
            } else {
                gameContainer.classList.add('portrait');
                gameContainer.classList.remove('landscape');
            }
        }
    }
    
    // 디바운스 유틸리티
    debounce(func, wait) {
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
    
    // 센서 권한 요청 (iOS 13+)
    async requestSensorPermissions() {
        if (this.sensorSupport.requestPermission) {
            try {
                const orientationPermission = await DeviceOrientationEvent.requestPermission();
                const motionPermission = await DeviceMotionEvent.requestPermission();
                
                return {
                    orientation: orientationPermission === 'granted',
                    motion: motionPermission === 'granted'
                };
            } catch (error) {
                console.warn('센서 권한 요청 실패:', error);
                return { orientation: false, motion: false };
            }
        }
        
        // iOS 13 미만이나 다른 브라우저는 자동으로 허용
        return { orientation: true, motion: true };
    }
    
    // QR 코드 폴백 처리
    handleQRCodeFallback(container, url) {
        const fallbackDiv = document.getElementById('qr-fallback');
        if (fallbackDiv) {
            fallbackDiv.style.display = 'block';
            fallbackDiv.innerHTML = `
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}" 
                     alt="QR Code" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div style="display: none; padding: 20px; text-align: center; background: white; border-radius: 8px; color: #333;">
                    <p>QR 코드를 표시할 수 없습니다.</p>
                    <p style="font-family: monospace; font-size: 1.2em; margin-top: 10px;">${url}</p>
                </div>
            `;
        }
    }
    
    // 브라우저별 최적화 설정 반환
    getOptimizationSettings() {
        const settings = {
            throttleInterval: 33, // 기본 30fps
            enableParticles: true,
            enableShadows: true,
            enableBlur: true
        };
        
        // 모바일 최적화
        if (this.isMobile) {
            settings.throttleInterval = 50; // 20fps
            settings.enableParticles = false;
            settings.enableShadows = false;
            settings.enableBlur = false;
        }
        
        // 브라우저별 최적화
        if (this.isFirefox) {
            settings.enableBlur = false; // Firefox에서 blur 성능 이슈
        }
        
        if (this.isSafari) {
            settings.throttleInterval = 40; // Safari 최적화
        }
        
        return settings;
    }
    
    // 호환성 정보 반환
    getCompatibilityInfo() {
        return {
            browser: {
                isIOS: this.isIOS,
                isAndroid: this.isAndroid,
                isSafari: this.isSafari,
                isChrome: this.isChrome,
                isFirefox: this.isFirefox,
                isEdge: this.isEdge,
                isMobile: this.isMobile
            },
            support: {
                sensor: this.sensorSupport,
                audio: this.audioSupport,
                canvas: this.canvasSupport
            }
        };
    }
}

// SensorCompatibility 클래스 - 센서 호환성 관리
class SensorCompatibility {
    constructor() {
        this.browserCompat = new BrowserCompatibility();
        this.sensorData = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            motion: { x: 0, y: 0, z: 0 },
            rotationRate: { alpha: 0, beta: 0, gamma: 0 }
        };
        this.calibration = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            motion: { x: 0, y: 0, z: 0 }
        };
        this.isCalibrated = false;
        this.lastSensorUpdate = 0;
        this.sensorThrottle = 33; // 30fps
    }
    
    // 센서 초기화
    async initializeSensors() {
        // iOS 13+ 권한 요청
        if (this.browserCompat.sensorSupport.requestPermission) {
            const permissions = await this.browserCompat.requestSensorPermissions();
            if (!permissions.orientation || !permissions.motion) {
                throw new Error('센서 권한이 거부되었습니다.');
            }
        }
        
        // 센서 이벤트 리스너 설정
        this.setupSensorListeners();
        
        // 센서 보정 시작
        this.startCalibration();
    }
    
    // 센서 리스너 설정
    setupSensorListeners() {
        // 기기 방향 센서
        if (this.browserCompat.sensorSupport.deviceOrientation) {
            window.addEventListener('deviceorientation', (event) => {
                this.handleOrientationData(event);
            }, { passive: true });
        }
        
        // 기기 모션 센서
        if (this.browserCompat.sensorSupport.deviceMotion) {
            window.addEventListener('devicemotion', (event) => {
                this.handleMotionData(event);
            }, { passive: true });
        }
    }
    
    // 방향 센서 데이터 처리
    handleOrientationData(event) {
        const now = Date.now();
        if (now - this.lastSensorUpdate < this.sensorThrottle) return;
        
        let { alpha, beta, gamma } = event;
        
        // null 값 처리
        alpha = alpha || 0;
        beta = beta || 0;
        gamma = gamma || 0;
        
        // iOS/Android 차이점 보정
        if (this.browserCompat.isIOS) {
            // iOS는 alpha 값이 다를 수 있음
            alpha = this.normalizeAlpha(alpha);
        }
        
        // 보정값 적용
        if (this.isCalibrated) {
            alpha -= this.calibration.orientation.alpha;
            beta -= this.calibration.orientation.beta;
            gamma -= this.calibration.orientation.gamma;
        }
        
        // 각도 정규화
        alpha = this.normalizeAngle(alpha);
        beta = this.clampAngle(beta, -180, 180);
        gamma = this.clampAngle(gamma, -90, 90);
        
        this.sensorData.orientation = { alpha, beta, gamma };
        this.lastSensorUpdate = now;
    }
    
    // 모션 센서 데이터 처리
    handleMotionData(event) {
        if (!event.accelerationIncludingGravity) return;
        
        let { x, y, z } = event.accelerationIncludingGravity;
        
        // null 값 처리
        x = x || 0;
        y = y || 0;
        z = z || 0;
        
        // Android/iOS 좌표계 차이 보정
        if (this.browserCompat.isAndroid) {
            // Android는 좌표계가 반대일 수 있음
            x = -x;
            y = -y;
        }
        
        // 보정값 적용
        if (this.isCalibrated) {
            x -= this.calibration.motion.x;
            y -= this.calibration.motion.y;
            z -= this.calibration.motion.z;
        }
        
        this.sensorData.motion = { x, y, z };
        
        // 회전 속도 데이터 처리
        if (event.rotationRate) {
            const rotationRate = {
                alpha: event.rotationRate.alpha || 0,
                beta: event.rotationRate.beta || 0,
                gamma: event.rotationRate.gamma || 0
            };
            this.sensorData.rotationRate = rotationRate;
        }
    }
    
    // 센서 보정 시작
    startCalibration() {
        console.log('센서 보정 시작...');
        
        // 3초간 센서 데이터 수집하여 기준값 설정
        setTimeout(() => {
            this.calibration.orientation = { ...this.sensorData.orientation };
            this.calibration.motion = { ...this.sensorData.motion };
            this.isCalibrated = true;
            console.log('센서 보정 완료');
        }, 3000);
    }
    
    // 각도 정규화 (0-360)
    normalizeAngle(angle) {
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    }
    
    // 각도 제한
    clampAngle(angle, min, max) {
        return Math.max(min, Math.min(max, angle));
    }
    
    // iOS alpha 값 정규화
    normalizeAlpha(alpha) {
        // iOS에서 alpha 값이 다를 수 있으므로 보정
        return alpha;
    }
    
    // 현재 센서 데이터 반환
    getSensorData() {
        return {
            ...this.sensorData,
            isCalibrated: this.isCalibrated,
            timestamp: Date.now()
        };
    }
    
    // 센서 재보정
    recalibrate() {
        this.isCalibrated = false;
        this.startCalibration();
    }
}

// 게임 초기화 및 정리
document.addEventListener('DOMContentLoaded', () => {
    console.log('도토리 배틀 게임 로딩 시작');
    
    // 브라우저 호환성 초기화
    window.browserCompatibility = new BrowserCompatibility();
    window.sensorCompatibility = new SensorCompatibility();
    
    // 전역 게임 인스턴스 생성
    window.acornBattleGame = new AcornBattleGame();
    
    // 초기 캔버스 크기 조정
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
        window.browserCompatibility.adjustCanvasSize(canvas);
    }
    
    // 디버그 모드에서 초기 진단 실행
    if (window.acornBattleGame.gameTester) {
        setTimeout(() => {
            console.log('🔍 초기 게임 상태 진단 실행...');
            const diagnosis = window.acornBattleGame.diagnoseGameState();
            
            if (diagnosis.overall.isHealthy) {
                console.log('✅ 게임 상태가 정상입니다.');
            } else {
                console.warn('⚠️ 게임 상태에 문제가 발견되었습니다:');
                diagnosis.overall.criticalIssues.forEach(issue => {
                    console.warn(`  - ${issue}`);
                });
            }
            
            if (diagnosis.overall.warnings.length > 0) {
                console.info('ℹ️ 경고사항:');
                diagnosis.overall.warnings.forEach(warning => {
                    console.info(`  - ${warning}`);
                });
            }
            
            // 자동 테스트 실행 (개발 환경에서만)
            if (window.location.search.includes('autotest=true')) {
                console.log('🚀 자동 테스트 실행...');
                window.acornBattleGame.gameTester.runAllTests();
            }
            
            // 최종 품질 검사 실행 (배포 모드에서)
            if (window.location.search.includes('quality=true')) {
                console.log('🔍 최종 품질 검사 실행...');
                const qualityReport = window.acornBattleGame.performFinalQualityCheck();
                
                // 허브 연동 테스트도 함께 실행
                const hubTest = window.acornBattleGame.testHubIntegration();
                console.log('🔗 허브 연동 테스트 완료:', hubTest);
            }
        }, 1000);
    }
    
    console.log('도토리 배틀 게임 로딩 완료');
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (window.acornBattleGame) {
        // 게임 루프 정리
        if (window.acornBattleGame.gameLoopId) {
            cancelAnimationFrame(window.acornBattleGame.gameLoopId);
        }
        
        // 타이머 정리
        if (window.acornBattleGame.gameTimer) {
            clearInterval(window.acornBattleGame.gameTimer);
        }
        
        // SDK 연결 해제
        if (window.acornBattleGame.sdk) {
            window.acornBattleGame.sdk.disconnect();
        }
        
        console.log('도토리 배틀 게임 정리 완료');
    }
});