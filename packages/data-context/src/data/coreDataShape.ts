import { BUNDLERS, FoundBrowser, Editor, Warning, AllowedState, AllModeOptions, TestingType, PACKAGE_MANAGERS } from '@packages/types'
import type { NexusGenEnums, NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import type { App, BrowserWindow } from 'electron'
import type { ChildProcess } from 'child_process'
import type { SocketIOServer } from '@packages/socket'
import type { Server } from 'http'

export type Maybe<T> = T | null | undefined

export interface AuthenticatedUserShape {
  name?: string
  email?: string
  authToken?: string
}

export interface ProjectShape {
  projectRoot: string
  savedState?: SavedStateShape
}

export interface DevStateShape {
  refreshState: null | string
}

export interface LocalSettingsDataShape {
  refreshing: Promise<Editor[]> | null
  availableEditors: Editor[]
  preferences: AllowedState
}

export interface SavedStateShape {
  firstOpened?: number | null
  lastOpened?: number | null
  promptsShown?: object | null
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

export interface AppDataShape {
  isInGlobalMode: boolean
  browsers: ReadonlyArray<FoundBrowser> | null
  projects: ProjectShape[]
  refreshingBrowsers: Promise<FoundBrowser[]> | null
  refreshingNodePath: Promise<string> | null
  nodePath: Maybe<string>
  isBrowserOpen: boolean
}

export interface WizardDataShape {
  chosenBundler: NexusGenEnums['SupportedBundlers'] | null
  allBundlers: typeof BUNDLERS
  chosenFramework: NexusGenEnums['FrontendFrameworkEnum'] | null
  chosenLanguage: NexusGenEnums['CodeLanguageEnum']
  chosenManualInstall: boolean
}

export interface MigrationDataShape{
  // TODO: have the model of migration here
  step: NexusGenEnums['MigrationStepEnum']
}

export interface ElectronShape {
  app: App | null
  browserWindow: BrowserWindow | null
}

export interface BaseErrorDataShape {
  title?: string
  message: string
  stack?: string
}

export interface CoreDataShape {
  cliBrowser: string | null
  cliTestingType: string | null
  chosenBrowser: FoundBrowser | null
  machineBrowsers: Promise<FoundBrowser[]> | FoundBrowser[] | null
  servers: {
    appServer?: Maybe<Server>
    appServerPort?: Maybe<number>
    appSocketServer?: Maybe<SocketIOServer>
    gqlServer?: Maybe<Server>
    gqlServerPort?: Maybe<number>
    gqlSocketServer?: Maybe<SocketIOServer>
  }
  hasInitializedMode: 'run' | 'open' | null
  baseError: BaseErrorDataShape | null
  dev: DevStateShape
  localSettings: LocalSettingsDataShape
  app: AppDataShape
  currentProject: string | null
  currentTestingType: TestingType | null
  wizard: WizardDataShape
  migration: MigrationDataShape | null
  user: AuthenticatedUserShape | null
  electron: ElectronShape
  isAuthBrowserOpened: boolean
  scaffoldedFiles: NexusGenObjects['ScaffoldedFile'][] | null
  warnings: Warning[]
  packageManager: typeof PACKAGE_MANAGERS[number]
}

/**
 * All state for the app should live here for now
 */
export function makeCoreData (modeOptions: Partial<AllModeOptions> = {}): CoreDataShape {
  return {
    servers: {},
    cliBrowser: modeOptions.browser ?? null,
    cliTestingType: modeOptions.testingType ?? null,
    machineBrowsers: null,
    hasInitializedMode: null,
    baseError: null,
    dev: {
      refreshState: null,
    },
    app: {
      isInGlobalMode: Boolean(modeOptions.global),
      refreshingBrowsers: null,
      browsers: null,
      projects: [],
      refreshingNodePath: null,
      nodePath: modeOptions.userNodePath,
      isBrowserOpen: false,
    },
    localSettings: {
      availableEditors: [],
      preferences: {},
      refreshing: null,
    },
    isAuthBrowserOpened: false,
    currentProject: modeOptions.projectRoot ?? null,
    currentTestingType: modeOptions.testingType ?? null,
    wizard: {
      chosenBundler: null,
      chosenFramework: null,
      chosenLanguage: 'js',
      chosenManualInstall: false,
      allBundlers: BUNDLERS,
    },
    migration: {
      step: 'renameAuto',
    },
    warnings: [],
    chosenBrowser: null,
    user: null,
    electron: {
      app: null,
      browserWindow: null,
    },
    scaffoldedFiles: null,
    packageManager: 'npm',
  }
}
