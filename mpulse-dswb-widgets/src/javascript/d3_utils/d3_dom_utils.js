;(function(window, document, d3) {

    'use strict';

    window.d3AppendSVGWithResponsiveAttributesToID = function(id) {

        return d3.select(id).append('svg')
            .attr('id', id.replace(/#/g, '') + '-svg')
            .attr('width', '100%')
            .attr('preserveAspectRatio', 'xMinYMin meet');
    };


    window.prependToClassListOfSelection = function(selection, new_class, move_class_to_front = true) {

        selection.each(function(el) {

            if (this.classList) {
                if (this.classList.contains(new_class) && move_class_to_front) {
                    this.classList.remove(new_class);
                }
                if (!this.classList.contains(new_class)) {
                    this.setAttribute('class', new_class + ' ' + this.classList.value);
                }
            }
        });
    };


    window.togglePrependToClassListOfSelection = function(selection, new_class) {

        selection.each(function(el) {

            if (this.classList) {
                if (!this.classList.contains(new_class)) {
                    this.setAttribute('class', new_class + ' ' + this.classList.value);
                } else {
                    this.classList.remove(new_class);
                }
            }
        });
    };
    

    // Take care to call this providing a unique id 
    // this will be prefixed onto '-linear-gradient'
    // otherwise when you assign a fill to an element
    // using just #linear-gradient it's hard to know 
    // which one will be used.
    window.d3AppendLinearGradient = function(defs, _id) {

        var id = _id || '';

        return defs.append('linearGradient')
            .attr('id', id.replace(/#/g, '') + '-linear-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');
    };

    
    window.d3CompressTextLabel = function(text_nodes_selection, compressURL, ellipsize, ellipsisThreshold, ellipsisMethod, urlAsToolTip) {
        
        /**
         * Takes a selection (array) of text nodes. Gets .textContent from each node, and shortens to end asset name
         * i.e. https://foo.bar.net/fudgey/banana/happyBananaFamily.png becomes happyBananaFamily.png
         * ellipsize : DEFAULT : False ~ Optionally, ellipsize the string, if it exceeds a character length. 
         * ellipsisThreshold ~ How many chars a string can be, before it is ellipsized
         * ellipsisMethod : START, MIDDLE, END : DEFAULT - MIDDLE ~ Where should the excessive characters be replaced
         * urlAsToolTip : default TRUE ~ Apply the original string as a alt (tooltip) on the text node.
         */
        
        // QUIT : If no array is supplied
        if( typeof text_nodes_selection !== 'object' || typeof text_nodes_selection.nodes !== 'function' ) { return; }
        
        // Sanitize the args
        if( typeof compressURL !== 'boolean' ) { compressURL = false; }
        
        if( typeof ellipsize !== 'boolean' ) { ellipsize = true; }
        
        if( typeof ellipsisThreshold !== 'number' ) { ellipsisThreshold = 22; }
        
        if( typeof ellipsisMethod !== 'string' || ellipsisMethod.length === 0 ) { ellipsisMethod = 'MIDDLE'; }
        
        if( typeof urlAsToolTip !== 'boolean' ) { urlAsToolTip = true; }
        
        
        // ---
        
        var urlSlash = /\//g,
        textLabel,
        forwardSlashes,
        splitURL,
        endToken
        
        text_nodes_selection.each(function(text,i) {

            if( this.hasAttribute('data-compressed-label') ) {
                // If the label has already been compressed and stored, re-use it
                this.textContent = this.getAttribute('data-compressed-label');
                return;
            }
            
            textLabel = text;
            
            // Keep the original FULL label text, for later use
            if( compressURL || ellipsize ) {
                d3.select(this).attr('data-full-text', textLabel)
            }
            

            if( compressURL ) {

                // Split off end of URL, the filename, and replace text content with this
                forwardSlashes = this.textContent.match(urlSlash);
                
                if( Array.isArray(forwardSlashes) ) {
                    
                    // Iterate through the array of strings, produced from splitting the original string
                    splitURL = this.textContent.split('/');
                    endToken = 1;
                    
                    if( $.type(splitURL) === 'array') {
                        
                        splitURL.forEach(function(){
                            textLabel = splitURL[splitURL.length - endToken];
                            
                            // Is the current textLabel valid
                            if( $.type(textLabel) === 'string' && textLabel.length !== 0 ) {
                                // If so, use it
                                return;
                            }
                            else
                            {
                                // Otherwise, try the next one in
                                endToken++;
                            }
                        });
                    }
                    else
                    {
                        textLabel = this.textContent;
                    }    
                }
            }

            // Ellipsise text
            if( ellipsize ) {
                textLabel = window.akdv.utils_string.ellipsizeText(textLabel, ellipsisMethod, undefined, ellipsisThreshold);
            }

            // Update text and store for later re-use
            this.textContent = textLabel;
            this.setAttribute("data-compressed-label", textLabel);
            this.setAttribute("data-original-label", text);
            
            // Apply the original text as a SVG tooltip
            if( urlAsToolTip ) { 
                d3.select(this)
                    .append('title')
                    .attr('class','compacted-url-tooltip')
                    .text(text);     
            }
        });
    };
    

    window.d3ApplyVendorColor = function(d3TextNodes, d3VendorColor, applyAsData, styleText) {
        
        /**
         * Generates a HSL color, based on a vendor string
         * Applies this to each text node, as a data-vendor-color attr
         * Optionally, applies the color as a style to the text node
         */
        
        let nodes = d3TextNodes.nodes();
        
        if( $.type(nodes) === 'array') {
            nodes.forEach(function(node,i){
                
                // SKIP : If data attribute already applied
                if( $.type(applyAsData) === 'boolean' &&  applyAsData) { if( node.hasAttribute('data-vendor-color') ){ return; }}
                
                let vendor = node.getAttribute('data-vendor');
                if( $.type(vendor) === 'string' && vendor.length > 0 ){
                    
                    let vendorColor = d3VendorColor.getColor(vendor);
                    
                    if( $.type(applyAsData) === 'boolean' &&  applyAsData) {
                        // Set the colour string as data-vendor-color on the text node
                        d3.select(node).attr('data-vendor-color', vendorColor);
                    }
                    
                    if( $.type(styleText) === 'boolean' &&  styleText) {
                        // Set the FILL colour of the text node
                        d3.select(node).style('fill', vendorColor);
                    }
                } 
            });
        }  
    };
    
    
    window.d3AddVendorIconToText = function(d3TextNodes, d3VendorColor, location) {
        
        var nodes = d3TextNodes.nodes(),
        vendorString,
        vendorColor,
        tickHeight,
        iconGroupSel;
        
        if( $.type(nodes) === 'array') {
            
            nodes.forEach(function(node,i){
                
                // SKIP :  If the icon-group node already exists
                if( $(node).siblings('.vendor-icon-group').length ) { return; }
                
                // Get the vendor string + color for this item
                vendorString = node.getAttribute('data-vendor');
                
                vendorColor = node.getAttribute('datax-vendor-color'); 
                if( !vendorColor ) { vendorColor = d3VendorColor.getColor(vendorString); } 

                tickHeight = node.parentNode.getBBox().height;
                
                // Store the original dx of the TEXT, as we need to offset it LEFT, to make room for the icon
                if( !node.getAttribute('data-original-dx') )
                {
                    node.setAttribute('data-original-dx',  node.getAttribute('dx') || 0 );
                }
                
                // Now offset the text, to the left, making room for the icon
                d3.select(node).attr('dx', -tickHeight * 0.6);
                
                iconGroupSel = d3.select(node.parentNode)
                    .append('g')
                        .attr('class','vendor-icon-group')
                        .attr('transform','translate(0,0)');
                
                iconGroupSel
                    .append('circle')
                        .attr('class','vendor-icon')
                        .attr('cx', -tickHeight * 0.5)
                        .attr('cy', tickHeight * 0.0)
                        .attr('r',  tickHeight * 0.3)
                        .style('fill', vendorColor );
                
            });
        }
    };

    
    window.d3AddAxisTickMatchingAttrHighligher = function(axisParentElement, dataAttribute, matchingClassName) {
        
        /**
         * Applies a jQuery mouseOver event to Axis labels. This highlights ANY other text nodes on the same document, that share the same specified data attr
         * 
         * axisParentElement ~ Element : The PARENT node for a given axis, generall an SVG node, delegated event handler is added here
         * dataAttribute ~ String : The attribute to match on other TEXT elements
         * 
         */
           
        if( $.type(axisParentElement) === 'object' && $.type(dataAttribute) === 'string' )
        {
            if( $.type(matchingClassName) !== 'string' || matchingClassName.length === 0 )
            {
                matchingClassName = 'axis-attribute-match';
            }
            
            let textMouseOver = function(event){
                
                // Show matching elements with dataAttribute
                
                event.preventDefault();
                
                // Get the text node, within this tick, it holds the data attr we need
                let $textNode = $(this).find('text[' + dataAttribute + ']');
                
                // QUIT: If text node not found
                if( $textNode.length === 0 ){ return; }
                
                // Get the attr from the hovered ticks text element
                let hoveredAttr = $textNode.attr(dataAttribute);

                // Get ALL matching text elements on the page, with the attribute
                var searchString = 'body svg .axis .tick text[' + dataAttribute + '="' + hoveredAttr + '"]';
                let axisLabels = $(searchString);
                
                // Highlight ALL matching tick text, with the same attr
                axisLabels.each(function(i,textNode) {
                    $(textNode).addClass(matchingClassName);
                });
            };
            
            let textMouseOut = function(event){
                
                // Reset on leave...
                
                event.preventDefault();

                // Get ALL matching text elements on the page, with the attribute
                let axisLabels = $('body svg .axis .tick text[' + dataAttribute + ']');
                
                // Clear the hightlight from all tick text
                axisLabels.each(function(i,textNode) {
                    $(textNode).removeClass(matchingClassName);
                });
            };
            
            $(axisParentElement).on( "mouseover", "g.tick", textMouseOver);
            $(axisParentElement).on( "mouseout", "g.tick", textMouseOut);
        }
    };
    

}(window, document, window.d3));