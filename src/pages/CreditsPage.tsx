import { PageFrame } from '../components/PageFrame';
import { EntryHeader } from '../components/EntryHeader';
import { ChapterDivider } from '../components/ChapterDivider';
import { PixelatedText } from '../components/PixelatedText';
import shared from '../styles/shared.module.css';

interface CreditEntry {
  name: string;
  roles: string[];
}

const CREDITS: CreditEntry[] = [
  { name: 'Nathanial Fine', roles: ['Programmer', 'Designer'] },
  { name: 'Chris Wiley', roles: ['Designer'] },
];

export function CreditsPage() {
  return (
    <PageFrame pageNumber="999">
      <div className={shared.page}>
        <EntryHeader
          classification="End Matter"
          title="Credits"
          subtitle="Hands that shaped the archive"
        />

        <ChapterDivider label="Team" />

        <div className={shared.prose}>
          {CREDITS.map((entry) => (
            <p key={entry.name}>
              <PixelatedText letterSpacing={1.2} textTransform="uppercase">
                {entry.name}
              </PixelatedText>
              {' — '}
              <PixelatedText letterSpacing={0.8} textTransform="uppercase">
                {entry.roles.join(', ')}
              </PixelatedText>
            </p>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}
