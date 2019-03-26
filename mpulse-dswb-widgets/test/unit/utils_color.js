/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'



//================================================================================================
//TEST SEQUENCE

const getColorRangeArrayStartingFromBgColor = async t => {

    t.plan(1);

    const expected_output = "[\"hsl(180, 19%, 78%)\",\"hsl(180, 19%, 98%)\"]";
    const output = await browser.evaluate(() => window.akdv.utils_color.getColorRangeArrayStartingFromBgColor());
    
    t.truthy(JSON.stringify(output) === expected_output, `Invalid color values returned`);
};


const rgbaValuesArrayToHslaValuesArray = async t => {

    t.plan(5);

    const noArgs = await browser.evaluate(() => {

        let result = window.akdv.utils_color.rgbaValuesArrayToHslaValuesArray();

        if(Number.isNaN(result[0]) === true && Number.isNaN(result[1]) === true && Number.isNaN(result[2]) === true && result[3] === 1 )
        {
            return true;
        }
        else
        {
            return false;
        }
        
    });
    
    const white = await browser.evaluate(() => {

        let result = window.akdv.utils_color.rgbaValuesArrayToHslaValuesArray(255, 255, 255, 1);

        if(result[0] === 0 && result[1] === 0 && result[2] === 1 && result[3] === 1 )
        {
            return true;
        }
        else
        {
            return false;
        }
        
    });
    
    const red = await browser.evaluate(() => {

        let result = window.akdv.utils_color.rgbaValuesArrayToHslaValuesArray(255, 0, 0, 1);

        if(result[0] === 0 && result[1] === 1 && result[2] === 0.5 && result[3] === 1 )
        {
            return true;
        }
        else
        {
            return false;
        }

    });
    
    const orangeSemiTrans = await browser.evaluate(() => {

        let result = window.akdv.utils_color.rgbaValuesArrayToHslaValuesArray(255, 128, 0, 0.2);

        if(result[0] === 30 && result[1] === 1 && result[2] === 0.5 && result[3] === 0.2 )
        {
            return true;
        }
        else
        {
            return false;
        }

    });
    
    const darkGreenSemiTrans = await browser.evaluate(() => {

        let result = window.akdv.utils_color.rgbaValuesArrayToHslaValuesArray(0, 64, 0, 0.75);

        if(result[0] === 120 && result[1] === 1 && result[2] === 0.12549019607843137 && result[3] === 0.75 )
        {
            return true;
        }
        else
        {
            return false;
        }

    });
    
    t.truthy(noArgs, `Invalid color values returned`);
    t.truthy(white, `Invalid color values returned, for WHITE`);
    t.truthy(red, `Invalid color values returned, for RED`);
    t.truthy(orangeSemiTrans, `Invalid color values returned, for semi transparent ORANGE`);
    t.truthy(darkGreenSemiTrans, `Invalid color values returned, for semi transparent ORANGE`);
};


const hslaValuesArrayToHslaString = async t => {

    t.plan(4);
    
    const noArgs = await browser.evaluate(() => {

        let failed = false;
        
        try {
            window.akdv.utils_color.hslaValuesArrayToHslaString();
        } catch {
            failed = true;
        }
        
        return failed;  
    });
    
    const whiteNoAlpha = await browser.evaluate(() => {

        let result = window.akdv.utils_color.hslaValuesArrayToHslaString([0, 0, 1]);

        if(result === 'hsl(0, 0%, 100%)' )
        {
            return true;
        }
        else
        {
            return false;
        }
        
    });
    
    const greenSemiTransparent = await browser.evaluate(() => {

        let result = window.akdv.utils_color.hslaValuesArrayToHslaString([120, 1, 0.5, 0.5]);

        if(result === 'hsla(120, 100%, 50%, 0.5)' )
        {
            return true;
        }
        else
        {
            return false;
        }
        
    });
    
    const lightYellowSemiTransparent = await browser.evaluate(() => {

        let result = window.akdv.utils_color.hslaValuesArrayToHslaString([60, 0.5, 0.8, 0.9]);

        if(result === 'hsla(60, 50%, 80%, 0.9)' )
        {
            return true;
        }
        else
        {
            return false;
        }
        
    });
    
    
    t.truthy(noArgs, `Passed test, when no args were passed into method. Should have failed!`);
    t.truthy(whiteNoAlpha, `Invalid HSL string returned for WHITE HSL`);
    t.truthy(greenSemiTransparent, `Invalid HSLA string returned for RED HSLA`);
    t.truthy(greenSemiTransparent, `Invalid HSLA string returned for LIGHT YELLOW HSLA`);
};


const rgbaStringToHslaValuesArray = async t => {

    t.plan(4);
    
    const noArgs = await browser.evaluate(() => {

        let failed = false;
        
        try {
            window.akdv.utils_color.rgbaStringToHslaValuesArray();
        } catch {
            failed = true;
        }
        
        return failed;
    });
    
    const whiteNoAlpha = await browser.evaluate(() => {

        const result = window.akdv.utils_color.rgbaStringToHslaValuesArray('rgb(255, 255, 255)');

        if(result.length === 4 && result[0] === 0 && result[1] === 0 && result[2] === 1 && result[3] === 1)
        {
            return true;
        }
        else
        {
            return false;
        }
    });
    
    const greenSemiTransparent = await browser.evaluate(() => {

        const result = window.akdv.utils_color.rgbaStringToHslaValuesArray('rgba(0, 255, 0, 0.25)');

        if(result.length === 4 && result[0] === 120 && result[1] === 1 && result[2] === 0.5 && result[3] === 0.25)
        {
            return true;
        }
        else
        {
            return false;
        }
        
    });
    
    const lightYellowSemiTransparent = await browser.evaluate(() => {

        const result = window.akdv.utils_color.rgbaStringToHslaValuesArray('rgba(255, 255, 192, 0.1)');

        if(result.length === 4 && result[0] === 60 && result[1] === 1 && result[2] === 0.8764705882352941 && result[3] === 0.1)
        {
            return true;
        }
        else
        {
            return false;
        }
        
    });
    
    
    t.truthy(noArgs, `Passed test, when no args were passed into method. Should have failed!`);
    t.truthy(whiteNoAlpha, `Invalid HSLA array returned for RGBA string`);
    t.truthy(greenSemiTransparent, `Invalid HSLA array returned for RGBA string`);
    t.truthy(lightYellowSemiTransparent, `Invalid HSLA array returned for RGBA string`);
};


const hslaStringToHslaValuesArray = async t => {

    t.plan(4);
    
    const noArgs = await browser.evaluate(() => {

        let failed = false;
        
        try {
            window.akdv.utils_color.hslaStringToHslaValuesArray();
        } catch {
            failed = true;
        }
        
        return failed;
    });
    
    const whiteNoAlpha = await browser.evaluate(() => {

        const result = window.akdv.utils_color.hslaStringToHslaValuesArray('hsl(0, 0, 100)');

        if(result.length === 3 && result[0] === 0 && result[1] === 0 && result[2] === 1)
        {
            return true;
        }
        else
        {
            return false;
        }
    });
    
    const green = await browser.evaluate(() => {

        const result = window.akdv.utils_color.hslaStringToHslaValuesArray('hsl(120, 100, 50)');

        if(result.length === 3 && result[0] === 120 && result[1] === 1 && result[2] === 0.5 )
        {
            return true;
        }
        else
        {
            return false;
        }
    });
    
    const lightYellowSemiTransparent = await browser.evaluate(() => {

        const result = window.akdv.utils_color.hslaStringToHslaValuesArray('hsla(60, 100, 80, 50)');

        if(result.length === 4 && result[0] === 60 && result[1] === 1 && result[2] === 0.8 && result[3] === 0.5)
        {
            return true;
        }
        else
        {
            return false;
        }
    });
    
    t.truthy(noArgs, `Passed test, when no args were passed into method. Should have failed!`);
    t.truthy(whiteNoAlpha, `Invalid HSLA array returned for RGBA string`);
    t.truthy(green, `Invalid HSLA array returned for RGBA string`);
    t.truthy(lightYellowSemiTransparent, `Invalid HSLA array returned for RGBA string`);
};


const rgbaStringToRgbaValuesArray = async t => {

    t.plan(4);
    
    const noArgs = await browser.evaluate(() => {

        let failed = false;
        
        try {
            window.akdv.utils_color.rgbaStringToRgbaValuesArray();
        } catch {
            failed = true;
        }
        
        return failed;
    });
    
    const purpleNoAlpha = await browser.evaluate(() => {

        const result = window.akdv.utils_color.rgbaStringToRgbaValuesArray('rgb(255, 0, 255)');

        if(result.length === 3 && result[0] === 255 && result[1] === 0 && result[2] === 255)
        {
            return true;
        }
        else
        {
            return false;
        }
    });
    
    const green = await browser.evaluate(() => {

        const result = window.akdv.utils_color.rgbaStringToRgbaValuesArray('rgb(0, 128, 0)');

        if(result.length === 3 && result[0] === 0 && result[1] === 128 && result[2] === 0 )
        {
            return true;
        }
        else
        {
            return false;
        }
    });
    
    const lightYellowSemiTransparent = await browser.evaluate(() => {

        const result = window.akdv.utils_color.rgbaStringToRgbaValuesArray('rgba(255, 255, 200, 50)');

        if(result.length === 4 && result[0] === 255 && result[1] === 255 && result[2] === 200 && result[3] === 50)
        {
            return true;
        }
        else
        {
            return false;
        }
    });
    
    t.truthy(noArgs, `Passed test, when no args were passed into method. Should have failed!`);
    t.truthy(purpleNoAlpha, `Invalid HSLA array returned for RGBA string`);
    t.truthy(green, `Invalid HSLA array returned for RGBA string`);
    t.truthy(lightYellowSemiTransparent, `Invalid HSLA array returned for RGBA string`);
};


const hexStringToRgbValuesArray = async t => {

    t.plan(4);
    
    const noArgs = await browser.evaluate(() => {

        let failed = false;
        
        try {
            window.akdv.utils_color.rgbaStringToRgbaValuesArray();
        } catch {
            failed = true;
        }
        
        return failed;
    });
    
    const purple = await browser.evaluate(() => {

        const result = window.akdv.utils_color.hexStringToRgbValuesArray('#9900FF');

        if(result.length === 3 && result[0] === 153 && result[1] === 0 && result[2] === 255)
        {
            return true;
        }
        else
        {
            return false;
        }
    });

    const yellowgreen = await browser.evaluate(() => {

        const result = window.akdv.utils_color.hexStringToRgbValuesArray('#80FF00');

        if(result.length === 3 && result[0] === 128 && result[1] === 255 && result[2] === 0 )
        {
            return true;
        }
        else
        {
            return false;
        }
    });
   
    const darkBrown = await browser.evaluate(() => {

        const result = window.akdv.utils_color.hexStringToRgbValuesArray('#443311');

        if(result.length === 3 && result[0] === 68 && result[1] === 51 && result[2] === 17 )
        {
            return true;
        }
        else
        {
            return false;
        }
    });
    
    t.truthy(noArgs, `Passed test, when no args were passed into method. Should have failed!`);
    t.truthy(purple, `Invalid RGB array returned for HEX string`);
    t.truthy(yellowgreen, `Invalid RGB array returned for HEX string`);
    t.truthy(darkBrown, `Invalid RGB array returned for HEX string`);
};


const hexStringToHslaValuesArray = async t => {

    t.plan(4);
    
    const noArgs = await browser.evaluate(() => {

        let failed = false;
        
        try {
            window.akdv.utils_color.hexStringToHslaValuesArray();
        } catch {
            failed = true;
        }
        
        return failed;
    });
    
    const purple = await browser.evaluate(() => {

        const result = window.akdv.utils_color.hexStringToHslaValuesArray('#9900FF');

        if(result.length === 4 && result[0] === 276 && result[1] === 1 && result[2] === 0.5 && result[3] === 1)
        {
            return true;
        }
        else
        {
            return false;
        }
    });

    const yellowgreen = await browser.evaluate(() => {

        const result = window.akdv.utils_color.hexStringToHslaValuesArray('#80FF00');

        if(result.length === 4 && result[0] === 89 && result[1] === 1 && result[2] === 0.5 && result[3] === 1)
        {
            return true;
        }
        else
        {
            return false;
        }
    });
   
    const darkBrown = await browser.evaluate(() => {

        const result = window.akdv.utils_color.hexStringToHslaValuesArray('#443311');

        if(result.length === 4 && result[0] === 40 && result[1] === 0.6000000000000001 && result[2] === 0.16666666666666666 && result[3] === 1)
        {
            return true;
        }
        else
        {
            return false;
        }
    });
    
    t.truthy(noArgs, `Passed test, when no args were passed into method. Should have failed!`);
    t.truthy(purple, `Invalid RGB array returned for HEX string`);
    t.truthy(yellowgreen, `Invalid RGB array returned for HEX string`);
    t.truthy(darkBrown, `Invalid RGB array returned for HEX string`);
};


const hexStringToHslaString = async t => {

    t.plan(4);
    
    const noArgs = await browser.evaluate(() => {

        let failed = false;
        
        try {
            window.akdv.utils_color.hexStringToHslaString();
        } catch {
            failed = true;
        }
        
        return failed;
    });
    
    const purple = await browser.evaluate(() => {

        const result = window.akdv.utils_color.hexStringToHslaString('#9900FF');

        if(result === 'hsl(276, 100%, 50%)')
        {
            return true;
        }
        else
        {
            return false;
        }
    });

    const yellowgreen = await browser.evaluate(() => {

        const result = window.akdv.utils_color.hexStringToHslaString('#80FF00');

        if(result === 'hsl(89, 100%, 50%)')
        {
            return true;
        }
        else
        {
            return false;
        }
    });
   
    const darkBrown = await browser.evaluate(() => {

        const result = window.akdv.utils_color.hexStringToHslaString('#443311');

        if(result === 'hsl(40, 60%, 16%)')
        {
            return true;
        }
        else
        {
            return false;
        }
    });
    
    t.truthy(noArgs, `Passed test, when no args were passed into method. Should have failed!`);
    t.truthy(purple, `Invalid RGB array returned for HEX string`);
    t.truthy(yellowgreen, `Invalid RGB array returned for HEX string`);
    t.truthy(darkBrown, `Invalid RGB array returned for HEX string`);
};



// ================================================================================================
// TEST SEQUENCE


test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV UNIT : COLOR UTILS UNIT TEST PAGE', config.local_data_test_url));
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('UTILS_COLOR - getColorRangeArrayStartingFromBgColor', getColorRangeArrayStartingFromBgColor);
test.serial('UTILS_COLOR - rgbaValuesArrayToHslaValuesArray', rgbaValuesArrayToHslaValuesArray);
test.serial('UTILS_COLOR - hslaValuesArrayToHslaString', hslaValuesArrayToHslaString);
test.serial('UTILS_COLOR - rgbaStringToHslaValuesArray', rgbaStringToHslaValuesArray);
test.serial('UTILS_COLOR - hslaStringToHslaValuesArray', hslaStringToHslaValuesArray);
test.serial('UTILS_COLOR - rgbaStringToRgbaValuesArray', rgbaStringToRgbaValuesArray);
test.serial('UTILS_COLOR - hexStringToRgbValuesArray', hexStringToRgbValuesArray);
test.serial('UTILS_COLOR - hexStringToHslaValuesArray', hexStringToHslaValuesArray);
test.serial('UTILS_COLOR - hexStringToHslaString', hexStringToHslaString);

/* jshint ignore:end */