;(function(window, document, $, d3, crossfilter) {

    'use strict';
    
	window.D3Line = function() {

	    var selection = '',
	    class_name = '',
	    area = false,
	    data_array,
	    x_axis,
	    y_axis,
	    x_axis_repeat_last = true; // Duplicate the last item in a line, to ensure it ends in a linea manner vs right hand Y axis line

    	
    	/** ================ DRAW ================ */
    	var chart = function() {

    		var chartEl = null;
            if( $.type(selection) === 'string' && selection.length )
            { 
                chartEl = d3.select(selection);
            }
            else if( $.type(selection) === 'object' )
            { 
                chartEl = d3.select(selection);
            }

    		var shape;
    		if( area ) {
    		    shape = d3.area()
    		        .curve( d3.curveCatmullRom )
    		        .x(function(d,i) { return x_axis[i]; })
    		        .y0(y_axis[0])
    		        .y1(function(d,i) { return y_axis[i]; });     
    		}
    		else
    	    {
                if ( x_axis_repeat_last ) {
                    x_axis.push( x_axis[x_axis.length - 1] );
                    y_axis.push( y_axis[y_axis.length - 1] );
                }
                    
    		    shape = d3.line()
                .curve( d3.curveCatmullRom )
                .x(function(d,i) { return x_axis[i]; })
                .y(function(d,i) { return y_axis[i]; })  
    	    }

    		
    		if( chartEl ) {
    		    
    		    // Append the Shape to the DOM if we are passed a selection
    		    chartEl
        		    .append('g')
                    .attr( 'class', class_name )
                    .append( 'path' )
                    .datum( data_array )
                    .attr( 'd', shape );
            
    		} else {
    		    
    		    //Otherwise, just return the 'd', path string contents
    		    return d3.select( document.createElement('span') )
        		    .append( 'path' )
                    .datum( data_array )
                    .attr( 'd', shape )
                    .attr('d');  
    		}
    	};
    	
    	//------------------------------------
    	
    	
    	
    	// getter and setter functions.
        chart.selection = function(value) {
            if (!arguments.length) { return selection; }
            selection = value;
            return chart;
        };
        
        chart.class_name = function(value) {
            if (!arguments.length) { return class_name; }
            class_name = value;
            return chart;
        };
        
        chart.area = function(value) {
            if (!arguments.length) { return area; }
            area = value;
            return chart;
        };
        
        chart.data_array = function(value) {
            if (!arguments.length) { return data_array; }
            data_array = value;
            return chart;
        };
        
        chart.x_axis = function(value) {
            if (!arguments.length) { return x_axis; }
            x_axis = value;
            return chart;
        };
        
        chart.y_axis = function(value) {
            if (!arguments.length) { return y_axis; }
            y_axis = value;
            return chart;
        };

        return chart;
	}
	
}(window, document, window.jQuery, window.d3, window.crossfilter));