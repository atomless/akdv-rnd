uniform sampler2D textureTranslate;
uniform sampler2D textureColor;
uniform float pointSize;
uniform float sceneSize;
uniform float time;
uniform vec3 initColor;
uniform vec3 fadeolor;
uniform float opacity;

varying vec3 vNormal;
varying float vAge;
varying float vOpacity;
varying vec3 vColor;
varying vec3 vLightFront;

#include <common>
#include <envmap_pars_vertex>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_pars_maps>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {
    #include <color_vertex>
    #include <beginnormal_vertex>

    vec4 textureTranslateInfo = texture2D(textureTranslate, position.xy);
    vec4 textureColorInfo = texture2D(textureColor, position.xy);
    vec3 transformed = textureTranslateInfo.xyz * sceneSize;
    //transformed.z += vAge;
    vec3 transformedNormal = normalMatrix * vec3(0.0, 0.0, -1.0);
    vNormal = transformedNormal;
    vAge = textureTranslateInfo.w;
    vOpacity = opacity;
    vColor = textureColorInfo.xyz;//mix(initColor, fadeolor, smoothstep(0.0, 0.75, vAge));
    gl_PointSize = pointSize;

    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>

    #include <worldpos_vertex>

    #include <envmap_vertex>
    #include <lights_lambert_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>
}