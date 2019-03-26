;((window, document, topology_utils, string_utils, dom_utils) => {

    'use strict';

    const svg_template = string_utils.stringLiteralTemplate`<svg width="${0}" height="${1}" viewBox="0 0 ${0} ${1}" class="${2}-icon" stroke-linejoin="round" stroke-linecap="round" stroke-width="${4}"><path d="${3}"/></svg>`;
    const stroke_ratio = 0.1;
    
    window.akdv.icons = {

        triangle_up: (r = 100, c = 'triangle-up') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.triangle_up(r), r * stroke_ratio)),

        triangle_down: (r = 100, c = 'triangle-down') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.triangle_down(r), r * stroke_ratio)),

        triangle_left: (r = 100, c = 'triangle-left') => dom_utils.createElementFromHMTLString(svg_template.with(r, r, c, topology_utils.triangle_left(r), r * stroke_ratio)),

        triangle_right: (r = 100, c = 'triangle-right') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.triangle_right(r),r * stroke_ratio)),

        arrow_up: (r = 100, c = 'arrow-up') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.arrow_up(r), r * stroke_ratio)),

        arrow_down: (r = 100, c = 'arrow-down') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.arrow_down(r), r * stroke_ratio)),

        arrow_left: (r = 100, c = 'arrow-left') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.arrow_left(r), r * stroke_ratio)),

        arrow_right: (r = 100, c = 'arrow-right') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.arrow_right(r), r * stroke_ratio)),

        line_arrow_up: (r = 100, c = 'line-arrow-up') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.line_arrow_up(r), r * stroke_ratio)),

        line_arrow_down: (r = 100, c = 'line-arrow-down') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.line_arrow_down(r), r * stroke_ratio)),

        line_arrow_left: (r = 100, c = 'line-arrow-left') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.line_arrow_left(r), r * stroke_ratio)),

        line_arrow_right: (r = 100, c = 'line-arrow-right') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.line_arrow_right(r), r * stroke_ratio)),

        hexagon: (r = 100, c = 'hexagon') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.hexagon(r), r * stroke_ratio)),

        x: (r = 100, c = 'close') => dom_utils.createElementFromHTMLString(svg_template.with(r, r, c, topology_utils.x(r), r * stroke_ratio))
    };

})(window, document, window.akdv.utils_topology, window.akdv.utils_string, window.akdv.utils_dom);