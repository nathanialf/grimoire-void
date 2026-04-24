import { type ReactNode, useEffect } from 'react';
import { usePageNav } from '../hooks/usePageNav';
import { useNavigate } from '../hooks/useNavigate';
import { PixelatedText } from './PixelatedText';
import styles from '../styles/PageFrame.module.css';

interface PageFrameProps {
  children: ReactNode;
  pageNumber?: string;
  locked?: boolean;
}

export function PageFrame({ children, pageNumber, locked }: PageFrameProps) {
  const { prev, next } = usePageNav();
  const navigate = useNavigate();

  useEffect(() => {
    // Body is always overflow:hidden; content div handles scrolling.
    // For locked pages, the PageFrame itself is height-constrained via CSS.
  }, [locked]);

  return (
    <main className={locked ? styles.frameLocked : styles.frame}>
      {children}
      {pageNumber && (
        <div className={styles.pageNavRow}>
          {prev && (
            <button className={`${styles.pageNavBtn} ${styles.pageNavPrev}`} onClick={() => navigate(prev)}>
              <span className="visually-hidden">&lt; PREV</span>
              <PixelatedText letterSpacing={0.5} textTransform="uppercase">&lt; PREV</PixelatedText>
            </button>
          )}
          <span className={styles.pageNumber}>
            <span className="visually-hidden">{`[ ${pageNumber} ]`}</span>
            <PixelatedText letterSpacing={1.5}>{`[ ${pageNumber} ]`}</PixelatedText>
          </span>
          {next && (
            <button className={`${styles.pageNavBtn} ${styles.pageNavNext}`} onClick={() => navigate(next)}>
              <span className="visually-hidden">NEXT &gt;</span>
              <PixelatedText letterSpacing={0.5} textTransform="uppercase">NEXT &gt;</PixelatedText>
            </button>
          )}
        </div>
      )}
    </main>
  );
}
