import { PageFrame } from '../components/PageFrame';
import { PixelatedText } from '../components/PixelatedText';
import { Rings } from '../components/Rings';
import { Defnf } from '../components/Defnf';
import { useNavigate } from '../hooks/useNavigate';
import styles from '../styles/SplashScreen.module.css';

export function SplashScreen() {
  const navigate = useNavigate();
  return (
    <PageFrame locked>
      <div className={styles.splash}>
        <div className={styles.ringContainer}>
          <Rings className={`${styles.rings} ca-fx-soft`} />
          <Defnf className={`${styles.logo} ca-fx-soft`} />
        </div>
        <span className={styles.enterLabel}>
          <span className="visually-hidden">Enter</span>
          <PixelatedText letterSpacing={2} textTransform="uppercase">Enter</PixelatedText>
        </span>
        {/* Click target sits OUTSIDE the visual tree as a transparent
            overlay. Keeping the rings + logo out of any <a> ancestor lets
            the SVG ca-fx filter bind on iOS Safari, which otherwise drops
            descendant filters under anchors. Hover / focus-within on the
            splash wrapper still drives the ring rotation. */}
        <a
          href="/cover"
          className={styles.splashLink}
          onClick={(e) => { e.preventDefault(); navigate('/cover'); }}
          aria-label="Enter"
        />
      </div>
    </PageFrame>
  );
}
