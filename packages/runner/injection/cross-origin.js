/**
 * This is the entry point for the script that gets injected into
 * the AUT on a secondary origin. It gets bundled on its own and injected
 * into the <head> of the AUT by `packages/proxy`.
 *
 * If adding to this bundle, try to keep it light and free of
 * dependencies.
 */

// Globals defined in inject.ts
/* global cypressConfig */

import { createTimers } from './timers'
import { patchDocumentCookie } from './patches/cookies'
import { patchElementIntegrity } from './patches/setAttribute'

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

// Event listener to echo back the current location of the iframe
window.addEventListener('message', (event) => {
  if (event.data === 'aut:cypress:location') {
    event.ports[0].postMessage(window.location.href)
  }
})

// Post the before unload event. We post the load event here instead of in the cross origin communicator
// because we want to notify the primary cypress instance of unload events even if a corresponding spec bridge
// has not been created.
window.addEventListener('beforeunload', () => {
  parent.postMessage({ event: 'cross:origin:before:unload', data: window.location.origin }, '*')
})

// This error could also be handled by creating and attaching a spec bridge and re-throwing the error.
// If this approach proves to be an issue we could try the new solution.
const handleErrorEvent = (event) => {
  if (window.Cypress) {
    // A spec bridge has attached so we don't need to forward errors to top anymore.
    window.removeEventListener('error', handleErrorEvent)
  } else {
    const { error } = event
    const data = { href: window.location.href }

    if (error && error.stack && error.message) {
      data.message = error.message
      data.stack = error.stack
    } else {
      data.message = error
    }

    window.top.postMessage({ event: 'cross:origin:aut:throw:error', data }, '*')
  }
}

window.addEventListener('error', handleErrorEvent)

// Apply Patches
patchDocumentCookie(window)

// return null to trick contentWindow into thinking
// its not been iFramed if modifyObstructiveCode is true
if (cypressConfig.modifyObstructiveCode) {
  Object.defineProperty(window, 'frameElement', {
    get () {
      return null
    },
  })
}

if (cypressConfig.modifyObstructiveThirdPartyCode) {
  patchElementIntegrity(window)
}

// the timers are wrapped in the injection code similar to the primary origin
const timers = createTimers()

timers.wrap()

const Cypress = findCypress()

// Attach these to window so cypress can call them when it attaches.
window.cypressTimersReset = timers.reset
window.cypressTimersPause = timers.pause

// Check for cy too to prevent a race condition for attaching.
if (Cypress && Cypress.cy) {
  Cypress.action('app:window:before:load', window)
}
