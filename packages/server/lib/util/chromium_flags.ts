const disabledFeatures = [
  // Uncomment to force the deprecation of unload events
  // 'DeprecateUnloadByUserAndOrigin',

  // Hide toolbar button that opens dialog for controlling media sessions.
  'GlobalMediaControls',

  // Disables the Interest Feed Content Suggestions,
  // which is a feature that shows content suggestions based on the user's interests.
  // https://www.google.com/interests/saved
  'InterestFeedContentSuggestions',

  // Hides the Lens feature in the URL address bar.
  'LensOverlay',

  // Avoid the startup dialog for _Do you want the application 'Chromium.app' to accept incoming network connections?_.
  // Also disables the Chrome Media Router https://chromium.googlesource.com/chromium/src/+/HEAD/docs/media/media_router.md
  // which creates background networking activity to discover cast targets. A superset of disabling `DialMediaRouteProvider`.
  'MediaRouter',

  // Disable the Chrome Optimization Guide https://chromium.googlesource.com/chromium/src/+/HEAD/components/optimization_guide/)
  // and networking with its service API
  'OptimizationHints',

  // Disables "Enhanced ad privacy in Chrome" dialog
  // https://github.com/cypress-io/cypress/issues/29199
  'PrivacySandboxSettings4',

  // Disable Chrome's Local Network Access (LNA) checks, which began rolling out
  // in Chrome 141. LNA gates requests from a page to local/private/loopback
  // addresses behind a `local-network-access` permission prompt. In an automated
  // browser the prompt cannot be answered, so cross-origin requests to local dev
  // servers (e.g. login/redirect/OAuth flows) are blocked, breaking tests that
  // worked in Chrome 140. Cypress fully controls the browser under test, so it's
  // safe to opt out of these checks entirely.
  // https://github.com/cypress-io/cypress/issues/32708
  // https://developer.chrome.com/blog/local-network-access
  'LocalNetworkAccessChecks',
  'LocalNetworkAccessChecksWebRTC',

  // Disable manual option and popup prompt of Chrome translation
  // https://github.com/cypress-io/cypress/issues/28225
  'Translate',
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
  // Disables Domain Reliability Monitoring, which tracks whether the browser has
  // difficulty contacting Google-owned sites and uploads reports to Google.
  'disable-domain-reliability',
  // Disable field trial tests configured in fieldtrial_testing_config.json.
  'disable-field-trial-config',
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

export const DEFAULT_ELECTRON_FLAGS = [
  ...formatElectronFlags(DEFAULT_CHROME_FLAGS),
  // NOTE: Can likely be removed with Electron upgrade to 37+.
  // @see https://github.com/electron/electron/issues/46538
  // @see https://github.com/cypress-io/cypress/issues/32361
  ...formatElectronFlags(['--gtk-version=3']),
]
