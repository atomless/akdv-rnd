;((window) => {

    'use strict';
  

    window.akdv.utils_obj = {

        bindAll(context, obj) {

            Object.getOwnPropertyNames(obj)
                .filter(name => typeof obj[name] === 'function')
                .forEach(name => {
                    obj[name] = obj[name].bind(context);
                });

            return obj;
        },


        // Extend object (including getters/setters)
        extend(obj, ...args) {
            
            args.forEach((source) => {
                let descriptor, prop;
                if (source) {
                    for (let prop of Object.keys(source)) {
                        descriptor = Object.getOwnPropertyDescriptor(source, prop);
                        Object.defineProperty(obj, prop, descriptor);
                    }
                }
            });

            return obj;
        },


        // Update only existing properties
        update(obj, ...args) {

            args.forEach(o => {
                for (const key of Object.keys(o)) {
                    if (key in obj) {
                        obj[key] = o[key];
                    }
                }
            });

            return obj;
        },


        keysWithValueChanges : (obj_a, obj_b) => Object.keys(obj_a).filter(k => obj_b.hasOwnProperty(k) && obj_b[k] !== obj_a[k]),


        extractGetterSetter(obj, _bindContext = true) {
            
            return Object.entries(Object.getOwnPropertyDescriptors(obj))
                .filter(([key, descriptor]) => typeof descriptor.get === 'function' || typeof descriptor.set === 'function')
                .reduce((result, descriptor) => {
                    let descriptorValue = descriptor[1];
                    if (_bindContext) {
                        descriptorValue = {
                            get: descriptor[1].get && function() {
                                return descriptor[1].get.call(obj);
                            },
                            set: descriptor[1].set && function(value) {
                                descriptor[1].set.call(obj, value);
                            }
                        }
                    }

                    Object.defineProperty(result, descriptor[0], descriptorValue);

                    return result;
                }, {});
        },


        factoryExports(private_obj, public_obj) {

            return Object.seal(Object.assign(this.extractGetterSetter(private_obj), this.bindAll(private_obj, public_obj)));
        },


        getKeyByValue(obj, value) {

          return Object.keys(obj).find(key => obj[key] === value);
        },


        filterKeysByArray(src_obj, keys_array, key_map = {}) {

            return keys_array.reduce((obj, key) => {
                if (src_obj.hasOwnProperty(key)) { 
                    obj[key_map[key]? key_map[key] : key] = src_obj[key]; 
                }
                return obj; 
            }, {});
        },


        getNamespaceInObj(obj, namespace_str) {
            
            return namespace_str.split('.').reduce((a, b) => (typeof a === 'object') ? a[b] : undefined, obj);
        },


        setNamespaceInObj(obj, key, value) {

            const namespace_keys = key.split('.');
            for (let token of namespace_keys.slice(0, -1)) {
                if (!obj[token]) {
                    obj[token] = {};
                }
                obj = obj[token];
            }
            obj[namespace_keys.pop()] = value;
        },


        applyTransformMapToValuesInObjectByKey(obj, transform_map) {

            for (let key of Object.keys(obj)) {
                if (transform_map.hasOwnProperty(key) && typeof obj[key] === 'string') {
                    obj[key] = obj[key].replace(transform_map[key].regex, transform_map[key].replace);
                }
            }

            return obj;
        },


        applyTransformMapKeys(obj, transform_map) {

            for (let key of Object.keys(transform_map)) {
                if (obj.hasOwnProperty(key)) {
                    obj[transform_map[key]] = obj[key];
                    delete obj[key];
                }
            }

            return obj;
        },  
    };


})(window);