;(function(window, document, $, d3, crossfilter, D3Line) {

	'use strict';
		
    var defaults = {
            
          event_namespace_chart_data_update : '',
          chart_container_id : '',
          container_id : '',
          
          event_namespace_optimization : false,
          dataOptimizationFunction : false,
          
          trans_enabled : true,
          trans_duration : 600,
          trans_type : d3.easeCubicOut,
          
          margins : {
              top : 0,
              bottom : 0.055,
              left : 0.13,
              right : 0.12
          },
          
          xf_dimensions : [ // A list of dimension string to use as data keys
             //  'load_duration'   
          ],

          axis : [ // An array of axis to be displayed
            //  {
               //   axis : 'load_duration',           // The data to use to define the RANGE for this Axis 
               //   data_ranges : ['load_duration'],  // A list of data ranges, used to define the MAX value for this axis, where say, multiple line data sets are shown
               //   range_padding : 1.0,              // A multiplier for the max value on this axis, allows 'padding' to be added for the axis
               //   orientation : 'bottom',           // top,bottom,left,right ~ Where the Axis will be displayed
               //   class_name : 'load-duration',     // The CSS class to be used for this axis
                  
               //   label_text : 'Load Duration',     // The Text legend to be displayed on this axis
               //  label_inset : 0.7,                // A normalized percentage of the axis margin to inset the Legend by
                  
               //   tick_count : 6,                   // How many ticks to sub-divide the range by, EVEN numbers give a center tick...
               //   ticks_to_fixed : 1,               // How many decimal places to use on the displayed Tick Text
               //   ticks_prefix : '',                // A Prefix to apply to each Tick Text Value i.e. $, £
               //   ticks_postfix : 's'               // A Postfix to apply to each Tick Text Value i.e. %, s, secs
            //  }
          ],
          
          lines : [ // A list of LINES / AREA's to be drawn
            //  {
                //  x_axis : 'load_duration',                 // Key to be used for this lines X axis RANGE , should match .axis property in axis array (see above)
                //  y_axis : 'conversion_rate',               // Key to be used for this lines Y axis RANGE , should match .axis property in axis array (see above)
                  
                //  x_data_property : 'load_duration',        // The X Axis data to be used for this line
                //  y_data_property : 'pre_conversion_rate',  // The y Axis data to be used for this line
                  
                //  class_name : 'pre-conversion-rate',       // The CSS class to be applied to this line
                //  show_line : true,                         // Display an SVG LINE (path) for this item
                //  show_area : true,                         // Display an SVG AREA (path) for this item
                  
                //  trans_delay : 0                           // A transition delay to apply to this line, allows each lines transition to be staggered
            //  }
          ]
    };
    
    
    // -------------------------
    
    
	window.getLineComparision = function(_opts) {
	   
	    var opts = $.extend({}, defaults, _opts);
	    var xf = crossfilter();
	    var outerContainer = $(opts.chart_container_id);
	    var chart_svg = window.d3AppendSVGWithResponsiveAttributesToID(opts.container_id);
	    var originalResult = null;
	    var chartLines = { lines:{}, areas:{} };
	    var chartResizing = false;
	    
	    
	    
	    /** Provides context based transitions */
        var lineTransition = function(l) {

            var delay = 0;
            var duration = 0;
            var type = $.type(l.trans_type) === 'object' ? l.trans_type : opts.trans_type;
            
            if( opts.trans_enabled && !chartResizing ) {
                delay = $.type(l.trans_delay) === 'number' ? l.trans_delay : 0;
                duration = $.type(l.trans_duration) === 'number' ? l.trans_duration : opts.trans_duration; 
            }
            
            return d3.transition().delay( delay ).duration( duration ).ease( type );
        } 
        
        
        /** ================================== DRAW CHART ====================================== */
        var drawChart = function(resizing) {

            chartResizing = resizing;
            
            var data = xf.all();
                        
            // Set the dimensions and margins of the graph
            var margin = {
                top : function(){
                    return parseInt( outerContainer.outerHeight() * opts.margins.top );
                },
                bottom : function(){
                    return parseInt( outerContainer.outerHeight() * opts.margins.bottom );
                },
                left : function(){
                    return parseInt( outerContainer.outerWidth() * opts.margins.left );
                },
                right : function(){
                    return parseInt( outerContainer.outerWidth() * opts.margins.right );
                }
            };
             
            // Layout Calc
            var chartWidth = function(){
                return parseInt( $(opts.container_id).outerWidth() );
            }
            
            var chartHeight = function(){
                return parseInt( $(opts.container_id).outerHeight() );   
            }
    
            var chartWidthSansMargins = function(){
                return chartWidth() - margin.left() - margin.right();
            }
            
            var chartHeightSansMargins = function(){
                return chartHeight() - margin.top() - margin.bottom();    
            }

            
            // Set Chart SVG element size
            chart_svg.attr('viewBox','0 0 ' + chartWidth() + ' ' + chartHeight() );
 
            
            
            /** ===================  DIMENSIONS / GROUPS ==================== */ 
            var dims = {}, dimGroups = {}, dimGroupMax = {};
            
            opts.xf_dimensions.forEach(function(dim,i) {
                
                // Create a set of dimension objects
                dims[dim] = xf.dimension(function(d){
                    return d[dim];
                });
                
                // Create a set of dimension group objects
                dimGroups[dim] = dims[dim].group().reduce( function(p,d) {
                    p = {}; 
                    p[dim] = d[dim];
                    return p;
                },

                function(p,d) {
                    return p;
                },

                function() {
                    var p = {}; 
                    p[dim] = 0;
                    return p;
                });

                // Calculate a maximum value for each dimension group
                dimGroupMax[dim] = d3.max( dimGroups[dim].all(), function(d) {
                  return d.value[dim];
                });
            });
            
            
            
            /** =============== Generate Axis ================ */
            var axisRange = {}, d3Axis = {};
            
            opts.axis.forEach(function(d,i) {

                var axis_max_count = 0; // Calculate the max value of ALL data ranges provided for this axis.
                d.data_ranges.forEach(function(prop,index){
                    
                    var groupMax = dimGroupMax[prop];
                    
                    // Only try to Max the current dimGroupMax[prop], if its a number, otherwise it will corrupt the data
                    if( $.type(groupMax) === 'number') {
                        axis_max_count = Math.max(axis_max_count * d.range_padding, groupMax * d.range_padding);
                    }
                })

                // Define range min/max values, for Y axis, we often need to invert this range, as SVG has 0 at its top...
                var rangeMin = 0, rangeMax = axis_max_count;
                if( d.range_invert ) {
                    rangeMin = axis_max_count;
                    rangeMax = 0;
                }

                
                switch(d.orientation) {
                    case 'top':
                        axisRange[d.axis] = d3.scaleLinear().range([0,chartWidthSansMargins()]).domain([rangeMin, rangeMax]);
                        break;
                        
                    case 'bottom':
                        axisRange[d.axis] = d3.scaleLinear().range([0,chartWidthSansMargins()]).domain([rangeMin, rangeMax]);
                        break;
                        
                    case 'left':
                        axisRange[d.axis] = d3.scaleLinear().range([0,chartHeightSansMargins()]).domain([rangeMin,rangeMax]);
                        break;
                        
                    case 'right':
                        axisRange[d.axis] = d3.scaleLinear().range([0,chartHeightSansMargins()]).domain([rangeMin,rangeMax]);
                        break;
                }
                
               
                /** =============== Draw Axis / Ticks ================ */
                var axisTransX = 0, axisTransY = 0;
                
                // Define orientation sensative values
                switch(d.orientation) {
                    case 'top':
                        axisTransX = margin.left();
                        d3Axis[d.axis] = d3.axisTop( axisRange[d.axis] );
                        break;
                        
                    case 'bottom':
                        axisTransX = margin.left();
                        axisTransY = chartHeight() - margin.bottom();
                        d3Axis[d.axis] = d3.axisBottom( axisRange[d.axis] );
                        break;
                        
                    case 'left':
                        axisTransX = margin.left();
                        d3Axis[d.axis] = d3.axisLeft( axisRange[d.axis] );
                        break;
                        
                    case 'right':
                        axisTransX = chartWidth() - margin.right();
                        d3Axis[d.axis] = d3.axisRight( axisRange[d.axis] );
                        break;
                }
                
                
                // Create Axis Values / Ticks data
                var tickValues = [], tickFormat = [];
                
                for( i = 0; i <= d.tick_count; i++ )
                {
                    var val = (axis_max_count / d.tick_count) * i;
                    tickValues.push( val );
                    tickFormat.push( d.ticks_prefix + (val).toFixed( d.ticks_to_fixed ) + d.ticks_postfix );
                }
                
                
                /** ======= Draw Axis ======= */
                // Remove
                chart_svg.select('g.axis.' + d.class_name ).remove();
                
                // Create Axis Group
                var thisAxis = chart_svg
                    .append('g')
                    .attr('class', 'axis ' + d.class_name )
                    .attr('transform', 'translate(' + axisTransX + ',' + axisTransY + ')' )
                    .call( d3Axis[d.axis].tickValues( tickValues ).tickFormat( function(d,i) { return tickFormat[i]; }) );

                
                
                /** =============== Draw Axis Legends ================ */
                var trans_x = 0;
                var trans_y = 0;
                var rot = 0;
                
                switch(d.orientation) {
                    case 'top':
                        trans_x = margin.left() + (chartWidthSansMargins() * 0.5);
                        trans_y = chartHeightSansMargins() + (margin.top() * d.label_inset);
                        break;
                        
                    case 'bottom':
                        trans_x = margin.left() + (chartWidthSansMargins() * 0.5);
                        trans_y = chartHeightSansMargins() + (margin.bottom() * d.label_inset);
                        break;
                        
                    case 'left':
                        rot = -90;
                        trans_x = margin.left() * d.label_inset;
                        trans_y = chartHeightSansMargins() * 0.5;
                        break;
                        
                    case 'right':
                        rot = -90;
                        trans_x = chartWidth() - (margin.right() * d.label_inset);
                        trans_y = chartHeightSansMargins() * 0.5;
                        break;
                }

                chart_svg.select('g.axis.legend.' + d.class_name ).remove();
                  
                chart_svg
                    .append('g')
                    .attr('transform','translate(' + trans_x + ', ' + trans_y + ') rotate(' + rot +')')
                    .attr('class','axis legend ' + d.class_name )
                    .append('text')
                    .text( d.label_text )
                    .style('text-anchor','middle');
            });
            

            
            
            /**================================= Generate Lines =================================== */
            
            opts.lines.forEach(function(line,index) {
                
                /** ========== Create Line Data ========== */
                var xKey = line.x_data_property;
                var yKey = line.y_data_property;
                
                // If no MAX dimension has been defined for this line, skip drawing it, we dont have the necassary data
                if( $.type(dimGroupMax[yKey]) !== 'number' ) {
                  return; 
                }
 
                var lineDimension = d3.scaleLinear().range([chartHeightSansMargins(), 0]).domain([0, dimGroupMax[yKey]]);
                    
                // Create line dimensions data
                var xAxis = data.map( function(d,i) {
                    return axisRange[line.x_axis](d[xKey]);
                });
                
                var yAxis = data.map( function(d,i) {
                    return axisRange[line.y_axis](d[yKey]);
                });
                
                
                /** =========== Draw Lines ============ */
                var pathData;
                
                if( line.show_line )
                {
                    var existingLine = chartLines.lines[yKey];
                    
                    if( existingLine ) {
                        
                        // Update LINE d
                        pathData = new D3Line()
                        .data_array( data )
                        .x_axis( xAxis )
                        .y_axis( yAxis )();
                        
                        existingLine.select('path')
                            .transition( lineTransition(line) )
                            .attr('d', pathData );
                        
                        // Update LINE Position
                        d3.select(opts.container_id + '-svg .line.' + line.class_name).attr('transform', 'translate(' + margin.left() + ' 0)');
                        
                    } else {

                        // Create LINE
                        new D3Line()
                            .selection(opts.container_id + '-svg')
                            .class_name('line ' + line.class_name)
                            .data_array( data )
                            .x_axis( xAxis )
                            .y_axis( yAxis )();
                        
                        chartLines.lines[yKey] = d3.select(opts.container_id + '-svg .line.' + line.class_name);
                            
                        // Position LINE
                        d3.select(opts.container_id + '-svg .line.' + line.class_name).attr('transform', 'translate(' + margin.left() + ' 0)');
                    }
                }
                
                // Draw the AREA
                if( line.show_area )
                {
                    var existingArea = chartLines.areas[yKey];
                    if( existingArea ) {
                        
                        // Update AREA d
                        pathData = new D3Line()
                        .area(true)
                        .data_array( data )
                        .x_axis( xAxis )
                        .y_axis( yAxis )();
                        
                        existingArea.select('path')
                            .transition( lineTransition(line) )
                            .attr('d', pathData );
                        
                        // Update AREA Position
                        d3.select(opts.container_id + '-svg .area.' + line.class_name).attr('transform', 'translate(' + margin.left() + ' 0)');
                        
                    } else {
                        
                        // Create AREA
                        new D3Line()
                            .selection(opts.container_id + '-svg')
                            .class_name('area ' + line.class_name)
                            .area(true)
                            .data_array( data )
                            .x_axis( xAxis )
                            .y_axis( yAxis )();
                        
                        chartLines.areas[yKey] = d3.select(opts.container_id + '-svg .area.' + line.class_name);
                        
                        // Position AREA
                        d3.select(opts.container_id + '-svg .area.' + line.class_name).attr('transform', 'translate(' + margin.left() + ' 0)');
                    }
                }

            });
            
            chartResizing = false;
        }
        
        
        /** ================ UPDATE ================= */
        var updateData = function(e, result) {

            if (!result || !result.data) {
                
                window._log.warn('update chart triggered without data');
                return;
                
            } 
            
            // populate the crossfilter
            xf.remove();
            xf.add(result.data);
            drawChart();
            
            //modifyData(result);
        }
        
        
	    /** ================ OPTIMIZATION EVENT ================= */
	    var onOptimizationEvent = function(e) {

            let data = $.extend(true, [], xf.all());

            opts.dataOptimizationFunction(data);
            updateData(null, { data: data });
        };

        
        /** Modifies existing data, in a random way, to allow for data Update testing */
        var modifyData = function(result) {
            
            if( !originalResult ) {
                originalResult = result;
            }
            
            setTimeout(function(){
                
                var newResult = jQuery.extend( true, {}, originalResult );
                
                newResult.data.forEach( function(d,i){
                    
                    $.each(d, function(key,index) {
                        
                        var mult = 0.2;
                        if( key === 'load_duration' ){
                            mult = 0.05;
                        }
                        
                        if( $.type( d[key] ) === 'number' ) {
                            d[key] += d[key] * ((Math.random() - 0.5) * mult);
                        }
                    });
                });
 
                //updateData(null, newResult);
                
            }, 5000);
        }

        
        
        if (typeof opts.dataOptimizationFunction === 'function' && opts.event_namespace_optimization) {
            $(window).on('optimization.' + window.akdv.utils_string.snakeToKebabCase(opts.event_namespace_optimization), onOptimizationEvent);
        }
        
        $(window).on('result.' + opts.event_namespace_chart_data_update, updateData);
        $(window).on('resize-charts.akdv', drawChart.bind(this,true) );
        
	    return chart_svg;
	};
	

}(window, document, window.jQuery, window.d3, window.crossfilter, window.D3Line));