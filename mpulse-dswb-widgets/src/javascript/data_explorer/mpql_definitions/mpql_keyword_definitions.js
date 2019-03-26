mpqlKeywordDefinitions = {
        "version": 1.0,
        "categories": [
            {
                "id": "x",
                "name": "X",
            },
            {
                "id": "y",
                "name": "Y",
            }
        ],
        "keywords": [
            {
                "id": "from",
                "name": "FROM",
                "syntax": "±FROM± <±table±>",
                "description": "Selects the database ±table± rowset, from which ±columns± will be accessed via the ±SELECT± keyword. mPQL queries should start with a ±FROM± as this defines which columns a ±SELECT± can access.",
                "category": "x"
            },
            {
                "id": "select",
                "name": "SELECT",
                "syntax": "±SELECT± <±column± | ±function±>",
                "description": "Defines a list of ±columns± or ±functions± from the currently selected (±FROM±) ±table±",
                "category": "y"
            },
            {
                "id": "orderby",
                "name": "ORDERBY",
                "syntax": "±ORDERBY± <±column±>",
                "description": "±ORDERBY± is used to sort the result-set in ascending or descending order. It sorts the records in ascending order by default. To sort the records in descending order, use the ±DESC± keyword.",
                "category": "y"
            },
            {
                "id": "groupby",
                "name": "GROUPBY",
                "syntax": "±GROUPBY± <±column±>",
                "description": "±GROUPBY± is used with aggregate functions such as ±COUNT±, ±MAX±, ±MIN±, ±SUM±, ±AVG± to group the result-set by one or more ±columns±.",
                "category": "y"
            },
            {
                "id": "where",
                "name": "WHERE",
                "syntax": "±WHERE± <±column±> <±conditional±>",
                "description": "±WHERE± keyword is used to filter records, to extract only those records that fulfill a specified condition.",
                "category": "y"
            },
            {
                "id": "asc",
                "name": "ASC",
                "syntax": "±ASC±",
                "description": "Specifies that an ±ORDERBY± keyword should short in Ascending order.",
                "category": "y"
            },
            {
                "id": "desc",
                "name": "DESC",
                "syntax": "±DESC±",
                "description": "Specifies that an ±ORDERBY± keyword should sort in _Descending_ order.",
                "category": "y"
            },
            {
                "id": "orderby",
                "name": "ORDERBY",
                "syntax": "±ORDERBY± ±column±",
                "description": "±ORDERBY± is used to sort the result-set in _ascending_ or _descending_ order. It sorts the records in ascending order by default. To sort the records in descending order, use the ±DESC± keyword.",
                "category": "y"
            },
            {
                "id": "groupby",
                "name": "GROUPBY",
                "syntax": "±GROUPBY± ±column±",
                "description": "±GROUPBY± is used with aggregate functions such as ±COUNT±, ±MAX±, ±MIN±, ±SUM±, ±AVG± to group the result-set by one or more columns.",
                "category": "y"
            },
            {
                "id": "timeseries",
                "name": "TIMESERIES",
                "syntax": "±TIMESERIES±",
                "description": "±TIMESERIES± specifies that the result of a query should be treated as a _timeseries_.",
                "category": "y"
            },
            {
                "id": "limit",
                "name": "LIMIT",
                "syntax": "±LIMIT±",
                "description": "±LIMIT± is used with a ±SELECT± statement to limit the number of records returned based on a limit value.",
                "category": "y"
            }
        ]
    };



