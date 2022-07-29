import Bluebird from 'bluebird'
import _, { compact, extend, find } from 'lodash'
import os from 'os'
import { browsers } from './browsers'
import * as darwinHelper from './darwin'
import { notDetectedAtPathErr } from './errors'
import * as linuxHelper from './linux'
import Debug from 'debug'
import type {
  Browser,
  DetectedBrowser,
  FoundBrowser,
} from '@packages/types'
import type {
  NotDetectedAtPathError,
  NotInstalledError, PathData,
} from './types'
import * as windowsHelper from './windows'

const debug = Debug('cypress:launcher:detect')
const debugVerbose = Debug('cypress-verbose:launcher:detect')

type HasVersion = Omit<Partial<FoundBrowser>, 'version' | 'name'> & {
  version: string
  name: string
}

type ValidatorResult = {
  // whether or not the browser is supported by Cypress
  isValid: boolean
  // optional warning message that will be shown in the GUI
  warningMessage?: string
}

const getMajorVersion = (version: string): string => {
  return version.split('.')[0] ?? version
}

// Compares a detected browser's major version to its minimum supported version
// to determine if the browser is supported by Cypress.
const validateMinVersion = (browser: FoundBrowser): ValidatorResult => {
  const minSupportedVersion = browser.minSupportedVersion
  const majorVersion = browser.majorVersion

  if (majorVersion && minSupportedVersion && parseInt(majorVersion) < minSupportedVersion) {
    return {
      isValid: false,
      warningMessage: `Cypress does not support running ${browser.displayName} version ${majorVersion}. To use ${browser.displayName} with Cypress, install a version of ${browser.displayName} newer than or equal to ${minSupportedVersion}.`,
    }
  }

  return {
    isValid: true,
  }
}

const validateStableFirefoxVersion = (browser: FoundBrowser, platform: NodeJS.Platform): ValidatorResult => {
  // See https://github.com/cypress-io/cypress/issues/22086 for more info related
  // to the FF bug in 101/102 on Windows.
  if (platform === 'win32' && browser.majorVersion && ['101', '102'].includes(browser.majorVersion)) {
    return {
      isValid: false,
      warningMessage: `Cypress does not support running ${browser.displayName} version ${browser.majorVersion} on Windows due to an unpatched browser incompatibility. To use ${browser.displayName} with Cypress on Windows, install version 103 or newer.`,
    }
  }

  return validateMinVersion(browser)
}

const validateBrowser = (browser: FoundBrowser, platform: NodeJS.Platform) => {
  if (browser.name === 'firefox' && browser.channel === 'stable') {
    return validateStableFirefoxVersion(browser, platform)
  }

  return validateMinVersion(browser)
}

type PlatformHelper = {
  detect: (browser: Browser) => Promise<DetectedBrowser>
  getVersionString: (path: string) => Promise<string>
  getVersionNumber: (path: string, browser: Browser) => string
  getPathData: (path: string) => PathData
}

type Helpers = {
  [index: string]: PlatformHelper
}

const helpers: Helpers = {
  darwin: darwinHelper,
  linux: linuxHelper,
  win32: windowsHelper,
}

function getHelper (platform?: NodeJS.Platform): PlatformHelper {
  const helper = helpers[platform || os.platform()]

  if (!helper) {
    throw Error(`Could not find helper for ${platform}`)
  }

  return helper
}

function lookup (
  platform: NodeJS.Platform,
  browser: Browser,
): Promise<DetectedBrowser> {
  const helper = getHelper(platform)

  if (!helper) {
    throw new Error(`Cannot lookup browser ${browser.name} on ${platform}`)
  }

  return helper.detect(browser)
}

/**
 * Try to detect a single browser definition, which may dispatch multiple `checkOneBrowser` calls,
 * one for each binary. If Windows is detected, only one `checkOneBrowser` will be called, because
 * we don't use the `binary` field on Windows.
 */
function checkBrowser (browser: Browser): Bluebird<(boolean | HasVersion)[]> {
  if (Array.isArray(browser.binary) && os.platform() !== 'win32') {
    return Bluebird.map(browser.binary, (binary: string) => {
      return checkOneBrowser(extend({}, browser, { binary }))
    })
  }

  return Bluebird.map([browser], checkOneBrowser)
}

function checkOneBrowser (browser: Browser): Promise<boolean | HasVersion> {
  const platform = os.platform()
  const pickBrowserProps = [
    'name',
    'family',
    'channel',
    'displayName',
    'type',
    'version',
    'path',
    'profilePath',
    'custom',
    'warning',
    'info',
    'minSupportedVersion',
    'unsupportedVersion',
  ] as const

  const failed = (err: NotInstalledError) => {
    if (err.notInstalled) {
      debugVerbose('browser %s not installed', browser.name)

      return false
    }

    throw err
  }

  return lookup(platform, browser)
  .then((val) => ({ ...browser, ...val }))
  .then((val) => _.pick(val, pickBrowserProps) as FoundBrowser)
  .then((browser) => {
    browser.majorVersion = getMajorVersion(browser.version)

    const validatorResult = validateBrowser(browser, platform)

    browser.unsupportedVersion = !validatorResult.isValid
    browser.warning = validatorResult.warningMessage

    return browser
  })
  .catch(failed)
}

/** returns list of detected browsers */
export const detect = (goalBrowsers?: Browser[]): Bluebird<FoundBrowser[]> => {
  // we can detect same browser under different aliases
  // tell them apart by the name and the version property
  if (!goalBrowsers) {
    goalBrowsers = browsers
  }

  const removeDuplicates = (val) => {
    return _.uniqBy(val, (browser: FoundBrowser) => {
      return `${browser.name}-${browser.version}`
    })
  }
  const compactFalse = (browsers: any[]) => {
    return compact(browsers) as FoundBrowser[]
  }

  debug('detecting if the following browsers are present %o', goalBrowsers)

  return Bluebird.mapSeries(goalBrowsers, checkBrowser)
  .then((val) => _.flatten(val))
  .then(compactFalse)
  .then(removeDuplicates)
}

export const detectByPath = (
  path: string,
  goalBrowsers?: Browser[],
): Promise<FoundBrowser> => {
  if (!goalBrowsers) {
    goalBrowsers = browsers
  }

  const helper = getHelper()

  const detectBrowserByVersionString = (stdout: string): Browser | undefined => {
    return find(goalBrowsers, (goalBrowser: Browser) => {
      return goalBrowser.versionRegex.test(stdout)
    })
  }

  const detectBrowserFromKey = (browserKey): Browser | undefined => {
    return find(goalBrowsers, (goalBrowser) => {
      return (
        goalBrowser.name === browserKey ||
        goalBrowser.displayName === browserKey ||
        goalBrowser.binary.indexOf(browserKey) > -1
      )
    })
  }

  const setCustomBrowserData = (browser: Browser, path: string, versionStr: string): FoundBrowser => {
    const version = helper.getVersionNumber(versionStr, browser)

    return extend({}, browser, {
      name: browser.name,
      displayName: `Custom ${browser.displayName}`,
      info: `Loaded from ${path}`,
      custom: true,
      path,
      version,
      majorVersion: getMajorVersion(version),
    })
  }

  const pathData = helper.getPathData(path)

  return helper.getVersionString(pathData.path)
  .then((version) => {
    let browser

    if (pathData.browserKey) {
      browser = detectBrowserFromKey(pathData.browserKey)
    }

    if (!browser) {
      browser = detectBrowserByVersionString(version)
    }

    if (!browser) {
      throw notDetectedAtPathErr(`Unable to find browser with path ${path}`)
    }

    return setCustomBrowserData(browser, pathData.path, version)
  })
  .catch((err: NotDetectedAtPathError) => {
    if (err.notDetectedAtPath) {
      throw err
    }

    throw notDetectedAtPathErr(err.message)
  })
}
