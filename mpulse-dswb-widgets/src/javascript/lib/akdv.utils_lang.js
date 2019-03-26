;((window, storage, env_utils, event_utils, obj_utils, dom_utils, string_utils, md) => {

    'use strict';
    

    const use_proxy = env_utils.getQueryParamValue('use-proxy');
    const dev_locale = env_utils.getQueryParamValue('dev-locale');
    const localization_rest_api_url = (use_proxy 
        ? `${env_utils.host_url}/aws-wisdom`
        : `https://${env_utils.mpulse_host}`) 
    + '/concerto/common/api/localization/v1';
    const key_map = {
       'devicetypename' : 'DeviceTypeName',
       'pagegroupname' : 'PageGroupName',
       'useragentname' : 'UserAgentName',
       'countrycode' : 'CountryCode',
       'mediatype' : 'MediaType',
       'host' : 'Host',
       'path' : 'Path'
    };

    const state = {

        loaded_lang_code: false,

        packages_to_load: new Set([ 'AKDV' ]),

        AKDV: {
            Magnitude: {
                LabelsMap: { 'Thousand': 6, 'Million': 9, 'Billion': 12, 'Trillion': 16 },
                SuffixesMap: { 'k': 6, 'M': 9, 'B': 12, 'T': 16 }
            },

            Metrics: {
                revenue: 'Average Order Value',
                duration: 'Session Duration',
                conversions: 'Conversion Rate',
                bounces: 'Bounce Rate',
                visit_time: 'Time on Page',
                pageviews: 'Session Length'
            },
        },

        TestFallback: 'Success', // Leave in place for automated test

        NumericalPreferences:  { 
            Default: {
                CurrencyCode: 'USD',
                DecimalSeparator: '.',
                ThousandsSeparator: ',',
                CurrencyDecimalPlaces: '2',
                PercentDecimalPlaces: '2',
                DecimalPlaces: '2',
                CurrencySymbol: '$',
                type: 'Default'
            }
        },

        MediaTypes: Object.seal(['html', 'css', 'xhr', 'js', 'jpeg', 'jpg', 'png', 'gif'])
    };


    const lang_utils = window.akdv.utils_lang = {

        getLocalization(key = window.required(), namespace = '') {

            key = key_map[key] || key;

            return window.akdv.utils_obj.getNamespaceInObj(state, `${namespace ? namespace + '.' + key : key}`) || key;
        },


        getLocalizationStringLiteral(key = window.required(), namespace = '') {

            return string_utils.toStringLiteralTemplate(lang_utils.getLocalization(key, namespace));
        },


        addLocalizedString(parent_element, key = window.required(), namespace = '', markdown = parent_element.getAttribute('data-markdown') === 'true') {

            dom_utils.throwExceptionIfNotDOMNodeElement(parent_element);

            const locale_string = lang_utils.getLocalization(key, namespace);

            parent_element.setAttribute('data-localization-namespace', namespace);
            parent_element.setAttribute('data-localization-key', key);
            parent_element.setAttribute('data-locale', locale_string === key? 'unlocalized' : lang_utils.locale);
            parent_element.setAttribute('data-markdown', !!markdown);
            parent_element.classList.add('localization');
            parent_element.innerHTML = markdown && md? md.render(locale_string) : locale_string;

            return locale_string;
        },


        getLocalizedSpanElement(key = window.required(), namespace = '', markdown = false) {

            const parent_element = document.createElement('span');

            lang_utils.addLocalizedString(parent_element, ...arguments);

            return parent_element;
        },


        getLocalizedHTMLString(key = window.required(), namespace = '', markdown = false) {

            return dom_utils.getHTMLStringFromElement(lang_utils.getLocalizedSpanElement(...arguments));
        },


        getCurrencySymbolForLocale(locale = lang_utils.locale, currency = state.NumericalPreferences.Default.CurrencyCode) {

            return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(1).replace(/[\s\d\.,]/gi, '');
        },


        isCurrencySymbolPrefixForLocale(locale = lang_utils.locale, currency = state.NumericalPreferences.Default.CurrencyCode) {

            return new Intl.NumberFormat(locale, {style: 'currency', currency}).format(0).slice(0,1) !== '0';
        },


        addPackageToLoad(package_name = window.required()) {

            state.loaded_lang_code = false;
            state.packages_to_load.add(package_name);
        },


        getLoadedPackage(package_name, locale = lang_utils.lang_code) {

            return storage.session.getItem(package_name + locale);
        },


        updateLocalizedTextElements(container = document) {

            const localization_elements = Array.from(container.querySelectorAll('.localization'))
                .filter(el => el.getAttribute('data-locale') !== lang_utils.locale);

            for (let localization_element of localization_elements) {
                lang_utils.addLocalizedString(localization_element, localization_element.getAttribute('data-localization-key'), localization_element.getAttribute('data-localization-namespace') || '');
            }
        },


        getNumericalPreferenceByName(name = window.required(), metric_name = false) {

            let pref, type = 'Currency';

            name = string_utils.upperCaseFirstLetter(name);

            if (state.NumericalPreferences[metric_name]) { 
                pref = state.NumericalPreferences[metric_name][name];
                type = string_utils.upperCaseFirstLetter(state.NumericalPreferences[metric_name].type.toLowerCase()) || type;
            }

            return pref || state.NumericalPreferences.Default[(name === 'DecimalPlaces')? `${type}DecimalPlaces` : name];
        },

        
        getNumericalTypeByName(metric_name = window.required()) {

            if (state.NumericalPreferences[metric_name]) { 
                return state.NumericalPreferences[metric_name].type;
            } else {
                return false;
            }
        },


        get locale() {

            let locale = storage.session && storage.session.getItem('locale') || 'en-US';
            try {
                new Date().toLocaleDateString(locale);
            } catch (e) {
                window._log.warn(`LANG : Unrecognized locale: ${locale}, defaulting to 'en-US'.`)
                locale = 'en-US';
            }
            
            return locale;
        },


        get lang_code() {

            let lang_code = storage.session && storage.session.getItem('langCode') || 'en-US';
            try {
                new Date().toLocaleDateString(lang_code);
            } catch (e) {
                window._log.warn(`LANG : Unrecognized language code: ${lang_code}, defaulting to 'en-US'.`)
                lang_code = 'en-US';
            }

            return lang_code;
        },


        get loaded_lang_code() {

            return state.loaded_lang_code;
        },


        get currency_code() {

            return lang_utils.getNumericalPreferenceByName('CurrencyCode');
        },


        get currency_decimal_places() {

            return lang_utils.getNumericalPreferenceByName('DecimalPlaces');
        },


        get timezone () {

            return (storage.session && storage.session.getItem('defaultTimeZone')) || 'UTC';
        }
    };


    const private_lang_utils = {


        loadPackage(package_name = window.required(), locale_package = window.required(), locale = window.required()) {

            if (locale !== state.loaded_lang_code || (package_name === 'AKDV' && !state.AKDV.hasOwnProperty('Errors')) || !state.hasOwnProperty(package_name)) {
                for (let localization of locale_package) {
                    obj_utils.setNamespaceInObj(state, localization.key.replace(/AKDV_Chart\./, ''), localization.value);
                }
                // Chart authors may find it useful to listen to this event (namespaced with their chart name),
                // however it should not be necessary. The prefered pattern is to call localization methods on load
                // and then the akdv localization system will automatically update all localized elements whenever
                // new locale packages are loaded.
                event_utils.dispatchCustomEvent(window, 'localization-package-loaded', package_name);
            }
        },


        updateLocalizedPreferences(prefs) {

            const keys = Object.keys(state.NumericalPreferences.Default);

            for (let pref of Object.entries(prefs)) {
                prefs[pref[0]] = obj_utils.filterKeysByArray(pref[1], keys);
                state.NumericalPreferences[pref[0]] = Object.assign({}, state.NumericalPreferences[pref[0]] || {}, prefs[pref[0]]);
            }

            state.NumericalPreferences.CurrencySymbol = lang_utils.getCurrencySymbolForLocale();
        },


        getDevLocalizationPackage : async (package_name = 'AKDV', locale = window.required()) => {

            const locale_package = await window.akdv.xmlHTTP.getJSON({
                url: `${window.akdv.config.data_uri}localization/ClientKeys_${package_name}.json`, 
                suppress_errors: true 
            });

            private_lang_utils.loadPackage(package_name, locale_package, locale);

            return locale_package;
        },


        fetchLocalizationPackage : async (package_name = 'AKDV', locale = lang_utils.lang_code) => {

            if (!storage.session) {
                throw new Error('fetchLocalizationPackage storage.session is not ready.');
            }

            let locale_package = storage.session.getItem(package_name + locale);

            if (!locale_package) {
                locale_package = await window.akdv.xmlHTTP.getJSON({
                    url: `${localization_rest_api_url}?locale=${locale}&packageName=${package_name}`,
                    headers: { 'Cache-Control': 'no-cache' },
                    options: use_proxy? {} : { 'mode': 'cors' },
                    suppress_errors: true
                }).catch(e => {
                    window.akdv.statusNotifier.setError({ 
                        title: lang_utils.getLocalizedHTMLString('Get', 'AKDV.Errors.Localization.XMLHTTP'), 
                        description: e.message || e,
                        trace: e.stack,
                        closeable: true
                    });    
                });
                if (locale_package) {
                    storage.session.setItem(package_name + locale, locale_package);
                }
            }
            if (locale_package) {
                private_lang_utils.loadPackage(package_name, locale_package, locale);
            }
            
            return locale_package;
        },


        getLocalizationPackages : async (locale = lang_utils.lang_code) => {

            for await (let p of Array.from(state.packages_to_load).map(package_name => 
                (dev_locale)
                    ? private_lang_utils.getDevLocalizationPackage(package_name, locale) 
                    : private_lang_utils.fetchLocalizationPackage(package_name, locale))) {
                window._log.debug(`Loaded Localization Package: ${p}`);
            }

            lang_utils.updateLocalizedTextElements();

            state.loaded_lang_code = locale;
        }
    };


    $(window).on('init-charts.akdv', e => {

        private_lang_utils.getLocalizationPackages('en-US');
    });

    $(window).on('repository-session-ready.akdv', e => {

        private_lang_utils.getLocalizationPackages();
    });

    $(window).on('mpulse-preferences-ready.akdv', (e, prefs) => {

        private_lang_utils.updateLocalizedPreferences(prefs);
    });

})(window, window.akdv.storage, window.akdv.utils_env, window.akdv.utils_event, window.akdv.utils_obj, window.akdv.utils_dom, window.akdv.utils_string, window.markdownit && window.markdownit());