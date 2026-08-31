import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Collapsible panel shell shared by the map-side controls.
 * `tone="amber"` marks a panel whose contents are not real field data.
 */
export default function Panel({
  title,
  badge,
  tone = 'default',
  defaultOpen = true,
  className = '',
  bodyClassName = '',
  alarm = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const { t } = useTranslation()
  const id = useId()

  const toneHeader =
    tone === 'amber'
      ? 'text-amber-300'
      : tone === 'danger'
        ? 'text-red-300'
        : 'text-slate-300'

  return (
    <section
      className={`panel pointer-events-auto ${alarm ? 'animate-pulse-danger' : ''} ${className}`}
    >
      <div className="panel-header">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          title={open ? t('common.collapse') : t('common.expand')}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 10 10"
            className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M2 0l6 5-6 5z" />
          </svg>
          {/* no truncation: the sensor panel's "hardware in development"
              warning must always be readable in full */}
          <span className={`panel-title leading-tight ${toneHeader}`}>{title}</span>
        </button>
        {badge}
      </div>

      {open && (
        <div id={id} className={bodyClassName || 'px-3 py-3'}>
          {children}
        </div>
      )}
    </section>
  )
}
