;((window, document, d3, axisFactory, axisColorFactory, string_utils, css_utils, dom_utils) => {

    'use strict';

    window.colorLegendFactory = ({
            dimension_name = window.required(),
            container_el = window.required(),
            uuid = string_utils.generateUUID(),
            scale = false,
            clamp = true,
            width = 0,
            height = 0,
            max_value = 100,
            min_value = 0,
            step_value = 10,
            tick_count = 7,
            value_unit = '',
            min_tick_spacing_rems = 2.7,
            tick_format_fn = false,
            offset_y = 0,
            offset_x = 0,
            label_text = false,
            label_offset_x = 0,
            label_offset_y = 0,
            colors_array = false,
            categorical_colors_map = false,
            event_namespace_brush_filter = false
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        const axis = axisFactory({
            dimension_name,
            container_el,
            uuid,
            value_unit,
            tick_count,
            label_text,
            label_offset_x,
            label_offset_y,
            event_namespace_brush_filter,
            scale,
            clamp,
            tick_format_fn,
            ...(categorical_colors_map) && { categorical_colors_map: categorical_colors_map }
        });

        const color_axis = axisColorFactory({
            dimension_name,
            uuid,
            clamp,
            container_el: axis.el,
            scale: axis.getScale(),
            ...(categorical_colors_map)
                ? { categorical_colors_map: categorical_colors_map }
                : { colors_array: colors_array }
        });

        return {
            axis: axis,
            color_axis: color_axis,
            update() {
                window.series(axis.update, color_axis.update)(arguments[0]);
            }
        };
    };

})(window, document, window.d3, window.axisFactory, window.axisColorFactory, 
   window.akdv.utils_string, window.akdv.utils_css, window.akdv.utils_dom);