;(function(
        window, 
        document, 
        $, 
        d3, 
        crossfilter, 
        D3AxisCheckbox, 
        D3BoxWhisker, 
        D3ThresholdLine,
        utils_css,
        addLocalizedString,
        statusNotifier
        ) {

    'use strict';

    /**
     * Requires Data of the form :
     * (key mapping can be overridden using opts)
     * data = [
     * {
          "page_group": "Foo",
          "filename": "k86tocrj.js",
          "quartile_bottom": 1015.322294167958,
          "lquartile_top": 1217.7007174652347,
          "median": 1116.5115058165964,
          "2ndsd_top": 1379.7560165213815,
          "2ndsd_bottom": 853.2669951118112
        },
        ...
     * ];
     *
     * Median, quartiles and second standard deviations are all pre-calculated.
     * The data property names can be overwritten in the options.
     */
    
    var defaults = {
        chartName : '',
        event_namespace_chart_data_update : 'box-whisker-row-plot',                 // This string, must match a 'chart_group' in the JSON data
        event_namespace_for_modified_data : false,
        event_namespace_optimization : false,
        event_namespace_auto_scroll : false,
        event_namespace_for_external_filter_trigger : false,
        event_namespace_for_external_filter_listener : false,
        
        event_namespace_for_axis_label_annotation_listener : false,
        event_namespace_for_box_whisker_annotation_listener : false,
        event_namespace_for_slider_annotation_listener : false,
        
        banded_scale_item_select_enabled : false,                                   // enables user to select an item along the banded scale and trigger a filter event on that dimension
        dataOptimizationFunction : false,

        original_data_prefix : '',
        
        container_id : '#box-whisker-row-plot',
        chart_container_id : '',
        chart_min_height_element_selector : '',
        
        main_title_id: null,
        main_title_default_string : '<strong>All</strong> Groups',
        main_title_string_template : '<strong>@#@</strong> Group',
        
        auto_scroll_container_selector : '',
        
        chart_filter : null,
        
        axis_x_bottom_container_id : '#box-whisker-row-plot-axis-x-bottom',
        axis_x_min_max_container_id : '#box-whisker-row-plot-axis-x-top',           // Where in the chart, this element should be inserted
        axis_x_vert_line_a_container_id : '#box-whisker-row-plot-axis-x-top',
        axis_y_left_container_id : '#box-whisker-row-plot-axis-y-left',
        axis_y_right_container_id : '#box-whisker-row-plot-axis-y-right',
        axis_x_bottom_slider_id : '#axis-x-bottom-slider',

        data_external_dimension_property_name : false,
        data_external_dimension_property_is_array_of_keys : false,
        
        data_group_key : '',
        data_median_property_name : 'median',
        data_quartile_bottom_property_name : 'quartile_bottom',
        data_quartile_top_property_name : 'quartile_top',
        data_bottom_whisker_property_name : 'bottom_whisker',
        data_top_whisker_property_name : 'top_whisker',
        data_axis_y_banded_scale_property_name : 'filename',
        data_ranking_property_name: 'median',                                       // What property (NUMBER) show the rows be sorted by
        
        data_sort_by_ranking : false,                                               // Should the data rows be sorted  by a value before plotting
        data_sort_by_ranking_reverse_order : false,                                 // Should the data sort be reversed
        data_apply_all_values_offset : false,                                       // Apply a number to offset each of the box values. Useful to convert asbolute load times, to waterfall load times...
        data_all_values_offset_property_name : null,                                // The property (NUMBER) to apply as the offset
        
        axis_x_bottom_label_vertical_offset : null,
        axis_x_bottom_label_text : null,
        axis_x_bottom_label_sub_A_locale_obj : null,
        axis_x_bottom_label_sub_B_locale_obj : null,
        
        axis_x_bottom_domain_override_property : null,                              // If Set as a numerical property, its value will be multiplied by 'axis_x_bottom_over_ride_multiplier', and stored in 
        axis_x_bottom_domain_override_multiplier : null,                            // The multiplier for the domain override
        axis_x_bottom_domain_override_if_larger : false,                            // Only use the value, if it is larger than the original
        axis_x_bottom_domain_override_value : null,                                 // If this is defined, it will be used as the X Axis domain size
        
        axis_y_left_compact_labels : true,
        axis_y_left_apply_vendor_color : false,
        axis_y_left_add_vendor_icon : false,
        axis_y_left_add_tooltip_info : true, 
        axis_y_left_add_matching_attr_highligher : true,

        axis_y_left_label_locale_obj : null,
        axis_y_left_label_sub_locale_obj : null,
        
        axis_x_bottom_slider_enabled : false,                                       // axis_x_bottom_step is what defines what is deemed to be a red value for the x axis colour range, the default color range has 5 entries, 4 before red so a step value of 250 would mean an x axis value of >750 would be required before colored red
        axis_x_bottom_slider_initial_value : null,                                  // Slider defaults to value of 0, this can be changed for init here....
        axis_x_bottom_slider_mult : 0.01,
        
        axis_x_bottom_step : 1200,                                                  // X Axis colour range steps, use lower values to shorten the range, moving red, to left...
        axis_x_bottom_minimum_max : 5000,                                           // Defines max range for X axis. Set to zero, to allow data to define max range...
        
        show_min_max : false,                                                       // Show a pair of lines, that indicate the Q75 and HIGH values of the largest box displayed
        
        threshold_lines : [],                                                       // Allows for an array, of Threshold lines to be displayed. See 'D3ThresholdLine' definition, for properties to set here

        interactable_property: 'interactable',                                      // Is the Whisker interactive, overrides drag_enabled, PER Whisker
        box_whiskers_slider_enabled : false,
        box_whiskers_drag_enabled : false,
        box_whiskers_drag_value_min : 0,
        box_whiskers_slider_bouble_click_callback : function(){},
        
        onDragStartCallback : function(){},
        onDragEndCallback : function(){},
        drag_end_timer : null,
        drag_end_timer_delay : 100,
        onDragCancelAnnotations: [],
        
        box_height_rems : 2.65,                                                     // Determines chart row height
        row_padding_percent : 0.2,
        
        show_checkboxes : false,
        checkbox_data_property : null,
        checkboxesClickCallback : function(){},
        checkboxes_disabled_threshold : null,
        
        simple_bar_added : false,
        simple_scroll_bar_enabled : true,
                    
        delay_updateData : 30,
        delay_updateData_DeBounce : null,
        delay_onFilterChangeExternalDimension_DeBounce : null,
        delay_onFilterChangeAxisXBottomThreshold_DeBounce : null,
        
        vendor_colors : null,
        
        enforce_box_whisker_interactable : false
    };


    window.getBoxWhiskerRowPlot = function(_opts) {
              
        let opts = $.extend({ uuid: window.akdv.utils_string.generateUUID() }, defaults, _opts);
        let drag_end_timer;
        let drag_end_timer_delay;
        let axis_x_bottom_filter_threshold = 0;
        let axis_x_max_value = 0;
        let total_records = 0;
        let chart_width;
        let xfFilterName;
        let axis_x_scale = d3.scaleLinear();
        let axis_y_scale = d3.scaleBand();
        let axis_x_bottom_color_scale = d3.scaleLinear();
    
        let required_data_keys = [
            opts.data_median_property_name,
            opts.data_quartile_bottom_property_name,
            opts.data_quartile_top_property_name,
            opts.data_bottom_whisker_property_name,
            opts.data_top_whisker_property_name,
            opts.data_axis_y_banded_scale_property_name,
        ];

        const updateMainChartTitle = function(result) {

            let $mainTitleEl = $(opts.main_title_id);
            
            // QUIT: If element could not be found
            if($mainTitleEl.length === 0) { return; }

            $mainTitleEl.empty();
            
            if( $.type(result) === 'object' && typeof result[opts.main_title_string_property] === 'string' )
            {
                const tplString = result[opts.main_title_string_property];
                if( $mainTitleEl.attr('data-title-value') !== tplString ) {

                    
                    const mainTitle = d3.select($mainTitleEl).html("");
                    const template = opts.main_title_string_template.templateString;
                    const tplArray = opts.main_title_string_template.tokens;
                    const $elements = $(template);
                    
                    if( typeof template === 'string' && template.length > 0 && $.type(tplArray) === 'array' && tplArray.length > 1 )
                    {
                        
                        tplArray.forEach(function(e,i) {
                            $elements.each(function(index,el) {
                                if(e.id === el.id)
                                {
                                    addLocalizedString(el, e.key, e.namespace);
                                }
                                
                                if( el.getAttribute('data-metric') === 'true' )
                                {
                                    // Use the Template text, replacing the symbol with the Filter Name
                                    const tplREgex = /@#@/;
                                    el.innerText = el.innerText.replace(tplREgex,tplString)  
                                }
                            });
                        });   
                    }
                    
                    $elements.each(function($index,$el) {
                        $mainTitleEl.append($el);
                    });
                }
            }
            else
            {   
                // No Filter set, use the default title
                d3.select($mainTitleEl).text(function(d) { return addLocalizedString(this[0], opts.main_title_default_string.key, opts.main_title_default_string.namespace); });
            }           
        };
        
        updateMainChartTitle();        

        // populate the dom with the base svg and group
        const chart_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.container_id);
        
        // Defines a sepia ID in defs, that can be applied as a filter to this Chart
        chart_svg.append('defs')
            .append('filter')
                .attr('id','de-saturate')
            .append('feColorMatrix')
                .attr('type','saturate')
                .attr('values','0.8')

        const chart_svg_g = chart_svg
            .append('g')
            .attr('class', 'inner-chart');
        
        $( chart_svg_g.node() ).on( "mouseenter", "g.box-whisker", function( e ) {
            
            if( opts.event_namespace_for_box_whisker_annotation_listener )
            {
                const data = d3.select(e.currentTarget).datum().value;
                const pos = {
                        'boundingRect': e.currentTarget.getBoundingClientRect(),
                        'x': e.clientX, 
                        'y': e.clientY
                };
                
                window.akdv.utils_event.dispatchCustomEvent(window, 'show-component', opts.event_namespace_for_box_whisker_annotation_listener, [ e, { e, pos, data } ]);  
            } 
        });
        
        $( chart_svg_g.node() ).on( "mouseleave", "g.box-whisker", function( e ) {
            
            if( opts.event_namespace_for_box_whisker_annotation_listener )
            {
                window.akdv.utils_event.dispatchCustomEvent(window, 'hide-component', opts.event_namespace_for_box_whisker_annotation_listener); 
            } 
        });

        const axis_x_bottom_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.axis_x_bottom_container_id);
        
        const axis_x_bottom_svg_g = axis_x_bottom_svg
            .append('g')
            .attr('class', 'axis axis-x-bottom');
        
        const defs = axis_x_bottom_svg.append('defs');
        
        const linear_gradient = window.d3AppendLinearGradient(defs, opts.container_id);
        
        axis_x_bottom_svg
        .classed('axis-labels', true);
        
        // Bottom X Axis Label Group
        const axis_x_bottom_label_group = axis_x_bottom_svg
            .append('g')
            .attr('class','axis-labels-group');
        
        // Bottom X Axis Label
        const axis_x_bottom_label = axis_x_bottom_label_group
            .append('text')
            .attr('class', 'label axis-label x')
            .attr('x', 0 )
            .style('text-anchor', 'start')
            .text( function(d,i) { return addLocalizedString(this, opts.axis_x_bottom_label_text.key, opts.axis_x_bottom_label_text.namespace); } );

        // Bottom X Axis Sub-Label Group
        let axis_x_bottom_sub_label_A;
        if( $.type(opts.axis_x_bottom_label_sub_A_locale_obj) === 'object' )
        {
            axis_x_bottom_sub_label_A = axis_x_bottom_label_group
                .append('text')
                .attr('class', 'sub-label x a')
                .attr('x', 0 )
                .style('text-anchor', 'start')
                .text( function(d,i) { return addLocalizedString(this, opts.axis_x_bottom_label_sub_A_locale_obj.key, opts.axis_x_bottom_label_sub_A_locale_obj.namespace); } );   
        }
        
        // Setup an Empty sub-label B element
        let axis_x_bottom_sub_label_B;
        if( $.type(opts.axis_x_bottom_label_sub_B_locale_obj) === 'object' )
        {
            axis_x_bottom_sub_label_B = axis_x_bottom_label_group
                .append('text')
                .attr('class', 'sub-label x b')
                .style('text-anchor','start')
                .attr('x', 0 )
                .text( function(d,i) { return addLocalizedString(this, opts.axis_x_bottom_label_sub_B_locale_obj.key, opts.axis_x_bottom_label_sub_B_locale_obj.namespace); } );   
        }
        
        const axis_x_bottom_color_range_rect = axis_x_bottom_svg
            .append('rect')
            .style('fill', 'url(' + opts.container_id + '-linear-gradient)');
        
        // Add MIN / MAX UI elements to DOM
        if (opts.show_min_max)
        {
            var axis_x_min_max_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.axis_x_min_max_container_id);
            
            var axis_x_min_max_svg_g = axis_x_min_max_svg
                .append('g')
                .attr('class', 'axis axis-x-top');
            
            var min_max_rect = axis_x_min_max_svg_g
                .append('rect')
                .attr('class', 'min-max-rect');
            
            var min_text = axis_x_min_max_svg_g
                .append('text')
                .attr('class', 'label axis-label x label-min')
                .text('Min');
            
            var max_text = axis_x_min_max_svg_g
                .append('text')
                .attr('class', 'label axis-label x label-max')
                .text('Max');
            
            var min_line = chart_svg_g
                .append('line')
                .attr('class', 'dashed-line min-line');
            
            var max_line = chart_svg_g
                .append('line')
                .attr('class', 'dashed-line max-line');
        }

        
        const axis_y_left_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.axis_y_left_container_id);

        const axis_y_left_svg_g = axis_y_left_svg
            .append('g')
            .attr('class', 'axis axis-y-left');
        
        
        // Attach an event listener, to DISPLAY an Axis TICK Annotation on mouseenter
        $( axis_y_left_svg.node() ).on( "mouseenter", "g.tick", function( e ) {
            
            if( opts.event_namespace_for_axis_label_annotation_listener )
            {
                const url = d3.select(e.currentTarget).datum();
                const pos = e.currentTarget.getBoundingClientRect();
                const impact = parseFloat( e.currentTarget.getAttribute('data-asset-impact') );
                const vendor = e.currentTarget.getAttribute('data-asset-vendor');
                const median = e.currentTarget.getAttribute('data-asset-median');
                const hits = e.currentTarget.getAttribute('data-asset-hits');
                
                window.akdv.utils_event.dispatchCustomEvent(window, 'show-component', opts.event_namespace_for_axis_label_annotation_listener, [ e, { url, impact, vendor, median, hits, pos } ]);
            } 
        });
        
        // Attach an event listener, to HIDE an Axis TICK Annotation on mouseenter
        $( axis_y_left_svg.node() ).on( "mouseleave", "g.tick", function( e ) {
            if( opts.event_namespace_for_axis_label_annotation_listener ) {
                window.akdv.utils_event.dispatchCustomEvent(window, 'hide-component', opts.event_namespace_for_axis_label_annotation_listener);
            } 
        });
        
        let axis_y_left_label_svg;
        let axis_y_left_label_svg_g;        
        let axis_y_left_main_label;
        let axis_y_left_sub_label;
        
        // ADD Y Axis Left Label
        if( typeof opts.axis_y_left_label_id === 'string' && opts.axis_y_left_label_id.length !== 0 )
        {
            const axis_y_left_label = d3.select(opts.axis_y_left_label_id);
            
            axis_y_left_label_svg = axis_y_left_label
                .append('svg')
                .attr('width','100%')
                .attr('height','100%')
                .attr('xmlns','http://www.w3.org/2000/svg')
                .attr('viewBox', '0 0 0 0');
                
            axis_y_left_label_svg_g = axis_y_left_label_svg
                .append('g')
                .attr('class', 'axis-labels y left');
                    
            axis_y_left_main_label = axis_y_left_label_svg_g
                .append('text')
                .attr('class','label axis-label y')
                .style('text-anchor','start')
                .text( function(d,i) { return addLocalizedString(this, opts.axis_y_left_label_locale_obj.key, opts.axis_y_left_label_locale_obj.namespace); } )
                .attr('transform','translate(0 0) rotate(-90 0 0) ');
        
            // Display a Left Y Axis Sub-Label, if text has been defined for it
            if( $.type(opts.axis_y_left_label_sub_locale_obj) === 'object' )
            {
                let mainLabelBB = axis_y_left_main_label.node().getBBox();
        
                axis_y_left_sub_label = axis_y_left_label_svg_g
                    .append('text')
                    .attr('class','sub-label y')
                    .style('text-anchor','start')
                    .text( function(d,i) { return addLocalizedString(this, opts.axis_y_left_label_sub_locale_obj.key, opts.axis_y_left_label_sub_locale_obj.namespace); } )
                    .attr('transform','translate(0 0) rotate(-90 0 0) ');
            }
        }
 
        
        var axis_y_right_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.axis_y_right_container_id);
        
        var axis_y_right_svg_g = axis_y_right_svg
            .append('g')
            .attr('class', 'axis axis-y-right');

        // init crossfilter, pg dimension and shared group
        var xf = crossfilter({});
        
        var external_dimension_filter = xf.dimension(function(d) { 

            let need_to_split = (opts.data_external_dimension_property_is_array_of_keys
                                 && d[opts.data_external_dimension_property_name]
                                 && !Array.isArray(d[opts.data_external_dimension_property_name]));
            
            return (need_to_split)? d[opts.data_external_dimension_property_name].split(',') : d[opts.data_external_dimension_property_name]; 
            
        }, opts.data_external_dimension_property_is_array_of_keys);

        var xf_group = xf.dimension(function(d) { return d[opts.data_axis_y_banded_scale_property_name]; }).group().reduce(
            function (p, d, nf) { // add
                
                p.filtered = false;
                
                if( $.type(d.hits) === 'number' )
                {
                    p.hits = d.hits;
                }
                
                if( typeof d.vendor === 'string' )
                {
                    p.vendor = d.vendor;
                }
                
                if (nf)
                { 
                    // only set props when adding not when filtering
                    let offset = (opts.data_apply_all_values_offset && opts.data_all_values_offset_property_name)
                       ? d[opts.data_all_values_offset_property_name]
                       : 0;
                       
                    if( typeof d[opts.checkbox_data_property] === 'boolean' )
                    {
                        p[opts.checkbox_data_property] = d[opts.checkbox_data_property];
                    }
                       
                    p.offset = d[opts.data_all_values_offset_property_name];
                    p[opts.data_external_dimension_property_name] = (d[opts.data_external_dimension_property_name] && !Array.isArray(d[opts.data_external_dimension_property_name]))
                            ? d[opts.data_external_dimension_property_name].split(',')
                            : d[opts.data_external_dimension_property_name];
 
                              
                    if( $.type(d[opts.original_data_prefix + opts.data_bottom_whisker_property_name]) === 'number' )
                    {
                        p[opts.original_data_prefix + 'bottom_whisker'] = d[opts.original_data_prefix + opts.data_bottom_whisker_property_name];
                        p[opts.original_data_prefix + 'quartile_bottom'] = d[opts.original_data_prefix + opts.data_quartile_bottom_property_name];
                        p[opts.original_data_prefix + 'median'] = d[opts.original_data_prefix + opts.data_median_property_name];
                        p[opts.original_data_prefix + 'quartile_top'] = d[opts.original_data_prefix + opts.data_quartile_top_property_name];
                        p[opts.original_data_prefix + 'top_whisker'] = d[opts.original_data_prefix + opts.data_top_whisker_property_name];
                    }
                            
                    p.group_key = d[opts.data_group_key];
                    p.bottom_whisker = d[opts.data_bottom_whisker_property_name] + (offset || 0);
                    p.quartile_bottom = d[opts.data_quartile_bottom_property_name] + (offset || 0);
                    p.median = d[opts.data_median_property_name] + (offset || 0);
                    p.quartile_top = d[opts.data_quartile_top_property_name] + (offset || 0);
                    p.top_whisker = d[opts.data_top_whisker_property_name] + (offset || 0);
                    

                    // All Whiskers are INTERACTABLE by default, but can be controlled, by 'opts.interactable_property' 
                    let interactable = true;
                    if( typeof d[opts.interactable_property] === 'boolean' )
                    {
                        interactable = d[opts.interactable_property];
                    }
                    p.interactable_whisker = interactable;
                   
                    p.impact = d.impact;
   
                    if (opts.data_sort_by_ranking)
                    {
                        p.ranking = d[opts.data_ranking_property_name];
                    }
                }
                else
                {
                    window._log.warn('set filtered to false for:' + d[opts.data_axis_y_banded_scale_property_name]);
                }
                
                return p;
            },
            function (p, d, nf) { // remove
                p.filtered = !nf;
                window._log.warn('__set filtered to '+ (!nf) +' for:' + d[opts.data_axis_y_banded_scale_property_name]);
                return p;
            },
            function () { // initial
                return {};
            }
        ).order(function(p) {
            
            if (!opts.data_sort_by_ranking)
            {
                return true;
            }
            
            if (opts.data_sort_by_ranking_reverse_order)
            {
                return -p.ranking;
            }
            else
            {
                return Math.abs(p.ranking);
            }
        });

        
        const onDragStart = function(e,data){
        };
        
        
        const onDragEnd = function(obj) {

            if(opts.drag_end_timer) { window.clearTimeout(opts.drag_end_timer); }
            
            // Handle event, after delay
            opts.drag_end_timer = window.setTimeout(function() {
 
                // Trigger any optimization events in other charts that share this data
                if (opts.event_namespace_optimization)
                {
                    $(window).trigger('optimization.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_optimization), obj);
                }

                opts.onDragEndCallback();
                
                opts.drag_end_timer = null;
                
            }.bind(this), opts.drag_end_timer_delay);
        };

        
        const bandedScaleItemClickCallback = function() {

            let d = d3.select(this).datum();
            let key = d.key || d;
            // because d3 event will be null when click originated on an axis tick as that's a delegated jquery event listener
            if (d3.event)
            { 
                d3.event.stopPropagation();
            }

            if (opts.event_namespace_for_external_filter_trigger)
            {
                d3.select(opts.container_id).select('[id*="' +  window.akdv.utils_string.base64IDFromString(key) + '"]').classed('selected', true);
                $(window).trigger('filter-change.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_for_external_filter_trigger), key);
            }

            if (opts.event_namespace_auto_scroll)
            {
                $(window).trigger('auto-scroll.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_auto_scroll), [window.akdv.utils_string.base64IDFromString(key), opts.container_id]);
            }
        };
        
        // Setup specified THRESHOLD lines
        var thresholdLines = [];
        if( $.type(opts.threshold_lines) === 'array' && opts.threshold_lines.length > 0) {
            
            opts.threshold_lines.forEach(function(thresh,i) {
                
                thresholdLines[i] = new D3ThresholdLine()
                    .chart_width($(opts.container_id).width())
                    .chart_height($(opts.container_id).height())
                    .linear_scale(axis_x_scale)
                    .transitions_enabled(true)
                    .group_container_id(thresh.group_container_id)
                    .line_height_element_selector_A(thresh.line_height_element_selector_A)
                    .line_height_element_selector_B(thresh.line_height_element_selector_B)
                    .line_position_property(thresh.line_position_property)
                    .group_css_class(thresh.group_css_class)
                    .label_display(thresh.label_display)
                    .label_container_id(thresh.label_container_id)
                    .label_css_class(thresh.label_css_class)
                    .label_text(thresh.label_text)
                    .label_offset(thresh.label_offset)
                    .line_group_opacity(thresh.line_group_opacity);
            });    
        }
        
        var boxWhisker = new window.D3BoxWhisker()
                .orientation('x')
                .muted_property(opts.box_whiskers_muted_property)
                .muted_property_truthy(false)
                .drag_enabled(opts.box_whiskers_drag_enabled)
                .drag_value_min(opts.box_whiskers_drag_value_min)
                .drag_value_min_padding(1.3)
                .slider_enabled(opts.box_whiskers_slider_enabled)
                .onDragEndCallback(onDragEnd)
                .onDragCancelAnnotations(opts.onDragCancelAnnotations)
                .onClickCallback(bandedScaleItemClickCallback)
                .onSliderDoubleClickCallback(opts.box_whiskers_slider_bouble_click_callback)
                
                .banded_scale(axis_y_scale)
                .linear_scale(axis_x_scale)
                .associated_axis_class('axis-x-bottom')
                .color_scale(axis_x_bottom_color_scale)
                .enforce_interactable_enabled(opts.enforce_box_whisker_interactable)
                .tooltips_enabled(false)
                .tooltips_to_fixed(0)
                .tooltips_postfix('ms');
        
        
        var checkbox;
        if (opts.show_checkboxes)
        {
            const checkDisabled = function(d){
         
                if( $.type(d) !== 'object' || $.type(d.value.impact) !== 'number' )
                {
                    return false;
                }
                else
                {
                    if(d.value.impact <= opts.checkboxes_disabled_threshold)
                    {
                        return true;
                    }
                }
            };
            
            checkbox = new D3AxisCheckbox()
                .orientation('y')
                .banded_scale(axis_y_scale)
                .element_class('asset-toggle')
                .checked(true)
                .data_property(opts.checkbox_data_property)
                .onClickCallback(opts.checkboxesClickCallback)
                .onClickElementSelectorIDs(['box-whisker-'])
                .onClickClassToToggle('muted')
                .disabled(checkDisabled);
        }

        // assign click listener for banded scale text
        $(document).on('click', '' + opts.axis_y_left_container_id + ' .tick', bandedScaleItemClickCallback);

        
        const calcChartHeight = function() {
            
            let chartHeight = 0;
            let subtractedHeight = 0;
            
            if( typeof opts.chart_min_height_element_selector === 'string' && opts.chart_min_height_element_selector.length !== 0 )
            {
                let El = d3.select(opts.chart_min_height_element_selector);
                
                if( El.node() instanceof SVGElement )
                {
                    chartHeight = El.node().getBBox();   
                }
                else 
                {
                    chartHeight = El.node().getBoundingClientRect();  
                }
            }
            else
            {
                chartHeight =  total_records * window.akdv.utils_css.remsToPixels(opts.box_height_rems);
            }
                       
            if( $.type(opts.chart_min_height_rems_adjustment) === 'number' )
            { 
                subtractedHeight = window.akdv.utils_css.remsToPixels(opts.chart_min_height_rems_adjustment); 
            }
            
            let containerHeight = chartHeight.height - subtractedHeight;
            let recordHeight = total_records * window.akdv.utils_css.remsToPixels(opts.box_height_rems);
            
            return Math.max(containerHeight, recordHeight);
        }

        
        const resizeChart = function(data_filtered) {
            
            //var box_height = window.akdv.utils_css.remsToPixels(opts.box_height_rems);
            const chart_height = calcChartHeight();
            const axis_y_left_container_w = $(opts.axis_y_left_container_id).width();
            const axis_y_right_container_w = $(opts.axis_y_right_container_id).width();
            const axis_y_container_h = total_records * window.akdv.utils_css.remsToPixels(opts.box_height_rems);  
            const axis_x_bottom_height = $(opts.axis_x_bottom_container_id).height() - (window.akdv.utils_css.remsToPixels(3) * ((opts.axis_x_bottom_slider_enabled) ? 1 : 0));
            const axis_x_bottom_linear_domain = window.populateLinearDomain(axis_x_max_value, opts.axis_x_bottom_step);
            const axis_x_bottom_final_color_range = window.populateColorRange(axis_x_bottom_linear_domain.length);
            const axis_x_bottom_gradient_bar_height = window.akdv.utils_css.remsToPixels(0.5);
            chart_width = $(opts.container_id).width();

            // Update viewBoxes
            chart_svg.attr('viewBox', '0 0 ' + chart_width + ' ' + chart_height);
            axis_y_left_svg.attr('viewBox', '0 0 ' + axis_y_left_container_w + ' ' + chart_height);
            axis_y_right_svg.attr('viewBox', '0 0 ' + axis_y_right_container_w + ' ' + chart_height);
            axis_x_bottom_svg.attr('viewBox', '0 0 ' + chart_width + ' ' + axis_x_bottom_height);
            
            // Resize MIN / MAX UI
            if (opts.show_min_max)
            {
                axis_x_min_max_svg.attr('viewBox', '0 0 ' + chart_width + ' ' + $(opts.axis_x_min_max_container_id).height() );
                axis_x_min_max_svg_g.attr('width', chart_width);
            }
            
            // set the scales and their ranges
            axis_x_scale.range([0, chart_width]).domain([0, axis_x_max_value]);
            
            axis_y_scale.range([0, axis_y_container_h]) // 
                .paddingInner(opts.row_padding_percent)
                .domain(data_filtered.map(function(d) { return d.key; }));
            
            axis_x_bottom_color_scale.range(axis_x_bottom_final_color_range).domain(axis_x_bottom_linear_domain);

            linear_gradient.selectAll('stop').remove();
            linear_gradient.selectAll('stop')
                .data(axis_x_bottom_final_color_range).enter()
                .append('stop')
                .attr('offset', function(d, i) { return i / (axis_x_bottom_final_color_range.length - 1); })
                .attr('stop-color', function(d) { return d; });

            let chartWidth = chart_width;
            let domainLength = axis_x_bottom_linear_domain.length;
            let remToPix = window.akdv.utils_css.remsToPixels(2.7);
            
            
            
            axis_x_bottom_svg_g
                    .attr('width', chart_width)
                    .attr('transform', 'translate(0, ' + ((opts.axis_x_bottom_slider_enabled) ? 0 : axis_x_bottom_gradient_bar_height * 1.75) + ')')
                    .transition().duration(800).ease(d3.easeCubicOut)
                    .call( d3.axisBottom(axis_x_scale)
                            .tickSize( window.akdv.utils_css.remsToPixels(0.3) )
                            .ticks( Math.min(axis_x_bottom_linear_domain.length, Math.floor(chart_width / window.akdv.utils_css.remsToPixels(2.7))) )
                    );

            axis_x_bottom_color_range_rect
                .attr('width', chart_width)
                .attr('height', axis_x_bottom_gradient_bar_height)
                .style('fill', 'url(' + opts.container_id + '-linear-gradient)')
                .attr('transform', 'translate(0, ' + ((opts.axis_x_bottom_slider_enabled) ? (axis_x_bottom_gradient_bar_height * -1.2) : (axis_x_bottom_gradient_bar_height * 0.5)) + ')');
            
   
            
            //Set vertical height for all bottom labels
            let axis_x_bottom_label_y = axis_x_bottom_height - window.akdv.utils_css.remsToPixels( opts.axis_x_bottom_label_vertical_offset || 0 );
            
            // Set Label position
            axis_x_bottom_label
                .attr('y', axis_x_bottom_label_y );
            
            // Set Sub-Label position
            if( $.type(opts.axis_x_bottom_label_sub_A_locale_obj) === 'object' )
            {
                const axisXBottomLabelBBox = axis_x_bottom_label.node().getBBox();
                axis_x_bottom_sub_label_A
                    .attr('x', axisXBottomLabelBBox.x + axisXBottomLabelBBox.width + window.akdv.utils_css.remsToPixels(0.2) )
                    .attr('y', axis_x_bottom_label_y );
            }
            
            // Set Sub-Label B position
            if( $.type(opts.axis_x_bottom_label_sub_B_locale_obj) === 'object' )
            {
                const axisXBottomSublabelBBox = axis_x_bottom_sub_label_A.node().getBBox();
                axis_x_bottom_sub_label_B
                    .attr('x', axisXBottomSublabelBBox.x + axisXBottomSublabelBBox.width + window.akdv.utils_css.remsToPixels(0.2) )
                    .attr('y', axis_x_bottom_label_y );
            }
            
            // Center the Group
            const axis_x_bottom_svg_BBox = axis_x_bottom_svg.node().getBBox();
            const axis_x_bottom_label_group_BBox = axis_x_bottom_label_group.node().getBBox();
            axis_x_bottom_label_group
                .attr('transform', 'translate(' + ((axis_x_bottom_svg_BBox.width / 2) - (axis_x_bottom_label_group_BBox.width / 2)) + ')' );

            
            axis_y_left_svg_g
                .attr('transform', 'translate(' + axis_y_left_container_w + ', ' + 0 + ')')
                .call(d3.axisLeft(axis_y_scale).tickFormat(function(d,i) {
                    
                    const txtGroup = this.parentNode;
                    const data = data_filtered[i].value;
                    
                    if( !this.getAttribute('data-vendor') )
                    {
                        // Add ALL the data on first hit
                        if( txtGroup.id.length === 0 )
                        {
                            //Create a UNIQUE id for this group
                            const newUUID = window.akdv.utils_string.generateUUID();
                            txtGroup.setAttribute('id', '' + newUUID );
                            
                            // Store a HASH of this assets URL, so we can find the same asset in other charts
                            const assetKey = window.akdv.utils_string.base64IDFromString(d);
                            txtGroup.setAttribute('data-asset-key', '' + assetKey );

                            // Store assets VENDOR string for display in Annotation
                            const vendor = data.vendor;
                            if( typeof vendor === 'string' )
                            {
                                txtGroup.setAttribute('data-asset-vendor', '' + vendor );
                            }
                            
                            // Store assets IMPACT number for display in Annotation
                            const impact = data.impact;
                            if( $.type(impact) === 'number' )
                            {
                                txtGroup.setAttribute('data-asset-impact', '' + impact );
                            }
                            
                            // Store assets MEDIAN load time int for display in Annotation
                            const median = data.median;
                            if( $.type(median) === 'number' )
                            {
                                txtGroup.setAttribute('data-asset-median', '' + median );
                            }
                            
                            // Store assets HITS int for display in Annotation
                            const hits = data.hits;
                            if( $.type(hits) === 'number' )
                            {
                                txtGroup.setAttribute('data-asset-hits', '' + hits );
                            }
                        }

                        let textData = data_filtered[i];
    
                        if( textData )
                        {
                            if( typeof textData.value.vendor === 'string' )
                            {
                                // TODO: This is specific to our current data, to make this chart re-usable, pass it in as config
                                this.setAttribute('data-vendor', textData.value.vendor );
                            }
                        }
                    }
                    else
                    {
                        // Update the IMPACT, MEDIAN and HITS data on subsequent displays
                        
                        // Store assets IMPACT number for display in Annotation
                        const impact = data.impact;
                        if( $.type(impact) === 'number' )
                        {
                            txtGroup.setAttribute('data-asset-impact', '' + impact );
                        }
                        
                        // Store assets MEDIAN load time int for display in Annotation
                        const median = data.median;
                        if( $.type(median) === 'number' )
                        {
                            txtGroup.setAttribute('data-asset-median', '' + median );
                        }
                        
                        // Store assets HITS int for display in Annotation
                        const hits = data.hits;
                        if( $.type(hits) === 'number' )
                        {
                            txtGroup.setAttribute('data-asset-hits', '' + hits );
                        }
                    }
                    
                    return d;
                }));

            axis_y_left_svg_g.selectAll('text')
                .attr('inline-size', axis_y_left_container_w - 30)
                .style('text-overflow','ellipsis');
            
           
            // Apply various data and formatting to the Left Axis
            let axisTextLabels = axis_y_left_svg_g.selectAll('text');

            if (opts.axis_y_left_compact_labels)
            {
                window.d3CompressTextLabel( axisTextLabels, true, true, 20, 'MIDDLE', false );
            }
            
            if(opts.axis_y_left_apply_vendor_color)
            {
                window.d3ApplyVendorColor( axisTextLabels, opts.vendor_colors, true, false );
            }
            
            if(opts.axis_y_left_add_vendor_icon)
            {
                window.d3AddVendorIconToText( axisTextLabels, opts.vendor_colors, 'endOfLine' );
            }
            
            if(opts.axis_y_left_add_matching_attr_highligher)
            {
                window.d3AddAxisTickMatchingAttrHighligher( axis_y_left_svg.node(), 'data-vendor', 'asset-vendor-match');
            }


            // RESIZE Y Axis Left Label
            if( typeof opts.axis_y_left_label_id === 'string' && opts.axis_y_left_label_id.length !== 0 )
            {
                // Left Y Axis Legend
                let axis_y_left_label_width = $(opts.axis_y_left_label_id).width();
                let axis_y_left_label_height = $(opts.axis_y_left_height_element_id).height();
                let axis_y_left_label_offset = axis_y_left_label_width * 0.8;
                
                axis_y_left_label_svg
                    .attr('viewBox', '0 0 ' + axis_y_left_label_width + ' ' + axis_y_left_label_height );
                
                axis_y_left_main_label
                    .attr('transform','translate(' + axis_y_left_label_offset + ' ' + axis_y_left_label_height +') rotate(-90 0 0) ');
                
                // Display a Left Y Axis Sub-Label, if text has been defined for it
                if( $.type(opts.axis_y_left_label_sub_locale_obj) === 'object' )
                {
                    axis_y_left_sub_label
                        .attr('transform','translate(' + axis_y_left_label_offset + ' ' + (axis_y_left_label_height - (axis_y_left_main_label.node().getBBox().width + window.akdv.utils_css.remsToPixels(0.3)) ) +') rotate(-90 0 0)');
                }
                
                // Now the Label and Sub-Label are defined, and a px size, offset their Group, to center them on the Y axis
                axis_y_left_label_svg_g
                    .attr('transform','translate(0 ' + -(axis_y_left_label_height - axis_y_left_label_svg_g.node().getBBox().height) * 0.5 + ')');
            }
            
        };


        const clearOptimizations = function() {

            chart_svg.selectAll('.box-whisker.changed').classed('changed', false);
        };


        const clearMuteToggles = function() {

            chart_svg.selectAll('.muted').classed('muted', false);
            axis_y_left_svg.selectAll('.muted').classed('muted', false);
            axis_y_right_svg.selectAll('.muted').classed('muted', false).attr('data-checked', true);
        };

        
        var drawChart = function(e,result) {
            
            if (!xf.size())
            {
                window._log.warn('drawChart requires data.');
                return;
            }

            statusNotifier.rendering();
            window.akdv.utils_event.dispatchCustomEvent(window, 'chart-render-start', 'akdv', { uuid: opts.uuid });

            // --- DATA //
            // grab the ordered array from xf load time group
            let data = xf_group.top(Infinity);
            let data_filtered = data.filter(function(d) { return d.value.median >= axis_x_bottom_filter_threshold && !d.value.filtered; });
            let max_top_standard_deviation = d3.max(data_filtered, function(d) { return d.value.top_whisker; }) || 1;
            let max_bottom_standard_deviation = d3.max(data_filtered, function(d) { return d.value.bottom_whisker; }) || 1;
            
            const overrideVal = opts.axis_x_bottom_domain_override_value;
            
            let maxVal;
            let mv;
            if( $.type(result) === 'object' && $.type(opts.threshold_lines) === 'array' && opts.threshold_lines.length )
            {
                mv = Math.max(
                    Math.max( opts.axis_x_bottom_minimum_max, Math.max( parseInt(result['orig_page_timer']), parseInt(result['page_timer']) ) ), 
                    Math.ceil(( d3.max(data, function(d) { return d.value.quartile_top; }) || 1) / opts.axis_x_bottom_step ) * opts.axis_x_bottom_step
                ); // round up to nearest defined quantization step
            }
            else
            {
                mv = Math.max(
                    opts.axis_x_bottom_minimum_max, 
                    Math.ceil(( d3.max(data, function(d) { return d.value.quartile_top; }) || 1) / opts.axis_x_bottom_step ) * opts.axis_x_bottom_step
                ); // round up to nearest defined quantization step
            }

            // Ensure maxVal exceeds maxVal by one tick step in size (stops threshold lines, reaching right hand side of chart....)
            maxVal = (mv - (mv % opts.axis_x_bottom_step)) + opts.axis_x_bottom_step;
            
            if( $.type(overrideVal) === 'number')
            {
                // If an override has been specified, we (potentially) use the resulting number here....
                if(opts.axis_x_bottom_domain_override_if_larger)
                {
                    // Only use it, if it is larger than the calculated value
                    axis_x_max_value = Math.max( maxVal, overrideVal );
                }
                else
                {
                    axis_x_max_value = overrideVal;
                }
            }
            else
            {
                axis_x_max_value = maxVal;
            }
            
            total_records = data_filtered.length;
            
            // --- VIEWBOX & AXES LAYOUT //
            resizeChart(data_filtered);
            // --- DOM //
            
            // Position MIN / MAX UI Elements
            if (opts.show_min_max)
            {
                axis_x_min_max_svg.attr('viewBox', '0 0 ' + chart_width + ' ' + $(opts.axis_x_min_max_container_id).height() );
                min_max_rect
                    .attr('y', $(opts.axis_x_min_max_container_id).height() - window.akdv.utils_css.remsToPixels(0.5))
                    .attr('height', window.akdv.utils_css.remsToPixels(0.5))
                    .transition().duration(900).ease(d3.easeCubicOut)
                    .style('fill', axis_x_bottom_color_scale(max_top_standard_deviation))
                    .attr('x', axis_x_scale(max_bottom_standard_deviation))
                    .attr('width', axis_x_scale(max_top_standard_deviation) - axis_x_scale(max_bottom_standard_deviation));
                min_text
                    .style('text-anchor', 'end')
                    .transition().duration(900).ease(d3.easeCubicOut)
                    .attr('x', axis_x_scale(max_bottom_standard_deviation))
                    .attr('y', $(opts.axis_x_min_max_container_id).height() - window.akdv.utils_css.remsToPixels(0.75));
                max_text
                    .style('text-anchor', 'start')
                    .transition().duration(900).ease(d3.easeCubicOut)
                    .attr('x', axis_x_scale(max_top_standard_deviation))
                    .attr('y', $(opts.axis_x_min_max_container_id).height() - window.akdv.utils_css.remsToPixels(0.75));
                min_line
                    .transition().duration(900).ease(d3.easeCubicOut)
                    .attr('y1', 0)
                    .attr('y2', $(opts.container_id).height())
                    .attr('x1', axis_x_scale(max_bottom_standard_deviation))
                    .attr('x2', axis_x_scale(max_bottom_standard_deviation));
                max_line
                    .transition().duration(900).ease(d3.easeCubicOut)
                    .attr('y1', 0)
                    .attr('y2', $(opts.container_id).height())
                    .attr('x1', axis_x_scale(max_top_standard_deviation))
                    .attr('x2', axis_x_scale(max_top_standard_deviation));
            }
            
            if (opts.show_checkboxes)
            {
                let axis_y_right_checkboxes = axis_y_right_svg_g.selectAll('.asset-toggle').data(data_filtered);
                axis_y_right_checkboxes.exit().remove();
                axis_y_right_checkboxes.enter().call(checkbox.checked(true));
                axis_y_right_svg_g.selectAll('.asset-toggle').call(checkbox.update);
            }

            boxWhisker
                .chart_width(chart_width)
                .max_linear_scale_value(axis_x_max_value)
                .transitions_enabled(!(e && e.type === 'resize'));
            
            let box_whiskers = chart_svg_g.selectAll('.box-whisker').data(data_filtered);
            box_whiskers.exit().remove();
            box_whiskers.enter().call( boxWhisker );
            chart_svg_g.selectAll('.box-whisker').call(boxWhisker.update);

            if (opts.simple_scroll_bar_enabled && !opts.simple_bar_added)
            {
                opts.simple_bar_added = window.akdv.utils_dom.addSimpleScrollbar( opts.container_id, opts );
            }
            statusNotifier.done();
            window.akdv.utils_event.dispatchCustomEvent(window, 'chart-render-complete', 'akdv', { uuid: opts.uuid });
        };


        
        const updateThresholdLines = function(data) {

            thresholdLines.forEach(function(thresholdLine,i){
                thresholdLine
                    .chart_width($(opts.container_id).width())
                    .chart_height($(opts.container_id).height())
                    .linear_scale(axis_x_scale);
                
                thresholdLine.update(data);
            })
        };
        
        
        const updateData = function(e, result) {

            if (!result || !result.data)
            {
                window._log.warn('update chart triggered without data');
                return;
            }

            if ( window.akdv.validate.objectsInArrayHaveRequiredKeys(result.data, required_data_keys) === false )
            {
                throw 'ERROR : RESULT DATA ENTRY MISSING ONE OR MORE OF REQUIRED KEYS: ' + required_data_keys.join(',');
            }

            const doUpdateData = function() {
                
                if( typeof opts.axis_x_bottom_domain_override_property === 'string' && $.type(result[opts.axis_x_bottom_domain_override_property]) === 'number' )
                {
                    var mult = opts.axis_x_bottom_domain_override_multiplier || 1;                         
                    opts.axis_x_bottom_domain_override_value = result[opts.axis_x_bottom_domain_override_property] * mult;  
                }
                
                // Empty out any existing data already in the crossfilter
                if (xf.size())
                {
                    xf.remove();
                }
                
                // Populate the crossfilter
                xf.add(result.data);
                
                // Show the chart has DATA!
                if( typeof opts.chart_container_id === 'string' && opts.chart_container_id.length !== 0 )
                {
                    $(opts.chart_container_id).removeClass('no-data');
                }
                
                if( xf.size() > 300 )
                {
                    statusNotifier.setInfo({ title: window.akdv.utils_lang.getLocalizedHTMLString('Analyzing', 'AKDV.Status') });
                    window.requestAnimationFrame( () => { 
                        window.requestAnimationFrame( () => { 
                            drawChart(e,result);
                            statusNotifier.done();
                        } ); 
                    });
                }
                else
                {
                    drawChart(e,result);
                }
                    
                if( $.type(result['Page_Group']) !== 'undefined' )
                {
                    updateMainChartTitle(result);
                }
                
                updateThresholdLines(result);  
            };
            
            
            // Apply a delay to doing the data update, to stop the following drawChart, blocking the processor
            if( opts.delay_updateData )
            {    
                if(opts.delay_updateData_DeBounce !== null)
                {
                    window._log.debug('De-boucing updateData()');
                    clearTimeout(opts.delay_updateData_DeBounce);
                }
                
                opts.delay_updateData_DeBounce = window.setTimeout(function() {
                    opts.delay_updateData_DeBounce = null;
                    doUpdateData();
                }, opts.delay_updateData );
            }
            else
            {
                doUpdateData();
            }
        };


        
        
        
        
        // ====================== Events  ==========================
        
        // An auto scroll event will be triggered when a user clicks on an item in a chart.
        // All clickable chart objects are assigned a base64 encoded version of the key of the data
        // they represent and on click this is sent as the data in the triggered auto scroll event 
        // in order to scroll into view items whose id includes a matching base64 encoded key.
        const onAutoScrollEvent = function(e, base64_string_of_data_key, src_container_id) {
            
            // Do not react to Events THIS chart has triggered
            if (opts.container_id === src_container_id)
            {
                return;
            } 

            var sourceEl;
            if( d3.event === null )
            {
                sourceEl = e.currentTarget;
            }
            else
            {
                sourceEl = d3.event.currentTarget;
            }

            let assetKey = '.tick[data-asset-key=' + base64_string_of_data_key + ']';
            let matchingAssetTicks = $(opts.container_id).parent().find(assetKey).toArray();

            if( matchingAssetTicks.length )
            {
                window.akdv.utils.scrollSVGChartElementIntoView(sourceEl, matchingAssetTicks[0] ); 
                let group = $(opts.container_id).parent().find(opts.auto_scroll_container_selector).get(0);
                window.akdv.utils.addClassAndRemoveAfterDuration( group , [assetKey], 'animated-pulse-opacity-medium', 2250 );
            }
        };


        const onFilterChangeAxisXBottomThreshold = function(e, threshold_value) {

            const onFilterChangeAxisXBottomThreshold = function(){
                
                clearMuteToggles();
                axis_x_bottom_filter_threshold = Math.max(0, threshold_value * axis_x_max_value * opts.axis_x_bottom_slider_mult);
                
                drawChart(e);
            };

            // Apply a delay to doing the data update, to stop the following drawChart, blocking the processor
            if( opts.delay_updateData )
            {
                if(opts.delay_onFilterChangeAxisXBottomThreshold_DeBounce !== null)
                {
                    window._log.debug('De-boucing onFilterChangeAxisXBottomThreshold()');
                    clearTimeout(opts.delay_onFilterChangeAxisXBottomThreshold_DeBounce);
                }
                
                window.setTimeout(function() {
                    opts.delay_onFilterChangeAxisXBottomThreshold_DeBounce = null;
                    onFilterChangeAxisXBottomThreshold();
                }, opts.delay_updateData );
            }
            else
            {
                onFilterChangeAxisXBottomThreshold();
            }
        };


        const getCurrentExternalFilter = function() {

            return $(opts.container_id).attr('data-' + opts.event_namespace_for_external_filter_listener + '-filter')
        };


        const setCurrentExternalFilter = function(_filter_by_key) {

            $(opts.container_id).attr('data-' + opts.event_namespace_for_external_filter_listener + '-filter', _filter_by_key || null);
        };

        
        const onFilterChangeExternalDimension = function(e, _data) {

            const doFilterChangeExternalDimension = function(){
                
                if( $.type(_data) === 'object' && typeof _data.key === 'string' && _data.key.length !== 0)
                {
                    // the dimension will only be filtered by other charts triggering an event for this chart
                    external_dimension_filter.filter(_data.key);
                    setCurrentExternalFilter(_data.key);
                    xfFilterName = _data.key;  
                }
                else
                {
                    // clear filters
                    external_dimension_filter.filterAll();
                    setCurrentExternalFilter(undefined);
                    xfFilterName = '';
                }

                drawChart(e);
            };

            
            // Apply a delay to doing the data update, to stop the following drawChart, blocking the processor
            if( opts.delay_updateData ) {
                             
                if( opts.delay_onFilterChangeExternalDimension_DeBounce !== null )
                {
                    window._log.debug('De-bouncing doFilterChangeExternalDimension()');
                    clearTimeout(opts.delay_onFilterChangeExternalDimension_DeBounce);
                }
                
                opts.delay_onFilterChangeExternalDimension_DeBounce = window.setTimeout(function(){
                    opts.delay_onFilterChangeExternalDimension_DeBounce = null;
                    doFilterChangeExternalDimension();
                }, opts.delay_updateData );
            }
            else
            {
                doFilterChangeExternalDimension();
            }
        };

        
        const onOptimizationEvent = function(e, obj) {
            
            let prev_filter = getCurrentExternalFilter();
            let data = $.extend(true, [], xf.all());
 
            opts.dataOptimizationFunction(data,obj);

            external_dimension_filter.filterAll();

            xf.remove();
            xf.add(data);

            onFilterChangeExternalDimension(null, prev_filter);
        };


        
        
        
        // ====================== EVENT LISTENERS ============================

        if (opts.axis_x_bottom_slider_enabled)
        {
            $(opts.axis_x_bottom_slider_id).on('change', function(e) {
                
                // Update the Annotation
                window.akdv.utils_event.dispatchCustomEvent(window, 'show-component', opts.event_namespace_for_slider_annotation_listener, [ e, { e } ]);
                
                // Re-draw the chart
                $(window).trigger('filter-change.median-threshold', (d3.select(this).property('value') || 0));
            });
        }

        if (typeof opts.dataOptimizationFunction === 'function')
        { 
            $(window).on('optimization.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_optimization), onOptimizationEvent);
        }

        if (opts.event_namespace_auto_scroll)
        {
            $(window).on('auto-scroll.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_auto_scroll), onAutoScrollEvent);
        }

        
        // Filter Assets
        if (opts.event_namespace_for_external_filter_listener)
        {
            $(window).on('filter-change.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_for_external_filter_listener), onFilterChangeExternalDimension);
        }

        // Complete chart data, modified, refresh chart
        if (opts.event_namespace_for_modified_data)
        {
            $(window).on('result.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_for_modified_data), updateData);
        }

        
        // Data updated
        if (opts.event_namespace_chart_data_update)
        {
            $(window).on('result.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_chart_data_update), updateData);
        }


        $(window).on('filter-change.median-threshold', onFilterChangeAxisXBottomThreshold);
        $(window).on('resize-charts.akdv', drawChart);

        
        // Exposed Chart Methods
        const chartMethods = function() {
            
            let methods = {};

            methods.axis_x_max_value = function() {
                    return axis_x_max_value;
            };
            
            return methods;
        };
    
        return chartMethods();
    };


}(
        window, 
        document, 
        window.jQuery, 
        window.d3, 
        window.crossfilter, 
        window.D3AxisCheckbox, 
        window.D3BoxWhisker, 
        window.D3ThresholdLine,
        window.akdv.utils_css,
        window.akdv.utils_lang.addLocalizedString,
        window.akdv.statusNotifier
        ));