/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'


const debounceEvent = async t => {

    t.plan(2);

    let [output, elapsed] = await browser.evaluate(() => {

    	window.requestAnimationFrame(e => $(window).trigger('test-event.test-namespace', 'test data is here'));
        return new Promise((resolve) => $(window).on('test-event.test-namespace', (e, data) => {
	    	let start_time = new Date();
	    	window.akdv.utils_event.debounceEvent(e, 'test-namespace', data, (e, d) => { resolve([d, (new Date() - start_time)]) }, 200);
	    }));
    });

    t.truthy(output === 'test data is here', `Failed with unexpected output : ${output}.`);
    t.truthy(elapsed >= 200 && elapsed < 300, `Failed with unexpected debounce time : ${elapsed}.`);
};


const delay = async t => {

    t.plan(1);

    let elapsed = await browser.evaluate(() => {
    	let start_time = new Date();
    	return window.akdv.utils_event.delay(200, 'delay-namespace').then(e => new Date() - start_time);
    });

    t.truthy(elapsed >= 200 && elapsed < 300, `Failed with unexpected delay time : ${elapsed}.`);
};


const dispatchCustomEvent = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {
    	return new Promise((resolve) => {
    		$(window).on('test-event.test-namespace', (e, data) => { resolve(data); });
    		window.akdv.utils_event.dispatchCustomEvent(window, 'test-event', 'test-namespace', 'test data is here');
    	});
    });

    t.truthy(output === 'test data is here', `Failed with unexpected output : ${output}.`);
};


const namspaceHasHandlers = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_event.namspaceHasHandlers(window, 'test-namespace'));

    t.truthy(output === true, `Failed with unexpected output : ${output}.`);
};


// ================================================================================================
// TEST SEQUENCE

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV UNIT : EVENT UTILS UNIT TEST PAGE', config.akdv_lite_test_url));
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('UTILS_EVENT - debounceEvent', debounceEvent);
// Skip (no meaninful way to test) - waitForNextPaint
test.serial('UTILS_EVENT - delay', delay);
test.serial('UTILS_EVENT - dispatchCustomEvent', dispatchCustomEvent);
// Skip (stub only not implemented for production) - addDelegatedListener
// Skip (jQuery on wrapper) - on
// Skip (jQuery off wrapper) - off
test.serial('UTILS_EVENT - namspaceHasHandlers', namspaceHasHandlers);
/* jshint ignore:end */