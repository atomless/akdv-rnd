uniform vec3 diffuse;

varying vec3 vNormal;
varying float vAge;
varying float vOpacity;
varying vec3 vColor;
varying vec3 vLightFront;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_pars_maps>
#include <fog_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {
    
    if ( vOpacity == 0.0 ) {
        discard;
    }

    #include <clipping_planes_fragment>

    vec4 diffuseColor = vec4( vColor * diffuse, vOpacity );
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

    #include <logdepthbuf_fragment>
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <specularmap_fragment>

    // accumulation
    reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );

    #include <lightmap_fragment>

    reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );
    reflectedLight.directDiffuse = vLightFront;
    reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();

    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
    
    #include <envmap_fragment>

    gl_FragColor = vec4( outgoingLight, diffuseColor.a );

    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
    #include <dithering_fragment>
}