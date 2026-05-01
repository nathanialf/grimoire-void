import { useSlots } from '../data/loadState';
import { pedestalPositions } from '../museum/sceneConstants';
import styles from '../styles/ImagePanel.module.css';

// The wiki's plan view of the museum, layered with live pedestal state:
// the static SVG file supplies the room chrome (walls, scale bar, title
// block, compass), and an overlay SVG sharing its viewBox fills the
// pedestal squares and inner rings to reflect each slot's current load
// state. Empty slots stay as outline only (matching the static drawing),
// partial slots fill the square, complete slots fill the square AND
// the inner ring.

interface Props {
  src: string;
  alt?: string;
  caption?: string;
}

const PEDESTAL_FILL = '#e8202a';

export function MuseumPlanFigure({ src, alt, caption }: Props) {
  const slots = useSlots();

  return (
    <figure className={styles.panel}>
      <div style={{ position: 'relative' }}>
        <img
          className={`${styles.image} ca-fx-soft`}
          src={src}
          alt={alt || ''}
          draggable={false}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-16 -16 32 32"
          shapeRendering="crispEdges"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {pedestalPositions.map(([x, z], i) => {
            const seated = slots[i];
            if (!seated) return null;
            return (
              <g key={i}>
                <rect
                  x={x - 0.5}
                  y={z - 0.5}
                  width={1}
                  height={1}
                  fill={PEDESTAL_FILL}
                />
                {/* Partial slots blank the inner ring with black so the
                    circle reads as "not filled" against the surrounding
                    red square. Complete slots leave the square solid
                    red — the inner ring is filled by the same red and
                    the pedestal reads as fully populated. */}
                {seated.state === 'partial' && (
                  <circle cx={x} cy={z} r={0.18} fill="#000" />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
