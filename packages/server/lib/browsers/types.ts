import type { FoundBrowser, BrowserLaunchOpts, BrowserNewTabOpts } from '@packages/types'
import type { EventEmitter } from 'events'
import type { Automation } from '../automation'

export type Browser = FoundBrowser & {
  majorVersion: number
  isHeadless: boolean
  isHeaded: boolean
}

export type BrowserInstance = EventEmitter & {
  kill: () => void
  pid: number
  /**
   * After `.open`, this is set to the `Browser` used to launch this instance.
   * TODO: remove need for this
   */
  browser?: Browser
  /**
   * If set, the browser is currently in the process of exiting due to the parent process exiting.
   * TODO: remove need for this
   */
  isProcessExit?: boolean
}

export type BrowserLauncher = {
  open: (browser: Browser, url: string, options: BrowserLaunchOpts, automation: Automation) => Promise<BrowserInstance>
  connectToNewSpec: (browser: Browser, options: BrowserNewTabOpts, automation: Automation) => Promise<void>
  /**
   * Used in Cypress-in-Cypress tests to connect to the existing browser instance.
   */
  connectToExisting: (browser: Browser, options: BrowserLaunchOpts, automation: Automation) => void | Promise<void>
}
