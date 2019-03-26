mpqlDataTypeDefinitions = {
        "NUMBER": {
            "group": "numeric",
            "desc": "Any positive/negative numerical value, defined via PRECISION and SCALE",
            "info": "Default precision and scale are (38,0)"
        },
        "DECIMAL": {
            "group": "numeric",
            "desc": "Same as NUMBER",
            "info": "Synonymous with NUMBER"
        },
        "NUMERIC": {
            "group": "numeric",
            "desc": "Same as NUMBER",
            "info": "Synonymous with NUMBER"
        },
        "INT": {
            "group": "numeric",
            "desc": "A positive/negative whole number",
            "info": "Synonymous with NUMBER except precision and scale cannot be specified"
        },
        "FLOAT": {
            "group": "numeric",
            "desc": "A positive/negative floating point number",
            "info": ""
        },
        "FLOAT4": {
            "group": "numeric",
            "desc": "A lower precision positive/negative floating point number",
            "info": ""
        },
        "FLOAT8": {
            "group": "numeric",
            "desc": "A medium precision positive/negative floating point number",
            "info": ""
        },
        "DOUBLE": {
            "group": "numeric",
            "desc": "A higher precision positive/negative floating point number",
            "info": "Synonymous with FLOAT"
        },
        "DOUBLE_PRECISION": {
            "group": "numeric",
            "desc": "Same as DOUBLE type",
            "info": "Synonymous with DOUBLE"
        },
        "REAL": {
            "group": "numeric",
            "desc": "Same as FLOAT type",
            "info": "Synonymous with FLOAT"
        },
        "VARCHAR": {
            "group": "string_and_binary",
            "desc": "A set of characters with a maximum of 16,777,216 chars",
            "info": "Default (and maximum) is 16,777,216 bytes"
        },
        "STRING": {
            "group": "string_and_binary",
            "desc": "Synonymous with VARCHAR",
            "info": ""
        },
        "TEXT": {
            "group": "string_and_binary",
            "desc": "Synonymous with VARCHAR",
            "info": ""
        },
        "CHAR": {
            "group": "string_and_binary",
            "desc": "",
            "info": "Synonymous with VARCHAR except default length is VARCHAR(1)"
        },
        "CHARACTER": {
            "group": "string_and_binary",
            "desc": "",
            "info": "Synonymous with VARCHAR except default length is VARCHAR(1)"
        },
        "BINARY": {
            "group": "string_and_binary",
            "desc": "",
            "info": ""
        },
        "VARBINARY": {
            "group": "string_and_binary",
            "desc": "Synonymous with BINARY",
            "info": ""
        },
        "BOOLEAN": {
            "group": "logical",
            "desc": "Reflects one of two states, TRUE or FALSE",
            "info": "Currently only supported for accounts provisioned after January 25, 2016"
        },
        "DATE": {
            "group": "date-time",
            "desc": "",
            "info": ""
        },
        "DATETIME": {
            "group": "date-time",
            "desc": "Alias for TIMESTAMP_NTZ",
            "info": ""
        },
        "TIME": {
            "group": "date-time",
            "desc": "",
            "info": ""
        },
        "TIMESTAMP": {
            "group": "date-time",
            "desc": "Alias for one of the TIMESTAMP variations (TIMESTAMP_NTZ by default)",
            "info": ""
        },
        "TIMESTAMP_LTZ": {
            "group": "datetime",
            "desc": "TIMESTAMP with local time zone; time zone, if provided, is not stored",
            "info": ""
        },
        "TIMESTAMP_NTZ": {
            "group": "datetime",
            "desc": "TIMESTAMP with no time zone; time zone, if provided, is not stored",
            "info": ""
        },
        "TIMESTAMP_TZ": {
            "group": "datetime",
            "desc": "TIMESTAMP with time zone",
            "info": ""
        },
        "VARIANT": {
            "group": "semi-structured",
            "desc": "",
            "info": ""
        },
        "OBJECT": {
            "group": "semi-structured",
            "desc": "An collection of un-ordered data-types",
            "info": ""
        },
        "ARRAY": {
            "group": "semi-structured",
            "desc": "An collection of un-ordered data-types",
            "info": ""
        }
    };



