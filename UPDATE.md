# UPDATE

**3 September 2026** · PAHARA v1.0.0 · branch `master`

Two pieces of work, in order. Both are documented in full in `CHANGELOG.md`.

1. **[Forecast lead time](#1-forecast-lead-time)** — the dashboard can warn ahead of time, not only about now.
2. **[Two views](#2-two-views)** — a plain-language view for residents, with the operator dashboard one tap away.

Totals across both, excluding the generated test artifact: **19 files changed,
1,317 insertions, 139 deletions**, plus **886 lines in 6 new files**.

```
npm test
  riskEngine : all assertions passed
  openMeteo  : all 56 assertions passed        <- new
  advice     : all 14,356 assertions passed    <- new
  factors    : all 2,478 assertions passed
  placeSearch: all 9,674 assertions passed
  render     : all 136 assertions passed (was 47), 0 missing i18n keys

npm run build   built, no errors
```

Six suites, 26,700 counted assertions. All three locales at key parity: 248
each, none missing, none extra.

---

# 1. Forecast lead time

## Why

The project is named for early warning and only reported the present.
`src/lib/openMeteo.js` requested `past_days=7&forecast_days=1` and summed the
last 24 and last 168 values, so the map answered *"is it dangerous right now?"*
— the one question where the hillside already knows the answer.

## What is different on screen

A **forecast lead time** selector at the top of the *Rainfall & trigger* panel:

| Position | What it shows |
| --- | --- |
| **Now** | observed rainfall to the current hour |
| **+24h** | the 24 h and 7 d totals as they will stand tomorrow, part forecast |
| **+48h** | same, two days out |
| **+72h** | same, three days out |

Picking one moves the **whole dashboard** — map fill, priority list, alert
counts, cell inspector, place search. It is disabled in slider mode and returns
to Now when a slider moves: a what-if scenario has no clock to be ahead of.

## Two decisions worth knowing

**One fetch carries all four leads.** `fetchRainfallGrid` returns
`node -> { rain24h, rain7d, leads }`, and `fieldAtLead` projects that onto one
lead in the plain `{ rain24h, rain7d }` shape every consumer already understood.
Nothing downstream of that function knows a lead time exists. Switching lead is
a `useMemo` over 121 nodes — no network call, no source reload, no re-render of
5,922 polygons.

**`forecast_days=4`, not 3.** The anchor is found by binary-searching
`hourly.time` for the current hour, not by counting back from the array's end —
the end is a property of the request, the anchor is a property of the clock.
With `past_days=7` the current hour lands at index 168–191, and 191 + 72 = 263,
exactly the last index of an 11-day series. Three forecast days would truncate
+72 h for any fetch after midnight. A lead that does fall off the end clamps to
the furthest hour returned and sets `truncated`, and the panel says the forecast
did not reach that far rather than presenting a short sum as a full one.

## A bug found during the work

The first version appended `:00Z` to Open-Meteo's zoneless timestamps and
trusted `Date.parse`. V8 falls back to a legacy parser that accepts almost
anything — `Date.parse('nonsense:00Z')` is 1 Jan 2000, not `NaN` — so an
unrecognised stamp would have silently anchored every window to the wrong hour
instead of falling back. `parseHour` now checks the shape before parsing, and
the panel's caption formatter shares it.

## Alerts name their window

An Evacuate derived from a +72 h forecast, read as describing the present, moves
people three days early — and the next alert gets ignored.

```
ALERT LEVEL: EVACUATE
VALID FOR: +72 h — forecast conditions at 6 Sept 2026, 2:30 pm IST
...
RAINFALL (totals at +72 h)
```

At lead 0: `VALID FOR: conditions now`. In slider mode: `VALID FOR: operator
scenario — not a forecast`.

## Checked against the live API

```
hours returned : 264 (expect 264)
lead +0h    24h   19.2 mm   7d   77.3 mm   ends 2026-09-03T09:00
lead +24h   24h    0.2 mm   7d   64.4 mm   ends 2026-09-04T09:00
lead +48h   24h    0.5 mm   7d   56.9 mm   ends 2026-09-05T09:00
lead +72h   24h   11.8 mm   7d   67.0 mm   ends 2026-09-06T09:00
```

All four leads resolved, stepping forward by exactly 24 h, none truncated.

---

# 2. Two views

## Why

The dashboard was built for one reader: someone who already knows what a trigger
is. Everyone else met nine floating panels, `tpi_m`,
`0.65 × intensity + 0.35 × antecedent`, and 23 uses of 9-pixel type. The whole
app had **six responsive CSS classes, all in the header**.

## Simple view

PAHARA now opens in **simple** view and switches to **detailed** from the
header. Same grid, same rainfall field, same risk engine, same answer — a
different number of words around it.

One question, one place, one answer:

- a verdict in plain language — *Safe today* / *Stay alert* / *Danger — be ready to move* / *Move to safety now*
- the one sentence that explains it
- three things to do about it
- the nearest higher-risk zone, when there is one within 10 km
- a **Show the numbers** disclosure holding the multiplication
- **Open the full dashboard**, one tap away

Simple is the default because the two mistakes are not symmetric. An operator
shown the simple view loses ten seconds finding the toggle. A resident shown the
operator dashboard closes the tab.

## The words are derived, not decorative

`src/lib/advice.js` picks one of four sentences from the two halves of the model:

| slope | rain | sentence |
| --- | --- | --- |
| steep | hard | "This is a steep, slide-prone hillside, and it has been raining hard." |
| steep | little | "The hillside here can slide, but little rain has fallen. Rain is what starts a slide." |
| gentle | hard | "It has been raining hard, but the ground here is not steep enough to slide easily." |
| gentle | little | "The ground here is not steep, and little rain has fallen." |

That is `risk = susceptibility × trigger` with no technical word in it. A reader
who understands why the second row is not an emergency has understood the model
— which is what the methodology modal takes four paragraphs to say.

`suscept_class` decides "steep" when the grid carries it, because those bins are
quantiles of the real distribution; the 0.5 constant is only the fallback for a
grid exported without the label.

## Three things the simple view refuses to do

**Encode the verdict in colour alone.** Each level carries a glyph as well as a
hue and a sentence — tick, eye, triangle, siren. Red-amber-green fails for
roughly one man in twelve, and this is the screen someone reads while deciding
whether to leave their house.

**Dress "no data" as an answer.** 1,350 of 5,196 settlements have no modelled
slope within range. `unmonitored` gets a verdict's visual weight and says the
model has nothing to say here, in as many words. A resident who reads "no data"
as "safe" has been actively misled.

**Present invented advice as official.** Every action list carries "General
guidance, not an official evacuation order. Always follow your district
administration and the NDMA."

## The phone layout

Before: every panel a fixed pixel width absolutely positioned over the map. On a
375 px screen the left column and the alerts panel overlapped completely, the
sensor panel and legend overlapped both, and the inspector drawer covered 91% of
the display.

Now: the dashboard's four floating corners become one scrolling sheet over the
bottom two-thirds with the map above; every fixed width became
`w-full sm:w-[…]`; the 340 px inspector drawer becomes a full-width sheet.

That layout is chosen in JavaScript, not CSS — `hooks/useMediaQuery.js`. No
container can be four corners and one column at once, and rendering the panels
twice would mount two copies of every piece of local state: two fetch buttons,
two dispatch buttons, two of everything that can be mid-request. The panels are
built once into a `panels` object and placed by whichever layout is active.
Crossing 768 px re-parents them, which React handles as a remount — a real cost,
paid only by someone dragging a window across the breakpoint.

## Also

- **A tap on the map answers too.** The sheet says "tap the map to check anywhere else", so it does — routed through the same `resolvePlace` a search uses, so all three verdicts and the higher-risk note behave identically however the place was chosen.
- **Three welcome cards on first open**, never again unless asked for from the help icon. The middle card is the one that earns its place: without it, a first-time reader cannot tell why a Very High slope is coloured green.
- **Operator controls are hidden in simple mode, not disabled.** A greyed-out control someone cannot use is still clutter they have to read past.

---

## Files

### New

| File | Lines | What |
| --- | --- | --- |
| `src/components/SimpleView.jsx` | 355 | The plain-language view: verdict, why, what to do, numbers disclosure |
| `src/lib/advice.test.mjs` | 194 | 14,356 assertions — see below |
| `src/lib/advice.js` | 116 | Risk class → plain words, glyph and actions. Returns i18n keys, never text |
| `src/components/WelcomeModal.jsx` | 110 | Three cards on first open |
| `src/lib/uiMode.js` | 68 | Simple/detailed preference, first-run flag |
| `src/hooks/useMediaQuery.js` | 43 | The one breakpoint the dashboard layout turns on |
| `src/lib/openMeteo.test.mjs` | 159 | 56 assertions on rainfall windowing |

### Changed

| File | Change |
| --- | --- |
| `src/App.jsx` | Mode state; `activeField` lead projection; panels built once and placed by two layouts; map taps answer in simple mode; welcome wiring |
| `src/lib/openMeteo.js` | `forecast_days=4`; four windows per node; `anchorIndex`, `parseHour`, `fieldAtLead`, `peakField`, `leadWindowEnd`, `leadTruncated`, `LEAD_HOURS` |
| `src/components/Header.jsx` | View switch, help button; operator-only controls hidden in simple mode |
| `src/components/RainfallPanel.jsx` | Lead selector (`radiogroup`, `aria-checked`, disabled off-live), window caption, observed/forecast/truncated note |
| `src/lib/render.test.jsx` | Simple view, welcome, header modes, rainfall panel — 47 → 136 assertions |
| `src/lib/telegram.js` | `VALID FOR:` line; rainfall block labelled at non-zero lead |
| `src/components/AlertsPanel.jsx` | Accepts and forwards `lead` |
| `CellInspector`, `Legend`, `PlaceResultCard`, `PriorityList`, `SensorPanel` | Fixed widths → `w-full sm:w-[…]` |
| `src/i18n/locales/{en,hi,as}.json` | `plain` and `welcome` namespaces, view-switch strings — 248 keys each, at parity |
| `src/lib/spatialRisk.js` | No behaviour change; `peakRain` documents its relationship to `peakField` |
| `package.json` | `test:rain`, `test:advice`; `test` runs six suites |
| `README.md`, `CHANGELOG.md` | Both features documented |

`SIH_CSV/sm_Manipur_2018.csv` shows as changed in `git status` — that predates
this work and was not touched.

---

## What the advice suite actually checks

Beyond the mapping being total — every level has a headline, a summary and
exactly three actions, in all three locales, all four distinct — it cross-checks
the words against **all 5,922 real cells**:

- a sentence claiming "slide-prone" is only ever rendered for a cell the model calls slide-prone
- a sentence claiming "raining hard" is only rendered when the trigger says so
- a dry region produces only dry sentences, however steep
- every cell gets exactly one reason; all four are reachable, none is dead copy

The render suite additionally asserts that the word "susceptibility" never
reaches the closed card, and that `unmonitored` is never rendered with the
"Safe today" headline.

---

## Not verified

**Neither feature was seen in a browser.** The Chrome extension was not
connected for the first piece and did not respond for the second. The render
suite proves every component produces markup in every state and locale; that is
not the same as proving the phone sheet looks right at 375 px. Worth one pass on
a real device before demoing — the dev server is running on
http://localhost:5173.

---

## Still open

**The Hindi and Assamese strings for the plain-language layer want a native
speaker** before any real deployment — the action lists especially, since those
are the sentences someone might act on. The advice text itself is plausible
rather than official; matching NDMA or state SDMA phrasing would be better than
labelling it indicative.

**The trigger is unchanged**: `0.65 × min(rain24/100, 1) + 0.35 ×
min(rain7d/250, 1)`. Forecast lead makes the dashboard ask about the right
moment; plain language makes the answer readable. Neither improves the
arithmetic. In order of how much they would move the headline number
(spatial-CV ROC-AUC 0.6244):

1. **Model features.** `scripts/train_susceptibility.py` selects every numeric column in the grid, which is terrain only. `SIH_CSV/NE_India_IMD_Rainfall_1901_2017.csv` and `NE_India_Soil_Moisture_Master.csv` are read by nothing but `scripts/dates.py`. Adding rainfall climatology, soil moisture, distance-to-road, land cover and lithology is the largest available gain.
2. **Antecedent decay.** A flat 7-day sum treats rain from six days ago the same as yesterday's. An API with *k* ≈ 0.9/day is a two-line change.
3. **A fitted intensity–duration threshold** for Northeast India, from the landslide dates and 117 years of IMD rainfall already on disk.

## Unrelated, noticed but not changed

- `src/lib/telegram.js` hardcodes `District: Dima Hasao, Assam` in every alert. That went stale when the grid grew to eight states.
- `data/cache/render.test.mjs` is an esbuild artifact but is tracked in git, so it appears in every diff that touches the render suite.
