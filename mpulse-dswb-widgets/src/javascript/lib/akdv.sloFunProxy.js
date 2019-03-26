;((window, document, $) => {

    'use strict';
  
    // NOTE : THIS IS INTENDED ONLY FOR USE WITH REEAAALLLY SLOW, COSTLY FUNCTIONS.
    // USAGE : window.akdv.sloFunProxy.cache(window.myslowfn, args_array, unique_key_string);
    
    window.akdv.sloFunProxy = {


        config : Object.seal({
            key_prefix: 'akdv:sloFunProxy',
            cache: {}
        }),


        init() {

            this.addEventListeners();
        },


        cache(fn, args_array, unique_key = '', use_local_storage = false) {

            let key = `${this.config.key_prefix}:${fn.name}:${String(args_array)}:${unique_key}`;
            let result = this._get(key, use_local_storage);

            if (typeof result === 'undefined') {
                result = fn(...args_array);
                this._set(key, result, use_local_storage);
            } 
            return result;
        },


        // ==== PRIVATE ====


        _get(key, use_local_storage) {

            return (use_local_storage)
                ? window.akdv.storage.local.getItem(key)
                : this.config.cache[key];
        },


        _set(key, result, use_local_storage) {
            
            if (use_local_storage) {
                window.akdv.storage.local.setItem(key, result);
            } else {
                this.config.cache[key] = result;
            }
        },


        // ==== EVENTS ====


        onClearCache(e, theme_id) {

            let key;

            for (key in localStorage) {
                if (key.indexOf(this.key_prefix) === 0) {
                    window.akdv.storage.local.removeItem(key);
                }
            }
            for (key in this.config.cache) {
                delete this.config.cache[key];
            }
        },


        addEventListeners() {

            $(window).on('clear-slo-fun-cache.akdv', this.onClearCache.bind(this));
        }

    };


})(window, document, window.jQuery);