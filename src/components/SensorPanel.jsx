import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Panel from './Panel'

const TICK_MS = 1400
const MOISTURE_ALARM = 80

/**
 * A stand-in for field hardware that does not exist yet. Everything here is
 * generated in the browser; the panel says so in its own header, and the
 * methodology modal repeats it. It is wired to the rainfall inputs so the
 * demo stays coherent: soak the district and the ground gets wetter.
 */
export default function SensorPanel({ trigger }) {
  const { t } = useTranslation()
  const [reading, setReading] = useState({ moisture: 34, tilt: 0.4, battery: 12.5 })
  const triggerRef = useRef(trigger)
  triggerRef.current = trigger

  useEffect(() => {
    const id = setInterval(() => {
      setReading((prev) => {
        const tr = triggerRef.current ?? 0

        // Each value eases towards a rainfall-dependent target, plus jitter -
        // enough movement to look like an instrument, never a random walk that
        // wanders off scale.
        const moistureTarget = 26 + 68 * tr
        const tiltTarget = 0.3 + 4.2 * tr
        const batteryTarget = 12.6 - 1.5 * tr // less sun while it rains

        return {
          moisture: bounded(ease(prev.moisture, moistureTarget, 0.22, 1.6), 5, 99),
          tilt: bounded(ease(prev.tilt, tiltTarget, 0.18, 0.12), 0, 9),
          battery: bounded(ease(prev.battery, batteryTarget, 0.1, 0.04), 10.4, 13.2),
        }
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  const breached = reading.moisture >= MOISTURE_ALARM

  return (
    <Panel
      title={t('sensor.title')}
      tone="amber"
      alarm={breached}
      className="w-full sm:w-[288px]"
      badge={
        <span className="chip border-amber-800 bg-amber-950/70 text-amber-300">SIM</span>
      }
    >
      <p className="tabular mb-3 text-[9px] uppercase tracking-[0.11em] text-slate-500">
        {t('sensor.node')}
      </p>

      <div className="flex items-start justify-between gap-1">
        <Gauge
          label={t('sensor.moisture')}
          value={reading.moisture}
          min={0}
          max={100}
          unit={t('units.percent')}
          digits={0}
          color={breached ? '#dc2626' : '#38bdf8'}
        />
        <Gauge
          label={t('sensor.tilt')}
          value={reading.tilt}
          min={0}
          max={9}
          unit={t('units.deg')}
          digits={2}
          color="#eab308"
        />
        <Gauge
          label={t('sensor.battery')}
          value={reading.battery}
          min={10}
          max={13.5}
          unit={t('units.volt')}
          digits={2}
          color="#22c55e"
        />
      </div>

      {breached ? (
        <p className="mt-3 flex items-center gap-1.5 rounded border border-red-800 bg-red-950/60 px-2 py-1.5 text-[10px] font-semibold text-red-300">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 8v5M12 17h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          {t('sensor.breach')}
        </p>
      ) : (
        <p className="mt-3 text-[9px] leading-relaxed text-slate-600">{t('sensor.note')}</p>
      )}
    </Panel>
  )
}

/** Semicircular arc gauge. */
function Gauge({ label, value, min, max, unit, digits, color }) {
  const frac = Math.min(Math.max((value - min) / (max - min), 0), 1)
  const R = 26
  const CIRC = Math.PI * R // half circumference

  return (
    <div className="flex w-[84px] flex-col items-center">
      <svg width="72" height="42" viewBox="0 0 72 42" aria-hidden="true">
        <path
          d={`M ${36 - R} 34 A ${R} ${R} 0 0 1 ${36 + R} 34`}
          fill="none"
          stroke="#1d2b3a"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d={`M ${36 - R} 34 A ${R} ${R} 0 0 1 ${36 + R} 34`}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 700ms ease-out, stroke 300ms linear' }}
        />
      </svg>

      <div className="-mt-2 text-center">
        <div className="tabular text-sm font-bold leading-none text-slate-100">
          {value.toFixed(digits)}
          <span className="ml-0.5 text-[9px] font-normal text-muted">{unit}</span>
        </div>
        <div className="mt-1 text-[9px] leading-tight text-muted">{label}</div>
      </div>
    </div>
  )
}

function ease(current, target, rate, jitter) {
  return current + (target - current) * rate + (Math.random() - 0.5) * 2 * jitter
}

function bounded(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi)
}
