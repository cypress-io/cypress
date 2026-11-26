/**
 * This is the entry point for the script that gets injected into
 * the AUT. It gets bundled on its own and injected into the <head>
 * of the AUT by `packages/proxy`.
 *
 * If adding to this bundle, try to keep it light and free of
 * dependencies.
 */

import { createTimers } from './timers'
import { patchXmlHttpRequest } from './patches/xmlHttpRequest'
import { patchElementIntegrity } from './patches/integrity'

// The driver mixes its event emitter onto Cypress at runtime, which the
// `Window.Cypress` typing doesn't reflect, so check for it to narrow.
function assertParentCypress (Cypress: Cypress.Cypress | undefined): asserts Cypress is typeof globalThis.Cypress {
  if (!Cypress || typeof Cypress !== 'object' || !('removeAllListeners' in Cypress)) {
    throw new Error('The script Cypress injects into this page did not find a usable Cypress runner at `window.parent.Cypress`, so Cypress cannot control this page.\n\nThis is likely a bug in Cypress. Open an issue that includes the steps that led to this error: https://on.cypress.io/new-issue')
  }
}

assertParentCypress(parent.Cypress)

// Keep this as one statement: the server's integration specs detect full
// injection by finding `window.Cypress=parent.Cypress` in the minified bundle.
const Cypress = window.Cypress = parent.Cypress

patchXmlHttpRequest(window)

// Strip SRI from <script>/<link> in the primary AUT frame so proxy-rewritten first-party
// resources aren't blocked. Cross-origin frames are handled in cross-origin.js.
if (Cypress.config('removeSRIAttributes')) {
  patchElementIntegrity(window)
}

// Timers are wrapped here rather than in the driver so that uncaught errors
// thrown in timer callbacks reach the AUT's 'error' handler instead of the
// top frame's.
const timers = createTimers()

Cypress.removeAllListeners('app:timers:reset')
Cypress.removeAllListeners('app:timers:pause')

Cypress.on('app:timers:reset', timers.reset)
Cypress.on('app:timers:pause', timers.pause)

timers.wrap()

Cypress.action('app:window:before:load', window)
