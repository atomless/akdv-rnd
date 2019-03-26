#define DISTANCE
uniform sampler2D texturePosition;
uniform float pointSize;
uniform float sceneSize;

varying vec3 vWorldPosition;

#include <common>
#include <clipping_planes_pars_vertex>

void main() {
    
    vec4 textureInfo = texture2D( texturePosition, position.xy );
    vec3 transformed =  textureInfo.xyz * sceneSize;
    
    gl_PointSize = pointSize;

    #include <project_vertex>
    #include <worldpos_vertex>
    #include <clipping_planes_vertex>

    vWorldPosition = worldPosition.xyz;
}