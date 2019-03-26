;((window, document, event_utils) => {

    'use strict';

    const state = Object.seal({
        render_completes_required: 1
    });

    const renderCompleteWatch = window.akdv.renderCompleteWatch = {

        onChartRenderComplete(e, data) {

            if (state.render_completes_required > 0) {
                state.render_completes_required--;
                if (state.render_completes_required === 0) {
                    event_utils.dispatchCustomEvent(window, 'render-complete', 'akdv');
                }
            }
        }
    };

    $(window).on('chart-render-complete.akdv', renderCompleteWatch.onChartRenderComplete);
    $(window).on('init-charts.akdv', (e, data) => { 
        if (data && data.manifest_charts) { 
            state.render_completes_required = data.manifest_charts.length || 1; 
        }
    });
    $(window).on('performance-chart-count.akdv', (e, count) => {
        state.render_completes_required = count || 1;
    });

})(window, document, window.akdv.utils_event);