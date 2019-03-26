/* jshint ignore:start */
'use strict';

import test from 'ava';
import browser from '../lib/browser';
import common_tests from '../lib/common_tests'


const waitForLanguagePackageLoaded = async t => {

	t.plan(1);
	let output = await browser.wait(() => (window.akdv.utils_lang.loaded_lang_code !== false)).evaluate(() => (window.akdv.utils_lang.loaded_lang_code));
	t.truthy(output === 'en-US', `Failed with language code : ${output}.`);
};


const addPackageToLoad = async t => {

	t.plan(1);
	let output = await browser
		.evaluate(() => {
			window.akdv.utils_lang.addPackageToLoad('AKDV-Chart-RIS');
			window.akdv.utils_lang.addPackageToLoad('AKDV-Chart-WhatIf');
			$(window).trigger('repository-session-ready.akdv');
		})
		.wait(() => (window.akdv.utils_lang.loaded_lang_code !== false && window.akdv.utils_lang.getLoadedPackage('AKDV-Chart-RIS') && window.akdv.utils_lang.getLoadedPackage('AKDV-Chart-WhatIf')))
		.evaluate(() => window.akdv.utils_lang.getLoadedPackage('AKDV-Chart-RIS').length > 0 && window.akdv.utils_lang.getLoadedPackage('AKDV-Chart-WhatIf').length > 0);
	
	t.truthy(output === true, `Failed to load package : AKDV-Chart-WhatIf`);
};


const getLocalization = async t => {

	t.plan(2);
	let output_valid_key = await browser.evaluate(() => (window.akdv.utils_lang.getLocalization('Requesting', 'AKDV.Status')));
	let output_invalid_key = await browser.evaluate(() => (window.akdv.utils_lang.getLocalization('__InvalidLocalizationKey__', 'AKDV')));

	t.truthy(output_valid_key === 'Requesting data', `Failed valid key localization : ${output_valid_key}.`);
	t.truthy(output_invalid_key === '__InvalidLocalizationKey__', `Failed invalid key fallback to key string : ${output_invalid_key}.`);
};


const getLocalizationStringLiteral = async t => {

	t.plan(1);
	let output = await browser.evaluate(() => (window.akdv.utils_lang.getLocalizationStringLiteral('Revenue', 'WhatIf.Prose.Summary').with(0, 1, 2, 3, 4, 5, 6 ,7 ,8, 9, 10, 11, 12, 13)));

	t.truthy(output === 'Changing 0 from 1s to 2s <span class="whatif-change 3 4">5ms</span> could change bounce rate to 6% <span class="whatif-change 7 8">9pts</span> and change daily revenue to <span class="no-br">10 <span class="whatif-change 11 12">13</span>.</span>', `Failed string literal localization : ${output}.`);
};


const getLocalizedSpanElement = async t => {

	t.plan(2);
	let [output, output_md] = await browser.evaluate(() => ([
    	window.akdv.utils_lang.getLocalizedSpanElement('Requesting', 'AKDV.Status').outerHTML,
    	window.akdv.utils_lang.getLocalizedSpanElement('chartOne1', 'RIS.HelpSys', true).outerHTML
	]));

	t.truthy(output === `<span data-localization-namespace="AKDV.Status" data-localization-key="Requesting" data-locale="en-US" data-markdown="false" class="localization">Requesting data</span>`, `Failed to match output getLocalizedSpanElement : ${output}.`);

	t.truthy(output_md === `<span data-localization-namespace="RIS.HelpSys" data-localization-key="chartOne1" data-locale="en-US" data-markdown="true" class="localization"><p>This chart shows all of your website's <strong>page groups</strong> ranked by their <em>Impact</em> on your sites perfomance.</p>
</span>`, `Failed to match markdown output getLocalizedSpanElement : ${output_md}.`);
};


const getLocalizedHTMLString = async t => {

	t.plan(2);
	let [output, output_md] = await browser.evaluate(() => ([
    	window.akdv.utils_lang.getLocalizedHTMLString('Requesting', 'AKDV.Status'),
    	window.akdv.utils_lang.getLocalizedHTMLString('chartOne1', 'RIS.HelpSys', true)
	]));

	t.truthy(output === `<span data-localization-namespace="AKDV.Status" data-localization-key="Requesting" data-locale="en-US" data-markdown="false" class="localization">Requesting data</span>`, `Failed to match output getLocalizedHTMLString : ${output}.`);

	t.truthy(output_md === `<span data-localization-namespace="RIS.HelpSys" data-localization-key="chartOne1" data-locale="en-US" data-markdown="true" class="localization"><p>This chart shows all of your website's <strong>page groups</strong> ranked by their <em>Impact</em> on your sites perfomance.</p>
</span>`, `Failed to match markdown output getLocalizedHTMLString : ${output_md}.`);
};


const getCurrencySymbolForLocale = async t => {

	t.plan(7);
	let [output_au_aud, output_us_aud, output_au_usd, output_us_usd, output_de_eur, output_fr_eur, output_uk_gbp] = await browser.evaluate(() => ([
		window.akdv.utils_lang.getCurrencySymbolForLocale('en-AU', 'AUD'),
		window.akdv.utils_lang.getCurrencySymbolForLocale('en-US', 'AUD'),
		window.akdv.utils_lang.getCurrencySymbolForLocale('en-AU', 'USD'),
		window.akdv.utils_lang.getCurrencySymbolForLocale('en-US', 'USD'),
		window.akdv.utils_lang.getCurrencySymbolForLocale('de-DE', 'EUR'),
		window.akdv.utils_lang.getCurrencySymbolForLocale('fr-FR', 'EUR'),
		window.akdv.utils_lang.getCurrencySymbolForLocale('en-UK', 'GBP')
	]));

	t.truthy(output_au_aud === `$`, `Failed to match output getCurrencySymbolForLocale : ${output_au_aud}.`);
	t.truthy(output_us_aud === `A$`, `Failed to match output getCurrencySymbolForLocale : ${output_us_aud}.`);
	t.truthy(output_au_usd === `USD`, `Failed to match output getCurrencySymbolForLocale : ${output_au_usd}.`);
	t.truthy(output_us_usd === `$`, `Failed to match output getCurrencySymbolForLocale : ${output_us_usd}.`);
	t.truthy(output_de_eur === `€`, `Failed to match output getCurrencySymbolForLocale : ${output_de_eur}.`);
	t.truthy(output_fr_eur === `€`, `Failed to match output getCurrencySymbolForLocale : ${output_fr_eur}.`);
	t.truthy(output_uk_gbp === `£`, `Failed to match output getCurrencySymbolForLocale : ${output_uk_gbp}.`);
};


const isCurrencySymbolPrefixForLocale = async t => {

	t.plan(2);
	let [output_uk_gbp, output_de_eur] = await browser.evaluate(() => ([
		window.akdv.utils_lang.isCurrencySymbolPrefixForLocale('en-UK', 'GBP'),
		window.akdv.utils_lang.isCurrencySymbolPrefixForLocale('de-DE', 'EUR')
	]));

	t.truthy(output_uk_gbp === true, `Failed to match output isCurrencySymbolPrefixForLocale : ${output_uk_gbp}.`);
	t.truthy(output_de_eur === false, `Failed to match output isCurrencySymbolPrefixForLocale : ${output_de_eur}.`);
};


const updateLocalizedTextElements = async t => {

	t.plan(1);
	let output = await browser.evaluate(() => {

		let element = document.createElement('div');
		element.setAttribute('data-localization-namespace', 'AKDV.Status');
		element.setAttribute('data-localization-key', 'Requesting');
		element.setAttribute('data-locale', 'unlocalized');
		element.classList.add('localization');
		document.body.appendChild(element);
		window.akdv.utils_lang.updateLocalizedTextElements();

		return element.getAttribute('data-locale');
	});

	t.truthy(output === 'en-US', `Failed to match output updateLocalizedTextElements : ${output}.`);
};


const getNumericalPreferenceByName = async t => {

	t.plan(7);
	let [output_currency_code, output_decimal_separator, output_thousands_separator, output_currency_decimal_places, output_percent_decimal_places, output_decimal_places, output_currency_symbol] = await browser.evaluate(() => ([
		window.akdv.utils_lang.getNumericalPreferenceByName('CurrencyCode'),
		window.akdv.utils_lang.getNumericalPreferenceByName('DecimalSeparator'),
		window.akdv.utils_lang.getNumericalPreferenceByName('ThousandsSeparator'),
		window.akdv.utils_lang.getNumericalPreferenceByName('CurrencyDecimalPlaces'),
		window.akdv.utils_lang.getNumericalPreferenceByName('PercentDecimalPlaces'),
		window.akdv.utils_lang.getNumericalPreferenceByName('DecimalPlaces'),
		window.akdv.utils_lang.getNumericalPreferenceByName('CurrencySymbol')
	]));

	t.truthy(output_currency_code === 'USD', `Failed to match output getNumericalPreferenceByName : ${output_currency_code}.`);
	t.truthy(output_decimal_separator === '.', `Failed to match output getNumericalPreferenceByName : ${output_decimal_separator}.`);
	t.truthy(output_thousands_separator === ',', `Failed to match output getNumericalPreferenceByName : ${output_thousands_separator}.`);
	t.truthy(output_currency_decimal_places === '2', `Failed to match output getNumericalPreferenceByName : ${output_currency_decimal_places}.`);
	t.truthy(output_percent_decimal_places === '2', `Failed to match output getNumericalPreferenceByName : ${output_percent_decimal_places}.`);
	t.truthy(output_decimal_places === '2', `Failed to match output getNumericalPreferenceByName : ${output_decimal_places}.`);
	t.truthy(output_currency_symbol === '$', `Failed to match output getNumericalPreferenceByName : ${output_currency_symbol}.`);
};


const getNumericalTypeByName = async t => {

	t.plan(1);
	let output = await browser.evaluate(() => (window.akdv.utils_lang.getNumericalTypeByName('Default')));

	t.truthy(output === 'Default', `Failed to match output getNumericalTypeByName : ${output}.`);
};


const getters = async t => {

	t.plan(6);
	let [output_locale, output_lang_code, output_loaded_lang_code, output_currency_code, output_currency_decimal_places, output_timezone] = await browser.evaluate(() => ([
			window.akdv.utils_lang.locale, 
			window.akdv.utils_lang.lang_code,
			window.akdv.utils_lang.loaded_lang_code,
			window.akdv.utils_lang.currency_code,
 			window.akdv.utils_lang.currency_decimal_places,
			window.akdv.utils_lang.timezone
		]));

	t.truthy(output_locale === 'en-US', `Failed to match output getters : ${output_locale}.`);
	t.truthy(output_lang_code === 'en-US', `Failed to match output getters : ${output_lang_code}.`);
	t.truthy(output_loaded_lang_code === 'en-US', `Failed to match output getters : ${output_loaded_lang_code}.`);
	t.truthy(output_currency_code === 'USD', `Failed to match output getters : ${output_currency_code}.`);
	t.truthy(output_currency_decimal_places === '2', `Failed to match output getters : ${output_currency_decimal_places}.`);
	t.truthy(output_timezone === 'UTC', `Failed to match output getters : ${output_timezone}.`);
};


const getLocalizationLangCodeFR = async t => {

	t.plan(1);
	
	await browser.evaluate(() => {
		window.akdv.storage.session.setItem('langCode', 'fr-FR');
		$(window).trigger('repository-session-ready.akdv');
	});

	let output = await browser.wait(() => (window.akdv.utils_lang.loaded_lang_code === 'fr-FR')).evaluate(() => (window.akdv.utils_lang.getLocalization('Requesting', 'AKDV.Status')));

	t.truthy(output === 'Demande de données en cours', `Failed valid key localization : ${output}.`);
};


// ================================================================================================
// TEST SEQUENCE

test.serial('PAGE LOADED', t => common_tests.page_load_test(t, 'AKDV UNIT : LANG UTILS UNIT TEST PAGE', config.dswb_data_test_url));
test.serial('IS PRODUCTION ENVIRONMENT', common_tests.is_production_test);

test.serial('UTILS_LANG - waitForLanguagePackageLoaded', waitForLanguagePackageLoaded);
test.serial('UTILS_LANG - addPackageToLoad', addPackageToLoad);
test.serial('UTILS_LANG - getLocalization', getLocalization);
test.serial('UTILS_LANG - getLocalizationStringLiteral', getLocalizationStringLiteral);
test.serial('UTILS_LANG - getLocalizedSpanElement', getLocalizedSpanElement);
test.serial('UTILS_LANG - getLocalizedHTMLString', getLocalizedHTMLString);
test.serial('UTILS_LANG - getCurrencySymbolForLocale', getCurrencySymbolForLocale);
test.serial('UTILS_LANG - isCurrencySymbolPrefixForLocale', isCurrencySymbolPrefixForLocale);
test.serial('UTILS_LANG - updateLocalizedTextElements', updateLocalizedTextElements);
test.serial('UTILS_LANG - getNumericalPreferenceByName', getNumericalPreferenceByName);
test.serial('UTILS_LANG - getNumericalTypeByName', getNumericalTypeByName);
test.serial('UTILS_LANG - getters', getters);
test.serial('UTILS_LANG - getLocalizationLangCodeFR', getLocalizationLangCodeFR);
/* jshint ignore:end */