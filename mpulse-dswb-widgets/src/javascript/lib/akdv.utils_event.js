;((window, document, $, string_utils) => {

    'use strict';
  

    window.akdv.utils_event = {


        // Usage:
        // $(window).on('myevent', (e, data) => { 
        //
        //     window.akdv.utils_env.debounceEvent(e, namespace, data, myEventHandler);
        // });
        // Note: this debounces events by event type so any new events coming in with the same type
        // will wipe timeout of any events currently queued with a matching type.
        // To avoid this you can set a unique namespace.
        debounceEvent(e, _namespace = '', data = false, _enventHandler = e => {}, _throttle_delay_ms = 200) {

            let debounced_event_timeout = `debounced_${e && e.type? e.type : e}_event_timeout`;
            let namespace = (_namespace)? '.' + _namespace : '';

            window.clearTimeout(window[debounced_event_timeout + namespace]);
            // throttle calls to the defined event handler function 
            window[debounced_event_timeout + namespace] = window.setTimeout(() => {

                _enventHandler(e, data);
            }, _throttle_delay_ms);
        },


        waitForNextPaint : () => new Promise((resolve) => window.requestAnimationFrame(e => window.requestAnimationFrame(resolve))),


        delay : (delay_milliseconds, delay_id = string_utils.generateUUID()) => new Promise((resolve, reject) => {
            
            window.clearTimeout(`delay-${delay_id}`); 
            window[`delay-${delay_id}`] = setTimeout(e => resolve(), delay_milliseconds);
        }),


        dispatchCustomEvent(obj, type, _namespace, data) {

            let namespace = `${(_namespace)? '.' + _namespace : (type === 'result')? '.data' : '' }`;

            window._log.debug2(`Triggering ${obj} event: ${type}${namespace}`, data);
            $(obj).trigger(`${type}${namespace}`, Array.isArray(data)? data : [data]);
        },


        addDelegatedListener( 
            selector = window.required('selector string'),
            event_type = window.required('event type string'), 
            handler = window.required('handler function'), 
            _delegate = document, 
            _use_capture = false) {

            let delegate_node = (typeof _delegate === 'string')
                ? document.querySelectorAll(_delegate)
                : _delegate;

            delegate_node.addEventListener(event_type, (e) => {

                for (let target = e.target; target && target !== this; target = target.parentNode) {
                // loop parent nodes from the target to the delegate node
                    if (target.matches(selector)) {

                        handler.call(e);
                        break;
                    }
                }
            }, _use_capture);
        },


        on(obj, type, _namespace, _callback = e => {}) {

            let namespace = (_namespace)? '.' + _namespace : '';

            $(obj).on(`${type}${namespace}`, _callback);
        },


        off(obj, type, _namespace, _callback = e => {}) {

            let namespace = (_namespace)? '.' + _namespace : '';

            $(obj).off(`${type}${namespace}`, _callback);
        },
        

        namspaceHasHandlers(obj, namespace) {
            
            const events = $._data(obj).events;
            return Object.keys(events).some(k => events[k].some((e, i) => events[k][i].namespace === namespace));
        }
    };


})(window, document, window.jQuery, window.akdv.utils_string);