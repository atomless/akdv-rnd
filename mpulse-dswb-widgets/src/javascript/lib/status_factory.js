;((window, document, $, string_utils, dom_utils, event_utils, lang_utils, obj_utils, loading_spinners) => {

    'use strict';

    const DEFAULT_CLASS = 'status';
    const TYPE = 'status';
    const STATUS_TYPES = ['error', 'warn', 'info'];
    const STATUS_LEVELS = {ERROR: 0, WARN: 1, INFO: 2};
    const PRIORITY_LEVELS  = window.AKDV_PRIORITY_LEVELS = {HIGH: 2, MEDIUM: 1, NORMAL: 0};

    /**
     * Usage:
     * // instantiation
     * statusFactory({
     *    container_el: document.querySelector('#widget-status-notifier'),
     *    namespace: 'akdv',
     *    loading_spinner_el: window.akdv.loading_spinners.cloned_spinner_element,
     *    additional_done_events: ['globaly-significant-event'],
     *    modal: true, // inline if false
     *    blind: true // semi transparent full height and width screen overlay
     * })
     *   
     * // Show simple status with spinner and optional title and description text:
     * event_utils.dispatchCustomEvent(window, 'status', `set.akdv`, { title: lang_utils.getLocalizedHTMLString('Foo', 'AKDV.Status') });
     * 
     */

    window.statusFactory = ({
            container_el = window.required(),
            loading_spinner_el = loading_spinners.cloned_spinner_element,
            uuid = string_utils.generateUUID(),
            namespace = 'akdv',
            class_list = [],
            additional_done_events = [],
            modal,
            default_blind,
            title = '',
            description = '',
            closeable = false,
            code = false
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);
        dom_utils.throwExceptionIfNotDOMNodeElement(loading_spinner_el);

        additional_done_events = additional_done_events.map((e, i) => (!i? ' ' : '') + e).join(' ');


        let state = Object.seal({
            container_el: container_el,
            el: false,
            title_el: false,
            spinner_el: false,
            desc_el: false,
            blind_el: false,
            visible: false,
            spinner: true,
            priority: window.AKDV_PRIORITY_LEVELS.NORMAL,
            blind: default_blind,
            timestamp: false,
            uuid,
            modal,
            title,
            description,
            closeable,
            code
        });


        const updateState = (new_state) => {

            if (!state || (state.modal && new_state.background)) {
                return;
            }

            new_state.visible = new_state.done? false : new_state.spinner === true || !!(new_state.title || new_state.description);
            new_state.spinner = (new_state.type !== 'error' && new_state.spinner !== false);
            let changed_state_keys = obj_utils.keysWithValueChanges(state, new_state);

            obj_utils.update(state, new_state);

            if (changed_state_keys.includes('visible')) {
                state.container_el.setAttribute('data-show-status', state.visible);
            }
            if (changed_state_keys.includes('spinner')) {
                state.container_el.setAttribute('data-show-spinner', state.spinner);
            }
            if (changed_state_keys.includes('blind')) {
                state.container_el.setAttribute('data-show-blind', state.blind);
            }
            if (changed_state_keys.includes('title')) {
                state.title_el.innerHTML = state.title;
            }
            if (changed_state_keys.includes('description')) {
                let desc_html = string_utils.ellipsizeText(state.description,'END','...',250,false,false,10);
                desc_html = new_state.code ? `<pre>${desc_html}</pre>` : desc_html;
                state.desc_el.innerHTML = desc_html;
            }
            if (changed_state_keys.includes('closeable')) {
                state.container_el.setAttribute('data-closeable', state.closeable);
            }
        };


        const destroy = () => {

            dom_utils.remove(state.el);
            dom_utils.remove(state.blind_el);
            $(window).off(`${TYPE}.set.${namespace}`);
            $(window).off(`${TYPE}.done.${namespace}${additional_done_events}`);
            $(window).off(`${TYPE}.destroy.${namespace}`);
            state = null;
        };


        const set = function({
            done = false,
            type = STATUS_TYPES[STATUS_LEVELS.INFO],
            spinner = true, 
            blind = default_blind,
            title = '', 
            description = '',
            closeable = false,
            background = false,
            priority,
            code = false,
            e
        } = {}) {

            priority = (typeof priority === 'undefined')? 2 - STATUS_TYPES.indexOf(type) : Math.max(0, Math.min(2, priority));

            window._log.debug2(`STATUS (${type}) : ${namespace} SET ${title}`, e);

            if (priority >= state.priority) {
                priority = done? PRIORITY_LEVELS.NORMAL : priority;

                updateState({ type, spinner: !done, blind, title, description, closeable, background, done, priority, e, code });

                lang_utils.updateLocalizedTextElements(container_el);
            }
        };

        
        const done = ({
            e,
            background,
            priority = PRIORITY_LEVELS.NORMAL
        } = {}) => {

            window._log.debug2(`${namespace} STATUS done`, e);

            if (background || priority < state.priority) { return; }

            set({ done: true, priority, e });
        };


        // CREATE THE DOM


        container_el.classList.add('status-wrapper');
        dom_utils.appendFromHTMLString(container_el,
            `<div id="status-${uuid}" class="${[DEFAULT_CLASS, ...class_list].join(',')}">
                <div class="status-inner">
                    <span class="status-title">${title}</span>
                </div>
                <p class="status-description">${description}</p>
            </div>`);
        dom_utils.appendFromHTMLString(container_el,`<div class="status-blind"></div>`);
        dom_utils.prepend(container_el.querySelector(`#status-${uuid} .status-inner`), loading_spinner_el);
        container_el.setAttribute('data-modal', !!state.modal);


        // Initial state
        

        state.el = container_el.querySelector(`#status-${uuid}`);
        state.title_el = container_el.querySelector(`#status-${uuid} .status-title`);
        state.desc_el = container_el.querySelector(`#status-${uuid} .status-description`);
        state.blind_el = container_el.querySelector(`.status-blind`);

        state.container_el.setAttribute('data-show-status', true);
        state.container_el.setAttribute('data-show-spinner', true);
        state.container_el.setAttribute('data-show-blind', state.blind);
        state.container_el.setAttribute('data-closeable', false);

        // EVENTS


        $(window).on(`${TYPE}.set.${namespace}`, (e, data) => set(Object.assign({ e: e }, data || {})) );
        $(window).on(`${TYPE}.done.${namespace}${additional_done_events}`, (e, data) => done(Object.assign({ e: e }, data || {})) );
        $(window).on(`${TYPE}.destroy.${namespace}`, destroy);
        
        $(state.blind_el).on('click', e => e.currentTarget.parentNode.getAttribute('data-closeable') === 'true' && done({ e, background: false, priority: PRIORITY_LEVELS.HIGH })); 

        const dispatchStatus = function () {
            event_utils.dispatchCustomEvent(window, 'status', `${arguments[0].done? 'done' : 'set'}.${namespace}`, Object.assign({ uuid }, arguments[0]));
        };


        // SUGAR

        const setInfo = function() { dispatchStatus({ type: 'info', ...arguments[0] }); };
        const setWarn = function() { dispatchStatus({ type: 'warn', ...arguments[0] }); };
        const setError = function() { dispatchStatus({ type: 'error', ...arguments[0] }); };
        const setCodeError = function() { dispatchStatus({ type: 'error', code: true, ...arguments[0] }); };
        const setDone  = function() { dispatchStatus({ done: true, ...arguments[0] }); };

        const noData = () => { setError({ title: lang_utils.getLocalizedHTMLString('NoData', 'AKDV.Errors')}); };
        const analyzing = () => { setInfo({ title: lang_utils.getLocalizedHTMLString('Analyzing', 'AKDV.Status'), blind: false }); };
        const rendering = () => { setInfo({ title: lang_utils.getLocalizedHTMLString('Rendering', 'AKDV.Status'), blind: false }); };
        const spinner = () => { setInfo() };


        return {
            get uuid() { return uuid; },
            get element() { return state.el; },

            destroy,

            done: setDone,
            setInfo,
            setWarn,
            setError,
            setCodeError,

            noData,
            analyzing,
            rendering,
            spinner
        };
    };

})(window, document, window.jQuery, 
   window.akdv.utils_string, window.akdv.utils_dom, window.akdv.utils_event, window.akdv.utils_lang, window.akdv.utils_obj, window.akdv.loading_spinners);