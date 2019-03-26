;(function(window, document, $, CodeMirror, storage) {

    'use strict';
     
    window.akdv.dataExplorer.queryLibrary = function(e,initializerData) {
      
        let $library = $('#query_library'),
        
        $libraryListSelectorTabs = $('#library_list_selector_tabs'),
        $queryLibraryTabQueries = $('#query_library_tab_history'),
        $queryLibraryTabExamples = $('#query_library_tab_examples'),
        
        $queryLibraryStoredQueriesListContainer = $('#query_library_stored_query_list_container'),
        $queryLibraryExampleListContainer = $('#query_library_examples_list_container'),
        
        $queryLibraryQueryList = $('#query_library_query_list'),
        $queryLibraryExampleList = $('#query_library_examples_list');
        
        
        // Create namespace and initialize
        const queryLibrary = function() {  };
        queryLibrary();

        
        // Gets a reference to the dataExplorer object
        const _dataExplorer = function() {
            let dex = initializerData.dataExplorer;
            return dex;
        };

        const _queryEditor = function() {
            let qed = initializerData.queryEditor;
            return qed;
        }
        
        const _dataViz = function() {
            return window.akdv.dataExplorer.dataViz;
        }
        
        
        // We need our own local CM instance so we can create syntax highlighted code, to match the main CM instance
        queryLibrary.editor = window.CodeMirror( document.getElementById('query_library_cm_editor'), {
            'mode': "text/x-mpql",
            'theme': "akamai", // Applies a 'cm-s-akamai class to the editor parent element'
            'flattenSpans': false,            
            'hint': CodeMirror.hint.sql, // This uses our own definition of the sql hinter, customized for mpql
            'value' : ""
        });
               
        // When queryLibrary.editor options change, this event can be used to handle
        queryLibrary.editor.on("optionChange", function(opt) {
            
            // Wait for the libraries CodeMirror options to be set, beore producing lists, otherwise formatter is missing required Table/Column data.
            if( opt.options.hintOptions.hasOwnProperty('tables') && $queryLibraryStoredQueriesListContainer.get(0).childNodes )
            {
                // Table/Column data is now available for CodeMirror to format MQPL fully, so lets list our stored Queries
                initStoredQueriesList();
                
                // Request the Library Examples data
                requestExampleQueries();
            }
        });
        
        
        queryLibrary.clearStoredQueryHistoryData = function() {
            storage.local.setItem(_dataExplorer().storedQueryKey, JSON.stringify( { 'queryList' : {} } ) );
        }
        
        
        queryLibrary.makeUUID = function() {
            return window.akdv.utils_string.generateUUID();
        }
        
        
        queryLibrary.getStoredQueryData = function() {
            
            // Setup a default (empty) data list object
            let data = { 'queryList' : {} };
            
            // Get the currently stored Query history data from localStorage
            let storedQueriesString = storage.local.getItem(_dataExplorer().storedQueryKey);
            
            if( $.type(storedQueriesString) === 'string' )
            {
                let parsedData = JSON.parse(storedQueriesString);
                if( $.type(parsedData) === 'object' && $.type(parsedData.queryList) === 'object' )
                {
                    data = parsedData;
                }
            }
            
            // Ensure that all stored quiries conform to the schema 
            for (var queryKey in data.queryList) {
                if (data.queryList.hasOwnProperty(queryKey)) {
                    let queryObject = data.queryList[queryKey];
                    queryLibrary.conformQueryObjectToTemplate(queryObject);
                }
            }
            
            return data;
        };
        
        
        queryLibrary.getStoredQuery = function(queryID) {
            
            if( $.type(queryID) !== 'string' ) return null;
            
            // The the object
            let queryObject = queryLibrary.getStoredQueryData().queryList[queryID];
            
            if( $.type(queryObject) !== 'object' ) return null;
            
            // Ensure it matches the Schema
            queryLibrary.conformQueryObjectToTemplate(queryObject);
            
            return queryObject;
        }
        
        
        queryLibrary.getStoredQueryHistoryItem = function(queryID,itemIndex) {
            return queryLibrary.getStoredQuery(queryID).queryStringHistory[itemIndex];
        }

        
        queryLibrary.storeQueryData = function(queryObj, updateUI) {
            
            // Get the current data 
            let storedHistoryData = queryLibrary.getStoredQueryData();
            
            // Set / Update this query to it
            storedHistoryData.queryList[queryObj.ID] = queryObj;
            
            // Store the updated data
            storage.local.setItem(_dataExplorer().storedQueryKey, JSON.stringify(storedHistoryData) );
            
            if( $.type(updateUI) !== 'boolean' || updateUI === true )
            {
                // Trigger a HISTORY DATA UPDATED event, so any subscribing systems can update
                $(window).trigger(_dataExplorer().event.queryLibrary.storedQueryDataUpdated);
            }
        };
        

        const listStoredQueries = function() {
            
            // Get the currently stored Query history data
            let data = queryLibrary.getStoredQueryData();

            let queryArray = [];
            for (var key in data.queryList) {
                if (data.queryList.hasOwnProperty(key))
                {
                    queryArray.push(data.queryList[key]);
                }
            }
            queryArray.sort( function(a, b){ return a.lastSaved < b.lastSaved } )
            
            $queryLibraryQueryList.empty();
            const queryEditor = _queryEditor();
            
            queryArray.forEach( ( query, index ) => {
                
                let $item = $( '<li class="library-item" data-query-loaded-in-editor="false" data-query-id="' + query.ID + '"></li>' ).appendTo($queryLibraryQueryList);

                // Display Query String
                if( query.ui.displayQueryString )
                {
                    $item.addClass('display-query-string');
                }

                // Display Query History Strings
                if( query.ui.displayQueryHistory )
                {
                    $item.addClass('display-query-history');
                } 

                if( $.type(queryEditor.state.currentQuery) === 'object' && query.ID === queryEditor.state.currentQuery.ID )
                {
                    $item.attr('data-query-loaded-in-editor', true);
                }
                
                
                
                let $itemBar = $( '<div class="library-item-titlebar"></div>' ).appendTo($item);
                    let $itemBarTitle = $( '<span class="library-item-title" title="' + query.title + '">' + query.title + '</span>' ).appendTo($itemBar);
                
                let $itemBarStatsList = $( '<ul class="stats-list"></ul>' ).appendTo($itemBar);
                    
                let $itemBarLastSaved = $( '<li class="stats-item"></li>' ).appendTo($itemBarStatsList);
                    let $itemBarLastSavedLabel = $( '<span class="heading">Saved : </span>' ).appendTo($itemBarLastSaved);   
                    let $itemBarLastSavedText = $( '<time class="stats-text datetime">' + akdv.utils_time.datetimeToString(query.lastSaved) + '</time>' ).appendTo($itemBarLastSaved);
                
                let $itemBarLastRun = $( '<li class="stats-item"></li>' ).appendTo($itemBarStatsList);
                    let $itemBarLastRunLabel = $( '<span class="heading">Last Run : </span>' ).appendTo($itemBarLastRun);   
                    let $itemBarLastRunText = $( '<time class="stats-text datetime">' + akdv.utils_time.datetimeToString(query.lastRun) + '</time>' ).appendTo($itemBarLastRun);
                
                let $itemBarLastRunDuration = $( '<li class="stats-item"></li>' ).appendTo($itemBarStatsList);
                    let $itemBarLastRunDurationLabel = $( '<span class="heading">Duration : </span>' ).appendTo($itemBarLastRunDuration);   
                    let $itemBarLastRunDurationText = $( '<time class="stats-text duration">' + akdv.utils_time.durationToHMSWords(query.lastRunDuration) + '</time>' ).appendTo($itemBarLastRunDuration);
                
                let $itemBarButtons = $( '<span class="library-item-buttons"></span>' ).appendTo( $itemBar );
                
                    let $itemBarDisplayMPQLHistoryButton = $( '<button class="dex-button display-query-history-list-toggle" title="Display previous MQPL query strings">History</button>' ).appendTo( $itemBarButtons );
                    let $itemBarDisplayMPQLButton = $( '<button class="dex-button display-query-string-toggle" title="Display MPQL">mPQL</button>' ).appendTo( $itemBarButtons );
                    
                    let $itemBarLoadButton = $( '<button class="dex-button load-query" title="Load MQPL into Query Editor">Load</button>' ).appendTo( $itemBarButtons );
                    let $itemBarDeleteButton = $( '<button class="dex-button delete-query" title="Delete Query from History">Delete</button>' ).appendTo( $itemBarButtons );
                 
                let mpqlRow = $( '<div class="query-string-display">' + syntaxHighlightQueryString( query.queryString ) + '</div>' ).appendTo($item);

                
                if( $.type(query.queryStringHistory) !== 'object' || query.queryStringHistory.hasHistory === false ) {
                    $itemBarDisplayMPQLHistoryButton.attr('data-data-present', false);
                }
                else
                {
                    // Convert the queryStringHistory object into an array, and sort it by lastSaved
                    let queryHistoryArray = [];
                    for (var key in query.queryStringHistory) {
                        if (query.queryStringHistory.hasOwnProperty(key))
                        {
                            let item = query.queryStringHistory[key];
                            
                            if( $.type(item) === 'object' )
                            {
                                queryHistoryArray.push(query.queryStringHistory[key]);
                            } 
                        }
                    }
                    queryHistoryArray.sort( function(a, b){ return a.lastSaved < b.lastSaved } )
                    
                    if( queryHistoryArray.length )
                    {
                        let $mpqlHistoryListContainer = $( '<div class="query-history-list-container"></div>' ).appendTo($item);
                        let $mpqlHistoryList = $( '<ul class="query-history-list"></ul>' ).appendTo($mpqlHistoryListContainer);
    
                        queryHistoryArray.forEach((item,i) => {

                            let $mpqlHistoryItem = $( '<li class="query-history-item" data-history-item-id=' + item.ID + '></li>' ).appendTo($mpqlHistoryList);
                                let $mpqlHistoryItemQueryString = $( '<span class="query-string" title="' + item.queryString + '">' + syntaxHighlightQueryString( item.queryString ) +'</span>' ).appendTo($mpqlHistoryItem);
        
                                // Check if Query String fits in container
                                let mpqlHistoryItemQueryString = $mpqlHistoryItemQueryString.get(0);
                                if( mpqlHistoryItemQueryString.scrollHeight > mpqlHistoryItemQueryString.offsetHeight )
                                {
                                    $mpqlHistoryItemQueryString.addClass('is-overflowing');
                                    $( '<span class="ellipsis-symbol">...</span>' ).appendTo($mpqlHistoryItemQueryString);
                                }
                                
                            let $mpqlHistoryItemStatsSavedOn = $( '<span class="stats-item"></span>' ).appendTo($mpqlHistoryItem);
                                $( '<span class="stats-heading">Saved : </span>' ).appendTo($mpqlHistoryItemStatsSavedOn);
                                $( '<time class="stats-text">' + akdv.utils_time.datetimeToString( item.lastSaved ) + '</time>' ).appendTo($mpqlHistoryItemStatsSavedOn);
                                
                            let $mpqlHistoryItemStatsLastRun = $( '<span class="stats-item"></span>' ).appendTo($mpqlHistoryItem);
                                $( '<span class="stats-heading">Last Run : </span>' ).appendTo($mpqlHistoryItemStatsLastRun);
                                $( '<time class="stats-text">' + akdv.utils_time.datetimeToString( item.lastRun ) + '</time>' ).appendTo($mpqlHistoryItemStatsLastRun);
                            
                            let $mpqlHistoryItemStatsLastRunDuration = $( '<span class="stats-item"></span>' ).appendTo($mpqlHistoryItem);
                                $( '<span class="stats-heading">Duration : </span>' ).appendTo($mpqlHistoryItemStatsLastRunDuration);
                                $( '<span class="stats-text">' + akdv.utils_time.durationToHMSWords( item.lastRunDuration, true ) + '</span>' ).appendTo($mpqlHistoryItemStatsLastRunDuration);
                                
                            let $mpqlHistoryItemBarButtons = $( '<span class="library-history-item-buttons"></span>' ).appendTo($mpqlHistoryItem);
                                let $itemHistoryLoadButton = $( '<button class="dex-button load-history-query" title="Use query string as current MQPL for this item, and load in Editor">Load</button>' ).appendTo( $mpqlHistoryItemBarButtons );
                        });
                    }
            
                    $itemBarDisplayMPQLHistoryButton.attr('data-data-present', true);
                }
            });
            
            // Toggle to the Queries TAB
            $queryLibraryTabQueries.click();
            
        }
        $(window).on(_dataExplorer().event.queryLibrary.storedQueryDataUpdated, listStoredQueries);
        
        
        const listQueryExamples = function(data) {
            
            queryLibrary.exampleData = data;
            
            $queryLibraryExampleList.empty();
            
            data.examples.forEach( ( example, index ) => {
                let $item = $( '<li class="library-item" data-example-index="' + index + '"></li>' ).appendTo($queryLibraryExampleList);
                let $itemBar = $( '<div class="library-item-titlebar"></div>' ).appendTo($item);
                let $itemBarTitle = $( '<span class="library-item-title">' + example.title + '</span>' ).appendTo($itemBar);
                let $itemBarButtons = $( '<span class="library-item-buttons"></span>' ).appendTo( $itemBar );
                let $itemBarDisplayMPQLButton = $( '<button class="dex-button display-query-string-toggle" title="Display MPQL">mPQL</button>' ).appendTo( $itemBarButtons );
                let $itemBarLoadButton = $( '<button class="dex-button load-query" title="Load MQPL into Query Editor">Load</button>' ).appendTo( $itemBarButtons );
                let mpqlRow = $( '<div class="query-string-display">' + example.queryString + '</div>' ).appendTo($item);
            });
        }
        
        
        const requestExampleQueries = function() {
            window.akdv.xmlHTTP.getJSON({ url: '../data/data_explorer/data_explorer_example_queries.json' })
                .then( (data) => { listQueryExamples(data); } );
        };
        
        
        const toggleItemQueryStringDisplay = function(e) {
            
            let $item = $(e.currentTarget).parents('li.library-item');
            let cn = 'display-query-string';
            let displayQueryString = false;
            
            if( $item.hasClass(cn) )
            {
                // Hide Query String
                $item.removeClass(cn);
                displayQueryString = false;
            }
            else
            {                
                // Hide Query History List
                if( $item.hasClass('display-query-history') ) { $item.find('.display-query-history-list-toggle').click(); }
                
                let querySyntaxHighlighted = 'syntax-highlighting-applied';
                let syntaxHighlightApplied = $item.hasClass(querySyntaxHighlighted);
                let queryString = '';
                
                if( $item.attr('data-query-id') )
                {
                    if(syntaxHighlightApplied === false)
                    {
                        let historyID = $item.attr('data-query-id');
                        queryString = queryLibrary.getStoredQuery( historyID ).queryString;
                    }
                }
                else
                {
                    if(syntaxHighlightApplied === false)
                    {
                        let exampleIndex = Number($item.attr('data-example-index'));
                        queryString = queryLibrary.exampleData.examples[exampleIndex].queryString;
                    }
                }
                
                if(syntaxHighlightApplied === false)
                {
                    // On first displaying a query, use our local CM instance to apply syntax highlighting to the text
                    queryLibrary.editor.setValue( queryString );
                    let syntaxHighlightedHTML = $('#query_library_cm_editor .CodeMirror-code .CodeMirror-line span').html();
                    $item.find('.query-string-display').html(syntaxHighlightedHTML);
                    $item.addClass(querySyntaxHighlighted);
                }
                
                // Display Query String
                $item.addClass(cn);
                
                displayQueryString = true;
            }
            
            // Save UI State
            const queryID = $item.attr('data-query-id');
            let queryObj = queryLibrary.getStoredQuery(queryID);
            if( $.type(queryObj) === 'object' )
            {
                queryObj.ui.displayQueryString = displayQueryString;
                queryLibrary.storeQueryData(queryObj, false);
            }
        };
        
        
        const loadSavedQueryIntoEditor = function(e) {
            
            let $item = $(e.currentTarget).parents('li.library-item');
            let queryID = $item.attr('data-query-id');
            
            if ( $.type(queryID) === 'string' )
            {
                let queryObj = queryLibrary.getStoredQuery(queryID);
                _queryEditor().loadQueryObjectIntoEditor(queryObj);
            }
            
            listStoredQueries();
        };
        
        
        queryLibrary.conformQueryObjectToTemplate = function(queryObject) {
            
            if( $.type(queryObject) !== 'object' ) return null;
            
            const template = queryLibrary.newQueryObject();

                // Add any missing properties
                for (let propertyName in template) {
                    if (template.hasOwnProperty(propertyName))
                    {
                        if( !queryObject.hasOwnProperty(propertyName) )
                        {
                            queryObject[propertyName] = template[propertyName];
                        }                       
                    }
                }
                
                // Remove any superflous properties
                for (let propertyName in queryObject) {
                    if (queryObject.hasOwnProperty(propertyName))
                    {
                        if( !template.hasOwnProperty(propertyName) )
                        {
                            delete queryObject[propertyName];
                        }                       
                    }
                }
        };
        
        
        queryLibrary.newQueryObject = function() {
            return  {
                "ID" : queryLibrary.makeUUID(),
                "historyID" : null,
                "title" : "Untitled",
                "queryString" : null,
                "queryStringHistory" : { "hasHistory": false },
                "lastSaved" : null,
                "lastRun" : null,
                "lastRunDuration" : null,
                "ui" : {
                    "displayQueryString" : false,
                    "displayQueryHistory" : false
                }
            };
        };

        
        const newQueryHistoryObject = function(){
            return {
                "ID" : queryLibrary.makeUUID(),
                "queryString" : null,
                "lastSaved" : null,
                "lastRun" : null,
                "lastRunDuration" : null
            };
        }
        
        
        const queryStringInHistoryID = function(queryObj) {

            let historyID = null;
            
            for (let propertyKey in queryObj.queryStringHistory) {
                if (queryObj.queryStringHistory.hasOwnProperty(propertyKey))
                {
                    let item = queryObj.queryStringHistory[propertyKey];

                    if( $.type(item) === 'object' && $.type(item.queryString) === 'string' )
                    {
                        if( item.queryString === queryObj.queryString )
                        {
                            historyID = propertyKey;
                        }
                    }
                }
            }
            
            return historyID;
        }
        
        
        queryLibrary.storeQueryStringInHistory = function(queryObj)
        {
            let historyObject = queryObj.queryStringHistory[queryObj.historyID];

            // Create a new HISTORY object, if the current string is NOT in history, or if a history query object does not already exist
            if( queryStringInHistoryID(queryObj) === null || $.type(queryStringInHistoryID(queryObj)) === null || $.type(historyObject) === 'undefined' )
            {
                historyObject = newQueryHistoryObject();
                queryObj.historyID = historyObject.ID;
            }
            
            historyObject.queryString = queryObj.queryString;
            historyObject.lastSaved = queryObj.lastSaved || (new Date).getTime();
            historyObject.lastRun = queryObj.lastRun;
            historyObject.lastRunDuration = queryObj.lastRunDuration;
            
            queryObj.queryStringHistory.hasHistory = true;
            queryObj.queryStringHistory[historyObject.ID] = historyObject;
        };
        
        
        const loadQueryHistoryItem = function(e) {
            
            const $storedItem = $(e.currentTarget).parents('li.library-item');
            const $historyItem = $(e.currentTarget).parents('li.query-history-item');
            
            const queryID = $storedItem.attr('data-query-id');
            const historyItemID = $historyItem.attr('data-history-item-id');
            
            let storedQueries =  queryLibrary.getStoredQueryData();
            let queryObj = queryLibrary.getStoredQuery(queryID);
            const historyObj = queryObj.queryStringHistory[historyItemID];
            
            // Store the selected historical data for now
            let hqString = historyObj.queryString;
            let hqLastRun = historyObj.lastRun;
            let hqLastRunDuration = historyObj.lastRunDuration;
            
            let queryInHistoryID = queryStringInHistoryID(queryObj);
            if( $.type(queryInHistoryID) === 'string' && $.type(queryObj.queryStringHistory[queryInHistoryID]) === 'object' )
            {          
                // A string in history, matches the current QueryString. Update its Stats with that of the current
                queryObj.queryStringHistory[queryInHistoryID].lastRun = queryObj.lastRun;
                queryObj.queryStringHistory[queryInHistoryID].lastRunDuration = queryObj.lastRunDuration;
            }
            else
            {
                // Store the current queryString, as no match was found for it in history
                queryLibrary.storeQueryStringInHistory(queryObj);
            }
            
            // Apply the Historical items data as the current data
            queryObj.queryString = hqString;
            queryObj.lastRun = hqLastRun;
            queryObj.lastRunDuration = hqLastRunDuration;
            
            // Store the updated data permanently
            queryLibrary.storeQueryData(queryObj);
            
            _queryEditor().loadQueryObjectIntoEditor(queryObj);
        };
        
        
        const loadQueryFromExamplesList = function(e) {
            
            /**
             * Creates a new Query from an example, and loads it into the editor
             */
            
            const $item = $(e.currentTarget).parents('li.library-item');
            const exampleIndex = Number($item.attr('data-example-index'));
            
            if( $.type(exampleIndex) === 'number' && $.type(queryLibrary.exampleData.examples) === 'array' )
            {
                const exampleQueryObj = queryLibrary.exampleData.examples[exampleIndex];
                
                if( $.type(exampleQueryObj) === 'object' )
                {
                    const queryObj = queryLibrary.newQueryObject();
                    queryObj.queryString = exampleQueryObj.queryString;
                    queryObj.title = 'Ex: ' + exampleQueryObj.title;
                    _queryEditor().loadQueryObjectIntoEditor(queryObj);
                }
            }  
        }
        
        
        const deleteStoredQuery = function(e) {
            
            let $item = $(e.currentTarget).parents('li.library-item');
            _queryEditor().deleteQueryFromLocalStorage( $item.attr('data-query-id') );
        }
        
        
        const setListTabsState = function(e){
            let listSelection = $(e.currentTarget).attr('data-list-selection');

            if( listSelection === 'history')
            {
                $queryLibraryTabQueries.addClass('selected');
                $queryLibraryTabExamples.removeClass('selected');
                
                $queryLibraryStoredQueriesListContainer.addClass('displayed');
                $queryLibraryExampleListContainer.removeClass('displayed');
            }
            else
            {
                $queryLibraryTabQueries.removeClass('selected');
                $queryLibraryTabExamples.addClass('selected');
                
                $queryLibraryStoredQueriesListContainer.removeClass('displayed');
                $queryLibraryExampleListContainer.addClass('displayed');
            }
            
        }
        
        
        const initTabs = function(){
            
            // Set HISTORY tab as selected by default
            $queryLibraryTabQueries.addClass('selected');
            $queryLibraryTabExamples.removeClass('selected');
            
            // Display HISTORY list by default
            $queryLibraryStoredQueriesListContainer.addClass('displayed');
            $queryLibraryExampleListContainer.removeClass('displayed');
            
            $libraryListSelectorTabs.on( "click", ".tab", setListTabsState );
        }
        
        
        const initStoredQueriesList = function(){
            listStoredQueries();
        }
        
        
        const syntaxHighlightQueryString = function(queryString) {

            queryLibrary.editor.setValue( queryString );
            let syntaxHighlightedHTML = $('#query_library_cm_editor .CodeMirror-code .CodeMirror-line span').html();
            
            return syntaxHighlightedHTML;
        }
        
        
        const toggleItemQueryStringHistoryDisplay = function(e) {

            let $item = $(e.currentTarget).parents('li.library-item');
            let cn = 'display-query-history';
            let displayQueryStringHistory = false;
            
            if( $item.hasClass(cn) )
            {
                $item.removeClass(cn);
                displayQueryStringHistory = false;
            }
            else
            {
                // HIDE the Query String display
                if( $item.hasClass('display-query-string') ) { $item.find('.display-query-string-toggle').click(); }
                
                // Apply Syntax Highliting spans to queries that require it.
                let $historyItemsQueryStrings = $item.find('.query-history-list li .query-string');
                
                $historyItemsQueryStrings.each( (i,item) => {
                    if( $(item).attr( 'data-syntax-highliting-applied' ) !== "true" )
                    {
                        $(item).html( syntaxHighlightQueryString( $(item).text() ) );
                        $(item).attr( 'data-syntax-highliting-applied', true );
                    }
                });
                       
                
                $item.addClass(cn);
                displayQueryStringHistory = true;
            }

            // Save UI State
            const queryID = $item.attr('data-query-id');
            let queryObj = queryLibrary.getStoredQuery(queryID);
            if( $.type(queryObj) === 'object' )
            {
                queryObj.ui.displayQueryHistory = displayQueryStringHistory;
                queryLibrary.storeQueryData(queryObj, false);
            } 
        };
        
        /*
        const onNewRequest = function({ filters = {}, additional_filters = [] } = {}) {
            debugger;
        };
        */
        const init = function() {
            
            initTabs();

            // Toggle Query History display button CLICK handler
            $queryLibraryQueryList.on( "click", ".dex-button.display-query-history-list-toggle", toggleItemQueryStringHistoryDisplay );
            
            // Toggle Query display button CLICK handler
            $queryLibraryQueryList.on( "click", ".dex-button.display-query-string-toggle", toggleItemQueryStringDisplay );
            $queryLibraryExampleList.on( "click", ".dex-button.display-query-string-toggle", toggleItemQueryStringDisplay );
            
            // Load Query into Editor button CLICK handler
            $queryLibraryQueryList.on( "click", ".dex-button.load-query", loadSavedQueryIntoEditor );
            $queryLibraryExampleList.on( "click", ".dex-button.load-query", loadQueryFromExamplesList );
            
            // Delete Query item from Queries list
            $queryLibraryQueryList.on( "click", ".dex-button.delete-query", deleteStoredQuery );

            // Load a Query History item
            $queryLibraryQueryList.on( "click", ".dex-button.load-history-query", loadQueryHistoryItem );

            
            // ----------------- EVENTS ------------------
            
            // When the main CM editors options are updated, this handler will set the same options in our local cm instance
            _queryEditor().mpqlEditor.on("optionChange", function(opt) { 
                queryLibrary.editor.setOption("hintOptions", {
                    'tables': opt.options.hintOptions.tables 
                });
            });
            
            //$(window).on(`mpulse-filter-updated.akdv`, (e, data) => onNewRequest(data));
        };

        init();
        
        window._log.debug('Data Explorer LIBRARY Init');
        
        $(window).trigger('dex-query-library-init', {
            "dataExplorer" : _dataExplorer(),
            "queryEditor" : _queryEditor(),
            "queryLibrary" : queryLibrary
        });
        
        window.akdv.dataExplorer.queryLibrary = queryLibrary;
        
        return queryLibrary;
    };
  
    $(window).on('dex-query-editor-init', window.akdv.dataExplorer.queryLibrary );
       
})(window, document, window.jQuery, window.CodeMirror, window.akdv.storage);