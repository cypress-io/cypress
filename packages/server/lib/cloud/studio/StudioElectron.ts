// tslint:disable-next-line no-implicit-dependencies - electron dep needs to be defined
import { BrowserWindow } from 'electron'
import Debug from 'debug'

const debug = Debug('cypress:server:studio:electron')

/**
 * This interface exposes a selection of Electrons APIs
 * to the dynamic studio bundle.
 */
export class StudioElectron {
  private browserWindow: BrowserWindow | undefined

  createBrowserWindow () {
    debug('creating new browser window')

    this.destroy()

    this.browserWindow = new BrowserWindow({
      // Hide the title bar for accurate viewport sizes
      titleBarStyle: 'hidden',
      // Hide window by default - we should never show it
      // in production environments
      show: false,
    })

    debug('created browser window')

    return this.browserWindow
  }

  destroy () {
    this.safeCloseBrowserWindow()
  }

  private safeCloseBrowserWindow () {
    if (!this.browserWindow) {
      debug('no browser window to destroy')

      return
    }

    if (!this.browserWindow.isDestroyed()) {
      try {
        this.browserWindow.destroy()
      } catch (error) {
        debug('error destroying browser window', error)
      }
    }

    debug('browser window destroyed')
    this.browserWindow = undefined
  }
}
