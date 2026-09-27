import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Panel from './Panel'
import { RISK_COLOR, RISK_TEXT_ON } from '../lib/colors'
import { rankScored } from '../lib/spatialRisk'

/**
 * The ten cells a control room should look at first. `cells` arrives already
 * scored against the rainfall field, so each row reflects the rain over that
 * cell rather than one figure for the whole Northeast.
 */
export default function PriorityList({ cells, selectedCellId, onSelect }) {
  const { t } = useTranslation()

  const top = useMemo(() => rankScored(cells, 10), [cells])
  const anyAboveSafe = top.some((c) => c.riskClass !== 'Safe')

  return (
    <Panel
      title={t('priority.title')}
      className="w-full sm:w-[288px]"
      badge={
        <span className="tabular text-[10px] text-muted">{t('priority.subtitle')}</span>
      }
      bodyClassName="py-1"
    >
      {!anyAboveSafe && (
        <p className="px-3 py-2 text-[10px] leading-relaxed text-muted">
          {t('priority.empty')}
        </p>
      )}

      <ol className="scroll-thin max-h-[264px] overflow-y-auto">
        {top.map((c, i) => {
          const selected = c.cell_id === selectedCellId
          return (
            <li key={c.cell_id}>
              <button
                type="button"
                onClick={() => onSelect(c)}
                className={`flex w-full items-center gap-2 border-l-2 px-2.5 py-1.5 text-left transition hover:bg-ink-600 ${
                  selected ? 'border-l-sky-400 bg-ink-600' : 'border-l-transparent'
                }`}
              >
                <span className="tabular w-4 shrink-0 text-[10px] text-slate-600">{i + 1}</span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium text-slate-200">
                    {c.nearest_village}
                  </span>
                  <span className="tabular block truncate text-[9px] text-slate-500">
                    {c.cell_id}
                    {c.population !== null && c.population !== undefined && (
                      <>
                        {' · '}
                        {Number(c.population).toLocaleString()} {t('priority.population')}
                        {c.population_estimated ? '*' : ''}
                      </>
                    )}
                  </span>
                </span>

                <span
                  className="shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    background: RISK_COLOR[c.riskClass],
                    color: RISK_TEXT_ON[c.riskClass],
                  }}
                >
                  {t(`risk.${c.riskClass}`)}
                </span>

                <span className="tabular w-8 shrink-0 text-right text-[11px] font-semibold text-slate-200">
                  {c.risk.toFixed(2)}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
