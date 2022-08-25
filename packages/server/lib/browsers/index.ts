import _ from 'lodash'
import Promise from 'bluebird'
import Debug from 'debug'
import utils from './utils'
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

  return new Promise((resolve) => {
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

function getBrowserLauncher (browser: Browser, browsers: FoundBrowser[]): BrowserLauncher {
  debug('getBrowserLauncher %o', { browser })

  if (browser.name === 'electron') {
    return require('./electron') as typeof import('./electron')
  }

  if (browser.family === 'chromium') {
    return require('./chrome') as typeof import('./chrome')
  }

  if (browser.family === 'firefox') {
    return require('./firefox') as typeof import('./firefox')
  }

  if (browser.family === 'webkit') {
    return require('./webkit') as typeof import('./webkit')
  }

  return utils.throwBrowserNotFound(browser.name, browsers)
}

process.once('exit', () => kill(true, true))

exports = {
  ensureAndGetByNameOrPath: utils.ensureAndGetByNameOrPath,

  isBrowserFamily,

  removeOldProfiles: utils.removeOldProfiles,

  get: utils.getBrowsers,

  close: kill,

  formatBrowsersToOptions: utils.formatBrowsersToOptions,

  _setInstance (_instance: BrowserInstance) {
    // for testing
    instance = _instance
  },

  // note: does not guarantee that `browser` is still running
  // note: electron will return a list of pids for each webContent
  getBrowserInstance () {
    return instance
  },

  getAllBrowsersWith (nameOrPath?: string) {
    debug('getAllBrowsersWith %o', { nameOrPath })
    if (nameOrPath) {
      return utils.ensureAndGetByNameOrPath(nameOrPath, true)
    }

    return utils.getBrowsers()
  },

  async connectToExisting (browser: Browser, options: BrowserLaunchOpts, automation: Automation) {
    const browserLauncher = getBrowserLauncher(browser, options.browsers)

    await browserLauncher.connectToExisting(browser, options, automation)

    return this.getBrowserInstance()
  },

  async connectToNewSpec (browser: Browser, options: BrowserNewTabOpts, automation: Automation) {
    const browserLauncher = getBrowserLauncher(browser, options.browsers)

    // Instance will be null when we're dealing with electron. In that case we don't need a browserCriClient
    await browserLauncher.connectToNewSpec(browser, options, automation)

    return this.getBrowserInstance()
  },

  open (browser: Browser, options: BrowserLaunchOpts, automation: Automation, ctx) {
    return kill(true)
    .then(() => {
      _.defaults(options, {
        onBrowserOpen () {},
        onBrowserClose () {},
      })

      ctx.browser.setBrowserStatus('opening')

      const browserLauncher = getBrowserLauncher(browser, options.browsers)

      if (!options.url) throw new Error('Missing url in browsers.open')

      debug('opening browser %o', browser)

      return browserLauncher.open(browser, options.url, options, automation)
      .then((i) => {
        debug('browser opened')
        // TODO: bind to process.exit here
        // or move this functionality into cypress-core-launder

        i.browser = browser

        instance = i

        // TODO: normalizing opening and closing / exiting
        // so that there is a default for each browser but
        // enable the browser to configure the interface
        instance.once('exit', () => {
          ctx.browser.setBrowserStatus('closed')
          // TODO: make this a required property
          if (!options.onBrowserClose) throw new Error('onBrowserClose did not exist in interactive mode')

          options.onBrowserClose()
          instance = null
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
        return Promise.delay(1000)
        .then(() => {
          if (instance === null) {
            return null
          }

          // TODO: make this a required property
          if (!options.onBrowserOpen) throw new Error('onBrowserOpen did not exist in interactive mode')

          options.onBrowserOpen()
          ctx.browser.setBrowserStatus('open')

          return instance
        })
      })
    })
  },
  setFocus,
} as const

export = exports
