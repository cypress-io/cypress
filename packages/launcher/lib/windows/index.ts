import * as fse from 'fs-extra'
import os from 'os'
import { join, normalize, win32 } from 'path'
import { get } from 'lodash'
import { notInstalledErr } from '../errors'
import { log } from '../log'
import type { Browser, FoundBrowser, PathData } from '../types'
import { utils } from '../utils'

function formFullAppPath (name: string) {
  return [
    `C:/Program Files (x86)/Google/Chrome/Application/${name}.exe`,
    `C:/Program Files/Google/Chrome/Application/${name}.exe`,
  ].map(normalize)
}

function formChromeBetaAppPath () {
  return [
    'C:/Program Files (x86)/Google/Chrome Beta/Application/chrome.exe',
    'C:/Program Files/Google/Chrome Beta/Application/chrome.exe',
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
    beta: formChromeBetaAppPath,
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

    let path = doubleEscape(exePath)

    return fse.pathExists(path)
    .then((exists) => {
      log('found %s ?', path, exists)

      if (!exists) {
        return tryNextExePath()
      }

      return getVersionString(path)
      .then((val) => {
        log(val)

        return val
      })
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

export function doubleEscape (s: string) {
  // Converts all types of paths into windows supported double backslash path
  // Handles any number of \\ in the given path
  return win32.join(...s.split(win32.sep)).replace(/\\/g, '\\\\')
}

export function getVersionString (path: string) {
  // on Windows using "--version" seems to always start the full
  // browser, no matter what one does.

  const args = [
    'datafile',
    'where',
    `name="${path}"`,
    'get',
    'Version',
    '/value',
  ]

  return utils.execa('wmic', args)
  .then((val) => val.stdout)
  .then((val) => val.trim())
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
    path = doubleEscape(pathParts.join(':'))

    return { path, browserKey }
  }

  path = doubleEscape(path)

  if (pathStr.indexOf('chrome.exe') > -1) {
    return { path, browserKey: 'chrome' }
  }

  if (pathStr.indexOf('edge.exe') > -1) {
    return { path, browserKey: 'edge' }
  }

  if (pathStr.indexOf('firefox.exe') > -1) {
    return { path, browserKey: 'firefox' }
  }

  return { path }
}

export function detect (browser: Browser) {
  return getWindowsBrowser(browser)
}
