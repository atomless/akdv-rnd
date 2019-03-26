/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'


const isIE = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {

        return window.akdv.utils_env.isIE();
    });

    t.truthy(output === false, `Failed with unexpected output is IE: ${output}.`);
};


const isIE11 = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {

        return window.akdv.utils_env.isIE11();
    });

    t.truthy(output === false, `Failed with unexpected output is IE11: ${output}.`);
};


const versionOfIE = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {

        return isNaN(window.akdv.utils_env.versionOfIE());
    });

    t.truthy(output === true, `Failed with unexpected output isNaN : ${output}.`);
};


const getFunctionNameAtIndexInCallStack = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {

    	let innerFn = () => window.akdv.utils_env.getFunctionNameAtIndexInCallStack();
    	let outerFn = () => innerFn();
        
        return outerFn();
    });

    t.truthy(output === 'outerFn', `Failed with unexpected output : ${output}.`);
};


const getQueryParams = async t => {

    t.plan(3);

    let [output, output_include_hash_params, output_key_white_list] = await browser.evaluate(() => {
       
       	let key_white_list = ["myhash1", "my_param_1"]; 
        return [JSON.stringify(window.akdv.utils_env.getQueryParams()), JSON.stringify(window.akdv.utils_env.getQueryParams(true)), JSON.stringify(window.akdv.utils_env.getQueryParams(true, key_white_list))];
    });

    t.truthy(output === '{"debug":"3","my_param_1":"1","my_param_2":"2"}', `Failed with unexpected output : ${output}.`);
    t.truthy(output_include_hash_params === '{"debug":"3","my_param_1":"1","my_param_2":"2","myhash1":"1"}', `Failed with unexpected output : ${output_include_hash_params}.`);
    t.truthy(output_key_white_list === '{"my_param_1":"1","myhash1":"1"}', `Failed with unexpected output : ${output_key_white_list}.`);
};


const getQueryParamValue = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {
        
        return window.akdv.utils_env.getQueryParamValue('my_param_2');
    });

    t.truthy(output === '2', `Failed with unexpected output : ${output}.`);
};


const in_iframe = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {
        
        return window.akdv.utils_env.in_iframe;
    });

    t.truthy(output === false, `Failed with unexpected output : ${output}.`);
};


const html_filename = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {
        
        return window.akdv.utils_env.html_filename;
    });

    t.truthy(output === 'testpageakdvlite', `Failed with unexpected output : ${output}.`);
};


const host_url = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {
        
        return window.akdv.utils_env.host_url;
    });

    t.truthy(output === 'https://dswb.soasta.com:3001', `Failed with unexpected output : ${output}.`);
};


const akdv_static_host = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {
        
        return window.akdv.utils_env.akdv_static_host;
    });

    t.truthy(output === 'dswb.soasta.com:3001', `Failed with unexpected output : ${output}.`);
};


const user_iso_lang_code = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {
        
        return window.akdv.utils_env.user_iso_lang_code;
    });

    t.truthy(output === null, `Failed with unexpected output : ${output}.`);
};

// ================================================================================================
// TEST SEQUENCE

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV UNIT : ENV UTILS UNIT TEST PAGE', config.akdv_lite_test_url + '&my_param_1=1&my_param_2=2#myhash1=1'));
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

// IE tests not only test negative (not IE)
test.serial('UTILS_ENV - isIE', isIE);
test.serial('UTILS_ENV - isIE11', isIE11);
test.serial('UTILS_ENV - versionOfIE', versionOfIE);
test.serial('UTILS_ENV - getFunctionNameAtIndexInCallStack', getFunctionNameAtIndexInCallStack);
test.serial('UTILS_ENV - getQueryParams', getQueryParams);
test.serial('UTILS_ENV - getQueryParamValue', getQueryParamValue);
// SKIP (NightmareJS prompts file) - test.serial('UTILS_ENV - download', download);
test.serial('UTILS_ENV - in_iframe', in_iframe);
test.serial('UTILS_ENV - html_filename', html_filename);
test.serial('UTILS_ENV - host_url', host_url);
test.serial('UTILS_ENV - akdv_static_host', akdv_static_host);
// SKIP (NightmareJS returns null) - test.serial('UTILS_ENV - user_iso_lang_code', user_iso_lang_code);
/* jshint ignore:end */