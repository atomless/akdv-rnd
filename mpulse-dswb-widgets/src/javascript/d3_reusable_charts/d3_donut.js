;(function(window, document, $, d3, crossfilter) {

    'use strict';
    
    window.d3DonutChart = function(container_id) {
    	
    	// Define Chart options
        var className,
        	width,
            height,
            radius,
        	innerRadius = 0.6,
        	outerRadius = 0.9,
            margin = {
        		top: 10,
        		bottom: 10,
        		right: 10,
        		left: 10
        	},
            colourScheme = d3.scaleOrdinal(d3.schemeCategory20c), // colour scheme
            variable, // value in data that will dictate proportions on chart
            category, // compare data by
            padAngle, // effectively dictates the gap between slices
            floatFormat = d3.format('.4r'),
            cornerRadius, // sets how rounded the corners are on each slice
            percentFormat = d3.format(',.2%'), // If provided, is set on parent SVG element
            showToolTips = false, // Show we show tooltips on hover over a donut slice
            toolTipHTML = null; // Tool-Tip HTML generator, replace this function, with your own custom formatter
        
        
        /** ============ Draw the Donut Chart ============= */
        var chart = function(selection) {
        	
        	// Remove chart, if it already exists
			if (selection.select('svg').size()) {
				selection.select('svg').remove();
			}
        	
            selection.each(function(data) {

        		var cWidth = width - margin.left - margin.right;
        		var cHeight = height - margin.top - margin.bottom;
        		var cMin = Math.min( cWidth, cHeight);
        		radius = cMin / 2;
                
                // creates a new pie generator
                var pie = d3.pie()
                    .value(function(d) { return floatFormat(d[variable]); })
                    .sort(null);

                var arc = d3.arc()
                    .outerRadius(radius * outerRadius)
                    .innerRadius(radius * innerRadius)
                    .cornerRadius(cornerRadius)
                    .padAngle(padAngle);

                // this arc is used for aligning the text labels
                var textLabelArc = d3.arc()
                    .outerRadius(radius * outerRadius)
                    .innerRadius(radius * outerRadius);

                
                
                /** =========== Tooltip HTML Generator =============== */
                var toolTipHTML = function(data) {

                    var tip = '', i   = 0, key, value;

                    for (key in data.data) {

                        // if value is a number, format it as a percentage
                        value = (!isNaN(parseFloat(data.data[key]))) ? percentFormat(data.data[key]) : data.data[key];

                        // leave off 'dy' attr for first tspan so the 'dy' attr on text element works. The 'dy' attr on
                        // tspan effectively imitates a line break.
                        if (i === 0) { 
                            tip += '<tspan x="0">' + key + ': ' + value + '</tspan>';
                        } else {
                            tip += '<tspan x="0" dy="1.2em">' + key + ': ' + value + '</tspan>';
                        }
                        i++;
                    }

                    return tip;
                };
                
                
                // calculates the angle for the middle of a slice
                var midAngle = function(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; };

                // append the svg object to the selection
                var svg = selection.append('svg')
                	.attr('viewBox', '0 0 ' + width + ' ' + height +'');
                	
                var svg_group = svg.append('g')
                    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

                // Give the chart SVG a class, if one is specified
                if( className ) {
                	svg.attr('class',className);
                }
                
                // g elements to keep elements within svg modular
                svg_group.append('g').attr('class', 'slices');
                svg_group.append('g').attr('class', 'labels');
                svg_group.append('g').attr('class', 'lines');

                
                // Add and Colour the Donut slices
                var path = svg_group.select('.slices').datum(data).selectAll('path').data(pie)
                .enter()
                .append('path')
                .attr('fill', function(d) { 
                	return colourScheme(d.data[category]);
                })
                .attr('d', arc);

                

                /** ========= Add Text Label Groups + Labels + Percents ========= */
                svg_group.select('.labels').selectAll('.label-group').remove();
                var labelGroups = svg_group.select('.labels').selectAll('.label-group').data(pie);
                
                labelGroups
                    .enter()
                    .append('g')
                    .attr('class','label-group')
                    .attr('transform', function(d) {
                        // effectively computes the centre of the slice. See https://github.com/d3/d3-shape/blob/master/README.md#arc_centroid
                        var pos = textLabelArc.centroid(d);
                        
                        // changes the point to be on left or right depending on where label is.
                        pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                        return 'translate(' + pos + ')';
                    });

                // Add Labels
                svg_group.select('.labels').selectAll('.label-group')
                    .append('text')
                    .attr('class','labelName')
                    .attr('dx', function(d){
                        // If shown on left, shift to left, to give space between this and label line, if right, shift right
                        return (midAngle(d)) < Math.PI ? '.2rem' : '-.2rem'
                    })
                    .attr('dy', '-.1rem')
                    .html(function(d) {
                        return '' + d.data[category] ;
                    })
                    .style('text-anchor', function(d) {
                        // if slice centre is on the left, anchor text to start, otherwise anchor to end
                        return (midAngle(d)) < Math.PI ? 'start' : 'end';
                    });
                  
                 // Add Percents
                svg_group.select('.labels').selectAll('.label-group')
                    .append('text')
                    .attr('class','labelPercent')
                    .attr('dx', function(d){
                        // If shown on left, shift to left, to give space between this and label line, if right, shift right
                        return (midAngle(d)) < Math.PI ? '.2rem' : '-.2rem'
                    })
                    .attr('dy', '0.55rem')
                    .html(function(d) {
                        return '' + percentFormat(d.data[variable]) ;
                    })
                    .style('text-anchor', function(d) {
                        // if slice centre is on the left, anchor text to start, otherwise anchor to end
                        return (midAngle(d)) < Math.PI ? 'start' : 'end';
                    });
                /** ---------------------------------------- */
                
                
                
                /** ===== Add lines connecting labels to slice. A polyline creates straight lines connecting several points ===== */
                var polyline = svg_group.select('.lines').selectAll('polyline').data(pie)
                    .enter().append('polyline')
                    .attr('points', function(d) {
                        // see label transform function for explanations of these three lines.
                        var pos = textLabelArc.centroid(d);
                        pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                        
                        // Draws a line from the center of each segment, to its edge, and to its label
                        //return [arc.centroid(d), textLabelArc.centroid(d), pos];
                        
                        // Draws a line from the edge of each segment, to its label
                        return [textLabelArc.centroid(d), pos];
                    });
                
                
                
                /** ===== function that creates and adds the tool tip to a selected element ===== */
                var toolTip = function(selection) {
                    
                    if( showToolTips ) {
                        // add tooltip (svg circle element) when mouse enters label or slice
                        selection.on('mouseenter', function (data) {
    
                            svg_group.append('text')
                                .attr('class', 'toolCircle')
                                .attr('dy', -15) // hard-coded. can adjust this to adjust text vertical alignment in tooltip
                                .html(toolTipHTML(data)) // add text to the circle.
                                .style('font-size', '.9em')
                                .style('text-anchor', 'middle'); // centres text in tooltip
    
                            svg_group.append('circle')
                                .attr('class', 'toolCircle')
                                .attr('r', radius * 0.55) // radius of tooltip circle
                                .style('fill', colourScheme(data.data[category])) // colour based on category mouse is over
                                .style('fill-opacity', 0.35);
    
                        });
    
                        // remove the tooltip when mouse leaves the slice/label
                        selection.on('mouseout', function () {
                            d3.selectAll('.toolCircle').remove();
                        });
                        
                    }
                };
                
                // add tooltip to mouse events on slices and labels
                d3.selectAll('.labels text, .slices path').call(toolTip);

            });
        }

        
        
        /** ===========  Getter and Setter functions ============ */
        chart.className = function(value) {
            if (!arguments.length) { return width; }
            className = value;
            return chart;
        };
        
        chart.width = function(value) {
            if (!arguments.length) { return width; }
            width = value;
            return chart;
        };

        chart.height = function(value) {
            if (!arguments.length) { return height; }
            height = value;
            return chart;
        };

        chart.margin = function(value) {
            if (!arguments.length) { return margin; }
            margin = value;
            return chart;
        };

        chart.radius = function(value) {
            if (!arguments.length) { return radius; }
            radius = value;
            return chart;
        };

        chart.padAngle = function(value) {
            if (!arguments.length) { return padAngle; }
            padAngle = value;
            return chart;
        };

        chart.cornerRadius = function(value) {
            if (!arguments.length) { return cornerRadius; }
            cornerRadius = value;
            return chart;
        };

        chart.colourScheme = function(value) {
            if (!arguments.length) { return colourScheme; }
            colourScheme = value;
            return chart;
        };

        chart.variable = function(value) {
            if (!arguments.length) { return variable; }
            variable = value;
            return chart;
        };

        chart.category = function(value) {
            if (!arguments.length) { return category; }
            category = value;
            return chart;
        };
        
        chart.innerRadius = function(value) {
            if (!arguments.length) { return category; }
            innerRadius = value;
            return chart;
        };
        
        chart.outerRadius = function(value) {
            if (!arguments.length) { return category; }
            outerRadius = value;
            return chart;
        };
        
        chart.showToolTips = function(value) {
            if (!arguments.length) { return showToolTips; }
            showToolTips = value;
            return chart;
        };
        
        chart.toolTipHTML = function(value) {
            if (!arguments.length) { return toolTipHTML; }
            toolTipHTML = value;
            return chart;
        };
        
        
        
        
        return chart;
    }

}(window, document, window.jQuery, window.d3, window.crossfilter));