// unlike the standalone version this has no code for dynamic page title
;((window, $, d3, getWaterfallStackedAreaPlot, chartFilterButtonFactory, string_utils, mpulse) => {
    
    'use strict';
    
    
    let filter_dblclick_timeout; 
    let filter_mouseenter_timeout;
    const EXTERNAL_DIMENSION_PROPERTY_NAME = 'mediatype';
    
    // ============================= COLUMN 1 ================================ */
    // CHART : Conversion Impact vs Page Load - Pre Optimization
    
    const guessMediaTypeByTypeOrPath = function(type, path) {
        // initiator types with guaranteed media types
        switch (type) {
            case 'html':
            case 'iframe':
                return 'html';

            case 'img':
            case 'image':
                return 'image';

            case 'script':
                return 'script';

            case 'beacon':
            case 'beacons':
            case 'xhr':
            case 'xmlhttprequest':
            case 'fetch':
                return 'xhr';
        }

        let filename = string_utils.filenameFromURL(path);
        let extension = string_utils.extensionFromFilename(filename);
        
        // filenames ending with '/' can be assumed to be html
        if (filename.length === 0) {
            return 'html';
        }
    
        // guessing based on file extension
        switch (extension) {
            case '/': case 'html': case 'htm': case 'php': case 'jsp':
                return 'html';

            case 'js':
                return 'script';

            case 'css':
                return 'css';

            case 'jpg': case 'png': case 'bmp': case 'tiff': case 'webp': case 'gif': case 'svg': case 'jpeg': case 'ico':
                return 'image';

            case 'swf':
                return 'flash';

            case 'flv': case 'mp4': case 'mov': case 'webm': case 'avi': case 'mpg': case 'wmv': case 'asf':
                return 'video';

            case 'woff': case 'woff2': case 'otf': case 'ttf': case 'eot':
                return 'font';
                
            case 'json': case 'xml':
                return 'text';
                
            default: case '':
                return 'unknown';
        }
    };
    

    const addMissingMediatypes = (data) => data.map(d => {
        if (!d.hasOwnProperty(EXTERNAL_DIMENSION_PROPERTY_NAME)) {
            if (d.hasOwnProperty('asset_type')) {
                d[EXTERNAL_DIMENSION_PROPERTY_NAME] = guessMediaTypeByTypeOrPath(d.asset_type, d.path);
            } else {
                d[EXTERNAL_DIMENSION_PROPERTY_NAME] = 'unknown';
            }
        }
        return d;
    });


    const onInitCharts = () => {


        let aggregated_waterfall_chart = getWaterfallStackedAreaPlot({
            event_namespace_chart_data_update : 'resource-aggregate-waterfall',
            event_namespace_banded_scale_item_select : 'host',
            event_namespace_for_external_filter_trigger : EXTERNAL_DIMENSION_PROPERTY_NAME,
            container_id : '#resource-aggregate-waterfall',
            axis_x_bottom_container_id : '#resource-aggregate-waterfall-axis-x-bottom',
            axis_y_left_container_id : '#resource-aggregate-waterfall-axis-y-left',
            axis_y_right_container_id : '#resource-aggregate-waterfall-axis-y-right',
            axis_x_bottom_label_text : `Percentage Of Median ${mpulse.getFilterDisplayLabelByName('timer') || 'Page Load'}`,
            axis_x_bottom_unit_of_measurement : 'ms',
            axis_x_bottom_enable_annotations : true,
            data_axis_x_property_name : 'median_start',
            data_ranking_property_name : 'median_start',
            data_axis_y_banded_scale_property_name : 'host',
            data_area_opacity_property_name : 'hits',
            data_area_opacity_ratio_property_name : 'cachehitratio',
            data_additional_properties_to_copy : ['asset_type', 'initiator_type', 'initiator', 'path', 'avg_transfer_size', 'load_time'],
            data_axis_y_banded_scale_unstacked_property_name : 'path',
            data_area_values_array_property_name : 'distribution',
            data_external_dimension_property_name : EXTERNAL_DIMENSION_PROPERTY_NAME,
            data_dimension_for_color_scale_property_name : EXTERNAL_DIMENSION_PROPERTY_NAME,
            fn_to_add_missing_external_dimension_property : addMissingMediatypes,
            dimension_for_color_scale_property_values_to_color_scale_mappings : window.akdv.utils_css.getColorMapByCategory(),
            axis_y_left_compact_labels : true,
            timer: `${mpulse.getFilterDisplayLabelByName('timer') || 'Page Load'}`
        });

        
        const populateTypeFilterUI = function(data, data_filtered, update_toggle_states = true) {
            
            data = addMissingMediatypes(data);
            
            data = data.filter(function(d) { return typeof d.is_comparison === 'undefined'; });

            // construct an object with properties for each entry in the EXTERNAL DIMENSION setting the value to the count of entries
            let value_sums = data.reduce(function(types_obj, d) { 
                
                let type = d[EXTERNAL_DIMENSION_PROPERTY_NAME] || 'other';
                
                if (!types_obj.hasOwnProperty(type)) { 
                    types_obj[type] = data_filtered.filter(function(v){ return typeof v.is_comparison === 'undefined' && type === (v[EXTERNAL_DIMENSION_PROPERTY_NAME] || 'other'); }).length; 
                }
                return types_obj;
            }, {});
            
            Object.keys(value_sums).forEach(function(k, i) {
                
                let existing_filter_el = $('#resource-aggregate-waterfall-active-filters').find('.filter[data-filter-value="' + k +'"]');
                
                if (existing_filter_el.length) {
                    existing_filter_el.attr('data-filter-description', value_sums[k]).find('.filter-description').text(value_sums[k]);
                    if (update_toggle_states && existing_filter_el.hasClass('togglable')) {
                        existing_filter_el.removeClass('filter-over').removeClass('soloed').toggleClass('checked', true);
                    }
                } else {
                    $('#resource-aggregate-waterfall-active-filters').append(
                        chartFilterButtonFactory()
                        .filter_key(EXTERNAL_DIMENSION_PROPERTY_NAME)
                        .togglable(true)
                        .filter_description(value_sums[k])
                        .filter_value(k)
                        .value_to_color_mapping_obj(window.akdv.utils_css.config.mediatype_color_map)
                        .getElement()
                    );
                }
            });
        };
        
        
        const onFilterClick = function(click_event) {
            
            let key = click_event.currentTarget.getAttribute('data-filter-key');
            let snake_case_key = window.akdv.utils_string.snakeToKebabCase(key); // dimension key of clicked filter
            let togglable = click_event.currentTarget.classList.contains('togglable');
            let values = [click_event.currentTarget.getAttribute('data-filter-value')]; // to cater for filters of all dimensions
            let toggle = !click_event.currentTarget.classList.contains('checked');
            let filters_of_same_dimension = $('#resource-aggregate-waterfall-active-filters').find('.filter.togglable.by-' + snake_case_key);
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
                ? filters_of_same_dimension.filter('.checked').get().map(function(el) { return el.getAttribute('data-filter-value'); })
                : false;
                
                window.clearTimeout(filter_mouseenter_timeout);
                // Trigger a mouse enter/leave event in order to reset the css controlled highlights 
                // of areas that need time to be populated in comparison mode (re-calculated composite areas for example).
                // Also areas that are animating back in need to be reset to filtered out coloring 
                // if not matching this filter and the mouse is still over the filter button.
                filter_mouseenter_timeout = setTimeout(function() { 
                    
                    let event_str = ($(click_event.currentTarget).filter(':hover').length && click_event.currentTarget.classList.contains('checked'))
                    ? 'mouseenter' 
                    : 'mouseleave';
                    
                    $(click_event.currentTarget).trigger(event_str); 
                }, 200);
            }
            
            $(window).trigger('filter-change.' + snake_case_key, { filter_values : values });
            window.clearTimeout(filter_dblclick_timeout);
        };
        
        
        $(window).on('filter-change.host', function(e, _filter_value, _key_count) {
            
            if (_filter_value && _key_count) {
                $('#resource-aggregate-waterfall-active-filters').prepend(
                    chartFilterButtonFactory()
                    .filter_key('host')
                    .filter_description(_key_count + ' resources from ')
                    .closable(true)
                    .filter_value(_filter_value)
                    .getElement('#resource-aggregate-waterfall-active-filters')
                );
            }
        });
        
        
        $('#resource-aggregate-waterfall-active-filters').on('click', '.filter.by-host', function(e) {
            
            if ($(e.currentTarget).hasClass('closable')) {
                $(e.currentTarget).addClass('disabled').remove();
            }
            
            $(window).trigger('filter-change.host');
        });
        
        
        $('#resource-aggregate-waterfall-active-filters').on('click dblclick', '.filter.by-' 
        + window.akdv.utils_string.snakeToKebabCase(EXTERNAL_DIMENSION_PROPERTY_NAME), function(click_event) {
            
            let timeout_period = (event.type === 'click')? ((filter_dblclick_timeout !== false)? 500 : 200) : 10;
            
            window.clearTimeout(filter_dblclick_timeout);
            filter_dblclick_timeout = false;
            
            filter_dblclick_timeout = window.setTimeout(function() {
                
                onFilterClick(click_event);
                window.clearTimeout(filter_dblclick_timeout);
                filter_dblclick_timeout = false;
            }, timeout_period);
        });
        
        
        $('#resource-aggregate-waterfall-active-filters').on('mouseenter mouseleave', '.filter.by-' 
        + window.akdv.utils_string.snakeToKebabCase(EXTERNAL_DIMENSION_PROPERTY_NAME), function(e) {
            
            let $areas = $(`.stacked-area[data-${window.akdv.utils_string.snakeToKebabCase(EXTERNAL_DIMENSION_PROPERTY_NAME)}="${e.currentTarget.getAttribute('data-filter-value')}"]`);
            let is_filter_over = $areas.first().hasClass('filter-over');
            let is_checked = e.currentTarget.classList.contains('checked');
            let toggle = (is_checked)? (e.type === 'mouseenter') : false;
            
            $areas.toggleClass('filter-over', toggle);
            $('#resource-aggregate-waterfall').toggleClass('filter-to-single-type', toggle);
        });
        
        
        $(window).on('filter-changed.' + window.akdv.utils_string.snakeToKebabCase(EXTERNAL_DIMENSION_PROPERTY_NAME), function(e, result) {
            
            if (result && result.data) {
                populateTypeFilterUI(result.data, result.data_filtered, false);
            }
        });
        
        
        $(window).on('result-processed.resource-aggregate-waterfall', function(e, result, filtered_data) {
            
            if (result && result.data) {
                populateTypeFilterUI(result.data, filtered_data);
            }
        });
    };

    $(window).on('init-charts.akdv', onInitCharts);
    
    
})(window, window.jQuery, window.d3, window.getWaterfallStackedAreaPlot, window.chartFilterButtonFactory, window.akdv.utils_string, window.akdv.mpulse);