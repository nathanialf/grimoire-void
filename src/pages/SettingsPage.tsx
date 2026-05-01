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
  0: 'Sensor minimum — the world resolves only as the sparse vertex points your suit can still pick up.',
  1: 'Mid-tier — geometric edges become visible, but surfaces remain unrendered.',
  2: 'Full sensor capability — the world as the camera fully resolves it.',
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

        <div className={shared.prose}>
          <p>Vision tier — degrades how the world renders inside a variation. Persists across reloads. Progression-gated in the final game; freely toggled here while the suit-upgrade system is unbuilt.</p>
          <p>{TIER_DESCRIPTIONS[tier]}</p>
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

          <p>Post-processing — disables wiki chromatic aberration and the 3D scene effect chain (bloom, CA, scanlines, grain, dither, vignette, derez sort). The raw scene renders without colour-fringed chrome. Persists across reloads.</p>
          <p>These effects are intended ambience — the game's look depends on them. With this setting disabled, presentation will read as incomplete.</p>
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
