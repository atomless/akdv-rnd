;((window, document, THREE, akdv) => {

    'use strict';

    const CameraAligmentTypes = akdv.CameraAligmentTypes = window.akdv.CameraAligmentTypes = Object.freeze({
        FREE: 0, 
        PIXEL: 1,
        BOUNDS: 2
    });

    window.akdv.cameraMixin = (state = ({
        width = window.required(),
        height = window.required(),
        camera_alignment = akdv.CameraAligmentTypes.BOUNDS,
        camera_bounds_fit_scale = 0.9,
        camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 1000),
        canvas = window.required()
    } = {})) => {

        const _mixin = Object.freeze({
            setCameraSize(width = window.required(), height = window.required()) {

                width  = parseInt(width);
                height = parseInt(height);

                if (width !== state.camera.width || height !== state.camera.height) {
                   
                    if (state.camera instanceof THREE.OrthographicCamera) {

                        state.camera.left = -width / 2;
                        state.camera.right = width / 2;
                        state.camera.top = height / 2;
                        state.camera.bottom = -height / 2;
                    } else {
                        state.camera.aspect = width / height;
                    }

                    state.camera.updateProjectionMatrix(); 
                }
            },

            fitCameraToBoundingBox(bounding_box = window.required('bounding_box'), bounds_fit_scale = state.bounds_fit_scale) {

                if (!state.pixel_aligned) {
                    const bounding_box_center = bounding_box.getCenter(new THREE.Vector3());

                    if (!bounding_box) {
                        throw 'fitCameraToGeometry no calculated bounds.'
                    }

                    if (state.camera.isOrthographicCamera) {
                        state.camera.zoom = bounds_fit_scale * Math.min((state.camera.right - state.camera.left) / (bounding_box.max.x - bounding_box.min.x),
                                                       (state.camera.top - state.camera.bottom) / (bounding_box.max.y - bounding_box.min.y));
                        state.camera.position.x = bounding_box_center.x;
                        state.camera.position.y = bounding_box_center.y;
                    } else {
                        const bounding_box_size = bounding_box.getSize(),
                              max_size = Math.max(bounding_box_size.x, bounding_box_size.y, bounding_box_size.z),
                              fov = THREE.Math.degToRad(state.camera.fov),
                              z = Math.abs(max_size / 4 * Math.tan(fov * 2)) * bounds_fit_scale;

                        state.camera.position.set(bounding_box_center.x, bounding_box_center.y, z);
                    }

                    state.camera.updateProjectionMatrix();
                  }
            },

            cameraPixelAlign() {

                if (state.camera.zoom !== window.devicePixelRatio) {
                    state.camera.zoom = window.devicePixelRatio;
                    state.camera.position.set(0, 0, state.camera.position.z);
                    state.camera.updateProjectionMatrix();
                }    
            },

            cameraAlign() {

                switch(this.cameraAlignment) {
                    case CameraAligmentTypes.FREE:
                        break;
                    case CameraAligmentTypes.PIXEL:
                        this.cameraPixelAlign();
                        break;
                    case CameraAligmentTypes.BOUNDS:
                        this.fitCameraToBoundingBox(state.bounding_box, state.camera_bounds_fit_scale);
                        break;
                }
            },

            get camera() {

                return state.camera;
            },

            set camera(camera) {

                if (!(camera instanceof THREE.Camera)) {
                    throw 'invalid camera expecting THREE.Camera.';
                }

                state.camera = camera;
            },

            get cameraAlignment() {

                return state.camera_alignment;
            },

            set cameraAlignment(value) {

                if (!Object.values(CameraAligmentTypes).includes(value)) {
                    throw 'Invalid set cameraPixelAligned.';
                }

                state.camera_alignment = value;
            }
        }),

        _self = Object.freeze({
            init() {

                this.bindEventHandlers();
            },

            bindEventHandlers() {

                $(state.canvas)
                    .off('viewport-resize.CameraMixin')
                    .on('viewport-resize.CameraMixin', this.onResize.bind(this))
                    .on('viewport-scroll.CameraMixin', this.onScroll.bind(this));  
            },

            onResize(event) {

                event.stopPropagation();
        
                const width = parseInt(state.canvas.getAttribute('width')),
                      height = parseInt(state.canvas.getAttribute('height'));
                
                _mixin.cameraAlign();
                _mixin.setCameraSize(width, height);
            },

            onScroll(event, offset_x, offset_y) {

                event.stopPropagation();
        
                _mixin.cameraAlign();
                state.camera.position.x = offset_x;
                state.camera.position.y = offset_y;
            }
        });

        _self.init();

        return _mixin;
    };
})(window, window.document, window.THREE, window.akdv);   