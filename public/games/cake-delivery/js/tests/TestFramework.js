/**
 * 게임 테스트 프레임워크
 * 단위 테스트 및 통합 테스트를 위한 경량 테스트 프레임워크
 */
class TestFramework {
    constructor() {
        this.tests = [];
        this.suites = new Map();
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };
        
        this.config = {
            timeout: 5000,
            verbose: true,
            stopOnFirstFailure: false,
            enableMocking: true
        };
        
        this.mocks = new Map();
        this.spies = new Map();
        
        console.log('✅ 테스트 프레임워크 초기화 완료');
    }
    
    /**
     * 테스트 스위트 생성
     */
    describe(suiteName, setupFn) {
        const suite = {
            name: suiteName,
            tests: [],
            beforeEach: null,
            afterEach: null,
            beforeAll: null,
            afterAll: null
        };
        
        this.suites.set(suiteName, suite);
        
        // 현재 스위트 컨텍스트 설정
        this.currentSuite = suite;
        
        // 스위트 설정 함수 실행
        if (typeof setupFn === 'function') {
            setupFn();
        }
        
        this.currentSuite = null;
        
        return suite;
    }
    
    /**
     * 개별 테스트 정의
     */
    it(testName, testFn) {
        const test = {
            name: testName,
            fn: testFn,
            suite: this.currentSuite ? this.currentSuite.name : 'default',
            timeout: this.config.timeout,
            skip: false,
            only: false
        };
        
        if (this.currentSuite) {
            this.currentSuite.tests.push(test);
        } else {
            this.tests.push(test);
        }
        
        return test;
    }
    
    /**
     * 테스트 건너뛰기
     */
    xit(testName, testFn) {
        const test = this.it(testName, testFn);
        test.skip = true;
        return test;
    }
    
    /**
     * 특정 테스트만 실행
     */
    fit(testName, testFn) {
        const test = this.it(testName, testFn);
        test.only = true;
        return test;
    }
    
    /**
     * 각 테스트 전 실행
     */
    beforeEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeEach = fn;
        }
    }
    
    /**
     * 각 테스트 후 실행
     */
    afterEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterEach = fn;
        }
    }
    
    /**
     * 스위트 시작 전 실행
     */
    beforeAll(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeAll = fn;
        }
    }
    
    /**
     * 스위트 완료 후 실행
     */
    afterAll(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterAll = fn;
        }
    }
    
    /**
     * 어설션 객체
     */
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${actual} to be ${expected}`);
                }
            },
            
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
                }
            },
            
            toBeCloseTo: (expected, precision = 2) => {
                const diff = Math.abs(actual - expected);
                const threshold = Math.pow(10, -precision);
                if (diff >= threshold) {
                    throw new Error(`Expected ${actual} to be close to ${expected} (precision: ${precision})`);
                }
            },
            
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected ${actual} to be truthy`);
                }
            },
            
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected ${actual} to be falsy`);
                }
            },
            
            toBeNull: () => {
                if (actual !== null) {
                    throw new Error(`Expected ${actual} to be null`);
                }
            },
            
            toBeUndefined: () => {
                if (actual !== undefined) {
                    throw new Error(`Expected ${actual} to be undefined`);
                }
            },
            
            toBeDefined: () => {
                if (actual === undefined) {
                    throw new Error(`Expected ${actual} to be defined`);
                }
            },
            
            toContain: (expected) => {
                if (Array.isArray(actual)) {
                    if (!actual.includes(expected)) {
                        throw new Error(`Expected array ${JSON.stringify(actual)} to contain ${expected}`);
                    }
                } else if (typeof actual === 'string') {
                    if (actual.indexOf(expected) === -1) {
                        throw new Error(`Expected string "${actual}" to contain "${expected}"`);
                    }
                } else {
                    throw new Error(`Expected ${actual} to be an array or string`);
                }
            },
            
            toHaveLength: (expected) => {
                if (!actual || typeof actual.length !== 'number') {
                    throw new Error(`Expected ${actual} to have a length property`);
                }
                if (actual.length !== expected) {
                    throw new Error(`Expected length ${actual.length} to be ${expected}`);
                }
            },
            
            toThrow: (expectedError) => {
                if (typeof actual !== 'function') {
                    throw new Error(`Expected ${actual} to be a function`);
                }
                
                let threwError = false;
                let actualError = null;
                
                try {
                    actual();
                } catch (error) {
                    threwError = true;
                    actualError = error;
                }
                
                if (!threwError) {
                    throw new Error(`Expected function to throw an error`);
                }
                
                if (expectedError && actualError.message !== expectedError) {
                    throw new Error(`Expected error "${actualError.message}" to match "${expectedError}"`);
                }
            },
            
            toHaveBeenCalled: () => {
                if (!this.isSpyFunction(actual)) {
                    throw new Error(`Expected ${actual} to be a spy function`);
                }
                
                const spy = this.spies.get(actual);
                if (spy.callCount === 0) {
                    throw new Error(`Expected spy to have been called`);
                }
            },
            
            toHaveBeenCalledWith: (...expectedArgs) => {
                if (!this.isSpyFunction(actual)) {
                    throw new Error(`Expected ${actual} to be a spy function`);
                }
                
                const spy = this.spies.get(actual);
                const found = spy.calls.some(call => 
                    call.length === expectedArgs.length &&
                    call.every((arg, index) => arg === expectedArgs[index])
                );
                
                if (!found) {
                    throw new Error(`Expected spy to have been called with ${JSON.stringify(expectedArgs)}`);
                }
            }
        };
    }
    
    /**
     * 모킹 함수 생성
     */
    createMock(name, implementation) {
        const mock = {
            name: name,
            implementation: implementation || (() => {}),
            callCount: 0,
            calls: [],
            returnValue: undefined
        };
        
        const mockFn = (...args) => {
            mock.callCount++;
            mock.calls.push(args);
            
            if (mock.implementation) {
                return mock.implementation(...args);
            }
            
            return mock.returnValue;
        };
        
        mockFn.mockReturnValue = (value) => {
            mock.returnValue = value;
            return mockFn;
        };
        
        mockFn.mockImplementation = (fn) => {
            mock.implementation = fn;
            return mockFn;
        };
        
        mockFn.mockReset = () => {
            mock.callCount = 0;
            mock.calls = [];
            return mockFn;
        };
        
        this.mocks.set(mockFn, mock);
        
        return mockFn;
    }
    
    /**
     * 스파이 함수 생성
     */
    createSpy(obj, methodName) {
        const originalMethod = obj[methodName];
        const spy = {
            callCount: 0,
            calls: [],
            originalMethod: originalMethod
        };
        
        const spyFn = (...args) => {
            spy.callCount++;
            spy.calls.push(args);
            
            if (originalMethod) {
                return originalMethod.apply(obj, args);
            }
        };
        
        spyFn.restore = () => {
            obj[methodName] = originalMethod;
            this.spies.delete(spyFn);
        };
        
        obj[methodName] = spyFn;
        this.spies.set(spyFn, spy);
        
        return spyFn;
    }
    
    /**
     * 스파이 함수 확인
     */
    isSpyFunction(fn) {
        return this.spies.has(fn);
    }
    
    /**
     * 비동기 테스트 지원
     */
    async runAsyncTest(testFn, timeout = this.config.timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Test timed out after ${timeout}ms`));
            }, timeout);
            
            Promise.resolve(testFn())
                .then(() => {
                    clearTimeout(timer);
                    resolve();
                })
                .catch((error) => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }
    
    /**
     * 개별 테스트 실행
     */
    async runTest(test, suite = null) {
        const testContext = {
            name: test.name,
            suite: suite ? suite.name : 'default',
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            status: 'running',
            error: null
        };
        
        try {
            // beforeEach 실행
            if (suite && suite.beforeEach) {
                await suite.beforeEach();
            }
            
            // 테스트 실행
            if (test.fn.constructor.name === 'AsyncFunction') {
                await this.runAsyncTest(test.fn, test.timeout);
            } else {
                test.fn();
            }
            
            testContext.status = 'passed';
            this.results.passed++;
            
        } catch (error) {
            testContext.status = 'failed';
            testContext.error = error;
            this.results.failed++;
            this.results.errors.push({
                test: test.name,
                suite: suite ? suite.name : 'default',
                error: error.message,
                stack: error.stack
            });
            
            if (this.config.verbose) {
                console.error(`❌ ${test.name}: ${error.message}`);
            }
            
            if (this.config.stopOnFirstFailure) {
                throw error;
            }
        } finally {
            // afterEach 실행
            if (suite && suite.afterEach) {
                try {
                    await suite.afterEach();
                } catch (error) {
                    console.warn(`Warning: afterEach failed for ${test.name}:`, error);
                }
            }
            
            testContext.endTime = Date.now();
            testContext.duration = testContext.endTime - testContext.startTime;
            
            if (this.config.verbose && testContext.status === 'passed') {
                console.log(`✅ ${test.name} (${testContext.duration}ms)`);
            }
        }
        
        return testContext;
    }
    
    /**
     * 테스트 스위트 실행
     */
    async runSuite(suite) {
        console.log(`\n📋 Running suite: ${suite.name}`);
        
        try {
            // beforeAll 실행
            if (suite.beforeAll) {
                await suite.beforeAll();
            }
            
            // 테스트 실행
            for (const test of suite.tests) {
                if (test.skip) {
                    this.results.skipped++;
                    if (this.config.verbose) {
                        console.log(`⏭️ ${test.name} (skipped)`);
                    }
                    continue;
                }
                
                await this.runTest(test, suite);
                this.results.total++;
            }
            
        } finally {
            // afterAll 실행
            if (suite.afterAll) {
                try {
                    await suite.afterAll();
                } catch (error) {
                    console.warn(`Warning: afterAll failed for suite ${suite.name}:`, error);
                }
            }
        }
    }
    
    /**
     * 필터링된 테스트 실행
     */
    async runFilteredTests(filteredTests) {
        console.log('🧪 필터링된 테스트 실행 시작...\n');
        
        const startTime = Date.now();
        
        // 결과 초기화
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            testDetails: []
        };
        
        try {
            for (const test of filteredTests) {
                if (test.skip) {
                    this.results.skipped++;
                    this.results.testDetails.push({
                        name: test.name,
                        suite: test.suite,
                        status: 'skipped'
                    });
                    if (this.config.verbose) {
                        console.log(`⏭️ ${test.name} (skipped)`);
                    }
                    continue;
                }
                
                const testResult = await this.runTest(test);
                this.results.total++;
                this.results.testDetails.push({
                    name: testResult.name,
                    suite: testResult.suite,
                    status: testResult.status,
                    error: testResult.error ? testResult.error.message : null,
                    duration: testResult.duration
                });
            }
            
        } catch (error) {
            console.error('테스트 실행 중 치명적 오류:', error);
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 결과 출력
        this.printResults(duration);
        
        return this.results;
    }
    
    /**
     * 모든 테스트 실행
     */
    async runAllTests() {
        // 모든 테스트 수집
        const allTests = [];
        
        // 스위트의 테스트들 수집
        for (const [suiteName, suite] of this.suites) {
            for (const test of suite.tests) {
                allTests.push({
                    ...test,
                    suite: suiteName
                });
            }
        }
        
        // 독립 테스트들 수집
        for (const test of this.tests) {
            allTests.push({
                ...test,
                suite: test.suite || 'default'
            });
        }
        
        return await this.runFilteredTests(allTests);
    }
    
    /**
     * 모든 테스트 실행 (기존 메서드)
     */
    async runAll() {
        console.log('🧪 테스트 실행 시작...\n');
        
        const startTime = Date.now();
        
        // 결과 초기화
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };
        
        try {
            // only 테스트가 있는지 확인
            const hasOnlyTests = this.hasOnlyTests();
            
            // 스위트 실행
            for (const [suiteName, suite] of this.suites) {
                if (hasOnlyTests) {
                    const hasOnlyInSuite = suite.tests.some(test => test.only);
                    if (!hasOnlyInSuite) continue;
                }
                
                await this.runSuite(suite);
            }
            
            // 독립 테스트 실행
            for (const test of this.tests) {
                if (hasOnlyTests && !test.only) continue;
                
                if (test.skip) {
                    this.results.skipped++;
                    if (this.config.verbose) {
                        console.log(`⏭️ ${test.name} (skipped)`);
                    }
                    continue;
                }
                
                await this.runTest(test);
                this.results.total++;
            }
            
        } catch (error) {
            console.error('테스트 실행 중 치명적 오류:', error);
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 결과 출력
        this.printResults(duration);
        
        // 스파이 정리
        this.cleanupSpies();
        
        return this.results;
    }
    
    /**
     * only 테스트 존재 확인
     */
    hasOnlyTests() {
        // 독립 테스트 확인
        if (this.tests.some(test => test.only)) {
            return true;
        }
        
        // 스위트 테스트 확인
        for (const [suiteName, suite] of this.suites) {
            if (suite.tests.some(test => test.only)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 결과 출력
     */
    printResults(duration) {
        console.log('\n📊 테스트 결과:');
        console.log('='.repeat(50));
        console.log(`총 테스트: ${this.results.total}`);
        console.log(`✅ 통과: ${this.results.passed}`);
        console.log(`❌ 실패: ${this.results.failed}`);
        console.log(`⏭️ 건너뜀: ${this.results.skipped}`);
        console.log(`⏱️ 실행 시간: ${duration}ms`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ 실패한 테스트:');
            this.results.errors.forEach(error => {
                console.log(`  • ${error.suite}/${error.test}: ${error.error}`);
            });
        }
        
        const successRate = this.results.total > 0 ? 
            (this.results.passed / this.results.total * 100).toFixed(1) : 0;
        
        console.log(`\n📈 성공률: ${successRate}%`);
        console.log('='.repeat(50));
        
        if (this.results.failed === 0) {
            console.log('🎉 모든 테스트가 통과했습니다!');
        } else {
            console.log('⚠️ 일부 테스트가 실패했습니다.');
        }
    }
    
    /**
     * 스파이 정리
     */
    cleanupSpies() {
        for (const [spyFn, spy] of this.spies) {
            if (spyFn.restore) {
                spyFn.restore();
            }
        }
        this.spies.clear();
        this.mocks.clear();
    }
    
    /**
     * 설정 업데이트
     */
    configure(options) {
        this.config = { ...this.config, ...options };
    }
}