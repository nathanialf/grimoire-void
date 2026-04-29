import { PageFrame } from '../components/PageFrame';
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
          <span className={styles.rings} aria-hidden="true" />
          <img
            src="/images/defnf-logo.png"
            alt="defnf logo"
            className={styles.logo}
          />
        </div>
        <span className={styles.enterLabel}>
          <span className="visually-hidden">Enter</span>
          <PixelatedText letterSpacing={2} textTransform="uppercase">Enter</PixelatedText>
        </span>
      </a>
    </PageFrame>
  );
}
