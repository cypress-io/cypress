import type { FoundBrowser } from '@packages/types'
import { Bundler, BUNDLER, FrontendFramework, WizardStep } from '..'

interface AppDataShape {
  browsers: ReadonlyArray<FoundBrowser> | null
  projects: unknown[]
  activeProject: unknown
  isInGlobalMode: boolean
}

interface WizardDataShape {
  history: WizardStep[]
  currentStep: WizardStep
  chosenBundler: Bundler | null
  allBundlers: ReadonlyArray<Bundler>
  chosenFramework: FrontendFramework | null
  chosenManualInstall: boolean
}

interface CoreDataShape {
  app: AppDataShape
  wizard: WizardDataShape
}

// All state for the app should live here for now
export const coreDataShape: CoreDataShape = {
  app: {
    browsers: null,
    projects: [],
    activeProject: null,
    isInGlobalMode: false,
  },
  wizard: {
    chosenBundler: null,
    chosenFramework: null,
    chosenManualInstall: false,
    currentStep: 'welcome',
    allBundlers: BUNDLER,
    history: ['welcome'],
  },
}

export function setCoreData () {}
