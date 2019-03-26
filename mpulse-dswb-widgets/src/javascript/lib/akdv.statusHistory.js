;((window, document, statusHistoryFactory) => {

    'use strict';

    window.akdv.statusHistory = {


        init : () => statusHistoryFactory({ 
            container_el: document.body,
            namespace: 'akdv',
            loading_spinner_el: window.akdv.loading_spinners.cloned_spinner_element
        })

    };


})(window, document, window.statusHistoryFactory);