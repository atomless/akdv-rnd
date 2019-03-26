;((window, document, string_utils, dom_utils, event_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'switch';

    window.switchFactory = ({
            container_el = window.required(),
            uuid = string_utils.generateUUID(),
            event_namespace_for_state_change = window.required(),
            class_list = [], // supports string or array
            title = false,
            start_state = true,
            event_type_to_emit = 'switch',
            on_value = false,
            off_value = false,
            reverse_polarity = false
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        let switch_el, checkbox, span;


        const getState = () => {
            const checked = reverse_polarity? !checkbox.checked : checkbox.checked;
            return checked? on_value || checked : off_value || checked;
        };


        const emitSwitchEvent = (e) => event_utils.delay(100).then(e => 
            event_utils.dispatchCustomEvent(window, event_type_to_emit, event_namespace_for_state_change, [getState()])
        );


        const setState = (value, emit = false) => {
            checkbox.checked = value;
            emit && emitSwitchEvent();
        };


        const onExternalEvent = (e, value) => {
            if (typeof value !== 'boolean' && (on_value || off_value)) {
                value = (value === on_value);
            } else {
                reverse_polarity? !value : value;
            }
            setState(value, false);
        }

        const onChangeEvent = e => setState(e.target.checked, true);


        const clear = () => {

            if (switch_el) {
                switch_el.removeEventListener('change', onChangeEvent);
                event_utils.off(window, event_type_to_emit, event_namespace_for_state_change, onExternalEvent);
                container_el.removeChild(switch_el);
            }
        };


        const populate = () => {

            clear();
            switch_el = document.createElement('label');
            checkbox = document.createElement('input');
            span = document.createElement('span');
            checkbox.type = 'checkbox';
            checkbox.checked = start_state;
            if (title) {
                switch_el.textContent = title + ' :';
            }
            switch_el.setAttribute('id', `${DEFAULT_CLASS}-${uuid}`);
            switch_el.appendChild(checkbox);
            switch_el.appendChild(span);
            switch_el.classList.add(...[DEFAULT_CLASS, ...class_list]);
            switch_el.addEventListener('change', onChangeEvent);
            event_utils.on(window, event_type_to_emit, event_namespace_for_state_change, onExternalEvent);
            container_el.appendChild(switch_el);
        };


        populate();


        return {
            clear,

            get state() { return getState(); },

            set state(value) { setState(value); },

            get el() { return switch_el; },

            get uuid() { return uuid; }
        };
    };

})(window, document, window.akdv.utils_string, window.akdv.utils_dom, window.akdv.utils_event);