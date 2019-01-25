export type BrowserName = 'chrome' | 'chromium' | 'canary' | string

export type PlatformName = 'darwin' | 'linux' | 'win32'

/**
 * Represents a typical browser to try to detect and turn into a `FoundBrowser`.
 */
export type Browser = {
  /** short browser name */
  name: BrowserName
  /** Optional display name */
  displayName: string
  /** RegExp to use to extract version from something like "Google Chrome 58.0.3029.110" */
  versionRegex: RegExp
  profile: boolean
  /** A single binary name or array of binary names for this browser. Not used on Windows. */
  binary: string | string[]
  path?: string
}

/**
 * Represents a real browser that exists on the user's system.
 */
export type FoundBrowser = Browser & {
  name: string
  path: string
  version: string
  majorVersion: string
  page?: string
}

interface ExtraLauncherMethods {
  update: Function
  detect: Function
}

type LauncherLaunch = (browsers?: any[]) => Promise<any>

export type LauncherApi = LauncherLaunch & ExtraLauncherMethods

// all common type definition for this module

export type NotInstalledError = Error & { notInstalled: boolean }

export type BrowserNotFoundError = Error & { specificBrowserNotFound: boolean }
