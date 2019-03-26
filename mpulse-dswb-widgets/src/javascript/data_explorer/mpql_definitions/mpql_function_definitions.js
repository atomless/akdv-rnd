mpqlFunctionDefinitions = {
        "version": 1.0,
        "categories": [
            {
                "id": "numeric",
                "name": "Numeric Functions",
                "subcategories": [
                    {
                        "id": "rounding",
                        "name": "Rounding and Truncation"
                    },
                    {
                        "id": "exponent",
                        "name": "Exponent and Root"
                    },
                    {
                        "id": "logarithmic",
                        "name": "Logarithmic"
                    }
                ]
            },
            {
                "id": "aggregate",
                "name": "Aggregate Functions",
                "subcategories": [
                    {
                        "id": "general",
                        "name": "General Aggregation"
                    }
                ]
            },
            {
                "id": "string",
                "name": "String Functions",
                "subcategories": [
                    {
                        "id": "general",
                        "name": "General"
                    }
                ]
            }
        ],
        "functions": [
            {
                "id": "abs",
                "name": "abs",
                "returns": "NUMBER",
                "description": "Returns the __absolute__ value of the _number_",
                "usage": "abs(-2) = 2",
                "category": "numeric",
                "subcategory": "rounding",
                "args": [
                    {
                        "data_type": "NUMBER",
                        "name": "number",
                        "description": "The number to abs"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "ceil",
                "name": "ceil",
                "returns": "NUMBER",
                "description": "Returns the _number_ rounded to the nearest equal or larger integer",
                "usage": "ceil(3.2) = 4",
                "category": "numeric",
                "subcategory": "rounding",
                "args": [
                    {
                        "data_type": "NUMBER",
                        "name": "number",
                        "description": "The number to round UP"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "floor",
                "name": "floor",
                "returns": "NUMBER",
                "description": "Returns _number_ rounded to the nearest equal or smaller integer",
                "usage": "floor(3.6) = 3",
                "category": "numeric",
                "subcategory": "rounding",
                "args": [
                    {
                        "data_type": "NUMBER",
                        "name": "number",
                        "description": "The number to round DOWN"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "mod",
                "name": "mod",
                "returns": "NUMBER",
                "description": "Returns the __remainder__ of _a_ divided by _b_",
                "usage": "mod(12,5) = 2",
                "category": "numeric",
                "subcategory": "rounding",
                "args": [
                    {
                        "data_type": "NUMBER",
                        "name": "a",
                        "description": "Number to divide"
                     },
                     {
                         "data_type": "NUMBER",
                         "name": "b",
                         "description": "The divisor"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "round",
                "name": "round",
                "returns": "NUMBER",
                "description": "Returns rounded values for _number_",
                "usage": "round(3.5) = 4",
                "category": "numeric",
                "subcategory": "rounding",
                "args": [
                    {
                        "data_type": "NUMBER",
                        "name": "number",
                        "description": "The number to round"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "pow",
                "name": "pow",
                "returns": "NUMBER",
                "description": "Returns __x__ raised to the _power_",
                "usage": "pow(2,3) = 8",
                "category": "numeric",
                "subcategory": "exponent",
                "args": [
                    {
                        "data_type": "NUMBER",
                        "name": "x",
                        "description": "The number to raise"
                     },
                     {
                         "data_type": "NUMBER",
                         "name": "power",
                         "description": "The exponent"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "sqrt",
                "name": "sqrt",
                "returns": "NUMBER",
                "description": "Returns the __square-root__ of a non-negative _number_",
                "usage": "sqrt(4) = 2",
                "category": "numeric",
                "subcategory": "exponent",
                "args": [
                    {
                        "data_type": "NUMBER",
                        "name": "number",
                        "description": "The number to get the square-root of"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "exp",
                "name": "exp",
                "returns": "NUMBER",
                "description": "From _number_, returns Euler's number __e__",
                "usage": "exp(2,3) = 8",
                "category": "numeric",
                "subcategory": "exponent",
                "args": [
                    {
                        "data_type": "NUMBER",
                        "name": "number",
                        "description": "The number to get the exponent of"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "ln",
                "name": "ln",
                "returns": "NUMBER",
                "description": "Returns the __square-root__ of a non-negative _number_",
                "usage": "ln(10) = 2.7182..",
                "category": "numeric",
                "subcategory": "logarithmic",
                "args": [
                    {
                        "data_type": "NUMBER",
                        "name": "number",
                        "description": "The number to get the square-root of"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "log",
                "name": "log",
                "returns": "NUMBER",
                "description": "From _number_, returns Euler's number __e__",
                "usage": "log(2,3) = 8",
                "category": "numeric",
                "subcategory": "logarithmic",
                "args": [
                    {
                        "data_type": "NUMBER",
                        "name": "number",
                        "description": "The number to return the log of"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "any_value",
                "name": "any_value",
                "returns": "ANY",
                "description": "Returns a single random __value__, from _column_values_. The result is non-deterministic.",
                "usage": "any_value([1,2]) = [1|2]",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "column_values",
                        "description": "A column data selection"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "avg",
                "name": "avg",
                "returns": "NUMBER",
                "description": "Returns the __average__ value of a _column's_ non-NULL records",
                "usage": "avg([1,2,6]) = 3",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "column",
                        "description": "Returns the average numerical value of a _column_ selection"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "corr",
                "name": "corr",
                "returns": "NUMBER",
                "description": "Returns the __correlation coefficient__ for non-null pairs in a group where _x_ is the independent variable and _y_ is the dependent variable.",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "x",
                        "description": "The independent variable"
                     },
                     {
                         "data_type": "COLUMN",
                         "name": "y",
                         "description": "The dependent variable"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "count",
                "name": "count",
                "returns": "NUMBER",
                "description": "Returns the NUMBER of non-NULL records for the expression or a total number of records.",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "column",
                        "description": "The records to count"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "covar_pop",
                "name": "covar_pop",
                "returns": "NUMBER",
                "description": "Returns the population __covariance__ for non-null pairs in a group where _x_ is the independent variable and _y_ is the dependent variable.",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "x",
                        "description": "The independent variable"
                     },
                     {
                         "data_type": "COLUMN",
                         "name": "y",
                         "description": "The dependent variable"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "covar_samp",
                "name": "ceil",
                "returns": "NUMBER",
                "description": "Returns the __sample covariance__ for non-null pairs in a group where _x_ is the independent variable and _y_ is the dependent variable.",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "x",
                        "description": "The independent variable"
                     },
                     {
                         "data_type": "COLUMN",
                         "name": "y",
                         "description": "The dependent variable"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "max",
                "name": "max",
                "returns": "NUMBER",
                "description": "Returns the __maximum value__ for the records within the expression",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "column",
                        "description": "The column data"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "median",
                "name": "median",
                "returns": "NUMBER",
                "description": "Returns the __median__ value for the records within the expression",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "column",
                        "description": "The column data"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "min",
                "name": "min",
                "returns": "NUMBER",
                "description": "Returns the __minimum__ value for the records within the expression",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "column",
                        "description": "The column data"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "percentile",
                "name": "percentile",
                "returns": "NUMBER",
                "description": "Return a _percentile_ value based on a continuous distribution of the input _column_",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "column",
                        "description": "The data selection"
                     },
                     {
                         "data_type": "NUMBER",
                         "name": "percentile",
                         "description": "The _percentile_ to calculate from the column data"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "stddev",
                "name": "stddev",
                "returns": "NUMBER",
                "description": "Returns the sample __standard deviation__ (square root of sample variance) of non-NULL values",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "column",
                        "description": "The column data to calculate the __standard deviation__ of"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "sum",
                "name": "sum",
                "returns": "NUMBER",
                "description": "Returns the __sum__ of non-NULL records for the expression",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "column",
                        "description": "The column data to __sum__"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "var_pop",
                "name": "var_pop",
                "returns": "NUMBER",
                "description": "Returns the __population variance__ of non-NULL records in a group",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "column",
                        "description": "The column data to calculate the __population variance__ of"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "var_samp",
                "name": "var_samp",
                "returns": "NUMBER",
                "description": "Returns the __sample variance__ of non-NULL records in a group",
                "category": "aggregate",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "COLUMN",
                        "name": "column",
                        "description": "The column data to calculate the __sample variance__ of"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "bit_length",
                "name": "bit_length",
                "returns": "NUMBER",
                "description": "Returns the __length__ of a string in bits",
                "usage": "bit_length('abc') = 24",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "string",
                        "description": "The string to analyze"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "charindex",
                "name": "charindex",
                "returns": "NUMBER",
                "description": "Searches for the first occurrence of _pattern_ in _input_string_",
                "usage": "charindex('b','abc') = 2",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "pattern",
                        "description": "The string pattern to match"
                     },
                     {
                         "data_type": "STRING",
                         "name": "input_string",
                         "description": "The string to search"
                     }
                ],
                "opt_args": [
                    {
                        "data_type": "INT",
                        "name": "start_pos",
                        "description": "Where to start searching in the string"
                    }
                  ]
            },
            {
                "id": "concat",
                "name": "concat",
                "returns": "STRING",
                "description": "__Concatenates__ two or more strings.",
                "usage": "concat('ab','cd') = 'abcd'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "a",
                        "description": "The first string"
                     },
                     {
                         "data_type": "STRING",
                         "name": "b",
                         "description": "The seconds string"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "contains",
                "name": "contains",
                "returns": "BOOLEAN",
                "description": "Returns TRUE if _a_ contains _b_.",
                "usage": "contains('abc','def') = false",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "a",
                        "description": "The string to check"
                     },
                     {
                         "data_type": "STRING",
                         "name": "b",
                         "description": "The string to find"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "editdistance",
                "name": "editdistance",
                "returns": "NUMBER",
                "description": "Computes the __Levenshtein distance__ between the input strings _a_ and _b_.",
                "usage": "editdistance('abc','abb') = 1",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "a",
                        "description": "The first string"
                     },
                     {
                         "data_type": "STRING",
                         "name": "b",
                         "description": "The seconds string"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "endswith",
                "name": "endswith",
                "returns": "BOOLEAN",
                "description": "Returns __TRUE__ if _a_ ends with _b_.",
                "usage": "endswith('abc','bc') = true",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "a",
                        "description": "The string to check"
                     },
                     {
                         "data_type": "STRING",
                         "name": "b",
                         "description": "The string to match"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "ilike",
                "name": "ilike",
                "returns": "BOOLEAN",
                "description": "Case-insensitive alternative for __LIKE__",
                "usage": "ilike('abc','ABc') = true",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "a",
                        "description": "The string to check"
                     },
                     {
                         "data_type": "STRING",
                         "name": "b",
                         "description": "The string to match"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "insert",
                "name": "insert",
                "returns": "insert(<base_expr>,<pos>,<len>,<insert_expr>)",
                "description": "_Replaces_ a __substring__ at the specified _position_ and _length_ with a new string or binary value.",
                "usage": "insert('abcdef', 3, 2, 'zzz') = abzzzef",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "source_string",
                        "description": "The source STRING to insert into"
                     },
                     {
                         "data_type": "INT",
                         "name": "position",
                         "description": "Insert position within the STRING"
                     },
                     {
                         "data_type": "INT",
                         "name": "length",
                         "description": "Number of characters to replace"
                     },
                     {
                         "data_type": "STRING",
                         "name": "insert_item",
                         "description": "Accepts a STRING or BINARY value"
                     }
                  ],
                "opt_args": []
            },
            {
                "id": "left",
                "name": "left",
                "returns": "STRING",
                "description": "Returns a _leftmost_ substring of its input",
                "usage": "left('abc',2) = 'ab'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "str",
                        "description": "The input string"
                     },
                     {
                         "data_type": "INT",
                         "name": "length",
                         "description": "The number of chars to return"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "length",
                "name": "length",
                "returns": "NUMBER",
                "description": "Returns the character __length__ of a string",
                "usage": "length('abc') = 3",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "str",
                        "description": "The input string"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "like",
                "name": "like",
                "returns": "BOOLEAN",
                "description": "Allows __case-sensitive__ _matching_ of strings based on comparison with a _pattern_",
                "usage": "like('abc','_b%') = true",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input",
                        "description": "The string to check"
                     },
                     {
                         "data_type": "STRING",
                         "name": "str",
                         "description": "The string to match"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "lower",
                "name": "lower",
                "returns": "STRING",
                "description": "Returns the input string with all characters converted to lower case",
                "usage": "lower('aBC') = 'abc'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "str",
                        "description": "The mixed case string"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "lpad",
                "name": "lpad",
                "returns": "STRING",
                "description": "The _string_ argument is __left-padded__ to length _number_ with characters from the _pad_str_ argument.",
                "usage": "LPAD('123.50', 10, '*-') = '*-*-123.50'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "string",
                        "description": "The input string"
                     },
                     {
                         "data_type": "INT",
                         "name": "number",
                         "description": "How many characters to pad with"
                     }
                ],
                "opt_args": [
                    {
                        "data_type": "STRING",
                        "name": "pad_str",
                        "description": "Characters to pad the string with"
                    }
                  ]
            },
            {
                "id": "ltrim",
                "name": "ltrim",
                "returns": "STRING",
                "description": "__Removes__ leading whitespace from the _input_ string, or optionally the _opt_chars_ characters",
                "usage": "ltrim('   abc') = 'abc'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input",
                        "description": "The input string"
                    }
                ],
                "opt_args": [
                    {
                        "data_type": "STRING",
                        "name": "opt_chars",
                        "description": "Optional characters to remove when matched"
                    }
                  ]
            },
            {
                "id": "parse_url",
                "name": "parse_url",
                "returns": "OBJECT",
                "description": "Returns a __JSON__ object consisting of all the components (_fragment_, _host_, _path_, _port_, _query_, _scheme_) in a valid input __URL/URI__.",
                "usage": "parse_url('https://www.akamai.com/test.jpg'):host = 'www.akamai.com'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "url",
                        "description": "A URL to parse into its components"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "position",
                "name": "position",
                "returns": "NUMBER",
                "description": "Searches for an __occurrence__ of _a_ in _b_ and, if successful, returns the __position__ of that occurance.",
                "usage": "position('abc','123abc456') = 4",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "a",
                        "description": "The string to find"
                     },
                     {
                         "data_type": "STRING",
                         "name": "b",
                         "description": "The input string"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "repeat",
                "name": "repeat",
                "returns": "STRING",
                "description": "Builds a string by _repeating_ the input for the specified number of times.",
                "usage": "repeat('abc',2) = 'abcabc",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input_string",
                        "description": "The input string"
                     },
                     {
                         "data_type": "INT",
                         "name": "number",
                         "description": "Number of times to repeat _input_string_"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "replace",
                "name": "replace",
                "returns": "STRING",
                "description": "Removes all occurrences of a specified __substring__, and optionally _replaces_ them with another _string_.",
                "usage": "replace('abcdef','de','X') = 'abcXf",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input_string",
                        "description": "The input string"
                     },
                     {
                         "data_type": "STRING",
                         "name": "subtring",
                         "description": "The string to remove / replace"
                     }
                ],
                "opt_args": [
                    {
                        "data_type": "STRING",
                        "name": "replacement",
                        "description": "String to substitute"
                    }
                  ]
            },
            {
                "id": "reverse",
                "name": "reverse",
                "returns": "STRING",
                "description": "Reverses the order of characters in a string",
                "usage": "reverse('abc') = 'cba",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input_string",
                        "description": "The string to _reverse_"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "right",
                "name": "ceil",
                "returns": "STRING",
                "description": "Returns a __rightmost__ _substring_ of its input.",
                "usage": "right('abc',2) = 'bc'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input_string",
                        "description": "The input string"
                     },
                     {
                         "data_type": "INT",
                         "name": "number",
                         "description": "The number of characters to return"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "rpad",
                "name": "rpad",
                "returns": "STRING",
                "description": "__Right-pads__ a string or binary value with characters from _pad_",
                "usage": "rpad('abc','*-',7) = 'abc*-*-",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "",
                        "description": ""
                     },
                     {
                         "data_type": "INT",
                         "name": "number",
                         "description": ""
                     }
                ],
                "opt_args": [
                    {
                        "data_type": "STRING",
                        "name": "pad",
                        "description": "The string to pad with"
                    }
                  ]
            },
            {
                "id": "rtrim",
                "name": "rtrim",
                "returns": "STRING",
                "description": "_Removes_ trailing whitespace, or characters _trim_chars_ from a string",
                "usage": "rtrim('abc  ') = 'abc'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input_string",
                        "description": "Input string"
                    }
                ],
                "opt_args": [
                    {
                        "data_type": "STRING",
                        "name": "trim_chars",
                        "description": "Optional characters to trim"
                    }
                  ]
            },
            {
                "id": "space",
                "name": "space",
                "returns": "STRING",
                "description": "Builds a string consisting of the specified _number_ of blank spaces",
                "usage": "space(3) = '   '",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "INT",
                        "name": "number",
                        "description": "Number of spaces"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "split",
                "name": "split",
                "returns": "[STRING]",
                "description": "__Splits__ a given STRING with a given CHAR _delimiter_ and returns the result in an ARRAY of STRINGS",
                "usage": "split('test.com','.') = ['test','com']",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input_string",
                        "description": "The string to split"
                     },
                     {
                         "data_type": "CHAR",
                         "name": "delimiter",
                         "description": "The _delimiter_ character to split with"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "split_part",
                "name": "split_part",
                "returns": "STRING",
                "description": "Splits an _input_string_ using the _delimiter_ and removes trailing characters, including whitespace, from the part specified with _part_number_",
                "usage": "split('test.com','.',1) = 'test'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input_string",
                        "description": "The input string"
                     },
                     {
                         "data_type": "CHAR",
                         "name": "delimiter",
                         "description": "The delimiter CHAR to split with"
                     },
                     {
                         "data_type": "INT",
                         "name": "part_number",
                         "description": "The part to trim whitespaces from"
                     }
                  ],
                "opt_args": []
            },
            {
                "id": "startswith",
                "name": "startswith",
                "returns": "BOOLEAN",
                "description": "Returns __TRUE__ if _input_string_ starts with _b_.",
                "usage": "startswith('abc','ab') = true",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input_string",
                        "description": "The input string"
                     },
                     {
                         "data_type": "STRING",
                         "name": "b",
                         "description": "The string to check for"
                     }
                ],
                "opt_args": []
            },
            {
                "id": "substr",
                "name": "substr",
                "returns": "STRING",
                "description": "Returns the _portion_ of _input_string_, starting from the character specified by _start_, with optionally limited _length_.",
                "usage": "substr('abcdef',4) = 'def'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input_string",
                        "description": ""
                     },
                     {
                         "data_type": "INT",
                         "name": "start",
                         "description": "The start of the substring to return"
                     }
                ],
                "opt_args": [
                    {
                        "data_type": "INT",
                        "name": "length",
                        "description": "The length of the subtring"
                    }
                  ]
            },
            {
                "id": "translate",
                "name": "translate",
                "returns": "STRING",
                "description": "Translates _input_string_ from the characters in src_alphabet to the characters in dst_alphabet.",
                "usage": "translate('abcdef','ac','x3') = 'xb3def'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input_string",
                        "description": "The input string"
                     },
                     {
                         "data_type": "STRING",
                         "name": "src_alphabet",
                         "description": "The source alphabet"
                     },
                     {
                         "data_type": "STRING",
                         "name": "dst_alphabet",
                         "description": "The destination alphabet"
                     }
                  ],
                "opt_args": []
            },
            {
                "id": "trim",
                "name": "trim",
                "returns": "STRING",
                "description": "Removes leading and trailing whitespace, or optionally _trim_chars_ from _input_string_",
                "usage": "trim(' abc  ') = 'abc'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input_string",
                        "description": "The string to trim"
                    }
                ],
                "opt_args": [
                    {
                        "data_type": "STRING",
                        "name": "trim_chars",
                        "description": "The characters to trim"
                    }
                  ]
            },
            {
                "id": "upper",
                "name": "upper",
                "returns": "STRING",
                "description": "Returns the _input_string_ with all characters converted to uppercase",
                "usage": "upper('abc') = 'ABC'",
                "category": "string",
                "subcategory": "general",
                "args": [
                    {
                        "data_type": "STRING",
                        "name": "input_string",
                        "description": "The string to transform to __UPPERCASE__ characters"
                    }
                ],
                "opt_args": []
            },
            {
                "id": "uuid_string",
                "name": "uuid_string",
                "returns": "STRING",
                "description": "Generates a _version 4_ (random) UUID, or _version 5_ (namespaced) UUID when the _uuid_ and _name_ arguments are provided",
                "usage": "uuid_string() = '3afd051d-4bd0-4b30-8376-cf062719f090'",
                "category": "string",
                "subcategory": "general",
                "args": 0,
                "opt_args": [
                    {
                       "data_type": "STRING",
                       "name": "uuid",
                       "description": "The UUID namespace i.e. 'fe971b24-9572-4005-b22f-351e9c09274d'"
                    },
                    {
                        "data_type": "STRING",
                        "name": "name",
                        "description": "The UUID name i.e. 'foo'"
                    }
                 ]
            }
        ]
    };