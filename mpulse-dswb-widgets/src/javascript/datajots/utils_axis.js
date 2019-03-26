;((window, document, d3, akdv) => {

    'use strict';

    const AxisOrientation = akdv.AxisOrientation = Object.freeze({HORIZONTAL: 0, VERTICAL: 1});

    akdv.bandedAxisDotFactory = ({
        nodes_array = window.required(),
        dim_key = window.required(),
        d3_banded_scale = window.required(),
        invert_direction = false,
        axis_start = 0,
        axis_end = 0,
        axis_orientation = AxisOrientation.HORIZONTAL,
        axis_bandwidth_min_rems = 1.5,
        axis_bandwidth_padding_rems = 0.025,
        radius_rems = 1

    } = {}) => {


        const config = Object.seal({
            nodes_array,
            dim_key,
            d3_banded_scale,
            invert_direction,
            axis_start,
            axis_end,
            axis_orientation,
            axis_bandwidth_min: window.akdv.utils_css.remsToPixels(axis_bandwidth_padding_rems),
            axis_bandwidth_padding: window.akdv.utils_css.remsToPixels(axis_bandwidth_padding_rems),
            radius: window.akdv.utils_css.remsToPixels(radius_rems),

            banded_dim_key_count: null,
            wrap_range_max: 0
        });

        const initBandedDimKeyCount = (axis_start, axis_end) => {

            const axis_range = Math.ceil(axis_end - Math.abs(axis_start)),
                  length_ticks = Math.ceil(axis_range / config.radius);
            
            config.wrap_range_max = invert_direction ? -axis_range : axis_range;
            config.banded_dim_key_count = Object.seal({
                length_ticks,
                max_offset: 0,
                dim_key_map: new Map(),
                length_scale: d3.scaleLinear().domain([0, length_ticks]).range([axis_start, config.wrap_range_max]),
            });
        };

        const initBandedDimKeyCountMap = (axis_start, axis_end) => {           

            for(let i = 0, l = nodes_array.length; i < l; i++) {
                const d = nodes_array[i],
                    dim_key_count = (config.banded_dim_key_count.dim_key_map.get(d[dim_key]) || config.banded_dim_key_count.dim_key_map.set(d[dim_key], Object.seal({
                        datum_index_map: new WeakMap(),
                        index_count: 0,
                        offset_count: 0,
                        band_width_scale: d3.scaleLinear().domain([0, 0]).range([-config.radius * 0.5, config.radius * 0.5])
                    })).get(d[dim_key]));

                dim_key_count.index_count++;
                
                const translation = (dim_key_count.index_count * config.radius) % config.wrap_range_max;
                
                if (i && translation < config.radius) {
                    const offset_half_width = (dim_key_count.offset_count) * config.radius;

                    dim_key_count.offset_count++;
                    dim_key_count.band_width_scale.domain([0, dim_key_count.offset_count]).range([-offset_half_width, offset_half_width]);
                    config.banded_dim_key_count.max_offset = Math.max(config.banded_dim_key_count.max_offset, dim_key_count.offset_count);
                }

                dim_key_count.datum_index_map.set(d, dim_key_count.index_count - 1);
            }
        };

        const _self = Object.freeze({

            range(domain = window.required()) {

                const length = window.devicePixelRatio * (Math.max(config.axis_bandwidth_min, (config.axis_bandwidth_min + config.radius) * (config.banded_dim_key_count.max_offset * 2)) * domain.length);

                return [length * -0.5, length * 0.5];
            },
            
            axisForce(d) {

                const {offset_count, band_width_scale, datum_index_map} = config.banded_dim_key_count.dim_key_map.get(d[dim_key]),
                      {length_ticks, length_scale} = config.banded_dim_key_count,
                      axis_translation = d3_banded_scale(d[dim_key]) + d3_banded_scale.bandwidth() * 0.5,
                      datum_index = datum_index_map.get(d);

                return config.axis_orientation === AxisOrientation.HORIZONTAL
                    ? [axis_translation + band_width_scale(datum_index % offset_count), length_scale((Math.floor((datum_index / Math.max(1, offset_count)))) % length_ticks)]
                    : [length_scale((Math.floor((datum_index / Math.max(1, offset_count)))) % length_ticks), axis_translation + config.radius + band_width_scale(datum_index % offset_count)];
            },

            update(axis_start, axis_end) {

                if (axis_start !== config.axis_start || axis_end !== axis_end) {
                    initBandedDimKeyCount(axis_start, axis_end);
                    initBandedDimKeyCountMap(axis_start, axis_end);
                }

                return _self;
            }
        });

        if (axis_end > axis_start) {
            _self.update(axis_start, axis_end);
        } else {
            initBandedDimKeyCount(axis_start, axis_end);
        }

        return _self;
    };


})(window, document, window.d3, window.akdv);