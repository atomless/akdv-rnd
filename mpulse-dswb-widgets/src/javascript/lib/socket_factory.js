;((window, document) => {


    'use strict';

    const CONNECTION_STATES = Object.freeze({
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3
    });

    window.socketFactory = ({
        socket_uri,
        reconnect_on_error = false,
        onOpenCallback = e => {},
        onErrorCallback = e => {},
        onCloseCallback = e => {},
        onMessageCallback = e => {},
        onDestroyCallback = e => {}
    } = {}) => {
        

        const state = {
            websocket: {},
            connected_timestamp_ms: false,
            unsent_message_queue: [],
            idle_timeout_period_ms: 3600000,
            idle_timeout: false,
            destroyed: false
        };


        const destroy = () => {

            state.destroyed = true;
            state.unsent_message_queue.length = 0;
            state.websocket.onmessage = e => {};
            state.websocket.onclose = e => {};
            state.websocket.onerror = e => {};
            state.websocket.onopen = e => {};
            state.websocket = {};
            onDestroyCallback();
        };


        const close = (initiate_reconnect = false) => {

            window._log.info('WEBSOCKET : CLOSING');
            window.clearTimeout(state.idle);

            if (state.websocket && state.websocket.readyState < CONNECTION_STATES.CLOSING) {
                state.websocket.close();
            }

            if (initiate_reconnect) {
                 window._log.info('WEBSOCKET : reconnecting bla...');
            } else {
                destroy();
            }

            state.connected_timestamp_ms = false;
        };


        const resetIdleTimout = e => {

            window.clearTimeout(state.idle_timeout);
            state.idle_timeout = window.setTimeout(e => close(), state.idle_timeout_period_ms + 100);
        };


        const send = (msg) => {

            if (state.destroyed) { return false; }

            let sent = false;

            window._log.info('WEBSOCKET : attempting sending over websocket', msg);

            if (state.websocket && state.websocket.readyState === CONNECTION_STATES.OPEN) {

                state.websocket.send(JSON.stringify(msg));

                window._log.info('WEBSOCKET : sent msg over websocket', msg);

                sent = true;
            } else {
                state.unsent_message_queue.push(msg);
            }

            return sent;
        };


        const sendUnsentMessages = () => {

            state.unsent_message_queue = state.unsent_message_queue.filter(msg => !send(msg));
        };


        const onOpen = (e) => {

            state.connected_timestamp_ms = Date.now();

            window._log.debug('WEBSOCKET : opened', e);

            sendUnsentMessages();
            onOpenCallback();

            return e;
        };


        const onError = (e) => {
            
            window._log.warn('WEBSOCKET : WebSocket error.', e);
            close(reconnect_on_error);
            onErrorCallback();

            return e;
        };


        const onClose = (e) => {
            
            window._log.info('WEBSOCKET : closed. So keep alive loop cancelled and session invalidated.', e);
            close();
            onCloseCallback();
        };


        const onMessage = (e) => {

            resetIdleTimout();
            onMessageCallback(e);
        };


        const open = () => new Promise((resolve, reject) => {

            try {
                window._log.debug('WEBSOCKET : CONNECTING ON ', socket_uri);
                state.websocket = new WebSocket(socket_uri);
            } catch(e) {
                window._log.warn('WEBSOCKET : WebSocket failure ', e);
                // retry loop ?
                throw e;
            }
    
            resetIdleTimout();
            state.websocket.onmessage = onMessage;
            state.websocket.onclose = onClose;
            state.websocket.onerror = e => reject(onError());
            state.websocket.onopen = e => resolve(onOpen());
        });


        open();

        return Object.seal({

            get socket() { return state.socket; },

            get connected() { return state.websocket && state.websocket.readyState === CONNECTION_STATES.OPEN; },

            get closing() { return state.websocket && state.websocket.readyState >= CONNECTION_STATES.CLOSING; },

            send,
            close
        });
    };



})(window, document);