;((window, $, string_utils, event_utils, data_utils, lang_utils, dom_utils, time_utils, mpulse, icons, statusNotifier) => {

    'use strict';

    const fallbackTimerName = "Page Load";
    const conversionMetric = "Conversion Metric";
    const revenueMetric = "Revenue Metric";

    const maxConversionRate = 1;

    let filterCriteria = [];

    var updateSpeed = true;
    var breakdownData = false;
    let fields = {
        revenue: 'totalRevenue',
        duration: 'sessionDuration',
        conversions: 'conversionRate',
        bounces: 'bounceRate',
        visit_time: 'lingerTime',
        pageviews: 'sessionLength'
    };

    let groupByData = false;

    const direction_indicator_template = string_utils.stringLiteralTemplate`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612.8 612.8" transform="rotate(${0})"><path d="M306.4 0C137.4 0 .4 137 .4 306s137 306.8 306 306.8 306-137 306-306S475.4 0 306.4 0zm0 583.1C154.2 583.1 30 459 30 306.8S154.2 29.6 306.4 29.6 582.8 153.8 582.8 306 458.6 583 306.4 583zm142.6-270s0 .9-.8.9c-.9.8-.9 1.6-1.7 2.3L336 427c-3.2 3.2-6.4 4-10.4 4a17 17 0 0 1-10.4-4 15 15 0 0 1 0-20.9l85-85H165.4c-8 0-14.4-6.3-14.4-14.3s6.4-14.4 14.4-14.4h234.7l-84-84a15 15 0 0 1 0-20.9 15 15 0 0 1 20.8 0l108.9 109c.8.8 1.6 1.6 1.6 2.4l.8.8c0 .8.8.8.8 1.6s0 .8.9 1.6v8.9c-.1.7-.1.7-1 1.5 0-.8 0 0 0 0z"/></svg>`;

    const directionArrowSVGFromValues = (newValue = window.required(), oldValue = window.required(), reverse = false) => {
        let rotation = 0;
        if (newValue < oldValue) {
            rotation = 90;
        } else if (newValue > oldValue) {
            rotation = 270;
        }
        return direction_indicator_template.with(rotation);
    }

    const getDirection = (change) => {

        if (change === 0) { return 'neutral' }
        else {
            return (change > 0) ? 'up' : 'down';
        }
    }

    const getDirectionArrow = (change) => {

        return `whatif-change-${getDirection(change)}`;
    }

    const getDirectionStyle = (change, reverse=false) => {

        if (change === 0) { return 'neutral' }
        if (reverse) {
            return (change < 0) ? 'positive' : 'negative';
        } else {
            return (change > 0) ? 'positive' : 'negative';
        }
    }

    const getDirectionClass = (change, reverse=false) => {

        return `whatif-change-${getDirectionStyle(change, reverse)}`;
    }


    const formatNumber = (value = window.required(), precision = 2) => {
        return string_utils.getFormattedNumber(value, precision);
    }

    const formatPercentage = (value = window.required()) => {
        
        return formatNumber(value * 100);
    }

    const getRevenueName = () => {
        return (window.akdv.mpulse.getFilterDisplayLabelByName(revenueMetric) || "Revenue");
    }

    const getConversionName = () => {
        return (window.akdv.mpulse.getFilterDisplayLabelByName(conversionMetric) || "Conversion");
    }

    const getRevenueType = () => {
        return (window.akdv.utils_lang.getNumericalTypeByName(getRevenueName()) || "Currency");
    }

    const formatRevenue = (value = window.required()) => {
        let revenueType = getRevenueType();
        if (revenueType === "Number") {
            return string_utils.getAbbreviatedNumberWithOrderOfMagnitudeSuffix(value);
        } else if (revenueType === "Percentage") {
            return formatPercentage(value);
        } else {
            return string_utils.getInternationalizedNumberWithCurrencySymbolAndMagnitudeSuffix(value, lang_utils.locale,
                lang_utils.getNumericalPreferenceByName('CurrencyCode',getRevenueName()));
        }
    }

    const getRevenueMajorUnit = () => {
        let revenueType = getRevenueType();
        if (revenueType === "Percentage") {
            return '%';
        } else if (revenueType === "Currency") {
            return lang_utils.getCurrencySymbolForLocale(lang_utils.locale, lang_utils.getNumericalPreferenceByName('CurrencyCode',getRevenueName()));
        } else {
            return '';
        }
    }

    const getRevenueMinorUnit = () => {
        let revenueType = getRevenueType();
        if (revenueType === "Percentage") {
            return 'pts';
        } else if (revenueType === "Currency") {
            return lang_utils.getCurrencySymbolForLocale(lang_utils.locale, lang_utils.getNumericalPreferenceByName('CurrencyCode',getRevenueName()));
        } else {
            return '';
        }
    }

    const getRevenueDivisor = () => {
        let revenueType = getRevenueType();
        if (revenueType === "Number") {
            return 1;
        } else {
            return Math.pow(10, lang_utils.getNumericalPreferenceByName('DecimalPlaces',getRevenueName()));
        }
        
    }

    const writeProse = (selector) => {

        let element = document.querySelector(selector);
        let metrics = window.akdv.data.metrics[0];
        let state = window.akdv.data.state[0];

        /* support four scenarios:
         * - conversion and revenue
         * - conversion, no revenue
         * - no conversion, revenue
         * - no conversion, no revenue
         */
        let body = "";
        if (state.conversionAvailable && state.revenueAvailable) {
            // Revenue and conversion rate
            let template = lang_utils.getLocalizationStringLiteral('ConversionAndRevenue','WhatIf.Prose.Summary');
            body = template.with(
                metrics.timerName,

                formatNumber(metrics.speed / 1000), formatNumber(metrics.goal_speed / 1000),
                
                getDirectionClass(metrics.goal_speed - metrics.speed, true), getDirectionArrow(metrics.goal_speed - metrics.speed), Math.abs(Math.round(metrics.goal_speed - metrics.speed)),

                formatPercentage(metrics.goal_conversionRate), getDirectionClass(metrics.goal_conversionRate - metrics.conversionRate),
                getDirectionArrow(metrics.goal_conversionRate - metrics.conversionRate), formatPercentage(Math.abs(metrics.goal_conversionRate - metrics.conversionRate)),

                getDirectionClass(metrics.goal_revenue - metrics.revenue), getDirectionArrow(metrics.goal_revenue - metrics.revenue),
                formatRevenue(Math.round(Math.abs(metrics.goal_revenue - metrics.revenue) / metrics.date_days)),

                formatPercentage(metrics.goal_bounceRate),
                getDirectionClass(metrics.goal_bounceRate - metrics.bounceRate, true),
                getDirectionArrow(metrics.goal_bounceRate - metrics.bounceRate),
                formatPercentage(Math.abs(metrics.goal_bounceRate - metrics.bounceRate)),

                formatNumber(metrics.goal_sessionLength,1),
                getDirectionClass(metrics.goal_sessionLength - metrics.sessionLength),
                getDirectionArrow(metrics.goal_sessionLength - metrics.sessionLength),
                formatNumber(Math.abs(metrics.goal_sessionLength - metrics.sessionLength),1)
            );
        } else if (state.conversionAvailable && !state.revenueAvailable) {
            // Conversion rate but no revenue (i.e. revenue = 0)
            let template = lang_utils.getLocalizationStringLiteral('Conversion','WhatIf.Prose.Summary');
            body = template.with(
                metrics.timerName,

                formatNumber(metrics.speed / 1000), formatNumber(metrics.goal_speed / 1000),
                
                getDirectionClass(metrics.goal_speed - metrics.speed, true), getDirectionArrow(metrics.goal_speed - metrics.speed),
                Math.abs(Math.round(metrics.goal_speed - metrics.speed)),

                formatPercentage(metrics.goal_conversionRate), getDirectionClass(metrics.goal_conversionRate - metrics.conversionRate),
                getDirectionArrow(metrics.goal_conversionRate - metrics.conversionRate), formatPercentage(Math.abs(metrics.goal_conversionRate - metrics.conversionRate)),

                formatPercentage(metrics.goal_bounceRate), getDirectionClass(metrics.goal_bounceRate - metrics.bounceRate, true),
                getDirectionArrow(metrics.goal_bounceRate - metrics.bounceRate), formatPercentage(Math.abs(metrics.goal_bounceRate - metrics.bounceRate))

            );
        } else if (!state.conversionAvailable && state.revenueAvailable) {
            // Revenue but no conversion rate (i.e. conversion rate = 0% or 100%)
            let template = lang_utils.getLocalizationStringLiteral('Revenue','WhatIf.Prose.Summary');
            body = template.with(
                metrics.timerName,

                formatNumber(metrics.speed / 1000), formatNumber(metrics.goal_speed / 1000),
                
                getDirectionClass(metrics.goal_speed - metrics.speed, true), getDirectionArrow(metrics.goal_speed - metrics.speed), formatNumber(Math.abs(Math.round(metrics.goal_speed - metrics.speed)),0),

                formatPercentage(metrics.goal_bounceRate), getDirectionClass(metrics.goal_bounceRate - metrics.bounceRate, true),
                getDirectionArrow(metrics.goal_bounceRate - metrics.bounceRate), formatPercentage(Math.abs(metrics.goal_bounceRate - metrics.bounceRate)),

                formatRevenue(metrics.goal_revenue / metrics.date_days),
                getDirectionClass(metrics.goal_revenue - metrics.revenue), getDirectionArrow(metrics.goal_revenue - metrics.revenue),
                formatRevenue(Math.abs(metrics.goal_revenue - metrics.revenue) / metrics.date_days)

            );
        } else {
            // No revenue and no conversion rate
            let template = lang_utils.getLocalizationStringLiteral('NoConversionOrRevenue','WhatIf.Prose.Summary');
            body = template.with(
                metrics.timerName,

                formatNumber(metrics.speed / 1000),
                formatNumber(metrics.goal_speed / 1000),
                
                getDirectionClass(metrics.goal_speed - metrics.speed, true),
                getDirectionArrow(metrics.goal_speed - metrics.speed),
                formatNumber(Math.abs(metrics.goal_speed - metrics.speed),0),

                formatPercentage(metrics.goal_bounceRate),
                getDirectionClass(metrics.goal_bounceRate - metrics.bounceRate, true),
                getDirectionArrow(metrics.goal_bounceRate - metrics.bounceRate),
                formatPercentage(Math.abs(metrics.goal_bounceRate - metrics.bounceRate)),

                formatNumber(metrics.goal_sessionLength,1),
                getDirectionClass(metrics.goal_sessionLength - metrics.sessionLength),
                getDirectionArrow(metrics.goal_sessionLength - metrics.sessionLength),
                formatNumber(Math.abs(metrics.goal_sessionLength - metrics.sessionLength),1),


                getDirectionClass(metrics.goal_sessionLength - metrics.sessionLength),
                getDirectionArrow(metrics.goal_sessionDuration - metrics.sessionDuration),
                time_utils.durationToHMSWords(Math.abs(metrics.goal_sessionDuration - metrics.sessionDuration) * 1000),

                getDirectionClass(metrics.goal_sessionDuration - metrics.sessionDuration),
                "",
                "",
                string_utils.getAbbreviatedNumberWithOrderOfMagnitudeSuffix(Math.round((metrics.goal_sessionLength - metrics.sessionLength) * metrics.sessions / metrics.date_days))
                
            );
        }
        element.innerHTML = `<p>${body}</p>`;
    }

    const writeSummaryValues = (selector) => {

        let element = document.querySelector(selector);
        let metrics = window.akdv.data.metrics[0];
        let state = window.akdv.data.state[0];
        let indicator = directionArrowSVGFromValues(0,0);

        let blockTemplate = window.akdv.utils_string.stringLiteralTemplate`
        <div class="summary-metric">
            <div class="metric-change metric-change-neutral">${2}</div>
            <div class="summary-metric-values">
                <div class="summary-metric-name">${0}</div>
                <div class="summary-metric-value">${1}</div>
                <div class="summary-metric-change">&nbsp;</div>
            </div>
        </div>
        `;
        let blocks = [
            [metrics.timerName,formatNumber(metrics.speed / 1000)+"s", indicator],
        ];
        if (state.conversionAvailable) {
            blocks = blocks.concat([
                [getConversionName()|| lang_utils.getLocalization('conversionRate', 'AKDV.Metrics'),formatPercentage(metrics.conversionRate)+"%", indicator]
            ]);
        }
        if (state.revenueAvailable) {
            blocks = blocks.concat([
                //[mpulse.getFilterDisplayLabelByName(revenueMetric) || lang_utils.getLocalization('orderValue', 'AKDV.Metrics'),formatRevenue(metrics.orderValue)],
                [mpulse.getFilterDisplayLabelByName(revenueMetric) || lang_utils.getLocalization(fields['revenue'], 'AKDV.Metrics'),formatRevenue(metrics.revenue), indicator]
            ])
        }
        blocks = blocks.concat([
            [lang_utils.getLocalization('bounceRate', 'AKDV.Metrics'),formatPercentage(metrics.bounceRate)+"%", indicator],
            [lang_utils.getLocalization('sessionDuration', 'AKDV.Metrics'),string_utils.getSecondsFormattedAsMinsAndSecs(metrics.sessionDuration)+"m:s", indicator],
            //[lang_utils.getLocalization('beacons', 'AKDV.Metrics'),string_utils.getAbbreviatedNumberWithOrderOfMagnitudeSuffix(metrics.pageviews)], -- removed to leave the same number of elements as possibility
            [lang_utils.getLocalization('sessionLength', 'AKDV.Metrics'),formatNumber(metrics.sessionLength), indicator],
            [lang_utils.getLocalization('lingerTime', 'AKDV.Metrics'),formatNumber(metrics.lingerTime,1)+'s', indicator],
        ]);
        let body = `<div class="summary-metrics">`;
        blocks.forEach(block => {
            body += blockTemplate.with(...block)
        })
        body += `</div>`
        element.innerHTML = body;
    }

    const writePossibilityValues = (selector) => {

        let element = document.querySelector(selector);
        let metrics = window.akdv.data.metrics[0];
        let state = window.akdv.data.state[0];

        let blockTemplate = window.akdv.utils_string.stringLiteralTemplate`
        <div class="summary-metric">
            <div class="metric-change metric-change-${1}">${3}</div>
            <div class="summary-metric-values">
                <div class="summary-metric-name">${4}</div>
                <div class="summary-metric-value">${7}${5}</div>
                <div class="summary-metric-change whatif-change-${1}">${2}${8}${6}</div>
            </div>
        </div>
        `;
        let blocks = [
            [
                getDirection(metrics.goal_speed - metrics.speed),
                getDirectionStyle(metrics.goal_speed - metrics.speed, true),
                (metrics.goal_speed - metrics.speed) > 0 ? '+' : '',
                directionArrowSVGFromValues(metrics.goal_speed, metrics.speed, true),
                metrics.timerName,'s','ms',
                formatNumber(metrics.goal_speed / 1000),
                formatNumber(metrics.goal_speed - metrics.speed,0)
            ]
        ];

        if (state.conversionAvailable) {
            blocks = blocks.concat([
                [
                    getDirection(metrics.goal_conversionRate - metrics.conversionRate),
                    getDirectionStyle(metrics.goal_conversionRate - metrics.conversionRate),
                    (metrics.goal_conversionRate - metrics.conversionRate) > 0 ? '+' : '',
                    directionArrowSVGFromValues(metrics.goal_conversionRate, metrics.conversionRate),
                    getConversionName() || lang_utils.getLocalization('conversionRate', 'AKDV.Metrics'),'%','pts',
                    formatPercentage(metrics.goal_conversionRate),
                    formatPercentage(metrics.goal_conversionRate - metrics.conversionRate)
                ]
            ]);
        }
        if (state.revenueAvailable) {
            blocks = blocks.concat([
                [
                    getDirection(metrics.goal_revenue - metrics.revenue),
                    getDirectionStyle(metrics.goal_revenue - metrics.revenue),
                    (metrics.goal_revenue - metrics.revenue) >= 0 ? '+' : '-',
                    directionArrowSVGFromValues(metrics.goal_revenue, metrics.revenue),
                    mpulse.getFilterDisplayLabelByName(revenueMetric) || lang_utils.getLocalization(fields['revenue'], 'AKDV.Metrics'),'','',
                    formatRevenue(metrics.goal_revenue),
                    formatRevenue(Math.abs(metrics.goal_revenue - metrics.revenue))
                ]
            ]);
        }
        blocks = blocks.concat([
            [
                getDirection(metrics.goal_bounceRate - metrics.bounceRate),
                getDirectionStyle(metrics.goal_bounceRate - metrics.bounceRate, true),
                (metrics.goal_bounceRate - metrics.bounceRate) >= 0 ? '+' : '',
                directionArrowSVGFromValues(metrics.goal_bounceRate, metrics.bounceRate, true),
                lang_utils.getLocalization('bounceRate', 'AKDV.Metrics'),'%','pts',
                formatPercentage(metrics.goal_bounceRate),
                formatPercentage(metrics.goal_bounceRate - metrics.bounceRate)
            ],
            [
                getDirection(metrics.goal_sessionDuration - metrics.sessionDuration),
                getDirectionStyle(metrics.goal_sessionDuration - metrics.sessionDuration),
                (metrics.goal_sessionDuration - metrics.sessionDuration) >= 0 ? '+' : '-',
                directionArrowSVGFromValues(metrics.goal_sessionDuration, metrics.sessionDuration),
                lang_utils.getLocalization('sessionDuration', 'AKDV.Metrics'),'m:s','m:s',
                string_utils.getSecondsFormattedAsMinsAndSecs(metrics.goal_sessionDuration),
                string_utils.getSecondsFormattedAsMinsAndSecs(Math.abs(metrics.goal_sessionDuration - metrics.sessionDuration))
            ],
            [
                getDirection(metrics.goal_sessionLength - metrics.sessionLength),
                getDirectionStyle(metrics.goal_sessionLength - metrics.sessionLength),
                (metrics.goal_sessionLength - metrics.sessionLength) >= 0 ? '+' : '',
                directionArrowSVGFromValues(metrics.goal_sessionLength, metrics.sessionLength),
                lang_utils.getLocalization('sessionLength', 'AKDV.Metrics'),'','',
                formatNumber(metrics.goal_sessionLength,1),
                formatNumber((metrics.goal_sessionLength - metrics.sessionLength),1)
            ],
            [
                getDirection(metrics.goal_lingerTime - metrics.lingerTime),
                getDirectionStyle(metrics.goal_lingerTime - metrics.lingerTime),
                (metrics.goal_lingerTime - metrics.lingerTime) >= 0 ? '+' : '',
                directionArrowSVGFromValues(metrics.goal_lingerTime, metrics.lingerTime),
                lang_utils.getLocalization('lingerTime', 'AKDV.Metrics'),'s','s',
                formatNumber(metrics.goal_lingerTime,1),
                formatNumber((metrics.goal_lingerTime - metrics.lingerTime),2)
            ]
        ]);
        let body = `<div class="summary-metrics">`;
        blocks.forEach(block => {
            body += blockTemplate.with(...block)
        })
        body += `</div>`
        element.innerHTML = body;
    }

    
    const getGoalSpeedByMetric = (metric = window.required(), value = window.required(), data = false) => {

        window._log.debug(`getting speed for metric ${metric} = ${value}`)
        data = data || window.akdv.data;
        let goalSpeed = null;
        if (!data.rawdata.recommendations.hasOwnProperty(metric)) {
            window._log.error(`Selected metric ${metric} not available`)
            return null;
        } else {
            let absoluteRevenue = data.rawdata.recommendations.revenue.rateMap.hasOwnProperty('revenue'); 
            if (metric === 'revenue' && absoluteRevenue) {
                let distribution = data.rawdata.recommendations[metric].rateMap;
                // return the extent if the value is outside the range.
                if (value < Math.min(...distribution.revenue)) {
                    value = Math.min(...distribution.revenue)
                } else if (value > Math.max(distribution.revenue)) {
                    value = Math.max(...distribution.revenue)
                }
                let index = distribution.revenue.indexOf(value);
                if (index >= 0) {
                    return distribution.median[index];
                } else {
                    let len = distribution.revenue.length;
                    let reverse = distribution.revenue[0] > distribution.revenue[1];

                    
                    for (let i = 1; i < len; i ++) {
                        if ((distribution.revenue[i] > value && distribution.revenue[i-1] < value) || (distribution.revenue[i] < value && distribution.revenue[i-1] > value)) {
                            let frac = (value - distribution.revenue[i]) / (distribution.revenue[i-1] - distribution.revenue[i]);
                            window._log.debug(`set speed = ${distribution.median[i] + (frac * (distribution.median[i-1] - distribution.median[i]))} for metric ${metric} = ${value}`)
                            return distribution.median[i] + (frac * (distribution.median[i-1] - distribution.median[i]));
                        }
                    }
                }
            } else {
                if (metric === 'revenue') {
                    value /= data.summary.sessions;
                }
                let distribution = data.rawdata.recommendations[metric].rateMap;
                let index = distribution.rate.indexOf(value);
                if (index >= 0) {
                    return distribution.median[index];
                } else {
                    let len = distribution.rate.length;
                    let reverse = distribution.rate[0] > distribution.rate[1];

                    // return the extent if the value is outside the range.
                    if (value < distribution.rate[(reverse?len-1:0)]) {
                        return distribution.median[(reverse?len-1:0)];
                    } else if (value > distribution.rate[(reverse?0:len-1)]) {
                        return distribution.median[(reverse?0:len-1)];
                    }
                    for (let i = 1; i < len; i ++) {
                        if ((distribution.rate[i] > value && distribution.rate[i-1] < value) || (distribution.rate[i] < value && distribution.rate[i-1] > value)) {
                            let frac = (value - distribution.rate[i]) / (distribution.rate[i-1] - distribution.rate[i]);
                            window._log.debug(`set speed = ${distribution.median[i] + (frac * (distribution.median[i-1] - distribution.median[i]))} for metric ${metric} = ${value}`)
                            return distribution.median[i] + (frac * (distribution.median[i-1] - distribution.median[i]));
                        }
                    }
                }
            }
        }
        window._log.debug(`could not set speed for metric ${metric} = ${value}`)
        
        return goalSpeed;
    }


    const writeSliderValues = (selector) => {

        let element = document.querySelector(selector);
        let data = window.akdv.data;
        let metrics = data.metrics[0];
        let state = window.akdv.data.state[0];

        let blockTemplate = window.akdv.utils_string.stringLiteralTemplate`
        <div class="summary-metric metric-slider">
            <input type="range" class="slider slider-vertical" data-metric="${0}" data-exponent="${16}" id="slider-${1}" value="${3}" min="${4}" max="${5}" step="${6}" 
                oninput="document.getElementById('summary-metric-value-${1}').value = parseFloat(this.value).toFixed(${15});"/>
            <div class="metric-change-slider">
                <div class="summary-metric-name add-tooltip" data-tooltip-title="${2}" data-tooltip-description="${14}">${2}</div>
                <div class="metric-change metric-change-${8}">${9}</div>
                <div class="summary-metric-values summary-metric-slider-values">
                    <div class="input-with-unit">
                        <div class="summary-metric-hints">${4} - ${5}</div>
                        <span class="input-unit">${12}</span>
                        <input type="number" value="${3}" min="${4}" max="${5}" step="${6}" data-metric="${0}" data-exponent="${16}" class="summary-metric-value hidden-number" id="summary-metric-value-${1}" 
                            oninput="document.getElementById('slider-${1}').value = parseFloat(this.value).toFixed(${15});"></input>
                        <span class="input-unit">${13}</span>
                    </div>
                    <div class="summary-metric-change whatif-change-${7} whatif-change-${8}" id="summary-metric-change-${1}">${10}${11}</div>
                </div>
            </div>
        </div>`;
        let blocks = [];
        if (state.conversionAvailable) {
            blocks.push(
                [
                    'conversions',fields['conversions'], getConversionName() || lang_utils.getLocalization('conversionRate', 'AKDV.Metrics'),
                    (metrics.goal_conversionRate * 100).toFixed(2),
                    Math.floor(data.limits.conversionRate[0] * 10000) / 100,
                    Math.ceil(data.limits.conversionRate[1] * 10000) / 100,
                    0.01,
                    getDirection(metrics.goal_conversionRate - metrics.conversionRate),
                    getDirectionStyle(metrics.goal_conversionRate - metrics.conversionRate),
                    directionArrowSVGFromValues(metrics.goal_conversionRate, metrics.conversionRate),
                    Math.abs(Math.round((metrics.goal_conversionRate - metrics.conversionRate) * 10000 ) / 100),
                    'pts','','%',
                    lang_utils.getLocalization('conversionRate', 'AKDV.Descriptions'),
                    2, -2
                ]
            )
        }
        if (state.revenueAvailable) {
            let revenueType = getRevenueType();
            let revenueDPs = 2;
            let revenuePrecision = 0.01;
            let revenueSymbol = lang_utils.getCurrencySymbolForLocale();
            if (revenueType === "Number") {
                revenueDPs = 0;
                revenuePrecision = 1;
                revenueSymbol = '';        
            }
            blocks.push(
                [
                    'revenue',fields['revenue'],mpulse.getFilterDisplayLabelByName(revenueMetric) || lang_utils.getLocalization(fields['revenue'], 'AKDV.Metrics'),
                    (metrics.goal_revenue / Math.pow(10,metrics.revenueExponent)).toFixed(revenueDPs),
                    (Math.floor((data.limits.revenue[0] * 100) / Math.pow(10, metrics.revenueExponent)) / 100).toFixed(revenueDPs),
                    (Math.ceil((data.limits.revenue[1] * 100) / Math.pow(10, metrics.revenueExponent)) / 100).toFixed(revenueDPs),
                    revenuePrecision,
                    getDirection(metrics.goal_revenue - metrics.revenue),
                    getDirectionStyle(metrics.goal_revenue - metrics.revenue),
                    directionArrowSVGFromValues(metrics.goal_revenue, metrics.revenue),
                    formatRevenue(Math.abs(metrics.goal_revenue - metrics.revenue)),
                    '',
                    lang_utils.isCurrencySymbolPrefixForLocale() ? revenueSymbol : '',
                    metrics.revenueSuffix + (lang_utils.isCurrencySymbolPrefixForLocale() ? '' : ' ' + revenueSymbol),
                    lang_utils.getLocalization(fields['revenue'], 'AKDV.Descriptions'),
                    revenueDPs, metrics.revenueExponent
                ]
            )
        }
        blocks.push(
            [
                'bounces',fields['bounces'],lang_utils.getLocalization('bounceRate', 'AKDV.Metrics'),
                (metrics.goal_bounceRate * 100).toFixed(2),
                Math.floor(data.limits.bounceRate[0] * 10000) / 100,
                Math.ceil(data.limits.bounceRate[1] * 10000) / 100,
                0.01,
                getDirection(metrics.goal_bounceRate - metrics.bounceRate),
                getDirectionStyle(metrics.goal_bounceRate - metrics.bounceRate, true),
                directionArrowSVGFromValues(metrics.goal_bounceRate, metrics.bounceRate, true),
                formatNumber(Math.abs((metrics.goal_bounceRate - metrics.bounceRate) * 100 )),
                'pts','','%',
                lang_utils.getLocalization('bounceRate', 'AKDV.Descriptions'),
                2, -2
            ],
            [
                'pageviews',fields['pageviews'],lang_utils.getLocalization('sessionLength', 'AKDV.Metrics'),
                metrics.goal_sessionLength.toFixed(2),
                Math.floor(data.limits.sessionLength[0] * 100) / 100,
                Math.ceil(data.limits.sessionLength[1] * 100) / 100,
                0.01,
                getDirection(metrics.goal_sessionLength - metrics.sessionLength),
                getDirectionStyle(metrics.goal_sessionLength - metrics.sessionLength),
                directionArrowSVGFromValues(metrics.goal_sessionLength, metrics.sessionLength),
                formatNumber(Math.abs(metrics.goal_sessionLength - metrics.sessionLength)),
                '','','',
                lang_utils.getLocalization('sessionLength', 'AKDV.Descriptions'),
                2, 0
            ],
            [
                'duration',fields['duration'],lang_utils.getLocalization('sessionDuration', 'AKDV.Metrics'),
                metrics.goal_sessionDuration.toFixed(1),
                Math.floor(data.limits.sessionDuration[0] * 10) / 10,
                Math.ceil(data.limits.sessionDuration[1] * 10) / 10,
                0.1,
                getDirection(metrics.goal_sessionDuration - metrics.sessionDuration),
                getDirectionStyle(metrics.goal_sessionDuration - metrics.sessionDuration),
                directionArrowSVGFromValues(metrics.goal_sessionDuration, metrics.sessionDuration),
                formatNumber(Math.abs(metrics.goal_sessionDuration - metrics.sessionDuration),1),
                's','','s',
                lang_utils.getLocalization('sessionDuration', 'AKDV.Descriptions'),
                1, 0
            ],
            [
                'visit_time',fields['visit_time'],lang_utils.getLocalization('lingerTime', 'AKDV.Metrics'),
                metrics.goal_lingerTime.toFixed(1),
                Math.floor(data.limits.lingerTime[0] * 10) / 10,
                Math.ceil(data.limits.lingerTime[1] * 10) / 10,
                0.1,
                getDirection(metrics.goal_lingerTime - metrics.lingerTime),
                getDirectionStyle(metrics.goal_lingerTime - metrics.lingerTime),
                directionArrowSVGFromValues(metrics.goal_lingerTime, metrics.lingerTime),
                formatNumber(Math.abs(metrics.goal_lingerTime - metrics.lingerTime)),
                's','','s',
                lang_utils.getLocalization('lingerTime', 'AKDV.Descriptions'),
                1, 0
            ]
        );

        let body = `<div class="summary-metrics metric-sliders">`;
        blocks.forEach(block => {
            body += blockTemplate.with(...block)
        })
        body += `</div>`

        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        
        element.appendChild(dom_utils.createElementFromHTMLString(body));
        
        // let's not add the event listeners until the browser has had a chance to update the DOM
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                /* select inputs which have not had their event listeners set */
                let eventElems = document.querySelectorAll('.metric-slider input:not([data-listener-set])');
                Array.from(eventElems).forEach((elem) => {
                    elem.addEventListener("change", (t) => {
                        let metric = t.srcElement.getAttribute('data-metric');
                        let value = t.srcElement.value;
                        /* undo the multiplications made for ease of reading... */
                        let exp = t.srcElement.getAttribute('data-exponent');
                        value *= exp ? Math.pow(10,exp) : 1;
                        /* jshint ignore:start */
                        if (metric === 'speed') {
                            setGoalSpeed(value * 1000);
                        } else {
                            setGoalSpeed(getGoalSpeedByMetric(metric,value));
                        }
                        /* jshint ignore:end */
                    });
                    elem.setAttribute("data-listener-set","true");
                });
            });
        });
    }

    const writeLoadTimeSlider = (selector) => {

        let element = document.querySelector(selector);
        let data = window.akdv.data;
        let metrics = data.metrics[0];

        let speedValues = data.recommendations.map(v => v.loadTime).concat(metrics.speed).filter((x, i, a) => a.indexOf(x) === i);
        let dataList = `<datalist id='loadtime-detents'>`;
        speedValues.forEach(v => dataList += `<option value="${(v / 1000).toFixed(3)}">`);
        dataList += `</datalist>`;

        let body = dataList + string_utils.stringLiteralTemplate`
        <div class="metric-slider slider-wide">
        <div class="metric-change-slider metric-change-slider-wide">
            <div class="summary-metric-name">${2}</div>
            <div class="metric-change metric-change-${8}">${9}</div>
            <div class="summary-metric-values summary-metric-values-inline">
                <div class="input-with-unit">
                    <input type="number" size="4" value="${3}" min="${4}" max="${5}" step="${6}" data-metric="${0}" class="summary-metric-value hidden-number" id="summary-metric-value-${1}" 
                        oninput="document.getElementById('slider-${1}').value = parseFloat(this.value).toFixed(2);"></input>
                    <span class="input-unit">${12}</span>
                </div>
                <div class="summary-metric-change whatif-change-${7} whatif-change-${8}" id="summary-metric-change-${1}">${10}${11}</div>
            </div>
        </div>
        <div class="metric-slider-wide">
        <input type="range" list='loadtime-detents' class="slider slider-wide slider-zoom" data-metric="${0}" id="slider-${1}" value="${3}" min="${4}" max="${5}" step="${6}" 
            oninput="document.getElementById('summary-metric-value-${1}').value = parseFloat(this.value).toFixed(2);"/>
        </div>
        </div>`
        .with(
            'speed','speed',metrics.timerName,
            (metrics.goal_speed / 1000 ).toFixed(2),
            Math.floor(data.limits.speed[0] / 10) / 100,
            Math.ceil(data.limits.speed[1] / 10) / 100,
            0.001,
            getDirection(metrics.goal_speed - metrics.speed),
            getDirectionStyle(metrics.goal_speed - metrics.speed, true),
            directionArrowSVGFromValues(metrics.goal_speed, metrics.speed, true),
            formatNumber(Math.abs(metrics.goal_speed - metrics.speed),0),
            'ms','s');

        element.innerHTML = body;
    }


    const initVegaChart = (element, declaration, namespace=false) => {

        let jsonUrl = `${location.protocol}//${location.hostname}${((location.port)? ':' + location.port : '')}${window.akdv.meta.version ? '/' + window.akdv.meta.version : ''
    }/json/vega/chart_declarations/whatif/${declaration}.json`;

        window.vegaFactory({container_el: element, namespace: namespace || declaration, schema_uri: jsonUrl})
            .then(chart => { window.akdv.vega_charts.push(chart) });
    }

    const initCharts = (e) => {

        let state = window.akdv.data.state[0];

        let summary_element      = document.querySelector('#summary');
        let possibility_element  = document.querySelector('#possibility');
        let loadtime_and_metrics = document.querySelector('#loadtime_and_metrics');
        
        let loadtimeChart = 'loadtime_and_metrics';
        if (!state.conversionAvailable && state.revenueAvailable) {
            loadtimeChart = "loadtime_and_metrics-noConversion";
        } else if (state.conversionAvailable && !state.revenueAvailable) {
            loadtimeChart = "loadtime_and_metrics-noRevenue";
        } else if (!state.conversionAvailable && !state.revenueAvailable) {
            loadtimeChart = "loadtime_and_metrics-noConversionOrRevenue";
        }
        
        window.akdv.vega_charts.forEach(chart => {
            chart.destroy();
        });
        window.akdv.vega_charts = [];

        initVegaChart(summary_element,      'summary');
        initVegaChart(possibility_element,  'possibility');
        initVegaChart(loadtime_and_metrics, loadtimeChart, 'loadtime_and_metrics');

    }

    const resizeCharts = () => {

        window.akdv.vega_charts.forEach(chart => {
            chart.resize();
        });
    }

    const generateDistributionForMedianGoal = (bucket_values = window.required(), bucket_counts = window.required(), goalMedian = window.required(), sigma = 5, medianDiff = false, chunkRatio = 1) => {
        
        // improve performance by chunking beacons. chunkSize = 1: no chunking
        let chunkSize = 10;
        // initialize our new counts array
        let bucket_counts_new = Array(bucket_counts.length).fill(0);
        // determine the current median of the distribution
        let currentMedian = data_utils.percentileOfBuckets(bucket_counts,bucket_values,50);
        // medianDiff is the fractional difference between the current and goal buckets
        // e.g. if currentMedian = 1500 and goalMedian = 1000, medianDiff = 2/3
        // e.g. if currentMedian = 1500 and goalMedian = 2000, medianDiff = 4/3
        medianDiff = medianDiff || (goalMedian / currentMedian)

        window._log.debug(`Current calculated median = ${currentMedian}. Difference from goal of ${goalMedian} is ${(medianDiff*100)-100}%`);

        let bucketCount = bucket_counts.length;
        
        for (let i = 0; i < bucketCount; i++) {
            // for each bucket, redistribute the beacons towards goal bucket
            // goalBucket is the center of the distribution
            let goalBucket = Math.max(0,Math.abs(Math.round(i * medianDiff)));
            // goalRange is the scope of the distribution, i.e. furthest possible in smallest dimension
            let goalRange = Math.min(goalBucket - 0, bucketCount - goalBucket);
            let limits = [Math.max(0, goalBucket - goalRange), Math.min(bucketCount, goalBucket + goalRange)];
            // count is the number of beacons to distribute
            let count = bucket_counts[i];
            // create our normal distribution function
            let generate = () => {
                let ret = Math.round(window.d3.randomNormal(goalBucket,sigma)())
                if (ret < limits[0]) { return limits[0]; }
                else { return ret; }
            };
            for (let c = 0; c < (count / chunkSize); c++) {
                bucket_counts_new[generate()] += Math.round(chunkSize * chunkRatio);
            }
        }
        currentMedian = data_utils.percentileOfBuckets(bucket_counts_new,bucket_values,50);
        medianDiff = goalMedian / currentMedian;
        window._log.debug(`Achieved calculated median = ${currentMedian}. Difference from goal of ${goalMedian} is ${(medianDiff*100)-100}%`);
        return bucket_counts_new;
    }

    const getGoalMetricBySpeed = (metric = window.required(), speed = window.required(), data = false) => {

        data = data || window.akdv.data;
        let goalMetric = null;
        if (!data.rawdata.recommendations.hasOwnProperty(metric)) {
            window._log.warn(`Selected metric ${metric} not available`)
            return null;
        }
        if (speed > data.limits.speed[1]) {
            speed = data.limits.speed[1];
        } else if (speed < data.limits.speed[0]) {
            speed = data.limits.speed[0];
        }

        let distribution = data.rawdata.recommendations[metric].rateMap;
        let index = distribution.median.indexOf(speed);
        if (index >= 0) {
            return distribution.rate[index];
        } else {
            for (let i = 1; i < distribution.median.length; i ++) {
                if ((distribution.median[i] < speed && distribution.median[i-1] > speed) || (distribution.median[i] > speed && distribution.median[i-1] < speed)) {
                    let frac = (speed - distribution.median[i]) / (distribution.median[i-1] - distribution.median[i]);
                    return distribution.rate[i] + (frac * (distribution.rate[i-1] - distribution.rate[i]));
                }
            }
        }
        return goalMetric;
    }

    const getGoalRevenueBySpeed = (speed = window.required(), data = false) => {

        data = data || window.akdv.data;
        
        if (speed > data.limits.speed[1]) {
            speed = data.limits.speed[1];
        } else if (speed < data.limits.speed[0]) {
            speed = data.limits.speed[0];
        }

        let distribution = data.rawdata.recommendations.revenue.rateMap;
        /* old data format - return our best guess */
        if (!distribution.hasOwnProperty('revenue')) {
            return getGoalMetricBySpeed('revenue', speed, data) * data.summary.sessions;
        }
        let index = distribution.median.indexOf(speed);
        
        if (index >= 0) {
            return Math.round(distribution.revenue[index]);
        } else {
            for (let i = 1; i < distribution.median.length; i ++) {
                if ((distribution.median[i] < speed && distribution.median[i-1] > speed) || (distribution.median[i] > speed && distribution.median[i-1] < speed)) {
                    let frac = (speed - distribution.median[i]) / (distribution.median[i-1] - distribution.median[i]);
                    return Math.round(distribution.revenue[i] + (frac * (distribution.revenue[i-1] - distribution.revenue[i])));
                }
            }
        }
        return 0;
    }

    /*
    * flattens individual arrays into an array of named objects
    */
    const flattenDistributions = (data = window.required()) => {

		let keys = Object.keys(data);
        let result = Array(data[keys[0]].length);
        for (let i = 0; i < result.length; i++) {
            result[i] = {};
            keys.forEach(key => {
                result[i][key] = data[key][i]
            })
        }
        return result;
    }

    const getGoalsFromData = (data = window.required()) => {

        let goals = [];
        let available = Object.keys(data.recommendations);
        let fieldNames = Object.keys(fields);
        fieldNames.forEach(fieldName => {
            if (available.includes(fieldName)) {
                let value = data.recommendations[fieldName].rateMap.rate[data.recommendations[fieldName].rateMap.median.indexOf(data.recommendations[fieldName].realMedian)];
                if (value > -1e19 && value < 1e19) {
                    let roundedValue = (fields[fieldName].endsWith('Rate') ? value * 100 : value ).toFixed(2);
                    let friendlyValue = roundedValue;
                    if (fieldName === 'revenue') {
                        if (data.recommendations['revenue'].rateMap.hasOwnProperty('revenue')) {
                            value = data.recommendations['revenue'].rateMap.revenue[data.recommendations[fieldName].rateMap.median.indexOf(data.recommendations[fieldName].realMedian)];
                        } else {
                            value *= data.summary.sessions;
                        }
                        friendlyValue = formatRevenue(value);
                    } else if (fields[fieldName].endsWith('Rate')) {
                        friendlyValue = friendlyValue + '%';
                    } else if (fieldName === 'duration') {
                        friendlyValue = friendlyValue + 's';
                    }
                    goals.push({
                        loadTime: data.recommendations[fieldName].realMedian,
                        metric: fieldName,
                        scale: fields[fieldName],
                        name: lang_utils.getLocalization(fields[fieldName], 'AKDV.Metrics'),
                        value: value,
                        friendlyValue: friendlyValue
                    })
                }
            }
        });
        return goals;
    }

    const arrayMovingAverage = (sourceArray, start=0, lookback=4, lookforward=4) => {

        let len = sourceArray.length;
        if (len < start) { return sourceArray}
        let outputArray = Array(len).fill(0);
        for (let i =0; i<len; i++) {
            if (i < start) { outputArray[i] = sourceArray[i] }
            else {
                let s = Math.max(0,i-lookback);
                let e = Math.min(len-1,i+lookforward);
                let cnt = 0;
                let sum = 0;
                for (let j = s; j<=e; j++) {
                    sum += sourceArray[j];
                    cnt += 1
                }
                outputArray[i] = sum / cnt;
            }
        }
        return outputArray;
    }

    /* calculate the first bucket index which meets the percentile required */
    const getMinArrayIndexForPercentile = (array = window.required(), percentile = window.required()) => {
        
        if (array.length < 1) { return 0 }
        let sum = array.reduce((a,b) => a+b);
        let goal = sum * (percentile <= 1 ? percentile : percentile /100 );
        let index = 0;
        let runningTotal = 0;
        while (runningTotal < goal) {
            runningTotal += array[index++];
        }
        return (index >= array.length ? array.length -1 : index);
    }

    const getInitialRate = (metric = window.required(), data = window.required, rate = false) => {
        if (!data.recommendations.hasOwnProperty(metric)) {
            window._log.warn(`Selected metric ${metric} not available`)
            return null;
        }
        let dist = data.recommendations[metric];
        return dist.rateMap[rate ? 'rate' : metric][dist.rateMap.median.indexOf(data.summary.median)];
    }

    const getBreakdownIdByKey = (key = window.required()) => key.replace(/[\W]+/g,"");

    /*
     * creates the basic data structure and initial distributions
     */
    const initializeData = (result = window.required()) => {

        let days = 0;
        days = (result.meta.endTime - result.meta.startTime) / 24 / 60 / 60 / 1000;
        result.meta.label = (result.meta.label === "PageLoad" ? "Page Load" : result.meta.label);
        let goalSpeedCandidates = [
            result.recommendations.conversions.realMedian,
            result.recommendations.revenue.realMedian,
            result.recommendations.bounces.realMedian,
            result.recommendations.pageviews.realMedian,
            result.recommendations.duration.realMedian
        ];
        // find the closest goal speed to the actual speed, fall back to the actual speed
        goalSpeedCandidates = goalSpeedCandidates.filter(x => x < result.summary.median);
        let goalSpeed = result.summary.median - 100;
        if (goalSpeedCandidates.length > 0) {
            goalSpeed = Math.min(Math.max(...goalSpeedCandidates),result.summary.median);
        }

        let revenueType = getRevenueType();
        let revenueDivisor = getRevenueDivisor();
        // normalize currency now to make it simpler later
        // first divide the base distribution by the currency decimal places value (e.g. decimal places = 2 => divide by 100)
        if (revenueDivisor !== 1) {
            result.baseDistribution.revenue = result.baseDistribution.revenue.map(
                v => v / revenueDivisor
            );
        }
        // for average order values we need a valid number of conversions. If the data is for a media customer and conversions === 0, this may be equal to the number of sessions
        let conversions = result.summary.conversions > 0 ? result.summary.conversions : result.summary.sessions;
        // the revenue rate map is calculated as average revenue per _session_, we need to normalize this to _converted sessions_ to provide an average order value
        result.recommendations.revenue.rateMap.rate = result.recommendations.revenue.rateMap.rate.map(
            v => v / revenueDivisor
        );
        if (result.recommendations.revenue.rateMap.hasOwnProperty('revenue')) {
            result.recommendations.revenue.rateMap.revenue = result.recommendations.revenue.rateMap.revenue.map(
                v => v / revenueDivisor
            );
        }
        result.summary.revenue = result.summary.revenue / revenueDivisor;
        let [revenueExponent, revenueSuffix] = string_utils.getNumberExponentAndSuffix(result.summary.revenue);
        let revenueLimits = [];
        if (result.recommendations.revenue.rateMap.hasOwnProperty('revenue')) {
            revenueLimits = [Math.min(...result.recommendations.revenue.rateMap.revenue), Math.max(...result.recommendations.revenue.rateMap.revenue)];
        } else {
            revenueLimits = [Math.min(...result.recommendations.revenue.rateMap.rate) * result.summary.sessions, Math.max(...result.recommendations.revenue.rateMap.rate) * result.summary.sessions];
        }
        let maxRender = 10;
        let dimensions = false;
        if (result.dimensions && result.dimensions.length > 0) {
            dimensions = 
                result.dimensions
                .sort((a,b) => b.ordercol - a.ordercol)
                .map((obj,i) => ({
                    ...obj, id: getBreakdownIdByKey(obj.label), goal_timer: obj.timer, active: (i < maxRender ? true : false)
                }))
        }

        return {
            metrics: [{
                goal_speed:           goalSpeed,
                goal_conversionRate:  null,
                goal_bounceRate:      null, 
                goal_sessionLength:   null, 
                goal_orderValue:      null,
                goal_revenue:         null, 
                goal_sessionDuration: null, 
                goal_lingerTime:      null,
                speed:                result.summary.median,
                conversionRate:       getInitialRate('conversions', result, true),
                bounceRate:           getInitialRate('bounces',     result, true),
                sessionLength:        getInitialRate('pageviews',   result, true),
                orderValue:           getInitialRate('revenue',     result, true),
                sessionDuration:      getInitialRate('duration',    result, true),
                lingerTime:           getInitialRate('visit_time',  result, true),
                sessions:             getInitialRate('pageviews',   result, false),
                revenue:              Math.round(getInitialRate('revenue', result, false)),
                pageviews:            result.summary.pageviews,
                date_days:            days,
                timerName:            (result.meta && result.meta.label ) || mpulse.getFilterDisplayLabelByName("timer") || fallbackTimerName,
                conversionMetric:     getConversionName(),
                revenueMetric:        getRevenueName(),
                loadTime95th:         Math.ceil(result.buckets[getMinArrayIndexForPercentile(result.baseDistribution.sessions,0.97)]/1000)*1000,
                revenueExponent:      revenueExponent,
                revenueSuffix:        revenueSuffix
            }],
            data: flattenDistributions({
                buckets:                  result.buckets,
                sessions:                 result.baseDistribution.sessions,
                conversions:              result.baseDistribution.conversions,
                conversionRate:           result.baseDistribution.conversions.map((v,i) => { return v / result.baseDistribution.sessions[i]}),
                predicted_sessions:       Array(result.buckets.length).fill(0),
                predicted_conversionRate: Array(result.buckets.length).fill(0)
            }),
            rateDistributions: flattenDistributions({
                loadTime:        result.recommendations.pageviews.rateMap.median,
                sessionLength:   result.recommendations.pageviews.rateMap.rate,
                lingerTime:      result.recommendations.visit_time.rateMap.rate,
                conversionRate:  result.recommendations.conversions.rateMap.rate,
                bounceRate:      result.recommendations.bounces.rateMap.rate,
                sessionDuration: result.recommendations.duration.rateMap.rate,
                orderValue:      result.recommendations.revenue.rateMap.rate,
                revenue:         result.recommendations.revenue.rateMap.rate.map(v => v * result.summary.sessions)
            }),
            recommendations: getGoalsFromData(result),
            rawdata: result,
            state: [{
                minSpeed:            Math.min(...result.recommendations.conversions.rateMap.median),
                maxSpeed:            Math.max(...result.recommendations.conversions.rateMap.median),
                conversionAvailable: (result.summary.conversions > 0 && result.summary.conversions < result.summary.sessions * maxConversionRate),
                revenueAvailable:    (result.summary.revenue > 0),
                revenueType:         getRevenueType(),
                dimension:           result.meta.groupLabel
            }],
            distributions: {
                buckets:                  result.buckets,
                sessions:                 result.baseDistribution.sessions,
                conversionRate:           result.baseDistribution.conversions.map((v,i) => { return v/result.baseDistribution.sessions[i]}),
                conversions:              result.baseDistribution.conversions,
                predicted_sessions:       null,
                predicted_conversionRate: null
            },
            summary: {
                speed:           result.summary.median,
                conversionRate:  result.summary.conversions / result.summary.sessions,
                bounceRate:      result.summary.bounces / result.summary.sessions,
                sessionLength:   result.summary.pageviews / result.summary.sessions,
                orderValue:      result.summary.revenue / result.summary.sessions,
                sessionDuration: result.summary.duration / result.summary.sessions,
                lingerTime:      result.summary.visit_time / result.summary.sessions,
                sessions:        result.summary.sessions,
                revenue:         result.summary.revenue,
                pageviews:       result.summary.pageviews
            },
            limits: {
                speed:          [Math.min(...result.recommendations.conversions.rateMap.median), Math.max(...result.recommendations.conversions.rateMap.median)],
                conversionRate: [Math.min(...result.recommendations.conversions.rateMap.rate),   Math.max(...result.recommendations.conversions.rateMap.rate)],
                bounceRate:     [Math.min(...result.recommendations.bounces.rateMap.rate),       Math.max(...result.recommendations.bounces.rateMap.rate)],
                sessionLength:  [Math.min(...result.recommendations.pageviews.rateMap.rate),     Math.max(...result.recommendations.pageviews.rateMap.rate)],
                orderValue:     [Math.min(...result.recommendations.revenue.rateMap.rate),       Math.max(...result.recommendations.revenue.rateMap.rate)],
                sessionDuration:[Math.min(...result.recommendations.duration.rateMap.rate),      Math.max(...result.recommendations.duration.rateMap.rate)],
                lingerTime:     [Math.min(...result.recommendations.visit_time.rateMap.rate),    Math.max(...result.recommendations.visit_time.rateMap.rate)],
                revenue:        revenueLimits,
            },
            dimensions: dimensions
        }
    }


    const setGoalSpeedForData = (speed = window.required(), data = window.required()) => {

        let metrics = data.metrics[0];
                
        let conversionRate = getGoalMetricBySpeed('conversions',speed, data);

        Object.assign(metrics, {
            goal_speed:           speed,
            goal_conversionRate:  conversionRate,
            goal_bounceRate:      getGoalMetricBySpeed('bounces',    speed, data),
            goal_sessionDuration: getGoalMetricBySpeed('duration',   speed, data),
            goal_lingerTime:      getGoalMetricBySpeed('visit_time', speed, data),
            goal_sessionLength:   getGoalMetricBySpeed('pageviews',  speed, data),
            goal_orderValue:      getGoalMetricBySpeed('revenue',    speed, data),
            goal_revenue:         getGoalRevenueBySpeed(speed, data)
        });

        data.distributions.predicted_sessions       = generateDistributionForMedianGoal(data.distributions.buckets,data.distributions.sessions, speed, 6);
        data.distributions.predicted_conversions    = generateDistributionForMedianGoal(data.distributions.buckets,data.distributions.conversions, speed, 3, speed / metrics.speed, conversionRate / metrics.conversionRate );
        data.distributions.predicted_conversionRate = data.distributions.predicted_conversions
            .map((v,i) => {
                if (data.distributions.predicted_conversions[i] <= 1) {
                    return 0;
                } else {
                    return Math.min(1, v / data.distributions.predicted_sessions[i]);
                }
            });

        data.data = 
            flattenDistributions({
                buckets: data.distributions.buckets,
                sessions: data.distributions.sessions,
                conversionRate: data.distributions.conversions.map((v,i) => { return v / data.distributions.sessions[i]}),
                predicted_sessions: data.distributions.predicted_sessions,
                predicted_conversionRate: data.distributions.predicted_conversionRate
            })
        if (updateSpeed && data.dimensions) {
            let diff = speed / metrics.speed;
            data.dimensions.forEach((datum) => {
                datum.goal_timer = Math.round(datum.timer * diff);
            });
        }
        return data;
    }

    const updateBreakdownSpeed = (id = window.required(), speed = window.required) => {

        let d = window.akdv.data.dimensions;
        let i = d.findIndex((t) => t.id === id);
        if (i < 0) {
            window._log.warn(`WARNING: Unable to find data for '${id}'`);
            return;
        }
        // first set the value in the data
        d[i].goal_timer = speed;

        // now update the chart if it is present
        if (!d[i].active) {
            window._log.info(`Skipping '${id}' as it is not active`);
            return;
        }
        let speedElem = document.getElementById(`speed-metric-${id}`);
        let changeElem = document.getElementById(`speed-change-${id}`);
        let sliderElem = document.getElementById(`slider-breakdown-${id}`);
        if (speedElem && changeElem && sliderElem) {
            let originalspeed = d[i].timer;
            let speedDiff = speed - originalspeed;
            speedElem.value = speed;
            sliderElem.value = speed;
            speedElem.innerHTML = formatNumber(speed / 1000) + 's';
            changeElem.innerHTML = (speedDiff > 0 ? '+' : '') + formatNumber(speedDiff,0) + 'ms';
            changeElem.className = "summary-metric-change inline " + getDirectionClass(speedDiff, true);
        }
    }

    const updateBreakdownCharts = (goalSpeed = false) => {
        let metrics = window.akdv.data.metrics[0];
        goalSpeed = goalSpeed || metrics.goal_speed;
        let oldSpeed = metrics.speed;

        let diff = goalSpeed / oldSpeed;
        // update the goal speed for each chart
    
        window.akdv.data.dimensions.forEach(dimension => {
            updateBreakdownSpeed(dimension.id, dimension.timer * diff);
        });
    }

    const updateCharts = () => {
        
        statusNotifier.analyzing();
        writeLoadTimeSlider('#loadtime_slider');
        writeSummaryValues('#summary-values');
        writePossibilityValues('#possibility-values');
        writeSliderValues('#possibility_sliders');
        writeProse('#whatif-summary-prose');

        event_utils.dispatchCustomEvent(window, 'result', 'summary',              window.akdv.data);
        event_utils.dispatchCustomEvent(window, 'result', 'possibility',          window.akdv.data);
        event_utils.dispatchCustomEvent(window, 'result', 'loadtime_and_metrics', window.akdv.data);

        if (window.akdv.data.dimensions) {
            if (document.querySelector('#breakdown-possibility-values')) {
                writePossibilityValues('#breakdown-possibility-values');
            }
            if (updateSpeed) {
                updateBreakdownCharts();
            }
        }
    }

    const hideOptions = () => {
        let el = document.querySelector("#breakdown-select-checkbox");
        if (el) { el.checked = false }
    }

    /* 
     * update the goal speed and calculate all other goals and distributions
     */
    const setGoalSpeed = (speed = false, data = false) => {

        hideOptions();
        data = data || window.akdv.data;
        let metrics = window.akdv.data.metrics[0];
        speed = speed || metrics.goal_speed;
        // ensure speed is within possible extent
        if (speed > data.limits.speed[1]) {
            speed = data.limits.speed[1];
        } else if (speed < data.limits.speed[0]) {
            speed = data.limits.speed[0];
        }
        window.akdv.data = setGoalSpeedForData(speed, window.akdv.data);
        updateCharts();
    }

    const clearBreakdownSection = () => {
        
        // clear the nav entry and section
        let holdingElem = document.querySelector(`#breakdown-link`);
        let sectionElem = document.querySelector(`#whatif-breakdown`);
        if (holdingElem) { holdingElem.parentNode.removeChild(holdingElem) }
        if (sectionElem) { sectionElem.parentNode.removeChild(sectionElem) }

    }

    const createBreakdownSection = (selector, dimensionName) => {

        clearBreakdownSection();
        let sectionElem = document.querySelector(selector);
        let navElem = document.querySelector(`#whatif-nav ul`);
        let nav = dom_utils.createElementFromHTMLString(`<li id="breakdown-link"><a href="#whatif-breakdown">${dimensionName} ${lang_utils.getLocalizedHTMLString('Breakdown','WhatIf.Strings')}</a></li>`);
        let section = dom_utils.createElementFromHTMLString(`<section class="whatif-section" id="whatif-breakdown">
        <h2>${dimensionName} ${lang_utils.getLocalizedHTMLString('Breakdown','WhatIf.Strings')}</h2><div id="whatif-breakdown_container" class="whatif-graph-container whatif-well">`);
        sectionElem.appendChild(section);
        navElem.appendChild(nav);
    }

    const setSpeedFromBreakdowns = () => {
    
        // calculate sum of weighted change by breakdown
        let diff = 0;
        window.akdv.data.dimensions.forEach(dimension => {
            let curSpeed = dimension.goal_timer;
            let oldSpeed = dimension.timer;
            let weight = dimension.plt_weight_50 < 1 ? dimension.plt_weight_50 : dimension.session_pc;
            diff += ( curSpeed - oldSpeed ) * weight;
        })
        window._log.info(`Adjusting goal speed by ${diff}ms`);
        updateSpeed = false;
        setGoalSpeed(window.akdv.data.summary.speed + diff);
        updateSpeed = true;
    }

    const addBreakdownChart = (selector,datum,last=false) => {

        let elem = document.querySelector(selector);
        
        let speedInS = formatNumber(datum.goal_timer / 1000);
        let maxSpeed = window.akdv.data.metrics[0].loadTime95th || 10000;
        let list = '';
        if (last) {
            let vals = Array.apply(null, {length: (maxSpeed / 1000)+1}).map(Number.call, Number);
            let ps = "";
            vals.forEach(v => {ps += `<p>${v}s</p>`});
            list = !last ? '' : `<div class='slider-ticks'>${ps}</div>`;
        }
        let breakdownElem = dom_utils.createElementFromHTMLString(`
        <div class="breakdown-container" id="breakdown-container-${datum.id}">
            <div class="breakdown-name-container">
                <span class="dimension-label">${datum.label}</span>
            </div>
            <div class="breakdown-chart-container" id="breakdown-chart-container-${datum.id}">
                <datalist id="loadtime-detents-${datum.id}">
                    <option class="detent-default" style="left: calc(70% * (${datum.timer} / ${maxSpeed}));" value="${datum.timer}">
                </datalist>
                <input type="range" list="loadtime-detents-${datum.id}" class="slider breakdown-slider" 
                    data-breakdown="${datum.id}" id="slider-breakdown-${datum.id}" value="${datum.goal_timer}" min="0" max="${maxSpeed}"
                    data-value="${datum.timer}" step="1">
                    ${list}
            </div>
            <div class="breakdown-summary-container" id="breakdown-summary-container-${datum.id}">
            <div class="summary-metric inline">
                <div class="summary-metric-values">
                    <div class="summary-metric-value inline" id="speed-metric-${datum.id}">${speedInS}s</div>
                    <div class="summary-metric-change inline" id="speed-change-${datum.id}">&nbsp;</div>
                </div>
            </div>
            </div>
        </div>`);
        breakdownElem.addEventListener("input", (t) => {
            let elem = t.srcElement;
            let id = elem.getAttribute("data-breakdown");
            let value = parseInt(elem.value), min = parseInt(elem.getAttribute("data-min")), max = parseInt(elem.getAttribute("data-max"));
            updateBreakdownSpeed(id, value);
        });
        breakdownElem.addEventListener("change", (t) => {
            let elem = t.srcElement;
            let id = elem.getAttribute("data-breakdown");
            let value = parseInt(elem.value), min = parseInt(elem.getAttribute("data-min")), max = parseInt(elem.getAttribute("data-max"));
            updateBreakdownSpeed(id, value);
            setSpeedFromBreakdowns();
        });

        elem.appendChild(breakdownElem);
        updateBreakdownSpeed(datum.id, datum.goal_timer);
    }

    const addBreakdownCharts = (selector) => {

        let meta = false;
        document.querySelector(selector).innerHTML = "";
        let dims = window.akdv.data.dimensions.filter(obj => obj.active);
        let max = dims.length - 1;
        let c = 0;
        dims.forEach(dimension => {
            addBreakdownChart(selector,dimension,c===max);
            c++;
        })
    }

    const renderDimensions = (dimensions) => {
        
        document.querySelector('#breakdown-num-selected').innerHTML = `(${dimensions.length}/${window.akdv.data.dimensions.length})`;
        window.akdv.data.dimensions.forEach(obj => {
            obj.active = dimensions.includes(obj.id);
        })
        addBreakdownCharts("#breakdown-charts");
    }

    const addBreakdownOptionSelect = (selector,name) => {

        let elem = document.querySelector(selector);
        dom_utils.appendFromHTMLString(elem,`<input type="checkbox" class="hidden-checkbox" id="breakdown-select-checkbox">`);
        dom_utils.appendFromHTMLString(elem,`<label class="checkbox-container noselect" onclick="let c = $('#breakdown-select-checkbox');c.prop('checked', !c.prop('checked'));" for="breakdown-option-checkbox">${name} <span id="breakdown-num-selected"></span> <svg class="inline-svg breakdown-select-indicator"><use xlink:href="#arrow-down-mini"></use></svg></label>`);
        dom_utils.appendFromHTMLString(elem,`<div id="breakdown-selector"><span id="breakdown-close-btn" onclick="$('#breakdown-select-checkbox').prop('checked',false);">✕</span></div>`);
        
        let dimensionKeyValueList = window.akdv.data.dimensions.map((obj) => [obj.label,obj.id])
        const opt = window.optionSelectMenuFactory({
            container_el: document.querySelector("#breakdown-selector"),
            event_namespace_for_state_change: 'breakdown-select',
            with_multi_select: true,
            with_search_field: true,
            with_checkboxes: true,
            title: name,
            options_key_value_list: dimensionKeyValueList,
            search_field_placeholder: 'Filter'
        });
        let dims = window.akdv.data.dimensions.filter(obj => obj.active).map(obj => obj.id);
        opt.state = dims;
        renderDimensions(dims);
    }

    const addGroupBySection = () => {

        // create the new section & menu item
        let dimensionName = window.akdv.data.state[0].dimension;
        createBreakdownSection(`#whatif-container`,dimensionName);
        // trigger the chart initialization
        let container = document.querySelector("#whatif-breakdown_container");


        let resetBtn = dom_utils.createElementFromHTMLString(`<span>${lang_utils.getLocalizedHTMLString('GoalSpeed','WhatIf.Charts')} (<span class="link" id="btn-reset-breakdown">${lang_utils.getLocalizedHTMLString('ResetChanges','WhatIf.Buttons')})</span></span>`);
        resetBtn.addEventListener("click", (e) =>{ setGoalSpeed(window.akdv.data.metrics[0].speed) });
        
        container.appendChild(dom_utils.createElementFromHTMLString(`
            <div id="breakdown-possibility-values" class="breakdown-possibility-values"></div>`));
        container.appendChild(dom_utils.createElementFromHTMLString(`
            <div id="breakdown-header" class="breakdown-section"><div id="breakdown-selector-container" class="breakdown-name-container"></div><div class="breakdown-chart-container" id="reset-btn-container">&nbsp;</div><div class="breakdown-summary-container"><div class="summary-metric-values">${window.akdv.data.metrics[0].timerName}</div></div></div>`));
        container.appendChild(dom_utils.createElementFromHTMLString(`
            <div id="breakdown-charts" class="breakdown-section"></div>`));
        
        document.querySelector("#reset-btn-container").appendChild(resetBtn);
        
        addBreakdownOptionSelect("#breakdown-selector-container",dimensionName);
    }

    const validateWhatIfData = (data) => {

        return !(!data || !data.hasOwnProperty('summary') || !data.summary.hasOwnProperty('sessions') || data.summary.sessions < 1);
    }

    const processWhatIfData = (e, result) => {
        
        let valid = validateWhatIfData(result);

        if (valid) {
            window.akdv.data = initializeData(result);
            initCharts();
            setGoalSpeed();
            if (window.akdv.data.dimensions) {
                addGroupBySection();
            }
            updateCharts();
        } else {
            window._log.warn("WARNING: invalid What-If data received");
            statusNotifier.noData();
        }
    }
    
    const localizeStaticStrings = () => {
        $('#heading-summary')
            .html(lang_utils.getLocalizedHTMLString('Summary', 'WhatIf.Strings'));
        $('#heading-loadtimeandmetrics')
            .html(lang_utils.getLocalizedHTMLString('LoadTimeAndMetrics', 'WhatIf.Strings'));
        $('#link-summary')
            .html(lang_utils.getLocalizedHTMLString('Summary', 'WhatIf.Strings'));
        $('#link-loadtimeandmetrics')
            .html(lang_utils.getLocalizedHTMLString('LoadTimeAndMetrics', 'WhatIf.Strings'));
        $('#summary-summary')
            .html(lang_utils.getLocalizedHTMLString('Summary', 'WhatIf.Strings'));
        $('#summary-loadtimeandmetrics')
            .html(lang_utils.getLocalizedHTMLString('LoadTimeAndMetrics', 'WhatIf.Strings'));
        $('#prose-summary')
            .html(lang_utils.getLocalizedHTMLString('Goals', 'WhatIf.Prose'));
        $('#label-summary-reality')
            .html(lang_utils.getLocalizedHTMLString('TheReality', 'WhatIf.Strings'));
        $('#label-summary-possibility')
            .html(lang_utils.getLocalizedHTMLString('ThePossibility', 'WhatIf.Strings'));
        $('#summary-tab')
            .html(lang_utils.getLocalizedHTMLString('TheReality', 'WhatIf.Strings'));
        $('#possibility-tab')
            .html(lang_utils.getLocalizedHTMLString('ThePossibility', 'WhatIf.Strings'));
    }

    const init = () => {
        localizeStaticStrings();
        $(window).on(`result.data`, processWhatIfData);
        $(window).on(`mpulse-filter-updated.akdv`, (e, data) => processWhatIfData(data));
        $(window).resize(resizeCharts);
        $(window).on(`visibilitychange`, resizeCharts);
        $(window).on(`options-select.breakdown-select`, (e,dimensions) => renderDimensions(dimensions));
    }

    lang_utils.addPackageToLoad('AKDV-Chart-WhatIf');
    event_utils.dispatchCustomEvent(window, 'performance-chart-count', 'akdv', 3);
    $(window).on('datasource-initialized.akdv', init);
    window.akdv.vega_charts = [];
    $(document).keyup(e => {if (e.key === "Escape") {hideOptions()}});

})(window, window.jQuery, window.akdv.utils_string, window.akdv.utils_event, window.akdv.utils_data, window.akdv.utils_lang, window.akdv.utils_dom, window.akdv.utils_time, window.akdv.mpulse, window.akdv.icons, window.akdv.statusNotifier);
