import type { Browser, FoundBrowser, PlatformName } from './browser'

export interface LaunchOpts {
  browser?: FoundBrowser
  url?: string
  automationMiddleware?: AutomationMiddleware
  onBrowserClose?: (...args: unknown[]) => void
  onError?: (err: Error) => void
}

export interface LaunchArgs {
  _: [string] // Cypress App binary location
  config: Record<string, unknown>
  cwd: string
  browser: Browser
  configFile?: string
  // Global mode is triggered by CLI via `--global` or when there is no `projectRoot` (essentially when the Cypress Config file can't be found)
  global?: boolean
  project: string // projectRoot
  projectRoot: string // same as above
  testingType: Cypress.TestingType
  invokedFromCli: boolean
  os: PlatformName

  onFocusTests?: () => any
}

type NullableMiddlewareHook = (() => void) | null

export type OnRequestEvent = (eventName: string, data: any) => void

export interface AutomationMiddleware {
  onPush?: NullableMiddlewareHook
  onBeforeRequest?: OnRequestEvent | null
  onRequest?: OnRequestEvent | null
  onResponse?: NullableMiddlewareHook
  onAfterResponse?: NullableMiddlewareHook
}

type WebSocketOptionsCallback = (...args: any[]) => any

export interface OpenProjectLaunchOptions {
  args?: LaunchArgs

  configFile?: string | boolean
  browsers?: Cypress.Browser[]

  // Callback to reload the Desktop GUI when cypress.json is changed.
  onSettingsChanged?: false | (() => void)

  // Optional callbacks used for triggering events via the web socket
  onReloadBrowser?: WebSocketOptionsCallback
  onFocusTests?: WebSocketOptionsCallback
  onSpecChanged?: WebSocketOptionsCallback
  onSavedStateChanged?: WebSocketOptionsCallback
  onChange?: WebSocketOptionsCallback

  [key: string]: any
}
