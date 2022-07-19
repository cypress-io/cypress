/**
 * This is the entry point for the script that gets injected into
 * the AUT on a secondary origin. It gets bundled on its own and injected
 * into the <head> of the AUT by `packages/proxy`.
 *
 * If adding to this bundle, try to keep it light and free of
 * dependencies.
 */

import { createTimers } from './timers'
import { patchDocumentCookie } from './cookies'

const findCypress = () => {
  for (let index = 0; index < window.parent.frames.length; index++) {
    const frame = window.parent.frames[index]

    try {
      // If Cypress is defined and we haven't gotten a cross origin error we have found the correct bridge.
      if (frame.Cypress) {
        // If the ending $ is included in the template string, it breaks transpilation
        // eslint-disable-next-line no-useless-concat
        const frameHostRegex = new RegExp(`(^|\\.)${ frame.location.host.replaceAll('.', '\\.') }` + '$')

        // Compare the locations origin policy without pulling in more dependencies.
        // Compare host, protocol and test that the window's host ends with the frame's host.
        // This works because the spec bridge's host is always created without a sub domain.
        if (window.location.port === frame.location.port
          && window.location.protocol === frame.location.protocol
          && frameHostRegex.test(window.location.host)) {
          return frame.Cypress
        }
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

patchDocumentCookie(Cypress)

// the timers are wrapped in the injection code similar to the primary origin
const timers = createTimers()

Cypress.removeAllListeners('app:timers:reset')
Cypress.removeAllListeners('app:timers:pause')

Cypress.on('app:timers:reset', timers.reset)
Cypress.on('app:timers:pause', timers.pause)

timers.wrap()

Cypress.action('app:window:before:load', window)
