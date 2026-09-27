# Changelog

## Two views — 3 Sep 2026

The dashboard was built for one reader: someone who already knows what a
trigger is. Every other reader met nine floating panels, `tpi_m`,
`0.65 × intensity + 0.35 × antecedent`, and 23 uses of 9-pixel type.

PAHARA now opens in **simple** view and switches to **detailed** from the
header. Same grid, same rainfall field, same risk engine, same answer — a
different number of words around it.

**Simple is one question, one place, one answer.** A verdict in plain language
(*Safe today* / *Stay alert* / *Danger — be ready to move* / *Move to safety
now*), the one sentence that explains it, and three things to do. Every number
is still there behind a **Show the numbers** disclosure, and the whole operator
dashboard is one tap away. It is the default because the two mistakes are not
symmetric: an operator shown the simple view loses ten seconds finding the
toggle; a resident shown the operator dashboard closes the tab.

**The words are derived, not decorative.** `src/lib/advice.js` picks one of
four sentences from the two halves of the model:

| slope | rain | sentence |
| --- | --- | --- |
| steep | hard | "This is a steep, slide-prone hillside, and it has been raining hard." |
| steep | little | "The hillside here can slide, but little rain has fallen. Rain is what starts a slide." |
| gentle | hard | "It has been raining hard, but the ground here is not steep enough to slide easily." |
| gentle | little | "The ground here is not steep, and little rain has fallen." |

That is `risk = susceptibility × trigger` with no technical word in it. A reader
who understands why the second row is not an emergency has understood the
model, which is what the methodology modal takes four paragraphs to say.

`suscept_class` decides "steep" when the grid carries it, because those bins
are quantiles of the real distribution; the 0.5 constant is only the fallback
for a grid exported without the label, and the previous district file is one
such.

**Colour is never alone.** Each level carries a glyph as well as a hue and a
sentence — tick, eye, triangle, siren. Red-amber-green fails for roughly one
man in twelve, and this is the screen someone reads while deciding whether to
leave their house.

**`unmonitored` gets a verdict's visual weight**, not a grey footnote. 1,350 of
5,196 settlements have no modelled slope within range. A resident who reads
"no data" as "safe" has been actively misled, so the simple view says the model
has nothing to say here, in as many words, at the same size as an answer.

**Advice is labelled as advice.** Every action list carries "General guidance,
not an official evacuation order. Always follow your district administration
and the NDMA." The wording is plausible and it is not official, and the card
says so rather than letting a reader assume otherwise.

**The phone layout works now.** Before this the whole app had six responsive
CSS classes, all in the header, and every panel was a fixed pixel width
absolutely positioned over the map: on a 375 px screen the left column and the
alerts panel overlapped completely, the sensor panel and legend overlapped
both, and the inspector drawer covered 91% of the display. The dashboard's four
floating corners are now one scrolling sheet over the bottom two-thirds with
the map above, and every fixed width became `w-full sm:w-[…]`.

That layout is chosen in JavaScript, not CSS — `hooks/useMediaQuery.js`. No
container can be four corners and one column at once, and rendering the panels
twice would mount two copies of every piece of local state: two fetch buttons,
two dispatch buttons, two of everything that can be mid-request. So the panels
are built once into a `panels` object and placed by whichever layout is active.
Crossing 768px re-parents them, which React handles as a remount — a real cost,
paid only by someone dragging a window across the breakpoint.

**A tap on the map answers too.** The simple sheet says "tap the map to check
anywhere else", so it has to. A tap is routed through the same `resolvePlace`
a search uses rather than assembling a result by hand, so the
nearest-higher-risk note and the three verdicts behave identically however the
place was chosen.

**Three welcome cards on first open**, and never again unless someone asks from
the help icon. The middle card is the one that earns its place: without it, a
first-time reader cannot tell why a Very High slope is coloured green.

**Operator controls are hidden in simple mode, not disabled.** A greyed-out
control someone cannot use is still clutter they have to read past.

**Coverage.** A new suite, `npm run test:advice`, 14,356 assertions. Beyond the
mapping being total — every level has a headline, a summary and exactly three
actions, in all three locales, all distinct — it cross-checks the words against
all 5,922 real cells: a sentence claiming "slide-prone" is only ever rendered
for a cell the model calls slide-prone, and a dry region produces only dry
sentences. The render suite grew 74 → 136, covering every verdict, every level,
both header modes and the welcome cards in all three locales, and asserting
that the word "susceptibility" never reaches the closed card. Six suites,
26,700 counted assertions.

**Still open.** The Hindi and Assamese strings for all of this were written for
the dashboard and want a native speaker before any real deployment — the
action lists especially, because they are the sentences someone might act on.
The advice text itself is plausible rather than official; matching NDMA or
state SDMA phrasing would be better than labelling it indicative.

---

## Forecast lead time — 3 Sep 2026

PAHARA is named for early warning and, until now, only reported the present.
The rainfall fetch asked for `past_days=7&forecast_days=1` and summed the last
24 and last 168 values of the series, so the dashboard answered *is it dangerous
right now?* — the one question where the hillside already knows the answer.

**The request now asks for `forecast_days=4`, and every node is summarised four
times.** The current hour is located inside the series, and the 24 h and 168 h
windows are summed backwards from it and from three points ahead of it:

| lead | what it is |
| --- | --- |
| Now | observed rainfall to the current hour |
| +24 h | the totals as they will stand tomorrow, part forecast |
| +48 h | … |
| +72 h | … |

The operator picks one and the whole dashboard follows: the map fill, the
priority list, the alert counts and the cell inspector all read the selected
lead. A slider scenario has no clock, so the selector is disabled in what-if
mode and returns to Now when a slider moves.

**One fetch, not four.** `fetchRainfallGrid` returns
`node -> { rain24h, rain7d, leads }` and `fieldAtLead` projects that onto one
lead, in the plain `{ rain24h, rain7d }` shape every consumer already
understood. Nothing downstream knows a lead time exists. Switching lead is a
`useMemo` over 121 nodes; it costs no network call and no source reload.

**Why `forecast_days=4` and not 3.** The anchor is found by binary-searching
`hourly.time` for the current hour, not by counting back from the end of the
array — the end of the array is a property of the request, the anchor is a
property of the clock. With `past_days=7` the current hour lands at index
168–191, and 191 + 72 = 263, exactly the last index of an 11-day hourly series.
Three forecast days would truncate +72 h for any fetch after midnight. When a
lead does fall off the end — an older or shortened response — the window clamps
to the furthest hour returned and sets `truncated`, and the panel says the
forecast did not reach that far rather than presenting a short sum as a full
one. Verified live: 264 hours returned, all four leads resolved, none truncated.

**A parsing bug the tests caught.** The first version appended `:00Z` to
Open-Meteo's zoneless timestamps and trusted `Date.parse`. V8 falls back to a
legacy parser that accepts almost anything — `Date.parse('nonsense:00Z')` is
1 Jan 2000, not `NaN` — so an unrecognised stamp would have silently anchored
every window to the wrong hour instead of falling back to the observed week.
`parseHour` now checks the shape before parsing, and the panel's caption
formatter shares it rather than keeping a looser copy.

**Coverage.** A new suite, `npm run test:rain`, 56 assertions: window sums
against a ramp series where the expected value is an arithmetic series written
down independently of the implementation, anchor location and its fallbacks,
truncation against a `forecast_days=1`-shaped payload, series shorter than one
window, nulls in the series, and field projection. The render suite grew from
47 to 74, covering the selector live and disabled at every lead, in all three
locales, plus an unparseable timestamp.

**Still open.** The trigger itself is unchanged: a linear blend of a 24 h and a
flat 7 d sum. Forecast lead makes the dashboard ask about the right moment; it
does not make the arithmetic at that moment any better. Antecedent decay and a
fitted intensity-duration threshold are the next thing.

---

## Location search — 31 Aug 2026

A fuzzy settlement search over `places.json`, so someone can type a place name
instead of hunting for a cell on the map.

**Matching.** Fuse.js over 5,196 settlements, keyed on name (weight 0.8),
district (0.15) and state (0.05) so a district never outranks a settlement of
the same name. Threshold 0.35, `ignoreLocation`, `minMatchCharLength` 2, input
debounced at 150 ms, at most 8 results.

Measured against the real file, **23 of 27 romanisation variants match** —
Aizwal, Aiziwal, Shilong, Shilliong, Kohema, Itnagar, Guahati, Dimapore,
Gangtak, Agartola all resolve. Known misses, all two or three edits on a short
name: `Aizol`, `Silong`, `Imfal`, and **`Gauhati`** — the historical official
spelling of Guwahati, which is the one most likely to be typed by mistake.
Loosening the threshold to catch them costs precision everywhere else, so the
threshold stays as specified and the gap is documented rather than hidden.

**Dropdown.** Name in primary text, district + state beneath — the state is
always shown because Northeastern place names repeat across states. A coloured
dot per row carries that settlement's live risk class, computed from its own
susceptibility against the trigger at its rainfall node. Full keyboard support:
arrows move, Enter selects, Escape closes and blurs.

**Selection costs no network call.** The nearest grid cell comes from the
GeoJSON already in memory, rainfall from the 0.5° node already fetched, and the
risk from the existing `computeRisk`. Then `flyTo` at zoom 11, the cell
inspector opens, and a result card appears above it.

**The result card keeps the two layers apart.** Live risk and static
susceptibility are shown side by side and separately labelled, with the
multiplication spelled out underneath, because a Very High susceptibility slope
in dry weather is not an emergency and the card has to make that legible.

**Three verdicts, not one.** Collapsing these would mislead:

| Verdict | When | What it says |
| --- | --- | --- |
| `ok` | a modelled cell is near | the assessment, plus a distance note if the cell is over 5 km away |
| `unmonitored` | inside the region, nearest cell over 40 km | "No modelled slope near this place" |
| `outside` | outside the bbox | "Outside monitored region. PAHARA currently covers the eight Northeastern states." |

Across all 5,196 settlements: **3,846 `ok`** (830 of them through a stand-in
cell over 5 km away), **1,350 `unmonitored`**, 0 `outside`.

That middle number matters. **1,350 settlements — including Guwahati, one of the
suggestion chips — have no modelled slope within range**, because cells under 3°
are excluded and they sit on Brahmaputra valley floor. Reporting "Very Low risk"
for those would be a lie by omission: the model has nothing to say, which is a
different statement from "you are safe."

**"Nearest higher-risk zone: 4.2 km NE"** appears when a materially higher-risk
cell sits within 10 km, with distance and 8-point bearing. A resident's house may
be fine while their only road out is not.

**Edge cases.** No local match falls through to the Photon geocoder (free, no
key, biased to the region); a geocoded hit is snapped to the nearest cell and
labelled. An empty query shows five suggestion chips and up to five recent
searches from `localStorage`. If `places.json` fails to load the bar is hidden
rather than shown broken.

**Deep link.** `?place=Aizawl` runs that search on load; selecting a place
updates the URL with `history.replaceState`, no reload.

**Placement.** Desktop: top of the left column, above the rainfall panel.
Mobile: a persistent bar in the header, with the left-column copy hidden below
`lg` so it never doubles up.

**Files.** Added `src/lib/geo.js`, `src/lib/placeSearch.js`,
`src/hooks/usePlaces.js`, `src/components/PlaceSearch.jsx`,
`src/components/PlaceResultCard.jsx`, and two test suites. Changed `App.jsx`,
`Header.jsx`, the three locale files (+18 keys each, 169 total),
`vite.config.js` (precache `places.json` — search is a primary interaction and
must survive offline), `package.json`. `riskEngine.js`, the alert logic and the
citizen report form are untouched.

**Tests.** `npm test` runs four suites — **12,199 assertions**:

| Suite | Covers |
| --- | --- |
| `test:engine` | the risk engine, unchanged |
| `test:factors` | inspector factors against both real grid files |
| `test:search` | fuzzy matching, geo maths, all three verdicts over every settlement |
| `test:render` | the real components mounted via `react-dom/server`, all three locales, 0 missing i18n keys |

`test:render` exists because the Chrome extension could not reach the dev
server in this environment. It bundles the JSX with esbuild and renders it in
node, which catches bad imports, crashes on missing properties and missing
translation keys without needing a browser.

## Northeast-wide risk layer — 31 Aug 2026

PAHARA covered one district (Dima Hasao, 6,400 cells at 0.01°). It now covers
the eight Northeastern states the GSI landslide inventory surveys, on a real
susceptibility model trained from a DEM rather than a placeholder grid.

---

### 1. The susceptibility model is new, and so is the data behind it

**The supplied CSVs could not train a model as they stood.**
`NE_India_Terrain_Features.csv` turned out to be byte-for-byte the landslide
inventory with three terrain columns appended — identical `sl_no` sets, all
9,788 rows `label=1`. There was no negative class, no lattice (9,652 unique
coordinate pairs at 0.0003° median spacing, snapping to no grid step), and no
`district` / `village` / `population` column anywhere with coordinates.

So the prediction surface was built rather than loaded:

| Stage | What happens | Script |
| --- | --- | --- |
| DEM | SRTM 30 m sampled on a 0.025° lattice, masked to the eight surveyed states | `scripts/fetch_dem.py` |
| Boundaries | OSM state/district polygons, settlements, population tags | `scripts/fetch_osm.py` |
| Grid | 2×2 aggregation to 0.05° cells; slope, aspect, relief, TPI, roughness, curvature | `scripts/build_grid.py` |
| Model | Labelling, negative sampling, validation, export | `scripts/train_susceptibility.py` |

Run the whole thing with `python scripts/run_all.py`.

**Negative sampling is slope-decile matched, and this mattered more than
expected.** Negatives are drawn to match the positives' slope-decile
distribution. Sampling uniformly would have produced negatives averaging
**10.4°** against the positives' **8.5°** — because unsurveyed steep terrain
outnumbers surveyed steep terrain — and the model would have learned that
*steeper is safer*. Matched sampling puts both classes at 8.5°.

**Validation reports both figures on purpose.**

| Metric | Value |
| --- | --- |
| Spatial-block CV (GroupKFold over 0.5° blocks) — **the honest one** | **0.6244** |
| Random StratifiedKFold — inflated by spatial autocorrelation | 0.6298 |
| Logistic regression baseline, same spatial CV | 0.5893 |

**The capture ratio is the more useful headline than the AUC:** 82.6% of
recorded landslides fall in the High + Very High classes, which cover 40.2% of
the modelled area — **2.06× better than flagging land at random**.

Read the AUC honestly. Once negatives match positives on slope, most of the
easily separable signal is gone: XGBoost beats logistic regression by only
+0.035 and feature importance is nearly flat (elevation 0.20, everything else
≈0.10). At 5.5 km cells, terrain alone barely separates a landslide site from
its slope-matched neighbour.

**Scope was clipped to the surveyed states.** The requested bbox is a rectangle
that also spans Bhutan, Bangladesh, Myanmar, China and parts of West
Bengal/Bihar/Jharkhand. Nobody surveys landslides there, so those cells would
have entered the negative class as false negatives — teaching the model that
unsurveyed steep terrain is safe. Recorded in `metadata.caveats`.

---

### 2. Grid file

- `public/risk_grid.geojson` — 5,922 cells at 0.05°, **3.17 MB**
- `public/risk_grid_dimahasao.geojson` — the previous district grid, kept

The schema changed. Gained `state`, `district`, `slope_mean_deg`, `tpi_m`,
`roughness_m`, `curvature`, `aspect_sin`, `aspect_cos`, `dist_village_km`.
Lost `dist_stream_m`, `dist_road_m`, `aspect_deg`, `population_estimated`.
`metadata` went from 5 keys to 31, including the three AUCs, the feature list,
feature importance and five caveats.

---

### 3. App changes

**Map opens on the region.** 25.8 N, 93.0 E at zoom 6. The source now uses
`promoteId: 'cell_id'` instead of `generateId`, so per-cell risk can be
addressed by name from outside the component.

**The inspector is driven by the file, not by hardcoded fields.** Factor bars
come from `metadata.features` and are ordered by model importance. Aspect is
reconstructed from its sin/cos pair and shown as a compass point — a direction
is not a magnitude, so a bar would misrepresent it. Every descriptive row
renders only if the property exists. `src/lib/factors.test.mjs` runs both real
grid files plus hostile synthetic cells (nulls, `NaN`, `Infinity`, strings,
absent keys) — 2,478 assertions.

**Rainfall is a coarse lattice, never per cell.** `buildRainfallNodes` derives
0.5° nodes from the cells themselves — **121 nodes for the current grid, two
batched calls of ≤100** — and every cell reads the node containing it. Because
the nodes come from the cells, every cell is guaranteed a node.

The two rainfall modes are deliberately different:

- **Sliders (what-if)** — one scalar for the whole region. Recolouring stays a
  single `setPaintProperty` call, exactly as before.
- **Fetch (live)** — a spatial field. Per-cell risk is pushed into
  feature-state once per fetch, so dragging a slider never walks 5,922
  features.

**Methodology modal** now shows model type, both AUCs with a note that the gap
is spatial autocorrelation, the logistic baseline, cell count, landslide record
count and the data source list — all from `metadata`.

**Loading** streams the response and shows a determinate progress bar with a
percentage and MB readout above 3 MB, falling back to the spinner below that.

---

### 4. Files

**Added** — `src/lib/spatialRisk.js`, `src/lib/factors.test.mjs`,
`scripts/` (inspect_data, fetch_dem, fetch_osm, build_grid, train_susceptibility,
export, dates, run_all), `out/` (risk_grid_ne.geojson, places.json, metrics.json).

**Changed** — `App.jsx`, `MapView.jsx`, `CellInspector.jsx`,
`MethodologyModal.jsx`, `PriorityList.jsx`, `AlertsPanel.jsx`,
`RainfallPanel.jsx`, `useRiskGrid.js`, `openMeteo.js`, `factors.js`,
`colors.js`, all three locale files (+19 keys each, 151 total),
`vite.config.js`, `package.json`, `README.md`.

**Deliberately untouched** — `riskEngine.js`, `telegram.js`, `ReportModal.jsx`,
`i18n/index.js`. `npm run test:engine` still passes unchanged, which is the
proof for the engine.

---

### 5. Known limitations

- **AUC 0.6244 is modest.** Terrain-only susceptibility at 5.5 km cells against
  an unevenly surveyed inventory. Treat the output as a ranking, not a
  probability.
- **Slope is not comparable to the CSV's.** Grid slope is derived on a ~2.8 km
  baseline and reads much lower than `slope_degrees` in
  `NE_India_Terrain_Features.csv`, which came from a fine DEM at point
  locations.
- **Population is sparse.** OSM tags cover 18.8% of the 5,196 settlements;
  the rest are `null`, never an invented estimate.
- **The progress bar keys off `Content-Length`.** Behind a gzipping host that
  is the compressed size, so it may fall back to the spinner in production.
- **No live browser verification.** The Chrome extension disconnected during
  this session. Changes are verified by build, unit tests and HTTP checks, not
  by a click-through.
- **A temporal triggering model is still not viable** — see below.

---

### 6. Why there is no rainfall-triggered forecast

Dates in the inventory live in free text, not a date column: 14.0%
day-precision, 97.4% carry a year. Against that:

- **Soil moisture** covers 2018-06-01 → 2020-09-23, but only 464 distinct days
  in two disjoint chunks (2019 absent entirely), at district level with no
  coordinates. Only **47** landslides with a day-precision date land on a day
  that has a reading.
- **Rainfall** is 1901–2017 *monthly* totals for four subdivisions. Assam and
  Meghalaya share one series. Monthly totals for a region that size cannot
  resolve a triggering event.

47 usable positive-day matches against district averages, with no negative days
and no daily rainfall, is far below what a trigger-threshold model needs. It
would need daily gridded rainfall — IMD 0.25° gridded, CHIRPS or GPM.
