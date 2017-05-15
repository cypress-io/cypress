// all common type definition for this module

type NotInstalledError = Error & {notInstalled: boolean}

type BrowserNotFoundError = Error & {specificBrowserNotFound: boolean}

interface ExtraLauncherMethods {
  update: Function,
  detect: Function
}

type LauncherLaunch = (browsers?: any[]) => Promise<any>

type LauncherApi = LauncherLaunch & ExtraLauncherMethods

type Browser = {
  name: string,
  re: RegExp,
  profile: boolean,
  binary: string,
  executable: string,
  version?: string,
  majorVersion?: string,
  page?: string
}

// missing type definitions for 3rd party libraries
// https://glebbahmutov.com/blog/trying-typescript/#manual-types-for-3rd-party-libraries
declare module 'execa' {
  type ExecaResult = {
    stdout: string
  }
  interface Execa {
    shell: (cmd:string) => Promise<ExecaResult>
  }
  const execa: Execa
  export = execa
}

declare module 'plist' {
  interface Plist {
    parse: (s:string) => any
  }
  const plist: Plist
  export = plist
}
