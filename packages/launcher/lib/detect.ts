import Bluebird from 'bluebird'
import _, { compact, extend, find } from 'lodash'
import os from 'os'
import { removeDuplicateBrowsers } from '@packages/data-context/src/sources/BrowserDataSource'
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
  VersionStringCache,
} from './types'
import * as windowsHelper from './windows'

const debug = Debug('cypress:launcher:detect')
const debugVerbose = Debug('cypress-verbose:launcher:detect')

type HasVersion = Omit<Partial<FoundBrowser>, 'version' | 'name'> & {
  version: string
  name: string
}

export const getMajorVersion = (version: string): string => {
  return version.split('.')[0]
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
  detect: (browser: Browser, versionStringCache?: VersionStringCache) => Promise<DetectedBrowser>
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
  versionStringCache: VersionStringCache,
): Promise<DetectedBrowser> {
  const helper = getHelper(platform)

  if (!helper) {
    throw new Error(`Cannot lookup browser ${browser.name} on ${platform}`)
  }

  return helper.detect(browser, versionStringCache)
}

/**
 * Try to detect a single browser definition, which may dispatch multiple `checkOneBrowser` calls,
 * one for each binary. If Windows is detected, only one `checkOneBrowser` will be called, because
 * we don't use the `binary` field on Windows.
 */
function checkBrowser (browser: Browser, versionStringCache: VersionStringCache): Bluebird<(boolean | HasVersion)[]> {
  if (Array.isArray(browser.binary) && os.platform() !== 'win32') {
    return Bluebird.map(browser.binary, (binary: string) => {
      return checkOneBrowser(extend({}, browser, { binary }), versionStringCache)
    })
  }

  return Bluebird.map([browser], (browser) => checkOneBrowser(browser, versionStringCache))
}

function checkOneBrowser (browser: Browser, versionStringCache: VersionStringCache): Promise<boolean | HasVersion> {
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

  return lookup(platform, browser, versionStringCache)
  .then((val) => ({ ...browser, ...val }))
  .then((val) => _.pick(val, pickBrowserProps) as FoundBrowser)
  .then((foundBrowser) => {
    foundBrowser.majorVersion = getMajorVersion(foundBrowser.version)

    validateCypressSupport(browser.validator, foundBrowser, platform)

    return foundBrowser
  })
  .catch(failed)
}

/** returns list of detected browsers */
export const detect = (goalBrowsers?: Browser[]): Bluebird<FoundBrowser[]> => {
  // we can detect same browser under different aliases
  // tell them apart by the name and the version property
  if (!goalBrowsers) {
    goalBrowsers = knownBrowsers
  }

  const compactFalse = (browsers: any[]) => {
    return compact(browsers) as FoundBrowser[]
  }

  debug('detecting if the following browsers are present %o', goalBrowsers)

  // Several definitions probe the same binary (e.g. `chrome`), so share its `--version` output
  const versionStringCache: VersionStringCache = new Map()

  // Checked one at a time on purpose: the `which` lookup filters out missing
  // binaries before anything is spawned, so checking definitions concurrently
  // leaves little to overlap and does not make startup faster.
  return Bluebird.mapSeries(goalBrowsers, (browser) => checkBrowser(browser, versionStringCache))
  .then((val) => _.flatten(val))
  .then(compactFalse)
  .then(removeDuplicateBrowsers)
}

const MAX_REPORTED_OUTPUT = 1000

export const detectByPath = (
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

  // Windows reads the version from the file, so there is no output to report
  const readVersion = async (binary: string): Promise<{ version: string, stderr: string }> => {
    if (os.platform() === 'win32') {
      return { version: await helper.getVersionString(binary), stderr: '' }
    }

    const { stdout, stderr } = await linuxHelper.getVersionOutput(binary)

    return { version: stdout, stderr }
  }

  const describeNotFound = (version: string, stderr: string): string => {
    const base = `Unable to find browser with path ${path}`

    if (os.platform() === 'win32') {
      return base
    }

    // A crashing binary can print a lot
    const clip = (text: string) => (text.length > MAX_REPORTED_OUTPUT ? `${text.slice(0, MAX_REPORTED_OUTPUT)}...` : text)

    return `${base}. Running "${pathData.path} --version" printed: ${clip(version) || '(nothing)'}${stderr ? `\nand wrote to stderr: ${clip(stderr)}` : ''}`
  }

  return readVersion(pathData.path)
  .then(({ version, stderr }) => {
    let browser

    if (pathData.browserKey) {
      browser = detectBrowserFromKey(pathData.browserKey)
    }

    if (!browser) {
      browser = detectBrowserByVersionString(version)
    }

    if (!browser) {
      throw notDetectedAtPathErr(describeNotFound(version, stderr))
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
