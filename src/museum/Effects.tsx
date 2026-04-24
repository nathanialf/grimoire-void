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
        offset={new Vector2(0.0025, 0.0015)}
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
