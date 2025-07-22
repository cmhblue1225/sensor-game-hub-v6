export const CONFIG = {
    targetTypes: {
        large: { radius: 60, points: 100, color: '#ef4444', spawnChance: 0.4 },
        medium: { radius: 40, points: 200, color: '#f59e0b', spawnChance: 0.4 },
        small: { radius: 25, points: 500, color: '#10b981', spawnChance: 0.2 }
    },
    targetLifetime: 5000,  // 5초 후 자동 소멸
    targetSpawnInterval: 2000,  // 2초마다 새 표적 생성 (기본값)
    hitRadius: 15,  // 조준점이 표적 중심에서 이 거리 내에 있으면 발사
    comboMultiplier: 1.5,
    bulletSpeed: 8,
    maxTargets: 3,  // 최대 동시 표적 수 (기본값)

    // ✅ 대규모 경쟁 모드 전용 설정
    massCompetitive: {
        baseTargets: 2,           // 기본 표적 수 (3명 기준)
        targetsPerPlayer: 1,      // 플레이어 1명당 추가 표적 수
        maxTargetsLimit: 12,      // 절대 최대 표적 수 (8명 * 1.5)
        baseSpawnInterval: 1500,  // 기본 생성 간격 (더 빠름)
        minSpawnInterval: 800,    // 최소 생성 간격 (너무 빨라지지 않게)
        spawnIntervalReduction: 100  // 플레이어 1명당 간격 단축
    }
};