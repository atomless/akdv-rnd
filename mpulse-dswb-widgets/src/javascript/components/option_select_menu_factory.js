;((window, document, string_utils, dom_utils, event_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'option-select-menu';

    /**
     * Basic Options Menu component.
     * Usage:
     
        const msel = window.optionSelectMenuFactory({
            container_el: document.body,
            event_namespace_for_state_change: 'bla',
            with_multi_select: true,
            with_search_field: true,
            options_key_value_list: [['Orange', 1],['Apple', 2], ['Banana', 3], ['Melon', 4], ['Tomato', 5], ['Orange Monkey', 6]]
        });
     *
     * @param {Element_node} options.container_el
     * @param {String]} options.uuid
     * @param {String]} options.event_namespace_for_state_change
     * @param {String} options.label
     * @param {Array} options.options_key_value_list
     * @param {Array} options.class_list       
     * @param {String} options.search_field_placeholder
     * @param {Boolean} options.with_multi_select
     * @param {Boolean} options.with_search_field
     * @param {Boolean} options.with_submit_button
     * @return {Object}
     */
    window.optionSelectMenuFactory = ({
            container_el = window.required(),
            uuid = string_utils.generateUUID(),
            event_namespace_for_state_change = window.required(),
            label_text = DEFAULT_CLASS,
            options_key_value_list = window.required('Key Value Array'),
            class_list = [], // supports string or array
            search_field_placeholder = 'Filter Options',
            with_multi_select = false,
            with_search_field = false,
            with_submit_button = false,
            with_checkboxes = false
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        let select_options_form_el, select_options_el, search_input_el;


        const html = s => dom_utils.createElementFromHTMLString(s);


        const getState = () => Array.from(select_options_el.querySelectorAll('option:not(.hidden):checked')).map(opt_el => opt_el.value);


        const setState = (selected_values_array) => Array.from(select_options_el.querySelectorAll('option')).map(opt_el => opt_el.selected = selected_values_array.includes(opt_el.value));


        const onSelectionStateChange = e => {

            event_utils.delay(300).then(
                event_utils.dispatchCustomEvent(window, 'options-select', event_namespace_for_state_change, [getState()])
            );
        };


        const onSearchStateChange = e => {

            Array.from(select_options_el.querySelectorAll('option.hidden')).forEach(opt_el => opt_el.classList.remove('hidden'));

            select_options_el.querySelectorAll('option').forEach(opt_el => {
                if (opt_el.textContent && search_input_el.value && !opt_el.textContent.toLowerCase().includes(search_input_el.value.toLowerCase())) {
                    opt_el.classList.add('hidden');
                }
            });
        };


        const clear = () => {

            if (select_options_el) {
                search_input_el.removeEventListener(`input`, onSearchStateChange);
                select_options_el.removeEventListener(`change`, onSelectionStateChange);
                select_options_form_el.removeEventListener(`submit`, onSelectionStateChange);
                select_options_form_el.removeEventListener(`option-select-menu.${event_namespace_for_state_change}`, setState);
                container_el.removeChild(select_options_form_el);
            }
        };


        const populate = () => {

            clear();

            select_options_form_el = html(`<form id="form-${uuid}"></form>`);

            select_options_el = html(
                `<select name="${DEFAULT_CLASS}"${with_multi_select? ' multiple' : ''}${with_checkboxes? ' data-checkboxes="true"':''}>
                ${ options_key_value_list.reduce((opts, opt)  => `${opts}<option value="${opt[1]}">${opt[0]}</option>`, '') }
                </select>`
            );
            
            select_options_form_el.classList.add(...[`${DEFAULT_CLASS}-form`, ...class_list]);

            if (with_search_field) {
                search_input_el = html(`<input type="search" value="" placeholder="${search_field_placeholder}" class="options-search">`);
                select_options_form_el.appendChild(search_input_el);
                search_input_el.addEventListener('input', onSearchStateChange);
            }

            select_options_form_el.appendChild(select_options_el);

            if (with_submit_button) {
                select_options_form_el.appendChild(html(`<input type="submit">`));
                select_options_form_el.addEventListener('submit', onSelectionStateChange);
            } else {
                select_options_el.addEventListener('change', onSelectionStateChange);
            }

            select_options_form_el.addEventListener(`option-select-menu.${event_namespace_for_state_change}`, setState);
            container_el.appendChild(select_options_form_el);
        };


        populate();


        return {
            clear,

            set state(selected_values_array) { setState(selected_values_array); },

            get state() { return getState(); },

            get el() { return select_options_form_el; },

            get uuid() { return uuid; }
        };
    };

})(window, document, window.akdv.utils_string, window.akdv.utils_dom, window.akdv.utils_event);