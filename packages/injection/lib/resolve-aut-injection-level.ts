/**
 * The injection decision for a single frame, evaluated in the browser by the
 * bridge. Mirrors the proxy-side `resolveInjectionLevel`
 * (`@packages/network-interception`) but operates on browser-readable signals
 * rather than HTTP response facts.
 *
 * - `none`         → nothing to inject: the runner's own top frame, or any non-AUT frame
 * - `full`         → the AUT frame, same-origin as the primary origin (or pre-navigation "null" origin)
 * - `cross-origin` → the AUT frame, cross-origin from the primary origin (#33859)
 *
 * (There is no separate `partial` level: any `document.domain` glue is applied up front for every
 * frame by `injectAutBridge`, so a non-AUT frame has nothing left to inject and resolves to `none`.)
 */
export type AutInjectionLevel = 'none' | 'full' | 'cross-origin'

/**
 * Browser signals consumed by {@link resolveAutInjectionLevel}. Gathering these
 * (reading `window.name`, the frame's own origin, `frameElement.id`) is irreducible
 * browser glue and lives in {@link installAutBridgeInFrame}; the decision they feed
 * is the pure, testable part.
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
  /** the frame's own origin matches the primary origin (both reduced through the injector); `false` when they differ. */
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

  // full: AUT frame whose origin matches the primary origin, or the pre-navigation "null" origin.
  if (isAutFrame && (signals.originMatchesTop || signals.isNullOrigin)) {
    return 'full'
  }

  // cross-origin (#33859): AUT frame at a different origin than the primary origin.
  if (isAutFrame && !signals.originMatchesTop) {
    return 'cross-origin'
  }

  // none: any non-AUT frame — nothing to inject (document.domain glue, if any, is applied up front
  // by injectAutBridge for every frame).
  return 'none'
}
