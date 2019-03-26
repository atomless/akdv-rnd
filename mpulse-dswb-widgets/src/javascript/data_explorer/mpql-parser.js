;(function(window, document, CodeMirror) {
 
    'use strict';

    CodeMirror.mpqlParser = function(editor) {

        /**
         * For init, requires a current instantiation of a CodeMirror, passed in as editor
         */
        
        let mpqlParser = function(){};
       
        
        // Public Properties/Methods
        mpqlParser.editor = editor;
        
        // Private Properties
        let parsedLines = [];

  
        let getMPQLDateTimeValues = function() {
            
            var mode = editor.doc.modeOption;
            
            if (mode === "sql") { mode = "text/x-sql"; }
            
            return CodeMirror.resolveMode(mode).mpqlDateTimeValues;
        }
        
        
        var mpqlFunctionDefs = null;
        if( typeof window.mpqlFunctionDefinitions === 'object' )
        {
            mpqlFunctionDefs = Object.assign( {},  window.mpqlFunctionDefinitions ); 
        }
        else
        {
            window._log.debug('mpqlFunctionDefinitions is undefined. MPQL function parsing will be non-functional!');
        }
        
        
        const isFunction = function(funcName) {
            const funcNameLower = funcName.toLowerCase();
            return mpqlFunctionDefs.functions.some( (obj ) => { return obj.id === funcNameLower } );
        };

        
        let createID = function(){
            return window.akdv.utils_string.generateUUID().substring(0, 8);
        };
        
        
        let createNewScope = function(line, scopeType, currentScope, scopeCreator) {
            
            let newScope = {};
  
            if( typeof currentScope === 'object' )
            { 
                newScope.parentScopeID = currentScope.scopeID;
            }

            if( typeof scopeType === 'string' && scopeType.length !== 0 )
            {
                newScope.scopeType = scopeType;
            }
            else
            {
                newScope.scopeType = 'query-string';
            }
                        
            if( typeof scopeCreator === 'object' )
            {
                newScope.scopeID = createID();
            }
            else 
            {
                newScope.scopeID = createID();
            }
            
            if( typeof scopeCreator === 'object' )
            {
                newScope.scopeCreatorID = scopeCreator.itemID;
                
                if( typeof scopeCreator.scopeSubType === 'string' )
                {
                    newScope.scopeSubType = scopeCreator.scopeSubType;
                }
            }

            // Store the new scope in the current lines object .scopes array
            parsedLines[line].scopes[newScope.scopeID] = newScope;
            
            newScope.items = [];
            
            return newScope;
        }
        
        
        let getScope = function(line,scopeID) {
            return parsedLines[line].scopes[scopeID];
        }
        
        
        let createItem = function( line, itemType, scope, span ) {
            
            let item = {};
            item.itemContent = span.innerText;

            /** --------------------  EXIT scope, when next token is not acceptable for the current scope ----------------- */
            if( scope.scopeType === 'from-arguments' )
            {
                if(itemType !== 'table')
                {
                    scope = getScope( line, scope.parentScopeID );
                }
            }
            else if( scope.scopeType === 'select-arguments' )
            {
                if( itemType !== 'comma' && itemType !== 'bracket-open' && itemType !== 'bracket-close' &&  itemType !== 'column' && itemType !== 'function' )
                {
                    scope = getScope( line, scope.parentScopeID );
                }
            }
            else if( scope.scopeType === 'function-arguments' )
            {
                if( typeof scope.scopeSubType === 'string' )
                {
                    if( isFunction(scope.scopeSubType) )
                    {
                        if( itemType !== 'bracket-open' && itemType !== 'comma' && itemType !== 'column' && itemType !== 'function' && itemType !== 'number' )
                        {
                            scope = getScope( line, scope.parentScopeID );
                        }
                    }   
                }
            }
            else if( scope.scopeType === 'where-arguments' )
            {
                if( itemType !== 'column' && itemType !== 'operator' && itemType !== 'string')
                {
                    scope = getScope( line, scope.parentScopeID );
                }
            }
            else if( scope.scopeType === 'groupby-arguments' )
            {
                if( itemType !== 'comma' && itemType !== 'column' )
                {
                    scope = getScope( line, scope.parentScopeID );
                }  
            }
            else if( scope.scopeType === 'orderby-arguments' )
            {
                if( itemType !== 'comma' && itemType !== 'column' && itemType !== 'number' && item.itemContent !== 'ASC' && item.itemContent !== 'DESC' )
                { 
                    scope = getScope( line, scope.parentScopeID );
                }    
            }
            else if( scope.scopeType === 'timeseries-arguments' )
            {
                if( item.itemContent !== 'BY' && itemType !== 'datetime-value')
                {
                    scope = getScope( line, scope.parentScopeID );
                }
            }
            else if( scope.scopeType === 'since-arguments' )
            {
                if( itemType !== 'number' && itemType !== 'datetime-value')
                {
                    scope = getScope( line, scope.parentScopeID );
                }
            }
            else if( scope.scopeType === 'until-arguments' )
            {
                if( itemType !== 'number' && itemType !== 'datetime-value')
                {
                    scope = getScope( line, scope.parentScopeID );
                }
            }
            
            
            scope.items.push(item);
            
            if( typeof scope.scopeCreatorID === 'string' )
            {
                item.itemID = scope.scopeCreatorID + '_' + createID();
            }
            else
            {
                item.itemID = createID();
            }

            item.itemScope = scope.scopeID;
            item.itemScopeType = scope.scopeType;
            item.itemType = itemType;
            item.itemClassName = span.className;
            item.spanElement = span;
            item.txtStart = Number(span.getAttribute('data-string-start'));
            item.txtEnd = Number(span.getAttribute('data-string-end'));

            // Store this item in our map, for easy retreval
            parsedLines[line].queryItems[item.itemID] = item;
            
            // Apply the current item ID, to the DOM span , so we can link the two
            span.setAttribute('data-parser-item-id',item.itemID);
            
            
            if(item.itemType === 'keyword' || item.itemType === 'mpql-keyword') 
            {
                if(item.itemContent === 'FROM')
                {
                    scope = createNewScope(line, 'from-arguments', scope, item);
                    item.itemArguments = scope;
                }
                else if(item.itemContent === 'SELECT')
                {
                    scope = createNewScope(line, 'select-arguments', scope, item);
                    item.itemArguments = scope;
                }
                else if(item.itemContent === 'WHERE')
                {
                    scope = createNewScope(line, 'where-arguments', scope, item);
                    item.itemArguments = scope;
                }
                else if(item.itemContent === 'GROUPBY')
                {
                    scope = createNewScope(line, 'groupby-arguments', scope, item);
                    item.itemArguments = scope;
                }
                else if(item.itemContent === 'ORDERBY')
                {
                    scope = createNewScope(line, 'orderby-arguments', scope, item);
                    item.itemArguments = scope;
                }
                else if(item.itemContent === 'TIMESERIES')
                {
                    scope = createNewScope(line, 'timeseries-arguments', scope, item);
                    item.itemArguments = scope;
                }
            }
            else if(item.itemType === 'datetime-clause') 
            {
                item.scopeSubType = item.itemContent;
                
                if(item.itemContent === 'SINCE')
                {
                    scope = createNewScope(line, 'since-arguments', scope, item);
                    item.itemArguments = scope;
                }
                else if(item.itemContent === 'UNTIL')
                {
                    scope = createNewScope(line, 'until-arguments', scope, item);
                    item.itemArguments = scope;
                }
            }
            else if(item.itemType === 'function') 
            {
                if( isFunction(item.itemContent) )
                {
                    item.scopeSubType = item.itemContent;
                    scope = createNewScope(line, 'function-arguments', scope, item);
                    item.itemArguments = scope;
                }   
            }
            
            if( scope.scopeType === 'timeseries-arguments') 
            {
            }

            return scope;
        }
        
        
        mpqlParser.displayParserStruct = function() {
            /**
             * Displays the nested structure of the current Parsed Line. Useful when debugging the Parser engine
             */
            
            if( $(window.document.body).hasClass('display-parser') )
            {
                let content = ['items','itemContent','itemArguments','scopeType'];
                $('#parser_display').html( '<pre>' + JSON.stringify(parsedLines[0].queryStructure, content, 2) + '</pre>' );
            }
        }
        
        
        mpqlParser.analyzeQuery = function() {
            
            /**
             * Checks each LINE of the current Query, and checks to see if a valid database TABLE has been selected
             * If one has it is set as selected for ALL LINES of the Query
             */
            
            parsedLines.forEach((line,i) => { 
                
                for (let itemName in line.queryItems) {
                    if (line.queryItems.hasOwnProperty(itemName))
                    {
                        let item = line.queryItems[itemName];
                        
                        if( item.itemContent === 'FROM' )
                        {
                            if( line.queryItems[itemName].itemArguments.items.length === 1 )
                            {
                                $('#data_explorer').trigger('mpqlParser:table-selected', { 'tableName': line.queryItems[itemName].itemArguments.items[0].itemContent } );
                            }
                            else
                            {
                                $('#data_explorer').trigger('mpqlParser:table-deselected',{} );
                            }
                        }
                    }
                }
            });
        }
        
        
        mpqlParser.parse = function() {
            
            //window._log.debug('------------------------------- mpqlParser.parse ---------------------------------------');
            
            let currentString = editor.getValue();
            let $queryLines = $(editor.display.wrapper).find('.CodeMirror-code[role=presentation]  .CodeMirror-line[role=presentation] ');
            parsedLines = [];

            $queryLines.each(function(lineIndex,line) {
              
                let $lineSpans = $(line).find('span[class^=cm-]');
                let allTokens = editor.getLineTokens(lineIndex);
                let filteredTokens = allTokens.filter( token => token.string !== ' ' );

                // Init This lines object
                parsedLines[lineIndex] = {
                        'queryStructure': null,
                        'scopes': [],
                        'queryItems': {},
                };
                
                let currentLine = parsedLines[lineIndex];
                let scope = createNewScope(lineIndex);
                let topLevelScope = scope;
                
                currentLine.queryStructure = topLevelScope;
                
                $lineSpans.each(function(i,span) {

                    let $span = $(span);
                    let content = span.innerText.toUpperCase();
                    let className = span.className;
    
                    for (i = 0; i < filteredTokens.length; i++) {
                        if( filteredTokens[i].string.toUpperCase() === content )
                        {
                            let matchingToken = filteredTokens[i];
                            span.setAttribute('data-string-start', matchingToken.start);
                            span.setAttribute('data-string-end', matchingToken.end);
                            span.setAttribute('data-token-type', matchingToken.type);
                            filteredTokens.shift();
                            break;
                        }
                    }
                    
                    /**
                     * Check if the current spans classname matches one of our types
                     * If it does, create a new ITEM for it in the current scope
                     */
                    if(className === 'cm-keyword')
                    {
                        scope = createItem( lineIndex, 'keyword', scope, span );
                    }
                    else if(className === 'cm-bracket')
                    {
                        if(span.innerText === '(') 
                        {
                            scope = createItem( lineIndex, 'bracket-open', scope, span );
                        }
                        else if(span.innerText === ')') 
                        {
                            scope = createItem( lineIndex, 'bracket-close', scope, span );
                        } 
                    }
                    else if(className === 'cm-mpql-keyword')
                    {
                        scope = createItem( lineIndex, 'mpql-keyword', scope, span );
                    }
                    else if(className === 'cm-table')
                    {
                        scope = createItem( lineIndex, 'table', scope, span );
                    }
                    else if(className === 'cm-column')
                    {
                        scope = createItem( lineIndex, 'column', scope, span );
                    }
                    else if(className === 'cm-mpql-function')
                    {
                        scope = createItem( lineIndex, 'function', scope, span );
                    }
                    else if(className === 'cm-mpql-datetime-clauses')
                    {
                        scope = createItem( lineIndex, 'datetime-clause', scope, span );
                    }
                    else if(className === 'cm-mpql-datetime-values')
                    {
                        scope = createItem( lineIndex, 'datetime-value', scope, span );
                    }
                    else if(className === 'cm-operator')
                    {
                        scope = createItem( lineIndex, 'operator', scope, span );
                    }
                    else if(className === 'cm-number')
                    {
                        scope = createItem( lineIndex, 'number', scope, span );
                    }
                    else if(className === 'cm-string')
                    {
                        scope = createItem( lineIndex, 'string', scope, span );
                    }
                    else if(className === 'cm-comma')
                    {
                        scope = createItem( lineIndex, 'comma', scope, span );
                    }
                    else if(className === 'cm-mpql-forbidden')
                    {
                        scope = createItem( lineIndex, 'keyword-forbidden', scope, span );
                    }
                    else if(className === 'cm-comment')
                    {
                        scope = createItem( lineIndex, 'comment', scope, span );
                    }
                });
                
                
            });
            
            mpqlParser.analyzeQuery();
            mpqlParser.displayParserStruct();
        }
        
        
        $('.CodeMirror-code').on( "mouseenter", "span[class^=cm-]", function( event ) {
            
            window._log.debug('MOUSEENTER');
            
            let spanItemID = this.getAttribute('data-parser-item-id');
            if( spanItemID === null ){ return; }
            
            let spanParentIDs = spanItemID.split('_').reverse();
            let thisSpanID = spanParentIDs.shift();
            
            for (let itemName in mpqlParser.queryItems) {
                if (mpqlParser.queryItems.hasOwnProperty(itemName))
                {
                    let item = mpqlParser.queryItems[itemName];
                    
                    /**
                     * Indicate which items are children of the entered elements scope
                     * Add 'in-parser-scope' class to any spans that inherit this items ID
                     */
                    let regex = new RegExp(spanItemID);
                    if( item.itemID === spanItemID || item.itemID.match(regex) )
                    {
                        $(item.spanElement).addClass('parser-scope');
                    }
                    else
                    {
                        $(item.spanElement).removeClass('parser-scope');
                    }
                    
                    spanParentIDs.forEach(function(parentID,parentIndex){

                        let thisSpanRegex = new RegExp(thisSpanID);
                        let parentIDRegex = new RegExp(parentID);
                        
                        var me = item.itemID.match(thisSpanRegex);
                        var parent = item.itemID.match(parentIDRegex);
                        
                        if( !item.itemID.match(thisSpanRegex) && item.itemID.match(parentIDRegex) )
                        {
                            $(item.spanElement).addClass('parser-scope-parent');
                        }
                        else
                        {
                            $(item.spanElement).removeClass('parser-scope-parent');
                        }
                    });
                }
            }
        });
        
        
        $('.CodeMirror-code .CodeMirror-line [role=presentation]').on( "mouseleave", "span", function( event ) {
            /**
             * Removed in-scope class from Query spans on exit of a span
             */
            $('.CodeMirror-code .CodeMirror-line [role=presentation] span').each(function(i,span){
                $(span).removeClass('parser-scope').removeClass('parser-scope-parent');
            });
        });

        
        mpqlParser.getSpanInfo = function(token) {

            let cursor = this.editor.getCursor();
            if( typeof token === 'undefined') { token = cursor; }
            let struct = parsedLines[cursor.line];
            let item = null;
            
            for (let itemName in struct.queryItems) {
                if (struct.queryItems.hasOwnProperty(itemName))
                {
                    let itm = struct.queryItems[itemName];
                    if( token.start === itm.txtStart ) { return itm; }
                }
            }
            
            return null;
        };
        
        mpqlParser.getScope = function( lineIndex, scopeID ) {
           
            let scope = parsedLines[lineIndex].scopes[scopeID];
            return scope;
        };
        
        
        return mpqlParser;
        
    }
    

})(window, document, window.CodeMirror);