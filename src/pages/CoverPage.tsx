import { PageFrame } from '../components/PageFrame';
import { PixelatedHeading } from '../components/PixelatedHeading';
import { PixelatedText } from '../components/PixelatedText';
import { useNavigate } from '../hooks/useNavigate';
import styles from '../styles/CoverPage.module.css';

export function CoverPage() {
  const navigate = useNavigate();
  return (
    <PageFrame locked>
      <div className={styles.cover}>
        <span className={styles.emblem}>
          <span className="visually-hidden">// Sector 9 Archives — Restricted //</span>
          <PixelatedText letterSpacing={4} textTransform="uppercase">// Sector 9 Archives — Restricted //</PixelatedText>
        </span>
        <h1 className="visually-hidden">Grimoire Void</h1>
        <PixelatedHeading
          lines={['Grimoire', 'Void']}
          renderSize={32}
          scale={3}
          align="center"
          lineHeight={0.95}
          className={styles.title}
        />
        <p className={`${styles.subtitle} visually-hidden`}>A Restricted Archive of the Lost</p>
        <PixelatedHeading
          lines={['A Restricted Archive of the Lost']}
          renderSize={14}
          scale={2}
          fontStyle="italic"
          fontWeight={400}
          align="center"
          alphaThreshold={60}
          color={getComputedStyle(document.documentElement).getPropertyValue('--color-text-dim').trim()}
          className={styles.subtitle}
        />
        <div className={styles.rule} />
        <div className={styles.actions}>
          <a
            href="/blank"
            className={styles.enter}
            onClick={(e) => { e.preventDefault(); navigate('/blank'); }}
          >
            <span className="visually-hidden">Begin Reading</span>
            <PixelatedText letterSpacing={2} textTransform="uppercase">Begin Reading</PixelatedText>
          </a>
          <a
            href="/museum"
            className={styles.enter}
            onClick={(e) => { e.preventDefault(); navigate('/museum'); }}
          >
            <span className="visually-hidden">Reconstitute</span>
            <PixelatedText letterSpacing={2} textTransform="uppercase">Reconstitute</PixelatedText>
          </a>
        </div>
        <span className={styles.meta}>
          <span className="visually-hidden">Unauthorized reproduction is punishable by dissolution</span>
          <PixelatedText letterSpacing={1.5}>Unauthorized reproduction is punishable by dissolution</PixelatedText>
        </span>
      </div>
    </PageFrame>
  );
}
