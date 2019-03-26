;((window, document, $, dom_utils) => {

    'use strict';

    const config = Object.freeze({ $loading_spinner_template: $(dom_utils.createElementFromHTMLString(`
        <svg id="loading-spinner" class="loading-spinner page-load-spinner" height="50" width="50" viewBox="0 0 50 50">
            <circle class="loading-spinner-path-bg" cx="25" cy="25" r="20" fill="none"></circle>
            <circle class="loading-spinner-path" cx="25" cy="25" r="20" fill="none"></circle>
        </svg>`)) });
  
    // On pageload, elements with the class '.loading-spinner-placeholder' will be replaced with 
    // the loading spinner template. Any 'replace-loading-spinner-placeholders' events triggered 
    // on the window will repeat the process of replacing any newly added dom elements with the 
    // '.loading-spinner-placeholder' class.
    const ls = window.akdv.loading_spinners = {

        replaceLoadingSpinnerPlaceholders: (e, parent_element_selector = false) => 
            $(`${parent_element_selector? parent_element_selector + ' ' : ''}.loading-spinner-placeholder`)
                .replaceWith(config.$loading_spinner_template.clone()),

        removePageLoadSpinner: e => $('#loading-spinner').remove(),

        get cloned_spinner_element() {
            return config.$loading_spinner_template.clone().removeAttr('id').get(0);
        }
    };

    ls.replaceLoadingSpinnerPlaceholders();

})(window, document, window.jQuery, window.akdv.utils_dom);