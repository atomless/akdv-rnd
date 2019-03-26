;(function(window, document, d3) {

    'use strict';

    /**
     * NOTE : 
     * In x orientation the x axis should have an associated linear_scale_y and the y axis should be a banded scale.
     * Similarly in y orientation the y axis should have an associated linear_scale_y and the x axis should be a banded scale.
     */

    window.D3StackedArea = function() {


        var linear_scale_y = false, // REQUIRED!!
            linear_scale_x = false, // REQUIRED!!
            banded_scale = false,
            banded_scale_unstacked = false,
            color_scale = false,
            data_color_coding_property_name = false,
            stacked = true,
            is_comparison = false,
            scroll_offset = false, // used when unstacked to preserve any scroll offset present when user clicked to select stacked areas
            orientation = 'x', // default to horizontal box whisker
            transitions_enabled = true,
            transition_delay_min = 0, // min amount of delay before transition starts
            transition_delay_max = 1300, // max amount of delay before transition starts
            transition_duration_min = 300, // min time in MS for a single transition to complete
            transition_duration_total = 2600, // total time in MS before ALL transitions complete
            transition_delay_relative_multiplier = 100, // amount accumulated by each stacked entry up to the max delay value
            transition_duration_relative_multiplier = 450, // amount accumulated by each stacked entry up to the max delay value
            transition_delay_offset_wavelength_in_rows = 56, // wavelength of transition delay offset repeat pattern in rows
            transition_duration_offset_wavelength_in_rows = 56, // wavelength of transition duration offset repeat pattern in rows
            additional_class = '',
            interpolation_type = d3.curveLinear;


        const validate_required_properties = function() {

            if (!linear_scale_y) {
                throw 'D3StackedArea linear_scale_y is required.';
            }
            if (!linear_scale_x) {
                throw 'D3StackedArea linear_scale_x is required.';
            }
        };


        const durationAccumulator = function(d, i) {
            // avoid simple duration based on index as this tends to leave those at end of list taking a LONG time to appear
            // instead use sin * i to produce stagger but without an ever increasing lag
            let magnitude = (transition_duration_total - transition_duration_min - transition_delay_max) * 0.5;
            let ms = transition_duration_min + magnitude + (Math.sin(i * (1.7 / Math.max(1, transition_duration_offset_wavelength_in_rows))) * magnitude);

            return transitions_enabled * ms;
        };


        const delayAccumulator = function(d, i) {
            // avoid simple delay based on index as this tends to leave those at end of list taking a LONG time to appear
            // instead use sin * i to produce stagger but without an ever increasing lag
            let magnitude = (transition_delay_max - transition_delay_min) * 0.5;
            let ms = transition_delay_min + magnitude + (Math.sin(i * (1.7 / Math.max(1, transition_delay_offset_wavelength_in_rows))) * magnitude);

            return transitions_enabled * ms;
        };


        const updateTransitionSettingsRelativeToSelectionLength = function(n, x = n) {

            transition_delay_max = Math.max(transition_delay_min, Math.min(1300, transition_delay_relative_multiplier * x));
            transition_duration_total = Math.max(transition_duration_min, Math.min(2600, transition_duration_relative_multiplier * x));

            transition_delay_offset_wavelength_in_rows = Math.min(56, Math.round(n * 0.5));
            transition_duration_offset_wavelength_in_rows = Math.min(84, Math.round(n * 0.5));
        };


        const addNewValuesComparisonLineAndSetDAttributeToValuesInSelection = function(selection, 
            d3area = d3.area().curve(interpolation_type).y0(Math.round(linear_scale_y(0))), 
            d3area_for_comparison = d3.area().curve(interpolation_type)) {

            selection.each(function(pd, i) {

                let area = d3.select(this).select('.area');

                if (pd.is_comparison) {
                    let nv_line = d3.select(this).select('.new-values-comparison-line');
                    if (!nv_line.size()) {
                        nv_line = d3.select(this).append('path').attr('class', 'new-values-comparison-line');
                    }
                    nv_line.datum(function(d) { return pd.new_values; })
                        .attr('d', d3.line()
                            .curve(interpolation_type)
                            .y(function(d) { return Math.round(linear_scale_y(d)); })
                            .x(function(d, i) { return linear_scale_x(i); })
                        );
                } else {
                    d3.select(this).selectAll('.new-values-comparison-line').remove();
                }
                // comparison data is plotted using the old values in place of the 0 base used by normal plots
                area.datum(function(d) {
                        return (stacked && (typeof pd.is_comparison === 'undefined' || !pd.is_comparison))
                            ? Array(linear_scale_x.domain().slice(-1).pop()).fill(0)
                            : pd.values;
                    })
                    .attr('d', (function(d) {
                            
                            return (typeof pd.is_comparison === 'undefined' || !pd.is_comparison)
                                ? d3area
                                    .y1(function(d, i) { return Math.round(linear_scale_y(d)); })
                                    .x(function(d, i) { return linear_scale_x(i); })
                                : d3area_for_comparison
                                    .y1(function(d, i) { return Math.round(linear_scale_y(pd.new_values[i])); })
                                    .y0(function(d) { return Math.round(linear_scale_y(d)); })
                                    .x(function(d, i) { return linear_scale_x(i); });

                        }()) // must be an IIFE - trailing brackets are not a typo!
                    );

            });
        };


        const stackedArea = function(selection) {

            validate_required_properties();

            selection.each(function(d) {

                let g =  d3.select(this).append('g')
                    .attr('class', function(d) { 
                        return 'stacked-area';
                    });

                if (typeof d.is_comparison === 'undefined' || !d.is_comparison) {
                    g.append('rect')
                        .attr('class', 'bg-mouse-event-rect')
                        .style('fill-opacity', 0)
                        .style('stroke', 'none');
                }

                g.append('path')
                    .attr('class', 'area');
                
                g.append('line')
                    .attr('class', 'maskline');
            });
            
        };

        
        stackedArea.update = function(selection) {

            selection
                .attr('id', function(d) { 
                    return 'stacked-area-' + window.akdv.utils_string.base64IDFromString(d.unstacked_key) + ((d.is_comparison)? '-is-comparison' : '');
                })
                .attr('class', function(d) { 
                    return ((d.is_comparison)? 'is-comparison ' : '') + 'stacked-area stacked-area-' + window.akdv.utils_string.base64IDFromString((stacked)? d.key : d.unstacked_key);
                })
                .attr('data-full-text', function(d) { return d.unstacked_key; })
                .attr('data-path', function(d) { return d.unstacked_key.substring(0, d.unstacked_key.replace(/\/+$/, '').lastIndexOf('/')); })
                .interrupt().classed('d3-transitioning', false)
                .select('.area').interrupt().classed('d3-transitioning', false).classed('is-comparison', function(d) { return d.is_comparison === true; })
                .style('fill-opacity', function(d) { return d.opacity; });

            if (color_scale && data_color_coding_property_name) {
                selection
                    .attr(`data-${window.akdv.utils_string.snakeToKebabCase(data_color_coding_property_name)}`, function(d) { 
                        return d[data_color_coding_property_name]; 
                    });

                if (!is_comparison) {
                    selection.select('.area')
                        .style('fill', function(d) { 
                            return color_scale(d[data_color_coding_property_name]); 
                        });
                } else {
                    selection.select('.area')
                        .style('stroke', function(d) { 
                            return color_scale(d[data_color_coding_property_name]); 
                        });
                }
            }

            updateTransitionSettingsRelativeToSelectionLength(selection.size());

            let linear_scale_x_max = linear_scale_x(linear_scale_x.domain().slice(-1).pop());
            let d3area = d3.area().curve(interpolation_type).y0(Math.round(linear_scale_y(0)));
            let d3area_for_comparison = d3.area().curve(interpolation_type);

            if (orientation === 'x') {

                selection.select('.maskline')
                    .attr('x1', 0)
                    .attr('x2', linear_scale_x_max)
                    .attr('y1', Math.round(linear_scale_y(0)))// - 0.15)
                    .attr('y2', Math.round(linear_scale_y(0)));// - 0.15);

                selection.select('.bg-mouse-event-rect')
                    .attr('width', linear_scale_x_max)
                    .attr('height', window.akdv.utils_css.remsToPixels((stacked)? 0.1 : 0.8))
                    .attr('y', linear_scale_y(0) - window.akdv.utils_css.remsToPixels((stacked)? 0.1 : 0.8))
                    .attr('x', 0);

                if (stacked) {

                    selection
                        .attr('transform', function(d) {

                            let y = Math.round(banded_scale(d['key']));

                            return 'translate(0,' + y + ')'; 
                        });

                    addNewValuesComparisonLineAndSetDAttributeToValuesInSelection(selection, d3area, d3area_for_comparison);

                    selection.select('.area:not(.is-comparison)')
                        .datum(function(d) { return d.values; })
                        .transition()
                        .on('start', function(d, i) {
                            d3.select(this).classed('d3-transitioning', true);
                        })
                        .on('end', function() {
                            d3.select(this).classed('d3-transitioning', false);
                        })
                        .duration(durationAccumulator)
                        .delay(delayAccumulator)
                        .ease(d3.easeCubicInOut)
                        .attr('d', d3area
                            .y1(function(d) { return Math.round(linear_scale_y(d)); })
                            .x(function(d, i) { return linear_scale_x(i); })
                        );

                } else {

                    addNewValuesComparisonLineAndSetDAttributeToValuesInSelection(selection, d3area, d3area_for_comparison);

                    selection
                        .attr('transform', function(d) {

                            let y = banded_scale(d['key']);

                            return 'translate(0,' + Math.round(y - scroll_offset) + ')'; 
                        })
                        .transition()
                        .on('start', function(d, i) {
                            d3.select(this).classed('d3-transitioning', true);
                        })
                        .on('end', function() {
                            d3.select(this).classed('d3-transitioning', false);
                        })
                        .duration(durationAccumulator)
                        .delay(delayAccumulator)
                        .ease(d3.easeExpInOut)
                        .attr('transform', function(d) {

                            let y = banded_scale_unstacked(d['unstacked_key']);

                            return 'translate(0,' + Math.round(y) + ')'; 
                        });
                }
            } /*else {

                // TODO - implement y orientation
            }*/

        };


        stackedArea.filterIn = function(selection) {

            selection.classed('filtered-out', false)
                .select('.area:not(.is-comparison)').interrupt().classed('d3-transitioning', false)
                    .datum(function(d) { return d.values; })
                    .transition()
                    .on('start', function(d, i) {
                        d3.select(this).classed('d3-transitioning', true);
                    })
                    .on('end', function() {
                        d3.select(this).classed('d3-transitioning', false);
                    })
                    .duration(durationAccumulator)
                    .delay(delayAccumulator)
                    .ease(d3.easeCubicInOut)
                        .attr('d', 
                            d3.area()
                                .curve(interpolation_type)
                                .y0(Math.round(linear_scale_y(0)))
                                .y1(function(d) { return Math.round(linear_scale_y(d)); })
                                .x(function(d, i) { return linear_scale_x(i); })
                        );
        };


        stackedArea.filterOut = function(selection) {

            selection.classed('filtered-out', true)
                .select('.area:not(.is-comparison)').interrupt().classed('d3-transitioning', false)
                    .datum(function(d) { return d.values; })
                    .transition()
                    .on('start', function(d, i) {
                        d3.select(this).classed('d3-transitioning', true);
                    })
                    .on('end', function() {
                        d3.select(this).classed('d3-transitioning', false);
                    })
                    .duration(durationAccumulator)
                    .delay(delayAccumulator)
                    .ease(d3.easeCubicInOut)
                        .attr('d', 
                            d3.area()
                                .curve(interpolation_type)
                                .y0(Math.round(linear_scale_y(0)))
                                .y1(Math.round(linear_scale_y(0)))
                                .x(function(d, i) { return linear_scale_x(i); })
                        );
        };


        stackedArea.orientation = function(val) {

            orientation = val;
            return stackedArea;
        };


        stackedArea.transitions_enabled = function(val) {

          transitions_enabled = val;
          return stackedArea;
        };


        stackedArea.additional_class = function(val) {

            additional_class = val;
            return stackedArea;
        };


        stackedArea.transition_multiplier = function(vala, valb = vala) {

            updateTransitionSettingsRelativeToSelectionLength(vala, valb);
            return stackedArea;
        };


        stackedArea.linear_scale_y = function(val) {

            linear_scale_y = val;
            return stackedArea;
        };


        stackedArea.linear_scale_x = function(val) {

            linear_scale_x = val;
            return stackedArea;
        };


        stackedArea.banded_scale = function(val) {

            banded_scale = val;
            return stackedArea;
        };


        stackedArea.banded_scale_unstacked = function(val) {

            banded_scale_unstacked = val;
            return stackedArea;
        };


        stackedArea.stacked = function(val) {

          stacked = val;
          return stackedArea;
        };


        stackedArea.is_comparison = function(val) {

          is_comparison = val;
          return stackedArea;
        };


        stackedArea.scroll_offset = function(val) {

          scroll_offset = val;
          return stackedArea;
        };

        stackedArea.color_scale = function(val) {

          color_scale = val;
          return stackedArea;
        };


        stackedArea.data_color_coding_property_name = function(val) {

          data_color_coding_property_name = val;
          return stackedArea;
        };


        stackedArea.interpolation_type = function(val) {

            interpolation_type = val;
            return stackedArea;
        };


        return stackedArea;
    };


}(window, document, window.d3));