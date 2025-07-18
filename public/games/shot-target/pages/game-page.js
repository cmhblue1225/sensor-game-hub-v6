// ===== PAGES/GAME-PAGE =====
// 게임 페이지 관리 클래스

import { GAME_CONFIG } from '../shared/config.js';
import { GameUtils } from '../shared/utils.js';

export class GamePage {
    constructor() {
        this.currentPage = 'mode-selection';
        this.elements = this.getElements();
        this.transitionCallbacks = new Map();
        
        this.setupPageTransitions();
    }

    // DOM 요소 가져오기
    getElements() {
        return {
            // 페이지 컨테이너들
            modeSelectionPanel: document.getElementById('modeSelectionPanel'),
            sessionPanel: document.getElementById('sessionPanel'),
            massWaitingPanel: document.getElementById('massWaitingPanel'),
            gameInfoPanel: document.getElementById('gameInfoPanel'),
            
            // 모드 선택 버튼들
            soloModeBtn: document.getElementById('soloModeBtn'),
            coopModeBtn: document.getElementById('coopModeBtn'),
            competitiveModeBtn: document.getElementById('competitiveModeBtn'),
            massCompetitiveModeBtn: document.getElementById('massCompetitiveModeBtn'),
            
            // 세션 정보 요소들
            sessionTitle: document.getElementById('sessionTitle'),
            sessionInstructions: document.getElementById('sessionInstructions'),
            sessionCode: document.getElementById('sessionCode'),
            qrContainer: document.getElementById('qrContainer'),
            
            // 대규모 경쟁 대기실 요소들
            massSessionCode: document.getElementById('massSessionCode'),
            massQrContainer: document.getElementById('massQrContainer'),
            massWaitingList: document.getElementById('massWaitingList'),
            massWaitingPlayers: document.getElementById('massWaitingPlayers'),
            massStartBtn: document.getElementById('massStartBtn'),
            
            // 기타 UI 요소들
            crosshair: document.getElementById('crosshair'),
            gameCanvas: document.getElementById('gameCanvas')
        };
    }

    // 페이지 전환 설정
    setupPageTransitions() {
        // 모드 선택 버튼 이벤트
        this.elements.soloModeBtn?.addEventListener('click', () => {
            this.transitionToSession('solo');
        });
        
        this.elements.coopModeBtn?.addEventListener('click', () => {
            this.transitionToSession('coop');
        });
        
        this.elements.competitiveModeBtn?.addEventListener('click', () => {
            this.transitionToSession('competitive');
        });
        
        this.elements.massCompetitiveModeBtn?.addEventListener('click', () => {
            this.transitionToMassWaiting();
        });
    }

    // 모드 선택 페이지 표시
    showModeSelection() {
        this.hideAllPages();
        this.elements.modeSelectionPanel?.classList.remove('hidden');
        this.currentPage = 'mode-selection';
        
        this.triggerTransitionCallback('mode-selection-shown');
        console.log('📄 [게임 페이지] 모드 선택 페이지 표시');
    }

    // 세션 페이지로 전환
    transitionToSession(mode) {
        this.hideAllPages();
        this.setupSessionPage(mode);
        this.elements.sessionPanel?.classList.remove('hidden');
        this.currentPage = 'session';
        
        this.triggerTransitionCallback('session-shown', { mode });
        console.log(`📄 [게임 페이지] 세션 페이지 표시: ${mode}`);
    }

    // 대규모 경쟁 대기실로 전환
    transitionToMassWaiting() {
        this.hideAllPages();
        this.elements.massWaitingPanel?.classList.remove('hidden');
        this.currentPage = 'mass-waiting';
        
        this.triggerTransitionCallback('mass-waiting-shown');
        console.log('📄 [게임 페이지] 대규모 경쟁 대기실 표시');
    }

    // 게임 플레이 페이지로 전환
    transitionToGameplay() {
        this.hideAllPages();
        this.elements.gameInfoPanel?.classList.remove('hidden');
        this.elements.crosshair?.classList.remove('hidden');
        this.currentPage = 'gameplay';
        
        this.triggerTransitionCallback('gameplay-shown');
        console.log('📄 [게임 페이지] 게임 플레이 페이지 표시');
    }

    // 모든 페이지 숨기기
    hideAllPages() {
        const pages = [
            this.elements.modeSelectionPanel,
            this.elements.sessionPanel,
            this.elements.massWaitingPanel,
            this.elements.gameInfoPanel
        ];
        
        pages.forEach(page => {
            page?.classList.add('hidden');
        });
        
        // 게임 중 요소들도 숨기기
        this.elements.crosshair?.classList.add('hidden');
    }

    // 세션 페이지 설정
    setupSessionPage(mode) {
        const modeConfig = {
            solo: {
                title: '🎯 Shot Target - 싱글 플레이',
                instructions: '모바일 센서로 조준하여 표적을 맞추는 게임!<br>' +
                             '조준점을 표적 중앙에 맞추면 자동으로 발사됩니다.<br>' +
                             '아래 코드를 모바일에서 입력하거나 QR 코드를 스캔하세요.'
            },
            coop: {
                title: '🤝 Shot Target - 협동 플레이',
                instructions: '2명이 협력하는 표적 맞추기 게임!<br>' +
                             '각자 화면 절반에서 조준하여 함께 점수를 얻어보세요.<br>' +
                             '아래 코드를 두 개의 모바일에서 입력하거나 QR 코드를 스캔하세요.'
            },
            competitive: {
                title: '⚔️ Shot Target - 경쟁 플레이',
                instructions: '2명이 경쟁하는 표적 맞추기 게임!<br>' +
                             '각자 모바일로 조준하여 더 높은 점수를 얻어보세요.<br>' +
                             '아래 코드를 두 개의 모바일에서 입력하거나 QR 코드를 스캔하세요.'
            }
        };
        
        const config = modeConfig[mode];
        if (config && this.elements.sessionTitle && this.elements.sessionInstructions) {
            this.elements.sessionTitle.textContent = config.title;
            this.elements.sessionInstructions.innerHTML = config.instructions;
        }
    }

    // 세션 정보 표시
    displaySessionInfo(sessionCode, sensorUrl) {
        if (this.elements.sessionCode) {
            this.elements.sessionCode.textContent = sessionCode || '----';
        }
        
        if (this.elements.qrContainer) {
            GameUtils.generateQRCode(this.elements.qrContainer, sensorUrl);
        }
    }

    // 대규모 경쟁 세션 정보 표시
    displayMassSessionInfo(sessionCode, sensorUrl) {
        if (this.elements.massSessionCode) {
            this.elements.massSessionCode.textContent = sessionCode || '----';
        }
        
        if (this.elements.massQrContainer) {
            GameUtils.generateQRCode(this.elements.massQrContainer, sensorUrl);
        }
    }

    // 대기실 플레이어 목록 업데이트
    updateMassWaitingList(players) {
        if (!this.elements.massWaitingPlayers) return;
        
        this.elements.massWaitingPlayers.innerHTML = '';
        
        players.forEach((player, index) => {
            const playerElement = this.createWaitingPlayerElement(player, index + 1);
            this.elements.massWaitingPlayers.appendChild(playerElement);
        });
        
        // 대기실 제목 업데이트
        const waitingTitle = this.elements.massWaitingList?.querySelector('.waiting-title');
        if (waitingTitle) {
            waitingTitle.textContent = `🎮 참가자 대기실 (${players.length}/${GAME_CONFIG.MASS_COMPETITIVE.maxPlayers})`;
        }
    }

    // 대기 플레이어 요소 생성
    createWaitingPlayerElement(player, position) {
        const playerDiv = GameUtils.createElement('div', 'mass-waiting-player');
        
        // 플레이어 색상 표시
        const colorDiv = GameUtils.createElement('div', 'mass-player-color');
        colorDiv.style.backgroundColor = player.color;
        
        // 플레이어 이름
        const nameDiv = GameUtils.createElement('div', 'mass-player-name');
        nameDiv.textContent = player.name;
        
        // 위치 번호
        const positionDiv = GameUtils.createElement('div', 'mass-player-position');
        positionDiv.textContent = position.toString();
        
        playerDiv.appendChild(colorDiv);
        playerDiv.appendChild(nameDiv);
        playerDiv.appendChild(positionDiv);
        
        return playerDiv;
    }

    // 게임 시작 버튼 상태 업데이트
    updateMassStartButton(canStart, playerCount) {
        if (!this.elements.massStartBtn) return;
        
        this.elements.massStartBtn.disabled = !canStart;
        
        if (canStart) {
            this.elements.massStartBtn.textContent = `🚀 게임 시작 (${playerCount}명)`;
            this.elements.massStartBtn.classList.remove('btn-secondary');
            this.elements.massStartBtn.classList.add('btn-success');
        } else {
            const needed = GAME_CONFIG.MASS_COMPETITIVE.minPlayers - playerCount;
            this.elements.massStartBtn.textContent = `⏳ ${needed}명 더 필요`;
            this.elements.massStartBtn.classList.remove('btn-success');
            this.elements.massStartBtn.classList.add('btn-secondary');
        }
    }

    // 페이지 전환 애니메이션
    animatePageTransition(fromPage, toPage, duration = 300) {
        return new Promise((resolve) => {
            // 페이드 아웃
            if (fromPage) {
                fromPage.style.transition = `opacity ${duration}ms ease-out`;
                fromPage.style.opacity = '0';
            }
            
            setTimeout(() => {
                // 페이지 전환
                if (fromPage) {
                    fromPage.classList.add('hidden');
                    fromPage.style.opacity = '';
                    fromPage.style.transition = '';
                }
                
                if (toPage) {
                    toPage.classList.remove('hidden');
                    toPage.style.opacity = '0';
                    toPage.style.transition = `opacity ${duration}ms ease-in`;
                    
                    // 페이드 인
                    setTimeout(() => {
                        toPage.style.opacity = '1';
                        
                        setTimeout(() => {
                            toPage.style.opacity = '';
                            toPage.style.transition = '';
                            resolve();
                        }, duration);
                    }, 10);
                } else {
                    resolve();
                }
            }, duration);
        });
    }

    // 현재 페이지 반환
    getCurrentPage() {
        return this.currentPage;
    }

    // 특정 페이지인지 확인
    isCurrentPage(pageName) {
        return this.currentPage === pageName;
    }

    // 페이지 전환 콜백 등록
    onPageTransition(event, callback) {
        if (!this.transitionCallbacks.has(event)) {
            this.transitionCallbacks.set(event, []);
        }
        this.transitionCallbacks.get(event).push(callback);
    }

    // 페이지 전환 콜백 실행
    triggerTransitionCallback(event, data = null) {
        if (this.transitionCallbacks.has(event)) {
            this.transitionCallbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`페이지 전환 콜백 오류 (${event}):`, error);
                }
            });
        }
    }

    // 뒤로 가기 (이전 페이지로)
    goBack() {
        switch (this.currentPage) {
            case 'session':
            case 'mass-waiting':
                this.showModeSelection();
                break;
            case 'gameplay':
                // 게임 중에는 뒤로 가기 제한
                console.log('📄 [게임 페이지] 게임 중에는 뒤로 갈 수 없습니다');
                break;
            default:
                console.log('📄 [게임 페이지] 더 이상 뒤로 갈 페이지가 없습니다');
        }
    }

    // 홈으로 가기
    goHome() {
        window.location.href = '/';
    }

    // 페이지 리셋
    reset() {
        this.hideAllPages();
        this.showModeSelection();
        
        // QR 컨테이너 초기화
        if (this.elements.qrContainer) {
            this.elements.qrContainer.innerHTML = 'QR 코드 생성 중...';
        }
        if (this.elements.massQrContainer) {
            this.elements.massQrContainer.innerHTML = 'QR 코드 생성 중...';
        }
        
        // 대기실 초기화
        if (this.elements.massWaitingPlayers) {
            this.elements.massWaitingPlayers.innerHTML = '';
        }
        
        console.log('📄 [게임 페이지] 페이지 리셋 완료');
    }

    // 정리
    cleanup() {
        this.transitionCallbacks.clear();
        this.hideAllPages();
        console.log('📄 [게임 페이지] 정리 완료');
    }
}