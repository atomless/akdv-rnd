;((window, document, THREE, akdv, utils_math) => {

    'use strict';

    const PointSpacing = 2;

    akdv.utils_datajots_pointcloud = {


        setTranslateXY(nodes_array = window.required(), typed_array_item = window.required(), x_dimension = window.required(), y_dimension = window.required()){

            const translate = typed_array_item.typed_array.
                  bounding_box = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));

            for(let i = 0, i3 = 0, l = nodes_array.length; i < l; i++, i3+=3) {
                const node = nodes_array[i];
                translate[i3] = x_dimension.d3_scale(node[x_dimension.properties.by]);
                translate[i3 + 1] = y_dimension.d3_scale(node[y_dimension.properties.by]);
            }

            return new THREE.Box3(new THREE.Vector3(translate[0], translate[1], 0), new THREE.Vector3(translate[nodes_array.length - 2], translate[nodes_array.length-1], 0));
        },

        setTranslateSingleAxis(nodes_array = window.required(), typed_array_item = window.required(), axis_dimension = window.required(), alt_axis_Fn = () => [0, 0]) {

            const translate = typed_array_item.typed_array,
                  side_length = Math.sqrt(nodes_array.length) * PointSpacing,
                  dim_key = axis_dimension.properties.by,
                  current_translate = new THREE.Vector3(),
                  bounding_box = new THREE.Box3();

            for(let i = 0, i3 = 0, l = nodes_array.length; i < l; i++, i3 +=3) {
                const node = nodes_array[i],
                      [x, y] = alt_axis_Fn(node, i, axis_dimension, dim_key);
                translate[i3] = x;
                translate[i3 + 1] = -y;
                current_translate.set(x, y, 0);
                bounding_box.expandByPoint(current_translate);                
            }

            return bounding_box;
        },

        setTranslateSingleBanded(nodes_array = window.required(), typed_array_item = window.required(), dimension = window.required()) {

                const translate = typed_array_item.typed_array,
                      buckets = {},
                      current_translate = new THREE.Vector3(),
                      bounding_box = new THREE.Box3();

                for(let i = 0, l = nodes_array.length; i < l; i++) {
                    const node = nodes_array[i],
                          bucket_key = dimension.d3_scale(node[dimension.properties.by]);
                    buckets[bucket_key] = (buckets[bucket_key] || 0) + 1;
                }     

                const bucket_keys = Object.keys(buckets).sort((a, b) => parseFloat(a) - parseFloat(b));
                let prev_edge = 0;
                for(let i = 0, l = bucket_keys.length, byte_length = 0, byte_offset = 0; i < l; byte_offset += byte_length, i++) {
                    let bucket_key = parseFloat(bucket_keys[i]);
                    const bucket = buckets[bucket_key],
                          length = bucket * typed_array_item.size,
                          side_length = Math.sqrt(bucket) * PointSpacing,
                          diameter = side_length * 2,
                          intersection = prev_edge && (prev_edge - (bucket_key - side_length));

                    if (intersection > 0) {
                        bucket_key += intersection + side_length;
                    }

                    current_translate.set(bucket_key > 0 ? bucket_key + side_length : bucket_key - side_length, diameter, 0);
                    bounding_box.expandByPoint(current_translate);    

                    byte_length = length * translate.BYTES_PER_ELEMENT;
                    prev_edge = bucket_key + side_length;

                    akdv.utils_geometry.pointCloudSpiral(new typed_array_item.typed_array_constructor(translate.buffer, byte_offset, length), side_length, [parseFloat(bucket_key), 0, 0]);
                }

                return bounding_box;
        },

        setTranslateSpiral(nodes_array = window.required(), typed_array_item = window.required(), _scale = 1) {

            const translate = typed_array_item.typed_array;
            
            akdv.utils_geometry.pointCloudGalaxy(new typed_array_item.typed_array_constructor(translate.buffer, 0, nodes_array.length * typed_array_item.size), _scale);

            return new THREE.Box3(new THREE.Vector3(-_scale, -_scale, 0), new THREE.Vector3(_scale, _scale, 0));            
        }
    }
})(window, window.document, window.THREE, window.akdv, window.akdv.utils_math);