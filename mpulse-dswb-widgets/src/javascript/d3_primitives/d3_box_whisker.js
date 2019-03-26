;(function(window, document, d3, dispatchCustomEvent) {

    'use strict';

    /**
     * NOTE : 
     * In x orientation the x axis should have an associated linear scale, a color_scale defined as color_scale and the y axis should be a banded scale.
     * Similarly in y orientation the y axis should have an associated linear scale, a color_scale defined as color_scale and the x axis should be a banded scale.
     */

    window.D3BoxWhisker = function() {

        var chart_width = 0,
            chart_height = 0,
            linear_scale = false,                                           // REQUIRED!!
            banded_scale = false,                                           // REQUIRED!!
            color_scale = false,                                            // REQUIRED!!
            max_linear_scale_value = 0,
            orientation = 'x',                                              // default to horizontal box whisker
            muted_property = null,
            muted_property_truthy = false,
            
            transitions_enabled = true,
            transition_delay_min = 150,                                     // min amount of delay before transition starts
            transition_delay_max = 600,                                     // max amount of delay before transition starts
            transition_duration_min = 800,                                  // min time in MS for a single transition to complete
            transition_duration_total = 1400,                               // total time in MS before ALL transitions complete
            transition_delay_offset_wavelength_in_rows = 24,                // wavelength of transition delay offset repeat pattern in rows
            transition_duration_offset_wavelength_in_rows = 24,             // wavelength of transition duration offset repeat pattern in rows
       
            slider_enabled = false,                                         // Enable a Slider, which can be used to modify the Whiskers values
            slider_border_radius = 4,
            slider_handle_width = 13,
            associated_axis_class = '',
            
            onSliderClickCallback = false,                                  // A Callback, for clicks on the Slider
            onSliderDoubleClickCallback = false,                            // A Callback, for double-clicks on the Slider
            
            onClickCallback = false,                                        // A Callback, for clicks on the Whisker group
            onDoubleClickCallback = false,                                  // A Callback, for double-clicks on the Whisker group
            
            drag_enabled = false,
            drag_start_position = 0,
            drag_value_min = 0,                                             // The Slider will not go below this value (in ms)
            drag_value_min_padding = 1.3,                                   // Pad the Median from reaching the same value as its BOTTOM_WHISKER
            
            enforce_interactable_enabled = false,
        
            drag_end_timer = null,
            drag_end_timer_delay = 10,
            
            onDragStartCallback = function(){},
            onDragEndCallback = function(){},
            
            onDragCancelAnnotations = [],
            
            drag_slider_annotation_bg_rect_padding = 0.05,
            drag_slider_annotation_bg_rect_height = 0,
            drag_slider_annotation_arrow_height = 0,

            
            sel_whisker_bottom = 'bottom-whisker',
            sel_quartile_box = 'quartile-box',
            sel_median_line = 'median-line',
            sel_whisker_top = 'top-whisker',
            sel_center_line = 'center-line',
            sel_horizontal_line = 'line',
            
            sel_id_size = 16,
            
            sel_median_slider_group = 'median-offset-display-group',
            sel_median_slider_background = 'median-offset-display-bg',
            sel_median_slider_text = 'median-offset-display-text',
            sel_median_slider = 'slider-drag-handle',
            
            // TODO : move these into css?
            mod_color_pos_background = 'hsla(130,75%,20%,.95)',
            mod_color_pos_stroke = 'hsla(130,75%,70%,.95)',
            mod_color_neg_background = 'hsla(10,100%,25%,.95)',
            mod_color_neg_stroke = 'hsla(10,100%,70%,.95)',
            mod_color_pos_arrow = 'hsl(90,100%,50%)',
            mod_color_neg_arrow = 'hsl(10,100%,70%)',
            
            tooltips_enabled = false,                                       // Enable Tooltips, displayed for each element of the Whisker
            tooltips_mult = null,                                           // A number, by which each tooltips value should be multiplaied
            tooltips_to_fixed = null,                                       // A number to be used with .toFixed() to control the decimal places displayed
            tooltips_prefix = '',                                           // A prefix to prepend to the Number
            tooltips_postfix = '';                                          // A postfix to append to the Number

            
            
            const generateID = function( prefix, key, length ) {
            
            if( $.type(prefix) !== 'string')
            {
                prefix = '';
            }
            
            if( $.type(length) !== 'number')
            {
                length = 12;
            }
            
            return prefix + window.akdv.utils_string.base64IDFromString(key).split("").reverse().join("").substring(0, length);
        };
            
        
        const durationAccumulator = function(d, i) {
            // avoid simple duration based on index as this tends to leave those at end of list taking a LONG time to appear
            // instead use sin * i to produce stagger but without an ever increasing lag
            let magnitude = transition_duration_total - transition_duration_min - transition_delay_max;
            let ms = transition_duration_min + (magnitude * 0.5) + (Math.sin((i + 0.85) * (1.7 / transition_duration_offset_wavelength_in_rows)) * magnitude);

            return transitions_enabled * ms;
        };


        const delayAccumulator = function(d, i) {
            // avoid simple delay based on index as this tends to leave those at end of list taking a LONG time to appear
            // instead use sin * i to produce stagger but without an ever increasing lag
            let magnitude = transition_delay_max - transition_delay_min;
            let ms = transition_delay_min + (magnitude * 0.5) + Math.abs(Math.sin(i * (1.7 / transition_delay_offset_wavelength_in_rows)) * magnitude);
            
            return transitions_enabled * ms;
        };

        const tooltipFormat = function(number){
            
            var output = number;
            
            if( $.type(tooltips_to_fixed) === 'number' )
            {
                output = number.toFixed(tooltips_to_fixed);
            }
            
            output = tooltips_prefix + output + tooltips_postfix;
            
            return output;
        };

        
        const updateWhiskerAnnotation = function(annoGroup) {

            if( $.type(onDragCancelAnnotations) === 'array' )
            {
                // Close any Annotations passed in, this will MUTE them during a drag of the handle
                onDragCancelAnnotations.forEach(function(annoNamespace) {
                    dispatchCustomEvent(window, 'hide-component', annoNamespace);
                });
            }
            
            if(annoGroup)
            {
                const d = annoGroup.datum();
                const bgRectSel = annoGroup.select('.median-offset-display-bg');
                const textSel = annoGroup.select('.median-offset-display-text');
                const pcChange = d.value.median / d.value['orig_median'];
                const positive = (pcChange <= 1);
                
                // Update visibility
                if( $.type(d.value.orig_median) === 'number' && (d.value.median !== d.value['orig_median']) )
                {
                    annoGroup.classed('changed', true);
                }
                else
                {
                    annoGroup.classed('changed', false);
                }

                // Update Text Content
                const annotationText = Math.abs(pcChange * 100).toFixed(0) + '% / ' + d.value['median'].toFixed(0) + 'ms';
                textSel
                    .attr('dx', function(){ return drag_slider_annotation_bg_rect_height * 1.2; })
                    .text(annotationText);
                
                
                // Update Text Postion
                const xPos = linear_scale(d.value.median);
                const sliderHandleHalfWidth = slider_handle_width * 0.5;
                let xPosition = 0;
                
                if(xPos < chart_width * 0.5)
                {
                    // Position to the RIGHT of slider handle
                    xPosition = xPos + sliderHandleHalfWidth + slider_handle_width;
                }
                else
                {
                    // Position to the LEFT of Slier handle
                    xPosition = ((xPos - sliderHandleHalfWidth) - slider_handle_width) - bgRectSel.node().getBBox().width;
                }
                annoGroup.attr('transform', 'translate(' + xPosition + ',0)');
                
                
                // Update BG-Rect Width
                const textSelWidth = textSel.node().getBBox().width;
                if(textSelWidth !== 0)
                {
                    bgRectSel.attr('width', textSel.node().getBBox().width * 1.6 );
                }
                
                // Update BG-Rect Color
                if( positive && bgRectSel.attr('data-positive') === 'false' )
                {
                    bgRectSel
                        .style('fill', mod_color_pos_background )
                        .style('stroke', mod_color_pos_stroke );
                }

                if( !positive && bgRectSel.attr('data-positive') === 'true' )
                {
                    bgRectSel
                        .style('fill', mod_color_neg_background )
                        .style('stroke', mod_color_neg_stroke );
                }

                if(positive)
                { 
                    bgRectSel.attr('data-positive', true);
                }
                else
                {
                    bgRectSel.attr('data-positive', false);
                }
                           
                
                // Create / Update arrow display
                let arrowPos = annoGroup.select('polygon.annotation-arrow.down');
                let arrowNeg = annoGroup.select('polygon.annotation-arrow.up');
                if (!arrowPos.node())
                { 
                    // Create the POSITIVE change arrow, GREEN arrow, pointing DOWN
                    arrowPos = annoGroup.append('polygon')
                        .attr('class','annotation-arrow down')
                        .attr('points', '0,0 ' + drag_slider_annotation_arrow_height + ',0 ' + (drag_slider_annotation_arrow_height * 0.5) + ',' + drag_slider_annotation_arrow_height)
                        .attr('transform', 'translate(' + (drag_slider_annotation_arrow_height * 0.75) + ',' + (drag_slider_annotation_arrow_height * 0.65) + ')')
                        .style('fill', mod_color_pos_arrow);       
                } 
                
                if (!arrowNeg.node())
                { 
                    // Create the NEGATIVE change arrow, RED arrow, pointing UP 
                    arrowNeg = annoGroup.append('polygon')
                        .attr('class','annotation-arrow up')
                        .attr('points', (drag_slider_annotation_arrow_height * 0.5) + ',0 ' + drag_slider_annotation_arrow_height + ',' + drag_slider_annotation_arrow_height + ' 0,' + drag_slider_annotation_arrow_height)
                        .attr('transform', 'translate(' + (drag_slider_annotation_arrow_height * 0.75) + ',' + (drag_slider_annotation_arrow_height * 0.6) + ')')
                        .style('fill', mod_color_neg_arrow);
                }
                
                if(positive)
                {
                    arrowPos.classed('hidden', false);
                    arrowNeg.classed('hidden', true);
                }
                else
                {
                    arrowPos.classed('hidden', true);
                    arrowNeg.classed('hidden', false);
                }
            }
        };
        
        
        const onDragXStart = function() {

            drag_start_position = d3.event.x;
            drag_end_timer = null;
            drag_end_timer_delay = 50;
            
            onDragStartCallback(d3.event, d3.select(this).data());
        };


        const onDragX = function() {            

            let median_x = d3.event.x;
            let minSliderDrag = linear_scale(drag_value_min * drag_value_min_padding);
            
            if ( d3.select(this).classed('muted') ) {
                return;
            }
            
            if (median_x <= minSliderDrag || median_x > chart_width * 0.975) {
                return;
            }
            
            let selection = d3.select(this.parentNode).classed('changed', true);
            let d = selection.datum();
            
            // Get the original values
            let bottom_whisker = d.value['orig_bottom_whisker'];
            let quartile_bottom = d.value['orig_quartile_bottom'];
            let median = d.value['orig_median'];
            let quartile_top = d.value['orig_quartile_top'];
            let top_whisker = d.value['orig_top_whisker'];

            let slider = this;
     
            let slider_handle = slider.getBBox().width;
            let half_slider_handle = slider_handle * 0.5;
            let original_median_x = linear_scale(median);
            let color_scale_pos = (Math.max(1, median_x) / chart_width) * max_linear_scale_value;

            let median_change_pc = median_x / original_median_x; // The normalized percentage change in the median position, is used to offset ALL other Whisker values
            
            d.median_drag_offset = median_change_pc;

            let ofst_whisker_bottom = median_change_pc * bottom_whisker;
            let ofst_quartile_bottom = median_change_pc * quartile_bottom;
            let ofst_median = median_change_pc * median;      
            let ofst_quartile_top = median_change_pc * quartile_top;
            let ofst_whisker_top = median_change_pc * top_whisker;
            
            let whisker_bottom_pc = linear_scale( Math.max(drag_value_min, ofst_whisker_bottom) );
            let quartile_bottom_pc = linear_scale( Math.max(drag_value_min, ofst_quartile_bottom) );
            let median_pc = linear_scale( Math.max(drag_value_min, ofst_median) );
            let quartile_top_pc = linear_scale( Math.max(drag_value_min, ofst_quartile_top) );
            let whisker_top_pc = linear_scale( Math.max(drag_value_min, ofst_whisker_top) );
            
            let box_width_pc = quartile_top_pc - quartile_bottom_pc;
            
            // Write updated values, back to the datum
            d.value.bottom_whisker = ofst_whisker_bottom;
            d.value.quartile_bottom = ofst_quartile_bottom;
            d.value.median = ofst_median;
            d.value.quartile_top = ofst_quartile_top;
            d.value.top_whisker =  ofst_whisker_top;

            // Update bottom_whisker position
            selection.select('.' + sel_whisker_bottom)
                .attr('x1', whisker_bottom_pc)
                .attr('x2', whisker_bottom_pc);
            
            // Update central dashed line position
            selection.select('.' + sel_center_line)
                .attr('x1', whisker_bottom_pc)
                .attr('x2', whisker_top_pc);
            
            // Update box position
            selection.select('.' + sel_quartile_box)
                .attr('x', quartile_bottom_pc)
                .attr('width', box_width_pc)
                .transition()
                .duration(20)
                .ease(d3.easeCubicOut)
                .style('fill', function(d) { return color_scale(color_scale_pos); });
            
            // Update Slider position
            d3.select(slider)
                .attr('x', median_x - half_slider_handle); 
            
            
            if(tooltips_enabled)
            {
                d3.select(slider).select('title')
                    .text( tooltipFormat(d.value.median) );
            }
            
            // Update median position
            selection.select('.' + sel_median_line)
                .attr('x1', median_x)
                .attr('x2', median_x);
            
            // Update top_whisker position
            selection.select('.' + sel_whisker_top)
                .attr('x1', whisker_top_pc)
                .attr('x2', whisker_top_pc);
            
            updateWhiskerAnnotation( d3.select(slider.parentNode).select('.median-offset-display-group') );  
        };

        
        const onDragXEnd = function(d) {
            
            // If the drag is zero length, or drapped back at zero, skip update
            if (d3.event.x === drag_start_position) { return; }
            
            // Cancel any existing onDragXEnd timers
            if( drag_end_timer )
            {
                window.clearTimeout(drag_end_timer);
            }
             
            var dragXEndEvent = d3.event;
            
            // Handle event, after delay
            drag_end_timer = window.setTimeout(function() {

                let box_whisker_g = d3.select(d3.select(this).node().parentNode);
                
                if( $.type(d) !== 'object')
                { 
                    d = box_whisker_g.datum();
                }

                box_whisker_g.attr('data-change-along-linear-axis', Math.round(linear_scale.invert(dragXEndEvent.x - linear_scale(d.value.median))));
     
                // send along the drag end callback chain the change amount on the linear axis and also the datum
                onDragEndCallback({
                    'drag_offset': d.median_drag_offset,
                    'key': d.key,
                    'group_key': d.value.group_key,
                    'element': this
                });
                
                drag_end_timer = null;
                
            }.bind(this), drag_end_timer_delay);
        };


        const onDragYStart = function() { 

            drag_start_position = d3.event.y;
            drag_end_timer = null;
            drag_end_timer_delay = 50;
            
            onDragStartCallback(d3.event, d3.select(this).data());
        };


        const onDragY = function(d) { 

            // TODO : implement drag y
        };


        const onDragYEnd = function() { 

            if (d3.event.y === drag_start_position) {
                return;
            }

            let box_whisker_g = d3.select(d3.select(this).node().parentNode);
            let d = box_whisker_g.datum();

            box_whisker_g.attr('data-change-along-linear-axis', Math.round(linear_scale.invert(d3.event.x - linear_scale(d.value.median))));
            // send along the drag end callback chain the change amount on the linear axis and also the datum
            onDragEndCallback();
        };


        const boxWhisker = function(selection) {

            let g = selection.append('g')
                .attr('transform', function(d) { 
                    return (orientation === 'y')
                         ? 'translate(' + banded_scale(d.key) + ', ' + (chart_height * -1) + ')' 
                         : 'translate(' + (chart_width * -1) + ', ' + banded_scale(d.key) + ')'; 
                })
                .attr('class', function(d) {
                            return 'box-whisker ' + associated_axis_class;
                 })
                 
                 if(enforce_interactable_enabled)
                 {
                     g.classed('interactable', function(d) {
                         if(d.value.interactable_whisker)
                         {
                             // Whisker interaction allowed
                             return true;
                         }
                     })
                     .classed('non-interactable', function(d) {
                         if(d.value.interactable_whisker === false)
                         {
                             // Whisker interaction stopped
                             return true;
                         }
                     });
                 }

            // center line
            g.append('line')
                .attr('class', 'center-line dashed-line');
            
            // box
            g.append('rect')
                .attr('class', sel_quartile_box);
            
            // median line
            g.append('line')
                .attr('class', sel_median_line);
            
            // bottom whisker
            g.append('line')
                .attr('class', sel_whisker_bottom + ' whisker-line');
            
            // top whisker
            g.append('line') 
                .attr('class', sel_whisker_top + ' whisker-line');

            
            // Whisker Annotations - CREATE
            if(tooltips_enabled)
            {
                g.append('rect')
                    .attr('class', 'whisker-annotation q0')
                        .append('title');
                
                g.append('rect')
                    .attr('class', 'whisker-annotation q1')
                        .append('title');
                
                g.append('rect')
                    .attr('class', 'whisker-annotation q2')
                        .append('title');
                
                g.append('rect')
                    .attr('class', 'whisker-annotation q3')
                        .append('title');
                
                g.append('rect')
                    .attr('class', 'whisker-annotation q4')
                        .append('title'); 
            }

            // Display a Slider handle, centered on the MEDIAN, that can be dragged, to modify the whole Box-Whisker
            if (drag_enabled)
            {
                var sliderDragHandle = g.append('rect')
                    .attr('class','slider-drag-handle draggable-' + orientation)
                    .attr('width', slider_handle_width)
                    .attr('rx', slider_border_radius).attr('ry', slider_border_radius)
                    .call(d3.drag()
                        .on('start', (orientation === 'y')? onDragYStart : onDragXStart)
                        .on('drag', (orientation === 'y')? onDragY : onDragX)
                        .on('end', (orientation === 'y')? onDragYEnd : onDragXEnd))
                        .on('dblclick', function(d) { boxWhisker.revert(d3.select(g.node().parentNode).select('#box-whisker-' + window.akdv.utils_string.base64IDFromString(d.key))); });
                
                // CLICK event handler for the Slider handle
                if (onSliderClickCallback)
                {
                    sliderDragHandle.on('click', onSliderClickCallback);
                }
                
                // DBL-CLICK event handler for the Slider handle
                if ($.type(onSliderDoubleClickCallback) === 'function')
                {
                		sliderDragHandle.on('dblclick', function(data,index,handles){ onSliderDoubleClickCallback( this, data, index, handles, boxWhisker) });
                	}
                
                // Apply tooltip MEDIAN value to handle, as it partially covers the Median area
                if(tooltips_enabled)
                {
                    sliderDragHandle
                        .append('title')
                        .attr('class', 'whisker-annotation slider-drag-handle')
                        .text( function(d){ return tooltipFormat(d.value.median); }  );
                }
                
                
                // median slider change annotation 
                drag_slider_annotation_bg_rect_padding = 0.05;
                drag_slider_annotation_bg_rect_height = banded_scale.bandwidth() * (1 - (drag_slider_annotation_bg_rect_padding * 2));
                drag_slider_annotation_arrow_height = drag_slider_annotation_bg_rect_height * 0.5;

                let median_slider_change_annotation_group = g.append('g')
                    .attr('class','median-offset-display-group');
                
                // median slider change annotation bg rect
                median_slider_change_annotation_group.append('rect')
                    .attr('class','median-offset-display-bg')
                    .attr('rx', 2)
                    .attr('ry', 2)
                    .attr('height', drag_slider_annotation_bg_rect_height)
                    .attr('y', banded_scale.bandwidth() * drag_slider_annotation_bg_rect_padding)
                    .style('fill', mod_color_pos_background)
                    .style('stroke', mod_color_pos_stroke);
                
                // median slider change annotation text
                median_slider_change_annotation_group.append('text')
                    .attr('class','median-offset-display-text')
                    .attr('x', 0)
                    .attr('y', (drag_slider_annotation_bg_rect_height - drag_slider_annotation_bg_rect_height * 0.23) )
                    .attr('dx', '0.8rem')
                    .attr('dy', 0)
                    .attr('text-anchor', 'start')
                    .attr('style', function(){
                        return 'font-size : ' + (drag_slider_annotation_bg_rect_height * 0.6) + 'px;';
                    });
            }
            
            // CLICK event handler, for the whole Whisker group
            if (onClickCallback)
            {
                g.on('click', onClickCallback);
            }
            
            // DBL-CLICK event handler for the whole Whisker group
            if (onDoubleClickCallback)
            {
                g.on('dblclick', onDoubleClickCallback);
            }
        };

        
        boxWhisker.update = function(selection) {

            if (!linear_scale || !banded_scale || !color_scale || !banded_scale.bandwidth)
            {
                throw 'ERROR : missing or misconfigured banded, linear or color scales for box whisker.';
            }

            // Apply a 'muted' class to the Whisker Group, when a muted_property has been set, found, and is TRUTHY
            if( $.type(muted_property) === 'string' )
            {
                selection.classed('muted',function(d) {

                    if( $.type(d.value[muted_property]) === 'boolean')
                    {
                        // Which way should we interpret the boolean?
                        let muted;
                        
                        if(muted_property_truthy)
                        {
                            muted = d.value[muted_property];
                        }
                        else
                        {
                            muted = !d.value[muted_property];
                        }
                        
                        return muted;
                    }
                    else
                    {
                        return false;
                    }
                });
            }
            
            if(enforce_interactable_enabled)
            {
                // Optionally Interactable
                selection
                    .classed('interactable', function(d) {
                        if(d.value.interactable_whisker)
                        {
                            // Whisker interaction allowed
                            return true;
                        }
                    })
                    .classed('non-interactable', function(d) {
                        if(d.value.interactable_whisker === false)
                        {
                            // Whisker interaction allowed
                            return true;
                        }
                    });
            }
            else
            {
                // Always Interactable
                selection
                    .classed('interactable', true);
            }

            
            
            if (orientation === 'x') {
                
                // box-whisker group
                selection
                    .attr('title', function(d) { return d.key; })
                    .attr('id', function(d) { return generateID( 'box-whisker-', d.key, sel_id_size); })
                    .classed('filtered', function(d) { return d.filtered; })
                    .classed('changed', function(d,i) {
                            if( $.type(d.value['orig_median']) === 'number')
                            {
                               if(d.value.median === d.value['orig_median'])
                               {
                                    return false;
                               }
                               else
                               {
                                   return true;
                               } 
                            }
                            else
                            {
                                return false;
                            }
                    })
                    .interrupt()
                    .transition()
                    .duration(durationAccumulator)
                    .delay(delayAccumulator)
                    .ease(d3.easeCubicOut)
                    .attr('transform', function(d) {

                        let y = banded_scale(d.key);

                        return 'translate(0, ' + ((isNaN(y))? 0 : y) + ')';
                    });
                
                // center lines
                selection.select('.' + sel_center_line)
                    .attr('id', function(d) { return generateID( sel_horizontal_line + '-', d.key, sel_id_size); })
                    .attr('y1', function(d) { return banded_scale.bandwidth() * 0.5; })
                    .attr('y2', function(d) { return banded_scale.bandwidth() * 0.5; })
                    .attr('x1', function(d) { return linear_scale(d.value.bottom_whisker); })
                    .attr('x2', function(d) { return linear_scale(d.value.top_whisker); });
                
                // box
                selection.select('.' + sel_quartile_box)
                    .attr('id', function(d) { return generateID( sel_quartile_box + '-', d.key, sel_id_size);})
                    .attr('y', 0)
                    .attr('height', banded_scale.bandwidth())
                    .attr('x', function(d) { return linear_scale(d.value.quartile_bottom); })
                    .attr('width', function(d) { return linear_scale(d.value.quartile_top) - linear_scale(d.value.quartile_bottom); })
                    .interrupt()
                    .transition()
                    .duration(durationAccumulator)
                    .delay(delayAccumulator)
                    .ease(d3.easeCubicOut)
                    .style('fill', function(d) { return color_scale(d.value.median); });
                
                // median line
                selection.select('.' + sel_median_line)
                    .attr('id', function(d) { return generateID( sel_median_line + '-', d.key, sel_id_size);})
                    .attr('y1', 0 )
                    .attr('y2', banded_scale.bandwidth())
                    .attr('x1', function(d) {  return linear_scale(d.value.median); })
                    .attr('x2', function(d) { return linear_scale(d.value.median); });
                
                // bottom whisker
                selection.select('.' + sel_whisker_bottom)
                    .attr('id', function(d) { return generateID( sel_whisker_bottom + '-', d.key, sel_id_size);})
                    .attr('y1', 0)
                    .attr('y2', banded_scale.bandwidth())
                    .attr('x1', function(d) {
                        
                        if(drag_enabled)
                        {
                            return linear_scale(d.value.bottom_whisker);
                        }
                        else
                        {
                            return linear_scale(d.value.bottom_whisker);
                        }
                    })
                        
                    .attr('x2', function(d) { 
                        if(drag_enabled)
                        {
                            return linear_scale(d.value.bottom_whisker);
                        }
                        else
                        {
                            return linear_scale(d.value.bottom_whisker);
                        }
                    });
                
                // top whisker
                selection.select('.' + sel_whisker_top)
                    .attr('id', function(d) { return generateID( sel_whisker_top + '-', d.key, sel_id_size);})
                    .attr('y1', 0)
                    .attr('y2', banded_scale.bandwidth())
                    .attr('x1', function(d) { return linear_scale(d.value.top_whisker); })
                    .attr('x2', function(d) { return linear_scale(d.value.top_whisker); });
                
                
                
                // Whisker Annotations - UPDATE
                if(tooltips_enabled)
                {
                    // Bottom
                    selection.select('.whisker-annotation.q0')
                        .attr('x', function(d) { return linear_scale(d.value.bottom_whisker) - (((linear_scale(d.value.quartile_top) - linear_scale(d.value.quartile_bottom)) * 0.05) * 0.5); })
                        .attr('y', 0)
                        .attr('width', function(d) { return (linear_scale(d.value.quartile_top) - linear_scale(d.value.quartile_bottom)) * 0.05; })
                        .attr('height', banded_scale.bandwidth())
                        .select('title')
                            .text( function(d){ return tooltipFormat(d.value.bottom_whisker); } );
                    
                    // Box-Bottom
                    selection.select('.whisker-annotation.q1')
                        .attr('x', function(d) { return linear_scale(d.value.quartile_bottom) - ((linear_scale(d.value.quartile_top) - linear_scale(d.value.quartile_bottom)) * 0.05) * 0.5; })
                        .attr('y', 0)
                        .attr('width', function(d) { return (linear_scale(d.value.quartile_top) - linear_scale(d.value.quartile_bottom)) * 0.05; })
                        .attr('height', banded_scale.bandwidth())
                        .select('title')
                            .text( function(d){ return tooltipFormat(d.value.quartile_bottom); } );
                    
                    // Median
                    selection.select('.whisker-annotation.q2')
                        .attr('x', function(d) { return linear_scale(d.value.median) - ((linear_scale(d.value.quartile_top) - linear_scale(d.value.quartile_bottom)) * 0.075) * 0.5; })
                        .attr('y', 0)
                        .attr('width', function(d) { return (linear_scale(d.value.quartile_top) - linear_scale(d.value.quartile_bottom)) * 0.075; })
                        .attr('height', banded_scale.bandwidth())
                        .select('title')
                            .text( function(d){ return tooltipFormat(d.value.median); } );
                    
                    // Box-Top
                    selection.select('.whisker-annotation.q3')
                        .attr('x', function(d) { return linear_scale(d.value.quartile_top) - ((linear_scale(d.value.quartile_top) - linear_scale(d.value.quartile_bottom)) * 0.05) * 0.5; })
                        .attr('y', 0)
                        .attr('width', function(d) { return (linear_scale(d.value.quartile_top) - linear_scale(d.value.quartile_bottom)) * 0.05; })
                        .attr('height', banded_scale.bandwidth())
                        .select('title')
                            .text( function(d){ return tooltipFormat(d.value.quartile_top); } );
                    
                    // Top
                    selection.select('.whisker-annotation.q4')
                        .attr('x', function(d) { return linear_scale(d.value.top_whisker) - ((linear_scale(d.value.quartile_top) - linear_scale(d.value.quartile_bottom)) * 0.05) * 0.5; })
                        .attr('y', 0)
                        .attr('width', function(d) { return (linear_scale(d.value.quartile_top) - linear_scale(d.value.quartile_bottom)) * 0.05; })
                        .attr('height', banded_scale.bandwidth())
                        .select('title')
                            .text( function(d){ return tooltipFormat(d.value.top_whisker); } );
                }
                
                if (drag_enabled)
                {
                    // Udate Slider handle position
                    selection.select('.slider-drag-handle')
                        .attr('id', function(d) { return 'slider-drag-handle-' + window.akdv.utils_string.base64IDFromString(d.key); })
                        .attr('height', banded_scale.bandwidth())
                        .attr('width', slider_handle_width)
                        .attr('x', function(d) { return linear_scale(d.value.median) - slider_handle_width * 0.5; });
                    
                    
                    // Update the Drag Offset Annotations
                    selection.nodes().forEach(function(group) {
                        /**
                         * The updateWhiskerAnnotation() method, requires a SINGLE anno group node
                         * So here we get all the g nodes in our selection, find the 'median-offset-display-group' in each
                         * and pass these in
                         */

                         updateWhiskerAnnotation( d3.select(group).select('.median-offset-display-group') );
                    });   
                }
                
            } /*else { // orientation = y

            }*/
        };


        boxWhisker.revert = function(selection) {

            selection
                .classed('changed', false)
                .attr('data-change-along-linear-axis', null);

            boxWhisker.update(selection);
            
            // trigger the optimization event chain
            onDragEndCallback();
        };
        
        
        boxWhisker.reset = function(selection) {

            selection
                .classed('changed', false)
                .attr('data-change-along-linear-axis', null);

            boxWhisker.update(selection);

            // Get the data for this BoxWhisker
            let d = selection.datum();
            
            if( $.type(d) === 'object')
            {
                // We set the sliders offset to 1 (original position)
                d.median_drag_offset = 1;

                // Now trigger an onDragEnd, which will revert the BW to its original position
                onDragEndCallback({
                    'drag_offset': d.median_drag_offset,
                    'key': d.key,
                    'group_key': d.value.group_key,
                    'element': selection.select('.slider-drag-handle').node()
                });  
            }
        };



               
        // ================= Option setters ==================

        boxWhisker.chart_width = function(val) {

          chart_width = val;
          return boxWhisker;
        };


        boxWhisker.chart_height = function(val) {

          chart_height = val;
          return boxWhisker;
        };


        boxWhisker.drag_value_min = function(val) {

            drag_value_min = val;
            return boxWhisker;
        };
        
        
        boxWhisker.drag_value_min_padding = function(val) {

            drag_value_min_padding = val;
            return boxWhisker;
        };


        boxWhisker.transitions_enabled = function(val) {

          transitions_enabled = val;
          return boxWhisker;
        };


        boxWhisker.transition_delay_min = function(val) {

          transition_delay_min = val;
          return boxWhisker;
        };


        boxWhisker.transition_delay_max = function(val) {

          transition_delay_max = val;
          return boxWhisker;
        };
        
        
        boxWhisker.transition_duration_min = function(val) {

          transition_duration_min = val;
          return boxWhisker;
        };


        boxWhisker.transition_duration_total = function(val) {

          transition_duration_total = val;
          return boxWhisker;
        };


        boxWhisker.transition_delay_offset_wavelength_in_rows = function(val) {

          transition_delay_offset_wavelength_in_rows = val;
          return boxWhisker;
        };


        boxWhisker.transition_duration_offset_wavelength_in_rows = function(val) {

          transition_duration_offset_wavelength_in_rows = val;
          return boxWhisker;
        };


        boxWhisker.associated_axis_class = function(val) {

            associated_axis_class = val;
            return boxWhisker;
        };


        boxWhisker.drag_enabled = function(val) {

            drag_enabled = val;
            return boxWhisker;
        };


        boxWhisker.slider_enabled = function(val) {

            slider_enabled = val;
            return boxWhisker;
        };


        boxWhisker.slider_border_radius = function(val) {

            slider_border_radius = val;
            return boxWhisker;
        };


        boxWhisker.orientation = function(val) {

            orientation = val;
            return boxWhisker;
        };

        boxWhisker.muted_property = function(val) {

            muted_property = val;
            return boxWhisker;
        };

        boxWhisker.muted_property_truthy = function(val) {

            muted_property_truthy = val;
            return boxWhisker;
        };

        boxWhisker.linear_scale = function(val) {

            linear_scale = val;
            return boxWhisker;
        };


        boxWhisker.banded_scale = function(val) {

            banded_scale = val;
            return boxWhisker;
        };


        boxWhisker.color_scale = function(val) {

            color_scale = val;
            return boxWhisker;
        };


        boxWhisker.max_linear_scale_value = function(val) {

            max_linear_scale_value = val;
            return boxWhisker;
        };


        boxWhisker.onDragStartCallback = function(fn) {

          onDragStartCallback = fn;
          return boxWhisker;
        };


        boxWhisker.onDragEndCallback = function(fn) {

          onDragEndCallback = fn;
          return boxWhisker;
        };

        
        boxWhisker.onDragCancelAnnotations = function(array) {

            onDragCancelAnnotations = array;
            return boxWhisker;
          };
          
        
        boxWhisker.onClickCallback = function(fn) {

          onClickCallback = fn;
          return boxWhisker;
        };

        
        boxWhisker.onDoubleClickCallback = function(fn) {

            onDoubleClickCallback = fn;
            return boxWhisker;
        };

        
        boxWhisker.onSliderClickCallback = function(fn) {

            onSliderClickCallback = fn;
            return boxWhisker;
        };
        
        boxWhisker.onSliderDoubleClickCallback = function(fn) {

            onSliderDoubleClickCallback = fn;
            return boxWhisker;
        };

        
        boxWhisker.enforce_interactable_enabled = function(val) {

            enforce_interactable_enabled = val;
            return boxWhisker;
        };
        
        boxWhisker.tooltips_enabled = function(val) {

            tooltips_enabled = val;
            return boxWhisker;
        };
          
        
        boxWhisker.tooltips_mult = function(val) {

            tooltips_mult = val;
            return boxWhisker;
        };
        
        
        boxWhisker.tooltips_to_fixed = function(val) {

            tooltips_to_fixed = val;
            return boxWhisker;
        };
      
        
        boxWhisker.tooltips_prefix = function(val) {

            tooltips_prefix = val;
            return boxWhisker;
        };
        
        
        boxWhisker.tooltips_postfix = function(val) {

            tooltips_postfix = val;
            return boxWhisker;
        };
        

        return boxWhisker;
    };


}(window, document, window.d3, window.akdv.utils_event.dispatchCustomEvent));