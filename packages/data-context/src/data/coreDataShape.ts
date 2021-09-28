import { BUNDLERS, FoundBrowser, FoundSpec } from '@packages/types'
import type { NexusGenEnums } from '@packages/graphql/src/gen/nxs.gen'

type Maybe<T> = T | null | undefined

export interface AuthenticatedUserShape {
  name?: string
  email?: string
  authToken?: string
}

export interface ProjectShape {
  projectRoot: string
}

export interface ActiveProjectShape extends ProjectShape {
  title: string
  ctPluginsInitialized: Maybe<boolean>
  e2ePluginsInitialized: Maybe<boolean>
  isFirstTimeCT: Maybe<boolean>
  isFirstTimeE2E: Maybe<boolean>
  specs?: FoundSpec[]
}

export interface AppDataShape {
  navItem: NexusGenEnums['NavItem']
  browsers: ReadonlyArray<FoundBrowser> | null
  projects: ProjectShape[]
  activeProject: ActiveProjectShape | null
  isInGlobalMode: boolean
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
}

export interface CoreDataShape {
  app: AppDataShape
  wizard: WizardDataShape
  user: AuthenticatedUserShape | null
}

/**
 * All state for the app should live here for now
 */
export function makeCoreData (): CoreDataShape {
  return {
    app: {
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
    },
    user: null,
  }
}
