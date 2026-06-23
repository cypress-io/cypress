import _ from 'lodash'
import type { FoundBrowser } from '@packages/types'
import * as errors from '../errors'
import * as plugins from '../plugins'
import * as launcher from '@packages/launcher'
import type { Automation } from '../automation'
import type { Browser } from './types'
import type { CriClient } from './cri-client'
import * as profileCleaner from '../util/profile_cleaner'
import * as appData from '../util/app_data'
import path from 'path'
import Debug from 'debug'
import { telemetry } from '@packages/telemetry'
import { fs } from '../util/fs'
import * as extension from '@packages/extension'
import getPort from 'get-port'

declare global {
  interface Window {
    navigation?: {
      addEventListener: (event: string, listener: (event: any) => void) => void
    }
    cypressUtilityBinding?: (url: string) => void
  }
}

const debug = Debug('cypress:server:browsers:utils')

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

const getMajorVersion = (version) => {
  return parseFloat(version.split('.')[0]) || version
}

const defaultLaunchOptions: {
  preferences: { [key: string]: any }
  extensions: string[]
  args: string[]
  env: { [key: string]: any }
} = {
  preferences: {},
  extensions: [],
  args: [],
  env: {},
}

const KNOWN_LAUNCH_OPTION_PROPERTIES = _.keys(defaultLaunchOptions)

const getDefaultLaunchOptions = (options) => {
  return _.defaultsDeep(options, defaultLaunchOptions)
}

// When Cypress is installed in a read-only location (e.g. the Nix store), the
// source extension files and directories are read-only. fs.copy preserves those
// permissions on the copied extension, which later prevents Cypress from removing
// the browser profile directory on exit (EACCES/EPERM when unlinking files inside
// a read-only directory). Recursively granting owner write access ensures the
// profile can be cleaned up. See https://github.com/cypress-io/cypress/issues/31300
const ensureWritable = async (entryPath: string) => {
  const stats = await fs.stat(entryPath)

  // chmod(path, mode) sets the file's permission bits to `mode`.
  // `stats.mode` is the current mode (e.g. 0o555 for a read-only dir, 0o444 for a
  // read-only file). 0o200 is the octal bit for "owner write" (the `w` in `-w-`
  // under `rwx` triplets owner/group/other). OR-ing them (`stats.mode | 0o200`)
  // turns on the owner write bit while leaving every other bit untouched — so
  // 0o555 -> 0o755 and 0o444 -> 0o644. We only grant owner write (not group/other)
  // because the Cypress process owns these copies and that's all it needs to
  // remove them later.
  await fs.chmod(entryPath, stats.mode | 0o200)

  if (stats.isDirectory()) {
    const entries = await fs.readdir(entryPath)

    await Promise.all(entries.map((entry) => ensureWritable(path.join(entryPath, entry))))
  }
}

const copyExtension = async (src, dest) => {
  await fs.copyAsync(src, dest)

  await ensureWritable(dest)
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

  return Promise.all([
    removeLegacyProfiles(),
    profileCleaner.removeInactiveByPid(getProfileWildcard(browser), 'run-'),
    profileCleaner.removeInactiveByPid(pathToPartitions, 'run-'),
  ])
}

const pathToExtension = extension.getPathToExtension()

async function executeBeforeBrowserLaunch (browser, launchOptions: typeof defaultLaunchOptions, options) {
  if (plugins.has('before:browser:launch')) {
    const span = telemetry.startSpan({ name: 'lifecycle:before:browser:launch' })

    span?.setAttributes({
      name: browser.name,
      channel: browser.channel,
      version: browser.version,
      isHeadless: browser.isHeadless,
    })

    const pluginConfigResult = await plugins.execute('before:browser:launch', browser, launchOptions)

    span?.end()

    if (pluginConfigResult) {
      extendLaunchOptionsFromPlugins(launchOptions, pluginConfigResult, options)
    }
  }

  return launchOptions
}

interface AfterBrowserLaunchDetails {
  webSocketDebuggerUrl: string | never
}

async function executeAfterBrowserLaunch (browser: Browser, options: AfterBrowserLaunchDetails) {
  if (plugins.has('after:browser:launch')) {
    const span = telemetry.startSpan({ name: 'lifecycle:after:browser:launch' })

    span?.setAttributes({
      name: browser.name,
      channel: browser.channel,
      version: browser.version,
      isHeadless: browser.isHeadless,
    })

    await plugins.execute('after:browser:launch', browser, options)

    span?.end()
  }
}

function extendLaunchOptionsFromPlugins (launchOptions, pluginConfigResult, options) {
  // strip out all the known launch option properties from the resulting object
  const unexpectedProperties: string[] = _
  .chain(pluginConfigResult)
  .omit(KNOWN_LAUNCH_OPTION_PROPERTIES)
  .keys()
  .value()

  if (unexpectedProperties.length) {
    // error on invalid props
    errors.throwErr('UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES', unexpectedProperties, KNOWN_LAUNCH_OPTION_PROPERTIES)
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

const getWebKitBrowserVersion = async (pwWebkitModulePath?: string) => {
  try {
    // Resolve `playwright-core` relative to the resolved `playwright-webkit`
    // module first, then fall back to the project's working directory.
    //
    // In system tests the project runs from a temp dir outside the monorepo
    // where only `playwright-webkit` is symlinked into `node_modules` (see
    // `scaffoldCommonNodeModules`). Its transitive `playwright-core` dependency
    // is not resolvable from `process.cwd()`, so detection used to fall back to
    // '0' and display "WebKit 0". Since `playwright-webkit` always depends on
    // `playwright-core`, resolving from the webkit module's location finds the
    // correct `browsers.json`.
    const paths = pwWebkitModulePath ? [path.dirname(pwWebkitModulePath), process.cwd()] : [process.cwd()]
    const pwCorePath = path.dirname(require.resolve('playwright-core', { paths }))
    const browsersJsonPath = path.join(pwCorePath, 'browsers.json')
    const browsersJsonContents = await fs.readFile(browsersJsonPath, 'utf8')
    const browsersJson = JSON.parse(browsersJsonContents)
    const webkitEntry = browsersJson.browsers.find((b) => b.name === 'webkit')

    if (!webkitEntry || !webkitEntry.browserVersion) {
      debug('Could not find webkit browserVersion in playwright-core browsers.json %o', { webkitEntry })

      return '0'
    }

    return webkitEntry.browserVersion
  } catch (err) {
    debug('Error detecting WebKit browser version %o', err)

    return '0'
  }
}

async function getWebKitBrowser () {
  try {
    const modulePath = require.resolve('playwright-webkit', { paths: [process.cwd()] })
    const mod = await import(modulePath) as typeof import('playwright-webkit')
    const version = await getWebKitBrowserVersion(modulePath)

    const browser: FoundBrowser = {
      name: 'webkit',
      channel: 'stable',
      family: 'webkit',
      displayName: 'WebKit',
      version,
      path: mod.webkit.executablePath(),
      majorVersion: version.split('.')[0],
      warning: 'WebKit support is currently experimental. Some functions may not work as expected.',
    }

    return browser
  } catch (err) {
    debug('There was an error constructing the WebKit browser: %o', { err })

    return
  }
}

const getBrowsers = async () => {
  debug('getBrowsers')

  const [browsers, wkBrowser] = await Promise.all([
    launcher.detect(),
    getWebKitBrowser(),
  ])

  if (wkBrowser) browsers.push(wkBrowser)

  debug('found browsers %o', { browsers })

  if (!process.versions.electron) {
    debug('not in electron, skipping adding electron browser')

    return browsers
  }

  const version = process.versions.chrome || ''
  let majorVersion

  if (version) {
    majorVersion = getMajorVersion(version)
  }

  const electronBrowser: FoundBrowser = {
    name: 'electron',
    channel: 'stable',
    family: 'chromium',
    displayName: 'Electron',
    version,
    path: '',
    majorVersion,
  }

  browsers.push(electronBrowser)

  return browsers
}

const isValidPathToBrowser = (str) => {
  return typeof str === 'string' && path.basename(str) !== str
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

function ensureAndGetByNameOrPath (nameOrPath: string, returnAll: false, browsers?: FoundBrowser[]): Promise<FoundBrowser>

function ensureAndGetByNameOrPath (nameOrPath: string, returnAll: true, browsers?: FoundBrowser[]): Promise<FoundBrowser[]>

async function ensureAndGetByNameOrPath (nameOrPath: string, returnAll = false, prevKnownBrowsers: FoundBrowser[] = []) {
  const browsers = prevKnownBrowsers.length ? prevKnownBrowsers : (await getBrowsers())

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
    return launcher.detectByPath(nameOrPath)
    .then((browser) => {
      if (returnAll) {
        return [browser].concat(browsers)
      }

      return browser
    }).catch((err) => {
      errors.throwErr('BROWSER_NOT_FOUND_BY_PATH', nameOrPath, err.message)
    })
  }

  // not a path, not found by name
  throwBrowserNotFound(nameOrPath, browsers)
}

const formatBrowsersToOptions = (browsers) => {
  return browsers.map((browser) => {
    if (browser.channel !== 'stable') {
      return [browser.name, browser.channel].join(':')
    }

    return browser.name
  })
}

const throwBrowserNotFound = function (browserName, browsers: FoundBrowser[] = []) {
  return errors.throwErr('BROWSER_NOT_FOUND_BY_NAME', browserName, formatBrowsersToOptions(browsers))
}

const initializeCDP = async (criClient: CriClient, automation: Automation) => {
  await criClient.send('Runtime.enable')
  await criClient.send('Runtime.addBinding', {
    name: 'cypressUtilityBinding',
  })

  await criClient.on('Runtime.bindingCalled', async (data) => {
    if (data.name === 'cypressUtilityBinding') {
      const event = JSON.parse(data.payload)

      switch (event.type) {
        case 'service-worker-registration':
          // Chromium browsers and webkit do not give us guaranteed pre requests for service worker registrations but they still go through the proxy.
          // We need to notify the proxy when they are registered so that we can know which requests are controlled by service workers.
          await automation.onServiceWorkerClientSideRegistrationUpdated?.(event)
          break
        case 'download':
          // Chromium browsers and webkit do not give us pre requests for download links but they still go through the proxy.
          // We need to notify the proxy when they are clicked so that we can resolve the pending request waiting to be
          // correlated in the proxy.
          await automation.onDownloadLinkClicked?.(event.destination)
          break
        default:
          throw new Error(`Unknown cypressUtilityBinding event type: ${event.type}`)
      }
    }
  })

  await criClient.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    const binding = window['cypressUtilityBinding']
    delete window['cypressUtilityBinding']
    ;(${listenForDownload.toString()})(binding)
    ;(${overrideServiceWorkerRegistration.toString()})(binding)
    `,
  })
}

const overrideServiceWorkerRegistration = (binding) => {
  // The service worker container won't be available in different situations (like in the placeholder iframes we create
  // in open mode). So only override the register function if it exists.
  if (window.ServiceWorkerContainer) {
    const oldRegister = window.ServiceWorkerContainer.prototype.register

    window.ServiceWorkerContainer.prototype.register = function (scriptURL, options) {
      const anchor = document.createElement('a')

      let resolvedHref: URL

      if (typeof scriptURL === 'string') {
        anchor.setAttribute('href', scriptURL)
        resolvedHref = new URL(anchor.href)
      } else {
        resolvedHref = scriptURL
      }

      anchor.remove()
      const resolvedUrl = `${resolvedHref.origin}${resolvedHref.pathname}`

      const serviceWorkerRegistrationEvent = {
        type: 'service-worker-registration',
        scriptURL: resolvedUrl,
        initiatorOrigin: window.location.origin,
      }

      binding(JSON.stringify(serviceWorkerRegistrationEvent))

      return oldRegister.apply(this, [scriptURL, options])
    }
  }
}

// The most efficient way to do this is to listen for the navigate event. However, this is only available in chromium browsers (after 102).
// For older versions and for webkit, we need to listen for click events on anchor tags with the download attribute.
const listenForDownload = (binding) => {
  if (binding) {
    const createDownloadEvent = (destination) => {
      return JSON.stringify({
        type: 'download',
        destination,
      })
    }

    if (window.navigation) {
      window.navigation.addEventListener('navigate', (event) => {
        if (typeof event.downloadRequest === 'string') {
          binding(createDownloadEvent(event.destination.url))
        }
      })
    } else {
      document.addEventListener('click', (event) => {
        if (event.target instanceof HTMLAnchorElement && typeof event.target.download === 'string') {
          binding(createDownloadEvent(event.target.href))
        }
      })

      document.addEventListener('keydown', (event) => {
        if (event.target instanceof HTMLAnchorElement && event.key === 'Enter' && typeof event.target.download === 'string') {
          binding(createDownloadEvent(event.target.href))
        }
      })
    }
  }
}

const browserUtils = {

  getWebKitBrowserVersion,

  extendLaunchOptionsFromPlugins,

  executeAfterBrowserLaunch,

  executeBeforeBrowserLaunch,

  defaultLaunchOptions,

  getDefaultLaunchOptions,

  getPort,

  copyExtension,

  getBrowserPath,

  getMajorVersion,

  getProfileDir,

  getExtensionDir,

  ensureCleanCache,

  removeOldProfiles,

  ensureAndGetByNameOrPath,

  getBrowsers,

  formatBrowsersToOptions,

  throwBrowserNotFound,

  initializeCDP,

  listenForDownload,

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

        // ensure write access before overwriting
        return fs.chmod(extensionBg, 0o0644)
      })
      .then(() => {
        // and overwrite background.js with the final string bytes
        return fs.writeFileAsync(extensionBg, str)
      })
      .then(() => extensionDest)
    })
  },
}

export default browserUtils
