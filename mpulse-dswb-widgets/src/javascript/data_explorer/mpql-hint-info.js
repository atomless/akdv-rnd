;(function(window, document, CodeMirror) {

    /**
     * This library wraps the CodeMirror hint.sql module as it does not itself expose its internal events for UI handling
     * Specifically wrapping in this way exposes the SHOWN, SELECT, PICK and CLOSE picker events
     * We need to trigger INFO display using these events
     */
    
    'use strict';

    
    const calcPickerLeftPosition = function(LeftOffset) {
        
        const bodyWidth = document.body.clientWidth;
        const $codeMirrorWindow = $('#data_explorer_query_editor .CodeMirror.CodeMirror-wrap');
        const $codeMirrorWindowOffset = $codeMirrorWindow.get(0).getBoundingClientRect();
        const pickerWidth = window.akdv.utils_css.remsToPixels(17);
        
        if(LeftOffset + pickerWidth <= bodyWidth)
        {
            // Show the Picker to the RIGHT of the insertion point
            return (LeftOffset - window.akdv.utils_css.remsToPixels(1.0)) + 'px';
        }
        else
        {
            // Show the Picker to the LEFT of the insertion point
            return (LeftOffset - (pickerWidth + window.akdv.utils_css.remsToPixels(1.0))) + 'px';
        }
            
        return 0;
    }
    
    
    const showDropdownInfoBox = function() {
 
      const $dexEditor = $('#data_explorer_query_editor');
      const $cmHints = $dexEditor.find('.CodeMirror-hints');      
      let $cmHintsWrapper = $dexEditor.find('.CodeMirror-hints-wrapper');
      let $cmHintsContainer = $('#CodeMirror_Picker_Info_Container');

      if( $cmHintsWrapper.length == 0 )
      {
          $cmHintsWrapper = $('<div class="CodeMirror-hints-wrapper"></div>').appendTo( $dexEditor );
          $cmHintsContainer = $('<div id="CodeMirror_Picker_Info_Container" class="CodeMirror-info-container cm-s-akamai dex_info"></div>').appendTo( $cmHintsWrapper );
      }
      else
      {
          if( $cmHintsWrapper.children().length != 1 )
          {
              return;
          }
      }

      const wLeft = calcPickerLeftPosition( parseFloat($cmHints.css('left').replace('px','')) );
      const wTop = $cmHints.css('top');
      
      $cmHints.css('left','0px').css('top','0px');
      $cmHints.detach();
      
      $cmHintsWrapper.css('left',wLeft).css('top',wTop).prepend($cmHints);
      $cmHintsContainer.empty();
      
      $cmHintsWrapper.addClass('display');
    };

    
    const closeDropdownInfoBox = function(){
        
        var $dexEditor = $('#data_explorer_query_editor');
        var $cmHintsWrapper = $dexEditor.find('.CodeMirror-hints-wrapper');
        $cmHintsWrapper.removeClass('display');
    };
    
    
    const showInfo = function(data,el){
        
        if( $.type(akdv.dataExplorer.queryEditor) === 'function' )
        {
            const key = data.text.toLowerCase();
            
            if( $(el).hasClass('cm-keyword') || $(el).hasClass('cm-mpql-keyword') )
            {
                akdv.dataExplorer.queryEditor.showPickerKeywordInfo(key);
            }
            else if( $(el).hasClass('cm-column') )
            {
                akdv.dataExplorer.queryEditor.showPickerColumnInfo(key);
            }
            else if( $(el).hasClass('cm-mpql-function') )
            {
                akdv.dataExplorer.queryEditor.showPickerFunctionInfo(key);
            }
            else if( $(el).hasClass('cm-mpql-datetime-clauses') || $(el).hasClass('cm-mpql-datetime-values') )
            {
                akdv.dataExplorer.queryEditor.showPickerDatetimeInfo(key);
            }
        }
    };
    
    
    // We must wrap the current MPQL hint definition, so we can extend it, without altering the source
    const hintMPQL = CodeMirror.hint.sql;
    
    CodeMirror.hint.sql = function(cm, options) {
        
       var result = hintMPQL(cm, options);
       
       if (result)
       {
            CodeMirror.on(result, "shown", showDropdownInfoBox );
           
            CodeMirror.on(result, "select", showDropdownInfoBox );
            
            CodeMirror.on(result, "select", showInfo );
            
            //CodeMirror.on(result, "pick", function(x,y,z) { debugger });
            
            CodeMirror.on(result, "close", closeDropdownInfoBox );
       }

       return result;
    };

})(window, document, window.CodeMirror);