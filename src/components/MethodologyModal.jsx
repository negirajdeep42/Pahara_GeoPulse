import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ANTECEDENT_REF,
  INTENSITY_REF,
  WEIGHT_ANTECEDENT,
  WEIGHT_INTENSITY,
} from '../lib/riskEngine'
import { RISK_CLASSES } from '../lib/colors'

/**
 * Provenance, in the operator's hands. Everything shown here comes from the
 * grid file's own metadata block, so the dashboard can never claim a pedigree
 * the data does not have.
 */
export default function MethodologyModal({ open, metadata, cellCount, onClose }) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const sources = Array.isArray(metadata?.data_sources) ? metadata.data_sources : []

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('method.title')}
        className="panel scroll-thin max-h-full w-[520px] max-w-full overflow-y-auto"
      >
        <div className="panel-header sticky top-0 z-10 bg-ink-800">
          <span className="panel-title">{t('method.title')}</span>
          <button
            type="button"
            className="btn !px-2 !py-1"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-4">
          {/* the model */}
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
            {t('method.concept')}
          </h3>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            {t('method.conceptBody')}
          </p>

          <div className="tabular mt-3 rounded border border-line bg-ink-900/70 px-3 py-2.5 text-[11px]">
            <p className="text-sky-300">risk = susceptibility × trigger</p>
            <p className="mt-1.5 text-slate-400">
              trigger = {WEIGHT_INTENSITY} × min(rain24h / {INTENSITY_REF}, 1) +{' '}
              {WEIGHT_ANTECEDENT} × min(rain7d / {ANTECEDENT_REF}, 1)
            </p>
            <p className="mt-1.5 text-slate-500">
              {RISK_CLASSES.map((c) => `${t(`risk.${c.key}`)} < ${c.to}`).join(' · ')}
            </p>
          </div>

          {/* provenance */}
          <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
            {t('method.title')}
          </h3>

          {metadata ? (
            <>
              <dl className="mt-2 divide-y divide-line rounded border border-line">
                <Row label={t('method.generated')} value={formatDate(metadata.generated_at)} />
                <Row label={t('method.methodUsed')} value={metadata.method ?? '—'} />
                <Row
                  label={t('method.cells')}
                  value={Number(metadata.cell_count ?? cellCount ?? 0).toLocaleString()}
                />
                <Row
                  label={t('method.records')}
                  value={
                    metadata.landslide_records === null || metadata.landslide_records === undefined
                      ? '—'
                      : Number(metadata.landslide_records).toLocaleString()
                  }
                />
              </dl>

              {/* How well it actually generalises. The two AUCs are shown
                  together on purpose - the gap between them is the point. */}
              <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
                {t('method.validation')}
              </h3>
              <dl className="mt-2 divide-y divide-line rounded border border-line">
                <Row
                  label={t('method.aucSpatial')}
                  value={auc(metadata.auc_spatial_cv ?? metadata.auc)}
                  strong
                />
                <Row label={t('method.aucRandom')} value={auc(metadata.auc_random_cv)} />
                {metadata.auc_logreg_baseline !== undefined &&
                  metadata.auc_logreg_baseline !== null && (
                    <Row
                      label={t('method.aucBaseline')}
                      value={auc(metadata.auc_logreg_baseline)}
                    />
                  )}
              </dl>
              {metadata.auc_random_cv !== undefined && metadata.auc_random_cv !== null && (
                <p className="mt-2 rounded border border-sky-900 bg-sky-950/40 px-3 py-2 text-[11px] leading-relaxed text-sky-200/80">
                  {t('method.aucNote')}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="mt-2 rounded border border-amber-900 bg-amber-950/40 px-3 py-2 text-[11px] leading-relaxed text-amber-200/80">
                {t('method.noMetadata')}
              </p>
              <dl className="mt-2 divide-y divide-line rounded border border-line">
                <Row label={t('method.cells')} value={Number(cellCount ?? 0).toLocaleString()} />
              </dl>
            </>
          )}

          {/* sources */}
          <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
            {t('method.sources')}
          </h3>
          <ul className="mt-2 space-y-1">
            {(sources.length
              ? sources
              : [
                  'Open-Meteo Forecast API (live rainfall)',
                  'OpenFreeMap / OpenMapTiles / OpenStreetMap (base map)',
                ]
            ).map((s) => (
              <li key={s} className="flex gap-2 text-[11px] leading-relaxed text-slate-400">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                {s}
              </li>
            ))}
          </ul>

          {/* the disclosure that must never be buried */}
          <div className="mt-5 rounded border border-amber-800 bg-amber-950/40 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-amber-300">
              {t('method.simulatedTitle')}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-200/75">
              {t('method.simulatedBody')}
            </p>
          </div>

          <button type="button" className="btn mt-4 w-full" onClick={onClose}>
            {t('method.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3 py-2">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd
        className={`tabular text-right text-[11px] ${
          strong ? 'font-semibold text-sky-300' : 'text-slate-200'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function auc(v) {
  return v === null || v === undefined || !Number.isFinite(Number(v))
    ? '—'
    : Number(v).toFixed(4)
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(d) + ' IST'
  } catch {
    return d.toISOString()
  }
}
