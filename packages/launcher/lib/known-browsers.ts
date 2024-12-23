import type { Browser, BrowserValidatorResult, FoundBrowser } from '@packages/types'

/** list of the browsers we can detect and use by default */
export const knownBrowsers: Browser[] = [
  {
    name: 'chrome',
    family: 'chromium',
    channel: 'stable',
    displayName: 'Chrome',
    versionRegex: /Google Chrome(?! for Testing) (\S+)/m,
    binary: ['google-chrome', 'chrome', 'google-chrome-stable'],
    validator: (browser: FoundBrowser, platform: NodeJS.Platform): BrowserValidatorResult => {
      // a validator method can be defined to mark a browser as unsupported
      // the example below shows a previous method we defined, but is not currently used
      // if (platform === 'win32' && browser.majorVersion && ['101', '102'].includes(browser.majorVersion)) {
      //   return {
      //     isSupported: false,
      //     warningMessage: `Cypress does not support running ${browser.displayName} version ${browser.majorVersion} on Windows due to a blocking bug in ${browser.displayName}. To use ${browser.displayName} with Cypress on Windows, install version 103 or newer.`,
      //   }
      // }

      return {
        isSupported: true,
      }
    },
  },
  {
    name: 'chrome',
    family: 'chromium',
    channel: 'beta',
    displayName: 'Chrome Beta',
    versionRegex: /Google Chrome (\S+) beta/m,
    binary: 'google-chrome-beta',
  },
  {
    name: 'chrome',
    family: 'chromium',
    channel: 'canary',
    displayName: 'Chrome Canary',
    versionRegex: /Google Chrome Canary (\S+)/m,
    binary: 'google-chrome-canary',
  },
  {
    name: 'chrome-for-testing',
    family: 'chromium',
    channel: 'stable',
    displayName: 'Chrome for Testing',
    versionRegex: /Google Chrome for Testing (\S+)/m,
    binary: 'chrome',
  },
  {
    name: 'chromium',
    family: 'chromium',
    // technically Chromium is always in development
    channel: 'stable',
    displayName: 'Chromium',
    versionRegex: /Chromium (\S+)/m,
    binary: ['chromium-browser', 'chromium'],
  },
  {
    name: 'firefox',
    family: 'firefox',
    channel: 'stable',
    displayName: 'Firefox',
    // Mozilla Firefox 70.0.1
    versionRegex: /^Mozilla Firefox ([^\sab]+)$/m,
    binary: 'firefox',
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
  },
  {
    name: 'edge',
    family: 'chromium',
    channel: 'stable',
    displayName: 'Edge',
    versionRegex: /Microsoft Edge (\S+)/mi,
    binary: ['edge', 'microsoft-edge'],
  },
  {
    name: 'edge',
    family: 'chromium',
    channel: 'beta',
    displayName: 'Edge Beta',
    versionRegex: /Microsoft Edge.+?(\S*(?= beta)|(?<=beta )\S*)/mi,
    binary: ['edge-beta', 'microsoft-edge-beta'],
  },
  {
    name: 'edge',
    family: 'chromium',
    channel: 'canary',
    displayName: 'Edge Canary',
    versionRegex: /Microsoft Edge.+?(\S*(?= canary)|(?<=canary )\S*)/mi,
    binary: ['edge-canary', 'microsoft-edge-canary'],
  },
  {
    name: 'edge',
    family: 'chromium',
    channel: 'dev',
    displayName: 'Edge Dev',
    versionRegex: /Microsoft Edge.+?(\S*(?= dev)|(?<=dev )\S*)/mi,
    binary: ['edge-dev', 'microsoft-edge-dev'],
  },
]
