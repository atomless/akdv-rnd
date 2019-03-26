;((window, document, $, string_utils, dom_utils, event_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'range';


    window.rangeInputFactory = ({
            container_el = window.required(),
            uuid = string_utils.generateUUID(),
            event_namespace_for_state_change = window.required(),
            start_value = 60,
            min = 0,
            max = 100,
            step = 10,
            step_label_unit_suffix = 's',
            label_text = DEFAULT_CLASS,
            class_list = [], // supports string or array
            step_label_overrides_array = false,
            with_step_labels = false,
            with_only_max_min_step_labels = false,
            with_output = true,
            with_permanent_output = false,
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        let range_form_el, range_el, range_input_el, range_output_el, range_labels_list;


        const html = s => dom_utils.createElementFromHTMLString(s);


        const getState = () => range_input_el.value;


        const emitChangeEvent = e => event_utils.delay(100).then(e =>
            event_utils.dispatchCustomEvent(window, 'range-change', event_namespace_for_state_change, [getState()])
        );


        const setState = (value = getState(), emit_change_event = false) => { 
            if (range_input_el) {
                let pcnt = ((value - min) / (max - min)) * 100;
                range_input_el.value = value;
                range_input_el
                .setAttribute('style',`background: linear-gradient(to right, currentColor 0%, currentColor ${pcnt}%, transparent ${pcnt}%, transparent 100%)`);
            }
            range_output_el && (range_output_el.value = `${value}${step_label_unit_suffix}`);
            emit_change_event && emitChangeEvent();
        };


        const onExternalRangeEvent = (e, value) => {
            setState(Math.round(value / step) * step);
        };


        const onStateChange = (e, emit = true) => {
            e.preventDefault();
            range_input_el.focus();
            setState(getState(), emit);
            return false;
        };


        const onStepLabelClick = e => {
            e.preventDefault();
            if (e.target.classList.contains('range-label')) {
                range_input_el.value = parseInt(e.target.getAttribute('data-value'));
                range_input_el.focus();
                setState(getState(), true);
            }
        };


        const clear = () => {

            if (range_labels_list) {
                range_labels_list.removeEventListener('click', onStepLabelClick);
            }

            if (range_form_el) {
                range_form_el.removeEventListener('change', onStateChange);
                container_el.removeChild(range_form_el);
            }

            event_utils.off(window, 'range-change', event_namespace_for_state_change, onExternalRangeEvent);
        };


        const populate = () => {

            clear();
            // disallow with_only_max_min_step_labels if step_labels_array overrides are provided
            with_only_max_min_step_labels = step_label_overrides_array? false : with_only_max_min_step_labels;

            const label_count = step_label_overrides_array? step_label_overrides_array.length : with_only_max_min_step_labels? 2 : 1 + (max - min) / step;
            const labels_offset = 100 / (label_count - 1);
            const label_step = with_only_max_min_step_labels? max : Math.round(((max - min) / (label_count - 1)) / step) * step;
            const step_labels_array = step_label_overrides_array || new Array(label_count).fill(step_label_unit_suffix).map((l, i) => `${label_step * i}${l}`);

            with_step_labels = !!step_label_overrides_array || with_only_max_min_step_labels || with_step_labels;

            const option_classes = `${with_step_labels? ' with-step-labels' : ''}${with_permanent_output? ' with-permenent-output' : ''}`;

            range_form_el = html(`<form id="form-${uuid}"></form>`);
            range_el = html(
                `<label class="${DEFAULT_CLASS}${option_classes}" id="range-container-${uuid}">
                    <input name="range-input-${uuid}" type="range" min="${min}" max="${max}" step="${step}" value="${start_value}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${start_value}">
                    ${ !with_step_labels || with_output? `<output name="range-output-${uuid}" for="range-input-${uuid}">${start_value}</output>` : '' }
                    ${ with_step_labels
                        ? `<ul class="range-labels" style="width: calc(${100 + labels_offset}% - 0.5rem); left: calc(-${labels_offset * 0.5}% + 0.5rem);">`
                        + step_labels_array.reduce((labels, l, i) => `${labels}<li class="range-label" style="flex-basis: ${labels_offset}%;" data-value="${label_step * i}">${l}</li>`, '') 
                        + '</ul>' 
                        : ''
                    }
                    <p class="range-label-text">${label_text}</p>
                </label>`
            );
            
            range_form_el.classList.add(...[`${DEFAULT_CLASS}-form`, ...class_list]);
            range_form_el.appendChild(range_el);

            range_input_el = range_form_el.querySelector('input[type="range"]');
            range_input_el.addEventListener('focus', e => { e.stopPropagation(); e.stopImmediatePropagation()});
            (with_output || !with_step_labels) && (range_output_el = range_form_el.querySelector('output'));

            range_form_el.addEventListener('change', onStateChange);

            if (with_step_labels) {
                range_labels_list = range_el.querySelector('.range-labels');
                range_labels_list.addEventListener('click', onStepLabelClick);
            }

            event_utils.on(window, 'range-change', event_namespace_for_state_change, onExternalRangeEvent);
            container_el.appendChild(range_form_el);
            setState(start_value);
        };


        populate();


        return {
            clear,

            set state(selected_values_array) { setState(selected_values_array); },

            get state() { return getState(); },

            get el() { return range_form_el; },

            get uuid() { return uuid; }
        };
    };

})(window, document, window.jQuery, window.akdv.utils_string, window.akdv.utils_dom, window.akdv.utils_event);