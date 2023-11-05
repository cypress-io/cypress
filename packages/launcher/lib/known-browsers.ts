import type { Browser, BrowserValidatorResult, FoundBrowser } from '@packages/types'

// Chrome started exposing CDP 1.3 in 64
export const MIN_CHROME_VERSION = 64

// Firefox started exposing CDP in 86
export const MIN_FIREFOX_VERSION = 86

// Edge switched to Blink in 79
export const MIN_EDGE_VERSION = 79

// Compares a detected browser's major version to its minimum supported version
// to determine if the browser is supported by Cypress.
export const validateMinVersion = (browser: FoundBrowser): BrowserValidatorResult => {
  const minSupportedVersion = browser.minSupportedVersion
  const majorVersion = browser.majorVersion

  if (majorVersion && minSupportedVersion && parseInt(majorVersion) < minSupportedVersion) {
    return {
      isSupported: false,
      warningMessage: `Cypress does not support running ${browser.displayName} version ${majorVersion}. To use ${browser.displayName} with Cypress, install a version of ${browser.displayName} newer than or equal to ${minSupportedVersion}.`,
    }
  }

  return {
    isSupported: true,
  }
}

/** list of the browsers we can detect and use by default */
export const knownBrowsers: Browser[] = [
  {
    name: 'chrome',
    family: 'chromium',
    channel: 'stable',
    displayName: 'Chrome',
    // Chrome for testing can be any stable, beta, dev or canary version
    versionRegex: /Google Chrome (?:for Testing )?(\S+)/m,
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
    validator: (browser: FoundBrowser, platform: NodeJS.Platform): BrowserValidatorResult => {
      // Firefox 101 and 102 on Windows features a bug that results in Cypress being unable
      // to connect to the launched browser. A fix was first released in stable 103.
      // See https://github.com/cypress-io/cypress/issues/22086 for related info.

      if (platform === 'win32' && browser.majorVersion && ['101', '102'].includes(browser.majorVersion)) {
        return {
          isSupported: false,
          warningMessage: `Cypress does not support running ${browser.displayName} version ${browser.majorVersion} on Windows due to a blocking bug in ${browser.displayName}. To use ${browser.displayName} with Cypress on Windows, install version 103 or newer.`,
        }
      }

      return validateMinVersion(browser)
    },
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
    versionRegex: /Microsoft Edge (\S+)/mi,
    binary: ['edge', 'microsoft-edge'],
    minSupportedVersion: MIN_EDGE_VERSION,
  },
  {
    name: 'edge',
    family: 'chromium',
    channel: 'canary',
    displayName: 'Edge Canary',
    versionRegex: /Microsoft Edge.+?(\S*(?= canary)|(?<=canary )\S*)/mi,
    binary: ['edge-canary', 'microsoft-edge-canary'],
    minSupportedVersion: MIN_EDGE_VERSION,
  },
  {
    name: 'edge',
    family: 'chromium',
    channel: 'beta',
    displayName: 'Edge Beta',
    versionRegex: /Microsoft Edge.+?(\S*(?= beta)|(?<=beta )\S*)/mi,
    binary: ['edge-beta', 'microsoft-edge-beta'],
    minSupportedVersion: MIN_EDGE_VERSION,
  },
  {
    name: 'edge',
    family: 'chromium',
    channel: 'dev',
    displayName: 'Edge Dev',
    versionRegex: /Microsoft Edge.+?(\S*(?= dev)|(?<=dev )\S*)/mi,
    binary: ['edge-dev', 'microsoft-edge-dev'],
    minSupportedVersion: MIN_EDGE_VERSION,
  },
]
