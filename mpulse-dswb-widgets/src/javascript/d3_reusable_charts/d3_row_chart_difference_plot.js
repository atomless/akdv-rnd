;(function(
        window,
        document,
        $,
        d3,
        crossfilter,
        D3Bar,
        D3BoxDifference,
        SimpleScrollbar,
        addLocalizedString,
        statusNotifier
        ) {

    'use strict';

    /**
     * Requires data of the form:
     * data = [
     * {
          "page_group": "Pick Of The Week", // banded y axis
          "conversion_impact": -0.0006800683908205199, // linear x axis (bottom)
          "load_time": 845, // linear x axis (top) pre optimization
          "load_time_b": 453 // linear x axis (top) post optimization
        },...
     * ]
     */

    var defaults = {
        event_namespace_chart_data_update : '',
        event_namespace_for_modified_data : null,
        
        event_namespace_optimization : false,
        event_namespace_auto_scroll : false,
        event_namespace_for_external_filter_trigger : false,
        event_namespace_for_external_filter_listener : false,
        event_namespace_for_row_annotation_listener : false,
        event_namespace_for_slider_annotation_listener : false,
        
        bars_selectable : false,                                                        // Should the Bars of this chart, have an effect, onClick
        bars_selectableFunc : false,                                                    // Allow a Bars Select-ability to be controlled via a function
        dataOptimizationFunction : false,
        
        timing_metric: '',
        impact_criteria: '',
        bar_tooltip: null,
        
        data_axis_y_property_name : false, // REQUIRED
        data_axis_x_bottom_property_name : false, // REQUIRED
        data_axis_x_top_property_a_name : false, // REQUIRED
        data_axis_x_top_property_b_name : false, // REQUIRED
        
        data_external_dimension_property_name : false,
        data_external_dimension_property_is_array_of_keys : false,
        hide_filtered : false,

        original_data_prefix : '',
        
        container_id : '#box-difference',
        chart_container_id : '', 
        axis_y_left_container_id : '#box-difference-axis-y-left',
        axis_x_bottom_container_id : '#box-difference-axis-x-bottom',
        axis_x_bottom_description_container_id : '#bottom-axis-explanation',
        axis_x_top_container_id : '#box-difference-axis-x-top',

        auto_scroll_container_class : '',
        
        axis_y_compact_labels : true,
        axis_y_left_label_id : '',
        axis_y_left_height_element_id : '',
        axis_y_left_label_locale_obj : null,
        axis_y_left_label_sub_locale_obj : null,
                
        axis_x_bottom_label_text : null,
        axis_x_bottom_label_vertical_offset : null,
        axis_x_bottom_max_value_is_relative : true,
        axis_x_bottom_tick_stop_percentages_array : [0, 0.25, 0.5, 0.75, 1],
        axis_x_bottom_center_tick_labels : true,
        
        axis_x_top_label_text : '',
        axis_x_top_label_sub_text_A : '',
        axis_x_top_label_sub_text_B : '',
        
        axis_x_top_padding_bottom_rems : 0.25,
        axis_x_top_gradient_bar_height_rems : 0.5,
        axis_x_top_step : 1200,                                                         // Defines what is deemed to be a red value for loadtime, if 250 then 250ms load time will be blue, 500ms load time will be cyan and so on

        axis_x_bottom_slider_enabled : false,                                           // Should the Bottom X Impact threshold slider be shown?
        linear_scale_bottom_threshold_slider_id : '#bottom-axis-slider',
        axis_x_bottom_slider_initial_value : null,                                      // Slider defaults to value of 0, this can be changed for init here....
        
        axis_x_bottom_min_value : 0,
        axis_x_bottom_max_value : 1,
        axis_x_bottom_slider_mult : 0.01,
        
        row_height_rems : 2.65,                                                         // chart Row (bars) height
        row_padding_percent : 0.2,                                                      // Spacing between rows, as percentage of Row Height
        
        color_scale_bottom : false,
        linear_axis_descriptive_ticks : [],
        
        simple_bar_added : false,
        simple_scroll_bar_enabled : true,
        autoHide :  true,
        
        delay_updateData : 16,
        
        onChartClick : null
    };


    window.getD3RowChartDifferencePlot = function(_opts) {

        const opts = $.extend({ uuid: window.akdv.utils_string.generateUUID() }, defaults, _opts);
        let originalResult;
        let ranDelay = 3000;
        
        opts.axis_x_bottom_tick_stop_differences_array = window.akdv.utils_data.getDifferenceArrayFromNumericalArray(opts.axis_x_bottom_tick_stop_percentages_array);

        d3.select(opts.container_id).attr('data-hide-filtered', opts.hide_filtered);

        const required_data_keys = [
            opts.data_axis_y_property_name, 
            opts.data_axis_x_bottom_property_name, 
            opts.data_axis_x_top_property_a_name, 
            opts.data_axis_x_top_property_b_name || opts.data_axis_x_top_property_a_name
        ];

        let axis_x_top_max_value = 0,
            chart_width,
            total_records = 0,
            slider_threshold = 0,
            banded_scale = d3.scaleBand(),
            linear_scale_bottom = d3.scaleLinear(),
            linear_scale_top = d3.scaleLinear(),
            color_scale = d3.scaleLinear();

        // init crossfilter, pg dimension and shared group
        const xf = crossfilter({});
        
        const onBandedScaleItemClick = function() {

            // Stop the Click action, if the entire Chart, or just this BAR is non-selectable
            if( opts.bars_selectable === false || $(this).hasClass('non-selectable') )
            {
                return;
            }
            
            // because d3 event will be null when click originated on an axis tick as that's a delegated jquery event listener
            if (d3.event)
            { 
                d3.event.stopPropagation();
            }
            
            const d = d3.select(this).datum();
            const key = d.key || d;
             
            // Clear selected from all Bars, and then set THIS to selected
            $(this).parents('svg').find('rect.bar').removeClass('selected');
            $(this).addClass('selected');
            
            if (opts.event_namespace_for_external_filter_trigger)
            {
                const filterObj = { 'key': key };
                $(window).trigger('filter-change.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_for_external_filter_trigger), filterObj);
            }

            if (opts.event_namespace_for_external_result_trigger)
            {
                const data = opts.data_accessor_function_for_external_result_trigger(
                    xf.all(), 
                    opts.data_external_dimension_property_name, 
                    key
                );
                
                $(window).trigger('result.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_for_external_result_trigger), data );
            }

            if (opts.event_namespace_auto_scroll)
            {
                $(window).trigger('auto-scroll.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_auto_scroll), [window.akdv.utils_string.base64IDFromString(key), opts.container_id]);
            }
        };
        
        
        const onChartClick = function() {
            
            // Clears the Page-Group selection, when the user clicks on the charts background
            d3.event.stopPropagation();
            
            if( $.type(opts.onChartClick) === 'function' )
            {
                opts.onChartClick();
            }
            
            return;
        };
  
        
        const trans_delay_min = 100;
        const trans_delay_max = 300;
        const trans_duration_min = 500;
        const trans_duration_total = 900;
        
        const bar = new D3Bar()
            .hide_filtered(opts.hide_filtered)
            .selectable(opts.bars_selectable)
            .selectableFunc(opts.bars_selectableFunc)
            .onClickCallback(onBandedScaleItemClick)
            .linear_property(opts.data_axis_x_bottom_property_name)
            .linear_scale(linear_scale_bottom)
            .associated_axis_class('axis-x-bottom')
            .banded_scale(banded_scale)
            .orientation('x')
            .transition_delay_min(trans_delay_min)                          // min amount of delay before transition starts
            .transition_delay_max(trans_delay_max)                          // max amount of delay before transition starts
            .transition_duration_min(trans_duration_min)                    // min time in MS for a single transition to complete
            .transition_duration_total(trans_duration_total)                // total time in MS before ALL transitions complete
            .bar_tooltip(opts.bar_tooltip);

        const boxDiff = new D3BoxDifference()
            .hide_filtered(opts.hide_filtered)
            .linear_scale(linear_scale_top)
            .linear_property_a(opts.data_axis_x_top_property_a_name)
            .linear_property_b(opts.data_axis_x_top_property_b_name || opts.data_axis_x_top_property_a_name)
            .associated_axis_class('axis-x-top')
            .banded_scale(banded_scale)
            .color_scale(color_scale)
            .orientation('x')
            .transition_delay_min(trans_delay_min * 1.2)                    // min amount of delay before transition starts
            .transition_delay_max(trans_delay_max * 1.2)                    // max amount of delay before transition starts
            .transition_duration_min(trans_duration_min * 1.2)              // min time in MS for a single transition to complete
            .transition_duration_total(trans_duration_total * 1.2)          // total time in MS before ALL transitions complete
            .tooltips_enabled(false)
            .tooltips_to_fixed(0)
            .tooltips_prefix('Page-Load : ')
            .tooltips_postfix('ms');
        

        // populate the dom with the base svg and group
        const chart_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.container_id)
            .on('click', onChartClick);
        
        const chart_svg_g = chart_svg.append('g')
            .attr('class', 'inner-chart');
        
        
        $( chart_svg_g.node() ).on( "mouseenter", "rect.bar", function( e ) {

            if( opts.event_namespace_for_row_annotation_listener )
            {
                const data = d3.select(e.currentTarget).datum();
                const pos = {
                        'boundingRect': e.currentTarget.getBoundingClientRect(),
                        'x': e.clientX, 
                        'y': e.clientY     
                };
                
                window.akdv.utils_event.dispatchCustomEvent(window, 'show-component', opts.event_namespace_for_row_annotation_listener, [ e, { e, pos, data } ]);  
            }  
        });
        
        
        $( chart_svg_g.node() ).on( "mouseleave", "rect.bar", function( e ) {
            
            if( opts.event_namespace_for_row_annotation_listener )
            {
                window.akdv.utils_event.dispatchCustomEvent(window, 'hide-component', opts.event_namespace_for_row_annotation_listener);  
            } 
        });
        
        
        const axis_x_top_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.axis_x_top_container_id);
        
        const axis_x_top_svg_g = axis_x_top_svg
            .attr('class','axis-labels')
            .append('g')
            .attr('class', 'axis axis-x-top');
       
        
        // Create Top X Axis Label Group
        const axis_x_top_label_group = axis_x_top_svg
            .append('g')
            .attr('class','axis-labels-group');
        
        // Create Top X Axis Label
        const axis_x_top_label = axis_x_top_label_group
            .append('text')
            .attr('class', 'label axis-label x')
            .style('text-anchor','start')
            .attr('x', '0')
            //.text( opts.axis_x_top_label_text );
            .text(function(d) { return addLocalizedString(this, opts.axis_x_top_label_text.key, opts.axis_x_top_label_text.namespace); });
        
        // Create Top X Axis Sub-Label A
        const axis_x_top_sub_label_A = axis_x_top_label_group
            .append('text')
            .attr('class', 'sub-label x a')
            .style('text-anchor','start')
            .attr('x', '0')
            .text(function(d) { return addLocalizedString(this, opts.axis_x_top_label_sub_text_A.key, opts.axis_x_top_label_sub_text_A.namespace); });
        
        // Create Top X Axis Sub-Label B
        const axis_x_top_sub_label_B = axis_x_top_label_group
            .append('text')
            .attr('class', 'sub-label x b')
            .style('text-anchor','start')
            .attr('x', '0')
            .text(function(d) { return addLocalizedString(this, opts.axis_x_top_label_sub_text_B.key, opts.axis_x_top_label_sub_text_B.namespace); });
        
        
        const defs = axis_x_top_svg.append('defs');
        
        const linear_gradient = window.d3AppendLinearGradient(defs, opts.container_id);
        
        const axis_x_top_color_range_rect = axis_x_top_svg
            .append('rect')
            .style('fill', 'url(' + opts.container_id + '-linear-gradient)');
        
        const axis_x_bottom_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.axis_x_bottom_container_id);
        
        const axis_x_bottom_svg_g = axis_x_bottom_svg
            .attr('class','axis-labels')
            .append('g')
            .attr('class', 'axis axis-x-bottom axis-labels');
        
        const axis_x_bottom_label = axis_x_bottom_svg
            .append('text')
                .attr('class', 'label axis-label x')
                .attr('x', '50%')
                .text( function(d,i) { return addLocalizedString(this, opts.axis_x_bottom_label_text.key, opts.axis_x_bottom_label_text.namespace); } );
        
        const axis_y_left_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.axis_y_left_container_id);
        
        const axis_y_left_svg_g = axis_y_left_svg
                .append('g')
                .attr('class', 'axis axis-y-left');

        
        let axis_y_left_label_svg;
        let axis_y_left_label_svg_g
        let axis_y_left_main_label;
        let axis_y_left_sub_label;
        
        // ADD Y Axis Left Label
        if( $.type(opts.axis_y_left_label_id) === 'string' && opts.axis_y_left_label_id.length !== 0 )
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
                axis_y_left_sub_label = axis_y_left_label_svg_g
	                .append('text')
	                .attr('class','sub-label y')
	                .style('text-anchor','start')
	                .text( function(d,i) { return addLocalizedString(this, opts.axis_y_left_label_sub_locale_obj.key, opts.axis_y_left_label_sub_locale_obj.namespace); } ) 
	                .attr('transform','translate(0 0) rotate(-90 0 0) ');
            }
            
            // If a 'axis_x_bottom_slider_initial_value' value has been defined, set the X-Impact threshold slider, to this value
            if( $.type(opts.axis_x_bottom_slider_initial_value) === 'number' )
            {
                $(opts.linear_scale_bottom_threshold_slider_id).val(opts.axis_x_bottom_slider_initial_value);
            }
        }

        
        const external_dimension_filter = xf.dimension(function(d) { 

            const need_to_split = (opts.data_external_dimension_property_is_array_of_keys && !Array.isArray(d[opts.data_external_dimension_property_name]));
            return (need_to_split) ? d[opts.data_external_dimension_property_name].split(',') : d[opts.data_external_dimension_property_name];
            
        }, opts.data_external_dimension_property_is_array_of_keys);

        
        const top_and_bottom_x_dimension_by_left_y_dimension_group = xf.dimension(function(d) { return d[opts.data_axis_y_property_name]; }).group().reduce(
            function (p, d, nf) { 
                
                // ADD properties
                
                // Is this Page-Group CURRENTLY selected
                if( $.type(d.selected) === 'boolean' )
                {
                    p.selected = d.selected;
                }
                else
                {
                    p.selected = null;
                }
                
                // Is this Page-Group filtered out
                if( $.type(d.filtered) === 'boolean' )
                {
                    p.filtered = d.filtered;
                }
                else
                {
                    p.filtered = null;
                }
                
                // Can this Page-Group be selected
                if( $.type(d.selectable) === 'boolean' )
                {
                    p.selectable = d.selectable;
                }
                else
                {
                    p.selectable = null;
                }
                
                if (nf)
                {
                    // only set props when adding not when filtering
                    p[opts.data_axis_x_bottom_property_name] = Math.abs(d[opts.data_axis_x_bottom_property_name]);
                    p[opts.data_axis_x_top_property_a_name] = d[opts.data_axis_x_top_property_a_name];
                    p[opts.data_axis_x_top_property_b_name] = d[opts.data_axis_x_top_property_b_name] || d[opts.data_axis_x_top_property_a_name];
                }
                
                return p;
            },
            function (p, d, nf) {
                
                // Remove
                p.filtered = !nf;
                
                return p
            },
            function () {
                
                // Initial
                return {};
            }
        ).order(function(p) { return p[opts.data_axis_x_bottom_property_name]; });

        
        // assign click listener for banded scale text
        $(document).on('click', '' + opts.axis_y_left_container_id + ' .tick', onBandedScaleItemClick);

        
        // always called from drawChart() -  resizes axes and scales 
        const resizeChart = function(filtered_data) {

            let box_height = window.akdv.utils_css.remsToPixels(opts.row_height_rems),
            slider_height = window.akdv.utils_css.remsToPixels(opts.axis_x_bottom_slider_height_rems),
            axis_y_left_container_w = $(opts.axis_y_left_container_id).width(),
            axis_y_container_h = total_records * box_height,
            axis_x_top_height = $(opts.axis_x_top_container_id).height(),
            axis_x_bottom_height = $(opts.axis_x_bottom_container_id).height() - (window.akdv.utils_css.remsToPixels(3) * ((opts.axis_x_bottom_slider_enabled)? 1 : 0)),
            axis_x_top_linear_domain = window.populateLinearDomain(axis_x_top_max_value, opts.axis_x_top_step),
            axis_x_top_color_range = window.populateColorRange(axis_x_top_linear_domain.length),
            axis_x_top_gradient_bar_height = window.akdv.utils_css.remsToPixels(opts.axis_x_top_gradient_bar_height_rems),
            axis_x_top_y = ($(opts.axis_x_top_container_id).height() - (axis_x_top_gradient_bar_height + window.akdv.utils_css.remsToPixels(opts.axis_x_top_padding_bottom_rems)));

            chart_width = $(opts.container_id).width();
            if (chart_width <= 0) {
                return;
            }
            
            // Update viewBoxes
            chart_svg.attr('viewBox', '0 0 ' + chart_width + ' ' + axis_y_container_h);
            axis_x_top_svg.attr('viewBox', '0 0 ' + chart_width + ' ' + axis_x_top_height);
            axis_x_bottom_svg.attr('viewBox', '0 0 ' + chart_width + ' ' + axis_x_bottom_height);
            axis_y_left_svg.attr('viewBox', '0 0 ' + axis_y_left_container_w + ' ' + axis_y_container_h);
            
            // set/update the scales and their ranges
            color_scale.range(axis_x_top_color_range).domain(axis_x_top_linear_domain);
            linear_scale_bottom.range([0, chart_width]).domain([opts.axis_x_bottom_min_value, opts.axis_x_bottom_max_value]);
            linear_scale_top.range([0, chart_width]).domain([0, axis_x_top_max_value]);
            banded_scale.range([0, axis_y_container_h]).paddingInner(opts.row_padding_percent).domain(filtered_data.map(function(d) { return d.key; }));

            linear_gradient.selectAll('stop').remove();
            linear_gradient.selectAll('stop').data(axis_x_top_color_range).enter()
                .append('stop')
                .attr('offset', function(d, i) { return i / (axis_x_top_color_range.length - 1); })
                .attr('stop-color', function(d) { return d; });

            axis_y_left_svg_g
                .attr('transform', 'translate(' + axis_y_left_container_w + ', ' + 0 + ')')
                .call( d3.axisLeft(banded_scale).tickFormat(function(d, i) {

                    this.parentNode
                        .setAttribute('id', window.akdv.utils_string.snakeToKebabCase(opts.data_axis_y_property_name) + window.akdv.utils_string.base64IDFromString(d));
                    
                    // Ensure label is flagged as non-selectable
                    d3.select(this.parentNode).classed('non-selectable', filtered_data[i].value.selectable === false );
                    
                    d3.select(this.parentNode).classed('filtered', filtered_data[i].value.filtered );
                    
                    return d;
                }));
            

            // Trim the Axis labels down to their end file-names, and provide full URL as a ToolTip
            if (opts.axis_y_compact_labels)
            {
                window.d3CompressTextLabel(axis_y_left_svg_g.selectAll('text'), false, true, 18, 'MIDDLE', false);
            }

            axis_x_bottom_svg_g
                .attr('width', chart_width)
                .transition().duration(600).ease(d3.easeCubicOut)
                .call(  d3.axisBottom(linear_scale_bottom)
                        .tickSize( window.akdv.utils_css.remsToPixels(0.3) )
                        .tickValues(opts.axis_x_bottom_tick_stop_percentages_array.map(function(pcnt) { return opts.axis_x_bottom_max_value * pcnt; }))
                        .tickFormat(function(d,i) {
                            if( opts.linear_axis_descriptive_ticks[i] === null)
                            {
                                return '';
                            }
                            else
                            {
                                return addLocalizedString(this, opts.linear_axis_descriptive_ticks[i].key, opts.linear_axis_descriptive_ticks[i].namespace);
                            }
                        })      
                );
            
            if (opts.axis_x_bottom_center_tick_labels)
            {
                // As the bottom x axis labels describe ranges rather than point values transform labels to mid way between ticks
                axis_x_bottom_svg_g.selectAll('text').attr('transform', function(d, i) { 
                    // Note: being ranges the first text element will be empty but we translate that anyway.
                    // And as there will always be one less in the diff array than the original percentages array we subtract 1 from i.
                    return 'translate(-' + (opts.axis_x_bottom_tick_stop_differences_array[Math.max(0, i - 1)] * chart_width * 0.5) + ', 0)'; 
                });
            }

            // AXIS X Bottom Label
            axis_x_bottom_label
                .attr('y', axis_x_bottom_height - window.akdv.utils_css.remsToPixels( opts.axis_x_bottom_label_vertical_offset || 0 ) );
            
            axis_x_top_svg_g
                .attr('width', chart_width)
                .attr('transform', function(d) { return 'translate(0, ' + (axis_x_top_y - window.akdv.utils_css.remsToPixels(opts.axis_x_top_padding_bottom_rems)) + ')'; })
                .transition().duration(600).ease(d3.easeCubicOut)
                .call(d3.axisTop(linear_scale_top)
                        .ticks(Math.min(axis_x_top_linear_domain.length, Math.floor(chart_width / window.akdv.utils_css.remsToPixels(4)))));
            
            axis_x_top_color_range_rect
                .attr('width', chart_width)
                .attr('height', axis_x_top_gradient_bar_height)
                .style('fill', 'url(' + opts.container_id + '-linear-gradient)')
                .attr('transform', 'translate(0, ' + axis_x_top_y + ')');

            // Layout the top X-Axis label TEXT elements
            const axisLabelHeight = window.akdv.utils_css.remsToPixels(0.3);
            axis_x_top_label
                .attr('y', axisLabelHeight );
            
            // Time division
            const axis_x_top_label_BBox = axis_x_top_label.node().getBBox();
            axis_x_top_sub_label_A
                .attr('x', axis_x_top_label_BBox.x + axis_x_top_label_BBox.width + window.akdv.utils_css.remsToPixels(0.15) )
                .attr('y', axisLabelHeight );
            
            // Metric Name 
            const axis_x_top_sub_label_A_BBox = axis_x_top_sub_label_A.node().getBBox();
            axis_x_top_sub_label_B
                .attr('x', axis_x_top_sub_label_A_BBox.x + axis_x_top_sub_label_A_BBox.width + window.akdv.utils_css.remsToPixels(0.3) )
                .attr('y', axisLabelHeight );
            
            // Center the Group
            const axis_x_top_svg_BBox = axis_x_top_svg.node().getBBox();
            const axis_x_top_label_group_BBox = axis_x_top_label_group.node().getBBox();
            
            axis_x_top_label_group
                .attr('transform', 'translate(' + ((axis_x_top_svg_BBox.width / 2) - (axis_x_top_label_group_BBox.width / 2)) + ')' );
            
            
            // RESIZE Y Axis Left Label
            if( $.type(opts.axis_y_left_label_id) === 'string' && opts.axis_y_left_label_id.length !== 0 )
            {
                // Left Y Axis Legend
                const axis_y_left_label_width = $(opts.axis_y_left_label_id).width();
                const axis_y_left_label_height = $(opts.axis_y_left_height_element_id).height();
                const axis_y_left_label_offset = axis_y_left_label_width * 0.8;
                
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


        var drawChart = function(e) {

            if (!xf.size())
            {
                window._log.warn('drawCharts requires data.');
                return;
            }

            window.akdv.utils_event.dispatchCustomEvent(window, 'chart-render-start', 'akdv', { uuid: opts.uuid });

            // grab the ordered array from the populated group then filter it by the current threshold
            const data = top_and_bottom_x_dimension_by_left_y_dimension_group.top(Infinity);
            const data_filtered = data.filter(function(d) { return d.value[opts.data_axis_x_bottom_property_name] >= slider_threshold });
            
            axis_x_top_max_value = Math.ceil((d3.max(data_filtered, function(d) {
                return Math.max(d.value[opts.data_axis_x_top_property_a_name], d.value[opts.data_axis_x_top_property_b_name]); 
                }) || 1) / 1000) * 1000;
            
            if (opts.axis_x_bottom_max_value_is_relative)
            {
                opts.axis_x_bottom_max_value = d3.max(data, function(d) { return d.value[opts.data_axis_x_bottom_property_name]; });
            }
            
            total_records = data_filtered.length;

            resizeChart(data_filtered);

            // update bar chart
            const bars = chart_svg_g.selectAll('.bar').data(data_filtered);
            bar.transitions_enabled(!(e && e.type === 'resize'));
            bars.exit().remove();
            bars.enter().call(bar);
            
            chart_svg_g.selectAll('.bar').call(bar.update);
            
            // update diff boxes
            const box_diffs = chart_svg_g.selectAll('.box-difference').data(data_filtered);
            
            boxDiff.chart_width(chart_width).transitions_enabled(!(e && e.type === 'resize'));
            box_diffs.exit().remove();
            box_diffs.enter().call(boxDiff);
            chart_svg_g.selectAll('.box-difference').call(boxDiff.update);

            // add simpleBar (y scroll bar) to chart if not already added
            if (opts.simple_scroll_bar_enabled && !opts.simple_bar_added)
            {
                opts.simple_bar_added = window.akdv.utils_dom.addSimpleScrollbar( opts.container_id, opts );
            }

            statusNotifier.done();
            window.akdv.utils_event.dispatchCustomEvent(window, 'chart-render-complete', 'akdv', { uuid: opts.uuid });
        };


        const doUpdateData = function(result) {
     
            // empty out any existing data already in the crossfilter
            if (xf.size())
            {
                if( result.hasOwnProperty('reset_resource_modifications') && result.reset_resource_modifications === true )
                {
                    xf.remove( d => true ); // Ensure ALL Page Groups data is wiped
                    result.reset_resource_modifications = false;
                }
                else
                {
                    xf.remove();
                }
            }
            
            // populate the crossfilter
            xf.add(result.data);

            // Show the chart has DATA!
            if( $.type(opts.chart_container_id) === 'string' && opts.chart_container_id.length !== 0 )
            {
                $(opts.chart_container_id).removeClass('no-data');
            }
            if (xf.size()) {
                drawChart();
            }
        };
        
        const updateData = function(e, result) {
            
            if (!result || !result.data)
            {
                window._log.warn('update chart triggered without data');
                return;
            }
 
            const valid = window.akdv.validate.objectsInArrayHaveRequiredKeys(result.data, required_data_keys);

            if (!valid)
            { 
                throw 'ERROR : RESULT DATA ENTRY MISSING ONE OR MORE OF REQUIRED KEYS: ' + required_data_keys.join(',');
            }

            // Apply a delay to doing the data update, to stop the following drawChart, blocking the processor
            if( opts.delay_updateData )
            {
                window.setTimeout(function() {
                    doUpdateData(result);
                }, opts.delay_updateData );
            }
            else
            {
                doUpdateData();
            }
        };


        // An auto scroll event will be triggered when a user clicks on an item in a chart.
        // All clickable chart objects are assigned a base64 encoded version of the key of the data
        // they represent and on click this is sent as the data in the triggered auto scroll event 
        // in order to scroll into view items whose id includes a matching base64 encoded key.
        const onAutoScrollEvent = function(e, base64_string_of_data_key, src_container_id) {
            
            if (opts.container_id === src_container_id)
            { 
                return;
            }

            let sourceEl;
            if( d3.event === null )
            {
                sourceEl = e.currentTarget;
            }
            else
            {
                sourceEl = d3.event.currentTarget;
            }

            const matchingAssetTicks = $(opts.container_id).parent().find('#' + base64_string_of_data_key).toArray();

            if( matchingAssetTicks.length )
            {
                window.akdv.utils.scrollSVGChartElementIntoView(sourceEl, matchingAssetTicks[0] ); 
                const group = $(opts.container_id).parent().find(opts.auto_scroll_container_selector).get(0);
                window.akdv.utils.addClassAndRemoveAfterDuration( group , ['#' + base64_string_of_data_key], 'animated-pulse-opacity-medium', 2250 );
            }
        };


        const getCurrentExternalFilter = function() {
            return $(opts.container_id).attr('data-' + opts.event_namespace_for_external_filter_listener + '-filter')
        };


        const setCurrentExternalFilter = function(_filter_by_key) {
            $(opts.container_id).attr('data-' + opts.event_namespace_for_external_filter_listener + '-filter', _filter_by_key || null);
        };


        const onFilterChangeExternalDimension = function(e, _data) {

            const doFilterChangeExternalDimension = function() {
                
                let keyDefined = false;
                
                if( $.type(_data) === 'object' && $.type(_data.key) === 'string' && _data.key.length !== 0 )
                {
                    keyDefined = true;
                }

                if (keyDefined)
                {
                    // the page group dimension will only be filtered by other charts triggering an event for this chart
                    external_dimension_filter.filter(_data.key);
                    setCurrentExternalFilter(_data.key);  
                }
                else
                {
                    // clear filters
                    external_dimension_filter.filterAll();
                    setCurrentExternalFilter(undefined);
                }
                
                drawChart();
            };
            
            
            // Apply a delay to doing the data update, to stop the following drawChart, blocking the processor
            if( opts.delay_updateData )
            { 
                window.setTimeout(function() {
                    doFilterChangeExternalDimension();
                }, opts.delay_updateData );
            }
            else
            {
                doFilterChangeExternalDimension();
            }
        }
        
        
        const onOptimizationEvent = function(e, obj) {
            
            const prev_filter = getCurrentExternalFilter();
            const data = $.extend(true, [], xf.all());
            
            opts.dataOptimizationFunction(data,obj);

            external_dimension_filter.filterAll();

            xf.remove();
            xf.add(data);
            
            onFilterChangeExternalDimension(null, { key : prev_filter} );
          
            // Sends out ALL data, for charts which require this
            if (opts.event_namespace_for_modified_data_trigger)
            {
                $(window).trigger('result.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_for_modified_data_trigger), { data : data } );
            }
            
            // Trigger an event, that makes client charts update
            if (opts.event_namespace_for_external_result_trigger && obj.key)
            {
                const optimizedData = opts.data_accessor_function_for_external_result_trigger(
                    xf.all(), 
                    opts.data_external_dimension_property_name, 
                    obj.group_key
                );
                 
                $(window).trigger('result.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_for_external_result_trigger), optimizedData );
            }
        };

        
        if (opts.axis_x_bottom_slider_enabled && opts.event_namespace_for_slider_annotation_listener)
        {        
            $(opts.linear_scale_bottom_threshold_slider_id).on('change', function(e) {
                
                const pos = {
                        'boundingRect': e.currentTarget.getBoundingClientRect(),
                        'x': e.clientX, 
                        'y': e.clientY     
                };
                
                const sliderVal = $(e.currentTarget).val() * 1;
                slider_threshold = Math.max(opts.axis_x_bottom_min_value, opts.axis_x_bottom_max_value * (sliderVal || 0) * opts.axis_x_bottom_slider_mult); 
                
                window.akdv.utils_event.dispatchCustomEvent(window, 'show-component', opts.event_namespace_for_slider_annotation_listener, [ e, { e, pos } ]); 
                
                drawChart();
            });  
        }

        if (opts.event_namespace_for_external_filter_listener)
        {
            $(window).on('filter-change.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_for_external_filter_listener), onFilterChangeExternalDimension);
        }

        if (opts.event_namespace_auto_scroll)
        {
            $(window).on('auto-scroll.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_auto_scroll), onAutoScrollEvent);
        }

        if (typeof opts.dataOptimizationFunction === 'function' && opts.event_namespace_optimization)
        {
            $(window).on('optimization.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_optimization), onOptimizationEvent);
        }

        
        // Update the chart, if the data is modified in some way
        if(opts.event_namespace_for_modified_data)
        {
            $(window).on('result.' + opts.event_namespace_for_modified_data, updateData);
        }

        $(window).on('result.' + opts.event_namespace_chart_data_update, updateData);
        $(window).on('resize-charts.akdv', drawChart);

        // Exposed Chart Methods
        const chartMethods = function() {
                
                const methods = {};

                methods.timing_metric = function(str) {
                    if( $.type(str) === 'string' )
                    {
                        opts.timing_metric = str;
                    }
                    
                    if( $.type(str) === 'undefined' )
                    {
                        return opts.timing_metric;
                    }
                };

                methods.impact_criteria = function(str) {
                    if( $.type(str) === 'string' )
                    {
                        opts.impact_criteria = str;
                    }
                    
                    if( $.type(str) === 'undefined' )
                    {
                        return opts.impact_criteria;
                    }
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
    window.D3Bar, 
    window.D3BoxDifference, 
    window.SimpleScrollbar,
    window.akdv.utils_lang.addLocalizedString,
    window.akdv.statusNotifier
));