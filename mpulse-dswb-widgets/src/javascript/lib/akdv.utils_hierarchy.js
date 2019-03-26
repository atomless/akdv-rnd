;((window, document, d3, data_utils, math_utils, string_utils, event_utils, lang_utils, statusNotifier) => {

    'use strict';
  

    const hierarchy_utils = window.akdv.utils_hierarchy = {


        // Returns children in the root.
        // For a parent root node wrapper see getAsHierarchicalData below.
        _getHierarchicalChildren(data_array, ...hyerarchical_properties) {

            let prop = hyerarchical_properties.shift();

            return data_utils.getUniqueListOfValuesFromDataArrayForProp(data_array, prop)
                .map(val => ({
                    name: (typeof val !== 'string' && typeof val !== 'number')
                        ? false
                        : val,
                    uuid: string_utils.generateUUID(),
                    children: (hyerarchical_properties.length <= 1)
                        ? data_utils.filterToDatumWithPropsWithValuesOf(data_array, prop, val)
                        : window.akdv.utils_hierarchy._getHierarchicalChildren(
                            data_utils.filterToDatumWithPropsWithValuesOf(data_array, prop, val), 
                            ...hyerarchical_properties
                          )
                }));
        },


        /** 
         *  @data {array} data_array An array of objects.
         *  @args {array} hyerarchical_properties Arbitrarily many property name args, preferably specified using the spread operator.
         *  @return {object} A hierarchical object structure based on the order specified in the names args.
         *  Usage:
         *  window.akdv.utils_hierarchy.getAsHierarchicalData(data, ...['host', 'mediatype']) will transform :
         *  [ {
         *    "cachehitratio": 0.277,
         *    "mediatype": "css",
         *    "min_start": 0,
         *    "initiator_type": "link",
         *    "median_start": 0.29,
         *    "path": "/197/stylesheets/custom_builds/homepage.css",
         *    "host": "www.grainger.com",
         *    "avg_transfer_size": 11004.517,
         *    "hits": 159981,
         *    "load_time": 105
         *  }, ...] 
         *  into :
         *  { name : "host", 
         *    children: [
         *      { name : 'www.grainger.com', 
         *        children: [
         *              {
         *                 name : 'css', 
         *                 children: [
         *                    {
         *                        "cachehitratio": 0.277,
         *                        "mediatype": "css",
         *                        "min_start": 0,
         *                        "initiator_type": "link",
         *                        "median_start": 0.29,
         *                        "path": "/197/stylesheets/custom_builds/homepage.css",
         *                        "host": "www.grainger.com",
         *                        "avg_transfer_size": 11004.517,
         *                        "hits": 159981,
         *                        "load_time": 105
         *                    }, ...
         *                 ]
         *              }, ...
         *          ]
         *      }, ...
         *  ]}
         *  Note: supports arbitrarily deep hierarchy of properties
         */
        getAsHierarchicalData : (data_array, end_node_property_name, ...hyerarchical_properties) => {

            if (!window.akdv.validate.objectsInArrayHaveRequiredKeys(data_array, hyerarchical_properties)) {
                let warning = 'Invalid datum found in data. Missing one of the properties required by the specified data hierarchy.';
                window._log.warn(warning);
                
                statusNotifier.setError({ title: lang_utils.getLocalizedHTMLString('Error', 'AKDV.Errors'), description: lang_utils.getLocalizedHTMLString('InvalidData', 'AKDV.Errors'), trace: warning});
            }

            data_array.map(d => {
                d.uuid = d.uuid || string_utils.generateUUID();
                d.name = (typeof d[end_node_property_name] !== 'string' && typeof d[end_node_property_name] !== 'number')? false : d[end_node_property_name];
                return d;
            });

            return { 
                name : hyerarchical_properties[0],
                uuid: string_utils.generateUUID(),
                children : window.akdv.utils_hierarchy._getHierarchicalChildren(data_array, ...hyerarchical_properties)
            };
        },


        // ensure hierarchy objects have uuids at every level
        // mainly used for parent nodes as leaves usually already have uuids
        setUUIDForAllNodesInHierarchicalObject(data_obj, depth = 0, index = 0) {

            if (Array.isArray(data_obj.children)) {
                if (!data_obj.uuid) {
                    data_obj.uuid = window.akdv.utils_string.generateUUID();
                }
                data_obj.children.forEach((d, i) => this.setUUIDForAllNodesInHierarchicalObject(d, depth + 1, i));
            }
            return data_obj;
        },


        _aggregateLeafWeightings(n = window.required(), key_for_weight = [], summed_leaf = {}) {

            if (typeof n.children === 'undefined') {
                summed_leaf.weights.push(n[key_for_weight]);
            } else {
                for (let c of n.children) {
                    this._aggregateLeafWeightings(c, key_for_weight, summed_leaf);
                }
            }

            return summed_leaf;
        },


        _aggregateLeavesAlongDimensions(n = window.required(), keys_to_sum = [], keys_to_aggregate = [], keys_to_copy = [], summed_leaf = {}) {

            if (typeof n.children === 'undefined') {

                for (let k of keys_to_copy) {
                    if (typeof summed_leaf[k] === 'undefined') {
                        summed_leaf[k] = n[k];
                    }
                }

                for (let k of keys_to_sum) {
                    if (n[k] === Object(n[k]) && n[k].buckets) {
                        summed_leaf[k].buckets = n[k].buckets.map((b, i) => b + (summed_leaf[k].buckets[i] || 0));
                    } else if (Number(n[k]) === n[k]) {
                        summed_leaf[k] += n[k];
                    }
                }
                
                for (let k of keys_to_aggregate) {
                    if (n[k] === Object(n[k]) && n[k].buckets) { // aggregate bucket count arrays 
                        summed_leaf[k].buckets = n[k].buckets.map((b, i) => b + (summed_leaf[k].buckets[i] || 0));
                    } else if (Array.isArray(summed_leaf[k])) { // aggregate single values
                        summed_leaf[k].push(n[k]);
                    }
                }
            } else {
                for (let c of n.children) {
                    this._aggregateLeavesAlongDimensions(c, keys_to_sum, keys_to_aggregate, keys_to_copy, summed_leaf);
                }
            }

            return summed_leaf;
        },


        _aggregateDescendantsOfChildrenAlongDimensions(children = window.required(), parent = false, keys_to_sum = [], keys_to_mean = [], keys_to_mode = [], keys_to_percentile = [], keys_to_copy = [], bucket_values = {}, kth_percentile = 50, key_for_weight = window.required()) {

            let keys_to_aggregate = data_utils.uniqueArray([...keys_to_mean, ...keys_to_mode, ...keys_to_percentile]);

            return children.map(n => {
                let summed_leaf = { name: n.name, uuid: n.uuid, weights: [] };

                for (let k of keys_to_sum) {
                    summed_leaf[k] = 0;
                }

                for (let k of keys_to_aggregate) {
                    summed_leaf[k] = bucket_values[k]? { buckets: [] } : [];
                }

                summed_leaf = window.akdv.utils_hierarchy._aggregateLeavesAlongDimensions(n, keys_to_sum, keys_to_aggregate, keys_to_copy, summed_leaf);

                let not_bucketed_percentiles = data_utils.arraysNotIntersection(Object.keys(bucket_values), keys_to_percentile);
                if (not_bucketed_percentiles.length) {
                    summed_leaf = window.akdv.utils_hierarchy._aggregateLeafWeightings(n, key_for_weight, summed_leaf);

                    for (let k of not_bucketed_percentiles) {
                        if (Array.isArray(summed_leaf[k]) && summed_leaf[k].length > 1) {
                            let extent = d3.extent(summed_leaf[k]);
                            let steps = Math.max(127, data_utils.uniqueArray(summed_leaf[k]).length);
                            let step = extent[1] / steps;
                            let bucket_values = data_utils.getArrayFromMinToMaxWithSpecifiedSteps(0, extent[1], steps);
                            let buckets = Array(bucket_values.length).fill(0);
                            summed_leaf[k].forEach((d, i) => {
                                let index = data_utils.indexOfValueInAscendingArrayWithStep(bucket_values, d, step);
                                buckets[index] += summed_leaf.weights[i];
                            });
                            summed_leaf[k] = data_utils.percentileOfBuckets(buckets, bucket_values, kth_percentile);
                            summed_leaf.percentile_calculated = kth_percentile;
                        } else if (Array.isArray(summed_leaf[k]) && summed_leaf[k].length) {
                            summed_leaf[k] = summed_leaf[k][0];
                        }
                    }
                    // clean up for memory 
                    summed_leaf.weights = null;
                }

                for (let k of keys_to_percentile) {
                    if (Object(summed_leaf[k]) === summed_leaf[k] && summed_leaf[k].buckets) {
                        summed_leaf[`${k}-buckets`] = true;
                        summed_leaf[k] = data_utils.percentileOfBuckets(summed_leaf[k].buckets, bucket_values[k], kth_percentile);
                        summed_leaf.percentile_calculated = kth_percentile;
                    }
                }

                for (let k of keys_to_mean) {
                    summed_leaf[k] = summed_leaf[k].reduce((sum, d) => sum + d, 0) / (summed_leaf[k].length || 1);
                }

                for (let k of keys_to_mode) {
                    summed_leaf[k] = math_utils.mode(summed_leaf[k]);
                }

                if (typeof parent.percentile_calculated === 'undefined' && typeof summed_leaf.percentile_calculated !== 'undefined') {
                    parent.percentile_calculated = summed_leaf.percentile_calculated;
                }

                return summed_leaf;
            });
        },


        aggregateDescendantsOfNodeAlongDimensions(n = window.required(), keys_to_sum = window.required(), keys_to_mean = [], keys_to_mode = [], keys_to_percentile = [], keys_to_copy = [], bucket_values = {}, kth_percentile = 50, key_for_weight = window.required()) {

            let aggregated_node = {
                name: n.name,
                uuid: n.uuid
            };
                
            aggregated_node.children = this._aggregateDescendantsOfChildrenAlongDimensions(n.children, aggregated_node, keys_to_sum, keys_to_mean, keys_to_mode, keys_to_percentile, keys_to_copy, bucket_values, kth_percentile, key_for_weight);

            return aggregated_node;
        },


        _calculatePercentilesForAggregateValuesOfLeaves(n = window.required(), parent = {}, bucket_values = {}, kth_percentile = 50, percentile_calculated = {}) {

            if (n.children && n.children.length) {
                n.children.forEach(d => this._calculatePercentilesForAggregateValuesOfLeaves(d, n, bucket_values, kth_percentile, percentile_calculated));
            } else {
                Object.entries(n).forEach(d => {
                    if (Object(d[1]) === d[1] && d[1].buckets) {
                        n[`${d[0]}-buckets`] = true;
                        n[d[0]] = data_utils.percentileOfBuckets(d[1].buckets, bucket_values[d[0]], kth_percentile);
                        n.percentile_calculated = kth_percentile;
                    } else if (Array.isArray(d[1]) && d[1].length) {
                        n[d[0]] = math_utils.percentile(d[1], kth_percentile);
                        n.percentile_calculated = kth_percentile;
                    }
                });
                if (typeof parent.percentile_calculated === 'undefined' && typeof n.percentile_calculated !== 'undefined') {
                    parent.percentile_calculated = n.percentile_calculated;
                    percentile_calculated.pc = true;
                }
            }
            return percentile_calculated;
        },


        calculatePercentilesForAggregateValuesInHierarchyNode(n = window.required(), bucket_values = {}, kth_percentile = 50) {

            let percentile_calculated = { pc: false };

            n = JSON.parse(JSON.stringify(n));

            if (n.children && n.children.length) {
                n.children.forEach(d => this._calculatePercentilesForAggregateValuesOfLeaves(d, n, bucket_values, kth_percentile, percentile_calculated));
            }

            if (percentile_calculated.pc) {
                n.percentile_calculated = percentile_calculated.pc;
            }

            return n;
        },


        _largestValueOfDimensionOfLeaves(n, key, largest) {

            if (n.children && n.children.length) {
                n.children.forEach(d => this._largestValueOfDimensionOfLeaves(d, key, largest));
            } else {
                largest.max = Math.max(n[key], largest.max);
            }
            return largest;
        },


        largestValueOfDimensionOfNode(n = window.required(), key = undefined, largest = { max : 0 }) {

            if (n.children && n.children.length) {
                n.children.forEach(d => this._largestValueOfDimensionOfLeaves(d, key, largest));
            } else {
                largest.max = Math.max(n[key], largest.max);
            }
            return largest.max;
        },


        countDescendantsOfNode : (n = window.required(), only_leaves = true, count = 0) => (n.children && n.children.length) 
            ? n.children.reduce((c, d) => window.akdv.utils_hierarchy.countDescendantsOfNode(d, only_leaves, c  + (1 * !only_leaves)), count)
            : count + 1,


        setDescendantCountForAllNodesInHierarchicalObject(n = window.required(), only_leaves = true) {

            if (n.children && n.children.length) {
                n.descendant_count = this.countDescendantsOfNode(n, only_leaves);
                n.children.forEach(d => this.setDescendantCountForAllNodesInHierarchicalObject(d, only_leaves));
            }
            return n;
        },


        // do not use directly - use : getUniqueArrayOfValuesInHierarchyAlongDimensionForNode
        _getUniqueArrayOfValuesInHierarchyAlongDimension(n = window.required(), dimension = undefined, values = new Set()) {

            if (n.children && n.children.length) {
                n.children.forEach(d => this._getUniqueArrayOfValuesInHierarchyAlongDimension(d, dimension, values))
            } else {
                if (n[dimension]) {
                    values.add(n[dimension]);
                } 
            }
            return values;
        },


        getUniqueArrayOfValuesInHierarchyAlongDimensionForNode(n = window.required(), dimension = undefined, values = new Set()) {

            if (n.children && n.children.length) {
                n.children.forEach(d => this._getUniqueArrayOfValuesInHierarchyAlongDimension(d, dimension, values));
            }

            return Array.from(values);
        },


        // --- The following methods require a d3 hierarchy ---
        

        _filterOutSmallDescendants(n = window.required('d3 hierarchy node'), min_w = 5, min_h = 5) {

            let big_enough = n.x1 - n.x0 > min_w && n.y1 - n.y0 > min_h;

            if (big_enough && n.children && n.children.length) {
                n.children = n.children.filter(d => this._filterOutSmallDescendants(d, min_w, min_h));
            }

            return big_enough;
        },


        filterOutSmallNodes(n = window.required('d3 hierarchy node'), min_w = 5, min_h = 5) {

            if (n.children && n.children.length) {
                n.children = n.children.filter(d => this._filterOutSmallDescendants(d, min_w, min_h));
            }

            return n;
        },


        getBreadCrumbNodeArrayFromHierarchicalData(datum = window.required('d3 hierarchy node'), key = undefined, node_array = [], ommitted_depths_array = []) {

            if (!ommitted_depths_array.includes(datum.depth)) {
                node_array = [{ name: (!datum.children)? datum.data[key] : datum.data.name, uuid: datum.data.uuid }, ...node_array];
            }
            if (datum.parent && datum.depth > 1) {
                node_array = this.getBreadCrumbNodeArrayFromHierarchicalData(datum.parent, key, node_array, ommitted_depths_array);
            }
            return node_array;
        },


        _getBreadCrumbTextArrayFromHierarchicalData(datum = window.required('d3 hierarchy node'), text_array = [], ommitted_depths_array = []) {

            if (!ommitted_depths_array.includes(datum.depth)) {
                text_array = [datum.data.name, ...text_array];
            }
            if (datum.parent && datum.depth > 1) {
                text_array = this._getBreadCrumbTextArrayFromHierarchicalData(datum.parent, text_array, ommitted_depths_array);
            }
            return text_array;
        },


        getBreadCrumbTextFromHierarchicalData : (datum = window.required('d3 hierarchy node'), text_array = [], ommitted_depths_array = []) =>
            window.akdv.utils_hierarchy._getBreadCrumbTextArrayFromHierarchicalData(datum, text_array, ommitted_depths_array).join('/').replace(/\/\//g,''),


        // by pre-order traversal
        _getFromObjectHierarchyANodeAndDepthWithMatchingUUID(hierarchy = window.required(), d = window.required('d3 hierarchy node'), root_depth = 0) {

            let uuid = d.uuid || d.data.uuid;
            let depth = root_depth + (d.depth || 0);
            let node = (hierarchy.uuid === uuid)? hierarchy : false;

            if (!node) {
                hierarchy.children.some(n => {
                    if (n.uuid === uuid) {
                        node = n;
                    }
                    return (node !== false);
                });
            }

            if (!node) {
                hierarchy.children.some(n => {
                    if (!node && typeof n.children !== 'undefined') {
                        [ node, depth ] = window.akdv.utils_hierarchy._getFromObjectHierarchyANodeAndDepthWithMatchingUUID(n, d, root_depth);
                    }
                    return (node !== false);
                });
            }

            return [ node, depth ];
        },


        getAWrappedLeafAndADepthFromObjectHierarchyWithMatchingUUID(hierarchy = window.required(), d = window.required('d3 hierarchy node'), root_depth = 0) {

            let [ node, depth ] = this._getFromObjectHierarchyANodeAndDepthWithMatchingUUID(...arguments);
            // if the matched node is a leaf then wrap in a parent
            if (!node.children) {
                node = { name: hierarchy.name, uuid: node.uuid, children: [node] };
            }

            return [ node, depth ];
        },


    };


})(window, document, window.d3, window.akdv.utils_data, window.akdv.utils_math, window.akdv.utils_string, window.akdv.utils_event, window.akdv.utils_lang, window.akdv.statusNotifier);