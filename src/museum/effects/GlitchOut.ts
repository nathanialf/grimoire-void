import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform } from 'three'
import { glitchOut } from './glitchOutUniform'

// Active only when the shared `glitchOut` uniform ramps 0→1 (timer expiry).
// Hard channel-split + row-jitter + invert-flash. Re-samples inputBuffer, so
// must be CONVOLUTION so it lands in its own EffectPass.
const fragment = /* glsl */ `
  uniform float ramp;
  uniform float time;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    if (ramp <= 0.0001) {
      outputColor = inputColor;
      return;
    }

    // Per-row horizontal jitter (strong tearing)
    float row = floor(uv.y * 90.0);
    float jitter = (hash(vec2(row, time * 60.0)) - 0.5) * ramp * 0.06;

    // Per-channel offset for aggressive RGB split
    float caAmt = ramp * 0.025;
    vec2 base = uv + vec2(jitter, 0.0);
    float r = texture2D(inputBuffer, base + vec2( caAmt, 0.0)).r;
    float g = texture2D(inputBuffer, base).g;
    float b = texture2D(inputBuffer, base + vec2(-caAmt, 0.0)).b;
    vec3 c = vec3(r, g, b);

    // Random whole-row inversion flashes
    float flash = step(0.85, hash(vec2(row * 0.13, time * 7.0)));
    c = mix(c, vec3(1.0) - c, flash * ramp);

    // Crushed blacks + blown highlights
    c = mix(c, clamp((c - 0.5) * (1.0 + ramp * 2.5) + 0.5, 0.0, 1.0), ramp);

    outputColor = vec4(c, inputColor.a);
  }
`

export class GlitchOutEffect extends Effect {
  constructor() {
    super('GlitchOutEffect', fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['ramp', glitchOut],
        ['time', new Uniform(0)],
      ]),
    })
  }

  override update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number) {
    // Wrap time to keep sin() args small — unbounded growth produces visible diagonal banding past ~3min (float32 precision loss in the hash).
    const t = this.uniforms.get('time')!
    t.value = (t.value + (deltaTime ?? 0.016)) % 10
  }
}
