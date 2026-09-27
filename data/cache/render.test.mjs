// src/lib/render.test.jsx
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import i18n2 from "i18next";
import { initReactI18next as initReactI18next2 } from "react-i18next";

// src/i18n/locales/en.json
var en_default = {
  app: {
    title: "PAHARA",
    subtitle: "Predictive Analytics for Hazard Assessment and Rapid Alerts \u2014 Northeast India",
    sih: "SIH 2026 \xB7 SIH26001",
    loading: "Loading risk grid\u2026",
    loadError: "Could not load the risk grid",
    loadErrorHint: "risk_grid.geojson must be present in the public folder.",
    retry: "Retry"
  },
  status: {
    online: "Online",
    offline: "Offline",
    offlineNote: "Cached data"
  },
  header: {
    modeLabel: "Map layer",
    modeSusceptibility: "Susceptibility",
    modeRisk: "Live risk",
    methodology: "Methodology",
    language: "Language",
    viewLabel: "View",
    viewSimple: "Simple",
    viewDetailed: "Detailed",
    viewSimpleTitle: "Plain language, one place at a time",
    viewDetailedTitle: "The full operator dashboard",
    help: "Help"
  },
  legend: {
    susceptibility: "Susceptibility (static)",
    liveRisk: "Live risk",
    formula: "risk = susceptibility \xD7 trigger. Trigger now:",
    staticNote: "Precomputed offline from terrain. Does not change with weather."
  },
  suscept: {
    "Very Low": "Very Low",
    Low: "Low",
    Moderate: "Moderate",
    High: "High",
    "Very High": "Very High"
  },
  risk: {
    Safe: "Safe",
    Watch: "Watch",
    Warning: "Warning",
    Evacuate: "Evacuate"
  },
  rain: {
    title: "Rainfall & trigger",
    rain24h: "24-hour rainfall",
    rain7d: "7-day antecedent rainfall",
    fetch: "Fetch live rainfall",
    fetching: "Fetching\u2026",
    live: "LIVE",
    simulated: "SIMULATED",
    trigger: "Trigger",
    liveNote: "Open-Meteo \xB7 last 24 h and 168 h at 25.4\xB0N 93.0\xB0E",
    simNote: "Manually set \u2014 scenario simulation",
    error: "Could not reach Open-Meteo",
    intensity: "Intensity",
    antecedent: "Antecedent",
    weights: "0.65 \xD7 intensity + 0.35 \xD7 antecedent",
    nodes: "{{count}} rainfall nodes on a 0.5\xB0 lattice",
    lead: "Forecast lead time",
    leadNow: "Now",
    leadWindow: "window ends {{time}}",
    leadObserved: "Observed rainfall to the current hour.",
    leadForecast: "Rainfall totals as they will stand {{hours}} h from now, part forecast.",
    leadNeedsLive: "Fetch live rainfall to look ahead. A slider scenario has no clock.",
    leadTruncated: "The forecast did not reach this far ahead; showing the furthest hour returned."
  },
  inspector: {
    title: "Cell inspector",
    coords: "Coordinates",
    why: "Why this rating",
    terrain: "Terrain \u2014 static susceptibility",
    triggerGroup: "Rainfall \u2014 live trigger",
    exposure: "Exposure",
    village: "Nearest village",
    population: "Population",
    estimated: "estimated",
    susceptibility: "Susceptibility",
    risk: "Live risk",
    equation: "susceptibility \xD7 trigger = risk",
    noData: "n/a",
    noDataNote: "Not present in this grid file",
    state: "State",
    district: "District",
    noFactors: "This grid file lists no model features.",
    noExposure: "No settlement data in this grid file.",
    rainFromNode: "From the 0.5\xB0 rainfall node covering this cell"
  },
  factor: {
    slope: "Slope",
    relief: "Local relief",
    elevation: "Elevation",
    stream: "Stream proximity",
    road: "Road distance",
    intensity: "Rainfall intensity",
    antecedent: "Antecedent moisture",
    slopeMean: "Mean slope",
    roughness: "Roughness",
    tpi: "Topographic position",
    curvature: "Curvature",
    aspect: "Aspect",
    village_distance: "Settlement proximity"
  },
  priority: {
    title: "Priority zones",
    subtitle: "Top 10 by live risk",
    empty: "No cells above Safe at the current trigger.",
    population: "pop."
  },
  alerts: {
    title: "Alerts",
    affected: "Zones at Warning or Evacuate",
    level: "Alert level",
    dispatch: "Dispatch alert to district control room",
    sending: "Dispatching\u2026",
    configure: "Configure Telegram",
    configureHint: "Set VITE_TELEGRAM_TOKEN and VITE_TELEGRAM_CHAT_ID in your environment, then rebuild.",
    log: "Dispatch log",
    logEmpty: "No alerts dispatched this session.",
    sent: "Alert delivered to the control room",
    failed: "Alert failed",
    none: "No zone is at Warning or Evacuate right now.",
    confirm: "Dispatch to the control room?"
  },
  report: {
    fab: "Report a hazard",
    title: "Citizen hazard report",
    photo: "Photo",
    photoHint: "Camera or gallery \xB7 optional",
    photoRemove: "Remove photo",
    location: "Location",
    useGps: "Use my location",
    locating: "Locating\u2026",
    gpsDenied: "Location permission denied \u2014 enter coordinates manually.",
    gpsUnavailable: "Geolocation unavailable \u2014 enter coordinates manually.",
    gpsOk: "Location captured from device",
    lat: "Latitude",
    lon: "Longitude",
    type: "Observation type",
    types: {
      crack: "Ground crack",
      slope: "Slope movement",
      road: "Road blocked",
      seepage: "Water seepage",
      other: "Other"
    },
    description: "Description",
    descriptionPlaceholder: "What did you see?",
    submit: "Submit report",
    submitted: "Report added to the map",
    needLocation: "A valid latitude and longitude are required.",
    sessionNote: "Reports stay in this browser session \u2014 there is no server.",
    reportedAt: "Reported",
    markerTitle: "Citizen report"
  },
  sensor: {
    title: "Simulated sensor node \u2014 hardware in development",
    node: "Node HFL-01 \xB7 Haflong ridge",
    moisture: "Soil moisture",
    tilt: "Tilt angle",
    battery: "Battery",
    breach: "Threshold breached",
    note: "Values are generated in the browser and scale with the rainfall inputs."
  },
  method: {
    title: "Methodology",
    concept: "How PAHARA scores risk",
    conceptBody: "Susceptibility is precomputed offline from terrain and never changes with the weather; the predictors used are listed in this file\u2019s metadata and shown per cell in the inspector. Triggering is computed live in this browser from rainfall. The map shows the product of the two.",
    generated: "Grid generated",
    methodUsed: "Scoring method",
    auc: "Spatial-block CV ROC-AUC",
    cells: "Cells in grid",
    sources: "Data sources",
    simulatedTitle: "Sensor feed is simulated",
    simulatedBody: "The sensor node panel shows generated values, not readings from a deployed device. Field hardware is in development.",
    noMetadata: "This grid file carries no metadata block, so generation details are unavailable. Regenerate it with the offline pipeline to embed them.",
    close: "Close",
    records: "Landslide records used",
    validation: "Validation",
    aucSpatial: "Spatial-block CV ROC-AUC",
    aucRandom: "Random-split ROC-AUC",
    aucBaseline: "Logistic regression baseline",
    aucNote: "The random split scores higher because neighbouring cells are not independent \u2014 a cell\u2019s neighbours leak into the test fold. The spatial-block figure holds whole 0.5\xB0 blocks out, and is the honest one."
  },
  units: {
    mm: "mm",
    m: "m",
    deg: "\xB0",
    volt: "V",
    percent: "%",
    km: "km"
  },
  common: {
    close: "Close",
    cancel: "Cancel",
    dismiss: "Dismiss",
    collapse: "Collapse",
    expand: "Expand"
  },
  search: {
    placeholder: "Search a village, town or district\u2026",
    clear: "Clear search",
    searching: "Searching\u2026",
    noResults: "No match. Try another spelling.",
    suggestions: "Try one of these",
    recent: "Recent",
    resultTitle: "Location assessment",
    liveRisk: "Live risk",
    staticSusceptibility: "Static susceptibility",
    outsideRegion: "Outside monitored region. PAHARA currently covers the eight Northeastern states.",
    unmonitored: "No modelled slope near this place. Cells below 3\xB0 are excluded, so flat valley floor is not scored.",
    unmonitoredNear: "No modelled slope near this place \u2014 the closest is {{km}} km away. Cells below 3\xB0 are excluded, so flat valley floor is not scored.",
    nearestCell: "Nearest monitored cell, {{km}} km away. This rating describes that cell, not the settlement itself.",
    higherRisk: "Nearest higher-risk zone: {{km}} km {{dir}} ({{cls}}). Your route out may be worse than your location.",
    noRiskData: "No modelled slope nearby",
    fromGeocoder: "From map search",
    unknownArea: "Area unknown",
    populationUnknown: "not recorded"
  },
  plain: {
    title: "Is a landslide likely near me?",
    searchLabel: "Find your village or town",
    searchHint: "Type a place name in the Northeast",
    emptyTitle: "Search your village",
    emptyBody: "PAHARA tells you whether a landslide is likely near a place today, using the shape of the land and the rain that has fallen on it.",
    emptyTry: "Try one of these",
    whyTitle: "Why",
    doTitle: "What to do",
    adviceNote: "General guidance, not an official evacuation order. Always follow your district administration and the NDMA.",
    higherNear: "Higher risk {{km}} km {{dir}} of here. Your house may be fine while your road out is not.",
    distantCell: "The nearest modelled hillside is {{km}} km away, so this is the closest reading, not a reading of this exact spot.",
    nodataTitle: "No slope data for this place",
    nodataBody: "PAHARA has no modelled hillside near {{name}}. That is not the same as safe \u2014 the model simply has nothing to say here. Many valley-floor towns are in this position.",
    outsideTitle: "Outside the covered area",
    outsideBody: "PAHARA currently covers the eight Northeastern states of India.",
    rainTitle: "Rain here",
    rainToday: "Last 24 hours",
    rainWeek: "Last 7 days",
    showNumbers: "Show the numbers",
    hideNumbers: "Hide the numbers",
    numbersNote: "Risk is how steep and slide-prone the land is, multiplied by how wet it is. Either one alone is not a danger.",
    numbersSlope: "Slope danger",
    numbersRain: "Rain now",
    numbersRisk: "Risk today",
    reportCta: "Report a landslide",
    detailsCta: "Open the full dashboard",
    mapHint: "Tap the map to check anywhere else.",
    level: {
      Safe: {
        headline: "Safe today",
        summary: "No landslide is expected near this place right now.",
        do1: "No action needed today.",
        do2: "Check again if heavy rain starts.",
        do3: "Know which way you would leave, just in case."
      },
      Watch: {
        headline: "Stay alert",
        summary: "Conditions here could turn. Worth keeping an eye on.",
        do1: "Watch the rain over the next day.",
        do2: "Keep your phone charged and this page saved.",
        do3: "Agree with your family where you would go."
      },
      Warning: {
        headline: "Danger \u2014 be ready to move",
        summary: "A landslide is possible near this place. Prepare to leave.",
        do1: "Pack papers, medicines and a torch now.",
        do2: "Stay off steep slopes and roads cut into hillsides.",
        do3: "Tell your neighbours, especially anyone who cannot walk far."
      },
      Evacuate: {
        headline: "Move to safety now",
        summary: "A landslide is likely near this place. Do not wait.",
        do1: "Leave for flat, open ground away from slopes.",
        do2: "Do not use roads cut into hillsides.",
        do3: "Call your village head or the district control room."
      }
    },
    reason: {
      steepWet: "This is a steep, slide-prone hillside, and it has been raining hard.",
      steepDry: "The hillside here can slide, but little rain has fallen. Rain is what starts a slide.",
      gentleWet: "It has been raining hard, but the ground here is not steep enough to slide easily.",
      gentleDry: "The ground here is not steep, and little rain has fallen."
    }
  },
  welcome: {
    title: "Welcome to PAHARA",
    subtitle: "Landslide warning for Northeast India",
    s1Title: "Search your village",
    s1Body: "Type a place name and see whether a landslide is likely near it today.",
    s2Title: "Two things make a landslide",
    s2Body: "A slope that can fail, and rain heavy enough to start it. One without the other is not a danger \u2014 PAHARA checks both.",
    s3Title: "Colours mean action",
    s3Body: "Green is safe, yellow means stay alert, orange means get ready, red means move now.",
    start: "Start",
    skip: "Skip",
    reopen: "You can see this again from the help icon."
  }
};

// src/i18n/locales/hi.json
var hi_default = {
  app: {
    title: "PAHARA",
    subtitle: "\u0916\u0924\u0930\u093E \u0906\u0915\u0932\u0928 \u090F\u0935\u0902 \u0924\u094D\u0935\u0930\u093F\u0924 \u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u0939\u0947\u0924\u0941 \u092A\u0942\u0930\u094D\u0935\u093E\u0928\u0941\u092E\u093E\u0928 \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u2014 \u092A\u0942\u0930\u094D\u0935\u094B\u0924\u094D\u0924\u0930 \u092D\u093E\u0930\u0924",
    sih: "SIH 2026 \xB7 SIH26001",
    loading: "\u091C\u094B\u0916\u093F\u092E \u0917\u094D\u0930\u093F\u0921 \u0932\u094B\u0921 \u0939\u094B \u0930\u0939\u093E \u0939\u0948\u2026",
    loadError: "\u091C\u094B\u0916\u093F\u092E \u0917\u094D\u0930\u093F\u0921 \u0932\u094B\u0921 \u0928\u0939\u0940\u0902 \u0939\u094B \u0938\u0915\u093E",
    loadErrorHint: "risk_grid.geojson \u092B\u093C\u093E\u0907\u0932 public \u092B\u093C\u094B\u0932\u094D\u0921\u0930 \u092E\u0947\u0902 \u0939\u094B\u0928\u0940 \u091A\u093E\u0939\u093F\u090F\u0964",
    retry: "\u092A\u0941\u0928\u0903 \u092A\u094D\u0930\u092F\u093E\u0938 \u0915\u0930\u0947\u0902"
  },
  status: {
    online: "\u0911\u0928\u0932\u093E\u0907\u0928",
    offline: "\u0911\u092B\u093C\u0932\u093E\u0907\u0928",
    offlineNote: "\u0938\u0902\u091A\u093F\u0924 (\u0915\u0948\u0936) \u0921\u0947\u091F\u093E"
  },
  header: {
    modeLabel: "\u092E\u093E\u0928\u091A\u093F\u0924\u094D\u0930 \u092A\u0930\u0924",
    modeSusceptibility: "\u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932\u0924\u093E",
    modeRisk: "\u0938\u091C\u0940\u0935 \u091C\u094B\u0916\u093F\u092E",
    methodology: "\u0915\u093E\u0930\u094D\u092F\u092A\u094D\u0930\u0923\u093E\u0932\u0940",
    language: "\u092D\u093E\u0937\u093E",
    viewLabel: "\u0926\u0943\u0936\u094D\u092F",
    viewSimple: "\u0938\u0930\u0932",
    viewDetailed: "\u0935\u093F\u0938\u094D\u0924\u0943\u0924",
    viewSimpleTitle: "\u0938\u0930\u0932 \u092D\u093E\u0937\u093E, \u090F\u0915 \u0938\u092E\u092F \u092E\u0947\u0902 \u090F\u0915 \u0938\u094D\u0925\u093E\u0928",
    viewDetailedTitle: "\u092A\u0942\u0930\u093E \u0911\u092A\u0930\u0947\u091F\u0930 \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921",
    help: "\u0938\u0939\u093E\u092F\u0924\u093E"
  },
  legend: {
    susceptibility: "\u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932\u0924\u093E (\u0938\u094D\u0925\u093F\u0930)",
    liveRisk: "\u0938\u091C\u0940\u0935 \u091C\u094B\u0916\u093F\u092E",
    formula: "\u091C\u094B\u0916\u093F\u092E = \u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932\u0924\u093E \xD7 \u091F\u094D\u0930\u093F\u0917\u0930\u0964 \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u091F\u094D\u0930\u093F\u0917\u0930:",
    staticNote: "\u092D\u0942\u092D\u093E\u0917 \u0938\u0947 \u092A\u0942\u0930\u094D\u0935-\u092A\u0930\u093F\u0915\u0932\u093F\u0924\u0964 \u092E\u094C\u0938\u092E \u0915\u0947 \u0938\u093E\u0925 \u0928\u0939\u0940\u0902 \u092C\u0926\u0932\u0924\u0940\u0964"
  },
  suscept: {
    "Very Low": "\u092C\u0939\u0941\u0924 \u0915\u092E",
    Low: "\u0915\u092E",
    Moderate: "\u092E\u0927\u094D\u092F\u092E",
    High: "\u0909\u091A\u094D\u091A",
    "Very High": "\u092C\u0939\u0941\u0924 \u0909\u091A\u094D\u091A"
  },
  risk: {
    Safe: "\u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924",
    Watch: "\u0928\u093F\u0917\u0930\u093E\u0928\u0940",
    Warning: "\u091A\u0947\u0924\u093E\u0935\u0928\u0940",
    Evacuate: "\u0928\u093F\u0937\u094D\u0915\u093E\u0938\u0928"
  },
  rain: {
    title: "\u0935\u0930\u094D\u0937\u093E \u090F\u0935\u0902 \u091F\u094D\u0930\u093F\u0917\u0930",
    rain24h: "24 \u0918\u0902\u091F\u0947 \u0915\u0940 \u0935\u0930\u094D\u0937\u093E",
    rain7d: "7 \u0926\u093F\u0928 \u0915\u0940 \u092A\u0942\u0930\u094D\u0935\u0935\u0930\u094D\u0924\u0940 \u0935\u0930\u094D\u0937\u093E",
    fetch: "\u0938\u091C\u0940\u0935 \u0935\u0930\u094D\u0937\u093E \u0921\u0947\u091F\u093E \u0932\u093E\u090F\u0901",
    fetching: "\u0932\u093E\u092F\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948\u2026",
    live: "\u0938\u091C\u0940\u0935",
    simulated: "\u0905\u0928\u0941\u0930\u0942\u092A\u093F\u0924",
    trigger: "\u091F\u094D\u0930\u093F\u0917\u0930",
    liveNote: "Open-Meteo \xB7 25.4\xB0N 93.0\xB0E \u092A\u0930 \u092A\u093F\u091B\u0932\u0947 24 \u0914\u0930 168 \u0918\u0902\u091F\u0947",
    simNote: "\u092E\u0948\u0928\u094D\u092F\u0941\u0905\u0932 \u0930\u0942\u092A \u0938\u0947 \u0928\u093F\u0930\u094D\u0927\u093E\u0930\u093F\u0924 \u2014 \u092A\u0930\u093F\u0926\u0943\u0936\u094D\u092F \u0905\u0928\u0941\u0930\u0942\u092A\u0923",
    error: "Open-Meteo \u0938\u0947 \u0938\u0902\u092A\u0930\u094D\u0915 \u0928\u0939\u0940\u0902 \u0939\u094B \u0938\u0915\u093E",
    intensity: "\u0924\u0940\u0935\u094D\u0930\u0924\u093E",
    antecedent: "\u092A\u0942\u0930\u094D\u0935\u0935\u0930\u094D\u0924\u0940",
    weights: "0.65 \xD7 \u0924\u0940\u0935\u094D\u0930\u0924\u093E + 0.35 \xD7 \u092A\u0942\u0930\u094D\u0935\u0935\u0930\u094D\u0924\u0940",
    nodes: "0.5\xB0 \u091C\u093E\u0932\u0915 \u092A\u0930 {{count}} \u0935\u0930\u094D\u0937\u093E \u0928\u094B\u0921",
    lead: "\u092A\u0942\u0930\u094D\u0935\u093E\u0928\u0941\u092E\u093E\u0928 \u0905\u0917\u094D\u0930\u093F\u092E \u0905\u0935\u0927\u093F",
    leadNow: "\u0905\u092D\u0940",
    leadWindow: "\u0905\u0935\u0927\u093F \u0938\u092E\u093E\u092A\u094D\u0924 {{time}}",
    leadObserved: "\u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u0918\u0902\u091F\u0947 \u0924\u0915 \u0915\u0940 \u092E\u093E\u092A\u0940 \u0917\u0908 \u0935\u0930\u094D\u0937\u093E\u0964",
    leadForecast: "\u0905\u092C \u0938\u0947 {{hours}} \u0918\u0902\u091F\u0947 \u092C\u093E\u0926 \u0915\u0940 \u0935\u0930\u094D\u0937\u093E \u2014 \u0906\u0902\u0936\u093F\u0915 \u0930\u0942\u092A \u0938\u0947 \u092A\u0942\u0930\u094D\u0935\u093E\u0928\u0941\u092E\u093E\u0928\u0964",
    leadNeedsLive: "\u0906\u0917\u0947 \u0926\u0947\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0932\u093E\u0907\u0935 \u0935\u0930\u094D\u0937\u093E \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0915\u0930\u0947\u0902\u0964 \u0938\u094D\u0932\u093E\u0907\u0921\u0930 \u092A\u0930\u093F\u0926\u0943\u0936\u094D\u092F \u092E\u0947\u0902 \u0938\u092E\u092F \u0928\u0939\u0940\u0902 \u0939\u094B\u0924\u093E\u0964",
    leadTruncated: "\u092A\u0942\u0930\u094D\u0935\u093E\u0928\u0941\u092E\u093E\u0928 \u0907\u0924\u0928\u0940 \u0926\u0942\u0930 \u0924\u0915 \u0928\u0939\u0940\u0902 \u092A\u0939\u0941\u0901\u091A\u093E; \u0909\u092A\u0932\u092C\u094D\u0927 \u0905\u0902\u0924\u093F\u092E \u0918\u0902\u091F\u093E \u0926\u093F\u0916\u093E\u092F\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948\u0964"
  },
  inspector: {
    title: "\u0915\u094B\u0936\u093F\u0915\u093E \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0915",
    coords: "\u0928\u093F\u0930\u094D\u0926\u0947\u0936\u093E\u0902\u0915",
    why: "\u092F\u0939 \u0936\u094D\u0930\u0947\u0923\u0940 \u0915\u094D\u092F\u094B\u0902",
    terrain: "\u092D\u0942\u092D\u093E\u0917 \u2014 \u0938\u094D\u0925\u093F\u0930 \u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932\u0924\u093E",
    triggerGroup: "\u0935\u0930\u094D\u0937\u093E \u2014 \u0938\u091C\u0940\u0935 \u091F\u094D\u0930\u093F\u0917\u0930",
    exposure: "\u0938\u0902\u092A\u0930\u094D\u0915 \u090F\u0935\u0902 \u092A\u0939\u0941\u0901\u091A",
    village: "\u0928\u093F\u0915\u091F\u0924\u092E \u0917\u093E\u0901\u0935",
    population: "\u091C\u0928\u0938\u0902\u0916\u094D\u092F\u093E",
    estimated: "\u0905\u0928\u0941\u092E\u093E\u0928\u093F\u0924",
    susceptibility: "\u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932\u0924\u093E",
    risk: "\u0938\u091C\u0940\u0935 \u091C\u094B\u0916\u093F\u092E",
    equation: "\u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932\u0924\u093E \xD7 \u091F\u094D\u0930\u093F\u0917\u0930 = \u091C\u094B\u0916\u093F\u092E",
    noData: "\u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u0939\u0940\u0902",
    noDataNote: "\u0907\u0938 \u0917\u094D\u0930\u093F\u0921 \u092B\u093C\u093E\u0907\u0932 \u092E\u0947\u0902 \u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u0939\u0940\u0902",
    state: "\u0930\u093E\u091C\u094D\u092F",
    district: "\u091C\u093C\u093F\u0932\u093E",
    noFactors: "\u0907\u0938 \u0917\u094D\u0930\u093F\u0921 \u092B\u093C\u093E\u0907\u0932 \u092E\u0947\u0902 \u0915\u094B\u0908 \u092E\u0949\u0921\u0932 \u0935\u093F\u0936\u0947\u0937\u0924\u093E \u0938\u0942\u091A\u0940\u092C\u0926\u094D\u0927 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
    noExposure: "\u0907\u0938 \u0917\u094D\u0930\u093F\u0921 \u092B\u093C\u093E\u0907\u0932 \u092E\u0947\u0902 \u092C\u0938\u094D\u0924\u0940 \u0915\u093E \u0921\u0947\u091F\u093E \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
    rainFromNode: "\u0907\u0938 \u0915\u094B\u0936\u093F\u0915\u093E \u0915\u094B \u0915\u0935\u0930 \u0915\u0930\u0928\u0947 \u0935\u093E\u0932\u0947 0.5\xB0 \u0935\u0930\u094D\u0937\u093E \u0928\u094B\u0921 \u0938\u0947"
  },
  factor: {
    slope: "\u0922\u0932\u093E\u0928",
    relief: "\u0938\u094D\u0925\u093E\u0928\u0940\u092F \u0909\u091A\u094D\u091A\u093E\u0935\u091A",
    elevation: "\u090A\u0901\u091A\u093E\u0908",
    stream: "\u091C\u0932\u0927\u093E\u0930\u093E \u0938\u0947 \u0928\u093F\u0915\u091F\u0924\u093E",
    road: "\u0938\u0921\u093C\u0915 \u0938\u0947 \u0926\u0942\u0930\u0940",
    intensity: "\u0935\u0930\u094D\u0937\u093E \u0924\u0940\u0935\u094D\u0930\u0924\u093E",
    antecedent: "\u092A\u0942\u0930\u094D\u0935\u0935\u0930\u094D\u0924\u0940 \u0928\u092E\u0940",
    slopeMean: "\u0914\u0938\u0924 \u0922\u0932\u093E\u0928",
    roughness: "\u0916\u0941\u0930\u0926\u0930\u093E\u092A\u0928",
    tpi: "\u0938\u094D\u0925\u0932\u093E\u0915\u0943\u0924\u093F\u0915 \u0938\u094D\u0925\u093F\u0924\u093F",
    curvature: "\u0935\u0915\u094D\u0930\u0924\u093E",
    aspect: "\u0926\u093F\u0936\u093E",
    village_distance: "\u092C\u0938\u094D\u0924\u0940 \u0915\u0940 \u0928\u093F\u0915\u091F\u0924\u093E"
  },
  priority: {
    title: "\u092A\u094D\u0930\u093E\u0925\u092E\u093F\u0915\u0924\u093E \u0915\u094D\u0937\u0947\u0924\u094D\u0930",
    subtitle: "\u0938\u091C\u0940\u0935 \u091C\u094B\u0916\u093F\u092E \u0905\u0928\u0941\u0938\u093E\u0930 \u0936\u0940\u0930\u094D\u0937 10",
    empty: "\u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u091F\u094D\u0930\u093F\u0917\u0930 \u092A\u0930 \u0915\u094B\u0908 \u092D\u0940 \u0915\u094B\u0936\u093F\u0915\u093E \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0936\u094D\u0930\u0947\u0923\u0940 \u0938\u0947 \u090A\u092A\u0930 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
    population: "\u091C\u0928."
  },
  alerts: {
    title: "\u091A\u0947\u0924\u093E\u0935\u0928\u093F\u092F\u093E\u0901",
    affected: "\u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u092F\u093E \u0928\u093F\u0937\u094D\u0915\u093E\u0938\u0928 \u0936\u094D\u0930\u0947\u0923\u0940 \u0915\u0947 \u0915\u094D\u0937\u0947\u0924\u094D\u0930",
    level: "\u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u0938\u094D\u0924\u0930",
    dispatch: "\u091C\u093F\u0932\u093E \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0915\u0915\u094D\u0937 \u0915\u094B \u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u092D\u0947\u091C\u0947\u0902",
    sending: "\u092D\u0947\u091C\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948\u2026",
    configure: "Telegram \u0915\u0949\u0928\u094D\u092B\u093C\u093F\u0917\u0930 \u0915\u0930\u0947\u0902",
    configureHint: "VITE_TELEGRAM_TOKEN \u0914\u0930 VITE_TELEGRAM_CHAT_ID \u0938\u0947\u091F \u0915\u0930\u0915\u0947 \u092A\u0941\u0928\u0903 \u092C\u093F\u0932\u094D\u0921 \u0915\u0930\u0947\u0902\u0964",
    log: "\u092A\u094D\u0930\u0947\u0937\u0923 \u0932\u0949\u0917",
    logEmpty: "\u0907\u0938 \u0938\u0924\u094D\u0930 \u092E\u0947\u0902 \u0915\u094B\u0908 \u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u0928\u0939\u0940\u0902 \u092D\u0947\u091C\u0940 \u0917\u0908\u0964",
    sent: "\u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0915\u0915\u094D\u0937 \u0924\u0915 \u092A\u0939\u0941\u0901\u091A \u0917\u0908",
    failed: "\u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u092D\u0947\u091C\u0928\u0947 \u092E\u0947\u0902 \u0935\u093F\u092B\u0932",
    none: "\u0907\u0938 \u0938\u092E\u092F \u0915\u094B\u0908 \u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u092F\u093E \u0928\u093F\u0937\u094D\u0915\u093E\u0938\u0928 \u0936\u094D\u0930\u0947\u0923\u0940 \u092E\u0947\u0902 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
    confirm: "\u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0915\u0915\u094D\u0937 \u0915\u094B \u092D\u0947\u091C\u0947\u0902?"
  },
  report: {
    fab: "\u0916\u0924\u0930\u0947 \u0915\u0940 \u0938\u0942\u091A\u0928\u093E \u0926\u0947\u0902",
    title: "\u0928\u093E\u0917\u0930\u093F\u0915 \u0916\u0924\u0930\u093E \u0938\u0942\u091A\u0928\u093E",
    photo: "\u092B\u093C\u094B\u091F\u094B",
    photoHint: "\u0915\u0948\u092E\u0930\u093E \u092F\u093E \u0917\u0948\u0932\u0930\u0940 \xB7 \u0935\u0948\u0915\u0932\u094D\u092A\u093F\u0915",
    photoRemove: "\u092B\u093C\u094B\u091F\u094B \u0939\u091F\u093E\u090F\u0901",
    location: "\u0938\u094D\u0925\u093E\u0928",
    useGps: "\u092E\u0947\u0930\u093E \u0938\u094D\u0925\u093E\u0928 \u0932\u0947\u0902",
    locating: "\u0938\u094D\u0925\u093E\u0928 \u092A\u0924\u093E \u0915\u093F\u092F\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948\u2026",
    gpsDenied: "\u0938\u094D\u0925\u093E\u0928 \u0915\u0940 \u0905\u0928\u0941\u092E\u0924\u093F \u0905\u0938\u094D\u0935\u0940\u0915\u0943\u0924 \u2014 \u0928\u093F\u0930\u094D\u0926\u0947\u0936\u093E\u0902\u0915 \u0938\u094D\u0935\u092F\u0902 \u092D\u0930\u0947\u0902\u0964",
    gpsUnavailable: "\u0938\u094D\u0925\u093E\u0928 \u0938\u0947\u0935\u093E \u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u0939\u0940\u0902 \u2014 \u0928\u093F\u0930\u094D\u0926\u0947\u0936\u093E\u0902\u0915 \u0938\u094D\u0935\u092F\u0902 \u092D\u0930\u0947\u0902\u0964",
    gpsOk: "\u0921\u093F\u0935\u093E\u0907\u0938 \u0938\u0947 \u0938\u094D\u0925\u093E\u0928 \u092A\u094D\u0930\u093E\u092A\u094D\u0924",
    lat: "\u0905\u0915\u094D\u0937\u093E\u0902\u0936",
    lon: "\u0926\u0947\u0936\u093E\u0902\u0924\u0930",
    type: "\u0905\u0935\u0932\u094B\u0915\u0928 \u0915\u093E \u092A\u094D\u0930\u0915\u093E\u0930",
    types: {
      crack: "\u091C\u093C\u092E\u0940\u0928 \u092E\u0947\u0902 \u0926\u0930\u093E\u0930",
      slope: "\u0922\u0932\u093E\u0928 \u0915\u093E \u0916\u093F\u0938\u0915\u0928\u093E",
      road: "\u0938\u0921\u093C\u0915 \u0905\u0935\u0930\u0941\u0926\u094D\u0927",
      seepage: "\u092A\u093E\u0928\u0940 \u0915\u093E \u0930\u093F\u0938\u093E\u0935",
      other: "\u0905\u0928\u094D\u092F"
    },
    description: "\u0935\u093F\u0935\u0930\u0923",
    descriptionPlaceholder: "\u0906\u092A\u0928\u0947 \u0915\u094D\u092F\u093E \u0926\u0947\u0916\u093E?",
    submit: "\u0938\u0942\u091A\u0928\u093E \u092D\u0947\u091C\u0947\u0902",
    submitted: "\u0938\u0942\u091A\u0928\u093E \u092E\u093E\u0928\u091A\u093F\u0924\u094D\u0930 \u092A\u0930 \u091C\u094B\u0921\u093C\u0940 \u0917\u0908",
    needLocation: "\u092E\u093E\u0928\u094D\u092F \u0905\u0915\u094D\u0937\u093E\u0902\u0936 \u0914\u0930 \u0926\u0947\u0936\u093E\u0902\u0924\u0930 \u0906\u0935\u0936\u094D\u092F\u0915 \u0939\u0948\u0902\u0964",
    sessionNote: "\u0938\u0942\u091A\u0928\u093E\u090F\u0901 \u0915\u0947\u0935\u0932 \u0907\u0938\u0940 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u0938\u0924\u094D\u0930 \u092E\u0947\u0902 \u0930\u0939\u0924\u0940 \u0939\u0948\u0902 \u2014 \u0915\u094B\u0908 \u0938\u0930\u094D\u0935\u0930 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
    reportedAt: "\u0938\u0942\u091A\u093F\u0924",
    markerTitle: "\u0928\u093E\u0917\u0930\u093F\u0915 \u0938\u0942\u091A\u0928\u093E"
  },
  sensor: {
    title: "\u0905\u0928\u0941\u0930\u0942\u092A\u093F\u0924 \u0938\u0902\u0935\u0947\u0926\u0915 \u0928\u094B\u0921 \u2014 \u0939\u093E\u0930\u094D\u0921\u0935\u0947\u092F\u0930 \u0935\u093F\u0915\u093E\u0938\u093E\u0927\u0940\u0928",
    node: "\u0928\u094B\u0921 HFL-01 \xB7 \u0939\u093E\u092B\u0932\u094B\u0902\u0917 \u0915\u091F\u0915",
    moisture: "\u092E\u0943\u0926\u093E \u0928\u092E\u0940",
    tilt: "\u091D\u0941\u0915\u093E\u0935 \u0915\u094B\u0923",
    battery: "\u092C\u0948\u091F\u0930\u0940",
    breach: "\u0938\u0940\u092E\u093E \u092A\u093E\u0930 \u0939\u0941\u0908",
    note: "\u092E\u093E\u0928 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u092E\u0947\u0902 \u0909\u0924\u094D\u092A\u0928\u094D\u0928 \u0939\u094B\u0924\u0947 \u0939\u0948\u0902 \u0914\u0930 \u0935\u0930\u094D\u0937\u093E \u0907\u0928\u092A\u0941\u091F \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u092C\u0926\u0932\u0924\u0947 \u0939\u0948\u0902\u0964"
  },
  method: {
    title: "\u0915\u093E\u0930\u094D\u092F\u092A\u094D\u0930\u0923\u093E\u0932\u0940",
    concept: "PAHARA \u091C\u094B\u0916\u093F\u092E \u0915\u0948\u0938\u0947 \u0906\u0901\u0915\u0924\u093E \u0939\u0948",
    conceptBody: "\u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932\u0924\u093E \u092D\u0942\u092D\u093E\u0917 \u0938\u0947 \u092A\u0939\u0932\u0947 \u0939\u0940 \u092A\u0930\u093F\u0915\u0932\u093F\u0924 \u0939\u0948 \u0914\u0930 \u092E\u094C\u0938\u092E \u0915\u0947 \u0938\u093E\u0925 \u0928\u0939\u0940\u0902 \u092C\u0926\u0932\u0924\u0940; \u092A\u094D\u0930\u092F\u0941\u0915\u094D\u0924 \u092A\u094D\u0930\u093E\u091A\u0932 \u0907\u0938 \u092B\u093C\u093E\u0907\u0932 \u0915\u0947 \u092E\u0947\u091F\u093E\u0921\u0947\u091F\u093E \u092E\u0947\u0902 \u0938\u0942\u091A\u0940\u092C\u0926\u094D\u0927 \u0939\u0948\u0902 \u0914\u0930 \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0915 \u092E\u0947\u0902 \u092A\u094D\u0930\u0924\u093F \u0915\u094B\u0936\u093F\u0915\u093E \u0926\u093F\u0916\u093E\u090F \u091C\u093E\u0924\u0947 \u0939\u0948\u0902\u0964 \u091F\u094D\u0930\u093F\u0917\u0930 \u0907\u0938\u0940 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u092E\u0947\u0902 \u0935\u0930\u094D\u0937\u093E \u0938\u0947 \u0938\u091C\u0940\u0935 \u092A\u0930\u093F\u0915\u0932\u093F\u0924 \u0939\u094B\u0924\u093E \u0939\u0948\u0964 \u092E\u093E\u0928\u091A\u093F\u0924\u094D\u0930 \u0926\u094B\u0928\u094B\u0902 \u0915\u093E \u0917\u0941\u0923\u0928\u092B\u0932 \u0926\u093F\u0916\u093E\u0924\u093E \u0939\u0948\u0964",
    generated: "\u0917\u094D\u0930\u093F\u0921 \u0928\u093F\u0930\u094D\u092E\u093E\u0923",
    methodUsed: "\u0938\u094D\u0915\u094B\u0930\u093F\u0902\u0917 \u092A\u0926\u094D\u0927\u0924\u093F",
    auc: "\u0938\u094D\u0925\u093E\u0928\u093F\u0915 \u092C\u094D\u0932\u0949\u0915 CV ROC-AUC",
    cells: "\u0917\u094D\u0930\u093F\u0921 \u092E\u0947\u0902 \u0915\u094B\u0936\u093F\u0915\u093E\u090F\u0901",
    sources: "\u0921\u0947\u091F\u093E \u0938\u094D\u0930\u094B\u0924",
    simulatedTitle: "\u0938\u0902\u0935\u0947\u0926\u0915 \u0921\u0947\u091F\u093E \u0905\u0928\u0941\u0930\u0942\u092A\u093F\u0924 \u0939\u0948",
    simulatedBody: "\u0938\u0902\u0935\u0947\u0926\u0915 \u0928\u094B\u0921 \u092A\u0948\u0928\u0932 \u0909\u0924\u094D\u092A\u0928\u094D\u0928 \u092E\u093E\u0928 \u0926\u093F\u0916\u093E\u0924\u093E \u0939\u0948, \u0915\u093F\u0938\u0940 \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0909\u092A\u0915\u0930\u0923 \u0915\u0947 \u092A\u093E\u0920\u094D\u092F\u093E\u0902\u0915 \u0928\u0939\u0940\u0902\u0964 \u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u0939\u093E\u0930\u094D\u0921\u0935\u0947\u092F\u0930 \u0935\u093F\u0915\u093E\u0938\u093E\u0927\u0940\u0928 \u0939\u0948\u0964",
    noMetadata: "\u0907\u0938 \u0917\u094D\u0930\u093F\u0921 \u092B\u093C\u093E\u0907\u0932 \u092E\u0947\u0902 \u092E\u0947\u091F\u093E\u0921\u0947\u091F\u093E \u0928\u0939\u0940\u0902 \u0939\u0948, \u0907\u0938\u0932\u093F\u090F \u0928\u093F\u0930\u094D\u092E\u093E\u0923 \u0935\u093F\u0935\u0930\u0923 \u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u0939\u0940\u0902\u0964 \u0911\u092B\u093C\u0932\u093E\u0907\u0928 \u092A\u093E\u0907\u092A\u0932\u093E\u0907\u0928 \u0938\u0947 \u0907\u0938\u0947 \u092A\u0941\u0928\u0903 \u092C\u0928\u093E\u090F\u0901\u0964",
    close: "\u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
    records: "\u092A\u094D\u0930\u092F\u0941\u0915\u094D\u0924 \u092D\u0942\u0938\u094D\u0916\u0932\u0928 \u0905\u092D\u093F\u0932\u0947\u0916",
    validation: "\u0938\u0924\u094D\u092F\u093E\u092A\u0928",
    aucSpatial: "\u0938\u094D\u0925\u093E\u0928\u093F\u0915-\u092C\u094D\u0932\u0949\u0915 CV ROC-AUC",
    aucRandom: "\u092F\u093E\u0926\u0943\u091A\u094D\u091B\u093F\u0915-\u0935\u093F\u092D\u093E\u091C\u0928 ROC-AUC",
    aucBaseline: "\u0932\u0949\u091C\u093F\u0938\u094D\u091F\u093F\u0915 \u0930\u093F\u0917\u094D\u0930\u0947\u0936\u0928 \u0906\u0927\u093E\u0930\u0930\u0947\u0916\u093E",
    aucNote: "\u092F\u093E\u0926\u0943\u091A\u094D\u091B\u093F\u0915 \u0935\u093F\u092D\u093E\u091C\u0928 \u0915\u093E \u0905\u0902\u0915 \u0905\u0927\u093F\u0915 \u0939\u0948 \u0915\u094D\u092F\u094B\u0902\u0915\u093F \u092A\u0921\u093C\u094B\u0938\u0940 \u0915\u094B\u0936\u093F\u0915\u093E\u090F\u0901 \u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930 \u0928\u0939\u0940\u0902 \u0939\u094B\u0924\u0940\u0902 \u2014 \u0915\u093F\u0938\u0940 \u0915\u094B\u0936\u093F\u0915\u093E \u0915\u0947 \u092A\u0921\u093C\u094B\u0938\u0940 \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u092B\u093C\u094B\u0932\u094D\u0921 \u092E\u0947\u0902 \u0930\u093F\u0938 \u091C\u093E\u0924\u0947 \u0939\u0948\u0902\u0964 \u0938\u094D\u0925\u093E\u0928\u093F\u0915-\u092C\u094D\u0932\u0949\u0915 \u0906\u0901\u0915\u0921\u093C\u093E \u092A\u0942\u0930\u0947 0.5\xB0 \u092C\u094D\u0932\u0949\u0915 \u0915\u094B \u092C\u093E\u0939\u0930 \u0930\u0916\u0924\u093E \u0939\u0948, \u0914\u0930 \u0935\u0939\u0940 \u0938\u0939\u0940 \u0939\u0948\u0964"
  },
  units: {
    mm: "\u092E\u093F\u092E\u0940",
    m: "\u092E\u0940",
    deg: "\xB0",
    volt: "\u0935\u094B",
    percent: "%",
    km: "\u0915\u093F\u092E\u0940"
  },
  common: {
    close: "\u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
    cancel: "\u0930\u0926\u094D\u0926 \u0915\u0930\u0947\u0902",
    dismiss: "\u0939\u091F\u093E\u090F\u0901",
    collapse: "\u0938\u092E\u0947\u091F\u0947\u0902",
    expand: "\u0935\u093F\u0938\u094D\u0924\u093E\u0930 \u0915\u0930\u0947\u0902"
  },
  search: {
    placeholder: "\u0917\u093E\u0901\u0935, \u0936\u0939\u0930 \u092F\u093E \u091C\u093C\u093F\u0932\u093E \u0916\u094B\u091C\u0947\u0902\u2026",
    clear: "\u0916\u094B\u091C \u0938\u093E\u092B\u093C \u0915\u0930\u0947\u0902",
    searching: "\u0916\u094B\u091C \u091C\u093E\u0930\u0940 \u0939\u0948\u2026",
    noResults: "\u0915\u094B\u0908 \u092E\u0947\u0932 \u0928\u0939\u0940\u0902\u0964 \u0926\u0942\u0938\u0930\u0940 \u0935\u0930\u094D\u0924\u0928\u0940 \u0906\u091C\u093C\u092E\u093E\u090F\u0901\u0964",
    suggestions: "\u0907\u0928\u092E\u0947\u0902 \u0938\u0947 \u0915\u094B\u0908 \u0906\u091C\u093C\u092E\u093E\u090F\u0901",
    recent: "\u0939\u093E\u0932 \u0915\u0940 \u0916\u094B\u091C",
    resultTitle: "\u0938\u094D\u0925\u093E\u0928 \u0906\u0915\u0932\u0928",
    liveRisk: "\u0938\u091C\u0940\u0935 \u091C\u094B\u0916\u093F\u092E",
    staticSusceptibility: "\u0938\u094D\u0925\u093F\u0930 \u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932\u0924\u093E",
    outsideRegion: "\u0928\u093F\u0917\u0930\u093E\u0928\u0940 \u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u0938\u0947 \u092C\u093E\u0939\u0930\u0964 PAHARA \u0905\u092D\u0940 \u0906\u0920 \u092A\u0942\u0930\u094D\u0935\u094B\u0924\u094D\u0924\u0930 \u0930\u093E\u091C\u094D\u092F\u094B\u0902 \u0915\u094B \u0915\u0935\u0930 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
    unmonitored: "\u0907\u0938 \u0938\u094D\u0925\u093E\u0928 \u0915\u0947 \u092A\u093E\u0938 \u0915\u094B\u0908 \u092E\u0949\u0921\u0932 \u0915\u0940 \u0917\u0908 \u0922\u0932\u093E\u0928 \u0928\u0939\u0940\u0902\u0964 3\xB0 \u0938\u0947 \u0915\u092E \u0915\u094B\u0936\u093F\u0915\u093E\u090F\u0901 \u0936\u093E\u092E\u093F\u0932 \u0928\u0939\u0940\u0902 \u0939\u0948\u0902\u0964",
    unmonitoredNear: "\u0907\u0938 \u0938\u094D\u0925\u093E\u0928 \u0915\u0947 \u092A\u093E\u0938 \u0915\u094B\u0908 \u092E\u0949\u0921\u0932 \u0915\u0940 \u0917\u0908 \u0922\u0932\u093E\u0928 \u0928\u0939\u0940\u0902 \u2014 \u0928\u093F\u0915\u091F\u0924\u092E {{km}} \u0915\u093F\u092E\u0940 \u0926\u0942\u0930 \u0939\u0948\u0964 3\xB0 \u0938\u0947 \u0915\u092E \u0915\u094B\u0936\u093F\u0915\u093E\u090F\u0901 \u0936\u093E\u092E\u093F\u0932 \u0928\u0939\u0940\u0902 \u0939\u0948\u0902\u0964",
    nearestCell: "\u0928\u093F\u0915\u091F\u0924\u092E \u0928\u093F\u0917\u0930\u093E\u0928\u0940 \u0915\u094B\u0936\u093F\u0915\u093E {{km}} \u0915\u093F\u092E\u0940 \u0926\u0942\u0930\u0964 \u092F\u0939 \u0930\u0947\u091F\u093F\u0902\u0917 \u0909\u0938\u0940 \u0915\u094B\u0936\u093F\u0915\u093E \u0915\u0940 \u0939\u0948, \u092C\u0938\u094D\u0924\u0940 \u0915\u0940 \u0928\u0939\u0940\u0902\u0964",
    higherRisk: "\u0928\u093F\u0915\u091F\u0924\u092E \u0909\u091A\u094D\u091A-\u091C\u094B\u0916\u093F\u092E \u0915\u094D\u0937\u0947\u0924\u094D\u0930: {{km}} \u0915\u093F\u092E\u0940 {{dir}} ({{cls}})\u0964 \u092C\u093E\u0939\u0930 \u091C\u093E\u0928\u0947 \u0915\u093E \u092E\u093E\u0930\u094D\u0917 \u0906\u092A\u0915\u0947 \u0938\u094D\u0925\u093E\u0928 \u0938\u0947 \u0905\u0927\u093F\u0915 \u0916\u0924\u0930\u0928\u093E\u0915 \u0939\u094B \u0938\u0915\u0924\u093E \u0939\u0948\u0964",
    noRiskData: "\u092A\u093E\u0938 \u0915\u094B\u0908 \u092E\u0949\u0921\u0932 \u0915\u0940 \u0917\u0908 \u0922\u0932\u093E\u0928 \u0928\u0939\u0940\u0902",
    fromGeocoder: "\u092E\u093E\u0928\u091A\u093F\u0924\u094D\u0930 \u0916\u094B\u091C \u0938\u0947",
    unknownArea: "\u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u0905\u091C\u094D\u091E\u093E\u0924",
    populationUnknown: "\u0926\u0930\u094D\u091C \u0928\u0939\u0940\u0902"
  },
  plain: {
    title: "\u0915\u094D\u092F\u093E \u092E\u0947\u0930\u0947 \u092A\u093E\u0938 \u092D\u0942\u0938\u094D\u0916\u0932\u0928 \u0915\u0940 \u0906\u0936\u0902\u0915\u093E \u0939\u0948?",
    searchLabel: "\u0905\u092A\u0928\u093E \u0917\u093E\u0901\u0935 \u092F\u093E \u0936\u0939\u0930 \u0916\u094B\u091C\u0947\u0902",
    searchHint: "\u092A\u0942\u0930\u094D\u0935\u094B\u0924\u094D\u0924\u0930 \u0915\u093E \u0915\u094B\u0908 \u0938\u094D\u0925\u093E\u0928 \u0932\u093F\u0916\u0947\u0902",
    emptyTitle: "\u0905\u092A\u0928\u093E \u0917\u093E\u0901\u0935 \u0916\u094B\u091C\u0947\u0902",
    emptyBody: "PAHARA \u092C\u0924\u093E\u0924\u093E \u0939\u0948 \u0915\u093F \u0906\u091C \u0915\u093F\u0938\u0940 \u0938\u094D\u0925\u093E\u0928 \u0915\u0947 \u092A\u093E\u0938 \u092D\u0942\u0938\u094D\u0916\u0932\u0928 \u0915\u0940 \u0906\u0936\u0902\u0915\u093E \u0939\u0948 \u092F\u093E \u0928\u0939\u0940\u0902 \u2014 \u091C\u092E\u0940\u0928 \u0915\u0940 \u0922\u0932\u093E\u0928 \u0914\u0930 \u0909\u0938 \u092A\u0930 \u0939\u0941\u0908 \u092C\u093E\u0930\u093F\u0936 \u0938\u0947\u0964",
    emptyTry: "\u0907\u0928\u092E\u0947\u0902 \u0938\u0947 \u0915\u094B\u0908 \u0906\u091C\u093C\u092E\u093E\u090F\u0901",
    whyTitle: "\u0915\u094D\u092F\u094B\u0902",
    doTitle: "\u0915\u094D\u092F\u093E \u0915\u0930\u0947\u0902",
    adviceNote: "\u092F\u0939 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0938\u0932\u093E\u0939 \u0939\u0948, \u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u0928\u093F\u0915\u093E\u0938\u0940 \u0906\u0926\u0947\u0936 \u0928\u0939\u0940\u0902\u0964 \u0939\u092E\u0947\u0936\u093E \u0905\u092A\u0928\u0947 \u091C\u093F\u0932\u093E \u092A\u094D\u0930\u0936\u093E\u0938\u0928 \u0914\u0930 NDMA \u0915\u093E \u092A\u093E\u0932\u0928 \u0915\u0930\u0947\u0902\u0964",
    higherNear: "\u092F\u0939\u093E\u0901 \u0938\u0947 {{km}} \u0915\u093F\u092E\u0940 {{dir}} \u092E\u0947\u0902 \u0905\u0927\u093F\u0915 \u0916\u0924\u0930\u093E\u0964 \u0906\u092A\u0915\u093E \u0918\u0930 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0939\u094B \u0938\u0915\u0924\u093E \u0939\u0948, \u092A\u0930 \u092C\u093E\u0939\u0930 \u091C\u093E\u0928\u0947 \u0915\u093E \u0930\u093E\u0938\u094D\u0924\u093E \u0928\u0939\u0940\u0902\u0964",
    distantCell: "\u0938\u092C\u0938\u0947 \u0928\u091C\u093C\u0926\u0940\u0915\u0940 \u092E\u0949\u0921\u0932 \u0915\u0940 \u0917\u0908 \u0922\u0932\u093E\u0928 {{km}} \u0915\u093F\u092E\u0940 \u0926\u0942\u0930 \u0939\u0948, \u0907\u0938\u0932\u093F\u090F \u092F\u0939 \u0928\u091C\u093C\u0926\u0940\u0915\u0940 \u092A\u093E\u0920 \u0939\u0948, \u0920\u0940\u0915 \u0907\u0938\u0940 \u091C\u0917\u0939 \u0915\u093E \u0928\u0939\u0940\u0902\u0964",
    nodataTitle: "\u0907\u0938 \u0938\u094D\u0925\u093E\u0928 \u0915\u0947 \u0932\u093F\u090F \u0922\u0932\u093E\u0928 \u0915\u093E \u0921\u0947\u091F\u093E \u0928\u0939\u0940\u0902",
    nodataBody: "{{name}} \u0915\u0947 \u092A\u093E\u0938 \u0915\u094B\u0908 \u092E\u0949\u0921\u0932 \u0915\u0940 \u0917\u0908 \u092A\u0939\u093E\u0921\u093C\u0940 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964 \u0907\u0938\u0915\u093E \u0905\u0930\u094D\u0925 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0939\u094B\u0928\u093E \u0928\u0939\u0940\u0902 \u2014 \u092E\u0949\u0921\u0932 \u0915\u0947 \u092A\u093E\u0938 \u092F\u0939\u093E\u0901 \u0915\u0939\u0928\u0947 \u0915\u094B \u0915\u0941\u091B \u0928\u0939\u0940\u0902 \u0939\u0948\u0964 \u0918\u093E\u091F\u0940 \u0915\u0947 \u0915\u0908 \u0915\u0938\u094D\u092C\u0947 \u0907\u0938\u0940 \u0938\u094D\u0925\u093F\u0924\u093F \u092E\u0947\u0902 \u0939\u0948\u0902\u0964",
    outsideTitle: "\u0915\u0935\u0930 \u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u0938\u0947 \u092C\u093E\u0939\u0930",
    outsideBody: "PAHARA \u0905\u092D\u0940 \u092D\u093E\u0930\u0924 \u0915\u0947 \u0906\u0920 \u092A\u0942\u0930\u094D\u0935\u094B\u0924\u094D\u0924\u0930 \u0930\u093E\u091C\u094D\u092F\u094B\u0902 \u0915\u094B \u0915\u0935\u0930 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
    rainTitle: "\u092F\u0939\u093E\u0901 \u092C\u093E\u0930\u093F\u0936",
    rainToday: "\u092A\u093F\u091B\u0932\u0947 24 \u0918\u0902\u091F\u0947",
    rainWeek: "\u092A\u093F\u091B\u0932\u0947 7 \u0926\u093F\u0928",
    showNumbers: "\u0906\u0902\u0915\u0921\u093C\u0947 \u0926\u093F\u0916\u093E\u090F\u0901",
    hideNumbers: "\u0906\u0902\u0915\u0921\u093C\u0947 \u091B\u093F\u092A\u093E\u090F\u0901",
    numbersNote: "\u0916\u0924\u0930\u093E = \u091C\u092E\u0940\u0928 \u0915\u093F\u0924\u0928\u0940 \u0922\u0932\u0935\u093E\u0901 \u0914\u0930 \u0916\u093F\u0938\u0915\u0928\u0947 \u0932\u093E\u092F\u0915 \u0939\u0948, \u0917\u0941\u0923\u093E \u0935\u0939 \u0915\u093F\u0924\u0928\u0940 \u0917\u0940\u0932\u0940 \u0939\u0948\u0964 \u0905\u0915\u0947\u0932\u0947 \u0915\u094B\u0908 \u090F\u0915 \u0916\u0924\u0930\u093E \u0928\u0939\u0940\u0902\u0964",
    numbersSlope: "\u0922\u0932\u093E\u0928 \u0915\u093E \u0916\u0924\u0930\u093E",
    numbersRain: "\u0905\u092C \u092C\u093E\u0930\u093F\u0936",
    numbersRisk: "\u0906\u091C \u0915\u093E \u0916\u0924\u0930\u093E",
    reportCta: "\u092D\u0942\u0938\u094D\u0916\u0932\u0928 \u0915\u0940 \u0938\u0942\u091A\u0928\u093E \u0926\u0947\u0902",
    detailsCta: "\u092A\u0942\u0930\u093E \u0921\u0948\u0936\u092C\u094B\u0930\u094D\u0921 \u0916\u094B\u0932\u0947\u0902",
    mapHint: "\u0915\u0939\u0940\u0902 \u0914\u0930 \u0926\u0947\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0928\u0915\u094D\u0936\u0947 \u092A\u0930 \u091F\u0948\u092A \u0915\u0930\u0947\u0902\u0964",
    level: {
      Safe: {
        headline: "\u0906\u091C \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924",
        summary: "\u0907\u0938 \u0938\u092E\u092F \u0907\u0938 \u0938\u094D\u0925\u093E\u0928 \u0915\u0947 \u092A\u093E\u0938 \u092D\u0942\u0938\u094D\u0916\u0932\u0928 \u0915\u0940 \u0906\u0936\u0902\u0915\u093E \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
        do1: "\u0906\u091C \u0915\u0941\u091B \u0915\u0930\u0928\u0947 \u0915\u0940 \u091C\u093C\u0930\u0942\u0930\u0924 \u0928\u0939\u0940\u0902\u0964",
        do2: "\u0924\u0947\u091C\u093C \u092C\u093E\u0930\u093F\u0936 \u0936\u0941\u0930\u0942 \u0939\u094B \u0924\u094B \u092B\u093F\u0930 \u0926\u0947\u0916\u0947\u0902\u0964",
        do3: "\u092C\u093E\u0939\u0930 \u0928\u093F\u0915\u0932\u0928\u0947 \u0915\u093E \u0930\u093E\u0938\u094D\u0924\u093E \u092A\u0924\u093E \u0930\u0916\u0947\u0902\u0964"
      },
      Watch: {
        headline: "\u0938\u0924\u0930\u094D\u0915 \u0930\u0939\u0947\u0902",
        summary: "\u092F\u0939\u093E\u0901 \u0939\u093E\u0932\u093E\u0924 \u092C\u0926\u0932 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964 \u0928\u091C\u093C\u0930 \u0930\u0916\u0947\u0902\u0964",
        do1: "\u0905\u0917\u0932\u0947 \u0926\u093F\u0928 \u0915\u0940 \u092C\u093E\u0930\u093F\u0936 \u092A\u0930 \u0928\u091C\u093C\u0930 \u0930\u0916\u0947\u0902\u0964",
        do2: "\u092B\u093C\u094B\u0928 \u091A\u093E\u0930\u094D\u091C \u0930\u0916\u0947\u0902 \u0914\u0930 \u092F\u0939 \u092A\u0947\u091C \u0938\u0947\u0935 \u0915\u0930\u0947\u0902\u0964",
        do3: "\u092A\u0930\u093F\u0935\u093E\u0930 \u0915\u0947 \u0938\u093E\u0925 \u0924\u092F \u0915\u0930\u0947\u0902 \u0915\u093F \u0915\u0939\u093E\u0901 \u091C\u093E\u0928\u093E \u0939\u0948\u0964"
      },
      Warning: {
        headline: "\u0916\u0924\u0930\u093E \u2014 \u091C\u093E\u0928\u0947 \u0915\u0940 \u0924\u0948\u092F\u093E\u0930\u0940 \u0930\u0916\u0947\u0902",
        summary: "\u0907\u0938 \u0938\u094D\u0925\u093E\u0928 \u0915\u0947 \u092A\u093E\u0938 \u092D\u0942\u0938\u094D\u0916\u0932\u0928 \u0939\u094B \u0938\u0915\u0924\u093E \u0939\u0948\u0964 \u0928\u093F\u0915\u0932\u0928\u0947 \u0915\u0940 \u0924\u0948\u092F\u093E\u0930\u0940 \u0915\u0930\u0947\u0902\u0964",
        do1: "\u0915\u093E\u0917\u091C\u093C, \u0926\u0935\u093E\u0908 \u0914\u0930 \u091F\u0949\u0930\u094D\u091A \u0905\u092D\u0940 \u0930\u0916 \u0932\u0947\u0902\u0964",
        do2: "\u0922\u0932\u0935\u093E\u0902 \u0922\u0932\u093E\u0928\u094B\u0902 \u0914\u0930 \u092A\u0939\u093E\u0921\u093C \u0915\u093E\u091F\u0915\u0930 \u092C\u0928\u0940 \u0938\u0921\u093C\u0915\u094B\u0902 \u0938\u0947 \u092C\u091A\u0947\u0902\u0964",
        do3: "\u092A\u0921\u093C\u094B\u0938\u093F\u092F\u094B\u0902 \u0915\u094B \u092C\u0924\u093E\u090F\u0901, \u0916\u093E\u0938\u0915\u0930 \u091C\u094B \u091A\u0932 \u0928\u0939\u0940\u0902 \u0938\u0915\u0924\u0947\u0964"
      },
      Evacuate: {
        headline: "\u0905\u092D\u0940 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u091C\u0917\u0939 \u091C\u093E\u090F\u0901",
        summary: "\u0907\u0938 \u0938\u094D\u0925\u093E\u0928 \u0915\u0947 \u092A\u093E\u0938 \u092D\u0942\u0938\u094D\u0916\u0932\u0928 \u0915\u0940 \u092A\u094D\u0930\u092C\u0932 \u0906\u0936\u0902\u0915\u093E \u0939\u0948\u0964 \u0907\u0902\u0924\u091C\u093C\u093E\u0930 \u0928 \u0915\u0930\u0947\u0902\u0964",
        do1: "\u0922\u0932\u093E\u0928\u094B\u0902 \u0938\u0947 \u0926\u0942\u0930 \u0938\u092E\u0924\u0932, \u0916\u0941\u0932\u0940 \u091C\u0917\u0939 \u091C\u093E\u090F\u0901\u0964",
        do2: "\u092A\u0939\u093E\u0921\u093C \u0915\u093E\u091F\u0915\u0930 \u092C\u0928\u0940 \u0938\u0921\u093C\u0915\u094B\u0902 \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0928 \u0915\u0930\u0947\u0902\u0964",
        do3: "\u0917\u094D\u0930\u093E\u092E \u092A\u094D\u0930\u0927\u093E\u0928 \u092F\u093E \u091C\u093F\u0932\u093E \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0915\u0915\u094D\u0937 \u0915\u094B \u092B\u093C\u094B\u0928 \u0915\u0930\u0947\u0902\u0964"
      }
    },
    reason: {
      steepWet: "\u092F\u0939 \u0922\u0932\u0935\u093E\u0902 \u0914\u0930 \u0916\u093F\u0938\u0915\u0928\u0947 \u0932\u093E\u092F\u0915 \u092A\u0939\u093E\u0921\u093C \u0939\u0948, \u0914\u0930 \u0924\u0947\u091C\u093C \u092C\u093E\u0930\u093F\u0936 \u0939\u0941\u0908 \u0939\u0948\u0964",
      steepDry: "\u092F\u0939\u093E\u0901 \u0915\u0940 \u092A\u0939\u093E\u0921\u093C\u0940 \u0916\u093F\u0938\u0915 \u0938\u0915\u0924\u0940 \u0939\u0948, \u092A\u0930 \u092C\u093E\u0930\u093F\u0936 \u0915\u092E \u0939\u0941\u0908 \u0939\u0948\u0964 \u092D\u0942\u0938\u094D\u0916\u0932\u0928 \u092C\u093E\u0930\u093F\u0936 \u0938\u0947 \u0936\u0941\u0930\u0942 \u0939\u094B\u0924\u093E \u0939\u0948\u0964",
      gentleWet: "\u0924\u0947\u091C\u093C \u092C\u093E\u0930\u093F\u0936 \u0939\u0941\u0908 \u0939\u0948, \u092A\u0930 \u092F\u0939\u093E\u0901 \u0915\u0940 \u091C\u092E\u0940\u0928 \u0907\u0924\u0928\u0940 \u0922\u0932\u0935\u093E\u0902 \u0928\u0939\u0940\u0902 \u0915\u093F \u0906\u0938\u093E\u0928\u0940 \u0938\u0947 \u0916\u093F\u0938\u0915\u0947\u0964",
      gentleDry: "\u092F\u0939\u093E\u0901 \u0915\u0940 \u091C\u092E\u0940\u0928 \u0922\u0932\u0935\u093E\u0902 \u0928\u0939\u0940\u0902 \u0939\u0948, \u0914\u0930 \u092C\u093E\u0930\u093F\u0936 \u092D\u0940 \u0915\u092E \u0939\u0941\u0908 \u0939\u0948\u0964"
    }
  },
  welcome: {
    title: "PAHARA \u092E\u0947\u0902 \u0906\u092A\u0915\u093E \u0938\u094D\u0935\u093E\u0917\u0924 \u0939\u0948",
    subtitle: "\u092A\u0942\u0930\u094D\u0935\u094B\u0924\u094D\u0924\u0930 \u092D\u093E\u0930\u0924 \u0915\u0947 \u0932\u093F\u090F \u092D\u0942\u0938\u094D\u0916\u0932\u0928 \u091A\u0947\u0924\u093E\u0935\u0928\u0940",
    s1Title: "\u0905\u092A\u0928\u093E \u0917\u093E\u0901\u0935 \u0916\u094B\u091C\u0947\u0902",
    s1Body: "\u0938\u094D\u0925\u093E\u0928 \u0915\u093E \u0928\u093E\u092E \u0932\u093F\u0916\u0947\u0902 \u0914\u0930 \u0926\u0947\u0916\u0947\u0902 \u0915\u093F \u0906\u091C \u0935\u0939\u093E\u0901 \u092D\u0942\u0938\u094D\u0916\u0932\u0928 \u0915\u0940 \u0906\u0936\u0902\u0915\u093E \u0939\u0948 \u092F\u093E \u0928\u0939\u0940\u0902\u0964",
    s2Title: "\u092D\u0942\u0938\u094D\u0916\u0932\u0928 \u0926\u094B \u091A\u0940\u091C\u093C\u094B\u0902 \u0938\u0947 \u0939\u094B\u0924\u093E \u0939\u0948",
    s2Body: "\u0916\u093F\u0938\u0915\u0928\u0947 \u0932\u093E\u092F\u0915 \u0922\u0932\u093E\u0928, \u0914\u0930 \u0909\u0938\u0947 \u0936\u0941\u0930\u0942 \u0915\u0930\u0928\u0947 \u0932\u093E\u092F\u0915 \u092C\u093E\u0930\u093F\u0936\u0964 \u0905\u0915\u0947\u0932\u0947 \u0915\u094B\u0908 \u090F\u0915 \u0916\u0924\u0930\u093E \u0928\u0939\u0940\u0902 \u2014 PAHARA \u0926\u094B\u0928\u094B\u0902 \u0926\u0947\u0916\u0924\u093E \u0939\u0948\u0964",
    s3Title: "\u0930\u0902\u0917 \u0915\u093E \u092E\u0924\u0932\u092C \u0915\u093E\u0930\u094D\u0930\u0935\u093E\u0908",
    s3Body: "\u0939\u0930\u093E \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924, \u092A\u0940\u0932\u093E \u0938\u0924\u0930\u094D\u0915 \u0930\u0939\u0947\u0902, \u0928\u093E\u0930\u0902\u0917\u0940 \u0924\u0948\u092F\u093E\u0930 \u0930\u0939\u0947\u0902, \u0932\u093E\u0932 \u0905\u092D\u0940 \u0928\u093F\u0915\u0932\u0947\u0902\u0964",
    start: "\u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902",
    skip: "\u091B\u094B\u0921\u093C\u0947\u0902",
    reopen: "\u092F\u0939 \u0906\u092A \u0938\u0939\u093E\u092F\u0924\u093E \u0906\u0907\u0915\u0928 \u0938\u0947 \u092B\u093F\u0930 \u0926\u0947\u0916 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964"
  }
};

// src/i18n/locales/as.json
var as_default = {
  app: {
    title: "PAHARA",
    subtitle: "\u09AC\u09BF\u09AA\u09A6 \u09AE\u09C2\u09B2\u09CD\u09AF\u09BE\u09AF\u09BC\u09A8 \u0986\u09F0\u09C1 \u09A6\u09CD\u09F0\u09C1\u09A4 \u09B8\u09A4\u09F0\u09CD\u0995\u09AC\u09BE\u09A3\u09C0\u09F0 \u09AC\u09BE\u09AC\u09C7 \u09AA\u09C2\u09F0\u09CD\u09AC\u09BE\u09A8\u09C1\u09AE\u09BE\u09A8 \u09AC\u09BF\u09B6\u09CD\u09B2\u09C7\u09B7\u09A3 \u2014 \u0989\u09A4\u09CD\u09A4\u09F0-\u09AA\u09C2\u09F0\u09CD\u09AC \u09AD\u09BE\u09F0\u09A4",
    sih: "SIH 2026 \xB7 SIH26001",
    loading: "\u09AC\u09BF\u09AA\u09A6 \u0997\u09CD\u09F0\u09BF\u09A1 \u09B2'\u09A1 \u09B9\u09C8 \u0986\u099B\u09C7\u2026",
    loadError: "\u09AC\u09BF\u09AA\u09A6 \u0997\u09CD\u09F0\u09BF\u09A1 \u09B2'\u09A1 \u0995\u09F0\u09BF\u09AC \u09AA\u09F0\u09BE \u09A8\u0997'\u09B2",
    loadErrorHint: "risk_grid.geojson \u09AB\u09BE\u0987\u09B2\u099F\u09CB public \u09AB\u09CB\u09B2\u09CD\u09A1\u09BE\u09F0\u09A4 \u09A5\u09BE\u0995\u09BF\u09AC \u09B2\u09BE\u0997\u09BF\u09AC\u0964",
    retry: "\u09AA\u09C1\u09A8\u09F0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09F0\u0995"
  },
  status: {
    online: "\u0985\u09A8\u09B2\u09BE\u0987\u09A8",
    offline: "\u0985\u09AB\u09B2\u09BE\u0987\u09A8",
    offlineNote: "\u09B8\u0982\u09F0\u0995\u09CD\u09B7\u09BF\u09A4 \u09A4\u09A5\u09CD\u09AF"
  },
  header: {
    modeLabel: "\u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09F0 \u09B8\u09CD\u09A4\u09F0",
    modeSusceptibility: "\u09B8\u0982\u09AC\u09C7\u09A6\u09A8\u09B6\u09C0\u09B2\u09A4\u09BE",
    modeRisk: "\u099A\u09B2\u09BF\u09A4 \u09AC\u09BF\u09AA\u09A6",
    methodology: "\u09AA\u09A6\u09CD\u09A7\u09A4\u09BF",
    language: "\u09AD\u09BE\u09B7\u09BE",
    viewLabel: "\u09A6\u09C3\u09B6\u09CD\u09AF",
    viewSimple: "\u09B8\u09B0\u09B2",
    viewDetailed: "\u09AC\u09BF\u09B6\u09A6",
    viewSimpleTitle: "\u09B8\u09B0\u09B2 \u09AD\u09BE\u09B7\u09BE, \u098F\u0995\u09C7\u09B8\u09AE\u09AF\u09BC\u09A4 \u098F\u0996\u09A8 \u09A0\u09BE\u0987",
    viewDetailedTitle: "\u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3 \u0985\u09AA\u09BE\u09B0\u09C7\u099F\u09B0 \u09A1\u09C7\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1",
    help: "\u09B8\u09B9\u09BE\u09AF\u09BC"
  },
  legend: {
    susceptibility: "\u09B8\u0982\u09AC\u09C7\u09A6\u09A8\u09B6\u09C0\u09B2\u09A4\u09BE (\u09B8\u09CD\u09A5\u09BF\u09F0)",
    liveRisk: "\u099A\u09B2\u09BF\u09A4 \u09AC\u09BF\u09AA\u09A6",
    formula: "\u09AC\u09BF\u09AA\u09A6 = \u09B8\u0982\u09AC\u09C7\u09A6\u09A8\u09B6\u09C0\u09B2\u09A4\u09BE \xD7 \u099F\u09CD\u09F0\u09BF\u0997\u09BE\u09F0\u0964 \u09AC\u09F0\u09CD\u09A4\u09AE\u09BE\u09A8 \u099F\u09CD\u09F0\u09BF\u0997\u09BE\u09F0:",
    staticNote: "\u09AD\u09C2-\u09AA\u09CD\u09F0\u0995\u09C3\u09A4\u09BF\u09F0 \u09AA\u09F0\u09BE \u0986\u0997\u09A4\u09C7\u0987 \u0997\u09A3\u09A8\u09BE \u0995\u09F0\u09BE\u0964 \u09AC\u09A4\u09F0\u09F0 \u09B2\u0997\u09A4 \u09B8\u09B2\u09A8\u09BF \u09A8\u09B9\u09AF\u09BC\u0964"
  },
  suscept: {
    "Very Low": "\u0985\u09A4\u09BF \u0995\u09AE",
    Low: "\u0995\u09AE",
    Moderate: "\u09AE\u09A7\u09CD\u09AF\u09AE",
    High: "\u0989\u099A\u09CD\u099A",
    "Very High": "\u0985\u09A4\u09BF \u0989\u099A\u09CD\u099A"
  },
  risk: {
    Safe: "\u09A8\u09BF\u09F0\u09BE\u09AA\u09A6",
    Watch: "\u09A8\u09BF\u09F0\u09C0\u0995\u09CD\u09B7\u09A3",
    Warning: "\u09B8\u09A4\u09F0\u09CD\u0995\u09AC\u09BE\u09A3\u09C0",
    Evacuate: "\u09B8\u09CD\u09A5\u09BE\u09A8\u09BE\u09A8\u09CD\u09A4\u09F0"
  },
  rain: {
    title: "\u09AC\u09F0\u09B7\u09C1\u09A3 \u0986\u09F0\u09C1 \u099F\u09CD\u09F0\u09BF\u0997\u09BE\u09F0",
    rain24h: "\u09E8\u09EA \u0998\u09A3\u09CD\u099F\u09BE\u09F0 \u09AC\u09F0\u09B7\u09C1\u09A3",
    rain7d: "\u09ED \u09A6\u09BF\u09A8\u09F0 \u09AA\u09C2\u09F0\u09CD\u09AC\u09F1\u09F0\u09CD\u09A4\u09C0 \u09AC\u09F0\u09B7\u09C1\u09A3",
    fetch: "\u099A\u09B2\u09BF\u09A4 \u09AC\u09F0\u09B7\u09C1\u09A3\u09F0 \u09A4\u09A5\u09CD\u09AF \u0986\u09A8\u0995",
    fetching: "\u0985\u09A8\u09BE \u09B9\u09C8 \u0986\u099B\u09C7\u2026",
    live: "\u099A\u09B2\u09BF\u09A4",
    simulated: "\u0985\u09A8\u09C1\u0995\u09C3\u09A4",
    trigger: "\u099F\u09CD\u09F0\u09BF\u0997\u09BE\u09F0",
    liveNote: "Open-Meteo \xB7 25.4\xB0N 93.0\xB0E \u09A4 \u09AF\u09CB\u09F1\u09BE \u09E8\u09EA \u0986\u09F0\u09C1 \u09E7\u09EC\u09EE \u0998\u09A3\u09CD\u099F\u09BE",
    simNote: "\u09B9\u09BE\u09A4\u09C7\u09F0\u09C7 \u09A8\u09BF\u09F0\u09CD\u09A7\u09BE\u09F0\u09BF\u09A4 \u2014 \u09AA\u09F0\u09BF\u09B8\u09CD\u09A5\u09BF\u09A4\u09BF \u0985\u09A8\u09C1\u0995\u09F0\u09A3",
    error: "Open-Meteo \u09F0 \u09B8\u09C8\u09A4\u09C7 \u09B8\u0982\u09AF\u09CB\u0997 \u09B9\u09CB\u09F1\u09BE \u09A8\u09BE\u0987",
    intensity: "\u09A4\u09C0\u09AC\u09CD\u09F0\u09A4\u09BE",
    antecedent: "\u09AA\u09C2\u09F0\u09CD\u09AC\u09F1\u09F0\u09CD\u09A4\u09C0",
    weights: "0.65 \xD7 \u09A4\u09C0\u09AC\u09CD\u09F0\u09A4\u09BE + 0.35 \xD7 \u09AA\u09C2\u09F0\u09CD\u09AC\u09F1\u09F0\u09CD\u09A4\u09C0",
    nodes: "0.5\xB0 \u099C\u09BE\u09B2\u09BF\u0995\u09BE\u09A4 {{count}} \u09AC\u09F0\u09B7\u09C1\u09A3 \u09A8\u09CB\u09A1",
    lead: "\u09AA\u09C2\u09F0\u09CD\u09AC\u09BE\u09A8\u09C1\u09AE\u09BE\u09A8\u09F0 \u0986\u0997\u09A4\u09C0\u09AF\u09BC\u09BE \u09B8\u09AE\u09AF\u09BC",
    leadNow: "\u098F\u09A4\u09BF\u09AF\u09BC\u09BE",
    leadWindow: "\u09B8\u09AE\u09AF\u09BC\u09B8\u09C0\u09AE\u09BE \u09B6\u09C7\u09B7 {{time}}",
    leadObserved: "\u09AC\u09F0\u09CD\u09A4\u09AE\u09BE\u09A8 \u0998\u09A3\u09CD\u099F\u09BE\u09B2\u09C8\u0995\u09C7 \u099C\u09CB\u0996\u09BE \u09AC\u09F0\u09B7\u09C1\u09A3\u0964",
    leadForecast: "\u098F\u09A4\u09BF\u09AF\u09BC\u09BE\u09F0 \u09AA\u09F0\u09BE {{hours}} \u0998\u09A3\u09CD\u099F\u09BE \u09AA\u09BF\u099B\u09F0 \u09AC\u09F0\u09B7\u09C1\u09A3 \u2014 \u0986\u0982\u09B6\u09BF\u0995\u09AD\u09BE\u09F1\u09C7 \u09AA\u09C2\u09F0\u09CD\u09AC\u09BE\u09A8\u09C1\u09AE\u09BE\u09A8\u0964",
    leadNeedsLive: "\u0986\u0997\u09B2\u09C8 \u099A\u09BE\u09AC\u09B2\u09C8 \u09AA\u09CD\u09F0\u09A4\u09CD\u09AF\u0995\u09CD\u09B7 \u09AC\u09F0\u09B7\u09C1\u09A3 \u0986\u09A8\u0995\u0964 \u09B8\u09CD\u09B2\u09BE\u0987\u09A1\u09BE\u09F0 \u09AA\u09F0\u09BF\u09B8\u09CD\u09A5\u09BF\u09A4\u09BF\u09F0 \u0995\u09CB\u09A8\u09CB \u0998\u09A1\u09BC\u09C0 \u09A8\u09BE\u0987\u0964",
    leadTruncated: "\u09AA\u09C2\u09F0\u09CD\u09AC\u09BE\u09A8\u09C1\u09AE\u09BE\u09A8 \u0987\u09AE\u09BE\u09A8 \u09A6\u09C2\u09F0\u09B2\u09C8 \u09A8\u09BE\u09AA\u09BE\u09B2\u09C7; \u09AA\u09CB\u09F1\u09BE \u09B6\u09C7\u09B7 \u0998\u09A3\u09CD\u099F\u09BE\u099F\u09CB \u09A6\u09C7\u0996\u09C1\u0993\u09F1\u09BE \u09B9\u09C8\u099B\u09C7\u0964"
  },
  inspector: {
    title: "\u0995\u09CB\u09B7 \u09AA\u09F0\u09BF\u09A6\u09F0\u09CD\u09B6\u0995",
    coords: "\u09B8\u09CD\u09A5\u09BE\u09A8\u09BE\u0982\u0995",
    why: "\u098F\u0987 \u09AE\u09C2\u09B2\u09CD\u09AF\u09BE\u09AF\u09BC\u09A8 \u0995\u09BF\u09AF\u09BC",
    terrain: "\u09AD\u09C2-\u09AA\u09CD\u09F0\u0995\u09C3\u09A4\u09BF \u2014 \u09B8\u09CD\u09A5\u09BF\u09F0 \u09B8\u0982\u09AC\u09C7\u09A6\u09A8\u09B6\u09C0\u09B2\u09A4\u09BE",
    triggerGroup: "\u09AC\u09F0\u09B7\u09C1\u09A3 \u2014 \u099A\u09B2\u09BF\u09A4 \u099F\u09CD\u09F0\u09BF\u0997\u09BE\u09F0",
    exposure: "\u09B8\u0982\u09AF\u09CB\u0997 \u0986\u09F0\u09C1 \u09AA\u09CD\u09F0\u09F1\u09C7\u09B6",
    village: "\u09A8\u09BF\u0995\u099F\u09A4\u09AE \u0997\u09BE\u0981\u0993",
    population: "\u099C\u09A8\u09B8\u0982\u0996\u09CD\u09AF\u09BE",
    estimated: "\u0986\u09A8\u09C1\u09AE\u09BE\u09A8\u09BF\u0995",
    susceptibility: "\u09B8\u0982\u09AC\u09C7\u09A6\u09A8\u09B6\u09C0\u09B2\u09A4\u09BE",
    risk: "\u099A\u09B2\u09BF\u09A4 \u09AC\u09BF\u09AA\u09A6",
    equation: "\u09B8\u0982\u09AC\u09C7\u09A6\u09A8\u09B6\u09C0\u09B2\u09A4\u09BE \xD7 \u099F\u09CD\u09F0\u09BF\u0997\u09BE\u09F0 = \u09AC\u09BF\u09AA\u09A6",
    noData: "\u09A8\u09BE\u0987",
    noDataNote: "\u098F\u0987 \u0997\u09CD\u09F0\u09BF\u09A1 \u09AB\u09BE\u0987\u09B2\u09A4 \u09A8\u09BE\u0987",
    state: "\u09F0\u09BE\u099C\u09CD\u09AF",
    district: "\u099C\u09BF\u09B2\u09BE",
    noFactors: "\u098F\u0987 \u0997\u09CD\u09F0\u09BF\u09A1 \u09AB\u09BE\u0987\u09B2\u09A4 \u0995\u09CB\u09A8\u09CB \u09AE\u09A1\u09C7\u09B2 \u09AC\u09C8\u09B6\u09BF\u09B7\u09CD\u099F\u09CD\u09AF \u09A4\u09BE\u09B2\u09BF\u0995\u09BE\u09AD\u09C1\u0995\u09CD\u09A4 \u09A8\u09BE\u0987\u0964",
    noExposure: "\u098F\u0987 \u0997\u09CD\u09F0\u09BF\u09A1 \u09AB\u09BE\u0987\u09B2\u09A4 \u09AC\u09B8\u09A4\u09BF\u09F0 \u09A4\u09A5\u09CD\u09AF \u09A8\u09BE\u0987\u0964",
    rainFromNode: "\u098F\u0987 \u0995\u09CB\u09B7 \u09B8\u09BE\u09AE\u09F0\u09BF \u09B2\u09CB\u09F1\u09BE 0.5\xB0 \u09AC\u09F0\u09B7\u09C1\u09A3 \u09A8\u09CB\u09A1\u09F0 \u09AA\u09F0\u09BE"
  },
  factor: {
    slope: "\u09A2\u09BE\u09B2",
    relief: "\u09B8\u09CD\u09A5\u09BE\u09A8\u09C0\u09AF\u09BC \u0989\u099A\u09CD\u099A\u09A4\u09BE \u09AA\u09BE\u09F0\u09CD\u09A5\u0995\u09CD\u09AF",
    elevation: "\u0989\u099A\u09CD\u099A\u09A4\u09BE",
    stream: "\u099C\u09B2\u09A7\u09BE\u09F0\u09BE\u09F0 \u09A8\u09BF\u0995\u099F\u09A4\u09BE",
    road: "\u09AA\u09A5\u09F0 \u09AA\u09F0\u09BE \u09A6\u09C2\u09F0\u09A4\u09CD\u09AC",
    intensity: "\u09AC\u09F0\u09B7\u09C1\u09A3\u09F0 \u09A4\u09C0\u09AC\u09CD\u09F0\u09A4\u09BE",
    antecedent: "\u09AA\u09C2\u09F0\u09CD\u09AC\u09F1\u09F0\u09CD\u09A4\u09C0 \u0986\u09F0\u09CD\u09A6\u09CD\u09F0\u09A4\u09BE",
    slopeMean: "\u0997\u09A1\u09BC \u09A2\u09BE\u09B2",
    roughness: "\u09F0\u09C1\u0995\u09CD\u09B7\u09A4\u09BE",
    tpi: "\u09AD\u09C2-\u09B8\u0982\u09B8\u09CD\u09A5\u09BE\u09A8\u09BF\u0995 \u0985\u09F1\u09B8\u09CD\u09A5\u09BE\u09A8",
    curvature: "\u09AC\u0995\u09CD\u09F0\u09A4\u09BE",
    aspect: "\u09A6\u09BF\u09B6",
    village_distance: "\u09AC\u09B8\u09A4\u09BF\u09F0 \u09A8\u09BF\u0995\u099F\u09A4\u09BE"
  },
  priority: {
    title: "\u0985\u0997\u09CD\u09F0\u09BE\u09A7\u09BF\u0995\u09BE\u09F0 \u0985\u099E\u09CD\u099A\u09B2",
    subtitle: "\u099A\u09B2\u09BF\u09A4 \u09AC\u09BF\u09AA\u09A6 \u0985\u09A8\u09C1\u09B8\u09F0\u09BF \u09B6\u09C0\u09F0\u09CD\u09B7 \u09E7\u09E6",
    empty: "\u09AC\u09F0\u09CD\u09A4\u09AE\u09BE\u09A8 \u099F\u09CD\u09F0\u09BF\u0997\u09BE\u09F0\u09A4 \u0995\u09CB\u09A8\u09CB \u0995\u09CB\u09B7 \u09A8\u09BF\u09F0\u09BE\u09AA\u09A6\u09F0 \u0993\u09AA\u09F0\u09A4 \u09A8\u09BE\u0987\u0964",
    population: "\u099C\u09A8."
  },
  alerts: {
    title: "\u09B8\u09A4\u09F0\u09CD\u0995\u09AC\u09BE\u09A3\u09C0",
    affected: "\u09B8\u09A4\u09F0\u09CD\u0995\u09AC\u09BE\u09A3\u09C0 \u09AC\u09BE \u09B8\u09CD\u09A5\u09BE\u09A8\u09BE\u09A8\u09CD\u09A4\u09F0 \u09AA\u09F0\u09CD\u09AF\u09BE\u09AF\u09BC\u09F0 \u0985\u099E\u09CD\u099A\u09B2",
    level: "\u09B8\u09A4\u09F0\u09CD\u0995\u09A4\u09BE\u09F0 \u09B8\u09CD\u09A4\u09F0",
    dispatch: "\u099C\u09BF\u09B2\u09BE \u09A8\u09BF\u09AF\u09BC\u09A8\u09CD\u09A4\u09CD\u09F0\u09A3 \u0995\u0995\u09CD\u09B7\u09B2\u09C8 \u09B8\u09A4\u09F0\u09CD\u0995\u09AC\u09BE\u09A3\u09C0 \u09AA\u09A0\u09BF\u09AF\u09BC\u09BE\u0993\u0995",
    sending: "\u09AA\u09A0\u09BF\u0993\u09F1\u09BE \u09B9\u09C8 \u0986\u099B\u09C7\u2026",
    configure: "Telegram \u09AC\u09BF\u09A8\u09CD\u09AF\u09BE\u09B8 \u0995\u09F0\u0995",
    configureHint: "VITE_TELEGRAM_TOKEN \u0986\u09F0\u09C1 VITE_TELEGRAM_CHAT_ID \u09A8\u09BF\u09F0\u09CD\u09A7\u09BE\u09F0\u09A3 \u0995\u09F0\u09BF \u09AA\u09C1\u09A8\u09F0 \u09AC\u09BF\u09B2\u09CD\u09A1 \u0995\u09F0\u0995\u0964",
    log: "\u09AA\u09CD\u09F0\u09C7\u09F0\u09A3 \u09B2\u0997",
    logEmpty: "\u098F\u0987 \u09B8\u09A4\u09CD\u09F0\u09A4 \u0995\u09CB\u09A8\u09CB \u09B8\u09A4\u09F0\u09CD\u0995\u09AC\u09BE\u09A3\u09C0 \u09AA\u09A0\u09BF\u0993\u09F1\u09BE \u09B9\u09CB\u09F1\u09BE \u09A8\u09BE\u0987\u0964",
    sent: "\u09B8\u09A4\u09F0\u09CD\u0995\u09AC\u09BE\u09A3\u09C0 \u09A8\u09BF\u09AF\u09BC\u09A8\u09CD\u09A4\u09CD\u09F0\u09A3 \u0995\u0995\u09CD\u09B7\u09B2\u09C8 \u09AA\u09CB\u09F1\u09BE \u0997'\u09B2",
    failed: "\u09B8\u09A4\u09F0\u09CD\u0995\u09AC\u09BE\u09A3\u09C0 \u09AA\u09A0\u09BF\u09AF\u09BC\u09BE\u09AC \u09AA\u09F0\u09BE \u09A8\u0997'\u09B2",
    none: "\u098F\u0987 \u09AE\u09C1\u09B9\u09C2\u09F0\u09CD\u09A4\u09A4 \u0995\u09CB\u09A8\u09CB \u0985\u099E\u09CD\u099A\u09B2 \u09B8\u09A4\u09F0\u09CD\u0995\u09AC\u09BE\u09A3\u09C0 \u09AC\u09BE \u09B8\u09CD\u09A5\u09BE\u09A8\u09BE\u09A8\u09CD\u09A4\u09F0 \u09AA\u09F0\u09CD\u09AF\u09BE\u09AF\u09BC\u09A4 \u09A8\u09BE\u0987\u0964",
    confirm: "\u09A8\u09BF\u09AF\u09BC\u09A8\u09CD\u09A4\u09CD\u09F0\u09A3 \u0995\u0995\u09CD\u09B7\u09B2\u09C8 \u09AA\u09A0\u09BF\u09AF\u09BC\u09BE\u09AC\u09A8\u09C7?"
  },
  report: {
    fab: "\u09AC\u09BF\u09AA\u09A6\u09F0 \u0996\u09AC\u09F0 \u09A6\u09BF\u09AF\u09BC\u0995",
    title: "\u09A8\u09BE\u0997\u09F0\u09BF\u0995 \u09AC\u09BF\u09AA\u09A6 \u09AA\u09CD\u09F0\u09A4\u09BF\u09AC\u09C7\u09A6\u09A8",
    photo: "\u09AB\u099F\u09CB",
    photoHint: "\u0995\u09C7\u09AE\u09C7\u09F0\u09BE \u09AC\u09BE \u0997\u09C7\u09B2\u09BE\u09F0\u09C0 \xB7 \u0990\u099A\u09CD\u099B\u09BF\u0995",
    photoRemove: "\u09AB\u099F\u09CB \u0986\u0981\u09A4\u09F0\u09BE\u0993\u0995",
    location: "\u09B8\u09CD\u09A5\u09BE\u09A8",
    useGps: "\u09AE\u09CB\u09F0 \u09B8\u09CD\u09A5\u09BE\u09A8 \u09B2\u0993\u0995",
    locating: "\u09B8\u09CD\u09A5\u09BE\u09A8 \u09AC\u09BF\u099A\u09BE\u09F0\u09BF \u09A5\u0995\u09BE \u09B9\u09C8\u099B\u09C7\u2026",
    gpsDenied: "\u09B8\u09CD\u09A5\u09BE\u09A8\u09F0 \u0985\u09A8\u09C1\u09AE\u09A4\u09BF \u09A8\u09BE\u0995\u099A \u2014 \u09B8\u09CD\u09A5\u09BE\u09A8\u09BE\u0982\u0995 \u09A8\u09BF\u099C\u09C7 \u09A6\u09BF\u09AF\u09BC\u0995\u0964",
    gpsUnavailable: "\u09B8\u09CD\u09A5\u09BE\u09A8 \u09B8\u09C7\u09F1\u09BE \u09A8\u09BE\u0987 \u2014 \u09B8\u09CD\u09A5\u09BE\u09A8\u09BE\u0982\u0995 \u09A8\u09BF\u099C\u09C7 \u09A6\u09BF\u09AF\u09BC\u0995\u0964",
    gpsOk: "\u09A1\u09BF\u09AD\u09BE\u0987\u099A\u09F0 \u09AA\u09F0\u09BE \u09B8\u09CD\u09A5\u09BE\u09A8 \u09AA\u09CB\u09F1\u09BE \u0997'\u09B2",
    lat: "\u0985\u0995\u09CD\u09B7\u09BE\u0982\u09B6",
    lon: "\u09A6\u09CD\u09F0\u09BE\u0998\u09BF\u09AE\u09BE\u0982\u09B6",
    type: "\u09AA\u09F0\u09CD\u09AF\u09AC\u09C7\u0995\u09CD\u09B7\u09A3\u09F0 \u09A7\u09F0\u09A3",
    types: {
      crack: "\u09AE\u09BE\u099F\u09BF\u09A4 \u09AB\u09BE\u099F",
      slope: "\u09A2\u09BE\u09B2 \u0996\u09B9\u09BF \u09AA\u09F0\u09BE",
      road: "\u09AA\u09A5 \u09AC\u09A8\u09CD\u09A7",
      seepage: "\u09AA\u09BE\u09A8\u09C0 \u09B8\u09F0\u09BF \u0985\u09B9\u09BE",
      other: "\u0985\u09A8\u09CD\u09AF"
    },
    description: "\u09AC\u09BF\u09F1\u09F0\u09A3",
    descriptionPlaceholder: "\u0986\u09AA\u09C1\u09A8\u09BF \u0995\u09BF \u09A6\u09C7\u0996\u09BF\u09B2\u09C7?",
    submit: "\u09AA\u09CD\u09F0\u09A4\u09BF\u09AC\u09C7\u09A6\u09A8 \u09AA\u09A0\u09BF\u09AF\u09BC\u09BE\u0993\u0995",
    submitted: "\u09AA\u09CD\u09F0\u09A4\u09BF\u09AC\u09C7\u09A6\u09A8 \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09F0\u09A4 \u09AF\u09CB\u0997 \u0995\u09F0\u09BE \u09B9'\u09B2",
    needLocation: "\u09B6\u09C1\u09A6\u09CD\u09A7 \u0985\u0995\u09CD\u09B7\u09BE\u0982\u09B6 \u0986\u09F0\u09C1 \u09A6\u09CD\u09F0\u09BE\u0998\u09BF\u09AE\u09BE\u0982\u09B6 \u09AA\u09CD\u09F0\u09AF\u09BC\u09CB\u099C\u09A8\u0964",
    sessionNote: "\u09AA\u09CD\u09F0\u09A4\u09BF\u09AC\u09C7\u09A6\u09A8 \u0995\u09C7\u09F1\u09B2 \u098F\u0987 \u09AC\u09CD\u09F0\u09BE\u0989\u099C\u09BE\u09F0 \u09B8\u09A4\u09CD\u09F0\u09A4\u09C7 \u09A5\u09BE\u0995\u09C7 \u2014 \u0995\u09CB\u09A8\u09CB \u099B\u09BE\u09F0\u09CD\u09AD\u09BE\u09F0 \u09A8\u09BE\u0987\u0964",
    reportedAt: "\u099C\u09A8\u09CB\u09F1\u09BE \u09B9'\u09B2",
    markerTitle: "\u09A8\u09BE\u0997\u09F0\u09BF\u0995 \u09AA\u09CD\u09F0\u09A4\u09BF\u09AC\u09C7\u09A6\u09A8"
  },
  sensor: {
    title: "\u0985\u09A8\u09C1\u0995\u09C3\u09A4 \u099B\u09C7\u09A8\u09CD\u09B8\u09F0 \u09A8'\u09A1 \u2014 \u09B9\u09BE\u09F0\u09CD\u09A1\u09F1\u09C7\u09F0 \u09A8\u09BF\u09F0\u09CD\u09AE\u09BE\u09A3\u09BE\u09A7\u09C0\u09A8",
    node: "\u09A8'\u09A1 HFL-01 \xB7 \u09B9\u09BE\u09AB\u09B2\u0982 \u09B6\u09C8\u09B2\u09B6\u09BF\u09F0\u09BE",
    moisture: "\u09AE\u09BE\u099F\u09BF\u09F0 \u0986\u09F0\u09CD\u09A6\u09CD\u09F0\u09A4\u09BE",
    tilt: "\u09B9\u09C7\u09B2\u09A8\u09C0\u09AF\u09BC\u09BE \u0995\u09CB\u09A3",
    battery: "\u09AC\u09C7\u099F\u09BE\u09F0\u09C0",
    breach: "\u09B8\u09C0\u09AE\u09BE \u0985\u09A4\u09BF\u0995\u09CD\u09F0\u09AE \u0995\u09F0\u09BF\u099B\u09C7",
    note: "\u09AE\u09BE\u09A8\u09B8\u09AE\u09C2\u09B9 \u09AC\u09CD\u09F0\u09BE\u0989\u099C\u09BE\u09F0\u09A4 \u09B8\u09C3\u09B7\u09CD\u099F\u09BF \u0995\u09F0\u09BE \u09B9\u09AF\u09BC \u0986\u09F0\u09C1 \u09AC\u09F0\u09B7\u09C1\u09A3\u09F0 \u09A4\u09A5\u09CD\u09AF\u09F0 \u09B2\u0997\u09A4 \u09B8\u09B2\u09A8\u09BF \u09B9\u09AF\u09BC\u0964"
  },
  method: {
    title: "\u09AA\u09A6\u09CD\u09A7\u09A4\u09BF",
    concept: "PAHARA \u0995\u09C7\u09A8\u09C7\u0995\u09C8 \u09AC\u09BF\u09AA\u09A6 \u0997\u09A3\u09A8\u09BE \u0995\u09F0\u09C7",
    conceptBody: "\u09B8\u0982\u09AC\u09C7\u09A6\u09A8\u09B6\u09C0\u09B2\u09A4\u09BE \u09AD\u09C2-\u09AA\u09CD\u09F0\u0995\u09C3\u09A4\u09BF\u09F0 \u09AA\u09F0\u09BE \u0986\u0997\u09A4\u09C7\u0987 \u0997\u09A3\u09A8\u09BE \u0995\u09F0\u09BE \u09B9\u09AF\u09BC \u0986\u09F0\u09C1 \u09AC\u09A4\u09F0\u09F0 \u09B2\u0997\u09A4 \u09B8\u09B2\u09A8\u09BF \u09A8\u09B9\u09AF\u09BC; \u09AC\u09CD\u09AF\u09F1\u09B9\u09C3\u09A4 \u09AA\u09CD\u09F0\u09BE\u099A\u09B2\u09AC\u09CB\u09F0 \u098F\u0987 \u09AB\u09BE\u0987\u09B2\u09F0 \u09AE\u09C7\u099F\u09BE\u09A1\u09C7\u099F\u09BE\u09A4 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE\u09AD\u09C1\u0995\u09CD\u09A4 \u0986\u09F0\u09C1 \u09AA\u09F0\u09BF\u09A6\u09F0\u09CD\u09B6\u0995\u09A4 \u09AA\u09CD\u09F0\u09A4\u09BF \u0995\u09CB\u09B7\u09A4 \u09A6\u09C7\u0996\u09C1\u0993\u09F1\u09BE \u09B9\u09AF\u09BC\u0964 \u099F\u09CD\u09F0\u09BF\u0997\u09BE\u09F0 \u098F\u0987 \u09AC\u09CD\u09F0\u09BE\u0989\u099C\u09BE\u09F0\u09A4\u09C7 \u09AC\u09F0\u09B7\u09C1\u09A3\u09F0 \u09AA\u09F0\u09BE \u09A4\u09CE\u0995\u09CD\u09B7\u09A3\u09BE\u09CE \u0997\u09A3\u09A8\u09BE \u0995\u09F0\u09BE \u09B9\u09AF\u09BC\u0964 \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09F0\u09C7 \u09A6\u09C1\u09AF\u09BC\u09CB\u099F\u09BE\u09F0 \u0997\u09C1\u09A3\u09AB\u09B2 \u09A6\u09C7\u0996\u09C1\u09F1\u09BE\u09AF\u09BC\u0964",
    generated: "\u0997\u09CD\u09F0\u09BF\u09A1 \u09A8\u09BF\u09F0\u09CD\u09AE\u09BE\u09A3",
    methodUsed: "\u09B8\u09CD\u0995'\u09F0\u09BF\u0982 \u09AA\u09A6\u09CD\u09A7\u09A4\u09BF",
    auc: "\u09B8\u09CD\u09A5\u09BE\u09A8\u09BF\u0995 \u09AC\u09CD\u09B2\u0995 CV ROC-AUC",
    cells: "\u0997\u09CD\u09F0\u09BF\u09A1\u09A4 \u0995\u09CB\u09B7",
    sources: "\u09A4\u09A5\u09CD\u09AF\u09F0 \u0989\u09CE\u09B8",
    simulatedTitle: "\u099B\u09C7\u09A8\u09CD\u09B8\u09F0\u09F0 \u09A4\u09A5\u09CD\u09AF \u0985\u09A8\u09C1\u0995\u09C3\u09A4",
    simulatedBody: "\u099B\u09C7\u09A8\u09CD\u09B8\u09F0 \u09A8'\u09A1 \u09AA\u09C7\u09A8\u09C7\u09B2\u09C7 \u09B8\u09C3\u09B7\u09CD\u099F \u09AE\u09BE\u09A8 \u09A6\u09C7\u0996\u09C1\u09F1\u09BE\u09AF\u09BC, \u09B8\u09CD\u09A5\u09BE\u09AA\u09BF\u09A4 \u09AF\u09A8\u09CD\u09A4\u09CD\u09F0\u09F0 \u09AA\u09BE\u09A0 \u09A8\u09B9\u09AF\u09BC\u0964 \u0995\u09CD\u09B7\u09C7\u09A4\u09CD\u09F0 \u09B9\u09BE\u09F0\u09CD\u09A1\u09F1\u09C7\u09F0 \u09A8\u09BF\u09F0\u09CD\u09AE\u09BE\u09A3\u09BE\u09A7\u09C0\u09A8\u0964",
    noMetadata: "\u098F\u0987 \u0997\u09CD\u09F0\u09BF\u09A1 \u09AB\u09BE\u0987\u09B2\u09A4 \u09AE\u09C7\u099F\u09BE\u09A1\u09C7\u099F\u09BE \u09A8\u09BE\u0987, \u09B8\u09C7\u09AF\u09BC\u09C7\u09B9\u09C7 \u09A8\u09BF\u09F0\u09CD\u09AE\u09BE\u09A3\u09F0 \u09AC\u09BF\u09F1\u09F0\u09A3 \u09AA\u09CB\u09F1\u09BE \u09A8\u0997'\u09B2\u0964 \u0985\u09AB\u09B2\u09BE\u0987\u09A8 \u09AA\u09BE\u0987\u09AA\u09B2\u09BE\u0987\u09A8\u09C7\u09F0\u09C7 \u0987\u09AF\u09BC\u09BE\u0995 \u09AA\u09C1\u09A8\u09F0 \u09B8\u09C3\u09B7\u09CD\u099F\u09BF \u0995\u09F0\u0995\u0964",
    close: "\u09AC\u09A8\u09CD\u09A7 \u0995\u09F0\u0995",
    records: "\u09AC\u09CD\u09AF\u09F1\u09B9\u09C3\u09A4 \u09AD\u09C2\u09AE\u09BF\u09B8\u09CD\u0996\u09B2\u09A8 \u09F0\u09C7\u0995\u09F0\u09CD\u09A1",
    validation: "\u09AC\u09C8\u09A7\u0995\u09F0\u09A3",
    aucSpatial: "\u09B8\u09CD\u09A5\u09BE\u09A8\u09BF\u0995-\u09AC\u09CD\u09B2\u0995 CV ROC-AUC",
    aucRandom: "\u09AF\u09BE\u09A6\u09C3\u099A\u09CD\u099B\u09BF\u0995-\u09AC\u09BF\u09AD\u09BE\u099C\u09A8 ROC-AUC",
    aucBaseline: "\u09B2\u099C\u09BF\u09B7\u09CD\u099F\u09BF\u0995 \u09F0\u09BF\u0997\u09CD\u09F0\u09C7\u099B\u09A8 \u0986\u09A7\u09BE\u09F0\u09F0\u09C7\u0996\u09BE",
    aucNote: "\u09AF\u09BE\u09A6\u09C3\u099A\u09CD\u099B\u09BF\u0995 \u09AC\u09BF\u09AD\u09BE\u099C\u09A8\u09F0 \u09A8\u09AE\u09CD\u09AC\u09F0 \u0985\u09A7\u09BF\u0995, \u0995\u09BE\u09F0\u09A3 \u0993\u099A\u09F0\u09F0 \u0995\u09CB\u09B7\u09AC\u09CB\u09F0 \u09B8\u09CD\u09AC\u09A4\u09A8\u09CD\u09A4\u09CD\u09F0 \u09A8\u09B9\u09AF\u09BC \u2014 \u098F\u099F\u09BE \u0995\u09CB\u09B7\u09F0 \u0993\u099A\u09F0\u09F0\u09AC\u09CB\u09F0 \u09AA\u09F0\u09C0\u0995\u09CD\u09B7\u09BE \u09AB\u09B2\u09CD\u09A1\u09A4 \u09B8\u09CB\u09AE\u09BE\u0987 \u09AA\u09F0\u09C7\u0964 \u09B8\u09CD\u09A5\u09BE\u09A8\u09BF\u0995-\u09AC\u09CD\u09B2\u0995 \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u0987 \u0997\u09CB\u099F\u09C7\u0987 0.5\xB0 \u09AC\u09CD\u09B2\u0995 \u09AC\u09BE\u09B9\u09BF\u09F0\u09A4 \u09F0\u09BE\u0996\u09C7, \u0986\u09F0\u09C1 \u09B8\u09C7\u09AF\u09BC\u09BE\u0987 \u09B8\u09A0\u09BF\u0995\u0964"
  },
  units: {
    mm: "\u09AE\u09BF\u09AE\u09BF",
    m: "\u09AE\u09BF",
    deg: "\xB0",
    volt: "\u09AD",
    percent: "%",
    km: "\u0995\u09BF\u09AE\u09BF"
  },
  common: {
    close: "\u09AC\u09A8\u09CD\u09A7 \u0995\u09F0\u0995",
    cancel: "\u09AC\u09BE\u09A4\u09BF\u09B2",
    dismiss: "\u0986\u0981\u09A4\u09F0\u09BE\u0993\u0995",
    collapse: "\u09B8\u0982\u0995\u09C1\u099A\u09BF\u09A4",
    expand: "\u09AA\u09CD\u09F0\u09B8\u09BE\u09F0\u09BF\u09A4"
  },
  search: {
    placeholder: "\u0997\u09BE\u0981\u0993, \u099A\u09B9\u09B0 \u09AC\u09BE \u099C\u09BF\u09B2\u09BE \u09AC\u09BF\u099A\u09BE\u09B0\u0995\u2026",
    clear: "\u09B8\u09A8\u09CD\u09A7\u09BE\u09A8 \u099A\u09BE\u09AB \u0995\u09B0\u0995",
    searching: "\u09AC\u09BF\u099A\u09BE\u09B0\u09BF \u0986\u099B\u09C7\u2026",
    noResults: "\u0995\u09CB\u09A8\u09CB \u09AE\u09BF\u09B2 \u09A8\u09BE\u0987\u09964 \u0986\u09A8 \u09AC\u09BE\u09A8\u09BE\u09A8 \u099A\u09BE\u0993\u0995\u09FE",
    suggestions: "\u0987\u09AF\u09BC\u09BE\u09B0 \u09AA\u09B0\u09BE \u098F\u099F\u09BE \u099A\u09BE\u0993\u0995",
    recent: "\u09B6\u09C7\u09B9\u09A4\u09C0\u09AF\u09BC\u09BE",
    resultTitle: "\u09B8\u09CD\u09A5\u09BE\u09A8 \u09AE\u09C2\u09B2\u09CD\u09AF\u09BE\u09AF\u09BC\u09A8",
    liveRisk: "\u09B8\u099C\u09C0\u09F1 \u09DD\u09C1\u0981\u0995\u09BF",
    staticSusceptibility: "\u09B8\u09CD\u09A5\u09BF\u09B0 \u09B8\u0982\u09AC\u09C7\u09A6\u09A8\u09B6\u09C0\u09B2\u09A4\u09BE",
    outsideRegion: "\u09A8\u09BF\u09B0\u09C0\u0995\u09CD\u09B7\u09A3 \u0985\u099E\u09CD\u099A\u09B2\u09B0 \u09AC\u09BE\u09B9\u09BF\u09B0\u09A4\u0964 PAHARA-\u0987 \u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u0986\u09A0\u0996\u09A8 \u0989\u09A4\u09CD\u09A4\u09B0-\u09AA\u09C2\u09B0\u09CD\u09AC \u09B0\u09BE\u099C\u09CD\u09AF \u09B8\u09BE\u09AE\u09B0\u09BF \u09B2\u09AF\u09BC\u0964",
    unmonitored: "\u098F\u0987 \u09A0\u09BE\u0987\u09B0 \u0993\u099A\u09B0\u09A4 \u0995\u09CB\u09A8\u09CB \u09AE\u09A1\u09C7\u09B2 \u0995\u09B0\u09BE \u09A2\u09BE\u09B2 \u09A8\u09BE\u0987\u0964 3\xB0-\u09B0 \u09A4\u09B2\u09B0 \u0995\u09CB\u09B7\u09AC\u09CB\u09B0 \u09AC\u09BE\u09A6 \u09A6\u09BF\u09AF\u09BC\u09BE \u09B9\u09AF\u09BC\u0964",
    unmonitoredNear: "\u098F\u0987 \u09A0\u09BE\u0987\u09B0 \u0993\u099A\u09B0\u09A4 \u0995\u09CB\u09A8\u09CB \u09AE\u09A1\u09C7\u09B2 \u0995\u09B0\u09BE \u09A2\u09BE\u09B2 \u09A8\u09BE\u0987 \u2014 \u0993\u099A\u09B0\u09B0\u099F\u09CB {{km}} \u0995\u09BF\u09AE\u09BF \u0986\u0981\u09A4\u09B0\u09A4\u0964 3\xB0-\u09B0 \u09A4\u09B2\u09B0 \u0995\u09CB\u09B7\u09AC\u09CB\u09B0 \u09AC\u09BE\u09A6 \u09A6\u09BF\u09AF\u09BC\u09BE \u09B9\u09AF\u09BC\u0964",
    nearestCell: "\u0993\u099A\u09B0\u09B0 \u09A8\u09BF\u09B0\u09C0\u0995\u09CD\u09B7\u09BF\u09A4 \u0995\u09CB\u09B7 {{km}} \u0995\u09BF\u09AE\u09BF \u0986\u0981\u09A4\u09B0\u09A4\u0964 \u098F\u0987 \u09AE\u09C2\u09B2\u09CD\u09AF\u09BE\u0999\u09CD\u0995\u09A8 \u09B8\u09C7\u0987 \u0995\u09CB\u09B7\u09B0, \u099C\u09A8\u09AC\u09B8\u09A4\u09BF\u09B0 \u09A8\u09B9\u09AF\u09BC\u0964",
    higherRisk: "\u0993\u099A\u09B0\u09B0 \u0985\u09A7\u09BF\u0995 \u09DD\u09C1\u0981\u0995\u09BF\u09B0 \u0985\u099E\u09CD\u099A\u09B2: {{km}} \u0995\u09BF\u09AE\u09BF {{dir}} ({{cls}})\u0964 \u0993\u09B2\u09BE\u0987 \u09AF\u09CB\u09F1\u09BE \u09AA\u09A5\u099F\u09CB \u0986\u09AA\u09CB\u09A8\u09BE\u09B0 \u09A0\u09BE\u0987\u09A4\u09AC\u09B0\u09CD\u09A4\u09BF\u09B2\u09BE\u0995\u09C8\u0993 \u0996\u09A4\u09B0\u09BE \u09B9\u09AC \u09AA\u09BE\u09B0\u09C7\u0964",
    noRiskData: "\u0993\u099A\u09B0\u09A4 \u09AE\u09A1\u09C7\u09B2 \u0995\u09B0\u09BE \u09A2\u09BE\u09B2 \u09A8\u09BE\u0987",
    fromGeocoder: "\u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0 \u09B8\u09A8\u09CD\u09A7\u09BE\u09A8\u09B0 \u09AA\u09B0\u09BE",
    unknownArea: "\u0985\u099E\u09CD\u099A\u09B2 \u0985\u099C\u09CD\u099E\u09BE\u09A4",
    populationUnknown: "\u09B2\u09BF\u09AA\u09BF\u09AC\u09A6\u09CD\u09A7 \u09A8\u09B9\u09AF\u09BC"
  },
  plain: {
    title: "\u09AE\u09CB\u09B0 \u0993\u099A\u09B0\u09A4 \u09AD\u09C2\u09AE\u09BF\u09B8\u09CD\u0996\u09B2\u09A8\u09B0 \u09B8\u09AE\u09CD\u09AD\u09BE\u09AC\u09A8\u09BE \u0986\u099B\u09C7\u09A8\u09C7?",
    searchLabel: "\u0986\u09AA\u09C1\u09A8\u09BE\u09B0 \u0997\u09BE\u0981\u09B5 \u09AC\u09BE \u099A\u09B9\u09B0 \u09AC\u09BF\u099A\u09BE\u09B0\u0995",
    searchHint: "\u0989\u09A4\u09CD\u09A4\u09B0-\u09AA\u09C2\u09AC\u09B0 \u0995\u09CB\u09A8\u09CB \u09A0\u09BE\u0987\u09B0 \u09A8\u09BE\u09AE \u09B2\u09BF\u0996\u0995",
    emptyTitle: "\u0986\u09AA\u09C1\u09A8\u09BE\u09B0 \u0997\u09BE\u0981\u09B5 \u09AC\u09BF\u099A\u09BE\u09B0\u0995",
    emptyBody: "PAHARA-\u0987 \u0995\u09AF\u09BC \u09AF\u09C7 \u0986\u099C\u09BF \u0995\u09CB\u09A8\u09CB \u09A0\u09BE\u0987\u09B0 \u0993\u099A\u09B0\u09A4 \u09AD\u09C2\u09AE\u09BF\u09B8\u09CD\u0996\u09B2\u09A8\u09B0 \u09B8\u09AE\u09CD\u09AD\u09BE\u09AC\u09A8\u09BE \u0986\u099B\u09C7 \u09A8\u09C7 \u09A8\u09BE\u0987 \u2014 \u09AE\u09BE\u099F\u09BF\u09B0 \u0922\u09BE\u09B2 \u0986\u09B0\u09C1 \u09AC\u09B0\u09B7\u09C1\u09A3\u09B0 \u09AA\u09B0\u09BE\u0964",
    emptyTry: "\u0987\u09AF\u09BC\u09BE\u09B0 \u09AA\u09B0\u09BE \u098F\u099F\u09BE \u099A\u09BE\u0993\u0995",
    whyTitle: "\u0995\u09BF\u09AF\u09BC",
    doTitle: "\u0995\u09BF \u0995\u09B0\u09BF\u09AC",
    adviceNote: "\u098F\u0987\u09AF\u09BC\u09BE \u09B8\u09BE\u09A7\u09BE\u09B0\u09A3 \u09AA\u09B0\u09BE\u09AE\u09B0\u09CD\u09B6, \u0985\u09BE\u09A8\u09C1\u09B7\u09CD\u09A0\u09BE\u09A8\u09BF\u0995 \u0985\u09AA\u09B8\u09BE\u09B0\u09A3 \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6 \u09A8\u09B9\u09AF\u09BC\u0964 \u09B8\u09A6\u09BE\u09AF\u09BC \u09AC\u09BF\u09B2\u09BE\u0995\u09B0 \u099C\u09BF\u09B2\u09BE \u09AA\u09CD\u09B0\u09B6\u09BE\u09B8\u09A8 \u0986\u09B0\u09C1 NDMA-\u09B0 \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6 \u09AE\u09BE\u09A8\u09BF \u099A\u09B2\u0995\u0964",
    higherNear: "\u0987\u09AF\u09BC\u09BE\u09B0 \u09AA\u09B0\u09BE {{km}} \u0995\u09BF.\u09AE\u09BF. {{dir}}-\u09A4 \u0985\u09A7\u09BF\u0995 \u09AC\u09BF\u09AA\u09A6\u0964 \u0986\u09AA\u09C1\u09A8\u09BE\u09B0 \u0998\u09B0 \u09A8\u09BF\u09B0\u09BE\u09AA\u09A6 \u09B9\u09B2\u09C7\u0993 \u0993\u09B2\u09BE\u0987 \u09AF\u09CB\u09B5\u09BE \u09AA\u09A5 \u09A8\u09B9\u09AC \u09AA\u09BE\u09B0\u09C7\u0964",
    distantCell: "\u0986\u099F\u09BE\u0987\u09A4\u0995\u09C8 \u0993\u099A\u09B0\u09B0 \u09AE\u09A1\u09C7\u09B2 \u0995\u09B0\u09BE \u09AA\u09BE\u09B9\u09BE\u09B0 {{km}} \u0995\u09BF.\u09AE\u09BF. \u0986\u0981\u09A4\u09B0\u09A4, \u09B8\u09C7\u09AF\u09BC\u09C7\u09B9\u09C7 \u098F\u0987\u099F\u09CB \u0993\u099A\u09B0\u09B0 \u09AA\u09BE\u09A0, \u09A0\u09BF\u0995 \u098F\u0987 \u09A0\u09BE\u0987\u09B0 \u09A8\u09B9\u09AF\u09BC\u0964",
    nodataTitle: "\u098F\u0987 \u09A0\u09BE\u0987\u09B0 \u09AC\u09BE\u09AC\u09C7 \u0922\u09BE\u09B2\u09B0 \u09A4\u09A5\u09CD\u09AF \u09A8\u09BE\u0987",
    nodataBody: "{{name}}-\u09B0 \u0993\u099A\u09B0\u09A4 \u0995\u09CB\u09A8\u09CB \u09AE\u09A1\u09C7\u09B2 \u0995\u09B0\u09BE \u09AA\u09BE\u09B9\u09BE\u09B0 \u09A8\u09BE\u0987\u0964 \u0987\u09AF\u09BC\u09BE\u09B0 \u0985\u09B0\u09CD\u09A5 \u09A8\u09BF\u09B0\u09BE\u09AA\u09A6 \u09A8\u09B9\u09AF\u09BC \u2014 \u09AE\u09A1\u09C7\u09B2\u09B0 \u0987\u09AF\u09BC\u09BE\u09A4 \u0995\u09CB\u09AC\u09B2\u0997\u09C0\u09AF\u09BC\u09BE \u098F\u0995\u09CB \u09A8\u09BE\u0987\u0964 \u09AC\u09B9\u09C1 \u09B8\u09AE\u09A4\u09B2 \u099A\u09B9\u09B0 \u098F\u0987 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A4 \u0986\u099B\u09C7\u0964",
    outsideTitle: "\u0985\u09A8\u09CD\u09A4\u09B0\u09CD\u09AD\u09C1\u0995\u09CD\u09A4 \u0985\u099E\u09CD\u099A\u09B2\u09B0 \u09AC\u09BE\u09B9\u09BF\u09B0\u09A4",
    outsideBody: "PAHARA-\u0987 \u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09AD\u09BE\u09B0\u09A4\u09B0 \u0986\u09A0\u0996\u09A8 \u0989\u09A4\u09CD\u09A4\u09B0-\u09AA\u09C2\u09AC \u09B0\u09BE\u099C\u09CD\u09AF \u09B8\u09BE\u09AE\u09B0\u09BF \u09B2\u09AF\u09BC\u0964",
    rainTitle: "\u0987\u09AF\u09BC\u09BE\u09A4 \u09AC\u09B0\u09B7\u09C1\u09A3",
    rainToday: "\u09AF\u09CB\u09B5\u09BE 24 \u0998\u09A3\u09CD\u099F\u09BE",
    rainWeek: "\u09AF\u09CB\u09B5\u09BE 7 \u09A6\u09BF\u09A8",
    showNumbers: "\u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09AC\u09CB\u09B0 \u09A6\u09C7\u0996\u09C1\u0993\u0995",
    hideNumbers: "\u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09AC\u09CB\u09B0 \u09B2\u09C1\u0995\u09C1\u0993\u09B5\u0995",
    numbersNote: "\u09AC\u09BF\u09AA\u09A6 = \u09AE\u09BE\u099F\u09BF \u0995\u09BF\u09AE\u09BE\u09A8 \u0996\u09BE\u09B0\u09C1 \u0986\u09B0\u09C1 \u09AD\u09BE\u0999\u09BF\u09AC \u09AA\u09B0\u09BE, \u0997\u09C1\u09A3 \u0995\u09BF\u09AE\u09BE\u09A8 \u09A4\u09BF\u09A4\u09BE\u0964 \u098F\u0995\u09BE \u098F\u0995\u09BE\u0987 \u0995\u09CB\u09A8\u09CB\u099F\u09CB\u0987 \u09AC\u09BF\u09AA\u09A6 \u09A8\u09B9\u09AF\u09BC\u0964",
    numbersSlope: "\u0922\u09BE\u09B2\u09B0 \u09AC\u09BF\u09AA\u09A6",
    numbersRain: "\u098F\u09A4\u09BF\u09AF\u09BC\u09BE\u09B0 \u09AC\u09B0\u09B7\u09C1\u09A3",
    numbersRisk: "\u0986\u099C\u09BF\u09B0 \u09AC\u09BF\u09AA\u09A6",
    reportCta: "\u09AD\u09C2\u09AE\u09BF\u09B8\u09CD\u0996\u09B2\u09A8\u09B0 \u0996\u09AC\u09B0 \u09A6\u09BF\u09AF\u09BC\u0995",
    detailsCta: "\u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3 \u09A1\u09C7\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1 \u0996\u09CB\u09B2\u0995",
    mapHint: "\u0986\u09A8 \u09A0\u09BE\u0987 \u099A\u09BE\u09AC\u09B2\u09C8 \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0\u09A4 \u099F\u09BF\u09AA\u0995\u0964",
    level: {
      Safe: {
        headline: "\u0986\u099C\u09BF \u09A8\u09BF\u09B0\u09BE\u09AA\u09A6",
        summary: "\u098F\u09A4\u09BF\u09AF\u09BC\u09BE \u098F\u0987 \u09A0\u09BE\u0987\u09B0 \u0993\u099A\u09B0\u09A4 \u09AD\u09C2\u09AE\u09BF\u09B8\u09CD\u0996\u09B2\u09A8\u09B0 \u09B8\u09AE\u09CD\u09AD\u09BE\u09AC\u09A8\u09BE \u09A8\u09BE\u0987\u0964",
        do1: "\u0986\u099C\u09BF \u098F\u0995\u09CB \u0995\u09B0\u09BF\u09AC\u09B2\u0997\u09C0\u09AF\u09BC\u09BE \u09A8\u09BE\u0987\u0964",
        do2: "\u09A7\u09C1\u09AE\u09C1\u09B9\u09BE \u09AC\u09B0\u09B7\u09C1\u09A3 \u0986\u09B0\u09AE\u09CD\u09AD \u09B9\u09B2\u09C7 \u09AA\u09C1\u09A8\u09B0 \u099A\u09BE\u0993\u0995\u0964",
        do3: "\u0993\u09B2\u09BE\u0987 \u09AF\u09CB\u09B5\u09BE \u09AA\u09A5\u099F\u09CB \u099C\u09BE\u09A8\u09BF \u09A5\u0995\u0995\u0964"
      },
      Watch: {
        headline: "\u09B8\u09A4\u09B0\u09CD\u0995 \u09B9\u0995",
        summary: "\u0987\u09AF\u09BC\u09BE\u09A4 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE \u09B8\u09B2\u09A8\u09BF \u09B9\u09AC \u09AA\u09BE\u09B0\u09C7\u0964 \u099A\u0995\u09C1 \u09B0\u09BE\u0996\u0995\u0964",
        do1: "\u09B2\u0997\u09B0 \u09A6\u09BF\u09A8\u099F\u09CB\u09B0 \u09AC\u09B0\u09B7\u09C1\u09A3\u09B2\u09C8 \u099A\u09BE\u0993\u0995\u0964",
        do2: "\u09AB\u09CB\u09A8 \u099A\u09BE\u09B0\u09CD\u099C \u0995\u09B0\u09BF \u09B0\u09BE\u0996\u0995 \u0986\u09B0\u09C1 \u098F\u0987 \u09AA\u09C3\u09B7\u09CD\u09A0\u09BE \u099A\u09C7\u09AD \u0995\u09B0\u0995\u0964",
        do3: "\u09AA\u09B0\u09BF\u09AF\u09BC\u09BE\u09B2\u09B0 \u09B8\u09C8\u09A4\u09C7 \u09A0\u09BF\u0995 \u0995\u09B0\u0995 \u0995\u09B2\u09C8 \u09AF\u09BE\u09AC\u0964"
      },
      Warning: {
        headline: "\u09AC\u09BF\u09AA\u09A6 \u2014 \u09AF\u09CB\u09B5\u09BE\u09B0 \u09B8\u09BE\u099C\u09C1 \u09B9\u0995",
        summary: "\u098F\u0987 \u09A0\u09BE\u0987\u09B0 \u0993\u099A\u09B0\u09A4 \u09AD\u09C2\u09AE\u09BF\u09B8\u09CD\u0996\u09B2\u09A8 \u09B9\u09AC \u09AA\u09BE\u09B0\u09C7\u0964 \u0993\u09B2\u09BE\u0987 \u09AF\u09CB\u09B5\u09BE\u09B0 \u09B8\u09BE\u099C\u09C1 \u09B9\u0995\u0964",
        do1: "\u0995\u09BE\u0997\u099C-\u09AA\u09A4\u09CD\u09B0, \u0942\u09B7\u09A7 \u0986\u09B0\u09C1 \u099F\u09B0\u09CD\u099A \u098F\u09A4\u09BF\u09AF\u09BC\u09BE\u0987 \u09B2\u0993\u0995\u0964",
        do2: "\u0996\u09BE\u09B0\u09C1 \u0922\u09BE\u09B2 \u0986\u09B0\u09C1 \u09AA\u09BE\u09B9\u09BE\u09B0 \u0995\u09BE\u099F\u09BF \u09AC\u09A8\u09CB\u09B5\u09BE \u09AA\u09A5 \u098F\u09B0\u09BE\u0987 \u099A\u09B2\u0995\u0964",
        do3: "\u099B\u09BF\u09AE\u09BE\u09B8\u0996\u09B2\u0995 \u0995\u0993\u0995, \u09AC\u09BF\u09B6\u09C7\u09B7\u0995\u09C8 \u09AF\u09BF\u09B8\u0995\u09B2\u09C7 \u0996\u09CB\u099C \u0995\u09BE\u09A2\u09BC\u09BF\u09AC \u09A8\u09CB\u09B5\u09BE\u09B0\u09C7\u0964"
      },
      Evacuate: {
        headline: "\u098F\u09A4\u09BF\u09AF\u09BC\u09BE\u0987 \u09A8\u09BF\u09B0\u09BE\u09AA\u09A6 \u09A0\u09BE\u0987\u09B2\u09C8 \u09AF\u09BE\u0993\u0995",
        summary: "\u098F\u0987 \u09A0\u09BE\u0987\u09B0 \u0993\u099A\u09B0\u09A4 \u09AD\u09C2\u09AE\u09BF\u09B8\u09CD\u0996\u09B2\u09A8\u09B0 \u09AA\u09CD\u09B0\u09AC\u09B2 \u09B8\u09AE\u09CD\u09AD\u09BE\u09AC\u09A8\u09BE\u0964 \u09B0\u09C8 \u09A8\u09BE\u09A5\u09BE\u0995\u09BF\u09AC\u0964",
        do1: "\u0922\u09BE\u09B2\u09B0 \u09AA\u09B0\u09BE \u0986\u0981\u09A4\u09B0\u09A4 \u09B8\u09AE\u09A4\u09B2, \u09AE\u09C1\u0995\u09B2\u09BF \u09A0\u09BE\u0987\u09B2\u09C8 \u09AF\u09BE\u0993\u0995\u0964",
        do2: "\u09AA\u09BE\u09B9\u09BE\u09B0 \u0995\u09BE\u099F\u09BF \u09AC\u09A8\u09CB\u09B5\u09BE \u09AA\u09A5 \u09AC\u09CD\u09AF\u09B5\u09B9\u09BE\u09B0 \u09A8\u0995\u09B0\u09BF\u09AC\u0964",
        do3: "\u0997\u09BE\u0981\u09B5\u09AC\u09C1\u09A2\u09BC\u09BE \u09AC\u09BE \u099C\u09BF\u09B2\u09BE \u09A8\u09BF\u09AF\u09BC\u09A8\u09CD\u09A4\u09CD\u09B0\u09A3 \u0995\u0995\u09CD\u09B7\u09B2\u09C8 \u09AB\u09CB\u09A8 \u0995\u09B0\u0995\u0964"
      }
    },
    reason: {
      steepWet: "\u098F\u0987\u099F\u09CB \u0996\u09BE\u09B0\u09C1 \u0986\u09B0\u09C1 \u09AD\u09BE\u0999\u09BF\u09AC \u09AA\u09B0\u09BE \u09AA\u09BE\u09B9\u09BE\u09B0, \u0986\u09B0\u09C1 \u09A7\u09C1\u09AE\u09C1\u09B9\u09BE \u09AC\u09B0\u09B7\u09C1\u09A3 \u09B9\u09C8\u099B\u09C7\u0964",
      steepDry: "\u0987\u09AF\u09BC\u09BE\u09B0 \u09AA\u09BE\u09B9\u09BE\u09B0 \u09AD\u09BE\u0999\u09BF\u09AC \u09AA\u09BE\u09B0\u09C7, \u0995\u09BF\u09A8\u09CD\u09A4\u09C1 \u09AC\u09B0\u09B7\u09C1\u09A3 \u0995\u09AE \u09B9\u09C8\u099B\u09C7\u0964 \u09AC\u09B0\u09B7\u09C1\u09A3\u09C7\u0987 \u09AD\u09C2\u09AE\u09BF\u09B8\u09CD\u0996\u09B2\u09A8 \u0986\u09B0\u09AE\u09CD\u09AD \u0995\u09B0\u09C7\u0964",
      gentleWet: "\u09A7\u09C1\u09AE\u09C1\u09B9\u09BE \u09AC\u09B0\u09B7\u09C1\u09A3 \u09B9\u09C8\u099B\u09C7, \u0995\u09BF\u09A8\u09CD\u09A4\u09C1 \u0987\u09AF\u09BC\u09BE\u09B0 \u09AE\u09BE\u099F\u09BF \u09B8\u09B9\u099C\u09C7 \u09AD\u09BE\u0999\u09BF\u09AC \u09AA\u09B0\u09BE\u0995\u09C8 \u0996\u09BE\u09B0\u09C1 \u09A8\u09B9\u09AF\u09BC\u0964",
      gentleDry: "\u0987\u09AF\u09BC\u09BE\u09B0 \u09AE\u09BE\u099F\u09BF \u0996\u09BE\u09B0\u09C1 \u09A8\u09B9\u09AF\u09BC, \u0986\u09B0\u09C1 \u09AC\u09B0\u09B7\u09C1\u09A3\u09C0\u0993 \u0995\u09AE \u09B9\u09C8\u099B\u09C7\u0964"
    }
  },
  welcome: {
    title: "PAHARA-\u09B2\u09C8 \u0986\u09AA\u09CB\u09A8\u09BE\u0995 \u09B8\u09BE\u09A6\u09B0 \u09B8\u09AE\u09CD\u09AD\u09BE\u09B7\u09A3",
    subtitle: "\u0989\u09A4\u09CD\u09A4\u09B0-\u09AA\u09C2\u09AC \u09AD\u09BE\u09B0\u09A4\u09B0 \u09AD\u09C2\u09AE\u09BF\u09B8\u09CD\u0996\u09B2\u09A8 \u09B8\u0982\u0995\u09C7\u09A4",
    s1Title: "\u0986\u09AA\u09C1\u09A8\u09BE\u09B0 \u0997\u09BE\u0981\u09B5 \u09AC\u09BF\u099A\u09BE\u09B0\u0995",
    s1Body: "\u09A0\u09BE\u0987\u09B0 \u09A8\u09BE\u09AE \u09B2\u09BF\u0996\u0995 \u0986\u09B0\u09C1 \u099A\u09BE\u0993\u0995 \u0986\u099C\u09BF \u09A4\u09BE\u09A4 \u09AD\u09C2\u09AE\u09BF\u09B8\u09CD\u0996\u09B2\u09A8\u09B0 \u09B8\u09AE\u09CD\u09AD\u09BE\u09AC\u09A8\u09BE \u0986\u099B\u09C7 \u09A8\u09C7 \u09A8\u09BE\u0987\u0964",
    s2Title: "\u09A6\u09C1\u099F\u09BE \u0995\u09BE\u09B0\u09A3\u09A4 \u09AD\u09C2\u09AE\u09BF\u09B8\u09CD\u0996\u09B2\u09A8 \u09B9\u09AF\u09BC",
    s2Body: "\u09AD\u09BE\u0999\u09BF\u09AC \u09AA\u09B0\u09BE \u098F\u0996\u09A8 \u0922\u09BE\u09B2, \u0986\u09B0\u09C1 \u09A4\u09BE\u0995 \u0986\u09B0\u09AE\u09CD\u09AD \u0995\u09B0\u09BF\u09AC \u09AA\u09B0\u09BE \u09AC\u09B0\u09B7\u09C1\u09A3\u0964 \u098F\u0995\u09BE \u098F\u0995\u09BE\u0987 \u09AC\u09BF\u09AA\u09A6 \u09A8\u09B9\u09AF\u09BC \u2014 PAHARA-\u0987 \u09A6\u09C1\u09AF\u09BC\u09CB\u099F\u09BE\u0987 \u099A\u09BE\u09AF\u09BC\u0964",
    s3Title: "\u09B0\u0999\u09B0 \u0985\u09B0\u09CD\u09A5 \u0995\u09BE\u09B0\u09CD\u09AF",
    s3Body: "\u09B8\u09AC\u09C1\u099C \u09A8\u09BF\u09B0\u09BE\u09AA\u09A6, \u09B9\u09BE\u09B2\u09A7\u09C0\u09AF\u09BC\u09BE \u09B8\u09A4\u09B0\u09CD\u0995, \u0995\u09AE\u09B2\u09BE \u09B8\u09BE\u099C\u09C1 \u09B9\u0993\u0995, \u09B0\u0999\u09BE \u098F\u09A4\u09BF\u09AF\u09BC\u09BE\u0987 \u0993\u09B2\u09BE\u0993\u0995\u0964",
    start: "\u0986\u09B0\u09AE\u09CD\u09AD \u0995\u09B0\u0995",
    skip: "\u098F\u09B0\u0995",
    reopen: "\u09B8\u09B9\u09BE\u09AF\u09BC \u0986\u0987\u0995\u09A8\u09B0 \u09AA\u09B0\u09BE \u098F\u0987\u099F\u09CB \u09AA\u09C1\u09A8\u09B0 \u099A\u09BE\u09AC \u09AA\u09BE\u09B0\u09BF\u09AC\u0964"
  }
};

// src/components/PlaceSearch.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// src/lib/colors.js
var SUSCEPT_CLASSES = [
  { key: "Very Low", color: "#2b83ba" },
  { key: "Low", color: "#abdda4" },
  { key: "Moderate", color: "#ffffbf" },
  { key: "High", color: "#fdae61" },
  { key: "Very High", color: "#d7191c" }
];
var SUSCEPT_COLOR = Object.fromEntries(
  SUSCEPT_CLASSES.map((c) => [c.key, c.color])
);
var RISK_CLASSES = [
  { key: "Safe", color: "#22c55e", from: 0, to: 0.25 },
  { key: "Watch", color: "#eab308", from: 0.25, to: 0.5 },
  { key: "Warning", color: "#f97316", from: 0.5, to: 0.7 },
  { key: "Evacuate", color: "#dc2626", from: 0.7, to: 1 }
];
var RISK_COLOR = Object.fromEntries(RISK_CLASSES.map((c) => [c.key, c.color]));
var RISK_TEXT_ON = {
  Safe: "#052e16",
  Watch: "#1c1401",
  Warning: "#1f0d02",
  Evacuate: "#ffffff"
};

// src/lib/riskEngine.js
var RAIN24_MAX = 250;
var RAIN7D_MAX = 500;
var INTENSITY_REF = 100;
var ANTECEDENT_REF = 250;
var WEIGHT_INTENSITY = 0.65;
var WEIGHT_ANTECEDENT = 0.35;
function clamp(value, min = 0, max = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}
function intensityOf(rain24h) {
  return Math.min((Number(rain24h) || 0) / INTENSITY_REF, 1);
}
function antecedentOf(rain7d) {
  return Math.min((Number(rain7d) || 0) / ANTECEDENT_REF, 1);
}
function computeTrigger(rain24h, rain7d) {
  const intensity = intensityOf(rain24h);
  const antecedent = antecedentOf(rain7d);
  return clamp(WEIGHT_INTENSITY * intensity + WEIGHT_ANTECEDENT * antecedent, 0, 1);
}
function computeRisk(susceptibility, trigger) {
  return clamp((Number(susceptibility) || 0) * (Number(trigger) || 0), 0, 1);
}
function riskClass(v) {
  const n = Number(v) || 0;
  if (n < 0.25) return "Safe";
  if (n < 0.5) return "Watch";
  if (n < 0.7) return "Warning";
  return "Evacuate";
}
function triggerBreakdown(rain24h, rain7d) {
  const intensity = intensityOf(rain24h);
  const antecedent = antecedentOf(rain7d);
  return {
    intensity,
    antecedent,
    trigger: clamp(WEIGHT_INTENSITY * intensity + WEIGHT_ANTECEDENT * antecedent, 0, 1)
  };
}

// src/lib/openMeteo.js
var FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
var HOURLY_QUERY = "hourly=precipitation&past_days=7&forecast_days=4";
var LEAD_HOURS = [0, 24, 48, 72];
var OPEN_METEO_URL = `${FORECAST_BASE}?latitude=25.4&longitude=93.0&${HOURLY_QUERY}`;
var RAIN_NODE_DEG = 0.5;
async function fetchRainfall({ signal } = {}) {
  const res = await fetch(OPEN_METEO_URL, { signal });
  if (!res.ok) throw new Error(`Open-Meteo returned HTTP ${res.status}`);
  const data = await res.json();
  const series = data?.hourly?.precipitation;
  if (!Array.isArray(series) || series.length === 0) {
    throw new Error("No precipitation series in the response");
  }
  return {
    ...summariseSeries(data),
    hours: series.length,
    windowEnd: lastTime(data),
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function nodeKeyFor(lat, lon, step = RAIN_NODE_DEG) {
  const a = Number(lat);
  const b = Number(lon);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return `${Math.floor(a / step)}:${Math.floor(b / step)}`;
}
function summariseSeries(payload, at = Date.now()) {
  const series = payload?.hourly?.precipitation;
  const times = payload?.hourly?.time;
  const end = anchorIndex(times, series.length, at);
  const leads = {};
  for (const lead of LEAD_HOURS) {
    const stop = end + lead;
    const clamped = Math.min(stop, series.length - 1);
    leads[lead] = {
      lead,
      rain24h: round1(sumWindow(series, clamped, 24)),
      rain7d: round1(sumWindow(series, clamped, 168)),
      at: Array.isArray(times) ? times[clamped] ?? null : null,
      // true when the API did not return far enough ahead to cover this lead,
      // in which case the figures are those of the furthest hour it did return
      truncated: stop > series.length - 1
    };
  }
  return { ...leads[0], leads };
}
function anchorIndex(times, length, at = Date.now()) {
  const fallback = Math.min(Math.max(length - 1, 0), 167);
  if (!Array.isArray(times) || times.length === 0) return fallback;
  let lo = 0;
  let hi = Math.min(times.length, length) - 1;
  let best = -1;
  while (lo <= hi) {
    const mid = lo + hi >> 1;
    const ms = parseHour(times[mid]);
    if (!Number.isFinite(ms)) return fallback;
    if (ms <= at) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best < 0 ? fallback : best;
}
var HOUR_STAMP = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?([Zz]|[+-]\d{2}:?\d{2})?$/;
function parseHour(stamp) {
  if (typeof stamp !== "string") return NaN;
  const m = HOUR_STAMP.exec(stamp.trim());
  if (!m) return NaN;
  return Date.parse(m[2] ? stamp.trim() : `${m[1]}:00Z`);
}
function sumWindow(series, endIdx, hours) {
  let total = 0;
  for (let i = Math.max(0, endIdx - hours + 1); i <= endIdx; i += 1) {
    const n = Number(series[i]);
    if (Number.isFinite(n)) total += n;
  }
  return total;
}
function lastTime(payload) {
  const times = payload?.hourly?.time;
  return Array.isArray(times) && times.length ? times[times.length - 1] : null;
}
function round1(n) {
  return Math.round(n * 10) / 10;
}

// src/lib/placeSearch.js
import Fuse from "fuse.js";

// src/lib/geo.js
var R_KM = 6371.0088;
var toRad = (d) => d * Math.PI / 180;
function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}
var POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function bearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const deg = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  return { deg, compass: POINTS[Math.round(deg / 45) % 8] };
}
function nearestCell(cells2, lat, lon) {
  let best = null;
  let bestKm = Infinity;
  for (let i = 0; i < cells2.length; i += 1) {
    const c = cells2[i];
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) continue;
    if (Math.abs(c.lat - lat) * 111.32 >= bestKm) continue;
    const km = haversineKm(lat, lon, c.lat, c.lon);
    if (km < bestKm) {
      bestKm = km;
      best = c;
    }
  }
  return best ? { cell: best, km: bestKm } : null;
}
function nearestHigherRisk(cells2, lat, lon, risk, radiusKm = 10, margin = 0.05) {
  let best = null;
  let bestKm = Infinity;
  for (let i = 0; i < cells2.length; i += 1) {
    const c = cells2[i];
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) continue;
    if (!(c.risk > risk + margin)) continue;
    if (Math.abs(c.lat - lat) * 111.32 >= Math.min(bestKm, radiusKm)) continue;
    const km = haversineKm(lat, lon, c.lat, c.lon);
    if (km <= radiusKm && km < bestKm) {
      bestKm = km;
      best = c;
    }
  }
  return best ? { cell: best, km: bestKm, ...bearing(lat, lon, best.lat, best.lon) } : null;
}

// src/lib/placeSearch.js
var BBOX = { latMin: 21.5, latMax: 29.6, lonMin: 87.8, lonMax: 97.5 };
var NEAR_CELL_KM = 5;
var FAR_CELL_KM = 40;
var MAX_RESULTS = 8;
var DEBOUNCE_MS = 150;
var SUGGESTIONS = ["Guwahati", "Aizawl", "Shillong", "Itanagar", "Kohima"];
var RECENT_KEY = "pahara.recentSearches";
var RECENT_MAX = 5;
var FUSE_OPTIONS = {
  keys: [
    { name: "name", weight: 0.8 },
    { name: "district", weight: 0.15 },
    { name: "state", weight: 0.05 }
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeScore: true
};
function buildIndex(places2) {
  return new Fuse(places2, FUSE_OPTIONS);
}
function searchPlaces(fuse, query, limit = MAX_RESULTS) {
  if (!fuse || !query || query.trim().length < 2) return [];
  return fuse.search(query.trim(), { limit }).map((r) => ({ ...r.item, score: r.score }));
}
function insideRegion(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= BBOX.latMin && lat <= BBOX.latMax && lon >= BBOX.lonMin && lon <= BBOX.lonMax;
}
function resolvePlace(point, scoredCells) {
  const lat = Number(point?.lat);
  const lon = Number(point?.lon);
  if (!insideRegion(lat, lon)) return { verdict: "outside", point };
  if (!scoredCells?.length) return { verdict: "unmonitored", point, km: null };
  const hit = nearestCell(scoredCells, lat, lon);
  if (!hit || hit.km > FAR_CELL_KM) {
    return { verdict: "unmonitored", point, km: hit ? hit.km : null };
  }
  const { cell, km } = hit;
  return {
    verdict: "ok",
    point,
    cell,
    km,
    // the cell is a stand-in for somewhere the place is not
    distant: km > NEAR_CELL_KM,
    higher: nearestHigherRisk(scoredCells, lat, lon, cell.risk, 10)
  };
}
var PHOTON_URL = "https://photon.komoot.io/api/";
async function geocode(query, { signal, limit = 5 } = {}) {
  const url = `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=${limit}&lat=${(BBOX.latMin + BBOX.latMax) / 2}&lon=${(BBOX.lonMin + BBOX.lonMax) / 2}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Photon returned HTTP ${res.status}`);
  const data = await res.json();
  return (data?.features ?? []).map((f, i) => {
    const c = f?.geometry?.coordinates;
    const p = f?.properties ?? {};
    if (!Array.isArray(c) || c.length < 2) return null;
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
      geocoded: true
    };
  }).filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lon));
}
function loadRecents() {
  try {
    const raw2 = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(raw2) ? raw2.filter((r) => r && r.name).slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

// src/components/PlaceSearch.jsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function PlaceSearch({
  places: places2,
  rainField,
  uniformRain,
  onSelect,
  autoFocus = false,
  compact = false
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState({ status: "idle", results: [] });
  const [recents, setRecents] = useState(() => loadRecents());
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const remoteAbort = useRef(null);
  const fuse = useMemo(() => buildIndex(places2), [places2]);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);
  const local = useMemo(
    () => searchPlaces(fuse, debounced, MAX_RESULTS),
    [fuse, debounced]
  );
  useEffect(() => {
    remoteAbort.current?.abort();
    const q = debounced.trim();
    if (local.length > 0 || q.length < 3) {
      setRemote({ status: "idle", results: [] });
      return;
    }
    const controller = new AbortController();
    remoteAbort.current = controller;
    setRemote({ status: "loading", results: [] });
    geocode(q, { signal: controller.signal }).then((results2) => setRemote({ status: "ready", results: results2 })).catch((err) => {
      if (err.name === "AbortError") return;
      setRemote({ status: "error", results: [] });
    });
    return () => controller.abort();
  }, [debounced, local.length]);
  const results = local.length ? local : remote.results;
  const showEmptyState = debounced.trim().length < 2;
  useEffect(() => setActive(0), [debounced, results.length]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  const triggerAt = useCallback(
    (lat, lon) => {
      const hit = rainField?.get(nodeKeyFor(lat, lon));
      return hit ? computeTrigger(hit.rain24h, hit.rain7d) : computeTrigger(uniformRain?.rain24h, uniformRain?.rain7d);
    },
    [rainField, uniformRain]
  );
  const choose = useCallback(
    (place) => {
      if (!place) return;
      setOpen(false);
      setQuery("");
      setDebounced("");
      inputRef.current?.blur();
      onSelect?.(place);
      setRecents(loadRecents());
    },
    [onSelect]
  );
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open) {
      if (e.key === "ArrowDown") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (results.length) {
        e.preventDefault();
        choose(results[active]);
      }
    }
  };
  const pickByName = (name) => {
    const exact = places2.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (exact) return choose(exact);
    const near = searchPlaces(fuse, name, 1);
    if (near.length) choose(near[0]);
  };
  return /* @__PURE__ */ jsxs("div", { ref: rootRef, className: `relative ${compact ? "w-full" : "w-[288px]"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxs(
        "svg",
        {
          className: "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500",
          width: "13",
          height: "13",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2.2",
          strokeLinecap: "round",
          children: [
            /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "7" }),
            /* @__PURE__ */ jsx("path", { d: "M20 20l-3.5-3.5" })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: inputRef,
          type: "search",
          value: query,
          onChange: (e) => {
            setQuery(e.target.value);
            setOpen(true);
          },
          onFocus: () => setOpen(true),
          onKeyDown,
          placeholder: t("search.placeholder"),
          "aria-label": t("search.placeholder"),
          "aria-expanded": open,
          "aria-controls": "place-search-list",
          "aria-autocomplete": "list",
          role: "combobox",
          className: "field !py-2 !pl-8 !pr-8"
        }
      ),
      query && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            setQuery("");
            setDebounced("");
            inputRef.current?.focus();
          },
          "aria-label": t("search.clear"),
          className: "absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200",
          children: /* @__PURE__ */ jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", children: /* @__PURE__ */ jsx("path", { d: "M6 6l12 12M18 6L6 18" }) })
        }
      )
    ] }),
    open && /* @__PURE__ */ jsx("div", { className: "panel absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden", children: showEmptyState ? /* @__PURE__ */ jsxs("div", { className: "px-3 py-2.5", children: [
      recents.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("p", { className: "label", children: t("search.recent") }),
        /* @__PURE__ */ jsx("div", { className: "mb-2.5 flex flex-wrap gap-1", children: recents.map((r) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => choose(r),
            className: "rounded-sm border border-line bg-ink-700 px-2 py-1 text-[11px] text-slate-300 transition hover:border-slate-600 hover:text-slate-100",
            children: r.name
          },
          `${r.name}-${r.lat}`
        )) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "label", children: t("search.suggestions") }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: SUGGESTIONS.map((name) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => pickByName(name),
          className: "rounded-sm border border-sky-900 bg-sky-950/50 px-2 py-1 text-[11px] text-sky-200 transition hover:border-sky-700 hover:bg-sky-900/60",
          children: name
        },
        name
      )) })
    ] }) : results.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-3 py-2.5 text-[11px] leading-relaxed text-muted", children: remote.status === "loading" ? t("search.searching") : t("search.noResults") }) : /* @__PURE__ */ jsx(
      "ul",
      {
        ref: listRef,
        id: "place-search-list",
        role: "listbox",
        className: "scroll-thin max-h-[268px] overflow-y-auto",
        children: results.map((p, i) => {
          const trig = triggerAt(p.lat, p.lon);
          const known = Number.isFinite(p.susceptibility);
          const cls = known ? riskClass(computeRisk(p.susceptibility, trig)) : null;
          const where = [p.district, p.state].filter(Boolean).join(", ");
          return /* @__PURE__ */ jsx("li", { role: "option", "aria-selected": i === active, children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              "data-active": i === active,
              onMouseEnter: () => setActive(i),
              onClick: () => choose(p),
              className: `flex w-full items-center gap-2.5 border-l-2 px-2.5 py-1.5 text-left transition ${i === active ? "border-l-sky-400 bg-ink-600" : "border-l-transparent hover:bg-ink-700"}`,
              children: [
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "h-2 w-2 shrink-0 rounded-full",
                    style: { background: cls ? RISK_COLOR[cls] : "#334155" },
                    title: cls ? t(`risk.${cls}`) : t("search.noRiskData")
                  }
                ),
                /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "block truncate text-[12px] font-medium text-slate-100", children: p.name }),
                  /* @__PURE__ */ jsx("span", { className: "block truncate text-[10px] text-slate-500", children: p.geocoded ? t("search.fromGeocoder") : where || t("search.unknownArea") })
                ] })
              ]
            }
          ) }, p.id ?? `${p.name}-${i}`);
        })
      }
    ) })
  ] });
}

// src/components/PlaceResultCard.jsx
import { useTranslation as useTranslation2 } from "react-i18next";

// src/lib/factors.js
var FEATURE_SPECS = {
  slope_deg: { labelKey: "slope", unit: "deg", ref: 45, digits: 1 },
  slope_mean_deg: { labelKey: "slopeMean", unit: "deg", ref: 45, digits: 1 },
  relief_m: { labelKey: "relief", unit: "m", ref: 1200, digits: 0 },
  elevation_m: { labelKey: "elevation", unit: "m", ref: 3e3, digits: 0 },
  roughness_m: { labelKey: "roughness", unit: "m", ref: 250, digits: 0 },
  tpi_m: { labelKey: "tpi", unit: "m", ref: 200, digits: 0, signed: true },
  curvature: { labelKey: "curvature", unit: null, ref: 0.5, digits: 3, signed: true },
  // legacy Dima Hasao predictors - kept so the old district grid still renders
  dist_stream_m: { labelKey: "stream", unit: "m", ref: 2e3, digits: 0, invert: true },
  dist_road_m: { labelKey: "road", unit: "m", ref: 5e3, digits: 0 }
};
var NON_BAR = /* @__PURE__ */ new Set(["aspect_sin", "aspect_cos"]);
var REF = Object.fromEntries(
  Object.entries(FEATURE_SPECS).map(([k, v]) => [k, v.ref])
);
var clamp01 = (v) => Math.min(Math.max(v, 0), 1);
function bar(key, value, unit, norm, extra = {}) {
  const missing = value === null || value === void 0 || !Number.isFinite(Number(value));
  return {
    key,
    value: missing ? null : Number(value),
    unit,
    norm: missing ? null : clamp01(norm),
    ...extra
  };
}
function normalise(spec, value) {
  const v = Number(value);
  if (spec.invert) return 1 - v / spec.ref;
  if (spec.signed) return Math.abs(v) / spec.ref;
  return v / spec.ref;
}
function terrainFactors(cell = {}, features = null, importance = null) {
  const list = Array.isArray(features) && features.length ? features : (
    // no metadata: fall back to whatever known predictors the cell carries
    Object.keys(FEATURE_SPECS).filter((k) => cell[k] !== void 0 && cell[k] !== null)
  );
  const bars = list.filter((k) => !NON_BAR.has(k)).filter((k) => FEATURE_SPECS[k]).filter((k) => cell[k] !== void 0).map((k) => {
    const spec = FEATURE_SPECS[k];
    return bar(spec.labelKey, cell[k], spec.unit, normalise(spec, cell[k]), {
      property: k,
      digits: spec.digits,
      importance: Number(importance?.[k]) || null
    });
  });
  if (importance) {
    bars.sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
  }
  return bars;
}
function aspectOf(cell = {}) {
  let deg = null;
  if (Number.isFinite(Number(cell.aspect_deg))) {
    deg = Number(cell.aspect_deg);
  } else if (Number.isFinite(Number(cell.aspect_sin)) && Number.isFinite(Number(cell.aspect_cos))) {
    deg = Math.atan2(Number(cell.aspect_sin), Number(cell.aspect_cos)) * 180 / Math.PI;
  }
  if (deg === null) return null;
  const norm = (deg % 360 + 360) % 360;
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return { deg: norm, compass: points[Math.round(norm / 45) % 8] };
}
function triggerFactors(rain24h, rain7d) {
  return [
    bar("intensity", rain24h, "mm", intensityOf(rain24h), { digits: 0 }),
    bar("antecedent", rain7d, "mm", antecedentOf(rain7d), { digits: 0 })
  ];
}
function exposureFactors(cell = {}) {
  const out = [];
  if (cell.dist_road_m !== void 0 && cell.dist_road_m !== null) {
    const spec = FEATURE_SPECS.dist_road_m;
    out.push(
      bar("road", cell.dist_road_m, spec.unit, normalise(spec, cell.dist_road_m), {
        property: "dist_road_m",
        digits: 0
      })
    );
  }
  if (cell.dist_village_km !== void 0 && cell.dist_village_km !== null) {
    out.push(
      bar("village_distance", cell.dist_village_km, "km", 1 - Number(cell.dist_village_km) / 20, {
        property: "dist_village_km",
        digits: 1
      })
    );
  }
  return out;
}

// src/components/PlaceResultCard.jsx
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function PlaceResultCard({
  result,
  features = null,
  importance = null,
  onClose
}) {
  const { t } = useTranslation2();
  if (!result) return null;
  const { verdict, point } = result;
  const where = [point.district, point.state].filter(Boolean).join(", ");
  return /* @__PURE__ */ jsxs2("section", { className: "panel pointer-events-auto w-full shrink-0 border-b-0 sm:w-[340px]", children: [
    /* @__PURE__ */ jsxs2("div", { className: "panel-header", children: [
      /* @__PURE__ */ jsxs2("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx2("span", { className: "panel-title", children: t("search.resultTitle") }),
        /* @__PURE__ */ jsx2("p", { className: "mt-1 truncate text-sm font-semibold text-slate-100", children: point.name }),
        where && /* @__PURE__ */ jsx2("p", { className: "mt-0.5 truncate text-[10px] text-slate-400", children: where })
      ] }),
      /* @__PURE__ */ jsx2(
        "button",
        {
          type: "button",
          onClick: onClose,
          "aria-label": t("common.close"),
          className: "btn !px-2 !py-1",
          children: /* @__PURE__ */ jsx2("svg", { width: "12", height: "12", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", children: /* @__PURE__ */ jsx2("path", { d: "M6 6l12 12M18 6L6 18" }) })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "scroll-thin max-h-[46vh] overflow-y-auto px-3 py-3", children: [
      verdict === "outside" && /* @__PURE__ */ jsx2("p", { className: "rounded border border-amber-800 bg-amber-950/40 px-3 py-2.5 text-[11px] leading-relaxed text-amber-200/85", children: t("search.outsideRegion") }),
      verdict === "unmonitored" && /* @__PURE__ */ jsx2("p", { className: "rounded border border-slate-700 bg-ink-900/70 px-3 py-2.5 text-[11px] leading-relaxed text-slate-300", children: result.km == null ? t("search.unmonitored") : t("search.unmonitoredNear", { km: result.km.toFixed(1) }) }),
      verdict === "ok" && /* @__PURE__ */ jsx2(Assessment, { result, features, importance })
    ] })
  ] });
}
function Assessment({ result, features, importance }) {
  const { t } = useTranslation2();
  const { cell, km, distant, higher, point } = result;
  const cls = cell.riskClass;
  const terrain = terrainFactors(cell, features, importance);
  const rain = triggerFactors(cell.rain24h, cell.rain7d);
  const pop = point.population ?? cell.population;
  return /* @__PURE__ */ jsxs2(Fragment2, { children: [
    /* @__PURE__ */ jsxs2("div", { className: "grid grid-cols-2 gap-2", children: [
      /* @__PURE__ */ jsxs2(
        "div",
        {
          className: "rounded border px-2.5 py-2",
          style: { background: `${RISK_COLOR[cls]}1f`, borderColor: `${RISK_COLOR[cls]}80` },
          children: [
            /* @__PURE__ */ jsx2("p", { className: "label mb-1.5", children: t("search.liveRisk") }),
            /* @__PURE__ */ jsx2(
              "span",
              {
                className: "inline-block rounded px-2 py-1 text-[12px] font-bold uppercase tracking-wider",
                style: { background: RISK_COLOR[cls], color: RISK_TEXT_ON[cls] },
                children: t(`risk.${cls}`)
              }
            ),
            /* @__PURE__ */ jsx2("p", { className: "tabular mt-1.5 text-lg font-bold leading-none text-slate-50", children: cell.risk.toFixed(2) })
          ]
        }
      ),
      /* @__PURE__ */ jsxs2("div", { className: "rounded border border-line bg-ink-900/70 px-2.5 py-2", children: [
        /* @__PURE__ */ jsx2("p", { className: "label mb-1.5", children: t("search.staticSusceptibility") }),
        /* @__PURE__ */ jsxs2("span", { className: "inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-200", children: [
          cell.suscept_class && /* @__PURE__ */ jsx2(
            "span",
            {
              className: "h-2.5 w-2.5 rounded-[2px]",
              style: { background: SUSCEPT_COLOR[cell.suscept_class] || "#334155" }
            }
          ),
          cell.suscept_class ? t(`suscept.${cell.suscept_class}`) : "\u2014"
        ] }),
        /* @__PURE__ */ jsx2("p", { className: "tabular mt-1.5 text-lg font-bold leading-none text-slate-300", children: Number(cell.susceptibility).toFixed(2) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("p", { className: "tabular mt-2 text-center text-[10px] text-slate-500", children: [
      Number(cell.susceptibility).toFixed(2),
      " \xD7 ",
      cell.trigger.toFixed(2),
      " =",
      " ",
      /* @__PURE__ */ jsx2("span", { className: "font-semibold text-slate-300", children: cell.risk.toFixed(2) }),
      /* @__PURE__ */ jsx2("span", { className: "ml-1.5 uppercase tracking-[0.11em]", children: t("inspector.equation") })
    ] }),
    distant && /* @__PURE__ */ jsx2("p", { className: "mt-2 rounded border border-slate-700 bg-ink-900/70 px-2.5 py-1.5 text-[10px] leading-relaxed text-slate-400", children: t("search.nearestCell", { km: km.toFixed(1) }) }),
    higher && /* @__PURE__ */ jsx2("p", { className: "mt-2 rounded border border-orange-900 bg-orange-950/40 px-2.5 py-1.5 text-[11px] leading-relaxed text-orange-200/90", children: t("search.higherRisk", {
      km: higher.km.toFixed(1),
      dir: higher.compass,
      cls: t(`risk.${higher.cell.riskClass}`)
    }) }),
    /* @__PURE__ */ jsx2("h4", { className: "mt-3 text-[9px] font-semibold uppercase tracking-[0.13em] text-amber-400/90", children: t("inspector.triggerGroup") }),
    /* @__PURE__ */ jsx2("div", { className: "mt-1.5 space-y-1", children: rain.map((f) => /* @__PURE__ */ jsx2(MiniBar, { factor: f, label: t(`factor.${f.key}`), accent: "#eab308" }, f.key)) }),
    terrain.length > 0 && /* @__PURE__ */ jsxs2(Fragment2, { children: [
      /* @__PURE__ */ jsx2("h4", { className: "mt-3 text-[9px] font-semibold uppercase tracking-[0.13em] text-sky-400/90", children: t("inspector.terrain") }),
      /* @__PURE__ */ jsx2("div", { className: "mt-1.5 space-y-1", children: terrain.slice(0, 5).map((f) => /* @__PURE__ */ jsx2(
        MiniBar,
        {
          factor: f,
          label: t(`factor.${f.key}`),
          accent: "#38bdf8"
        },
        f.property || f.key
      )) })
    ] }),
    /* @__PURE__ */ jsxs2("dl", { className: "mt-3 space-y-1.5 border-t border-line pt-2.5", children: [
      /* @__PURE__ */ jsx2(Row, { label: t("inspector.population"), children: pop === null || pop === void 0 ? /* @__PURE__ */ jsx2("span", { className: "text-slate-500", children: t("search.populationUnknown") }) : /* @__PURE__ */ jsxs2("span", { className: "flex items-center justify-end gap-1.5", children: [
        /* @__PURE__ */ jsx2("span", { className: "tabular", children: Number(pop).toLocaleString() }),
        point.population_estimated === true && /* @__PURE__ */ jsx2("span", { className: "chip border-amber-800 bg-amber-950/60 text-amber-300", children: t("inspector.estimated") })
      ] }) }),
      /* @__PURE__ */ jsx2(Row, { label: t("inspector.coords"), children: /* @__PURE__ */ jsxs2("span", { className: "tabular", children: [
        point.lat.toFixed(3),
        "\xB0N, ",
        point.lon.toFixed(3),
        "\xB0E"
      ] }) })
    ] })
  ] });
}
function MiniBar({ factor, label, accent }) {
  const { t } = useTranslation2();
  const missing = factor.norm === null;
  return /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx2("span", { className: "w-[86px] shrink-0 truncate text-[10px] text-slate-400", children: label }),
    /* @__PURE__ */ jsx2("div", { className: "h-1 flex-1 overflow-hidden rounded-sm bg-ink-600", children: !missing && /* @__PURE__ */ jsx2("div", { className: "h-full rounded-sm", style: { width: `${factor.norm * 100}%`, background: accent } }) }),
    /* @__PURE__ */ jsx2("span", { className: "tabular w-[58px] shrink-0 text-right text-[10px] text-slate-300", children: missing ? /* @__PURE__ */ jsx2("span", { className: "text-slate-600", children: t("inspector.noData") }) : /* @__PURE__ */ jsxs2(Fragment2, { children: [
      Number(factor.value).toFixed(factor.digits ?? 1),
      factor.unit && /* @__PURE__ */ jsx2("span", { className: "ml-0.5 text-[9px] text-muted", children: factor.unit === "deg" ? t("units.deg") : t(`units.${factor.unit}`) })
    ] }) })
  ] });
}
function Row({ label, children }) {
  return /* @__PURE__ */ jsxs2("div", { className: "flex items-baseline justify-between gap-3", children: [
    /* @__PURE__ */ jsx2("dt", { className: "text-[10px] text-muted", children: label }),
    /* @__PURE__ */ jsx2("dd", { className: "text-right text-[11px] text-slate-200", children })
  ] });
}

// src/components/CellInspector.jsx
import { useTranslation as useTranslation3 } from "react-i18next";
import { Fragment as Fragment3, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function CellInspector({
  cell,
  trigger,
  rain24h,
  rain7d,
  features = null,
  importance = null,
  onClose
}) {
  const { t } = useTranslation3();
  if (!cell) return null;
  const cellTrigger = Number.isFinite(Number(cell.trigger)) ? Number(cell.trigger) : trigger;
  const cellRain24h = Number.isFinite(Number(cell.rain24h)) ? Number(cell.rain24h) : rain24h;
  const cellRain7d = Number.isFinite(Number(cell.rain7d)) ? Number(cell.rain7d) : rain7d;
  const susceptibility = Number(cell.susceptibility) || 0;
  const risk = computeRisk(susceptibility, cellTrigger);
  const cls = riskClass(risk);
  const terrain = terrainFactors(cell, features, importance);
  const exposure = exposureFactors(cell);
  const aspect = aspectOf(cell);
  const place = [cell.district, cell.state].filter(Boolean).join(", ");
  return /* @__PURE__ */ jsxs3("aside", { className: "pointer-events-auto flex h-full w-full animate-slide-in flex-col border-l border-line bg-ink-800/95 shadow-2xl shadow-black/70 backdrop-blur sm:w-[340px]", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex items-start justify-between gap-2 border-b border-line px-4 py-3", children: [
      /* @__PURE__ */ jsxs3("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx3("p", { className: "panel-title", children: t("inspector.title") }),
        /* @__PURE__ */ jsx3("p", { className: "tabular mt-1 truncate text-sm font-semibold text-slate-100", children: cell.cell_id }),
        place && /* @__PURE__ */ jsx3("p", { className: "mt-0.5 truncate text-[10px] text-slate-400", children: place })
      ] }),
      /* @__PURE__ */ jsx3(
        "button",
        {
          type: "button",
          onClick: onClose,
          "aria-label": t("common.close"),
          className: "btn !px-2 !py-1.5",
          children: /* @__PURE__ */ jsx3("svg", { width: "13", height: "13", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", children: /* @__PURE__ */ jsx3("path", { d: "M6 6l12 12M18 6L6 18" }) })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "scroll-thin flex-1 overflow-y-auto px-4 py-4", children: [
      /* @__PURE__ */ jsxs3(
        "div",
        {
          className: "rounded-md border px-3 py-3",
          style: {
            background: `${RISK_COLOR[cls]}1f`,
            borderColor: `${RISK_COLOR[cls]}80`
          },
          children: [
            /* @__PURE__ */ jsxs3("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsx3(
                "span",
                {
                  className: "rounded px-2.5 py-1 text-[13px] font-bold uppercase tracking-wider",
                  style: { background: RISK_COLOR[cls], color: RISK_TEXT_ON[cls] },
                  children: t(`risk.${cls}`)
                }
              ),
              /* @__PURE__ */ jsx3("span", { className: "tabular text-2xl font-bold text-slate-50", children: risk.toFixed(2) })
            ] }),
            /* @__PURE__ */ jsx3("div", { className: "tabular mt-3 flex items-center justify-between text-[11px] text-slate-300", children: /* @__PURE__ */ jsxs3("span", { children: [
              susceptibility.toFixed(2),
              /* @__PURE__ */ jsx3("span", { className: "mx-1.5 text-slate-500", children: "\xD7" }),
              (cellTrigger ?? 0).toFixed(2),
              /* @__PURE__ */ jsx3("span", { className: "mx-1.5 text-slate-500", children: "=" }),
              /* @__PURE__ */ jsx3("span", { className: "font-semibold text-slate-100", children: risk.toFixed(2) })
            ] }) }),
            /* @__PURE__ */ jsx3("p", { className: "mt-1 text-[9px] uppercase tracking-[0.11em] text-slate-500", children: t("inspector.equation") })
          ]
        }
      ),
      /* @__PURE__ */ jsxs3("dl", { className: "mt-4 space-y-2", children: [
        /* @__PURE__ */ jsx3(Row2, { label: t("inspector.coords"), children: /* @__PURE__ */ jsxs3("span", { className: "tabular", children: [
          fmt(cell.lat, 3),
          "\xB0N, ",
          fmt(cell.lon, 3),
          "\xB0E"
        ] }) }),
        cell.state && /* @__PURE__ */ jsx3(Row2, { label: t("inspector.state"), children: cell.state }),
        cell.district && /* @__PURE__ */ jsx3(Row2, { label: t("inspector.district"), children: cell.district }),
        /* @__PURE__ */ jsx3(Row2, { label: t("inspector.susceptibility"), children: /* @__PURE__ */ jsxs3("span", { className: "flex items-center gap-1.5", children: [
          cell.suscept_class && /* @__PURE__ */ jsx3(
            "span",
            {
              className: "h-2.5 w-2.5 rounded-[2px]",
              style: { background: SUSCEPT_COLOR[cell.suscept_class] || "#334155" }
            }
          ),
          /* @__PURE__ */ jsx3("span", { className: "tabular", children: susceptibility.toFixed(3) }),
          cell.suscept_class && /* @__PURE__ */ jsxs3("span", { className: "text-slate-400", children: [
            "(",
            t(`suscept.${cell.suscept_class}`),
            ")"
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx3("h3", { className: "mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300", children: t("inspector.why") }),
      /* @__PURE__ */ jsxs3(Group, { title: t("inspector.terrain"), accent: "#38bdf8", children: [
        terrain.length === 0 ? /* @__PURE__ */ jsx3("p", { className: "text-[10px] leading-relaxed text-slate-500", children: t("inspector.noFactors") }) : terrain.map((f) => /* @__PURE__ */ jsx3(
          FactorBar,
          {
            factor: f,
            label: t(`factor.${f.key}`),
            accent: "#38bdf8"
          },
          f.property || f.key
        )),
        aspect && /* @__PURE__ */ jsx3("dl", { className: "mt-3", children: /* @__PURE__ */ jsx3(Row2, { label: t("factor.aspect"), children: /* @__PURE__ */ jsxs3("span", { className: "tabular", children: [
          aspect.deg.toFixed(0),
          /* @__PURE__ */ jsx3("span", { className: "ml-0.5 text-[9px] text-muted", children: t("units.deg") }),
          /* @__PURE__ */ jsx3("span", { className: "ml-1.5 text-slate-400", children: aspect.compass })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs3(Group, { title: t("inspector.triggerGroup"), accent: "#eab308", children: [
        triggerFactors(cellRain24h, cellRain7d).map((f) => /* @__PURE__ */ jsx3(FactorBar, { factor: f, label: t(`factor.${f.key}`), accent: "#eab308" }, f.key)),
        cell.rain_source === "grid" && /* @__PURE__ */ jsx3("p", { className: "mt-1 text-[9px] leading-relaxed text-slate-500", children: t("inspector.rainFromNode") })
      ] }),
      /* @__PURE__ */ jsxs3(Group, { title: t("inspector.exposure"), accent: "#64748b", children: [
        exposure.map((f) => /* @__PURE__ */ jsx3(FactorBar, { factor: f, label: t(`factor.${f.key}`), accent: "#64748b" }, f.property || f.key)),
        /* @__PURE__ */ jsxs3("dl", { className: exposure.length ? "mt-3 space-y-2" : "space-y-2", children: [
          has(cell.nearest_village) && /* @__PURE__ */ jsx3(Row2, { label: t("inspector.village"), children: cell.nearest_village }),
          has(cell.population) && /* @__PURE__ */ jsx3(Row2, { label: t("inspector.population"), children: /* @__PURE__ */ jsxs3("span", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx3("span", { className: "tabular", children: Number(cell.population).toLocaleString() }),
            cell.population_estimated === true && /* @__PURE__ */ jsx3("span", { className: "chip border-amber-800 bg-amber-950/60 text-amber-300", children: t("inspector.estimated") })
          ] }) }),
          !has(cell.nearest_village) && !has(cell.population) && exposure.length === 0 && /* @__PURE__ */ jsx3("p", { className: "text-[10px] leading-relaxed text-slate-500", children: t("inspector.noExposure") })
        ] })
      ] })
    ] })
  ] });
}
function has(v) {
  return v !== null && v !== void 0 && v !== "";
}
function Group({ title, accent, children }) {
  return /* @__PURE__ */ jsxs3("section", { className: "mt-3 rounded border border-line bg-ink-900/50 p-3", children: [
    /* @__PURE__ */ jsx3(
      "h4",
      {
        className: "mb-2.5 text-[9px] font-semibold uppercase tracking-[0.13em]",
        style: { color: accent },
        children: title
      }
    ),
    /* @__PURE__ */ jsx3("div", { className: "space-y-2.5", children })
  ] });
}
function FactorBar({ factor, label, accent }) {
  const { t } = useTranslation3();
  const missing = factor.norm === null;
  return /* @__PURE__ */ jsxs3("div", { children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex items-baseline justify-between gap-2", children: [
      /* @__PURE__ */ jsx3("span", { className: "text-[11px] text-slate-300", children: label }),
      /* @__PURE__ */ jsx3("span", { className: "tabular text-[11px] text-slate-100", children: missing ? /* @__PURE__ */ jsx3("span", { className: "text-slate-500", children: t("inspector.noData") }) : /* @__PURE__ */ jsxs3(Fragment3, { children: [
        fmt(factor.value, factor.digits ?? 1),
        factor.unit && /* @__PURE__ */ jsx3("span", { className: "ml-1 text-[9px] text-muted", children: factor.unit === "deg" ? t("units.deg") : t(`units.${factor.unit}`) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx3("div", { className: "mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-ink-600", children: !missing && /* @__PURE__ */ jsx3(
      "div",
      {
        className: "h-full rounded-sm transition-[width] duration-200",
        style: { width: `${factor.norm * 100}%`, background: accent }
      }
    ) }),
    missing && /* @__PURE__ */ jsx3("p", { className: "mt-0.5 text-[9px] text-slate-600", children: t("inspector.noDataNote") })
  ] });
}
function Row2({ label, children }) {
  return /* @__PURE__ */ jsxs3("div", { className: "flex items-baseline justify-between gap-3", children: [
    /* @__PURE__ */ jsx3("dt", { className: "text-[11px] text-muted", children: label }),
    /* @__PURE__ */ jsx3("dd", { className: "text-right text-[11px] text-slate-200", children })
  ] });
}
function fmt(v, digits = 1) {
  if (v === null || v === void 0 || !Number.isFinite(Number(v))) return "\u2014";
  return Number(v).toFixed(digits);
}

// src/components/RainfallPanel.jsx
import { useRef as useRef2, useState as useState3 } from "react";
import { useTranslation as useTranslation5 } from "react-i18next";

// src/components/Panel.jsx
import { useId, useState as useState2 } from "react";
import { useTranslation as useTranslation4 } from "react-i18next";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function Panel({
  title,
  badge,
  tone = "default",
  defaultOpen = true,
  className = "",
  bodyClassName = "",
  alarm = false,
  children
}) {
  const [open, setOpen] = useState2(defaultOpen);
  const { t } = useTranslation4();
  const id = useId();
  const toneHeader = tone === "amber" ? "text-amber-300" : tone === "danger" ? "text-red-300" : "text-slate-300";
  return /* @__PURE__ */ jsxs4(
    "section",
    {
      className: `panel pointer-events-auto ${alarm ? "animate-pulse-danger" : ""} ${className}`,
      children: [
        /* @__PURE__ */ jsxs4("div", { className: "panel-header", children: [
          /* @__PURE__ */ jsxs4(
            "button",
            {
              type: "button",
              onClick: () => setOpen((o) => !o),
              "aria-expanded": open,
              "aria-controls": id,
              title: open ? t("common.collapse") : t("common.expand"),
              className: "flex min-w-0 flex-1 items-center gap-2 text-left",
              children: [
                /* @__PURE__ */ jsx4(
                  "svg",
                  {
                    width: "9",
                    height: "9",
                    viewBox: "0 0 10 10",
                    className: `shrink-0 text-slate-500 transition-transform ${open ? "rotate-90" : ""}`,
                    fill: "currentColor",
                    "aria-hidden": "true",
                    children: /* @__PURE__ */ jsx4("path", { d: "M2 0l6 5-6 5z" })
                  }
                ),
                /* @__PURE__ */ jsx4("span", { className: `panel-title leading-tight ${toneHeader}`, children: title })
              ]
            }
          ),
          badge
        ] }),
        open && /* @__PURE__ */ jsx4("div", { id, className: bodyClassName || "px-3 py-3", children })
      ]
    }
  );
}

// src/components/RainfallPanel.jsx
import { Fragment as Fragment4, jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function RainfallPanel({
  rain24h,
  rain7d,
  source,
  onChange,
  onFetchLive = null,
  nodeCount = 0,
  progress = null,
  lead = 0,
  onLead = null,
  leadWindow = null,
  leadTruncated = false
}) {
  const { t } = useTranslation5();
  const [busy, setBusy] = useState3(false);
  const [error, setError] = useState3(null);
  const abortRef = useRef2(null);
  const { intensity, antecedent, trigger } = triggerBreakdown(rain24h, rain7d);
  const isLive = source === "live";
  async function handleFetch() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    try {
      if (onFetchLive) {
        await onFetchLive({ signal: controller.signal });
      } else {
        const r = await fetchRainfall({ signal: controller.signal });
        onChange(r.rain24h, r.rain7d, "live");
      }
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs5(
    Panel,
    {
      title: t("rain.title"),
      className: "w-full sm:w-[288px]",
      badge: /* @__PURE__ */ jsxs5(
        "span",
        {
          className: `chip ${isLive ? "border-emerald-800 bg-emerald-950/70 text-emerald-300" : "border-amber-800 bg-amber-950/70 text-amber-300"}`,
          children: [
            /* @__PURE__ */ jsx5(
              "span",
              {
                className: `h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-400" : "bg-amber-400"}`
              }
            ),
            isLive ? t("rain.live") : t("rain.simulated")
          ]
        }
      ),
      children: [
        onLead && /* @__PURE__ */ jsxs5("div", { className: "mb-3", children: [
          /* @__PURE__ */ jsxs5("div", { className: "mb-1.5 flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsx5("span", { className: "label mb-0", children: t("rain.lead") }),
            isLive && leadWindow && /* @__PURE__ */ jsx5("span", { className: "tabular text-[9px] text-slate-500", children: t("rain.leadWindow", { time: formatWindow(leadWindow) }) })
          ] }),
          /* @__PURE__ */ jsx5(
            "div",
            {
              role: "radiogroup",
              "aria-label": t("rain.lead"),
              className: "grid grid-cols-4 gap-1 rounded border border-line bg-ink-900/70 p-1",
              children: LEAD_HOURS.map((h) => /* @__PURE__ */ jsx5(
                "button",
                {
                  type: "button",
                  role: "radio",
                  "aria-checked": lead === h,
                  disabled: !isLive,
                  onClick: () => onLead(h),
                  className: `tabular rounded px-1 py-1 text-[10px] font-semibold transition-colors ${lead === h ? "bg-sky-900/80 text-sky-200" : "text-slate-500 hover:text-slate-300 disabled:hover:text-slate-500"} disabled:cursor-not-allowed disabled:opacity-40`,
                  children: h === 0 ? t("rain.leadNow") : `+${h}h`
                },
                h
              ))
            }
          ),
          /* @__PURE__ */ jsx5("p", { className: "mt-1 text-[9px] leading-relaxed text-slate-600", children: !isLive ? t("rain.leadNeedsLive") : leadTruncated ? t("rain.leadTruncated") : lead === 0 ? t("rain.leadObserved") : t("rain.leadForecast", { hours: lead }) })
        ] }),
        /* @__PURE__ */ jsx5(
          Slider,
          {
            label: t("rain.rain24h"),
            value: rain24h,
            max: RAIN24_MAX,
            onChange: (v) => onChange(v, rain7d, "sim")
          }
        ),
        /* @__PURE__ */ jsx5("div", { className: "h-3" }),
        /* @__PURE__ */ jsx5(
          Slider,
          {
            label: t("rain.rain7d"),
            value: rain7d,
            max: RAIN7D_MAX,
            onChange: (v) => onChange(rain24h, v, "sim")
          }
        ),
        /* @__PURE__ */ jsxs5("div", { className: "mt-4 rounded border border-line bg-ink-900/70 p-2.5", children: [
          /* @__PURE__ */ jsxs5("div", { className: "flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsx5("span", { className: "label mb-0", children: t("rain.trigger") }),
            /* @__PURE__ */ jsx5("span", { className: "tabular text-sm font-semibold text-sky-300", children: trigger.toFixed(2) })
          ] }),
          /* @__PURE__ */ jsx5("div", { className: "mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-ink-600", children: /* @__PURE__ */ jsx5(
            "div",
            {
              className: "h-full rounded-sm bg-gradient-to-r from-sky-700 to-sky-400 transition-[width] duration-200",
              style: { width: `${trigger * 100}%` }
            }
          ) }),
          /* @__PURE__ */ jsxs5("div", { className: "mt-2 space-y-1", children: [
            /* @__PURE__ */ jsx5(
              Component,
              {
                label: t("rain.intensity"),
                weight: WEIGHT_INTENSITY,
                value: intensity
              }
            ),
            /* @__PURE__ */ jsx5(
              Component,
              {
                label: t("rain.antecedent"),
                weight: WEIGHT_ANTECEDENT,
                value: antecedent
              }
            )
          ] }),
          /* @__PURE__ */ jsx5("p", { className: "tabular mt-2 text-[9px] text-slate-600", children: t("rain.weights") })
        ] }),
        /* @__PURE__ */ jsx5(
          "button",
          {
            type: "button",
            className: "btn btn-primary mt-3 w-full",
            onClick: handleFetch,
            disabled: busy,
            children: busy ? /* @__PURE__ */ jsxs5(Fragment4, { children: [
              /* @__PURE__ */ jsx5("span", { className: "h-3 w-3 animate-spin rounded-full border-2 border-sky-300/40 border-t-sky-200" }),
              progress && progress.total ? `${t("rain.fetching")} ${progress.done}/${progress.total}` : t("rain.fetching")
            ] }) : /* @__PURE__ */ jsxs5(Fragment4, { children: [
              /* @__PURE__ */ jsxs5("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", children: [
                /* @__PURE__ */ jsx5("path", { d: "M20 16.5A4.5 4.5 0 0016.5 8h-1A7 7 0 104 15" }),
                /* @__PURE__ */ jsx5("path", { d: "M8 19l1-2M12 20l1-2M16 19l1-2" })
              ] }),
              t("rain.fetch")
            ] })
          }
        ),
        /* @__PURE__ */ jsx5("p", { className: "mt-2 text-[10px] leading-relaxed text-muted", children: isLive ? t("rain.liveNote") : t("rain.simNote") }),
        onFetchLive && nodeCount > 0 && /* @__PURE__ */ jsx5("p", { className: "tabular mt-1 text-[9px] leading-relaxed text-slate-600", children: t("rain.nodes", { count: nodeCount }) }),
        error && /* @__PURE__ */ jsxs5("p", { className: "mt-2 rounded border border-red-900 bg-red-950/50 px-2 py-1.5 text-[10px] text-red-300", children: [
          t("rain.error"),
          " \u2014 ",
          error
        ] })
      ]
    }
  );
}
function Slider({ label, value, max, onChange }) {
  const { t } = useTranslation5();
  return /* @__PURE__ */ jsxs5("div", { children: [
    /* @__PURE__ */ jsxs5("div", { className: "mb-1.5 flex items-baseline justify-between", children: [
      /* @__PURE__ */ jsx5("span", { className: "label mb-0", children: label }),
      /* @__PURE__ */ jsxs5("span", { className: "tabular text-xs font-semibold text-slate-100", children: [
        Number(value).toFixed(1),
        /* @__PURE__ */ jsx5("span", { className: "ml-1 text-[10px] font-normal text-muted", children: t("units.mm") })
      ] })
    ] }),
    /* @__PURE__ */ jsx5(
      "input",
      {
        type: "range",
        min: 0,
        max,
        step: 1,
        value: Math.min(value, max),
        onChange: (e) => onChange(Number(e.target.value)),
        "aria-label": label
      }
    ),
    /* @__PURE__ */ jsxs5("div", { className: "tabular mt-1 flex justify-between text-[9px] text-slate-600", children: [
      /* @__PURE__ */ jsx5("span", { children: "0" }),
      /* @__PURE__ */ jsx5("span", { children: max })
    ] })
  ] });
}
function Component({ label, weight, value }) {
  return /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx5("span", { className: "w-[74px] shrink-0 truncate text-[10px] text-muted", children: label }),
    /* @__PURE__ */ jsx5("div", { className: "h-1 flex-1 overflow-hidden rounded-sm bg-ink-600", children: /* @__PURE__ */ jsx5(
      "div",
      {
        className: "h-full bg-slate-500 transition-[width] duration-200",
        style: { width: `${value * 100}%` }
      }
    ) }),
    /* @__PURE__ */ jsxs5("span", { className: "tabular w-[62px] shrink-0 text-right text-[9px] text-slate-500", children: [
      value.toFixed(2),
      " \xD7 ",
      weight
    ] })
  ] });
}
function formatWindow(stamp) {
  const ms = parseHour(stamp);
  if (!Number.isFinite(ms)) return String(stamp);
  const d = new Date(ms);
  const day = d.toLocaleDateString(void 0, { weekday: "short", timeZone: "UTC" });
  const hh = String(d.getUTCHours()).padStart(2, "0");
  return `${day} ${hh}:00 GMT`;
}

// src/components/SimpleView.jsx
import { useState as useState4 } from "react";
import { useTranslation as useTranslation6 } from "react-i18next";

// src/lib/advice.js
var STEEP_SUSCEPT = 0.5;
var STEEP_CLASSES = ["High", "Very High"];
var WET_TRIGGER = 0.4;
function isSteep(cell) {
  if (cell?.suscept_class) return STEEP_CLASSES.includes(cell.suscept_class);
  return Number(cell?.susceptibility) >= STEEP_SUSCEPT;
}
function isWet(cell) {
  return Number(cell?.trigger) >= WET_TRIGGER;
}
function reasonKey(cell) {
  const steep = isSteep(cell);
  const wet = isWet(cell);
  if (steep && wet) return "steepWet";
  if (steep && !wet) return "steepDry";
  if (!steep && wet) return "gentleWet";
  return "gentleDry";
}
var ACTION_COUNT = 3;
function adviceFor(cell) {
  const level = cell?.riskClass || riskClass(cell?.risk);
  return {
    level,
    headlineKey: `plain.level.${level}.headline`,
    summaryKey: `plain.level.${level}.summary`,
    reasonKey: `plain.reason.${reasonKey(cell)}`,
    actionKeys: Array.from({ length: ACTION_COUNT }, (_, i) => `plain.level.${level}.do${i + 1}`),
    // A non-colour cue for the verdict band. Red-amber-green alone fails for
    // roughly one man in twelve, and this view is the one being read by
    // someone who may be deciding whether to leave their house.
    shape: SHAPE[level],
    urgent: level === "Warning" || level === "Evacuate"
  };
}
var SHAPE = {
  Safe: "check",
  Watch: "eye",
  Warning: "triangle",
  Evacuate: "siren"
};

// src/components/SimpleView.jsx
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function SimpleView({
  places: places2,
  placesReady,
  activeField,
  rain,
  result,
  onSelectPlace,
  onReport,
  onDetails
}) {
  const { t } = useTranslation6();
  return /* @__PURE__ */ jsxs6(
    "div",
    {
      className: "pointer-events-auto absolute inset-x-0 bottom-0 top-[30vh] z-20 flex flex-col\r\n                 rounded-t-2xl border border-line bg-ink-900/97 shadow-2xl shadow-black/70 backdrop-blur\r\n                 sm:inset-y-3 sm:left-3 sm:right-auto sm:w-[420px] sm:rounded-xl",
      children: [
        /* @__PURE__ */ jsx6("div", { className: "mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ink-500 sm:hidden" }),
        /* @__PURE__ */ jsxs6("div", { className: "shrink-0 px-4 pb-3 pt-3", children: [
          /* @__PURE__ */ jsx6("h2", { className: "text-[17px] font-bold leading-snug text-slate-50", children: t("plain.title") }),
          /* @__PURE__ */ jsx6("div", { className: "mt-2.5", children: placesReady ? /* @__PURE__ */ jsx6(
            PlaceSearch,
            {
              places: places2,
              rainField: activeField,
              uniformRain: rain,
              onSelect: onSelectPlace,
              compact: true
            }
          ) : /* @__PURE__ */ jsx6("div", { className: "h-9 animate-pulse rounded border border-line bg-ink-700" }) })
        ] }),
        /* @__PURE__ */ jsxs6("div", { className: "scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-4", children: [
          !result && /* @__PURE__ */ jsx6(EmptyState, {}),
          result?.verdict === "ok" && /* @__PURE__ */ jsx6(Answer, { result }),
          result?.verdict === "unmonitored" && /* @__PURE__ */ jsx6(NoData, { result }),
          result?.verdict === "outside" && /* @__PURE__ */ jsx6(Outside, {})
        ] }),
        /* @__PURE__ */ jsxs6("div", { className: "shrink-0 border-t border-line px-4 py-3", children: [
          /* @__PURE__ */ jsxs6("button", { type: "button", className: "btn btn-primary w-full !py-2.5 !text-[13px]", onClick: onReport, children: [
            /* @__PURE__ */ jsxs6("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.1", strokeLinecap: "round", strokeLinejoin: "round", children: [
              /* @__PURE__ */ jsx6("path", { d: "M12 9v4M12 17h.01" }),
              /* @__PURE__ */ jsx6("path", { d: "M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" })
            ] }),
            t("plain.reportCta")
          ] }),
          /* @__PURE__ */ jsx6(
            "button",
            {
              type: "button",
              onClick: onDetails,
              className: "mt-2 w-full text-center text-[11px] font-semibold text-slate-500 underline decoration-slate-700 underline-offset-4 transition hover:text-slate-300",
              children: t("plain.detailsCta")
            }
          )
        ] })
      ]
    }
  );
}
function EmptyState() {
  const { t } = useTranslation6();
  return /* @__PURE__ */ jsxs6("div", { className: "rounded-lg border border-line bg-ink-800/70 px-4 py-4", children: [
    /* @__PURE__ */ jsx6("p", { className: "text-[14px] font-semibold text-slate-200", children: t("plain.emptyTitle") }),
    /* @__PURE__ */ jsx6("p", { className: "mt-2 text-[13px] leading-relaxed text-slate-400", children: t("plain.emptyBody") }),
    /* @__PURE__ */ jsx6("p", { className: "mt-3 text-[12px] leading-relaxed text-slate-500", children: t("plain.mapHint") })
  ] });
}
function Answer({ result }) {
  const { t } = useTranslation6();
  const { cell, km, distant, higher, point } = result;
  const advice = adviceFor(cell);
  const where = [point.district, point.state].filter(Boolean).join(", ");
  return /* @__PURE__ */ jsxs6("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs6(
      "div",
      {
        className: "rounded-lg border-2 px-4 py-4",
        style: {
          background: `${RISK_COLOR[advice.level]}1c`,
          borderColor: RISK_COLOR[advice.level]
        },
        children: [
          /* @__PURE__ */ jsxs6("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx6(
              "span",
              {
                className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                style: { background: RISK_COLOR[advice.level], color: RISK_TEXT_ON[advice.level] },
                children: /* @__PURE__ */ jsx6(LevelGlyph, { shape: advice.shape })
              }
            ),
            /* @__PURE__ */ jsxs6("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx6("p", { className: "text-[20px] font-bold leading-tight text-slate-50", children: t(advice.headlineKey) }),
              /* @__PURE__ */ jsx6("p", { className: "mt-1 truncate text-[13px] font-medium text-slate-300", children: point.name }),
              where && /* @__PURE__ */ jsx6("p", { className: "truncate text-[11px] text-slate-500", children: where })
            ] })
          ] }),
          /* @__PURE__ */ jsx6("p", { className: "mt-3 text-[13px] leading-relaxed text-slate-200", children: t(advice.summaryKey) })
        ]
      }
    ),
    /* @__PURE__ */ jsx6(Block, { title: t("plain.whyTitle"), children: /* @__PURE__ */ jsx6("p", { className: "text-[13px] leading-relaxed text-slate-300", children: t(advice.reasonKey) }) }),
    /* @__PURE__ */ jsxs6(Block, { title: t("plain.doTitle"), children: [
      /* @__PURE__ */ jsx6("ul", { className: "space-y-2", children: advice.actionKeys.map((key) => /* @__PURE__ */ jsxs6("li", { className: "flex gap-2.5 text-[13px] leading-relaxed text-slate-200", children: [
        /* @__PURE__ */ jsx6(
          "span",
          {
            "aria-hidden": "true",
            className: "mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full",
            style: { background: RISK_COLOR[advice.level] }
          }
        ),
        /* @__PURE__ */ jsx6("span", { children: t(key) })
      ] }, key)) }),
      /* @__PURE__ */ jsx6("p", { className: "mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-slate-500", children: t("plain.adviceNote") })
    ] }),
    higher && /* @__PURE__ */ jsx6("p", { className: "rounded-lg border border-amber-900/80 bg-amber-950/40 px-3.5 py-3 text-[12px] leading-relaxed text-amber-200/90", children: t("plain.higherNear", { km: higher.km.toFixed(1), dir: higher.compass }) }),
    distant && /* @__PURE__ */ jsx6("p", { className: "rounded-lg border border-line bg-ink-800/70 px-3.5 py-3 text-[12px] leading-relaxed text-slate-400", children: t("plain.distantCell", { km: km.toFixed(1) }) }),
    /* @__PURE__ */ jsx6(Numbers, { cell })
  ] });
}
function Numbers({ cell }) {
  const { t } = useTranslation6();
  const [open, setOpen] = useState4(false);
  return /* @__PURE__ */ jsxs6("div", { className: "rounded-lg border border-line bg-ink-800/70", children: [
    /* @__PURE__ */ jsxs6(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        "aria-expanded": open,
        className: "flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[12px] font-semibold text-slate-400 transition hover:text-slate-200",
        children: [
          open ? t("plain.hideNumbers") : t("plain.showNumbers"),
          /* @__PURE__ */ jsx6(
            "svg",
            {
              width: "13",
              height: "13",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2.4",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              className: `transition-transform ${open ? "rotate-180" : ""}`,
              "aria-hidden": "true",
              children: /* @__PURE__ */ jsx6("path", { d: "M6 9l6 6 6-6" })
            }
          )
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs6("div", { className: "border-t border-line px-3.5 py-3", children: [
      /* @__PURE__ */ jsx6(
        Figure,
        {
          label: t("plain.numbersSlope"),
          value: Number(cell.susceptibility).toFixed(2),
          note: cell.suscept_class ? t(`suscept.${cell.suscept_class}`) : null
        }
      ),
      /* @__PURE__ */ jsx6(Figure, { label: t("plain.numbersRain"), value: Number(cell.trigger).toFixed(2) }),
      /* @__PURE__ */ jsx6("div", { className: "my-2 border-t border-line" }),
      /* @__PURE__ */ jsx6(Figure, { label: t("plain.numbersRisk"), value: Number(cell.risk).toFixed(2), strong: true }),
      /* @__PURE__ */ jsxs6("p", { className: "tabular mt-2.5 text-[11px] text-slate-500", children: [
        Number(cell.susceptibility).toFixed(2),
        " \xD7 ",
        Number(cell.trigger).toFixed(2),
        " =",
        " ",
        /* @__PURE__ */ jsx6("span", { className: "font-semibold text-slate-300", children: Number(cell.risk).toFixed(2) })
      ] }),
      /* @__PURE__ */ jsx6("p", { className: "mt-2 text-[11px] leading-relaxed text-slate-500", children: t("plain.numbersNote") }),
      /* @__PURE__ */ jsxs6("div", { className: "mt-3 grid grid-cols-2 gap-2 border-t border-line pt-2.5", children: [
        /* @__PURE__ */ jsx6(Figure, { label: t("plain.rainToday"), value: `${Number(cell.rain24h).toFixed(0)} mm`, small: true }),
        /* @__PURE__ */ jsx6(Figure, { label: t("plain.rainWeek"), value: `${Number(cell.rain7d).toFixed(0)} mm`, small: true })
      ] })
    ] })
  ] });
}
function NoData({ result }) {
  const { t } = useTranslation6();
  return /* @__PURE__ */ jsxs6("div", { className: "rounded-lg border-2 border-slate-600 bg-ink-800/80 px-4 py-4", children: [
    /* @__PURE__ */ jsxs6("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx6("span", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-600 text-slate-100", children: /* @__PURE__ */ jsxs6("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.3", strokeLinecap: "round", children: [
        /* @__PURE__ */ jsx6("circle", { cx: "12", cy: "12", r: "9" }),
        /* @__PURE__ */ jsx6("path", { d: "M12 8v5M12 16h.01" })
      ] }) }),
      /* @__PURE__ */ jsxs6("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx6("p", { className: "text-[17px] font-bold leading-tight text-slate-100", children: t("plain.nodataTitle") }),
        /* @__PURE__ */ jsx6("p", { className: "mt-0.5 truncate text-[13px] text-slate-400", children: result.point.name })
      ] })
    ] }),
    /* @__PURE__ */ jsx6("p", { className: "mt-3 text-[13px] leading-relaxed text-slate-300", children: t("plain.nodataBody", { name: result.point.name }) })
  ] });
}
function Outside() {
  const { t } = useTranslation6();
  return /* @__PURE__ */ jsxs6("div", { className: "rounded-lg border border-amber-900 bg-amber-950/40 px-4 py-4", children: [
    /* @__PURE__ */ jsx6("p", { className: "text-[15px] font-bold text-amber-100", children: t("plain.outsideTitle") }),
    /* @__PURE__ */ jsx6("p", { className: "mt-2 text-[13px] leading-relaxed text-amber-200/85", children: t("plain.outsideBody") })
  ] });
}
function Block({ title, children }) {
  return /* @__PURE__ */ jsxs6("div", { className: "rounded-lg border border-line bg-ink-800/70 px-3.5 py-3", children: [
    /* @__PURE__ */ jsx6("p", { className: "mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500", children: title }),
    children
  ] });
}
function Figure({ label, value, note = null, strong = false, small = false }) {
  return /* @__PURE__ */ jsxs6("div", { className: "flex items-baseline justify-between gap-3 py-0.5", children: [
    /* @__PURE__ */ jsxs6("span", { className: `${small ? "text-[11px]" : "text-[12px]"} text-slate-400`, children: [
      label,
      note && /* @__PURE__ */ jsxs6("span", { className: "ml-1.5 text-slate-500", children: [
        "(",
        note,
        ")"
      ] })
    ] }),
    /* @__PURE__ */ jsx6(
      "span",
      {
        className: `tabular shrink-0 font-semibold ${strong ? "text-[15px] text-slate-50" : "text-[13px] text-slate-200"}`,
        children: value
      }
    )
  ] });
}
function LevelGlyph({ shape }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  };
  if (shape === "check") {
    return /* @__PURE__ */ jsx6("svg", { ...common, children: /* @__PURE__ */ jsx6("path", { d: "M20 6L9 17l-5-5" }) });
  }
  if (shape === "eye") {
    return /* @__PURE__ */ jsxs6("svg", { ...common, children: [
      /* @__PURE__ */ jsx6("path", { d: "M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12z" }),
      /* @__PURE__ */ jsx6("circle", { cx: "12", cy: "12", r: "3" })
    ] });
  }
  if (shape === "triangle") {
    return /* @__PURE__ */ jsxs6("svg", { ...common, children: [
      /* @__PURE__ */ jsx6("path", { d: "M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" }),
      /* @__PURE__ */ jsx6("path", { d: "M12 9v4M12 17h.01" })
    ] });
  }
  return /* @__PURE__ */ jsxs6("svg", { ...common, children: [
    /* @__PURE__ */ jsx6("path", { d: "M5 19h14M6 19v-6a6 6 0 1112 0v6" }),
    /* @__PURE__ */ jsx6("path", { d: "M12 3V1.5M3.5 8L2.2 7.2M20.5 8l1.3-.8" })
  ] });
}

// src/components/WelcomeModal.jsx
import { useTranslation as useTranslation7 } from "react-i18next";
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function WelcomeModal({ open, onClose }) {
  const { t } = useTranslation7();
  if (!open) return null;
  const steps = [
    { n: 1, title: t("welcome.s1Title"), body: t("welcome.s1Body"), glyph: /* @__PURE__ */ jsx7(SearchGlyph, {}) },
    { n: 2, title: t("welcome.s2Title"), body: t("welcome.s2Body"), glyph: /* @__PURE__ */ jsx7(SlopeGlyph, {}) },
    { n: 3, title: t("welcome.s3Title"), body: t("welcome.s3Body"), glyph: /* @__PURE__ */ jsx7(BandsGlyph, {}) }
  ];
  return /* @__PURE__ */ jsx7(
    "div",
    {
      className: "absolute inset-0 z-50 flex items-center justify-center bg-ink-900/85 p-4 backdrop-blur-sm",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": t("welcome.title"),
      children: /* @__PURE__ */ jsxs7("div", { className: "panel scroll-thin max-h-full w-[440px] max-w-full overflow-y-auto", children: [
        /* @__PURE__ */ jsx7("div", { className: "border-b border-line px-5 py-4", children: /* @__PURE__ */ jsxs7("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx7("img", { src: "/icon.svg", alt: "", className: "h-9 w-9 rounded" }),
          /* @__PURE__ */ jsxs7("div", { children: [
            /* @__PURE__ */ jsx7("h2", { className: "text-[17px] font-bold leading-tight text-slate-50", children: t("welcome.title") }),
            /* @__PURE__ */ jsx7("p", { className: "mt-0.5 text-[12px] text-slate-400", children: t("welcome.subtitle") })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx7("div", { className: "space-y-4 px-5 py-4", children: steps.map((s) => /* @__PURE__ */ jsxs7("div", { className: "flex gap-3.5", children: [
          /* @__PURE__ */ jsx7("span", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-ink-900/70 text-sky-300", children: s.glyph }),
          /* @__PURE__ */ jsxs7("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx7("p", { className: "text-[14px] font-semibold leading-snug text-slate-100", children: s.title }),
            /* @__PURE__ */ jsx7("p", { className: "mt-1 text-[13px] leading-relaxed text-slate-400", children: s.body })
          ] })
        ] }, s.n)) }),
        /* @__PURE__ */ jsxs7("div", { className: "border-t border-line px-5 py-4", children: [
          /* @__PURE__ */ jsx7("button", { type: "button", className: "btn btn-primary w-full !py-2.5 !text-[13px]", onClick: onClose, children: t("welcome.start") }),
          /* @__PURE__ */ jsx7("p", { className: "mt-2.5 text-center text-[11px] text-slate-500", children: t("welcome.reopen") })
        ] })
      ] })
    }
  );
}
var svg = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true"
};
function SearchGlyph() {
  return /* @__PURE__ */ jsxs7("svg", { ...svg, children: [
    /* @__PURE__ */ jsx7("circle", { cx: "11", cy: "11", r: "7" }),
    /* @__PURE__ */ jsx7("path", { d: "M20 20l-4.3-4.3" })
  ] });
}
function SlopeGlyph() {
  return /* @__PURE__ */ jsxs7("svg", { ...svg, children: [
    /* @__PURE__ */ jsx7("path", { d: "M2 20h20L13 8 8 14l-3-3z" }),
    /* @__PURE__ */ jsx7("path", { d: "M7 3.5v2M12 2.5v2.5M17 3.5v2" })
  ] });
}
function BandsGlyph() {
  return /* @__PURE__ */ jsxs7("svg", { ...svg, strokeWidth: "0", fill: "currentColor", children: [
    /* @__PURE__ */ jsx7("rect", { x: "4", y: "4", width: "16", height: "3.4", rx: "1", fill: "#22c55e" }),
    /* @__PURE__ */ jsx7("rect", { x: "4", y: "9", width: "16", height: "3.4", rx: "1", fill: "#eab308" }),
    /* @__PURE__ */ jsx7("rect", { x: "4", y: "14", width: "16", height: "3.4", rx: "1", fill: "#f97316" }),
    /* @__PURE__ */ jsx7("rect", { x: "4", y: "19", width: "16", height: "1.6", rx: "0.8", fill: "#dc2626" })
  ] });
}

// src/components/Header.jsx
import { useTranslation as useTranslation8 } from "react-i18next";

// src/i18n/index.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
var LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "\u0939\u093F\u0928\u094D\u0926\u0940", short: "\u0939\u093F" },
  { code: "as", label: "\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE", short: "\u0985" }
];
var STORAGE_KEY = "pahara.lang";
function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch {
  }
  return "en";
}
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en_default },
    hi: { translation: hi_default },
    as: { translation: as_default }
  },
  lng: initialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false
});
function setLanguage(code) {
  i18n.changeLanguage(code);
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
  }
}

// src/components/Header.jsx
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function Header({
  colorMode,
  onColorMode,
  online,
  onMethodology,
  mode = "detailed",
  onMode = null,
  onHelp = null,
  search = null
}) {
  const { t, i18n: i18n3 } = useTranslation8();
  const detailed = mode === "detailed";
  return /* @__PURE__ */ jsxs8("header", { className: "relative z-30 shrink-0 border-b border-line bg-ink-900/95 backdrop-blur", children: [
    /* @__PURE__ */ jsxs8("div", { className: "flex h-14 items-center gap-3 px-3 sm:px-4", children: [
      /* @__PURE__ */ jsxs8("div", { className: "flex min-w-0 items-center gap-3", children: [
        /* @__PURE__ */ jsx8("img", { src: "/icon.svg", alt: "", className: "h-8 w-8 shrink-0 rounded" }),
        /* @__PURE__ */ jsxs8("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs8("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsx8("h1", { className: "text-[17px] font-bold leading-none tracking-[0.18em] text-slate-50", children: t("app.title") }),
            /* @__PURE__ */ jsx8("span", { className: "hidden shrink-0 rounded-sm border border-line px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted sm:inline", children: t("app.sih") })
          ] }),
          /* @__PURE__ */ jsx8("p", { className: "mt-0.5 hidden truncate text-[11px] leading-none text-muted md:block", children: t("app.subtitle") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs8("div", { className: "ml-auto flex items-center gap-2", children: [
        onMode && /* @__PURE__ */ jsx8(
          "div",
          {
            className: "flex items-center rounded border border-line bg-ink-700 p-0.5",
            role: "group",
            "aria-label": t("header.viewLabel"),
            children: [
              { id: "simple", label: t("header.viewSimple"), title: t("header.viewSimpleTitle") },
              { id: "detailed", label: t("header.viewDetailed"), title: t("header.viewDetailedTitle") }
            ].map((v) => /* @__PURE__ */ jsx8(
              "button",
              {
                type: "button",
                onClick: () => onMode(v.id),
                "aria-pressed": mode === v.id,
                title: v.title,
                className: `rounded-[3px] px-2.5 py-1.5 text-[11px] font-semibold transition ${mode === v.id ? "bg-sky-900/80 text-sky-100 shadow-inner" : "text-slate-400 hover:text-slate-200"}`,
                children: v.label
              },
              v.id
            ))
          }
        ),
        /* @__PURE__ */ jsx8(
          "div",
          {
            className: `items-center rounded border border-line bg-ink-700 p-0.5 ${detailed ? "hidden sm:flex" : "hidden"}`,
            role: "group",
            "aria-label": t("header.modeLabel"),
            children: [
              { id: "susceptibility", label: t("header.modeSusceptibility") },
              { id: "risk", label: t("header.modeRisk") }
            ].map((m) => /* @__PURE__ */ jsx8(
              "button",
              {
                type: "button",
                onClick: () => onColorMode(m.id),
                "aria-pressed": colorMode === m.id,
                className: `rounded-[3px] px-2.5 py-1.5 text-[11px] font-semibold transition ${colorMode === m.id ? "bg-sky-900/80 text-sky-100 shadow-inner" : "text-slate-400 hover:text-slate-200"}`,
                children: m.label
              },
              m.id
            ))
          }
        ),
        /* @__PURE__ */ jsxs8(
          "div",
          {
            className: `chip ${online ? "border-emerald-900 bg-emerald-950/60 text-emerald-300" : "border-amber-800 bg-amber-950/60 text-amber-300"}`,
            title: online ? t("status.online") : t("status.offlineNote"),
            children: [
              /* @__PURE__ */ jsx8(
                "span",
                {
                  className: `h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "animate-pulse bg-amber-400"}`
                }
              ),
              /* @__PURE__ */ jsx8("span", { className: "hidden sm:inline", children: online ? t("status.online") : t("status.offline") })
            ]
          }
        ),
        /* @__PURE__ */ jsx8(
          "div",
          {
            className: "flex items-center rounded border border-line bg-ink-700 p-0.5",
            role: "group",
            "aria-label": t("header.language"),
            children: LANGUAGES.map((l) => /* @__PURE__ */ jsx8(
              "button",
              {
                type: "button",
                onClick: () => setLanguage(l.code),
                "aria-pressed": i18n3.language === l.code,
                title: l.label,
                className: `rounded-[3px] px-2 py-1.5 text-[11px] font-semibold transition ${i18n3.language === l.code ? "bg-ink-500 text-slate-100" : "text-slate-400 hover:text-slate-200"}`,
                children: l.short
              },
              l.code
            ))
          }
        ),
        onHelp && /* @__PURE__ */ jsx8(
          "button",
          {
            type: "button",
            className: "btn !px-2",
            onClick: onHelp,
            title: t("header.help"),
            "aria-label": t("header.help"),
            children: /* @__PURE__ */ jsxs8("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", children: [
              /* @__PURE__ */ jsx8("circle", { cx: "12", cy: "12", r: "9" }),
              /* @__PURE__ */ jsx8("path", { d: "M9.6 9.2a2.5 2.5 0 013.9-1.2c1.4 1 .9 2.6-.4 3.3-.7.4-1.1.9-1.1 1.7" }),
              /* @__PURE__ */ jsx8("path", { d: "M12 17h.01" })
            ] })
          }
        ),
        detailed && /* @__PURE__ */ jsxs8("button", { type: "button", className: "btn", onClick: onMethodology, children: [
          /* @__PURE__ */ jsxs8("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", children: [
            /* @__PURE__ */ jsx8("circle", { cx: "12", cy: "12", r: "9" }),
            /* @__PURE__ */ jsx8("path", { d: "M12 16v-4M12 8h.01", strokeLinecap: "round" })
          ] }),
          /* @__PURE__ */ jsx8("span", { className: "hidden lg:inline", children: t("header.methodology") })
        ] })
      ] })
    ] }),
    search && detailed && /* @__PURE__ */ jsx8("div", { className: "border-t border-line px-3 py-2 lg:hidden", children: search })
  ] });
}

// src/lib/spatialRisk.js
function scoreCells(cells2, field, uniform) {
  const u24 = Number(uniform?.rain24h) || 0;
  const u7d = Number(uniform?.rain7d) || 0;
  const uniformTrigger = computeTrigger(u24, u7d);
  return cells2.map((c) => {
    let rain24h = u24;
    let rain7d = u7d;
    let trigger = uniformTrigger;
    let rain_source = "uniform";
    if (field) {
      const hit = field.get(nodeKeyFor(c.lat, c.lon));
      if (hit) {
        rain24h = hit.rain24h;
        rain7d = hit.rain7d;
        trigger = computeTrigger(rain24h, rain7d);
        rain_source = "grid";
      }
    }
    const risk = computeRisk(c.susceptibility, trigger);
    return { ...c, rain24h, rain7d, trigger, rain_source, risk, riskClass: riskClass(risk) };
  });
}

// src/lib/render.test.jsx
import { jsx as jsx9 } from "react/jsx-runtime";
var checks = 0;
var missingKeys = /* @__PURE__ */ new Set();
var ok = (cond, msg) => {
  assert.ok(cond, msg);
  checks += 1;
};
var eq = (a, b, msg) => {
  assert.equal(a, b, msg);
  checks += 1;
};
i18n2.use(initReactI18next2).init({
  resources: { en: { translation: en_default }, hi: { translation: hi_default }, as: { translation: as_default } },
  lng: "en",
  fallbackLng: false,
  interpolation: { escapeValue: false },
  saveMissing: true,
  missingKeyHandler: (_lng, _ns, key) => missingKeys.add(key)
});
var raw = JSON.parse(readFileSync("public/places.json", "utf8"));
var places = (Array.isArray(raw) ? raw : raw.places).map((p, i) => ({ ...p, id: `p${i}` }));
var fc = JSON.parse(readFileSync("public/risk_grid.geojson", "utf8"));
var meta = fc.metadata ?? {};
var cells = fc.features.map((f) => ({
  ...f.properties,
  lat: Number(f.properties.lat),
  lon: Number(f.properties.lon),
  susceptibility: Number(f.properties.susceptibility) || 0
}));
var scored = scoreCells(cells, null, { rain24h: 60, rain7d: 200 });
var render = (el, what) => {
  let html = "";
  assert.doesNotThrow(() => {
    html = renderToStaticMarkup(el);
  }, `${what} renders without throwing`);
  checks += 1;
  return html;
};
{
  const html = render(
    /* @__PURE__ */ jsx9(PlaceSearch, { places, rainField: null, uniformRain: { rain24h: 60, rain7d: 200 }, onSelect: () => {
    } }),
    "PlaceSearch"
  );
  ok(html.includes("combobox"), "search input is a combobox");
  ok(html.includes(en_default.search.placeholder), "placeholder comes from i18n");
  ok(
    render(/* @__PURE__ */ jsx9(PlaceSearch, { places: [], rainField: null, uniformRain: {}, onSelect: () => {
    } }), "PlaceSearch/empty").length > 0,
    "search survives an empty place list"
  );
  ok(
    render(/* @__PURE__ */ jsx9(PlaceSearch, { places, rainField: null, uniformRain: {}, onSelect: () => {
    }, compact: true }), "PlaceSearch/compact").length > 0,
    "compact variant renders"
  );
}
var byVerdict = { ok: null, unmonitored: null, outside: null };
for (const p of places) {
  const r = resolvePlace(p, scored);
  if (!byVerdict[r.verdict]) byVerdict[r.verdict] = r;
  if (byVerdict.ok && byVerdict.unmonitored) break;
}
byVerdict.outside = resolvePlace({ name: "Delhi", lat: 28.61, lon: 77.21 }, scored);
var guwahati = places.find((p) => p.name === "Guwahati");
var distantCase = guwahati ? resolvePlace(guwahati, scored) : null;
for (const [verdict, result] of Object.entries(byVerdict)) {
  ok(result, `found a "${verdict}" case to render`);
  const html = render(
    /* @__PURE__ */ jsx9(
      PlaceResultCard,
      {
        result,
        features: meta.features ?? null,
        importance: meta.feature_importance ?? null,
        onClose: () => {
        }
      }
    ),
    `PlaceResultCard/${verdict}`
  );
  ok(html.includes(result.point.name ?? ""), `${verdict} card shows the place name`);
  if (verdict === "outside") ok(html.includes("Outside monitored region"), "outside card says so plainly");
  if (verdict === "unmonitored") ok(html.includes("No modelled slope"), "unmonitored card says so plainly");
  if (verdict === "ok") {
    ok(html.includes(en_default.search.liveRisk), "ok card labels live risk");
    ok(html.includes(en_default.search.staticSusceptibility), "ok card labels static susceptibility separately");
  }
}
if (distantCase && distantCase.verdict === "ok" && distantCase.distant) {
  const html = render(
    /* @__PURE__ */ jsx9(PlaceResultCard, { result: distantCase, features: meta.features, importance: meta.feature_importance, onClose: () => {
    } }),
    "PlaceResultCard/distant"
  );
  ok(html.includes("Nearest monitored cell"), "a distant stand-in cell is labelled as such");
}
{
  const withHint = places.map((p) => resolvePlace(p, scored)).find((r) => r.verdict === "ok" && r.higher);
  ok(withHint, "found a place with a nearer higher-risk zone");
  const html = render(
    /* @__PURE__ */ jsx9(PlaceResultCard, { result: withHint, features: meta.features, importance: meta.feature_importance, onClose: () => {
    } }),
    "PlaceResultCard/higher-risk"
  );
  ok(html.includes("Nearest higher-risk zone"), "the higher-risk hint renders");
  ok(/\d+\.\d+ km (N|NE|E|SE|S|SW|W|NW)\b/.test(html), "the hint carries a distance and a bearing");
}
render(/* @__PURE__ */ jsx9(PlaceResultCard, { result: null, onClose: () => {
} }), "PlaceResultCard/null");
render(
  /* @__PURE__ */ jsx9(PlaceResultCard, { result: { verdict: "ok", point: { name: "X", lat: 25, lon: 93 }, cell: { susceptibility: 0.5, trigger: 0.4, risk: 0.2, riskClass: "Watch" }, km: 1 }, onClose: () => {
  } }),
  "PlaceResultCard/sparse cell"
);
for (const [label, path] of [
  ["northeast", "public/risk_grid.geojson"],
  ["dima hasao", "public/risk_grid_dimahasao.geojson"]
]) {
  const g = JSON.parse(readFileSync(path, "utf8"));
  const feats = g.metadata?.features ?? null;
  const imp = g.metadata?.feature_importance ?? null;
  for (const f of g.features.filter((_, i) => i % 1500 === 0).slice(0, 6)) {
    render(
      /* @__PURE__ */ jsx9(CellInspector, { cell: f.properties, trigger: 0.42, rain24h: 60, rain7d: 200, features: feats, importance: imp, onClose: () => {
      } }),
      `CellInspector/${label}`
    );
  }
}
var simple = (props) => /* @__PURE__ */ jsx9(
  SimpleView,
  {
    places,
    placesReady: true,
    activeField: null,
    rain: { rain24h: 60, rain7d: 200, source: "sim" },
    onSelectPlace: () => {
    },
    onReport: () => {
    },
    onDetails: () => {
    },
    ...props
  }
);
{
  const empty = render(simple({ result: null }), "SimpleView/empty");
  ok(empty.includes(en_default.plain.emptyTitle), "SimpleView: the empty state invites a search");
  ok(empty.includes(en_default.plain.reportCta), "SimpleView: reporting is reachable before any search");
  ok(empty.includes(en_default.plain.detailsCta), "SimpleView: the full dashboard is one tap away");
  const answer = render(simple({ result: byVerdict.ok }), "SimpleView/ok");
  const advice = adviceFor(byVerdict.ok.cell);
  const headline = advice.headlineKey.split(".").reduce((o, k) => o[k], en_default);
  ok(answer.includes(headline), "SimpleView: the verdict is the plain headline");
  ok(answer.includes(en_default.plain.whyTitle), "SimpleView: it says why");
  ok(answer.includes(en_default.plain.doTitle), "SimpleView: it says what to do");
  ok(answer.includes(en_default.plain.adviceNote), "SimpleView: the advice is labelled as unofficial");
  ok(answer.includes(en_default.plain.showNumbers), "SimpleView: the numbers are reachable");
  ok(!answer.includes("susceptibility"), "SimpleView: no jargon on the closed card");
  for (const level of ["Safe", "Watch", "Warning", "Evacuate"]) {
    const cell = { ...byVerdict.ok.cell, riskClass: level, risk: 0.5 };
    const html = render(simple({ result: { ...byVerdict.ok, cell } }), `SimpleView/${level}`);
    ok(html.includes(en_default.plain.level[level].headline), `SimpleView: ${level} headline`);
    for (let i = 1; i <= 3; i += 1) {
      ok(html.includes(en_default.plain.level[level][`do${i}`]), `SimpleView: ${level} action ${i}`);
    }
  }
  const nodata = render(simple({ result: byVerdict.unmonitored }), "SimpleView/unmonitored");
  ok(nodata.includes(en_default.plain.nodataTitle), "SimpleView: unmonitored says so plainly");
  ok(
    !nodata.includes(en_default.plain.level.Safe.headline),
    'SimpleView: no data is never shown as "Safe today"'
  );
  if (byVerdict.outside) {
    const outside = render(simple({ result: byVerdict.outside }), "SimpleView/outside");
    ok(outside.includes(en_default.plain.outsideTitle), "SimpleView: outside the region says so");
  }
  render(simple({ result: null, placesReady: false }), "SimpleView/loading");
}
{
  const html = render(/* @__PURE__ */ jsx9(WelcomeModal, { open: true, onClose: () => {
  } }), "WelcomeModal/open");
  ok(html.includes(en_default.welcome.s2Title), "WelcomeModal: the two-halves card is present");
  ok(html.includes('role="dialog"'), "WelcomeModal: announced as a dialog");
  eq(
    render(/* @__PURE__ */ jsx9(WelcomeModal, { open: false, onClose: () => {
    } }), "WelcomeModal/closed"),
    "",
    "WelcomeModal: closed renders nothing"
  );
}
{
  const head = (mode) => render(
    /* @__PURE__ */ jsx9(
      Header,
      {
        colorMode: "risk",
        onColorMode: () => {
        },
        online: true,
        onMethodology: () => {
        },
        mode,
        onMode: () => {
        },
        onHelp: () => {
        }
      }
    ),
    `Header/${mode}`
  );
  const simpleHead = head("simple");
  const detailHead = head("detailed");
  for (const html of [simpleHead, detailHead]) {
    ok(html.includes(en_default.header.viewSimple), "Header: the view switch is always present");
    ok(html.includes(en_default.header.viewDetailed));
  }
  ok(
    !simpleHead.includes(en_default.header.methodology),
    "Header: operator-only controls are hidden in simple mode, not disabled"
  );
  ok(detailHead.includes(en_default.header.methodology), "Header: methodology returns in detailed mode");
}
var panel = (props) => /* @__PURE__ */ jsx9(
  RainfallPanel,
  {
    rain24h: 60,
    rain7d: 200,
    onChange: () => {
    },
    onFetchLive: async () => {
    },
    onLead: () => {
    },
    nodeCount: 121,
    ...props
  }
);
for (const lead of [0, 24, 48, 72]) {
  const html = render(panel({ source: "live", lead, leadWindow: "2026-09-11T14:00" }), `RainfallPanel/live/+${lead}`);
  ok(html.includes('aria-checked="true"'), `RainfallPanel: lead +${lead} marks one button selected`);
  ok(
    (html.match(/aria-checked="true"/g) || []).length === 1,
    `RainfallPanel: lead +${lead} selects exactly one`
  );
  ok(
    (html.match(/disabled=""/g) || []).length === 0,
    `RainfallPanel: lead +${lead} is choosable when live`
  );
}
var simHtml = render(panel({ source: "sim", lead: 0 }), "RainfallPanel/sim");
ok(
  (simHtml.match(/disabled=""/g) || []).length === 4,
  "RainfallPanel: every lead is disabled in a slider scenario"
);
render(panel({ source: "live", lead: 24, leadWindow: "nonsense" }), "RainfallPanel/badStamp");
ok(
  render(panel({ source: "live", lead: 72, leadWindow: "2026-09-11T14:00", leadTruncated: true }), "RainfallPanel/truncated").length > 0,
  "RainfallPanel: a truncated lead renders its warning"
);
for (const lng of ["en", "hi", "as"]) {
  i18n2.changeLanguage(lng);
  render(panel({ source: "live", lead: 48, leadWindow: "2026-09-11T14:00" }), `RainfallPanel/${lng}`);
  render(simple({ result: byVerdict.ok }), `SimpleView/${lng}`);
  render(simple({ result: byVerdict.unmonitored }), `SimpleView/nodata/${lng}`);
  render(simple({ result: null }), `SimpleView/empty/${lng}`);
  render(/* @__PURE__ */ jsx9(WelcomeModal, { open: true, onClose: () => {
  } }), `WelcomeModal/${lng}`);
  render(panel({ source: "sim", lead: 0 }), `RainfallPanel/sim/${lng}`);
  render(/* @__PURE__ */ jsx9(PlaceSearch, { places, rainField: null, uniformRain: {}, onSelect: () => {
  } }), `PlaceSearch/${lng}`);
  render(/* @__PURE__ */ jsx9(PlaceResultCard, { result: byVerdict.ok, features: meta.features, importance: meta.feature_importance, onClose: () => {
  } }), `PlaceResultCard/${lng}`);
  render(/* @__PURE__ */ jsx9(PlaceResultCard, { result: byVerdict.outside, onClose: () => {
  } }), `PlaceResultCard/outside/${lng}`);
}
i18n2.changeLanguage("en");
ok(missingKeys.size === 0, `no missing i18n keys (saw: ${[...missingKeys].join(", ") || "none"})`);
console.log(`render: all ${checks} assertions passed, 0 missing i18n keys`);
