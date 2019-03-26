;((window, document, $, string_utils, dom_utils, event_utils, lang_utils, obj_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'status-history';
    const TYPE = 'status';
    const STATUS_TYPES = ['error', 'warn', 'info'];
    const STATUS_LEVELS = {ERROR: 0, WARN: 1, INFO: 2};

    /**
     * Usage:
     */

    window.statusHistoryFactory = ({
            container_el = window.required(),
            loading_spinner_el = window.required(),
            uuid = string_utils.generateUUID(),
            namespace = 'akdv',
            class_list = []
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);
        dom_utils.throwExceptionIfNotDOMNodeElement(loading_spinner_el);


        let state = Object.seal({
            container_el: container_el,
            el: false,
            list_el: false,
            toggle_button_el: false,
            visible: false,
            expand: false
        });


        const toggleShow = e => {
            state.visible = !state.visible;
            state.el.setAttribute('data-show', state.visible);
        };

        const toggleExpand = e => {
            state.expand = !state.expand;
            state.el.setAttribute('data-expand', state.expand);
        };

        const toggleDetails = e => {
            if (!e.target.classList.contains('status-history-summary')) {
                const details_el = e.currentTarget.querySelector('.status-history-details');
                details_el.open = !details_el.open;
            }
        };

        const copyToClipboard = e => {
            if (navigator.clipboard) {
                e.stopPropagation();
                const trace = e.currentTarget.parentNode.querySelector('.status-history-trace');
                try {
                    navigator.clipboard.writeText(trace.innerHTML);
                } catch (e) {
                    window._log.warn(`Unable to copy to clipboard: ${e}`);
                }
            }
        };


        const appendItem = ({ type, title = '', description = '', trace = '' }) => {

            if (!state) {
                return;
            }
            if ((!trace || trace === '') && !(!description || description === '')) {
                // copy description to trace if necessary - enables `copy` for errors without traces
                trace = description;
            }
            const current_status_level = STATUS_TYPES.indexOf(state.toggle_button_el.getAttribute('data-status-type')),
                  item_status_level = STATUS_TYPES.indexOf(type);
            
            if (current_status_level === -1 || (item_status_level > -1 && item_status_level < current_status_level)) {
                state.toggle_button_el.setAttribute('data-status-type', STATUS_TYPES[item_status_level]);
            }

            if (item_status_level === STATUS_LEVELS.ERROR) {
                if (!state.visible) { toggleShow(); }
                state.toggle_button_el.setAttribute('data-error-count', parseInt(state.toggle_button_el.getAttribute('data-error-count') || 0) + 1);
            }

            let count = 1;
            const existing_item = Array.from(state.list_el.querySelectorAll('.status-history-item'))
                .find(item => item.querySelector('.status-history-title').innerHTML === title 
                      && (!item.querySelector('.status-history-desc') || item.querySelector('.status-history-desc').innerHTML === description));

            const d = new Date();
            const timestamp = d.toLocaleTimeString(lang_utils.locale,{ 'time12' :false });
            const datetime_iso = `${d.getFullYear()}-${(`${d.getMonth() + 1}`).padStart(2, '0')}-${(`${d.getDate()}`).padStart(2, '0')}`;
            let copyHtml = navigator.clipboard ? `<span class="status-history-copy-button add-tooltip" data-tooltip-event="click" data-tooltip-title-localization-path="AKDV.Tooltips.Description.Copy">${lang_utils.getLocalizedHTMLString('Copy', 'AKDV.Tooltips.Title')}</span>` : '';
            
            if (existing_item) {
                count = parseInt(existing_item.getAttribute('data-item-count')) + 1;
                let existing_details = existing_item.getElementsByTagName('details')[0].innerHTML;
                existing_item.outerHTML = '';
                dom_utils.prepend(state.list_el, dom_utils.createElementFromHTMLString(`<li class="status-history-item ${type}" data-item-count="${count}"><strong class="status-history-title">${title}</strong><details class="status-history-details"><summary class="status-history-summary"></summary><time class="status-history-timestamp" datetime="${datetime_iso}">${timestamp}</time>${description? `<span class="status-history-desc">${description}</span>` : '' }${trace? `<pre class="status-history-trace${description === trace ? ' hidden' : ''}">${trace}</pre>${copyHtml}` : '' }${existing_details}</details></li>`));
            } else {
                dom_utils.prepend(state.list_el, dom_utils.createElementFromHTMLString(`<li class="status-history-item ${type}" data-item-count="${count}"><strong class="status-history-title">${title}</strong><details class="status-history-details"><summary class="status-history-summary"></summary><time class="status-history-timestamp" datetime="${datetime_iso}">${timestamp}</time>${description? `<span class="status-history-desc">${description}</span>` : '' }${trace? `<pre class="status-history-trace${description === trace ? ' hidden' : ''}">${trace}</pre>${copyHtml}` : '' }</details></li>`));
            }
        };


        const destroy = () => {

            dom_utils.remove(state.el);
            $(window).off(`${TYPE}.${namespace}`);
            state = null;
        };


        const set = function({
            done = false,
            type = STATUS_TYPES[STATUS_LEVELS.INFO],
            title = '', 
            description = '',
            trace = '',
            e
        } = {}) {

            window._log.debug2(`STATUS (${type}) : ${namespace} SET ${title}`, e);

            appendItem({ type, title, description, trace, e });

            lang_utils.updateLocalizedTextElements(container_el);
        };

        // CREATE THE DOM

        container_el.appendChild(dom_utils.createElementFromHTMLString(
            `<div id="status-history-${uuid}" class="${[DEFAULT_CLASS, ...class_list].join(',')}" data-expand="false" data-show="false"'>
                <span class="status-history-toggle-button" data-status-type="${STATUS_TYPES[STATUS_LEVELS.INFO]}" data-error-count="0"></span>
                <div class="status-history-scrolling"><ul class="status-history-list"></ul></div>
                <footer class="status-history-footer">${lang_utils.getLocalizedHTMLString('Toggle', 'AKDV.Status.History')}</footer>
            </div>`));

        
        // Initial state
        

        state.el = container_el.querySelector(`#status-history-${uuid}`);
        state.list_el = state.el.querySelector(`.status-history-scrolling ul`);
        state.toggle_button_el = state.el.querySelector(`.status-history-toggle-button`);


        // EVENTS


        $(window).on(`${TYPE}.set.${namespace}`, (e, data) => set(Object.assign(data || {}, { e: e })) );
        $(window).on(`toggle-status-history.${namespace}`, toggleShow);
        $(window).on('keyup', (e) => e.shiftKey && e.key.toLowerCase() === 'i' && toggleShow());
        $('.status-history-toggle-button', state.el).on('click', toggleExpand);
        $(state.list_el).on('click', '.status-history-item', toggleDetails);
        $(state.list_el).on('click', '.status-history-copy-button', copyToClipboard);

        return {
            get uuid() { return uuid; },
            get element() { return state.el; },

            destroy
        };
    };

})(window, document, window.jQuery, 
   window.akdv.utils_string, window.akdv.utils_dom, window.akdv.utils_event, window.akdv.utils_lang, window.akdv.utils_obj);