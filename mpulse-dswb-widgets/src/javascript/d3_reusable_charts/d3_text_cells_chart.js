;(function(window, document, $, d3, D3TextCell) {

	'use strict';

    var defaults = {
        event_namespace_chart_data_update : '', // String ~ The unique 'chart_group' id, for this charts data 
        event_namespace_for_modified_data : '',
        
        transform_incomming_data_function : null,
        combine_data_with_cells_function : null,
        
        flash_cells_on_update : true,
        flash_cells_selectors : [],
        
        delay_updateData : 16,
        
        container_id : '', // String ~ The ID of the chart element this chart is to be drawn within
        cells : [
            
            /**
             * An Array of objects, each defining a text CELLs location and formatting parameters
             * Each CELL object, has properties added from the DATA array, where a matching 'property' property is found
             * This allows for a combination of static styling defs in cells[], with dynamic data comming in from data[]
             * 
             * 
             * ______Properties______
             * property : STRING ~ A property name string, to be used to match this cell, with an entry in the updated dynamic data
             * color_propery : STRING ~ A CSS color specification, if found, it will be applied as the MAIN text color
             * group_selector : STRING ~ The CSS style selector, used to selected an element on the page, into which your CELL will be added
             * css_class : STRING ~ The CSS class to be used to identify this cell
             * 
             * fmt_currency : BOOLEAN ~ Fromat the value as a currency, requires fmt_currency_iso to define currency, and optionally fmt_decimal_places
             * fmt_currency_iso : STRING ~Defines what currency to format as i.e. USD, GBP, YEN etc
             * fmt_mult : FLOAT ~ ill be used to modify (multiply) incomming .value before it is displayed
             * fmt_decimal_places : INT ~ How many decimal places to format the .value number, for display
             * fmt_absolute_number : BOOLEAN ~ Should the number be made absolute for display
             * 
             * text_postfix_string : STRING ~ A string you wish to display AFTER your value
             * text_postfix_subscript : BOOLEAN ~ Should the postfix be displayed as sub-script
             * text_postfix_supercript : BOOLEAN ~ Should the postfix be displayed as super-script
             * 
             * text_prefix_string : STRING ~ A string you wish to display BEFORE your value
             * text_prefix_subscript : BOOLEAN ~ Should the prefix be displayed as sub-script
             * text_prefix_supercript : BOOLEAN ~ Should the prefix be displayed as super-script
             
            // Examples
            {
                property : 'pre_optimization_load_time_value',
                group_selector : '#pre-opt-perfomance-breakdown-chart-text-cells .top-left .value-group',
                css_class : 'value',
                fmt_mult: 0.001,
                fmt_decimal_places : 2,
                text_postfix_string : 'sec',
                text_postfix_subscript : true
            },
            {
                property : 'pre_optimization_bounce_rate_value',
                group_selector : '#pre-opt-perfomance-breakdown-chart-text-cells .top-right .value-group',
                css_class : 'value', 
                fmt_decimal_places : 0,
                fmt_absolute_number : true,
                text_postfix_string : '%',
                text_postfix_subscript : true
            },
            
            {
                property : 'post_optimization_revenue_value',
                group_selector : '#post-opt-perfomance-breakdown-chart-text-cells .bottom-right .value-group',
                css_class : 'value',
                fmt_currency : true,
                fmt_currency_iso : 'USD',
                fmt_decimal_places : 2
            },
            */
        ]
    };

    
	window.getTextCellsChart = function(_opts) {
	    
	    var opts = $.extend({}, defaults, _opts);
	    var chart_svg = d3.select(opts.container_id);
	    var data = [];
	    var combinedData = [];
	    var originalResult = null;
	    
       
	    
        /** ================ DRAW ================= */
	    const drawChart = function(resizing) {
        
	        const textCell = new D3TextCell();
	        const cells = chart_svg.selectAll('.value').data(combinedData);
            
            cells.exit().remove();
            cells.enter().call( textCell );
            cells.call( textCell.update );
        };
        
        
        /** ================ UPDATE ================= */
        const doUpdateData = function(data) {
            
            // Transform the data, if spcified
            if( $.type(opts.transform_incomming_data_function) === 'function' )
            {    
                data = opts.transform_incomming_data_function(data) || data;  
            }
            
            // Map the data, to the specified cells
            if( $.type(opts.combine_data_with_cells_function) === 'function' )
            {
                combinedData = opts.combine_data_with_cells_function(data,combinedData,opts.cells) || combinedData;  
            }
                        
            drawChart();

            // Only flash once the chart has received some data
            const pulseContainer = $(opts.container_id);
            
            if( opts.flash_cells_on_update && opts.flash_cells_selectors.length > 0 && pulseContainer.length && pulseContainer.hasClass('no-data') === false )
            {    
                window.akdv.utils.addClassAndRemoveAfterDuration( opts.container_id, opts.flash_cells_selectors, 'animated-pulse-opacity-medium', 2000 );
            }

            // Show the chart HAS data!
            if( $.type(opts.container_id) === 'string' && opts.container_id.length !== 0 )
            { 
                $(opts.container_id).removeClass('no-data');
            }
        }
        
        const updateData = function(e, result) {

            if (!result)
            {
                window._log.warn('update chart triggered without data');
                return;  
            } 
                        
            // Apply a delay to doing the data update, to stop the following drawChart, blocking the processor
            if( opts.delay_updateData )
            {
                window.setTimeout(function(){                    
                    doUpdateData(result);
                }, opts.delay_updateData );
            }
            else
            {
                doUpdateData();
            }
        };

 
        
        // Receive INITIAL chart data
        if(opts.event_namespace_chart_data_update)
        {
            $(window).on('result.' + opts.event_namespace_chart_data_update, (e,data) => { updateData(e,data) } );
        }
        
        // Receive chart data UPDATES
        if(opts.event_namespace_for_modified_data)
        {
            $(window).on('result.' + opts.event_namespace_for_modified_data, (e,data) => { updateData(e,data) } );
        }
         
        $(window).on('resize-charts.akdv', drawChart.bind(this,true) );
        
    	    return chart_svg;
	};

	
}(window, document, window.jQuery, window.d3, window.D3TextCell));