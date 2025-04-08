import * as fse from 'fs-extra'
import winVersionInfo from 'win-version-info'
import os from 'os'
import { join, normalize, win32 } from 'path'
import { get } from 'lodash'
import { notInstalledErr } from '../errors'
import Debug from 'debug'
import type { PathData } from '../types'
import type { Browser, FoundBrowser } from '@packages/types'

const debug = Debug('cypress:launcher:windows')
const debugVerbose = Debug('cypress-verbose:launcher:windows')

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
  return [
    'C:/Program Files (x86)/Google/chrome-win32/chrome.exe',
    'C:/Program Files/Google/chrome-win/chrome.exe',
    'C:/Program Files/Google/Chromium/chrome.exe',
    'C:/Program Files (x86)/Google/Chromium/chrome.exe',
  ].map(normalize)
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

function formChromeForTestingAppPath () {
  return [
    'C:/Program Files/Google/Chrome for Testing/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome for Testing/chrome.exe',
  ].map(normalize)
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
  'chrome-for-testing': {
    stable: formChromeForTestingAppPath,
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
    canary: formEdgeCanaryAppPath,
    dev: () => {
      return [normalize('C:/Program Files (x86)/Microsoft/Edge Dev/Application/msedge.exe')]
    },
  },
}

function getWindowsBrowser (browser: Browser): Promise<FoundBrowser> {
  const formFullAppPathFn: NameToPath = get(formPaths, [browser.name, browser.channel], formFullAppPath)

  const exePaths = formFullAppPathFn(browser.name)

  debugVerbose('looking at possible paths... %o', { browser, exePaths })

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
      debugVerbose('found %s ? %o', path, { exists })

      if (!exists) {
        return tryNextExePath()
      }

      // Use module.exports.getVersionString here, rather than our local reference
      // to that variable so that the tests can easily mock it
      return module.exports.getVersionString(path).then((version) => {
        debug('got version string for %s: %o', browser.name, { exePath, version })

        return {
          name: browser.name,
          version,
          path: exePath,
        } as FoundBrowser
      })
    })
    .catch((err) => {
      debug('error while looking up exe, trying next exePath %o', { exePath, exePaths, err })

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

  try {
    return Promise.resolve(winVersionInfo(path).FileVersion)
  } catch (err) {
    return Promise.reject(err)
  }
}

export function getVersionNumber (version: string) {
  if (version.indexOf('Version=') > -1) {
    const split = version.split('=')

    if (split[1]) {
      return split[1]
    }
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
