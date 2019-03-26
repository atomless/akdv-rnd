/* jshint ignore:start */
'use strict';

import test from 'ava';
import Cmd from 'cmd-exec';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'


const akdv_lite_test = async t => {

    t.plan(2); // expected passes

    let akdv_file_render_complete = await browser.wait('.akdv-chart[data-render-complete="true"][data-datasource-FILE="true"]').evaluate(() => document.querySelector('.akdv-chart[data-render-complete="true"][data-datasource-FILE="true"]'));
    
    let akdv_dswb_render_complete = await browser.wait('.akdv-chart[data-render-complete="true"][data-datasource-DSWB="true"]').evaluate(() => document.querySelector('.akdv-chart[data-render-complete="true"][data-datasource-DSWB="true"]'));

    t.truthy(akdv_file_render_complete, 'AKDV Lite FILE Chart failed to render.');
    t.truthy(akdv_dswb_render_complete, 'AKDV Lite DSWB Chart failed to render.');
};


// ================================================================================================
// TEST SEQUENCE

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV FUNC : LITE TEST PAGE', config.akdv_lite_test_url));
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

// test.serial('AKDV LITE INLINE CHARTS', akdv_lite_test);

/* jshint ignore:end */

