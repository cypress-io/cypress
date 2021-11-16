import { BUNDLERS, FoundBrowser, BrowserWarning, FoundSpec, FullConfig, Preferences } from '@packages/types'
import type { NexusGenEnums, TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
import type { BrowserWindow } from 'electron'
import type { ChildProcess } from 'child_process'

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

export interface ConfigChildProcessShape {
  process: ChildProcess
  executedPlugins: null | 'e2e' | 'ct'
}

export interface ActiveProjectShape extends ProjectShape {
  title: string
  ctPluginsInitialized: Maybe<boolean>
  e2ePluginsInitialized: Maybe<boolean>
  isCTConfigured: Maybe<boolean>
  isE2EConfigured: Maybe<boolean>
  specs?: FoundSpec[]
  config: Promise<FullConfig> | null
  configChildProcess: ConfigChildProcessShape | null
  preferences?: Preferences| null
  browsers: FoundBrowser[] | null
}

export interface AppDataShape {
  browsers: ReadonlyArray<FoundBrowser> | null
  projects: ProjectShape[]
  currentTestingType: Maybe<TestingTypeEnum>
  refreshingBrowsers: Promise<FoundBrowser[]> | null
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
  browserWarning: BrowserWarning | null
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
  baseError: BaseErrorDataShape | null
  dev: DevStateShape
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
export function makeCoreData (): CoreDataShape {
  return {
    baseError: null,
    dev: {
      refreshState: null,
    },
    app: {
      currentTestingType: null,
      refreshingBrowsers: null,
      browsers: null,
      projects: [],
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
      browserWarning: null,
    },
    user: null,
    electron: {
      browserWindow: null,
    },
  }
}
