;((window, $, d3, moment, dataProviderFactory,
   getCirclePackingPlot, reorderableListFactory, chartFilterButtonFactory, colorLegendFactory, 
   componentFactory, annotationBubbleFactory, contextmenuFactory,
   css_utils, string_utils, dom_utils, env_utils, data_utils, event_utils) => {

    'use strict';

    let filter_dblclick_timeout;
    let filter_mouseenter_timeout;

    const EVENT_NAMESPACE_CHART_DATA_UPDATE = 'circle-packing';
    const EVENT_NAMESPACE_FOR_ORDER_CHANGE = 'data-hierarchy';
    const EVENT_NAMESPACE_FOR_ANNOTATION_BUBBLE = 'annotation-bubble';
    const EVENT_NAMESPACE_FOR_CONTEXTMENU = 'circle-packing-contextmenu';
    const CATEGORICAL_DIMENSION_PROPERTY_NAME = 'mediatype';
    const LINEAR_DIMENSION_PROPERTY_NAME = 'load_time';
    const CONTAINER_ID = '#circle-packing';
    const ANNOTATION_CONTAINER_ID = '#annotation-layer';

    const display_legend = !!env_utils.getQueryParamValue('legend');
    const data_hierarchy_array = env_utils.getQueryParamValue('hierarchy')
        ? env_utils.getQueryParamValue('hierarchy').split(',') 
        : [CATEGORICAL_DIMENSION_PROPERTY_NAME, 'host', 'path'];
    
    const categorical_colors_map = !!env_utils.getQueryParamValue('cat')
        ? css_utils.getColorMapByCategory(CATEGORICAL_DIMENSION_PROPERTY_NAME, 'faint')
        : false;
    const linear_scale_colors_array = css_utils.getColorArrayByType('heatmap', 'faint');
    const linear_scale_color_max = Number(env_utils.getQueryParamValue('color_max') || 0);
    let linear_scale_color_min = Number(env_utils.getQueryParamValue('color_min') || 0);

    if (linear_scale_color_max && linear_scale_color_min > linear_scale_color_max) {
        window._log.warn('The mimimum value in a linear scale cannot be set to a value larger than the max setting.')
        linear_scale_color_min = linear_scale_color_max;
    }

    const AXIS_LABEL_TEXT = categorical_colors_map? 'Media Type' : 'Resource Load Time';

    const onInitCharts = () => {

        const container_el = document.querySelector(CONTAINER_ID);
        const chart_svg = dom_utils.appendResponsiveSVGToElement(container_el);

        const dataProvider = dataProviderFactory({
            event_namespace_for_data_update: EVENT_NAMESPACE_CHART_DATA_UPDATE,
            data_required_result_keys: data_utils.uniqueArray([ 'hits', ...data_hierarchy_array ]),
            data_dimension_filters_array: [
                { name: CATEGORICAL_DIMENSION_PROPERTY_NAME, type: 'categorical' },
                { name: LINEAR_DIMENSION_PROPERTY_NAME, type: 'linear' }
            ]
        });

        const legend = (display_legend) && colorLegendFactory({
            dimension_name: categorical_colors_map? CATEGORICAL_DIMENSION_PROPERTY_NAME : LINEAR_DIMENSION_PROPERTY_NAME,
            event_namespace_brush_filter: EVENT_NAMESPACE_CHART_DATA_UPDATE,
            container_el: chart_svg,
            colors_array: linear_scale_colors_array || false,
            categorical_colors_map: categorical_colors_map,
            tick_count: 7,
            label_text: AXIS_LABEL_TEXT
        });
        
        const cp = getCirclePackingPlot({
            event_namespace_chart_data_update : EVENT_NAMESPACE_CHART_DATA_UPDATE,
            event_namespaces_for_filters: [CATEGORICAL_DIMENSION_PROPERTY_NAME],
            event_namespace_for_data_hierarchy_update: EVENT_NAMESPACE_FOR_ORDER_CHANGE,
            container_el: chart_svg,
            data_provider: dataProvider,
            data_hierarchy_array : [...data_hierarchy_array],
            data_annotation_breadcrumb_depths_to_ommit_array : [2],
            data_circle_size_dimension_property_name : 'hits',
            data_circle_size_dimension_value_label_threshold : 20000,
            data_leaf_color_dimension_property_name: categorical_colors_map? CATEGORICAL_DIMENSION_PROPERTY_NAME : LINEAR_DIMENSION_PROPERTY_NAME,
            leaf_node_fill_d3_color_scale: (legend && legend.color_axis)? legend.color_axis.getScale() : false,
            function_for_annotation_title_from_end_node_data : (d) => {

                let lt = d.load_time || 0;
                let ht = d.size || 0;

                return window.akdv.utils_string.getFormattedNumber(d.load_time) + ' ms, ' 
                     + window.akdv.utils_string.getFormattedNumber(d.hits) + ' Hits, '
                     + Math.round(d.cachehitratio * 100) + '% Cache Hit Ratio';
            }
        });

        // cp.contextmenu = componentFactory({
        //     container_el: document.querySelector(ANNOTATION_CONTAINER_ID),
        //     event_namespace: EVENT_NAMESPACE_FOR_CONTEXTMENU,
        //     component: contextmenuFactory,
        //     show_timeout_period_ms: 0,
        //     offset_x_rems: 2,
        //     offset_y_rems: -2
        // });

        const reorderableList = reorderableListFactory({
            container_el: document.querySelector('#analysis header'),
            title: 'Reorderable Hierarchy',
            item_names_array: data_hierarchy_array,
            event_namespace_for_order_change: EVENT_NAMESPACE_FOR_ORDER_CHANGE
        });

        // const annotationBubble = componentFactory({ 
        //     container_el: document.querySelector(ANNOTATION_CONTAINER_ID),
        //     event_namespace: EVENT_NAMESPACE_FOR_ANNOTATION_BUBBLE,
        //     component: annotationBubbleFactory,
        //     show_timeout_period_ms: 700,
        //     offset_x_rems: 1.5,
        //     offset_y_rems: 0.55,
        //     function_to_format_data: ({ d, end_node_property_name } = {}) => ({ 
        //         title_obj: { 
        //             name: string_utils.uppercaseWords(end_node_property_name),  
        //             value: d.data[end_node_property_name]
        //         }, 
        //         name_value_unit_obj_list: [
        //             { name: 'hits', label: 'Hits', value: string_utils.getFormattedInteger(d.data.hits) },
        //             { name: 'load_time', label: 'Load Time', value: string_utils.getFormattedInteger(d.data[LINEAR_DIMENSION_PROPERTY_NAME]), unit: 'ms' },
        //             { name: 'cachehitratio', label: 'Cache Hit Ratio', value: (d.data.cachehitratio * 100).toFixed(1), unit: '%' },
        //             { name: 'avg_transfer_size', label: 'Avg. Size', value: string_utils.getFormattedNumber(d.data.avg_transfer_size * 0.001, 1), unit: 'kB' }
        //         ],
        //         x: container_el.getBoundingClientRect().left + d.x0 + ((d.x1 - d.x0) * 0.5),
        //         y: container_el.getBoundingClientRect().top + d.y0 + ((d.y1 - d.y0) * 0.5)
        //     })
        // });

        const resize = ({ w = container_el.offsetWidth, h = container_el.offsetHeight } = {}) => {

            if (legend) {
                legend.update({ w: w * 0.6, h: false, x: w * 0.2, y: h - css_utils.remsToPixels(3.75) });
            }
            cp.resize({ w, h });
            cp.draw();
        };

        const updateData = () => {

            let w = container_el.offsetWidth, h = container_el.offsetHeight;

            if (legend) {
                let label_text = (!categorical_colors_map && dataProvider.meta && dataProvider.meta.pageloadtime)
                    ? `${AXIS_LABEL_TEXT} (ms)` 
                    : undefined;

                let min = Math.min(d3.min(dataProvider.all(), d => 
                    (Object(d[LINEAR_DIMENSION_PROPERTY_NAME]) === d[LINEAR_DIMENSION_PROPERTY_NAME])
                        ? (dataProvider.meta.bucket_values && dataProvider.meta.bucket_values[LINEAR_DIMENSION_PROPERTY_NAME]? dataProvider.meta.bucket_values[LINEAR_DIMENSION_PROPERTY_NAME][0] : 0)
                        : (Array.isArray(d[LINEAR_DIMENSION_PROPERTY_NAME]))
                            ? Math.max(...d[LINEAR_DIMENSION_PROPERTY_NAME]) 
                            : d[LINEAR_DIMENSION_PROPERTY_NAME]),
                    linear_scale_color_min || 0
                );

                let max = Math.max(d3.max(dataProvider.all(), d =>
                    (Object(d[LINEAR_DIMENSION_PROPERTY_NAME]) === d[LINEAR_DIMENSION_PROPERTY_NAME])
                        ? (dataProvider.meta.bucket_values && dataProvider.meta.bucket_values[LINEAR_DIMENSION_PROPERTY_NAME]? dataProvider.meta.bucket_values[LINEAR_DIMENSION_PROPERTY_NAME].slice(-1).pop() : 0)
                        : (Array.isArray(d[LINEAR_DIMENSION_PROPERTY_NAME]))
                            ? Math.max(...d[LINEAR_DIMENSION_PROPERTY_NAME]) 
                            : d[LINEAR_DIMENSION_PROPERTY_NAME]),
                    linear_scale_color_max || 0
                );

                let color_max = (dataProvider.meta && dataProvider.meta.color_max)? dataProvider.meta.color_max : linear_scale_color_max;
                let color_min = (dataProvider.meta && dataProvider.meta.color_min)? dataProvider.meta.color_min : linear_scale_color_min;

                legend.update({ w: w * 0.6, h: false, x: w * 0.2, y: h - css_utils.remsToPixels(3.75), label: label_text, min, max, color_max, color_min });
            }

            cp.updateData();
            cp.resize({ w, h });
            cp.draw();
        };

        const onUpdateLinkedDashboard = (dashboard_path) => {

            cp.contextmenu.sections = [{ 
                title: 'Get More Details',
                items: [
                    { 
                        label: 'Open in linked dashboard', 
                        class_list: ['external-link'],
                        onclick_fn : e => window._log.debug(dashboard_path)//$(window).trigger('mpulse-open-linked-dashboard.akdv', dashboard_path)
                    }
                ]
            }];

        };

        $(window).on('resize-charts.akdv', e => resize());
        $(window).on(`result.${EVENT_NAMESPACE_CHART_DATA_UPDATE}`, (e, result) => dataProvider.update(result));
        $(window).on(`data-updated.${EVENT_NAMESPACE_CHART_DATA_UPDATE}`, (e, result) => updateData(result));
        $(window).on('mpulse-linked-dashboard-update.akdv', (e, dashboard_path) => onUpdateLinkedDashboard(dashboard_path));
    };


    const populateTypeFilterUI = (data_array, data_filtered, update_toggle_states = true) => {

        data_array = data_array.filter((d) => typeof d.is_comparison === 'undefined');
        // construct an object with properties for each entry in the EXTERNAL DIMENSION setting the value to the count of entries
        let value_sums = data_array.reduce((types_obj, d) => { 

            let type = d[CATEGORICAL_DIMENSION_PROPERTY_NAME] || 'other';

            if (!types_obj.hasOwnProperty(type)) { 
                types_obj[type] = data_filtered.filter(
                    (v) => typeof v.is_comparison === 'undefined' 
                           && type === (v[CATEGORICAL_DIMENSION_PROPERTY_NAME] || 'other')
                ).length; 
            }
            return types_obj;
        }, {});

        Object.keys(value_sums).forEach((k, i) => {

            let existing_filter_el = $('#active-filters').find('.filter[data-filter-value="' + k +'"]');

            if (existing_filter_el.length) {
                existing_filter_el.attr('data-filter-description', value_sums[k]).find('.filter-description').text(value_sums[k]);
                if (update_toggle_states && existing_filter_el.hasClass('togglable')) {
                    existing_filter_el.removeClass('filter-over').removeClass('soloed').toggleClass('checked', true);
                }
            } else {
                $('#active-filters').append(
                    chartFilterButtonFactory()
                    .filter_key(CATEGORICAL_DIMENSION_PROPERTY_NAME)
                    .togglable(true)
                    .filter_description(value_sums[k])
                    .filter_value(k)
                    .value_to_color_mapping_obj(window.akdv.utils_css.config.mediatype_color_map)
                    .getElement()
                );
            }
        });
    };


    const onFilterClick = (click_event) => {

        let key = click_event.currentTarget.getAttribute('data-filter-key');
        let snake_case_key = window.akdv.utils_string.snakeToKebabCase(key); // dimension key of clicked filter
        let togglable = click_event.currentTarget.classList.contains('togglable');
        let values = [click_event.currentTarget.getAttribute('data-filter-value')]; // to cater for filters of all dimensions
        let toggle = !click_event.currentTarget.classList.contains('checked');
        let filters_of_same_dimension = $('#active-filters').find('.filter.togglable.by-' + snake_case_key);
        let soloed = click_event.currentTarget.classList.contains('soloed');

        if (togglable) {

            if (click_event.type === 'click') {
                click_event.currentTarget.classList.toggle('checked', toggle);
                filters_of_same_dimension.toggleClass('soloed', false);
            } else { // dblclick
                filters_of_same_dimension.toggleClass('checked', soloed).removeClass('soloed');
                click_event.currentTarget.classList.toggle('checked', true);
                click_event.currentTarget.classList.toggle('soloed', !soloed);
            }

            // values array of same dimension filters that are now checked(unfiltered)
            let not_checked = filters_of_same_dimension.filter(':not(.checked)');

            values = (not_checked.length)
                ? filters_of_same_dimension.filter('.checked').get().map((el) => el.getAttribute('data-filter-value'))
                : false;

            window.clearTimeout(filter_mouseenter_timeout);
            // Trigger a mouse enter/leave event in order to reset the css controlled highlights 
            // of areas that need time to be populated in comparison mode (re-calculated composite areas for example).
            // Also areas that are animating back in need to be reset to filtered out coloring 
            // if not matching this filter and the mouse is still over the filter button.
            filter_mouseenter_timeout = setTimeout(() => { 

                let event_str = ($(click_event.currentTarget).filter(':hover').length && click_event.currentTarget.classList.contains('checked'))
                              ? 'mouseenter' 
                              : 'mouseleave';

                $(click_event.currentTarget).trigger(event_str); 
            }, 200);
        }

        event_utils.dispatchCustomEvent(window, 'filter-change', EVENT_NAMESPACE_CHART_DATA_UPDATE, { name: key, filtered_array: values });
        window.clearTimeout(filter_dblclick_timeout);
    };


    $('#active-filters').on('click dblclick', 
        `.filter.by-${window.akdv.utils_string.snakeToKebabCase(CATEGORICAL_DIMENSION_PROPERTY_NAME)}`, (click_event) => {

        click_event.stopPropagation();
        let timeout_period = (event.type === 'click')? ((filter_dblclick_timeout !== false)? 500 : 200) : 10;

        window.clearTimeout(filter_dblclick_timeout);
        filter_dblclick_timeout = false;
        filter_dblclick_timeout = window.setTimeout(() => {

            onFilterClick(click_event);
            window.clearTimeout(filter_dblclick_timeout);
            filter_dblclick_timeout = false;
        }, timeout_period);
    });


    // $(window).on(`filter-changed.${EVENT_NAMESPACE_CHART_DATA_UPDATE}`, (e, result) => {

    //     if (result && result.data) {
    //         populateTypeFilterUI(result.data, result.data_filtered, false);
    //     }
    // });


    $(window).on(`data-updated.${EVENT_NAMESPACE_CHART_DATA_UPDATE}`, (e, result) => {

        if (result && result.data) {
            populateTypeFilterUI(result.data, result.data_filtered);
        }
    });


    $(window).on('init-charts.akdv', onInitCharts);


})(window, window.jQuery, window.d3, window.moment, window.dataProviderFactory,
   window.getCirclePackingPlot, window.reorderableListFactory, window.chartFilterButtonFactory, 
   window.colorLegendFactory, window.componentFactory, window.annotationBubbleFactory, window.contextmenuFactory,
   window.akdv.utils_css, window.akdv.utils_string, window.akdv.utils_dom, window.akdv.utils_env, window.akdv.utils_data, window.akdv.utils_event);