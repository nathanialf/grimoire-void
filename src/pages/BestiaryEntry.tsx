import { PageFrame } from '../components/PageFrame';
import { EntryHeader } from '../components/EntryHeader';
import { ImagePanel } from '../components/ImagePanel';
import { StatBlock } from '../components/StatBlock';
import { ChapterDivider } from '../components/ChapterDivider';
import { ClassNoticeBlock } from '../components/ClassNoticeBlock';
import { renderBlocks } from '../utils/renderBlocks';
import type { BestiaryData } from '../types';
import shared from '../styles/shared.module.css';

export function BestiaryEntry(props: BestiaryData) {
  const { pageNumber, header, image, sections, statBlocks, classNotice } = props;

  const firstSection = sections[0];

  return (
    <PageFrame pageNumber={pageNumber}>
      <div className={shared.page}>
        <EntryHeader {...header} />

        <div className={shared.fullBleed}>
          <ImagePanel {...image} />
        </div>

        <ChapterDivider label={firstSection.heading} />

        <div className={shared.twoCol}>
          <div className={shared.prose}>
            {renderBlocks(firstSection.blocks, shared)}
          </div>

          <div className={shared.sidebar}>
            {statBlocks.map((block, i) => (
              <StatBlock key={i} {...block} />
            ))}
          </div>
        </div>

        {classNotice && <ClassNoticeBlock classNotice={classNotice} />}
      </div>
    </PageFrame>
  );
}
