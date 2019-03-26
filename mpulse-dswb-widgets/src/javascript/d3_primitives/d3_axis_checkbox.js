;(function(window, document, d3) {

    'use strict';

    window.D3AxisCheckbox = function() {

        var banded_scale = false,                       // REQUIRED!!
            orientation = 'x',
            element_class = '',                         // A custom class to be applied to each Checkbox
            disabled = true,                            // Should the Checkbox be DISABLED on init?
            checked = true,                             // Should the Checkbox be CHECKED on init?
            data_property = null,                       // The property name in the data, that defines the INIT state of the checkbox (overrides 'checked' property) 
            onClickCallback = false,                    // A function to trigger, when the Checkbox changes state
            onClickElementSelectorIDs = [],             // An ID to associate this Checkbox, with other UI elements that act as a group
            onClickClassToToggle = '';                  // When the Checkbox is unticked, what classname to apply, to indicate state change...


        var line = d3.line()
            .x(function(d){ return d.x; })
            .y(function(d){ return d.y; });


        var onClick = function(datum) {
            
            d3.event.stopPropagation();

            // When the Checkbox is DISABLED, do nothing
            if( $.type(this) === 'object' ) {
                
                var checkboxDisabled = $(this).attr('data-disabled');
                
                if( $.type(checkboxDisabled) === 'string' && checkboxDisabled === 'true' ){
                    return;  
                }
            }
            
            var unique_id = d3.event.target.parentElement.id.substring(d3.event.target.parentElement.id.lastIndexOf('-') + 1);

            checked = d3.event.target.parentElement.getAttribute('data-checked') !== 'true';
            d3.event.target.parentElement.setAttribute('data-checked', checked);

            // Toggle 'onClickClassToToggle' class, on any elements defined in 'onClickElementSelectorIDs'
            if (unique_id && $.type(onClickElementSelectorIDs) === 'array')
            {
                onClickElementSelectorIDs.forEach(function(sel,i){
                    $('[id=' + sel + unique_id + ']').toggleClass('muted', !checked);
                });  
            }
            
            if (onClickCallback)
            {
                onClickCallback({'datum' : datum, 'unique_id': unique_id, 'type': 'click', 'target': d3.event.target.parentElement, 'currentTarget': d3.event.target.parentElement, 'checked': checked });
            }
        };


        var checkBox = function(selection) {

            var g = selection.append('g')
                .attr('class', element_class)
                .attr('data-checked', checked)
                .attr('data-disabled', function(d){
                    if( $.type(disabled) === 'boolean' ){
                        return disabled;
                    }
                    
                    if( $.type(disabled) === 'function' ){
                        return disabled(d);
                    }
                });

            g.append('rect');
            g.append('path');
            g.on('click', onClick);
        };


        checkBox.update = function(selection) {

            if (!banded_scale) {
                throw 'Error checkbox requires a banded d3 scale.';
            }

            var size = window.akdv.utils_css.remsToPixels(0.85);

            selection
                .attr('id', function(d) { return element_class + '-' + window.akdv.utils_string.base64IDFromString(d.key); })
                .attr('data-disabled', function(d){
                    if( $.type(disabled) === 'boolean' ){
                        return disabled;
                    }
                    
                    if( $.type(disabled) === 'function' ){
                        return disabled(d);
                    }
                })
                .attr('class', function(d) {
             
                if( $.type(data_property) === 'string' )
                {
                    selection
                        .attr('data-checked', function(d){
                            if( $.type(d.value[data_property]) === 'boolean')
                            {
                                return d.value[data_property];
                            }
                            else
                            {
                                return checked;
                            }
                        })
                } 
  
                var filtered = (!d.filtered)? '' : ' filtered';
                    return element_class + ' chart-toggle-checkbox' + filtered;
                })
                .attr('width', banded_scale.bandwidth())
                .attr('height', banded_scale.bandwidth())
                .attr('transform', function(d) { 
                    
                    var offset = banded_scale(d.key) + ((banded_scale.bandwidth() - size) * 0.5);
                    offset = isNaN(offset)? 0 : offset;
                    var offset_x = (orientation === 'y')? 0 : offset;
                    var offset_y = (orientation === 'y')? offset : 0;

                    return 'translate(' + offset_x + ', ' + offset_y + ')';
                });

            selection.select('rect')
                .attr('width', size)
                .attr('height', size)
                .attr('rx', size * 0.1)
                .attr('ry', size * 0.1)
                .attr('class','checkbox-area');
                
            selection.select('path')
                .attr('d', line([
                { x : size * 0.2, y : size * 0.5 },
                { x : size * 0.4, y : size * 0.75 },
                { x : size * 0.475, y : size * 0.55 },
                { x : size * 0.65, y : size * 0.325 },
                { x : size * 0.8, y : size * 0.2 }
            ]))
            .attr('class','check-tick');
        };


        checkBox.orientation = function(val) {

            orientation = val;
            return checkBox;
        };


        checkBox.banded_scale = function(val) {

            banded_scale = val;
            return checkBox;
        };


        checkBox.element_class = function(val) {

            element_class = val;
            return checkBox;
        };
        
        checkBox.disabled = function(val) {

            disabled = val;
            return checkBox;
        };

        
        checkBox.checked = function (val) {

            if(val === undefined) {
                return checked;
            } else {
                checked = val;
                return checkBox;
            }
        };

        checkBox.data_property = function(val) {

            data_property = val;
            return checkBox;
        };
        
        checkBox.onClickCallback = function (fn) {

            onClickCallback = fn;
            return checkBox;
        };

        checkBox.onClickElementSelectorIDs = function (array) {

            onClickElementSelectorIDs = array;
            return checkBox;
        };
        
        checkBox.onClickClassToToggle = function (val) {

            onClickClassToToggle = val;
            return checkBox;
        };

        
        return checkBox;
    }


}(window, document, window.d3));