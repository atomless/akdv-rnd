/*global createStatusDiv, hideStatus, handleError, event, handleLoad, renderComplete*/

;((window, document, d3, c3, $, statusNotifier) => {

    'use strict';

    var tooltipTitles = {};
    var pointRObject = {};
    var d3ScaleDict = null;
    var allCharts = [];
    var lastD = -1;
    var rows = 1;
    var cols = 1;


    function resize() {
        for (var i = 0; i < allCharts.length; i++) {
            allCharts[i].resize({
                height: (window.innerHeight - 20) / rows
            });
        }
    }

    function addcss(css){
        var head = document.getElementsByTagName("head")[0];
        var style = document.createElement("style");
        style.setAttribute("type", "text/css");

        // IE
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        }
        else {
            style.appendChild(document.createTextNode(css));
        }
        head.appendChild(style);
    }


    // i should be 1-indexed
    function getGridPosition(rows, cols, i) {
        var row = Math.ceil(i / cols);
        var col = i - (row - 1) * cols;
        return [row,col]
    }


    function getLegendSync() {
        return {
            onmouseover: function(id) {
                try {
                    for (var i = 0; i < allCharts.length; i++) {
                        var chart = allCharts[i]
                        chart.focus(id)
                    }
                }
                catch (e) {
                    // can't focus
                }
            },
            onmouseout: function(id) {
                try {
                    for (var i = 0; i < allCharts.length; i++) {
                        var chart = allCharts[i]
                        chart.revert(id)
                    }
                }
                catch (e) {
                    // can't revert
                }
            },
            onclick: function(id) {
                try {
                    for (var i = 0; i < allCharts.length; i++) {
                        var chart = allCharts[i]
                        chart.toggle(id)
                    }
                }
                catch (e) {
                    // can't toggle
                }
            }
        }
    }

    function shortenToolTips(id, xVector) {
        
        var xTickLabel;

        // Start at 1 because index 0 contains the name of the axis, eg: 'x'
        for (var i = 1; i < xVector.length; i++) {
            
            xTickLabel = xVector[i];
            
            // Save full length string.
            if (tooltipTitles.hasOwnProperty(id)) {
                tooltipTitles[id].push(xTickLabel)
            } else {
                tooltipTitles[id] = [xTickLabel];
            }

            if (typeof xTickLabel === "string" || xTickLabel instanceof String) {

                // Truncate and add ellipsis if length is more than 40 characters
                xVector[i] = (xTickLabel.length) <= 40 ? xTickLabel :
                    xTickLabel.substr(0, 19) + "..." +
                    xTickLabel.substr(xTickLabel.length - 18, xTickLabel.length - 1);
            }
        }
    }


    function setupChartGrid(rows, cols) {

        var multichart = document.createElement("div");
        multichart.className = "allcharts";

        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {

                var chartDiv = document.createElement("div");
                chartDiv.className = "chart";
                chartDiv.id = "chart" + (row + 1) + "-" + (col + 1);

                multichart.appendChild(chartDiv);
            }
        }
        multichart.style.gridTemplateColumns = "repeat(" + cols + ", calc(100%/" + cols + "))";
        document.body.appendChild(multichart);
    }

    function formatGridData(gridData, rows, cols) {
        var gridDataObject = {};
        var i = 0; // Start with first el of gridData

        // For every element that was passed through
        for (var p = 1; p <= gridData.length; p++) {

            var pos = getGridPosition(rows, cols, p)
            var r = pos[0];
            var c = pos[1];
            var k = "(" + r + "," + c + ")";
            var d = -1; // The index of the user-specified gridPosition element, if it exists

            // Attempt to locate the index w/ the current row/col
            for (var j = 0; j < gridData.length; j++) {
                // if gridData[j].gridPosition 
                if (gridData[j].gridPosition[0] === r && gridData[j].gridPosition[1] === c) {
                    d = j;
                    break;
                }
            }

            // If gridData doesn't contain row/col specifications,
            // fill grid according to the order that the data was passed in
            if (d === -1) {
                gridDataObject[k] = gridData[i];
                i++;
            }
            // Otherwise find the user-specified row/col data
            else {
                gridDataObject[k] = gridData[d];
            }
        }
        return gridDataObject
    }


    function getDefaultObj(
        bindto,
        legend_position,
        legend_sync,
        legend_hide,
        rotated,
        axis_x_show,
        axis_y_show,
        axis_y2_show,
        title_text,
        title_position,
        axis_y_tick_format,
        axis_y2_tick_format,
        grid_x_show,
        grid_y_show,
        tooltip_sync
    ) {

        return {
            bindto: bindto,
            onmouseout: function() {
                try {
                    var chart = {}
                    for (var i = 0; i < allCharts.length; i++) {
                        chart = allCharts[i];
                        chart.tooltip.hide();
                        lastD = -1;
                    }
                }
                catch (e) {
                    // can't hide tooltip
                }
            },
            size: {
                height: window.innerHeight - 20
            },
            padding: {
                top: 20,
                right: 120
            },
            grid: {
                x: {
                    show: grid_x_show
                },
                y: {
                    show: grid_y_show
                }
            },
            data: {
                x: "x",
                columns: [],
                order: null,
                xFormat: "%Y-%m-%dT%H:%M:%S",
                selection: {
                    enabled: true
                },
                onmouseover: function(d) {
                    try {

                        if (!tooltip_sync){
                            return;
                        }

                        if (d.index === lastD) {
                            return;
                        }
                        lastD = d.index;

                        var chart = {};
                        for (var i = 0; i < allCharts.length; i++) {
                            
                            chart = allCharts[i];
                            chart.tooltip.hide();

                            if (chart.selected().length === 2) {
                                chart.unselect();
                            }

                            chart.tooltip.show({
                                data: {
                                    index: d.index
                                }
                            });
                        }
                    }
                    catch (e) {
                        // can't show tooltip
                    }
                }
            },
            axis: {
                rotated: rotated,
                x: {
                    type: "category",
                    label: {position: "outer-middle"},
                    tick: {
                        culling: {
                            max: 6
                        },
                        rotate: 30,
                        multiline: false,
                        format: "%Y-%m-%dT%H:%M:%S"
                    },
                    padding: {
                        left: 0,
                        right: 0
                    },
                    show: axis_x_show
                },
                y: {
                    label: {
                        position: "outer-middle"
                    },
                    tick: {
                        format: d3.format(axis_y_tick_format)
                    },
                    padding: {
                        bottom: 0
                    },
                    show: axis_y_show
                },
                y2: {
                    label: {
                        position: "outer-middle"
                    },
                    tick: {
                        format: d3.format(axis_y2_tick_format)
                    },
                    padding: {
                        bottom: 0
                    },
                    show: axis_y2_show
                }
            },
            tooltip: {
                contents: function(d, defaultTitleFormat, defaultValueFormat, color) {
                    var $$ = this, config = $$.config,
                        titleFormat = config.tooltip_format_title || defaultTitleFormat,
                        nameFormat = config.tooltip_format_name || function(name) { return name; },
                        valueFormat = config.tooltip_format_value || defaultValueFormat,
                        text, title, value, name, bgcolor;

                    // This provides support for the tooltip_sum_groups property. This will show the sum of the data in the group in the tooltip.
                    // groupSums becomes a dictionary indicating which data (and how) require modification of their displayed value
                    var groupSums = {};
                    if (config.tooltip_sum_groups) {
                        for (let i = 0; i < config.data_groups.length; i++){    
                            for (let j = 1; j < config.data_groups[i].length; j++) {
                                groupSums[config.data_groups[i][j]] = config.data_groups[i].slice(0, j);
                            }
                        }                    
                    }

                    for (let i = 0; i < d.length; i++) {

                        // This supports the tooltip_hide property. The user may blacklist specific data from showing in the tooltip
                        if ( (typeof config.tooltip_hide !== "undefined") && (config.tooltip_hide.includes(d[i].id)) ) {
                            continue;
                        }

                        if (!(d[i] && (d[i].value || d[i].value === 0))) { continue; }
                        if (! text) {
                            title = (titleFormat !== defaultTitleFormat) ? titleFormat(d[i].x) : tooltipTitles[bindto][d[i].index];
                            if (config.axis_x_type === "timeseries") {
                                title = config.axis_x_tick_format ? d3.time.format(config.axis_x_tick_format)(d[i].x) : d3.time.format(config.data_xFormat)(d[i].x);
                            }
                            text = "<table class='" + $$.CLASS.tooltip + "'>" + (title || title === 0 ? "<tr><th colspan='2'>" + title + "</th></tr>" : "");
                        }

                        name = nameFormat(d[i].name);
                        value = valueFormat(d[i].value, d[i].ratio, d[i].id, d[i].index);
                        bgcolor = $$.levelColor ? $$.levelColor(d[i].value) : color(d[i].id);

                        // if we are to sum groups for the tooltip value, and this data is one that needs modified
                        if ((config.tooltip_sum_groups) && (d[i].id in groupSums)){

                            // get the value of this data
                            value = d[i].value;

                            // for each data that is to be added
                            for (let j = 0; j < groupSums[d[i].id].length; j++){

                                // get and sum the values
                                value += d.find(function(x){return x.id === groupSums[d[i].id][j]}).value;
                            }

                            // format string as normal
                            value = valueFormat(value, d[i].ratio, d[i].id, d[i].index);
                        }                        

                        text += "<tr class='" + $$.CLASS.tooltipName + "-" + $$.getTargetSelectorSuffix(d[i].id) + "'>";
                        text += "<td class='name'><span style='background-color:" + bgcolor + "'></span>" + name + "</td>";
                        text += "<td class='value'>" + value + "</td>";
                        text += "</tr>";
                    }
                    return text + "</table>";
                }
            },
            legend: {
                position: legend_position,
                item: legend_sync ? getLegendSync() : {},
                hide: legend_hide
            },
            zoom: {
                enabled: false
            },
            transition: {
                duration: 600
            },
            point: {
                r: function(d) {

                    // if user didn't provide anything return C3's default of 2.5px
                    if (!pointRObject.hasOwnProperty(bindto)) {//(Object.keys(pointRObject).length === 0 || Object.keys(pointRObject[bindto]).length === 0){
                        return 2.5;
                    }
                    // if user provided a reference to a function
                    else if (typeof pointRObject[bindto] === "function") {
                        return pointRObject[bindto](d);
                    }
                    // if user provided something that is not a JSON object, assume it is a single number, return this number
                    else if (!isNaN(pointRObject[bindto])){
                        return pointRObject[bindto];
                    }
                    // if user supplied a JSON object, use its parameters to determine size of point
                    else {

                        // if d.id is "dataN" get the N-th element of pointRObject by taking the last character, parsing to a number, subtracting 1
                        var userScaleObject = pointRObject[bindto][Number(d.id[d.id.length - 1]) - 1];

                        if (d3ScaleDict === null){
                            d3ScaleDict = {};
                        }

                        if (!(d.id in d3ScaleDict)){
                            d3ScaleDict[d.id] = d3.scale.linear().domain(userScaleObject.domain).range(userScaleObject.range);
                        }
                        return d3ScaleDict[d.id](userScaleObject.data[d.index]);
                    }
                },
                select: {
                    r: 4
                }
            },
            title: {
                text: title_text,
                position: title_position,
                padding: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0//axis_y_show ? 55 : 0
                }
            }
        };
    }

    function populateChart(
        gridData,
        rows, cols,
        css,
        id
    ) {
        // 1-indexed, because our row&col positions are 1-indexed from Julia
        for (var p = 1; p <= (rows * cols); p++) {
            var pos = getGridPosition(rows, cols, p)
            var r = pos[0];
            var c = pos[1];
            id = "#chart" + r + "-" + c;
            var k = "(" + r + "," + c + ")";

            if (!gridData.hasOwnProperty(k)){
                continue;
            }

            var data         = gridData[k].data
            var dataNames    = gridData[k].dataNames
            var axisLabels   = gridData[k].axisLabels
            var vizTypes     = gridData[k].vizTypes
            var colors       = gridData[k].colors
            var groups       = gridData[k].groups
            var y2Data       = gridData[k].y2Data
            var toggle       = gridData[k].toggle
            var tooltip_sync = gridData[k].tooltip_sync
            var config       = gridData[k].config

            // Generate chart
            var chart = c3.generate(getDefaultObj(
                id,
                config.legend_position || "bottom",
                typeof config.legend_sync === "undefined" ? false : config.legend_sync,
                config.legend_hide,
                config.axis_rotated,
                typeof config.axis_x_show === "undefined" ? true : config.axis_x_show,
                typeof config.axis_y_show === "undefined" ? true : config.axis_y_show,
                typeof config.axis_y2_show === "undefined" ? (y2Data.length > 0) : config.axis_y2_show, // maybe display y2 axis
                config.title_text,
                config.title_position,
                typeof config.axis_y_tick_format === "undefined" ? "," : config.axis_y_tick_format,
                typeof config.axis_y2_tick_format === "undefined" ? "," : config.axis_y2_tick_format,
                config.grid_x_show,
                config.grid_y_show,
                typeof config.tooltip_sync === "undefined" ? true : config.tooltip_sync
            ));

            allCharts.push(chart);

            // These properties behave poorly if applied after chart generation, they've already been added to the default object, so delete them from the config
            var specialProperties = ["legend_position", "legend_sync", "legend_hide", "axis_rotated", "axis_x_show", "axis_y_show", "axis_y2_show", "title_text", "title_position", "axis_y_tick_format", "axis_y2_tick_format", "grid_x_show", "grid_y_show", "tooltip_sync"];
            for (var i = 0; i < specialProperties.length; i++){
                if (config.hasOwnProperty(specialProperties[i])){
                    delete config[specialProperties[i]];
                }
            }

            resize();

            tooltipTitles[id] = [];

            // shorten x-labels, but store full string for display in tooltip
            shortenToolTips(id, data[0]);

            // construct a dictionary of the type of visual to be displayed
            var vizTypesDict = {}
            for (i = 0; i < data.length; i++){
                vizTypesDict["data" + (i + 1)] = vizTypes[i] || "line"
            }

            // construct dictionary mapping user specified colors to data vectors
            var colorsDict = {}
            for (i = 0; i < colors.length; i++){
                colorsDict["data" + (i + 1)] = colors[i]
            }

            // insert custom user css
            if (css.length > 0) {
                addcss(css);
            }

            // handle user-supplied point_r
            if ("point_r" in config){
                // if user supplies a single number or Vector of point_r objects then we can parse as JSON
                try {
                    pointRObject[id] = JSON.parse(config.point_r);
                }
                catch (e) {
                    pointRObject[id] = parent[config.point_r];
                }
                delete config.point_r;
            }

            // set all custom configs
            for (var key in config) {
                if (config.hasOwnProperty(key)) {
                    chart.internal.config[key] = config[key]
                }
            }

            // if some data is to be displayed on a second y axis
            if (y2Data.length > 0){

                // construct a dictionary specifying which data vectors get associated with the second y axis
                var secondAxisDict = {}
                for (i = 0; i < y2Data.length; i++){
                    secondAxisDict[y2Data[i]] = "y2"
                }

                // loads the data to the chart, specifies the display type, specifies the colors, specifies the data to be bound to the 2nd y axis
                chart.load({columns: data, types: vizTypesDict, colors: colorsDict, axes: secondAxisDict})

            }
            else {

                // loads the data to the chart, specifies the display type, specifies the colors
                chart.load({columns: data, types: vizTypesDict, colors: colorsDict})
            }

            // adds groups of data vectors
            chart.groups(groups)

            // sets the axis labels
            chart.axis.labels({
                x: axisLabels[0],
                y: axisLabels[1],
                y2: axisLabels[2] || "Y2"
            });

            // toggle specific data
            chart.toggle(toggle);

            // sets the names of the data
            if (dataNames.length > 0){
                var namesDict = {}
                for (i = 0; i < dataNames.length; i++){
                    namesDict["data" + (i + 1)] = dataNames[i]
                }
                chart.data.names(namesDict)
            }
        }

        return allCharts
    }


    function runner(
        gridData,
        gridDimensions,
        css,
        id
    ) {
        $(window).trigger('chart-render-start.akdv');
        window.isRendered = false;

        if (gridDimensions && gridDimensions.hasOwnProperty("rows") && gridDimensions.hasOwnProperty("cols")) {
            // Pull out grid dimensions
            rows = gridDimensions.rows;
            cols = gridDimensions.cols;
        }
        else {
            rows = 1;
            cols = 1;
        }
        
        // Create CSS Grid element
        setupChartGrid(rows, cols);

        // Format the gridData so it is easier to work with
        gridData = formatGridData(gridData, rows, cols);

        // Draw all charts and save chart variable for future use
        allCharts = populateChart(gridData,
                                  rows, cols,
                                  css,
                                  id);

        // responsible for notifying the parent when the chart is rendered
        var startTime = (new Date()).getTime();
        var ourInterval = setInterval(function(){
            var elementsToCheck = document.getElementsByClassName(" c3-bars c3-bars-data1")
            var currentTime = (new Date()).getTime();
            var elapsedTime = currentTime - startTime;
            if (elementsToCheck.length > 0 || (elapsedTime > 15000)){
                window.isRendered = true;
                clearInterval(ourInterval);
                statusNotifier.done();
                $(window).trigger('chart-render-complete.akdv');
            }
        }, 1000)
    }

    function streamC3Viz(chartUpdate) {

        // remove unrecognized fields
        delete chartUpdate.stream;

        for (var i = 0; i < chartUpdate.data.length; i++) {

            var chartDiv = null;

            // if user specified the id of the chart data, use that
            // otherwise stream to charts based on order the data was passed in
            if (chartUpdate.data[i].hasOwnProperty("id")) {
                chartDiv = window.document.getElementById(chartUpdate.data[i].id);
                delete chartUpdate.data[i].id;
            }
            else {
                var j = i + 1; // 1-indexed version of "i"

                // find the next grid position
                var pos = getGridPosition(rows, cols, j)
                var r = pos[0];
                var c = pos[1];
                chartDiv = window.document.getElementById("chart" + r + "-" + c);
            }

            if (chartUpdate.data[i].hasOwnProperty("columns")) {
                shortenToolTips(chartDiv, chartUpdate.data[i].columns[0]);
            }

            var chart = allCharts.find(function(x) {
                return x.element === chartDiv;
            });

            // pass along to c3 flow API
            chart.flow(chartUpdate.data[i]);
        }
    }

    function updateC3Viz(chartUpdate) {

        if (chartUpdate &&
            chartUpdate.hasOwnProperty("update")) {
            delete chartUpdate.update;
        }
        else {
            return;
        }

        for (var i = 0; i < chartUpdate.data.length; i++) {

            var chartDiv = null;

            // if user specified the id of the chart data, use that
            // otherwise update charts based on order the data was passed in
            if (chartUpdate.data[i].hasOwnProperty("id")) {
                chartDiv = window.document.getElementById(chartUpdate.data[i].id);
                delete chartUpdate.data[i].id;
            }
            else {
                var j = i + 1; // 1-indexed version of "i"

                // find the next grid position
                var pos = getGridPosition(rows, cols, j)
                var r = pos[0];
                var c = pos[1];
                chartDiv = window.document.getElementById("chart" + r + "-" + c);
            }

            if (chartUpdate.data[i].hasOwnProperty("columns")) {
                shortenToolTips(chartDiv, chartUpdate.data[i].columns[0]);
            }

            var chart = allCharts.find(function(x) {
                return x.element === chartDiv;
            });

            if (chart) {
                chart.load(chartUpdate.data[i]);
            }
        }
    }


    function messageHandler(event, _data) {

        if (event.origin !== window.location.protocol + "//" + window.location.host) {
            return;
        }

        statusNotifier.done();

        var data = _data || event.data;

        if (!data || typeof data !== "object") {
            return;
        }

        if (data.hasOwnProperty("update")) {
            updateC3Viz(data);
        }
        else if (data.hasOwnProperty("stream")) {
            streamC3Viz(data);
        }
        else {
            runner(
                data.gridData,
                data.gridDimensions,
                data.css,
                data.id
            );
        }
    }

    function resultHandler(event, data) {
        event.origin = window.location.protocol + "//" + window.location.host;
        for (var i = 0; i < allCharts.length; i++) {
            allCharts[i].unload();
        }
        messageHandler(event, data);
    }


    $(window).on('resize-charts.akdv', resize);
    $(window).on('result.data', resultHandler);
    $(window).on('message', messageHandler);
})(window, document, window.d3, window.c3, window.jQuery, window.akdv.statusNotifier);