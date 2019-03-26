;((window, document, d3, $, lang_utils, statusNotifier) => {	
	'use strict';
	var configDict = null;
	var heatmapSvgID = "heatmapsvg";

	function clearHeatmap(){
		d3.select("#" + heatmapSvgID).remove();
	}

	function drawHeatmap(){

		clearHeatmap();

		// initialize some defining parameters
		var margin			= { top: 60, right: 0, bottom: 100, left: 75 },
		width				= window.innerWidth - margin.left - margin.right,
		height				= window.innerHeight - margin.top - margin.bottom,
		yAxisMaxTicks		= configDict.yAxisMaxTicks || 25,
		xAxisMaxTicks		= configDict.xAxisMaxTicks || 25,
		rows				= configDict.rows,
		columns 			= configDict.columns,
		yAxisLabel 			= configDict.yAxisLabel || "Y Axis",
		xAxisLabel 			= configDict.xAxisLabel || "X Axis",
		legendLabel 		= configDict.legendLabel || "Legend Label";

		// create main svg
		var svg = d3.select("body")
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.attr("id", heatmapSvgID)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		///////////////////////////////////////////////////////////////////////////
		//////////////////////////// Draw Y Axis //////////////////////////////////
		///////////////////////////////////////////////////////////////////////////

		// axis to map row values to y coordinates, d3.scaleBand does the heavy lifting
		var yAxisBandScale = d3.scaleBand().domain(rows).range([0, height]);

		// draw axis on the left, don't show ticks
		var yAxis = d3.axisLeft(yAxisBandScale)
			.tickSize(0)
			.tickSizeOuter(0);

		// filter to proper number of ticks if there are too many
		if (rows.length > yAxisMaxTicks) {
			yAxis.tickValues(yAxisBandScale.domain().filter(function(d, i) { return (i % Math.ceil(rows.length / yAxisMaxTicks)) === 0; }) );
		}

		// create left axis svg and add it to the main svg
		var yAxisSvg = svg.append("g")
			.attr("class", "axis")
			.call(yAxis);

		// add yAxis label
		var yAxisLabelSvg = yAxisSvg.append("text")
			.attr("class", "axisLabel")
			.attr("text-anchor", "middle")
			.attr("transform", "translate(" + (-0.6 * margin.left) + "," + (0.5 * yAxisBandScale.range()[1]) + ")rotate(-90)")
			.text(yAxisLabel);

		///////////////////////////////////////////////////////////////////////////
		//////////////////////////// Draw X Axis //////////////////////////////////
		///////////////////////////////////////////////////////////////////////////

		// axis to map column values to x coordinates
		var xAxisBandScale = d3.scaleBand().domain(columns).range([0, width]);

		// draw xAxis, hide ticks
		var xAxis = d3.axisTop(xAxisBandScale)
			.tickSize(0)
			.tickSizeOuter(0);

		// if there are more ticks than specified, filter some out
		if (columns.length > xAxisMaxTicks) {
			xAxis.tickValues(xAxisBandScale.domain().filter(function(d, i) { return (i % Math.ceil(columns.length / xAxisMaxTicks)) === 0; }) );
		}

		// create axis svg and attach it to the main svg
		var xAxisSvg = svg.append("g")
			.attr("class", "axis")
			.call(xAxis);

		// xAxis label at top of chart
		var xAxisLabelSvg = xAxisSvg.append("text")
			.attr("class", "axisLabel")
			.attr("text-anchor", "middle")
			.attr("transform", "translate(" + (0.5 * xAxisBandScale.range()[1]) + "," + (-0.5 * margin.top) + ")")
			.text(xAxisLabel);

		///////////////////////////////////////////////////////////////////////////
		//////////////////////////// Draw Heatmap /////////////////////////////////
		///////////////////////////////////////////////////////////////////////////

		// use default colors if not provided, default is d3.schemeSpectral[11].reverse(), using d3-scale-chromatic, hardcoded here to reduce overhead
		var colors = configDict.colors ? configDict.colors : ["#5e4fa2", "#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d53e4f", "#9e0142"];

		// map from [0,1] to colors
		var colorMap = d3.scaleLinear()
			.domain(d3.range(0, 1, 1.0 / (colors.length - 1)))
			.range(colors);

		// map from [dataMin, dataMax] to [0, 1]
		var quantizeMap = d3.scaleLinear()
			.domain([configDict.minValue, configDict.maxValue])
			.range([0,1]);

		// assuming our data is coming in as a list of ['rowValue', 'columnValue', 'cardValue'], draw rectangles
		svg.selectAll(".card")
			.data(configDict.data)
			.enter()
			.append("rect")
			.attr("x", d => xAxisBandScale(d[1]))
			.attr("y", d => yAxisBandScale(d[0]))
			.attr("width", xAxisBandScale.bandwidth())
			.attr("height", yAxisBandScale.bandwidth())
			.style("fill", function(d) { return colorMap(quantizeMap(d[2])); })
			.on("mouseover", function(){
				d3.select(this).transition().duration(10).style("fill-opacity", 0.5);
			})
			.on("mouseout", function(){
				d3.select(this).transition().duration(750).style("fill-opacity", 1);
			})
			.append("svg:title").text(function(d) {
				return configDict.yAxisLabel + ": " + d[0] + "\n"
				+ configDict.xAxisLabel + ": " + d[1] + "\n"
				+ configDict.legendLabel + ": " + d[2]
			});

		///////////////////////////////////////////////////////////////////////////
		//////////////////////////// Legend & zAxis ///////////////////////////////
		///////////////////////////////////////////////////////////////////////////

		// scale for gradient, extra since the color scale is interpolated
		var countScale = d3.scaleLinear()
			.domain([configDict.minValue, configDict.maxValue])
			.range([0, width]);

		// calculate the variables for the temp gradient
		var numGradientStops = 10;
		var countRange = countScale.domain();
		countRange[2] = countRange[1] - countRange[0];

		var countPoint = [];
		for (var i = 0; i < numGradientStops; i++) {
			countPoint.push(i * countRange[2] / (numGradientStops - 1) + countRange[0]);
		}

		// create legend gradient
		svg.append("defs")
			.append("linearGradient")
			.attr("id", "legend-gradient")
			.attr("x1", "0%").attr("y1", "0%")
			.attr("x2", "100%").attr("y2", "0%")
			.selectAll("stop")
			.data(d3.range(numGradientStops))
			.enter().append("stop")
			.attr("offset", function(d,i) {
				return countScale( countPoint[i] ) / width;
			})
			.attr("stop-color", function(d,i) {
				return colorMap(quantizeMap(countPoint[i]));
			});

		// create legend svg
		var legendsvg = svg.append("g")
			.attr("class", "legendWrapper")
			.attr("transform", "translate(" + (width / 2) + "," + (yAxisBandScale.range()[1] + 40) + ")");

		// draw and color legend rectangle
		var legendWidth = Math.min(width * 0.8, 400);
		var legendHeight = 10;
		legendsvg.append("rect")
			.attr("class", "legendRect")
			.attr("x", -0.5 * legendWidth)
			.attr("y", 0)
			.attr("width", legendWidth)
			.attr("height", legendHeight)
			.style("fill", "url(#legend-gradient)");

		// add legend title
		legendsvg.append("text")
			.attr("class", "legendTitle")
			.attr("x", 0)
			.attr("y", -legendHeight)
			.style("text-anchor", "middle")
			.text(legendLabel);

		// create z scale
		var zScale = d3.scaleLinear()
			.domain([configDict.minValue, configDict.maxValue])
			.range([-legendWidth / 2, legendWidth / 2])

		// define z axis
		var zAxis = d3.axisBottom()
			.tickSize(0)
			.tickSizeOuter(0)
			.ticks(6)
			.scale(zScale);

		// add z axis to legend svg
		legendsvg.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + legendHeight + ")")
			.call(zAxis);

		///////////////////////////////////////////////////////////////////////////
		//////////////////////////// Resize ///////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////

		// call redraw only once user is done resizing
		var resizeBool;
		function resize(){
			clearTimeout(resizeBool);
			resizeBool = setTimeout(drawHeatmap(), 600);
		}
		d3.select(window).on("resize", resize);
	}
	
	
	function renderChart(event, data) {

		clearHeatmap();

		var eventdata = data || event.data;

		if (!eventdata || eventdata === true) {
			statusNotifier.noData();
			return;
		}

		configDict = eventdata;
		drawHeatmap();
		statusNotifier.done();
		$(window).trigger('chart-render-complete.akdv');
	}

	$(window).on('result.data', renderChart);

})(window, document, window.d3, window.jQuery, window.akdv.utils_lang, window.akdv.statusNotifier);