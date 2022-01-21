import type { FoundBrowser } from './browser'
import type { PlatformName } from './platform'

export interface LaunchOpts {
  browser?: FoundBrowser
  url?: string
  automationMiddleware?: AutomationMiddleware
  projectRoot?: string
  onBrowserClose?: (...args: unknown[]) => void
  onBrowserOpen?: (...args: unknown[]) => void
  onError?: (err: Error) => void
}

export interface LaunchArgs {
  _: [string] // Cypress App binary location
  config: Record<string, unknown>
  cwd: string
  browser?: string
  configFile?: string
  // Global mode is triggered by CLI via `--global` or when there is no `projectRoot` (essentially when the Cypress Config file can't be found)
  global: boolean
  project: string // projectRoot
  /**
   * in run mode, the path of the project run
   * path is relative if specified with --project,
   * absolute if implied by current working directory
   */
  runProject?: string
  projectRoot: string // same as above
  testingType: Cypress.TestingType
  invokedFromCli: boolean
  runAllSpecsInSameBrowserSession?: boolean
  onError?: (error: Error) => void
  os: PlatformName
  exit?: boolean

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
  /**
   * Whether to skip the plugin initialization, useful when
   * we're using Cypress to test Cypress
   */
  skipPluginInitializeForTesting?: boolean

  configFile?: string | false

  // spec pattern to use when launching from CLI
  spec?: string

  // Callback to reload the Desktop GUI when cypress.config.{ts|js} is changed.
  onSettingsChanged?: false | (() => void)
  browsers?: FoundBrowser[]

  // Optional callbacks used for triggering events via the web socket
  onReloadBrowser?: WebSocketOptionsCallback
  onFocusTests?: WebSocketOptionsCallback
  onSpecChanged?: WebSocketOptionsCallback
  onSavedStateChanged?: WebSocketOptionsCallback
  onChange?: WebSocketOptionsCallback
  onError?: (err: Error) => void

  [key: string]: any
}

export interface AddProject {
  open?: boolean | null
  path: string
}
