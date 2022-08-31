import type { FoundBrowser } from './browser'
import type { ReceivedCypressOptions } from './config'
import type { PlatformName } from './platform'

export type WriteVideoFrame = (data: Buffer) => void

export type VideoRecording = {
  info: VideoBrowserOpt
  controller?: VideoController
}

/**
 * Interface yielded by the browser to control video recording.
 */
export type VideoController = {
  /**
   * A function that resolves once the video is fully captured and flushed to disk.
   */
  endVideoCapture: () => Promise<void>
  /**
   * Timestamp of when the video capture started - used for chapter timestamps.
   */
  startedVideoCapture: Date
  /**
   * Used in single-tab mode to restart the video capture to a new file without relaunching the browser.
   */
  restart: () => Promise<void>
  writeVideoFrame: WriteVideoFrame
}

export type VideoBrowserOpt = {
  onError: (err: Error) => void
  videoName: string
  compressedVideoName?: string
  /**
   * Create+use a new VideoController that uses ffmpeg to stream frames from `writeVideoFrame` to disk.
   */
  newFfmpegVideoController: (opts?: { webmInput?: boolean}) => Promise<VideoController>
  /**
   * Register a non-ffmpeg video controller.
   */
  setVideoController: (videoController?: VideoController) => void
  /**
   * Registers a handler for project.on('capture:video:frames').
   */
  onProjectCaptureVideoFrames: (fn: (data: Buffer) => void) => void
}

export type OpenProjectLaunchOpts = {
  projectRoot: string
  shouldLaunchNewTab: boolean
  automationMiddleware: AutomationMiddleware
  writeVideoFrame?: WriteVideoFrame
  video?: VideoBrowserOpt
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
& Pick<ReceivedCypressOptions, 'userAgent' | 'proxyUrl' | 'socketIoRoute' | 'chromeWebSecurity' | 'downloadsFolder' | 'experimentalSessionAndOrigin' | 'experimentalModifyObstructiveThirdPartyCode'>

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
