import _ from 'lodash'
import { FoundBrowser } from '@packages/launcher'
// @ts-ignore
import errors from '../errors'
// @ts-ignore
import plugins from '../plugins'

const path = require('path')
const debug = require('debug')('cypress:server:browsers:utils')
const Bluebird = require('bluebird')
const getPort = require('get-port')
const launcher = require('@packages/launcher')
const fs = require('../util/fs')
const extension = require('@packages/extension')
const appData = require('../util/app_data')
const profileCleaner = require('../util/profile_cleaner')

const pathToBrowsers = appData.path('browsers')
const legacyProfilesWildcard = path.join(pathToBrowsers, '*')

const getAppDataPath = (browser) => {
  if (!browser || !browser.profilePath) {
    return pathToBrowsers
  }

  return path.join(browser.profilePath, 'Cypress')
}

const getProfileWildcard = (browser) => {
  return path.join(getAppDataPath(browser), '*')
}

const getBrowserPath = (browser) => {
  // TODO need to check if browser.name is an unempty string
  return path.join(
    getAppDataPath(browser),
    `${browser.name}-${browser.channel}`,
  )
}

const defaultLaunchOptions: {
  preferences: {[key: string]: any}
  extensions: string[]
  args: string[]
} = {
  preferences: {},
  extensions: [],
  args: [],
}

const KNOWN_LAUNCH_OPTION_PROPERTIES = _.keys(defaultLaunchOptions)

const getDefaultLaunchOptions = (options) => {
  return _.defaultsDeep(options, defaultLaunchOptions)
}

const copyExtension = (src, dest) => {
  return fs.copyAsync(src, dest)
}

const getPartition = function (isTextTerminal) {
  if (isTextTerminal) {
    return `run-${process.pid}`
  }

  return 'interactive'
}

const getProfileDir = (browser, isTextTerminal) => {
  return path.join(
    getBrowserPath(browser),
    getPartition(isTextTerminal),
  )
}

const getExtensionDir = (browser, isTextTerminal) => {
  return path.join(
    getProfileDir(browser, isTextTerminal),
    'CypressExtension',
  )
}

const ensureCleanCache = async function (browser, isTextTerminal) {
  const p = path.join(
    getProfileDir(browser, isTextTerminal),
    'CypressCache',
  )

  await fs.removeAsync(p)
  await fs.ensureDirAsync(p)

  return p
}

// we now store profiles inside the Cypress binary folder
// so we need to remove the legacy root profiles that existed before
function removeLegacyProfiles () {
  return profileCleaner.removeRootProfile(legacyProfilesWildcard, [
    path.join(legacyProfilesWildcard, 'run-*'),
    path.join(legacyProfilesWildcard, 'interactive'),
  ])
}

const removeOldProfiles = function (browser) {
  // a profile is considered old if it was used
  // in a previous run for a PID that is either
  // no longer active, or isnt a cypress related process
  const pathToPartitions = appData.electronPartitionsPath()

  return Bluebird.all([
    removeLegacyProfiles(),
    profileCleaner.removeInactiveByPid(getProfileWildcard(browser), 'run-'),
    profileCleaner.removeInactiveByPid(pathToPartitions, 'run-'),
  ])
}

const pathToExtension = extension.getPathToExtension()

async function executeBeforeBrowserLaunch (browser, launchOptions: typeof defaultLaunchOptions, options) {
  if (plugins.has('before:browser:launch')) {
    const pluginConfigResult = await plugins.execute('before:browser:launch', browser, launchOptions)

    if (pluginConfigResult) {
      extendLaunchOptionsFromPlugins(launchOptions, pluginConfigResult, options)
    }
  }

  return launchOptions
}

function extendLaunchOptionsFromPlugins (launchOptions, pluginConfigResult, options) {
  // if we returned an array from the plugin
  // then we know the user is using the deprecated
  // interface and we need to warn them
  // TODO: remove this logic in >= v5.0.0
  if (pluginConfigResult[0]) {
    options.onWarning(errors.get(
      'DEPRECATED_BEFORE_BROWSER_LAUNCH_ARGS',
    ))

    _.extend(pluginConfigResult, {
      args: _.filter(pluginConfigResult, (_val, key) => {
        return _.isNumber(key)
      }),
      extensions: [],
    })
  } else {
    // either warn about the array or potentially error on invalid props, but not both

    // strip out all the known launch option properties from the resulting object
    const unexpectedProperties: string[] = _
    .chain(pluginConfigResult)
    .omit(KNOWN_LAUNCH_OPTION_PROPERTIES)
    .keys()
    .value()

    if (unexpectedProperties.length) {
      errors.throw('UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES', unexpectedProperties, KNOWN_LAUNCH_OPTION_PROPERTIES)
    }
  }

  _.forEach(launchOptions, (val, key) => {
    const pluginResultValue = pluginConfigResult[key]

    if (pluginResultValue) {
      if (_.isPlainObject(val)) {
        launchOptions[key] = _.extend({}, launchOptions[key], pluginResultValue)

        return
      }

      launchOptions[key] = pluginResultValue

      return
    }
  })

  return launchOptions
}

export = {
  extendLaunchOptionsFromPlugins,

  executeBeforeBrowserLaunch,

  defaultLaunchOptions,

  getDefaultLaunchOptions,

  getPort,

  copyExtension,

  getBrowserPath,

  getProfileDir,

  getExtensionDir,

  ensureCleanCache,

  removeOldProfiles,

  getBrowserByPath: launcher.detectByPath,

  launch: launcher.launch,

  writeExtension (browser, isTextTerminal, proxyUrl, socketIoRoute) {
    debug('writing extension')

    // debug('writing extension to chrome browser')
    // get the string bytes for the final extension file
    return extension.setHostAndPath(proxyUrl, socketIoRoute)
    .then((str) => {
      const extensionDest = getExtensionDir(browser, isTextTerminal)
      const extensionBg = path.join(extensionDest, 'background.js')

      // copy the extension src to the extension dist
      return copyExtension(pathToExtension, extensionDest)
      .then(() => {
        debug('copied extension')

        // and overwrite background.js with the final string bytes
        return fs.writeFileAsync(extensionBg, str)
      })
      .return(extensionDest)
    })
  },

  getBrowsers () {
    debug('getBrowsers')

    return launcher.detect()
    .then((browsers: FoundBrowser[] = []) => {
      let majorVersion

      debug('found browsers %o', { browsers })

      // @ts-ignore
      const version = process.versions.chrome || ''

      if (version) {
        majorVersion = parseFloat(version.split('.')[0])
      }

      const electronBrowser: FoundBrowser = {
        name: 'electron',
        channel: 'stable',
        family: 'chromium',
        displayName: 'Electron',
        version,
        path: '',
        majorVersion,
        info: 'Electron is the default browser that comes with Cypress. This is the default browser that runs in headless mode. Selecting this browser is useful when debugging. The version number indicates the underlying Chromium version that Electron uses.',
      }

      // the internal version of Electron, which won't be detected by `launcher`
      debug('adding Electron browser %o', electronBrowser)

      return browsers.concat(electronBrowser)
    })
  },
}
