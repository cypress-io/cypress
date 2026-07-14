import { resolveAutInjectionLevel } from './resolve-aut-injection-level'
import { AUT_FRAME_NAME_IDENTIFIER } from '@packages/types'
import { DocumentDomainInjection } from '@packages/network-tools'
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
  /** `window.frameElement`; `null` when the embedding document is cross-origin. The read is guarded anyway, in case an engine throws a `SecurityError` instead — a throw is treated the same as `null`. */
  frameElement: { id?: string } | null
  location: { origin: string, href: string }
}

/** The per-level injection bodies, run for whichever level this frame resolves to. */
interface BridgeHandlers {
  /** AUT frame, same-origin as the primary origin (or the initial `about:blank` document). */
  onFull: () => void
  /** AUT frame, cross-origin from the primary origin. */
  onCrossOrigin: () => void
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
  injector: DocumentDomainInjection,
  primaryOrigin: string,
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
    // defensive: the spec returns null for a cross-origin embedder, but guard against an
    // engine surfacing the denial as a SecurityError — either way, no frameElementId
  }

  // the initial about:blank document (the AUT frame before cy.visit navigates it) has an opaque
  // origin, which location.origin serializes as the string "null". Other documents have opaque
  // origins too (sandboxed iframes, data: documents), so also require href === 'about:blank' to
  // scope this to the true pre-navigation document.
  const isInitialAboutBlank = win.location.origin === 'null' && win.location.href === 'about:blank'

  // does this frame belong to the same (super)domain as the primary/top origin?
  //
  // We compare THIS frame's own origin (always readable) against `primaryOrigin`, supplied by the
  // Node side — the same superdomain fact the server-side `resolveInjectionLevel` relies on. We
  // deliberately do NOT read `win.top.location`: a cross-subdomain AUT frame can't read top's
  // location under web security (it throws), so that read would always resolve to false in exactly
  // the case we need to detect.
  //
  // Reducing both origins through the injector means: with document.domain injection on,
  // app.foobar.com and www.foobar.com both reduce to foobar.com and match → full injection. With it
  // off, the full origins stay distinct → an AUT frame here resolves to cross-origin.
  let originMatchesTop = false

  try {
    originMatchesTop = injector.getOrigin(win.location.origin) === injector.getOrigin(primaryOrigin)
  } catch (e) {
    originMatchesTop = false
  }

  const level = resolveAutInjectionLevel(AUT_FRAME_NAME_IDENTIFIER, {
    isTop: win === win.top,
    windowName,
    frameElementId,
    isInitialAboutBlank,
    originMatchesTop,
  })

  if (level === 'full') {
    handlers.onFull()
  } else if (level === 'cross-origin') {
    handlers.onCrossOrigin()
  }

  // level === 'none' → the runner's own top frame, or a non-AUT frame; do nothing (any
  // document.domain assignment was already applied up front by injectAutBridge)

  return level
}
