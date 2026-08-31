import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RISK_COLOR } from '../lib/colors'
import { computeRisk, computeTrigger, riskClass } from '../lib/riskEngine'
import { nodeKeyFor } from '../lib/openMeteo'
import {
  DEBOUNCE_MS,
  MAX_RESULTS,
  SUGGESTIONS,
  buildIndex,
  geocode,
  loadRecents,
  searchPlaces,
} from '../lib/placeSearch'

/**
 * Fuzzy settlement search over places.json.
 *
 * Everything needed to answer is already in memory, so selecting a result
 * costs no network call. The one exception is a name that is not a settlement
 * in our file at all, which falls through to the Photon geocoder.
 */
export default function PlaceSearch({
  places,
  rainField,
  uniformRain,
  onSelect,
  autoFocus = false,
  compact = false,
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [remote, setRemote] = useState({ status: 'idle', results: [] })
  const [recents, setRecents] = useState(() => loadRecents())

  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const remoteAbort = useRef(null)

  const fuse = useMemo(() => buildIndex(places), [places])

  // --- debounce: 150 ms, short enough not to feel laggy while typing -------
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [query])

  const local = useMemo(
    () => searchPlaces(fuse, debounced, MAX_RESULTS),
    [fuse, debounced],
  )

  // --- geocoder fallback, only when we have nothing of our own ------------
  useEffect(() => {
    remoteAbort.current?.abort()
    const q = debounced.trim()
    if (local.length > 0 || q.length < 3) {
      setRemote({ status: 'idle', results: [] })
      return
    }
    const controller = new AbortController()
    remoteAbort.current = controller
    setRemote({ status: 'loading', results: [] })
    geocode(q, { signal: controller.signal })
      .then((results) => setRemote({ status: 'ready', results }))
      .catch((err) => {
        if (err.name === 'AbortError') return
        // offline, or the geocoder is down: an empty result reads as "no
        // match", which is the truth from the user's point of view
        setRemote({ status: 'error', results: [] })
      })
    return () => controller.abort()
  }, [debounced, local.length])

  const results = local.length ? local : remote.results
  const showEmptyState = debounced.trim().length < 2

  useEffect(() => setActive(0), [debounced, results.length])

  // --- close on outside click ---------------------------------------------
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // keep the highlighted row in view when arrowing through a long list
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  /** Trigger for the node this place sits in - the same field the map uses. */
  const triggerAt = useCallback(
    (lat, lon) => {
      const hit = rainField?.get(nodeKeyFor(lat, lon))
      return hit
        ? computeTrigger(hit.rain24h, hit.rain7d)
        : computeTrigger(uniformRain?.rain24h, uniformRain?.rain7d)
    },
    [rainField, uniformRain],
  )

  const choose = useCallback(
    (place) => {
      if (!place) return
      setOpen(false)
      setQuery('')
      setDebounced('')
      inputRef.current?.blur()
      onSelect?.(place)
      setRecents(loadRecents())
    },
    [onSelect],
  )

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (!open) {
      if (e.key === 'ArrowDown') setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (results.length) {
        e.preventDefault()
        choose(results[active])
      }
    }
  }

  const pickByName = (name) => {
    const exact = places.find((p) => p.name.toLowerCase() === name.toLowerCase())
    if (exact) return choose(exact)
    const near = searchPlaces(fuse, name, 1)
    if (near.length) choose(near[0])
  }

  return (
    <div ref={rootRef} className={`relative ${compact ? 'w-full' : 'w-[288px]'}`}>
      {/* input */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          aria-expanded={open}
          aria-controls="place-search-list"
          aria-autocomplete="list"
          role="combobox"
          className="field !py-2 !pl-8 !pr-8"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setDebounced('')
              inputRef.current?.focus()
            }}
            aria-label={t('search.clear')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      {/* dropdown */}
      {open && (
        <div className="panel absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden">
          {showEmptyState ? (
            <div className="px-3 py-2.5">
              {recents.length > 0 && (
                <>
                  <p className="label">{t('search.recent')}</p>
                  <div className="mb-2.5 flex flex-wrap gap-1">
                    {recents.map((r) => (
                      <button
                        key={`${r.name}-${r.lat}`}
                        type="button"
                        onClick={() => choose(r)}
                        className="rounded-sm border border-line bg-ink-700 px-2 py-1 text-[11px] text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <p className="label">{t('search.suggestions')}</p>
              <div className="flex flex-wrap gap-1">
                {SUGGESTIONS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => pickByName(name)}
                    className="rounded-sm border border-sky-900 bg-sky-950/50 px-2 py-1 text-[11px] text-sky-200 transition hover:border-sky-700 hover:bg-sky-900/60"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 text-[11px] leading-relaxed text-muted">
              {remote.status === 'loading' ? t('search.searching') : t('search.noResults')}
            </p>
          ) : (
            <ul
              ref={listRef}
              id="place-search-list"
              role="listbox"
              className="scroll-thin max-h-[268px] overflow-y-auto"
            >
              {results.map((p, i) => {
                const trig = triggerAt(p.lat, p.lon)
                const known = Number.isFinite(p.susceptibility)
                const cls = known ? riskClass(computeRisk(p.susceptibility, trig)) : null
                const where = [p.district, p.state].filter(Boolean).join(', ')
                return (
                  <li key={p.id ?? `${p.name}-${i}`} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      data-active={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(p)}
                      className={`flex w-full items-center gap-2.5 border-l-2 px-2.5 py-1.5 text-left transition ${
                        i === active
                          ? 'border-l-sky-400 bg-ink-600'
                          : 'border-l-transparent hover:bg-ink-700'
                      }`}
                    >
                      {/* live risk class for this settlement */}
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: cls ? RISK_COLOR[cls] : '#334155' }}
                        title={cls ? t(`risk.${cls}`) : t('search.noRiskData')}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-medium text-slate-100">
                          {p.name}
                        </span>
                        {/* state always shown: these names repeat across states */}
                        <span className="block truncate text-[10px] text-slate-500">
                          {p.geocoded ? t('search.fromGeocoder') : where || t('search.unknownArea')}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
