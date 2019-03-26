;((window, document, vega, vl, env_utils) => {

    'use strict';

    const vega_utils = window.akdv.utils_vega = {


        loadSchema : async (schema_json = window.required('schema_json'), renderer = 'svg', _config_json = undefined) => {
            
            let vega_view = null;
            let log_level = parseInt(window.akdv.utils_env.getQueryParamValue('debug') - 2 || '0');

            try {
                if (typeof schema_json === 'string') {
                    schema_json = JSON.parse(schema_json);
                }

                if (vega_utils.isSchemaJsonVegaLite(schema_json)) {
                    schema_json = vl.compile(schema_json).spec
                }
                
                if (typeof _config_json === 'string') {
                    _config_json = JSON.parse(_config_json);
                }
                
                vega_view = new vega.View(vega.parse(schema_json, _config_json))
                    .renderer(renderer)
                    .hover()
                    .logLevel((log_level < 1)? vega.Error : (log_level < 2)? vega.Warn : (log_level < 3)? vega.Info : vega.Debug);
            } catch(error) {
                const e = new TypeError(`ERROR PARSING SCHEMA JSON`);
                e.stack = error.stack;
                throw e;
            }

            return vega_view;
        },


        loadSchemaJSONByURL : async (uri = window.required('schema_uri')) => {

            let json = null;

            uri = uri.substr(0,4) !== 'http' ? `https://${uri}` : uri;
            try {
                json = await vega.loader().load(uri);
            } catch(error) {
                const e = new TypeError(`ERROR LOADING SCHEMA URL: ${uri}`);
                e.stack = error.stack;
                throw e;
            }

            return json;
        },


        loadSchemaByURL : async (schema_uri = window.required('schema_uri'), renderer = 'svg', _config_json = undefined) => {

            return vega_utils.loadSchema(await vega_utils.loadSchemaJSONByURL(schema_uri), renderer, _config_json);
        },


        getDataFieldNamesFromView(vega_view = window.required('vega_view'), data_key_set = new Set()) {

            const view_state = vega_view.getState({ data: vega.truthy });

            for(let data_name of Object.keys(view_state.data).filter((v => !['root'].includes(v)))) {

                data_key_set.add(data_name);
            }

            return data_key_set;
        },


        getSchemaURL({ container_el, chart_type } = {}) {
            
            let params = env_utils.getQueryParams(true);
            let filename = chart_type || (container_el? container_el.getAttribute('data-declaration-filename') : false);

            return `${env_utils.host_url_with_version}/json/vega/chart_declarations/${
                filename || params.vega || env_utils.html_filename.replace(/_template/, '')
            }.json`;
        },
        

        isSchemaJsonVegaLite(schema_json = window.required('schema_json')) {

            return schema_json['$schema'] && schema_json['$schema'].includes('vega-lite');
        }
    }

})(window, document, window.vega, window.vl, window.akdv.utils_env);
