;((window, document, localStorage, sessionStorage) => {

    'use strict';

    const STORAGE_EXCEPTION_FAILED_TO_SAVE_ITEM = 'STORAGE ERROR : Failed to save to storage, data : ';
    const STORAGE_EXCEPTION_FAILED_TO_SAVE_ITEM_QUOTA_EXCEEDED = 'STORAGE ERROR : Quota exceeded, data : ';
    const STORAGE_EXCEPTION_FAILED_TO_LOAD_ITEM = 'STORAGE ERROR : Failed to load from storage, key : ';
    const STORAGE_EXCEPTION_FAILED_TO_REMOVE_ITEM = 'STORAGE ERROR : Failed to remove from storage, key : ';
    const STORAGE_EXCEPTION_NOT_SUPPORTED = 'STORAGE ERROR : Not supported.';
    const STORAGE_EXCEPTION_ACCESS_DENIED = 'STORAGE ERROR : Access denied.';


    if (!('localStorage' in window)) {
        throw STORAGE_EXCEPTION_ACCESS_DENIED;
    } else {
        try {
            let ls = localStorage;
        } catch(e) {
            // Access denied 
            throw STORAGE_EXCEPTION_ACCESS_DENIED;
        }
    }


    const createStorage = (storage = window.required('Storage'), _name = undefined) => {

        const store_domain = storage === localStorage ? 'local' : 'session';
        let store_name = _name || `akdv-${store_domain}-datastore`;
    
        // === PUBLIC METHODS === //

        return {


            setItem(_item_key, data) {

                let item_key = this._key(_item_key);

                window._log.debug(`STORAGE : attempting to save to ${store_domain} storage with key: ${item_key}`, data);

                if (typeof data === 'undefined') {
                    throw STORAGE_EXCEPTION_FAILED_TO_SAVE_ITEM + 'undefined';
                }
                try {
                    storage.setItem(item_key, JSON.stringify({ data: data }));
                    window._log.debug(`STORAGE : set item : ${item_key}`, data);
                } catch(e) {
                    throw (this._isQuotaExceeded(e)
                        ? STORAGE_EXCEPTION_FAILED_TO_SAVE_ITEM_QUOTA_EXCEEDED 
                        : STORAGE_EXCEPTION_FAILED_TO_SAVE_ITEM) 
                        + JSON.stringify(data);
                }
            },


            setItemsFromObj(obj) {

                for (let key of Object.keys(obj)) {
                    this.setItem(key, obj[key]);
                }
            },


            getItem(_item_key) {

                let item_key = this._key(_item_key);
                let result;

                window._log.debug2(`STORAGE - attempting to load from ${store_domain} storage with key : ${item_key}`);
                
                try {
                    result = this._parse(storage.getItem(item_key));
                } catch(e) {
                    window._log.warn(`STORAGE ERROR - getItem : ${item_key}`, e);
                }
                if (!result) {
                    window._log.warn(`STORAGE ERROR - getItem : ${item_key} NOT FOUND.`);
                } else {
                    window._log.debug2(`STORAGE SUCCESS - got item : ${item_key}`, result);
                }
                return result;
            },


            removeItem(_item_key) {

                let item_key = this._key(_item_key);

                try {
                    storage.removeItem(item_key);
                    window._log.info('STORAGE : removed item', item_key);
                } catch(e) {
                    throw STORAGE_EXCEPTION_FAILED_TO_REMOVE_ITEM + e;
                }
                return true;
            },


            // === PRIVATE HELPERS === ///


            _key : (_item_key) => store_name + ':' + _item_key,


            _parse(result) {

                if (result) {
                    try {
                        result = JSON.parse(result).data;
                    } catch(e) {
                        window._log.warn(`ERROR : failed to parse ${store_domain} storage json:`, result);
                    }
                } else {
                    result = false;
                }
                return result;
            },


            _isQuotaExceeded(e) {

              let quota_exceeded = false;

              if (e) {
                if (e.code) {
                  switch (e.code) {
                    case 22:
                        // modern browsers
                        quota_exceeded = true;
                    break;
                    case 1014:
                        // Firefox
                        if (e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                            quota_exceeded = true;
                        }
                    break;
                  }
                } else if (e.number === -2147024882) {
                    // Internet Explorer 8
                    quota_exceeded = true;
                }
              }
              return quota_exceeded;
            }
        };
    };

window.akdv.storage = {

    init(_name) {
        
        window.akdv.storage = Object.assign(
            window.akdv.storage, {
            local: createStorage(localStorage, _name),
            session: createStorage(sessionStorage, _name)
        });
    }
}

})(window, document, window.localStorage, window.sessionStorage);