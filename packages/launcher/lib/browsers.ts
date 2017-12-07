import { log } from './log'
import { find, map } from 'lodash'
import * as cp from 'child_process'
import { Browser, FoundBrowser, BrowserNotFoundError } from './types'

const browserNotFoundErr = (
  browsers: FoundBrowser[],
  name: string
): BrowserNotFoundError => {
  const available = map(browsers, 'name').join(', ')

  const err: BrowserNotFoundError = new Error(
    `Browser: '${name}' not found. Available browsers are: [${available}]`
  ) as BrowserNotFoundError
  err.specificBrowserNotFound = true
  return err
}

// since we are limited to Chrome-like browsers we can probably
// extract its version from <name --version> call
export const chromeLikeVersionRegex: RegExp = /([\d\.]+)/

/** list of the browsers we can detect and use by default */
export const browsers: Browser[] = [
  {
    name: 'chrome',
    displayName: 'Chrome',
    versionRegex: /Google Chrome (\S+)/,
    profile: true,
    binary: 'google-chrome'
  },
  {
    name: 'chromium',
    displayName: 'Chromium',
    versionRegex: /Chromium (\S+)/,
    profile: true,
    binary: 'chromium-browser'
  },
  {
    name: 'canary',
    displayName: 'Canary',
    versionRegex: /Google Chrome Canary (\S+)/,
    profile: true,
    binary: 'google-chrome-canary'
  }
]

export type SpawnFunction = (
  programName: string,
  args?: string[],
  options?: cp.SpawnOptions
) => cp.ChildProcess

/**
 * Starts a browser by name and opens URL if given one
 *
 * @export
 * @param {FoundBrowser[]} browsers List of discovered browsers
 * @param {string} name Name of the browser to launch
 * @param {string} [url] Url to launch
 * @param {string[]} [args=[]] Additional browser CLI arguments
 * @param {SpawnFunction} [spawn=cp.spawn] Spawn function (for mocking)
 * @returns {cp.ChildProcess}
 */
export function launchBrowser(
  browsers: FoundBrowser[],
  name: string,
  url?: string,
  args: string[] = [],
  spawn: SpawnFunction = cp.spawn
) {
  log('launching browser %s', name)
  if (url) {
    log('to open url %s', url)
  } else {
    log('without an url')
  }
  const browser = find(browsers, { name })

  if (!browser) {
    log('cannot find browser with name %s', name)
    throw browserNotFoundErr(browsers, name)
  }

  if (!browser.path) {
    log('browser %s is missing path', name)
    throw new Error(`Found browser ${name} is missing path`)
  }

  if (url) {
    args = [url].concat(args)
  }

  log(
    'spawning browser %s with %d args "%s"',
    browser.path,
    args.length,
    args.join(' ')
  )
  // TODO grab the output in order to better diagnose possible errors
  return spawn(browser.path, args, { stdio: 'ignore' })
}
