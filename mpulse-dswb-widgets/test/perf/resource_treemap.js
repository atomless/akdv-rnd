/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'


const perf_map = new Map(Object.entries({
    'akdv.NavTimingResponseEnd_requestStart': 1300,
    'akdv.requestStart_requestComplete': 700,
    'akdv.NavTimingResponseEnd_chartRenderStart': 2500,
    'akdv.chartRenderStart_chartRenderComplete': 1500,
    'akdv.NavTimingResponseEnd_renderComplete': 3500
}));


// ================================================================================================
// TEST SEQUENCE


const test_chart_html = 'resourcetreemap_template.html'; // '_template.html' is appended to all nunjuck templates on publishing to dist
const test_data_file = 'resource_treemap.json';

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV PERF : RESOURCE TREEMAP CHART PAGE', `${config.base_uri}html/${test_chart_html}?debug=${config.browser_logging_level}&data=${test_data_file}`));
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('PERFORMANCE REGRESSION TEST - RESOURCE-TREEMAP CHART:', t => common_tests.performance_regression(t, perf_map));

/* jshint ignore:end */