import { Effect } from 'postprocessing'
import { Uniform } from 'three'

const fragment = /* glsl */ `
  uniform float exposure;

  vec3 uncharted2(vec3 x) {
    float A = 0.22;
    float B = 0.30;
    float C = 0.10;
    float D = 0.20;
    float E = 0.01;
    float F = 0.30;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb * exposure;
    vec3 curr = uncharted2(c);
    vec3 whiteScale = 1.0 / uncharted2(vec3(11.2));
    outputColor = vec4(curr * whiteScale, inputColor.a);
  }
`

export class ToneMapEffect extends Effect {
  constructor() {
    super('ToneMapEffect', fragment, {
      uniforms: new Map<string, Uniform>([
        ['exposure', new Uniform(1.2)],
      ]),
    })
  }
}
