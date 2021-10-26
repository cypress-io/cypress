import { BUNDLERS, FoundBrowser, FoundSpec, GeneratedSpec, Preferences, ResolvedFromConfig } from '@packages/types'
import type { NexusGenEnums, TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
import type { BrowserWindow } from 'electron'

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

export interface ActiveProjectShape extends ProjectShape {
  title: string
  ctPluginsInitialized: Maybe<boolean>
  e2ePluginsInitialized: Maybe<boolean>
  isFirstTimeCT: Maybe<boolean>
  isFirstTimeE2E: Maybe<boolean>
  currentSpecId?: Maybe<string>
  specs?: FoundSpec[]
  config: ResolvedFromConfig[]
  preferences?: Preferences| null
  generatedSpec: GeneratedSpec | null
}

export interface AppDataShape {
  navItem: NexusGenEnums['NavItem']
  browsers: ReadonlyArray<FoundBrowser> | null
  projects: ProjectShape[]
  activeProject: ActiveProjectShape | null
  isInGlobalMode: boolean
  isAuthBrowserOpened: boolean
  activeTestingType: Maybe<TestingTypeEnum>
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
  browserErrorMessage: string | null
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
  wizard: WizardDataShape
  user: AuthenticatedUserShape | null
  electron: ElectronShape
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
      activeTestingType: null,
      navItem: 'settings',
      browsers: null,
      projects: [],
      activeProject: null,
      isInGlobalMode: false,
      isAuthBrowserOpened: false,
    },
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
    },
    user: null,
    electron: {
      browserWindow: null,
    },
  }
}
