import { useMemo } from 'react'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction, KernelSize, Effect } from 'postprocessing'
import { Vector2 } from 'three'
import { ColorGradeEffect } from './effects/ColorGrade'
import { GlitchOutEffect } from './effects/GlitchOut'

function EffectWrapper({ effect }: { effect: Effect }) {
  return <primitive object={effect} dispose={null} />
}

export function Effects() {
  const grade = useMemo(() => new ColorGradeEffect(), [])
  const glitch = useMemo(() => new GlitchOutEffect(), [])
  // Chromatic aberration offset is in UV space, so a fixed value is much
  // more visible on a 4K monitor than a 720p laptop. Scale it so the CA
  // shift stays around a constant pixel count instead of blowing out on
  // big desktop screens.
  const caOffset = useMemo(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1920
    const targetPx = 2.2 // approximate pixel shift in the X direction
    const ux = targetPx / w
    return new Vector2(ux, ux * 0.6)
  }, [])

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={1.1}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.4}
        kernelSize={KernelSize.LARGE}
      />
      <EffectWrapper effect={grade} />
      <ChromaticAberration
        offset={caOffset}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise opacity={0.12} blendFunction={BlendFunction.OVERLAY} />
      <EffectWrapper effect={glitch} />
      <Vignette eskil={false} offset={0.25} darkness={0.55} />
    </EffectComposer>
  )
}
