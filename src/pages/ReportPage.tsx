import { PageFrame } from '../components/PageFrame';
import { EntryHeader } from '../components/EntryHeader';
import { ChapterDivider } from '../components/ChapterDivider';
import { ClassNoticeBlock } from '../components/ClassNoticeBlock';
import { renderBlocks } from '../utils/renderBlocks';
import { renderText } from '../utils/renderText';
import type { ReportData } from '../types';
import shared from '../styles/shared.module.css';
import styles from '../styles/ReportPage.module.css';

export function ReportPage(props: ReportData) {
  const {
    pageNumber, header, sections, missionStats,
    timeline, casualties, recommendations, classNotice,
  } = props;

  return (
    <PageFrame pageNumber={pageNumber}>
      <div className={shared.page}>
        <EntryHeader {...header} />

        {sections.flatMap((section, i) => [
          <ChapterDivider key={`d${i}`} label={section.heading} />,
          <div key={`p${i}`} className={shared.prose}>
            {renderBlocks(section.blocks, shared)}
          </div>,
        ])}

        <ChapterDivider label="Mission Parameters" />
        <div className={styles.metaTable}>
          {missionStats.stats.map((stat, i) => (
            <div key={i} className={styles.metaRow}>
              <span className={styles.metaLabel}>{stat.label}</span>
              <span className={
                stat.variant === 'danger' ? styles.metaValueDanger
                : stat.variant === 'accent' ? styles.metaValueAccent
                : styles.metaValue
              }>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        <ChapterDivider label="Operational Timeline" />
        <div className={shared.prose}>
          <ul className={styles.timeline}>
            {timeline.map((entry, i) => (
              <li key={i}>
                <span className={styles.timestamp}>{entry.timestamp}</span>
                <span className={styles.event}>{renderText(entry.event)}</span>
              </li>
            ))}
          </ul>
        </div>

        <ChapterDivider label="Casualties & Losses" />
        <div className={shared.prose}>
          <ul className={styles.casualties}>
            {casualties.map((c, i) => (
              <li key={i}>
                <span className={c.status === 'LOST' ? styles.lost : styles.kia}>{c.status}</span>
                {' '}
                {c.text}
              </li>
            ))}
          </ul>
        </div>

        <ChapterDivider label="Recommendations" />
        <div className={shared.prose}>
          <ol className={styles.recommendations}>
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ol>
        </div>

        {classNotice && <ClassNoticeBlock classNotice={classNotice} />}
      </div>
    </PageFrame>
  );
}
