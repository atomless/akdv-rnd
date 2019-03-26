;((window, document) => {

    'use strict';


    const LUT = Array(256).fill().map((v, i) => ((i < 16)? '0':'') + (i).toString(16));

    const string_utils = window.akdv.utils_string = {


        throwIfNANOrOOR(number) {

            if (isNaN(number)) {
                throw new TypeError('Expected a number');
            }

            if (number > 1e19 || number < -1e19) {
                throw new RangeError('Number arg outside of valid range between -1e19 and 1e19');
            }
        },

        // Generate a string literal template with arbitrarily many substitutions.
        // Usage (IMPORTANT, MUST OMIT BRACKETS IN THE INSTANTIATION CALL):
        // let template = window.akdv.utils_string.stringLiteralTemplate`Hello, ${0}. This is a ${1}`;
        // let final_string = template.with('world', 'test');
        // Also:
        // let template = window.akdv.utils_string.stringLiteralTemplate`${0}, ${0}, ${1}. ${2}. ${2} 1, 2, 3.`;
        // let final_string = template.with('Hello', 'World', 'Testing');
        stringLiteralTemplate : (literals, ...substitutions) => ({

            with() {

                let out = [], i, k;

                for (i = 0, k = 0; i < literals.length; i++) {
                    out[k++] = literals[i];
                    out[k++] = arguments[substitutions[i]];
                }

                out[k] = literals[i];
                
                return out.join('');
            }
        }),


        toStringLiteralTemplate(str) {

            const rx = /\$\{\d+\}/g;
            const arr = str.split(rx);
            const substitutions = (str.match(rx) || []).map(m => m.replace(/[\$+\{+\}+]/g, ''));

            return string_utils.stringLiteralTemplate(arr, ...substitutions);
        },


        getIndexOfSpaceFromIndex(text = window.required('text string'), index = 0, tolerance = 5) {

            let start = index - tolerance;

            return text.substring(start, index + tolerance).lastIndexOf(' ') + start;
        },


        ellipsizeText(
            text = window.required('text string'), 
            START_MIDDLE_OR_END = 'MIDDLE', 
            ELLIPSIS = '...',
            max_chars = false,
            ellipsis_index = false, 
            chars_to_chop = false,
            break_word = true,
            break_word_char_tolerance = 10) {

            const char_count = text.length;

            if (char_count > max_chars && (!chars_to_chop || char_count > chars_to_chop)) {
                switch(START_MIDDLE_OR_END.toUpperCase()) {
                    case 'PRE':
                    case 'LEFT':
                    case 'START':
                        ellipsis_index = char_count - (max_chars || chars_to_chop || 0);
                        if (!break_word && max_chars && ellipsis_index !== char_count) {
                            let space_index = string_utils.getIndexOfSpaceFromIndex(text, ellipsis_index, break_word_char_tolerance);
                            ellipsis_index = (space_index > -1 && space_index < char_count)? space_index : ellipsis_index;
                        }
                        text = `${ELLIPSIS}${text.substring(ellipsis_index)}`;
                    break;
                    case 'POST':
                    case 'RIGHT':
                    case 'END':
                        ellipsis_index = max_chars || (char_count - chars_to_chop);
                        if (!break_word && max_chars && ellipsis_index !== char_count) {
                            let space_index = string_utils.getIndexOfSpaceFromIndex(text, ellipsis_index, break_word_char_tolerance);
                            ellipsis_index = (space_index > -1 && space_index < char_count)? space_index : ellipsis_index;
                        }
                        text = `${text.substring(0, ellipsis_index)}${ELLIPSIS}`;
                    break;
                    default:
                        ellipsis_index = ellipsis_index || Math.floor(char_count * 0.5);
                        chars_to_chop = chars_to_chop || ((max_chars)? char_count - max_chars : 0);
                        let start_ellipsis_index, end_ellipsis_index, space_index, half_chars_to_chop = Math.ceil(chars_to_chop * 0.5);
                        if (!break_word && chars_to_chop) {
                            space_index = string_utils.getIndexOfSpaceFromIndex(text, ellipsis_index - half_chars_to_chop, break_word_char_tolerance);
                            start_ellipsis_index = (space_index > -1 && space_index < char_count)? space_index : ellipsis_index;
                            space_index = string_utils.getIndexOfSpaceFromIndex(text, ellipsis_index + half_chars_to_chop, break_word_char_tolerance);
                            end_ellipsis_index = (space_index > -1 && space_index < char_count)? space_index : ellipsis_index;
                        } else {
                            start_ellipsis_index = ellipsis_index - half_chars_to_chop;
                            end_ellipsis_index = ellipsis_index + half_chars_to_chop;
                        }
                        text = (chars_to_chop)
                            ? `${text.substring(0, start_ellipsis_index)}${ELLIPSIS}${text.slice(end_ellipsis_index)}`
                            : `${text.substring(0, ellipsis_index)}${ELLIPSIS}${text.slice(ellipsis_index)}`;
                    break;
                }
            }
            return text;
        },


        getInternationalizedNumberWithCurrencySymbolAndMagnitudeSuffix(
            number, 
            locale = window.akdv.utils_lang.locale, 
            currency = window.akdv.utils_lang.currency_code
        ) {
            let [exponent, suffix] = this.getNumberExponentAndSuffix(number);
            let currency_symbol = window.akdv.utils_lang.getCurrencySymbolForLocale(locale, currency);
            let is_prefix = window.akdv.utils_lang.isCurrencySymbolPrefixForLocale(locale, currency);
            let value = this._getInternationalizedNumber((number / Math.pow(10,exponent)).toFixed(1)) + suffix;

            return is_prefix? currency_symbol + value : value + ' ' + currency_symbol;
        },


        getInternationalizedNumberWithCurrencySymbol : (
            number, 
            locale = window.akdv.utils_lang.locale, 
            currency = window.akdv.utils_lang.currency_code, 
            options = { 
                style: 'currency', 
                currency: currency, 
                minimumFractionDigits: Math.abs(number) >= 1000? 0 : 2,
                maximumFractionDigits: Math.abs(number) >= 1000? 0 : 2
            }) => new Intl.NumberFormat(locale, options).format(number),


        // Please do not use directly. Use getFormattedNumberSD or getFormattedNumber instead.
        _getInternationalizedNumber : (number, locale = window.akdv.utils_lang.locale, options = {}) => new Intl.NumberFormat(locale, options).format(number),
        
        
        // get number to string formatted with commas
        getFormattedNumber(number, float_precision = 0, locale = window.akdv.utils_lang.locale) {

            if (Number(number) !== number) {
                return window.akdv.utils_lang.getLocalizedHTMLString('NaN', 'AKDV.Errors');
            }

            return string_utils._getInternationalizedNumber(number, locale, { maximumFractionDigits: float_precision, minimumFractionDigits: float_precision });
        },


        // get number to string formatted with commas to a specified significant digit
        getFormattedNumberSD(number, significant_digits = 1, locale = window.akdv.utils_lang.locale) {

            if (Number(number) !== number) {
                return window.akdv.utils_lang.getLocalizedHTMLString('NaN', 'AKDV.Errors');
            }

            return string_utils._getInternationalizedNumber(number, locale, { maximumSignificantDigits: Math.max(1, significant_digits) });
        },


        getFormattedInteger : (number, locale = window.akdv.utils_lang.locale) => string_utils.getFormattedNumber(number, 0, locale),


        // TODO : move this to the time utils
        getSecondsFormattedAsMinsAndSecs : (number = window.required) => {
            number = Math.round(number);
            let sign = number < 0 ? '-' : '';
            number = Math.abs(number);
            let s = number % 60;
            let st = s<10 ? '0' : ''
            let m = (number - s) / 60;
            return `${sign}${m}:${st}${s}`;
        },


        getNumberExponentAndSuffix(
            number = window.required('Number'),
            suffixes = window.akdv.utils_lang.getLocalization('SuffixesMap', 'AKDV.Magnitude')
        ) {

            string_utils.throwIfNANOrOOR(number);

            if (Math.abs(number) < 1000) {
                return [0, ''];
            }

            let size = parseInt(Math.abs(number)).toString().length;
            let exponent = (size % 3 === 0)? size - 3 : size - (size % 3);
            let suffix = '';

            for (const s in suffixes) {
                if (exponent < suffixes[s]) {
                    suffix = s;
                    break;
                }
            }

            return [exponent, suffix]
        },


        getAbbreviatedNumberWithOrderOfMagnitudeSuffix(
            number = window.required('Number'),
            locale = window.akdv.utils_lang.locale,
            suffixes = window.akdv.utils_lang.getLocalization('SuffixesMap', 'AKDV.Magnitude')
        ) {

            string_utils.throwIfNANOrOOR(number);

            if (Math.abs(number) < 1000) {
                return string_utils._getInternationalizedNumber(number);
            }

            let [exponent, suffix] = this.getNumberExponentAndSuffix(number, suffixes);
            let abbreviated_number = string_utils._getInternationalizedNumber(Math.round(10 * (number / Math.pow(10, exponent))) / 10);

            return locale? abbreviated_number.toLocaleString(locale) + suffix : abbreviated_number + suffix;
        },


        getAbbreviatedNumberWithOrderOfMagnitudeLabels : (
            number = window.required('Number'),
            locale = window.akdv.utils_lang.locale,
            labels = window.akdv.utils_lang.getLocalization('LabelsMap', 'AKDV.Magnitude')
        ) => string_utils.getAbbreviatedNumberWithOrderOfMagnitudeSuffix(number, locale, labels),


        getOrdinalSuffix : n => [,'st','nd','rd'][n%100>>3^1&&n%10]||'th',


        generateUUID() {

            let d0 = Math.random() * 0xffffffff|0;
            let d1 = Math.random() * 0xffffffff|0;
            let d2 = Math.random() * 0xffffffff|0;
            let d3 = Math.random() * 0xffffffff|0;

            return `${LUT[d0&0xff]}${LUT[d0>>8&0xff]}${LUT[d0>>16&0xff]}${LUT[d0>>24&0xff]}-${LUT[d1&0xff]}${LUT[d1>>8&0xff]}-${LUT[d1>>16&0x0f|0x40]}${LUT[d1>>24&0xff]}-${LUT[d2&0x3f|0x80]}${LUT[d2>>8&0xff]}-${LUT[d2>>16&0xff]}${LUT[d2>>24&0xff]}${LUT[d3&0xff]}${LUT[d3>>8&0xff]}${LUT[d3>>16&0xff]}${LUT[d3>>24&0xff]}`;
        },


        capitalizeAcronyms : (string, lookup = window.akdv.utils_lang.getLocalization('MediaTypes')) => String(string).replace(new RegExp(`\\b(${lookup.join('|')})\\b`, 'gi'), w => w.toUpperCase()),


        base64IDFromString : (s, _prefix) => ((_prefix)? _prefix + '-' : '') + btoa(s).replace(/=/g, ''),


        base64EncodeURLSafe : (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, ''),


        kebabCaseToSnakeCase : (string) => String(string).replace(/\-/g, '_'),


        snakeToKebabCase : (string) => String(string).replace(/_/g, '-'),


        upperCaseFirstLetter : (string) => String(string).charAt(0).toUpperCase() + string.slice(1),


        toTitleCase : (string) => window.akdv.utils_string.uppercaseWords(String(string).replace(/_|-|\s\s|-\s/g, ' ')),


        uppercaseWords : (string) => String(string).replace(/\b\w/g, (letter) => letter.toUpperCase()),


        toPascalCase : (string) => String(string).replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\s/g, ''),
        

        filenameFromURL : (url) => String(url).split('/').pop().replace(/(\?|\#)(.*)/,''),


        extensionFromFilename : (filename) => String(filename).split('.').pop(),


        uppercaseLabelFormat(string) { 

            return window.pipe(string_utils.uppercaseWords, string_utils.toTitleCase, string_utils.capitalizeAcronyms)(String(string));
        },


        getKeyAndNamespace(namespace_path) {

            let [namespace, key] = namespace_path.split(/\.([^.]+)$/);
            if (!key) {
                key = namespace;
                namespace = '';
            }

            return [key, namespace];
        }
    };


})(window, document);