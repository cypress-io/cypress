import Bluebird from 'bluebird'
import _, { compact, extend, find } from 'lodash'
import os from 'os'
import { browsers } from './browsers'
import * as darwinHelper from './darwin'
import { needsDarwinWorkaround, darwinDetectionWorkaround } from './darwin/util'
import { notDetectedAtPathErr } from './errors'
import * as linuxHelper from './linux'
import { log } from './log'
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

type HasVersion = Omit<Partial<FoundBrowser>, 'version' | 'name'> & {
  version: string
  name: string
}

export const setMajorVersion = <T extends HasVersion>(browser: T): T => {
  const ver = browser.version.split('.')[0] ?? browser.version
  const majorVersion = parseInt(ver) || browser.version

  const unsupportedVersion = browser.minSupportedVersion && majorVersion < browser.minSupportedVersion

  log(
    'browser %s version %s major version %s',
    browser.name,
    browser.version,
    majorVersion,
    unsupportedVersion,
  )

  const foundBrowser = extend({}, browser, { majorVersion })

  if (unsupportedVersion) {
    foundBrowser.unsupportedVersion = true
    foundBrowser.warning = `Cypress does not support running ${browser.displayName} version ${majorVersion}. To use ${browser.displayName} with Cypress, install a version of ${browser.displayName} newer than or equal to ${browser.minSupportedVersion}.`
  }

  return foundBrowser
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
  .then((val) => ({ ...browser, ...val }))
  .then((val) => _.pick(val, pickBrowserProps) as HasVersion)
  .then((val) => {
    logBrowser(val)

    return val
  })
  .then((browser) => setMajorVersion(browser))
  .catch(failed)
}

/** returns list of detected browsers */
export const detect = (goalBrowsers?: Browser[], useDarwinWorkaround = true): Bluebird<FoundBrowser[]> => {
  // we can detect same browser under different aliases
  // tell them apart by the name and the version property
  if (!goalBrowsers) {
    goalBrowsers = browsers
  }

  // BigSur (darwin 20.x) and Electron 12+ cause huge performance issues when
  // spawning child processes, which is the way we find browsers via execa.
  // The performance cost is multiplied by the number of binary variants of
  // each browser plus any fallback lookups we do.
  // The workaround gets around this by breaking out of the bundled Electron
  // Node.js and using the user's Node.js if possible. It only pays the cost
  // of spawning a single child process instead of multiple. If this fails,
  // we fall back to to the slower, default method
  // https://github.com/cypress-io/cypress/issues/17773
  if (useDarwinWorkaround && needsDarwinWorkaround()) {
    log('using darwin detection workaround')
    if (log.enabled) {
      // eslint-disable-next-line no-console
      console.time('time taken detecting browsers (darwin workaround)')
    }

    return Bluebird.resolve(darwinDetectionWorkaround())
    .catch((err) => {
      log('darwin workaround failed, falling back to normal detection')
      log(err.stack)

      return detect(goalBrowsers, false)
    })
    .finally(() => {
      if (log.enabled) {
        // eslint-disable-next-line no-console
        console.timeEnd('time taken detecting browsers (darwin workaround)')
      }
    })
  }

  const removeDuplicates = (val) => {
    return _.uniqBy(val, (browser: FoundBrowser) => {
      return `${browser.name}-${browser.version}`
    })
  }
  const compactFalse = (browsers: any[]) => {
    return compact(browsers) as FoundBrowser[]
  }

  log('detecting if the following browsers are present %o', goalBrowsers)

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

    let parsedBrowser = extend({}, browser, {
      name: browser.name,
      displayName: `Custom ${browser.displayName}`,
      info: `Loaded from ${path}`,
      custom: true,
      path,
      version,
    })

    return setMajorVersion(parsedBrowser)
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
