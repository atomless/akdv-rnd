;(function(window, document, $, d3, crossfilter, D3TextCell) {

	'use strict';

    var defaults = {
        container_id : '', // String ~ The ID of the chart element this chart is to be drawn within
        event_namespace_table_data_update : '', // String ~ The unique 'chart_group' id, for this charts data 
        transform_incomming_data_function : null,
        delay_updateData : 32 
    };

    
	window.getD3Table = function(_opts) {

	    let opts = $.extend({}, defaults, _opts);
	    let data = null;
	    let delayUpdateTimer = null;
	    let xf = crossfilter({});
	    let $tableContainer = $(opts.container_id);
	    let table = d3.select(opts.container_id).append('table').attr('class','dex-table');
	    let tableHeaders = table.append('thead').append('tr');
	    let tableRows = table.append('tbody');
	    

        /** ================ DRAW ================= */
        let drawChart = function() {

            // Ensure data is in correct format
            if( $.type(data) !== 'object' )
            {
                window._log.warn('Cannot draw Table, as data is not an OBJECT!');
                return;
            }
            else if( $.type(data.meta) !== 'object' )
            {
                window._log.warn('Cannot draw Table, as data is missing a .meta property!');
                return;
            }
            else if( $.type(data.meta.columns) !== 'array' )
            {
                window._log.warn('Cannot draw Table, as data is missing a .meta.columns array!');
                return;
            }
            else if( $.type(data.data) !== 'array' )
            {
                window._log.warn('Cannot draw Table, as data is missing a .data array!');
                return;
            }
            
            tableHeaders.selectAll('th').remove();
            tableRows.selectAll('tr').remove();
            
            let headers = tableHeaders
                .selectAll('th')
                .data(data.meta.columns)
                .enter()
                    .append('th')
                    .text(function (d) {
                         return d;
                     });
                    
             let rows = tableRows
                 .selectAll('tr')
                 .data(data.data)
                 .enter()
                     .append('tr');
            
            let rowTD = rows
                .selectAll('td')
                .data((d) => { return d; })
                .enter()
                    .append('td')
                    .text((d) => { return d; });
        };
        
        
        
        /** ================ UPDATE ================= */
        let updateData = function(e, result) {

            // empty out any existing data already in the crossfilter
            if (xf.size()) { xf.remove(); }
            
            // populate the crossfilter
            xf.add(result.data);
            
            if (!result)
            {
                window._log.warn('Update Table triggered without data');
                return;  
            } 
            
            let doUpdateData = function() {
                
                data = result;
    
                // Transform the data, if spcified
                if( $.type(opts.transform_incomming_data_function) === 'function' )
                {    
                    data = opts.transform_incomming_data_function(data) || data;  
                }
                         
                drawChart();
            }
            
            // Apply a delay to doing the data update, to stop the following drawChart, blocking the processor
            if( opts.delay_updateData ) {
                
                if(delayUpdateTimer !== null)
                {
                    clearTimeout(delayUpdateTimer);
                }
                
                delayUpdateTimer = window.setTimeout(function(){                    
                    doUpdateData();
                }, opts.delay_updateData );
            }
            else
            {
                doUpdateData();
            }
        };


        // Receive INITIAL chart data
        if(opts.event_namespace_table_data_update)
        {
            $(window).on('result.' + opts.event_namespace_table_data_update, updateData);
        }

        $(window).on('resize-charts.akdv', drawChart.bind(this,true) );
        
        
    	return table;
	};

	
}(window, document, window.jQuery, window.d3, window.crossfilter, window.D3TextCell));