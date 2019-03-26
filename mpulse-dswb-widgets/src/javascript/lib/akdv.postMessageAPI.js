;((window, document, $) => {

    'use strict';

    const config = Object.seal({
        parent_origin : '*', // we'll update this once we get our first message from the parent
    });
  

    window.akdv.postMessageAPI = {


        init() {

            this.addEventListeners();
        },


        receive(event) {

            window._log.info('POSTMESSAGE API RECEIVED ', event);

            // Do we trust the sender of this message?
            if (!window.akdv.validate.fromSupportedOrigin(event.origin)) {
                window._log.warn('postMessageAPI : message received from untrusted origin: ' + event.origin, event);
                return;
            }
            // Set parentOrigin, so that any further messages sent to the parent use the correct target
            if (event.source === window.parent) {
                config.parent_origin = event.origin;
            }

            if (event.data && event.data.hasOwnProperty('theme')) {
                $(window).trigger('theme-change.akdv', event.data.theme);
            }

            if (event.data && event.data.hasOwnProperty('SOASTA_filter')) {
                $(window).trigger('mpulse-filter-update.akdv', event.data.SOASTA_filter || []);
            }
            if (event.data && event.data.hasOwnProperty('SOASTA_resize')) {
                $(window).trigger('resize');
            }
            if (event.data && event.data.hasOwnProperty('SOASTA_visibility')) {
                $(window).trigger('visibilitychange');
            }
            if (event.data && event.data.hasOwnProperty('SOASTA_linkedDashboard')) {
                $(window).trigger('mpulse-linked-dashboard-update.akdv', event.data.SOASTA_linkedDashboard);
            }
            if (event.data && event.data.hasOwnProperty('SOASTA_widgetPoppedOut')) {
                $(window).trigger('mpulse-widget-status-update.akdv', { popped : event.data.SOASTA_widgetPoppedOut });
            }
        },


        postToParent(msg_obj, origin = config.parent_origin) {

            window._log.info('POSTMESSAGE API - ATTEMPTING SENDING TO ' + (origin || '*'), msg_obj);
            // Only post to parent if current window is actually in an iframe.
            if (!window.akdv.utils_env.in_iframe) {
                return;
            }

            if (!origin || origin === '*') {
                window._log.warn('Sending window.postMessage with a wild or undefined target origin potentially discloses your data to mailicious interception.');
            }
            window._log.info('POSTMESSAGE API - SENDING ' + origin, msg_obj);
            window.parent.postMessage(msg_obj, origin);
        },


        // --- EVENTS --- //


        addEventListeners() {

            //$(window).on('message', this.receive.bind(this));
            window.addEventListener('message', this.receive.bind(this), false);
        }

    };



})(window, document, window.jQuery);