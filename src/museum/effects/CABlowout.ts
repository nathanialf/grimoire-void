import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform } from 'three'
import { pixelSort } from './pixelSortUniform'
import { datamosh } from './datamoshUniform'

// Additional chromatic-aberration channel split that intensifies during
// transitions (derez pixel-sort or Carcosa-swap datamosh). Layers on TOP of
// the always-on baseline ChromaticAberration in Effects.tsx — the static
// pass keeps its constant pixel offset; this pass adds a much stronger
// split scaled by max(pixelSort, datamosh). Mirrors the per-channel UV
// offset that the old GlitchOutEffect did internally.
const fragment = /* glsl */ `
  uniform float ramp;
  uniform float ramp2;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float r = max(ramp, ramp2);
    if (r <= 0.0001) {
      outputColor = inputColor;
      return;
    }

    // Tuned so peak ramp = 1 (derez) gives a clearly blown-out split, and
    // the Carcosa-swap triangle peak (~0.45) gives a strong but brief one.
    float caAmt = r * 0.025;
    float rC = texture2D(inputBuffer, uv + vec2( caAmt, 0.0)).r;
    float gC = texture2D(inputBuffer, uv).g;
    float bC = texture2D(inputBuffer, uv + vec2(-caAmt, 0.0)).b;
    outputColor = vec4(rC, gC, bC, inputColor.a);
  }
`

export class CABlowoutEffect extends Effect {
  constructor() {
    super('CABlowoutEffect', fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['ramp', pixelSort],
        ['ramp2', datamosh],
      ]),
    })
  }
}
