;(function(window, document, $, d3, crossfilter, D3StackedArea, lang_utils, event_utils, string_utils, statusNotifier) {

    'use strict';

    /**
     * Requires Data of the form :
     * (key mapping can be overridden using opts)
     * IMPORTANT : the values for the area plot MUST range from 0 to 1.
     * data = [
     * {
          "host":"www.grainger.com",
          "path":"/category/safety/ecatalog/N-bit/Ntt-Paper",
          "hits":83,
          "min_start":0,
          "median_start":0,
          "values":[
              1,1,0.927,0.771,0.433,0.289,0.253,0.24,0.192,0.132,0.072,0.06,0.036,0.024,0.024,0.024,0.024,0.024,0.024,0.024,0.024,0.024,0.024,0.024,0.024,0.024,0.024,0.024,0.012,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
          ]
        },
        ...
     * ];
     *
     * Median, quartiles and second standard deviations are all pre-calculated.
     * The data property names can be overwritten in the options.
     */
    const defaults = {
        event_namespace_chart_data_update : 'aggregate-waterfall', // This string, must match a 'chart_group' in the JSON data
        event_namespace_optimization : false,
        event_namespace_auto_scroll : false,
        event_namespace_banded_scale_item_select : false,
        event_namespace_for_external_filter_trigger : false,
        banded_scale_item_select_enabled : false, // enables user to select an item along the banded scale and trigger a filter event on that dimension
        dataOptimizationFunction : false,

        container_id : '#aggregate-waterfall',
        wrapper_element : false,

        axis_y_left_container_id : '#aggregate-waterfall-axis-y-left',
        axis_y_left_compact_labels : true,

        axis_y_right_container_id : '#aggregate-waterfall-axis-y-right',
        axis_y_right_compact_labels : true,

        axis_x_bottom_container_id : '#aggregate-waterfall-axis-x-bottom',
        axis_x_bottom_label_text : '',
        axis_x_bottom_unit_of_measurement : 'ms',
        axis_x_bottom_step : 20, 
        axis_x_bottom_minimum_max : 100,
        axis_x_bottom_enable_annotations : false,

        row_height_rems : 4, // determines chart row height
        row_height_rems_unstacked : 0.75,
        row_padding_percent : 0.0, // floating point percent of scale bandwidth to insert inner padding to each data_axis_y_banded_scale_property_name
        row_overlap_percent : 1.25, // floating point percent of row height the max point on area plots should extend relative to the row height

        simple_bar_added : false,
        simple_scroll_bar_enabled : true,
        simple_scroll_bar_auto_hide : true,

        data_external_dimension_property_name : false, // dimension on which external filter events can be applied
        data_current_external_dimension_filters_array : false,
        data_axis_y_banded_scale_property_name : 'host',
        data_axis_y_banded_scale_unstacked_property_name : 'path',
        data_axis_x_property_name : 'median_start',
        data_area_values_array_property_name : 'values',
        data_area_opacity_property_name : false,
        data_area_opacity_ratio_property_name : false,
        data_ranking_property_name : false, // What property (NUMBER) show the rows be sorted by
        data_sort_by_ranking : true, // Should the data rows be sorted by a value before plotting
        data_sort_by_ranking_reverse_order : false, // Should the data sort be reversed
        data_dimension_for_color_scale_property_name : false,
        data_additional_properties_to_copy : [],
        dimension_for_color_scale_property_values_to_color_scale_mappings : false, /* eg : {
            'html' : 'hsl(215, 95%, 75%)',
            'script' : 'hsl(32, 98%, 76%)',
            'css' : 'hsl(99, 67%, 75%)',
            'text' : ' hsl(54, 98%, 76%)',
            'image' : 'hsl(272, 63%, 76%)',
            'flash' : 'hsl(184, 62%, 47%)',
            'font' : ' hsl(6, 100%, 62%)',
            'video' : 'hsl(168, 71%, 45%)',
            'xhr' : 'hsl(196, 85%, 75%)',
            'other' : 'hsl(0, 0%, 77%)'
        }*/

        data_meta_axis_x_bottom_label_supplimental_text_property_name : 'pageloadtime',
        data_meta_opacity_divisor_property_name : 'pageviews',

        data_axis_x_annotations_property_name : 'page_timings',
        data_axis_x_annotations_value_property_name : 'time',
        data_axis_x_annotations_label_property_name : 'label',
        data_axis_x_annotations : [], // [{ value: <numerical_value_in_axis_x_scale_range>, label: 'foo' }...]

        fn_to_add_missing_external_dimension_property : d => d,

        annotation_templates : {
            area_point_note_title : window.akdv.utils_string.stringLiteralTemplate`${0} (${1}%) resources loading at ${2}% of ${3}`,
            area_point_note_label : window.akdv.utils_string.stringLiteralTemplate`AVG LOAD TIME: ${0}, AVG SIZE: ${1}, CACHE-HIT RATE: ${2}`,
        },
        annotations_for_area_point_note_min_value : 1,

        meta : {},

        timer: 'Page Load Time'
    };


    window.getWaterfallStackedAreaPlot = function(_opts) {
      
        var opts = $.extend({ uuid: string_utils.generateUUID() }, defaults, _opts);
        var required_data_keys = [
            opts.data_axis_y_banded_scale_property_name,
            opts.data_axis_x_property_name,
            opts.data_area_opacity_property_name,
            opts.data_ranking_property_name
        ];
        opts.wrapper_element = opts.wrapper_element || window.akdv.utils_dom.getNearestParentElementWithClass(d3.select(opts.container_id).node(), 'chart-grid');

        var scroll_offset = 0,
            simple_bar_recalc_timeout = false,
            d3_annotation_for_stacked_area = false,
            chart_height = 0,
            chart_visible_height = 0,
            chart_width = 0;
        // set the scales and their ranges
        var axis_x_scale = d3.scaleLinear();
        var axis_y_scale_for_area_plots = d3.scaleLinear().domain([1, 0]);
        var axis_y_banded_scale = d3.scaleBand();
        var axis_y_banded_scale_unstacked = d3.scaleBand();
        var area_fill_color_scale = window.getD3ColorScaleFromPropertyToColorMappingsObject(opts.dimension_for_color_scale_property_values_to_color_scale_mappings);
        // populate the dom wiuth the base svg roots
        var container_el = document.querySelector(opts.container_id);
        var axis_y_left_container_el = document.querySelector(opts.axis_y_left_container_id);
        var axis_y_right_container_el = document.querySelector(opts.axis_y_right_container_id);
        var chart_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.container_id);
        var axis_x_bottom_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.axis_x_bottom_container_id);
        var axis_y_left_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.axis_y_left_container_id);
        var axis_y_right_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.axis_y_right_container_id);
        // append group elements inside each svg root
        var chart_svg_g = chart_svg.append('g').attr('class', 'inner-chart');
        var axis_x_bottom_svg_g = axis_x_bottom_svg.append('g').attr('class', 'axis axis-x-bottom');
        var axis_y_left_svg_g = axis_y_left_svg.append('g').attr('class', 'axis axis-y-left');
        var axis_y_right_svg_g = axis_y_right_svg.append('g').attr('class', 'axis axis-y-right');
        var axis_x_bottom_label = axis_x_bottom_svg.append('text')
            .attr('class', 'label axis-x-label')
            .attr('x', '50%')
            .style('text-anchor', 'middle')
            .text(opts.axis_x_bottom_label_text);

        axis_y_left_svg_g.append('text')
            .attr('class', 'axis-y-left-selected-unstacked-item-stacked-text invisible')
            .style('text-anchor', 'end')
            .attr('x', 0)
            .attr('y', 0);
        axis_y_right_svg_g.append('text')
            .attr('class', 'axis-y-right-selected-stacked-item-unstacked-text invisible')
            .style('text-anchor', 'start')
            .attr('x', 0)
            .attr('y', 0);

        // init crossfilter, pg dimension and shared group
        var xf = crossfilter({});
        var external_dimension_filter = false;
        var axis_y_left_filter_dimension = xf.dimension(function(d) { return d.key; });
        var stacked_keys_obj_with_unstacked_key_arrays = {};
        if (opts.event_namespace_for_external_filter_trigger && opts.data_external_dimension_property_name) {
            external_dimension_filter = xf.dimension(function(d) { return d[opts.data_external_dimension_property_name]; });
        }


        var stackedArea = new window.D3StackedArea()
            .orientation('x')
            .color_scale(area_fill_color_scale)
            .data_color_coding_property_name(opts.data_dimension_for_color_scale_property_name)
            .banded_scale(axis_y_banded_scale)
            .banded_scale_unstacked(axis_y_banded_scale_unstacked)
            .linear_scale_x(axis_x_scale)
            .linear_scale_y(axis_y_scale_for_area_plots);


        var getIsBandedScaleItemSelected = function() {

            return opts.wrapper_element && opts.wrapper_element.classList && opts.wrapper_element.classList.contains('banded-scale-item-selected');
        };


        var getIsComparison = function() {

            return opts.wrapper_element && opts.wrapper_element.classList && opts.wrapper_element.classList.contains('is-comparison');
        };


        var getScrollOffset = function() {

            return $(opts.container_id).parents('.ss-content').scrollTop() || 0;
        };


        var togglePinningOfBandedScaleItem = function(unstacked_key, pin) {

            let text_elements_selection = d3.selectAll(`[class$="tick-${window.akdv.utils_string.base64IDFromString(unstacked_key)}"] text`);
            if (pin) {

                let container_width = axis_y_right_svg.attr('viewBox').split(' ')[2];

                text_elements_selection.each(function(d) {

                    let txt_el = d3.select(this);
                    txt_el.text(d.split('/').slice(-1).join('')); 
                    let computed_width = txt_el.node().getComputedTextLength();

                    if (computed_width > (container_width - 30)) {
                        txt_el.attr('x', window.akdv.utils_css.remsToPixels(0.65) - (computed_width - (container_width - 30)));
                    }
                });

            } else {
                text_elements_selection.attr('x', window.akdv.utils_css.remsToPixels(0.65));
                text_elements_selection.each(function(d) {

                    d3.select(this).text(this.getAttribute('data-full-text').split('/').slice(-1).join(''));
                    window.akdv.utils_dom.ellipsizeDOMNodeTextElement(this); 
                });
            }

            window.togglePrependToClassListOfSelection(d3.selectAll(`[class$="${window.akdv.utils_string.base64IDFromString(unstacked_key)}"]`), 'pinned');
        };


        var onBandedScaleItemMouseOut = function(e) {

            d3.select(opts.axis_y_left_container_id).attr('data-last-mouse-y-index', -1);
            d3.select(opts.wrapper_element).selectAll('.over').classed('over', false);
            chart_svg_g.selectAll('.stacked-area-annotation').classed('invisible', true);
            chart_svg_g.selectAll('.stacked-area-line-annotation').classed('invisible', true);
            axis_y_right_svg_g.selectAll('.axis-y-right-selected-stacked-item-unstacked-text').classed('invisible', true);
            axis_y_left_svg_g.selectAll('.axis-y-left-selected-unstacked-item-stacked-text').classed('invisible', true);
        };


        var onBandedScaleItemClick = function(e) {

            e.stopPropagation();

            let d = d3.select(e.currentTarget).datum();
            let key = d.key || d;
            let unstacked_key = d.unstacked_key || d;

            if (getIsBandedScaleItemSelected()) {
                let toggle = d3.select(e.currentTarget).classed('pinned');
                togglePinningOfBandedScaleItem(unstacked_key, !toggle);
                return;
            }

            onBandedScaleItemMouseOut();

            scroll_offset = getScrollOffset();
            
            if (opts.event_namespace_banded_scale_item_select) {
                $(window).trigger('filter-change.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_banded_scale_item_select), [key, stacked_keys_obj_with_unstacked_key_arrays[key].length]);
            }

            if (opts.event_namespace_auto_scroll) {
                $(window).trigger('auto-scroll.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_auto_scroll), [window.akdv.utils_string.base64IDFromString(key), opts.container_id]);
            }

            axis_y_right_svg_g.select('.axis-y-right-selected-stacked-item-unstacked-text').classed('invisible', true);
            axis_y_left_svg_g.select('.axis-y-left-selected-unstacked-item-stacked-text').classed('invisible', true);
        };


        var onBandedScaleItemMouseOver = function(e) {

            let el = d3.select(e.currentTarget);
            let tick_or_area = (el.classed('tick'))? 'tick' : 'area';
            let d = el.datum();
            let stacked = !getIsBandedScaleItemSelected();
            let k = (d.key)? ((stacked)? d.key : d.unstacked_key) : d;
            let banded_scale_item_id = window.akdv.utils_string.base64IDFromString(k);
            let selector = '[class$="' + banded_scale_item_id + '"]';
            var stacked_area;

            window.prependToClassListOfSelection(d3.select(opts.wrapper_element).selectAll((tick_or_area !== 'tick')? '.tick' + selector : selector), 'over');
            window.prependToClassListOfSelection(d3.select(opts.wrapper_element).selectAll('.is-comparison.stacked-area-' + banded_scale_item_id), 'over');

            if (stacked && d.unstacked_key) {
                stacked_area = chart_svg_g.select(`#stacked-area-${window.akdv.utils_string.base64IDFromString(d.unstacked_key)}.stacked-area-${window.akdv.utils_string.base64IDFromString(d.key)}`);

                let text = axis_y_right_svg_g.select('.axis-y-right-selected-stacked-item-unstacked-text');
                text.attr('dy', 0)
                    .attr('y', Math.round(axis_y_banded_scale(d.key)))
                    .attr('x', window.akdv.utils_css.remsToPixels(0.65))
                    .text(d.unstacked_key)
                    .classed('invisible', false);
                if (opts.axis_y_right_compact_labels) {
                    window.akdv.utils_dom.ellipsizeListOfDOMNodeTextElements(text.nodes());
                }
            }
            if (!stacked) {
                stacked_area = chart_svg_g.select('#stacked-area-' + window.akdv.utils_string.base64IDFromString(d.unstacked_key || d));

                axis_y_left_svg_g.select('.axis-y-left-selected-unstacked-item-stacked-text')
                    .text(((stacked_area && stacked_area.size() > 0)? stacked_area.attr('data-path') : '') + '/')
                    .attr('dy', 0)
                    .attr('y', Math.round(axis_y_banded_scale_unstacked(k)))
                    .classed('invisible', false);

                if (opts.axis_y_left_compact_labels) {
                    window.akdv.utils_dom.ellipsizeListOfDOMNodeTextElements(axis_y_left_svg_g.select('.axis-y-left-selected-unstacked-item-stacked-text').nodes(), 'START');
                }
            }

            if (stacked_area && stacked_area.size() > 0 && !stacked_area.classed('filtered-out') && !el.classed('is-comparison')) {
                let t = window.akdv.utils_css.getTransformationObjectFromTransformAttributeString(stacked_area.attr('transform'));

                chart_svg_g.select('.stacked-area-line-annotation')
                    .classed('invisible', false)
                    .classed('over', (tick_or_area !== 'area'))
                    .datum(stacked_area.datum().values)
                    .attr('transform', 'translate(' + t.translate_x + ', ' + t.translate_y +')')
                    .attr('d', d3.line()
                        .curve(d3.curveLinear)
                        .y(function(d) { return Math.round(axis_y_scale_for_area_plots(d)); })
                        .x(function(d, i) { return axis_x_scale(i); })
                    );
            }
        };


        var onStackedAreaMouseMove = function(e) {

            let el = d3.select(e.currentTarget);
            let d = el.datum();
            let stacked = !getIsBandedScaleItemSelected();
            let left_or_right = (e.offsetX < chart_width * 0.5)? 'left' : 'right';
            let p = d.values[Math.round(axis_x_scale.invert(e.offsetX))];
            let dx = window.akdv.utils_css.remsToPixels(2);

            scroll_offset = getScrollOffset();

            if (p <= 0 || e.currentTarget.classList.contains('filtered-out')) {
                chart_svg_g.select('.stacked-area-annotation').classed('invisible', true);
                return;
            }

            d3_annotation_for_stacked_area.annotations().forEach(function(annot, i) {
                
                annot.x = e.offsetX; 
                annot.y = (stacked)
                        ? axis_y_banded_scale(d.key) + axis_y_scale_for_area_plots(p)
                        : axis_y_banded_scale_unstacked(d.unstacked_key) + axis_y_scale_for_area_plots(p);

                let relative_y = annot.y - scroll_offset;

                annot.dx = (left_or_right === 'right')? -dx : dx;
                annot.dy = (relative_y < 50)
                         ? 50 - relative_y 
                         : ((relative_y > chart_visible_height - 50)
                             ? chart_visible_height - 50 - relative_y 
                             : (p < 0.3)
                                 ? (0.3 - p) * -150 
                                 : 0);

                let display_p = Math.round(p * 100);

                display_p = (display_p < 1)? 'Less than ' + opts.annotations_for_area_point_note_min_value : display_p;

                let note_label_template = opts.annotation_templates.area_point_note_label;

                annot.note = {
                    title : opts.annotation_templates.area_point_note_title.with(
                        string_utils.getFormattedNumber(d.hits * p,0),
                        display_p,
                        Math.round(axis_x_scale.invert(annot.x)),
                        opts.timer
                    ),
                    label : note_label_template.with(
                        string_utils.getFormattedNumber(d.load_time,0)+'ms',

                        (d.avg_transfer_size > 0 ? string_utils.getFormattedNumber(d.avg_transfer_size / 1000,1)+'kB' : 'N/A'),
                        string_utils.getFormattedNumber(d[opts.data_area_opacity_ratio_property_name] * 100,1) + '%'
                    ),
                    wrap : chart_width * 0.385,
                    padding : 0,
                    orientation : 'leftRight',
                    align : 'dynamic'
                };
            });

            d3.select('.stacked-area-annotation').attr('data-orientation-x', left_or_right);
            d3_annotation_for_stacked_area.updateText();
            d3_annotation_for_stacked_area.update();

            let t = window.akdv.utils_css.getTransformationObjectFromTransformAttributeString(chart_svg_g.select('.stacked-area-annotation').select('.annotation-note-content').attr('transform'));

            chart_svg_g.select('.stacked-area-annotation').classed('invisible', false).select('.annotation-note-content').attr('transform', 'translate(' + (t.translate_x + (left_or_right === 'left'? dx * 0.075 : dx * -0.075 )) + ', -' + window.akdv.utils_css.remsToPixels(1.3) + ')');
        };


        var onAxisXBottomAnnotationMouseOverOrClick = function(e) {
                    
            let d = d3.select(e.currentTarget).datum();
            let main_chart_axis_x_bottom_annotations = chart_svg_g.selectAll('.axis-x-bottom-annotations');
            let x_val = d[opts.data_axis_x_annotations_value_property_name];
            x_val = Array.isArray(x_val)? x_val : [x_val];
            let x = axis_x_scale(x_val[0] * 100);
            scroll_offset = getScrollOffset();

            main_chart_axis_x_bottom_annotations.selectAll('[class*="' + window.akdv.utils_string.base64IDFromString(d[opts.data_axis_x_annotations_label_property_name]) + '"]')
                .classed('over', true);

            main_chart_axis_x_bottom_annotations.selectAll('g[class*="threshold-label-g-' + window.akdv.utils_string.base64IDFromString(d[opts.data_axis_x_annotations_label_property_name]) + '"]')
                .attr('transform', 'translate(' 
                      + (x - ((x > chart_width)? window.akdv.utils_css.remsToPixels(0.3) : -window.akdv.utils_css.remsToPixels(0.75)))
                      + ', ' 
                      + (chart_visible_height + scroll_offset - 30) + ')');
        };


        var onAxisXBottomAnnotationMouseOut = function(e) {

            let d = d3.select(e.currentTarget).datum();
            chart_svg_g.selectAll('[class*="' + window.akdv.utils_string.base64IDFromString(d[opts.data_axis_x_annotations_label_property_name]) + '"]')
                .classed('over', false);
        };


        var onAxisYLeftUnstackedViewMouseMove = function(e) {

            if (!getIsBandedScaleItemSelected()) {
                return false;
            }

            let last_mouse_y_index = parseInt(e.currentTarget.getAttribute('data-last-mouse-y-index'));
            let y = (e.originalEvent.layerY || e.offsetY)
                  - window.akdv.utils_css.remsToPixels(opts.row_height_rems - 0.5
                  + opts.row_height_rems * opts.row_overlap_percent);
            let index = Math.round(Math.max(0.1, y) / axis_y_banded_scale_unstacked.bandwidth());

            if (y < 0) {
                onBandedScaleItemMouseOut();
                e.currentTarget.setAttribute('data-last-mouse-y-index', -1);
                return;
            }

            if (index !== last_mouse_y_index) {
                onBandedScaleItemMouseOut();
                if (index >= 0 && index < axis_y_banded_scale_unstacked.domain().length) {
                    $(d3.select(opts.axis_y_right_container_id + ' .tick-' + window.akdv.utils_string.base64IDFromString(axis_y_banded_scale_unstacked.domain()[index])).node()).trigger('mouseover');
                }
                e.currentTarget.setAttribute('data-last-mouse-y-index', index);
            }
        };


        var resizeChart = function(data_filtered) {
            
            window.clearTimeout(simple_bar_recalc_timeout);

            let unstacked = getIsBandedScaleItemSelected();

            let data_unstacked = (opts.data_sort_by_ranking)
                ? $.extend([], data_filtered).sort(window.firstBy(function(v) { return v.ranking; }))
                : $.extend([], data_filtered);
            // unfiltered stacked data is required in order to have the axis left y scale maintain a consistent
            // domain so that the stacked areas when redrawn in unstacked view can start from their stacked positions
            let data_stacked = (opts.data_sort_by_ranking)
                ? $.extend([], xf.all()).sort(window.firstBy(function(v) { return v.ranking; }))
                : $.extend([], xf.all());

            let axis_x_max_value = Math.max(
                opts.axis_x_bottom_minimum_max, 
                Math.ceil(
                    (d3.max(
                        (unstacked)? data_unstacked : data_stacked, 
                        function(d) { return d.values.length - 1; }
                        ) || 1
                    )
                )
            );

            let row_height = window.akdv.utils_css.remsToPixels(opts.row_height_rems);
            let row_height_unstacked = window.akdv.utils_css.remsToPixels(opts.row_height_rems_unstacked);
            let row_overlap = row_height * opts.row_overlap_percent;
            let axis_y_left_container_w = $(opts.axis_y_left_container_id).width();
            let axis_y_right_container_w = $(opts.axis_y_right_container_id).width();
            let min_height = $(opts.axis_y_left_container_id).parents('.scrollable-y').height();
            let axis_y_banded_scale_domain_unstacked = data_unstacked.reduce(function(p, d) { if (p.indexOf(d.unstacked_key) < 0) { p.push(d.unstacked_key); } return p; }, []);
            let axis_y_banded_scale_domain = data_stacked.reduce(function(p, d) { if (p.indexOf(d.key) < 0) { p.push(d.key); } return p; }, []);
            let axis_y_container_h = (unstacked)
                ? axis_y_banded_scale_domain_unstacked.length *  row_height_unstacked 
                : axis_y_banded_scale_domain.length * row_height;
            let axis_x_bottom_height = $(opts.axis_x_bottom_container_id).height();      
            let axis_x_bottom_linear_domain = window.populateLinearDomain(axis_x_max_value, opts.axis_x_bottom_step);
            // get updated chart sizes
            scroll_offset = getScrollOffset();
            chart_width = $(opts.container_id).width();
            chart_height = Math.max(min_height, (axis_y_container_h + row_overlap * 1.65));
            chart_visible_height = $(opts.container_id).parents('.scrollable-y').height();
            // set/update viewBoxes
            chart_svg.attr('viewBox', '0 0 ' + chart_width + ' ' + chart_height);
            axis_y_left_svg.attr('viewBox', '0 0 ' + axis_y_left_container_w + ' ' + chart_height);
            axis_y_right_svg.attr('viewBox', '0 0 ' + axis_y_right_container_w + ' ' + chart_height);
            axis_x_bottom_svg.attr('viewBox', '0 0 ' + chart_width + ' ' + axis_x_bottom_height);
            // for IE11
            if (window.akdv.utils_env.isIE11()) {
                container_el.parentNode.setAttribute('style', `width: ${chart_width + window.akdv.utils_css.remsToPixels(29)}px; height: ${chart_height + 20}px;`);
                container_el.setAttribute('style', `width: ${chart_width}px; height: ${chart_height}px;`);
                axis_y_left_container_el.setAttribute('style', `width: 14rem; height: ${chart_height}px;`);
                axis_y_right_container_el.setAttribute('style', `width: 14rem; height: ${chart_height}px;`);
            }
            // set the scale ranges & domains
            axis_x_scale
                .rangeRound([0, chart_width]).domain([0, axis_x_max_value]);
            if (!unstacked) {
                axis_y_banded_scale
                    .range([0, axis_y_banded_scale_domain.length * row_height])
                    .paddingInner(0)
                    .domain(axis_y_banded_scale_domain);
            } else {
                axis_y_banded_scale_unstacked
                    .range([0, axis_y_banded_scale_domain_unstacked.length * row_height_unstacked])
                    .paddingInner([opts.row_padding_percent])
                    .domain(axis_y_banded_scale_domain_unstacked);
            }
            axis_y_scale_for_area_plots
                .range([0, axis_y_banded_scale.bandwidth() + row_overlap]);
            // populate axes doms
            axis_x_bottom_svg_g
                .attr('width', chart_width)
                .transition().duration(800).ease(d3.easeCubicOut)
                .call(d3.axisBottom(axis_x_scale)
                        .ticks(Math.min(axis_x_bottom_linear_domain.length, Math.floor(chart_width / window.akdv.utils_css.remsToPixels(2.7)))));
            
            axis_y_right_svg_g.selectAll('.tick').remove();
            axis_y_right_svg_g.selectAll('.domain').remove();
            axis_y_left_svg_g.selectAll('.tick').remove();
            axis_y_left_svg_g.selectAll('.domain').remove();
            if (!unstacked) {
                axis_y_left_svg_g
                    .call(d3.axisLeft(axis_y_banded_scale)
                            .tickSize(window.akdv.utils_css.remsToPixels(0.5))
                            .tickFormat(function(d) { return d; })
                    )
                    .selectAll('g.tick')
                        .attr('class', function(d) { return 'tick tick-' + window.akdv.utils_string.base64IDFromString(d); })
                        .attr('transform', function(d, i) { return 'translate(0, ' + (axis_y_banded_scale(d)) + ')'; })
                            .select('text')
                                .attr('data-full-text', function(d) { return d; })
                                .attr('dy', 0)
                                .attr('y', 0);
            } else {
                axis_y_right_svg_g
                    .call(d3.axisRight(axis_y_banded_scale_unstacked)
                            .tickSize(window.akdv.utils_css.remsToPixels(0.5))
                            .tickFormat(function(d) { return d; })
                    )
                    .selectAll('g.tick')
                        .attr('class', function(d, i) { 
                            return `tick tick-${window.akdv.utils_string.base64IDFromString(d)}`; 
                        })
                        .attr(`data-${window.akdv.utils_string.snakeToKebabCase(opts.data_external_dimension_property_name)}`, function(d, i) { 
                            return `${data_unstacked[i][opts.data_external_dimension_property_name]}`; 
                        })
                        .attr('transform', function(d) { return 'translate(0, ' + (axis_y_banded_scale_unstacked(d)) + ')'; })
                            .select('text')
                                .text(function(d) { return d.replace(/\/+$/, '').split('/').slice(-1)[0]; })
                                .attr('data-full-text', function(d) { return d; })
                                .attr('dy', 0)
                                .attr('y', 0);
                    axis_y_right_svg_g.selectAll('g.tick line').remove()
            }

            let y = Math.round(window.akdv.utils_css.remsToPixels(opts.row_height_rems + opts.row_height_rems * opts.row_overlap_percent));
            // reposition left/right axis groups
            axis_y_left_svg_g
                .attr('transform', function() {
                    return 'translate(' + axis_y_left_container_w + ', ' + y + ')';
                });
            axis_y_right_svg_g
                .attr('transform', function() {
                    return 'translate(0, ' + y + ')';
                });

            // Trim the Axis tick labels down to their end file-names, and provide full URL as a ToolTip
            if (!unstacked && opts.axis_y_left_compact_labels) {
                window.akdv.utils_dom.ellipsizeListOfDOMNodeTextElements(axis_y_left_svg_g.selectAll('text').nodes(), 'START');
            }
            if (unstacked) {
                axis_y_left_svg_g.select('.axis-y-left-selected-unstacked-item-stacked-text')
                    .attr('x', -window.akdv.utils_css.remsToPixels(0.5));
                if (opts.axis_y_left_compact_labels) {
                    window.akdv.utils_dom.ellipsizeListOfDOMNodeTextElements(axis_y_right_svg_g.selectAll('text').nodes());
                }
            }
            // Axis descriptions
            axis_x_bottom_label.attr('y', axis_x_bottom_height - window.akdv.utils_css.remsToPixels(0.5));
            // Scroll bar
            if (opts.simple_scroll_bar_enabled && !opts.simple_bar_added) {
                opts.simple_bar_added = window.akdv.utils_dom.addSimpleScrollbar(opts.container_id, { autoHide: opts.simple_scroll_bar_auto_hide });
            }
        };


        var updateAnnotations = function() {

            var unstacked = getIsBandedScaleItemSelected();

            chart_svg_g.selectAll('.stacked-area-line-annotation').remove();
            chart_svg_g.append('path').attr('class', 'stacked-area-line-annotation invisible').style('fill', 'none');

            // Annotation displayed on stacked area mouse over
            chart_svg_g.selectAll('.stacked-area-annotation').remove();
            d3_annotation_for_stacked_area = d3.annotation()
                .annotations([{
                    type: d3.annotationCalloutCircle,
                    subject: { radius: 3, radiusPadding: 0 }
                }]);
            chart_svg_g.append('g').attr('class', 'stacked-area-annotation invisible')
                .call(d3_annotation_for_stacked_area);

            // Annotations added against the axis x bottom scale to both the main chart svg and the bottom axis svg
            // to display the axis x bottom threshold point and range annotations
            chart_svg_g.selectAll('.axis-x-bottom-annotations').remove();
            axis_x_bottom_svg_g.selectAll('.axis-x-bottom-annotations').remove();

            let axis_x_bottom_annotations = axis_x_bottom_svg_g.append('g').attr('class', 'axis-x-bottom-annotations');
            let main_chart_axis_x_bottom_annotations = chart_svg_g.append('g').attr('class', 'axis-x-bottom-annotations');

            opts.data_axis_x_annotations.forEach(function(d, i) {

                let d_class = window.akdv.utils_string.base64IDFromString(d[opts.data_axis_x_annotations_label_property_name]);
                let x_values_array = d[opts.data_axis_x_annotations_value_property_name];
                x_values_array = Array.isArray(x_values_array)? x_values_array : [x_values_array];
                let label_text = d[opts.data_axis_x_annotations_label_property_name].toUpperCase() 
                    + ' - ' 
                    + window.akdv.utils_string.getFormattedNumber(Math.round(opts.meta[opts.data_meta_axis_x_bottom_label_supplimental_text_property_name] * x_values_array[0]))
                    + opts.axis_x_bottom_unit_of_measurement;

                x_values_array.forEach(function(x_val, j) {
                    if (x_val > 1) {
                        x_val = 1;
                    }

                    let x = axis_x_scale(x_val * 100);
                    
                    main_chart_axis_x_bottom_annotations.append('line')
                        .datum(d)
                        .attr('y1', 0)
                        .attr('y2', chart_height)
                        .attr('x1', x)
                        .attr('x2', x)
                        .attr('class', 'axis-x-bottom-annotation-threshold-line threshold-line-' + d_class);

                    if (j === 0) {
                        axis_x_bottom_annotations.append('circle')
                            .datum(d)
                            .attr('r', window.akdv.utils_css.remsToPixels(0.15))
                            .attr('class', 'axis-x-bottom-annotation-threshold-marker threshold-marker-' 
                                           + d_class)
                            .attr('cx', x)
                            .attr('cy', 0);

                        main_chart_axis_x_bottom_annotations.append('g')
                            .attr('class', 'axis-x-bottom-annotation-threshold-label-g threshold-label-g-' + d_class)
                            .attr('transform', 'translate(' + -1000 + ', ' + (chart_visible_height - 30) + ')')
                            .append('text')
                                .datum(d)
                                .text(label_text)
                                .style('text-anchor', 'start')
                                .attr('y', 0)
                                .attr('x', 0)
                                .style('transform-origin', '0 0')
                                .style('transform', 'rotate(-90deg)')
                                .attr('class', 'axis-x-bottom-annotation-threshold-label threshold-label-' + d_class);
                    }

                    if (j === 1) {
                        main_chart_axis_x_bottom_annotations.insert('rect', ':first-child')
                            .datum(d)
                            .attr('class', 'axis-x-bottom-annotation-threshold-duration-rect threshold-duration-rect-' 
                                           + d_class)
                            .attr('width', axis_x_scale((x_val - x_values_array[0]) * 100))
                            .attr('height', chart_height)
                            .attr('x', axis_x_scale(x_values_array[0] * 100))
                            .attr('y', 0);

                        main_chart_axis_x_bottom_annotations.select('.threshold-label-' + d_class)
                            .text(label_text + ' → ' + window.akdv.utils_string.getFormattedNumber(Math.round(opts.meta[opts.data_meta_axis_x_bottom_label_supplimental_text_property_name] * x_values_array[1]))
                            + opts.axis_x_bottom_unit_of_measurement)
                    }
                });

            });
        };


        // filtering on the external dimension is applied not by removing the data but by animating out the filtered stacked areas
        var updateChartWithExternalDimensionFiltering = function() {

            if (!opts.data_current_external_dimension_filters_array) {
                let filtered_out = d3.selectAll('.stacked-area.filtered-out');
                filtered_out.call(stackedArea.transition_multiplier(Math.round(filtered_out.size() * 0.2) || 2, Math.min(3, filtered_out.size()) || 1).filterIn);
                return;
            }

            let selector = opts.data_current_external_dimension_filters_array.reduce(function(sel, f) {

                return sel + `:not([data-${window.akdv.utils_string.snakeToKebabCase(opts.data_external_dimension_property_name)}="${f}"])`;
            }, ((getIsBandedScaleItemSelected())? '.stacked-area' : '.stacked-area:not(.is-comparison)')); // avoid comparison areas in stacked view as they have been stripped of external dimension classes as they are max value composite areas

            let filtered_stacked_areas = d3.selectAll(selector);

            stackedArea.transition_multiplier(Math.round(filtered_stacked_areas.exit().size() * 0.2) || 2, Math.min(3, filtered_stacked_areas.exit().size()) || 1);

            d3.selectAll('.stacked-area.filtered-out').call(stackedArea.filterIn);
            filtered_stacked_areas.call(stackedArea.filterOut);
        };


        // used to display a single (comparison) max values composite line in the stacked view for the old data for each unique key
        // this shows the shape of the old data for comparison to new data while avoiding the confusion of plotting all entries in both data sets
        var combineAllComparisonDataIntoMaxPlotPerKey = function(data) {

            let comparison_data = data.filter(function(d) { return typeof d.is_comparison !== 'undefined'; });

            if (comparison_data.length) {
                // populate an object with properties for each unique entry on the (unstacked) key dimension
                let obj_with_key_arrays = comparison_data.reduce(function(obj, d) {

                    if (!obj.hasOwnProperty(d.key)) { 
                        obj[d.key] = $.extend(true, {}, d);
                        obj[d.key].is_comparison = true;
                        obj[d.key].is_composite_max = true;
                        obj[d.key].values = obj[d.key].new_values = Array(d.values.length).fill(0);
                        delete obj[d.key][opts.data_external_dimension_property_name];
                    }
                    return obj;
                }, {});
                // iterate over the old (comparison) data to reduce to a single entry per unique key 
                // keeping only the max value for every point in the distribution
                obj_with_key_arrays = comparison_data.reduce(function(obj, d) {
                    // if there's an external filter appllied then only sum values from non filtered entries.
                    if (!Array.isArray(opts.data_current_external_dimension_filters_array)
                        || opts.data_current_external_dimension_filters_array.indexOf(d[opts.data_external_dimension_property_name]) > -1) {
                        obj[d.key].values = obj[d.key].values.map(function(v, i) { return Math.max(v, d.values[i]); });
                        obj[d.key].new_values = obj[d.key].new_values.map(function(v, i) { return Math.max(v, d.new_values[i]); });
                    }
                    return obj;
                }, obj_with_key_arrays);

                comparison_data = Object.keys(obj_with_key_arrays).map(function(key) { return obj_with_key_arrays[key]; });
            }

            return [...comparison_data, ...data.filter(function(d) { return typeof d.is_comparison === 'undefined'; })];
        };


        window.generateRandomComparisonResult = function() {

            let data = xf.all().filter(function(d) { return typeof d.is_comparison === 'undefined'; });
            let distribution_change = Number(((Math.random()) * -0.1).toFixed(2));

            data = $.extend(true, [], data).map(function(d) { 
                d[opts.data_area_opacity_property_name] += Math.random() * 73 - Math.random() * 73; 
                d[opts.data_axis_x_property_name] = d.x;
                d[opts.data_axis_y_banded_scale_property_name] = d.key
                d[opts.data_axis_y_banded_scale_unstacked_property_name] = d.unstacked_key;
                if (opts.data_area_opacity_property_name) {
                    d[opts.data_area_opacity_property_name] = d[opts.data_area_opacity_property_name];
                }
                if (opts.data_area_opacity_ratio_property_name) {
                    d[opts.data_area_opacity_ratio_property_name] = d[opts.data_area_opacity_ratio_property_name];
                }
                d[opts.data_external_dimension_property_name] = d[opts.data_external_dimension_property_name];
                if (opts.data_ranking_property_name) {
                    d[opts.data_ranking_property_name] = d.ranking;
                }
                d[opts.data_area_values_array_property_name] = d.values.map(function(v, i, dist) { let y = (i > 1)? dist[i-2] : v; return Math.min(1, Math.max(0, Number(y) + (distribution_change * (y>0)))); }).join(','); 
                return d; 
            });

            let timechange = (Math.random() - Math.random() * 1000 * 60 * 60 * 24);

            let result = {
                "chart_group": "resource-aggregate-waterfall",
                "compare": true,
                "page_timings": [
                    {
                    "label": "Time to First Byte",
                    "time": 0.1,
                    "color": "blue"
                    },
                    {
                    "label": "DOM Processing",
                    "time": [0.02, 0.09],
                    "color": "bla"
                    },
                    {
                    "label": "DOM Content Loaded",
                    "time": 0.107,
                    "color": "#333"
                    },
                    {
                    "label": "Render Start",
                    "time": 0.426,
                    "color": "green"
                    },
                    {
                    "label": "DOM Ready",
                    "time": 0.995,
                    "color": "blue"
                    },
                    {
                    "label": "Page Loaded",
                    "time": 4011,
                    "color": "black"
                    }
                ],
                "meta": {
                    "timestamp_end": (Number(opts.meta.timestamp_end) + timechange).toFixed(0),
                    "timestamp_start": (Number(opts.meta.timestamp_start) + timechange).toFixed(0),
                    "url": opts.meta.url,
                    "pageviews": opts.meta.pageviews + (Math.random() - Math.random() * 1000),
                    "pageloadtime": opts.meta.pageloadtime + (Math.random() - Math.random() * 1000)
                },
                "data": data
            };
            
            $(window).trigger('result.resource-aggregate-waterfall', result);
        };


        var drawChart = function(e) {
            
            if (!xf.size()) {
                window._log.warn('drawChart requires data.');
                return;
            }

            statusNotifier.rendering();
            event_utils.dispatchCustomEvent(window, 'chart-render-start', 'akdv', { uuid: opts.uuid });
            
            window.requestAnimationFrame(e => {
                // DATA - isElementFiltered() accepts index and an array of dimensions to ignore in determining if the entry is filtered
                let data = xf.all().filter(function(d, i) { return xf.isElementFiltered(i, [external_dimension_filter]); });

                // RESIZE
                // viewboxes and axes
                resizeChart(data);

                // sort by y scale to force correct z-order stacking  
                if (!getIsBandedScaleItemSelected()) {
                    data = combineAllComparisonDataIntoMaxPlotPerKey($.extend(true, [], data));
                    data.sort(window.firstBy(function(v) { return axis_y_banded_scale(v.key); }).thenBy('is_comparison').thenBy('area_max', -1).thenBy('area_sum', -1).thenBy('ranking'));
                } else {
                    data.sort(window.firstBy(function(v) { return axis_y_banded_scale_unstacked(v.unstacked_key); }).thenBy('is_comparison'));
                }

                // DOM
                // populate / update 
                stackedArea
                    .scroll_offset(scroll_offset)
                    .stacked(!getIsBandedScaleItemSelected())
                    .is_comparison(getIsComparison())
                    .transitions_enabled(!(e && e.type === 'resize'))
                    .data_color_coding_property_name(opts.data_external_dimension_property_name);
                let area = chart_svg_g.selectAll('.stacked-area').data(data);
                area.exit().remove();
                area.enter().call(stackedArea);
                chart_svg_g.selectAll('.stacked-area').call(stackedArea.update);

                updateAnnotations();
                updateChartWithExternalDimensionFiltering();// persist filters across data updates and redraws

                statusNotifier.done();
                event_utils.dispatchCustomEvent(window, 'chart-render-complete', 'akdv', { data: xf.all(), data_filtered: xf.allFiltered(), uuid: opts.uuid });
            });
        };


        var mungeData = function(data, meta) {

            let munged_data = data.map(function(d, i) {

                let p = {};
                let opacity = (opts.data_area_opacity_property_name && typeof meta[opts.data_meta_opacity_divisor_property_name] !== 'undefined')
                            ? Math.max(0.15, 
                                Math.min(0.75, 
                                    0.01 + d[opts.data_area_opacity_property_name] / meta[opts.data_meta_opacity_divisor_property_name]
                                )
                              )
                            : 0.35;

                p.x = d[opts.data_axis_x_property_name];
                p.key = d[opts.data_axis_y_banded_scale_property_name];
                p.unstacked_key = d[opts.data_axis_y_banded_scale_unstacked_property_name];
                p.values = (Array.isArray(d[opts.data_area_values_array_property_name]))? d[opts.data_area_values_array_property_name] : d[opts.data_area_values_array_property_name].split(',').map(function(v) { return Number(v); });
                p.area_sum = p.values.reduce(function(sum, v) { return sum + Number(v); }, 0);
                p.area_max = p.values.reduce(function(max, v) { return (Number(v) > max)? Number(v) : max; }, 0);
                if (opts.data_area_opacity_property_name) {
                    p[opts.data_area_opacity_property_name] = d[opts.data_area_opacity_property_name];
                }
                if (opts.data_area_opacity_ratio_property_name) {
                    p[opts.data_area_opacity_ratio_property_name] = d[opts.data_area_opacity_ratio_property_name];
                }
                p.opacity = opacity;
                if (opts.data_external_dimension_property_name && d[opts.data_external_dimension_property_name]) {
                    p[opts.data_external_dimension_property_name] = d[opts.data_external_dimension_property_name];
                }
                if (opts.data_ranking_property_name) {
                    p.ranking = d[opts.data_ranking_property_name];
                }
                for(let k of opts.data_additional_properties_to_copy) {
                    p[k] = d[k];
                }
                p.uid = window.akdv.utils_string.base64IDFromString(p.key + p.unstacked_key);
                p.const = true;
                return p;
            });

            if (opts.data_external_dimension_property_name) {
                opts.fn_to_add_missing_external_dimension_property(munged_data);
            }
            return munged_data;
        };


        // we support just two simultaneous data results for comparison so as each result comes in 
        // we update on first in first out basis
        var reduceToOnlyNonComparisonData = function(data) {

            return data.filter(function(d) { return typeof d.is_comparison === 'undefined'; });
        };


        var setComparisonTrueOnExistingDatum = function(data) {

            return data.map(function(d) { d.is_comparison = true; return d; });
        }

        // entries in the existing data but not in the new data will get new_values array of zeros
        // entries in the new data but not in the existing data will get values array of zeros
        var addNewValuesPropertyForDiffsToPreExistingData = function(pre_existing_data, new_data) {

            // for each entry in the old data add in the values array of the corresponding entry in the new data to be used to plot a diff
            pre_existing_data = pre_existing_data.map(function(d, i) {

                let nd = new_data[i];

                d.found_in_new_data = true; // assume until found otherwise

                if (nd.unstacked_key !== d.unstacked_key) {
                    let filtered_new_data = new_data.filter(function(p){ return p.unstacked_key === d.unstacked_key && !p.added_as_new_values; });
                    if (filtered_new_data.length) {
                        nd = filtered_new_data[0];
                    } else {
                        nd = $.extend(true, {}, d);
                        d.found_in_new_data = false;
                    }
                }

                nd.added_as_new_values = true;
                // entries in the existing data but not in the new data will get new_values array of zeros
                d.new_values = (d.found_in_new_data)? [...nd.values] : Array(nd.values.length).fill(0.01);
                return d;
            });
            // add any that exist in new data but not in the old data
            new_data.filter(function(d) { return !d.added_as_new_values; }).forEach(function(d) {

                let nd = $.extend(true, {}, d);

                d.added_as_new_values = true;
                nd.new_values = [...d.values];
                // entries in the new data but not in the existing data will get values array of zeros
                nd.values = Array(nd.values.length).fill(0.01);
                pre_existing_data.push(nd)
            });
            return pre_existing_data;        
        };


        var updateData = function(e, result) {

            if (!result || !result.data) {
                window._log.warn('update chart triggered without data');
                return;
            }

            if (Array.isArray(result.data) && result.data.length < 1) {
                statusNotifier.noData();
            }

            let valid = window.akdv.validate.objectsInArrayHaveRequiredKeys(result.data, required_data_keys);

            if (!valid) {
                throw 'ERROR : RESULT DATA ENTRY MISSING ONE OR MORE OF REQUIRED KEYS: ' + required_data_keys.join(',');
            }

            if (typeof result.meta[opts.data_meta_opacity_divisor_property_name] === 'undefined') {
                window._log.warn('RESULT META DOES NOT CONTAIN AN OPACITY DIVISOR PROPERTY MATCHING : ' + opts.data_meta_opacity_divisor_property_name, result.meta);
            }
            
            /* remove any elements where required entries are null */
            result.data = result.data.filter(function(d) {
                return required_data_keys.every(key => {
                    return d[key] !== null
                });
            });

            let pre_existing_data = reduceToOnlyNonComparisonData(xf.all());
            let is_comparison = !!(result.compare && pre_existing_data.length);

            // empty out any existing data already in the crossfilter
            if (xf.size()) {
                xf.remove();
            }

            opts.data_current_external_dimension_filters_array = false;
            opts.wrapper_element.classList.toggle('is-comparison', is_comparison);

            if (result.meta) {
                if ( result.meta.timer && result.meta[result.meta.timer]) {
                    result.meta['pageloadtime'] = result.meta[result.meta.timer];
                    opts.timer = result.meta.totaltimername;
                    opts.axis_x_bottom_label_text = `Percentage Of Median ${result.meta.totaltimername}`;
                }
                opts.meta = $.extend(true, {}, opts.meta, result.meta);
                let x_total = opts.meta[opts.data_meta_axis_x_bottom_label_supplimental_text_property_name];
                if (x_total) {
                    axis_x_bottom_label.text(opts.axis_x_bottom_label_text + ' (' + window.akdv.utils_string.getFormattedNumber(x_total) + opts.axis_x_bottom_unit_of_measurement + ')');
                }
            }

            if (result[opts.data_axis_x_annotations_property_name]) {
                opts.data_axis_x_annotations = result[opts.data_axis_x_annotations_property_name];
            }

            let new_data = mungeData(result.data, result.meta);

            if (is_comparison) {
                pre_existing_data = addNewValuesPropertyForDiffsToPreExistingData(pre_existing_data, new_data);
                pre_existing_data = setComparisonTrueOnExistingDatum(pre_existing_data);
                xf.add(pre_existing_data);
            }
            // populate the crossfilter
            xf.add(new_data);
            stacked_keys_obj_with_unstacked_key_arrays = xf.all().reduce(function(p, d) {

                if (!p.hasOwnProperty(d.key)) { 
                    p[d.key] = []; 
                } 
                if (p[d.key].indexOf(d.unstacked_key) === -1) {
                    p[d.key].push(d.unstacked_key);
                }
                return p;
            }, {});
            drawChart();
            $(window).trigger('result-processed.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_chart_data_update), [result, xf.all()]);
        };


        // An auto scroll event will be triggered when a user clicks on an item in a chart.
        // All clickable chart objects are assigned a base64 encoded version of the key of the data
        // they represent and on click this is sent as the data in the triggered auto scroll event 
        // in order to scroll into view items whose id includes a matching base64 encoded key.
        var onAutoScrollEvent = function(e, base64_string_of_data_key, src_container_id) {
            
            if (opts.container_id === src_container_id) {
                return;
            }

            // this should scroll into view the matching element in the axes and the main chart svg
            d3.select(opts.container_id).select('[id*=' + base64_string_of_data_key).nodes().forEach(function(el){ 

                window.akdv.utils.scrollIntoView(el); 
            });
        };


        var onFilterChangeExternalDimension = function(e, _filter) {

            if (_filter && Array.isArray(_filter.filter_values)) {

                // the dimension will only be filtered
                // by other charts triggering an event for this chart
                opts.data_current_external_dimension_filters_array = $.extend(true, [], _filter.filter_values);
                external_dimension_filter.filter(function(d) { 
                    return !Array.isArray(opts.data_current_external_dimension_filters_array) 
                           || opts.data_current_external_dimension_filters_array.indexOf(d) > -1; 
                });
            } else if (typeof _filter === 'string') {

                opts.data_current_external_dimension_filters_array = [_filter];
                external_dimension_filter.filter(_filter);
            } else {
                // clear filters
                opts.data_current_external_dimension_filters_array = false;
                external_dimension_filter.filterAll();
            }

            updateChartWithExternalDimensionFiltering();
            if (!getIsBandedScaleItemSelected() && getIsComparison()) {
                drawChart();
            }
            $(window).trigger('filter-changed.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_for_external_filter_trigger), 
                { 
                    data: xf.all(),
                    // return data as filter by all but the external dimension
                    data_filtered: xf.all().filter(function(d, i) { return xf.isElementFiltered(i, [external_dimension_filter]); })
                }
            );
        };


        var onFilterChangeBandedScaleItemSelect = function(e, _filter_by_key) {

            if (_filter_by_key) {
                axis_y_left_filter_dimension.filter(_filter_by_key);
            } else {
                // clear filters
                axis_y_left_filter_dimension.filterAll();
            }
            if (opts.wrapper_element && opts.wrapper_element.classList) {
                opts.wrapper_element.classList.toggle('banded-scale-item-selected', (typeof _filter_by_key !== 'undefined'));
            }
            // it is assumed that selecting a banded scale item will result in a change of the 
            // banded scale domain so an exit/update redraw is necessary
            drawChart();
            $(window).trigger('filter-changed.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_for_external_filter_trigger), 
                { 
                    data: xf.all(),
                    // return data as filter by all but the external dimension
                    data_filtered: xf.all().filter(function(d, i) { 

                        return xf.isElementFiltered(i, [external_dimension_filter]);
                    })
                }
            );
        }


        // INTERNAL EVENT CHART INTERACTION LISTENERS

        // assign banded scale interaction listeners
        // STACKED ARERA interaction listeners 
        $(opts.wrapper_element).on('click', '.stacked-area, ' + opts.axis_y_left_container_id + ' .tick, ' + opts.axis_y_right_container_id + ' .tick', onBandedScaleItemClick);
        $(opts.wrapper_element).on('mouseover', '.stacked-area', onBandedScaleItemMouseOver);
        $(opts.wrapper_element).on('mousemove', '.stacked-area', onStackedAreaMouseMove);
        $(opts.wrapper_element).on('mouseleave', '.stacked-area', onBandedScaleItemMouseOut);
        // AXIS TICKS interaction listeners
        $(opts.wrapper_element).on('mouseover', opts.axis_y_left_container_id + ' .tick, ' + opts.axis_y_right_container_id + ' .tick', onBandedScaleItemMouseOver);
        $(opts.wrapper_element).on('mouseleave', opts.axis_y_left_container_id + ' .tick, ' + opts.axis_y_right_container_id + ' .tick', onBandedScaleItemMouseOut);
        // ANNOTATIONS ON AXIS X BOTTOM interaction listeners
        $(opts.wrapper_element).on('mouseover click', opts.axis_x_bottom_container_id + ' .axis-x-bottom-annotations circle', onAxisXBottomAnnotationMouseOverOrClick);
        $(opts.wrapper_element).on('mouseleave',  opts.axis_x_bottom_container_id + ' .axis-x-bottom-annotations circle', onAxisXBottomAnnotationMouseOut);
        // AXIS Y LEFT - fake a tick mouse over on mouse move when in unstacked view
        $(opts.axis_y_left_container_id).on('mousemove', onAxisYLeftUnstackedViewMouseMove);
        $(opts.axis_y_left_container_id).on('mouseleave', onBandedScaleItemMouseOut);


        // EXTERNAL EVENT LISTENERS
        

        if (opts.event_namespace_auto_scroll) {
            $(window).on('auto-scroll.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_auto_scroll), onAutoScrollEvent);
        }

        if (opts.event_namespace_for_external_filter_trigger) {
            $(window).on('filter-change.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_for_external_filter_trigger), onFilterChangeExternalDimension);
        }

        if (opts.event_namespace_banded_scale_item_select) {
            $(window).on('filter-change.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_banded_scale_item_select), onFilterChangeBandedScaleItemSelect);
        }
        
        $(window).on('result.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_chart_data_update), updateData);
        $(window).on('resize-charts.akdv', drawChart);

        return chart_svg;
    };


}(window, document, window.jQuery, window.d3, window.crossfilter, window.D3StackedArea, window.akdv.utils_lang, window.akdv.utils_event, window.akdv.utils_string, window.akdv.statusNotifier));