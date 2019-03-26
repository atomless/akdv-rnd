;((window, document, d3, $, string_utils, css_utils, dom_utils, data_utils, event_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'axis';

    window.axisFactory = ({
            dimension_name = window.required(),
            container_el = window.required(),
            uuid = string_utils.generateUUID(),
            scale = false,
            clamp = true,
            class_list = [],
            width_rems = 10,
            height_rems = 0.75,
            max_value = 100,
            min_value = 0,
            step_value = false,
            tick_count = 7,
            tick_format_fn = false,
            min_tick_spacing_rems = 4,
            value_unit = '',
            offset_y = 0,
            offset_x = 0,
            label_text = false,
            label_offset_x = 0,
            label_offset_y = 0,
            categorical_colors_map = false,
            event_namespace_brush_filter = false
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        let width = false, height = false, min_tick_spacing, max_ticks, is_linear_scale = categorical_colors_map === false, brush, brush_values_selection = [];

        const el = d3.select(container_el).classed('axis-container', true);
        const AXIS_TYPE_CLASS = 'axis-x-bottom';
        const ELEMENT_ID = `${DEFAULT_CLASS}-${uuid}`;
        const axis_g = el.append('g').attr('id', ELEMENT_ID).attr('class', [DEFAULT_CLASS, AXIS_TYPE_CLASS, ...class_list].join(' '));
        const d3scale = scale || d3[categorical_colors_map? 'scaleOrdinal' : 'scaleLinear']();
        const text_label = (label_text) && el.append('text').attr('class', 'label axis-x-label').attr('x', '50%');

        const default_tick_format_fn = d => `${string_utils.uppercaseLabelFormat(d)}${value_unit}`;
        const maxResponsiveTicks = () => Math.floor(Math.min((max_value - min_value) / step_value, width / min_tick_spacing));
        
        const axisResize = (g) => g
            .attr('width', width)
            .attr('transform', `translate(${offset_x}, ${offset_y})`)
            // .transition().duration(0).ease(d3.easeCubicOut)
            .call(d3.axisBottom(d3scale).ticks(max_ticks).tickFormat(tick_format_fn || default_tick_format_fn).tickSize(height * -1.25));

        const getSelectionValueArray = (s) => s? s.map(d3scale.invert) : [];

        const onBrushEnd = () => {
            brush_values_selection = getSelectionValueArray(d3.event.selection);
            window.setTimeout(e => {
                event_utils.dispatchCustomEvent(window, 'filter-change', event_namespace_brush_filter, { 
                    name: dimension_name, 
                    filtered_array: brush_values_selection
                });
            }, 30);
        };

        const initBrush = () => {

            axis_g.selectAll(`#brush-${ELEMENT_ID}`).remove();

            if (is_linear_scale && event_namespace_brush_filter) {

                brush = d3.brushX();
                brush.extent(() => [[0, 0], [width, height]]).handleSize(height * 1.5).on('end', onBrushEnd);

                axis_g.append('g')
                    .attr('id', `brush-${ELEMENT_ID}`)
                    .attr('class', 'brush')
                    .attr('transform', `translate(0, ${height * -1.25})`)
                    .call(brush);
            }
        };

        const updateBrush = () => {

            let brush_sel_vals = brush_values_selection.map(d3scale);

            brush.extent(() => [[0, 0], [width, height]]).handleSize(height * 1.5);
            axis_g.select('.brush .overlay').attr('width', width).attr('height', width);
            axis_g.select('.brush').call(brush);
            if (brush_sel_vals.length) { 
                brush.move(axis_g.select('.brush'), brush_sel_vals); 
            }
        };


        return {
            // min and max are the min and max values found in the data, 
            // whereas color_min and color_max define the values at which the bottom color and the penultimate color in the color scale array are mapped to
            update({ w = width, h = height, x = offset_x, y = offset_y, min = min_value, max = max_value, step = false, label = label_text, color_min, color_max } = {}) {

                width = w || css_utils.remsToPixels(width_rems);
                height = h || css_utils.remsToPixels(height_rems);
                offset_x = x;
                offset_y = y;
                min_tick_spacing = css_utils.remsToPixels(min_tick_spacing_rems);
                max_value = Math.max(min, max);
                min_value = Math.min(min, max);
                step_value = step || (max_value - min_value) / tick_count;
                max_ticks = maxResponsiveTicks();
                label_text = label;

                d3scale
                    .domain(categorical_colors_map
                        ? Object.keys(categorical_colors_map) 
                        : [min_value, max_value])
                    .range(categorical_colors_map
                        ? data_utils.getArrayFromMinToMaxWithSpecifiedSteps(0, width, Object.keys(categorical_colors_map).length) 
                        : [0, width])
                    .clamp(clamp);

                axis_g.selectAll('tick').remove();
                axis_g.call(axisResize);

                if (label_text) {
                    text_label
                        .text(label)
                        .attr('y', offset_y + css_utils.remsToPixels(2.75));
                }

                if (brush) { updateBrush(); } else { initBrush(); }
            },

            getScale() { return d3scale; },

            scale : (d) => d3scale(d),

            get el() { return axis_g.node(); },

            get uuid() { return uuid; }
        };
    };

})(window, document, window.d3, window.jQuery,
   window.akdv.utils_string, window.akdv.utils_css, window.akdv.utils_dom, window.akdv.utils_data, window.akdv.utils_event);