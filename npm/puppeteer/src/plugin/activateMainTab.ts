/// <reference lib="browser">
import type { Browser } from 'puppeteer-core'

export const ACTIVATION_TIMEOUT = 2000

const sendActivationMessage = (activationTimeout: number) => {
  // don't need to worry about tabs for Cy in Cy tests
  if (document.defaultView !== top) {
    return
  }

  let timeout: NodeJS.Timeout
  let onMessage: (ev: MessageEvent) => void

  // promise must resolve with a value for chai as promised to test resolution
  return new Promise<void>((resolve, reject) => {
    onMessage = (ev) => {
      if (ev.data.message === 'cypress:extension:main:tab:activated') {
        window.removeEventListener('message', onMessage)
        clearTimeout(timeout)
        resolve()
      }
    }

    window.addEventListener('message', onMessage)
    window.postMessage({ message: 'cypress:extension:activate:main:tab' })

    timeout = setTimeout(() => {
      window.removeEventListener('message', onMessage)
      reject()
    }, activationTimeout)
  })
}

export const activateMainTab = async (browser: Browser) => {
  // - Only implemented for Chromium right now. Support for Firefox/webkit
  //   could be added later
  // - Electron doesn't have tabs
  // - Focus doesn't matter for headless browsers and old headless Chrome
  //   doesn't run the extension
  const [page] = await browser.pages()

  if (page) {
    return page.evaluate(sendActivationMessage, ACTIVATION_TIMEOUT)
  }
}
