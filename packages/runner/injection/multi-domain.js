/**
 * This is the entry point for the script that gets injected into
 * the AUT on a secondary domain. It gets bundled on its own and injected
 * into the <head> of the AUT by `packages/proxy`.
 *
 * If adding to this bundle, try to keep it light and free of
 * dependencies.
 */

import { createTimers } from './timers'

const findCypress = () => {
  for (let index = 0; index < window.parent.frames.length; index++) {
    const frame = window.parent.frames[index]

    try {
      // If Cypress is defined and we haven't gotten a cross domain error we have found the correct bridge.
      if (frame.Cypress) {
        return frame.Cypress
      }
    } catch (error) {
      // Catch DOMException: Blocked a frame from accessing a cross-origin frame.
      if (error.name !== 'SecurityError') {
        throw error
      }
    }
  }
}

const Cypress = findCypress()

// TODO: If the spec bridge is not found we should throw some kind of error to main cypress, this should account for redirects so maybe wait a bit before throwing?
// This may not be needed if we defer to the first command
if (!Cypress) {
  throw new Error('Something went terribly wrong and we cannot proceed. We expected to find the global \
    Cypress in the spec bridge window but it is missing.')
}

// the timers are wrapped in the injection code similar to the primary domain
const timers = createTimers()

Cypress.removeAllListeners('app:timers:reset')
Cypress.removeAllListeners('app:timers:pause')

Cypress.on('app:timers:reset', timers.reset)
Cypress.on('app:timers:pause', timers.pause)

timers.wrap()

Cypress.action('app:window:before:load', window)
