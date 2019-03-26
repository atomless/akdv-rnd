;((window, document, math_utils) => {

    'use strict';


    const getTransitionWipeClipPath = (direction, progress) => {

        progress = 1 - progress;
        return direction === 'up'? `inset(${100 * progress}% 0% 0% 0%)` :
               direction === 'down' ? `inset(0% 0% ${100 * progress}% 0%)` :
               direction === 'left'? `inset(0% 0% 0% ${100 * progress}%)` :
               `inset(0% ${100 * progress}% 0% 0%)`;
    };


    const domTransitions = window.domTransitions = {
        wipe: ({
            from_el = window.required(),
            to_el =  window.required(),
            direction = 'top',
            progress = 0
        } = {}) => {
            if (from_el.style.clipPath) {
                from_el.style.clipPath = null;
            }
            to_el.style.clipPath = getTransitionWipeClipPath(direction, progress);
        },

        fade: ({
            from_el = window.required(),
            to_el =  window.required(),
            progress = 0
        } = {}) => {
            from_el.style.opacity = math_utils.clamp(0, 1, 1 - progress);
            to_el.style.opacity = math_utils.clamp(0, 1, progress);
        },

        applyTransition : ({
            container_el,
            progress
        } = {}) => {

            if (container_el) {
                const frame_els = Array.from(container_el.children),
                      frame = math_utils.lerp(-1, frame_els.length + 1, progress),
                      frame_index = frame > frame_els.length? -1 : Math.floor(frame),
                      frame_progress = parseFloat(Math.pow(frame % 1, 5).toFixed(2));

                if (frame_progress !== container_el.getAttribute('data-frame-progress')) {
                    container_el.setAttribute('data-frame-progress', frame_progress);
                } else {
                    return;
                }

                if (frame_index !== container_el.getAttribute('data-frame-index')) {
                    container_el.setAttribute('data-frame-index', frame_index);
                    if (frame_index > -1 || frame_progress < 0) {
                        frame_els.forEach((frame_el, i) => frame_el.setAttribute('data-transition-active', (i >= frame_index && i < frame_index + 2)));
                    }
                }

                let transition_fn = domTransitions[container_el.getAttribute('data-transition-type')];
                if (!transition_fn) {
                    transition_fn = domTransitions['wipe'];
                    window._log.warn(`applyTransition type not defined or supported.  Falling back to transition 'wipe'`);
                }

                window._log.debug2(`Frame index: ${frame_index} - Progress (sloped): ${frame_progress} - Progress (linear): ${frame % 1}`);

                if (frame_index !== -1) {             
                    if (frame_index < frame_els.length - 1 ) {
                        transition_fn({
                            from_el: frame_els[frame_index], 
                            to_el: frame_els[frame_index + 1], 
                            direction: container_el.getAttribute('data-transition-direction'),
                            progress: frame_progress
                        });
                    } else {
                         transition_fn({
                            from_el: frame_els[frame_els.length - 1], 
                            to_el: frame_els[frame_els.length - 1], 
                            direction: container_el.getAttribute('data-transition-direction'),
                            progress: 1
                        });
                    }
                }
            }
        }
    };


})(window, document, window.akdv.utils_math);