;(function(window, document, d3, addLocalizedString) {

    'use strict';

    window.D3ThresholdLine = function() {

        
        /** ================ Options / Defaults ================== */
        var chart_width = 0,                                    // REQUIRED
        chart_height = 0,                                       // REQUIRED
        linear_scale = false,                                   // REQUIRED
        orientation = 'X',                                      // Orientation of line, can be X, or Y
        
        transitions_enabled = true,
        transitions_duration = 500,
        transitions_ease = d3.easeCubicOut,
        
        line_group_opacity = null,
        group_container_id = null,                              // REQUIRED
        line_height_element_selector_A = null,
        line_height_element_selector_B = null,
        group_css_class = 'threshold-line-group',
        line_position_property = null,                          // REQUIRED
        
        line_container_id = null,
        line_css_class = 'line',
        
        label_display = false,
        label_css_class = 'threshold-label-group',
        label_container_id = '',                                // A % offset from the top of the chart, for the labels position 
        label_text = '',
        label_offset = 0,
        label_margin = 0.2,
        
        
        tLineGroup = null,
        tLine = null,
        tLabelGroup = null,
        tLabelLine = null,
        tLabelText = null;

        
        
        /** ================ Init Threshold ================== */
        let thresholdLine = function(data) {
        };


        thresholdLine.calc_height = function() {
            
            let dim_A, dim_B, El_A, El_B;
            
            if( typeof line_height_element_selector_A === 'string')
            {
                El_A = d3.select(line_height_element_selector_A);                  
            }
            else
            {
                El_A = d3.select(group_container_id);  
            }
            
            if( El_A.node() instanceof SVGElement )
            {
                dim_A = El_A.node().getBBox();   
            }
            else 
            {
                dim_A = El_A.node().getBoundingClientRect();  
            }
            
            
            if( typeof line_height_element_selector_B === 'string')
            {
                El_B = d3.select(line_height_element_selector_B);                  
            }
            else
            {
                El_B = d3.select(group_container_id);  
            }
            
            if( El_B.node() instanceof SVGElement )
            {
                dim_B = El_B.node().getBBox();   
            }
            else 
            {
                dim_B = El_B.node().getBoundingClientRect();  
            }
            
            
            return Math.max(dim_A.height, dim_B.height)
        };
        
        
        /** ================ Update Text Cell ================== */
        thresholdLine.update = function(data) {

            if( $.type(data[line_position_property]) === 'number' )
            {
                const xPos = linear_scale(data[line_position_property]);

                // Intial Creation of All Line Elements
                if(!tLineGroup) 
                {
                    tLineGroup = d3.select(group_container_id)
                        .append('g')
                        .attr('class', group_css_class)
                        .attr('opacity', function(){
                            if( $.type(line_group_opacity) === 'function' ) {
                                return line_group_opacity(data);
                            }
                            else if( $.type(line_group_opacity) === 'number' ) {
                                return line_group_opacity;
                            }
                            else {
                                return 1;
                            }
                        })
                        .attr('transform', 'translate( 0, 0 )');
                    
                    
                    tLine = tLineGroup
                        .append('line')
                        .attr('class',line_css_class)
                        .attr('x1', xPos)
                        .attr('x2', xPos)
                        .attr('y1', 0)
                        .attr('y2', () => { return thresholdLine.calc_height(); } )
                    
                    if(label_display)
                    {
                        var labelLocation;
                        var locationHeight = 0;
                        var labelOffset = 0;
                        var labelMargin = 0;
                        
                        if( $.type(label_margin) === 'number' ) {
                            // Convert the REMS margin, into pixels, required for SVG placement
                            labelMargin = window.akdv.utils_css.remsToPixels(label_margin);
                        }
                        
                        if( $.type(label_offset) === 'number' ) {
                            // Convert the REMS offset, into pixels, required for SVG placement
                            labelOffset = window.akdv.utils_css.remsToPixels(label_offset);
                        }

                        if( $.type(label_container_id) === 'string' && label_container_id.length > 0 ) {
                            
                            var labContainer = $(label_container_id);
                            locationHeight = labContainer.height(); 
                            
                            if( labContainer.find('svg').length === 0 ) {    
                                d3.select(label_container_id).append('svg').attr('viewBox', '0 0 ' + labContainer.width() +' ' + labContainer.height() );
                            }
                            
                            labelLocation = d3.select(label_container_id + ' svg');
                        }
                        else
                        {
                            labelLocation = tLineGroup;
                        }
                        
                        tLabelGroup = labelLocation
                            .append('g')
                            .attr('opacity', function(){
                                if( $.type(line_group_opacity) === 'function' ) {
                                    return line_group_opacity(data);
                                }
                                else if( $.type(line_group_opacity) === 'number' ) {
                                    return line_group_opacity;
                                }
                                else {
                                    return 1;
                                }
                            })
                            .attr('class',label_css_class);
                        
                        tLabelLine = tLabelGroup
                            .append('line')
                            .attr('class',line_css_class)
                            .attr('x1', xPos)
                            .attr('y1', locationHeight - labelOffset)
                            .attr('x2', xPos)
                            .attr('y2', locationHeight);
                            
                        tLabelText = tLabelGroup
                            .append('text')
                            .attr('text-anchor','middle')
                            .attr('dx', xPos )
                            .attr('dy', (locationHeight - labelOffset) - labelMargin );
                            
                            if( $.type(label_text) === 'object' )
                            {
                                // Allow text to be produced, using a function
                                label_text.func(tLabelText,data);
                            }
                            else if( $.type(label_text) === 'string')
                            {
                                // Or a fixed text string
                                tLabelText.text( label_text );
                            }
                            else
                            {
                                // You should really define SOMETHING for a label!
                                window._log.warn('No viable string was defined for this LABEL, please have a looksie and fix!');
                            }   
                           
                    }
                }
                else // Elements created, so Update them
                {
                    // Pop each line, to the end of its SVG container, ensuring it is on-top
                    var lineGroupNode = tLineGroup.node();
                    var lastGroupNode = $(lineGroupNode.parentNode).find("g:last").get(0);
                    $(lineGroupNode).detach().insertAfter(lastGroupNode);
                                        
                    // Label Text (cant be animated...)
                    if( $.type(label_text) === 'object' )
                    {
                        // Allow text to be produced, using a function
                        label_text.func(tLabelText,data);
                    }
                    else if( $.type(label_text) === 'string')
                    {
                        // Or a fixed text string
                        tLabelText.text( label_text );
                    }
                    else
                    {
                        // You should really define SOMETHING for a label!
                        window._log.warn('No viable string was defined for this LABEL, please have a looksie and fix!');
                    } 
                        
                    
                    if(transitions_enabled) { // Do ANIMATED updates
                        
                        // Line Group
                        tLineGroup
                            .interrupt().transition().duration(transitions_duration).ease(transitions_ease)
                            .attr('opacity', function(){
                                if( $.type(line_group_opacity) === 'function' ) {
                                    return line_group_opacity(data);
                                }
                                else if( $.type(line_group_opacity) === 'number' ) {
                                    return line_group_opacity;
                                }
                                else {
                                    return 1;
                                }
                            });
                        
                        // Label Group
                        tLabelGroup
                            .interrupt().transition().duration(transitions_duration).ease(transitions_ease)
                            .attr('opacity', function(){
                                if( $.type(line_group_opacity) === 'function' ) {
                                    return line_group_opacity(data);
                                }
                                else if( $.type(line_group_opacity) === 'number' ) {
                                    return line_group_opacity;
                                }
                                else {
                                    return 1;
                                }
                            });
                        
                        // Line
                        tLine.interrupt()
                            .interrupt().transition().duration(transitions_duration).ease(transitions_ease)
                            .attr('x1', xPos)
                            .attr('x2', xPos)
                            .attr('y2', () => { return thresholdLine.calc_height(); } );
                        
                            
                        // Line continuation for Label
                        tLabelLine
                            .interrupt().transition().duration(transitions_duration).ease(transitions_ease)
                            .attr('x1', xPos)
                            .attr('x2', xPos);
                        
                        // Text
                        tLabelText
                            .interrupt().transition().duration(transitions_duration).ease(transitions_ease)
                            .attr('dx', xPos );
                        
                    }
                    else // Or just do updates instantly
                    {
                        // Line Group
                        tLineGroup
                            .attr('opacity', function(){
                                if( $.type(line_group_opacity) === 'function' ) {
                                    return line_group_opacity(data);
                                }
                                else if( $.type(line_group_opacity) === 'number' ) {
                                    return line_group_opacity;
                                }
                                else {
                                    return 1;
                                }
                            });
                        
                        // Label Group
                        tLabelGroup
                            .attr('opacity', function(){
                                if( $.type(line_group_opacity) === 'function' ) {
                                    return line_group_opacity(data);
                                }
                                else if( $.type(line_group_opacity) === 'number' ) {
                                    return line_group_opacity;
                                }
                                else {
                                    return 1;
                                }
                            });
                        
                        // Line
                        tLine
                            .attr('x1', xPos)
                            .attr('x2', xPos)
                            .attr('y2', () => { return thresholdLine.calc_height(); } );
                        
                        // Line continuation for Label
                        tLabelLine
                            .transition().duration(transitions_duration).ease(transitions_ease)
                            .attr('x1', xPos)
                            .attr('x2', xPos);
                        
                        // Text
                        tLabelText
                            .attr('dx', xPos );
                    }

                }
            } 
        };
        
        
        
        
        /** ================  Getters / Setters ================== */
        thresholdLine.chart_width = function(val) {
            chart_width = val;
            return thresholdLine;
        };
        
        thresholdLine.chart_height = function(val) {
            chart_height = val;
            return thresholdLine;
        };
        
        thresholdLine.linear_scale = function(val) {
            linear_scale = val;
            return thresholdLine;
        };

        thresholdLine.transitions_enabled = function(val) {
          transitions_enabled = val;
          return thresholdLine;
        };
        
        thresholdLine.group_container_id = function(val) {
            group_container_id = val;
              return thresholdLine;
        };
        
        thresholdLine.group_container_id = function(val) {
            group_container_id = val;
              return thresholdLine;
        };
        
        thresholdLine.line_height_element_selector_A = function(val) {
            line_height_element_selector_A = val;
              return thresholdLine;
        };
        
        thresholdLine.line_height_element_selector_B = function(val) {
            line_height_element_selector_B = val;
              return thresholdLine;
        };
        
        thresholdLine.group_css_class = function(val) {
            group_css_class = val;
              return thresholdLine;
        };
        
        thresholdLine.line_position_property = function(val) {
            line_position_property = val;
              return thresholdLine;
        };

        thresholdLine.line_container_id = function(val) {
            line_container_id = val;
              return thresholdLine;
        };

        thresholdLine.line_css_class = function(val) {
            line_css_class = val;
              return thresholdLine;
        };

        thresholdLine.label_display = function(val) {
            label_display = val;
              return thresholdLine;
        };

        thresholdLine.label_css_class = function(val) {
            label_css_class = val;
              return thresholdLine;
        };

        thresholdLine.label_container_id = function(val) {
            label_container_id = val;
              return thresholdLine;
        };
        
        thresholdLine.label_text = function(val) {
            label_text = val;
              return thresholdLine;
        };

        thresholdLine.label_offset = function(val) {
            label_offset = val;
              return thresholdLine;
        };
        
        thresholdLine.label_margin = function(val) {
            label_margin = val;
              return thresholdLine;
        };
        
        thresholdLine.line_group_opacity = function(val) {
            line_group_opacity = val;
              return thresholdLine;
        };
        
        
        
        
        
        
        return thresholdLine;
    }


}(window, document, window.d3, window.akdv.utils_lang.addLocalizedString));