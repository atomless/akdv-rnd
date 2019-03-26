;((window, document, Ajv) => {

    'use strict';

    // keep this private and immutable
    const supported_origins = [
        /^(ws|http)s?\:\/\/localhost(\:(\d+)|\/|$)/i,
        /^(ws|http)s?\:\/\/.*\.(soasta|soasta-dswb)\.com(\:(\d+)|\/|$)/i
    ];


    window.akdv.validate = {


        initializeValidatorWithJSONSchema(json_schema) {

            let ajv = new Ajv({ useDefaults: true });
          
            return ajv.compile(json_schema);
        },
    
    
        json(json_data, jsonValidator, _json_schema) {
          
            if (_json_schema) {
                jsonValidator = this.initializeValidatorWithJSONSchema(_json_schema);
            }

            if (!jsonValidator) {
                throw 'JSON SCHEMA VALIDATOR UNDEFINED.';
            }

            let valid = false;

            try {
                valid = jsonValidator(json_data);
            } catch(e) {
                window._log.warn(`ERROR IN JSON : ${JSON.stringify(jsonValidator.errors)}`);
            }
          
            if (valid !== true) {
                window._log.warn(`ERROR IN JSON : ${JSON.stringify(jsonValidator.errors)}`);
            }

            return valid;
        },


        objHasRequiredKeys : (obj, required_keys_array) => {

            let valid = !required_keys_array.some((key) => !obj.hasOwnProperty(key));

            if (!valid) {
                window._log.warn('missing required keys', required_keys_array.filter(rk => Object.keys(obj).indexOf(rk) < 0));
            }
            return valid;
        },


        objectsInArrayHaveRequiredKeys : (obj_array, required_keys_array) =>
            !obj_array.some((obj, i) => !window.akdv.validate.objHasRequiredKeys(obj, required_keys_array)),



        hasValidDataFilename(filename) {
            
            let valid = filename.match(/^[a-z0-9_]+\.json$/i);

            if (!valid) {
                window._log.warn('Invalid data filename passed in : ' + filename);
            }

            return valid;
        },


        dataParam(data_param) {
            
            return (data_param && this.hasValidDataFilename(data_param));
        },


        nameParam(name_param) {

            let valid = name_param.match(/^[a-z0-9_-]+$/i);

            if (!valid) {
                window._log.warn(`Invalid name param : ${name_param}`);
            }

            return valid !== null;
        },


        fromSupportedOrigin : (origin) => (window.akdv.validate.url(origin) && supported_origins.some(regex => regex.test(origin))),


        isObject : (value) => value === Object(value),


        isFile : (value) => value instanceof File,


        isNumber : (value) => Number(value) === value,


        isInteger : (value) => Number(value) === value && value % 1 === 0,


        isFloat : (value) => Number(value) === value && value % 1 !== 0,


        isDOMNodeElement : (el) => (el && el.nodeType === Node.ELEMENT_NODE),


        isSVGTextElement : (el) => (el && typeof el.textContent !== 'undefined' && typeof el.getComputedTextLength === 'function'),


        isIterableListOfDOMNodeElements : (el_array) =>
            (el_array 
            && (NodeList.prototype.isPrototypeOf(el_array) || Array.isArray(el_array))
            && window.akdv.validate.isDOMNodeElement(el_array[0])),


        url : (url) => {

            let valid = false;

            if (url && typeof url === 'string') {
                try {
                    valid = typeof (new URL(url)) === 'object';
                } catch (e) { window._log.debug(e); }
            }
            return valid;
        }

    };


})(window, document, window.Ajv);