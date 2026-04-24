import { PageFrame } from '../components/PageFrame';
import { EntryHeader } from '../components/EntryHeader';
import { ImagePanel } from '../components/ImagePanel';
import { StatBlock } from '../components/StatBlock';
import { ChapterDivider } from '../components/ChapterDivider';
import { ClassNoticeBlock } from '../components/ClassNoticeBlock';
import { renderBlocks } from '../utils/renderBlocks';
import type { LocationData } from '../types';
import shared from '../styles/shared.module.css';

export function LocationPage(props: LocationData) {
  const { pageNumber, header, image, sections, poi, statBlocks, classNotice } = props;

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

            <ChapterDivider label="Points of Interest" />

            <ul className={shared.poiList}>
              {poi.map((item) => (
                <li key={item.marker} className={shared.poi}>
                  <span className={shared.poiMarker}>{`[${item.marker}]`}</span>
                  <span>
                    <span className={shared.poiName}>{item.name}</span>
                    {' — '}
                    <span className={shared.poiDesc}>{item.desc}</span>
                  </span>
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
