;((window, document, env_utils, lang_utils, event_utils, statusNotifier) => {


    'use strict';


    window.dswbServerInterfaceFactory = ({
        tenant = false,
        token = false,
        host = 'mpulse-widgets001-usw2.soasta-dswb.com',
        mpdev = false,
        notebookuuid = false,
        background = false
    } = {}) => {


        const state = Object.seal({
            tenant,
            token,
            host,
            mpdev,
            base_uri: '',
            socket_base_uri: '',
            notebook_base_uri: '',
            sessions_path: 'sessions',
            notebookuuid,
            has_required_params : false
        });

        const hasQueryParamsRequiredToConnectToDSWB = (params) => 
            !!(params
            && params.token
            && (state.host || params.ipython || params.host)
            && (params.notebook || params.notebookuuid)
            && params.hasOwnProperty('tenant'));

        let params = env_utils.getQueryParams(true, Object.keys(state));

        Object.assign(state, params);

        state.host = (env_utils.getQueryParamValue('host') || env_utils.getQueryParamValue('ipython') || state.host).replace(/\/+$/, '');
        state.base_uri = 'https://' + state.host + '/api/';
        state.notebook_base_uri = state.base_uri + 'contents';
        state.socket_base_uri = 'wss://' + state.host + '/api/kernels/';
        state.token = state.token || window.mpulse_token; // in dev env outside of mpulse the mpulse_token will be available in the window scope
        state.has_required_params = hasQueryParamsRequiredToConnectToDSWB(state);

        if (!state.has_required_params) {
            statusNotifier.setError({ title: lang_utils.getLocalizedHTMLString('MissingParam', 'AKDV.Error'), type: 'error', background });
        }

        const sessionParams = () => {

            let params = {};

            params['tenant-id'] = state.tenant;

            if (state.mpdev) {
                params.token = state.token;
            } else {
                params.mptoken = state.token;
            }

            params.uniquekernel = true;
            params.notebookuuid = state.notebookuuid;

            return params;
        };


        const sessionData = () => ({
            kernel : { name : 'julia-0.4' },
            notebook: { notebookuuid : state.notebookuuid }
        });


        return Object.seal({
            get tenant() { return state.tenant },
            get token() { return state.token },
            get host() { return state.host },
            get base_uri() { return state.base_uri },
            get socket_base_uri() { return state.socket_base_uri },
            get notebook_base_uri() { return state.notebook_base_uri },
            get has_required_params() { return state.has_required_params; },
            get sessions_path() { return state.sessions_path; },
            get notebookuuid() { return state.notebookuuid; },
            set notebookuuid(id) { state.notebookuuid = id; },
            sessionParams,
            sessionData
        });

    };


})(window, document, window.akdv.utils_env, window.akdv.utils_lang, window.akdv.utils_event, window.akdv.statusNotifier);