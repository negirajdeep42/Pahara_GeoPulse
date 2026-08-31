// Distance and bearing helpers for tying a searched place to the grid.
//
// The grid is a few thousand cells, so a linear scan costs well under a
// millisecond and is done on selection only. No spatial index earns its
// complexity here.

const R_KM = 6371.0088
const toRad = (d) => (d * Math.PI) / 180

/** Great-circle distance in kilometres. */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

/** Initial bearing from 1 to 2, as degrees and an 8-point compass label. */
export function bearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1))
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  return { deg, compass: POINTS[Math.round(deg / 45) % 8] }
}

/**
 * The cell closest to a point, with its distance.
 *
 * A cheap latitude gate first: a degree of latitude is ~111 km everywhere, so
 * anything further than the best distance found so far in latitude alone
 * cannot win, and most of the grid is skipped without a trig call.
 */
export function nearestCell(cells, lat, lon) {
  let best = null
  let bestKm = Infinity
  for (let i = 0; i < cells.length; i += 1) {
    const c = cells[i]
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) continue
    if (Math.abs(c.lat - lat) * 111.32 >= bestKm) continue
    const km = haversineKm(lat, lon, c.lat, c.lon)
    if (km < bestKm) {
      bestKm = km
      best = c
    }
  }
  return best ? { cell: best, km: bestKm } : null
}

/**
 * The nearest cell within `radiusKm` whose risk is materially higher than
 * `risk`. Answers the question a resident actually has: my house may be fine,
 * but is the road out of here?
 */
export function nearestHigherRisk(cells, lat, lon, risk, radiusKm = 10, margin = 0.05) {
  let best = null
  let bestKm = Infinity
  for (let i = 0; i < cells.length; i += 1) {
    const c = cells[i]
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) continue
    if (!(c.risk > risk + margin)) continue
    if (Math.abs(c.lat - lat) * 111.32 >= Math.min(bestKm, radiusKm)) continue
    const km = haversineKm(lat, lon, c.lat, c.lon)
    if (km <= radiusKm && km < bestKm) {
      bestKm = km
      best = c
    }
  }
  return best ? { cell: best, km: bestKm, ...bearing(lat, lon, best.lat, best.lon) } : null
}
