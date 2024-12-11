const disabledFeatures = [
  // Disable manual option and popup prompt of Chrome translation
  // https://github.com/cypress-io/cypress/issues/28225
  'Translate',
  // Disables "Enhanced ad privacy in Chrome" dialog
  // https://github.com/cypress-io/cypress/issues/29199
  'PrivacySandboxSettings4',
  // Uncomment to force the deprecation of unload events
  // 'DeprecateUnloadByUserAndOrigin',
]

// Common Chrome Flags for Automation
// https://github.com/GoogleChrome/chrome-launcher/blob/master/docs/chrome-flags-for-tools.md
const DEFAULT_FLAGS = [
  'test-type',
  'ignore-certificate-errors',
  'start-maximized',
  'silent-debugger-extension-api',
  'no-default-browser-check',
  'no-first-run',
  'noerrdialogs',
  'enable-fixed-layout',
  'disable-popup-blocking',
  'disable-password-generation',
  'disable-single-click-autofill',
  'disable-prompt-on-repos',
  'disable-background-timer-throttling',
  'disable-renderer-backgrounding',
  'disable-renderer-throttling',
  'disable-backgrounding-occluded-windows',
  'disable-restore-session-state',
  'disable-new-profile-management',
  'disable-new-avatar-menu',
  'allow-insecure-localhost',
  'reduce-security-for-testing',
  'enable-automation',
  'disable-print-preview',
  'disable-component-extensions-with-background-pages',
  'disable-infobars',
  'disable-device-discovery-notifications',

  // https://github.com/cypress-io/cypress/issues/2376
  'autoplay-policy=no-user-gesture-required',

  // http://www.chromium.org/Home/chromium-security/site-isolation
  // https://github.com/electron/electron/issues/18214
  // https://github.com/cypress-io/cypress/issues/1951
  'disable-site-isolation-trials',

  // the following come from chromedriver
  // https://code.google.com/p/chromium/codesearch#chromium/src/chrome/test/chromedriver/chrome_launcher.cc&sq=package:chromium&l=70
  'metrics-recording-only',
  'disable-prompt-on-repost',
  'disable-hang-monitor',
  'disable-sync',
  // this flag is causing throttling of XHR callbacks for
  // as much as 30 seconds. If you VNC in and open dev tools or
  // click on a button, it'll "instantly" work. with this
  // option enabled, it will time out some of our tests in circle
  // "disable-background-networking"
  'disable-web-resources',
  'safebrowsing-disable-download-protection',
  'disable-client-side-phishing-detection',
  'disable-component-update',
  // Simulate when chrome needs an update.
  // This prevents an 'update' from displaying til the given date
  `simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT'`,
  'disable-default-apps',

  `disable-features=${disabledFeatures.join(',')}`,

  // These flags are for webcam/WebRTC testing
  // https://github.com/cypress-io/cypress/issues/2704
  'use-fake-ui-for-media-stream',
  'use-fake-device-for-media-stream',

  // prevent navigation throttling when navigating in the browser rapid fire
  // https://github.com/cypress-io/cypress/issues/5132
  // https://github.com/cypress-io/cypress/pull/20271
  'disable-ipc-flooding-protection',

  // misc. options puppeteer passes
  // https://github.com/cypress-io/cypress/issues/3633
  'disable-backgrounding-occluded-window',
  'disable-breakpad',
  'password-store=basic',
  'use-mock-keychain',

  // write shared memory files into '/tmp' instead of '/dev/shm'
  // https://github.com/cypress-io/cypress/issues/5336
  // https://github.com/cypress-io/cypress/issues/15814
  'disable-dev-shm-usage',

  // enable precise memory info so performance.memory returns more accurate values
  'enable-precise-memory-info',

  // Uncomment to force the deprecation of upload events
  //`--enable-features=PermissionsPolicyUnload,DeprecateUnload`,
]

// prepend -- to each flag and concatenate them together
export const formatChromeFlags = (flags) => flags.map((flag) => `--${flag}`)

// create an array of objects with name and value properties
// for each flag, splitting the flag on the first = character
export const formatElectronFlags = (flags) => {
  return flags.map((flag) => {
    const [name, value] = flag.split('=')

    return value ? { name, value } : { name }
  })
}

export const DEFAULT_CHROME_FLAGS = formatChromeFlags(DEFAULT_FLAGS)

export const DEFAULT_ELECTRON_FLAGS = formatElectronFlags(DEFAULT_CHROME_FLAGS)
