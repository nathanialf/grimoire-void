import { Effect, EffectAttribute, CopyPass } from 'postprocessing'
import {
  Camera,
  PerspectiveCamera,
  Quaternion,
  Euler,
  RGBAFormat,
  Uniform,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three'
import { datamosh } from './datamoshUniform'

// Frame-feedback datamosh. Each update():
//   1. Reads camera world quaternion vs. last frame, derives a screen-space
//      motion vector (yaw → x, pitch → y) — that's the "P-frame motion data"
//      driving the smear.
//   2. Sets uniform `prevBuffer` to the RT we wrote LAST frame (the prev
//      frame texture) so the fragment shader can sample it.
//   3. Copies the current inputBuffer into the OTHER RT so next frame can
//      read it as prev.
// Fragment shader mixes current input with prevBuffer-sampled-at-(uv-motion)
// based on a ramp-driven persistence factor — at peak ramp, the previous
// frame dominates and gets carried along by camera motion, the genuine
// codec-datamosh look.
const fragment = /* glsl */ `
  uniform float ramp;
  uniform sampler2D prevBuffer;
  uniform vec2 camMotion;
  uniform float time;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    if (ramp <= 0.0001) {
      outputColor = inputColor;
      return;
    }

    // Block grid for per-block jitter (every block carries its own MV, like
    // real macroblocks). Block count scales: bigger blocks at peak so the
    // grid is visibly readable during the transition.
    float blockSize = mix(48.0, 24.0, clamp(ramp, 0.0, 1.0));
    vec2 blockId = floor(uv * blockSize);
    vec2 blockNoise = vec2(hash(blockId + 11.0), hash(blockId + 17.3)) - 0.5;

    // Motion vector field: camera-derived base + per-block jitter on every
    // block. Real codec datamosh has a vector per macroblock, all the time.
    vec2 motion = camMotion * (1.0 + ramp * 1.5)
                + blockNoise * 0.05 * ramp;

    // Persistence: remap so the prev frame really sticks at peak. Triangle
    // peak (0.45) for door swap → ~0.96 persistence; full ramp (1.0) for
    // any future derez use → also clamped 0.96.
    float persistence = clamp(ramp * 2.4, 0.0, 0.96);

    vec3 cur = inputColor.rgb;
    vec3 prev = texture2D(prevBuffer, clamp(uv - motion, vec2(0.0), vec2(1.0))).rgb;

    // Per-block hue corruption — ramp-scaled tint mismatch (codec color
    // space breakdown).
    vec3 tint = vec3(
      hash(blockId + 5.1) - 0.5,
      hash(blockId + 7.3) - 0.5,
      hash(blockId + 9.5) - 0.5
    ) * 0.05 * ramp;

    vec3 mixed = mix(cur, prev, persistence) + tint;
    outputColor = vec4(mixed, inputColor.a);
  }
`

export class DatamoshEffect extends Effect {
  private rtA: WebGLRenderTarget
  private rtB: WebGLRenderTarget
  private toggle = false
  private firstFrame = true
  private copyPass: CopyPass
  private cameraRef: Camera | null = null
  private lastQuat: Quaternion | null = null
  private tmpQuat = new Quaternion()
  private tmpEuler = new Euler()

  constructor() {
    super('DatamoshEffect', fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['ramp', datamosh],
        ['prevBuffer', new Uniform(null)],
        ['camMotion', new Uniform(new Vector2(0, 0))],
        ['time', new Uniform(0)],
      ]),
    })

    const opts = {
      format: RGBAFormat,
      type: UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    }
    this.rtA = new WebGLRenderTarget(2, 2, opts)
    this.rtB = new WebGLRenderTarget(2, 2, opts)
    this.copyPass = new CopyPass()
  }

  override set mainCamera(value: Camera) {
    this.cameraRef = value
  }

  override setSize(width: number, height: number) {
    this.rtA.setSize(width, height)
    this.rtB.setSize(width, height)
  }

  override initialize(_renderer: WebGLRenderer, _alpha: boolean, frameBufferType: number) {
    // Match the composer's frame-buffer type so the prev-frame texture is
    // sampled identically to the live input.
    this.rtA.texture.type = frameBufferType as typeof this.rtA.texture.type
    this.rtB.texture.type = frameBufferType as typeof this.rtB.texture.type
  }

  override update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget, deltaTime?: number) {
    const dt = deltaTime ?? 0.016

    // Camera-derived screen-space motion: yaw delta → x, pitch delta → y.
    let mx = 0
    let my = 0
    if (this.cameraRef) {
      this.cameraRef.getWorldQuaternion(this.tmpQuat)
      if (this.lastQuat) {
        // Delta = inverse(last) * current
        const dq = this.tmpQuat.clone().premultiply(this.lastQuat.clone().invert())
        this.tmpEuler.setFromQuaternion(dq, 'YXZ')
        // Convert angular delta to UV-space motion via tangent half-FOV.
        const fovDeg =
          (this.cameraRef as PerspectiveCamera).isPerspectiveCamera
            ? (this.cameraRef as PerspectiveCamera).fov
            : 60
        const halfFov = (fovDeg * Math.PI) / 360
        const k = 0.5 / Math.tan(halfFov) // UV is 0..1, halfwidth = 0.5
        // Yawing right (negative euler.y) makes content shift left in screen,
        // so prev-frame should be sampled from the right. Sign: motion.x
        // positive means sample uv - motion goes left.
        mx = -Math.sin(this.tmpEuler.y) * k
        my = Math.sin(this.tmpEuler.x) * k
        // Clamp to a sane range so a sudden 180° look doesn't blow out.
        const cap = 0.25
        mx = Math.max(-cap, Math.min(cap, mx))
        my = Math.max(-cap, Math.min(cap, my))
      } else {
        this.lastQuat = new Quaternion()
      }
      this.lastQuat.copy(this.tmpQuat)
    }
    const motionUniform = this.uniforms.get('camMotion')!
    ;(motionUniform.value as Vector2).set(mx, my)

    // Time wrap.
    const t = this.uniforms.get('time')!
    t.value = ((t.value as number) + dt) % 10

    // First frame: prime both RTs with the current input so we don't sample
    // garbage on the very first read.
    if (this.firstFrame) {
      this.copyPass.render(renderer, inputBuffer, this.rtA)
      this.copyPass.render(renderer, inputBuffer, this.rtB)
      this.firstFrame = false
    }

    // Read prev = whichever RT was written LAST update.
    const prevRT = this.toggle ? this.rtB : this.rtA
    const writeRT = this.toggle ? this.rtA : this.rtB
    this.uniforms.get('prevBuffer')!.value = prevRT.texture

    // Save current input into writeRT for next-frame's prev-sample.
    this.copyPass.render(renderer, inputBuffer, writeRT)

    this.toggle = !this.toggle
  }

  override dispose() {
    this.rtA.dispose()
    this.rtB.dispose()
    this.copyPass.dispose?.()
    super.dispose()
  }
}
