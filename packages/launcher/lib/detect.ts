import _, { compact, extend, find, uniqBy } from 'lodash'
import os from 'os'
import { knownBrowsers } from './known-browsers'
import * as darwinHelper from './darwin'
import { notDetectedAtPathErr } from './errors'
import * as linuxHelper from './linux'
import Debug from 'debug'
import type {
  Browser,
  BrowserValidator,
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

function getBrowserKey<T extends {name: string, version: string | number}> (browser: T) {
  return `${browser.name}-${browser.version}`
}

function removeDuplicateBrowsers (browsers: FoundBrowser[]) {
  return uniqBy(browsers, getBrowserKey)
}

export const getMajorVersion = (version: string): string => {
  return version.split('.')[0] as string
}

// Determines if found browser is supported by Cypress. If found to be
// unsupported, the browser will be unavailable for selection and
// will present the determined warning message to the user.
const validateCypressSupport = (validator: BrowserValidator | undefined, browser: FoundBrowser, platform: NodeJS.Platform) => {
  if (!validator) {
    return
  }

  const { isSupported, warningMessage } = validator(browser, platform)

  if (isSupported) {
    return
  }

  browser.unsupportedVersion = true
  browser.warning = warningMessage
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
async function checkBrowser (browser: Browser): Promise<(boolean | HasVersion)[]> {
  if (Array.isArray(browser.binary) && os.platform() !== 'win32') {
    const checkedBrowsers = await Promise.all(browser.binary.map((binary) => checkOneBrowser(extend({}, browser, { binary }))))

    return checkedBrowsers
  }

  const checkedBrowsers = await checkOneBrowser(browser)

  return [checkedBrowsers]
}

async function checkOneBrowser (browser: Browser): Promise<boolean | HasVersion> {
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
    'unsupportedVersion',
  ] as const

  const failed = (err: NotInstalledError) => {
    if (err.notInstalled) {
      debugVerbose('browser %s not installed', browser.name)

      return false
    }

    throw err
  }

  try {
    const detectedBrowser = await lookup(platform, browser)

    const browserWithDetected = { ...browser, ...detectedBrowser }

    const foundBrowser = _.pick(browserWithDetected, pickBrowserProps) as FoundBrowser

    foundBrowser.majorVersion = getMajorVersion(foundBrowser.version)

    validateCypressSupport(browser.validator, foundBrowser, platform)

    return foundBrowser
  } catch (error) {
    return failed(error as NotInstalledError)
  }
}

/** returns list of detected browsers */
export const detect = async (goalBrowsers?: Browser[]): Promise<FoundBrowser[]> => {
  // we can detect same browser under different aliases
  // tell them apart by the name and the version property
  if (!goalBrowsers) {
    goalBrowsers = knownBrowsers
  }

  const compactFalse = (browsers: any[]) => {
    return compact(browsers) as FoundBrowser[]
  }

  debug('detecting if the following browsers are present %o', goalBrowsers)

  let foundBrowsers: FoundBrowser[] = []

  {
    const hasVersionOrFalse: (boolean | HasVersion)[][] = []

    for (const browser of goalBrowsers) {
      const browserOrFalse = await checkBrowser(browser)

      hasVersionOrFalse.push(browserOrFalse)
    }

    const flattenedFoundBrowsers = _.flatten(hasVersionOrFalse)
    const compactedFoundBrowsers = compactFalse(flattenedFoundBrowsers)

    foundBrowsers = removeDuplicateBrowsers(compactedFoundBrowsers)
  }

  return foundBrowsers
}

export const detectByPath = async (
  path: string,
  goalBrowsers?: Browser[],
): Promise<FoundBrowser> => {
  if (!goalBrowsers) {
    goalBrowsers = knownBrowsers
  }

  const helper = getHelper()

  const detectBrowserByVersionString = (stdout: string): Browser | undefined => {
    return find(goalBrowsers, (goalBrowser: Browser) => {
      return goalBrowser.versionRegex.test(stdout)
    })
  }

  const detectBrowserFromKey = (browserKey: string): Browser | undefined => {
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

    const parsedBrowser = extend({}, browser, {
      name: browser.name,
      displayName: `Custom ${browser.displayName}`,
      info: `Loaded from ${path}`,
      custom: true,
      path,
      version,
      majorVersion: getMajorVersion(version),
    }) as FoundBrowser

    validateCypressSupport(browser.validator, parsedBrowser, os.platform())

    return parsedBrowser
  }

  const pathData = helper.getPathData(path)

  try {
    const version = await helper.getVersionString(pathData.path)

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
  } catch (error: any) {
    if (error.notDetectedAtPath) {
      throw error as NotDetectedAtPathError
    }

    throw notDetectedAtPathErr(error.message)
  }
}
