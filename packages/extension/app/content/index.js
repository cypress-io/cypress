const browser = require('webextension-polyfill')

window.onload = () => {
  if (window.recorderInjected) return

  Object.defineProperty(window, 'recorderInjected', { value: true, writable: false })

  // Setup message passing
  // const port = browser.runtime.connect(browser.runtime.id)

  // browser.runtime.onMessage.addListener((msg) => window.postMessage(msg, '*'))
  browser.runtime.onMessage.addListener((event) => {
    // Relay client messages
    if (event.source === window && event.data.type) {
      browser.runtime.sendMessage(event.data)
    }

    if (event.data.type === 'PLAYBACK_COMPLETE') {
      browser.runtime.sendMessage({ type: 'REC_STOP' }, '*')
    }

    if (event.data.downloadComplete) {
      document.querySelector('html').classList.add('downloadComplete')
    }
  })

  browser.runtime.sendMessage({ type: 'REC_CLIENT_PLAY', data: { url: window.location.origin } })
}

// "content_scripts": [{
//   "matches": ["<all_urls>"],
//   "js": ["content_script.js"],
//   "run_at": "document_start"
// }],
