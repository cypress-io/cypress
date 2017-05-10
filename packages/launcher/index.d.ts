// all common type definition for this module

type NotInstalledError = Error & {notInstalled: boolean}

type BrowserNotFoundError = Error & {specificBrowserNotFound: boolean}

interface ExtraLauncherMethods {
  update: Function,
  detect: Function
}

type LauncherLaunch = (browsers?: any[]) => Promise<any>

type LauncherApi = LauncherLaunch & ExtraLauncherMethods
