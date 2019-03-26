;(function(window, document, d3) {

    'use strict';

    /**
     * NOTE : 
     * In x orientation the x axis should have an associated linear_scale and the y axis should be a banded scale.
     * Similarly in y orientation the y axis should have an associated linear_scale and the x axis should be a banded scale.
     */

    window.D3BoxDifference = function() {


        var chart_width = 0,
            chart_height = 0,
            linear_property_a = 'a',
            linear_property_b = 'b',
            linear_scale = false,                                   // REQUIRED!!
            banded_scale = false,                                   // REQUIRED!!
            color_scale = false,                                    // REQUIRED!!
            orientation = 'x',                                      // default to horizontal box whisker
            transitions_enabled = true,
            transition_delay_min = 100,                             // min amount of delay before transition starts
            transition_delay_max = 600,                             // max amount of delay before transition starts
            transition_duration_min = 800,                          // min time in MS for a single transition to complete
            transition_duration_total = 2600,                       // total time in MS before ALL transitions complete
            transition_delay_offset_wavelength_in_rows = 24,        // wavelength of transition delay offset repeat pattern in rows
            transition_duration_offset_wavelength_in_rows = 24,     // wavelength of transition duration offset repeat pattern in rows
            box_thickness_rems = 0.3,
            bax_band_inner_padding_rems = 0.3,
            associated_axis_class = '',
            rect_stroke_color = 'hsla(210,0%,0%,.6)',               // RECT A stroke colour
            rect_stroke_width = '.04rem',                           // RECT A stroke width
            rect_rounded_corner_x = '.1rem',                        // RECT A X rounded corner radius
            rect_rounded_corner_y = '.1rem',                        // RECT A X rounded corner radius   
            arrow_display = true,                                   // Should an arrow be shown at the end of the Difference line
            arrow_scale = true,                                     // Scale the arrow down, for shorter lines
            arrow_scale_range_percent = 10,                         // Over that % of the range, should the arrow scale down
            hide_filtered = false,
            onClickCallback = false,
            
            tooltips_enabled = true,
            tooltips_mult = null,
            tooltips_to_fixed = null,
            tooltips_prefix = '',
            tooltips_postfix = '';

        
        var validateRequiredProperties = function() {

            if (!linear_scale) {
                throw 'D3DifferenceBox linear_scale undefined.';
            }
            if (!banded_scale) {
                throw 'D3DifferenceBox banded_scale undefined.';
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

        
        var tooltipFormat = function(number){
            
            var output = number;
            
            if( $.type(tooltips_to_fixed) === 'number' ){
                output = number.toFixed(tooltips_to_fixed);
            }
            
            output = tooltips_prefix + output + tooltips_postfix;
            
            return output;
        };
        
        var calcPositionA = function(d) {
    
            var prop = d.value[linear_property_a];
            var pos = linear_scale(prop);

            return pos;
        };
    
        var calcPositionBoxA = function(d) {
            
            var pos = calcPositionA(d);
            var box_thickness = window.akdv.utils_css.remsToPixels(box_thickness_rems);
            
            var boxPos = pos - (box_thickness * 0.5);

            return boxPos;
        };
        
        
        
        var calcPositionB = function(d) {

            var prop = d.value[linear_property_b];
            var pos = linear_scale(prop);
            
            return pos;
        };  
        
        var calcPositionBoxB = function(d) {
            
            var pos = calcPositionB(d);
            var box_thickness = window.akdv.utils_css.remsToPixels(box_thickness_rems);
            
            var boxPos = pos - (box_thickness * 0.5);

            return boxPos;
        };
    
            
            
        var arrowScale = function(valA,valB) {
            
            if( !arrow_scale ) {
                return 1.0;
            }
            
            var diff = Math.abs(valA - valB); // Whats the difference in Range
            var domainMax = linear_scale.domain()[1]; // Get the max Rang
            var diffAsPercentageOfDomain = diff / (domainMax / 100); // calc what the difference is, as a percentage of the Range
            var scalar = diffAsPercentageOfDomain / arrow_scale_range_percent; // Calc a mult, from 0 to x, based on the %

            return Math.min(scalar, 1.0); // Return the clamped 0 - 1.0 scalar
        };
        
        
        var boxDifference = function(selection) {
            // NOTE : Be sure NOT to add code here that you wish to be executed on data update as it will not be get applied
            validateRequiredProperties();

            var g = selection
                .append('g')
                .attr('id', function(d) { return 'box-difference-' + window.akdv.utils_string.base64IDFromString(d.key); })
                .attr('transform', function(d) { return (orientation === 'y')? 'translate(' + banded_scale(d.key) + ', -300)' : 'translate(-300, ' + banded_scale(d.key) + ')'; })
                .style('opacity', '0')
                .attr('class', 'box-difference ' + associated_axis_class);

            var box_b = g
                .append('rect')
                .attr('class', 'difference-box-b diff');
            
            if(tooltips_enabled) {
                box_b
                    .style('pointer-events','visible')
                    .append('title')
                    .text( function(d){ return tooltipFormat(d.value[linear_property_b]); } );
            }
            
            var box_a = g
                .append('rect')
                .attr('class', function(d) { return 'difference-box-a dashed-line ' + ((d.value[linear_property_a] !== d.value[linear_property_b])? 'diff' : 'no-diff'); });

            if(tooltips_enabled) {
                box_a
                    .style('pointer-events','visible')
                    .append('title')
                    .text( function(d){ return tooltipFormat(d.value[linear_property_a]); });
            }
            
            if (onClickCallback) {
                box_b.on('click', onClickCallback);
            }

            var diff_line = g
                .append('line')
                .attr('class', function(d) { return 'difference-line dashed-line ' + ((d.value[linear_property_a] !== d.value[linear_property_b])? 'diff' : 'no-diff'); });

            if( arrow_display ) {
                
                if ( selection.node() ) { // Define Arrow Head SVG, of arrow_display is required
                    var svg_root = d3.select(selection.node()._parent.ownerSVGElement);
                    if (!svg_root.select('defs').size()) {
                        
                        var arrow_head = svg_root
                            .append('defs')
                            .append('polygon')
                            .attr('id', 'svg-arrow-head')
                            .attr('points', '0,0 15,5 15,-5')
                            .attr('class','difference-arrow-head');
                    }
                }
    
                // Add the optional arrow head
                var diff_arrow = g
                    .append('g')
                    .attr('class','difference-arrow-head-group')
                    .attr('transform', 'translate(0 0)')
                    .append('use')
                    .attr('xlink:href', '#svg-arrow-head')
                    .attr('class', function(d) { 
                        return 'difference-arrow-head ' + 
                        ((d.value[linear_property_a] !== d.value[linear_property_b])? 'diff' : 'no-diff') + 
                        ((d.value[linear_property_a] < d.value[linear_property_b])? ' flip-' + orientation : '');
                    });
            }
        };

        
        boxDifference.update = function(selection) {
            
            var box_thickness = window.akdv.utils_css.remsToPixels(box_thickness_rems);
            var bax_band_inner_padding = window.akdv.utils_css.remsToPixels(bax_band_inner_padding_rems);

            if (orientation === 'x') {

                // Box Difference - GROUP
                selection
                    .attr('title', function(d) { return d.key; })
                    .classed('filtered', function(d) { return d.value.filtered; })
                    .style('opacity', function(d) { return (d.value.filtered)? 0 : 1; })
                    .attr('transform', function(d) {
                        var transY = banded_scale(d.key);
                        return 'translate(0,' + ((isNaN(transY))? 0 : transY) + ')';
                    })
                    .interrupt()
                    .transition()
                    .duration(durationAccumulator)
                    .delay(delayAccumulator)
                    .ease(d3.easeCubicOut)
                    .style('opacity', '1');

                
                // Box Difference - RECT A
                selection.select('.difference-box-a')
                    .attr('title', function(d) { return d.key; })
                    .classed('diff', function(d) { return d.value[linear_property_a] !== d.value[linear_property_b]; })
                    .classed('no-diff', function(d) { return d.value[linear_property_a] === d.value[linear_property_b]; })
                    .attr('height', banded_scale.bandwidth() - bax_band_inner_padding)
                    .attr('width', box_thickness)
                    .attr('y', bax_band_inner_padding * 0.5)
                    .attr('x', calcPositionBoxA )
                    .attr('rx', function(){ return window.akdv.utils_css.remsToPixels(box_thickness_rems * 0.5); } )
                    .attr('ry', function(){ return window.akdv.utils_css.remsToPixels(box_thickness_rems * 0.5); } )
                    .style('fill', 'none');
              
                
                // Box Difference - RECT B
                selection.select('.difference-box-b')
                    .attr('title', function(d) { return d.key; })
                    .attr('height', banded_scale.bandwidth() - bax_band_inner_padding)
                    .attr('width', box_thickness)
                    .attr('y', bax_band_inner_padding * 0.5)
                    .attr('x', calcPositionBoxB )
                    .attr('rx', function(){ return window.akdv.utils_css.remsToPixels(box_thickness_rems * 0.5); } )
                    .attr('ry', function(){ return window.akdv.utils_css.remsToPixels(box_thickness_rems * 0.5); } )
                    .style('fill', function(d) { return color_scale(d.value[linear_property_b]); })
                    .style('stroke-width', function(d) { return rect_stroke_width; })
                    .style('stroke', function(d) { return rect_stroke_color; });

                if(tooltips_enabled) {
                    selection.select('.difference-box-b').select('title')
                        .text( function(d){ return tooltipFormat(d.value[linear_property_b]); });
                }
                
                // Box Difference - Connecting LINE
                selection.select('.difference-line')
                    .classed('diff', function(d) { return d.value[linear_property_a] !== d.value[linear_property_b]; })
                    .classed('no-diff', function(d) { return d.value[linear_property_a] === d.value[linear_property_b]; })
                    .attr('x1', calcPositionA )
                    .attr('x2', calcPositionB )
                    .attr('y1', function(d) { return banded_scale.bandwidth() * 0.5; })
                    .attr('y2', function(d) { return banded_scale.bandwidth() * 0.5; })
                    .style('fill', function(d) { return color_scale(d.value[linear_property_b]); });

                
                // Box Difference - Optional Magnitude Arrow
                if( arrow_display ) { 
                    
                    selection.select('.difference-arrow-head-group')
                        .attr('transform', function(d) {
                            return 'translate(' + calcPositionB(d) + ' ' + (banded_scale.bandwidth() * 0.5) + ')';
                        });

                    selection.select('.difference-arrow-head')
                        .classed('diff', function(d) { return d.value[linear_property_a] !== d.value[linear_property_b]; })
                        .classed('no-diff', function(d) { return d.value[linear_property_a] === d.value[linear_property_b]; })
                        .attr('transform', function(d) {
                            
                            var a = d.value[linear_property_a];
                            var b = d.value[linear_property_b];
                            var rot = 0;
                            var scale = arrowScale(a,b);
                            
                            if( a < b ) {
                                rot = 180;
                            }
                            
                            return 'rotate(' + rot + ') scale(' + scale + ' ' + scale + ')';
                        });
                }

            } else {

                // box-difference group
                selection
                    .attr('title', function(d) { return d.key; })
                    .classed('filtered', function(d) { return d.filtered; })
                    .style('opacity', function(d) { return (d.value.filtered)? 0 : 1; })
                    .attr('transform', function(d) {

                        var transX = banded_scale(d.key);
                        var transY = linear_scale(Math.min(d.value[linear_property_a], d.value[linear_property_b])) - box_thickness * 0.5;

                        return 'translate(' + ((isNaN(transX))? 0 : transX) + ', ' + ((isNaN(transY) || hide_filtered && d.value.filtered)? -300 : transY) + ')';
                    })
                    .transition()
                    .duration(durationAccumulator)
                    .delay(delayAccumulator)
                    .ease(d3.easeCubicOut)
                    .style('opacity', '1');

                selection.select('.difference-box-a')
                    .classed('diff', function(d) { return d.value[linear_property_a] !== d.value[linear_property_b]; })
                    .classed('no-diff', function(d) { return d.value[linear_property_a] === d.value[linear_property_b]; })
                    .attr('width', banded_scale.bandwidth())
                    .attr('height', box_thickness)
                    .style('fill', 'none')
                    .attr('x', 0)
                    .attr('y', function(d) { return calcPositionA(d) - box_thickness * 0.5; });

                selection.select('.difference-box-b')
                    .attr('width', banded_scale.bandwidth())
                    .attr('height', box_thickness)
                    .style('fill', function(d) { return color_scale(d.value[linear_property_b]); })
                    .attr('x', 0)
                    .attr('y', function(d) { return calcPositionB(d) - box_thickness * 0.5; });

                selection.select('.difference-line')
                    .classed('diff', function(d) { return d.value[linear_property_a] !== d.value[linear_property_b]; })
                    .classed('no-diff', function(d) { return d.value[linear_property_a] === d.value[linear_property_b]; })
                    .attr('y1', calcPositionA)
                    .attr('y2', calcPositionB)
                    .attr('x1', function(d) { return banded_scale.bandwidth() * 0.5; })
                    .attr('x2', function(d) { return banded_scale.bandwidth() * 0.5; })
                    .style('fill', function(d) { return color_scale(d.value[linear_property_b]); })

                    
                if( arrow_display ) { // Optionally display difference Arrow head
                    
                    selection.select('.difference-arrow-head')
                        .classed('diff', function(d) { return d.value[linear_property_a] !== d.value[linear_property_b]; })
                        .classed('no-diff', function(d) { return d.value[linear_property_a] === d.value[linear_property_b]; })
                        .attr('x', function(d) { return banded_scale.bandwidth() * 0.5; })
                        .attr('y', calcPositionB)
                        .attr('style', function(d) {
                            var aScale = arrowScale(d.value[linear_property_a],d.value[linear_property_b]);
                            return ((d.value[linear_property_a] < d.value[linear_property_b])? 'transform: scale(-'+ aScale +','+ aScale +'); transform-origin: ' + calcPositionB(d) + 'px;' : 'transform: scale('+ aScale +'); transform-origin: ' + calcPositionB(d) + 'px;'); 
                        });
                    
                }

            }
        };


        boxDifference.chart_width = function(val) {

          chart_width = val;
          return boxDifference;
        };


        boxDifference.orientation = function(val) {

            orientation = val;
            return boxDifference;
        };


        boxDifference.transitions_enabled = function(val) {

          transitions_enabled = val;
          return boxDifference;
        };


        boxDifference.transition_delay_min = function(val) {

          transition_delay_min = val;
          return boxDifference;
        };


        boxDifference.transition_delay_max = function(val) {

          transition_delay_max = val;
          return boxDifference;
        };


        boxDifference.transition_duration_min = function(val) {

          transition_duration_min = val;
          return boxDifference;
        };


        boxDifference.transition_duration_total = function(val) {

          transition_duration_total = val;
          return boxDifference;
        };


        boxDifference.transition_delay_offset_wavelength_in_rows = function(val) {

          transition_delay_offset_wavelength_in_rows = val;
          return boxDifference;
        };


        boxDifference.transition_duration_offset_wavelength_in_rows = function(val) {

          transition_duration_offset_wavelength_in_rows = val;
          return boxDifference;
        };


        boxDifference.box_thickness_rems = function(val) {

            box_thickness_rems = val;
            return boxDifference;
        };


        boxDifference.associated_axis_class = function(val) {

            associated_axis_class = val;
            return boxDifference;
        };


        boxDifference.linear_property_a = function(val) {

            linear_property_a = val;
            return boxDifference;
        };


        boxDifference.linear_property_b = function(val) {

            linear_property_b = val;
            return boxDifference;
        };


        boxDifference.linear_scale = function(val) {

            linear_scale = val;
            return boxDifference;
        };


        boxDifference.banded_scale = function(val) {

            banded_scale = val;
            return boxDifference;
        };


        boxDifference.color_scale = function(val) {

            color_scale = val;
            return boxDifference;
        };

        
        boxDifference.rect_stroke_color = function(val) {

            rect_stroke_color = val;
            return boxDifference;
        };
          
        boxDifference.rect_stroke_width = function(val) {
    
            rect_stroke_width = val;
            return boxDifference;
        };
        
        
        boxDifference.rect_rounded_corner_x = function(val) {

            rect_rounded_corner_x = val;
            return boxDifference;
        };
          
        boxDifference.rect_rounded_corner_y = function(val) {
    
            rect_rounded_corner_y = val;
            return boxDifference;
        };
        
        
        boxDifference.arrow_display = function(val) {

            arrow_display = val;
            return boxDifference;
        };
          
        
        boxDifference.arrow_scale = function(val) {
    
            arrow_scale = val;
            return boxDifference;
        };
        
        
        boxDifference.arrow_scale_range_percent = function(val) {
            
            arrow_scale_range_percent = val;
            return boxDifference;
        };


        boxDifference.hide_filtered = function(val) {

            hide_filtered = val;
            return boxDifference;
        };

        
        boxDifference.onClickCallback = function(fn) {

            onClickCallback = fn;
            return boxDifference;
        };
        
        boxDifference.tooltips_enabled = function(val) {

            tooltips_enabled = val;
            return boxDifference;
        };
        
        boxDifference.tooltips_mult = function(val) {

            tooltips_mult = val;
            return boxDifference;
        };
        
        boxDifference.tooltips_to_fixed = function(val) {

            tooltips_to_fixed = val;
            return boxDifference;
        };
        
        boxDifference.tooltips_prefix = function(val) {

            tooltips_prefix = val;
            return boxDifference;
        };
        
        boxDifference.tooltips_postfix = function(val) {

            tooltips_postfix = val;
            return boxDifference;
        };
        

        return boxDifference;
    };


}(window, document, window.d3));