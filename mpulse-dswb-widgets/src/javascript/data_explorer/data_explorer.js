;(function(window, document, $, markdownit) {

    'use strict';
    
    window.akdv.dataExplorer = function() {
      
        // Create namespace and initialize
        var dataExplorer = function(){};
        dataExplorer();
        
        dataExplorer.state = {
                'devMode' : true,
                'queryServer': {
                    'noteBookIDSet' : false
                }
        };
        
        dataExplorer.event = { 'queryEditor':{}, 'queryLibrary':{}, 'dataViz':{} };
        dataExplorer.currentEditoryQueryStringKey = 'data-explorer-current-editor-query-string';
        dataExplorer.storedQueryKey = 'data-explorer-global-query-history';
        dataExplorer.storedColumnDataKey = 'data-explorer-stored-column-data';
        
        dataExplorer.queryEditor = null;
        dataExplorer.queryLibrary = null;
        dataExplorer.dataViz = null;
        
        dataExplorer.event.queryLibrary.storedQueryDataUpdated = 'data-explorer-stored-query-data-updated';
 

        /** ----- Markdown System ------ **/
        dataExplorer.info = {};        
        const mkdown = markdownit();
        
        dataExplorer.info.render = function(string) {
          
            let markdownString = mkdown.renderInline(string);  

            // Function elements
            const funcStartRex = /^[a-zA-Z_]*[(]/;
            if( $.type(markdownString.match(funcStartRex)) === 'array' )
            {
                const funcEndRex = /[?!)]$/;
                const numberArgRex = /(&lt;number&gt;)/g;
                const stringArgRex = /(&lt;str&gt;|&lt;string&gt;)/g;
                const expressionArgRex = /&lt;[a-z]*[_]*expr[0-9]?&gt;/g;
                
                // Style function start
                markdownString = markdownString.replace( funcStartRex, (string,i) => { 
                    let funcName = string.substr(0, string.length -1);
                    return '<span class="cm-mpql-function">' + funcName + '</span><span class="cm-bracket">( </span>';
                });
                
                // Style function end
                markdownString = markdownString.replace(funcEndRex,'<span class="cm-bracket">&nbsp;)</span>');
                
                // Style commas
                markdownString = markdownString.replace( /,/g, ', ');
                
                // Style arguments
                markdownString = markdownString.replace(numberArgRex, (string,i) => {
                        return '<span class="cm-number">' + string + '</span>'; 
                });
                
                markdownString = markdownString.replace(stringArgRex,'<span class="cm-string">&lt;string&gt;</span>');
                
                markdownString = markdownString.replace(expressionArgRex, (string,i) => {
                    return '<span class="cm-operator">' + string +'</span>';
                });
                
                
            }
            
            
            const regex = /±[A-Z]*[a-z]*[_-]?[A-Z]*[a-z]*±/g;
            const tokens = markdownString.match(regex);

            if( $.type(tokens) === 'array' )
            {
                tokens.forEach( (token,i) => {
                    
                    const key = token.replace( new RegExp('±', 'g'),'').toLowerCase();
                    
                    // Wrap KEYWORDS
                    let keywd = window.mpqlKeywordDefinitions.keywords.some( (keyword) => {
                        
                        if(keyword.id === key)
                        {
                            markdownString = markdownString.replace( new RegExp(token, 'g'), "<span class='cm-keyword'>" + key.toUpperCase() + "</span>");
                            return true;
                        }
                        else
                        {
                            return false;
                        }
                    });

                    if(!keywd)
                    {
                        // Wrap FUNCTIONS
                        let fnc = window.mpqlFunctionDefinitions.functions.some( (func) => {
                            
                            if(func.id === key)
                            {
                                markdownString = markdownString.replace( new RegExp(token, 'g'), "<span class='cm-mpql-function'>" + key.toUpperCase() + "</span>");
                                return true;
                            }
                            else
                            {
                                return false;
                            }
                        });
                        
                        if(!fnc)
                        {
                            // Wrap DATETIME clauses and values
                            let dtime = window.mpqlDatetimeDefinitions.keywords.some( (keyword) => {
                                
                                if( key.match(new RegExp(keyword.regex)) !== null )
                                {
                                    let cls = 'cm-mpql-datetime-values';
                                    if(keyword.category === 'clause')
                                    {
                                        cls = 'cm-mpql-datetime-clauses';
                                    }
                                    
                                    markdownString = markdownString.replace( new RegExp(token, 'g'), "<span class='" + cls +"'>" + key.toUpperCase() + "</span>");
                                    return true;
                                }
                                else
                                {
                                    return false;
                                }
                            });
                            
                            if(!dtime)
                            {
                                // Wrap GENERICS
                                let generics = window.mpqlGenericsDefinitions.generics.some( (generic) => {

                                    if( key.match(new RegExp(generic.regex)) !== null )
                                    {
                                        markdownString = markdownString.replace( new RegExp(token, 'g'), "<span class='" + generic.className + "'>" + key + "</span>");
                                        return true;
                                    }
                                    else
                                    {
                                        return false;
                                    }
                                });
                            }
                        }
                    }
                });
            }

            return markdownString; 
        };
        /** ------------------ */
 
        window._log.debug('Data Explorer MAIN Init');
        
        $(window).trigger('dex-init', { "dataExplorer" : dataExplorer } );
 
        return dataExplorer;
    };
    
    $(window).on('init-charts.akdv', window.akdv.dataExplorer ); // Triggered when AKDV pipe is ready
    
})(window, document, window.jQuery, window.markdownit);