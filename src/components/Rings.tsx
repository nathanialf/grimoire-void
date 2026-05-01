// Rings emblem rendered as inline SVG. Originally we shipped this as a
// CSS `mask-image: url('/images/rings.svg')` on a colored span, but iOS
// Safari composites mask-image elements onto their own GPU layer in a way
// that silently drops any inherited / applied SVG filter (including the
// chromatic-aberration `ca-fx` filter at #wiki-ca). Inline SVG with a
// currentColor fill renders into the same compositing context as the
// surrounding DOM, so the filter applies on iOS too.
//
// The path data mirrors public/images/rings.svg verbatim so the asset and
// the favicon stay in sync; if the silhouette changes, update both.

interface RingsProps {
  className?: string
  ariaHidden?: boolean
}

export function Rings({ className, ariaHidden = true }: RingsProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden={ariaHidden}
      focusable="false"
    >
      <g className="rings-rotor">
      <path
        fillRule="evenodd"
        d="
          M 98 50
          A 48 48 0 0 1 95.39 65.63
          L 84.04 61.72
          A 36 36 0 0 1 80.86 68.54
          L 91.14 74.72
          A 48 48 0 0 1 8.02 26.73
          L 18.51 32.55
          A 36 36 0 0 1 22.83 26.38
          L 13.77 18.51
          A 48 48 0 0 1 98 50
          Z
          M 50 72
          A 22 22 0 0 1 31.34 61.66
          L 18.74 67.86
          A 36 36 0 0 1 14.58 56.42
          L 28.21 53.06
          A 22 22 0 0 1 67.57 36.76
          L 79.59 29.50
          A 36 36 0 0 1 84.74 40.56
          L 71.44 45.05
          A 22 22 0 0 1 50 72
          Z
        "
      />
      </g>
    </svg>
  )
}
