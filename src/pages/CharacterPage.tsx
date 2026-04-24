import { PageFrame } from '../components/PageFrame';
import { EntryHeader } from '../components/EntryHeader';
import { ImagePanel } from '../components/ImagePanel';
import { StatBlock } from '../components/StatBlock';
import { ChapterDivider } from '../components/ChapterDivider';
import { ClassNoticeBlock } from '../components/ClassNoticeBlock';
import { renderBlocks } from '../utils/renderBlocks';
import type { CharacterData } from '../types';
import shared from '../styles/shared.module.css';
import styles from '../styles/CharacterPage.module.css';

export function CharacterPage(props: CharacterData) {
  const { pageNumber, header, image, sections, equipment, statBlocks, classNotice } = props;

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
          <div className={shared.sectionCol}>
            <div className={shared.prose}>
              {renderBlocks(firstSection.blocks, shared)}
            </div>

            <ChapterDivider label="Equipment" />

            <ul className={styles.equipList}>
              {equipment.map((item, i) => (
                <li key={i} className={styles.equipItem}>
                  <span className={styles.equipName}>{item.name}</span>
                  {' — '}
                  <span className={styles.equipDesc}>{item.desc}</span>
                </li>
              ))}
            </ul>
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
