import { useTranslation } from 'react-i18next'
import { RISK_COLOR, RISK_TEXT_ON, SUSCEPT_COLOR } from '../lib/colors'
import { terrainFactors, triggerFactors } from '../lib/factors'

/**
 * The answer to "am I safe?", sitting above the cell inspector.
 *
 * It deliberately shows the two halves of the model apart from each other -
 * static susceptibility on one side, live risk on the other - because the
 * whole point of PAHARA is that neither alone is the answer. A Very High
 * susceptibility slope in dry weather is not an emergency, and the card has to
 * make that legible rather than collapsing both into one number.
 */
export default function PlaceResultCard({
  result,
  features = null,
  importance = null,
  onClose,
}) {
  const { t } = useTranslation()
  if (!result) return null

  const { verdict, point } = result
  const where = [point.district, point.state].filter(Boolean).join(', ')

  return (
    <section className="panel pointer-events-auto w-[340px] shrink-0 border-b-0">
      <div className="panel-header">
        <div className="min-w-0">
          <span className="panel-title">{t('search.resultTitle')}</span>
          <p className="mt-1 truncate text-sm font-semibold text-slate-100">{point.name}</p>
          {where && <p className="mt-0.5 truncate text-[10px] text-slate-400">{where}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="btn !px-2 !py-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="scroll-thin max-h-[46vh] overflow-y-auto px-3 py-3">
        {verdict === 'outside' && (
          <p className="rounded border border-amber-800 bg-amber-950/40 px-3 py-2.5 text-[11px] leading-relaxed text-amber-200/85">
            {t('search.outsideRegion')}
          </p>
        )}

        {verdict === 'unmonitored' && (
          <p className="rounded border border-slate-700 bg-ink-900/70 px-3 py-2.5 text-[11px] leading-relaxed text-slate-300">
            {result.km == null
              ? t('search.unmonitored')
              : t('search.unmonitoredNear', { km: result.km.toFixed(1) })}
          </p>
        )}

        {verdict === 'ok' && <Assessment result={result} features={features} importance={importance} />}
      </div>
    </section>
  )
}

function Assessment({ result, features, importance }) {
  const { t } = useTranslation()
  const { cell, km, distant, higher, point } = result
  const cls = cell.riskClass
  const terrain = terrainFactors(cell, features, importance)
  const rain = triggerFactors(cell.rain24h, cell.rain7d)
  const pop = point.population ?? cell.population

  return (
    <>
      {/* the two layers, side by side and labelled */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded border px-2.5 py-2"
          style={{ background: `${RISK_COLOR[cls]}1f`, borderColor: `${RISK_COLOR[cls]}80` }}
        >
          <p className="label mb-1.5">{t('search.liveRisk')}</p>
          <span
            className="inline-block rounded px-2 py-1 text-[12px] font-bold uppercase tracking-wider"
            style={{ background: RISK_COLOR[cls], color: RISK_TEXT_ON[cls] }}
          >
            {t(`risk.${cls}`)}
          </span>
          <p className="tabular mt-1.5 text-lg font-bold leading-none text-slate-50">
            {cell.risk.toFixed(2)}
          </p>
        </div>

        <div className="rounded border border-line bg-ink-900/70 px-2.5 py-2">
          <p className="label mb-1.5">{t('search.staticSusceptibility')}</p>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-200">
            {cell.suscept_class && (
              <span
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ background: SUSCEPT_COLOR[cell.suscept_class] || '#334155' }}
              />
            )}
            {cell.suscept_class ? t(`suscept.${cell.suscept_class}`) : '—'}
          </span>
          <p className="tabular mt-1.5 text-lg font-bold leading-none text-slate-300">
            {Number(cell.susceptibility).toFixed(2)}
          </p>
        </div>
      </div>

      <p className="tabular mt-2 text-center text-[10px] text-slate-500">
        {Number(cell.susceptibility).toFixed(2)} × {cell.trigger.toFixed(2)} ={' '}
        <span className="font-semibold text-slate-300">{cell.risk.toFixed(2)}</span>
        <span className="ml-1.5 uppercase tracking-[0.11em]">{t('inspector.equation')}</span>
      </p>

      {/* the cell is not where the place is */}
      {distant && (
        <p className="mt-2 rounded border border-slate-700 bg-ink-900/70 px-2.5 py-1.5 text-[10px] leading-relaxed text-slate-400">
          {t('search.nearestCell', { km: km.toFixed(1) })}
        </p>
      )}

      {/* the road out may be worse than the house */}
      {higher && (
        <p className="mt-2 rounded border border-orange-900 bg-orange-950/40 px-2.5 py-1.5 text-[11px] leading-relaxed text-orange-200/90">
          {t('search.higherRisk', {
            km: higher.km.toFixed(1),
            dir: higher.compass,
            cls: t(`risk.${higher.cell.riskClass}`),
          })}
        </p>
      )}

      {/* rainfall driving the live half */}
      <h4 className="mt-3 text-[9px] font-semibold uppercase tracking-[0.13em] text-amber-400/90">
        {t('inspector.triggerGroup')}
      </h4>
      <div className="mt-1.5 space-y-1">
        {rain.map((f) => (
          <MiniBar key={f.key} factor={f} label={t(`factor.${f.key}`)} accent="#eab308" />
        ))}
      </div>

      {/* terrain driving the static half */}
      {terrain.length > 0 && (
        <>
          <h4 className="mt-3 text-[9px] font-semibold uppercase tracking-[0.13em] text-sky-400/90">
            {t('inspector.terrain')}
          </h4>
          <div className="mt-1.5 space-y-1">
            {terrain.slice(0, 5).map((f) => (
              <MiniBar
                key={f.property || f.key}
                factor={f}
                label={t(`factor.${f.key}`)}
                accent="#38bdf8"
              />
            ))}
          </div>
        </>
      )}

      {/* who is there */}
      <dl className="mt-3 space-y-1.5 border-t border-line pt-2.5">
        <Row label={t('inspector.population')}>
          {pop === null || pop === undefined ? (
            <span className="text-slate-500">{t('search.populationUnknown')}</span>
          ) : (
            <span className="flex items-center justify-end gap-1.5">
              <span className="tabular">{Number(pop).toLocaleString()}</span>
              {point.population_estimated === true && (
                <span className="chip border-amber-800 bg-amber-950/60 text-amber-300">
                  {t('inspector.estimated')}
                </span>
              )}
            </span>
          )}
        </Row>
        <Row label={t('inspector.coords')}>
          <span className="tabular">
            {point.lat.toFixed(3)}°N, {point.lon.toFixed(3)}°E
          </span>
        </Row>
      </dl>
    </>
  )
}

function MiniBar({ factor, label, accent }) {
  const { t } = useTranslation()
  const missing = factor.norm === null
  return (
    <div className="flex items-center gap-2">
      <span className="w-[86px] shrink-0 truncate text-[10px] text-slate-400">{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-sm bg-ink-600">
        {!missing && (
          <div className="h-full rounded-sm" style={{ width: `${factor.norm * 100}%`, background: accent }} />
        )}
      </div>
      <span className="tabular w-[58px] shrink-0 text-right text-[10px] text-slate-300">
        {missing ? (
          <span className="text-slate-600">{t('inspector.noData')}</span>
        ) : (
          <>
            {Number(factor.value).toFixed(factor.digits ?? 1)}
            {factor.unit && (
              <span className="ml-0.5 text-[9px] text-muted">
                {factor.unit === 'deg' ? t('units.deg') : t(`units.${factor.unit}`)}
              </span>
            )}
          </>
        )}
      </span>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[10px] text-muted">{label}</dt>
      <dd className="text-right text-[11px] text-slate-200">{children}</dd>
    </div>
  )
}
