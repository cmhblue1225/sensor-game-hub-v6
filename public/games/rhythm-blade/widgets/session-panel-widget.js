import { Utils } from '../shared/utils.js';

export class SessionPanelWidget {
    constructor(container) {
        this.container = container;
    }

    show() {
        this.container.classList.remove('hidden');
    }

    hide() {
        this.container.classList.add('hidden');
    }

    updateSessionCode(sessionCode) {
        const sessionCodeElement = document.getElementById('sessionCodeDisplay');
        if (sessionCodeElement) {
            sessionCodeElement.textContent = sessionCode;
        }
    }

    createQRCode(sessionCode) {
        const qrUrl = `${window.location.origin}/sensor.html?session=${sessionCode}`;
        const qrContainer = document.getElementById('qrCodeContainer');
        
        if (qrContainer) {
            qrContainer.innerHTML = '';
            Utils.createQRCode(qrContainer, qrUrl);
        }
    }

    showStartButton(onStart) {
        const startButton = document.createElement('button');
        startButton.className = 'btn btn-primary';
        startButton.textContent = '🎮 게임 시작';
        startButton.style.cssText = `
            margin-top: 20px;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            border: none;
            border-radius: 10px;
            background: linear-gradient(45deg, #3b82f6, #1d4ed8);
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        startButton.addEventListener('click', onStart);
        startButton.addEventListener('mouseover', () => {
            startButton.style.transform = 'scale(1.05)';
            startButton.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
        });
        
        startButton.addEventListener('mouseout', () => {
            startButton.style.transform = 'scale(1)';
            startButton.style.boxShadow = 'none';
        });

        const sessionPanel = document.getElementById('sessionPanel');
        if (sessionPanel) {
            sessionPanel.appendChild(startButton);
        }
    }

    updateSensorStatus(sensorId, connected) {
        const statusElement = document.getElementById(`${sensorId}Status`);
        if (statusElement) {
            if (connected) {
                statusElement.textContent = '연결됨';
                statusElement.className = 'sensor-status connected';
            } else {
                statusElement.textContent = '연결 대기중';
                statusElement.className = 'sensor-status disconnected';
            }
        }
    }
}