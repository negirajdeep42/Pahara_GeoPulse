// Telegram Bot API dispatch.
//
// The token comes from a Vite env var and is therefore embedded in the built
// bundle - anyone with the deployed URL can read it. That is an accepted
// trade-off for a no-backend demo; a production deployment must move this call
// behind a server that holds the token. See the README.

export const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_TOKEN || ''
export const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || ''
export const telegramConfigured = Boolean(TELEGRAM_TOKEN && TELEGRAM_CHAT_ID)

/** Highest band present in the district right now. */
export function alertLevel(counts) {
  if (counts.Evacuate > 0) return 'Evacuate'
  if (counts.Warning > 0) return 'Warning'
  if (counts.Watch > 0) return 'Watch'
  return 'Safe'
}

/**
 * Formats the dispatch. Plain text on purpose: no Markdown or HTML parse mode
 * means village names with punctuation can never break the message.
 */
export function buildAlertMessage({
  level,
  affected,
  counts,
  topVillages = [],
  rain24h,
  rain7d,
  trigger,
  source,
  lead = 0,
  timestamp = new Date(),
}) {
  const lines = []
  lines.push('PAHARA — LANDSLIDE EARLY WARNING')
  lines.push('District: Dima Hasao, Assam')
  lines.push('')
  lines.push(`ALERT LEVEL: ${level.toUpperCase()}`)
  // The lead time is not decoration. An Evacuate derived from a +72 h forecast
  // read as though it described the present would move people three days
  // early, and the next one would be ignored. It goes on the line under the
  // level, where it cannot be skimmed past.
  lines.push(`VALID FOR: ${leadLabel(lead, source, timestamp)}`)
  lines.push(`Zones at Warning or Evacuate: ${affected}`)
  lines.push(`  Evacuate ${counts.Evacuate} · Warning ${counts.Warning} · Watch ${counts.Watch}`)
  lines.push('')

  if (topVillages.length) {
    lines.push('TOP AT-RISK LOCATIONS')
    topVillages.forEach((v, i) => {
      const pop =
        v.population === null || v.population === undefined
          ? 'population unknown'
          : `pop. ${Number(v.population).toLocaleString('en-IN')}${
              v.population_estimated ? ' (est.)' : ''
            }`
      lines.push(`${i + 1}. ${v.nearest_village} — risk ${v.risk.toFixed(2)} — ${pop}`)
      lines.push(`   cell ${v.cell_id} @ ${fmt(v.lat)}N ${fmt(v.lon)}E`)
    })
    lines.push('')
  }

  lines.push(Number(lead) > 0 ? `RAINFALL (totals at +${Number(lead)} h)` : 'RAINFALL')
  lines.push(`  24-hour: ${Number(rain24h).toFixed(1)} mm`)
  lines.push(`  7-day antecedent: ${Number(rain7d).toFixed(1)} mm`)
  lines.push(`  Source: ${source === 'live' ? 'Open-Meteo (live)' : 'operator simulation'}`)
  lines.push(`  Trigger: ${Number(trigger).toFixed(2)} of 1.00`)
  lines.push('')
  lines.push(`Issued: ${formatStamp(timestamp)}`)
  lines.push('Model: risk = susceptibility x trigger. Sensor feed is simulated.')

  return lines.join('\n')
}

export async function sendTelegramAlert(text, { signal } = {}) {
  if (!telegramConfigured) {
    throw new Error('Telegram is not configured')
  }

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
    signal,
  })

  let payload = null
  try {
    payload = await res.json()
  } catch {
    // Non-JSON body: fall through to the status check below.
  }

  if (!res.ok || payload?.ok === false) {
    throw new Error(payload?.description || `Telegram returned HTTP ${res.status}`)
  }
  return payload
}

/**
 * What window this alert describes. A slider scenario is neither now nor a
 * forecast and must not be labelled as either.
 */
function leadLabel(lead, source, issuedAt) {
  const h = Number(lead) || 0
  if (source !== 'live') return 'operator scenario — not a forecast'
  if (h <= 0) return 'conditions now'
  const at = new Date(issuedAt.getTime() + h * 3600e3)
  return `+${h} h — forecast conditions at ${formatStamp(at)}`
}

function fmt(v) {
  return Number.isFinite(Number(v)) ? Number(v).toFixed(3) : '?'
}

function formatStamp(d) {
  // IST is what a Dima Hasao control room reads.
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(d) + ' IST'
  } catch {
    return d.toISOString()
  }
}
