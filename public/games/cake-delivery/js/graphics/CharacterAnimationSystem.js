/**
 * 캐릭터 애니메이션 시스템
 * GLB 모델의 애니메이션을 관리하고 제어
 */
class CharacterAnimationSystem {
    constructor() {
        // 애니메이션 믹서들
        this.mixers = new Map();
        
        // 애니메이션 액션들
        this.actions = new Map();
        
        // 현재 재생 중인 애니메이션
        this.currentAnimations = new Map();
        
        // 애니메이션 상태
        this.animationStates = new Map();
        
        // 페이드 설정
        this.defaultFadeTime = 0.5;
        this.crossFadeTime = 0.3;
        
        // 애니메이션 이벤트 리스너
        this.eventListeners = new Map();
        
        // 애니메이션 블렌딩 가중치
        this.blendWeights = new Map();
        
        console.log('🎬 캐릭터 애니메이션 시스템 초기화 완료');
    }
    
    /**
     * 캐릭터 등록
     * @param {string} characterId - 캐릭터 ID
     * @param {THREE.Group} model - 캐릭터 모델
     * @param {Array} animations - 애니메이션 클립 배열
     */
    registerCharacter(characterId, model, animations) {
        console.log(`🎭 캐릭터 등록: ${characterId}`);
        
        // 애니메이션 믹서 생성
        const mixer = new THREE.AnimationMixer(model);
        this.mixers.set(characterId, mixer);
        
        // 애니메이션 액션 생성
        const characterActions = new Map();
        const characterStates = new Map();
        
        if (animations && animations.length > 0) {
            animations.forEach((clip, index) => {
                const actionName = clip.name || `animation_${index}`;
                const action = mixer.clipAction(clip);
                
                // 액션 설정
                action.setEffectiveTimeScale(1);
                action.setEffectiveWeight(1);
                action.clampWhenFinished = true;
                
                characterActions.set(actionName, action);
                characterStates.set(actionName, {
                    isPlaying: false,
                    isPaused: false,
                    loop: THREE.LoopRepeat,
                    timeScale: 1.0,
                    weight: 1.0,
                    duration: clip.duration,
                    currentTime: 0
                });
                
                console.log(`  📽️ 애니메이션 등록: ${actionName} (${clip.duration.toFixed(2)}초)`);
            });
        }
        
        this.actions.set(characterId, characterActions);
        this.animationStates.set(characterId, characterStates);
        this.currentAnimations.set(characterId, null);
        this.blendWeights.set(characterId, new Map());
        
        // 믹서 이벤트 리스너 설정
        this.setupMixerEvents(characterId, mixer);
        
        return {
            mixer,
            actions: characterActions,
            availableAnimations: Array.from(characterActions.keys())
        };
    }
    
    /**
     * 믹서 이벤트 설정
     * @param {string} characterId - 캐릭터 ID
     * @param {THREE.AnimationMixer} mixer - 애니메이션 믹서
     */
    setupMixerEvents(characterId, mixer) {
        // 애니메이션 완료 이벤트
        mixer.addEventListener('finished', (event) => {
            const action = event.action;
            const clipName = action.getClip().name;
            
            console.log(`🏁 애니메이션 완료: ${characterId}.${clipName}`);
            
            // 상태 업데이트
            const states = this.animationStates.get(characterId);
            if (states && states.has(clipName)) {
                const state = states.get(clipName);
                state.isPlaying = false;
                state.currentTime = 0;
            }
            
            // 이벤트 발생
            this.dispatchEvent(characterId, 'animationFinished', {
                characterId,
                animationName: clipName,
                action
            });
        });
        
        // 애니메이션 루프 이벤트
        mixer.addEventListener('loop', (event) => {
            const action = event.action;
            const clipName = action.getClip().name;
            
            console.log(`🔄 애니메이션 루프: ${characterId}.${clipName}`);
            
            // 이벤트 발생
            this.dispatchEvent(characterId, 'animationLoop', {
                characterId,
                animationName: clipName,
                action,
                loopCount: event.loopDelta
            });
        });
    }
    
    /**
     * 애니메이션 재생
     * @param {string} characterId - 캐릭터 ID
     * @param {string} animationName - 애니메이션 이름
     * @param {Object} options - 재생 옵션
     */
    playAnimation(characterId, animationName, options = {}) {
        const actions = this.actions.get(characterId);
        const states = this.animationStates.get(characterId);
        
        if (!actions || !actions.has(animationName)) {
            console.warn(`⚠️ 애니메이션을 찾을 수 없음: ${characterId}.${animationName}`);
            return false;
        }
        
        const action = actions.get(animationName);
        const state = states.get(animationName);
        
        // 옵션 적용
        const {
            fadeIn = this.defaultFadeTime,
            loop = THREE.LoopRepeat,
            timeScale = 1.0,
            weight = 1.0,
            startTime = 0,
            crossFade = true
        } = options;
        
        // 현재 재생 중인 애니메이션 처리
        const currentAnimation = this.currentAnimations.get(characterId);
        if (currentAnimation && currentAnimation !== animationName && crossFade) {
            this.crossFadeToAnimation(characterId, currentAnimation, animationName, this.crossFadeTime);
        } else {
            // 기존 애니메이션 정지
            if (currentAnimation) {
                this.stopAnimation(characterId, currentAnimation, fadeIn);
            }
            
            // 새 애니메이션 설정
            action.reset();
            action.setLoop(loop);
            action.setEffectiveTimeScale(timeScale);
            action.setEffectiveWeight(weight);
            action.time = startTime;
            
            // 페이드인으로 재생
            action.fadeIn(fadeIn);
            action.play();
        }
        
        // 상태 업데이트
        state.isPlaying = true;
        state.isPaused = false;
        state.loop = loop;
        state.timeScale = timeScale;
        state.weight = weight;
        state.currentTime = startTime;
        
        this.currentAnimations.set(characterId, animationName);
        
        console.log(`▶️ 애니메이션 재생: ${characterId}.${animationName}`);
        
        // 이벤트 발생
        this.dispatchEvent(characterId, 'animationStarted', {
            characterId,
            animationName,
            options
        });
        
        return true;
    }
    
    /**
     * 크로스페이드 애니메이션
     * @param {string} characterId - 캐릭터 ID
     * @param {string} fromAnimation - 현재 애니메이션
     * @param {string} toAnimation - 대상 애니메이션
     * @param {number} duration - 크로스페이드 시간
     */
    crossFadeToAnimation(characterId, fromAnimation, toAnimation, duration) {
        const actions = this.actions.get(characterId);
        
        if (!actions || !actions.has(fromAnimation) || !actions.has(toAnimation)) {
            console.warn(`⚠️ 크로스페이드 실패: 애니메이션을 찾을 수 없음`);
            return false;
        }
        
        const fromAction = actions.get(fromAnimation);
        const toAction = actions.get(toAnimation);
        
        // 대상 애니메이션 준비
        toAction.reset();
        toAction.setEffectiveWeight(0);
        toAction.play();
        
        // 크로스페이드 실행
        fromAction.crossFadeTo(toAction, duration, true);
        
        console.log(`🔄 크로스페이드: ${characterId}.${fromAnimation} → ${toAnimation}`);
        
        return true;
    }
    
    /**
     * 애니메이션 정지
     * @param {string} characterId - 캐릭터 ID
     * @param {string} animationName - 애니메이션 이름
     * @param {number} fadeOut - 페이드아웃 시간
     */
    stopAnimation(characterId, animationName, fadeOut = this.defaultFadeTime) {
        const actions = this.actions.get(characterId);
        const states = this.animationStates.get(characterId);
        
        if (!actions || !actions.has(animationName)) {
            return false;
        }
        
        const action = actions.get(animationName);
        const state = states.get(animationName);
        
        if (fadeOut > 0) {
            action.fadeOut(fadeOut);
        } else {
            action.stop();
        }
        
        // 상태 업데이트
        state.isPlaying = false;
        state.isPaused = false;
        
        // 현재 애니메이션이 이것이었다면 클리어
        if (this.currentAnimations.get(characterId) === animationName) {
            this.currentAnimations.set(characterId, null);
        }
        
        console.log(`⏹️ 애니메이션 정지: ${characterId}.${animationName}`);
        
        return true;
    }
    
    /**
     * 애니메이션 일시정지
     * @param {string} characterId - 캐릭터 ID
     * @param {string} animationName - 애니메이션 이름
     */
    pauseAnimation(characterId, animationName) {
        const actions = this.actions.get(characterId);
        const states = this.animationStates.get(characterId);
        
        if (!actions || !actions.has(animationName)) {
            return false;
        }
        
        const action = actions.get(animationName);
        const state = states.get(animationName);
        
        action.paused = true;
        state.isPaused = true;
        
        console.log(`⏸️ 애니메이션 일시정지: ${characterId}.${animationName}`);
        
        return true;
    }
    
    /**
     * 애니메이션 재개
     * @param {string} characterId - 캐릭터 ID
     * @param {string} animationName - 애니메이션 이름
     */
    resumeAnimation(characterId, animationName) {
        const actions = this.actions.get(characterId);
        const states = this.animationStates.get(characterId);
        
        if (!actions || !actions.has(animationName)) {
            return false;
        }
        
        const action = actions.get(animationName);
        const state = states.get(animationName);
        
        action.paused = false;
        state.isPaused = false;
        
        console.log(`▶️ 애니메이션 재개: ${characterId}.${animationName}`);
        
        return true;
    }
    
    /**
     * 애니메이션 블렌딩
     * @param {string} characterId - 캐릭터 ID
     * @param {Array} animationBlends - 블렌딩할 애니메이션들과 가중치
     */
    blendAnimations(characterId, animationBlends) {
        const actions = this.actions.get(characterId);
        
        if (!actions) {
            console.warn(`⚠️ 캐릭터를 찾을 수 없음: ${characterId}`);
            return false;
        }
        
        // 모든 애니메이션 가중치 초기화
        actions.forEach((action, name) => {
            action.setEffectiveWeight(0);
        });
        
        // 블렌딩 가중치 적용
        let totalWeight = 0;
        animationBlends.forEach(({ name, weight }) => {
            if (actions.has(name)) {
                const action = actions.get(name);
                action.setEffectiveWeight(weight);
                action.play();
                totalWeight += weight;
            }
        });
        
        // 가중치 정규화
        if (totalWeight > 0) {
            animationBlends.forEach(({ name, weight }) => {
                if (actions.has(name)) {
                    const action = actions.get(name);
                    action.setEffectiveWeight(weight / totalWeight);
                }
            });
        }
        
        console.log(`🎭 애니메이션 블렌딩: ${characterId}`, animationBlends);
        
        return true;
    }
    
    /**
     * 애니메이션 속도 설정
     * @param {string} characterId - 캐릭터 ID
     * @param {string} animationName - 애니메이션 이름
     * @param {number} timeScale - 시간 스케일
     */
    setAnimationSpeed(characterId, animationName, timeScale) {
        const actions = this.actions.get(characterId);
        const states = this.animationStates.get(characterId);
        
        if (!actions || !actions.has(animationName)) {
            return false;
        }
        
        const action = actions.get(animationName);
        const state = states.get(animationName);
        
        action.setEffectiveTimeScale(timeScale);
        state.timeScale = timeScale;
        
        console.log(`⚡ 애니메이션 속도 변경: ${characterId}.${animationName} = ${timeScale}x`);
        
        return true;
    }
    
    /**
     * 애니메이션 시간 설정
     * @param {string} characterId - 캐릭터 ID
     * @param {string} animationName - 애니메이션 이름
     * @param {number} time - 시간 (초)
     */
    setAnimationTime(characterId, animationName, time) {
        const actions = this.actions.get(characterId);
        const states = this.animationStates.get(characterId);
        
        if (!actions || !actions.has(animationName)) {
            return false;
        }
        
        const action = actions.get(animationName);
        const state = states.get(animationName);
        
        action.time = Math.max(0, Math.min(time, state.duration));
        state.currentTime = action.time;
        
        return true;
    }
    
    /**
     * 스마트 애니메이션 전환
     * 게임 상황에 맞는 애니메이션을 자동으로 선택
     * @param {string} characterId - 캐릭터 ID
     * @param {string} gameState - 게임 상태
     * @param {Object} context - 컨텍스트 정보
     */
    smartTransition(characterId, gameState, context = {}) {
        const actions = this.actions.get(characterId);
        if (!actions) return false;
        
        const availableAnimations = Array.from(actions.keys());
        let targetAnimation = null;
        
        // 게임 상태에 따른 애니메이션 선택 로직
        switch (gameState) {
            case 'idle':
                targetAnimation = this.findBestAnimation(availableAnimations, ['idle', 'standing', 'wait']);
                break;
                
            case 'moving':
                if (context.direction === 'forward') {
                    targetAnimation = this.findBestAnimation(availableAnimations, ['pushing', 'walking', 'move']);
                } else if (context.direction === 'backward') {
                    targetAnimation = this.findBestAnimation(availableAnimations, ['pulling', 'walking_back', 'move_back']);
                }
                break;
                
            case 'carrying':
                targetAnimation = this.findBestAnimation(availableAnimations, ['carrying', 'holding', 'transport']);
                break;
                
            case 'celebrating':
                targetAnimation = this.findBestAnimation(availableAnimations, ['celebrate', 'victory', 'happy']);
                break;
                
            case 'failing':
                targetAnimation = this.findBestAnimation(availableAnimations, ['fail', 'sad', 'disappointed']);
                break;
        }
        
        // 애니메이션 전환
        if (targetAnimation && this.currentAnimations.get(characterId) !== targetAnimation) {
            this.playAnimation(characterId, targetAnimation, {
                crossFade: true,
                fadeIn: 0.3
            });
            
            console.log(`🎯 스마트 전환: ${characterId} → ${targetAnimation} (상태: ${gameState})`);
            return true;
        }
        
        return false;
    }
    
    /**
     * 최적 애니메이션 찾기
     * @param {Array} availableAnimations - 사용 가능한 애니메이션들
     * @param {Array} preferredNames - 선호하는 애니메이션 이름들
     * @returns {string|null}
     */
    findBestAnimation(availableAnimations, preferredNames) {
        for (const preferred of preferredNames) {
            // 정확한 매치
            if (availableAnimations.includes(preferred)) {
                return preferred;
            }
            
            // 부분 매치
            const partialMatch = availableAnimations.find(anim => 
                anim.toLowerCase().includes(preferred.toLowerCase())
            );
            if (partialMatch) {
                return partialMatch;
            }
        }
        
        // 기본값으로 첫 번째 애니메이션 반환
        return availableAnimations.length > 0 ? availableAnimations[0] : null;
    }
    
    /**
     * 애니메이션 업데이트
     * @param {number} deltaTime - 델타 시간
     */
    update(deltaTime) {
        // 모든 믹서 업데이트
        this.mixers.forEach((mixer, characterId) => {
            mixer.update(deltaTime);
            
            // 현재 시간 업데이트
            const states = this.animationStates.get(characterId);
            const currentAnim = this.currentAnimations.get(characterId);
            
            if (states && currentAnim && states.has(currentAnim)) {
                const state = states.get(currentAnim);
                const actions = this.actions.get(characterId);
                const action = actions.get(currentAnim);
                
                if (action && state.isPlaying) {
                    state.currentTime = action.time;
                }
            }
        });
    }
    
    /**
     * 이벤트 리스너 추가
     * @param {string} characterId - 캐릭터 ID
     * @param {string} eventType - 이벤트 타입
     * @param {Function} callback - 콜백 함수
     */
    addEventListener(characterId, eventType, callback) {
        const key = `${characterId}_${eventType}`;
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        this.eventListeners.get(key).push(callback);
    }
    
    /**
     * 이벤트 발생
     * @param {string} characterId - 캐릭터 ID
     * @param {string} eventType - 이벤트 타입
     * @param {Object} data - 이벤트 데이터
     */
    dispatchEvent(characterId, eventType, data) {
        const key = `${characterId}_${eventType}`;
        const listeners = this.eventListeners.get(key);
        
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`애니메이션 이벤트 처리 오류:`, error);
                }
            });
        }
    }
    
    /**
     * 캐릭터 상태 정보 반환
     * @param {string} characterId - 캐릭터 ID
     * @returns {Object|null}
     */
    getCharacterState(characterId) {
        const states = this.animationStates.get(characterId);
        const currentAnim = this.currentAnimations.get(characterId);
        
        if (!states) return null;
        
        return {
            currentAnimation: currentAnim,
            availableAnimations: Array.from(states.keys()),
            animationStates: Object.fromEntries(states),
            isPlaying: currentAnim ? states.get(currentAnim)?.isPlaying : false
        };
    }
    
    /**
     * 캐릭터 제거
     * @param {string} characterId - 캐릭터 ID
     */
    removeCharacter(characterId) {
        // 모든 애니메이션 정지
        const actions = this.actions.get(characterId);
        if (actions) {
            actions.forEach(action => action.stop());
        }
        
        // 데이터 정리
        this.mixers.delete(characterId);
        this.actions.delete(characterId);
        this.animationStates.delete(characterId);
        this.currentAnimations.delete(characterId);
        this.blendWeights.delete(characterId);
        
        // 이벤트 리스너 정리
        const keysToDelete = [];
        this.eventListeners.forEach((listeners, key) => {
            if (key.startsWith(`${characterId}_`)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.eventListeners.delete(key));
        
        console.log(`🗑️ 캐릭터 제거: ${characterId}`);
    }
    
    /**
     * 모든 캐릭터 정리
     */
    cleanup() {
        console.log('🧹 캐릭터 애니메이션 시스템 정리 시작...');
        
        // 모든 캐릭터 제거
        const characterIds = Array.from(this.mixers.keys());
        characterIds.forEach(id => this.removeCharacter(id));
        
        console.log('✅ 캐릭터 애니메이션 시스템 정리 완료');
    }
    
    /**
     * 디버그 정보 반환
     * @returns {Object}
     */
    getDebugInfo() {
        const debugInfo = {
            characterCount: this.mixers.size,
            characters: {}
        };
        
        this.mixers.forEach((mixer, characterId) => {
            const state = this.getCharacterState(characterId);
            debugInfo.characters[characterId] = {
                ...state,
                mixerTime: mixer.time
            };
        });
        
        return debugInfo;
    }
}