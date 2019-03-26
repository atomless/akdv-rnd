;((window, document, THREE, akdv, utils_math) => {

    'use strict';

    akdv.utils_geometry = {

            getRandomPoint(vertex3, _scale = 1) {

                vertex3.x = Math.random() * 2 - 1 ;
                vertex3.y = Math.random() * 2 - 1 ;
                vertex3.z = Math.random() * 2 - 1 ;
                
                return (vertex3.length() > 1) ? this.getRandomPoint(vertex3, _scale) : vertex3.normalize().multiplyScalar(_scale);
            },

            pointCloudFillData(data, value) {

                let len = data.length;
                
                while(len--) {
                    data[len] = value;
                }

                return data;
            },

            pointCloudRandomData(data, _scale = 1) {

                let len = data.length;
                
                while(len--) {
                    data[len] = (Math.random() * 2 - 1) * _scale;
                }

                return data;
            },

            pointCloudSphere(data, _scale) {

                const len = data.length,
                      p = new THREE.Vector3();

                for(var i = 0; i < len; i+=3) {
                    this.getRandomPoint(p, _scale);
                    data[i] = p.x;
                    data[i + 1] = p.y;
                    data[i + 2] = p.z;
                }

                return data;
            },

            pointCloudSpiral(data, _scale_axis = new THREE.Vector3(1, 1, 1), _offset = new THREE.Vector3(0, 0, 0)) {

                if (!isNaN(+_scale_axis)) {
                    _scale_axis = new THREE.Vector3(_scale_axis, _scale_axis, _scale_axis);
                } else if(Array.isArray(_scale_axis)) {
                    _scale_axis = new THREE.Vector3(..._scale_axis);
                }
                
                if(Array.isArray(_offset)) {
                    _offset = new THREE.Vector3(..._offset);
                }

                // Vogel's method
                const len = data.length,
                      p = new THREE.Vector3();

                const golden_angle = Math.PI * (3 - Math.sqrt(5)),
                      sqrt_total = Math.sqrt(len);

                for(var i = 0; i < len; i+=3) {
                    const theta = i * golden_angle;
                    const r = Math.sqrt(i) / sqrt_total;
                    data[i] = _offset.x + r * Math.cos(theta) * _scale_axis.x;
                    data[i + 1] = _offset.y + r * Math.sin(theta) * _scale_axis.y;
                    if (_scale_axis.z !== 0) {
                        data[i + 2] = _offset.z + (Math.random() * 2 - 1) * _scale_axis.z;
                    }
                }

                return data;
            },

            pointCloudGalaxy(data, _scale_axis = new THREE.Vector3(1, 1, 1), _offset = new THREE.Vector3(0, 0, 0), {
                arm_count = 5,
                arm_offset_max = 1,
                arm_spin = 5,
                scatter = 0.04
            } = {}) {

                if (!isNaN(+_scale_axis)) {
                    _scale_axis = new THREE.Vector3(_scale_axis, _scale_axis, _scale_axis);
                } else if(Array.isArray(_scale_axis)) {
                    _scale_axis = new THREE.Vector3(..._scale_axis);
                }
                
                if(Array.isArray(_offset)) {
                    _offset = new THREE.Vector3(..._offset);
                }

                const len = data.length,
                      golden_angle = Math.PI * (3 - Math.sqrt(5)),
                      arm_separation = 2 * Math.PI / arm_count,
                      arm_offset_half_max = arm_offset_max * 0.5,
                      pi2 = 2 * Math.PI;

                for(var i = 0; i < len; i+=3) {
                    const r = Math.pow(Math.random(), 2),
                          arm_rotation = r * arm_spin,
                          offset = (((Math.random() * arm_offset_max) - arm_offset_half_max) / r),
                          offset2 = (offset > 0 ? Math.pow(offset, 2): -Math.pow(offset, 2)),
                          theta = Math.floor((i * golden_angle) / arm_separation) * arm_separation + (offset2 + arm_rotation);
                    
                    data[i] = _offset.x + r * (Math.cos(theta) - (r * scatter)) * _scale_axis.x;
                    data[i + 1] = _offset.y + r * (Math.sin(theta) - (r * scatter)) * _scale_axis.y;
                    data[i + 2] = (Math.random() - 0.5) * scatter * _scale_axis.z * (1 - r);
                }
            },

            pointCloudObjMesh(data, mesh_url, _scale = 1) {

                return new Promise((resolve) => {
                    
                    new THREE.OBJLoader().load(mesh_url, (group, attr = 'position') => {

                        const len = data.length,
                              vert = new THREE.Vector3();

                        let vertices = [];
                        for (let i = 0; i < group.children.length; i++) {
                            vertices = [...vertices, ...Array.from(group.children[i].geometry.attributes[attr].array)];
                        }

                        for (let j = 0, vl = Math.min(len, vertices.length); j < vl; j++) {
                            vert.set(vertices[j], vertices[j + 1], vertices[j + 2]);
                            if (_scale !== 1) {
                                vert.multiplyScalar(_scale);
                            }

                            data[j] =  vert.x;
                            data[j + 1] = vert.y;
                            data[j + 2] = vert.z;
                        }

                        resolve(data);
                    });
                });
            }
    }
})(window, window.document, window.THREE, window.akdv, window.akdv.utils_math);