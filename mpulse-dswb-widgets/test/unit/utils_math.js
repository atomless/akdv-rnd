/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'

const safeQuotient = async t => {

    t.plan(2);

    let output = await browser.evaluate(() => (window.akdv.utils_math.safeQuotient(1,5)));
    t.truthy(output === 0.2, `Failed with unexpected output : ${output}.`);

    output = await browser.evaluate(() => (window.akdv.utils_math.safeQuotient(Infinity,5)));
    t.truthy(output === 0, `Failed with unexpected output : ${output}.`);

}

const intQuotient = async t => {

    t.plan(2);

    let output = await browser.evaluate(() => (window.akdv.utils_math.intQuotient(10,5)));
    t.truthy(output === 2, `Failed with unexpected output : ${output}.`);

    output = await browser.evaluate(() => (window.akdv.utils_math.intQuotient(9,5)));
    t.truthy(output === 1, `Failed with unexpected output : ${output}.`);
}

const sigmoid = async t => {

    t.plan(3);

    let output = await browser.evaluate(() => (window.akdv.utils_math.sigmoid(37)));
    t.truthy(output === 1, `Failed with unexpected output : ${output}.`);

    output = await browser.evaluate(() => (window.akdv.utils_math.sigmoid(0)));
    t.truthy(output === 0.5, `Failed with unexpected output : ${output}.`);

    output = await browser.evaluate(() => (window.akdv.utils_math.sigmoid(10)));
    t.truthy(output === 0.9999546021312976, `Failed with unexpected output : ${output}.`);
}

const logNormalDistributionGenerator = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => (window.akdv.utils_math.logNormalDistributionGenerator(0.5,0,0,10,3,0)));
    t.truthy(JSON.stringify(output) === `[{"x":0,"y":0},{"x":3,"y":0},{"x":6,"y":0},{"x":9,"y":0}]`, `Failed with unexpected output : ${output}.`);
}

const norm = async t => {

    t.plan(1)

    let output = await browser.evaluate(() => (window.akdv.utils_math.norm(10,100,55)));
    t.truthy(output = 0.5, `Failed with unexpected output : ${output}.`);
}

const clamp = async t => {

    t.plan(1)

    let output = await browser.evaluate(() => (window.akdv.utils_math.clamp(10,100,55)));
    t.truthy(output = 5, `Failed with unexpected output : ${output}.`);

    output = await browser.evaluate(() => (window.akdv.utils_math.clamp(10,100,9)));
    t.truthy(output = 10, `Failed with unexpected output : ${output}.`);

    output = await browser.evaluate(() => (window.akdv.utils_math.clamp(-100,100,110)));
    t.truthy(output = 100, `Failed with unexpected output : ${output}.`);
}

const roundFloatTo = async t => {

    t.plan(1)

    let output = await browser.evaluate(() => (window.akdv.utils_math.roundFloatTo(123.456789,3)));
    t.truthy(output = 123.46, `Failed with unexpected output : ${output}.`);
}

const percentile = async t => {

    t.plan(2)

    let output = await browser.evaluate(() => (window.akdv.utils_math.percentile([0,1,2,3,4],50)));
    t.truthy(output = 2, `Failed with unexpected output : ${output}.`);

    output = await browser.evaluate(() => (window.akdv.utils_math.percentile([654,135,68,687,354,6546,98,798,65,13,13,1,654,687,684,361,32,132,46,54,6847,69,769,7,465],75)));
    t.truthy(output = 684, `Failed with unexpected output : ${output}.`);
}

const mode = async t => {

    t.plan(1)

    let output = await browser.evaluate(() => (window.akdv.utils_math.mode([1,2,3,4,4,5])));
    t.truthy(output = 4, `Failed with unexpected output : ${output}.`);
}

const smoothstep = async t => {

    t.plan(1)

    let output = await browser.evaluate(() => (window.akdv.utils_math.smoothstep(0,10,5)));
    t.truthy(output = 0.5, `Failed with unexpected output : ${output}.`);
}


const lerp = async t => {

    t.plan(1)

    let output = await browser.evaluate(() => (window.akdv.utils_math.lerp(0,10,5)));
    t.truthy(output = 50, `Failed with unexpected output : ${output}.`);
}


const random_bm = async t => {

    t.plan(1)

    let output = await browser.evaluate(() => (window.akdv.utils_math.random_bm(0,1,10)));
    t.truthy(output < 1.0, `Failed with unexpected output : ${output}.`);
}


// ================================================================================================
// TEST SEQUENCE

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV UNIT : MATH UTILS UNIT TEST PAGE', config.akdv_lite_test_url));
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('UTILS_MATH - safeQuotient', safeQuotient);
test.serial('UTILS_MATH - intQuotient', intQuotient);
test.serial('UTILS_MATH - sigmoid', sigmoid);
test.serial('UTILS_MATH - logNormalDistributionGenerator', logNormalDistributionGenerator);
test.serial('UTILS_MATH - norm', norm);
test.serial('UTILS_MATH - clamp', sigmoid);
test.serial('UTILS_MATH - roundFloatTo', roundFloatTo);
test.serial('UTILS_MATH - percentile', percentile);
test.serial('UTILS_MATH - mode', mode);
test.serial('UTILS_MATH - smoothstep', smoothstep);
test.serial('UTILS_MATH - lerp', lerp);
test.serial('UTILS_MATH - random_bm', random_bm);


/* jshint ignore:end */