import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import { glitchOut } from './glitchOutUniform'

// 4x4 Bayer dither, then quantize to 6 bits per channel.
const fragment = /* glsl */ `
  uniform float ramp;

  const float bayer[16] = float[16](
     0.0,  8.0,  2.0, 10.0,
    12.0,  4.0, 14.0,  6.0,
     3.0, 11.0,  1.0,  9.0,
    15.0,  7.0, 13.0,  5.0
  );

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    ivec2 p = ivec2(mod(uv * vec2(1920.0, 1080.0), 4.0));
    float b = bayer[p.x + p.y * 4] / 16.0 - 0.5;
    c += b * (1.0 / 64.0);

    // Quantize: base 6 bits, reduced under glitchOut ramp (down to 4 bits)
    float bits = mix(63.0, 15.0, ramp);
    c = floor(c * bits + 0.5) / bits;

    outputColor = vec4(c, inputColor.a);
  }
`

export class DitherEffect extends Effect {
  constructor() {
    super('DitherEffect', fragment, {
      uniforms: new Map<string, Uniform>([
        ['ramp', glitchOut],
      ]),
    })
  }
}
