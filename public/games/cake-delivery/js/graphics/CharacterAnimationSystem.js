/**
 * 캐릭터 애니메이션 시스템
 * 3D 캐릭터의 애니메이션을 관리합니다.
 */
class CharacterAnimationSystem {
    constructor() {
        this.characters = new Map();
        this.mixers = new Map();
        this.actions = new Map();
        this.eventListeners = new Map();
        
        console.log('✅ 캐릭터 애니메이션 시스템 초기화 완료');
    }
    
    /**
     * 캐릭터 등록
     */
    registerCharacter(characterId, model, animationClips) {
        const mixer = new THREE.AnimationMixer(model);
        const actions = {};
        
        // 애니메이션 액션 생성
        animationClips.forEach(clip => {
            const action = mixer.clipAction(clip);
            actions[clip.name] = action;
        });
        
        this.characters.set(characterId, model);
        this.mixers.set(characterId, mixer);
        this.actions.set(characterId, actions);
        
        // 이벤트 리스너 설정
        mixer.addEventListener('finished', (event) => {
            this.dispatchEvent(characterId, 'animationFinished', {
                animationName: event.action.getClip().name
            });
        });
        
        mixer.addEventListener('loop', (event) => {
            this.dispatchEvent(characterId, 'animationLoop', {
                animationName: event.action.getClip().name
            });
        });
        
        console.log(`👤 캐릭터 등록: ${characterId}`);
        return { model, mixer, actions };
    }
    
    /**
     * 애니메이션 재생
     */
    playAnimation(characterId, animationName, options = {}) {
        const actions = this.actions.get(characterId);
        if (!actions || !actions[animationName]) {
            console.warn(`애니메이션을 찾을 수 없습니다: ${characterId}/${animationName}`);
            return false;
        }
        
        const action = actions[animationName];
        
        // 기존 애니메이션 중지
        Object.values(actions).forEach(a => a.stop());
        
        // 새 애니메이션 설정
        action.reset();
        action.setLoop(options.loop || THREE.LoopRepeat);
        action.clampWhenFinished = options.clampWhenFinished || false;
        
        if (options.fadeIn) {
            action.fadeIn(options.fadeIn);
        }
        
        action.play();
        
        console.log(`🎬 애니메이션 재생: ${characterId}/${animationName}`);
        return true;
    }
    
    /**
     * 스마트 애니메이션 전환
     */
    smartTransition(characterId, targetAnimation, context = {}) {
        const actions = this.actions.get(characterId);
        if (!actions) return false;
        
        const currentAction = this.getCurrentAction(characterId);
        const targetAction = actions[targetAnimation];
        
        if (!targetAction) return false;
        
        // 같은 애니메이션이면 무시
        if (currentAction && currentAction === targetAction && currentAction.isRunning()) {
            return true;
        }
        
        // 부드러운 전환
        if (currentAction && currentAction.isRunning()) {
            currentAction.fadeOut(0.3);
        }
        
        targetAction.reset();
        targetAction.fadeIn(0.3);
        targetAction.play();
        
        return true;
    }
    
    /**
     * 현재 실행 중인 액션 가져오기
     */
    getCurrentAction(characterId) {
        const actions = this.actions.get(characterId);
        if (!actions) return null;
        
        for (const action of Object.values(actions)) {
            if (action.isRunning()) {
                return action;
            }
        }
        
        return null;
    }
    
    /**
     * 업데이트
     */
    update(deltaTime) {
        this.mixers.forEach((mixer, characterId) => {
            mixer.update(deltaTime);
        });
    }
    
    /**
     * 이벤트 리스너 등록
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
     */
    dispatchEvent(characterId, eventType, data) {
        const key = `${characterId}_${eventType}`;
        const listeners = this.eventListeners.get(key);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`애니메이션 이벤트 오류 (${key}):`, error);
                }
            });
        }
    }
    
    /**
     * 캐릭터 제거
     */
    removeCharacter(characterId) {
        this.characters.delete(characterId);
        this.mixers.delete(characterId);
        this.actions.delete(characterId);
        
        // 이벤트 리스너 정리
        const keysToDelete = [];
        this.eventListeners.forEach((listeners, key) => {
            if (key.startsWith(characterId + '_')) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.eventListeners.delete(key));
        
        console.log(`👤 캐릭터 제거: ${characterId}`);
    }
}