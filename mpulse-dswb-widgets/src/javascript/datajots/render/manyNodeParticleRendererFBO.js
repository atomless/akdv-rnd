;((window, document, $, THREE, TWEEN, akdv, obj_utils, three_utils, scene_utils, geometry_utils, typed_array_utils, cameraMixin, lightRigMixin) => {

    'use strict';

    akdv.initManyNodeParticleRendererFBO = ({
        width = window.innerWidth,
        height = window.innerHeight,
        data_length = window.required(),
        spin_z_speed = 0.025,
        camera_alignment = akdv.CameraAligmentTypes.BOUNDS,
        camera_bounds_fit_scale = 0.9,
        transition_duration = 2000,
        canvas = window.required(),
        material
    } = {}) => {

        const state = Object.seal({
            width,
            height,
            data_length,
            data_side_length: Math.ceil(Math.sqrt(data_length)),
            canvas,
            spin_z_speed,
            camera_alignment,
            camera_bounds_fit_scale,
            simulation_vertex_shader_url: '../shaders/ortho.vert',
            simulation_fragment_shader_url: '../shaders/particle_position_morph.frag',            
            particle_fragment_shader_url: '../shaders/particle_render.frag',
            light_rig_enable: true,
            light_rig_settings: {},
            tween: Object.seal({
                instance: null,
                alpha: 0,
                running: false,
                duration: transition_duration
            }),
            translate_data_array: null,
            radius_data_array: null,
            color_data_array: null,
            scene: null,
            camera: null,
            renderer: null,
            instanced_geometry: null,
            buffer_geometry: null,
            material: null,
            mesh: null,
            translate_simulationFBO: null,
            color_simulationFBO: null,
            particleFBO: null,
            light_rig: null,
            bounding_box: new THREE.Box3()
        });

        const _self = obj_utils.extend({},

            cameraMixin(state),

            lightRigMixin(state), {

            async init() {

                this.bindEventHandlers();

                state.scene = new THREE.Scene();
              
                state.renderer = new THREE.WebGLRenderer({
                    canvas: canvas,
                    alpha: true
                });

                this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 1000);
                state.camera.position.z = 500;

                //this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20000);
                //state.camera.position.set(0, 2000, -3700);
                //state.camera.lookAt(0, 0, 0);

                state.renderer.setPixelRatio(window.devicePixelRatio);
                state.renderer.setSize(width, height);

                await this.initSimulation();
                await this.initDrawing();
           
                if (state.light_rig_enable) {
                    this.initLightRig(state.renderer, state.scene, state.light_rig_settings);
                    state.light_rig.rig.rotateY(THREE.Math.degToRad(100));
                }

                state.tween.instance = new TWEEN.Tween(state.tween)
                    .easing(TWEEN.Easing.Quadratic.InOut)
                    .onStart(() => state.tween.running = true);
                    //.onComplete(() => state.tween.running = false);

                //const controls = new THREE.OrbitControls(state.camera, state.renderer.domElement);
/*
                var geometry = new THREE.PlaneGeometry(14000, 14000, 10, 10);
                var metalMaterial = new THREE.MeshPhongMaterial({
                color: new THREE.Color(0.95, 0.975, 1, 0.9),
                    shininess: 1
                });

                var floor = new THREE.Mesh(geometry, metalMaterial);
                floor.rotation.x = THREE.Math.degToRad(-90);
                floor.position.y = -800;
                floor.castShadow = false;
                floor.receiveShadow = true;

                state.scene.add(floor);

                var sphere = new THREE.IcosahedronGeometry(200, 3);
  
                var sphereMesh = new THREE.Mesh(sphere, metalMaterial);
                //sphereMesh.position.y = 250;
                //sphereMesh.position.x = -2000;
                sphereMesh.position.z = 200;
                sphereMesh.castShadow = true;
                sphereMesh.receiveShadow = true;
                sphereMesh.renderOrder = 1;            
                
                state.scene.add(sphereMesh);
*/
                return true;
            },

            initSimulation () {

                return Promise.all([
                    akdv.initSimulationFBO({
                        width: state.data_side_length,
                        height: state.data_side_length,
                        format: THREE.RGBFormat,
                        camera: state.camera,
                        renderer: state.renderer,
                        vertex_shader_url: state.simulation_vertex_shader_url,
                        fragment_shader_url: state.simulation_fragment_shader_url,
                        uniforms: {
                            textureA: { type: "t", value: null },
                            textureB: { type: "t", value: null },
                            timer: { type: "f", value: 0}
                        }
                    }).then((instance) => {
                        state.translate_simulationFBO = instance;
                    }),
                        akdv.initSimulationFBO({
                        width: state.data_side_length,
                        height: state.data_side_length,
                        format: THREE.RGBFormat,
                        camera: state.camera,
                        renderer: state.renderer,
                        vertex_shader_url: state.simulation_vertex_shader_url,
                        fragment_shader_url: state.simulation_fragment_shader_url,
                        uniforms: {
                            textureA: { type: "t", value: null },
                            textureB: { type: "t", value: null },
                            timer: { type: "f", value: 0}
                        }
                    }).then((instance) => {
                        state.color_simulationFBO = instance;
                    })
                ]);
            },

            initDrawing() {

                return akdv.initParticleFBO({
                    width: state.data_side_length,
                    height: state.data_side_length,
                    render_camera: state.camera,
                    particle_base_size: 1,
                    particle_fragment_shader_url: state.particle_fragment_shader_url
                }).then((instance) => {

                    state.particleFBO = instance;
                    state.scene.add(state.particleFBO.container);
                });  
            },

            setData(translate_data_array = window.required(), 
                    color_data_array = window.required(),
                    radius_data_array = window.required()) {

                if (!typed_array_utils.isTypedArray(translate_data_array.constructor) || 
                    !typed_array_utils.isTypedArray(color_data_array.constructor) ||
                    !typed_array_utils.isTypedArray(radius_data_array.constructor)) {
                    throw 'setData Invalid parameters expecting Typed Arrays.';
                }

                const fbo_size = (state.data_side_length * state.data_side_length),
                      end_byte = data_length * translate_data_array.BYTES_PER_ELEMENT;
                
                state.translate_simulationFBO.setSize(state.data_side_length, state.data_side_length);
                state.color_simulationFBO.setSize(state.data_side_length, state.data_side_length);
                state.particleFBO.setSize(state.data_side_length, state.data_side_length);

                state.translate_data_array = translate_data_array;
                state.color_data_array = color_data_array;
                state.radius_data_array = radius_data_array;
            },

            update(bounding_box = window.required()) {

                const avg_radius = 1,  // TODO
                      shape_scale = state.data_side_length * avg_radius;
                
                state.bounding_box.copy(bounding_box);

                if (state.particleFBO.boundingSphere) {
                    state.bounding_box.getBoundingSphere(state.particleFBO.boundingSphere);
                }
                
                if (state.translate_simulationFBO.uniforms['textureA'].value === null) {
                    state.translate_simulationFBO.addDataTextureUniform('textureA', geometry_utils.pointCloudRandomData(new Float32Array(state.translate_data_array), shape_scale));
                    state.color_simulationFBO.addDataTextureUniform('textureA', geometry_utils.pointCloudRandomData(new Float32Array(state.color_data_array)));
                }

                const dest_alpha = (state.tween.alpha > 0.5 ? 0 : 1);
                state.translate_simulationFBO.addDataTextureUniform(`texture${dest_alpha ? 'B' : 'A'}`, state.translate_data_array);
                state.color_simulationFBO.addDataTextureUniform(`texture${dest_alpha ? 'B' : 'A'}`, state.color_data_array);
                
                state.tween.instance
                    .stop()
                    .to({alpha: dest_alpha}, state.tween.duration)
                    .start();
               
                if (!state.tween.running) {
                    this.tick(TWEEN.now());
                }
            },

            tick(time = TWEEN.now()) {

                const pi = (Math.PI / 180);

                state.tween.instance.update(time);
                state.translate_simulationFBO.uniforms.timer.value = state.color_simulationFBO.uniforms.timer.value = state.tween.alpha;

                state.particleFBO.textureTranslate = state.translate_simulationFBO.tick(time);
                state.particleFBO.textureColor = state.color_simulationFBO.tick(time);

                //state.particleFBO.container.rotation.z = (state.camera_alignment === akdv.CameraAligmentTypes.PIXEL) ? 0 : state.particleFBO.container.rotation.z - (state.spin_z_speed * pi) - pi * (state.tween.instance._valuesEnd.alpha ? 1 - state.tween.alpha : state.tween.alpha);
                //state.particleFBO.container.rotation.y = 1.5708;
                //state.light_rig.rig.rotation.y += pi * 0.5;

                this.cameraAlign();

                state.renderer.render(state.scene, state.camera);

                if (state.tween.running) {
                    window.requestAnimationFrame(this.tick.bind(this));
                }
            },

            setSize(width = window.required(), height = window.required()) {

                width  = parseInt(width);
                height = parseInt(height);

                if (state.width !== width || state.height !== height) {
                    state.width = width;
                    state.height = height;
                    this.setCameraSize(width, height);
                    state.renderer.setSize(width, height);
                }
            },

            bindEventHandlers() {

                $(state.canvas)
                    .off('viewport-resize.RenderInstancingWebGL')
                    .on('viewport-resize.RenderInstancingWebGL', this.onResize.bind(this));    
            },

            onResize(event) {
                
                event.stopPropagation();
                this.setSize(parseInt(state.canvas.getAttribute('width')), parseInt(state.canvas.getAttribute('height')));
            },

            get renderer() {

                return state.renderer;
            }
        });

        return _self.init().then(() => Promise.resolve(obj_utils.factoryExports(_self, {
            init: _self.init,
            setData: _self.setData,
            update: _self.update,
            setSize: _self.setSize
        })));
    }
})(window, window.document, window.jQuery, window.THREE, window.TWEEN, window.akdv, window.akdv.utils_obj, window.akdv.utils_three, window.akdv.utils_scene, window.akdv.utils_geometry, window.akdv.utils_typed_array, window.akdv.cameraMixin, window.akdv.lightRigMixin);