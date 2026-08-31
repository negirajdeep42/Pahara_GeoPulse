// Fuzzy place lookup, and what happens once a place is chosen.
//
// Indian place names have many valid romanisations - Aizawl/Aizwal,
// Shillong/Shilong, Kohima/Kohema - so exact matching would fail in front of an
// audience. Fuse handles the spelling; this module handles everything after the
// match, which is where the honesty lives: a settlement can be inside the
// region and still have no modelled slope near it, and that is a different
// answer from "outside the region".

import Fuse from 'fuse.js'
import { nearestCell, nearestHigherRisk } from './geo.js'

/** The modelled window. Matches the offline pipeline's bbox. */
export const BBOX = { latMin: 21.5, latMax: 29.6, lonMin: 87.8, lonMax: 97.5 }

/** Beyond this, a cell is reported as "nearest monitored cell, N km away". */
export const NEAR_CELL_KM = 5

/** Beyond this there is no honest assessment to give at all. */
export const FAR_CELL_KM = 40

export const MAX_RESULTS = 8
export const DEBOUNCE_MS = 150
export const SUGGESTIONS = ['Guwahati', 'Aizawl', 'Shillong', 'Itanagar', 'Kohima']
export const RECENT_KEY = 'pahara.recentSearches'
export const RECENT_MAX = 5

/**
 * 'name' is weighted far above the administrative fields so a district called
 * Aizawl never outranks the town of Aizawl.
 */
export const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 0.8 },
    { name: 'district', weight: 0.15 },
    { name: 'state', weight: 0.05 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeScore: true,
}

export function buildIndex(places) {
  return new Fuse(places, FUSE_OPTIONS)
}

export function searchPlaces(fuse, query, limit = MAX_RESULTS) {
  if (!fuse || !query || query.trim().length < 2) return []
  return fuse
    .search(query.trim(), { limit })
    .map((r) => ({ ...r.item, score: r.score }))
}

export function insideRegion(lat, lon) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= BBOX.latMin &&
    lat <= BBOX.latMax &&
    lon >= BBOX.lonMin &&
    lon <= BBOX.lonMax
  )
}

/**
 * Tie a chosen point to the grid.
 *
 * Returns one of three verdicts, because collapsing them would mislead:
 *
 *   outside      not in the eight states at all
 *   unmonitored  inside the region, but the nearest modelled cell is too far
 *                to say anything about this spot - flat valley floor, dropped
 *                by the slope filter
 *   ok           a real assessment, with `distant` set when the cell is not
 *                the one the place actually sits in
 *
 * No network call: the grid and the rainfall field are already in memory.
 */
export function resolvePlace(point, scoredCells) {
  const lat = Number(point?.lat)
  const lon = Number(point?.lon)

  if (!insideRegion(lat, lon)) return { verdict: 'outside', point }
  if (!scoredCells?.length) return { verdict: 'unmonitored', point, km: null }

  const hit = nearestCell(scoredCells, lat, lon)
  if (!hit || hit.km > FAR_CELL_KM) {
    return { verdict: 'unmonitored', point, km: hit ? hit.km : null }
  }

  const { cell, km } = hit
  return {
    verdict: 'ok',
    point,
    cell,
    km,
    // the cell is a stand-in for somewhere the place is not
    distant: km > NEAR_CELL_KM,
    higher: nearestHigherRisk(scoredCells, lat, lon, cell.risk, 10),
  }
}

// ------------------------------------------------------------------ geocoder

const PHOTON_URL = 'https://photon.komoot.io/api/'

/**
 * Fallback for names that are not settlements in our own file - a river, a
 * pass, a spelling nobody indexed. Free, no key. Biased towards the region so
 * "Kohima" does not return Ohio.
 */
export async function geocode(query, { signal, limit = 5 } = {}) {
  const url =
    `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=${limit}` +
    `&lat=${(BBOX.latMin + BBOX.latMax) / 2}&lon=${(BBOX.lonMin + BBOX.lonMax) / 2}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Photon returned HTTP ${res.status}`)
  const data = await res.json()
  return (data?.features ?? [])
    .map((f, i) => {
      const c = f?.geometry?.coordinates
      const p = f?.properties ?? {}
      if (!Array.isArray(c) || c.length < 2) return null
      return {
        id: `photon-${i}-${p.osm_id ?? i}`,
        name: p.name ?? query,
        lat: Number(c[1]),
        lon: Number(c[0]),
        state: p.state ?? null,
        district: p.county ?? p.district ?? null,
        country: p.country ?? null,
        population: null,
        susceptibility: null,
        suscept_class: null,
        geocoded: true,
      }
    })
    .filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lon))
}

// ------------------------------------------------------------------- recents

export function loadRecents() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return Array.isArray(raw) ? raw.filter((r) => r && r.name).slice(0, RECENT_MAX) : []
  } catch {
    return []
  }
}

export function pushRecent(place) {
  try {
    const entry = {
      name: place.name,
      lat: place.lat,
      lon: place.lon,
      state: place.state ?? null,
      district: place.district ?? null,
    }
    const next = [entry, ...loadRecents().filter((r) => r.name !== entry.name)].slice(
      0,
      RECENT_MAX,
    )
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    return next
  } catch {
    return loadRecents()
  }
}
