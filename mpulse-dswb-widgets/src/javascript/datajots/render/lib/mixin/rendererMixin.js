;((window, document, THREE, akdv) => {

    'use strict';

    window.akdv.rendererMixin = (state = ({
        width = window.required(),
        height = window.required(),
        renderer = new THREE.WebGLRenderer(),
        canvas = window.required()
    } = {})) => {

        const _mixin = Object.freeze({
            setSize(width = window.required(), height = window.required()) {

                width  = parseInt(width);
                height = parseInt(height);

                if (state.width !== width || state.height !== height) {
                    state.width = width;
                    state.height = height;

                    state.renderer.setSize(width, height);
                }
            },

            get renderer() {

                return state.renderer;
            },

            set renderer(renderer) {

                if (!(renderer instanceof THREE.WebGLRenderer) && !(renderer instanceof THREE.CanvasRenderer)) {
                    throw 'invalid renderer.';
                }

                state.renderer = renderer;
            }
        }),

        _self = Object.freeze({
            init() {

                this.bindEventHandlers();
            },

            bindEventHandlers() {

                $(state.canvas)
                    .off('viewport-resize.RendererMixin')
                    .on('viewport-resize.RendererMixin', this.onResize.bind(this));  
            },

            onResize(event) {

                event.stopPropagation();

                const width = parseInt(state.canvas.getAttribute('width')),
                      height = parseInt(state.canvas.getAttribute('height'));

                if (state.width !== width || state.height !== height) {
                    state.width = width;
                    state.height = height;
                    state.renderer.setSize(width, height);
                }
            }
        });

        _self.init();

        return _mixin;
    };
})(window, window.document, window.THREE, window.akdv);   