import { PageFrame } from '../components/PageFrame';
import { EntryHeader } from '../components/EntryHeader';
import { ChapterDivider } from '../components/ChapterDivider';
import { PixelatedText } from '../components/PixelatedText';
import {
  setPostProcessing,
  setVisionTier,
  usePostProcessing,
  useVisionTier,
  type VisionTier,
} from '../data/settings';
import shared from '../styles/shared.module.css';
import styles from '../styles/SettingsPage.module.css';

const TIER_LABELS: Record<VisionTier, string> = {
  0: 'Vertices',
  1: 'Wireframe',
  2: 'Full',
};

const TIER_DESCRIPTIONS: Record<VisionTier, string> = {
  0: 'Vertex points only.',
  1: 'Geometric edges only.',
  2: 'Surfaces resolved.',
};

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

export function SettingsPage() {
  const tier = useVisionTier();
  const postFx = usePostProcessing();
  return (
    <PageFrame>
      <div className={shared.page}>
        <EntryHeader
          classification="Operator Console"
          title="Settings"
          filename="settings.intranet"
          filetype="SETTINGS"
          author="archive.intranet"
          sharedWith={['Operator']}
          meta={[
            { label: 'Section', value: 'End Matter' },
            { label: 'Revision', value: 'Live' },
          ]}
          drift={0}
        />

        <ChapterDivider label="Operator Controls" />

        <div className={styles.menu}>
          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <PixelatedText letterSpacing={2} textTransform="uppercase">Vision Tier</PixelatedText>
            </div>
            <div className={styles.tierGroup} role="radiogroup" aria-label="Vision Tier">
              {([0, 1, 2] as const).map((t) => {
                const active = tier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`${styles.tierButton} ${active ? styles.tierButtonActive : ''}`}
                    onClick={() => setVisionTier(t)}
                  >
                    <PixelatedText letterSpacing={2} textTransform="uppercase">
                      {TIER_LABELS[t]}
                    </PixelatedText>
                  </button>
                );
              })}
            </div>
            <div className={styles.rowHint}>{TIER_DESCRIPTIONS[tier]}</div>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <PixelatedText letterSpacing={2} textTransform="uppercase">Post-Processing</PixelatedText>
            </div>
            <div className={styles.tierGroup} role="radiogroup" aria-label="Post-processing">
              {([true, false] as const).map((on) => {
                const active = postFx === on;
                return (
                  <button
                    key={on ? 'on' : 'off'}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`${styles.tierButton} ${active ? styles.tierButtonActive : ''}`}
                    onClick={() => setPostProcessing(on)}
                  >
                    <PixelatedText letterSpacing={2} textTransform="uppercase">
                      {on ? 'On' : 'Off'}
                    </PixelatedText>
                  </button>
                );
              })}
            </div>
            <div className={styles.rowHint}>Bloom, CA, scanlines, grain, vignette.</div>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <PixelatedText letterSpacing={2} textTransform="uppercase">Reset</PixelatedText>
            </div>
            <button type="button" className={styles.resetButton} onClick={resetGame}>
              <span className="visually-hidden">Reset Game</span>
              <PixelatedText letterSpacing={2} textTransform="uppercase">Wipe Save</PixelatedText>
            </button>
            <div className={styles.rowHint}>Clears all carts and variations, then reloads.</div>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
