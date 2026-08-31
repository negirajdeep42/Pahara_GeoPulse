import { useEffect, useState } from 'react'

/**
 * Loads /places.json once, on app start.
 *
 * The offline pipeline writes an object - { count, note, places: [...] } - but
 * a bare array is accepted too, so a hand-made or older file still works.
 *
 * Records with no susceptibility are kept, not dropped: 2,180 of the 5,196
 * settlements sit on flat ground with no modelled cell within 5 km, and a
 * resident searching for one of those deserves "no modelled slope nearby"
 * rather than "no such place". Guwahati is one of them.
 *
 * On failure the search bar is hidden rather than shown broken, so `status`
 * matters to the caller.
 */
export function usePlaces(url = '/places.json') {
  const [state, setState] = useState({
    status: 'loading',
    places: [],
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status} while fetching ${url}`)
        const raw = await res.json()

        const list = Array.isArray(raw) ? raw : raw?.places
        if (!Array.isArray(list)) {
          throw new Error('places.json is neither an array nor { places: [...] }')
        }

        const places = list
          .map((p, i) => ({
            id: `${p.name}|${p.district ?? ''}|${i}`,
            name: String(p.name ?? '').trim(),
            lat: Number(p.lat),
            lon: Number(p.lon),
            state: p.state ?? null,
            district: p.district ?? null,
            population: Number.isFinite(Number(p.population)) ? Number(p.population) : null,
            // absent from the current export; honoured if a future one adds it
            population_estimated: p.population_estimated === true,
            susceptibility: Number.isFinite(Number(p.susceptibility))
              ? Number(p.susceptibility)
              : null,
            suscept_class: p.suscept_class ?? null,
            place_type: p.place_type ?? null,
          }))
          .filter((p) => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lon))

        if (cancelled) return
        setState({ status: 'ready', places, error: null })
      } catch (err) {
        if (cancelled || err.name === 'AbortError') return
        setState({ status: 'error', places: [], error: err.message || String(err) })
      }
    }

    load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [url])

  return state
}
