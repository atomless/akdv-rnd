/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'


const bindAll = async t => {

    t.plan(2);

    let [output_expect_true, output_expext_false] = await browser.evaluate(() => {

    	let context = {};
    	let obj = {
    		a() {return this;},
    		b() {return this;},
    		c() {return this;}
    	};
	   	
	   	return [
	   		Object.keys(window.akdv.utils_obj.bindAll(context, obj)).reduce((a, b) => a && obj[b]() === context, obj),
	   		Object.keys(window.akdv.utils_obj.bindAll(obj, obj)).reduce((a, b) => a && obj[b]() === obj, obj)
	   	];
    });

    t.truthy(output_expect_true === true, `Failed with unexpected output : ${output_expect_true}.`);
    t.truthy(output_expext_false === false, `Failed with unexpected output : ${output_expext_false}.`);
};


const extend = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {

        let objAB = {
            fa() {return 'a';},
            fb() {return 'b';},
            get a() {return this.fa();},
            get b() {return this.fb();}
        };

        let objCD = {
            fc() {return 'c';},
            fd() {return 'd';},
            get c() {return this.fc();},
            get d() {return this.fd();}
        };

        return JSON.stringify(window.akdv.utils_obj.extend(objAB, objCD));
    });

    t.truthy(output === '{"a":"a","b":"b","c":"c","d":"d"}', `Failed with unexpected output : ${output}.`);
};


const update = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {

        let objABC = {
            a: 'a',
            b: 'b',
            c: 'c'
        };

        let objABD = {
            a: 'A',
            b: 'B',
            d: 'D'
        };
 
        return JSON.stringify(window.akdv.utils_obj.update(objABC, objABD));
    });

    t.truthy(output === '{"a":"A","b":"B","c":"c"}', `Failed with unexpected output : ${output}.`);
};


const keysWithValueChanges = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {

        let objABC = {
            a: 'a',
            b: 'b',
            c: 'c'
        };

        let objABD = {
            a: 'A',
            b: 'B',
            d: 'D'
        };
        
        return JSON.stringify(window.akdv.utils_obj.keysWithValueChanges(objABC, objABD));
    });

    t.truthy(output === '["a","b"]', `Failed with unexpected output : ${output}.`);
};


const extractGetterSetter = async t => {

    t.plan(2);

    let [output_descriptors, output_private_obj_bind_context_true] = await browser.evaluate(() => {

        let a = 'a', b = 'b';
        let private_obj = {

            get a() {return a;},
            get b() {return b;},
            set a(value) {a = value;},
            set b(value) {b = value;},
            get bindContext() {return this;}
        };

        let public_obj = {
            bindContext: private_obj.bindContext
        }

        return [JSON.stringify(Object.getOwnPropertyDescriptors(window.akdv.utils_obj.extractGetterSetter(private_obj))), public_obj.bindContext === private_obj];
    });

    t.truthy(output_descriptors === '{"a":{"enumerable":false,"configurable":false},"b":{"enumerable":false,"configurable":false},"bindContext":{"enumerable":false,"configurable":false}}', `Failed with unexpected output : ${output_descriptors}.`);

    t.truthy(output_private_obj_bind_context_true === true, `Failed with unexpected output : ${output_private_obj_bind_context_true}.`);
};


const factoryExports = async t => {

    t.plan(2);

    let [output_descriptors, output_private_obj_bind_context_true] = await browser.evaluate(() => {
        
        let a = 'a', b = 'b';
        let private_obj = {
            private_fn_x() { return 1},
            private_fn_y() { return 2},
            get a() {return a;},
            get b() {return b;},
            set a(value) {a = value;},
            set b(value) {b = value;},
            get bindContext() {return this;}
        };

        let public_obj = window.akdv.utils_obj.factoryExports(private_obj, {
            public_fn_z() {return 3}
        });

        return [JSON.stringify(Object.getOwnPropertyDescriptors(public_obj)), public_obj.bindContext === private_obj];
    });

    t.truthy(output_descriptors === '{"a":{"enumerable":false,"configurable":false},"b":{"enumerable":false,"configurable":false},"bindContext":{"enumerable":false,"configurable":false},"public_fn_z":{"writable":true,"enumerable":true,"configurable":false}}', `Failed with unexpected output : ${output_descriptors}.`);

    t.truthy(output_private_obj_bind_context_true === true, `Failed with unexpected output : ${output_private_obj_bind_context_true}.`);
};


const getKeyByValue = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {

        let objABC = {
            a: 'a',
            b: 'b',
            c: 'c'
        };
        
        return JSON.stringify([window.akdv.utils_obj.getKeyByValue(objABC, 'c'), window.akdv.utils_obj.getKeyByValue(objABC, 'b'), window.akdv.utils_obj.getKeyByValue(objABC, 'a')]);
    });

    t.truthy(output === '["c","b","a"]', `Failed with unexpected output : ${output}.`);
};


const filterKeysByArray = async t => {

    t.plan(2);

    let [output_filtered_keys, output_filtered_keys_with_transform] = await browser.evaluate(() => {

        let objABC = {
            a: 'a',
            b: 'b',
            c: 'c',
            d: 'd'
        };
        
        return [JSON.stringify(window.akdv.utils_obj.filterKeysByArray(objABC, ['b', 'c'])), JSON.stringify(window.akdv.utils_obj.filterKeysByArray(objABC, ['a', 'c', 'd'], { 'a': 'A', 'd': 'D'}))];
    });

    t.truthy(output_filtered_keys === '{"b":"b","c":"c"}', `Failed with unexpected output : ${output_filtered_keys}.`);
    t.truthy(output_filtered_keys_with_transform === '{"A":"a","c":"c","D":"d"}', `Failed with unexpected output : ${output_filtered_keys_with_transform}.`);
};


const getNamespaceInObj = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {

        let objABC = {a:{b:{c: 'a, b, c' }}};
        
        return window.akdv.utils_obj.getNamespaceInObj(objABC, 'a.b.c');
    });

    t.truthy(output === 'a, b, c', `Failed with unexpected output : ${output}.`);
};


const setNamespaceInObj = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {

        let obj = {};
        window.akdv.utils_obj.setNamespaceInObj(obj, 'a.b.c', 'a, b, c');

        return JSON.stringify(obj);
    });

    t.truthy(output === '{"a":{"b":{"c":"a, b, c"}}}', `Failed with unexpected output : ${output}.`);
};


const applyTransformMapToValuesInObjectByKey = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {
        
        let objABC = {
            a: 'a',
            b: 'b',
            c: 'c'
        };

        let value_transform_map = {
            'a': {
                regex: /a/, 
                replace: 'A' 
            },
            'b': {
                regex: /b/, 
                replace: 'B'
            } 
        };

        return JSON.stringify(window.akdv.utils_obj.applyTransformMapToValuesInObjectByKey(objABC, value_transform_map));
    });

    t.truthy(output === '{"a":"A","b":"B","c":"c"}', `Failed with unexpected output : ${output}.`);
};


const applyTransformMapKeys = async t => {

    t.plan(1);

    let output = await browser.evaluate(() => {
        
        let objABC = {
            a: 'a',
            b: 'b',
            c: 'c'
        };

        let key_transform_map = {
            'a': 'A',
            'b': 'B'
        };

        return JSON.stringify(window.akdv.utils_obj.applyTransformMapKeys(objABC, key_transform_map));
    });

    t.truthy(output === '{"c":"c","A":"a","B":"b"}', `Failed with unexpected output : ${output}.`);
};


// ================================================================================================
// TEST SEQUENCE

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV UNIT : OBJECT UTILS UNIT TEST PAGE', config.local_data_test_url));
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('UTILS_OBJ - bindAll', bindAll);
test.serial('UTILS_OBJ - extend', extend); 
test.serial('UTILS_OBJ - update', update);
test.serial('UTILS_OBJ - keysWithValueChanges', keysWithValueChanges);
test.serial('UTILS_OBJ - extractGetterSetter', extractGetterSetter);
test.serial('UTILS_OBJ - factoryExports', factoryExports);
test.serial('UTILS_OBJ - getKeyByValue', getKeyByValue);
test.serial('UTILS_OBJ - filterKeysByArray', filterKeysByArray);
test.serial('UTILS_OBJ - getNamespaceInObj', getNamespaceInObj);
test.serial('UTILS_OBJ - setNamespaceInObj', setNamespaceInObj);
test.serial('UTILS_OBJ - applyTransformMapToValuesInObjectByKey', applyTransformMapToValuesInObjectByKey);
test.serial('UTILS_OBJ - applyTransformMapKeys', applyTransformMapKeys);
/* jshint ignore:end */