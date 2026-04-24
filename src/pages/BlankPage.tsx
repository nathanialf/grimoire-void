import { PageFrame } from '../components/PageFrame';
import { PixelatedText } from '../components/PixelatedText';
import styles from '../styles/BlankPage.module.css';

export function BlankPage() {
  return (
    <PageFrame pageNumber="002" locked>
      <div className={styles.page}>
        <span className={styles.text}>
          <span className="visually-hidden">This page intentionally left blank</span>
          <PixelatedText letterSpacing={2} textTransform="uppercase">This page intentionally left blank</PixelatedText>
        </span>
      </div>
    </PageFrame>
  );
}
