import { useTranslation } from 'react-i18next'
import { RISK_COLOR, RISK_TEXT_ON, SUSCEPT_COLOR } from '../lib/colors'
import { aspectOf, exposureFactors, terrainFactors, triggerFactors } from '../lib/factors'
import { computeRisk, riskClass } from '../lib/riskEngine'

/**
 * Right-hand drawer for one cell. Its job is to make the score auditable:
 * every number that fed the rating is on screen, split into the static half
 * and the live half.
 *
 * Nothing about the field list is hardcoded. The predictor bars come from the
 * grid file's own metadata.features, and every descriptive row renders only if
 * that property exists on the cell - the Northeast grid carries state and
 * district but no stream distance, the old district grid the other way round,
 * and both have to open without throwing.
 */
export default function CellInspector({
  cell,
  trigger,
  rain24h,
  rain7d,
  features = null,
  importance = null,
  onClose,
}) {
  const { t } = useTranslation()
  if (!cell) return null

  // A cell scored against the rainfall field carries its own trigger and
  // rainfall; one clicked straight off the map before the field arrived falls
  // back to the region-wide figures.
  const cellTrigger = Number.isFinite(Number(cell.trigger)) ? Number(cell.trigger) : trigger
  const cellRain24h = Number.isFinite(Number(cell.rain24h)) ? Number(cell.rain24h) : rain24h
  const cellRain7d = Number.isFinite(Number(cell.rain7d)) ? Number(cell.rain7d) : rain7d

  const susceptibility = Number(cell.susceptibility) || 0
  const risk = computeRisk(susceptibility, cellTrigger)
  const cls = riskClass(risk)

  const terrain = terrainFactors(cell, features, importance)
  const exposure = exposureFactors(cell)
  const aspect = aspectOf(cell)
  const place = [cell.district, cell.state].filter(Boolean).join(', ')

  return (
    <aside className="pointer-events-auto flex h-full w-[340px] animate-slide-in flex-col border-l border-line bg-ink-800/95 shadow-2xl shadow-black/70 backdrop-blur">
      {/* header */}
      <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="panel-title">{t('inspector.title')}</p>
          <p className="tabular mt-1 truncate text-sm font-semibold text-slate-100">
            {cell.cell_id}
          </p>
          {place && <p className="mt-0.5 truncate text-[10px] text-slate-400">{place}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="btn !px-2 !py-1.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-4 py-4">
        {/* verdict */}
        <div
          className="rounded-md border px-3 py-3"
          style={{
            background: `${RISK_COLOR[cls]}1f`,
            borderColor: `${RISK_COLOR[cls]}80`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className="rounded px-2.5 py-1 text-[13px] font-bold uppercase tracking-wider"
              style={{ background: RISK_COLOR[cls], color: RISK_TEXT_ON[cls] }}
            >
              {t(`risk.${cls}`)}
            </span>
            <span className="tabular text-2xl font-bold text-slate-50">{risk.toFixed(2)}</span>
          </div>

          {/* the model, spelled out on this cell */}
          <div className="tabular mt-3 flex items-center justify-between text-[11px] text-slate-300">
            <span>
              {susceptibility.toFixed(2)}
              <span className="mx-1.5 text-slate-500">×</span>
              {(cellTrigger ?? 0).toFixed(2)}
              <span className="mx-1.5 text-slate-500">=</span>
              <span className="font-semibold text-slate-100">{risk.toFixed(2)}</span>
            </span>
          </div>
          <p className="mt-1 text-[9px] uppercase tracking-[0.11em] text-slate-500">
            {t('inspector.equation')}
          </p>
        </div>

        {/* identity */}
        <dl className="mt-4 space-y-2">
          <Row label={t('inspector.coords')}>
            <span className="tabular">
              {fmt(cell.lat, 3)}°N, {fmt(cell.lon, 3)}°E
            </span>
          </Row>
          {cell.state && <Row label={t('inspector.state')}>{cell.state}</Row>}
          {cell.district && <Row label={t('inspector.district')}>{cell.district}</Row>}
          <Row label={t('inspector.susceptibility')}>
            <span className="flex items-center gap-1.5">
              {cell.suscept_class && (
                <span
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{ background: SUSCEPT_COLOR[cell.suscept_class] || '#334155' }}
                />
              )}
              <span className="tabular">{susceptibility.toFixed(3)}</span>
              {cell.suscept_class && (
                <span className="text-slate-400">({t(`suscept.${cell.suscept_class}`)})</span>
              )}
            </span>
          </Row>
        </dl>

        {/* why */}
        <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
          {t('inspector.why')}
        </h3>

        <Group title={t('inspector.terrain')} accent="#38bdf8">
          {terrain.length === 0 ? (
            <p className="text-[10px] leading-relaxed text-slate-500">
              {t('inspector.noFactors')}
            </p>
          ) : (
            terrain.map((f) => (
              <FactorBar
                key={f.property || f.key}
                factor={f}
                label={t(`factor.${f.key}`)}
                accent="#38bdf8"
              />
            ))
          )}

          {aspect && (
            <dl className="mt-3">
              <Row label={t('factor.aspect')}>
                <span className="tabular">
                  {aspect.deg.toFixed(0)}
                  <span className="ml-0.5 text-[9px] text-muted">{t('units.deg')}</span>
                  <span className="ml-1.5 text-slate-400">{aspect.compass}</span>
                </span>
              </Row>
            </dl>
          )}
        </Group>

        <Group title={t('inspector.triggerGroup')} accent="#eab308">
          {triggerFactors(cellRain24h, cellRain7d).map((f) => (
            <FactorBar key={f.key} factor={f} label={t(`factor.${f.key}`)} accent="#eab308" />
          ))}
          {cell.rain_source === 'grid' && (
            <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
              {t('inspector.rainFromNode')}
            </p>
          )}
        </Group>

        <Group title={t('inspector.exposure')} accent="#64748b">
          {exposure.map((f) => (
            <FactorBar key={f.property || f.key} factor={f} label={t(`factor.${f.key}`)} accent="#64748b" />
          ))}

          <dl className={exposure.length ? 'mt-3 space-y-2' : 'space-y-2'}>
            {has(cell.nearest_village) && (
              <Row label={t('inspector.village')}>{cell.nearest_village}</Row>
            )}
            {has(cell.population) && (
              <Row label={t('inspector.population')}>
                <span className="flex items-center gap-1.5">
                  <span className="tabular">{Number(cell.population).toLocaleString()}</span>
                  {cell.population_estimated === true && (
                    <span className="chip border-amber-800 bg-amber-950/60 text-amber-300">
                      {t('inspector.estimated')}
                    </span>
                  )}
                </span>
              </Row>
            )}
            {!has(cell.nearest_village) && !has(cell.population) && exposure.length === 0 && (
              <p className="text-[10px] leading-relaxed text-slate-500">
                {t('inspector.noExposure')}
              </p>
            )}
          </dl>
        </Group>
      </div>
    </aside>
  )
}

function has(v) {
  return v !== null && v !== undefined && v !== ''
}

function Group({ title, accent, children }) {
  return (
    <section className="mt-3 rounded border border-line bg-ink-900/50 p-3">
      <h4
        className="mb-2.5 text-[9px] font-semibold uppercase tracking-[0.13em]"
        style={{ color: accent }}
      >
        {title}
      </h4>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function FactorBar({ factor, label, accent }) {
  const { t } = useTranslation()
  const missing = factor.norm === null

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-slate-300">{label}</span>
        <span className="tabular text-[11px] text-slate-100">
          {missing ? (
            <span className="text-slate-500">{t('inspector.noData')}</span>
          ) : (
            <>
              {fmt(factor.value, factor.digits ?? 1)}
              {factor.unit && (
                <span className="ml-1 text-[9px] text-muted">
                  {factor.unit === 'deg' ? t('units.deg') : t(`units.${factor.unit}`)}
                </span>
              )}
            </>
          )}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-ink-600">
        {!missing && (
          <div
            className="h-full rounded-sm transition-[width] duration-200"
            style={{ width: `${factor.norm * 100}%`, background: accent }}
          />
        )}
      </div>
      {missing && (
        <p className="mt-0.5 text-[9px] text-slate-600">{t('inspector.noDataNote')}</p>
      )}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="text-right text-[11px] text-slate-200">{children}</dd>
    </div>
  )
}

function fmt(v, digits = 1) {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '—'
  return Number(v).toFixed(digits)
}
