;((window, document, $, THREE, akdv, utils_obj, utils_three) => {

    'use strict';

    window.akdv.initParticleFBO = ({
        width = 512,
        height = 512,        
        render_camera = window.required('render_camera', 'THREE.Camera'),
        scene_scale = 1,
        receive_shadows = true,
        cast_shadow = true,
        particle_base_size = 1,
        particle_fragment_shader_url,
        uniforms = {}
    } = {}) => {

        const config = Object.seal({
            width,
            height,
            render_camera,
            scene_scale,
            receive_shadows,
            cast_shadow,
            particle_base_size,
            particle_fragment_shader_url,
            particle_vertex_shader_url: '../shaders/particle_render.vert',
            particle_depth_vertex_shader_url: '../shaders/particle_depth.vert',
            particle_vertex_shader_text: '',
            particle_fragment_shader_text: '',
            particle_depth_vertex_shader_text: '',
            particle_material: null,
            buffer_geometry: null,
            mesh: null,
            init_color: new THREE.Color(0.95, 0.975, 1, 0.9),
            fade_color: new THREE.Color(0.65, 0.675, 1, 0.5),
            flipping_triangle: false,
            container: new THREE.Object3D(),
            resources_loaded: false
        });

        const _self = {
            init() {
              
                return this.loadResources().then(() => {
                    this.initDrawing();
                });
            },

            loadResources() {

                return !config.resources_loaded ? utils_three.shaderLoad(config.particle_vertex_shader_url, config.particle_fragment_shader_url, config.particle_depth_vertex_shader_url)
                    .then(([particle_vertex_shader, particle_fragment_shader, particle_distance_shader]) => {

                        config.particle_vertex_shader_text = particle_vertex_shader;
                        config.particle_fragment_shader_text = particle_fragment_shader;
                        config.particle_depth_vertex_shader_text = particle_distance_shader;
                        config.resources_loaded = true;
                    }) : Promise.resolve();
            },

            initDrawing() {

                const width = config.width,
                      height = config.height;

                if (config.flipping_triangle) {
                    // Flipping triangled particle
                    throw 'TODO: flipping triangle';
                } else {
                    // Standard particle
                    const size = width * height * 3,
                          position = new Float32Array(size);

                    for(let i = 0, i3 = 0; i < size; i++ ) {
                        i3 = i * 3;
                        position[i3] = (i % width) / width;
                        position[i3 + 1] = ~~(i / width) / height;
                    }

                    config.buffer_geometry = new THREE.BufferGeometry();
                    config.buffer_geometry.addAttribute('position', new THREE.BufferAttribute(position, 3));

                    config.particle_material = new THREE.ShaderMaterial({
                        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, {
                                textureTranslate: { type: 't', value: null },
                                textureColor: { type: 't', value: null },
                                diffuse: { type: 'c', value: new THREE.Color(0xffffff) },
                                initColor: { type: 'c', value: config.init_color },
                                fadeColor: { type: 'c', value: config.fade_color },
                                opacity: { type: "f", value: 1.0 },
                                pointSize: { type: "f", value: config.particle_base_size },
                                sceneSize: { type: "f", value: config.scene_scale }
                            }
                        ]),
                        lights: true,
                        vertexShader: config.particle_vertex_shader_text,
                        fragmentShader: config.particle_fragment_shader_text,
                        blending: THREE.NoBlending,
                    });

                    config.mesh = new THREE.Points(config.buffer_geometry, config.particle_material);
                    config.mesh.castShadow = config.cast_shadow;
                    config.mesh.receiveShadow = config.receive_shadows;

                    config.mesh.customDistanceMaterial = new THREE.ShaderMaterial({
                        uniforms: THREE.UniformsUtils.merge([THREE.ShaderLib.distanceRGBA.uniforms, config.particle_material.uniforms]),
                        vertexShader: config.particle_depth_vertex_shader_text,
                        fragmentShader: THREE.ShaderLib.distanceRGBA.fragmentShader,
                        side: THREE.DoubleSide,
                        blending: THREE.NoBlending
                    });

                    config.mesh.customDepthMaterial = new THREE.ShaderMaterial({
                        uniforms: THREE.UniformsUtils.merge([THREE.ShaderLib.depth.uniforms, config.particle_material.uniforms]),
                        vertexShader: config.particle_depth_vertex_shader_text,
                        fragmentShader: THREE.ShaderLib.depth.fragmentShader,
                        side: THREE.DoubleSide,
                        blending: THREE.NoBlending
                    });

                    config.mesh.customDepthMaterial.depthPacking = THREE.RGBADepthPacking;
                    
                    config.container.add(config.mesh);
                }
            },

            setSize(width, height) {

                if (isNaN(width) || isNaN(height)) {
                    throw 'Invalid setSize parameters.'
                }

                config.width = width;
                config.height = height;
                this.initDrawing();
            },

            set textureTranslate(target) {

                config.particle_material.uniforms.textureTranslate.value = target;
                config.mesh.customDistanceMaterial.uniforms.textureTranslate.value = target;
                config.mesh.customDepthMaterial.uniforms.textureTranslate.value = target;
            },

            get textureTranslate() {

                return config.particle_material.uniforms.textureTranslate.value;
            },

            set textureColor(target) {

                config.particle_material.uniforms.textureColor.value = target;
                config.mesh.customDistanceMaterial.uniforms.textureColor.value = target;
                config.mesh.customDepthMaterial.uniforms.textureColor.value = target;
            },

            get textureColor() {

                return config.particle_material.uniforms.textureTranslate.value;
            },

            get container() {

                return config.container;
            },

            get boundingSphere() {

                return config.buffer_geometry.boundingSphere;
            }
        };

        return _self.init().then(() => Promise.resolve(Object.seal(Object.assign(utils_obj.extractGetterSetter(_self), utils_obj.bindAll(_self, {
            setSize: _self.setSize
        })))));
    }
})(window, window.document, window.jQuery, window.THREE, window.akdv, window.akdv.utils_obj, window.akdv.utils_three);