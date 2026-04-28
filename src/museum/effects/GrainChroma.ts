import { Effect } from 'postprocessing'
import { Uniform } from 'three'

const fragment = /* glsl */ `
  uniform float time;
  uniform float amount;
  uniform float chromaAmount;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    float l = luma(c);

    // Luma-weighted monochrome grain
    float n = hash(uv * vec2(1920.0, 1080.0) + time * 60.0) - 0.5;
    float weight = (1.0 - l) * 0.7 + 0.3;
    c += n * amount * weight;

    // Independent per-channel chroma noise
    vec3 chroma = vec3(
      hash(uv * vec2(800.0, 600.0) + time * 40.0) - 0.5,
      hash(uv * vec2(640.0, 480.0) + time * 50.0 + 17.0) - 0.5,
      hash(uv * vec2(512.0, 384.0) + time * 35.0 + 31.0) - 0.5
    );
    c += chroma * chromaAmount;

    outputColor = vec4(c, inputColor.a);
  }
`

export class GrainChromaEffect extends Effect {
  constructor() {
    super('GrainChromaEffect', fragment, {
      uniforms: new Map<string, Uniform>([
        ['time', new Uniform(0)],
        ['amount', new Uniform(0.08)],
        ['chromaAmount', new Uniform(0.025)],
      ]),
    })
  }

  override update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number) {
    // Wrap time to keep sin() args small — unbounded growth produces visible diagonal banding past ~3min (float32 precision loss in the hash).
    const t = this.uniforms.get('time')!
    t.value = (t.value + (deltaTime ?? 0.016)) % 10
  }
}
