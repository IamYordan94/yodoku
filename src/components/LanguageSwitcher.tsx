import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          background: 'var(--yodoku-panel)',
          border: '2px solid var(--yodoku-ink)',
          borderRadius: '8px',
        }}
        aria-hidden="true"
      >
        <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          EN
        </span>
      </div>
    );
  }

  const currentLang = i18n.language;
  const otherLang = currentLang === 'en' ? 'es' : 'en';
  const otherLabel = otherLang === 'es' ? 'Español' : 'English';

  const handleSwitch = () => {
    i18n.changeLanguage(otherLang);
    try {
      localStorage.setItem('yodoku_language', otherLang);
    } catch {
      // ignore
    }
    document.documentElement.lang = otherLang;
  };

  return (
    <button
      onClick={handleSwitch}
      aria-label={t('header.language')}
      title={t('header.language')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        background: 'var(--yodoku-panel)',
        border: '2px solid var(--yodoku-ink)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--yodoku-ink)',
        textDecoration: 'none',
        lineHeight: 1,
      }}
    >
      <span>{currentLang.toUpperCase()}</span>
      <span style={{ opacity: 0.5, fontSize: '9px' }}>{otherLabel}</span>
    </button>
  );
}