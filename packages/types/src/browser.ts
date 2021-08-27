export const BROWSER_FAMILY = ['chromium', 'firefox'] as const

type BrowserName = 'electron' | 'chrome' | 'chromium' | 'firefox' | string

export type BrowserChannel = 'stable' | 'canary' | 'beta' | 'dev' | 'nightly' | string

export type BrowserFamily = typeof BROWSER_FAMILY[number]

export type PlatformName = 'darwin' | 'linux' | 'win32'

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
  majorVersion?: string
  /** is this a user-supplied browser? */
  custom?: boolean
  unsupportedVersion?: boolean
}

/**
 * Partial browser object, returned by an OS-specific launcher helper.
 */
export type DetectedBrowser = Pick<FoundBrowser, 'name' | 'path' | 'version'>
