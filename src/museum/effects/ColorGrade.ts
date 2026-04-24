import { Effect } from 'postprocessing'

const fragment = /* glsl */ `
  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    float l = luma(c);

    // Lift: raise shadows toward blue+red
    c += vec3(0.05, 0.0, 0.08) * (1.0 - l);

    // Gain: slight overall drop
    c *= 0.92;

    // Gamma tint: push magenta
    c = pow(max(c, 0.0), vec3(1.0, 1.05, 0.95));

    // Channel mixer
    float shadowMask = 1.0 - smoothstep(0.0, 0.5, l);
    float highlightMask = smoothstep(0.6, 1.0, l);
    c.r += c.b * 0.05;
    c.b += c.r * 0.05 * shadowMask;
    c.g += c.r * 0.03 * highlightMask;

    // U-shaped saturation curve: desaturate midtones
    float satFactor = mix(0.75, 1.0, abs(l - 0.5) * 2.0);
    c = mix(vec3(luma(c)), c, satFactor);

    outputColor = vec4(c, inputColor.a);
  }
`

export class ColorGradeEffect extends Effect {
  constructor() {
    super('ColorGradeEffect', fragment)
  }
}
