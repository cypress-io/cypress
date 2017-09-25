import { detectBrowserLinux } from './linux'
import { detectBrowserDarwin } from './darwin'
import { detectBrowserWindows } from './windows'
import { log } from './log'
import { Browser, NotInstalledError } from './types'
import { browsers } from './browsers'
import * as Bluebird from 'bluebird'
import { merge, pick, tap, uniqBy, prop } from 'ramda'
import * as _ from 'lodash'
import * as os from 'os'

const setMajorVersion = (obj: Browser) => {
  if (obj.version) {
    obj.majorVersion = obj.version.split('.')[0]
    log(
      'browser %s version %s major version %s',
      obj.name,
      obj.version,
      obj.majorVersion
    )
  }
  return obj
}

type BrowserDetector = (browser: Browser) => Promise<Object>
type Detectors = {
  [index: string]: BrowserDetector
}
const detectors: Detectors = {
  darwin: detectBrowserDarwin,
  linux: detectBrowserLinux,
  win32: detectBrowserWindows
}

function lookup(platform: NodeJS.Platform, obj: Browser): Promise<Object> {
  log('looking up %s on %s platform', obj.name, platform)
  const detector = detectors[platform]
  if (!detector) {
    throw new Error(`Cannot lookup browser ${obj.name} on ${platform}`)
  }
  return detector(obj)
}

function checkOneBrowser(browser: Browser) {
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
function detectBrowsers(): Bluebird<Browser[]> {
  // we can detect same browser under different aliases
  // tell them apart by the full version property
  const removeDuplicates = uniqBy(prop('version'))
  return Bluebird.mapSeries(browsers, checkOneBrowser)
    .then(_.compact)
    .then(removeDuplicates) as Bluebird<Browser[]>
}

export default detectBrowsers
