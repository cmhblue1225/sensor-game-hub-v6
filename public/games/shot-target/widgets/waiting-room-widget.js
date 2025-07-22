export class WaitingRoomWidget {
    constructor(elements) {
        this.elements = elements;
    }

    async displaySessionInfo(session) {
        this.elements.sessionCode.textContent = session.sessionCode || '----';

        const sensorUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;

        try {
            if (typeof QRCode !== 'undefined') {
                const canvas = document.createElement('canvas');
                await new Promise((resolve, reject) => {
                    QRCode.toCanvas(canvas, sensorUrl, { width: 200 }, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
                this.elements.qrContainer.innerHTML = '';
                this.elements.qrContainer.appendChild(canvas);
            } else {
                const img = document.createElement('img');
                img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sensorUrl)}`;
                img.alt = 'QR Code';
                img.style.width = '200px';
                img.style.height = '200px';
                this.elements.qrContainer.innerHTML = '';
                this.elements.qrContainer.appendChild(img);
            }
        } catch (error) {
            console.error('QR 코드 생성 실패:', error);
            this.elements.qrContainer.innerHTML = `<p>QR 코드: ${sensorUrl}</p>`;
        }
    }

    async displayMassSessionInfo(session) {
        this.elements.massSessionCode.textContent = session.sessionCode || '----';

        const sensorUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;

        try {
            if (typeof QRCode !== 'undefined') {
                const canvas = document.createElement('canvas');
                await new Promise((resolve, reject) => {
                    QRCode.toCanvas(canvas, sensorUrl, { width: 200 }, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
                this.elements.massQrContainer.innerHTML = '';
                this.elements.massQrContainer.appendChild(canvas);
            } else {
                const img = document.createElement('img');
                img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sensorUrl)}`;
                img.alt = 'QR Code';
                img.style.width = '200px';
                img.style.height = '200px';
                this.elements.massQrContainer.innerHTML = '';
                this.elements.massQrContainer.appendChild(img);
            }
        } catch (error) {
            console.error('QR 코드 생성 실패:', error);
            this.elements.massQrContainer.innerHTML = `<p>QR 코드: ${sensorUrl}</p>`;
        }
    }

    updateMassWaitingList(massPlayers, myPlayerId = null) {
        const waitingTitle = this.elements.massWaitingListWidget.querySelector('.waiting-title');
        waitingTitle.textContent = `🎮 참가자 대기실 (${massPlayers.size}/8)`;

        const waitingPlayers = this.elements.massWaitingPlayers;
        waitingPlayers.innerHTML = '';

        Array.from(massPlayers.values()).forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'mass-waiting-player';
            playerElement.innerHTML = `
                <div class="mass-player-color" style="background-color: ${player.color};"></div>
                <span>${player.name}</span>
            `;
            waitingPlayers.appendChild(playerElement);
        });
    }

    updateMassPlayerCount(count) {
        this.elements.massPlayerCount.textContent = `${count}/8`;
    }

    updateServerStatus(connected) {
        this.elements.serverStatus.classList.toggle('connected', connected);
    }

    updateSensorStatus(connected) {
        this.elements.sensorStatus.classList.toggle('connected', connected);
    }

    updateSensor1Status(connected) {
        if (this.elements.sensor1Status) {
            this.elements.sensor1Status.classList.toggle('connected', connected);
        }
    }

    updateSensor2Status(connected) {
        if (this.elements.sensor2Status) {
            this.elements.sensor2Status.classList.toggle('connected', connected);
        }
    }

    updateGameStatus(status) {
        this.elements.gameStatusText.textContent = status;
    }

    hideSessionPanel() {
        this.elements.sessionPanel.classList.add('hidden');
        this.elements.gameInfoPanel.classList.remove('hidden');
        this.elements.crosshair.classList.remove('hidden');
    }

    hideMassWaitingPanel() {
        this.elements.massWaitingPanel.classList.add('hidden');
        this.elements.massWaitingListWidget.classList.add('hidden');
        this.elements.massCompetitivePanel.classList.remove('hidden');
        this.elements.gameInfoPanel.classList.add('hidden');
        this.elements.crosshair.classList.remove('hidden');
        
        // 확실히 대기 목록 위젯이 숨겨지도록 추가 보장
        if (this.elements.massWaitingListWidget) {
            this.elements.massWaitingListWidget.style.display = 'none';
        }
    }
}