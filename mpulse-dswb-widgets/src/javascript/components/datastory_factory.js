;((window, document, env_utils, math_utils, dom_utils, string_utils, event_utils, domTransitions, scrollObserverFactory) => {

    'use strict';


    const datastoryFactory = window.datastoryFactory = function({
        uuid = string_utils.generateUUID(),
        manifest = window.required(),
        debug = parseInt(env_utils.getQueryParamValue('debug')) > 0  ? true : false
    } = {}) {


        const container_el = document.querySelector(manifest.container_id);
        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        const scroll_observer = scrollObserverFactory({
            container_el,
            selector: 'section, section > article > article',
            once: manifest.trigger_once,
            offset: manifest.trigger_threshold,
            header: manifest.header_padding,
            footer: manifest.footer_padding,
            debug
        });

        const html = s => dom_utils.createElementFromHTMLString(s);

        const initScrollCSS = () => {

            container_el.classList.add('datastory-container');

            if (!document.getElementById('datastory-scroll-observer-css')) {
                const debug_css = debug ? `
                body[data-akdv-datastory] section {
                    border: green dashed 1px;
                }` : '';

                document.head.appendChild(html(`<style id="datastory-scroll-observer-css">
                    body[data-akdv-datastory] section {
                      display: ${manifest.orient === 'center'? 'block' : 'flex'};
                      flex-direction: ${manifest.orient === 'center'? 'column' : manifest.orient === 'left' ? 'row-reverse' : 'row'};
                    }
                    ${debug_css}
                </style>`));
            }
        };

        const initScrollDOM = () => {

            document.body.setAttribute('data-akdv-datastory', true);
        };

        const dispatchScrollEvents = (event_types, event_value) => {

            let event_array_values = event_types.length ?new Array(event_types.length).fill(event_value) : event_value;

            if (event_array_values) {
                try {
                    const values = JSON.parse(event_value);
                    event_array_values = event_array_values.map((v, i) => values[i]);
                } catch(e) {}
            }

            for (let i = 0; i < event_types.length; i++) {
                window.dispatchEvent(new CustomEvent(event_types[i], {detail: [event_types[i], event_array_values[i], true]}));
            }
        };

        const onEnter = e => {

            if (typeof manifest.onEnter === 'function') {
                manifest.onEnter(e);
            }

            if (e.detail.getAttribute('data-enter-event')) {
                const event_types = e.detail.getAttribute('data-enter-event').replace(/\s/g, '').split(','),
                      event_value = e.detail.getAttribute('data-enter-value');

                dispatchScrollEvents(event_types, event_value);
            }
        };

        const onExit = e => {

            if (typeof manifest.onExit === 'function') {
                manifest.onExit(e);
            }

            if (e.detail.getAttribute('data-exit-event')) {
                const event_types = e.detail.getAttribute('data-exit-event').replace(/\s/g, '').split(','),
                      event_value = e.detail.getAttribute('data-exit-value');

                dispatchScrollEvents(event_types, event_value);
            }
        };

        const onProgress = e => {

            if (typeof manifest.onProgress === 'function') {
                manifest.onProgress(e);
            }

            if (e.detail.tagName === 'SECTION') {
                const section_el = e.detail,
                      scroll_progress = parseFloat(section_el.getAttribute('data-scroll-progress'));
    
                domTransitions.applyTransition({
                    container_el: section_el.querySelector('figure[data-transition-type]'),
                    progress: scroll_progress
                });
            }
        };

        const addEventListeners = () => {

            container_el.addEventListener('scroll-observer-enter', onEnter);
            container_el.addEventListener('scroll-observer-exit', onExit);
            container_el.addEventListener('scroll-observer-progress', onProgress);
        };

        const destroy = () => {

            container_el.removeEventListener('scroll-observer-enter', onEnter);
            container_el.removeEventListener('scroll-observer-exit', onExit);
            container_el.removeEventListener('scroll-observer-progress', onProgress)

            document.body.setAttribute('data-akdv-datastory', false);
            scroll_observer.destroy();
        };

        const init = () => {

            initScrollCSS();
            initScrollDOM();
            addEventListeners();

            scroll_observer.init();
        };

        init();

        return Object.freeze({
            destroy
        });
    };

    window.datastoryFactory.isDataStoryManifest = (manifest = window.required('manifest')) => manifest.datastory;


})(window, document, window.akdv.utils_env, window.akdv.utils_math, window.akdv.utils_dom, window.akdv.utils_string, window.akdv.utils_event, window.domTransitions, window.scrollObserverFactory);