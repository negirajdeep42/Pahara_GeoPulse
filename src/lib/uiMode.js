// Which of the two faces of PAHARA a visitor is looking at.
//
//   simple    plain words, large type, one answer about one place. What a
//             resident on a phone in the hills needs, and the default.
//   detailed  the full operator dashboard - every panel, every number, the
//             trigger breakdown, the factor bars. Unchanged from what it was.
//
// The two are the same data and the same risk engine. Only the vocabulary and
// the density differ. Nobody is shown a different answer in simple mode; they
// are shown the same answer in fewer words.
//
// Simple is the default because the cost of the two mistakes is not symmetric.
// An operator shown the simple view loses ten seconds finding this toggle. A
// villager shown the operator dashboard closes the tab.

export const UI_MODES = ['simple', 'detailed']

const STORAGE_KEY = 'pahara.mode'

/**
 * The mode to open in.
 *
 * A returning visitor gets whatever they last chose. A first-time visitor gets
 * simple. Blocked storage - private browsing, a locked-down device - falls
 * through to the default rather than throwing, exactly as the language
 * preference does.
 */
export function initialMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (UI_MODES.includes(saved)) return saved
  } catch {
    // Private mode / blocked storage: fall through to the default.
  }
  return 'simple'
}

export function persistMode(mode) {
  if (!UI_MODES.includes(mode)) return
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Persisting the choice is a convenience, not a requirement.
  }
}

// --------------------------------------------------------- first-run welcome

const SEEN_KEY = 'pahara.welcomed'

/** True the first time someone opens PAHARA on this device. */
export function shouldWelcome() {
  try {
    return localStorage.getItem(SEEN_KEY) !== '1'
  } catch {
    // If we cannot remember that it was shown, do not show it - a welcome
    // screen on every single load is worse than never showing one.
    return false
  }
}

export function markWelcomed() {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Nothing to do; the screen simply may appear again next time.
  }
}
