import { ChildProcess } from 'child_process'
import * as Bluebird from 'bluebird'

export type BrowserName = 'chrome' | 'chromium' | 'canary' | string

export type BrowserFamily = 'chrome' | 'electron'

export type PlatformName = 'darwin' | 'linux' | 'win32'

/**
 * Represents a typical browser to try to detect and turn into a `FoundBrowser`.
 */
export type Browser = {
  /** short browser name */
  name: BrowserName
  family: BrowserFamily
  /** Optional display name */
  displayName: string
  /** RegExp to use to extract version from something like "Google Chrome 58.0.3029.110" */
  versionRegex: RegExp
  profile: boolean
  /** A single binary name or array of binary names for this browser. Not used on Windows. */
  binary: string | string[]
}

/**
 * Represents a real browser that exists on the user's system.
 */
export type FoundBrowser = Browser & {
  name: string
  path: string
  version: string
  majorVersion?: string
  /** user-supplied browser? */
  custom?: boolean
  /** optional info that will be shown in the GUI */
  info?: string
  /** optional warning that will be shown in the GUI */
  warning?: string
}

// all common type definition for this module

export type NotInstalledError = Error & { notInstalled: boolean }

export type NotDetectedAtPathError = Error & { notDetectedAtPath: boolean }

export type LauncherApi = {
  detect: (goalBrowsers?: Browser[]) => Bluebird<FoundBrowser[]>
  detectByPath: (
    path: string,
    goalBrowsers?: Browser[]
  ) => Promise<FoundBrowser>
  launch: (browser: FoundBrowser, url: string, args: string[]) => ChildProcess
}
