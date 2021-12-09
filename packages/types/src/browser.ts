export const BROWSER_FAMILY = ['chromium', 'firefox'] as const

type BrowserName = 'electron' | 'chrome' | 'chromium' | 'firefox' | string

export type BrowserChannel = 'stable' | 'canary' | 'beta' | 'dev' | 'nightly' | string

export type BrowserFamily = typeof BROWSER_FAMILY[number]

/**
 * Represents a typical browser to try to detect and turn into a `FoundBrowser`.
 */
export type Browser = {
  /**
   * Short browser name.
   */
  name: BrowserName
  /**
   * The underlying engine for this browser.
   */
  family: BrowserFamily
  /**
   * The release channel of the browser.
   */
  channel: BrowserChannel
  /**
   * Human-readable browser name.
   */
  displayName: string
  /** RegExp to use to extract version from something like "Google Chrome 58.0.3029.110" */
  versionRegex: RegExp
  /** If set, this is the base path that will be used for setting userDataDir. Useful for creating profiles in snap confinement. */
  profilePath?: string
  /** A single binary name or array of binary names for this browser. Not used on Windows. */
  binary: string | string[]
  /** optional warning that will be shown in the GUI */
  warning?: string
  /** optional info that will be shown in the GUI */
  info?: string
  /** if set, the majorVersion must be >= this to be run in Cypress */
  minSupportedVersion?: number
}

/**
 * Represents a real browser that exists on the user's system.
 */
export type FoundBrowser = Omit<Browser, 'versionRegex' | 'binary'> & {
  path: string
  version: string
  majorVersion?: string | null
  /** is this a user-supplied browser? */
  custom?: boolean
  unsupportedVersion?: boolean
}

/**
 * Partial browser object, returned by an OS-specific launcher helper.
 */
export type DetectedBrowser = Pick<FoundBrowser, 'name' | 'path' | 'version'>

// Chrome started exposing CDP 1.3 in 64
export const MIN_CHROME_VERSION = 64

// Firefox started exposing CDP in 86
export const MIN_FIREFOX_VERSION = 86

// Edge switched to Blink in 79
export const MIN_EDGE_VERSION = 79

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
