import Debug from 'debug'
import { EventEmitter } from 'events'
import type playwright from 'playwright-webkit'
import type { Browser, BrowserInstance } from './types'
import type { Automation } from '../automation'
import { WebKitAutomation } from './webkit-automation'
import type { BrowserLaunchOpts, BrowserNewTabOpts } from '@packages/types'

const debug = Debug('cypress:server:browsers:webkit')

let wkAutomation: WebKitAutomation | undefined

export async function connectToNewSpec (browser: Browser, options: BrowserNewTabOpts, automation: Automation) {
  if (!wkAutomation) throw new Error('connectToNewSpec called without wkAutomation')

  automation.use(wkAutomation)
  wkAutomation.automation = automation
  await options.onInitializeNewBrowserTab()
  await wkAutomation.reset(options.url, options.videoApi)
}

export function connectToExisting () {
  throw new Error('Cypress-in-Cypress is not supported for WebKit.')
}

export async function open (browser: Browser, url: string, options: BrowserLaunchOpts, automation: Automation): Promise<BrowserInstance> {
  // resolve pw from user's project path
  const pwModulePath = require.resolve('playwright-webkit', { paths: [process.cwd()] })
  const pw = require(pwModulePath) as typeof playwright

  const pwBrowser = await pw.webkit.launch({
    proxy: {
      server: options.proxyServer,
    },
    downloadsPath: options.downloadsFolder,
    headless: browser.isHeadless,
  })

  wkAutomation = await WebKitAutomation.create({
    automation,
    browser: pwBrowser,
    initialUrl: url,
    shouldMarkAutIframeRequests: !!options.experimentalSessionAndOrigin,
    videoApi: options.videoApi,
  })

  automation.use(wkAutomation)

  class WkInstance extends EventEmitter implements BrowserInstance {
    // TODO: how to obtain launched process PID from PW? this is used for process_profiler
    pid = NaN

    constructor () {
      super()

      pwBrowser.on('disconnected', () => {
        debug('pwBrowser disconnected')
        this.emit('exit')
      })
    }

    async kill () {
      debug('closing pwBrowser')
      await pwBrowser.close()
      wkAutomation = undefined
    }
  }

  return new WkInstance()
}
