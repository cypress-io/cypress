import { log } from './log'
import { find, map, pick } from 'lodash'
import * as cp from 'child_process'
import { Browser, FoundBrowser, BrowserNotFoundError } from './types'

const browserNotFoundErr = (
  browsers: FoundBrowser[],
  browser: FoundBrowser
): BrowserNotFoundError => {
  const available = map(browsers, 'name').join(', ')

  const err: BrowserNotFoundError = new Error(
    `Browser: '${
      browser.name
    }' not found. Available browsers are: [${available}]`
  ) as BrowserNotFoundError
  err.specificBrowserNotFound = true
  return err
}

/** list of the browsers we can detect and use by default */
export const browsers: Browser[] = [
  {
    name: 'chrome',
    displayName: 'Chrome',
    versionRegex: /Google Chrome (\S+)/,
    profile: true,
    binary: ['google-chrome', 'chrome', 'google-chrome-stable']
  },
  {
    name: 'chromium',
    displayName: 'Chromium',
    versionRegex: /Chromium (\S+)/,
    profile: true,
    binary: ['chromium-browser', 'chromium']
  },
  {
    name: 'canary',
    displayName: 'Canary',
    versionRegex: /Google Chrome Canary (\S+)/,
    profile: true,
    binary: 'google-chrome-canary'
  }
]

/** starts a found browser and opens URL if given one */
export function launch(
  browsers: FoundBrowser[],
  browser: FoundBrowser,
  url?: string,
  args: string[] = []
) {
  log('launching browser %o to open %s', browser, url)

  const predicate = pick(browser, ['name', 'path', 'version'])
  if (browsers && !find(browsers, predicate)) {
    throw browserNotFoundErr(browsers, browser)
  }

  if (!browser.path) {
    throw new Error(`Browser ${browser.name} is missing path`)
  }

  if (url) {
    args = [url].concat(args)
  }

  log('spawning browser %o with args %s', browser, args.join(' '))
  return cp.spawn(browser.path, args, { stdio: 'ignore' })
}
