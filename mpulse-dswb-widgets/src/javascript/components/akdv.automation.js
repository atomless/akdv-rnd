;(function(window, document, $) {

    'use strict';
    
    window.akdv.automation = function(itemsArray){

        // Getable / Setable Properties
        var items = [];
        
        // Private properties
        var automationResults = [],
        stopProcessing = false,
        configErrorStr = 'CONFIG ERROR ~ ';
        
        // Setable Callbacks
        
        
        
        var automation = function(){
            if( $.type(itemsArray) === 'array' ) {
                items = itemsArray
            }
            else
            {
                throw "Automation requires an array of Automation config objects to initialize. Check your config.";
            }
        };
        automation();
        
        
        automation.onRejectHandler = function(re) {
            window._log.warn(re);
        };

        
        automation.onCompletionLogger = function(results) {

            window._log.info("------ Automation Results ------");
            
            results.forEach(function(res,index){
                
                if( typeof res === 'object' ) {
                    window._log.info("Result:" + index, res);
                }
                else
                {
                    window._log.info("Result:" + index+ " None");
                }
            });
        };
        
        
        automation.errorLog = function(prefix,index, typeName, reason) {
            if( typeof typeName === 'string' ){ 
                return prefix + "Automation:" + index + " ~ '" + typeName + "', " + reason;
            }
            else 
            {
                return prefix + "Automation:" + index + " ~ " + reason;
            }
        };
        
        
        automation.resolver = function(resolve,result) {
            automationResults.push(result);
            resolve(result);
        };
        
        
        automation.getAutomata = function(autoDef,index) {
            switch(autoDef.type) {

                case 'classIsPresentOnNodes':
                    return automation.classIsPresentOnNodes(autoDef,index);
                    
                case 'clickNode':
                    return automation.clickNode(autoDef,index);
                    
                case 'nodeInDOM':
                    return automation.nodeInDOM(autoDef,index);
            } 
        };
        
        
        automation.Process = function() {

            return new Promise( (resolve, reject) => {
                if( $.type(items) === 'array' && items.length ) {
                    
                    automationResults = [];
                    
                    var automata = Promise.resolve({});

                    items.forEach(function(autoDef,index) {

                        // THROW an error, if we cannot define an Automation at this stage
                        if( typeof autoDef !== 'object') { throw automation.errorLog(configErrorStr,index, null, "Definition is not an OBJECT. Cannot instantiate."); }
                        if( typeof autoDef.type !== 'string' ) { throw automation.errorLog(configErrorStr,index, null, "Has not specified its 'type' correctly. Should be a STRING, matching an existing Automation type."); }

                        
                        let newAutomata;
                        try {
                            newAutomata = automation.getAutomata(autoDef,index);
                        }
                        catch(error) {
                            throw(error);
                        }
                        
                        automata = automata.then( 
                          (re) => {
                              newAutomata.previousResult(re);
                              return new Promise( (resolve, reject) => newAutomata._Process(resolve, reject) );
                          }
                        )
                        .catch( (re) => { reject(re) } );
                        
                        window._log.info("Automation:" + index + " '"+autoDef.type+"' added to Automation chain");
                    });
                    
                    automata.then( () => { automation.onCompletionLogger(automationResults); resolve(automationResults); } );
                }
                
            })
            .catch( (re) => { automation.onRejectHandler(re) } ); 
        };

        
        // ---------- Property Getter / Setters -----------
        automation.items = function(array) {
            items = array;
            return automation;
        };


        
        
        /** ===== Automations ===== */
        
        /** ======================== CheckClassIsPresentOnNodes =========================== */
        automation.classIsPresentOnNodes = (autoDef, automationIndex) => {
          
            // Getable / Setable Properties
          var selector = null,
          className = null,
          previousResult = null,
          doWhenPreviousResultIs = null;
          
          
          // Getable properties
          const typeName = 'classIsPresentOnNodes';
          

          // Private properties
          var index = null;
          
          

          // ---- Validate ----
          // MANDATORY
          if( typeof automationIndex === 'number' ) {
              index = automationIndex;  
          }
          else
          {
              throw automation.errorLog(configErrorStr,index, typeName, "No 'automationIndex' argument was passed. Cannot instantiate.");
          }

          
          // ----
          
          if( typeof autoDef.selector === 'string' && autoDef.selector.length ) {
              selector = autoDef.selector;  
          }
          else
          {
              throw automation.errorLog(configErrorStr,index, typeName, "No 'selector' defined. Cannot instantiate.");
          }
          
          if( typeof autoDef.className === 'string' && autoDef.className.length ) {
              className = autoDef.className;  
          }
          else
          {
              throw automation.errorLog(configErrorStr,index, typeName, "No 'className' defined. Cannot instantiate.");
          }
          
          // OPTIONAL
          if( typeof autoDef.doWhenPreviousResultIs === 'boolean' ) {
              doWhenPreviousResultIs = autoDef.doWhenPreviousResultIs;
          }
          
          

          var _Process = function(resolve, reject) {
            
              if( previousResult === null ) {
                  return reject({ reason : "Automation:" + index + " ~ '"+typeName+"'. No previousResult. Previous Automation REJECTED. Skipping processing." });
              }
              
            if( $.type(doWhenPreviousResultIs) === 'boolean' ) {
                if( doWhenPreviousResultIs !== previousResult.result ) {
                    return reject({ reason : "Automation:" + index + " ~ '"+typeName+"'. Requires '" + doWhenPreviousResultIs + "', whilst previousResult = " + previousResult.result });
                }
            }    
              
            
            var nodes = $(selector);
            var classFound = false;
            
            // Get nodes with selector
            if( nodes.length === 0 ) {

                return reject({ reason : "Automation:" + index + " ~ '"+typeName+"'. Could not find any nodes matching selector:" + selector });
            }

            // Check if Class is present on nodes
            nodes.each(function( index, node ) {
                if( $(node).hasClass(className) ) {
                    classFound = true;
                }
            });
            
            if(classFound) {
                 automation.resolver(resolve,{ result: true, reason : "Automation:" + index + " ~ '"+typeName+"'. className '" + className + "' was found on selection specified by selector:" + selector });
                 return;
            }
            else {
                automation.resolver(resolve,{ result: false, reason : "Automation:" + index + " ~ '"+typeName+"'. className '" + className + "' was NOT found on selection specified by selector:" + selector });
                return;
            }
          };
          
          
          
          // Return the Objects Properties & Methods
          return {
              // ------ STANDARD ------
              previousResult : function(val) {
                  if( typeof val === 'object' ) {
                      previousResult = val;
                  } 
                  return previousResult;
              },

              _Process : _Process
          }
        }
        
        
        /** ================================ ClickNode ================================ */
        automation.clickNode = (autoDef, automationIndex) => {
            
            // Getable / Setable Properties
          var selector = null,
          clickType = null,
          previousResult = null,
          doWhenPreviousResultIs = null;
          
          
          // Getable properties
          const typeName = 'clickNode';
          
          
          // Private properties
          var index = null;
          
          
          
          // ---- Validate ----
          // MANDATORY
          if( typeof automationIndex === 'number' ) {
              index = automationIndex;  
          }
          else
          {
              throw automation.errorLog(configErrorStr,index, typeName, "No 'automationIndex' argument was passed. Cannot instantiate.");
          }
          
          
          //----
          
          if( typeof autoDef.selector === 'string' && autoDef.selector.length ) {
                selector = autoDef.selector;
          }
          else
          {
              throw automation.errorLog(configErrorStr,index, typeName, "No 'selector' defined. Cannot instantiate.");
          }
          
          if( typeof autoDef.clickType === 'string' && autoDef.clickType.length ) {
              clickType = autoDef.clickType;
          }
          else
          {
              throw automation.errorLog(configErrorStr,index, typeName, "No 'clickType' defined. Cannot instantiate.");
          }
          
          // OPTIONAL
          if( typeof autoDef.doWhenPreviousResultIs === 'boolean' ) {
              doWhenPreviousResultIs = autoDef.doWhenPreviousResultIs;
          }

          
          var _Process = function(resolve, reject) {

              if( previousResult === null ) {
                  reject({ reason : "Automation:" + index + " ~ '"+typeName+"'. No previousResult. Previous Automation REJECTED. Skipping processing." });
                  return;
              }

              if( $.type(doWhenPreviousResultIs) === 'boolean' && $.type(previousResult) === 'object' ) {
                  if( doWhenPreviousResultIs !== previousResult.result ) {
                      reject({ reason : "Automation:" + index + " ~ '"+typeName+"'. Requires '" + doWhenPreviousResultIs + "', whilst previousResult = " + previousResult.result });
                      return;
                  }
              }   
              
              
              var node = $(selector);
              
              if( node.length ) {
                  
                  if( clickType === 'jquery' ) {
                      
                      node.click();
                      automation.resolver(resolve,{ result: true, reason : "Automation:" + index + " ~ '"+typeName+"'. Node '" + selector + "' clicked using '" + clickType + "' clickType" });
                      return;
                  }
                  else if( clickType === 'd3' ) {
                      
                      node.d3Click();
                      automation.resolver(resolve,{ result: true, reason : "Automation:" + index + " ~ '"+typeName+"'. Node '" + selector + "' clicked using '" + clickType + "' clickType" });
                      return;
                  }
              }
              else
              {
                  let reason = "Automation:" + index + " ~ '"+typeName+"'. Could not find any nodes matching selector:" + selector;
                  reject({ reason : reason });
                  return;
              }
          };
          
          
          
          
          // Return the Objects Properties & Methods
          return {
              // ------ STANDARD ------
              previousResult : function(val) {
                  if( typeof val === 'object' ) {
                      previousResult = val;
                  } 
                  return previousResult;
              },
              
              _Process : _Process
          } 
        }

        
        /** ================================ NodeInDOM ================================ */
        automation.nodeInDOM = (autoDef, automationIndex) => {
            
            // Getable / Setable Properties
          var parentSelector = null,
          selector = null,
          maxWait = 200,
          previousResult = null,
          doWhenPreviousResultIs = null;
          
          // Getable properties
          const typeName = 'nodeInDOM';


          // Private properties
          var index = null,
          nodeObserver,
          maxWaitTimeout;
          
          
          
          // ---- Validate ----
          // MANDATORY
          if( typeof automationIndex === 'number' ) {
              index = automationIndex;  
          }
          else
          {
              throw automation.errorLog(configErrorStr,index, typeName, "No 'automationIndex' argument was passed. Cannot instantiate.");
          }
          
          
          //----
          
          if( typeof autoDef.parentSelector === 'string' && autoDef.parentSelector.length ) {
              parentSelector = autoDef.parentSelector;
          }
          else
          {
              throw automation.errorLog(configErrorStr,index, typeName, "No 'parentSelector' argument was passed. Cannot instantiate.");
          }
          
          if( typeof autoDef.selector === 'string' && autoDef.selector.length ) {
                selector = autoDef.selector;
          }
          else
          {
              throw automation.errorLog(configErrorStr,index, typeName, "No 'selector' defined. Cannot instantiate.");
          }
          
          
          // OPTIONAL
          if( typeof autoDef.doWhenPreviousResultIs === 'boolean' ) {
              doWhenPreviousResultIs = autoDef.doWhenPreviousResultIs;
          }

          if( typeof autoDef.maxWait === 'number' ) {
              maxWait = autoDef.maxWait;
          }
          
          
          
          var _Process = function(resolve, reject) {

              // REJECT if the previous result was NULL
              if( previousResult === null ) {
                  reject({ reason : "Automation:" + index + " ~ '"+typeName+"'. No previousResult. Previous Automation REJECTED. Skipping processing." });
                  return;
              }

              // REJECT procession relies on a previousResult being X, and it is not
              if( $.type(doWhenPreviousResultIs) === 'boolean' && $.type(previousResult) === 'object' ) {
                  if( doWhenPreviousResultIs !== previousResult.result ) {
                      reject({ reason : "Automation:" + index + " ~ '"+typeName+"'. Requires '" + doWhenPreviousResultIs + "', whilst previousResult = " + previousResult.result });
                      return;
                  }
              } 
              

              if( $(selector).length > 0 ){
                  automation.resolver(resolve,{ result: true, reason : "Automation:" + index + " ~ '"+typeName+"'. Node '" + selector + "' already present in DOM." });
                  return;
              }
              
              
              var $parentNode = $(parentSelector);
              
              if( $parentNode.length ) {
                  
                  // Kill the observer if maxWait duration is reached
                  maxWaitTimeout = window.setTimeout(function(){

                      nodeObserver.disconnect();
                      automation.resolver(resolve,{ result: false, reason : "Automation:" + index + " ~ '"+typeName+"'. Observer maxWait reached. Node '" + selector + "' NOT found in DOM." });
                      return;
                      
                  }, maxWait);
                  
                  var observeCallback = function(mutationsList) {
                      
                      for(var mutation of mutationsList) {

                          if (mutation.type === 'childList') {

                              if( $(mutation.addedNodes[0]).is(selector) ) {

                                  window.clearTimeout(maxWaitTimeout);

                                  automation.resolver(resolve,{ result: true, reason : "Automation:" + index + " ~ '"+typeName+"'. Node '" + selector + "' observed node in DOM." });
                                  return 
                              } 
                          }
                      }
                    };
                    
                    // Setup an Observer to watch for the specifide node 'selector' appearing in the DOM, as a child of 'parentSelector'
                    nodeObserver = new MutationObserver(observeCallback);
                    nodeObserver.observe($parentNode.get(0), { attributes: true, childList: true, subtree: true });
              }
              else
              {
                  reject({ reason : "Automation:" + index + " ~ '"+typeName+"'. GroupNode '"+parentSelector+"' Could not been found in DOM." });
                  return;
              }
          };
          

          
          // Return the Objects Properties & Methods
          return {
              // ------ STANDARD ------
              previousResult : function(val) {
                  if( typeof val === 'object' ) {
                      previousResult = val;
                  } 
                  return previousResult;
              },

              _Process : _Process
          } 
        }
        
        
        
        
        
        return automation;
    };
   
    
    // TODO, should this be placed elsewhere, more general?
    // Extend jQuery to be able to issue d3 click events
    $.fn.d3Click = function () {
        this.each(function (i, e) {
          var evt = new MouseEvent("click");
          e.dispatchEvent(evt);
        });
    };

    
})(window, document, window.jQuery);