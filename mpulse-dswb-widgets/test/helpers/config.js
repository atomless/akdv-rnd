'use strict';

require('@babel/register')({
  babelrc: false,
  presets: [['@babel/preset-env',{'targets': {'esmodules': true}}]]
});
 
const dashboard_uuid_map = require('../../gulp-config.json').html.template_to_dashboard_uuid_map;
const notebook_uuid_map = require('../../gulp-config.json').html.template_to_notebook_uuid_map;
const pkg_json = require('../../package.json');
const base_uri = process.env.base_uri || `https://dswb.soasta.com:3001/${pkg_json.version}/`;
const notebookuuid = notebook_uuid_map.donut;
const dswb_widget_id = dashboard_uuid_map.donut;
const host = require('../../gulp-config.json').dswb.host;
const dswb_tenant_dev_id = require('../../gulp-config.json').mpulse.tenant_id;
const test_chart_html = 'donut_template.html';
const test_akdv_lite_chart_html = 'testpageakdvlite_template.html';
const test_data_file = 'donut.json';
const browser_logging_level = 3; // change to 4 for max verbosity browser logging
const local_data_test_url = `${base_uri}html/${test_chart_html}?debug=${browser_logging_level}&data=${test_data_file}`;
const dswb_data_test_url = `${base_uri}html/${test_chart_html}?debug=${browser_logging_level}&tenant=${dswb_tenant_dev_id}&host=${host}&widgetid=${dswb_widget_id}&notebookuuid=${notebookuuid}`;
const akdv_lite_test_url = `${base_uri}html/${test_akdv_lite_chart_html}?debug=${browser_logging_level}`;
global.config = Object.freeze({
    base_uri,
    browser_logging_level,
    local_data_test_url,
    dswb_data_test_url,
    akdv_lite_test_url,
    host,
    notebookuuid,
    dswb_tenant_dev_id
});