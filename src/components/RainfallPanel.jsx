import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Panel from './Panel'
import { LEAD_HOURS, fetchRainfall, parseHour } from '../lib/openMeteo'
import {
  RAIN24_MAX,
  RAIN7D_MAX,
  WEIGHT_ANTECEDENT,
  WEIGHT_INTENSITY,
  triggerBreakdown,
} from '../lib/riskEngine'

/**
 * The live half of the model, in two modes.
 *
 * Sliders are a what-if: one scalar for the whole region, and the map
 * recolours from it with no source reload. Fetching is spatial: rainfall comes
 * from a coarse 0.5 degree lattice covering the eight states, batched into a
 * couple of calls, and each risk cell reads the node it sits in.
 *
 * A live fetch also carries forecast lead times. The selector below picks
 * which one the whole dashboard is showing - the map, the priority list, the
 * alerts and the inspector all follow it. It is inert against slider
 * scenarios, which have no clock to be ahead of.
 */
export default function RainfallPanel({
  rain24h,
  rain7d,
  source,
  onChange,
  onFetchLive = null,
  nodeCount = 0,
  progress = null,
  lead = 0,
  onLead = null,
  leadWindow = null,
  leadTruncated = false,
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const { intensity, antecedent, trigger } = triggerBreakdown(rain24h, rain7d)
  const isLive = source === 'live'

  async function handleFetch() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    setError(null)
    try {
      if (onFetchLive) {
        // App owns the spatial fetch: it needs the whole field, not one point.
        await onFetchLive({ signal: controller.signal })
      } else {
        const r = await fetchRainfall({ signal: controller.signal })
        onChange(r.rain24h, r.rain7d, 'live')
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel
      title={t('rain.title')}
      className="w-full sm:w-[288px]"
      badge={
        <span
          className={`chip ${
            isLive
              ? 'border-emerald-800 bg-emerald-950/70 text-emerald-300'
              : 'border-amber-800 bg-amber-950/70 text-amber-300'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`}
          />
          {isLive ? t('rain.live') : t('rain.simulated')}
        </span>
      }
    >
      {onLead && (
        <div className="mb-3">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="label mb-0">{t('rain.lead')}</span>
            {isLive && leadWindow && (
              <span className="tabular text-[9px] text-slate-500">
                {t('rain.leadWindow', { time: formatWindow(leadWindow) })}
              </span>
            )}
          </div>
          <div
            role="radiogroup"
            aria-label={t('rain.lead')}
            className="grid grid-cols-4 gap-1 rounded border border-line bg-ink-900/70 p-1"
          >
            {LEAD_HOURS.map((h) => (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={lead === h}
                disabled={!isLive}
                onClick={() => onLead(h)}
                className={`tabular rounded px-1 py-1 text-[10px] font-semibold transition-colors ${
                  lead === h
                    ? 'bg-sky-900/80 text-sky-200'
                    : 'text-slate-500 hover:text-slate-300 disabled:hover:text-slate-500'
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {h === 0 ? t('rain.leadNow') : `+${h}h`}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[9px] leading-relaxed text-slate-600">
            {!isLive
              ? t('rain.leadNeedsLive')
              : leadTruncated
                ? t('rain.leadTruncated')
                : lead === 0
                  ? t('rain.leadObserved')
                  : t('rain.leadForecast', { hours: lead })}
          </p>
        </div>
      )}

      <Slider
        label={t('rain.rain24h')}
        value={rain24h}
        max={RAIN24_MAX}
        onChange={(v) => onChange(v, rain7d, 'sim')}
      />
      <div className="h-3" />
      <Slider
        label={t('rain.rain7d')}
        value={rain7d}
        max={RAIN7D_MAX}
        onChange={(v) => onChange(rain24h, v, 'sim')}
      />

      {/* trigger read-out */}
      <div className="mt-4 rounded border border-line bg-ink-900/70 p-2.5">
        <div className="flex items-baseline justify-between">
          <span className="label mb-0">{t('rain.trigger')}</span>
          <span className="tabular text-sm font-semibold text-sky-300">
            {trigger.toFixed(2)}
          </span>
        </div>

        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-ink-600">
          <div
            className="h-full rounded-sm bg-gradient-to-r from-sky-700 to-sky-400 transition-[width] duration-200"
            style={{ width: `${trigger * 100}%` }}
          />
        </div>

        <div className="mt-2 space-y-1">
          <Component
            label={t('rain.intensity')}
            weight={WEIGHT_INTENSITY}
            value={intensity}
          />
          <Component
            label={t('rain.antecedent')}
            weight={WEIGHT_ANTECEDENT}
            value={antecedent}
          />
        </div>
        <p className="tabular mt-2 text-[9px] text-slate-600">{t('rain.weights')}</p>
      </div>

      <button
        type="button"
        className="btn btn-primary mt-3 w-full"
        onClick={handleFetch}
        disabled={busy}
      >
        {busy ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-300/40 border-t-sky-200" />
            {progress && progress.total
              ? `${t('rain.fetching')} ${progress.done}/${progress.total}`
              : t('rain.fetching')}
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M20 16.5A4.5 4.5 0 0016.5 8h-1A7 7 0 104 15" />
              <path d="M8 19l1-2M12 20l1-2M16 19l1-2" />
            </svg>
            {t('rain.fetch')}
          </>
        )}
      </button>

      <p className="mt-2 text-[10px] leading-relaxed text-muted">
        {isLive ? t('rain.liveNote') : t('rain.simNote')}
      </p>
      {onFetchLive && nodeCount > 0 && (
        <p className="tabular mt-1 text-[9px] leading-relaxed text-slate-600">
          {t('rain.nodes', { count: nodeCount })}
        </p>
      )}

      {error && (
        <p className="mt-2 rounded border border-red-900 bg-red-950/50 px-2 py-1.5 text-[10px] text-red-300">
          {t('rain.error')} — {error}
        </p>
      )}
    </Panel>
  )
}

function Slider({ label, value, max, onChange }) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="label mb-0">{label}</span>
        <span className="tabular text-xs font-semibold text-slate-100">
          {Number(value).toFixed(1)}
          <span className="ml-1 text-[10px] font-normal text-muted">{t('units.mm')}</span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={Math.min(value, max)}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      <div className="tabular mt-1 flex justify-between text-[9px] text-slate-600">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

function Component({ label, weight, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[74px] shrink-0 truncate text-[10px] text-muted">{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-sm bg-ink-600">
        <div
          className="h-full bg-slate-500 transition-[width] duration-200"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="tabular w-[62px] shrink-0 text-right text-[9px] text-slate-500">
        {value.toFixed(2)} × {weight}
      </span>
    </div>
  )
}

/**
 * `2026-09-05T14:00` -> `Fri 14:00`. The API returns GMT, and the caption is
 * read next to a distance in kilometres by someone deciding whether to move a
 * village, so the day name matters more than the date.
 */
function formatWindow(stamp) {
  const ms = parseHour(stamp)
  if (!Number.isFinite(ms)) return String(stamp)
  const d = new Date(ms)
  const day = d.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' })
  const hh = String(d.getUTCHours()).padStart(2, '0')
  return `${day} ${hh}:00 GMT`
}
