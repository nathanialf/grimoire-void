import { Uniform } from 'three'

// Shared 0..1 ramp. Post passes multiply their strength by this; Timer ramps
// it to 1 over ~800ms before routing back to /cover.
export const glitchOut = new Uniform<number>(0)
