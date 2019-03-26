mpqlGenericsDefinitions = {
        "version": 1.0,
        "generics": [
            {
                "regex": "table[a-zA-Z]?",
                "className": "cm-table generic"
            },
            {
                "regex": "column[a-zA-Z]?",
                "className": "cm-column generic"
            },
            {
                "regex": "function[a-zA-Z]?",
                "className": "cm-mpql-function generic"
            },
            {
                "regex": "number",
                "className": "cm-number generic"
            },
            {
                "regex": "(operator|operand|conditional)",
                "className": "cm-operator generic"
            },
            {
                "regex": "datetime_value",
                "className": "cm-mpql-datetime-values generic"
            },
            {
                "regex": "datetime_clause",
                "className": "cm-mpql-datetime-clauses generic"
            },
            {
                "regex": "warning",
                "className": "mpql-warning"
            },
            {
                "regex": "error",
                "className": "mpql-error"
            }
        ]
    };



