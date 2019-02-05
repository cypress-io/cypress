import * as Bluebird from 'bluebird'
import { extend, compact } from 'lodash'
import * as os from 'os'
import { merge, pick, props, tap, uniqBy, flatten } from 'ramda'
import { browsers } from './browsers'
import { detectBrowserDarwin } from './darwin'
import { detectBrowserLinux } from './linux'
import { log } from './log'
import { FoundBrowser, Browser, NotInstalledError } from './types'
import { detectBrowserWindows } from './windows'

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

type BrowserDetector = (browser: Browser) => Promise<FoundBrowser>
type Detectors = {
  [index: string]: BrowserDetector
}
const detectors: Detectors = {
  darwin: detectBrowserDarwin,
  linux: detectBrowserLinux,
  win32: detectBrowserWindows
}

function lookup(
  platform: NodeJS.Platform,
  browser: Browser
): Promise<FoundBrowser> {
  log('looking up %s on %s platform', browser.name, platform)
  const detector = detectors[platform]
  if (!detector) {
    throw new Error(`Cannot lookup browser ${browser.name} on ${platform}`)
  }
  return detector(browser)
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
    'displayName',
    'type',
    'version',
    'path'
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
function detectBrowsers(goalBrowsers?: Browser[]): Bluebird<FoundBrowser[]> {
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

export default detectBrowsers
