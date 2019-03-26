;((window, document, $, env_utils) => {

    'use strict';
  

    const css_utils = window.akdv.utils_css = {

        cache : {
            pixels_to_rem : false,
            font_size : '',
            computed_bg_color : false
        },

        config : {
            // the actual color vars used in this map are defined in css/themes/
            // they SHOULD be accessed via the helpers getColorArrayByType & getColorMapByCategory below
            mediatype_color_map : {
                'html' : 'var(--color_html)',
                'script' : 'var(--color_script)',
                'css' : 'var(--color_css)',
                'text' : 'var(--color_text)',
                'image' : 'var(--color_image)',
                'flash' : 'var(--color_flash)',
                'font' : 'var(--color_font)',
                'video' : 'var(--color_video)',
                'xhr' : 'var(--color_xhr)',
                'other' : 'var(--color_other)'
                // 'unknown' : 'var(--color_unknown)'
            },
            mediatype_faint_color_map : {
                'html' : 'var(--color_html_faint)',
                'script' : 'var(--color_script_faint)',
                'css' : 'var(--color_css_faint)',
                'text' : 'var(--color_text_faint)',
                'image' : 'var(--color_image_faint)',
                'flash' : 'var(--color_flash_faint)',
                'font' : 'var(--color_font_faint)',
                'video' : 'var(--color_video_faint)',
                'xhr' : 'var(--color_xhr_faint)',
                'other' : 'var(--color_other_faint)'
                // 'unknown' : 'var(--color_unknown_faint)'
            },
            heatmap_color_array : [ 
                'var(--color_hm_cooler)',
                'var(--color_hm_cool)',
                'var(--color_hm_warm)',
                'var(--color_hm_warmer)',
                'var(--color_hm_warmest)'
            ],
            heatmap_faint_color_array : [ 
                'var(--color_hm_cooler_faint)',
                'var(--color_hm_cool_faint)',
                'var(--color_hm_warm_faint)',
                'var(--color_hm_warmer_faint)',
                'var(--color_hm_warmest_faint)'
            ],
            heatmap_b_color_array : [ 
                'var(--color_hm_blue)',
                'var(--color_hm_cool)',
                'var(--color_hm_warm)',
                'var(--color_hm_warmer)',
                'var(--color_hm_warmest)'
            ],
            heatmap_b_faint_color_array : [ 
                'var(--color_hm_blue_faint)',
                'var(--color_hm_cool_faint)',
                'var(--color_hm_warm_faint)',
                'var(--color_hm_warmer_faint)',
                'var(--color_hm_warmest_faint)'
            ],
            default_color_for_unknown : 'var(--color_unknown)',
            default_color_for_other : 'var(--color_other)',
            default_color_for_unknown_faint : 'var(--color_unknown_faint)',
            default_color_for_other_faint : 'var(--color_other_faint)'
        },


        init() {

            this.addEventListeners();
        },


        get supports_vars() {
            return (window.CSS && window.CSS.supports && window.CSS.supports('--test_css_var', 0));
        },


        hslaValuesToCSSString : (h, s, l, a = 1) => 
            `hsl${(a < 1)? 'a' : ''}(${h}, ${(s <= 1)? Math.floor(s * 100) + '%' : s}, ${(l <= 1)? Math.floor(l * 100) + '%' : l}${(a < 1)? ', ' + a: ''})`,


        updateCachedValues() {
            window.requestAnimationFrame(e => window.requestAnimationFrame(e => {
                css_utils.cache.font_size = document.defaultView.getComputedStyle(document.body).getPropertyValue('font-size'); 
                css_utils.cache.computed_bg_color = document.defaultView.getComputedStyle(document.body).getPropertyValue('background-color');
                if (css_utils.cache.computed_bg_color === 'rgb(0, 0, 0)' || css_utils.cache.computed_bg_color === 'transparent') {
                    css_utils.cache.computed_bg_color = 'hsl(195, 20%, 98%)';
                }
            })
            );
        },


        get computed_bg_color() {
            return css_utils.cache.computed_bg_color || this.getValueOfCSSVar('var(--prime_bg_0)');
        },


        remsToPixels(rems) {

            let fs = this.cache.font_size || document.defaultView.getComputedStyle(document.body).getPropertyValue('font-size');

            return (fs)? parseFloat(fs.replace('px','')) * rems : 0;
        },


        pixelsToRems(pixels) {

            let fs = this.cache.font_size || document.defaultView.getComputedStyle(document.body).getPropertyValue('font-size');

            return pixels / parseFloat(fs.replace('px',''));
        },


        // Note: this is different from the getStyleRuleValue method below
        // as it requires the selector to match an element currently present in the DOM
        getValueForStylePropertyOfSelector(style_property, selector = 'body', bypass_cache = false) {

            let cached_v = this.cache[`${style_property}-of-${selector}`];

            return (!bypass_cache && typeof cached_v !== 'undefined')
                ? cached_v
                : document.defaultView.getComputedStyle(document.querySelector(selector)).getPropertyValue(style_property);
        },


        // Get the value of a style property for a given simple css selector, eg:
        // getStyleRuleValue('background', '.my_title');
        // Note: does not support complex selectors.
        getStyleRuleValue : (style_property, css_selector) => 
            Array.from(document.styleSheets).reduce((value, sheet) => 
                Array.from((sheet.rules)? sheet.rules : sheet.cssRules).reduce((value, rule) => 
                    (rule.selectorText && rule.selectorText.toLowerCase() === css_selector && rule.style[style_property])
                    ? rule.style[style_property]
                    : value,
                value),
            null),


        getValueOfCSSVar(css_var) { 

            return (css_var.includes('var('))
                ? this.getValueForStylePropertyOfSelector(String(css_var).replace(/var\(--([^\)]*)\)/, ($0, $1) => $1? `--${$1}` : $0)).trim() 
                : css_var; 
        },


        convertCSSVarsInArrayToValues : (arr) => arr.map(d => d && typeof d === 'string' && d.indexOf('var(') > -1
            ? css_utils.getValueOfCSSVar(d)
            : d
        ),


        getTransformationObjectFromTransformAttributeString(transform) {

            // Create a dummy g for calculation purposes only. This will never
            // be appended to the DOM and will be discarded once this function 
            // returns.
            let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

            // Set the transform attribute to the provided string value.
            g.setAttributeNS(null, 'transform', transform);

            // consolidate the SVGTransformList containing all transformations
            // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
            // its SVGMatrix. 
            let matrix = g.transform.baseVal.consolidate().matrix;

            // Below calculations are taken and adapted from the private d3 core function
            // transform/decompose.js of D3's module d3-interpolate. see : https://github.com/d3/d3-interpolate/blob/master/src/transform/decompose.js#L12-L25
            let scale_x, scale_y, skew_x;
            let a = matrix.a, b = matrix.b, c = matrix.c, d = matrix.d, e = matrix.e, f = matrix.f;

            scale_x = Math.sqrt(a * a + b * b);
            skew_x = a * c + b * d;
            scale_y = Math.sqrt(c * c + d * d);

            if (scale_x) {
                a /= scale_x;
                b /= scale_x;
            }

            if (skew_x) {
                c -= a * skew_x;
                d -= b * skew_x;
            }

            if (scale_y) {
                c /= scale_y;
                d /= scale_y;
                skew_x /= scale_y;
            }

            if (a * d < b * c) {
                a = -a;
                b = -b;
                skew_x = -skew_x;
                scale_x = -scale_x;
            }

            return {
                translate_x: e,
                translate_y: f,
                rotate: Math.atan2(b, a) * 180 / Math.PI,
                skew_x: Math.atan(skew_x) * 180 / Math.PI,
                scale_x: scale_x,
                scale_y: scale_y
            };
        },


        getColorArrayByType : (type = 'heatmap', variant = false) => {

            let clr_array = css_utils.config[`${type}_${variant? variant + '_' : ''}color_array`];

            return (env_utils.isIE11() || !css_utils.supports_vars)
                ? css_utils.convertCSSVarsInArrayToValues(clr_array)
                : clr_array;
        },


        getColorMapByCategory : (category = 'mediatype', variant = false) => {

            let clr_map = css_utils.config[`${category}_${variant? variant + '_' : ''}color_map`];

            if (env_utils.isIE11() || !css_utils.supports_vars) {
                for (let c of Object.entries(clr_map)) {
                    clr_map[c[0]] = css_utils.getValueOfCSSVar(c[1]);
                }
            }

            return clr_map;
        },


        addEventListeners() {

            $(window).on('load resize-charts.akdv theme-change.akdv', this.updateCachedValues);
            $(document).on('DOMContentLoaded visibilitychange', this.updateCachedValues);
        },

    };


})(window, document, window.jQuery, window.akdv.utils_env);