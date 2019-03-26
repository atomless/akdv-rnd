

;((window, document, componentFactory, tooltipFactory) => {

    'use strict';

    const annotation_layer_el = document.querySelector('#annotation-layer');

    window.akdv.tooltips = {


        init : () => {
            if (annotation_layer_el) {
                window.componentFactory({ 
                    container_el: annotation_layer_el,
                    event_namespace: 'tooltip',
                    component: window.tooltipFactory,
                    show_timeout_period_ms: 0,
                    offset_x_rems: 1.5,
                    offset_y_rems: 0.55,
                    function_to_format_data: d => d
                });
            }
        }

    };


})(window, document, window.componentFactory, window.tooltipFactory);