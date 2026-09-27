import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query from JavaScript.
 *
 * Tailwind's responsive classes cover almost everything, but not this: the
 * operator dashboard puts its panels in four different corners on a desktop
 * and in one scrolling sheet on a phone. No single container can be both, and
 * rendering the panels twice would mount two copies of every piece of local
 * state - two fetch buttons, two dispatch buttons, two of everything that can
 * be mid-request. So the layout is chosen here instead, and each panel is
 * mounted exactly once.
 *
 * Crossing the breakpoint re-parents the panels, which React handles as an
 * unmount and remount. That is a real cost, and it is paid only by someone
 * resizing a window across 768px - not by anyone using the app.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    setMatches(mql.matches)
    // addListener is the Safari < 14 spelling; still worth keeping for a
    // dashboard aimed at whatever phone is actually in someone's hand.
    if (mql.addEventListener) mql.addEventListener('change', onChange)
    else mql.addListener(onChange)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange)
      else mql.removeListener(onChange)
    }
  }, [query])

  return matches
}

/** The one breakpoint the dashboard layout turns on. Matches Tailwind's `md`. */
export const WIDE_QUERY = '(min-width: 768px)'
