import {log} from '../log'
import {prop, trim} from 'ramda'
import {FoundBrowser, Browser, NotInstalledError} from '../types'
import execa = require('execa')

const notInstalledErr = (name: string) => {
  const err: NotInstalledError =
    new Error(`Browser not installed: ${name}`) as NotInstalledError
  err.notInstalled = true
  throw err
}

function getLinuxBrowser (name: string, binary: string, versionRegex: RegExp): Promise<FoundBrowser> {
  const getVersion = (stdout: string) => {
    const m = versionRegex.exec(stdout)
    if (m) {
      return m[1]
    }
    return notInstalledErr(binary)
  }

  const cmd = `${binary} --version`
  log('looking using command "%s"', cmd)
  return execa.shell(cmd)
    .then(prop('stdout'))
    .then(trim)
    .then(getVersion)
    .then((version) => {
      return {
        name,
        version,
        path: binary
      }
    })
    .catch(() => notInstalledErr(binary))
}

export function detectBrowserLinux (browser: Browser) {
  return getLinuxBrowser(browser.name, browser.binary, browser.versionRegex)
}
