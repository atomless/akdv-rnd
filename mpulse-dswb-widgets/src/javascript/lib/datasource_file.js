;((window, document, xmlHTTP, validate, event_utils, lang_utils, statusNotifier) => {

    'use strict';


    window.datasourceFILE = function({
        uuid = window.required(),
        statusNotifier,
        manifest,
        result_event_type = 'datasource-result'
    } = {}) {

        const data_uri = manifest.uri;
        
        return {
            request : () => {

                statusNotifier.setInfo(Object.assign({ title: lang_utils.getLocalizedHTMLString('Requesting', 'AKDV.Status') }));

                xmlHTTP.getJSON({ 
                    url: data_uri,
                    suppress_errors: true
                })
                .then(data => {
                    window._log.info('Received file data.', data);
                    if (data) {
                        event_utils.dispatchCustomEvent(window, result_event_type, uuid, Array.isArray(data)? [data] : data);
                    } else {
                        window._log.warn('ERROR : Failed to load local JSON file data from:' + data_uri);
                        statusNotifier.noData();
                    }
                })
                .catch(e => {
                    statusNotifier.setError({ 
                        title: lang_utils.getLocalizedHTMLString('Get', 'AKDV.Errors.Datasource.File.XMLHTTP'), 
                        description: e.message || e,
                        trace: e.stack
                    });    
                });
            }
        };
    };


})(window, document, window.akdv.xmlHTTP,  window.akdv.validate, window.akdv.utils_event, window.akdv.utils_lang, window.akdv.statusNotifier);