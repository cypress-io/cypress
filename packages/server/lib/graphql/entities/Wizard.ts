import { nxs, NxsResult } from 'nexus-decorators'
import { BUNDLER, FrontendFramework, Bundler, FRONTEND_FRAMEWORK, TestingTypeEnum, WizardStepEnum, WIZARD_STEP, WizardStep, WIZARD_TITLES, WIZARD_DESCRIPTIONS, TESTING_TYPES, TestingType } from '../constants/WizardConstants'
import { TestingTypeInfo } from './TestingTypeInfo'
import { WizardBundler } from './WizardBundler'
import { WizardFrontendFramework } from './WizardFrontendFramework'

@nxs.objectType({
  description: 'The Wizard is a container for any state associated with initial onboarding to Cypress',
})
export class Wizard {
  private currentStep: WizardStep = 'welcome'
  private chosenTestingType: TestingType | null
  private chosenBundler: Bundler | null
  private chosenFramework: FrontendFramework | null

  constructor () {
    this.chosenTestingType = null
    this.chosenBundler = null
    this.chosenFramework = null
  }

  get framework (): FrontendFramework | null {
    return this.chosenFramework
  }

  get bundler (): Bundler | null {
    return this.chosenBundler
  }

  @nxs.field.string({
    description: 'The title of the page, given the current step of the wizard',
  })
  get title (): NxsResult<'Wizard', 'title'> {
    return WIZARD_TITLES[this.currentStep]
  }

  @nxs.field.string({
    description: 'The title of the page, given the current step of the wizard',
  })
  get description (): NxsResult<'Wizard', 'title'> {
    return WIZARD_DESCRIPTIONS[this.currentStep]
  }

  // GraphQL Fields:

  @nxs.field.type(() => WizardStepEnum)
  step (): NxsResult<'Wizard', 'step'> {
    return this.currentStep
  }

  @nxs.field.type(() => TestingTypeEnum, {
    description: 'The testing type we are setting in the wizard, null if this has not been chosen',
  })
  testingType (): NxsResult<'Wizard', 'testingType'> {
    return this.chosenTestingType
  }

  @nxs.field.list.nonNull.type(() => TestingTypeInfo)
  testingTypes (): NxsResult<'Wizard', 'testingTypes'> {
    return TESTING_TYPES.map((t) => new TestingTypeInfo(t))
  }

  @nxs.field.list.type(() => WizardFrontendFramework, {
    description: 'All of the component testing frameworks to choose from',
  })
  frameworks (): NxsResult<'Wizard', 'frameworks'> {
    return FRONTEND_FRAMEWORK.map((f) => new WizardFrontendFramework(f))
  }

  @nxs.field.list.type(() => WizardBundler, {
    description: 'All of the bundlers to choose from',
  })
  allBundlers (): NxsResult<'Wizard', 'allBundlers'> {
    return BUNDLER.map((bundler) => new WizardBundler(this, bundler))
  }

  // Internal Setters:

  setTestingType (testingType: TestingType | null): Wizard {
    this.chosenTestingType = testingType
    this.currentStep = 'selectFramework'

    return this
  }

  setFramework (framework: FrontendFramework): Wizard {
    this.chosenFramework = framework

    return this
  }

  setBundler (bundler?: Bundler | null): Wizard {
    this.chosenBundler = bundler ?? null

    return this
  }

  navigateBack (): Wizard {
    const idx = WIZARD_STEP.indexOf(this.currentStep)

    if (idx !== 0) {
      this.currentStep = WIZARD_STEP[idx - 1]
    }

    return this
  }

  navigateForward (): Wizard {
    const idx = WIZARD_STEP.indexOf(this.currentStep)

    if (idx !== WIZARD_STEP.length - 1) {
      this.currentStep = WIZARD_STEP[idx + 1]
    }

    return this
  }

  validateManualInstall (): Wizard {
    //
    return this
  }
}
