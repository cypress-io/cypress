const _ = require('lodash')
const Promise = require('bluebird')
const debug = require('debug')('cypress:server:browsers')
const utils = require('./utils')
const check = require('check-more-types')
const { exec } = require('child_process')
const util = require('util')
const os = require('os')

// returns true if the passed string is a known browser family name
const isBrowserFamily = check.oneOf(['chromium', 'firefox'])

let instance = null

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

const setFocus = async function () {
  const platform = os.platform()
  const execAsync = util.promisify(exec)

  try {
    switch (platform) {
      case 'darwin':
        return execAsync(`open -a "$(ps -p ${instance.pid} -o comm=)"`)
      case 'win32': {
        return execAsync(`(New-Object -ComObject WScript.Shell).AppActivate(((Get-WmiObject -Class win32_process -Filter "ParentProcessID = '${instance.pid}'") | Select -ExpandProperty ProcessId))`, { shell: 'powershell.exe' })
      }
      default:
        debug(`Unexpected os platform ${platform}. Set focus is only functional on Windows and MacOS`)
    }
  } catch (error) {
    debug(`Failure to set focus. ${error}`)
  }
}

const getBrowserLauncher = function (browser) {
  debug('getBrowserLauncher %o', { browser })
  if (!isBrowserFamily(browser.family)) {
    debug('unknown browser family', browser.family)
  }

  if (browser.name === 'electron') {
    return require('./electron')
  }

  if (browser.family === 'chromium') {
    return require('./chrome')
  }

  if (browser.family === 'firefox') {
    return require('./firefox')
  }
}

process.once('exit', () => kill(true, true))

module.exports = {
  ensureAndGetByNameOrPath: utils.ensureAndGetByNameOrPath,

  isBrowserFamily,

  removeOldProfiles: utils.removeOldProfiles,

  get: utils.getBrowsers,

  close: kill,

  formatBrowsersToOptions: utils.formatBrowsersToOptions,

  _setInstance (_instance) {
    // for testing
    instance = _instance
  },

  // note: does not guarantee that `browser` is still running
  // note: electron will return a list of pids for each webContent
  getBrowserInstance () {
    return instance
  },

  getAllBrowsersWith (nameOrPath) {
    debug('getAllBrowsersWith %o', { nameOrPath })
    if (nameOrPath) {
      return utils.ensureAndGetByNameOrPath(nameOrPath, true)
    }

    return utils.getBrowsers()
  },

  async connectToExisting (browser, options = {}, automation) {
    const browserLauncher = getBrowserLauncher(browser)

    if (!browserLauncher) {
      utils.throwBrowserNotFound(browser.name, options.browsers)
    }

    await browserLauncher.connectToExisting(browser, options, automation)

    return this.getBrowserInstance()
  },

  async connectToNewSpec (browser, options = {}, automation) {
    const browserLauncher = getBrowserLauncher(browser)

    if (!browserLauncher) {
      utils.throwBrowserNotFound(browser.name, options.browsers)
    }

    // Instance will be null when we're dealing with electron. In that case we don't need a browserCriClient
    await browserLauncher.connectToNewSpec(browser, options, automation)

    return this.getBrowserInstance()
  },

  open (browser, options = {}, automation, ctx) {
    return kill(true)
    .then(() => {
      _.defaults(options, {
        onBrowserOpen () {},
        onBrowserClose () {},
      })

      ctx.browser.setBrowserStatus('opening')

      const browserLauncher = getBrowserLauncher(browser)

      if (!browserLauncher) {
        utils.throwBrowserNotFound(browser.name, options.browsers)
      }

      const { url } = options

      if (!url) {
        throw new Error('options.url must be provided when opening a browser. You passed:', options)
      }

      debug('opening browser %o', browser)

      return browserLauncher.open(browser, url, options, automation)
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

          options.onBrowserOpen()
          ctx.browser.setBrowserStatus('open')

          return instance
        })
      })
    })
  },
  setFocus,
}
