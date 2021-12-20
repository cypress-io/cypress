import { BUNDLERS, FoundBrowser, FoundSpec, FullConfig, Preferences, Editor, Warning, AllowedState, AllModeOptions } from '@packages/types'
import type { NexusGenEnums, TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
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
}

export interface DevStateShape {
  refreshState: null | string
}

export interface LocalSettingsDataShape {
  refreshing: Promise<Editor[]> | null
  availableEditors: Editor[]
  preferences: AllowedState
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

export interface ActiveProjectShape extends ProjectShape {
  title: string
  ctPluginsInitialized: Maybe<boolean>
  e2ePluginsInitialized: Maybe<boolean>
  isCTConfigured: Maybe<boolean>
  isE2EConfigured: Maybe<boolean>
  specs?: FoundSpec[]
  config: Promise<FullConfig> | null
  configChildProcess?: ConfigChildProcessShape | null
  preferences?: Preferences | null
  browsers: FoundBrowser[] | null
  isMissingConfigFile: boolean
}

export interface AppDataShape {
  isInGlobalMode: boolean
  browsers: ReadonlyArray<FoundBrowser> | null
  projects: ProjectShape[]
  currentTestingType: Maybe<TestingTypeEnum>
  refreshingBrowsers: Promise<FoundBrowser[]> | null
  refreshingNodePath: Promise<string> | null
  nodePath: Maybe<string>
}

export interface WizardDataShape {
  history: NexusGenEnums['WizardStep'][]
  currentStep: NexusGenEnums['WizardStep']
  chosenBundler: NexusGenEnums['SupportedBundlers'] | null
  allBundlers: typeof BUNDLERS
  chosenTestingType: NexusGenEnums['TestingTypeEnum'] | null
  chosenFramework: NexusGenEnums['FrontendFrameworkEnum'] | null
  chosenLanguage: NexusGenEnums['CodeLanguageEnum']
  chosenManualInstall: boolean
  chosenBrowser: FoundBrowser | null
  warnings: Warning[]
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
  currentProject: ActiveProjectShape | null
  wizard: WizardDataShape
  user: AuthenticatedUserShape | null
  electron: ElectronShape
  isAuthBrowserOpened: boolean
}

/**
 * All state for the app should live here for now
 */
export function makeCoreData (modeOptions: Partial<AllModeOptions> = {}): CoreDataShape {
  return {
    servers: {},
    hasInitializedMode: null,
    baseError: null,
    dev: {
      refreshState: null,
    },
    app: {
      isInGlobalMode: Boolean(modeOptions.global),
      currentTestingType: null,
      refreshingBrowsers: null,
      browsers: null,
      projects: [],
      refreshingNodePath: null,
      nodePath: modeOptions.userNodePath,
    },
    localSettings: {
      availableEditors: [],
      preferences: {},
      refreshing: null,
    },
    isAuthBrowserOpened: false,
    currentProject: null,
    wizard: {
      chosenTestingType: null,
      chosenBundler: null,
      chosenFramework: null,
      chosenLanguage: 'js',
      chosenManualInstall: false,
      currentStep: 'welcome',
      allBundlers: BUNDLERS,
      history: ['welcome'],
      chosenBrowser: null,
      warnings: [],
    },
    user: null,
    electron: {
      app: null,
      browserWindow: null,
    },
  }
}
