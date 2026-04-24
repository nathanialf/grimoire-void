import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform } from 'three'

const fragment = /* glsl */ `
  uniform float k1;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 p = uv - 0.5;
    float r2 = dot(p, p);
    vec2 warped = p * (1.0 + k1 * r2) + 0.5;
    if (warped.x < 0.0 || warped.x > 1.0 || warped.y < 0.0 || warped.y > 1.0) {
      outputColor = vec4(0.0, 0.0, 0.0, inputColor.a);
      return;
    }
    outputColor = vec4(texture2D(inputBuffer, warped).rgb, inputColor.a);
  }
`

export class BarrelEffect extends Effect {
  constructor() {
    super('BarrelEffect', fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['k1', new Uniform(0.08)],
      ]),
    })
  }
}
