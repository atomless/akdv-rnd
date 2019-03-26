;(function(window, document, d3) {

    'use strict';

    /**
     * NOTE : 
     * In x orientation the x axis should have an associated linear_scale and the y axis should be a banded scale.
     * Similarly in y orientation the y axis should have an associated linear_scale and the x axis should be a banded scale.
     */

    window.D3Bar = function() {


        var linear_property = false,                                // REQUIRED!! -- property used to pass into the linear scale to retrieve the width/height of the bar
            linear_scale = false,                                   // REQUIRED!!
            banded_scale = false,                                   // REQUIRED!!
            color_scale = false,
            banded_property = false,
            orientation = 'x',                                      // default to horizontal box whisker
            transitions_enabled = true,
            transition_delay_min = 150,                             // min amount of delay before transition starts
            transition_delay_max = 700,                             // max amount of delay before transition starts
            transition_duration_min = 800,                          // min time in MS for a single transition to complete
            transition_duration_total = 2500,                       // total time in MS before ALL transitions complete
            transition_delay_offset_wavelength_in_rows = 24,        // wavelength of transition delay offset repeat pattern in rows
            transition_duration_offset_wavelength_in_rows = 24,     // wavelength of transition duration offset repeat pattern in rows
            associated_axis_class = '',
            hide_filtered = false,
            selectable = false,                                     // A blanked property to set the Bars interactable class, on init
            selectableFunc = false,                                 // If a function, can be used to dynamically control selectable class, based on data etc
            onClickCallback = false,
            bar_tooltip = null;
        

        var validate_required_properties = function() {

            if (!linear_property) {
                throw 'D3Bar requires linear_property to be defined in order to set the bar size using the data and the linear scale.';
            }
            if (!linear_scale) {
                throw 'D3Bar linear_scale undefined.';
            }
            if (!banded_scale) {
                throw 'D3Bar banded_scale undefined.';
            }
        };


        var durationAccumulator = function(d, i) {
            // avoid simple duration based on index as this tends to leave those at end of list taking a LONG time to appear
            // instead use sin * i to produce stagger but without an ever increasing lag
            let magnitude = transition_duration_total - transition_duration_min - transition_delay_max;
            let ms = transition_duration_min + (magnitude * 0.5) + (Math.sin((i + 0.85) * (1.7 / transition_duration_offset_wavelength_in_rows)) * magnitude);

            return transitions_enabled * ms;
        };


        var delayAccumulator = function(d, i) {
            // avoid simple delay based on index as this tends to leave those at end of list taking a LONG time to appear
            // instead use sin * i to produce stagger but without an ever increasing lag
            let magnitude = transition_delay_max - transition_delay_min;
            let ms = transition_delay_min + (magnitude * 0.5) + Math.abs(Math.sin(i * (1.7 / transition_delay_offset_wavelength_in_rows)) * magnitude);

            return transitions_enabled * ms;
        };


        var bar = function(selection) {

            validate_required_properties();

            var b = selection.append('rect')
                .attr('class', 'bar ' + associated_axis_class)
                .classed('selectable', selectable)
                .classed('non-selectable', !selectable);

            // Only assign a Click handler, if this Bar is flagged as SELECTABLE
            if (selectable && onClickCallback)
            {     
                b.on('click', onClickCallback);   
            }
            
            b.append('title');
        };

        
        bar.update = function(selection) {

            if (orientation === 'x') {
                selection
                    .attr('title', function(d) { return d.key; })
                    .attr('id', function(d) { return 'bar-' + window.akdv.utils_string.base64IDFromString(d.key); })
                    .classed('filtered', function(d) { 
                        if( $.type(d.value.filtered) === 'boolean' && d.value.filtered) {
                            return true;
                        }
                        return false;
                    })
                    .attr('x', function(d) { return 0; })
                    .attr('y', function(d) { return banded_scale(d.key); })
                    .attr('height', banded_scale.bandwidth() )
                    .interrupt()
                    .transition()
                    .duration(durationAccumulator)
                    .delay(delayAccumulator)
                    .ease(d3.easeCubicOut)
                    .attr('width', function(d) { return (hide_filtered && d.value.filtered)? 0 : linear_scale(d.value[linear_property]); });
                
                if( $.type(selectableFunc) === 'function' ) {
                    selection
                        .classed('selectable', function(d){ return selectableFunc(d); })
                        .classed('non-selectable', function(d){ return !selectableFunc(d); });
                }
            }
            else
            {
                selection
                    .attr('title', function(d) { return d.key; })
                    .attr('id', function(d) { return 'bar-' + window.akdv.utils_string.base64IDFromString(d.key); })
                    .classed('filtered', function(d) { 
                        
                        if( $.type(d.value.filtered) === 'boolean' && d.value.filtered)
                        {
                            return true;
                        }
                        
                        return false;
                    })
                    .attr('y', function(d) { return 0; })
                    .attr('x', function(d) { return banded_scale(d.key); })
                    .attr('width', banded_scale.bandwidth())
                    .interrupt()
                    .transition()
                    .duration(durationAccumulator)
                    .delay(delayAccumulator)
                    .ease(d3.easeCubicOut)
                    .attr('height', function(d) { return (hide_filtered && d.value.filtered)? 0 : linear_scale(d.value[linear_property]); });
                
                if( $.type(selectableFunc) === 'function' ) {
                    selection
                        .classed('selectable', function(d){ return selectableFunc(d); })
                        .classed('non-selectable', function(d){ return !selectableFunc(d); });
                }
            }

            // Update the Bars Tooltip
            if( $.type(bar_tooltip) === 'string' )
            {
                selection.select('title').text( bar_tooltip );
            }
            else if ( $.type(bar_tooltip) === 'function' )
            {
                selection.select('title').text( function(d) { return bar_tooltip(d,this); } );
            }

            if (color_scale) {
                selection
                    .style('fill', function(d) { return color_scale(d.value[banded_property]); });
            }
        };


        bar.orientation = function(val) {

            orientation = val;
            return bar;
        };


        bar.transitions_enabled = function(val) {

          transitions_enabled = val;
          return bar;
        };


        bar.transition_delay_min = function(val) {

          transition_delay_min = val;
          return bar;
        };


        bar.transition_delay_max = function(val) {

          transition_delay_max = val;
          return bar;
        };


        bar.transition_duration_min = function(val) {

          transition_duration_min = val;
          return bar;
        };


        bar.transition_duration_total = function(val) {

          transition_duration_total = val;
          return bar;
        };


        bar.transition_delay_offset_wavelength_in_rows = function(val) {

          transition_delay_offset_wavelength_in_rows = val;
          return bar;
        };


        bar.transition_duration_offset_wavelength_in_rows = function(val) {

          transition_duration_offset_wavelength_in_rows = val;
          return bar;
        };


        bar.associated_axis_class = function(val) {

            associated_axis_class = val;
            return bar;
        };


        bar.linear_property = function(val) {

            linear_property = val;
            return bar;
        };


        bar.linear_scale = function(val) {

            linear_scale = val;
            return bar;
        };


        bar.banded_scale = function(val) {

            banded_scale = val;
            return bar;
        };


        bar.color_scale = function(val) {

            color_scale = val;
            return bar;
        };


        bar.hide_filtered = function(val) {

            hide_filtered = val;
            return bar;
        };


        bar.selectable = function(val) {

            selectable = val;
            return bar;
        };
          
        bar.selectableFunc = function(fn) {

            selectableFunc = fn;
            return bar;
        };
        
        
        bar.onClickCallback = function(fn) {

          onClickCallback = fn;
          return bar;
        };

        bar.bar_tooltip = function(val){
            bar_tooltip = val;
            return bar;
        };
        
        return bar;
    };


}(window, document, window.d3));