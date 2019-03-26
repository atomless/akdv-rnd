;((window, document, $) => {

    'use strict';


    const akdv = window.akdv = {

        meta: Object.freeze({
            version: window.build_version || '0.0.0',
            compilation_date: window.build_timestamp
        }),

        config: Object.freeze({
            data_uri: `${location.protocol}//${location.hostname}${
            ((location.port)? ':' + location.port : '')
            }${window.location.pathname.split('html', 1).shift()}data/`,
            s3data_uri: 'https://mpulse-datastories.soasta-dswb.com',
            resize_throttle_delay: 200,
            resize_throttle_timer: null
        }),

        state: Object.seal({
            new_request_override_charts: [],
            datasource: false
        }),


        init : async () => {

            window._log.outputCopyrightAndVersionInfoToLog(akdv.meta);

            let params = window.akdv.utils_env.getQueryParams(true);
            let canned_data_path = params.s3data || params.data;

            akdv.utils_css.init();
            await akdv.themes.init(params);
            if (akdv.statusNotifier) {
                akdv.statusNotifier.init();
            }
            if (akdv.statusHistory) {
                akdv.statusHistory.init();
            }
            akdv.tooltips.init();
            akdv.storage.init();
            akdv.loading_spinners.removePageLoadSpinner();
            
            akdv.addEventListeners();

            akdv.statusNotifier.setInfo({ title: akdv.utils_lang.getLocalizedHTMLString('Initializing', 'AKDV.Status') });

            if (akdv.postMessageAPI && akdv.mpulse) { 
                akdv.postMessageAPI.init();
                akdv.mpulse.init({ defer_request_on_filter_update: akdv.state.new_request_override_charts.includes(akdv.utils_env.html_filename) });
            }

            let manifest = { type: 'FILE', uri: akdv.getDataURL(params) };

            akdv.utils_event.dispatchCustomEvent(window, 'init-charts', 'akdv');

            if (!canned_data_path && window.datasourceDSWB) {
                manifest = { type: 'DSWB' };
                // Connect to DSWB
                window._log.info('Initializing DSWB Datasource.');
                akdv.state.datasource = window.datasourceFactory({
                    statusNotifier: akdv.statusNotifier,
                    manifest
                });
            } else if (!params['no-data-source']) {
                try {
                    akdv.state.datasource = window.datasourceFactory({
                        statusNotifier: akdv.statusNotifier,
                        manifest
                    }).request();
                } catch(e) {
                    akdv.statusNotifier.setError({
                        title: akdv.utils_lang.getLocalizedHTMLString('Error', 'AKDV.Errors'), 
                        description: e.message,
                        trace: e.stack
                    });  
                }
            } else {
                akdv.utils_event.dispatchCustomEvent(window, 'render-complete', 'akdv', []);
            }
            
            akdv.postMessageAPI && akdv.postMessageAPI.postToParent({ state : 'loaded' });
        },


        // --- EVENTS --- //


        // Sends a message to the parent when the chart is finished rendering
        onRenderComplete(e, data) {

            window._log.info('Render Complete', data);

            akdv.statusNotifier.done();
            document.body.setAttribute('data-render-complete', true);
            window.akdv.utils_event.debounceEvent(e, '', {}, () => window.akdv.postMessageAPI && window.akdv.postMessageAPI.postToParent({ state : 'render_complete' }), 500);
        },


        onResize(e) {

            window.requestAnimationFrame(f => $(window).trigger('resize-charts.akdv'));
        },


        addEventListeners() {

            $(window).on('render-complete.akdv', akdv.onRenderComplete.bind(this));
            $(window).on('resize visibilitychange', (e) => {

                window.akdv.utils_event.debounceEvent(e, null, '', akdv.onResize, 100);
            });
        },


        // --- HELPERS --- //
        

        getDataURL : (params) => {

            const canned_data_path = window.decodeURIComponent(params.s3data || params.data);

            return canned_data_path? (params.s3data
                    ? `${window.akdv.config.s3data_uri}/${window.akdv.utils_env.html_filename}/`
                    : window.akdv.config.data_uri) 
                + canned_data_path.replace('.json', '') + '.json'
            : false;
        },


        addChartNewRequestOverride(chart_template_name) { akdv.state.new_request_override_charts.push(chart_template_name); },


        get datasource() {
            return akdv.state.datasource;
        }

    };

    window.akdv.version = window.akdv.meta.version;


})(window, document, window.jQuery);