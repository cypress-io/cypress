import { ChildProcess } from 'child_process'
import * as Bluebird from 'bluebird'

// TODO: some of these types can be combined with cli/types/index.d.ts

type BrowserName = 'electron' | 'chrome' | 'chromium' | 'firefox' | string

type BrowserChannel = 'stable' | 'canary' | 'beta' | 'dev' | 'nightly' | string

type BrowserFamily = 'chromium' | 'firefox'

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
}

/**
 * Partial browser object, returned by an OS-specific launcher helper.
 */
export type DetectedBrowser = Pick<FoundBrowser, 'name' | 'path' | 'version'>

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

export type PathData = {
  path: string
  browserKey?: string
}
