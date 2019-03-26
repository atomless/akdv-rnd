(function() {
    
    "use strict";

    /** 
     * This JS inherits the sql.js definition, supplied with CodeMirror
     * This defines the keywords present in SQL, it is used to both support
     * syntax colouring of any SQL strings, as well as for autocompletion
     */
    
    window.CodeMirror.defineMode("sql", function(config, parserConfig) {
        
      var client                = parserConfig.client || {},
          atoms                 = parserConfig.atoms || {"false": true, "true": true, "null": true},
          builtin               = parserConfig.builtin || {},
          keywords              = parserConfig.keywords || {},
          operatorChars         = parserConfig.operatorChars || /^[*+\-%<>!=&|~^]/,
          support               = parserConfig.support || {},
          hooks                 = parserConfig.hooks || {},
          dateSQL               = parserConfig.dateSQL || {"date" : true, "time" : true, "timestamp" : true},
          
          mpqlFunctions         = parserConfig.mpqlFunctions || {},
          mpqlKeywords          = parserConfig.mpqlKeywords || {},
          mpqlForbidden         = parserConfig.mpqlForbidden || {},
          mpqlDateTimeValues    = parserConfig.mpqlDateTimeValues || {},
          mpqlDateTimeClauses   = parserConfig.mpqlDateTimeClauses || {},
              
          backslashStringEscapes = parserConfig.backslashStringEscapes != false
    
      
      function getTableNames() {
              
          /**
           * Identifies TABLES defined in hintOptions{} 
           * and returns them as 'table' allowing them to be tokenized / classed 
           * */
          
          if(config.hintOptions === null || config.hintOptions.tables === null) { return []; }
          
          var tableNames = [];
          Object.keys(config.hintOptions.tables).forEach(function(tableName,index) {
              tableNames.push(tableName.toLowerCase());
          });
          
          return tableNames;
      } 
        
          
      function getColumnNames() {
          
          /**
           * Identifies COLUMN defined in hintOptions{} 
           * and returns them as 'table' allowing them to be tokenized / classed 
           * */
          
          if(config.hintOptions === null || config.hintOptions.tables === null) { return []; }
          
          var columnNames = [];
          Object.keys(config.hintOptions.tables).forEach(function(tableName,index) {
              
              if( tableName !== 'undefined' ){
                  config.hintOptions.tables[tableName].forEach(function(columnName,index) {
                      columnNames.push(columnName.toLowerCase());
                  });
              }
          });
          
          return columnNames;
      }
    
       
      function tokenBase(stream, state) {
        var ch = stream.next();

        // call hooks from the mime type
        if (hooks[ch]) {
            var result = hooks[ch](stream, state);
            if (result != false) { 
                return result;
            }
        }

        if (support.hexNumber && ((ch === "0" && stream.match(/^[xX][0-9a-fA-F]+/)) || (ch === "x" || ch === "X") && stream.match(/^'[0-9a-fA-F]+'/)))
        {
          // hex
          // ref: http://dev.mysql.com/doc/refman/5.5/en/hexadecimal-literals.html
          return "number";
        }
        else if (support.binaryNumber && (((ch === "b" || ch === "B") && stream.match(/^'[01]+'/)) || (ch === "0" && stream.match(/^b[01]+/))))
        {
          // bitstring
          // ref: http://dev.mysql.com/doc/refman/5.5/en/bit-field-literals.html
          return "number";
          
        }
        else if (ch.charCodeAt(0) > 47 && ch.charCodeAt(0) < 58)
        {
          // numbers
          // ref: http://dev.mysql.com/doc/refman/5.5/en/number-literals.html
          stream.match(/^[0-9]*(\.[0-9]+)?([eE][-+]?[0-9]+)?/);
          
          if( support.decimallessFloat ) { stream.match(/^\.(?!\.)/); }
          
          return "number";
          
        }
        else if ( ch === ',' )
        {
          // brackets
          return "comma";
          
        }
        else if ( ch === '(' || ch === ')' )
        {
          // brackets
          return "bracket";
          
        }
        else if (ch === "?" && (stream.eatSpace() || stream.eol() || stream.eat(";")))
        {
          // placeholders
          return "variable-3";
          
        }
        else if (ch === "'" || (ch === '"' && support.doubleQuote))
        {
          // strings
          // ref: http://dev.mysql.com/doc/refman/5.5/en/string-literals.html
          state.tokenize = tokenLiteral(ch);
          return state.tokenize(stream, state);
          
        }
        else if ((((support.nCharCast && (ch === "n" || ch === "N")) || (support.charsetCast && ch === "_" && stream.match(/[a-z][a-z0-9]*/i))) && (stream.peek() === "'" || stream.peek() === '"')))
        {
          // charset casting: _utf8'str', N'str', n'str'
          // ref: http://dev.mysql.com/doc/refman/5.5/en/string-literals.html
          return "keyword";
          
        }
        else if (/^[\(\),\;\[\]]/.test(ch))
        {
          // no highlighting
          return null;
          
        }
        else if (support.commentSlashSlash && ch === "/" && stream.eat("/"))
        {
          // 1-line comment
          stream.skipToEnd();
          return "comment";
          
        }
        else if ((support.commentHash && ch === "#") || (ch === "-" && stream.eat("-") && (!support.commentSpaceRequired || stream.eat(" "))))
        {
          // 1-line comments
          // ref: https://kb.askmonty.org/en/comment-syntax/
          stream.skipToEnd();
          return "comment";
          
        }
        else if (ch === "/" && stream.eat("*"))
        {
          // multi-line comments
          // ref: https://kb.askmonty.org/en/comment-syntax/
          state.tokenize = tokenComment(1);
          return state.tokenize(stream, state);
          
        }
        else if (ch === ".")
        {
          // .1 for 0.1
          if (support.zerolessFloat && stream.match(/^(?:\d+(?:e[+-]?\d+)?)/i)) { return "number"; }
          
          if (stream.match(/^\.+/)) { return null; }
          
          // .table_name (ODBC)
          // // ref: http://dev.mysql.com/doc/refman/5.6/en/identifier-qualifiers.html
          if (support.ODBCdotTable && stream.match(/^[\w\d_]+/))
          {
            return "variable-2";
          }
          
        }
        else if (operatorChars.test(ch))
        {
          // operators
          stream.eatWhile(operatorChars);
          return "operator";
          
        }
        else if (ch === '{' && (stream.match(/^( )*(d|D|t|T|ts|TS)( )*'[^']*'( )*}/) || stream.match(/^( )*(d|D|t|T|ts|TS)( )*"[^"]*"( )*}/)))
        {
          // dates (weird ODBC syntax)
          // ref: http://dev.mysql.com/doc/refman/5.5/en/date-and-time-literals.html
          return "number";
          
        }
        else
        {
          /**
           * By this point, all characters have been processed
           * now WORDS are presented
           * */
            
          stream.eatWhile(/^[_\w\d]/);
          let word = stream.current().toLowerCase();
          
          if (mpqlForbidden.hasOwnProperty(word)) { return "mpql-forbidden"; }
          
          if (mpqlKeywords.hasOwnProperty(word)) { return "mpql-keyword"; }
          
          if (mpqlFunctions.hasOwnProperty(word)) { return "mpql-function"; }
          
          if (mpqlDateTimeClauses.hasOwnProperty(word)) { return "mpql-datetime-clauses"; }
          
          if (mpqlDateTimeValues.hasOwnProperty(word)) { return "mpql-datetime-values"; }
  
          if( getTableNames().includes(word) ) { return "table"; }
          
          if( getColumnNames().includes(word) ) { return "column"; }

          // dates (standard SQL syntax)
          // ref: http://dev.mysql.com/doc/refman/5.5/en/date-and-time-literals.html
          if (dateSQL.hasOwnProperty(word) && (stream.match(/^( )+'[^']*'/) || stream.match(/^( )+"[^"]*"/))) { return "number"; }
          
          if (atoms.hasOwnProperty(word)) { return "atom"; }
          
          if (builtin.hasOwnProperty(word)) { return "builtin"; }
          
          if (keywords.hasOwnProperty(word)) { return "keyword"; }
          
          if (client.hasOwnProperty(word)) { return "string-2"; }
          
          return null;
        }
      }
    
      // 'string', with char specified in quote escaped by '\'
      function tokenLiteral(quote) {
          
          /**
           * Tokenises LITERAL as STRINGs
           * */
          
          return function(stream, state) {
            
          let escaped = false, ch;
 
          while ((ch = stream.next()) != null)
          {
            if (ch === quote && !escaped)
            {
              state.tokenize = tokenBase;
              break;
            }
            
            escaped = backslashStringEscapes && !escaped && ch === "\\";
          }
          
          return "string";
        };
      }
      
      function tokenComment(depth) {
          
        /**
         * Tokenises COMMENTs
         * */
          
        return function(stream, state) {

          var m = stream.match(/^.*?(\/\*|\*\/)/)
          
          if (!m)
          {
              stream.skipToEnd();
          }
          else if (m[1] === "/*")
          {
              state.tokenize = tokenComment(depth + 1);
          }
          else if (depth > 1)
          {
              state.tokenize = tokenComment(depth - 1);
          }
          else
          {
              state.tokenize = tokenBase;
          }
          
          return "comment"
        }
      }
    
      function pushContext(stream, state, type) {
        state.context = {
          prev: state.context,
          indent: stream.indentation(),
          col: stream.column(),
          type: type
        };
      }
    
      function popContext(state) {
        state.indent = state.context.indent;
        state.context = state.context.prev;
      }
    
      return {
        startState: function() {
          return {tokenize: tokenBase, context: null};
        },
    
        token: function(stream, state) {
            
          if (stream.sol())
          {
              if (state.context && state.context.align === null)
              {
                  state.context.align = false;
              }
          }
          
          if (state.tokenize === tokenBase && stream.eatSpace())
          { 
              return null;
          }
    
          var style = state.tokenize(stream, state);
          
          if (style === "comment") { return style; }
    
          if (state.context && state.context.align === null) { state.context.align = true; }
          
          var tok = stream.current();
          
          if (tok === "(")
          { 
              pushContext(stream, state, ")");
          }
          else if (tok === "[")
          {
            pushContext(stream, state, "]");
          }
          else if (state.context && state.context.type === tok)
          {
            popContext(state);
          }
          
          return style;
        },
    
        indent: function(state, textAfter) {
          var cx = state.context;
          
          if (!cx) { return window.CodeMirror.Pass; }
          
          var closing = textAfter.charAt(0) === cx.type;
          
          if (cx.align) {
              return cx.col + (closing ? 0 : 1);
          }
          else
          {
              return cx.indent + (closing ? 0 : config.indentUnit); 
          }
        },
    
        blockCommentStart: "/*",
        blockCommentEnd: "*/",
        lineComment: support.commentSlashSlash ? "//" : support.commentHash ? "#" : "--"
      };
    });
    
}());



(function() {
    
    "use strict";

//    var generalKeywords = "a abort abs absent absolute access according action ada add admin after aggregate all allocate also always analyse analyze any are array array_agg array_max_cardinality asensitive" +
//    " assertion assignment asymmetric at atomic attribute attributes authorization avg backward base64 before begin begin_frame begin_partition bernoulli binary bit_length blob blocked bom both breadth c cache" +
//    " call called cardinality cascade cascaded case cast catalog catalog_name ceil ceiling chain characteristics characters character_length character_set_catalog character_set_name character_set_schema char_length" +
//    " check checkpoint class class_origin clob close cluster coalesce cobol collate collation collation_catalog collation_name collation_schema collect column columns column_name command_function command_function_code" +
//    " comment comments commit committed concurrently condition condition_number configuration conflict connect connection connection_name constraint constraints constraint_catalog constraint_name constraint_schema" +
//    " constructor contains content continue control conversion convert copy corr corresponding cost covar_pop covar_samp cross csv cube cume_dist current current_catalog current_date current_default_transform_group" +
//    " current_path current_role current_row current_schema current_time current_timestamp current_transform_group_for_type current_user cursor cursor_name cycle data database datalink datetime_interval_code" +
//    " datetime_interval_precision day db deallocate dec declare default defaults deferrable deferred defined definer degree delimiter delimiters dense_rank depth deref derived describe descriptor deterministic" +
//    " diagnostics dictionary disable discard disconnect dispatch dlnewcopy dlpreviouscopy dlurlcomplete dlurlcompleteonly dlurlcompletewrite dlurlpath dlurlpathonly dlurlpathwrite dlurlscheme dlurlserver dlvalue" +
//    " do document domain dynamic dynamic_function dynamic_function_code each element else empty enable encoding encrypted end end-exec end_frame end_partition enforced enum equals escape event every except exception" +
//    " exclude excluding exclusive exec execute exists exp explain expression extension external extract false family fetch file filter final first first_value flag float floor following for force foreign fortran" +
//    " forward found frame_row free freeze fs full function functions fusion g general generated get global go goto grant granted greatest grouping groups handler header hex hierarchy hold hour id identity if ignore" +
//    " ilike immediate immediately immutable implementation implicit import including increment indent index indexes indicator inherit inherits initially inline inner inout input insensitive instance instantiable" +
//    " instead integrity intersect intersection invoker isnull isolation k key key_member key_type label lag language large last last_value lateral lc_collate lc_ctype lead leading leakproof least left length level" +
//    " library like_regex link listen ln load local localtime localtimestamp location locator lock locked logged lower m map mapping match matched materialized max maxvalue max_cardinality member merge message_length" +
//    " message_octet_length message_text method min minute minvalue mod mode modifies module month more move multiset mumps name names namespace national natural nchar nclob nesting new next nfc nfd nfkc nfkd nil" +
//    " no none normalize normalized nothing notify notnull nowait nth_value ntile null nullable nullif nulls number object occurrences_regex octets octet_length of off offset oids old only open operator option options" +
//    " ordering ordinality others out outer output over overlaps overlay overriding owned owner p pad parallel parameter parameter_mode parameter_name parameter_ordinal_position parameter_specific_catalog" +
//    " parameter_specific_name parameter_specific_schema parser partial partition pascal passing passthrough password percent percentile_cont percentile_disc percent_rank period permission placing plans pli policy" +
//    " portion position position_regex power precedes preceding prepare prepared preserve primary prior privileges procedural procedure program public quote range rank read reads reassign recheck recovery recursive" +
//    " ref references referencing refresh regr_avgx regr_avgy regr_count regr_intercept regr_r2 regr_slope regr_sxx regr_sxy regr_syy reindex relative release rename repeatable replace replica requiring reset respect" +
//    " restart restore restrict restricted result return returned_cardinality returned_length returned_octet_length returned_sqlstate returning returns revoke right role rollback rollup routine routine_catalog routine_name" +
//    " routine_schema row rows row_count row_number rule savepoint scale schema schema_name scope scope_catalog scope_name scope_schema scroll search second section security selective self sensitive sequence sequences" +
//    " serializable server server_name session session_user setof sets share show similar simple size skip snapshot some source space specific specifictype specific_name sql sqlcode sqlerror sqlexception sqlstate" +
//    " sqlwarning sqrt stable standalone start state statement static statistics stddev_pop stddev_samp stdin stdout storage strict strip structure style subclass_origin submultiset substring substring_regex succeeds" +
//    " sum symmetric sysid system system_time system_user t tables tablesample tablespace table_name temp template temporary then ties timeseries timezone_hour timezone_minute to token top_level_count trailing transaction" +
//    " transactions_committed transactions_rolled_back transaction_active transform transforms translate translate_regex translation treat trigger trigger_catalog trigger_name trigger_schema trim trim_array true truncate" +
//    " trusted type types uescape unbounded uncommitted under unencrypted unique unknown unlink unlisten unlogged unnamed unnest untyped upper uri usage user user_defined_type_catalog user_defined_type_code" +
//    " user_defined_type_name user_defined_type_schema using vacuum valid validate validator value value_of varbinary variadic var_pop var_samp verbose version versioning view views volatile when whenever whitespace" +
//    " width_bucket window within work wrapper write xmlagg xmlattributes xmlbinary xmlcast xmlcomment xmlconcat xmldeclaration xmldocument xmlelement xmlexists xmlforest xmliterate xmlnamespaces xmlparse xmlpi xmlquery" +
//    " xmlroot xmlschema xmlserialize xmltable xmltext xmlvalidate year yes loop repeat attach path depends detach zone";
    
    // these keywords are used by all SQL dialects (however, a mode can still overwrite it)
    // var sqlKeywords = "alter and as asc between by count create delete desc distinct drop from group having in insert into is join like not on or order select set table union update values where limit ";
    
    // Standard SQL words we support
    const sqlKeywords = "from select where by asc desc ";
    
    let mpqlKeywords = '',
     mpqlFunctionKeywords = '',
     mpqlDateTimeValuesKeywords = '',
     mpqlTimeClausesKeywords = '',
     mpqlForbiddenKeywords = '';
    
    if( $.type(mpqlFunctionDefinitions) === 'object' )
    {
        // Construct the string that defines what functions MPQL provides
        mpqlFunctionDefinitions.functions.forEach((func,index) => { mpqlFunctionKeywords += func.name + " "; });
    }
    else
    {
        mpqlFunctionKeywords = "median percentile ";
    }
    
    mpqlKeywords = "orderby groupby timeseries limit ";
    mpqlDateTimeValuesKeywords = "yesterday today month months week weeks day days hour hours minute minutes ago ";
    mpqlTimeClausesKeywords = "since until ";
    mpqlForbiddenKeywords = "create delete drop update remove ";
    
    
    // turn a space-separated list into an array
    function set(str) {
        var obj = {}, words = str.split(" ");
        
        for (var i = 0; i < words.length; ++i) { 
            obj[words[i]] = true;
        }
        
        return obj;
    }

    
    /** This MODE is intended to format AKAMAI mPQL 
     * It is based on the CodeMirror mode for PostGresQL
     * 
     * // https://www.postgresql.org/docs/10/static/sql-keywords-appendix.html
     * // https://www.postgresql.org/docs/10/static/datatype.html
     */
    
    window.CodeMirror.defineMIME("text/x-mpql", {
        
        name: "sql",
        
        client: set("source"),
        
        keywords: set( sqlKeywords + mpqlKeywords + mpqlFunctionKeywords + mpqlTimeClausesKeywords + mpqlDateTimeValuesKeywords ),
                
        builtin: set("bigint int8 bigserial serial8 bit varying varbit boolean bool box bytea character char varchar cidr circle date double precision float8 inet integer int int4 interval json jsonb line lseg macaddr macaddr8" +
                " money numeric decimal path pg_lsn point polygon real float4 smallint int2 smallserial serial2 serial serial4 text time without zone with timetz timestamp timestamptz tsquery tsvector txid_snapshot uuid xml"),
                
        atoms: set("false true null unknown"),

        operatorChars: /^[*+\-%<>!=&|^\/#@?~]/,
        
        dateSQL: set("date time timestamp"),
        
        support: set(""),
        
        sqlKeywords: set(sqlKeywords),
        
        mpqlKeywords: set(mpqlKeywords),
        
        mpqlFunctions: set(mpqlFunctionKeywords),
        
        mpqlForbidden: set(mpqlForbiddenKeywords),
        
        mpqlDateTimeClauses: set(mpqlTimeClausesKeywords),
        
        mpqlDateTimeValues: set(mpqlDateTimeValuesKeywords)
    });
    
  }());

/*
  How Properties of Mime Types are used by SQL Mode
  =================================================

  keywords:
    A list of keywords you want to be highlighted.
  
  builtin:
    A list of builtin types you want to be highlighted (if you want types to be of class "builtin" instead of "keyword").
  
  operatorChars:
    All characters that must be handled as operators.
  
  client:
    Commands parsed and executed by the client (not the server).
  
  support:
    A list of supported syntaxes which are not common, but are supported by more than 1 DBMS.
    * ODBCdotTable: .tableName
    * zerolessFloat: .1
    * doubleQuote
    * nCharCast: N'string'
    * charsetCast: _utf8'string'
    * commentHash: use # char for comments
    * commentSlashSlash: use // for comments
    * commentSpaceRequired: require a space after -- for comments
  
  atoms:
    Keywords that must be highlighted as atoms,. Some DBMS's support more atoms than others:
    UNKNOWN, INFINITY, UNDERFLOW, NaN...
  
  dateSQL:
    Used for date/time SQL standard syntax, because not all DBMS's support same temporal types.
*/
