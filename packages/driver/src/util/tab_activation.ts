import type { ICypress } from '../cypress'

const isCypressInCypress = document.defaultView !== top

function activateMainTab () {
  // Don't need to activate the main tab if it already has focus
  if (document.hasFocus()) return

  return new Promise<void>((resolve) => {
    const url = `${window.location.origin}${window.location.pathname}`

    // This sends a message on the window that the extension content script
    // listens for in order to carry out activating the main tab
    window.postMessage({ message: 'cypress:extension:activate:main:tab', url }, '*')

    function onMessage ({ data, source }) {
      // only accept messages from ourself
      if (source !== window) return

      if (data.message === 'cypress:extension:main:tab:activated') {
        window.removeEventListener('message', onMessage)

        resolve()
      }
    }

    // The reply from the extension comes back via the same means, a message
    // sent on the window
    window.addEventListener('message', onMessage)
  })
}

// Ensures the main Cypress tab has focus before every command
// and at the end of the test run
export function handleTabActivation (Cypress: ICypress) {
  // - Only implemented for Chromium right now. Support for Firefox/webkit
  //   could be added later
  // - Electron doesn't have tabs
  // - Focus doesn't matter for headless browsers and old headless Chrome
  //   doesn't run the extension
  // - Don't need to worry about tabs for Cypress in Cypress tests (and they
  //   can't currently communicate with the extension anyway)
  if (
    !Cypress.isBrowser({ family: 'chromium', name: '!electron', isHeadless: false })
    || isCypressInCypress
  ) return

  Cypress.on('command:start:async', activateMainTab)
  Cypress.on('test:after:run:async', activateMainTab)
}
