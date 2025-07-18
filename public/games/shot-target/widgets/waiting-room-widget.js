// ===== WIDGETS/WAITING-ROOM-WIDGET =====
// 대기실 UI 위젯 (요청사항: 왼쪽 상단에 독립적으로 배치)

import { GAME_CONFIG } from '../shared/config.js';
import { GameUtils } from '../shared/utils.js';

export class WaitingRoomWidget {
    constructor() {
        this.container = null;
        this.players = new Map();
        this.maxPlayers = GAME_CONFIG.MASS_COMPETITIVE.maxPlayers;
        this.minPlayers = GAME_CONFIG.MASS_COMPETITIVE.minPlayers;
        
        this.createWidget();
    }

    // 위젯 생성 (요청사항: 왼쪽 상단에 독립 배치)
    createWidget() {
        // 기존 위젯이 있으면 제거
        const existing = document.getElementById('waitingRoomWidget');
        if (existing) {
            existing.remove();
        }

        // 위젯 컨테이너 생성
        this.container = GameUtils.createElement('div', 'waiting-room-widget', '');
        this.container.id = 'waitingRoomWidget';
        
        // 위젯 스타일 설정 (왼쪽 상단 고정)
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: 280px;
            max-height: 400px;
            background: rgba(30, 41, 59, 0.95);
            border: 2px solid var(--primary);
            border-radius: 12px;
            padding: 16px;
            backdrop-filter: blur(12px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            font-family: 'Segoe UI', sans-serif;
            color: var(--text-primary);
            display: none;
        `;

        // 헤더 생성
        const header = GameUtils.createElement('div', 'waiting-room-header');
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 1.2rem;">👥</span>
                <span style="font-size: 1rem; font-weight: 600; color: var(--primary);">대기실</span>
                <span id="playerCount" style="margin-left: auto; font-size: 0.9rem; color: var(--text-secondary);">0/${this.maxPlayers}</span>
            </div>
        `;

        // 플레이어 목록 컨테이너
        const playerList = GameUtils.createElement('div', 'waiting-player-list');
        playerList.id = 'waitingPlayerList';
        playerList.style.cssText = `
            max-height: 280px;
            overflow-y: auto;
            margin-bottom: 12px;
        `;

        // 상태 메시지
        const statusMessage = GameUtils.createElement('div', 'waiting-status-message');
        statusMessage.id = 'waitingStatusMessage';
        statusMessage.style.cssText = `
            font-size: 0.85rem;
            color: var(--text-secondary);
            text-align: center;
            padding: 8px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(59, 130, 246, 0.2);
        `;
        statusMessage.textContent = `최소 ${this.minPlayers}명이 필요합니다`;

        // 위젯 조립
        this.container.appendChild(header);
        this.container.appendChild(playerList);
        this.container.appendChild(statusMessage);

        // DOM에 추가
        document.body.appendChild(this.container);
    }

    // 위젯 표시
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.container.style.animation = 'fadeInLeft 0.3s ease-out';
        }
    }

    // 위젯 숨김
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    // 플레이어 추가
    addPlayer(playerId, playerName, colorIndex = 0) {
        const player = {
            id: playerId,
            name: playerName,
            colorIndex: colorIndex,
            color: GAME_CONFIG.PLAYER_COLORS[colorIndex % GAME_CONFIG.PLAYER_COLORS.length],
            joinTime: Date.now(),
            isReady: true
        };

        this.players.set(playerId, player);
        this.updatePlayerList();
        this.updateStatus();

        console.log(`👥 [대기실] 플레이어 추가: ${playerName} (${playerId})`);
    }

    // 플레이어 제거
    removePlayer(playerId) {
        if (this.players.has(playerId)) {
            const player = this.players.get(playerId);
            this.players.delete(playerId);
            this.updatePlayerList();
            this.updateStatus();

            console.log(`👥 [대기실] 플레이어 제거: ${player.name} (${playerId})`);
        }
    }

    // 플레이어 목록 업데이트
    updatePlayerList() {
        const playerList = document.getElementById('waitingPlayerList');
        if (!playerList) return;

        playerList.innerHTML = '';

        // 플레이어들을 참가 순서대로 정렬
        const sortedPlayers = Array.from(this.players.values())
            .sort((a, b) => a.joinTime - b.joinTime);

        sortedPlayers.forEach((player, index) => {
            const playerItem = this.createPlayerItem(player, index + 1);
            playerList.appendChild(playerItem);
        });

        // 빈 슬롯 표시
        const emptySlots = this.maxPlayers - this.players.size;
        for (let i = 0; i < emptySlots; i++) {
            const emptySlot = this.createEmptySlot(this.players.size + i + 1);
            playerList.appendChild(emptySlot);
        }
    }

    // 플레이어 아이템 생성
    createPlayerItem(player, position) {
        const item = GameUtils.createElement('div', 'waiting-player-item');
        item.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            margin-bottom: 6px;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 6px;
            transition: all 0.2s ease;
        `;

        // 플레이어 번호
        const positionBadge = GameUtils.createElement('div', 'player-position');
        positionBadge.style.cssText = `
            width: 24px;
            height: 24px;
            background: ${player.color};
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        `;
        positionBadge.textContent = position.toString();

        // 플레이어 정보
        const playerInfo = GameUtils.createElement('div', 'player-info');
        playerInfo.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
        `;

        const playerName = GameUtils.createElement('div', 'player-name');
        playerName.style.cssText = `
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-primary);
        `;
        playerName.textContent = player.name;

        const playerStatus = GameUtils.createElement('div', 'player-status');
        playerStatus.style.cssText = `
            font-size: 0.75rem;
            color: var(--success);
        `;
        playerStatus.textContent = '준비 완료';

        playerInfo.appendChild(playerName);
        playerInfo.appendChild(playerStatus);

        // 연결 상태 표시
        const connectionStatus = GameUtils.createElement('div', 'connection-status');
        connectionStatus.style.cssText = `
            width: 8px;
            height: 8px;
            background: var(--success);
            border-radius: 50%;
            box-shadow: 0 0 6px var(--success);
        `;

        item.appendChild(positionBadge);
        item.appendChild(playerInfo);
        item.appendChild(connectionStatus);

        return item;
    }

    // 빈 슬롯 생성
    createEmptySlot(position) {
        const item = GameUtils.createElement('div', 'waiting-empty-slot');
        item.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            margin-bottom: 6px;
            background: rgba(148, 163, 184, 0.1);
            border: 1px dashed rgba(148, 163, 184, 0.3);
            border-radius: 6px;
            opacity: 0.6;
        `;

        // 빈 슬롯 번호
        const positionBadge = GameUtils.createElement('div', 'empty-position');
        positionBadge.style.cssText = `
            width: 24px;
            height: 24px;
            background: rgba(148, 163, 184, 0.3);
            color: var(--text-muted);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            border: 2px dashed rgba(148, 163, 184, 0.5);
        `;
        positionBadge.textContent = position.toString();

        // 빈 슬롯 텍스트
        const emptyText = GameUtils.createElement('div', 'empty-text');
        emptyText.style.cssText = `
            flex: 1;
            font-size: 0.85rem;
            color: var(--text-muted);
            font-style: italic;
        `;
        emptyText.textContent = '대기 중...';

        item.appendChild(positionBadge);
        item.appendChild(emptyText);

        return item;
    }

    // 상태 업데이트
    updateStatus() {
        const playerCountElement = document.getElementById('playerCount');
        const statusMessageElement = document.getElementById('waitingStatusMessage');
        
        if (playerCountElement) {
            playerCountElement.textContent = `${this.players.size}/${this.maxPlayers}`;
        }

        if (statusMessageElement) {
            const currentCount = this.players.size;
            
            if (currentCount < this.minPlayers) {
                statusMessageElement.textContent = `최소 ${this.minPlayers}명이 필요합니다 (${this.minPlayers - currentCount}명 더)`;
                statusMessageElement.style.background = 'rgba(239, 68, 68, 0.1)';
                statusMessageElement.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                statusMessageElement.style.color = 'var(--error)';
            } else {
                statusMessageElement.textContent = '게임 시작 가능!';
                statusMessageElement.style.background = 'rgba(16, 185, 129, 0.1)';
                statusMessageElement.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                statusMessageElement.style.color = 'var(--success)';
            }
        }
    }

    // 플레이어 수 반환
    getPlayerCount() {
        return this.players.size;
    }

    // 게임 시작 가능 여부 확인
    canStartGame() {
        return this.players.size >= this.minPlayers;
    }

    // 모든 플레이어 정보 반환
    getAllPlayers() {
        return Array.from(this.players.values());
    }

    // 특정 플레이어 정보 반환
    getPlayer(playerId) {
        return this.players.get(playerId) || null;
    }

    // 위젯 리셋
    reset() {
        this.players.clear();
        this.updatePlayerList();
        this.updateStatus();
    }

    // 위젯 제거
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.players.clear();
    }

    // CSS 애니메이션 추가 (한 번만 실행)
    static addStyles() {
        if (document.getElementById('waitingRoomWidgetStyles')) return;

        const style = document.createElement('style');
        style.id = 'waitingRoomWidgetStyles';
        style.textContent = `
            @keyframes fadeInLeft {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            .waiting-player-list::-webkit-scrollbar {
                width: 4px;
            }

            .waiting-player-list::-webkit-scrollbar-track {
                background: rgba(148, 163, 184, 0.1);
                border-radius: 2px;
            }

            .waiting-player-list::-webkit-scrollbar-thumb {
                background: rgba(59, 130, 246, 0.5);
                border-radius: 2px;
            }

            .waiting-player-list::-webkit-scrollbar-thumb:hover {
                background: rgba(59, 130, 246, 0.7);
            }

            .waiting-player-item:hover {
                background: rgba(59, 130, 246, 0.15) !important;
                transform: translateX(2px);
            }
        `;
        
        document.head.appendChild(style);
    }
}

// 스타일 자동 추가
WaitingRoomWidget.addStyles();