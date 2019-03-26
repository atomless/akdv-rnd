;((window, document, $, statusNotifier, env_utils, rangeInputFactory, switchFactory, optionSelectMenuFactory) => {

    'use strict';

    const init = e => {
        statusNotifier.done();
        $(window).trigger('chart-render-complete.akdv');
        
        rangeInputFactory({
            container_el: document.querySelector('#range-input-container1'),
            event_namespace_for_state_change: 'my-filter1',
            start_value: 60,
            min: 0,
            max: 180,
            step: 30,
            step_unit_suffix: 's',
            label_text: 'Time Taken To Do Something',
            with_step_labels: true
        });

        rangeInputFactory({
            container_el: document.querySelector('#range-input-container2'),
            event_namespace_for_state_change: 'my-filter1',
            start_value: 60,
            min: 0,
            max: 180,
            step: 10,
            step_unit_suffix: 's',
            label_text: 'Time Taken To Do Something',
            with_only_max_min_step_labels: true
        });

        rangeInputFactory({
            container_el: document.querySelector('#range-input-container3'),
            event_namespace_for_state_change: 'my-filter2',
            start_value: 60,
            min: 0,
            max: 180,
            step: 30,
            step_unit_suffix: 's',
            label_text: 'Time Taken To Do Something',
            with_permanent_output: true,
            step_label_overrides_array: ['', 'Fast','', 'Medium','', 'Slow', '']
        });

        rangeInputFactory({
            container_el: document.querySelector('#range-input-container4'),
            event_namespace_for_state_change: 'my-filter2',
            start_value: 60,
            min: 0,
            max: 180,
            step: 30,
            step_unit_suffix: 's',
            label_text: 'Time Taken To Do Something'
        });


        rangeInputFactory({
            container_el: document.querySelector('#range-input-container5'),
            event_namespace_for_state_change: 'my-filter3',
            start_value: 60,
            min: 0,
            max: 180,
            step: 1,
            label_text: 'Time Taken To Do Something',
            with_output: false
        });


        switchFactory({
            container_el: document.querySelector('#switch-container-square-chunky'),
            event_namespace_for_state_change: 'akdv',
            event_type_to_emit: 'theme-change',
            on_value: 'dark',
            off_value: 'light',
            title: 'night mode',
            start_state: env_utils.getQueryParamValue('theme') === 'dark',
            class_list: ['chunky', 'square'],
        });

        switchFactory({
            container_el: document.querySelector('#switch-container-square'),
            event_namespace_for_state_change: 'akdv',
            event_type_to_emit: 'theme-change',
            on_value: 'dark',
            off_value: 'light',
            title: 'dark theme',
            start_state: env_utils.getQueryParamValue('theme') === 'dark',
            class_list: ['square']
        });

        switchFactory({
            container_el: document.querySelector('#switch-container-round-chunky'),
            event_namespace_for_state_change: 'akdv',
            event_type_to_emit: 'theme-change',
            on_value: 'light',
            off_value: 'dark',
            title: 'daylight mode',
            start_state: env_utils.getQueryParamValue('theme') !== 'dark',
            class_list: ['chunky']
        });

        switchFactory({
            container_el: document.querySelector('#switch-container-round'),
            event_namespace_for_state_change: 'akdv',
            event_type_to_emit: 'theme-change',
            on_value: 'light',
            off_value: 'dark',
            title: 'light theme',
            start_state: env_utils.getQueryParamValue('theme') !== 'dark'
        });

        // window.optionSelectMenuFactory({
        //     container_el: document.querySelector("#option-select-menu-container"),
        //     event_namespace_for_state_change: 'multi-select',
        //     with_multi_select: true,
        //     with_search_field: true,
        //     with_checkboxes: true,
        //     title: 'Multi Option Select',
        //     options_key_value_list: [],
        //     search_field_placeholder: 'Filter'
        // });
    };

    $(window).on('result.data', init);


})(window, document, window.jQuery, window.akdv.statusNotifier, window.akdv.utils_env, window.rangeInputFactory, window.switchFactory, window.optionSelectMenuFactory);