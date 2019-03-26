;((window, document, $, THREE, akdv, utils_obj, utils_three) => {

    'use strict';

    akdv.initSimulationFBO = ({
        width = 512,
        height = 512,
        format = THREE.RGBAFormat,
        renderer = window.required('renderer', 'THREE.renderer'),
        uniforms = {},
        vertex_shader_url = window.required(),
        fragment_shader_url = window.required()
    } = {}) => {

        const config = Object.seal({
            width,
            height,
            format,
            renderer,
            uniforms,
            vertex_shader_url,
            fragment_shader_url,
            vertex_shader_text: '',
            fragment_shader_text: '',
            simulation_material: null,
            gl: renderer.context,
            float_type: THREE.HalfFloatType,
            render_targets: Object.seal([null, null]),
            render_target_index: 0,
            buffer_geometry: null,
            scene: null,
            camera: null,
            mesh: null,
            helper: new window.FBOHelper(renderer),
            resources_loaded: false
        });

        const _self = {
            init() {

                config.scene = new THREE.Scene();
              
                return this.loadResources().then(() => {
                    this.initFloatType();
                    this.initRenderTargets();
                    this.initDrawing();
                    this.initCamera();

                    config.helper.setSize( window.innerWidth, window.innerHeight );
                    config.helper.attach(config.render_targets[0], 'Force');
                });
            },

            loadResources() {

                return !config.resources_loaded ? utils_three.shaderLoad(config.vertex_shader_url, config.fragment_shader_url)
                    .then(([vertex_shader, fragment_shader]) => {

                        config.vertex_shader_text = vertex_shader;
                        config.fragment_shader_text = fragment_shader;
                        config.resources_loaded = true;
                    }) : Promise.resolve();
            },

            initFloatType() {

                const render_target = new THREE.WebGLRenderTarget(16, 16, {
                  format: THREE.RGBAFormat,
                  type: THREE.FloatType
                });

                config.renderer.render(config.scene, new THREE.Camera(), render_target);

                if (config.gl.checkFramebufferStatus(config.gl.FRAMEBUFFER) !== config.gl.FRAMEBUFFER_COMPLETE) {
                    window._log.warn('WARNING: THREE.FloatType not supported.');
                } else {
                    window._log.info('INFO: THREE.FloatType supported.');
                    config.float_type = THREE.FloatType;
                }
            },

            initRenderTargets() {

                for(let i = 0; i < 2; ++i) {
                    const target = config.render_targets[i] = new THREE.WebGLRenderTarget(config.width, config.height, {
                      wrapS: THREE.ClampToEdgeWrapping,
                      wrapT: THREE.ClampToEdgeWrapping,
                      minFilter: THREE.NearestFilter,
                      magFilter: THREE.NearestFilter,
                      format: config.format,
                      type: config.float_type
                    });

                    config.render_targets[i].texture.generateMipmaps = false;
                }
            },

            initCamera() {

                config.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.00001, 1);
                config.camera.position.z = 0.1;
                config.scene.add(config.camera);
            },

            initDrawing() {

                config.simulation_material = new THREE.ShaderMaterial({
                  uniforms: Object.assign({
                    num_frames: {type: 'f', value: 60},
                    prevTarget: {type: 't', value: null}
                  }, config.uniforms),
                  vertexShader: config.vertex_shader_text,
                  fragmentShader: config.fragment_shader_text
                });

                config.buffer_geometry = new THREE.BufferGeometry();
                config.buffer_geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
                   -1, -1, 0, 
                    1, -1, 0, 
                    1,  1, 0, 
                   -1, -1, 0, 
                    1,  1, 0, 
                   -1,  1, 0 
                ]), 3));

                config.buffer_geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array([
                    0, 1, 
                    1, 1, 
                    1, 0,     
                    0, 1, 
                    1, 0, 
                    0, 0
                ]), 2));
                
                config.mesh = new THREE.Mesh(config.buffer_geometry, config.simulation_material);
                config.scene.add(config.mesh);
            },

            addDataTextureUniform(name, data) {

                const data_texture = new THREE.DataTexture(data, config.width, config.height, config.format, config.float_type);
                data_texture.minFilter = data_texture.maxFilter = THREE.NearestFilter;
                data_texture.flipY = false;
                data_texture.needsUpdate = true;

                config.simulation_material.uniforms[name].value = data_texture;
            },

            removeDataTextureUniform(name) {

                delete config.simulation_material.uniforms[name];
                config.simulation_material.needsUpdate = true;
            },

            setSize(width, height) {

                if (isNaN(width) || isNaN(height)) {
                    throw 'Invalid setSize parameters.'
                }

                config.width = width;
                config.height = height;
                this.initRenderTargets();
            },

            tick() {

                const prev_target = config.render_targets[config.render_target_index],
                      current_target = config.render_targets[config.render_target_index = (config.render_target_index + 1) % 2];

                config.simulation_material.uniforms.prevTarget.value = prev_target;
                config.renderer.render(config.scene, config.camera, current_target);

                config.helper.update();

                return current_target;
            },

            get target() {

                return config.render_targets[config.render_target_index];
            },

            get uniforms() {

                return config.simulation_material.uniforms;
            },

            get width() {

                return config.width;            
            },

            get height() {

                return config.height;
            }
        };

        return _self.init().then(() => Promise.resolve(Object.seal(Object.assign(utils_obj.extractGetterSetter(_self), utils_obj.bindAll(_self, {
            addDataTextureUniform: _self.addDataTextureUniform,
            setSize: _self.setSize,
            tick: _self.tick
        })))));
    }
})(window, window.document, window.jQuery, window.THREE, window.akdv, window.akdv.utils_obj, window.akdv.utils_three);