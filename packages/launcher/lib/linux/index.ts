import { log } from '../log'
import { partial, trim, tap, prop } from 'ramda'
import { FoundBrowser, Browser } from '../types'
import { notInstalledErr } from '../errors'
import { utils } from '../utils'

function getLinuxBrowser (
  name: string,
  binary: string,
  versionRegex: RegExp,
): Promise<FoundBrowser> {
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

  return getVersionString(binary)
  .then(getVersion)
  .then((version: string) => {
    return {
      name,
      version,
      path: binary,
    } as FoundBrowser
  })
  .catch(logAndThrowError)
}

export function getVersionString (path: string) {
  log('finding version string using command "%s --version"', path)

  return utils.execa(path, ['--version'])
  .then(prop('stdout'))
  .then(trim)
  .then(tap(partial(log, ['stdout: "%s"'])))
}

export function detect (browser: Browser) {
  return getLinuxBrowser(
    browser.name,
    browser.binary as string,
    browser.versionRegex,
  )
}
