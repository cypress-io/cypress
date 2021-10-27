import { log } from './log'
import * as cp from 'child_process'
import type { Browser, FoundBrowser } from './types'

// Chrome started exposing CDP 1.3 in 64
const MIN_CHROME_VERSION = 64
// Firefox started exposing CDP in 86
const MIN_FIREFOX_VERSION = 86
// Edge switched to Blink in 79
const MIN_EDGE_VERSION = 79

/** list of the browsers we can detect and use by default */
export const browsers: Browser[] = [
  {
    name: 'chrome',
    family: 'chromium',
    channel: 'stable',
    displayName: 'Chrome',
    versionRegex: /Google Chrome (\S+)/m,
    binary: ['google-chrome', 'chrome', 'google-chrome-stable'],
    minSupportedVersion: MIN_CHROME_VERSION,
  },
  {
    name: 'chromium',
    family: 'chromium',
    // technically Chromium is always in development
    channel: 'stable',
    displayName: 'Chromium',
    versionRegex: /Chromium (\S+)/m,
    binary: ['chromium-browser', 'chromium'],
    minSupportedVersion: MIN_CHROME_VERSION,
  },
  {
    name: 'chrome',
    family: 'chromium',
    channel: 'beta',
    displayName: 'Chrome Beta',
    versionRegex: /Google Chrome (\S+) beta/m,
    binary: 'google-chrome-beta',
    minSupportedVersion: MIN_CHROME_VERSION,
  },
  {
    name: 'chrome',
    family: 'chromium',
    channel: 'canary',
    displayName: 'Canary',
    versionRegex: /Google Chrome Canary (\S+)/m,
    binary: 'google-chrome-canary',
    minSupportedVersion: MIN_CHROME_VERSION,
  },
  {
    name: 'firefox',
    family: 'firefox',
    channel: 'stable',
    displayName: 'Firefox',
    // Mozilla Firefox 70.0.1
    versionRegex: /^Mozilla Firefox ([^\sab]+)$/m,
    binary: 'firefox',
    minSupportedVersion: MIN_FIREFOX_VERSION,
  },
  {
    name: 'firefox',
    family: 'firefox',
    channel: 'dev',
    displayName: 'Firefox Developer Edition',
    // Mozilla Firefox 73.0b12
    versionRegex: /^Mozilla Firefox (\S+b\S*)$/m,
    // ubuntu PPAs install it as firefox
    binary: ['firefox-developer-edition', 'firefox'],
    minSupportedVersion: MIN_FIREFOX_VERSION,
  },
  {
    name: 'firefox',
    family: 'firefox',
    channel: 'nightly',
    displayName: 'Firefox Nightly',
    // Mozilla Firefox 74.0a1
    versionRegex: /^Mozilla Firefox (\S+a\S*)$/m,
    // ubuntu PPAs install it as firefox-trunk
    binary: ['firefox-nightly', 'firefox-trunk'],
    minSupportedVersion: MIN_FIREFOX_VERSION,
  },
  {
    name: 'edge',
    family: 'chromium',
    channel: 'stable',
    displayName: 'Edge',
    versionRegex: /Microsoft Edge (\S+)/m,
    binary: ['edge', 'microsoft-edge'],
    minSupportedVersion: MIN_EDGE_VERSION,
  },
  {
    name: 'edge',
    family: 'chromium',
    channel: 'canary',
    displayName: 'Edge Canary',
    versionRegex: /Microsoft Edge Canary (\S+)/m,
    binary: 'edge-canary',
    minSupportedVersion: MIN_EDGE_VERSION,
  },
  {
    name: 'edge',
    family: 'chromium',
    channel: 'beta',
    displayName: 'Edge Beta',
    versionRegex: /Microsoft Edge Beta (\S+)/m,
    binary: 'edge-beta',
    minSupportedVersion: MIN_EDGE_VERSION,
  },
  {
    name: 'edge',
    family: 'chromium',
    channel: 'dev',
    displayName: 'Edge Dev',
    versionRegex: /Microsoft Edge Dev (\S+)/m,
    binary: ['edge-dev', 'microsoft-edge-dev'],
    minSupportedVersion: MIN_EDGE_VERSION,
  },
]

/** starts a found browser and opens URL if given one */
export function launch (
  browser: FoundBrowser,
  url: string,
  args: string[] = [],
  defaultBrowserEnv = {},
) {
  log('launching browser %o', { browser, url })

  if (!browser.path) {
    throw new Error(`Browser ${browser.name} is missing path`)
  }

  if (url) {
    args = [url].concat(args)
  }

  log('spawning browser with args %o', { args })

  // allow setting default env vars such as MOZ_HEADLESS_WIDTH
  // but only if it's not already set by the environment
  const env = Object.assign({}, defaultBrowserEnv, process.env)

  const proc = cp.spawn(browser.path, args, { stdio: ['ignore', 'pipe', 'pipe'], env })

  proc.stdout.on('data', (buf) => {
    log('%s stdout: %s', browser.name, String(buf).trim())
  })

  proc.stderr.on('data', (buf) => {
    log('%s stderr: %s', browser.name, String(buf).trim())
  })

  proc.on('exit', (code, signal) => {
    log('%s exited: %o', browser.name, { code, signal })
  })

  return proc
}
