float hash( float n ) {
    return fract(sin(n) * 3538.5453);
}

#pragma glslify: export(hash)