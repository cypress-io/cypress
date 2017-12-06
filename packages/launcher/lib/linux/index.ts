import { log } from '../log'
import { trim, tap } from 'ramda'
import { FoundBrowser, Browser, NotInstalledError } from '../types'
import * as execa from 'execa'

const notInstalledErr = (name: string) => {
  const err: NotInstalledError = new Error(
    `Browser not installed: ${name}`
  ) as NotInstalledError
  err.notInstalled = true
  throw err
}

function getLinuxBrowser(
  name: string,
  binary: string,
  versionRegex: RegExp
): Promise<FoundBrowser> {
  const getVersion = (stdout: string) => {
    const m = versionRegex.exec(stdout)
    if (m) {
      return m[1]
    }
    log(
      'Could not extract version from %s using regex %s',
      stdout,
      versionRegex
    )
    return notInstalledErr(binary)
  }

  const returnError = (err: Error) => {
    log('Could not detect browser %s', err.message)
    return notInstalledErr(binary)
  }

  const cmd = `${binary} --version`
  log('looking using command "%s"', cmd)
  return execa
    .shell(cmd)
    .then(result => result.stdout)
    .then(trim)
    .then(tap(log))
    .then(getVersion)
    .then((version: string) => {
      return {
        name,
        version,
        path: binary
      }
    })
    .catch(returnError)
}

export function detectBrowserLinux(browser: Browser) {
  return getLinuxBrowser(browser.name, browser.binary, browser.versionRegex)
}
