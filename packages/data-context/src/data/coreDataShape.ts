import { BUNDLERS, FoundBrowser, FoundSpec, ResolvedFromConfig, StorybookFile } from '@packages/types'
import type { NexusGenEnums, TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'

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
}

export interface AppDataShape {
  navItem: NexusGenEnums['NavItem']
  browsers: ReadonlyArray<FoundBrowser> | null
  projects: ProjectShape[]
  activeProject: ActiveProjectShape | null
  isInGlobalMode: boolean
  activeTestingType: Maybe<TestingTypeEnum>
}

export interface WizardDataShape {
  history: NexusGenEnums['WizardStep'][]
  currentStep: NexusGenEnums['WizardStep']
  chosenBundler: NexusGenEnums['SupportedBundlers'] | null
  allBundlers: typeof BUNDLERS
  chosenTestingType: NexusGenEnums['TestingTypeEnum'] | null
  chosenFramework: NexusGenEnums['FrontendFrameworkEnum'] | null
  chosenManualInstall: boolean
  chosenBrowser: FoundBrowser | null
  generatedSpec: Omit<StorybookFile, 'content'> | null
}

export interface CoreDataShape {
  dev: DevStateShape
  app: AppDataShape
  wizard: WizardDataShape
  user: AuthenticatedUserShape | null
}

/**
 * All state for the app should live here for now
 */
export function makeCoreData (): CoreDataShape {
  return {
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
    },
    wizard: {
      chosenTestingType: null,
      chosenBundler: null,
      chosenFramework: null,
      chosenManualInstall: false,
      currentStep: 'welcome',
      allBundlers: BUNDLERS,
      history: ['welcome'],
      chosenBrowser: null,
      generatedSpec: null,
    },
    user: null,
  }
}
