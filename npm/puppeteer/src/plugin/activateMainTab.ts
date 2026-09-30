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
      reject(new Error(`The Cypress extension did not respond within ${activationTimeout}ms.`))
    }, activationTimeout)
  })
}

export const activateMainTab = async (browser: Browser) => {
  const [page] = await browser.pages()

  if (!page) {
    return
  }

  try {
    await page.evaluate(sendActivationMessage, ACTIVATION_TIMEOUT)
  } catch (extensionError: any) {
    // The extension's service worker can be missing or unreachable for a whole
    // headed session, so it never replies. Bringing the tab to the front over
    // CDP doesn't depend on the extension, but it can also take OS window
    // focus, so it's only the fallback.
    try {
      await page.bringToFront()
    } catch (cdpError: any) {
      throw new Error(`${extensionError?.message ?? String(extensionError)} Bringing the main tab to the front over CDP also failed: ${cdpError?.message ?? String(cdpError)}`)
    }
  }
}
