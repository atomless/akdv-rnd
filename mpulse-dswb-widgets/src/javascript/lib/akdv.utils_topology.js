;((window) => {

    'use strict';
  

    window.akdv.utils_topology = {

        triangle_up(r = 100) {

            return `M ${r * 0.5},${r * 0.15} ${r * 0.12},${r * 0.8} ${r * 0.88},${r * 0.8} Z`;
        },

        triangle_down(r = 100) {

            return `M ${r * 0.12},${r * 0.2} ${r * 0.88},${r * 0.2} ${r * 0.5},${r * 0.85} Z`;
        },

        triangle_left(r = 100) {

            return `M ${r * 0.12},${r * 0.5} ${r * 0.8},${r * 0.12} ${r * 0.8},${r * 0.88} Z`;
        },

        triangle_right(r = 100) {

            return `M ${r * 0.2},${r * 0.12} ${r * 0.2},${r * 0.88} ${r * 0.85},${r * 0.5} Z`;
        },

        arrow_up(r = 100) {

            return `M${r * 0.05} ${r * 0.75} L${r * 0.5} ${r * 0.25} L${r * 0.95} ${r * 0.75} M${r * 0.5} ${r * 0.25} Z`;
        },

        arrow_down(r = 100) {

            return `M${r * 0.05} ${r * 0.25} L${r * 0.5} ${r * 0.75} L${r * 0.95} ${r * 0.25} M${r * 0.5} ${r * 0.75} Z`;
        },

        arrow_left(r = 100) {

            return `M${r * 0.75} ${r * 0.05} L${r * 0.25} ${r * 0.5} L${r * 0.75} ${r * 0.95} M${r * 0.25} ${r * 0.5} Z`;
        },

        arrow_right(r = 100) {

            return `M${r * 0.25} ${r * 0.05} L${r * 0.75} ${r * 0.5} L${r * 0.25} ${r * 0.95} M${r * 0.75} ${r * 0.5} Z`;
        },

        line_arrow_up(r = 100) {

            return `M${r * 0.05} ${r * 0.55} L${r * 0.5} ${r * 0.05} L${r * 0.95} ${r * 0.55} M${r * 0.5} ${r * 0.05} L${r * 0.5} ${r * 0.95} Z`;
        },

        line_arrow_down(r = 100) {

            return `M${r * 0.05} ${r * 0.45} L${r * 0.5} ${r * 0.95} L${r * 0.95} ${r * 0.45} M${r * 0.5} ${r * 0.95} L${r * 0.5} ${r * 0.05} Z`;
        },

        line_arrow_left(r = 100) {

            return `M${r * 0.55} ${r * 0.05} L${r * 0.05} ${r * 0.5} L${r * 0.55} ${r * 0.95} M${r * 0.05} ${r * 0.5} L${r * 0.95} ${r * 0.5} Z`;
        },

        line_arrow_right(r = 100) {

            return `M${r * 0.45} ${r * 0.05} L${r * 0.95} ${r * 0.5} L${r * 0.45} ${r * 0.95} M${r * 0.95} ${r * 0.5} L${r * 0.05} ${r * 0.5} Z`;
        },

        hexagon(r = 20) {

            const SQRT3 = Math.sqrt(3);
            const hex_points = [[0, -1], [SQRT3 / 2, 0.5], [0, 1], [-SQRT3 / 2, 0.5], [-SQRT3 / 2, -0.5], [0, -1], [SQRT3 / 2, -0.5]];
            
            return `m${hex_points.map(p => p.map(d => d * r).join(',')).join('l')}z`;
        },

        x(r = 100) {

            return `M ${r*0.16},${r*0.16} L ${r*0.96},${r*0.96} Z M ${r*0.16},${r*0.96} L ${r*0.96},${r*0.16} Z`;
        }
    };

})(window);