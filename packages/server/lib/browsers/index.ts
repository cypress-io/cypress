import _ from 'lodash'
import Bluebird from 'bluebird'
import Debug from 'debug'
import utils from './utils'
import * as errors from '../errors'
import check from 'check-more-types'
import { exec } from 'child_process'
import util from 'util'
import os from 'os'
import { BROWSER_FAMILY, BrowserLaunchOpts, BrowserNewTabOpts, FoundBrowser } from '@packages/types'
import type { Browser, BrowserInstance, BrowserLauncher } from './types'
import type { Automation } from '../automation'

const debug = Debug('cypress:server:browsers')
const isBrowserFamily = check.oneOf(BROWSER_FAMILY)

let instance: BrowserInstance | null = null

const kill = function (unbind = true, isProcessExit = false) {
  // Clean up the instance when the browser is closed
  if (!instance) {
    debug('browsers.kill called with no active instance')

    return Promise.resolve()
  }

  const _instance = instance

  instance = null

  return new Promise<void>((resolve) => {
    _instance.once('exit', () => {
      if (unbind) {
        _instance.removeAllListeners()
      }

      debug('browser process killed')

      resolve()
    })

    debug('killing browser process')

    _instance.isProcessExit = isProcessExit

    _instance.kill()
  })
}

async function setFocus () {
  const platform = os.platform()
  const execAsync = util.promisify(exec)

  try {
    if (!instance) throw new Error('No instance in setFocus!')

    switch (platform) {
      case 'darwin':
        await execAsync(`open -a "$(ps -p ${instance.pid} -o comm=)"`)

        return
      case 'win32': {
        await execAsync(`(New-Object -ComObject WScript.Shell).AppActivate(((Get-WmiObject -Class win32_process -Filter "ParentProcessID = '${instance.pid}'") | Select -ExpandProperty ProcessId))`, { shell: 'powershell.exe' })

        return
      }
      default:
        debug(`Unexpected os platform ${platform}. Set focus is only functional on Windows and MacOS`)
    }
  } catch (error) {
    debug(`Failure to set focus. ${error}`)
  }
}

async function getBrowserLauncher (browser: Browser, browsers: FoundBrowser[]): Promise<BrowserLauncher> {
  debug('getBrowserLauncher %o', { browser })

  if (browser.name === 'electron') return await import('./electron')

  if (browser.family === 'chromium') return await import('./chrome')

  if (browser.family === 'firefox') return await import('./firefox')

  if (browser.family === 'webkit') return await import('./webkit')

  return utils.throwBrowserNotFound(browser.name, browsers)
}

process.once('exit', () => kill(true, true))

export = {
  ensureAndGetByNameOrPath: utils.ensureAndGetByNameOrPath,

  isBrowserFamily,

  removeOldProfiles: utils.removeOldProfiles,

  get: utils.getBrowsers,

  close: kill,

  formatBrowsersToOptions: utils.formatBrowsersToOptions,

  setFocus,

  _setInstance (_instance: BrowserInstance) {
    // for testing
    instance = _instance
  },

  // note: does not guarantee that `browser` is still running
  getBrowserInstance () {
    return instance
  },

  async connectToExisting (browser: Browser, options: BrowserLaunchOpts, automation: Automation): Promise<BrowserInstance | null> {
    const browserLauncher = await getBrowserLauncher(browser, options.browsers)

    await browserLauncher.connectToExisting(browser, options, automation)

    return this.getBrowserInstance()
  },

  async connectToNewSpec (browser: Browser, options: BrowserNewTabOpts, automation: Automation): Promise<BrowserInstance | null> {
    const browserLauncher = await getBrowserLauncher(browser, options.browsers)

    // Instance will be null when we're dealing with electron. In that case we don't need a browserCriClient
    await browserLauncher.connectToNewSpec(browser, options, automation)

    return this.getBrowserInstance()
  },

  async open (browser: Browser, options: BrowserLaunchOpts, automation: Automation, ctx): Promise<BrowserInstance | null> {
    await kill(true)

    _.defaults(options, {
      onBrowserOpen () {},
      onBrowserClose () {},
    })

    ctx.browser.setBrowserStatus('opening')

    const browserLauncher = await getBrowserLauncher(browser, options.browsers)

    if (!options.url) throw new Error('Missing url in browsers.open')

    debug('opening browser %o', browser)

    const _instance = await browserLauncher.open(browser, options.url, options, automation)

    debug('browser opened')

    instance = _instance
    instance.browser = browser

    // TODO: normalizing opening and closing / exiting
    // so that there is a default for each browser but
    // enable the browser to configure the interface
    instance.once('exit', async (code, signal) => {
      ctx.browser.setBrowserStatus('closed')
      // TODO: make this a required property
      if (!options.onBrowserClose) throw new Error('onBrowserClose did not exist in interactive mode')

      const browserDisplayName = instance?.browser?.displayName || 'unknown'

      options.onBrowserClose()
      browserLauncher.clearInstanceState()
      instance = null

      // We are being very narrow on when to restart the browser here. The only case we can reliably test the 'SIGTRAP' signal.
      // We want to avoid adding signals in here that may intentionally be caused by a user.
      // For example exiting firefox through either force quitting or quitting via cypress will fire a 'SIGTERM' event which
      // would result in constantly relaunching the browser when the user actively wants to quit.
      // On windows the crash produces 2147483651 as an exit code. We should add to the list of crashes we handle as we see them.
      // In the future we may consider delegating to the browsers to determine if an exit is a crash since it might be different
      // depending on what browser has crashed.
      if (code === null && ['SIGTRAP', 'SIGABRT'].includes(signal) || code === 2147483651 && signal === null) {
        const err = errors.get('BROWSER_CRASHED', browserDisplayName, code, signal)

        if (!options.onError) {
          errors.log(err)
          throw new Error('Missing onError in attachListeners')
        }

        await options.onError(err)

        await options.relaunchBrowser!()
      }
    })

    // TODO: instead of waiting an arbitrary
    // amount of time here we could instead
    // wait for the socket.io connect event
    // which would mean that our browser is
    // completely rendered and open. that would
    // mean moving this code out of here and
    // into the project itself
    // (just like headless code)
    // ----------------------------
    // give a little padding around
    // the browser opening
    await Bluebird.delay(1000)

    if (instance === null) {
      return null
    }

    // TODO: make this a required property
    if (!options.onBrowserOpen) throw new Error('onBrowserOpen did not exist in interactive mode')

    options.onBrowserOpen()
    ctx.browser.setBrowserStatus('open')

    return instance
  },
} as const
