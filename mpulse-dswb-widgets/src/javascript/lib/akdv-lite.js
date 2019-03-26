;((window, document, $, event_utils) => {

    'use strict';

    const config = {
        mpulse_host: window.location.hostname === 'dswb.soasta.com'? 'mpulse-lt2-scratch.soasta.com' : 'mpulse.soasta.com'
    };

    const akdvlite = window.akdvlite = {

        // TODO: Move to utils_repository.js
        requestTokenWithAPIToken : async (api_token = window.required()) => {

            const result = await window.akdv.xmlHTTP.putExpectingJSON({ 
                url: `https://${config.mpulse_host}/concerto/services/rest/RepositoryService/v1/Tokens`,
                data: { apiToken: api_token },
                headers: { 'cache-control': 'no-cache' }, 
                options: { redirect: 'error', 'mode': 'cors' }, 
                suppress_errors: true 
            })
            .catch(e => {
                window._log.warn(`WARNING : error requesting token data with token: ${api_token}`);
            });

            return result && result.token;
        },
     

        onVegaChartInitialized : async (chart_manifests, e, vega_instance) => {

            const chart = chart_manifests.find(chart => chart.container_id === `#${vega_instance.container_el.id}`);

            if (!chart) {
                throw new TypeError(`No chart with matching container id : ${vega_instance.container_el.id}`);
            }

            try {

                if (chart.datasource.type === 'DSWB' && chart.datasource.api_token) {
                    chart.datasource.token = await akdvlite.requestTokenWithAPIToken(chart.datasource.api_token);
                }
                
                if (chart.datasource) {
                    let datasource = window.datasourceFactory({
                        statusNotifier: vega_instance.statusNotifier,
                        namespace: chart.namespace,
                        manifest: chart.datasource
                    }).request();
                } else {
                    window._log.warn(`WARNING : No data source found for chart ${chart.container_id}. Chart must implement.`);
                    event_utils.dispatchCustomEvent(window, 'result', chart.namespace || '', [false]);
                }

            } catch(e) {
                vega_instance.statusNotifier.setError({
                    title: window.akdv.utils_lang.getLocalizedHTMLString('Error', 'AKDV.Errors'), 
                    description: e.message,
                    trace: e.stack
                });  
            }
        },
        

        initDataStory() {

        },


        init() {

            window.akdv.utils_css.init();
            window.akdv.storage.init();

            const chart_manifests = window.akdv_manifest.charts.map(m => window.chartManifestFactory(m));

            if (window.datastoryFactory.isDataStoryManifest(window.akdv_manifest)) {
                window.datastoryFactory({ manifest: window.akdv_manifest.datastory });
            }

            event_utils.dispatchCustomEvent(window, 'init-charts', 'akdv', { manifest_charts: chart_manifests });

            $(window).on(`vega-chart-initialized.akdv`, akdvlite.onVegaChartInitialized.bind(akdvlite, chart_manifests));
            $(window).on('resize visibilitychange', (e) => {

                event_utils.debounceEvent(e, null, '', e => window.requestAnimationFrame(f => $(window).trigger('resize-charts.akdv')), 100);
            });
        }
    }
})(window, document, window.jQuery, window.akdv.utils_event);