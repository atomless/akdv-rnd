/* jshint ignore:start */

'use strict';

import test from 'ava';
import Cmd from 'cmd-exec';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests';

const COLOR_GREEN = "\x1b[32m";
const COLOR_RESET = "\x1b[0m";

const preferencesPresent = async t => {

    t.plan(3); // expected passes

    const default_preferences_checklist = [
        'CurrencyCode', 'DecimalSeparator', 'ThousandsSeparator', 
        'CurrencyDecimalPlaces', 'PercentDecimalPlaces'
    ];

    const custom_conversion_preferences_checklist = [
        'DecimalPlaces', 'type'
    ];

    const custom_revenue_preferences_checklist = [
        'CurrencyCode', 'DecimalPlaces', 'DecimalSeparator', 'ThousandsSeparator', 'type'
    ];

    const default_preferences_found = await browser
        .wait(() => Object.keys(window.akdv.mpulse.preferences).length && window.akdv.mpulse.preferences.Default)
        .evaluate((default_preferences_checklist) => !default_preferences_checklist.some(k => !Object.keys(window.akdv.mpulse.preferences.Default).includes(k)), default_preferences_checklist)
        .catch(() => false);

    const custom_conversion_preferences_found = await browser
        .wait(() => Object.keys(window.akdv.mpulse.preferences).length && window.akdv.mpulse.preferences.Conversion)
        .evaluate((custom_conversion_preferences_checklist) => !custom_conversion_preferences_checklist.some(k => !Object.keys(window.akdv.mpulse.preferences.Conversion).includes(k)), custom_conversion_preferences_checklist)
        .catch(() => false);

    const custom_revenue_preferences_found = await browser
        .wait(() => Object.keys(window.akdv.mpulse.preferences).length && window.akdv.mpulse.preferences.Revenue)
        .evaluate((custom_revenue_preferences_checklist) => !custom_revenue_preferences_checklist.some(k => !Object.keys(window.akdv.mpulse.preferences.Revenue).includes(k)), custom_revenue_preferences_checklist)
        .catch(() => false);


    if (default_preferences_found) {
        console.log('    ------------------------------------------------------------------');
        console.log(`  ${COLOR_GREEN}*${COLOR_RESET} Preferences (Default): ${default_preferences_checklist.join(', ')}`);
        console.log('    ------------------------------------------------------------------');
    }

    if (custom_conversion_preferences_found) {
        console.log('    ------------------------------------------------------------------');
        console.log(`  ${COLOR_GREEN}*${COLOR_RESET} Preferences (Conversion): ${custom_conversion_preferences_checklist.join(', ')}`);
        console.log('    ------------------------------------------------------------------');
    }
    
    if (custom_revenue_preferences_found) {
        console.log('    ------------------------------------------------------------------');
        console.log(`  ${COLOR_GREEN}*${COLOR_RESET} Preferences (Revenue): ${custom_revenue_preferences_checklist.join(', ')}`);
        console.log('    ------------------------------------------------------------------');
    }

    t.truthy(default_preferences_found, `The default preferences were unmatched`);
    t.truthy(custom_conversion_preferences_found, `The conversion preferences were unmatched`);
    t.truthy(custom_revenue_preferences_found, `The revenue preferences were unmatched`);
};


// ================================================================================================
// TEST SEQUENCE

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV FUNC : MPULSE PREFERENCES'));
test.serial('BUILD VERSION', common_tests.check_build_version);
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('MPULSE PREFERENCES', preferencesPresent);

/* jshint ignore:end */

