const _ = require('lodash')
const path = require('path')
const Promise = require('bluebird')
const debug = require('debug')('cypress:server:browsers')
const utils = require('./utils')
const errors = require('../errors')
const check = require('check-more-types')

// returns true if the passed string is a known browser family name
const isBrowserFamily = check.oneOf(['electron', 'chrome'])

let instance = null

const kill = function (unbind) {
  // cleanup our running browser
  // instance
  if (!instance) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    if (unbind) {
      instance.removeAllListeners()
    }

    instance.once('exit', function (...args) {
      debug('browser process killed')

      return resolve.apply(null, args)
    })

    debug('killing browser process')

    instance.kill()

    return cleanup()
  })
}

const cleanup = () => {
  return instance = null
}

const getBrowserLauncherByFamily = function (family) {
  debug('getBrowserLauncherByFamily %o', { family })
  if (!isBrowserFamily(family)) {
    debug('unknown browser family', family)
  }

  switch (family) {
    case 'electron':
      return require('./electron')
    case 'chrome':
      return require('./chrome')
    default:
      break
  }
}

const isValidPathToBrowser = (str) => {
  return path.basename(str) !== str
}

const ensureAndGetByNameOrPath = function (nameOrPath, returnAll = false, browsers = null) {
  const findBrowsers = Array.isArray(browsers) ? Promise.resolve(browsers) : utils.getBrowsers()

  return findBrowsers
  .then((browsers = []) => {
    let browser

    debug('searching for browser %o', { nameOrPath, knownBrowsers: browsers })

    // try to find the browser by name with the highest version property
    const sortedBrowsers = _.sortBy(browsers, ['version'])

    browser = _.findLast(sortedBrowsers, { name: nameOrPath })

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

const throwBrowserNotFound = function (browserName, browsers = []) {
  const names = _.map(browsers, 'name').join(', ')

  return errors.throw('BROWSER_NOT_FOUND_BY_NAME', browserName, names)
}

process.once('exit', kill)

module.exports = {
  ensureAndGetByNameOrPath,

  isBrowserFamily,

  removeOldProfiles: utils.removeOldProfiles,

  get: utils.getBrowsers,

  launch: utils.launch,

  close: kill,

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

      if (!(browserLauncher = getBrowserLauncherByFamily(browser.family))) {
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

        instance = i

        // TODO: normalizing opening and closing / exiting
        // so that there is a default for each browser but
        // enable the browser to configure the interface
        instance.once('exit', () => {
          options.onBrowserClose()

          return cleanup()
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
