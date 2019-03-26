;(function(window) {

    'use strict';
    window.BOOMR_config = window.BOOMR_config || {};
    window.BOOMR_config = { UserTiming: { enabled: true } };
    const BOOMR = window.BOOMR = (window.BOOMR || {});
    const BOOMR_STATE = {
        beacon_sent: false,
        initialized: false
    };
    BOOMR.plugins = BOOMR.plugins || {};
    window.akdv_boomr = BOOMR.plugins.waitForWidget = {


        init : function() {

            if (!BOOMR_STATE.initialized) {
                BOOMR_STATE.initialized = true;
                BOOMR.subscribe('onbeacon', this.clearTimers, null, this);
            }
        },


        done : function() {

            if (!!BOOMR.version && !BOOMR_STATE.beacon_sent) {
                BOOMR_STATE.beacon_sent = true;
                BOOMR.sendBeacon();
            }
        },


        clearTimers : function() {

            performance.clearMeasures();
            window._log.debug(`BOOMR PLUGIN: Clearing Performance Timers`);
        },


        is_complete : function() {

            return BOOMR_STATE.beacon_sent;
        },
    };


}(window));