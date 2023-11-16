/* global chrome */

// this background script runs in a service worker. it has access to the
// extension API, but not direct access the web page or anything else
// running in the browser

// to debug this script, go to `chrome://inspect` in a new Chrome tab,
// select Service Workers on the left and click `inspect`. to reload changes
// go to `chrome://extensions` and hit the reload button under the Cypress
// extension. sometimes that doesn't work and requires re-launching Chrome
// and then reloading the extension via `chrome://extensions`

async function activateMainTab (url) {
  try {
    const tabs = await chrome.tabs.query({})

    const cypressTab = tabs.find((tab) => tab.url.includes(url))

    if (!cypressTab) return

    // this brings the main Cypress tab to the front of any other tabs
    // without Chrome stealing focus from other running apps
    await chrome.tabs.update(cypressTab.id, { active: true })
  } catch (err) {
    // ignore the error but log it. these logs only appear if you inspect
    // the service worker, so it won't clutter up the console for users

    // eslint-disable-next-line no-console
    console.log('Activating main Cypress tab errored:', err)
  }
}

// here we connect to the content script, which has access to the web page
// running Cypress, but not the extension API
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async ({ message, url }) => {
    if (message === 'activate:main:tab') {
      await activateMainTab(url)

      // send an ack back to let the content script know we successfully
      // activated the main tab
      port.postMessage({ message: 'main:tab:activated' })
    }
  })
})
