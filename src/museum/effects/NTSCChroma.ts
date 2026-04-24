import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform, WebGLRenderer, WebGLRenderTarget } from 'three'

// RGB <-> YIQ transforms (standard NTSC).
// Low-pass the chroma (I and Q) channels horizontally; leave luma (Y) sharp.
const fragment = /* glsl */ `
  uniform vec2 texelSize;

  const mat3 RGB2YIQ = mat3(
    0.299,  0.596,  0.211,
    0.587, -0.274, -0.523,
    0.114, -0.322,  0.312
  );
  const mat3 YIQ2RGB = mat3(
    1.000,  1.000,  1.000,
    0.956, -0.272, -1.106,
    0.621, -0.647,  1.703
  );

  vec3 sampleYIQ(vec2 uv) {
    return RGB2YIQ * texture2D(inputBuffer, uv).rgb;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // 5-tap horizontal low-pass on I and Q only
    vec3 c0 = sampleYIQ(uv);
    vec3 c1 = sampleYIQ(uv + vec2(-2.0, 0.0) * texelSize);
    vec3 c2 = sampleYIQ(uv + vec2(-1.0, 0.0) * texelSize);
    vec3 c3 = sampleYIQ(uv + vec2( 1.0, 0.0) * texelSize);
    vec3 c4 = sampleYIQ(uv + vec2( 2.0, 0.0) * texelSize);

    float Y = c0.x;
    float I = (c1.y + 2.0 * c2.y + 2.0 * c0.y + 2.0 * c3.y + c4.y) / 8.0;
    float Q = (c1.z + 2.0 * c2.z + 2.0 * c0.z + 2.0 * c3.z + c4.z) / 8.0;

    vec3 rgb = YIQ2RGB * vec3(Y, I, Q);
    outputColor = vec4(rgb, inputColor.a);
  }
`

export class NTSCChromaEffect extends Effect {
  constructor() {
    super('NTSCChromaEffect', fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
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
