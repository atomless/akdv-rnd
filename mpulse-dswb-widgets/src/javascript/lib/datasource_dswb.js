;((window, document, $, event_utils, lang_utils, mpulse, dswbSessionFactory, dswbServerInterfaceFactory, statusNotifier) => {

    'use strict';


    const state = Object.seal({
        serverInterface: false,
        sessions: []
    });


    window.datasourceDSWB = function({
        uuid = window.required(),
        statusNotifier,
        manifest,
        result_event_type = 'datasource-result'
    } = {}) {


        const destroy = (e, session_id) => {

            state.sessions = state.sessions.filter(dswb_session => dswb_session.session.id !== session_id);
        };


        const destroyRunningSessions = (concurrency_namespace) => {

            state.sessions.forEach(dswb_session => {
                if (!concurrency_namespace || dswb_session.concurrency_namespace === concurrency_namespace) {
                    dswb_session.destroy();
                }
            });
        };


        // requests a new session, socket connection and new data from the notebook defined 
        // by the various settings gathered by the call to the dswb server interface factory.
        const request = ({ filters = ((mpulse && mpulse.filters) || {}), additional_filters = [], concurrency_namespace = false, background = false } = {}) => {
   
            state.serverInterface = dswbServerInterfaceFactory({
                background,
                tenant: manifest.tenant,
                token: manifest.token,
                host: manifest.host,
                notebookuuid: manifest.notebookuuid,
                statusNotifier
            });

            destroyRunningSessions(concurrency_namespace);

            const session = dswbSessionFactory({ 
                url: state.serverInterface.base_uri + state.serverInterface.sessions_path, 
                serverInterface: state.serverInterface,
                concurrency_namespace,
                filters,
                additional_filters,
                background,
                result_event_type,
                uuid,
                statusNotifier
            });

            state.sessions.push(session);
        };


        const onNotebookUUIDChanged = (e, result) => {

            if (result && result.data && result.data.uuid) {
                state.serverInterface.notebookuuid = result.data.uuid;
            } else {
                window._log.warn('Error in Notebook UUID result', result);
            }
        };


        statusNotifier.setInfo({ title: lang_utils.getLocalizedHTMLString('AwaitingMpulse', 'AKDV.Status'), priority:  window.AKDV_PRIORITY_LEVELS.HIGH });
        

        $(window).on(`new-request.akdv`, (e, data) => request(data));
        $(window).on('result.notebook-uuid', onNotebookUUIDChanged);
        $(window).on(`session-destroy.akdv`, destroy);


        return {
            destroy,
            request,
            get serverInterface () { return state.serverInterface; },
            get sessions() { return state.sessions; }
        };

    };


})(window, document, window.jQuery, window.akdv.utils_event, window.akdv.utils_lang, window.akdv.mpulse, window.dswbSessionFactory, window.dswbServerInterfaceFactory, window.akdv.statusNotifier);
