import { useEffect } from 'react'

/**
 * Transient confirmations, centred under the header so they read as system
 * feedback rather than page content.
 */
export default function Toasts({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-50 flex w-[min(420px,90vw)] -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const ms = toast.tone === 'error' ? 9000 : 5000
    const id = setTimeout(() => onDismiss(toast.id), ms)
    return () => clearTimeout(id)
  }, [toast.id, toast.tone, onDismiss])

  const tone =
    toast.tone === 'error'
      ? 'border-red-800 bg-red-950/95 text-red-100'
      : toast.tone === 'warn'
        ? 'border-amber-800 bg-amber-950/95 text-amber-100'
        : 'border-emerald-800 bg-emerald-950/95 text-emerald-100'

  return (
    <div
      role="status"
      className={`pointer-events-auto flex animate-toast-in items-start gap-2.5 rounded border px-3 py-2.5 shadow-2xl shadow-black/60 backdrop-blur ${tone}`}
    >
      <span className="mt-0.5 shrink-0">
        {toast.tone === 'error' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">{toast.title}</p>
        {toast.detail && (
          <p className="mt-0.5 break-words text-[11px] opacity-85">{toast.detail}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-60 transition hover:opacity-100"
        aria-label="Dismiss"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}
