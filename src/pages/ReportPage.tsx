import { PageFrame } from '../components/PageFrame';
import { EntryHeader } from '../components/EntryHeader';
import { ChapterDivider } from '../components/ChapterDivider';
import { ClassNoticeBlock } from '../components/ClassNoticeBlock';
import { MetaTable } from '../components/MetaTable';
import { Timeline } from '../components/Timeline';
import { NumberedList } from '../components/NumberedList';
import { renderBlocks } from '../utils/renderBlocks';
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
        <MetaTable rows={missionStats.stats.map((s) => ({
          label: s.label,
          value: s.value,
          variant: s.variant,
        }))} />

        <ChapterDivider label="Operational Timeline" />
        <Timeline entries={timeline} />

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
        <NumberedList items={recommendations} />

        {classNotice && <ClassNoticeBlock classNotice={classNotice} />}
      </div>
    </PageFrame>
  );
}
