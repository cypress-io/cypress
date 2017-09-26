import { log } from '../log'
import { FoundBrowser, Browser, NotInstalledError } from '../types'
import * as Promise from 'bluebird'

const notInstalledErr = (name: string) => {
  const err: NotInstalledError = new Error(
    `Browser not installed: ${name}`
  ) as NotInstalledError
  err.notInstalled = true
  return err
}

function getWindowsBrowser(
  name: string,
  binary: string,
  versionRegex: RegExp
): Promise<FoundBrowser> {
  log(
    'Cannot detect windows browser yet "%s" binary "%s" version "%s"',
    name,
    binary,
    versionRegex
  )
  return Promise.reject(notInstalledErr(name))
}

export function detectBrowserWindows(browser: Browser) {
  return getWindowsBrowser(browser.name, browser.binary, browser.versionRegex)
}
