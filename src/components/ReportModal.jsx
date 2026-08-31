import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const TYPES = ['crack', 'slope', 'road', 'seepage', 'other']

const BBOX = { latMin: 25.0, latMax: 25.8, lonMin: 92.6, lonMax: 93.4 }

/**
 * Citizen hazard report. Everything stays in this browser session - there is
 * no server to receive it - which the form says out loud.
 */
export default function ReportModal({ open, onClose, onSubmit, defaultCenter }) {
  const { t } = useTranslation()
  const dialogRef = useRef(null)
  const fileRef = useRef(null)

  const [photo, setPhoto] = useState(null) // { url, name }
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [type, setType] = useState('crack')
  const [description, setDescription] = useState('')
  const [geoState, setGeoState] = useState('idle') // idle | locating | ok | denied | unavailable
  const [error, setError] = useState(null)

  // Reset each time the modal opens, and seed with the map centre so a manual
  // report is never starting from nothing.
  useEffect(() => {
    if (!open) return
    setPhoto((p) => {
      if (p?.url) URL.revokeObjectURL(p.url)
      return null
    })
    setLat(defaultCenter?.lat != null ? defaultCenter.lat.toFixed(4) : '')
    setLon(defaultCenter?.lon != null ? defaultCenter.lon.toFixed(4) : '')
    setType('crack')
    setDescription('')
    setGeoState('idle')
    setError(null)
    requestGeolocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Escape closes; focus lands inside the dialog.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function requestGeolocation() {
    if (!('geolocation' in navigator)) {
      setGeoState('unavailable')
      return
    }
    setGeoState('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5))
        setLon(pos.coords.longitude.toFixed(5))
        setGeoState('ok')
      },
      (err) => {
        setGeoState(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return { url: URL.createObjectURL(file), name: file.name }
    })
  }

  function clearPhoto() {
    setPhoto((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleSubmit(e) {
    e.preventDefault()
    const la = Number(lat)
    const lo = Number(lon)
    if (!Number.isFinite(la) || !Number.isFinite(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) {
      setError(t('report.needLocation'))
      return
    }
    onSubmit({
      id: `RPT-${Date.now().toString(36).toUpperCase()}`,
      lat: la,
      lon: lo,
      type,
      description: description.trim(),
      photoUrl: photo?.url || null,
      photoName: photo?.name || null,
      createdAt: new Date(),
    })
    // Ownership of the object URL passes to the report; do not revoke it here.
    setPhoto(null)
    if (fileRef.current) fileRef.current.value = ''
    onClose()
  }

  if (!open) return null

  const outsideBbox =
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lon)) &&
    (Number(lat) < BBOX.latMin ||
      Number(lat) > BBOX.latMax ||
      Number(lon) < BBOX.lonMin ||
      Number(lon) > BBOX.lonMax)

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t('report.title')}
        className="panel scroll-thin max-h-full w-[420px] max-w-full overflow-y-auto outline-none"
      >
        <div className="panel-header sticky top-0 z-10 bg-ink-800">
          <span className="panel-title">{t('report.title')}</span>
          <button type="button" className="btn !px-2 !py-1" onClick={onClose} aria-label={t('common.close')}>
            <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4">
          {/* photo */}
          <label className="label" htmlFor="rpt-photo">
            {t('report.photo')}
          </label>
          {photo ? (
            <div className="relative overflow-hidden rounded border border-line">
              <img src={photo.url} alt="" className="max-h-52 w-full object-cover" />
              <button
                type="button"
                onClick={clearPhoto}
                className="btn absolute right-2 top-2 !px-2 !py-1 !text-[10px]"
              >
                {t('report.photoRemove')}
              </button>
            </div>
          ) : (
            <label
              htmlFor="rpt-photo"
              className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded border border-dashed border-line bg-ink-700/60 px-3 py-6 transition hover:border-slate-600 hover:bg-ink-600"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-slate-500">
                <path d="M3 8a2 2 0 012-2h2l1.5-2h7L17 6h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <circle cx="12" cy="12.5" r="3.5" />
              </svg>
              <span className="text-[11px] text-slate-400">{t('report.photoHint')}</span>
            </label>
          )}
          <input
            id="rpt-photo"
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="sr-only"
          />

          {/* location */}
          <div className="mt-4 flex items-center justify-between">
            <span className="label mb-0">{t('report.location')}</span>
            <button
              type="button"
              className="btn !px-2 !py-1 !text-[10px]"
              onClick={requestGeolocation}
              disabled={geoState === 'locating'}
            >
              {geoState === 'locating' ? t('report.locating') : t('report.useGps')}
            </button>
          </div>

          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <div>
              <label className="label" htmlFor="rpt-lat">
                {t('report.lat')}
              </label>
              <input
                id="rpt-lat"
                className="field tabular"
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="25.1645"
              />
            </div>
            <div>
              <label className="label" htmlFor="rpt-lon">
                {t('report.lon')}
              </label>
              <input
                id="rpt-lon"
                className="field tabular"
                inputMode="decimal"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                placeholder="93.0176"
              />
            </div>
          </div>

          {geoState === 'ok' && (
            <p className="mt-1.5 text-[10px] text-emerald-400">{t('report.gpsOk')}</p>
          )}
          {geoState === 'denied' && (
            <p className="mt-1.5 text-[10px] text-amber-400">{t('report.gpsDenied')}</p>
          )}
          {geoState === 'unavailable' && (
            <p className="mt-1.5 text-[10px] text-amber-400">{t('report.gpsUnavailable')}</p>
          )}
          {outsideBbox && (
            <p className="mt-1.5 text-[10px] text-slate-500">
              {Number(lat).toFixed(3)}, {Number(lon).toFixed(3)} — outside the Dima Hasao grid
            </p>
          )}

          {/* type */}
          <div className="mt-4">
            <label className="label" htmlFor="rpt-type">
              {t('report.type')}
            </label>
            <select
              id="rpt-type"
              className="field"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {TYPES.map((key) => (
                <option key={key} value={key}>
                  {t(`report.types.${key}`)}
                </option>
              ))}
            </select>
          </div>

          {/* description */}
          <div className="mt-4">
            <label className="label" htmlFor="rpt-desc">
              {t('report.description')}
            </label>
            <textarea
              id="rpt-desc"
              className="field h-20 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('report.descriptionPlaceholder')}
              maxLength={600}
            />
          </div>

          {error && (
            <p className="mt-3 rounded border border-red-900 bg-red-950/50 px-2 py-1.5 text-[11px] text-red-300">
              {error}
            </p>
          )}

          <p className="mt-3 text-[10px] leading-relaxed text-muted">{t('report.sessionNote')}</p>

          <div className="mt-4 flex gap-2">
            <button type="button" className="btn flex-1" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {t('report.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
