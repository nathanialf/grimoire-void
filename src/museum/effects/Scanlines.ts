import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform, WebGLRenderer, WebGLRenderTarget } from 'three'

const fragment = /* glsl */ `
  uniform float time;
  uniform vec2 resolution;
  uniform float lineStrength;
  uniform float jitterStrength;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Per-row horizontal jitter
    float row = floor(uv.y * resolution.y);
    float jitter = (hash(row + floor(time * 60.0)) - 0.5) * jitterStrength;
    vec2 juv = uv + vec2(jitter, 0.0);

    vec3 c = texture2D(inputBuffer, juv).rgb;

    // Scanline mask (sin at screen-y frequency)
    float s = 0.5 + 0.5 * sin(juv.y * resolution.y * 3.14159);
    c *= mix(1.0, s, lineStrength);

    outputColor = vec4(c, inputColor.a);
  }
`

export class ScanlinesEffect extends Effect {
  constructor() {
    super('ScanlinesEffect', fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['time', new Uniform(0)],
        ['resolution', new Uniform(new Float32Array([1920, 1080]))],
        ['lineStrength', new Uniform(0.25)],
        ['jitterStrength', new Uniform(0.002)],
      ]),
    })
  }

  override update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget, deltaTime: number) {
    this.uniforms.get('time')!.value += deltaTime ?? 0.016
    const res = this.uniforms.get('resolution')!.value as Float32Array
    res[0] = inputBuffer.width || renderer.domElement.width
    res[1] = inputBuffer.height || renderer.domElement.height
  }
}
