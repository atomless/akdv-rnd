
precision highp float;

uniform sampler2D prevTarget;
uniform sampler2D originalPosition;
uniform float time;

uniform float bounce;
uniform float friction;
uniform float gravity;
uniform float pressure;
varying vec2 vUv;

#pragma glslify: hash = require(./lib/math/random_hash.glsl)
#pragma glslify: randomHemisphereDirection = require(./lib/math/random_hemisphere_direction.glsl)

void main() {
    vec4 c = vec4(texture2D(prevTarget, vUv).xy, 0., 0.);
    vec4 p = vec4(texture2D(prevTarget, vUv).zw, 0., 0.);
    
    if(p.a == 0.) {
        vec4 o = texture2D(originalPosition, vUv);
        c.xyz = normalize(o.xyz);
        c.y = 0.;
    }
    
    c.y -= .1 * pressure;
    c.y -= .1 * gravity;
    c *= .99;

    if((p.y + c.y) < -500.) {
        vec3 n = vec3(0., 1., 0.);
        vec3 i = normalize(c.xyz);
        float f = length(c.xyz);
        c.xyz = f * randomHemisphereDirection(reflect(i, n), hash(length(c) + time));
        c.xz *= bounce;
        c.xyz *= friction;
    }

    gl_FragColor = vec4(1.0, c.x, 0.0, 1.0);
}