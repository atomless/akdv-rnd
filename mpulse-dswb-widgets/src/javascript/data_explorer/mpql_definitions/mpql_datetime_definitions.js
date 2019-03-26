mpqlDatetimeDefinitions = {
        "version": 1.0,
        "categories": [
            {
                "id": "clause",
                "name": "Clause",
            },
            {
                "id": "value",
                "name": "Value",
            }
        ],
        "keywords": [
            {
                "id": "since",
                "regex": "since",
                "name": "SINCE",
                "syntax": "±SINCE± <±number±> ±datetime_value± ",
                "description": "Use ±SINCE± with a<±number±>and a ±datetime_value± to set the __start__ of your queries datetime-range.",
                "category": "clause"
            },
            {
                "id": "until",
                "regex": "until",
                "name": "UNTIL",
                "syntax": "±UNTIL± <±number±> ±datetime_value± ",
                "description": "Use ±UNTIL± with a<±number±>and a ±datetime_value± to set the __end__ of your queries datetime-range.",
                "category": "clause"
            },
            {
                "id": "yesterday",
                "regex": "yesterday",
                "name": "YESTERDAY",
                "syntax": "<±datetime_clause±> ±YESTERDAY±",
                "description": "Use ±YESTERDAY± with ±SINCE± to start your time-range at __000:00:00__ on the day before the query is run on.",
                "category": "value"
            },
            {
                "id": "today",
                "regex": "today",
                "name": "TODAY",
                "syntax": "±datetime_clause± ±TODAY±",
                "description": "Use ±TODAY± with ±SINCE± to start your time-range at __000:00:00__ of the day you run your query on.",
                "category": "value"
            },
            {
                "id": "month",
                "regex": "(month|months)",
                "name": "MONTH/MONTHS",
                "syntax": "±datetime_clause± <±number±> ±MONTH±",
                "description": "Use ±MONTH±/±MONTHS± with a ±number±, and a datetime_clause such as ±SINCE± or ±UNTIL±. ___Note__: Plurality is optional_.",
                "category": "value"
            },
            {
                "id": "week",
                "regex": "(week|weeks)",
                "name": "WEEK/WEEKS",
                "syntax": "±datetime_clause± <±number±> ±WEEK±",
                "description": "Use ±WEEK±/±WEEKS± with a ±number±, and a datetime_clause such as ±SINCE± or ±UNTIL±. ___Note__: Plurality is optional_.",
                "category": "value"
            },
            {
                "id": "day",
                "regex": "(day|days)",
                "name": "DAY/DAYS",
                "syntax": "±datetime_clause± <±number±> ±DAY±",
                "description": "Use ±DAY±/±DAYS± with a ±number±, and a datetime_clause such as ±SINCE± or ±UNTIL±. ___Note__: Plurality is optional_.",
                "category": "value"
            },
            {
                "id": "hour",
                "regex": "(hour|hours)",
                "name": "HOUR/HOURS",
                "syntax": "<±datetime_clause±> <±number±> ±HOUR±",
                "description": "Use ±HOUR±/±HOURS± with a ±number±, and a datetime_clause such as ±SINCE± or ±UNTIL±. ___Note__: Plurality is optional_.",
                "category": "value"
            },
            {
                "id": "minute",
                "regex": "(minute|minutes)",
                "name": "MINUTE/MINUTES",
                "syntax": "<±datetime_clause±> <±number±> ±MINUTE±",
                "description": "Use ±MINUTE±/±MINUTES± with a ±number±, and a<±datetime_clause±>such as ±SINCE± or ±UNTIL±. ___Note__: Plurality is optional_.",
                "category": "value"
            },
            {
                "id": "ago",
                "regex": "ago",
                "name": "AGO",
                "syntax": "<±datetime_value±> ±AGO±",
                "description": "_Optional_. ±AGO± can be used to complete a ±datetime_value± (in terms of English grammar) such as 9 ±days± ±AGO± or 3 ±weeks± ±AGO±.",
                "category": "value"
            }
        ]
    };



