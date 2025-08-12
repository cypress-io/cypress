import { BrowserWindow } from 'electron'
import Debug from 'debug'

const debug = Debug('cypress:server:studio:electron')

export class StudioElectron {
  private browserWindow: BrowserWindow | undefined

  async createBrowserWindow () {
    this.destroy()

    debug('creating new browser window')
    const createWindowStart = performance.now()

    this.browserWindow = new BrowserWindow({
      // Hide the title bar for accurate viewport sizes
      titleBarStyle: 'hidden',
      // Hide window by default - we should never show it
      // in production environments.
      show: false,
    })

    debug('created window in', performance.now() - createWindowStart, 'ms')

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
