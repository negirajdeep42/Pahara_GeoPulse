// src/lib/render.test.jsx
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

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
    language: "Language"
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
    nodes: "{{count}} rainfall nodes on a 0.5\xB0 lattice"
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
    language: "\u092D\u093E\u0937\u093E"
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
    nodes: "0.5\xB0 \u091C\u093E\u0932\u0915 \u092A\u0930 {{count}} \u0935\u0930\u094D\u0937\u093E \u0928\u094B\u0921"
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
    language: "\u09AD\u09BE\u09B7\u09BE"
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
    nodes: "0.5\xB0 \u099C\u09BE\u09B2\u09BF\u0995\u09BE\u09A4 {{count}} \u09AC\u09F0\u09B7\u09C1\u09A3 \u09A8\u09CB\u09A1"
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

// src/lib/openMeteo.js
var FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
var HOURLY_QUERY = "hourly=precipitation&past_days=7&forecast_days=1";
var OPEN_METEO_URL = `${FORECAST_BASE}?latitude=25.4&longitude=93.0&${HOURLY_QUERY}`;
var RAIN_NODE_DEG = 0.5;
function nodeKeyFor(lat, lon, step = RAIN_NODE_DEG) {
  const a = Number(lat);
  const b = Number(lon);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return `${Math.floor(a / step)}:${Math.floor(b / step)}`;
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
  return /* @__PURE__ */ jsxs2("section", { className: "panel pointer-events-auto w-[340px] shrink-0 border-b-0", children: [
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
  return /* @__PURE__ */ jsxs3("aside", { className: "pointer-events-auto flex h-full w-[340px] animate-slide-in flex-col border-l border-line bg-ink-800/95 shadow-2xl shadow-black/70 backdrop-blur", children: [
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
import { jsx as jsx4 } from "react/jsx-runtime";
var checks = 0;
var missingKeys = /* @__PURE__ */ new Set();
var ok = (cond, msg) => {
  assert.ok(cond, msg);
  checks += 1;
};
i18n.use(initReactI18next).init({
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
    /* @__PURE__ */ jsx4(PlaceSearch, { places, rainField: null, uniformRain: { rain24h: 60, rain7d: 200 }, onSelect: () => {
    } }),
    "PlaceSearch"
  );
  ok(html.includes("combobox"), "search input is a combobox");
  ok(html.includes(en_default.search.placeholder), "placeholder comes from i18n");
  ok(
    render(/* @__PURE__ */ jsx4(PlaceSearch, { places: [], rainField: null, uniformRain: {}, onSelect: () => {
    } }), "PlaceSearch/empty").length > 0,
    "search survives an empty place list"
  );
  ok(
    render(/* @__PURE__ */ jsx4(PlaceSearch, { places, rainField: null, uniformRain: {}, onSelect: () => {
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
    /* @__PURE__ */ jsx4(
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
    /* @__PURE__ */ jsx4(PlaceResultCard, { result: distantCase, features: meta.features, importance: meta.feature_importance, onClose: () => {
    } }),
    "PlaceResultCard/distant"
  );
  ok(html.includes("Nearest monitored cell"), "a distant stand-in cell is labelled as such");
}
{
  const withHint = places.map((p) => resolvePlace(p, scored)).find((r) => r.verdict === "ok" && r.higher);
  ok(withHint, "found a place with a nearer higher-risk zone");
  const html = render(
    /* @__PURE__ */ jsx4(PlaceResultCard, { result: withHint, features: meta.features, importance: meta.feature_importance, onClose: () => {
    } }),
    "PlaceResultCard/higher-risk"
  );
  ok(html.includes("Nearest higher-risk zone"), "the higher-risk hint renders");
  ok(/\d+\.\d+ km (N|NE|E|SE|S|SW|W|NW)\b/.test(html), "the hint carries a distance and a bearing");
}
render(/* @__PURE__ */ jsx4(PlaceResultCard, { result: null, onClose: () => {
} }), "PlaceResultCard/null");
render(
  /* @__PURE__ */ jsx4(PlaceResultCard, { result: { verdict: "ok", point: { name: "X", lat: 25, lon: 93 }, cell: { susceptibility: 0.5, trigger: 0.4, risk: 0.2, riskClass: "Watch" }, km: 1 }, onClose: () => {
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
      /* @__PURE__ */ jsx4(CellInspector, { cell: f.properties, trigger: 0.42, rain24h: 60, rain7d: 200, features: feats, importance: imp, onClose: () => {
      } }),
      `CellInspector/${label}`
    );
  }
}
for (const lng of ["en", "hi", "as"]) {
  i18n.changeLanguage(lng);
  render(/* @__PURE__ */ jsx4(PlaceSearch, { places, rainField: null, uniformRain: {}, onSelect: () => {
  } }), `PlaceSearch/${lng}`);
  render(/* @__PURE__ */ jsx4(PlaceResultCard, { result: byVerdict.ok, features: meta.features, importance: meta.feature_importance, onClose: () => {
  } }), `PlaceResultCard/${lng}`);
  render(/* @__PURE__ */ jsx4(PlaceResultCard, { result: byVerdict.outside, onClose: () => {
  } }), `PlaceResultCard/outside/${lng}`);
}
i18n.changeLanguage("en");
ok(missingKeys.size === 0, `no missing i18n keys (saw: ${[...missingKeys].join(", ") || "none"})`);
console.log(`render: all ${checks} assertions passed, 0 missing i18n keys`);
