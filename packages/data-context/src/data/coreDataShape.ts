import type { App, BrowserWindow } from 'electron'
import type { TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
import type { ChildProcess } from 'child_process'
import path from 'path'
import type { AllowedState, CypressErrorIdentifier, Editor, Ensure, FoundBrowser, FullConfig, LaunchArgs, Preferences } from '@packages/types'
import { Draft, Immutable, Patch, castDraft } from 'immer'
import fs from 'fs'

import type { LoadingState } from '../util'
import type { LoadingManager } from './LoadingManager'
import type { ProjectWatcher } from './ProjectWatcher'
import type { CurrentProjectDataSource } from '../sources'
import type { LegacyOpenProjectShape } from '../actions'

type Handler<T> = (val: T, ...rest: any[]) => any
type Handler2<A, B> = (val: A, val2: B) => any

export interface EventRegistration {
  event: string
  eventId: string
}

export type RegisteredEvents = Record<string, Function>

export interface ConfigIpc {
  send(event: 'load'): boolean
  send(event: 'plugins', testingType: TestingTypeEnum, config: Immutable<Cypress.ConfigOptions>): boolean
  send(event: 'execute:plugins', evt: string, ids: {eventId: string, invocationId: string}, args: any[]): boolean
  on(evt: `promise:fulfilled:${string}`, fn: Function): boolean
  on(evt: 'loaded', fn: Handler<Immutable<Cypress.ConfigOptionsIpcResponse>>): any
  on(evt: 'load:error', fn: Handler<CypressErrorIdentifier>): any
  on(evt: 'load:error:plugins', fn: Handler<CypressErrorIdentifier>): any
  on(evt: 'loaded:plugins', fn: Handler2<Cypress.ResolvedConfigOptions, EventRegistration[]>): any
  on(evt: 'empty:plugins', fn: Handler<undefined>): any
  removeListener(event: string, listener: Function): any
}

export type PluginIpcHandler = (ipc: ConfigIpc) => void

export type Maybe<T> = T | null | undefined

export type CurrentProjectShape = CurrentProjectDataSource

export type DevStatePatchShape = Patch & {
  index: number
}

export interface ApplicationErrorShape {
  title?: string
  message: string
  stack?: string
}

export interface AuthenticatedUserShape {
  name?: string
  email?: string
  authToken?: string
}

export interface ProjectShape {
  projectRoot: string
}

export interface DevStateShape {
  refreshState: null | string
}

export type LocalSettingsDataShape = Immutable<{
  availableEditors: Editor[]
  preferences: AllowedState
}>

export interface WarningShape {
  title: string
  message: string
}

export interface ConfigChildProcessShape {
  /**
   * Child process executing the config & sourcing plugin events.
   * A function so we don't serialize this
   */
  process: () => ChildProcess
  /**
   * The faux IPC interface established with the config / plugin event child process
   */
  ipc: ConfigIpc
  /**
   * Keeps track of which plugins we have executed in the current config process
   */
  executedPlugins: null | 'component' | 'e2e'
  /**
   * Config from the initial module.exports
   */
  baseConfigPromise: Promise<Immutable<Cypress.ConfigOptionsIpcResponse>>
  /**
   * All registered events from the Plugin layer
   */
  registeredEvents: Record<string, Function>
}

export type CurrentProjectDataShape = Immutable<{
  /**
   * The port for the currently running server associated with the project
   */
  serverPort: number | null
  /**
   * The directory on the filesystem containing the cypress.config.{js,ts} file
   */
  projectRoot: string
  /**
   * The path to the config file on the disk. The presence of this indicates that
   * this project has a loadable config file that we can execute
   */
  configFile: string | null
  /**
   * The path to the cypress.env.json file on the disk, if one exists
   */
  configEnvFile: LoadingState<Cypress.ConfigOptions | null>
  /**
   * A list of config files that we see. We expect this to be an array of length 1
   * in a good config. Otherwise it's considered a warning
   */
  configFiles: string[]
  /**
   * Title of the project is the "basename" of the project
   */
  title: string
  /**
   * The "current testing type" chosen for the project
   */
  currentTestingType: TestingTypeEnum | null
  /**
   * the --browser flag, if specified by the CLI via LaunchArgs
   */
  cliBrowser: string | null
  /**
   * The events that have been registered on the plugin
   */
  pluginRegistry: RegisteredEvents | null
  /**
   * Any data associated with plugins
   */
  pluginDataProcess: null // TODO
  /**
   * The exported value from cypress.config.{js|ts}
   */
  configFileContents: LoadingState<Cypress.ConfigOptionsIpcResponse>
  /**
   * Any config saved / sourced from the filesystem in open-mode
   */
  configAppState: LoadingState<object | null>
  /**
   * When we call the setupNodeEvents, we receive the user's updated config options, and the list of registered events
   */
  configSetupNodeEvents: LoadingState<{ result: Partial<Cypress.ResolvedConfigOptions> | null, registeredEvents: RegisteredEvents }>
  /**
   * The child process used for loading the config / executing the plugins,
   * kept as internal state so we can re-use the same child process for the
   * sourcing of initial config, and the loading of plugins
   */
  configChildProcess: ConfigChildProcessShape | null
  /**
   * Preferences loaded for the user
   */
  preferences: Preferences | null
  /**
   * Chosen browser for the current project
   */
  currentBrowser?: FoundBrowser | null
  /**
   * A watcher for files in the current project
   */
  watcher: ProjectWatcher | null
  /**
   * The legacy "Open Project" shape, will be removed soon
   */
  legacyOpenProject: LegacyOpenProjectShape | null
}>

export interface ElectronShape {
  app: App | null
  browserWindow: BrowserWindow | null
}

export interface BaseErrorDataShape {
  title?: string
  message: string
  stack?: string
}

export type CoreDataShape = Immutable<{
  /**
   * Set to guard against double-initializing the context
   */
  hasIntializedMode: 'open' | 'run' | null
  /**
   * If there is an unhandled error
   */
  globalError: ApplicationErrorShape | null
  /**
   * Any data associated with internal development processes
   */
  dev: DevStateShape
  /**
   * All of the browsers that we have found on the machine
   */
  machineBrowsers: LoadingState<FoundBrowser[]>
  /**
   * Local cache data
   */
  localSettings: LoadingState<LocalSettingsDataShape>
  /**
   * List of projects loaded from disk
   */
  globalProjects: LoadingState<string[]>
  /**
   *
   */
  currentProject: CurrentProjectDataShape | null
  /**
   *
   */
  user: AuthenticatedUserShape | null
  /**
   * Container type for the electron app / browser window
   */
  electron: ElectronShape
  /**
   *
   */
  isAuthBrowserOpened: boolean
  /**
   * Any warnings that have been
   */
  warnings: WarningShape[]
  /**
   * Path to the Node.JS executable we should use to source config / plugins events
   */
  userNodePath: string | null
  /**
   * Version of the Node.JS executable we are using to source config / plugin events
   */
  userNodeVersion: string | null
  /**
   * Options passed through the CLI flag
   */
  cliConfig: Cypress.ConfigOptions
  /**
   * Derived state, from the updates in other keys
   */
  derived: {
    /**
     * Options sent to the "setupNodeEvents", re-derived everytime one of the sources feeding into the config changes.
     * Set to "null" if there isn't a current project
     */
    setupNodeEventsConfig: Cypress.ConfigOptions | null
    /**
     * The "config" for starting the server, which provides us with the
     * port necessary to
     */
    configForServerStart: Cypress.ConfigOptions | null
    /**
     * The "full" config, re-derived everytime one of the sources feeding into the config changes
     * Set to "null" if all of the sources for the config haven't been loaded yet
     */
    fullConfig: FullConfig | null
  }
}>

export function makeCurrentProject (launchArgs: Partial<LaunchArgs> = {}, loadingManager: LoadingManager): Draft<CurrentProjectDataShape> | null {
  if (launchArgs.global || !launchArgs.projectRoot) {
    return null
  }

  return {
    serverPort: null,
    cliBrowser: null,
    title: path.basename(launchArgs.projectRoot),
    projectRoot: launchArgs.projectRoot,
    currentTestingType: launchArgs.testingType ?? null,
    preferences: null,
    configAppState: castDraft(loadingManager.configAppState.getState()),
    configEnvFile: castDraft(loadingManager.projectEnvConfig.getState()),
    configSetupNodeEvents: castDraft(loadingManager.setupNodeEvents.getState()),
    configFileContents: castDraft(loadingManager.projectConfig.getState()),
    configChildProcess: null,
    pluginRegistry: null,
    pluginDataProcess: null,
    watcher: null,
    legacyOpenProject: null,
    ...sourceProjectFilePaths(launchArgs as LaunchArgs),
  }
}

/**
 * All state for the app should live here for now
 */
export function makeCoreData (launchArgs: Partial<LaunchArgs> = {}, loadingManager: LoadingManager): Immutable<CoreDataShape> {
  return {
    globalError: null,
    hasIntializedMode: null,
    dev: {
      refreshState: null,
    },
    machineBrowsers: loadingManager.machineBrowsers.getState(),
    localSettings: loadingManager.localSettings.getState(),
    globalProjects: loadingManager.globalProjects.getState(),
    isAuthBrowserOpened: false,
    currentProject: makeCurrentProject(launchArgs, loadingManager),
    warnings: [],
    user: null,
    electron: {
      app: null,
      browserWindow: null,
    },
    userNodePath: null,
    userNodeVersion: null,
    cliConfig: {},
    derived: {
      fullConfig: null,
      configForServerStart: null,
      setupNodeEventsConfig: null,
    },
  }
}

// Synchronously check config file paths. This is done synchronously here because these are:
// - very few / quick file lookups
// - simpler than forcing this fn & callers to be async
// - typically done infrequently / paired with loading the config which takes awhile relative to the sync access
export function sourceProjectFilePaths (launchArgs: Ensure<LaunchArgs, 'projectRoot'>) {
  const possibleConfigFiles = ['cypress.config.ts', 'cypress.config.js', 'cypress.json']

  let configFile: string | null = null
  const configFiles: string[] = []

  for (const file of possibleConfigFiles) {
    const filePath = path.join(launchArgs.projectRoot, file)

    if (fs.existsSync(filePath)) {
      configFiles.push(filePath)
      if (!configFile && file !== 'cypress.json') {
        configFile = filePath
      }
    }
  }

  return {
    configFile,
    configFiles,
  }
}
