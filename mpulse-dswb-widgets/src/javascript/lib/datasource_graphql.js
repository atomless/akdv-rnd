;((window, document, xmlHTTP, validate, event_utils, lang_utils, obj_utils, statusNotifier) => {

    'use strict';


    window.datasourceGRAPHQL= function({
        uuid = window.required(),
        statusNotifier,
        manifest,
        result_event_type = 'datasource-result'
    } = {}) {

        const data_uri = manifest.uri || 'https://api.soti.akamai.com';
        
        const throwResponseErrors = (errors) => {

            if (Array.isArray(errors)) {
                for(let error of errors) {
                    throw new Error(error.message || lang_utils.getLocalizedHTMLString('UnknownError', 'AKDV.Errors'));
                }
            }
        };

        return {
            request : () => {

                statusNotifier.setInfo(Object.assign({ title: lang_utils.getLocalizedHTMLString('Requesting', 'AKDV.Status') }));
                
                if (!manifest.query) {
                    statusNotifier.setError({title: lang_utils.getLocalizedHTMLString('Execution', 'AKDV.Errors')});
                    return;
                }

                xmlHTTP.postExpectingJSON({ 
                    url: data_uri,
                    headers: {"content-type":"application/json"},
                    data: {"query": manifest.query},
                    suppress_errors: true
                })
                .then(data => {
                    window._log.info('Received GraphQL response.', data);
                    if (data && !data.errors) {
                        const result_data = obj_utils.getNamespaceInObj(data, manifest.result_path || 'data.mPulseFacts') || data;
                        event_utils.dispatchCustomEvent(window, result_event_type, uuid, Array.isArray(result_data)? [result_data] : result_data);
                    } else {
                        window._log.warn('ERROR : Failed to load GraphQL JSON response data from:' + data_uri);
                        statusNotifier.noData();
                        if (data.errors) {
                            throwResponseErrors(data.errors);
                        }
                    }
                })
                .catch(e => {
                    statusNotifier.setError({ 
                        title: lang_utils.getLocalizedHTMLString('Post', 'AKDV.Errors.Datasource.GraphQL.XMLHTTP'), 
                        description: e.message || e,
                        trace: e.stack
                    });    
                });
            }
        };
    };


})(window, document, window.akdv.xmlHTTP,  window.akdv.validate, window.akdv.utils_event, window.akdv.utils_lang, window.akdv.utils_obj, window.akdv.statusNotifier);