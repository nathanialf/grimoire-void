import { Effect } from 'postprocessing'

const fragment = /* glsl */ `
  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    float l = luma(c);

    // Lift: raise shadows toward blue+red (reduced so blacks stay deeper)
    c += vec3(0.02, 0.0, 0.04) * (1.0 - l);

    // Black-point crush: pull the toe down so anything below ~6% stays at 0
    c = max(c - vec3(0.06), vec3(0.0)) / (1.0 - 0.06);

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

    outputColor = vec4(c, inputColor.a);
  }
`

export class ColorGradeEffect extends Effect {
  constructor() {
    super('ColorGradeEffect', fragment)
  }
}
