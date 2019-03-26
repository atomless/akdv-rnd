
vec3 randomSphereDirection(vec2 rnd) {
    float s = rnd.x * PI * 2.;
    float t = rnd.y * 2. -1.;
    return vec3(sin(s), cos(s), t) / sqrt(1.0 + t * t);
}

#pragma glslify: export(randomSphereDirection)