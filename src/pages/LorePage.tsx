import { PageFrame } from '../components/PageFrame';
import { EntryHeader } from '../components/EntryHeader';
import { ChapterDivider } from '../components/ChapterDivider';
import { ClassNoticeBlock } from '../components/ClassNoticeBlock';
import { renderBlocks } from '../utils/renderBlocks';
import type { LoreData } from '../types';
import shared from '../styles/shared.module.css';

export function LorePage(props: LoreData) {
  const { pageNumber, header, sections, classNotice } = props;

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

        {classNotice && <ClassNoticeBlock classNotice={classNotice} />}
      </div>
    </PageFrame>
  );
}
