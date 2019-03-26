/* jshint ignore:start */
'use strict';

import test from 'ava';
import Cmd from 'cmd-exec';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'


const local_json_loaded_test = async t => {

    t.plan(1); // expected passes

    let result_data_loaded = await browser.wait('body[data-render-complete="true"]').evaluate(() => document.body.getAttribute('data-render-complete'));
    
    t.truthy(result_data_loaded === 'true', 'Result not triggered as window result event.');
};


// ================================================================================================
// TEST SEQUENCE

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV FUNC : DATASOURCE FILE', config.local_data_test_url));
test.serial('BUILD VERSION', common_tests.check_build_version);
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('FILE DATASOURCE JSON LOADED', local_json_loaded_test);

/* jshint ignore:end */

