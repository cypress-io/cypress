/**
 * This is the entry point for the script that gets injected into
 * the AUT. It gets bundled on its own and injected into the <head>
 * of the AUT by `packages/proxy`.
 *
 * If adding to this bundle, try to keep it light and free of
 * dependencies.
 */

import { createTimers } from './timers'

const Cypress = window.Cypress = parent.Cypress

if (!Cypress) {
  throw new Error('Something went terribly wrong and we cannot proceed. We expected to find the global Cypress in the parent window but it is missing!. This should never happen and likely is a bug. Please open an issue!')
}

// We wrap timers in the injection code because if we do it in the driver (like
// we used to do), any uncaught errors thrown in the timer callbacks would
// get picked up by the top frame's 'error' handler instead of the AUT's.
// We need to wrap the timer callbacks in the AUT itself for errors to
// propagate properly.
const timers = createTimers()

Cypress.removeAllListeners('app:timers:reset')
Cypress.removeAllListeners('app:timers:pause')

Cypress.on('app:timers:reset', timers.reset)
Cypress.on('app:timers:pause', timers.pause)

timers.wrap()

/**
 * When we create a listener from the runner for the AUT, we need to ensure the function
 * is sourced from the AUT, otherwise the event will not be associated correctly.
 *
 * We do this by creating a function from the AUT window, keeping in state to ensure we
 * only have a single fn
 *
 * https://github.com/cypress-io/cypress/pull/15995
 * https://github.com/cypress-io/cypress/issues/19697
 */
Cypress.bridgeContentWindowListener = function (fn) {
  return function () {
    fn.apply(this, arguments)
  }
}

Cypress.action('app:window:before:load', window)
