;((window, THREE, akdv, utils_typed_array, utils_obj) => {

    'use strict';

    const TypedArrayConstructors = utils_typed_array.TypedArrayConstructors;

    window.akdv.createTypedArrayItem = (name = window.required(), typed_array_constuctor = window.required(), size = 1) => (Object.seal({
        type: Object.freeze('TypedArrayItem'),
        name,
        typed_array_constructor: utils_typed_array.isTypedArray(typed_array_constuctor) && typed_array_constuctor,
        typed_array: null,
        buffer_attribute: null,
        size
    }));

    window.akdv.createTypedArrayStore = ({
        length = 0,
        square_length = false,
        typed_array_map = new Map()
    } = {}) => {

        const config = Object.seal({
            length: 0,
            square_length,
            typed_array_map: Array.isArray(typed_array_map) ? new Map(typed_array_map.map(item => [item.name, item])) : typed_array_map
        });

        const _self = {
            init() {

                this.length = length;
            },

            initTypedArray(typed_array_item = window.required()) {

                if (typed_array_item.type === 'TypedArrayItem') {
                    typed_array_item.typed_array = new typed_array_item.typed_array_constructor(config.length * typed_array_item.size);
                    if (!typed_array_item.buffer_attribute) {
                        typed_array_item.buffer_attribute = new THREE.BufferAttribute(typed_array_item.typed_array, typed_array_item.size);
                    } else {
                        typed_array_item.buffer_attribute.setArray(typed_array_item.typed_array);
                    }
                } else {
                    throw `Unsupported type for ${typed_array_item.datum_property}.`;
                }
            },

            getTypedArrayStoreItem(name = window.required()) {

                return config.typed_array_map.get(name);
            },

            getTypedArray(name = window.required()) {

                return config.typed_array_map.get(name).typed_array;
            },

            getBufferAttribute(name = window.required()) {

                return config.typed_array_map.get(name).buffer_attribute;
            },

            set length(value) {

                if (isNaN(+value)) {
                    throw 'length invalid setter';
                }

                if (config.square_length) {
                    value = Math.ceil(Math.sqrt(value));
                    value *= value;
                }

                if (value !== config.length) {
                    config.length = value;
                    config.typed_array_map.forEach((typed_array_item) => this.initTypedArray(typed_array_item));
                }
            },

            get length() {

                return config.length;
            },

            get squareLength() {

                return config.square_length || (Math.sqrt(config.length) % 1) === 0
            }
        };

        _self.init();

        return Object.freeze(Object.assign(utils_obj.extractGetterSetter(_self), utils_obj.bindAll(_self, {
            setLength: _self.setLength,
            getTypedArrayStoreItem: _self.getTypedArrayStoreItem,
            getTypedArray: _self.getTypedArray,
            getBufferAttribute: _self.getBufferAttribute
        })));
    }
})(window, window.THREE, window.akdv, window.akdv.utils_typed_array, window.akdv.utils_obj);