;((window, document, $, THREE, akdv, obj_utils, cameraMixin) => {

    'use strict';

    const PI_2 = Math.PI * 2;
    const default_canvas_program = function(context) {
            
        context.beginPath();
        context.arc(0, 0, 0.5, 0, PI_2, true);
        context.fill();
    };

    akdv.initManyNodeCanvasRenderer = ({
        width = window.innerWidth,
        height = window.innerHeight,
        accessor_x = 'x',
        accessor_y = 'y',
        accessor_radius = 'radius',
        accessor_color = 'color',
        sprite_map_path = '../images/sprites/circle.png',
        camera_alignment = akdv.CameraAligmentTypes.BOUNDS,
        camera_bounds_fit_scale = 0.9,
        canvas_program = default_canvas_program,
        canvas,
        node_array,
        material

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
            canvas_program,
            scene: null,
            camera: null,
            renderer: null,
            material: null,
            light_rig: null,
            sprite_group: null,
            bounding_box: new THREE.Box3()
        });

        const _self = obj_utils.extend({},
            cameraMixin(state), {

            init() {

                this.bindEventHandlers();

                state.scene = new THREE.Scene();
              
                state.renderer = new THREE.CanvasRenderer({
                    canvas: canvas,
                    alpha: true
                });

                this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 1000);
                this.camera.position.z = 500;
                
                state.renderer.setSize(width, height);
                state.renderer.setPixelRatio(window.devicePixelRatio);

                this.initDrawing(material);
                this.setData(node_array);

                return Promise.resolve();
            },

            initDrawing({
                material = new THREE.SpriteCanvasMaterial({
                  color: 0xffffff,
                  program: state.canvas_program
                })
            } = {}) {

                state.material = material;
            },

            setData(data = []) {

                if (!Array.isArray(data)) {
                    throw 'Invalid data parameter.';
                }

                if (state.sprite_group) {
                    state.scene.remove(state.sprite_group);
                }
                state.sprite_group = new THREE.Group();

                state.node_array = data;
                
                for (let i = 0, l = state.node_array.length; i < l; i++) {
                    const sprite = new THREE.Sprite(state.material.clone());
                    sprite.scale.x = sprite.scale.y = 3;
                    sprite.matrixAutoUpdate = false;
                    state.sprite_group.add(sprite);
                }

                state.scene.add(state.sprite_group);
            },

            tick() {
                
                state.bounding_box.makeEmpty();
                
                for (let i = 0, l = state.node_array.length; i < l; i++) {
                    const node = state.node_array[i],
                          color = new THREE.Color(...node[state.accessor_color]),
                          sprite = state.sprite_group.children[i];
                    sprite.position.x = node[state.accessor_x];
                    sprite.position.y = -node[state.accessor_y];
                    sprite.position.z = -2.5;
                    sprite.updateMatrix();

                    sprite.material.color.set(color);
                    state.bounding_box.expandByPoint(sprite.position);
                }

                this.cameraAlign();

                this.render();             
            },

            render() {

                state.renderer.render(state.scene, state.camera);
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
            initCamera: _self.initCamera,
            initDrawing: _self.initDrawing,
            setData: _self.setData,
            setSize: _self.setSize,
            tick: _self.tick
        })));
    }
})(window, window.document, window.jQuery, window.THREE, window.akdv, window.akdv.utils_obj, window.akdv.cameraMixin);