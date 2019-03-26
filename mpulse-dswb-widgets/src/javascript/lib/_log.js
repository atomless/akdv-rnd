;((window, document, $) => {

    'use strict';

    const config = {
        suppressed_log_words : [],
        suppressed_log_strings : [], //[ 'VALID :' ]        
        levels : Object.freeze({
            VERBOSE : 'verbose',
            DEBUG : 'debug',
            INFO : 'info',
            WARN : 'warn',
            ERROR : 'error'
        }),
        dom_logging : window.location.href.search('dom-debug=true') > -1,
        dom_log_container : false,
        css : {
            debug2 : 'color: hsl(250, 50%, 55%)',
            debug : 'color: hsl(205, 50%, 50%)',
            info : 'color: hsl(100, 70%, 30%)',
            warn : 'color: hsl(50, 100%, 40%)',
            error : 'color: hsl(0, 100%, 55%)'
        },
        level : 'info',
        verbose : false
    };

    window._log = {


        init () {

            if (config.dom_logging) {
                config.dom_log_container = document.createElement('div');
                config.dom_log_container.innerHTML = '<div id="log" style="position: absolute; bottom: 0; left: 0; z-index: 100000; border: 1px solid white; padding: 1rem; width: 100%; height: 20%; overflow: scroll;"></div>';
                document.body.appendChild(config.dom_log_container);
                config.dom_log = $('#log');
            }

            config.levels_map = [
                config.levels.ERROR,
                config.levels.WARN,
                config.levels.INFO,
                config.levels.DEBUG,
                config.levels.VERBOSE
            ];
            config.include_trace = this.includeTrace;
            config.level = this.loggingLevel;
            config.verbose = this.isVerboseLogging;
        },


        debug2 (message, data, _calling_function, color = config.css.debug2) {

            if (config.level > 3) {
                this._console_output('debug', message, data, _calling_function, color);
            }
        },


        debug (message, data, _calling_function, color = config.css.debug) {

            if (config.level > 2) {
                this._console_output('debug', message, data, _calling_function, color);
            }
        },


        info (message, data, _calling_function, color = config.css.info) {

            if (config.level > 1) {
                this._console_output('info', message, data, _calling_function, color);
            }
        },


        warn (message, data, _calling_function, color = config.css.warn) {

            if (config.level > 0) {
                this._console_output('warn', message, data, _calling_function, color);
            }
        },


        error (message, data, _calling_function, color = config.css.error) {

            this._console_output('error', message, data, _calling_function, color);
        },


        assert (assertion, msg) {

            if (console && config.level > 2 && typeof console.assert === 'function') {
                console.assert(assertion, msg);
            }
        },

      
        // === EVENTS === //
        

        onerror (error_msg, url, line_number, column, error_obj) {

            let trace = error_obj && error_obj.stack? error_obj.stack : error_msg;

            $(window).trigger('status.set.akdv', {type: 'error', title: `<span class="localization" data-localization-namespace="AKDV.Errors" data-localization-key="Error">Error</span>`, description: error_msg, trace, closeable: true});
            this.error('EXCEPTION - ' + error_msg + ' Script: ' + url + ' Line: ' + line_number + ' Column: ' + column + ' StackTrace: ', error_obj);
        },

        onpromiserejection (rejected_promise) {

             window._log.onerror(rejected_promise.reason);
        },

        // === PRIVATE METHODS === //
        

        _console_output (severity, _message, data, _calling_function, color = 'color: hsl(0,0,0)') {

            let message = _message || ' ';
            if (typeof message !== 'string') {
                message = JSON.stringify(message);
            }

            let suppressed_log_words = (config.verbose)? [] : config.suppressed_log_words;
            let suppressed_log_strings = (config.verbose)? [] : config.suppressed_log_strings;
            let style = this._getStyle(severity, message, color);
            let msg = this._concatMessageElements(severity, message, data, _calling_function);
            let contains_suppressed_word = message.split(' ').some((word) => suppressed_log_words.indexOf(word) > -1);
            let contains_suppressed_string = suppressed_log_strings.some((string) => message.indexOf(string) > -1);

            if (console && !contains_suppressed_word && !contains_suppressed_string) {
                if (data) { 
                    console[severity](style.caret + msg, style.css, data);
                } else {
                    console[severity](style.caret + msg, style.css);
                }
                if (config.include_trace) {
                    console.trace();
                }
                if (config.dom_logging) {
                    this._dom_output(message, data);
                }
            }
        },


        _dom_output (message, data) {

            if (data) { 
                config.dom_log.append('<p>' + message + ' : ' + JSON.stringify(data) + '</p>');
            } else {
                config.dom_log.append('<p>' + message + '</p>');
            }
            if (config.dom_log.find('p').length > 1000) {
                $('p:first-child', config.dom_log).remove();
            }
        },


        // === HELPERS === //


        getParam(key) {

            const param = window.location.search.match(new RegExp(`${key}=([^&]*)`));
            return param? param[1] : false;
        },


        get isVerboseLogging() {

            return this.loggingLevel > 3;
        },


        get loggingLevel() {

            return (config.dom_logging)? 3 : parseInt(this.getParam('debug') || '0');
        },


        get includeTrace() {

            return parseInt(this.getParam('trace') || '0') > 0;
        },


        _concatMessageElements (severity, message, data, _calling_function) {

            let msg = (typeof _calling_function !== 'undefined')
                ? _calling_function + ' - ' + message
                : message;

            msg += (data)? ' :' : '';

            return msg;
        },


        _getStyle (severity, message, color) {

            if (color.indexOf('color: ') < 0) {
                color = 'color: ' + color;
            }

            return {
                caret: '%c',
                css: color // + 'font-weight: bold;' // potential to add further style/css support here
            }
        },


        outputCopyrightAndVersionInfoToLog (build_meta) {

            if (config.level > 0) {
                console.log('%c' + [
                '',
                '---------------------------------------------------------------------',
                'Copyright (c) ' + (new Date().getFullYear()) + ' Akamai',
                'Akamai Data Visualisation',
                'compilation date : ' + build_meta.compilation_date,
                '@version : ' + build_meta.version,
                '@platform : ' + ((navigator)? navigator.platform : 'unknown'),
                '---------------------------------------------------------------------',
                ''].join('\n'), config.css.info);
            }
        }


    };

    window.onerror = window._log.onerror.bind(window._log);
    window.onunhandledrejection = window._log.onpromiserejection.bind(window._log);
    window._log.init();

})(window, document, window.jQuery);