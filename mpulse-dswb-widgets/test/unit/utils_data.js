/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'


const parseNumbersInObject = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_data.parseNumbersInObject({ a: 'foo', b: '45', c: '6.7' }));
    
    t.truthy(JSON.stringify(output) === JSON.stringify({ a: 'foo', b: 45, c: 6.7 }), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const getValueAsNumberOrFallbackValue = async t => {
    t.plan(2);

    let output_fallback = await browser.evaluate(() => window.akdv.utils_data.getValueAsNumberOrFallbackValue('t6', 60));
    
    t.truthy(output_fallback === 60, `Failed with unexpected output : ${output_fallback}.`);

    let output = await browser.evaluate(() => window.akdv.utils_data.getValueAsNumberOrFallbackValue('6', 6));
    
    t.truthy(output === 6, `Failed with unexpected output : ${output}.`);
};


const filterToDatumWithPropsWithValuesOf = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_data.filterToDatumWithPropsWithValuesOf([{ a: 44, b: 55, c: "hello" },{ a: "hello", b: 55, c: "44" }], "a", 44));
    
    t.truthy(JSON.stringify(output) === JSON.stringify([{ a: 44, b: 55, c: "hello" }]), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const hasDatumWithPropWithValueOf = async t => {
    t.plan(2);

    let output_expected_true = await browser.evaluate(() => window.akdv.utils_data.hasDatumWithPropWithValueOf([{ a: 44, b: 55, c: "hello" },{ a: "hello", b: 55, c: "44" }], "a", "hello"));

    let output_expected_false = await browser.evaluate(() => window.akdv.utils_data.hasDatumWithPropWithValueOf([{ a: 44, b: 55, c: "hello" },{ a: "hello", b: 55, c: "44" }], "a", "helloski"));
    
    t.truthy(output_expected_true, `Failed with output_expected_true : ${output_expected_true}.`);
    t.truthy(!output_expected_false, `Failed with output_expected_false : ${output_expected_false}.`);
};


const getDifferenceArrayFromNumericalArray = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_data.getDifferenceArrayFromNumericalArray([1, 90, 14, 77]));
    
    t.truthy(JSON.stringify(output) === JSON.stringify([89, -76, 63]), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const getUniqueListOfValuesFromDataArrayForProp = async t => {
    t.plan(1);

    let expected_output = [1, 2, 7, 8, 9, 13, 23, 130, 89, 90, 14, 17, 77];
    let output = await browser.evaluate(() => window.akdv.utils_data.getUniqueListOfValuesFromDataArrayForProp([{a:1},{a:1},{a:1},{a:2},{a:7},{a:8},{a:9},{a:13},{a:23},{a:130},{a:130},{a:89},{a:89},{a:90},{a:90},{a:14},{a:1},{a:2},{a:13},{a:17},{a:17},{a:77},{a:77}], 'a'));
    
    t.truthy(JSON.stringify(output) === JSON.stringify(expected_output), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const getfileExtension = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_data.getfileExtension('http://example.com/path/my_file.js'));
    
    t.truthy(output === 'js', `Failed with unexpected output : ${output}.`);
};


const getArrayFromMinToMaxWithSpecifiedSteps = async t => {
    t.plan(1);

    let expected_output = [0, 11.11111111111111, 22.22222222222222, 33.33333333333333, 44.44444444444444, 55.55555555555556, 66.66666666666666, 77.77777777777777, 88.88888888888889, 100];
    let output = await browser.evaluate(() => window.akdv.utils_data.getArrayFromMinToMaxWithSpecifiedSteps(0, 100, 10));
    
    t.truthy(JSON.stringify(output) === JSON.stringify(expected_output), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const getArrayFromMinToMax = async t => {
    t.plan(1);

    let expected_output = [10.25,11.25,12.25,13.25,14.25,15.25,16.25,17.25,18.25,19.25,20.25];
    let output = await browser.evaluate(() => window.akdv.utils_data.getArrayFromMinToMax(10.25, 20.25));
    
    t.truthy(JSON.stringify(output) === JSON.stringify(expected_output), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const getKeysInDatumWithNumericalValues = async t => {
    t.plan(1);

    let expected_output = ['b', 'c'];
    let output = await browser.evaluate(() => window.akdv.utils_data.getKeysInDatumWithNumericalValues({a: "foo", b: 0, c: 9, d: "5"}));
    
    t.truthy(JSON.stringify(output) === JSON.stringify(expected_output), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const indexOfValueInAscendingArrayWithStep = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_data.indexOfValueInAscendingArrayWithStep([1,2,3,4,5,6,7,15,20,25,30,40,50,60,70,85,120], 27, 7));
    
    t.truthy(output === 9, `Failed with unexpected output : ${output}.`);
};


const uniqueArray = async t => {
    t.plan(1);

    let expected_output = [1, 3, 4, 2, 6, 7, 8, 15, 25, 30, 51, 70, 120];
    let output = await browser.evaluate(() => window.akdv.utils_data.uniqueArray([1,1,3,4,2,6,7,8,15,2,25,30,30,51,51,70,8,120]));
    
    t.truthy(JSON.stringify(output) === JSON.stringify(expected_output), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const arraysIntersection = async t => {
    t.plan(1);

    let expected_output = [4, 5, 6];
    let output = await browser.evaluate(() => window.akdv.utils_data.arraysIntersection([1,2,3,4,5,6],[4,5,6,7,8,9]));
    
    t.truthy(JSON.stringify(output) === JSON.stringify(expected_output), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const arraysNotIntersection = async t => {
    t.plan(1);

    let expected_output = [1, 2, 3, 7, 8, 9];
    let output = await browser.evaluate(() => window.akdv.utils_data.arraysNotIntersection([1,2,3,4,5,6],[4,5,6,7,8,9]));
    
    t.truthy(JSON.stringify(output) === JSON.stringify(expected_output), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const firstNonZeroIndexInArray = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_data.firstNonZeroIndexInArray([0, 0, 0, 0, 0, 1, 0, 2]));
    
    t.truthy(output === 5, `Failed with unexpected output : ${output}.`);
};


const percentileOfBuckets = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_data.percentileOfBuckets([0,1,2,6,12,9,4,3,2,1], [0,10,20,30,40,50,60,70,80,90], 50));
    
    t.truthy(output === 39.16666666666667, `Failed with unexpected output : ${output}.`);
};


const percentileOfBucketedDimension = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_data.percentileOfBucketedDimension([
        { a: "foo", bucketed_dim: {buckets:[0,1,1,2,7,5,3,2,1,1]}},
        { a: "foo", bucketed_dim: {buckets:[0,0,1,4,5,4,1,1,1,0]}}
    ], "bucketed_dim", [0,10,20,30,40,50,60,70,80,90], 50));
    
    t.truthy(output === 39.16666666666667, `Failed with unexpected output : ${output}.`);
};


const getMaxBucketIndexWithEntries = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_data.getMaxBucketIndexWithEntries([0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,7,7,8,3,3,4,2,1,1,1,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0]));
    
    t.truthy(output === 40, `Failed with unexpected output : ${output}.`);
};


const getMaxBucketIndexWithEntriesFromData = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_data.getMaxBucketIndexWithEntriesFromData([
        { a: "foo", bucketed_dim: {buckets:[0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,7,7,8,3,3,4,2,1,1,1,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0]}},
        { a: "foo", bucketed_dim: {buckets:[0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,7,7,8,3,3,4,2,1,1,1,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0]}}
    ], "bucketed_dim"));
    
    t.truthy(output === 49, `Failed with unexpected output : ${output}.`);
};


const getMaxModeBucketIndexFromData = async t => {
    t.plan(1);

    let output = await browser.evaluate(() => window.akdv.utils_data.getMaxModeBucketIndexFromData([
        { a: "foo", bucketed_dim: {buckets:[0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,9,7,8,3,3,4,2,1,1,1,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0]}},
        { a: "foo", bucketed_dim: {buckets:[0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,7,7,8,3,3,4,2,1,1,1,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0]}}
    ], "bucketed_dim"));
    
    t.truthy(output === 23, `Failed with unexpected output : ${output}.`);
};


const mergeObjectsInArraysByKey = async t => {
    t.plan(1);

    let expected_output = [{ id: 'foo', v: 16 }, { id: 'bar', v: 11 }];
    let output = await browser.evaluate(() => window.akdv.utils_data.mergeObjectsInArraysByKey([{ id: 'foo', v: 7 }, { id: 'bar', v: 11 }], [{ id: 'foo', v: 16 }, { id: 'bar', v: 11 }], 'id'));
    
    t.truthy(JSON.stringify(output) === JSON.stringify(expected_output), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const appendUniqueObjectsInArraysByKey = async t => {
    t.plan(1);

    let expected_output = [{ id: 'foo', v: 7 }, { id: 'bar', v: 11 }, { id: 'buz', v: 8 }];
    let output = await browser.evaluate(() => window.akdv.utils_data.appendUniqueObjectsInArraysByKey([{ id: 'foo', v: 7 }, { id: 'bar', v: 11 }], [{ id: 'foo', v: 16 }, { id: 'buz', v: 8 }], 'id'));
    
    t.truthy(JSON.stringify(output) === JSON.stringify(expected_output), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const parseDSVToJSON = async t => {
    t.plan(2);

    let expected_csv_output = [{'id':'foo',v:'7'},{'id':'bar',v:'11'}];
    let expected_tsv_output = [{'id':'foo',v:7},{'id':'bar',v:11}];
    let from_csv_output = await browser.evaluate(() => window.akdv.utils_data.parseDSVToJSON('id,v\nfoo,7\nbar,11', 'csv'));
    let from_tsv_output = await browser.evaluate(() => window.akdv.utils_data.parseDSVToJSON('id\tv\nfoo\t7\nbar\t11', 'tsv'));
    
    t.truthy(JSON.stringify(from_csv_output) === JSON.stringify(expected_csv_output), `Failed with unexpected csv output : ${JSON.stringify(from_csv_output)} Expected: ${JSON.stringify(expected_csv_output)}.`);
    t.truthy(JSON.stringify(from_tsv_output) === JSON.stringify(expected_tsv_output), `Failed with unexpected tsv output : ${JSON.stringify(from_tsv_output)} Expected: ${JSON.stringify(expected_tsv_output)}.`);
};


const objectsArrayToDSV = async t => {
    t.plan(2);
    let expected_csv_output = 'id,v\nfoo,7\nbar,11\n';
    let expected_tsv_output = 'id\tv\nfoo\t7\nbar\t11\n';

    let csv_output = await browser.evaluate(() => window.akdv.utils_data.objectsArrayToDSV([{ id: 'foo', v: 7 }, { id: 'bar', v: 11 }], 'csv'));
    let tsv_output = await browser.evaluate(() => window.akdv.utils_data.objectsArrayToDSV([{ id: 'foo', v: 7 }, { id: 'bar', v: 11 }], 'tsv'));
    
    t.truthy(JSON.stringify(csv_output) === JSON.stringify(expected_csv_output), `Failed with unexpected csv output : ${csv_output}. Expected: ${expected_csv_output}`);
    t.truthy(JSON.stringify(tsv_output) === JSON.stringify(expected_tsv_output), `Failed with unexpected tsv output : ${tsv_output}. Expected: ${expected_tsv_output}`);
};


const objectMatch = async t => {
    t.plan(2);

    let output_expected_true = await browser.evaluate(() => window.akdv.utils_data.objectMatch({ id: 'foo', v: 7 }, { id: 'foo', v: 7 }));
    let output_expected_false = await browser.evaluate(() => window.akdv.utils_data.objectMatch({ id: 'foo', v: 10 }, { id: 'foo', v: 7 }));
    
    t.truthy(output_expected_true, `Failed with unexpected output : ${output_expected_true}.`);
    t.truthy(!output_expected_false, `Failed with unexpected output : ${output_expected_false}.`);
};


const removeArrayElemByIndex = async t => {
    t.plan(1);

    let expected_output = [0, 1, 2, 3, 4, 6, 7, 8, 9];
    let output = await browser.evaluate(() => window.akdv.utils_data.removeArrayElemByIndex([0,1,2,3,4,5,6,7,8,9], 5));
    
    t.truthy(JSON.stringify(output) === JSON.stringify(expected_output), `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const tm_data = require('../../src/data/performance_treemap.json');
const normalizeResultSchema = async t => {
    t.plan(1);

    let output = await browser.evaluate((data) => window.akdv.utils_data.normalizeResultSchema(data), tm_data);

    let is_expected_output = output.hasOwnProperty('charts') && output.charts.length && output.charts[0].hasOwnProperty('chart_group') && output.charts[0].chart_group === 'akdv-treemap' && output.charts[0].hasOwnProperty('columns') && output.charts[0].columns.length && output.charts[0].columns[0].length && JSON.stringify(Array.from(new Set(output.charts[0].columns[0]))) === JSON.stringify([ 'Desktop', 'Mobile', 'Tablet' ]);
    
    t.truthy(is_expected_output, `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


// ================================================================================================
// TEST SEQUENCE

const test_chart_html = 'performancetreemap_template.html'; // '_template.html' is appended to all nunjuck templates on publishing to dist
const test_data_file = '';

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV UNIT : DATA UTILS UNIT TEST PAGE', `${config.base_uri}html/${test_chart_html}?debug=${config.browser_logging_level}&data=${test_data_file}`));
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('UTILS_DATA - parseNumbersInObject', parseNumbersInObject);
test.serial('UTILS_DATA - getValueAsNumberOrFallbackValue', getValueAsNumberOrFallbackValue);
test.serial('UTILS_DATA - filterToDatumWithPropsWithValuesOf', filterToDatumWithPropsWithValuesOf);
test.serial('UTILS_DATA - hasDatumWithPropWithValueOf', hasDatumWithPropWithValueOf);
test.serial('UTILS_DATA - getDifferenceArrayFromNumericalArray', getDifferenceArrayFromNumericalArray);
test.serial('UTILS_DATA - getUniqueListOfValuesFromDataArrayForProp', getUniqueListOfValuesFromDataArrayForProp);
test.serial('UTILS_DATA - getfileExtension', getfileExtension);
test.serial('UTILS_DATA - getArrayFromMinToMaxWithSpecifiedSteps', getArrayFromMinToMaxWithSpecifiedSteps);
test.serial('UTILS_DATA - getArrayFromMinToMax', getArrayFromMinToMax);
test.serial('UTILS_DATA - getKeysInDatumWithNumericalValues', getKeysInDatumWithNumericalValues);
test.serial('UTILS_DATA - indexOfValueInAscendingArrayWithStep', indexOfValueInAscendingArrayWithStep);
test.serial('UTILS_DATA - uniqueArray', uniqueArray);
test.serial('UTILS_DATA - arraysIntersection', arraysIntersection);
test.serial('UTILS_DATA - arraysNotIntersection', arraysNotIntersection);
test.serial('UTILS_DATA - firstNonZeroIndexInArray', firstNonZeroIndexInArray);
test.serial('UTILS_DATA - percentileOfBuckets', percentileOfBuckets);
test.serial('UTILS_DATA - percentileOfBucketedDimension', percentileOfBucketedDimension);
test.serial('UTILS_DATA - getMaxBucketIndexWithEntries', getMaxBucketIndexWithEntries);
test.serial('UTILS_DATA - getMaxBucketIndexWithEntriesFromData', getMaxBucketIndexWithEntriesFromData);
test.serial('UTILS_DATA - getMaxModeBucketIndexFromData', getMaxModeBucketIndexFromData);
test.serial('UTILS_DATA - mergeObjectsInArraysByKey', mergeObjectsInArraysByKey);
test.serial('UTILS_DATA - appendUniqueObjectsInArraysByKey', appendUniqueObjectsInArraysByKey);
test.serial('UTILS_DATA - parseDSVToJSON', parseDSVToJSON);
test.serial('UTILS_DATA - objectsArrayToDSV', objectsArrayToDSV);
test.serial('UTILS_DATA - objectMatch', objectMatch);
test.serial('UTILS_DATA - removeArrayElemByIndex', removeArrayElemByIndex);
test.serial('UTILS_DATA - normalizeResultSchema', normalizeResultSchema);

/* jshint ignore:end */