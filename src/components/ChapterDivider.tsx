import styles from '../styles/ChapterDivider.module.css';

interface ChapterDividerProps {
  label?: string;
}

export function ChapterDivider({ label }: ChapterDividerProps) {
  return (
    <div className={styles.divider}>
      <span className={styles.line} />
      <span className={styles.ornament}>
        {label && <span className={styles.label}>{label}</span>}
      </span>
      <span className={styles.line} />
    </div>
  );
}
