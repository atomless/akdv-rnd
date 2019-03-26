/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'

const perf_data = require('../../src/data/test/unit/utils_hierarchy_perf_treemap_transform_alpha.json');
let hierarchical_perf_data = {};
let aggregated_hierarchical_perf_data = {};
let d3_hierarchy = {};
let d3_treemap_root_nodes = [];
let perf_bucket_values = {
  'timer': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,24,26,28,30,32,34,36,38,40,45,50,55,60,65,70,75,80,85,90,95,100,110,120,130,140,150,170,190,210,230,250,300,350,400,450,500,550,600,700,800,900,1050,1200,1350,1500,1650,1800,1950,2100,2250,2400,2550,2700,2850,3000,3150,3300,3450,3600,3750,3950,4200,4500,4800,5100,5400,5700,6000,6300,6600,6900,7200,7500,7800,8100,8400,8700,9000,9300,9600,9900,10200,10500,10800,11400,12000,12600,13200,13800,14400,15000,16200,17400,18600,20000,37500,75000,150000,300000,450000,600001]
};


const getAsHierarchicalData = async t => {
    t.plan(10);

    let normalized = await browser.evaluate(d => window.akdv.utils_data.normalizeResultSchema(d.charts[0]), perf_data);

    let output = hierarchical_perf_data = await browser.evaluate(d => {
        return window.akdv.utils_hierarchy.getAsHierarchicalData(d, 'countrycode', ...['devicetypename', 'pagegroupname', 'useragentname', 'countrycode']);
    }, normalized.data);

    t.truthy(output.name === 'devicetypename', `Failed with unexpected output : ${output.name}. Expected root name to be: "devicetypename".`);
    t.truthy(output.children.length === 3, `Failed with unexpected output : ${output.children.length}. Expected output.children.length to be: 3.`);

    t.truthy(output.children[0].name === 'Desktop', `Failed with unexpected output : ${output.children[0].name}. Expected output.children[0].name to be: "Desktop".`);
    t.truthy(output.children[0].children.length === 7, `Failed with unexpected output : ${output.children[0].children.length}. Expected output.children[0].children.length to be: 7.`);

    t.truthy(output.children[0].children[0].name === 'Category', `Failed with unexpected output : ${output.children[0].children[0].name}. Expected output.children[0].children[0].name to be: "Category".`);
    t.truthy(output.children[0].children[0].children.length === 16, `Failed with unexpected output : ${output.children[0].children[0].children.length}. Expected output.children[0].children[0].children.length to be: 16.`);

    t.truthy(output.children[0].children[0].children[0].name === 'AOL', `Failed with unexpected output : ${output.children[0].children[0].children[0].name}. Expected output.children[0].children[0].children[0].name to be: 16.`);
    t.truthy(output.children[0].children[0].children[0].children.length === 1, `Failed with unexpected output : ${output.children[0].children[0].children[0].children.length}. Expected output.children[0].children[0].children[0].children.length to be: 16.`);

    t.truthy(output.children[0].children[0].children[0].children[0].devicetypename === 'Desktop', `Failed with unexpected output : ${output.children[0].children[0].children[0].children[0].devicetypename}. Expected output.children[0].children[0].children[0].children[0].devicetypename to be: "Desktop".`);
    t.truthy(output.children[0].children[0].children[0].children[0].timer.buckets.length === 122, `Failed with unexpected output : ${output.children[0].children[0].children[0].children[0].timer.buckets.length}. Expected output.children[0].children[0].children[0].children.length to be: 122.`); 
};


const setUUIDForAllNodesInHierarchicalObject = async t => {
    t.plan(5);

    let output = hierarchical_perf_data = await browser.evaluate(d => window.akdv.utils_hierarchy.setUUIDForAllNodesInHierarchicalObject(d), hierarchical_perf_data);
    
    t.truthy(output.uuid, `Failed with unexpected output.uuid : ${output.uuid}.`);
    t.truthy(output.children[0].uuid, `Failed with unexpected output.children[0].uuid : ${output.children[0].uuid}.`);
    t.truthy(output.children[0].children[0].uuid, `Failed with unexpected output.children[0].children[0].uuid : ${output.children[0].children[0].uuid}.`);
    t.truthy(output.children[0].children[0].children[0].uuid, `Failed with unexpected output.children[0].children[0].children[0].uuid : ${output.children[0].children[0].children[0].uuid}.`);
    t.truthy(output.children[0].children[0].children[0].children[0].uuid, `Failed with unexpected output.children[0].children[0].children[0].children[0].uuid : ${output.children[0].children[0].children[0].children[0].uuid}.`);
};


const aggregateDescendantsOfNodeAlongDimensions = async t => {
    t.plan(12);

    let output = await browser.evaluate(
        (d,pbv) => window.akdv.utils_hierarchy.aggregateDescendantsOfNodeAlongDimensions(d, ['beacons'], [], [], ['timer'], ['devicetypename','countrycode','pagegroupname','useragentname'], pbv, 50, 'beacons'), 
        JSON.parse(JSON.stringify(hierarchical_perf_data)),
        perf_bucket_values
    );

    t.truthy(output.name === 'devicetypename', `Failed with unexpected output : ${output.name}. Expected root name to be: "devicetypename".`);
    t.truthy(output.percentile_calculated === 50, `Failed with unexpected output.percentile_calculated : ${output.percentile_calculated}. Expected output.percentile_calculated to be: 50.`);
    t.truthy(output.children.length === 3, `Failed with unexpected output : ${output.children.length}. Expected output.children.length to be: 3.`);

    t.truthy(output.children[0].name === 'Desktop', `Failed with unexpected output : ${output.children[0].name}. Expected output.children[0].name to be: Desktop.`);
    t.truthy(output.children[0].beacons === 23565, `Failed with unexpected output : ${output.children[0].beacons}. Expected output.children[0].beacons to be: 23565.`);
    t.truthy(output.children[0].timer === 164.75027746947836, `Failed with unexpected output : ${output.children[0].timer}. Expected output.children[0].timer to be: 164.75027746947836.`);

    t.truthy(output.children[1].name === 'Mobile', `Failed with unexpected output : ${output.children[1].name}. Expected output.children[1].name to be: Mobile.`);
    t.truthy(output.children[1].beacons === 8014, `Failed with unexpected output : ${output.children[1].beacons}. Expected output.children[1].beacons to be: 8014.`);
    t.truthy(output.children[1].timer === 229.15384615384616, `Failed with unexpected output : ${output.children[1].timer}. Expected output.children[1].timer to be: 229.15384615384616.`);

    t.truthy(output.children[2].name === 'Tablet', `Failed with unexpected output : ${output.children[2].name}. Expected output.children[2].name to be: Tablet.`);
    t.truthy(output.children[2].beacons === 1465, `Failed with unexpected output : ${output.children[2].beacons}. Expected output.children[2].beacons to be: 1465.`);
    t.truthy(output.children[2].timer === 169.79591836734693, `Failed with unexpected output : ${output.children[2].timer}. Expected output.children[2].timer to be: 169.79591836734693.`);
};


const calculatePercentilesForAggregateValuesInHierarchyNode = async t => {
    t.plan(7);

    aggregated_hierarchical_perf_data = await browser.evaluate(
        (d,pbv) => window.akdv.utils_hierarchy.calculatePercentilesForAggregateValuesInHierarchyNode(d, pbv, 50), 
        JSON.parse(JSON.stringify(hierarchical_perf_data)),
        perf_bucket_values
    );

    t.truthy(aggregated_hierarchical_perf_data.name === 'devicetypename', `Failed with unexpected output : ${aggregated_hierarchical_perf_data.name}. Expected aggregated_hierarchical_perf_data.name to be: "devicetypename".`);
    t.truthy(aggregated_hierarchical_perf_data.percentile_calculated === true, `Failed with unexpected aggregated_hierarchical_perf_data.percentile_calculated : ${aggregated_hierarchical_perf_data.percentile_calculated}. Expected aggregated_hierarchical_perf_data.percentile_calculated to be: true.`);
    t.truthy(aggregated_hierarchical_perf_data.children.length === 3, `Failed with unexpected output : ${aggregated_hierarchical_perf_data.children.length}. Expected aggregated_hierarchical_perf_data.children.length to be: 3.`);

    t.truthy(aggregated_hierarchical_perf_data.children[0].children[0].children[0].percentile_calculated === 50, `Failed with unexpected output : ${aggregated_hierarchical_perf_data.children[0].children[0].children[0].percentile_calculated}. Expected aggregated_hierarchical_perf_data.children[0].children[0].children[0].percentile_calculated to be: 50.`);
    t.truthy(aggregated_hierarchical_perf_data.children[0].children[0].children[0].children.length === 1, `Failed with unexpected output : ${aggregated_hierarchical_perf_data.children[0].children[0].children[0].children.length}. Expected aggregated_hierarchical_perf_data.children[0].children[0].children[0].children.length to be: 1.`);

    t.truthy(aggregated_hierarchical_perf_data.children[0].children[0].children[0].children[0].timer === 70, `Failed with unexpected output : ${aggregated_hierarchical_perf_data.children[0].children[0].children[0].children[0].timer}. Expected aggregated_hierarchical_perf_data.children[0].children[0].children[0].children[0].timer to be: 70.`);

    t.truthy(aggregated_hierarchical_perf_data.children[0].children[0].children[15].children[0].timer === 79.5, `Failed with unexpected output : ${aggregated_hierarchical_perf_data.children[0].children[0].children[15].children[0].timer}. Expected aggregated_hierarchical_perf_data.children[0].children[0].children[15].children[0].timer to be: 79.5.`);
};


const largestValueOfDimensionOfNode = async t => {
    t.plan(1);

    let output = await browser.evaluate(d => window.akdv.utils_hierarchy.largestValueOfDimensionOfNode(d, 'beacons'), JSON.parse(JSON.stringify(hierarchical_perf_data)));

    t.truthy(output === 4894, `Failed with unexpected output : ${output}. Expected output to be: 4894.`);
};


const setDescendantCountForAllNodesInHierarchicalObject = async t => {
    t.plan(6);

    let output = await browser.evaluate(d => window.akdv.utils_hierarchy.setDescendantCountForAllNodesInHierarchicalObject(d), JSON.parse(JSON.stringify(hierarchical_perf_data)));

    t.truthy(output.name === 'devicetypename', `Failed with unexpected output : ${output.name}. Expected output.name to be: "devicetypename".`);
    t.truthy(output.descendant_count === 843, `Failed with unexpected output.descendant_count : ${output.descendant_count}. Expected output.descendant_count to be: 843.`);
    t.truthy(output.children.length === 3, `Failed with unexpected output : ${output.children.length}. Expected output.children.length to be: 3.`);

    t.truthy(output.children[0].descendant_count === 462, `Failed with unexpected output : ${output.children[0].descendant_count}. Expected output.children[0].descendant_count to be: 50.`);
    t.truthy(output.children[1].descendant_count === 268, `Failed with unexpected output : ${output.children[1].descendant_count}. Expected output.children[1].descendant_count to be: 268.`);
    t.truthy(output.children[2].descendant_count === 113, `Failed with unexpected output : ${output.children[2].descendant_count}. Expected output.children[2].descendant_count to be: 113.`);
    // ... we could go on but a couple of levels probably proves it's working
};


const getUniqueArrayOfValuesInHierarchyAlongDimensionForNode = async t => {
    t.plan(1);

    let output = await browser.evaluate(d => window.akdv.utils_hierarchy.getUniqueArrayOfValuesInHierarchyAlongDimensionForNode(d, 'devicetypename'), hierarchical_perf_data);

    t.truthy(JSON.stringify(output) === `["Desktop","Mobile","Tablet"]`, `Failed with unexpected output : "${JSON.stringify(output)}". Expected output to be: "['Desktop','Mobile','Tablet']".`);
};


// the following tests require a d3 treemap hierarchy node 


const getAWrappedLeafAndADepthFromObjectHierarchyWithMatchingUUID = async t => {
    t.plan(2);

    let [output_node, output_depth] = await browser.evaluate(hd => {

        const d3h = d3.hierarchy(hd).sum(d => d['beacons']).sort((a, b) => b.value - a.value);

        const d3_treemap = d3.treemap()
            .tile(d3.treemapSquarify);

        d3_treemap
            .size([2281, 580])
            .paddingInner(1)
            .paddingOuter(3)
            .paddingTop(d => (d.children)? 30 : 0)
            .round(false);

        const tree = d3_treemap(d3h);

        const d3tmns = d3_treemap(window.akdv.utils_hierarchy.filterOutSmallNodes(tree, 5, 5).sum(d => d['beacons'])).descendants();

        // this simulates clicking down one level in a non aggregated view of a treemap
        return window.akdv.utils_hierarchy.getAWrappedLeafAndADepthFromObjectHierarchyWithMatchingUUID(hd, d3tmns[0].children[0]);

    }, JSON.parse(JSON.stringify(aggregated_hierarchical_perf_data)));

    t.truthy(JSON.stringify(output_node) === JSON.stringify(aggregated_hierarchical_perf_data.children[0]), `Failed with unexpected output : ${JSON.stringify(output_node)}. Expected output_node to be: "${JSON.stringify(aggregated_hierarchical_perf_data.children[0])}".`);
    t.truthy(output_depth === 1, `Failed with unexpected output : ${output_depth}. Expected output_depth to be: 1.`);
};


const getBreadCrumbTextFromHierarchicalData = async t => {
    t.plan(1);

    const output = await browser.evaluate(hd => {

        const d3h = d3.hierarchy(hd).sum(d => d['beacons']).sort((a, b) => b.value - a.value);

        const d3_treemap = d3.treemap()
            .tile(d3.treemapSquarify);

        d3_treemap
            .size([2281, 580])
            .paddingInner(1)
            .paddingOuter(3)
            .paddingTop(d => (d.children)? 30 : 0)
            .round(false);

        const tree = d3_treemap(d3h);

        const d3tmns = d3_treemap(window.akdv.utils_hierarchy.filterOutSmallNodes(tree, 5, 5).sum(d => d['beacons'])).descendants();

        return window.akdv.utils_hierarchy.getBreadCrumbTextFromHierarchicalData(d3tmns[0].children[0].children[0].children[0]);

    }, JSON.parse(JSON.stringify(aggregated_hierarchical_perf_data)));

    t.truthy(output === 'Desktop/Category/Chrome', `Failed with unexpected output : ${output}. Expected output_depth to be: 1.`);
};


const getBreadCrumbNodeArrayFromHierarchicalData = async t => {
    t.plan(1);

    const output = await browser.evaluate(hd => {

        const d3h = d3.hierarchy(hd).sum(d => d['beacons']).sort((a, b) => b.value - a.value);

        const d3_treemap = d3.treemap()
            .tile(d3.treemapSquarify);

        d3_treemap
            .size([2281, 580])
            .paddingInner(1)
            .paddingOuter(3)
            .paddingTop(d => (d.children)? 30 : 0)
            .round(false);

        const tree = d3_treemap(d3h);

        const d3tmns = d3_treemap(window.akdv.utils_hierarchy.filterOutSmallNodes(tree, 5, 5).sum(d => d['beacons'])).descendants();

        return window.akdv.utils_hierarchy.getBreadCrumbNodeArrayFromHierarchicalData(d3tmns[0].children[0].children[0].children[0]);

    }, JSON.parse(JSON.stringify(aggregated_hierarchical_perf_data)));

    t.truthy(output[0].name === 'Desktop' && output[1].name === 'Category' && output[2].name === 'Chrome', `Failed with unexpected output : ${JSON.stringify(output)}.`);
};


const filterOutSmallNodes = async t => {
    t.plan(1);

    const output = await browser.evaluate(hd => {

        const d3h = d3.hierarchy(hd).sum(d => d['beacons']).sort((a, b) => b.value - a.value);

        const d3_treemap = d3.treemap()
            .tile(d3.treemapSquarify);

        d3_treemap
            .size([2281, 580])
            .paddingInner(1)
            .paddingOuter(3)
            .paddingTop(d => (d.children)? 30 : 0)
            .round(false);

        const tree = d3_treemap(d3h);

        return window.akdv.utils_hierarchy.filterOutSmallNodes(tree, 50, 50).descendants().length;

    }, JSON.parse(JSON.stringify(aggregated_hierarchical_perf_data)));

    t.truthy(output === 66, `Failed with unexpected output : ${output}.`);
};


// ================================================================================================
// TEST SEQUENCE


const test_chart_html = 'performancetreemap_template.html'; // '_template.html' is appended to all nunjuck templates on publishing to dist
const test_data_file = '';

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV UNIT : HIERARCHY UTILS UNIT TEST PAGE', `${config.base_uri}html/${test_chart_html}?debug=${config.browser_logging_level}&data=${test_data_file}`));
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

// methods that require hierarchical
test.serial('UTILS_HIERARCHY - getAsHierarchicalData', getAsHierarchicalData);
test.serial('UTILS_HIERARCHY - setUUIDForAllNodesInHierarchicalObject', setUUIDForAllNodesInHierarchicalObject);
test.serial('UTILS_HIERARCHY - aggregateDescendantsOfNodeAlongDimensions', aggregateDescendantsOfNodeAlongDimensions);
test.serial('UTILS_HIERARCHY - calculatePercentilesForAggregateValuesInHierarchyNode', calculatePercentilesForAggregateValuesInHierarchyNode);
test.serial('UTILS_HIERARCHY - largestValueOfDimensionOfNode', largestValueOfDimensionOfNode);
test.serial('UTILS_HIERARCHY - setDescendantCountForAllNodesInHierarchicalObject', setDescendantCountForAllNodesInHierarchicalObject);
test.serial('UTILS_HIERARCHY - getUniqueArrayOfValuesInHierarchyAlongDimensionForNode', getUniqueArrayOfValuesInHierarchyAlongDimensionForNode);

// methods that require a d3 hierarchy treemap node

test.serial('UTILS_HIERARCHY - getAWrappedLeafAndADepthFromObjectHierarchyWithMatchingUUID', getAWrappedLeafAndADepthFromObjectHierarchyWithMatchingUUID);
test.serial('UTILS_HIERARCHY - getBreadCrumbTextFromHierarchicalData', getBreadCrumbTextFromHierarchicalData);
test.serial('UTILS_HIERARCHY - getBreadCrumbNodeArrayFromHierarchicalData', getBreadCrumbNodeArrayFromHierarchicalData);
test.serial('UTILS_HIERARCHY - filterOutSmallNodes', filterOutSmallNodes);

/* jshint ignore:end */