;((window, document, statusFactory, event_utils, lang_utils) => {

    'use strict';


    const statusNotifier = window.akdv.statusNotifier = {};


    statusNotifier.init = () => {

        window.akdv.statusNotifier = Object.assign(
            window.akdv.statusNotifier,
            statusFactory({
                container_el: document.querySelector('#widget-status-notifier'),
                namespace: 'akdv',
                modal: true,
                default_blind: true
            })
        );
    }


})(window, document, window.statusFactory, window.akdv.utils_event, window.akdv.utils_lang);