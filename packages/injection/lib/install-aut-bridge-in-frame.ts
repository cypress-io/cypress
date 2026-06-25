import { resolveAutInjectionLevel } from './resolve-aut-injection-level'
import type { AutInjectionLevel } from './resolve-aut-injection-level'

/**
 * The subset of `window` the in-frame bridge reads. Declared structurally so the
 * function can be exercised with a plain fake object in unit tests, and so it
 * stays free of any DOM-lib coupling.
 */
export interface BridgeWindow {
  name?: string
  /** `window.top`; `=== win` for the top (runner) frame. */
  top: BridgeWindow
  /** `window.frameElement`; `null` (or a throwing access) when cross-origin. */
  frameElement: { id?: string } | null
  location: { origin: string }
}

/** The per-level injection bodies, run for whichever level this frame resolves to. */
interface BridgeHandlers {
  /** AUT frame, same-origin as top (or pre-navigation "null" origin). */
  onFull: () => void
  /** AUT frame, cross-origin from top (#33859). */
  onCrossOrigin: () => void
  /** Any other frame (document.domain glue). */
  onPartial: () => void
}

/**
 * Gather the browser signals for the current frame, resolve the injection level,
 * and run the matching handler. This is the body of the page-context script the
 * bridge registers, which fires in EVERY frame.
 *
 * Returns the resolved level so callers (and unit tests) can assert the decision
 * independently of the side-effecting handlers.
 */
export function installAutBridgeInFrame (
  win: BridgeWindow,
  marker: string,
  handlers: BridgeHandlers,
): AutInjectionLevel {
  // primary AUT identifier: window.name (readable cross-origin, persists across navigations)
  const windowName = typeof win.name === 'string' ? win.name : undefined

  // fallback: frameElement.id (only readable same-origin / document.domain-reachable)
  let frameElementId: string | undefined

  try {
    const frameElement = win.frameElement

    frameElementId = frameElement && typeof frameElement.id === 'string' ? frameElement.id : undefined
  } catch (e) {
    // frameElement is null/inaccessible cross-origin — leave frameElementId undefined
  }

  // pre-navigation (about:blank) reports origin as the string "null"; that's the
  // initial AUT document state, so treat it as full without requiring an origin match.
  const isNullOrigin = win.location.origin === 'null'

  // does this frame's origin match top's? accessing top.location throws cross-origin.
  let originMatchesTop = false

  try {
    originMatchesTop = win.top.location.origin === win.location.origin
  } catch (e) {
    originMatchesTop = false
  }

  const level = resolveAutInjectionLevel(marker, {
    isTop: win === win.top,
    windowName,
    frameElementId,
    isNullOrigin,
    originMatchesTop,
  })

  if (level === 'full') {
    handlers.onFull()
  } else if (level === 'cross-origin') {
    handlers.onCrossOrigin()
  } else if (level === 'partial') {
    handlers.onPartial()
  }

  // level === 'none' → the runner's own top frame; do nothing

  return level
}
