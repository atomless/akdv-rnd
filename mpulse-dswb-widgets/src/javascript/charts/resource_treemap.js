;((window, $, d3, moment, dataProviderFactory,
   getTreemapPlot, reorderableListFactory, chartFilterButtonFactory, colorLegendFactory, draggableMarkerFactory,
   componentFactory, annotationBubbleFactory, contextmenuFactory, switchFactory, customNumberInputFactory, mpulse,
   math_utils, css_utils, string_utils, dom_utils, env_utils, data_utils, event_utils, lang_utils) => {

    'use strict';

    let filter_dblclick_timeout;
    let filter_mouseenter_timeout;

    const EVENT_NAMESPACE_CHART_DATA_UPDATE = 'resource-aggregate-treemap';
    const EVENT_NAMESPACE_FOR_ORDER_CHANGE = 'data-hierarchy';
    const EVENT_NAMESPACE_FOR_ANNOTATION_BUBBLE = 'annotation-bubble';
    const EVENT_NAMESPACE_FOR_CONTEXTMENU = 'treemap-contextmenu';
    const EVENT_NAMESPACE_FOR_COLOR_MAX = 'color-max';
    const EVENT_NAMESPACE_FOR_COLOR_MIN = 'color-min';
    const CATEGORICAL_DIMENSION_PROPERTY_NAME = 'mediatype';
    const LINEAR_DIMENSION_PROPERTY_NAME = 'load_time';
    const CONTAINER_ID = '#resource-aggregate-treemap';
    const ANNOTATION_CONTAINER_ID = '#annotation-layer';

    const data_hierarchy_array = env_utils.getQueryParamValue('hierarchy')
        ? env_utils.getQueryParamValue('hierarchy').split(',') 
        : [CATEGORICAL_DIMENSION_PROPERTY_NAME, 'host', 'path'];
    
    const categorical_colors_map = !!env_utils.getQueryParamValue('cat')
        ? css_utils.getColorMapByCategory(CATEGORICAL_DIMENSION_PROPERTY_NAME, 'faint')
        : false;
    const linear_scale_colors_array = css_utils.getColorArrayByType('heatmap', 'faint');
    const linear_scale_max_percentile = 99;

    let linear_scale_color_max = Number(env_utils.getQueryParamValue('color_max') || 600);
    let linear_scale_color_min = Number(env_utils.getQueryParamValue('color_min') || 50);
    let colorMaxMarker = false;
    let colorMinMarker = false;

    if (linear_scale_color_max && linear_scale_color_min > linear_scale_color_max) {
        window._log.warn('The mimimum value in a linear scale cannot be set to a value larger than the max setting.')
        linear_scale_color_min = linear_scale_color_max;
    }

    const AXIS_LABEL_TEXT = categorical_colors_map? 'Media Type' : 'Resource Load Time (ms)';

    const onInitCharts = () => {

        const container_el = document.querySelector(CONTAINER_ID);
        const chart_svg = dom_utils.appendResponsiveSVGToElement(container_el);

        const dataProvider = dataProviderFactory({
            event_namespace_for_data_update: EVENT_NAMESPACE_CHART_DATA_UPDATE,
            data_required_result_keys: data_utils.uniqueArray([ 'beacons', ...data_hierarchy_array ]),
            data_dimension_filters_array: [
                { name: CATEGORICAL_DIMENSION_PROPERTY_NAME, type: 'categorical' },
                { name: LINEAR_DIMENSION_PROPERTY_NAME, type: 'linear' }
            ],
            filter_on_event: false
        });

        const legend = colorLegendFactory({
            dimension_name: categorical_colors_map? CATEGORICAL_DIMENSION_PROPERTY_NAME : LINEAR_DIMENSION_PROPERTY_NAME,
            event_namespace_brush_filter: categorical_colors_map? false : EVENT_NAMESPACE_CHART_DATA_UPDATE,
            container_el: chart_svg,
            colors_array: linear_scale_colors_array || false,
            categorical_colors_map: categorical_colors_map,
            tick_count: 7,
            tick_format_fn: d => `${string_utils.getFormattedNumberSD(d, 2)}`,
            label_text: AXIS_LABEL_TEXT
        });

        const percentileInput = customNumberInputFactory({ 
            container_el: container_el,
            label_text: 'Percentile', 
            default_value: 50, 
            max: linear_scale_max_percentile, 
            min: 1,
            down_button_text: '-',
            up_button_text: '+',
            class_list: ['percentile-input'],
            event_name: 'percentile-change',
            event_namespace: EVENT_NAMESPACE_CHART_DATA_UPDATE
        });

        const drillSwitch = switchFactory({
            container_el: container_el,
            event_namespace_for_state_change: EVENT_NAMESPACE_CHART_DATA_UPDATE,
            title: 'aggregation',
            start_state: env_utils.getQueryParamValue('drill') !== '0',
            class_list: ['chunky', 'square']
        });

        const tm = getTreemapPlot({
            event_namespace_chart_data_update: EVENT_NAMESPACE_CHART_DATA_UPDATE,
            event_namespaces_for_filters: [CATEGORICAL_DIMENSION_PROPERTY_NAME],
            event_namespace_for_annotation: EVENT_NAMESPACE_FOR_ANNOTATION_BUBBLE,
            event_namespace_for_contextmenu: EVENT_NAMESPACE_FOR_CONTEXTMENU,
            event_namespace_for_data_hierarchy_update: EVENT_NAMESPACE_FOR_ORDER_CHANGE,
            event_namespace_for_drillable_change: EVENT_NAMESPACE_CHART_DATA_UPDATE,
            event_namespace_for_percentile_change: EVENT_NAMESPACE_CHART_DATA_UPDATE,
            event_namespace_for_percentile_calculated: EVENT_NAMESPACE_CHART_DATA_UPDATE,
            container_el: chart_svg,
            data_provider: dataProvider,
            // commented out as setting this on init "bakes" the treemap from initially falling back to intialise using the mpulse setting
            //data_kth_percentile_to_calc: data_utils.getValueAsNumberOrFallbackValue(mpulse.getFilterValueByName('percentile'), 50),
            data_hiearchy_dimensions_to_mean: ['avg_transferred_size'],
            data_hiearchy_dimensions_to_mode: categorical_colors_map? [CATEGORICAL_DIMENSION_PROPERTY_NAME] : false,
            data_hiearchy_dimensions_to_percentile: [LINEAR_DIMENSION_PROPERTY_NAME],
            data_leaf_color_dimension_property_name: categorical_colors_map? CATEGORICAL_DIMENSION_PROPERTY_NAME : LINEAR_DIMENSION_PROPERTY_NAME,
            data_non_bucketed_dimensions_to_filter_post_hierarchy: [LINEAR_DIMENSION_PROPERTY_NAME],
            data_hierarchy_array: data_hierarchy_array,
            hierarchy_drillable: env_utils.getQueryParamValue('drill') !== '0',
            data_node_size_dimension_property_name: 'beacons',
            margin_bottom_rems: (legend)? 5.75 : 0,
            leaf_node_fill_d3_color_scale: (legend && legend.color_axis)? legend.color_axis.getScale() : false,
            function_for_leaf_node_label_format: (d) => String(d).split('/').splice(-1).pop()
        });

        tm.contextmenu = componentFactory({
            container_el: document.querySelector(ANNOTATION_CONTAINER_ID),
            event_namespace: EVENT_NAMESPACE_FOR_CONTEXTMENU,
            component: contextmenuFactory,
            show_timeout_period_ms: 0,
            offset_x_rems: 2,
            offset_y_rems: -2
        });

        const reorderableList = reorderableListFactory({
            container_el: document.querySelector('#analysis header'),
            title: 'Reorderable Hierarchy',
            item_names_array: data_hierarchy_array,
            item_labels_array: data_hierarchy_array.map(s => lang_utils.getLocalizedHTMLString(s, 'AKDV.Columns')),
            immovable_item_names: ['path'],
            event_namespace_for_order_change: EVENT_NAMESPACE_FOR_ORDER_CHANGE
        });

        const annotationBubble = componentFactory({ 
            container_el: document.querySelector(ANNOTATION_CONTAINER_ID),
            event_namespace: EVENT_NAMESPACE_FOR_ANNOTATION_BUBBLE,
            component: annotationBubbleFactory,
            show_timeout_period_ms: 400,
            offset_x_rems: 1.5,
            offset_y_rems: 0.55,
            function_to_format_data: ({ d, end_node_property_name } = {}) => {
                if (!d.children) {
                    let timer_val = string_utils.getFormattedNumberSD(d.data[LINEAR_DIMENSION_PROPERTY_NAME], 3);
                    let show_percentile = d.data.hasOwnProperty('percentile_calculated')? ' ' + dom_utils.getPercentileMarkup(d.data.percentile_calculated) : '';
                    let nvo = [
                        { name: 'beacons', label: 'Hits', value: string_utils.getFormattedInteger(d.data.beacons) },
                        { name: 'load_time', label: 'Load Time' + show_percentile, value: timer_val, unit: (timer_val === 'unknown ')? '' : 'ms' },
                        { name: 'cache_hit_ratio', label: 'Average Cache Hit Rate', value: math_utils.roundFloatTo(d.data.cache_hit_ratio * 100, 1), unit: '%' },
                        { name: 'avg_transferred_size', label: 'Average Size', value: string_utils.getFormattedNumber(d.data.avg_transferred_size * 0.001, 1), unit: 'kB' }
                    ];
                    if (!drillSwitch.state || (reorderableList.getCurrentItemIndex() >= data_hierarchy_array.length - 2)) {
                        nvo = [
                            { name: CATEGORICAL_DIMENSION_PROPERTY_NAME, label: string_utils.uppercaseLabelFormat(CATEGORICAL_DIMENSION_PROPERTY_NAME), value: d.data[CATEGORICAL_DIMENSION_PROPERTY_NAME] },
                            { name: 'host', label: 'Host', value: d.data.host },
                            ...nvo
                        ];
                    }
                    return { 
                        title_obj: { 
                            name: string_utils.uppercaseLabelFormat(lang_utils.getLocalizedHTMLString(end_node_property_name, 'AKDV.Columns')),
                            value: d.data[end_node_property_name]
                        }, 
                        name_value_unit_obj_list: nvo,
                        x: container_el.getBoundingClientRect().left + d.x0 + ((d.x1 - d.x0) * 0.5),
                        y: container_el.getBoundingClientRect().top + d.y0 + ((d.y1 - d.y0) * 0.5)
                    };
                } else {
                    return { 
                        title_obj: { 
                            name: '',  
                            value: d.data.name
                        }, 
                        name_value_unit_obj_list: [
                            { name: 'beacons', label: 'Total Hits', value: string_utils.getFormattedInteger(d.value) } ,
                        ],
                        x: container_el.getBoundingClientRect().left + d.x0 + ((d.x1 - d.x0) * 0.5),
                        y: container_el.getBoundingClientRect().top + d.y0 + 10
                    };
                }
            }
        });

        const resize = ({ w = container_el.offsetWidth, h = container_el.offsetHeight } = {}) => {

            legend.update({ w: w * 0.6, h: false, x: w * 0.2, y: h - css_utils.remsToPixels(3.75) });
            if (colorMaxMarker) {
                colorMaxMarker.onResize();
            }
            if (colorMinMarker) {
                colorMinMarker.onResize();
            }
            tm.resize({ w, h });
            tm.draw(false);
        };

        const updateData = () => {

            let w = container_el.offsetWidth, h = container_el.offsetHeight;
            let label_text = (!categorical_colors_map && dataProvider.meta && dataProvider.meta.pageloadtime)
                ? `${AXIS_LABEL_TEXT} (ms)` 
                : undefined;

            let data = dataProvider.all();
            let is_bucketed_linear_dimension = (Object(data[0][LINEAR_DIMENSION_PROPERTY_NAME]) === data[0][LINEAR_DIMENSION_PROPERTY_NAME]);
            let max_bucket_index_with_entries = 0;
            let max_bucket_val = 0;
            let min_bucket_value = 0;

            if (is_bucketed_linear_dimension) {
                max_bucket_val = data_utils.percentileOfBucketedDimension(data, LINEAR_DIMENSION_PROPERTY_NAME, dataProvider.meta.bucket_values[LINEAR_DIMENSION_PROPERTY_NAME], linear_scale_max_percentile);

                min_bucket_value = (dataProvider.meta.bucket_values && dataProvider.meta.bucket_values[LINEAR_DIMENSION_PROPERTY_NAME])
                    ? dataProvider.meta.bucket_values[LINEAR_DIMENSION_PROPERTY_NAME][0] 
                    : 0;
            }

            let min = Math.min(
                d3.min(
                    data, 
                    d => (is_bucketed_linear_dimension)
                        ? min_bucket_value 
                        : (Array.isArray(d[LINEAR_DIMENSION_PROPERTY_NAME]))
                            ? Math.max(...d[LINEAR_DIMENSION_PROPERTY_NAME]) 
                            : d[LINEAR_DIMENSION_PROPERTY_NAME]),
                0
            );

            let max = Math.max(
                d3.max(
                    data, 
                    d => (is_bucketed_linear_dimension)
                        ? max_bucket_val
                        : (Array.isArray(d[LINEAR_DIMENSION_PROPERTY_NAME]))
                            ? Math.max(...d[LINEAR_DIMENSION_PROPERTY_NAME]) 
                            : d[LINEAR_DIMENSION_PROPERTY_NAME]
                ),
                linear_scale_color_max || 1
            );

            /*
            let color_max = (dataProvider.meta && dataProvider.meta.color_max)? dataProvider.meta.color_max : linear_scale_color_max;
            let color_min = (dataProvider.meta && dataProvider.meta.color_min)? dataProvider.meta.color_min : linear_scale_color_min;
            */

            let color_max = linear_scale_color_max;
            let color_min = linear_scale_color_min;
           
            legend.update({ w: w * 0.6, h: false, x: w * 0.2, y: h - css_utils.remsToPixels(3.75), label: label_text, min, max, color_max, color_min });

            if (!colorMaxMarker) {
                colorMaxMarker = draggableMarkerFactory({
                    container_el: d3.select('.axis-x-bottom').node(),
                    xscale: legend.axis.getScale(),
                    color_scale: legend.color_axis.getScale(),
                    enable_drag_x: true,
                    start_at_xscale_value: color_max || max * 0.95,
                    xscale_threshold_line: true,
                    xvalue_label: true,
                    xvalue_units: 'ms',
                    min_x: color_min,
                    offset_y: 25,
                    class_list: ['color-max-marker'],
                    event_namespace: EVENT_NAMESPACE_FOR_COLOR_MAX
                });
            } else {
                colorMaxMarker.moveTo(legend.axis.getScale().invert(color_max || max * 0.95));
            }

            if (!colorMinMarker) {
                colorMinMarker = draggableMarkerFactory({
                    container_el: d3.select('.axis-x-bottom').node(),
                    xscale: legend.axis.getScale(),
                    color_scale: legend.color_axis.getScale(),
                    enable_drag_x: true,
                    start_at_xscale_value: color_min > 0? color_min : min,
                    xscale_threshold_line: true,
                    xvalue_label: true,
                    xvalue_units: 'ms',
                    max_x: color_max,
                    offset_y: 25,
                    class_list: ['color-min-marker'],
                    event_namespace: EVENT_NAMESPACE_FOR_COLOR_MIN
                });    
            } else {
                colorMinMarker.moveTo(legend.axis.getScale().invert(color_min > 0? color_min : min));
            }

            tm.updateData();
            tm.resize({ w, h });
            tm.draw();
        };

        const onUpdateLinkedDashboard = (dashboard_path) => {
            if (!dashboard_path) {
                return;
            }
            tm.contextmenu.sections = [{ 
                title: 'Get More Details',
                items: [
                    { 
                        label: 'Open in linked dashboard', 
                        class_list: ['external-link'],
                        onclick_fn : e => window._log.debug(dashboard_path)//event_utils.dispatchCustomEvent(window, 'mpulse-open-linked-dashboard', 'akdv', [dashboard_path])
                    }
                ]
            }];
        };

        const onColorMinMaxChange = (e, x, y) => {

            let color_max, color_min;

            if (e.namespace === EVENT_NAMESPACE_FOR_COLOR_MAX) {
                color_max = legend.axis.getScale().invert(x);
                colorMinMarker.setDragConstraintAxisValues({ right: color_max });
            }
            if (e.namespace === EVENT_NAMESPACE_FOR_COLOR_MIN) {
                color_min = legend.axis.getScale().invert(x);
                colorMaxMarker.setDragConstraintAxisValues({ left: color_min });
            }
            
            legend.update({ color_min, color_max });
            tm.draw(false);
        };

        $(window).on('resize-charts.akdv', e => resize());
        $(window).on(`result.${EVENT_NAMESPACE_CHART_DATA_UPDATE}`, (e, result) => dataProvider.update(result));
        $(window).on(`data-updated.${EVENT_NAMESPACE_CHART_DATA_UPDATE}`, (e, result) => updateData(result));
        $(window).on('mpulse-linked-dashboard-update.akdv', (e, dashboard_path) => onUpdateLinkedDashboard(dashboard_path));
        $(window).on(`percentile-change.${EVENT_NAMESPACE_CHART_DATA_UPDATE}`, e => mpulse.setFilterByName('percentile', percentileInput.getValue()));
        $(window).on(`new-request.akdv`, e => percentileInput.setValue(data_utils.getValueAsNumberOrFallbackValue(mpulse.getFilterValueByName('percentile'), 50)));
        $(window).on(`marker-drag.${EVENT_NAMESPACE_FOR_COLOR_MIN} marker-drag.${EVENT_NAMESPACE_FOR_COLOR_MAX}`, (e, data) => onColorMinMaxChange(e, data.x, data.y));
        $(window).on(`percentiles-calculated.${EVENT_NAMESPACE_CHART_DATA_UPDATE}`, (e, bool) => (bool)? percentileInput.el.classList.remove('invisible') : percentileInput.el.classList.add('invisible'));
    };


    // const populateTypeFilterUI = (data_array, data_filtered, update_toggle_states = true) => {

    //     data_array = data_array.filter((d) => typeof d.is_comparison === 'undefined');
    //     // construct an object with properties for each entry in the EXTERNAL DIMENSION setting the value to the count of entries
    //     let value_sums = data_array.reduce((types_obj, d) => { 

    //         let type = d[CATEGORICAL_DIMENSION_PROPERTY_NAME] || 'other';

    //         if (!types_obj.hasOwnProperty(type)) { 
    //             types_obj[type] = data_filtered.filter(
    //                 (v) => typeof v.is_comparison === 'undefined' 
    //                        && type === (v[CATEGORICAL_DIMENSION_PROPERTY_NAME] || 'other')
    //             ).length; 
    //         }
    //         return types_obj;
    //     }, {});

    //     Object.keys(value_sums).forEach((k, i) => {

    //         let existing_filter_el = $('#resource-aggregate-active-filters').find('.filter[data-filter-value="' + k +'"]');

    //         if (existing_filter_el.length) {
    //             existing_filter_el.attr('data-filter-description', value_sums[k]).find('.filter-description').text(value_sums[k]);
    //             if (update_toggle_states && existing_filter_el.hasClass('togglable')) {
    //                 existing_filter_el.removeClass('filter-over').removeClass('soloed').toggleClass('checked', true);
    //             }
    //         } else {
    //             $('#resource-aggregate-active-filters').append(
    //                 chartFilterButtonFactory()
    //                 .filter_key(CATEGORICAL_DIMENSION_PROPERTY_NAME)
    //                 .togglable(true)
    //                 .filter_description(value_sums[k])
    //                 .filter_value(k)
    //                 .value_to_color_mapping_obj(window.akdv.utils_css.config.mediatype_color_map)
    //                 .getElement()
    //             );
    //         }
    //     });
    // };


    // const onFilterClick = (click_event) => {

    //     let key = click_event.currentTarget.getAttribute('data-filter-key');
    //     let snake_case_key = window.akdv.utils_string.snakeToKebabCase(key); // dimension key of clicked filter
    //     let togglable = click_event.currentTarget.classList.contains('togglable');
    //     let values = [click_event.currentTarget.getAttribute('data-filter-value')]; // to cater for filters of all dimensions
    //     let toggle = !click_event.currentTarget.classList.contains('checked');
    //     let filters_of_same_dimension = $('#resource-aggregate-active-filters').find('.filter.togglable.by-' + snake_case_key);
    //     let soloed = click_event.currentTarget.classList.contains('soloed');

    //     if (togglable) {

    //         if (click_event.type === 'click') {
    //             click_event.currentTarget.classList.toggle('checked', toggle);
    //             filters_of_same_dimension.toggleClass('soloed', false);
    //         } else { // dblclick
    //             filters_of_same_dimension.toggleClass('checked', soloed).removeClass('soloed');
    //             click_event.currentTarget.classList.toggle('checked', true);
    //             click_event.currentTarget.classList.toggle('soloed', !soloed);
    //         }

    //         // values array of same dimension filters that are now checked(unfiltered)
    //         let not_checked = filters_of_same_dimension.filter(':not(.checked)');

    //         values = (not_checked.length)
    //             ? filters_of_same_dimension.filter('.checked').get().map((el) => el.getAttribute('data-filter-value'))
    //             : false;

    //         window.clearTimeout(filter_mouseenter_timeout);
    //         // Trigger a mouse enter/leave event in order to reset the css controlled highlights 
    //         // of areas that need time to be populated in comparison mode (re-calculated composite areas for example).
    //         // Also areas that are animating back in need to be reset to filtered out coloring 
    //         // if not matching this filter and the mouse is still over the filter button.
    //         filter_mouseenter_timeout = setTimeout(() => { 

    //             let event_str = ($(click_event.currentTarget).filter(':hover').length && click_event.currentTarget.classList.contains('checked'))
    //                           ? 'mouseenter' 
    //                           : 'mouseleave';

    //             $(click_event.currentTarget).trigger(event_str); 
    //         }, 200);
    //     }

    //     event_utils.dispatchCustomEvent(window, 'filter-change', EVENT_NAMESPACE_CHART_DATA_UPDATE, { name: key, filtered_array: values });
    //     window.clearTimeout(filter_dblclick_timeout);
    // };


    // $('#resource-aggregate-active-filters').on('click dblclick', 
    //     `.filter.by-${window.akdv.utils_string.snakeToKebabCase(CATEGORICAL_DIMENSION_PROPERTY_NAME)}`, (click_event) => {

    //     click_event.stopPropagation();
    //     let timeout_period = (event.type === 'click')? ((filter_dblclick_timeout !== false)? 500 : 200) : 10;

    //     window.clearTimeout(filter_dblclick_timeout);
    //     filter_dblclick_timeout = false;
    //     filter_dblclick_timeout = window.setTimeout(() => {

    //         onFilterClick(click_event);
    //         window.clearTimeout(filter_dblclick_timeout);
    //         filter_dblclick_timeout = false;
    //     }, timeout_period);
    // });


    // // $(window).on(`filter-changed.${EVENT_NAMESPACE_CHART_DATA_UPDATE}`, (e, result) => {

    // //     if (result && result.data) {
    // //         populateTypeFilterUI(result.data, result.data_filtered, false);
    // //     }
    // // });


    // $(window).on(`data-updated.${EVENT_NAMESPACE_CHART_DATA_UPDATE}`, (e, result) => {

    //     if (result && result.data) {
    //         populateTypeFilterUI(result.data, result.data_filtered);
    //     }
    // });


    $(window).on('init-charts.akdv', onInitCharts);


})(window, window.jQuery, window.d3, window.moment, window.dataProviderFactory,
   window.getTreemapPlot, window.reorderableListFactory, window.chartFilterButtonFactory, 
   window.colorLegendFactory, window.draggableMarkerFactory, window.componentFactory, window.annotationBubbleFactory, 
   window.contextmenuFactory, window.switchFactory, window.customNumberInputFactory, window.akdv.mpulse,
   window.akdv.utils_math, window.akdv.utils_css, window.akdv.utils_string, window.akdv.utils_dom, window.akdv.utils_env, window.akdv.utils_data, window.akdv.utils_event, window.akdv.utils_lang);