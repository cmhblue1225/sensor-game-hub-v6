// Features Layer - 게임 모드 관리
import { GAME_CONFIG } from '../../shared/config/game-config.js';

export class GameModeManager {
    constructor() {
        this.currentMode = null;
        this.availableModes = {
            'solo': {
                name: '싱글 플레이',
                description: '혼자서 표적을 맞춰보세요',
                icon: '🎯',
                maxPlayers: 1,
                sdkType: 'solo'
            },
            'coop': {
                name: '협동 플레이',
                description: '2명이 협력하여 플레이',
                icon: '🤝',
                maxPlayers: 2,
                sdkType: 'dual'
            },
            'competitive': {
                name: '경쟁 플레이',
                description: '2명이 경쟁하여 플레이',
                icon: '⚔️',
                maxPlayers: 2,
                sdkType: 'dual'
            },
            'mass-competitive': {
                name: '대규모 경쟁',
                description: '3-8명 실시간 경쟁',
                icon: '👥',
                maxPlayers: 8,
                minPlayers: 3,
                sdkType: 'multi'
            }
        };
    }

    // 게임 모드 설정
    setMode(mode) {
        if (!this.availableModes[mode]) {
            throw new Error(`Unknown game mode: ${mode}`);
        }
        
        this.currentMode = mode;
        return this.availableModes[mode];
    }

    // 현재 모드 정보 가져오기
    getCurrentModeInfo() {
        return this.currentMode ? this.availableModes[this.currentMode] : null;
    }

    // 모드별 표적 설정 계산
    calculateTargetSettings(playerCount = 1) {
        if (this.currentMode !== 'mass-competitive') {
            return {
                maxTargets: GAME_CONFIG.maxTargets,
                spawnInterval: GAME_CONFIG.targetSpawnInterval
            };
        }

        const massConfig = GAME_CONFIG.massCompetitive;
        
        // 플레이어 수에 비례한 최대 표적 수 계산
        const dynamicMaxTargets = Math.min(
            massConfig.baseTargets + (playerCount * massConfig.targetsPerPlayer),
            massConfig.maxTargetsLimit
        );
        
        // 플레이어 수에 비례한 생성 간격 계산
        const dynamicSpawnInterval = Math.max(
            massConfig.baseSpawnInterval - (playerCount * massConfig.spawnIntervalReduction),
            massConfig.minSpawnInterval
        );
        
        return {
            maxTargets: dynamicMaxTargets,
            spawnInterval: dynamicSpawnInterval
        };
    }

    // 모드별 UI 설정 가져오기
    getUIConfig() {
        const mode = this.getCurrentModeInfo();
        if (!mode) return null;

        return {
            showDualSensors: this.currentMode === 'coop' || this.currentMode === 'competitive',
            showCompetitiveScore: this.currentMode === 'competitive',
            showMassCompetitive: this.currentMode === 'mass-competitive',
            showNormalScore: this.currentMode !== 'competitive' && this.currentMode !== 'mass-competitive',
            sessionTitle: this._getSessionTitle(),
            sessionInstructions: this._getSessionInstructions()
        };
    }

    // 세션 제목 생성
    _getSessionTitle() {
        const modeInfo = this.getCurrentModeInfo();
        return `${modeInfo.icon} Shot Target - ${modeInfo.name}`;
    }

    // 세션 설명 생성
    _getSessionInstructions() {
        switch (this.currentMode) {
            case 'solo':
                return '모바일 센서로 조준하여 표적을 맞추는 게임!<br>' +
                       '조준점을 표적 중앙에 맞추면 자동으로 발사됩니다.<br>' +
                       '아래 코드를 모바일에서 입력하거나 QR 코드를 스캔하세요.';
            
            case 'coop':
                return '2명이 협력하는 표적 맞추기 게임!<br>' +
                       '각자 화면 절반에서 조준하여 함께 점수를 얻어보세요.<br>' +
                       '아래 코드를 두 개의 모바일에서 입력하거나 QR 코드를 스캔하세요.';
            
            case 'competitive':
                return '2명이 경쟁하는 표적 맞추기 게임!<br>' +
                       '각자 모바일로 조준하여 더 높은 점수를 얻어보세요.<br>' +
                       '아래 코드를 두 개의 모바일에서 입력하거나 QR 코드를 스캔하세요.';
            
            case 'mass-competitive':
                return '최대 8명이 참여하는 실시간 표적 경쟁!<br>' +
                       '조준점을 표적 중앙에 맞추면 자동으로 발사됩니다.<br>' +
                       '아래 코드를 모바일에서 입력하거나 QR 코드를 스캔하세요.';
            
            default:
                return '';
        }
    }

    // 모드별 연결 요구사항 확인
    checkConnectionRequirements(sensorConnected, sensor1Connected, sensor2Connected, playerCount = 0) {
        switch (this.currentMode) {
            case 'solo':
                return sensorConnected;
            
            case 'coop':
            case 'competitive':
                return sensor1Connected && sensor2Connected;
            
            case 'mass-competitive':
                return playerCount >= (this.availableModes[this.currentMode].minPlayers || 1);
            
            default:
                return false;
        }
    }

    // 모드별 게임 종료 조건 확인
    shouldEndGame(timeLeft, playerCount = 0) {
        // 시간 종료
        if (timeLeft <= 0) {
            return true;
        }

        // 대규모 경쟁 모드에서 활성 플레이어가 1명 이하
        if (this.currentMode === 'mass-competitive' && playerCount < 2) {
            return true;
        }

        return false;
    }

    // 사용 가능한 모든 모드 가져오기
    getAllModes() {
        return Object.entries(this.availableModes).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }
}