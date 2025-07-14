/**
 * 🔍 GameScanner v1.0
 * 
 * 게임 폴더를 자동으로 스캔하여 메타데이터를 수집하는 시스템
 * - games 폴더 내 모든 게임 자동 감지
 * - game.json 메타데이터 파싱
 * - 동적 게임 등록 및 라우팅
 */

const fs = require('fs').promises;
const path = require('path');

class GameScanner {
    constructor(gamesDirectory = '../public/games') {
        this.gamesDir = path.join(__dirname, gamesDirectory);
        this.games = new Map();
        this.categories = new Set(['solo', 'dual', 'multi', 'experimental']);
        
        console.log('🔍 GameScanner v1.0 초기화');
    }
    
    /**
     * 모든 게임 스캔 및 등록
     */
    async scanGames() {
        try {
            console.log(`📂 게임 디렉토리 스캔 중: ${this.gamesDir}`);
            
            const entries = await fs.readdir(this.gamesDir, { withFileTypes: true });
            const gameDirectories = entries.filter(entry => entry.isDirectory());
            
            this.games.clear();
            
            for (const dir of gameDirectories) {
                try {
                    const gameData = await this.scanGameDirectory(dir.name);
                    if (gameData) {
                        this.games.set(dir.name, gameData);
                        console.log(`✅ 게임 등록됨: ${gameData.title} (${dir.name})`);
                    }
                } catch (error) {
                    console.warn(`⚠️  게임 스캔 실패: ${dir.name} - ${error.message}`);
                }
            }
            
            console.log(`🎮 총 ${this.games.size}개 게임이 등록되었습니다.`);
            return Array.from(this.games.values());
            
        } catch (error) {
            console.error('❌ 게임 스캔 실패:', error.message);
            return [];
        }
    }
    
    /**
     * 개별 게임 디렉토리 스캔
     */
    async scanGameDirectory(gameFolderName) {
        const gameDir = path.join(this.gamesDir, gameFolderName);
        const metadataPath = path.join(gameDir, 'game.json');
        const indexPath = path.join(gameDir, 'index.html');
        
        // 필수 파일 존재 확인
        try {
            await fs.access(indexPath);
        } catch {
            console.warn(`⚠️  ${gameFolderName}: index.html이 없습니다.`);
            return null;
        }
        
        // 메타데이터 파일 읽기
        let metadata = {};
        try {
            const metadataContent = await fs.readFile(metadataPath, 'utf8');
            metadata = JSON.parse(metadataContent);
        } catch {
            // game.json이 없으면 기본값 생성
            console.log(`📝 ${gameFolderName}: game.json이 없어 기본 메타데이터를 생성합니다.`);
            metadata = this.generateDefaultMetadata(gameFolderName);
        }
        
        // 메타데이터 검증 및 보완
        const gameData = this.validateAndEnhanceMetadata(gameFolderName, metadata);
        
        return gameData;
    }
    
    /**
     * 기본 메타데이터 생성
     */
    generateDefaultMetadata(gameFolderName) {
        const title = gameFolderName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
        return {
            id: gameFolderName,
            title: title,
            description: `${title} 게임`,
            category: this.inferCategory(gameFolderName),
            icon: this.inferIcon(gameFolderName),
            version: "1.0.0",
            author: "Unknown",
            sensors: this.inferSensorType(gameFolderName),
            status: "active"
        };
    }
    
    /**
     * 메타데이터 검증 및 보완
     */
    validateAndEnhanceMetadata(gameFolderName, metadata) {
        const enhanced = {
            // 필수 필드
            id: metadata.id || gameFolderName,
            title: metadata.title || this.generateDefaultMetadata(gameFolderName).title,
            description: metadata.description || `${metadata.title || gameFolderName} 게임`,
            category: metadata.category || this.inferCategory(gameFolderName),
            icon: metadata.icon || this.inferIcon(gameFolderName),
            
            // 게임 설정
            sensors: metadata.sensors || this.inferSensorType(gameFolderName),
            maxPlayers: metadata.maxPlayers || this.getMaxPlayersByCategory(metadata.category),
            difficulty: metadata.difficulty || 'medium',
            
            // 메타 정보
            version: metadata.version || '1.0.0',
            author: metadata.author || 'Unknown',
            created: metadata.created || new Date().toISOString(),
            updated: new Date().toISOString(),
            
            // 상태 및 설정
            status: metadata.status || 'active',
            featured: metadata.featured || false,
            experimental: metadata.experimental || false,
            
            // 경로 정보
            path: `/games/${gameFolderName}`,
            folder: gameFolderName,
            
            // 추가 설정 (있는 경우만)
            ...(metadata.tags && { tags: metadata.tags }),
            ...(metadata.screenshots && { screenshots: metadata.screenshots }),
            ...(metadata.instructions && { instructions: metadata.instructions }),
            ...(metadata.controls && { controls: metadata.controls })
        };
        
        return enhanced;
    }
    
    /**
     * 게임 폴더명으로 카테고리 추론
     */
    inferCategory(folderName) {
        const name = folderName.toLowerCase();
        
        if (name.includes('multi') || name.includes('multiplayer')) return 'multi';
        if (name.includes('dual') || name.includes('coop') || name.includes('cooperative')) return 'dual';
        if (name.includes('solo') || name.includes('single')) return 'solo';
        if (name.includes('test') || name.includes('demo') || name.includes('experimental')) return 'experimental';
        
        // 기본값은 solo
        return 'solo';
    }
    
    /**
     * 게임 폴더명으로 아이콘 추론
     */
    inferIcon(folderName) {
        const name = folderName.toLowerCase();
        
        // 게임 타입별 아이콘
        if (name.includes('racing') || name.includes('car')) return '🏎️';
        if (name.includes('ball') || name.includes('soccer') || name.includes('football')) return '⚽';
        if (name.includes('puzzle') || name.includes('maze') || name.includes('labyrinth')) return '🧩';
        if (name.includes('space') || name.includes('rocket') || name.includes('ship')) return '🚀';
        if (name.includes('bird') || name.includes('fly')) return '🐦';
        if (name.includes('jump') || name.includes('platform')) return '🦘';
        if (name.includes('shoot') || name.includes('gun') || name.includes('war')) return '🎯';
        if (name.includes('adventure') || name.includes('quest')) return '🗺️';
        if (name.includes('music') || name.includes('rhythm')) return '🎵';
        if (name.includes('brick') || name.includes('block')) return '🧱';
        if (name.includes('tilt') || name.includes('balance')) return '⚖️';
        
        // 카테고리별 기본 아이콘
        if (name.includes('multi')) return '👥';
        if (name.includes('dual')) return '🎮';
        if (name.includes('test') || name.includes('demo')) return '🧪';
        
        // 기본 아이콘
        return '🎯';
    }
    
    /**
     * 센서 타입 추론
     */
    inferSensorType(folderName) {
        const category = this.inferCategory(folderName);
        
        switch (category) {
            case 'solo': return ['orientation', 'motion'];
            case 'dual': return ['orientation', 'motion'];
            case 'multi': return ['orientation', 'motion'];
            default: return ['orientation'];
        }
    }
    
    /**
     * 카테고리별 최대 플레이어 수
     */
    getMaxPlayersByCategory(category) {
        switch (category) {
            case 'solo': return 1;
            case 'dual': return 2;
            case 'multi': return 8;
            default: return 1;
        }
    }
    
    /**
     * 등록된 게임 목록 반환
     */
    getGames() {
        return Array.from(this.games.values());
    }
    
    /**
     * 특정 게임 정보 반환
     */
    getGame(gameId) {
        return this.games.get(gameId);
    }
    
    /**
     * 카테고리별 게임 필터링
     */
    getGamesByCategory(category) {
        return this.getGames().filter(game => game.category === category);
    }
    
    /**
     * 활성 게임만 필터링
     */
    getActiveGames() {
        return this.getGames().filter(game => game.status === 'active');
    }
    
    /**
     * 추천 게임 필터링
     */
    getFeaturedGames() {
        return this.getGames().filter(game => game.featured);
    }
    
    /**
     * 게임 검색
     */
    searchGames(query) {
        const searchTerm = query.toLowerCase();
        
        return this.getGames().filter(game => 
            game.title.toLowerCase().includes(searchTerm) ||
            game.description.toLowerCase().includes(searchTerm) ||
            (game.tags && game.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }
    
    /**
     * 게임 통계
     */
    getStats() {
        const games = this.getGames();
        const categories = {};
        const statuses = {};
        
        games.forEach(game => {
            categories[game.category] = (categories[game.category] || 0) + 1;
            statuses[game.status] = (statuses[game.status] || 0) + 1;
        });
        
        return {
            total: games.length,
            categories,
            statuses,
            featured: games.filter(g => g.featured).length,
            experimental: games.filter(g => g.experimental).length
        };
    }
}

module.exports = GameScanner;