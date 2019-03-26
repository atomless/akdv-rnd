/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'


const supports_vars = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_css.supports_vars);
    
    t.truthy(output, `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const hslaValuesToCSSString = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_css.hslaValuesToCSSString(50, 0.9, 0.7, 1));

    t.truthy(output === 'hsl(50, 90%, 70%)', `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const computed_bg_color = async t => {
    t.plan(1);

    let output = await browser.wait(2000).evaluate(() => window.akdv.utils_css.computed_bg_color);

    t.truthy(output === 'rgb(249, 251, 251)', `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const remsToPixels = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_css.remsToPixels(3));

    t.truthy(output === 53.592, `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const pixelsToRems = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_css.pixelsToRems(53.592));

    t.truthy(output === 3, `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const getValueForStylePropertyOfSelector = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_css.getValueForStylePropertyOfSelector('background-color'));

    t.truthy(output === 'rgb(249, 251, 251)', `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const getStyleRuleValue = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_css.getStyleRuleValue('background-color', 'body'));

    t.truthy(output === 'var(--prime_bg_0)', `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const getValueOfCSSVar = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_css.getValueOfCSSVar('var(--prime_bg_0)'));

    t.truthy(output === 'hsl(195, 20%, 98%)', `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const convertCSSVarsInArrayToValues = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_css.convertCSSVarsInArrayToValues(['var(--prime_bg_0)', 'var(--prime_bg_1)']));

    t.truthy(JSON.stringify(output) === JSON.stringify(['hsl(195, 20%, 98%)', 'hsl(195, 20%, 96%)']), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const getColorArrayByType = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_css.getColorArrayByType());

    t.truthy(JSON.stringify(output) === JSON.stringify(['var(--color_hm_cooler)', 'var(--color_hm_cool)', 'var(--color_hm_warm)', 'var(--color_hm_warmer)', 'var(--color_hm_warmest)']), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const getColorMapByCategory = async t => {
    t.plan(1);

    let expected_output = JSON.stringify({"css":"var(--color_css)","flash":"var(--color_flash)","font":"var(--color_font)","html":"var(--color_html)","image":"var(--color_image)","other":"var(--color_other)","script":"var(--color_script)","text":"var(--color_text)","video":"var(--color_video)","xhr":"var(--color_xhr)"});

    let output = await browser.evaluate(() => window.akdv.utils_css.getColorMapByCategory());

    t.truthy(JSON.stringify(output) === expected_output, `Failed with unexpected output : ${JSON.stringify(output)}. Expected: ${expected_output}`);
};


// ================================================================================================
// TEST SEQUENCE


const test_chart_html = 'waterfall_template.html'; // '_template.html' is appended to all nunjuck templates on publishing to dist
const test_data_file = 'waterfall.json';

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV UNIT : CSS UTILS UNIT TEST PAGE', `${config.base_uri}html/${test_chart_html}?debug=${config.browser_logging_level}&data=${test_data_file}`));

test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('UTILS_CSS - supports_vars', supports_vars);
test.serial('UTILS_CSS - hslaValuesToCSSString', hslaValuesToCSSString);
test.serial('UTILS_CSS - computed_bg_color', computed_bg_color);
test.serial('UTILS_CSS - remsToPixels', remsToPixels);
test.serial('UTILS_CSS - pixelsToRems', pixelsToRems);
test.serial('UTILS_CSS - getValueForStylePropertyOfSelector', getValueForStylePropertyOfSelector);
test.serial('UTILS_CSS - getStyleRuleValue', getStyleRuleValue);
test.serial('UTILS_CSS - getValueOfCSSVar', getValueOfCSSVar);
test.serial('UTILS_CSS - convertCSSVarsInArrayToValues', convertCSSVarsInArrayToValues);
test.serial('UTILS_CSS - getColorArrayByType', getColorArrayByType);
test.serial('UTILS_CSS - getColorMapByCategory', getColorMapByCategory);

/* jshint ignore:end */