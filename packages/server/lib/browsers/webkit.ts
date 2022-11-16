import Debug from 'debug'
import { EventEmitter } from 'events'
import type playwright from 'playwright-webkit'
import type { Browser, BrowserInstance } from './types'
import type { Automation } from '../automation'
import { WebKitAutomation } from './webkit-automation'
import * as unhandledExceptions from '../unhandled_exceptions'
import type { BrowserLaunchOpts, BrowserNewTabOpts } from '@packages/types'

const debug = Debug('cypress:server:browsers:webkit')

let wkAutomation: WebKitAutomation | undefined

export async function connectToNewSpec (browser: Browser, options: BrowserNewTabOpts, automation: Automation) {
  if (!wkAutomation) throw new Error('connectToNewSpec called without wkAutomation')

  automation.use(wkAutomation)
  wkAutomation.automation = automation
  await options.onInitializeNewBrowserTab()
  await wkAutomation.reset(options.url)
}

export function connectToExisting () {
  throw new Error('Cypress-in-Cypress is not supported for WebKit.')
}

export async function open (browser: Browser, url: string, options: BrowserLaunchOpts, automation: Automation): Promise<BrowserInstance> {
  // resolve pw from user's project path
  const pwModulePath = require.resolve('playwright-webkit', { paths: [process.cwd()] })

  let pw: typeof playwright

  try {
    pw = await import(pwModulePath)
  } catch (err) {
    err.message = `There was an error importing \`playwright-webkit\`, is it installed?\n\nError text: ${err.stack}`
    throw err
  }

  const pwBrowser = await pw.webkit.launch({
    proxy: {
      server: options.proxyServer,
    },
    downloadsPath: options.downloadsFolder,
    headless: browser.isHeadless,
  })

  wkAutomation = await WebKitAutomation.create(automation, pwBrowser, url)
  automation.use(wkAutomation)

  class WkInstance extends EventEmitter implements BrowserInstance {
    pid = NaN

    constructor () {
      super()

      pwBrowser.on('disconnected', () => {
        debug('pwBrowser disconnected')
        this.emit('exit')
      })

      this.suppressUnhandledEconnreset()
    }

    async kill () {
      debug('closing pwBrowser')
      await pwBrowser.close()
      wkAutomation = undefined
    }

    /**
     * An unhandled `read ECONNRESET` in the depths of `playwright-webkit` is causing the process to crash when running kitchensink on Linux. Absent a
     * way to attach to the `error` event, this replaces the global `unhandledException` handler with one that will not exit the process on ECONNRESET.
     */
    private suppressUnhandledEconnreset () {
      unhandledExceptions.handle((err: NodeJS.ErrnoException) => {
        return err.code === 'ECONNRESET'
      })

      // restore normal exception handling behavior
      this.once('exit', () => unhandledExceptions.handle())
    }
  }

  return new WkInstance()
}
