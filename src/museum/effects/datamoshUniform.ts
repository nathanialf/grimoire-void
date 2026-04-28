import { Uniform } from 'three'

// Shared 0..1 ramp for the Carcosa door scene-swap animation. Driven by
// swapToScene in MuseumPage.tsx as a triangle (0 → peak → 0), with the
// actual scene swap happening at the peak.
export const datamosh = new Uniform<number>(0)
