#pragma glslify: randomSphereDirection = require(./random_sphere_direction.glsl)
#pragma glslify: hash = require(./random_hash.glsl)

vec3 randomHemisphereDirection(vec3 dir, float i) {
    vec3 v = randomSphereDirection( vec2(hash(i + 1.), hash(i + 2.)) );
    return v * sign(dot(v, dir));
}

#pragma glslify: export(randomHemisphereDirection)