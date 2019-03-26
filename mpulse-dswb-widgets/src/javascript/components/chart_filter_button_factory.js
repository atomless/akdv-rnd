;(function(window, document, $) {

    'use strict';

    window.chartFilterButtonFactory = function() {

        let filter_key = false,
            closable = false,
            togglable = false,
            filter_description = 'Filtered to ',
            filter_value = '*',
            value_to_color_mapping_obj = false,
            element_class = 'filter',
            additional_class = '';


        let filterButton = function() {};


        filterButton.getElement = function() {

            let button_el = $(
                    '<li class="' 
                    + element_class + ' by-' + window.akdv.utils_string.snakeToKebabCase(filter_key)
                    + ((additional_class)? ' ' + additional_class : '') 
                    + ((closable)? ' closable' : '') + ((togglable)? ' togglable' : '') 
                    + ((togglable)? ' checked' : '') + '"'
                    + ' data-filter-key="' + filter_key + '" " data-filter-value="' + filter_value + '" data-filter-description="' + filter_description + '"'
                    + '><strong class="filter-description">' + filter_description + '</strong>'
                    + ' <span class="filter-value"' 
                    + ((value_to_color_mapping_obj)? ` style="color:${value_to_color_mapping_obj[filter_value]}"` : '') 
                    + '>' + filter_value 
                    + '</span></li>'
                );

            if (closable) {
                button_el
                    .append('<span class="icon close-icon close-icon-right"></span>');
            }

            if (togglable) {
                button_el
                    .append('<span class="icon toggle-icon toggle-icon-right"></span>');
            }

            return button_el;
        };


        filterButton.filter_key = function(val) {

            filter_key = val;
            return filterButton;
        };


        filterButton.closable = function(val) {

            closable = val;
            return filterButton;
        };


        filterButton.togglable = function(val) {

            togglable = val;
            return filterButton;
        };

                
        filterButton.filter_description = function(val) {

            filter_description = val;
            return filterButton;
        };


        filterButton.filter_value = function(val) {

            filter_value = val;
            return filterButton;
        };


        filterButton.value_to_color_mapping_obj = function(val) {

            value_to_color_mapping_obj = val;
            return filterButton;
        };


        filterButton.element_class = function(val) {

            element_class = val;
            return filterButton;
        };


        filterButton.additional_class = function(val) {

            additional_class = val;
            return filterButton;
        };


        return filterButton;
    }


}(window, document, window.jQuery));