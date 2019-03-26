;(function(window, document, CodeMirror) {
 
    'use strict';
 
    var tables;
    var defaultTable;
    
    var keywords;
    
    var sqlKeywords;
    var mpqlKeywords;
    var mpqlFunctions;
    var mpqlDateTimeClauses;
    var mpqlDateTimeValues;
    var columnValues;
    
    var mpqlParser;
    
    var identifierQuote;
    var CONS = {
      QUERY_DIV: ";",
      ALIAS_KEYWORD: "AS"
    };
    
    var dtRelative = ['today','yesterday'];
    var dtPeriodsPlural = ['minutes','hours','days','weeks','months','years'];
    var dtPeriodsSingular = ['minute','hour','day','week','month','year'];
    
    var Pos = CodeMirror.Pos, cmpPos = CodeMirror.cmpPos;    
    
    function isArray(val) { return Object.prototype.toString.call(val) === "[object Array]" }

    
    let mpqlFunctionHintsList = [];
    let mpqlFunctionDataList = [];
    
    if( typeof mpqlFunctionDefinitions === 'object' && typeof mpqlFunctionDefinitions.functions === 'object')
    {
        mpqlFunctionDefinitions.functions.forEach(function(func,index) {
                
            let item = {
                  'text': func.name,
                  'displayText': func.name.toLowerCase() + '()',
                  'className': 'cm-mpql-function'
             };
            
            mpqlFunctionHintsList.push(item); 
        });
    }
    
    
    
    function getKeywords(editor) {
        return CodeMirror.resolveMode(editor.doc.modeOption).keywords;
    }

    
    function getSQLKeywords(editor) {
        return CodeMirror.resolveMode(editor.doc.modeOption).sqlKeywords;
    }
    
    
    function getMPQLKeywords(editor) {
        return CodeMirror.resolveMode(editor.doc.modeOption).mpqlKeywords;
    }
    
    
    function getMPQLFunctions(editor) {
        return CodeMirror.resolveMode(editor.doc.modeOption).mpqlFunctions;
    }
    
    
    function getMPQLDateTimeClauses(editor) {  
        return CodeMirror.resolveMode(editor.doc.modeOption).mpqlDateTimeClauses;
    }
    
    
    function getMPQLDateTimeValues(editor) { 
        return CodeMirror.resolveMode(editor.doc.modeOption).mpqlDateTimeValues;
    }
    
    
    function getColumnValues(editor) {
        
        let columns = {};

        if( $.type(editor.mpqlState.selectedTableColumns) === 'array' )
        { 
            editor.mpqlState.selectedTableColumns.forEach(function(columnName,index) {
                columns[columnName] = true;
            })
        }

        return columns;
    }
    
    
    function getBrackets(editor) {
        
        var mode = editor.doc.modeOption;
        
        if (mode === "sql") { mode = "text/x-sql"; }
        
        return CodeMirror.resolveMode(mode).brackets;
    }
    
    
    function getIdentifierQuote(editor) {
        var mode = editor.doc.modeOption;
        
        if (mode === "sql") { mode = "text/x-sql"; }
        
        return CodeMirror.resolveMode(mode).identifierQuote || "`";
    }

    
    function getText(item) {
        return typeof item === "string" ? item : item.text;
    }

    
    function wrapTable(name, value) {
      
        if (isArray(value)) { value = {columns: value} }
      
        if (!value.text) { value.text = name; }
      
        return value
    }

    
    function parseTables(input) {
        
        var result = {};
      
        if (isArray(input))
        {
            for (let i = input.length - 1; i >= 0; i--)
            {
                var item = input[i];
                result[getText(item).toUpperCase()] = wrapTable(getText(item), item);
            }
        } 
        else if (input)
        {
            for (let name in input)
            {
                result[name.toUpperCase()] = wrapTable(name, input[name]);
            }
        }
        
        return result;
    }

    
    function getTable(name) {
        return tables[name.toUpperCase()]
    }

    
    function shallowClone(object) {
    
        var result = {};
      
        for (let key in object) { 
            if (object.hasOwnProperty(key)) { result[key] = object[key]; }
        }
      
        return result;
    }

    
    function match(string, word) {
        
        var len = string.length;
      
        var sub = getText(word).substr(0, len);
      
        return string.toUpperCase() === sub.toUpperCase();
    }

    
    function addMatches(result, search, wordlist, formatter) {
        
        if (isArray(wordlist))
        {
            for (let i = 0; i < wordlist.length; i++)
            {
                if (match(search, wordlist[i])) { result.push(formatter(wordlist[i])); }
            }
        }
        else
        {
            for (let word in wordlist) {
                if (wordlist.hasOwnProperty(word))
                {
                    var val = wordlist[word];
                
                    if (!val || val === true)
                    {
                        val = word
                    }
                    else
                    {
                        val = val.displayText ? {text: val.text, displayText: val.displayText} : val.text;
                    }
              
                    if (match(search, val)) { result.push(formatter(val)); }
                }
            }
        }
    }

    
    function cleanName(name) {
        
        // Get rid name from identifierQuote and preceding dot(.)
        if (name.charAt(0) === ".")
        {
            name = name.substr(1);
        }
        
        // replace doublicated identifierQuotes with single identifierQuote and remove single identifierQuotes
        var nameParts = name.split(identifierQuote+identifierQuote);
      
        for (let i = 0; i < nameParts.length; i++)
        {
            nameParts[i] = nameParts[i].replace(new RegExp(identifierQuote,"g"), "");
        }
      
        return nameParts.join(identifierQuote);
    }

    
    function insertIdentifierQuotes(name) {
      
        var nameParts = getText(name).split(".");
      
        for (let i = 0; i < nameParts.length; i++)
        {
            nameParts[i] = identifierQuote + 
            // doublicate identifierQuotes
            nameParts[i].replace(new RegExp(identifierQuote,"g"), identifierQuote+identifierQuote) + 
            identifierQuote;
        }
      
        var escaped = nameParts.join(".");
      
        if (typeof name === "string") { return escaped; }
      
        name = shallowClone(name);
        name.text = escaped;
      
        return name;
    }

    
    function nameCompletion(cur, token, result, editor) {
      
      // Try to complete table, column names and return start position of completion
      var useIdentifierQuotes = false;
      var nameParts = [];
      var start = token.start;
      var cont = true;
      
      while (cont)
      {
          cont = (token.string.charAt(0) === ".");
          useIdentifierQuotes = useIdentifierQuotes || (token.string.charAt(0) === identifierQuote);

          start = token.start;
          nameParts.unshift(cleanName(token.string));

          token = editor.getTokenAt(new Pos(cur.line, token.start));
        
          if (token.string === ".")
          {
              cont = true;
              token = editor.getTokenAt(new Pos(cur.line, token.start));
          }
      }

      // Try to complete table names
      var string = nameParts.join(".");
      
      addMatches(result, string, tables, function(w) {
          return useIdentifierQuotes ? insertIdentifierQuotes(w) : w;
      });

      // Try to complete columns from defaultTable
      addMatches(result, string, defaultTable, function(w) {
          return useIdentifierQuotes ? insertIdentifierQuotes(w) : w;
      });

      // Try to complete columns
      string = nameParts.pop();
      var table = nameParts.join(".");

      var alias = false;
      var aliasTable = table;
      
      // Check if table is available. If not, find table by Alias
      if (!getTable(table))
      {
          var oldTable = table;
          table = findTableByAlias(table, editor);
          if (table !== oldTable) { alias = true; }
      }

      
      var columns = getTable(table);
      if (columns && columns.columns) { columns = columns.columns; }

      
      if (columns)
      {
          addMatches(result, string, columns, function(w) {
              var tableInsert = table;
              
              if (alias === true) { tableInsert = aliasTable; }
              
              if (typeof w === "string")
              {
                  w = tableInsert + "." + w;
              }
              else
              {
                  w = shallowClone(w);
                  w.text = tableInsert + "." + w.text;
              }
          
              return useIdentifierQuotes ? insertIdentifierQuotes(w) : w;
        });
      }

      return start;
    }

    
    function eachWord(lineText, f) {
        
        var words = lineText.split(/\s+/)
        
        for (let i = 0; i < words.length; i++)
        {
            if (words[i])  { f(words[i].replace(/[,;]/g, '')); }
        }
    }

    
    function findTableByAlias(alias, editor) {
        
        var doc = editor.doc;
        var fullQuery = doc.getValue();
        var aliasUpperCase = alias.toUpperCase();
        var previousWord = "";
        var table = "";
        var separator = [];
        var validRange = {
                start: new Pos(0, 0),
                end: new Pos(editor.lastLine(), editor.getLineHandle(editor.lastLine()).length)
        };

      //add separator
      var indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV);
      
      while(indexOfSeparator !== -1)
      {
        separator.push(doc.posFromIndex(indexOfSeparator));
        indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV, indexOfSeparator + 1);
      }
      
      separator.unshift(new Pos(0, 0));
      separator.push(new Pos(editor.lastLine(), editor.getLineHandle(editor.lastLine()).text.length));

      //find valid range
      var prevItem = null;
      var current = editor.getCursor();
      
      for (let i = 0; i < separator.length; i++)
      {
          if ((prevItem === null || cmpPos(current, prevItem) > 0) && cmpPos(current, separator[i]) <= 0)
          {
              validRange = {start: prevItem, end: separator[i]};
              break;
          }
        
          prevItem = separator[i];
      }

      if (validRange.start)
      {
          var query = doc.getRange(validRange.start, validRange.end, false);

          for (let i = 0; i < query.length; i++)
          {
              var lineText = query[i];
          
              eachWord(lineText, function(word) {
                  var wordUpperCase = word.toUpperCase();
                  if (wordUpperCase === aliasUpperCase && getTable(previousWord)) { table = previousWord; }
                  if (wordUpperCase !== CONS.ALIAS_KEYWORD) { previousWord = word; }
              });
          
              if (table) { break; }
          }
      }
      
      return table;
    }

    
CodeMirror.registerHelper("hint", "sql", function(editor, options) {
    
    tables = parseTables(options && options.tables);
    
    var defaultTableName = options && options.defaultTable;
    
    var disableKeywords = options && options.disableKeywords;
    
    defaultTable = defaultTableName && getTable(defaultTableName);
     
    // Get a list of ALL possible keywords
    keywords = getKeywords(editor);
    
    // Get a list of SQL Keywords ONLY
    sqlKeywords = getSQLKeywords(editor);
    
    // Get a list of MPQL specific keywords
    mpqlKeywords = getMPQLKeywords(editor);
    
    // Get a list of MPQL functions
    mpqlFunctions = getMPQLFunctions(editor);
    
    // Get a list of MPQL Datetime CLAUSES
    mpqlDateTimeClauses = getMPQLDateTimeClauses(editor);
    
    // Get a list of MPQL Datetime VALUES
    mpqlDateTimeValues = getMPQLDateTimeValues(editor);
    
    // Get a list of the currently selected Tables, COLUMNS
    columnValues = getColumnValues(editor);
    
    
    identifierQuote = getIdentifierQuote(editor);
    
    if (defaultTableName && !defaultTable) { defaultTable = findTableByAlias(defaultTableName, editor); }
      
    defaultTable = defaultTable || [];
    if (defaultTable.columns) { defaultTable = defaultTable.columns; }
    
    var cur = editor.getCursor();
    var result = [];
    var selectedHint = 0;
    
    // Get the TOKEN at the current cursor position
    var token = editor.getTokenAt(cur);
    token.tokenType = 'token';
    
    var start;
    var end;
    var search;
    var hintTypes;
    
    if(CodeMirror.mpqlParser === undefined) {
        CodeMirror.mpqlParser = editor.mpqlParser();
    }
    
    // Get the TOKEN before cursor token
    var preToken = editor.getTokenAt(
            { 
                'line': cur.line,
                'ch' : token.start,
                'sticky': cur.sticky
            } 
    );
    preToken.tokenType = 'preToken';
    
    // Get the TOKEN after cursor token
    var postToken = editor.getTokenAt(
            { 
                'line': cur.line,
                'ch' : token.end + 1,
                'sticky': cur.sticky
            } 
    );
    postToken.tokenType = 'postToken';
    
    // let spanInfo = editor.mpqlParser.getSpanInfo();
    
    window._log.debug('----------------');
    window._log.debug( "preToken: '" + preToken.string + "'  type:" + preToken.type );
    window._log.debug( "token: '" + token.string + "'  type:" + token.type );
    window._log.debug( "postToken: '" + postToken.string + "'  type:" + postToken.type );
    window._log.debug( preToken );
    window._log.debug( token );
    window._log.debug( postToken );
    
    // Associate parsed items, with the tokens we have found
    [preToken,token,postToken].forEach(function(tk){
        if( tk.string === ' ' )
        {
            tk.parserItem = null;
        }
        else
        {
            tk.parserItem = editor.mpqlParser.getSpanInfo(tk);
        }
    });
    
    if (token.end > cur.ch) {
        token.end = cur.ch;
        token.string = token.string.slice(0, cur.ch - token.start);
    }
    
    if (token.string.match(/^[.`"\w@]\w*$/)) {
        search = token.string;
        start = token.start;
        end = token.end;
    }
    else
    {
        start = end = cur.ch;
        search = "";
    }
    
    // Try and use token for completion firstly, falling back to pre-token when not possible
    let cToken = null;
    if( token.parserItem )
    {
        cToken = token;
    }
    else if( preToken.parserItem )
    {
        cToken = preToken;
    }
    
    var selectedTableData = tables[editor.mpqlState.selectedTable];
    var editorQueryString = editor.getValue().toLowerCase();
    
    
    function getTables() {
        
        let tablesArray = [];
        
        if( typeof editor.options.hintOptions === 'object' && typeof editor.options.hintOptions.tables === 'object')
        {
            for (let tableName in editor.options.hintOptions.tables) {
                
                if ( editor.options.hintOptions.tables.hasOwnProperty(tableName) ) { tablesArray.push(tableName); }
            }
        }

        return tablesArray;
    }

    function getColumns() {
        
        let columnsArray = [];
        
        if( typeof selectedTableData === 'object' && Array.isArray(selectedTableData.columns) )
        {
            selectedTableData.columns.forEach(function(columnName) {
                
                let item = {
                        'text': columnName,
                        'displayText': columnName,
                        'className': 'cm-column'
                    }
                
                    columnsArray.push(item);
            });
        }
        
        return columnsArray;
    }
    
    
//    function getFunctions() {
//        
//        /**
//         *  Returns an ARRAY of MPQL Functions keywords
//         */
//        
//        let funcArray = [];
//        
//        for (let funcName in mpqlFunctions) {
//            
//            debugger;
//            
//            if ( mpqlFunctions.hasOwnProperty(funcName) && funcName.length !== 0 && funcName !== ' ' )
//            { 
//                let item = {
//                    'text': funcName,
//                    'displayText': funcName.toLowerCase() + '()',
//                    'className': 'cm-mpql-function'
//                }
//            
//                funcArray.push(item);
//            }
//        }
//        
//        return funcArray;
//    }
    
    
    function getDateTimeValues() {
        
        /**
         *  Returns an ARRAY of MPQL DateTime Value keywords
         */
        
        let arr = [];
        
        for (let valueName in mpqlDateTimeValues) {
            
            if ( mpqlDateTimeValues.hasOwnProperty(valueName) )
            { 
                let item = {
                    'text': valueName,
                    'displayText': valueName.toLowerCase(),
                    'className': 'cm-mpql-datetime-values'
                }
            
                arr.push(item);
            }
        }
        
        return arr;
    }
    
    
    function isSelectedTableColumn(columnName) {

        /**
         * Returns TRUE if the columnName is one of the COLUMNS listed in the currently selected TABLE
         */
        
        if( typeof editor.mpqlState !== 'object' || typeof editor.mpqlState.selectedTable !== 'string' || editor.mpqlState.selectedTable === null ) { return false; }

        let columns = getColumns().map(obj => obj.text );
        
        if( columns.indexOf(columnName) !== -1 )
        {
            return true;
        }
        else 
        {
            return false;
        }
        
        return false;
    }
    
    
    function isFunction(functionName) {
        
        let isFunction = false;
        
        let functionNameLower = functionName.toLowerCase();
        
        //getFunctions().forEach(function(fName,i) {
        mpqlFunctionHintsList.forEach(function(fName,i) {
            if( fName.text.toLowerCase() === functionNameLower ) { isFunction = true; }   
        });
        
        return isFunction;
    }
    
    
    function calculateBestSelection() {
        
        if(!cToken) { return; }
        
        let pt = cToken.string.toLowerCase();
        let tableNames = getTables();
        
        if( tableNames.indexOf(pt) !== -1 )
        {
            // Previous string is a TABLE NAME, set SELECT as the most obvious command to do next
            result.forEach(function(res,i) {
                if(res.text.toLowerCase() === 'select' ) { selectedHint = i; }
            });
        }
    }
    
    
    
    /** ================ COMPLETION CONSTRUCTORS ===================*/
        
    function addTablesToResult(){
        getTables().forEach(function(tableName) {
            
            let item = {
            'text': tableName,
            'displayText': tableName,
            'className': 'cm-table'
            };
            
            result.push(item); 
        });
    }
    
    
    function addColumnsToResult(){
        result = result.concat(getColumns());
        hintTypes.push('column');
    }
    
    
    function addFunctionsToResult() {

        //result = result.concat(getFunctions());
        result = result.concat( mpqlFunctionHintsList );
        hintTypes.push('function');
    }
    
    
    function addDateTimeValuesToResult(filteredItems)
    {
        let dtv = getDateTimeValues();
        let filter = filteredItems || [];
        let dtvFiltered = dtv.filter( obj => filter.indexOf(obj.text) === -1 );
        
        result = result.concat(dtvFiltered);
        hintTypes.push('datetime-values');
    }
   

    function addAllToResults(searchString) {

        addMatches( result, searchString, sqlKeywords, function(w){ return { 'text': w.toUpperCase(), 'displayText': w.toUpperCase(), 'className': 'cm-keyword' }; } );
        addMatches( result, searchString, mpqlKeywords, function(w){ return { 'text': w.toUpperCase(), 'displayText': w.toUpperCase(), 'className': 'cm-mpql-keyword' }; } );     
        addMatches( result, searchString, mpqlFunctions, function(w){ return { 'text': w.toUpperCase(), 'displayText': w.toUpperCase(), 'className': 'cm-mpql-function' }; } );      
        addMatches( result, searchString, mpqlDateTimeClauses, function(w){ return { 'text': w.toUpperCase(), 'displayText': w.toUpperCase(), 'className': 'cm-mpql-datetime-clauses' }; } );
        addMatches( result, searchString, mpqlDateTimeValues, function(w){ return { 'text': w.toUpperCase(), 'displayText': w.toUpperCase(), 'className': 'cm-mpql-datetime-values' }; } );
        
        // Allows currently selected tables COLUMN names to be provided in tab word completion
        addMatches( result, searchString, getColumnValues(editor), function(w){ return { 'text': w.toUpperCase(), 'displayText': w.toUpperCase(), 'className': 'cm-column' }; } );
        
        // Filter out any empty definitions
        result = result.filter( item => item.text.length != 0 );
        
        calculateBestSelection();
    }
    

    if (search.charAt(0) === "." || search.charAt(0) === identifierQuote)
    {
        start = nameCompletion(cur, token, result, editor);
    }
    else
    {
        /** DEFAULT:
         * Cannot find any suitable completions, just show ALL keywords
         */
        
        if (!disableKeywords) { addAllToResults(search); }
    }

    if( cToken && cToken.parserItem )
    {
        let itemScope = editor.mpqlParser.getScope(cur.line, cToken.parserItem.itemScope);

        if( itemScope.scopeType === 'query-string' )
        {
            if( typeof cToken.parserItem === 'object' && typeof cToken.parserItem.itemArguments === 'object' )
            {
                if( cToken.parserItem.itemArguments.scopeType === 'from-arguments' )
                {
                    result = [];
                    hintTypes = [];
                    
                    addTablesToResult();
                }
                if( cToken.parserItem.itemArguments.scopeType === 'select-arguments' )
                {
                    result = [];
                    hintTypes = [];
                    
                    addColumnsToResult();
                    addFunctionsToResult();
                }
                else if( cToken.parserItem.itemArguments.scopeType === 'orderby-arguments' || cToken.parserItem.itemArguments.scopeType === 'groupby-arguments' )
                {
                    result = [];
                    hintTypes = [];
                    
                    addColumnsToResult();
                }
                else if( cToken.parserItem.itemArguments.scopeType === 'since-arguments' )
                {
                    result = [];
                    hintTypes = [];
                    
                    addDateTimeValuesToResult(['today','minute','minutes','hour','hours','day','days','week','weeks','month','months','year','years','ago']);
                }
                else if( cToken.parserItem.itemArguments.scopeType === 'until-arguments' )
                {
                    result = [];
                    hintTypes = [];
                    
                    addDateTimeValuesToResult(['yesterday','minute','minutes','hour','hours','day','days','week','weeks','month','months','year','years','ago']);
                }
                else if( cToken.parserItem.itemArguments.scopeType === 'where-arguments' )
                {
                    result = [];
                    hintTypes = [];

                    addColumnsToResult();
                }
                else if( cToken.parserItem.itemArguments.scopeType === 'timeseries-arguments' )
                {
                    result = [];
                    hintTypes = [];

                    addDateTimeValuesToResult( dtRelative.concat(dtPeriodsPlural) );
                    result.unshift({ 'text': 'BY', 'displayText': 'BY', 'className': 'cm-keyword' });
                }
            }
            else if( cToken.string === 'FROM')
            {
                result = [];
                hintTypes = [];
                
                addTablesToResult();
            }
            else if( cToken.string === 'SELECT')
            {
                result = [];
                hintTypes = [];
                
                addColumnsToResult();
                addFunctionsToResult();
            }
            else if( cToken.string === 'GROUPBY')
            {
                result = [];
                hintTypes = [];
                
                addColumnsToResult();
            }
            else if( cToken.string === 'ORDERBY')
            {
                result = [];
                hintTypes = [];
                
                addColumnsToResult();
            }
            else if( cToken.string === 'SINCE')
            {
                result = [];
                hintTypes = [];
                
                addDateTimeValuesToResult(['today','minute','minutes','hour','hours','day','days','week','weeks','month','months','year','years','ago']);
            }
            else if( cToken.string === 'UNTIL')
            {
                result = [];
                hintTypes = [];
                
                addDateTimeValuesToResult(['yesterday','minute','minutes','hour','hours','day','days','week','weeks','month','months','year','years','ago']);
            }
        }
        else if( itemScope.scopeType === 'from-arguments' && cToken.type === 'table' )
        {
            result = [];
            hintTypes = [];
            
            addAllToResults("");
        }
        else if( itemScope.scopeType === 'select-arguments' )
        {
            result = [];
            hintTypes = [];
            
            addColumnsToResult();
            addFunctionsToResult();
        }
        else if ( itemScope.scopeType === 'function-arguments' )
        {
            result = [];
            hintTypes = [];
            
            if ( isFunction(itemScope.scopeSubType) )
            {
                addColumnsToResult();
                addFunctionsToResult();
            }
        }
        else if ( itemScope.scopeType === 'orderby-arguments' )
        {
            result = [];
            hintTypes = [];
            
            addColumnsToResult();
            result.push({ 'text': 'ASC', 'displayText': 'ASC', 'className': 'cm-keyword' });
            result.push({ 'text': 'DESC','displayText': 'DESC','className': 'cm-keyword' }); 
        }
        else if ( itemScope.scopeType === 'groupby-arguments' )
        {
            result = [];
            hintTypes = [];
            
            addColumnsToResult();
        }
        else if ( itemScope.scopeType === 'since-arguments' || itemScope.scopeType === 'until-arguments' )
        {
            result = [];
            hintTypes = [];
  
            if( cToken.type === 'number' )
            {
                if( Number(cToken.string) <= 1 )
                {
                    addDateTimeValuesToResult( dtRelative.concat(dtPeriodsPlural).concat(['ago']) );
                }
                else
                {
                    addDateTimeValuesToResult( dtRelative.concat(dtPeriodsSingular).concat(['ago']) );
                }  
            }
            else if( dtPeriodsSingular.indexOf(cToken.string) !== -1 || dtPeriodsPlural.indexOf(cToken.string) !== -1 )
            {
                result.push({ 'text': 'ago','displayText': 'ago','className': 'cm-mpql-datetime-values' }); 
            }  
        }
        else if ( itemScope.scopeType === 'until-arguments' )
        {
            result = [];
            hintTypes = [];
            
            addDateTimeValuesToResult();
        }
        else if( itemScope.scopeType === 'timeseries-arguments' )
        {
            result = [];
            hintTypes = [];

            if( cToken.string === 'BY' )
            {
                addDateTimeValuesToResult( dtRelative.concat(dtPeriodsPlural) );
            }
            else 
            {
                addDateTimeValuesToResult( dtRelative.concat(dtPeriodsPlural) );
                result.unshift({ 'text': 'BY', 'displayText': 'BY', 'className': 'cm-keyword' });
            }
        }
    }


    return { 
        'completionSource': cToken ? cToken.tokenType : token.tokenType,
        'list': result, 
        'from': new Pos(cur.line, start), 
        'to': new Pos(cur.line, end),
        'selectedHint': selectedHint,
        'types': hintTypes,
        'tokens': { 
            'preToken': preToken,
            'token':token,
            'postToken': postToken
        }
    };

});

})(window, document, window.CodeMirror);