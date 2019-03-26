;((window, document, THREE, akdv) => {

    'use strict';

    akdv.utils_scene = {

        createThreePointLightRig({
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

            const rig = new THREE.Object3D();
            rig.position.set(0, 0, 0);
          
            const ambient = new THREE.AmbientLight(ambient_color, ambient_intensity);
            rig.add(ambient);

            const key = new THREE.DirectionalLight(key_color, key_intensity);

            key.position.copy(key_position);
            key.rotation.copy(key_rotation);
            key.castShadow = cast_shadow;
            key.shadow.camera.near = shadow_near;
            key.shadow.camera.far = shadow_far;
            key.shadow.camera.left = shadow_camera_left;
            key.shadow.camera.right = shadow_camera_right;
            key.shadow.camera.top = shadow_camera_top;
            key.shadow.camera.bottom = shadow_camera_bottom;
            key.shadow.bias = shadow_bias;
            key.shadow.mapSize.width = shadow_width;
            key.shadow.mapSize.height = shadow_height;
            rig.add(key);

            const fill1 = new THREE.SpotLight(fill1_color, fill1_intensity, shadow_far, 0.25, 0.5);
            fill1.position.copy(fill1_position);
            fill1.rotation.copy(fill1_rotation);
            rig.add(fill1);

            const fill2 = new THREE.SpotLight(fill2_color, fill2_intensity, shadow_far, 0.25, 0.5);
            fill2.position.copy(fill2_position);
            fill2.rotation.copy(fill2_rotation);
            
            rig.add(fill2);
            

            if (show_helpers) {
                rig.add(new THREE.DirectionalLightHelper(key));
                rig.add(new THREE.CameraHelper(key.shadow.camera));
                rig.add(new THREE.SpotLightHelper(fill1));
                rig.add(new THREE.SpotLightHelper(fill2));
                rig.add(new THREE.GridHelper(3000, 30));
            }
            
            return {
                rig,
                ambient,
                key,
                fill1,
                fill2
            };
        }
    }
})(window, window.document, window.THREE, window.akdv);