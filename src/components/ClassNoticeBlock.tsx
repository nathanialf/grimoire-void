import { ChapterDivider } from './ChapterDivider';
import { PixelatedText } from './PixelatedText';
import { renderText } from '../utils/renderText';
import type { ClassNotice } from '../types';
import styles from '../styles/ClassNoticeBlock.module.css';

export function ClassNoticeBlock({ classNotice }: { classNotice: ClassNotice }) {
  return (
    <>
      <ChapterDivider label="Classification Notice" />
      <div className={styles.classNotice}>
        <p className={styles.classNoticeHeader}>
          <span className="visually-hidden">{classNotice.header}</span>
          <PixelatedText letterSpacing={2} textTransform="uppercase" fontWeight={700}>{classNotice.header}</PixelatedText>
        </p>
        {classNotice.body.map((paragraph, i) => (
          <p key={i}>{renderText(paragraph)}</p>
        ))}
        <p className={styles.classNoticeFooter}>
          {classNotice.footer.split('\n').map((line, i) => (
            <span key={i}>
              <span className="visually-hidden">{line}</span>
              <PixelatedText letterSpacing={0.8}>{line}</PixelatedText>
              {i < classNotice.footer.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>
      </div>
    </>
  );
}
