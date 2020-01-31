import { log } from './log'
import * as cp from 'child_process'
import { Browser, FoundBrowser } from './types'

const firefoxInfo = 'Firefox support is currently in beta! You can help us continue to improve the Cypress + Firefox experience by [reporting any issues you find](https://on.cypress.io/new-issue).'

/** list of the browsers we can detect and use by default */
export const browsers: Browser[] = [
  {
    name: 'chrome',
    family: 'chromium',
    channel: 'stable',
    displayName: 'Chrome',
    versionRegex: /Google Chrome (\S+)/,
    profile: true,
    binary: ['google-chrome', 'chrome', 'google-chrome-stable'],
  },
  {
    name: 'chromium',
    family: 'chromium',
    // technically Chromium is always in development
    channel: 'stable',
    displayName: 'Chromium',
    versionRegex: /Chromium (\S+)/,
    profile: true,
    binary: ['chromium-browser', 'chromium'],
  },
  {
    name: 'chrome',
    family: 'chromium',
    channel: 'canary',
    displayName: 'Canary',
    versionRegex: /Google Chrome Canary (\S+)/,
    profile: true,
    binary: 'google-chrome-canary',
  },
  {
    name: 'firefox',
    family: 'firefox',
    channel: 'stable',
    displayName: 'Firefox',
    info: firefoxInfo,
    versionRegex: /Firefox (\S+)/,
    profile: true,
    binary: 'firefox',
  },
  {
    name: 'firefox',
    family: 'firefox',
    channel: 'dev',
    displayName: 'Firefox Developer Edition',
    info: firefoxInfo,
    versionRegex: /Firefox Developer Edition (\S+)/,
    profile: true,
    binary: 'firefox-developer-edition',
  },
  {
    name: 'firefox',
    family: 'firefox',
    channel: 'nightly',
    displayName: 'Firefox Nightly',
    info: firefoxInfo,
    versionRegex: /Firefox Nightly (\S+)/,
    profile: true,
    binary: 'firefox-nightly',
  },
]

/** starts a found browser and opens URL if given one */
export function launch (
  browser: FoundBrowser,
  url: string,
  args: string[] = []
) {
  log('launching browser %o to open %s', browser, url)

  if (!browser.path) {
    throw new Error(`Browser ${browser.name} is missing path`)
  }

  if (url) {
    args = [url].concat(args)
  }

  log('spawning browser %o with args %s', browser, args.join(' '))

  return cp.spawn(browser.path, args, { stdio: 'ignore' })
}
