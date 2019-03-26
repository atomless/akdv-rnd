;(function(
        window,
        getD3RowChartDifferencePlot,
        getBoxWhiskerRowPlot,
        getLineComparision,
        getTextCellsChart,
        d3,
        D3VendorColor,
        componentFactory,
        annotationBubbleFactory,
        markdownit,
        event_utils,
        stringUtils,
        langUtils,
        addLocalizedString,
        getLocalizedHTMLString,
        statusNotifier
        ) {

    'use strict';
    
    const risUUID = window.akdv.utils_string.generateUUID();
    
    const $mainTitle = $('#optimization-infographic-main-title'); 
    const $dataSetsPicker = $('#optimization-infographic-result-set-picker'); 
    const $dataSetsSelectedItem = $('#optimization-infographic-result-set-selected-item'); 
    const $dataSetsList = $('#optimization-infographic-result-set-list'); 
    const resultSetItemTemplate = window.akdv.utils_string.stringLiteralTemplate`<span class="result-set">Pageviews for <span class="time-span"><span class="text-semi-highlight">${0}</span> - <span class="text-semi-highlight">${1}</span></span></span>`;
    
    const EVENT_NAMESPACE_FOR_FULL_DATA_UPDATE = 'full-data-update';
    const EVENT_NAMESPACE_FOR_RESOURCE_OPTIMIZATION = 'resource-optimization';
    const EVENT_NAMESPACE_FOR_PAGE_GROUP_ANNOTATION = 'page-group-annotation';
    const EVENT_NAMESPACE_FOR_RESOURCE_Y_AXIS_ANNOTATION = 'box-whisker-y-axis-annotation';
    const EVENT_NAMESPACE_FOR_BOX_WHISKER_ANNOTATION = 'box-whisker-annotation';
    const EVENT_NAMESPACE_FOR_EXTERNAL_FILTER = 'page-group';
    const EVENT_NAMESPACE_FOR_PAGE_GROUP_RESOURCES_DATA = 'page-group-resources-data';
    const EVENT_NAMESPACE_FOR_AUTO_SCROLL = 'asset';
        
    const EVENT_NAMESPACE_FOR_OPTIMIZED_DATA_UPDATE = 'optimized-data-update';
    
    
    const EVENT_FILTER_SLIDER_ANNOTATION = 'filter-slider-annotation';
    const ANNOTATION_CONTAINER_ID = '#annotation-layer';
    
    const resultSets = {};
    let selectedResultSet = null;
    
    const locale = window.akdv.utils_lang.locale; // General LOCAL / TIMEZINE properties, use for date/times
    const tz = window.akdv.utils_lang.timezone;
    
    // Charts
    let chartOne = { impact_criteria: function(){ return ''; } }; // These will be re-defined as chart objects later in init, but we need dummy methods right now
    let chartTwo = {};
    let chartThree = {};
    let chartFour = { impact_criteria: function(){ return ''; } };  // These will be re-defined as chart objects later in init, but we need dummy methods right now
    let chartFive = {};
    
    const chart_one_Axis_x_bottom_slider_mult = 0.01;
    const chart_one_axis_x_bottom_min_value = 0;
    let chart_one_axis_x_bottom_max_value = 1;
    
    const chart_three_Axis_x_bottom_slider_mult = 0.01;
    let chart_three_axis_x_bottom_min_value = 0;
    let chart_three_axis_x_bottom_max_value = 1;

    const page_group_data_axis_x_bottom_property_name = 'Relative Conversion Impact Score';
    
    let maxPageGroupThreshold = 1;
    
    // Instantiate our mardown lib
    const mkdown = markdownit();
    
    // Has this RIS received any data yet
    let chartDataReceived = false;
    let pageGroupsHaveResources = true;
    let interactableResources = false;
    
    const resultData = {
         original: null,
         processed: null
    };
    
    const updateDataState = function(e,result) {
        chartDataReceived = true;
    }
    $(window).on('result.column-one-ci-vs-lt', updateDataState);

    
    
    /* ---------------------- Result Set Picker--------------------------------- */
    $dataSetsSelectedItem.on('mouseenter', (e) => { $dataSetsPicker.addClass('displayed') } );
    $dataSetsPicker.on('mouseleave', (e) => { $dataSetsPicker.removeClass('displayed') } );
    
    const createResultSetHTML = function(set) {
        const start_datetime = window.moment(set.startTime).format('MMM Do YYYY, H:mm:ss');
        const end_datetime = window.moment(set.endTime).format('MMM Do YYYY, H:mm:ss');
        return resultSetItemTemplate.with( start_datetime, end_datetime );
    }

    const resultSetItemClicked = function(e) {
        
        $dataSetsPicker.removeClass('displayed');

        const resultSet = resultSets[$(e.currentTarget).data('set-key')];
        
        let resultURI = window.akdv.config.s3data_uri + '/' + window.akdv.utils_env.html_filename + '/' + resultSet.result;
        statusNotifier.setInfo({ title: getLocalizedHTMLString('Requesting', 'AKDV.Status') });
        window.akdv.requestJSONFileData( resultURI );
        
        $dataSetsSelectedItem.html( createResultSetHTML(resultSet) );
    }
        
    const displayDataSetList = function(e,result) {
        
        if( $.type(result.data) === 'array' )
        {
            let resultSetsArray = result.data.sort( (a, b) => a.startTime < b.startTime );
            
            $dataSetsSelectedItem.html( createResultSetHTML( resultSetsArray[0] ) );
            $dataSetsList.empty();
            

            resultSetsArray.forEach(function(set,i) {
                
                const itemUUID = window.akdv.utils_string.generateUUID();
                resultSets[itemUUID] = set;

                $dataSetsList.append('<li class="sub-title" data-set-key="' + itemUUID +'">' + createResultSetHTML(set) + '</li>')
            });
            
            let offset = $mainTitle.offset();
            $dataSetsPicker.css('top', (offset.top + $mainTitle.height() + window.akdv.utils_css.remsToPixels(0.2)) + 'px' ).css('left', (offset.left - window.akdv.utils_css.remsToPixels(0.8)) + 'px' );
            
            $dataSetsPicker.on('mousedown','li', resultSetItemClicked );
        }  
    }
    $(window).on('result.ris-data-sets', displayDataSetList);
    
    /* ---------------------------------------------------------------------------- */

    
    const pageGroupAnnotation = componentFactory({ 
        'container_el': document.querySelector(ANNOTATION_CONTAINER_ID),
        'event_namespace': EVENT_NAMESPACE_FOR_PAGE_GROUP_ANNOTATION,
        'component': annotationBubbleFactory,
        'show_timeout_period_ms': 400,
        'offset_x_rems': 1.5,
        'offset_y_rems': 0,
        'class_list': ['simple-bubble','label-length-long'],
        'function_to_format_data': ({ e, pos, data } = {}) => {

            if( $(e.currentTarget).hasClass('non-selectable') && data.value.selectable === false )
            {
                return {
                    title_obj: {
                        name: getLocalizedHTMLString('PageGroupLabel', 'RIS.ChartOne'),
                        value: data.key
                    },
                    description_text:
                        getLocalizedHTMLString('NonInteractivePageGroup', 'RIS.General'),
                    x: pos.x,
                    y: pos.boundingRect.top + (pos.boundingRect.height / 2)
                }; 
            }
            else
            {
                const msPostfix = $( getLocalizedHTMLString('MillisecondsPostfix', 'RIS.General') ).text();
                
                if( data.value.selectable && $.type(data.value.page_timer) === 'number')
                {
                    let changePrefix = ' ';
                    if(data.value.page_timer > data.value.orig_page_timer)
                    {
                        changePrefix = '+';
                    }
                    else if(data.value.page_timer < data.value.orig_page_timer)
                    {
                        changePrefix = '-';
                    }
                    else
                    {
                        changePrefix = ' ';
                    }
                    
                    return {
                        title_obj: {
                            name: getLocalizedHTMLString('PageGroupLabel', 'RIS.ChartOne'),
                            value: data.key
                        },
                        name_value_unit_obj_list: [
                            { 
                                name: 'Relative Conversion Impact Score',
                                label: getLocalizedHTMLString('PageGroupImpactAnnotationTitle', 'RIS.General').replace( /@~@/, chartOne.impact_criteria() ),
                                value: data.value['Relative Conversion Impact Score'].toFixed(5)
                            },
                            { 
                                    name: 'orig_page_timer',
                                    label: getLocalizedHTMLString('PageGroupInitialLoadTime', 'RIS.General'),
                                    value: stringUtils.getFormattedInteger(data.value.orig_page_timer) + msPostfix
                            },
                            { 
                                    name: 'page_timer',
                                    label: getLocalizedHTMLString('PageGroupProjectedLoadTime', 'RIS.General'),
                                    value: stringUtils.getFormattedInteger(data.value.page_timer) + msPostfix
                            },
                            { 
                                name: 'percentage_improvement',
                                label: getLocalizedHTMLString('LoadDurationChange', 'RIS.General'),
                                value: changePrefix + Math.abs((1 - (data.value.page_timer / data.value.orig_page_timer)) * 100).toFixed(0) + '%',
                            },
                        ],
                        x: pos.x,
                        y: pos.boundingRect.top + (pos.boundingRect.height / 2)
                    }
                }
                else
                {
                    return {
                        title_obj: {
                            name: getLocalizedHTMLString('PageGroupLabel', 'RIS.ChartOne'),
                            value: data.key
                        },
                        name_value_unit_obj_list: [
                            { 
                                name: 'Resource_Impact',
                                label: getLocalizedHTMLString('PageGroupImpactAnnotationTitle', 'RIS.General').replace( /@~@/, chartOne.impact_criteria() ),
                                value: parseFloat(data.value['Relative Conversion Impact Score']).toFixed(3)
                            },
                            { 
                                name: 'orig_page_timer',
                                label: getLocalizedHTMLString('PageGroupLoadTimeLabel', 'RIS.ChartOne'),
                                value: stringUtils.getFormattedInteger(data.value.orig_page_timer) + msPostfix
                            }
                        ],
                        x: pos.x,
                        y: pos.boundingRect.top + (pos.boundingRect.height / 2)
                    } 
                }
            }  
        }
    });
    
    
    const boxWhiskerYAxisResource = componentFactory({ 
        'container_el': document.querySelector(ANNOTATION_CONTAINER_ID),
        'event_namespace': EVENT_NAMESPACE_FOR_RESOURCE_Y_AXIS_ANNOTATION,
        'component': annotationBubbleFactory,
        'show_timeout_period_ms': 400,
        'offset_x_rems': 0.56,
        'offset_y_rems': 0.4,
        'class_list': ['simple-bubble', 'align-override-right', 'label-length-medium'],
        'function_to_format_data': ({ url, impact, vendor, median, hits, pos } = {}) => {

            
//            if( $.type(navigator) === 'object' && $.type(navigator.clipboard) === 'object' && $.type(navigator.clipboard.writeText) === 'function' )
//            {
//                // Copy the current URL to Clipboard, on navigators that support it
//                navigator.clipboard.writeText(url).then( () => {
//                    window._log.info('Axis Annotation URL copied to clipboard.');
//                }, () => {
//                    window._log.error('Unable to write Axis Annotation URL to clipboard');
//                });
//            }

            const urlLabel = $( getLocalizedHTMLString('URL', 'RIS.General') ).text();
            const impactScoreLabel = $( getLocalizedHTMLString('ImpactScore', 'RIS.General') ).text().replace(/@~@/,'');
            const medianLoadTimeLabel = $( getLocalizedHTMLString('MedianLoadTime', 'RIS.General') ).text();
            const hitsLabel = $( getLocalizedHTMLString('Hits', 'RIS.General') ).text();
            const msPostfix = ' ' + $( getLocalizedHTMLString('MillisecondsPostfix', 'RIS.General') ).text();
            
            return {
                title_obj: { 
                    name: 'Vendor',
                    value: vendor
                },
                
                name_value_unit_obj_list: [
                    { name: 'URL', label: urlLabel, value: url },
                    { name: 'Impact', label: impactScoreLabel, value: impact.toFixed(3) },
                    { name: 'Median Load Time', label: medianLoadTimeLabel, value: stringUtils.getFormattedInteger(median * 1), unit: msPostfix },
                    { name: 'Hits', hitsLabel, value: stringUtils.getFormattedInteger(hits * 1) }
                ],
                
                x: pos.right,
                y: pos.top
            };
        }
    });
    
    
    const boxWhiskerResourceAnnotation = componentFactory({ 
        'container_el': document.querySelector(ANNOTATION_CONTAINER_ID),
        'event_namespace': EVENT_NAMESPACE_FOR_BOX_WHISKER_ANNOTATION,
        'component': annotationBubbleFactory,
        'show_timeout_period_ms': 900,
        'offset_x_rems': 1.5,
        'offset_y_rems': 0,
        'class_list': ['simple-bubble','align-override-right','label-length-medium'],
        'function_to_format_data': ({ e, pos, data } = {}) => {
            
            if( $(e.currentTarget).hasClass('interactable') )
            {
                const msPostfix = $( getLocalizedHTMLString('MillisecondsPostfix', 'RIS.General') ).text();
                const median = $( getLocalizedHTMLString('BoxWhiskerMedian', 'RIS.General') ).text();
                const current = $( getLocalizedHTMLString('Current', 'RIS.General') ).text();
                const projected = $( getLocalizedHTMLString('Projected', 'RIS.General') ).text();

                const anno = {
                    title_obj: {
                        value: getLocalizedHTMLString('ResourceLoadTimingTitle', 'RIS.ChartThree')
                    },
                    
                    name_value_unit_obj_list: [],
                    
                    x: pos.x,
                    y: pos.boundingRect.top + (pos.boundingRect.height / 2)
                };
                
                if( $.type(data.orig_median) === 'number' )
                {
                    anno.name_value_unit_obj_list.unshift({
                        name: 'orig_median',
                        label: current + ': ' + median,
                        value: stringUtils.getFormattedInteger(data.orig_median) + msPostfix
                    },
                    {
                        name: 'median',
                        label: projected + ': ' + median,
                        value: stringUtils.getFormattedInteger(data.median) + msPostfix
                    });
                }
                else
                {
                    anno.name_value_unit_obj_list.push({
                        name: 'orig_median',
                        label: current + ': ' + median,
                        value: stringUtils.getFormattedInteger(data.median) + msPostfix
                    });
                }
                
                return anno;
            }
            else
            {
                return {
                    title_obj: { value: getLocalizedHTMLString('NonInteractiveResource', 'RIS.General') },
                    x: pos.x,
                    y: pos.boundingRect.top + (pos.boundingRect.height / 2)
                }; 
            }
        }
    });
    
    
    const filterSliderAnnotation = componentFactory({ 
        'container_el': document.querySelector(ANNOTATION_CONTAINER_ID),
        'event_namespace': EVENT_FILTER_SLIDER_ANNOTATION,
        'component': annotationBubbleFactory,
        'show_timeout_period_ms': 400,
        'offset_x_rems': 1.15,
        'offset_y_rems': 1.2,
        'class_list': ['simple-bubble'],
        'function_to_format_data': ({ e } = {}) => {
            
            if( e.currentTarget.id === 'page-groups-pre-opt-slider' )
            {
                const sliderVal = $(e.currentTarget).val() * 1;
                const threshold = Math.max(chart_one_axis_x_bottom_min_value, chart_one_axis_x_bottom_max_value * (sliderVal || 0) * chart_one_Axis_x_bottom_slider_mult);
                const criteria = chartOne.impact_criteria();

                const sliderRect = e.currentTarget.getBoundingClientRect();
                const handlePos = e.currentTarget.clientWidth * (sliderVal * 0.01);

                return {
                    title_obj: {
                        name: getLocalizedHTMLString('FilterPageGroupsWithAnnotation', 'RIS.ChartOne').replace(/@~@/,criteria),
                        value: threshold.toFixed(5)
                    },
                    
                    x: sliderRect.left + handlePos,
                    y: sliderRect.top
                };
            }
            else if( e.currentTarget.id === 'asset-load-times-slider' )
            { 
                const sliderVal = $(e.currentTarget).val() * 1;
                const threshold = Math.max(0, sliderVal * chartThree.axis_x_max_value() * chart_three_Axis_x_bottom_slider_mult);

                const sliderRect = e.currentTarget.getBoundingClientRect();
                const handlePos = e.currentTarget.clientWidth * (sliderVal * 0.01);
                const msPostfix = $( getLocalizedHTMLString('MillisecondsPostfix', 'RIS.General') ).text();
                
                return {
                    title_obj: {
                        name: getLocalizedHTMLString('FilterResourcesWithAnnotation', 'RIS.ChartThree'),
                        value: stringUtils.getFormattedInteger(threshold) + msPostfix
                    },
                    
                    x: sliderRect.left + handlePos,
                    y: sliderRect.top
                };
            }
        }
    });
    
    
    // Chart One Slider Annotation
    const chartOneFilterSlider = $('#page-groups-pre-opt-slider');
    chartOneFilterSlider.on( "mouseenter", function( e ) {
        window.akdv.utils_event.dispatchCustomEvent(window, 'show-component', EVENT_FILTER_SLIDER_ANNOTATION, [ e, { e } ]);  
    });
    
    chartOneFilterSlider.on( "mouseleave", function( e ) {
        window.akdv.utils_event.dispatchCustomEvent(window, 'hide-component', EVENT_FILTER_SLIDER_ANNOTATION);  
    });
    
    
    // Chart Three Slider Annotation
    const chartThreeFilterSlider = $('#asset-load-times-slider');
    chartThreeFilterSlider.on( "mouseenter", function( e ) {
        window.akdv.utils_event.dispatchCustomEvent(window, 'show-component', EVENT_FILTER_SLIDER_ANNOTATION, [ e, { e } ]);  
    });
    
    chartThreeFilterSlider.on( "mouseleave", function( e ) {
        window.akdv.utils_event.dispatchCustomEvent(window, 'hide-component', EVENT_FILTER_SLIDER_ANNOTATION);  
    });
    
    
    /* ---------------------------------------------------------------------------- */
    
    
    const calcDPpx = function() {

        if (typeof window.devicePixelRatio !== 'undefined')
        {
            return window.devicePixelRatio.toFixed(2);
        }
        else
        {
          // fallback
          for(var i=5; i>=1; i = (i-0.05).toFixed(2)) {
            if (window.matchMedia("(-webkit-min-device-pixel-ratio: " + i + ")").matches || window.matchMedia("(min-resolution: " + i + "dppx)").matches)
            {
                return i;
            }
          }
        }
      }

    // These vars, are used in methods external to various charts, as well as being passed in as options
    let dm_orig_prefix = 'orig_';
    let dm_timingMetric = 'page_timer';
    
    let dm_whisker_min_load_time = 0; // Whiskers elements cannot drop below this value
    let dm_whisker_property = {
        P0 :    'lf',
        P25 :   'q1',
        P50 :   'q2',
        P75 :   'q3',
        P100 :  'uf',
    };

    const dm_interactable = 'interactable';                 // Property name, to control Explicitly, if an element is interactive / disabled
    let dm_cis_min = 0.15;                                  // Impact Minimum Threshold, elements with a score below this should be Disabled etc
    let dm_ris_min = 0.01;                                  // Resource-Impact Minimum Threshold, elements with a score below this should be Disabled etc
    
    let row_height = (window.akdv.utils_css.getStyleRuleValue('height', '.optimization-infographic-rows') || '2').replace('rem', '');
    let row_padding = (window.akdv.utils_css.getStyleRuleValue('padding', '.optimization-infographic-rows') || '15').replace('%', '') * 0.01;

    let box_height = (window.akdv.utils_css.getStyleRuleValue('height', '.optimization-infographic-box-plots') || '2').replace('rem', '');
    let boxplot_row_padding = (window.akdv.utils_css.getStyleRuleValue('padding', '.optimization-infographic-box-plots') || '15').replace('%', '') * 0.01;
    
    let vendorColors = new D3VendorColor();
    
    
    
    // INFOGRAPHIC FUNCTIONS : Functions for the Infograpphic, outside of charting
    const axisLabelTimingMetricUpdate = function(e, result) {
        
        const dInfo = result.data_info;
        if( $.type(dInfo) === 'object' && typeof dInfo.timing_metric === 'string' && dInfo.timing_metric.length )
        {
            let timingMetric = dInfo.timing_metric;

            // CHART ONE 
            $('#ci-vs-lt-axis-x-top .sub-label.b').text( '(' + timingMetric + ')' ); // - Top X Axis
            
            // CHART FOUR
            $('#ci-vs-projected-lt-box-difference-axis-x-top .sub-label.b').text( '(' + timingMetric + ')' ); // - Top X Axis
            
            // CHART TWO
            $('#pg-asset-lt-waterfall-axis-x-bottom .sub-label.b').text( '(' + timingMetric + ')' ); // - Bottom X Axis
            
            // CHART FIVE
            $('#post-opt-perf-breakdown-left-cell-annotation').text( '(' + timingMetric + ')' );
            
        }
    }
    $(window).on('result.column-one-ci-vs-lt', axisLabelTimingMetricUpdate);
    
    
    const updateChartsLabelCriteria = function() {
        
        /**
         * Updates Chart titles, and axis labels to indicate Criteria for analysis
         * Criteria needs to have been previously set
         */

        const chartOneCrit = chartOne.impact_criteria();
        const chartFourCrit = chartFour.impact_criteria();
        
        // CHART ONE
        if(chartOneCrit !== '')
        {
            d3.select('#ci-vs-lt-sub-heading').text( function(d) { return chartOneCrit + ' ' + addLocalizedString( this, 'MainTitle', 'RIS.ChartOne' )} );
            d3.select('#page-groups-pre-opt-slider-label').text( function(d) { return addLocalizedString( this, 'FilterPageGroupsBy', 'RIS.ChartOne' ).replace('@~@', chartOneCrit)} );
            d3.select('#ci-vs-lt-left-axis-label-container .sub-label.y').text( function(d) { return addLocalizedString( this, 'OrderedByMetric', 'RIS.General' ).replace('@~@', chartOneCrit)} );
            d3.select('#ci-vs-lt-axis-x-bottom-svg .axis-label.x').text( function(d) { return addLocalizedString( this, 'RelativeImpact', 'RIS.General' ).replace('@~@', chartOneCrit)} );
        }

        // CHART FOUR
        if(chartFourCrit !== '')
        {
            d3.select('#ci-vs-projected-lt-sub-heading').text( function(d) { return chartFourCrit + ' ' + addLocalizedString( this, 'MainTitle', 'RIS.ChartFour' )} );
            d3.select('#page-groups-asset-load-times-left-axis-label-container .sub-label.y').text( function(d) { return addLocalizedString( this, 'OrderedByMetric', 'RIS.General' ).replace('@~@', chartFourCrit)} );     
            d3.select('#ci-vs-projected-lt-box-difference-axis-x-bottom-svg .axis-label.x').text( function(d) { return addLocalizedString( this, 'RelativeImpact', 'RIS.General' ).replace('@~@', chartFourCrit)} ); 
        }  
    }
    
    const setDataCriteria = function(e, result) {
        
        /**
         * Sets the current data Criteria for dynamic labels
         * Criteria derived from impact_score in chart meta-data
         */

        if( $.type(result.data_info) === 'object' && typeof result.data_info.impact_score === 'string' && result.data_info.impact_score.length )
        {
            let criteria = window.akdv.utils_string.upperCaseFirstLetter(result.data_info.impact_score);
            chartOne.impact_criteria(criteria);
            chartFour.impact_criteria(criteria);
            
            updateChartsLabelCriteria();
        }
    }
    
    // Update CRITERIA element of chart labels, when CRITERIA is set
    $(window).on('result.column-one-ci-vs-lt', setDataCriteria);
    
    // Update CRITERIA element of chart labels, when localisation package is loaded
    $(window).on('localization-package-loaded.AKDV-Chart-RIS', (e) => { updateChartsLabelCriteria(); });
    
    
    const updateChartDataDetailsLabel = function( e, result ) {

        if( $.type(result) === 'object' && $.type(result.data_info) === 'object' )
        {
            let span_pre = (result.data_info.sessions > 1) ? '' : '<span style="display:none;visibility:hidden">';
            let span_post = (result.data_info.sessions > 1) ? '' : '</span>';
            
            const sessions = '<span class="text-highlight">' + result.data_info.sessions + '</span>';
            
            const start = span_post + '<span class="text-semi-highlight">' + new Date(result.data_info.start_datetime).toLocaleDateString(locale,{month:'short',weekday:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'numeric',second:'numeric',timeZone:tz})+ '</span>';
            const end = '<span class="text-semi-highlight">' + new Date(result.data_info.end_datetime).toLocaleDateString(locale,{month:'short',weekday:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'numeric',second:'numeric',timeZoneName:'short',timeZone:tz})+ '</span>';
            
            const subLabelTpl = window.akdv.utils_lang.getLocalizationStringLiteral('SubTitle', 'RIS.Banner');
            
            const labelText = subLabelTpl.with( sessions, start, end );
                
            if( labelText !== 'SubTitle' )
            {
                $('#optimization-infographic-data-sub-title').html( span_pre + labelText );
            }
        }        
    }
    $(window).on('result.column-one-ci-vs-lt', updateChartDataDetailsLabel);

    
    // CHART FUNCTIONS : General data prep, Optimization application etc
    const transformInitialResultData = function(e, result) {
        
        /**
         * Receives initial chart data, and applies modifications required for further functionality
         * Then passes this on to the top left chart, to initialize display of data on Infographic
         */
        
        if (!result || !result.data)
        {
            window._log.warn('transformInitialResultData() triggered without data');
            return;
        }
        
        // Store the result in its ORIGINAL format, zero changes
        resultData.original = Object.assign({}, result);

        //Set the Min Resource Impact threshold value
        const ris_min = result.data_info.ris_min || dm_ris_min;
        
        pageGroupsHaveResources = false;
        interactableResources = false;
        maxPageGroupThreshold = 0;
        
        result.data.forEach(function(pageGroup,i) {
            
            // Store the original Full Page Load Value, as we need to show a difference
            if( $.type(pageGroup[dm_orig_prefix + dm_timingMetric]) !== 'number' )
            {
                pageGroup[dm_orig_prefix + dm_timingMetric] = pageGroup[dm_timingMetric];
            }

            // Store the greatest Page Group Impact Score
            const impactScore = Math.abs(pageGroup[page_group_data_axis_x_bottom_property_name]);
            if( impactScore >= maxPageGroupThreshold)
            {
                maxPageGroupThreshold = impactScore;
            }
            
            // Flag if this Page-Group should be Selectable (does it have any Resources?)
            pageGroup.selectable = false;
            if( $.type(pageGroup.Resources) === 'array')
            {
                if( pageGroup.Resources.length > 0  )
                {
                    pageGroupsHaveResources = true;
                    pageGroup.selectable = true;
                }
            }
            else
            {
                pageGroup.Resources = [];
            }

            pageGroup.Resources.forEach(function(resource,r) {

                // Store each Resources parent Page-Groups
                resource['page group'] = pageGroup['Page Group'];
                
                // Store each Resources original Whisker values, for later reference
                resource[dm_orig_prefix + dm_whisker_property.P0] = resource[dm_whisker_property.P0];
                resource[dm_orig_prefix + dm_whisker_property.P25] = resource[dm_whisker_property.P25];
                resource[dm_orig_prefix + dm_whisker_property.P50] = resource[dm_whisker_property.P50];
                resource[dm_orig_prefix + dm_whisker_property.P75] = resource[dm_whisker_property.P75];
                resource[dm_orig_prefix + dm_whisker_property.P100] = resource[dm_whisker_property.P100];

                // Flag each resources as being interactable, either using property vs threshold, or in place property
                if( $.type(resource[dm_interactable]) === 'boolean' )
                {
                    // Set INTERACTABLE from interactable poperty
                    if(resource[dm_interactable])
                    {
                        interactableResources = true;
                        resource[dm_interactable] = true;
                    }
                    else
                    {
                        resource[dm_interactable] = false;
                    }
                }
                else
                {
                    // Set INTERACTABLE based on impact threshold
                    if(resource.impact >= ris_min)
                    {
                        interactableResources = true;
                        resource[dm_interactable] = true;
                    }
                    else
                    {
                        resource[dm_interactable] = false;
                    }
                }
                
                // Set each Resource as being CHECKED by default
                if( $.type(resource.asset_checked) !== 'boolean' )
                {
                    resource.asset_checked = true;
                }
            }); 
        });
        
        // We must use the MAX impact score, for all page-groups, to scale the Filter Slider on Chart One
        chart_one_axis_x_bottom_max_value = Math.min(maxPageGroupThreshold, chart_one_axis_x_bottom_max_value);
        
        // Store the dats, once it is prepped
        resultData.processed = Object.assign({}, result);
        
        if(!pageGroupsHaveResources)
        {
            // No Page Group resources, show a status message, to warn
            $(window).trigger('result.no-resources', {});    
        }
        else
        {
            if(pageGroupsHaveResources && !interactableResources)
            {
                // No Page Group interactable resources, show a status message, to warn
                $(window).trigger('result.no-interactable-resources', {});
            }
        }

        $(window).trigger('result.' + EVENT_NAMESPACE_FOR_FULL_DATA_UPDATE, result );
    };
    $(window).on('result.column-one-ci-vs-lt', transformInitialResultData);
    
        
    const showNoResourcesWarning = function() {
        
        /**
         * Show a STATUS message, when there are ZERO resources in any Page Groups in the current data set
         **/
        statusNotifier.setInfo({ title: getLocalizedHTMLString('NoPageGroupResources', 'RIS.Status') });
    };
    $(window).on('result.no-resources', showNoResourcesWarning);
    
    
    const showNoInteractableResourcesWarning = function() {
        
        /**
         * Show a STATUS message, when there are ZERO interactable resources in any Page Groups in the current data set
         **/
        statusNotifier.setInfo({ title: getLocalizedHTMLString('NoPageGroupInteractableResources', 'RIS.Status') });
    };
    $(window).on('result.no-interactable-resources', showNoInteractableResourcesWarning);

    
    // ============================= COLUMN 1 ================================ */
    
    
    // CHART FUNCTIONS : Impact vs Page Load - Pre Optimization
    const externalEventTriggerDataAccessorFunc = function(data, data_external_dimension_property_name, current_external_dimension_filter_value) {

        let result = {};

        data.some(function(d, i) {
            
            if (d[data_external_dimension_property_name] === current_external_dimension_filter_value)
            {
                result[dm_timingMetric] = d[dm_timingMetric];
                result[dm_orig_prefix + dm_timingMetric] = d[dm_orig_prefix + dm_timingMetric];
                result.Page_Group = d['Page Group'];
                result.Proportion = d['Proportion'];
                result.Ranked_Correlation = d['Ranked Correlation'];
                result.Relative_Conversion_Impact_Score = d['Relative Conversion Impact Score'];
                result.Requests = d['Requests'];
                
                // Put the PAGE GROUP ID, into each datum, it is used as a KEY to apply Optimizations to that Group
                d['Resources'].forEach(function(datum) {
                    
                    /**
                     * We store the Page Groups 'page group' ID, as a key on each asset, so we known where the asset data came from...
                     */
                    datum['page group'] = d['Page Group'];

                    // If a resource is INTERACTABLE, we store its original values here, so we can always refer to the original values...
                    if(datum[dm_interactable] === true && datum[dm_orig_prefix + dm_whisker_property.P0] === undefined)
                    {
                        datum[dm_orig_prefix + dm_whisker_property.P0] = datum[dm_whisker_property.P0];
                        datum[dm_orig_prefix + dm_whisker_property.P25] = datum[dm_whisker_property.P25];
                        datum[dm_orig_prefix + dm_whisker_property.P50] = datum[dm_whisker_property.P50];
                        datum[dm_orig_prefix + dm_whisker_property.P75] = datum[dm_whisker_property.P75];
                        datum[dm_orig_prefix + dm_whisker_property.P100] = datum[dm_whisker_property.P100];
                    }
                });
                
                result.data = d['Resources'];
            }
        });

        return result;
    };


    const onResourceOptimizedForTimingMetric = function(data,obj) {

        // Now that OPTIMISATION has been carried out, enabled this button, to allow all optimisations to be RESET if desired...
        $('#individual-asset-lt-chart-reset-all-modifications').removeClass('disabled');
        
        data.forEach(function(pageGroup) {
            
            let pageGroupOptimizationTotal = 0;
                            
            // Store the original Page Group Load Time
            if( $.type(pageGroup[dm_orig_prefix + dm_timingMetric]) !== 'number' )
            { 
                pageGroup[dm_orig_prefix + dm_timingMetric] = pageGroup[dm_timingMetric];
            }
            
            pageGroup.Resources.forEach(function(resource) {

                if(resource.resource === obj.key)
                {
                  // Optimization can be proportional, based on the dragged slider as a %
                  if( $.type(obj.drag_offset) === 'number' )
                  {
                      resource.drag_offset = obj.drag_offset;
                  }            
                  else if( $.type(resource.drag_offset) !== 'number' )
                  {
                      resource.drag_offset = 1;
                  }
                
                  /** Or it can be 100%, when the asset is un-checked
                   * Resources can now be disabled on a group by group basis, so we need to check for a pageGroup match, before applying the passed bool value
                   */
                  if( resource['page group'] === obj.group_key && $.type(obj.asset_checked) === 'boolean' )
                  {
                      resource.asset_checked = obj.asset_checked;
                  }
                  
                  // Store the original data values
                  if( $.type(resource[dm_orig_prefix + dm_whisker_property.P0]) !== 'number' )
                  {
                      resource[dm_orig_prefix + dm_whisker_property.P0] = resource[dm_whisker_property.P0];
                      resource[dm_orig_prefix + dm_whisker_property.P25] = resource[dm_whisker_property.P25];
                      resource[dm_orig_prefix + dm_whisker_property.P50] = resource[dm_whisker_property.P50];
                      resource[dm_orig_prefix + dm_whisker_property.P75] = resource[dm_whisker_property.P75];
                      resource[dm_orig_prefix + dm_whisker_property.P100] = resource[dm_whisker_property.P100];
                  } 
                }
            
                // Checkbox unticked (100% of asset impact should be applied), accumulate 100% of impact, and quit this iteration
                if(resource.asset_checked === false)
                {
                    // Offset the Whisker values, using the original data to work from
                    resource[dm_whisker_property.P0] = 0;
                    resource[dm_whisker_property.P25] = 0;
                    resource[dm_whisker_property.P50] = 0;
                    resource[dm_whisker_property.P75] = 0;
                    resource[dm_whisker_property.P100] = 0;
            
                    // The Resource is un-checked, apply 100% of its impact
                    const impactMs = resource[dm_orig_prefix + dm_whisker_property.P50] * resource.impact;
                    pageGroupOptimizationTotal += impactMs;
                    return;
                }
                else
                {
                    // Revert Whisker values to original, and allow slider values to apply (if set)
                    resource[dm_whisker_property.P0] = resource[dm_orig_prefix + dm_whisker_property.P0];
                    resource[dm_whisker_property.P25] = resource[dm_orig_prefix + dm_whisker_property.P25];
                    resource[dm_whisker_property.P50] = resource[dm_orig_prefix + dm_whisker_property.P50];
                    resource[dm_whisker_property.P75] = resource[dm_orig_prefix + dm_whisker_property.P75];
                    resource[dm_whisker_property.P100] = resource[dm_orig_prefix + dm_whisker_property.P100];
                } 
            
                // Apply Optimization when there is a difference between original and current median values
                if( $.type(resource.drag_offset) === 'number' && resource.drag_offset !== 1 )
                {
                    // Offset the Whisker values, using the original data to work from
                    resource[dm_whisker_property.P0] = Math.max(dm_whisker_min_load_time, resource[dm_orig_prefix + dm_whisker_property.P0] * resource.drag_offset);
                    resource[dm_whisker_property.P25] = Math.max(dm_whisker_min_load_time, resource[dm_orig_prefix + dm_whisker_property.P25] * resource.drag_offset);
                    resource[dm_whisker_property.P50] = Math.max(dm_whisker_min_load_time, resource[dm_orig_prefix + dm_whisker_property.P50] * resource.drag_offset);
                    resource[dm_whisker_property.P75] = Math.max(dm_whisker_min_load_time, resource[dm_orig_prefix + dm_whisker_property.P75] * resource.drag_offset);
                    resource[dm_whisker_property.P100] = Math.max(dm_whisker_min_load_time, resource[dm_orig_prefix + dm_whisker_property.P100] * resource.drag_offset);
                    
                    // The Resource, is checked, apply its current vs original load time * impact
                    const assetMsChange = resource[dm_orig_prefix + dm_whisker_property.P50] - resource[dm_whisker_property.P50];
                    //const assetPCChange = resource[dm_whisker_property.P50] / resource[dm_orig_prefix + dm_whisker_property.P50];

                    const impactMs = assetMsChange * resource.impact;
        
                    // Accumulate optimizations
                    pageGroupOptimizationTotal += impactMs;
                }   
            });

            // Store the projected timingMetric for each Page Group
            let projectedTimingMetric = 0;
            if( $.type(pageGroup[dm_orig_prefix + dm_timingMetric]) === 'number' && pageGroupOptimizationTotal !== 0 )
            {
                // Sum all the Optimizations for this Page Group, to show its optimized load time
                projectedTimingMetric = pageGroup[dm_orig_prefix + dm_timingMetric] - pageGroupOptimizationTotal;
            }
            else
            {
                // No Optimization, reset the Page Load value, to its original value
                projectedTimingMetric = pageGroup[dm_orig_prefix + dm_timingMetric];  
            } 
            
            pageGroup[dm_timingMetric] = projectedTimingMetric;
        });
    };
    

     const pageGroupsSelectableFunc = function(d) {
    	  
          /**  
           * Sets a Page-Group as 'selectabke' / 'non-selectable', based on if it has any Resources 
           */
    	  
          if( $.type(d.value.selectable) === 'boolean' )
          {
              return d.value.selectable;
          }
          else
          {
              return true;
          }
      };
    
      
    const drawChartOne = function() {

        /** CHART CONFIG : X Impact vs Page Load - Pre Optimization
         * Displays Page Groups, ranked by Conversion Impact, overlayed with each Groups Page Load Time
         * 
         * Chart allows user to SELECT Pag-Groups. event_namespace_for_external_filter_trigger sends an event that will update
         * --> Col1 : Resource Waterfall
         * --> Col2 : Resource Chart
         * --> Col3 : CI Post Optimization Chart
         * 
         * it also listens to page-group event changes (using event_namespace_for_external_filter_listener) to update its selected PG in the UI
         *
         **/
        
            chartOne = getD3RowChartDifferencePlot({
            
            event_namespace_chart_data_update : EVENT_NAMESPACE_FOR_FULL_DATA_UPDATE,
            event_namespace_optimization : EVENT_NAMESPACE_FOR_RESOURCE_OPTIMIZATION,                       // required to trigger optimization events
            
            event_namespace_for_external_filter_trigger : EVENT_NAMESPACE_FOR_EXTERNAL_FILTER,
            event_namespace_for_external_filter_listener : EVENT_NAMESPACE_FOR_EXTERNAL_FILTER,
            
            event_namespace_for_row_annotation_listener : EVENT_NAMESPACE_FOR_PAGE_GROUP_ANNOTATION,
            event_namespace_for_slider_annotation_listener : EVENT_FILTER_SLIDER_ANNOTATION,
            
            event_namespace_for_external_result_trigger : EVENT_NAMESPACE_FOR_PAGE_GROUP_RESOURCES_DATA,
            event_namespace_for_modified_data_trigger : EVENT_NAMESPACE_FOR_OPTIMIZED_DATA_UPDATE,
            
            data_accessor_function_for_external_result_trigger : externalEventTriggerDataAccessorFunc,
            
            
            
            bars_selectable : true,
            bars_selectableFunc : pageGroupsSelectableFunc,
            dataOptimizationFunction : onResourceOptimizedForTimingMetric,
            
            original_data_prefix : dm_orig_prefix,
            
            chart_container_id : '#ci-vs-lt-chart',
            container_id : '#ci-vs-lt',
            axis_x_top_container_id : '#ci-vs-lt-axis-x-top',
            axis_x_bottom_container_id : '#ci-vs-lt-axis-x-bottom',
            axis_y_left_container_id : '#ci-vs-lt-axis-y-left',
            axis_x_bottom_description_container_id : '#page-groups-pre-opt-bottom-axis-explanation',
            linear_scale_bottom_threshold_slider_id : '#page-groups-pre-opt-slider',
    
            row_padding_percent : row_padding,
            row_height_rems : row_height,
                    
            axis_x_top_padding_bottom_rems : 0.4,
            axis_x_top_label_text : { key: 'AxisTopLabel', namespace: 'RIS.ChartOne' },
            axis_x_top_label_sub_text_A : { key: 'MillisecondsPostfix', namespace: 'RIS.General' },
            axis_x_top_label_sub_text_B : { key: 'AxisTopSubLabel', namespace: 'RIS.General' },
            data_axis_x_top_property_a_name : (dm_orig_prefix + dm_timingMetric),
            
            axis_x_bottom_label_class: 'relative-conversion-impact-legend',
            axis_x_bottom_label_text : { key: 'AxisBottomLabel', namespace: 'RIS.ChartOne' },
            axis_x_bottom_label_vertical_offset : 0.45,
            data_axis_x_bottom_property_name : page_group_data_axis_x_bottom_property_name,
            
            axis_x_bottom_slider_enabled : true,
            axis_x_bottom_slider_initial_value : dm_cis_min,
            
            axis_x_bottom_tick_stop_percentages_array : [0, 0.5, 1],
            linear_axis_descriptive_ticks : [ null, {key:'LessImpact', namespace:'RIS.General'}, {key:'MoreImpact', namespace:'RIS.General'}],
            axis_x_bottom_slider_label : 'Conversion Impact Filter',
            
            axis_x_bottom_min_value: chart_one_axis_x_bottom_min_value,
            axis_x_bottom_max_value: chart_one_axis_x_bottom_max_value,
            axis_x_bottom_slider_mult : chart_one_Axis_x_bottom_slider_mult,
            
            axis_y_left_label_id : '#ci-vs-lt-left-axis-label-container',
            axis_y_left_height_element_id : '#ci-vs-lt-main-chart-container',
            axis_y_left_label_locale_obj : { namespace: 'RIS.ChartOne', key: 'AxisYLeftLabel' },
            axis_y_left_label_sub_locale_obj : { namespace: 'RIS.ChartOne', key: 'AxisYLeftLabelSub' },
            data_axis_y_property_name : 'Page Group',
            
            data_external_dimension_property_name : 'Page Group',
            compact_axis_url_labels : true,
            
            bar_tooltip : null
        });
    };
    
    
    
    
    
    // CHART FUNCTIONS : Page Group, Resource Load Time Waterfall
    const threshLine_CurrentLineVisibilityControl = function(d){
        
        /**
         * Controls Opacity of the Current Threshold Line
         * Fades IN / OUT the line, when Projected Page Load Time diverges from it
         */
        
        var pageLoad = d[dm_timingMetric];
        var pageLoadOrig = d[dm_orig_prefix + dm_timingMetric];
        
        if($.type(pageLoad) === 'number' && $.type(pageLoadOrig) === 'number')
        {
            const pageLoadDiffPC = Math.abs(pageLoadOrig - pageLoad) / pageLoadOrig;
            const changeSensitivity = 120; // Fade in sensitivity, 30 - 120 are good values  
            const opacity = Math.min((pageLoadDiffPC * changeSensitivity), 1);
            
            return opacity;
        }
        else
        {
            window._log.warn('THRESHOLD_LINE_OPACITY: The required properties, were not in the data, please check!');
        }   
    };
    
    
    const threshLine_CurrentTextLabel = function(d) {
        
        /**
         * Creates a Dynamic label text, for the Current Page Load threshold line
         * Shows the CURRENT Page Load Time in Milliseconds
         */
        
        const origPageLoadTime = d[dm_orig_prefix + dm_timingMetric];
        var time = 0;
        var postFix = '';
        
        if(origPageLoadTime < 1000)
        { 
            // Display as millisecondds
            time = (origPageLoadTime).toFixed(2);  
            postFix = 'ms';
        }
        else
        {
            // Display as Seconds
            time = (origPageLoadTime / 1000).toFixed(2); 
            postFix = 's';
        }
 
        if( $.type(origPageLoadTime) === 'number' )
        {
            return {
                type: 'Current',
                timeString: ' : ' + time.toLocaleString('en-US') + postFix
            }
        }
        else
        {
            return {
                type: 'Current',
                timeString: null
            }
        }   
    };
    
    const threshLine_ProjectedTextLabel = function(d) {
        
        /**
         * Creates a Dynamic label text, for the Projected Page Load threshold line
         * Shows the PROJETED Page Load Time in Milliseconds
         */
        
        var pageLoadDiff = 1;
        var pageLoadTime = d[dm_timingMetric];
        var origPageLoadTime = d[dm_orig_prefix + dm_timingMetric];
        var time = 0;
        var postFix = '';
        
        if( $.type(d[dm_orig_prefix + dm_timingMetric]) === 'number' )
        {
            pageLoadDiff = origPageLoadTime / pageLoadTime;
        }

        if(pageLoadTime < 1000)
        { 
            // Display as millisecondds
            time = (pageLoadTime).toFixed(0); 
            postFix = 'ms';
        }
        else
        { 
            // Display as Seconds
            time = (pageLoadTime / 1000).toFixed(2); 
            postFix = 's';
        }
        
        if( pageLoadDiff > 0.9999 && pageLoadDiff < 1.0001 )
        {
            return {
                type: 'Current',
                timeString: ' : ' + time.toLocaleString('en-US') + postFix
            }
            return 
        }
        else
        {
            return {
                type: 'Projected',
                timeString: ' : ' + time.toLocaleString('en-US') + postFix
            }
        }  
    };
    
    
    const constructThresholdLabel = function(d3TextNode,data) {
        
        $(d3TextNode.node()).empty(); // Clear the text nodes contents
        const values = this.time_func(data); // Get the time, and whether it is Current/Projected
        
        // Create the Current/Project label
        let lObj = this.current;
        if(values.type === 'Projected')
        {
            lObj = this.projected;
        }
        d3TextNode.append('tspan').text( function(d) { return addLocalizedString(this, lObj.key, lObj.namespace); } );
        
        // Create the Time value
        d3TextNode.append('tspan').text( values.timeString );
    }
    
    
    const resetAllResourceModifications = function(e) {
        
        /** Iterate through all assets, resetting their modifications to original_median
         *  Then trigger a re-draw of all box-whisker charts
         */
        
        // Now that RESET has been carried out, it is no longer possible, so disabled this button
        $(e.currentTarget).addClass('disabled');

        // Get the currentlt selected Page Group, for reinstating AFTER data reset
        let pageGroupSel = d3.select('#ci-vs-lt-svg .inner-chart rect.selected');
        
        // Reset the data
        resultData.processed.reset_resource_modifications = true;
        $(window).trigger('result.' + EVENT_NAMESPACE_FOR_FULL_DATA_UPDATE, resultData.processed );

        //Re-instate the Page Group selection
        if( pageGroupSel.size() )
        {
            let data = externalEventTriggerDataAccessorFunc(
                resultData.processed.data,
                'Page Group', 
                pageGroupSel.datum().key
            );

            $(window).trigger('result.' + EVENT_NAMESPACE_FOR_PAGE_GROUP_RESOURCES_DATA, data );
        }   
    }
    $('#individual-asset-lt-chart-reset-all-modifications').on('click', resetAllResourceModifications);
    
    
    
    const drawChartTwo = function() {
        
            // CHART CONFIG : Page Group, Resource Load Time Waterfall
            chartTwo = getBoxWhiskerRowPlot({
            
            chartName : 'Page Groups Load Time Waterfall',
            
            event_namespace_chart_data_update : EVENT_NAMESPACE_FOR_PAGE_GROUP_RESOURCES_DATA,
            event_namespace_auto_scroll : EVENT_NAMESPACE_FOR_AUTO_SCROLL,
            
            event_namespace_for_axis_label_annotation_listener : EVENT_NAMESPACE_FOR_RESOURCE_Y_AXIS_ANNOTATION,
            event_namespace_for_box_whisker_annotation_listener : EVENT_NAMESPACE_FOR_BOX_WHISKER_ANNOTATION,
                
            main_title_default_string : { key:'MainTitle', namespace:'RIS.ChartTwo' },
            main_title_string_template : { 
                templateString: '<span id="pgltw_maintitle_a"></span><span data-metric=true class="chart-sub-heading-metric"> @#@ </span><span id="pgltw_maintitle_b"></span>',  
                tokens: [{ id:'pgltw_maintitle_a', key:'MainTitle', namespace:'RIS.ChartTwo' }, { id:'pgltw_maintitle_b', key:'PageGroup', namespace:'RIS.General' }]
                },
            main_title_string_property : 'Page_Group',
            
            original_data_prefix : dm_orig_prefix,
    
            container_id : '#pg-asset-lt-waterfall',
            chart_container_id : '#pg-asset-lt-waterfall-chart',
            
            chart_min_height_element_selector : '#pg-asset-lt-waterfall-wrapper .scrollable-y',
            chart_min_height_rems_adjustment : 0.5,
            
            main_title_id : '#pg-asset-lt-waterfall-sub-heading',
            axis_x_bottom_container_id : '#pg-asset-lt-waterfall-axis-x-bottom',
            axis_x_min_max_container_id : '#pg-asset-lt-waterfall-axis-x-top',
            axis_x_vert_line_a_container_id : '#pg-asset-lt-waterfall-axis-x-top',
            
            axis_y_left_container_id : '#pg-asset-lt-waterfall-axis-y-left',
            axis_y_right_container_id : '#pg-asset-lt-waterfall-axis-y-right',
            
            simple_scroll_bar_enabled : true,
            auto_scroll_container_selector : '.axis-y-left-container',
            
            enforce_box_whisker_interactable: false,
            
            vendor_colors : vendorColors,
    
            axis_x_bottom_step : 1000,
            axis_x_bottom_label_text : { key: 'AxisBottomLabel', namespace: 'RIS.ChartTwo' },
            axis_x_bottom_label_sub_A_locale_obj : { key: 'MillisecondsPostfix', namespace: 'RIS.General' },
            axis_x_bottom_label_sub_B_locale_obj : { key: 'AxisBottomSubLabel', namespace: 'RIS.General' },
            axis_x_bottom_label_vertical_offset : 0.6,

            axis_x_bottom_domain_override_property : 'domreadytimer',
            axis_x_bottom_domain_override_multiplier : 1.2, 
            axis_x_bottom_domain_override_if_larger : true,
            
            axis_y_left_compact_labels : true,
            
            axis_y_left_label_id : '#pg-asset-lt-waterfall-left-axis-label-container',
            axis_y_left_height_element_id : '#pg-asset-lt-waterfall-wrapper .scrollable-y',
            axis_y_left_label_locale_obj : { namespace: 'RIS.ChartTwo', key: 'AxisYLeftLabel' },
            axis_y_left_label_sub_locale_obj : { namespace: 'RIS.ChartTwo', key: 'AxisYLeftLabelSub' },
            
            data_external_dimension_property_name : 'Page Group',
            data_group_key : 'page group',
            
            data_bottom_whisker_property_name : dm_whisker_property.P0,
            data_quartile_bottom_property_name : dm_whisker_property.P25,
            data_median_property_name : dm_whisker_property.P50,
            data_quartile_top_property_name : dm_whisker_property.P75,
            data_top_whisker_property_name : dm_whisker_property.P100,
            
            data_whisker_is_interactable : dm_interactable,
            data_axis_y_banded_scale_property_name : 'resource',
            
            data_sort_by_ranking : true,
            data_sort_by_ranking_reverse_order : true,
            data_ranking_property_name : 'p0_offset',
            data_apply_all_values_offset : true,
            data_all_values_offset_property_name : 'p0_offset',
    
            row_padding_percent : row_padding,
            box_height_rems : box_height,
            show_checkboxes : false,
            show_min_max : false,
            
            threshold_lines : [{
                group_container_id : '#pg-asset-lt-waterfall-svg g.inner-chart',
                line_height_element_selector_A : '#pg-asset-lt-waterfall-wrapper .scrollable-y',
                line_height_element_selector_B : '#pg-asset-lt-waterfall-wrapper .scrollable-y .inner-chart',
                line_position_property : (dm_orig_prefix + dm_timingMetric),
                group_css_class : 'threshold-line-group original',
                label_display : true,
                label_container_id : '#pg-asset-lt-waterfall-axis-x-top',
                label_css_class : 'threshold-label-group original',
                label_offset : 0.8,
                line_group_opacity : threshLine_CurrentLineVisibilityControl,
                label_text : {
                    func: constructThresholdLabel,
                    time_func: threshLine_CurrentTextLabel,
                    current: { key: 'Current', namespace: 'RIS.General' },
                    projected: { key: 'Projected', namespace: 'RIS.General' }
                },

            },
            { 
                group_container_id : '#pg-asset-lt-waterfall-svg g.inner-chart',
                line_height_element_selector_A : '#pg-asset-lt-waterfall-wrapper .scrollable-y',
                line_height_element_selector_B : '#pg-asset-lt-waterfall-wrapper .scrollable-y .inner-chart',
                line_position_property : dm_timingMetric,
                group_css_class : 'threshold-line-group optimized',
                label_display : true,
                label_container_id : '#pg-asset-lt-waterfall-axis-x-top',
                label_css_class : 'threshold-label-group optimized',
                label_text : { 
                    func: constructThresholdLabel,
                    time_func: threshLine_ProjectedTextLabel,
                    current: { key: 'Current', namespace: 'RIS.General' },
                    projected: { key: 'Projected', namespace: 'RIS.General' }
                },

            }],
        });
    }

    
    
    
    
    // ============================= COLUMN 2 ================================ */

    
    // CHART FUNCTIONS : Page Group, Individual Resource Load Times
    const checkboxesClickCallback = function(e) {

        if( $.type(e) === 'object' && $.type(e.checked) === 'boolean' && $.type(e.datum) === 'object' && $.type(e.datum.key) === 'string' )
        {
            var obj = {
                    'asset_checked' : e.checked, // This Optimization trigger, ommits the drag_offset value, the listener needs to handle this!
                    'key' : e.datum.key,
                    'group_key' : e.datum.value.group_key
            };

            $(window).trigger('optimization.' + window.akdv.utils_string.snakeToKebabCase(EVENT_NAMESPACE_FOR_RESOURCE_OPTIMIZATION), obj);  
        }
        else
        {
            window._log.warn("Some expected data was missing in data, please check!");
        }
    };
    
    
    const boxWhiskerSliderDoubleClickCallback = function( node, data, index, handles, boxWhisker ) {

    		/**
    		 * Resets a Box-Whisker back to its original values, when its drag handle is double-clicked
    		 */
    	
    		if (d3.event)
    		{ 
    		    d3.event.stopPropagation();
    		}
    	
        if( $.type(node) !== 'object' )
        {
            return;
        }
        
        let bWhisker = node.parentNode;
        
        var voo = $(bWhisker).hasClass('box-whisker');
        
        if( $.type(bWhisker) !== 'object' && $(bWhisker).hasClass('box-whisker') === false )
        {
            return;
        }

        let key = data.key || data;
        
        boxWhisker.reset( d3.select(node.parentNode) );
    };
    
    
    const drawChartThree = function() {
        
        /**
         * CHART CONFIG : Page Group, Individual Resource Load Times
         * Displays Page Groups, ranked by Conversion Impact, overlayed with each Groups Page Load Time, after Optimizations have been applied
         *
         **/
        
            chartThree = getBoxWhiskerRowPlot({
            
            chartName : 'Page Groups, Individual Resource Load Times',
            
            event_namespace_chart_data_update : EVENT_NAMESPACE_FOR_PAGE_GROUP_RESOURCES_DATA,
            event_namespace_optimization : EVENT_NAMESPACE_FOR_RESOURCE_OPTIMIZATION,       // required to trigger optimization events
            event_namespace_auto_scroll : EVENT_NAMESPACE_FOR_AUTO_SCROLL,
            
            event_namespace_for_axis_label_annotation_listener : EVENT_NAMESPACE_FOR_RESOURCE_Y_AXIS_ANNOTATION,
            event_namespace_for_box_whisker_annotation_listener : EVENT_NAMESPACE_FOR_BOX_WHISKER_ANNOTATION,
            event_namespace_for_slider_annotation_listener : EVENT_FILTER_SLIDER_ANNOTATION,
            
            main_title_default_string : { key:'MainTitle', namespace:'RIS.ChartThree' },
            main_title_string_template : { 
                templateString: '<span id="ialt_maintitle_a"></span><span data-metric=true class="chart-sub-heading-metric"> @#@ </span><span id="ialt_maintitle_b"></span>', 
                tokens: [{ id:'ialt_maintitle_a', key:'MainTitle', namespace:'RIS.ChartThree' }, { id:'ialt_maintitle_b', key:'PageGroup', namespace:'RIS.General' }]
                },
                
            main_title_string_property : 'Page_Group',
            
            original_data_prefix : dm_orig_prefix,
            
            container_id : '#individual-asset-lt', 
            chart_container_id : '#individual-asset-lt-chart',
            main_title_id : '#individual-asset-lt-chart-title',
            axis_x_bottom_container_id : '#individual-asset-lt-axis-x-bottom',
            axis_x_min_max_container_id : '#individual-asset-lt-axis-x-top',
            axis_y_left_container_id : '#individual-asset-lt-axis-y-left',
            axis_y_right_container_id : '#individual-asset-lt-axis-y-right',
            axis_x_bottom_slider_id : '#asset-load-times-slider',
          
            enforce_box_whisker_interactable: true,
          
            chart_min_height_element_selector : '#individual-asset-lt-wrapper .scrollable-y',
            chart_min_height_rems_adjustment : 0.5,
            
            simple_scroll_bar_enabled : true,
            auto_scroll_container_selector : '.axis-y-left-container',
            
            vendor_colors : vendorColors,
                   
            axis_x_bottom_step : 200,
            axis_x_bottom_minimum_max : 0,
            axis_x_bottom_max_step : 250,
            data_external_dimension_property_name : 'Page Group',
            axis_x_bottom_label_text : { key: 'AxisBottomLabel', namespace: 'RIS.ChartThree' },
            axis_x_bottom_label_vertical_offset : 1.0,
            axis_x_bottom_label_sub_text : 'ms',
            
            axis_y_left_compact_labels : true,
            
            axis_y_left_label_id : '#individual-asset-lt-left-axis-label-container',
            axis_y_left_height_element_id : '#individual-asset-lt-wrapper .scrollable-y',
            axis_y_left_label_locale_obj : { namespace: 'RIS.ChartThree', key: 'AxisYLeftLabel' },
            axis_y_left_label_sub_locale_obj : { namespace: 'RIS.ChartThree', key: 'AxisYLeftLabelSub' },
            data_group_key : 'page group',
            
            data_bottom_whisker_property_name : dm_whisker_property.P0,
            data_quartile_bottom_property_name : dm_whisker_property.P25,
            data_median_property_name : dm_whisker_property.P50,
            data_quartile_top_property_name : dm_whisker_property.P75,
            data_top_whisker_property_name : dm_whisker_property.P100,
            
            data_whisker_is_interactable : dm_interactable,
            data_axis_y_banded_scale_property_name : 'resource',
            
            data_sort_by_ranking : true,
            data_ranking_property_name : 'impact',
            data_all_values_offset_property_name : dm_whisker_property.P50,
    
            axis_x_bottom_slider_enabled : true,
            axis_x_bottom_slider_initial_value : dm_ris_min,
            axis_x_bottom_slider_mult : chart_three_Axis_x_bottom_slider_mult,
            
            box_whiskers_slider_bouble_click_callback : boxWhiskerSliderDoubleClickCallback,

            row_padding_percent : row_padding,
            box_height_rems : box_height,
            
            show_checkboxes : true,
            checkbox_data_property : 'asset_checked',
            checkboxesClickCallback : checkboxesClickCallback,
            checkboxes_disabled_threshold : dm_ris_min,
            
            box_whiskers_muted_property : 'asset_checked',
            box_whiskers_slider_enabled : true,
            box_whiskers_drag_enabled : true,
            box_whiskers_drag_value_min : dm_whisker_min_load_time,
            
            onDragCancelAnnotations: [EVENT_NAMESPACE_FOR_BOX_WHISKER_ANNOTATION]
        });
    }
 
    
    
    // ============================= COLUMN 3 ================================ */
    const drawChartFour = function() {
        /** 
         * CHART CONFIG : Conversion Impact vs Page Load - Post Optimization
         * Displays Page Groups, ranked by Conversion Impact, overlayed with each Groups Page Load Time, after Optimizations have been applied
         *
         **/
        
            chartFour = getD3RowChartDifferencePlot({
            
            event_namespace_chart_data_update : EVENT_NAMESPACE_FOR_FULL_DATA_UPDATE,           // To receive the INTIAL data, on page-load  
            event_namespace_for_modified_data : EVENT_NAMESPACE_FOR_OPTIMIZED_DATA_UPDATE,
            event_namespace_optimization : EVENT_NAMESPACE_FOR_RESOURCE_OPTIMIZATION,           // required to trigger optimization events
    
            event_namespace_for_row_annotation_listener : EVENT_NAMESPACE_FOR_PAGE_GROUP_ANNOTATION,

            chart_container_id : '#ci-vs-projected-lt-chart',
            container_id : '#ci-vs-projected-lt-box-difference',
            axis_x_top_container_id : '#ci-vs-projected-lt-box-difference-axis-x-top',
            axis_x_bottom_container_id : '#ci-vs-projected-lt-box-difference-axis-x-bottom',
            axis_y_left_container_id : '#ci-vs-projected-lt-box-difference-axis-y-left',
            axis_x_bottom_description_container_id : '#ci-vs-projected-lt-bottom-axis-explanation',
            linear_scale_bottom_threshold_slider_id : '#ci-vs-projected-lt-slider',
            
            axis_x_bottom_slider_enabled : false,
            row_padding_percent : row_padding,
            row_height_rems : row_height,
            axis_x_bottom_tick_stop_percentages_array : [0, 0.5, 1],
            linear_axis_descriptive_ticks : [ null, {key:'LessImpact', namespace:'RIS.General'}, {key:'MoreImpact', namespace:'RIS.General'}],
            axis_x_top_padding_bottom_rems : 0.4,
            
            axis_x_top_label_text : { key: 'AxisTopLabel', namespace: 'RIS.ChartOne' },
            axis_x_top_label_sub_text_A : { key: 'MillisecondsPostfix', namespace: 'RIS.General' },
            axis_x_top_label_sub_text_B : { key: 'AxisTopSubLabel', namespace: 'RIS.General' },

            axis_x_bottom_label_text : { key: 'AxisBottomLabel', namespace: 'RIS.ChartFour' },
            axis_x_bottom_label_vertical_offset : 0.45,
            
            data_axis_x_bottom_property_name : page_group_data_axis_x_bottom_property_name,
            
            data_axis_x_top_property_a_name : dm_orig_prefix + dm_timingMetric,
            data_axis_x_top_property_b_name : dm_timingMetric,

            axis_y_left_label_id : '#page-groups-asset-load-times-left-axis-label-container',
            axis_y_left_height_element_id : '#ci-vs-projected-lt-main-chart-container',      
            axis_y_left_label_locale_obj : { namespace: 'RIS.ChartFour', key: 'AxisYLeftLabel' },
            axis_y_left_label_sub_locale_obj : { namespace: 'RIS.ChartFour', key: 'AxisYLeftLabelSub' },
            data_axis_y_property_name : 'Page Group',
            
            bars_selectable : false,
            
            data_external_dimension_property_name : 'Page Group',
            compact_axis_url_labels : true,
            
            bar_tooltip : null
        });
    }
    
    
    
    
    
    
    const opt_sum = function(arr) {
        return arr.reduce(function (previous, current) { return previous + current; });
    }
    
    const opt_weightedMean = function(values, weights) {
        
        var count = opt_sum(weights);
        var total = 0;
        
        for (var i= 0;i<values.length;i++) {
            total += values[i] * weights[i];
        }
        
        return total/count;
    }

    const opt_weightedMedian = function(values, weights) {
    
        var midpoint = 0.5 * opt_sum(weights);
        
        var cumulativeWeight = 0;
        var belowMidpointIndex = 0;
        
        var sortedValues = [];
        var sortedWeights = [];
        
        values.map(function (value, i) {
            
            return [value, weights[i]];
            
        }).sort(function (a, b) {
            
            return a[0] - b[0];
            
        }).map(function (pair) {
        
            sortedValues.push(pair[0]);
            sortedWeights.push(pair[1]);
            
        });
        
        if (sortedWeights.some(function (value) { return value > midpoint; }))
        {  
            return sortedValues[sortedWeights.indexOf(Math.max.apply(null, sortedWeights))];
        }
        
        while (cumulativeWeight <= midpoint) {
            belowMidpointIndex++;
            cumulativeWeight += sortedWeights[belowMidpointIndex - 1];
        }
        
        cumulativeWeight -= sortedWeights[belowMidpointIndex - 1];
        
        if (cumulativeWeight - midpoint < Number.EPSILON)
        {
            const bounds = sortedValues.slice(belowMidpointIndex - 2, belowMidpointIndex);
            return opt_sum(bounds) / bounds.length;
        }
    
        return sortedValues[belowMidpointIndex - 1];
    }
    
    
    // CHART FUNCTIONS : Session Projection & Breakdown
    const transform_data_for_perfomance_breakdown = function(data) {

        const dataType = $.type(data);        
        const origFullPageLoadTimeProp = dm_orig_prefix + dm_timingMetric;
                
        if( dataType === 'object')
        {
            const pageGroups = data.data;
            const pageGroupsDataType = $.type(pageGroups);
            
            if( pageGroupsDataType === 'array')
            {
                let timeExisting = 0;
                let timeProjected = 0;
                let projectedTimeImprovementAsPercentage = 100;
                let projectedTimeImprovementAsMilliseconds = 0;
                let original_pageGroupFullLoadTimes = [];
                let projected_pageGroupFullLoadTimes = [];
                let pageGroupProportions = [];
                
                let tot = 0;
                let index = 0;
                
                pageGroups.forEach(function(pageGroup) {

                    let original_pageGroupFullLoadTime = 0;
                    let projected_pageGroupFullLoadTime = 0;
                    
                    if( pageGroup[origFullPageLoadTimeProp] !== pageGroup[dm_timingMetric] )
                    {
                        original_pageGroupFullLoadTime = pageGroup[origFullPageLoadTimeProp];
                        projected_pageGroupFullLoadTime = pageGroup[dm_timingMetric];  
                    }
                    else
                    {
                        original_pageGroupFullLoadTime = pageGroup[dm_timingMetric];
                        projected_pageGroupFullLoadTime = pageGroup[dm_timingMetric];
                    }
                    
                    tot += original_pageGroupFullLoadTime;

                    original_pageGroupFullLoadTimes.push(original_pageGroupFullLoadTime);
                    projected_pageGroupFullLoadTimes.push(projected_pageGroupFullLoadTime);
                    
                    pageGroupProportions.push(pageGroup.Proportion);
                    
                    index++;
                });
                  
                timeExisting = opt_weightedMean( original_pageGroupFullLoadTimes, pageGroupProportions );
                timeProjected = opt_weightedMean( projected_pageGroupFullLoadTimes, pageGroupProportions );
                
                projectedTimeImprovementAsPercentage = (timeProjected / timeExisting) * 100;
                projectedTimeImprovementAsMilliseconds = timeProjected - timeExisting;

                const transformedData = {
                        existing_time : timeExisting,
                        projected_optimized_time : timeProjected,
                        projected_time_improvement_as_percentage : projectedTimeImprovementAsPercentage,
                        projected_time_improvement_as_milliseconds : projectedTimeImprovementAsMilliseconds
                };

                return transformedData;
            }
            else
            {
                window._log.warn("Expected pageGroups to be an ARRAY, but '" + pageGroupsDataType + "' provided instead");
            }
        }
        else
        {
            window._log.warn("Expected data to be an OBJECT, but '" + dataType + "' provided instead");
        }
        
        return null;
    };
    
    
    const combine_data_with_cells = function( data, combinedData, cells ) {
        
        cells.forEach(function(c,i) { 
            
            var cell = $.extend( {}, c ); // Create a new Cell object, duplicating the existing cell

            let cellProperty = data[cell.property];
            
            if($.type(cellProperty) !== 'undefined')
            {
                // If a matching value was found, add it to this cell
                cell.value = data[cell.property];
            }

            // Show that a positive or negative change has happened
            if( data.projected_time_improvement_as_milliseconds > 0 )
            {
                cell.change_positive = false;
            }
            else if( data.projected_time_improvement_as_milliseconds < 0 )
            {
                cell.change_positive = true;
            }

            combinedData.push( cell ); // Return the cell with the combined properties.
        });
        
        return combinedData;
    };
    
    const perfBrkdn_cells_percent_color_scale = d3.scaleLinear().range( [
        window.akdv.utils_css.getValueOfCSSVar( window.akdv.utils_css.getStyleRuleValue('color','.ris-perfomance-very-good') ).trim(), // Very Good
        window.akdv.utils_css.getValueOfCSSVar( window.akdv.utils_css.getStyleRuleValue('color','.ris-perfomance-good') ).trim(), // Good
        window.akdv.utils_css.getValueOfCSSVar( window.akdv.utils_css.getStyleRuleValue('color','.ris-perfomance-neutral') ).trim(), // Neutral (100%)
        window.akdv.utils_css.getValueOfCSSVar( window.akdv.utils_css.getStyleRuleValue('color','.ris-perfomance-poor') ).trim(), // Poor
        window.akdv.utils_css.getValueOfCSSVar( window.akdv.utils_css.getStyleRuleValue('color','.ris-perfomance-very-poor').trim() ) // Very Poor
        ] )
    .domain(  [0, 99.999, 100, 100.001, 100.5] );
        
    const perfBrkdn_cells_milliseconds_color_scale = d3.scaleLinear().range( [
        window.akdv.utils_css.getValueOfCSSVar( window.akdv.utils_css.getStyleRuleValue('color','.ris-perfomance-very-good') ).trim(), // Good  (-1ms)
        window.akdv.utils_css.getValueOfCSSVar( window.akdv.utils_css.getStyleRuleValue('color','.ris-perfomance-neutral') ).trim(), // Neutral (0ms)
        window.akdv.utils_css.getValueOfCSSVar( window.akdv.utils_css.getStyleRuleValue('color','.ris-perfomance-very-poor') ).trim(), // Poor (+1ms)
        ] )
    .domain(  [-0.1, 0, 0.1] );
    

    // CHART CONFIG : Session Projection & Breakdown
    chartFive = getTextCellsChart({
          
        event_namespace_chart_data_update : EVENT_NAMESPACE_FOR_FULL_DATA_UPDATE,   // To receive the INTIAL data, on page-load  
        event_namespace_for_modified_data : EVENT_NAMESPACE_FOR_OPTIMIZED_DATA_UPDATE,
        
        chart_container_id : '#perf-breakdown-chart',
        container_id : '#perf-breakdown-chart',
        
        transform_incomming_data_function : transform_data_for_perfomance_breakdown,
        combine_data_with_cells_function : combine_data_with_cells,
        
        flash_cells_on_update : true,
        flash_cells_selectors : ['.bottom-right .value-group','.bottom-right .value-breakdown-group'],

        cells : [
            /** ================= PRE-OPTIMIZATION ================= */
            // pre LOAD TIME
            {
                group_selector : '#perf-breakdown-chart-text-cells .bottom-left .value-group',
                css_class : 'value',
                property : 'existing_time',
                fmt_mult: 1,
                fmt_decimal_places : 0,
                fmt_number_add_comma : true,
                text_postfix_string : 'ms',
                text_postfix_subscript : true
            },
          
            /** ================= POST-OPTIMIZATION ================= */
            // post LOAD TIME
            {
                group_selector : '#perf-breakdown-chart-text-cells .bottom-right .value-group',
                css_class : 'value',
                property : 'projected_optimized_time',
                fmt_mult: 1,
                fmt_decimal_places : 0,
                fmt_number_absolute : true,
                fmt_number_add_comma : true,
                text_postfix_string : 'ms',
                text_postfix_subscript : true
            },
            //  post LOAD TIME ~ breakdown Percent
            {
                group_selector : '#perf-breakdown-chart-text-cells .bottom-right .value-breakdown-group.percent',
                css_class : 'value breakdown',
                property : 'projected_time_improvement_as_percentage',
                color_range : perfBrkdn_cells_percent_color_scale,
                fmt_decimal_places : 2,
                fmt_number_absolute : true,
                text_postfix_string : '%',
                text_postfix_subscript : true
            },
            //  post LOAD TIME ~ breakdown Milliseconds Improvement
            {
                group_selector : '#perf-breakdown-chart-text-cells .bottom-right .value-breakdown-group.milliseconds',
                css_class : 'value breakdown',
                property : 'projected_time_improvement_as_milliseconds',
                color_range : perfBrkdn_cells_milliseconds_color_scale,
                fmt_decimal_places : 0,
                fmt_number_absolute : false,
                fmt_number_add_sign : true,
                text_prefix_string : '',
                text_postfix_string : 'ms',
                text_postfix_subscript : true
            },
        ]
    });

    
    const applyLocalization = function() {
        /**
         * Apply localized string to the UI
         */
        
        // Banner
        addLocalizedString( document.querySelector('#optimization-infographic-main-title'), 'MainTitle', 'RIS.Banner' );
        addLocalizedString( document.querySelector('#optimization-infographic-sub-sets-list-note'), 'AllTimesUTC', 'RIS.Banner' );
        addLocalizedString( document.querySelector('#view-tutorial-button'), 'ViewTutorialButton', 'RIS.Help' );
        addLocalizedString( document.querySelector('#banner-ris-explanation'), 'BannerRisExplanation', 'RIS.Help' ); 
        
        // Chart One
        addLocalizedString( document.querySelector('#ci-vs-lt-sub-heading'), 'MainTitle', 'RIS.ChartOne' );

        // Chart Two
        addLocalizedString( document.querySelector('#pg-asset-lt-waterfall-sub-heading'), 'MainTitle', 'RIS.ChartTwo' );
        const CiVHelpText = addLocalizedString( document.querySelector('#pg-asset-lt-waterfall-chart-call-to-action-overlay-text'), 'CiVsLtCallToAction', 'RIS.Help' );
        $('#pg-asset-lt-waterfall-chart-call-to-action-overlay-text').html( mkdown.renderInline(CiVHelpText) );
        
        addLocalizedString( document.querySelector('#individual-asset-lt-chart-reset-all-modifications'), 'ResetModifications', 'RIS.ChartFour' );
        
        // Chart Three
        const IALTHelp = addLocalizedString( document.querySelector('#individual-asset-lt-chart-call-to-action-overlay-text'), 'IALTCallToAction', 'RIS.Help');
        $('#individual-asset-lt-chart-call-to-action-overlay-text').html( mkdown.renderInline(IALTHelp) );
        
        addLocalizedString( document.querySelector('#asset-load-times-slider-label'), 'AssetLoadTimesSliderLabel', 'RIS.ChartThree' );
        
        // Chart Four
        addLocalizedString( document.querySelector('#ci-vs-projected-lt-sub-heading'), 'MainTitle', 'RIS.ChartFour' );
        
        // Chart Five
        addLocalizedString( document.querySelector('#post-opt-perf-breakdown-sub-heading'), 'MainTitle', 'RIS.ChartFive' );
        addLocalizedString( document.querySelector('#post-opt-perf-breakdown-left-cell-heading'), 'LeftCellHeading', 'RIS.ChartFive' );
        addLocalizedString( document.querySelector('#post-opt-perf-breakdown-right-cell-heading'), 'RightCellHeading', 'RIS.ChartFive' );
        addLocalizedString( document.querySelector('#post-opt-perf-breakdown-right-cell-annotation'), 'RightCellAnnotation', 'RIS.ChartFive' );
    };

    
    // wait until charts are initialized then init help annotations
    const infographicHelp = new window.akdv.help()
        .helpButtonSelector('button.how-to')
        .helpElementSelector('body')
        .helpDataJSONPath(`${window.akdv.config.data_uri}/resource_impact_help_annotations.json`)
        .automations([
            { type: 'classIsPresentOnNodes', selector: '#ci-vs-lt-svg .bar', className: 'selected' },
            { type: 'clickNode', selector: '#ci-vs-lt-svg .bar:nth-of-type(1)', clickType: 'd3', doWhenPreviousResultIs : false },
            { type: 'nodeInDOM', parentSelector: '#pg-asset-lt-waterfall-svg', selector: '#pg-asset-lt-waterfall-svg .box-whisker:nth-of-type(1)' },
            { type: 'nodeInDOM', parentSelector: '#individual-asset-lt-svg', selector: '#individual-asset-lt-svg .box-whisker:nth-of-type(1)'}
         ])
         .displayInSets(true);
    
    langUtils.addPackageToLoad('AKDV-Chart-RIS');

    $(window).on('init-charts.akdv', function(e) {
        applyLocalization();

        drawChartOne();
        drawChartTwo();
        drawChartThree();
        drawChartFour();
        
        infographicHelp.init();
        statusNotifier.done();
        $(window).trigger('chart-render-complete.akdv');
    });

    
}(
    window,
    window.getD3RowChartDifferencePlot,
    window.getBoxWhiskerRowPlot,
    window.getLineComparision,
    window.getTextCellsChart,
    window.d3,
    window.D3VendorColor,
    window.componentFactory,
    window.annotationBubbleFactory,
    window.markdownit,
    window.akdv.utils_event,
    window.akdv.utils_string,
    window.akdv.utils_lang,
    window.akdv.utils_lang.addLocalizedString,
    window.akdv.utils_lang.getLocalizedHTMLString,
    window.akdv.statusNotifier
));