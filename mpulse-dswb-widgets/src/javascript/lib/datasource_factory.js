;((window, document, event_utils, obj_utils, lang_utils, string_utils) => {

    'use strict';

    const RESULT_EVENT_TYPE = 'datasource-result';


    window.datasourceFactory = function({
        manifest = window.required(),
        statusNotifier = window.akdv.statusNotifier,
        uuid = string_utils.generateUUID(),
        namespace
    } = {}) {

        const component = window[`datasource${manifest.type && manifest.type.toUpperCase()}`];

        if (!component) {
            throw new TypeError('Data source implementation not found for: ' + manifest.type);
        }

        let component_base = {

            destroy() {}, // IMPLEMENT IN DATASOURCE COMPONENT

            request() {}, // IMPLEMENT IN DATASOURCE COMPONENT

            triggerDataResultOnWindow(data, chart_namspace) {
                
                event_utils.dispatchCustomEvent(window, 'request-complete', chart_namspace || namespace, { uuid });
                if (data && component_base.isMultiChartData(data)) {
                    data.charts.forEach(chart_data => component_base.triggerDataResultOnWindow(chart_data, chart_data.chart_group));
                    return;
                }
                statusNotifier.setInfo({ title: lang_utils.getLocalizedHTMLString('Analyzing', 'AKDV.Status') });
                event_utils.dispatchCustomEvent(window, 'result', chart_namspace || namespace, window.akdv.utils_data.normalizeResultSchema(data));
            },

            onResult : data => component_base.triggerDataResultOnWindow(Array.isArray(data)? [data] : data),

            isMultiChartData : data => data.hasOwnProperty('charts') && data.charts.length > 0
        };


        $(window).on(`${RESULT_EVENT_TYPE}.${uuid}`, (e, data) => component_base.onResult(data));

        let extension_component = component(Object.assign({ statusNotifier, namespace, uuid, result_event_type: RESULT_EVENT_TYPE }, arguments[0]));

        event_utils.dispatchCustomEvent(window, 'datasource-initialized', 'akdv');

        const instance = obj_utils.extend(
            {},
            component_base, 
            extension_component,
            {
                request : async () => { 
                
                    event_utils.dispatchCustomEvent(window, 'request-start', namespace, { uuid });

                    try {
                        extension_component.request(manifest.query);
                    } catch(e) {
                        statusNotifier.setError({ 
                            title: lang_utils.getLocalizedHTMLString('Error', 'AKDV.Errors'), 
                            description:lang_utils.getLocalizedHTMLString('UnknownError', 'AKDV.Errors'), 
                            trace: e.stack 
                        });
                    }
                }
            });

        return instance;
    };


})(window, document, window.akdv.utils_event, window.akdv.utils_obj, window.akdv.utils_lang, window.akdv.utils_string);