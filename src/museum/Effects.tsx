import { useMemo } from 'react'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction, KernelSize, Effect } from 'postprocessing'
import { UnsignedByteType, Vector2 } from 'three'
import { ColorGradeEffect } from './effects/ColorGrade'
import { HalationEffect } from './effects/Halation'
import { ToneMapEffect } from './effects/ToneMap'
import { BarrelEffect } from './effects/Barrel'
import { ScanlinesEffect } from './effects/Scanlines'
import { GrainChromaEffect } from './effects/GrainChroma'
import { DitherEffect } from './effects/Dither'
import { PixelSortEffect } from './effects/PixelSort'
import { DatamoshEffect } from './effects/Datamosh'
import { usePostProcessing } from '../data/settings'

function EffectWrapper({ effect }: { effect: Effect }) {
  return <primitive object={effect} dispose={null} />
}

export function Effects() {
  const postFx = usePostProcessing()
  const halation = useMemo(() => new HalationEffect(), [])
  const tone = useMemo(() => new ToneMapEffect(), [])
  const grade = useMemo(() => new ColorGradeEffect(), [])
  const barrel = useMemo(() => new BarrelEffect(), [])
  const scanlines = useMemo(() => new ScanlinesEffect(), [])
  const grain = useMemo(() => new GrainChromaEffect(), [])
  const dither = useMemo(() => new DitherEffect(), [])
  const pixelSort = useMemo(() => new PixelSortEffect(), [])
  const datamosh = useMemo(() => new DatamoshEffect(), [])
  // Chromatic aberration offset is in UV space, so a fixed value is much
  // more visible on a 4K monitor than a 720p laptop. Scale it so the CA
  // shift stays around a constant pixel count instead of blowing out on
  // big desktop screens.
  const caOffset = useMemo(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1920
    const targetPx = 2.2
    const ux = targetPx / w
    return new Vector2(ux, ux * 0.6)
  }, [])

  // Operator-disabled post-processing → render the raw scene. Skip the
  // entire EffectComposer so bloom/CA/grain/scanlines/dither/etc don't
  // touch the framebuffer.
  if (!postFx) return null

  return (
    <EffectComposer multisampling={0} frameBufferType={UnsignedByteType}>
      <EffectWrapper effect={halation} />
      <Bloom
        intensity={1.1}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.4}
        kernelSize={KernelSize.LARGE}
      />
      <EffectWrapper effect={tone} />
      <EffectWrapper effect={grade} />
      <ChromaticAberration
        offset={caOffset}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />
      <EffectWrapper effect={barrel} />
      <EffectWrapper effect={scanlines} />
      <EffectWrapper effect={grain} />
      <EffectWrapper effect={dither} />
      <EffectWrapper effect={pixelSort} />
      <EffectWrapper effect={datamosh} />
      <Vignette eskil={false} offset={0.25} darkness={0.55} />
    </EffectComposer>
  )
}
