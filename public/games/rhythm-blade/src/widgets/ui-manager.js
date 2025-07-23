// QR 코드 폴백(Fallback) 함수
export function showQRCodeFallback(qrUrl) {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
    const img = document.createElement('img');
    img.src = qrApiUrl;
    img.style.width = '200px';
    img.style.height = '200px';
    img.alt = 'QR Code';
    
    const qrContainer = document.getElementById('qrContainer');
    qrContainer.innerHTML = '';
    qrContainer.appendChild(img);
}

// 세션 정보 및 QR 코드 표시
export function displaySessionInfo(session) {
    if (!session || !session.sessionCode) {
        console.error("세션 정보가 올바르지 않습니다.", session);
        return;
    }
    document.getElementById('sessionCode').textContent = session.sessionCode;
    
    const qrUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
    const qrContainer = document.getElementById('qrContainer');
    
    if (typeof QRCode !== 'undefined') {
        QRCode.toCanvas(document.createElement('canvas'), qrUrl, { width: 200 }, (error, canvas) => {
            if (!error) {
                qrContainer.innerHTML = '';
                qrContainer.appendChild(canvas);
            } else {
                console.error('QR 코드 생성 실패:', error);
                showQRCodeFallback(qrUrl);
            }
        });
    } else {
        console.warn('QRCode 라이브러리가 로드되지 않았습니다. 폴백 API를 사용합니다.');
        showQRCodeFallback(qrUrl);
    }
}

// 센서 연결 상태 UI 업데이트
export function updateSensorStatus(sensorId, connected) {
    const statusElement = document.getElementById(`${sensorId}Status`);
    if (statusElement) {
        statusElement.textContent = connected ? '연결됨 ✅' : '연결 해제됨 ❌';
        statusElement.style.color = connected ? '#10b981' : '#ef4444';
    }
}

// 게임 시작 버튼 표시
export function showStartButton(onStartClick) {
    const sessionPanel = document.getElementById('sessionPanel');
    let startButton = sessionPanel.querySelector('.btn-primary');
    
    if (!startButton) {
        startButton = document.createElement('button');
        startButton.className = 'btn btn-primary';
        startButton.style.cssText = 'font-size: 1.2rem; padding: 1rem 2rem; margin-top: 1rem;';
        startButton.innerHTML = '🎵 게임 시작!';
        sessionPanel.appendChild(startButton);
    }
    
    startButton.onclick = () => {
        startButton.remove();
        onStartClick();
    };
}

// 게임 통계 UI 업데이트
export function updateGameStats(gameState) {
    document.getElementById('scoreValue').textContent = gameState.score;
    document.getElementById('comboValue').textContent = gameState.combo;
    
    const accuracy = gameState.totalNotes > 0 ? 
                     ((gameState.hitNotes / gameState.totalNotes) * 100).toFixed(1) : 100;
    document.getElementById('accuracyValue').textContent = `${accuracy}%`;
}

// 협력 게이지 UI 업데이트
export function updateCooperationMeter(cooperation) {
    const fillElement = document.getElementById('cooperationFill');
    if(fillElement) {
        fillElement.style.width = `${cooperation.sync}%`;
    }
}

// 음악 선택 UI 업데이트
function updateTrackSelectionUI(game) {
    document.querySelectorAll('.track-option').forEach(option => {
        option.classList.remove('selected');
        option.querySelector('.track-status').textContent = '';
    });

    const selectedOption = document.getElementById(`track-${game.currentTrack}`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
        selectedOption.querySelector('.track-status').textContent = '✓';
    }
    
    const track = game.tracks[game.currentTrack];
    document.getElementById('selectedTrackName').textContent = track.name;
}

// 음악 선택 시스템 설정
export function setupMusicSelection(game) {
    document.querySelectorAll('.track-option').forEach(option => {
        option.addEventListener('click', () => {
            const trackId = option.getAttribute('data-track');
            if (game.gameState.phase !== 'playing') {
                game.selectTrack(trackId);
                updateTrackSelectionUI(game);
            }
        });
    });
    updateTrackSelectionUI(game);
}