'use strict';

const is_production = window.build_environment !== 'development';
const js_suffix = is_production? '.min.js' : '.js';

let static_host = 'dswb-static.soasta.com';
if (window.akdv_lite_host !== undefined) {
    static_host = window.akdv_lite_host.replace(/^https?:\/\//, '');
} else if (!is_production) {
    static_host = location.host;
}

let static_version = window.build_version;
if (window.akdv_lite_version !== undefined) {
    static_version = window.akdv_lite_version;
}

const base_url = `https://${static_host}/${static_version}`;

const css_stylesheets = [
    'themes/akdv_lite_light_theme.css', // todo: enable dark theme switching?
    'akdv_lite.css'
];

const javascript_includes = [
    'vendor/d3.min.js',
    'vendor/vega-core' + js_suffix,
    'vendor/vega-lite' + js_suffix,
    'vendor/babel.polyfill.min.js',
    'vendor/thenBy.min.js',
    'vendor/jquery.slim.min.js',
    'vendor/usertiming.min.js',
    'lib/_log.js',
    'lib/functional.js',
    'lib/exceptions.js',
    'lib/akdv.js',
    'lib/akdv.storage.js',
    'lib/akdv.utils.js',
    'lib/akdv.utils_env.js',
    'lib/akdv.utils_obj.js',
    'lib/akdv.utils_string.js',
    'lib/akdv.utils_event.js',
    'lib/akdv.utils_dom.js',
    'lib/akdv.loading_spinners.js',
    'lib/akdv.utils_lang.js',
    'lib/akdv.utils_math.js',
    'lib/akdv.utils_color.js',
    'lib/akdv.utils_css.js',
    'lib/akdv.utils_data.js',
    'lib/akdv.utils_vega.js',
    'lib/vega_expressions.js',
    'lib/akdv.validate.js',
    'lib/akdv.performance.js',
    'lib/akdv.renderCompleteWatch.js',
    'lib/akdv.performance.js',
    'lib/status_factory.js',
    'lib/akdv.xmlHTTP.js',
    'lib/chart_manifest_factory.js',
    'lib/dswb_server_interface_factory.js',
    'lib/socket_factory.js',
    'lib/dswb_session_factory.js',
    'lib/datasource_factory.js',
    'lib/datasource_file.js',
    'lib/datasource_graphql.js',
    'lib/datasource_dswb.js',
    'components/component_factory.js',
    'components/annotation_bubble_factory.js',
    'components/vega_factory.js',
    'charts/vega.js',
    'lib/akdv-lite.js'
];

if (window.akdv_manifest) {
    // Include additional modules
    javascript_includes.push.apply(javascript_includes, window.akdv_manifest.datastory && [
        'lib/dom_transitions.js',
        'components/scroll_observer_factory.js',
        'components/datastory_factory.js'
    ] || []);
}

const head = document.getElementsByTagName('head')[0];
for (let stylesheet of css_stylesheets) {
    let link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = `${base_url}/css/${stylesheet}`;
    link.media = 'all';
    head.appendChild(link);
}

const scriptLoad = (url) => new Promise((resolve, reject) => {
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `${base_url}/javascript/${url}`;
    script.async = false;
    script.addEventListener('load', () => resolve(script), false);
    script.addEventListener('error', () => reject(script), false);
    head.appendChild(script);
});

Promise.all(javascript_includes.map(scriptLoad)).then(e => {
    window.akdvlite.init();
});