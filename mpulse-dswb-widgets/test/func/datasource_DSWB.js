/* jshint ignore:start */ 

'use strict';

import test from 'ava';
import Cmd from 'cmd-exec';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'

const serverInterfaceSettings = async t => {

    t.plan(1); // expected passes

    const server_interface = await browser
        .wait(() => window.akdv.datasource && window.akdv.datasource.serverInterface !== false && window.akdv.datasource.serverInterface.has_required_params === true)
        .then(() => true)
        .catch(() => false);

    if (server_interface) {
        console.log('    ------------------------------------------------------------------');
        console.log('    Server Interface: Has Required Params');
        console.log('    ------------------------------------------------------------------');
    }


    t.truthy(server_interface, `The server interface was incomplete`);
};

const sessionConnected = async t => {

    t.plan(1); // expected passes

    const server_interface = await browser
        .wait(() => window.akdv.datasource.sessions.length)
        .wait(() => window.akdv.datasource.sessions.filter(s => s.connected === true).length)
        .then(() => true)
        .catch(() => false);

    t.truthy(server_interface, `Unable to establish a connected DSWB session`);
};

const sessionComplete = async t => {

    t.plan(1); // expected passes

    const server_interface = await browser
        .wait(() => !window.akdv.datasource.sessions.length)
        .then(() => true)
        .catch(() => false);

    t.truthy(server_interface, `DSWB session failed to complete/close.`);
};

const data_loaded_test = async t => {

    t.plan(2); // expected passes

    let result_data_loaded = await browser.wait('body[data-data-loaded="true"]').evaluate(() => document.body.getAttribute('data-data-loaded'));
    let data = await browser.evaluate(() => { return window.data; });

    if (data && data.meta && data.data) {
        console.log('    ------------------------------------------------------------------');
        console.log('    JSON DATA');
        console.log(`    Chart Title: ${data.meta.title}`);
        console.log(`    Chart Data: [${data.data}]`);
        console.log('    ------------------------------------------------------------------');
    }

    t.truthy(result_data_loaded === 'true', 'Result not triggered as window result event.');
    t.truthy(typeof data === 'object' && data !== null, 'Local data not loaded.');
};

// ================================================================================================
// TEST SEQUENCE

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV FUNC : DATASOURCE DSWB', config.dswb_data_test_url));
test.serial('BUILD VERSION', common_tests.check_build_version);
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('SERVER INTERFACE', serverInterfaceSettings);
test.serial('SESSION CONNECTED', sessionConnected);
test.serial('SESSION COMPLETE', sessionComplete);
// test.serial('DATA LOADED', data_loaded_test);
/* jshint ignore:end */

