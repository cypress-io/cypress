import fse from 'fs-extra'
import os from 'os'
import { join, normalize } from 'path'
import { tap, trim, prop } from 'ramda'
import { get } from 'lodash'
import { notInstalledErr } from '../errors'
import { log } from '../log'
import { Browser, FoundBrowser, PathData } from '../types'
import { utils } from '../utils'

function formFullAppPath (name: string) {
  return [
    `C:/Program Files (x86)/Google/Chrome/Application/${name}.exe`,
    `C:/Program Files/Google/Chrome/Application/${name}.exe`,
  ].map(normalize)
}

function formChromiumAppPath () {
  const exe = 'C:/Program Files (x86)/Google/chrome-win32/chrome.exe'

  return [normalize(exe)]
}

function formChromeCanaryAppPath () {
  const home = os.homedir()
  const exe = join(
    home,
    'AppData',
    'Local',
    'Google',
    'Chrome SxS',
    'Application',
    'chrome.exe',
  )

  return [normalize(exe)]
}

function getFirefoxPaths (editionFolder) {
  return () => {
    return (['Program Files', 'Program Files (x86)'])
    .map((programFiles) => {
      return normalize(`C:/${programFiles}/${editionFolder}/firefox.exe`)
    })
    .concat(normalize(join(
      os.homedir(),
      'AppData',
      'Local',
      editionFolder,
      'firefox.exe',
    )))
  }
}

function formEdgeCanaryAppPath () {
  const home = os.homedir()
  const exe = join(
    home,
    'AppData',
    'Local',
    'Microsoft',
    'Edge SxS',
    'Application',
    'msedge.exe',
  )

  return [normalize(exe)]
}

type NameToPath = (name: string) => string[]

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
    stable: getFirefoxPaths('Mozilla Firefox'),
    dev: getFirefoxPaths('Firefox Developer Edition'),
    nightly: getFirefoxPaths('Firefox Nightly'),
  },
  edge: {
    stable: () => {
      return [normalize('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')]
    },
    beta: () => {
      return [normalize('C:/Program Files (x86)/Microsoft/Edge Beta/Application/msedge.exe')]
    },
    dev: () => {
      return [normalize('C:/Program Files (x86)/Microsoft/Edge Dev/Application/msedge.exe')]
    },
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

  const formFullAppPathFn: NameToPath = get(formPaths, [browser.name, browser.channel], formFullAppPath)

  const exePaths = formFullAppPathFn(browser.name)

  log('looking at possible paths... %o', { browser, exePaths })

  // shift and try paths 1-by-1 until we find one that works
  const tryNextExePath = async () => {
    const exePath = exePaths.shift()

    if (!exePath) {
      // exhausted available paths
      throw notInstalledErr(browser.name)
    }

    return fse.pathExists(exePath)
    .then((exists) => {
      log('found %s ?', exePath, exists)

      if (!exists) {
        return tryNextExePath()
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
    .catch((err) => {
      log('error while looking up exe, trying next exePath %o', { exePath, exePaths, err })

      return tryNextExePath()
    })
  }

  return tryNextExePath()
}

export function getVersionString (path: string) {
  const doubleEscape = (s: string) => {
    return s.replace(/\\/g, '\\\\')
  }

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

  return utils.execa('wmic', args)
  .then(prop('stdout'))
  .then(trim)
}

export function getVersionNumber (version: string) {
  if (version.indexOf('Version=') > -1) {
    return version.split('=')[1]
  }

  return version
}

export function getPathData (pathStr: string): PathData {
  const test = new RegExp(/^.+\.exe:(.+)$/)
  const res = test.exec(pathStr)
  let browserKey = ''
  let path = pathStr

  if (res) {
    const pathParts = path.split(':')

    browserKey = pathParts.pop() || ''
    path = pathParts.join(':')

    return { path, browserKey }
  }

  if (pathStr.indexOf('chrome.exe') > -1) {
    return { path, browserKey: 'chrome' }
  }

  if (pathStr.indexOf('firefox.exe') > -1) {
    return { path, browserKey: 'firefox' }
  }

  return { path }
}

export function detect (browser: Browser) {
  return getWindowsBrowser(browser)
}
