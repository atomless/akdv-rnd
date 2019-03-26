;((window, document, str_utils, dom_utils, event_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'custom-number-input';
    const LABEL_TEXT_SPAN_CLASS = 'label-text-span';
    const GENERIC_STEP_BUTTON_CLASS = 'step-button';
    const STEP_UP_BUTTON_CLASS = 'step-up';
    const STEP_DOWN_BUTTON_CLASS = 'step-down';

    window.customNumberInputFactory = ({
            // options - required
            container_el = window.required(),
            label_text = window.required(),
            default_value = window.required(),
            max = window.required(),
            // options - with defaults
            min = 0,
            step = 1,
            fast_step = 1,
            class_list = [],
            down_button_text = '-',
            up_button_text = '+',
            event_name = 'change',
            event_namespace = 'akdv',
            read_only = false

        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        const label_element = document.createElement('label');
        const label_text_span = document.createElement('span');
        const number_input = document.createElement('input');
        const step_up_span = document.createElement('span');
        const step_down_span = document.createElement('span');

        let change_interval = false;
        let fast_change_timeout = false;


        const getValidInputNumber = (num) => Math.max(min, Math.min(max, isNaN(num)? number_input.valueAsNumber : num));


        const getValue = (input = number_input) => {
            return input.valueAsNumber;
        };


        const setValue = (n = min, input = number_input) => {
            input.value = getValidInputNumber(n);
        };


        const changeInputBy = (e, n = step, input = false) => {
            let up_or_down = (e.target.classList.contains(STEP_UP_BUTTON_CLASS)? 1 : -1) * n;
            let number_input_changed = e.target.parentNode.querySelector('input');

            setValue(number_input_changed.valueAsNumber + up_or_down, number_input_changed);

            event_utils.debounceEvent(event_name, event_namespace, number_input_changed.valueAsNumber, (e, data) => {
                event_utils.dispatchCustomEvent(number_input_changed, event_name, event_namespace, data);
            }, 500);
        };


        const onStopFastChange = (e) => {
            window.clearTimeout(fast_change_timeout);
            window.clearInterval(change_interval);
            fast_change_timeout = false;
            change_interval = false;
        };


        const onStepButtonClick = (e, n = step) => {
            e.stopPropagation();
            if (e.target.classList.contains(GENERIC_STEP_BUTTON_CLASS)) {
                changeInputBy(e, n);
            }
        };


        const onInputChange = (e) => {

            let number_input_changed = e.currentTarget;

            setValue(number_input_changed.valueAsNumber, number_input_changed);

            event_utils.debounceEvent(event_name, event_namespace, number_input_changed.valueAsNumber, (e, data) => {
                event_utils.dispatchCustomEvent(number_input_changed, event_name, event_namespace, data);
            }, 500);
        };


        const onStartFastChange = (e, period = 300, fast_timeout = false) => {
            onStopFastChange();
            if (e.target.classList.contains(GENERIC_STEP_BUTTON_CLASS)) {
                change_interval = window.setInterval(t => onStepButtonClick(e, fast_step), period);
                if (!fast_timeout) {
                    fast_change_timeout = window.setTimeout(t => onStartFastChange(e, 40, true), 1500);
                }
            }
        };


        step_up_span.classList.add(
            ...[GENERIC_STEP_BUTTON_CLASS, STEP_UP_BUTTON_CLASS, 'noselect'],
            ...class_list.map(c => `${c}-${GENERIC_STEP_BUTTON_CLASS}`)
        );
        step_down_span.classList.add(
            ...[GENERIC_STEP_BUTTON_CLASS, STEP_DOWN_BUTTON_CLASS, 'noselect'], 
            ...class_list.map(c => `${c}-${GENERIC_STEP_BUTTON_CLASS}`)
        );
        step_up_span.textContent = up_button_text;
        step_down_span.textContent = down_button_text;

        number_input.classList.add(DEFAULT_CLASS)
        number_input.setAttribute('type', 'number');
        number_input.setAttribute('min', min);
        number_input.setAttribute('min', min);
        number_input.setAttribute('max', max);
        number_input.setAttribute('step', step);
        number_input.defaultValue = default_value;
        number_input.value = default_value;
        number_input.readOnly = read_only;
        number_input.addEventListener('input', onInputChange);
        number_input.addEventListener('blur', onInputChange);

        label_text_span.innerHTML = label_text;
        label_text_span.classList.add(LABEL_TEXT_SPAN_CLASS, 'noselect');
        
        label_element.classList.add(...[`${DEFAULT_CLASS}-label`, ...class_list]);
        label_element.appendChild(step_down_span);
        label_element.appendChild(step_up_span);
        label_element.appendChild(number_input);
        label_element.appendChild(label_text_span);
        label_element.addEventListener('click', onStepButtonClick);
        label_element.addEventListener('mousedown', onStartFastChange);
        document.body.addEventListener('mouseup', onStopFastChange);

        container_el.appendChild(label_element);

        return Object.seal({
            setValue,
            getValue,

            get el() { return label_element; },
        });
    };

})(window, document, window.akdv.utils_string, window.akdv.utils_dom, window.akdv.utils_event);