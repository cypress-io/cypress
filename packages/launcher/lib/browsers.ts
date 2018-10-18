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

/** starts a browser by name and opens URL if given one */
export function launch(
  browsers: FoundBrowser[],
  name: string,
  url?: string,
  args: string[] = []
) {
  log('launching browser %s to open %s', name, url)
  const browser = find(browsers, { name })

  if (!browser) {
    throw browserNotFoundErr(browsers, name)
  }

  if (!browser.path) {
    throw new Error(`Found browser ${name} is missing path`)
  }

  if (url) {
    args = [url].concat(args)
  }

  log('spawning browser %s with args %s', browser.path, args.join(' '))
  return cp.spawn(browser.path, args, { stdio: 'ignore' })
}
