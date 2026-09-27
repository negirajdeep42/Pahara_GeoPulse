import { useTranslation } from 'react-i18next'
import { RISK_CLASSES, SUSCEPT_CLASSES } from '../lib/colors'

/**
 * Bottom-right legend. Contents follow the active colour mode; in live mode it
 * also restates the formula the colours come from.
 */
export default function Legend({ colorMode, trigger }) {
  const { t } = useTranslation()
  const isRisk = colorMode === 'risk'

  const rows = isRisk
    ? RISK_CLASSES.map((c) => ({
        color: c.color,
        label: t(`risk.${c.key}`),
        range: `${c.from.toFixed(2)}–${c.to.toFixed(2)}`,
      }))
    : SUSCEPT_CLASSES.map((c) => ({
        color: c.color,
        label: t(`suscept.${c.key}`),
        range: null,
      }))

  return (
    <div className="panel pointer-events-auto w-full sm:w-[218px]">
      <div className="panel-header">
        <span className="panel-title">
          {isRisk ? t('legend.liveRisk') : t('legend.susceptibility')}
        </span>
      </div>

      <div className="px-3 py-2.5 space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-[2px] border border-black/40"
              style={{ background: r.color }}
            />
            <span className="flex-1 text-[11px] text-slate-300">{r.label}</span>
            {r.range && <span className="tabular text-[10px] text-slate-500">{r.range}</span>}
          </div>
        ))}
      </div>

      <div className="border-t border-line px-3 py-2">
        <p className="text-[10px] leading-relaxed text-muted">
          {isRisk ? (
            <>
              {t('legend.formula')}{' '}
              <span className="tabular text-sky-300">{(trigger ?? 0).toFixed(2)}</span>
            </>
          ) : (
            t('legend.staticNote')
          )}
        </p>
      </div>
    </div>
  )
}
