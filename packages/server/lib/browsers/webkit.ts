import Debug from 'debug'
import { EventEmitter } from 'events'
import type playwright from 'playwright-webkit'
import type { Browser, BrowserInstance } from './types'
import type { Automation } from '../automation'
import { WebKitAutomation } from './webkit-automation'
import * as unhandledExceptions from '../unhandled_exceptions'
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

/**
 * Clear instance state for the webkit instance, this is normally called in on kill or on exit.
 */
export function clearInstanceState () {
  wkAutomation = undefined
}

export function connectToExisting () {
  throw new Error('Cypress-in-Cypress is not supported for WebKit.')
}

export function connectProtocolToBrowser (): Promise<void> {
  throw new Error('Protocol is not yet supported in WebKit.')
}

/**
 * Playwright adds an `exit` event listener to run a cleanup process. It tries to use the current binary to run a Node script by passing it as argv[1].
 * However, the Electron binary does not support an entrypoint, leading Cypress to think it's being opened in global mode (no args) when this fn is called.
 * Solution is to filter out the problematic function.
 * TODO(webkit): do we want to run this cleanup script another way?
 * @see https://github.com/microsoft/playwright/blob/7e2aec7454f596af452b51a2866e86370291ac8b/packages/playwright-core/src/utils/processLauncher.ts#L191-L203
 */
function removeBadExitListener () {
  const killProcessAndCleanup = process.rawListeners('exit').find((fn) => fn.name === 'killProcessAndCleanup')

  // @ts-expect-error Electron's Process types override those of @types/node, leading to `exit` not being recognized as an event
  if (killProcessAndCleanup) process.removeListener('exit', killProcessAndCleanup)
  else debug('did not find killProcessAndCleanup, which may cause interactive mode to unexpectedly open')
}

export async function open (browser: Browser, url: string, options: BrowserLaunchOpts, automation: Automation): Promise<BrowserInstance> {
  if (!options.experimentalWebKitSupport) {
    throw new Error('WebKit was launched, but the experimental feature was not enabled. Please add `experimentalWebKitSupport: true` to your config file to launch WebKit.')
  }

  // resolve pw from user's project path
  const pwModulePath = require.resolve('playwright-webkit', { paths: [process.cwd()] })

  let pw: typeof playwright

  try {
    pw = await import(pwModulePath)
  } catch (err) {
    err.message = `There was an error importing \`playwright-webkit\`, is it installed?\n\nError text: ${err.stack}`
    throw err
  }

  const defaultLaunchOptions = {
    preferences: {
      proxy: {
        server: options.proxyServer,
      },
      headless: browser.isHeadless,
    },
    extensions: [],
    args: [],
    env: {},
  }

  const launchOptions = await utils.executeBeforeBrowserLaunch(browser, defaultLaunchOptions, options)

  if (launchOptions.extensions.length) options.onWarning?.(new Error('WebExtensions not supported in WebKit, but extensions were passed in before:browser:launch.'))

  launchOptions.preferences.args = [...launchOptions.args, ...(launchOptions.preferences.args || [])]

  let pwServer: playwright.BrowserServer

  try {
    pwServer = await pw.webkit.launchServer(launchOptions.preferences)
  } catch (err) {
    err.message = `There was an error launching \`playwright-webkit\`: \n\n\`\`\`${err.message}\n\`\`\``
    throw err
  }

  removeBadExitListener()

  const websocketUrl = pwServer.wsEndpoint()
  const pwBrowser = await pw.webkit.connect(websocketUrl)

  wkAutomation = await WebKitAutomation.create({
    automation,
    browser: pwBrowser,
    initialUrl: url,
    downloadsFolder: options.downloadsFolder,
    videoApi: options.videoApi,
  })

  automation.use(wkAutomation)

  class WkInstance extends EventEmitter implements BrowserInstance {
    pid = pwServer.process().pid

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
      clearInstanceState()
      await pwBrowser.close()
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

  await utils.executeAfterBrowserLaunch(browser, {
    webSocketDebuggerUrl: websocketUrl,
  })

  return new WkInstance()
}

export async function closeExtraTargets () {
  // we're currently holding off on implementing Webkit support in order
  // to release Chromium support as soon as possible and may add Webkit
  // support in the future
  debug('Closing extra targets is not currently supported in Webkit')
}
