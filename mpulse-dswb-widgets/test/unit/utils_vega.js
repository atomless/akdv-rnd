/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'


const loadSchema = async t => {

    t.plan(2);

    let output_valid = await browser.evaluate(() => window.akdv.utils_vega.loadSchema(`{"$schema": "https://vega.github.io/schema/vega/v5.json"}`).then(v => v._renderType));

   let output_error = await browser.evaluate(() => window.akdv.utils_vega.loadSchema(`_`).catch(e => e.message));

    t.truthy(output_valid === 'svg', `Failed with unexpected output : ${output_valid}.`);
    t.truthy(output_error === 'ERROR PARSING SCHEMA JSON', `Failed with unexpected output : ${output_error}.`);
};


const loadSchemaByURL = async (t, base_uri) => {

    t.plan(2);

    let output_valid = await browser.evaluate((base_uri) => window.akdv.utils_vega.loadSchemaByURL(`${base_uri}json/vega/chart_declarations/donut.json`).then(v => v._renderType), base_uri);

    let output_error = await browser.evaluate(() => window.akdv.utils_vega.loadSchemaByURL(`_`).catch(e => e.message));

    t.truthy(output_valid === 'svg', `Failed to load schema from ${base_uri}json/vega/chart_declarations/donut.json with unexpected output : ${output_valid}.`);
    t.truthy(output_error === 'ERROR LOADING SCHEMA URL: https://_', `Failed with unexpected output : ${output_error}.`);
};


const getDataFieldNamesFromView = async (t, base_uri) => {

    t.plan(1);

    let output = await browser.evaluate((base_uri) => window.akdv.utils_vega.loadSchemaByURL(`${base_uri}json/vega/chart_declarations/donut.json`).then(v => JSON.stringify(Array.from(window.akdv.utils_vega.getDataFieldNamesFromView(v)))), base_uri);

    t.truthy(output === '["table","total","selected","donutSegmentMark","donutSegmentText"]', `Failed to load shcema at ${base_uri}json/vega/chart_declarations/donut.json with unexpected output : ${output}.`);
};


const getSchemaURL = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_vega.getSchemaURL());

    t.truthy(output.includes('/json/vega/chart_declarations/testpageakdvlite.json'), `Failed with unexpected output : ${output}.`);
};


// ================================================================================================
// TEST SEQUENCE

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV UNIT : VEGA UTILS UNIT TEST PAGE', config.akdv_lite_test_url));
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('UTILS_VEGA - loadSchema', loadSchema);
test.serial('UTILS_VEGA - loadSchemaByURL', t => loadSchemaByURL(t, config.base_uri));
test.serial('UTILS_VEGA - getDataFieldNamesFromView', t => getDataFieldNamesFromView(t, config.base_uri));
test.serial('UTILS_VEGA - getSchemaURL', getSchemaURL);
/* jshint ignore:end */