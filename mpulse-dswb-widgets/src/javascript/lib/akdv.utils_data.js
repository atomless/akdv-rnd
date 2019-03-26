;((window, document, d3, math_utils) => {

    'use strict';
  

    const data_utils = window.akdv.utils_data = {


        parseNumbersInObject : (d) => Object.entries(d).reduce((obj, kvp) => { obj[kvp[0]] = +kvp[1] || ((kvp[1] === '0')? 0 : kvp[1]); return obj; }, {}),


        getValueAsNumberOrFallbackValue : (n, fallback_value = 0) => (['string', 'number'].includes(typeof n) && Number(+n) === +n)? +n : fallback_value,


        processEach : (promiseProcessFn, [first_item, ...rest_of_array]) => (!first_item)
            ? Promise.resolve() 
            : promiseProcessFn(rest_of_array).then(window.akdv.utils_data.processEach(promiseProcessFn, rest_of_array)),


        filterToDatumWithPropsWithValuesOf : (data_array, p, v) => data_array.filter(d => d[p] === v),


        hasDatumWithPropWithValueOf : (data_array, p, v) => data_array.some(d => d[p] === v),


        getDifferenceArrayFromNumericalArray : (arr) => arr.slice(1).map((n, i) => n - arr[i]),


        getUniqueListOfValuesFromDataArrayForProp : (data_array, prop) => Array.from(data_array.reduce((val_set, datum) => val_set.add(datum[prop]), new Set())),


        getfileExtension : (filename) => filename.split('.').splice(-1).pop().toLowerCase(),


        getArrayFromMinToMaxWithSpecifiedSteps : (min, max, steps) => Array(steps).fill(min, 0, steps).map((d, i) => d + ((max - min) / (steps - 1)) * i),


        getArrayFromMinToMax : (min, max) => data_utils.getArrayFromMinToMaxWithSpecifiedSteps(min, max, 1 + Math.ceil(max - min)),


        getKeysInDatumWithNumericalValues : (d, keys_to_exclude = []) => Object.entries(d).filter(d => !keys_to_exclude.includes(d[0]) && Number(d[1]) === d[1]).map(d => d[0]),


        indexOfValueInAscendingArrayWithStep(arr, v, step) {

            let index = -1;

            arr.some((d, i) => {
                if (v === d || d < v && d + step > v) {
                    index = i;
                    return true;
                }
                if (d > v) {
                    index = i - 1;
                    return true;
                }
                return false;
            });

            return index;
        },


        uniqueArray : (arr) => Array.from(new Set(arr)),


        arraysIntersection : (array1, array2) => window.akdv.utils_data.uniqueArray(array1.filter(v => array2.indexOf(v) !== -1)),


        arraysNotIntersection : (array1, array2) => window.akdv.utils_data.uniqueArray([...array1.filter(v => array2.indexOf(v) === -1), ...array2.filter(v => array1.indexOf(v) === -1)]),


        firstNonZeroIndexInArray : (arr) => arr.findIndex(d => d > 0),


        percentileOfBuckets(bucket_counts_array = window.required(), bucket_values_array = window.required(), kth_percentile = 50) { 
            
            if (!bucket_counts_array.length) {
                window._log.warn('Cannot calculate percentile. bucket_counts_array must not be empty.');
                return;
            }

            if (bucket_counts_array.length > bucket_values_array.length) {
                bucket_counts_array.splice(bucket_values_array.length);
                window._log.warn('bucket_counts_array length is greater than bucket_values_array length. Splicing.');
            }

            if (kth_percentile > 99) {
                return bucket_values_array[this.getMaxBucketIndexWithEntries(bucket_counts_array)];
            }

            if (bucket_counts_array.length > bucket_values_array.length) {
                bucket_counts_array.splice(bucket_values_array.length);
            }

            let bucket_entries_sum = bucket_counts_array.reduce((sum, c) => sum + c, 0);

            if (kth_percentile < 1 || bucket_entries_sum < 2) {
                return bucket_values_array[this.firstNonZeroIndexInArray(bucket_counts_array)];
            }

            let bucket_entries_percentile = kth_percentile * 0.01 * bucket_entries_sum;
            let bucket_entries_cumulative_sum = 0;
            let bucket_slice, prev_bucket_value = 0, percentile;

            bucket_counts_array.some((c, i) => {
                prev_bucket_value = ((i === 0)? 0 : bucket_values_array[Math.max(0, i - 1)]);
                if (bucket_entries_percentile < bucket_entries_cumulative_sum + c) {
                    bucket_slice = math_utils.safeQuotient(Math.abs(prev_bucket_value - bucket_values_array[i]), c);
                    percentile = prev_bucket_value + (bucket_slice * (bucket_entries_percentile - bucket_entries_cumulative_sum));
                    return true;
                }
                bucket_entries_cumulative_sum += c;
                return false;
            });

            return percentile;
        },


        percentileOfBucketedDimension(data = window.required(), bucketed_dimension_key = window.required(), bucket_values_array = window.required(), kth_percentile = 50) {

            let summed_buckets = data.reduce((b, d) => b = b.map((v, i) => v + d[bucketed_dimension_key].buckets[i]), Array(data[0][bucketed_dimension_key].buckets.length).fill(0));

            return this.percentileOfBuckets(summed_buckets, bucket_values_array, kth_percentile);
        },


        getMaxBucketIndexWithEntries : (bucket_array) => bucket_array.reduce((max_index, d, i) => (d > 0)? Math.max(i, max_index) : max_index, 0),


        getMaxBucketIndexWithEntriesFromData : (data, dimension) => data.reduce((v, d, i) => { return (d[dimension].buckets.reduce((iv, b, j) => { return (b > 0)? Math.max(j, iv) : iv; }, v)); }, 0),


        // currently unused, and un-unit tested (Jan 2019)
        getMaxModeBucketIndexFromData : (data_array, dimension) => 
            data_array.reduce((v, d, i) => {
                let m = d[dimension].buckets.reduce((iv, b, j) => {
                    return (b > iv.d_max_entries && j > iv.max_mode_index)? { d_max_entries: b, max_mode_index: j } : iv
                }, v);
                return m;
            },
            { d_max_entries: 0, max_mode_index: 0 }).max_mode_index,


        mergeObjectsInArraysByKey : (a, b, key) => 
            a.map(a_item => {
                const matched_item = b.find(b_item => a_item[key] && b_item[key] && a_item[key] === b_item[key]);
                return matched_item ? {
                    ...a_item, 
                    ...matched_item
                } : a_item;
            }),


        appendUniqueObjectsInArraysByKey : (a, b, key) => {
            
            const unique_arr = b.filter(b_item => b_item.hasOwnProperty(key) && !a.find(a_item => a_item[key] === b_item[key]));

            return [...a, ...unique_arr];
        },


        parseDSVToJSON(data, format = 'tsv') {

            let json_data = false;

            switch(format) {
                case 'tsv':
                    json_data = d3.tsvParse(data, this.parseNumbersInObject);
                break;
                case 'csv':
                    json_data = d3.csvParse(data);
                break;
            }
            delete json_data.columns;
            return json_data;
        },


        objectsArrayToDSV(object_array = window.required(), format = 'CSV') {

            if (!Array.isArray(object_array) || !object_array.length || !Object.keys(object_array[0]).length) {
                throw new TypeError('Invalid object array data.');
            }

            const column_delimiter = (format.toLowerCase() === 'tsv')? '\t' : ',';
            const line_delimiter = '\n';
            const keys = Object.keys(object_array[0]);

            let DSV = keys.join(column_delimiter) + line_delimiter;

            object_array.forEach(function(datum) {
                keys.forEach(function(key, index) {
                    if (index > 0) {
                        DSV += column_delimiter;
                    }
                    DSV += datum[key];
                });
                DSV += line_delimiter;
            });

            return DSV;
        },


        transformSchemaAlpha({ chart_group, meta, columns, columns_index, columns_buckets, columns_units = {} } = {}) {

            if(!window.akdv.validate.objHasRequiredKeys(arguments[0], ['chart_group', 'meta', 'columns', 'columns_index'])) {
                return
            }

            columns_buckets = columns_buckets? columns_buckets : false;

            return {
                chart_group,
                meta,
                ...columns_buckets && { bucket_values: columns_buckets },
                units: columns_units,
                data: columns[0].map((c, i) => 

                    columns_index.reduce((datum, col, row) => {

                        datum[col] = (columns_buckets[col])
                            ? { buckets: columns[row][i] } // list of buckets containing the count of results in each
                            : columns[row][i];

                        return datum;
                    }, {})
                )
            }
        },


        normalizeResultSchema(data) {

            return (data.transform_schema && this[`transformSchema${data.transform_schema}`])
                ? this[`transformSchema${data.transform_schema}`](data)
                : data;
        },


        objectMatch(obj1, obj2) {
            return JSON.stringify(obj1) === JSON.stringify(obj2);
        },
        

        removeArrayElemByIndex(arr = window.required(), index = window.required()) {
            let tempArr = arr.slice(0); // take a copy
            tempArr.splice(index,1);
            return tempArr;
        }

    };


})(window, document, window.d3, window.akdv.utils_math);