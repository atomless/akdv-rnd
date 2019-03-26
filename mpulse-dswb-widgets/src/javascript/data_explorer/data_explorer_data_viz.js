;(function(window, document, $, d3, getD3Table, statusNotifier) {

    'use strict';
      
    window.akdv.dataExplorer.dataViz = function(e,initializerData) {
      
        let dataTableViz = null,
        queryResultEventNameSpace = 'data-explorer-query-result',
        $queryDatavisTable = $('#query_datavis_table'),
        $queryDatavisTableContainer = $('#query_datavis_table_container'),
        $exportDataButton = $('#query_data_button_export'),
        $exportDataAsList = $('#export_data_as_list'),
        dataVisTableContainerID = '#query_datavis_table_container';
 

        // Create queryEditor namespace and initialize editor
        var dataViz = function(){};
        dataViz();
        
        dataViz.state = {};
        dataViz.state.data = null;
        
        
        const _dataExplorer = function() {
            return initializerData.dataExplorer;
        };
        
        const _queryEditor = function() {
            return initializerData.queryEditor;
        };
        
        const _queryLibrary = function() {
            return initializerData.queryLibrary;
        }

        
        let setExportButtonState = function() {
            
            if( $.type(dataViz.state.data) === 'null' )
            {
                $exportDataButton.attr('data-data-present',false);
            }
            else
            {
                $exportDataButton.attr('data-data-present',true);
            }
        };
        
        
        dataViz.receiveQueryData = function( e, data ) {
            
            //Hide the Spinner
            statusNotifier.done();
            $(window).trigger('chart-render-complete.akdv');
            
            dataViz.state.data = data;
            
            setExportButtonState();

            let queryEditor = _queryEditor();
            
            if($.type(queryEditor.state.currentQuery) === 'object' && data.meta)
            {
                // Save the DATE-TIME
                if( $.type(data.meta.executed) === 'number' )
                {
                    queryEditor.state.currentQuery.lastRun = data.meta.executed;
                }
                
                // Save the execution DURATION
                queryEditor.state.currentQuery.lastRunDuration = data.meta.duration;
                
                // Update its LAST RUN datetime
                queryEditor.state.currentQuery.lastRun = Date.now();
                
                // TODO Change to this, once we test with live query results
                //queryEditor.state.currentQuery.lastRun = data.meta.executed; 
                
                queryEditor.saveQuery();
            }

            $(window).trigger('result.' + queryResultEventNameSpace, data);
            
            $queryDatavisTable.attr('data-data-present',true);
        };
        
        
        let exportData = function(e) {
            
            /**
             * Writes the current array of columns values, to a CSV, TSV or JSON file
             */
            

            if( $.type(dataViz.state.data) === 'object' && $.type(dataViz.state.data.data) === 'array' )
            {
                const fileName = 'dataExplorer-dataExport';

                switch(e.currentTarget.id)
                {
                    case 'export_data_as_csv':
                        window.akdv.utils_env.download({ content: window.akdv.utils_data.objectsArrayToDSV(dataViz.state.data.data), filename: fileName + '.csv' });
                        break;
                        
                    case 'export_data_as_tsv':
                        window.akdv.utils_env.download({ content: window.akdv.utils_data.objectsArrayToDSV(dataViz.state.data.data,'tsv'), filename: fileName + '.tsv' });
                        break;
                        
                    case 'export_data_as_json':
                        window.akdv.utils_env.download({ content: JSON.stringify( dataViz.state.data.data ), filename: fileName + '.json' });
                        break;
                } 
            }
            else
            {
                window._log.error('No data ARRAY found in data! Could not export...');
            }
        }
        
        
        let init = function() {

            setExportButtonState();
            
            $exportDataAsList.on('click', 'li', exportData);
            
            // Create our d3 Table instance
            if(dataTableViz === null)
            {
                dataTableViz = new getD3Table({
                    container_id : dataVisTableContainerID,
                    event_namespace_table_data_update : queryResultEventNameSpace
                });
            }
            
            $(window).on('result.data', dataViz.receiveQueryData ); // Triggered when Query data is received
        }
        
        init();

        window._log.debug('Data Explorer VIZ Init');
 
        window.akdv.dataExplorer.dataViz = dataViz;
        
        return dataViz;
    };

    $(window).on('dex-query-editor-init', window.akdv.dataExplorer.dataViz );
      
})(window, document, window.jQuery, window.d3, window.getD3Table, window.akdv.statusNotifier);