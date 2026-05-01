import { PageFrame } from '../components/PageFrame';
import { EntryHeader } from '../components/EntryHeader';
import { ChapterDivider } from '../components/ChapterDivider';
import { PixelatedText } from '../components/PixelatedText';
import shared from '../styles/shared.module.css';
import styles from '../styles/CreditsPage.module.css';

function resetGame() {
  if (!window.confirm('Reset all progress? This clears every docked cartridge and discovered variation, and reloads the page.')) {
    return;
  }
  try {
    window.localStorage.clear();
  } catch {
    // localStorage may be disabled (private browsing) — proceed to reload anyway.
  }
  window.location.reload();
}

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
          classification="End Matter — Rewrite Needed"
          title="Credits"
          filename="credits.intranet"
          filetype="CREDITS"
          author="archive.intranet"
          sharedWith={['All Personnel']}
          meta={[
            { label: 'Section', value: 'End Matter' },
            { label: 'Revision', value: 'Final' },
          ]}
          drift={0}
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

        <ChapterDivider label="Operator Controls" />

        <div className={shared.prose}>
          <p>Wipes every docked cartridge, discovered variation, and any other persistent state from this browser, then reloads.</p>
          <button type="button" className={styles.resetButton} onClick={resetGame}>
            <span className="visually-hidden">Reset Game</span>
            <PixelatedText letterSpacing={2} textTransform="uppercase">Reset Game</PixelatedText>
          </button>
        </div>
      </div>
    </PageFrame>
  );
}
