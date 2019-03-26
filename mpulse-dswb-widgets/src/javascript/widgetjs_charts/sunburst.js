'use strict';

var d3 = window.d3;

// Constants
var ELEMENT_GRAPH_TYPE = "sunburst";
var ELEMENT_ENDLABEL = "endLabel";
var ELEMENT_EXPLANATION = "explanation";
var ELEMENT_PERCENTAGE = "percentage";
var ELEMENT_TRAIL = "trail";
var ELEMENT_TOTAL1 = "total1";
var ELEMENT_TOTAL2 = "total2";
var ELEMENT_CONTAINER = "container";
var ELEMENT_SB_EXPLANATION = "sbExplanation";
var ELEMENT_SB_PERCENTAGE = "sbPercentage";
var ELEMENT_SB_TOTAL = "sbTotal";
var ELEMENT_SB_TRAIL = "sbTrail";

var ID_CONTAINER = "#" + ELEMENT_CONTAINER;
var ID_EXPLANATION = "#" + ELEMENT_EXPLANATION;
var ID_PERCENTAGE = "#" + ELEMENT_PERCENTAGE;
var ID_TOTAL1 = "#" + ELEMENT_TOTAL1;
var ID_TOTAL2 = "#" + ELEMENT_TOTAL2;
var ID_ENDLABEL = "#" + ELEMENT_ENDLABEL;
var ID_TRAIL = "#" + ELEMENT_TRAIL;

var ID_CHART = "#chart";
var ID_SEQUENCE = "#sequence";
var ID_LEGEND = "#legend";

var ATTRIBUTE_ID = "id";
var ATTRIBUTE_CLASS = "class";
var ATTRIBUTE_TRANSFORM = "transform";
var ATTRIBUTE_DY = "dy";
var ATTRIBUTE_WIDTH = "width";
var ATTRIBUTE_HEIGHT = "height";
var ATTRIBUTE_RADIUS = "r";
var ATTRIBUTE_RX = "rx";
var ATTRIBUTE_RY = "ry";
var ATTRIBUTE_X_AXIS = "x";
var ATTRIBUTE_Y_AXIS = "y";
var ATTRIBUTE_DISPLAY = "display";
var ATTRIBUTE_D = "d";
var ATTRIBUTE_FILL_RULE = "fill-rule";

// SVG specific attributes
var ATTRIBUTE_CIRCLE = "circle";
var ATTRIBUTE_SVG = "svg";
var ATTRIBUTE_GRAPH = "g";
var ATTRIBUTE_TEXT = "text";
var ATTRIBUTE_POLYGON = "polygon";
var ATTRIBUTE_RECT = "rect";
var ATTRIBUTE_PATH = "path";
var ATTRIBUTE_POINTS = "points";
var ATTRIBUTE_VIEWBOX = "viewBox";
var ATTRIBUTE_PRESERVE_ASPECT = "preserveAspectRatio";

var STYLE_VISIBILITY = "visibility";
var STYLE_VISIBILITY_HIDDEN = "hidden";
var STYLE_VISIBILITY_SHOW = "";
var STYLE_OPACITY = "opacity";
var STYLE_FILL = "fill";

var ACTION_ON_CLICK = "click";
var ACTION_ON_MOUSEOVER = "mouseover";

var SVG_TAG = "svg";
var SVG_SVG = SVG_TAG + ":" + ATTRIBUTE_SVG;
var SVG_G = SVG_TAG + ":" + ATTRIBUTE_GRAPH;
var SVG_TEXT = SVG_TAG + ":" + ATTRIBUTE_TEXT;
var SVG_POLYGON = SVG_TAG + ":" + ATTRIBUTE_POLYGON;
var SVG_RECT = SVG_TAG + ":" + ATTRIBUTE_RECT;
var SVG_CIRCLE = SVG_TAG + ":" + ATTRIBUTE_CIRCLE;
var SVG_PATH = SVG_TAG + ":" + ATTRIBUTE_PATH;

var EXPLANATION_TEXT_OF = "of ";
var EXPLANATION_TEXT_VISITS_SHORT1 = " visits";
var EXPLANATION_TEXT_VISITS_SHORT2 = "begin with...";
var EXPLANATION_TEXT_VISITS_MED1 = " visits begin with";
var EXPLANATION_TEXT_VISITS_MED2 = "this sequence of pages.";
var EXPLANATION_TEXT_VISITS_FULL = " visits begin with this sequence of pages.";

var alreadyDrawn = false;

// Mapping of step names to colors.
var colors;

// Total size of all segments; we set this later, after loading the data.
// For paths analysis, this could also be the total number of all possible
// paths, if the user choose to path that value instead.
var totalSize = 0;
var totalPercentage = 0;
var width;
var height;
var aspect;
var radius;
var translateAmtX;
var translateAmtY;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var breadcrumbDimensions = {
	w: 160, h: 28, s: 5, t: 9
};
var vis;
var explanation;
var partition;
var arc;
var sumOfData = 0;
var totalPercentageString = '0%';
var breadcrumbsX;
var breadcrumbsY;
var endLabelX;
var endLabelY;

$(window).trigger('status.akdv.show');


// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
	var path = [];
	var current = node;
	while (current.parent) {
		path.unshift(current);
		current = current.parent;
	}
	return path;
}


// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
	var points = [];
	points.push("0,0");
	points.push(breadcrumbDimensions.w + ",0");
	points.push((breadcrumbDimensions.w + breadcrumbDimensions.t) + "," + (breadcrumbDimensions.h / 2));
	points.push(breadcrumbDimensions.w + "," + breadcrumbDimensions.h);
	points.push("0," + breadcrumbDimensions.h);
	if (i > 0) {
		// Leftmost breadcrumb; don't include 6th vertex.
		points.push(breadcrumbDimensions.t + "," + (breadcrumbDimensions.h / 2));
	}
	return points.join(" ");
}


function initializeBreadcrumbTrail() {
	// Add the svg area.
	var trail = d3.select(ID_SEQUENCE).append(SVG_SVG)
		.attr(ATTRIBUTE_WIDTH, width)
		.attr(ATTRIBUTE_HEIGHT, 130)
		.attr("max-height", 130)
		.attr(ATTRIBUTE_ID, ELEMENT_TRAIL)
		.attr(ATTRIBUTE_CLASS, ELEMENT_SB_TRAIL);

	// Add the label at the end, for the percentage.
	trail.append(SVG_TEXT)
		.attr(ATTRIBUTE_ID, ELEMENT_ENDLABEL);
}


function outputCenterText(percentageString) {
	var percentageHeight = translateAmtY - 10;
	var totalHeight1 = translateAmtY + 15;
	var totalHeight2 = translateAmtY + 35;
	var totalExplanation1;
	var totalExplanation2;
	if (radius < 150) {
		percentageString = "";
		totalExplanation1 = "";
		totalExplanation2 = "";
	}
	else if (radius < 200) {
		percentageHeight = translateAmtY + 10;
		totalExplanation1 = "";
		totalExplanation2 = "";
	}
	else if (radius < 300) {
		totalExplanation1 = EXPLANATION_TEXT_OF + totalSize + EXPLANATION_TEXT_VISITS_SHORT1;
		totalExplanation2 = EXPLANATION_TEXT_VISITS_SHORT2;
	}
	else if (radius < 550) {
		totalExplanation1 = EXPLANATION_TEXT_OF + totalSize + EXPLANATION_TEXT_VISITS_MED1;
		totalExplanation2 = EXPLANATION_TEXT_VISITS_MED2;
	}
	else {
		totalExplanation1 = EXPLANATION_TEXT_OF + totalSize + EXPLANATION_TEXT_VISITS_FULL;
		totalExplanation2 = "";
	}

	d3.select(ID_PERCENTAGE)
		.attr(ATTRIBUTE_X_AXIS, translateAmtX)
		.attr(ATTRIBUTE_Y_AXIS, percentageHeight);
	d3.select(ID_TOTAL1)
		.text(totalExplanation1)
		.attr(ATTRIBUTE_X_AXIS, translateAmtX)
		.attr(ATTRIBUTE_Y_AXIS, totalHeight1);
	d3.select(ID_TOTAL2)
		.text(totalExplanation2)
		.attr(ATTRIBUTE_X_AXIS, translateAmtX)
		.attr(ATTRIBUTE_Y_AXIS, totalHeight2);

	// These values should not change again.
	if (percentageString === "100%") {
		d3.select(ID_EXPLANATION)
			.style(STYLE_VISIBILITY, STYLE_VISIBILITY_HIDDEN);
	}
	else {
		d3.select(ID_PERCENTAGE)
			.text(percentageString);
	}
}


// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString) {

	// var sequenceWidth = parseInt(d3.select(ID_TRAIL).attr("width"));
	var sequenceWidth = window.innerWidth;
	var aChild = document.getElementById("sequence").children[0].childNodes[1];
	var crumbWidth = 6;
	if (aChild) {
		crumbWidth = aChild.getBoundingClientRect().width;
	}

	var crumbsPerLine = Math.floor(sequenceWidth / crumbWidth);
	var charsPerCrumb = 18;

	// Data join; key function combines name and depth (= position in sequence).
	var g = d3.select(ID_TRAIL)
		.selectAll(ATTRIBUTE_GRAPH)
		.data(nodeArray, function(data) { return data.name + data.depth; });

	// Add breadcrumb and label for entering nodes.
	var entering = g.enter().append(SVG_G);

	entering.append(SVG_POLYGON)
		.attr(ATTRIBUTE_POINTS, breadcrumbPoints)
		.style(STYLE_FILL, function(data) { return colors[data.name]; });

	breadcrumbsX = (breadcrumbDimensions.w + breadcrumbDimensions.t) / 2;
	breadcrumbsY = breadcrumbDimensions.h / 2;
	entering.append(SVG_TEXT)
		.attr(ATTRIBUTE_X_AXIS, breadcrumbsX)
		.attr(ATTRIBUTE_Y_AXIS, breadcrumbsY)
		.attr(ATTRIBUTE_DY, "0.35em")
		.text(function(data) {
			var outputString = data.name;
			if (outputString.length > charsPerCrumb) {
				// Let the user see that this output has been truncated with
				// elipses in the output.
				outputString = outputString.substring(0, charsPerCrumb - 3) + "...";
			}
			return outputString;
		});

	// Set position for entering and updating nodes.
	g.attr(ATTRIBUTE_TRANSFORM, function(d, i) {
		return "translate(" + (i % crumbsPerLine) * (breadcrumbDimensions.w + breadcrumbDimensions.s) +
		", " + (Math.floor(i / crumbsPerLine) * (breadcrumbDimensions.h + breadcrumbDimensions.s))  + ")";
	});

	// Remove exiting nodes.
	g.exit().remove();

	var crumbsOnLine = nodeArray.length % crumbsPerLine;
	var crumbRows = Math.ceil(nodeArray.length / crumbsPerLine);
	crumbsOnLine = crumbsOnLine === 0 ? nodeArray.length / crumbRows : crumbsOnLine;

	endLabelX = (crumbsOnLine + 0.3) * (breadcrumbDimensions.w + breadcrumbDimensions.s);
	endLabelY = (breadcrumbDimensions.h + breadcrumbDimensions.s) * (crumbRows - 1) + (breadcrumbDimensions.h / 2);

	// Now move and update the percentage at the end.
	d3.select(ID_TRAIL).select(ID_ENDLABEL)
		.attr(ATTRIBUTE_X_AXIS, endLabelX)
		.attr(ATTRIBUTE_Y_AXIS, endLabelY)
		.attr(ATTRIBUTE_DY, "0.35em")
		.text(percentageString);

	// Make the breadcrumb trail visible, if it's hidden.
	d3.select(ID_TRAIL)
		.style(STYLE_VISIBILITY, STYLE_VISIBILITY_SHOW);
}


// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {
	var percentage = (100 * d.value / totalSize).toPrecision(3);
	var percentageString = percentage + "%";
	if (percentage < 0.1) {
		percentageString = "< 0.1%";
	}

	outputCenterText(percentageString);

	d3.select(ID_EXPLANATION)
		.style(STYLE_VISIBILITY, STYLE_VISIBILITY_SHOW);

	d3.select(ID_PERCENTAGE)
		.style(STYLE_VISIBILITY, STYLE_VISIBILITY_SHOW);

	d3.select(ID_TOTAL1)
		.style(STYLE_VISIBILITY, STYLE_VISIBILITY_SHOW);

	d3.select(ID_TOTAL2)
		.style(STYLE_VISIBILITY, STYLE_VISIBILITY_SHOW);

	var sequenceArray = getAncestors(d);
	updateBreadcrumbs(sequenceArray, percentageString);

	// Fade all the segments.
	d3.selectAll(ATTRIBUTE_PATH)
		.style(STYLE_OPACITY, 0.3);

	// Then highlight only those that are an ancestor of the current segment.
	vis.selectAll(ATTRIBUTE_PATH)
		.filter(function(node) {
		return (sequenceArray.indexOf(node) >= 0);
	})
		.style(STYLE_OPACITY, 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

	// Hide the breadcrumb trail
	d3.select(ID_TRAIL)
		.style(STYLE_VISIBILITY, STYLE_VISIBILITY_HIDDEN);

	// Deactivate all segments during transition.
	d3.selectAll(ATTRIBUTE_PATH).on(ACTION_ON_MOUSEOVER, null);

	// Transition each segment to full opacity and then reactivate it.
	d3.selectAll(ATTRIBUTE_PATH)
		.transition()
		.duration(1000)
		.style(STYLE_OPACITY, 1)
		.each("end", function() {
	d3.select(this).on(ACTION_ON_MOUSEOVER, mouseover);
	});

	outputCenterText(totalPercentageString);
}


function responsivefy(svg) {
	// get container + svg aspect ratio
	var container = d3.select(svg.node().parentNode),
		width = parseInt(svg.style(ATTRIBUTE_WIDTH)),
		height = parseInt(svg.style(ATTRIBUTE_HEIGHT)),
		aspect = width / height;

		// get width of container and resize svg to fit it
	function resizeSunburst() {
		var targetWidth = Math.min(parseInt(window.innerWidth * 0.95),parseInt(window.innerHeight*0.9));
		svg.attr(ATTRIBUTE_WIDTH, "90%");
		svg.attr(ATTRIBUTE_HEIGHT, "90%");
	}

	// console.log(">>>>>>>RESPONSIVEFYING>>>>>>",svg,width, height)
	if (svg[0][0].id === "sunburst"){
		// add viewBox and preserveAspectRatio properties,
		// and call resize so that svg resizes on inital page load
		svg.attr(ATTRIBUTE_VIEWBOX, "0 0 " + width + " " + height)
			.attr(ATTRIBUTE_PRESERVE_ASPECT, "xMidYMid meet")
			.call(resizeSunburst);
		// to register multiple listeners for same event type,
		// you need to add namespace, i.e., 'click.foo'
		// necessary if you call invoke this function for multiple svgs
		// api docs: https://github.com/mbostock/d3/wiki/Selections#on
		
	}

	$(window).on('resize-charts.akdv', resizeSunburst);
}


function initialize(){
	// console.log("INITIALIZE HERE ----------->>>>>", width, height)
	vis = d3.select(ID_CHART).append(SVG_SVG)
		.attr(ATTRIBUTE_ID, ELEMENT_GRAPH_TYPE)
		.attr(ATTRIBUTE_WIDTH, width)
		.attr(ATTRIBUTE_HEIGHT, height)
		.call(responsivefy)
		.append(SVG_G)
		.attr(ATTRIBUTE_ID, ELEMENT_CONTAINER)
		.attr(ATTRIBUTE_TRANSFORM, "translate("+translateAmtX+","+translateAmtY+" )");

	explanation = d3.select(ID_CHART).select(SVG_TAG).append(SVG_G)
		.attr(ATTRIBUTE_ID, ELEMENT_EXPLANATION)
		.attr(ATTRIBUTE_CLASS, ELEMENT_SB_EXPLANATION);

	partition = d3.layout.partition()
		.size([2 * Math.PI, radius * radius])
		.value(function(data) { return data.size; });

	arc = d3.svg.arc()
		.startAngle(function(data) { return data.x; })
		.endAngle(function(data) { return data.x + data.dx; })
		.innerRadius(function(data) { return Math.sqrt(data.y); })
		.outerRadius(function(data) { return Math.sqrt(data.y + data.dy); });
}


function variables(){
	// Dimensions of sunburst.
	width = window.innerWidth
		|| document.documentElement.clientWidth
		|| document.body.clientWidth;
	width = width * 0.95;
	height = window.innerHeight
		|| document.documentElement.clientHeight
		|| document.body.clientHeight;
	height = height - 150;
	aspect = width / height;
	radius = Math.min(width-250, height) / 2;
	translateAmtX = width/2;
	translateAmtY = height/2;
	initialize();
}

variables();

function setColors(data) {
	colors = data;
}

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json, sum) {
	// Basic setup of page elements.
	initializeBreadcrumbTrail();

	drawLegend();

	// Bounding circle underneath the sunburst, to make it easier to detect
	// when the mouse leaves the parent g.
	vis.append(SVG_CIRCLE)
		.attr(ATTRIBUTE_RADIUS, radius/1.4)
		.style(STYLE_OPACITY, 0);

	d3.select(ID_TRAIL).call(responsivefy);

	// The center text declarations are continued here.
	explanation.append("text")
		.attr(ATTRIBUTE_ID, ELEMENT_PERCENTAGE)
		.attr(ATTRIBUTE_CLASS, ELEMENT_SB_PERCENTAGE);
	explanation.append("text")
		.attr(ATTRIBUTE_ID, ELEMENT_TOTAL1)
		.attr(ATTRIBUTE_CLASS, ELEMENT_SB_TOTAL);
	explanation.append("text")
		.attr(ATTRIBUTE_ID, ELEMENT_TOTAL2)
		.attr(ATTRIBUTE_CLASS, ELEMENT_SB_TOTAL);

	// For efficiency, filter nodes to keep only those large enough to see.
	var nodes = partition.nodes(json)
		.filter(function(data) {
			return (data.dx > 0.005); // 0.005 radians = 0.29 degrees
		});

	var path = vis.data([json]).selectAll(ATTRIBUTE_PATH)
		.data(nodes)
		.enter().append(SVG_PATH)
		.attr(ATTRIBUTE_DISPLAY, function(data) { return data.depth ? null : "none"; })
		.attr(ATTRIBUTE_D, arc)
		.attr(ATTRIBUTE_FILL_RULE, "evenodd")
		.style(STYLE_FILL, function(data) { return colors[data.name]; })
		.style(STYLE_OPACITY, 1)
		.on(ACTION_ON_MOUSEOVER, mouseover);

	// Add the mouseleave handler to the bounding circle.
	d3.select(ID_CONTAINER).on("mouseleave", mouseleave);
	//svg.select(g).on("mouseleave", mouseleave);

	// Get total size of the tree = value of root node from partition.
	if (path.node()){
		sumOfData = path.node().__data__.value;
	}
	totalSize = sum > 0 ? sum : sumOfData;
	totalPercentage = (sumOfData === totalSize)? 100 : (sumOfData * 100.0 / totalSize).toPrecision(3);
	totalPercentageString = totalPercentage + "%";

	outputCenterText(totalPercentageString);
}


function drawLegend() {

	var items = 15;

	// Dimensions of legend item: width, height, spacing, radius of rounded rect.
	var legendDim = {
		w: 200, h: 30, s: 3, r: 3
	};

	var legend = d3.select(ID_LEGEND).append(SVG_SVG)
		.attr(ATTRIBUTE_WIDTH, (legendDim.w + legendDim.s) * 2)
		.attr(ATTRIBUTE_HEIGHT, d3.keys(colors).length * (legendDim.h + legendDim.s));


	var g = legend.selectAll(ATTRIBUTE_GRAPH)
		.data(d3.entries(colors))
		.enter().append(SVG_G)
		.attr(ATTRIBUTE_TRANSFORM, function(d, i) {
			return "translate(" + Math.floor(i / items)*(legendDim.w + legendDim.s) +
			"," + (i % items) * (legendDim.h + legendDim.s) + ")";
		});

	g.append(SVG_RECT)
		.attr(ATTRIBUTE_RX, legendDim.r)
		.attr(ATTRIBUTE_RY, legendDim.r)
		.attr(ATTRIBUTE_WIDTH, legendDim.w)
		.attr(ATTRIBUTE_HEIGHT, legendDim.h)
		.style(STYLE_FILL, function(data) {
			return data.value;
		});

	g.append(SVG_TEXT)
		.attr(ATTRIBUTE_X_AXIS, legendDim.w / 2)
		.attr(ATTRIBUTE_Y_AXIS, legendDim.h / 2)
		.attr(ATTRIBUTE_DY, "0.35em")
		.text(function(data) { return data.key; });
}

// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how
// often that sequence occurred.
function buildHierarchy(csv) {
	var root = {"name": "root", "children": []};

	for (var i = 0; i < csv.length; i++) {

		var size = +csv[i][1];
		if (isNaN(size)) {
			// This is a header row
			continue;
		}

		var sequence = csv[i][0];
		var parts = sequence.split("-");
		var currentNode = root;
		for (var j = 0; j < parts.length; j++) {
			var children = currentNode["children"];
			var nodeName = parts[j];
			var childNode;
			if (j + 1 < parts.length) {
				// Not yet at the end of the sequence; move down the tree.
				var foundChild = false;
				for (var k = 0; k < children.length; k++) {
					if (children[k]["name"] === nodeName) {
					childNode = children[k];
					foundChild = true;
					break;
					}
				}

				// If we don't already have a child node for this branch, create it.
				if (!foundChild) {
					childNode = {"name": nodeName, "children": []};
					children.push(childNode);
				}
				currentNode = childNode;
			} else {
			// Reached the end of the sequence; create a leaf node.
			childNode = {"name": nodeName, "size": size};
			children.push(childNode);
			}
		}
	}

	return root;
}


// (colors, data, total)
function renderChart(event, _data){
	if (!document.getElementsByTagName("circle")) {
		variables();
	}

	window.akdv.statusNotifier.done();
	
	var eventdata = _data || event.data;
	var colors = eventdata.colors;
	var data = eventdata.data;
	var total = -1;
	data = JSON.parse(data);
	colors = JSON.parse(colors);
	if (!data) {
		window.akdv.statusNotifier.noData();
		return;
	}
	if (alreadyDrawn) {
		document.getElementById("chart").innerHTML = "";
		document.getElementById("sequence").innerHTML = "";
		initialize();
	}
	setColors(colors);
	createVisualization(buildHierarchy(data), total);
	alreadyDrawn = true;
	var startTime = (new Date()).getTime();
	var ourInterval = setInterval(function(){
		var elementsToCheck = document.getElementsByTagName("path");
		var currentTime = (new Date()).getTime();
		var elapsedTime = currentTime - startTime;
		if (elementsToCheck.length > 0 || (elapsedTime > 60000)){
			clearInterval(ourInterval);
			window.akdv.statusNotifier.done();
			$(window).trigger('chart-render-complete.akdv');
		}
	}, 1000)
}

$(window).on('result.data', function(e, data) { renderChart({ data: data }); });