;((window, document, $, crossfilter, event_utils, data_utils, lang_utils, validate, statusNotifier) => {

    'use strict';
    

    window.dataProviderFactory = ({
        event_namespace_for_data_update = window.required(),
        data_dimension_filters_array = [
            /* 
            { name: 'mediatype', type: 'categorical', filter_function: false, filtered_array: ['html'] },
            { name: 'loadtime', type: 'linear', filter_function: false, filtered_array: [-Infinity, Infinity] }
            */
        ],
        data_required_result_keys = [],
        filter_on_event = true, // optionally set to false to avoid filtering on events (used by non bucketed hierarchy charts)
        meta = {}
    } = {}) => {

        const default_linear_filtered_array = [-Infinity, Infinity];

        const xf = crossfilter({});

        for (const dimension of data_dimension_filters_array) {
            dimension.xfilter = xf.dimension(d => d[dimension.name]);
            dimension.filter_function = dimension.filter_function || (dimension.type === 'categorical') 
                // use default linear or categorical filter functions if none defined
                ? d => dimension.filtered_array.indexOf(d) > -1
                : d => (validate.isObject(d) && d.buckets)
                    // if result is an array of results or an array of bucket counts don't filter at this point as it will mess up percentile calcs
                    // and hiearchical dat ais filtered post hierarchy transform by calling applyFiltersToChildrenOfNode below
                    ? true 
                    : (validate.isNumber(d))? d >= dimension.filtered_array[0] && d <= dimension.filtered_array[1] : false;
        }


        const filter_map = data_dimension_filters_array.reduce((m, f) => { m[f.name] = f; return m; }, {});


        const valid = (result) => {

            if (!result || !result.data) {
                window._log.warn('update data triggered without data');
                return;
            }

            if (Array.isArray(result.data) && result.data.length < 1) {
                statusNotifier.noData();
                return;
            }

            if (data_required_result_keys.length && !validate.objectsInArrayHaveRequiredKeys(result.data, data_required_result_keys)) {
                statusNotifier.setError({ 
                    title: lang_utils.getLocalizedHTMLString('Error', 'AKDV.Errors'),
                    description: lang_utils.getLocalizedHTMLString('InvalidData', 'AKDV.Errors')
                });
                throw `ERROR : RESULT DATA ENTRY MISSING ONE OR MORE OF REQUIRED KEYS : ${data_required_result_keys.join(',')}`;
            }
        };


        const isAnyDimensionFiltered = () => data_dimension_filters_array.filter(f => 
                f.filtered_array.length > 0 && f.filtered_array !== default_linear_filtered_array
            ).length > 0;


        const getDimensionFilterByName = (name) => {

            let dimension_filter = data_utils.filterToDatumWithPropsWithValuesOf(data_dimension_filters_array, 'name', name).pop();

            if (!dimension_filter) {
                window._log.debug2(`Data Provider ${event_namespace_for_data_update} - received a dimension filter update with an unrecognised name: ${name}`);
            }

            return dimension_filter;
        };


        const getFiltersMappedToDimensionName = () => {

            const map = {};

            data_dimension_filters_array.forEach(dimension => map[dimension.name] = dimension);

            return map;
        };


        const applyFiltersToChildrenOfNode = (n, parent, dimensions_to_filter = []) => {

            let filtered = false;

            if (n.children && n.children.length > 0) {
                n.children.some(d => applyFiltersToChildrenOfNode(d, n, dimensions_to_filter));
            } else if (
                parent.children.length 
                && (dimensions_to_filter.length || Object.keys(parent.children[0]).filter(p => (p.indexOf('-buckets') > -1)).length)
            ) {

                let keys_to_filter = [];

                parent.children = parent.children.filter(d => {
                    
                    keys_to_filter = (keys_to_filter.length)
                        ? keys_to_filter
                        : Object.keys(parent.children[0]).filter(p => (dimensions_to_filter.includes(p) || d.hasOwnProperty(`${p}-buckets`)));

                    return !keys_to_filter.some(p => {
                        let f = filter_map[p];
                        return (f && f.filtered_array.length)? !f.filter_function(d[p]) : false;
                    });
                });

                filtered = true;
            }

            return filtered;
        };


        const applyFiltersToHierarchicalData = (n, dimensions_to_filter) => {

            if (isAnyDimensionFiltered() && n.children && n.children.length > 0) {
                applyFiltersToChildrenOfNode(n, n, dimensions_to_filter);
            }

            return n;
        };


        const clearFilterOnDimension = (dimension) => {
            dimension.xfilter.filterAll();
            dimension.filtered_array = (dimension.type === 'categorical')? [] : default_linear_filtered_array;
        };


        const clearAllFilters = () => {

            for (const dimension of data_dimension_filters_array) {
                delete dimension.bucketed;
                clearFilterOnDimension(dimension);
            }
        };


        const clear = () => {

            clearAllFilters();
            if (xf.size()) {
                xf.remove();
            }
        };


        const update = (result) => {

            valid(result);
            clear();

            if (result.meta) {
                meta = $.extend(true, {}, meta, result.meta);
            }

            if (result.bucket_values) {
                meta.bucket_values = $.extend(true, {}, result.bucket_values);

                for (const bucketed_dimension of Object.keys(meta.bucket_values)) {
                    getDimensionFilterByName(bucketed_dimension).bucketed = true;
                }
            }

            xf.add(result.data);

            meta.result_item_keys = Object.keys(result.data[0]);

            window.requestAnimationFrame(f => 
                event_utils.dispatchCustomEvent(window, 'data-updated', event_namespace_for_data_update, { data: $.extend(true, [], xf.all()), data_filtered: $.extend(true, [], xf.allFiltered()), meta })
            );
        };


        const updateFilters = (filters_array = []) => {

            for (const f of filters_array) {

                let dimension = getDimensionFilterByName(f.name);

                if (f.filtered_array && Array.isArray(f.filtered_array) && f.filtered_array.length) {
                    dimension.filtered_array = f.filtered_array;
                    if (filter_on_event) {
                        dimension.xfilter.filter(dimension.filter_function);
                    }
                } else {
                    clearFilterOnDimension(dimension);
                }
            }
        };


        const onFilterChange = (e, filters) => {

            updateFilters(Array.isArray(filters)? filters : [filters]);

            window.requestAnimationFrame(f => 
                event_utils.dispatchCustomEvent(window, 'filter-changed', event_namespace_for_data_update, { data: $.extend(true, [], xf.all()), data_filtered: $.extend(true, [], xf.allFiltered()) })
            );
        };


        $(window).on(`filter-change.${event_namespace_for_data_update}`, onFilterChange);


        return {

            clear,
            update,
            clearAllFilters,
            applyFiltersToHierarchicalData,

            all: () => $.extend(true, [], xf.all()),
            allFiltered: () => $.extend(true, [], xf.allFiltered()),
            size: () => xf.size(),

            get filters() { return getFiltersMappedToDimensionName(); },
            get meta() { return meta; }

        };
    };


})(window, document, window.jQuery, window.crossfilter,
   window.akdv.utils_event, window.akdv.utils_data, window.akdv.utils_lang, window.akdv.validate, window.akdv.statusNotifier);