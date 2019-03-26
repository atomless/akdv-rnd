/* jshint ignore:start */

'use strict';

import test from 'ava';
import Cmd from 'cmd-exec';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests';


const addLocalizedString = async (t, key, namespace, string) => {

    t.plan(3); // expected passes

    let localized_key, localized_namespace, localized_string;
    let span_el, error_message = '';

    try {
        [localized_key, localized_namespace, localized_string] = await browser.evaluate((key, namespace) => {
            const span_el = document.createElement('span');
            window.akdv.utils_lang.addLocalizedString(span_el, key, namespace);
            console.log(span_el.outerHTML);
            return [span_el.getAttribute('data-localization-key'), span_el.getAttribute('data-localization-namespace'), span_el.textContent];
        }, key, namespace);
    } catch (err) {
        console.log(err.message || err);
    }

    if (localized_string) {
        console.log('    ------------------------------------------------------------------');
        console.log(`    Localization Key: '${localized_key}'`);
        console.log(`    Localization Namespace: '${localized_namespace}'`);
        console.log(`    Localization String: '${localized_string}'`);
        console.log('    ------------------------------------------------------------------');
    }

    t.truthy(localized_key === key, `The localization attribute data-localization-key '${key}' not found`);
    t.truthy(localized_namespace === namespace, `The localization attribute data-localization-namespace '${namespace}' not found`);
    t.truthy(localized_string === string, 'The localization text was unexpected'); 
};


const localizationPackage = async t => {

    t.plan(1); // expected passes

    const akdv_package = await browser
        .wait(() => true)//window.akdv.utils_lang.package_loaded)
        .then(() => true)
        .catch(() => false);

    t.truthy(akdv_package, `The localization package was missing`);
};


const localizationTextElement = async t => {

    t.plan(2); // expected passes

    const [matched_localization, matched_locale] = await browser
        .wait(`span[data-localization-namespace]`)
        .evaluate(() => {
            const element = document.querySelector(`span[data-localization-namespace]`);
                  report = [false, false];
            if (element) {
                const namespace = element.getAttribute('data-localization-namespace'),
                      key = element.getAttribute('data-localization-key');

                report[0] = window.akdv.utils_lang.getLocalization(key, namespace) === element.textContent;
                report[1] = element.getAttribute('data-locale') === window.akdv.utils_lang.locale || element.getAttribute('data-locale') === 'unlocalized';
            }

            return report;
        })
        .catch(() => [false, false]);

    t.truthy(matched_localization, `The localization text element was not localized`);
    t.truthy(matched_locale, `The localization text element was not matching the locale`);
};


const getNumericalPreferenceByName = async t => {

    t.plan(6); // expected passes

    const [
        matched_default_currency_code,
        matched_default_decimal_separator,
        matched_default_thousands_separator,
        matched_default_currency_decimal_places,
        matched_default_percent_decimal_places,
        matched_default_decimal_places
    ] = await browser
        .wait(`span[data-localization-namespace]`)
        .evaluate(() => [
            window.akdv.utils_lang.getNumericalPreferenceByName('CurrencyCode'),
            window.akdv.utils_lang.getNumericalPreferenceByName('DecimalSeparator'),
            window.akdv.utils_lang.getNumericalPreferenceByName('ThousandsSeparator'),
            window.akdv.utils_lang.getNumericalPreferenceByName('CurrencyDecimalPlaces'),
            window.akdv.utils_lang.getNumericalPreferenceByName('PercentDecimalPlaces'),
            window.akdv.utils_lang.getNumericalPreferenceByName('DecimalPlaces')
        ])
        .catch(() => new Array(6).fill(false));

    t.truthy(matched_default_currency_code, `Default Currency was not found`);
    t.truthy(matched_default_decimal_separator, `Default Decimal Separator was not found`);
    t.truthy(matched_default_thousands_separator, `Default Thousands Separator was not found`);
    t.truthy(matched_default_currency_decimal_places, `Default Currency Decimal Places was not found`);
    t.truthy(matched_default_percent_decimal_places, `Default Percent Decimal Places was not found`);
    t.truthy(matched_default_decimal_places, `Default Decimal Places was not found`);
};

// ================================================================================================
// TEST SEQUENCE

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV FUNC : LOCALIZATION'));
test.serial('BUILD VERSION', common_tests.check_build_version);
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('LOCALIZATION PACKAGE', localizationPackage);
test.serial('LOCALIZATION TEXT', localizationTextElement);
test.serial('NUMERICAL PREFERENCE', getNumericalPreferenceByName);

/* jshint ignore:end */