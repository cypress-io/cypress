export type Browser = {
  name: string,
  re: RegExp,
  profile: boolean,
  binary: string,
  executable: string,
  version?: string,
  majorVersion?: string,
  page?: string
}

interface ExtraLauncherMethods {
  update: Function,
  detect: Function
}

type LauncherLaunch = (browsers?: any[]) => Promise<any>

export type LauncherApi = LauncherLaunch & ExtraLauncherMethods

// all common type definition for this module

export type NotInstalledError = Error & {notInstalled: boolean}

export type BrowserNotFoundError = Error & {specificBrowserNotFound: boolean}
