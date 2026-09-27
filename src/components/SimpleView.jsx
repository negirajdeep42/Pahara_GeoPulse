import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PlaceSearch from './PlaceSearch'
import { RISK_COLOR, RISK_TEXT_ON } from '../lib/colors'
import { adviceFor } from '../lib/advice'

/**
 * PAHARA for the person whose house is on the slope.
 *
 * One question, one place, one answer, in words. Every number the operator
 * dashboard shows is still reachable - "Show the numbers" opens the
 * multiplication, and the header toggle opens the whole dashboard - but none
 * of it is in the way of the answer.
 *
 * Layout is a maps-app sheet: on a phone the map shows through the top of the
 * screen and this column is a sheet over the bottom of it; on a desktop it is
 * a column beside a full map. The same MapView instance stays mounted in both
 * modes and in both view modes, so switching never reloads 5,922 polygons.
 */
export default function SimpleView({
  places,
  placesReady,
  activeField,
  rain,
  result,
  onSelectPlace,
  onReport,
  onDetails,
}) {
  const { t } = useTranslation()

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 top-[30vh] z-20 flex flex-col
                 rounded-t-2xl border border-line bg-ink-900/97 shadow-2xl shadow-black/70 backdrop-blur
                 sm:inset-y-3 sm:left-3 sm:right-auto sm:w-[420px] sm:rounded-xl"
    >
      {/* a grab-handle affordance on phones, where this reads as a sheet */}
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ink-500 sm:hidden" />

      <div className="shrink-0 px-4 pb-3 pt-3">
        <h2 className="text-[17px] font-bold leading-snug text-slate-50">{t('plain.title')}</h2>
        <div className="mt-2.5">
          {placesReady ? (
            <PlaceSearch
              places={places}
              rainField={activeField}
              uniformRain={rain}
              onSelect={onSelectPlace}
              compact
            />
          ) : (
            <div className="h-9 animate-pulse rounded border border-line bg-ink-700" />
          )}
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {!result && <EmptyState />}
        {result?.verdict === 'ok' && <Answer result={result} />}
        {result?.verdict === 'unmonitored' && <NoData result={result} />}
        {result?.verdict === 'outside' && <Outside />}
      </div>

      <div className="shrink-0 border-t border-line px-4 py-3">
        <button type="button" className="btn btn-primary w-full !py-2.5 !text-[13px]" onClick={onReport}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
          </svg>
          {t('plain.reportCta')}
        </button>
        <button
          type="button"
          onClick={onDetails}
          className="mt-2 w-full text-center text-[11px] font-semibold text-slate-500 underline decoration-slate-700 underline-offset-4 transition hover:text-slate-300"
        >
          {t('plain.detailsCta')}
        </button>
      </div>
    </div>
  )
}

// ------------------------------------------------------------ before a search

function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg border border-line bg-ink-800/70 px-4 py-4">
      <p className="text-[14px] font-semibold text-slate-200">{t('plain.emptyTitle')}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{t('plain.emptyBody')}</p>
      <p className="mt-3 text-[12px] leading-relaxed text-slate-500">{t('plain.mapHint')}</p>
    </div>
  )
}

// ------------------------------------------------------------- the answer

function Answer({ result }) {
  const { t } = useTranslation()
  const { cell, km, distant, higher, point } = result
  const advice = adviceFor(cell)
  const where = [point.district, point.state].filter(Boolean).join(', ')

  return (
    <div className="space-y-3">
      {/* the verdict: colour, glyph and words, so no one of the three carries
          the meaning alone */}
      <div
        className="rounded-lg border-2 px-4 py-4"
        style={{
          background: `${RISK_COLOR[advice.level]}1c`,
          borderColor: RISK_COLOR[advice.level],
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: RISK_COLOR[advice.level], color: RISK_TEXT_ON[advice.level] }}
          >
            <LevelGlyph shape={advice.shape} />
          </span>
          <div className="min-w-0">
            <p className="text-[20px] font-bold leading-tight text-slate-50">
              {t(advice.headlineKey)}
            </p>
            <p className="mt-1 truncate text-[13px] font-medium text-slate-300">{point.name}</p>
            {where && <p className="truncate text-[11px] text-slate-500">{where}</p>}
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-slate-200">{t(advice.summaryKey)}</p>
      </div>

      {/* why - the whole model in one sentence, no technical words */}
      <Block title={t('plain.whyTitle')}>
        <p className="text-[13px] leading-relaxed text-slate-300">{t(advice.reasonKey)}</p>
      </Block>

      {/* what to do */}
      <Block title={t('plain.doTitle')}>
        <ul className="space-y-2">
          {advice.actionKeys.map((key) => (
            <li key={key} className="flex gap-2.5 text-[13px] leading-relaxed text-slate-200">
              <span
                aria-hidden="true"
                className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: RISK_COLOR[advice.level] }}
              />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-slate-500">
          {t('plain.adviceNote')}
        </p>
      </Block>

      {/* a resident's house can be fine while their only road out is not */}
      {higher && (
        <p className="rounded-lg border border-amber-900/80 bg-amber-950/40 px-3.5 py-3 text-[12px] leading-relaxed text-amber-200/90">
          {t('plain.higherNear', { km: higher.km.toFixed(1), dir: higher.compass })}
        </p>
      )}

      {distant && (
        <p className="rounded-lg border border-line bg-ink-800/70 px-3.5 py-3 text-[12px] leading-relaxed text-slate-400">
          {t('plain.distantCell', { km: km.toFixed(1) })}
        </p>
      )}

      <Numbers cell={cell} />
    </div>
  )
}

/**
 * The bridge between the two audiences: closed by default so the answer is not
 * buried in arithmetic, one tap away so nobody has to take it on faith.
 */
function Numbers({ cell }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-line bg-ink-800/70">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[12px] font-semibold text-slate-400 transition hover:text-slate-200"
      >
        {open ? t('plain.hideNumbers') : t('plain.showNumbers')}
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-line px-3.5 py-3">
          <Figure
            label={t('plain.numbersSlope')}
            value={Number(cell.susceptibility).toFixed(2)}
            note={cell.suscept_class ? t(`suscept.${cell.suscept_class}`) : null}
          />
          <Figure label={t('plain.numbersRain')} value={Number(cell.trigger).toFixed(2)} />
          <div className="my-2 border-t border-line" />
          <Figure label={t('plain.numbersRisk')} value={Number(cell.risk).toFixed(2)} strong />

          <p className="tabular mt-2.5 text-[11px] text-slate-500">
            {Number(cell.susceptibility).toFixed(2)} × {Number(cell.trigger).toFixed(2)} ={' '}
            <span className="font-semibold text-slate-300">{Number(cell.risk).toFixed(2)}</span>
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{t('plain.numbersNote')}</p>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-2.5">
            <Figure label={t('plain.rainToday')} value={`${Number(cell.rain24h).toFixed(0)} mm`} small />
            <Figure label={t('plain.rainWeek')} value={`${Number(cell.rain7d).toFixed(0)} mm`} small />
          </div>
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------- the two honest non-answers

/**
 * 1,350 of 5,196 settlements have no modelled slope within range. Reporting
 * "Very Low risk" for those would be a lie by omission: the model has nothing
 * to say, which is a different statement from "you are safe". In the operator
 * dashboard that nuance survives in a grey panel. Here it has to survive in
 * one glance, so it gets the same visual weight a verdict would.
 */
function NoData({ result }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg border-2 border-slate-600 bg-ink-800/80 px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-600 text-slate-100">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-[17px] font-bold leading-tight text-slate-100">
            {t('plain.nodataTitle')}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-slate-400">{result.point.name}</p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-slate-300">
        {t('plain.nodataBody', { name: result.point.name })}
      </p>
    </div>
  )
}

function Outside() {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg border border-amber-900 bg-amber-950/40 px-4 py-4">
      <p className="text-[15px] font-bold text-amber-100">{t('plain.outsideTitle')}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-amber-200/85">{t('plain.outsideBody')}</p>
    </div>
  )
}

// ------------------------------------------------------------------- pieces

function Block({ title, children }) {
  return (
    <div className="rounded-lg border border-line bg-ink-800/70 px-3.5 py-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </p>
      {children}
    </div>
  )
}

function Figure({ label, value, note = null, strong = false, small = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className={`${small ? 'text-[11px]' : 'text-[12px]'} text-slate-400`}>
        {label}
        {note && <span className="ml-1.5 text-slate-500">({note})</span>}
      </span>
      <span
        className={`tabular shrink-0 font-semibold ${
          strong ? 'text-[15px] text-slate-50' : 'text-[13px] text-slate-200'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

/**
 * A distinct shape per level. Red-amber-green alone fails for roughly one man
 * in twelve, and this is the view someone reads while deciding whether to
 * leave their house - so the level is carried by form, colour and words at
 * once, and any one of the three is enough.
 */
function LevelGlyph({ shape }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.4,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  }

  if (shape === 'check') {
    return (
      <svg {...common}>
        <path d="M20 6L9 17l-5-5" />
      </svg>
    )
  }
  if (shape === 'eye') {
    return (
      <svg {...common}>
        <path d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  if (shape === 'triangle') {
    return (
      <svg {...common}>
        <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    )
  }
  // siren
  return (
    <svg {...common}>
      <path d="M5 19h14M6 19v-6a6 6 0 1112 0v6" />
      <path d="M12 3V1.5M3.5 8L2.2 7.2M20.5 8l1.3-.8" />
    </svg>
  )
}
