import { useTranslation } from 'react-i18next'
import { LANGUAGES, setLanguage } from '../i18n'

/**
 * Fixed top bar: identity, map-layer switch, connectivity, language,
 * methodology. Everything global lives here so the map keeps its edges free.
 */
export default function Header({ colorMode, onColorMode, online, onMethodology, search = null }) {
  const { t, i18n } = useTranslation()

  return (
    <header className="relative z-30 shrink-0 border-b border-line bg-ink-900/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
      {/* identity */}
      <div className="flex min-w-0 items-center gap-3">
        <img src="/icon.svg" alt="" className="h-8 w-8 shrink-0 rounded" />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="text-[17px] font-bold leading-none tracking-[0.18em] text-slate-50">
              {t('app.title')}
            </h1>
            <span className="hidden shrink-0 rounded-sm border border-line px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted sm:inline">
              {t('app.sih')}
            </span>
          </div>
          <p className="mt-0.5 hidden truncate text-[11px] leading-none text-muted md:block">
            {t('app.subtitle')}
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* map layer switch */}
        <div
          className="flex items-center rounded border border-line bg-ink-700 p-0.5"
          role="group"
          aria-label={t('header.modeLabel')}
        >
          {[
            { id: 'susceptibility', label: t('header.modeSusceptibility') },
            { id: 'risk', label: t('header.modeRisk') },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onColorMode(m.id)}
              aria-pressed={colorMode === m.id}
              className={`rounded-[3px] px-2.5 py-1.5 text-[11px] font-semibold transition ${
                colorMode === m.id
                  ? 'bg-sky-900/80 text-sky-100 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* connectivity */}
        <div
          className={`chip ${
            online
              ? 'border-emerald-900 bg-emerald-950/60 text-emerald-300'
              : 'border-amber-800 bg-amber-950/60 text-amber-300'
          }`}
          title={online ? t('status.online') : t('status.offlineNote')}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              online ? 'bg-emerald-400' : 'animate-pulse bg-amber-400'
            }`}
          />
          <span className="hidden sm:inline">
            {online ? t('status.online') : t('status.offline')}
          </span>
        </div>

        {/* language */}
        <div
          className="flex items-center rounded border border-line bg-ink-700 p-0.5"
          role="group"
          aria-label={t('header.language')}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              aria-pressed={i18n.language === l.code}
              title={l.label}
              className={`rounded-[3px] px-2 py-1.5 text-[11px] font-semibold transition ${
                i18n.language === l.code
                  ? 'bg-ink-500 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {l.short}
            </button>
          ))}
        </div>

        <button type="button" className="btn" onClick={onMethodology}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
          </svg>
          <span className="hidden lg:inline">{t('header.methodology')}</span>
        </button>
        </div>
      </div>

      {/* Phones do not get the left control column, and searching is the main
          thing someone does on one - so the bar is persistent here, not a
          secondary control hidden behind a menu. */}
      {search && (
        <div className="border-t border-line px-3 py-2 lg:hidden">{search}</div>
      )}
    </header>
  )
}
