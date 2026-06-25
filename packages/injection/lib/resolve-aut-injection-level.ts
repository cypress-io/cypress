/**
 * The injection decision for a single frame, evaluated in the browser by the
 * bridge. Mirrors the proxy-side `resolveInjectionLevel`
 * (`@packages/network-interception`) but operates on browser-readable signals
 * rather than HTTP response facts.
 *
 * - `none`         → the runner's own top frame; do nothing
 * - `full`         → the AUT frame, same-origin as top (or pre-navigation "null" origin)
 * - `cross-origin` → the AUT frame, cross-origin from top (#33859)
 * - `partial`      → any other frame (document.domain glue only)
 */
export type AutInjectionLevel = 'none' | 'full' | 'cross-origin' | 'partial'

/**
 * Browser signals consumed by {@link resolveAutInjectionLevel}. Gathering these
 * (reading `window.name`, catching cross-origin throws on `top.location`) is
 * irreducible browser glue and lives in {@link installAutBridgeInFrame}; the decision
 * they feed is the pure, testable part.
 */
export interface AutFrameSignals {
  /** `window === window.top` — this is the top (runner) frame. */
  isTop: boolean
  /** `window.name` — seeded from the AUT iframe's name attribute, readable cross-origin. */
  windowName: string | undefined
  /** `window.frameElement.id` — same-origin-only fallback; `undefined` when inaccessible. */
  frameElementId: string | undefined
  /** `window.location.origin === 'null'` — pre-navigation about:blank state. */
  isNullOrigin: boolean
  /** `window.top.location.origin === window.location.origin` — `false` when the access throws cross-origin. */
  originMatchesTop: boolean
}

/**
 * Pure injection-level decision for the AUT bridge. Bundled (by rollup) into the page-context
 * script alongside {@link installAutBridgeInFrame}; it is also unit-tested directly in this package.
 */
export function resolveAutInjectionLevel (marker: string, signals: AutFrameSignals): AutInjectionLevel {
  // if it's top, do nothing (the runner's own frame)
  if (signals.isTop) {
    return 'none'
  }

  // primary: window.name — seeded from the AUT iframe's name attribute. Readable
  // cross-origin (unlike frameElement.id) and persists across navigations.
  const nameIsAutFrame = typeof signals.windowName === 'string' && signals.windowName.indexOf(marker) === 0

  // fallback: frameElement.id (only readable same-origin / document.domain-reachable)
  // in case the app under test overwrote window.name.
  const frameIdIsAutFrame = typeof signals.frameElementId === 'string' && signals.frameElementId.indexOf(marker) === 0

  const isAutFrame = nameIsAutFrame || frameIdIsAutFrame

  // full: AUT frame whose origin matches top, or the pre-navigation "null" origin.
  if (isAutFrame && (signals.originMatchesTop || signals.isNullOrigin)) {
    return 'full'
  }

  // cross-origin (#33859): AUT frame at a different origin than top.
  if (isAutFrame && !signals.originMatchesTop) {
    return 'cross-origin'
  }

  // partial: any non-AUT frame (document.domain glue only).
  return 'partial'
}
