import type { ChildProcess } from 'child_process'
import type Bluebird from 'bluebird'
import type { Browser, FoundBrowser } from '@packages/types'

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
