;((window, document, $, mpulse_filter_types, validate, env_utils, lang_utils, obj_utils, data_utils, event_utils, string_utils, storage, xml2json, statusNotifier) => {

    'use strict';

    const empty_filters = {
        'enabled': true,
        'unionType': 'all',
        'showToolbar': true,
        'criteria': []
    };

    const empty_filter = {
        attribute: '',
        comparator: 'Is',
        copiedFromDashboard: false,
        displayInToolbar: false,
        displayLabel: '',
        secondaryValue: '',
        tertiaryValue: undefined,
        value: false,
        valueList: false
    };

    const use_proxy = env_utils.getQueryParamValue('use-proxy');
    const repository_host = use_proxy? `${env_utils.host_url}/mpulse` : `https://${env_utils.mpulse_host}`;
    
    const state = Object.seal({
        filters: {},
        linked_dashboard_path: false,
        popped_out: false,
        dashboard_id: false,
        widget_id: false,
        defer_request_on_filter_update: false
    });

    const config = Object.freeze({
        filters: {
            attribute_map : { // map fieldnames to mP friendly names
                'percentile': 'Percentile',
                'page_group': 'Page Group',
                'geo_netspeed': 'Connection Type',
                'user_agent_os': 'Operating System Family',
                'geo_cc': 'Country',
                'INITCAP(beacon_type)': 'Beacon Type',
                'user_agent_device_type': 'Device Type',
                'geo_isp': 'Internet Service Provider',
                'user_agent_model': 'Device',
                'user_agent_family': 'User Agent Family',
                'user_agent_major': 'User Agent Major',
                'domain': 'mPulse Domain',
                'timer': 'Timer',
                'ab_test': 'A/B Test',
                'timestamp': 'Date/Time',
                'user_agent_manufacturer': 'Device Manufacturer',
                'geo_rg': 'Region',
                'site_version': 'Site Version',
                'bandwidth_block': 'Bandwidth Block',
                'params_u': 'Full Url'
            }
        },

        repository_rest_service: {
            url: `${repository_host}/concerto/services/rest/RepositoryService/v1`,
            transform_map: {
                'langCode': {
                    // replace ALL occurrences of '-' with '_' and swap ALL 'en*(not:GB)' with 'en-US'
                    regex: /_|en(-|_)(?!GB)(.*)$/, 
                    replace: $0 => $0 === '_'? '-' : 'en-US' 
                },
                'locale': {
                    // replace ALL occurrences of '-' with '_' and swap ALL 'en*(not:GB)' with 'en-US'
                    regex: /_/, 
                    replace: '-' 
                }
            },
            token_whitelist: ['userName', 'userID', 'tenantID', 'tenantName', 'langCode'],
            user_whitelist: ['defaultTimeZone', 'locale'],
            tenant_whitelist: ['langCode'],
            token_transform_keys: {
                'localeKey': 'langCode'
            },
            tenant_transform_keys: {
                'locale': 'langCode'
            },
            default_preferences_whitelist: [
                'DefaultCurrencyCode',
                'DefaultDecimalSeparator',
                'DefaultThousandsSeparator',
                'DefaultCurrencyDecimalPlaces',
                'DefaultPercentDecimalPlaces',
            ],
            metric_preferences_whitelist: [
                'currencyCode',
                'decimalSeparator',
                'thousandsSeparator',
                'decimalPlaces',
                'type'
            ],
            preferences_map: {
                'DefaultCurrencyCode': 'CurrencyCode',
                'DefaultDecimalSeparator': 'DecimalSeparator',
                'DefaultThousandsSeparator': 'ThousandsSeparator',
                'DefaultCurrencyDecimalPlaces': 'CurrencyDecimalPlaces',
                'DefaultPercentDecimalPlaces': 'PercentDecimalPlaces',
                'DefaultCurrencySymbol': 'CurrencySymbol',
                'currencyCode': 'CurrencyCode',
                'decimalSeparator': 'DecimalSeparator',
                'decimalPlaces': 'DecimalPlaces',
                'thousandsSeparator': 'ThousandsSeparator'
            },
            preferences_custom_metric_type_whitelist: [ 'Percentage', 'Number', 'Currency' ]
        }

    });


    const mpulse = window.akdv.mpulse = {


        init : async ({ defer_request_on_filter_update = false } = {}) => {

            state.defer_request_on_filter_update = defer_request_on_filter_update;

            const token = env_utils.getQueryParamValue('token') || window.mpulse_token;

            if (token) {
                mpulse.addEventListeners();
                if (token !== storage.session.getItem('token') || !storage.session.getItem('langCode')) {
                    storage.session.setItem('token', token);
                    mpulse.updateSessionData(await mpulse.getSessionDataFromRepository(token));
                } else {
                    event_utils.dispatchCustomEvent(window, 'repository-session-ready', 'akdv');
                    mpulse.updateSessionData(await mpulse.getSessionDataFromRepository(token));
                }
            } else {
                window._log.warn('WARNING : No mPulse authentication.');
            }

            const dash_widget_id = env_utils.getQueryParamValue('widgetid');
            [state.dashboard_id, state.widget_id] = dash_widget_id? dash_widget_id.split('.') : [false, false];

            if (!env_utils.in_iframe) {
                // in place of the mpulse filters coming in via the post message api
                // request them from the repository and trigger them in the same way.
                await mpulse.requestFiltersFromRepository();
            } 

            return true;
        },


        getSessionDataFromRepository : async (token = window.required()) => {

            const token_data = await mpulse.requestTokenRepositoryData(token);
            const user_data = await mpulse.requestUserRepositoryData(token, token_data.userID);

            let session_data = {
                ...token_data,
                ...user_data
            };

            if (typeof session_data.langCode !== 'string') {
                if (session_data.tenantID) {
                    // Attempt to fetch just locale from tenant endpoint.
                    Object.assign(session_data, await mpulse.requestTenantRepositoryData(session_data.tenantID, token));
                } else {
                    window._log.warn('WARNING : Failed to request tenant repository data due to missing session tenant ID');
                }
            }

            obj_utils.applyTransformMapToValuesInObjectByKey(session_data, config.repository_rest_service.transform_map);

            if (!session_data.locale) {
                session_data.locale = session_data.langCode;
            }

            return session_data;
        },


        updateSessionData(session_data = window.required()) {

            const required_keys = config.repository_rest_service.token_whitelist;

            if (session_data && validate.objHasRequiredKeys(session_data, required_keys)) {
                storage.session.setItemsFromObj(session_data);
                event_utils.dispatchCustomEvent(window, 'repository-session-ready', 'akdv');   
            }   
        },


        requestTokenRepositoryData : async (token = window.required()) => {

            const token_data = await window.akdv.xmlHTTP.getJSON({ 
                url: `${config.repository_rest_service.url}/Tokens/${token}`, 
                headers: { 'cache-control': 'no-cache' }, 
                options: { redirect: 'error', ...!env_utils.in_iframe && { 'mode': 'cors' } }, 
                suppress_errors: true 
            })
            .catch(e => {
                window._log.warn(`WARNING : error requesting token data with token: ${token}`);
            });

            return token_data
                ? obj_utils.filterKeysByArray(obj_utils.applyTransformMapKeys(token_data, config.repository_rest_service.token_transform_keys), config.repository_rest_service.token_whitelist)
                : {};
        },


        requestUserRepositoryData : async (token, user_id) => {

            const user_data = await mpulse.requestRepositoryData({type: 'user', id: user_id, token});
            
            return (user_data && user_data.attributes && user_data.attributes.length)
                ? user_data.attributes
                    .filter(attr => config.repository_rest_service.user_whitelist.includes(attr.name))
                    .reduce((obj, attr) => {
                        obj[attr.name] = attr.value;
                        return obj;
                    }, {})
                : {};
        },


        requestTenantRepositoryData : async (tenant_id = window.required(), token = undefined) => {
            
            const tenant_data = await mpulse.requestRepositoryData({type: 'tenant', id: tenant_id, token});

            return obj_utils.filterKeysByArray(obj_utils.applyTransformMapKeys((tenant_data && tenant_data.attributes && tenant_data.attributes.length)
                ? tenant_data.attributes
                    .reduce((obj, attr) => {
                        obj[attr.name] = attr.value;
                        return obj;
                    }, {})
                : {}, config.repository_rest_service.tenant_transform_keys), config.repository_rest_service.tenant_whitelist);
        },


        requestFiltersFromRepository : async (dashboard_id = state.dashboard_id) => {

            let filters;

            if (dashboard_id) {
                statusNotifier.setInfo({ title: lang_utils.getLocalizedHTMLString('RequestingFilters', 'AKDV.Status') });

                const token = storage.session.getItem('token');

                const dashboard_data = await mpulse.requestRepositoryData({ type: 'dashboard', id: dashboard_id })
                    .catch(e => {
                        window._log.warn(`WARNING : error requesting data for dashboard with id: ${dashboard_id}`);
                        throw e;
                    });

                const dashboard_tenant_id = dashboard_data.tenantID;

                filters = mpulse.getDefaultFiltersFromDashboardXML(dashboard_data);

                if (filters.length) {
                    const domain_filter = filters.find(filter => filter.attribute === 'mPulse Domain');
                    if (domain_filter) {
                        await mpulse.updateDashboardFiltersWithPreferenceFilters(filters, dashboard_id, dashboard_tenant_id, domain_filter.value);
                    }
                    event_utils.dispatchCustomEvent(window, 'mpulse-filter-update', 'akdv', { criteria: filters }); 
                }
            } else {
                window._log.warn(`WARNING : missing dashboard id`);
            }

            return filters;
        },


        updateDashboardFiltersWithPreferenceFilters : async (filters = window.required(), dashboard_id = window.required(), tenant_id = window.required(), domain_id = window.required()) => {

            for await (let preference_filter of mpulse.getPreferenceFilters(dashboard_id, tenant_id, domain_id, filters)) {

                const filter = filters.find(filter => obj_utils.getKeyByValue(mpulse_filter_types, filter.attribute) === preference_filter.attributeType);
                
                if (filter) {
                    Object.assign(filter, preference_filter);
                }
            }
        },


        getPreferenceFilters : (dashboard_id = window.required(), tenant_id = window.required(), domain_id = window.required(), filters = window.required()) => 
            filters.map(filter => 
                mpulse.requestRepositoryData({ 
                    type: 'preference', 
                    query:`name=dashboard_filter_${tenant_id}:${dashboard_id}:${domain_id}:${obj_utils.getKeyByValue(mpulse_filter_types, filter.attribute) || filter.attribute}`
                }).then(mpulse.getFilterDataFromPreference)
            ),


        getFilterDataFromPreference(preference_data = window.required()) {

            let filter_data = {};

            if (preference_data.objects.length) {
                try {
                    filter_data = JSON.parse(preference_data.objects[0].attributes[0].value);
                } catch(err) {
                    window._log.warn(`WARNING : Filter data JSON parse error: ${err.message}`);
                }
            }

            return filter_data;
        },


        getDefaultFiltersFromDashboardXML(dashboard_data = window.required(), widget_id = state.widget_id) {

            const dashboard_obj = xml2json.xml_str2json(dashboard_data.body);
            let filters = [];

            if (dashboard_obj && dashboard_obj.Dashboard && dashboard_obj.Dashboard.Filter && dashboard_obj.Dashboard.Filter.Criterion) {

                filters = dashboard_obj.Dashboard.Filter.Criterion;
                const dashboard_widgets = Array.isArray(dashboard_obj.Dashboard.Widgets.Widget)
                    ? dashboard_obj.Dashboard.Widgets.Widget
                    : [dashboard_obj.Dashboard.Widgets.Widget];
                const widget = dashboard_widgets.find(w => w.id === widget_id);

                if (widget && widget.Filter && widget.Filter.Criterion) {
                    if (!Array.isArray(widget.Filter.Criterion) && widget.Filter.Criterion.hasOwnProperty('attribute')) {
                        widget.Filter.Criterion = [widget.Filter.Criterion];
                    }
                    filters = data_utils.mergeObjectsInArraysByKey(filters, widget.Filter.Criterion, 'attribute');
                    filters = data_utils.appendUniqueObjectsInArraysByKey(filters, widget.Filter.Criterion, 'attribute');
                }
            } else {
                window._log.warn(`WARNING : No filters present for dashboard ${dashboard_data.name}`);
            }              
            
            return filters;
        },


        getPreferencesStateFromFilters : async () => {

            const domain_data = await mpulse.requestRepositoryData({type: 'domain', id: mpulse.getDomainID()});
            !domain_data && window._log.warn(`WARNING : No domain data received from repository API`);
            
            return domain_data ? mpulse.getPreferencesFromDomainXML(domain_data) : false;
        },


        updatePreferences(domain_id = window.required(), preferences_obj = window.required()) {

            if (preferences_obj) {
                storage.session.setItem(`${domain_id}_preferences`, preferences_obj);
                event_utils.dispatchCustomEvent(window, 'mpulse-preferences-ready', 'akdv', preferences_obj);            
            } else {
                window._log.warn(`WARNING : Attempting to set empty preferences object`);
            }
        },


        getPreferencesFromDomainXML(domain_data = window.required()) {

            const domain_obj = xml2json.xml_str2json(domain_data.body);
            let preferences_obj = {}; 

            if (domain_obj && domain_obj.Domain) {
                preferences_obj = obj_utils.filterKeysByArray(domain_obj.Domain, config.repository_rest_service.default_preferences_whitelist, config.repository_rest_service.preferences_map);
            } else {
                window._log.warn(`WARNING : No matching preferences present for domain ${domain_data.name}`, config.repository_rest_service.preferences_whitelist);
            }

            return Object.assign({ Default: preferences_obj }, mpulse.getCustomMetricOverridesFromDomainObject(domain_obj));
        },


        getCustomMetricOverridesFromDomainObject(domain_object = window.required()) {
            
            if (!domain_object.Domain.hasOwnProperty('CustomMetrics')) {
                /* if there are no custom metrics defined, the property does not exist */
                return {}
            }
            let custom_metric_overrides_obj = {};
            let metrics_array = domain_object.Domain.CustomMetrics.CustomMetric;
            /* we get an object instead of an array if there is only one custom_metric */
            if (metrics_array.length === undefined) {
                metrics_array = [metrics_array];
            }
            let custom_metrics = (metrics_array || []).filter(
                cm => config.repository_rest_service.preferences_custom_metric_type_whitelist.includes(cm.DataType.type)
            );

            for (let metric of custom_metrics) {
                custom_metric_overrides_obj[metric.name] = obj_utils.filterKeysByArray(
                    metric.DataType, 
                    config.repository_rest_service.metric_preferences_whitelist, 
                    config.repository_rest_service.preferences_map
                );
            }

            return custom_metric_overrides_obj;
        },


        requestRepositoryData : async ({ type, id, query, token = storage.session.getItem('token') } = {}) => {
            return await window.akdv.xmlHTTP.getJSON({
                url: `${config.repository_rest_service.url}/Objects/${type}${id? '/' + id : ''}${query? '?' + query : ''}`, 
                headers: { 'Cache-Control': 'no-cache', 'X-Auth-Token': token }, 
                options: { redirect: 'error', ...!env_utils.in_iframe && { 'mode': 'cors' }}, 
                suppress_errors: true 
            }).catch(e => statusNotifier.setError({ 
                title: lang_utils.getLocalizedHTMLString('Get', 'AKDV.Errors.Repository.XMLHTTP'), 
                description: e.message || e,
                trace: e.stack,
                closeable: true
            }));
        },


        openLinkedDashboard(dashboard_path, filters = empty_filters) {

            var msg_obj = {
                openDashboard: true,
                dashboardPath: dashboard_path,
                dashboardFilter: filters
            };
            window.akdv.postMessageAPI.postToParent(msg_obj);
        },


        getMappedAttribute : (name) => config.filters.attribute_map[name] || name,


        setFilterByName : (name, v) => {

            let found_match = false;

            if (state.filters.criteria) {
                state.filters.criteria.some(f => {
                    found_match = (f.attribute === window.akdv.mpulse.getMappedAttribute(name));
                    if (found_match) {
                        f.value = v;
                    }
                    return found_match;
                });
            }

            if (!found_match) {
                state.filters.criteria = state.filters.criteria || [];
                let filter = JSON.parse(JSON.stringify(empty_filter));
                filter.attribute = window.akdv.mpulse.getMappedAttribute(name);
                filter.displayLabel = window.akdv.mpulse.getMappedAttribute(name);
                filter.value = v;
                state.filters.criteria.push(filter);
            }
        },


        getFilterByName : (name, filters = state.filters.criteria) => {
            return (filters)
                ? filters.filter(f => f.attribute === window.akdv.mpulse.getMappedAttribute(name)).pop() || false
                : false;
        },


        getFilterDisplayLabelByName : (name) => (window.akdv.mpulse.getFilterByName(name) || {}).displayLabel || false,


        getFilterValueByName : (name) => (window.akdv.mpulse.getFilterByName(name) || {}).value || false,


        getPreferenceByName(name = window.required(), metric_name = false) {

            let pref, type = 'Currency';

            name = string_utils.upperCaseFirstLetter(name);

            if (mpulse.preferences[metric_name]) { 
                pref = mpulse.preferences[metric_name][name];
                type = string_utils.upperCaseFirstLetter(mpulse.preferences[metric_name].type.toLowerCase()) || type;
            }

            return pref || mpulse.preferences.default[(name === 'DecimalPlaces')? `${type}DecimalPlaces` : name];
        },


        onmPulseFilterUpdate (e, filters) {

            if (JSON.stringify(filters) !== JSON.stringify(state.filters)) {
                const prev_domain_id = mpulse.getDomainID();              
                state.filters = filters;
                event_utils.dispatchCustomEvent(window, 'mpulse-filter-updated', 'akdv', { filters: state.filters });
                if (!state.defer_request_on_filter_update) {
                    event_utils.dispatchCustomEvent(window, 'new-request', 'akdv', { filters: state.filters });
                }
                const current_domain_id = mpulse.getDomainID();
                if (prev_domain_id !== current_domain_id) {
                    event_utils.dispatchCustomEvent(window, 'mpulse-domain-changed', 'akdv', current_domain_id);
                }
            }
        },


        onDomainChanged (e, domain_id) {

            const preferences_obj = mpulse.preferences;
            if (Object.keys(preferences_obj).length) {
                event_utils.dispatchCustomEvent(window, 'mpulse-preferences-ready', 'akdv', preferences_obj);
            }

            // Always send the prefs request
            mpulse.getPreferencesStateFromFilters().then((preferences_obj) => mpulse.updatePreferences(domain_id, preferences_obj));  
        },


        getDomainID() {

            const domain_filter = mpulse.getFilterByName('mPulse Domain');
            let domain_id = false;

            if (domain_filter) {
                domain_id = domain_filter.value;
            } else if (state.filters.criteria) { // avoid throwing a warning if the filters have simply not yet been set!
                window._log.warn(`WARNING : No domain filter found in filters received for Dashboard.`, state.filters);
            }

            return domain_id;
        },


        get filters() {
            return state.filters;
        },


        set filters(filters) {
            state.filters = filters || false;
        },


        get preferences() {
            return storage.session.getItem(`${mpulse.getDomainID()}_preferences`) || {};
        },


        get linked_dashboard_path() {
            return state.linked_dashboard_path;
        },


        set linked_dashboard_path(dashboard_path) {
            state.linked_dashboard_path = dashboard_path;
        },


        get widget_popped_status() {
            return state.popped_out;
        },


        set widget_popped_status(bool) {
            state.popped_out = bool;
        },


        addEventListeners() {
            $(window).on('mpulse-filter-update.akdv', mpulse.onmPulseFilterUpdate);
            $(window).on('mpulse-domain-changed.akdv', mpulse.onDomainChanged);
            $(window).on('mpulse-linked-dashboard-update.akdv', (e, dashboard_path) => mpulse.linked_dashboard_path = dashboard_path);
            $(window).on('mpulse-widget-status-update.akdv', (e, state) => mpulse.popped_out = state.popped_out);
            $(window).on('mpulse-open-linked-dashboard.akdv', (e, dashboard_path, filters) => mpulse.openLinkedDashboard(dashboard_path, filters))
        }
    };


})(window, document, window.jQuery, window.WidgetFilterBaseFilterTypes, window.akdv.validate, window.akdv.utils_env, window.akdv.utils_lang, window.akdv.utils_obj, window.akdv.utils_data, window.akdv.utils_event, window.akdv.utils_string, window.akdv.storage, new window.X2JS({attributePrefix: ''}), window.akdv.statusNotifier);