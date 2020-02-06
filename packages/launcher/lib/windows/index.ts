import execa from 'execa'
import { pathExists } from 'fs-extra'
import { homedir } from 'os'
import { join, normalize } from 'path'
import { tap, trim } from 'ramda'
import { get } from 'lodash'
import { notInstalledErr } from '../errors'
import { log } from '../log'
import { Browser, FoundBrowser } from '../types'

function formFullAppPath (name: string) {
  const prefix = 'C:/Program Files (x86)/Google/Chrome/Application'

  return normalize(join(prefix, `${name}.exe`))
}

function formChromiumAppPath () {
  const exe = 'C:/Program Files (x86)/Google/chrome-win32/chrome.exe'

  return normalize(exe)
}

function formChromeCanaryAppPath () {
  const home = homedir()
  const exe = join(
    home,
    'AppData',
    'Local',
    'Google',
    'Chrome SxS',
    'Application',
    'chrome.exe'
  )

  return normalize(exe)
}

function formFirefoxAppPath () {
  const exe = 'C:/Program Files (x86)/Mozilla Firefox/firefox.exe'

  return normalize(exe)
}

function formFirefoxDeveloperEditionAppPath () {
  const exe = 'C:/Program Files (x86)/Firefox Developer Edition/firefox.exe'

  return normalize(exe)
}

function formFirefoxNightlyAppPath () {
  const exe = 'C:/Program Files (x86)/Firefox Nightly/firefox.exe'

  return normalize(exe)
}

function formEdgeCanaryAppPath () {
  const home = homedir()
  const exe = join(
    home,
    'AppData',
    'Local',
    'Microsoft',
    'Edge SxS',
    'Application',
    'msedge.exe'
  )

  return normalize(exe)
}

type NameToPath = (name: string) => string

type WindowsBrowserPaths = {
  [name: string]: {
    [channel: string]: NameToPath
  }
}

const formPaths: WindowsBrowserPaths = {
  chrome: {
    stable: formFullAppPath,
    canary: formChromeCanaryAppPath,
  },
  chromium: {
    stable: formChromiumAppPath,
  },
  firefox: {
    stable: formFirefoxAppPath,
    dev: formFirefoxDeveloperEditionAppPath,
    nightly: formFirefoxNightlyAppPath,
  },
  edge: {
    stable: () => normalize('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),
    beta: () => normalize('C:/Program Files (x86)/Microsoft/Edge Beta/Application/msedge.exe'),
    dev: () => normalize('C:/Program Files (x86)/Microsoft/Edge Dev/Application/msedge.exe'),
    canary: formEdgeCanaryAppPath,
  },
}

function getWindowsBrowser (browser: Browser): Promise<FoundBrowser> {
  const getVersion = (stdout: string): string => {
    // result from wmic datafile
    // "Version=61.0.3163.100"
    const wmicVersion = /^Version=(\S+)$/
    const m = wmicVersion.exec(stdout)

    if (m) {
      return m[1]
    }

    log('Could not extract version from %s using regex %s', stdout, wmicVersion)
    throw notInstalledErr(browser.name)
  }

  const formFullAppPathFn: any = get(formPaths, [browser.name, browser.channel], formFullAppPath)

  const exePath = formFullAppPathFn(browser.name)

  log('exe path %s', exePath)

  return pathExists(exePath)
  .then((exists) => {
    log('found %s ?', exePath, exists)

    if (!exists) {
      throw notInstalledErr(`Browser ${browser.name} file not found at ${exePath}`)
    }

    return getVersionString(exePath)
    .then(tap(log))
    .then(getVersion)
    .then((version: string) => {
      log('browser %s at \'%s\' version %s', browser.name, exePath, version)

      return {
        name: browser.name,
        version,
        path: exePath,
      } as FoundBrowser
    })
  })
  .catch(() => {
    throw notInstalledErr(browser.name)
  })
}

export function getVersionString (path: string) {
  const doubleEscape = (s: string) => s.replace(/\\/g, '\\\\')

  // on Windows using "--version" seems to always start the full
  // browser, no matter what one does.

  const args = [
    'datafile',
    'where',
    `name="${doubleEscape(path)}"`,
    'get',
    'Version',
    '/value',
  ]

  return execa('wmic', args)
  .then((result) => result.stdout)
  .then(trim)
}

export function detect (browser: Browser) {
  return getWindowsBrowser(browser)
}
