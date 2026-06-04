import type { FoundBrowser } from './browser'
import type { ReceivedCypressOptions } from './config'
import type { PlatformName } from './platform'
import type { RunModeVideoApi } from './video'
import type { ProtocolManagerShape } from './protocol'
import type Protocol from 'devtools-protocol'
import type { SupportedKey } from './automation'

/**
 * Interface for compiler error location information
 * Used across error handling systems to provide file, line, and column details
 */
export interface CompilerErrorLocation {
  filePath: string
  line: number
  column: number
}

/**
 * Interface for wrapping child processes with EventEmitter functionality
 * Used by wrapIpc() to create a communication layer between parent and child processes
 * Provides send/receive capabilities while maintaining EventEmitter event handling
 */
export interface ProcessIpcWrapper {
  send: (event: string, ...args: any[]) => void
  on: (event: string, listener: (...args: any[]) => void) => any
  removeListener: (event: string, listener: (...args: any[]) => void) => any
}

/**
 * Interface for errors that can occur during file transformation/compilation
 * Covers TransformError (tsx) and esbuild errors with location information
 */
export interface TransformError extends Error {
  name: string
  message: string
  errors?: Array<{
    location?: {
      file: string
      line: number
      column: number
    }
  }>
}

/**
 * Interface for errors that can occur during file preprocessing
 * These are typically compilation errors, file system errors, or plugin execution errors
 * Used across preprocessor packages and error handling systems
 */
export interface PreprocessorError extends Error {
  stack?: string
  annotated?: string
  message: string
  filePath?: string
  originalStack?: string
}

/**
 * Interface for IPC handlers that can send and receive messages
 * Used by plugin handlers to communicate with the main process
 */
export interface PluginIpcHandler {
  send: (event: string, ...args: any[]) => boolean
  on: (event: string, listener: (...args: any[]) => void) => this
}

export type OpenProjectLaunchOpts = {
  projectRoot: string
  shouldLaunchNewTab: boolean
  automationMiddleware: AutomationMiddleware
  videoApi?: RunModeVideoApi
  onWarning: (err: Error) => void
  onError: (err: Error) => void
  protocolManager?: ProtocolManagerShape
}

export type BrowserLaunchOpts = {
  browsers: FoundBrowser[]
  browser: FoundBrowser & { isHeadless: boolean }
  url: string | undefined
  proxyServer: string
  isTextTerminal: boolean
  onBrowserClose?: (...args: unknown[]) => void
  onBrowserOpen?: (...args: unknown[]) => void
  relaunchBrowser?: () => Promise<any>
  protocolManager?: ProtocolManagerShape
} & Partial<OpenProjectLaunchOpts> // TODO: remove the `Partial` here by making it impossible for openProject.launch to be called w/o OpenProjectLaunchOpts
& Pick<ReceivedCypressOptions, 'userAgent' | 'proxyUrl' | 'socketIoRoute' | 'chromeWebSecurity' | 'downloadsFolder' | 'experimentalModifyObstructiveThirdPartyCode' | 'experimentalWebKitSupport'>

export type BrowserNewTabOpts = { onInitializeNewBrowserTab: () => void } & BrowserLaunchOpts

export interface LaunchArgs {
  _: [string] // Cypress App binary location
  config: Record<string, unknown>
  cwd: string
  emitWhenReady?: boolean
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
  runnerUi?: boolean

  onFocusTests?: () => any
}

type NullableMiddlewareHook = ((message: unknown, data: unknown) => void) | null
interface CommandSignature<P = any, R = any> {
  dataType: P
  returnType: R
}
export interface KeyPressParams {
  key: SupportedKey
}

export interface AutomationCommands {
  'take:screenshot': CommandSignature
  'get:cookies': CommandSignature
  'get:cookie': CommandSignature
  'set:cookie': CommandSignature
  'set:cookies': CommandSignature
  'add:cookies': CommandSignature
  'clear:cookies': CommandSignature
  'clear:cookie': CommandSignature
  'change:cookie': CommandSignature
  'create:download': CommandSignature
  'canceled:download': CommandSignature
  'complete:download': CommandSignature
  'get:heap:size:limit': CommandSignature
  'collect:garbage': CommandSignature
  'reset:browser:tabs:for:next:spec': CommandSignature
  'reset:browser:state': CommandSignature
  'focus:browser:window': CommandSignature
  'is:automation:client:connected': CommandSignature
  'remote:debugger:protocol': CommandSignature
  'response:received': CommandSignature
  'key:press': CommandSignature<KeyPressParams, void>
  'perform:user:gesture': CommandSignature<Record<string, never>, void>
  'get:aut:url': CommandSignature<void, string>
  'reload:aut:frame': CommandSignature<{ forceReload: boolean }, void>
  'navigate:aut:history': CommandSignature<{ historyNumber: number }, void>
  'get:aut:title': CommandSignature<void, string>
}

export type OnRequestEvent = <T extends keyof AutomationCommands>(message: T, data: AutomationCommands[T]['dataType']) => Promise<AutomationCommands[T]['returnType']>

export type OnServiceWorkerRegistrationUpdated = (data: Protocol.ServiceWorker.WorkerRegistrationUpdatedEvent) => void

export type OnServiceWorkerVersionUpdated = (data: Protocol.ServiceWorker.WorkerVersionUpdatedEvent) => void

export type OnServiceWorkerClientSideRegistrationUpdated = (data: { scriptURL: string, initiatorOrigin: string }) => void

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

  // Manager used to communicate with the Cloud protocol
  protocolManager?: ProtocolManagerShape

  [key: string]: any
}

export interface AddProject {
  open?: boolean | null
  path: string
}
