import { log } from '../log'
import type { FoundBrowser, Browser, PathData } from '../types'
import { notInstalledErr } from '../errors'
import { utils } from '../utils'
import os from 'os'
import path from 'path'
import Bluebird from 'bluebird'

function getLinuxBrowser (
  name: string,
  binary: string,
  versionRegex: RegExp,
): Promise<FoundBrowser> {
  const foundBrowser: any = {
    name,
    path: binary,
  }

  const getVersion = (stdout: string) => {
    const m = versionRegex.exec(stdout)

    if (m) {
      return m[1]
    }

    log(
      'Could not extract version from stdout using regex: %o', {
        stdout,
        versionRegex,
      },
    )

    throw notInstalledErr(binary)
  }

  const logAndThrowError = (err: Error) => {
    log(
      'Received error detecting browser binary: "%s" with error:',
      binary,
      err.message,
    )

    throw notInstalledErr(binary)
  }

  const maybeSetSnapProfilePath = (versionString: string) => {
    if (os.platform() === 'linux' && name === 'chromium' && versionString.endsWith('snap')) {
      // when running as a snap, chromium can only write to certain directories
      // @see https://github.com/cypress-io/cypress/issues/7020
      foundBrowser.profilePath = path.join(os.homedir(), 'snap', 'chromium', 'current')
    }
  }

  return getVersionString(binary)
  .tap(maybeSetSnapProfilePath)
  .then(getVersion)
  .then((version: string): FoundBrowser => {
    foundBrowser.version = version

    return foundBrowser
  })
  .catch(logAndThrowError)
}

export function getVersionString (path: string) {
  log('finding version string using command "%s --version"', path)

  return Bluebird.resolve(utils.getOutput(path, ['--version']))
  .timeout(30000, `Timed out after 30 seconds getting browser version for ${path}`)
  .then((val) => val.stdout)
  .then((val) => val.trim())
  .then((val) => {
    log('stdout: %s', val)

    return val
  })
}

export function getVersionNumber (version: string, browser: Browser) {
  const regexExec = browser.versionRegex.exec(version) as Array<string>

  return regexExec ? regexExec[1] : version
}

export function getPathData (pathStr: string): PathData {
  return { path: pathStr }
}

export function detect (browser: Browser) {
  return getLinuxBrowser(
    browser.name,
    browser.binary as string,
    browser.versionRegex,
  )
}
