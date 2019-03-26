;(function(window, document, d3) {

    'use strict';

    window.D3TextCell = function() {

        
        /** ================ Options / Defaults ================== */
        var data = null,
        transitions_enabled = false,
        group_selector = '',
        css_class = '',
        color_range = null;
        

        const setClass = function(d) {

            /**
             * Sets the class of the cell, based on various properties
             */
            
            var className = ''

            // Set the base classname
            if( d.css_class )
            {
                className += d.css_class;
            }
               
            // Value change is flagged...
            if( $.type(d.change_positive) === 'boolean' )
            {
                if(d.change_positive)
                {
                    className += ' change-positive'; // Flag that a value has changed, POSITIVELY
                }
                else
                {
                    className += ' change-negative'; // Flag that a value has changed, NEGATIVELY
                }
            }

            return className;
        };

        
        const formatText = function(value,options) {

            let originalValue = value;
            
            // Format the string for a currency
            if( options.fmt_currency )
            {
                var currencyISO = options.fmt_currency_iso;
                var decimalPlaces = options.fmt_decimal_places;
                
                if( $.type(currencyISO) !== 'string' )
                {
                    currencyISO = 'USD';
                }
                
                if( $.type(decimalPlaces) !== 'number' )
                {
                    decimalPlaces = 2;
                }
                
                return window.akdv.utils.formatCurrencyString(originalValue, currencyISO, decimalPlaces );
            }
            
            
            // Modify the number by a mult i.e. to change 0.1 to 10 for percentage display
            if( $.type(options.fmt_mult) === 'number' )
            { 
                value = originalValue * options.fmt_mult;
            }
            
            
            // Make the number, absolute
            if( ($.type(options.fmt_number_absolute) === 'boolean' && options.fmt_number_absolute) || ($.type(options.fmt_number_add_sign) === 'boolean' && options.fmt_number_add_sign) )
            { 
                value = Math.abs(value);
            }
            
            
            // convert number to string with fixed decimal places
            if( $.type(options.fmt_decimal_places) === 'number' )
            { 
                value = value.toFixed(options.fmt_decimal_places);
            }

            
            // Add commas
            if( $.type(options.fmt_number_add_comma) === 'boolean' && options.fmt_number_add_comma )
            { 
                value = (value * 1).toLocaleString('en-US');
            }
            
            
            if( $.type(options.fmt_number_add_sign) === 'boolean' && options.fmt_number_add_sign)
            {
                if(originalValue > 0)
                {
                    value = '+' + value;  
                }
                else if(originalValue < 0)
                {
                    value = '-' + value;
                }
            }
            
            
            // Set the texts colour, using a d3.range
            if( $.type(options.color_scale) === 'function' )
            {
                value = '<span style="color: ' + options.color_scale(originalValue) +';"> ' + value +'<span>'
            }
            
            // Prefix the value with the separator string i.e. ' / ' or ', '
            if( $.type(options.append_string_separator ) === 'string' && options.append_string_separator.length !== 0 )
            {
                value = '<span class="text-cell-separator">' + options.append_string_separator + '</span>' + value;
            }
            
            // Apply the supplied prefix to the string
            if( $.type(options.text_prefix_string) === 'string' && options.text_prefix_string.length !== 0 )
            {
                if( options.text_prefix_subscript )
                {
                    value += '<span class="sub-script">' + options.text_prefix_string + '</span>';
                }
                else if( options.text_prefix_superscript )
                {
                    value += '<span class="super-script">' + options.text_prefix_string + '</span>';
                }
                else
                {
                    value += options.text_prefix_string;
                }
            } 
               
            
            // Apply the supplied postfix to the string
            if( $.type(options.text_postfix_string) === 'string' && options.text_postfix_string.length !== 0 )
            {
                if( options.text_postfix_subscript )
                {
                    value += '<span class="sub-script">' + options.text_postfix_string + '</span>';
                }
                else if( options.text_postfix_superscript )
                {
                    value += '<span class="super-script">' + options.text_postfix_string + '</span>';
                }
                else
                {
                    value += options.text_postfix_string;
                }
            } 

            return value;
        }
        
        
        /** ================ Init Text Cell ================== */
        const textCell = function(selection) {
            
            selection.each(function(d,i) {
                
                    // Create DIV.value and set text
                    d3.select(d.group_selector).select('div').remove();
                
                    d3.select(d.group_selector)
                        .append('div')
                        .attr('class', setClass(d) )
                        .html( function() { return formatText(d.value,d) });
            });  
        };


        /** ================ Update Text Cell ================== */
        textCell.update = function(selection) {
            
            selection.each(function(d,i) {

                // Update Cell
               d3.select(this)
                   .attr('class', setClass(d) )
                   .html( function() { return formatText(d.value,d) });
               
            });  
        };
        
        
        /** ================  Getters / Setters ================== */
        textCell.data = function(val) {
            data = val;
            return textCell;
        };
        
        textCell.transitions_enabled = function(val) {
          transitions_enabled = val;
          return textCell;
        };
        
        textCell.group_selector = function(val) {
            group_selector = val;
            return textCell;
        };
          
        textCell.css_class = function(val) {
            css_class = val;
              return textCell;
        };

        textCell.color_range = function(val) {
            color_range = val;
              return textCell;
        };
        
        
        
        return textCell;
    }


}(window, document, window.d3));