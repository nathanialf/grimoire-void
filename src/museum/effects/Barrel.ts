import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform } from 'three'

const fragment = /* glsl */ `
  uniform float k1;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Overscan: shrink the source region so the warped output fills the
    // screen exactly at the corners. Without this, the curvature pushes
    // sampled UVs past [0,1] and the screen edges read as black.
    float scale = 1.0 / (1.0 + 0.5 * k1);
    vec2 p = (uv - 0.5) * scale;
    float r2 = dot(p, p);
    vec2 warped = p * (1.0 + k1 * r2) + 0.5;
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
