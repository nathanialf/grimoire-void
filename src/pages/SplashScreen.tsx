import { PageFrame } from '../components/PageFrame';
import { PixelatedHeading } from '../components/PixelatedHeading';
import { PixelatedText } from '../components/PixelatedText';
import { useNavigate } from '../hooks/useNavigate';
import styles from '../styles/SplashScreen.module.css';

export function SplashScreen() {
  const navigate = useNavigate();
  return (
    <PageFrame locked>
      <a
        href="/cover"
        className={styles.splash}
        onClick={(e) => { e.preventDefault(); navigate('/cover'); }}
      >
        <div className={`${styles.ringContainer} ca-fx`}>
          <img src="/images/rings.png" alt="" className={styles.rings} />
          <img
            src="/images/defnf-logo.png"
            alt="defnf logo"
            className={styles.logo}
          />
        </div>
        <span className={`${styles.corp} visually-hidden`}>defnf computing corporation</span>
        <PixelatedHeading
          lines={['defnf computing corporation']}
          renderSize={12}
          scale={2}
          fontStyle="italic"
          fontWeight={400}
          alphaThreshold={60}
          color={getComputedStyle(document.documentElement).getPropertyValue('--color-text-dim').trim()}
          className={styles.corp}
        />
        <span className={styles.enterLabel}>
          <span className="visually-hidden">Enter</span>
          <PixelatedText letterSpacing={2} textTransform="uppercase">Enter</PixelatedText>
        </span>
      </a>
    </PageFrame>
  );
}
