import { useMemo, useState } from 'react';
import { PixelatedHeading } from './PixelatedHeading';
import { PixelatedText } from './PixelatedText';
import { useCartridgeStates } from '../data/loadState';
import { buildNavEntries, type NavEntry } from '../data/navOrder';
import { Rings } from './Rings';
import styles from '../styles/Navigation.module.css';

interface NavigationProps {
  onToggle?: (open: boolean) => void;
  pathname: string;
  navigate: (to: string) => void;
}

function NavLink({ entry, pathname, navigate, close }: { entry: NavEntry; pathname: string; navigate: (to: string) => void; close: () => void }) {
  const isRedacted = entry.redacted;
  const isActive = pathname === entry.to;

  const inner = (
    <span className={styles.linkLabel}>
      <span className="visually-hidden">{`${entry.pageNumber} ${entry.label}`}</span>
      <span className={styles.pageNum}>
        <PixelatedText renderSize={7} textTransform="uppercase" letterSpacing={0.8}>{entry.pageNumber}</PixelatedText>
      </span>
      {entry.label.split(' ').map((word, i) => (
        <PixelatedText key={i} renderSize={7} textTransform="uppercase" letterSpacing={0.4}>{word}</PixelatedText>
      ))}
    </span>
  );

  if (isRedacted && entry.to) {
    return (
      <a
        href={entry.to}
        data-nav={entry.to}
        className={`${styles.link} ${styles.linkRedacted} ${isActive ? styles.linkActive : ''}`}
        onClick={(e) => { e.preventDefault(); navigate(entry.to); close(); }}
      >
        {inner}
      </a>
    );
  }

  if (isRedacted) {
    return (
      <span className={`${styles.link} ${styles.linkRedacted}`}>
        {inner}
      </span>
    );
  }

  return (
    <a
      href={entry.to}
      data-nav={entry.to}
      className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
      onClick={(e) => { e.preventDefault(); navigate(entry.to); close(); }}
    >
      {inner}
    </a>
  );
}

export function Navigation({ onToggle, pathname, navigate }: NavigationProps) {
  const [open, setOpen] = useState(false);
  const states = useCartridgeStates();
  const entries = useMemo(() => buildNavEntries(states), [states]);

  const toggle = (next: boolean) => {
    setOpen(next);
    onToggle?.(next);
  };

  const close = () => toggle(false);

  return (
    <>
      <button
        className={`${styles.toggle} ca-fx-soft`}
        onClick={() => toggle(!open)}
        aria-label="Toggle navigation"
      >
        {open ? '\u00D7' : '\u2261'}
      </button>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
        onClick={close}
      />
      <nav className={`${styles.nav} ${open ? styles.navOpen : ''}`}>
        <a
          href="/"
          className={styles.title}
          onClick={(e) => { e.preventDefault(); navigate('/'); close(); }}
        >
          <span className="visually-hidden">Grimoire Void</span>
          <PixelatedHeading
            lines={['Grimoire Void']}
            renderSize={16}
            scale={2}
            align="left"
            textTransform="uppercase"
            caStrength="soft"
            color={getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()}
            letterSpacing={2}
          />
        </a>
        <div className={styles.subtitle}>
          <span className="visually-hidden">Restricted Archive</span>
          <PixelatedText renderSize={10} letterSpacing={2} textTransform="uppercase">Restricted Archive</PixelatedText>
        </div>
        <div className={styles.list} data-nav-list>
          <ul className={styles.listInner} data-nav-list-inner>
            {entries.map((entry) => (
              <li key={entry.to || entry.pageNumber}>
                <NavLink entry={entry} pathname={pathname} navigate={navigate} close={close} />
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.footer}>
          <span className="visually-hidden">0.2 // classified</span>
          <span className={styles.footerInner}>
            <span className={`${styles.footerLogo} ca-fx-soft`} role="img" aria-hidden="true">
              <Rings className={styles.footerLogoSvg} />
            </span>
            <PixelatedText renderSize={7} letterSpacing={0.8}>0.2 // classified</PixelatedText>
          </span>
          <button
            type="button"
            className={`${styles.settingsBtn} ca-fx-soft`}
            aria-label="Settings"
            onClick={() => { navigate('/settings'); close(); }}
          >
            <span aria-hidden="true">⚙</span>
          </button>
        </div>
        <a
          className={styles.copyright}
          href="https://defnf.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.copyrightYear}>
            <span className="visually-hidden">{`\u00A9 ${new Date().getFullYear()}`}</span>
            <span className={styles.copyrightSymbol}>
              <PixelatedText renderSize={11}>{'\u00A9'}</PixelatedText>
            </span>
            <PixelatedText renderSize={7}>{`${new Date().getFullYear()}`}</PixelatedText>
          </span>
          <span className={`${styles.copyrightLogo} ca-fx-soft`} role="img" aria-label="defnf">
            <span className={styles.copyrightLogoMask} />
          </span>
          <span className={styles.copyrightCell}>
            <span className="visually-hidden">DEFNF</span>
            <PixelatedText renderSize={7}>DEFNF</PixelatedText>
          </span>
        </a>
      </nav>
    </>
  );
}
