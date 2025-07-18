// Shared Layer - 공통 유틸리티 함수

/**
 * 정확도 계산
 */
export function calculateAccuracy(hits, misses) {
    const total = hits + misses;
    return total > 0 ? ((hits / total) * 100).toFixed(1) : 100;
}

/**
 * 시간 포맷팅 (초 -> MM:SS)
 */
export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * 점수 포맷팅 (천 단위 구분)
 */
export function formatScore(score) {
    return score.toLocaleString();
}

/**
 * 랜덤 범위 생성
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * 두 점 사이의 거리 계산
 */
export function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * 값을 범위 내로 제한
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * 배열에서 랜덤 요소 선택
 */
export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * 지연 함수
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}