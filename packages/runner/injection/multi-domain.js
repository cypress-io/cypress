/**
 * This is the entry point for the script that gets injected into
 * the AUT on a secondary domain. It gets bundled on its own and injected
 * into the <head> of the AUT by `packages/proxy`.
 *
 * If adding to this bundle, try to keep it light and free of
 * dependencies.
 */

import { createTimers } from './timers'

// TODO: don't hard-code the index. need it to be predictable or need
// to search for the right one somehow. will need to be fixed when we
// test out visiting a 3rd domain
const cyBridgeFrame = window.parent.frames[2]

const Cypress = cyBridgeFrame.Cypress

if (!Cypress) {
  throw new Error('Something went terribly wrong and we cannot proceed. We expected to find the global \
    Cypress in the spec bridge window but it is missing!. This should never happen and likely is a bug. Please open an issue!')
}

const timers = createTimers()

Cypress.removeAllListeners('app:timers:reset')
Cypress.removeAllListeners('app:timers:pause')

Cypress.on('app:timers:reset', timers.reset)
Cypress.on('app:timers:pause', timers.pause)

timers.wrap()

Cypress.action('app:window:before:load', window)
