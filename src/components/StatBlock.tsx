import styles from '../styles/StatBlock.module.css';

interface Stat {
  label: string;
  value: string;
  variant?: 'danger' | 'accent';
}

interface StatBlockProps {
  title?: string;
  stats: Stat[];
}

export function StatBlock({ title, stats }: StatBlockProps) {
  return (
    <div className={styles.block}>
      {title && (
        <div className={styles.header}>{title}</div>
      )}
      <div className={styles.grid}>
        {stats.map((stat, i) => (
          <div key={i} className={styles.stat}>
            <span className={styles.label}>{stat.label}</span>
            <span
              className={`${styles.value} ${
                stat.variant === 'danger'
                  ? styles.valueDanger
                  : stat.variant === 'accent'
                    ? styles.valueAccent
                    : ''
              }`}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
