;((window, document, $, THREE, akdv, obj_utils, three_utils, rendererMixin, cameraMixin, lightRigMixin) => {

    'use strict';

    akdv.initManyNodeGeoInstancingRenderer = ({
        width = window.innerWidth,
        height = window.innerHeight,
        accessor_x = 'x',
        accessor_y = 'y',
        accessor_radius = 'radius',
        accessor_color = 'color',
        sprite_map_path = '../images/sprites/circle.png',
        camera_alignment = akdv.CameraAligmentTypes.BOUNDS,
        camera_bounds_fit_scale = 0.9,
        canvas,
        buffer_geometry,
        material,
        node_array
    } = {}) => {

        const state = Object.seal({
            width,
            height,
            canvas,
            node_array,
            accessor_x,
            accessor_y,
            accessor_radius,
            accessor_color,
            sprite_map_path,
            camera_alignment,
            camera_bounds_fit_scale,
            vertex_shader_url: '../shaders/instanced_disc.vert',
            fragment_shader_url: '../shaders/instanced_disc.frag',
            vertex_shader_text: '',
            fragment_shader_text: '',
            scene: null,
            camera: null,
            renderer: null,
            instanced_geometry: null,
            buffer_geometry: null,
            material: null,
            mesh: null,
            bounding_box: new THREE.Box3()
        });

        const _self = obj_utils.extend({},
            rendererMixin(state),
            cameraMixin(state), {

            init() {    

                state.scene = new THREE.Scene();

                this.renderer = new THREE.WebGLRenderer({
                    canvas: canvas,
                    alpha: true
                });

                this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 1000);
                this.camera.position.z = 500;
                state.renderer.setPixelRatio(window.devicePixelRatio);
                state.renderer.setSize(width, height);
    
                return this.loadResources().then(() => {

                    this.initDrawing(buffer_geometry, material);
                    this.setData(node_array);

                    if (state.light_rig_enable) {
                        this.initLightRig(state.renderer, state.scene, state.light_rig_settings);
                    }
                });
            },

            loadResources() {

                return state.material instanceof THREE.Material ? Promise.resolve() : three_utils.shaderLoad(state.vertex_shader_url, state.fragment_shader_url)
                    .then(([vertex_shader, fragment_shader]) => {

                        state.vertex_shader_text = vertex_shader;
                        state.fragment_shader_text = fragment_shader;
                    });
            },

            initDrawing({
                buffer_geometry = new THREE.PlaneBufferGeometry(2, 2),
                material = new THREE.RawShaderMaterial({
                    uniforms: {
                        map: {
                            value: new THREE.TextureLoader().load(state.sprite_map_path)
                        },
                        time: {
                            value: 0.0
                        }
                    },
                    vertexShader: state.vertex_shader_text,
                    fragmentShader: state.fragment_shader_text,
                    depthTest: true,
                    depthWrite: true
                })
            } = {}) {

                state.buffer_geometry = buffer_geometry;
                state.material = material;

                state.instanced_geometry = new THREE.InstancedBufferGeometry();
                state.instanced_geometry.index = state.buffer_geometry.index;
                state.instanced_geometry.attributes = state.buffer_geometry.attributes;

                state.mesh = new THREE.Mesh(state.instanced_geometry, state.material);
                state.mesh.scale.set(1, 1, 1);

                state.scene.add(state.mesh);
            },

            setData(data = []) {

                if (!Array.isArray(data)) {
                    throw 'Invalid data parameter.';
                }

                state.node_array = data;

                const count = state.node_array.length;
                state.instanced_geometry.addAttribute('translate', new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3, 1));
                state.instanced_geometry.attributes.translate.array.fill(-2.5);
                state.instanced_geometry.addAttribute('radius', new THREE.InstancedBufferAttribute(new Float32Array(count), 1, 1));
                state.instanced_geometry.attributes.radius.array.fill(1);
                state.instanced_geometry.addAttribute('color', new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3, 1));
                state.instanced_geometry.attributes.color.array.fill(1);
                state.instanced_geometry.setDrawRange( 0, count );
            },

            tick() {

                const translate_attribute = state.instanced_geometry.attributes.translate,
                      radius_attribute = state.instanced_geometry.attributes.radius,
                      color_attribute = state.instanced_geometry.attributes.color,
                      current_position = new THREE.Vector3();
                
                state.bounding_box.makeEmpty();

                for (let i = 0, i3 = 0, l = state.node_array.length; i < l; i++, i3 += 3) {
                    const node = state.node_array[i],
                          color = node[state.accessor_color];
                    
                    translate_attribute.array[i3] = node[state.accessor_x];
                    translate_attribute.array[i3 + 1] = -node[state.accessor_y];

                    color_attribute.array[i3] = color[0];
                    color_attribute.array[i3 + 1] = color[1];
                    color_attribute.array[i3 + 2] = color[2];

                    radius_attribute.array[i] = node[state.accessor_radius];

                    current_position.set(translate_attribute.array[i3], translate_attribute.array[i3 + 1], 0);
                    state.bounding_box.expandByPoint(current_position);
                }
                    
                translate_attribute.needsUpdate = true;
                radius_attribute.needsUpdate = true;
                color_attribute.needsUpdate = true;

                if (state.instanced_geometry.boundingSphere) {
                    state.bounding_box.getBoundingSphere(state.instanced_geometry.boundingSphere);
                }
                
                this.cameraAlign();

                this.render();
            },

            render() {

                var time = performance.now() * 0.0005;
                state.material.uniforms.time.value = time;
                state.renderer.render(state.scene, this.camera);
            }
        });

        return _self.init().then(() => Promise.resolve(obj_utils.factoryExports(_self, {
            init: _self.init,
            initDrawing: _self.initDrawing,
            setData: _self.setData,
            setSize: _self.setSize,
            tick: _self.tick
        })));
    }
})(window, window.document, window.jQuery, window.THREE, window.akdv, window.akdv.utils_obj, window.akdv.utils_three, window.akdv.rendererMixin, window.akdv.cameraMixin, window.akdv.lightRigMixin);