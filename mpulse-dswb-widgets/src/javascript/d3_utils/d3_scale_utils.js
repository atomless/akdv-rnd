;(function(window, document, d3) {

    'use strict';

    // In order to set your desired red point, divide your desired red point value by 
    // 6 or the corresponding index of the "red colour" in your colour array
    // and pass the resulting value to this function as the step value
    window.populateLinearDomain = function(max_ordinal_value, step) {

        var domain = [0];
        var v = 0;
        while (v < max_ordinal_value) {
            v += step;
            domain.push(v);
        }
        return domain;
    };


    window.getMinMaxDomainFromDataObjectForKey = (data, key) => [
        d3.min(data, function(node) { return node[key]; }),
        d3.max(data, function(node) { return node[key]; })
    ];


    window.populateColorRange = function(_count, _color_array) {

        var count = Math.max(2, _count);
        var color_range = [];
        var color_array = _color_array || [
            'hsl(220,100%,50%)', // Blue
            'hsl(190,100%,50%)', // Cyan
            'hsl(120,100%,50%)', // Green
            'hsl(80,100%,50%)', // Yellow
            'hsl(40,100%,50%)', // Orange
            'hsl(350,100%,50%)', // Red
        ];

        if (color_array.length < 2) {
            throw "The count value passed to populate color range length must be > 1."
        }

        for (var i=0; i < count; i++) {
            color_range.push(color_array[Math.min(i, color_array.length - 1)]);
        }
        return color_range;
    };


    window.getD3ColorScaleFromPropertyToColorMappingsObject = (media_types_with_associated_colors = window.akdv.utils_css.config.mediatype_color_map) =>
        d3.scaleOrdinal()
            .domain(Object.keys(media_types_with_associated_colors))
            .range(Object.values(media_types_with_associated_colors))
            .unknown(window.akdv.utils_css.config.default_color_for_unknown);


    window.getDescriptionOfValue = function(value, max_value, _domain, _range) {

        var domain = _domain || [
            0,
            max_value * 0.125,
            max_value * 0.25,
            max_value * 0.375,
            max_value * 0.5,
            max_value * 0.625,
            max_value * 0.75,
            max_value * 0.875,
            max_value
        ];
        
        var range = _range || [
            'Zero',
            'Zero / Low',
            'Low',
            'Low / Moderate',
            'Moderate',
            'Moderate-High',
            'High',
            'High / Very High',
            'Very High'
        ];
        
        var desc_scale = d3.scaleLinear().domain(domain).range(range);

        return desc_scale(value);
    };


    window.defaultLinearAxisDescriptiveTicks = ['', 'Low', 'Moderate', 'High', 'Very High'];


}(window, document, window.d3));