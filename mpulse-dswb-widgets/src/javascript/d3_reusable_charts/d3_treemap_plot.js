;((window, document, $, d3, crossfilter, css_utils, hierarchy_utils, data_utils, dom_utils, string_utils, event_utils, color_utils, lang_utils, mpulse, validate, statusNotifier) => {

    'use strict';
    
    window.getTreemapPlot = ({
        uuid = string_utils.generateUUID(),
        // This string, must match a 'chart_group' defined in the JSON result data
        event_namespace_chart_data_update = window.required(),
        event_namespace_for_data_hierarchy_update = 'data-hierarchy',
        event_namespace_for_annotation = false,
        event_namespace_for_contextmenu = false,
        event_namespace_for_drillable_change = false,
        event_namespace_for_percentile_change = false,
        event_namespace_for_percentile_calculated = false,
        external_filters_enabled = true,
        container_el = window.required(),
        data_provider = window.required('crossfilter instance'),
        // dimension on which external filter events can be applied
        data_node_size_dimension_property_name = window.required(),
        data_hierarchy_array = window.required(),
        data_hiearchy_dimensions_to_sum = false,
        data_hiearchy_dimensions_to_mean = false,
        data_hiearchy_dimensions_to_mode = false,
        data_hiearchy_dimensions_to_percentile = false,
        data_non_bucketed_dimensions_to_filter_post_hierarchy = [],
        data_kth_percentile_to_calc = false,
        // defaults to the last entry in the data_hierarchy_array
        data_hierarchy_end_node_dimension_property_name = false,
        data_leaf_color_dimension_property_name = false,
        leaf_node_fill_d3_color_scale = false,
        // eg: ['hsl(192, 56%, 28%)', 'hsl(192, 84%, 16%)']
        // if not set will be generated based on bg color
        depth_color_range_array = false, 
        hierarchy_drillable = false,
        meta = {},
        margin_bottom_rems = 0,
        padding_inner_rems = 0.05,
        padding_outer_rems = 0.15,
        padding_top_rems = 1.65,
        text_padding_rems = 0.5,
        min_tile_width = 5,
        min_tile_height = 5,
        min_node_width_for_label_rems = 4,
        min_node_height_for_label_rems = 2.5,
        max_nodes_to_show_labels = 128,
        root_breadcrumb_name = 'RootBreadcrumbName',
        function_for_leaf_node_label_format = d => d
    } = {}) => {

        dom_utils.throwExceptionIfNotDOMNodeElement(container_el);

        let end_node_property_name, hierarchical_data, zoomed_hierarchy_node, zoomed_hierarchy_depth, zoomed_hierarchy_node_path_array,
            hiearchy_dimensions_to_sum = [], hierarchy_dimensions_to_mean = [], hierarchy_dimensions_to_mode = [], hiearchy_dimensions_to_percentile = [],
            margin_bottom, padding_inner, padding_outer, padding_top, text_padding, external_dimension_filter, kth_percentile_to_calc = data_kth_percentile_to_calc, min_node_width_for_label, min_node_height_for_label;

        data_hierarchy_array = [...data_hierarchy_array]; // use a shallow copy not ref to original
        const d3_treemap = d3.treemap().tile(d3.treemapSquarify);
        const depth_d3_color_scale = d3.scaleLinear();
        const chart_svg = d3.select(container_el);
        const chart_svg_g = chart_svg.append('g').attr('class', 'inner-chart');


        const nodeSumFn = d => d[data_node_size_dimension_property_name];


        const getPercentile = () => (kth_percentile_to_calc !== false && Number(kth_percentile_to_calc) === kth_percentile_to_calc)
            ? kth_percentile_to_calc
            : data_utils.getValueAsNumberOrFallbackValue(mpulse.getFilterValueByName('percentile'), 50);


        const triggerExternalHierarchyEventWithDepth = (depth = 0) => {
            event_utils.dispatchCustomEvent(window, 'order-item-focus', event_namespace_for_data_hierarchy_update, depth);
        };


        const updateEndNodePropertyName = () => {
            end_node_property_name = data_hierarchy_end_node_dimension_property_name || ((!hierarchy_drillable)
               ? data_hierarchy_array.slice(-1).pop()
               : data_hierarchy_array[Math.min(zoomed_hierarchy_depth || 0, data_hierarchy_array.length - 1)]);
        };


        const updateDepthColorRange = () => {

            depth_d3_color_scale
                .domain([-1, data_hierarchy_array.length])
                .range(depth_color_range_array || color_utils.getColorRangeArrayStartingFromBgColor())
                .interpolate(d3.interpolateHcl)
        };


        const clearBreadCrumbs = () => {

            chart_svg_g.select('.root-node-text').selectAll('tspan').remove();
            chart_svg_g.select('.root-node-text')
                .append('tspan')
                    .attr('data-width', d => d.x1 - d.x0)
                    .text(function(d) { return lang_utils.addLocalizedString(this, d.data.name || 'Unknown', d.data.name ? 'AKDV.Columns' : 'AKDV.Errors'); });
        };


        const clearZoom = () => {

            clearBreadCrumbs();
            zoomed_hierarchy_node = false;
            zoomed_hierarchy_depth = 0;
            zoomed_hierarchy_node_path_array = false;
            triggerExternalHierarchyEventWithDepth();
        };


        const setHierarchicalData = (data_array) => {

            updateEndNodePropertyName();
            data_array = [...data_array]; // clone
            
            hiearchy_dimensions_to_sum = data_utils.uniqueArray([data_node_size_dimension_property_name, ...(data_hiearchy_dimensions_to_sum || [])]);
            hierarchy_dimensions_to_mean = data_hiearchy_dimensions_to_mean || [];
            hierarchy_dimensions_to_mode = data_hiearchy_dimensions_to_mode || [];
            hiearchy_dimensions_to_percentile = data_hiearchy_dimensions_to_percentile
                || data_utils.getKeysInDatumWithNumericalValues(data_array[0], [data_node_size_dimension_property_name, ...hierarchy_dimensions_to_mean, ...hiearchy_dimensions_to_sum]);
            
            hierarchical_data = hierarchy_utils.getAsHierarchicalData(data_array, end_node_property_name, ...data_hierarchy_array);
            //hierarchical_data = hierarchy_utils.setUUIDForAllNodesInHierarchicalObject(hierarchical_data);
        };


        const aggregateHierarchyForDrillableMode = (n) => {

            let keys_to_copy = data_provider.meta.result_item_keys.filter(d => 
                ![...hiearchy_dimensions_to_sum, ...hierarchy_dimensions_to_mean, ...hiearchy_dimensions_to_percentile, ...hierarchy_dimensions_to_mode].includes(d)
            );

            return hierarchy_utils.aggregateDescendantsOfNodeAlongDimensions(n, hiearchy_dimensions_to_sum, hierarchy_dimensions_to_mean, hierarchy_dimensions_to_mode, hiearchy_dimensions_to_percentile, keys_to_copy, data_provider.meta.bucket_values, getPercentile(), data_node_size_dimension_property_name);
        };
        

        const setD3HierarchyRootNode = (n) => 
            d3.hierarchy(data_provider.applyFiltersToHierarchicalData((hierarchy_drillable)
                    ? aggregateHierarchyForDrillableMode(n) 
                    : hierarchy_utils.calculatePercentilesForAggregateValuesInHierarchyNode(n, data_provider.meta.bucket_values, getPercentile()),
                    data_non_bucketed_dimensions_to_filter_post_hierarchy)
                )
                .sum(nodeSumFn)
                .sort((a, b) => b.value - a.value);


        const updateZoomedHierarchyBreadcrumbs = () => {
            if (zoomed_hierarchy_node) {
                let root_text = chart_svg_g.select('.root-node-text');
                root_text.selectAll('tspan').remove();
                zoomed_hierarchy_node_path_array.forEach((d, i, arr) => {
                    root_text
                        .append('tspan')
                        .classed('zoomed-hierarchy-button', true)
                        .attr('data-uuid', d.uuid)
                        .text(function(datum) { return lang_utils.addLocalizedString(this, d.name || 'unknown', d.name ? 'AKDV.Columns' : 'unknown'); });
                    if (i < arr.length - 1) {
                        root_text.append('tspan').text(' > ').classed('zoomed-hierarchy-divider', true);
                    }
                });
            }
        };


        const getNodeFillColor = (d, i) => (d.children || !leaf_node_fill_d3_color_scale || (!d.children && i === 0))? depth_d3_color_scale(d.depth) : (d.data[data_leaf_color_dimension_property_name] && !isNaN(d.data[data_leaf_color_dimension_property_name]))? leaf_node_fill_d3_color_scale(d.data[data_leaf_color_dimension_property_name]) : 'rgb(0,0,0)';


        const clearChart = () => chart_svg_g.selectAll('.node').remove();


        const drawChart = (clear = true) => {
  

            if (!data_provider.size()) {
                window._log.warn('treemap drawChart method requires data.');
                return;
            }

            statusNotifier.rendering();
            event_utils.dispatchCustomEvent(window, 'chart-render-start', 'akdv', { uuid });

            window.requestAnimationFrame(e => { window.setTimeout(e => {

                if (clear === true) {
                    clearZoom();
                    clearChart();
                }

                updateEndNodePropertyName();
                updateDepthColorRange();

                let root_node = setD3HierarchyRootNode(zoomed_hierarchy_node || hierarchical_data);
                // console.log(hierarchy_utils.countDescendantsOfNode(root_node, false));
                let tree = d3_treemap(root_node);
                let tree_nodes = d3_treemap(hierarchy_utils.filterOutSmallNodes(tree, min_tile_width, min_tile_height).sum(nodeSumFn)).descendants();
                let node_groups = chart_svg_g.selectAll('.node').data(tree_nodes, (d) => d.data.uuid);

                // EXIT
                
                let exiting_node_groups = node_groups.exit().remove();

                node_groups.selectAll('text').remove();
                node_groups.selectAll('clipPath').remove();

                let label_threshold_reached = node_groups._groups[0].length > max_nodes_to_show_labels;
                let min_nw = (label_threshold_reached)? css_utils.remsToPixels(13) : min_node_width_for_label;
                let min_nh = (label_threshold_reached)? css_utils.remsToPixels(4) : min_node_height_for_label;
                let filter_nodes_to_add_text_fn = d => {
                    let is_group_node = typeof d.children !== 'undefined';
                    let mnw = (is_group_node)? min_node_width_for_label : min_nw;
                    let mnh = (is_group_node)? 0 : min_nh;
                    return (d.x1 - d.x0 > mnw && d.y1 - d.y0 > (mnh + (is_group_node * padding_top))) || !d.parent;
                };

                // ENTER

                let new_node_groups = node_groups.enter().append('g');

                new_node_groups
                    .attr('class', d => (d.parent)? ((d.children)? 'node group-node' : 'node node-leaf') : 'node node-root')
                    .attr('transform', d => `translate(${d.x0},${d.y0})`)
                    .attr('opacity', d => (d.children)? 1 : 0)
                    .append('rect')
                        .classed('node-rect', true)
                        .attr('width', d => d.x1 - d.x0)
                        .attr('height', d => d.y1 - d.y0)
                        .style('fill', getNodeFillColor);

                new_node_groups
                    .transition().duration(300)
                    .attr('opacity', 1);
                        
                let update_nodes = new_node_groups.merge(node_groups);

                update_nodes
                    .filter(filter_nodes_to_add_text_fn)
                    .append('clipPath')
                        .attr('id', d => `clippath_${d.data.uuid}`)
                        .append('rect');

                update_nodes
                    .filter(filter_nodes_to_add_text_fn)
                    .append('text')
                        .attr('clip-path', d => `url(#clippath_${d.data.uuid})`)
                        .append('tspan');

                update_nodes
                    .select('clipPath rect')
                        .attr('width', d => d.x1 - d.x0)
                        .attr('height', d => d.y1 - d.y0);

                let update_text = update_nodes.select('text');
                
                update_text.filter(d => typeof d.children === 'undefined')
                    .classed('leaf-node-text', true)
                    .attr('x', d => (!d.parent)? text_padding : (d.x1 - d.x0) - text_padding)
                    .attr('y', (d, i, nodes) => (!d.parent)? text_padding * 2.1 : (d.y1 - d.y0) - text_padding)
                    .select('tspan').attr('data-width', d => d.x1 - d.x0).attr('data-fulltext', null)
                    .text(d => function_for_leaf_node_label_format(d.data[end_node_property_name]))
                    .each(function(d) { // cannot be fat arrow function because of use of "this"
                        if (!label_threshold_reached) { dom_utils.ellipsizeDOMNodeTextElement(this, 'START'); }
                    });

                update_text.filter(d => (typeof(d.children) !== 'undefined' && d.parent))
                    .classed('group-node-text', true)
                    .attr('x', text_padding)
                    .attr('y', text_padding * 2.1)
                    .select('tspan').attr('data-width', d => d.x1 - d.x0).attr('data-fulltext', null)
                    .text(function(d) { return d.data.name || lang_utils.addLocalizedString(this, 'Unknown', 'AKDV.Errors');})
                    .each(function(d) { // cannot be fat arrow function because of use of "this"
                        if (!label_threshold_reached) { dom_utils.ellipsizeDOMNodeTextElement(this, 'MIDDLE'); }
                    });

                update_text.filter(d => (typeof(d.children) !== 'undefined' && !d.parent))
                    .classed('group-node-text', true)
                    .classed('root-node-text', true)
                    .attr('x', text_padding)
                    .attr('y', text_padding * 2.1)
                    .select('tspan').attr('data-width', d => d.x1 - d.x0).attr('data-fulltext', null)
                    .text(function(d) { return lang_utils.addLocalizedString(this, d.data.name || root_breadcrumb_name,  d.data.name ? 'AKDV.Columns' : 'AKDV.Strings'); });

                updateZoomedHierarchyBreadcrumbs();

                // UPDATE
                
                if (!clear) {
                    let leaf_nodes = update_nodes.filter(d => typeof d.children === 'undefined').nodes();

                    if (leaf_nodes.length) {
                        dom_utils.moveToFrontListOfDOMNodeElements(leaf_nodes);
                    }

                    node_groups
                        .attr('class', d => (d.parent)? ((d.children)? 'node group-node' : 'node node-leaf') : 'node node-root')
                        .transition().duration(d => 330 * !d.children) // snap parents, animate leaves
                        .attr('transform', d => `translate(${d.x0},${d.y0})`)
                        .attr('opacity', 1);

                    node_groups
                        .select('.node-rect')
                            .transition().duration(d => 330 * !d.children) // snap parents, animate leaves
                            .attr('width', d => d.x1 - d.x0)
                            .attr('height', d => d.y1 - d.y0)
                            .style('fill', getNodeFillColor);
                }

                if (tree_nodes[0].value === 0) { // no results found
                    chart_svg_g.select('.node-root').selectAll('tspan').remove();
                    chart_svg_g.select('.node-root')
                        .select('text').attr('class', 'group-node-text root-node-text')
                        .append('tspan')
                            .text(function(d) { return lang_utils.addLocalizedString(this, (typeof root_node.data.percentile_calculated !== 'undefined')? 'EmptyAtPercentile' : 'NoData', 'AKDV.Errors');});
                }

                statusNotifier.done();
                event_utils.dispatchCustomEvent(window, 'chart-render-complete', 'akdv', { uuid });
                
                if (event_namespace_for_annotation) {
                    event_utils.dispatchCustomEvent(window, 'hide-component', event_namespace_for_annotation);
                }
                if (event_namespace_for_percentile_calculated) {
                    event_utils.dispatchCustomEvent(window, 'percentiles-calculated', event_namespace_for_percentile_calculated, typeof root_node.data.percentile_calculated !== 'undefined');
                }
            }, 300); });
        };
        

        const updateData = () => {
            
            kth_percentile_to_calc = undefined;
            setHierarchicalData(data_provider.allFiltered());
        };


        const updateDataHierarchy = (hierarchy_array = window.required('Array')) => {

            if (!Array.isArray(hierarchy_array) || !hierarchy_array.length) {
                window._log.warn('Expected a non empty Array of string property names.');
                return;
            }

            data_hierarchy_array = hierarchy_array;
            setHierarchicalData(data_provider.allFiltered());
            clearZoom();
            drawChart(false);
        };


        const onFilterChanged = () => {

            // On hierarchical data, filters are currently applied by calling the dataProvider.applyFiltersToHierarchicalData
            // instead of on filterchange so there's no need to update the data here just call draw and the call to
            // the hierachy method setD3HierarchyRootNode will aply the filters to the hierarchy leaves.
            // The following two lines are left to show intentionality of not updating the data here for reasons explained above.
            // DO NOT UNCOMMENT : setHierarchicalData(data_provider.allFiltered());
            // DO NOT UNCOMMENT : clearZoom();
            drawChart(false);
        };


        const zoomTo = (d) => {

            if (d.data.uuid === hierarchical_data.uuid
            || (zoomed_hierarchy_depth === data_hierarchy_array.length)
            || (d.data.uuid === zoomed_hierarchy_node.uuid && d.data.children.length === zoomed_hierarchy_node.children.length)) {
                return;
            }

            zoomed_hierarchy_node_path_array = [ 
                ...(zoomed_hierarchy_node_path_array || [{ name: hierarchical_data.name, uuid: hierarchical_data.uuid }]), 
                ...hierarchy_utils.getBreadCrumbNodeArrayFromHierarchicalData(d, end_node_property_name)
            ];

            [ zoomed_hierarchy_node, zoomed_hierarchy_depth ] = hierarchy_utils.getAWrappedLeafAndADepthFromObjectHierarchyWithMatchingUUID(zoomed_hierarchy_node || hierarchical_data, d, zoomed_hierarchy_depth || 0);

            triggerExternalHierarchyEventWithDepth(zoomed_hierarchy_depth);
        };


        const onNodeClick = (e) => {

            let d = d3.select(e.currentTarget).datum();

            e.stopPropagation();
            zoomTo(d);
            drawChart(false);
        };


        const onZoomedHierarchyButtonClick = (e) => {

            let uuid = d3.select(e.currentTarget).attr('data-uuid');
            let index = 0;

            e.stopPropagation();

            zoomed_hierarchy_node_path_array.some((d, i) => (d.uuid === uuid)? index = i : false);
            zoomed_hierarchy_node_path_array = zoomed_hierarchy_node_path_array.slice(0, index + 1);

            if (index !== 0) {
                [ zoomed_hierarchy_node, zoomed_hierarchy_depth ] = hierarchy_utils.getAWrappedLeafAndADepthFromObjectHierarchyWithMatchingUUID(hierarchical_data, { uuid: uuid }, index);
                clearBreadCrumbs();
            } else {
                clearZoom();
            }
            drawChart(false);

            triggerExternalHierarchyEventWithDepth(zoomed_hierarchy_depth);
        };


        const reZoomToCurrentRoot = () => {

            zoomTo(chart_svg_g.select('.node-root').datum());
        };


        const onDrillableChange = (bool) => {

            hierarchy_drillable = bool;
            drawChart(false);
        };


        const onPercentileChange = (kth) => {

            let changed = kth_percentile_to_calc !== kth;
            kth_percentile_to_calc = kth || false;
            if (changed) {
                drawChart(false);
            }
        };


        // INTERNAL EVENT CHART INTERACTION LISTENERS
        
        $(container_el).on('click', '.zoomed-hierarchy-button:not(:last-of-type)', onZoomedHierarchyButtonClick);
        $(container_el).on('click', '.node', e => {
            if (event_namespace_for_contextmenu) {
                event_utils.dispatchCustomEvent(window, 'hide-component', event_namespace_for_contextmenu);
            }
            onNodeClick(e);
        });
        if (event_namespace_for_contextmenu) {
            $(container_el).on('contextmenu', '.node-leaf', e => {
                if (event_namespace_for_annotation) {
                    event_utils.dispatchCustomEvent(window, 'hide-component', event_namespace_for_annotation);
                }
                event_utils.dispatchCustomEvent(window, 'show-component', event_namespace_for_contextmenu, [ e, { d: d3.select(e.currentTarget).datum(), hiearchy_path: zoomed_hierarchy_node_path_array } ]);
                e.stopPropagation(); 
                return false; 
            });
        }
        $(container_el).on('mouseover', '.node:not(.node-root)', e => {
            if (event_namespace_for_contextmenu) {
                event_utils.dispatchCustomEvent(window, 'hide-component', event_namespace_for_contextmenu);
            }
            if (event_namespace_for_annotation) {
                event_utils.dispatchCustomEvent(window, 'show-component', event_namespace_for_annotation, [ e, { d: d3.select(e.currentTarget).datum(), end_node_property_name } ]);
            }
        });
        if (event_namespace_for_annotation) {
            $(container_el).on('mouseleave click ', '.node', e => {
                event_utils.dispatchCustomEvent(window, 'hide-component', event_namespace_for_annotation);
            });
        }

        // EXTERNAL EVENTS
        
        if (external_filters_enabled) {
            $(window).on(`filter-changed.${event_namespace_chart_data_update}`, e => onFilterChanged());
        }

        if (event_namespace_for_data_hierarchy_update) {
            $(window).on(`order-change.${event_namespace_for_data_hierarchy_update}`, (e, hierarchy_array) => updateDataHierarchy(hierarchy_array));
        }

        if (event_namespace_for_drillable_change) {
            $(window).on(`switch.${event_namespace_for_drillable_change}`, (e, bool) => onDrillableChange(bool));
        }

        if (event_namespace_for_percentile_change) {
            $(window).on(`percentile-change.${event_namespace_for_percentile_change}`, (e, kth) => onPercentileChange(kth));
        }

        // methods to export
        return {
            updateData: updateData,
            draw: drawChart,

            resize({ w = false, h = false } = {}) {

                margin_bottom = css_utils.remsToPixels(margin_bottom_rems);
                padding_inner = css_utils.remsToPixels(padding_inner_rems);
                padding_outer = css_utils.remsToPixels(padding_outer_rems);
                padding_top = css_utils.remsToPixels(padding_top_rems);
                text_padding = css_utils.remsToPixels(text_padding_rems);
                min_node_width_for_label = css_utils.remsToPixels(min_node_width_for_label_rems);
                min_node_height_for_label = css_utils.remsToPixels(min_node_height_for_label_rems);

                w = Math.max(0, w);
                h = Math.max(0, h - margin_bottom);

                chart_svg
                    .attr('height', h)
                    .attr('viewBox', `0 0 ${w} ${h}`)
                    .style('background', depth_d3_color_scale(-1));

                d3_treemap
                    .size([w, h])
                    .paddingInner(padding_inner)
                    .paddingOuter(padding_outer)
                    .paddingTop(d => (d.children)? padding_top : 0)
                    .round(false);

                return arguments[0];
            }
        };
    };


})(window, document, window.jQuery, window.d3, window.crossfilter, 
   window.akdv.utils_css, window.akdv.utils_hierarchy, window.akdv.utils_data, window.akdv.utils_dom, window.akdv.utils_string,
   window.akdv.utils_event, window.akdv.utils_color, window.akdv.utils_lang, window.akdv.mpulse, window.akdv.validate, window.akdv.statusNotifier);