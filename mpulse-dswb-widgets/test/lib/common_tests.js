'use strict';

import browser from '../lib/browser';

const COLOR_YELLOW = "\x1b[33m";
const COLOR_GREEN = "\x1b[32m";
const COLOR_RESET = "\x1b[0m";

/* jshint ignore:start */

module.exports = {


    page_load_test : async (t, test_name = 'AKDV', url = config.dswb_data_test_url) => {

        t.plan(1); // expected passes

        let response = await browser.goto(url).catch((err) => console.log('ERR:' + err));

        console.log(`\n    ${COLOR_YELLOW}==================================================================`);
        console.log(`    ${test_name}`);
        console.log(`    ------------------------------------------------------------------${COLOR_RESET}`);

        t.truthy(response.code === 200, `Failed to load page at: ${url}`);
    },


    output_build_version : async t => {

        t.plan(2); // expected passes

        let version = await browser.evaluate(() => { return document.body.getAttribute('data-software-version'); });
        let date = await browser.evaluate(() => { return document.body.getAttribute('data-publication-date'); });

        if (version) {
            console.log('    ------------------------------------------------------------------');
            console.log(`    Software Version: ${version}`);
            console.log(`    Publication Date: ${date}`);
            console.log('    ------------------------------------------------------------------');
        }

        t.truthy(version.length > 0, `The Body attribute "data-software-version" is missing or invalid: ${version}`);
        t.truthy(date.length > 0, `The Body attribute "data-publication-date" is missing or invalid: ${date}`);
    },


    check_build_version : async t => {

        t.plan(2); // expected passes

        let version = await browser.evaluate(() => { return document.body.getAttribute('data-software-version'); });
        let date = await browser.evaluate(() => { return document.body.getAttribute('data-publication-date'); });

        t.truthy(version.length > 0, `The Body attribute "data-software-version" is missing or invalid: ${version}`);
        t.truthy(date.length > 0, `The Body attribute "data-publication-date" is missing or invalid: ${date}`);
    },


    is_production_test : async t => {

        t.plan(1); // expected passes

        const is_production = await browser.evaluate(() => window.build_environment === 'production');

        t.truthy(is_production, 'Not running in production');
    },


    performance_regression : async (t, perf_map) => {

        t.plan(perf_map.size);

        const performance_measures = await browser
            .wait('body[data-render-complete="true"]')
            .evaluate((pmk) => pmk.map(k => performance.getEntriesByName(k, 'measure')[0].duration), Array.from(perf_map.keys()));
        
        Array.from(perf_map.keys()).forEach((k, i) => {
            let pass = performance_measures[i] < perf_map.get(k);
            if (pass) {
                console.info(`  ${COLOR_GREEN}✔${COLOR_RESET} -- PERFORMANCE TEST PASSED FOR MEASURE: ${k}`);
            }
            t.truthy(pass, `Failed on ${k}. Measure duration was: ${performance_measures[i]}. Expected to be < ${perf_map.get(k)}.`);
        });
    }    
}

/* jshint ignore:end */