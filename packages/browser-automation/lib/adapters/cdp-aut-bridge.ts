import type { Protocol } from 'devtools-protocol'
import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import { getRunnerInjectionContents, getRunnerCrossOriginInjectionContents } from '@packages/resolve-dist'
import { AUT_FRAME_NAME_IDENTIFIER } from '../aut-identifier'

/**
 * Minimal CDP send signature this adapter needs. Defined locally so the package
 * stays free of any `@packages/server` dependency (the real client is passed by
 * reference at construction).
 */
export type SendCdpCommand = <T extends keyof ProtocolMapping.Commands>(
  command: T,
  params?: ProtocolMapping.Commands[T]['paramsType'][0],
) => Promise<ProtocolMapping.Commands[T]['returnType']>

/**
 * Installs the Cypress bridge (`window.Cypress`) into the AUT via CDP, for the
 * HTTP/2 / proxy-bypass path where the proxy is no longer on the AUT traffic path
 * to rewrite HTML.
 *
 * Design (see issue #33849):
 * - Uses `Page.addScriptToEvaluateOnNewDocument` so the bridge runs before any
 *   application script and survives `cy.reload()` / same-tab navigations for free.
 * - That API is per-TARGET and runs in EVERY frame, so the registered source
 *   self-guards on `window.name` and only initializes in the AUT frame (the
 *   runner's own top frame and child frames no-op).
 * - Register-ONCE per AUT page lifecycle: registering on every frame event would
 *   stack N persistent scripts and install the bridge N times.
 * - Bridge contents come from `@packages/resolve-dist` (`getRunnerInjectionContents`),
 *   the same source the proxy uses — no duplicated bridge strings.
 */
export class CdpAutBridgeAdapter {
  private scriptIdentifier?: Protocol.Page.ScriptIdentifier

  constructor (private readonly send: SendCdpCommand) {}

  /**
   * Register the bridge on the AUT target. Should be called as the AUT frame
   * attaches (while still `about:blank`, before `cy.visit` navigates) so the
   * script is in place before the first document commits.
   *
   */
  async installAutBridge (): Promise<void> {
    // register-once
    if (this.scriptIdentifier) {
      return
    }

    // getRunnerInjectionContents resolves a Buffer (fs.readFile with no encoding);
    // decode to a UTF-8 string for use as the addScriptToEvaluateOnNewDocument source.
    const fullInjectionContents = (await getRunnerInjectionContents()).toString('utf8')
    const crossOriginInjectionContents = (await getRunnerCrossOriginInjectionContents()).toString('utf8')
    const source = this.buildSource(fullInjectionContents, crossOriginInjectionContents)

    const { identifier } = await this.send('Page.addScriptToEvaluateOnNewDocument', { source })

    this.scriptIdentifier = identifier
  }

  /** Remove the bridge registration (e.g. on AUT teardown). */
  async removeAutBridge (): Promise<void> {
    if (!this.scriptIdentifier) {
      return
    }

    await this.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: this.scriptIdentifier })
    this.scriptIdentifier = undefined
  }

  /**
   * Wrap the raw bridge contents in the in-script injection-level gate. This is the
   * `resolveInjectionLevel` decision tree expressed in the browser:
   * - it's top                                     → do nothing (the runner frame)
   * - AUT frame ("Your project:" id) + origin matches top → `full`
   * - AUT frame ("Your project:" id) + origin ≠ top       → cross-origin (#33859)
   * - everything else                              → partial
   *
   * Signals: `window === window.top` (always readable); `window.name` (seeded from the
   * AUT iframe's name attribute — readable cross-origin and persistent — primary AUT
   * identifier) with `window.frameElement.id` as a same-origin fallback; and
   * `window.top.location.origin` (throws when cross-origin — caught as "doesn't match").
   *
   * NOTE: `full` and `cross-origin` injection are both wired (cross-origin uses the
   * spec-bridge contents — see #33859 for the full cross-origin flow). Still TODO: the
   * `partial` branch (document.domain glue, easy add) and CSP verification (clearer once
   * Cacie's middleware changes land). No `cspNonce` — CDP-injected scripts bypass page CSP.
   *
   * Why cross-origin is exercised even for a single AUT: with no document.domain, the AUT
   * loads at its true origin and is therefore cross-origin from the runner top, so
   * true-origin navigations (e.g. the navigation specs) take the cross-origin branch.
   * Injecting the spec-bridge contents there is what keeps them passing — empirically works.
   *
   * TODO(test): the gating logic stringified here should be extracted to standalone
   * business-logic functionality and unit-tested before it's consumed and stringified, rather
   * than only asserted as a string.
   *
   * NOTE: this is demo-able in its current state to show off the injection, though it's
   * nowhere near production ready. you should be able to run navigation.cy.js in the driver and see almost all the tests,
   * except the weird initial cookie tests, pass, pretty much meaning it validates our assumptions about the bridge working and cy.reload()
   */
  private buildSource (fullInjectionContents: string, crossOriginInjectionContents: string): string {
    return `;(function () {
  try {
    // if it's top, do nothing (the runner's own frame)
    if (window === window.top) {
      return
    }

    var marker = ${JSON.stringify(AUT_FRAME_NAME_IDENTIFIER)}

    // primary: window.name — seeded from the AUT iframe's name attribute. Readable
    // cross-origin (unlike frameElement.id) and persists across navigations.
    var isAutFrame = typeof window.name === 'string' && window.name.indexOf(marker) === 0

    // fallback: frameElement.id (only readable same-origin / document.domain-reachable)
    // in case the app under test overwrote window.name.
    if (!isAutFrame) {
      try {
        var frameElement = window.frameElement
        isAutFrame = !!(frameElement && typeof frameElement.id === 'string' && frameElement.id.indexOf(marker) === 0)
      } catch (e) {
        // frameElement is null/inaccessible cross-origin — leave isAutFrame as false
      }
    }

    // pre-navigation (about:blank) reports origin as the string "null"; that's the
    // initial AUT document state, so treat it as full without requiring an origin match.
    var isNullOrigin = window.location.origin === 'null'

    // does this frame's origin match top's? accessing top.location throws cross-origin.
    var originMatchesTop = false
    try {
      originMatchesTop = window.top.location.origin === window.location.origin
    } catch (e) {
      originMatchesTop = false
    }

    if (isAutFrame && (originMatchesTop || isNullOrigin)) {
      // full (origin match, or pre-navigation "null" origin)
      ${fullInjectionContents}
    } else if (isAutFrame && !originMatchesTop) {
      // cross-origin (#33859): spec-bridge contents — out of scope for the spike/MVP
      ${crossOriginInjectionContents}
    } else {
      // partial: document.domain only
      
    }
  } catch (e) {
    // swallow so a bridge failure never breaks the AUT document
  }
})();`
  }
}
