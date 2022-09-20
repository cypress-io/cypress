import type { FoundBrowser } from './browser'
import type { ReceivedCypressOptions } from './config'
import type { PlatformName } from './platform'
import type { RunModeVideoApi } from './video'

export type OpenProjectLaunchOpts = {
  projectRoot: string
  shouldLaunchNewTab: boolean
  automationMiddleware: AutomationMiddleware
  videoApi?: RunModeVideoApi
  onWarning: (err: Error) => void
  onError: (err: Error) => void
}

export type BrowserLaunchOpts = {
  browsers: FoundBrowser[]
  browser: FoundBrowser & { isHeadless: boolean }
  url: string | undefined
  proxyServer: string
  isTextTerminal: boolean
  onBrowserClose?: (...args: unknown[]) => void
  onBrowserOpen?: (...args: unknown[]) => void
} & Partial<OpenProjectLaunchOpts> // TODO: remove the `Partial` here by making it impossible for openProject.launch to be called w/o OpenProjectLaunchOpts
& Pick<ReceivedCypressOptions, 'userAgent' | 'proxyUrl' | 'socketIoRoute' | 'chromeWebSecurity' | 'downloadsFolder' | 'experimentalSessionAndOrigin' | 'experimentalModifyObstructiveThirdPartyCode' | 'experimentalWebKitSupport'>

export type BrowserNewTabOpts = { onInitializeNewBrowserTab: () => void } & BrowserLaunchOpts

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
  onAfterResponse?: ((eventName: string, data: any, resp: any) => void) | null
}

type WebSocketOptionsCallback = (...args: any[]) => any

export interface OpenProjectLaunchOptions {
  args?: LaunchArgs
  /**
   * Whether to skip the plugin initialization, useful when
   * we're using Cypress to test Cypress
   */
  skipPluginInitializeForTesting?: boolean

  configFile?: string

  // spec pattern to use when launching from CLI
  spec?: string

  // Callback to reload the Desktop GUI when cypress.config.{js,ts,mjs,cjs} is changed.
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
