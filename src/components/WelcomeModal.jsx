import { useTranslation } from 'react-i18next'

/**
 * Three cards on first open, and never again unless someone asks for it from
 * the help icon.
 *
 * The middle card is the one that earns its place. `risk = susceptibility x
 * trigger` is the single idea the whole dashboard rests on, and without it a
 * first-time reader cannot tell why a Very High slope can be coloured green.
 * Said in plain words - "a slope that can fail, and rain heavy enough to start
 * it" - it takes one sentence and it is the difference between a colour map
 * and an explanation.
 */
export default function WelcomeModal({ open, onClose }) {
  const { t } = useTranslation()
  if (!open) return null

  const steps = [
    { n: 1, title: t('welcome.s1Title'), body: t('welcome.s1Body'), glyph: <SearchGlyph /> },
    { n: 2, title: t('welcome.s2Title'), body: t('welcome.s2Body'), glyph: <SlopeGlyph /> },
    { n: 3, title: t('welcome.s3Title'), body: t('welcome.s3Body'), glyph: <BandsGlyph /> },
  ]

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-ink-900/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('welcome.title')}
    >
      <div className="panel scroll-thin max-h-full w-[440px] max-w-full overflow-y-auto">
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-9 w-9 rounded" />
            <div>
              <h2 className="text-[17px] font-bold leading-tight text-slate-50">
                {t('welcome.title')}
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-400">{t('welcome.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-ink-900/70 text-sky-300">
                {s.glyph}
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold leading-snug text-slate-100">{s.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-line px-5 py-4">
          <button type="button" className="btn btn-primary w-full !py-2.5 !text-[13px]" onClick={onClose}>
            {t('welcome.start')}
          </button>
          <p className="mt-2.5 text-center text-[11px] text-slate-500">{t('welcome.reopen')}</p>
        </div>
      </div>
    </div>
  )
}

const svg = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.1,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
}

function SearchGlyph() {
  return (
    <svg {...svg}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  )
}

/** A hillside with rain falling on it: the two halves of the model, drawn. */
function SlopeGlyph() {
  return (
    <svg {...svg}>
      <path d="M2 20h20L13 8 8 14l-3-3z" />
      <path d="M7 3.5v2M12 2.5v2.5M17 3.5v2" />
    </svg>
  )
}

/** Four stacked bands, the legend in miniature. */
function BandsGlyph() {
  return (
    <svg {...svg} strokeWidth="0" fill="currentColor">
      <rect x="4" y="4" width="16" height="3.4" rx="1" fill="#22c55e" />
      <rect x="4" y="9" width="16" height="3.4" rx="1" fill="#eab308" />
      <rect x="4" y="14" width="16" height="3.4" rx="1" fill="#f97316" />
      <rect x="4" y="19" width="16" height="1.6" rx="0.8" fill="#dc2626" />
    </svg>
  )
}
