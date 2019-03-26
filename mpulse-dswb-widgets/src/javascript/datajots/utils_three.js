;((window, document, THREE, akdv) => {

    'use strict';

    akdv.utils_three = {

        shaderLoad(...url) {

            return Promise.all(url.map((url) => akdv.xmlHTTP.getFile(url)));
        },

        getBox2IntersectRatio(a_box, b_box, _inside_ratio = false) {

            const intersect_area =  Math.max(0, Math.min(a_box.max.x, b_box.max.x) - Math.max(a_box.min.x, b_box.min.x)) * Math.max(0, Math.min(a_box.max.y, b_box.max.y) - Math.max(a_box.min.y, b_box.min.y)),
                a_box_area = ((a_box.max.x - a_box.min.x) * (a_box.max.y - a_box.min.y)),
                b_box_area = ((b_box.max.x - b_box.min.x) * (b_box.max.y - b_box.min.y)),
                union_area = a_box_area + b_box_area - intersect_area;

                return _inside_ratio ? (intersect_area / union_area) : 
                                       (intersect_area / union_area) / (b_box_area / union_area);
        },

        roundUpNearestPower2(value) {

            value--;
            value |= value >> 1;
            value |= value >> 2;
            value |= value >> 4;
            value |= value >> 8;
            value |= value >> 16;
            return ++value;
        }
    }
})(window, window.document, window.THREE, window.akdv);