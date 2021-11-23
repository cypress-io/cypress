import type { NexusGenEnums, TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
import type { BrowserWindow } from 'electron'
import type { ChildProcess } from 'child_process'
import path from 'path'
import type { ApplicationErrorSource } from '@packages/graphql/src/schemaTypes/objectTypes/gql-ApplicationError'
import { devicePreferenceDefaults, DevicePreferences, Editor, FoundBrowser, FullConfig, LaunchArgs, Preferences, Warning } from '@packages/types'

export type Maybe<T> = T | null | undefined

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

export interface LocalSettingsDataShape {
  refreshing: Promise<Editor[]> | null
  availableEditors: Editor[]
  preferences: DevicePreferences
}

export interface ConfigChildProcessShape {
  /**
   * Child process executing the config & sourcing plugin events
   */
  process: ChildProcess
  /**
   * Keeps track of which plugins we have executed in the current config process
   */
  executedPlugins: null | 'e2e' | 'ct'
  /**
   * Config from the initial module.exports
   */
  resolvedBaseConfig: Promise<Cypress.ConfigOptions>
}

export interface CurrentProjectShape extends ProjectShape {
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
   * Warning when the cliBrowser doesn't match up with the browsers
   * that are available after sourcing the config
   */
  browserErrorMessage?: string | null
  /**
   * Set to true while we are resolving the config
   */
  isLoadingConfig: boolean
  /**
   * Promise indicating the value of the loading config
   */
  isLoadingConfigPromise: Promise<FullConfig | null> | null
  /**
   * Set to true while we are loading the project's plugins
   */
  isLoadingPlugins: boolean
  /**
   * Set if there is an error loading the plugins
   */
  errorLoadingPlugins: BaseErrorDataShape | null
  /**
   * Captures an error found when sourcing the config
   */
  errorLoadingConfig: BaseErrorDataShape | null
  /**
   * The full config resolved for the project
   */
  config: FullConfig | null
  /**
   * The child process used for loading the config / executing the plugins
   */
  configChildProcess?: ConfigChildProcessShape | null
  /**
   * Preferences loaded for the user
   */
  preferences?: Preferences | null
  /**
   * All browsers loaded for this project, we get this after the plugins config is loaded
   * for the given testing type, since this value can be manipulated by that
   */
  browsers?: FoundBrowser[] | null
  /**
   * Chosen browser for the current project
   */
  currentBrowser?: FoundBrowser | null
}

export interface AppDataShape {
  isLoadingMachineBrowsers: boolean
  loadingMachineBrowsers: Promise<FoundBrowser[]> | null
  machineBrowsers: ReadonlyArray<FoundBrowser> | null
  refreshingNodePath: Promise<string> | null
  nodePath: string | null
}

export interface WizardDataShape {
  chosenBundler: NexusGenEnums['SupportedBundlers'] | null
  chosenFramework: NexusGenEnums['FrontendFrameworkEnum'] | null
  chosenLanguage: NexusGenEnums['CodeLanguageEnum']
  chosenManualInstall: boolean
}

export interface ElectronShape {
  browserWindow: BrowserWindow | null
}

export interface BaseErrorDataShape {
  title?: string
  message: string
  stack?: string
}

export interface CoreDataShape {
  globalError: ApplicationErrorSource | null
  dev: DevStateShape
  localSettings: LocalSettingsDataShape
  app: AppDataShape
  isLoadingGlobalProjects: boolean
  globalProjects: string[] | null
  currentProject: CurrentProjectShape | null
  wizard: WizardDataShape
  user: AuthenticatedUserShape | null
  electron: ElectronShape
  hasIntializedMode: 'open' | 'run' | null
  isAuthBrowserOpened: boolean
  warnings: Warning[]
}

function makeCurrentProject (launchArgs: LaunchArgs): CurrentProjectShape | null {
  if (launchArgs.global || !launchArgs.projectRoot) {
    return null
  }

  return {
    cliBrowser: null,
    title: path.basename(launchArgs.projectRoot),
    projectRoot: launchArgs.projectRoot,
    currentTestingType: launchArgs.testingType ?? null,
    isLoadingConfig: false,
    isLoadingConfigPromise: null,
    isLoadingPlugins: false,
    config: null,
    errorLoadingConfig: null,
    errorLoadingPlugins: null,
  }
}

/**
 * All state for the app should live here for now
 */
export function makeCoreData (launchArgs: LaunchArgs): CoreDataShape {
  return {
    globalError: null,
    hasIntializedMode: null,
    dev: {
      refreshState: null,
    },
    app: {
      isLoadingMachineBrowsers: false,
      loadingMachineBrowsers: null,
      machineBrowsers: null,
      refreshingNodePath: null,
      nodePath: null,
    },
    localSettings: {
      availableEditors: [],
      preferences: devicePreferenceDefaults,
      refreshing: null,
    },
    globalProjects: null,
    isLoadingGlobalProjects: false,
    isAuthBrowserOpened: false,
    currentProject: makeCurrentProject(launchArgs),
    wizard: {
      chosenBundler: null,
      chosenFramework: null,
      chosenLanguage: 'js',
      chosenManualInstall: false,
    },
    warnings: [],
    user: null,
    electron: {
      browserWindow: null,
    },
  }
}
