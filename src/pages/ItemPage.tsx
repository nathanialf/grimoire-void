import { PageFrame } from '../components/PageFrame';
import { EntryHeader } from '../components/EntryHeader';
import { ImagePanel } from '../components/ImagePanel';
import { StatBlock } from '../components/StatBlock';
import { ChapterDivider } from '../components/ChapterDivider';
import { ClassNoticeBlock } from '../components/ClassNoticeBlock';
import { renderBlocks } from '../utils/renderBlocks';
import type { ItemData } from '../types';
import shared from '../styles/shared.module.css';

export function ItemPage(props: ItemData) {
  const { pageNumber, header, image, sections, statBlocks, classNotice } = props;

  return (
    <PageFrame pageNumber={pageNumber}>
      <div className={shared.page}>
        <EntryHeader {...header} />

        <div className={shared.fullBleed}>
          <ImagePanel {...image} />
        </div>

        <ChapterDivider label={sections[0].heading} />

        <div className={shared.twoCol}>
          <div className={shared.sectionCol}>
            <div className={shared.prose}>
              {renderBlocks(sections[0].blocks, shared)}
            </div>

            {sections.slice(1).flatMap((section, i) => [
              <ChapterDivider key={`d${i}`} label={section.heading} />,
              <div key={`p${i}`} className={shared.prose}>
                {renderBlocks(section.blocks, shared)}
              </div>,
            ])}
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
