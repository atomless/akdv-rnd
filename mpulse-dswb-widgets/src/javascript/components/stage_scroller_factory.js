;((window, document, $, SimpleScrollbar, akdv, string_utils, dom_utils, obj_utils) => {

    'use strict';

    akdv.stageScrollerFactory = ({
        container_el = window.required(),
        uuid = string_utils.generateUUID(),
        stage_scrolling_class_list = [],
        switch_threshold = 0.5,
        scroll_margin = '0px 0px 0px 0px'
    } = {}) => {

        const state = Object.seal({
            stage_scrolling_container_selector: `#stage-scroller-scrolling-container-${uuid}`,
            stage_scrolling_container_el: null,
            stage_scrolling_class_list: ['stage-scroller-container', ...stage_scrolling_class_list],
            stage_container_el: null,
            stage_section_el_template: '',
            stage_intersection_observers_set: new Set(),
            current_stage_element: null,
            current_stage_index: -1,
            previous_intersection_ratio: 0,
            event_namespace: 'stage-scroller'
        });

        const init = () => {

            $(`stage-scroller-scrolling-container-${uuid}`)
                .off()
                .remove();

            state.stage_scrolling_container_el = document.createElement('article');
            state.stage_scrolling_container_el.setAttribute('id', `stage-scroller-scrolling-container-${uuid}`);
            state.stage_scrolling_container_el.classList.add(...state.stage_scrolling_class_list);
            container_el.appendChild(state.stage_scrolling_container_el);

            state.stage_container_el = document.createElement('div');
            state.stage_container_el.setAttribute('id', `stage-scroller-container-${uuid}`);
            state.stage_scrolling_container_el.appendChild(state.stage_container_el);

            SimpleScrollbar.initEl(state.stage_scrolling_container_el);

            state.stage_section_el_template = string_utils.stringLiteralTemplate`<section id="stage-scroller-${0}-${1}" class="stage-scroller-section" data-stage-index="${0}"></section>`;
        };

        const onStageIntersectionThresholdReached = (entries) => {

            const e = entries[0],
                  stage_index = Number(e.target.getAttribute('data-stage-index'));

            window._log.debug(e.target.id + " - " + ((e.intersectionRatio > 0)? 'active' : 'not active'), [e.intersectionRatio]);

            if (e.intersectionRatio > 0
                && stage_index !== state.current_stage_index
                && e.intersectionRatio > switch_threshold) {
                state.current_stage_index = stage_index;
                state.current_stage_element = e.target;

                $(state.stage_scrolling_container_el).trigger('stage-scroller-switch', stage_index);
            }

            state.previous_intersection_ratio = e.intersectionRatio;
        };

        const add = (stage_section_content_el) => {

            stage_section_content_el = typeof stage_section_content_el === 'string' ? dom_utils.createElementFromHTMLString(stage_section_content_el) : stage_section_content_el;

            const stage_index = state.stage_intersection_observers_set.size,
                  stage_section_el = dom_utils.createElementFromHTMLString(state.stage_section_el_template.with(stage_index, uuid)),
                  intersection_observer = new window.IntersectionObserver(
                      onStageIntersectionThresholdReached.bind(this), {
                      root: state.stage_scrolling_container_el,
                      rootMargin: state.rootMargin,
                      threshold: [switch_threshold]
                  });
            
            if (stage_index === 0) {
                state.current_stage_index = 0;
                state.current_stage_element = stage_section_el;
            }

            stage_section_el.appendChild(stage_section_content_el);
            state.stage_container_el.appendChild(stage_section_el);

            intersection_observer.observe(stage_section_el);
            state.stage_intersection_observers_set.add(Object.seal([intersection_observer, stage_section_el]));
            
            if (location.hash.includes(`stage-index-${stage_index}`)) {
                state.stage_container_el.parentNode.scrollTop = stage_section_el.offsetTop;
            }

            return stage_section_el;
        };

        const clear = () => {

            for(let [intersection_observer, stage_section_el] of state.stage_intersection_observers_set) {
                intersection_observer.unobserve(stage_section_el);
            }

            dom_utils.removeChildren(state.stage_container_el);
            state.stage_intersection_observers_set.clear();
        };

        const attach = (handler) => {

            $(state.stage_scrolling_container_el).on('stage-scroller-switch', handler);
        };

        const dettach = (handler) => {

            if (typeof handler === 'function') {
                $(state.stage_scrolling_container_el).off('stage-scroller-switch', handler);
            } else {
                $(state.stage_scrolling_container_el).off('stage-scroller-switch');
            }
        };

        const onHashChange = () => {

            if (location.hash.includes('stage-index-')) {
                const stage_index = location.hash.match(/\d+/)[0],
                      stage_section_el = document.getElementById(`stage-scroller-${stage_index}-${uuid}`);

                if (stage_section_el) {
                    state.stage_container_el.parentNode.scrollTop = stage_section_el.offsetTop;
                } else {
                    window._log.warn(`stageScrollerFactory: Stage index ${stage_index} does not exist!`);
                }
            }
        };

        init();
        $(window)
            .off(state.event_namespace)
            .on(`hashchange.${state.event_namespace}`, onHashChange);

        return Object.freeze({
            add: add,
            clear: clear,
            attach: attach,
            dettach: dettach,
            get currentStageIndex() {

                return state.current_stage_index;
            },

            get currentStageElement() {

                return state.current_stage_element;
            }
        });
    };
})(window, document, window.jQuery, window.SimpleScrollbar, window.akdv, window.akdv.utils_string, window.akdv.utils_dom, window.akdv.utils_obj);