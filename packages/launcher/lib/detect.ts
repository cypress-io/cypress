import * as Bluebird from 'bluebird'
import { extend, compact, find } from 'lodash'
import * as os from 'os'
import { merge, pick, props, tap, uniqBy, flatten } from 'ramda'
import { browsers } from './browsers'
import * as darwinHelper from './darwin'
import * as linuxHelper from './linux'
import { log } from './log'
import {
  FoundBrowser,
  Browser,
  NotInstalledError,
  NotDetectedAtPathError
} from './types'
import * as windowsHelper from './windows'
import { notDetectedAtPathErr } from './errors'

const setMajorVersion = (browser: FoundBrowser) => {
  if (browser.version) {
    browser.majorVersion = browser.version.split('.')[0]
    log(
      'browser %s version %s major version %s',
      browser.name,
      browser.version,
      browser.majorVersion
    )
  }
  return browser
}

type PlatformHelper = {
  detect: (browser: Browser) => Promise<FoundBrowser>
  getVersionString: (path: string) => Promise<string>
}

type Helpers = {
  [index: string]: PlatformHelper
}

const helpers: Helpers = {
  darwin: darwinHelper,
  linux: linuxHelper,
  win32: windowsHelper
}

function getHelper(platform?: NodeJS.Platform): PlatformHelper {
  return helpers[platform || os.platform()]
}

function lookup(
  platform: NodeJS.Platform,
  browser: Browser
): Promise<FoundBrowser> {
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
function checkBrowser(browser: Browser): Promise<(boolean | FoundBrowser)[]> {
  if (Array.isArray(browser.binary) && os.platform() !== 'win32') {
    return Bluebird.map(browser.binary, (binary: string) => {
      return checkOneBrowser(extend({}, browser, { binary }))
    })
  }
  return Bluebird.map([browser], checkOneBrowser)
}

function checkOneBrowser(browser: Browser): Promise<boolean | FoundBrowser> {
  const platform = os.platform()
  const pickBrowserProps = pick([
    'name',
    'family',
    'displayName',
    'type',
    'version',
    'path',
    'custom'
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
    .then(setMajorVersion)
    .catch(failed)
}

/** returns list of detected browsers */
export const detect = (goalBrowsers?: Browser[]): Bluebird<FoundBrowser[]> => {
  // we can detect same browser under different aliases
  // tell them apart by the name and the version property
  if (!goalBrowsers) {
    goalBrowsers = browsers
  }

  const removeDuplicates = uniqBy((browser: FoundBrowser) =>
    props(['name', 'version'], browser)
  )
  const compactFalse = (browsers: any[]) => compact(browsers) as FoundBrowser[]

  return Bluebird.mapSeries(goalBrowsers, checkBrowser)
    .then(flatten)
    .then(compactFalse)
    .then(removeDuplicates)
}

export const detectByPath = (
  path: string,
  goalBrowsers?: Browser[]
): Bluebird<FoundBrowser> => {
  if (!goalBrowsers) {
    goalBrowsers = browsers
  }

  const helper = getHelper()

  const detectBrowserByVersionString = (stdout: string): FoundBrowser => {
    const browser = find(goalBrowsers, (goalBrowser: Browser) => {
      return goalBrowser.versionRegex.test(stdout)
    })

    if (!browser) {
      throw notDetectedAtPathErr(stdout)
    }

    const regexExec = browser.versionRegex.exec(stdout) as Array<string>

    return extend({}, browser, {
      displayName: `Custom ${browser.displayName}`,
      info: `Loaded from ${path}`,
      custom: true,
      path,
      version: regexExec[1],
      majorVersion: regexExec[1].split('.', 2)[0]
    })
  }

  return helper
    .getVersionString(path)
    .then(detectBrowserByVersionString)
    .catch((err: NotDetectedAtPathError) => {
      if (err.notDetectedAtPath) {
        throw err
      }
      throw notDetectedAtPathErr(err.message)
    }) as Bluebird<FoundBrowser>
}
