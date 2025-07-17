/**
 * 🔍 Hub Compatibility Checker
 * 
 * Sensor Game Hub v6.0과의 호환성을 검증하는 시스템
 * - game.json 메타데이터 유효성 검사
 * - 필수 파일 존재 확인
 * - 허브 API 호환성 검증
 * - 배포 준비 상태 확인
 */

class HubCompatibilityChecker {
    constructor() {
        this.checks = [
            { name: '디렉터리 구조', check: this.checkDirectoryStructure.bind(this) },
            { name: 'game.json 유효성', check: this.checkGameJsonValidity.bind(this) },
            { name: '필수 파일 존재', check: this.checkRequiredFiles.bind(this) },
            { name: '에셋 파일 확인', check: this.checkAssetFiles.bind(this) },
            { name: 'SessionSDK 통합', check: this.checkSessionSDKIntegration.bind(this) },
            { name: '허브 API 호환성', check: this.checkHubAPICompatibility.bind(this) },
            { name: '메타데이터 완성도', check: this.checkMetadataCompleteness.bind(this) },
            { name: '게임 스캐너 호환성', check: this.checkGameScannerCompatibility.bind(this) }
        ];
        
        this.results = [];
        this.gameMetadata = null;
    }
    
    /**
     * 모든 호환성 검사 실행
     */
    async runAllChecks() {
        console.log('🔍 허브 호환성 검사 시작...');
        
        this.results = [];
        
        for (const check of this.checks) {
            try {
                console.log(`🔄 검사 중: ${check.name}`);
                const result = await check.check();
                
                this.results.push({
                    name: check.name,
                    status: 'PASS',
                    message: result,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✅ ${check.name}: 통과`);
                
            } catch (error) {
                this.results.push({
                    name: check.name,
                    status: 'FAIL',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
                
                console.error(`❌ ${check.name}: 실패 - ${error.message}`);
            }
        }
        
        return this.generateReport();
    }
    
    /**
     * 디렉터리 구조 검사
     */
    async checkDirectoryStructure() {
        const requiredStructure = [
            'index.html',
            'game.json',
            'js/game.js',
            'styles.css'
        ];
        
        const missingFiles = [];
        
        for (const file of requiredStructure) {
            try {
                const response = await fetch(`./${file}`, { method: 'HEAD' });
                if (!response.ok) {
                    missingFiles.push(file);
                }
            } catch (error) {
                missingFiles.push(file);
            }
        }
        
        if (missingFiles.length > 0) {
            throw new Error(`필수 파일 누락: ${missingFiles.join(', ')}`);
        }
        
        return '필수 디렉터리 구조 확인됨';
    }
    
    /**
     * game.json 유효성 검사
     */
    async checkGameJsonValidity() {
        try {
            const response = await fetch('./game.json');
            if (!response.ok) {
                throw new Error('game.json 파일을 찾을 수 없음');
            }
            
            this.gameMetadata = await response.json();
            
            // 필수 필드 검사
            const requiredFields = [
                'id', 'name', 'description', 'version', 'gameType',
                'minPlayers', 'maxPlayers', 'category'
            ];
            
            const missingFields = requiredFields.filter(field => !this.gameMetadata[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`필수 필드 누락: ${missingFields.join(', ')}`);
            }
            
            // 게임 타입 검증
            const validGameTypes = ['solo', 'dual', 'multi'];
            if (!validGameTypes.includes(this.gameMetadata.gameType)) {
                throw new Error(`유효하지 않은 gameType: ${this.gameMetadata.gameType}`);
            }
            
            return 'game.json 유효성 검증 완료';
            
        } catch (error) {
            throw new Error(`game.json 검증 실패: ${error.message}`);
        }
    }
    
    /**
     * 필수 파일 존재 확인
     */
    async checkRequiredFiles() {
        const requiredFiles = [
            { path: 'index.html', description: '메인 게임 파일' },
            { path: 'game.json', description: '게임 메타데이터' },
            { path: 'js/game.js', description: '게임 로직' },
            { path: 'styles.css', description: '스타일시트' }
        ];
        
        const missingFiles = [];
        
        for (const file of requiredFiles) {
            try {
                const response = await fetch(`./${file.path}`, { method: 'HEAD' });
                if (!response.ok) {
                    missingFiles.push(`${file.path} (${file.description})`);
                }
            } catch (error) {
                missingFiles.push(`${file.path} (${file.description})`);
            }
        }
        
        if (missingFiles.length > 0) {
            throw new Error(`필수 파일 누락: ${missingFiles.join(', ')}`);
        }
        
        return '모든 필수 파일 존재 확인';
    }
    
    /**
     * 에셋 파일 확인
     */
    async checkAssetFiles() {
        if (!this.gameMetadata) {
            throw new Error('game.json을 먼저 로드해야 함');
        }
        
        const assetChecks = [];
        
        // 썸네일 확인
        if (this.gameMetadata.thumbnail || this.gameMetadata.assets?.thumbnail) {
            const thumbnailPath = this.gameMetadata.thumbnail || this.gameMetadata.assets.thumbnail.path;
            try {
                const response = await fetch(`./${thumbnailPath}`, { method: 'HEAD' });
                if (response.ok) {
                    assetChecks.push('썸네일 존재');
                } else {
                    assetChecks.push('썸네일 누락');
                }
            } catch (error) {
                assetChecks.push('썸네일 누락');
            }
        }
        
        // 스크린샷 확인
        if (this.gameMetadata.assets?.screenshots) {
            for (const screenshot of this.gameMetadata.assets.screenshots) {
                try {
                    const response = await fetch(`./${screenshot.path}`, { method: 'HEAD' });
                    if (response.ok) {
                        assetChecks.push(`스크린샷 존재: ${screenshot.path}`);
                    } else {
                        assetChecks.push(`스크린샷 누락: ${screenshot.path}`);
                    }
                } catch (error) {
                    assetChecks.push(`스크린샷 누락: ${screenshot.path}`);
                }
            }
        }
        
        return `에셋 파일 확인 완료: ${assetChecks.join(', ')}`;
    }
    
    /**
     * SessionSDK 통합 확인
     */
    async checkSessionSDKIntegration() {
        // SessionSDK 로드 확인
        if (typeof SessionSDK === 'undefined') {
            throw new Error('SessionSDK가 로드되지 않음');
        }
        
        // SDK 초기화 테스트
        try {
            const testSDK = new SessionSDK({
                gameId: 'compatibility-test',
                gameType: 'dual',
                debug: false
            });
            
            // 기본 이벤트 리스너 테스트
            let eventTestPassed = false;
            testSDK.on('test-event', () => {
                eventTestPassed = true;
            });
            
            // 이벤트 발생 시뮬레이션
            if (testSDK.emit) {
                testSDK.emit('test-event');
            }
            
            return 'SessionSDK 통합 확인됨';
            
        } catch (error) {
            throw new Error(`SessionSDK 초기화 실패: ${error.message}`);
        }
    }
    
    /**
     * 허브 API 호환성 확인
     */
    async checkHubAPICompatibility() {
        const apiEndpoints = [
            '/api/games',
            '/api/games/state',
            '/socket.io'
        ];
        
        const results = [];
        
        for (const endpoint of apiEndpoints) {
            try {
                const response = await fetch(endpoint, { method: 'HEAD' });
                results.push(`${endpoint}: ${response.ok ? '사용 가능' : '사용 불가'}`);
            } catch (error) {
                results.push(`${endpoint}: 연결 실패`);
            }
        }
        
        return `허브 API 상태: ${results.join(', ')}`;
    }
    
    /**
     * 메타데이터 완성도 확인
     */
    async checkMetadataCompleteness() {
        if (!this.gameMetadata) {
            throw new Error('game.json을 먼저 로드해야 함');
        }
        
        const recommendedFields = [
            'description', 'category', 'tags', 'thumbnail',
            'author', 'difficulty', 'estimatedPlayTime',
            'requirements', 'controls', 'gameModes'
        ];
        
        const missingRecommended = recommendedFields.filter(field => !this.gameMetadata[field]);
        const completeness = ((recommendedFields.length - missingRecommended.length) / recommendedFields.length * 100).toFixed(1);
        
        if (missingRecommended.length > 0) {
            console.warn(`권장 필드 누락: ${missingRecommended.join(', ')}`);
        }
        
        return `메타데이터 완성도: ${completeness}%`;
    }
    
    /**
     * 게임 스캐너 호환성 확인
     */
    async checkGameScannerCompatibility() {
        if (!this.gameMetadata) {
            throw new Error('game.json을 먼저 로드해야 함');
        }
        
        // GameScanner가 요구하는 필드들 확인
        const scannerRequiredFields = ['id', 'title', 'category'];
        const scannerMissingFields = scannerRequiredFields.filter(field => {
            return !this.gameMetadata[field] && !this.gameMetadata[field === 'title' ? 'name' : field];
        });
        
        if (scannerMissingFields.length > 0) {
            throw new Error(`GameScanner 필수 필드 누락: ${scannerMissingFields.join(', ')}`);
        }
        
        // 카테고리 유효성 확인
        const validCategories = ['solo', 'dual', 'multi', 'experimental'];
        const category = this.gameMetadata.category || this.gameMetadata.gameType;
        
        if (!validCategories.includes(category)) {
            throw new Error(`유효하지 않은 카테고리: ${category}`);
        }
        
        return 'GameScanner 호환성 확인됨';
    }
    
    /**
     * 검사 결과 리포트 생성
     */
    generateReport() {
        const passedChecks = this.results.filter(r => r.status === 'PASS').length;
        const failedChecks = this.results.filter(r => r.status === 'FAIL').length;
        const totalChecks = this.results.length;
        const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
        
        const report = {
            summary: {
                total: totalChecks,
                passed: passedChecks,
                failed: failedChecks,
                successRate: `${successRate}%`,
                compatible: failedChecks === 0,
                timestamp: new Date().toISOString()
            },
            details: this.results,
            recommendations: this.generateRecommendations()
        };
        
        console.log('\n📊 허브 호환성 검사 결과:');
        console.log(`✅ 통과: ${passedChecks}/${totalChecks}`);
        console.log(`❌ 실패: ${failedChecks}/${totalChecks}`);
        console.log(`📈 성공률: ${successRate}%`);
        console.log(`🎯 허브 호환성: ${report.summary.compatible ? '호환됨' : '호환되지 않음'}`);
        
        if (failedChecks > 0) {
            console.log('\n❌ 실패한 검사:');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`  - ${r.name}: ${r.message}`));
        }
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 권장사항:');
            report.recommendations.forEach(rec => console.log(`  - ${rec}`));
        }
        
        return report;
    }
    
    /**
     * 개선 권장사항 생성
     */
    generateRecommendations() {
        const recommendations = [];
        
        const failedChecks = this.results.filter(r => r.status === 'FAIL');
        
        failedChecks.forEach(check => {
            switch (check.name) {
                case '디렉터리 구조':
                    recommendations.push('필수 파일들을 올바른 위치에 배치하세요');
                    break;
                case 'game.json 유효성':
                    recommendations.push('game.json 파일의 필수 필드를 모두 채우세요');
                    break;
                case '에셋 파일 확인':
                    recommendations.push('썸네일과 스크린샷 파일을 assets 폴더에 추가하세요');
                    break;
                case 'SessionSDK 통합':
                    recommendations.push('SessionSDK를 올바르게 로드하고 초기화하세요');
                    break;
                case '허브 API 호환성':
                    recommendations.push('허브 환경에서 테스트하거나 API 엔드포인트를 확인하세요');
                    break;
                case '메타데이터 완성도':
                    recommendations.push('game.json에 권장 필드들을 추가하여 완성도를 높이세요');
                    break;
                case '게임 스캐너 호환성':
                    recommendations.push('GameScanner가 요구하는 메타데이터 형식을 맞추세요');
                    break;
            }
        });
        
        // 일반적인 권장사항
        if (this.gameMetadata) {
            if (!this.gameMetadata.thumbnail) {
                recommendations.push('게임 썸네일 이미지를 추가하세요 (300x200 권장)');
            }
            
            if (!this.gameMetadata.tags || this.gameMetadata.tags.length === 0) {
                recommendations.push('검색을 위한 태그를 추가하세요');
            }
            
            if (!this.gameMetadata.instructions) {
                recommendations.push('플레이어를 위한 게임 설명서를 추가하세요');
            }
        }
        
        return [...new Set(recommendations)]; // 중복 제거
    }
    
    /**
     * 호환성 검사 결과를 파일로 저장
     */
    async saveReport(report) {
        const reportData = {
            ...report,
            gameId: this.gameMetadata?.id || 'unknown',
            gameName: this.gameMetadata?.name || 'Unknown Game',
            generatedAt: new Date().toISOString()
        };
        
        // JSON 형태로 리포트 생성
        const reportJson = JSON.stringify(reportData, null, 2);
        
        // 브라우저 환경에서는 다운로드로 제공
        if (typeof window !== 'undefined') {
            const blob = new Blob([reportJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hub-compatibility-report-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        return reportData;
    }
}

// 전역에서 사용할 수 있도록 export
if (typeof window !== 'undefined') {
    window.HubCompatibilityChecker = HubCompatibilityChecker;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HubCompatibilityChecker;
}