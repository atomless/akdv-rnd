;((window, document, math_utils) => {

    'use strict';
  

    window.akdv.utils_color = {


        getColorRangeArrayStartingFromBgColor(lumin_float_span  = 0.2) {

            let bg_color_string = window.akdv.utils_css.computed_bg_color;

            if (!bg_color_string || typeof bg_color_string !== 'string') {
                window._log.warn(`FAILED TO GET COMPUTED BG COLOR OF BODY`);
                return;
            }

            let hsla_end_values = (bg_color_string.indexOf('hsl') > -1)
                ? this.hslaStringToHslaValuesArray(bg_color_string)
                : this.rgbaStringToHslaValuesArray(bg_color_string);

            let hsla_start_vals = (hsla_end_values[2] < 0.5) // go lighter or darker based on start color lumin
                ? [
                    hsla_end_values[0], 
                    hsla_end_values[1],
                    Math.min(hsla_end_values[2] + lumin_float_span, 1), 
                    1
                ]
                : [
                    hsla_end_values[0], 
                    hsla_end_values[1],
                    Math.max(hsla_end_values[2] - lumin_float_span, 0), 
                    1
                ];

            return [
                window.akdv.utils_css.hslaValuesToCSSString(...hsla_start_vals),
                window.akdv.utils_css.hslaValuesToCSSString(...hsla_end_values)
            ];
        },


        getWCAGCompliantLightnessInversionsOfHSLColorsArray(clrs_array, monotone = false) {

        },


        rgbaValuesArrayToHslaValuesArray(r, g, b, a = 1) {

            let f255 = 1.0 / 255;

            [ r, g, b, a ] = (Array.isArray(r))? [...r] : [ r, g, b, a ];

            r *= f255; g *= f255; b *= f255;

            let max = Math.max(r, g, b);
            let min = Math.min(r, g, b);
            let d, h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; // achromatic
            } else {
                d = max - min;
                s = (l > 0.5)
                    ? d / (2 - max - min) 
                    : d / (max + min);
                switch (max) {
                    case r: 
                        h = (g - b) / d + ((g < b)? 6 : 0); 
                    break;
                    case g: 
                        h = (b - r) / d + 2;
                    break;
                    case b: 
                        h = (r - g) / d + 4; 
                    break;
                }
                h /= 6;
            }

            return [
                Math.floor(h * 360),
                s,
                l,
                Math.min(Math.max(Number(a) || 1, 0), 1)
            ];
        },


        hslaValuesArrayToHslaString(hsla_values_array) {

            let vals = hsla_values_array;

            vals[1] = Math.floor(vals[1] * 100);
            vals[2] = Math.floor(vals[2] * 100);

            return (vals.length > 3 && vals[3] < 1)
                ? `hsla(${vals[0]}, ${vals[1]}%, ${vals[2]}%, ${vals[3]})`
                : `hsl(${vals[0]}, ${vals[1]}%, ${vals[2]}%)`;
        },


        rgbaStringToHslaValuesArray(rgba_string) {

            return this.rgbaValuesArrayToHslaValuesArray(this.rgbaStringToRgbaValuesArray(rgba_string));
        },


        // Supports both hsl and hsla strings
        hslaStringToHslaValuesArray : (hsla_string) => 
            hsla_string.replace(/hsl\(|hsla\(|\s|\%|\)/ig, '').split(',').map((s, i) => (i > 0)? math_utils.roundFloatTo(s * 0.01) : Number(s)),


        // Supports both rgb and rgba strings
        rgbaStringToRgbaValuesArray : (rgba_string, _normalize = false) => 
            rgba_string.replace(/rgb\(|rgba\(|\s|\)/ig, '').split(',').map((s) => _normalize ? Number(s) / 255 : Number(s)),


        hexStringToRgbValuesArray : (hex_string) => [
            parseInt(hex_string.substr(1, 2), 16),
            parseInt(hex_string.substr(3, 2), 16),
            parseInt(hex_string.substr(5, 2), 16)
        ],


        hexStringToHslaValuesArray(hex_string) {

            return this.rgbaValuesArrayToHslaValuesArray(this.hexStringToRgbValuesArray(hex_string));
        },


        hexStringToHslaString(hex_string) {

            return this.hslaValuesArrayToHslaString(this.hexStringToHslaValuesArray(hex_string));
        }

    };


})(window, document, window.akdv.utils_math);