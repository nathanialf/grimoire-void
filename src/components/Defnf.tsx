// DEFNF wordmark rendered as inline SVG. Same rationale as Rings.tsx: iOS
// Safari silently drops SVG filters (including ca-fx) on elements that use
// `mask-image`, because the mask layer is composited on its own GPU layer.
// Inline SVG with `currentColor` fill keeps the glyph in the same
// compositing context as its surroundings, so ca-fx applies on iOS too.
//
// Path data mirrors public/images/defnf-logo.svg verbatim — keep them in
// sync if either changes.

interface DefnfProps {
  className?: string
  ariaLabel?: string
}

export function Defnf({ className, ariaLabel = 'defnf logo' }: DefnfProps) {
  return (
    <svg
      className={className}
      viewBox="27 69 240 160"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
      focusable="false"
    >
      <g transform="translate(0,288) scale(0.1,-0.1)" fill="currentColor" stroke="none">
        <path d="M270 1390 l0 -800 200 0 200 0 0 200 0 200 400 0 400 0 0 -200 0 -200 200 0 200 0 0 200 0 200 200 0 200 0 0 200 0 200 -200 0 -200 0 0 200 0 200 400 0 400 0 0 200 0 200 -600 0 -600 0 0 -400 0 -400 -200 0 -200 0 0 200 0 200 -200 0 -200 0 0 200 0 200 -200 0 -200 0 0 -800z" />
      </g>
    </svg>
  )
}
