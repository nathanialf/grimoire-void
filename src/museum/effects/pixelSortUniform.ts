import { Uniform } from 'three'

// Shared 0..1 ramp for the derez (timer expiry / ESC) animation. Driven by
// runDerezThen in MuseumPage.tsx; subscribed to by PixelSortEffect and
// (intensifying) GrainChromaEffect.
export const pixelSort = new Uniform<number>(0)
