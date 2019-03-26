;((window, document, string_utils, dom_utils, performance) => {


    'use strict';

    const config = Object.freeze({
        beacon_send_events: ['render-complete'],
        events: [
            { name: 'server-timing', mark: { name: 'timingInfo' }, set: true },
            { name: 'mpulse-filter-update', mark: { name: 'filtersUpdated' }},
            { name: 'request-start', mark: { name: 'requestStart' }, measure: [{ start_mark: 'NavTimingResponseEnd', end_mark: 'requestStart' }]},
            { name: 'server-complete', mark: { name: 'serverComplete' }, measure: [{ start_mark: 'ServerProcessing', end_mark: 'serverComplete' }]},
            { name: 'request-complete', mark: { name: 'requestComplete' }, measure: [{ start_mark: 'requestStart', end_mark: 'requestComplete' }]},
            { name: 'chart-render-start', mark: { name: 'chartRenderStart' }, measure: [{ start_mark: 'NavTimingResponseEnd', end_mark: 'chartRenderStart'}]},
            { name: 'chart-render-complete', mark: { name: 'chartRenderComplete' }, measure: [{ start_mark: 'chartRenderStart', end_mark: 'chartRenderComplete'}]},
            { name: 'render-complete', mark: { name: 'renderComplete' }, measure: [{ start_mark: 'NavTimingResponseEnd', end_mark: 'renderComplete' }, { start_mark: 'filtersUpdated', end_mark: 'renderComplete' }]}
        ],
        status_events: [
            { name: 'Connecting', mark: { name: 'Connecting' }, measure: [{ start_mark: 'requestStart', end_mark: 'Connecting' }]},
            { name: 'Connected', mark: { name: 'Connected' }, measure: [{ start_mark: 'Connecting', end_mark: 'Connected' }]},
            { name: 'ServerProcessing', mark: { name: 'ServerProcessing' }},
            { name: 'Error', mark: { name: 'Error' }, measure: [{ start_mark: 'NavTimingResponseEnd', end_mark: 'Error' }]}
        ]
    });

    const state = Object.seal({
        marks: {}, // { name: 'blaa', type: xxx, data: xxx, uuid: xxxx }
        beacon_sent: false
    });


    const findEventByMarkName = (name) => [...config.events, ...config.status_events].find(d => d.mark && d.mark.name === name);


    const perf = window.akdv.performance = {


        mark({ type = window.required(), name = window.required(), data = {}, uuid = false, event_namespace = false } = {}) {

            let id = uuid? `${name}-${uuid}` : name;
            let event = findEventByMarkName(name);
    
            if (event && !state.marks.hasOwnProperty(id)) {

                state.marks[id] = { name, type, data, uuid };

                if (event.mark) {
                    performance.mark(id);
                    window._log.debug(`PERFORMANCE: mark set - ${id}`);
                }

                if (event.measure && event.measure.length) {
                    for (let measure of event.measure) {
                        let measure_name = `${event_namespace? event_namespace : 'akdv'}.${measure.start_mark || 0}_${measure.end_mark? measure.end_mark : event.mark.name}`;
                        perf.measure(measure_name, measure.start_mark, measure.end_mark, uuid);
                    }
                }

                if (!state.beacon_sent && config.beacon_send_events.includes(type)) {
                    try {
                        window.akdv_boomr.done();
                        window._log.debug('PERFORMANCE: beacon sent - ' + id);
                        state.beacon_sent = true;
                    } catch(e) {
                        window._log.warn(`ERROR - BEACON NOT SENT. BOOMR not available.`, e);
                    }
                }

                if (event.set) {
                    window._log.debug('PERFORMANCE: custom var set - ' + name);
                    perf[event.mark.name] = data;
                }
            }
        },
        
        
        measure(measure_name = window.required(), start_mark_name = false, end_mark_name = false, uuid = false) {

            start_mark_name = start_mark_name === 'NavTimingResponseEnd'? 'responseEnd' : start_mark_name;
            let marks = [[start_mark_name, end_mark_name]];
            if (uuid) {
                marks.unshift([!!start_mark_name && start_mark_name !== 'responseEnd'? `${start_mark_name}-${uuid}` : start_mark_name, !!end_mark_name? `${end_mark_name}-${uuid}` : end_mark_name]); 
            }

            try {
                for (let [smn, emn] of marks) {
                    if ((start_mark_name === 'responseEnd' || (!!smn && performance.getEntriesByName(smn, 'mark').length)) 
                     && (!!emn && performance.getEntriesByName(emn, 'mark').length)) {
                        performance.measure(measure_name, smn, emn);
                        window._log.debug(`PERFORMANCE: measure set - ${measure_name}`);
                        break;
                    } else if (start_mark_name === 'responseEnd' || (!!smn && performance.getEntriesByName(smn, 'mark').length)) {
                        performance.measure(measure_name, smn);
                        window._log.debug(`PERFORMANCE: measure set - ${measure_name}`);
                        break;
                    }
                }
            } catch (e) {
                window._log.warn('PERFORMANCE: error adding measure - ' + measure_name, e);
            }
        },


        onEvent(e, data) {

            let event, mark_name, event_namespace;

            if (e.type === 'status' && data) {
                mark_name = data.title? dom_utils.getLocalizationKeyFromHTMLString(data.title) : false;
                event = config.status_events.find(d => d.mark && d.mark.name === mark_name);
            } else {
                event = config.events.find(d => d.name === e.type);
                mark_name = event? event.mark.name : false;
                event_namespace = (data? data.namespace ||  e.namespace : e.namespace) || 'akdv';
                event_namespace = (event_namespace !== 'akdv')? `akdv-${event_namespace}` : event_namespace;
            }

            // add the mark 
            if (mark_name && event && event.mark) {
                if (!data || !data.uuid) {
                    window._log.warn('uuid missing from performance event.', e);
                }
                perf.mark({ type: e.type, name: mark_name, uuid: data? data.uuid : false, data, event_namespace });
            }
        }
    };


    $(window).on(['status.set.akdv', 'status.done.akdv', ...config.events.map(d => `${d.name}.${d.namespace || 'akdv'}`)].join(' '), 
        (e, data) => perf.onEvent(e, data)
    );


})(window, document, window.akdv.utils_string, window.akdv.utils_dom, window.performance);