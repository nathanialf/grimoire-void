import { Effect, BlendFunction, EffectAttribute } from 'postprocessing'
import { Uniform, WebGLRenderer, WebGLRenderTarget } from 'three'

const fragment = /* glsl */ `
  uniform float threshold;
  uniform vec3 tint;
  uniform float strength;
  uniform vec2 texelSize;

  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

  vec3 sampleHot(vec2 uv) {
    vec3 c = texture2D(inputBuffer, uv).rgb;
    float l = luma(c);
    float k = smoothstep(threshold, threshold + 0.2, l);
    return c * k;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 accum = vec3(0.0);
    float total = 0.0;
    const int R = 4;
    for (int x = -R; x <= R; x++) {
      for (int y = -R; y <= R; y++) {
        vec2 o = vec2(float(x), float(y)) * texelSize * 5.0;
        float w = exp(-(float(x * x + y * y)) / 12.0);
        accum += sampleHot(uv + o) * w;
        total += w;
      }
    }
    vec3 halo = (accum / total) * tint * strength;
    outputColor = vec4(inputColor.rgb + halo, inputColor.a);
  }
`

export class HalationEffect extends Effect {
  constructor() {
    super('HalationEffect', fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ['threshold', new Uniform(0.75)],
        ['tint', new Uniform(new Float32Array([1.0, 0.55, 0.35]))],
        ['strength', new Uniform(0.6)],
        ['texelSize', new Uniform(new Float32Array([1 / 1920, 1 / 1080]))],
      ]),
    })
  }

  override update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget) {
    const texelSize = this.uniforms.get('texelSize')!.value as Float32Array
    const w = inputBuffer.width || renderer.domElement.width
    const h = inputBuffer.height || renderer.domElement.height
    texelSize[0] = 1 / w
    texelSize[1] = 1 / h
  }
}
