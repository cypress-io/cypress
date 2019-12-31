import execa from 'execa'
import { pathExists } from 'fs-extra'
import { homedir } from 'os'
import { join, normalize } from 'path'
import { tap, trim } from 'ramda'
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

type NameToPath = (name: string) => string

interface WindowsBrowserPaths {
  [index: string]: NameToPath
  chrome: NameToPath
  canary: NameToPath
  chromium: NameToPath
}

const formPaths: WindowsBrowserPaths = {
  chrome: formFullAppPath,
  canary: formChromeCanaryAppPath,
  chromium: formChromiumAppPath,
}

function getWindowsBrowser (name: string): Promise<FoundBrowser> {
  const getVersion = (stdout: string): string => {
    // result from wmic datafile
    // "Version=61.0.3163.100"
    const wmicVersion = /^Version=(\S+)$/
    const m = wmicVersion.exec(stdout)

    if (m) {
      return m[1]
    }

    log('Could not extract version from %s using regex %s', stdout, wmicVersion)
    throw notInstalledErr(name)
  }

  const formFullAppPathFn: any = formPaths[name] || formFullAppPath
  const exePath = formFullAppPathFn(name)

  log('exe path %s', exePath)

  return pathExists(exePath)
  .then((exists) => {
    log('found %s ?', exePath, exists)

    if (!exists) {
      throw notInstalledErr(`Browser ${name} file not found at ${exePath}`)
    }

    return getVersionString(exePath)
    .then(tap(log))
    .then(getVersion)
    .then((version: string) => {
      log('browser %s at \'%s\' version %s', name, exePath, version)

      return {
        name,
        version,
        path: exePath,
      } as FoundBrowser
    })
  })
  .catch(() => {
    throw notInstalledErr(name)
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
  return getWindowsBrowser(browser.name)
}
