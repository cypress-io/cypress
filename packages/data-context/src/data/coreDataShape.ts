import type { App, BrowserWindow } from 'electron'
import type { TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
import type { ChildProcess } from 'child_process'
import path from 'path'
import type { AllowedState, Editor, Ensure, FoundBrowser, FullConfig, LaunchArgs, Preferences } from '@packages/types'
import type { Draft, Immutable, Patch } from 'immer'
import fs from 'fs'

import type { LoadingState } from '../util'
import type { LoadingManager } from './LoadingManager'
import type { ProjectWatcher } from './ProjectWatcher'

export type Maybe<T> = T | null | undefined

export type DevStatePatchShape = Patch

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
  setupStep?: string
}

export interface IpcShape {

}

export interface ConfigChildProcessShape {
  /**
   * Child process executing the config & sourcing plugin events
   */
  process: ChildProcess
  /**
   * The faux IPC interface established with the config / plugin event child process
   */
  ipc: IpcShape
  /**
   * Keeps track of which plugins we have executed in the current config process
   */
  executedPlugins: null | 'e2e' | 'ct'
  /**
   * Config from the initial module.exports
   */
  baseConfigPromise: Promise<Cypress.ConfigOptions>
}

export type CurrentProjectShape = Immutable<{
  /**
   * The directory on the filesystem containing the cypress.config.{js,ts} file
   */
  projectRoot: string
  /**
   * The path to the config file on the disk. The presence of this indicates that
   * this project has exists
   */
  configFile: string | null
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
  currentTestingType: Maybe<TestingTypeEnum>
  /**
   * the --browser flag, if specified by the CLI via LaunchArgs
   */
  cliBrowser: string | null
  /**
   * When we call the plugin, we get back the final config
   */
  pluginLoad: LoadingState<FullConfig>
  /**
   * Any data associated with plugins
   */
  pluginDataProcess: null // TODO
  /**
   * The full config resolved for the project
   */
  config: LoadingState<FullConfig>
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
   * All browsers loaded for this project, we get this after the plugins config is loaded
   * for the given testing type, since this value can be manipulated by that
   */
  browsers?: FoundBrowser[] | null
  /**
   * Chosen browser for the current project
   */
  currentBrowser?: FoundBrowser | null
  /**
   * A watcher for files in the current project
   */
  watcher: ProjectWatcher | null
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
  currentProject: CurrentProjectShape | null
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
}>

export function makeCurrentProject (launchArgs: Partial<LaunchArgs> = {}, loadingManager: LoadingManager): Draft<CurrentProjectShape> | null {
  if (launchArgs.global || !launchArgs.projectRoot) {
    return null
  }

  return {
    cliBrowser: null,
    title: path.basename(launchArgs.projectRoot),
    projectRoot: launchArgs.projectRoot,
    currentTestingType: launchArgs.testingType ?? null,
    preferences: null,
    configChildProcess: null,
    config: loadingManager.projectConfig.getState(),
    pluginLoad: loadingManager.projectEventSetup.getState(),
    pluginDataProcess: null,
    watcher: null,
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
  }
}

// Synchronously check config file paths. This is done synchronously here
// because these are:
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
