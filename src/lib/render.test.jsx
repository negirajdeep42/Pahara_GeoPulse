// Renders the real search components with the real data.
//
// The unit suites prove the logic; this proves the components actually mount -
// no bad import, no crash on a missing property, and every i18n key the JSX
// asks for really exists in the locale files. Bundled with esbuild and run in
// node, so it needs no browser.
//
// Run: npm run test:render

import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '../i18n/locales/en.json'
import hi from '../i18n/locales/hi.json'
import as from '../i18n/locales/as.json'
import PlaceSearch from '../components/PlaceSearch.jsx'
import PlaceResultCard from '../components/PlaceResultCard.jsx'
import CellInspector from '../components/CellInspector.jsx'
import { resolvePlace } from './placeSearch.js'
import { scoreCells } from './spatialRisk.js'

let checks = 0
const missingKeys = new Set()
const ok = (cond, msg) => {
  assert.ok(cond, msg)
  checks += 1
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi }, as: { translation: as } },
  lng: 'en',
  fallbackLng: false,
  interpolation: { escapeValue: false },
  saveMissing: true,
  missingKeyHandler: (_lng, _ns, key) => missingKeys.add(key),
})

const raw = JSON.parse(readFileSync('public/places.json', 'utf8'))
const places = (Array.isArray(raw) ? raw : raw.places).map((p, i) => ({ ...p, id: `p${i}` }))
const fc = JSON.parse(readFileSync('public/risk_grid.geojson', 'utf8'))
const meta = fc.metadata ?? {}
const cells = fc.features.map((f) => ({
  ...f.properties,
  lat: Number(f.properties.lat),
  lon: Number(f.properties.lon),
  susceptibility: Number(f.properties.susceptibility) || 0,
}))
const scored = scoreCells(cells, null, { rain24h: 60, rain7d: 200 })

const render = (el, what) => {
  let html = ''
  assert.doesNotThrow(() => {
    html = renderToStaticMarkup(el)
  }, `${what} renders without throwing`)
  checks += 1
  return html
}

// ------------------------------------------------------------ the search bar
{
  const html = render(
    <PlaceSearch places={places} rainField={null} uniformRain={{ rain24h: 60, rain7d: 200 }} onSelect={() => {}} />,
    'PlaceSearch',
  )
  ok(html.includes('combobox'), 'search input is a combobox')
  ok(html.includes(en.search.placeholder), 'placeholder comes from i18n')
  ok(render(<PlaceSearch places={[]} rainField={null} uniformRain={{}} onSelect={() => {}} />, 'PlaceSearch/empty').length > 0,
    'search survives an empty place list')
  ok(render(<PlaceSearch places={places} rainField={null} uniformRain={{}} onSelect={() => {}} compact />, 'PlaceSearch/compact').length > 0,
    'compact variant renders')
}

// -------------------------------------------------- the card, all 3 verdicts
const byVerdict = { ok: null, unmonitored: null, outside: null }
for (const p of places) {
  const r = resolvePlace(p, scored)
  if (!byVerdict[r.verdict]) byVerdict[r.verdict] = r
  if (byVerdict.ok && byVerdict.unmonitored) break
}
byVerdict.outside = resolvePlace({ name: 'Delhi', lat: 28.61, lon: 77.21 }, scored)

// and one that reports through a distant stand-in cell
const guwahati = places.find((p) => p.name === 'Guwahati')
const distantCase = guwahati ? resolvePlace(guwahati, scored) : null

for (const [verdict, result] of Object.entries(byVerdict)) {
  ok(result, `found a "${verdict}" case to render`)
  const html = render(
    <PlaceResultCard
      result={result}
      features={meta.features ?? null}
      importance={meta.feature_importance ?? null}
      onClose={() => {}}
    />,
    `PlaceResultCard/${verdict}`,
  )
  ok(html.includes(result.point.name ?? ''), `${verdict} card shows the place name`)
  if (verdict === 'outside') ok(html.includes('Outside monitored region'), 'outside card says so plainly')
  if (verdict === 'unmonitored') ok(html.includes('No modelled slope'), 'unmonitored card says so plainly')
  if (verdict === 'ok') {
    ok(html.includes(en.search.liveRisk), 'ok card labels live risk')
    ok(html.includes(en.search.staticSusceptibility), 'ok card labels static susceptibility separately')
  }
}

if (distantCase && distantCase.verdict === 'ok' && distantCase.distant) {
  const html = render(
    <PlaceResultCard result={distantCase} features={meta.features} importance={meta.feature_importance} onClose={() => {}} />,
    'PlaceResultCard/distant',
  )
  ok(html.includes('Nearest monitored cell'), 'a distant stand-in cell is labelled as such')
}

// a case that carries the higher-risk hint
{
  const withHint = places.map((p) => resolvePlace(p, scored)).find((r) => r.verdict === 'ok' && r.higher)
  ok(withHint, 'found a place with a nearer higher-risk zone')
  const html = render(
    <PlaceResultCard result={withHint} features={meta.features} importance={meta.feature_importance} onClose={() => {}} />,
    'PlaceResultCard/higher-risk',
  )
  ok(html.includes('Nearest higher-risk zone'), 'the higher-risk hint renders')
  ok(/\d+\.\d+ km (N|NE|E|SE|S|SW|W|NW)\b/.test(html), 'the hint carries a distance and a bearing')
}

// null/garbage results must not take the app down
render(<PlaceResultCard result={null} onClose={() => {}} />, 'PlaceResultCard/null')
render(
  <PlaceResultCard result={{ verdict: 'ok', point: { name: 'X', lat: 25, lon: 93 }, cell: { susceptibility: 0.5, trigger: 0.4, risk: 0.2, riskClass: 'Watch' }, km: 1 }} onClose={() => {}} />,
  'PlaceResultCard/sparse cell',
)

// ----------------------------------------------- the inspector, both schemas
for (const [label, path] of [
  ['northeast', 'public/risk_grid.geojson'],
  ['dima hasao', 'public/risk_grid_dimahasao.geojson'],
]) {
  const g = JSON.parse(readFileSync(path, 'utf8'))
  const feats = g.metadata?.features ?? null
  const imp = g.metadata?.feature_importance ?? null
  for (const f of g.features.filter((_, i) => i % 1500 === 0).slice(0, 6)) {
    render(
      <CellInspector cell={f.properties} trigger={0.42} rain24h={60} rain7d={200} features={feats} importance={imp} onClose={() => {}} />,
      `CellInspector/${label}`,
    )
  }
}

// ------------------------------------------------------ every locale renders
for (const lng of ['en', 'hi', 'as']) {
  i18n.changeLanguage(lng)
  render(<PlaceSearch places={places} rainField={null} uniformRain={{}} onSelect={() => {}} />, `PlaceSearch/${lng}`)
  render(<PlaceResultCard result={byVerdict.ok} features={meta.features} importance={meta.feature_importance} onClose={() => {}} />, `PlaceResultCard/${lng}`)
  render(<PlaceResultCard result={byVerdict.outside} onClose={() => {}} />, `PlaceResultCard/outside/${lng}`)
}
i18n.changeLanguage('en')

ok(missingKeys.size === 0, `no missing i18n keys (saw: ${[...missingKeys].join(', ') || 'none'})`)

console.log(`render: all ${checks} assertions passed, 0 missing i18n keys`)
