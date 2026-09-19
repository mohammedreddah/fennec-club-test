import { useI18n } from '../i18n/I18nContext.jsx';

export default function LanguageSwitcher({ variant = 'dark' }) {
  const { lang, setLang, languages } = useI18n();

  const base = 'rounded-lg px-2 py-1 text-xs font-medium transition-colors';
  const activeClass = variant === 'dark' ? 'bg-fennec-500 text-white' : 'bg-fennec-500 text-white';
  const inactiveClass = variant === 'dark' ? 'text-dune-100 hover:bg-white/10' : 'text-dune-600 hover:bg-dune-50';

  return (
    <div className="flex gap-1" role="group" aria-label="Language">
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={`${base} ${lang === l.code ? activeClass : inactiveClass}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
