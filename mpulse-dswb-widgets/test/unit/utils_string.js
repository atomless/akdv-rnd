/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'


const throwIfNANOrOOR = async t => {

    t.plan(2); // expected passes

    let [expected_exception, expected_no_exception] = await browser.evaluate(() => {

        let expected_exception = false, expected_no_exception = true;

        try {
            window.akdv.utils_string.throwIfNANOrOOR("foo");
        } catch {
            expected_exception = true;
        }

        try {
            window.akdv.utils_string.throwIfNANOrOOR(1000);
        } catch {
            expected_no_exception = false;
        }

        return [expected_exception, expected_no_exception];
    });

    t.truthy(expected_exception, `Failed to throw an exception when expected.`);
    t.truthy(expected_no_exception, `Failed with an exception when not expected.`);
};


const stringLiteralTemplate  = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => (window.akdv.utils_string.stringLiteralTemplate`${0}, ${0}, ${1}. ${0}, ${2}. ${2} 1, 2, 3.`).with('Hello', 'World', 'Testing'));
    
    t.truthy(output === 'Hello, Hello, World. Hello, Testing. Testing 1, 2, 3.', `Failed with unexpected output : ${output}.`);
};


const toStringLiteralTemplate  = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_string.toStringLiteralTemplate('${0}, ${0}, ${1}. ${0}, ${2}. ${2} 1, 2, 3.').with('Hello', 'World', 'Testing'));
    
    t.truthy(output === 'Hello, Hello, World. Hello, Testing. Testing 1, 2, 3.', `Failed with unexpected output : ${output}.`);
};


const ellipsizeText = async t => {

    t.plan(5);

    let expected_output = 'Hello Cruel Unit Te... Please Say I am OK!';
    let output = await browser.evaluate(() => window.akdv.utils_string.ellipsizeText(
        'Hello Cruel Unit Testing Testing Tesing, World, Please Say I am OK!',
        'MIDDLE', 
        '...',
        40
    ));
    t.truthy(output === expected_output, `Failed with unexpected output : ${output}.`);

    expected_output = 'Hello Cruel Unit Testing... Say I am OK!';
    output = await browser.evaluate(() => window.akdv.utils_string.ellipsizeText(
        'Hello Cruel Unit Testing Testing Tesing, World, Please Say I am OK!',
        'MIDDLE', 
        '...',
        40,
        undefined,
        undefined,
        false,
        10
    ));
    t.truthy(output === expected_output, `Failed with unexpected output : ${output}.`);

    // test with chars_to_chop and ellipsis index defined which is required by the dom utils ellipsis method
    expected_output = 'Hello Cruel Unit Tes... World, Please Say I am OK!';
    output = await browser.evaluate(() => window.akdv.utils_string.ellipsizeText(
        'Hello Cruel Unit Testing Testing Tesing, World, Please Say I am OK!',
        'MIDDLE', 
        undefined,
        undefined,
        30,
        20
    ));
    t.truthy(output === expected_output, `Failed with unexpected output : ${output}.`);

    expected_output = 'Hello Cruel Unit Testing Testing~';
    output = await browser.evaluate(() => window.akdv.utils_string.ellipsizeText(
        'Hello Cruel Unit Testing Testing Tesing, World, Please Say I am OK!',
        'END', 
        '~',
        27,
        undefined,
        undefined,
        false,
        10
    ));
    t.truthy(output === expected_output, `Failed with unexpected output : ${output}.`);

    expected_output = 'you ok bro- I am OK!';
    output = await browser.evaluate(() => window.akdv.utils_string.ellipsizeText(
        'Hello Cruel Unit Testing Testing Tesing, World, Please Say I am OK!',
        'START', 
        'you ok bro-',
        13,
        undefined,
        undefined,
        false,
        6
    ));
    t.truthy(output === expected_output, `Failed with unexpected output : ${output}.`);

};


const getInternationalizedNumberWithCurrencySymbol = async t => {

    t.plan(2);

    let output_non_us_locale = await browser.evaluate(() => window.akdv.utils_string.getInternationalizedNumberWithCurrencySymbol(3000, 'en-GB', 'USD'));
    let output_us_locale = await browser.evaluate(() => window.akdv.utils_string.getInternationalizedNumberWithCurrencySymbol(3000, 'en-US', 'USD'));

    t.truthy(output_non_us_locale === 'US$3,000', `Failed with unexpected output : ${output_non_us_locale}.`);
    t.truthy(output_us_locale === '$3,000', `Failed with unexpected output : ${output_us_locale}.`);
};


const getInternationalizedNumberWithCurrencySymbolAndMagnitudeSuffix = async t => {

    t.plan(2);

    let output_non_us_locale = await browser.evaluate(() => window.akdv.utils_string.getInternationalizedNumberWithCurrencySymbolAndMagnitudeSuffix(3000, 'en-GB', 'USD'));
    let output_us_locale = await browser.evaluate(() => window.akdv.utils_string.getInternationalizedNumberWithCurrencySymbolAndMagnitudeSuffix(3000, 'en-US', 'USD'));

    t.truthy(output_non_us_locale === 'US$3k', `Failed with unexpected output : ${output_non_us_locale}.`);
    t.truthy(output_us_locale === '$3k', `Failed with unexpected output : ${output_us_locale}.`);
};


const getFormattedNumber = async t => {

    t.plan(2);

    let output = await browser.evaluate(() => window.akdv.utils_string.getFormattedNumber(30299.55, 0, 'en-US'));
    let output_with_precision = await browser.evaluate(() => window.akdv.utils_string.getFormattedNumber(30299.55, 3, 'en-US'));

    t.truthy(output === '30,300', `Failed with unexpected output : ${output}.`);
    t.truthy(output_with_precision === '30,299.550', `Failed with unexpected output : ${output_with_precision}.`);
};


const getFormattedNumberSD = async t => {

    t.plan(2);

    let output = await browser.evaluate(() => window.akdv.utils_string.getFormattedNumberSD(30299.55, 0, 'en-US'));
    let output_with_precision = await browser.evaluate(() => window.akdv.utils_string.getFormattedNumberSD(30299.55, 3, 'en-US'));

    t.truthy(output === '30,000', `Failed with unexpected output : ${output}.`);
    t.truthy(output_with_precision === '30,300', `Failed with unexpected output : ${output_with_precision}.`);
};


const getFormattedInteger = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_string.getFormattedInteger(30299.55, 'en-US'));

    t.truthy(output === '30,300', `Failed with unexpected output : ${output}.`);
};


const getNumberExponentAndSuffix = async t => {

    t.plan(1);

    let expected_output = [3, 'k'];
    let [exponent, suffix] = await browser.evaluate(() => window.akdv.utils_string.getNumberExponentAndSuffix(30299.55));

    t.truthy(expected_output[0] === exponent && expected_output[1] === suffix, `Failed with unexpected output : [${exponent}, ${suffix}].`);
};


const getAbbreviatedNumberWithOrderOfMagnitudeSuffix = async t => {

    t.plan(1);

    let expected_output = '30.3k';
    let output = await browser.evaluate(() => window.akdv.utils_string.getAbbreviatedNumberWithOrderOfMagnitudeSuffix(30299.55, 'en-US'));

   t.truthy(expected_output === output, `Failed with unexpected output : ${output}.`);
};


const getAbbreviatedNumberWithOrderOfMagnitudeLabels = async t => {

    t.plan(1);

    let expected_output = '30.3Thousand';
    let output = await browser.evaluate(() => window.akdv.utils_string.getAbbreviatedNumberWithOrderOfMagnitudeLabels(30299.55, 'en-US'));

    t.truthy(expected_output === output, `Failed with unexpected output : ${output}.`);
};


const getOrdinalSuffix = async t => {

    t.plan(1);

    let expected_output = '1st,11th,22nd,12th,3rd,13th,54th,75th,15th,6th,17th,18th,29th,90th,100th';
    let output = await browser.evaluate(() => [1,11,22,12,3,13,54,75,15,6,17,18,29,90,100].map(n => `${n}${window.akdv.utils_string.getOrdinalSuffix(n, 'en-US')}`).join(','));

    t.truthy(expected_output === output, `Failed with unexpected output : ${output}.`);
};


const capitalizeAcronyms = async t => {

    t.plan(1);

    let expected_output = 'HTML,CSS,XHR,JS,JPEG,JPG,PNG,GIF,Other,And Another';
    let output = await browser.evaluate(() => ['html', 'css', 'xhr', 'js', 'jpeg', 'jpg', 'png', 'gif', 'Other', 'And Another'].map(s => window.akdv.utils_string.capitalizeAcronyms(s)).join(','));

    t.truthy(expected_output === output, `Failed with unexpected output : ${output}.`);
};


const snakeToKebabCase = async t => {

    t.plan(1);

    let expected_output = 'hello-cruel-world';
    let output = await browser.evaluate(() => window.akdv.utils_string.snakeToKebabCase('hello_cruel_world'));

    t.truthy(expected_output === output, `Failed with unexpected output : ${output}.`);
};


const upperCaseFirstLetter = async t => {
    t.plan(1);

    let expected_output = 'Hello cruel world';
    let output = await browser.evaluate(() => window.akdv.utils_string.upperCaseFirstLetter('hello cruel world'));

    t.truthy(expected_output === output, `Failed with unexpected output : ${output}.`);
};


const toTitleCase = async t => {
    t.plan(1);

    let expected_output = 'Hello Cruel World';
    let output = await browser.evaluate(() => window.akdv.utils_string.toTitleCase('hello-cruel world'));

    t.truthy(expected_output === output, `Failed with unexpected output : ${output}.`);
};


const uppercaseWords = async t => {
    t.plan(1);

    let expected_output = 'Hello-Cruel World';
    let output = await browser.evaluate(() => window.akdv.utils_string.uppercaseWords('hello-cruel world'));

    t.truthy(expected_output === output, `Failed with unexpected output : ${output}.`);
};


const toPascalCase = async t => {
    t.plan(1);

    let expected_output = 'HelloCruelWorld';
    let output = await browser.evaluate(() => window.akdv.utils_string.toPascalCase('hello cruel world'));

    t.truthy(expected_output === output, `Failed with unexpected output : ${output}.`);
};


const filenameFromURL = async t => {
    t.plan(1);

    let expected_output = 'myfile.json';
    let output = await browser.evaluate(() => window.akdv.utils_string.filenameFromURL('http://example.com/myfile.json'));

    t.truthy(expected_output === output, `Failed with unexpected output : ${output}.`);
};


const extensionFromFilename = async t => {
    t.plan(1);

    let expected_output = 'js';
    let output = await browser.evaluate(() => window.akdv.utils_string.extensionFromFilename('my-fantastic-file.js'));

    t.truthy(expected_output === output, `Failed with unexpected output : ${output}.`);
};


const uppercaseLabelFormat = async t => {
    t.plan(1);

    let expected_output = 'Hello Capitalized Acronyms JS, CSS, And HTML, In A Label';
    let output = await browser.evaluate(() => window.akdv.utils_string.uppercaseLabelFormat('Hello capitalized acronyms js, css, and html, in a label'));

    t.truthy(expected_output === output, `Failed with unexpected output : ${output}.`);
};

// ================================================================================================
// TEST SEQUENCE

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV UNIT : STRING UTILS UNIT TEST PAGE', config.local_data_test_url));
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('UTILS_STRING - throwIfNANOrOOR', throwIfNANOrOOR);
test.serial('UTILS_STRING - stringLiteralTemplate', stringLiteralTemplate);
test.serial('UTILS_STRING - toStringLiteralTemplate', toStringLiteralTemplate);
test.serial('UTILS_STRING - ellipsizeText', ellipsizeText);
test.serial('UTILS_STRING - getInternationalizedNumberWithCurrencySymbol', getInternationalizedNumberWithCurrencySymbol);
test.serial('UTILS_STRING - getInternationalizedNumberWithCurrencySymbolAndMagnitudeSuffix', getInternationalizedNumberWithCurrencySymbolAndMagnitudeSuffix);
test.serial('UTILS_STRING - getFormattedNumber', getFormattedNumber);
test.serial('UTILS_STRING - getFormattedNumberSD', getFormattedNumberSD);
test.serial('UTILS_STRING - getFormattedInteger', getFormattedInteger);
test.serial('UTILS_STRING - getNumberExponentAndSuffix', getNumberExponentAndSuffix);
test.serial('UTILS_STRING - getAbbreviatedNumberWithOrderOfMagnitudeSuffix', getAbbreviatedNumberWithOrderOfMagnitudeSuffix);
test.serial('UTILS_STRING - getAbbreviatedNumberWithOrderOfMagnitudeLabels', getAbbreviatedNumberWithOrderOfMagnitudeLabels);
test.serial('UTILS_STRING - getOrdinalSuffix', getOrdinalSuffix);capitalizeAcronyms
test.serial('UTILS_STRING - capitalizeAcronyms', capitalizeAcronyms);
test.serial('UTILS_STRING - snakeToKebabCase', snakeToKebabCase);
test.serial('UTILS_STRING - upperCaseFirstLetter', upperCaseFirstLetter);
test.serial('UTILS_STRING - toTitleCase', toTitleCase);
test.serial('UTILS_STRING - uppercaseWords', uppercaseWords);
test.serial('UTILS_STRING - toPascalCase', toPascalCase);
test.serial('UTILS_STRING - filenameFromURL', filenameFromURL);
test.serial('UTILS_STRING - extensionFromFilename', extensionFromFilename);
test.serial('UTILS_STRING - uppercaseLabelFormat', uppercaseLabelFormat);

/* jshint ignore:end */