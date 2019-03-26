;(function(window, document, $, moment, SimpleScrollbar){

    'use strict';
  

    window.akdv.utils = {

            
        addClassAndRemoveAfterDuration : function(groupElement, elements, className, duration){
            
            /**
             * Applies a 'className' to a set of 'elements', and then removes it after 'duration'
             *  
             * groupElement:    object/string   ~ A group to selected the 'elements' of children of
             * selectors:       Array           ~ An array of css selectors, for elements to have the class applied too
             * duration:        Number          ~ A duration in milliseconds after which the supplied class is removed from all 'groupElement' -> 'elements'
             */

            // If groupElement appears to be a string selector, attempt to get it as an element
            if( $.type(groupElement) === 'string' ) { groupElement = $(groupElement).get(0); }
            
            // QUIT: If we do not have the required args
            if( $.type(groupElement) !== 'object' || $.type(elements) !== 'array' || elements.length === 0 ) { return; }

            // Sanitize the args
            if( $.type(duration) !== 'number' ) { duration = 2000; }
            
            var container = $(groupElement);

            // Apply the flash CSS class to all provided selectors
            elements.forEach(function(selector,i){
                if( $.type(selector) === 'string' ){ container.find(selector).addClass(className); } 
            });

            // Stop all flashing elements after 'duration'
            window.setTimeout(function(){
                container.find('.' + className).removeClass(className);
            }, duration);
        },
        
        
        scrollSVGChartElementIntoView : function(sourceEl,targetEl) {
            
            // Do not scroll when the source is yourself
            if(sourceEl === targetEl) { return; }
            
            //Quit if this is not an SVG Group node
            if(targetEl.nodeName !== 'g') { return; }
            
            // Get the SimpleBar scroll container if present, if not get the scrollable-y element
            let scrollElement = $(targetEl).parents('.ss-content').get(0);
            if( $.type(scrollElement ) !== 'object' ) {
                scrollElement = $(targetEl).parents('.scrollable-y').get(0) || window;
            }

            if ( !window.akdv.utils_dom.isScrolledIntoView(targetEl, scrollElement) ) {
                
                let svgParent = $(targetEl).parents('svg').get(0);
                let parentPos = svgParent.getBoundingClientRect();
                let elementPos = targetEl.getBoundingClientRect();
                let offset = (elementPos.top - parentPos.top) - (elementPos.height * 0.5);
                
                this.smoothScrollTopTo( scrollElement, offset, 0.1);
            }
        },

        
        smoothScrollTopTo : function(el, offset, rate, cancelExistingScrolls, maxIterations){

            // The difference between the current scrollTop and the target is divided by rate, lower rates, mean slower scrolls;
            if( $.type(rate) !== 'number') { rate = 0.1; }
            
            // Store a UUID on the container, so we can cancel any existing scrolls
            let scrollID = null;
            
            if( $.type(cancelExistingScrolls) === 'boolean' && cancelExistingScrolls ) {
                scrollID = window.akdv.utils_string.generateUUID();
                el.scrollSVGChartElementIntoViewScrollID = scrollID;
            }
            
            // A safety mechanisms 
            var maxSteps = 100;
            if( $.type(maxIterations) === 'number' ) { maxSteps = maxIterations; }

            var previousScrollTop = -100; // QUIT: the animation loop, if there is no scrollTop change after a loop
            var currentStep = 0;

            var step = function( scrollElement, pxOffset) {

                   var diff = pxOffset - scrollElement.scrollTop;
                   var scrollDiff = Math.abs(Math.ceil(diff * rate));
                   
                   // Do not loop if, scrollID on container, does not match the arg
                   if( $.type(cancelExistingScrolls) === 'boolean' && cancelExistingScrolls ) {
                       if( scrollElement.scrollSVGChartElementIntoViewScrollID !== scrollID ) { return; }
                   }
                   
                   /** Do not loop if the scroll diff has reached its target
                    * Or currentStep exceeds safety maxStep value
                    */
                   if( scrollDiff === 0 || currentStep >= maxSteps ) { return; } // QUIT : the animation loop if maxSteps count is reached
                   
                   // Apply the current scrollDiff, to scroll the element incrementally towards the targetted position
                   if(scrollElement.scrollTop < pxOffset) {
                       scrollElement.scrollTop += scrollDiff;
                   }
                   else
                   {
                       scrollElement.scrollTop -= scrollDiff;
                   }
                   
                   /** QUIT: If the new scrollTop value, is the same as on the previous iteration 
                    *  We may have prematurely hit the bottom/top of the elements scroll range
                    */
                   if(previousScrollTop === scrollElement.scrollTop) { return; }
                   previousScrollTop = scrollElement.scrollTop;
                   
                   // Now loop this function, until we reach the desired scrollTop value
                   window.requestAnimationFrame(step.bind(this,scrollElement,pxOffset));
                   
                   currentStep++; 
            };
            
            step(el,offset);
        },
  

        formatCurrencyString : function(number, currency, decimals) {

            /**
             * Converts a decimal into a currency specific string
             * number : the decimal value to format
             * currency : The currency to format i.e. https://en.wikipedia.org/wiki/ISO_4217
             */
            
            var formattedNumber = number.toLocaleString('en-US');
            var postFix = '';
            var preFix = '<span class="sub-script">$</span>';

            if ($.type(decimals) === 'undefined') {
                decimals = 2;
            }
                        
            switch (currency) {
                case 'USD':
                    preFix = '<span class="super-script">$</span>';
                    break;
                    
                case 'EUR':
                    preFix = '<span class="super-script">€</span>';
                    break;
                    
                case 'GBP':
                    preFix = '<span class="super-script">£</span>';
                    break;
                    
                case 'CNY':
                    preFix = '<span class="super-script">￥</span>';
                    break;
                    
                case 'YEN':
                    preFix = '<span class="super-script">￥</span>';
                    break;
                    
                default:
                    preFix = '<span class="super-script">€</span>';
            }
            
            if( formattedNumber.split(",").length === 3 )
            {
                formattedNumber = (number * 0.000001).toFixed(decimals);
                postFix = '<span class="sub-script">M</span>';

            } else if (formattedNumber.split(",").length === 4) {

                formattedNumber = (number * 0.000000001).toFixed(decimals);
                postFix = '<span class="sub-script">B</span>';
            }
            else {
                formattedNumber = '' + number.toFixed(decimals);
            }
            
            return  preFix + formattedNumber + postFix;
        },
        
        
        formatHighValueNumberToDenominationString : function(number, dTrillions, dBillions, dMillions, dThousands, singleChar, addClass, className) {
            
            // What denominations to format
            if( $.type(dTrillions) !== 'boolean') {
                dTrillions = true;
            }
            
            if( $.type(dBillions) !== 'boolean') {
                dBillions = true;
            }
            
            if( $.type(dMillions) !== 'boolean') {
                dMillions = true;
            }
            
            if( $.type(dThousands) !== 'boolean') {
                dThousands = false;
            }
            
            // What should the class be called
            if( $.type(className) !== 'string' || className.length === 0 ) {
                className = 'postfix';
            }
            
            
            // Wrap any formatted text, with a class of 'postfix'
            var classTemplate = window.akdv.utils_string.stringLiteralTemplate`${1}`;
            if( $.type(addClass) === 'boolean' && addClass )
            {
                classTemplate = window.akdv.utils_string.stringLiteralTemplate`<span class="${0}">${1}</span>`;
            }
            
            
            // Should the formatting be a single char, or a word
            var Tformatted = 'Trillion';
            var Bformatted = 'Billion';
            var Mformatted = 'Million';
            var Kformatted = 'Thousand';
            
            if( $.type(singleChar) === 'boolean' && singleChar ) {
                Tformatted = 'B';
                Bformatted = 'B';
                Mformatted = 'M';
                Kformatted = 'T';
            }
            
            
            if( $.type(number) === 'number')
            {
                var trillion = 1000000000000;
                var billion = 1000000000;
                var million = 1000000;
                var thousand = 1000;
                
                if( number >= trillion && dTrillions)
                {
                    return  (number / trillion).toFixed(3) + classTemplate.with( className, Tformatted );
                }
                else if( number >= billion && dBillions)
                {
                    return  (number / billion).toFixed(2) + classTemplate.with( className, Bformatted );
                }
                else if( number >= million && dMillions)
                {
                    return  (number / million).toFixed(1) + classTemplate.with( className, Mformatted );
                }
                else if( number >= thousand && dThousands)
                {
                    return  (number / thousand).toFixed(0) + classTemplate.with( className, Kformatted );
                }
                else
                {
                    return '' + number.toLocaleString('en-US');
                }
                
            }
            else
            {
                window._log.warn('Method expect number!');
                return '0';
            }
        }

    };


}(window, document, window.jQuery, window.moment, window.SimpleScrolbar));