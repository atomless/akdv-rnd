;((window, document, vegaFactory, event_utils, lang_utils, vega_utils, dom_utils, statusNotifier, statusFactory) => {

    'use strict';


    const handleError = (e, container_el = document.querySelector('#widget-status-notifier')) => {

        statusNotifier = statusNotifier || statusFactory({
            container_el,
            namespace: 'akdv',
            modal: true,
            default_blind: true
        });

        statusNotifier.setError({ 
            title: lang_utils.getLocalizedHTMLString('Error', 'AKDV.Errors'), 
            description:lang_utils.getLocalizedHTMLString('UnknownError', 'AKDV.Errors'), 
            trace: e.stack 
        });
    };


    const addChart = ({ 
        container_el, 
        namespace,
        type = false,
        schema_json = false, 
        schema_uri = false, 
        fullscreen = false
    } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        schema_uri = schema_uri || (type && vega_utils.getSchemaURL({ chart_type: type })) || undefined;

        container_el.setAttribute('data-fullscreen', fullscreen);

        try {
            let vega_chart = window.vegaFactory({ schema_json, schema_uri, container_el, namespace });        
        } catch(e) {
            window._log.warn(`Vega Chart '${container_el}' failed ${e.message}`);
            handleError(e, container_el);
        }
    };


    const initVegaChartsFromManifest = (manifest_charts) => {

        for (let manifest of manifest_charts) {
            let container_el = document.querySelector(manifest.container_id);
            addChart(Object.assign({ container_el, namespace: manifest.namespace }, manifest.chart || {}));
            container_el.classList.add('akdv-chart');
        }
    };


    const initVegaChartsFromElementsWithMatchingClass = (css_class) => {

        let chart_elements = document.querySelectorAll(`.${css_class}`);

        for (let el of chart_elements) {
            addChart({ container_el: el, fullscreen: el.getAttribute('data-fullscreen') !== 'false' });
        }
    };

    
    const initCharts = ({ 
        css_class = 'vega-chart',
        manifest_charts = []
    } = {}) => {
    
        if (manifest_charts.length) {
            initVegaChartsFromManifest(manifest_charts);
        } else {
            initVegaChartsFromElementsWithMatchingClass(css_class);
        }
    };


    $(window).on('init-charts.akdv', (e, config) => initCharts(config));


})(window, document, window.vegaFactory, window.akdv.utils_event, window.akdv.utils_lang, window.akdv.utils_vega, window.akdv.utils_dom, window.akdv.statusNotifier, window.statusFactory);