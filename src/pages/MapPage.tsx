import { PageFrame } from '../components/PageFrame';
import { EntryHeader } from '../components/EntryHeader';
import { ImagePanel } from '../components/ImagePanel';
import { ChapterDivider } from '../components/ChapterDivider';
import { ClassNoticeBlock } from '../components/ClassNoticeBlock';
import { renderBlocks } from '../utils/renderBlocks';
import type { MapData } from '../types';
import shared from '../styles/shared.module.css';

export function MapPage(props: MapData) {
  const { pageNumber, header, image, sections, poi, classNotice } = props;

  return (
    <PageFrame pageNumber={pageNumber}>
      <div className={shared.page}>
        <EntryHeader {...header} />

        <div className={shared.fullBleed}>
          <ImagePanel {...image} />
        </div>

        <ChapterDivider label={sections[0].heading} />

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

        {classNotice && <ClassNoticeBlock classNotice={classNotice} />}
      </div>
    </PageFrame>
  );
}
