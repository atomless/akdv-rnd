;(function(
        window,
        document,
        $,
        d3,
        addLocalizedString,
        markdownit
        ) {

    'use strict';

    /**
     * Help, provides a system to create and display help Annotations, including HTML and SVG lines, indicating the annotations target.
     * On first display, system applies a (JSON) array of data to elements in the DOM (assuming they are found).
     * Then it gathers this same data, and builds the Annotations for each element using the annotation data.
     * 
     * Updates layout of Annotations on window.resize, and mutation/change (x,y,width,heigh etc) of target SVG nodes.
     * 
     * 
     * Jargon...
     *      target - The DOM element that the Annotation points too and explains
     *      infoBox - The HTML element that the annotation HTML is injected into
     *      connector - A SVG diagram that visually links the target element to the infoBox
     * 
     * 
     * JSON Attributes
     *      description:                    STRING                           ~ Optional desciription of helps purpose. A useful comment for later data tweaking
     *          
     *      targetCssSelector:              STRING : CSS selector            ~ Used to apply each array objects data to a given element. Generally should resolve to a single element.
     *      
     *      targetSelectInRange:            OBJECT : JSON                    ~ An object, defining a range of elements to use as a potential target, and a desired element within that range
     *                                          rangeDef: STRING             ~ The type of range to use, options are 'closestToIndex'
     *                                              closestToIndex           ~ Finds the element nearest to the supplied index i.e. if you specify 12 and 4 elements present, el 4 is returned
     *                                          
     *                                          index: INT                   ~ The INDEX to use with rangeDef methods that require an index
     *                                                   
     *      
     *      connector:                      OBJECT : bracket, disc, arrow    ~ Brackets are good for large blocks, discs for small items. See below for object def for each type
     *      
     *      infoPositioning:                STRING : above, below            ~ The infoBox position relative to the target
     *      connectorOffset:                NUMBER : Viewport % offset       ~ From the infoBox, to the targets nearest edge.
     *      infoBoxHeight:                  NUMBER : Viewport % height       ~ A viewport height % for the initial size of the infoBox. NOTE: InfoBox will expand if height cannot contain supplied HTML
     *      infoBoxWidth:                   NUMBER : Viewport % width        ~ column % width for the infoBox.
     *      layoutColumn:                   STRING : CSS selector            ~ defining a DOM element that defines a column within which the infoBoxWidth is applied
     *      infoHTML:                       STRING : HTML                    ~ that is injected into the infoBox. Supports images! See CSS for classes to style with
     * 
     * 
     * SELECT TYPES:
     *    {
     *       type: 'bracket'
     *       bracketInsetLeft:              NUMBER : Horizontal offset       ~ LEFT edge bracket line. Can use +/- values to move line in / out.
     *       bracketInsetRight:             NUMBER : Horizontal offset       ~ RIGHT edge bracket line. Can use +/- values to move line in / out.
     *       bracketInsetVertical:          NUMBER : Vertical offset         ~ A viewport height %. TOP/BOTTOM bracket edge line. Can use +/- values to move line up / down.
     *    }
     *      
     *    {
     *       type: 'disc'
     *       connectorPositioning:      STRING : center, top-edge, bottom-edge, left-edge, right-edge, top-of, bottom-of, left-of, right-of, 25pc-left, 25pc-right, 25pc-up, 25pc-down         ~ Position of Disc, relative to Target element
     *    }
     *    
     *    {
     *       type: 'arrow'
     *       connectorPositioning:      STRING : top-of, right-of, bottom-of, left-of ~ Position of Arrow, relative to Target element
     *    }
     *  
     */
    

    // TODO: Add 'helpType' option for help item, this will allow you to style help in a themed manner, such as main_explanation, item info, tip  
    
     
    window.akdv.help = function() {
  
        // Public Options, Setters below...
        var helpButtonSelector = null,              // A selection string, for the HELP button in DOM
        helpElementSelector = null,                 // A selection string, that the HELP element, will be appended to...
        helpDataJSONPath = null,                    // The file-path to the Help JSON
        automations = null,                         // An array of automations, to be carried before the Help is displayed       
        displayInSets = false;                      // Display the Annotations in sets, double clicking progresses through the sets in turn
        
        
        
        // Private Properties
        var debug = false,
        bodyElement = $('body'),                    // Body element of document, used for varius measurements
        helpButtonElement = null,                   // A jQuery selection of the HELP button in DOM
        helpDomElement = null,                      // A DOM element the HELP DOM element, will be appended to...
        helpGroupEl = null,
        
        isVisible = false,
        
        data = null,                                // The Annotations data object, derived from JSON
        bodyData = null,
        annotations = {},
        annotationSets = null,
        annotationOptions = {},
        
        
        initComplete = false,
        resizeTimeout = null,
        mutationConfig = null,                      // Config for the Mutation Observer
        mutationObserver = null,                    // Watches the DOM for changes, is used to trigger layout refresh when it does
        mutationObserverSVG = null,
        onResizeID =  null,
        
        automate = null,
        
        displaySets = null,
        displaySetsIndex = 0,
        
        focusSheildGroup = null,
        focusSheildEl_TL = null,
        focusSheildEl_TM = null,
        focusSheildEl_TR = null,
        focusSheildEl_ML = null,
        focusSheildEl_MR = null,
        focusSheildEl_BL = null,
        focusSheildEl_BM = null,
        focusSheildEl_BR = null,
        
        options = {
            helpClass: 'akdv-help',                 // default help contain classname
        };

        
        
        // ============================================
        const help = function() {
        };
        
        // Instantiate our mardown lib
        help.mkdown = markdownit();
        
        // ------------------- Public Option Setters -----------------------
        
        help.helpButtonSelector = function(string) {

            helpButtonSelector = string;
            return help;
        };
        
        help.helpElementSelector = function(string) {

            helpElementSelector = string;
            return help;
        };
        
        help.helpDataJSONPath = function(string) {

            helpDataJSONPath = string;
            return help;
        };
        
        help.automations = function(array) {

            automations = array;
            return help;
        };
        
        help.displayInSets = function(bool) {

            displayInSets = bool;
            return help;
        };
        
        
        // Creating dummy func for this var here, to avoid order of creating issues with Linter
        var createAnnotation;
        
        
        const helpButtonSetup = function() {
            
            if( $.type(automate) === 'function' ) { 
                
                // With Automation : Show Help when automate completes
                helpButtonElement.on( 'click', function() {
                    automate.Process().then( help.display );
                });
                
                // Step through HELP on single-click on help element
                helpGroupEl.on("click", function(){ help.hide(); } );
                
                $('body').keydown( function(e){ if(e.keyCode === 37 || e.keyCode === 38 ) { help.displaySetPrevious(); } }); // left / up
                $('body').keydown( function(e){ if(e.keyCode === 39 || e.keyCode === 40 ) { help.displaySetNext(); } }); // right / down
                $('body').keydown( function(e){ if(e.keyCode === 27) { help.hide(true); } }); // Escape
                
                // FORCE, Hide HELP on double-click on help element
                helpGroupEl.on( 'dblclick', function(){ help.hide(true); } );
            }
            else 
            {
                // No Automation : Show Help immediately
                helpButtonElement.on("click", function(){  help.display();  }.bind(this));
                
                // Hide HELP on single-click
                helpGroupEl.on("click", function(){ help.hide(); }.bind(this));
            }
            
            helpButtonElement.attr('data-annotation-data-applied', false);
        };
        

        var resizeHelpCallback = function() {
            
            if( isVisible === false ) { return; }
                
            if( onResizeID !== null ) {
                window.clearTimeout(onResizeID);
            }
            
            onResizeID = window.setTimeout(function() {

                window.clearTimeout(onResizeID);

                $.each(annotations, function(i,o) {
                    createAnnotation(null,o.id);
                }.bind(this));
                
                onResizeID = null;
                
            }.bind(this), 300);
           
        }; 
        
        
        // ----------------- Public Methods ---------------------
        help.init = function() {

            // Only do actions after this point ONCE
            if( initComplete ) { return; }

            // If no DATA path has been set, QUIT
            if( $.type(helpDataJSONPath) !== 'string' || helpDataJSONPath.length === 0 ) { return; }
            
            // If no HELP button selector is specified, QUIT
            if( $.type(helpButtonSelector) !== 'string' || helpButtonSelector.length === 0 ) { return; }

            helpButtonElement = $(helpButtonSelector);
            
            // If the HELP button is not found, QUIT
            if( helpButtonElement.length === 0 ){ return; }
            
            
            //---------
            data = [];
            
            if( $.type(helpElementSelector) === 'string' ) {
                helpDomElement = $(helpElementSelector);
            }
            else {
                helpDomElement = $('body');
            }

            helpDomElement.append('<div id="help_system_group" class="akdv help-system-container"></div>');
            helpGroupEl = $('#help_system_group');
            
            // Create automate, if defined
            if( $.type(automations) === 'array' ) {
                automate = new window.akdv.automation(automations);
            }

            helpButtonSetup();
            
            // Update ALL Annotations when window Resizes
            window.onresize = resizeHelpCallback;
            
            initComplete = true; // Do not allow INIT to happen more than once
        };
        
        

        
        
        const clientRect = function(node) {
            
            /**
             * Returns an object, with position / size data on a standard DOM node
             * Follows the format of .getBoundingClientRect() available on SVG nodes
             */

            var sel = $(node);
            var clientRect = { 
                'bottom':0,
                'height':0,
                'left':0,
                'right':0,
                'top':0,
                'width':0
            };
            
            if( $.type(node) !== 'object' || $(node).length === 0 ) {
                return clientRect;
            }

            var o = sel.offset();
            var w = sel.outerWidth();
            var h = sel.outerHeight();
            
            clientRect.top = o.top;
            clientRect.bottom = o.top + h;
            clientRect.height = h;
            clientRect.width = w;
            clientRect.left = o.left;
            clientRect.right = o.left + w;
            
            // Lets add center coords, as these are often useful
            clientRect.center_x = o.left + (w * 0.5);
            clientRect.center_y = o.top + (h * 0.5);
            
            return clientRect;
        };
        
        
        const getVisibleHeightOfElement = function(el) {    
            
            /** Checks if an element has a parent with a Scrollbar
             * If it does, and its own height exceeds that of its scrollable parent
             * We return its parents Height, as that is all that can be visible of its own Height
             */
            
            var $el = $(el);
            var scrollHeight = el.scrollHeight;

            var elementHeight = $el.height();
            
            $.each( $el.parents(), function( i, v ) {
                
                var voo = $el;
                var hasScrollBar = false;
                var scrlHeight =  scrollHeight;
                
                if ((v.clientHeight < v.scrollHeight)) {
                    hasScrollBar = true;
                }
                
                if(hasScrollBar) {
                    var parentScrollerHeight = $(v).outerHeight();
                    
                    if(elementHeight > parentScrollerHeight) {
                        elementHeight = parentScrollerHeight;
                    }
                    return true;
                }  
            });
            
            return elementHeight;
        };
        
        
        const getClientRect = function(e) {
            /**
             * Returns an object, with the x,y pixel offsets, and width/height of element
             * el : a jQuery single element selection
             */
    
              var el = null, nt;
              
              // Convert e, into a DOM node...
              if( e instanceof $ ) // jQuery object
              {
                  el = e[0];
              }
              else if( e instanceof d3.selection ) // d3
              {
                  // D3 selection
                  el = e.node();
              }
              else // DOM Node
              {
                  el = e; 
              }

              nt = el.nodeName;
              
              var rectData = {};
 
              // Populate rectData, either from an SVG node, or a standard DOM node...
              if( $(el).parents('svg').length ) {
                  
                  // SVG
                  rectData = el.getBoundingClientRect();
                  
                  // Lets add center coords, as these are often useful
                  rectData.center_x = (rectData.left + rectData.width * 0.5);
                  rectData.center_y = (rectData.top + rectData.height * 0.5);
                  
                  // SVG elements do not scroll, so their visibleHeight, is their height...
                  rectData.visibleHeight = rectData.height;
                  
              }
              else
              {
                  // Standard DOM
                  
                  rectData =  clientRect(el);
                  rectData.visibleHeight = getVisibleHeightOfElement(el);
              }
              
              return rectData;
        };
        
        
        var createDisplaySets = function (data) {
            
            displaySets = [];
            
            data.annotations.forEach( function(d,i) { 
                
                // If the current Annotation has a SET number specified, we can store it
                if( $.type(d) === 'object' && $.type(d.set) === 'number' ) {
                    
                    // Create the SET defined in this Annotation
                    if( $.type(displaySets[d.set]) !== 'object' ) { displaySets[d.set] = { annotationIDs : [] }; }   
                    
                    // Store this Annotations ID in the set
                    if( displaySets[d.set].annotationIDs.indexOf(d.id) === -1 ) { displaySets[d.set].annotationIDs.push(d.id); }
                }

            }.bind(this));     
        };
        
        
        const closestIndex = function(index, $selection) {
            
            let arr = [];
            
            $selection.each(function(i) {
                arr.push(i);
            });
            
            let closest = arr[0];
            
            arr.forEach(function(val) {
                if ( Math.abs(index - val) < Math.abs(index - closest) )
                {
                    closest = val;
                }
            });

            return closest;
        };
        
        
        const getTargetElement = function(d) {
            
            /**
             * Returns a DOM element, based on the element selector defined for the Help item
             * If targetCssSelector is defined, a single element is targetted and returned
             * If targetSelectInRange
             */
            
            let el;
            if( $.type(d.targetCssSelector) === 'string' )
            {
                el = $(d.targetCssSelector).first();
                return el; 
            }
            else if( $.type(d.targetSelectInRange) === 'object' )
            {
                if( $.type(d.targetSelectInRange.rangeCSSSelector) === 'string' )
                {
                    const $sel = $(d.targetSelectInRange.rangeCSSSelector);
                    
                    if( $sel.length !== 0 )
                    {
                        if( $sel.length === 1 )
                        {
                            return $sel.first();
                        }
                        else
                        {
                            if( d.targetSelectInRange.rangeDef === 'closestToIndex' )
                            {
                                if( $sel.length - 1 > d.targetSelectInRange.index)
                                {
                                    return $sel[d.targetSelectInRange.index];
                                }
                                else
                                {
                                    return $sel[$sel.length - 1];
                                }
                            }
                        }
                    }
                }
            }
            
            return null;
        }
        
        
        const applyAnnotationData = function( showFunction ) {    
            
            /**
             * Pulls in annotation data from a .json file, and applies it to elements in the DOM
             */
            
            if( helpButtonElement.attr('data-annotation-data-applied') !== 'false' ) {
                return;
            }
            
            var getAnnotationData = window.akdv.xmlHTTP.getJSON( {url: helpDataJSONPath} );
            bodyData = getClientRect($('body')[0]);
            
            getAnnotationData.then(function(json_data) {
                
                if (json_data) {
                    
                    // Process the JSON -> data when it returns from the server
                    data = json_data;

                    // Store any annotation set data, if present
                    if( $.type(data.options) === 'object' ) { annotationOptions = data.options; }
                    
                    // Store any options, set in the data if present
                    if( $.type(data.sets) === 'array' ) { annotationSets = data.sets; }

                    //Prep each Annotation in the data
                    data.annotations.forEach( function(d,i) {
 
                        // Apply a UUID to each annotation
                        d.id = window.akdv.utils_string.generateUUID();
     
                        let sel = $( getTargetElement(d) );

                        if( sel.length )
                        {
                            // Prepare object data to be applied to element
                            const data_attr = $.extend(true, {}, d);
                            sel.attr('data-help-annotation', encodeURI(JSON.stringify(data_attr)) );
                        }
                        else
                        {
                            window._log.warn('Element ' + d.targetCssSelector + ' was not found in the DOM, please update your help JSON, looks like element IDs / classes / heirachies have changed.... ');
                        }
                        
                    }.bind(this));
                    
                    if(displayInSets) { createDisplaySets(data); } // Prep displaySets if specified
                    
                    helpButtonElement.attr('data-annotation-data-applied', true);

                    if( $.type(help.show) === 'function') { help.show(); }    
                } 
                                
            }.bind(this));
        };
        
        
        help.display = function() {

            applyAnnotationData();

            // Toggle Display
            if( helpButtonElement.hasClass('displayed') ) {
                help.hide();
            } else {
                help.show();
            }
        };
        
        
        const createMutationObserver = function() {

            // Only create ONE Mutation Observer
            if( $.type(mutationObserver) === 'null') {

                window._log.debug('%c Creating mutation observer','font-weight: bold; color: hsl(200,100%,40%);');
                
                mutationConfig = { 
                        attributes: true, 
                        childList: true, 
                        characterData: true
                };

                const mutationsProcessor = function(mutations) {
                    mutations.forEach(function(mutation) {
                        
                        if( onResizeID !== null ) { return; } // If Resizing is in progress, ignore mutations
                            
                        if(isVisible === false) { return; } // Skip updating layout, when Help is not visible
                        
                        window._log.debug( '%c mutation : ' + mutation.target.id, 'color: hsl(190,20%,60%);' );
                        
                        mutation.target.mutationObserverCallback();
                        
                    }.bind(this));    
                };
                
                mutationObserver = new MutationObserver(mutationsProcessor);
            }
        };
        
        
        const forceTargetParentsScrollReset = function(e,limit) {
            
            /**
             * Resets the scroll offset of any parent elements
             * e: - The element to check upwards from
             * limit: - A css selector, if this node is hit, going upward, stop the check
             */
            
            var parents = $(e).parents();
            
            $.each( parents, function(i,el) {
                 
                // If the limit class is matched
                if( $(e).hasClass(limit) ) { 
                    return true; // QUIT
                }
    
                // Check / Reset scroll to zero
                var scrollTop = el.scrollTop;
                if( $.type(scrollTop) === 'number' && scrollTop > 0 )
                {
                    el.scrollTop = 0;
                } 
            }.bind(this));   
        };
        
        
        const createTarget = function( data, id, e) {
            
            /**
             * Creates a TARGET, an element that replicates the position of the element to be annotated
             * Is removed / re-created on repeated call
             */

            forceTargetParentsScrollReset(e,'.column');
            
            var elGeo = getClientRect(e);

            // Create / Aquire
            var target = d3.select('#annotation_connector_' + id);
            
            if (target.empty()){
                target = d3.select('.akdv.help-system-container')
                .append('div')
                .attr('id','annotation_connector_' + id)
                .attr('class','annotation-connector')
                .style('position','absolute')
                .classed('muted', function(){
                    return data.muted;
                });
            }
            
            // Position / Size
            target
                .style('left', elGeo.left + 'px')
                .style('top', elGeo.top + 'px')
                .style('width', elGeo.width + 'px' )
                .style('height', elGeo.visibleHeight + 'px');
            
            //Set random background colour, on create update in debug mode
            if( debug ) {
                if( $(target.node()).css('background-color')=== 'rgba(0, 0, 0, 0)'){
                    target.style('background','hsla('+ Math.random() * 360 +',100%,50%,.2)');
                } 
            }
            
            return target;
        };
        
        
        const connectorOffset = function(annoData) {
            var heightPC = bodyData.height * 0.01;
            var offset = annoData.connectorOffset * heightPC;
            return offset;
        };
        
        
        const createInfoBox = function( data, target ) {

            /**
             * Creates an infoBox, which will contain the annotations descriptive text, images etc
             * Is removed / re-created on repeated call
             */
            
            // Does this infoBox already exist
            var infoBox = d3.select('.akdv.help-system-container #anno_infobox_' + data.id);
            
            if( infoBox.empty() ) {
              
                // NO, then make it
                infoBox = d3.select('#help_system_group')
                .append('div')
                    .attr('id','anno_infobox_' + data.id)
                    .attr('class','infoBox')
                    .style('position','absolute')
                    .classed('muted', function(){
                        return data.muted;
                    })
                    .classed('priority-low', function() {
                        if( $.type(data.priority) === 'string' &&  data.priority === 'low') { return true; } else { return false; }
                    })
                    .classed('priority-medium', function() {
                        if( $.type(data.priority) === 'string' &&  data.priority === 'medium') { return true; } else { return false; }
                    })
                    .classed('priority-high', function() {
                        if( $.type(data.priority) === 'string' &&  data.priority === 'high') { return true; } else { return false; }
                    });

                // Apply Info Text
                if( $.type(data.info) === 'array' )
                {
                    let infoHTML = '';
                    
                    data.info.forEach(function(info,index) {
 
                        // Add Text <p> containing markdown HTML
                        if( $.type(info.namespace) === 'string' && $.type(info.key) === 'string' )
                        {
                            let $paragraph = $('<p></p>');
                            $paragraph.html( help.mkdown.renderInline( addLocalizedString( $paragraph.get(0), info.key, info.namespace ) ) );
                            infoHTML += $paragraph.get(0).outerHTML;
                        }
                        
                        // Add Text <img>
                        if( $.type(info.src) === 'string' )
                        {
                            
                            const $newImg = $('<img></img>');
                            $newImg.attr('src',info.src);
                            $newImg.attr('alt',info.alt || '');
                            $newImg.attr('title',info.title || '');
                            $newImg.attr('style',info.style || '');
                            
                            infoHTML += $newImg.get(0).outerHTML; 
                        }
                    });

                    infoBox.html( infoHTML );
                }
                else
                {
                    infoBox.html( data.infoHTML );
                }

                
                // Apply a LOAD event to any images, as this will change the height of the infoBox, require update of layout
                var images = $(infoBox.node()).find('img');
                
                $.each(images, function(i,img){
                    
                    img.addEventListener("load", function(id,img) {
                        
                        window._log.debug(id + ' : image loaded : ' + img.getAttribute('src') );
                        
                        createAnnotation(null,id); // Image has loaded, reflow annotation...
                        
                    }.bind(this,data.id,img));
                    
                }.bind(this));
                
            }

            var elData = getClientRect(target.node());
            
            // Check if a layout column has been supplied
            var layoutColumn = null;
            
            if( $.type(data.layoutColumn) === 'string' && data.layoutColumn.length )
            {
                layoutColumn = $(data.layoutColumn);
            }
            
            if( layoutColumn.length === 1 )
            {
                layoutColumn = $(data.layoutColumn);
                var colWidth = layoutColumn.outerWidth();
                var colData = getClientRect(layoutColumn[0]);
                
                var infoBoxLeft = (colData.left - elData.left) + colData.width * ((1.0 - (data.infoBoxWidth * 0.01)) * 0.5);
                var infoBoxHeight = (bodyData.height * 0.01) * data.infoBoxHeight;
                var bracketInsetVertical = (bodyData.height * 0.01) * data.bracketInsetVertical; 
                
                if( data.infoPositioning === 'above') {
                    infoBox
                        .style('left', infoBoxLeft + 'px')
                        .style('top', -(infoBoxHeight + ( bracketInsetVertical + connectorOffset(data)) ) + 'px')
                        .style('width', colData.width * (data.infoBoxWidth * 0.01) + 'px' ); 
                    
                } else {
                    infoBox
                        .style('left', infoBoxLeft + 'px')
                        .style('top', elData.height + ( bracketInsetVertical + connectorOffset(data)) + 'px')
                        .style('width', colData.width * (data.infoBoxWidth * 0.01) + 'px' );
                } 
            }

            return infoBox;
        };
        
        
        const viewportInfo = function() {
            
            /** Returns an object
             * w: 1% of body pixel width;
             * h: 1% of body pixel height;
             */
            
             var bodyWidth = bodyElement.outerWidth();
             var bodyHeight = bodyElement.outerHeight();
             var bodyWidthPc = bodyWidth * 0.01;
             var bodyHeightPc = bodyHeight * 0.01;
                     
             return { 'w' : bodyWidthPc, 'h' : bodyHeightPc };
        };
        
        
        const positionInfoBox = function(anno) {
            
            var vp = viewportInfo();
            var layoutColumn = $(anno.data.layoutColumn);
            var colWidth = layoutColumn.outerWidth();
            var colWidthPc = colWidth * 0.01;
            var colBorderPc = (100 - anno.data.infoBoxWidth) * 0.5;
            var oLeft = 0;
            var oRight = 0; 
            var targetElement;
            var left;
            var top;
            var offset;
            
            // Calculate the left/right offsets, if set
            if( $.type(anno.data.infoBoxOffsetLeft) === 'number' ) {
                oLeft = vp.w * anno.data.infoBoxOffsetLeft;
            }
            
            if( $.type(anno.data.infoBoxOffsetRight) === 'number' ) {
                oRight = vp.w * anno.data.infoBoxOffsetRight;
            }
            
            var infoBoxWidth = $(anno.infoBox.node()).outerWidth();
            var infoBoxHeight = $(anno.infoBox.node()).outerHeight();

            if( (anno.data.connector.type === 'disc' || anno.data.connector.type === 'arrow') ) {
                
                switch(anno.data.infoPositioning) {
                    case 'above':
                        top = ($(anno.selection.target.node()).offset().top - infoBoxHeight) - (anno.data.connectorOffset * vp.h);
                        anno.infoBox.style('left',( ((layoutColumn.offset().left + (colWidthPc * colBorderPc)) - oLeft) + oRight ) + 'px').style('top', top + 'px');
                        break;
                        
                    case 'left':
                        targetElement = anno.selection.element.getBoundingClientRect();
                        left = ( targetElement.left - infoBoxWidth );
                        top = ( (targetElement.top + (targetElement.height * 0.5) ) - (infoBoxHeight * 0.5));
                        offset = anno.data.connectorOffset * vp.w;
                        anno.infoBox.style('left', (left - offset) + 'px').style('top', top + 'px');
                        break;
                        
                    case 'right':
                        targetElement = anno.selection.element.getBoundingClientRect();
                        left = ( targetElement.right );
                        top = ( (targetElement.top + (targetElement.height * 0.5) ) - (infoBoxHeight * 0.5));
                        offset = anno.data.connectorOffset * vp.w;
                        anno.infoBox.style('left', (left + offset) + 'px').style('top', top + 'px');
                        break;

                    //case 'below':
                    default:
                        top = ($(anno.selection.target.node()).offset().top + $(anno.selection.target.node()).outerHeight()) + (anno.data.connectorOffset * vp.h);
                        anno.infoBox.style('left',( ((layoutColumn.offset().left + (colWidthPc * colBorderPc)) - oLeft) + oRight ) + 'px').style('top', top + 'px');
                }
            }

            if( anno.data.connector.type === 'brackets') {
                if( anno.data.infoPositioning === 'below' ) {
                    
                    // BRACKETS BELOW
                    anno.infoBox.style('left', ( layoutColumn.offset().left + (colWidthPc * colBorderPc) ) + 'px').style('top', anno.selection.anchor.y + 'px');
                    
                }
                else if( anno.data.infoPositioning === 'above' ) {
                    
                    // BRACKETS ABOVE
                    anno.infoBox.style('left', ( layoutColumn.offset().left + (colWidthPc * colBorderPc) ) + 'px').style('top', (anno.selection.anchor.y - infoBoxHeight ) + 'px');
                }
            }
        };
        

        const getConnectorSVG = function(targetEl) {
            
            // Get or create the node
            var svgNode = targetEl.select('.connector-svg');
            if( svgNode.empty() ) { svgNode = targetEl.append('svg').attr('class','connector-svg'); }    

            // Ensure an SVG has its WIDTH and HEIGHT values set to match parents w x h (or 1, for either dim if its zero)
            var targetRect = getClientRect( targetEl );
            svgNode.attr( 'width', targetRect.width || 1 ).attr( 'height', targetRect.height || 1 );  
            
            return svgNode;
        };
        
        
        const createConnectorBracket = function( target, annoData, elData ) {
            
            /**
             * Creates the SVG bracket and selection lines / elements, from the item discussed, to the infoBox
             * 
             */

            var width = elData.width,
            h = elData.height,
            bHP = bodyData.height * 0.01,
            eWP = width * 0.01,
            xL = 0 + eWP * annoData.connector.bracketInsetLeft,
            xR = width - eWP * annoData.connector.bracketInsetRight,
            insetVertical = bHP * annoData.connector.bracketInsetVertical,
            anchor = { x:0, y:0 },
            stalkX,
            stalkY;
            
            
            // Get or Create SVG node
            var svg = getConnectorSVG(target);   
            
            var svgGroup = svg.select('.connector-group');
            if( svgGroup.empty() ) { svgGroup = svg.append('g').attr('class','connector-group'); }
            
            
            var svgCRect = svg.node().getBoundingClientRect();

            var bracketLineHoriztonal = svgGroup.select('.bracket.line.horizontal');
            if( bracketLineHoriztonal.empty() ) { bracketLineHoriztonal = svgGroup.append('line').attr('class', 'bracket line horizontal'); }
            
            var bracketLineLeft = svgGroup.select('.bracket.line.left');
            if( bracketLineLeft.empty() ) { bracketLineLeft = svgGroup.append('line').attr('class', 'bracket line left'); }
            
            var bracketLineRight = svgGroup.select('.bracket.line.right');
            if( bracketLineRight.empty() ){ bracketLineRight = svgGroup.append('line').attr('class', 'bracket line right'); }
            
            var bracketLineStalk = svgGroup.select('.bracket.line.stalk');
            if( bracketLineStalk.empty() ){ bracketLineStalk = svgGroup.append('line').attr('class', 'bracket line stalk'); }
            
            
            if( annoData.infoPositioning === 'above')
            {
                // Create a bracket ABOVE the target
                bracketLineHoriztonal
                    .attr('x1', xL)
                    .attr('y1', -insetVertical)
                    .attr('x2', xR)
                    .attr('y2', -insetVertical);
                
                bracketLineLeft
                    .attr('x1', xL)
                    .attr('y1', -insetVertical)
                    .attr('x2', xL)
                    .attr('y2', -insetVertical + (bHP * 5) );
                
                bracketLineRight
                    .attr('x1', xR)
                    .attr('y1', -insetVertical)
                    .attr('x2', xR)
                    .attr('y2', -insetVertical + (bHP * 5) );
                
                bracketLineStalk
                    .attr('x1', width * 0.5)
                    .attr('x2', width * 0.5)
                    .attr('y1', -(insetVertical + (connectorOffset(annoData))) )
                    .attr('y2', -insetVertical);
                
                
                // Pass an Anchor, a pixel coord, where the brackets stalk starts from
                stalkX = svgCRect.x + (width * 0.5);
                stalkY = svgCRect.y + -(insetVertical + (connectorOffset(annoData)));
                
                anchor = { x: stalkX, y: stalkY }; 
            }
            else
            {
                // Create a bracket BELOW the target
                var baseLine = elData.visibleHeight + insetVertical;
                
                bracketLineHoriztonal
                .attr('x1', xL)
                .attr('y1', baseLine )
                .attr('x2', xR)
                .attr('y2', baseLine );
            
                bracketLineLeft
                    .attr('x1',xL)
                    .attr('y1', baseLine )
                    .attr('x2',xL)
                    .attr('y2', baseLine - (bHP * 5) );
                
                bracketLineRight
                    .attr('x1',xR)
                    .attr('y1', baseLine )
                    .attr('x2',xR)
                    .attr('y2', baseLine - (bHP * 5) );
                
                bracketLineStalk
                    .attr('x1',width * 0.5)
                    .attr('x2',width * 0.5)
                    .attr('y1', baseLine )
                    .attr('y2', baseLine + connectorOffset(annoData) );

                // Pass an Anchor, a pixel coord, where the brackets stalk starts from
                stalkX = svgCRect.x + (width * 0.5);
                stalkY = svgCRect.y + (baseLine + connectorOffset(annoData));

                anchor = { x: stalkX, y: stalkY };
            }
            
            return { 
                anchor: anchor,
                element: svg.node(),
                target: target
            };
        };
        
        
        const createLPath = function( svg, start, end, radius ) {   
            
            /**
             * Creates an SVG Path element, with an L shape, and rounded corner
             * svg: The svg element this path is to be drawn within
             * start: The start point of the line {x,y}
             * end: The end point {x,y}
             * radius: The radius of the curved corner, as a % of the shortest line
             */
            
            if( $.type(radius) !== 'number' ) {
                radius = 10; // Set a default value for the line corner radius
            }
            
            var svgGeo = svg.getBoundingClientRect(); //  Get the client rect object for the containing SVG element
            var l = { h:  end.x - start.x , v: end.y - start.y }; // Get the initial Horizontal +  Vertical line lengths
            var la = {h:0,v:0};
            var rad = (Math.min(l.v,l.h) * 0.01) * radius; // Calculate the corner radius as a % of the shortest H/V line
            var aRad = Math.abs(rad); 
            var rMag = aRad * 0.75;
            
            // Calculate the Horizontal line length, minus corner radius
            if(l.h < 0) { 
                la.h = l.h + aRad;
            } else {
                la.h = (l.h - aRad);
            }
            
            // Calculate the Vertical line length, minus the corner radius
            if(l.v < 0) {
                la.v = l.v + aRad; 
            } else {
                la.v = l.v - aRad;
            }
            
            var ePointX, ePointY, sVectX, sVectY, eVectX, eVectY, c;
            
            if( start.y > end.y ) {
                if( start.x > end.x ) {
                    
                    // BELOW & RIGHT OF
                    ePointX = -aRad;
                    ePointY = -aRad;
                    sVectX = 0;
                    sVectY = -rMag;
                    eVectX = ePointX + rMag;
                    eVectY = ePointY;
                    
                    c = sVectX + ' ' + sVectY + '   ' + eVectX + ' ' + eVectY + '   ' + ePointX + ' ' + ePointY;
                    return 'd', 'M ' + (start.x - svgGeo.left) + ' ' + (start.y - svgGeo.top) + ' v' + la.v + ' c ' + c + ' h ' + la.h;
                    
                } else {
                    
                    // BELOW & LEFT OF
                    ePointX = aRad;
                    ePointY = -aRad;
                    sVectX = 0;
                    sVectY = -rMag;
                    eVectX = ePointX - rMag;
                    eVectY = ePointY;
                    
                    c = sVectX + ' ' + sVectY + '   ' + eVectX + ' ' + eVectY + '   ' + ePointX + ' ' + ePointY;
                    return 'd', 'M ' + (start.x - svgGeo.left) + ' ' + (start.y - svgGeo.top) + ' v' + la.v + ' c ' + c + ' h ' + la.h;
                }
                
            } else {
                
                if( start.x > end.x ) {
                    
                    // ABOVE & RIGHT OF
                    ePointX = -aRad;
                    ePointY = aRad;
                    sVectX = 0;
                    sVectY = rMag;
                    eVectX = ePointX + rMag;
                    eVectY = ePointY;
                    
                    c = sVectX + ' ' + sVectY + '   ' + eVectX + ' ' + eVectY + '   ' + ePointX + ' ' + ePointY;
                    return 'd', 'M ' + (start.x - svgGeo.left) + ' ' + (start.y - svgGeo.top) + ' v' + la.v + ' c ' + c + ' h ' + la.h;
                    
                } else {
                    
                    // ABOVE & LEFT OF
                    ePointX = aRad;
                    ePointY = aRad;
                    sVectX = 0;
                    sVectY = rMag;
                    eVectX = ePointX - rMag;
                    eVectY = ePointY;
                    
                    c = sVectX + ' ' + sVectY + '   ' + eVectX + ' ' + eVectY + '   ' + ePointX + ' ' + ePointY;
                    return 'd', 'M ' + (start.x - svgGeo.left) + ' ' + (start.y - svgGeo.top) + ' v' + la.v + ' c ' + c + ' h ' + la.h;
                }
            }  
        };
        
        
        const createConnectorDisc = function( target, annoData, elData)  {
            
            /**
             * Creates the SVG Disc and selection lines, from the item discussed, to the infoBox
             * 
             * connectorPositioning: [center, top-edge, right-edge, bottom-edge, left-edge, top-of, right-of, bottom-of, left-of] - position of the selection relative to the target. default center
             * lineDirection: [up, right, down, left] - the initial vector along which the selection line is draw, will bend back to infoBox
             */

            var vp = viewportInfo();
            var discRad = vp.w * 0.2;
            var width = elData.width;
            var height = elData.height;
            
            var svg = getConnectorSVG(target);

            var svgGroup = svg.select('.connector-group');
            if( svgGroup.empty() ) { svgGroup = svg.append('g').attr('class','connector-group'); }
            
            // Aquire / Create disc
            var disc = svgGroup.select( '#disc_select_circle_' + annoData.id );
            if( disc.empty() ) {
                disc = svgGroup
                    .append('circle')
                    .attr('id','disc_select_circle_' + annoData.id )
                    .attr('class','disc')
                    .attr('r', discRad);
            }
                          
            var anchor = { x:0, y:0 };

            // DISC
            switch(annoData.connector.connectorPositioning) {
                
                case 'top-edge':
                    anchor = { x: width * 0.5, y: 0 };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
                    break;
                    
                case 'bottom-edge':
                    anchor = { x: width * 0.5, y: height };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
                    break;
                  
                case 'left-edge':
                    anchor = { x: 0, y: height * 0.5 };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
                    break;
                    
                case 'right-edge':
                    anchor = { x: width, y: height * 0.5 };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
                    break;
 
                    
                    
                case 'top-of':
                    anchor = { x: width * 0.5, y: -(discRad * 1.6) };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
                    break;
                
                case 'bottom-of':
                    anchor = { x: width * 0.5, y: height + (discRad * 1.6) };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
                    break;
                   
                case 'left-of':
                    anchor = { x: -(discRad * 1.6), y: height * 0.5 };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
                    break;
                    
                case 'right-of':
                    anchor = { x: width + (discRad * 1.6), y: height * 0.5 };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
                    break;


                case '25pc-left':
                    anchor = { x: width * 0.25, y: height * 0.5 };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
                    break;
                    
                    
                case '25pc-right':
                    anchor = { x: width * 0.75, y: height * 0.5 };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
                    break;

                case '25pc-up':
                    anchor = { x: width * 0.5, y: height * 0.25 };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
                    break;
                                        
                case '25pc-down':
                    anchor = { x: width * 0.5, y: height * 0.75 };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
                    break;

                default:
                case 'center':
                    anchor = { x: width * 0.5, y: height * 0.5 };
                    disc.attr('cx', anchor.x).attr('cy', anchor.y);
            }
            
            var dGeo = getClientRect( disc.node() );
            var ibGeo = getClientRect( $('#anno_infobox_' + annoData.id) );
            var dCenter, ibCenter, vDist, hDist;

            // Aquire / Create path / line
            var annoLine = svgGroup.select('#disc_select_line_' + annoData.id);

            // Create either a connector PATH or a LINE
            switch(annoData.infoPositioning)
            {
                case 'above':
                case 'below':
                    if( annoLine.empty() ) {  annoLine = svgGroup.insert('path',':first-child'); } // Line will need to bend, so we use a PATH
                    break;
                    
                case 'left':
                case 'right':
                    if( annoLine.empty() ) { annoLine = svgGroup.insert('line',':first-child'); } //  A straight LINE, left-right will do
                    break;
            }    
            
            annoLine
                .attr('id','disc_select_line_' + annoData.id )
                .attr('class','disc-connector-line')
                .style('fill','none');
            
            var lPath;
                        
            // Set the PATH contents or LINE position
            switch(annoData.infoPositioning) {
                case 'above':
                    
                    dCenter = { x: dGeo.left + dGeo.width * 0.5, y: dGeo.top + dGeo.height * 0.5 };
                    ibCenter = { x: ibGeo.left + ibGeo.width * 0.5, y: ibGeo.top + ibGeo.height * 0.5 };
                    vDist = ibGeo.top - (dGeo.top + dGeo.height * 0.5);
                    hDist = ibGeo.left - (dGeo.left + dGeo.width * 0.5);

                    // Is the infoBox to the right or left of the Disc center
                    if( dCenter.x > ibGeo.left && dCenter.x < ibGeo.right ) {
                        
                        // Disc BELOW infoBox
                        vDist = ibGeo.bottom - dCenter.y;
                        annoLine.attr('d', 'M' + anchor.x + ' ' + anchor.y + ' v' + vDist ).style('fill','none');  
                    }
                    else
                    {
                        vDist = ibCenter.y - dCenter.y;
                        if( dCenter.x < ibGeo.left ) {
                            
                            // Disc BELOW and to LEFT of infoBox
                            lPath = createLPath( svg.node(), dCenter, { x: ibGeo.left, y: (ibGeo.top + ibGeo.height * 0.5)}, 20 );
                            annoLine.attr('d', lPath);
                        }
                        else
                        {
                            // Disc BELOW and to RIGHT of infoBox
                            lPath = createLPath( svg.node(), dCenter, { x: ibGeo.right, y: (ibGeo.top + ibGeo.height * 0.5)}, 20 );
                            annoLine.attr('d', lPath).style('fill','none');
                        } 
                    }
                    break;

                case 'below':

                    dCenter = { x: dGeo.left + dGeo.width * 0.5, y: dGeo.top + dGeo.height * 0.5 };
                    ibCenter = { x: ibGeo.left + ibGeo.width * 0.5, y: ibGeo.top + ibGeo.height * 0.5 };
                    vDist = ibGeo.top - (dGeo.top + dGeo.height * 0.5);
                    hDist = ibGeo.left - (dGeo.left + dGeo.width * 0.5);

                    // Is the infoBox to the right or left of the Disc center
                    if( dCenter.x > ibGeo.left && dCenter.x < ibGeo.right ) {
                        
                        // Disc ABOVE of infoBox
                        vDist = ibGeo.top - dCenter.y;
                        annoLine.attr('d', 'M' + anchor.x + ' ' + anchor.y + ' v' + vDist );
                    }
                    else
                    {
                        vDist =  ibCenter.y - dCenter.y;
                        if( dCenter.x < ibGeo.left ) {
                            // Disc BELOW and to LEFT of infoBox
                            lPath = createLPath( svg.node(), dCenter, { x: ibGeo.left, y: (ibGeo.top + ibGeo.height * 0.5)}, 20 );
                            annoLine.attr('d', lPath );
                        }
                        else
                        {
                            // Disc BELOW and to RIGHT of infoBox
                            lPath = createLPath( svg.node(), dCenter, { x: ibGeo.right, y: (ibGeo.top + ibGeo.height * 0.5)}, 20 );
                            annoLine.attr('d', lPath );
                        } 
                    }
                    break;
                    
                case 'left':
                    annoLine
                        .attr('x1', anchor.x)
                        .attr('y1', anchor.y)
                        .attr('x2', (anchor.x - (annoData.connectorOffset * vp.w)) - discRad )
                        .attr('y2', anchor.y);
                    break;
                    
                case 'right':
                    annoLine
                        .attr('x1', anchor.x)
                        .attr('y1', anchor.y)
                        .attr('x2', (anchor.x + (annoData.connectorOffset * vp.w)) + discRad )
                        .attr('y2', anchor.y);
                    break; 
            }
       
            var alo = disc.node().getBoundingClientRect();
            
            return { 
                anchor: { x: alo.left, y: alo.top  },
                element: disc.node(),
                target: target
            };
        };
        
        
        
        const createConnectorArrow = function( target, annoData, elData)  {
            
            /**
             * Creates the SVG Arrow and selection lines, from the item discussed, to the infoBox
             * 
             * connectorPositioning: [above, below, left, right] - position of the selection relative to the target. default center
             * lineDirection: [up, right, down, left] - the initial vector along which the selection line is draw, will bend back to infoBox
             */

            var vp = viewportInfo();
            var arrowSize = vp.w * 0.6;
            var width = elData.width;
            var height = elData.height;
            var anchor = { x:0, y:0 };
            
            var svg = getConnectorSVG(target);

            var svgGroup = svg.select('.connector-group');
            if( svgGroup.empty() ) { svgGroup = svg.append('g').attr('class','connector-group'); }
            
            // Aquire Arrow
            var arrow = svgGroup.select( '#arrow_select_polygon_' + annoData.id );         
            if( arrow.empty() ) {
                arrow = svgGroup
                    .append('polygon')
                    .attr('id','arrow_select_polygon_' + annoData.id )
                    .attr('class','arrow');
            }

            // Update Arrow
            switch(annoData.connector.connectorPositioning) {
                
                case 'above':
                    arrow
                        .attr('points','0,0 ' + (arrowSize) + ',0  ' + (arrowSize * 0.5) + ',' + arrowSize)
                        .attr('transform','translate(' + (-(arrowSize * 0.5) + (width * 0.5)) + ',' + -(arrowSize * 1.0) + ')');
                    
                    anchor = { x: width * 0.5, y: -arrowSize };
                    break;
                    
                case 'left':
                    arrow
                        .attr('points', '0,0 ' + (arrowSize) + ',' + (arrowSize * 0.5) + ' 0,' + arrowSize)
                        .attr('transform','translate(' + (-arrowSize * 1.2) + ', ' + ((height * 0.5) - (arrowSize * 0.5)) + ')');
                
                    anchor = { x: (-arrowSize * 1.2), y: height * 0.5 };
                    break;
                    
                case 'right':
                    arrow
                        .attr('points', arrowSize + ',0 0,' + (arrowSize * 0.5) + ' ' + arrowSize + ',' + arrowSize)
                        .attr('transform','translate(' + (width * 1.2) + ', ' + ((height * 0.5) - (arrowSize * 0.5)) + ')');
                
                    anchor = { x: ((width * 1.2) + (arrowSize)), y: height * 0.5 };
                    break;
                    
                default:
                case 'below':
                    arrow
                        .attr('points', '0,' + (arrowSize) + ' ' + (arrowSize) + ',' + (arrowSize) + ' ' + (arrowSize * 0.5) + ',0')
                        .attr('transform','translate(' + (width * -0.5) + ',' + (height * 1.2) + ')');
                    
                    anchor = { x: width * 0.5, y: (height * 1.2) + arrowSize  };
                    break;
            }
            
            var dGeo = getClientRect( arrow.node() );
            var ibGeo = getClientRect( $('#anno_infobox_' + annoData.id) );
            var dCenter, ibCenter, vDist, hDist;

            // Aquire / Create path / line
            var annoLine = svgGroup.select('#arrow_select_line_' + annoData.id);

            // Create either a connector PATH or a LINE
            switch(annoData.infoPositioning)
            {
                case 'above':
                case 'below':
                    if( annoLine.empty() ) {  annoLine = svgGroup.insert('path',':first-child'); } // Line will need to bend, so we use a PATH
                    break;
                    
                case 'left':
                case 'right':
                    if( annoLine.empty() ) { annoLine = svgGroup.insert('line',':first-child'); } //  A straight LINE, left-right will do
                    break;
            }    
            
            annoLine
                .attr('id','arrow_select_line_' + annoData.id )
                .attr('class','arrow-connector-line')
                .style('fill','none');
            
            var lPath;
                        
            // Set the PATH contents or LINE position
            switch(annoData.infoPositioning) {
                case 'above':
                    
                    dCenter = { x: dGeo.left + dGeo.width * 0.5, y: dGeo.top + dGeo.height * 0.5 };
                    ibCenter = { x: ibGeo.left + ibGeo.width * 0.5, y: ibGeo.top + ibGeo.height * 0.5 };
                    vDist = ibGeo.top - (dGeo.top + dGeo.height * 0.5);
                    hDist = ibGeo.left - (dGeo.left + dGeo.width * 0.5);

                    // Is the infoBox to the right or left of the Arrow center
                    if( dCenter.x > ibGeo.left && dCenter.x < ibGeo.right ) {
                        
                        // Arrow BELOW infoBox
                        vDist = ibGeo.bottom - dCenter.y;
                        annoLine.attr('d', 'M' + anchor.x + ' ' + anchor.y + ' v' + vDist ).style('fill','none');  
                    }
                    else
                    {
                        vDist = ibCenter.y - dCenter.y;
                        if( dCenter.x < ibGeo.left ) {
                            
                            // Arrow BELOW and to LEFT of infoBox
                            lPath = createLPath( svg.node(), dCenter, { x: ibGeo.left, y: (ibGeo.top + ibGeo.height * 0.5)}, 20 );
                            annoLine.attr('d', lPath);
                        }
                        else
                        {
                            // Arrow BELOW and to RIGHT of infoBox
                            lPath = createLPath( svg.node(), dCenter, { x: ibGeo.right, y: (ibGeo.top + ibGeo.height * 0.5)}, 20 );
                            annoLine.attr('d', lPath).style('fill','none');
                        } 
                    }
                    break;

                case 'below':

                    dCenter = { x: dGeo.left + dGeo.width * 0.5, y: dGeo.top + dGeo.height * 0.5 };
                    ibCenter = { x: ibGeo.left + ibGeo.width * 0.5, y: ibGeo.top + ibGeo.height * 0.5 };
                    vDist = ibGeo.top - (dGeo.top + dGeo.height * 0.5);
                    hDist = ibGeo.left - (dGeo.left + dGeo.width * 0.5);

                    // Is the infoBox to the right or left of the Arrow center
                    if( dCenter.x > ibGeo.left && dCenter.x < ibGeo.right ) {
                        
                        // Arrow ABOVE of infoBox
                        vDist = ibGeo.top - dCenter.y;
                        annoLine.attr('d', 'M' + anchor.x + ' ' + anchor.y + ' v' + vDist );
                    }
                    else
                    {
                        vDist =  ibCenter.y - dCenter.y;
                        if( dCenter.x < ibGeo.left ) {
                            // Arrow BELOW and to LEFT of infoBox
                            lPath = createLPath( svg.node(), dCenter, { x: ibGeo.left, y: (ibGeo.top + ibGeo.height * 0.5)}, 20 );
                            annoLine.attr('d', lPath );
                        }
                        else
                        {
                            // Arrow BELOW and to RIGHT of infoBox
                            lPath = createLPath( svg.node(), dCenter, { x: ibGeo.right, y: (ibGeo.top + ibGeo.height * 0.5)}, 20 );
                            annoLine.attr('d', lPath );
                        } 
                    }
                    break;
                    
                case 'left':
                    annoLine
                        .attr('x1', anchor.x)
                        .attr('y1', anchor.y)
                        .attr('x2', (anchor.x - (annoData.connectorOffset * vp.w)) - arrowSize )
                        .attr('y2', anchor.y);
                    break;
                    
                case 'right':
                    annoLine
                        .attr('x1', anchor.x)
                        .attr('y1', anchor.y)
                        .attr('x2', (anchor.x + (annoData.connectorOffset * vp.w)) + arrowSize )
                        .attr('y2', anchor.y);
                    break; 
            }
       
            var alo = arrow.node().getBoundingClientRect();
            
            return { 
                anchor: { x: alo.left, y: alo.top  },
                element: arrow.node(),
                target: target
            };
        };
        
        
        
        const annotationElementMoved = function(id) {
            
            /**
             * Checks if the annotation element has moved
             * Returns TRUE if it has, FALSE if not.
             */
          
          var o = annotations[id];
            
          if( $.type( o.annotationClientRect ) !== 'object' ) {
              // No client rect stored, so this must be first draw
              o.annotationClientRect = getClientRect( o.annotationElement );
              return true; 
          }
          
          var newClientRect = getClientRect( o.annotationElement );
          
          var changed = false;
          $.each(newClientRect, function(i,d) {

              var old_d = Math.ceil(o.annotationClientRect[i]);
              var new_d = Math.ceil(d);
              
              if( new_d !== old_d ) { 
                  changed = true;
                  return true;
              }
          });
          
          return changed;       
        };

        
        const elementIsInDOM = function(el) {
            return document.body.contains(el);
        };

        
        createAnnotation = function( aElement, id ) {

            /**
             * We can create an Annotation given either a...
             * aElement: ~ Element reference
             * id: ~ ID to reference an element from the annotations array
             */
            
            if( ($.type(aElement) !== 'object' || $.type(aElement.nodeName) !== 'string') && ($.type(id) !== 'string' || id.length === 0) ) {
                return; // QUIT, if we have no Element, OR an ID to work with. NULL element + and ID is ok, but not both undefined
            }
            
            var data;
            
            if( $.type(aElement) === 'object' && $.type(aElement.nodeName) === 'string' )
            {
                // Use the existing passed anchor element
                
                var dataString = $(aElement).attr('data-help-annotation');
                data = JSON.parse( decodeURI(dataString) );
                id = data.id;
            }
            else if( $.type(id) === 'string' && id.length !== 0)
            {
                // Aquire the element from existing annotations
                
                var o = annotations[id];
                if( $.type(o) === 'object' ) {

                    data = o.data;

                    /**
                    * Check if the previous Annotation element instance is still attached to the Document
                    * If not, its probably been .removed() via d3, re-aquire....
                    */ 
                    if( elementIsInDOM(o.annotationElement) ) {
                        aElement = o.annotationElement;
                    }
                    else
                    {
                        aElement = $(data.targetCssSelector).get(0);
                    }
                }
            }
            else
            {
                return; // QUIT
            }
            // -----------------------------------------------
            
            
            var $el = $(aElement);
            data.muted = false;
            
            // Check if target element should be MUTED on creation
            if( $.type(data.mute_on_init_selector) === 'string' && $.type(data.mute_on_init_criteria) === 'string' ) {
                
                var $mEl = $(data.mute_on_init_selector);
                
                if( $mEl.length && data.mute_on_init_criteria === 'empty') {
                    if( $mEl.children().length === 0 ) {
                        data.muted = true;
                    }
                }
                
                if( $mEl.length &&data.mute_on_init_criteria === 'visible'){
                    data.muted = $mEl.is(':visible');
                }
            }
            
            if(data.muted) {
                window._log.warn("Element '" + data.connectoror_string + "' is muted");
            }
            
            //Create an object for this annotation
            if( $.type( annotations[id] ) !== 'object' ) {
                annotations[id] = {};
                annotations[id].id = id;
                annotations[id].annotationElement = aElement;
                annotations[id].data = data;
            }
            
            // If this is first draw, or annotation element has moved, proceed....
            if( annotationElementMoved(id) === false ) {
                return; // QUIT
            }

            
            const mutationCallback = function() { 
                createAnnotation(aElement, id);   
            };

            
            if( $.type(aElement.mutationObserverCallback) !== 'function' ) {
                
                // Remove Update Callback from target element
                //delete aElement.mutationObserverCallback;

                // Apply Update Callback for when mutation occurs
                aElement.mutationObserverCallback = mutationCallback;
                
                // Observe Mutations on the target
                mutationObserver.observe(aElement, mutationConfig );
            }

            // Observe Mutations on the observeList (the target may never mutate, but its parents may, etc)
            if( $.type(annotations[id].data.observeList) === 'array' ) {
                annotations[id].data.observeList.forEach( function( elSelector, i) {
                    
                    var obsEl = $(elSelector).get(0);
                    if( $.type(obsEl) === 'object' ){
                        
                        if( $.type(obsEl.mutationObserverCallback) !== 'function' ) {
                            //delete obsEl.mutationObserverCallback;
                            obsEl.mutationObserverCallback = mutationCallback;
                            mutationObserver.observe(obsEl, mutationConfig );
                        }
                    }  
                });
            }
            
            // --- Create the Annotation ---
            var elGeo = getClientRect($el);
            
            // Draw annotation TARGET
            annotations[id].target = createTarget(  data, id, aElement );            
            
            // Create the infoBox element, where the explanation is shown
            annotations[id].infoBox = createInfoBox( data, annotations[id].target );

            // Draw selection
            if( data.connector.type === 'brackets' ) {
                annotations[id].selection = createConnectorBracket( annotations[id].target, data, elGeo);
            }
            else if ( data.connector.type === 'disc' ) {
                annotations[id].selection = createConnectorDisc( annotations[id].target, data, elGeo);
            }
            else if ( data.connector.type === 'arrow' ) {
                annotations[id].selection = createConnectorArrow( annotations[id].target, data, elGeo );
            }

            positionInfoBox(annotations[id]);
            
            // Draw selection
            if( data.connector.type === 'brackets' ) {
                annotations[id].selection = createConnectorBracket( annotations[id].target, data, elGeo );
            }
            else if ( data.connector.type === 'disc' ) {
                annotations[id].selection = createConnectorDisc( annotations[id].target, data, elGeo );
            }
            else if ( data.connector.type === 'arrow' ) {
                annotations[id].selection = createConnectorArrow( annotations[id].target, data, elGeo );
            }
        };
        
        
        const annotationDataElements = function() { 
            return $('body [data-help-annotation]');
        };

        
        const createAnnotations = function() {   
            
            /**
             * Creates Connector elements and info
             * 
             * connector: [brackets,disc,arrow]- The type of selection to be drawn from the element, to the infoBox
             * 
             */

            window._log.debug('help.createAnnotations()');
            
            // Update Annotations when annoElements move via attr changes
            createMutationObserver();

            // Update ALL Annotations when window Resizes
            //window.onresize = resizeCallback;  
            
            annotationDataElements().each( function(i,e) { 
                createAnnotation(e);   
            }.bind(this) ) 
            
        };
        

        const setDisplaySetsFocusShield = function() {
            
            // Create the shield group
            if( $('#help_system_focus_shield_group').length === 0 ) {
                
                focusSheildGroup = d3.select('#help_system_group')
                    .append('div')
                    .attr('id','help_system_focus_shield_group')
                    .attr('class','focus-shield-group');
            }
            
            // Create the shield elements
            if( $.type(focusSheildGroup.node()) === 'object' && focusSheildEl_TL === null ) {
                
                focusSheildEl_TL = focusSheildGroup
                    .append('div')
                    .attr('id','focus_shield_el_tl')
                    .attr('class','focus-shield-el tl');
                
                focusSheildEl_TM = focusSheildGroup
                    .append('div')
                    .attr('id','focus_shield_el_tm')
                    .attr('class','focus-shield-el tm');
                
                focusSheildEl_TR = focusSheildGroup
                    .append('div')
                    .attr('id','focus_shield_el_tr')
                    .attr('class','focus-shield-el tr');
                
                focusSheildEl_ML = focusSheildGroup
                    .append('div')
                    .attr('id','focus_shield_el_ml')
                    .attr('class','focus-shield-el ml');
                
                focusSheildEl_MR = focusSheildGroup
                    .append('div')
                    .attr('id','focus_shield_el_mr')
                    .attr('class','focus-shield-el mr');
                
                focusSheildEl_BL = focusSheildGroup
                    .append('div')
                    .attr('id','focus_shield_el_bl')
                    .attr('class','focus-shield-el bl');
                
                focusSheildEl_BM = focusSheildGroup
                    .append('div')
                    .attr('id','focus_shield_el_bm')
                    .attr('class','focus-shield-el bm');
                
                focusSheildEl_BR = focusSheildGroup
                    .append('div')
                    .attr('id','focus_shield_el_br')
                    .attr('class','focus-shield-el br');
            }

            // Set positions of shields, based on current set index
            if( $.type(annotationSets) === 'array' && $.type(focusSheildEl_TL.node()) === 'object' ) {
                
                var focus = annotationSets[displaySetsIndex].focusArea;
                
                focusSheildEl_TL
                    .style('left', '0%' )
                    .style('top', '0%' )
                    .style('width', focus.x + '%' )
                    .style('height', focus.y + '%' );
                
                focusSheildEl_TM
                    .style('left', focus.x + '%' )
                    .style('top', '0%' )
                    .style('width', focus.width + '%' )
                    .style('height', focus.y + '%' );
                
                focusSheildEl_TR
                    .style('left', (focus.x + focus.width) + '%' )
                    .style('top', '0%' )
                    .style('width', 100 - (focus.x + focus.width) + '%' )
                    .style('height', focus.y + '%' );
                
                
                focusSheildEl_ML
                    .style('left', '0%' )
                    .style('top', focus.y + '%' )
                    .style('width', focus.x + '%' )
                    .style('height', focus.height + '%' );

                focusSheildEl_MR
                    .style('left', (focus.x + focus.width) + '%' )
                    .style('top', focus.y + '%' )
                    .style('width', 100 - (focus.x + focus.width) + '%' )
                    .style('height', focus.height + '%' );
                
                
                focusSheildEl_BL
                    .style('left', '0%' )
                    .style('top', (focus.y + focus.height) + '%' )
                    .style('width', focus.x + '%' )
                    .style('height', 100 - (focus.y + focus.height) + '%' );
            
                focusSheildEl_BM
                    .style('left', focus.x + '%' )
                    .style('top', (focus.y + focus.height) + '%' )
                    .style('width', focus.width + '%' )
                    .style('height', 100 - (focus.y + focus.height) + '%' );
                
                focusSheildEl_BR
                    .style('left', (focus.x + focus.width) + '%' )
                    .style('top', (focus.y + focus.height) + '%' )
                    .style('width', 100 - (focus.x + focus.width) + '%' )
                    .style('height', 100 - (focus.y + focus.height) + '%' );
            }
        }
        
        
        const setDisplaySetsVisibility = function() {

            if( $.type(displaySets) === 'array' && displaySets.length > 0 ) {
                
                displaySets.forEach(function(set, setIndex) {
                    
                    if( $.type(set.annotationIDs) === 'array' && set.annotationIDs.length > 0 ) {
                        
                        set.annotationIDs.forEach(function(setID, idIndex) {
                            
                            if( setIndex === displaySetsIndex ) {
                                $('#anno_infobox_' + setID).removeClass('help-init').removeClass('display-set-hidden');
                                $('#annotation_connector_' + setID).removeClass('help-init').removeClass('display-set-hidden');
                            }
                            else {
                                if(displaySetsIndex === 0) {
                                    $('#anno_infobox_' + setID).addClass('help-init').addClass('display-set-hidden');
                                    $('#annotation_connector_' + setID).addClass('help-init').addClass('display-set-hidden');
                                }
                                else {
                                    $('#anno_infobox_' + setID).removeClass('on-init-display-set-hidden').addClass('display-set-hidden');
                                    $('#annotation_connector_' + setID).removeClass('on-init-display-set-hidden').addClass('display-set-hidden');
                                }
                            }
                        });
                    }
                });
            }
        }
        
        
        help.displaySetNext = function() {
            if( displaySetsIndex < displaySets.length -1 ) {
                
                displaySetsIndex++;
                
                setDisplaySetsVisibility();
                setDisplaySetsFocusShield();
            }
            else {
                displaySetsIndex = 0;
                help.hide(true);
            }
        };
        
        
        help.displaySetPrevious = function() {
            if(displaySetsIndex > 0) {
                
                displaySetsIndex--;
                
                setDisplaySetsVisibility();
                setDisplaySetsFocusShield();
            }
        };

        
        help.show = function() {
            
            isVisible = true;
            
            createAnnotations();
            
            setDisplaySetsVisibility();
            setDisplaySetsFocusShield();
            
            helpButtonElement.addClass('displayed');
            $('body').addClass('help-displayed');
            
        };
        
        
        help.hide = function(force) {
            
            isVisible = false;
            
            if( $.type(force) !== 'boolean' || force === false ) {
                if( displayInSets && $.type(displaySets) === 'array' && displaySets.length > 0 && displaySetsIndex < displaySets.length -1 ) {
                    // If displaySets are activated, only HIDE when the user has clicked through to the end of all of the sets
                    
                    help.displaySetNext();
                    return;
                }
            }
            
            displaySetsIndex = 0;
            helpButtonElement.removeClass('displayed');
            $('body').removeClass('help-displayed');
        };
        
       
        
        return help;
    };
    

})(
        window,
        document,
        window.jQuery,
        window.d3,
        window.akdv.utils_lang.addLocalizedString,
        window.markdownit
        );