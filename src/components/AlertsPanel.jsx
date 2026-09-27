import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Panel from './Panel'
import { RISK_COLOR, RISK_TEXT_ON } from '../lib/colors'
import { countScored, rankScored } from '../lib/spatialRisk'
import {
  alertLevel,
  buildAlertMessage,
  sendTelegramAlert,
  telegramConfigured,
} from '../lib/telegram'

/**
 * Live count of zones needing action, and the one button that leaves the
 * browser. Everything it sends is derived from what is on screen.
 */
export default function AlertsPanel({ cells, trigger, rain, lead = 0, onToast, log, onLogged }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const abortRef = useRef(null)

  // `cells` is already scored per cell against the rainfall field; the counts
  // and the top three therefore respect where it is actually raining. The
  // dispatch path below is unchanged.
  const counts = useMemo(() => countScored(cells), [cells])
  const affected = counts.Warning + counts.Evacuate
  const level = alertLevel(counts)
  const top3 = useMemo(() => rankScored(cells, 3), [cells])

  async function dispatch() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)

    const timestamp = new Date()
    const text = buildAlertMessage({
      level,
      affected,
      counts,
      topVillages: top3,
      rain24h: rain.rain24h,
      rain7d: rain.rain7d,
      trigger,
      source: rain.source,
      lead,
      timestamp,
    })

    try {
      await sendTelegramAlert(text, { signal: controller.signal })
      onToast({ tone: 'success', title: t('alerts.sent'), detail: `${level} · ${affected}` })
      onLogged({
        id: `${timestamp.getTime()}`,
        at: timestamp,
        level,
        affected,
        status: 'sent',
        villages: top3.map((v) => v.nearest_village),
      })
    } catch (err) {
      if (err.name === 'AbortError') return
      onToast({ tone: 'error', title: t('alerts.failed'), detail: err.message })
      onLogged({
        id: `${timestamp.getTime()}`,
        at: timestamp,
        level,
        affected,
        status: 'failed',
        error: err.message,
        villages: top3.map((v) => v.nearest_village),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel
      title={t('alerts.title')}
      className="w-full sm:w-[300px]"
      badge={
        <span
          className="rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ background: RISK_COLOR[level], color: RISK_TEXT_ON[level] }}
        >
          {t(`risk.${level}`)}
        </span>
      }
    >
      {/* live count */}
      <div className="flex items-end justify-between gap-3 rounded border border-line bg-ink-900/70 px-3 py-2.5">
        <div>
          <p className="label mb-1">{t('alerts.affected')}</p>
          <p className="tabular text-3xl font-bold leading-none text-slate-50">{affected}</p>
        </div>
        <div className="tabular space-y-0.5 text-right text-[10px]">
          <CountRow label={t('risk.Evacuate')} value={counts.Evacuate} color={RISK_COLOR.Evacuate} />
          <CountRow label={t('risk.Warning')} value={counts.Warning} color={RISK_COLOR.Warning} />
          <CountRow label={t('risk.Watch')} value={counts.Watch} color={RISK_COLOR.Watch} />
        </div>
      </div>

      {/* dispatch */}
      {telegramConfigured ? (
        <>
          <button
            type="button"
            className={`mt-3 w-full ${affected > 0 ? 'btn btn-danger' : 'btn'}`}
            disabled={busy || affected === 0}
            onClick={dispatch}
          >
            {busy ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('alerts.sending')}
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                {t('alerts.dispatch')}
              </>
            )}
          </button>
          {affected === 0 && (
            <p className="mt-2 text-[10px] leading-relaxed text-muted">{t('alerts.none')}</p>
          )}
        </>
      ) : (
        <div className="mt-3 rounded border border-amber-900 bg-amber-950/40 px-2.5 py-2">
          <p className="text-[11px] font-semibold text-amber-300">{t('alerts.configure')}</p>
          <p className="tabular mt-1 text-[10px] leading-relaxed text-amber-200/70">
            {t('alerts.configureHint')}
          </p>
        </div>
      )}

      {/* session log */}
      <div className="mt-3 border-t border-line pt-2.5">
        <p className="label">{t('alerts.log')}</p>
        {log.length === 0 ? (
          <p className="text-[10px] text-slate-600">{t('alerts.logEmpty')}</p>
        ) : (
          <ul className="scroll-thin max-h-[124px] space-y-1 overflow-y-auto pr-1">
            {log.map((e) => (
              <li
                key={e.id}
                className="tabular flex items-center gap-2 rounded border border-line bg-ink-900/60 px-2 py-1 text-[10px]"
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    e.status === 'sent' ? 'bg-emerald-400' : 'bg-red-500'
                  }`}
                />
                <span className="text-slate-400">
                  {e.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-semibold" style={{ color: RISK_COLOR[e.level] }}>
                  {t(`risk.${e.level}`)}
                </span>
                <span className="text-slate-500">{e.affected}</span>
                {e.status === 'failed' && (
                  <span className="truncate text-red-400" title={e.error}>
                    {t('alerts.failed')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  )
}

function CountRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <span className="text-slate-500">{label}</span>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      <span className="w-6 text-right font-semibold text-slate-200">{value}</span>
    </div>
  )
}
