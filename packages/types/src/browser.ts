export const BROWSER_FAMILY = ['chromium', 'firefox', 'webkit']

type BrowserName = 'electron' | 'chrome' | 'chromium' | 'firefox' | 'webkit' | string

export type BrowserChannel = 'stable' | 'canary' | 'beta' | 'dev' | 'nightly' | string

export type BrowserFamily = typeof BROWSER_FAMILY[number]

export type BrowserValidatorResult = {
  // whether or not the browser is supported by Cypress
  isSupported: boolean
  // optional warning message that will be shown in the GUI
  warningMessage?: string
}

export type BrowserValidator = (browser: FoundBrowser, platform: NodeJS.Platform) => BrowserValidatorResult

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
  /** if set, is called to determine if found browser is supported by Cypress */
  validator?: BrowserValidator
}

/**
 * Represents a real browser that exists on the user's system.
 */
export type FoundBrowser = Omit<Browser, 'versionRegex' | 'binary' | 'validator'> & {
  path: string
  version: string
  majorVersion?: string | null
  /** is this a user-supplied browser? */
  custom?: boolean
  unsupportedVersion?: boolean
  disabled?: boolean
}

/**
 * Partial browser object, returned by an OS-specific launcher helper.
 */
export type DetectedBrowser = Pick<FoundBrowser, 'name' | 'path' | 'version'>

export const BROWSER_STATUS = ['closed', 'opening', 'open'] as const

export type BrowserStatus = typeof BROWSER_STATUS[number]
