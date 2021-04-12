const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')
const debug = require('debug')('cypress:server:browsers')
const utils = require('./utils')
const errors = require('../errors')
const check = require('check-more-types')

// returns true if the passed string is a known browser family name
const isBrowserFamily = check.oneOf(['chromium', 'firefox'])

let instance = null

const kill = function (unbind, isProcessExit) {
  // Clean up the instance when the browser is closed
  if (!instance) {
    debug('browsers.kill called with no active instance')

    return Promise.resolve()
  }

  const _instance = instance

  instance = null

  if (unbind) {
    _instance.removeAllListeners()
  }

  return new Promise((resolve) => {
    _instance.once('exit', () => {
      debug('browser process killed')

      resolve()
    })

    debug('killing browser process')

    _instance.isProcessExit = isProcessExit

    _instance.kill()
  })
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

const isValidPathToBrowser = (str) => {
  return path.basename(str) !== str
}

const parseBrowserOption = (opt) => {
  // it's a name or a path
  if (!_.isString(opt) || !opt.includes(':')) {
    return {
      name: opt,
      channel: 'stable',
    }
  }

  // it's in name:channel format
  const split = opt.indexOf(':')

  return {
    name: opt.slice(0, split),
    channel: opt.slice(split + 1),
  }
}

const ensureAndGetByNameOrPath = function (nameOrPath, returnAll = false, browsers = null) {
  const findBrowsers = Array.isArray(browsers) ? Promise.resolve(browsers) : utils.getBrowsers()

  return findBrowsers
  .then((browsers = []) => {
    const filter = parseBrowserOption(nameOrPath)

    debug('searching for browser %o', { nameOrPath, filter, knownBrowsers: browsers })

    // try to find the browser by name with the highest version property
    const sortedBrowsers = _.sortBy(browsers, ['version'])

    const browser = _.findLast(sortedBrowsers, filter)

    if (browser) {
      // short circuit if found
      if (returnAll) {
        return browsers
      }

      return browser
    }

    // did the user give a bad name, or is this actually a path?
    if (isValidPathToBrowser(nameOrPath)) {
      // looks like a path - try to resolve it to a FoundBrowser
      return utils.getBrowserByPath(nameOrPath)
      .then((browser) => {
        if (returnAll) {
          return [browser].concat(browsers)
        }

        return browser
      }).catch((err) => {
        return errors.throw('BROWSER_NOT_FOUND_BY_PATH', nameOrPath, err.message)
      })
    }

    // not a path, not found by name
    return throwBrowserNotFound(nameOrPath, browsers)
  })
}

const formatBrowsersToOptions = (browsers) => {
  return browsers.map((browser) => {
    if (browser.channel !== 'stable') {
      return [browser.name, browser.channel].join(':')
    }

    return browser.name
  })
}

const throwBrowserNotFound = function (browserName, browsers = []) {
  const names = `- ${formatBrowsersToOptions(browsers).join('\n- ')}`

  return errors.throw('BROWSER_NOT_FOUND_BY_NAME', browserName, names)
}

process.once('exit', () => kill(true, true))

module.exports = {
  ensureAndGetByNameOrPath,

  isBrowserFamily,

  removeOldProfiles: utils.removeOldProfiles,

  get: utils.getBrowsers,

  close: kill,

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
      return ensureAndGetByNameOrPath(nameOrPath, true)
    }

    return utils.getBrowsers()
  },

  open (browser, options = {}, automation) {
    return kill(true)
    .then(() => {
      let browserLauncher; let url

      _.defaults(options, {
        onBrowserOpen () {},
        onBrowserClose () {},
      })

      if (!(browserLauncher = getBrowserLauncher(browser))) {
        return throwBrowserNotFound(browser.name, options.browsers)
      }

      if (!(url = options.url)) {
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
          options.onBrowserOpen()

          return instance
        })
      })
    })
  },
}
