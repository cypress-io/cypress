import Debug from 'debug'
import { EventEmitter } from 'events'
import type playwright from 'playwright-webkit'
import type { Browser, BrowserInstance } from './types'
import type { Automation } from '../automation'
import { WebKitAutomation } from './webkit-automation'
import type { BrowserLaunchOpts, BrowserNewTabOpts } from '@packages/types'
import utils from './utils'

const debug = Debug('cypress:server:browsers:webkit')

let wkAutomation: WebKitAutomation | undefined

export async function connectToNewSpec (browser: Browser, options: BrowserNewTabOpts, automation: Automation) {
  if (!wkAutomation) throw new Error('connectToNewSpec called without wkAutomation')

  automation.use(wkAutomation)
  wkAutomation.automation = automation
  await options.onInitializeNewBrowserTab()
  await wkAutomation.reset({
    newUrl: options.url,
    downloadsFolder: options.downloadsFolder,
    videoApi: options.videoApi,
  })
}

export function connectToExisting () {
  throw new Error('Cypress-in-Cypress is not supported for WebKit.')
}

export async function open (browser: Browser, url: string, options: BrowserLaunchOpts, automation: Automation): Promise<BrowserInstance> {
  // resolve pw from user's project path
  const pwModulePath = require.resolve('playwright-webkit', { paths: [process.cwd()] })
  const pw = await import(pwModulePath) as typeof playwright

  const defaultLaunchOptions = {
    preferences: {
      proxy: {
        server: options.proxyServer,
      },
      headless: browser.isHeadless,
    },
    extensions: [],
    args: [],
  }

  const launchOptions = await utils.executeBeforeBrowserLaunch(browser, defaultLaunchOptions, options)

  if (launchOptions.extensions.length) options.onWarning?.(new Error('WebExtensions not supported in WebKit, but extensions were passed in before:browser:launch.'))

  launchOptions.preferences.args = [...launchOptions.args, ...(launchOptions.preferences.args || [])]

  const pwServer = await pw.webkit.launchServer(launchOptions.preferences)

  /**
   * Playwright adds an `exit` event listener to run a cleanup process. It tries to use the current binary to run a Node script by passing it as argv[1].
   * However, the Electron binary does not support an entrypoint, leading Cypress to think it's being opened in global mode (no args) when this fn is called.
   * Solution is to filter out the problematic function.
   * TODO(webkit): do we want to run this cleanup script another way?
   * @see https://github.com/microsoft/playwright/blob/7e2aec7454f596af452b51a2866e86370291ac8b/packages/playwright-core/src/utils/processLauncher.ts#L191-L203
   */
  const killProcessAndCleanup = process.rawListeners('exit').find((fn) => fn.name === 'killProcessAndCleanup')

  // @ts-expect-error Electron's Process types override those of @types/node, leading to `exit` not being recognized as an event
  if (killProcessAndCleanup) process.removeListener('exit', killProcessAndCleanup)
  else debug('did not find killProcessAndCleanup, which may cause interactive mode to unexpectedly open')

  const pwBrowser = await pw.webkit.connect(pwServer.wsEndpoint())

  wkAutomation = await WebKitAutomation.create(automation, pwBrowser, url, options.downloadsFolder, options.videoApi)
  automation.use(wkAutomation)

  class WkInstance extends EventEmitter implements BrowserInstance {
    pid = pwServer.process().pid

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
