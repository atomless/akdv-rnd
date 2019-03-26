;((window, document, fetch, data_utils, event_utils, lang_utils, validate, statusNotifier) => {

    'use strict';


    const hasContent = (response) => response.status !== 204 && response.statusText !== 'No Content';


    const handleRequestErrors = async (http_method, url, response) => {

        window._log.debug('CONTENT-TYPE', response.headers.get('Content-Type'));
        window._log.debug('TIMESTAMP', response.headers.get('Date'));
        window._log.debug('STATUS', response.status);
        window._log.debug('STATUSTEXT', response.statusText);
        window._log.debug('RESPONSE TEXT', response);
        window._log.debug('RESPONSE TYPE', response.type);
        window._log.debug('RESPONSE URL', response.url);

        if (response.redirected === true) {
            window._log.warn('REQUEST REDIRECTED FROM : ' + url + ' TO ', response.url);
        }

        // if all is well pass on the response on down the promise chain
        if (response && response.status >= 200 && response.status < 400) {
            return Promise.resolve(response);
        } else if (response && response.status === 0 && response.type !== 'opaque') {
            throw 'Unauthenticated';
        } else if (response && response.status) {
            let status_text = `Error in ${http_method} request to ${url}: ${response.status} ${(response && response.statusText) ? ' ('+response.statusText+')' : ''}`;
            window._log.warn(status_text);
            try {
                let response_json = await response.json().then(obj => obj);
                status_text = response_json.message;
            } catch(e) {
                // no error required here
            }
            throw status_text;
        }
    };


    const handleJSONResponse = (http_method, url, response) => response.json()
        .then(data => {

            window._log.info('PARSED JSON RESPONSE', data);
            return data;              
        })
        .catch(error => {

            window._log.warn(http_method + ' : ERROR PARSING JSON ' + JSON.stringify(error), response);
            return {};
        });


    const request = (http_method, url, _data, _headers, _options, _suppress_errors = false) => {

        let options = { method : http_method, ...(_options || {}) };

        if (_data) {
            options.body = _data;
        }

        if (_headers) {
            options.headers = _headers;
        }

        window._log.debug(http_method + ' : ' + url + ' : ', options);

        return fetch(url, options)
            .then(response => handleRequestErrors(http_method, url, response))
            .catch(error => {
                if (!_suppress_errors) {
                    if (statusNotifier) {
                        statusNotifier.setError({ 
                            title: lang_utils.getLocalizedHTMLString('FetchTitle', 'AKDV.Errors'), 
                            description: (error && error.message ? error.message : lang_utils.getLocalizedHTMLString('Fetch', 'AKDV.Errors'))+ ': ' + url
                        });
                    } else {
                        throw new Error(lang_utils.getLocalizedHTMLString('Fetch', 'AKDV.Errors'));
                    }
                }
                window._log.warn('FAILED ' + http_method + ' REQUEST TO ' + url, options);
                return Promise.reject(options.mode === 'cors' && error.message && error.message.includes('Failed to fetch')
                    ? new TypeError(`${error.message}: ${url} (mode 'cors', possible cross origin issue)`)
                    : error + `: ${url}`);
            });
    };


    const makeArrayKeyForFormData = key => (key.length > 2 && key.lastIndexOf('[]') === key.length - 2)? key : key + '[]';


    const convertToFormData = (data, _form_data, _prev_key) => {

        if (!_form_data && !validate.isObject(data)) {
            throw 'ERROR - cannot convert ' + (typeof data) + ' to FormData.';
        }

        let form_data = _form_data || new FormData();

        if (validate.isObject(data) 
        && !Array.isArray(data) 
        && !validate.isFile(data)) {

            Object.getOwnPropertyNames(data).forEach(prop_name => {

                let key = (_prev_key)? _prev_key + '[' + prop_name + ']' : prop_name;

                convertToFormData(data[prop_name], form_data, key);
            });

        } else if (Array.isArray(data)) {

           data.forEach(value => convertToFormData(value, form_data, makeArrayKeyForFormData(_prev_key)));
        } else {

            form_data.append(_prev_key, data);
        }
        return form_data;
    };


    const xmlHTTP = window.akdv.xmlHTTP = {

        // Returns a promise.
        get : ({ url, headers, options} = {}) => request('GET', url, false, headers, options),


        // Returns a promise.
        getJSON : ({ url, headers, options, suppress_errors = false } = {}) => 
            request('GET', url, false, { 'Content-Type' : 'application/json', ...(headers || {})}, options, suppress_errors)
                .then((response) => (hasContent(response))? handleJSONResponse('GET JSON', url, response) : {}),
        

        // Returns a promise.
        getFile : ({ url, headers, options } = {}) => 
            (data_utils.getfileExtension(url) === 'json')
            ? xmlHTTP.getJson({ url, headers, options }) 
            : xmlHTTP.get({ url, headers, options })
                .then(response => response.text()),


        // Returns a promise.
        post : ({ url, data, headers, options, suppress_errors = false } = {}) => request('POST', url, data? JSON.stringify(data) : data, headers, options, suppress_errors),

        put : ({ url, data, headers, options, suppress_errors = false } = {}) => request('PUT', url, data? JSON.stringify(data) : data, headers, options, suppress_errors),

        putExpectingJSON : ({ url, data, headers, options, suppress_errors = false } = {}) => xmlHTTP.put({ url, data, headers, options, suppress_errors })
            .then(response => (hasContent(response))
                ? handleJSONResponse('POST EXPECTING JSON', url, response)
                : {}),

        // Returns a promise.
        // Requests to jupyter notebook api are sent as expecting text/plain
        // as the response content-type but if successful they should be json
        // the reason for this is that it avoids the perf hit of the options headers
        // incurred when sending content-type application/json.
        // This convenience wrapper detects response status, parses the JSON
        // for all successful requests, handles any errors and returns a promise 
        // that can be chained expecting a json object as the resolution value.
        postExpectingJSON : ({ url, data, headers, options, suppress_errors = false } = {}) => xmlHTTP.post({ url, data, headers, options, suppress_errors })
            .then(response => (hasContent(response))
                ? handleJSONResponse('POST EXPECTING JSON', url, response)
                : {}),


        // Returns a promise.
        postFormData : ({ url, data, headers, options } = {}) => request('POST', url, convertToFormData(data), headers, options)

    };


})(window, document, window.fetch, window.akdv.utils_data, window.akdv.utils_event, window.akdv.utils_lang, window.akdv.validate, window.akdv.statusNotifier);