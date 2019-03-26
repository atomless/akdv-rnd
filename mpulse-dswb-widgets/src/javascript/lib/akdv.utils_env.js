;((window, document, $) => {

    'use strict';
  
    const UA = window.navigator.userAgent || '';
    const AKDV_STATIC_HOST_PRODUCTION = 'dswb-static.soasta.com';
    const MPULSE_HOST_PRODUCTION = 'mpulse.soasta.com';
    const MPULSE_HOST_TESTING = 'mpulse.soasta.com';
    const ORIGINAL_LOCATION_HASH = window.location.hash.substr(1);

    const env_utils = window.akdv.utils_env = {


        isIE : () => UA.indexOf('Trident/') > 0,


        versionOfIE : () => parseInt(UA.substring(UA.indexOf('rv:') + 3, UA.indexOf('.', UA.indexOf('rv:'))), 10),


        isIE11 : () => env_utils.isIE() && env_utils.versionOfIE() === 11,


        getFunctionNameAtIndexInCallStack(i = 0) {

            const stack_array = (new Error()).stack.split('\n');

            return stack_array[Math.max(0, Math.min(i + 3, stack_array.length - 1))].replace(/^\s+at\s+(.+?)\s.+/g, '$1');
        },


        getQueryParams(_include_hash_params = false, key_white_list = false) {

            let params_array = [
                ...window.location.search.substr(1).split('&'),
                ...((_include_hash_params)? ORIGINAL_LOCATION_HASH.split('&') : [])
            ];
            let params = {};
            let key_val;

            if (params_array === '') {
                return params;
            }
            params_array.forEach((param) => {

                key_val = param.split('=');
                if (key_val.length === 2 && (!key_white_list || key_white_list.includes(key_val[0]))) {
                    params[decodeURIComponent(key_val[0])] = decodeURIComponent(key_val[1].replace(/\+/g, ' '));
                }
            });
          return params;
        },


        getQueryParamValue(param_name) {

            let params = this.getQueryParams(true, [param_name]);
            if (!params.hasOwnProperty(param_name)) {
                window._log.warn(`WARNING : No '${param_name}' param present in url.`);
            }
            return params[param_name];
        },


        download({ content = window.required(), filename = 'untitled.txt' } = {}) {

            const mime_type_map = { 'json': 'application/json', 'csv': 'text/csv', 'tsv': 'text/tab-separated-values' };
            const filetype = filename.split('.').slice(-1).pop();
            const blob = new Blob([content], { type: mime_type_map[filetype] || 'text/plain' });
            const el = document.createElement('a');

            el.setAttribute('href', window.URL.createObjectURL(blob));
            el.setAttribute('target', '_blank');
            el.setAttribute('download', filename);
            el.click();
        },


        get in_iframe() {

            let in_iframe = false;

            try {
                in_iframe = (window.self !== window.top);
            } catch (e) {
                in_iframe = true;
            }
            return in_iframe;
        },


        get html_filename() {

            return location.pathname.split('/').pop().split('.').shift().replace(/_template/gi, '');
        },


        get host_url() {

            return `${location.protocol}//${location.hostname}${(location.port? ':' + location.port : '')}`;
        },


        get host_url_with_version() {

            return `https://${env_utils.akdv_static_host}${window.akdv.version ? '/' + window.akdv.version : ''}`;
        },


        get mpulse_host() {

            return location.host === AKDV_STATIC_HOST_PRODUCTION
                ? MPULSE_HOST_PRODUCTION 
                : env_utils.getQueryParamValue('mpulse-host') || MPULSE_HOST_TESTING;
        },


        get akdv_static_host() {
            
              return (window.akdv_lite_host && window.akdv_lite_host.replace(/^https?:\/\//, '')) || location.host;
        },


        get user_iso_lang_code() {

            return window.navigator.language || (window.navigator.languages)? window.navigator.languages[0] : window.navigator.userLanguage || window.navigator.language;
        }
    };


})(window, document, window.jQuery);