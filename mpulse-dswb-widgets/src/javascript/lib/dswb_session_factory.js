;((window, document, $, event_utils, lang_utils, validate, string_utils, socketFactory) => {


    'use strict';

    const MIME_CONTENT_TYPE_JSON = 'application/json';
    const MIME_CONTENT_TYPE_TEXT = 'text/plain';
    const MIME_CONTENT_TYPE_HTML = 'text/html';

    const SESSION_CONNECTION_STATES = Object.freeze({
        DISCONNECTED: -1,
        CONNECTING: 0,
        CONNECTED: 1
    });

    const PROCESS_NAMESPACE = 'dswb-session';

    const REQUIRED_SESSION_RESPONSE_KEYS = ['notebook', 'id', 'kernel'];

    window.dswbSessionFactory = ({
        url,
        serverInterface,
        concurrency_namespace,
        statusNotifier = window.akdv.statusNotifier,
        filters = false,
        additional_filters = [],
        background = false,
        uuid = string_utils.generateUUID(),
        result_event_type = 'result'
    } = {}) => {
        

        const state = Object.seal({
            uuid,
            timestamp: window.performance.now(), 
            connected: -1, 
            session: { id: string_utils.generateUUID() }, // Overriden by response json
            concurrency_namespace,
            socket: false,
            socket_received_result: false,
            socket_EOM_received: false,
            socket_error_received: false,
            destroyed: false,
            filters,
            additional_filters
        });


        const status_data = () => ({
            priority: window.AKDV_PRIORITY_LEVELS.HIGH,
            timestamp: state.timestamp, 
            uuid: state.uuid, 
            background
        });


        const destroy = () => {

            state.destroyed = true;
            if (state.socket && !state.socket.closing) {
                state.socket.close(false);
                state.socket = false;
            }
            state.connected = SESSION_CONNECTION_STATES.DISCONNECTED;
            
            state.session = {id: state.session.id};
            event_utils.dispatchCustomEvent(window, 'session-destroy', 'akdv', state.session.id);
        }


        // SOCKET METHODS


        const isAuthenticSocketData = (data) => (data && (data.parent_header && data.parent_header.session === state.session.id) || (data.header.session === state.session.id));


        const handleSocketMessageErrors = (data, msg_type, text) => {

            let message_key = false, content_text = (data.content ? data.content.text : false) ||  (data.content ? data.content.evalue : false) || text || '';

            if (msg_type === 'julia_error'
            || msg_type === 'error'
            || (msg_type === 'execute_reply' && data.content.status === 'error') 
            || data.content.name === 'stderr') {
                message_key = 'UnknownError';
            }

            if (content_text.includes('ArgumentError')) {
                message_key = (content_text.includes('summaries must contain at least two elements to get a trend'))
                    ? 'TimeRangeTooShort'
                    : 'MissingFilters';
            } else if (content_text.includes('ErrorException')) {
                message_key = 'UnknownError';
            } else if (content_text.includes('No Beacons')) {
                message_key = 'NoData';
            } else if (content_text.includes('A conversion metric has not been defined')) {
                message_key = 'ConversionMetric';
            } else if (content_text.includes('mPulse Tenant not found')) {
                message_key = 'Tenant';
            }  else if (
                content_text.includes('does not exist or you do not have access to it')
                || content_text.includes('Could not find an endpoint for')) {
                message_key = 'Unauthorized';
            } else if (content_text.includes('A conversion metric has not been defined') 
                || content_text.includes('Please specify a conversion metric')) {
                message_key = 'ConversionMetric';
            } else if (
                content_text.includes('BoundsError')
                || content_text.includes('SQLException')
                || content_text.includes('SQL compilation error')) {
                message_key = 'Execution';
            } else if (content_text.includes('KeyError')) {
                if (content_text.includes('not found')) {
                    message_key = 'UnsupportedTimer';
                } else if (content_text.includes('mPulse Tenant')) {
                    message_key = 'Tenant';
                } else {
                    message_key = 'MissingFilters';
                }
            }
            if (message_key) {
                let st = content_text.indexOf(`"`);
                let en = content_text.lastIndexOf(`"`); 
                if (st > -1 && en > st) {
                    content_text = content_text.slice(st+1,en);
                }
            } else {
                content_text = false;
            }
            return [!!message_key, message_key, content_text];
        };


        const handleSocketMessage = (data, msg_type) => {

            let error, message_key, chartdata, message_text;
            const content_data = (data.content && data.content.data)? data.content.data : false,
                json_str = (content_data && content_data[MIME_CONTENT_TYPE_JSON])? content_data[MIME_CONTENT_TYPE_JSON] : false,
                text = (content_data && (data.content.data[MIME_CONTENT_TYPE_TEXT] || data.content.data[MIME_CONTENT_TYPE_HTML]))
                    ? data.content.data[MIME_CONTENT_TYPE_HTML] || data.content.data[MIME_CONTENT_TYPE_TEXT]
                    : false;

            if (text === 'END OF DATA') {
                window._log.debug('DSWBAPI - Socket EOM received');
                if (!state.socket_received_result && !state.socket_error_received) {
                    error = true;
                    message_key = 'NoData';
                }
                state.socket_EOM_received = true;
            }

            if (!error && !state.socket_EOM_received && !text && msg_type === 'execute_result') {

                if (!json_str) {
                    window._log.warn('DSWBAPI WEBSOCKET : received execute_result message with unsupported mimetype ', data);
                } else {

                    window._log.debug(`DSWBAPI WEBSOCKET : received execute_result data`, json_str);

                    try {
                        chartdata = JSON.parse(json_str);
                        state.socket_received_result = true;
                        window._log.info('DSWBAPI WEBSOCKET : parsed execute_result json ', chartdata);
                    } catch(e) {
                        message_key = 'Parse';
                        window._log.warn('DSWBAPI WEBSOCKET : ERROR PARSING EXECUTE_RESULT JSON ', e, chartdata);
                    }

                    if (Array.isArray(chartdata) && !chartdata.length) {
                        message_key = 'NoData';
                    }

                    error = !chartdata;
                }
            } else if (text && text.includes('timing_info') && data.content && data.content.source === 'julia') {
                // for performance to measure server timing (see akdv.performance.js)
                event_utils.dispatchCustomEvent(window, 'server-timing', 'akdv', { data: text }); 
            } else if (!error && !state.socket_received_result && !state.socket_EOM_received) {

                [error, message_key, message_text] = handleSocketMessageErrors(data, msg_type, text);
            } 

            let done = state.socket_received_result || state.socket_EOM_received || !!error;

            if (!done && msg_type === 'execute_input') {
                message_key = 'ServerProcessing';
            }

            if (error && !message_key) {
                message_key = 'Execution';
            }

            return [chartdata, error, message_key, message_text, done];
        };


        const onSocketDestroyCallback = () => {

            if (state.destroyed) { return; }
            destroy();
        };


        const onSocketMessageCallback = event => {

            let chartdata, data, msg_type, error, message_key, message_text, done = false, closeable_status_msg = false;

            if (!window.akdv.validate.fromSupportedOrigin(event.origin)) {
                window._log.warn('DSWBAPI WEBSOCKET : Socket message received from unsupported origin: ' + event.origin, event.data);
                done = true;
            } else {

                try {
                    data = JSON.parse(event.data);
                    msg_type = data.msg_type;
                } catch (err) {
                    window._log.warn('DSWBAPI WEBSOCKET : ERROR PARSING SOCKET RESPONSE', err);
                }

                window._log[(error || msg_type === 'error')? 'warn' : 'info']('DSWBAPI : Socket message received with type: ' + msg_type, data);

                if (!isAuthenticSocketData(data)) {
                    window._log.warn('DSWBAPI WEBSOCKET : NOT AUTHENTIC SOCKET MESSAGE', data);
                    [message_key, message_text] = ['UnknownError', ''];
                    closeable_status_msg = true;
                    error = done = true;
                } else {
                    [chartdata, error, message_key, message_text, done] = handleSocketMessage(data, msg_type);
                }
            }

            if (message_key) {
                statusNotifier[error? 'setCodeError' : 'setInfo'](Object.assign({ title: lang_utils.getLocalizedHTMLString(message_key, error? 'AKDV.Errors' : 'AKDV.Status'), type: error ? 'error' : 'info', description: message_text ? message_text : '', closeable: closeable_status_msg }, status_data()));
            }

            if (!error && chartdata) {
                statusNotifier.done(status_data());
                event_utils.dispatchCustomEvent(window, 'server-complete', concurrency_namespace || PROCESS_NAMESPACE, { uuid: state.uuid });
                event_utils.dispatchCustomEvent(window, result_event_type, state.uuid, Array.isArray(chartdata)? [chartdata] : chartdata);
            }

            state.socket_error_received = !!error;

            if (done) { destroy(); }
        };


        const socketRequestDataFromConnectedNotebook = (filters, additional_filters) => {

            if (!filters) {
                window._log.warn('DSWBAPI : no mpulse filters defined');
                throw 'DSWBAPI : no mpulse filters defined';
            }

            let mpulse_filters = [
                ...(filters.criteria || []),
                ...[{
                    attribute: 'mPulse Tenant',
                    value: serverInterface.tenant,
                    displayInToolbar: 'exclude'
                }],
                ...additional_filters
            ];

            let msg = {
                header: {
                    msg_id: string_utils.generateUUID(),
                    notebook_uuid: serverInterface.notebookuuid,
                    session: state.session.id,
                    username: 'username',
                    msg_type: 'execute_request',
                    version: '5.0'
                },
                metadata: {},
                content: {
                    silent: false,
                    store_history: false,
                    user_expressions: {},
                    allow_stdin: false,
                    filters: mpulse_filters
                },
                buffers: [],
                parent_header: {},
                channel: 'shell'
            };

            state.socket.send(msg);
        };


        // SESSION METHODS
        

        const onSessionError = (error) => {

            if (state.destroyed) { return; }
            
            destroy();
            
            let error_key = 'DSWBConnection';

            if (error && error.includes('No notebook associated with notebookuuid')) {
                error_key = 'NoNotebook';
            }

            window._log.warn('REMOTE SESSION : Error requesting remote session.', error);

            statusNotifier.setError(Object.assign({ title: lang_utils.getLocalizedHTMLString(error_key, 'AKDV.Error'), description: error }, status_data()));
        };


        const onSessionResponse = (session_json) => {

            if (state.destroyed) { return; }

            if (!validate.objHasRequiredKeys(session_json, REQUIRED_SESSION_RESPONSE_KEYS)) {
                state.connected = SESSION_CONNECTION_STATES.DISCONNECTED;
                throw 'Invalid DSWB session.';
            }

            state.session = session_json;          
            state.connected = SESSION_CONNECTION_STATES.CONNECTED;

            statusNotifier.setInfo(Object.assign({ title: lang_utils.getLocalizedHTMLString('Connecting', 'AKDV.Status') }, status_data()));

            state.socket = socketFactory({ 
                socket_uri: `${serverInterface.socket_base_uri}${encodeURIComponent(state.session.kernel.id)}/channels?session_id=${encodeURIComponent(state.session.id)}&mptoken=${serverInterface.token}`,
                onMessageCallback: onSocketMessageCallback,
                onDestroyCallback: onSocketDestroyCallback,
                onOpenCallback: e => statusNotifier.setInfo(Object.assign({ title: lang_utils.getLocalizedHTMLString('Connected', 'AKDV.Status') }, status_data()))
            });

            socketRequestDataFromConnectedNotebook(state.filters, state.additional_filters);
        };
             

        const init = async (params, data) => await window.akdv.xmlHTTP.postExpectingJSON({
            url: `${url}?${$.param(params)}`,
            options: { 'credentials': 'include' },
            data
        });


        // EXECUTION
        

        if (!serverInterface.has_required_params) {
            throw 'Missing params.';
        }

        statusNotifier.setInfo(Object.assign({ title: lang_utils.getLocalizedHTMLString('Requesting', 'AKDV.Status') }, status_data()));

        let params = serverInterface.sessionParams();
        let session_data = serverInterface.sessionData();

        state.connected = SESSION_CONNECTION_STATES.CONNECTING;

        window._log.debug2('REMOTE SESSION : Requesting.');

        init(params, session_data)
            .then(onSessionResponse)
            .catch(e => { onSessionError(e.message || e); });


        return Object.seal({

            get session() { return state.session; },
            get concurrency_namespace() { return state.concurrency_namespace; },
            get connected() { return state.connected && state.socket && state.socket.connected; },

            destroy
        });
    };


})(window, document, window.jQuery, window.akdv.utils_event, window.akdv.utils_lang, window.akdv.validate, window.akdv.utils_string, window.socketFactory);