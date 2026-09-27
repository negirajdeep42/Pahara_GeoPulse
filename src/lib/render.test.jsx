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
import RainfallPanel from '../components/RainfallPanel.jsx'
import SimpleView from '../components/SimpleView.jsx'
import WelcomeModal from '../components/WelcomeModal.jsx'
import Header from '../components/Header.jsx'
import { adviceFor } from './advice.js'
import { resolvePlace } from './placeSearch.js'
import { scoreCells } from './spatialRisk.js'

let checks = 0
const missingKeys = new Set()
const ok = (cond, msg) => {
  assert.ok(cond, msg)
  checks += 1
}
const eq = (a, b, msg) => {
  assert.equal(a, b, msg)
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

// ------------------------------------------------------------ simple view
// The view a resident actually reads. Every verdict must render, and the
// answer must carry the plain words rather than the raw class name - a card
// that says "Evacuate 0.78" is the operator dashboard wearing a bigger font.
const simple = (props) => (
  <SimpleView
    places={places}
    placesReady
    activeField={null}
    rain={{ rain24h: 60, rain7d: 200, source: 'sim' }}
    onSelectPlace={() => {}}
    onReport={() => {}}
    onDetails={() => {}}
    {...props}
  />
)

{
  const empty = render(simple({ result: null }), 'SimpleView/empty')
  ok(empty.includes(en.plain.emptyTitle), 'SimpleView: the empty state invites a search')
  ok(empty.includes(en.plain.reportCta), 'SimpleView: reporting is reachable before any search')
  ok(empty.includes(en.plain.detailsCta), 'SimpleView: the full dashboard is one tap away')

  // a place with a real answer
  const answer = render(simple({ result: byVerdict.ok }), 'SimpleView/ok')
  const advice = adviceFor(byVerdict.ok.cell)
  const headline = advice.headlineKey.split('.').reduce((o, k) => o[k], en)
  ok(answer.includes(headline), 'SimpleView: the verdict is the plain headline')
  ok(answer.includes(en.plain.whyTitle), 'SimpleView: it says why')
  ok(answer.includes(en.plain.doTitle), 'SimpleView: it says what to do')
  ok(answer.includes(en.plain.adviceNote), 'SimpleView: the advice is labelled as unofficial')
  ok(answer.includes(en.plain.showNumbers), 'SimpleView: the numbers are reachable')
  ok(!answer.includes('susceptibility'), 'SimpleView: no jargon on the closed card')

  // every level renders, and each one shows its own words
  for (const level of ['Safe', 'Watch', 'Warning', 'Evacuate']) {
    const cell = { ...byVerdict.ok.cell, riskClass: level, risk: 0.5 }
    const html = render(simple({ result: { ...byVerdict.ok, cell } }), `SimpleView/${level}`)
    ok(html.includes(en.plain.level[level].headline), `SimpleView: ${level} headline`)
    for (let i = 1; i <= 3; i += 1) {
      ok(html.includes(en.plain.level[level][`do${i}`]), `SimpleView: ${level} action ${i}`)
    }
  }

  // the two honest non-answers
  const nodata = render(simple({ result: byVerdict.unmonitored }), 'SimpleView/unmonitored')
  ok(nodata.includes(en.plain.nodataTitle), 'SimpleView: unmonitored says so plainly')
  ok(
    !nodata.includes(en.plain.level.Safe.headline),
    'SimpleView: no data is never shown as "Safe today"',
  )
  if (byVerdict.outside) {
    const outside = render(simple({ result: byVerdict.outside }), 'SimpleView/outside')
    ok(outside.includes(en.plain.outsideTitle), 'SimpleView: outside the region says so')
  }

  // places still loading must not crash the sheet
  render(simple({ result: null, placesReady: false }), 'SimpleView/loading')
}

// ------------------------------------------------------------------ welcome
{
  const html = render(<WelcomeModal open onClose={() => {}} />, 'WelcomeModal/open')
  ok(html.includes(en.welcome.s2Title), 'WelcomeModal: the two-halves card is present')
  ok(html.includes('role="dialog"'), 'WelcomeModal: announced as a dialog')
  eq(render(<WelcomeModal open={false} onClose={() => {}} />, 'WelcomeModal/closed'), '',
    'WelcomeModal: closed renders nothing')
}

// ------------------------------------------------------------------- header
{
  const head = (mode) =>
    render(
      <Header
        colorMode="risk"
        onColorMode={() => {}}
        online
        onMethodology={() => {}}
        mode={mode}
        onMode={() => {}}
        onHelp={() => {}}
      />,
      `Header/${mode}`,
    )

  const simpleHead = head('simple')
  const detailHead = head('detailed')
  for (const html of [simpleHead, detailHead]) {
    ok(html.includes(en.header.viewSimple), 'Header: the view switch is always present')
    ok(html.includes(en.header.viewDetailed))
  }
  ok(
    !simpleHead.includes(en.header.methodology),
    'Header: operator-only controls are hidden in simple mode, not disabled',
  )
  ok(detailHead.includes(en.header.methodology), 'Header: methodology returns in detailed mode')
}

// -------------------------------------------------- rainfall panel + leads
// The lead selector drives the whole dashboard, so its two states have to
// render: live, where the operator can look ahead, and a slider scenario,
// where there is nothing to look ahead of and the buttons are disabled.
const panel = (props) => (
  <RainfallPanel
    rain24h={60}
    rain7d={200}
    onChange={() => {}}
    onFetchLive={async () => {}}
    onLead={() => {}}
    nodeCount={121}
    {...props}
  />
)

for (const lead of [0, 24, 48, 72]) {
  const html = render(panel({ source: 'live', lead, leadWindow: '2026-09-11T14:00' }), `RainfallPanel/live/+${lead}`)
  ok(html.includes('aria-checked="true"'), `RainfallPanel: lead +${lead} marks one button selected`)
  ok(
    (html.match(/aria-checked="true"/g) || []).length === 1,
    `RainfallPanel: lead +${lead} selects exactly one`,
  )
  // the Tailwind classes mention `disabled:`, so count the real attribute
  ok(
    (html.match(/disabled=""/g) || []).length === 0,
    `RainfallPanel: lead +${lead} is choosable when live`,
  )
}

const simHtml = render(panel({ source: 'sim', lead: 0 }), 'RainfallPanel/sim')
ok(
  (simHtml.match(/disabled=""/g) || []).length === 4,
  'RainfallPanel: every lead is disabled in a slider scenario',
)

// a stamp the API could not have sent must not crash the caption
render(panel({ source: 'live', lead: 24, leadWindow: 'nonsense' }), 'RainfallPanel/badStamp')
ok(
  render(panel({ source: 'live', lead: 72, leadWindow: '2026-09-11T14:00', leadTruncated: true }), 'RainfallPanel/truncated').length > 0,
  'RainfallPanel: a truncated lead renders its warning',
)

// ------------------------------------------------------ every locale renders
for (const lng of ['en', 'hi', 'as']) {
  i18n.changeLanguage(lng)
  render(panel({ source: 'live', lead: 48, leadWindow: '2026-09-11T14:00' }), `RainfallPanel/${lng}`)
  render(simple({ result: byVerdict.ok }), `SimpleView/${lng}`)
  render(simple({ result: byVerdict.unmonitored }), `SimpleView/nodata/${lng}`)
  render(simple({ result: null }), `SimpleView/empty/${lng}`)
  render(<WelcomeModal open onClose={() => {}} />, `WelcomeModal/${lng}`)
  render(panel({ source: 'sim', lead: 0 }), `RainfallPanel/sim/${lng}`)
  render(<PlaceSearch places={places} rainField={null} uniformRain={{}} onSelect={() => {}} />, `PlaceSearch/${lng}`)
  render(<PlaceResultCard result={byVerdict.ok} features={meta.features} importance={meta.feature_importance} onClose={() => {}} />, `PlaceResultCard/${lng}`)
  render(<PlaceResultCard result={byVerdict.outside} onClose={() => {}} />, `PlaceResultCard/outside/${lng}`)
}
i18n.changeLanguage('en')

ok(missingKeys.size === 0, `no missing i18n keys (saw: ${[...missingKeys].join(', ') || 'none'})`)

console.log(`render: all ${checks} assertions passed, 0 missing i18n keys`)
