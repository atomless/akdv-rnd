;((window, document, $, d3, crossfilter, css_utils, color_utils, string_utils, hierarchy_utils) => {

    'use strict';

    window.getCirclePackingPlot = ({
        // This string, must match a 'chart_group' in the JSON result data
        event_namespace_chart_data_update = window.required(),
        event_namespace_for_data_hierarchy_update = 'data-hierarchy',
        external_filters_enabled = true,
        container_el = window.required(),
        
        data_provider = window.required('crossfilter instance'),
        // dimension on which external filter events can be applied
        data_circle_size_dimension_property_name = false,
        // IMPORTANT this must NOT include the end node property name
        data_hierarchy_array = [],
        data_hierarchy_end_node_dimension_property_name = false,
        data_annotation_breadcrumb_depths_to_ommit_array  = [],
        // if not set this will default to the last value in the data_hierarchy_array
        data_leaf_color_dimension_property_name = false,
        leaf_node_fill_d3_color_scale = false,
        depth_color_range_array = false, // eg  = ['hsl(192, 56%, 28%)', 'hsl(192, 84%, 16%)'],

        meta = {},
        max_depth = 0,
        margin_rems = 1,
        margin_bottom_rems = 0,
        padding_rems = 0.5,
        base_font_size_rems = 1,
        max_font_size_rems = 2,
        zoom_transition_duration_ms = 750,
        data_circle_size_dimension_value_label_threshold = 20000,
        function_for_annotation_title_from_end_node_data = function(){}
    } = {}) => {

        let hierarchical_data, end_node_property_name, root_node, current_root_node, current_view, d3_annotation_for_circle, diameter, margin, margin_bottom, padding;

        data_hierarchy_array = [...data_hierarchy_array]; // use a shallow copy not ref to original
        const depth_d3_color_scale = d3.scaleLinear();
        const chart_svg = d3.select(container_el);
        const chart_svg_g = chart_svg.append('g').attr('class', 'inner-chart');
        const d3_pack = d3.pack();


        // const updateEndNodePropertyName = (hierarchy_array) => {
        //     end_node_property_name = data_hierarchy_end_node_dimension_property_name 
        //         || data_hierarchy_array[(hierarchy_array.length > 1)? 'splice' : 'slice'](-1).pop();
        // };


        const updateEndNodePropertyName = () => {
            end_node_property_name = data_hierarchy_end_node_dimension_property_name || data_hierarchy_array.slice(-1).pop();
        };

        // if (!data_leaf_color_dimension_property_name) {
        //     data_leaf_color_dimension_property_name = data_hierarchy_array.slice(-1).pop();
        // }


        const updateDepthColorRange = () => {

            depth_d3_color_scale
                .domain([-1, data_hierarchy_array.length])
                .range(depth_color_range_array || color_utils.getColorRangeArrayStartingFromBgColor())
                .interpolate(d3.interpolateHcl);

            chart_svg.style('background', depth_d3_color_scale(-1));
        };


        const setHierarchicalData = () => {

            let data_array = [...data_provider.allFiltered()]; // clone

            updateEndNodePropertyName();

            hierarchical_data = hierarchy_utils.getAsHierarchicalData(data_array, end_node_property_name, ...data_hierarchy_array);
            hierarchical_data = hierarchy_utils.setUUIDForAllNodesInHierarchicalObject(hierarchical_data);
        };


        const setD3HierarchyRootNode = () => {
            root_node = d3.hierarchy(hierarchical_data)
                .sum((d) => d[data_circle_size_dimension_property_name])
                .sort((a, b) => b.value - a.value);
        };


        // const updateAnnotations = () => {

        //     chart_svg_g.selectAll('.circle-annotation').remove();

        //     d3_annotation_for_circle = d3.annotation()
        //         .annotations([{
        //             type: d3.annotationCalloutElbow,
        //             note: { padding: 30 }
        //         }]);

        //     chart_svg_g.append('g').attr('class', 'circle-annotation invisible')
        //         .call(d3_annotation_for_circle);
        // };


        const zoomTo = (v) => {

            var k = diameter / v[2]; 
            current_view = v;

            chart_svg_g.selectAll('circle:not(.exiting), text')
                .filter(function(d) {
                    return d.x && d.y && d.r && k;
                })
                .attr('transform', function(d) { return 'translate(' + (d.x - v[0]) * k + ',' + (d.y - v[1]) * k + ')'; })
                .attr('r', function(d) { return d.r * k; });
        };


        const zoom = (d) => {

            current_root_node = d;
            let transition = d3.transition()
                .duration(zoom_transition_duration_ms)
                .tween('zoom', (d) => {
                    let i = d3.interpolateZoom(current_view, [current_root_node.x, current_root_node.y, current_root_node.r * 2 + margin]);
                    return (t) => { zoomTo(i(t)); };
                });

            // show or hide text according to zoom level
            transition.selectAll('text')
                .filter((d) => (d.parent === current_root_node 
                    || (current_root_node.depth <= max_depth && d === current_root_node)
                    || this.style && this.style.display === 'inline'))
                .style('opacity', (d) => (d.parent === current_root_node 
                    || (d.depth === max_depth && d === current_root_node)) 
                        ? 1 
                        : 0)
                .on('start', (d) => {
                    if ((d.parent === current_root_node || d === current_root_node)
                    && ((d.value > data_circle_size_dimension_value_label_threshold
                    && current_root_node.depth !== (max_depth - 1)))
                    || (current_root_node.depth === max_depth)) {
                        this.style.display = 'inline'; 
                    } else {
                        this.style.display = 'none';
                    }
                })
                .on('end', (d) => { 
                    if ((d.parent !== current_root_node 
                    && d !== current_root_node)
                    || (d.value < data_circle_size_dimension_value_label_threshold
                    && current_root_node.depth !== max_depth)) {
                        this.style.display = 'none'; 
                    }
                });

            // updateAnnotations();
        };


        const clearZoom = () => {
            zoom(root_node);
        }


        // const onCircleMouseOut = (e) => {
        //     chart_svg_g.selectAll('.over').classed('over', false);
        //     chart_svg_g.selectAll('.circle-annotation').classed('invisible', true);
        // };


        // const onCircleMouseOver = (e) => {

        //     let el = d3.select(e.currentTarget);
        //     let d = el.datum();
        //     let depth = (typeof d.depth !== 'undefined')? d.depth : max_depth;
        //     let left_or_right = (e.offsetX < chart_width * 0.5)? 'left' : 'right';
        //     let r = Math.round(el.attr('r'));
        //     let trns = css_utils.getTransformationObjectFromTransformAttributeString(el.attr('transform'));
        //     let hierarchy_array = [...data_hierarchy_array, end_node_property_name];
        //     let label = (depth === hierarchy_array.length || !d.children)
        //         ? hierarchy_utils.getBreadCrumbTextFromHierarchicalData(d, '', data_annotation_breadcrumb_depths_to_ommit_array)
        //         : d.data.name;
        //     let title = (depth === hierarchy_array.length)
        //         ? function_for_annotation_title_from_end_node_data(d.data || d) 
        //         : 'Grouped By ' + string_utils.upperCaseFirstLetter(hierarchy_array[depth-1]);

        //     d3_annotation_for_circle.annotations().forEach((annot, i) => {
                
        //         annot.x = trns.translate_x; 
        //         annot.y = trns.translate_y - r;
        //         annot.dx = 0;
        //         annot.dy = css_utils.remsToPixels(0.25);
        //         annot.note = {
        //             title : string_utils.upperCaseFirstLetter(title),
        //             label : label.toUpperCase(),
        //             wrap : chart_width * 0.485,
        //             padding : css_utils.remsToPixels(5),
        //             orientation : 'leftRight',
        //             align : 'center'
        //         };
        //     });

        //     d3.select('.circle-annotation').attr('data-orientation-x', left_or_right);
        //     d3_annotation_for_circle.updateText();
        //     d3_annotation_for_circle.update();

        //     let t = css_utils.getTransformationObjectFromTransformAttributeString(chart_svg_g.select('.circle-annotation').select('.annotation-note-content').attr('transform'));

        //     chart_svg_g
        //         .select('.circle-annotation').classed('invisible', false)
        //         .selectAll('.annotation-note-content').attr('transform', null)
        //         .selectAll('.annotation-note-label, .annotation-note-title').attr('transform', null);
        // };


        const onCircleClick = (e) => {

            e.stopPropagation();

            let d = d3.select(e.currentTarget).datum();

            if (current_root_node !== d) {
                zoom(d);
            }
        };

        
        const drawChart = () => {
  
            if (!data_provider.size()) {
                window._log.warn('drawChart requires data.');
                return;
            }

            updateDepthColorRange();
            setD3HierarchyRootNode(hierarchical_data);

            current_root_node = root_node;

            let pack_nodes = d3_pack(root_node).descendants();
            let circles = chart_svg_g.selectAll('circle').data(pack_nodes, (d) => d.uuid);
            circles.exit()
                .classed('exiting', true)
                .transition().duration(200)
                .attr('opacity', 0)
                .attr('r', 0)
                .remove();

            let new_circles = circles.enter().append('circle');
            new_circles
                .attr('class', (d) => (d.parent)? ((d.children)? 'node' : 'node node-leaf') : 'node node-root')
                .attr(`data-${string_utils.snakeToKebabCase(data_leaf_color_dimension_property_name)}`, (d) => 
                    d.data[data_leaf_color_dimension_property_name])
                .style('fill', (d, i) => (d.children || !leaf_node_fill_d3_color_scale)
                    ? depth_d3_color_scale(d.depth)
                    : leaf_node_fill_d3_color_scale(d.data[data_leaf_color_dimension_property_name]));

            let text = chart_svg_g.selectAll('text').data(pack_nodes, (d) => d.uuid);
            text.exit().remove();

            let new_text = text.enter().append('text');
            new_text
                .attr('class', (d) => {

                    let clss = 'hierarchy-group-label depth' + d.depth;

                    return clss += (typeof d.children === 'undefined')? ' text-leaf' : '';
                })
                .style('font-size', (d) => { 

                    let size = (d.parent)? (d.value / d.parent.value) * 100 : (d.value / meta.pageviews) * 100;

                    return Math.min(
                        css_utils.remsToPixels(max_font_size_rems), 
                        size + css_utils.remsToPixels(0.75)
                    ) + 'px';
                })
                .style('display', (d) => { 

                    return (d.parent === current_root_node && d.value > data_circle_size_dimension_value_label_threshold)? 'inline' : 'none'; 
                })
                .text((d) => d.data.name);

            d3.selectAll('hierarchy-group-label depth' + max_depth).remove();

            zoomTo([current_root_node.x, current_root_node.y, current_root_node.r * 2 + margin]);

            new_circles
                .attr('r', 0)
                .transition().duration(500)
                .attr('opacity', 1)
                .attr('r', (d) => d.r);

            // updateAnnotations();
            // statusNotifier.done();
            $(window).trigger('chart-render-complete.akdv', { data: data_provider.all(), data_filtered: data_provider.allFiltered() });
        };


        const updateData = () => {

            setHierarchicalData();
        };


        const onFilterChanged = () => {

            setHierarchicalData();
            clearZoom();
            drawChart();
        };


        const updateDataHierarchy = (hierarchy_array) => {

            if (!Array.isArray(hierarchy_array) || !hierarchy_array.length) {
                window._log.warn('Expected a non empty Array of string property names.');
                return;
            }

            data_hierarchy_array = hierarchy_array;
            max_depth = data_hierarchy_array.length;
            setHierarchicalData();
            drawChart();
        };


        // INTERNAL EVENT CHART INTERACTION LISTENERS
        $(container_el).on('click', (e) => { clearZoom(); });
        // CIRCLE interaction listeners 
        $(container_el).on('click', 'circle', onCircleClick);
        // $(container_el).on('mouseover', 'circle:not(.node-root)', onCircleMouseOver);
        // $(container_el).on('mouseleave', 'circle', onCircleMouseOut);


        // EXTERNAL EVENTS
        
        if (external_filters_enabled) {
            $(window).on(`filter-changed.${event_namespace_chart_data_update}`, e => onFilterChanged());
        }

        if (event_namespace_for_data_hierarchy_update) {
            $(window).on(`order-change.${event_namespace_for_data_hierarchy_update}`, (e, hierarchy_array) => updateDataHierarchy(hierarchy_array));
        }

        return {
            updateData: updateData,
            draw: drawChart,

            resize({ w = false, h = false } = {}) {

                margin = css_utils.remsToPixels(margin_rems);
                margin_bottom = css_utils.remsToPixels(margin_rems);
                padding = css_utils.remsToPixels(padding_rems);

                w = Math.max(0, w);
                h = Math.max(0, h - margin_bottom);

                diameter = Math.min(h, w);

                chart_svg.attr('height', '100%');
                chart_svg_g.attr('transform', `translate(${w * 0.5}, ${h * 0.5})`);

                d3_pack
                    .size([w - margin, h - margin])
                    .padding(padding);
            }
        };
    };



})(window, document, window.jQuery, window.d3, window.crossfilter, 
   window.akdv.utils_css, window.akdv.utils_color, window.akdv.utils_string, window.akdv.utils_hierarchy);