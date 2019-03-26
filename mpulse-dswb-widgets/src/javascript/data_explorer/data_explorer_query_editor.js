;(function(window, document, $, CodeMirror, markdownit, storage) {

    'use strict';

    window.akdv.dataExplorer.queryEditor = function(e,initializerData) {

        let editor,
        debugDisplayParser = false,     // Should we display the mpqlParser structure window, for debugging purposes
        
        tableData = null,
        infoKeywordDict = null,
        infoColumnDict = null,
        infoMPQLFunctionDefinitionsDict = null,
        infoDatetimeDefinitionsDict = null,

        $dataExplorer = $('#data_explorer'),
        $queryEditor = $('#data_explorer_query_editor'),
        
        $queryitemTitle = $('#query_item_title'),
        
        $queryItemStatsLastRun = $('#query_item_stats_last_run .datetime'),
        $queryItemStatsDuration = $('#query_item_stats_duration .duration'),
        
        $query_item_actions = $('#query_item_actions'),
        $queryItemButtonNew = $('#query_item_button_new'),
        $queryItemButtonRun = $('#query_item_button_run'),
        $queryItemButtonSave = $('#query_item_button_save'),
        
        $queryEditorHints = $('#query_editor_hints'),
        queryEditorHintsStore = {},
        
        $queryServerStatusText = $('#query_server_status_info_text'),
        $queryServerStatusSpinner = $('#query_server_status_info_spinner');
        
        // Create queryEditor namespace
        const queryEditor = function(){};
        queryEditor();
                
        // Initialize its state
        queryEditor.state = {
                'currentQuery' : null,
                'queryServer' : { 'ready': false },
                'columnData' : { 'data' : [] }
        };
        
        
        // Gets a reference to dataExplorer object
        const _dataExplorer = function() {
            let dex = initializerData.dataExplorer;
            return dex;
        };

        // Gets a reference to queryLibrary object
        const _queryLibrary = function() {
            return window.akdv.dataExplorer.queryLibrary;
        }

        // Gets a reference to dataViz object
        const _dataViz = function() {
            return window.akdv.dataExplorer.dataViz;
        }

        // Our INFO / Markdown processor
        const dexInfo = initializerData.dataExplorer.info;
        
        const parserDisplay = function() {
            
            if(debugDisplayParser)
            {
                $(window.document.body).addClass('display-parser');
            }
            else
            {
                $(window.document.body).removeClass('display-parser');
            }
        };
        
        
        const storeLiveEditorQueryString = function() {
        
            /**
             * Stores the current Query Editor string, as the user types.
             * This is then restored on page-load, to preserve un-saved queries that the user may be working on
             */
            
            let editorQueryString = queryEditor.sanitizedEditorValue();
            
            if( $.type(editorQueryString) === 'string' )
            {
                window.akdv.storage.local.setItem( _dataExplorer().currentEditoryQueryStringKey, editorQueryString );
            }
        }
        
        
        const getStoredLiveEditorQueryString = function() {
            
            /** 
             * Restores the storeLiveEditorQueryString() to the Query Editor, re-instating its last state
             */
            
            let queryString = window.akdv.storage.local.getItem( _dataExplorer().currentEditoryQueryStringKey );
            
            if( $.type(queryString) === 'string' && queryString.length !== 0 )
            {
                if( $.type(editor) === 'object' )
                {
                    editor.setValue( queryEditor.sanitizeQueryString( queryString ) );
                }
            }
        }
        
 
        queryEditor.sanitizeQueryString = function(queryString) {
            
            let sanitizedString = queryString.trim();
            
            return sanitizedString;
        };
        
        
        queryEditor.sanitizedEditorValue = function() {
            
            return queryEditor.sanitizeQueryString( editor.getValue() );
        };
        
        
        // Create a new Query
        queryEditor.resetQueryEditor = function() {
            
            /**
             * Wipe the editor, allowing a new Query to be edited, saved etc
             */
            
            queryEditor.state.currentQuery = null;
            $queryitemTitle.text('Untitled').attr('title','Untitled');
            editor.setValue('');
            storeLiveEditorQueryString();
        };

        
        queryEditor.saveQuery = function() {

            //debugger;
            let data = _queryLibrary().getStoredQueryData();
            let queryObj = queryEditor.state.currentQuery;
            
            if( $.type(queryObj) !== 'object' )
            {
                // Create a new query Object
                queryObj = _queryLibrary().newQueryObject();
                queryEditor.state.currentQuery = queryObj;
            }

            _queryLibrary().conformQueryObjectToTemplate(queryObj);
            
            // Get the current string in the Query item TITLE area
            let queryTitleString = $queryitemTitle.text();
            if( queryTitleString.length !== 0 )
            {
                queryObj.title = queryTitleString;
            }

            // Get the current Query string from the editor
            let editorQueryString = queryEditor.sanitizedEditorValue();
            let storedQueryString = queryObj.queryString;
            
            queryObj.queryString = editorQueryString;
            
            _queryLibrary().storeQueryStringInHistory(queryObj);
            
            // Update and set the saved datetime value
            queryObj.lastSaved = (new Date).getTime();
            
            _queryLibrary().storeQueryData(queryObj);
            
            updateQueryEditorItemBar();
        };
        

        queryEditor.deleteQueryFromLocalStorage = function( queryID ) {

            // Setup a default (empty) data list object
            let data = { 'queryList' : {} };
            
            // Get the currently stored Query history data from localStorage
            let storedQueriesString = window.akdv.storage.local.getItem(_dataExplorer().storedQueryKey);
            
            if( $.type(storedQueriesString) === 'string' )
            {
                let parsedData = JSON.parse(storedQueriesString);
                if( $.type(parsedData) === 'object' && $.type(parsedData.queryList) === 'object' )
                {
                    data = parsedData;
                }
            }
            
            if( $.type(data.queryList[queryID]) === 'object')
            {
                delete data.queryList[queryID];
                
                // Put the modified data back in local storage
                window.akdv.storage.local.setItem(_dataExplorer().storedQueryKey, JSON.stringify(data) );
                
                // Trigger a HISTORY DATA UPDATED event, so any subscribing systems can update
                $(window).trigger(_dataExplorer().event.queryLibrary.storedQueryDataUpdated);
            }
        }
        
        
        const setQueryData = function(query) {
                queryEditor.state.currentQuery = query;
        };
        
        
        const setQueryEditorQueryString = function() {
            if( $.type(queryEditor.state.currentQuery) === 'object' && $.type(queryEditor.state.currentQuery.queryString) === 'string')
            {
              queryEditor.mpqlEditor.setValue(queryEditor.state.currentQuery.queryString);
            }
        };
        
        
        const setQueryTitle = function() {

            if( $.type(queryEditor.state.currentQuery) === 'object' && $.type(queryEditor.state.currentQuery.title) === 'string' )
            {
                $queryitemTitle.text(queryEditor.state.currentQuery.title);
                $queryitemTitle.attr( 'title', queryEditor.state.currentQuery.title );
                $queryitemTitle.attr( 'data-query-from-library', true );
            }
            else
            {
                $queryitemTitle.text( 'Untitled' );
                $queryitemTitle.attr( 'title', 'Untitled' );
                $queryitemTitle.attr( 'data-query-from-library', false );
            }
        };
        
        
        const setQueryInfoLastRun = function() {

            let query = queryEditor.state.currentQuery;
            
            if( $.type(query) === 'object')
            {
                $queryItemStatsLastRun.text( akdv.utils_time.datetimeToString(query.lastRun) );   
            }
            else
            {
                $queryItemStatsLastRun.text( akdv.utils_time.datetimeToString(null) );
            }
        };
        
        
        const setQueryInfoDuration = function() {
            
            let query = queryEditor.state.currentQuery;
            
            if( $.type(query) === 'object' )
            {
                $queryItemStatsDuration.text( akdv.utils_time.durationToHMSWords(query.lastRunDuration) );
            }
            else 
            {
                $queryItemStatsDuration.text( akdv.utils_time.durationToHMSWords(null) );
            }
        };
        
        
        queryEditor.loadQueryObjectIntoEditor = function(queryObject) {
            
            if( $.type(queryObject) === 'object' )
            {    
                setQueryData(queryObject);
                setQueryEditorQueryString();
                setQueryTitle();
                setQueryInfoLastRun();
                setQueryInfoDuration();
            }  
        }
        
        
        // Assign Action Button Handler for RUN QUERY
        queryEditor.runQueryOnServer = function(e) {
            
            /**
             * Handle sending Query string to server
             */
            
            if( queryServerReady() === false || $(e.currentTarget).hasClass('disabled') )
            {
                // Do not allow Run Query, when the button is disabled
                return;
            }
            
            event.preventDefault();
            
            // add required filter properties so the filter is available in DSWB
            let request = {
                attribute: 'data-explorer-query',
                value: queryEditor.sanitizedEditorValue(),
                comparator: "Is",
                displayLabel: queryEditor.sanitizedEditorValue(),
                secondaryValue: null,
                tertiaryValue: null
            };
            $(window).trigger('new-request.akdv', { additional_filters: [request], silent: false });
            
            //Save the Query if it is not already
            queryEditor.saveQuery();
        }  
        

        
        // De-bounce any query changes, to avoid parser thrash
        let queryChangedTimeout = null;
        
        const doChange = function() {
            editor.mpqlParser.parse();
            storeLiveEditorQueryString();
        }
        
        const queryChanged = function() {
            if(queryChangedTimeout !== null) { window.clearTimeout(queryChangedTimeout); }
            queryChangedTimeout = setTimeout(doChange, 50);
        }
        
        
        const getTableNames = function() {
            
            let tableNames = [];
            
            if( typeof editor.options.hintOptions === 'object' && typeof editor.options.hintOptions.tables === 'object')
            {
                for (let tableName in editor.options.hintOptions.tables) {
                    if (editor.options.hintOptions.tables.hasOwnProperty(tableName)) { tableNames.push(tableName); }
                }
            }
            
            return tableNames;
        } 

        
        const setTable = function( tableName ) {

            if( typeof tableName === 'string' &&  $.type(editor.options.hintOptions.tables[tableName.toLowerCase()]) === 'array' )
            { 
                editor.mpqlState.selectedTable = tableName.toUpperCase();
                editor.mpqlState.selectedTableColumns = editor.options.hintOptions.tables[tableName.toLowerCase()];
                
                constructColumnInfoDict();
                
                window._log.info('SELECTED TABLE : ', editor.mpqlState.selectedTable );
                window._log.info('COLUMNS IN TABLE : ', editor.mpqlState.selectedTableColumns.length );
            }
            else
            {
                editor.mpqlState.selectedTable = null;
                editor.mpqlState.selectedTableColumns = null;
            }
        }
        
        
        const refreshEditorContent = function() {
            
            editor.startOperation();
            
            let currentVal = queryEditor.sanitizedEditorValue();
            let valTweak = currentVal + ' ';
            editor.setValue(valTweak);
            editor.setValue(currentVal);
            
            editor.endOperation();
        };
        
        
        const updateQueryEditorItemBar = function() {
            setQueryTitle();
            setQueryInfoLastRun();
            setQueryInfoDuration();
        } 
        
        
        const updateQueryEditorHintsText = function(metaData) {
 
            /**
            * Displays any valid status messages returned in the meta-data for the run query
            * Note: Markdown is transformed to HTML
            */
            
            if( $.type(metaData) === 'object' && $.type(metaData.status) === 'object' )
            {
                $queryEditorHints.empty();
                $queryEditorHints.addClass( 'status-message-' + metaData.status.type );
                $queryEditorHints.html( dexInfo.render( '±' + metaData.status.type + '±: ' + metaData.status.text) );
            }
            
        }
        
        
        const queryDataReturnedFromServer = function( e, data ) {
            updateQueryEditorItemBar(e,data);
            updateQueryEditorHintsText(data.meta);
        }
        
        
        // ----------------
        
        const storeHintHTML = function() {
            
            queryEditorHintsStore = { "html": $queryEditorHints.html() };
            
            if( $queryEditorHints.hasClass('status-message-general-tip') )
            {
                queryEditorHintsStore["className"] = 'status-message-general-tip';
                $queryEditorHints.removeClass('status-message-general-tip');
            }
            else if( $queryEditorHints.hasClass('status-message-info') )
            {
                queryEditorHintsStore["className"] = 'status-message-info';
                $queryEditorHints.removeClass('status-message-info');
            }
            else if( $queryEditorHints.hasClass('status-message-warning') )
            {
                queryEditorHintsStore["className"] = 'status-message-warning';
                $queryEditorHints.removeClass('status-message-warning');
            }
            else if( $queryEditorHints.hasClass('status-message-error') )
            {
                queryEditorHintsStore["className"] = 'status-message-error';
                $queryEditorHints.removeClass('status-message-error');
            }
            
            $queryEditorHints.empty();
        };
        
        
        const revertStoredHintHTML = function() {
            
            $queryEditorHints.addClass(queryEditorHintsStore.className);
            $queryEditorHints.html(queryEditorHintsStore.html);
        };
        
        
        //---
        
        const showEditorInfo = function(e) {

            /**
             * Receives a custom MOUSEOVER event
             * From this we gather KEY from the elements text, and we use the elements Class to route to the correct Info method
             */
            
            const $el = $(this);
            const key = e.currentTarget.innerText.toLowerCase();

            if( $el.hasClass('cm-keyword') || $el.hasClass('cm-mpql-keyword') )
            {
                showEditorKeywordSyntax(key);
            }
            else if( $el.hasClass('cm-column') )
            {
                showEditorColumnDescription(key);
            }
            else if( $el.hasClass('cm-mpql-function') )
            {
                showEditorFunctionSyntax(key);
            }
            else if( $el.hasClass('cm-mpql-datetime-clauses') || $el.hasClass('cm-mpql-datetime-values') )
            {
                showEditorDatetimeSyntax(key);
            }
        }
        
        
        const editorCursorMoved = function(ed) {
            
            /**
             * Receives a Cursor changed event from Codemirror
             * From this we can extract the KEY and css CLASS, so we can show INFO on each token as the cursor traverses it
             */
            const cursor = ed.getCursor();
            const token = ed.getTokenAt( cursor, false);

            if( $.type(token) === 'object' && $.type(token.type) === 'string' )
            {
                const key = token.string.toLowerCase();

                if( token.type === 'keyword' || token.type === 'mpql-keyword' )
                {
                    showEditorKeywordSyntax(key);
                }
                else if( token.type === 'column' )
                {
                   showEditorColumnDescription(key);
                }
                else if( token.type === 'function' || token.type === 'mpql-function' )
                {
                    showEditorFunctionSyntax(key);
                }
                else if( token.type === 'mpql-datetime-clauses' || 'mpql-datetime-values' )
                {
                    showEditorDatetimeSyntax(key);
                }
            }  
        }
        
        
        const showEditorKeywordSyntax = function(key) {
            
            const info = infoKeywordDict[key];

            if( typeof info === 'object' )
            {
                storeHintHTML();
                $queryEditorHints.addClass('status-message-keyword-info');
                
                $( '<span class="keyword-info-syntax">' + dexInfo.render(info.syntax) + '</span>' ).appendTo($queryEditorHints);
                $( '<span class="keyword-info-description">' + dexInfo.render(info.description) + '</span>' ).appendTo($queryEditorHints); 
            }
        };
        
        const showEditorColumnDescription = function(key) {
            
            const info = infoColumnDict[key];
            
            if( typeof info === 'object' )
            {
                storeHintHTML();
                $queryEditorHints.addClass('status-message-column-info');
                
                let columnInfoSyntax = $( '<span class="column-info-syntax"></span>' ).appendTo($queryEditorHints);
                $( '<span class="column-info-table"><span class="cm-table">' + info.table + '</span></span>' ).appendTo(columnInfoSyntax);
                $( '<span class="column-info-column"><span class="cm-column">' + info.friendlyname + '</span></span>' ).appendTo(columnInfoSyntax);
                $( '<span class="column-info-description">' + dexInfo.render(info.description) + '</span>' ).appendTo($queryEditorHints);     
            }
        };
        
        
        const mapArgTypeClass = function(dataType) {
            
            switch(dataType) {
                
                case 'BOOLEAN':
                    return 'cm-boolean';
                    
                case 'COLUMN':
                    return 'cm-column';
                    
                case 'NUMBER':
                case 'INT':
                case 'DECIMAL':
                case 'FLOAT':
                    return 'cm-number';
                    
                case 'STRING':
                    return 'cm-string';
            }
        }
        
        const funcSyntax = function(info) {

            let comma = '';
            let argCount = 0;
            let argsHTML = '';
            let funcHTML;
            
            // Open the SYNTAX DEF
            funcHTML += '<span class="func-info-syntax">';
            
            // Add the Function( text
            funcHTML = '<span class="cm-mpql-function">' + info.name + '</span> <span class="cm-bracket">(</span>';
            
            if( $.type(info.args) === 'array' && info.args.length )
            {
                // Add the MANDATORY args
                info.args.forEach(function(arg) {
                    comma = argCount === 0 ? '' : ', ';
                    argsHTML += comma + '<span class="' + mapArgTypeClass(arg.data_type) +'">&lt;' + arg.name + '&gt;</span>';
                    argCount ++;
                });
                funcHTML += argsHTML   
            }

            // Add a comma, if we have already displayed args
            if( argCount > 0 && info.opt_args.length > 0 )
            {
                funcHTML += ', ';
            }
            
            // Add the OPTIONAL open square bracket
            funcHTML += info.opt_args.length === 0 ? '' : '[';
            
            if( $.type(info.opt_args) === 'array' && info.opt_args.length > 0 )
            {
                // Add the OPTIONAL args
                argsHTML = '';
                argCount = 0;
                info.opt_args.forEach(function(arg) {
                    comma = argCount === 0 ? '' : ', ';
                    argsHTML += comma + '<span class="' + mapArgTypeClass(arg.data_type) +'">&lt;' + arg.name + '&gt;</span>';
                    argCount ++;
                });
                funcHTML += argsHTML
            }
            
            // Add the OPTIONAL close square bracket
            funcHTML += info.opt_args.length === 0 ? '' : ']';
            
            // Add the closing bracket
            funcHTML += '<span class="cm-bracket">)</span>';
            
            // Close the SYNTAX DEF
            funcHTML += '</span>';
            
            
            // Add Return type
            funcHTML += ' <span class="func-info-return-type ">returns <span class="' + mapArgTypeClass(info.returns) +'">' + info.returns + '</span>';
            
            // close HTML
            funcHTML += '</span>';
            
            return funcHTML;
        }
        
    
        const showEditorFunctionSyntax = function(key) {

            key = key.replace('()','').toLowerCase();
            const info = infoMPQLFunctionDefinitionsDict[key];
            
            if( typeof info === 'object' && ($.type(info.args) === 'array' || $.type(info.opt_args) === 'array') )
            {
                storeHintHTML();
                $queryEditorHints.addClass('status-message-function-info');
                
                $( '<span class="func-info-syntax">' + funcSyntax(info) + '</span>' ).appendTo($queryEditorHints);
                $( '<span class="func-info-description">' + dexInfo.render(info.description) + '</span>' ).appendTo($queryEditorHints);
            }
        };
        
        const showEditorDatetimeSyntax = function(key) {

            if( key === 'minutes' || key === 'hours' || key === 'days' || key === 'weeks' || key === 'months' )
            {
                key = key.slice(0, -1);
            }
            
            const info = infoDatetimeDefinitionsDict[key];
            
            if( typeof info === 'object' )
            {
                storeHintHTML();
                $queryEditorHints.addClass('status-message-datetime-info');
                
                $( '<span class="datetime-info-syntax">' + dexInfo.render(info.syntax) + '</span>' ).appendTo($queryEditorHints);
                $( '<span class="datetime-info-description">' + dexInfo.render(info.description) + '</span>' ).appendTo($queryEditorHints);
            }
        };
        
        
        //---
        const showPickerInfo = function(e) {

            const $el = $(e);
            const key = e.currentTarget.innerText.toLowerCase();

            if( $el.hasClass('cm-keyword') || $el.hasClass('cm-mpql-keyword') )
            {
                queryEditor.showPickerKeywordInfo(key);
            }
            else if( $el.hasClass('cm-column') )
            {
                queryEditor.showPickerColumnInfo(key);
            }
            else if( $el.hasClass('cm-mpql-function') )
            {
                queryEditor.showPickerFunctionInfo(key);
            }
            else if( $el.hasClass('cm-mpql-datetime-clauses') || $el.hasClass('cm-mpql-datetime-values') )
            {
                queryEditor.showPickerDatetimeInfo(key);
            }
        }
       
        
        queryEditor.showPickerKeywordInfo = function(key)
        {
            const info = infoKeywordDict[key];
            const $infoContainer = $('#CodeMirror_Picker_Info_Container');

            $infoContainer.empty();
            
            if( typeof info === 'object' )
            {
                $( '<span class="keyword-info-description">' + dexInfo.render(info.description) + '</span>' ).appendTo($infoContainer);     
            }
        }
        
        
        queryEditor.showPickerColumnInfo = function(key)
        {
            const info = infoColumnDict[key];
            const $infoContainer = $('#CodeMirror_Picker_Info_Container');
            
            $infoContainer.empty();
            
            if( typeof info === 'object' )
            {
                $( '<span class="column-info-description">' + dexInfo.render(info.description) + '</span>' ).appendTo($infoContainer);     
            }
        }
        

        queryEditor.showPickerFunctionInfo = function(key)
        {
            const info = infoMPQLFunctionDefinitionsDict[key];
            const $infoContainer = $('#CodeMirror_Picker_Info_Container');
            
            $infoContainer.empty();
            
            if( typeof info === 'object' )
            {
                $( '<span class="func-info-description">' + dexInfo.render(info.description) + '</span>' ).appendTo($infoContainer);
            }
        }
        
        
        queryEditor.showPickerDatetimeInfo = function(key)
        {
            if( key === 'minutes' || key === 'hours' || key === 'days' || key === 'weeks' || key === 'months' )
            {
                key = key.slice(0, -1);
            }

            const info = infoDatetimeDefinitionsDict[key];
            const $infoContainer = $('#CodeMirror_Picker_Info_Container');

            $infoContainer.empty();
            
            if( typeof info === 'object' )
            {
                $( '<span class="datetime-info-description">' + dexInfo.render(info.description) + '</span>' ).appendTo($infoContainer);
            }
        }
        
        
        //-----------------------
        
        const constructKeywordInfoDictionary = function() {
            if( typeof mpqlKeywordDefinitions === 'object' && typeof mpqlKeywordDefinitions.keywords === 'object')
            {
                infoKeywordDict = {};
                
                mpqlKeywordDefinitions.keywords.forEach(function(keyword,i) {
                    infoKeywordDict[keyword.id.toLowerCase()] = keyword;
                });
            }
        };       
        constructKeywordInfoDictionary();
        
        
        const constructColumnInfoDict = function(data) {
            
            if( $.type(data) !== 'array' )
            {
                data = tableData;
            }

            let selectedTable = null;
            if( $.type(editor.mpqlState) === 'object' && $.type(editor.mpqlState.selectedTable) === 'object' )
            {
                selectedTable = editor.mpqlState.selectedTable;
            }
            
            
            if( $.type(data) === 'array' )
            {
                infoColumnDict = {};
                
                // If the Query string selects a TABLE, we can use it to filter the Column data, to only show Columns from that Table
                if( $.type(selectedTable) === 'string' )
                {
                    selectedTable = selectedTable.toLowerCase();
                    
                    data.forEach(function(column,index) {
                        if( column.table === selectedTable )
                        {
                            infoColumnDict[column.name.toLowerCase()] = column;
                        }
                    });  
                }
                else
                {
                    data.forEach(function(column,index) {
                        infoColumnDict[column.name.toLowerCase()] = column;
                    });
                }
            }
        } 
        
        
        const constructFunctionInfoDictionary = function() {
            if( typeof mpqlFunctionDefinitions === 'object' && typeof mpqlFunctionDefinitions.functions === 'object')
            {
                infoMPQLFunctionDefinitionsDict = {};
                
                mpqlFunctionDefinitions.functions.forEach(function(func,i) {
                    infoMPQLFunctionDefinitionsDict[func.id.toLowerCase()] = func;
                });
            }
        }
        constructFunctionInfoDictionary();
        
        
        const constructDatetimeInfoDictionary = function() {
            if( typeof mpqlDatetimeDefinitions === 'object' && typeof mpqlDatetimeDefinitions.keywords === 'object')
            {
                infoDatetimeDefinitionsDict = {};
                
                mpqlDatetimeDefinitions.keywords.forEach(function(keyword,i) {
                    infoDatetimeDefinitionsDict[keyword.id.toLowerCase()] = keyword;
                });
            }
        }
        constructDatetimeInfoDictionary();
        
        //---
        
        
        const updateEditorOptions = function(data) {
            
            /** 
             *  Creates an object of TABLE properties, each containing an array of COLUMN names
             *  This is set in the editors options, to provide the Auto-completion system with account specific TABLE / COLUMN names
             */
            
            tableData = data;
            let tables = {};
            data.forEach(function(item) {

                if( tables.hasOwnProperty(item.table) === false )
                {
                    tables[item.table] = [];
                }

                if( tables[item.table].indexOf(item.friendlyname) )
                {
                    tables[item.table].push(item.friendlyname); 
                }   
            }); 

            // Set the Editors table data, with the customers tables
            editor.setOption("hintOptions", {
                'addSpaces': true,
                'container': document.getElementById('data_explorer_query_editor'),
                'alignWithWord': true,
                'closeOnUnfocus': false,
                'tables': tables 
                });
        };

        
        const showQueryServerSpinner = function(){
            window.statusFactory({ 
                container_el: $queryServerStatusSpinner.get(0),
                namespace: 'data_explorer.queryServerStatus'
            });
        };
        
        
        const queryServerReady = function(state) {
            if( $.type(state) === 'boolean')
            {
                queryEditor.state.queryServer.ready = state;
            }
            else
            {
                return queryEditor.state.queryServer.ready;
            }
        } 
        
        
        const hideQueryServerStatusSpinner = function(){
            $queryServerStatusSpinner.empty();
        };
        
        
        const setQueryServerRequestingConnectionDetails = function() {
            
            queryServerReady(false);
            $queryItemButtonRun.addClass('disabled');
            $queryServerStatusText.text('Requesting Server');
            showQueryServerSpinner();
        };
        
        
        const setQueryServerAvailable = function() {
            
            queryServerReady(true);
            $queryItemButtonRun.removeClass('disabled');
            $queryServerStatusText.text('Server Ready');
            hideQueryServerStatusSpinner();
        };
        
        
        queryEditor.updateMetadata = function( data, storeData = true ) {
            
            /**
             * Triggered when data received from server
             */
            
            if( $.type(data) === 'array' )
            {                
                updateEditorOptions(data);
                constructColumnInfoDict(data);
                
                window.akdv.utils_event.dispatchCustomEvent(window, 'status', 'done.akdv');
                
                if(storeData)
                {
                    storeColumnData(data);
                    setQueryServerAvailable();
                }
            }
        }

        
        const getDevModeData = function() {
            
            if(_dataExplorer().state.devMode)
            {
                // Get pottet table/column data from a JSON file
                window.akdv.xmlHTTP.getJSON({ url: '../data/data_explorer/data_explorer_tables.json' }).then( ( data ) => { queryEditor.updateMetadata( data.charts[0].data ); } );
            }
        };
        
        
        const storeColumnData = function(data) {
            
            /*
             * Stores users Table Column data, to allow for immediate enhanced auto-completion
             */
            
            if( $.type(data) === 'array' )
            {
                storage.local.setItem( _dataExplorer().storedColumnDataKey, data );
            }
            else
            {
                window._log.warn('WARNING: Could not store Column data, data not an array');
            }
        }
        
        
        const getStoredColumnData = function() {
            
            /*
             * Gets stored users Table Column data, to allow for immediate enhanced auto-completion
             */

            const data = storage.local.getItem( _dataExplorer().storedColumnDataKey );

            if( $.type(data) === 'array' )
            {
                queryEditor.updateMetadata( data, false );
            } 
        }
        
        
        const init = function() {

            // Instantiate Codemirror within window.akdv.dataExplorer 
            queryEditor.mpqlEditor = window.CodeMirror( document.getElementById('data_explorer_query_editor'), {
                'mode': "text/x-mpql",
                'theme': "akamai", // Applies a 'cm-s-akamai class to the editor parent element'
                'cursorBlinkRate': 600,
                'cursorHeight': 0.75,
                'flattenSpans': false,            
                'extraKeys': { "Tab" : "autocomplete" }, // To invoke the auto complete
                'lineNumbers': false,
                'lineWrapping': true,
                'hint': CodeMirror.hint.sql, // This uses our own definition of the sql hinter, customized for mpql
                'hintOptions': {
                    'addSpaces': true,
                    'container': document.getElementById('data_explorer_query_editor'),
                    'alignWithWord': true,
                    'closeOnUnfocus': false,
                    'tables': {}
                },
                value: "",  
            });
            
            // Alias mpqlEditor for brevity (also Codemirror is refered to internally as editor, so following same pattern here)
            editor = queryEditor.mpqlEditor;

            getStoredColumnData();
            
            // Parse the Query on any CHANGE or UPDATE events from CodeMirror
            editor.on( "cursorActivity", editorCursorMoved );
            
            // MOUSE events For mPQL EDITOR, show Info for each Query item
            $(editor.getScrollerElement()).on('mouseenter','span[role=presentation] span', showEditorInfo );
            $(editor.getScrollerElement()).on('mouseleave','span.cm-mpql-function', revertStoredHintHTML );
            
            //  MOUSE events For mPQL Dropdown PICKER, show Info for each Query item 
            $('#data_explorer_query_editor').on('mouseenter','.CodeMirror-hints .CodeMirror-hint', showPickerInfo );
            
            
            const stringArrayFromObjProps = function(obj) {
                const strArray = [];
                for (var property in obj) {
                    if ( obj.hasOwnProperty(property) && property.length > 0 )
                    {
                        strArray.push( property.toUpperCase() );
                    }
                }

                return strArray;
            };

            // Provide an externally available reference of all MQPL keywords
            const modeDefs = CodeMirror.resolveMode(editor.doc.modeOption);
            editor.mpqlKeywords = {
                    'dateSQL' : stringArrayFromObjProps(modeDefs['dateSQL']),
                    'sqlKeywords' : stringArrayFromObjProps(modeDefs['sqlKeywords']),
                    'keywords' : stringArrayFromObjProps(modeDefs['keywords']),
                    'mpqlDateTimeClauses' : stringArrayFromObjProps(modeDefs['mpqlDateTimeClauses']),
                    'mpqlDateTimeValues' : stringArrayFromObjProps(modeDefs['mpqlDateTimeValues']),
                    'mpqlForbidden' : stringArrayFromObjProps(modeDefs['mpqlForbidden']),
                    'mpqlFunctions' : stringArrayFromObjProps(modeDefs['mpqlFunctions']),
                    'mpqlKeywords' : stringArrayFromObjProps(modeDefs['mpqlKeywords'])         
            };
            
            // Instantiate MPQL parser and do an initial parse
            editor.mpqlParser = new CodeMirror.mpqlParser(editor);
            getStoredLiveEditorQueryString();
            editor.mpqlParser.parse();
            
            
            // Create a state object, and set its defaults
            editor.mpqlState = { 
                    selectedTable : null, // The currently selected table i.e. query contains a valid 'FROM tablename'
                    queryData : null, // set this to true, if data has been received, stored from a Query
                    queryID: null // The UUID of the QUERY currently in the editor
            };
            
            parserDisplay();
            
            setQueryTitle();
            setQueryInfoLastRun();
            setQueryInfoDuration();
             
            
            // ---------- INIT EVENTS ------------            
            // ENTER key handler, for the Query title area
            $queryitemTitle.on('keyup', function(event) {
                event.preventDefault();
                if (event.keyCode === 13) { queryEditor.saveQuery(); }
            });
            
            // Parse the Query on any CHANGE or UPDATE events from CodeMirror
            editor.on( "change", queryChanged );
            
            editor.on( "update", queryChanged );
            
            editor.on( "blur", function(){
                // Dispatched when the editor loses focus
            });
            
            editor.on("optionChange", function(opt) {
                
                // Dispatched every time an option is changed with setOption.
                window._log.debug('OPTIONS CHANGED : ', opt.options );
                
                // Options have changed, so refresh the editor content (triggers a HINT bump) and then parse it afresh!
                refreshEditorContent();
                editor.mpqlParser.analyzeQuery();
            });
            
            // ---- BUTTON EVENTS -----
            // CLEAR the Query Editor
            $queryItemButtonNew.on( "click", queryEditor.resetQueryEditor );
            
            // SAVE the current Query
            $queryItemButtonSave.on( "click", queryEditor.saveQuery );
            
            // RUN the current Query on the Server
            $queryItemButtonRun.on( "click", queryEditor.runQueryOnServer );
            
            // When the parser throws a table-selected/de-selected event, set its state in editor
            $dataExplorer.on( 'mpqlParser:table-selected', (e,data) => setTable(data.tableName) );
            $dataExplorer.on( 'mpqlParser:table-deselected', (e,data) => setTable() );
            
            // Clear the Analyzing Spinner, once Columnar data is returned
            $(window).on('result.data-explorer-column-data', ( e, data ) => { queryEditor.updateMetadata( data.data ); }  );
            
            $(window).on('result.query-result', queryDataReturnedFromServer ); // Triggered when Query response data is received
            
            setQueryServerRequestingConnectionDetails();
        };
        
        init();
                
        window._log.debug('Data Explorer EDITOR Init');
        
        $(window).trigger('dex-query-editor-init', {
            "dataExplorer" : _dataExplorer(),
            "queryEditor" : queryEditor 
        });

        window.akdv.dataExplorer.queryEditor = queryEditor;
        
        getDevModeData();
        
        return queryEditor;
    };

    $(window).on('dex-init', window.akdv.dataExplorer.queryEditor );
  
})(window, document, window.jQuery, window.CodeMirror, window.markdownit, window.akdv.storage);