import Bluebird from 'bluebird'
import { compact, extend, find } from 'lodash'
import os from 'os'
import { flatten, merge, pick, props, tap, uniqBy } from 'ramda'
import { browsers } from './browsers'
import * as darwinHelper from './darwin'
import { notDetectedAtPathErr } from './errors'
import * as linuxHelper from './linux'
import { log } from './log'
import {
  Browser,
  DetectedBrowser,
  FoundBrowser,
  NotDetectedAtPathError,
  NotInstalledError, PathData,
} from './types'
import * as windowsHelper from './windows'

type HasVersion = {
  version?: string
  majorVersion?: string | number
  name: string
}

export const setMajorVersion = <T extends HasVersion>(browser: T): T => {
  let majorVersion = browser.majorVersion

  if (browser.version) {
    majorVersion = browser.version.split('.')[0]
    log(
      'browser %s version %s major version %s',
      browser.name,
      browser.version,
      majorVersion,
    )

    if (majorVersion) {
      majorVersion = parseInt(majorVersion)
    }
  }

  return extend({}, browser, { majorVersion })
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
  return helpers[platform || os.platform()]
}

function lookup (
  platform: NodeJS.Platform,
  browser: Browser,
): Promise<DetectedBrowser> {
  log('looking up %s on %s platform', browser.name, platform)
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
function checkBrowser (browser: Browser): Bluebird<(boolean | FoundBrowser)[]> {
  if (Array.isArray(browser.binary) && os.platform() !== 'win32') {
    return Bluebird.map(browser.binary, (binary: string) => {
      return checkOneBrowser(extend({}, browser, { binary }))
    })
  }

  return Bluebird.map([browser], checkOneBrowser)
}

function checkOneBrowser (browser: Browser): Promise<boolean | FoundBrowser> {
  const platform = os.platform()
  const pickBrowserProps = pick([
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
  ])

  const logBrowser = (props: any) => {
    log('setting major version for %j', props)
  }

  const failed = (err: NotInstalledError) => {
    if (err.notInstalled) {
      log('browser %s not installed', browser.name)

      return false
    }

    throw err
  }

  log('checking one browser %s', browser.name)

  return lookup(platform, browser)
  .then(merge(browser))
  .then(pickBrowserProps)
  .then(tap(logBrowser))
  .then((browser) => setMajorVersion(browser))
  .then(maybeSetFirefoxWarning)
  .catch(failed)
}

export const firefoxGcWarning = 'This version of Firefox has a bug that causes excessive memory consumption and will cause your tests to run slowly. It is recommended to upgrade to Firefox 80 or newer. [Learn more.](https://docs.cypress.io/guides/references/configuration.html#firefoxGcInterval)'

// @see https://github.com/cypress-io/cypress/issues/8241
const maybeSetFirefoxWarning = (browser: FoundBrowser) => {
  if (browser.family === 'firefox' && Number(browser.majorVersion) < 80) {
    browser.warning = firefoxGcWarning
  }

  return browser
}

/** returns list of detected browsers */
export const detect = (goalBrowsers?: Browser[]): Bluebird<FoundBrowser[]> => {
  // we can detect same browser under different aliases
  // tell them apart by the name and the version property
  if (!goalBrowsers) {
    goalBrowsers = browsers
  }

  const removeDuplicates = uniqBy((browser: FoundBrowser) => {
    return props(['name', 'version'], browser)
  })
  const compactFalse = (browsers: any[]) => {
    return compact(browsers) as FoundBrowser[]
  }

  log('detecting if the following browsers are present %o', goalBrowsers)

  return Bluebird.mapSeries(goalBrowsers, checkBrowser)
  .then(flatten)
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

    let parsedBrowser = {
      name: browser.name,
      displayName: `Custom ${browser.displayName}`,
      info: `Loaded from ${path}`,
      custom: true,
      path,
      version,
    }

    parsedBrowser = setMajorVersion(parsedBrowser)

    return extend({}, browser, parsedBrowser)
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
  .then(maybeSetFirefoxWarning)
  .catch((err: NotDetectedAtPathError) => {
    if (err.notDetectedAtPath) {
      throw err
    }

    throw notDetectedAtPathErr(err.message)
  })
}
