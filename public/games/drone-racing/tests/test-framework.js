/**
 * 🧪 간단한 테스트 프레임워크
 * 
 * 드론 레이싱 게임을 위한 단위 테스트 프레임워크
 */

class TestFramework {
    constructor() {
        this.testSuites = new Map();
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0
        };
        this.currentSuite = null;
        this.isRunning = false;
    }
    
    /**
     * 테스트 스위트 생성
     */
    describe(suiteName, callback) {
        const suite = {
            name: suiteName,
            tests: [],
            beforeEach: null,
            afterEach: null,
            beforeAll: null,
            afterAll: null
        };
        
        this.testSuites.set(suiteName, suite);
        this.currentSuite = suite;
        
        // 테스트 정의 실행
        callback();
        
        this.currentSuite = null;
        return suite;
    }
    
    /**
     * 개별 테스트 케이스 정의
     */
    it(testName, callback) {
        if (!this.currentSuite) {
            throw new Error('테스트는 describe 블록 내에서 정의되어야 합니다.');
        }
        
        const test = {
            name: testName,
            callback: callback,
            status: 'pending',
            duration: 0,
            error: null
        };
        
        this.currentSuite.tests.push(test);
        return test;
    }
    
    /**
     * 각 테스트 전에 실행
     */
    beforeEach(callback) {
        if (this.currentSuite) {
            this.currentSuite.beforeEach = callback;
        }
    }
    
    /**
     * 각 테스트 후에 실행
     */
    afterEach(callback) {
        if (this.currentSuite) {
            this.currentSuite.afterEach = callback;
        }
    }
    
    /**
     * 스위트 시작 전에 실행
     */
    beforeAll(callback) {
        if (this.currentSuite) {
            this.currentSuite.beforeAll = callback;
        }
    }
    
    /**
     * 스위트 완료 후에 실행
     */
    afterAll(callback) {
        if (this.currentSuite) {
            this.currentSuite.afterAll = callback;
        }
    }
    
    /**
     * 모든 테스트 실행
     */
    async runAllTests() {
        this.isRunning = true;
        this.resetResults();
        
        const startTime = Date.now();
        
        for (const [suiteName, suite] of this.testSuites) {
            await this.runTestSuite(suite);
        }
        
        this.results.duration = Date.now() - startTime;
        this.isRunning = false;
        
        this.updateSummary();
        return this.results;
    }
    
    /**
     * 특정 테스트 스위트 실행
     */
    async runTestSuite(suite) {
        console.log(`🧪 테스트 스위트 실행: ${suite.name}`);
        
        // beforeAll 실행
        if (suite.beforeAll) {
            try {
                await suite.beforeAll();
            } catch (error) {
                console.error(`beforeAll 실패 (${suite.name}):`, error);
            }
        }
        
        // 각 테스트 실행
        for (const test of suite.tests) {
            await this.runSingleTest(suite, test);
        }
        
        // afterAll 실행
        if (suite.afterAll) {
            try {
                await suite.afterAll();
            } catch (error) {
                console.error(`afterAll 실패 (${suite.name}):`, error);
            }
        }
    }
    
    /**
     * 개별 테스트 실행
     */
    async runSingleTest(suite, test) {
        const startTime = Date.now();
        test.status = 'running';
        
        this.updateTestDisplay(suite.name, test);
        
        try {
            // beforeEach 실행
            if (suite.beforeEach) {
                await suite.beforeEach();
            }
            
            // 테스트 실행
            await test.callback();
            
            // afterEach 실행
            if (suite.afterEach) {
                await suite.afterEach();
            }
            
            test.status = 'passed';
            test.duration = Date.now() - startTime;
            this.results.passed++;
            
        } catch (error) {
            test.status = 'failed';
            test.duration = Date.now() - startTime;
            test.error = error;
            this.results.failed++;
            
            console.error(`테스트 실패 (${suite.name} - ${test.name}):`, error);
        }
        
        this.results.total++;
        this.updateTestDisplay(suite.name, test);
        this.updateProgress();
        
        // 테스트 간 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    /**
     * 특정 스위트만 실행
     */
    async runSuite(suiteName) {
        const suite = this.testSuites.get(suiteName);
        if (!suite) {
            console.error(`테스트 스위트를 찾을 수 없습니다: ${suiteName}`);
            return;
        }
        
        this.isRunning = true;
        this.resetResults();
        
        const startTime = Date.now();
        await this.runTestSuite(suite);
        this.results.duration = Date.now() - startTime;
        
        this.isRunning = false;
        this.updateSummary();
        
        return this.results;
    }
    
    /**
     * 결과 초기화
     */
    resetResults() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0
        };
        
        // 모든 테스트 상태 초기화
        for (const suite of this.testSuites.values()) {
            for (const test of suite.tests) {
                test.status = 'pending';
                test.duration = 0;
                test.error = null;
            }
        }
    }
    
    /**
     * 테스트 표시 업데이트
     */
    updateTestDisplay(suiteName, test) {
        const resultsContainer = document.getElementById('testResults');
        if (!resultsContainer) return;
        
        let suiteElement = document.getElementById(`suite-${suiteName}`);
        
        if (!suiteElement) {
            suiteElement = document.createElement('div');
            suiteElement.id = `suite-${suiteName}`;
            suiteElement.className = 'test-suite';
            suiteElement.innerHTML = `<h3>${suiteName}</h3>`;
            resultsContainer.appendChild(suiteElement);
        }
        
        let testElement = document.getElementById(`test-${suiteName}-${test.name}`);
        
        if (!testElement) {
            testElement = document.createElement('div');
            testElement.id = `test-${suiteName}-${test.name}`;
            testElement.className = 'test-case';
            suiteElement.appendChild(testElement);
        }
        
        const statusClass = test.status === 'passed' ? 'pass' : 
                           test.status === 'failed' ? 'fail' : 
                           test.status === 'running' ? 'running' : 'skip';
        
        const statusIcon = test.status === 'passed' ? '✓' : 
                          test.status === 'failed' ? '✗' : 
                          test.status === 'running' ? '⟳' : '○';
        
        testElement.innerHTML = `
            <div class="test-status ${statusClass}">${statusIcon}</div>
            <div class="test-name">${test.name}</div>
            <div class="test-duration">${test.duration}ms</div>
        `;
        
        if (test.error) {
            const errorElement = document.createElement('div');
            errorElement.className = 'test-error';
            errorElement.textContent = test.error.message || test.error.toString();
            testElement.appendChild(errorElement);
        }
    }
    
    /**
     * 진행률 업데이트
     */
    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        if (!progressFill) return;
        
        const totalTests = Array.from(this.testSuites.values())
            .reduce((sum, suite) => sum + suite.tests.length, 0);
        
        const completedTests = this.results.total;
        const progress = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;
        
        progressFill.style.width = `${progress}%`;
    }
    
    /**
     * 요약 정보 업데이트
     */
    updateSummary() {
        const elements = {
            totalTests: document.getElementById('totalTests'),
            passedTests: document.getElementById('passedTests'),
            failedTests: document.getElementById('failedTests'),
            skippedTests: document.getElementById('skippedTests'),
            totalDuration: document.getElementById('totalDuration')
        };
        
        if (elements.totalTests) elements.totalTests.textContent = this.results.total;
        if (elements.passedTests) elements.passedTests.textContent = this.results.passed;
        if (elements.failedTests) elements.failedTests.textContent = this.results.failed;
        if (elements.skippedTests) elements.skippedTests.textContent = this.results.skipped;
        if (elements.totalDuration) elements.totalDuration.textContent = `${this.results.duration}ms`;
    }
    
    /**
     * 결과 지우기
     */
    clearResults() {
        const resultsContainer = document.getElementById('testResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p>테스트를 실행하려면 위의 버튼을 클릭하세요.</p>';
        }
        
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = '0%';
        }
        
        this.resetResults();
        this.updateSummary();
    }
}

/**
 * 어설션 함수들
 */
class Expect {
    constructor(actual) {
        this.actual = actual;
    }
    
    toBe(expected) {
        if (this.actual !== expected) {
            throw new Error(`Expected ${expected}, but got ${this.actual}`);
        }
        return this;
    }
    
    toEqual(expected) {
        if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(this.actual)}`);
        }
        return this;
    }
    
    toBeTruthy() {
        if (!this.actual) {
            throw new Error(`Expected truthy value, but got ${this.actual}`);
        }
        return this;
    }
    
    toBeFalsy() {
        if (this.actual) {
            throw new Error(`Expected falsy value, but got ${this.actual}`);
        }
        return this;
    }
    
    toBeNull() {
        if (this.actual !== null) {
            throw new Error(`Expected null, but got ${this.actual}`);
        }
        return this;
    }
    
    toBeUndefined() {
        if (this.actual !== undefined) {
            throw new Error(`Expected undefined, but got ${this.actual}`);
        }
        return this;
    }
    
    toBeGreaterThan(expected) {
        if (this.actual <= expected) {
            throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
        }
        return this;
    }
    
    toBeLessThan(expected) {
        if (this.actual >= expected) {
            throw new Error(`Expected ${this.actual} to be less than ${expected}`);
        }
        return this;
    }
    
    toContain(expected) {
        if (!this.actual.includes(expected)) {
            throw new Error(`Expected ${this.actual} to contain ${expected}`);
        }
        return this;
    }
    
    toThrow() {
        if (typeof this.actual !== 'function') {
            throw new Error('Expected a function to test for throwing');
        }
        
        try {
            this.actual();
            throw new Error('Expected function to throw, but it did not');
        } catch (error) {
            // 함수가 예외를 던졌으므로 성공
        }
        return this;
    }
}

// 전역 함수들
const testFramework = new TestFramework();

function describe(suiteName, callback) {
    return testFramework.describe(suiteName, callback);
}

function it(testName, callback) {
    return testFramework.it(testName, callback);
}

function beforeEach(callback) {
    return testFramework.beforeEach(callback);
}

function afterEach(callback) {
    return testFramework.afterEach(callback);
}

function beforeAll(callback) {
    return testFramework.beforeAll(callback);
}

function afterAll(callback) {
    return testFramework.afterAll(callback);
}

function expect(actual) {
    return new Expect(actual);
}

// 테스트 실행 함수들
async function runAllTests() {
    return await testFramework.runAllTests();
}

async function runDroneTests() {
    return await testFramework.runSuite('Drone Tests');
}

async function runPhysicsTests() {
    return await testFramework.runSuite('Physics Tests');
}

async function runGameStateTests() {
    return await testFramework.runSuite('GameState Tests');
}

async function runUITests() {
    return await testFramework.runSuite('UI Tests');
}

function clearResults() {
    testFramework.clearResults();
}