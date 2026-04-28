import { Effect, EffectAttribute } from 'postprocessing'
import {
  BufferAttribute,
  BufferGeometry,
  ClampToEdgeWrapping,
  Color,
  DynamicDrawUsage,
  LinearFilter,
  Mesh,
  NearestFilter,
  NormalBlending,
  OrthographicCamera,
  PlaneGeometry,
  Points,
  RGBAFormat,
  RawShaderMaterial,
  Scene,
  ShaderMaterial,
  Texture,
  Uniform,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three'
import { pixelSort } from './pixelSortUniform'

const MAX_W = 1920
const MAX_H = 1080

const fragment = /* glsl */ `
  uniform float ramp;
  uniform sampler2D displacedTex;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    if (ramp <= 0.0001) {
      outputColor = inputColor;
      return;
    }
    vec3 c = texture2D(displacedTex, uv).rgb;
    outputColor = vec4(c, inputColor.a);
  }
`

// Points cloud — RawShaderMaterial, declare every attribute / uniform
// explicitly. This proved to be the rendering path that actually drew
// points; ShaderMaterial silently dropped them.
const pointsVertex = /* glsl */ `
  precision highp float;
  attribute vec3 position;
  attribute float sortedY;

  uniform vec2 resolution;
  uniform float ramp;
  uniform float pointSize;

  varying vec2 vUv;

  void main() {
    float origX = position.x;
    float origY = position.y;
    float interpY = mix(origY, sortedY, ramp);

    float ndcX = (origX + 0.5) / resolution.x * 2.0 - 1.0;
    float ndcY = (interpY + 0.5) / resolution.y * 2.0 - 1.0;

    gl_Position = vec4(ndcX, ndcY, 0.0, 1.0);
    gl_PointSize = pointSize;

    vUv = vec2((origX + 0.5) / resolution.x, (origY + 0.5) / resolution.y);
  }
`

const pointsFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D capturedTex;
  varying vec2 vUv;

  void main() {
    gl_FragColor = vec4(texture2D(capturedTex, vUv).rgb, 1.0);
  }
`

// Manual fullscreen-quad copy to replace CopyPass. CopyPass was silently
// not initializing in our standalone-effect context. This is straight
// three.js with no postprocessing-pipeline assumptions.
const copyVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`
const copyFragment = /* glsl */ `
  uniform sampler2D srcTex;
  varying vec2 vUv;
  void main() {
    gl_FragColor = texture2D(srcTex, vUv);
  }
`

// Full-column counting sort: every column gets sorted top-to-bottom by
// luma, with no threshold gate. This means every pixel has a non-trivial
// destination and the migration animation reads strongly regardless of
// scene brightness (matters for Carcosa's mostly-dark starfield, which
// previously had too few pixels above any threshold to migrate).
function computeSortedYs(
  pixels: Uint8Array,
  sortedYs: Float32Array,
  W: number,
  H: number,
): void {
  const lumas = new Uint8Array(H)
  const counts = new Uint32Array(256)

  for (let x = 0; x < W; x++) {
    // Compute lumas for this column.
    for (let y = 0; y < H; y++) {
      const i = (y * W + x) * 4
      const lum =
        0.2126 * pixels[i] +
        0.7152 * pixels[i + 1] +
        0.0722 * pixels[i + 2]
      lumas[y] = lum > 255 ? 255 : lum < 0 ? 0 : lum | 0
    }

    // Counting sort over the entire column.
    for (let i = 0; i < 256; i++) counts[i] = 0
    for (let y = 0; y < H; y++) counts[lumas[y]]++
    let acc = 0
    for (let i = 0; i < 256; i++) {
      const c = counts[i]
      counts[i] = acc
      acc += c
    }
    for (let y = 0; y < H; y++) {
      const lum = lumas[y]
      const rank = counts[lum]++
      sortedYs[y * W + x] = rank
    }
  }
}

export class PixelSortEffect extends Effect {
  private capturedRT: WebGLRenderTarget
  private displacedRT: WebGLRenderTarget
  private fullPixels: Uint8Array
  private sortedYs: Float32Array

  // Manual fullscreen-quad copy.
  private copyScene: Scene
  private copyCamera: OrthographicCamera
  private copyMat: ShaderMaterial

  // Points cloud.
  private pointsScene: Scene
  private pointsCamera: OrthographicCamera
  private pointsGeo: BufferGeometry
  private pointsMat: RawShaderMaterial
  private points: Points

  private hasSorted = false
  private prevClearColor = new Color()
  private prevClearAlpha = 1

  constructor() {
    const W = MAX_W
    const H = MAX_H
    const count = W * H

    const displacedRT = new WebGLRenderTarget(W, H, {
      format: RGBAFormat,
      type: UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    })
    displacedRT.texture.minFilter = LinearFilter
    displacedRT.texture.magFilter = LinearFilter
    displacedRT.texture.wrapS = ClampToEdgeWrapping
    displacedRT.texture.wrapT = ClampToEdgeWrapping

    super('PixelSortEffect', fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['ramp', pixelSort],
        ['displacedTex', new Uniform<Texture>(displacedRT.texture)],
      ]),
    })

    this.displacedRT = displacedRT

    this.capturedRT = new WebGLRenderTarget(W, H, {
      format: RGBAFormat,
      type: UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    })
    this.capturedRT.texture.minFilter = NearestFilter
    this.capturedRT.texture.magFilter = NearestFilter
    this.capturedRT.texture.wrapS = ClampToEdgeWrapping
    this.capturedRT.texture.wrapT = ClampToEdgeWrapping

    this.fullPixels = new Uint8Array(W * H * 4)

    // Manual copy scene.
    this.copyScene = new Scene()
    this.copyCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.copyMat = new ShaderMaterial({
      vertexShader: copyVertex,
      fragmentShader: copyFragment,
      uniforms: { srcTex: { value: null } },
      depthTest: false,
      depthWrite: false,
    })
    const copyMesh = new Mesh(new PlaneGeometry(2, 2), this.copyMat)
    copyMesh.frustumCulled = false
    this.copyScene.add(copyMesh)

    // Points geometry.
    const positions = new Float32Array(count * 3)
    const sortedYs = new Float32Array(count)
    let pi = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        positions[pi++] = x
        positions[pi++] = y
        positions[pi++] = 0
        sortedYs[y * W + x] = y
      }
    }

    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    const sortedYAttr = new BufferAttribute(sortedYs, 1)
    sortedYAttr.usage = DynamicDrawUsage
    geo.setAttribute('sortedY', sortedYAttr)
    geo.setDrawRange(0, count)

    this.pointsGeo = geo
    this.sortedYs = sortedYs

    this.pointsScene = new Scene()
    this.pointsCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const dpr = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1
    this.pointsMat = new RawShaderMaterial({
      vertexShader: pointsVertex,
      fragmentShader: pointsFragment,
      uniforms: {
        capturedTex: { value: this.capturedRT.texture },
        ramp: { value: 0 },
        resolution: { value: new Vector2(W, H) },
        pointSize: { value: dpr },
      },
      blending: NormalBlending,
      depthTest: false,
      depthWrite: false,
      transparent: false,
    })

    this.points = new Points(geo, this.pointsMat)
    this.points.frustumCulled = false
    this.pointsScene.add(this.points)
  }

  override setSize(_width: number, _height: number): void {
    // Internal RTs and geometry are at fixed MAX_W × MAX_H; nothing to
    // resize. Importantly, do NOT reset hasSorted here — a canvas resize
    // mid-derez (e.g. triggered by scene swaps, devtools, fullscreen) would
    // otherwise re-capture a partially-rendered frame and cut the visible
    // sort animation short.
  }

  override update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget, _deltaTime?: number) {
    const ramp = (this.uniforms.get('ramp') as Uniform).value as number

    if (ramp <= 0.001) {
      this.hasSorted = false
      return
    }

    const W = MAX_W
    const H = MAX_H

    // Save renderer state.
    const prevTarget = renderer.getRenderTarget()
    renderer.getClearColor(this.prevClearColor)
    this.prevClearAlpha = renderer.getClearAlpha()

    if (!this.hasSorted) {
      // Manual copy: inputBuffer.texture → capturedRT via fullscreen quad.
      this.copyMat.uniforms.srcTex.value = inputBuffer.texture
      renderer.setRenderTarget(this.capturedRT)
      renderer.setClearColor(0x000000, 1)
      renderer.clear(true, false, false)
      renderer.render(this.copyScene, this.copyCamera)

      // Sync readback at the capped size.
      renderer.readRenderTargetPixels(this.capturedRT, 0, 0, W, H, this.fullPixels)

      // Counting sort: every column sorted top-to-bottom by luma.
      computeSortedYs(this.fullPixels, this.sortedYs, W, H)
      const sortedYAttr = this.pointsGeo.getAttribute('sortedY') as BufferAttribute
      sortedYAttr.needsUpdate = true
      this.hasSorted = true
    }

    this.pointsMat.uniforms.ramp.value = ramp

    // Render points cloud → displacedRT.
    renderer.setRenderTarget(this.displacedRT)
    renderer.setClearColor(0x000000, 1)
    renderer.clear(true, false, false)
    renderer.render(this.pointsScene, this.pointsCamera)

    // Restore renderer state.
    renderer.setRenderTarget(prevTarget)
    renderer.setClearColor(this.prevClearColor, this.prevClearAlpha)
  }

  override dispose() {
    this.capturedRT.dispose()
    this.displacedRT.dispose()
    this.pointsGeo.dispose()
    this.pointsMat.dispose()
    this.copyMat.dispose()
    super.dispose()
  }
}
