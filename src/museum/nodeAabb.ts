import type { VariationNode } from '../data/variations'

// Visual radius of a scan node (the octahedron in Node.tsx). Kept in a
// non-component file so MuseumPage can compute the trigger AABB without
// pulling the whole component module under fast-refresh.
export const NODE_SIZE = 0.3

export function nodeAabb(node: VariationNode): {
  min: [number, number, number]
  max: [number, number, number]
} {
  const [x, y, z] = node.position
  return {
    min: [x - NODE_SIZE / 2, y - NODE_SIZE / 2, z - NODE_SIZE / 2],
    max: [x + NODE_SIZE / 2, y + NODE_SIZE / 2, z + NODE_SIZE / 2],
  }
}
