;((window, document, d3, string_utils, css_utils, dom_utils, data_utils, color_utils, topology_utils) => {

    'use strict';

    const DEFAULT_CLASS = 'color-axis';

    window.axisColorFactory = ({
            dimension_name = window.required(),
            container_el = window.required(),
            uuid = string_utils.generateUUID(),
            scale = false,
            clamp = true,
            class_list = [],
            width_rems = 40,
            height_rems = 0.75,
            max_value = 100,
            min_value = 0,
            offset_y = 0,
            offset_x = 0,
            colors_array = false,
            categorical_colors_map = false,
            categorical_icon = 'hexagon', // must correspond to a method in akdv.utils_topology 
            categorical_icon_radius_rems = 0.45
        } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        if (!colors_array && !categorical_colors_map) {
            window._log.warn('axisColorFactory: Either colors_array or categorical_colors_map are required!');
        }

        let width, height, categorical_icon_radius, clr_min, clr_max;

        const el = d3.select(container_el);
        const defs = (el.select('defs').node())? el.select('defs') : el.append('defs');
        const color_scale = d3[categorical_colors_map? 'scaleOrdinal' : 'scaleLinear']();
        const gradient_rect = el.append('rect').style('fill', `url(#linear-gradient-${uuid})`);
        const linear_gradient = defs.append('linearGradient').attr('id', `linear-gradient-${uuid}`);

        // a color axis is ALWAYS added to a nomal axis g element, so add the classes to that.
        container_el.classList.add(...[DEFAULT_CLASS, ...class_list]);

        return {
            // min and max are the min and max values found in the data, 
            // whereas color_min and color_max define the values at which the bottom color and the penultimate color in the color scale array are mapped
            update({ w = width, h = height, min = min_value, max = max_value, color_min = clr_min, color_max = clr_max } = {}) {

                width = w || css_utils.remsToPixels(width_rems);
                height = h || css_utils.remsToPixels(height_rems);
                max_value = Math.max(min, max);
                min_value = Math.min(min, max);
                clr_min = Math.max(min, color_min);
                clr_max = Math.min(max, color_max);

                if (categorical_colors_map) {

                    let colors = Object.values(categorical_colors_map);
                    let keys = Object.keys(categorical_colors_map);

                    categorical_icon_radius = css_utils.remsToPixels(categorical_icon_radius_rems);
                    el.selectAll('.category-icon').remove();

                    color_scale
                        .domain(keys)
                        .range(colors);

                    let index_of_unknown = keys.map(k => k.toLowerCase()).indexOf('unknown');

                    color_scale.unknown((index_of_unknown > -1)? colors[index_of_unknown] : css_utils.config.default_color_for_unknown_faint);

                    keys.forEach((d, i) => {
                        el.append('path')
                            .classed('category-icon', true)
                            .style('fill', color_scale(d))
                            .attr('transform', `translate(${(scale(d))}, ${-categorical_icon_radius * 1.65})`)
                            .attr('d', topology_utils[categorical_icon](categorical_icon_radius));
                    })

                } else if (colors_array) {
                    // ensure min_value is not greater than max_value and domain is always runs small to large
                    let domain = data_utils.getArrayFromMinToMaxWithSpecifiedSteps(
                        Math.max(Math.min(max_value, min_value, clr_max || max_value), clr_min || 0),
                        Math.min(Math.max(max_value, min_value, clr_min || 0), clr_max? Math.round(clr_max) : max_value),
                        colors_array.length
                    );

                    colors_array = css_utils.convertCSSVarsInArrayToValues(colors_array);

                    let step = domain[1] - domain[0] || domain[0];
                    let entries_to_pad_to_min = (clr_min && clr_min > min_value)? Math.ceil((clr_min - min_value) / step): 0;
                    let entries_to_pad_to_max = (clr_max && clr_max < max_value)? Math.ceil((max_value - clr_max) / step): 0;

                    domain = [
                        ...(entries_to_pad_to_min? Array(entries_to_pad_to_min).fill(domain.slice(0, 1).pop()) : []), 
                        ...domain, 
                        ...(entries_to_pad_to_max? Array(entries_to_pad_to_max).fill(domain.slice(-1).pop()) : [])
                    ];

                    let clrs = [
                        ...(entries_to_pad_to_min? Array(entries_to_pad_to_min).fill(colors_array.slice(0, 1).pop()) : []), 
                        ...colors_array, 
                        ...(entries_to_pad_to_max? Array(entries_to_pad_to_max).fill(colors_array.slice(-1).pop()) : [])
                    ];

                    color_scale
                        .domain(domain)
                        .range(clrs)
                        .interpolate(d3.interpolateHcl)
                        .clamp(true);

                    linear_gradient.selectAll('stop').remove();
                    linear_gradient.selectAll('stop')
                        .data(clrs).enter()
                        .append('stop')
                        .attr('offset', (d, i) => i / (color_scale.range().length - 1))
                        .attr('stop-color', d => d);

                    gradient_rect.attr('width', width).attr('height', height).attr('transform', `translate(0, ${-height * 1.25})`);
                }
            },

            getScale() { return color_scale; },

            // useful for setting the color of text on backgrounds defined by the categorical or interpolated linear color_scale
            getInvertedLightnessScale() {

                let inverted_clrs = color_utils.getWCAGCompliantLightnessInversionsOfHSLColorsArray(color_scale.range());

                let inverted_scale = d3[categorical_colors_map? 'scaleOrdinal' : 'scaleLinear']()
                    .domain(color_scale.domain())
                    .range(inverted_clrs)
                    .clamp(true);

                if (!categorical_colors_map) {
                    inverted_scale.interpolate(d3.interpolateHcl);
                }
                return inverted_scale;
            },

            scale : (d) => color_scale(d),
            
            get el() { return el.node(); },

            get uuid() { return uuid; }
        };
    };

})(window, document, window.d3, 
   window.akdv.utils_string, window.akdv.utils_css, window.akdv.utils_dom, window.akdv.utils_data, window.akdv.utils_color, window.akdv.utils_topology);