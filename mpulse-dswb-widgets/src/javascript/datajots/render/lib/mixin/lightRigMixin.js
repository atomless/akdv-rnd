;((window, document, THREE, utils_scene) => {

    'use strict';

    window.akdv.lightRigMixin = (state = window.required('state')) => {

        const _mixin = Object.freeze({

            initLightRig(renderer, scene, {
                show_helpers = false,
                rig_position = new THREE.Vector3(0, 0, 0),
                ambient_color = 0xffffff,
                ambient_intensity = 0.3,
                key_position = new THREE.Vector3(3000, 2000, 3000),
                key_rotation = new THREE.Vector3(THREE.Math.degToRad(-45), 0, 0),
                key_color = new THREE.Color('hsl(30, 100%, 91%)'),
                key_intensity = 1,
                cast_shadow = true,
                shadow_near = 2000,
                shadow_far = 10000,
                shadow_camera_left = -2000,
                shadow_camera_right = 2000,
                shadow_camera_top = 2000,
                shadow_camera_bottom = -2000,
                shadow_bias = -0.001,
                shadow_width = 1024,
                shadow_height = 1024,
                fill1_position = new THREE.Vector3(4000, 1500, -3000),
                fill1_rotation = new THREE.Vector3(THREE.Math.degToRad(-10), 0, 0),
                fill1_color = new THREE.Color('hsl(215, 25%, 90%)'),
                fill1_intensity = 0.275,
                fill2_position = new THREE.Vector3(-4000, -2000, -3000),
                fill2_rotation = new THREE.Vector3(THREE.Math.degToRad(-15), 0, 0),
                fill2_color = new THREE.Color('hsl(190, 25%, 90%)'),
                fill2_intensity = 0.225
            } = {}) {

                state.light_rig = utils_scene.createThreePointLightRig({
                    show_helpers,
                    rig_position,
                    ambient_color,
                    ambient_intensity,
                    key_position,
                    key_rotation,
                    key_color,
                    key_intensity,
                    cast_shadow,
                    shadow_near,
                    shadow_far,
                    shadow_bias,
                    shadow_width,
                    shadow_height,
                    fill1_position,
                    fill1_rotation,
                    fill1_color,
                    fill1_intensity,
                    fill2_position,
                    fill2_rotation,
                    fill2_color,
                    fill2_intensity
                });
                
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;

                scene.add(state.light_rig.rig);
            },

            get lightRig() {

                return state.light_rig;
            }
        });

        return Object.seal(_mixin);
    }
})(window, window.document, window.THREE, window.akdv.utils_scene);   