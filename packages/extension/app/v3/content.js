/* global chrome, window */

// this content script has access to the DOM, but is otherwise isolated from
// the page running Cypress, so we have to use postMessage to communicate. it
// also doesn't have direct access to the extension API, so we use the
// messaging API it can access to communicate with the background service
// worker script. so essentially, it's an intermediary between Cypress and
// the extension background script
const port = chrome.runtime.connect()

// this listens for messages from the main window that Cypress runs on. it's
// a very global message bus, so messages could come from a variety of sources
window.addEventListener('message', ({ data, source }) => {
  // only accept messages from ourself
  if (source !== window) return

  // this is the only message we're currently interested in, which tells us
  // to activate the main tab
  if (data.message === 'cypress:extension:activate:main:tab') {
    port.postMessage({ message: 'activate:main:tab', url: data.url })
  }
})

// this listens for messages from the background service worker script
port.onMessage.addListener(({ message }) => {
  // this lets us know the message we sent to the background script to activate
  // the main tab was successful, so we in turn send it on to Cypress
  // via postMessage
  if (message === 'main:tab:activated') {
    window.postMessage({ message: 'cypress:extension:main:tab:activated' }, '*')
  }
})
