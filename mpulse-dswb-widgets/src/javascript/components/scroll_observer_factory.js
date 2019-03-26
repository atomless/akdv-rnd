;((window, document, event_utils, math_utils, string_utils, dom_utils, data_utils) => {

    'use strict';

    const scrollObserverFactory = window.scrollObserverFactory = ({
        container_el = window.required(),
        selector = window.required(),
        offset = 0.5,
        once = false,
        header = true,
        footer = true,
        debug = false,
        uuid = string_utils.generateUUID()
    } = {}) => {

        const state = Object.seal({
            scroller_el: null,
            scroll_elements: Array.from(container_el.querySelectorAll(selector)),
            container_height: 0,
            is_scroll_tick: false
        });

        const getElementOffsetFromTop = () => state.container_height - math_utils.clamp(0, 1, offset) * state.container_height;

        const updateHeight = () => {
          
            state.container_height = container_el.offsetHeight;
        };

        const updateElementStateEnterExit = (el, el_bounding_rect, distance_from_top) => {

            const { top, bottom } = el_bounding_rect,
                  is_el_top_above_offset = top < distance_from_top,
                  is_el_bottom_above_offset = bottom < distance_from_top,
                  is_el_top_below_offset = top > distance_from_top,
                  is_el_bottom_below_offset = bottom > distance_from_top,
                  data_scroll_active = el.getAttribute('data-scroll-active');

            if (is_el_bottom_below_offset && is_el_top_above_offset && data_scroll_active !== 'true') {
                el.setAttribute('data-scroll-progress', 0);
                el.setAttribute('data-scroll-active', true);
                container_el.dispatchEvent(new CustomEvent("scroll-observer-enter", { detail: el }));
                container_el.dispatchEvent(new CustomEvent("scroll-observer-progress", { detail: el }));
                window._log.debug(`scrollObserverFactory enter: ${el.id}`);
            } else if ((is_el_top_above_offset && is_el_bottom_above_offset
                    ||  is_el_top_below_offset && is_el_bottom_below_offset)
                    &&  data_scroll_active === 'true') {
                el.setAttribute('data-scroll-progress', 0);
                el.setAttribute('data-scroll-active', false);
                container_el.dispatchEvent(new CustomEvent("scroll-observer-progress", { detail: el }));
                container_el.dispatchEvent(new CustomEvent("scroll-observer-exit", { detail: el }));
                window._log.debug(`scrollObserverFactory exit: ${el.id}`);
            }
        };

        const updateElementStateProgress = (el, el_bounding_rect, distance_from_top) => {

            const { top, bottom, height } = el_bounding_rect,
                  is_el_top_above_offset = top < distance_from_top,
                  is_el_bottom_above_offset = bottom < distance_from_top;

            if (is_el_top_above_offset && !is_el_bottom_above_offset) {
                const delta = math_utils.clamp(0, 1, (distance_from_top - top) / height);
                el.setAttribute('data-scroll-progress', delta);
                container_el.dispatchEvent(new CustomEvent("scroll-observer-progress", { detail: el }));
                window._log.debug2(`scrollObserverFactory progress: ${el.id}`, delta);
            }

            if (is_el_bottom_above_offset && parseFloat(el.getAttribute('data-scroll-progress')) !== 1) {
                el.setAttribute('data-scroll-progress', 1);
                container_el.dispatchEvent(new CustomEvent("scroll-observer-progress", { detail: el }));
                window._log.debug2(`scrollObserverFactory progress: ${el.id}`, 1);
            }
        };

        const updateScroll = () => {

          state.is_scroll_tick = false;
          const distance_from_top = getElementOffsetFromTop();

          state.scroll_elements = state.scroll_elements.filter(el => {

            const el_bounding_rect = el.getBoundingClientRect();
            
            updateElementStateEnterExit(el, el_bounding_rect, distance_from_top);

            let keep_el = !(once && el.getAttribute('data-scroll-progress') === '1');

            if (keep_el) {
                updateElementStateProgress(el, el_bounding_rect, distance_from_top);
            }

            return keep_el;
          });

          container_el.dispatchEvent(new Event("scroll-update"));
        };

        const onScroll = e => {

          if (!state.is_scroll_tick) {
            state.is_scroll_tick = true;
            event_utils.waitForNextPaint().then(updateScroll);
          }
        };

        const onResize = e => {

          updateHeight();
          updateScroll();
        };

        const onScrollUpdate = e => {

            if (!state.scroll_elements.length) {
                container_el.removeEventListener('scroll', onScroll, true);
            }
        };

        const bindEventListeners = () => {

          window.addEventListener('resize', onResize, true);
          container_el.addEventListener('scroll', onScroll, true);
          container_el.addEventListener('scroll-update', onScrollUpdate, true);
          onResize();
        };

        const initScrollDOM = () => {

            const scroller_el = dom_utils.createElementFromHTMLString(`<div id="scroll-observer-scroller-${uuid} class="scroll-observer-scroller" style="position:fixed; overflow:scroll; left:0; top:0; width:100%; height:100%; max-height:100vh; max-width:100vw; z-index: 9999;"></div>`);

            if (header) {
                scroller_el.appendChild(dom_utils.createElementFromHTMLString(`<header style="display:block; height:${100 * offset}%;"></header>`));
            }

            dom_utils.append(scroller_el, Array.from(container_el.children));

            if (footer) {
                scroller_el.appendChild(dom_utils.createElementFromHTMLString(`<footer style="display:block; height:${100 * (1- offset)}%;"></footer>`));
            }

            if (debug) {
                scroller_el.appendChild(dom_utils.createElementFromHTMLString(`<div style="position:fixed; display:block; top:${100 * offset}%; width:100%; height: 0; border:1px dashed orange;"></div>`));
            }

            container_el.appendChild(scroller_el);
            state.scroller_el = scroller_el;
        };

        const init = () => {

            initScrollDOM();
            bindEventListeners();
            updateScroll();
        };

        const destroy = () => {

            window.removeEventListener('resize', onResize);
            container_el.removeEventListener('scroll', onScroll);
            container_el.removeEventListener('scroll-update', onScrollUpdate);

            dom_utils.append(container_el, Array.from(state.scroller_el.children));
            if (state.scroller_el) {
                dom_utils.remove(state.scroller_el);
            }
        };

        return Object.freeze({
            init,
            destroy
        });
    };
})(window, document, window.akdv.utils_event, window.akdv.utils_math, window.akdv.utils_string, window.akdv.utils_dom, window.akdv.utils_data);